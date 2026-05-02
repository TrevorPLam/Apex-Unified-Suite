---
name: portal-magic-link-auth
description: Complete implementation of portal magic link authentication with hash tokens, JWT exchange, rate limiting, and security hardening for client access.
---

# Portal Magic Link Authentication Implementation

## Overview
This skill guides you through implementing a secure magic link authentication system specifically for portal users (clients, customers, partners). Portal users access a limited subset of functionality and require a different authentication flow than internal users.

## Prerequisites
- Email service integration (see @email-service-implementation skill)
- JWT service implementation (see @jwt-service-implementation skill)
- Database access for portal users and magic tokens
- Rate limiting infrastructure

## Step 1: Database Schema Design

### Portal Users Table
Create `lib/db/src/schema/portal-users.ts`:

```typescript
import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const portalUsers = pgTable('portal_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  companyName: text('company_name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  role: text('role').notNull(), // 'client', 'partner', 'customer'
  permissions: text('permissions').array(), // Array of permission strings
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PortalUser = typeof portalUsers.$inferSelect;
export type NewPortalUser = typeof portalUsers.$inferInsert;
```

### Magic Tokens Table
Create `lib/db/src/schema/portal-magic-tokens.ts`:

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const portalMagicTokens = pgTable('portal_magic_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().index(),
  tokenHash: text('token_hash').notNull().unique(), // SHA-256 hash of the token
  rawToken: text('raw_token').notNull(), // For email sending (deleted after use)
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PortalMagicToken = typeof portalMagicTokens.$inferSelect;
export type NewPortalMagicToken = typeof portalMagicTokens.$inferInsert;
```

### Portal Sessions Table
Create `lib/db/src/schema/portal-sessions.ts`:

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const portalSessions = pgTable('portal_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  refreshExpiresAt: timestamp('refresh_expires_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PortalSession = typeof portalSessions.$inferSelect;
export type NewPortalSession = typeof portalSessions.$inferInsert;
```

## Step 2: Token Generation Service

### Create Token Service
Create `artifacts/api-server/src/services/portal-token-service.ts`:

```typescript
import crypto from 'crypto';
import { db } from '@workspace/db';
import { portalMagicTokens } from '@workspace/db/src/schema/portal-magic-tokens';
import { eq, and, gt } from 'drizzle-orm';

export interface MagicLinkRequest {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

export class PortalTokenService {
  private readonly TOKEN_LENGTH = 32;
  private readonly TOKEN_EXPIRY_MINUTES = 15;
  private readonly RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_MAX_ATTEMPTS = 3;

  async generateMagicLink(request: MagicLinkRequest): Promise<MagicLinkResponse> {
    const { email, ipAddress, userAgent } = request;

    // Check rate limiting
    const rateLimitResult = await this.checkRateLimit(email, ipAddress);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: 'Too many requests. Please try again later.',
        rateLimited: true,
        retryAfter: rateLimitResult.retryAfter,
      };
    }

    try {
      // Generate secure token
      const rawToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      
      // Calculate expiry
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Delete any existing tokens for this email
      await db.delete(portalMagicTokens).where(eq(portalMagicTokens.email, email));

      // Store new token
      await db.insert(portalMagicTokens).values({
        email,
        tokenHash,
        rawToken, // Store temporarily for email sending
        expiresAt,
        ipAddress,
        userAgent,
      });

      // TODO: Send email with magic link (integrate with email service)
      // await this.sendMagicLinkEmail(email, rawToken);

      return {
        success: true,
        message: 'Magic link sent to your email address.',
      };
    } catch (error) {
      console.error('Error generating magic link:', error);
      return {
        success: false,
        message: 'Failed to generate magic link. Please try again.',
      };
    }
  }

  async verifyMagicLink(token: string, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    user?: PortalUser;
    sessionToken?: string;
    refreshToken?: string;
    message: string;
  }> {
    if (!token) {
      return { success: false, message: 'Token is required' };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
      // Find and consume token atomically
      const tokenRecord = await db.transaction(async (tx) => {
        const record = await tx
          .select()
          .from(portalMagicTokens)
          .where(
            and(
              eq(portalMagicTokens.tokenHash, tokenHash),
              eq(portalMagicTokens.isUsed, false),
              gt(portalMagicTokens.expiresAt, new Date())
            )
          )
          .limit(1);

        if (record.length === 0) {
          return null;
        }

        // Mark token as used
        await tx
          .update(portalMagicTokens)
          .set({
            isUsed: true,
            usedAt: new Date(),
          })
          .where(eq(portalMagicTokens.id, record[0].id));

        return record[0];
      });

      if (!tokenRecord) {
        return { success: false, message: 'Invalid or expired magic link' };
      }

      // Find or create portal user
      const user = await this.findOrCreatePortalUser(tokenRecord.email);
      if (!user) {
        return { success: false, message: 'User account not found or inactive' };
      }

      // Generate session tokens
      const sessionTokens = await this.generateSessionTokens(user.id, ipAddress, userAgent);

      // Update last login
      await this.updateLastLogin(user.id);

      return {
        success: true,
        user,
        sessionToken: sessionTokens.sessionToken,
        refreshToken: sessionTokens.refreshToken,
        message: 'Authentication successful',
      };
    } catch (error) {
      console.error('Error verifying magic link:', error);
      return { success: false, message: 'Authentication failed' };
    }
  }

  private async checkRateLimit(email: string, ipAddress?: string): Promise<{
    allowed: boolean;
    retryAfter?: number;
  }> {
    const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW);
    
    const recentAttempts = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(portalMagicTokens)
      .where(
        and(
          eq(portalMagicTokens.email, email),
          gt(portalMagicTokens.createdAt, windowStart)
        )
      );

    const attempts = recentAttempts[0]?.count || 0;

    if (attempts >= this.RATE_LIMIT_MAX_ATTEMPTS) {
      const oldestAttempt = await db
        .select({ createdAt: portalMagicTokens.createdAt })
        .from(portalMagicTokens)
        .where(
          and(
            eq(portalMagicTokens.email, email),
            gt(portalMagicTokens.createdAt, windowStart)
          )
        )
        .orderBy(portalMagicTokens.createdAt)
        .limit(1);

      if (oldestAttempt.length > 0) {
        const retryAfter = Math.ceil(
          (oldestAttempt[0].createdAt.getTime() + this.RATE_LIMIT_WINDOW - Date.now()) / 1000
        );
        return { allowed: false, retryAfter };
      }
    }

    return { allowed: true };
  }

  private async findOrCreatePortalUser(email: string): Promise<PortalUser | null> {
    // This would depend on your business logic for portal user management
    // For now, assume portal users are pre-registered
    const user = await db
      .select()
      .from(portalUsers)
      .where(and(eq(portalUsers.email, email), eq(portalUsers.isActive, true)))
      .limit(1);

    return user[0] || null;
  }

  private async generateSessionTokens(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ sessionToken: string; refreshToken: string }> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(portalSessions).values({
      userId,
      sessionToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      ipAddress,
      userAgent,
    });

    return { sessionToken, refreshToken };
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(portalUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(portalUsers.id, userId));
  }

  private async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    // Integrate with email service
    const magicLink = `${process.env.PORTAL_BASE_URL}/auth/verify?token=${token}`;
    
    // TODO: Implement email sending
    // await emailService.sendMagicLink(email, magicLink);
  }
}
```

## Step 3: Authentication Routes

### Create Portal Auth Routes
Create `artifacts/api-server/src/routes/v1/portal-auth.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { PortalTokenService } from '../services/portal-token-service';
import { PortalJWTService } from '../services/portal-jwt-service';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const tokenService = new PortalTokenService();
const jwtService = new PortalJWTService();

// Rate limiting for magic link requests
const magicLinkRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 requests per 5 minutes per IP
  message: {
    error: 'Too many magic link requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request magic link
router.post('/magic-link', magicLinkRateLimit, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email('Invalid email format'),
    });

    const { email } = schema.parse(req.body);
    
    const result = await tokenService.generateMagicLink({
      email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    if (result.rateLimited) {
      return res.status(429).json({
        error: result.message,
        retryAfter: result.retryAfter,
      });
    }

    res.json({
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Magic link request error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Verify magic link and exchange for JWT
router.get('/verify', async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(1, 'Token is required'),
    });

    const { token } = schema.parse(req.query);
    
    const result = await tokenService.verifyMagicLink(
      token,
      req.ip,
      req.get('User-Agent')
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
      });
    }

    // Generate JWT tokens
    const jwtTokens = await jwtService.generateTokens({
      userId: result.user!.id,
      email: result.user!.email,
      role: result.user!.role,
      permissions: result.user!.permissions,
    });

    res.json({
      message: 'Authentication successful',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        firstName: result.user!.firstName,
        lastName: result.user!.lastName,
        companyName: result.user!.companyName,
        role: result.user!.role,
        permissions: result.user!.permissions,
      },
      tokens: jwtTokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Magic link verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    const schema = z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
    });

    const { refreshToken } = schema.parse(req.body);
    
    const result = await jwtService.refreshToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({
        error: result.message,
      });
    }

    res.json({
      tokens: result.tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Logout (invalidate session)
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);
    await jwtService.invalidateToken(token);

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export { router as portalAuthRouter };
```

## Step 4: JWT Service for Portal

### Create Portal JWT Service
Create `artifacts/api-server/src/services/portal-jwt-service.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { db } from '@workspace/db';
import { portalSessions } from '@workspace/db/src/schema/portal-sessions';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

export interface PortalJWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  tokenType: 'access' | 'refresh';
}

export interface PortalUser {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export class PortalJWTService {
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
  private readonly JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'fallback-secret-change-in-production';

  async generateTokens(user: PortalUser): Promise<JWTTokens> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Access token
    const accessTokenPayload: PortalJWTPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sessionId,
      tokenType: 'access',
    };

    const accessToken = jwt.sign(accessTokenPayload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'apex-unified-suite',
      audience: 'portal',
    });

    // Refresh token
    const refreshTokenPayload: PortalJWTPayload = {
      ...accessTokenPayload,
      tokenType: 'refresh',
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'apex-unified-suite',
      audience: 'portal',
    });

    // Store session in database
    await this.storeSession(user.userId, sessionId, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      refreshExpiresIn: this.REFRESH_TOKEN_EXPIRY,
    };
  }

  async verifyToken(token: string): Promise<{
    valid: boolean;
    payload?: PortalJWTPayload;
    error?: string;
  }> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'apex-unified-suite',
        audience: 'portal',
      }) as PortalJWTPayload;

      // Check if session is still active
      const session = await db
        .select()
        .from(portalSessions)
        .where(
          and(
            eq(portalSessions.userId, payload.userId),
            eq(portalSessions.sessionToken, payload.sessionId),
            eq(portalSessions.isActive, true),
            gt(portalSessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (session.length === 0) {
        return { valid: false, error: 'Session not found or expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      } else {
        return { valid: false, error: 'Token verification failed' };
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    tokens?: JWTTokens;
    message: string;
  }> {
    const verification = await this.verifyToken(refreshToken);

    if (!verification.valid || !verification.payload) {
      return { success: false, message: verification.error || 'Invalid refresh token' };
    }

    const payload = verification.payload;
    if (payload.tokenType !== 'refresh') {
      return { success: false, message: 'Invalid token type' };
    }

    // Generate new tokens
    const user: PortalUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };

    const newTokens = await this.generateTokens(user);

    // Invalidate old refresh token
    await this.invalidateToken(refreshToken);

    return {
      success: true,
      tokens: newTokens,
      message: 'Tokens refreshed successfully',
    };
  }

  async invalidateToken(token: string): Promise<void> {
    const verification = await this.verifyToken(token);

    if (verification.valid && verification.payload) {
      // Deactivate session
      await db
        .update(portalSessions)
        .set({ isActive: false })
        .where(eq(portalSessions.sessionToken, verification.payload.sessionId));
    }
  }

  private async storeSession(userId: string, sessionId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY * 1000);
    const refreshExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000);

    await db.insert(portalSessions).values({
      userId,
      sessionToken: sessionId,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    });
  }
}
```

## Step 5: Authentication Middleware

### Create Portal Auth Middleware
Create `artifacts/api-server/src/middleware/portal-auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PortalJWTService } from '../services/portal-jwt-service';

export interface PortalAuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
  };
}

export class PortalAuthMiddleware {
  private static jwtService = new PortalJWTService();

  static authenticate = async (req: PortalAuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const verification = await this.jwtService.verifyToken(token);
      
      if (!verification.valid || !verification.payload) {
        return res.status(401).json({
          error: verification.error || 'Invalid token',
        });
      }

      // Attach user info to request
      req.user = {
        userId: verification.payload.userId,
        email: verification.payload.email,
        role: verification.payload.role,
        permissions: verification.payload.permissions,
        sessionId: verification.payload.sessionId,
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({
        error: 'Authentication failed',
      });
    }
  };

  static requirePermission = (permission: string) => {
    return (req: PortalAuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
        });
      }

      next();
    };
  };

  static requireRole = (role: string) => {
    return (req: PortalAuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          error: 'Insufficient role privileges',
        });
      }

      next();
    };
  };
}
```

## Step 6: Portal Routes with Authentication

### Update Portal Routes
Create `artifacts/api-server/src/routes/v1/portal.ts`:

```typescript
import { Router } from 'express';
import { portalAuthRouter } from './portal-auth.js';
import { PortalAuthMiddleware, PortalAuthRequest } from '../middleware/portal-auth.js';

const router = Router();

// Public authentication routes
router.use('/auth', portalAuthRouter);

// Protected routes
router.get('/profile', PortalAuthMiddleware.authenticate, async (req: PortalAuthRequest, res) => {
  try {
    // Return user profile information
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
    });
  }
});

// Example protected route with permission check
router.get(
  '/documents',
  PortalAuthMiddleware.authenticate,
  PortalAuthMiddleware.requirePermission('documents:read'),
  async (req: PortalAuthRequest, res) => {
    try {
      // Return user's documents
      res.json({
        documents: [], // TODO: Implement document fetching
      });
    } catch (error) {
      console.error('Documents fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch documents',
      });
    }
  }
);

export { router as portalRouter };
```

## Step 7: Email Integration

### Create Magic Link Email Template
Create `artifacts/api-server/src/templates/magic-link-email.ts`:

```typescript
export interface MagicLinkEmailData {
  firstName: string;
  companyName: string;
  magicLink: string;
  expiryMinutes: number;
}

export const generateMagicLinkEmail = (data: MagicLinkEmailData): {
  subject: string;
  html: string;
  text: string;
} => {
  const subject = `Sign in to ${data.companyName} Portal`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in to Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #0066ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Portal Sign In</h1>
        </div>
        <div class="content">
          <p>Hello ${data.firstName},</p>
          <p>Click the button below to sign in to the ${data.companyName} portal:</p>
          <div style="text-align: center;">
            <a href="${data.magicLink}" class="button">Sign In to Portal</a>
          </div>
          <p><strong>Important:</strong> This link will expire in ${data.expiryMinutes} minutes for security reasons.</p>
          <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Apex Unified Suite portal.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${data.firstName},

    Sign in to the ${data.companyName} portal by clicking this link:
    ${data.magicLink}

    This link will expire in ${data.expiryMinutes} minutes for security reasons.

    If you didn't request this sign-in link, you can safely ignore this email.

    This is an automated message from the Apex Unified Suite portal.
  `;

  return { subject, html, text };
};
```

## Step 8: Frontend Integration

### Portal Login Component
Create `artifacts/apex-os/src/components/portal/PortalLogin.tsx`:

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

interface PortalLoginProps {
  onSuccess: (tokens: any) => void;
}

export function PortalLogin({ onSuccess }: PortalLoginProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const requestMagicLink = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/v1/portal/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send magic link');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      setError('');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const validatedEmail = loginSchema.parse({ email });
      requestMagicLink.mutate(validatedEmail.email);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            We've sent a magic link to <strong>{email}</strong>. Click the link to sign in to your portal.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            The link will expire in 15 minutes for security.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Send to a different email address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Portal Sign In</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email address"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={requestMagicLink.isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {requestMagicLink.isPending ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        We'll send you a sign-in link that expires in 15 minutes.
      </div>
    </div>
  );
}
```

