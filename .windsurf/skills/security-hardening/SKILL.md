---
name: security-hardening
description: Implement security headers, rate limiting, input validation, and audit logging
---

# Security Hardening Implementation

This skill guides you through implementing comprehensive security measures for the Apex Unified Suite, including security headers, rate limiting, input validation, and audit logging.

## Current Security Assessment

**Security Status**: Basic security measures exist but need significant hardening.

**Current Issues**:
- CORS allows all origins (`cors()` with no options)
- No security headers (HSTS, CSP, etc.)
- No rate limiting on API endpoints
- No audit logging for sensitive operations
- No input sanitization beyond Zod validation
- No CSRF protection
- No security monitoring

## Security Architecture

### **Security Layers**
```
┌─────────────────────────────────────────┐
│           Network Layer                 │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ HTTPS/TLS   │  │ CDN Security   │   │
│  │ DDoS Protect│  │ WAF Rules      │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Application Layer               │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Auth Headers│  │ Rate Limiting  │   │
│  │ CSP Headers │  │ Input Validation│   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Data Layer                    │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Audit Logs  │  │ Encryption     │   │
│  │ Access Ctrl  │  │ Backup Security│   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Security Headers Middleware**

**File**: `artifacts/api-server/src/middlewares/security.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com", // Add allowed APIs
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Security headers
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (HTTPS only)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
}
```

### **Step 2: Rate Limiting Implementation**

**File**: `artifacts/api-server/src/middlewares/rateLimit.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 100,
    private cleanupIntervalMs: number = 60000 // 1 minute
  ) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  private getKey(req: Request): string {
    // Use IP address for rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `rate_limit:${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  middleware(maxRequests?: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      const limit = maxRequests || this.maxRequests;

      if (!this.store[key]) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        return next();
      }

      const entry = this.store[key];

      if (now > entry.resetTime) {
        // Reset window
        entry.count = 1;
        entry.resetTime = now + this.windowMs;
        return next();
      }

      if (entry.count >= limit) {
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          resetIn,
        });

        res.set('Retry-After', resetIn.toString());
        res.set('X-RateLimit-Limit', limit.toString());
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', entry.resetTime.toString());

        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        });
      }

      entry.count++;

      res.set('X-RateLimit-Limit', limit.toString());
      res.set('X-RateLimit-Remaining', (limit - entry.count).toString());
      res.set('X-RateLimit-Reset', entry.resetTime.toString());

      next();
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Pre-configured rate limiters
export const authRateLimiter = new RateLimiter(60000, 5); // 5 requests per minute for auth
export const generalRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute general
export const uploadRateLimiter = new RateLimiter(60000, 10); // 10 uploads per minute
export const searchRateLimiter = new RateLimiter(60000, 30); // 30 searches per minute
```

### **Step 3: Input Sanitization**

**File**: `artifacts/api-server/src/lib/sanitization.ts`
```typescript
import DOMPurify from 'isomorphic-dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  textOnly?: boolean;
}

const defaultSanitizeOptions: SanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
  allowedAttributes: {
    'a': ['href', 'title'],
    '*': ['class'],
  },
  textOnly: false,
};

export function sanitizeHtml(
  html: string, 
  options: SanitizeOptions = {}
): string {
  const finalOptions = { ...defaultSanitizeOptions, ...options };
  
  if (finalOptions.textOnly) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: finalOptions.allowedTags || [],
    ALLOWED_ATTR: finalOptions.allowedAttributes || {},
  });
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML brackets
    .trim();
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, '') // Allow only safe characters
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .toLowerCase();
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 100); // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}
```

### **Step 4: Audit Logging System**

**File**: `artifacts/api-server/src/lib/auditLogger.ts`
```typescript
import { logger } from './logger';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log({
    userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success,
    error,
  }: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: ipAddress || 'unknown',
      userAgent,
      timestamp: new Date().toISOString(),
      success,
      error,
    };

    // Log to structured logger
    logger.info('Audit Event', {
      audit_id: auditLog.id,
      user_id: auditLog.userId,
      action: auditLog.action,
      resource: auditLog.resource,
      resource_id: auditLog.resourceId,
      success: auditLog.success,
      ip_address: auditLog.ipAddress,
      user_agent: auditLog.userAgent,
      details: auditLog.details,
      error: auditLog.error,
    });

    // In production, also store in database
    if (process.env.NODE_ENV === 'production') {
      await this.storeInDatabase(auditLog);
    }
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeInDatabase(auditLog: AuditLog): Promise<void> {
    try {
      // TODO: Store audit logs in database
      // await db.insert(auditLogsTable).values(auditLog);
    } catch (error) {
      logger.error('Failed to store audit log in database', { error, auditLog });
    }
  }

  // Convenience methods
  async logUserAction({
    userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success = true,
    error,
  }: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent?: string;
    success?: boolean;
    error?: string;
  }): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      error,
    });
  }

  async logSystemAction({
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success = true,
    error,
  }: {
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent?: string;
    success?: boolean;
    error?: string;
  }): Promise<void> {
    await this.log({
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      error,
    });
  }
}

