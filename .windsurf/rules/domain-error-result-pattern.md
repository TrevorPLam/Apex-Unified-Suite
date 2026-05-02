---
trigger: always_on
---

# Domain Error Result Pattern Rule

## Core Requirement
All services **must** return `Result<T, DomainError>` (using neverthrow) and **never throw** exceptions. Route handlers only translate domain errors to HTTP responses.

## Pattern Enforcement

### Service Layer
Services must use Result pattern for all operations:

```typescript
// ✅ CORRECT - Use Result pattern
import { Result, ok, err } from 'neverthrow';

class UserService {
  async createUser(data: CreateUserData): Promise<Result<User, DomainError>> {
    try {
      // Validate input
      const validation = this.validateUserData(data);
      if (validation.isErr()) {
        return err(validation.error);
      }

      // Check for existing user
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        return err(new DomainError('USER_ALREADY_EXISTS', 'User with this email already exists'));
      }

      // Create user
      const user = await this.userRepository.create(data);
      return ok(user);
    } catch (error) {
      // Log unexpected errors but don't throw
      console.error('Unexpected error in createUser:', error);
      return err(new DomainError('INTERNAL_ERROR', 'Failed to create user'));
    }
  }
}

// ❌ INCORRECT - Throwing exceptions
class UserService {
  async createUser(data: CreateUserData): Promise<User> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('User already exists'); // NEVER DO THIS
    }
    return await this.userRepository.create(data);
  }
}
```

### Domain Error Types
All domain errors must extend DomainError:

```typescript
// ✅ CORRECT - Structured domain errors
export class DomainError {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {}
}

export class ValidationError extends DomainError {
  constructor(field: string, message: string) {
    super('VALIDATION_ERROR', message, { field });
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found`, { resource, id });
  }
}

export class BusinessRuleError extends DomainError {
  constructor(rule: string, message: string) {
    super('BUSINESS_RULE_VIOLATION', message, { rule });
  }
}
```

### Repository Layer
Repositories must also return Results:

```typescript
// ✅ CORRECT - Repository returns Result
class UserRepository {
  async findById(id: string): Promise<Result<User | null, DomainError>> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, id),
      });
      return ok(user);
    } catch (error) {
      console.error('Database error in findById:', error);
      return err(new DomainError('DATABASE_ERROR', 'Failed to fetch user'));
    }
  }
}

// ❌ INCORRECT - Repository throws
class UserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      return await this.db.query.users.findFirst({
        where: eq(users.id, id),
      });
    } catch (error) {
      throw new Error('Database error'); // NEVER DO THIS
    }
  }
}
```

### Route Handler Pattern
Route handlers must only translate domain errors to HTTP responses:

```typescript
// ✅ CORRECT - Route handler translates errors
router.post('/users', async (req, res) => {
  const result = await userService.createUser(req.body);
  
  if (result.isErr()) {
    const error = result.error;
    
    // Translate domain errors to HTTP responses
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return res.status(400).json({
          error: error.message,
          details: error.details,
        });
        
      case 'USER_ALREADY_EXISTS':
        return res.status(409).json({
          error: error.message,
          code: error.code,
        });
        
      case 'INTERNAL_ERROR':
        return res.status(500).json({
          error: 'Internal server error',
        });
        
      default:
        return res.status(500).json({
          error: 'Unknown error occurred',
        });
    }
  }
  
  res.status(201).json(result.value);
});

// ❌ INCORRECT - Route handler contains business logic
router.post('/users', async (req, res) => {
  try {
    // Business logic in route handler - NEVER DO THIS
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});
```

## Error Handling Middleware

### Global Error Handler
Create a global error handler that catches unexpected exceptions and converts them to domain errors:

```typescript
// artifacts/api-server/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { DomainError } from '@workspace/shared/src/errors/domain-error';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  console.error('Unhandled error:', error);
  
  // Convert to domain error if needed
  const domainError = error instanceof DomainError 
    ? error 
    : new DomainError('INTERNAL_ERROR', 'An unexpected error occurred');
  
  // Translate to HTTP response
  const statusCode = getStatusCodeFromError(domainError);
  
  res.status(statusCode).json({
    error: domainError.message,
    code: domainError.code,
    details: domainError.details,
    timestamp: new Date().toISOString(),
  });
};

