---
trigger: model_decision
description: Idempotency key requirements for API operations to prevent duplicate processing and ensure data consistency
---

# Idempotency Key Requirement

## Core Principle

### Idempotency by Design
All state-changing API operations must be idempotent. Clients should be able to safely retry requests without causing duplicate operations. The server must detect and prevent duplicate processing using idempotency keys.

## Required Implementation

### 1. Idempotency Key Format
```typescript
// ✅ CORRECT - Standard idempotency key format
interface IdempotencyKey {
  // Format: {client-id}:{operation-type}:{resource-id}:{timestamp}
  // Example: "client-123:create-user:456:1640995200"
  clientId: string;
  operationType: string;
  resourceId?: string;
  timestamp: number;
}

// ✅ CORRECT - Idempotency key generator
export class IdempotencyKeyGenerator {
  static generate(
    clientId: string,
    operationType: string,
    resourceId?: string,
    timestamp?: number
  ): string {
    const ts = timestamp || Date.now();
    const parts = [
      clientId,
      operationType,
      resourceId || 'global',
      ts.toString(),
    ];
    return parts.join(':');
  }

  static parse(key: string): IdempotencyKey {
    const parts = key.split(':');
    if (parts.length < 4) {
      throw new Error('Invalid idempotency key format');
    }
    
    return {
      clientId: parts[0],
      operationType: parts[1],
      resourceId: parts[2],
      timestamp: parseInt(parts[3], 10),
    };
  }
}

// ❌ INCORRECT - Simple UUID without context
function generateIdempotencyKey(): string {
  return crypto.randomUUID(); // No client context or operation type
}
```

### 2. Request Headers
```typescript
// ✅ CORRECT - Standard idempotency header
interface IdempotencyHeaders {
  'Idempotency-Key': string;
  'Idempotency-Client': string;
  'Idempotency-Operation': string;
}

// ✅ CORRECT - Middleware to extract idempotency key
export function extractIdempotencyKey(
  headers: Record<string, string>
): IdempotencyKey | null {
  const key = headers['idempotency-key'];
  if (!key) return null;
  
  try {
    return IdempotencyKeyGenerator.parse(key);
  } catch (error) {
    console.error('Invalid idempotency key format:', error);
    return null;
  }
}

// ❌ INCORRECT - Missing header validation
function getIdempotencyKey(headers: Record<string, string>): string {
  return headers['idempotency-key'] || 'default-key'; // Default key defeats purpose
}
```

### 3. Idempotency Storage
```typescript
// ✅ CORRECT - Redis-based idempotency storage
export class IdempotencyStorage {
  private redis: Redis;
  private keyPrefix = 'idempotency:';
  private defaultTTL = 3600; // 1 hour

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async store(
    key: string,
    response: any,
    status: 'processing' | 'completed' | 'failed',
    ttl?: number
  ): Promise<void> {
    const storageKey = this.keyPrefix + key;
    const data = {
      status,
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL) * 1000,
    };
    
    await this.redis.setex(storageKey, JSON.stringify(data), ttl || this.defaultTTL);
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const storageKey = this.keyPrefix + key;
    const data = await this.redis.get(storageKey);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing idempotency record:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const storageKey = this.keyPrefix + key;
    await this.redis.del(storageKey);
  }

  async exists(key: string): Promise<boolean> {
    const storageKey = this.keyPrefix + key;
    const exists = await this.redis.exists(storageKey);
    return exists === 1;
  }
}

interface IdempotencyRecord {
  status: 'processing' | 'completed' | 'failed';
  response: any;
  timestamp: number;
  expiresAt: number;
}

// ❌ INCORRECT - In-memory storage only
export class MemoryIdempotencyStorage {
  private store = new Map<string, IdempotencyRecord>();
  
  async store(key: string, response: any, status: string): Promise<void> {
    this.store.set(key, { status, response, timestamp: Date.now() });
  }
  
  // Lost on restart - not suitable for production
}
```