## Step 9: Security Hardening

### Security Headers and Configuration
Add security middleware for portal routes:

```typescript
// artifacts/api-server/src/middleware/portal-security.ts
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const portalSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

export const portalRateLimiting = {
  // Stricter limits for portal endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    message: 'Too many authentication attempts',
  }),
  
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Rate limit exceeded',
  }),
};
```

## Step 10: Testing and Validation

### Unit Tests
Create comprehensive tests for the portal authentication system:

```typescript
// tests/api/portal-auth.test.ts
import request from 'supertest';
import { app } from '../src/server';
import { db } from '@workspace/db';

describe('Portal Authentication', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(portalMagicTokens);
    await db.delete(portalSessions);
  });

  test('should send magic link', async () => {
    const response = await request(app)
      .post('/api/v1/portal/auth/magic-link')
      .send({ email: 'test@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.success).toBe(true);
  });

  test('should rate limit magic link requests', async () => {
    // Send multiple requests rapidly
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/v1/portal/auth/magic-link')
        .send({ email: 'test@example.com' });
    }

    const response = await request(app)
      .post('/api/v1/portal/auth/magic-link')
      .send({ email: 'test@example.com' })
      .expect(429);

    expect(response.body).toHaveProperty('error');
  });

  test('should verify valid magic link', async () => {
    // First request a magic link
    const magicLinkResponse = await request(app)
      .post('/api/v1/portal/auth/magic-link')
      .send({ email: 'test@example.com' });

    // Extract token from email (mocked)
    const token = 'mock-token';

    // Verify the token
    const verifyResponse = await request(app)
      .get(`/api/v1/portal/auth/verify?token=${token}`)
      .expect(200);

    expect(verifyResponse.body).toHaveProperty('tokens');
    expect(verifyResponse.body).toHaveProperty('user');
  });
});
```

## Common Issues and Solutions

### Token Not Found
- Check database connection
- Verify token hash generation
- Ensure proper TTL configuration

### JWT Verification Failures
- Verify JWT secret consistency
- Check token expiration handling
- Ensure proper audience/issuer claims

### Rate Limiting Issues
- Configure Redis for distributed rate limiting
- Adjust limits based on traffic patterns
- Implement proper IP detection

### Email Delivery Issues
- Verify email service configuration
- Check email templates and formatting
- Implement proper error handling

## Security Considerations

### Token Security
- Use cryptographically secure random token generation
- Store token hashes, not raw tokens
- Implement proper TTL for tokens
- Use HTTPS for all communications

### Rate Limiting
- Implement per-IP and per-email rate limiting
- Use distributed storage for rate limiting in production
- Monitor for abuse patterns

### Session Management
- Implement proper session invalidation
- Use secure session storage
- Monitor for concurrent sessions

### Email Security
- Validate email addresses properly
- Implement email delivery verification
- Use proper email headers and SPF/DKIM

This skill provides a comprehensive, secure magic link authentication system specifically designed for portal users in the Apex Unified Suite, with proper rate limiting, security hardening, and production-ready features.
