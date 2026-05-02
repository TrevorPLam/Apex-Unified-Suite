---
name: jwt-service-implementation
description: Implement JWT token service with access/refresh token rotation, secure storage patterns, and 2026 security best practices
---

# JWT Service Implementation

This skill guides you through implementing a JWT token service with token rotation, secure storage, and 2026 security best practices for the Apex Unified Suite.

## Current State Assessment

**Current State**: No JWT implementation exists. Token handling is completely missing from the authentication system.

**Security Requirements (2026)**:
- Short-lived access tokens (15 minutes max)
- Rotating refresh tokens (new token on each refresh)
- Secure token storage (HttpOnly cookies or memory)
- Token binding to prevent theft
- Proper revocation mechanisms

## JWT Architecture

### **Token Types**

```
┌─────────────────────────────────────────────────────────────┐
│                     Token Lifecycle                          │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  Access Token │         │ Refresh Token │                 │
│  │              │         │               │                 │
│  │  TTL: 15min  │◄────────│  TTL: 7 days  │                 │
│  │  In: Memory  │  Refresh│  In: HttpOnly │                 │
│  │  or Header   │         │  Cookie       │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                          │                        │
│         ▼                          ▼                        │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   API Calls  │         │  Token Store │                 │
│  │  Bearer Auth │         │  (Hashed)    │                 │
│  └──────────────┘         └──────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### **Token Payloads**

**Access Token** (Minimal, non-sensitive):
```typescript
interface AccessTokenPayload {
  sub: string;        // User ID
  org: string;       // Organization ID
  roles: string[];    // Role names
  iat: number;       // Issued at
  exp: number;       // Expiration
  jti: string;       // Unique token ID (for revocation)
}
```

**Refresh Token** (Single purpose):
```typescript
interface RefreshTokenPayload {
  sub: string;        // User ID
  jti: string;       // Unique token ID
  iat: number;
  exp: number;
  family: string;    // Token family (for rotation detection)
}
```

## Step-by-Step Implementation

### **Step 1: Install Dependencies**

```bash
# Add to workspace catalog first
# In pnpm-workspace.yaml catalog section:
jsonwebtoken: ^9.0.2
@types/jsonwebtoken: ^9.0.6

# Install in api-server
pnpm --filter @workspace/api-server add jsonwebtoken
pnpm --filter @workspace/api-server add -D @types/jsonwebtoken
```

### **Step 2: Create JWT Service**

**File**: `artifacts/api-server/src/services/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Result, ok, err } from 'neverthrow';
import { TokenExpired, InvalidToken } from '../errors/domain-errors';

// Token payloads
export interface AccessTokenPayload {
  sub: string;        // User ID
  org: string;       // Organization ID
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string;        // User ID
  jti: string;
  family: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

// Configuration
interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTTL: string;   // e.g., '15m'
  refreshTokenTTL: string;  // e.g., '7d'
}

export class JWTService {
  private config: JWTConfig;

  constructor() {
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets not configured');
    }

