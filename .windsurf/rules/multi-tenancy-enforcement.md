---
trigger: glob
globs: artifacts/api-server/src/**/*.ts
---

# Multi-Tenancy Enforcement Rule

Every repository query **must** include a `WHERE organizationId = ?` filter to ensure strict tenant isolation. This is the most critical security invariant for the Apex Unified Suite.

## Core Requirement

All database queries **must** be scoped to the current organization. Never return data across tenant boundaries.

## Implementation Pattern

### **Repository Pattern**
```typescript
// ✅ CORRECT - Always filter by organizationId
export class ContactRepository {
  async findById(id: string, organizationId: string): Promise<Contact | null> {
    return await db
      .select()
      .from(contactsTable)
      .where(
        and(
          eq(contactsTable.id, id),
          eq(contactsTable.organizationId, organizationId)
        )
      )
      .limit(1);
  }

  async list(organizationId: string, options: ListOptions = {}): Promise<Contact[]> {
    let query = db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.organizationId, organizationId));

    // Apply additional filters
    if (options.status) {
      query = query.where(eq(contactsTable.status, options.status));
    }

    if (options.search) {
      query = query.where(
        or(
          ilike(contactsTable.firstName, `%${options.search}%`),
          ilike(contactsTable.lastName, `%${options.search}%`),
          ilike(contactsTable.email, `%${options.search}%`)
        )
      );
    }

    return await query;
  }

  async create(data: CreateContactData, organizationId: string): Promise<Contact> {
    const result = await db
      .insert(contactsTable)
      .values({
        ...data,
        organizationId, // Never forget to set organizationId
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }
}
```

### **Service Layer Pattern**
```typescript
// ✅ CORRECT - Pass organizationId through all service calls
export class ContactService {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly userService: UserService
  ) {}

  async getContact(id: string, user: AuthenticatedUser): Promise<Contact> {
    // Always use the user's organizationId
    return await this.contactRepository.findById(id, user.organizationId);
  }

  async listContacts(user: AuthenticatedUser, options: ListOptions = {}): Promise<Contact[]> {
    return await this.contactRepository.list(user.organizationId, options);
  }

  async createContact(data: CreateContactData, user: AuthenticatedUser): Promise<Contact> {
    // Validate business rules
    const validation = this.validateContactData(data);
    if (validation.isErr()) {
      return err(validation.error);
    }

    // Check for duplicates within organization
    const existing = await this.contactRepository.findByEmail(
      data.email,
      user.organizationId
    );
    if (existing) {
      return err(new DomainError('DUPLICATE_CONTACT', 'Contact with this email already exists'));
    }

    return ok(await this.contactRepository.create(data, user.organizationId));
  }
}
```

### **Route Handler Pattern**
```typescript
// ✅ CORRECT - Extract organizationId from authenticated user
router.get('/contacts', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { user } = req;
    const contacts = await contactService.listContacts(user, req.query);
    res.json({ data: contacts });
  } catch (error) {
    next(error);
  }
});

router.post('/contacts', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { user } = req;
    const result = await contactService.createContact(req.body, user);
    
    if (result.isErr()) {
      return next(result.error);
    }
    
    res.status(201).json({ data: result.value });
  } catch (error) {
    next(error);
  }
});
```

## Critical Security Patterns

### **Authentication Middleware**
```typescript
// ✅ CORRECT - Always include organizationId in user object
export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string; // Critical for tenant isolation
  role: string;
  permissions: string[];
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Fetch user with organization
    const user = await userService.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId, // Never omit organizationId
      role: user.role,
      permissions: user.permissions,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### **Database Query Safety**
```typescript
// ❌ INCORRECT - Missing organizationId filter
export class BadContactRepository {
  async findById(id: string): Promise<Contact | null> {
    // SECURITY RISK: Returns contact from any organization
    return await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1);
  }
}

