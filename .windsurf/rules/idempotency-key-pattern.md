---
trigger: model_decision
---

# Idempotency Key Pattern Rule

## Core Requirement
Finance payments and external calls require an idempotency key with a separate `idempotency_records` table to prevent duplicate operations and ensure exactly-once processing.

## Pattern Enforcement

### Database Schema Pattern

```typescript
// ✅ CORRECT - Idempotency records table
export const idempotencyRecords = pgTable('idempotency_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  operationType: text('operation_type').notNull(), // 'payment', 'refund', 'external_call'
  operationId: text('operation_id').notNull(), // Payment ID, refund ID, etc.
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  requestPayload: json('request_payload'),
  responsePayload: json('response_payload'),
  errorMessage: text('error_message'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fast lookups
  keyIdx: pgIndex('idempotency_key_idx').on(table.key),
  operationIdx: pgIndex('idempotency_operation_idx').on(table.operationType, table.operationId),
  statusIdx: pgIndex('idempotency_status_idx').on(table.status),
  // TTL index for cleanup
  expiresAtIdx: pgIndex('idempotency_expires_idx').on(table.expiresAt),
}));

// ✅ CORRECT - Payment table with idempotency reference
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  userId: uuid('user_id').notNull(),
  method: text('method').notNull(), // 'credit_card', 'bank_transfer', 'ach'
  externalId: text('external_id'), // Payment processor ID
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  idempotencyKeyIdx: pgIndex('payments_idempotency_key_idx').on(table.idempotencyKey),
  userIdIdx: pgIndex('payments_user_idx').on(table.userId),
  statusIdx: pgIndex('payments_status_idx').on(table.status),
}));

// ❌ INCORRECT - No idempotency handling
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'),
  userId: uuid('user_id').notNull(),
  // Missing idempotency_key
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Idempotency Service Pattern

```typescript
// ✅ CORRECT - Idempotency service
export class IdempotencyService {
  constructor(private db: DrizzleDB) {}

  async checkAndLock<T>(
    key: string,
    operationType: string,
    operationId: string,
    ttlMinutes: number = 60
  ): Promise<Result<{ exists: boolean; record?: IdempotencyRecord }, DomainError>> {
    try {
      // Check if key already exists
      const existing = await this.db
        .select()
        .from(idempotencyRecords)
        .where(eq(idempotencyRecords.key, key))
        .limit(1);

      if (existing.length > 0) {
        const record = existing[0];
        
        // Check if expired
        if (record.expiresAt < new Date()) {
          // Clean up expired record
          await this.db
            .delete(idempotencyRecords)
            .where(eq(idempotencyRecords.key, key));
          
          return ok({ exists: false });
        }

        return ok({ exists: true, record });
      }

      // Create new idempotency record
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      
      const [record] = await this.db
        .insert(idempotencyRecords)
        .values({
          key,
          operationType,
          operationId,
          status: 'processing',
          expiresAt,
        })
        .returning();

      return ok({ exists: false, record });
    } catch (error) {
      console.error('Error checking idempotency:', error);
      return err(new DomainError('IDEMPOTENCY_ERROR', 'Failed to check idempotency key'));
    }
  }

  async updateStatus(
    key: string,
    status: 'completed' | 'failed',
    responsePayload?: any,
    errorMessage?: string
  ): Promise<Result<void, DomainError>> {
    try {
      await this.db
        .update(idempotencyRecords)
        .set({
          status,
          responsePayload: responsePayload ? JSON.stringify(responsePayload) : null,
          errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(idempotencyRecords.key, key));

      return ok(undefined);
    } catch (error) {
      console.error('Error updating idempotency status:', error);
      return err(new DomainError('IDEMPOTENCY_ERROR', 'Failed to update idempotency status'));
    }
  }

  async getRecord(key: string): Promise<IdempotencyRecord | null> {
    const records = await this.db
      .select()
      .from(idempotencyRecords)
      .where(eq(idempotencyRecords.key, key))
      .limit(1);

    return records[0] || null;
  }

  async cleanupExpired(): Promise<void> {
    await this.db
      .delete(idempotencyRecords)
      .where(lt(idempotencyRecords.expiresAt, new Date()));
  }
}
```

### Payment Service with Idempotency

```typescript
// ✅ CORRECT - Payment service with idempotency
export class PaymentService {
  constructor(
    private paymentRepository: PaymentRepository,
    private idempotencyService: IdempotencyService,
    private externalPaymentProvider: ExternalPaymentProvider
  ) {}

