---
name: playwright-e2e-testing
description: Complete Playwright E2E testing setup with seeded test database, accessibility checks with axe-core, and CI integration
---

# Playwright E2E Testing Skill

## Purpose
Set up comprehensive end-to-end testing with Playwright 1.45+, including test database seeding, accessibility testing with axe-core, and CI/CD integration.

## Prerequisites
- Node.js 22+
- PostgreSQL database for testing
- Playwright browsers installed

## Setup

### 1. Install Dependencies
```bash
# Install Playwright and testing dependencies
pnpm add -D @playwright/test @axe-core/playwright

# Install browsers
npx playwright install

# Install browser binaries for CI
npx playwright install --with-deps
```

### 2. Configuration Files

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter @workspace/api-server run test-server',
    port: 8081,
    reuseExistingServer: !process.env.CI,
  },
});
```

#### package.json Scripts
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report",
    "test:e2e:install": "playwright install --with-deps"
  }
}
```

### 3. Test Database Setup

#### Database Seeding
```typescript
// tests/e2e/fixtures/database.ts
import { test as base } from '@playwright/test';
import { execSync } from 'child_process';
import { Pool } from 'pg';

export interface DatabaseFixtures {
  seedDatabase: () => Promise<void>;
  cleanupDatabase: () => Promise<void>;
  getTestData: () => TestDataSet;
}

interface TestDataSet {
  users: User[];
  contacts: Contact[];
  tasks: Task[];
  projects: Project[];
}

export const test = base.extend<DatabaseFixtures>({
  seedDatabase: async ({}, use) => {
    const seed = async () => {
      // Reset database
      execSync('pnpm --filter @workspace/db run test-reset', { stdio: 'pipe' });
      
      // Seed test data
      const pool = new Pool({
        connectionString: process.env.TEST_DATABASE_URL,
      });
      
      const testData = generateTestData();
      
      // Insert users
      for (const user of testData.users) {
        await pool.query(`
          INSERT INTO users (id, email, name, role) 
          VALUES ($1, $2, $3, $4)
        `, [user.id, user.email, user.name, user.role]);
      }
      
      // Insert contacts
      for (const contact of testData.contacts) {
        await pool.query(`
          INSERT INTO contacts (id, name, email, phone, user_id) 
          VALUES ($1, $2, $3, $4, $5)
        `, [contact.id, contact.name, contact.email, contact.phone, contact.user_id]);
      }
      
      // Insert tasks
      for (const task of testData.tasks) {
        await pool.query(`
          INSERT INTO tasks (id, title, completed, user_id) 
          VALUES ($1, $2, $3, $4)
        `, [task.id, task.title, task.completed, task.user_id]);
      }
      
      await pool.end();
    };
    
    await use(seed);
  },
  
  cleanupDatabase: async ({}, use) => {
    const cleanup = async () => {
      const pool = new Pool({
        connectionString: process.env.TEST_DATABASE_URL,
      });
      
      await pool.query('TRUNCATE TABLE tasks, contacts, users RESTART IDENTITY CASCADE');
      await pool.end();
    };
    
    await use(cleanup);
  },
  
  getTestData: async ({}, use) => {
    const data = generateTestData();
    await use(data);
  },
});

function generateTestData(): TestDataSet {
  return {
    users: [
      { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'admin' },
      { id: 'user-2', email: 'manager@example.com', name: 'Manager User', role: 'manager' },
    ],
    contacts: [
      { id: 'contact-1', name: 'John Doe', email: 'john@example.com', phone: '555-0101', user_id: 'user-1' },
      { id: 'contact-2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', user_id: 'user-1' },
    ],
    tasks: [
      { id: 'task-1', title: 'Complete project proposal', completed: false, user_id: 'user-1' },
      { id: 'task-2', title: 'Review contract', completed: true, user_id: 'user-1' },
    ],
    projects: [
      { id: 'project-1', name: 'Website Redesign', status: 'active', user_id: 'user-1' },
    ],
  };
}
```

### 4. Authentication Helpers

#### Test Authentication
```typescript
// tests/e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAs(email: string, password: string = 'test-password') {
    await this.page.goto('/login');
    
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for navigation to dashboard
    await this.page.waitForURL('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async loginAsAdmin() {
    await this.loginAs('test@example.com');
  }

  async loginAsManager() {
    await this.loginAs('manager@example.com');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }

  async getAuthToken(): Promise<string> {
    // Get token from localStorage or cookies
    return await this.page.evaluate(() => {
      return localStorage.getItem('auth_token') || '';
    });
  }

  async setAuthToken(token: string) {
    await this.page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, token);
  }
}
```

