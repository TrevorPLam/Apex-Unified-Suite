---
name: repository-pattern-implementation
description: Implement base repository with multi-tenancy, soft delete patterns, and type-safe queries using Drizzle ORM for all business entities
---

# Repository Pattern Implementation

This skill guides you through implementing a type-safe repository pattern with multi-tenancy support, soft delete handling, and consistent query patterns across all business entities.

## Current State Assessment

**Current State**: No repository layer exists - database queries are inline in services.

**Missing Infrastructure**:
- No `BaseRepository` class for common operations
- No automatic tenant scoping
- No soft delete support
- No type-safe query building
- No transaction management

## Repository Architecture

### **Pattern Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                             │
│                    (Business Logic)                              │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Repository Layer                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │   Contact    │  │    Lead      │  │    User      │   │   │
│  │  │  Repository  │  │  Repository  │  │  Repository  │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │   │
│  │         │                  │                  │          │   │
│  │         └──────────────────┼──────────────────┘          │   │
│  │                            │                           │   │
│  │                   ┌────────▼────────┐                  │   │
│  │                   │  BaseRepository │                  │   │
│  │                   │                 │                  │   │
│  │                   │  - withTenant()   │                  │   │
│  │                   │  - softDelete()   │                  │   │
│  │                   │  - findById()     │                  │   │
│  │                   │  - findMany()     │                  │   │
│  │                   └────────┬────────┘                  │   │
│  └───────────────────────────┼─────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Database (PostgreSQL)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### **Base Repository Responsibilities**

1. **Multi-Tenancy**: Automatic `organization_id` filtering
2. **Soft Deletes**: Automatic exclusion of deleted records
3. **Type Safety**: Full TypeScript inference from Drizzle schemas
4. **Pagination**: Standardized limit/offset handling
5. **Audit**: Automatic `created_by`, `updated_by` tracking

## Step-by-Step Implementation

### **Step 1: Create Base Repository Abstract Class**

**File**: `lib/db/src/repositories/base-repository.ts`

