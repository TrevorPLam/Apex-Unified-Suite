---
name: portal-permission-filter
description: Implement client portal data access control with granular permission checking, ensuring clients can only view and interact with data they've been explicitly granted access to.
---

# Portal Permission Filter Implementation

## Overview

This skill guides the implementation of a comprehensive permission filtering system for the client portal that enforces granular data access control at the row level, ensuring clients can only access data they've been explicitly granted permission to view or modify.

## Core Architecture

### 1. Permission Schema Design

#### Portal Clients Table
```sql
CREATE TABLE portal_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portal_clients_tenant ON portal_clients(tenant_id);
CREATE INDEX idx_portal_clients_email ON portal_clients(email);
```

#### Portal Content Permissions Table
```sql
CREATE TABLE portal_content_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'document', 'project', 'invoice', 'appointment', etc.
  resource_id UUID NOT NULL,
  permission_level VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'download', 'edit')),
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ, -- Optional expiry for temporary access
  is_active BOOLEAN DEFAULT true,
  metadata JSONB, -- Additional permission metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_portal_permissions_unique ON portal_content_permissions(
  portal_client_id, resource_type, resource_id
) WHERE is_active = true;
CREATE INDEX idx_portal_permissions_client ON portal_content_permissions(portal_client_id);
CREATE INDEX idx_portal_permissions_resource ON portal_content_permissions(resource_type, resource_id);
CREATE INDEX idx_portal_permissions_tenant ON portal_content_permissions(tenant_id);
```

#### Portal Messages Table
```sql
CREATE TABLE portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'general' CHECK (message_type IN ('general', 'document_share', 'appointment_reminder', 'invoice_notification')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('firm_to_client', 'client_to_firm')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  reply_to_id UUID REFERENCES portal_messages(id), -- For message threads
  attachments JSONB, -- Array of attachment metadata
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portal_messages_client ON portal_messages(portal_client_id);
CREATE INDEX idx_portal_messages_tenant ON portal_messages(tenant_id);
CREATE INDEX idx_portal_messages_unread ON portal_messages(portal_client_id, is_read);
```

### 2. Portal Permission Service

