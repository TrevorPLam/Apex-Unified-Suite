---
name: materialized-column-update
description: Implement safe materialized counter updates inside database transactions to maintain aggregate data consistency when child records are modified.
---

# Materialized Column Update Implementation

## Overview

This skill guides the implementation of a robust system for updating materialized aggregate columns (counters, totals, percentages) in the same database transaction that modifies child records, ensuring data consistency and preventing race conditions.

## Core Architecture

### 1. Database Schema Patterns

#### Example: Project with Task Counters
```sql
-- Parent table with materialized columns
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Materialized counters
  task_count INTEGER NOT NULL DEFAULT 0,
  completed_task_count INTEGER NOT NULL DEFAULT 0,
  progress_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN task_count > 0 THEN (completed_task_count * 100.0 / task_count)
      ELSE 0
    END
  ) STORED,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Child table that triggers counter updates
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
```

### 2. Materialized Column Update Service

```typescript
// src/services/MaterializedColumnService.ts
import { Database } from 'drizzle-orm';
import { sql, eq, and } from 'drizzle-orm';
import { MaterializedUpdateError } from '../domain/errors';

export interface CounterUpdate {
  table: string;
  idColumn: string;
  id: string;
  counters: CounterField[];
}

export interface CounterField {
  column: string;
  operation: 'increment' | 'decrement' | 'set' | 'recalculate';
  value?: number;
  condition?: string; // SQL WHERE condition for conditional updates
}

export class MaterializedColumnService {
  constructor(private db: Database) {}

  /**
   * Execute atomic counter updates within a transaction
   */
  async updateCounters(
    updates: CounterUpdate[],
    tenantId: string,
    operationContext?: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      for (const update of updates) {
        await this.executeUpdate(tx, update, tenantId, operationContext);
      }
    });
  }

  /**
   * Update project counters when tasks are modified
   */
  async updateProjectTaskCounters(
    projectId: string,
    tenantId: string,
    operation: 'task_created' | 'task_updated' | 'task_deleted' | 'tasks_bulk_updated',
    taskData?: any
  ): Promise<void> {
    const updates: CounterUpdate[] = [];

    switch (operation) {
      case 'task_created':
        updates.push({
          table: 'projects',
          idColumn: 'id',
          id: projectId,
          counters: [
            {
              column: 'task_count',
              operation: 'increment',
              value: 1
            },
            {
              column: 'completed_task_count',
              operation: 'increment',
              value: taskData?.status === 'completed' ? 1 : 0
            }
          ]
        });
        break;

      case 'task_updated':
        if (taskData?.oldStatus && taskData?.newStatus) {
          // Handle completion status change
          if (taskData.oldStatus !== 'completed' && taskData.newStatus === 'completed') {
            updates.push({
              table: 'projects',
              idColumn: 'id',
              id: projectId,
              counters: [
                {
                  column: 'completed_task_count',
                  operation: 'increment',
                  value: 1
                }
              ]
            });
          } else if (taskData.oldStatus === 'completed' && taskData.newStatus !== 'completed') {
            updates.push({
              table: 'projects',
              idColumn: 'id',
              id: projectId,
              counters: [
                {
                  column: 'completed_task_count',
                  operation: 'decrement',
                  value: 1
                }
              ]
            });
          }
        }
        break;

      case 'task_deleted':
        updates.push({
          table: 'projects',
          idColumn: 'id',
          id: projectId,
          counters: [
            {
              column: 'task_count',
              operation: 'decrement',
              value: 1
            },
            {
              column: 'completed_task_count',
              operation: 'decrement',
              value: taskData?.status === 'completed' ? 1 : 0
            }
          ]
        });
        break;

      case 'tasks_bulk_updated':
        // For bulk operations, recalculate from scratch
        updates.push({
          table: 'projects',
          idColumn: 'id',
          id: projectId,
          counters: [
            {
              column: 'task_count',
              operation: 'recalculate'
            },
            {
              column: 'completed_task_count',
              operation: 'recalculate'
            }
          ]
        });
        break;
    }

    if (updates.length > 0) {
      await this.updateCounters(updates, tenantId, `project_task_${operation}`);
    }
  }

  /**
   * Execute a single counter update
   */
  private async executeUpdate(
    tx: Database,
    update: CounterUpdate,
    tenantId: string,
    operationContext?: string
  ): Promise<void> {
    const { table, idColumn, id, counters } = update;

    // Build the update query dynamically
    let updateQuery = `UPDATE ${table} SET updated_at = now()`;
    const updateValues: any[] = [];

    for (const counter of counters) {
      switch (counter.operation) {
        case 'increment':
          updateQuery += `, ${counter.column} = COALESCE(${counter.column}, 0) + $${updateValues.length + 1}`;
          updateValues.push(counter.value || 1);
          break;

        case 'decrement':
          updateQuery += `, ${counter.column} = GREATEST(COALESCE(${counter.column}, 0) - $${updateValues.length + 1}, 0)`;
          updateValues.push(counter.value || 1);
          break;

        case 'set':
          updateQuery += `, ${counter.column} = $${updateValues.length + 1}`;
          updateValues.push(counter.value);
          break;

        case 'recalculate':
          const recalcQuery = this.getRecalculationQuery(table, counter.column);
          if (recalcQuery) {
            updateQuery += `, ${counter.column} = (${recalcQuery})`;
          }
          break;
      }
    }

    updateQuery += ` WHERE ${idColumn} = $${updateValues.length + 1}`;
    updateValues.push(id);

    // Add tenant isolation
    updateQuery += ` AND tenant_id = $${updateValues.length + 1}`;
    updateValues.push(tenantId);

    try {
      await tx.execute(sql.raw(updateQuery, updateValues));
    } catch (error) {
      throw new MaterializedUpdateError(
        `Failed to update counters for ${table}(${id}): ${error.message}`,
        { table, id, counters, operationContext }
      );
    }
  }

  /**
   * Get recalculation query for specific counter columns
   */
  private getRecalculationQuery(table: string, column: string): string | null {
    const queries: Record<string, Record<string, string>> = {
      'projects': {
        'task_count': `
          SELECT COUNT(*) 
          FROM tasks 
          WHERE tasks.project_id = projects.id 
            AND tasks.tenant_id = projects.tenant_id
            AND tasks.status != 'cancelled'
        `,
        'completed_task_count': `
          SELECT COUNT(*) 
          FROM tasks 
          WHERE tasks.project_id = projects.id 
            AND tasks.tenant_id = projects.tenant_id
            AND tasks.status = 'completed'
        `
      },
      'clients': {
        'project_count': `
          SELECT COUNT(*) 
          FROM projects 
          WHERE projects.client_id = clients.id 
            AND projects.tenant_id = clients.tenant_id
            AND projects.status != 'archived'
        `,
        'active_project_count': `
          SELECT COUNT(*) 
          FROM projects 
          WHERE projects.client_id = clients.id 
            AND projects.tenant_id = clients.tenant_id
            AND projects.status = 'active'
        `
      },
      'organizations': {
        'user_count': `
          SELECT COUNT(*) 
          FROM users 
          WHERE users.organization_id = organizations.id 
            AND users.tenant_id = organizations.tenant_id
            AND users.is_active = true
        `,
        'project_count': `
          SELECT COUNT(*) 
          FROM projects 
          WHERE projects.organization_id = organizations.id 
            AND projects.tenant_id = organizations.tenant_id
            AND projects.status != 'archived'
        `
      }
    };

    return queries[table]?.[column] || null;
  }

  /**
   * Recalculate all counters for a specific entity
   */
  async recalculateAllCounters(
    table: string,
    id: string,
    tenantId: string
  ): Promise<void> {
    const counterColumns = this.getCounterColumns(table);
    
    const update: CounterUpdate = {
      table,
      idColumn: 'id',
      id,
      counters: counterColumns.map(column => ({
        column,
        operation: 'recalculate' as const
      }))
    };

    await this.updateCounters([update], tenantId, 'full_recalculation');
  }

  /**
   * Get all counter columns for a table
   */
  private getCounterColumns(table: string): string[] {
    const columns: Record<string, string[]> = {
      'projects': ['task_count', 'completed_task_count'],
      'clients': ['project_count', 'active_project_count', 'invoice_count'],
      'organizations': ['user_count', 'project_count', 'client_count'],
      'invoices': ['payment_count', 'allocated_amount'],
      'documents': ['version_count', 'download_count']
    };

    return columns[table] || [];
  }

  /**
   * Bulk recalculate counters for multiple entities
   */
  async bulkRecalculateCounters(
    table: string,
    ids: string[],
    tenantId: string
  ): Promise<void> {
    const counterColumns = this.getCounterColumns(table);
    
    for (const id of ids) {
      await this.recalculateAllCounters(table, id, tenantId);
    }
  }

  /**
   * Verify counter consistency (for debugging/auditing)
   */
  async verifyCounterConsistency(
    table: string,
    id: string,
    tenantId: string
  ): Promise<ConsistencyReport> {
    const counterColumns = this.getCounterColumns(table);
    const report: ConsistencyReport = {
      table,
      id,
      consistent: true,
      discrepancies: []
    };

    for (const column of counterColumns) {
      const recalcQuery = this.getRecalculationQuery(table, column);
      if (!recalcQuery) continue;

      // Get current value
      const currentResult = await this.db.execute(sql.raw(`
        SELECT ${column} FROM ${table} 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]));

      // Get calculated value
      const calculatedResult = await this.db.execute(sql.raw(`
        SELECT (${recalcQuery}) as calculated_value 
        FROM ${table} 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]));

      const currentValue = currentResult[0]?.[column];
      const calculatedValue = calculatedResult[0]?.calculated_value;

      if (currentValue !== calculatedValue) {
        report.consistent = false;
        report.discrepancies.push({
          column,
          currentValue,
          calculatedValue,
          difference: (currentValue || 0) - (calculatedValue || 0)
        });
      }
    }

    return report;
  }
}
```

### 3. Repository Integration

```typescript
// src/repositories/TaskRepository.ts
import { Database } from 'drizzle-orm';
import { tasks, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { MaterializedColumnService } from '../services/MaterializedColumnService';

export class TaskRepository {
  constructor(
    private db: Database,
    private materializedService: MaterializedColumnService
  ) {}

  /**
   * Create a new task with automatic counter updates
   */
  async createTask(
    taskData: CreateTaskRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Task> {
    return await this.db.transaction(async (tx) => {
      // Create the task
      const task = await tx.insert(tasks).values({
        tenantId,
        projectId: taskData.projectId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        createdBy
      }).returning();

      const createdTask = task[0];

      // Update project counters
      await this.materializedService.updateProjectTaskCounters(
        createdTask.project_id,
        tenantId,
        'task_created',
        {
          status: createdTask.status
        }
      );

      return createdTask;
    });
  }

  /**
   * Update task status with automatic counter updates
   */
  async updateTaskStatus(
    taskId: string,
    newStatus: string,
    tenantId: string
  ): Promise<Task> {
    return await this.db.transaction(async (tx) => {
      // Get current task
      const currentTask = await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenant_id, tenantId)
        ))
        .limit(1);

      if (!currentTask[0]) {
        throw new NotFoundError('Task not found');
      }

      const oldStatus = currentTask[0].status;

      // Update task
      const updated = await tx
        .update(tasks)
        .set({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Update project counters if status changed
      if (oldStatus !== newStatus) {
        await this.materializedService.updateProjectTaskCounters(
          currentTask[0].project_id,
          tenantId,
          'task_updated',
          {
            oldStatus,
            newStatus
          }
        );
      }

      return updated[0];
    });
  }

  /**
   * Delete a task with automatic counter updates
   */
  async deleteTask(
    taskId: string,
    tenantId: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get task before deletion
      const task = await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenant_id, tenantId)
        ))
        .limit(1);

      if (!task[0]) {
        throw new NotFoundError('Task not found');
      }

      // Delete the task
      await tx
        .delete(tasks)
        .where(eq(tasks.id, taskId));

      // Update project counters
      await this.materializedService.updateProjectTaskCounters(
        task[0].project_id,
        tenantId,
        'task_deleted',
        {
          status: task[0].status
        }
      );
    });
  }

  /**
   * Bulk update tasks with recalculation
   */
  async bulkUpdateTasks(
    updates: { id: string; status: string }[],
    tenantId: string
  ): Promise<Task[]> {
    return await this.db.transaction(async (tx) => {
      const updatedTasks: Task[] = [];
      const affectedProjectIds = new Set<string>();

      for (const update of updates) {
        // Get current task
        const currentTask = await tx
          .select()
          .from(tasks)
          .where(and(
            eq(tasks.id, update.id),
            eq(tasks.tenant_id, tenantId)
          ))
          .limit(1);

        if (currentTask[0]) {
          // Update task
          const updated = await tx
            .update(tasks)
            .set({
              status: update.status,
              completedAt: update.status === 'completed' ? new Date() : null,
              updatedAt: new Date()
            })
            .where(eq(tasks.id, update.id))
            .returning();

          updatedTasks.push(updated[0]);
          affectedProjectIds.add(currentTask[0].project_id);
        }
      }

      // Recalculate counters for all affected projects
      for (const projectId of affectedProjectIds) {
        await this.materializedService.updateProjectTaskCounters(
          projectId,
          tenantId,
          'tasks_bulk_updated'
        );
      }

      return updatedTasks;
    });
  }
}
```

### 4. API Integration

```typescript
// src/routes/tasks.ts
import { Router } from 'express';
import { TaskRepository } from '../repositories/TaskRepository';
import { validateRequest } from '../middleware/validation';

const router = Router();

// POST /api/tasks - Create task
router.post('/', validateRequest(createTaskSchema), async (req, res, next) => {
  try {
    const task = await taskRepository.createTask(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', validateRequest(updateStatusSchema), async (req, res, next) => {
  try {
    const task = await taskRepository.updateTaskStatus(
      req.params.id,
      req.body.status,
      req.tenant.id
    );

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    await taskRepository.deleteTask(req.params.id, req.tenant.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Identify all materialized counter columns in your schema
- [ ] Create MaterializedColumnService with update logic
- [ ] Implement recalculation queries for each counter type
- [ ] Integrate counter updates into repository methods
- [ ] Add transaction support for atomic updates
- [ ] Create bulk recalculation methods
- [ ] Add consistency verification utilities
- [ ] Implement audit logging for counter changes
- [ ] Add monitoring for counter update performance
- [ ] Create comprehensive test coverage

## Testing Requirements

### Unit Tests
- Test counter increment/decrement operations
- Test recalculation queries accuracy
- Test transaction rollback scenarios
- Test bulk update operations

### Integration Tests
- Test end-to-end counter updates
- Test concurrent modification scenarios
- Test data consistency under load
- Test error handling and recovery

### Consistency Tests
- Run consistency verification after operations
- Test counter accuracy after bulk operations
- Verify calculated vs stored values match

## Performance Considerations

- Use database transactions for atomicity
- Optimize recalculation queries with proper indexes
- Consider caching for frequently accessed counters
- Batch updates for bulk operations
- Monitor counter update performance

## Security Considerations

- Tenant isolation enforced in all queries
- Input validation for counter values
- Audit trail for counter modifications
- Rate limiting on bulk operations

## Monitoring

- Track counter update success rates
- Monitor transaction rollback frequency
- Alert on consistency discrepancies
- Track performance of recalculation queries
- Monitor database lock contention