```typescript
import { eq, and, SQL } from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { db } from '../db';

// Repository configuration options
interface RepositoryConfig<T extends PgTable> {
  table: T;
  organizationIdColumn: PgColumn;
  softDeleteColumn?: PgColumn; // deleted_at column
}

// Pagination options
interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Pagination result
interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query filters
interface QueryFilters<T> {
  where?: SQL<unknown>;
  orderBy?: SQL<unknown>;
  limit?: number;
  offset?: number;
}

/**
 * Base repository providing common CRUD operations with:
 * - Automatic multi-tenancy (organization_id filtering)
 * - Soft delete support
 * - Type-safe queries
 * - Pagination
 */
export abstract class BaseRepository<
  TTable extends PgTable,
  TSelect = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert']
> {
  protected table: TTable;
  protected organizationIdColumn: PgColumn;
  protected softDeleteColumn?: PgColumn;

  constructor(config: RepositoryConfig<TTable>) {
    this.table = config.table;
    this.organizationIdColumn = config.organizationIdColumn;
    this.softDeleteColumn = config.softDeleteColumn;
  }

  /**
   * Apply tenant filter to a query
   */
  protected withTenant(
    organizationId: string,
    additionalFilters?: SQL<unknown>
  ): SQL<unknown> {
    const tenantFilter = eq(this.organizationIdColumn, organizationId);
    
    if (additionalFilters) {
      return and(tenantFilter, additionalFilters);
    }
    
    return tenantFilter;
  }

  /**
   * Apply soft delete filter (exclude deleted records)
   */
  protected withoutSoftDeleted(): SQL<unknown> | undefined {
    if (this.softDeleteColumn) {
      return eq(this.softDeleteColumn, null);
    }
    return undefined;
  }

  /**
   * Combine tenant filter with soft delete filter
   */
  protected buildWhereClause(
    organizationId: string,
    additionalFilters?: SQL<unknown>
  ): SQL<unknown> {
    const tenantFilter = this.withTenant(organizationId, additionalFilters);
    const softDeleteFilter = this.withoutSoftDeleted();

    if (softDeleteFilter) {
      return and(tenantFilter, softDeleteFilter);
    }
    
    return tenantFilter;
  }

  /**
   * Find single record by ID
   */
  async findById(
    id: string,
    organizationId: string
  ): Promise<TSelect | undefined> {
    const results = await db
      .select()
      .from(this.table)
      .where(
        this.buildWhereClause(organizationId, eq(this.table.id, id))
      )
      .limit(1);

    return results[0];
  }

  /**
   * Find many records with optional filtering
   */
  async findMany(
    organizationId: string,
    options: QueryFilters<TSelect> = {}
  ): Promise<TSelect[]> {
    const whereClause = this.buildWhereClause(organizationId, options.where);

    let query = db
      .select()
      .from(this.table)
      .where(whereClause);

    if (options.orderBy) {
      query = query.orderBy(options.orderBy);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  /**
   * Find with pagination
   */
  async findPaginated(
    organizationId: string,
    pagination: PaginationOptions = {},
    filters?: QueryFilters<TSelect>
  ): Promise<PaginatedResult<TSelect>> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(this.buildWhereClause(organizationId, filters?.where));

    const total = countResult[0]?.count || 0;

    // Get paginated data
    const data = await this.findMany(organizationId, {
      ...filters,
      limit,
      offset,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Create a new record
   */
  async create(
    data: TInsert,
    organizationId: string
  ): Promise<TSelect> {
    // Auto-inject organization_id
    const dataWithTenant = {
      ...data,
      [this.organizationIdColumn.name]: organizationId,
    };

    const results = await db
      .insert(this.table)
      .values(dataWithTenant)
      .returning();

    return results[0];
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: Partial<TInsert>,
    organizationId: string
  ): Promise<TSelect | undefined> {
    // Ensure we can't change organization_id
    const safeData = { ...data };
    delete (safeData as Record<string, unknown>)[this.organizationIdColumn.name];

    const results = await db
      .update(this.table)
      .set(safeData)
      .where(this.buildWhereClause(organizationId, eq(this.table.id, id)))
      .returning();

    return results[0];
  }

  /**
   * Soft delete a record (if soft delete enabled)
   */
  async softDelete(
    id: string,
    organizationId: string,
    deletedBy?: string
  ): Promise<TSelect | undefined> {
    if (!this.softDeleteColumn) {
      throw new Error('Soft delete not enabled for this repository');
    }

    const updateData: Record<string, unknown> = {
      [this.softDeleteColumn.name]: new Date(),
    };

    if (deletedBy) {
      updateData.deletedBy = deletedBy;
    }

    const results = await db
      .update(this.table)
      .set(updateData)
      .where(this.buildWhereClause(organizationId, eq(this.table.id, id)))
      .returning();

    return results[0];
  }

  /**
   * Hard delete a record (use with caution)
   */
  async hardDelete(
    id: string,
    organizationId: string
  ): Promise<boolean> {
    const results = await db
      .delete(this.table)
      .where(this.buildWhereClause(organizationId, eq(this.table.id, id)))
      .returning();

    return results.length > 0;
  }

  /**
   * Count records with optional filtering
   */
  async count(
    organizationId: string,
    additionalFilters?: SQL<unknown>
  ): Promise<number> {
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(this.buildWhereClause(organizationId, additionalFilters));

    return countResult[0]?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(
    id: string,
    organizationId: string
  ): Promise<boolean> {
    const count = await this.count(
      organizationId,
      eq(this.table.id, id)
    );
    return count > 0;
  }
}

// Import sql helper
import { sql } from 'drizzle-orm';
```

### **Step 2: Create Concrete Repository Example (Contacts)**

**File**: `lib/db/src/repositories/crm/contact-repository.ts`