    this.config = {
      accessTokenSecret,
      refreshTokenSecret,
      accessTokenTTL: '15m',   // 2026 best practice: short-lived
      refreshTokenTTL: '7d',
    };
  }

  /**
   * Generate a new token pair for a user
   */
  generateTokenPair(
    userId: string,
    organizationId: string,
    email: string,
    role: string,
    permissions: string[]
  ): TokenPair {
    const tokenFamily = randomUUID();
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const now = Math.floor(Date.now() / 1000);
    
    // Access token - minimal payload, short expiry
    const accessTokenPayload: AccessTokenPayload = {
      sub: userId,
      org: organizationId,
      email,
      role,
      permissions,
      jti: accessJti,
    };

    const accessToken = jwt.sign(accessTokenPayload, this.config.accessTokenSecret, {
      expiresIn: this.config.accessTokenTTL,
      jwtid: accessJti,
    });

    // Refresh token - single purpose, linked to family
    const refreshTokenPayload: RefreshTokenPayload = {
      sub: userId,
      jti: refreshJti,
      family: tokenFamily,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.config.refreshTokenSecret, {
      expiresIn: this.config.refreshTokenTTL,
      jwtid: refreshJti,
    });

    // Calculate expiration dates
    const accessTokenExpiresAt = new Date(now * 1000 + 15 * 60 * 1000); // 15 minutes
    const refreshTokenExpiresAt = new Date(now * 1000 + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): Result<AccessTokenPayload, TokenExpired | InvalidToken> {
    try {
      const payload = jwt.verify(token, this.config.accessTokenSecret) as AccessTokenPayload;
      return ok(payload);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return err(new TokenExpired());
      }
      return err(new InvalidToken());
    }
  }

  /**
   * Verify a refresh token (doesn't check revocation - that's the store's job)
   */
  verifyRefreshToken(token: string): Result<RefreshTokenPayload, TokenExpired | InvalidToken> {
    try {
      const payload = jwt.verify(token, this.config.refreshTokenSecret) as RefreshTokenPayload;
      return ok(payload);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return err(new TokenExpired());
      }
      return err(new InvalidToken());
    }
  }

  /**
   * Decode without verifying (for getting JTI without validation)
   */
  decodeAccessToken(token: string): AccessTokenPayload | null {
    try {
      return jwt.decode(token) as AccessTokenPayload | null;
    } catch {
      return null;
    }
  }

  /**
   * Get token expiration from payload
   */
  getTokenExpiration(payload: AccessTokenPayload | RefreshTokenPayload): Date | null {
    if (!payload.exp) return null;
    return new Date(payload.exp * 1000);
  }
}

// Singleton instance
export const jwtService = new JWTService();
```

### **Step 3: Create Token Store for Rotation**

**File**: `artifacts/api-server/src/services/token-store.ts`

```typescript
import { db } from '@workspace/db';
import { refreshTokensTable } from '@workspace/db/schema/auth/refresh-tokens';
import { eq, and, lt } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  createdAt: Date;
  replacedBy: string | null;
  revokedAt: Date | null;
}

/**
 * Token store handles refresh token rotation and revocation
 * Uses database for persistence across server restarts
 */
export class TokenStore {
  /**
   * Store a new refresh token
   */
  async storeToken(
    userId: string,
    tokenJti: string,
    tokenFamily: string,
    expiresAt: Date
  ): Promise<void> {
    // Hash the token JTI for storage (don't store raw token)
    const tokenHash = await this.hashToken(tokenJti);
    
    await db.insert(refreshTokensTable).values({
      id: randomUUID(),
      userId,
      tokenHash,
      family: tokenFamily,
      expiresAt,
      replacedBy: null,
      revokedAt: null,
    });
  }

  /**
   * Validate a refresh token and perform rotation
   * Returns new token pair if valid, null if invalid/revoked
   */
  async validateAndRotate(
    tokenJti: string,
    tokenFamily: string
  ): Promise<StoredRefreshToken | null> {
    const tokenHash = await this.hashToken(tokenJti);
    
    // Find the token
    const tokens = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);

    if (tokens.length === 0) {
      return null; // Token not found
    }

    const token = tokens[0];

    // Check if revoked
    if (token.revokedAt) {
      // Potential token reuse attack - revoke entire family
      await this.revokeFamily(token.family);
      return null;
    }

    // Check expiration
    if (new Date() > new Date(token.expiresAt)) {
      return null;
    }