// ❌ INCORRECT - Cross-tenant data access
export class BadContactService {
  async getContactStats(organizationId: string): Promise<any> {
    // SECURITY RISK: Counts contacts across ALL organizations
    const totalContacts = await db
      .select({ count: count() })
      .from(contactsTable); // Missing WHERE organizationId = ?

    const orgContacts = await db
      .select({ count: count() })
      .from(contactsTable)
      .where(eq(contactsTable.organizationId, organizationId));

    return { totalContacts, orgContacts };
  }
}
```

## Schema Requirements

### **All Tables Must Have organizationId**
```typescript
// ✅ CORRECT - Every business table includes organizationId
export const contactsTable = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(), // REQUIRED
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Foreign key references must include organizationId
export const leadsTable = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(), // REQUIRED
  contactId: uuid("contact_id").references(() => contactsTable.id),
  title: text("title").notNull(),
  // ... other fields
});
```

### **System Tables Exception**
Only system-level tables may omit `organizationId`:
- `users` (user belongs to org via relationship)
- `organizations` (the org table itself)
- `system_settings` (global settings)
- `audit_logs` (includes organizationId for filtering)

## Testing Requirements

### **Unit Tests Must Test Tenant Isolation**
```typescript
describe('ContactRepository', () => {
  describe('findById', () => {
    it('should only return contacts from the same organization', async () => {
      const org1Id = 'org-1';
      const org2Id = 'org-2';
      
      // Create contacts in different organizations
      const contact1 = await repo.create({ firstName: 'John', email: 'john@org1.com' }, org1Id);
      const contact2 = await repo.create({ firstName: 'Jane', email: 'jane@org2.com' }, org2Id);

      // Should find contact in org1 when searching org1
      const foundInOrg1 = await repo.findById(contact1.id, org1Id);
      expect(foundInOrg1).toBeTruthy();
      expect(foundInOrg1?.organizationId).toBe(org1Id);

      // Should NOT find contact in org1 when searching org2
      const notFound = await repo.findById(contact1.id, org2Id);
      expect(notFound).toBeNull();
    });
  });
});
```

### **Integration Tests Must Verify Isolation**
```typescript
describe('Multi-Tenancy Integration', () => {
  it('should prevent cross-tenant data access', async () => {
    const user1 = await createTestUser({ organizationId: 'org-1' });
    const user2 = await createTestUser({ organizationId: 'org-2' });

    // User1 creates contact
    const contact = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ firstName: 'John', email: 'john@org1.com' })
      .expect(201);

    // User2 should NOT see user1's contact
    await request(app)
      .get(`/api/contacts/${contact.body.data.id}`)
      .set('Authorization', `Bearer ${user2.token}`)
      .expect(404);

    // User2 should only see their own contacts
    await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${user2.token}`)
      .expect(200)
      .expect(res => {
        expect(res.body.data).toHaveLength(0);
      });
  });
});
```

## Migration Safety

### **Adding organizationId to Existing Tables**
```sql
-- Step 1: Add column
ALTER TABLE contacts ADD COLUMN organization_id UUID NOT NULL DEFAULT 'temp-org-id';

-- Step 2: Backfill data (run in script)
UPDATE contacts SET organization_id = user.organization_id 
FROM users WHERE contacts.user_id = users.id;

-- Step 3: Add foreign key constraint
ALTER TABLE contacts 
ADD CONSTRAINT contacts_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Step 4: Add NOT NULL constraint (after backfill)
ALTER TABLE contacts ALTER COLUMN organization_id SET NOT NULL;
```

## Audit Requirements

### **Audit All Data Access**
```typescript
export class AuditService {
  async logDataAccess(
    action: 'read' | 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    await db.insert(auditLogsTable).values({
      action,
      resource,
      resourceId,
      userId,
      organizationId, // Always log organization for audit trails
      timestamp: new Date(),
      ipAddress: '192.168.1.1', // From request
      userAgent: 'Mozilla/5.0...', // From request
    });
  }
}
```

## Anti-Patterns

❌ **Never** query without `organizationId` filter
❌ **Never** assume user context includes organizationId - validate it
❌ **Never** create tables without `organizationId` (except system tables)
❌ **Never** use global caches without tenant scoping
❌ **Never** allow cross-tenant data aggregation
❌ **Never** implement shared resources without proper isolation

## Enforcement Checklist

- [ ] All repository methods accept `organizationId` parameter
- [ ] All database queries include `WHERE organizationId = ?`
- [ ] All business tables have `organizationId` column
- [ ] Authentication middleware includes `organizationId` in user object
- [ ] Route handlers pass `user.organizationId` to services
- [ ] Tests verify tenant isolation
- [ ] Audit logs include `organizationId`
- [ ] No global queries exist without tenant filtering
- [ ] Foreign key relationships respect tenant boundaries
- [ ] Cache keys include organizationId for proper isolation

## Security Impact

Failure to enforce multi-tenancy results in:
- **Data Leakage**: Users can access other organizations' data
- **Privacy Violations**: Cross-tenant exposure of sensitive information
- **Compliance Issues**: GDPR, HIPAA, and other regulation violations
- **Security Breaches**: Unauthorized data access across tenant boundaries
- **Business Impact**: Loss of customer trust and potential legal action

This rule is **non-negotiable** and must be enforced in all data access patterns.