  async createPayment(
    data: CreatePaymentData,
    idempotencyKey: string
  ): Promise<Result<Payment, DomainError>> {
    // Check idempotency
    const idempotencyCheck = await this.idempotencyService.checkAndLock(
      idempotencyKey,
      'payment',
      `payment_${Date.now()}_${Math.random()}`
    );

    if (idempotencyCheck.isErr()) {
      return err(idempotencyCheck.error);
    }

    const { exists, record } = idempotencyCheck.value;

    if (exists && record) {
      // Return existing result if completed
      if (record.status === 'completed' && record.responsePayload) {
        const existingPayment = await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existingPayment) {
          return ok(existingPayment);
        }
      }

      // Return error if failed
      if (record.status === 'failed') {
        return err(new DomainError('PAYMENT_FAILED', record.errorMessage || 'Payment failed'));
      }

      // Return conflict if still processing
      return err(new DomainError('PAYMENT_PROCESSING', 'Payment is already being processed'));
    }

    try {
      // Create payment record
      const payment = await this.paymentRepository.create({
        ...data,
        idempotencyKey,
        status: 'pending',
      });

      // Process payment with external provider
      const externalResult = await this.externalPaymentProvider.processPayment({
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        metadata: data.metadata,
        referenceId: payment.id,
      });

      if (externalResult.success) {
        // Update payment status
        await this.paymentRepository.update(payment.id, {
          status: 'completed',
          externalId: externalResult.transactionId,
        });

        // Update idempotency record
        await this.idempotencyService.updateStatus(
          idempotencyKey,
          'completed',
          externalResult
        );

        return ok(payment);
      } else {
        // Update payment status
        await this.paymentRepository.update(payment.id, {
          status: 'failed',
        });

        // Update idempotency record
        await this.idempotencyService.updateStatus(
          idempotencyKey,
          'failed',
          undefined,
          externalResult.error
        );

        return err(new DomainError('PAYMENT_FAILED', externalResult.error));
      }
    } catch (error) {
      // Update idempotency record on error
      await this.idempotencyService.updateStatus(
        idempotencyKey,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return err(new DomainError('PAYMENT_ERROR', 'Failed to process payment'));
    }
  }

