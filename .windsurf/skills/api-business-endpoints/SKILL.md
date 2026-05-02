---
name: api-business-endpoints
description: Implement CRUD operations for all 8 business modules with 2026 API standards and OpenAPI-first development
---

# API Business Endpoints Development

This skill guides you through implementing comprehensive CRUD operations for all business modules in the Apex Unified Suite with complete type safety and validation.

## Current State Assessment

**API Status**: Only health check endpoint exists (`GET /api/healthz`).

**Missing Endpoints**: 80-120 business endpoints across 8 modules:
- **CRM**: Leads, contacts, deals management
- **Projects**: Projects, tasks, templates
- **Documents**: Files, folders, workflows
- **Finance**: Invoices, payments, vendors
- **Assets**: Inventory, maintenance
- **Portal**: Client management
- **Analytics**: Reports, KPIs
- **Settings**: Users, permissions, integrations

## API Development Architecture

### **Endpoint Structure Pattern**
```
/api/{module}/{resource}/{id?}
├── GET    /api/crm/contacts           # List all contacts
├── POST   /api/crm/contacts           # Create new contact
├── GET    /api/crm/contacts/:id       # Get specific contact
├── PUT    /api/crm/contacts/:id       # Update contact
├── DELETE /api/crm/contacts/:id       # Delete contact
├── GET    /api/crm/contacts/search    # Search contacts
└── POST   /api/crm/contacts/:id/toggle # Toggle contact status
```

### **Response Format Standard**
```typescript
// Success Response
{
  "data": T | T[],           // Primary data
  "meta": {                  // Metadata for lists
    "total": number,
    "page": number,
    "limit": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}

// Error Response
{
  "error": string,
  "details": ValidationError[], // For validation errors
  "code": string            // Error code for client handling
}
```

## Step-by-Step Implementation

### **Step 1: Base Route Template**

**File**: `artifacts/api-server/src/routes/base.ts`
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { db } from '@workspace/db';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';

export interface RouteConfig<TInsert, TSelect> {
  tableName: any;
  insertSchema: z.ZodSchema<TInsert>;
  selectSchema: z.ZodSchema<TSelect>;
  permissions: {
    read: string;
    write: string;
    delete?: string;
  };
  searchFields?: string[];
  defaultSort?: string;
}

