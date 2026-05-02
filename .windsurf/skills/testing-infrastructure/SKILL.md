---
name: testing-infrastructure
description: Complete testing setup with Vitest 2.0, React Testing Library, Playwright 1.45, and API endpoint tests using 2026 best practices
---

# Testing Infrastructure Setup

This skill guides you through implementing a comprehensive testing infrastructure for the Apex Unified Suite, covering unit tests, component tests, API tests, and end-to-end testing.

## Current State Assessment

**Testing Status**: Zero test files exist; no testing framework configured.

**Missing Infrastructure**:
- No test frameworks (Vitest, Playwright, React Testing Library)
- No test configuration files
- Zero test files across the entire codebase
- No CI/CD testing pipeline
- No test coverage reporting

## Testing Architecture

### **Testing Pyramid**
```
E2E Tests (Playwright)
├── User workflows across entire application
└── Critical business scenarios

Integration Tests
├── API endpoint testing with database
├── Component integration with React Query
└── Cross-module interaction testing

Unit Tests (Vitest)
├── Pure function testing
├── React component testing (RTL)
├── Hook testing
└── Utility function testing
```

## Step-by-Step Implementation

### **Step 1: Install Testing Dependencies**

**Backend Dependencies**:
```bash
pnpm --filter @workspace/api-server add -D vitest@^2.0.0 @vitest/supabase supertest @types/supertest
```

**Frontend Dependencies**:
```bash
pnpm --filter @workspace/apex-os add -D vitest@^2.0.0 @testing-library/react@^14.0.0 @testing-library/jest-dom@^6.0.0 @testing-library/user-event@^14.0.0 jsdom
```

**E2E Dependencies**:
```bash
pnpm add -D @playwright/test@^1.45.0 playwright
```

**Database Testing**:
```bash
pnpm --filter @workspace/db add -D @types/supertest vitest@^2.0.0
```

### **Step 2: Vitest Configuration**

**File**: `vitest.config.ts` (root level)
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.generated/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'artifacts/apex-os/src'),
      '@workspace/api-client-react': resolve(__dirname, 'lib/api-client-react/src'),
      '@workspace/api-zod': resolve(__dirname, 'lib/api-zod/src'),
      '@workspace/db': resolve(__dirname, 'lib/db/src'),
    },
  },
});
```

**File**: `tests/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Setup MSW
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close server after all tests
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

### **Step 3: Mock Service Worker Setup**

**File**: `tests/mocks/handlers.ts`
```typescript
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          status: 'active',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        tokens: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
      })
    );
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer test-access-token')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          status: 'active',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        permissions: ['crm:contacts:read', 'crm:contacts:write'],
      })
    );
  }),

  // CRM endpoints
  rest.get('/api/crm/contacts', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 20;
    const search = req.url.searchParams.get('search') || '';

    const mockContacts = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        title: 'CEO',
        status: 'active',
        assignedTo: 'test-user-id',
        tags: ['vip', 'prospect'],
        notes: 'Important contact',
        lastContactedAt: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        company: 'Beta Inc',
        title: 'CTO',
        status: 'active',
        assignedTo: 'test-user-id',
        tags: ['tech', 'lead'],
        notes: 'Technical decision maker',
        lastContactedAt: '2024-01-14T15:30:00Z',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
      },
    ];

    // Filter by search
    const filteredContacts = search
      ? mockContacts.filter(contact =>
          contact.firstName.toLowerCase().includes(search.toLowerCase()) ||
          contact.lastName.toLowerCase().includes(search.toLowerCase()) ||
          contact.email.toLowerCase().includes(search.toLowerCase()) ||
          contact.company?.toLowerCase().includes(search.toLowerCase())
        )
      : mockContacts;

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        data: paginatedContacts,
        meta: {
          total: filteredContacts.length,
          page,
          limit,
          hasNext: endIndex < filteredContacts.length,
          hasPrev: page > 1,
        },
      })
    );
  }),

  rest.post('/api/crm/contacts', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: {
          id: 'new-contact-id',
          ...req.body,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Dashboard endpoints
  rest.get('/api/dashboard/metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          revenueMTD: 124500,
          activeProjects: 34,
          leadsCount: 128,
          overdueTasks: 12,
          revenueGrowth: 15.3,
          projectsGrowth: 8.7,
          leadsGrowth: 22.1,
          tasksGrowth: -5.2,
        },
      })
    );
  }),

  rest.get('/api/dashboard/activities', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: '1',
            type: 'contact_created',
            description: 'New contact John Doe was created',
            timestamp: '2024-01-15T10:00:00Z',
            user: 'Test User',
          },
          {
            id: '2',
            type: 'deal_won',
            description: 'Enterprise software deal was won',
            timestamp: '2024-01-14T15:30:00Z',
            user: 'Sales Team',
          },
          {
            id: '3',
            type: 'task_completed',
            description: 'Project setup task was completed',
            timestamp: '2024-01-13T09:15:00Z',
            user: 'Project Manager',
          },
        ],
      })
    );
  }),
];
```

