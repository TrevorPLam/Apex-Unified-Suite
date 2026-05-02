---
trigger: glob
globs: **/*.tsx
description: Prohibit static mock data in production code - use API-first development with React Query
---

# No Static Mock Data Rule

## Core Principle

### API-First Development Mandate
All frontend components must use real API data through React Query hooks. Static mock data is only allowed in:
- Development environments (when API is not ready)
- Storybook stories
- Unit tests
- Design system components

### Why This Rule Exists
- **Type Safety**: Generated hooks provide end-to-end type safety
- **Data Consistency**: Single source of truth prevents data drift
- **Real-world Testing**: Components work with actual data structures
- **Maintainability**: No duplicate data definitions
- **Performance**: Proper caching and loading states

## Required Implementation Pattern

### 1. Use Generated React Query Hooks
```typescript
// ✅ CORRECT - Using generated hooks
import { useListUsers, useGetUser } from '@workspace/api-client-react';

function UserList() {
  const { data: users, isLoading, error } = useListUsers();
  
  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

// ❌ INCORRECT - Static mock data
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

function UserList() {
  return (
    <div>
      {mockUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 2. Proper Loading States
```typescript
// ✅ CORRECT - Handle loading states
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useGetUser(userId);
  
  if (isLoading) {
    return <UserProfileSkeleton />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  return <UserProfileContent user={user} />;
}

// ❌ INCORRECT - No loading state
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useGetUser(userId);
  
  // Returns undefined during loading
  return <UserProfileContent user={user} />;
}
```

### 3. Error Handling
```typescript
// ✅ CORRECT - Proper error handling
function TaskList() {
  const { data: tasks, isLoading, error, refetch } = useListTasks();
  
  if (isLoading) return <TaskListSkeleton />;
  
  if (error) {
    return (
      <ErrorState 
        error={error}
        onRetry={refetch}
        title="Failed to load tasks"
      />
    );
  }
  
  return <TaskListContent tasks={tasks} />;
}

// ❌ INCORRECT - No error handling
function TaskList() {
  const { data: tasks } = useListTasks();
  
  // Error state not handled
  return <TaskListContent tasks={tasks} />;
}
```

## Development Exception Pattern

### 1. Environment-Based Mocking
```typescript
// ✅ CORRECT - Environment-based conditional
const useUsersForDevelopment = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isApiReady = import.meta.env.VITE_API_READY === 'true';
  
  const { data: users, isLoading, error } = useListUsers({
    enabled: isApiReady || !isDevelopment,
  });

  // Use mock data only in development when API is not ready
  if (isDevelopment && !isApiReady) {
    return {
      data: mockUsers,
      isLoading: false,
      error: null,
    };
  }

  return { data: users, isLoading, error };
};

function UserList() {
  const { data: users, isLoading, error } = useUsersForDevelopment();
  
  // Component logic remains the same
  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 2. Feature Flag Controlled Mocking
```typescript
// ✅ CORRECT - Feature flag controlled
function UserList() {
  const { enabled: useApi } = useFeatureFlag('api-integration');
  
  const { data: users, isLoading, error } = useListUsers({
    enabled: useApi,
  });

  // Fallback to mock data when feature flag is disabled
  const displayData = useApi ? users : mockUsers;
  
  if (isLoading && useApi) return <UserListSkeleton />;
  if (error && useApi) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {displayData?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Testing Exception Pattern

### 1. Unit Test Mocking
```typescript
// ✅ CORRECT - Proper test mocking
describe('UserList', () => {
  it('should display users', () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
    ];

    const queryClient = createQueryClient();
    queryClient.setQueryData(['users'], mockUsers);

    render(
      <QueryClientProvider client={queryClient}>
        <UserList />
      </QueryClientProvider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});

// ❌ INCORRECT - Static mock in component
function UserList() {
  // This should not be in production code
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
  ];
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 2. Storybook Stories
```typescript
// ✅ CORRECT - Storybook with mock data
const meta: Meta<typeof UserList> = {
  title: 'Components/UserList',
  component: UserList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

const Template: StoryFn<typeof UserList> = (args) => {
  const queryClient = createQueryClient();
  queryClient.setQueryData(['users'], args.users);

  return (
    <QueryClientProvider client={queryClient}>
      <UserList />
    </QueryClientProvider>
  );
};

export const Default = Template.bind({});
Default.args = {
  users: [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ],
};
```

## Data Structure Validation

### 1. Use Generated Types
```typescript
// ✅ CORRECT - Use generated types
import { User, Task } from '@workspace/api-zod';

function UserCard({ user }: { user: User }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {/* Type-safe access to user properties */}
    </div>
  );
}

// ❌ INCORRECT - Manual type definitions
interface User {
  id: string;
  name: string;
  email: string;
}

