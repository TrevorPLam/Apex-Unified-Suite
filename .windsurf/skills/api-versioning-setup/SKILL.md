---
name: api-versioning-setup
description: Complete guide for implementing API versioning with /api/v1/ prefix across OpenAPI spec, Express routes, and generated code for the Apex Unified Suite.
---

# API Versioning Setup Guide

## Overview
This skill guides you through implementing a comprehensive API versioning strategy using `/api/v1/` prefix across the entire Apex Unified Suite stack: OpenAPI specification, Express router configuration, and generated client code.

## Prerequisites
- Access to `lib/api-spec/openapi.yaml`
- Backend API server access (`artifacts/api-server/`)
- Generated code workflow (`Orval` configuration)
- Understanding of current API structure

## Step 1: Update OpenAPI Specification

### Modify Base Path
Edit `lib/api-spec/openapi.yaml`:

```yaml
openapi: 3.0.3
info:
  title: Apex Unified Suite API
  version: 1.0.0
  description: API for the Apex Unified Suite business management platform
servers:
  - url: /api/v1
    description: Version 1 API endpoints
```

### Update All Endpoint Paths
Add `/api/v1` prefix to all existing endpoints:

```yaml
# Before
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy

  /crm/contacts:
    get:
      summary: List contacts
      responses:
        '200':
          description: List of contacts

# After
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy

  /crm/contacts:
    get:
      summary: List contacts
      responses:
        '200':
          description: List of contacts
```

Note: The `/api/v1` prefix is handled by the server configuration, not duplicated in the path definitions.

## Step 2: Configure Express Router

### Create Version Router Structure
Create `artifacts/api-server/src/routes/v1/index.ts`:

```typescript
import { Router } from 'express';
import { healthRouter } from './health.js';
import { crmRouter } from './crm.js';
import { projectsRouter } from './projects.js';
import { documentsRouter } from './documents.js';
import { financeRouter } from './finance.js';
import { assetsRouter } from './assets.js';
import { portalRouter } from './portal.js';
import { analyticsRouter } from './analytics.js';
import { settingsRouter } from './settings.js';

export const v1Router = Router();

// Mount all v1 routes
v1Router.use('/health', healthRouter);
v1Router.use('/crm', crmRouter);
v1Router.use('/projects', projectsRouter);
v1Router.use('/documents', documentsRouter);
v1Router.use('/finance', financeRouter);
v1Router.use('/assets', assetsRouter);
v1Router.use('/portal', portalRouter);
v1Router.use('/analytics', analyticsRouter);
v1Router.use('/settings', settingsRouter);
```

### Update Main Router
Modify `artifacts/api-server/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { v1Router } from './v1/index.js';

export const apiRouter = Router();

// Mount versioned routes
apiRouter.use('/v1', v1Router);

// Legacy support (optional - can be removed for clean v1 start)
// apiRouter.use('/', legacyRouter); // For backward compatibility if needed
```

### Update Server Configuration
Modify `artifacts/api-server/src/server.ts`:

```typescript
import express from 'express';
import { apiRouter } from './routes/index.js';

const app = express();

// API routes with version prefix
app.use('/api', apiRouter);

// Health check at root for load balancers
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export { app };
```

## Step 3: Update Orval Configuration

### Modify Base URL
Edit `lib/api-spec/orval.config.ts`:

```typescript
import { defineConfig } from '@orval/import';

export default defineConfig({
  api: {
    output: {
      mode: 'split',
      target: '../api-client-react/src/generated/',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: '../api-client-react/src/custom-fetch.ts',
          name: 'customFetch',
        },
      },
    },
    input: {
      target: './openapi.yaml',
    },
    hooks: {
      afterAllFilesWrite: 'npm run typecheck',
    },
    definitions: {
      // Add base URL configuration
      baseQuery: {
        // This will be handled by the frontend configuration
      },
    },
  },
});
```

### Update Custom Fetch Client
Ensure `lib/api-client-react/src/custom-fetch.ts` handles the base URL:

```typescript
interface FetchConfig {
  baseUrl?: string;
}

let authTokenGetter: (() => string | undefined) | null = null;

export function setAuthTokenGetter(getter: () => string | undefined) {
  authTokenGetter = getter;
}

export const customFetch = async (
  url: string,
  options?: RequestInit & { config?: FetchConfig }
) => {
  const config = options?.config || {};
  const baseUrl = config.baseUrl || '/api/v1'; // Default to v1
  
  // Ensure URL starts with base path
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  
  const headers = new Headers(options?.headers);
  
  if (authTokenGetter) {
    const token = authTokenGetter();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  return fetch(fullUrl, {
    ...options,
    headers,
  });
};
```

## Step 4: Frontend Configuration

### Update Vite Base Path
Ensure `artifacts/apex-os/vite.config.ts` handles API proxying:

```typescript
export default defineConfig({
  // ... other config
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### Update API Client Usage
The generated hooks will automatically use the correct base URL. Verify in components:

```typescript
import { useListContacts } from '@workspace/api-client-react';

function ContactsPage() {
  const { data: contacts, isLoading, error } = useListContacts();
  // This will call /api/v1/crm/contacts automatically
}
```

## Step 5: Code Generation and Testing

### Regenerate Client Code
```bash
pnpm --filter @workspace/api-spec run codegen
```

### Verify Generated Paths
Check that generated files in `lib/api-client-react/src/generated/` reference correct endpoints:

```typescript
// Should contain paths like:
export const listContacts = () => ({
  method: 'get',
  url: '/crm/contacts', // Base URL handled by custom fetch
  // ...
});
```

### Test Endpoints
```bash
# Start backend server
pnpm --filter @workspace/api-server run dev

