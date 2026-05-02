---
name: error-handler-middleware
description: Implement global Express error handling middleware with DomainError mapping, structured logging, and consistent HTTP response formatting
---

# Error Handler Middleware Implementation

This skill guides you through implementing a global Express error handling middleware that maps domain errors to HTTP responses, provides structured logging, and ensures consistent error formatting across the API.

## Current State Assessment

**Current State**: No global error handler exists - errors will be inconsistent and lack proper formatting.

**Missing Infrastructure**:
- No centralized error handling
- No DomainError to HTTP status mapping
- No structured logging with request correlation
- No consistent error response format

## Error Handling Architecture

### **Error Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Request Processing                              │
│                                                                  │
│  Route Handler ──► Service ──► Domain Error                      │
│       │                              │                           │
│       │                              ▼                           │
│       │                     DomainError                          │
│       │                     (code, message, details)             │
│       │                              │                           │
│       │                              ▼                           │
│       │  ┌──────────────────────────────────────────────────┐  │
│       └──►│         Error Handler Middleware                 │  │
│           │                                                    │  │
│           │  1. Log error with request context                 │  │
│           │  2. Map DomainError to HTTP status                 │  │
│           │  3. Format consistent response                     │  │
│           │  4. Send to Sentry (if configured)                 │  │
│           │                                                    │  │
│           │  Response: { success: false, error: {...} }      │  │
│           └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### **Error Response Format**

```typescript
// Standard error envelope
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Domain error code
    message: string;      // Human-readable message
    details?: unknown;    // Additional context (validation errors, etc.)
    requestId?: string;   // For correlation with logs
  };
}

// Example responses
// 400 Validation Error
{
  "success": false,
  "error": {
    "code": "ValidationError",
    "message": "Invalid request data",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Minimum 12 characters required" }
    ],
    "requestId": "req-123-456"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "LeadNotFound",
    "message": "Lead with ID 'lead-123' was not found",
    "requestId": "req-123-457"
  }
}

// 409 Conflict
{
  "success": false,
  "error": {
    "code": "DuplicateEmail",
    "message": "A user with email 'john@example.com' already exists",
    "requestId": "req-123-458"
  }
}
```

## Step-by-Step Implementation

### **Step 1: Create Domain Error Base Class**

**File**: `artifacts/api-server/src/errors/domain-errors.ts`