export function createCRUDRoutes<TInsert, TSelect>(config: RouteConfig<TInsert, TSelect>) {
  const router = Router();

  // GET /api/{resource} - List all
  router.get('/', authenticateToken, requirePermission(config.permissions.read), async (req: AuthenticatedRequest, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const sortBy = req.query.sortBy as string || config.defaultSort || 'createdAt';
      const sortOrder = req.query.sortOrder as string || 'desc';

      let query = db.select().from(config.tableName);

      // Apply search filter
      if (search && config.searchFields) {
        const searchConditions = config.searchFields.map(field => 
          // This would need to be adapted per database
          `${field} ILIKE ${`%${search}%`}`
        );
        query = query.where(searchConditions.join(' OR '));
      }

      // Apply sorting
      query = query.orderBy(`${sortBy} ${sortOrder.toUpperCase()}`);

      // Get total count for pagination
      const totalCount = await db
        .select({ count: config.tableName.id })
        .from(config.tableName);

      // Get paginated results
      const results = await query.limit(limit).offset(offset);

      res.json({
        data: results,
        meta: {
          total: totalCount.length,
          page,
          limit,
          hasNext: offset + limit < totalCount.length,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error(`List ${config.tableName} error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/{resource} - Create
  router.post('/', authenticateToken, requirePermission(config.permissions.write), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = config.insertSchema.parse(req.body);
      
      const result = await db
        .insert(config.tableName)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json({ data: result[0] });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      console.error(`Create ${config.tableName} error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/{resource}/:id - Get by ID
  router.get('/:id', authenticateToken, requirePermission(config.permissions.read), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .select()
        .from(config.tableName)
        .where(eq(config.tableName.id, id))
        .limit(1);

      if (!result[0]) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json({ data: result[0] });
    } catch (error) {
      console.error(`Get ${config.tableName} error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/{resource}/:id - Update
  router.put('/:id', authenticateToken, requirePermission(config.permissions.write), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = config.insertSchema.partial().parse(req.body);
      
      const result = await db
        .update(config.tableName)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(config.tableName.id, id))
        .returning();

      if (!result[0]) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json({ data: result[0] });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error',
          details: error.errors,
        });
      }
      
      console.error(`Update ${config.tableName} error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/{resource}/:id - Delete
  router.delete('/:id', authenticateToken, requirePermission(config.permissions.delete || config.permissions.write), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .delete(config.tableName)
        .where(eq(config.tableName.id, id))
        .returning();

      if (!result[0]) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      res.json({ data: result[0] });
    } catch (error) {
      console.error(`Delete ${config.tableName} error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
```

### **Step 2: CRM Module Implementation**

**File**: `artifacts/api-server/src/routes/crm/contacts.ts`
```typescript
import { Router } from 'express';
import { eq, ilike, or, and } from 'drizzle-orm';
import { db } from '@workspace/db';
import { contactsTable, insertContactSchema, selectContactSchema } from '@workspace/db/schema';
import { createCRUDRoutes } from '../base';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';

const router = Router();

// Custom CRUD routes with search
router.get('/', authenticateToken, requirePermission('crm:contacts:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    let query = db.select().from(contactsTable);

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(contactsTable.firstName, `%${search}%`),
          ilike(contactsTable.lastName, `%${search}%`),
          ilike(contactsTable.email, `%${search}%`),
          ilike(contactsTable.company, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(contactsTable.status, status));
    }

    if (assignedTo) {
      conditions.push(eq(contactsTable.assignedTo, assignedTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalCountQuery = db
      .select({ count: contactsTable.id })
      .from(contactsTable);
      
    if (conditions.length > 0) {
      totalCountQuery.where(and(...conditions));
    }

    const totalCount = await totalCountQuery;

    // Apply sorting and pagination
    const sortField = contactsTable[sortBy as keyof typeof contactsTable];
    if (sortField) {
      query = query.orderBy(sortOrder === 'desc' ? desc(sortField) : asc(sortField));
    }

    const results = await query.limit(limit).offset(offset);

    res.json({
      data: results,
      meta: {
        total: totalCount.length,
        page,
        limit,
        hasNext: offset + limit < totalCount.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('List contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/crm/contacts - Create contact
router.post('/', authenticateToken, requirePermission('crm:contacts:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContactSchema.parse(req.body);
    
    const result = await db
      .insert(contactsTable)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ data: result[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/crm/contacts/:id - Update contact
router.put('/:id', authenticateToken, requirePermission('crm:contacts:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertContactSchema.partial().parse(req.body);
    
    const result = await db
      .update(contactsTable)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(contactsTable.id, id))
      .returning();

    if (!result[0]) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ data: result[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/crm/contacts/:id - Delete contact
router.delete('/:id', authenticateToken, requirePermission('crm:contacts:delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .delete(contactsTable)
      .where(eq(contactsTable.id, id))
      .returning();

    if (!result[0]) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ data: result[0] });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/crm/contacts/:id/toggle-status - Toggle contact status
router.post('/:id/toggle-status', authenticateToken, requirePermission('crm:contacts:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Get current contact
    const current = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1);

    if (!current[0]) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Toggle status
    const newStatus = current[0].status === 'active' ? 'inactive' : 'active';
    
    const result = await db
      .update(contactsTable)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(contactsTable.id, id))
      .returning();

    res.json({ data: result[0] });
  } catch (error) {
    console.error('Toggle contact status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**File**: `artifacts/api-server/src/routes/crm/leads.ts`
```typescript
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '@workspace/db';
import { leadsTable, contactsTable, usersTable, insertLeadSchema } from '@workspace/db/schema';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';

const router = Router();

// GET /api/crm/leads - List leads with contact and assignee info
router.get('/', authenticateToken, requirePermission('crm:leads:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const stage = req.query.stage as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    let query = db
      .select({
        // Lead fields
        id: leadsTable.id,
        title: leadsTable.title,
        description: leadsTable.description,
        value: leadsTable.value,
        stage: leadsTable.stage,
        source: leadsTable.source,
        probability: leadsTable.probability,
        expectedCloseDate: leadsTable.expectedCloseDate,
        actualCloseDate: leadsTable.actualCloseDate,
        createdAt: leadsTable.createdAt,
        updatedAt: leadsTable.updatedAt,
        // Contact fields
        contactId: contactsTable.id,
        contactFirstName: contactsTable.firstName,
        contactLastName: contactsTable.lastName,
        contactEmail: contactsTable.email,
        contactCompany: contactsTable.company,
        // Assignee fields
        assigneeId: usersTable.id,
        assigneeName: usersTable.name,
        assigneeEmail: usersTable.email,
      })
      .from(leadsTable)
      .leftJoin(contactsTable, eq(leadsTable.contactId, contactsTable.id))
      .leftJoin(usersTable, eq(leadsTable.assignedTo, usersTable.id));

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(leadsTable.title, `%${search}%`),
          ilike(leadsTable.description, `%${search}%`),
          ilike(contactsTable.firstName, `%${search}%`),
          ilike(contactsTable.lastName, `%${search}%`),
          ilike(contactsTable.company, `%${search}%`)
        )
      );
    }

    if (stage) {
      conditions.push(eq(leadsTable.stage, stage));
    }

    if (assignedTo) {
      conditions.push(eq(leadsTable.assignedTo, assignedTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalCountQuery = db
      .select({ count: leadsTable.id })
      .from(leadsTable)
      .leftJoin(contactsTable, eq(leadsTable.contactId, contactsTable.id))
      .leftJoin(usersTable, eq(leadsTable.assignedTo, usersTable.id));
      
    if (conditions.length > 0) {
      totalCountQuery.where(and(...conditions));
    }

    const totalCount = await totalCountQuery;

    // Apply sorting
    const sortField = leadsTable[sortBy as keyof typeof leadsTable];
    if (sortField) {
      query = query.orderBy(sortOrder === 'desc' ? desc(sortField) : asc(sortField));
    }

    const results = await query.limit(limit).offset(offset);

    res.json({
      data: results,
      meta: {
        total: totalCount.length,
        page,
        limit,
        hasNext: offset + limit < totalCount.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('List leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/crm/leads - Create lead
router.post('/', authenticateToken, requirePermission('crm:leads:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertLeadSchema.parse(req.body);
    
    const result = await db
      .insert(leadsTable)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ data: result[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/crm/leads/:id/stage - Update lead stage
router.put('/:id/stage', authenticateToken, requirePermission('crm:leads:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { stage, actualCloseDate } = req.body;
    
    const updateData: any = { stage, updatedAt: new Date() };
    
    // Set actual close date when moving to closed stages
    if (['closed_won', 'closed_lost'].includes(stage)) {
      updateData.actualCloseDate = actualCloseDate || new Date();
    } else {
      updateData.actualCloseDate = null;
    }

    const result = await db
      .update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, id))
      .returning();

    if (!result[0]) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ data: result[0] });
  } catch (error) {
    console.error('Update lead stage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### **Step 3: Projects Module Implementation**

**File**: `artifacts/api-server/src/routes/projects/projects.ts`
```typescript
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '@workspace/db';
import { projectsTable, usersTable, insertProjectSchema } from '@workspace/db/schema';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';

const router = Router();

// GET /api/projects - List projects with team members
router.get('/', authenticateToken, requirePermission('projects:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const clientId = req.query.clientId as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    let query = db
      .select({
        // Project fields
        id: projectsTable.id,
        name: projectsTable.name,
        description: projectsTable.description,
        status: projectsTable.status,
        priority: projectsTable.priority,
        startDate: projectsTable.startDate,
        endDate: projectsTable.endDate,
        budget: projectsTable.budget,
        progress: projectsTable.progress,
        clientId: projectsTable.clientId,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
        // Manager info
        managerId: usersTable.id,
        managerName: usersTable.name,
        managerEmail: usersTable.email,
      })
      .from(projectsTable)
      .leftJoin(usersTable, eq(projectsTable.managerId, usersTable.id));

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(projectsTable.name, `%${search}%`),
          ilike(projectsTable.description, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(projectsTable.status, status));
    }

    if (clientId) {
      conditions.push(eq(projectsTable.clientId, clientId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalCount = await db
      .select({ count: projectsTable.id })
      .from(projectsTable)
      .leftJoin(usersTable, eq(projectsTable.managerId, usersTable.id))
      .where(and(...conditions));

    // Apply sorting
    const sortField = projectsTable[sortBy as keyof typeof projectsTable];
    if (sortField) {
      query = query.orderBy(sortOrder === 'desc' ? desc(sortField) : asc(sortField));
    }

    const results = await query.limit(limit).offset(offset);

    res.json({
      data: results,
      meta: {
        total: totalCount.length,
        page,
        limit,
        hasNext: offset + limit < totalCount.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects - Create project
router.post('/', authenticateToken, requirePermission('projects:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertProjectSchema.parse(req.body);
    
    const result = await db
      .insert(projectsTable)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ data: result[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id/progress - Update project progress
router.put('/:id/progress', authenticateToken, requirePermission('projects:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }

    const result = await db
      .update(projectsTable)
      .set({
        progress,
        updatedAt: new Date(),
        // Auto-update status based on progress
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'planning',
      })
      .where(eq(projectsTable.id, id))
      .returning();

    if (!result[0]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ data: result[0] });
  } catch (error) {
    console.error('Update project progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### **Step 4: Finance Module Implementation**

**File**: `artifacts/api-server/src/routes/finance/invoices.ts`
```typescript
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '@workspace/db';
import { invoicesTable, vendorsTable, insertInvoiceSchema } from '@workspace/db/schema';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';

const router = Router();

// GET /api/finance/invoices - List invoices with vendor info
router.get('/', authenticateToken, requirePermission('finance:invoices:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string; // 'ap' or 'ar'
    const vendorId = req.query.vendorId as string;
    const sortBy = req.query.sortBy as string || 'dueDate';
    const sortOrder = req.query.sortOrder as string || 'asc';

    let query = db
      .select({
        // Invoice fields
        id: invoicesTable.id,
        invoiceNumber: invoicesTable.invoiceNumber,
        type: invoicesTable.type,
        amount: invoicesTable.amount,
        status: invoicesTable.status,
        issueDate: invoicesTable.issueDate,
        dueDate: invoicesTable.dueDate,
        paidDate: invoicesTable.paidDate,
        description: invoicesTable.description,
        vendorId: invoicesTable.vendorId,
        customerId: invoicesTable.customerId,
        createdAt: invoicesTable.createdAt,
        updatedAt: invoicesTable.updatedAt,
        // Vendor/Customer info
        vendorName: vendorsTable.name,
        vendorEmail: vendorsTable.email,
      })
      .from(invoicesTable)
      .leftJoin(vendorsTable, eq(invoicesTable.vendorId, vendorsTable.id));

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(invoicesTable.invoiceNumber, `%${search}%`),
          ilike(invoicesTable.description, `%${search}%`),
          ilike(vendorsTable.name, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(invoicesTable.status, status));
    }

    if (type) {
      conditions.push(eq(invoicesTable.type, type));
    }

    if (vendorId) {
      conditions.push(eq(invoicesTable.vendorId, vendorId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalCount = await db
      .select({ count: invoicesTable.id })
      .from(invoicesTable)
      .leftJoin(vendorsTable, eq(invoicesTable.vendorId, vendorsTable.id))
      .where(and(...conditions));

    // Apply sorting
    const sortField = invoicesTable[sortBy as keyof typeof invoicesTable];
    if (sortField) {
      query = query.orderBy(sortOrder === 'desc' ? desc(sortField) : asc(sortField));
    }

    const results = await query.limit(limit).offset(offset);

    res.json({
      data: results,
      meta: {
        total: totalCount.length,
        page,
        limit,
        hasNext: offset + limit < totalCount.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/finance/invoices - Create invoice
router.post('/', authenticateToken, requirePermission('finance:invoices:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertInvoiceSchema.parse(req.body);
    
    // Generate invoice number if not provided
    if (!validatedData.invoiceNumber) {
      const lastInvoice = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.type, validatedData.type))
        .orderBy(desc(invoicesTable.createdAt))
        .limit(1);

      const prefix = validatedData.type === 'ap' ? 'AP' : 'AR';
      const nextNumber = lastInvoice[0] 
        ? parseInt(lastInvoice[0].invoiceNumber.replace(`${prefix}-`, '')) + 1
        : 1;
      
      validatedData.invoiceNumber = `${prefix}-${String(nextNumber).padStart(6, '0')}`;
    }
    
    const result = await db
      .insert(invoicesTable)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ data: result[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/finance/invoices/:id/approve - Approve invoice
router.post('/:id/approve', authenticateToken, requirePermission('finance:invoices:approve'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await db
      .update(invoicesTable)
      .set({
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(and(
        eq(invoicesTable.id, id),
        eq(invoicesTable.status, 'draft')
      ))
      .returning();

    if (!result[0]) {
      return res.status(404).json({ error: 'Invoice not found or not in draft status' });
    }

    res.json({ data: result[0] });
  } catch (error) {
    console.error('Approve invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### **Step 5: Update Route Registration**

**File**: `artifacts/api-server/src/routes/index.ts`
```typescript
import { Router } from 'express';
import authRouter from './auth';
import healthRouter from './health';

// CRM routes
import contactsRouter from './crm/contacts';
import leadsRouter from './crm/leads';
import dealsRouter from './crm/deals';

// Project routes
import projectsRouter from './projects/projects';
import tasksRouter from './projects/tasks';
import templatesRouter from './projects/templates';

// Document routes
import foldersRouter from './documents/folders';
import documentsRouter from './documents/documents';
import workflowsRouter from './documents/workflows';

// Finance routes
import invoicesRouter from './finance/invoices';
import paymentsRouter from './finance/payments';
import vendorsRouter from './finance/vendors';

// Asset routes
import assetsRouter from './assets/assets';
import maintenanceRouter from './assets/maintenance';

// Portal routes
import clientsRouter from './portal/clients';
import brandingRouter from './portal/branding';

// Analytics routes
import reportsRouter from './analytics/reports';
import kpisRouter from './analytics/kpis';

// Settings routes
import usersRouter from './settings/users';
import permissionsRouter from './settings/permissions';
import integrationsRouter from './settings/integrations';

const router = Router();

// Health and auth
router.use('/health', healthRouter);
router.use('/auth', authRouter);

// Business modules
router.use('/crm/contacts', contactsRouter);
router.use('/crm/leads', leadsRouter);
router.use('/crm/deals', dealsRouter);

router.use('/projects', projectsRouter);
router.use('/projects/tasks', tasksRouter);
router.use('/projects/templates', templatesRouter);

router.use('/documents/folders', foldersRouter);
router.use('/documents', documentsRouter);
router.use('/documents/workflows', workflowsRouter);

router.use('/finance/invoices', invoicesRouter);
router.use('/finance/payments', paymentsRouter);
router.use('/finance/vendors', vendorsRouter);

router.use('/assets', assetsRouter);
router.use('/assets/maintenance', maintenanceRouter);

router.use('/portal/clients', clientsRouter);
router.use('/portal/branding', brandingRouter);

router.use('/analytics/reports', reportsRouter);
router.use('/analytics/kpis', kpisRouter);

router.use('/settings/users', usersRouter);
router.use('/settings/permissions', permissionsRouter);
router.use('/settings/integrations', integrationsRouter);

export default router;
```

### **Step 6: Update OpenAPI Specification**

**File**: `lib/api-spec/openapi.yaml`
```yaml
openapi: 3.1.0
info:
  title: Api
  version: 0.1.0
servers:
  - url: /api

paths:
  # Health
  /healthz:
    get:
      operationId: healthCheck
      responses:
        '200':
          description: Health check response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthStatus'

  # CRM Contacts
  /crm/contacts:
    get:
      operationId: getContacts
      summary: Get all contacts
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: search
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive]
      responses:
        '200':
          description: List of contacts
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContactListResponse'
    
    post:
      operationId: createContact
      summary: Create new contact
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateContactRequest'
      responses:
        '201':
          description: Contact created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContactResponse'

  /crm/contacts/{id}:
    get:
      operationId: getContact
      summary: Get specific contact
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Contact details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContactResponse'
    
    put:
      operationId: updateContact
      summary: Update contact
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateContactRequest'
      responses:
        '200':
          description: Contact updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContactResponse'
    
    delete:
      operationId: deleteContact
      summary: Delete contact
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Contact deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContactResponse'

  # CRM Leads
  /crm/leads:
    get:
      operationId: getLeads
      summary: Get all leads
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: search
          in: query
          schema:
            type: string
        - name: stage
          in: query
          schema:
            type: string
            enum: [new, qualified, proposal, negotiation, closed_won, closed_lost]
      responses:
        '200':
          description: List of leads
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LeadListResponse'
    
    post:
      operationId: createLead
      summary: Create new lead
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateLeadRequest'
      responses:
        '201':
          description: Lead created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LeadResponse'

components:
  schemas:
    HealthStatus:
      type: object
      properties:
        status:
          type: string
          example: ok
        timestamp:
          type: string
          format: date-time
        uptime:
          type: number

    Contact:
      type: object
      properties:
        id:
          type: string
          format: uuid
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
        phone:
          type: string
        company:
          type: string
        title:
          type: string
        status:
          type: string
          enum: [active, inactive]
        assignedTo:
          type: string
          format: uuid
        tags:
          type: array
          items:
            type: string
        notes:
          type: string
        lastContactedAt:
          type: string
          format: date-time
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateContactRequest:
      type: object
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          minLength: 1
        lastName:
          type: string
          minLength: 1
        email:
          type: string
          format: email
        phone:
          type: string
        company:
          type: string
        title:
          type: string
        assignedTo:
          type: string
          format: uuid
        tags:
          type: array
          items:
            type: string
        notes:
          type: string

    UpdateContactRequest:
      type: object
      properties:
        firstName:
          type: string
          minLength: 1
        lastName:
          type: string
          minLength: 1
        email:
          type: string
          format: email
        phone:
          type: string
        company:
          type: string
        title:
          type: string
        status:
          type: string
          enum: [active, inactive]
        assignedTo:
          type: string
          format: uuid
        tags:
          type: array
          items:
            type: string
        notes:
          type: string

    ContactResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Contact'

    ContactListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Contact'
        meta:
          $ref: '#/components/schemas/ListMeta'

    Lead:
      type: object
      properties:
        id:
          type: string
          format: uuid
        contactId:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        value:
          type: number
          format: decimal
        stage:
          type: string
          enum: [new, qualified, proposal, negotiation, closed_won, closed_lost]
        source:
          type: string
        assignedTo:
          type: string
          format: uuid
        probability:
          type: integer
          minimum: 0
          maximum: 100
        expectedCloseDate:
          type: string
          format: date
        actualCloseDate:
          type: string
          format: date
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateLeadRequest:
      type: object
      required:
        - contactId
        - title
      properties:
        contactId:
          type: string
          format: uuid
        title:
          type: string
          minLength: 1
        description:
          type: string
        value:
          type: number
          format: decimal
        stage:
          type: string
          enum: [new, qualified, proposal, negotiation, closed_won, closed_lost]
          default: new
        source:
          type: string
        assignedTo:
          type: string
          format: uuid
        probability:
          type: integer
          minimum: 0
          maximum: 100
          default: 0
        expectedCloseDate:
          type: string
          format: date

    LeadResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Lead'

    LeadListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Lead'
        meta:
          $ref: '#/components/schemas/ListMeta'

    ListMeta:
      type: object
      properties:
        total:
          type: integer
        page:
          type: integer
        limit:
          type: integer
        hasNext:
          type: boolean
        hasPrev:
          type: boolean

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

## Testing API Endpoints

### **Unit Tests**
```typescript
// tests/api/crm/contacts.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { db } from '@workspace/db';
import { contactsTable } from '@workspace/db/schema';

describe('CRM Contacts API', () => {
  beforeEach(async () => {
    await db.delete(contactsTable);
  });

  describe('GET /api/crm/contacts', () => {
    it('should return empty list when no contacts exist', async () => {
      const response = await request(app)
        .get('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it('should return contacts with pagination', async () => {
      // Create test contacts
      await db.insert(contactsTable).values([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'active',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          status: 'active',
        },
      ]);

      const response = await request(app)
        .get('/api/crm/contacts?page=1&limit=1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.total).toBe(2);
      expect(response.body.meta.hasNext).toBe(true);
    });
  });

  describe('POST /api/crm/contacts', () => {
    it('should create a new contact', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
      };

      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(contactData)
        .expect(201);

      expect(response.body.data.firstName).toBe(contactData.firstName);
      expect(response.body.data.email).toBe(contactData.email);
      expect(response.body.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '',
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toBeDefined();
    });
  });
});
```

### **Integration Tests**
```typescript
// tests/api/integration/crm-flow.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { db } from '@workspace/db';
import { contactsTable, leadsTable } from '@workspace/db/schema';

describe('CRM Integration Flow', () => {
  let contactId: string;
  let leadId: string;

  it('should create contact then lead for that contact', async () => {
    // Create contact
    const contactResponse = await request(app)
      .post('/api/crm/contacts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
      })
      .expect(201);

    contactId = contactResponse.body.data.id;

    // Create lead for the contact
    const leadResponse = await request(app)
      .post('/api/crm/leads')
      .set('Authorization', 'Bearer valid-token')
      .send({
        contactId,
        title: 'Enterprise Software Deal',
        value: '50000.00',
        stage: 'qualified',
      })
      .expect(201);

    leadId = leadResponse.body.data.id;
    expect(leadResponse.body.data.contactId).toBe(contactId);

    // Verify lead appears in contact's leads list
    const leadsResponse = await request(app)
      .get('/api/crm/leads')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    const createdLead = leadsResponse.body.data.find((lead: any) => lead.id === leadId);
    expect(createdLead).toBeDefined();
    expect(createdLead.contactEmail).toBe('john@example.com');
  });
});
```

## Implementation Checklist

### **Backend Tasks**
- [ ] Implement all CRUD routes for 8 business modules
- [ ] Add proper authentication and authorization
- [ ] Implement search and filtering
- [ ] Add pagination to all list endpoints
- [ ] Create comprehensive OpenAPI specification
- [ ] Add input validation with Zod schemas
- [ ] Implement error handling and logging
- [ ] Add unit and integration tests

### **OpenAPI Tasks**
- [ ] Define all request/response schemas
- [ ] Add proper operation IDs for code generation
- [ ] Include authentication requirements
- [ ] Document all parameters and responses
- [ ] Run codegen to update frontend types

### **Testing Tasks**
- [ ] Unit tests for all endpoints
- [ ] Integration tests for business flows
- [ ] Performance tests for large datasets
- [ ] Security tests for authorization
- [ ] Load testing for concurrent requests

This comprehensive API implementation provides full CRUD functionality for all business modules with proper authentication, validation, pagination, and testing coverage, enabling the Apex Unified Suite to function as a complete business management platform.
