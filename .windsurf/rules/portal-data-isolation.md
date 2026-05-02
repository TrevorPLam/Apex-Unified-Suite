---
trigger: model_decision
description: Client portal routes must always call the permission filter; never return unfiltered data. Any missing permission must result in PortalAccessDenied.
---

# Portal Data Isolation Rule

## Purpose

Enforce that all client portal API routes must apply permission filtering before returning data. This ensures strict tenant data isolation and prevents any possibility of clients accessing data they haven't been explicitly granted permission to view.

## Core Isolation Requirements

### Mandatory Permission Filtering

**All portal API endpoints must:**

1. **Apply Permission Filter**: Call `PortalPermissionService.buildPermissionFilter()` for every query
2. **Never Return Unfiltered Data**: Raw database queries are prohibited
3. **Tenant Isolation**: Ensure queries are scoped to the client's tenant
4. **Permission Validation**: Check specific permissions (view, download, etc.)
5. **Error Handling**: Return `PortalAccessDenied` for missing permissions

### Permission Filter Application

**Database queries must include permission filter:**

```typescript
// ❌ INCORRECT - Unfiltered query
const documents = await db
  .select()
  .from(documents)
  .where(eq(documents.tenant_id, tenantId));

// ✅ CORRECT - Permission filtered query
const documents = await db
  .select()
  .from(documents)
  .where(and(
    eq(documents.tenant_id, tenantId),
    portalPermissionService.buildPermissionFilter(
      clientContext,
      'document',
      'view',
      documents.id
    )
  ));
```

## Implementation Requirements

### Repository Layer Enforcement

```typescript
// src/repositories/PortalDocumentRepository.ts
export class PortalDocumentRepository {
  constructor(
    private db: Database,
    private portalPermissionService: PortalPermissionService
  ) {}

  async findDocuments(
    clientContext: ClientContext,
    options: DocumentSearchOptions = {}
  ): Promise<Document[]> {
    // ALWAYS apply permission filter
    const permissionFilter = this.portalPermissionService.buildPermissionFilter(
      clientContext,
      'document',
      'view',
      documents.id
    );

    let query = this.db
      .select()
      .from(documents)
      .where(and(
        eq(documents.tenant_id, clientContext.tenantId),
        eq(documents.is_active, true),
        permissionFilter // Mandatory permission filter
      ));

    // Apply additional filters
    if (options.search) {
      query = query.where(and(
        query.getSQL().where,
        or(
          sql`${documents.name} ILIKE ${`%${options.search}%`}`,
          sql`${documents.description} ILIKE ${`%${options.search}%`}`
        )
      ));
    }

    if (options.category) {
      query = query.where(and(
        query.getSQL().where,
        eq(documents.category, options.category)
      ));
    }

    return await query
      .limit(options.limit || 50)
      .offset(options.offset || 0);
  }

  async findById(
    clientContext: ClientContext,
    documentId: string
  ): Promise<Document | null> {
    // Check permission first (more efficient for single record)
    const hasPermission = await this.portalPermissionService.checkPermission(
      clientContext,
      'document',
      documentId,
      'view'
    );

    if (!hasPermission) {
      throw new PortalAccessDeniedError('No permission to view this document');
    }

    // Now fetch the document (permission already verified)
    const document = await this.db
      .select()
      .from(documents)
      .where(and(
        eq(documents.id, documentId),
        eq(documents.tenant_id, clientContext.tenantId),
        eq(documents.is_active, true)
      ))
      .limit(1);

    return document[0] || null;
  }

  async findInvoices(
    clientContext: ClientContext,
    options: InvoiceSearchOptions = {}
  ): Promise<Invoice[]> {
    // ALWAYS apply permission filter
    const permissionFilter = this.portalPermissionService.buildPermissionFilter(
      clientContext,
      'invoice',
      'view',
      invoices.id
    );

    return await this.db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.tenant_id, clientContext.tenantId),
        eq(invoices.is_active, true),
        permissionFilter // Mandatory permission filter
      ))
      .orderBy(desc(invoices.created_at))
      .limit(options.limit || 50);
  }

  async findProjects(
    clientContext: ClientContext,
    options: ProjectSearchOptions = {}
  ): Promise<Project[]> {
    // ALWAYS apply permission filter
    const permissionFilter = this.portalPermissionService.buildPermissionFilter(
      clientContext,
      'project',
      'view',
      projects.id
    );

    return await this.db
      .select()
      .from(projects)
      .where(and(
        eq(projects.tenant_id, clientContext.tenantId),
        eq(projects.is_active, true),
        permissionFilter // Mandatory permission filter
      ))
      .orderBy(desc(projects.created_at))
      .limit(options.limit || 50);
  }
}
```

### API Layer Enforcement

