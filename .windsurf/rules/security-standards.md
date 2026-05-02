---
trigger: model_decision
description: Security requirements and validation checkpoints for all code changes
---

# Security Standards

Enforce comprehensive security standards for all development activities in the Apex Unified Suite.

## When This Rule Applies

Cascade should reference this rule when:
- Implementing authentication or authorization features
- Handling user input or data validation
- Working with sensitive data (PII, credentials, tokens)
- Modifying API endpoints or middleware
- Database schema changes
- Frontend form implementations

## Authentication & Authorization

### **JWT Implementation Requirements**
- Use `jsonwebtoken` with RS256 algorithm for production
- Access tokens: 15-minute expiry maximum
- Refresh tokens: 7-day expiry maximum
- Secure token storage: httpOnly cookies or secure localStorage
- Token rotation on every refresh
- Immediate token invalidation on logout

### **Password Security**
- Minimum 12 characters with complexity requirements
- Hash with bcrypt (cost factor 12+)
- No password hints or recovery questions
- Rate limiting on authentication endpoints
- Account lockout after failed attempts (5 attempts, 15-minute lockout)

### **RBAC Implementation**
- Principle of least privilege for all roles
- Permission-based access control (not role-based)
- Audit logging for all permission changes
- Session timeout for inactive users
- Multi-factor authentication for admin roles

## Input Validation & Sanitization

### **API Input Validation**
- All inputs must be validated using Zod schemas
- Never trust client-side validation
- Sanitize all user inputs before processing
- Validate file uploads (type, size, content)
- Implement request size limits

### **SQL Injection Prevention**
- Use parameterized queries (Drizzle ORM)
- Never concatenate SQL strings
- Validate all database query parameters
- Use ORM-level query builders
- Implement query result type checking

### **XSS Prevention**
- Escape all user-generated content in HTML
- Use Content Security Policy headers
- Sanitize markdown content before rendering
- Validate URLs in user content
- Implement safe HTML rendering libraries

## Data Protection

### **PII Handling**
- Encrypt sensitive data at rest
- Mask sensitive data in logs
- Implement data retention policies
- Use secure data transmission (HTTPS)
- Comply with data protection regulations

### **Session Security**
- Use secure, httpOnly cookies
- Implement session timeout
- Regenerate session IDs on login
- Secure cookie flags: Secure, HttpOnly, SameSite=Strict
- Store session data server-side only

## API Security

### **Rate Limiting**
- Implement rate limiting on all public endpoints
- Different limits per user role
- IP-based rate limiting for anonymous users
- Burst protection for API endpoints
- Rate limit headers in responses

### **CORS Configuration**
- Restrict CORS origins to specific domains
- Use strict CORS policies in production
- Validate preflight requests
- No wildcard origins in production
- Secure headers for cross-origin requests

### **Security Headers**
```typescript
// Required security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}));
```

## Frontend Security

### **Client-Side Validation**
- Implement client-side validation for UX
- Never rely on client-side validation for security
- Sanitize all user inputs before display
- Use secure form libraries with built-in validation
- Implement proper error handling

### **Secure Storage**
- Never store sensitive data in localStorage
- Use secure cookies for authentication tokens
- Implement secure session storage
- Clear sensitive data on logout
- Use memory storage for temporary data only

### **Content Security**
- Implement Content Security Policy
- Validate all external resources
- Use subresource integrity for critical resources
- Implement safe iframe policies
- Restrict dynamic code execution

## Database Security

### **Connection Security**
- Use SSL/TLS for database connections
- Implement connection pooling with secure configuration
- Rotate database credentials regularly
- Use least privilege database users
- Encrypt sensitive database columns

### **Query Security**
- Use parameterized queries exclusively
- Implement query result limits
- Validate all query parameters
- Use database-level constraints
- Implement audit logging for data changes

## Security Testing

### **Security Test Coverage**
- Authentication bypass attempts
- SQL injection vulnerabilities
- XSS attack vectors
- CSRF token validation
- Authorization boundary testing
- Input validation bypass attempts

### **Security Tools Integration**
```bash
# Security scanning
pnpm audit
npm audit --audit-level high

# Dependency vulnerability scanning
snyk test
npm ls --depth=0 | grep -v "^$"

# Static analysis
eslint --ext .js,.ts,.jsx,.tsx
```

## Security Checklist

### **Before Deployment**
- [ ] All inputs are validated and sanitized
- [ ] Authentication is properly implemented
- [ ] Authorization follows principle of least privilege
- [ ] Security headers are configured
- [ ] Rate limiting is implemented
- [ ] CORS policies are restrictive
- [ ] Database connections are secure
- [ ] Sensitive data is encrypted
- [ ] Security tests pass
- [ ] Dependency vulnerabilities are patched

### **Ongoing Monitoring**
- [ ] Security logs are monitored
- [ ] Intrusion detection is active
- [ ] Vulnerability scans run regularly
- [ ] Security patches are applied promptly
- [ ] Access logs are reviewed
- [ ] Failed authentication attempts are monitored

## Incident Response

### **Security Incident Protocol**
1. Immediate containment of affected systems
2. Assessment of incident scope and impact
3. Notification of security team and stakeholders
4. Investigation and root cause analysis
5. Implementation of security fixes
6. Post-incident review and improvements

### **Security Contact Information**
- Security team: security@apex-unified.com
- Incident response: incident@apex-unified.com
- Vulnerability reporting: security@apex-unified.com

This rule ensures comprehensive security standards are maintained across all development activities in the Apex Unified Suite.
