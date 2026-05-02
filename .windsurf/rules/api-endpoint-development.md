---
trigger: glob
globs: artifacts/api-server/src/routes/**/*.ts
---

# API Endpoint Development Rules

## Route Structure

- Import generated Zod schemas from `@workspace/api-zod`
- Validate all request bodies with `schema.parse(req.body)`
- Use proper HTTP status codes: 200, 201, 400, 404, 500
- Handle ZodError separately from generic errors
- Log all errors with structured Pino logger
- Include async/await error handling with try/catch blocks
- Export router as default from each route file

## Authentication & Authorization

- Use `authenticateToken` middleware for protected endpoints
- Use `requirePermission(permission)` for authorization checks
- Use `requireRole(role)` for role-based access control
- Include user context from `AuthenticatedRequest`
- Validate user permissions before resource access

## Request Validation

- Always validate input with Zod schemas from generated types
- Use `insertSchema` for POST requests
- Use `insertSchema.partial()` for PUT/PATCH requests
- Validate query parameters with separate schemas
- Return 400 status with validation error details
- Include field-level error messages for client feedback

## Response Format

- Use consistent response structure: `{ data: T, meta?: object }`
- Include pagination metadata for list endpoints
- Return 201 status for successful creation
- Return 204 for successful deletion (no content)
- Include error details in error responses
- Use snake_case for JSON response keys

## Error Handling

```typescript
try {
  const validatedData = schema.parse(req.body);
  // ... business logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      error: 'Validation error',
      details: error.errors,
    });
  }
  
  console.error('Operation error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

## Database Operations

- Use Drizzle ORM with proper typing
- Include `createdAt` and `updatedAt` timestamps
- Use transactions for multi-table operations
- Handle database errors gracefully
- Return created/updated resources to client
- Use `returning()` for efficient queries

## Query Patterns

- **List endpoints**: Include pagination, search, filtering
- **Detail endpoints**: Include related data with joins
- **Create endpoints**: Validate input, set defaults
- **Update endpoints**: Allow partial updates, validate changes
- **Delete endpoints**: Soft delete when appropriate

## Search and Filtering

- Support search with `ILIKE` operations
- Filter by status, date ranges, foreign keys
- Use proper SQL injection prevention
- Include search in query parameters
- Limit search results for performance

## Rate Limiting

- Implement rate limiting per endpoint
- Use different limits for auth vs. data endpoints
- Include rate limit headers in responses
- Log rate limit violations
- Consider user-based rate limiting

## Logging Requirements

- Log all API requests with method and path
- Include user context in logs for authenticated requests
- Log validation errors with request details
- Log database operations and errors
- Use structured logging with Pino

## Security Practices

- Never log sensitive data (passwords, tokens)
- Sanitize all user inputs
- Use parameterized queries (Drizzle handles this)
- Validate file uploads with proper MIME types
- Implement CORS with specific origins
- Include security headers in production

## Testing Requirements

- Unit test all route handlers
- Test validation with valid and invalid data
- Test authentication and authorization
- Include integration tests for API flows
- Mock database operations for unit tests
- Test error scenarios and edge cases

## OpenAPI Integration

- Keep OpenAPI spec in sync with implementation
- Include all endpoints in OpenAPI specification
- Use proper operationId for code generation
- Document all parameters and responses
- Include authentication requirements

## Performance Guidelines

- Use database indexes for queried columns
- Implement pagination for large datasets
- Cache frequently accessed data
- Use connection pooling (Drizzle handles this)
- Monitor query performance
- Avoid N+1 query problems
