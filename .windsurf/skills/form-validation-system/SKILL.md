---
name: form-validation-system
description: Implement form validation with React Hook Form and Zod, including reusable validation schemas, error handling, and accessibility patterns
---

# Form Validation System

This skill guides you through implementing a comprehensive form validation system using React Hook Form with Zod resolvers, providing type-safe forms with excellent UX and accessibility.

## Current State Assessment

**Current State**: `react-hook-form` and `@hookform/resolvers` are in dependencies but unused.

**Missing Infrastructure**:
- No form validation implementation
- No reusable validation schemas
- No form error handling patterns
- No accessible form components

## Form Architecture

### **Stack Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Form Component                            │
│                          (React)                                 │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                React Hook Form                            │   │
│  │  - Form state management                                   │   │
│  │  - Field registration                                      │   │
│  │  - Validation triggers                                     │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              @hookform/resolvers (zod)                   │   │
│  │  - Schema validation                                       │   │
│  │  - Type inference                                          │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Zod Schema                            │   │
│  │  - Validation rules                                        │   │
│  │  - Error messages                                          │   │
│  │  - TypeScript types                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### **Benefits**

- **Minimal Re-renders**: Uses uncontrolled components with refs
- **Small Bundle Size**: ~9KB gzipped
- **TypeScript First**: Full type inference from Zod schemas
- **Performance**: Faster than Formik and alternatives
- **Standards**: Uses native HTML validation where possible

## Step-by-Step Implementation

### **Step 1: Ensure Dependencies Are Installed**

```bash
# Already in dependencies, verify versions
pnpm --filter @workspace/apex-os list react-hook-form @hookform/resolvers zod

# Should see:
# react-hook-form@7.51.0
# @hookform/resolvers@3.3.4
# zod@3.23.8
```

### **Step 2: Create Validation Schema Library**

**File**: `artifacts/apex-os/src/lib/validations/index.ts`

```typescript
import { z } from 'zod';

// ==================== Common Validation Helpers ====================

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).*$/;

export const commonValidations = {
  // Email validation
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  // Password validation (12+ chars, mixed case, number, special)
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      passwordRegex,
      'Password must contain uppercase, lowercase, number, and special character'
    ),

  // Name validation
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

  // Phone validation (flexible format)
  phone: z
    .string()
    .regex(
      /^[\d\s\-\+\(\)]{10,20}$/,
      'Please enter a valid phone number'
    )
    .optional()
    .or(z.literal('')),

  // UUID validation
  uuid: z.string().uuid('Invalid ID format'),

  // URL validation
  url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  // Required string
  requiredString: (fieldName: string) =>
    z.string().min(1, `${fieldName} is required`),

  // Optional string
  optionalString: z.string().optional().or(z.literal('')),
};

// ==================== Form Schemas ====================

// Login form
export const loginSchema = z.object({
  email: commonValidations.email,
  password: z.string().min(1, 'Password is required'),
  organizationId: commonValidations.uuid,
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration form
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name is required')
      .max(100, 'Full name must not exceed 100 characters'),
    email: commonValidations.email,
    password: commonValidations.password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    organizationId: commonValidations.uuid,
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Contact form
export const contactSchema = z.object({
  firstName: commonValidations.firstName,
  lastName: commonValidations.lastName,
  email: commonValidations.email,
  phone: commonValidations.phone,
  company: z.string().max(100, 'Company name too long').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().max(5000, 'Notes too long').optional(),
  tags: z.array(z.string()).default([]),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Lead form
export const leadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  contactId: commonValidations.uuid.optional(),
  value: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount')
    .optional()
    .or(z.literal('')),
  stage: z.enum(['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  source: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional().or(z.literal('')),
  probability: z.number().min(0).max(100).optional(),
  description: z.string().max(2000).optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Organization form
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Name too long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  planType: z.enum(['free', 'pro', 'enterprise']).default('free'),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

// Settings form
export const settingsSchema = z.object({
  companyName: z.string().min(1).max(100),
  timezone: z.string(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean().optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
```

### **Step 3: Create Reusable Form Components**

**File**: `artifacts/apex-os/src/components/forms/FormField.tsx`

```typescript
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  description?: string;
}

export function FormField({
  name,
  label,
  description,
  className,
  ...props
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      
      <Input
        id={name}
        className={cn(error && 'border-destructive', className)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : description ? `${name}-desc` : undefined}
        {...register(name)}
        {...props}
      />
      
      {description && !error && (
        <p id={`${name}-desc`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-destructive" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

**File**: `artifacts/apex-os/src/components/forms/FormSelect.tsx`

```typescript
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormSelectProps {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  description?: string;
  placeholder?: string;
}

