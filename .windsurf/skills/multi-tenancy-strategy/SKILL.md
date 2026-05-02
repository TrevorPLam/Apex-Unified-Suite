---
name: multi-tenancy-strategy
description: Implement multi-tenancy architecture patterns for Apex Unified Suite SaaS platform with hybrid tenancy models and tenant isolation.
---

# Multi-Tenancy Strategy Implementation

## Purpose
Design and implement multi-tenant architecture that serves multiple customers from a single codebase while ensuring data isolation, security, and scalability for Apex Unified Suite's 10 business domains.

## When to Use This Skill
- Designing tenant isolation strategies
- Planning database schema for multi-tenancy
- Implementing tenant-aware authentication and authorization
- Setting up tenant-specific configurations
- Scaling infrastructure for multiple tenants

## Prerequisites
- Understanding of database design patterns
- Knowledge of Apex Unified Suite business domains
- Familiarity with PostgreSQL and Drizzle ORM
- Understanding of SaaS compliance requirements

## Implementation Steps

### 1. Choose Tenancy Model
Based on 2026 SaaS best practices, implement hybrid tenancy:

```typescript
// lib/db/src/tenancy/types.ts
export enum TenancyModel {
  SHARED_SCHEMA = 'shared_schema',        // Row-level isolation for standard tier
  SCHEMA_PER_TENANT = 'schema_per_tenant', // Separate schema per tenant
  DATABASE_PER_TENANT = 'database_per_tenant', // Separate database per tenant
  HYBRID = 'hybrid'                     // Mix based on tier/compliance
}

export interface TenantConfig {
  id: string;
  name: string;
  tier: 'standard' | 'premium' | 'enterprise';
  tenancyModel: TenancyModel;
  database?: {
    host: string;
    name: string;
    schema?: string;
  };
  compliance: {
    dataIsolation: 'strict' | 'standard';
    auditRetention: number; // days
  };
}
```

### 2. Implement Tenant Detection
Create tenant resolution middleware:

```typescript
// lib/api-server/src/middleware/tenant-resolution.ts
import { Request, Response, NextFunction } from 'express';
import { TenantConfig } from '@workspace/db/src/tenancy/types';

export interface TenantRequest extends Request {
  tenant?: TenantConfig;
  tenantId?: string;
}

export function tenantResolution(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  // Extract tenant from subdomain or header
  const tenantId = extractTenantId(req);
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant identifier required' });
  }

  const tenant = await getTenantConfig(tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  req.tenant = tenant;
  req.tenantId = tenantId;
  
  next();
}

function extractTenantId(req: Request): string | null {
  // Priority: subdomain > header > query param
  const subdomain = req.hostname?.split('.')[0];
  const header = req.headers['x-tenant-id'] as string;
  const query = req.query.tenant as string;
  
  return subdomain || header || query;
}
```

### 3. Set Up Database Connection Pooling
Implement tenant-aware database connections:

```typescript
// lib/db/src/tenancy/connection-manager.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import { TenantConfig, TenancyModel } from './types';

class TenantConnectionManager {
  private pools = new Map<string, Pool>();
  private schemas = new Map<string, any>();

  async getConnection(tenantId: string): Promise<any> {
    const tenant = await getTenantConfig(tenantId);
    
    switch (tenant.tenancyModel) {
      case TenancyModel.SHARED_SCHEMA:
        return this.getSharedConnection(tenant);
      
      case TenancyModel.SCHEMA_PER_TENANT:
        return this.getSchemaConnection(tenant);
      
      case TenancyModel.DATABASE_PER_TENANT:
        return this.getDatabaseConnection(tenant);
      
      default:
        throw new Error(`Unsupported tenancy model: ${tenant.tenancyModel}`);
    }
  }

  private async getSharedConnection(tenant: TenantConfig) {
    const poolKey = 'shared';
    if (!this.pools.has(poolKey)) {
      const pool = new Pool({
        host: process.env.DB_HOST,
        database: tenant.database!.name,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 20,
      });
      this.pools.set(poolKey, pool);
    }
    
    const pool = this.pools.get(poolKey)!;
    const schema = tenant.database!.schema || 'public';
    return drizzle(pool, { schema });
  }

  private async getSchemaConnection(tenant: TenantConfig) {
    const poolKey = `schema_${tenant.id}`;
    if (!this.pools.has(poolKey)) {
      const pool = new Pool({
        host: process.env.DB_HOST,
        database: tenant.database!.name,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 10, // Lower max per tenant
      });
      this.pools.set(poolKey, pool);
    }
    
    const pool = this.pools.get(poolKey)!;
    return drizzle(pool, { 
      schema: tenant.database!.schema || `tenant_${tenant.id}` 
    });
  }
}

export const connectionManager = new TenantConnectionManager();
```

