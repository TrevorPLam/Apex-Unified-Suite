---
trigger: glob
globs: artifacts/apex-os/src/pages/**/*.tsx
---

# Frontend API Integration Rules

## React Query Usage

- Import React Query hooks from `@workspace/api-client-react`
- Use generated hooks, never manual fetch calls
- Handle loading states with `isLoading` from hooks
- Handle error states with `error` from hooks
- Implement proper error boundaries around page components
- Use optimistic updates for mutations where appropriate
- Never import from `mockData.ts` in production code

## Data Fetching Patterns

```typescript
// Correct pattern
const { data: contacts, isLoading, error } = useContactsQuery({
  page: currentPage,
  search: searchTerm,
});

// Loading state
if (isLoading) return <ContactListSkeleton />;

// Error state  
if (error) return <ErrorMessage error={error} />;

// Success state
return <ContactList contacts={contacts || []} />;
```

## Mutation Patterns

- Use generated mutation hooks from `@workspace/api-client-react`
- Include success/error handling with `onSuccess`/`onError`
- Use `onMutate` for optimistic updates
- Invalidate related queries after successful mutations
- Show user feedback with toast notifications
- Handle loading states during mutations

## Error Handling

- Wrap pages in ErrorBoundary components
- Show user-friendly error messages
- Include retry mechanisms for failed requests
- Log errors appropriately for debugging
- Handle network errors gracefully
- Provide fallback UI for failed states

## Loading States

- Use Skeleton components for initial loading
- Show loading indicators for data mutations
- Implement progressive loading for large datasets
- Use shimmer effects for better UX
- Avoid blocking UI during data fetching
- Show loading states for form submissions

## Pagination Implementation

- Use `usePaginatedData` hook for list endpoints
- Implement proper pagination controls
- Maintain page state in URL parameters
- Handle empty states gracefully
- Show total count and page information
- Support infinite scroll when appropriate

## Search and Filtering

- Debounce search inputs (300ms delay)
- Update URL parameters for shareable links
- Clear search when navigating away
- Support multiple filter criteria
- Show search loading states
- Handle search result highlighting

## Form Integration

- Use React Hook Form with Zod resolvers
- Validate forms with generated schemas
- Handle form submission with mutations
- Show loading states during submission
- Reset forms after successful submission
- Include proper error messages for validation

## State Management

- Use React Query for server state
- Use local state for UI state only
- Avoid global state for component-specific data
- Use Context API for authentication/user data
- Implement proper cache invalidation
- Use optimistic updates for better UX

## Performance Optimization

- Implement React.memo for expensive components
- Use useMemo/useCallback appropriately
- Lazy load routes with React.lazy()
- Implement virtual scrolling for large lists
- Use proper dependency arrays
- Avoid unnecessary re-renders

## Code Organization

- Keep API logic separate from UI components
- Use custom hooks for complex data operations
- Group related queries together
- Use consistent naming conventions
- Implement proper TypeScript types
- Keep components focused and reusable

## Testing Requirements

- Test components with React Testing Library
- Mock API calls in unit tests
- Test loading and error states
- Test user interactions and mutations
- Include integration tests for data flows
- Test error boundary behavior

## Security Considerations

- Never expose sensitive data in client-side code
- Use proper authentication token management
- Implement proper logout functionality
- Handle token expiration gracefully
- Validate data on client and server
- Use HTTPS in production

## Accessibility Requirements

- Include proper ARIA labels for dynamic content
- Implement keyboard navigation
- Provide screen reader support for loading states
- Use semantic HTML elements
- Include focus management for modals
- Test with accessibility tools

## Development Workflow

1. Replace mock data imports with React Query hooks
2. Add proper loading and error states
3. Implement optimistic updates for mutations
4. Add proper error boundaries
5. Test with various data scenarios
6. Update TypeScript types if needed
7. Run typecheck to validate integration

## Migration from Mock Data

- Remove imports from `mockData.ts`
- Add React Query hooks for data fetching
- Update component props to handle async data
- Add loading skeleton components
- Implement error handling and retry logic
- Test with real API endpoints
- Update documentation and comments
