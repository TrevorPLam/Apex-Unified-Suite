---
trigger: model_decision
description: Required environment variables for production deployment with validation and security standards
---

# Environment Variables Required

## Core Principle

### Zero-Trust Environment Configuration
All environment variables must be explicitly required and validated. No defaults should be assumed for production deployments. Every environment variable must have a clear purpose, validation rules, and security considerations.

## Required Environment Variables

### 1. Application Configuration
```bash
# ✅ REQUIRED - Application identification
NODE_ENV=production
APP_NAME=apex-unified-suite
APP_VERSION=1.0.0
APP_URL=https://apex.example.com

# ✅ REQUIRED - Server configuration
PORT=8080
HOST=0.0.0.0
BASE_PATH=/api/v1

# ✅ REQUIRED - CORS configuration
CORS_ORIGIN=https://apex.example.com
CORS_CREDENTIALS=false
```

### 2. Database Configuration
```bash
# ✅ REQUIRED - Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/apex_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=apex_db
DATABASE_USER=apex_user
DATABASE_PASSWORD=secure_password

# ✅ REQUIRED - Database pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000
```

### 3. Authentication & Security
```bash
# ✅ REQUIRED - JWT configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ✅ REQUIRED - Session configuration
SESSION_SECRET=your-super-secret-session-key-min-32-chars
SESSION_MAX_AGE=86400000

# ✅ REQUIRED - Security headers
SECURITY_COOKIE_SECURE=true
SECURITY_COOKIE_HTTP_ONLY=true
SECURITY_COOKIE_SAME_SITE=strict
```

### 4. External Services
```bash
# ✅ REQUIRED - Email service
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=smtp_password
SMTP_FROM=Apex Suite <noreply@example.com>

# ✅ REQUIRED - File storage
STORAGE_PROVIDER=aws-s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=apex-uploads

# ✅ REQUIRED - Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
LOG_FORMAT=json
```

### 5. Feature Flags
```bash
# ✅ REQUIRED - Feature flags
FEATURE_PORTAL_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
FEATURE_NOTIFICATIONS_ENABLED=true
FEATURE_MULTI_TENANCY=false

# ✅ REQUIRED - Development flags
DEVELOPMENT_MODE=false
DEBUG_MODE=false
VERBOSE_LOGGING=false
```

## Validation Patterns

### 1. Environment Variable Validation
```typescript
// ✅ CORRECT - Comprehensive environment validation
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  APP_NAME: z.string().min(1),
  APP_VERSION: z.string().min(1),
  APP_URL: z.string().url(),
  PORT: z.number().min(1).max(65535),
  HOST: z.string().ip(),
  BASE_PATH: z.string().startsWith('/'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.number().min(1).max(65535),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(32),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/),
  JWT_REFRESH_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/),
  SESSION_SECRET: z.string().min(32),
  
  // Security
  SECURITY_COOKIE_SECURE: z.coerce.boolean(),
  SECURITY_COOKIE_HTTP_ONLY: z.coerce.boolean(),
  SECURITY_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']),
  
  // External Services
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.number().min(1).max(65535),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().email(),
  
  // Storage
  STORAGE_PROVIDER: z.enum(['aws-s3', 'local', 'azure-blob']),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']),
  LOG_FORMAT: z.enum(['json', 'text']),
  
  // Feature Flags
  FEATURE_PORTAL_ENABLED: z.coerce.boolean(),
  FEATURE_ANALYTICS_ENABLED: z.coerce.boolean(),
  FEATURE_NOTIFICATIONS_ENABLED: z.coerce.boolean(),
  FEATURE_MULTI_TENANCY: z.coerce.boolean(),
});

export function validateEnvironment() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Environment validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  
  return result.data;
}

// ❌ INCORRECT - No validation
export function getEnvironment() {
  return {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/db',
    // No validation, defaults are assumed
  };
}
```