function UserCard({ user }: { user: User }) {
  // Type might drift from API schema
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 2. Validate Data Shape
```typescript
// ✅ CORRECT - Validate with generated schemas
import { userSchema } from '@workspace/api-zod';

function UserCard({ user }: { user: unknown }) {
  const result = userSchema.safeParse(user);
  
  if (!result.success) {
    console.error('Invalid user data:', result.error);
    return <div>Invalid user data</div>;
  }
  
  const validUser = result.data;
  return (
    <div>
      <h2>{validUser.name}</h2>
      <p>{validUser.email}</p>
    </div>
  );
}

// ❌ INCORRECT - Assume data shape
function UserCard({ user }: { user: any }) {
  // No validation - could cause runtime errors
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

## Migration Strategy

### 1. Gradual Migration Approach
```typescript
// ✅ CORRECT - Migration wrapper
function useMigratedData<T>(
  useRealHook: () => { data?: T; isLoading: boolean; error: Error | null },
  mockData: T,
  isMigrated: boolean = false
) {
  const realData = useRealHook();
  
  if (isMigrated) {
    return realData;
  }
  
  // Return mock data during migration
  return {
    data: mockData,
    isLoading: false,
    error: null,
  };
}

// Usage during migration
function UserList() {
  const { data: users, isLoading, error } = useMigratedData(
    () => useListUsers(),
    mockUsers,
    import.meta.env.VITE_USERS_API_MIGRATED === 'true'
  );
  
  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 2. Feature-by-Feature Migration
```typescript
// ✅ CORRECT - Feature flag per component
function ComponentWithMigration() {
  const { enabled: useRealApi } = useFeatureFlag('component-api-migration');
  
  const realData = useRealApi ? useListUsers() : { data: undefined, isLoading: false, error: null };
  const displayData = useRealApi ? realData.data : mockUsers;
  
  if (useRealApi && realData.isLoading) return <Skeleton />;
  if (useRealApi && realData.error) return <ErrorMessage error={realData.error} />;
  
  return <ComponentContent data={displayData} />;
}
```

## Performance Considerations

### 1. Proper Caching
```typescript
// ✅ CORRECT - Configure caching
function UserList() {
  const { data: users, isLoading, error } = useListUsers({
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Component logic
}

// ❌ INCORRECT - No caching, always fetching
function UserList() {
  const { data: users, isLoading, error } = useListUsers();
  
  // Component logic
}
```

### 2. Prefetching Strategy
```typescript
// ✅ CORRECT - Strategic prefetching
function UserDashboard() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Prefetch data that will be needed
    queryClient.prefetchQuery({
      queryKey: ['users'],
      queryFn: fetchUsers,
      staleTime: 30 * 1000,
    });
  }, [queryClient]);
  
  return <DashboardContent />;
}

// ❌ INCORRECT - No prefetching, loading delays
function UserDashboard() {
  return <DashboardContent />; // Will fetch when needed
}
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't hardcode data in components**: Use API hooks
- **Don't create duplicate data structures**: Use generated types
- **Don't ignore loading/error states**: Handle all states
- **Don't use mock data in production**: Only for development/testing
- **Don't skip API integration**: Complete the API-first workflow

### 2. Common Mistakes
```typescript
// ❌ WRONG - Static data in component
const TaskList = () => {
  const tasks = [
    { id: '1', title: 'Task 1', status: 'todo' },
    { id: '2', title: 'Task 2', status: 'done' },
  ];
  
  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};

// ❌ WRONG - Mixed static and API data
const TaskList = () => {
  const { data: apiTasks } = useListTasks();
  const staticTasks = [
    { id: 'static-1', title: 'Static Task', status: 'todo' },
  ];
  
  const allTasks = [...(apiTasks || []), ...staticTasks];
  
  return (
    <div>
      {allTasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};

// ❌ WRONG - Conditional API calls without proper handling
const TaskList = () => {
  const shouldUseApi = Math.random() > 0.5;
  
  const { data: tasks } = useListTasks({
    enabled: shouldUseApi,
  });
  
  if (!shouldUseApi) {
    // Returns undefined, no fallback
    return <div>No data available</div>;
  }
  
  return (
    <div>
      {tasks?.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};
```

## Development Guidelines

### 1. When API Is Not Ready
```typescript
// ✅ CORRECT - Development placeholder
function UserList() {
  const isApiReady = import.meta.env.VITE_API_READY === 'true';
  
  const { data: users, isLoading, error } = useListUsers({
    enabled: isApiReady,
    retry: isApiReady ? 3 : false,
  });

  if (!isApiReady) {
    return (
      <div className="api-unavailable">
        <h3>API Not Available</h3>
        <p>This component is waiting for API integration.</p>
        <UserListSkeleton />
      </div>
    );
  }

  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 2. Mock Server Integration
```typescript
// ✅ CORRECT - Mock server for development
import { setupMockServer } from './mock-server';

// In development setup
if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_USE_MOCK_API === 'true') {
  setupMockServer();
}

// Component remains the same - uses real API hooks
function UserList() {
  const { data: users, isLoading, error } = useListUsers();
  
  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Compliance Checklist

- [ ] All components use generated React Query hooks
- [ ] Loading states are properly handled
- [ ] Error states are properly handled
- [ ] Generated types are used instead of manual types
- [ ] No static mock data in production code
- [ ] API integration follows API-first development
- [ ] Proper caching is configured
- [ ] Data validation uses generated schemas
- [ ] Feature flags control API availability during migration
- [ ] Mock data is only in tests, Storybook, or development
- [ ] Components work with real API data structures
- [ ] Proper error boundaries are implemented
- [ ] Performance considerations are addressed
- [ ] Migration strategy is documented
- [ ] Development environment is properly configured
