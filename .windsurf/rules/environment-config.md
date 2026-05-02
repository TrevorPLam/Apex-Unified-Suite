---
trigger: always_on
---

# Environment Configuration Rule

All environment variables must be declared in a central schema (via Zod at startup) and never accessed via raw `process.env` in business logic.

## Configuration Schema Pattern

### **Central Configuration Schema**
```typescript
// ✅ CORRECT - Central environment configuration
// src/config/environment.ts
import { z } from 'zod';

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  PORT: z.string().transform(Number).pipe(z.number().positive()).default('8081'),
  HOST: z.string().default('localhost'),
  
  // Database configuration
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.string().transform(Number).pipe(z.number().positive()).default('10'),
  
  // JWT configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // API configuration
  API_VERSION: z.string().default('v1'),
  API_BASE_PATH: z.string().default('/api'),
  
  // CORS configuration
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  
  // Logging configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // External services
  REDIS_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // File storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  
  // Feature flags
  ENABLE_ANALYTICS: z.string().transform(Boolean).default('false'),
  ENABLE_AUDIT_LOGS: z.string().transform(Boolean).default('true'),
  ENABLE_CACHE: z.string().transform(Boolean).default('true'),
});

// Validate at startup
export const env = envSchema.parse(process.env);

// Export typed configuration
export type EnvironmentConfig = z.infer<typeof envSchema>;
```

### **Configuration Validation at Startup**
```typescript
// ✅ CORRECT - Validate configuration before app starts
// src/config/index.ts
import { env } from './environment';

export function validateConfiguration(): void {
  try {
    // Validation happens during envSchema.parse()
    console.log('✅ Environment configuration validated');
    
    // Log non-sensitive configuration
    console.log(`🚀 Server will run on ${env.HOST}:${env.PORT}`);
    console.log(`📊 Log level: ${env.LOG_LEVEL}`);
    console.log(`🔐 JWT expiration: ${env.JWT_EXPIRES_IN}`);
    
    // Validate critical requirements
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }
    
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
    
    if (env.NODE_ENV === 'production' && env.LOG_LEVEL === 'debug') {
      console.warn('⚠️  Debug logging enabled in production');
    }
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
  }
}
```

## Usage Patterns

### **Import Configuration, Not process.env**
```typescript
// ✅ CORRECT - Import configuration from central schema
import { env } from '@/config/environment';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_SIZE,
    });
  }
}

export class JWTService {
  generateToken(payload: any): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }
}

// ❌ INCORRECT - Direct process.env access
export class BadDatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL, // Unsafe, no validation
      max: parseInt(process.env.DATABASE_POOL_SIZE || '10'), // Unsafe parsing
    });
  }
}
```

### **Environment-Specific Configuration**
```typescript
// ✅ CORRECT - Use environment-specific logic
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

// Usage in code
if (isDevelopment()) {
  console.log('🔧 Development mode enabled');
}

if (isProduction()) {
  // Production-specific behavior
  logger.setLevel('warn');
}
```

### **Feature Flag Pattern**
```typescript
// ✅ CORRECT - Use feature flags from configuration
export class FeatureFlags {
  static isAnalyticsEnabled(): boolean {
    return env.ENABLE_ANALYTICS;
  }

  static isAuditLoggingEnabled(): boolean {
    return env.ENABLE_AUDIT_LOGS;
  }

  static isCacheEnabled(): boolean {
    return env.ENABLE_CACHE;
  }
}

// Usage
if (FeatureFlags.isAnalyticsEnabled()) {
  analytics.trackEvent('user_action', data);
}
```

## Configuration Files

### **.env.example Template**
```bash
# Environment Configuration Template
# Copy this file to .env and fill in your values

# Node environment
NODE_ENV=development

# Server configuration
PORT=8081
HOST=localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/apex_dev
DATABASE_POOL_SIZE=10

# JWT configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# API configuration
API_VERSION=v1
API_BASE_PATH=/api

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# External services (optional)
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# Feature flags
ENABLE_ANALYTICS=false
ENABLE_AUDIT_LOGS=true
ENABLE_CACHE=true
```

### **.env.test Configuration**
```bash
# Test environment configuration
NODE_ENV=test
PORT=8082
DATABASE_URL=postgresql://test:test@localhost:5432/apex_test
JWT_SECRET=test-jwt-secret-for-testing-only
LOG_LEVEL=error
ENABLE_ANALYTICS=false
ENABLE_AUDIT_LOGS=false
ENABLE_CACHE=false
```

