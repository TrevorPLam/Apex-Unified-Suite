---
trigger: glob
globs: artifacts/apex-os/src/**/*.tsx
---

# Component Development Rules

Enforce consistent React component development patterns for the Apex Unified Suite frontend.

## Component Structure

### **File Organization**
```typescript
// Component file structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useListContacts } from '@workspace/api-client-react';

interface ComponentProps {
  // Component props here
}

export function ComponentName({ prop }: ComponentProps) {
  // Hooks and state
  // Business logic
  // Render JSX
}

export default ComponentName;
```

### **Import Order**
1. React imports
2. Third-party library imports (React Query, etc.)
3. shadcn/ui component imports
4. Custom hooks and contexts
5. Generated API hooks
6. Utility functions
7. Types and interfaces

## TypeScript Requirements

### **Component Props**
- Always define explicit prop interfaces
- Use proper TypeScript types for all props
- Include optional properties with `?` syntax
- Default props should be handled in component logic

### **Type Safety**
- Never use `any` type
- Use generated types from API hooks
- Define proper return types for custom hooks
- Use type guards for conditional rendering

## React Query Integration

### **Data Fetching Patterns**
```typescript
// ✅ Correct pattern
export function ContactsList() {
  const { data: contacts, isLoading, error, refetch } = useListContacts({
    page: 1,
    limit: 20,
  });

  if (isLoading) return <ContactsSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!contacts) return <EmptyState />;

  return (
    <div>
      {contacts.data.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
```

### **Mutation Patterns**
```typescript
// ✅ Correct mutation pattern
export function CreateContactModal({ isOpen, onClose }: CreateContactModalProps) {
  const createContact = useCreateContact();
  
  const handleSubmit = async (data: ContactFormData) => {
    try {
      await createContact.mutateAsync(data);
      onClose();
      toast.success('Contact created successfully');
    } catch (error) {
      toast.error('Failed to create contact');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ContactForm onSubmit={handleSubmit} isLoading={createContact.isPending} />
    </Modal>
  );
}
```

## Accessibility Requirements

### **WCAG 2.2 AA Compliance**
- All interactive elements have accessible names
- Proper heading hierarchy (h1-h6)
- Keyboard navigation support
- Focus indicators are visible
- ARIA labels for complex components
- Color contrast meets 4.5:1 minimum

### **Accessibility Patterns**
```typescript
// ✅ Accessible button
<Button
  onClick={handleClick}
  aria-label="Delete contact"
  disabled={isDeleting}
>
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Delete contact</span>
</Button>

// ✅ Accessible form field
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    required
    aria-describedby="email-error"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-destructive">
      {errors.email.message}
    </p>
  )}
</div>
```

## Error Handling

### **Error Boundaries**
- Wrap components in error boundaries
- Provide fallback UI for errors
- Log errors appropriately
- Allow users to recover from errors

### **Loading States**
- Show skeleton loaders for data fetching
- Provide loading indicators for actions
- Disable buttons during mutations
- Show progress for long-running operations

### **Error Display**
```typescript
// ✅ Error handling pattern
export function DataComponent() {
  const { data, isLoading, error } = useGetData();

  if (isLoading) return <SkeletonLoader />;
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load data'}
        </AlertDescription>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return <ComponentWithData data={data} />;
}
```

## Performance Optimization

### **Component Optimization**
- Use `React.memo()` for expensive components
- Implement proper dependency arrays in hooks
- Avoid unnecessary re-renders
- Use `useCallback()` for event handlers

### **Code Splitting**
```typescript
// ✅ Lazy loading patterns
import { lazy } from 'react';

const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const CRMPage = lazy(() => import('@/pages/CRM'));

// Use with Suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/crm" element={<CRMPage />} />
  </Routes>
</Suspense>
```

## UI Component Usage

### **shadcn/ui Components**
- Use shadcn/ui components consistently
- Follow established design patterns
- Customize with CSS variables when needed
- Maintain visual consistency

### **Component Patterns**
```typescript
// ✅ Card pattern
<Card>
  <CardHeader>
    <CardTitle>Contact Information</CardTitle>
    <CardDescription>View and edit contact details</CardDescription>
  </CardHeader>
  <CardContent>
    <ContactForm />
  </CardContent>
</Card>

// ✅ Form pattern
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="firstName">First Name</Label>
      <Input id="firstName" {...register('firstName')} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">Last Name</Label>
      <Input id="lastName" {...register('lastName')} />
    </div>
  </div>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Saving...' : 'Save Contact'}
  </Button>
</form>
```

## State Management

### **Local State**
- Use `useState` for simple component state
- Use `useReducer` for complex state logic
- Keep state close to where it's used
- Avoid prop drilling when possible

### **Server State**
- Use React Query for all server data
- Implement proper cache strategies
- Handle optimistic updates
- Provide proper error handling

## Testing Requirements

### **Component Tests**
- Test user interactions
- Test loading and error states
- Test accessibility features
- Mock API calls appropriately

### **Test Patterns**
```typescript
// ✅ Component test pattern
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactCard } from './ContactCard';

describe('ContactCard', () => {
  test('renders contact information', () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    render(<ContactCard contact={mockContact} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('handles delete action', async () => {
    const onDelete = vi.fn();
    const mockContact = { /* ... */ };

    render(<ContactCard contact={mockContact} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(mockContact.id);
    });
  });
});
```

## Anti-Patterns

❌ **Never** use `any` type in components
❌ **Never** skip accessibility testing
❌ **Never** use inline styles extensively
❌ **Never** create deeply nested component hierarchies
❌ **Never** ignore loading and error states
❌ **Never** use direct DOM manipulation

## Quality Checklist

- [ ] Component has proper TypeScript types
- [ ] Accessibility requirements are met
- [ ] Loading states are implemented
- [ ] Error handling is comprehensive
- [ ] Performance optimizations are applied
- [ ] Tests cover user interactions
- [ ] shadcn/ui components are used correctly
- [ ] React Query patterns are followed
- [ ] Component is properly documented
- [ ] Code follows established patterns

This rule ensures consistent, accessible, and performant React components across the Apex Unified Suite.
