---
trigger: glob
globs: **/*.tsx
description: Separate portal authentication from internal auth with distinct contexts and isolated auth flows
---

# Portal Auth Separation

## Core Principle

### Dual Authentication Architecture
The Apex Unified Suite must maintain two distinct authentication systems:
- **Internal Auth**: For firm users accessing the main application
- **Portal Auth**: For external clients accessing the client portal

These systems must be completely isolated with separate contexts, tokens, and permissions.

## Required Architecture

### 1. Separate Auth Contexts
```typescript
// ✅ CORRECT - Separate auth contexts
// Internal auth context for firm users
interface InternalAuthContext {
  user: InternalUser | null;
  token: string | null;
  permissions: InternalPermission[];
  isLoading: boolean;
  loginInternal: (email: string, password: string) => Promise<void>;
  logoutInternal: () => void;
  hasPermission: (permission: string) => boolean;
}

const InternalAuthContext = createContext<InternalAuthContext | null>(null);

export function InternalAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalAuthState>({
    user: null,
    token: null,
    permissions: [],
    isLoading: false,
  });

  const loginInternal = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/auth/internal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const { user, token, permissions } = await response.json();
      
      setState({
        user,
        token,
        permissions,
        isLoading: false,
      });
      
      // Store in internal auth storage
      localStorage.setItem('internal_token', token);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logoutInternal = useCallback(() => {
    setState({
      user: null,
      token: null,
      permissions: [],
      isLoading: false,
    });
    
    localStorage.removeItem('internal_token');
  }, []);

  const hasPermission = useCallback((permission: string) => {
    return state.permissions.some(p => p.name === permission);
  }, [state.permissions]);

  return (
    <InternalAuthContext.Provider value={{
      ...state,
      loginInternal,
      logoutInternal,
      hasPermission,
    }}>
      {children}
    </InternalAuthContext.Provider>
  );
}

// Portal auth context for external clients
interface PortalAuthContext {
  client: PortalClient | null;
  token: string | null;
  permissions: PortalPermission[];
  isLoading: boolean;
  loginPortal: (clientId: string, accessCode: string) => Promise<void>;
  logoutPortal: () => void;
  hasPortalPermission: (permission: string) => boolean;
}

const PortalAuthContext = createContext<PortalAuthContext | null>(null);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PortalAuthState>({
    client: null,
    token: null,
    permissions: [],
    isLoading: false,
  });

  const loginPortal = useCallback(async (clientId: string, accessCode: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, accessCode }),
      });
      
      const { client, token, permissions } = await response.json();
      
      setState({
        client,
        token,
        permissions,
        isLoading: false,
      });
      
      // Store in portal auth storage
      sessionStorage.setItem('portal_token', token);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logoutPortal = useCallback(() => {
    setState({
      client: null,
      token: null,
      permissions: [],
      isLoading: false,
    });
    
    sessionStorage.removeItem('portal_token');
  }, []);

  const hasPortalPermission = useCallback((permission: string) => {
    return state.permissions.some(p => p.name === permission);
  }, [state.permissions]);

  return (
    <PortalAuthContext.Provider value={{
      ...state,
      loginPortal,
      logoutPortal,
      hasPortalPermission,
    }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

// ❌ INCORRECT - Mixed auth context
interface AuthContext {
  user: User | null;
  client: Client | null;
  token: string | null;
  // This mixes internal and portal auth - not allowed
}
```

### 2. Route Protection
```typescript
// ✅ CORRECT - Separate route guards
// Internal route protection
function InternalProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredPermission?: string;
}) {
  const auth = useInternalAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <InternalAuthLoading />;
  }

  if (!auth.user) {
    return <Navigate to="/internal/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    return <InternalAccessDenied />;
  }

  return <>{children}</>;
}

// Portal route protection
function PortalProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredPermission?: string;
}) {
  const auth = usePortalAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <PortalAuthLoading />;
  }

  if (!auth.client) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !auth.hasPortalPermission(requiredPermission)) {
    return <PortalAccessDenied />;
  }

  return <>{children}</>;
}

// ❌ INCORRECT - Mixed route protection
function ProtectedRoute({ children, requiredPermission }: { 
  children: React.ReactNode;
  requiredPermission?: string;
}) {
  // This mixes internal and portal auth checks
  const auth = useAuth(); // Mixed auth context
  // ...
}
```

### 3. API Client Separation
```typescript
// ✅ CORRECT - Separate API clients
// Internal API client
class InternalApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api/internal${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new InternalApiError(response.status, await response.text());
    }

    return response.json();
  }

  async getUsers(): Promise<InternalUser[]> {
    return this.request<InternalUser[]>('/users');
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }
}

// Portal API client
class PortalApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api/portal${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Portal ${this.token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new PortalApiError(response.status, await response.text());
    }

    return response.json();
  }

  async getClientProjects(): Promise<PortalProject[]> {
    return this.request<PortalProject[]>('/projects');
  }

  async getClientDocuments(): Promise<PortalDocument[]> {
    return this.request<PortalDocument[]>('/documents');
  }
}

// ❌ INCORRECT - Mixed API client
class ApiClient {
  // This client handles both internal and portal requests
  async request(endpoint: string, options: RequestInit = {}) {
    // Mixed authentication logic - not allowed
  }
}
```

### 4. Storage Isolation
```typescript
// ✅ CORRECT - Separate storage utilities
// Internal auth storage
export const InternalAuthStorage = {
  getToken: (): string | null => localStorage.getItem('internal_token'),
  setToken: (token: string) => localStorage.setItem('internal_token', token),
  removeToken: () => localStorage.removeItem('internal_token'),
  
  getUser: (): InternalUser | null => {
    const user = localStorage.getItem('internal_user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: InternalUser) => localStorage.setItem('internal_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('internal_user'),
};

// Portal auth storage
export const PortalAuthStorage = {
  getToken: (): string | null => sessionStorage.getItem('portal_token'),
  setToken: (token: string) => sessionStorage.setItem('portal_token', token),
  removeToken: () => sessionStorage.removeItem('portal_token'),
  
  getClient: (): PortalClient | null => {
    const client = sessionStorage.getItem('portal_client');
    return client ? JSON.parse(client) : null;
  },
  setClient: (client: PortalClient) => sessionStorage.setItem('portal_client', JSON.stringify(client)),
  removeClient: () => sessionStorage.removeItem('portal_client'),
};

// ❌ INCORRECT - Mixed storage
export const AuthStorage = {
  // This mixes internal and portal storage - not allowed
  getToken: () => {
    // Gets either internal or portal token - ambiguous
  },
};
```

## Implementation Patterns

### 1. App Structure
```typescript
// ✅ CORRECT - Separate app structure
function App() {
  return (
    <Router>
      <Routes>
        {/* Internal app routes */}
        <Route path="/internal/*" element={<InternalApp />} />
        
        {/* Portal routes */}
        <Route path="/portal/*" element={<PortalApp />} />
        
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/public/*" element={<PublicPages />} />
      </Routes>
    </Router>
  );
}

function InternalApp() {
  return (
    <InternalAuthProvider>
      <InternalLayout>
        <Routes>
          <Route path="/internal/login" element={<InternalLogin />} />
          <Route path="/internal/dashboard" element={
            <InternalProtectedRoute requiredPermission="dashboard.view">
              <InternalDashboard />
            </InternalProtectedRoute>
          } />
          <Route path="/internal/users" element={
            <InternalProtectedRoute requiredPermission="users.manage">
              <UserManagement />
            </InternalProtectedRoute>
          } />
        </Routes>
      </InternalLayout>
    </InternalAuthProvider>
  );
}

function PortalApp() {
  return (
    <PortalAuthProvider>
      <PortalLayout>
        <Routes>
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal/dashboard" element={
            <PortalProtectedRoute requiredPermission="portal.view">
              <PortalDashboard />
            </PortalProtectedRoute>
          } />
          <Route path="/portal/projects" element={
            <PortalProtectedRoute requiredPermission="projects.view">
              <PortalProjects />
            </PortalProtectedRoute>
          } />
        </Routes>
      </PortalLayout>
    </PortalAuthProvider>
  );
}

// ❌ INCORRECT - Mixed app structure
function App() {
  return (
    <AuthProvider> {/* Single auth provider */}
      <Router>
        <Routes>
          {/* Mixed internal and portal routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portal/dashboard" element={<PortalDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### 2. Permission Systems
```typescript
// ✅ CORRECT - Separate permission systems
// Internal permissions
export enum InternalPermission {
  DASHBOARD_VIEW = 'dashboard.view',
  USERS_MANAGE = 'users.manage',
  PROJECTS_CREATE = 'projects.create',
  REPORTS_VIEW = 'reports.view',
  SETTINGS_MANAGE = 'settings.manage',
}

// Portal permissions
export enum PortalPermission {
  PORTAL_VIEW = 'portal.view',
  PROJECTS_VIEW = 'projects.view',
  DOCUMENTS_VIEW = 'documents.view',
  DOCUMENTS_DOWNLOAD = 'documents.download',
  INVOICES_VIEW = 'invoices.view',
  INVOICES_PAY = 'invoices.pay',
}

// Permission checking hooks
export function useInternalPermission(permission: InternalPermission) {
  const auth = useInternalAuth();
  return auth.hasPermission(permission);
}

export function usePortalPermission(permission: PortalPermission) {
  const auth = usePortalAuth();
  return auth.hasPortalPermission(permission);
}

// ❌ INCORRECT - Mixed permissions
export enum Permission {
  // This mixes internal and portal permissions - not allowed
  DASHBOARD_VIEW = 'dashboard.view',
  PORTAL_VIEW = 'portal.view',
}
```

### 3. Component Separation
```typescript
// ✅ CORRECT - Separate components for each auth system
// Internal components
export function InternalHeader() {
  const auth = useInternalAuth();
  
  return (
    <header className="internal-header">
      <div className="logo">
        <img src="/logo.svg" alt="Apex Suite" />
      </div>
      
      <nav className="internal-nav">
        <NavLink to="/internal/dashboard">Dashboard</NavLink>
        <NavLink to="/internal/users">Users</NavLink>
        <NavLink to="/internal/projects">Projects</NavLink>
      </nav>
      
      <div className="user-menu">
        <span>{auth.user?.name}</span>
        <button onClick={auth.logoutInternal}>Logout</button>
      </div>
    </header>
  );
}

// Portal components
export function PortalHeader() {
  const auth = usePortalAuth();
  
  return (
    <header className="portal-header">
      <div className="logo">
        <img src="/portal-logo.svg" alt="Client Portal" />
      </div>
      
      <nav className="portal-nav">
        <NavLink to="/portal/dashboard">Dashboard</NavLink>
        <NavLink to="/portal/projects">Projects</NavLink>
        <NavLink to="/portal/documents">Documents</NavLink>
      </nav>
      
      <div className="client-menu">
        <span>{auth.client?.name}</span>
        <button onClick={auth.logoutPortal}>Logout</button>
      </div>
    </header>
  );
}

// ❌ INCORRECT - Mixed components
export function Header() {
  // This component tries to handle both internal and portal auth
  const auth = useAuth(); // Mixed auth context
  // ...
}
```

## Security Considerations

### 1. Token Separation
```typescript
// ✅ CORRECT - Separate token handling
// Internal token middleware
export function InternalTokenProvider({ children }: { children: React.ReactNode }) {
  const token = InternalAuthStorage.getToken();
  
  return (
    <InternalApiClientProvider token={token}>
      {children}
    </InternalApiClientProvider>
  );
}

// Portal token provider
export function PortalTokenProvider({ children }: { children: React.ReactNode }) {
  const token = PortalAuthStorage.getToken();
  
  return (
    <PortalApiClientProvider token={token}>
      {children}
    </PortalApiClientProvider>
  );
}

// ❌ INCORRECT - Mixed token handling
export function TokenProvider({ children }: { children: React.ReactNode }) {
  // This provider handles both token types - not allowed
}
```

### 2. Route Isolation
```typescript
// ✅ CORRECT - Route isolation with middleware
// Internal route middleware
export function InternalRouteMiddleware({ children }: { children: React.ReactNode }) {
  const token = InternalAuthStorage.getToken();
  
  if (!token) {
    return <Navigate to="/internal/login" replace />;
  }
  
  return <>{children}</>;
}

// Portal route middleware
export function PortalRouteMiddleware({ children }: { children: React.ReactNode }) {
  const token = PortalAuthStorage.getToken();
  
  if (!token) {
    return <Navigate to="/portal/login" replace />;
  }
  
  return <>{children}</>;
}

// ❌ INCORRECT - Mixed route middleware
export function RouteMiddleware({ children }: { children: React.ReactNode }) {
  // This checks both token types - not allowed
}
```

## Testing Strategies

### 1. Separate Test Suites
```typescript
// ✅ CORRECT - Separate test files
// Internal auth tests
describe('InternalAuthProvider', () => {
  it('should login internal user', async () => {
    const { result } = renderHook(() => useInternalAuth(), {
      wrapper: InternalAuthProvider,
    });

    await act(async () => {
      await result.current.loginInternal('user@example.com', 'password');
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.token).toBeTruthy();
  });

  it('should logout internal user', () => {
    const { result } = renderHook(() => useInternalAuth(), {
      wrapper: InternalAuthProvider,
      initialProps: {
        user: mockInternalUser,
        token: 'internal-token',
      },
    });

    act(() => {
      result.current.logoutInternal();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

// Portal auth tests
describe('PortalAuthProvider', () => {
  it('should login portal client', async () => {
    const { result } = renderHook(() => usePortalAuth(), {
      wrapper: PortalAuthProvider,
    });

    await act(async () => {
      await result.current.loginPortal('client-123', 'access-code');
    });

    expect(result.current.client).toBeTruthy();
    expect(result.current.token).toBeTruthy();
  });

  it('should logout portal client', () => {
    const { result } = renderHook(() => usePortalAuth(), {
      wrapper: PortalAuthProvider,
      initialProps: {
        client: mockPortalClient,
        token: 'portal-token',
      },
    });

    act(() => {
      result.current.logoutPortal();
    });

    expect(result.current.client).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

// ❌ INCORRECT - Mixed tests
describe('AuthProvider', () => {
  // This tests both auth systems together - not allowed
});
```

### 2. Integration Tests
```typescript
// ✅ CORRECT - Separate integration tests
// Internal app integration tests
describe('Internal App Integration', () => {
  it('should protect internal routes', async () => {
    render(<App />);
    
    // Try to access internal route without auth
    fireEvent.click(screen.getByText('Dashboard'));
    
    // Should redirect to login
    expect(screen.getByText('Internal Login')).toBeInTheDocument();
  });

  it('should allow access with internal auth', async () => {
    // Mock internal auth
    InternalAuthStorage.setToken('internal-token');
    InternalAuthStorage.setUser(mockInternalUser);
    
    render(<App />);
    
    // Should access internal dashboard
    fireEvent.click(screen.getByText('Dashboard'));
    expect(screen.getByText('Internal Dashboard')).toBeInTheDocument();
  });
});

// Portal app integration tests
describe('Portal App Integration', () => {
  it('should protect portal routes', async () => {
    render(<App />);
    
    // Try to access portal route without auth
    fireEvent.click(screen.getByText('Client Portal'));
    
    // Should redirect to portal login
    expect(screen.getByText('Portal Login')).toBeInTheDocument();
  });

  it('should allow access with portal auth', async () => {
    // Mock portal auth
    PortalAuthStorage.setToken('portal-token');
    PortalAuthStorage.setClient(mockPortalClient);
    
    render(<App />);
    
    // Should access portal dashboard
    fireEvent.click(screen.getByText('Client Portal'));
    expect(screen.getByText('Portal Dashboard')).toBeInTheDocument();
  });
});
```

## Migration Strategy

### 1. Gradual Separation
```typescript
// ✅ CORRECT - Migration wrapper for gradual separation
function AuthMigrationProvider({ children }: { children: React.ReactNode }) {
  const [usePortal, setUsePortal] = useState(false);
  
  if (usePortal) {
    return (
      <PortalAuthProvider>
        {children}
      </PortalAuthProvider>
    );
  }
  
  return (
    <InternalAuthProvider>
      {children}
    </InternalAuthProvider>
  );
}

// Usage during migration
function App() {
  const [authSystem, setAuthSystem] = useState<'internal' | 'portal'>('internal');
  
  return (
    <Router>
      <Routes>
        <Route path="/internal/*" element={
          <InternalAuthProvider>
            <InternalApp />
          </InternalAuthProvider>
        } />
        
        <Route path="/portal/*" element={
          <PortalAuthProvider>
            <PortalApp />
          </PortalAuthProvider>
        } />
      </Routes>
    </Router>
  );
}
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't mix auth contexts**: Keep internal and portal auth completely separate
- **Don't share tokens**: Internal and portal tokens must be stored separately
- **Don't mix permissions**: Internal and portal permissions are distinct systems
- **Don't share APIs**: Use separate API clients for each auth system
- **Don't mix components**: Create separate components for each auth system

### 2. Common Mistakes
```typescript
// ❌ WRONG - Mixed auth context
function useAuth() {
  const internalAuth = useInternalAuth();
  const portalAuth = usePortalAuth();
  
  // This mixes both auth systems - not allowed
  return {
    user: internalAuth.user || portalAuth.client,
    token: internalAuth.token || portalAuth.token,
  };
}

// ❌ WRONG - Shared storage
export const AuthStorage = {
  getToken: () => {
    // Gets either internal or portal token - ambiguous
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },
};

// ❌ WRONG - Mixed API client
class ApiClient {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = AuthStorage.getToken(); // Mixed token logic
    
    return fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

// ❌ WRONG - Mixed component
function Header() {
  const auth = useAuth(); // Mixed auth
  
  return (
    <header>
      {auth.user ? (
        <div>
          <span>{auth.user.name}</span>
          <button onClick={auth.logout}>Logout</button>
        </div>
      ) : (
        <div>Please login</div>
      )}
    </header>
  );
}
```

## Compliance Checklist

- [ ] Internal and portal auth contexts are completely separate
- [ ] Separate storage mechanisms for each auth system
- [ ] Separate API clients for each auth system
- [ ] Separate permission systems for each auth system
- [ ] Separate route protection for each auth system
- [ ] Separate components for each auth system
- [ ] Token isolation is properly implemented
- [ ] Route isolation is properly implemented
- [ ] Storage isolation is properly implemented
- [ ] Separate test suites for each auth system
- [ ] Migration strategy is documented
- [ ] Security boundaries are clearly defined
- [ ] No shared state between auth systems
- [ ] Proper error handling for each auth system
- [ ] Proper logout handling for each auth system
- [ ] Proper token refresh handling for each auth system