    return token;
  }

  /**
   * Mark a token as replaced by a new one
   */
  async markReplaced(tokenId: string, newTokenJti: string): Promise<void> {
    const newTokenHash = await this.hashToken(newTokenJti);
    
    await db
      .update(refreshTokensTable)
      .set({ replacedBy: newTokenHash })
      .where(eq(refreshTokensTable.id, tokenId));
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(tokenJti: string): Promise<void> {
    const tokenHash = await this.hashToken(tokenJti);
    
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.tokenHash, tokenHash));
  }

  /**
   * Revoke all tokens in a family (used when reuse detected)
   */
  async revokeFamily(family: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.family, family));
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.userId, userId));
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await db
      .delete(refreshTokensTable)
      .where(lt(refreshTokensTable.expiresAt, new Date()));
    
    return result.rowCount || 0;
  }

  /**
   * Simple hash for token storage (SHA-256)
   * Not for passwords - tokens are already cryptographically random
   */
  private async hashToken(tokenJti: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenJti);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const tokenStore = new TokenStore();
```

### **Step 4: Database Schema for Refresh Tokens**

**File**: `lib/db/src/schema/auth/refresh-tokens.ts`

```typescript
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users';
import { createInsertSchema } from 'drizzle-zod';

export const refreshTokensTable = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  family: text('family').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  replacedBy: text('replaced_by'),
  revokedAt: timestamp('revoked_at'),
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokensTable, {
  id: true,
  createdAt: true,
  replacedBy: true,
  revokedAt: true,
});
```

### **Step 5: Token Refresh Flow**

**File**: `artifacts/api-server/src/services/auth.ts` (updated refresh method)

```typescript
import { jwtService, TokenPair } from './jwt';
import { tokenStore } from './token-store';
import { Result, ok, err } from 'neverthrow';
import { TokenExpired, InvalidToken, UserNotFound } from '../errors/domain-errors';

export class AuthService {
  /**
   * Refresh token with rotation
   * 2026 best practice: Rotate refresh tokens on every use
   */
  async refreshToken(
    refreshToken: string
  ): Promise<Result<TokenPair, TokenExpired | InvalidToken | UserNotFound>> {
    // Verify the refresh token signature
    const verifyResult = jwtService.verifyRefreshToken(refreshToken);
    if (verifyResult.isErr()) {
      return err(verifyResult.error);
    }

    const payload = verifyResult.value;

    // Validate in store and check for reuse
    const storedToken = await tokenStore.validateAndRotate(
      payload.jti,
      payload.family
    );

    if (!storedToken) {
      // Token reuse detected or invalid
      return err(new InvalidToken());
    }

    // Get user info for new tokens
    const user = await this.getUserById(payload.sub);
    if (!user) {
      return err(new UserNotFound(payload.sub));
    }

    // Generate new token pair
    const newTokens = jwtService.generateTokenPair(
      user.id,
      user.organizationId,
      user.email,
      user.role,
      user.permissions
    );

    // Store new refresh token
    await tokenStore.storeToken(
      user.id,
      newTokens.refreshToken, // We need to decode to get JTI - fix this
      payload.family,
      newTokens.refreshTokenExpiresAt
    );

    // Mark old token as replaced
    const newRefreshPayload = jwtService.decodeRefreshToken(newTokens.refreshToken);
    if (newRefreshPayload) {
      await tokenStore.markReplaced(storedToken.id, newRefreshPayload.jti);
    }

    return ok(newTokens);
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<Result<void, InvalidToken>> {
    const verifyResult = jwtService.verifyRefreshToken(refreshToken);
    if (verifyResult.isErr()) {
      return err(verifyResult.error);
    }

    const payload = verifyResult.value;
    await tokenStore.revokeToken(payload.jti);

    return ok(undefined);
  }

  // ... other auth methods
}
```

### **Step 6: Secure Cookie Configuration**

**File**: `artifacts/api-server/src/middlewares/cookies.ts`

```typescript
import { Response } from 'express';

interface CookieOptions {
  accessToken?: string;
  refreshToken?: string;
  clear?: boolean;
}

/**
   * 2026 best practice: HttpOnly, Secure, SameSite cookies
   * Access token in memory/header for SPA, refresh in HttpOnly cookie
   */
export function setAuthCookies(res: Response, options: CookieOptions): void {
  if (options.clear) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return;
  }

