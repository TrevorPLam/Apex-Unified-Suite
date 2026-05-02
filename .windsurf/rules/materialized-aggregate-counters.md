---
trigger: model_decision
description: Whenever an aggregate has derived counts (like task_count, progress_percent), they must be updated in the same DB transaction that modifies the parent aggregate. This generalizes the project progress rule.
---

# Materialized Aggregate Counters Rule

## Purpose

Enforce that materialized aggregate counters (counts, totals, percentages) are updated atomically in the same database transaction that modifies child records. This prevents data inconsistency and ensures aggregate data always reflects the current state of child records.

## Core Requirements

### Atomic Update Pattern

**When child records are modified:**

1. **Same Transaction**: All updates must occur in a single database transaction
2. **Immediate Update**: Aggregate counters updated immediately after child modification
3. **Rollback Safety**: Failed operations roll back both child and aggregate updates
4. **Performance**: Use efficient SQL calculations for aggregate updates

### Required Aggregate Updates

**Common aggregates that must be updated:**

- **Project Task Count**: When tasks are created, deleted, or status changes
- **Project Progress**: When task completion status changes
- **Client Metrics**: When invoices are created, paid, or status changes
- **Document Counts**: When documents are created, deleted, or versioned
- **User Activity Counts**: When users perform actions affecting counts

## Implementation Requirements

### Repository Layer Pattern

```typescript
// src/repositories/ProjectRepository.ts
export class ProjectRepository {
  constructor(
    private db: Database,
    private materializedColumnService: MaterializedColumnService
  ) {}

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
        status: taskData.status || 'todo',
        createdBy
      }).returning();

      const createdTask = task[0];

      // Update project counters in the same transaction
      await this.materializedColumnService.updateCounters(tx, [
        {
          table: 'projects',
          id: taskData.projectId,
          counters: [
            { column: 'task_count', operation: 'increment' },
            { column: 'completed_task_count', operation: taskData.status === 'completed' ? 'increment' : 'no_change' },
            { column: 'progress_percent', operation: 'recalculate' }
          ]
        }
      ]);

      return createdTask;
    });
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string
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
        throw new TaskNotFoundError('Task not found');
      }

      const oldStatus = currentTask[0].status;
      const projectId = currentTask[0].project_id;

      // Update task status
      const updatedTask = await tx
        .update(tasks)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedBy,
          completedAt: newStatus === 'completed' ? new Date() : null
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Update project counters in the same transaction
      await this.materializedColumnService.updateCounters(tx, [
        {
          table: 'projects',
          id: projectId,
          counters: [
            { column: 'completed_task_count', operation: oldStatus === 'completed' ? 'decrement' : 'no_change' },
            { column: 'in_progress_task_count', operation: newStatus === 'in_progress' ? 'increment' : 'no_change' },
            { column: 'todo_task_count', operation: newStatus === 'todo' ? 'increment' : 'no_change' },
            { column: 'progress_percent', operation: 'recalculate' }
          ]
        }
      ]);

      return updatedTask[0];
    });
  }

  async deleteTask(
    taskId: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get task details before deletion
      const task = await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenant_id, tenantId)
        ))
        .limit(1);

      if (!task[0]) {
        throw new TaskNotFoundError('Task not found');
      }

      const projectId = task[0].project_id;
      const taskStatus = task[0].status;

      // Delete the task
      await tx.delete(tasks)
        .where(eq(tasks.id, taskId));

      // Update project counters in the same transaction
      await this.materializedColumnService.updateCounters(tx, [
        {
          table: 'projects',
          id: projectId,
          counters: [
            { column: 'task_count', operation: 'decrement' },
            { column: `${taskStatus}_task_count`, operation: 'decrement' },
            { column: 'progress_percent', operation: 'recalculate' }
          ]
        }
      ]);
    });
  }

  async bulkUpdateTaskStatus(
    taskIds: string[],
    newStatus: string,
    tenantId: string,
    updatedBy: string
  ): Promise<Task[]> {
    return await this.db.transaction(async (tx => {
      // Get all affected projects
      const projectIds = await tx
        .select({ projectId: tasks.project_id })
        .from(tasks)
        .where(and(
          inArray(tasks.id, taskIds),
          eq(tasks.tenant_id, tenantId)
        ))
        .groupBy(tasks.project_id)
        .map(group => group.projectId);

      // Update each project's counters
      for (const { projectId } of projectIds) {
        const affectedTaskCount = await tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(tasks)
          .where(and(
            eq(tasks.project_id, projectId),
            eq(tasks.tenant_id, tenantId),
            sql`${tasks.status} = ${newStatus}`
          ))
          .limit(1);

        await this.materializedService.updateCounters(tx, [
          {
            table: 'projects',
            id: projectId,
            counters: [
              { column: `${newStatus}_task_count`, operation: 'set' },
              { column: 'progress_percent', operation: 'recalculate' }
            ]
          }
        ]);
      }

      // Update all tasks
      await tx
        .update(tasks)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedBy
        })
        .where(and(
          inArray(tasks.id, taskIds),
          eq(tasks.tenant_id, tenantId)
        ));

      // Return updated tasks
      return await tx
        .select()
        .from(tasks)
        .where(and(
          inArray(tasks.id, taskIds),
          eq(tasks.tenant_id, tenantId)
        ))
        .orderBy(tasks.created_at);
    });
  }
}
```