### 4. Idempotency Middleware
```typescript
// ✅ CORRECT - Express middleware for idempotency
export function idempotencyMiddleware(
  storage: IdempotencyStorage
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = extractIdempotencyKey(req.headers);
    
    if (!idempotencyKey) {
      return res.status(400).json({
        error: 'Idempotency-Key header is required for state-changing operations',
        code: 'IDEMPOTENCY_KEY_REQUIRED',
      });
    }

    // Check if operation is already in progress or completed
    const existing = await storage.get(idempotencyKeyGenerator.generate(
      idempotencyKey.clientId,
      idempotencyKey.operationType,
      idempotencyKey.resourceId
    ));

    if (existing) {
      if (existing.status === 'processing') {
        return res.status(409).json({
          error: 'Operation is already in progress',
          code: 'OPERATION_IN_PROGRESS',
        });
      }

      if (existing.status === 'completed') {
        return res.status(200).json({
          data: existing.response,
          code: 'OPERATION_ALREADY_COMPLETED',
        });
      }

      if (existing.status === 'failed') {
        // Allow retry for failed operations
        await storage.delete(idempotencyKeyGenerator.generate(
          idempotencyKey.clientId,
          idempotencyKey.operationType,
          idempotencyKey.resourceId
        ));
      }
    }

    // Store processing status
    await storage.store(
      idempotencyKeyGenerator.generate(
        idempotencyKey.clientId,
        idempotencyKey.operationType,
        idempotencyKey.resourceId
      ),
      null,
      'processing'
    );

    // Add idempotency context to request
    req.idempotencyKey = idempotencyKey;
    req.idempotencyStorage = storage;

    next();
  };
}

// ❌ INCORRECT - No middleware, manual handling in each route
app.post('/users', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // Manual check in every route - error-prone
  const existing = await checkIdempotency(idempotencyKey);
  if (existing) {
    return res.status(200).json(existing.response);
  }
  
  // Business logic here
});
```

## Implementation Patterns

### 1. Route Handler Pattern
```typescript
// ✅ CORRECT - Idempotent route handler
router.post('/users', idempotencyMiddleware(idempotencyStorage), async (req, res, next) => {
  try {
    const { name, email } = createUserSchema.parse(req.body);
    
    // Business logic
    const user = await userService.createUser({ name, email });
    
    // Store successful response
    if (req.idempotencyKey && req.idempotencyStorage) {
      await req.idempotencyStorage.store(
        idempotencyKeyGenerator.generate(
          req.idempotencyKey.clientId,
          'create-user',
          user.id
        ),
        user,
        'completed'
      );
    }
    
    res.status(201).json({
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    // Store failure response
    if (req.idempotencyKey && req.idempotencyStorage) {
      await req.idempotencyStorage.store(
        idempotencyKeyGenerator.generate(
          req.idempIdempotencyKey.clientId,
          'create-user',
          req.idempotencyKey.resourceId
        ),
        { error: error.message },
        'failed'
      );
    }
    
    next(error);
  }
});

// ❌ INCORRECT - Non-idempotent handler
router.post('/users', async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
  // No idempotency - duplicate requests create multiple users
});
```

### 2. Service Layer Pattern
```typescript
// ✅ CORRECT - Idempotent service method
class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Business validation
    const validated = this.validateUserData(userData);
    
    // Check if user already exists
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }
    
    // Create user
    const user = await this.userRepository.create(userData);
    
    return user;
  }

  async updateUser(
    userId: string,
    updates: Partial<UserData>
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    const updatedUser = await this.userRepository.update(userId, updates);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    await this.userRepository.delete(userId);
  }
}

// ❌ INCORRECT - Non-idempotent service
class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    // No duplicate checking - creates multiple users on retry
    return await this.userRepository.create(userData);
  }
}
```

### 3. Client-Side Implementation
```typescript
// ✅ CORRECT - Client-side idempotency key handling
class ApiClient {
  private generateIdempotencyKey(
    operationType: string,
    resourceId?: string
  ): string {
    const clientId = this.getClientId();
    const timestamp = Date.now();
    const parts = [clientId, operationType];
    
    if (resourceId) {
      parts.push(resourceId);
    }
    
    parts.push(timestamp.toString());
    return parts.join(':');
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const idempotencyKey = this.generateIdempotencyKey('create-user');
    
    return this.request('/users', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  }

  async updateUser(
    userId: string,
    updates: Partial<UserData>
  ): Promise<User> {
    const idempotencyKey = this.generateIdempotencyKey('update-user', userId);
    
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        const error = await response.text();
        throw new ApiError(error, response.status);
      }
      
      return response.json();
  }
}

// ❌ INCORRECT - No idempotency on client side
class SimpleApiClient {
  async createUser(userData: CreateUserRequest): Promise<User> {
    return fetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }).then(res => res.json());
  }
}
```

## Error Handling

