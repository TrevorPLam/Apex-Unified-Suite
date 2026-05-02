---
trigger: glob
globs: **/*.tsx
description: React Query conventions and best practices for consistent data fetching patterns
---

# React Query Conventions

## Core Principles

### Query Key Patterns
- **Always use descriptive keys**: `['users', userId]` instead of `['data']`
- **Include all dependencies in key array**: Variables that affect the query result
- **Use hierarchical structure**: `['projects', projectId, 'tasks']` for nested data
- **Consistent ordering**: Maintain same parameter order across components

### Query Configuration Standards
```typescript
// ✅ CORRECT - Standard query configuration
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
  refetchOnWindowFocus: false,
});

// ❌ INCORRECT - Missing configuration
const { data } = useQuery(['users'], () => fetchUsers());
```

### Mutation Patterns
```typescript
// ✅ CORRECT - Optimistic updates with rollback
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    await queryClient.cancelQueries(['users']);
    const previousUsers = queryClient.getQueryData(['users']);
    queryClient.setQueryData(['users'], (old: User[]) => 
      old?.map(user => user.id === newUser.id ? newUser : user)
    );
    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    queryClient.setQueryData(['users'], context?.previousUsers);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['users']);
  },
});

// ❌ INCORRECT - No error handling or cache updates
const mutation = useMutation({ mutationFn: updateUser });
```

## Required Patterns

### 1. Query Key Factory
Create a centralized query key factory for consistency:

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (status: string) => [...queryKeys.projects.lists(), { status }] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    tasks: (projectId: string) => [...queryKeys.projects.detail(projectId), 'tasks'] as const,
  },
};
```

### 2. Error Handling
Always handle loading and error states:

```typescript
// ✅ CORRECT - Complete error handling
const { data: users, isLoading, error, refetch } = useQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: fetchUsers,
});

if (isLoading) return <UsersSkeleton />;
if (error) return <ErrorMessage error={error} retry={refetch} />;
return <UsersList users={users} />;

// ❌ INCORRECT - No error handling
const { data: users } = useQuery(['users'], fetchUsers);
return <UsersList users={users} />;
```

### 3. Infinite Queries
Use proper infinite query patterns:

```typescript
// ✅ CORRECT - Infinite query with proper structure
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: ({ pageParam = 0 }) => fetchUsers({ page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPage,
  initialPageParam: 0,
});

// ❌ INCORRECT - Missing infinite query structure
const { data } = useInfiniteQuery(['users'], fetchUsers);
```

### 4. Prefetching
Implement strategic prefetching:

```typescript
// ✅ CORRECT - Prefetch related data
const queryClient = useQueryClient();

const handleUserClick = (userId: string) => {
  // Prefetch user details
  queryClient.prefetchQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => fetchUser(userId),
    staleTime: 30 * 1000, // 30 seconds
  });
  
  // Navigate to user details page
  navigate(`/users/${userId}`);
};
```

## Performance Optimizations

### 1. Selective Updates
Use `select` to transform data efficiently:

```typescript
// ✅ CORRECT - Select only needed data
const { data: userName } = useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
  select: (user) => user.name, // Only store name in cache
});

// ❌ INCORRECT - Fetching entire user object when only name needed
const { data: user } = useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
});
const userName = user?.name;
```

### 2. Background Refetching
Configure appropriate refetching behavior:

```typescript
// ✅ CORRECT - Configured refetching
useQuery({
  queryKey: queryKeys.users.lists(),
  queryFn: fetchUsers,
  refetchOnWindowFocus: false, // Don't refetch on window focus
  refetchOnReconnect: true, // Refetch on reconnect
  refetchInterval: false, // Don't refetch on interval
  staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
});

// ❌ INCORRECT - Excessive refetching
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  refetchOnWindowFocus: true, // Unnecessary refetches
  refetchInterval: 30 * 1000, // Too frequent
});
```

### 3. Dependent Queries
Handle dependent queries properly:

```typescript
// ✅ CORRECT - Dependent query with enabled option
const { data: user } = useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
  enabled: !!userId, // Only run when userId exists
});

const { data: projects } = useQuery({
  queryKey: queryKeys.projects.list(user?.id),
  queryFn: () => fetchUserProjects(user.id),
  enabled: !!user?.id, // Depends on user data
});
```

## Cache Management

### 1. Invalidation Strategy
Implement smart cache invalidation:

```typescript
// ✅ CORRECT - Targeted invalidation
const createUserMutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // Invalidate only affected queries
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    // Don't invalidate user details queries
  },
});

// ❌ INCORRECT - Broad invalidation
const createUserMutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries(); // Invalidates everything
  },
});
```

### 2. Cache Updates
Use precise cache updates:

```typescript
// ✅ CORRECT - Precise cache update
const updateUserMutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (updatedUser) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });
    
    const previousUsers = queryClient.getQueryData(queryKeys.users.lists());
    
    queryClient.setQueryData(queryKeys.users.lists(), (old: User[]) => 
      old?.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
    
    return { previousUsers };
  },
  onError: (err, updatedUser, context) => {
    queryClient.setQueryData(queryKeys.users.lists(), context?.previousUsers);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
  },
});
```

## Testing Patterns

### 1. Query Testing
Test queries with proper mocking:

```typescript
// ✅ CORRECT - Query testing with mock data
describe('useUserQuery', () => {
  it('should return user data', async () => {
    const { result } = renderHook(() => useUserQuery('user-123'), {
      wrapper: QueryClientProvider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useUserQuery('user-123'), {
      wrapper: QueryClientProvider,
    });

    expect(result.current.isLoading).toBe(true);
  });
});
```

### 2. Mutation Testing
Test mutations with proper verification:

```typescript
// ✅ CORRECT - Mutation testing
describe('createUserMutation', () => {
  it('should create user and update cache', async () => {
    const { result } = renderHook(() => useCreateUserMutation(), {
      wrapper: QueryClientProvider,
    });

    result.current.mutate(mockUserData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify cache was updated
    const queryClient = getQueryClient();
    const users = queryClient.getQueryData(queryKeys.users.lists());
    expect(users).toContainEqual(expect.objectContaining(mockUserData));
  });
});
```

## Anti-Patterns

### 1. Never Do These
- **Don't use inline query functions**: This breaks caching
- **Don't ignore loading/error states**: Always handle these states
- **Don't use `useQuery` for mutations**: Use `useMutation` instead
- **Don't invalidate entire cache**: Be specific about what to invalidate
- **Don't fetch in useEffect**: Use query dependencies instead

### 2. Common Mistakes
```typescript
// ❌ WRONG - Inline function breaks caching
useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()), // Inline function
});

// ✅ CORRECT - Stable function reference
useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId), // Stable function
});

// ❌ WRONG - Fetching in useEffect
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);

// ✅ CORRECT - Let React Query handle dependencies
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId,
});
```

## Configuration Standards

### 1. Global Query Client
Configure global defaults:

```typescript
// src/lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 2. Error Boundaries
Wrap queries in error boundaries:

```typescript
// ✅ CORRECT - Error boundary for queries
<QueryErrorBoundary>
  <UserProfile userId={userId} />
</QueryErrorBoundary>

// ❌ INCORRECT - No error handling
<UserProfile userId={userId} />
```

## Monitoring and Debugging

### 1. DevTools Integration
Always use React Query DevTools in development:

```typescript
// ✅ CORRECT - DevTools setup
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Query Logging
Implement query logging for debugging:

```typescript
// ✅ CORRECT - Query logging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data, query) => {
        console.log(`Query ${query.queryKey[0]} succeeded`);
      },
      onError: (error, query) => {
        console.error(`Query ${query.queryKey[0]} failed:`, error);
      },
    },
  },
});
```

## Compliance Checklist

- [ ] Use descriptive query keys with hierarchical structure
- [ ] Handle all loading and error states
- [ ] Implement proper optimistic updates with rollback
- [ ] Use targeted cache invalidation
- [ ] Configure appropriate stale time and cache time
- [ ] Test queries and mutations properly
- [ ] Use error boundaries for query error handling
- [ ] Implement proper dependent queries
- [ ] Use stable function references for query functions
- [ ] Configure global query client defaults
- [ ] Use React Query DevTools in development
- [ ] Implement proper infinite query patterns
- [ ] Use selective data transformation with `select`
- [ ] Implement strategic prefetching
- [ ] Follow proper mutation patterns with error handling
