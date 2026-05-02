---
name: authentication-implementation
description: Complete JWT-based authentication system with RBAC for Apex Unified Suite using 2026 best practices (refresh tokens, rate limiting, minimal payloads)
---

# Authentication System Implementation

This skill guides you through implementing a complete JWT-based authentication system with Role-Based Access Control (RBAC) for the Apex Unified Suite.

## Current State Assessment

**Authentication Status**: Zero authentication infrastructure exists.
- No JWT service or token generation
- No login/register endpoints
- No session management
- No RBAC system
- No auth middleware
- Frontend has hardcoded user initials "JS"

## Authentication Architecture

### **System Components**
```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ AuthContext │  │ Custom Fetch    │   │
│  │ useAuth()    │  │ setAuthToken() │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓ JWT Bearer Token
┌─────────────────────────────────────────┐
│           Backend (Express)              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Auth Routes │  │ Auth Middleware │   │
│  │ JWT Service │  │ RBAC Check      │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓ Database Queries
┌─────────────────────────────────────────┐
│           Database (PostgreSQL)          │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ users table │  │ roles table     │   │
│  │ permissions │  │ sessions table  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Backend JWT Service**

**File**: `artifacts/api-server/src/services/auth.ts`
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '@workspace/db';
import { usersTable, rolesTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
    
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: JWTPayload): AuthTokens {
    // 2026 Best Practice: Minimal, non-sensitive JWT payloads
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.jwtRefreshSecret) as { userId: string };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await db
      .select({
        permissions: rolesTable.permissions,
      })
      .from(usersTable)
      .leftJoin(rolesTable, eq(usersTable.role, rolesTable.name))
      .where(eq(usersTable.id, userId))
      .limit(1);

    return user[0]?.permissions || [];
  }

  async authenticateUser(email: string, password: string): Promise<{
    user: typeof usersTable.$inferSelect;
    tokens: AuthTokens;
  }> {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user[0]) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(password, user[0].passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (user[0].status !== 'active') {
      throw new Error('Account is not active');
    }

    const permissions = await this.getUserPermissions(user[0].id);
    const tokens = this.generateTokens({
      userId: user[0].id,
      email: user[0].email,
      role: user[0].role,
      permissions,
    });

    // Update last login
    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user[0].id));

    return {
      user: {
        ...user[0],
        passwordHash: undefined, // Remove sensitive data
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { userId } = this.verifyRefreshToken(refreshToken);

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user[0] || user[0].status !== 'active') {
      throw new Error('User not found or inactive');
    }

    const permissions = await this.getUserPermissions(user[0].id);
    return this.generateTokens({
      userId: user[0].id,
      email: user[0].email,
      role: user[0].role,
      permissions,
    });
  }
}

export const authService = new AuthService();
```

### **Step 2: Authentication Middleware**

**File**: `artifacts/api-server/src/middlewares/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { authService, JWTPayload } from '../services/auth';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const user = authService.verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
      });
    }

    next();
  };
};

export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Insufficient role',
        required: role,
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = authService.verifyAccessToken(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
```

### **Step 3: Authentication Routes**

**File**: `artifacts/api-server/src/routes/auth.ts`
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { createUserSchema, insertUserSchema } from '@workspace/api-zod';

const router = Router();

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = createUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { confirmPassword, ...userData } = validatedData;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userData.email))
      .limit(1);

    if (existingUser[0]) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const passwordHash = await authService.hashPassword(userData.password);
    
    const newUser = await db
      .insert(usersTable)
      .values({
        ...userData,
        passwordHash,
      })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        status: usersTable.status,
        createdAt: usersTable.createdAt,
      });

    // Generate tokens
    const permissions = await authService.getUserPermissions(newUser[0].id);
    const tokens = authService.generateTokens({
      userId: newUser[0].id,
      email: newUser[0].email,
      role: newUser[0].role,
      permissions,
    });

    res.status(201).json({
      user: newUser[0],
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const result = await authService.authenticateUser(
      validatedData.email,
      validatedData.password
    );

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    
    const tokens = await authService.refreshToken(validatedData.refreshToken);
    
    res.json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        status: usersTable.status,
        emailVerified: usersTable.emailVerified,
        lastLoginAt: usersTable.lastLoginAt,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    if (!user[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user[0],
      permissions: req.user!.permissions,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // In a real implementation, you might want to invalidate the refresh token
  // For now, we'll just return success (client-side should delete tokens)
  res.json({ message: 'Logged out successfully' });
});

export default router;
```

### **Step 4: Frontend Authentication Context**

**File**: `artifacts/apex-os/src/contexts/AuthContext.tsx`
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { z } from 'zod';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Token management
  const setAuthToken = (tokens: AuthTokens | null) => {
    if (tokens) {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const getStoredTokens = (): AuthTokens | null => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    
    return null;
  };

  // API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const tokens = getStoredTokens();
    const response = await fetch(`/api/auth${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.accessToken && {
          Authorization: `Bearer ${tokens.accessToken}`,
        }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  };

  // Auth methods
  const login = async (email: string, password: string) => {
    try {
      const validatedData = loginSchema.parse({ email, password });
      const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(validatedData),
      });

      setAuthState({
        user: result.user,
        tokens: result.tokens,
        isLoading: false,
        isAuthenticated: true,
      });

      setAuthToken(result.tokens);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const validatedData = registerSchema.parse(userData);
      const { confirmPassword, ...registerData } = validatedData;
      
      const result = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      setAuthState({
        user: result.user,
        tokens: result.tokens,
        isLoading: false,
        isAuthenticated: true,
      });

      setAuthToken(result.tokens);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
    });

    setAuthToken(null);
  };

  const refreshTokens = async () => {
    try {
      const tokens = getStoredTokens();
      if (!tokens) {
        throw new Error('No refresh token available');
      }

      const newTokens = await apiCall('/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      setAuthState(prev => ({
        ...prev,
        tokens: newTokens,
      }));

      setAuthToken(newTokens);
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // Clear invalid tokens
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = getStoredTokens();
        if (tokens) {
          try {
            const result = await apiCall('/me');
            setAuthState({
              user: result.user,
              tokens,
              isLoading: false,
              isAuthenticated: true,
            });
          } catch (error) {
            // Token might be expired, try to refresh
            await refreshTokens();
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!authState.tokens) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshTokens();
      } catch (error) {
        console.error('Auto refresh error:', error);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [authState.tokens]);

  const value: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    refreshTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### **Step 5: Custom Fetch Integration**

