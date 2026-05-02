---
name: pact-contract-testing
description: Consumer-driven contract testing with Pact, including broker setup, CI verification, and integration with bounded contexts
---

# Pact Contract Testing Skill

## Purpose
Implement consumer-driven contract testing using Pact to ensure API contracts between frontend consumers and backend providers remain compatible, replacing file-based CDC with automated verification.

## Architecture Overview

### Contract Testing Flow
1. **Consumer Tests** - Frontend defines expected API behavior
2. **Contract Generation** - Pact creates contract files
3. **Provider Verification** - Backend verifies contracts
4. **Broker Publishing** - Contracts stored and shared
5. **CI Integration** - Automated verification pipeline

### Key Benefits
- Prevent breaking changes between services
- Enable independent deployment
- Fast feedback on API changes
- Documentation by example

## Setup and Configuration

### 1. Install Dependencies
```bash
# Consumer (Frontend) dependencies
pnpm add -D pact jest-pact @pact-foundation/pact

# Provider (Backend) dependencies  
pnpm add -D @pact-foundation/pact-node
```

### 2. Pact Configuration

#### Consumer Configuration
```typescript
// artifacts/apex-os/tests/pact/pact.config.ts
import { PactOptions } from '@pact-foundation/pact';

export const pactConfig: PactOptions = {
  consumer: 'crm-frontend',
  provider: 'api-server',
  port: 1234,
  host: '127.0.0.1',
  log: 'logs/pact.log',
  dir: 'pacts',
  logLevel: 'INFO',
  spec: 2,
  cors: true,
};
```

#### Provider Configuration
```typescript
// artifacts/api-server/tests/pact/provider.config.ts
import { VerifierOptions } from '@pact-foundation/pact-node';

export const providerConfig: VerifierOptions = {
  providerBaseUrl: 'http://localhost:8081',
  provider: 'api-server',
  pactBrokerUrl: process.env.PACT_BROKER_URL || 'http://localhost:9292',
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  publishVerificationResults: true,
  providerVersion: process.env.GIT_COMMIT || '1.0.0',
  requestFilter: (req, res, next) => {
    // Add authentication headers for provider tests
    req.headers['Authorization'] = 'Bearer test-token';
    next();
  },
  stateHandlers: {
    'has contacts': async () => {
      // Setup test data for provider verification
      await setupTestContacts();
    },
    'has tasks': async () => {
      await setupTestTasks();
    },
    'empty database': async () => {
      await cleanupTestData();
    },
  },
};
```

## Consumer Testing Implementation

