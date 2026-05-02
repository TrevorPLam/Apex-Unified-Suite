---
trigger: glob
globs: artifacts/api-server/src/services/**/*.ts
---

# NeverThrow Error Handling Rule

All service methods must return `ResultType<T, DomainError>` instead of throwing exceptions. Enforce type-safe error handling throughout the service layer.

## Core NeverThrow Pattern

### **Service Method Signature**
```typescript
// ✅ CORRECT - All service methods return Result
import { Result, ok, err } from 'neverthrow';

export class UserService {
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
      console.error('Unexpected error in createUser:', error);
      return err(new DomainError('INTERNAL_ERROR', 'Failed to create user'));
    }
  }

  async findById(id: string, organizationId: string): Promise<Result<User, DomainError>> {
    try {
      const user = await this.userRepository.findById(id, organizationId);
      if (!user) {
        return err(new NotFoundError('User', id));
      }
      return ok(user);
    } catch (error) {
      console.error('Unexpected error in findById:', error);
      return err(new DomainError('INTERNAL_ERROR', 'Failed to fetch user'));
    }
  }
}

// ❌ INCORRECT - Service methods that throw
export class BadUserService {
  async createUser(data: CreateUserData): Promise<User> {
    if (!data.email) {
      throw new Error('Email is required'); // NEVER DO THIS
    }

    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('User already exists'); // NEVER DO THIS
    }

    return await this.userRepository.create(data);
  }
}
```

### **Domain Error Types**
```typescript
// ✅ CORRECT - Structured domain errors
export class DomainError {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {}
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found`, { resource, id });
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, message: string) {
    super('VALIDATION_ERROR', message, { field });
  }
}

export class BusinessRuleError extends DomainError {
  constructor(rule: string, message: string) {
    super('BUSINESS_RULE_VIOLATION', message, { rule });
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message);
  }
}
```

## Repository Pattern with NeverThrow

### **Repository Implementation**
```typescript
// ✅ CORRECT - Repository methods return Result
export class UserRepository {
  async findById(id: string, organizationId: string): Promise<Result<User | null, DomainError>> {
    try {
      const user = await db
        .select()
        .from(usersTable)
        .where(and(
          eq(usersTable.id, id),
          eq(usersTable.organizationId, organizationId)
        ))
        .limit(1);

      return ok(user[0] || null);
    } catch (error) {
      console.error('Database error in findById:', error);
      return err(new DomainError('DATABASE_ERROR', 'Failed to fetch user'));
    }
  }

  async create(data: CreateUserData): Promise<Result<User, DomainError>> {
    try {
      const [user] = await db
        .insert(usersTable)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return ok(user);
    } catch (error) {
      if (error instanceof PostgresError) {
        if (error.code === '23505') { // Unique constraint violation
          return err(new DomainError('DUPLICATE_EMAIL', 'Email already exists'));
        }
      }
      
      console.error('Database error in create:', error);
      return err(new DomainError('DATABASE_ERROR', 'Failed to create user'));
    }
  }

  async update(id: string, data: Partial<UpdateUserData>): Promise<Result<User, DomainError>> {
    try {
      const [user] = await db
        .update(usersTable)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, id))
        .returning();

      if (!user) {
        return err(new NotFoundError('User', id));
      }

