---
name: protected-route-auth-guard
description: Implementation of dual authentication system with firm JWT guards and portal magic-link authentication, including localStorage separation and redirect logic
---

# Protected Route Auth Guard Skill

## Purpose
Implement comprehensive route protection with two distinct authentication systems: firm JWT authentication for internal users and portal magic-link authentication for external clients.

## Architecture Overview

### Authentication Systems
1. **Firm Auth** - JWT-based for internal users (employees, managers)
2. **Portal Auth** - Magic-link based for external clients

### Key Separation Points
- Different localStorage keys
- Separate auth contexts
- Distinct route guards
- Independent token validation

## Implementation Structure

### 1. Authentication Contexts

#### Firm Authentication Context
```typescript
// artifacts/apex-os/src/contexts/FirmAuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'sonner';

interface FirmUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  permissions: string[];
  tenantId: string;
}

interface FirmAuthState {
  user: FirmUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

interface FirmAuthContextType extends FirmAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const FirmAuthContext = createContext<FirmAuthContextType | undefined>(undefined);

// localStorage keys
const FIRM_AUTH_KEYS = {
  TOKEN: 'firm_auth_token',
  REFRESH_TOKEN: 'firm_refresh_token',
  USER: 'firm_user_data',
};

function firmAuthReducer(state: FirmAuthState, action: any): FirmAuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'RESTORE_FROM_STORAGE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function FirmAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(firmAuthReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const restoreAuth = () => {
      try {
        const token = localStorage.getItem(FIRM_AUTH_KEYS.TOKEN);
        const userStr = localStorage.getItem(FIRM_AUTH_KEYS.USER);
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch({
            type: 'RESTORE_FROM_STORAGE',
            payload: { token, user },
          });
        } else {
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
        // Clear corrupted data
        localStorage.removeItem(FIRM_AUTH_KEYS.TOKEN);
        localStorage.removeItem(FIRM_AUTH_KEYS.USER);
      }
    };

    restoreAuth();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { user, token, refreshToken } = await response.json();

      // Store in localStorage
      localStorage.setItem(FIRM_AUTH_KEYS.TOKEN, token);
      localStorage.setItem(FIRM_AUTH_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(FIRM_AUTH_KEYS.USER, JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      toast.success('Welcome back!');
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error('Login failed. Please check your credentials.');
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(FIRM_AUTH_KEYS.TOKEN);
    localStorage.removeItem(FIRM_AUTH_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(FIRM_AUTH_KEYS.USER);

    dispatch({ type: 'LOGOUT' });
    toast.info('You have been logged out');
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem(FIRM_AUTH_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { token: newToken, refreshToken: newRefreshToken } = await response.json();

      localStorage.setItem(FIRM_AUTH_KEYS.TOKEN, newToken);
      localStorage.setItem(FIRM_AUTH_KEYS.REFRESH_TOKEN, newRefreshToken);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: state.user, token: newToken },
      });
    } catch (error) {
      logout();
      throw error;
    }
  };

  return (
    <FirmAuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </FirmAuthContext.Provider>
  );
}

export function useFirmAuth() {
  const context = useContext(FirmAuthContext);
  if (context === undefined) {
    throw new Error('useFirmAuth must be used within a FirmAuthProvider');
  }
  return context;
}
```

