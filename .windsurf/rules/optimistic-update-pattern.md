---
trigger: glob
globs: **/*.tsx
description: Optimistic update patterns for instant UI feedback with proper error handling and rollback
---

# Optimistic Update Pattern

## Core Principles

### What Are Optimistic Updates
Optimistic updates immediately update the UI as if the server operation will succeed, providing instant feedback to users. If the operation fails, the UI rolls back to the previous state.

### When to Use Optimistic Updates
- **High-confidence operations**: User actions that typically succeed (likes, comments, simple edits)
- **Fast network conditions**: When server responses are quick
- **Non-critical data**: When temporary inconsistency is acceptable
- **User-initiated actions**: Direct user interactions, not background processes

### When NOT to Use Optimistic Updates
- **Critical operations**: Payments, deletions, security-sensitive actions
- **Slow network conditions**: When rollback would be noticeable
- **Complex validations**: When server validation might fail
- **Multi-step workflows**: When operations depend on each other

## Required Implementation Pattern

### 1. Basic Optimistic Update Structure
```typescript
// ✅ CORRECT - Complete optimistic update pattern
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    
    // Snapshot the previous value
    const previousTasks = queryClient.getQueryData(['tasks']);
    
    // Optimistically update to the new value
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old?.map(task => task.id === newTask.id ? newTask : task)
    );
    
    // Return context with the snapshot
    return { previousTasks };
  },
  onError: (err, newTask, context) => {
    // Rollback to the previous value
    queryClient.setQueryData(['tasks'], context?.previousTasks);
  },
  onSettled: () => {
    // Refetch to ensure server state
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});

// ❌ INCORRECT - Missing rollback mechanism
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old?.map(task => task.id === newTask.id ? newTask : task)
    );
  },
  // No error handling or rollback
});
```

### 2. Adding New Items Pattern
```typescript
// ✅ CORRECT - Adding new items with optimistic updates
const createTaskMutation = useMutation({
  mutationFn: createTask,
  onMutate: async (newTask) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    
    const previousTasks = queryClient.getQueryData(['tasks']) || [];
    
    // Create optimistic task with temporary ID
    const optimisticTask = {
      ...newTask,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    
    queryClient.setQueryData(['tasks'], [...previousTasks, optimisticTask]);
    
    return { previousTasks };
  },
  onError: (err, newTask, context) => {
    queryClient.setQueryData(['tasks'], context?.previousTasks);
  },
  onSuccess: (serverTask, variables, context) => {
    // Replace optimistic task with server task
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old?.map(task => 
        task.id === `temp-${Date.now()}` ? serverTask : task
      )
    );
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

### 3. Deleting Items Pattern
```typescript
// ✅ CORRECT - Deleting items with optimistic updates
const deleteTaskMutation = useMutation({
  mutationFn: deleteTask,
  onMutate: async (taskId) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    
    const previousTasks = queryClient.getQueryData(['tasks']);
    
    // Remove item optimistically
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old?.filter(task => task.id !== taskId)
    );
    
    return { previousTasks };
  },
  onError: (err, taskId, context) => {
    // Restore item on error
    queryClient.setQueryData(['tasks'], context?.previousTasks);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

## Advanced Patterns

### 1. Complex State Updates
```typescript
// ✅ CORRECT - Complex state with multiple queries
const moveTaskMutation = useMutation({
  mutationFn: ({ taskId, newStatus }) => moveTask(taskId, newStatus),
  onMutate: async ({ taskId, newStatus }) => {
    // Cancel multiple queries
    await Promise.all([
      queryClient.cancelQueries({ queryKey: ['tasks'] }),
      queryClient.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] }),
    ]);
    
    const previousTasks = queryClient.getQueryData(['tasks']);
    const previousProjectTasks = queryClient.getQueryData(['projects', projectId, 'tasks']);
    
    // Update both queries optimistically
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old?.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    
    queryClient.setQueryData(['projects', projectId, 'tasks'], (old: Task[]) =>
      old?.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    
    return { previousTasks, previousProjectTasks };
  },
  onError: (err, variables, context) => {
    // Rollback both queries
    queryClient.setQueryData(['tasks'], context?.previousTasks);
    queryClient.setQueryData(['projects', variables.projectId, 'tasks'], context?.previousProjectTasks);
  },
  onSettled: (_, __, variables) => {
    // Refetch both queries
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'tasks'] }),
    ]);
  },
});
```

### 2. Pagination Support
```typescript
// ✅ CORRECT - Optimistic updates with paginated data
const updatePostMutation = useMutation({
  mutationFn: updatePost,
  onMutate: async (updatedPost) => {
    await queryClient.cancelQueries({ queryKey: ['posts'] });
    
    const previousPosts = queryClient.getQueryData(['posts']);
    
    // Update all pages that might contain the post
    queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
      if (!old?.pages) return old;
      
      return {
        ...old,
        pages: old.pages.map((page: Post[]) =>
          page.map(post => 
            post.id === updatedPost.id ? updatedPost : post
          )
        ),
      };
    });
    
    return { previousPosts };
  },
  onError: (err, updatedPost, context) => {
    queryClient.setQueryData(['posts'], context?.previousPosts);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});
```

### 3. Dependent Updates
```typescript
// ✅ CORRECT - Updating dependent data
const assignTaskMutation = useMutation({
  mutationFn: ({ taskId, assigneeId }) => assignTask(taskId, assigneeId),
  onMutate: async ({ taskId, assigneeId }) => {
    await Promise.all([
      queryClient.cancelQueries({ queryKey: ['tasks'] }),
      queryClient.cancelQueries({ queryKey: ['users', assigneeId, 'tasks'] }),
      queryClient.cancelQueries({ queryKey: ['users'] }),
    ]);
    
    const previousTasks = queryClient.getQueryData(['tasks']);
    const previousUserTasks = queryClient.getQueryData(['users', assigneeId, 'tasks']);
    const previousUsers = queryClient.getQueryData(['users']);
    
    // Update task
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old?.map(task => 
        task.id === taskId ? { ...task, assigneeId } : task
      )
    );
    
    // Update user's task count
    queryClient.setQueryData(['users'], (old: User[]) =>
      old?.map(user => 
        user.id === assigneeId 
          ? { ...user, taskCount: (user.taskCount || 0) + 1 }
          : user
      )
    );
    
    return { previousTasks, previousUserTasks, previousUsers };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['tasks'], context?.previousTasks);
    queryClient.setQueryData(['users', variables.assigneeId, 'tasks'], context?.previousUserTasks);
    queryClient.setQueryData(['users'], context?.previousUsers);
  },
  onSettled: (_, __, variables) => {
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['users', variables.assigneeId, 'tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ]);
  },
});
```

## UI Feedback Patterns

### 1. Loading States
```typescript
// ✅ CORRECT - Show loading state during optimistic update
const TaskItem = ({ task }: { task: Task }) => {
  const updateMutation = useMutation({
    mutationFn: updateTask,
    onMutate: async (newTask) => {
      // ... optimistic update logic
    },
  });

  const isLoading = updateMutation.isPending;

  return (
    <div className={`task-item ${isLoading ? 'opacity-50' : ''}`}>
      <h3>{task.title}</h3>
      <button
        onClick={() => updateMutation.mutate({ ...task, completed: !task.completed })}
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Toggle Complete'}
      </button>
    </div>
  );
};
```

### 2. Error Indicators
```typescript
// ✅ CORRECT - Show error state when optimistic update fails
const TaskItem = ({ task }: { task: Task }) => {
  const [showError, setShowError] = useState(false);
  
  const updateMutation = useMutation({
    mutationFn: updateTask,
    onMutate: async (newTask) => {
      setShowError(false);
      // ... optimistic update logic
    },
    onError: () => {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    },
  });

  return (
    <div className="task-item">
      <h3>{task.title}</h3>
      <button onClick={() => updateMutation.mutate(task)}>
        Update Task
      </button>
      {showError && (
        <div className="error-message">
          Failed to update task. Please try again.
        </div>
      )}
    </div>
  );
};
```

### 3. Success Feedback
```typescript
// ✅ CORRECT - Show success confirmation
const TaskItem = ({ task }: { task: Task }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  
  const updateMutation = useMutation({
    mutationFn: updateTask,
    onMutate: async (newTask) => {
      // ... optimistic update logic
    },
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    },
  });

  return (
    <div className="task-item">
      <h3>{task.title}</h3>
      <button onClick={() => updateMutation.mutate(task)}>
        Update Task
      </button>
      {showSuccess && (
        <div className="success-message">
          Task updated successfully!
        </div>
      )}
    </div>
  );
};
```

## Testing Optimistic Updates

### 1. Unit Testing
```typescript
// ✅ CORRECT - Testing optimistic update behavior
describe('updateTaskMutation', () => {
  it('should update cache optimistically', async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(['tasks'], [mockTask]);
    
    const { result } = renderHook(() => useUpdateTaskMutation(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    act(() => {
      result.current.mutate({ ...mockTask, title: 'Updated Title' });
    });

    // Check optimistic update
    const tasks = queryClient.getQueryData(['tasks']);
    expect(tasks).toContainEqual(
      expect.objectContaining({ title: 'Updated Title' })
    );
  });

  it('should rollback on error', async () => {
    const queryClient = createQueryClient();
    const originalTasks = [mockTask];
    queryClient.setQueryData(['tasks'], originalTasks);
    
    const { result } = renderHook(() => useUpdateTaskMutation(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    // Mock failed mutation
    mutateTask.mockRejectedValue(new Error('Update failed'));

    act(() => {
      result.current.mutate({ ...mockTask, title: 'Updated Title' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check rollback
    const tasks = queryClient.getQueryData(['tasks']);
    expect(tasks).toEqual(originalTasks);
  });
});
```

### 2. Integration Testing
```typescript
// ✅ CORRECT - Testing complete optimistic update flow
describe('TaskList with Optimistic Updates', () => {
  it('should show immediate feedback on task update', async () => {
    const { getByText, queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <TaskList />
      </QueryClientProvider>
    );

    // Initial state
    expect(getByText('Task 1')).toBeInTheDocument();

    // Click update button
    const updateButton = getByText('Update');
    fireEvent.click(updateButton);

    // Should show optimistic update immediately
    expect(getByText('Updated Task 1')).toBeInTheDocument();
    expect(queryByText('Task 1')).not.toBeInTheDocument();

    // Wait for server response
    await waitFor(() => {
      expect(getByText('Task updated successfully!')).toBeInTheDocument();
    });
  });
});
```

## Performance Considerations

### 1. Query Cancellation
Always cancel outgoing queries before optimistic updates:

```typescript
// ✅ CORRECT - Cancel queries before update
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: ['items'] });
  // ... optimistic update logic
}

// ❌ INCORRECT - Not canceling queries
onMutate: async (newData) => {
  // Race condition possible
  queryClient.setQueryData(['items'], newData);
}
```

### 2. Selective Invalidation
Invalidate only affected queries:

```typescript
// ✅ CORRECT - Targeted invalidation
onSettled: (_, __, variables) => {
  queryClient.invalidateQueries({ 
    queryKey: ['items', variables.category] 
  });
}

// ❌ INCORRECT - Broad invalidation
onSettled: () => {
  queryClient.invalidateQueries(); // Invalidates everything
}
```

### 3. Memory Management
Clean up optimistic data properly:

```typescript
// ✅ CORRECT - Clean up temporary data
onSuccess: (serverData, variables, context) => {
  // Replace optimistic data with server data
  queryClient.setQueryData(['items'], (old: Item[]) =>
    old?.map(item => 
      item.id.startsWith('temp-') ? serverData : item
    )
  );
}

// ❌ INCORRECT - Leaving temporary data
onSuccess: (serverData) => {
  // Temporary data remains in cache
  queryClient.invalidateQueries(['items']);
}
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't optimistically update critical data**: Payments, security settings
- **Don't ignore error handling**: Always implement rollback
- **Don't forget to cancel queries**: Prevent race conditions
- **Don't use stale data**: Ensure cache is fresh before updates
- **Don't over-optimize**: Not every operation needs optimistic updates

### 2. Common Mistakes
```typescript
// ❌ WRONG - No rollback mechanism
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    queryClient.setQueryData(['items'], (old: Item[]) =>
      old?.map(item => item.id === newItem.id ? newItem : item)
    );
  },
  // Missing onError - no rollback!
});

// ❌ WRONG - Not canceling queries
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    // Race condition: old data might arrive after optimistic update
    queryClient.setQueryData(['items'], newItem);
  },
});

// ❌ WRONG - Updating wrong query keys
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    // Wrong query key - won't affect the UI
    queryClient.setQueryData(['wrong-key'], newItem);
  },
});
```

## Best Practices Checklist

- [ ] Always implement rollback mechanism in `onError`
- [ ] Cancel relevant queries in `onMutate`
- [ ] Use `onSettled` to refetch and ensure consistency
- [ ] Provide loading states during mutation
- [ ] Show error messages when updates fail
- [ ] Show success confirmations when appropriate
- [ ] Test both success and failure scenarios
- [ ] Use targeted invalidation instead of broad invalidation
- [ ] Clean up temporary data after successful mutations
- [ ] Consider network conditions and user experience
- [ ] Don't optimistically update critical operations
- [ ] Use proper TypeScript types for mutation data
- [ ] Implement proper error boundaries
- [ ] Monitor mutation success rates
- [ ] Document optimistic update behavior for users
