---
trigger: model_decision
---

# Soft Delete Standard Rule

## Core Requirement
When implementing soft delete, use standardized `deleted_at` column naming, repository filtering, and partial index pattern for consistency across the Apex Unified Suite.

## Pattern Enforcement

### Database Schema Pattern

```typescript
// ✅ CORRECT - Standard soft delete schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  deletedAt: timestamp('deleted_at'), // Standard column name
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ✅ CORRECT - With partial index for performance
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Partial index excludes deleted records
  emailIdx: pgIndex('users_email_idx').on(table.email).where(sql`deleted_at IS NULL`),
  nameIdx: pgIndex('users_name_idx').on(table.firstName, table.lastName).where(sql`deleted_at IS NULL`),
}));

// ❌ INCORRECT - Non-standard column names
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  isDeleted: boolean('is_deleted'), // Wrong column type
  deleted: boolean('deleted'), // Wrong column name
  removedAt: timestamp('removed_at'), // Wrong column name
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Base Repository Pattern

```typescript
// ✅ CORRECT - Base repository with soft delete support
export abstract class BaseRepository<T> {
  protected abstract table: PgTable<T>;
  protected db: DrizzleDB;

  constructor(db: DrizzleDB) {
    this.db = db;
  }

  async findById(id: string): Promise<T | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(and(
        eq((this.table as any).id, id),
        isNull((this.table as any).deletedAt)
      ))
      .limit(1);
    
    return results[0] || null;
  }

  async findMany(filter?: Record<string, any>): Promise<T[]> {
    let query = this.db
      .select()
      .from(this.table)
      .where(isNull((this.table as any).deletedAt));

    if (filter) {
      const conditions = Object.entries(filter).map(([key, value]) =>
        eq((this.table as any)[key], value)
      );
      query = query.where(and(
        isNull((this.table as any).deletedAt),
        ...conditions
      ));
    }

    return await query;
  }

  async create(data: NewEntity<T>): Promise<T> {
    const [result] = await this.db
      .insert(this.table)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    
    return result;
  }

  async update(id: string, data: Partial<NewEntity<T>>): Promise<T | null> {
    const [result] = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq((this.table as any).id, id),
        isNull((this.table as any).deletedAt)
      ))
      .returning();
    
    return result || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.db
      .update(this.table)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq((this.table as any).id, id),
        isNull((this.table as any).deletedAt)
      ));
    
    return result.rowCount > 0;
  }

  async restore(id: string): Promise<boolean> {
    const result = await this.db
      .update(this.table)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq((this.table as any).id, id),
        isNotNull((this.table as any).deletedAt)
      ));
    
    return result.rowCount > 0;
  }

  // Include deleted records (for admin purposes)
  async findByIdWithDeleted(id: string): Promise<T | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq((this.table as any).id, id))
      .limit(1);
    
    return results[0] || null;
  }

  // Only deleted records
  async findDeleted(): Promise<T[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(isNotNull((this.table as any).deletedAt));
  }
}
```

### Specific Repository Implementation

```typescript
// ✅ CORRECT - User repository extending base
export class UserRepository extends BaseRepository<User> {
  protected table = users;

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(and(
        eq(this.table.email, email),
        isNull(this.table.deletedAt)
      ))
      .limit(1);
    
    return results[0] || null;
  }

  async search(query: string): Promise<User[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(and(
        isNull(this.table.deletedAt),
        or(
          ilike(this.table.firstName, `%${query}%`),
          ilike(this.table.lastName, `%${query}%`),
          ilike(this.table.email, `%${query}%`)
        )
      ));
  }
}

// ❌ INCORRECT - Repository without soft delete filtering
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email)) // Missing deleted_at filter
      .limit(1);
    
    return results[0] || null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id)); // Hard delete
  }
}
```

### Service Layer Pattern

```typescript
// ✅ CORRECT - Service uses soft delete
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async deleteUser(id: string): Promise<Result<void, DomainError>> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      return err(new NotFoundError('User', id));
    }

    // Soft delete instead of hard delete
    const deleted = await this.userRepository.softDelete(id);
    if (!deleted) {
      return err(new DomainError('DELETE_FAILED', 'Failed to delete user'));
    }

    return ok(undefined);
  }

  async restoreUser(id: string): Promise<Result<User, DomainError>> {
    // Check if user is deleted
    const user = await this.userRepository.findByIdWithDeleted(id);
    if (!user) {
      return err(new NotFoundError('User', id));
    }

    if (!user.deletedAt) {
      return err(new DomainError('USER_NOT_DELETED', 'User is not deleted'));
    }

    // Restore user
    const restored = await this.userRepository.restore(id);
    if (!restored) {
      return err(new DomainError('RESTORE_FAILED', 'Failed to restore user'));
    }

    return ok(user);
  }

  async getDeletedUsers(): Promise<Result<User[], DomainError>> {
    const deletedUsers = await this.userRepository.findDeleted();
    return ok(deletedUsers);
  }
}

