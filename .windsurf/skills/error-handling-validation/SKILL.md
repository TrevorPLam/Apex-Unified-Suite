---
name: error-handling-validation
description: Implement comprehensive error handling, form validation, and loading states across the suite
---

# Error Handling & Validation Implementation

This skill guides you through implementing comprehensive error handling, form validation, and loading states across the Apex Unified Suite to ensure a robust and user-friendly experience.

## Current State Assessment

**Error Handling Status**: Minimal error handling exists across the application.

**Issues Identified**:
- No error boundaries in React components
- No form validation with React Hook Form + Zod
- No loading states beyond basic skeleton components
- No centralized error reporting
- No user-friendly error messages
- No retry mechanisms for failed operations

## Error Handling Architecture

### **Error Handling Layers**
```
┌─────────────────────────────────────────┐
│           UI Layer (React)              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Error Bound │  │ Form Validation │   │
│  │ Retry Logic  │  │ Loading States  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         API Layer (React Query)          │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Error Retry  │  │ Global Handlers │   │
│  │ Cache Mgmt   │  │ Toast Notifs    │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Backend (Express)                │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Zod Validation│  │ Structured Logs │   │
│  │ Error Middl  │  │ Error Responses │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Global Error Handling Setup**

**File**: `artifacts/apex-os/src/lib/errorHandling.ts`
```typescript
import { AxiosError } from 'axios';

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormError {
  [key: string]: string;
}

// Error classification
export function classifyError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const apiError: ApiError = {
      message: error.response?.data?.error || error.message,
      status: error.response?.status,
      code: error.code,
    };

    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.details) {
      apiError.details = error.response.data.details;
    }

    return apiError;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

// Error message generation
export function getErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 400:
      return error.details ? 'Please check your input and try again.' : 'Invalid request.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}

// Form error conversion
export function convertValidationErrors(details: ValidationError[]): FormError {
  const errors: FormError = {};
  
  details.forEach((validationError) => {
    errors[validationError.field] = validationError.message;
  });

  return errors;
}

// Retry logic
export function shouldRetry(error: ApiError, attemptNumber: number): boolean {
  // Don't retry on client errors (4xx)
  if (error.status && error.status >= 400 && error.status < 500) {
    return false;
  }

  // Don't retry on authentication errors
  if (error.status === 401 || error.status === 403) {
    return false;
  }

  // Retry server errors up to 3 times
  return attemptNumber < 3;
}

// Error reporting
export function reportError(error: unknown, context?: string) {
  const classifiedError = classifyError(error);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error${context ? ` in ${context}` : ''}:`, classifiedError);
  }

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry or similar service
    // Sentry.captureException(error, { context });
  }
}
```

### **Step 2: React Query Global Error Handling**

**Update**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';
import { classifyError, getErrorMessage, shouldRetry } from '@/lib/errorHandling';

// Configure QueryClient with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        const classifiedError = classifyError(error);
        return shouldRetry(classifiedError, failureCount);
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      onError: (error) => {
        const classifiedError = classifyError(error);
        const message = getErrorMessage(classifiedError);
        
        // Show toast for non-authentication errors
        if (classifiedError.status !== 401) {
          toast.error(message);
        }
        
        // Report error for monitoring
        reportError(error, 'React Query');
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        const classifiedError = classifyError(error);
        const message = getErrorMessage(classifiedError);
        
        toast.error(message);
        reportError(error, 'React Query Mutation');
      },
    },
  },
});

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter>
              <Toaster />
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </WouterRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### **Step 3: Enhanced Form Validation**

**File**: `artifacts/apex-os/src/hooks/useFormValidation.ts`
```typescript
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { convertValidationErrors, classifyError } from '@/lib/errorHandling';

interface UseFormValidationProps<T extends z.ZodSchema> {
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useFormValidation<T extends z.ZodSchema>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
}: UseFormValidationProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (error) {
      const classifiedError = classifyError(error);
      
      // Handle validation errors
      if (classifiedError.status === 400 && classifiedError.details) {
        const formErrors = convertValidationErrors(classifiedError.details);
        
        // Set form errors
        Object.entries(formErrors).forEach(([field, message]) => {
          form.setError(field as keyof z.infer<T>, {
            type: 'manual',
            message,
          });
        });
      } else {
        // Set general error
        setSubmitError(getErrorMessage(classifiedError));
      }
      
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  });

  const reset = () => {
    form.reset();
    setSubmitError(null);
  };

  return {
    form,
    handleSubmit,
    isSubmitting,
    submitError,
    reset,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
  };
}
```