  async getPayment(idempotencyKey: string): Promise<Result<Payment | null, DomainError>> {
    const idempotencyRecord = await this.idempotencyService.getRecord(idempotencyKey);
    
    if (!idempotencyRecord) {
      return ok(null);
    }

    const payment = await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
    return ok(payment);
  }
}

// ❌ INCORRECT - Payment service without idempotency
export class PaymentService {
  async createPayment(data: CreatePaymentData): Promise<Result<Payment, DomainError>> {
    // No idempotency check - can create duplicate payments
    const payment = await this.paymentRepository.create({
      ...data,
      status: 'pending',
    });

    const externalResult = await this.externalPaymentProvider.processPayment(data);
    
    if (externalResult.success) {
      await this.paymentRepository.update(payment.id, {
        status: 'completed',
        externalId: externalResult.transactionId,
      });
      return ok(payment);
    } else {
      await this.paymentRepository.update(payment.id, { status: 'failed' });
      return err(new DomainError('PAYMENT_FAILED', externalResult.error));
    }
  }
}
```

### API Route with Idempotency

```typescript
// ✅ CORRECT - API route with idempotency handling
router.post('/payments', async (req, res, next) => {
  const idempotencyKey = req.get('Idempotency-Key');
  
  if (!idempotencyKey) {
    return next(new ValidationError('idempotency_key', 'Idempotency-Key header is required'));
  }

  const validation = createPaymentSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }

  const result = await paymentService.createPayment(validation.data, idempotencyKey);
  
  if (result.isErr()) {
    if (result.error.code === 'PAYMENT_PROCESSING') {
      return res.status(409).json({
        error: result.error.message,
        code: result.error.code,
      });
    }
    
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

// ✅ CORRECT - GET payment by idempotency key
router.get('/payments/by-idempotency/:key', async (req, res, next) => {
  const result = await paymentService.getPayment(req.params.key);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  if (!result.value) {
    return res.status(404).json({
      error: 'Payment not found',
    });
  }
  
  res.json(result.value);
});
```

### External Call Idempotency

```typescript
// ✅ CORRECT - External API calls with idempotency
export class ExternalAPIService {
  constructor(
    private idempotencyService: IdempotencyService,
    private httpClient: HttpClient
  ) {}

  async makeIdempotentCall<T>(
    endpoint: string,
    data: any,
    idempotencyKey: string,
    options?: RequestOptions
  ): Promise<Result<T, DomainError>> {
    // Check idempotency
    const idempotencyCheck = await this.idempotencyService.checkAndLock(
      idempotencyKey,
      'external_call',
      `${endpoint}_${Date.now()}`
    );

    if (idempotencyCheck.isErr()) {
      return err(idempotencyCheck.error);
    }

    const { exists, record } = idempotencyCheck.value;

    if (exists && record) {
      if (record.status === 'completed' && record.responsePayload) {
        return ok(JSON.parse(record.responsePayload));
      }

      if (record.status === 'failed') {
        return err(new DomainError('EXTERNAL_CALL_FAILED', record.errorMessage || 'External call failed'));
      }

      return err(new DomainError('EXTERNAL_CALL_PROCESSING', 'Call is already being processed'));
    }

    try {
      const response = await this.httpClient.post(endpoint, data, options);
      
      // Update idempotency record
      await this.idempotencyService.updateStatus(
        idempotencyKey,
        'completed',
        response.data
      );

      return ok(response.data);
    } catch (error) {
      // Update idempotency record
      await this.idempotencyService.updateStatus(
        idempotencyKey,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return err(new DomainError('EXTERNAL_CALL_ERROR', 'Failed to make external call'));
    }
  }
}
```

## Idempotency Key Generation

### Client-Side Key Generation

```typescript
// ✅ CORRECT - Client generates idempotency keys
export class IdempotencyKeyGenerator {
  static generate(operationType: string, userId?: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const userSuffix = userId ? `_${userId}` : '';
    
    return `${operationType}_${timestamp}_${random}${userSuffix}`;
  }

  static validate(key: string): boolean {
    // Basic validation - at least 20 characters, contains timestamp
    return key.length >= 20 && /\d{13}/.test(key);
  }
}

// Frontend usage
class PaymentAPI {
  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    const idempotencyKey = IdempotencyKeyGenerator.generate('payment', currentUser.id);
    
    const response = await fetch('/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Payment failed');
    }

    return response.json();
  }

  async retryPayment(paymentData: CreatePaymentData, originalKey: string): Promise<Payment> {
    // Use same idempotency key for retry
    const response = await fetch('/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': originalKey,
      },
      body: JSON.stringify(paymentData),
    });

    return response.json();
  }
}
```

## Testing Requirements

### Unit Tests

```typescript
describe('PaymentService', () => {
  describe('idempotency', () => {
    it('should prevent duplicate payments with same key', async () => {
      const paymentData = {
        amount: 100,
        currency: 'USD',
        userId: 'user-123',
        method: 'credit_card',
      };
      const idempotencyKey = 'test-key-123';

      // First call should succeed
      const result1 = await paymentService.createPayment(paymentData, idempotencyKey);
      expect(result1.isOk()).toBe(true);

      // Second call with same key should return existing result
      const result2 = await paymentService.createPayment(paymentData, idempotencyKey);
      expect(result2.isOk()).toBe(true);
      expect(result2.value.id).toBe(result1.value.id);
    });

    it('should handle processing status correctly', async () => {
      // Mock idempotency service to return processing status
      idempotencyService.checkAndLock = jest.fn().mockResolvedValue(ok({
        exists: true,
        record: { status: 'processing' }
      }));

      const result = await paymentService.createPayment(paymentData, 'key-123');
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('PAYMENT_PROCESSING');
    });

    it('should return failed result for failed payments', async () => {
      // Mock failed payment
      idempotencyService.checkAndLock = jest.fn().mockResolvedValue(ok({
        exists: true,
        record: { 
          status: 'failed',
          errorMessage: 'Payment declined'
        }
      }));

      const result = await paymentService.createPayment(paymentData, 'key-123');
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('PAYMENT_FAILED');
    });
  });
});
```

### Integration Tests

```typescript
describe('POST /payments', () => {
  it('should require idempotency key', async () => {
    const response = await request(app)
      .post('/api/v1/payments')
      .send({
        amount: 100,
        currency: 'USD',
        userId: 'user-123',
        method: 'credit_card',
      })
      .expect(400);

    expect(response.body.error).toContain('Idempotency-Key');
  });

  it('should handle duplicate requests with same key', async () => {
    const paymentData = {
      amount: 100,
      currency: 'USD',
      userId: 'user-123',
      method: 'credit_card',
    };
    const idempotencyKey = 'test-key-123';

    // First request
    const response1 = await request(app)
      .post('/api/v1/payments')
      .set('Idempotency-Key', idempotencyKey)
      .send(paymentData)
      .expect(201);

    // Second request with same key
    const response2 = await request(app)
      .post('/api/v1/payments')
      .set('Idempotency-Key', idempotencyKey)
      .send(paymentData)
      .expect(201);

    expect(response2.body.id).toBe(response1.body.id);
  });
});
```

## Common Violations and Fixes

### Missing Idempotency Key

**Violation**: No idempotency handling
```typescript
// ❌ WRONG
router.post('/payments', async (req, res, next) => {
  const result = await paymentService.createPayment(req.body);
  // Can create duplicate payments
});
```

**Fix**: Add idempotency key requirement
```typescript
// ✅ CORRECT
router.post('/payments', async (req, res, next) => {
  const idempotencyKey = req.get('Idempotency-Key');
  if (!idempotencyKey) {
    return next(new ValidationError('idempotency_key', 'Idempotency-Key required'));
  }
  
  const result = await paymentService.createPayment(req.body, idempotencyKey);
});
```

### No Idempotency Records Table

**Violation**: No tracking table
```typescript
// ❌ WRONG - No idempotency tracking
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey(),
  amount: numeric('amount').notNull(),
  // Missing idempotency tracking
});
```

**Fix**: Add idempotency records table
```typescript
// ✅ CORRECT
export const idempotencyRecords = pgTable('idempotency_records', {
  id: uuid('id').primaryKey(),
  key: text('key').notNull().unique(),
  operationType: text('operation_type').notNull(),
  status: text('status').notNull(),
  // ... other fields
});
```

### Race Conditions

**Violation**: No atomic operations
```typescript
// ❌ WRONG - Race condition possible
async createPayment(data, key) {
  const existing = await this.findByKey(key);
  if (existing) {
    return existing;
  }
  // Another request could create here
  return await this.create(data);
}
```

**Fix**: Use database-level locking
```typescript
// ✅ CORRECT - Atomic operation
async createPayment(data, key) {
  return await this.db.transaction(async (tx) => {
    const existing = await tx.select().from(idempotencyRecords)
      .where(eq(idempotencyRecords.key, key))
      .forUpdate();
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    return await tx.insert(idempotencyRecords).values({...}).returning();
  });
}
```

## Benefits

1. **Exactly-Once Processing**: Prevents duplicate operations
2. **Client Retries**: Safe retry mechanisms for network failures
3. **Financial Safety**: Prevents double charges and payments
4. **Audit Trail**: Complete record of all operations
5. **API Reliability**: Robust handling of network issues

This rule ensures financial operations and external calls are safe from duplication, providing exactly-once semantics critical for financial transactions.