```typescript
// src/services/PortalPermissionService.ts
import { Database } from 'drizzle-orm';
import { portalContentPermissions, portalClients, portalMessages } from '../db/schema';
import { eq, and, or, inArray, exists } from 'drizzle-orm';
import { PortalAccessDeniedError, NotFoundError } from '../domain/errors';

export interface PermissionCheck {
  resourceType: string;
  resourceId: string;
  requiredPermission: 'view' | 'comment' | 'download' | 'edit';
}

export interface ClientContext {
  clientId: string;
  tenantId: string;
  userId?: string;
}

export class PortalPermissionService {
  constructor(private db: Database) {}

  /**
   * Check if a client has permission to access a specific resource
   */
  async checkPermission(
    clientContext: ClientContext,
    resourceType: string,
    resourceId: string,
    requiredPermission: string = 'view'
  ): Promise<boolean> {
    const permission = await this.db
      .select()
      .from(portalContentPermissions)
      .where(and(
        eq(portalContentPermissions.portal_client_id, clientContext.clientId),
        eq(portalContentPermissions.tenant_id, clientContext.tenantId),
        eq(portalContentPermissions.resource_type, resourceType),
        eq(portalContentPermissions.resource_id, resourceId),
        eq(portalContentPermissions.permission_level, requiredPermission),
        eq(portalContentPermissions.is_active, true),
        or(
          eq(portalContentPermissions.expires_at, null),
          sql`${portalContentPermissions.expires_at} > now()`
        )
      ))
      .limit(1);

    return permission.length > 0;
  }

  /**
   * Check multiple permissions at once
   */
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

  /**
   * Get all resources a client can access of a specific type
   */
  async getAccessibleResourceIds(
    clientContext: ClientContext,
    resourceType: string,
    permissionLevel: string = 'view'
  ): Promise<string[]> {
    const permissions = await this.db
      .select({ resourceId: portalContentPermissions.resource_id })
      .from(portalContentPermissions)
      .where(and(
        eq(portalContentPermissions.portal_client_id, clientContext.clientId),
        eq(portalContentPermissions.tenant_id, clientContext.tenantId),
        eq(portalContentPermissions.resource_type, resourceType),
        eq(portalContentPermissions.permission_level, permissionLevel),
        eq(portalContentPermissions.is_active, true),
        or(
          eq(portalContentPermissions.expires_at, null),
          sql`${portalContentPermissions.expires_at} > now()`
        )
      ));

    return permissions.map(p => p.resourceId);
  }

  /**
   * Grant permission to a client for a resource
   */
  async grantPermission(
    tenantId: string,
    clientId: string,
    resourceType: string,
    resourceId: string,
    permissionLevel: string,
    grantedBy: string,
    expiresAt?: Date,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if permission already exists
    const existing = await this.db
      .select()
      .from(portalContentPermissions)
      .where(and(
        eq(portalContentPermissions.portal_client_id, clientId),
        eq(portalContentPermissions.tenant_id, tenantId),
        eq(portalContentPermissions.resource_type, resourceType),
        eq(portalContentPermissions.resource_id, resourceId),
        eq(portalContentPermissions.is_active, true)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing permission
      await this.db
        .update(portalContentPermissions)
        .set({
          permission_level: permissionLevel,
          expires_at: expiresAt || null,
          metadata: metadata || {},
          updated_at: new Date()
        })
        .where(eq(portalContentPermissions.id, existing[0].id));
    } else {
      // Create new permission
      await this.db.insert(portalContentPermissions).values({
        tenantId,
        portalClientId: clientId,
        resourceType,
        resourceId,
        permissionLevel,
        grantedBy,
        expiresAt: expiresAt || null,
        metadata: metadata || {},
        isActive: true
      });
    }
  }

  /**
   * Revoke permission from a client
   */
  async revokePermission(
    tenantId: string,
    clientId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    await this.db
      .update(portalContentPermissions)
      .set({
        is_active: false,
        updated_at: new Date()
      })
      .where(and(
        eq(portalContentPermissions.portal_client_id, clientId),
        eq(portalContentPermissions.tenant_id, tenantId),
        eq(portalContentPermissions.resource_type, resourceType),
        eq(portalContentPermissions.resource_id, resourceId)
      ));
  }

  /**
   * Build a permission filter for database queries
   */
  buildPermissionFilter(
    clientContext: ClientContext,
    resourceType: string,
    permissionLevel: string = 'view',
    resourceIdColumn: string = 'id'
  ): any {
    return exists(
      this.db
        .select({ id: 1 })
        .from(portalContentPermissions)
        .where(and(
          eq(portalContentPermissions.portal_client_id, clientContext.clientId),
          eq(portalContentPermissions.tenant_id, clientContext.tenantId),
          eq(portalContentPermissions.resource_type, resourceType),
          eq(portalContentPermissions.resource_id, sql`${resourceIdColumn}`),
          eq(portalContentPermissions.permission_level, permissionLevel),
          eq(portalContentPermissions.is_active, true),
          or(
            eq(portalContentPermissions.expires_at, null),
            sql`${portalContentPermissions.expires_at} > now()`
          )
        ))
    );
  }
}
```

### 3. Repository Enhancement

Enhance existing repositories to support permission filtering:

```typescript
// src/repositories/DocumentRepository.ts
import { Database } from 'drizzle-orm';
import { documents, portalContentPermissions } from '../db/schema';
import { eq, and, exists } from 'drizzle-orm';
import { PortalPermissionService } from '../services/PortalPermissionService';

export class DocumentRepository {
  constructor(
    private db: Database,
    private portalPermissionService?: PortalPermissionService
  ) {}

  /**
   * Find documents for portal client with permission filtering
   */
  async findForPortalClient(
    clientContext: ClientContext,
    options: DocumentSearchOptions = {}
  ): Promise<Document[]> {
    let query = this.db
      .select()
      .from(documents)
      .where(and(
        eq(documents.tenant_id, clientContext.tenantId),
        eq(documents.is_active, true)
      ));

    // Apply permission filter if portal context
    if (this.portalPermissionService) {
      const permissionFilter = this.portalPermissionService.buildPermissionFilter(
        clientContext,
        'document',
        'view',
        documents.id
      );
      query = query.where(and(query.getSQL().where, permissionFilter));
    }

    // Apply additional filters
    if (options.search) {
      query = query.where(and(
        query.getSQL().where,
        or(
          sql`${documents.title} ILIKE ${`%${options.search}%`}`,
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

    return await query.limit(options.limit || 50).offset(options.offset || 0);
  }

  /**
   * Find single document for portal client
   */
  async findByIdForPortalClient(
    clientContext: ClientContext,
    documentId: string
  ): Promise<Document | null> {
    // Check permission first
    if (this.portalPermissionService) {
      const hasPermission = await this.portalPermissionService.checkPermission(
        clientContext,
        'document',
        documentId,
        'view'
      );

      if (!hasPermission) {
        throw new PortalAccessDeniedError('No permission to view this document');
      }
    }

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
}
```