// ❌ INCORRECT - Service uses hard delete
export class UserService {
  async deleteUser(id: string): Promise<Result<void, DomainError>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return err(new NotFoundError('User', id));
    }

    await this.userRepository.delete(id); // Hard delete - data loss
    return ok(undefined);
  }
}
```

## Migration Pattern

### Database Migration

```typescript
// ✅ CORRECT - Add soft delete to existing table
export const addSoftDeleteToUsers = pgMigration({
  async up(db: MigrationDB) {
    // Add deleted_at column
    await db.schema.alterTable('users')
      .addColumn('deleted_at', 'timestamp', (col) => col.default(null))
      .execute();

    // Create partial indexes
    await db.schema.createIndex('users_email_active_idx')
      .on('users')
      .column('email')
      .where(sql`deleted_at IS NULL`)
      .execute();

    // Update existing indexes to exclude deleted records
    await db.schema.dropIndex('users_email_idx').execute();
  },

  async down(db: MigrationDB) {
    // Remove indexes
    await db.schema.dropIndex('users_email_active_idx').execute();
    
    // Remove column
    await db.schema.alterTable('users')
      .dropColumn('deleted_at')
      .execute();
  },
});
```

## Testing Requirements

### Unit Tests

```typescript
describe('UserRepository', () => {
  describe('soft delete', () => {
    it('should soft delete user', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const deleted = await userRepository.softDelete(user.id);
      expect(deleted).toBe(true);

      // User should not be found in normal queries
      const found = await userRepository.findById(user.id);
      expect(found).toBeNull();

      // User should be found in deleted queries
      const deletedUser = await userRepository.findByIdWithDeleted(user.id);
      expect(deletedUser).toBeTruthy();
      expect(deletedUser!.deletedAt).toBeTruthy();
    });

    it('should restore soft deleted user', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      await userRepository.softDelete(user.id);
      const restored = await userRepository.restore(user.id);
      expect(restored).toBe(true);

      const found = await userRepository.findById(user.id);
      expect(found).toBeTruthy();
      expect(found!.deletedAt).toBeNull();
    });

    it('should exclude deleted records from normal queries', async () => {
      const user1 = await userRepository.create({
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
      });

      const user2 = await userRepository.create({
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
      });

      // Soft delete one user
      await userRepository.softDelete(user2.id);

      // Should only find active users
      const activeUsers = await userRepository.findMany();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].id).toBe(user1.id);

      // Should find deleted users in deleted query
      const deletedUsers = await userRepository.findDeleted();
      expect(deletedUsers).toHaveLength(1);
      expect(deletedUsers[0].id).toBe(user2.id);
    });
  });
});
```

## Common Violations and Fixes

### Missing Soft Delete Filtering

**Violation**: Queries don't filter deleted records
```typescript
// ❌ WRONG
async findByEmail(email: string): Promise<User | null> {
  return await this.db.query.users.findFirst({
    where: eq(users.email, email), // Missing deleted_at filter
  });
}
```

**Fix**: Always filter deleted_at in normal queries
```typescript
// ✅ CORRECT
async findByEmail(email: string): Promise<User | null> {
  return await this.db.query.users.findFirst({
    where: and(
      eq(users.email, email),
      isNull(users.deletedAt)
    ),
  });
}
```

### Hard Delete Instead of Soft Delete

**Violation**: Using hard delete
```typescript
// ❌ WRONG
async deleteUser(id: string): Promise<void> {
  await this.db.delete(users).where(eq(users.id, id));
}
```

**Fix**: Use soft delete
```typescript
// ✅ CORRECT
async softDelete(id: string): Promise<boolean> {
  const result = await this.db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(users.id, id),
      isNull(users.deletedAt)
    ));
  
  return result.rowCount > 0;
}
```

### Non-standard Column Names

**Violation**: Using non-standard column names
```typescript
// ❌ WRONG
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  isDeleted: boolean('is_deleted'), // Wrong name
  removedAt: timestamp('removed_at'), // Wrong name
});
```

**Fix**: Use standard deleted_at column
```typescript
// ✅ CORRECT
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  deletedAt: timestamp('deleted_at'), // Standard name
});
```

## Performance Considerations

### Partial Indexes

```typescript
// ✅ CORRECT - Partial indexes for active records
export const users = pgTable('users', {
  // ... columns
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  // Only index active records
  emailActiveIdx: pgIndex('users_email_active_idx')
    .on(table.email)
    .where(sql`deleted_at IS NULL`),
  
  // Composite index for common queries
  nameEmailActiveIdx: pgIndex('users_name_email_active_idx')
    .on(table.firstName, table.lastName, table.email)
    .where(sql`deleted_at IS NULL`),
}));
```

### Query Optimization

```typescript
// ✅ CORRECT - Efficient queries with proper filtering
class UserRepository {
  async findActiveUsers(): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(isNull(users.deletedAt)) // Uses partial index
      .orderBy(users.createdAt);
  }

  async countActiveUsers(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(isNull(users.deletedAt));
    
    return result[0].count;
  }
}
```

## Benefits

1. **Data Integrity**: No accidental data loss
2. **Audit Trail**: Complete history of deletions
3. **Recovery**: Easy restoration of deleted records
4. **Performance**: Partial indexes optimize active record queries
5. **Consistency**: Standard pattern across all entities

This rule ensures consistent soft delete implementation across the Apex Unified Suite, providing data safety and performance optimization.
