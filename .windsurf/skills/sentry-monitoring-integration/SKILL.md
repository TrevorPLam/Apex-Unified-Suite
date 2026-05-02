---
name: sentry-monitoring-integration
description: Complete Sentry monitoring integration with React ErrorBoundary and Express error handler, including DSN configuration, error filtering, and performance monitoring
---

# Sentry Monitoring Integration Skill

## Purpose
Implement comprehensive Sentry monitoring across both frontend (React) and backend (Express) with proper error boundaries, performance tracking, and production-ready configuration.

## Architecture Overview

### Monitoring Strategy
- **Frontend**: React ErrorBoundary + automatic error capture
- **Backend**: Express error handler + structured logging
- **Performance**: Transaction tracking for API calls and user interactions
- **Release Management**: Automatic version tracking with git commits

## Frontend Implementation

### 1. Sentry Configuration
```typescript
// artifacts/apex-os/src/lib/sentry.ts
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;
  const release = import.meta.env.VITE_APP_VERSION || '1.0.0';

  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    
    // Performance monitoring
    integrations: [
      new BrowserTracing(),
      new Integrations.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Performance options
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known harmless errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
        
        if (error?.value?.includes('Non-Error promise rejection')) {
          return null;
        }
      }
      
      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'apex-os',
          version: release,
          environment,
        },
      };
      
      return event;
    },
    
    // Custom tags
    tags: {
      component: 'frontend',
      framework: 'react',
    },
  });
}

export function setUserContext(user: { id: string; email: string; role: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export function addBreadcrumb(category: string, message: string, level: 'info' | 'warn' | 'error' = 'info', data?: any) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
  });
}

export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
}

export function captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info', context?: any) {
  Sentry.captureMessage(message, level, {
    contexts: { custom: context },
  });
}
```

### 2. React Error Boundary
```typescript
// artifacts/apex-os/src/components/ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: any) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error, errorInfo });
    
    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Add breadcrumb for debugging
    Sentry.addBreadcrumb({
      category: 'error',
      message: 'React Error Boundary caught error',
      level: 'error',
      data: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          
          <p className="text-gray-600 mb-6">
            We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
          </p>
          
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700">
              {error.message}
            </div>
          </details>
          
          <div className="space-y-3">
            <Button onClick={retry} className="w-full">
              Try again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. Performance Monitoring
```typescript
// artifacts/apex-os/src/lib/performance.ts
import * as Sentry from '@sentry/react';

export function startTransaction(name: string, operation: string) {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
}

export function setTransactionName(name: string) {
  const transaction = Sentry.getCurrentHub().getScope().getTransaction();
  if (transaction) {
    transaction.setName(name);
  }
}

export function addPerformanceBreadcrumb(category: string, message: string, data?: any) {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
}

// API call wrapper for performance tracking
export function withPerformanceTracking<T>(
  apiCall: () => Promise<T>,
  operation: string,
  description: string
): Promise<T> {
  const transaction = startTransaction(description, operation);
  
  return apiCall()
    .then((result) => {
      transaction.setStatus('ok');
      addPerformanceBreadcrumb('api', `${operation} completed`, { success: true });
      return result;
    })
    .catch((error) => {
      transaction.setStatus('internal_error');
      addPerformanceBreadcrumb('api', `${operation} failed`, { 
        success: false, 
        error: error.message 
      });
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}

// React Query performance monitoring
export function createQueryPerformanceHook() {
  return {
    onSuccess: (data: any, variables: any, context: any) => {
      addPerformanceBreadcrumb('query', 'Query completed', {
        queryKey: context.queryKey,
        dataCount: Array.isArray(data) ? data.length : 1,
      });
    },
    onError: (error: any, variables: any, context: any) => {
      addPerformanceBreadcrumb('query', 'Query failed', {
        queryKey: context.queryKey,
        error: error.message,
      });
    },
  };
}
```

### 4. Integration with Main App
```typescript
// artifacts/apex-os/src/App.tsx
import React from 'react';
import { Router, Route } from 'wouter';
import { initSentry, setUserContext, clearUserContext } from './lib/sentry';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';

// Initialize Sentry
initSentry();

export function App() {
  const { user, isLoading } = useAuth();

  // Update Sentry user context when auth state changes
  React.useEffect(() => {
    if (user) {
      setUserContext({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } else {
      clearUserContext();
    }
  }, [user]);

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Route path="/" component={Dashboard} />
        <Route path="/crm" component={CRMPage} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/finance" component={FinancePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFoundPage} />
      </Router>
    </ErrorBoundary>
  );
}
```

## Backend Implementation

### 1. Sentry Configuration
```typescript
// artifacts/api-server/src/lib/sentry.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Integrations } from '@sentry/tracing';
import { Express } from 'express';

export function initSentry(app: Express) {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.GIT_COMMIT || '1.0.0';

  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    
    // Performance monitoring
    integrations: [
      new Integrations.Http({ tracing: true }),
      new Integrations.Express({ app }),
      nodeProfilingIntegration(),
    ],
    
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known harmless errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('ECONNRESET')) {
          return null;
        }
        
        if (error?.value?.includes('ETIMEDOUT')) {
          return null;
        }
      }
      
      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'api-server',
          version: release,
          environment,
          nodeVersion: process.version,
        },
      };
      
      return event;
    },
    
    // Custom tags
    tags: {
      component: 'backend',
      framework: 'express',
    },
  });
}

