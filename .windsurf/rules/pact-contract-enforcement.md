---
trigger: model_decision
description: Pact contract enforcement for API contracts with consumer-driven testing and provider verification
---

# Pact Contract Enforcement

## Core Principle

### Consumer-Driven Contract Testing
All API contracts must be enforced through consumer-driven contract testing using Pact. This ensures that API changes don't break existing integrations and provides confidence in backward compatibility.

## Required Implementation

### 1. Pact Consumer Testing
```typescript
// ✅ CORRECT - Consumer pact testing setup
import { Pact, Matchers } from '@pact-foundation/pact';
import { API_BASE_URL } from '../config';

describe('User API Consumer', () => {
  const provider = new Pact({
    consumer: 'apex-web-client',
    provider: 'apex-api-server',
    port: 1234,
    logLevel: 'INFO',
  });

  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'users exist',
        uponReceiving: 'a request for users',
        withRequest: {
          method: 'GET',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: [
              {
                id: Matchers.like(1),
                name: Matchers.somethingLike('John Doe'),
                email: Matchers.like('john@example.com'),
                createdAt: Matchers.isoDateTime('2023-01-01T00:00:00Z'),
              },
              {
                id: Matchers.like(2),
                name: Matchers.somethingLike('Jane Smith'),
                email: Matchers.like('jane@example.com'),
                createdAt: Matchers.isoDateTime('2023-01-02T00:00:00Z'),
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
            },
          },
        },
      });
    });

    it('should return a list of users', async () => {
      const response = await fetch(`${provider.mockService.baseUrl}/api/users`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).toHaveProperty('email');
      expect(data.data[0]).toHaveProperty('createdAt');
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
      });
    });
  });

  describe('POST /api/users', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'user creation is available',
        uponReceiving: 'a request to create a user',
        withRequest: {
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            name: 'New User',
            email: 'newuser@example.com',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: Matchers.like(123),
            name: 'New User',
            email: 'newuser@example.com',
            createdAt: Matchers.isoDateTime('2023-01-01T00:00:00Z'),
          },
        },
      });
    });

    it('should create a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
      };

      const response = await fetch(`${provider.mockService.baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(userData.name);
      expect(data.email).toBe(userData.email);
      expect(data).toHaveProperty('createdAt');
    });
  });

  describe('PUT /api/users/:id', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request to update a user',
        withRequest: {
          method: 'PUT',
          path: '/api/users/1',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            name: 'Updated User',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: 1,
            name: 'Updated User',
            email: 'user@example.com',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: Matchers.isoDateTime('2023-01-02T00:00:00Z'),
          },
        },
      });
    });

    it('should update a user', async () => {
      const updateData = { name: 'Updated User' };

      const response = await fetch(`${provider.mockService.baseUrl}/api/users/1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.id).toBe(1);
      expect(data.name).toBe(updateData.name);
      expect(data).toHaveProperty('updatedAt');
    });
  });
});

// ❌ INCORRECT - No consumer contract testing
describe('User API', () => {
  it('should return users', async () => {
    const response = await fetch('/api/users');
    expect(response.status).toBe(200);
    // No contract enforcement - brittle tests
  });
});
```

### 2. Pact Provider Verification
```typescript
// ✅ CORRECT - Provider verification setup
import { Verifier } from '@pact-foundation/pact';
import { API_BASE_URL } from '../config';

describe('User API Provider', () => {
  const verifier = new Verifier({
    provider: 'apex-api-server',
    logLevel: 'INFO',
    providerBaseUrl: API_BASE_URL,
  });

  describe('User API contract verification', () => {
    it('should validate the user contract', async () => {
      await verifier.verifyPact({
        pactUrls: [
          'http://localhost:1234/pacts/apex-web-client-apex-api-server.json',
        ],
        providerStatesSetup: {
          'users exist': async () => {
            // Setup database with test data
            await setupTestUsers();
          },
          'user creation is available': async () => {
            // Ensure user creation endpoint is available
            await cleanupTestUsers();
          },
          'user exists': async () => {
            // Create a specific user for testing
            await createTestUser();
          },
        },
        requestFilter: (interaction) => {
          // Filter out health checks and other non-contract requests
          return !interaction.path.includes('/health') && 
                 !interaction.path.includes('/metrics');
        },
      });
    });
  });
});

async function setupTestUsers(): Promise<void> {
  // Create test users in database
  await prisma.user.createMany([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date('2023-01-01T00:00:00Z'),
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: new Date('2023-01-02T00:00:00Z'),
    },
  ]);
}

async function cleanupTestUsers(): Promise<void> {
  // Clean up test users
  await prisma.user.deleteMany();
}

async function createTestUser(): Promise<void> {
  // Create a specific user for testing
  await prisma.user.create({
    data: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date('2023-01-01T00:00:00Z'),
    },
  });
}

// ❌ INCORRECT - No provider verification
describe('User API Provider', () => {
  it('should be running', async () => {
    const response = await fetch('/health');
    expect(response.status).toBe(200);
    // No contract verification - no guarantee of compatibility
  });
});
```

### 3. Pact Broker Integration
```typescript
// ✅ CORRECT - Pact broker integration
import { PactBroker } from '@pact-foundation/pact';

export class PactBrokerManager {
  private broker: PactBroker;

  constructor(brokerUrl: string) {
    this.broker = new PactBroker({
      brokerUrl,
    });
  }

  async publishPacts(consumerName: string, consumerVersion: string): Promise<void> {
    try {
      await this.broker.publishPacts({
        consumerVersion,
        pactFilesOrDirs: ['./pacts/*.json'],
        consumerName,
        tags: ['production', 'main'],
        branch: 'main',
      });
      
      console.log(`✅ Published pacts for ${consumerName} version ${consumerVersion}`);
    } catch (error) {
      console.error(`❌ Failed to publish pacts: ${error.message}`);
      throw error;
    }
  }

  async getLatestPacts(providerName: string): Promise<any[]> {
    try {
      const pacts = await this.broker.getPacts({
        providerName,
        latest: true,
        tag: ['production'],
      });
      
      return pacts;
    } catch (error) {
      console.error(`❌ Failed to get latest pacts: ${error.message}`);
      throw error;
    }
  }

  async verifyPactWithBroker(
    providerName: string,
    providerVersion: string,
    consumerVersion: string
  ): Promise<void> {
    try {
      const result = await this.broker.verifyPacts({
        providerName,
        providerVersion,
        consumerVersion,
        pactBrokerUrl: process.env.PACT_BROKER_URL,
        publishVerificationResults: true,
        providerStatesSetupUrl: `${API_BASE_URL}/pact/states`,
        requestFilter: (interaction) => {
          // Filter out non-contract requests
          return !interaction.path.includes('/health') && 
                 !interaction.path.includes('/metrics');
        },
      });

      if (result.some(result => !result.ok)) {
        const failed = result.filter(r => !r.ok);
        throw new Error(`Pact verification failed: ${failed.length} failures`);
      }
      
      console.log(`✅ Verified pact for ${providerName} version ${providerVersion}`);
    } catch (error) {
      console.error(`❌ Failed to verify pact: ${error.message}`);
      throw error;
    }
  }
}

// ❌ INCORRECT - No broker integration
class ManualPactManagement {
  async publishPacts(): Promise<void> {
    // Manual pact publishing - error-prone
    console.log('Please manually upload pact files to broker');
  }
}
```

### 4. Contract Enforcement Middleware
```typescript
// ✅ CORRECT - Contract enforcement middleware
export class ContractEnforcement {
  private pactBrokerManager: PactBrokerManager;
  private cachedPacts: Map<string, any> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor(pactBrokerUrl: string) {
    this.pactBrokerManager = new PactBrokerManager(pactBrokerUrl);
  }

  async enforceContract(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // Skip enforcement for health checks and metrics
    if (req.path.includes('/health') || req.path.includes('/metrics')) {
      return next();
    }

    try {
      // Get relevant pacts for this request
      const pacts = await this.getRelevantPacts(req);
      
      if (pacts.length === 0) {
        return next();
      }

      // Validate request against contracts
      const validationResult = await this.validateRequest(req, pacts);
      
      if (!validationResult.isValid) {
        console.error('Contract violation detected:', validationResult.error);
        
        return res.status(400).json({
          error: 'Contract violation',
          message: 'Request does not match API contract',
          details: validationResult.error,
        });
      }

      // Validate response against contracts
      const responseValidationResult = await this.validateResponse(res, pacts);
      
      if (!responseValidationResult.isValid) {
        console.error('Response contract violation detected:', responseValidationResult.error);
        
        // Log the violation but don't block the response
        console.warn('Response contract violation detected - this should be fixed');
      }

      next();
    } catch (error) {
      console.error('Contract enforcement error:', error);
      // Don't block requests due to contract enforcement errors
      next();
    }
  }

  private async getRelevantPacts(req: Request): Promise<any[]> {
    const cacheKey = `${req.method}:${req.path}`;
    
    // Check cache first
    if (this.cachedPacts.has(cacheKey)) {
      const cached = this.cachedPacts.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.pacts;
      }
    }

    try {
      // Get latest pacts from broker
      const pacts = await this.pactBrokerManager.getLatestPacts('apex-api-server');
      
      // Filter pacts relevant to this request
      const relevantPacts = pacts.filter(pact => {
        const interactions = pact.interactions || [];
        return interactions.some(interaction => 
          interaction.request.method === req.method &&
          interaction.request.path === req.path
        );
      });

      // Cache the result
      this.cachedPacts.set(cacheKey, {
        pacts: relevantPacts,
        timestamp: Date.now(),
      });

      return relevantPacts;
    } catch (error) {
      console.error('Failed to get pacts from broker:', error);
      return [];
    }
  }

  private async validateRequest(req: Request, pacts: any[]): Promise<ValidationResult> {
    for (const pact of pacts) {
      const interactions = pact.interactions || [];
      
      for (const interaction of interactions) {
        if (interaction.request.method === req.method && 
            interaction.request.path === req.path) {
          
          // Validate request body if present
          if (interaction.request.body && req.body) {
            const bodyValidation = this.validateBody(req.body, interaction.request.body);
            if (!bodyValidation.isValid) {
              return {
                isValid: false,
                error: `Request body validation failed: ${bodyValidation.error}`,
              };
            }
          }

          // Validate request headers
          if (interaction.request.headers) {
            const headerValidation = this.validateHeaders(req.headers, interaction.request.headers);
            if (!headerValidation.isValid) {
              return {
                isValid: false,
                error: `Request header validation failed: ${headerValidation.error}`,
              };
            }
          }

          return { isValid: true };
        }
      }
    }

    return { isValid: true };
  }

  private async validateResponse(res: Response, pacts: any[]): Promise<ValidationResult> {
    // This would be implemented after the response is generated
    // For now, we'll skip response validation
    return { isValid: true };
  }

  private validateBody(actualBody: any, expectedBody: any): ValidationResult {
    // Simple body validation
    if (typeof actualBody !== typeof expectedBody) {
      return {
        isValid: false,
        error: `Expected body type ${typeof expectedBody}, got ${typeof actualBody}`,
      };
    }

    // For objects, validate structure
    if (typeof actualBody === 'object' && typeof expectedBody === 'object') {
      for (const [key, expectedValue] of Object.entries(expectedBody)) {
        if (!(key in actualBody)) {
          return {
            isValid: false,
            error: `Missing required property: ${key}`,
          };
        }
      }
    }

    return { isValid: true };
  }

  private validateHeaders(actualHeaders: any, expectedHeaders: any): ValidationResult {
    // Simple header validation
    for (const [key, expectedValue] of Object.entries(expectedHeaders)) {
      const actualValue = actualHeaders[key.toLowerCase()];
      
      if (expectedValue && !actualValue) {
        return {
          isValid: false,
          error: `Missing required header: ${key}`,
        };
      }
    }

    return { isValid: true };
  }
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ❌ INCORRECT - No contract enforcement
app.use((req, res, next) => {
  // No contract validation - requests may break contracts
  next();
});
```

## Implementation Patterns

### 1. Consumer Test Configuration
```typescript
// ✅ CORRECT - Consumer test configuration
export class ConsumerTestConfig {
  static createPactProvider(consumerName: string, providerName: string): Pact {
    return new Pact({
      consumer: consumerName,
      provider: providerName,
      port: 1234,
      logLevel: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO',
      spec: {
        version: '3.0.0',
      },
    });
  }

  static setupInteraction(
    provider: Pact,
    state: string,
    description: string,
    request: any,
    response: any
  ): Promise<void> {
    await provider.addInteraction({
      state,
      uponReceiving: description,
      withRequest: request,
      willRespondWith: response,
    });
  }

  static createMatcher(value: any): any {
    if (typeof value === 'string') {
      return Matchers.somethingLike(value);
    }
    if (typeof value === 'number') {
      return Matchers.like(value);
    }
    if (value instanceof Date) {
      return Matchers.isoDateTime(value.toISOString());
    }
    return value;
  }
}

// ❌ INCORRECT - No test configuration
describe('API Tests', () => {
  // No pact provider setup
  it('should work', async () => {
    // Direct API calls without contract enforcement
  });
});
```

### 2. Provider State Management
```typescript
// ✅ CORRECT - Provider state management
export class ProviderStateManager {
  private stateHandlers: Map<string, () => Promise<void>>;

  constructor() {
    this.stateHandlers = new Map();
    this.registerStateHandlers();
  }

  private registerStateHandlers(): void {
    this.stateHandlers.set('users exist', this.setupUsersState);
    this.stateHandlers.set('user creation is available', this.setupUserCreationState);
    this.stateHandlers.set('user exists', this.setupUserExistsState);
    this.stateHandlers.set('projects exist', this.setupProjectsState);
    this.stateHandlers.set('project creation is available', this.setupProjectCreationState);
  }

  async setupState(state: string): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler) {
      await handler();
    } else {
      console.warn(`No state handler found for: ${state}`);
    }
  }

  private async setupUsersState(): Promise<void> {
    // Clean up existing data
    await this.cleanupUsers();
    
    // Create test data
    await this.createTestUsers();
  }

  private async setupUserCreationState(): Promise<void> {
    // Clean up existing data
    await this.cleanupUsers();
    
    // Ensure clean slate for user creation
  }

  private async setupUserExistsState(): Promise<void> {
    // Clean up existing data
    await this.cleanupUsers();
    
    // Create specific test user
    await this.createTestUser();
  }

  private async setupProjectsState(): Promise<void> {
    // Clean up existing data
    await this.cleanupProjects();
    
    // Create test data
    await this.createTestProjects();
  }

  private async setupProjectCreationState(): Promise<void> {
    // Clean up existing data
    await this.cleanupProjects();
    
    // Ensure clean slate for project creation
  }

  private async cleanupUsers(): Promise<void> {
    await prisma.user.deleteMany();
  }

  private async createTestUsers(): Promise<void> {
    await prisma.user.createMany([
      {
        id: 1,
        name: 'Test User 1',
        email: 'test1@example.com',
        createdAt: new Date('2023-01-01T00:00:00Z'),
      },
      {
        id: 2,
        name: 'Test User 2',
        email: 'test2@example.com',
        createdAt: new Date('2023-01-02T00:00:00Z'),
      },
    ]);
  }

  private async createTestUser(): Promise<void> {
    await prisma.user.create({
      data: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date('2023-01-01T00:00:00Z'),
      },
    });
  }

  private async cleanupProjects(): Promise<void> {
    await prisma.project.deleteMany();
  }

  private async createTestProjects(): Promise<void> {
    await prisma.project.createMany([
      {
        id: 1,
        name: 'Test Project 1',
        description: 'A test project',
        createdAt: new Date('2023-01-01T00:00:00Z'),
      },
      ]);
  }
}

// ❌ INCORCORRECT - No state management
describe('Provider Verification', () => {
  it('should verify contracts', async () => {
    // No state setup - tests may fail due to missing data
    const verifier = new Verifier({ provider: 'api-server' });
    await verifier.verifyPact({ pactUrls: ['pact.json'] });
  });
});
```

### 3. CI/CD Integration
```yaml
# ✅ CORRECT - CI/CD pipeline with Pact testing
name: Contract Testing

on:
  pull_request:
    branches: [main]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run consumer tests
      run: npm run test:consumer

    - name: Upload pact files
      uses: actions/upload-artifact@v4
      with:
        name: pact-files
        path: ./pacts/*.json

  provider-tests:
    runs-on: ubuntu-latest
    needs: consumer-tests
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Start application
      run: |
        npm run build
        npm run start:test &
        sleep 10

    - name: Download pact files
      uses: actions/download-artifact@v4
      with:
        name: pact-files
        path: ./pacts

    - name: Run provider tests
      run: npm run test:provider

    - name: Publish pacts to broker
      run: npm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}

  contract-verification:
    runs-on: ubuntu-latest
    needs: provider-tests
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Verify contracts with broker
      run: npm run pact:verify
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PROVIDER_VERSION: ${{ github.sha }}
          CONSUMER_VERSION: ${{ github.event.pull_request.head.sha }}

# ❌ INCORRECT - No CI/CD integration
# Manual testing only - no automation
```

## Testing Strategies

### 1. Consumer Testing Best Practices
```typescript
// ✅ CORRECT - Comprehensive consumer testing
describe('User API Consumer', () => {
  const provider = ConsumerTestConfig.createPactProvider('web-client', 'api-server');

  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('User management', () => {
    describe('GET /api/users', () => {
      it('should return paginated users', async () => {
        await ConsumerTestConfig.setupInteraction(
          provider,
          'users exist',
          'a request for users with pagination',
          {
            method: 'GET',
            path: '/api/users',
            query: { page: '1', limit: '10' },
          },
          {
            status: 200,
            body: {
              data: [
                ConsumerTestConfig.createMatcher({
                  id: 1,
                  name: 'Test User',
                  email: 'test@example.com',
                }),
              ],
              pagination: {
                page: 1,
                limit: 10,
                total: 1,
              },
            },
          }
        );

        const response = await fetch(`${provider.mockService.baseUrl}/api/users?page=1&limit=10`);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        
        expect(data.data).toHaveLength(1);
        expect(data.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 1,
        });
      });

      it('should handle empty user list', async () => {
        await ConsumerTestConfig.setupInteraction(
          provider,
          'no users exist',
          'a request for users when none exist',
          {
            method: 'GET',
            path: '/api/users',
          },
          {
            status: 200,
            body: {
              data: [],
              pagination: {
                page: 1,
                limit: 10,
                total: 0,
              },
            },
          }
        );

        const response = await fetch(`${provider.mockService.baseUrl}/api/users`);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        
        expect(data.data).toHaveLength(0);
        expect(data.pagination.total).toBe(0);
      });
    });

    describe('POST /api/users', () => {
      it('should create a user with generated ID', async () => {
        const userData = {
          name: 'New User',
          email: 'newuser@example.com',
        };

        await ConsumerTestConfig.setupInteraction(
          provider,
          'user creation is available',
          'a request to create a new user',
          {
            method: 'POST',
            path: '/api/users',
            body: userData,
          },
          {
            status: 201,
            body: {
              id: ConsumerTestConfig.createMatcher(123),
              name: userData.name,
              email: userData.email,
              createdAt: ConsumerTestConfig.createMatcher(new Date()),
            },
          }
        );

        const response = await fetch(`${provider.mockService.baseUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        
        expect(data.id).toBeDefined();
        expect(data.name).toBe(userData.name);
        expect(data.email).toBe(userData.email);
        expect(data.createdAt).toBeDefined();
      });

      it('should validate required fields', async () => {
        await ConsumerTestConfig.setupInteraction(
          provider,
          'user creation is available',
          'a request to create a user with missing required field',
          {
            method: 'POST',
            path: '/api/users',
            body: {
              name: 'User Without Email',
              // Missing required email field
            },
          },
          {
            status: 400,
            body: {
              error: 'Email is required',
            },
          }
        );

        const response = await fetch(`${provider.mockService.baseUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'User Without Email' }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Email is required');
      });
    });
  });
});

// ❌ INCORRECT - Minimal consumer testing
describe('User API Consumer', () => {
  it('should work', async () => {
    const response = await fetch('/api/users');
    expect(response.status).toBe(200);
    // No contract enforcement, no validation
  });
});
```

### 2. Provider Testing Best Practices
```typescript
// ✅ CORRECT - Comprehensive provider testing
describe('User API Provider', () => {
  const verifier = new Verifier({
    provider: 'apex-api-server',
    logLevel: 'INFO',
    providerBaseUrl: API_BASE_URL,
    requestFilter: (interaction) => {
      // Filter out non-contract requests
      return !interaction.path.includes('/health') && 
             !interaction.path.includes('/metrics') &&
             !interaction.path.includes('/pact');
    },
  });

  describe('Consumer contract verification', () => {
    it('should validate all consumer contracts', async () => {
      await verifier.verifyPact({
        pactUrls: [
          'http://localhost:1234/pacts/web-client-api-server.json',
          'http://localhost:1235/pacts/mobile-client-api-server.json',
        ],
        providerStatesSetup: {
          'users exist': async () => {
            await setupTestUsers();
          },
          'user creation is available': async () => {
            await cleanupTestUsers();
          },
          'user exists': async () => {
            await createTestUser();
          },
        },
        timeout: 30000, // 30 seconds timeout
      });
    });

    it('should handle missing provider state gracefully', async () => {
      // Test what happens when a provider state is not implemented
      await verifier.verifyPact({
        pactUrls: ['http://localhost:1234/pacts/web-client-api-server.json'],
        providerStatesSetup: {
          'unknown state': async () => {
            // This state is not implemented
            console.log('Unknown state - should handle gracefully');
          },
        },
      });
    });
  });

  describe('State management', () => {
    it('should setup users state correctly', async () => {
      const stateManager = new ProviderStateManager();
      
      await stateManager.setupState('users exist');
      
      const users = await prisma.user.findMany();
      expect(users).toHaveLength(2);
    });

    it('should cleanup users state correctly', async () => {
      const stateManager = new ProviderStateManager();
      
      await stateManager.setupState('user creation is available');
      
      const users = await prisma.user.findMany();
      expect(users).toHaveLength(0);
    });
  });
});

// ❌ INCORRECT - Minimal provider testing
describe('User API Provider', () => {
  it('should verify contracts', async () => {
    const verifier = new Verifier({ provider: 'api-server' });
    await verifier.verifyPact({ pactUrls: ['pact.json'] });
    // No state setup, no timeout, no filtering
  });
});
```

## Common Anti-Patterns

### 1. Never Do These
- **Don't skip consumer testing**: All consumers must have contract tests
- **Don't skip provider verification**: All providers must verify contracts
- **Don't use hardcoded test data**: Use proper state management
- **Don't ignore contract violations**: All violations should be addressed
- **Don't skip CI/CD integration**: Contract testing must be automated

### 2. Common Mistakes
```typescript
// ❌ WRONG - No consumer testing
function testUserAPI() {
  it('should return users', async () => {
    const response = await fetch('/api/users');
    expect(response.status).toBe(200);
    // No contract enforcement
  });
}

// ❌ WRONG - No provider verification
function verifyProvider() {
  // No pact verification - no guarantee of compatibility
  console.log('Please manually verify provider contracts');
}

// ❌ WRONG - Hardcoded test data
describe('User API', () => {
  it('should return specific user', async () => {
    const response = await fetch('/api/users/1');
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.id).toBe(1); // Hardcoded ID
    expect(data.name).toBe('Test User'); // Hardcoded name
    // Test will fail when data changes
  });
});

// ❌ WRONG - No state management
describe('Provider Verification', () => {
  it('should verify contracts', async () => {
    const verifier = new Verifier({ provider: 'api-server' });
    await verifier.verifyPact({ pactUrls: ['pact.json'] });
    // No state setup - tests may fail
  });
});

// ❌ WRONG - No CI/CD integration
// Manual testing only - no automation
```

## Compliance Checklist

- [ ] All consumers have Pact contract tests
- [ ] All providers verify contracts with Pact broker
- [ ] Pact broker is configured and accessible
- [ ] Consumer tests use proper matchers
- [ ] Provider tests implement state management
- [ ] Contract violations are detected and reported
- [ ] CI/CD pipeline includes contract testing
- [ ] Pact files are published to broker
- [ ] Contract verification is automated
- [ ] Request and response validation is implemented
- [ ] State handlers are comprehensive
- [ ] Test data is properly managed
- [ ] Contract tests are maintained and updated
- [ ] Provider states are documented
- [ ] Contract testing follows best practices
- [ ] Mock providers are properly configured
- [ ] Error handling is implemented
- [ ] Logging is comprehensive
- [ ] Performance impact is minimal
- [ ] Contract testing is integrated with existing test suite
- [ ] Contract testing covers all API endpoints
- [ ] Contract testing covers all HTTP methods
- [ ] Contract testing covers all request/response schemas
- [ ] Contract testing includes edge cases
- [ ] Contract testing includes error scenarios
- [ ] Contract testing is versioned and tracked
- [ ] Contract testing is documented for developers
- [ ] Contract testing is part of quality gates
- [ ] Contract testing failures block deployments
- [ ] Contract testing results are communicated
- [ ] Contract testing is monitored and maintained
- [ ] Contract testing supports multiple consumers
- [ ] Contract testing supports multiple providers
- [ ] Contract testing is scalable and maintainable
- [ ] Contract testing follows industry standards
- [ ] Contract testing is integrated with monitoring
- [ ] Contract testing supports rollback scenarios
- [ ] Contract testing includes migration testing
- [ ] Contract testing includes performance testing
- [ ] Contract testing is secure and compliant
- [ ] Contract testing is accessible and documented
- [ ] Contract testing is automated and reliable
