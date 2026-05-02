---
trigger: always_on
---

# Shallow Route Handlers Rule

## Core Requirement
Route handlers must contain **zero business logic** - validate input, call one service method, pass errors to global handler. Maximum 5-10 lines per handler.

## Pattern Enforcement

### Correct Route Handler Structure

```typescript
// ✅ CORRECT - Shallow route handler
router.post('/users', async (req, res, next) => {
  const result = await userService.createUser(req.body);
  
  if (result.isErr()) {
    return next(result.error); // Pass to global error handler
  }
  
  res.status(201).json(result.value);
});

// ✅ CORRECT - With input validation
router.post('/users', async (req, res, next) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error)); // Pass to global handler
  }
  
  const result = await userService.createUser(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});
```

### Prohibited Patterns

```typescript
// ❌ INCORRECT - Business logic in route handler
router.post('/users', async (req, res) => {
  // Business logic - NEVER DO THIS
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  // More business logic - NEVER DO THIS
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  
  const user = await User.create(req.body);
  res.status(201).json(user);
});

// ❌ INCORRECT - Complex error handling in route
router.post('/users', async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    
    // Complex error handling - MOVE TO GLOBAL HANDLER
    if (result.error?.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: result.error.message });
    } else if (result.error?.code === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({ error: result.error.message });
    } else if (result.error?.code === 'INTERNAL_ERROR') {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.status(201).json(result.value);
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error' });
  }
});

// ❌ INCORRECT - Multiple service calls
router.post('/orders', async (req, res) => {
  // Multiple service calls - CONSOLIDATE INTO SERVICE
  const user = await userService.findById(req.body.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const product = await productService.findById(req.body.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const order = await orderService.create({ ...req.body, user, product });
  res.status(201).json(order);
});
```

## Service Layer Responsibilities

All business logic must be in service layer:

```typescript
// ✅ CORRECT - Service contains all business logic
class UserService {
  async createUser(data: CreateUserData): Promise<Result<User, DomainError>> {
    // Input validation
    const validation = this.validateUserData(data);
    if (validation.isErr()) {
      return err(validation.error);
    }
    
    // Business rule: Check for existing user
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      return err(new DomainError('USER_ALREADY_EXISTS', 'User with this email already exists'));
    }
    
    // Business rule: Password confirmation
    if (data.password !== data.confirmPassword) {
      return err(new ValidationError('password', 'Passwords do not match'));
    }
    
    // Create user
    const user = await this.userRepository.create(data);
    return ok(user);
  }
}

class OrderService {
  async createOrder(data: CreateOrderData): Promise<Result<Order, DomainError>> {
    // Business logic: Validate user exists
    const userResult = await this.userService.findById(data.userId);
    if (userResult.isErr()) {
      return err(userResult.error);
    }
    if (!userResult.value) {
      return err(new NotFoundError('User', data.userId));
    }
    
    // Business logic: Validate product exists
    const productResult = await this.productService.findById(data.productId);
    if (productResult.isErr()) {
      return err(productResult.error);
    }
    if (!productResult.value) {
      return err(new NotFoundError('Product', data.productId));
    }
    
    // Business logic: Create order
    const order = await this.orderRepository.create({
      ...data,
      user: userResult.value,
      product: productResult.value,
    });
    
    return ok(order);
  }
}
```

## Validation Pattern

### Input Validation in Routes
Only basic input validation should be in routes:

```typescript
// ✅ CORRECT - Simple validation only
router.post('/users', async (req, res, next) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await userService.createUser(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
```

### Business Validation in Services
All business validation in services:

```typescript
class UserService {
  private validateUserData(data: CreateUserData): Result<void, DomainError> {
    // Business validation rules
    if (data.password.length < 8) {
      return err(new ValidationError('password', 'Password must be at least 8 characters'));
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      return err(new ValidationError('password', 'Password must contain uppercase, lowercase, and number'));
    }
    
    if (data.firstName.length < 2) {
      return err(new ValidationError('firstName', 'First name must be at least 2 characters'));
    }
    
    return ok(undefined);
  }
}
```

## Error Handling Pattern

### Global Error Handler
Create a global error handler that translates domain errors:

```typescript
// artifacts/api-server/src/middleware/error-handler.ts
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof DomainError) {
    const statusCode = getStatusCodeFromError(error);
    return res.status(statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Handle unexpected errors
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
};

function getStatusCodeFromError(error: DomainError): number {
  switch (error.code) {
    case 'VALIDATION_ERROR': return 400;
    case 'UNAUTHORIZED': return 401;
    case 'FORBIDDEN': return 403;
    case 'NOT_FOUND': return 404;
    case 'USER_ALREADY_EXISTS': return 409;
    case 'BUSINESS_RULE_VIOLATION': return 422;
    default: return 500;
  }
}
```

