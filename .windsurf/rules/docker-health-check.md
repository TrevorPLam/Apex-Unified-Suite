---
trigger: model_decision
description: Docker health check requirements for containerized applications with proper readiness and liveness probes
---

# Docker Health Check Requirements

## Core Principle

### Container Health Monitoring
All Docker containers must implement proper health checks to ensure service readiness and liveness. Health checks must be lightweight, fast, and accurately reflect the actual service state.

## Required Health Check Implementation

### 1. Application Health Endpoint
```typescript
// ✅ CORRECT - Comprehensive health check endpoint
export function createHealthCheckRouter(
  database: DatabaseService,
  redis: RedisService,
  storage: StorageService
): Router {
  const router = Router();

  // Main health check endpoint
  router.get('/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Database connectivity check
      const dbHealth = await checkDatabaseHealth(database);
      
      // Redis connectivity check
      const redisHealth = await checkRedisHealth(redis);
      
      // Storage connectivity check
      const storageHealth = await checkStorageHealth(storage);
      
      // Service-specific checks
      const serviceHealth = await checkServiceHealth();
      
      // Calculate total response time
      const responseTime = Date.now() - startTime;
      
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        uptime: process.uptime(),
        version: process.env.APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
        checks: {
          database: dbHealth,
          redis: redisHealth,
          storage: storageHealth,
          services: serviceHealth,
        },
      };
      
      const isHealthy = Object.values(healthStatus.checks).every(check => 
        check.status === 'healthy'
      );
      
      res.status(isHealthy ? 200 : 503).json(healthStatus);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        uptime: process.uptime(),
      });
    }
  });

  // Readiness probe (for startup)
  router.get('/health/ready', async (req, res) => {
    try {
      // Check critical dependencies
      await checkDatabaseHealth(database);
      await checkRedisHealth(redis);
      await checkStorageHealth(storage);
      
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  // Liveness probe (for running checks)
  router.get('/health/live', async (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

// Database health check
async function checkDatabaseHealth(database: DatabaseService): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    await database.query('SELECT 1');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

// Redis health check
async function checkRedisHealth(redis: RedisService): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    await redis.ping();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

// Storage health check
async function checkStorageHealth(storage: StorageService): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    await storage.checkConnection();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

// Service-specific health check
async function checkServiceHealth(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // Check critical dependencies
    const emailServiceHealth = await checkEmailServiceHealth();
    const paymentServiceHealth = await checkPaymentServiceHealth();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      lastCheck: new Date().toISOString(),
      services: {
        email: emailServiceHealth,
        payment: paymentServiceHealth,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastCheck: new Date().toISOString(),
    };
  }
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  responseTime?: string;
  lastCheck: string;
  error?: string;
  services?: Record<string, any>;
}

// ❌ INCORRECT - Simple health check with no real checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok' }); // No actual health verification
});
```

### 2. Docker Health Check Configuration
```dockerfile
# ✅ CORRECT - Proper Docker health checks
FROM node:18-alpine

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Readiness check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health/ready || exit 1

# Liveness check
HEALTHCHECK --interval=30s --timeout=1s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health/live || exit 1

# Run the application
CMD ["node", "dist/server.js"]
```

```yaml
# ✅ CORRECT - Kubernetes health checks
apiVersion: v1
kind: Deployment
metadata:
  name: apex-unified-suite
spec:
  replicas: 3
  selector:
    matchLabels:
      app: apex-unified-suite
  template:
    metadata:
      labels:
        app: apex-unified-suite
    spec:
      containers:
      - name: apex-unified-suite
        image: apex/unified-suite:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
        startupProbe:
          httpGet:
            path: /api/health
            port: 8080
          failureThreshold: 3
          periodSeconds: 10
          timeoutSeconds: 5
```

# ❌ INCORRECT - No health checks
apiVersion: v1
kind: Deployment
metadata:
  name: apex-unified-suite
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: apex-unified-suite
        image: apex/unified-suite:latest
        ports:
        - containerPort: 8080
        # No health checks - container may be unhealthy but not detected
```

### 3. Health Check Response Format
```typescript
// ✅ CORRECT - Standard health check response format
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  responseTime?: string;
  checks: {
    database: HealthStatus;
    redis: HealthStatus;
    storage: HealthStatus;
    services: HealthStatus;
    external_apis: HealthStatus[];
  };
  dependencies?: {
    database: string[];
    redis: string[];
    storage: string[];
  };
}

