---
trigger: model_decision
description: Guidelines for comprehensive testing requirements including unit, integration, and E2E tests
---

# Testing Requirements

Enforce comprehensive testing standards for all code changes in the Apex Unified Suite.

## When This Rule Applies

Cascade should reference this rule when:
- Implementing new features or components
- Modifying existing business logic
- Adding API endpoints
- Making significant UI changes
- During code reviews

## Testing Pyramid Requirements

### **Unit Tests (Vitest)**
- All pure functions must have unit tests
- React components must have tests with React Testing Library
- Hooks must be tested individually
- Utility functions require 100% coverage

### **Integration Tests**
- API endpoints must have integration tests with database
- Component integration with React Query hooks
- Cross-module interactions must be tested
- Database operations require test coverage

### **E2E Tests (Playwright)**
- Critical user workflows must have E2E tests
- Authentication flows require full coverage
- Business processes (CRM, Projects, Finance) need E2E validation
- Cross-browser testing required for critical paths

## Coverage Requirements

### **Minimum Coverage Thresholds**
- **Unit Tests**: 80% line coverage, 80% branch coverage
- **Integration Tests**: 90% line coverage for API endpoints
- **E2E Tests**: 100% coverage for critical user journeys

### **Critical Path Coverage**
- Authentication: login, logout, session management
- CRUD operations: create, read, update, delete for all modules
- Error handling: validation errors, server errors, network failures
- Performance: loading states, error boundaries, retry logic

## Test File Organization

### **File Structure**
```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── services/
├── integration/
│   ├── api/
│   └── database/
├── e2e/
│   ├── auth.spec.ts
│   ├── crm.spec.ts
│   ├── projects.spec.ts
│   └── finance.spec.ts
└── fixtures/
    ├── mockData.ts
    └── testUtils.ts
```

### **Naming Conventions**
- Unit tests: `ComponentName.test.tsx` or `functionName.test.ts`
- Integration tests: `moduleName.test.ts`
- E2E tests: `featureName.spec.ts`
- Fixtures: descriptive names like `mockUsers.ts`, `testContacts.ts`

## Testing Patterns

### **Component Testing**
```typescript
// ✅ Correct pattern
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CRMPage } from '@/pages/CRM';

describe('CRM Page', () => {
  test('renders contacts list', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CRMPage />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### **API Testing**
```typescript
// ✅ Correct pattern
import request from 'supertest';
import { app } from '../src/app';
import { db } from '@workspace/db';
import { contactsTable } from '@workspace/db/schema';

describe('Contacts API', () => {
  beforeEach(async () => {
    await db.delete(contactsTable);
  });

  it('should create contact', async () => {
    const response = await request(app)
      .post('/api/crm/contacts')
      .send(validContactData)
      .expect(201);
      
    expect(response.body.data.email).toBe(validContactData.email);
  });
});
```

### **E2E Testing**
```typescript
// ✅ Correct pattern
import { test, expect } from '@playwright/test';

test('should allow user to create contact', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.goto('/crm');
  await page.click('button:has-text("Add Contact")');
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button:has-text("Create")');
  
  await expect(page.getByText('Contact created successfully')).toBeVisible();
});
```

## Anti-Patterns

❌ **Never** implement features without tests
❌ **Never** use `test.skip` without justification
❌ **Never** mock entire modules when unit testing
❌ **Never** test implementation details instead of behavior
❌ **Never** ignore test failures in CI/CD

## Quality Gates

### **Before Commit**
- All new code must have corresponding tests
- Test coverage must meet minimum thresholds
- All tests must pass locally
- No `test.skip` or `test.only` in committed code

### **CI/CD Requirements**
- Unit tests run on every PR
- Integration tests run on every merge
- E2E tests run on main branch
- Coverage reports generated and archived
- Performance tests for critical paths

## Testing Commands

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage

# Run tests with coverage thresholds
pnpm test:coverage --threshold
```

## Testing Checklist

- [ ] Unit tests written for new functions
- [ ] Component tests cover user interactions
- [ ] Integration tests cover API endpoints
- [ ] E2E tests cover critical workflows
- [ ] Mock data is realistic and comprehensive
- [ ] Tests are maintainable and readable
- [ ] Coverage thresholds are met
- [ ] No test failures in CI/CD

This rule ensures comprehensive testing coverage across all layers of the Apex Unified Suite.
