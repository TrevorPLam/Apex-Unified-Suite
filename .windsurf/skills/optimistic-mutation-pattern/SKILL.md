---
name: optimistic-mutation-pattern
description: Advanced TanStack Query patterns for optimistic updates with proper cache management, rollback mechanisms, and user feedback
---

# Optimistic Mutation Pattern Skill

## Purpose
Implement sophisticated optimistic updates for mutations that modify list data (kanban moves, task toggles, status changes). This skill ensures immediate UI feedback with proper rollback on failure.

## Core Pattern

### Basic Optimistic Update Structure
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    // 1. Cancel outgoing queries
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // 2. Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // 3. Optimistically update cache
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        );
      });
      
      // 4. Return context for rollback
      return { previousTasks };
    },
    
    // 5. Rollback on error
    onError: (error, updatedTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error('Failed to update task');
    },
    
    // 6. Refetch on settle (handles both success and error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

## Advanced Patterns

### 1. List Item Addition
```typescript
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onMutate: async (newContact) => {
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      const previousContacts = queryClient.getQueryData(['contacts']);
      
      // Generate temporary ID for optimistic update
      const tempContact = {
        ...newContact,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };
      
      queryClient.setQueryData(['contacts'], (old: Contact[] | undefined) => {
        return old ? [...old, tempContact] : [tempContact];
      });
      
      return { previousContacts, tempContact };
    },
    
    onError: (error, newContact, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
      toast.error('Failed to create contact');
    },
    
    onSuccess: (savedContact, variables, context) => {
      // Replace temporary contact with real one
      queryClient.setQueryData(['contacts'], (old: Contact[] | undefined) => {
        return old?.map(contact => 
          contact.id === context?.tempContact?.id ? savedContact : contact
        );
      });
      toast.success('Contact created successfully');
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
```