#### Portal Authentication Context
```typescript
// artifacts/apex-os/src/contexts/PortalAuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'sonner';

interface PortalClient {
  id: string;
  name: string;
  email: string;
  company: string;
  portalAccess: {
    canViewInvoices: boolean;
    canViewProjects: boolean;
    canViewDocuments: boolean;
  };
}

interface PortalAuthState {
  client: PortalClient | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  magicToken: string | null;
}

interface PortalAuthContextType extends PortalAuthState {
  authenticateWithMagicLink: (token: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

// localStorage keys - separate from firm auth
const PORTAL_AUTH_KEYS = {
  MAGIC_TOKEN: 'portal_magic_token',
  CLIENT_DATA: 'portal_client_data',
};

function portalAuthReducer(state: PortalAuthState, action: any): PortalAuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        client: action.payload.client,
        magicToken: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        client: null,
        magicToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        client: null,
        magicToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'RESTORE_FROM_STORAGE':
      return {
        ...state,
        client: action.payload.client,
        magicToken: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(portalAuthReducer, {
    client: null,
    magicToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const restoreAuth = () => {
      try {
        const token = localStorage.getItem(PORTAL_AUTH_KEYS.MAGIC_TOKEN);
        const clientStr = localStorage.getItem(PORTAL_AUTH_KEYS.CLIENT_DATA);
        
        if (token && clientStr) {
          const client = JSON.parse(clientStr);
          dispatch({
            type: 'RESTORE_FROM_STORAGE',
            payload: { token, client },
          });
        } else {
          dispatch({ type: 'AUTH_FAILURE' });
        }
      } catch (error) {
        console.error('Failed to restore portal auth state:', error);
        dispatch({ type: 'AUTH_FAILURE' });
        localStorage.removeItem(PORTAL_AUTH_KEYS.MAGIC_TOKEN);
        localStorage.removeItem(PORTAL_AUTH_KEYS.CLIENT_DATA);
      }
    };

    restoreAuth();
  }, []);

  const authenticateWithMagicLink = async (token: string) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await fetch('/api/portal/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Magic link authentication failed');
      }

      const { client, magicToken: validatedToken } = await response.json();

      localStorage.setItem(PORTAL_AUTH_KEYS.MAGIC_TOKEN, validatedToken);
      localStorage.setItem(PORTAL_AUTH_KEYS.CLIENT_DATA, JSON.stringify(client));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { client, token: validatedToken },
      });

      toast.success('Welcome to your portal!');
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      toast.error('Authentication failed. Please request a new magic link.');
      throw error;
    }
  };

  const requestMagicLink = async (email: string) => {
    try {
      const response = await fetch('/api/portal/auth/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      toast.success('Magic link sent to your email!');
    } catch (error) {
      toast.error('Failed to send magic link. Please try again.');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(PORTAL_AUTH_KEYS.MAGIC_TOKEN);
    localStorage.removeItem(PORTAL_AUTH_KEYS.CLIENT_DATA);

    dispatch({ type: 'LOGOUT' });
    toast.info('You have been logged out of the portal');
  };

  return (
    <PortalAuthContext.Provider
      value={{
        ...state,
        authenticateWithMagicLink,
        requestMagicLink,
        logout,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  }
  return context;
}
```

### 2. Route Guards

#### Firm Auth Guard
```typescript
// artifacts/apex-os/src/components/guards/FirmAuthGuard.tsx
import React from 'react';
import { Navigate, useLocation } from 'wouter';
import { useFirmAuth } from '@/contexts/FirmAuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

interface FirmAuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'employee';
  requiredPermissions?: string[];
}

export function FirmAuthGuard({ 
  children, 
  requiredRole,
  requiredPermissions = []
}: FirmAuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useFirmAuth();
  const [location] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          message: `This page requires ${requiredRole} role access` 
        }} 
        replace 
      />
    );
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ 
            message: 'Insufficient permissions to access this page' 
          }} 
          replace 
        />
      );
    }
  }

  return <>{children}</>;
}
```

#### Portal Auth Guard
```typescript
// artifacts/apex-os/src/components/guards/PortalAuthGuard.tsx
import React from 'react';
import { Navigate, useLocation } from 'wouter';
import { usePortalAuth } from '@/contexts/PortalAuthContext';
import { PageSkeleton } from '@/components/PageSkeleton';

interface PortalAuthGuardProps {
  children: React.ReactNode;
  requiredAccess?: keyof PortalClient['portalAccess'];
}

export function PortalAuthGuard({ 
  children, 
  requiredAccess 
}: PortalAuthGuardProps) {
  const { client, isAuthenticated, isLoading } = usePortalAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated || !client) {
    return (
      <Navigate 
        to="/portal/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check specific portal access requirements
  if (requiredAccess && !client.portalAccess[requiredAccess]) {
    return (
      <Navigate 
        to="/portal/unauthorized" 
        state={{ 
          message: `You don't have access to this portal feature` 
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
}
```

### 3. Login Pages

#### Firm Login Page
```typescript
// artifacts/apex-os/src/pages/login.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { useFirmAuth } from '@/contexts/FirmAuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useFirmAuth();
  const [location] = useLocation();
  const [, navigate] = useNavigate();

  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### Portal Login Page