export const auditLogger = AuditLogger.getInstance();
```

### **Step 5: Enhanced Authentication Security**

**Update**: `artifacts/api-server/src/services/auth.ts`
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '@workspace/db';
import { usersTable, rolesTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { auditLogger } from '../lib/auditLogger';
import { validateEmail } from '../lib/sanitization';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly maxLoginAttempts: number = 5;
  private readonly lockoutDuration: number = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async authenticateUser(email: string, password: string, ipAddress: string, userAgent?: string): Promise<{
    user: typeof usersTable.$inferSelect;
    tokens: AuthTokens;
  }> {
    // Validate email format
    if (!validateEmail(email)) {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email: 'invalid_format' },
        ipAddress,
        userAgent,
        success: false,
        error: 'Invalid email format',
      });
      throw new Error('Invalid email format');
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user[0]) {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, reason: 'user_not_found' },
        ipAddress,
        userAgent,
        success: false,
        error: 'User not found',
      });
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user[0].status === 'locked') {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, reason: 'account_locked' },
        ipAddress,
        userAgent,
        success: false,
        error: 'Account locked',
      });
      throw new Error('Account is locked');
    }

    // Check if account is inactive
    if (user[0].status !== 'active') {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, status: user[0].status },
        ipAddress,
        userAgent,
        success: false,
        error: 'Account not active',
      });
      throw new Error('Account is not active');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user[0].passwordHash);
    if (!isValidPassword) {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, reason: 'invalid_password' },
        ipAddress,
        userAgent,
        success: false,
        error: 'Invalid password',
      });
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const permissions = await this.getUserPermissions(user[0].id);
    const tokens = this.generateTokens({
      userId: user[0].id,
      email: user[0].email,
      role: user[0].role,
      permissions,
    });

    // Update last login
    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user[0].id));

    // Log successful login
    await auditLogger.logUserAction({
      userId: user[0].id,
      action: 'login',
      resource: 'auth',
      details: { email },
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      user: {
        ...user[0],
        passwordHash: undefined, // Remove sensitive data
      },
      tokens,
    };
  }

  // ... rest of the AuthService implementation
}
```

### **Step 6: CSRF Protection**

**File**: `artifacts/api-server/src/middlewares/csrf.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFToken {
  token: string;
  expires: number;
}

export class CSRFProtection {
  private static instance: CSRFProtection;
  private tokens: Map<string, CSRFToken> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  constructor() {
    // Clean up expired tokens every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, token] of this.tokens.entries()) {
      if (token.expires <= now) {
        this.tokens.delete(key);
      }
    }
  }

  getToken(sessionId: string): string {
    const now = Date.now();
    const expires = now + (60 * 60 * 1000); // 1 hour

    let token = this.tokens.get(sessionId);
    if (!token || token.expires <= now) {
      token = {
        token: this.generateToken(),
        expires,
      };
      this.tokens.set(sessionId, token);
    }

    return token.token;
  }

  validateToken(sessionId: string, providedToken: string): boolean {
    const token = this.tokens.get(sessionId);
    if (!token) {
      return false;
    }

    if (token.expires <= Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }

    return token.token === providedToken;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip CSRF for API endpoints with Bearer tokens
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return next();
      }

      const sessionId = req.session?.id;
      const csrfToken = req.headers['x-csrf-token'];

      if (!sessionId || !csrfToken) {
        return res.status(403).json({ error: 'CSRF token missing' });
      }

      if (!this.validateToken(sessionId, csrfToken)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }

      next();
    };
  }
}

export const csrfProtection = CSRFProtection.getInstance();
```