### 4. Middleware for API Protection

```typescript
// src/middleware/portalAuth.ts
import { Request, Response, NextFunction } from 'express';
import { PortalPermissionService } from '../services/PortalPermissionService';
import { PortalAccessDeniedError } from '../domain/errors';

export interface PortalRequest extends Request {
  portalClient?: {
    id: string;
    tenantId: string;
    email: string;
  };
}

/**
 * Middleware to extract portal client context from JWT token
 */
export function portalAuthMiddleware(
  portalPermissionService: PortalPermissionService
) {
  return async (req: PortalRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No portal token provided' });
      }

      // Verify portal JWT token and extract client info
      const payload = await verifyPortalToken(token);
      
      // Verify client exists and is active
      const client = await portalPermissionService.db
        .select()
        .from(portalClients)
        .where(and(
          eq(portalClients.id, payload.clientId),
          eq(portalClients.tenant_id, payload.tenantId),
          eq(portalClients.is_active, true)
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
}

/**
 * Middleware to check specific resource permissions
 */
export function requirePortalPermission(
  resourceType: string,
  permissionLevel: string = 'view',
  resourceIdParam: string = 'id'
) {
  return async (req: PortalRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.portalClient) {
        return res.status(401).json({ error: 'Portal client context required' });
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID required' });
      }

      const portalPermissionService = req.app.get('portalPermissionService') as PortalPermissionService;
      
      const hasPermission = await portalPermissionService.checkPermission(
        {
          clientId: req.portalClient.id,
          tenantId: req.portalClient.tenantId
        },
        resourceType,
        resourceId,
        permissionLevel
      );

      if (!hasPermission) {
        throw new PortalAccessDeniedError(`No ${permissionLevel} permission for ${resourceType}`);
      }

      next();
    } catch (error) {
      if (error instanceof PortalAccessDeniedError) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  };
}
```

### 5. Protected API Routes

```typescript
// src/routes/portal/documents.ts
import { Router } from 'express';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { portalAuthMiddleware, requirePortalPermission } from '../middleware/portalAuth';

const router = Router();

// Apply portal auth to all portal routes
router.use(portalAuthMiddleware(portalPermissionService));

// GET /api/portal/documents - List accessible documents
router.get('/', async (req: PortalRequest, res, next) => {
  try {
    const documents = await documentRepository.findForPortalClient({
      clientId: req.portalClient!.id,
      tenantId: req.portalClient!.tenantId
    }, {
      search: req.query.search as string,
      category: req.query.category as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0
    });

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/documents/:id - Get specific document
router.get('/:id', 
  requirePortalPermission('document', 'view', 'id'),
  async (req: PortalRequest, res, next) => {
    try {
      const document = await documentRepository.findByIdForPortalClient(
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
  }
);

// GET /api/portal/documents/:id/download - Download document
router.get('/:id/download',
  requirePortalPermission('document', 'download', 'id'),
  async (req: PortalRequest, res, next) => {
    try {
      const document = await documentRepository.findByIdForPortalClient(
        {
          clientId: req.portalClient!.id,
          tenantId: req.portalClient!.tenantId
        },
        req.params.id
      );

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Generate signed URL for download
      const downloadUrl = await storageService.getDownloadUrl(document.file_path);
      
      res.json({ downloadUrl });
    } catch (error) {
      next(error);
    }
  }
);
```

### 6. Message Access Control