## Configuration Injection

### **Dependency Injection Pattern**
```typescript
// ✅ CORRECT - Inject configuration into services
export interface Config {
  database: {
    url: string;
    poolSize: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  server: {
    port: number;
    host: string;
  };
}

export function createConfig(): Config {
  return {
    database: {
      url: env.DATABASE_URL,
      poolSize: env.DATABASE_POOL_SIZE,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
    server: {
      port: env.PORT,
      host: env.HOST,
    },
  };
}

// Service with injected configuration
export class UserService {
  constructor(
    private readonly config: Config,
    private readonly repository: UserRepository
  ) {}

  async createToken(user: User): Promise<string> {
    return jwt.sign(
      { userId: user.id, organizationId: user.organizationId },
      this.config.jwt.secret,
      { expiresIn: this.config.jwt.expiresIn }
    );
  }
}
```

### **Configuration Provider Pattern**
```typescript
// ✅ CORRECT - Configuration provider for dependency injection
export class ConfigurationProvider {
  private static instance: Config;

  static initialize(): Config {
    this.instance = createConfig();
    return this.instance;
  }

  static get(): Config {
    if (!this.instance) {
      throw new Error('Configuration not initialized');
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null as any;
  }
}

// Application initialization
const config = ConfigurationProvider.initialize();
const userService = new UserService(config, userRepository);
```

## Security Considerations

### **Sensitive Data Protection**
```typescript
// ✅ CORRECT - Never log sensitive configuration
export function logConfiguration(): void {
  const safeConfig = {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    host: env.HOST,
    logLevel: env.LOG_LEVEL,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    databaseUrl: maskUrl(env.DATABASE_URL),
    corsOrigin: env.CORS_ORIGIN,
    features: {
      analytics: env.ENABLE_ANALYTICS,
      auditLogs: env.ENABLE_AUDIT_LOGS,
      cache: env.ENABLE_CACHE,
    },
  };

  console.log('📋 Configuration:', JSON.stringify(safeConfig, null, 2));
}

function maskUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.username ? '***:***@' : ''}${parsed.host}${parsed.pathname}`;
}

// ❌ INCORRECT - Logging sensitive data
console.log('Database URL:', process.env.DATABASE_URL); // Leaks credentials
console.log('JWT Secret:', process.env.JWT_SECRET);    // Leaks secret key
```

### **Environment Validation in Production**
```typescript
// ✅ CORRECT - Production-specific validations
export function validateProductionConfig(): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  // Security checks
  if (env.JWT_SECRET.length < 64) {
    console.warn('⚠️  JWT_SECRET should be at least 64 characters in production');
  }

  if (env.CORS_ORIGIN === '*' || env.CORS_ORIGIN.includes('localhost')) {
    console.warn('⚠️  CORS_ORIGIN should be specific in production');
  }
}
```

## Testing Configuration

### **Test Configuration Override**
```typescript
// ✅ CORRECT - Override configuration for tests
export function createTestConfig(overrides: Partial<EnvironmentConfig> = {}): EnvironmentConfig {
  return {
    ...env,
    ...overrides,
    NODE_ENV: 'test',
    PORT: 8082,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/apex_test',
    JWT_SECRET: 'test-jwt-secret-for-testing-only',
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: false,
    ENABLE_AUDIT_LOGS: false,
    ENABLE_CACHE: false,
  };
}

// Test setup
beforeAll(() => {
  const testConfig = createTestConfig();
  // Override global config for tests
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('DATABASE_URL', testConfig.DATABASE_URL);
});
```

## Anti-Patterns

❌ **Never** access `process.env` directly in business logic
❌ **Never** use environment variables without validation
❌ **Never** hardcode configuration values in code
❌ **Never** log sensitive environment variables
❌ **Never** assume environment variables exist
❌ **Never** use different variable names across environments
❌ **Never** commit actual `.env` files to version control

## Quality Checklist

- [ ] All environment variables declared in central schema
- [ ] Configuration validated at application startup
- [ ] No direct `process.env` access in business logic
- [ ] Sensitive data is masked in logs
- [ ] Production-specific validations implemented
- [ ] Test configuration overrides available
- [ ] `.env.example` template provided
- [ ] Feature flags use configuration values
- [ ] Error handling for missing configuration
- [ ] Type safety for all configuration values

This rule ensures consistent, type-safe, and secure environment configuration management across the entire application.