### **Step 7: Enhanced API Routes with Security**

**Update**: `artifacts/api-server/src/routes/crm/contacts.ts`
```typescript
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '@workspace/db';
import { contactsTable, insertContactSchema, selectContactSchema } from '@workspace/db/schema';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';
import { securityHeaders } from '../middlewares/security';
import { generalRateLimiter, uploadRateLimiter } from '../middlewares/rateLimit';
import { sanitizeText, validateEmail, validatePhone } from '../lib/sanitization';
import { auditLogger } from '../lib/auditLogger';
import { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../middlewares/errorHandler';

const router = Router();

// Apply security headers to all routes
router.use(securityHeaders);

// Apply rate limiting
router.use(generalRateLimiter.middleware());

// GET /api/crm/contacts - List contacts
router.get('/', 
  authenticateToken, 
  requirePermission('crm:contacts:read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Validate and sanitize inputs
    if (search) {
      const sanitizedSearch = sanitizeText(search);
      if (sanitizedSearch.length < 2) {
        throw new ValidationError([
          { field: 'search', message: 'Search term must be at least 2 characters' },
        ]);
      }
    }

    // Log data access
    await auditLogger.logUserAction({
      userId: req.user!.userId,
      action: 'list_contacts',
      resource: 'crm_contacts',
      details: { page, limit, search, status, assignedTo },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    });

    // ... rest of the implementation
  })
);

// POST /api/crm/contacts - Create contact
router.post('/', 
  authenticateToken, 
  requirePermission('crm:contacts:write'),
  uploadRateLimiter.middleware(5), // Stricter rate limiting for creation
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validatedData = insertContactSchema.parse(req.body);
    
    // Sanitize text fields
    const sanitizedData = {
      ...validatedData,
      firstName: sanitizeText(validatedData.firstName),
      lastName: sanitizeText(validatedData.lastName),
      company: sanitizeText(validatedData.company || ''),
      title: sanitizeText(validatedData.title || ''),
      notes: sanitizeText(validatedData.notes || ''),
    };

    // Validate email format
    if (!validateEmail(sanitizedData.email)) {
      throw new ValidationError([
        { field: 'email', message: 'Invalid email format' },
      ]);
    }

    // Validate phone format if provided
    if (sanitizedData.phone && !validatePhone(sanitizedData.phone)) {
      throw new ValidationError([
        { field: 'phone', message: 'Invalid phone format' },
      ]);
    }
    
    // Check for duplicate email
    const existingContact = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.email, sanitizedData.email))
      .limit(1);

    if (existingContact[0]) {
      await auditLogger.logUserAction({
        userId: req.user!.userId,
        action: 'create_contact_duplicate',
        resource: 'crm_contacts',
        details: { email: sanitizedData.email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        error: 'Duplicate email',
      });
      
      throw new ConflictError('A contact with this email already exists');
    }
    
    const result = await db
      .insert(contactsTable)
      .values({
        ...sanitizedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Log successful creation
    await auditLogger.logUserAction({
      userId: req.user!.userId,
      action: 'create_contact',
      resource: 'crm_contacts',
      resourceId: result[0].id,
      details: { email: sanitizedData.email, name: `${sanitizedData.firstName} ${sanitizedData.lastName}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    });

    res.status(201).json({ data: result[0] });
  })
);

// ... rest of the routes with similar security enhancements

export default router;
```

### **Step 8: Security Monitoring**

**File**: `artifacts/api-server/src/lib/securityMonitor.ts`
```typescript
import { logger } from './logger';

export interface SecurityEvent {
  type: 'suspicious_login' | 'rate_limit_exceeded' | 'invalid_token' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  async reportEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Log security event
    logger.warn('Security Event', securityEvent);

    // High severity events require immediate attention
    if (event.severity === 'critical') {
      await this.sendAlert(securityEvent);
    }

    // Store in audit log
    // await this.storeSecurityEvent(securityEvent);
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    // TODO: Send to security monitoring service
    // await securityService.sendAlert(event);
    