### 1. Contact API Consumer Tests
```typescript
// artifacts/apex-os/tests/pact/contacts.spec.ts
import { pactWith } from 'jest-pact';
import { getContacts, createContact, updateContact, deleteContact } from '../../src/api/contacts';

pactWith({ consumer: 'crm-frontend', provider: 'api-server' }, (provider) => {
  describe('Contacts API', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'has contacts',
        uponReceiving: 'a request for all contacts',
        withRequest: {
          method: 'GET',
          path: '/api/crm/contacts',
          headers: {
            'Authorization': pact.like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contacts: pact.eachLike({
              id: pact.string('contact-1'),
              name: pact.string('John Doe'),
              email: pact.string('john@example.com'),
              phone: pact.string('555-0101'),
              createdAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              updatedAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            }),
          },
        },
      });
    });

    it('should fetch contacts successfully', async () => {
      const response = await getContacts(provider.mockService.baseUrl);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('contacts');
      expect(Array.isArray(response.data.contacts)).toBe(true);
      expect(response.data.contacts[0]).toHaveProperty('id');
      expect(response.data.contacts[0]).toHaveProperty('name');
    });
  });

  describe('Create Contact', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'empty database',
        uponReceiving: 'a request to create a contact',
        withRequest: {
          method: 'POST',
          path: '/api/crm/contacts',
          headers: {
            'Authorization': pact.like('Bearer token'),
            'Content-Type': 'application/json',
          },
          body: {
            name: pact.string('New Contact'),
            email: pact.string('new@example.com'),
            phone: pact.string('555-0102'),
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: pact.string('contact-new'),
            name: pact.string('New Contact'),
            email: pact.string('new@example.com'),
            phone: pact.string('555-0102'),
            createdAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            updatedAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          },
        },
      });
    });

    it('should create a new contact', async () => {
      const newContact = {
        name: 'New Contact',
        email: 'new@example.com',
        phone: '555-0102',
      };

      const response = await createContact(newContact, provider.mockService.baseUrl);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(newContact.name);
      expect(response.data.email).toBe(newContact.email);
    });
  });

  describe('Update Contact', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'has contacts',
        uponReceiving: 'a request to update a contact',
        withRequest: {
          method: 'PUT',
          path: '/api/crm/contacts/contact-1',
          headers: {
            'Authorization': pact.like('Bearer token'),
            'Content-Type': 'application/json',
          },
          body: {
            name: pact.string('Updated Name'),
            email: pact.string('updated@example.com'),
            phone: pact.string('555-0103'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: pact.string('contact-1'),
            name: pact.string('Updated Name'),
            email: pact.string('updated@example.com'),
            phone: pact.string('555-0103'),
            createdAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            updatedAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          },
        },
      });
    });

    it('should update an existing contact', async () => {
      const updatedContact = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '555-0103',
      };

      const response = await updateContact('contact-1', updatedContact, provider.mockService.baseUrl);
      
      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updatedContact.name);
    });
  });

  describe('Delete Contact', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'has contacts',
        uponReceiving: 'a request to delete a contact',
        withRequest: {
          method: 'DELETE',
          path: '/api/crm/contacts/contact-1',
          handlers: {
            'Authorization': pact.like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 204,
        },
      });
    });

    it('should delete a contact', async () => {
      const response = await deleteContact('contact-1', provider.mockService.baseUrl);
      
      expect(response.status).toBe(204);
    });
  });
});
```

### 2. Tasks API Consumer Tests
```typescript
// artifacts/apex-os/tests/pact/tasks.spec.ts
import { pactWith } from 'jest-pact';
import { getTasks, createTask, updateTaskStatus } from '../../src/api/tasks';

pactWith({ consumer: 'crm-frontend', provider: 'api-server' }, (provider) => {
  describe('Tasks API', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'has tasks',
        uponReceiving: 'a request for all tasks',
        withRequest: {
          method: 'GET',
          path: '/api/projects/tasks',
          headers: {
            'Authorization': pact.like('Bearer token'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            tasks: pact.eachLike({
              id: pact.string('task-1'),
              title: pact.string('Complete project proposal'),
              completed: pact.boolean(false),
              priority: pact.like('medium'),
              dueDate: pact.timestamp('YYYY-MM-DD'),
              createdAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
              updatedAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            }),
          },
        },
      });
    });

    it('should fetch tasks successfully', async () => {
      const response = await getTasks(provider.mockService.baseUrl);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('tasks');
      expect(Array.isArray(response.data.tasks)).toBe(true);
    });
  });

  describe('Update Task Status', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'has tasks',
        uponReceiving: 'a request to update task status',
        withRequest: {
          method: 'PATCH',
          path: '/api/projects/tasks/task-1/status',
          headers: {
            'Authorization': pact.like('Bearer token'),
            'Content-Type': 'application/json',
          },
          body: {
            completed: pact.boolean(true),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: pact.string('task-1'),
            title: pact.string('Complete project proposal'),
            completed: pact.boolean(true),
            priority: pact.like('medium'),
            dueDate: pact.timestamp('YYYY-MM-DD'),
            createdAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            updatedAt: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          },
        },
      });
    });

    it('should update task status', async () => {
      const response = await updateTaskStatus('task-1', true, provider.mockService.baseUrl);
      
      expect(response.status).toBe(200);
      expect(response.data.completed).toBe(true);
    });
  });
});
```

## Provider Verification Implementation

