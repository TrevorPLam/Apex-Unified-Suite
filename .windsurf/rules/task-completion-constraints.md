---
trigger: model_decision
description: When a task is marked done, all subtasks must be done; otherwise return TaskHasUnfinishedSubtasks. Enforce hierarchical task completion constraints.
---

# Task Completion Constraints Rule

## Purpose

Enforce hierarchical task completion rules where a parent task cannot be marked as `done` until all its subtasks are also completed. This prevents incomplete work from being marked as finished and ensures proper task dependency management.

## Core Constraint Logic

### Parent Task Completion Validation

**When updating a task status to `done`:**

1. **Check for Subtasks**: Query all direct subtasks of the parent task
2. **Validate Subtask Status**: Ensure all subtasks have status `done`
3. **Enforce Constraint**: If any subtask is not done, reject with `TaskHasUnfinishedSubtasks`
4. **Cascade Completion**: When parent is marked done, update project progress if applicable

### Subtask Status Validation

**When updating a subtask status:**

1. **Parent Status Check**: If marking subtask as `done`, check if this completes all siblings
2. **Auto-Complete Parent**: If all subtasks are done, automatically mark parent as `done`
3. **Progress Updates**: Update parent task's completion percentage
4. **Project Impact**: Update project progress counters if needed

## Implementation Requirements

### Service Layer Implementation

```typescript
// src/services/TaskService.ts
export class TaskService {
  async updateTaskStatus(
    taskId: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string
  ): Promise<Task> {
    return await this.db.transaction(async (tx) => {
      // Get current task with subtasks
      const taskWithSubtasks = await this.getTaskWithSubtasks(tx, taskId, tenantId);
      
      if (!taskWithSubtasks) {
        throw new NotFoundError('Task not found');
      }

      const { task, subtasks } = taskWithSubtasks;

      // Validate status transition
      this.validateStatusTransition(task.status, newStatus);

      // If marking as done, check subtasks constraint
      if (newStatus === 'done' && subtasks.length > 0) {
        const unfinishedSubtasks = subtasks.filter(subtask => subtask.status !== 'done');
        
        if (unfinishedSubtasks.length > 0) {
          throw new TaskHasUnfinishedSubtasksError(
            'Cannot mark task as done while subtasks are incomplete',
            {
              taskId,
              unfinishedSubtaskIds: unfinishedSubtasks.map(st => st.id),
              unfinishedSubtaskTitles: unfinishedSubtasks.map(st => st.title)
            }
          );
        }
      }

      // Update the task
      const updatedTask = await this.updateTaskStatusOnly(
        tx, 
        taskId, 
        newStatus, 
        tenantId, 
        updatedBy
      );

      // Handle cascading effects
      await this.handleTaskCompletionEffects(tx, updatedTask, updatedBy);

      return updatedTask;
    });
  }

  private async handleTaskCompletionEffects(
    tx: Database,
    task: Task,
    updatedBy: string
  ): Promise<void> {
    // If task was just completed, check if parent should be auto-completed
    if (task.status === 'done' && task.parent_task_id) {
      await this.checkParentAutoCompletion(tx, task.parent_task_id, updatedBy);
    }

    // Update project counters if this affects project progress
    if (task.project_id) {
      await this.updateProjectTaskCounters(tx, task.project_id, updatedBy);
    }
  }

  private async checkParentAutoCompletion(
    tx: Database,
    parentTaskId: string,
    updatedBy: string
  ): Promise<void> {
    const parentWithSubtasks = await this.getTaskWithSubtasks(tx, parentTaskId, '');
    
    if (!parentWithSubtasks) return;

    const { parent, subtasks } = parentWithSubtasks;
    const allSubtasksDone = subtasks.every(st => st.status === 'done');

    if (allSubtasksDone && parent.status !== 'done') {
      await this.updateTaskStatusOnly(tx, parentTaskId, 'done', '', updatedBy);
      
      // Recursively check if this completes the parent's parent
      if (parent.parent_task_id) {
        await this.checkParentAutoCompletion(tx, parent.parent_task_id, updatedBy);
      }
    }
  }

  private async getTaskWithSubtasks(
    tx: Database,
    taskId: string,
    tenantId: string
  ): Promise<{ task: Task; subtasks: Task[] } | null> {
    const task = await tx
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.id, taskId),
        tenantId ? eq(tasks.tenant_id, tenantId) : sql`1=1`
      ))
      .limit(1);

    if (!task[0]) return null;

    const subtasks = await tx
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.parent_task_id, taskId),
        eq(tasks.tenant_id, task[0].tenant_id)
      ))
      .orderBy(tasks.sort_order);

    return { task: task[0], subtasks };
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'todo': ['in_progress', 'cancelled'],
      'in_progress': ['done', 'blocked', 'cancelled'],
      'blocked': ['in_progress', 'cancelled'],
      'done': [], // Terminal state
      'cancelled': ['todo', 'in_progress'] // Can be reactivated
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new InvalidTaskStatusTransitionError(
        `Cannot transition task from ${currentStatus} to ${newStatus}`
      );
    }
  }
}
```