    console.error('CRITICAL SECURITY EVENT:', event);
  }

  // Detection methods
  detectSuspiciousLogin(ipAddress: string, userAgent?: string): boolean {
    // Implement logic to detect suspicious login patterns
    // - Multiple failed attempts from same IP
    // - Unusual user agent
    // - Login from unusual geographic location
    return false;
  }

  detectPrivilegeEscalation(userId: string, requestedPermission: string, userPermissions: string[]): boolean {
    // Check if user is trying to access permissions they don't have
    return !userPermissions.includes(requestedPermission);
  }

  detectTokenAnomaly(token: string): boolean {
    // Detect suspicious tokens
    // - Blacklisted tokens
    // - Tokens from unusual sources
    // - Tokens with unusual patterns
    return false;
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
```

### **Step 9: Environment Security Configuration**

**File**: `.env.example`
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/apex_unified_suite

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_minimum_32_characters

# CORS Origins (comma-separated, specific domains only)
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com

# Security
SESSION_SECRET=your_session_secret_here_minimum_32_characters
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=900000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Security Headers
ENABLE_HSTS=true
ENABLE_CSP=true
ENABLE_XSS_PROTECTION=true

# Monitoring
SECURITY_WEBHOOK_URL=https://your-security-monitoring.com/webhook
SECURITY_ALERT_EMAIL=security@yourdomain.com

# Email (for security notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-security-email@gmail.com
SMTP_PASS=your-app-password
```

### **Step 10: Security Testing**

**File**: `tests/security/auth.test.ts`
```typescript
import request from 'supertest';
import { app } from '../../artifacts/api-server/src/app';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('should reject login with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body.error).toContain('validation error');
    });

    it('should rate limit login attempts', async () => {
      // Make multiple rapid login attempts
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse?.body.error).toBe('Too many requests');
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/healthz')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Input Validation Security', () => {
    it('should reject XSS attempts in contact creation', async () => {
      const xssPayload = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        email: 'test@example.com',
        notes: '<img src=x onerror=alert("xss")>',
      };

      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(xssPayload)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });

    it('should sanitize HTML in text fields', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          notes: '<b>Bold text</b> and <script>alert("xss")</script>',
        })
        .expect(201);

      // Notes should be sanitized
      expect(response.body.data.notes).not.toContain('<script>');
      expect(response.body.data.notes).not.toContain('</script>');
    });
  });

  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token for forms', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Cookie', 'sessionId=test-session')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        })
        .expect(403);

      expect(response.body.error).toBe('CSRF token missing');
    });
  });
});
```

## Security Checklist

### **Authentication & Authorization**
- [ ] Implement strong JWT secrets (32+ characters)
- [ ] Use bcrypt with 12+ rounds for passwords
- [ ] Implement account lockout after failed attempts
- [ ] Add session management with secure cookies
- [ ] Implement RBAC with fine-grained permissions
- [ ] Audit log all authentication events

### **Input Validation & Sanitization**
- [ ] Validate all inputs with Zod schemas
- [ ] Sanitize user-generated content
- [ ] Implement HTML sanitization for rich text
- [ ] Validate file uploads with proper MIME types
- [ ] Implement filename sanitization
- [ ] Add input length limits

### **Rate Limiting & DDoS Protection**
- [ ] Implement rate limiting per endpoint
- [ ] Use different limits for auth vs. data endpoints
- [ ] Add IP-based blocking for abuse
- [ ] Implement exponential backoff for retries
- [ ] Add rate limit headers to responses

### **Security Headers**
- [ ] Implement Content Security Policy (CSP)
- [ ] Add HSTS for HTTPS enforcement
- [ ] Set X-Frame-Options to prevent clickjacking
- [ ] Add XSS protection headers
- [ ] Implement proper CORS configuration
- [ ] Remove server information headers

### **Audit & Monitoring**
- [ ] Log all security-relevant events
- [ ] Implement audit trail for data access
- [ ] Monitor for suspicious patterns
- [ ] Set up security alerts for critical events
- [ ] Implement log aggregation and analysis
- [ ] Add security metrics dashboard

This comprehensive security hardening implementation significantly improves the security posture of the Apex Unified Suite, protecting against common web application vulnerabilities and providing proper monitoring and audit capabilities.