```typescript
import { eq, ilike, and, or, desc, SQL } from 'drizzle-orm';
import { BaseRepository, PaginatedResult, QueryFilters } from '../base-repository';
import { contactsTable } from '../../schema/crm/contacts';

// Custom filters for contacts
interface ContactFilters {
  search?: string;
  status?: 'active' | 'inactive';
  assignedTo?: string;
  tags?: string[];
}

export class ContactRepository extends BaseRepository<
  typeof contactsTable,
  typeof contactsTable.$inferSelect,
  typeof contactsTable.$inferInsert
> {
  constructor() {
    super({
      table: contactsTable,
      organizationIdColumn: contactsTable.organizationId,
      softDeleteColumn: contactsTable.deletedAt,
    });
  }

  /**
   * Find contacts with custom filtering
   */
  async findWithFilters(
    organizationId: string,
    filters: ContactFilters = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<typeof contactsTable.$inferSelect>> {
    const whereConditions: SQL<unknown>[] = [];

    // Search filter
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      whereConditions.push(
        or(
          ilike(contactsTable.firstName, searchTerm),
          ilike(contactsTable.lastName, searchTerm),
          ilike(contactsTable.email, searchTerm),
          ilike(contactsTable.company, searchTerm)
        )!
      );
    }

    // Status filter
    if (filters.status) {
      whereConditions.push(eq(contactsTable.status, filters.status));
    }

    // Assigned to filter
    if (filters.assignedTo) {
      whereConditions.push(eq(contactsTable.assignedTo, filters.assignedTo));
    }

    // Tags filter (array overlap)
    if (filters.tags && filters.tags.length > 0) {
      // PostgreSQL array overlap operator
      whereConditions.push(
        sql`${contactsTable.tags} && ${filters.tags}`
      );
    }

    // Build combined where clause
    const whereClause = whereConditions.length > 0
      ? and(...whereConditions)
      : undefined;

    return this.findPaginated(
      organizationId,
      pagination,
      {
        where: whereClause,
        orderBy: desc(contactsTable.createdAt),
      }
    );
  }

  /**
   * Find contact by email (within organization)
   */
  async findByEmail(
    email: string,
    organizationId: string
  ): Promise<typeof contactsTable.$inferSelect | undefined> {
    const results = await this.findMany(
      organizationId,
      {
        where: eq(contactsTable.email, email),
        limit: 1,
      }
    );

    return results[0];
  }

  /**
   * Find contacts assigned to a user
   */
  async findByAssignee(
    userId: string,
    organizationId: string
  ): Promise<typeof contactsTable.$inferSelect[]> {
    return this.findMany(
      organizationId,
      {
        where: eq(contactsTable.assignedTo, userId),
        orderBy: desc(contactsTable.lastContactedAt),
      }
    );
  }

  /**
   * Update last contacted timestamp
   */
  async updateLastContacted(
    id: string,
    organizationId: string
  ): Promise<typeof contactsTable.$inferSelect | undefined> {
    return this.update(
      id,
      { lastContactedAt: new Date() },
      organizationId
    );
  }

  /**
   * Add tags to contact
   */
  async addTags(
    id: string,
    organizationId: string,
    newTags: string[]
  ): Promise<typeof contactsTable.$inferSelect | undefined> {
    const contact = await this.findById(id, organizationId);
    if (!contact) return undefined;

    const currentTags = contact.tags || [];
    const updatedTags = [...new Set([...currentTags, ...newTags])];

    return this.update(id, { tags: updatedTags }, organizationId);
  }

  /**
   * Remove tags from contact
   */
  async removeTags(
    id: string,
    organizationId: string,
    tagsToRemove: string[]
  ): Promise<typeof contactsTable.$inferSelect | undefined> {
    const contact = await this.findById(id, organizationId);
    if (!contact) return undefined;

    const currentTags = contact.tags || [];
    const updatedTags = currentTags.filter(tag => !tagsToRemove.includes(tag));

    return this.update(id, { tags: updatedTags }, organizationId);
  }

  /**
   * Find duplicate contacts by email (for deduplication)
   */
  async findDuplicatesByEmail(
    emails: string[],
    organizationId: string
  ): Promise<typeof contactsTable.$inferSelect[]> {
    return this.findMany(
      organizationId,
      {
        where: sql`${contactsTable.email} = ANY(${emails})`,
      }
    );
  }
}

// Import sql helper
import { sql } from 'drizzle-orm';

// Singleton instance
export const contactRepository = new ContactRepository();
```