### **Step 4: Enhanced Contact Form Component**

**File**: `artifacts/apex-os/src/components/crm/ContactForm.tsx`
```typescript
import React from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { z } from 'zod';
import { insertContactSchema } from '@workspace/api-zod';
import { toast } from 'sonner';

// Extend schema for form validation
const contactFormSchema = insertContactSchema.extend({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ContactForm({ initialData, onSubmit, onCancel, isLoading = false }: ContactFormProps) {
  const {
    form,
    handleSubmit,
    isSubmitting,
    submitError,
    errors,
  } = useFormValidation({
    schema: contactFormSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      status: 'active',
      tags: [],
      notes: '',
      ...initialData,
    },
    onSubmit,
    onSuccess: () => {
      toast.success('Contact saved successfully');
    },
    onError: (error) => {
      console.error('Form submission error:', error);
    },
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Contact' : 'Create Contact'}
        </CardTitle>
        <CardDescription>
          {initialData ? 'Update contact information' : 'Add a new contact to your CRM'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
                placeholder="John"
                disabled={isSubmitting || isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
                placeholder="Doe"
                disabled={isSubmitting || isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="john.doe@example.com"
                disabled={isSubmitting || isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting || isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...form.register('company')}
                placeholder="Acme Corp"
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="CEO"
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Additional information about this contact..."
              rows={4}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Contact' : 'Create Contact'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for form
export function ContactFormSkeleton() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-20" />
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **Step 5: Backend Error Handling Middleware**

**File**: `artifacts/api-server/src/middlewares/errorHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error implements ApiError {
  status = 400;
  code = 'VALIDATION_ERROR';
  details: any[];

  constructor(details: any[]) {
    super('Validation failed');
    this.details = details;
  }
}

export class NotFoundError extends Error implements ApiError {
  status = 404;
  code = 'NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class UnauthorizedError extends Error implements ApiError {
  status = 401;
  code = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenError extends Error implements ApiError {
  status = 403;
  code = 'FORBIDDEN';

  constructor(message = 'Forbidden') {
    super(message);
  }
}

export class ConflictError extends Error implements ApiError {
  status = 409;
  code = 'CONFLICT';

  constructor(message = 'Conflict') {
    super(message);
  }
}

export class InternalServerError extends Error implements ApiError {
  status = 500;
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message = 'Internal server error') {
    super(message);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle different error types
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
    );
    return handleApiError(validationError, res);
  }

  if (error instanceof ApiError) {
    return handleApiError(error, res);
  }

  // Default error handling
  const internalError = new InternalServerError(
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  );
  
  handleApiError(internalError, res);
}

function handleApiError(error: ApiError, res: Response) {
  const response: any = {
    error: error.message,
    code: error.code,
  };

  // Include details for validation errors
  if (error instanceof ValidationError && error.details) {
    response.details = error.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  res.status(error.status || 500).json(response);
}

// Async error wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### **Step 6: Enhanced API Routes with Error Handling**

**Update**: `artifacts/api-server/src/routes/crm/contacts.ts`
```typescript
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '@workspace/db';
import { contactsTable, insertContactSchema, selectContactSchema } from '@workspace/db/schema';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';
import { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../middlewares/errorHandler';

const router = Router();

// GET /api/crm/contacts - List contacts
router.get('/', 
  authenticateToken, 
  requirePermission('crm:contacts:read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      throw new ValidationError([
        { field: 'page', message: 'Page must be >= 1' },
        { field: 'limit', message: 'Limit must be between 1 and 100' },
      ]);
    }

    let query = db.select().from(contactsTable);

    // Apply filters
    const conditions = [];
    
    if (search) {
      if (search.length < 2) {
        throw new ValidationError([
          { field: 'search', message: 'Search term must be at least 2 characters' },
        ]);
      }
      
      conditions.push(
        or(
          ilike(contactsTable.firstName, `%${search}%`),
          ilike(contactsTable.lastName, `%${search}%`),
          ilike(contactsTable.email, `%${search}%`),
          ilike(contactsTable.company, `%${search}%`)
        )
      );
    }

    if (status) {
      if (!['active', 'inactive'].includes(status)) {
        throw new ValidationError([
          { field: 'status', message: 'Status must be "active" or "inactive"' },
        ]);
      }
      conditions.push(eq(contactsTable.status, status));
    }

    if (assignedTo) {
      conditions.push(eq(contactsTable.assignedTo, assignedTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalCountQuery = db
      .select({ count: contactsTable.id })
      .from(contactsTable);
      
    if (conditions.length > 0) {
      totalCountQuery.where(and(...conditions));
    }

    const totalCount = await totalCountQuery;

    // Apply sorting
    const validSortFields = ['firstName', 'lastName', 'email', 'company', 'createdAt', 'updatedAt'];
    if (!validSortFields.includes(sortBy)) {
      throw new ValidationError([
        { field: 'sortBy', message: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}` },
      ]);
    }

    const sortField = contactsTable[sortBy as keyof typeof contactsTable];
    if (sortField) {
      query = query.orderBy(sortOrder === 'desc' ? desc(sortField) : asc(sortField));
    }

    const results = await query.limit(limit).offset(offset);

    res.json({
      data: results,
      meta: {
        total: totalCount.length,
        page,
        limit,
        hasNext: offset + limit < totalCount.length,
        hasPrev: page > 1,
      },
    });
  })
);

