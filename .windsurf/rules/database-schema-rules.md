---
trigger: glob
globs: lib/db/src/schema/*.ts
---

# Database Schema Rules

Enforce consistent database schema patterns for all Drizzle ORM table definitions in the Apex Unified Suite.

## Table Definition Standards

### **Primary Keys**
- Use `uuid("id").defaultRandom().primaryKey()` for all tables
- Never use auto-increment integers
- UUIDs provide better security and distributed system compatibility

### **Column Naming**
- Use snake_case for all column names (e.g., `created_at`, `user_id`)
- Use descriptive names that reflect the data content
- Avoid abbreviations unless widely understood

### **Required Fields**
- All tables must have `createdAt: timestamp("created_at").defaultNow()`
- All tables must have `updatedAt: timestamp("updated_at").defaultNow()`
- Business entities must have appropriate status fields
- Foreign keys must reference related tables

### **Data Types**
```typescript
// Preferred patterns
id: uuid("id").defaultRandom().primaryKey()
email: text("email").notNull().unique()
name: text("name").notNull()
status: text("status").notNull().default("active")
createdAt: timestamp("created_at").defaultNow()
updatedAt: timestamp("updated_at").defaultNow()
isActive: boolean("is_active").default(true)
amount: decimal("amount", { precision: 10, scale: 2 })
tags: text("tags").array()
```

## Relationship Patterns

### **Foreign Key References**
```typescript
// One-to-Many
userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" })

// Many-to-Many (junction table)
projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "cascade" })
userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" })
```

### **Referential Integrity**
- Always specify `onDelete` behavior
- Use "cascade" for dependent entities
- Use "restrict" for critical references
- Use "set null" for optional relationships

## Zod Schema Requirements

### **Schema Generation**
- Export `insertSchema` using `createInsertSchema()`
- Export `selectSchema` using `createSelectSchema()`
- Omit sensitive fields from `selectSchema` (passwords, tokens)
- Create `updateSchema` as `insertSchema.partial()` for partial updates

### **Validation Patterns**
```typescript
// Insert schema (for creating records)
export const insertUserSchema = createInsertSchema(usersTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
}).omit({
  passwordHash: true, // Never allow password hash in inserts
});

// Select schema (for API responses)
export const selectUserSchema = createSelectSchema(usersTable).omit({
  passwordHash: true, // Never expose password hash
});

// Update schema (for partial updates)
export const updateUserSchema = createInsertSchema(usersTable, {
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
```

## Index Requirements

### **Performance Indexes**
- Add indexes on frequently queried columns
- Index foreign key columns
- Index unique constraints automatically
- Consider composite indexes for common query patterns

### **Index Patterns**
```typescript
// Single column indexes
email: text("email").notNull().unique(),
createdAt: timestamp("created_at").index(),
status: text("status").index(),

// Composite indexes for common queries
// (userId, status) for user-specific queries
```

## Audit Fields Pattern

### **Standard Audit Fields**
```typescript
{
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: uuid("created_by").references(() => usersTable.id),
  updatedBy: uuid("updated_by").references(() => usersTable.id),
}
```

### **Soft Delete Pattern**
```typescript
{
  deletedAt: timestamp("deleted_at"),
  deletedBy: uuid("deleted_by").references(() => usersTable.id),
  isDeleted: boolean("is_deleted").default(false),
}
```

## Business Logic Patterns

### **Status Fields**
```typescript
// Common status patterns
status: text("status").notNull().default("draft")
// Values: draft, review, approved, published, archived

priority: text("priority").notNull().default("medium")
// Values: low, medium, high, urgent

stage: text("stage").notNull().default("new")
// Values: new, qualified, proposal, negotiation, closed_won, closed_lost
```

### **Monetary Fields**
```typescript
// Always use decimal for money
amount: decimal("amount", { precision: 10, scale: 2 }),
budget: decimal("budget", { precision: 12, scale: 2 }),
price: decimal("price", { precision: 10, scale: 2 }),
```

## File Organization

### **Schema File Structure**
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
├── projects/             # Project tables
│   ├── projects.ts
│   ├── tasks.ts
│   └── templates.ts
└── system/               # System tables
    ├── audit_logs.ts
    ├── settings.ts
    └── integrations.ts
```

### **Export Pattern**
```typescript
// In lib/db/src/schema/index.ts
export * from "./auth/users";
export * from "./auth/roles";
export * from "./auth/permissions";
export * from "./crm/contacts";
export * from "./crm/leads";
export * from "./crm/deals";
// ... other exports
```

## Validation Commands

### **Schema Validation**
```bash
# Check schema compilation
pnpm --filter @workspace/db run typecheck

# Generate and validate Zod schemas
pnpm --filter @workspace/db run codegen

# Test database schema
pnpm --filter @workspace/db run push
```

### **Migration Safety**
```bash
# Always backup before schema changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Test schema changes in development
pnpm --filter @workspace/db run push

# Use force push only when necessary
pnpm --filter @workspace/db run push-force
```

## Anti-Patterns

❌ **Never** use auto-increment integers for primary keys
❌ **Never** use camelCase for column names
❌ **Never** skip audit fields (createdAt, updatedAt)
❌ **Never** expose sensitive fields in select schemas
❌ **Never** create tables without proper relationships
❌ **Never** use floating point numbers for monetary values

## Quality Checklist

- [ ] All tables use UUID primary keys
- [ ] Column names follow snake_case convention
- [ ] Required fields are properly marked as notNull()
- [ ] Foreign keys have proper references and onDelete behavior
- [ ] Zod schemas are generated and properly typed
- [ ] Sensitive fields are omitted from select schemas
- [ ] Performance indexes are added where needed
- [ ] Audit fields are included where appropriate
- [ ] Business logic follows established patterns
- [ ] File organization follows the standard structure

This rule ensures consistent, maintainable database schemas across the entire Apex Unified Suite.