### Materialized Column Service Implementation

```typescript
// src/services/MaterializedColumnService.ts
export class MaterializedColumnService {
  constructor(private db: Database) {}

  async updateCounters(
    tx: Database,
    updates: CounterUpdate[]
  ): Promise<void> {
    for (const update of updates) {
      const { table, id, counters } = update;

      for (const counter of counters) {
        const updateQuery = this.buildUpdateQuery(table, id, counter);
        await tx.execute(sql.raw(updateQuery));
      }
    }
  }

  private buildUpdateQuery(
    table: string,
    id: string,
    counter: CounterField
  ): string {
    const { column, operation, value } = counter;
    
    switch (operation) {
      case 'increment':
        return `UPDATE ${table} SET ${column} = COALESCECE(${column}, 0) + ${value}) WHERE id = ${id}`;
      
      case 'decrement':
        return `UPDATE ${table} SET ${column} = GREATEST(COALESCE(${column}, 0) - ${value}, 0) WHERE id = ${id}`;
      
      case 'set':
        return `UPDATE ${table} SET ${column} = ${value} WHERE id = ${id}`;
      
      case 'recalculate':
        return `UPDATE ${table} SET ${column} = (${this.getRecalculationQuery(table, column)}) WHERE id = ${id}`;
      
      default:
        throw new Error(`Unsupported counter operation: ${operation}`);
    }
  }

  private getRecalculationQuery(table: string, column: string): string {
    const recalcQueries: Record<string, string> = {
      'projects': {
        'task_count': `
          (SELECT COUNT(*) 
           FROM tasks 
           WHERE project_id = projects.id 
             AND tasks.status != 'cancelled'
          )
        `,
        'completed_task_count': `
          (SELECT COUNT(*) 
           FROM tasks 
           WHERE project_id = projects.id 
             AND tasks.status = 'completed'
          )
        `,
        'progress_percent': `
          (SELECT CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
              (SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
          END
          FROM tasks 
          WHERE project_id = projects.id 
            AND tasks.status != 'cancelled'
          )
        `
      },
      'clients': {
        'project_count': `
          (SELECT COUNT(*) 
           FROM projects 
           WHERE client_id = clients.id 
             AND projects.status != 'archived'
          )
        `,
        'active_project_count': `
          (SELECT COUNT(*) 
           FROM projects 
           WHERE client_id = clients.id 
             AND projects.status = 'active'
          )
        `,
        'invoice_count': `
          (SELECT COUNT(*) 
           FROM invoices 
           WHERE client_id = clients.id 
             AND invoices.status IN ('sent', 'overdue', 'paid')
          )
        `,
        'paid_amount': `
          (SELECT COALESCE(SUM(amount), 0) 
           FROM invoices 
           WHERE client_id = clients.id 
             AND invoices.status = 'paid'
          )
        `
      };

    return recalcQueries[table]?.[column] || '';
  }
}
```

### Database Schema Support

```sql
-- Projects table with materialized counters
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Materialized counters
  task_count INTEGER NOT NULL DEFAULT 0,
  completed_task_count INTEGER NOT NULL DEFAULT 0,
  in_progress_task_count INTEGER NOT NULL DEFAULT 0,
  progress_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN task_count = 0 THEN 0
      ELSE ROUND(
        (completed_task_count * 100.0 / task_count, 2
    END
  ) STORED,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Clients table with materialized counters
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Materialized counters
  project_count INTEGER NOT NULL DEFAULT 0,
  active_project_count INTEGER NOT NULL DEFAULT 0,
  invoice_count INTEGER NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_overdue DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for efficient counter updates
CREATE INDEX idx_projects_counters ON projects(id);
CREATE INDEX idx_clients_counters ON clients(id);
CREATE INDEX idx_clients_projects ON clients(id, project_id);
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status);
```

### API Layer Implementation

```typescript
// src/routes/projects.ts
router.patch('/:id/tasks/bulk-update', validateRequest(bulkTaskUpdateSchema), async (req, res, next) => {
  try {
    const { taskIds, status } = req.body;
    
    const updatedTasks = await projectRepository.bulkUpdateTaskStatus(
      taskIds,
      status,
      req.tenant.id,
      req.user.id
    );

    res.json({
      tasks: updatedTasks,
      updatedCount: updatedTasks.length,
      requestedCount: taskIds.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/metrics
router.get('/:id/metrics', async (req, res, next) => {
  try {
    const project = await projectRepository.findById(req.params.id, req.tenant.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      projectId: project.id,
      metrics: {
        taskCount: project.taskCount,
        completedTaskCount: project.completedTaskCount,
        inProgressTaskCount: project.inProgressTaskCount,
        progressPercent: project.progressPercent
      }
    });
  } catch (error) {
    next(error);
  }
});
```

## Testing Requirements

### Unit Tests

**Test atomic counter updates:**

```typescript
describe('Materialized Column Updates', () => {
  test('should update counters atomically in same transaction', async () => {
    const project = await createProject();
    const initialCount = project.taskCount;

    // Add task and verify counter update
    await projectRepository.createTask(
      { projectId: project.id, title: 'New Task' },
      tenantId,
      userId
    );

    const updatedProject = await projectRepository.findById(project.id, tenantId);
    expect(updatedProject.taskCount).toBe(initialCount + 1);
  });

  test('should rollback counter updates on transaction failure', async () => {
    const project = await createProject();
    const initialCount = project.taskCount;

    // Mock database failure on second update
    const mockDb = mockDatabase();
    projectRepository.db = mockDb;

    try {
      await projectRepository.createTask(
        { projectId: project.id, title: 'New Task' },
        tenantId,
        userId
      );
      fail('Database error');
    } catch (error) {
      // Verify original count is unchanged
      const unchangedProject = await projectRepository.findById(project.id, tenantId);
      expect(unchangedProject.taskCount).toBe(initialCount);
    }
  });

  test('should handle multiple counter updates in single transaction', async () => {
    const project = await createProject();
    const taskIds = await createMultipleTasks(project.id, 3);
    
    await projectRepository.bulkUpdateTaskStatus(
      taskIds,
      'completed',
      tenantId,
      userId
    );

    const updatedProject = await projectRepository.findById(project.id, tenantId);
    expect(updatedProject.completedTaskCount).toBe(3);
    expect(updatedProject.progressPercent).toBeCloseTo(100);
  });
});
```

### Integration Tests

**Test end-to-end counter scenarios:**

1. **Task Management**: Complete task lifecycle with counter updates
2. **Project Progress**: Progress calculation accuracy
3. **Client Metrics**: Financial metrics aggregation
4. **Concurrent Operations**: Multiple users modifying same project

### Performance Tests

**Test performance under load:**

```typescript
describe('Materialized Column Performance', () => {
  test('should handle high-volume updates efficiently', async () => {
      const project = await createLargeProject(1000 tasks);
      
      const startTime = Date.now();
      
      // Perform many updates
      for (let i = 0; i < 100; i++) {
        await projectRepository.updateTaskStatus(
          `task-${i}`,
          'completed',
          tenantId,
          userId
        );
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Under 5 seconds for 100 updates
    });
  });
});
```

## Performance Considerations

### Efficient Query Patterns

```typescript
// Batch counter updates for better performance
private async batchUpdateCounters(
  tx: Database,
  updates: CounterUpdate[]
): Promise<void> {
  // Group updates by table for efficiency
  const updatesByTable = updates.reduce((acc, update) => {
    acc[update.table] = acc[update.table] || [];
    acc[update.table].push(update);
    return acc;
  }, {});

  for (const [table, tableUpdates] of Object.entries(updatesByTable)) {
    const updateQuery = tableUpdates
      .map(update => 
        this.buildUpdateQuery(table, update.id, update)
      ).join('; ');

    await tx.execute(sql.raw(updateQuery));
  }
}
```

### Database Optimization

```sql
-- Use triggers for automatic counter updates when possible
CREATE OR REPLACE FUNCTION update_project_task_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET task_count = (
    SELECT COUNT(*) 
    FROM tasks 
    WHERE project_id = NEW.id 
      AND tasks.status != 'cancelled'
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_task_count
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_task_count();
```

## Enforcement Checklist

- [ ] All aggregate counters are updated in same transaction as child modifications
- [ **[ ] Database triggers enforce automatic counter updates where possible**
- [ ] Repository methods use materializedColumnService for counter updates
- [ ] API endpoints ensure atomic operations
- [ ] Comprehensive test coverage for atomic updates
- [ ] Performance optimization for high-volume operations
- [ ] Error handling ensures transaction rollback
- [ ] Audit logging for counter changes
- [ ] Database indexes support efficient counter queries
- [ ] Frontend displays real-time counter updates
- [ ] Cross-entity consistency maintained across aggregates
- [ ] Concurrent modifications handled safely without conflicts