```typescript
// artifacts/apex-os/src/pages/portal/login.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { usePortalAuth } from '@/contexts/PortalAuthContext';

export function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');
  const { authenticateWithMagicLink, requestMagicLink, isLoading } = usePortalAuth();
  const [location] = useLocation();
  const [, navigate] = useNavigate();

  const from = location.state?.from || '/portal/dashboard';

  // Check for magic link token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      authenticateWithMagicLink(token)
        .then(() => navigate(from, { replace: true }))
        .catch(() => setError('Invalid or expired magic link'));
    }
  }, [authenticateWithMagicLink, navigate, from]);

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await requestMagicLink(email);
      setMagicLinkSent(true);
    } catch (err) {
      setError('Failed to send magic link');
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Magic link sent! Check your email.
          </div>
          <p className="text-gray-600">
            Click the link in your email to access your portal.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Send another link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Client Portal Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a magic link
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRequestMagicLink}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indindigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4. Route Configuration

#### App Router Setup
```typescript
// artifacts/apex-os/src/App.tsx
import { Router, Route } from 'wouter';
import { FirmAuthProvider } from '@/contexts/FirmAuthContext';
import { PortalAuthProvider } from '@/contexts/PortalAuthContext';
import { FirmAuthGuard } from '@/components/guards/FirmAuthGuard';
import { PortalAuthGuard } from '@/components/guards/PortalAuthGuard';

export function App() {
  return (
    <Router>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/portal/login" component={PortalLoginPage} />
      
      {/* Firm protected routes */}
      <Route path="/dashboard">
        <FirmAuthProvider>
          <FirmAuthGuard>
            <DashboardPage />
          </FirmAuthGuard>
        </FirmAuthProvider>
      </Route>
      
      <Route path="/crm">
        <FirmAuthProvider>
          <FirmAuthGuard requiredRole="manager">
            <CRMPage />
          </FirmAuthGuard>
        </FirmAuthProvider>
      </Route>
      
      <Route path="/finance">
        <FirmAuthProvider>
          <FirmAuthGuard requiredPermissions={['view_finance']}>
            <FinancePage />
          </FirmAuthGuard>
        </FirmAuthProvider>
      </Route>
      
      {/* Portal protected routes */}
      <Route path="/portal/dashboard">
        <PortalAuthProvider>
          <PortalAuthGuard>
            <PortalDashboardPage />
          </PortalAuthGuard>
        </PortalAuthProvider>
      </Route>
      
      <Route path="/portal/invoices">
        <PortalAuthProvider>
          <PortalAuthGuard requiredAccess="canViewInvoices">
            <PortalInvoicesPage />
          </PortalAuthGuard>
        </PortalAuthProvider>
      </Route>
      
      {/* Fallback */}
      <Route component={NotFoundPage} />
    </Router>
  );
}
```

## Security Best Practices

### 1. Token Management
- Use separate localStorage keys to prevent cross-contamination
- Implement token refresh for JWT
- Set appropriate expiration times
- Clear tokens on logout

### 2. Route Protection
- Always check authentication state before rendering protected content
- Implement role-based and permission-based access control
- Provide proper redirect with return URL preservation
- Show loading states during auth checks

### 3. Error Handling
- Never expose sensitive error information
- Provide user-friendly error messages
- Implement proper logout on auth failures
- Log security events appropriately

## Testing Patterns

### 1. Authentication Tests
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-btn"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrong');
    await page.click('[data-testid="login-btn"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

### 2. Portal Authentication Tests
```typescript
test.describe('Portal Authentication', () => {
  test('should send magic link and authenticate', async ({ page }) => {
    await page.goto('/portal/login');
    await page.fill('[data-testid="email"]', 'client@example.com');
    await page.click('[data-testid="send-magic-link"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Simulate clicking magic link
    await page.goto('/portal/login?token=valid-token');
    await expect(page).toHaveURL('/portal/dashboard');
  });
});
```

## Verification Commands

```bash
# Check auth context exports
grep -r "export.*Auth" artifacts/apex-os/src/contexts/

# Verify route guards are used
grep -r "AuthGuard" artifacts/apex-os/src/

# Test localStorage key separation
grep -r "localStorage.getItem" artifacts/apex-os/src/ | grep -E "(firm_|portal_)"

# Run authentication tests
pnpm test e2e tests/e2e/auth.spec.ts
```

This skill provides a robust, dual-authentication system that maintains proper separation between firm and portal access while ensuring comprehensive route protection.
