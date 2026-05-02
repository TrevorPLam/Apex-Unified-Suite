---
name: database-schema-development
description: Complete guide for implementing Drizzle ORM schemas from scratch in the Apex Unified Suite (currently empty)
---

# Database Schema Development

This skill guides you through implementing the complete database schema for the Apex Unified Suite using Drizzle ORM and PostgreSQL.

## Current State Assessment

**Current Schema Status**: `lib/db/src/schema/index.ts` contains only `export {}` - completely empty.

**Missing Tables**: All business domain tables need to be created:
- Users, authentication, and authorization
- CRM (leads, contacts, deals)
- Projects and tasks
- Documents and folders
- Finance (invoices, payments)
- Assets and maintenance
- Portal and client management
- Analytics and audit logs

## Schema Architecture

### **File Organization**
```
lib/db/src/schema/
├── index.ts              # Main exports
├── auth/                 # Authentication tables
│   ├── users.ts
│   ├── roles.ts
│   └── permissions.ts
├── crm/                  # CRM tables
│   ├── contacts.ts
│   ├── leads.ts
│   └── deals.ts
├── projects/             # Project management
│   ├── projects.ts
│   ├── tasks.ts
│   └── templates.ts
├── documents/            # Document management
│   ├── folders.ts
│   ├── documents.ts
│   └── workflows.ts
├── finance/              # Financial tables
│   ├── invoices.ts
│   ├── payments.ts
│   └── vendors.ts
├── assets/               # Asset tracking
│   ├── assets.ts
│   └── maintenance.ts
├── portal/               # Client portal
│   ├── clients.ts
│   └── branding.ts
└── system/               # System tables
    ├── audit_logs.ts
    ├── settings.ts
    └── integrations.ts
```

## Step-by-Step Implementation

### **Step 1: Core Authentication Schema**

**File**: `lib/db/src/schema/auth/users.ts`
```typescript
import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // admin, user, viewer
  status: text("status").notNull().default("active"), // active, inactive, suspended
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(usersTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
}).omit({
  passwordHash: true,
});

export const selectUserSchema = createSelectSchema(usersTable).omit({
  passwordHash: true,
});

export const createUserSchema = createInsertSchema(usersTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  emailVerified: true,
});
```

**File**: `lib/db/src/schema/auth/roles.ts`
```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const rolesTable = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array(), // Array of permission strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(rolesTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

### **Step 2: Business Domain Schemas**

**File**: `lib/db/src/schema/crm/contacts.ts`
```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "../auth/users";

export const contactsTable = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  title: text("title"),
  status: text("status").notNull().default("active"), // active, inactive
  assignedTo: uuid("assigned_to").references(() => usersTable.id),
  tags: text("tags").array(),
  notes: text("notes"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactsTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
  lastContactedAt: true,
});
```

**File**: `lib/db/src/schema/crm/leads.ts`
```typescript
import { pgTable, text, timestamp, uuid, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { contactsTable } from "./contacts";
import { usersTable } from "../auth/users";

export const leadsTable = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  contactId: uuid("contact_id").references(() => contactsTable.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  value: decimal("value", { precision: 10, scale: 2 }),
  stage: text("stage").notNull().default("new"), // new, qualified, proposal, negotiation, closed_won, closed_lost
  source: text("source"), // website, referral, cold_call, email, social
  assignedTo: uuid("assigned_to").references(() => usersTable.id),
  probability: integer("probability").default(0), // 0-100
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
  actualCloseDate: true,
});
```

### **Step 3: Update Main Schema Index**

**File**: `lib/db/src/schema/index.ts`
```typescript
// Authentication schemas
export * from "./auth/users";
export * from "./auth/roles";
export * from "./auth/permissions";

// CRM schemas
export * from "./crm/contacts";
export * from "./crm/leads";
export * from "./crm/deals";

// Project schemas
export * from "./crm/projects";
export * from "./crm/tasks";
export * from "./crm/templates";

// Document schemas
export * from "./documents/folders";
export * from "./documents/documents";
export * from "./documents/workflows";

// Finance schemas
export * from "./finance/invoices";
export * from "./finance/payments";
export * from "./finance/vendors";

// Asset schemas
export * from "./assets/assets";
export * from "./assets/maintenance";

// Portal schemas
export * from "./portal/clients";
export * from "./portal/branding";

// System schemas
export * from "./system/audit_logs";
export * from "./system/settings";
export * from "./system/integrations";
```

## Schema Development Patterns

### **Column Type Guidelines**
```typescript
// Primary Keys
id: uuid("id").defaultRandom().primaryKey()

// Foreign Keys
userId: uuid("user_id").references(() => usersTable.id)

// Timestamps
createdAt: timestamp("created_at").defaultNow()
updatedAt: timestamp("updated_at").defaultNow()

// Text Fields
name: text("name").notNull()
email: text("email").notNull().unique()
description: text("description")

// Numeric Fields
value: decimal("value", { precision: 10, scale: 2 })
quantity: integer("quantity").default(0)

// Boolean Fields
isActive: boolean("is_active").default(true)
isVerified: boolean("is_verified").default(false)

