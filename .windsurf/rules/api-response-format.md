---
trigger: glob
globs: artifacts/api-server/src/routes/**/*.ts
---

# API Response Format Rule

Enforce consistent API response envelope shape, snake_case keys, and status code conventions across all endpoints.

## Response Format Standards

### **Success Response Structure**
```typescript
// ✅ CORRECT - Standard success response
{
  "data": T | T[],           // Primary data payload
  "meta": {                  // Metadata for list endpoints
    "total": number,
    "page": number,
    "limit": number,
    "has_next": boolean,
    "has_prev": boolean
  }
}

// ✅ CORRECT - Single item response
{
  "data": {
    "id": "contact-1",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "created_at": "2026-01-15T10:30:00Z"
  }
}

// ✅ CORRECT - List response with pagination
{
  "data": [
    {
      "id": "contact-1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

### **Error Response Structure**
```typescript
// ✅ CORRECT - Standard error response
{
  "error": string,           // User-friendly error message
  "details": ValidationError[], // For validation errors only
  "code": string,           // Machine-readable error code
  "timestamp": string       // ISO 8601 timestamp
}

// ✅ CORRECT - Validation error response
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_EMAIL"
    },
    {
      "field": "first_name",
      "message": "First name is required",
      "code": "REQUIRED_FIELD"
    }
  ],
  "code": "VALIDATION_ERROR",
  "timestamp": "2026-01-15T10:30:00Z"
}