### 1. Idempotency-Specific Errors
```typescript
// ✅ CORRECT - Specific error types
export class IdempotencyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'IdempotencyError';
  }
}

export class OperationInProgressError extends IdempotencyError {
  constructor(operationType: string) {
    super(
      `Operation ${operationType} is already in progress`,
      'OPERATION_IN_PROGRESS',
      409
    );
  }
}

export class OperationAlreadyCompletedError extends IdempotencyError {
  constructor(operationType: string, response: any) {
    super(
      `Operation ${operationType} has already been completed`,
      'OPERATION_ALREADY_COMPLETED',
      200
    );
    }
}

export class IdempotencyKeyRequiredError extends IdempotencyError {
  constructor() {
    super(
      'Idempotency-Key header is required for state-changing operations',
      'IDEMPOTENCY_KEY_REQUIRED',
      400
    );
  }
}

// ❌ INCORRECT - Generic error handling
function handleIdempotencyError(error: any) {
  if (error.code === 'duplicate') {
    return res.status(409).json({ error: 'Duplicate request' });
  }
  // No specific error types - loses context
}
```

### 2. Error Recovery
```typescript
// ✅ CORRECT - Error recovery with retry
export class ResilientApiClient {
  async createWithRetry(
    userData: CreateUserRequest,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<User> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.createUser(userData);
      } catch (error) {
        lastError = error;
        
        if (error instanceof OperationInProgressError) {
          // Wait for operation to complete
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        if (error instanceof OperationAlreadyCompletedError) {
          // Return cached response
          return error.response;
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
    
    throw lastError;
  }
}

// ❌ INCORRECT - No retry logic
class SimpleApiClient {
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      return await this.createUser(userData);
    } catch (error) {
      throw error; // No retry, fails immediately
    }
  }
}
```

## Testing Idempotency

### 1. Unit Tests
```typescript
// ✅ CORRECT - Idempotency testing
describe('User Creation Idempotency', () => {
  let storage: IdempotencyStorage;
  let userService: UserService;

  beforeEach(() => {
    storage = new IdempotencyStorage(new Redis());
    userService = new UserService(storage);
  });

  it('should prevent duplicate user creation', async () => {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    const idempotencyKey = 'client-123:create-user:1640995200';
    
    // First request
    const user1 = await userService.createUser(userData, idempotencyKey);
    expect(user1.id).toBeDefined();
    
    // Second request with same key
    const user2 = await userService.createUser(userData, idempotencyKey);
    expect(user2).toBe(user1); // Returns same user
  });

  it('should allow retry after failure', async () => {
      const userData = { name: 'Jane Doe', email: 'jane@example.com' };
      const idempotencyKey = 'client-456:create-user:1640995200';
      
      // First request fails
      try {
        await userService.createUser(userData, idempotencyKey);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }
      
      // Second request should succeed
      const user = await userService.createUser(userData, idempotencyKey);
      expect(user.id).toBeDefined();
    });
});
```

### 2. Integration Tests
```typescript
// ✅ CORRECT - End-to-end idempotency testing
describe('API Idempotency Integration', () => {
  let app: Express;
  let storage: IdempotencyStorage;

  beforeAll(async () => {
    storage = new IdempotencyStorage(new Redis());
    app = createApp(storage);
  });

  it('should handle concurrent requests correctly', async () => {
    const userData = { name: 'Test User', email: 'test@example.com' };
    const idempotencyKey = 'client-789:create-user:1640995200';
    
    // Send multiple concurrent requests
    const requests = Array(5).fill(null).map(() =>
      fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(userData),
      })
    );
    
    const responses = await Promise.allSettled(requests);
    
    // All should return the same user
    const successfulResponses = responses.filter(r => r.status === 201);
    expect(successfulResponses).toHaveLength(1);
    
    const user = await successfulResponses[0].json();
    expect(user.id).toBeDefined();
    
    // Other requests should indicate operation in progress
    const inProgressResponses = responses.filter(r => r.status === 409);
    expect(inProgressResponses).toHaveLength(4);
  });
});
```

## Performance Considerations