### 4. Create Tenant-Aware Schema Design
Implement row-level security for shared schema:

```typescript
// lib/db/src/schema/tenancy.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  tier: text('tier').notNull(),
  tenancyModel: text('tenancy_model').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Base table with tenant isolation
export function createTenantTable<T extends any>(
  tableName: string,
  columns: T,
  additionalConfig?: any
) {
  return pgTable(tableName, {
    ...columns,
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    ...additionalConfig,
  });
}

// Example: CRM leads with tenant isolation
export const leads = createTenantTable('leads', {
  id: uuid('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  status: text('status').notNull(),
  value: text('value'),
}, (table) => ({
  indexes: [index('idx_leads_tenant_status').on(table.tenantId, table.status)],
}));
```

### 5. Implement Tenant-Aware Repositories
Create base repository pattern with tenant filtering:

```typescript
// lib/db/src/repositories/base-tenant-repository.ts
import { connectionManager } from '../tenancy/connection-manager';

export abstract class BaseTenantRepository<T> {
  protected abstract tableName: string;
  protected abstract db: any;

  constructor(private tenantId: string) {
    this.db = connectionManager.getConnection(tenantId);
  }

  protected async withTenantFilter() {
    return this.db.select().from(this.tableName).where(eq(tenantId, this.tenantId));
  }

  async create(data: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const enrichedData = {
      ...data,
      tenantId: this.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return this.db.insert(this.tableName).values(enrichedData).returning();
  }

  async findById(id: string): Promise<T | null> {
    return this.withTenantFilter().where(eq(id, id)).limit(1);
  }

  async findMany(filter: Partial<T> = {}): Promise<T[]> {
    return this.withTenantFilter().where(filter);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.db
      .update(this.tableName)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(id, id), eq(tenantId, this.tenantId)))
      .returning();
  }

  async delete(id: string): Promise<void> {
    return this.db
      .delete(this.tableName)
      .where(and(eq(id, id), eq(tenantId, this.tenantId)));
  }
}
```

### 6. Set Up Tenant Migration System
Create tenant-aware database migrations:

```typescript
// lib/db/src/migrations/tenant-migrations.ts
export class TenantMigrationRunner {
  async runMigrationsForTenant(tenantId: string): Promise<void> {
    const tenant = await getTenantConfig(tenantId);
    const db = await connectionManager.getConnection(tenantId);
    
    // Run standard migrations for this tenant
    await this.runMigrations(db, tenant);
  }

  async runMigrationsForAllTenants(): Promise<void> {
    const tenants = await getAllTenants();
    
    for (const tenant of tenants) {
      try {
        await this.runMigrationsForTenant(tenant.id);
        console.log(`Migrations completed for tenant: ${tenant.name}`);
      } catch (error) {
        console.error(`Migration failed for tenant ${tenant.id}:`, error);
        // Continue with other tenants
      }
    }
  }

  private async runMigrations(db: any, tenant: TenantConfig): Promise<void> {
    // Use Drizzle migration with tenant-specific schema
    if (tenant.tenancyModel === TenancyModel.SCHEMA_PER_TENANT) {
      await migrate(db, { 
        migrationsFolder: './migrations',
        schema: tenant.database?.schema 
      });
    } else {
      await migrate(db, { 
        migrationsFolder: './migrations',
        schema: 'public' 
      });
    }
  }
}
```

### 7. Implement Tenant Configuration Management
Create tenant provisioning and management:

```typescript
// lib/api-server/src/services/tenant-service.ts
export class TenantService {
  async createTenant(data: CreateTenantRequest): Promise<TenantConfig> {
    const tenant = await this.db.insert(tenants).values({
      id: generateId(),
      name: data.name,
      domain: data.domain,
      tier: data.tier,
      tenancyModel: this.selectTenancyModel(data.tier, data.compliance),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning().get();

    // Provision tenant resources
    await this.provisionTenantResources(tenant);
    
    return tenant;
  }

  private selectTenancyModel(
    tier: string, 
    compliance: { dataIsolation: string }
  ): TenancyModel {
    // Enterprise with strict compliance gets database-per-tenant
    if (tier === 'enterprise' && compliance.dataIsolation === 'strict') {
      return TenancyModel.DATABASE_PER_TENANT;
    }
    
    // Premium gets schema-per-tenant
    if (tier === 'premium') {
      return TenancyModel.SCHEMA_PER_TENANT;
    }
    
    // Standard gets shared schema
    return TenancyModel.SHARED_SCHEMA;
  }

  private async provisionTenantResources(tenant: TenantConfig): Promise<void> {
    switch (tenant.tenancyModel) {
      case TenancyModel.DATABASE_PER_TENANT:
        await this.createTenantDatabase(tenant);
        break;
      case TenancyModel.SCHEMA_PER_TENANT:
        await this.createTenantSchema(tenant);
        break;
      case TenancyModel.SHARED_SCHEMA:
        // No provisioning needed for shared
        break;
    }
  }
}
```