### 2. List Item Deletion
```typescript
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically remove from cache
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        return old?.filter(task => task.id !== taskId);
      });
      
      return { previousTasks, deletedTaskId: taskId };
    },
    
    onError: (error, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error('Failed to delete task');
    },
    
    onSuccess: () => {
      toast.success('Task deleted successfully');
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

### 3. Complex State Changes (Kanban Board)
```typescript
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, newStatus, newIndex }: MoveTaskParams) => 
      moveTask(taskId, newStatus, newIndex),
    
    onMutate: async ({ taskId, newStatus, newIndex }) => {
      // Cancel all board-related queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['tasks'] }),
        queryClient.cancelQueries({ queryKey: ['kanban'] }),
      ]);
      
      const previousTasks = queryClient.getQueryData(['tasks']);
      const previousKanban = queryClient.getQueryData(['kanban']);
      
      // Optimistically update tasks
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        if (!old) return old;
        
        return old.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              status: newStatus,
              orderIndex: newIndex,
              updatedAt: new Date().toISOString(),
              isOptimistic: true,
            };
          }
          return task;
        });
      });
      
      // Optimistically update kanban board
      queryClient.setQueryData(['kanban'], (old: KanbanBoard | undefined) => {
        if (!old) return old;
        
        // Complex kanban reordering logic
        return reorderKanbanBoard(old, taskId, newStatus, newIndex);
      });
      
      return { previousTasks, previousKanban };
    },
    
    onError: (error, variables, context) => {
      // Rollback both queries
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      if (context?.previousKanban) {
        queryClient.setQueryData(['kanban'], context.previousKanban);
      }
      toast.error('Failed to move task');
    },
    
    onSuccess: (result, variables, context) => {
      toast.success('Task moved successfully');
    },
    
    onSettled: () => {
      // Refetch all related queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['kanban'] }),
      ]);
    },
  });
}
```

## UI Integration Patterns

### 1. Visual Feedback for Optimistic Updates
```typescript
export function TaskCard({ task }: { task: Task }) {
  const updateTaskMutation = useUpdateTask();
  
  const handleStatusToggle = () => {
    const updatedTask = {
      ...task,
      completed: !task.completed,
    };
    
    updateTaskMutation.mutate(updatedTask);
  };
  
  return (
    <div className={`
      p-4 border rounded-lg transition-all duration-200
      ${task.isOptimistic ? 'opacity-70 border-blue-400' : ''}
      ${updateTaskMutation.isPending ? 'animate-pulse' : ''}
    `}>
      <h3 className={task.completed ? 'line-through text-gray-500' : ''}>
        {task.title}
      </h3>
      
      <button
        onClick={handleStatusToggle}
        disabled={updateTaskMutation.isPending}
        className={`
          mt-2 px-3 py-1 rounded text-sm
          ${updateTaskMutation.isPending 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
      </button>
      
      {task.isOptimistic && (
        <div className="mt-2 text-xs text-blue-600">
          Saving...
        </div>
      )}
    </div>
  );
}
```

### 2. Loading States for List Operations
```typescript
export function ContactList() {
  const { data: contacts, isLoading } = useListContacts();
  const createContactMutation = useCreateContact();
  const deleteContactMutation = useDeleteTask();
  
  const isAnyMutationPending = 
    createContactMutation.isPending || 
    deleteContactMutation.isPending;
  
  return (
    <div className="space-y-2">
      {contacts?.map(contact => (
        <ContactCard 
          key={contact.id}
          contact={contact}
          isDeleting={deleteContactMutation.variables === contact.id && 
                    deleteContactMutation.isPending}
        />
      ))}
      
      {isAnyMutationPending && (
        <div className="text-center text-sm text-gray-500 py-2">
          Processing changes...
        </div>
      )}
    </div>
  );
}
```

## Error Handling Patterns

### 1. Retry Logic
```typescript
export function useUpdateContactWithRetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContact,
    onMutate: async (updatedContact) => {
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      const previousContacts = queryClient.getQueryData(['contacts']);
      
      queryClient.setQueryData(['contacts'], (old: Contact[] | undefined) => {
        return old?.map(contact => 
          contact.id === updatedContact.id ? updatedContact : contact
        );
      });
      
      return { previousContacts, updatedContact };
    },
    
    onError: (error, updatedContact, context) => {
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
      
      // Show retry option
      toast.error('Failed to update contact', {
        action: {
          label: 'Retry',
          onClick: () => {
            // Retry the mutation
            if (context?.updatedContact) {
              mutation.mutate(context.updatedContact);
            }
          },
        },
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
```

### 2. Conflict Resolution
```typescript
export function useUpdateTaskWithConflictResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        return old?.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        );
      });
      
      return { previousTasks };
    },
    
    onError: (error: any, updatedTask, context) => {
      if (error?.status === 409) {
        // Conflict error - server has newer version
        toast.error('Task was modified by someone else. Refreshing...', {
          duration: 3000,
        });
        
        // Force refetch to get latest data
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        return;
      }
      
      // Regular error - rollback
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      
      toast.error('Failed to update task');
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

## Testing Patterns

### 1. Unit Test for Optimistic Update
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateTask } from './useUpdateTask';

describe('useUpdateTask', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    
    // Set up initial data
    queryClient.setQueryData(['tasks'], [
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: false },
    ]);
  });

  test('should optimistically update task', async () => {
    const { result } = renderHook(() => useUpdateTask(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    const updatedTask = { id: '1', title: 'Task 1', completed: true };
    
    // Trigger mutation
    result.current.mutate(updatedTask);
    
    // Check optimistic update
    expect(result.current.isPending).toBe(true);
    
    const tasks = queryClient.getQueryData(['tasks']);
    expect(tasks).toEqual([
      { id: '1', title: 'Task 1', completed: true },
      { id: '2', title: 'Task 2', completed: false },
    ]);
  });

  test('should rollback on error', async () => {
    // Mock failed mutation
    jest.mock('./api', () => ({
      updateTask: jest.fn().mockRejectedValue(new Error('Update failed')),
    }));

    const { result } = renderHook(() => useUpdateTask(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    const updatedTask = { id: '1', title: 'Task 1', completed: true };
    
    result.current.mutate(updatedTask);
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check rollback
    const tasks = queryClient.getQueryData(['tasks']);
    expect(tasks).toEqual([
      { id: '1', title: 'Task 1', completed: false }, // Rolled back
      { id: '2', title: 'Task 2', completed: false },
    ]);
  });
});
```

## Best Practices Checklist

For each optimistic mutation:

- [ ] **Cancel queries** before optimistic update
- [ ] **Snapshot previous data** for rollback
- [ ] **Update cache optimistically** with temporary state
- [ ] **Mark optimistic items** visually (opacity, borders)
- [ ] **Handle rollback on error** with context
- [ ] **Show user feedback** (toast, loading states)
- [ ] **Invalidate on settle** for consistency
- [ ] **Test both success and error paths**
- [ ] **Handle conflicts** (409 status codes)
- [ ] **Provide retry mechanisms** for failed operations

## Common Pitfalls

### ❌ Incorrect Patterns
```typescript
// Don't forget to cancel queries
onMutate: async (data) => {
  // Missing: await queryClient.cancelQueries()
  const previous = queryClient.getQueryData(['items']);
  queryClient.setQueryData(['items'], newData);
  return { previous };
}

// Don't use wrong cache key
queryClient.setQueryData(['wrong-key'], newData); // WRONG

// Don't forget rollback context
onError: (error) => {
  // Missing: rollback with context data
  toast.error('Failed');
}

// Don't skip invalidation
onSettled: () => {
  // Missing: queryClient.invalidateQueries()
}
```

### ✅ Correct Patterns
```typescript
onMutate: async (data) => {
  await queryClient.cancelQueries({ queryKey: ['correct-key'] });
  const previous = queryClient.getQueryData(['correct-key']);
  queryClient.setQueryData(['correct-key'], newData);
  return { previous };
},

onError: (error, data, context) => {
  if (context?.previous) {
    queryClient.setQueryData(['correct-key'], context.previous);
  }
  toast.error('Failed');
},

onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['correct-key'] });
}
```

## Performance Considerations

- **Batch multiple updates** when possible
- **Use selective invalidation** instead of full refetches
- **Debounce rapid mutations** (e.g., drag-and-drop)
- **Limit optimistic updates** to user-initiated actions
- **Monitor cache size** for large datasets

This skill ensures responsive, reliable optimistic updates that enhance user experience while maintaining data consistency.