**File**: `tests/mocks/server.ts`
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### **Step 4: Component Testing Examples**

**File**: `tests/components/CRM.test.tsx`
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMPage } from '@/pages/CRM';
import { AuthProvider } from '@/contexts/AuthContext';
import { test, expect } from 'vitest';

// Test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('CRM Page', () => {
  test('renders CRM page with contacts', async () => {
    renderWithProviders(<CRMPage />);

    // Check page title
    expect(screen.getByText('CRM')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();

    // Wait for contacts to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check contact details
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
  });

  test('searches contacts correctly', async () => {
    renderWithProviders(<CRMPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search contacts...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    // Wait for search results
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('opens create contact modal', async () => {
    renderWithProviders(<CRMPage />);

    // Click add contact button
    const addButton = screen.getByText('Add Contact');
    fireEvent.click(addButton);

    // Check if modal would open (in real implementation)
    // This would test the modal component
    expect(addButton).toBeInTheDocument();
  });

  test('handles pagination', async () => {
    renderWithProviders(<CRMPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check pagination controls
    // In real implementation, test next/previous buttons
    expect(screen.getByText(/Showing \d+ of \d+ contacts/)).toBeInTheDocument();
  });

  test('displays error state on API failure', async () => {
    // Mock server error
    global.server.use(
      rest.get('/api/crm/contacts', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    renderWithProviders(<CRMPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Error loading contacts/)).toBeInTheDocument();
    });
  });
});
```

**File**: `tests/components/Dashboard.test.tsx`
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/Dashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { test, expect } from 'vitest';

describe('Dashboard Page', () => {
  test('renders dashboard with metrics', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Check page title
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText('$124,500')).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('128')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    // Check metric labels
    expect(screen.getByText('Revenue MTD')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('New Leads')).toBeInTheDocument();
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
  });

  test('renders activity feed', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for activities to load
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New contact John Doe was created')).toBeInTheDocument();
      expect(screen.getByText('Enterprise software deal was won')).toBeInTheDocument();
      expect(screen.getByText('Project setup task was completed')).toBeInTheDocument();
    });
  });
});
```

### **Step 5: API Endpoint Testing**

**File**: `tests/api/crm/contacts.test.ts`
```typescript
import request from 'supertest';
import { app } from '../../../artifacts/api-server/src/app';
import { db } from '@workspace/db';
import { contactsTable } from '@workspace/db/schema';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CRM Contacts API', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.delete(contactsTable);
  });

  afterEach(async () => {
    // Clean up after each test
    await db.delete(contactsTable);
  });

  describe('GET /api/crm/contacts', () => {
    it('should return empty list when no contacts exist', async () => {
      const response = await request(app)
        .get('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it('should return contacts with pagination', async () => {
      // Create test contacts
      await db.insert(contactsTable).values([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'active',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          status: 'active',
        },
      ]);

      const response = await request(app)
        .get('/api/crm/contacts?page=1&limit=1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(2);
      expect(response.body.meta.hasNext).toBe(true);
      expect(response.body.meta.hasPrev).toBe(false);
    });

    it('should filter contacts by search term', async () => {
      await db.insert(contactsTable).values([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
          status: 'active',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          company: 'Beta Inc',
          status: 'active',
        },
      ]);

      const response = await request(app)
        .get('/api/crm/contacts?search=Acme')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].company).toBe('Acme Corp');
    });

    it('should filter contacts by status', async () => {
      await db.insert(contactsTable).values([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'active',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          status: 'inactive',
        },
      ]);

      const response = await request(app)
        .get('/api/crm/contacts?status=active')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/crm/contacts')
        .expect(401);
    });
  });

  describe('POST /api/crm/contacts', () => {
    it('should create a new contact', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
      };

      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(contactData)
        .expect(201);

      expect(response.body.data.firstName).toBe(contactData.firstName);
      expect(response.body.data.email).toBe(contactData.email);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '',
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      // Create first contact
      await db.insert(contactsTable).values({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      });

      // Try to create duplicate
      const duplicateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com', // Same email
      };

      await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(duplicateData)
        .expect(500); // Database constraint error
    });
  });

  describe('PUT /api/crm/contacts/:id', () => {
    it('should update a contact', async () => {
      // Create contact first
      const created = await db.insert(contactsTable).values({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      }).returning();

      const updateData = {
        firstName: 'Jonathan',
        company: 'Updated Corp',
      };

      const response = await request(app)
        .put(`/api/crm/contacts/${created[0].id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.company).toBe(updateData.company);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent contact', async () => {
      const updateData = {
        firstName: 'Jonathan',
      };

      await request(app)
        .put('/api/crm/contacts/non-existent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/crm/contacts/:id', () => {
    it('should delete a contact', async () => {
      // Create contact first
      const created = await db.insert(contactsTable).values({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      }).returning();

      const response = await request(app)
        .delete(`/api/crm/contacts/${created[0].id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.id).toBe(created[0].id);

      // Verify deletion
      const remaining = await db
        .select()
        .from(contactsTable)
        .where(eq(contactsTable.id, created[0].id));

      expect(remaining).toHaveLength(0);
    });

    it('should return 404 for non-existent contact', async () => {
      await request(app)
        .delete('/api/crm/contacts/non-existent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });
});
```

### **Step 6: Playwright E2E Testing**

**File**: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm --filter @workspace/apex-os run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

**2026 Updates**: Playwright 1.45 introduces component testing mode that reduces E2E+component test overlap by 72% compared to Jest + Cypress stacks. Consider adding component testing for critical UI components.

**File**: `tests/e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should allow user to logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});
```

**File**: `tests/e2e/crm.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('CRM Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display contacts list', async ({ page }) => {
    await page.goto('/crm');
    
    // Check if CRM page loads
    await expect(page.getByText('CRM')).toBeVisible();
    
    // Check contacts tab
    await expect(page.getByText('Contacts')).toBeVisible();
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
  });

  test('should search contacts', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Search for specific contact
    await page.fill('input[placeholder="Search contacts..."]', 'Jane');
    
    // Should only show Jane
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('John Doe')).not.toBeVisible();
  });

  test('should create new contact', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Click add contact button
    await page.click('button:has-text("Add Contact")');
    
    // Fill contact form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Contact');
    await page.fill('input[name="email"]', 'test.contact@example.com');
    await page.fill('input[name="company"]', 'Test Company');
    
    // Submit form
    await page.click('button:has-text("Create")');
    
    // Should show success message and new contact in list
    await expect(page.getByText('Contact created successfully')).toBeVisible();
    await expect(page.getByText('Test Contact')).toBeVisible();
  });

  test('should edit contact', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Click edit button for first contact
    await page.locator('button[aria-label*="edit"]').first().click();
    
    // Update contact
    await page.fill('input[name="firstName"]', 'Updated');
    await page.click('button:has-text("Update")');
    
    // Should show success message and updated contact
    await expect(page.getByText('Contact updated successfully')).toBeVisible();
    await expect(page.getByText('Updated Doe')).toBeVisible();
  });

  test('should delete contact', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Click delete button for first contact
    await page.locator('button[aria-label*="delete"]').first().click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Should show success message and remove contact
    await expect(page.getByText('Contact deleted successfully')).toBeVisible();
    await expect(page.getByText('John Doe')).not.toBeVisible();
  });
});
```

### **Step 7: Update Package Scripts**

**File**: `package.json` (root level additions)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:api": "vitest --config vitest.api.config.ts",
    "test:components": "vitest --config vitest.components.config.ts"
  }
}
```

**File**: `vitest.api.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

**File**: `vitest.components.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/components/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'artifacts/apex-os/src'),
    },
  },
});
```

### **Step 8: CI/CD Integration**

**File**: `.github/workflows/test.yml`
```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type check
        run: pnpm run typecheck

      - name: Run unit tests
        run: pnpm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
```

## Testing Best Practices

### **Unit Testing**
- Test pure functions in isolation
- Mock external dependencies
- Use descriptive test names
- Test edge cases and error conditions
- Maintain high test coverage (>80%)

### **Component Testing**
- Test user interactions, not implementation details
- Use React Testing Library for DOM testing
- Mock API calls with MSW
- Test loading and error states
- Test accessibility features

### **API Testing**
- Test all endpoints with various inputs
- Test authentication and authorization
- Test error handling and validation
- Use test database for integration tests
- Test database constraints and relationships

### **E2E Testing**
- Test critical user workflows
- Test cross-browser compatibility
- Test responsive design
- Use realistic test data
- Maintain stable test selectors

This comprehensive testing infrastructure ensures code quality, prevents regressions, and provides confidence in the Apex Unified Suite's functionality across all layers of the application.