export function setUserContext(user: { id: string; email: string; role: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export function addBreadcrumb(category: string, message: string, level: 'info' | 'warn' | 'error' = 'info', data?: any) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
  });
}

export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
}

export function captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info', context?: any) {
  Sentry.captureMessage(message, level, {
    contexts: { custom: context },
  });
}

export function startTransaction(name: string, operation: string) {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
}
```

### 2. Express Error Handler
```typescript
// artifacts/api-server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { captureException, addBreadcrumb } from '../lib/sentry';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add breadcrumb for error context
  addBreadcrumb('error', 'Error occurred in request', 'error', {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Send to Sentry for 5xx errors
  if (error.statusCode >= 500 || !error.statusCode) {
    captureException(error, {
      contexts: {
        request: {
          url: req.url,
          method: req.method,
          headers: req.headers,
          body: req.body,
        },
        user: (req as any).user ? {
          id: (req as any).user.id,
          email: (req as any).user.email,
        } : undefined,
      },
    });
  }

  // Log error locally
  console.error('Error:', error);

  // Determine status code
  const statusCode = error.statusCode || 500;
  const isClientError = statusCode < 500;

  // Prepare error response
  const errorResponse = {
    error: isClientError ? error.message : 'Internal server error',
    code: (error as AppError).code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: (error as AppError).details,
    }),
  };

  res.status(statusCode).json(errorResponse);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
```

### 3. Request Tracking Middleware
```typescript
// artifacts/api-server/src/middleware/requestTracking.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';

export function requestTracking(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  // Start Sentry transaction
  const transaction = Sentry.startTransaction({
    name: `${req.method} ${req.route?.path || req.path}`,
    op: 'http.server',
    tags: {
      method: req.method,
      route: req.route?.path || req.path,
    },
  });

  // Add request to Sentry context
  Sentry.setContext('request', {
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
  });

  // Add breadcrumb
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${req.method} ${req.path}`,
    level: 'info',
    data: {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    },
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    // Set transaction status based on response code
    const statusCode = res.statusCode;
    if (statusCode >= 400) {
      transaction.setStatus('internal_error');
    } else {
      transaction.setStatus('ok');
    }

    // Add response breadcrumb
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.path} - ${res.statusCode}`,
      level: statusCode >= 400 ? 'error' : 'info',
      data: {
        statusCode,
        responseSize: chunk ? chunk.length : 0,
      },
    });

    // Finish transaction
    transaction.finish();

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}
```

### 4. Integration with Main App
```typescript
// artifacts/api-server/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initSentry } from './lib/sentry';
import { requestTracking } from './middleware/requestTracking';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Initialize Sentry
initSentry(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request tracking
app.use(requestTracking);

// Health check (no Sentry tracking)
app.get('/healthz', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', require('./routes'));

// Error handling (must be last)
app.use(errorHandler);

export default app;
```

## Environment Configuration

### 1. Frontend Environment Variables
```bash
# artifacts/apex-os/.env.example
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

### 2. Backend Environment Variables
```bash
# artifacts/api-server/.env.example
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production
GIT_COMMIT=your-git-commit-hash
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 3. Docker Environment Variables
```yaml
# docker-compose.prod.yml
services:
  frontend:
    environment:
      - VITE_SENTRY_DSN=${SENTRY_DSN}
      - VITE_APP_VERSION=${APP_VERSION}
      - VITE_ENVIRONMENT=production

  backend:
    environment:
      - SENTRY_DSN=${SENTRY_DSN}
      - NODE_ENV=production
      - GIT_COMMIT=${GIT_COMMIT}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
```

## Testing Implementation

### 1. Frontend Error Boundary Tests
```typescript
// artifacts/apex-os/src/components/__tests__/ErrorBoundary.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock Sentry
jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    const ChildComponent = () => <div>Child component</div>;
    
    render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('should catch and display error when child throws', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should call Sentry when error occurs', () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    const { captureException } = require('@sentry/react');

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: expect.objectContaining({
          react: expect.objectContaining({
            componentStack: expect.any(String),
          }),
        }),
      })
    );
  });

  it('should retry when retry button is clicked', () => {
    let shouldThrow = true;
    const ThrowErrorComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered component</div>;
    };

    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    // Should show error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry button
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try again'));

    // Should show recovered component
    expect(screen.getByText('Recovered component')).toBeInTheDocument();
  });
});
```

### 2. Backend Error Handler Tests
```typescript
// artifacts/api-server/src/__tests__/errorHandler.test.ts
import request from 'supertest';
import { app } from '../app';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