// ❌ INCORRECT - Minimal health check response
interface SimpleHealthResponse {
  status: string;
  timestamp: string;
  // Missing critical information
}
```

## Implementation Patterns

### 1. Health Check Service
```typescript
// ✅ CORRECT - Centralized health check service
export class HealthCheckService {
  constructor(
    private database: DatabaseService,
    private redis: RedisService,
    private storage: StorageService,
    private services: Record<string, Service>
  ) {}

  async performFullHealthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkEmailService(),
      this.checkPaymentService(),
      this.checkNotificationService(),
      this.checkAnalyticsService(),
    ]);

    const responseTime = Date.now() - startTime;
    
    const allHealthy = checks.every(check => check.status === 'healthy');
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      responseTime: `${responseTime}ms`,
      checks: {
        database: checks[0],
        redis: checks[1],
        storage: checks[2],
        services: {
          email: checks[3],
          payment: checks[4],
          notification: checks[5],
          analytics: checks[6],
        },
      },
    };
  }

  async performReadinessCheck(): Promise<ReadinessResponse> {
    const criticalChecks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);
    
    const allReady = criticalChecks.every(check => check.status === 'healthy');
    
    return {
      status: allReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: criticalChecks[0],
        redis: criticalChecks[1],
        storage: criticalChecks[2],
      },
    };
  }

  async performLivenessCheck(): Promise<LivenessResponse> {
    // Simple liveness check
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.database.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'established',
          pool: 'active',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'failed',
          error: error.message,
        },
      };
    }
  }

  private async checkRedis(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.redis.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'established',
          memory: 'normal',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'failed',
          error: error.message,
        },
      };
    }
  }

  private async checkStorage(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.storage.checkConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'established',
          space: 'available',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        details: {
          connection: 'failed',
          error: error.message,
        },
      };
    }
  }

  private async checkEmailService(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.services.email.sendTestEmail();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          smtp: 'connected',
          queue: 'processing',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        details: {
          smtp: 'disconnected',
          error: error.message,
        },
      };
    }
  }

  private async checkPaymentService(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.services.payment.validateConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          stripe: 'connected',
          webhook: 'configured',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        details: {
          stripe: 'disconnected',
          error: error.message,
        },
      };
    }
  }

  private async checkNotificationService(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.services.notification.testDelivery();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          queue: 'processing',
          delivery: 'working',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        details: {
          queue: 'failed',
          error: error.message,
        },
      };
    }
  }

  private async checkAnalyticsService(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.services.analytics.trackEvent('health_check');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          tracking: 'enabled',
          queue: 'processing',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
        details: {
          tracking: 'disabled',
          error: error.message,
        },
      };
    }
  }
}

// ❌ INCORRECT - No health check service
function healthCheck(req: Request, res: Response) {
  // Manual health checks in each route - error-prone
  const dbStatus = await checkDatabase();
  const redisStatus = await checkRedis();
  
  res.json({
    database: dbStatus,
    redis: redisStatus,
  });
}
```

### 2. Graceful Degradation
```typescript
// ✅ CORRECT - Graceful degradation with health status
export class GracefulDegradation {
  static determineHealthStatus(
    checks: Record<string, HealthStatus>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks);
    
    if (statuses.every(status => status.status === 'healthy')) {
      return 'healthy';
    }
    
    const failedChecks = statuses.filter(status => status.status === 'unhealthy');
    if (failedChecks.length > 0) {
      return 'unhealthy';
    }
    
    const degradedChecks = statuses.filter(status => status.status === 'degraded');
    if (degradedChecks.length > 0) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  static getDegradedMessage(checks: Record<string, HealthStatus>): string {
    const failedChecks = Object.entries(checks)
      .filter(([_, status]) => status.status === 'unhealthy')
      .map(([name, status]) => `${name}: ${status.error || 'Unknown error'}`);
    
    if (failedChecks.length === 0) {
      return 'All systems operational';
    }
    
    return `Degraded systems: ${failedChecks.join(', ')}`;
  }
}