### **Step 3: Update Schema with Organization ID and Soft Delete**

**File**: `lib/db/src/schema/crm/contacts.ts`

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { organizationsTable } from '../auth/organizations';

export const contactsTable = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Multi-tenancy
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id),
  
  // Core fields
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  title: text('title'),
  
  // Status and assignment
  status: text('status').notNull().default('active'),
  assignedTo: uuid('assigned_to'),
  
  // Metadata
  tags: text('tags').array(),
  notes: text('notes'),
  lastContactedAt: timestamp('last_contacted_at'),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
});

// Zod schemas
export const insertContactSchema = createInsertSchema(contactsTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContactedAt: true,
  deletedAt: true,
  deletedBy: true,
});

export const selectContactSchema = createSelectSchema(contactsTable);

export const updateContactSchema = insertContactSchema.partial();
```

### **Step 4: Add Indexes for Performance**

**File**: `lib/db/src/schema/crm/contacts.ts` (drizzle indexes)

```typescript
// Add after table definition - in drizzle-kit migration
// Migration file: lib/db/migrations/0001_add_contact_indexes.ts

import { sql } from 'drizzle-orm';

export const contactIndexes = {
  // Critical for multi-tenancy
  organizationIdx: sql`CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id)`,
  
  // Common query patterns
  emailIdx: sql`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(organization_id, email)`,
  statusIdx: sql`CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(organization_id, status)`,
  assigneeIdx: sql`CREATE INDEX IF NOT EXISTS idx_contacts_assignee ON contacts(assigned_to) WHERE assigned_to IS NOT NULL`,
  
  // Soft delete filter
  notDeletedIdx: sql`CREATE INDEX IF NOT EXISTS idx_contacts_not_deleted ON contacts(organization_id) WHERE deleted_at IS NULL`,
  
  // Search performance
  searchIdx: sql`CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, '')))`,
};
```

### **Step 5: Repository Index Export**

**File**: `lib/db/src/repositories/index.ts`

```typescript
// Export all repositories
export { BaseRepository, PaginatedResult, QueryFilters } from './base-repository';
export { ContactRepository, contactRepository } from './crm/contact-repository';
// ... other repository exports
```

### **Step 6: Usage in Services**

**File**: `artifacts/api-server/src/services/crm.ts`

```typescript
import { contactRepository } from '@workspace/db/repositories';
import { Result, ok, err } from 'neverthrow';
import { ContactNotFound, DuplicateEmail } from '../errors/domain-errors';

export class CRMService {
  async getContact(
    id: string,
    organizationId: string
  ): Promise<Result<Contact, ContactNotFound>> {
    const contact = await contactRepository.findById(id, organizationId);
    
    if (!contact) {
      return err(new ContactNotFound(id));
    }
    
    return ok(this.toDomainModel(contact));
  }

  async searchContacts(
    organizationId: string,
    query: string,
    page: number = 1
  ): Promise<PaginatedResult<Contact>> {
    return contactRepository.findWithFilters(
      organizationId,
      { search: query },
      { page, limit: 20 }
    );
  }

  async createContact(
    data: CreateContactInput,
    organizationId: string,
    userId: string
  ): Promise<Result<Contact, DuplicateEmail>> {
    // Check for duplicates
    const existing = await contactRepository.findByEmail(
      data.email,
      organizationId
    );
    
    if (existing) {
      return err(new DuplicateEmail(data.email));
    }

    const contact = await contactRepository.create(
      {
        ...data,
        createdBy: userId,
        status: 'active',
      },
      organizationId
    );

    return ok(this.toDomainModel(contact));
  }