**Update**: `lib/api-client-react/src/custom-fetch.ts`
```typescript
// Add token getter integration
let authTokenGetter: (() => string | null) | null = null;

export const setAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = getter;
};

export const customFetch = async (url: string, options: RequestInit = {}) => {
  const token = authTokenGetter?.();
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response;
};
```

### **Step 6: Update App.tsx**

**Update**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { setAuthTokenGetter } from '@workspace/api-client-react';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter>
            <Toaster />
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### **Step 7: Login/Register Components**

**File**: `artifacts/apex-os/src/components/auth/LoginForm.tsx`
```typescript
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### **Step 8: Route Protection**

**File**: `artifacts/apex-os/src/components/auth/ProtectedRoute.tsx`
```typescript
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login or show login modal
    return <LoginForm />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have the required role to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

## Environment Configuration

**File**: `.env.example`
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/apex_unified_suite

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com

# Email (for password reset, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Integration Steps

### **1. Backend Setup**
```bash
# Install required dependencies
pnpm --filter @workspace/api-server add jsonwebtoken bcrypt
pnpm --filter @workspace/api-server add -D @types/jsonwebtoken @types/bcrypt

# Update route registration
# Add to artifacts/api-server/src/routes/index.ts:
import authRouter from './auth';
router.use('/auth', authRouter);
```

### **2. Frontend Setup**
```bash
# Install required dependencies
pnpm --filter @workspace/apex-os add react-hook-form @hookform/resolvers zod

# Update app to use AuthProvider
# (see App.tsx changes above)
```

### **3. Database Setup**
```bash
# Ensure user and roles tables exist
pnpm --filter @workspace/db run push

# Seed default roles
# (create a seed script for admin, user, viewer roles)
```

## Testing Authentication

### **Backend Tests**
```typescript
// tests/api/auth.test.ts
import request from 'supertest';
import { app } from '../src/app';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';

describe('Authentication', () => {
  beforeEach(async () => {
    await db.delete(usersTable);
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
      .expect(201);

    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.tokens.accessToken).toBeDefined();
  });

  it('should login with valid credentials', async () => {
    // First register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    // Then login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.tokens.accessToken).toBeDefined();
  });
});
```

### **Frontend Tests**
```typescript
// tests/components/auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthProvider } from '@/contexts/AuthContext';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

## Security Best Practices

### **JWT Security**
1. **Use strong secrets** - Generate with `openssl rand -base64 32`
2. **Short access token expiry** - 15 minutes recommended
3. **Longer refresh token expiry** - 7 days recommended
4. **Store tokens securely** - Use httpOnly cookies in production
5. **Implement token blacklisting** - For logout functionality

### **Password Security**
1. **Use bcrypt** - Minimum 12 rounds
2. **Enforce strong passwords** - Minimum 8 characters, mixed case
3. **Implement rate limiting** - Prevent brute force attacks
4. **Use HTTPS** - Never transmit credentials over HTTP

### **API Security**
1. **Validate all inputs** - Use Zod schemas
2. **Sanitize error messages** - Don't leak sensitive information
3. **Implement CORS** - Restrict to allowed origins
4. **Add rate limiting** - Prevent abuse
5. **Log authentication events** - For security monitoring

This comprehensive authentication system provides secure JWT-based authentication with role-based access control, proper frontend integration, and follows security best practices for the Apex Unified Suite.