### Domain Error Class

```typescript
export class TaskHasUnfinishedSubtasksError extends DomainError {
  constructor(
    message: string,
    public readonly details: {
      taskId: string;
      unfinishedSubtaskIds: string[];
      unfinishedSubtaskTitles: string[];
    }
  ) {
    super('TASK_HAS_UNFINISHED_SUBTASKS', message, details);
  }
}

export class InvalidTaskStatusTransitionError extends DomainError {
  constructor(message: string) {
    super('INVALID_TASK_STATUS_TRANSITION', message);
  }
}
```

### API Endpoint Implementation

```typescript
// src/routes/tasks.ts
router.patch('/:id/status', validateRequest(updateTaskStatusSchema), async (req, res, next) => {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.body.status,
      req.tenant.id,
      req.user.id
    );

    res.json({ task });
  } catch (error) {
    if (error instanceof TaskHasUnfinishedSubtasksError) {
      return res.status(422).json({
        error: error.message,
        code: error.code,
        details: {
          taskId: error.details.taskId,
          unfinishedSubtasks: error.details.unfinishedSubtaskIds.map((id, index) => ({
            id,
            title: error.details.unfinishedSubtaskTitles[index]
          }))
        },
        suggestions: [
          'Complete all subtasks first',
          'Move unfinished subtasks to a different parent task',
          'Cancel the subtasks if they are no longer needed'
        ],
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});
```

### Database Schema Support

```sql
-- Tasks table with hierarchical support
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  sort_order INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assignee_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for hierarchical queries
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);

-- Prevent circular references using trigger
CREATE OR REPLACE FUNCTION prevent_circular_task_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we're creating a circular reference
  IF NEW.parent_task_id IS NOT NULL THEN
    -- Recursive CTE to check for circular references
    WITH RECURSIVE task_hierarchy AS (
      SELECT id, parent_task_id, 1 as level
      FROM tasks 
      WHERE id = NEW.parent_task_id
      
      UNION ALL
      
      SELECT t.id, t.parent_task_id, th.level + 1
      FROM tasks t
      INNER JOIN task_hierarchy th ON t.id = th.parent_task_id
      WHERE th.level < 10 -- Prevent infinite recursion
    )
    SELECT 1 FROM task_hierarchy WHERE id = NEW.id;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Circular task reference detected';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_circular_references
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_task_references();
```

### Frontend Integration