describe('Error Handler', () => {
  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: expect.any(String),
      code: 'VALIDATION_ERROR',
      timestamp: expect.any(String),
    });
  });

  it('should handle not found errors', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.body).toMatchObject({
      error: expect.any(String),
      code: 'NOT_FOUND',
      timestamp: expect.any(String),
    });
  });

  it('should include request ID in error response', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body.requestId).toBeDefined();
  });

  it('should include stack trace in development', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    if (process.env.NODE_ENV === 'development') {
      expect(response.body.stack).toBeDefined();
    } else {
      expect(response.body.stack).toBeUndefined();
    }
  });
});
```

## Performance Monitoring Examples

### 1. API Performance Tracking
```typescript
// artifacts/api-server/src/routes/crm/contacts.ts
import { Router } from 'express';
import { startTransaction } from '../lib/sentry';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const transaction = startTransaction('list_contacts', 'http.server');
  
  try {
    // Database query
    const contacts = await db.select().from(contactsTable);
    
    // Set transaction data
    transaction.setData('contact_count', contacts.length);
    
    res.json({ data: contacts });
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}));

export default router;
```

### 2. Frontend Performance Tracking
```typescript
// artifacts/apex-os/src/hooks/useContacts.ts
import { useQuery } from '@tanstack/react-query';
import { withPerformanceTracking } from '../lib/performance';
import { getContacts } from '../api/contacts';

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: () => withPerformanceTracking(
      () => getContacts(),
      'fetch_contacts',
      'Fetch contacts list'
    ),
    ...createQueryPerformanceHook(),
  });
}
```

## Monitoring Dashboard Setup

### 1. Sentry Dashboard Configuration
- **Error Tracking**: Monitor frontend and backend errors
- **Performance**: Track API response times and user interactions
- **Release Tracking**: Monitor errors by version
- **User Context**: Track errors by user and role

### 2. Key Metrics to Monitor
- Error rate by endpoint
- API response times (P95, P99)
- User crash rate
- Database query performance
- Authentication failures

### 3. Alert Configuration
- **Critical**: 5xx errors > 5% of requests
- **Warning**: Error rate increase > 50% over 1 hour
- **Info**: New error patterns detected

## Verification Commands

```bash
# Test Sentry integration
curl -f http://localhost:8081/api/healthz

# Trigger error for testing
curl -X POST http://localhost:8081/api/test/error

# Check Sentry dashboard
open https://sentry.io/your-org/project/

# Verify error tracking
grep -r "Sentry\|sentry" artifacts/apex-os/src/
grep -r "Sentry\|sentry" artifacts/api-server/src/

# Test error boundary
# Navigate to app and trigger an error
```

This skill provides comprehensive Sentry monitoring integration with proper error boundaries, performance tracking, and production-ready configuration for both frontend and backend applications.
