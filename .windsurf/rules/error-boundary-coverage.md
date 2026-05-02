---
trigger: glob
globs: **/*.tsx
description: Comprehensive error boundary coverage for all components with proper fallbacks and error reporting
---

# Error Boundary Coverage

## Core Principle

### Complete Error Isolation
Every component tree must be wrapped in error boundaries to prevent cascading failures and provide graceful degradation. Error boundaries should catch, log, and recover from errors in a user-friendly way.

### Error Boundary Strategy
- **Route-level boundaries**: Wrap each route/page
- **Feature-level boundaries**: Wrap major feature components
- **Component-level boundaries**: Wrap complex or risky components
- **Async boundaries**: Handle promise rejections and async errors

## Required Implementation Pattern

### 1. Route-Level Error Boundaries
```typescript
// ✅ CORRECT - Route boundary with comprehensive error handling
import { ErrorBoundary } from 'react-error-boundary';

function AppRoutes() {
  return (
    <Router>
      <ErrorBoundary
        FallbackComponent={RouteErrorFallback}
        onError={(error, errorInfo) => {
          console.error('Route error:', error, errorInfo);
          // Log to error tracking service
          logErrorToService(error, errorInfo, 'route');
        }}
        resetKeys={['location']}
      >
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

function RouteErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          We encountered an error while loading this page. Please try again.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Go Home
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ❌ INCORRECT - No error boundary
function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </Router>
  );
}
```

### 2. Feature-Level Error Boundaries
```typescript
// ✅ CORRECT - Feature boundary with specific error handling
function UserManagementFeature() {
  return (
    <ErrorBoundary
      FallbackComponent={UserManagementErrorFallback}
      onError={(error, errorInfo) => {
        console.error('User management error:', error, errorInfo);
        logErrorToService(error, errorInfo, 'user-management');
        // Show user-friendly notification
        showErrorNotification('User management feature is temporarily unavailable');
      }}
      resetKeys={['user-management']}
    >
      <div className="user-management">
        <UserList />
        <UserForm />
        <UserPermissions />
      </div>
    </ErrorBoundary>
  );
}

function UserManagementErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
        <h3 className="text-sm font-medium text-yellow-800">
          User Management Issue
        </h3>
      </div>
      <p className="text-sm text-yellow-700 mt-1">
        We're having trouble loading the user management features.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 text-sm text-yellow-800 underline hover:no-underline"
      >
        Retry
      </button>
    </div>
  );
}
```

### 3. Component-Level Error Boundaries
```typescript
// ✅ CORRECT - Component boundary for risky operations
function UserProfile({ userId }: { userId: string }) {
  return (
    <ErrorBoundary
      FallbackComponent={UserProfileErrorFallback}
      onError={(error, errorInfo) => {
        console.error('User profile error:', error, errorInfo);
        logErrorToService(error, errorInfo, 'user-profile', { userId });
      }}
      resetKeys={[userId]}
    >
      <ProfileHeader userId={userId} />
      <ProfileContent userId={userId} />
      <ProfileActivity userId={userId} />
    </ErrorBoundary>
  );
}

function UserProfileErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserX className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-sm font-medium text-red-800">
            Profile Unavailable
          </span>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="text-sm text-red-600 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

## Async Error Handling

### 1. Promise Rejection Boundaries
```typescript
// ✅ CORRECT - Async error boundary for API calls
function AsyncDataComponent() {
  return (
    <AsyncErrorBoundary
      FallbackComponent={AsyncErrorFallback}
      onError={(error) => {
        console.error('Async error:', error);
        logErrorToService(error, undefined, 'async-operation');
      }}
    >
      <DataLoader />
    </AsyncErrorBoundary>
  );
}

function AsyncErrorFallback({ error, reset }: AsyncErrorFallbackProps) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center">
        <RefreshCw className="w-5 h-5 text-orange-600 mr-2" />
        <span className="text-sm font-medium text-orange-800">
          Loading Error
        </span>
      </div>
      <p className="text-sm text-orange-700 mt-1">
        Failed to load data. Please check your connection and try again.
      </p>
      <button
        onClick={reset}
        className="mt-2 text-sm text-orange-600 underline hover:no-underline"
      >
        Retry
      </button>
    </div>
  );
}

// Custom AsyncErrorBoundary component
function AsyncErrorBoundary({ 
  children, 
  FallbackComponent, 
  onError 
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={onError}
      resetKeys={['async']}
    >
      <AsyncErrorProvider>
        {children}
      </AsyncErrorProvider>
    </ErrorBoundary>
  );
}
```

### 2. Query Error Boundaries
```typescript
// ✅ CORRECT - Query-specific error boundary
function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={QueryErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Query error:', error, errorInfo);
        logErrorToService(error, errorInfo, 'query');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function QueryErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center">
        <Database className="w-5 h-5 text-blue-600 mr-2" />
        <span className="text-sm font-medium text-blue-800">
          Data Loading Error
        </span>
      </div>
      <p className="text-sm text-blue-700 mt-1">
        Unable to load data from the server. Please try again later.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 text-sm text-blue-600 underline hover:no-underline"
      >
        Retry
      </button>
    </div>
  );
}

// Usage with React Query
function UserList() {
  return (
    <QueryErrorBoundary>
      <UserListComponent />
    </QueryErrorBoundary>
  );
}
```

## Error Reporting and Logging

### 1. Centralized Error Logging
```typescript
// ✅ CORRECT - Centralized error logging service
class ErrorReportingService {
  static logError(
    error: Error,
    errorInfo?: ErrorInfo,
    context?: string,
    metadata?: Record<string, any>
  ) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: getCurrentUserId(), // Get from auth context
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData);
    }

    // Send to error tracking service
    this.sendToErrorService(errorData);
  }

  private static async sendToErrorService(errorData: any) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

// Usage in error boundaries
function onError(error: Error, errorInfo: ErrorInfo, context: string) {
  ErrorReportingService.logError(error, errorInfo, context);
}
```

### 2. Error Context Provider
```typescript
// ✅ CORRECT - Error context for global error handling
interface ErrorContextValue {
  reportError: (error: Error, context?: string) => void;
  clearError: () => void;
  globalError: Error | null;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [globalError, setGlobalError] = useState<Error | null>(null);

  const reportError = useCallback((error: Error, context?: string) => {
    setGlobalError(error);
    ErrorReportingService.logError(error, undefined, context);
  }, []);

  const clearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ reportError, clearError, globalError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorReporting() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorReporting must be used within ErrorProvider');
  }
  return context;
}
```

## Recovery Strategies

### 1. Smart Reset Keys
```typescript
// ✅ CORRECT - Smart reset keys for targeted recovery
function UserPage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary
      FallbackComponent={UserPageErrorFallback}
      onError={(error, errorInfo) => {
        logErrorToService(error, errorInfo, 'user-page', { userId });
      }}
      resetKeys={['user-page', userId]} // Reset when userId changes
    >
      <UserProfile userId={userId} />
      <UserActivity userId={userId} />
      <UserSettings userId={userId} />
    </ErrorBoundary>
  );
}

// ❌ INCORRECT - No reset keys, won't recover on prop changes
function UserPage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary
      FallbackComponent={UserPageErrorFallback}
      onError={(error, errorInfo) => {
        logErrorToService(error, errorInfo, 'user-page', { userId });
      }}
    >
      <UserProfile userId={userId} />
      <UserActivity userId={userId} />
      <UserSettings userId={userId} />
    </ErrorBoundary>
  );
}
```

### 2. Progressive Degradation
```typescript
// ✅ CORRECT - Progressive degradation with fallbacks
function DashboardPage() {
  return (
    <ErrorBoundary
      FallbackComponent={DashboardMinimalFallback}
      onError={(error, errorInfo) => {
        logErrorToService(error, errorInfo, 'dashboard');
      }}
      resetKeys={['dashboard']}
    >
      <div className="dashboard">
        <ErrorBoundary
          FallbackComponent={ChartsFallback}
          resetKeys={['charts']}
        >
          <DashboardCharts />
        </ErrorBoundary>
        
        <ErrorBoundary
          FallbackComponent={MetricsFallback}
          resetKeys={['metrics']}
        >
          <DashboardMetrics />
        </ErrorBoundary>
        
        <ErrorBoundary
          FallbackComponent={ActivityFallback}
          resetKeys={['activity']}
        >
          <RecentActivity />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

function DashboardMinimalFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="dashboard-minimal">
      <h1>Dashboard</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Some dashboard features are temporarily unavailable.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="mt-2 text-sm text-yellow-600 underline hover:no-underline"
        >
          Try Again
        </button>
      </div>
      {/* Show minimal dashboard content */}
      <MinimalDashboardContent />
    </div>
  );
}
```

## Testing Error Boundaries

### 1. Component Testing
```typescript
// ✅ CORRECT - Testing error boundary behavior
describe('UserPage Error Boundary', () => {
  it('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary FallbackComponent={UserPageErrorFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('should recover on reset', async () => {
    let shouldThrow = true;
    
    const ErrorComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    const { getByRole, getByText } = render(
      <ErrorBoundary FallbackComponent={UserPageErrorFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    // Initially shows error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the error and reset
    shouldThrow = false;
    fireEvent.click(getByRole('button', { name: 'Try Again' }));

    // Should show success
    expect(getByText('Success')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing
```typescript
// ✅ CORRECT - Integration testing with real components
describe('Dashboard Error Recovery', () => {
  it('should recover from component errors', async () => {
    render(<DashboardPage />);

    // Simulate error in charts component
    const chartsError = new Error('Charts API failed');
    fireEvent.error(screen.getByTestId('dashboard-charts'), chartsError);

    // Should show charts fallback
    expect(screen.getByText('Charts temporarily unavailable')).toBeInTheDocument();

    // Other components should still work
    expect(screen.getByTestId('dashboard-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### 1. Lazy Error Boundaries
```typescript
// ✅ CORRECT - Lazy loading heavy error boundaries
const HeavyErrorBoundary = lazy(() => import('./HeavyErrorBoundary'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyErrorBoundary>
        <AppContent />
      </HeavyErrorBoundary>
    </Suspense>
  );
}
```

### 2. Error Boundary Memoization
```typescript
// ✅ CORRECT - Memoized error boundary to prevent re-renders
const MemoizedErrorBoundary = memo(ErrorBoundary);

function UserComponent({ userId }: { userId: string }) {
  return (
    <MemoizedErrorBoundary
      FallbackComponent={UserErrorFallback}
      resetKeys={[userId]}
    >
      <UserProfile userId={userId} />
    </MemoizedErrorBoundary>
  );
}
```

## Accessibility Considerations

### 1. Screen Reader Support
```typescript
// ✅ CORRECT - Accessible error fallbacks
function AccessibleErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div 
      role="alert" 
      aria-live="polite"
      className="bg-red-50 border border-red-200 rounded-lg p-4"
    >
      <div className="flex items-center">
        <AlertTriangle 
          className="w-5 h-5 text-red-600 mr-2" 
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold text-red-800">
          Error Occurred
        </h2>
      </div>
      <p className="text-red-700 mt-2">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="mt-3 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
        aria-label="Retry loading content"
      >
        Try Again
      </button>
    </div>
  );
}
```

### 2. Keyboard Navigation
```typescript
// ✅ CORRECT - Keyboard-accessible error recovery
function KeyboardErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const handleRetry = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      resetErrorBoundary();
    }
  };

  return (
    <div className="error-fallback">
      <button
        onClick={resetErrorBoundary}
        onKeyDown={handleRetry}
        tabIndex={0}
        className="retry-button"
      >
        Try Again
      </button>
    </div>
  );
}
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't ignore error boundaries**: Every component tree needs protection
- **Don't use generic fallbacks**: Provide context-specific error messages
- **Don't forget error logging**: Always log errors for debugging
- **Don't break accessibility**: Ensure error states are accessible
- **Don't skip reset keys**: Components won't recover without proper reset keys

### 2. Common Mistakes
```typescript
// ❌ WRONG - No error logging
function BadErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={GenericFallback}>
      {children}
    </ErrorBoundary>
  );
}

// ❌ WRONG - Generic fallback for all errors
function GenericFallback() {
  return <div>Something went wrong</div>;
}

// ❌ WRONG - No reset keys
function NoResetBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}

// ❌ WRONG - Not accessible
function InaccessibleFallback() {
  return (
    <div onClick={resetErrorBoundary}>
      Error occurred, click to retry
    </div>
  );
}
```

## Compliance Checklist

- [ ] All routes wrapped in error boundaries
- [ ] Major features have feature-level boundaries
- [ ] Complex components have component-level boundaries
- [ ] Async operations have async error boundaries
- [ ] Errors are logged to centralized service
- [ ] Error fallbacks are context-specific
- [ ] Reset keys are properly configured
- [ ] Error states are accessible
- [ ] Progressive degradation is implemented
- [ ] Error recovery is tested
- [ ] Performance considerations are addressed
- [ ] Error boundaries are memoized where appropriate
- [ ] User-friendly error messages are provided
- [ ] Development error details are shown
- [ ] Error reporting includes context and metadata