  // ... other methods
}
```

### **Step 7: Repository Tests**

**File**: `lib/db/__tests__/repositories/contact-repository.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { contactRepository } from '../../src/repositories/crm/contact-repository';
import { db } from '../../src/db';
import { contactsTable } from '../../src/schema/crm/contacts';

describe('ContactRepository', () => {
  const orgId = 'test-org-123';

  beforeEach(async () => {
    // Clean up test data
    await db.delete(contactsTable)
      .where(eq(contactsTable.organizationId, orgId));
  });

  it('should create contact with organization_id', async () => {
    const contact = await contactRepository.create(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      orgId
    );

    expect(contact.firstName).toBe('John');
    expect(contact.organizationId).toBe(orgId);
  });

  it('should not find contact from different organization', async () => {
    // Create contact in org A
    await contactRepository.create(
      { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      'org-a'
    );

    // Try to find in org B
    const found = await contactRepository.findById(
      'john@example.com',
      'org-b'
    );

    expect(found).toBeUndefined();
  });

  it('should soft delete contact', async () => {
    const contact = await contactRepository.create(
      { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      orgId
    );

    await contactRepository.softDelete(contact.id, orgId, 'user-123');

    // Should not be found in normal queries
    const found = await contactRepository.findById(contact.id, orgId);
    expect(found).toBeUndefined();

    // Should exist in DB with deleted_at
    const all = await db.select().from(contactsTable);
    expect(all[0].deletedAt).toBeDefined();
  });

  it('should paginate results', async () => {
    // Create 25 contacts
    for (let i = 0; i < 25; i++) {
      await contactRepository.create(
        {
          firstName: `Contact${i}`,
          lastName: 'Test',
          email: `contact${i}@test.com`,
        },
        orgId
      );
    }

    const page1 = await contactRepository.findPaginated(orgId, { page: 1, limit: 10 });
    expect(page1.data).toHaveLength(10);
    expect(page1.meta.total).toBe(25);
    expect(page1.meta.hasNext).toBe(true);

    const page2 = await contactRepository.findPaginated(orgId, { page: 3, limit: 10 });
    expect(page2.data).toHaveLength(5);
    expect(page2.meta.hasNext).toBe(false);
  });

  it('should search by email', async () => {
    await contactRepository.create(
      { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      orgId
    );

    const results = await contactRepository.findWithFilters(
      orgId,
      { search: 'john@example.com' }
    );

    expect(results.data).toHaveLength(1);
    expect(results.data[0].email).toBe('john@example.com');
  });
});
```

## Repository Pattern Benefits

1. **Type Safety**: Full TypeScript inference from Drizzle schemas
2. **DRY Principle**: Common operations in base class
3. **Testability**: Easy to mock for unit tests
4. **Security**: Automatic tenant scoping prevents data leaks
5. **Audit**: Soft delete and audit field tracking
6. **Performance**: Centralized indexing strategy

## Anti-Patterns to Avoid

❌ **Bypassing repository in services**:
```typescript
// WRONG - direct DB access in service
await db.select().from(contactsTable).where(...)
```

❌ **Not using tenant scoping**:
```typescript
// WRONG - missing organization_id filter
await db.select().from(contactsTable).where(eq(id, contactId))
```

❌ **Repository with business logic**:
```typescript
// WRONG - repository should only handle data access
class ContactRepository {
  async sendWelcomeEmail() { /* business logic! */ }
}
```

## Verification Commands

```bash
# Type check repositories
pnpm --filter @workspace/db run typecheck

# Run repository tests
pnpm vitest run lib/db/__tests__/repositories/

# Check for tenant scoping
grep -r "organizationId" lib/db/src/repositories/ | wc -l
```