```typescript
import { Result, err } from 'neverthrow';

/**
 * Base class for all domain errors
 * Uses neverthrow Either pattern for type-safe error handling
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Helper to create an Either Left (error) result
   */
  toResult<T>(): Result<T, this> {
    return err(this);
  }
}

// ==================== Identity & Access Errors ====================

export class InvalidCredentials extends DomainError {
  readonly code = 'InvalidCredentials';
  readonly statusCode = 401;
  
  constructor() {
    super('Invalid email or password');
  }
}

export class TokenExpired extends DomainError {
  readonly code = 'TokenExpired';
  readonly statusCode = 401;
  
  constructor() {
    super('Your session has expired. Please log in again.');
  }
}

export class DuplicateEmail extends DomainError {
  readonly code = 'DuplicateEmail';
  readonly statusCode = 409;
  
  constructor(email: string) {
    super(`A user with email '${email}' already exists`);
  }
}

export class UserNotFound extends DomainError {
  readonly code = 'UserNotFound';
  readonly statusCode = 404;
  
  constructor(userId: string) {
    super(`User with ID '${userId}' was not found`);
  }
}

export class InvalidOrganization extends DomainError {
  readonly code = 'InvalidOrganization';
  readonly statusCode = 400;
  
  constructor(orgId: string) {
    super(`Organization with ID '${orgId}' was not found`);
  }
}

export class InsufficientPermissions extends DomainError {
  readonly code = 'InsufficientPermissions';
  readonly statusCode = 403;
  
  constructor(permission: string) {
    super(`You do not have the required permission: ${permission}`);
  }
}

// ==================== CRM Errors ====================

export class LeadNotFound extends DomainError {
  readonly code = 'LeadNotFound';
  readonly statusCode = 404;
  
  constructor(leadId: string) {
    super(`Lead with ID '${leadId}' was not found`);
  }
}

export class InvalidStageTransition extends DomainError {
  readonly code = 'InvalidStageTransition';
  readonly statusCode = 400;
  
  constructor(from: string, to: string) {
    super(`Cannot transition from '${from}' to '${to}'`);
  }
}

export class DuplicateLead extends DomainError {
  readonly code = 'DuplicateLead';
  readonly statusCode = 409;
  
  constructor(email: string) {
    super(`A lead with email '${email}' already exists`);
  }
}

export class ContactNotFound extends DomainError {
  readonly code = 'ContactNotFound';
  readonly statusCode = 404;
  
  constructor(contactId: string) {
    super(`Contact with ID '${contactId}' was not found`);
  }
}

// ==================== Validation Errors ====================

export class ValidationError extends DomainError {
  readonly code = 'ValidationError';
  readonly statusCode = 400;
  
  constructor(
    message: string = 'Invalid request data',
    public readonly fieldErrors: Array<{ field: string; message: string }> = []
  ) {
    super(message, fieldErrors);
  }
}

export class WeakPassword extends DomainError {
  readonly code = 'WeakPassword';
  readonly statusCode = 400;
  
  constructor(details: string) {
    super('Password does not meet security requirements', details);
  }
}

// ==================== Infrastructure Errors ====================

export class DatabaseError extends DomainError {
  readonly code = 'DatabaseError';
  readonly statusCode = 500;
  
  constructor(message: string = 'Database operation failed') {
    super(message);
  }
}

export class ExternalServiceError extends DomainError {
  readonly code = 'ExternalServiceError';
  readonly statusCode = 502;
  
  constructor(service: string) {
    super(`Failed to communicate with ${service}`);
  }
}

// ==================== Error Type Guards ====================

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function isNotFoundError(error: DomainError): boolean {
  return error.statusCode === 404;
}

export function isValidationError(error: DomainError): boolean {
  return error.statusCode === 400 && error.code === 'ValidationError';
}

// ==================== Error Factory ====================

export const Errors = {
  invalidCredentials: () => new InvalidCredentials(),
  tokenExpired: () => new TokenExpired(),
  duplicateEmail: (email: string) => new DuplicateEmail(email),
  userNotFound: (id: string) => new UserNotFound(id),
  leadNotFound: (id: string) => new LeadNotFound(id),
  contactNotFound: (id: string) => new ContactNotFound(id),
  invalidStageTransition: (from: string, to: string) => new InvalidStageTransition(from, to),
  duplicateLead: (email: string) => new DuplicateLead(email),
  validation: (message?: string, fields?: Array<{ field: string; message: string }>) => 
    new ValidationError(message, fields),
  weakPassword: (details: string) => new WeakPassword(details),
  insufficientPermissions: (permission: string) => new InsufficientPermissions(permission),
  database: (message?: string) => new DatabaseError(message),
};
```

### **Step 2: Create Global Error Handler Middleware**