// Arrays
tags: text("tags").array()
permissions: text("permissions").array()
```

### **Relationship Patterns**
```typescript
// One-to-Many
export const usersTable = pgTable("users", { /* ... */ });
export const contactsTable = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  // ...
});

// Many-to-Many (through junction table)
export const projectsTable = pgTable("projects", { /* ... */ });
export const usersTable = pgTable("users", { /* ... */ });
export const projectMembersTable = pgTable("project_members", {
  projectId: uuid("project_id").references(() => projectsTable.id),
  userId: uuid("user_id").references(() => usersTable.id),
  role: text("role").notNull(), // owner, member, viewer
});
```

### **Zod Schema Patterns**
```typescript
// Insert schema (for creating records)
export const insertUserSchema = createInsertSchema(usersTable, {
  // Exclude fields that should not be set during insert
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select schema (for API responses)
export const selectUserSchema = createSelectSchema(usersTable).omit({
  // Exclude sensitive fields
  passwordHash: true,
});

// Update schema (for partial updates)
export const updateUserSchema = createInsertSchema(usersTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
```

## Database Migration Workflow

### **1. Schema Development**
```bash
# Create new schema file
touch lib/db/src/schema/crm/leads.ts

# Implement schema with proper types and relationships
# (follow patterns above)
```

### **2. Update Exports**
```bash
# Add to lib/db/src/schema/index.ts
export * from "./crm/leads";
```

### **3. Generate Zod Schemas**
```bash
# Zod schemas are generated inline with createInsertSchema
# No separate generation step needed
```

### **4. Push to Database**
```bash
# Apply schema changes to development database
pnpm --filter @workspace/db run push

# For production (force push - use carefully)
pnpm --filter @workspace/db run push-force
```

### **5. Type Check Validation**
```bash
# Verify schema integration
pnpm run typecheck:libs
pnpm run typecheck
```

## Common Schema Patterns

### **Audit Fields Pattern**
```typescript
// Add to all tables that need tracking
{
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").references(() => usersTable.id),
  updatedBy: uuid("updated_by").references(() => usersTable.id),
}
```

### **Soft Delete Pattern**
```typescript
// Add to tables that need soft delete
{
  deletedAt: timestamp("deleted_at"),
  deletedBy: uuid("deleted_by").references(() => usersTable.id),
  isDeleted: boolean("is_deleted").default(false),
}
```

### **Status Field Pattern**
```typescript
// Common status patterns
status: text("status").notNull().default("active")
// Values: active, inactive, suspended, archived

priority: text("priority").notNull().default("medium")
// Values: low, medium, high, urgent

stage: text("stage").notNull().default("draft")
// Values: draft, review, approved, published, archived
```

## Testing Schema Changes

### **Unit Testing Schema**
```typescript
// tests/db/schema/users.test.ts
import { describe, it, expect } from 'vitest';
import { insertUserSchema } from '@workspace/db/schema/auth/users';

describe('User Schema', () => {
  it('should validate valid user data', () => {
    const validUser = {
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Test User',
      role: 'user',
    };
    
    expect(() => insertUserSchema.parse(validUser)).not.toThrow();
  });

  it('should reject invalid email', () => {
    const invalidUser = {
      email: 'invalid-email',
      passwordHash: 'hashed_password',
      name: 'Test User',
      role: 'user',
    };
    
    expect(() => insertUserSchema.parse(invalidUser)).toThrow();
  });
});
```

### **Integration Testing**
```typescript
// tests/db/integration/contacts.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@workspace/db';
import { contactsTable } from '@workspace/db/schema/crm/contacts';
import { insertContactSchema } from '@workspace/db/schema/crm/contacts';

describe('Contacts Table', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(contactsTable);
  });

  it('should insert and retrieve contact', async () => {
    const contactData = insertContactSchema.parse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: 'active',
    });

    const result = await db.insert(contactsTable)
      .values(contactData)
      .returning();

    expect(result[0]).toMatchObject(contactData);
    expect(result[0].id).toBeDefined();
  });
});
```

## Best Practices

### **Schema Design**
1. **Use UUID for primary keys** - Better for distributed systems
2. **Add proper constraints** - notNull(), unique(), default values
3. **Use appropriate column types** - text for strings, decimal for money
4. **Include audit fields** - createdAt, updatedAt for all tables
5. **Define relationships explicitly** - foreign key references

### **Zod Schema Usage**
1. **Create separate schemas** for insert, select, update operations
2. **Omit sensitive fields** from select schemas (passwords, tokens)
3. **Use partial()** for update schemas to allow partial updates
4. **Validate at runtime** using schema.parse() in API endpoints

### **Migration Management**
1. **Test schema changes locally** before pushing to shared database
2. **Use descriptive names** for tables and columns
3. **Document relationships** in comments when complex
4. **Back up production database** before major schema changes

### **Performance Considerations**
1. **Add indexes** for frequently queried columns
2. **Use appropriate data types** to minimize storage
3. **Consider partitioning** for large tables
4. **Monitor query performance** after schema changes

This comprehensive schema development approach ensures a robust, type-safe database foundation for the Apex Unified Suite that supports all business domains while maintaining data integrity and performance.