### Route Handler Error Pattern
Always use `next(error)` to pass errors to global handler:

```typescript
// ✅ CORRECT - Pass errors to global handler
router.get('/users/:id', async (req, res, next) => {
  const result = await userService.findById(req.params.id);
  
  if (result.isErr()) {
    return next(result.error); // Pass to global handler
  }
  
  if (!result.value) {
    return next(new NotFoundError('User', req.params.id));
  }
  
  res.json(result.value);
});

// ❌ INCORRECT - Handle errors locally
router.get('/users/:id', async (req, res) => {
  const result = await userService.findById(req.params.id);
  
  if (result.isErr()) {
    if (result.error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    } else {
      return res.status(500).json({ error: 'Internal error' });
    }
  }
  
  res.json(result.value);
});
```

## Route Handler Templates

### CRUD Operations

```typescript
// CREATE
router.post('/resource', async (req, res, next) => {
  const validation = createResourceSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await resourceService.create(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

// READ
router.get('/resource/:id', async (req, res, next) => {
  const result = await resourceService.findById(req.params.id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  if (!result.value) {
    return next(new NotFoundError('Resource', req.params.id));
  }
  
  res.json(result.value);
});

// UPDATE
router.put('/resource/:id', async (req, res, next) => {
  const validation = updateResourceSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await resourceService.update(req.params.id, validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

// DELETE
router.delete('/resource/:id', async (req, res, next) => {
  const result = await resourceService.delete(req.params.id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(204).send();
});

// LIST
router.get('/resource', async (req, res, next) => {
  const validation = listResourceSchema.safeParse(req.query);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await resourceService.list(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});
```

## Testing Requirements

### Route Handler Tests
Test route handlers are shallow:

```typescript
describe('User Routes', () => {
  describe('POST /users', () => {
    it('should call userService.createUser and return result', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const createSpy = jest.spyOn(userService, 'createUser')
        .mockResolvedValue(ok(mockUser));
      
      const response = await request(app)
        .post('/api/v1/users')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);
      
      expect(createSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      expect(response.body).toEqual(mockUser);
    });
    
    it('should pass validation errors to global handler', async () => {
      const createSpy = jest.spyOn(userService, 'createUser')
        .mockResolvedValue(err(new ValidationError('email', 'Invalid email')));
      
      const response = await request(app)
        .post('/api/v1/users')
        .send({ email: 'invalid', password: 'password123' })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid email');
    });
  });
});
```

## Common Violations and Fixes

### Business Logic in Routes
**Violation**: Business rules in route handlers
```typescript
// ❌ WRONG
router.post('/orders', async (req, res) => {
  if (req.body.amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  // ... more business logic
});
```

**Fix**: Move to service layer
```typescript
// ✅ CORRECT
router.post('/orders', async (req, res, next) => {
  const result = await orderService.createOrder(req.body);
  if (result.isErr()) return next(result.error);
  res.status(201).json(result.value);
});
```

### Multiple Service Calls
**Violation**: Multiple service calls in route
```typescript
// ❌ WRONG
router.post('/orders', async (req, res) => {
  const user = await userService.findById(req.body.userId);
  const product = await productService.findById(req.body.productId);
  // ...
});
```

**Fix**: Single service call
```typescript
// ✅ CORRECT
router.post('/orders', async (req, res, next) => {
  const result = await orderService.createOrder(req.body);
  if (result.isErr()) return next(result.error);
  res.status(201).json(result.value);
});
```

### Local Error Handling
**Violation**: Error handling in routes
```typescript
// ❌ WRONG
router.post('/users', async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    if (result.error?.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: result.error.message });
    }
    res.status(201).json(result.value);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});
```

**Fix**: Use global error handler
```typescript
// ✅ CORRECT
router.post('/users', async (req, res, next) => {
  const result = await userService.createUser(req.body);
  if (result.isErr()) return next(result.error);
  res.status(201).json(result.value);
});
```

## Benefits

1. **Separation of Concerns**: Routes handle HTTP, services handle business logic
2. **Testability**: Routes are simple to test, business logic is isolated
3. **Maintainability**: Changes to business logic don't affect routes
4. **Consistency**: All error handling is centralized
5. **Readability**: Route handlers are easy to understand

This rule ensures clean separation between HTTP handling and business logic throughout the Apex Unified Suite.