### 2. Runtime Environment Check
```typescript
// ✅ CORRECT - Runtime environment validation
function checkRequiredEnvironment() {
  const required = [
    'NODE_ENV',
    'APP_NAME',
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(key => {
      console.error(`  ${key}`);
    });
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('Running in development mode with missing variables');
    }
  }
  
  // Validate critical security variables in production
  if (process.env.NODE_ENV === 'production') {
    const securityCritical = [
      'JWT_SECRET',
      'SESSION_SECRET',
      'DATABASE_PASSWORD',
      'SMTP_PASSWORD',
    ];
    
    const weak = securityCritical.filter(key => {
      const value = process.env[key];
      return !value || value.length < 32 || value === 'changeme' || value === 'password';
    });
    
    if (weak.length > 0) {
      console.error('Weak or missing security variables:');
      weak.forEach(key => {
        console.error(`  ${key}: Must be at least 32 characters and not use default values`);
      });
      process.exit(1);
    }
  }
}

// Run validation at startup
checkRequiredEnvironment();
```

### 3. Environment-Specific Configuration
```typescript
// ✅ CORRECT - Environment-specific configuration
interface EnvironmentConfig {
  app: {
    name: string;
    version: string;
    url: string;
    port: number;
    host: string;
    basePath: string;
  };
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    pool: {
      min: number;
      max: number;
      idleTimeout: number;
      connectionTimeout: number;
    };
  };
  auth: {
    jwt: {
      secret: string;
      expiresIn: string;
      refreshExpiresIn: string;
    };
    session: {
      secret: string;
      maxAge: number;
    };
    cookie: {
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    };
  };
  security: {
    cors: {
      origin: string;
      credentials: boolean;
    };
  };
  services: {
    smtp: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
    };
    storage: {
      provider: 'aws-s3' | 'local' | 'azure-blob';
      aws?: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        bucket: string;
      };
    };
  };
  monitoring: {
    sentryDsn?: string;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logFormat: 'json' | 'text';
  };
  features: {
    portal: boolean;
    analytics: boolean;
    notifications: boolean;
    multiTenancy: boolean;
  };
}

export function createEnvironmentConfig(): EnvironmentConfig {
  const env = validateEnvironment();
  
  return {
    app: {
      name: env.APP_NAME,
      version: env.APP_VERSION,
      url: env.APP_URL,
      port: env.PORT,
      host: env.HOST,
      basePath: env.BASE_PATH,
    },
    database: {
      url: env.DATABASE_URL,
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      name: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      pool: {
        min: env.DATABASE_POOL_MIN,
        max: env.DATABASE_POOL_MAX,
        idleTimeout: env.DATABASE_POOL_IDLE_TIMEOUT,
        connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
      },
    },
    auth: {
      jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
      },
      session: {
        secret: env.SESSION_SECRET,
        maxAge: env.SESSION_MAX_AGE,
      },
      cookie: {
        secure: env.SECURITY_COOKIE_SECURE,
        httpOnly: env.SECURITY_COOKIE_HTTP_ONLY,
        sameSite: env.SECURITY_COOKIE_SAME_SITE,
      },
    },
    security: {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: env.CORS_CREDENTIALS,
      },
    },
    services: {
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
        from: env.SMTP_FROM,
      },
      storage: {
        provider: env.STORAGE_PROVIDER,
        ...(env.STORAGE_PROVIDER === 'aws-s3' && {
          aws: {
            accessKeyId: env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
            region: env.AWS_REGION!,
            bucket: env.AWS_S3_BUCKET!,
          },
        }),
      },
    },
    monitoring: {
      sentryDsn: env.SENTRY_DSN,
      logLevel: env.LOG_LEVEL,
      logFormat: env.LOG_FORMAT,
    },
    features: {
      portal: env.FEATURE_PORTAL_ENABLED,
      analytics: env.FEATURE_ANALYTICS_ENABLED,
      notifications: env.FEATURE_NOTIFICATIONS_ENABLED,
      multiTenancy: env.FEATURE_MULTI_TENANCY,
    },
  };
}
```