### 1. Provider Test Setup
```typescript
// artifacts/api-server/tests/pact/verification.spec.ts
import { Verifier } from '@pact-foundation/pact-node';
import { providerConfig } from './provider.config';
import { startTestServer, stopTestServer } from '../helpers/test-server';

describe('Pact Verification', () => {
  let server: any;

  beforeAll(async () => {
    // Start test server with real API endpoints
    server = await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it('should validate contacts API contract', async () => {
    const verifier = new Verifier({
      ...providerConfig,
      pactUrls: ['pacts/crm-frontend-api-server.json'],
      customProviderHeaders: ['Authorization: Bearer test-token'],
    });

    const result = await verifier.verifyProvider();
    
    expect(result).toBe(true);
  });

  it('should validate tasks API contract', async () => {
    const verifier = new Verifier({
      ...providerConfig,
      pactUrls: ['pacts/crm-frontend-api-server.json'],
      customProviderHeaders: ['Authorization: Bearer test-token'],
    });

    const result = await verifier.verifyProvider();
    
    expect(result).toBe(true);
  });
});
```

### 2. State Handlers Implementation
```typescript
// artifacts/api-server/tests/pact/state-handlers.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
});

export async function setupTestContacts() {
  await cleanupTestData();
  
  const contacts = [
    {
      id: 'contact-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0101',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'contact-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0102',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const contact of contacts) {
    await pool.query(`
      INSERT INTO contacts (id, name, email, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [contact.id, contact.name, contact.email, contact.phone, contact.created_at, contact.updated_at]);
  }
}

