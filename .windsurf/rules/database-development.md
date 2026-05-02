---
trigger: glob
globs: lib/db/src/schema/**/*.ts
---

# Database Schema Development Rules

## Schema Definition Rules

- Always use `pgTable` with explicit column types from Drizzle ORM
- Export `createInsertSchema` for all tables using `drizzle-zod`
- Include proper constraints: `notNull()`, `unique()`, `defaultNow()`
- Add foreign key relationships explicitly with `references()`
- Export table schemas from `lib/db/src/schema/index.ts`
- Use UUID for primary keys: `uuid("id").defaultRandom().primaryKey()`
- Include audit fields: `createdAt`, `updatedAt` for all tables
- Run `pnpm --filter @workspace/db run push` after schema changes
- Never edit generated migration files directly

## Column Type Guidelines

- **Primary Keys**: `uuid("id").defaultRandom().primaryKey()`
- **Foreign Keys**: `uuid("user_id").references(() => usersTable.id)`
- **Timestamps**: `timestamp("created_at").defaultNow()`
- **Text Fields**: `text("name").notNull()`, `text("email").notNull().unique()`
- **Numeric Fields**: `decimal("value", { precision: 10, scale: 2 })`, `integer("quantity").default(0)`
- **Boolean Fields**: `boolean("is_active").default(true)`, `boolean("is_verified").default(false)`
- **Arrays**: `text("tags").array()`, `text("permissions").array()`

## Relationship Patterns

- **One-to-Many**: Add foreign key reference in child table
- **Many-to-Many**: Create junction table with both foreign keys
- **Self-referencing**: Use `references(() => tableName.id)` for same table relationships

## Zod Schema Integration

- Export three schemas per table: `insert`, `select`, `update`
- Use `createInsertSchema()` for input validation
- Use `createSelectSchema()` for API responses
- Omit sensitive fields from select schemas: `omit({ passwordHash: true })`
- Use `partial()` for update schemas to allow partial updates

## File Organization

- Group tables by business domain in subdirectories (auth/, crm/, projects/, etc.)
- Export all schemas from domain index files
- Main index file exports all domain schemas
- Keep schema files focused on single table definitions

## Validation and Testing

- Always validate input data with Zod schemas in API endpoints
- Test schema validation with edge cases
- Verify foreign key relationships work correctly
- Test database constraints with invalid data

## Migration Workflow

1. Create/modify schema file
2. Update exports in index files
3. Run `pnpm run typecheck:libs` to validate types
4. Run `pnpm --filter @workspace/db run push` to apply changes
5. Test new schema with sample data
6. Update OpenAPI spec if API contracts changed

## Performance Considerations

- Add indexes for frequently queried columns
- Use appropriate data types to minimize storage
- Consider `pgVector` for full-text search fields
- Use `generatedAlwaysAs()` for computed columns when needed
- Monitor query performance after schema changes

## Security Rules

- Never store plain text passwords
- Use `bcrypt` for password hashing in application layer
- Include proper constraints for sensitive data
- Add audit fields for tracking data changes
- Use row-level security policies when appropriate