function getStatusCodeFromError(error: DomainError): number {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'USER_ALREADY_EXISTS':
    case 'RESOURCE_CONFLICT':
      return 409;
    case 'BUSINESS_RULE_VIOLATION':
      return 422;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'INTERNAL_ERROR':
    case 'DATABASE_ERROR':
    default:
      return 500;
  }
}
```

## Testing Requirements

### Unit Tests
Test all error paths in services:

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should return validation error for invalid data', async () => {
      const invalidData = { email: 'invalid-email' };
      const result = await userService.createUser(invalidData);
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
    
    it('should return conflict error for existing user', async () => {
      const existingUserData = { email: 'existing@example.com' };
      const result = await userService.createUser(existingUserData);
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('USER_ALREADY_EXISTS');
    });
    
    it('should return user on success', async () => {
      const validData = { email: 'new@example.com' };
      const result = await userService.createUser(validData);
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveProperty('email', 'new@example.com');
    });
  });
});
```

### Integration Tests
Test error translation in route handlers:

```typescript
describe('POST /users', () => {
  it('should return 400 for validation errors', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ email: 'invalid-email' })
      .expect(400);
      
    expect(response.body).toHaveProperty('error');
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 409 for existing user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ email: 'existing@example.com' })
      .expect(409);
      
    expect(response.body).toHaveProperty('error');
    expect(response.body.code).toBe('USER_ALREADY_EXISTS');
  });
});
```

## Common Violations and Fixes

### Throwing Exceptions
**Violation**: Throwing exceptions from services
```typescript
// ❌ WRONG
if (!user) {
  throw new Error('User not found');
}
```

**Fix**: Return Result with error
```typescript
// ✅ CORRECT
if (!user) {
  return err(new NotFoundError('User', id));
}
```

### Business Logic in Routes
**Violation**: Business logic in route handlers
```typescript
// ❌ WRONG
router.post('/users', async (req, res) => {
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  // ... more business logic
});
```

**Fix**: Move to service layer
```typescript
// ✅ CORRECT
router.post('/users', async (req, res) => {
  const result = await userService.createUser(req.body);
  // ... error translation
});
```

### Unhandled Exceptions
**Violation**: Not catching database errors
```typescript
// ❌ WRONG
async findById(id: string): Promise<User> {
  return await this.db.query.users.findFirst({ where: eq(users.id, id) });
}
```

**Fix**: Wrap in try-catch and return Result
```typescript
// ✅ CORRECT
async findById(id: string): Promise<Result<User | null, DomainError>> {
  try {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    return ok(user);
  } catch (error) {
    return err(new DomainError('DATABASE_ERROR', 'Failed to fetch user'));
  }
}
```

## Migration Strategy

### Step 1: Add DomainError Types
Create domain error classes and Result utilities.

### Step 2: Update Services
Convert services to return Results instead of throwing.

### Step 3: Update Repositories
Convert repositories to return Results.

### Step 4: Update Route Handlers
Convert route handlers to translate domain errors.

### Step 5: Add Global Error Handler
Implement global error handling middleware.

### Step 6: Add Tests
Add comprehensive error path testing.

## Benefits

1. **Type Safety**: Result type makes error handling explicit
2. **Consistency**: All errors follow the same pattern
3. **Testability**: Error paths are easily testable
4. **Maintainability**: Clear separation of concerns
5. **Reliability**: No unexpected exceptions bubble up

This rule ensures robust error handling throughout the Apex Unified Suite, making the system more predictable and maintainable.