      return ok(user);
    } catch (error) {
      console.error('Database error in update:', error);
      return err(new DomainError('DATABASE_ERROR', 'Failed to update user'));
    }
  }
}
```

## Service Composition

### **Combining Multiple Operations**
```typescript
// ✅ CORRECT - Chain Results with proper error handling
export class ContactService {
  async createContactWithLead(
    contactData: CreateContactData,
    leadData: CreateLeadData,
    user: AuthenticatedUser
  ): Promise<Result<{ contact: Contact; lead: Lead }, DomainError>> {
    // Validate contact data
    const contactValidation = this.validateContactData(contactData);
    if (contactValidation.isErr()) {
      return err(contactValidation.error);
    }

    // Validate lead data
    const leadValidation = this.validateLeadData(leadData);
    if (leadValidation.isErr()) {
      return err(leadValidation.error);
    }

    // Create contact
    const contactResult = await this.contactRepository.create({
      ...contactData,
      organizationId: user.organizationId,
    });

    if (contactResult.isErr()) {
      return err(contactResult.error);
    }

    // Create lead with contact reference
    const leadResult = await this.leadRepository.create({
      ...leadData,
      contactId: contactResult.value.id,
      organizationId: user.organizationId,
    });

    if (leadResult.isErr()) {
      // Rollback contact creation if lead creation fails
      await this.contactRepository.delete(contactResult.value.id);
      return err(leadResult.error);
    }

    return ok({
      contact: contactResult.value,
      lead: leadResult.value,
    });
  }
}
```

### **Error Mapping and Transformation**
```typescript
// ✅ CORRECT - Transform and map errors appropriately
export class PaymentService {
  async processPayment(paymentData: ProcessPaymentData): Promise<Result<Payment, DomainError>> {
    try {
      // Validate payment data
      const validation = this.validatePaymentData(paymentData);
      if (validation.isErr()) {
        return err(validation.error);
      }

      // Check invoice status
      const invoice = await this.invoiceRepository.findById(paymentData.invoiceId);
      if (invoice.isErr()) {
        return err(invoice.error);
      }

      if (!invoice.value) {
        return err(new NotFoundError('Invoice', paymentData.invoiceId));
      }

      if (invoice.value.status !== 'approved') {
        return err(new BusinessRuleError('INVOICE_NOT_APPROVED', 'Cannot pay for unapproved invoice'));
      }

      // Process payment with external provider
      const paymentResult = await this.paymentProvider.charge(paymentData);
      if (paymentResult.isErr()) {
        // Transform external payment errors to domain errors
        return this.mapPaymentError(paymentResult.error);
      }

      // Create payment record
      const payment = await this.paymentRepository.create({
        ...paymentData,
        status: 'completed',
        externalId: paymentResult.value.id,
        processedAt: new Date(),
      });

      // Update invoice status
      await this.invoiceRepository.updateStatus(paymentData.invoiceId, 'paid');

      return ok(payment.value);
    } catch (error) {
      console.error('Unexpected error in processPayment:', error);
      return err(new DomainError('INTERNAL_ERROR', 'Failed to process payment'));
    }
  }

  private mapPaymentError(error: PaymentProviderError): DomainError {
    switch (error.code) {
      case 'INSUFFICIENT_FUNDS':
        return new BusinessRuleError('INSUFFICIENT_FUNDS', 'Payment failed due to insufficient funds');
      case 'CARD_DECLINED':
        return new BusinessRuleError('CARD_DECLINED', 'Payment card was declined');
      case 'INVALID_CVV':
        return new ValidationError('cvv', 'Invalid CVV code');
      default:
        return new DomainError('PAYMENT_FAILED', `Payment failed: ${error.message}`);
    }
  }
}
```

## Route Handler Integration

### **Route Handler Pattern**
```typescript
// ✅ CORRECT - Route handlers translate Results to HTTP responses
router.post('/users', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await userService.createUser(req.body);
    
    if (result.isErr()) {
      return next(result.error); // Pass to global error handler
    }
    
    res.status(201).json({ data: result.value });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.findById(id, req.user.organizationId);
    
    if (result.isErr()) {
      return next(result.error);
    }
    
    if (!result.value) {
      return next(new NotFoundError('User', id));
    }
    
    res.json({ data: result.value });
  } catch (error) {
    next(error);
  }
});
```

### **Global Error Handler**
```typescript
// ✅ CORRECT - Global handler translates DomainErrors to HTTP responses
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
    code: 'INTERNAL_ERROR',
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
    case 'DUPLICATE_RESOURCE':
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

## Testing with NeverThrow

