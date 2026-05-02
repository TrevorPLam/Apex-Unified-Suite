---
trigger: glob
globs: **/*.ts
---

# Drizzle Query Patterns Rule

Enforce no raw SQL joins across bounded context boundaries, use `returning()` after inserts/updates, and always use parameterized queries.

## Core Query Principles

### **Use Drizzle Query Builder**
```typescript
// ✅ CORRECT - Use Drizzle query builder
const contacts = await db
  .select()
  .from(contactsTable)
  .where(eq(contactsTable.organizationId, organizationId))
  .orderBy(desc(contactsTable.createdAt));

// ❌ INCORRECT - Raw SQL queries
const contacts = await db.execute(
  sql`SELECT * FROM contacts WHERE organization_id = ${organizationId} ORDER BY created_at DESC`
);
```

### **Parameterized Queries Only**
```typescript
// ✅ CORRECT - Use Drizzle's parameterized queries
const user = await db
  .select()
  .from(usersTable)
  .where(and(
    eq(usersTable.email, email),
    eq(usersTable.organizationId, organizationId)
  ))
  .limit(1);

// ❌ INCORRECT - String interpolation (SQL injection risk)
const user = await db.execute(
  sql`SELECT * FROM users WHERE email = '${email}' AND organization_id = '${organizationId}'`
);
```

## Bounded Context Boundaries

### **No Cross-Context Joins**
```typescript
// ✅ CORRECT - Queries stay within bounded context
const contactWithLeads = await db
  .select({
    contact: {
      id: contactsTable.id,
      firstName: contactsTable.firstName,
      lastName: contactsTable.lastName,
      email: contactsTable.email,
    },
    leads: leadsTable.map(lead => ({
      id: lead.id,
      title: lead.title,
      stage: lead.stage,
    })),
  })
  .from(contactsTable)
  .leftJoin(leadsTable, eq(leadsTable.contactId, contactsTable.id))
  .where(eq(contactsTable.organizationId, organizationId));

// ❌ INCORRECT - Cross-context joins (CRM + Finance)
const contactWithInvoices = await db
  .select()
  .from(contactsTable) // CRM context
  .leftJoin(invoicesTable, eq(invoicesTable.customerId, contactsTable.id)) // Finance context
  .where(eq(contactsTable.organizationId, organizationId));
```

### **Service-Based Data Composition**
```typescript
// ✅ CORRECT - Use services to compose data across contexts
export class ContactService {
  async getContactWithFinancialData(contactId: string, organizationId: string) {
    // Get contact data from CRM context
    const contact = await this.contactRepository.findById(contactId, organizationId);
    if (!contact) {
      return err(new NotFoundError('Contact', contactId));
    }

    // Get financial data from Finance context
    const invoices = await this.invoiceService.getInvoicesForContact(contactId, organizationId);
    const payments = await this.paymentService.getPaymentsForContact(contactId, organizationId);

    return ok({
      contact,
      financialData: {
        invoices,
        payments,
        totalOutstanding: this.calculateOutstanding(invoices, payments),
      },
    });
  }
}
```

## Insert and Update Patterns

### **Always Use returning()**
```typescript
// ✅ CORRECT - Use returning() to get inserted/updated data
const newContact = await db
  .insert(contactsTable)
  .values({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  .returning(); // Returns the inserted record

// ✅ CORRECT - Use returning() for updates
const updatedContact = await db
  .update(contactsTable)
  .set({
    firstName: 'Jane',
    updatedAt: new Date(),
  })
  .where(eq(contactsTable.id, contactId))
  .returning(); // Returns the updated record

// ❌ INCORRECT - No returning(), no way to get the result
await db
  .insert(contactsTable)
  .values({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  });
  // No way to get the inserted contact data
```

### **Transaction Patterns**
```typescript
// ✅ CORRECT - Use transactions for related operations
const result = await db.transaction(async (tx) => {
  // Create contact
  const [contact] = await tx
    .insert(contactsTable)
    .values(contactData)
    .returning();

  // Create initial lead
  const [lead] = await tx
    .insert(leadsTable)
    .values({
      contactId: contact.id,
      title: 'Initial Lead',
      organizationId,
    })
    .returning();

  return { contact, lead };
});

// ✅ CORRECT - Handle transaction failures
try {
  const result = await db.transaction(async (tx) => {
    // Multiple related operations
  });
  return ok(result);
} catch (error) {
  return err(new DomainError('TRANSACTION_FAILED', 'Failed to create contact and lead'));
}
```

## Query Optimization Patterns

### **Selective Field Selection**
```typescript
// ✅ CORRECT - Select only needed fields
const contactList = await db
  .select({
    id: contactsTable.id,
    firstName: contactsTable.firstName,
    lastName: contactsTable.lastName,
    email: contactsTable.email,
    // Don't select sensitive fields like internal notes unless needed
  })
  .from(contactsTable)
  .where(eq(contactsTable.organizationId, organizationId));

// ✅ CORRECT - Use count() for counting instead of fetching all records
const contactCount = await db
  .select({ count: count() })
  .from(contactsTable)
  .where(eq(contactsTable.organizationId, organizationId));
```

### **Efficient Pagination**
```typescript
// ✅ CORRECT - Use limit/offset for pagination
const contacts = await db
  .select()
  .from(contactsTable)
  .where(eq(contactsTable.organizationId, organizationId))
  .orderBy(desc(contactsTable.createdAt))
  .limit(20)
  .offset((page - 1) * 20);

// ✅ CORRECT - Get total count separately for pagination meta
const totalCount = await db
  .select({ count: count() })
  .from(contactsTable)
  .where(eq(contactsTable.organizationId, organizationId));
```

### **Index Usage**
```typescript
// ✅ CORRECT - Query patterns that use indexes effectively
const contactsByEmail = await db
  .select()
  .from(contactsTable)
  .where(and(
    eq(contactsTable.organizationId, organizationId), // Index: organization_id
    eq(contactsTable.email, email) // Index: email (within organization)
  ))
  .limit(1);

// ✅ CORRECT - Use composite indexes for common query patterns
const activeContacts = await db
  .select()
  .from(contactsTable)
  .where(and(
    eq(contactsTable.organizationId, organizationId),
    eq(contactsTable.status, 'active') // Composite index: (organization_id, status)
  ));
```

## Query Builder Patterns

### **Complex Filtering**
```typescript
// ✅ CORRECT - Build complex filters programmatically
function buildContactQuery(filters: ContactFilters, organizationId: string) {
  let query = db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.organizationId, organizationId));

  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(contactsTable.firstName, `%${filters.search}%`),
        ilike(contactsTable.lastName, `%${filters.search}%`),
        ilike(contactsTable.email, `%${filters.search}%`)
      )
    );
  }

  if (filters.status) {
    conditions.push(eq(contactsTable.status, filters.status));
  }

  if (filters.assignedTo) {
    conditions.push(eq(contactsTable.assignedTo, filters.assignedTo));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  if (filters.sortBy) {
    const sortField = contactsTable[filters.sortBy as keyof typeof contactsTable];
    if (sortField) {
      query = query.orderBy(
        filters.sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      );
    }
  }

  return query;
}
```

### **Aggregation Queries**
```typescript
// ✅ CORRECT - Use Drizzle aggregation functions
const contactStats = await db
  .select({
    totalContacts: count(contactsTable.id),
    activeContacts: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
    recentContacts: sql<number>`COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)`,
  })
  .from(contactsTable)
  .where(eq(contactsTable.organizationId, organizationId));

// ✅ CORRECT - Group by queries
const contactsByStatus = await db
  .select({
    status: contactsTable.status,
    count: count(contactsTable.id),
  })
  .from(contactsTable)
  .where(eq(contactsTable.organizationId, organizationId))
  .groupBy(contactsTable.status)
  .orderBy(desc(count(contactsTable.id)));
```

## Error Handling Patterns

### **Query Error Handling**
```typescript
// ✅ CORRECT - Wrap queries in try-catch with proper error handling
export class ContactRepository {
  async findById(id: string, organizationId: string): Promise<Result<Contact, DomainError>> {
    try {
      const [contact] = await db
        .select()
        .from(contactsTable)
        .where(and(
          eq(contactsTable.id, id),
          eq(contactsTable.organizationId, organizationId)
        ))
        .limit(1);

      if (!contact) {
        return err(new NotFoundError('Contact', id));
      }

      return ok(contact);
    } catch (error) {
      console.error('Database error in findById:', error);
      return err(new DomainError('DATABASE_ERROR', 'Failed to fetch contact'));
    }
  }
}
```

### **Connection Management**
```typescript
// ✅ CORRECT - Use connection pooling properly
export class DatabaseService {
  private db: DrizzleDB;

  constructor() {
    const connection = postgres(process.env.DATABASE_URL, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });
    this.db = drizzle(connection);
  }

  async close(): Promise<void> {
    await this.db.$client.end();
  }
}
```

## Testing Query Patterns

### **Repository Testing**
```typescript
// ✅ CORRECT - Test query patterns with actual database
describe('ContactRepository', () => {
  let db: Database;
  let repository: ContactRepository;

  beforeEach(async () => {
    db = await setupTestDatabase();
    repository = new ContactRepository(db);
  });

  it('should find contacts by organization', async () => {
    // Arrange
    const org1Id = 'org-1';
    const org2Id = 'org-2';
    
    await db.insert(contactsTable).values([
      { firstName: 'John', email: 'john@org1.com', organizationId: org1Id },
      { firstName: 'Jane', email: 'jane@org2.com', organizationId: org2Id },
    ]);

    // Act
    const org1Contacts = await repository.list(org1Id);
    const org2Contacts = await repository.list(org2Id);

    // Assert
    expect(org1Contacts).toHaveLength(1);
    expect(org1Contacts[0].email).toBe('john@org1.com');
    expect(org2Contacts).toHaveLength(1);
    expect(org2Contacts[0].email).toBe('jane@org2.com');
  });
});
```

## Anti-Patterns

❌ **Never** use raw SQL strings with interpolation
❌ **Never** join across bounded context boundaries
❌ **Never** forget to use `returning()` after inserts/updates
❌ **Never** use `*` in select unless absolutely necessary
❌ **Never** fetch unnecessary data in loops
❌ **Never** ignore database errors in production
❌ **Never** use string concatenation for query building
❌ **Never** hardcode values in queries (use parameters)

## Performance Guidelines

### **Query Performance Checklist**
- [ ] Queries use appropriate indexes
- [ ] Select only needed fields
- [ ] Use limit/offset for pagination
- [ ] Avoid N+1 query patterns
- [ ] Use transactions for related operations
- [ ] Monitor slow queries
- [ ] Use connection pooling
- [ ] Batch operations when possible

### **Security Checklist**
- [ ] All queries use parameterized values
- [ ] Organization filtering is never bypassed
- [ ] No raw SQL with user input
- [ ] Sensitive data is filtered in select
- [ ] SQL injection protection is maintained

This rule ensures secure, performant, and maintainable database queries that respect bounded context boundaries and follow Drizzle ORM best practices.