// ✅ CORRECT - General error response
{
  "error": "Contact not found",
  "code": "NOT_FOUND",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

## Implementation Pattern

### **Route Handler Template**
```typescript
// ✅ CORRECT - Consistent response format
router.get('/contacts', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const results = await contactService.list(user.organizationId, {
      limit,
      offset,
      search: req.query.search as string,
    });

    const totalCount = await contactService.count(user.organizationId);

    res.json({
      data: results,
      meta: {
        total: totalCount,
        page,
        limit,
        has_next: offset + limit < totalCount,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/contacts', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await contactService.create(req.body, req.user);
    
    if (result.isErr()) {
      return next(result.error);
    }

    res.status(201).json({ data: result.value });
  } catch (error) {
    next(error);
  }
});
```

### **Error Handler Implementation**
```typescript
// ✅ CORRECT - Global error handler with consistent format
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const timestamp = new Date().toISOString();

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'VALIDATION_ERROR',
      })),
      code: 'VALIDATION_ERROR',
      timestamp,
    });
  }

  if (error instanceof DomainError) {
    const statusCode = getStatusCodeFromError(error);
    return res.status(statusCode).json({
      error: error.message,
      code: error.code,
      timestamp,
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp,
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
    case 'DUPLICATE_RESOURCE':
      return 409;
    case 'BUSINESS_RULE_VIOLATION':
      return 422;
    default:
      return 500;
  }
}
```

## Field Naming Conventions

### **snake_case for JSON Fields**
```typescript
// ✅ CORRECT - Use snake_case in API responses
{
  "data": {
    "id": "contact-1",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+1-555-0123",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z",
    "is_active": true,
    "assigned_to": "user-1"
  }
}

// ❌ INCORRECT - camelCase in API responses
{
  "data": {
    "id": "contact-1",
    "firstName": "John",     // Should be first_name
    "lastName": "Doe",       // Should be last_name
    "phoneNumber": "+1-555-0123", // Should be phone_number
    "createdAt": "2026-01-15T10:30:00Z", // Should be created_at
    "isActive": true         // Should be is_active
  }
}
```

### **Response Transformation**
```typescript
// ✅ CORRECT - Transform camelCase to snake_case
export function transformContactToResponse(contact: Contact): ContactResponse {
  return {
    id: contact.id,
    first_name: contact.firstName,
    last_name: contact.lastName,
    email: contact.email,
    phone_number: contact.phoneNumber,
    company: contact.company,
    created_at: contact.createdAt.toISOString(),
    updated_at: contact.updatedAt.toISOString(),
    is_active: contact.isActive,
    assigned_to: contact.assignedTo,
  };
}

// ✅ CORRECT - Use in service layer
export class ContactService {
  async listContacts(organizationId: string, options: ListOptions): Promise<ContactResponse[]> {
    const contacts = await this.repository.list(organizationId, options);
    return contacts.map(transformContactToResponse);
  }

  async createContact(data: CreateContactData, user: AuthenticatedUser): Promise<ContactResponse> {
    const contact = await this.repository.create(data, user.organizationId);
    return transformContactToResponse(contact);
  }
}
```

## HTTP Status Code Standards

### **Standard Status Codes**
```typescript
// ✅ CORRECT - Use appropriate HTTP status codes
const STATUS_CODES = {
  // Success codes
  OK: 200,              // GET single resource
  CREATED: 201,         // POST create resource
  NO_CONTENT: 204,      // DELETE resource
  
  // Client error codes
  BAD_REQUEST: 400,     // Validation errors
  UNAUTHORIZED: 401,     // Authentication required
  FORBIDDEN: 403,        // Permission denied
  NOT_FOUND: 404,        // Resource not found
  CONFLICT: 409,         // Duplicate resource
  UNPROCESSABLE_ENTITY: 422, // Business rule violation
  
  // Server error codes
  INTERNAL_SERVER_ERROR: 500, // Unexpected errors
} as const;

// ✅ CORRECT - Status code mapping
function getStatusCodeForOperation(operation: string, success: boolean): number {
  if (!success) {
    // Error codes handled by error handler
    return 500;
  }

  switch (operation) {
    case 'list':
    case 'get':
      return 200;
    case 'create':
      return 201;
    case 'update':
      return 200;
    case 'delete':
      return 204;
    default:
      return 200;
  }
}
```

## Pagination Standards

### **Consistent Pagination Format**
```typescript
// ✅ CORRECT - Standard pagination response
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ✅ CORRECT - Pagination implementation
export async function paginateResults<T>(
  query: any,
  page: number,
  limit: number
): Promise<PaginatedResponse<T>> {
  const offset = (page - 1) * limit;

  // Get total count
  const totalCountQuery = query.$dynamic();
  const [{ count: total }] = await totalCountQuery;

  // Get paginated results
  const results = await query.limit(limit).offset(offset);

  return {
    data: results,
    meta: {
      total,
      page,
      limit,
      has_next: offset + limit < total,
      has_prev: page > 1,
    },
  };
}
```

## Validation Error Standards

### **Structured Validation Errors**
```typescript
// ✅ CORRECT - Detailed validation errors
interface ValidationError {
  field: string;           // Field path (e.g., "user.email")
  message: string;         // Human-readable error message
  code: string;           // Machine-readable error code
  value?: any;            // The invalid value (optional)
}

// ✅ CORRECT - Validation error transformation
export function transformZodError(error: ZodError): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: 'VALIDATION_ERROR',
    value: err.received,
  }));
}

// ✅ CORRECT - Custom validation errors
export class FieldValidationError extends DomainError {
  constructor(
    field: string,
    message: string,
    code: string = 'FIELD_VALIDATION_ERROR',
    value?: any
  ) {
    super(code, message, { field, value });
  }
}
```

## Response Type Definitions

### **TypeScript Response Types**
```typescript
// ✅ CORRECT - Define response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
}

export interface ApiErrorResponse {
  error: string;
  details?: ValidationError[];
  code: string;
  timestamp: string;
}

export interface ContactResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  company?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  assigned_to?: string;
}

export type ContactListResponse = ApiResponse<ContactResponse[]>;
export type ContactDetailResponse = ApiResponse<ContactResponse>;
```

## Testing Response Formats

### **Response Format Tests**
```typescript
describe('API Response Format', () => {
  describe('GET /api/contacts', () => {
    it('should return paginated response format', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Verify meta structure
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('has_next');
      expect(response.body.meta).toHaveProperty('has_prev');

      // Verify field naming (snake_case)
      const contact = response.body.data[0];
      expect(contact).toHaveProperty('first_name');
      expect(contact).toHaveProperty('last_name');
      expect(contact).toHaveProperty('created_at');
      expect(contact).not.toHaveProperty('firstName'); // camelCase not allowed
    });
  });

  describe('Error responses', () => {
    it('should return validation error format', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ email: 'invalid-email', first_name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('timestamp');
      
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toBeInstanceOf(Array);
    });
  });
});
```

## Anti-Patterns

❌ **Never** use camelCase in JSON responses
❌ **Never** return inconsistent response formats
❌ **Never** omit timestamp from error responses
❌ **Never** use non-standard HTTP status codes
❌ **Never** return raw database entities without transformation
❌ **Never** include sensitive data in responses
❌ **Never** use different error formats across endpoints

## Quality Checklist

- [ ] All responses use consistent data/meta structure
- [ ] JSON fields use snake_case naming convention
- [ ] Success responses include appropriate HTTP status codes
- [ ] Error responses include error, code, and timestamp
- [ ] Validation errors include detailed field information
- [ ] Pagination follows standard meta format
- [ ] Database entities are transformed before response
- [ ] Response types are properly defined
- [ ] Tests verify response format consistency
- [ ] No sensitive data leaks in responses

This rule ensures consistent, predictable API responses that make the frontend integration reliable and maintainable.
