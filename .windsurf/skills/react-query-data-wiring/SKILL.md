---
name: react-query-data-wiring
description: Complete guide for replacing static mock data with Orval-generated TanStack Query hooks, including loading states, error handling, and cache invalidation patterns
---

# React Query Data Wiring Skill

## Purpose
Transform components from using static mock data to real API integration using Orval-generated TanStack Query hooks. This skill ensures consistent patterns across all 20+ Phase 5 frontend integration tasks.

## Pre-requisites
- OpenAPI spec updated with required endpoints
- Code generation run: `pnpm --filter @workspace/api-spec run codegen`
- Generated hooks available in `@workspace/api-client-react`

## Implementation Pattern

### 1. Identify Static Mock Usage
Search for imports from mock data files:
```bash
grep -r "mockData\|src/data" artifacts/apex-os/src/
```

### 2. Replace with Generated Hook
**Before (Static Mock):**
```typescript
import { mockContacts } from '@/data/mockData';

export function ContactsPage() {
  const contacts = mockContacts;
  
  return (
    <div>
      {contacts.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
```

**After (Generated Hook):**
```typescript
import { useListContacts } from '@workspace/api-client-react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { toast } from 'sonner';

export function ContactsPage() {
  const { data: contacts, isLoading, error } = useListContacts({
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Error handling with toast feedback
  if (error) {
    toast.error('Failed to load contacts');
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-red-600">Error loading contacts</h2>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  // Consistent loading state
  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div>
      {contacts?.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
```

### 3. Mutation Patterns with Cache Invalidation
```typescript
import { useCreateContact, useListContacts } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export function CreateContactForm() {
  const queryClient = useQueryClient();
  
  const createContactMutation = useCreateContact({
    onSuccess: () => {
      // Invalidate and refetch contacts list
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create contact');
      console.error('Create contact error:', error);
    },
  });

  const handleSubmit = (data: CreateContactData) => {
    createContactMutation.mutate(data);
  };

  return (
    // Form implementation
  );
}
```

## Standard Patterns

### Loading States
- **Always** use `PageSkeleton` for primary loading states
- Use `isLoading` for initial data fetch
- Use `isPending` for mutation operations
- Show skeleton for entire page layout, not individual components

### Error Handling
- **Always** show user-friendly error messages with `toast.error()`
- Log technical errors to console
- Provide retry mechanisms where appropriate
- Never expose raw error objects to users

### Cache Configuration
```typescript
// Standard staleTime configurations
const CACHE_TIMES = {
  SHORT: 60 * 1000,        // 1 minute - frequently changing data
  MEDIUM: 5 * 60 * 1000,    // 5 minutes - standard business data
  LONG: 15 * 60 * 1000,     // 15 minutes - reference data
  VERY_LONG: 60 * 60 * 1000, // 1 hour - static configuration
};

// Usage example
const { data } = useListContacts({
  staleTime: CACHE_TIMES.MEDIUM,
});
```

### Query Invalidation Patterns
```typescript
// Invalidate single query
queryClient.invalidateQueries({ queryKey: ['contacts'] });

// Invalidate multiple related queries
queryClient.invalidateQueries({ 
  queryKey: ['crm'] // Invalidates all queries starting with 'crm'
});

// Optimistic updates (see optimistic-mutation-pattern skill)
```

## Component Checklist

For each component converted:

- [ ] Remove static mock imports
- [ ] Import generated hook from `@workspace/api-client-react`
- [ ] Add proper TypeScript types from generated schemas
- [ ] Implement loading state with `PageSkeleton`
- [ ] Add error handling with toast notifications
- [ ] Configure appropriate `staleTime`
- [ ] Add query invalidation after mutations
- [ ] Test loading, error, and success states
- [ ] Verify accessibility with loading states

## Common Pitfalls

### ❌ Incorrect Patterns
```typescript
// Don't use conditional hook calls
if (someCondition) {
  const { data } = useListContacts(); // WRONG
}

// Don't ignore loading states
const { data } = useListContacts(); // Missing isLoading, error

// Don't use manual fetch
const [contacts, setContacts] = useState([]);
useEffect(() => {
  fetch('/api/contacts').then(setContacts); // WRONG - use generated hook
}, []);
```

### ✅ Correct Patterns
```typescript
// Always destructure all hook returns
const { data, isLoading, error, refetch } = useListContacts();

// Use proper error boundaries
if (error) return <ErrorState error={error} />;
if (isLoading) return <PageSkeleton />;

// Follow hook rules of hooks
const Component = () => {
  const { data } = useListContacts(); // OK - top level
  // ...
};
```

## Testing Considerations

### Unit Tests
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListContacts } from '@workspace/api-client-react';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

test('should load contacts successfully', async () => {
  const queryClient = createTestQueryClient();
  
  const { result } = renderHook(() => useListContacts(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });

  expect(result.current.isLoading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

## Verification Commands

After completing data wiring for a component:

```bash
# Type check
pnpm run typecheck

# Run tests
pnpm test

# Check for remaining mock imports
grep -r "mockData\|src/data" artifacts/apex-os/src/ || echo "No mock imports found"

# Verify generated hooks are used
grep -r "@workspace/api-client-react" artifacts/apex-os/src/
```

## Supporting Files

### PageSkeleton Component
Ensure this component exists and is used consistently:
```typescript
// artifacts/apex-os/src/components/PageSkeleton.tsx
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-300 rounded w-1/4"></div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-300 rounded"></div>
        ))}
      </div>
    </div>
  );
}
```

### ErrorState Component
```typescript
// artifacts/apex-os/src/components/ErrorState.tsx
interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-lg font-semibold text-red-600 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-600 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
```

## Migration Strategy

1. **Start with read-only operations** - Replace mock data with query hooks
2. **Add mutations** - Implement create/update/delete operations
3. **Add optimistic updates** - Use optimistic-mutation-pattern skill
4. **Test thoroughly** - Verify all states and error conditions
5. **Remove unused mock data** - Clean up old mock files

This skill ensures consistent, production-ready data integration across all frontend components in the Apex Unified Suite.