## Verification Steps

### 1. Test Tenant Isolation
```bash
# Create test tenants
curl -X POST http://localhost:8081/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Corp", "domain": "testcorp.apex.com", "tier": "standard"}'

# Test data isolation
curl -X GET http://testcorp.apex.com:8081/api/crm/leads
curl -X GET http://anothercorp.apex.com:8081/api/crm/leads

# Verify no data leakage between tenants
```

### 2. Verify Database Performance
```bash
# Check connection pooling
psql -h localhost -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor query performance per tenant
psql -h localhost -U postgres -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### 3. Test Compliance Requirements
```bash
# Verify data isolation for enterprise tenants
pnpm --filter @workspace/db run test:tenant-isolation

# Check audit trail functionality
pnpm --filter @workspace/api-server run test:audit-trail
```

## Security Considerations

### Data Isolation
- **Row-level security**: Always filter by tenant_id in shared schemas
- **Schema separation**: Use separate schemas for premium tenants
- **Database separation**: Complete isolation for enterprise with compliance needs

### Access Control
- **Tenant-scoped authentication**: JWT tokens include tenant_id claim
- **Cross-tenant prevention**: Database constraints prevent cross-tenant access
- **Audit logging**: Log all tenant data access

### Performance Protection
- **Noisy neighbor prevention**: Resource quotas per tenant
- **Connection pooling**: Limit connections per tenant
- **Query optimization**: Tenant-specific indexes and query patterns

## Scaling Strategies

### Infrastructure Scaling
```typescript
// lib/api-server/src/config/tenant-scaling.ts
export const TENANT_LIMITS = {
  [TenancyModel.SHARED_SCHEMA]: {
    maxTenants: 1000,
    maxConnections: 100,
    resourceQuota: 'standard'
  },
  [TenancyModel.SCHEMA_PER_TENANT]: {
    maxTenants: 100,
    maxConnections: 50,
    resourceQuota: 'premium'
  },
  [TenancyModel.DATABASE_PER_TENANT]: {
    maxTenants: 10,
    maxConnections: 20,
    resourceQuota: 'enterprise'
  }
};
```

### Cost Optimization
- **Hybrid approach**: Standard tenants share infrastructure, enterprise gets isolation
- **Auto-tier migration**: Upgrade tenants to appropriate tenancy model
- **Resource monitoring**: Track per-tenant resource usage

## File Structure
```
lib/
├── db/
│   ├── src/
│   │   ├── tenancy/
│   │   │   ├── types.ts
│   │   │   ├── connection-manager.ts
│   │   │   └── migration-runner.ts
│   │   ├── schema/
│   │   │   ├── tenancy.ts
│   │   │   └── [domain-tables].ts
│   │   └── repositories/
│   │       └── base-tenant-repository.ts
├── api-server/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── tenant-resolution.ts
│   │   ├── services/
│   │   │   └── tenant-service.ts
│   │   └── routes/
│   │       └── tenants.ts
└── migrations/
    ├── shared/
    ├── schema-per-tenant/
    └── database-per-tenant/
```

## Success Metrics
- **Zero Data Leakage**: No cross-tenant data access
- **Performance SLA**: <200ms response time for 95% of requests
- **Compliance Adherence**: 100% for enterprise tenants
- **Cost Efficiency**: Infrastructure costs scale sub-linearly with tenant count
- **Provisioning Time**: <5 minutes to onboard new tenant

## Integration with Existing Skills
This skill works with:
- `database-schema-development` for tenant-aware table creation
- `authentication-implementation` for tenant-scoped auth
- `api-business-endpoints` for tenant management APIs
- `security-hardening` for isolation best practices

## Related Documentation
- [Azure SaaS Tenancy Patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns) - Database design patterns
- [Multi-Tenant Architecture Guide](https://www.arielsoftwares.com/multi-tenant-architecture-saas-guide/) - 2026 updated strategies
- [Apex Architecture Guide](./ydm-architecture.md) - Project-specific implementation