# Test endpoints
curl http://localhost:8081/api/v1/health
curl http://localhost:8081/api/v1/crm/contacts
```

## Step 6: Version Management Strategy

### Deprecation Headers
Add deprecation headers for future version transitions:

```typescript
// In v1Router middleware
v1Router.use((req, res, next) => {
  // Add version headers
  res.set('API-Version', '1.0');
  res.set('API-Supported-Versions', '1.0');
  
  // Sunset header for future deprecation
  // res.set('Sunset', '2026-12-31');
  
  next();
});
```

### Environment Configuration
Add versioning configuration to environment:

```typescript
// artifacts/api-server/src/config/versioning.ts
export interface VersioningConfig {
  enabled: boolean;
  defaultVersion: string;
  supportedVersions: string[];
  legacySupport: boolean;
  legacySunsetDate?: string;
}

export const versioningConfig: VersioningConfig = {
  enabled: process.env.API_VERSIONING_ENABLED === 'true',
  defaultVersion: 'v1',
  supportedVersions: ['v1'],
  legacySupport: process.env.API_LEGACY_SUPPORT === 'true',
  legacySunsetDate: process.env.API_LEGACY_SUNSET_DATE,
};
```

## Step 7: Documentation Updates

### Update API Documentation
Update any API documentation to reference the new versioned endpoints:

```markdown
# API Reference

## Base URL
```
https://api.apex-unified-suite.com/api/v1
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check
```
GET /api/v1/health
```

### CRM - Contacts
```
GET /api/v1/crm/contacts
POST /api/v1/crm/contacts
PUT /api/v1/crm/contacts/:id
DELETE /api/v1/crm/contacts/:id
```
```

### Update Developer Guides
Update any developer guides or README files to reference the versioned API structure.

## Step 8: Migration Considerations

### Breaking Changes
When introducing breaking changes in the future:

1. **Create new version**: Add `/api/v2` router
2. **Maintain v1**: Keep v1 endpoints for backward compatibility
3. **Deprecation timeline**: Communicate deprecation timeline
4. **Migration guide**: Provide clear migration instructions

### Version Transition Strategy
```typescript
// Example future v2 setup
export const apiRouter = Router();

apiRouter.use('/v1', v1Router); // Existing version
apiRouter.use('/v2', v2Router); // New version

// Default to latest stable version
apiRouter.use('/', (req, res, next) => {
  // Redirect to latest version or return version selection info
  res.json({
    message: 'Please specify API version',
    versions: ['v1', 'v2'],
    default: 'v2'
  });
});
```

## Step 9: Testing and Validation

### Unit Tests
Test that all routes are properly versioned:

```typescript
// tests/api/versioning.test.ts
import request from 'supertest';
import { app } from '../src/server';

describe('API Versioning', () => {
  test('v1 endpoints respond correctly', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'healthy');
  });

  test('non-versioned endpoints return 404', async () => {
    await request(app)
      .get('/api/health')
      .expect(404);
  });

  test('version headers are present', async () => {
    const response = await request(app)
      .get('/api/v1/health');
    
    expect(response.headers['api-version']).toBe('1.0');
  });
});
```

### Integration Tests
Test frontend-backend integration:

```typescript
// tests/integration/api-client.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListContacts } from '@workspace/api-client-react';

describe('API Client Integration', () => {
  test('uses correct versioned endpoints', async () => {
    const queryClient = new QueryClient();
    
    const { result } = renderHook(() => useListContacts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    // Verify the hook makes requests to /api/v1/crm/contacts
    // This would require mocking fetch to verify the URL
  });
});
```

## Step 10: Monitoring and Observability

### Metrics Collection
Add version-specific metrics:

```typescript
// artifacts/api-server/src/middleware/version-metrics.ts
import { Request, Response, NextFunction } from 'express';

export const versionMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const version = req.path.match(/\/v(\d+)/)?.[1] || 'unknown';
    
    // Log metrics (integrate with your monitoring system)
    console.log({
      method: req.method,
      path: req.path,
      version,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  });
  
  next();
};
```

### Health Check Enhancement
Update health check to include version information:

```typescript
// artifacts/api-server/src/routes/v1/health.ts
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    apiVersion: 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});
```

## Common Issues and Solutions

### CORS Issues
If frontend can't access versioned API, update CORS configuration:

```typescript
// artifacts/api-server/src/middleware/cors.ts
import cors from 'cors';

export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Path Matching Issues
Ensure Express route order is correct - more specific routes first:

```typescript
// Correct order
app.use('/api/v1', v1Router);
app.use('/api', apiRouter); // General API routes
app.use('/', defaultRouter); // Default routes
```

### Generated Code Issues
If generated code doesn't use correct base URL:
1. Verify Orval configuration
2. Check custom fetch implementation
3. Regenerate client code
4. Clear TypeScript cache

## Future Considerations

### Multi-Version Support
Plan for future versions:
- Separate router files for each version
- Shared middleware and utilities
- Clear deprecation strategy
- Migration tools and documentation

### API Gateway Integration
Consider API gateway for advanced versioning:
- Request routing based on version
- Rate limiting per version
- Analytics and monitoring
- Request/response transformation

This skill ensures consistent API versioning across the entire Apex Unified Suite, providing a solid foundation for future API evolution and maintenance.