export function FormSelect({
  name,
  label,
  options,
  description,
  placeholder,
}: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger
              id={name}
              className={cn(error && 'border-destructive')}
              aria-invalid={error ? 'true' : 'false'}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

**File**: `artifacts/apex-os/src/components/forms/FormTextarea.tsx`

```typescript
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
}

export function FormTextarea({
  name,
  label,
  className,
  ...props
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      
      <Textarea
        id={name}
        className={cn(error && 'border-destructive', className)}
        aria-invalid={error ? 'true' : 'false'}
        {...register(name)}
        {...props}
      />
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

### **Step 4: Create Complete Form Example**

**File**: `artifacts/apex-os/src/components/auth/LoginForm.tsx`

```typescript
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function LoginForm({ organizationId, onSuccess }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      organizationId,
    },
    mode: 'onBlur', // Validate on field blur
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.email, data.password, data.organizationId);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          name="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />

        <FormField
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••••••"
          autoComplete="current-password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !methods.formState.isValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </FormProvider>
  );
}
```

**File**: `artifacts/apex-os/src/components/contacts/CreateContactForm.tsx`

```typescript
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateContact } from '@workspace/api-client-react';
import { contactSchema, ContactFormData } from '@/lib/validations';
import { FormField } from '@/components/forms/FormField';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateContactFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateContactForm({ onSuccess, onCancel }: CreateContactFormProps) {
  const [error, setError] = useState<string | null>(null);
  const createContact = useCreateContact();

  const methods = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      status: 'active',
      notes: '',
      tags: [],
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setError(null);
      await createContact.mutateAsync(data);
      toast.success('Contact created successfully');
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create contact';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="firstName"
            label="First Name"
            placeholder="John"
          />
          <FormField
            name="lastName"
            label="Last Name"
            placeholder="Doe"
          />
        </div>

        <FormField
          name="email"
          label="Email"
          type="email"
          placeholder="john@example.com"
        />

        <FormField
          name="phone"
          label="Phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="company"
            label="Company"
            placeholder="Acme Inc"
          />
          <FormField
            name="title"
            label="Job Title"
            placeholder="CEO"
          />
        </div>

        <FormSelect
          name="status"
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />

        <FormTextarea
          name="notes"
          label="Notes"
          placeholder="Add any relevant notes..."
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createContact.isPending || !methods.formState.isDirty}
          >
            {createContact.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Contact'
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

### **Step 5: Password Strength Indicator**

**File**: `artifacts/apex-os/src/components/forms/PasswordStrength.tsx`

```typescript
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  name: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(p) },
];

export function PasswordStrength({ name }: PasswordStrengthProps) {
  const { control } = useFormContext();
  const password = useWatch({ control, name }) || '';

  const passedCount = requirements.filter((req) => req.test(password)).length;
  const strength = (passedCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-3">
      <Progress value={strength} className={cn('h-2', getStrengthColor())} />
      
      <ul className="space-y-1 text-xs">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <li
              key={req.label}
              className={cn(
                'flex items-center gap-2',
                passed ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

### **Step 6: Form Validation Tests**

**File**: `artifacts/apex-os/__tests__/lib/validations.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  contactSchema,
  commonValidations,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => loginSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => loginSchema.parse(data)).toThrow('valid email');
    });

    it('should reject missing password', () => {
      const data = {
        email: 'test@example.com',
        password: '',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => loginSchema.parse(data)).toThrow('required');
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: true,
      };
      
      expect(() => registerSchema.parse(data)).not.toThrow();
    });

    it('should reject weak password', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: true,
      };
      
      expect(() => registerSchema.parse(data)).toThrow('12 characters');
    });

    it('should reject mismatched passwords', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: true,
      };
      
      expect(() => registerSchema.parse(data)).toThrow('do not match');
    });

    it('should reject unchecked terms', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: false,
      };
      
      expect(() => registerSchema.parse(data)).toThrow('terms');
    });
  });

  describe('contactSchema', () => {
    it('should accept valid contact', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      };
      
      expect(() => contactSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid name characters', () => {
      const data = {
        firstName: 'John123',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      };
      
      expect(() => contactSchema.parse(data)).toThrow('invalid characters');
    });
  });

  describe('commonValidations', () => {
    it('should validate email format', () => {
      expect(() =>
        commonValidations.email.parse('valid@example.com')
      ).not.toThrow();
      
      expect(() =>
        commonValidations.email.parse('invalid')
      ).toThrow();
    });

    it('should validate password strength', () => {
      expect(() =>
        commonValidations.password.parse('StrongPass123!')
      ).not.toThrow();
      
      expect(() =>
        commonValidations.password.parse('weak')
      ).toThrow('12 characters');
      
      expect(() =>
        commonValidations.password.parse('nouppercase123!')
      ).toThrow('uppercase');
    });
  });
});
```

## Best Practices

### **Validation Modes**

```typescript
// onChange: Validate as user types (good for immediate feedback)
useForm({ mode: 'onChange' });

// onBlur: Validate when field loses focus (good for performance)
useForm({ mode: 'onBlur' });

// onSubmit: Validate only on submit (default, good for simple forms)
useForm({ mode: 'onSubmit' });

// all: Validate on all events
useForm({ mode: 'all' });
```

### **Accessibility**

```typescript
// Always include:
// - Label with htmlFor
// - aria-invalid for error state
// - aria-describedby linking to error message
// - role="alert" on error messages
// - Error messages linked to inputs
```

### **Performance**

```typescript
// Use Controller only when needed (custom components)
// For native inputs, use register() instead
// Use useWatch for individual field watching
// Avoid watching entire form state when possible
```

## Verification Commands

```bash
# Test validation schemas
pnpm vitest run artifacts/apex-os/__tests__/lib/validations.test.ts

# Check for uncontrolled form warnings
grep -r "register\|Controller" artifacts/apex-os/src/components/forms/

# Verify Zod imports
grep -r "from 'zod'" artifacts/apex-os/src/lib/validations/
```