```typescript
// React component for task status update
export const TaskStatusUpdate: React.FC<{ task: Task }> = ({ task }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateTaskStatus(task.id, newStatus);
      
      if (newStatus === 'done') {
        // Show success message
        toast.success('Task completed successfully!');
      }
    } catch (error) {
      if (error instanceof TaskHasUnfinishedSubtasksError) {
        setError(`Cannot complete task: ${error.details.unfinishedSubtaskTitles.length} subtasks remain unfinished`);
        // Show subtasks that need completion
        showUnfinishedSubtasksDialog(error.details);
      } else {
        setError('Failed to update task status');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <select
        value={task.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className="task-status-select"
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
        <option value="cancelled">Cancelled</option>
      </select>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

**Test constraint enforcement:**

```typescript
describe('Task Completion Constraints', () => {
  test('should prevent parent completion when subtasks exist', async () => {
    // Create parent task with subtasks
    const parent = await createTask({ title: 'Parent Task' });
    const subtask1 = await createTask({ 
      title: 'Subtask 1', 
      parentTaskId: parent.id,
      status: 'done'
    });
    const subtask2 = await createTask({ 
      title: 'Subtask 2', 
      parentTaskId: parent.id,
      status: 'in_progress'
    });

    // Try to mark parent as done
    await expect(
      taskService.updateTaskStatus(parent.id, 'done', tenantId, userId)
    ).rejects.toThrow(TaskHasUnfinishedSubtasksError);
  });

  test('should allow parent completion when all subtasks are done', async () => {
    // Create parent task with completed subtasks
    const parent = await createTask({ title: 'Parent Task' });
    await createTask({ 
      title: 'Subtask 1', 
      parentTaskId: parent.id,
      status: 'done'
    });
    await createTask({ 
      title: 'Subtask 2', 
      parentTaskId: parent.id,
      status: 'done'
    });

    // Mark parent as done - should succeed
    const updated = await taskService.updateTaskStatus(parent.id, 'done', tenantId, userId);
    expect(updated.status).toBe('done');
  });

  test('should auto-complete parent when last subtask is completed', async () => {
    // Create parent task with almost complete subtasks
    const parent = await createTask({ title: 'Parent Task' });
    await createTask({ 
      title: 'Subtask 1', 
      parentTaskId: parent.id,
      status: 'done'
    });
    const subtask2 = await createTask({ 
      title: 'Subtask 2', 
      parentTaskId: parent.id,
      status: 'in_progress'
    });

    // Complete last subtask
    await taskService.updateTaskStatus(subtask2.id, 'done', tenantId, userId);

    // Parent should be auto-completed
    const updatedParent = await taskService.findById(parent.id, tenantId);
    expect(updatedParent?.status).toBe('done');
  });
});
```

### Integration Tests

**Test hierarchical scenarios:**

1. **Multi-level hierarchies**: Test 3+ levels of task nesting
2. **Concurrent updates**: Test simultaneous subtask updates
3. **Project progress**: Verify project counters update correctly
4. **Circular reference prevention**: Test database constraints

### Edge Cases

**Test these scenarios:**

1. **Empty subtasks**: Parent with no subtasks can be completed
2. **Cancelled subtasks**: Cancelled subtasks don't block parent completion
3. **Deep hierarchies**: Test performance with many nesting levels
4. **Status validation**: Test invalid status transitions

## Performance Considerations

### Query Optimization

```typescript
// Efficient query for checking subtask completion
private async areAllSubtasksCompleted(
  tx: Database,
  parentTaskId: string,
  tenantId: string
): Promise<boolean> {
  const result = await tx
    .select({ count: sql<number>`COUNT(*)` })
    .from(tasks)
    .where(and(
      eq(tasks.parent_task_id, parentTaskId),
      eq(tasks.tenant_id, tenantId),
      sql`${tasks.status} != 'done'`
    ))
    .limit(1);

  return result[0].count === 0;
}
```

### Caching Strategy

- Cache task hierarchy for frequently accessed projects
- Invalidate cache when task status changes
- Use database triggers for real-time updates

## Enforcement Checklist

- [ ] Parent task completion validates all subtasks are done
- [ ] Subtask completion triggers parent auto-completion
- [ ] Proper error handling with TaskHasUnfinishedSubtasks
- [ ] Database constraints prevent circular references
- [ ] Status transition validation is implemented
- [ ] Project progress counters update correctly
- [ ] Frontend shows clear error messages
- [ ] Comprehensive test coverage for all scenarios
- [ ] Performance optimization for hierarchical queries
- [ ] Audit logging for task completion events
- [ ] API responses include helpful error details
- [ ] Recursive auto-completion works for multi-level hierarchies