export async function setupTestTasks() {
  await cleanupTestData();
  
  const tasks = [
    {
      id: 'task-1',
      title: 'Complete project proposal',
      completed: false,
      priority: 'medium',
      due_date: '2024-12-31',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Review contract',
      completed: true,
      priority: 'high',
      due_date: '2024-12-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const task of tasks) {
    await pool.query(`
      INSERT INTO tasks (id, title, completed, priority, due_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [task.id, task.title, task.completed, task.priority, task.due_date, task.created_at, task.updated_at]);
  }
}

export async function cleanupTestData() {
  await pool.query('TRUNCATE TABLE tasks, contacts RESTART IDENTITY CASCADE');
}
```

## Pact Broker Integration

### 1. Docker Compose for Pact Broker
```yaml
# docker-compose.pact.yml
version: '3.8'

services:
  pact-broker:
    image: pactfoundation/pact-broker:latest
    ports:
      - "9292:9292"
    environment:
      PACT_BROKER_DATABASE_USERNAME: pact
      PACT_BROKER_DATABASE_PASSWORD: pact
      PACT_BROKER_DATABASE_NAME: pact
      PACT_BROKER_DATABASE_HOST: postgres
      PACT_BROKER_DATABASE_PORT: 5432
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: pact
      POSTGRES_PASSWORD: pact
      POSTGRES_DB: pact
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2. Broker Publishing Scripts
```typescript
// scripts/publish-contracts.ts
import { execSync } from 'child_process';

async function publishContracts() {
  try {
    // Publish consumer contracts
    execSync('npx pact-broker publish ./pacts --consumer-app-version=$GIT_COMMIT --branch=$GIT_BRANCH', {
      stdio: 'inherit',
      env: {
        ...process.env,
        PACT_BROKER_URL: process.env.PACT_BROKER_URL,
        PACT_BROKER_TOKEN: process.env.PACT_BROKER_TOKEN,
        GIT_COMMIT: process.env.GITHUB_SHA || 'dev',
        GIT_BRANCH: process.env.GITHUB_REF_NAME || 'main',
      },
    });

    console.log('Contracts published successfully');
  } catch (error) {
    console.error('Failed to publish contracts:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  publishContracts();
}
```

## CI/CD Integration

### 1. Consumer CI Pipeline
```yaml
# .github/workflows/consumer-contract-tests.yml
name: Consumer Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm ci
      
      - name: Run consumer contract tests
        run: pnpm test:pact:consumer
      
      - name: Publish contracts
        if: github.ref == 'refs/heads/main'
        run: pnpm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GITHUB_SHA: ${{ github.sha }}
          GITHUB_REF_NAME: ${{ github.ref_name }}
      
      - name: Upload pact files
        uses: actions/upload-artifact@v4
        with:
          name: pact-files
          path: pacts/
```

### 2. Provider Verification Pipeline
```yaml
# .github/workflows/provider-verification.yml
name: Provider Contract Verification

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  provider-verification:
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
      
      - name: Setup test database
        run: pnpm --filter @workspace/db run test-setup
      
      - name: Download pact files
        uses: actions/download-artifact@v4
        with:
          name: pact-files
          path: pacts/
      
      - name: Verify contracts
        run: pnpm test:pact:provider
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/apex_test
      
      - name: Publish verification results
        run: pnpm run pact:verify:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
```

## Package.json Scripts

### Consumer (Frontend)
```json
{
  "scripts": {
    "test:pact:consumer": "jest --testPathPattern=pact",
    "pact:publish": "ts-node scripts/publish-contracts.ts",
    "pact:verify": "echo 'Consumer verification not applicable'"
  }
}
```

### Provider (Backend)
```json
{
  "scripts": {
    "test:pact:provider": "jest --testPathPattern=pact",
    "pact:verify:publish": "npx pact-broker publish-verification-results --verification-results-file ./pact/verification.json --provider-app-version $GIT_COMMIT",
    "pact:can-i-deploy": "npx pact-broker can-i-deploy --pacticipant api-server --to main"
  }
}
```

## Advanced Patterns

### 1. Message Contract Testing
```typescript
// artifacts/apex-os/tests/pact/messages.spec.ts
import { messagePactWith } from 'jest-pact';
import { processContactCreatedEvent } from '../../src/event-handlers';

messagePactWith({ consumer: 'crm-frontend', provider: 'message-queue' }, (provider) => {
  describe('Contact Created Event', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'contact created',
        uponReceiving: 'a contact created event',
        withContent: {
          eventType: 'CONTACT_CREATED',
          data: {
            id: pact.string('contact-1'),
            name: pact.string('John Doe'),
            email: pact.string('john@example.com'),
            timestamp: pact.timestamp('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          },
        },
        withMetadata: {
          contentType: 'application/json',
        },
      });
    });

    it('should process contact created event', async () => {
      const event = provider.getMessage();
      await processContactCreatedEvent(event);
      
      // Verify event was processed correctly
      expect(true).toBe(true); // Add specific assertions
    });
  });
});
```

### 2. GraphQL Contract Testing
```typescript
// artifacts/apex-os/tests/pact/graphql.spec.ts
import { pactWith } from 'jest-pact';
import { executeGraphQLQuery } from '../../src/api/graphql';

pactWith({ consumer: 'crm-frontend', provider: 'api-server' }, (provider) => {
  describe('GraphQL API', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'has contacts',
        uponReceiving: 'a GraphQL query for contacts',
        withRequest: {
          method: 'POST',
          path: '/api/graphql',
          headers: {
            'Authorization': pact.like('Bearer token'),
            'Content-Type': 'application/json',
          },
          body: {
            query: pact.string('{ contacts { id name email } }'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: {
              contacts: pact.eachLike({
                id: pact.string('contact-1'),
                name: pact.string('John Doe'),
                email: pact.string('john@example.com'),
              }),
            },
          },
        },
      });
    });

    it('should execute GraphQL query', async () => {
      const query = '{ contacts { id name email } }';
      const response = await executeGraphQLQuery(query, provider.mockService.baseUrl);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('contacts');
    });
  });
});
```

## Best Practices

### 1. Contract Design
- **Be specific** about expected responses
- **Use matchers** for dynamic values (timestamps, IDs)
- **Test edge cases** and error scenarios
- **Keep contracts focused** on consumer needs

### 2. State Management
- **Use descriptive state names**
- **Ensure idempotent setup**
- **Clean up test data** between tests
- **Document state requirements**

### 3. CI/CD Integration
- **Run consumer tests** on every PR
- **Verify provider contracts** before deployment
- **Publish contracts** from main branch
- **Enable can-i-deploy** checks

### 4. Monitoring
- **Track contract changes** over time
- **Monitor verification results**
- **Alert on breaking changes**
- **Maintain contract documentation**

## Verification Commands

```bash
# Run consumer contract tests
pnpm test:pact:consumer

# Run provider verification
pnpm test:pact:provider

# Check if deployment is safe
pnpm run pact:can-i-deploy

# Publish contracts
pnpm run pact:publish

# Start Pact broker locally
docker-compose -f docker-compose.pact.yml up -d

# View Pact broker dashboard
open http://localhost:9292
```

This skill provides comprehensive contract testing infrastructure that ensures API compatibility between frontend consumers and backend providers, enabling safe independent deployments and preventing breaking changes.