**File**: `artifacts/api-server/src/middlewares/error-handler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isDomainError, ValidationError, DatabaseError } from '../errors/domain-errors';
import { logger } from '../lib/logger';
import { randomUUID } from 'crypto';

/**
 * Extended Error type that includes potential statusCode
 */
interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Generate a unique request ID for error correlation
 */
function getRequestId(req: Request): string {
  return (req.headers['x-request-id'] as string) || randomUUID();
}

/**
 * Map Zod validation errors to our format
 */
function formatZodError(error: ZodError): Array<{ field: string; message: string }> {
  return error.errors.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Determine if error should be logged as error or warn
 */
function shouldLogAsError(error: DomainError): boolean {
  // 4xx errors are client issues, 5xx are server issues
  return error.statusCode >= 500;
}

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 */
export function errorHandler(
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = getRequestId(req);
  
  // Build error context for logging
  const errorContext = {
    requestId,
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    organizationId: (req as any).user?.org,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };

  let domainError: DomainError;
  let statusCode: number;

  // Convert different error types to DomainError
  if (isDomainError(error)) {
    domainError = error;
    statusCode = error.statusCode;
  } else if (error instanceof ZodError) {
    domainError = new ValidationError(
      'Validation failed',
      formatZodError(error)
    );
    statusCode = 400;
  } else if (error.name === 'PostgresError' || error.name === 'DatabaseError') {
    domainError = new DatabaseError();
    statusCode = 500;
    // Log database errors for investigation
    logger.error({
      ...errorContext,
      error: error.message,
      stack: error.stack,
    }, 'Database error occurred');
  } else {
    // Unknown error - generic 500
    domainError = new DatabaseError('An unexpected error occurred');
    statusCode = error.statusCode || 500;
    
    // Log unexpected errors with full details
    logger.error({
      ...errorContext,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    }, 'Unexpected error occurred');
  }

  // Log domain errors (warn for 4xx, error for 5xx)
  const logData = {
    ...errorContext,
    errorCode: domainError.code,
    errorMessage: domainError.message,
    errorDetails: domainError.details,
  };

  if (shouldLogAsError(domainError)) {
    logger.error(logData, `Server error: ${domainError.code}`);
  } else {
    logger.warn(logData, `Client error: ${domainError.code}`);
  }

  // Send Sentry report for server errors (if configured)
  if (statusCode >= 500 && process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: errorContext });
  }

  // Build response
  const errorResponse = {
    success: false,
    error: {
      code: domainError.code,
      message: domainError.message,
      ...(domainError.details && { details: domainError.details }),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack,
      }),
      requestId,
    },
  };

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = getRequestId(req);
  
  logger.warn({
    requestId,
    method: req.method,
    path: req.path,
  }, 'Route not found');

  res.status(404).json({
    success: false,
    error: {
      code: 'RouteNotFound',
      message: `Route ${req.method} ${req.path} not found`,
      requestId,
    },
  });
}

/**
 * Async handler wrapper to catch errors from async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### **Step 3: Create Structured Logger**

**File**: `artifacts/api-server/src/lib/logger.ts`

```typescript
import pino from 'pino';