### 1. Storage Optimization
```typescript
// ✅ CORRECT - Optimized storage with TTL
export class OptimizedIdempotencyStorage {
  private redis: Redis;
  private keyPrefix = 'idempotency:';
  private defaultTTL = 3600; // 1 hour
  private maxTTL = 86400; // 24 hours

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async store(
    key: string,
    response: any,
    status: string,
    ttl?: number
  ): Promise<void> {
    // Use shorter TTL for operations that complete quickly
    const optimizedTTL = Math.min(
      ttl || this.defaultTTL,
      this.maxTTL
    );
    
    const storageKey = this.keyPrefix + key;
    const data = {
      status,
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + optimizedTTL * 1000,
    };
    
    await this.redis.setex(storageKey, JSON.stringify(data), optimizedTTL);
  }

  async cleanup(): Promise<void> {
    // Clean up expired records
    const pattern = this.keyPrefix + '*';
    const keys = await this.redis.keys(pattern);
    
    const expiredKeys = [];
    for (const key of keys) {
      const record = await this.redis.get(key);
      if (record) {
        const data = JSON.parse(record);
        if (data.expiresAt < Date.now()) {
          expiredKeys.push(key);
        }
      }
    }
    
    if (expiredKeys.length > 0) {
      await this.redis.del(...expiredKeys);
    }
  }
}

// ❌ INCORRECT - No cleanup, memory leak
export class MemoryIdempotencyStorage {
  private store = new Map<string, any>();
  
  async store(key: string, response: any, status: string): Promise<void> {
    this.store.set(key, { status, response, timestamp: Date.now() });
    // No cleanup, memory leak over time
  }
}
```

### 2. Batch Operations
```typescript
// ✅ CORRECT - Batch idempotency handling
export class BatchOperationProcessor {
  async processBatch(
    operations: BatchOperation[]
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    
    for (const operation of operations) {
      try {
        const result = await this.processOperation(operation);
        results.push({
          id: operation.id,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          id: operation.id,
          success: false,
          error: error.message,
        });
      }
    }
    
    return results;
  }

  private async processOperation(
    operation: BatchOperation
  ): Promise<any> {
    const idempotencyKey = this.generateIdempotencyKey(
      operation.type,
      operation.resourceId
    );
    
    // Check for existing operation
    const existing = await this.storage.get(idempotencyKey);
    if (existing) {
      return existing.response;
    }
    
    // Store processing status
    await this.storage.store(idempotencyKey, null, 'processing');
    
    // Process operation
    const result = await this.executeOperation(operation);
    
    // Store completed status
    await this.storage.store(idempotencyKey, result, 'completed');
    
    return result;
  }
}

// ❌ INCORRECT - No idempotency in batch operations
export class SimpleBatchProcessor {
  async processBatch(operations: BatchOperation[]): Promise<any[]> {
    const results = [];
    
    for (const operation of operations) {
      const result = await this.processOperation(operation);
      results.push(result);
    }
    
    return results;
  }
}
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't skip idempotency for state-changing operations**: All POST/PUT/DELETE/PATCH must be idempotent
- **Don't use simple UUIDs**: Idempotency keys must include client context and operation type
- **Don't store idempency records indefinitely**: Implement TTL to prevent memory leaks
- **Don't ignore error recovery**: Allow retry after failed operations
- **Don't mix idempotency with caching**: Use separate storage for idempotency

### 2. Common Mistakes
```typescript
// ❌ WRONG - Simple UUID without context
function generateIdempotencyKey(): string {
  return crypto.randomUUID(); // No client context or operation type
}

// ❌ WRONG - No idempotency middleware
app.post('/users', async (req, res) => {
  const key = req.headers['idempotency-key'];
  // Manual idempotency check in every route
  const existing = await checkIdempotency(key);
  if (existing) return existing.response;
  // Business logic
});

// ❌ WRONG - In-memory storage only
const idempotencyStore = new Map();
// Lost on restart, not suitable for production

// ❌ WRONG - No error recovery
try {
  const result = await operation();
  return result;
} catch (error) {
  throw error; // No retry logic
}
```

## Compliance Checklist

- [ ] All state-changing API endpoints require idempotency keys
- [ ] Idempotency keys include client context and operation type
- [ ] Idempotency middleware is properly configured
- - [ ] Idempotency storage uses persistent storage (Redis)
- [ ] Idempotency records have appropriate TTL
- [ ] Idempotency errors are properly handled
- [ ] Client-side retry logic is implemented
- [ ] Concurrent requests are handled correctly
- [ ] Failed operations can be retried
- [ ] Idempotency keys are properly validated
- [ ] Idempotency storage cleanup is implemented
- [ ] Batch operations support idempotency
- [ ] Performance optimization is implemented
- [ ] Error recovery is tested
- [ ] Integration tests cover idempotency behavior
- [ ] Documentation includes idempotency requirements
- [ ] Client examples are provided
- [ ] Error scenarios are documented