```typescript
// src/services/PortalMessageService.ts
export class PortalMessageService {
  constructor(private db: Database) {}

  /**
   * Get messages for a specific client
   */
  async getClientMessages(
    clientContext: ClientContext,
    options: MessageOptions = {}
  ): Promise<PortalMessage[]> {
    let query = this.db
      .select()
      .from(portalMessages)
      .where(and(
        eq(portalMessages.portal_client_id, clientContext.clientId),
        eq(portalMessages.tenant_id, clientContext.tenantId)
      ));

    // Filter by read status
    if (options.unreadOnly) {
      query = query.where(and(
        query.getSQL().where,
        eq(portalMessages.is_read, false)
      ));
    }

    // Filter by message type
    if (options.messageType) {
      query = query.where(and(
        query.getSQL().where,
        eq(portalMessages.message_type, options.messageType)
      ));
    }

    return await query
      .orderBy(portalMessages.sent_at)
      .limit(options.limit || 50)
      .offset(options.offset || 0);
  }

  /**
   * Send message from firm to client
   */
  async sendMessageToClient(
    tenantId: string,
    clientId: string,
    subject: string,
    content: string,
    messageType: string = 'general',
    createdBy: string,
    attachments?: any[]
  ): Promise<PortalMessage> {
    const message = await this.db.insert(portalMessages).values({
      tenantId,
      portalClientId: clientId,
      subject,
      content,
      messageType,
      direction: 'firm_to_client',
      attachments: attachments || [],
      createdBy
    }).returning();

    // Emit domain event
    await this.emitEvent('PortalMessageSent', {
      messageId: message[0].id,
      clientId,
      direction: 'firm_to_client',
      messageType
    });

    return message[0];
  }

  /**
   * Send message from client to firm
   */
  async sendMessageFromClient(
    clientContext: ClientContext,
    subject: string,
    content: string,
    attachments?: any[]
  ): Promise<PortalMessage> {
    const message = await this.db.insert(portalMessages).values({
      tenantId: clientContext.tenantId,
      portalClientId: clientContext.clientId,
      subject,
      content,
      direction: 'client_to_firm',
      attachments: attachments || []
    }).returning();

    // Emit domain event
    await this.emitEvent('PortalMessageReceived', {
      messageId: message[0].id,
      clientId: clientContext.clientId,
      direction: 'client_to_firm'
    });

    return message[0];
  }

  /**
   * Mark message as read
   */
  async markAsRead(
    clientContext: ClientContext,
    messageId: string
  ): Promise<void> {
    await this.db
      .update(portalMessages)
      .set({
        is_read: true,
        read_at: new Date()
      })
      .where(and(
        eq(portalMessages.id, messageId),
        eq(portalMessages.portal_client_id, clientContext.clientId),
        eq(portalMessages.tenant_id, clientContext.tenantId)
      ));
  }
}
```

## Implementation Checklist

- [ ] Create portal permission database schema
- [ ] Implement PortalPermissionService with all core methods
- [ ] Create portal authentication middleware
- [ ] Implement permission checking middleware
- [ ] Enhance existing repositories with permission filtering
- [ ] Create protected API routes for portal access
- [ ] Implement PortalMessageService for client communication
- [ ] Add JWT token verification for portal clients
- [ ] Create permission management UI for firm users
- [ ] Add audit logging for all permission changes
- [ ] Implement integration tests for permission scenarios
- [ ] Add monitoring for permission violations

## Testing Requirements

### Unit Tests
- Test permission checking logic
- Test permission filter generation
- Test message access control
- Test JWT token verification

### Integration Tests
- Test end-to-end portal access flow
- Test permission inheritance and expiration
- Test concurrent permission changes
- Test message sending and receiving

### Security Tests
- Test unauthorized access attempts
- Test permission escalation attempts
- Test cross-tenant data access
- Test expired permission handling

## Security Considerations

- All portal access requires explicit permission grants
- Permissions have optional expiration dates
- Audit trail for all permission changes
- Rate limiting on portal endpoints
- Input validation for all portal requests
- Secure token storage and transmission

## Performance Optimizations

- Database indexes on permission queries
- Caching for frequently accessed permissions
- Efficient permission filter queries using EXISTS
- Batch permission checks for multiple resources

## Monitoring

- Track permission check success/failure rates
- Monitor portal authentication attempts
- Alert on unusual permission access patterns
- Track message delivery and read rates