```typescript
// src/routes/portal/documents.ts
import { portalAuthMiddleware } from '../middleware/portalAuth';

// Apply portal auth to ALL portal routes
router.use(portalAuthMiddleware(portalPermissionService));

// GET /api/portal/documents - List accessible documents
router.get('/', async (req: PortalRequest, res, next) => {
  try {
    // Repository automatically applies permission filtering
    const documents = await portalDocumentRepository.findDocuments(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      {
        search: req.query.search as string,
        category: req.query.category as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      }
    );

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/documents/:id - Get specific document
router.get('/:id', async (req: PortalRequest, res, next) => {
  try {
    // Repository checks permissions before fetching
    const document = await portalDocumentRepository.findById(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      req.params.id
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/documents/:id/download - Download document
router.get('/:id/download', async (req: PortalRequest, res, next) => {
  try {
    // Check download permission specifically
    const hasDownloadPermission = await portalPermissionService.checkPermission(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      'document',
      req.params.id,
      'download'
    );

    if (!hasDownloadPermission) {
      throw new PortalAccessDeniedError('No download permission for this document');
    }

    // Get document details for download
    const document = await portalDocumentRepository.findById(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      req.params.id
    );

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate download URL
    const downloadUrl = await storageService.getDownloadUrl(document.file_path);

    // Log access
    await portalPermissionService.logAccess({
      tenantId: req.portalClient!.tenantId,
      clientId: req.portalClient!.id,
      documentId: req.params.id,
      accessType: 'download',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ downloadUrl });
  } catch (error) {
    next(error);
  }
});
```

### Permission Service Implementation

```typescript
// src/services/PortalPermissionService.ts
export class PortalPermissionService {
  constructor(private db: Database) {}

  buildPermissionFilter(
    clientContext: ClientContext,
    resourceType: string,
    permissionLevel: string = 'view',
    resourceIdColumn: string = 'id'
  ): any {
    return exists(
      this.db
        .select({ id: 1 })
        .from(portal_content_permissions)
        .where(and(
          eq(portal_content_permissions.portal_client_id, clientContext.clientId),
          eq(portal_content_permissions.tenant_id, clientContext.tenantId),
          eq(portal_content_permissions.resource_type, resourceType),
          eq(portal_content_permissions.resource_id, sql`${resourceIdColumn}`),
          eq(portal_content_permissions.permission_level, permissionLevel),
          eq(portal_content_permissions.is_active, true),
          or(
            eq(portal_content_permissions.expires_at, null),
            sql`${portal_content_permissions.expires_at} > now()`
          )
        ))
    );
  }

  async checkPermission(
    clientContext: ClientContext,
    resourceType: string,
    resourceId: string,
    requiredPermission: string = 'view'
  ): Promise<boolean> {
    const permission = await this.db
      .select()
      .from(portal_content_permissions)
      .where(and(
        eq(portal_content_permissions.portal_client_id, clientContext.clientId),
        eq(portal_content_permissions.tenant_id, clientContext.tenantId),
        eq(portal_content_permissions.resource_type, resourceType),
        eq(portal_content_permissions.resource_id, resourceId),
        eq(portal_content_permissions.permission_level, requiredPermission),
        eq(portal_content_permissions.is_active, true),
        or(
          eq(portal_content_permissions.expires_at, null),
          sql`${portal_content_permissions.expires_at} > now()`
        )
      ))
      .limit(1);

    return permission.length > 0;
  }

  async checkPermissions(
    clientContext: ClientContext,
    checks: PermissionCheck[]
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const check of checks) {
      const key = `${check.resourceType}:${check.resourceId}:${check.requiredPermission}`;
      results.set(key, await this.checkPermission(
        clientContext,
        check.resourceType,
        check.resourceId,
        check.requiredPermission
      ));
    }

    return results;
  }

  async getAccessibleResourceIds(
    clientContext: ClientContext,
    resourceType: string,
    permissionLevel: string = 'view'
  ): Promise<string[]> {
    const permissions = await this.db
      .select({ resourceId: portal_content_permissions.resource_id })
      .from(portal_content_permissions)
      .where(and(
        eq(portal_content_permissions.portal_client_id, clientContext.clientId),
        eq(portal_content_permissions.tenant_id, clientContext.tenantId),
        eq(portal_content_permissions.resource_type, resourceType),
        eq(portal_content_permissions.permission_level, permissionLevel),
        eq(portal_content_permissions.is_active, true),
        or(
          eq(portal_content_permissions.expires_at, null),
          sql`${portal_content_permissions.expires_at} > now()`
        )
      ));

    return permissions.map(p => p.resourceId);
  }

  async logAccess(accessData: {
    tenantId: string;
    clientId: string;
    documentId?: string;
    resourceId?: string;
    resourceType?: string;
    accessType: 'view' | 'download' | 'preview';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.db.insert(document_version_access_log).values({
      tenantId: accessData.tenantId,
      documentId: accessData.documentId,
      resourceId: accessData.resourceId,
      resourceType: accessData.resourceType || 'document',
      portalClientId: accessData.clientId,
      accessType: accessData.accessType,
      ipAddress: accessData.ipAddress,
      userAgent: accessData.userAgent
    });
  }
}
```

### Error Handling

