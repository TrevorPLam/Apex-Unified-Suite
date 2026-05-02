---
name: password-security-implementation
description: Implement password hashing with Argon2id using 2026 security best practices, including parameter selection and migration strategies
---

# Password Security Implementation

This skill guides you through implementing secure password hashing using Argon2id, the winner of the Password Hashing Competition and 2026 best practice for new applications.

## Current State Assessment

**Current State**: No password hashing implementation exists.

**2026 Recommendation**: Use Argon2id over bcrypt for new implementations.

**Why Argon2id?**
- Winner of Password Hashing Competition (2015)
- Memory-hard algorithm (resistant to GPU/ASIC attacks)
- Configurable memory usage (unlike bcrypt's fixed ~4KB)
- Three variants: Argon2d, Argon2i, Argon2id (use Argon2id)

## Argon2id vs bcrypt Comparison

### **Core Difference: Memory-Hardness**

| Feature | bcrypt | Argon2id |
|---------|--------|----------|
| Memory Usage | Fixed ~4KB | Configurable (64MB+ typical) |
| GPU Resistance | Moderate | High (memory bandwidth bound) |
| ASIC Resistance | Low | High (requires physical RAM) |
| Password Limit | 72 bytes | No limit |
| Standard | Established | PHC Winner |

### **Cost Parameter Selection (2026)**

The rule: **Pick the highest cost that still hashes in ~250ms on your production hardware**.

**Argon2id Recommended Settings**:
```typescript
const argon2Config = {
  type: argon2id,           // Use Argon2id variant
  memoryCost: 65536,        // 64 MB (in KB)
  timeCost: 3,              // 3 iterations
  parallelism: 4,             // 4 parallel threads
  hashLength: 32,             // 256-bit output
  saltLength: 16,             // 128-bit salt
};
// Target: ~250ms on production hardware
```

**Benchmark First**:
```typescript
import argon2 from 'argon2';

async function benchmarkArgon2() {
  const password = 'test-password';
  const configs = [
    { memoryCost: 65536, timeCost: 3, parallelism: 4 },   // 64MB
    { memoryCost: 131072, timeCost: 3, parallelism: 4 },    // 128MB
    { memoryCost: 65536, timeCost: 4, parallelism: 4 },    // More iterations
  ];

  for (const config of configs) {
    const start = Date.now();
    await argon2.hash(password, config);
    const duration = Date.now() - start;
    console.log(`Config ${JSON.stringify(config)}: ${duration}ms`);
  }
}
```

## Step-by-Step Implementation

### **Step 1: Install Dependencies**

Add to workspace catalog first:

```yaml
# In pnpm-workspace.yaml catalog:
argon2: ^0.40.1
```

Install in api-server:
```bash
pnpm --filter @workspace/api-server add argon2
```

### **Step 2: Create Password Service**

**File**: `artifacts/api-server/src/services/password.ts`

```typescript
import argon2 from 'argon2';
import { Result, ok, err } from 'neverthrow';
import { WeakPassword } from '../errors/domain-errors';

// Argon2id configuration
// Target: ~250ms hash time on production hardware
const ARGON2_CONFIG = {
  type: argon2.argon2id,      // Use Argon2id variant
  memoryCost: 65536,           // 64 MB (in KB)
  timeCost: 3,                 // 3 iterations
  parallelism: 4,              // 4 parallel threads
  hashLength: 32,              // 256-bit hash output
};

// Password strength requirements
const PASSWORD_CONFIG = {
  minLength: 12,               // 2026 minimum: 12 characters
  maxLength: 128,              // Prevent DoS with extremely long passwords
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordService {
  /**
   * Hash a password using Argon2id
   */
  async hashPassword(plainPassword: string): Promise<string> {
    // Argon2 handles salt generation internally
    return await argon2.hash(plainPassword, ARGON2_CONFIG);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(
    plainPassword: string, 
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      // If hash is malformed or verification fails
      return false;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Length check
    if (password.length < PASSWORD_CONFIG.minLength) {
      errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters`);
    }
    if (password.length > PASSWORD_CONFIG.maxLength) {
      errors.push(`Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`);
    }

    // Character variety checks
    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (PASSWORD_CONFIG.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (PASSWORD_CONFIG.requireSpecialChars) {
      const hasSpecial = new RegExp(`[${PASSWORD_CONFIG.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password);
      if (!hasSpecial) {
        errors.push('Password must contain at least one special character');
      }
    }

    // Common password check (basic)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash with validation - convenience method
   */
  async hashWithValidation(
    plainPassword: string
  ): Promise<Result<string, WeakPassword>> {
    const validation = this.validatePasswordStrength(plainPassword);
    
    if (!validation.isValid) {
      return err(new WeakPassword(validation.errors.join(', ')));
    }

    const hash = await this.hashPassword(plainPassword);
    return ok(hash);
  }

  /**
   * Check if password needs rehash (for algorithm upgrades)
   * Argon2 encoded hashes contain the parameters used
   */
  async needsRehash(hashedPassword: string): Promise<boolean> {
    return await argon2.needsRehash(hashedPassword, ARGON2_CONFIG);
  }
}

// Singleton instance
export const passwordService = new PasswordService();
```

### **Step 3: Rehash-on-Login Pattern**

For future algorithm upgrades, implement automatic rehashing:

**File**: `artifacts/api-server/src/services/auth.ts`

```typescript
import { passwordService } from './password';

export class AuthService {
  async authenticateUser(
    email: string, 
    password: string
  ): Promise<Result<AuthResult, InvalidCredentials>> {
    // Fetch user with password hash
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Timing attack protection: still hash to maintain constant time
      await passwordService.hashPassword(password);
      return err(new InvalidCredentials());
    }

    // Verify password
    const isValid = await passwordService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return err(new InvalidCredentials());
    }

    // Check if rehash needed (algorithm upgrade path)
    if (await passwordService.needsRehash(user.passwordHash)) {
      const newHash = await passwordService.hashPassword(password);
      await this.userRepo.updatePassword(user.id, newHash);
    }

    // Generate tokens and return
    const tokens = await this.generateTokens(user);
    return ok({ user, tokens });
  }
}
```

### **Step 4: Integration with Auth Flow**

**File**: `artifacts/api-server/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { passwordService } from '../services/password';
import { authService } from '../services/auth';

const router = Router();

// Registration with password validation
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  fullName: z.string().min(2),
  organizationId: z.string().uuid(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Validate password strength
    const validation = passwordService.validatePasswordStrength(data.password);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'WeakPassword',
        message: 'Password does not meet security requirements',
        details: validation.errors,
      });
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(data.password);

    // Create user
    const result = await authService.register({
      ...data,
      passwordHash,
    });

    if (result.isErr()) {
      return res.status(409).json({
        error: result.error.code,
        message: result.error.message,
      });
    }

    res.status(201).json({
      user: result.value.user,
      tokens: result.value.tokens,
    });
  } catch (error) {
    next(error);
  }
});

// Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  organizationId: z.string().uuid(),
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await authService.authenticateUser(
      data.email,
      data.password
    );

    if (result.isErr()) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      });
    }

    res.json({
      user: result.value.user,
      tokens: result.value.tokens,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### **Step 5: Rate Limiting on Auth Endpoints**

**File**: `artifacts/api-server/src/middlewares/rate-limit.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests (only count failures)
  skipSuccessfulRequests: false,
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many requests. Please slow down.',
  },
});
```

### **Step 6: Unit Tests**

**File**: `artifacts/api-server/__tests__/services/password.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { passwordService } from '../../src/services/password';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should hash password using Argon2id', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordService.hashPassword(password);
      
      // Verify it's an Argon2id hash
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should produce different hashes for same password (different salts)', async () => {
      const password = 'SecurePass123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should handle malformed hashes gracefully', async () => {
      const isValid = await passwordService.verifyPassword('password', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = passwordService.validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = passwordService.validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('12 characters'));
    });

    it('should reject password without uppercase', () => {
      const result = passwordService.validatePasswordStrength('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('uppercase'));
    });

    it('should reject password without number', () => {
      const result = passwordService.validatePasswordStrength('NoNumbersHere!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('number'));
    });

    it('should reject password without special character', () => {
      const result = passwordService.validatePasswordStrength('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('special character'));
    });

    it('should reject common password', () => {
      const result = passwordService.validatePasswordStrength('password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('too common'));
    });
  });

  describe('hash time', () => {
    it('should complete in reasonable time (~250ms)', async () => {
      const password = 'TestPassword123!';
      const start = Date.now();
      await passwordService.hashPassword(password);
      const duration = Date.now() - start;
      
      // Should be between 100ms and 1000ms
      expect(duration).toBeGreaterThan(100);
      expect(duration).toBeLessThan(1000);
    });
  });
});
```

## Environment Configuration

**File**: `.env.example`

```bash
# Password hashing (optional overrides)
# ARGON2_MEMORY_COST=65536    # 64MB in KB
# ARGON2_TIME_COST=3          # Iterations
# ARGON2_PARALLELISM=4       # Threads
```

## Frontend Password Guidance

**File**: `artifacts/apex-os/src/components/auth/PasswordStrength.tsx`

```typescript
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const calculateStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 12.5;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 12.5;
    return score;
  };

  const strength = calculateStrength(password);
  
  const getColor = () => {
    if (strength <= 25) return 'bg-red-500';
    if (strength <= 50) return 'bg-yellow-500';
    if (strength <= 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <Progress value={strength} className={getColor()} />
      <p className="text-xs text-muted-foreground">
        Password must be at least 12 characters with uppercase, lowercase, number, and special character
      </p>
    </div>
  );
}
```

## Migration from bcrypt (if applicable)

If migrating from bcrypt:

```typescript
// Support both during transition
async function verifyPassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  // Check if it's a bcrypt hash
  if (hashedPassword.startsWith('$2')) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  // Otherwise use Argon2
  return await argon2.verify(hashedPassword, plainPassword);
}

// Rehash on successful bcrypt verification
if (isValidBcrypt && await bcrypt.compare(password, hash)) {
  // Upgrade to Argon2
  const newHash = await passwordService.hashPassword(password);
  await userRepo.updatePassword(user.id, newHash);
}
```

## Verification Commands

```bash
# Verify argon2 installed
pnpm --filter @workspace/api-server list argon2

# Check for bcrypt references (should be none)
grep -r "bcrypt" artifacts/api-server/src/ || echo "Clean - using Argon2"

# Test password hashing
cd artifacts/api-server
pnpm vitest run password.test.ts
```

## Security Checklist

- [ ] Argon2id (not Argon2d or Argon2i)
- [ ] Memory cost ≥ 64MB (65536 KB)
- [ ] Time cost ≥ 3 iterations
- [ ] Parallelism ≥ 4 threads
- [ ] Password minimum 12 characters
- [ ] Rate limiting on auth endpoints
- [ ] Rehash-on-login for algorithm upgrades
- [ ] Timing attack protection (constant time comparison)
- [ ] No plain text password logging
- [ ] Password strength validation enforced