## Security Requirements

### 1. Secret Management
```typescript
// ✅ CORRECT - Secure secret handling
export class SecretManager {
  private static readonly SENSITIVE_VARS = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'DATABASE_PASSWORD',
    'SMTP_PASSWORD',
    'AWS_SECRET_ACCESS_KEY',
    'SENTRY_DSN',
  ];
  
  static isSensitive(key: string): boolean {
    return this.SENSITIVE_VARS.includes(key);
  }
  
  static maskSecret(value: string): string {
    if (!value) return 'undefined';
    return value.substring(0, 4) + '*'.repeat(value.length - 4);
  }
  
  static logEnvironment(): void {
    Object.entries(process.env).forEach(([key, value]) => {
      if (this.isSensitive(key)) {
        console.log(`${key}=${this.maskSecret(value || '')}`);
      } else {
        console.log(`${key}=${value}`);
      }
    });
  }
}

// ❌ INCORRECT - Insecure secret handling
export function logAllEnvironment() {
  console.log(process.env); // Logs all secrets in plain text
}
```

### 2. Production Security
```typescript
// ✅ CORRECT - Production security checks
export function validateProductionSecurity(): void {
  if (process.env.NODE_ENV !== 'production') return;
  
  const securityChecks = [
    {
      check: () => process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
      message: 'JWT_SECRET must be at least 32 characters',
    },
    {
      check: () => process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32,
      message: 'SESSION_SECRET must be at least 32 characters',
    },
    {
      check: () => process.env.SECURITY_COOKIE_SECURE === 'true',
      message: 'SECURITY_COOKIE_SECURE must be true in production',
    },
    {
      check: () => process.env.SECURITY_COOKIE_HTTP_ONLY === 'true',
      message: 'SECURITY_COOKIE_HTTP_ONLY must be true in production',
    },
    {
      check: () => process.env.SECURITY_COOKIE_SAME_SITE === 'strict',
      message: 'SECURITY_COOKIE_SAME_SITE must be strict in production',
    },
    {
      check: () => !process.env.DATABASE_URL.includes('localhost'),
      message: 'DATABASE_URL cannot point to localhost in production',
    },
    {
      check: () => !process.env.APP_URL.includes('localhost'),
      message: 'APP_URL cannot point to localhost in production',
    },
  ];
  
  const failed = securityChecks.filter(check => !check.check());
  
  if (failed.length > 0) {
    console.error('Production security validation failed:');
    failed.forEach(({ message }) => {
      console.error(`  ${message}`);
    });
    process.exit(1);
  }
}
```

## Deployment Configuration

### 1. Docker Environment
```dockerfile
# ✅ CORRECT - Docker environment variables
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Copy environment file template
COPY .env.example .env.template

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Run the application
CMD ["node", "dist/server.js"]
```

### 2. Kubernetes Environment
```yaml
# ✅ CORRECT - Kubernetes environment variables
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apex-unified-suite
spec:
  template:
    spec:
      containers:
      - name: apex-unified-suite
        image: apex/unified-suite:latest
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        - name: SMTP_PASSWORD
          valueFrom:
            secretKeyRef:
              name: smtp-secret
              key: password
```

### 3. Environment File Templates
```bash
# ✅ CORRECT - Environment file template
# .env.example - Copy this to .env and fill in values

# Application Configuration
NODE_ENV=production
APP_NAME=apex-unified-suite
APP_VERSION=1.0.0
APP_URL=https://your-domain.com
PORT=8080
HOST=0.0.0.0
BASE_PATH=/api/v1

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/apex_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=apex_db
DATABASE_USER=apex_user
DATABASE_PASSWORD=your-secure-password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=your-super-secret-session-key-min-32-characters
SESSION_MAX_AGE=86400000

# Security
SECURITY_COOKIE_SECURE=true
SECURITY_COOKIE_HTTP_ONLY=true
SECURITY_COOKIE_SAME_SITE=strict

# Email Service
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=Apex Suite <noreply@example.com>

# File Storage
STORAGE_PROVIDER=aws-s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=apex-uploads

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
LOG_FORMAT=json

# Feature Flags
FEATURE_PORTAL_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
FEATURE_NOTIFICATIONS_ENABLED=true
FEATURE_MULTI_TENANCY=false
```