### **Service Testing**
```typescript
// ✅ CORRECT - Test both success and error paths
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };
      const expectedUser = { id: 'user-1', ...userData };

      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual(expectedUser);
    });

    it('should return error for duplicate email', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'password123',
      };
      const existingUser = { id: 'user-1', email: 'existing@example.com' };

      mockRepository.findByEmail.mockResolvedValue(existingUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('USER_ALREADY_EXISTS');
      expect(result.error.message).toBe('User with this email already exists');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
```

## Advanced Patterns

### **Async Result Chaining**
```typescript
// ✅ CORRECT - Chain async operations with Result
export class OrderService {
  async processOrder(orderData: CreateOrderData): Promise<Result<Order, DomainError>> {
    return (await this.validateOrder(orderData))
      .asyncMap(validated => this.checkInventory(validated))
      .asyncMap(order => this.reserveInventory(order))
      .asyncMap(order => this.processPayment(order))
      .asyncMap(order => this.createOrder(order))
      .asyncMap(order => this.sendConfirmation(order));
  }

  private async validateOrder(data: CreateOrderData): Promise<Result<ValidatedOrder, DomainError>> {
    // Validation logic
    return ok(data as ValidatedOrder);
  }

  private async checkInventory(order: ValidatedOrder): Promise<Result<Order, DomainError>> {
    // Inventory check
    return ok(order as Order);
  }

  private async reserveInventory(order: Order): Promise<Result<Order, DomainError>> {
    // Inventory reservation
    return ok(order);
  }

  private async processPayment(order: Order): Promise<Result<Order, DomainError>> {
    // Payment processing
    return ok(order);
  }

  private async createOrder(order: Order): Promise<Result<Order, DomainError>> {
    // Order creation
    return ok(order);
  }

  private async sendConfirmation(order: Order): Promise<Result<Order, DomainError>> {
    // Send confirmation
    return ok(order);
  }
}
```

### **Result Utilities**
```typescript
// ✅ CORRECT - Helper functions for Result operations
export class ResultUtils {
  static async find<T, E>(
    predicate: (item: T) => Promise<boolean>,
    items: T[]
  ): Promise<Result<T | null, E>> {
    for (const item of items) {
      if (await predicate(item)) {
        return ok(item);
      }
    }
    return ok(null);
  }

  static async firstSuccess<T, E>(
    operations: Array<() => Promise<Result<T, E>>>
  ): Promise<Result<T, E>> {
    for (const operation of operations) {
      const result = await operation();
      if (result.isOk()) {
        return result;
      }
    }
    return err(new DomainError('ALL_OPERATIONS_FAILED', 'All operations failed'));
  }

  static combine<T, E>(results: Array<Result<T, E>>): Result<T[], E> {
    const values: T[] = [];
    const errors: E[] = [];

    for (const result of results) {
      if (result.isOk()) {
        values.push(result.value);
      } else {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      return err(errors[0]); // Return first error
    }

    return ok(values);
  }
}
```

## Anti-Patterns

❌ **Never** throw exceptions from service methods
❌ **Never** use try-catch to swallow errors without returning Result
❌ **Never** mix throw-based and Result-based error handling
❌ **Never** ignore Result errors with `.unwrap()` or similar
❌ **Never** return Promise without Result wrapper
❌ **Never** use boolean return values for error indication
❌ **Never** handle errors in route handlers instead of services

## Quality Checklist

- [ ] All service methods return `Result<T, DomainError>`
- [ ] No exceptions are thrown from service layer
- [ ] Domain errors are properly typed and structured
- [ ] Repository methods return Result types
- [ ] Route handlers translate Results to HTTP responses
- [ ] Global error handler handles DomainError types
- [ ] Tests cover both success and error paths
- [ ] Result chaining is used for complex operations
- [ ] Database errors are mapped to domain errors
- [ ] No raw Promise throws escape the service layer

This rule ensures consistent, type-safe error handling that makes the system more predictable and maintainable while preventing unexpected exceptions from bubbling up.
