---
trigger: glob
globs: **/*.test.ts
---

# Testing Standards Rule

Enforce TDD pattern with describe/it blocks, no production database in tests, mock external services with MSW, and clean up between tests.

## Core Testing Requirements

### **Test Structure Pattern**
```typescript
// ✅ CORRECT - Standard test structure
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value).toMatchObject({
        email: userData.email,
        name: userData.name,
      });
      expect(result.value.id).toBeDefined();
    });

    it('should return validation error for invalid email', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123',
      };

      // Act
      const result = await userService.createUser(invalidData);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### **Test Naming Conventions**
```typescript
// ✅ CORRECT - Clear, descriptive test names
describe('ContactService', () => {
  it('should create contact when valid data provided', async () => {});
  it('should return error when duplicate email provided', async () => {});
  it('should update contact status when valid transition', async () => {});
  it('should delete contact when user has delete permission', async () => {});
});

// ❌ INCORRECT - Vague or unclear names
describe('ContactService', () => {
  it('works', async () => {});
  it('handles edge case', async () => {});
  it('test 1', async () => {});
});
```

## Database Testing Standards

### **Never Use Production Database**
```typescript
// ✅ CORRECT - Use test database with proper setup
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('ContactRepository', () => {
  let db: Database;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  beforeEach(async () => {
    // Clean up between tests
    await db.delete(contactsTable);
  });

  it('should insert and retrieve contact', async () => {
    const contact = await db.insert(contactsTable).values({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      organizationId: 'test-org',
    }).returning();

    const found = await db.select().from(contactsTable)
      .where(eq(contactsTable.id, contact[0].id))
      .limit(1);

    expect(found[0]).toMatchObject(contact[0]);
  });
});
```

### **Database Test Helpers**
```typescript
// tests/helpers/database.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@workspace/db/schema';

let testDb: Database;

export async function setupTestDatabase(): Promise<Database> {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL environment variable is required');
  }

  const client = postgres(connectionString, { max: 1 });
  testDb = drizzle(client, { schema });

  // Run migrations
  await migrate(testDb);

  return testDb;
}

export async function cleanupTestDatabase(db: Database): Promise<void> {
  // Clean all tables
  const tables = Object.values(schema).filter(table => 'id' in table);
  
  for (const table of tables) {
    await db.delete(table);
  }

  // Close connection
  await db.$client.end();
}

export async function createTestOrganization(overrides: Partial<Organization> = {}): Promise<Organization> {
  const [org] = await testDb.insert(schema.organizationsTable).values({
    name: 'Test Organization',
    domain: 'test.example.com',
    ...overrides,
  }).returning();

  return org;
}

export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const org = await createTestOrganization();

  const [user] = await testDb.insert(schema.usersTable).values({
    email: 'test@example.com',
    name: 'Test User',
    organizationId: org.id,
    ...overrides,
  }).returning();

  return user;
}
```

## Mock Service Worker (MSW) Standards

### **API Mocking Pattern**
```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  // Mock successful API calls
  rest.get('/api/contacts', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: 'contact-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        ],
        meta: { total: 1, page: 1, limit: 20 },
      })
    );
  }),

  // Mock error responses
  rest.get('/api/contacts/:id', (req, res, ctx) => {
    if (req.params.id === 'not-found') {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Contact not found' })
      );
    }
    return res.networkError('Network error');
  }),

  // Mock authentication
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as any;
    
    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          data: {
            token: 'mock-jwt-token',
            user: {
              id: 'user-1',
              email: 'test@example.com',
              name: 'Test User',
              organizationId: 'org-1',
            },
          },
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),
];

export const server = setupServer(...handlers);
```

### **Test Setup with MSW**
```typescript
// tests/setup.ts
import { server } from './mocks/handlers';

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
```

### **Component Testing with MSW**
```typescript
// tests/components/ContactList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactList } from '@/components/ContactList';
import { server } from '../mocks/handlers';

describe('ContactList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should display contacts when API returns data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ContactList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should display error message when API fails', async () => {
    server.use(
      rest.get('/api/contacts', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ContactList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading contacts/i)).toBeInTheDocument();
    });
  });
});
```

## Service Testing Standards

### **Unit Testing Services**
```typescript
// tests/services/ContactService.test.ts
import { ContactService } from '@/services/ContactService';
import { ContactRepository } from '@/repositories/ContactRepository';
import { DomainError } from '@/errors/DomainError';

describe('ContactService', () => {
  let service: ContactService;
  let mockRepository: jest.Mocked<ContactRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
    } as any;

    service = new ContactService(mockRepository);
  });

  describe('createContact', () => {
    it('should create contact with valid data', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const user = { id: 'user-1', organizationId: 'org-1' };
      const expectedContact = { id: 'contact-1', ...contactData, organizationId: 'org-1' };

      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(expectedContact);

      // Act
      const result = await service.createContact(contactData, user);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual(expectedContact);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('john@example.com', 'org-1');
      expect(mockRepository.create).toHaveBeenCalledWith(contactData, 'org-1');
    });

    it('should return error for duplicate email', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const user = { id: 'user-1', organizationId: 'org-1' };
      const existingContact = { id: 'contact-1', email: 'john@example.com' };

      mockRepository.findByEmail.mockResolvedValue(existingContact);

      // Act
      const result = await service.createContact(contactData, user);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.error).toBeInstanceOf(DomainError);
      expect(result.error.code).toBe('DUPLICATE_CONTACT');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });
});
```

## Integration Testing Standards

### **API Endpoint Testing**
```typescript
// tests/api/contacts.test.ts
import request from 'supertest';
import { app } from '@/app';
import { setupTestDatabase, cleanupTestDatabase, createTestUser } from '../helpers/database';

describe('Contacts API', () => {
  let db: Database;
  let testUser: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  beforeEach(async () => {
    await db.delete(contactsTable);
  });

  describe('GET /api/contacts', () => {
    it('should return contacts for authenticated user', async () => {
      // Arrange
      await db.insert(contactsTable).values({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        organizationId: testUser.organizationId,
      });

      // Act
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/contacts')
        .expect(401);
    });
  });

  describe('POST /api/contacts', () => {
    it('should create contact with valid data', async () => {
      const contactData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(contactData)
        .expect(201);

      expect(response.body.data).toMatchObject(contactData);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        firstName: '',
        email: 'invalid-email',
      };

      await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(invalidData)
        .expect(400);
    });
  });
});
```

## Test Data Management

### **Factory Pattern for Test Data**
```typescript
// tests/factories/ContactFactory.ts
import { faker } from '@faker-js/faker';
import { Contact, CreateContactData } from '@/types';

export class ContactFactory {
  static create(overrides: Partial<CreateContactData> = {}): CreateContactData {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      company: faker.company.name(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: Partial<CreateContactData> = {}): CreateContactData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createWithId(overrides: Partial<Contact> = {}): Contact {
    return {
      id: faker.string.uuid(),
      organizationId: faker.string.uuid(),
      ...this.create(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }
}
```

### **Test Fixtures**
```typescript
// tests/fixtures/contacts.ts
import { ContactFactory } from '../factories/ContactFactory';

export const validContact = ContactFactory.create();
export const contactWithInvalidEmail = ContactFactory.create({
  email: 'invalid-email',
});
export const contactWithDuplicateEmail = ContactFactory.create({
  email: 'duplicate@example.com',
});

export const contactList = ContactFactory.createMany(5);
```

## Test Configuration

### **Vitest Configuration**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
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
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### **Package.json Test Scripts**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:unit": "vitest run --config vitest.unit.config.ts"
  }
}
```

## Anti-Patterns

❌ **Never** use production database in tests
❌ **Never** skip cleanup between tests
❌ **Never** test implementation details instead of behavior
❌ **Never** use real network calls in unit tests
❌ **Never** create tests without assertions
❌ **Never** use vague test names
❌ **Never** mock everything (test real logic when possible)
❌ **Never** ignore test coverage thresholds

## Quality Checklist

- [ ] Tests use describe/it structure
- [ ] Test names are descriptive and clear
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] External services are mocked with MSW
- [ ] Database tests use isolated test database
- [ ] Test data is cleaned up between tests
- [ ] Tests have proper assertions
- [ ] Integration tests cover API endpoints
- [ ] Unit tests cover business logic
- [ ] Coverage thresholds are met
- [ ] No production dependencies in test code
- [ ] Test files are co-located with source files

This rule ensures comprehensive, maintainable tests that provide confidence in code quality and prevent regressions.