### 5. Accessibility Testing

#### Axe Helper
```typescript
// tests/e2e/helpers/accessibility.ts
import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export class AccessibilityHelper {
  constructor(private page: Page) {}

  async checkAccessibility(options?: {
    include?: string[];
    exclude?: string[];
    rules?: Record<string, any>;
  }) {
    const builder = new AxeBuilder({ page });
    
    if (options?.include) {
      options.include.forEach(selector => builder.include(selector));
    }
    
    if (options?.exclude) {
      options.exclude.forEach(selector => builder.exclude(selector));
    }
    
    if (options?.rules) {
      builder.configure({ rules: options.rules });
    }
    
    const results = await builder.analyze();
    
    // Assert no violations
    expect(results.violations).toEqual([]);
    
    return results;
  }

  async checkPageAccessibility() {
    await this.checkAccessibility();
  }

  async checkComponentAccessibility(selector: string) {
    await this.checkAccessibility({ include: [selector] });
  }

  async checkWithCustomRules(selector: string) {
    // Example: Allow specific known issues during development
    await this.checkAccessibility({
      include: [selector],
      rules: {
        'color-contrast': { enabled: false }, // Temporarily disable
      },
    });
  }

  async logAccessibilityResults(results: any) {
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:');
      results.violations.forEach((violation: any, index: number) => {
        console.log(`${index + 1}. ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Elements: ${violation.nodes.length}`);
        violation.nodes.forEach((node: any) => {
          console.log(`   - ${node.target.join(', ')}`);
        });
      });
    }
  }
}
```

## Test Examples

### 1. Critical Path Tests

#### CRM Contacts Flow
```typescript
// tests/e2e/crm/contacts.spec.ts
import { test, expect } from '../fixtures/database';
import { AuthHelper } from '../helpers/auth';
import { AccessibilityHelper } from '../helpers/accessibility';

test.describe('CRM Contacts Flow', () => {
  let auth: AuthHelper;
  let a11y: AccessibilityHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    a11y = new AccessibilityHelper(page);
    await auth.loginAsAdmin();
  });

  test('should view contacts list with accessibility', async ({ page }) => {
    await page.goto('/crm/contacts');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Contacts');
    
    // Check data is loaded
    await expect(page.locator('[data-testid="contact-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-card"]')).toHaveCount(2);
    
    // Accessibility check
    await a11y.checkPageAccessibility();
  });

  test('should create new contact', async ({ page, getTestData }) => {
    await page.goto('/crm/contacts');
    
    // Click add contact button
    await page.click('[data-testid="add-contact-btn"]');
    
    // Check modal opens
    await expect(page.locator('[data-testid="contact-modal"]')).toBeVisible();
    
    // Fill form
    await page.fill('[data-testid="contact-name"]', 'New Contact');
    await page.fill('[data-testid="contact-email"]', 'new@example.com');
    await page.fill('[data-testid="contact-phone"]', '555-0103');
    
    // Submit form
    await page.click('[data-testid="save-contact-btn"]');
    
    // Check success
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-list"]')).toContainText('New Contact');
    
    // Accessibility check of new contact card
    await a11y.checkComponentAccessibility('[data-testid="contact-card"]:has-text("New Contact")');
  });

  test('should edit existing contact', async ({ page, getTestData }) => {
    await page.goto('/crm/contacts');
    
    // Find first contact and click edit
    await page.click('[data-testid="contact-card"]:first-child [data-testid="edit-btn"]');
    
    // Check modal opens with existing data
    await expect(page.locator('[data-testid="contact-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-name"]')).toHaveValue('John Doe');
    
    // Update contact
    await page.fill('[data-testid="contact-name"]', 'John Updated');
    await page.click('[data-testid="save-contact-btn"]');
    
    // Check update
    await expect(page.locator('[data-testid="contact-list"]')).toContainText('John Updated');
  });

  test('should delete contact with confirmation', async ({ page }) => {
    await page.goto('/crm/contacts');
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="contact-card"]').count();
    
    // Click delete on first contact
    await page.click('[data-testid="contact-card"]:first-child [data-testid="delete-btn"]');
    
    // Check confirmation dialog
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Check deletion
    await expect(page.locator('[data-testid="contact-card"]')).toHaveCount(initialCount - 1);
  });
});
```