// POST /api/crm/contacts - Create contact
router.post('/', 
  authenticateToken, 
  requirePermission('crm:contacts:write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validatedData = insertContactSchema.parse(req.body);
    
    // Check for duplicate email
    const existingContact = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.email, validatedData.email))
      .limit(1);

    if (existingContact[0]) {
      throw new ConflictError('A contact with this email already exists');
    }
    
    const result = await db
      .insert(contactsTable)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ data: result[0] });
  })
);

// PUT /api/crm/contacts/:id - Update contact
router.put('/:id', 
  authenticateToken, 
  requirePermission('crm:contacts:write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ValidationError([
        { field: 'id', message: 'Valid contact ID is required' },
      ]);
    }

    const validatedData = insertContactSchema.partial().parse(req.body);

    // Check if contact exists
    const existingContact = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1);

    if (!existingContact[0]) {
      throw new NotFoundError('Contact not found');
    }

    // Check for email conflict if email is being updated
    if (validatedData.email && validatedData.email !== existingContact[0].email) {
      const emailConflict = await db
        .select()
        .from(contactsTable)
        .where(and(
          eq(contactsTable.email, validatedData.email),
          // Exclude current contact from check
          // Note: This would need a more complex query in real implementation
        ))
        .limit(1);

      if (emailConflict[0]) {
        throw new ConflictError('A contact with this email already exists');
      }
    }

    const result = await db
      .update(contactsTable)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(contactsTable.id, id))
      .returning();

    res.json({ data: result[0] });
  })
);

// DELETE /api/crm/contacts/:id - Delete contact
router.delete('/:id', 
  authenticateToken, 
  requirePermission('crm:contacts:delete'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ValidationError([
        { field: 'id', message: 'Valid contact ID is required' },
      ]);
    }

    const result = await db
      .delete(contactsTable)
      .where(eq(contactsTable.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError('Contact not found');
    }

    res.json({ data: result[0] });
  })
);

export default router;
```

### **Step 7: Loading State Components**

**File**: `artifacts/apex-os/src/components/ui/loading-states.tsx`
```typescript
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Page skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex space-x-4 border-b">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4 p-4 border rounded">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-20" />
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline loading spinner
export function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`} />
  );
}

// Loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}
```

## Implementation Checklist

### **Error Handling**
- [ ] Implement global error classification
- [ ] Add React Query global error handlers
- [ ] Create backend error handling middleware
- [ ] Add error reporting and monitoring
- [ ] Implement retry logic with exponential backoff

### **Form Validation**
- [ ] Create useFormValidation hook
- [ ] Implement Zod schema validation
- [ ] Add real-time validation feedback
- [ ] Handle server-side validation errors
- [ ] Show user-friendly error messages

### **Loading States**
- [ ] Create skeleton components for all major UI patterns
- [ ] Add loading spinners for async operations
- [ ] Implement loading overlays for critical operations
- [ ] Show loading states during navigation
- [ ] Add optimistic loading indicators

### **User Experience**
- [ ] Add toast notifications for all operations
- [ ] Implement error boundaries for React components
- [ ] Add retry mechanisms for failed operations
- [ ] Show helpful error messages
- [ ] Provide recovery options for errors

This comprehensive error handling and validation system ensures a robust, user-friendly experience across the Apex Unified Suite with proper error reporting, validation feedback, and loading states.