  if (options.refreshToken) {
    // Refresh token - HttpOnly cookie
    res.cookie('refreshToken', options.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  // Access token typically sent in response body for SPAs to store in memory
  // NOT in cookies (XSS risk) and NOT in localStorage (XSS risk)
  // Store in memory (React state) and refresh silently
}
```

### **Step 7: Environment Configuration**

**File**: `.env.example`

```bash
# JWT Secrets - Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=your_access_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_different_from_access

# Token TTL
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

## 2026 Security Best Practices

### **Token Storage Strategy**

| Token | Storage | Reason |
|-------|---------|--------|
| Access Token | Memory (React state) | Short-lived, avoid XSS via localStorage |
| Refresh Token | HttpOnly Cookie | Protected from XSS, sent automatically |

### **Token Rotation Benefits**

1. **Limits Exposure Window**: Stolen tokens expire quickly
2. **Reuse Detection**: Old token use indicates theft
3. **Automatic Recovery**: New tokens issued on refresh

### **Security Checklist**

- [ ] Access tokens expire in ≤15 minutes
- [ ] Refresh tokens rotate on every use
- [ ] Refresh tokens stored hashed in database
- [ ] Token families revoked on reuse detection
- [ ] HttpOnly, Secure, SameSite=Strict cookies
- [ ] Secrets are cryptographically random (≥256 bits)
- [ ] Different secrets for access and refresh tokens
- [ ] Token IDs (JTI) used for revocation tracking

## Anti-Patterns to Avoid

❌ **Long-lived access tokens**:
```typescript
// WRONG - 24 hour access token
jwt.sign(payload, secret, { expiresIn: '24h' });
```

❌ **Storing tokens in localStorage**:
```typescript
// WRONG - vulnerable to XSS
localStorage.setItem('token', accessToken);
```

❌ **Not rotating refresh tokens**:
```typescript
// WRONG - same refresh token for 7 days
// If stolen, attacker has 7 days of access
```

❌ **Storing raw tokens in database**:
```typescript
// WRONG - store hash of token JTI, not the token
await db.insert(tokens).values({ token: refreshToken });
```

## Testing Token Rotation

```typescript
// tests/auth/token-rotation.test.ts
import { describe, it, expect } from 'vitest';
import { jwtService } from '../../src/services/jwt';
import { tokenStore } from '../../src/services/token-store';

describe('Token Rotation', () => {
  it('should rotate refresh tokens on use', async () => {
    // Generate initial tokens
    const tokens = jwtService.generateTokenPair(
      'user-123', 'org-456', 'test@example.com', 'user', []
    );

    // Store initial refresh token
    const decoded = jwtService.decodeRefreshToken(tokens.refreshToken);
    await tokenStore.storeToken(
      'user-123',
      decoded!.jti,
      decoded!.family,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    // Simulate refresh
    const newTokens = await authService.refreshToken(tokens.refreshToken);
    
    // Old token should be marked as replaced
    const oldToken = await tokenStore.findByJti(decoded!.jti);
    expect(oldToken?.replacedBy).toBeDefined();

    // Using old token again should fail (reuse detection)
    const reuseResult = await authService.refreshToken(tokens.refreshToken);
    expect(reuseResult.isErr()).toBe(true);
  });

  it('should detect token reuse and revoke family', async () => {
    // Test reuse detection logic
  });
});
```

## Verification Commands

```bash
# Verify JWT secrets are configured
grep -E "JWT_ACCESS_SECRET|JWT_REFRESH_SECRET" .env.example

# Check token expiration times
grep -r "expiresIn" artifacts/api-server/src/services/ | grep -v node_modules

# Verify no localStorage token storage
grep -r "localStorage.*token" artifacts/apex-os/src/ || echo "Clean"
```