#### Dashboard Performance Test
```typescript
// tests/e2e/dashboard/performance.spec.ts
import { test, expect } from '../fixtures/database';

test.describe('Dashboard Performance', () => {
  test('should load dashboard within performance budgets', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Performance assertions
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve({
            lcp: entries.find(e => e.name === 'largest-contentful-paint')?.startTime || 0,
            cls: entries.find(e => e.name === 'cumulative-layout-shift')?.value || 0,
            fid: entries.find(e => e.name === 'first-input')?.processingStart || 0,
          });
        }).observe({ entryTypes: ['largest-contentful-paint', 'cumulative-layout-shift', 'first-input'] });
      });
    });
    
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.cls).toBeLessThan(0.1);   // CLS < 0.1
    expect(metrics.fid).toBeLessThan(100);   // FID < 100ms
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });
    
    await page.goto('/dashboard');
    
    // Check error state
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
```

### 2. Cross-Browser Tests

#### Mobile Responsiveness
```typescript
// tests/e2e/responsive/mobile.spec.ts
import { test, devices } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/crm/contacts');
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-btn"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Check responsive layout
    await expect(page.locator('[data-testid="contact-list"]')).toBeVisible();
    
    // Test touch interactions
    await page.tap('[data-testid="contact-card"]:first-child');
    await expect(page.locator('[data-testid="contact-details"]')).toBeVisible();
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: apex_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm ci
      
      - name: Install Playwright browsers
        run: pnpm run test:e2e:install
      
      - name: Setup test database
        run: |
          pnpm --filter @workspace/db run test-setup
          pnpm --filter @workspace/db run seed:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/apex_test
      
      - name: Run E2E tests
        run: pnpm run test:e2e
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/apex_test
          TEST_BASE_URL: http://localhost:3000
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 30
```

## Testing Best Practices

### 1. Test Organization
```
tests/e2e/
├── fixtures/
│   ├── database.ts      # Database seeding fixtures
│   └── auth.ts          # Authentication helpers
├── helpers/
│   ├── auth.ts          # Authentication utilities
│   ├── accessibility.ts # Axe helper
│   └── data-generator.ts # Test data generation
├── crm/
│   ├── contacts.spec.ts
│   ├── leads.spec.ts
│   └── deals.spec.ts
├── dashboard/
│   ├── performance.spec.ts
│   └── accessibility.spec.ts
└── responsive/
    └── mobile.spec.ts
```

### 2. Data Management
- Use deterministic test data
- Clean up after each test
- Use transactions when possible
- Isolate test data from production

### 3. Page Object Pattern
```typescript
// tests/e2e/pages/ContactsPage.ts
export class ContactsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/crm/contacts');
  }

  async addContact(data: { name: string; email: string; phone: string }) {
    await this.page.click('[data-testid="add-contact-btn"]');
    await this.page.fill('[data-testid="contact-name"]', data.name);
    await this.page.fill('[data-testid="contact-email"]', data.email);
    await this.page.fill('[data-testid="contact-phone"]', data.phone);
    await this.page.click('[data-testid="save-contact-btn"]');
  }

  async getContactCount() {
    return await this.page.locator('[data-testid="contact-card"]').count();
  }

  async hasContact(name: string) {
    return await this.page.locator(`[data-testid="contact-card"]:has-text("${name}")`).isVisible();
  }
}
```

### 4. Accessibility Testing Strategy
- Test critical user journeys
- Check dynamic content updates
- Validate keyboard navigation
- Test screen reader compatibility
- Monitor regression over time

## Verification Commands

```bash
# Run all E2E tests
pnpm run test:e2e

# Run specific test file
pnpm run test:e2e tests/e2e/crm/contacts.spec.ts

# Run tests in UI mode
pnpm run test:e2e:ui

# Run tests with debugging
pnpm run test:e2e:debug

# Generate HTML report
pnpm run test:e2e:report

# Check accessibility violations
grep -r "accessibility violations found" playwright-report/ || echo "No violations found"
```

This skill provides comprehensive E2E testing infrastructure with accessibility validation, ensuring reliable, accessible user experiences across all browsers and devices.