/**
 * Pino logger configuration
 * - Structured JSON logging for production
 * - Pretty printing for development
 * - Redacted sensitive fields
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Pretty print in development
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  
  // Base context
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
  
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'accessToken',
      'jwt',
      'secret',
      'apiKey',
      'api_key',
      'headers.authorization',
      'headers.cookie',
    ],
    remove: true,
  },
});

// Child logger factory for request context
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId,
  });
}
```

### **Step 4: Register Error Handler in App**

**File**: `artifacts/api-server/src/app.ts`

```typescript
import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import routes from './routes';

const app = express();

// ... other middleware (body parsing, cors, etc.)

// API routes
app.use('/api', routes);

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Global error handler - must be LAST
app.use(errorHandler);

export { app };
```

### **Step 5: Update Routes to Use Async Handler**

**File**: `artifacts/api-server/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { asyncHandler } from '../middlewares/error-handler';
import { authService } from '../services/auth';

const router = Router();

// Use asyncHandler to catch errors
router.post('/register', asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  
  if (result.isErr()) {
    // Errors are thrown to be caught by error handler
    throw result.error;
  }
  
  res.status(201).json({
    success: true,
    data: result.value,
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const result = await authService.authenticateUser(
    req.body.email,
    req.body.password
  );
  
  if (result.isErr()) {
    throw result.error;
  }
  
  res.json({
    success: true,
    data: result.value,
  });
}));

export default router;
```

### **Step 6: Error Handler Tests**

**File**: `artifacts/api-server/__tests__/middlewares/error-handler.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { leadRepository } from '@workspace/db/repositories';

describe('Error Handler Middleware', () => {
  describe('DomainError handling', () => {
    it('should return 404 for LeadNotFound', async () => {
      const response = await request(app)
        .get('/api/crm/leads/non-existent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LeadNotFound');
      expect(response.body.error.requestId).toBeDefined();
    });

    it('should return 400 for ValidationError with details', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('ValidationError');
      expect(response.body.error.details).toBeDefined();
    });

    it('should return 401 for InvalidCredentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('InvalidCredentials');
    });

    it('should return 409 for DuplicateEmail', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DuplicateEmail');
    });
  });

  describe('Zod validation errors', () => {
    it('should format Zod errors as ValidationError', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          email: 'not-an-email',
          firstName: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('ValidationError');
      expect(response.body.error.details).toBeInstanceOf(Array);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('RouteNotFound');
    });
  });

  describe('Error response format', () => {
    it('should include requestId in all error responses', async () => {
      const response = await request(app)
        .get('/api/crm/leads/invalid');

      expect(response.body.error.requestId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should include stack trace in development', async () => {
      // Test with NODE_ENV=development
      const response = await request(app)
        .get('/api/crm/leads/invalid');

      if (process.env.NODE_ENV !== 'production') {
        expect(response.body.error.stack).toBeDefined();
      }
    });
  });
});
```

### **Step 7: Error Mapping Reference**

**File**: `artifacts/api-server/src/errors/error-map.ts`

```typescript
import { DomainError } from './domain-errors';

/**
 * Error to HTTP status code mapping
 * Used for documentation and testing
 */
export const ErrorStatusMap: Record<number, string[]> = {
  400: [
    'ValidationError',
    'WeakPassword',
    'InvalidStageTransition',
    'InvalidOrganization',
  ],
  401: [
    'InvalidCredentials',
    'TokenExpired',
  ],
  403: [
    'InsufficientPermissions',
  ],
  404: [
    'UserNotFound',
    'LeadNotFound',
    'ContactNotFound',
    'DealNotFound',
    'RouteNotFound',
  ],
  409: [
    'DuplicateEmail',
    'DuplicateLead',
  ],
  500: [
    'DatabaseError',
  ],
  502: [
    'ExternalServiceError',
  ],
};

/**
 * Get HTTP status code for a domain error
 */
export function getStatusCode(error: DomainError): number {
  return error.statusCode;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: DomainError): boolean {
  return error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: DomainError): boolean {
  return error.statusCode >= 500;
}
```

## Sentry Integration (Optional)

**File**: `artifacts/api-server/src/lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/node';

export function initSentry(): void {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.npm_package_version,
      
      // Only send server errors
      beforeSend(event) {
        const statusCode = event.extra?.statusCode as number;
        if (statusCode && statusCode < 500) {
          return null; // Don't send client errors
        }
        return event;
      },
    });
  }
}

export { Sentry };
```

## Verification Commands

```bash
# Test error responses
pnpm vitest run artifacts/api-server/__tests__/middlewares/error-handler.test.ts

# Check error coverage
grep -r "throw.*Error" artifacts/api-server/src/ | wc -l

# Verify all errors extend DomainError
grep -r "extends DomainError" artifacts/api-server/src/errors/
```

## Error Handling Checklist

- [ ] All errors extend `DomainError` base class
- [ ] Error handler registered as last middleware
- [ ] Async route handlers use `asyncHandler`
- [ ] Zod validation errors converted to `ValidationError`
- [ ] Request ID included in all error responses
- [ ] Structured logging with error context
- [ ] Sensitive data redacted from logs
- [ ] Stack traces in development only
- [ ] 404 handler for unmatched routes
- [ ] Sentry integration for server errors (optional)