// ❌ INCORRECT - No degradation strategy
function handleHealthCheck(req: Request, res: Response) {
  const isHealthy = await checkAllHealth();
  
  if (!isHealthy) {
    res.status(503).json({
      error: 'Service unavailable',
    });
    return;
  }
  
  // No graceful degradation - all or nothing
  res.status(200).json({
    status: 'ok',
  });
}
```

## Testing Health Checks

### 1. Unit Tests
```typescript
// ✅ CORRECT - Health check unit tests
describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockRedis: jest.Mocked<RedisService>;
  let mockStorage: jest.Mocked<StorageService>;
  let mockServices: Record<string, jest.Mock<Service>>;

  beforeEach(() => {
    mockDatabase = {
      query: jest.fn().mockResolvedValue(true),
    };
    mockRedis = {
      ping: jest.fn().mockResolvedValue(true),
    };
    mockStorage = {
      checkConnection: jest.fn().mockResolvedValue(true),
    };
    mockServices = {
      email: {
        sendTestEmail: jest.fn().mockResolvedValue(true),
      },
      payment: {
        validateConnection: jest.fn().mockResolvedValue(true),
      },
    };
    
    healthCheckService = new HealthCheckService(
      mockDatabase as any,
      mockRedis as any,
      mockStorage as any,
      mockServices as any
    );
  });

  describe('when all systems are healthy', () => {
    it('should return healthy status', async () => {
      const result = await healthCheckService.performFullHealthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.checks.database.status).toBe('healthy');
      expect(result.checks.redis.status).toBe('healthy');
      expect(result.checks.storage.status).toBe('healthy');
      expect(result.checks.services.email.status).toBe('healthy');
    });
  });

  describe('when database is unhealthy', () => {
    it('should return unhealthy status', async () => {
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));
      
      const result = await healthCheckService.performFullHealthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('unhealthy');
      expect(result.checks.database.error).toContain('Database connection failed');
    });
  });

  describe('when some services are degraded', () => {
    it('should return degraded status', async () => {
      mockServices.email.sendTestEmail.mockRejectedValue(new Error('Email service unavailable'));
      mockServices.payment.validateConnection.mockResolvedValue(true);
      
      const result = await healthCheckService.performFullHealthCheck();
      
      expect(result.status).toBe('degraded');
      expect(result.checks.services.email.status).toBe('unhealthy');
      expect(result.checks.services.payment.status).toBe('healthy');
      
      const degradedMessage = GracefulDegradation.getDegradedMessage(result.checks);
      expect(degradedMessage).toContain('email: Email service unavailable');
    });
  });
});
```

### 2. Integration Tests
```typescript
// ✅ CORRECT - End-to-end health check testing
describe('Health Check Integration', () => {
  let app: Express;
  let healthCheckService: HealthCheckService;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Setup Redis
    await setupTestRedis();
    
    // Setup storage
    await setupTestStorage();
    
    // Setup services
    setupTestServices();
    
    // Create app with health check
    app = createApp();
    healthCheckService = new HealthCheckService(
      database,
      redis,
      storage,
      services
    );
  });

  describe('API health endpoint', () => {
    it('should return healthy status when all systems are operational', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      const body = response.body;
      expect(body.status).toBe('healthy');
      expect(body.checks.database.status).toBe('healthy');
      expect(body.checks.redis.status).toBe('healthy');
      expect(body.checks.storage.status).toBe('healthy');
    });

    it('should return unhealthy status when database is down', async () => {
      // Simulate database failure
      await simulateDatabaseFailure();
      
      const response = await request(app)
        .get('/api/health')
        .expect(503);
      
      const body = response.body;
      expect(body.status).toBe('unhealthy');
      expect(body.checks.database.status).toBe('unhealthy');
      expect(body.checks.database.error).toContain('Database connection failed');
    });

    it('should return degraded status when email service is down', async () => {
      // Simulate email service failure
      simulateEmailServiceFailure();
      
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      const body = response.body;
      expect(body.status).toBe('degraded');
      expect(body.checks.services.email.status).toBe('unhealthy');
      expect(body.checks.services.email.error).toContain('Email service unavailable');
    });

    it('should include response time metrics', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      const body = response.body;
      expect(body.responseTime).toMatch(/\d+ms$/);
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{3}\d{2}Z$/);
    });
  });

  describe('Readiness probe', () => {
    it('should return ready when critical systems are ready', async () => {
      const response = request(app)
        .get('/api/health/ready')
        .expect(200);
      
      const body = response.body;
      expect(body.status).toBe('ready');
      expect(body.checks.database.status).toBe('healthy');
      expect(body.checks.redis.status).toBe('healthy');
      expect(body.checks.storage.status).toBe('healthy');
    });

    it('should return not ready when database is not ready', async () => {
      // Simulate database not ready
      simulateDatabaseNotReady();
      
      const response = request(app)
        .get('/api/health/ready')
        .expect(503);
      
      const body = response.body;
      expect(body.status).toBe('not ready');
      expect(body.checks.database.status).toBe('unhealthy');
    });
  });

  describe('Liveness probe', () => {
    it('should return alive status', async () => {
      const response = request(app)
        .get('/api/health/live')
        .expect(200);
      
      const body = response.body;
      expect(body.status).toBe('alive');
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{3}\d{2}Z$/);
    });
  });
});
```

## Performance Considerations

### 1. Fast Health Checks
```typescript
// ✅ CORRECT - Lightweight health checks
export class FastHealthChecker {
  async performQuickHealthCheck(): Promise<QuickHealthStatus> {
    // Use lightweight queries
    const dbQuick = await this.database.query('SELECT COUNT(*) FROM users LIMIT 1');
    const redisQuick = await this.redis.ping();
    
    return {
      database: dbQuick ? 'healthy' : 'unhealthy',
      redis: redisQuick ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }

  async performDatabaseCheck(): Promise<DatabaseHealthStatus> {
    // More thorough database check
    const startTime = Date.now();
    
    try {
      await this.database.query('SELECT COUNT(*) FROM users');
      await this.database.query('SELECT COUNT(*) FROM projects');
      await this.database.query('SELECT COUNT(*) FROM sessions');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          tables: 3,
          connections: this.database.pool.total,
          idle: this.database.pool.idle,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  async performRedisCheck(): Promise<RedisHealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.redis.ping();
      await this.redis.info('memory');
      await this.redis.info('keys');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        details: {
          memory: 'normal',
          keys: '5',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }
}

interface QuickHealthStatus {
  database: 'healthy' | 'unhealthy';
  redis: 'healthy' | 'unhealthy';
  timestamp: string;
}

interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy';
  responseTime?: string;
  lastCheck: string;
  details?: {
    tables?: number;
    connections?: number;
    idle?: number;
  };
}

interface RedisHealthStatus {
  status: 'healthy' | 'unhealthy';
  responseTime?: string;
  lastCheck: string;
  details?: {
    memory?: string;
    keys?: number;
  };
}

// ❌ INCORRECT - Heavy health checks
export function heavyHealthCheck(): Promise<HealthStatus> {
  // Heavy queries that slow down health checks
  const startTime = Date.now();
  
  try {
    // This is too heavy for health checks
    const users = await database.query('SELECT * FROM users');
    const projects = await database.query('SELECT * FROM projects');
    const sessions = await database.query('SELECT * FROM sessions');
    const activities = await database.query('SELECT * FROM activities');
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
}
```

### 2. Caching Health Results
```typescript
// ✅ CORRECT - Cached health checks
export class CachedHealthChecker {
  private cache = new Map<string, { data: HealthCheckResult; expires: number }>();
  private cacheTimeout = 30000; // 30 seconds

  async getHealthStatus(
    level: 'quick' | 'full' | 'liveness' = 'full'
  ): Promise<HealthCheckResult> {
    const cacheKey = `health-${level}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }

    let result: HealthCheckResult;
    
    switch (level) {
      case 'quick':
        result = await this.performQuickHealthCheck();
        break;
      case 'full':
        result = await this.performFullHealthCheck();
        break;
      case 'liveness':
        result = await this.performLivenessCheck();
        break;
      default:
        result = await this.performFullHealthCheck();
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      expires: Date.now() + this.cacheTimeout,
    });

    return result;
  }

  private async performQuickHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    return {
      status: this.determineHealthStatus(checks),
      checks: {
        database: checks[0],
        redis: checks[1],
        storage: checks[2],
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async performFullHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkEmailService(),
      this.checkPaymentService(),
      this.checkNotificationService(),
      this.checkAnalyticsService(),
    ]);

    return {
      status: this.determineHealthStatus(checks),
      checks: {
        database: checks[0],
        redis: checks[1],
        storage: checks[2],
        services: {
          email: checks[3],
          payment: checks[4],
          notification: checks[5],
          analytics: checks[6],
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async performLivenessCheck(): Promise<HealthCheckResult> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      checks: {},
    };
  }

  private determineHealthStatus(
    checks: Record<string, HealthStatus>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks);
    
    if (statuses.every(status => status.status === 'healthy')) {
      return 'healthy';
    }
    
    const failedChecks = statuses.filter(status => status.status === 'unhealthy');
    if (failedChecks.length > 0) {
      return 'unhealthy';
    }
    
    const degradedChecks = statuses.filter(status => status.status === 'degraded');
    if (degradedChecks.length > 0) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: Record<string, HealthStatus>;
  services?: Record<string, HealthStatus>;
}

// ❌ INCORRECT - No caching
export class NoCacheHealthChecker {
  async getHealthStatus(level: string): Promise<HealthCheckResult> {
    // No caching - every request hits the database
    return this.performFullHealthCheck();
  }
}
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't skip health checks**: All containers must have health checks
- **Don't use heavy queries in health checks**: Keep them lightweight and fast
- **Don't return generic success without verification**: Check actual system state
- **Don't ignore error handling**: Health checks must handle failures gracefully
- **Don't use health checks for business logic**: They're for system health only

### 2. Common Mistakes
```typescript
// ❌ WRONG - No health checks
function createApp() {
  const app = express();
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' }); // No actual health verification
  });
}

// ❌ WRONG - Heavy health checks
function createHeavyHealthCheck() {
  app.get('/health', async (req, res) => {
    // Heavy database queries in health check
    const users = await User.findAll();
    const projects = await Project.findAll();
    const reports = await Report.findAll();
    
    res.json({
      status: 'ok',
      counts: {
        users: users.length,
        projects: projects.length,
        reports: reports.length,
      },
    });
  });
}

// ❌ WRONG - No error handling
function createApp() {
  app.get('/health', async (req, res) => {
    try {
      const dbStatus = await checkDatabase();
      const redisStatus = await checkRedis();
      
      res.json({
        status: 'ok',
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected',
      });
    } catch (error) {
      // No error handling - will crash the app
      throw error;
    }
  });
}

// ❌ WRONG - Mixed health checks
function createApp() {
  app.get('/health', async (req, res) => {
    // Mixed health checks - unclear status
    const dbStatus = await checkDatabase();
    const redisStatus = await checkRedis();
    const storageStatus = await checkStorage();
    
    const isHealthy = dbStatus && redisStatus && storageStatus;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'error',
      database: dbStatus ? 'connected' : 'disconnected',
      redis: redisStatus ? 'connected' : 'disconnected',
      storage: storageStatus ? 'connected' : 'disconnected',
    });
  });
}
```

## Compliance Checklist

- [ ] Main health endpoint (`/health`) is implemented
- [ ] Readiness probe (`/health/ready`) is implemented
- [ ] Liveness probe (`/health/live`) is implemented
- [ ] Health checks are lightweight and fast
- [ ] Health checks cover all critical dependencies
- [   - Database connectivity
- [   - Redis connectivity
-   - External service connectivity
- [ ] Health checks return structured response with status and timing
- [ ] Error handling is implemented with graceful degradation
- [ ] Response includes timestamp and version information
- [ ] Docker health checks are properly configured
- - Health check intervals are appropriate (30s)
- - Health check timeouts are reasonable (3-10s)
- - Kubernetes readiness probes are configured
- - Startup probes are configured
- Health checks are tested with unit tests
- - Health checks are tested with integration tests
- - Health check responses follow standard format
- - Health checks include dependency details
- - Health checks implement graceful degradation
- - Health checks are cached appropriately
- - Health checks don't impact performance
- - Health checks are documented
- - Health checks are monitored in production
- - Health checks trigger alerts on failures
- - Health checks have proper error boundaries
- - Health checks respect security requirements
- [ ] Health checks are accessible (screen reader compatible)
- [ ] Health checks work across all environments
- [ ] Health checks support configuration changes
- [ ] Health checks are version-aware
- [ ] Health checks are context-aware
- [ ] Health checks are properly scoped