```typescript
// src/middleware/portalAuth.ts
export const portalAuthMiddleware = (
  portalPermissionService: PortalPermissionService
) => {
  return async (req: PortalRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No portal token provided' });
      }

      // Verify portal JWT token
      const payload = await verifyPortalToken(token);
      
      // Verify client exists and is active
      const client = await db
        .select()
        .from(portal_clients)
        .where(and(
          eq(portal_clients.id, payload.clientId),
          eq(portal_clients.tenant_id, payload.tenantId),
          eq(portal_clients.is_active, true)
        ))
        .limit(1);

      if (!client[0]) {
        return res.status(401).json({ error: 'Invalid portal client' });
      }

      req.portalClient = {
        id: client[0].id,
        tenantId: client[0].tenant_id,
        email: client[0].email
      };

      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid portal token' });
    }
  };
};

// Error handler middleware for portal access
export const portalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof PortalAccessDeniedError) {
    return res.status(403).json({
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }

  next(error);
};
```

## Testing Requirements

### Unit Tests

**Test permission filtering enforcement:**

```typescript
describe('Portal Data Isolation', () => {
  test('should apply permission filter to document queries', async () => {
      const clientContext = createMockClientContext();
      const repository = new PortalDocumentRepository(db, permissionService);
      
      // Mock permission service to return filter
      const buildPermissionFilterSpy = jest.spyOn(
        permissionService,
        'buildPermissionFilter'
      ).mockReturnValue(sql`EXISTS (SELECT 1 FROM portal_content_permissions WHERE ...)`);

      await repository.findDocuments(clientContext, { search: 'test' });

      // Verify permission filter was called
      expect(buildPermissionFilterSpy).toHaveBeenCalledWith(
        clientContext,
        'document',
        'view',
        'documents.id'
      );
    });

  test('should throw PortalAccessDenied for missing permission', async () => {
      const clientContext = createMockClientContext();
      const repository = new PortalDocumentRepository(db, permissionService);
      
      // Mock permission check to return false
      jest.spyOn(permissionService, 'checkPermission').mockResolvedValue(false);

      await expect(
        repository.findById(clientContext, 'doc-123')
      ).rejects.toThrow(PortalAccessDeniedError);
    });

    test('should prevent unfiltered data access', async () => {
      const clientContext = createMockClientContext();
      
      // Try to bypass repository and query directly
      const directQuery = db
        .select()
        .from(documents)
        .where(eq(documents.tenant_id, clientContext.tenantId));

      // This should not be used in portal code
      expect(() => directQuery).toThrow('Portal routes must use permission filtering');
    });
  });
});
```

### Integration Tests

**Test end-to-end data isolation:**

1. **Client Separation**: Client A cannot access Client B's data
2. **Permission Granularity**: Different permission levels work correctly
3. **Tenant Isolation**: Cross-tenant access is prevented
4. **Permission Expiry**: Expired permissions are rejected

### Security Tests

**Test security scenarios:**

1. **Token Manipulation**: Modified tokens are rejected
2. **Client Impersonation**: Cannot impersonate other clients
3. **Permission Escalation**: Cannot access higher-level permissions
4. **SQL Injection**: Permission filters prevent injection

## Performance Considerations

### Efficient Permission Filtering

```typescript
// Optimized permission filter with EXISTS
buildPermissionFilter(
  clientContext: ClientContext,
  resourceType: string,
  permissionLevel: string,
  resourceIdColumn: string
): any {
  return exists(
    this.db
      .select({ id: 1 })
      .from(portal_content_permissions)
      .where(and(
        eq(portal_content_permissions.portal_client_id, clientContext.clientId),
        eq(portal_content_permissions.tenant_id, clientContext.tenantId),
        eq(portal_content_permissions.resource_type, resourceType),
        eq(portal_content_permissions.resource_id, sql`${resourceIdColumn}`),
        eq(portal_content_permissions.permission_level, permissionLevel),
        eq(portal_content_permissions.is_active, true)
        // Add index hints for better performance
      ))
  );
}
```

### Database Indexes

```sql
-- Optimize permission queries
CREATE INDEX idx_portal_permissions_client_resource ON portal_content_permissions(
  portal_client_id, 
  resource_type, 
  resource_id, 
  permission_level
) WHERE is_active = true;

CREATE INDEX idx_portal_permissions_tenant ON portal_content_permissions(tenant_id);
CREATE INDEX idx_portal_permissions_expiry ON portal_content_permissions(expires_at) WHERE expires_at IS NOT NULL;
```

## Enforcement Checklist

- [ ] All portal repositories apply permission filtering
- [ ] Permission filtering uses EXISTS for performance
- [ ] API endpoints never return unfiltered data
- [ ] Missing permissions result in PortalAccessDenied
- [ ] Tenant isolation is enforced at database level
- [ ] Permission checks are performed before data access
- [ ] Access logging tracks all portal interactions
- [ ] Comprehensive test coverage for isolation scenarios
- [ ] Performance optimization for permission queries
- [ ] Error handling prevents data leakage
- [ ] Security monitoring for access patterns
- [ ] Database indexes support efficient permission queries