## Testing Environment Variables

### 1. Test Configuration
```typescript
// ✅ CORRECT - Test environment setup
const testEnvSchema = envSchema.extend({
  // Override production values for testing
  NODE_ENV: z.literal('test'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.literal('test-jwt-secret-for-testing-only'),
  SESSION_SECRET: z.literal('test-session-secret-for-testing-only'),
  SMTP_HOST: z.literal('localhost'),
  SMTP_PORT: z.literal(1025),
  SMTP_USER: z.literal('test@example.com'),
  SMTP_PASSWORD: z.literal('test-password'),
  STORAGE_PROVIDER: z.literal('local'),
});

export function createTestEnvironment(): EnvironmentConfig {
  const env = testEnvSchema.parse(process.env);
  
  return {
    app: {
      name: env.APP_NAME,
      version: env.APP_VERSION,
      url: 'http://localhost:8080',
      port: 8080,
      host: '127.0.0.1',
      basePath: env.BASE_PATH,
    },
    // ... rest of config with test overrides
  };
}
```

### 2. Mock Environment for Testing
```typescript
// ✅ CORRECT - Mock environment for unit tests
export const mockEnvironment: EnvironmentConfig = {
  app: {
    name: 'Apex Unified Suite',
    version: '1.0.0',
    url: 'http://localhost:8080',
    port: 8080,
    host: '127.0.0.1',
    basePath: '/api/v1',
  },
  database: {
    url: 'postgresql://test:test@localhost:5432/test_db',
    host: 'localhost',
    port: 5432,
    name: 'test_db',
    user: 'test',
    password: 'test-password',
    pool: {
      min: 1,
      max: 5,
      idleTimeout: 30000,
      connectionTimeout: 10000,
    },
  },
  // ... rest of mock config
};
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't use default values for production**: All variables must be explicitly set
- **Don't hardcode credentials**: Always use environment variables
- **Don't log secrets**: Mask sensitive values in logs
- **Don't skip validation**: Always validate required variables
- **Don't use weak secrets**: Minimum 32 characters for all security-critical variables

### 2. Common Mistakes
```typescript
// ❌ WRONG - Using defaults
const config = {
  port: process.env.PORT || 3000, // Default in production
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/db',
};

// ❌ WRONG - Hardcoded credentials
const config = {
  jwtSecret: 'your-secret-key', // Hardcoded secret
  databasePassword: 'password', // Hardcoded password
};

// ❌ WRONG - No validation
function getConfig() {
  return {
    port: parseInt(process.env.PORT!),
    databaseUrl: process.env.DATABASE_URL!,
    // No validation, will crash if undefined
  };
}

// ❌ WRONG - Logging secrets
console.log('JWT_SECRET:', process.env.JWT_SECRET); // Logs secret in plain text
```

## Compliance Checklist

- [ ] All required environment variables are documented
- [ ] Environment variables are validated at startup
- [ ] Production security checks are implemented
- [ ] Sensitive variables are masked in logs
- [ ] Environment file template is provided
- [ ] Docker/Kubernetes configurations are secure
- [ ] Test environment is properly configured
- [ ] No hardcoded credentials in code
- [ ] No default values for production variables
- [ ] All secrets meet minimum length requirements
- [ ] CORS and security headers are properly configured
- [ ] Database connection strings are secure
- [ ] External service credentials are properly managed
- [ ] Feature flags are properly configured
- [ ] Logging configuration is appropriate for environment
