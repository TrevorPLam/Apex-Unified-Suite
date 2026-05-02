# Skills

This document consolidates all available skills in the Apex Unified Suite development environment.

Generated on: 2026-05-02

Total Skills: 39

---

## api-business-endpoints

**Description:** Implement CRUD operations for all 8 business modules with 2026 API standards and OpenAPI-first development

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

---

## api-versioning-setup

**Description:** Complete guide for implementing API versioning with /api/v1/ prefix across OpenAPI spec, Express routes, and generated code for the Apex Unified Suite.

# API Versioning Setup Guide

## Overview
This skill guides you through implementing a comprehensive API versioning strategy using `/api/v1/` prefix across the entire Apex Unified Suite stack: OpenAPI specification, Express router configuration, and generated client code.

## Prerequisites
- Access to `lib/api-spec/openapi.yaml`
- Backend API server access (`artifacts/api-server/`)
- Generated code workflow (`Orval` configuration)
- Understanding of current API structure

## Step 1: Update OpenAPI Specification

### Modify Base Path
Edit `lib/api-spec/openapi.yaml`:

```yaml
openapi: 3.0.3
info:
  title: Apex Unified Suite API
  version: 1.0.0
  description: API for the Apex Unified Suite business management platform
servers:
  - url: /api/v1
    description: Version 1 API endpoints
```

### Update All Endpoint Paths
Add `/api/v1` prefix to all existing endpoints:

```yaml
# Before
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy

  /crm/contacts:
    get:
      summary: List contacts
      responses:
        '200':
          description: List of contacts

# After
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service is healthy

  /crm/contacts:
    get:
      summary: List contacts
      responses:
        '200':
          description: List of contacts
```

Note: The `/api/v1` prefix is handled by the server configuration, not duplicated in the path definitions.

## Step 2: Configure Express Router

### Create Version Router Structure
Create `artifacts/api-server/src/routes/v1/index.ts`:

```typescript
import { Router } from 'express';
import { healthRouter } from './health.js';
import { crmRouter } from './crm.js';
import { projectsRouter } from './projects.js';
import { documentsRouter } from './documents.js';
import { financeRouter } from './finance.js';
import { assetsRouter } from './assets.js';
import { portalRouter } from './portal.js';
import { analyticsRouter } from './analytics.js';
import { settingsRouter } from './settings.js';

export const v1Router = Router();

// Mount all v1 routes
v1Router.use('/health', healthRouter);
v1Router.use('/crm', crmRouter);
v1Router.use('/projects', projectsRouter);
v1Router.use('/documents', documentsRouter);
v1Router.use('/finance', financeRouter);
v1Router.use('/assets', assetsRouter);
v1Router.use('/portal', portalRouter);
v1Router.use('/analytics', analyticsRouter);
v1Router.use('/settings', settingsRouter);
```

### Update Main Router
Modify `artifacts/api-server/src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { v1Router } from './v1/index.js';

export const apiRouter = Router();

// Mount versioned routes
apiRouter.use('/v1', v1Router);

// Legacy support (optional - can be removed for clean v1 start)
// apiRouter.use('/', legacyRouter); // For backward compatibility if needed
```

### Update Server Configuration
Modify `artifacts/api-server/src/server.ts`:

```typescript
import express from 'express';
import { apiRouter } from './routes/index.js';

const app = express();

// API routes with version prefix
app.use('/api', apiRouter);

// Health check at root for load balancers
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export { app };
```

## Step 3: Update Orval Configuration

### Modify Base URL
Edit `lib/api-spec/orval.config.ts`:

```typescript
import { defineConfig } from '@orval/import';

export default defineConfig({
  api: {
    output: {
      mode: 'split',
      target: '../api-client-react/src/generated/',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: '../api-client-react/src/custom-fetch.ts',
          name: 'customFetch',
        },
      },
    },
    input: {
      target: './openapi.yaml',
    },
    hooks: {
      afterAllFilesWrite: 'npm run typecheck',
    },
    definitions: {
      // Add base URL configuration
      baseQuery: {
        // This will be handled by the frontend configuration
      },
    },
  },
});
```

### Update Custom Fetch Client
Ensure `lib/api-client-react/src/custom-fetch.ts` handles the base URL:

```typescript
interface FetchConfig {
  baseUrl?: string;
}

let authTokenGetter: (() => string | undefined) | null = null;

export function setAuthTokenGetter(getter: () => string | undefined) {
  authTokenGetter = getter;
}

export const customFetch = async (
  url: string,
  options?: RequestInit & { config?: FetchConfig }
) => {
  const config = options?.config || {};
  const baseUrl = config.baseUrl || '/api/v1'; // Default to v1
  
  // Ensure URL starts with base path
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  
  const headers = new Headers(options?.headers);
  
  if (authTokenGetter) {
    const token = authTokenGetter();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  return fetch(fullUrl, {
    ...options,
    headers,
  });
};
```

## Step 4: Frontend Configuration

### Update Vite Base Path
Ensure `artifacts/apex-os/vite.config.ts` handles API proxying:

```typescript
export default defineConfig({
  // ... other config
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### Update API Client Usage
The generated hooks will automatically use the correct base URL. Verify in components:

```typescript
import { useListContacts } from '@workspace/api-client-react';

function ContactsPage() {
  const { data: contacts, isLoading, error } = useListContacts();
  // This will call /api/v1/crm/contacts automatically
}
```

## Step 5: Code Generation and Testing

### Regenerate Client Code
```bash
pnpm --filter @workspace/api-spec run codegen
```

### Verify Generated Paths
Check that generated files in `lib/api-client-react/src/generated/` reference correct endpoints:

```typescript
// Should contain paths like:
export const listContacts = () => ({
  method: 'get',
  url: '/crm/contacts', // Base URL handled by custom fetch
  // ...
});
```

### Test Endpoints
```bash
# Start backend server
pnpm --filter @workspace/api-server run dev

# Test endpoints
curl http://localhost:8081/api/v1/health
curl http://localhost:8081/api/v1/crm/contacts
```

## Step 6: Version Management Strategy

### Deprecation Headers
Add deprecation headers for future version transitions:

```typescript
// In v1Router middleware
v1Router.use((req, res, next) => {
  // Add version headers
  res.set('API-Version', '1.0');
  res.set('API-Supported-Versions', '1.0');
  
  // Sunset header for future deprecation
  // res.set('Sunset', '2026-12-31');
  
  next();
});
```

### Environment Configuration
Add versioning configuration to environment:

```typescript
// artifacts/api-server/src/config/versioning.ts
export interface VersioningConfig {
  enabled: boolean;
  defaultVersion: string;
  supportedVersions: string[];
  legacySupport: boolean;
  legacySunsetDate?: string;
}

export const versioningConfig: VersioningConfig = {
  enabled: process.env.API_VERSIONING_ENABLED === 'true',
  defaultVersion: 'v1',
  supportedVersions: ['v1'],
  legacySupport: process.env.API_LEGACY_SUPPORT === 'true',
  legacySunsetDate: process.env.API_LEGACY_SUNSET_DATE,
};
```

## Step 7: Documentation Updates

### Update API Documentation
Update any API documentation to reference the new versioned endpoints:

```markdown
# API Reference

## Base URL
```
https://api.apex-unified-suite.com/api/v1
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check
```
GET /api/v1/health
```

### CRM - Contacts
```
GET /api/v1/crm/contacts
POST /api/v1/crm/contacts
PUT /api/v1/crm/contacts/:id
DELETE /api/v1/crm/contacts/:id
```
```

### Update Developer Guides
Update any developer guides or README files to reference the versioned API structure.

## Step 8: Migration Considerations

### Breaking Changes
When introducing breaking changes in the future:

1. **Create new version**: Add `/api/v2` router
2. **Maintain v1**: Keep v1 endpoints for backward compatibility
3. **Deprecation timeline**: Communicate deprecation timeline
4. **Migration guide**: Provide clear migration instructions

### Version Transition Strategy
```typescript
// Example future v2 setup
export const apiRouter = Router();

apiRouter.use('/v1', v1Router); // Existing version
apiRouter.use('/v2', v2Router); // New version

// Default to latest stable version
apiRouter.use('/', (req, res, next) => {
  // Redirect to latest version or return version selection info
  res.json({
    message: 'Please specify API version',
    versions: ['v1', 'v2'],
    default: 'v2'
  });
});
```

## Step 9: Testing and Validation

### Unit Tests
Test that all routes are properly versioned:

```typescript
// tests/api/versioning.test.ts
import request from 'supertest';
import { app } from '../src/server';

describe('API Versioning', () => {
  test('v1 endpoints respond correctly', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'healthy');
  });

  test('non-versioned endpoints return 404', async () => {
    await request(app)
      .get('/api/health')
      .expect(404);
  });

  test('version headers are present', async () => {
    const response = await request(app)
      .get('/api/v1/health');
    
    expect(response.headers['api-version']).toBe('1.0');
  });
});
```

### Integration Tests
Test frontend-backend integration:

```typescript
// tests/integration/api-client.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListContacts } from '@workspace/api-client-react';

describe('API Client Integration', () => {
  test('uses correct versioned endpoints', async () => {
    const queryClient = new QueryClient();
    
    const { result } = renderHook(() => useListContacts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    // Verify the hook makes requests to /api/v1/crm/contacts
    // This would require mocking fetch to verify the URL
  });
});
```

## Step 10: Monitoring and Observability

### Metrics Collection
Add version-specific metrics:

```typescript
// artifacts/api-server/src/middleware/version-metrics.ts
import { Request, Response, NextFunction } from 'express';

export const versionMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const version = req.path.match(/\/v(\d+)/)?.[1] || 'unknown';
    
    // Log metrics (integrate with your monitoring system)
    console.log({
      method: req.method,
      path: req.path,
      version,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  });
  
  next();
};
```

### Health Check Enhancement
Update health check to include version information:

```typescript
// artifacts/api-server/src/routes/v1/health.ts
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    apiVersion: 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});
```

## Common Issues and Solutions

### CORS Issues
If frontend can't access versioned API, update CORS configuration:

```typescript
// artifacts/api-server/src/middleware/cors.ts
import cors from 'cors';

export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Path Matching Issues
Ensure Express route order is correct - more specific routes first:

```typescript
// Correct order
app.use('/api/v1', v1Router);
app.use('/api', apiRouter); // General API routes
app.use('/', defaultRouter); // Default routes
```

### Generated Code Issues
If generated code doesn't use correct base URL:
1. Verify Orval configuration
2. Check custom fetch implementation
3. Regenerate client code
4. Clear TypeScript cache

## Future Considerations

### Multi-Version Support
Plan for future versions:
- Separate router files for each version
- Shared middleware and utilities
- Clear deprecation strategy
- Migration tools and documentation

### API Gateway Integration
Consider API gateway for advanced versioning:
- Request routing based on version
- Rate limiting per version
- Analytics and monitoring
- Request/response transformation

This skill ensures consistent API versioning across the entire Apex Unified Suite, providing a solid foundation for future API evolution and maintenance.

---

## appointment-booking-service

**Description:** Implement comprehensive appointment scheduling service with availability windows, booking rules validation, conflict detection, timezone normalization, and state machine management for requested → confirmed → cancelled transitions.

# Appointment Booking Service Implementation

## Overview

This skill guides the implementation of a robust appointment booking system that handles complex scheduling logic, including availability calculation, booking rule validation, conflict detection, and proper state management with timezone support.

## Core Components

### 1. Database Schema Design

#### Availability Windows Table
```sql
CREATE TABLE availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  recurrence_rule TEXT, -- RRULE format for recurring availability
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_availability_resource_time ON availability_windows(resource_id, start_time, end_time);
CREATE INDEX idx_availability_tenant ON availability_windows(tenant_id);
```

#### Booking Rules Table
```sql
CREATE TABLE booking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_id UUID REFERENCES resources(id),
  min_advance_hours INTEGER DEFAULT 0, -- Minimum hours in advance required
  max_advance_days INTEGER DEFAULT 365, -- Maximum days in advance allowed
  buffer_minutes INTEGER DEFAULT 0, -- Buffer time between appointments
  max_per_day INTEGER DEFAULT 8, -- Maximum appointments per day
  max_per_week INTEGER DEFAULT 40, -- Maximum appointments per week
  allowed_weekdays INTEGER[], -- Array of allowed weekdays (0=Sunday, 6=Saturday)
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '17:00:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Appointments Table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  resource_id UUID NOT NULL REFERENCES resources(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  booking_rule_violations JSONB, -- Store any rule violations that were overridden
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id)
);

CREATE INDEX idx_appointments_resource_time ON appointments(resource_id, start_time, end_time);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
```

### 2. Service Implementation

#### AppointmentService Core Methods

```typescript
// src/services/AppointmentService.ts
import { Database } from 'drizzle-orm';
import { appointments, availabilityWindows, bookingRules } from '../db/schema';
import { eq, and, gte, lte, between, sql } from 'drizzle-orm';
import { ConflictError, BookingRuleViolationError } from '../domain/errors';

export class AppointmentService {
  constructor(private db: Database) {}

  /**
   * Calculate available slots for a resource within a date range
   */
  async calculateAvailableSlots(
    resourceId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
    timezone: string = 'UTC'
  ): Promise<AvailableSlot[]> {
    // 1. Get availability windows for the period
    const availability = await this.getAvailabilityWindows(
      resourceId,
      startDate,
      endDate,
      tenantId
    );

    // 2. Get existing appointments to find conflicts
    const existingAppointments = await this.getExistingAppointments(
      resourceId,
      startDate,
      endDate,
      tenantId
    );

    // 3. Get booking rules for validation
    const rules = await this.getBookingRules(resourceId, tenantId);

    // 4. Generate slots and filter by conflicts and rules
    return this.generateAndFilterSlots(
      availability,
      existingAppointments,
      rules,
      timezone
    );
  }

  /**
   * Create a new appointment with full validation
   */
  async createAppointment(
    data: CreateAppointmentRequest,
    tenantId: string,
    requestedBy: string
  ): Promise<Appointment> {
    // 1. Validate timezone and normalize to UTC
    const startTime = this.normalizeToUTC(data.startTime, data.timezone);
    const endTime = this.normalizeToUTC(data.endTime, data.timezone);

    // 2. Check booking rules
    const ruleViolations = await this.validateBookingRules(
      data.resourceId,
      startTime,
      endTime,
      tenantId
    );

    if (ruleViolations.length > 0) {
      throw new BookingRuleViolationError('Booking rules violated', ruleViolations);
    }

    // 3. Check for conflicts
    const conflicts = await this.detectConflicts(
      data.resourceId,
      startTime,
      endTime,
      tenantId,
      null // Exclude current appointment (none yet)
    );

    if (conflicts.length > 0) {
      throw new ConflictError('Time slot conflicts with existing appointments', conflicts);
    }

    // 4. Create appointment in 'requested' state
    const appointment = await this.db.insert(appointments).values({
      tenantId,
      clientId: data.clientId,
      resourceId: data.resourceId,
      startTime,
      endTime,
      timezone: data.timezone,
      status: 'requested',
      notes: data.notes,
      createdBy: requestedBy
    }).returning();

    // 5. Emit domain event
    await this.emitEvent('AppointmentRequested', {
      appointmentId: appointment[0].id,
      resourceId: data.resourceId,
      clientId: data.clientId,
      startTime,
      endTime
    });

    return appointment[0];
  }

  /**
   * Confirm an appointment (state transition: requested → confirmed)
   */
  async confirmAppointment(
    appointmentId: string,
    tenantId: string,
    confirmedBy: string
  ): Promise<Appointment> {
    const appointment = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.tenantId, tenantId)
      ))
      .limit(1);

    if (!appointment[0]) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment[0].status !== 'requested') {
      throw new InvalidStateError('Only requested appointments can be confirmed');
    }

    // Double-check for conflicts just before confirmation
    const conflicts = await this.detectConflicts(
      appointment[0].resourceId,
      appointment[0].startTime,
      appointment[0].endTime,
      tenantId,
      appointmentId
    );

    if (conflicts.length > 0) {
      throw new ConflictError('Cannot confirm: time slot now has conflicts', conflicts);
    }

    const updated = await this.db
      .update(appointments)
      .set({
        status: 'confirmed',
        confirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Emit domain event
    await this.emitEvent('AppointmentConfirmed', {
      appointmentId,
      resourceId: appointment[0].resourceId,
      clientId: appointment[0].clientId
    });

    return updated[0];
  }

  /**
   * Cancel an appointment (state transition: requested/confirmed → cancelled)
   */
  async cancelAppointment(
    appointmentId: string,
    tenantId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<Appointment> {
    const appointment = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.tenantId, tenantId)
      ))
      .limit(1);

    if (!appointment[0]) {
      throw new NotFoundError('Appointment not found');
    }

    if (!['requested', 'confirmed'].includes(appointment[0].status)) {
      throw new InvalidStateError('Only requested or confirmed appointments can be cancelled');
    }

    const updated = await this.db
      .update(appointments)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy,
        notes: reason ? `${appointment[0].notes || ''}\n\nCancellation reason: ${reason}`.trim() : appointment[0].notes,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Emit domain event
    await this.emitEvent('AppointmentCancelled', {
      appointmentId,
      previousStatus: appointment[0].status,
      resourceId: appointment[0].resourceId,
      clientId: appointment[0].clientId,
      reason
    });

    return updated[0];
  }

  /**
   * Validate booking rules against proposed appointment time
   */
  private async validateBookingRules(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    tenantId: string
  ): Promise<RuleViolation[]> {
    const rules = await this.getBookingRules(resourceId, tenantId);
    const violations: RuleViolation[] = [];
    const now = new Date();

    // Check minimum advance booking
    if (rules.minAdvanceHours > 0) {
      const minAdvance = new Date(now.getTime() + (rules.minAdvanceHours * 60 * 60 * 1000));
      if (startTime < minAdvance) {
        violations.push({
          rule: 'min_advance_hours',
          message: `Appointment must be booked at least ${rules.minAdvanceHours} hours in advance`,
          required: rules.minAdvanceHours,
          actual: Math.floor((startTime.getTime() - now.getTime()) / (60 * 60 * 1000))
        });
      }
    }

    // Check maximum advance booking
    if (rules.maxAdvanceDays > 0) {
      const maxAdvance = new Date(now.getTime() + (rules.maxAdvanceDays * 24 * 60 * 60 * 1000));
      if (startTime > maxAdvance) {
        violations.push({
          rule: 'max_advance_days',
          message: `Appointment cannot be booked more than ${rules.maxAdvanceDays} days in advance`,
          required: rules.maxAdvanceDays,
          actual: Math.floor((startTime.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        });
      }
    }

    // Check working hours
    const appointmentTime = new Date(startTime);
    const appointmentHour = appointmentTime.getUTCHours();
    if (rules.workingHoursStart && rules.workingHoursEnd) {
      const startHour = parseInt(rules.workingHoursStart.split(':')[0]);
      const endHour = parseInt(rules.workingHoursEnd.split(':')[0]);
      if (appointmentHour < startHour || appointmentHour >= endHour) {
        violations.push({
          rule: 'working_hours',
          message: `Appointment must be within working hours (${rules.workingHoursStart} - ${rules.workingHoursEnd})`,
          required: `${rules.workingHoursStart} - ${rules.workingHoursEnd}`,
          actual: `${appointmentHour}:00`
        });
      }
    }

    // Check allowed weekdays
    if (rules.allowedWeekdays && rules.allowedWeekdays.length > 0) {
      const dayOfWeek = appointmentTime.getUTCDay();
      if (!rules.allowedWeekdays.includes(dayOfWeek)) {
        violations.push({
          rule: 'allowed_weekdays',
          message: `Appointment not allowed on this day of week`,
          required: rules.allowedWeekdays.join(', '),
          actual: dayOfWeek.toString()
        });
      }
    }

    // Check maximum appointments per day
    if (rules.maxPerDay > 0) {
      const dayStart = new Date(startTime);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const dayAppointments = await this.db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.resourceId, resourceId),
          eq(appointments.tenantId, tenantId),
          gte(appointments.startTime, dayStart),
          lt(appointments.startTime, dayEnd),
          sql`status IN ('requested', 'confirmed')`
        ));

      if (dayAppointments.length >= rules.maxPerDay) {
        violations.push({
          rule: 'max_per_day',
          message: `Maximum ${rules.maxPerDay} appointments per day allowed`,
          required: rules.maxPerDay,
          actual: dayAppointments.length + 1
        });
      }
    }

    return violations;
  }

  /**
   * Detect conflicting appointments for the same resource and time
   */
  private async detectConflicts(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    tenantId: string,
    excludeAppointmentId?: string
  ): Promise<Conflict[]> {
    const conflicts = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.resourceId, resourceId),
        eq(appointments.tenantId, tenantId),
        sql`status IN ('requested', 'confirmed')`,
        // Check for overlapping time ranges
        sql`(start_time < ${endTime} AND end_time > ${startTime})`,
        // Exclude current appointment if updating
        excludeAppointmentId ? sql`id != ${excludeAppointmentId}` : sql`1=1`
      ));

    return conflicts.map(apt => ({
      appointmentId: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      clientId: apt.clientId
    }));
  }

  /**
   * Normalize datetime to UTC for storage
   */
  private normalizeToUTC(date: Date, timezone: string): Date {
    // Convert from tenant timezone to UTC
    return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  }

  /**
   * Convert UTC datetime to tenant timezone for display
   */
  private convertFromUTC(date: Date, timezone: string): Date {
    return new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  }
}
```

### 3. API Endpoints

Create corresponding API endpoints in Express:

```typescript
// src/routes/appointments.ts
import { Router } from 'express';
import { AppointmentService } from '../services/AppointmentService';
import { validateRequest } from '../middleware/validation';
import { createAppointmentSchema, updateAppointmentSchema } from '../schemas/appointments';

const router = Router();

// GET /api/appointments/available-slots
router.get('/available-slots', async (req, res, next) => {
  try {
    const { resourceId, startDate, endDate, timezone } = req.query;
    
    const slots = await appointmentService.calculateAvailableSlots(
      resourceId as string,
      new Date(startDate as string),
      new Date(endDate as string),
      req.tenant.id,
      timezone as string
    );

    res.json({ slots });
  } catch (error) {
    next(error);
  }
});

// POST /api/appointments
router.post('/', validateRequest(createAppointmentSchema), async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/confirm
router.patch('/:id/confirm', async (req, res, next) => {
  try {
    const appointment = await appointmentService.confirmAppointment(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.tenant.id,
      req.user.id,
      req.body.reason
    );

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Create database schema with proper indexes
- [ ] Implement AppointmentService with all core methods
- [ ] Add timezone normalization utilities
- [ ] Create booking rule validation logic
- [ ] Implement conflict detection algorithm
- [ ] Add state machine validation for transitions
- [ ] Create API endpoints with proper validation
- [ ] Add domain events for appointment lifecycle
- [ ] Implement integration tests for all scenarios
- [ ] Add error handling for booking violations
- [ ] Create monitoring and logging for appointment operations

## Testing Requirements

### Unit Tests
- Test timezone conversion accuracy
- Test booking rule validation logic
- Test conflict detection algorithm
- Test state machine transitions

### Integration Tests
- Test appointment creation flow end-to-end
- Test concurrent booking scenarios
- Test timezone handling across different regions
- Test booking rule enforcement

### Edge Cases
- Test daylight saving time transitions
- Test recurring availability windows
- Test resource capacity limits
- Test appointment cancellation policies

## Security Considerations

- All time data stored in UTC
- Tenant isolation enforced at database level
- Rate limiting on booking endpoints
- Audit trail for all appointment changes
- Input validation for all datetime fields

## Performance Optimizations

- Database indexes on time-based queries
- Caching for availability calculations
- Efficient conflict detection using time range queries
- Batch processing for recurring availability

## Monitoring

- Track booking success/failure rates
- Monitor conflict detection performance
- Alert on booking rule violations
- Track timezone conversion errors

---

## authentication-implementation

**Description:** Complete JWT-based authentication system with RBAC for Apex Unified Suite using 2026 best practices (refresh tokens, rate limiting, minimal payloads)

# Authentication System Implementation

This skill guides you through implementing a complete JWT-based authentication system with Role-Based Access Control (RBAC) for the Apex Unified Suite.

## Current State Assessment

**Authentication Status**: Zero authentication infrastructure exists.
- No JWT service or token generation
- No login/register endpoints
- No session management
- No RBAC system
- No auth middleware
- Frontend has hardcoded user initials "JS"

## Authentication Architecture

### **System Components**
```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ AuthContext │  │ Custom Fetch    │   │
│  │ useAuth()    │  │ setAuthToken() │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓ JWT Bearer Token
┌─────────────────────────────────────────┐
│           Backend (Express)              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Auth Routes │  │ Auth Middleware │   │
│  │ JWT Service │  │ RBAC Check      │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓ Database Queries
┌─────────────────────────────────────────┐
│           Database (PostgreSQL)          │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ users table │  │ roles table     │   │
│  │ permissions │  │ sessions table  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Backend JWT Service**

**File**: `artifacts/api-server/src/services/auth.ts`
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '@workspace/db';
import { usersTable, rolesTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
    
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: JWTPayload): AuthTokens {
    // 2026 Best Practice: Minimal, non-sensitive JWT payloads
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.jwtRefreshSecret) as { userId: string };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await db
      .select({
        permissions: rolesTable.permissions,
      })
      .from(usersTable)
      .leftJoin(rolesTable, eq(usersTable.role, rolesTable.name))
      .where(eq(usersTable.id, userId))
      .limit(1);

    return user[0]?.permissions || [];
  }

  async authenticateUser(email: string, password: string): Promise<{
    user: typeof usersTable.$inferSelect;
    tokens: AuthTokens;
  }> {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user[0]) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(password, user[0].passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (user[0].status !== 'active') {
      throw new Error('Account is not active');
    }

    const permissions = await this.getUserPermissions(user[0].id);
    const tokens = this.generateTokens({
      userId: user[0].id,
      email: user[0].email,
      role: user[0].role,
      permissions,
    });

    // Update last login
    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user[0].id));

    return {
      user: {
        ...user[0],
        passwordHash: undefined, // Remove sensitive data
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { userId } = this.verifyRefreshToken(refreshToken);

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user[0] || user[0].status !== 'active') {
      throw new Error('User not found or inactive');
    }

    const permissions = await this.getUserPermissions(user[0].id);
    return this.generateTokens({
      userId: user[0].id,
      email: user[0].email,
      role: user[0].role,
      permissions,
    });
  }
}

export const authService = new AuthService();
```

### **Step 2: Authentication Middleware**

**File**: `artifacts/api-server/src/middlewares/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { authService, JWTPayload } from '../services/auth';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const user = authService.verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
      });
    }

    next();
  };
};

export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Insufficient role',
        required: role,
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = authService.verifyAccessToken(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
```

### **Step 3: Authentication Routes**

**File**: `artifacts/api-server/src/routes/auth.ts`
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { createUserSchema, insertUserSchema } from '@workspace/api-zod';

const router = Router();

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = createUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { confirmPassword, ...userData } = validatedData;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userData.email))
      .limit(1);

    if (existingUser[0]) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const passwordHash = await authService.hashPassword(userData.password);
    
    const newUser = await db
      .insert(usersTable)
      .values({
        ...userData,
        passwordHash,
      })
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        status: usersTable.status,
        createdAt: usersTable.createdAt,
      });

    // Generate tokens
    const permissions = await authService.getUserPermissions(newUser[0].id);
    const tokens = authService.generateTokens({
      userId: newUser[0].id,
      email: newUser[0].email,
      role: newUser[0].role,
      permissions,
    });

    res.status(201).json({
      user: newUser[0],
      tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const result = await authService.authenticateUser(
      validatedData.email,
      validatedData.password
    );

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    
    const tokens = await authService.refreshToken(validatedData.refreshToken);
    
    res.json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        status: usersTable.status,
        emailVerified: usersTable.emailVerified,
        lastLoginAt: usersTable.lastLoginAt,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    if (!user[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user[0],
      permissions: req.user!.permissions,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // In a real implementation, you might want to invalidate the refresh token
  // For now, we'll just return success (client-side should delete tokens)
  res.json({ message: 'Logged out successfully' });
});

export default router;
```

### **Step 4: Frontend Authentication Context**

**File**: `artifacts/apex-os/src/contexts/AuthContext.tsx`
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { z } from 'zod';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Token management
  const setAuthToken = (tokens: AuthTokens | null) => {
    if (tokens) {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const getStoredTokens = (): AuthTokens | null => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    
    return null;
  };

  // API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const tokens = getStoredTokens();
    const response = await fetch(`/api/auth${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(tokens?.accessToken && {
          Authorization: `Bearer ${tokens.accessToken}`,
        }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  };

  // Auth methods
  const login = async (email: string, password: string) => {
    try {
      const validatedData = loginSchema.parse({ email, password });
      const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(validatedData),
      });

      setAuthState({
        user: result.user,
        tokens: result.tokens,
        isLoading: false,
        isAuthenticated: true,
      });

      setAuthToken(result.tokens);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const validatedData = registerSchema.parse(userData);
      const { confirmPassword, ...registerData } = validatedData;
      
      const result = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      setAuthState({
        user: result.user,
        tokens: result.tokens,
        isLoading: false,
        isAuthenticated: true,
      });

      setAuthToken(result.tokens);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
    });

    setAuthToken(null);
  };

  const refreshTokens = async () => {
    try {
      const tokens = getStoredTokens();
      if (!tokens) {
        throw new Error('No refresh token available');
      }

      const newTokens = await apiCall('/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      setAuthState(prev => ({
        ...prev,
        tokens: newTokens,
      }));

      setAuthToken(newTokens);
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // Clear invalid tokens
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = getStoredTokens();
        if (tokens) {
          try {
            const result = await apiCall('/me');
            setAuthState({
              user: result.user,
              tokens,
              isLoading: false,
              isAuthenticated: true,
            });
          } catch (error) {
            // Token might be expired, try to refresh
            await refreshTokens();
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!authState.tokens) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshTokens();
      } catch (error) {
        console.error('Auto refresh error:', error);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [authState.tokens]);

  const value: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    refreshTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### **Step 5: Custom Fetch Integration**

**Update**: `lib/api-client-react/src/custom-fetch.ts`
```typescript
// Add token getter integration
let authTokenGetter: (() => string | null) | null = null;

export const setAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = getter;
};

export const customFetch = async (url: string, options: RequestInit = {}) => {
  const token = authTokenGetter?.();
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response;
};
```

### **Step 6: Update App.tsx**

**Update**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { setAuthTokenGetter } from '@workspace/api-client-react';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter>
            <Toaster />
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### **Step 7: Login/Register Components**

**File**: `artifacts/apex-os/src/components/auth/LoginForm.tsx`
```typescript
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### **Step 8: Route Protection**

**File**: `artifacts/apex-os/src/components/auth/ProtectedRoute.tsx`
```typescript
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login or show login modal
    return <LoginForm />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have the required role to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

## Environment Configuration

**File**: `.env.example`
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/apex_unified_suite

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com

# Email (for password reset, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Integration Steps

### **1. Backend Setup**
```bash
# Install required dependencies
pnpm --filter @workspace/api-server add jsonwebtoken bcrypt
pnpm --filter @workspace/api-server add -D @types/jsonwebtoken @types/bcrypt

# Update route registration
# Add to artifacts/api-server/src/routes/index.ts:
import authRouter from './auth';
router.use('/auth', authRouter);
```

### **2. Frontend Setup**
```bash
# Install required dependencies
pnpm --filter @workspace/apex-os add react-hook-form @hookform/resolvers zod

# Update app to use AuthProvider
# (see App.tsx changes above)
```

### **3. Database Setup**
```bash
# Ensure user and roles tables exist
pnpm --filter @workspace/db run push

# Seed default roles
# (create a seed script for admin, user, viewer roles)
```

## Testing Authentication

### **Backend Tests**
```typescript
// tests/api/auth.test.ts
import request from 'supertest';
import { app } from '../src/app';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';

describe('Authentication', () => {
  beforeEach(async () => {
    await db.delete(usersTable);
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
      .expect(201);

    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.tokens.accessToken).toBeDefined();
  });

  it('should login with valid credentials', async () => {
    // First register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    // Then login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.tokens.accessToken).toBeDefined();
  });
});
```

### **Frontend Tests**
```typescript
// tests/components/auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthProvider } from '@/contexts/AuthContext';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

## Security Best Practices

### **JWT Security**
1. **Use strong secrets** - Generate with `openssl rand -base64 32`
2. **Short access token expiry** - 15 minutes recommended
3. **Longer refresh token expiry** - 7 days recommended
4. **Store tokens securely** - Use httpOnly cookies in production
5. **Implement token blacklisting** - For logout functionality

### **Password Security**
1. **Use bcrypt** - Minimum 12 rounds
2. **Enforce strong passwords** - Minimum 8 characters, mixed case
3. **Implement rate limiting** - Prevent brute force attacks
4. **Use HTTPS** - Never transmit credentials over HTTP

### **API Security**
1. **Validate all inputs** - Use Zod schemas
2. **Sanitize error messages** - Don't leak sensitive information
3. **Implement CORS** - Restrict to allowed origins
4. **Add rate limiting** - Prevent abuse
5. **Log authentication events** - For security monitoring

This comprehensive authentication system provides secure JWT-based authentication with role-based access control, proper frontend integration, and follows security best practices for the Apex Unified Suite.

---

## background-job-runner

**Description:** Implement scheduled job management system with health checks for expired magic-link cleanup, overdue invoice marking, sent email retries, and other periodic tasks.

# Background Job Runner Implementation

## Overview

This skill guides the implementation of a robust background job scheduler that handles periodic maintenance tasks like cleanup operations, status updates, and retry logic with comprehensive health monitoring and error handling.

## Core Architecture

### 1. Database Schema for Job Management

#### Scheduled Jobs Table
```sql
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  job_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL, -- 'cleanup', 'notification', 'status_update', 'retry'
  schedule_expression VARCHAR(100) NOT NULL, -- Cron expression
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  timeout_seconds INTEGER DEFAULT 300,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_scheduled_jobs_name ON scheduled_jobs(job_name);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at, is_active);
CREATE INDEX idx_scheduled_jobs_tenant ON scheduled_jobs(tenant_id);
```

#### Job Executions Table
```sql
CREATE TABLE job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  execution_id VARCHAR(100) NOT NULL UNIQUE, -- UUID for tracking
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_executions_job ON job_executions(job_id);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_started ON job_executions(started_at);
```

### 2. Job Runner Service

```typescript
// src/services/BackgroundJobRunner.ts
import { Database } from 'drizzle-orm';
import { scheduledJobs, jobExecutions } from '../db/schema';
import { eq, and, lte, sql, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { JobExecutionError, JobTimeoutError } from '../domain/errors';

export interface JobDefinition {
  name: string;
  type: 'cleanup' | 'notification' | 'status_update' | 'retry';
  schedule: string; // Cron expression
  handler: (context: JobContext) => Promise<JobResult>;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  metadata?: Record<string, any>;
}

export interface JobContext {
  tenantId?: string;
  executionId: string;
  jobName: string;
  runCount: number;
  metadata?: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  message?: string;
  data?: any;
  nextRunDelay?: number; // For retry logic
}

export class BackgroundJobRunner {
  private jobs = new Map<string, JobDefinition>();
  private isRunning = false;
  private cronJobs = new Map<string, NodeJS.Timeout>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private db: Database,
    private logger: Logger
  ) {}

  /**
   * Register a new job
   */
  async registerJob(job: JobDefinition, tenantId?: string): Promise<void> {
    // Store in memory
    const key = tenantId ? `${tenantId}:${job.name}` : job.name;
    this.jobs.set(key, job);

    // Persist to database
    const existingJob = await this.db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.job_name, job.name))
      .limit(1);

    if (existingJob.length === 0) {
      await this.db.insert(scheduledJobs).values({
        tenantId: tenantId || null,
        jobName: job.name,
        jobType: job.type,
        scheduleExpression: job.schedule,
        timeoutSeconds: job.timeout || 300,
        maxRetries: job.maxRetries || 3,
        retryDelaySeconds: job.retryDelay || 60,
        metadata: job.metadata || {},
        nextRunAt: this.getNextRunTime(job.schedule)
      });
    }

    this.logger.info(`Job registered: ${job.name}`);
  }

  /**
   * Start the job runner
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Job runner is already running');
      return;
    }

    this.isRunning = true;

    // Load existing jobs from database
    await this.loadJobsFromDatabase();

    // Schedule all active jobs
    await this.scheduleAllJobs();

    // Start health check monitoring
    this.startHealthChecks();

    this.logger.info('Background job runner started');
  }

  /**
   * Stop the job runner
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear all cron jobs
    for (const [jobName, timeout] of this.cronJobs) {
      clearTimeout(timeout);
    }
    this.cronJobs.clear();

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.logger.info('Background job runner stopped');
  }

  /**
   * Execute a job manually
   */
  async executeJob(
    jobName: string,
    tenantId?: string,
    context?: Partial<JobContext>
  ): Promise<JobResult> {
    const key = tenantId ? `${tenantId}:${jobName}` : jobName;
    const job = this.jobs.get(key);

    if (!job) {
      throw new JobExecutionError(`Job not found: ${jobName}`);
    }

    const executionId = randomUUID();
    const jobContext: JobContext = {
      tenantId,
      executionId,
      jobName,
      runCount: 0,
      metadata: context?.metadata
    };

    return await this.executeJobWithTracking(job, jobContext);
  }

  /**
   * Get job execution history
   */
  async getJobHistory(
    jobName: string,
    tenantId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobExecutionRecord[]> {
    const query = this.db
      .select({
        id: jobExecutions.id,
        executionId: jobExecutions.execution_id,
        status: jobExecutions.status,
        startedAt: jobExecutions.started_at,
        completedAt: jobExecutions.completed_at,
        durationMs: jobExecutions.duration_ms,
        errorMessage: jobExecutions.error_message,
        retryCount: jobExecutions.retry_count
      })
      .from(jobExecutions)
      .innerJoin(scheduledJobs, eq(jobExecutions.job_id, scheduledJobs.id))
      .where(eq(scheduledJobs.job_name, jobName))
      .orderBy(desc(jobExecutions.started_at))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Get job health status
   */
  async getJobHealth(): Promise<JobHealthStatus[]> {
    const jobs = await this.db
      .select({
        jobName: scheduledJobs.job_name,
        jobType: scheduledJobs.job_type,
        isActive: scheduledJobs.is_active,
        lastRunAt: scheduledJobs.last_run_at,
        nextRunAt: scheduled_jobs.next_run_at,
        runCount: scheduledJobs.run_count,
        successCount: scheduledJobs.success_count,
        failureCount: scheduledJobs.failure_count,
        lastError: scheduledJobs.last_error,
        lastErrorAt: scheduledJobs.last_error_at
      })
      .from(scheduledJobs)
      .orderBy(scheduledJobs.job_name);

    return jobs.map(job => ({
      jobName: job.jobName,
      jobType: job.jobType,
      isActive: job.isActive,
      lastRunAt: job.lastRunAt,
      nextRunAt: job.nextRunAt,
      runCount: job.runCount,
      successCount: job.successCount,
      failureCount: job.failureCount,
      successRate: job.runCount > 0 ? (job.success_count / job.runCount) * 100 : 0,
      lastError: job.lastError,
      lastErrorAt: job.lastErrorAt,
      isHealthy: this.isJobHealthy(job)
    }));
  }

  /**
   * Execute job with tracking and error handling
   */
  private async executeJobWithTracking(
    job: JobDefinition,
    context: JobContext
  ): Promise<JobResult> {
    const startTime = Date.now();
    let executionRecord: any;

    try {
      // Create execution record
      executionRecord = await this.db.insert(jobExecutions).values({
        jobId: await this.getJobId(job.name),
        executionId: context.executionId,
        status: 'running',
        startedAt: new Date()
      }).returning();

      // Execute job with timeout
      const result = await this.executeWithTimeout(
        () => job.handler(context),
        job.timeout || 300000 // 5 minutes default
      );

      const duration = Date.now() - startTime;

      // Update execution record
      await this.db.update(jobExecutions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          durationMs: duration,
          result: result.data || null
        })
        .where(eq(jobExecutions.id, executionRecord[0].id));

      // Update job statistics
      await this.updateJobStats(job.name, true, null);

      this.logger.info(`Job completed successfully: ${job.name}`, {
        executionId: context.executionId,
        duration
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Update execution record
      if (executionRecord) {
        await this.db.update(jobExecutions)
          .set({
            status: error instanceof JobTimeoutError ? 'timeout' : 'failed',
            completedAt: new Date(),
            durationMs: duration,
            errorMessage,
            errorStack
          })
          .where(eq(jobExecutions.id, executionRecord[0].id));
      }

      // Update job statistics
      await this.updateJobStats(job.name, false, errorMessage);

      this.logger.error(`Job failed: ${job.name}`, {
        executionId: context.executionId,
        error: errorMessage,
        duration
      });

      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new JobTimeoutError(`Job timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Load jobs from database
   */
  private async loadJobsFromDatabase(): Promise<void> {
    const jobs = await this.db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.is_active, true));

    for (const jobRecord of jobs) {
      // Jobs should be registered via registerJob() method
      // This just ensures they're tracked in memory
      const key = jobRecord.tenant_id ? `${jobRecord.tenant_id}:${jobRecord.job_name}` : jobRecord.job_name;
      if (!this.jobs.has(key)) {
        this.logger.warn(`Job found in database but not registered: ${jobRecord.job_name}`);
      }
    }
  }

  /**
   * Schedule all active jobs
   */
  private async scheduleAllJobs(): Promise<void> {
    const jobs = await this.db
      .select()
      .from(scheduledJobs)
      .where(and(
        eq(scheduledJobs.is_active, true),
        sql`${scheduledJobs.next_run_at} <= now()`
      ));

    for (const jobRecord of jobs) {
      this.scheduleJob(jobRecord);
    }
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(jobRecord: any): void {
    const key = jobRecord.tenant_id ? `${jobRecord.tenant_id}:${jobRecord.job_name}` : jobRecord.job_name;
    const job = this.jobs.get(key);

    if (!job) {
      this.logger.warn(`Cannot schedule unregistered job: ${jobRecord.job_name}`);
      return;
    }

    const delay = jobRecord.next_run_at.getTime() - Date.now();
    
    if (delay <= 0) {
      // Job should run now
      this.runJob(jobRecord);
    } else {
      // Schedule for future execution
      const timeout = setTimeout(() => {
        this.runJob(jobRecord);
      }, delay);

      this.cronJobs.set(key, timeout);
    }
  }

  /**
   * Run a job and reschedule it
   */
  private async runJob(jobRecord: any): Promise<void> {
    const key = jobRecord.tenant_id ? `${jobRecord.tenant_id}:${jobRecord.job_name}` : jobRecord.job_name;
    
    try {
      const job = this.jobs.get(key);
      if (!job) {
        this.logger.error(`Job not found for execution: ${jobRecord.job_name}`);
        return;
      }

      const context: JobContext = {
        tenantId: jobRecord.tenant_id || undefined,
        executionId: randomUUID(),
        jobName: jobRecord.job_name,
        runCount: jobRecord.run_count + 1,
        metadata: jobRecord.metadata
      };

      await this.executeJobWithTracking(job, context);

      // Update next run time
      const nextRunTime = this.getNextRunTime(jobRecord.schedule_expression);
      await this.db.update(scheduledJobs)
        .set({
          lastRunAt: new Date(),
          nextRunAt: nextRunTime,
          runCount: sql`${scheduledJobs.run_count} + 1`
        })
        .where(eq(scheduledJobs.id, jobRecord.id));

      // Reschedule next run
      this.scheduleJob({ ...jobRecord, next_run_at: nextRunTime });

    } catch (error) {
      this.logger.error(`Job execution failed: ${jobRecord.job_name}`, { error });

      // Handle retry logic
      const retryCount = jobRecord.failure_count + 1;
      if (retryCount <= (jobRecord.max_retries || 3)) {
        const retryDelay = (jobRecord.retry_delay_seconds || 60) * 1000;
        const nextRunTime = new Date(Date.now() + retryDelay);

        await this.db.update(scheduledJobs)
          .set({
            failureCount: retryCount,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastErrorAt: new Date(),
            nextRunAt: nextRunTime
          })
          .where(eq(scheduledJobs.id, jobRecord.id));

        // Schedule retry
        this.scheduleJob({ ...jobRecord, next_run_at: nextRunTime });
      } else {
        // Max retries exceeded, disable job
        await this.db.update(scheduledJobs)
          .set({
            isActive: false,
            failureCount: retryCount,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastErrorAt: new Date()
          })
          .where(eq(scheduledJobs.id, jobRecord.id));

        this.logger.error(`Job disabled after max retries: ${jobRecord.job_name}`);
      }
    }
  }

  /**
   * Update job statistics
   */
  private async updateJobStats(
    jobName: string,
    success: boolean,
    error: string | null
  ): Promise<void> {
    const updates = {
      runCount: sql`${scheduledJobs.run_count} + 1`,
      lastRunAt: new Date()
    };

    if (success) {
      Object.assign(updates, {
        successCount: sql`${scheduledJobs.success_count} + 1`,
        lastError: null,
        lastErrorAt: null
      });
    } else {
      Object.assign(updates, {
        failureCount: sql`${scheduledJobs.failure_count} + 1`,
        lastError: error,
        lastErrorAt: new Date()
      });
    }

    await this.db.update(scheduledJobs)
      .set(updates)
      .where(eq(scheduledJobs.job_name, jobName));
  }

  /**
   * Get job ID from database
   */
  private async getJobId(jobName: string): Promise<string> {
    const job = await this.db
      .select({ id: scheduledJobs.id })
      .from(scheduledJobs)
      .where(eq(scheduledJobs.job_name, jobName))
      .limit(1);

    if (!job[0]) {
      throw new JobExecutionError(`Job not found in database: ${jobName}`);
    }

    return job[0].id;
  }

  /**
   * Calculate next run time from cron expression
   */
  private getNextRunTime(cronExpression: string): Date {
    // Implementation depends on cron parser library
    // For now, simple implementation - in production use node-cron or similar
    const now = new Date();
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now as placeholder
    return nextRun;
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getJobHealth();
      
      for (const job of health) {
        if (!job.isHealthy) {
          this.logger.warn(`Job health issue detected: ${job.jobName}`, {
            lastError: job.lastError,
            failureCount: job.failureCount
          });

          // Emit health alert event
          await this.emitEvent('JobHealthAlert', {
            jobName: job.jobName,
            issue: 'unhealthy',
            details: job
          });
        }
      }
    } catch (error) {
      this.logger.error('Health check failed', { error });
    }
  }

  /**
   * Determine if job is healthy
   */
  private isJobHealthy(job: any): boolean {
    // Job is unhealthy if:
    // 1. Has recent failures
    // 2. Success rate is below threshold
    // 3. Last run was too long ago (if it should run frequently)
    
    const successRate = job.runCount > 0 ? (job.successCount / job.runCount) : 1;
    const hasRecentFailure = job.lastErrorAt && 
      (Date.now() - job.lastErrorAt.getTime()) < (24 * 60 * 60 * 1000); // Last 24 hours

    return successRate >= 0.8 && !hasRecentFailure;
  }

  /**
   * Emit domain events
   */
  private async emitEvent(eventName: string, data: any): Promise<void> {
    // Implementation depends on your event system
    console.log(`Emitting event: ${eventName}`, data);
  }
}
```

### 3. Built-in Job Handlers

```typescript
// src/jobs/BuiltInJobs.ts
import { JobContext, JobResult } from '../services/BackgroundJobRunner';
import { Database } from 'drizzle-orm';
import { eq, and, lt, sql } from 'drizzle-orm';

export class BuiltInJobs {
  constructor(private db: Database) {}

  /**
   * Clean up expired magic links
   */
  async cleanupExpiredMagicLinks(context: JobContext): Promise<JobResult> {
    const deletedCount = await this.db
      .delete(magicLinks)
      .where(and(
        eq(magicLinks.tenant_id, context.tenantId || ''),
        lt(magicLinks.expires_at, new Date())
      ));

    return {
      success: true,
      message: `Cleaned up ${deletedCount} expired magic links`,
      data: { deletedCount }
    };
  }

  /**
   * Mark overdue invoices
   */
  async markOverdueInvoices(context: JobContext): Promise<JobResult> {
    const updated = await this.db
      .update(invoices)
      .set({
        status: 'overdue',
        updated_at: new Date()
      })
      .where(and(
        eq(invoices.tenant_id, context.tenantId || ''),
        eq(invoices.status, 'sent'),
        lt(invoices.due_date, new Date())
      ));

    return {
      success: true,
      message: `Marked ${updated} invoices as overdue`,
      data: { updatedCount: updated }
    };
  }

  /**
   * Retry failed email deliveries
   */
  async retryFailedEmails(context: JobContext): Promise<JobResult> {
    const failedEmails = await this.db
      .select()
      .from(emailQueue)
      .where(and(
        eq(emailQueue.tenant_id, context.tenantId || ''),
        eq(emailQueue.status, 'failed'),
        sql`${emailQueue.retry_count} < 3`,
        sql`${emailQueue.last_attempt_at} < now() - interval '1 hour'`
      ));

    let retriedCount = 0;
    for (const email of failedEmails) {
      // Retry email sending logic here
      await this.db.update(emailQueue)
        .set({
          status: 'pending',
          retryCount: email.retry_count + 1,
          lastAttemptAt: new Date()
        })
        .where(eq(emailQueue.id, email.id));
      
      retriedCount++;
    }

    return {
      success: true,
      message: `Retried ${retriedCount} failed emails`,
      data: { retriedCount }
    };
  }

  /**
   * Clean up old job execution logs
   */
  async cleanupJobExecutionLogs(context: JobContext): Promise<JobResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days

    const deletedCount = await this.db
      .delete(jobExecutions)
      .where(and(
        lt(jobExecutions.started_at, cutoffDate),
        eq(jobExecutions.status, 'completed')
      ));

    return {
      success: true,
      message: `Cleaned up ${deletedCount} old job execution logs`,
      data: { deletedCount }
    };
  }

  /**
   * Update tenant statistics
   */
  async updateTenantStatistics(context: JobContext): Promise<JobResult> {
    // Update various tenant statistics
    const tenantStats = await this.db
      .select({
        userCount: sql<number>`COUNT(*)`,
        activeUserCount: sql<number>`COUNT(CASE WHEN is_active = true THEN 1 END)`
      })
      .from(users)
      .where(eq(users.tenant_id, context.tenantId || ''));

    // Store in tenant_stats table or cache
    await this.db.insert(tenantStatistics).values({
      tenantId: context.tenantId,
      userCount: tenantStats[0].userCount,
      activeUserCount: tenantStats[0].activeUserCount,
      calculatedAt: new Date()
    }).onConflictDoUpdate({
      target: tenantStatistics.tenantId,
      set: {
        userCount: tenantStats[0].userCount,
        activeUserCount: tenantStats[0].activeUserCount,
        calculatedAt: new Date()
      }
    });

    return {
      success: true,
      message: 'Updated tenant statistics',
      data: tenantStats[0]
    };
  }
}
```

### 4. Job Registration and Startup

```typescript
// src/app/jobInitializer.ts
import { BackgroundJobRunner } from '../services/BackgroundJobRunner';
import { BuiltInJobs } from '../jobs/BuiltInJobs';

export async function initializeJobs(db: Database, logger: Logger): Promise<BackgroundJobRunner> {
  const jobRunner = new BackgroundJobRunner(db, logger);
  const builtInJobs = new BuiltInJobs(db);

  // Register built-in jobs
  await jobRunner.registerJob({
    name: 'cleanup-expired-magic-links',
    type: 'cleanup',
    schedule: '0 */6 * * *', // Every 6 hours
    handler: (context) => builtInJobs.cleanupExpiredMagicLinks(context),
    timeout: 300000, // 5 minutes
    maxRetries: 3
  });

  await jobRunner.registerJob({
    name: 'mark-overdue-invoices',
    type: 'status_update',
    schedule: '0 0 * * *', // Daily at midnight
    handler: (context) => builtInJobs.markOverdueInvoices(context),
    timeout: 600000, // 10 minutes
    maxRetries: 3
  });

  await jobRunner.registerJob({
    name: 'retry-failed-emails',
    type: 'retry',
    schedule: '0 */30 * * * *', // Every 30 minutes
    handler: (context) => builtInJobs.retryFailedEmails(context),
    timeout: 300000, // 5 minutes
    maxRetries: 2
  });

  await jobRunner.registerJob({
    name: 'cleanup-job-logs',
    type: 'cleanup',
    schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM
    handler: (context) => builtInJobs.cleanupJobExecutionLogs(context),
    timeout: 600000, // 10 minutes
    maxRetries: 1
  });

  await jobRunner.registerJob({
    name: 'update-tenant-statistics',
    type: 'status_update',
    schedule: '0 */15 * * * *', // Every 15 minutes
    handler: (context) => builtInJobs.updateTenantStatistics(context),
    timeout: 300000, // 5 minutes
    maxRetries: 3
  });

  // Start the job runner
  await jobRunner.start();

  return jobRunner;
}
```

## Implementation Checklist

- [ ] Create job management database schema
- [ ] Implement BackgroundJobRunner with scheduling logic
- [ ] Add comprehensive error handling and retry logic
- [ ] Create built-in job handlers for common tasks
- [ ] Implement health check monitoring
- [ ] Add job execution tracking and logging
- [ ] Create job registration and initialization system
- [ ] Add API endpoints for job management
- [ ] Implement graceful shutdown handling
- [ ] Add comprehensive test coverage
- [ ] Create monitoring and alerting system
- [ ] Add job performance metrics

## Testing Requirements

### Unit Tests
- Test job scheduling and execution
- Test timeout and retry logic
- Test error handling and recovery
- Test health check functionality

### Integration Tests
- Test end-to-end job execution
- Test database transaction handling
- Test concurrent job execution
- Test job persistence and recovery

### Performance Tests
- Test job execution under load
- Test memory usage with many jobs
- Test database performance impact
- Test timeout handling

## Security Considerations

- Job execution context isolation
- Proper authorization for job management
- Audit trail for job modifications
- Secure handling of sensitive job data
- Tenant isolation for job execution

## Performance Optimizations

- Efficient cron expression parsing
- Database connection pooling for jobs
- Memory-efficient job tracking
- Optimized job execution logging
- Proper cleanup of completed jobs

## Monitoring

- Track job execution success rates
- Monitor job performance and duration
- Alert on job failures and timeouts
- Track resource usage by jobs
- Monitor job queue backlog

---

## bdd-feature-development

**Description:** Write and manage Gherkin feature files for Behavior-Driven Development (BDD) using ubiquitous language from the domain glossary

# BDD Feature Development

This skill guides you through writing Gherkin feature files for Behavior-Driven Development that align with domain-driven design principles and serve as executable specifications.

## Current State Assessment

**BDD Status**: Zero feature files exist - behavior is completely unspecified.

**Missing Infrastructure**:
- No `.feature` files for any bounded context
- No Gherkin scenarios documenting user workflows
- No executable specifications linking to test automation
- No connection between domain glossary and behavior specs

## Gherkin Best Practices (2026)

### **Describe Behavior, Not Implementation**

**Good** - Declarative style describing what:
```gherkin
When "Bob" logs in with valid credentials
Then Bob should see the dashboard
```

**Bad** - Procedural style describing how:
```gherkin
Given I visit "/login"
When I enter "Bob" in the "username" field
And I enter "password" in the "password" field
And I click the "login" button
Then I should see the "dashboard" page
```

### **Use Ubiquitous Language**
- Every term in feature files MUST exist in `docs/glossary.md`
- Use domain language, not technical jargon
- Example: "Lead", "Deal", "Invoice" - not "Record", "Entity", "Row"

### **Scenario Structure**
- **Given** - Context/setup (preconditions)
- **When** - Action/event (the behavior being tested)
- **Then** - Expected outcome (verification)

### **Positive and Negative Paths**
Every feature must include both success scenarios and error/edge cases.

## Step-by-Step Implementation

### **Step 1: Create Feature File Structure**

Create the directory structure:
```
docs/features/
├── auth.feature
├── crm.feature
├── projects.feature
├── finance.feature
├── documents.feature
├── assets.feature
├── portal.feature
├── analytics.feature
├── settings.feature
└── appointments.feature
```

### **Step 2: Write Identity & Access Feature**

**File**: `docs/features/auth.feature`

```gherkin
Feature: Identity and Access Management
  As a user
  I want to securely authenticate and manage my account
  So that I can access the system and protect my data

  Background:
    Given an organization "Acme Corp" exists
    And the organization has a user "john@acme.com" with password "SecurePass123!"

  Scenario: Successful registration with valid organization
    Given a new user wants to join "Acme Corp"
    When they register with email "jane@acme.com" and password "SecurePass123!"
    Then the user account should be created
    And the user should receive a confirmation email
    And the user should be linked to "Acme Corp"

  Scenario: Registration rejected for duplicate email
    Given a user "john@acme.com" already exists in "Acme Corp"
    When someone tries to register with email "john@acme.com"
    Then the registration should fail with error "DuplicateEmail"
    And no new user should be created

  Scenario: Successful login with valid credentials
    Given the user "john@acme.com" exists with password "SecurePass123!"
    When they login with email "john@acme.com" and password "SecurePass123!"
    Then they should receive an access token and refresh token
    And the tokens should contain their user ID and role

  Scenario: Login rejected with invalid credentials
    Given the user "john@acme.com" exists
    When they login with email "john@acme.com" and password "WrongPassword"
    Then the login should fail with error "InvalidCredentials"
    And no tokens should be issued

  Scenario: Access denied for expired token
    Given a user with an expired access token
    When they attempt to access a protected resource
    Then the request should be rejected with error "TokenExpired"
    And they should be prompted to refresh their token

  Scenario: Token refresh with valid refresh token
    Given a user has a valid refresh token
    When they request a token refresh
    Then they should receive a new access token
    And the refresh token should be rotated

  Scenario: Logout invalidates refresh token
    Given a logged-in user with a valid refresh token
    When they logout
    Then the refresh token should be invalidated
    And subsequent refresh attempts should fail

  Scenario: Weak password rejected during registration
    Given a new user wants to register
    When they try to register with password "123"
    Then the registration should fail with error "WeakPassword"
    And the error should specify minimum password requirements
```

### **Step 3: Write CRM Feature**

**File**: `docs/features/crm.feature`

```gherkin
Feature: Customer Relationship Management
  As a sales user
  I want to manage leads, contacts, and deals
  So that I can track and close sales opportunities

  Background:
    Given the user "sales@acme.com" is authenticated with role "sales"
    And the user belongs to organization "Acme Corp"

  Scenario: Process lead through pipeline stages
    Given a lead "Enterprise Software Opportunity" exists in stage "new"
    When the user moves the lead to stage "qualified"
    And the user moves the lead to stage "proposal"
    And the user moves the lead to stage "negotiation"
    And the user marks the lead as "closed_won"
    Then the lead stage should be "closed_won"
    And a deal should be created from the lead
    And the lead history should record all stage transitions

  Scenario: Invalid stage transition rejected
    Given a lead exists in stage "new"
    When the user attempts to move the lead directly to "closed_won"
    Then the transition should fail with error "InvalidStageTransition"
    And the lead should remain in stage "new"

  Scenario: Duplicate lead detection
    Given a lead with email "prospect@company.com" already exists
    When the user creates a new lead with email "prospect@company.com"
    Then the creation should fail with error "DuplicateLead"
    And the user should be offered to merge with existing lead

  Scenario: Lead not found error
    Given a lead with ID "non-existent-id" does not exist
    When the user attempts to retrieve the lead
    Then the request should fail with error "LeadNotFound"

  Scenario: Activity logging on lead interaction
    Given a lead "Hot Prospect" exists
    When the user adds a note "Called prospect, interested in demo"
    And the user schedules a follow-up for tomorrow
    Then the lead activity log should contain 2 entries
    And the entries should be timestamped
    And the entries should show the user "sales@acme.com" as actor

  Scenario: Unauthorized access to another organization's lead
    Given a lead exists in organization "Other Corp"
    When "sales@acme.com" from "Acme Corp" attempts to access it
    Then the request should fail with error "LeadNotFound"
    And the access attempt should be logged in audit trail
```

### **Step 4: Write Finance Feature**

**File**: `docs/features/finance.feature`

```gherkin
Feature: Financial Operations
  As a finance user
  I want to manage invoices and payments
  So that I can track revenue and customer payments

  Background:
    Given the user "finance@acme.com" is authenticated with role "finance"
    And a customer "Beta Inc" exists with open invoices

  Scenario: Create invoice for customer
    Given customer "Beta Inc" has no outstanding invoices
    When the user creates an invoice for $10,000 with due date in 30 days
    Then the invoice should be in status "draft"
    And the invoice should have a unique invoice number
    And the customer should receive an invoice notification

  Scenario: Pay invoice with idempotency
    Given an invoice "INV-001" exists with balance $5,000
    When the user records a payment of $5,000 with idempotency key "pay-123"
    And the user attempts the same payment with idempotency key "pay-123"
    Then only one payment should be recorded
    And the invoice balance should be $0
    And the invoice status should be "paid"

  Scenario: Overpayment rejected
    Given an invoice "INV-002" exists with balance $3,000
    When the user attempts to record a payment of $5,000
    Then the payment should fail with error "PaymentExceedsBalance"
    And the invoice balance should remain $3,000

  Scenario: Budget threshold alert
    Given a project "Website Redesign" has budget $50,000
    And current spending is $45,000
    When a new expense of $8,000 is recorded
    Then the system should trigger a "BudgetThresholdReached" alert
    And the project status should change to "at_risk"
```

### **Step 5: Write Document Management Feature**

**File**: `docs/features/documents.feature`

```gherkin
Feature: Document Management and E-Sign
  As a user
  I want to manage documents and request e-signatures
  So that I can execute contracts digitally

  Background:
    Given the user "legal@acme.com" is authenticated
    And a document "Contract.pdf" exists in the system

  Scenario: Send document for e-signature
    Given a document "Contract.pdf" is ready for signature
    And signers are defined:
      | name       | email                  | order |
      | John Doe   | john@client.com        | 1     |
      | Jane Smith | jane@client.com        | 2     |
    When the user sends the document for e-signature via SignWell
    Then a signature request should be created in SignWell
    And the document status should be "awaiting_signatures"
    And John Doe should receive a signature request email

  Scenario: Signature status reflected in document list
    Given a document was sent for e-signature
    When John Doe signs the document
    Then the document status should update to "partially_signed"
    When Jane Smith signs the document
    Then the document status should update to "fully_signed"
    And all parties should receive completion notifications

  Scenario: Cannot send document without signers
    Given a document exists without defined signers
    When the user attempts to send for e-signature
    Then the request should fail with error "NoSignersDefined"
    And the user should be prompted to add signers first
```

## Feature File Patterns

### **Structure Template**
```gherkin
Feature: [Feature Name]
  As a [role]
  I want [goal]
  So that [benefit]

  Background:
    Given [shared preconditions]

  Scenario: [Descriptive scenario name]
    Given [context]
    When [action]
    Then [outcome]

  Scenario: [Error scenario name]
    Given [context]
    When [invalid action]
    Then [error outcome]
```

### **Data Tables for Complex Input**
```gherkin
Scenario: Bulk import contacts
  Given the following contacts to import:
    | firstName | lastName | email              | company  |
    | John      | Doe      | john@acme.com      | Acme Corp|
    | Jane      | Smith    | jane@beta.com      | Beta Inc |
  When the user imports the contacts
  Then 2 contacts should be created
  And all contacts should be linked to the user's organization
```

### **Scenario Outlines for Data-Driven Tests**
```gherkin
Scenario Outline: Lead stage transitions
  Given a lead exists in stage "<from_stage>"
  When the user moves the lead to stage "<to_stage>"
  Then the transition should be "<result>"

  Examples:
    | from_stage  | to_stage      | result    |
    | new         | qualified     | allowed   |
    | new         | closed_won    | rejected  |
    | proposal    | negotiation   | allowed   |
    | negotiation | closed_won    | allowed   |
```

## Glossary Alignment Checklist

Before finalizing a feature file, verify:
- [ ] All business terms exist in `docs/glossary.md`
- [ ] No technical/database terms used (use "Lead" not "lead_record")
- [ ] Error codes match domain error types (see `artifacts/api-server/src/errors/domain-errors.ts`)
- [ ] Scenario names describe behavior, not implementation
- [ ] Each feature has at least one positive and one negative scenario

## Minimum Scenario Requirements

Each bounded context feature file must include:
- **Identity & Access**: ≥4 scenarios (register, login, refresh, logout + negative cases)
- **CRM**: ≥5 scenarios (pipeline, duplicates, not found, activities, permissions)
- **Projects**: ≥4 scenarios (create, update, delete, status transitions)
- **Finance**: ≥4 scenarios (create, pay, overpayment, budget alerts)
- **Documents**: ≥4 scenarios (upload, e-sign, status tracking, permissions)
- **Assets**: ≥4 scenarios (checkout, return, maintenance, depreciation)
- **Portal**: ≥4 scenarios (access, permissions, magic-link, session)
- **Analytics**: ≥3 scenarios (reports, date ranges, exports)
- **Settings**: ≥3 scenarios (update, permissions, API keys)
- **Appointments**: ≥5 scenarios (book, cancel, availability, conflicts, rules)

## Integration with Testing

Future phases will wire these feature files to:
- **Playwright + Cucumber**: Automated acceptance tests
- **Cucumber-js**: Node.js test runner for Gherkin
- **Living documentation**: Features as executable specifications

## Verification Commands

After creating feature files:
```bash
# Check feature file syntax
npx gherkin-lint docs/features/*.feature

# Validate against glossary (manual review)
grep -r "Given\|When\|Then" docs/features/*.feature | sort | uniq

# Count scenarios per file
for f in docs/features/*.feature; do echo "$f: $(grep -c "^  Scenario:" $f)"; done
```

This approach ensures feature files serve as both human-readable documentation and the foundation for automated acceptance testing.

---

## bounded-context-mapping

**Description:** Draw and maintain bounded context maps for Domain-Driven Design, defining context boundaries and relationships for the Apex Unified Suite

# Bounded Context Mapping

This skill guides you through creating and maintaining bounded context maps that define architectural boundaries and guide implementation decisions across the Apex Unified Suite.

## Current State Assessment

**Current State**: No bounded context map exists - architectural boundaries are undefined.

**Risks Without Context Mapping**:
- Tight coupling between business domains
- Database joins across business boundaries
- Leaking implementation details between contexts
- Unclear responsibilities and ownership
- Difficult to scale teams and services

## Domain-Driven Design Context Map

### **Core Bounded Contexts for Apex Unified Suite**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Apex Unified Suite                              │
│                                                                          │
│  ┌─────────────────┐         ┌─────────────────┐         ┌──────────┐  │
│  │  Identity &     │◄───────►│   Scheduling &  │         │ Analytics│  │
│  │  Access         │   User  │   Appointments  │         │          │  │
│  │                 │  Ref    │                 │         │  (read-  │  │
│  │  - Users        │         │  - TimeSlots    │         │   only)  │  │
│  │  - Roles        │         │  - Bookings     │         │          │  │
│  │  - Permissions  │         │  - Availability │         │  - Reports│  │
│  │  - Auth         │         │  - Reminders    │         │  - Charts│  │
│  └────────┬────────┘         └────────┬────────┘         └────┬─────┘  │
│           │                          │                       │        │
│           ▼                          ▼                       ▼        │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │      CRM        │         │    Projects       │                   │
│  │                 │         │                   │                   │
│  │  - Leads        │         │  - Projects       │                   │
│  │  - Contacts     │         │  - Tasks          │                   │
│  │  - Companies    │         │  - Milestones     │                   │
│  │  - Deals        │         │  - Templates      │                   │
│  │  - Activities   │         │  - TimeTracking   │                   │
│  └────────┬────────┘         └────────┬────────┘                   │
│           │                          │                              │
│           ▼                          ▼                              │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │     Finance     │         │   Documents     │                   │
│  │                 │         │                   │                   │
│  │  - Invoices     │         │  - Folders        │                   │
│  │  - Payments     │         │  - Documents      │                   │
│  │  - Budgets      │         │  - Versions       │                   │
│  │  - Expenses     │         │  - Workflows      │                   │
│  │  - VirtualCards │         │  - E-Sign (V1)    │                   │
│  └────────┬────────┘         └────────┬────────┘                   │
│           │                          │                              │
│           ▼                          ▼                              │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │  Asset Tracking │         │  Client Portal  │                   │
│  │                 │         │                   │                   │
│  │  - Assets       │         │  - PortalClients  │                   │
│  │  - Checkouts    │         │  - MagicLinks     │                   │
│  │  - Maintenance  │         │  - Sessions       │                   │
│  │  - Depreciation │         │  - Permissions    │                   │
│  └────────┬────────┘         └────────┬────────┘                   │
│           │                          │                              │
│           └──────────┬───────────────┘                              │
│                      ▼                                              │
│           ┌─────────────────┐                                       │
│           │ System Config   │                                       │
│           │                 │                                       │
│           │ - Settings      │                                       │
│           │ - Integrations  │                                       │
│           │ - AuditLogs     │                                       │
│           │ - Notifications │                                       │
│           └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### **Context Relationships**

| Consumer Context | Supplier Context | Relationship Type | Description |
|------------------|------------------|-------------------|-------------|
| CRM | Identity & Access | Customer-Supplier | CRM uses User refs from Identity |
| Projects | Identity & Access | Customer-Supplier | Projects assigns tasks to users |
| Finance | Identity & Access | Customer-Supplier | Finance tracks who created invoices |
| Documents | Identity & Access | Customer-Supplier | Documents track document owners |
| Scheduling | Identity & Access | Customer-Supplier | Appointments linked to users |
| All | System Config | Customer-Supplier | Settings affect all contexts |
| Projects | Scheduling | Anti-Corruption Layer | Projects Scheduler tab is read-only view |
| Analytics | All | Open Host | Analytics reads from all contexts |

## Step-by-Step Implementation

### **Step 1: Create Bounded Contexts Document**

**File**: `docs/bounded-contexts.md`

```markdown
# Bounded Context Map

This document defines the bounded contexts for the Apex Unified Suite and their relationships.

## Core Principles

1. **Context Isolation**: Each context owns its data and business rules
2. **No Cross-Context Joins**: Database queries never join tables from different contexts
3. **Explicit Integration**: Contexts communicate through well-defined interfaces
4. **Ubiquitous Language**: Terms have specific meaning within their context

## Context Definitions

### 1. Identity & Access

**Responsibility**: Authentication, authorization, user management

**Aggregates**:
- User (root)
- Role
- Permission
- Organization

**Key Rules**:
- Email uniqueness is per organization, not global
- Users can belong to multiple organizations
- Roles are organization-scoped

**Published Language**:
- `UserId` - Reference to a user
- `OrganizationId` - Reference to an organization
- `RoleName` - Name of a role

**Integration Points**:
- Provides user references to all other contexts
- Emits: `UserCreated`, `UserRoleChanged`

---

### 2. CRM (Customer Relationship Management)

**Responsibility**: Lead management, contact tracking, deal pipeline

**Aggregates**:
- Lead (root)
- Contact (root)
- Company (root)
- Deal (root)
- Activity

**Key Rules**:
- Leads follow a defined stage pipeline
- Contacts can be associated with multiple companies
- Deal values roll up to forecast reports

**Published Language**:
- `LeadId`, `ContactId`, `CompanyId`, `DealId`
- `LeadStage` - new, qualified, proposal, negotiation, closed_won, closed_lost
- `DealStatus` - open, won, lost

**Integration Points**:
- Consumes: `UserId` from Identity (for assignment)
- Emits: `LeadCreated`, `DealWon`, `DealLost`

---

### 3. Project Management

**Responsibility**: Project planning, task tracking, team collaboration

**Aggregates**:
- Project (root)
- Task (root)
- Milestone
- Template
- TimeEntry

**Key Rules**:
- Tasks can have subtasks (tree structure)
- Milestones group tasks with deadlines
- Projects have a budget and actual spend

**Published Language**:
- `ProjectId`, `TaskId`, `MilestoneId`
- `TaskStatus` - todo, in_progress, done, blocked
- `ProjectStatus` - planning, active, on_hold, completed

**Integration Points**:
- Consumes: `UserId` from Identity (for assignments)
- Consumes: `Appointment` from Scheduling (via ACL for read-only view)
- Emits: `TaskCompleted`, `ProjectMilestoneReached`

---

### 4. Finance

**Responsibility**: Invoicing, payments, expense tracking, budgeting

**Aggregates**:
- Invoice (root)
- Payment
- Budget
- Expense
- VirtualCard

**Key Rules**:
- Invoices must be paid in full or partial payments tracked
- Budgets trigger alerts at thresholds
- Virtual cards have spending limits

**Published Language**:
- `InvoiceId`, `PaymentId`, `BudgetId`
- `InvoiceStatus` - draft, sent, paid, overdue, cancelled
- `PaymentStatus` - pending, completed, failed, refunded

**Integration Points**:
- Consumes: `ContactId` from CRM (for billing)
- Consumes: `ProjectId` from Projects (for project budgets)
- Emits: `InvoicePaid`, `PaymentRecorded`

---

### 5. Document Management

**Responsibility**: File storage, document workflows, e-signatures

**Aggregates**:
- Folder (root)
- Document (root)
- DocumentVersion
- Workflow
- SignatureRequest

**Key Rules**:
- Documents have version history
- E-Sign V1 uses third-party (SignWell)
- Workflows define approval chains

**Published Language**:
- `DocumentId`, `FolderId`, `SignatureRequestId`
- `DocumentStatus` - draft, pending_review, approved, archived
- `SignatureStatus` - pending, signed, declined

**Integration Points**:
- V1: E-Sign via SignWell API (integration adapter pattern)
- Emits: `DocumentSigned`, `WorkflowCompleted`

---

### 6. Asset Tracking

**Responsibility**: Equipment inventory, maintenance schedules, checkouts

**Aggregates**:
- Asset (root)
- Checkout
- MaintenanceLog
- DepreciationSchedule

**Key Rules**:
- Assets have unique identifiers (serial numbers)
- Checkouts track who has what equipment
- Maintenance schedules prevent downtime

**Published Language**:
- `AssetId`, `AssetTag` - unique identifier
- `AssetStatus` - available, checked_out, maintenance, retired
- `AssetCategory` - hardware, software, furniture, vehicle

**Integration Points**:
- Consumes: `UserId` from Identity (for checkouts)
- Emits: `AssetCheckedOut`, `MaintenanceDue`

---

### 7. Client Portal

**Responsibility**: External client access, magic-link authentication

**Aggregates**:
- PortalClient (root)
- PortalSession
- MagicLink

**Key Rules**:
- Portal clients authenticate via magic links
- Sessions are separate from internal auth
- Permissions are limited to client's data only

**Published Language**:
- `PortalClientId`, `PortalSessionId`
- `MagicLinkToken` - short-lived auth token
- `PortalPermission` - read-only, submit-only, etc.

**Integration Points**:
- Consumes: `ContactId` from CRM (to link portal clients)
- Consumes: `DocumentId` from Documents (for shared docs)
- Emits: `PortalAccessGranted`, `MagicLinkUsed`

---

### 8. Scheduling & Appointments

**Responsibility**: Availability management, booking, reminders

**Aggregates**:
- AvailabilityWindow (root)
- Appointment (root)
- BookingRule
- TimeSlot

**Key Rules**:
- Availability windows define when bookings accepted
- Booking rules enforce notice periods and limits
- Time slots can be marked as busy/available/booked

**Published Language**:
- `AppointmentId`, `TimeSlotId`
- `AppointmentStatus` - requested, confirmed, cancelled, completed
- `RecurrencePattern` - daily, weekly, monthly rules

**Integration Points**:
- Provides read-only view to Projects (Scheduler tab via ACL)
- Emits: `AppointmentBooked`, `AppointmentCancelled`

---

### 9. Analytics

**Responsibility**: Reporting, dashboards, business intelligence

**Aggregates**:
- Report
- Dashboard
- Chart
- DataExport

**Key Rules**:
- Analytics is read-only (no business logic changes)
- Reports can span multiple contexts
- Data exports respect tenant boundaries

**Published Language**:
- `ReportId`, `DashboardId`
- `ReportType` - crm, finance, projects, custom

**Integration Points**:
- Consumes events from all contexts
- Consumes data via read replicas or projections

---

### 10. System Configuration

**Responsibility**: Settings, integrations, audit logging

**Aggregates**:
- Setting (key-value)
- Integration
- AuditLog
- NotificationConfig

**Key Rules**:
- Settings are organization-scoped
- Audit logs are immutable
- Integrations define external service connections

**Published Language**:
- `SettingKey`, `IntegrationId`
- `AuditEventType` - create, update, delete, login, export

**Integration Points**:
- Consumes events from all contexts (for audit logging)
- Provides configuration to all contexts

## Context Relationships

### Shared Kernel

**User/Organization Reference** - Minimal shared data:
- `UserId` (UUID) - referenced across contexts
- `OrganizationId` (UUID) - tenant identifier
- Basic user info (name, email) - duplicated for autonomy

### Customer-Supplier Relationships

1. **Identity & Access → All Other Contexts**
   - Identity provides user references
   - Downstream contexts adapt to Identity's model

2. **CRM → Finance**
   - CRM provides contact/customer data
   - Finance adapts for billing purposes

3. **Projects → Finance**
   - Projects provides project data
   - Finance tracks project budgets and costs

### Anti-Corruption Layer

**Projects → Scheduling**:
- Projects Scheduler tab is a **read-only projection**
- Uses `ProjectSchedulerService` adapter
- Reads from `AppointmentServicePort` interface
- Projects context does NOT own scheduling data
- All writes go through Scheduling context's `AppointmentService`

### Open Host Service

**Analytics → All Contexts**:
- Analytics provides standardized reporting interface
- Other contexts expose read-only data via events/API
- Analytics adapts data from multiple sources

## Implementation Rules

1. **No Cross-Context Database Joins**
   - Never join tables from different contexts
   - Use application-level composition instead

2. **Explicit Context References**
   - Use foreign keys only within a context
   - Cross-context references use IDs only

3. **Event-Driven Integration**
   - Contexts communicate via domain events
   - Async messaging prevents tight coupling

4. **API Anti-Corruption Layers**
   - External services use adapter pattern
   - V1 E-Sign is an integration adapter in Documents context
```

### **Step 2: Update Project Scheduler Documentation**

**File**: `docs/bounded-contexts.md` (Scheduling section)

```markdown
## Special Case: Projects Scheduler Tab

The Projects page includes a "Scheduler" tab. This is a **read-only view** that projects appointment data from the Scheduling context.

### Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   Projects      │────►│ ProjectScheduler    │────►│   Scheduling    │
│   Context       │     │ Service (ACL)       │     │   Context       │
│                 │     │                     │     │                 │
│ - Read-only     │     │ - Adapter pattern   │     │ - Owns all      │
│ - No writes     │     │ - Maps to UI model  │     │   scheduling    │
│ - View only     │     │ - No business logic │     │   data          │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
```

### Rules

1. **Projects context NEVER writes scheduling data**
2. **All writes go through Scheduling context**
3. **ProjectSchedulerService** is an ACL adapter
4. **Read-only projection** via `AppointmentServicePort` interface

### Code Pattern

```typescript
// In Projects context - read only
interface AppointmentView {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending';
}

class ProjectSchedulerService {
  constructor(private appointmentPort: AppointmentServicePort) {}
  
  async getProjectAppointments(projectId: string): Promise<AppointmentView[]> {
    // Read from Scheduling context via port
    return this.appointmentPort.findByProjectId(projectId);
  }
  // No create/update/delete methods - this is read-only
}
```
```

### **Step 3: Define E-Sign Scope**

**File**: `docs/bounded-contexts.md` (Documents section)

```markdown
## Special Case: E-Sign Implementation

### V1 Scope (Current)

E-Sign in V1 is implemented as an **integration adapter** within the Documents bounded context.

**Architecture**:
- Delegates to third-party provider (SignWell)
- `signature_requests` table tracks external IDs
- Not a standalone bounded context in V1

**Future (V2)**:
- May become standalone E-Sign bounded context
- Native implementation with digital certificate handling

### Implementation Pattern

```typescript
// Documents context - E-Sign adapter
class SignWellEsignAdapter implements EsignProvider {
  async sendForSignature(
    document: Document, 
    signers: Signer[]
  ): Promise<SignatureRequest> {
    // Call SignWell API
    const externalRequest = await this.signwellApi.createRequest({
      documentUrl: document.url,
      signers: signers.map(s => ({ email: s.email, name: s.name }))
    });
    
    // Track in our database
    return this.signatureRequestRepo.create({
      documentId: document.id,
      externalProvider: 'signwell',
      externalRequestId: externalRequest.id,
      status: 'pending'
    });
  }
}
```
```

### **Step 4: Create Context Validation Rules**

**File**: `.windsurf/rules/bounded-contexts.md`

```markdown
---
trigger: glob
globs: "**/*.ts"
---

# Bounded Context Rules

## Cross-Context Import Rules

❌ **Never import from another context's internal modules**:
```typescript
// WRONG - importing from CRM context internals
import { leadsTable } from '@workspace/db/schema/crm/leads';  
import { LeadService } from '../../crm/services/lead';
```

✅ **Use published interfaces only**:
```typescript
// CORRECT - using shared types
import { LeadId } from '@workspace/api-zod';
import { EventBus } from '@workspace/api-server/events';
```

## Database Rules

❌ **Never join across contexts**:
```typescript
// WRONG - joining CRM and Finance tables
await db.select()
  .from(leadsTable)
  .innerJoin(invoicesTable, eq(leadsTable.id, invoicesTable.leadId)); // Cross-context join!
```

✅ **Query within context boundaries**:
```typescript
// CORRECT - queries within CRM context only
const leads = await db.select().from(leadsTable)
  .where(eq(leadsTable.assignedTo, userId));

// Fetch related data separately
const invoices = await financeService.getInvoicesForLead(leadId);
```

## Service Layer Rules

❌ **Don't leak context internals**:
```typescript
// WRONG - exposing internal table structure
class CRMService {
  async getLeadRawData(leadId: string) {
    return db.select().from(leadsTable).where(eq(leadsTable.id, leadId));
  }
}
```

✅ **Return domain models**:
```typescript
// CORRECT - returning domain model
class CRMService {
  async getLead(leadId: LeadId): Promise<Result<Lead, LeadNotFound>> {
    const data = await this.repo.findById(leadId);
    return data ? ok(this.toDomainModel(data)) : err(new LeadNotFound(leadId));
  }
}
```
```

## Verification Commands

```bash
# Check for cross-context imports (should be empty)
grep -r "from.*crm.*leads" artifacts/api-server/src/finance/ || echo "Clean"
grep -r "from.*finance.*invoices" artifacts/api-server/src/crm/ || echo "Clean"

# Verify context isolation in database queries
# Review SQL queries to ensure no cross-context joins

# Check that domain events are used for cross-context communication
grep -r "EventBus.publish" artifacts/api-server/src/
```

## Context Map Maintenance

### When to Update

- **New Feature**: Does it fit in an existing context?
- **Refactoring**: Are boundaries still correct?
- **Integration**: Document ACLs and adapters
- **Team Changes**: Update ownership if teams reorganize

### Review Checklist

- [ ] All contexts have clear responsibilities
- [ ] No overlapping functionality between contexts
- [ ] Integration points are documented
- [ ] ACLs identified where needed
- [ ] Published languages defined
- [ ] Cross-context queries use IDs only
- [ ] Domain events used for cross-context communication

This bounded context map provides the architectural backbone for implementing domain-driven design in the Apex Unified Suite.

---

## codegen-workflow

**Description:** Complete guide for API-first development using OpenAPI specifications and Orval code generation to create type-safe React Query hooks and Zod schemas

# Code Generation Workflow

This skill guides you through the complete API-first development workflow using OpenAPI specifications and Orval code generation.

## Understanding the Code Generation Pipeline

### Architecture Overview

```
OpenAPI Spec (lib/api-spec/openapi.yaml)
    ↓
Orval Configuration (lib/api-spec/orval.config.ts)
    ↓
┌─────────────────────────────────────────┐
│  Generated React Query Hooks             │
│  lib/api-client-react/src/generated/   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Generated Zod Schemas                  │
│  lib/api-zod/src/generated/types/       │
└─────────────────────────────────────────┘
    ↓
Type-Safe API Integration (Frontend + Backend)
```

### Generated Packages

**@workspace/api-client-react**
- Auto-generated TanStack Query hooks
- Type-safe API calls with built-in error handling
- Automatic caching and invalidation
- Request/response type safety

**@workspace/api-zod**
- Auto-generated Zod validation schemas
- Runtime type validation
- TypeScript type inference
- API contract enforcement

## Step-by-Step Workflow

### Step 1: Define API Specification

**Location**: `lib/api-spec/openapi.yaml`

**Key Sections**:
```yaml
openapi: 3.1.0
info:
  title: Api  # Must remain "Api" for import path compatibility
  version: 0.1.0
servers:
  - url: /api
paths:
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
components:
  schemas:
    HealthStatus:
      type: object
      properties:
        status:
          type: string
          example: ok
```

**Best Practices**:
- Use operationId for hook naming (e.g., healthCheck → useHealthCheckQuery)
- Define all request/response models in components/schemas
- Use descriptive names that follow TypeScript conventions
- Include example values for better documentation

### Step 2: Configure Orval

**Location**: `lib/api-spec/orval.config.ts`

**Configuration Structure**:
```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    output: {
      mode: 'split',
      target: 'src/generated',
      schemas: 'src/generated/schemas',
      client: 'react-query',
      override: {
        query: {
          useInfiniteQuery: false,
        },
      },
    },
    input: {
      target: './openapi.yaml',
    },
    hooks: {
      afterCreateFiles: async (outputFiles) => {
        // Custom post-processing if needed
      },
    },
  },
  zod: {
    output: {
      mode: 'split',
      target: 'src/generated/types',
      schemas: 'src/generated/schemas',
      override: {
        transform: (value) => {
          // Custom transformation logic
        },
      },
    },
    input: {
      target: './openapi.yaml',
    },
  },
});
```

**Key Settings**:
- **mode: 'split'**: Separate files per operation for better organization
- **client: 'react-query'**: Generate TanStack Query hooks
- **override**: Custom configurations for query behavior
- **transform**: Custom transformations for Zod schemas

### Step 3: Run Code Generation

**Command**:
```bash
pnpm --filter @workspace/api-spec run codegen
```

**What Happens**:
1. Orval reads the OpenAPI specification
2. Generates React Query hooks in `lib/api-client-react/src/generated/`
3. Generates Zod schemas in `lib/api-zod/src/generated/types/`
4. Runs workspace typecheck to validate integration
5. Updates package exports automatically

**Generated Files Example**:
```
lib/api-client-react/src/generated/
├── healthCheck.ts
├── hooks/
│   ├── index.ts
│   └── useHealthCheckQuery.ts
└── index.ts

lib/api-zod/src/generated/types/
├── healthStatus.ts
├── schemas/
│   └── index.ts
└── index.ts
```

### Step 4: Use Generated Code

**Frontend Usage**:
```typescript
// Import generated hooks
import { useHealthCheckQuery } from '@workspace/api-client-react';

function HealthCheckComponent() {
  const { data, error, isLoading } = useHealthCheckQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Status: {data?.status}</div>;
}
```

**Backend Usage**:
```typescript
// Import generated schemas
import { HealthCheckResponse } from '@workspace/api-zod';

// Use for validation
app.get('/api/healthz', (req, res) => {
  const response: HealthCheckResponse = { status: 'ok' };
  res.json(response);
});
```

## Advanced Patterns

### Custom Fetch Configuration

**Location**: `lib/api-spec/custom-fetch.ts`

```typescript
import { createFetch } from 'orval';

export const customFetch = createFetch({
  baseUrl: '/api',
  // Custom configuration
  interceptors: {
    request: [(request) => {
      // Add headers, authentication, etc.
      return request;
    }],
    response: [(response) => {
      // Handle responses globally
      return response;
    }],
  },
});
```

### Query Configuration

**Custom Query Options**:
```typescript
// In generated hooks, you can pass custom options
const { data } = useHealthCheckQuery({
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
});
```

### Mutation Hooks

**Define in OpenAPI**:
```yaml
paths:
  /api/users:
    post:
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
```

**Generated Usage**:
```typescript
import { useCreateUserMutation } from '@workspace/api-client-react';

function CreateUserForm() {
  const createUser = useCreateUserMutation({
    onSuccess: (data) => {
      console.log('User created:', data);
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });

  const handleSubmit = (userData) => {
    createUser.mutate(userData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Troubleshooting

### Common Issues

**Type Errors After Codegen**:
```bash
# Run full workspace typecheck
pnpm run typecheck

# Check specific package
pnpm --filter @workspace/api-client-react run typecheck
```

**Generated Hooks Not Working**:
1. Verify OpenAPI spec is valid YAML
2. Check operationId values (must be valid TypeScript identifiers)
3. Ensure schema references are correct
4. Run codegen again: `pnpm --filter @workspace/api-spec run codegen`

**Import Errors**:
1. Check package.json exports in generated packages
2. Verify workspace dependencies are correctly referenced
3. Run `pnpm install` to update internal dependencies

### Debugging Code Generation

**Verbose Output**:
```bash
# Run with verbose logging
pnpm --filter @workspace/api-spec run codegen -- --verbose
```

**Check Orval Configuration**:
```bash
# Validate orval config
pnpm --filter @workspace/api-spec run orval --config lib/api-spec/orval.config.ts
```

## Best Practices

### API Design

1. **Consistent Naming**: Use camelCase for operationId and schema names
2. **Type Safety**: Define all request/response models explicitly
3. **Validation**: Include validation rules in OpenAPI schemas
4. **Documentation**: Add descriptions and examples for all endpoints

### Code Generation

1. **Never Edit Generated Files**: Always update OpenAPI spec instead
2. **Version Control**: Track OpenAPI changes in git
3. **Automation**: Run codegen in CI/CD pipeline
4. **Testing**: Test generated hooks with mock data

### Integration Patterns

1. **Error Handling**: Use built-in error states from generated hooks
2. **Loading States**: Leverage isLoading from generated hooks
3. **Caching**: Configure staleTime and cacheTime appropriately
4. **Optimistic Updates**: Use mutation hooks with onMutate

## Workflow Integration

### Git Hooks

Add codegen to pre-commit hook:
```bash
#!/bin/sh
# .git/hooks/pre-commit
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

### CI/CD Pipeline

```yaml
# Example GitHub Actions
- name: Generate API Client
  run: pnpm --filter @workspace/api-spec run codegen

- name: Type Check
  run: pnpm run typecheck

- name: Build
  run: pnpm run build
```

### Development Workflow

1. **Update OpenAPI**: Edit specification file
2. **Run Codegen**: Generate hooks and schemas
3. **Type Check**: Validate integration
4. **Implement**: Use generated code in components
5. **Test**: Verify functionality with generated types

This workflow ensures complete type safety from API specification to frontend implementation, reducing errors and improving developer experience.

---

## create-adr

**Description:** Guide for creating MADR-style Architecture Decision Records with proper template, status tracking, and repository integration for the Apex Unified Suite.

# Create Architecture Decision Record (ADR)

## Overview
This skill guides you through creating a MADR (Markdown Any Decision Record) style Architecture Decision Record for the Apex Unified Suite. ADRs capture architectural decisions with rationale, alternatives considered, and consequences.

## Prerequisites
- Git workspace with committed changes
- Understanding of the architectural decision being documented
- Access to the project's decision log directory

## Step 1: Determine ADR Type and Scope

Before creating an ADR, assess whether the decision meets these criteria:

### Architecturally Significant Requirements (ASRs)
- **Functional requirements** that have measurable effect on system architecture
- **Non-functional requirements** (performance, security, scalability, maintainability)
- **Cross-cutting concerns** affecting multiple bounded contexts
- **Technology choices** with long-term impact
- **Integration patterns** between systems or contexts

### Decision Drivers
Ask yourself:
- Is this decision reversible without significant cost?
- Does it affect multiple teams or bounded contexts?
- Will it influence future architectural decisions?
- Does it introduce new constraints or dependencies?

## Step 2: Choose ADR Template

### Use Full MADR Template for:
- Major architectural decisions (new bounded contexts, significant technology changes)
- Decisions with multiple viable options
- Decisions requiring stakeholder consensus

### Use Minimal MADR Template for:
- Minor architectural decisions
- Internal team decisions
- Decisions with obvious best choice

## Step 3: Create ADR File

### File Naming Convention
```
docs/adr/ARCH-XXX-decision-title.md
```

Where:
- `XXX` = Sequential number (e.g., 001, 002, 003)
- `decision-title` = kebab-case summary of decision

### Number Assignment
1. Check existing ADRs in `docs/adr/` directory
2. Use next sequential number
3. Update ADR index if it exists

## Step 4: Populate MADR Template

### Full MADR Template Structure:

```markdown
# [Title]

## Status
[proposed | rejected | accepted | deprecated | superseded by [ADR-XXX]]

## Date
[YYYY-MM-DD]

## Deciders
[List everyone involved in the decision]

## Consulted
[List subject matter experts and stakeholders]

## Informed
[List teams/people kept up-to-date]

## Context
[Describe the problem or situation that requires this decision]

## Decision Drivers
[List the key factors that influence this decision]

## Considered Options
### Option 1: [Title]
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]

### Option 2: [Title]
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]

### Option 3: [Title] (if applicable)
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]

## Decision
[Clearly state the chosen option and why]

## Consequences
- **Positive**: [Expected benefits]
- **Negative**: [Drawbacks and trade-offs]

## Confirmation
[Optional: How the decision will be validated]
```

### Minimal MADR Template:

```markdown
# [Title]

## Status
[proposed | accepted | rejected]

## Context
[Problem description]

## Decision
[Chosen solution]

## Consequences
[Impact of the decision]
```

## Step 5: Write Quality Content Guidelines

### Context Section
- **Be specific**: Describe the actual problem, not generic concerns
- **Include metrics**: If performance is an issue, include current vs. target metrics
- **Reference requirements**: Link to specific business or technical requirements
- **Explain urgency**: Why this decision needs to be made now

### Options Section
- **Be objective**: Present each option fairly
- **Include costs**: Both implementation and ongoing maintenance costs
- **Consider risks**: Security, scalability, team expertise risks
- **Provide evidence**: Data, benchmarks, or case studies when possible

### Decision Section
- **Be decisive**: Clearly state which option was chosen
- **Explain reasoning**: Connect decision back to decision drivers
- **Address trade-offs**: Acknowledge why other options were rejected
- **Define scope**: What is included and what is out of scope

### Consequences Section
- **Be comprehensive**: Include both technical and business impacts
- **Consider timeline**: Short-term vs. long-term consequences
- **Identify dependencies**: What other decisions or work does this enable?
- **Plan mitigation**: How negative consequences will be managed

## Step 6: Review and Validation

### Self-Review Checklist
- [ ] Title is clear and descriptive
- [ ] Status is accurately set
- [ ] All required sections are complete
- [ ] Decision drivers are clearly linked to decision
- [ ] Options are presented objectively
- [ ] Consequences cover both positive and negative impacts
- [ ] Language is precise and unambiguous

### Stakeholder Review
1. **Technical review**: Share with senior developers and architects
2. **Business review**: Share with product managers and stakeholders
3. **Security review**: Include security team for decisions affecting security
4. **Operations review**: Include DevOps/SRE for infrastructure decisions

## Step 7: Integration Process

### Git Workflow
```bash
# Create feature branch
git checkout -b adr/ARCH-XXX-[decision-title]

# Add ADR file
git add docs/adr/ARCH-XXX-[decision-title].md

# Commit with descriptive message
git commit -m "feat: Add ARCH-XXX - [decision title] ADR"

# Push for review
git push origin adr/ARCH-XXX-[decision-title]
```

### ADR Status Updates
- **Proposed**: Initial creation, awaiting review
- **Accepted**: Decision made and approved
- **Rejected**: Decision not pursued (include reason)
- **Deprecated**: Decision superseded or no longer relevant
- **Superseded by**: Replaced by newer ADR (reference new ADR)

### Repository Integration
- Update ADR index if it exists
- Add to decision log summary
- Link from related code/documentation
- Consider adding to project README for major decisions

## Step 8: Post-Decision Activities

### Implementation Tracking
- Create implementation tasks/issues referencing the ADR
- Update ADR status as implementation progresses
- Add implementation notes to ADR as lessons learned

### Review and Maintenance
- Schedule review 1-3 months after implementation
- Update ADR with actual outcomes vs. expected consequences
- Consider creating follow-up ADRs for related decisions

## Common ADR Patterns in Apex Unified Suite

### Bounded Context Decisions
- New bounded context creation
- Context boundary adjustments
- Cross-context integration patterns

### Technology Decisions
- Database technology choices
- API framework selections
- Authentication/authorization patterns
- Deployment infrastructure changes

### Process Decisions
- Development workflow changes
- Testing strategy updates
- Monitoring and observability implementations

## Example ADRs for Reference

See existing ADRs in `docs/adr/` directory for examples of:
- ARCH-001: API-first development approach
- ARCH-005: Multi-tenancy strategy
- Additional project-specific architectural decisions

## Troubleshooting

### Common Issues
- **Vague context**: Be more specific about the problem
- **Incomplete options**: Ensure all viable alternatives are considered
- **Missing consequences**: Always document both positive and negative impacts
- **Unclear decision**: State exactly what was decided and why

### Getting Help
- Consult with senior architects for complex decisions
- Reference existing ADRs for formatting and content examples
- Use the MADR project documentation for template guidance
- Consider pair decision-making for critical architectural choices

## Integration with Development Workflow

### Code References
When implementing code based on an ADR:
```typescript
// Implementation based on ARCH-XXX decision
// See: docs/adr/ARCH-XXX-decision-title.md
```

### Documentation Updates
- Update API documentation for API-related decisions
- Update developer guides for process decisions
- Update deployment guides for infrastructure decisions

## Quality Metrics

Good ADRs should be:
- **Actionable**: Clear what needs to be done
- **Justifiable**: Rationale is compelling and evidence-based
- **Traceable**: Can be linked to requirements and implementation
- **Maintainable**: Easy to update as circumstances change
- **Shareable**: Understandable by both technical and business stakeholders

This skill ensures all architectural decisions in the Apex Unified Suite are properly documented, reviewed, and traceable throughout the project lifecycle.

---

## create-layout-component

**Description:** Guides the creation of layout components including Sidebar, CommandPalette, StatusBar, and RightPanel with proper state management and responsive behavior

## Layout Components

### Sidebar (Sidebar.tsx)
- Fixed left sidebar with two states:
  - Collapsed: icons only, 64px width
  - Expanded: icons + labels, 240px width
- Toggle state stored in `uiStore`
- Nav items in order:
  1. Dashboard (grid icon)
  2. Chat (message-square icon)
  3. Projects (layers icon)
  4. Calendar (calendar icon)
  5. News (newspaper icon)
  6. Budget (wallet icon)
  7. Divider
  8. Settings (gear icon) — expands accordion with: General, Analytics, Memory, Integrations, Appearance, Notifications, Export, Danger Zone
- Active state: electric-blue left border + blue-tinted background + blue icon
- Hover: subtle white/8 background

### CommandPalette (CommandPalette.tsx)
- Triggered by `Cmd+K` / `Ctrl+K`
- Full-screen dark overlay: `bg-black/80 backdrop-blur`
- Centered modal: 640px wide
- Electric-blue highlight on selected item
- Groups: Navigation, Actions, Recent Projects, Recent Chats
- `role="combobox"` with `aria-expanded` and `aria-activedescendant`

### StatusBar (StatusBar.tsx)
- 32px fixed bottom bar
- Shows:
  - Backend connection status (green pulse = connected, red = disconnected)
  - Active agent count
  - Current time
  - Global token spend today
- Clicking each item opens relevant panel

### RightPanel (RightPanel.tsx)
- Collapsible 320px right drawer
- Smooth 200ms slide transition
- Content varies by page:
  - Dashboard: AttentionQueue
  - Projects: task metadata
  - Chat: agent context
- Toggled by button in top-right corner

## State Management

Use Zustand for UI-only state:
- Sidebar open/close
- Command palette open/close
- Active panel (for RightPanel)

## Responsive Behavior

- Sidebar should be responsive on smaller screens
- Right panel should overlay content on mobile
- Command palette should be full-screen on mobile

## Accessibility (WCAG 2.2 AA)

- Sidebar: proper ARIA navigation landmarks (nav), semantic HTML, keyboard navigation
- CommandPalette: role="combobox" with proper ARIA (aria-expanded, aria-activedescendant)
- StatusBar: accessible labels for each item, role="status"
- RightPanel: focus trap when open, role="dialog", aria-modal="true"
- All interactive elements: 4.5:1 color contrast ratio minimum
- Focus management: visible focus indicators, focus restoration after panel close
- Dynamic content: aria-live regions for status updates
- Screen readers: announce panel open/close, command palette selection
- Keyboard navigation: proper tab order, escape to close panels/drawers

**Tailwind v4 & shadcn/ui Notes (2026):**
- shadcn/ui v2+ uses Tailwind v4 with @theme directive
- Components have data-slot attributes for styling
- forwardRef removed from components (React 19 pattern)
- HSL colors converted to OKLCH in v4
- Default style deprecated, new projects use new-york style

---

## create-mock-data

**Description:** Guides the creation of realistic mock data files for the AI command center, ensuring all components have placeholder data that matches TypeScript interfaces

## Mock Data Files

Create mock data files in `src/lib/mockData/`:

### agents.ts
- Agent fleet data with realistic agent information
- Each agent: name, avatar initials, status, current task, token spend, uptime
- Include various states: thinking, idle, error, waiting

### projects.ts
- Project list with realistic project data
- Each project: name, status, priority, due date, tags, progress, owner
- Include tasks with subtasks, checklists, comments

### tasks.ts
- Task data with nested subtasks
- Each task: title, status, priority, due date, assignee, checklist items
- Include various states: Not Started, In Progress, Blocked, In Review, Done

### calendar.ts
- Calendar events with realistic schedule
- Each event: title, date, time, description, location, repeat rule
- Include linked project references

### budget.ts
- Financial data: net worth, cash flow, categories, transactions
- Include goals (saving and payoff), accounts, recurring items, investments
- Realistic monetary values and trends

### transactions.ts
- Transaction history with realistic data
- Each transaction: date, merchant, category, account, amount, type
- Include income, expenses, transfers

### news.ts
- News feed with realistic articles
- Each article: source, published timestamp, headline, AI summary, sentiment, topics
- Include various sources with trust tier badges

### settings.ts
- Settings data for all settings sections
- Include: general, appearance, notifications, analytics, memory, integrations
- Realistic configuration values

## Data Quality Guidelines

- Use realistic, believable data
- Include edge cases and error states
- Ensure data matches TypeScript interfaces
- Provide sufficient variety for testing
- Include realistic dates, times, and monetary values
- Use consistent naming conventions
- Add comments explaining data structure

## TypeScript Interfaces

Ensure all mock data exports TypeScript interfaces that match the data structure. These interfaces should be used in API client functions and components.

## Example Pattern

```typescript
export interface Agent {
  id: string;
  name: string;
  avatar: string;
  status: 'thinking' | 'idle' | 'error' | 'waiting';
  currentTask: string;
  tokenSpend: number;
  uptime: string;
}

export const mockAgents: Agent[] = [
  // realistic data here
];
```

---

## create-react-component

**Description:** Guides the creation of React components with TypeScript, Tailwind CSS v4, and shadcn/ui following the YDM project's visual identity and accessibility standards

## Component Creation Checklist for YDM (2026)

1. **Determine component location** based on artifact and functionality:
   
   **Nexus Digital Frontend (`artifacts/nexus-digital/`)**:
   - Pages: `src/pages/` (Home, Industry, Process, About, Blog, Contact)
   - Custom components: `src/components/` (Navbar, Footer, ParticleNetwork, etc.)
   - Reusable UI components: `src/components/ui/` (shadcn/ui)
   
   **Mockup Sandbox (`artifacts/mockup-sandbox/`)**:
   - Mockup components: `src/components/mockups/` (for preview system)
   - UI components: `src/components/ui/` (shadcn/ui)
   
   **API Server (`artifacts/api-server/`)**:
   - Route handlers: `src/routes/` (API endpoints)
   - Middleware: `src/middleware/` (Express middleware)
   - Utilities: `src/lib/` (backend utilities)

2. **Use shadcn/ui components as base** when available (Tailwind v4)
   - Note: YDM uses Tailwind CSS v4.1.14 with Vite plugin integration
   - Components use forwardRef for ref forwarding (React 19 pattern)
   - CSS custom properties for theming (tokens.css)
   - Glass morphism effects throughout design system

3. **Apply visual identity**:
   - Glass panels: `backdrop-blur-md bg-white/5 border border-white/10 rounded-xl`
   - Electric blue accent: `#0066ff → #00aaff` for CTAs, focus rings, active states
   - Dark backgrounds: `#000000`, `#0a0a0a`, `#111111`, `#1a1a1a`

4. **Add 150ms ease-out transitions** on interactive elements

5. **Implement accessibility (WCAG 2.2 AA)**:
   - Semantic HTML elements (nav, main, aside, header, footer)
   - ARIA landmarks and labels where needed
   - Keyboard navigation support
   - Focus management (focus trap in modals, focus restoration)
   - 4.5:1 color contrast ratio minimum
   - Proper heading hierarchy (no skipped levels)
   - aria-live regions for dynamic content
   - Screen reader announcements for important changes

6. **Use TypeScript** with proper interfaces for props (TypeScript 5.9.2)

7. **Add skeleton loaders** for data fetching states (using TanStack Query)

8. **React 19 patterns**:
   - Use `forwardRef` for components that need ref forwarding
   - Use `<Context.Provider>` for context providers
   - Use standard ref callbacks with cleanup functions
   - Consider Suspense boundaries with React.lazy() for code splitting
   - Use standard form handling with React Hook Form
   - Use FormEvent for form submissions
   - Use TanStack Query v5.90.21 for optimistic UI updates
   - Use standard useEffect/useCallback/useMemo hooks
   - Integrate with generated API hooks from `@workspace/api-client-react`

9. **YDM-Specific Integration**:
   - Use Wouter for routing (not React Router)
   - Import API hooks from `@workspace/api-client-react`
   - Use Framer Motion 11.0.0 for animations (not motion library)
   - Respect Replit environment variables (PORT, BASE_PATH)
   - Use workspace protocol for internal dependencies

## Related Skills

- **motion-implementation**: Add animations and micro-interactions to components
- **form-components**: For creating form components with validation
- **accessibility**: Ensure WCAG 2.2 AA compliance
- **performance**: Optimize component rendering and Core Web Vitals

## Component Structure Template (React 19 - YDM)

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useUsersQuery } from '@workspace/api-client-react'; // Example API hook

interface ComponentNameProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ 
  title, 
  onAction, 
  className = "" 
}) => {
  const { data: users, isLoading } = useUsersQuery();

  return (
    <motion.div
      className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {isLoading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <div>
          {/* component content */}
          {users && <p>Found {users.length} users</p>}
        </div>
      )}
      {onAction && (
        <button 
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150"
        >
          Action
        </button>
      )}
    </motion.div>
  );
};

// React 19: Use forwardRef for ref forwarding
export const ComponentWithRef = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ title, onAction, className }, ref) => {
    return (
      <div ref={ref} className={`glass-card ${className}`}>
        <h3>{title}</h3>
        {onAction && <button onClick={onAction}>Action</button>}
      </div>
    );
  }
);
ComponentWithRef.displayName = 'ComponentWithRef';

// React 19: Context.Provider pattern
const ThemeContext = React.createContext<'dark' | 'light'>('dark');

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value="dark">
      {children}
    </ThemeContext.Provider>
  );
};

// React 19: Ref callback with cleanup
export const ComponentWithCleanup: React.FC = () => {
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (ref) {
      // Setup
      const observer = new IntersectionObserver(/* ... */);
      observer.observe(ref);
      
      return () => {
        // Cleanup
        observer.disconnect();
      };
    }
  }, [ref]);

  return <div ref={setRef}>Content with cleanup</div>;
};
```

## Motion Pattern

```tsx
// Add to interactive elements
className="transition-all duration-150 ease-out"
```

## Reduced Motion Support

```css
@media (prefers-reduced-motion: no-preference) {
  /* animations here */
}
```

---

## database-migration-management

**Description:** Implement database migration system with Drizzle Kit for schema versioning, migration generation, and deployment workflows

# Database Migration Management

This skill guides you through implementing a database migration system using Drizzle Kit for managing schema changes, versioning, and safe deployment workflows.

## Current State Assessment

**Current State**: Drizzle Kit is configured but migrations are not being generated.

**Missing Infrastructure**:
- No migration generation workflow
- No schema versioning strategy
- No rollback procedures
- No migration testing in CI/CD

## Migration Architecture

### **Migration Types**

| Type | Purpose | When to Use |
|------|---------|-------------|
| **Schema Migration** | CREATE, ALTER, DROP table/column | Adding new tables, modifying columns |
| **Data Migration** | UPDATE, INSERT, DELETE | Backfilling data, transforming values |
| **Index Migration** | CREATE, DROP INDEX | Performance optimization |
| **Constraint Migration** | ADD, DROP constraints | Adding foreign keys, unique constraints |

### **Migration Workflow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Migration Workflow                            │
│                                                                  │
│  1. Schema Change ──► 2. Generate ──► 3. Review ──► 4. Test     │
│                                                                  │
│  5. Deploy ──► 6. Verify ──► 7. Monitor                          │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Configure Drizzle Kit**

**File**: `lib/db/drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### **Step 2: Create Migration Scripts**

**File**: `lib/db/package.json`

```json
{
  "name": "@workspace/db",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:check": "drizzle-kit check",
    "db:up": "drizzle-kit up"
  }
}
```

### **Step 3: Migration Generation Workflow**

**Development Workflow**:

```bash
# 1. Make schema changes
# Edit: lib/db/src/schema/crm/contacts.ts

# 2. Generate migration
pnpm --filter @workspace/db run db:generate

# 3. Review generated migration
# Check: lib/db/migrations/0001_add_contact_indexes.sql

# 4. Apply locally
pnpm --filter @workspace/db run db:migrate

# 5. Verify
pnpm --filter @workspace/db run db:check
```

### **Step 4: Migration File Structure**

**File**: `lib/db/migrations/meta/_journal.json`

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1704067200000,
      "tag": "0000_initial",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1704153600000,
      "tag": "0001_add_contacts",
      "breakpoints": true
    }
  ]
}
```

**File**: `lib/db/migrations/0001_add_contacts.sql`

```sql
-- Migration generated by Drizzle Kit
-- Timestamp: 2024-01-01 12:00:00

CREATE TABLE IF NOT EXISTS "contacts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "company" text,
    "title" text,
    "status" text DEFAULT 'active',
    "tags" text[],
    "notes" text,
    "last_contacted_at" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "deleted_at" timestamp,
    "created_by" uuid,
    "updated_by" uuid,
    "deleted_by" uuid
);

-- Indexes for performance
CREATE INDEX "idx_contacts_organization" ON "contacts"("organization_id");
CREATE INDEX "idx_contacts_email" ON "contacts"("organization_id", "email");
CREATE INDEX "idx_contacts_status" ON "contacts"("organization_id", "status");

-- Soft delete filter index
CREATE INDEX "idx_contacts_not_deleted" ON "contacts"("organization_id") WHERE "deleted_at" IS NULL;
```

### **Step 5: Multi-Tenancy Migration Pattern**

**Adding organization_id to existing table**:

```sql
-- 0002_add_tenancy.sql

-- 1. Add organization_id column (nullable initially)
ALTER TABLE "leads" ADD COLUMN "organization_id" uuid;

-- 2. Create index
CREATE INDEX "idx_leads_organization" ON "leads"("organization_id");

-- 3. Backfill data (if migrating existing data)
-- UPDATE "leads" SET "organization_id" = 'default-org-id' WHERE "organization_id" IS NULL;

-- 4. Make column NOT NULL (after backfill)
-- ALTER TABLE "leads" ALTER COLUMN "organization_id" SET NOT NULL;

-- 5. Add foreign key constraint
ALTER TABLE "leads" 
    ADD CONSTRAINT "fk_leads_organization" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");
```

### **Step 6: Safe Migration Practices**

**Adding a new column** (safe, no lock):
```sql
-- Adding nullable column is fast
ALTER TABLE "contacts" ADD COLUMN "linkedin_url" text;

-- Adding with default requires table rewrite (use carefully)
ALTER TABLE "contacts" ADD COLUMN "priority" text DEFAULT 'normal';
```

**Adding an index** (safe, brief lock):
```sql
-- Use CONCURRENTLY to avoid locking (PostgreSQL)
CREATE INDEX CONCURRENTLY "idx_contacts_tags" ON "contacts" USING gin("tags");
```

**Renaming a column** (requires application coordination):
```sql
-- Step 1: Add new column
ALTER TABLE "contacts" ADD COLUMN "full_name" text;

-- Step 2: Backfill data
UPDATE "contacts" SET "full_name" = "first_name" || ' ' || "last_name";

-- Step 3: Application reads from both, writes to new
-- (Deploy application update)

-- Step 4: Drop old column
-- (After confirming all code uses new column)
```

**Dropping a column** (safe but irreversible):
```sql
-- Ensure no code references this column first!
ALTER TABLE "contacts" DROP COLUMN "deprecated_field";
```

### **Step 7: Migration Verification**

**File**: `lib/db/scripts/verify-migration.ts`

```typescript
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function verifyMigration() {
  // Check migration table
  const migrations = await db.execute(sql`
    SELECT * FROM "__drizzle_migrations" 
    ORDER BY "created_at" DESC 
    LIMIT 5
  `);

  console.log('Recent migrations:');
  for (const m of migrations) {
    console.log(`  - ${m.hash}: ${m.created_at}`);
  }

  // Verify table structure
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log('\nTables in database:');
  for (const t of tables) {
    console.log(`  - ${t.table_name}`);
  }

  // Verify indexes
  const indexes = await db.execute(sql`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);

  console.log('\nIndexes:');
  for (const i of indexes) {
    console.log(`  - ${i.tablename}: ${i.indexname}`);
  }
}

verifyMigration().catch(console.error);
```

### **Step 8: Rollback Strategy**

**Important**: Drizzle migrations are forward-only. Plan rollbacks carefully.

**Rollback Options**:

1. **Backup and Restore** (safest):
```bash
# Before migration, create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# To rollback, restore from backup
psql $DATABASE_URL < backup-20240101.sql
```

2. **Compensating Migration**:
```sql
-- 0003_rollback_column_addition.sql
-- If you need to undo a column addition

ALTER TABLE "contacts" DROP COLUMN IF EXISTS "new_column";
```

3. **Database Snapshots** (managed platforms):
```bash
# Replit allows database branching
# Create branch before risky migration
```

### **Step 9: CI/CD Integration**

**File**: `.github/workflows/migrate.yml`

```yaml
name: Database Migration

on:
  push:
    branches: [main]
    paths:
      - 'lib/db/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd lib/db
          pnpm drizzle-kit migrate
      
      - name: Verify migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd lib/db
          pnpm drizzle-kit check
```

### **Step 10: Environment-Specific Configuration**

**File**: `lib/db/drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Production safety settings
  verbose: true,
  strict: true,
  // Don't run migrations automatically in production
  // Use explicit migration commands
});
```

## Migration Best Practices

### **Naming Conventions**

```
0000_initial.sql
0001_add_contacts_table.sql
0002_add_lead_stage_column.sql
0003_add_contact_indexes.sql
0004_add_tenancy_to_users.sql
```

### **Migration Content Guidelines**

✅ **Do**:
- One logical change per migration
- Add comments explaining complex changes
- Test migrations on a copy of production data
- Use transactions when possible
- Add rollback/compensating migration for risky changes

❌ **Don't**:
- Mix schema and data changes in one migration
- Modify existing migrations (create new ones instead)
- Delete migration files after they're applied
- Use non-deterministic operations (random, now()) in constraints

### **Production Deployment**

```bash
# 1. Create backup first
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Verify migration files
pnpm --filter @workspace/db run db:check

# 3. Run migration
pnpm --filter @workspace/db run db:migrate

# 4. Verify deployment
pnpm --filter @workspace/db run db:check

# 5. Monitor application logs
# Check for errors related to database
```

## Verification Commands

```bash
# Check migration status
pnpm --filter @workspace/db run db:check

# List pending migrations
pnpm --filter @workspace/db drizzle-kit status

# View migration history
psql $DATABASE_URL -c "SELECT * FROM __drizzle_migrations ORDER BY created_at;"

# Verify table structure
psql $DATABASE_URL -c "\d contacts"

# Check for missing indexes
psql $DATABASE_URL -c "
  SELECT tablename, indexname 
  FROM pg_indexes 
  WHERE schemaname = 'public'
  ORDER BY tablename;
"
```

## Migration Checklist

- [ ] Backup created before migration
- [ ] Migration reviewed by another developer
- [ ] Tested on staging environment
- [ ] Rollback plan documented
- [ ] Application code ready for new schema
- [ ] Monitoring in place for post-migration
- [ ] Migration run during low-traffic window
- [ ] Verification completed after migration

---

## database-schema-development

**Description:** Complete Drizzle ORM schema implementation using 2026 best practices with type-safe enum patterns and full TypeScript integration

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

---

## dependency-auditing

**Description:** Audit and clean up unused dependencies, pin critical versions, and maintain a lean, secure dependency tree for the monorepo

# Dependency Auditing

This skill guides you through auditing project dependencies, removing unused packages, and pinning critical versions for a lean, secure, and maintainable dependency tree.

## Current State Assessment

**Identified Unused Dependencies**:
- `cookie-parser` (api-server) - Declared but never imported
- `@hookform/resolvers` (apex-os) - Only used in shadcn form.tsx, not in pages
- `react-hook-form` (apex-os) - Never imported in any page
- `next-themes` (apex-os) - No theme switching implemented
- `react-day-picker` (apex-os) - No date picker usage
- `react-resizable-panels` (apex-os) - No resizable panel usage
- `vaul` (apex-os) - Drawer component unused
- `embla-carousel-react` (apex-os) - No carousel in pages

**Version Issues**:
- `zod` floating version incompatible with `drizzle-zod`
- Missing testing frameworks (Vitest 2.0, Playwright 1.45)

## Dependency Audit Process

### **Step 1: Analyze Current Dependencies**

```bash
# List all dependencies across workspace
pnpm list --depth=0

# Check for outdated packages
pnpm outdated

# Find unused dependencies (requires depcheck)
npx depcheck --ignores="@types/*,eslint*,prettier*"

# Audit security vulnerabilities
pnpm audit
```

### **Step 2: Identify Unused Dependencies**

Search for imports across the codebase:

```bash
# Check if cookie-parser is imported
grep -r "cookie-parser" artifacts/api-server/src/ || echo "NOT USED"

# Check react-hook-form usage
grep -r "react-hook-form" artifacts/apex-os/src/ || echo "NOT USED"

# Check @hookform/resolvers
grep -r "@hookform/resolvers" artifacts/apex-os/src/ || echo "NOT USED"

# Check next-themes
grep -r "next-themes\|useTheme" artifacts/apex-os/src/ || echo "NOT USED"

# Check react-day-picker
grep -r "react-day-picker\|DayPicker" artifacts/apex-os/src/ || echo "NOT USED"

# Check react-resizable-panels
grep -r "react-resizable-panels\|ResizablePanel" artifacts/apex-os/src/ || echo "NOT USED"

# Check vaul
grep -r "vaul\|Drawer" artifacts/apex-os/src/ || echo "NOT USED"

# Check embla-carousel
grep -r "embla-carousel" artifacts/apex-os/src/ || echo "NOT USED"
```

### **Step 3: Remove Unused Dependencies**

**Decision Matrix**:
| Package | Status | Action | Notes |
|---------|--------|--------|-------|
| cookie-parser | Unused | Remove | No imports found |
| react-hook-form | Unused | Keep for Phase 5 | Will be used for forms |
| @hookform/resolvers | Unused | Keep for Phase 5 | Paired with react-hook-form |
| next-themes | Unused | Remove | No theme switching planned |
| react-day-picker | Unused | Remove | No date picker requirement |
| react-resizable-panels | Unused | Remove | No resizable UI planned |
| vaul | Unused | Remove | shadcn Drawer exists |
| embla-carousel-react | Unused | Keep | May use for marketing |

**Remove confirmed unused packages**:

```bash
# Remove from api-server
pnpm --filter @workspace/api-server remove cookie-parser

# Remove from apex-os
pnpm --filter @workspace/apex-os remove next-themes react-day-picker react-resizable-panels vaul
```

### **Step 4: Pin Critical Versions**

**Zod Compatibility Fix**:

```bash
# Pin zod to compatible version for drizzle-zod
pnpm --filter @workspace/db add zod@3.23.8
pnpm --filter @workspace/api-zod add zod@3.23.8
pnpm --filter @workspace/api-client-react add zod@3.23.8
pnpm --filter @workspace/api-server add zod@3.23.8
pnpm --filter @workspace/apex-os add zod@3.23.8
```

**Add Missing Critical Dependencies**:

```bash
# Add to workspace catalog in pnpm-workspace.yaml
cat << 'EOF'

# Critical dependencies for upcoming features
neverthrow: ^6.0.1
vitest: ^2.0.0
@vitest/ui: ^2.0.0
argon2: ^0.40.1
@playwright/test: ^1.45.0
EOF

# Then run install
pnpm install
```

### **Step 5: Update pnpm-workspace.yaml**

**File**: `pnpm-workspace.yaml`

```yaml
packages:
  - "artifacts/*"
  - "lib/*"
  - "lib/integrations/*"
  - "scripts/*"

catalog:
  # Framework
  react: 19.1.0
  react-dom: 19.1.0
  
  # Build Tools
  typescript: 5.9.2
  vite: 7.3.2
  esbuild: 0.27.3
  
  # Database & API
  drizzle-orm: 0.45.2
  drizzle-zod: 0.8.3
  zod: 3.23.8  # Pinned for compatibility
  
  # Authentication & Security
  argon2: ^0.40.1
  jsonwebtoken: ^9.0.2
  
  # Testing (new)
  vitest: ^2.0.0
  @vitest/ui: ^2.0.0
  @playwright/test: ^1.45.0
  
  # Error Handling
  neverthrow: ^6.0.1
  
  # UI (existing)
  tailwindcss: 4.1.14
  framer-motion: 11.0.0
  
  # Utilities
  date-fns: ^3.0.0
  uuid: ^9.0.0

# Keep existing security configuration
catalogs: []
```

### **Step 6: Verify Installation**

```bash
# Clean install to verify changes
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile

# Verify no peer dependency issues
pnpm install 2>&1 | grep -i "peer" || echo "No peer issues"

# Type check to ensure nothing broke
pnpm run typecheck

# Build to ensure compatibility
pnpm run build
```

## Workspace Catalog Management

### **Catalog Pattern Benefits**

1. **Consistent versions** across all packages
2. **Single source of truth** for dependency versions
3. **Simplified updates** - change in one place
4. **Security enforcement** via workspace policies

### **Adding to Catalog**

```yaml
# In pnpm-workspace.yaml
catalog:
  # Use exact versions for stability
  package-name: 1.2.3
  
  # Use ^ for minor updates
  another-package: ^2.0.0
```

### **Using Catalog in package.json**

```json
{
  "dependencies": {
    "package-name": "catalog:"
  }
}
```

## Security Considerations

### **Version Pinning Strategy**

| Scenario | Strategy | Example |
|----------|----------|---------|
| Core framework | Exact version | `react: 19.1.0` |
| Security libraries | Exact version | `argon2: 0.40.1` |
| Utility libraries | Caret range | `date-fns: ^3.0.0` |
| Type definitions | Caret range | `@types/node: ^20.0.0` |

### **Audit Schedule**

```bash
# Weekly security audit
pnpm audit

# Monthly outdated check
pnpm outdated

# Quarterly deep audit
npx depcheck
pnpm licenses list
```

## Dependency Decision Framework

### **When to Add a Dependency**

✅ **Yes**:
- Solves a complex problem (e.g., password hashing with Argon2)
- Well-maintained with active community
- Tree-shakeable and small bundle size
- Used in multiple packages (add to catalog)

❌ **No**:
- Can be implemented in <50 lines of code
- Used in only one place with simple usage
- Last updated >2 years ago
- Has known security vulnerabilities

### **Bundle Size Analysis**

```bash
# Analyze bundle size impact
pnpm --filter @workspace/apex-os build
npx bundlesize

# Check specific package size
npx package-size react-hook-form
```

## Documentation Requirements

After auditing, document decisions:

**File**: `docs/dependencies.md`

```markdown
# Dependency Decisions

## Removed Dependencies
- **cookie-parser**: Never imported, Express has built-in cookie parsing
- **next-themes**: No theme switching requirement in current scope
- **react-day-picker**: Date picker not used in any page
- **react-resizable-panels**: No resizable panel UI planned
- **vaul**: Duplicate of shadcn/ui Drawer component

## Pinned Versions
- **zod**: Pinned to 3.23.8 for drizzle-zod compatibility
- **drizzle-orm**: Pinned to 0.45.2 for stability

## Kept Dependencies (Future Use)
- **react-hook-form**: Will be used in Phase 5 form validation
- **@hookform/resolvers**: Paired with react-hook-form for Zod
- **embla-carousel-react**: Potential marketing page usage

## Security Notes
- All packages use exact or caret-pinned versions
- Weekly `pnpm audit` runs in CI
- No native modules in frontend packages
```

## Verification Checklist

- [ ] All unused dependencies removed
- [ ] Critical versions pinned (zod, argon2, etc.)
- [ ] New dependencies added to workspace catalog
- [ ] `pnpm install --frozen-lockfile` succeeds
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` succeeds
- [ ] No peer dependency warnings
- [ ] `pnpm audit` shows no high/critical vulnerabilities
- [ ] Documentation updated with dependency decisions

## Anti-Patterns

❌ **Floating major versions**:
```json
{
  "dependencies": {
    "package": "^1.0.0"  // Risky, allows breaking changes
  }
}
```

❌ **Mixed version strategies**:
```yaml
# Inconsistent in catalog
catalog:
  pkg-a: 1.0.0  # Exact
  pkg-b: ^2.0.0  # Caret
  pkg-c: ~3.0.0  # Tilde - avoid this
```

❌ **Installing without catalog**:
```bash
# Don't bypass catalog
pnpm add some-package  # Wrong

# Use catalog instead
pnpm add some-package@catalog:  # Correct
```

## Commands Reference

```bash
# Audit and maintenance
pnpm audit                    # Security vulnerabilities
pnpm outdated                 # Outdated packages
pnpm list --depth=0          # Top-level dependencies
npx depcheck                 # Find unused dependencies
pnpm licenses list           # License compliance

# Modifying dependencies
pnpm --filter <workspace> add <package>
pnpm --filter <workspace> remove <package>
pnpm --filter <workspace> update <package>

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile
```

---

## document-version-management

**Description:** Implement document versioning system with version bump on file upload, version history tracking, and expose GET /documents/{id}/versions endpoint.

# Document Version Management Implementation

## Overview

This skill guides the implementation of a comprehensive document versioning system that automatically increments version numbers on file uploads, maintains complete version history, and provides access to all document versions through API endpoints.

## Core Architecture

### 1. Database Schema Design

#### Documents Table (Enhanced)
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  folder_id UUID REFERENCES document_folders(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(50) NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  latest_version_id UUID, -- References the latest version in document_versions
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_name ON documents(name);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
```

#### Document Versions Table
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
  mime_type VARCHAR(100) NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  change_description TEXT,
  is_latest BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  storage_provider VARCHAR(50) DEFAULT 'local', -- 'local', 's3', 'r2', etc.
  storage_metadata JSONB, -- Provider-specific metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_document_versions_unique ON document_versions(document_id, version_number);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_latest ON document_versions(document_id, is_latest);
CREATE INDEX idx_document_versions_hash ON document_versions(file_hash);
CREATE INDEX idx_document_versions_tenant ON document_versions(tenant_id);
```

#### Document Version Access Log Table
```sql
CREATE TABLE document_version_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES portal_clients(id), -- For portal access
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'preview')),
  ip_address INET,
  user_agent TEXT,
  access_date TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_document_access_log_document ON document_version_access_log(document_id);
CREATE INDEX idx_document_access_log_version ON document_version_access_log(version_id);
CREATE INDEX idx_document_access_log_date ON document_version_access_log(access_date);
CREATE INDEX idx_document_access_log_tenant ON document_version_access_log(tenant_id);
```

### 2. Document Version Service

```typescript
// src/services/DocumentVersionService.ts
import { Database } from 'drizzle-orm';
import { documents, documentVersions, documentVersionAccessLog } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import { DocumentNotFoundError, VersionConflictError } from '../domain/errors';
import { StorageService } from './StorageService';

export interface CreateDocumentRequest {
  name: string;
  description?: string;
  folderId?: string;
  file: FileUpload;
  changeDescription?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  name?: string;
  description?: string;
  file?: FileUpload;
  changeDescription?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  uploadedBy: string;
  changeDescription?: string;
  isLatest: boolean;
  downloadCount: number;
}

export class DocumentVersionService {
  constructor(
    private db: Database,
    private storageService: StorageService
  ) {}

  /**
   * Create a new document with initial version
   */
  async createDocument(
    request: CreateDocumentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Calculate file hash
      const fileHash = this.calculateFileHash(request.file.buffer);

      // Check for duplicate files (same hash)
      const existingVersion = await tx
        .select()
        .from(documentVersions)
        .where(and(
          eq(documentVersions.tenant_id, tenantId),
          eq(documentVersions.file_hash, fileHash)
        ))
        .limit(1);

      if (existingVersion[0]) {
        throw new VersionConflictError('A document with identical content already exists');
      }

      // Create document record
      const document = await tx.insert(documents).values({
        tenantId,
        folderId: request.folderId,
        name: request.name,
        description: request.description,
        fileType: this.getFileType(request.file.originalName),
        currentVersion: 1,
        tags: request.tags || [],
        metadata: request.metadata || {},
        createdBy
      }).returning();

      const createdDocument = document[0];

      // Upload file to storage
      const filePath = await this.storageService.uploadFile(
        tenantId,
        createdDocument.id,
        1,
        request.file.buffer,
        request.file.originalName
      );

      // Create initial version
      const version = await tx.insert(documentVersions).values({
        tenantId,
        documentId: createdDocument.id,
        versionNumber: 1,
        filePath,
        fileSize: request.file.size,
        fileHash,
        mimeType: request.file.mimeType,
        uploadedBy: createdBy,
        changeDescription: request.changeDescription || 'Initial version',
        isLatest: true,
        storageMetadata: await this.storageService.getFileMetadata(filePath)
      }).returning();

      const createdVersion = version[0];

      // Update document with latest version reference
      await tx.update(documents)
        .set({
          latestVersionId: createdVersion.id,
          updatedAt: new Date()
        })
        .where(eq(documents.id, createdDocument.id));

      // Emit domain event
      await this.emitEvent('DocumentCreated', {
        documentId: createdDocument.id,
        versionId: createdVersion.id,
        versionNumber: 1,
        createdBy
      });

      return createdDocument;
    });
  }

  /**
   * Update document with new version
   */
  async updateDocument(
    documentId: string,
    request: UpdateDocumentRequest,
    tenantId: string,
    updatedBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Get current document
      const document = await tx
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId),
          eq(documents.is_active, true)
        ))
        .limit(1);

      if (!document[0]) {
        throw new DocumentNotFoundError('Document not found');
      }

      const currentDocument = document[0];
      let newVersionNumber = currentDocument.current_version;

      // If new file is provided, create new version
      if (request.file) {
        // Calculate file hash
        const fileHash = this.calculateFileHash(request.file.buffer);

        // Check if this is actually a new version (different content)
        const latestVersion = await tx
          .select()
          .from(documentVersions)
          .where(and(
            eq(documentVersions.document_id, documentId),
            eq(documentVersions.is_latest, true)
          ))
          .limit(1);

        if (latestVersion[0] && latestVersion[0].file_hash === fileHash) {
          throw new VersionConflictError('New version has identical content to current version');
        }

        newVersionNumber = currentDocument.current_version + 1;

        // Upload new file to storage
        const filePath = await this.storageService.uploadFile(
          tenantId,
          documentId,
          newVersionNumber,
          request.file.buffer,
          request.file.originalName
        );

        // Mark previous version as not latest
        await tx.update(documentVersions)
          .set({
            isLatest: false
          })
          .where(and(
            eq(documentVersions.document_id, documentId),
            eq(documentVersions.is_latest, true)
          ));

        // Create new version
        const newVersion = await tx.insert(documentVersions).values({
          tenantId,
          documentId,
          versionNumber: newVersionNumber,
          filePath,
          fileSize: request.file.size,
          fileHash,
          mimeType: request.file.mimeType,
          uploadedBy: updatedBy,
          changeDescription: request.changeDescription || `Version ${newVersionNumber}`,
          isLatest: true,
          storageMetadata: await this.storageService.getFileMetadata(filePath)
        }).returning();

        // Emit domain event
        await this.emitEvent('DocumentVersionCreated', {
          documentId,
          versionId: newVersion[0].id,
          versionNumber: newVersionNumber,
          previousVersionNumber: currentDocument.current_version,
          updatedBy
        });
      }

      // Update document metadata
      const updatedDocument = await tx.update(documents)
        .set({
          name: request.name || currentDocument.name,
          description: request.description !== undefined ? request.description : currentDocument.description,
          currentVersion: newVersionNumber,
          tags: request.tags || currentDocument.tags,
          metadata: request.metadata || currentDocument.metadata,
          updatedBy,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))
        .returning();

      return updatedDocument[0];
    });
  }

  /**
   * Get all versions of a document
   */
  async getDocumentVersions(
    documentId: string,
    tenantId: string
  ): Promise<DocumentVersion[]> {
    const versions = await this.db
      .select({
        id: documentVersions.id,
        documentId: documentVersions.document_id,
        versionNumber: documentVersions.version_number,
        fileName: sql<string>`COALESCE(${documents.name}, 'Untitled') || ' v' || ${documentVersions.version_number}`,
        fileSize: documentVersions.file_size,
        mimeType: documentVersions.mime_type,
        uploadDate: documentVersions.upload_date,
        uploadedBy: documentVersions.uploaded_by,
        changeDescription: documentVersions.change_description,
        isLatest: documentVersions.is_latest,
        downloadCount: documentVersions.download_count
      })
      .from(documentVersions)
      .leftJoin(documents, eq(documentVersions.document_id, documents.id))
      .where(and(
        eq(documentVersions.document_id, documentId),
        eq(documentVersions.tenant_id, tenantId)
      ))
      .orderBy(desc(documentVersions.version_number));

    return versions.map(v => ({
      id: v.id,
      documentId: v.documentId,
      versionNumber: v.versionNumber,
      fileName: v.fileName,
      fileSize: v.fileSize,
      mimeType: v.mimeType,
      uploadDate: v.uploadDate,
      uploadedBy: v.uploadedBy,
      changeDescription: v.changeDescription,
      isLatest: v.isLatest,
      downloadCount: v.downloadCount
    }));
  }

  /**
   * Get specific version of a document
   */
  async getDocumentVersion(
    documentId: string,
    versionNumber: number,
    tenantId: string
  ): Promise<DocumentVersion | null> {
    const version = await this.db
      .select({
        id: documentVersions.id,
        documentId: documentVersions.document_id,
        versionNumber: documentVersions.version_number,
        fileName: sql<string>`COALESCE(${documents.name}, 'Untitled') || ' v' || ${documentVersions.version_number}`,
        fileSize: documentVersions.file_size,
        mimeType: documentVersions.mime_type,
        uploadDate: documentVersions.upload_date,
        uploadedBy: documentVersions.uploaded_by,
        changeDescription: documentVersions.change_description,
        isLatest: documentVersions.is_latest,
        downloadCount: documentVersions.download_count
      })
      .from(documentVersions)
      .leftJoin(documents, eq(documentVersions.document_id, documents.id))
      .where(and(
        eq(documentVersions.document_id, documentId),
        eq(documentVersions.version_number, versionNumber),
        eq(documentVersions.tenant_id, tenantId)
      ))
      .limit(1);

    return version[0] ? {
      id: version[0].id,
      documentId: version[0].documentId,
      versionNumber: version[0].versionNumber,
      fileName: version[0].fileName,
      fileSize: version[0].fileSize,
      mimeType: version[0].mime_type,
      uploadDate: version[0].upload_date,
      uploadedBy: version[0].uploadedBy,
      changeDescription: version[0].changeDescription,
      isLatest: version[0].is_latest,
      downloadCount: version[0].downloadCount
    } : null;
  }

  /**
   * Download a specific version of a document
   */
  async downloadDocumentVersion(
    documentId: string,
    versionNumber: number,
    tenantId: string,
    userId?: string,
    clientId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ stream: NodeJS.ReadableStream; fileName: string; mimeType: string }> {
    const version = await this.getDocumentVersion(documentId, versionNumber, tenantId);

    if (!version) {
      throw new DocumentNotFoundError('Document version not found');
    }

    // Get file from storage
    const fileStream = await this.storageService.getFileStream(version.id);

    // Log access
    await this.logVersionAccess({
      tenantId,
      documentId,
      versionId: version.id,
      userId,
      clientId,
      accessType: 'download',
      ipAddress,
      userAgent
    });

    // Increment download count
    await this.db.update(documentVersions)
      .set({
        downloadCount: sql`${documentVersions.download_count} + 1`
      })
      .where(eq(documentVersions.id, version.id));

    return {
      stream: fileStream,
      fileName: version.fileName,
      mimeType: version.mimeType
    };
  }

  /**
   * Soft delete a document (mark as inactive, delete all versions)
   */
  async deleteDocument(
    documentId: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get document
      const document = await tx
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId),
          eq(documents.is_active, true)
        ))
        .limit(1);

      if (!document[0]) {
        throw new DocumentNotFoundError('Document not found');
      }

      // Mark document as inactive
      await tx.update(documents)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: deletedBy
        })
        .where(eq(documents.id, documentId));

      // Get all versions to delete from storage
      const versions = await tx
        .select({ filePath: documentVersions.file_path })
        .from(documentVersions)
        .where(eq(documentVersions.document_id, documentId));

      // Delete files from storage
      for (const version of versions) {
        await this.storageService.deleteFile(version.filePath);
      }

      // Delete version records
      await tx.delete(documentVersions)
        .where(eq(documentVersions.document_id, documentId));

      // Emit domain event
      await this.emitEvent('DocumentDeleted', {
        documentId,
        deletedBy,
        versionCount: versions.length
      });
    });
  }

  /**
   * Restore a document version (create new document from version)
   */
  async restoreDocumentVersion(
    versionId: string,
    newName: string,
    tenantId: string,
    restoredBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Get version details
      const version = await tx
        .select({
          documentId: documentVersions.document_id,
          versionNumber: documentVersions.version_number,
          filePath: documentVersions.file_path,
          fileSize: documentVersions.file_size,
          fileHash: documentVersions.file_hash,
          mimeType: documentVersions.mime_type,
          originalDocument: sql<any>`
            (
              SELECT ${documents}
              FROM ${documents}
              WHERE ${documents.id} = ${documentVersions.document_id}
            )
          `
        })
        .from(documentVersions)
        .where(and(
          eq(documentVersions.id, versionId),
          eq(documentVersions.tenant_id, tenantId)
        ))
        .limit(1);

      if (!version[0]) {
        throw new DocumentNotFoundError('Document version not found');
      }

      // Create new document
      const newDocument = await tx.insert(documents).values({
        tenantId,
        name: newName,
        description: `Restored from version ${version[0].versionNumber}`,
        fileType: this.getFileTypeFromMimeType(version[0].mimeType),
        currentVersion: 1,
        tags: version[0].originalDocument?.tags || [],
        metadata: {
          restoredFrom: {
            documentId: version[0].documentId,
            versionId: versionId,
            versionNumber: version[0].versionNumber,
            restoredAt: new Date(),
            restoredBy
          }
        },
        createdBy: restoredBy
      }).returning();

      const createdDocument = newDocument[0];

      // Copy file in storage
      const newFilePath = await this.storageService.copyFile(
        version[0].filePath,
        tenantId,
        createdDocument.id,
        1
      );

      // Create new version
      const newVersion = await tx.insert(documentVersions).values({
        tenantId,
        documentId: createdDocument.id,
        versionNumber: 1,
        filePath: newFilePath,
        fileSize: version[0].fileSize,
        fileHash: version[0].fileHash,
        mimeType: version[0].mimeType,
        uploadedBy: restoredBy,
        changeDescription: `Restored from document ${version[0].documentId} version ${version[0].versionNumber}`,
        isLatest: true,
        storageMetadata: await this.storageService.getFileMetadata(newFilePath)
      }).returning();

      // Update document with latest version reference
      await tx.update(documents)
        .set({
          latestVersionId: newVersion[0].id,
          updatedAt: new Date()
        })
        .where(eq(documents.id, createdDocument.id));

      return createdDocument;
    });
  }

  /**
   * Calculate SHA-256 hash of file buffer
   */
  private calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  /**
   * Get file type from MIME type
   */
  private getFileTypeFromMimeType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif'
    };

    return typeMap[mimeType] || 'unknown';
  }

  /**
   * Log version access
   */
  private async logVersionAccess(logData: {
    tenantId: string;
    documentId: string;
    versionId: string;
    userId?: string;
    clientId?: string;
    accessType: 'view' | 'download' | 'preview';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.db.insert(documentVersionAccessLog).values({
      tenantId: logData.tenantId,
      documentId: logData.documentId,
      versionId: logData.versionId,
      userId: logData.userId,
      clientId: logData.clientId,
      accessType: logData.accessType,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent
    });
  }

  /**
   * Emit domain events
   */
  private async emitEvent(eventName: string, data: any): Promise<void> {
    // Implementation depends on your event system
    console.log(`Emitting event: ${eventName}`, data);
  }
}
```

### 3. API Endpoints

```typescript
// src/routes/documents.ts
import { Router } from 'express';
import { DocumentVersionService } from '../services/DocumentVersionService';
import { validateRequest } from '../middleware/validation';
import { createDocumentSchema, updateDocumentSchema } from '../schemas/documents';

const router = Router();

// POST /api/documents - Create document with version
router.post('/', validateRequest(createDocumentSchema), async (req, res, next) => {
  try {
    const document = await documentVersionService.createDocument(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

// PUT /api/documents/:id - Update document with new version
router.put('/:id', validateRequest(updateDocumentSchema), async (req, res, next) => {
  try {
    const document = await documentVersionService.updateDocument(
      req.params.id,
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.json({ document });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/versions - Get all versions of a document
router.get('/:id/versions', async (req, res, next) => {
  try {
    const versions = await documentVersionService.getDocumentVersions(
      req.params.id,
      req.tenant.id
    );

    res.json({ versions });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/versions/:version - Get specific version
router.get('/:id/versions/:version', async (req, res, next) => {
  try {
    const version = await documentVersionService.getDocumentVersion(
      req.params.id,
      parseInt(req.params.version),
      req.tenant.id
    );

    if (!version) {
      return res.status(404).json({ error: 'Document version not found' });
    }

    res.json({ version });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/versions/:version/download - Download specific version
router.get('/:id/versions/:version/download', async (req, res, next) => {
  try {
    const { stream, fileName, mimeType } = await documentVersionService.downloadDocumentVersion(
      req.params.id,
      parseInt(req.params.version),
      req.tenant.id,
      req.user?.id,
      req.portalClient?.id,
      req.ip,
      req.get('User-Agent')
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// POST /api/documents/versions/:version/restore - Restore document from version
router.post('/versions/:versionId/restore', async (req, res, next) => {
  try {
    const document = await documentVersionService.restoreDocumentVersion(
      req.params.versionId,
      req.body.name,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id - Delete document and all versions
router.delete('/:id', async (req, res, next) => {
  try {
    await documentVersionService.deleteDocument(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Create document versioning database schema
- [ ] Implement DocumentVersionService with all core methods
- [ ] Add file hash calculation for duplicate detection
- [ ] Implement storage service integration
- [ ] Create version access logging
- [ ] Add document restoration functionality
- [ ] Create API endpoints for version management
- [ ] Add comprehensive error handling
- [ ] Implement file type detection
- [ ] Add audit logging for version changes
- [ ] Create integration tests for all scenarios
- [ ] Add monitoring for version operations

## Testing Requirements

### Unit Tests
- Test version creation and increment logic
- Test file hash calculation and duplicate detection
- Test version access logging
- Test document restoration

### Integration Tests
- Test end-to-end document versioning
- Test file upload and storage integration
- Test version download functionality
- Test concurrent version creation

### Edge Cases
- Test duplicate file upload handling
- Test storage failure scenarios
- Test version restoration with conflicts
- Test access control for different user types

## Security Considerations

- File hash verification prevents duplicate uploads
- Access logging for audit trails
- Proper authorization checks for all operations
- File type validation and malware scanning
- Tenant isolation enforced at database level
- Secure file storage with proper permissions

## Performance Optimizations

- Efficient file hash calculation
- Storage provider optimization
- Database indexes on version queries
- Streaming for large file downloads
- Caching for frequently accessed metadata

## Monitoring

- Track version creation success rates
- Monitor storage usage and performance
- Alert on duplicate file detection
- Track download patterns and access
- Monitor file upload processing times

---

## domain-event-bus

**Description:** Implement in-process domain event bus for decoupled communication between bounded contexts with type-safe event publishing and subscription

# Domain Event Bus Implementation

This skill guides you through implementing an in-process domain event bus that enables decoupled communication between bounded contexts, supports audit logging, and maintains type safety across event publishers and subscribers.

## Current State Assessment

**Current State**: No event system exists - domain events cannot be published or subscribed to.

**Missing Infrastructure**:
- No event bus for decoupled communication
- No audit trail for significant state changes
- No mechanism for cross-context notifications
- No type-safe event definitions

## Event Bus Architecture

### **Pattern Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Bounded Context A                           │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │   Service    │────►│  Event Bus   │                         │
│  │              │     │              │                         │
│  │  publishes   │     │  - Store     │                         │
│  │  LeadCreated │     │  - Route     │                         │
│  └──────────────┘     └──────┬───────┘                         │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Bounded Context B                           │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │  Subscriber  │◄────│  Event Bus   │                         │
│  │              │     │              │                         │
│  │  handles     │     │  - Deliver   │                         │
│  │  LeadCreated │     │  - Audit     │                         │
│  └──────────────┘     └──────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### **Event Flow**

1. **Domain Event Created** - When aggregate state changes significantly
2. **Event Published** - Service publishes event to bus
3. **Subscribers Notified** - Bus routes to interested handlers
4. **Handlers Execute** - Subscribers react to event (in-process)
5. **Audit Logged** - Event recorded for compliance

## Step-by-Step Implementation

### **Step 1: Create Domain Event Base Class**

**File**: `artifacts/api-server/src/lib/events/domain-event.ts`

```typescript
import { randomUUID } from 'crypto';

/**
 * Base class for all domain events
 * Events represent significant state changes in the domain
 */
export abstract class DomainEvent {
  /**
   * Unique event ID for idempotency and tracking
   */
  readonly id: string;
  
  /**
   * Event type identifier (used for routing)
   */
  abstract readonly type: string;
  
  /**
   * ID of the aggregate that emitted the event
   */
  readonly aggregateId: string;
  
  /**
   * Timestamp when event occurred
   */
  readonly timestamp: Date;
  
  /**
   * Organization/tenant ID for multi-tenancy
   */
  readonly organizationId: string;
  
  /**
   * User who triggered the event
   */
  readonly triggeredBy?: string;
  
  /**
   * Event version for schema evolution
   */
  readonly version: number = 1;

  constructor(
    aggregateId: string,
    organizationId: string,
    options?: {
      triggeredBy?: string;
      version?: number;
    }
  ) {
    this.id = randomUUID();
    this.aggregateId = aggregateId;
    this.organizationId = organizationId;
    this.timestamp = new Date();
    this.triggeredBy = options?.triggeredBy;
    if (options?.version) {
      this.version = options.version;
    }
  }

  /**
   * Serialize to plain object for storage/transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      aggregateId: this.aggregateId,
      timestamp: this.timestamp.toISOString(),
      organizationId: this.organizationId,
      triggeredBy: this.triggeredBy,
      version: this.version,
    };
  }
}

/**
 * Type helper to extract event type from event class
 */
export type EventType<T extends DomainEvent> = T['type'];
```

### **Step 2: Define Concrete Domain Events**

**File**: `artifacts/api-server/src/lib/events/events.ts`

```typescript
import { DomainEvent } from './domain-event';

// ==================== Identity & Access Events ====================

export class UserCreated extends DomainEvent {
  readonly type = 'UserCreated';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly email: string,
    public readonly role: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class UserRoleChanged extends DomainEvent {
  readonly type = 'UserRoleChanged';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== CRM Events ====================

export class LeadCreated extends DomainEvent {
  readonly type = 'LeadCreated';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly title: string,
    public readonly email: string,
    public readonly source?: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class LeadStageChanged extends DomainEvent {
  readonly type = 'LeadStageChanged';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly oldStage: string,
    public readonly newStage: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class DealWon extends DomainEvent {
  readonly type = 'DealWon';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly value: number,
    public readonly contactId: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Project Events ====================

export class TaskCompleted extends DomainEvent {
  readonly type = 'TaskCompleted';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly projectId: string,
    public readonly completedBy: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class ProjectMilestoneReached extends DomainEvent {
  readonly type = 'ProjectMilestoneReached';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly milestoneName: string,
    public readonly projectId: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Finance Events ====================

export class InvoicePaid extends DomainEvent {
  readonly type = 'InvoicePaid';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly amount: number,
    public readonly paidBy: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class PaymentRecorded extends DomainEvent {
  readonly type = 'PaymentRecorded';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly amount: number,
    public readonly method: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Appointment Events ====================

export class AppointmentBooked extends DomainEvent {
  readonly type = 'AppointmentBooked';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly clientEmail: string,
    public readonly startTime: Date,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Document Events ====================

export class DocumentSigned extends DomainEvent {
  readonly type = 'DocumentSigned';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly documentName: string,
    public readonly signedBy: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Event Union Type ====================

export type DomainEvents =
  | UserCreated
  | UserRoleChanged
  | LeadCreated
  | LeadStageChanged
  | DealWon
  | TaskCompleted
  | ProjectMilestoneReached
  | InvoicePaid
  | PaymentRecorded
  | AppointmentBooked
  | DocumentSigned;
```

### **Step 3: Implement Event Bus**

**File**: `artifacts/api-server/src/lib/events/event-bus.ts`

```typescript
import { DomainEvent, DomainEvents } from './events';
import { logger } from '../logger';

/**
 * Event handler function type
 */
type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>;

/**
 * Event subscription structure
 */
interface Subscription<T extends DomainEvent = DomainEvent> {
  id: string;
  handler: EventHandler<T>;
  once: boolean;
}

/**
 * In-process event bus for domain event communication
 * 
 * Features:
 * - Type-safe publishing and subscription
 * - Synchronous in-process delivery
 * - Error isolation (one handler failure doesn't affect others)
 * - Automatic audit logging
 */
export class EventBus {
  private handlers: Map<string, Subscription[]> = new Map();
  private auditHandler?: (event: DomainEvent) => void | Promise<void>;

  /**
   * Set up audit handler for compliance/logging
   */
  setAuditHandler(handler: (event: DomainEvent) => void | Promise<void>): void {
    this.auditHandler = handler;
  }

  /**
   * Subscribe to events of a specific type
   * @returns Unsubscribe function
   */
  subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    options: { once?: boolean } = {}
  ): () => void {
    const subscription: Subscription = {
      id: `${eventType}-${Date.now()}-${Math.random()}`,
      handler: handler as EventHandler<DomainEvent>,
      once: options.once ?? false,
    };

    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, subscription]);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType) || [];
      this.handlers.set(
        eventType,
        handlers.filter((h) => h.id !== subscription.id)
      );
    };
  }

  /**
   * Subscribe to a single event, then auto-unsubscribe
   */
  once<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): void {
    this.subscribe(eventType, handler, { once: true });
  }

  /**
   * Publish an event to all subscribers
   * Handlers are called synchronously in order
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.type;
    const handlers = this.handlers.get(eventType) || [];

    logger.debug(
      { eventType, eventId: event.id, handlerCount: handlers.length },
      'Publishing event'
    );

    // Call audit handler
    if (this.auditHandler) {
      try {
        await this.auditHandler(event);
      } catch (error) {
        // Audit failure shouldn't stop event processing
        logger.error({ error, event }, 'Audit handler failed');
      }
    }

    // Call each handler with error isolation
    const toRemove: string[] = [];

    for (const subscription of handlers) {
      try {
        await subscription.handler(event);

        // Mark once handlers for removal
        if (subscription.once) {
          toRemove.push(subscription.id);
        }
      } catch (error) {
        // Log error but don't stop other handlers
        logger.error(
          { error, eventType, eventId: event.id, handlerId: subscription.id },
          'Event handler failed'
        );

        // Mark once handlers for removal even if they failed
        if (subscription.once) {
          toRemove.push(subscription.id);
        }
      }
    }

    // Clean up once handlers
    if (toRemove.length > 0) {
      this.handlers.set(
        eventType,
        handlers.filter((h) => !toRemove.includes(h.id))
      );
    }
  }

  /**
   * Get count of handlers for an event type (useful for testing)
   */
  handlerCount(eventType: string): number {
    return (this.handlers.get(eventType) || []).length;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance for the application
export const eventBus = new EventBus();
```

### **Step 4: Create Audit Subscriber**

**File**: `artifacts/api-server/src/lib/events/audit-subscriber.ts`

```typescript
import { DomainEvent } from './domain-event';
import { logger } from '../logger';

/**
 * Audit subscriber that logs all domain events
 * In production, this would write to audit_logs table
 */
export async function auditSubscriber(event: DomainEvent): Promise<void> {
  const auditEntry = {
    eventId: event.id,
    eventType: event.type,
    aggregateId: event.aggregateId,
    organizationId: event.organizationId,
    triggeredBy: event.triggeredBy,
    timestamp: event.timestamp,
    data: event.toJSON(),
  };

  // Log to structured logger
  logger.info(auditEntry, `Domain event: ${event.type}`);

  // TODO: In Phase 2, persist to audit_logs table
  // await db.insert(auditLogsTable).values({
  //   id: randomUUID(),
  //   ...auditEntry,
  //   createdAt: new Date(),
  // });
}
```

### **Step 5: Integration with Services**

**File**: `artifacts/api-server/src/services/crm.ts`

```typescript
import { eventBus } from '../lib/events/event-bus';
import { LeadCreated, LeadStageChanged, DealWon } from '../lib/events/events';
import { contactRepository } from '@workspace/db/repositories';
import { Result, ok, err } from 'neverthrow';

export class CRMService {
  async createLead(
    data: CreateLeadInput,
    organizationId: string,
    userId: string
  ): Promise<Result<Lead, DomainError>> {
    // ... validation and creation logic

    const lead = await contactRepository.create({
      ...data,
      stage: 'new',
    }, organizationId);

    // Publish domain event
    await eventBus.publish(
      new LeadCreated(
        lead.id,
        organizationId,
        lead.title,
        lead.email,
        lead.source,
        userId
      )
    );

    return ok(this.toDomainModel(lead));
  }

  async moveLeadStage(
    leadId: string,
    newStage: LeadStage,
    organizationId: string,
    userId: string
  ): Promise<Result<Lead, DomainError>> {
    const lead = await this.getLead(leadId, organizationId);
    if (lead.isErr()) return lead;

    const oldStage = lead.value.stage;

    // Update stage
    const updated = await contactRepository.update(
      leadId,
      { stage: newStage },
      organizationId
    );

    // Publish stage change event
    await eventBus.publish(
      new LeadStageChanged(
        leadId,
        organizationId,
        oldStage,
        newStage,
        userId
      )
    );

    // If won, publish deal won event
    if (newStage === 'closed_won') {
      await eventBus.publish(
        new DealWon(
          leadId,
          organizationId,
          lead.value.value || 0,
          lead.value.contactId,
          userId
        )
      );
    }

    return ok(this.toDomainModel(updated!));
  }
}
```

### **Step 6: Cross-Context Subscribers**

**File**: `artifacts/api-server/src/subscribers/analytics-subscriber.ts`

```typescript
import { eventBus } from '../lib/events/event-bus';
import { 
  LeadCreated, 
  DealWon, 
  InvoicePaid,
  TaskCompleted 
} from '../lib/events/events';
import { logger } from '../lib/logger';

/**
 * Analytics subscribers
 * React to events across contexts for reporting
 */
export function setupAnalyticsSubscribers(): void {
  // Track new leads for dashboard
  eventBus.subscribe('LeadCreated', async (event: LeadCreated) => {
    logger.info(
      { leadId: event.aggregateId, organizationId: event.organizationId },
      'Analytics: Lead created - updating metrics'
    );
    
    // TODO: Update real-time analytics
    // await analyticsService.incrementLeadCount(event.organizationId);
  });

  // Track won deals for revenue reporting
  eventBus.subscribe('DealWon', async (event: DealWon) => {
    logger.info(
      { dealId: event.aggregateId, value: event.value },
      'Analytics: Deal won - updating revenue'
    );
    
    // TODO: Update revenue metrics
    // await analyticsService.addRevenue(event.organizationId, event.value);
  });

  // Track payments for cash flow
  eventBus.subscribe('InvoicePaid', async (event: InvoicePaid) => {
    logger.info(
      { invoiceId: event.aggregateId, amount: event.amount },
      'Analytics: Payment received'
    );
    
    // TODO: Update cash flow metrics
    // await analyticsService.recordPayment(event.organizationId, event.amount);
  });

  // Track project velocity
  eventBus.subscribe('TaskCompleted', async (event: TaskCompleted) => {
    logger.info(
      { taskId: event.aggregateId, projectId: event.projectId },
      'Analytics: Task completed'
    );
    
    // TODO: Update project velocity
    // await analyticsService.recordTaskCompletion(event.projectId);
  });
}
```

**File**: `artifacts/api-server/src/subscribers/notification-subscriber.ts`

```typescript
import { eventBus } from '../lib/events/event-bus';
import { 
  LeadStageChanged,
  AppointmentBooked,
  DocumentSigned 
} from '../lib/events/events';
import { logger } from '../lib/logger';

/**
 * Notification subscribers
 * Send notifications when significant events occur
 */
export function setupNotificationSubscribers(): void {
  // Notify on lead stage changes
  eventBus.subscribe('LeadStageChanged', async (event: LeadStageChanged) => {
    logger.info(
      { 
        leadId: event.aggregateId, 
        from: event.oldStage, 
        to: event.newStage 
      },
      'Notification: Lead stage changed'
    );
    
    // TODO: Send notifications
    // await notificationService.send({
    //   type: 'lead_stage_changed',
    //   recipient: 'sales-team',
    //   data: { leadId: event.aggregateId, newStage: event.newStage },
    // });
  });

  // Notify on appointment bookings
  eventBus.subscribe('AppointmentBooked', async (event: AppointmentBooked) => {
    logger.info(
      { clientEmail: event.clientEmail, startTime: event.startTime },
      'Notification: New appointment booked'
    );
    
    // TODO: Send confirmation email
    // await emailService.sendAppointmentConfirmation({
    //   to: event.clientEmail,
    //   appointmentTime: event.startTime,
    // });
  });

  // Notify on document signatures
  eventBus.subscribe('DocumentSigned', async (event: DocumentSigned) => {
    logger.info(
      { documentName: event.documentName, signedBy: event.signedBy },
      'Notification: Document signed'
    );
    
    // TODO: Send completion notification
    // await notificationService.sendDocumentCompleted({
    //   documentName: event.documentName,
    // });
  });
}
```

### **Step 7: Initialize Event Bus in App**

**File**: `artifacts/api-server/src/app.ts`

```typescript
import { app } from './app';
import { eventBus } from './lib/events/event-bus';
import { auditSubscriber } from './lib/events/audit-subscriber';
import { setupAnalyticsSubscribers } from './subscribers/analytics-subscriber';
import { setupNotificationSubscribers } from './subscribers/notification-subscriber';

// Set up audit logging
eventBus.setAuditHandler(auditSubscriber);

// Set up cross-context subscribers
setupAnalyticsSubscribers();
setupNotificationSubscribers();

// ... rest of app setup
```

### **Step 8: Event Bus Tests**

**File**: `artifacts/api-server/__tests__/lib/events/event-bus.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../../src/lib/events/event-bus';
import { DomainEvent } from '../../../src/lib/events/domain-event';

// Test event class
class TestEvent extends DomainEvent {
  readonly type = 'TestEvent';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly data: string
  ) {
    super(aggregateId, organizationId);
  }
}

class AnotherEvent extends DomainEvent {
  readonly type = 'AnotherEvent';
  
  constructor(aggregateId: string, organizationId: string) {
    super(aggregateId, organizationId);
  }
}

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should deliver events to subscribers', async () => {
    const handler = vi.fn();
    eventBus.subscribe('TestEvent', handler);

    const event = new TestEvent('agg-1', 'org-1', 'test-data');
    await eventBus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should deliver to multiple subscribers', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    eventBus.subscribe('TestEvent', handler1);
    eventBus.subscribe('TestEvent', handler2);

    const event = new TestEvent('agg-1', 'org-1', 'test-data');
    await eventBus.publish(event);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should not deliver to wrong event type subscribers', async () => {
    const testHandler = vi.fn();
    const anotherHandler = vi.fn();
    
    eventBus.subscribe('TestEvent', testHandler);
    eventBus.subscribe('AnotherEvent', anotherHandler);

    await eventBus.publish(new TestEvent('agg-1', 'org-1', 'test'));

    expect(testHandler).toHaveBeenCalled();
    expect(anotherHandler).not.toHaveBeenCalled();
  });

  it('should support once subscriptions', async () => {
    const handler = vi.fn();
    eventBus.once('TestEvent', handler);

    const event1 = new TestEvent('agg-1', 'org-1', 'data1');
    const event2 = new TestEvent('agg-2', 'org-1', 'data2');
    
    await eventBus.publish(event1);
    await eventBus.publish(event2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event1);
  });

  it('should support unsubscribing', async () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.subscribe('TestEvent', handler);

    await eventBus.publish(new TestEvent('agg-1', 'org-1', 'data'));
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    await eventBus.publish(new TestEvent('agg-2', 'org-1', 'data'));
    expect(handler).toHaveBeenCalledTimes(1); // Still 1
  });

  it('should isolate handler errors', async () => {
    const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const successHandler = vi.fn();
    
    eventBus.subscribe('TestEvent', errorHandler);
    eventBus.subscribe('TestEvent', successHandler);

    const event = new TestEvent('agg-1', 'org-1', 'data');
    
    // Should not throw
    await expect(eventBus.publish(event)).resolves.not.toThrow();
    
    // Both handlers should have been called
    expect(errorHandler).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });

  it('should call audit handler', async () => {
    const auditHandler = vi.fn();
    eventBus.setAuditHandler(auditHandler);

    const event = new TestEvent('agg-1', 'org-1', 'data');
    await eventBus.publish(event);

    expect(auditHandler).toHaveBeenCalledWith(event);
  });

  it('should continue if audit handler fails', async () => {
    const failingAudit = vi.fn().mockRejectedValue(new Error('Audit failed'));
    const eventHandler = vi.fn();
    
    eventBus.setAuditHandler(failingAudit);
    eventBus.subscribe('TestEvent', eventHandler);

    const event = new TestEvent('agg-1', 'org-1', 'data');
    
    // Should not throw
    await expect(eventBus.publish(event)).resolves.not.toThrow();
    
    // Event handler should still be called
    expect(eventHandler).toHaveBeenCalled();
  });
});
```

## Event Patterns

### **Event Publishing in Aggregates**

```typescript
class Lead {
  private events: DomainEvent[] = [];

  moveToStage(newStage: LeadStage, userId: string): void {
    const oldStage = this.stage;
    this.stage = newStage;
    
    // Record event
    this.events.push(
      new LeadStageChanged(
        this.id,
        this.organizationId,
        oldStage,
        newStage,
        userId
      )
    );
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}
```

### **Event Handler Best Practices**

```typescript
// Good: Idempotent handler
async function onLeadCreated(event: LeadCreated): Promise<void> {
  // Check if already processed
  const exists = await analyticsRepo.leadEventExists(event.id);
  if (exists) return;
  
  // Process
  await analyticsRepo.recordLead(event);
}

// Good: Async without blocking
async function onInvoicePaid(event: InvoicePaid): Promise<void> {
  // Don't wait for email to send
  emailService.sendReceipt(event).catch(err => {
    logger.error({ err, event }, 'Failed to send receipt');
  });
}

// Bad: Blocking synchronous work
async function onInvoicePaid(event: InvoicePaid): Promise<void> {
  await emailService.sendReceipt(event); // Blocks event processing
  await reportService.updateReports(event); // More blocking
}
```

## Verification Commands

```bash
# Test event bus
pnpm vitest run artifacts/api-server/__tests__/lib/events/

# Check event coverage
grep -r "eventBus.publish" artifacts/api-server/src/ | wc -l

# Verify subscriber setup
grep -r "eventBus.subscribe" artifacts/api-server/src/subscribers/
```

## Event Bus Benefits

1. **Decoupling**: Contexts don't depend on each other
2. **Extensibility**: New subscribers without changing publishers
3. **Audit Trail**: All significant changes logged
4. **Testing**: Easy to mock and verify events
5. **Performance**: In-process, no network overhead

## Future Enhancements (Post-MVP)

- **Outbox Pattern**: For reliable event delivery with transactions
- **Message Queue**: For distributed systems
- **Event Sourcing**: Full state reconstruction from events
- **Event Replay**: Reprocess events for recovery

---

## domain-glossary-management

**Description:** Create and maintain domain glossary with ubiquitous language for Domain-Driven Design implementation in Apex Unified Suite.

# Domain Glossary Management

## Purpose
Establish a shared vocabulary (ubiquitous language) that bridges business stakeholders, developers, and domain experts. This prevents ambiguity and ensures consistent terminology across the entire Apex Unified Suite codebase.

## When to Use This Skill
- Starting new bounded contexts or business modules
- Onboarding new team members
- During domain modeling sessions
- When terminology conflicts arise between teams
- Before implementing new business features

## Prerequisites
- Understanding of Domain-Driven Design principles
- Access to business stakeholders or product requirements
- Knowledge of the 10 business domains in Apex Unified Suite

## Implementation Steps

### 1. Set Up Glossary Structure
Create a central glossary file that organizes terms by bounded context:

```markdown
# Domain Glossary

## CRM Domain
- **Lead**: Potential customer who has shown interest but not yet converted
- **Contact**: Individual person or organization associated with leads/deals
- **Deal**: Opportunity in progress with potential revenue value
- **Engagement**: Any interaction with contacts (email, call, meeting)

## Projects Domain
- **Project**: Time-bound initiative with specific deliverables
- **Task**: Atomic unit of work within a project
- **Milestone**: Significant checkpoint in project timeline
- **Template**: Reusable project structure or task pattern

## Finance Domain
- **Invoice**: Formal request for payment for goods/services
- **Payment**: Monetary transaction settling an invoice
- **Expense**: Cost incurred by the organization
- **Budget**: Planned allocation of financial resources
```

### 2. Conduct Domain Discovery Workshops
Organize sessions with business stakeholders to:
- Identify key business terms and concepts
- Map term relationships and dependencies
- Resolve terminology conflicts
- Establish context boundaries

**Workshop Format:**
1. **Term Collection** (30 min): Brainstorm all domain terms
2. **Definition Refinement** (45 min): Write clear, unambiguous definitions
3. **Context Mapping** (30 min): Assign terms to bounded contexts
4. **Conflict Resolution** (15 min): Address overlapping or conflicting terms

### 3. Create Bounded Context Glossaries
Split the main glossary by bounded context:

```typescript
// src/domain/crm/glossary.ts
export const CRM_GLOSSARY = {
  LEAD: {
    definition: "Potential customer who has shown interest but not yet converted",
    attributes: ["status", "source", "value", "assignedTo"],
    examples: ["Website lead from contact form", "Referral from existing customer"]
  },
  CONTACT: {
    definition: "Individual person or organization associated with leads/deals",
    attributes: ["firstName", "lastName", "email", "phone", "company"],
    relationships: ["associatedWith", "employs"]
  }
} as const;

// Type definitions for type safety
export type Lead = typeof CRM_GLOSSARY.LEAD.definition;
export type ContactAttributes = typeof CRM_GLOSSARY.CONTACT.attributes;
```

### 4. Integrate with Code Generation
Update the OpenAPI specification to include domain terms:

```yaml
# lib/api-spec/openapi.yaml
components:
  schemas:
    Lead:
      type: object
      description: "${CRM_GLOSSARY.LEAD.definition}"
      properties:
        id:
          type: string
          description: "Unique identifier for the lead"
        status:
          type: string
          enum: [new, contacted, qualified, converted, lost]
          description: "Current status based on ${CRM_GLOSSARY.LEAD.definition} lifecycle"
```

### 5. Implement Validation Layer
Create Zod schemas that enforce domain terminology:

```typescript
// lib/api-zod/src/generated/crm-schemas.ts
import { z } from 'zod';

export const LeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  source: z.string().describe("Channel through which lead was acquired"),
  value: z.number().min(0).describe("Potential revenue value"),
}).describe(`Represents a ${CRM_GLOSSARY.LEAD.definition} in the system`);
```

### 6. Set Up Documentation Generation
Create automated glossary documentation:

```typescript
// scripts/generate-glossary-docs.ts
import { CRM_GLOSSARY, PROJECTS_GLOSSARY, FINANCE_GLOSSARY } from '../src/domain/glossaries';

export function generateGlossaryDocs() {
  const contexts = [
    { name: 'CRM', glossary: CRM_GLOSSARY },
    { name: 'Projects', glossary: PROJECTS_GLOSSARY },
    { name: 'Finance', glossary: FINANCE_GLOSSARY }
  ];

  return contexts.map(context => `
## ${context.name} Domain

${Object.entries(context.glossary).map(([term, definition]) => `
### ${term}
**Definition**: ${definition.definition}

**Attributes**: ${definition.attributes.join(', ')}

**Examples**: ${definition.examples.join(', '')}
`).join('\n')}
`).join('\n\n');
}
```

## Verification Steps

### 1. Review Glossary Completeness
```bash
# Check if all business domains have glossaries
find src/domain -name "glossary.ts" | wc -l
# Should return 10 (one for each business domain)
```

### 2. Validate Type Safety
```bash
pnpm run typecheck
# Ensure all glossary terms are properly typed
```

### 3. Test API Documentation
```bash
pnpm --filter @workspace/api-spec run codegen
# Verify glossary terms appear in generated OpenAPI docs
```

### 4. Review Team Understanding
Schedule review sessions with:
- Development team
- Product managers
- Business stakeholders

Verify everyone uses consistent terminology in:
- Code comments and variable names
- API documentation
- User interface text
- Database schema definitions

## Maintenance Procedures

### Weekly Updates
- Review new terms from feature development
- Update definitions based on stakeholder feedback
- Check for terminology inconsistencies in new code

### Monthly Reviews
- Full glossary audit with all stakeholders
- Identify emerging term conflicts
- Update bounded context boundaries if needed

### Integration with Development Workflow
1. **Pre-Development**: Reference glossary during technical design
2. **During Development**: Use glossary terms in naming conventions
3. **Code Review**: Verify consistent terminology usage
4. **Documentation**: Include glossary references in API docs

## Common Pitfalls to Avoid

### ❌ Anti-Patterns
- **Tech Jargon in Business Terms**: Don't use "entity" when business says "customer"
- **Inconsistent Naming**: "User" in one module, "Customer" in another
- **Missing Context**: Terms without clear bounded context assignment
- **Stale Definitions**: Glossary not updated as business evolves

### ✅ Best Practices
- **Business-First Language**: Start from business terminology, not technical
- **Context Boundaries**: Clear assignment of terms to specific domains
- **Living Document**: Regular updates as understanding evolves
- **Cross-Team Alignment**: Ensure all teams use same definitions

## File Structure
```
src/
├── domain/
│   ├── glossary.ts              # Main glossary file
│   ├── crm/
│   │   └── glossary.ts         # CRM-specific terms
│   ├── projects/
│   │   └── glossary.ts         # Projects-specific terms
│   ├── finance/
│   │   └── glossary.ts         # Finance-specific terms
│   └── [other-domains]/
│       └── glossary.ts
├── scripts/
│   └── generate-glossary-docs.ts # Documentation generator
└── docs/
    └── domain-glossary.md         # Generated documentation
```

## Success Metrics
- **Zero Terminology Conflicts**: No ambiguous terms in code reviews
- **100% API Coverage**: All business terms defined in OpenAPI specs
- **Team Alignment**: All stakeholders use consistent language
- **Onboarding Efficiency**: New team members understand terms within 1 week

## Integration with Existing Skills
This skill works with:
- `bounded-context-mapping` for defining domain boundaries
- `database-schema-development` for implementing domain models
- `api-business-endpoints` for consistent API terminology
- `create-react-component` for UI consistency

## Related Documentation
- [Domain-Driven Design](https://domain-driven.design/) - Official DDD resources
- [Azure Multi-Tenant Patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns) - Domain isolation strategies
- [Apex Architecture Guide](./ydm-architecture.md) - Project-specific DDD implementation

---

## email-service-implementation

**Description:** Complete email service implementation with SMTP and mock providers, Handlebars templates, queue management, and delivery tracking for the Apex Unified Suite.

# Email Service Implementation Guide

## Overview
This skill guides you through implementing a comprehensive email service that supports both SMTP (production) and mock (development/testing) providers, with Handlebars template rendering, queue management, and delivery tracking.

## Prerequisites
- Access to SMTP credentials (production) or development environment
- Handlebars template engine knowledge
- Understanding of email queue patterns
- Database access for email tracking

## Step 1: Email Service Architecture

### Core Service Interface
Create `lib/email/src/types.ts`:

```typescript
export interface EmailMessage {
  id?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  sendAt?: Date;
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  contentId?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
  verifyConnection(): Promise<boolean>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  timestamp: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailDelivery {
  id: string;
  messageId: string;
  to: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  provider: string;
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Step 2: Database Schema

### Email Tables
Create `lib/db/src/schema/email.ts`:

```typescript
import { pgTable, text, timestamp, uuid, json, integer, boolean } from 'drizzle-orm/pg-core';

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  subject: text('subject').notNull(),
  htmlTemplate: text('html_template').notNull(),
  textTemplate: text('text_template'),
  metadata: json('metadata'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailQueue = pgTable('email_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: text('message_id').notNull().unique(),
  to: text('to').notNull().array(),
  cc: text('cc').array(),
  bcc: text('bcc').array(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content'),
  textContent: text('text_content'),
  from: text('from'),
  replyTo: text('reply_to'),
  attachments: json('attachments'),
  headers: json('headers'),
  priority: text('priority').default('normal'),
  provider: text('provider').default('smtp'),
  status: text('status').default('pending'),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  sendAt: timestamp('send_at').defaultNow().notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  scheduledAt: timestamp('scheduled_at'),
  error: text('error'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailDeliveries = pgTable('email_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: text('message_id').notNull(),
  to: text('to').notNull(),
  status: text('status').default('pending').notNull(),
  provider: text('provider').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  deliveredAt: timestamp('delivered_at'),
  error: text('error'),
  response: json('response'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailQueue = typeof emailQueue.$inferSelect;
export type NewEmailQueue = typeof emailQueue.$inferInsert;
export type EmailDelivery = typeof emailDeliveries.$inferSelect;
export type NewEmailDelivery = typeof emailDeliveries.$inferInsert;
```

## Step 3: Email Providers

### SMTP Provider
Create `lib/email/src/providers/smtp-provider.ts`:

```typescript
import nodemailer from 'nodemailer';
import { EmailProvider, EmailMessage, EmailSendResult } from '../types';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
}

export class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: config.pool || true,
      maxConnections: config.maxConnections || 5,
      maxMessages: config.maxMessages || 100,
      from: config.from,
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const mailOptions = {
        from: message.from || this.config.from,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        attachments: message.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          cid: att.contentId,
        })),
        headers: message.headers,
        priority: message.priority === 'high' ? 'high' : message.priority === 'low' ? 'low' : 'normal',
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: 'smtp',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    this.transporter.close();
  }
}
```

### Mock Provider
Create `lib/email/src/providers/mock-provider.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { EmailProvider, EmailMessage, EmailSendResult } from '../types';

export interface MockConfig {
  outputDir?: string;
  logToFile?: boolean;
  logToConsole?: boolean;
  simulateDelays?: boolean;
  failureRate?: number; // 0-1, probability of simulated failure
}

export class MockProvider implements EmailProvider {
  private config: MockConfig;
  private outputDir: string;

  constructor(config: MockConfig = {}) {
    this.config = {
      outputDir: config.outputDir || './mock-emails',
      logToFile: config.logToFile !== false,
      logToConsole: config.logToConsole !== false,
      simulateDelays: config.simulateDelays !== false,
      failureRate: config.failureRate || 0,
    };
    this.outputDir = this.config.outputDir!;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Simulate network delay
    if (this.config.simulateDelays) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }

    // Simulate random failure
    if (Math.random() < (this.config.failureRate || 0)) {
      return {
        success: false,
        provider: 'mock',
        error: 'Simulated delivery failure',
        timestamp: new Date(),
      };
    }

    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      const emailData = {
        messageId,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        html: message.html,
        text: message.text,
        from: message.from,
        replyTo: message.replyTo,
        attachments: message.attachments,
        headers: message.headers,
        priority: message.priority,
        timestamp: new Date().toISOString(),
      };

      // Write to file
      if (this.config.logToFile) {
        const filename = `${messageId.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        await fs.writeFile(
          path.join(this.outputDir, filename),
          JSON.stringify(emailData, null, 2)
        );
      }

      // Log to console
      if (this.config.logToConsole) {
        console.log('📧 Mock Email Sent:', {
          messageId,
          to: message.to,
          subject: message.subject,
        });
      }

      return {
        success: true,
        messageId,
        provider: 'mock',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: 'mock',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      return true;
    } catch (error) {
      console.error('Mock provider verification failed:', error);
      return false;
    }
  }
}
```

## Step 4: Template Service

### Handlebars Template Service
Create `lib/email/src/template-service.ts`:

```typescript
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { db } from '@workspace/db';
import { emailTemplates } from '@workspace/db/src/schema/email';
import { eq } from 'drizzle-orm';

export interface TemplateRenderOptions {
  helpers?: Record<string, Function>;
  partials?: Record<string, string>;
}

export class TemplateService {
  private handlebars: typeof Handlebars;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerDefaultHelpers();
  }

  async renderTemplate(
    templateName: string,
    data: Record<string, any>,
    options?: TemplateRenderOptions
  ): Promise<{ subject: string; html: string; text?: string }> {
    // Register custom helpers
    if (options?.helpers) {
      Object.entries(options.helpers).forEach(([name, helper]) => {
        this.handlebars.registerHelper(name, helper);
      });
    }

    // Register partials
    if (options?.partials) {
      Object.entries(options.partials).forEach(([name, partial]) => {
        this.handlebars.registerPartial(name, partial);
      });
    }

    const template = await this.getTemplate(templateName);
    
    const subject = this.handlebars.compile(template.subject)(data);
    const html = this.handlebars.compile(template.htmlTemplate)(data);
    const text = template.textTemplate 
      ? this.handlebars.compile(template.textTemplate)(data)
      : undefined;

    return { subject, html, text };
  }

  async getTemplate(templateName: string): Promise<EmailTemplate> {
    // Check cache first
    const cached = this.templateCache.get(templateName);
    if (cached) {
      // Still need to fetch fresh data for subject and text template
      const template = await this.fetchTemplate(templateName);
      return {
        ...template,
        htmlTemplate: cached.toString(),
      };
    }

    const template = await this.fetchTemplate(templateName);
    
    // Cache compiled HTML template
    this.templateCache.set(templateName, this.handlebars.compile(template.htmlTemplate));

    return template;
  }

  private async fetchTemplate(templateName: string): Promise<EmailTemplate> {
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, templateName))
      .limit(1);

    if (templates.length === 0) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return templates[0];
  }

  async createTemplate(template: NewEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values(template).returning();
    
    // Clear cache
    this.templateCache.delete(created.name);
    
    return created;
  }

  async updateTemplate(
    name: string,
    updates: Partial<NewEmailTemplate>
  ): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.name, name))
      .returning();

    if (!updated) {
      throw new Error(`Template '${name}' not found`);
    }

    // Clear cache
    this.templateCache.delete(name);
    
    return updated;
  }

  async deleteTemplate(name: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.name, name));
    
    // Clear cache
    this.templateCache.delete(name);
  }

  private registerDefaultHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      switch (format) {
        case 'short':
          return d.toLocaleDateString();
        case 'long':
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        case 'time':
          return d.toLocaleTimeString();
        default:
          return d.toISOString();
      }
    });

    // Currency formatting helper
    this.handlebars.registerHelper('formatCurrency', (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    // Conditional helper
    this.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });

    // JSON stringification helper
    this.handlebars.registerHelper('json', function(obj) {
      return JSON.stringify(obj);
    });

    // URL encoding helper
    this.handlebars.registerHelper('urlEncode', function(str) {
      return encodeURIComponent(str);
    });
  }
}
```

## Step 5: Email Queue Service

### Queue Management
Create `lib/email/src/queue-service.ts`:

```typescript
import { db } from '@workspace/db';
import { emailQueue, emailDeliveries } from '@workspace/db/src/schema/email';
import { EmailMessage, EmailProvider, EmailSendResult } from './types';
import { eq, and, lt, gt, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface QueueConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // minutes
  cleanupInterval: number; // hours
}

export class QueueService {
  private config: QueueConfig;
  private processing = false;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      batchSize: config.batchSize || 10,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5,
      cleanupInterval: config.cleanupInterval || 24,
    };
  }

  async enqueue(message: EmailMessage, provider: string = 'smtp'): Promise<string> {
    const messageId = message.id || uuidv4();
    
    await db.insert(emailQueue).values({
      messageId,
      to: Array.isArray(message.to) ? message.to : [message.to],
      cc: message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : [],
      bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : [],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      from: message.from,
      replyTo: message.replyTo,
      attachments: message.attachments,
      headers: message.headers,
      priority: message.priority || 'normal',
      provider,
      sendAt: message.sendAt || new Date(),
      scheduledAt: message.sendAt,
      metadata: message.metadata,
    });

    return messageId;
  }

  async processQueue(provider: EmailProvider): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const messages = await this.getPendingMessages();
      
      for (const message of messages) {
        await this.processMessage(message, provider);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private async getPendingMessages(): Promise<EmailQueue[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'pending'),
          lt(emailQueue.sendAt, now),
          lt(emailQueue.attempts, this.config.maxRetries)
        )
      )
      .orderBy(emailQueue.priority, emailQueue.createdAt)
      .limit(this.config.batchSize);
  }

  private async processMessage(queueMessage: EmailQueue, provider: EmailProvider): Promise<void> {
    try {
      // Update attempt count and status
      await db
        .update(emailQueue)
        .set({
          status: 'processing',
          attempts: queueMessage.attempts + 1,
          lastAttemptAt: new Date(),
        })
        .where(eq(emailQueue.messageId, queueMessage.messageId));

      // Prepare message
      const message: EmailMessage = {
        id: queueMessage.messageId,
        to: queueMessage.to,
        cc: queueMessage.cc,
        bcc: queueMessage.bcc,
        subject: queueMessage.subject,
        html: queueMessage.htmlContent,
        text: queueMessage.textContent,
        from: queueMessage.from,
        replyTo: queueMessage.replyTo,
        attachments: queueMessage.attachments as any,
        headers: queueMessage.headers as any,
        priority: queueMessage.priority as any,
      };

      // Send email
      const result = await provider.send(message);

      if (result.success) {
        // Mark as sent
        await db
          .update(emailQueue)
          .set({ status: 'sent', updatedAt: new Date() })
          .where(eq(emailQueue.messageId, queueMessage.messageId));

        // Record delivery
        await this.recordDelivery(queueMessage.messageId, queueMessage.to[0], result);
      } else {
        // Mark as failed or retry
        if (queueMessage.attempts + 1 >= this.config.maxRetries) {
          await db
            .update(emailQueue)
            .set({
              status: 'failed',
              error: result.error,
              updatedAt: new Date(),
            })
            .where(eq(emailQueue.messageId, queueMessage.messageId));

          await this.recordDelivery(queueMessage.messageId, queueMessage.to[0], result);
        } else {
          // Schedule retry
          const retryAt = new Date(Date.now() + this.config.retryDelay * 60 * 1000);
          
          await db
            .update(emailQueue)
            .set({
              status: 'pending',
              sendAt: retryAt,
              error: result.error,
              updatedAt: new Date(),
            })
            .where(eq(emailQueue.messageId, queueMessage.messageId));
        }
      }
    } catch (error) {
      console.error(`Error processing message ${queueMessage.messageId}:`, error);
      
      // Mark as failed
      await db
        .update(emailQueue)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(emailQueue.messageId, queueMessage.messageId));
    }
  }

  private async recordDelivery(messageId: string, to: string, result: EmailSendResult): Promise<void> {
    await db.insert(emailDeliveries).values({
      messageId,
      to,
      status: result.success ? 'sent' : 'failed',
      provider: result.provider || 'unknown',
      attempts: 1,
      lastAttemptAt: new Date(),
      deliveredAt: result.success ? new Date() : undefined,
      error: result.error,
      metadata: {
        timestamp: result.timestamp.toISOString(),
      },
    });
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  }> {
    const [pending, processing, sent, failed] = await Promise.all([
      db.select().from(emailQueue).where(eq(emailQueue.status, 'pending')).then(r => r.length),
      db.select().from(emailQueue).where(eq(emailQueue.status, 'processing')).then(r => r.length),
      db.select().from(emailQueue).where(eq(emailQueue.status, 'sent')).then(r => r.length),
      db.select().from(emailQueue).where(eq(emailQueue.status, 'failed')).then(r => r.length),
    ]);

    return { pending, processing, sent, failed };
  }

  async cleanup(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.cleanupInterval * 60 * 60 * 1000);
    
    // Delete old sent messages
    await db
      .delete(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'sent'),
          lt(emailQueue.updatedAt, cutoffDate)
        )
      );

    // Delete old failed messages
    await db
      .delete(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'failed'),
          lt(emailQueue.updatedAt, cutoffDate)
        )
      );
  }
}
```

## Step 6: Main Email Service

### Email Service Implementation
Create `lib/email/src/email-service.ts`:

```typescript
import { EmailMessage, EmailProvider, EmailSendResult } from './types';
import { TemplateService } from './template-service';
import { QueueService } from './queue-service';
import { SMTPProvider } from './providers/smtp-provider';
import { MockProvider } from './providers/mock-provider';

export interface EmailServiceConfig {
  provider: 'smtp' | 'mock';
  smtp?: any; // SMTPConfig
  mock?: any; // MockConfig
  queue?: any; // QueueConfig
  enableQueue?: boolean;
}

export class EmailService {
  private provider: EmailProvider;
  private templateService: TemplateService;
  private queueService: QueueService;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    
    // Initialize provider
    if (config.provider === 'smtp' && config.smtp) {
      this.provider = new SMTPProvider(config.smtp);
    } else {
      this.provider = new MockProvider(config.mock);
    }

    this.templateService = new TemplateService();
    this.queueService = new QueueService(config.queue);
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    // If template is specified, render it first
    if (message.template && message.templateData) {
      const rendered = await this.templateService.renderTemplate(
        message.template,
        message.templateData
      );
      
      message.subject = rendered.subject;
      message.html = rendered.html;
      message.text = rendered.text;
    }

    // Queue or send immediately
    if (this.config.enableQueue) {
      const messageId = await this.queueService.enqueue(message, this.config.provider);
      return {
        success: true,
        messageId,
        provider: this.config.provider,
        timestamp: new Date(),
      };
    } else {
      return await this.provider.send(message);
    }
  }

  async sendMagicLink(email: string, magicLink: string, options?: {
    firstName?: string;
    companyName?: string;
    expiryMinutes?: number;
  }): Promise<EmailSendResult> {
    const templateData = {
      email,
      magicLink,
      firstName: options?.firstName || 'there',
      companyName: options?.companyName || 'Apex Unified Suite',
      expiryMinutes: options?.expiryMinutes || 15,
    };

    return await this.sendEmail({
      to: email,
      template: 'magic-link',
      templateData,
    });
  }

  async sendWelcomeEmail(email: string, options?: {
    firstName?: string;
    companyName?: string;
  }): Promise<EmailSendResult> {
    const templateData = {
      email,
      firstName: options?.firstName || 'there',
      companyName: options?.companyName || 'Apex Unified Suite',
    };

    return await this.sendEmail({
      to: email,
      template: 'welcome',
      templateData,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string, options?: {
    firstName?: string;
    expiryMinutes?: number;
  }): Promise<EmailSendResult> {
    const templateData = {
      email,
      resetLink,
      firstName: options?.firstName || 'there',
      expiryMinutes: options?.expiryMinutes || 60,
    };

    return await this.sendEmail({
      to: email,
      template: 'password-reset',
      templateData,
    });
  }

  async processQueue(): Promise<void> {
    if (this.config.enableQueue) {
      await this.queueService.processQueue(this.provider);
    }
  }

  async getQueueStatus() {
    return await this.queueService.getQueueStatus();
  }

  async verifyConnection(): Promise<boolean> {
    return await this.provider.verifyConnection();
  }

  async close(): Promise<void> {
    if (this.provider instanceof SMTPProvider) {
      await this.provider.close();
    }
  }
}
```

## Step 7: API Integration

### Email API Routes
Create `artifacts/api-server/src/routes/v1/email.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { EmailService } from '@workspace/email/src/email-service';

const router = Router();

// Initialize email service based on environment
const emailService = new EmailService({
  provider: process.env.NODE_ENV === 'production' ? 'smtp' : 'mock',
  smtp: process.env.NODE_ENV === 'production' ? {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM,
  } : undefined,
  enableQueue: true,
});

// Send email
router.post('/send', async (req, res) => {
  try {
    const schema = z.object({
      to: z.union([z.string().email(), z.array(z.string().email())]),
      subject: z.string().min(1),
      html: z.string().optional(),
      text: z.string().optional(),
      template: z.string().optional(),
      templateData: z.record(z.any()).optional(),
      cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
      bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
      from: z.string().email().optional(),
      replyTo: z.string().email().optional(),
    });

    const data = schema.parse(req.body);
    
    const result = await emailService.sendEmail(data);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Email send error:', error);
    res.status(500).json({
      error: 'Failed to send email',
    });
  }
});

// Send magic link
router.post('/magic-link', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      magicLink: z.string().url(),
      firstName: z.string().optional(),
      companyName: z.string().optional(),
      expiryMinutes: z.number().optional(),
    });

    const data = schema.parse(req.body);
    
    const result = await emailService.sendMagicLink(data.email, data.magicLink, {
      firstName: data.firstName,
      companyName: data.companyName,
      expiryMinutes: data.expiryMinutes,
    });
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Magic link send error:', error);
    res.status(500).json({
      error: 'Failed to send magic link',
    });
  }
});

// Get queue status
router.get('/queue/status', async (req, res) => {
  try {
    const status = await emailService.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
    });
  }
});

// Process queue (admin only)
router.post('/queue/process', async (req, res) => {
  try {
    await emailService.processQueue();
    res.json({
      message: 'Queue processing initiated',
    });
  } catch (error) {
    console.error('Queue processing error:', error);
    res.status(500).json({
      error: 'Failed to process queue',
    });
  }
});

export { router as emailRouter };
```

## Step 8: Email Templates

### Create Default Templates
Create a template seeding script `lib/email/src/templates/seed.ts`:

```typescript
import { db } from '@workspace/db';
import { emailTemplates } from '@workspace/db/src/schema/email';

const defaultTemplates = [
  {
    name: 'magic-link',
    subject: 'Sign in to {{companyName}} Portal',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Portal</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #0066ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Portal Sign In</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>Click the button below to sign in to the {{companyName}} portal:</p>
      <div style="text-align: center;">
        <a href="{{magicLink}}" class="button">Sign In to Portal</a>
      </div>
      <p><strong>Important:</strong> This link will expire in {{expiryMinutes}} minutes for security reasons.</p>
      <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Apex Unified Suite portal.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
Hello {{firstName}},

Sign in to the {{companyName}} portal by clicking this link:
{{magicLink}}

This link will expire in {{expiryMinutes}} minutes for security reasons.

If you didn't request this sign-in link, you can safely ignore this email.

This is an automated message from the Apex Unified Suite portal.
    `,
  },
  {
    name: 'welcome',
    subject: 'Welcome to {{companyName}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome!</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>Welcome to {{companyName}}! We're excited to have you on board.</p>
      <p>You can now access your portal and start using our platform.</p>
      <p>If you have any questions, don't hesitate to reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Apex Unified Suite.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
Hello {{firstName}},

Welcome to {{companyName}}! We're excited to have you on board.

You can now access your portal and start using our platform.

If you have any questions, don't hesitate to reach out to our support team.

This is an automated message from the Apex Unified Suite.
    `,
  },
  {
    name: 'password-reset',
    subject: 'Reset your password',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #0066ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center;">
        <a href="{{resetLink}}" class="button">Reset Password</a>
      </div>
      <p><strong>Important:</strong> This link will expire in {{expiryMinutes}} minutes for security reasons.</p>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Apex Unified Suite.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
Hello {{firstName}},

You requested to reset your password. Click this link to proceed:
{{resetLink}}

This link will expire in {{expiryMinutes}} minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

This is an automated message from the Apex Unified Suite.
    `,
  },
];

export async function seedEmailTemplates(): Promise<void> {
  for (const template of defaultTemplates) {
    const existing = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, template.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(emailTemplates).values(template);
      console.log(`Created email template: ${template.name}`);
    }
  }
}
```

## Step 9: Queue Processor

### Background Queue Processor
Create `artifacts/api-server/src/workers/email-queue-processor.ts`:

```typescript
import { EmailService } from '@workspace/email/src/email-service';

class EmailQueueProcessor {
  private emailService: EmailService;
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.emailService = new EmailService({
      provider: process.env.NODE_ENV === 'production' ? 'smtp' : 'mock',
      enableQueue: true,
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('Starting email queue processor...');

    // Process immediately
    await this.processQueue();

    // Schedule regular processing
    this.interval = setInterval(async () => {
      await this.processQueue();
    }, 30000); // Process every 30 seconds
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log('Email queue processor stopped');

    await this.emailService.close();
  }

  private async processQueue(): Promise<void> {
    try {
      await this.emailService.processQueue();
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }
}

// Singleton instance
const processor = new EmailQueueProcessor();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down email queue processor...');
  await processor.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down email queue processor...');
  await processor.stop();
  process.exit(0);
});

// Start processor if this file is run directly
if (require.main === module) {
  processor.start().catch(console.error);
}

export { processor };
```

## Step 10: Testing

### Email Service Tests
Create `tests/email/email-service.test.ts`:

```typescript
import { EmailService } from '@workspace/email/src/email-service';
import { MockProvider } from '@workspace/email/src/providers/mock-provider';

describe('Email Service', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService({
      provider: 'mock',
      mock: {
        logToFile: false,
        logToConsole: false,
      },
      enableQueue: false,
    });
  });

  test('should send email directly', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('should send magic link email', async () => {
    const result = await emailService.sendMagicLink(
      'test@example.com',
      'https://example.com/auth/verify?token=abc123',
      {
        firstName: 'John',
        companyName: 'Test Company',
      }
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('should handle template rendering', async () => {
    // This would require templates to be seeded
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      template: 'magic-link',
      templateData: {
        magicLink: 'https://example.com/auth/verify?token=abc123',
        firstName: 'John',
        companyName: 'Test Company',
        expiryMinutes: 15,
      },
    });

    expect(result.success).toBe(true);
  });
});
```

## Common Issues and Solutions

### SMTP Connection Issues
- Verify SMTP credentials and server details
- Check firewall and network connectivity
- Ensure TLS/SSL settings match provider requirements
- Test with telnet or openssl for basic connectivity

### Template Rendering Issues
- Verify Handlebars syntax
- Check template data structure
- Ensure all required variables are provided
- Test templates with sample data

### Queue Processing Issues
- Monitor queue status regularly
- Check database connectivity
- Verify retry logic and backoff strategy
- Implement proper error handling and logging

### Email Delivery Issues
- Monitor bounce rates and spam complaints
- Verify SPF/DKIM/DMARC records
- Check email content for spam triggers
- Implement proper unsubscribe mechanisms

## Security Considerations

### SMTP Security
- Use TLS/SSL for all connections
- Store SMTP credentials securely
- Implement connection pooling
- Monitor for suspicious activity

### Template Security
- Sanitize template inputs
- Escape user-provided content
- Limit template complexity
- Prevent code injection

### Queue Security
- Validate message queue data
- Implement proper access controls
- Monitor queue processing
- Secure database connections

This skill provides a comprehensive email service implementation with both production and development capabilities, proper template management, queue processing, and security considerations for the Apex Unified Suite.

---

## error-handler-middleware

**Description:** Implement global Express error handling middleware with DomainError mapping, structured logging, and consistent HTTP response formatting

# Error Handler Middleware Implementation

This skill guides you through implementing a global Express error handling middleware that maps domain errors to HTTP responses, provides structured logging, and ensures consistent error formatting across the API.

## Current State Assessment

**Current State**: No global error handler exists - errors will be inconsistent and lack proper formatting.

**Missing Infrastructure**:
- No centralized error handling
- No DomainError to HTTP status mapping
- No structured logging with request correlation
- No consistent error response format

## Error Handling Architecture

### **Error Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Request Processing                              │
│                                                                  │
│  Route Handler ──► Service ──► Domain Error                      │
│       │                              │                           │
│       │                              ▼                           │
│       │                     DomainError                          │
│       │                     (code, message, details)             │
│       │                              │                           │
│       │                              ▼                           │
│       │  ┌──────────────────────────────────────────────────┐  │
│       └──►│         Error Handler Middleware                 │  │
│           │                                                    │  │
│           │  1. Log error with request context                 │  │
│           │  2. Map DomainError to HTTP status                 │  │
│           │  3. Format consistent response                     │  │
│           │  4. Send to Sentry (if configured)                 │  │
│           │                                                    │  │
│           │  Response: { success: false, error: {...} }      │  │
│           └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### **Error Response Format**

```typescript
// Standard error envelope
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Domain error code
    message: string;      // Human-readable message
    details?: unknown;    // Additional context (validation errors, etc.)
    requestId?: string;   // For correlation with logs
  };
}

// Example responses
// 400 Validation Error
{
  "success": false,
  "error": {
    "code": "ValidationError",
    "message": "Invalid request data",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Minimum 12 characters required" }
    ],
    "requestId": "req-123-456"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "LeadNotFound",
    "message": "Lead with ID 'lead-123' was not found",
    "requestId": "req-123-457"
  }
}

// 409 Conflict
{
  "success": false,
  "error": {
    "code": "DuplicateEmail",
    "message": "A user with email 'john@example.com' already exists",
    "requestId": "req-123-458"
  }
}
```

## Step-by-Step Implementation

### **Step 1: Create Domain Error Base Class**

**File**: `artifacts/api-server/src/errors/domain-errors.ts`

```typescript
import { Result, err } from 'neverthrow';

/**
 * Base class for all domain errors
 * Uses neverthrow Either pattern for type-safe error handling
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Helper to create an Either Left (error) result
   */
  toResult<T>(): Result<T, this> {
    return err(this);
  }
}

// ==================== Identity & Access Errors ====================

export class InvalidCredentials extends DomainError {
  readonly code = 'InvalidCredentials';
  readonly statusCode = 401;
  
  constructor() {
    super('Invalid email or password');
  }
}

export class TokenExpired extends DomainError {
  readonly code = 'TokenExpired';
  readonly statusCode = 401;
  
  constructor() {
    super('Your session has expired. Please log in again.');
  }
}

export class DuplicateEmail extends DomainError {
  readonly code = 'DuplicateEmail';
  readonly statusCode = 409;
  
  constructor(email: string) {
    super(`A user with email '${email}' already exists`);
  }
}

export class UserNotFound extends DomainError {
  readonly code = 'UserNotFound';
  readonly statusCode = 404;
  
  constructor(userId: string) {
    super(`User with ID '${userId}' was not found`);
  }
}

export class InvalidOrganization extends DomainError {
  readonly code = 'InvalidOrganization';
  readonly statusCode = 400;
  
  constructor(orgId: string) {
    super(`Organization with ID '${orgId}' was not found`);
  }
}

export class InsufficientPermissions extends DomainError {
  readonly code = 'InsufficientPermissions';
  readonly statusCode = 403;
  
  constructor(permission: string) {
    super(`You do not have the required permission: ${permission}`);
  }
}

// ==================== CRM Errors ====================

export class LeadNotFound extends DomainError {
  readonly code = 'LeadNotFound';
  readonly statusCode = 404;
  
  constructor(leadId: string) {
    super(`Lead with ID '${leadId}' was not found`);
  }
}

export class InvalidStageTransition extends DomainError {
  readonly code = 'InvalidStageTransition';
  readonly statusCode = 400;
  
  constructor(from: string, to: string) {
    super(`Cannot transition from '${from}' to '${to}'`);
  }
}

export class DuplicateLead extends DomainError {
  readonly code = 'DuplicateLead';
  readonly statusCode = 409;
  
  constructor(email: string) {
    super(`A lead with email '${email}' already exists`);
  }
}

export class ContactNotFound extends DomainError {
  readonly code = 'ContactNotFound';
  readonly statusCode = 404;
  
  constructor(contactId: string) {
    super(`Contact with ID '${contactId}' was not found`);
  }
}

// ==================== Validation Errors ====================

export class ValidationError extends DomainError {
  readonly code = 'ValidationError';
  readonly statusCode = 400;
  
  constructor(
    message: string = 'Invalid request data',
    public readonly fieldErrors: Array<{ field: string; message: string }> = []
  ) {
    super(message, fieldErrors);
  }
}

export class WeakPassword extends DomainError {
  readonly code = 'WeakPassword';
  readonly statusCode = 400;
  
  constructor(details: string) {
    super('Password does not meet security requirements', details);
  }
}

// ==================== Infrastructure Errors ====================

export class DatabaseError extends DomainError {
  readonly code = 'DatabaseError';
  readonly statusCode = 500;
  
  constructor(message: string = 'Database operation failed') {
    super(message);
  }
}

export class ExternalServiceError extends DomainError {
  readonly code = 'ExternalServiceError';
  readonly statusCode = 502;
  
  constructor(service: string) {
    super(`Failed to communicate with ${service}`);
  }
}

// ==================== Error Type Guards ====================

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function isNotFoundError(error: DomainError): boolean {
  return error.statusCode === 404;
}

export function isValidationError(error: DomainError): boolean {
  return error.statusCode === 400 && error.code === 'ValidationError';
}

// ==================== Error Factory ====================

export const Errors = {
  invalidCredentials: () => new InvalidCredentials(),
  tokenExpired: () => new TokenExpired(),
  duplicateEmail: (email: string) => new DuplicateEmail(email),
  userNotFound: (id: string) => new UserNotFound(id),
  leadNotFound: (id: string) => new LeadNotFound(id),
  contactNotFound: (id: string) => new ContactNotFound(id),
  invalidStageTransition: (from: string, to: string) => new InvalidStageTransition(from, to),
  duplicateLead: (email: string) => new DuplicateLead(email),
  validation: (message?: string, fields?: Array<{ field: string; message: string }>) => 
    new ValidationError(message, fields),
  weakPassword: (details: string) => new WeakPassword(details),
  insufficientPermissions: (permission: string) => new InsufficientPermissions(permission),
  database: (message?: string) => new DatabaseError(message),
};
```

### **Step 2: Create Global Error Handler Middleware**

**File**: `artifacts/api-server/src/middlewares/error-handler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isDomainError, ValidationError, DatabaseError } from '../errors/domain-errors';
import { logger } from '../lib/logger';
import { randomUUID } from 'crypto';

/**
 * Extended Error type that includes potential statusCode
 */
interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Generate a unique request ID for error correlation
 */
function getRequestId(req: Request): string {
  return (req.headers['x-request-id'] as string) || randomUUID();
}

/**
 * Map Zod validation errors to our format
 */
function formatZodError(error: ZodError): Array<{ field: string; message: string }> {
  return error.errors.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Determine if error should be logged as error or warn
 */
function shouldLogAsError(error: DomainError): boolean {
  // 4xx errors are client issues, 5xx are server issues
  return error.statusCode >= 500;
}

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware chain
 */
export function errorHandler(
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = getRequestId(req);
  
  // Build error context for logging
  const errorContext = {
    requestId,
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    organizationId: (req as any).user?.org,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };

  let domainError: DomainError;
  let statusCode: number;

  // Convert different error types to DomainError
  if (isDomainError(error)) {
    domainError = error;
    statusCode = error.statusCode;
  } else if (error instanceof ZodError) {
    domainError = new ValidationError(
      'Validation failed',
      formatZodError(error)
    );
    statusCode = 400;
  } else if (error.name === 'PostgresError' || error.name === 'DatabaseError') {
    domainError = new DatabaseError();
    statusCode = 500;
    // Log database errors for investigation
    logger.error({
      ...errorContext,
      error: error.message,
      stack: error.stack,
    }, 'Database error occurred');
  } else {
    // Unknown error - generic 500
    domainError = new DatabaseError('An unexpected error occurred');
    statusCode = error.statusCode || 500;
    
    // Log unexpected errors with full details
    logger.error({
      ...errorContext,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    }, 'Unexpected error occurred');
  }

  // Log domain errors (warn for 4xx, error for 5xx)
  const logData = {
    ...errorContext,
    errorCode: domainError.code,
    errorMessage: domainError.message,
    errorDetails: domainError.details,
  };

  if (shouldLogAsError(domainError)) {
    logger.error(logData, `Server error: ${domainError.code}`);
  } else {
    logger.warn(logData, `Client error: ${domainError.code}`);
  }

  // Send Sentry report for server errors (if configured)
  if (statusCode >= 500 && process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: errorContext });
  }

  // Build response
  const errorResponse = {
    success: false,
    error: {
      code: domainError.code,
      message: domainError.message,
      ...(domainError.details && { details: domainError.details }),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack,
      }),
      requestId,
    },
  };

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = getRequestId(req);
  
  logger.warn({
    requestId,
    method: req.method,
    path: req.path,
  }, 'Route not found');

  res.status(404).json({
    success: false,
    error: {
      code: 'RouteNotFound',
      message: `Route ${req.method} ${req.path} not found`,
      requestId,
    },
  });
}

/**
 * Async handler wrapper to catch errors from async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### **Step 3: Create Structured Logger**

**File**: `artifacts/api-server/src/lib/logger.ts`

```typescript
import pino from 'pino';

/**
 * Pino logger configuration
 * - Structured JSON logging for production
 * - Pretty printing for development
 * - Redacted sensitive fields
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  // Pretty print in development
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  
  // Base context
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
  
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'accessToken',
      'jwt',
      'secret',
      'apiKey',
      'api_key',
      'headers.authorization',
      'headers.cookie',
    ],
    remove: true,
  },
});

// Child logger factory for request context
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId,
  });
}
```

### **Step 4: Register Error Handler in App**

**File**: `artifacts/api-server/src/app.ts`

```typescript
import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import routes from './routes';

const app = express();

// ... other middleware (body parsing, cors, etc.)

// API routes
app.use('/api', routes);

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Global error handler - must be LAST
app.use(errorHandler);

export { app };
```

### **Step 5: Update Routes to Use Async Handler**

**File**: `artifacts/api-server/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { asyncHandler } from '../middlewares/error-handler';
import { authService } from '../services/auth';

const router = Router();

// Use asyncHandler to catch errors
router.post('/register', asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  
  if (result.isErr()) {
    // Errors are thrown to be caught by error handler
    throw result.error;
  }
  
  res.status(201).json({
    success: true,
    data: result.value,
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const result = await authService.authenticateUser(
    req.body.email,
    req.body.password
  );
  
  if (result.isErr()) {
    throw result.error;
  }
  
  res.json({
    success: true,
    data: result.value,
  });
}));

export default router;
```

### **Step 6: Error Handler Tests**

**File**: `artifacts/api-server/__tests__/middlewares/error-handler.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { leadRepository } from '@workspace/db/repositories';

describe('Error Handler Middleware', () => {
  describe('DomainError handling', () => {
    it('should return 404 for LeadNotFound', async () => {
      const response = await request(app)
        .get('/api/crm/leads/non-existent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LeadNotFound');
      expect(response.body.error.requestId).toBeDefined();
    });

    it('should return 400 for ValidationError with details', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('ValidationError');
      expect(response.body.error.details).toBeDefined();
    });

    it('should return 401 for InvalidCredentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('InvalidCredentials');
    });

    it('should return 409 for DuplicateEmail', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          fullName: 'Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DuplicateEmail');
    });
  });

  describe('Zod validation errors', () => {
    it('should format Zod errors as ValidationError', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          email: 'not-an-email',
          firstName: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('ValidationError');
      expect(response.body.error.details).toBeInstanceOf(Array);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('RouteNotFound');
    });
  });

  describe('Error response format', () => {
    it('should include requestId in all error responses', async () => {
      const response = await request(app)
        .get('/api/crm/leads/invalid');

      expect(response.body.error.requestId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should include stack trace in development', async () => {
      // Test with NODE_ENV=development
      const response = await request(app)
        .get('/api/crm/leads/invalid');

      if (process.env.NODE_ENV !== 'production') {
        expect(response.body.error.stack).toBeDefined();
      }
    });
  });
});
```

### **Step 7: Error Mapping Reference**

**File**: `artifacts/api-server/src/errors/error-map.ts`

```typescript
import { DomainError } from './domain-errors';

/**
 * Error to HTTP status code mapping
 * Used for documentation and testing
 */
export const ErrorStatusMap: Record<number, string[]> = {
  400: [
    'ValidationError',
    'WeakPassword',
    'InvalidStageTransition',
    'InvalidOrganization',
  ],
  401: [
    'InvalidCredentials',
    'TokenExpired',
  ],
  403: [
    'InsufficientPermissions',
  ],
  404: [
    'UserNotFound',
    'LeadNotFound',
    'ContactNotFound',
    'DealNotFound',
    'RouteNotFound',
  ],
  409: [
    'DuplicateEmail',
    'DuplicateLead',
  ],
  500: [
    'DatabaseError',
  ],
  502: [
    'ExternalServiceError',
  ],
};

/**
 * Get HTTP status code for a domain error
 */
export function getStatusCode(error: DomainError): number {
  return error.statusCode;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: DomainError): boolean {
  return error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: DomainError): boolean {
  return error.statusCode >= 500;
}
```

## Sentry Integration (Optional)

**File**: `artifacts/api-server/src/lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/node';

export function initSentry(): void {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.npm_package_version,
      
      // Only send server errors
      beforeSend(event) {
        const statusCode = event.extra?.statusCode as number;
        if (statusCode && statusCode < 500) {
          return null; // Don't send client errors
        }
        return event;
      },
    });
  }
}

export { Sentry };
```

## Verification Commands

```bash
# Test error responses
pnpm vitest run artifacts/api-server/__tests__/middlewares/error-handler.test.ts

# Check error coverage
grep -r "throw.*Error" artifacts/api-server/src/ | wc -l

# Verify all errors extend DomainError
grep -r "extends DomainError" artifacts/api-server/src/errors/
```

## Error Handling Checklist

- [ ] All errors extend `DomainError` base class
- [ ] Error handler registered as last middleware
- [ ] Async route handlers use `asyncHandler`
- [ ] Zod validation errors converted to `ValidationError`
- [ ] Request ID included in all error responses
- [ ] Structured logging with error context
- [ ] Sensitive data redacted from logs
- [ ] Stack traces in development only
- [ ] 404 handler for unmatched routes
- [ ] Sentry integration for server errors (optional)

---

## error-handling-validation

**Description:** Implement comprehensive error handling, form validation, and loading states across the suite

# Error Handling & Validation Implementation

This skill guides you through implementing comprehensive error handling, form validation, and loading states across the Apex Unified Suite to ensure a robust and user-friendly experience.

## Current State Assessment

**Error Handling Status**: Minimal error handling exists across the application.

**Issues Identified**:
- No error boundaries in React components
- No form validation with React Hook Form + Zod
- No loading states beyond basic skeleton components
- No centralized error reporting
- No user-friendly error messages
- No retry mechanisms for failed operations

## Error Handling Architecture

### **Error Handling Layers**
```
┌─────────────────────────────────────────┐
│           UI Layer (React)              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Error Bound │  │ Form Validation │   │
│  │ Retry Logic  │  │ Loading States  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         API Layer (React Query)          │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Error Retry  │  │ Global Handlers │   │
│  │ Cache Mgmt   │  │ Toast Notifs    │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Backend (Express)                │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Zod Validation│  │ Structured Logs │   │
│  │ Error Middl  │  │ Error Responses │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Global Error Handling Setup**

**File**: `artifacts/apex-os/src/lib/errorHandling.ts`
```typescript
import { AxiosError } from 'axios';

// Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormError {
  [key: string]: string;
}

// Error classification
export function classifyError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const apiError: ApiError = {
      message: error.response?.data?.error || error.message,
      status: error.response?.status,
      code: error.code,
    };

    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.details) {
      apiError.details = error.response.data.details;
    }

    return apiError;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

// Error message generation
export function getErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 400:
      return error.details ? 'Please check your input and try again.' : 'Invalid request.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}

// Form error conversion
export function convertValidationErrors(details: ValidationError[]): FormError {
  const errors: FormError = {};
  
  details.forEach((validationError) => {
    errors[validationError.field] = validationError.message;
  });

  return errors;
}

// Retry logic
export function shouldRetry(error: ApiError, attemptNumber: number): boolean {
  // Don't retry on client errors (4xx)
  if (error.status && error.status >= 400 && error.status < 500) {
    return false;
  }

  // Don't retry on authentication errors
  if (error.status === 401 || error.status === 403) {
    return false;
  }

  // Retry server errors up to 3 times
  return attemptNumber < 3;
}

// Error reporting
export function reportError(error: unknown, context?: string) {
  const classifiedError = classifyError(error);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error${context ? ` in ${context}` : ''}:`, classifiedError);
  }

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry or similar service
    // Sentry.captureException(error, { context });
  }
}
```

### **Step 2: React Query Global Error Handling**

**Update**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';
import { classifyError, getErrorMessage, shouldRetry } from '@/lib/errorHandling';

// Configure QueryClient with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        const classifiedError = classifyError(error);
        return shouldRetry(classifiedError, failureCount);
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      onError: (error) => {
        const classifiedError = classifyError(error);
        const message = getErrorMessage(classifiedError);
        
        // Show toast for non-authentication errors
        if (classifiedError.status !== 401) {
          toast.error(message);
        }
        
        // Report error for monitoring
        reportError(error, 'React Query');
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        const classifiedError = classifyError(error);
        const message = getErrorMessage(classifiedError);
        
        toast.error(message);
        reportError(error, 'React Query Mutation');
      },
    },
  },
});

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter>
              <Toaster />
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </WouterRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
```

### **Step 3: Enhanced Form Validation**

**File**: `artifacts/apex-os/src/hooks/useFormValidation.ts`
```typescript
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { convertValidationErrors, classifyError } from '@/lib/errorHandling';

interface UseFormValidationProps<T extends z.ZodSchema> {
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useFormValidation<T extends z.ZodSchema>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
}: UseFormValidationProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (error) {
      const classifiedError = classifyError(error);
      
      // Handle validation errors
      if (classifiedError.status === 400 && classifiedError.details) {
        const formErrors = convertValidationErrors(classifiedError.details);
        
        // Set form errors
        Object.entries(formErrors).forEach(([field, message]) => {
          form.setError(field as keyof z.infer<T>, {
            type: 'manual',
            message,
          });
        });
      } else {
        // Set general error
        setSubmitError(getErrorMessage(classifiedError));
      }
      
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  });

  const reset = () => {
    form.reset();
    setSubmitError(null);
  };

  return {
    form,
    handleSubmit,
    isSubmitting,
    submitError,
    reset,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
  };
}
```

### **Step 4: Enhanced Contact Form Component**

**File**: `artifacts/apex-os/src/components/crm/ContactForm.tsx`
```typescript
import React from 'react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { z } from 'zod';
import { insertContactSchema } from '@workspace/api-zod';
import { toast } from 'sonner';

// Extend schema for form validation
const contactFormSchema = insertContactSchema.extend({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ContactForm({ initialData, onSubmit, onCancel, isLoading = false }: ContactFormProps) {
  const {
    form,
    handleSubmit,
    isSubmitting,
    submitError,
    errors,
  } = useFormValidation({
    schema: contactFormSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      status: 'active',
      tags: [],
      notes: '',
      ...initialData,
    },
    onSubmit,
    onSuccess: () => {
      toast.success('Contact saved successfully');
    },
    onError: (error) => {
      console.error('Form submission error:', error);
    },
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Contact' : 'Create Contact'}
        </CardTitle>
        <CardDescription>
          {initialData ? 'Update contact information' : 'Add a new contact to your CRM'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
                placeholder="John"
                disabled={isSubmitting || isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
                placeholder="Doe"
                disabled={isSubmitting || isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="john.doe@example.com"
                disabled={isSubmitting || isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting || isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...form.register('company')}
                placeholder="Acme Corp"
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="CEO"
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Additional information about this contact..."
              rows={4}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Contact' : 'Create Contact'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for form
export function ContactFormSkeleton() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-20" />
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **Step 5: Backend Error Handling Middleware**

**File**: `artifacts/api-server/src/middlewares/errorHandler.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error implements ApiError {
  status = 400;
  code = 'VALIDATION_ERROR';
  details: any[];

  constructor(details: any[]) {
    super('Validation failed');
    this.details = details;
  }
}

export class NotFoundError extends Error implements ApiError {
  status = 404;
  code = 'NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class UnauthorizedError extends Error implements ApiError {
  status = 401;
  code = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenError extends Error implements ApiError {
  status = 403;
  code = 'FORBIDDEN';

  constructor(message = 'Forbidden') {
    super(message);
  }
}

export class ConflictError extends Error implements ApiError {
  status = 409;
  code = 'CONFLICT';

  constructor(message = 'Conflict') {
    super(message);
  }
}

export class InternalServerError extends Error implements ApiError {
  status = 500;
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message = 'Internal server error') {
    super(message);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: (req as any).user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle different error types
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
    );
    return handleApiError(validationError, res);
  }

  if (error instanceof ApiError) {
    return handleApiError(error, res);
  }

  // Default error handling
  const internalError = new InternalServerError(
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  );
  
  handleApiError(internalError, res);
}

function handleApiError(error: ApiError, res: Response) {
  const response: any = {
    error: error.message,
    code: error.code,
  };

  // Include details for validation errors
  if (error instanceof ValidationError && error.details) {
    response.details = error.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  res.status(error.status || 500).json(response);
}

// Async error wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### **Step 6: Enhanced API Routes with Error Handling**

**Update**: `artifacts/api-server/src/routes/crm/contacts.ts`
```typescript
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '@workspace/db';
import { contactsTable, insertContactSchema, selectContactSchema } from '@workspace/db/schema';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';
import { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../middlewares/errorHandler';

const router = Router();

// GET /api/crm/contacts - List contacts
router.get('/', 
  authenticateToken, 
  requirePermission('crm:contacts:read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      throw new ValidationError([
        { field: 'page', message: 'Page must be >= 1' },
        { field: 'limit', message: 'Limit must be between 1 and 100' },
      ]);
    }

    let query = db.select().from(contactsTable);

    // Apply filters
    const conditions = [];
    
    if (search) {
      if (search.length < 2) {
        throw new ValidationError([
          { field: 'search', message: 'Search term must be at least 2 characters' },
        ]);
      }
      
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
      if (!['active', 'inactive'].includes(status)) {
        throw new ValidationError([
          { field: 'status', message: 'Status must be "active" or "inactive"' },
        ]);
      }
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

    // Apply sorting
    const validSortFields = ['firstName', 'lastName', 'email', 'company', 'createdAt', 'updatedAt'];
    if (!validSortFields.includes(sortBy)) {
      throw new ValidationError([
        { field: 'sortBy', message: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}` },
      ]);
    }

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
  })
);

// POST /api/crm/contacts - Create contact
router.post('/', 
  authenticateToken, 
  requirePermission('crm:contacts:write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validatedData = insertContactSchema.parse(req.body);
    
    // Check for duplicate email
    const existingContact = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.email, validatedData.email))
      .limit(1);

    if (existingContact[0]) {
      throw new ConflictError('A contact with this email already exists');
    }
    
    const result = await db
      .insert(contactsTable)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({ data: result[0] });
  })
);

// PUT /api/crm/contacts/:id - Update contact
router.put('/:id', 
  authenticateToken, 
  requirePermission('crm:contacts:write'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ValidationError([
        { field: 'id', message: 'Valid contact ID is required' },
      ]);
    }

    const validatedData = insertContactSchema.partial().parse(req.body);

    // Check if contact exists
    const existingContact = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.id, id))
      .limit(1);

    if (!existingContact[0]) {
      throw new NotFoundError('Contact not found');
    }

    // Check for email conflict if email is being updated
    if (validatedData.email && validatedData.email !== existingContact[0].email) {
      const emailConflict = await db
        .select()
        .from(contactsTable)
        .where(and(
          eq(contactsTable.email, validatedData.email),
          // Exclude current contact from check
          // Note: This would need a more complex query in real implementation
        ))
        .limit(1);

      if (emailConflict[0]) {
        throw new ConflictError('A contact with this email already exists');
      }
    }

    const result = await db
      .update(contactsTable)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(contactsTable.id, id))
      .returning();

    res.json({ data: result[0] });
  })
);

// DELETE /api/crm/contacts/:id - Delete contact
router.delete('/:id', 
  authenticateToken, 
  requirePermission('crm:contacts:delete'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ValidationError([
        { field: 'id', message: 'Valid contact ID is required' },
      ]);
    }

    const result = await db
      .delete(contactsTable)
      .where(eq(contactsTable.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundError('Contact not found');
    }

    res.json({ data: result[0] });
  })
);

export default router;
```

### **Step 7: Loading State Components**

**File**: `artifacts/apex-os/src/components/ui/loading-states.tsx`
```typescript
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Page skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex space-x-4 border-b">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4 p-4 border rounded">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-20" />
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline loading spinner
export function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`} />
  );
}

// Loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 shadow-lg">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}
```

## Implementation Checklist

### **Error Handling**
- [ ] Implement global error classification
- [ ] Add React Query global error handlers
- [ ] Create backend error handling middleware
- [ ] Add error reporting and monitoring
- [ ] Implement retry logic with exponential backoff

### **Form Validation**
- [ ] Create useFormValidation hook
- [ ] Implement Zod schema validation
- [ ] Add real-time validation feedback
- [ ] Handle server-side validation errors
- [ ] Show user-friendly error messages

### **Loading States**
- [ ] Create skeleton components for all major UI patterns
- [ ] Add loading spinners for async operations
- [ ] Implement loading overlays for critical operations
- [ ] Show loading states during navigation
- [ ] Add optimistic loading indicators

### **User Experience**
- [ ] Add toast notifications for all operations
- [ ] Implement error boundaries for React components
- [ ] Add retry mechanisms for failed operations
- [ ] Show helpful error messages
- [ ] Provide recovery options for errors

This comprehensive error handling and validation system ensures a robust, user-friendly experience across the Apex Unified Suite with proper error reporting, validation feedback, and loading states.

---

## form-validation-system

**Description:** Implement form validation with React Hook Form and Zod, including reusable validation schemas, error handling, and accessibility patterns

# Form Validation System

This skill guides you through implementing a comprehensive form validation system using React Hook Form with Zod resolvers, providing type-safe forms with excellent UX and accessibility.

## Current State Assessment

**Current State**: `react-hook-form` and `@hookform/resolvers` are in dependencies but unused.

**Missing Infrastructure**:
- No form validation implementation
- No reusable validation schemas
- No form error handling patterns
- No accessible form components

## Form Architecture

### **Stack Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Form Component                            │
│                          (React)                                 │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                React Hook Form                            │   │
│  │  - Form state management                                   │   │
│  │  - Field registration                                      │   │
│  │  - Validation triggers                                     │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              @hookform/resolvers (zod)                   │   │
│  │  - Schema validation                                       │   │
│  │  - Type inference                                          │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Zod Schema                            │   │
│  │  - Validation rules                                        │   │
│  │  - Error messages                                          │   │
│  │  - TypeScript types                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### **Benefits**

- **Minimal Re-renders**: Uses uncontrolled components with refs
- **Small Bundle Size**: ~9KB gzipped
- **TypeScript First**: Full type inference from Zod schemas
- **Performance**: Faster than Formik and alternatives
- **Standards**: Uses native HTML validation where possible

## Step-by-Step Implementation

### **Step 1: Ensure Dependencies Are Installed**

```bash
# Already in dependencies, verify versions
pnpm --filter @workspace/apex-os list react-hook-form @hookform/resolvers zod

# Should see:
# react-hook-form@7.51.0
# @hookform/resolvers@3.3.4
# zod@3.23.8
```

### **Step 2: Create Validation Schema Library**

**File**: `artifacts/apex-os/src/lib/validations/index.ts`

```typescript
import { z } from 'zod';

// ==================== Common Validation Helpers ====================

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).*$/;

export const commonValidations = {
  // Email validation
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  // Password validation (12+ chars, mixed case, number, special)
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      passwordRegex,
      'Password must contain uppercase, lowercase, number, and special character'
    ),

  // Name validation
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

  // Phone validation (flexible format)
  phone: z
    .string()
    .regex(
      /^[\d\s\-\+\(\)]{10,20}$/,
      'Please enter a valid phone number'
    )
    .optional()
    .or(z.literal('')),

  // UUID validation
  uuid: z.string().uuid('Invalid ID format'),

  // URL validation
  url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  // Required string
  requiredString: (fieldName: string) =>
    z.string().min(1, `${fieldName} is required`),

  // Optional string
  optionalString: z.string().optional().or(z.literal('')),
};

// ==================== Form Schemas ====================

// Login form
export const loginSchema = z.object({
  email: commonValidations.email,
  password: z.string().min(1, 'Password is required'),
  organizationId: commonValidations.uuid,
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration form
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name is required')
      .max(100, 'Full name must not exceed 100 characters'),
    email: commonValidations.email,
    password: commonValidations.password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    organizationId: commonValidations.uuid,
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Contact form
export const contactSchema = z.object({
  firstName: commonValidations.firstName,
  lastName: commonValidations.lastName,
  email: commonValidations.email,
  phone: commonValidations.phone,
  company: z.string().max(100, 'Company name too long').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().max(5000, 'Notes too long').optional(),
  tags: z.array(z.string()).default([]),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Lead form
export const leadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  contactId: commonValidations.uuid.optional(),
  value: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount')
    .optional()
    .or(z.literal('')),
  stage: z.enum(['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  source: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional().or(z.literal('')),
  probability: z.number().min(0).max(100).optional(),
  description: z.string().max(2000).optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Organization form
export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Name too long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  planType: z.enum(['free', 'pro', 'enterprise']).default('free'),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

// Settings form
export const settingsSchema = z.object({
  companyName: z.string().min(1).max(100),
  timezone: z.string(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean().optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
```

### **Step 3: Create Reusable Form Components**

**File**: `artifacts/apex-os/src/components/forms/FormField.tsx`

```typescript
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  description?: string;
}

export function FormField({
  name,
  label,
  description,
  className,
  ...props
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      
      <Input
        id={name}
        className={cn(error && 'border-destructive', className)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : description ? `${name}-desc` : undefined}
        {...register(name)}
        {...props}
      />
      
      {description && !error && (
        <p id={`${name}-desc`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-xs text-destructive" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

**File**: `artifacts/apex-os/src/components/forms/FormSelect.tsx`

```typescript
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FormSelectProps {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  description?: string;
  placeholder?: string;
}

export function FormSelect({
  name,
  label,
  options,
  description,
  placeholder,
}: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger
              id={name}
              className={cn(error && 'border-destructive')}
              aria-invalid={error ? 'true' : 'false'}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

**File**: `artifacts/apex-os/src/components/forms/FormTextarea.tsx`

```typescript
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
}

export function FormTextarea({
  name,
  label,
  className,
  ...props
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      
      <Textarea
        id={name}
        className={cn(error && 'border-destructive', className)}
        aria-invalid={error ? 'true' : 'false'}
        {...register(name)}
        {...props}
      />
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
}
```

### **Step 4: Create Complete Form Example**

**File**: `artifacts/apex-os/src/components/auth/LoginForm.tsx`

```typescript
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { FormField } from '@/components/forms/FormField';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function LoginForm({ organizationId, onSuccess }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      organizationId,
    },
    mode: 'onBlur', // Validate on field blur
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data.email, data.password, data.organizationId);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          name="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />

        <FormField
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••••••"
          autoComplete="current-password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !methods.formState.isValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </FormProvider>
  );
}
```

**File**: `artifacts/apex-os/src/components/contacts/CreateContactForm.tsx`

```typescript
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateContact } from '@workspace/api-client-react';
import { contactSchema, ContactFormData } from '@/lib/validations';
import { FormField } from '@/components/forms/FormField';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateContactFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateContactForm({ onSuccess, onCancel }: CreateContactFormProps) {
  const [error, setError] = useState<string | null>(null);
  const createContact = useCreateContact();

  const methods = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      status: 'active',
      notes: '',
      tags: [],
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setError(null);
      await createContact.mutateAsync(data);
      toast.success('Contact created successfully');
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create contact';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="firstName"
            label="First Name"
            placeholder="John"
          />
          <FormField
            name="lastName"
            label="Last Name"
            placeholder="Doe"
          />
        </div>

        <FormField
          name="email"
          label="Email"
          type="email"
          placeholder="john@example.com"
        />

        <FormField
          name="phone"
          label="Phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="company"
            label="Company"
            placeholder="Acme Inc"
          />
          <FormField
            name="title"
            label="Job Title"
            placeholder="CEO"
          />
        </div>

        <FormSelect
          name="status"
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />

        <FormTextarea
          name="notes"
          label="Notes"
          placeholder="Add any relevant notes..."
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createContact.isPending || !methods.formState.isDirty}
          >
            {createContact.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Contact'
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

### **Step 5: Password Strength Indicator**

**File**: `artifacts/apex-os/src/components/forms/PasswordStrength.tsx`

```typescript
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  name: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(p) },
];

export function PasswordStrength({ name }: PasswordStrengthProps) {
  const { control } = useFormContext();
  const password = useWatch({ control, name }) || '';

  const passedCount = requirements.filter((req) => req.test(password)).length;
  const strength = (passedCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-3">
      <Progress value={strength} className={cn('h-2', getStrengthColor())} />
      
      <ul className="space-y-1 text-xs">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <li
              key={req.label}
              className={cn(
                'flex items-center gap-2',
                passed ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

### **Step 6: Form Validation Tests**

**File**: `artifacts/apex-os/__tests__/lib/validations.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  contactSchema,
  commonValidations,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => loginSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => loginSchema.parse(data)).toThrow('valid email');
    });

    it('should reject missing password', () => {
      const data = {
        email: 'test@example.com',
        password: '',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => loginSchema.parse(data)).toThrow('required');
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: true,
      };
      
      expect(() => registerSchema.parse(data)).not.toThrow();
    });

    it('should reject weak password', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: true,
      };
      
      expect(() => registerSchema.parse(data)).toThrow('12 characters');
    });

    it('should reject mismatched passwords', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: true,
      };
      
      expect(() => registerSchema.parse(data)).toThrow('do not match');
    });

    it('should reject unchecked terms', () => {
      const data = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        acceptTerms: false,
      };
      
      expect(() => registerSchema.parse(data)).toThrow('terms');
    });
  });

  describe('contactSchema', () => {
    it('should accept valid contact', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      };
      
      expect(() => contactSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid name characters', () => {
      const data = {
        firstName: 'John123',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      };
      
      expect(() => contactSchema.parse(data)).toThrow('invalid characters');
    });
  });

  describe('commonValidations', () => {
    it('should validate email format', () => {
      expect(() =>
        commonValidations.email.parse('valid@example.com')
      ).not.toThrow();
      
      expect(() =>
        commonValidations.email.parse('invalid')
      ).toThrow();
    });

    it('should validate password strength', () => {
      expect(() =>
        commonValidations.password.parse('StrongPass123!')
      ).not.toThrow();
      
      expect(() =>
        commonValidations.password.parse('weak')
      ).toThrow('12 characters');
      
      expect(() =>
        commonValidations.password.parse('nouppercase123!')
      ).toThrow('uppercase');
    });
  });
});
```

## Best Practices

### **Validation Modes**

```typescript
// onChange: Validate as user types (good for immediate feedback)
useForm({ mode: 'onChange' });

// onBlur: Validate when field loses focus (good for performance)
useForm({ mode: 'onBlur' });

// onSubmit: Validate only on submit (default, good for simple forms)
useForm({ mode: 'onSubmit' });

// all: Validate on all events
useForm({ mode: 'all' });
```

### **Accessibility**

```typescript
// Always include:
// - Label with htmlFor
// - aria-invalid for error state
// - aria-describedby linking to error message
// - role="alert" on error messages
// - Error messages linked to inputs
```

### **Performance**

```typescript
// Use Controller only when needed (custom components)
// For native inputs, use register() instead
// Use useWatch for individual field watching
// Avoid watching entire form state when possible
```

## Verification Commands

```bash
# Test validation schemas
pnpm vitest run artifacts/apex-os/__tests__/lib/validations.test.ts

# Check for uncontrolled form warnings
grep -r "register\|Controller" artifacts/apex-os/src/components/forms/

# Verify Zod imports
grep -r "from 'zod'" artifacts/apex-os/src/lib/validations/
```

---

## frontend-api-integration

**Description:** Replace static mock data with React Query hooks across all 10 business pages

# Frontend API Integration

This skill guides you through replacing static mock data with React Query hooks across all 10 business pages in the Apex Unified Suite, enabling real-time data synchronization and proper state management.

## Current State Assessment

**Frontend Data Status**: All pages use only static mock data from `src/data/mockData.ts`.

**Issues Identified**:
- Zero React Query usage despite being configured
- Zero `@workspace/api-client-react` imports
- All pages import from `mockData.ts` only
- No loading states, error handling, or data mutations
- React Query infrastructure exists but is unused

## Integration Architecture

### **Data Flow Transformation**
```
Current Flow:
Component → mockData.ts → Static UI

Target Flow:
Component → React Query Hook → API Client → Backend API → Database
                ↓
        Loading/Error States + Optimistic Updates + Caching
```

### **Component Integration Pattern**
```typescript
// Before (Mock Data)
import { crmContacts } from '@/data/mockData';

export function CRMPage() {
  const contacts = crmContacts;
  return <ContactList contacts={contacts} />;
}

// After (React Query)
import { useContactsQuery, useCreateContactMutation } from '@workspace/api-client-react';

export function CRMPage() {
  const { data: contacts, isLoading, error } = useContactsQuery();
  const createContact = useCreateContactMutation();
  
  if (isLoading) return <ContactListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <ContactList 
      contacts={contacts || []}
      onCreateContact={createContact.mutate}
    />
  );
}
```

## Step-by-Step Integration

### **Step 1: Update Custom Fetch Integration**

**File**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configure QueryClient with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Don't retry on validation errors
        if (error?.status === 400) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on reconnect
    },
    mutations: {
      retry: 1, // Retry mutations once
      onError: (error) => {
        // Global mutation error handling
        console.error('Mutation error:', error);
      },
    },
  },
});

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter>
            <Toaster />
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### **Step 2: Create Data Hooks Utilities**

**File**: `artifacts/apex-os/src/hooks/useApiData.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Generic hook for API data with loading states
export function useApiData<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime || 5 * 60 * 1000,
  });
}

// Generic mutation hook with optimistic updates
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccessMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[][];
    optimisticUpdate?: {
      queryKey: string[];
      updateFn: (oldData: any, variables: TVariables) => any;
    };
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      if (options?.optimisticUpdate) {
        await Promise.all(
          options.optimisticUpdate.queryKey.map(key => 
            queryClient.cancelQueries({ queryKey: key })
          )
        );

        // Snapshot previous value
        const previousData = options.optimisticUpdate.queryKey.map(key => 
          queryClient.getQueryData(key)
        );

        // Optimistically update
        options.optimisticUpdate.queryKey.forEach((key, index) => {
          queryClient.setQueryData(key, (old: any) => 
            options.optimisticUpdate!.updateFn(old, variables)
          );
        });

        return { previousData };
      }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach((data: any, index: number) => {
          const queryKey = options?.optimisticUpdate?.queryKey[index];
          if (queryKey) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }

      toast.error(options?.errorMessage || 'Operation failed');
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      if (options?.onSuccessMessage) {
        toast.success(options.onSuccessMessage);
      }
    },
  });
}

// Hook for paginated data
export function usePaginatedData<T>(
  queryKey: string[],
  fetchFn: (params: { page: number; limit: number; search?: string }) => Promise<{
    data: T[];
    meta: { total: number; page: number; limit: number; hasNext: boolean; hasPrev: boolean };
  }>,
  initialParams: { page?: number; limit?: number; search?: string } = {}
) {
  const [params, setParams] = React.useState({
    page: 1,
    limit: 20,
    search: '',
    ...initialParams,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetchFn(params),
    keepPreviousData: true, // Keep previous data while loading new page
  });

  const updateParams = (newParams: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  return {
    data: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
    params,
    updateParams,
    hasNextPage: data?.meta?.hasNext,
    hasPrevPage: data?.meta?.hasPrev,
    nextPage: () => updateParams({ page: params.page + 1 }),
    prevPage: () => updateParams({ page: params.page - 1 }),
    goToPage: (page: number) => updateParams({ page }),
    search: (search: string) => updateParams({ search, page: 1 }),
  };
}
```

### **Step 3: CRM Page Integration**

**File**: `artifacts/apex-os/src/pages/CRM.tsx`
```typescript
import React, { useState } from 'react';
import { useContactsQuery, useCreateContactMutation, useUpdateContactMutation, useDeleteContactMutation } from '@workspace/api-client-react';
import { usePaginatedData } from '@/hooks/useApiData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Building } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: 'active' | 'inactive';
  assignedTo?: string;
  tags?: string[];
  notes?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function CRMPage() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Contacts data with pagination
  const {
    data: contacts,
    meta,
    isLoading,
    error,
    params,
    updateParams,
    search,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedData<Contact>(
    ['contacts'],
    async ({ page, limit, search }) => {
      const response = await fetch(`/api/crm/contacts?page=${page}&limit=${limit}&search=${search || ''}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
    { page: 1, limit: 20 }
  );

  // Mutations
  const createContactMutation = useCreateContactMutation({
    onSuccess: () => {
      toast.success('Contact created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create contact');
    },
  });

  const updateContactMutation = useUpdateContactMutation({
    onSuccess: () => {
      toast.success('Contact updated successfully');
      setSelectedContact(null);
    },
    onError: (error) => {
      toast.error('Failed to update contact');
    },
  });

  const deleteContactMutation = useDeleteContactMutation({
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      setSelectedContact(null);
    },
    onError: (error) => {
      toast.error('Failed to delete contact');
    },
  });

  // Handle search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, search]);

  // Loading state
  if (isLoading && contacts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">CRM</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex space-x-4 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">CRM</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error loading contacts</h3>
              <p className="text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CRM</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {['contacts', 'leads', 'deals', 'email', 'engagements'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Filters
        </Button>
      </div>

      {/* Main Content */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {contacts.length} of {meta?.total || 0} contacts
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={!hasPrevPage}
              >
                Previous
              </Button>
              <span>
                Page {params.page} of {Math.ceil((meta?.total || 0) / params.limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Contact List */}
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={undefined} />
                        <AvatarFallback>
                          {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {contact.firstName} {contact.lastName}
                          </h3>
                          <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                            {contact.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {contact.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.company && (
                            <div className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{contact.company}</span>
                            </div>
                          )}
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {contact.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {contact.firstName} {contact.lastName}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteContactMutation.mutate(contact.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {contacts.length === 0 && (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first contact'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Other tabs - placeholder for now */}
      {activeTab !== 'contacts' && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming soon
              </h3>
              <p className="text-muted-foreground">
                This feature is currently under development.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Contact Modal */}
      {isCreateModalOpen && selectedContact && (
        <ContactModal
          contact={selectedContact}
          isOpen={true}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedContact(null);
          }}
          onSubmit={(data) => {
            if (selectedContact) {
              updateContactMutation.mutate({ id: selectedContact.id, data });
            } else {
              createContactMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}

// Contact Modal Component
function ContactModal({ 
  contact, 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  contact: Contact | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = React.useState({
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    title: contact?.title || '',
    status: contact?.status || 'active',
    notes: contact?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {contact ? 'Edit Contact' : 'Create Contact'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full p-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {contact ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### **Step 4: Dashboard Integration**

**File**: `artifacts/apex-os/src/pages/Dashboard.tsx`
```typescript
import React from 'react';
import { useMetricsQuery, useActivitiesQuery } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface Metrics {
  revenueMTD: number;
  activeProjects: number;
  leadsCount: number;
  overdueTasks: number;
  revenueGrowth: number;
  projectsGrowth: number;
  leadsGrowth: number;
  tasksGrowth: number;
}

interface Activity {
  id: string;
  type: 'contact_created' | 'deal_won' | 'task_completed' | 'invoice_paid';
  description: string;
  timestamp: string;
  user: string;
}

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useMetricsQuery();
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useActivitiesQuery();

  if (metricsLoading || activitiesLoading) {
    return <DashboardSkeleton />;
  }

  if (metricsError || activitiesError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error loading dashboard</h3>
              <p className="text-muted-foreground mt-2">
                Failed to load dashboard data. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue MTD"
          value={`$${metrics?.revenueMTD.toLocaleString() || 0}`}
          change={metrics?.revenueGrowth || 0}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Active Projects"
          value={metrics?.activeProjects || 0}
          change={metrics?.projectsGrowth || 0}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <MetricCard
          title="New Leads"
          value={metrics?.leadsCount || 0}
          change={metrics?.leadsGrowth || 0}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Overdue Tasks"
          value={metrics?.overdueTasks || 0}
          change={metrics?.tasksGrowth || 0}
          icon={<Clock className="h-4 w-4" />}
          inverse={true}
        />
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities?.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  inverse = false 
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: React.ReactNode; 
  inverse?: boolean;
}) {
  const isPositive = inverse ? change < 0 : change > 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="flex items-center space-x-2">
            {icon}
            <div className={`flex items-center text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(change)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **Step 5: Error Boundary Implementation**

**File**: `artifacts/apex-os/src/components/ErrorBoundary.tsx`
```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or other monitoring service
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex space-x-2">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **Step 6: Update App.tsx with Error Boundary**

**Update**: `artifacts/apex-os/src/App.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WouterRouter } from '@/components/WouterRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ... (QueryClient configuration remains the same)

function App() {
  // Set up token getter for custom fetch
  React.useEffect(() => {
    setAuthTokenGetter(() => {
      return localStorage.getItem('accessToken');
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter>
              <Toaster />
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </WouterRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
```

## Integration Checklist

### **Component Updates Required**
- [ ] CRM page - Replace mock data with React Query
- [ ] Dashboard page - Use real metrics and activities
- [ ] Projects page - Real project and task data
- [ ] Documents page - Real document management
- [ ] Finance page - Real invoices and payments
- [ ] Assets page - Real asset tracking
- [ ] Portal page - Real client data
- [ ] Analytics page - Real analytics data
- [ ] Settings page - Real settings management

### **Common Patterns to Apply**
- [ ] Loading states with Skeleton components
- [ ] Error handling with user-friendly messages
- [ ] Optimistic updates for better UX
- [ ] Pagination for large datasets
- [ ] Search and filtering functionality
- [ ] Real-time updates with WebSocket (future)

### **Testing Requirements**
- [ ] Unit tests for custom hooks
- [ ] Component tests with React Testing Library
- [ ] Integration tests for API flows
- [ ] Error boundary testing
- [ ] Loading state testing

### **Performance Optimizations**
- [ ] Implement proper caching strategies
- [ ] Use React.memo for expensive components
- [ ] Implement virtual scrolling for large lists
- [ ] Add image lazy loading
- [ ] Optimize bundle size with code splitting

This comprehensive frontend API integration replaces static mock data with real-time, type-safe API integration across all business pages, providing a complete production-ready user experience with proper loading states, error handling, and optimistic updates.

---

## jwt-service-implementation

**Description:** Implement JWT token service with access/refresh token rotation, secure storage patterns, and 2026 security best practices

# JWT Service Implementation

This skill guides you through implementing a JWT token service with token rotation, secure storage, and 2026 security best practices for the Apex Unified Suite.

## Current State Assessment

**Current State**: No JWT implementation exists. Token handling is completely missing from the authentication system.

**Security Requirements (2026)**:
- Short-lived access tokens (15 minutes max)
- Rotating refresh tokens (new token on each refresh)
- Secure token storage (HttpOnly cookies or memory)
- Token binding to prevent theft
- Proper revocation mechanisms

## JWT Architecture

### **Token Types**

```
┌─────────────────────────────────────────────────────────────┐
│                     Token Lifecycle                          │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  Access Token │         │ Refresh Token │                 │
│  │              │         │               │                 │
│  │  TTL: 15min  │◄────────│  TTL: 7 days  │                 │
│  │  In: Memory  │  Refresh│  In: HttpOnly │                 │
│  │  or Header   │         │  Cookie       │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                          │                        │
│         ▼                          ▼                        │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   API Calls  │         │  Token Store │                 │
│  │  Bearer Auth │         │  (Hashed)    │                 │
│  └──────────────┘         └──────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### **Token Payloads**

**Access Token** (Minimal, non-sensitive):
```typescript
interface AccessTokenPayload {
  sub: string;        // User ID
  org: string;       // Organization ID
  roles: string[];    // Role names
  iat: number;       // Issued at
  exp: number;       // Expiration
  jti: string;       // Unique token ID (for revocation)
}
```

**Refresh Token** (Single purpose):
```typescript
interface RefreshTokenPayload {
  sub: string;        // User ID
  jti: string;       // Unique token ID
  iat: number;
  exp: number;
  family: string;    // Token family (for rotation detection)
}
```

## Step-by-Step Implementation

### **Step 1: Install Dependencies**

```bash
# Add to workspace catalog first
# In pnpm-workspace.yaml catalog section:
jsonwebtoken: ^9.0.2
@types/jsonwebtoken: ^9.0.6

# Install in api-server
pnpm --filter @workspace/api-server add jsonwebtoken
pnpm --filter @workspace/api-server add -D @types/jsonwebtoken
```

### **Step 2: Create JWT Service**

**File**: `artifacts/api-server/src/services/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Result, ok, err } from 'neverthrow';
import { TokenExpired, InvalidToken } from '../errors/domain-errors';

// Token payloads
export interface AccessTokenPayload {
  sub: string;        // User ID
  org: string;       // Organization ID
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string;        // User ID
  jti: string;
  family: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

// Configuration
interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTTL: string;   // e.g., '15m'
  refreshTokenTTL: string;  // e.g., '7d'
}

export class JWTService {
  private config: JWTConfig;

  constructor() {
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets not configured');
    }

    this.config = {
      accessTokenSecret,
      refreshTokenSecret,
      accessTokenTTL: '15m',   // 2026 best practice: short-lived
      refreshTokenTTL: '7d',
    };
  }

  /**
   * Generate a new token pair for a user
   */
  generateTokenPair(
    userId: string,
    organizationId: string,
    email: string,
    role: string,
    permissions: string[]
  ): TokenPair {
    const tokenFamily = randomUUID();
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const now = Math.floor(Date.now() / 1000);
    
    // Access token - minimal payload, short expiry
    const accessTokenPayload: AccessTokenPayload = {
      sub: userId,
      org: organizationId,
      email,
      role,
      permissions,
      jti: accessJti,
    };

    const accessToken = jwt.sign(accessTokenPayload, this.config.accessTokenSecret, {
      expiresIn: this.config.accessTokenTTL,
      jwtid: accessJti,
    });

    // Refresh token - single purpose, linked to family
    const refreshTokenPayload: RefreshTokenPayload = {
      sub: userId,
      jti: refreshJti,
      family: tokenFamily,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.config.refreshTokenSecret, {
      expiresIn: this.config.refreshTokenTTL,
      jwtid: refreshJti,
    });

    // Calculate expiration dates
    const accessTokenExpiresAt = new Date(now * 1000 + 15 * 60 * 1000); // 15 minutes
    const refreshTokenExpiresAt = new Date(now * 1000 + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): Result<AccessTokenPayload, TokenExpired | InvalidToken> {
    try {
      const payload = jwt.verify(token, this.config.accessTokenSecret) as AccessTokenPayload;
      return ok(payload);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return err(new TokenExpired());
      }
      return err(new InvalidToken());
    }
  }

  /**
   * Verify a refresh token (doesn't check revocation - that's the store's job)
   */
  verifyRefreshToken(token: string): Result<RefreshTokenPayload, TokenExpired | InvalidToken> {
    try {
      const payload = jwt.verify(token, this.config.refreshTokenSecret) as RefreshTokenPayload;
      return ok(payload);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return err(new TokenExpired());
      }
      return err(new InvalidToken());
    }
  }

  /**
   * Decode without verifying (for getting JTI without validation)
   */
  decodeAccessToken(token: string): AccessTokenPayload | null {
    try {
      return jwt.decode(token) as AccessTokenPayload | null;
    } catch {
      return null;
    }
  }

  /**
   * Get token expiration from payload
   */
  getTokenExpiration(payload: AccessTokenPayload | RefreshTokenPayload): Date | null {
    if (!payload.exp) return null;
    return new Date(payload.exp * 1000);
  }
}

// Singleton instance
export const jwtService = new JWTService();
```

### **Step 3: Create Token Store for Rotation**

**File**: `artifacts/api-server/src/services/token-store.ts`

```typescript
import { db } from '@workspace/db';
import { refreshTokensTable } from '@workspace/db/schema/auth/refresh-tokens';
import { eq, and, lt } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  createdAt: Date;
  replacedBy: string | null;
  revokedAt: Date | null;
}

/**
 * Token store handles refresh token rotation and revocation
 * Uses database for persistence across server restarts
 */
export class TokenStore {
  /**
   * Store a new refresh token
   */
  async storeToken(
    userId: string,
    tokenJti: string,
    tokenFamily: string,
    expiresAt: Date
  ): Promise<void> {
    // Hash the token JTI for storage (don't store raw token)
    const tokenHash = await this.hashToken(tokenJti);
    
    await db.insert(refreshTokensTable).values({
      id: randomUUID(),
      userId,
      tokenHash,
      family: tokenFamily,
      expiresAt,
      replacedBy: null,
      revokedAt: null,
    });
  }

  /**
   * Validate a refresh token and perform rotation
   * Returns new token pair if valid, null if invalid/revoked
   */
  async validateAndRotate(
    tokenJti: string,
    tokenFamily: string
  ): Promise<StoredRefreshToken | null> {
    const tokenHash = await this.hashToken(tokenJti);
    
    // Find the token
    const tokens = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);

    if (tokens.length === 0) {
      return null; // Token not found
    }

    const token = tokens[0];

    // Check if revoked
    if (token.revokedAt) {
      // Potential token reuse attack - revoke entire family
      await this.revokeFamily(token.family);
      return null;
    }

    // Check expiration
    if (new Date() > new Date(token.expiresAt)) {
      return null;
    }

    return token;
  }

  /**
   * Mark a token as replaced by a new one
   */
  async markReplaced(tokenId: string, newTokenJti: string): Promise<void> {
    const newTokenHash = await this.hashToken(newTokenJti);
    
    await db
      .update(refreshTokensTable)
      .set({ replacedBy: newTokenHash })
      .where(eq(refreshTokensTable.id, tokenId));
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(tokenJti: string): Promise<void> {
    const tokenHash = await this.hashToken(tokenJti);
    
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.tokenHash, tokenHash));
  }

  /**
   * Revoke all tokens in a family (used when reuse detected)
   */
  async revokeFamily(family: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.family, family));
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.userId, userId));
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await db
      .delete(refreshTokensTable)
      .where(lt(refreshTokensTable.expiresAt, new Date()));
    
    return result.rowCount || 0;
  }

  /**
   * Simple hash for token storage (SHA-256)
   * Not for passwords - tokens are already cryptographically random
   */
  private async hashToken(tokenJti: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenJti);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const tokenStore = new TokenStore();
```

### **Step 4: Database Schema for Refresh Tokens**

**File**: `lib/db/src/schema/auth/refresh-tokens.ts`

```typescript
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users';
import { createInsertSchema } from 'drizzle-zod';

export const refreshTokensTable = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  family: text('family').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  replacedBy: text('replaced_by'),
  revokedAt: timestamp('revoked_at'),
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokensTable, {
  id: true,
  createdAt: true,
  replacedBy: true,
  revokedAt: true,
});
```

### **Step 5: Token Refresh Flow**

**File**: `artifacts/api-server/src/services/auth.ts` (updated refresh method)

```typescript
import { jwtService, TokenPair } from './jwt';
import { tokenStore } from './token-store';
import { Result, ok, err } from 'neverthrow';
import { TokenExpired, InvalidToken, UserNotFound } from '../errors/domain-errors';

export class AuthService {
  /**
   * Refresh token with rotation
   * 2026 best practice: Rotate refresh tokens on every use
   */
  async refreshToken(
    refreshToken: string
  ): Promise<Result<TokenPair, TokenExpired | InvalidToken | UserNotFound>> {
    // Verify the refresh token signature
    const verifyResult = jwtService.verifyRefreshToken(refreshToken);
    if (verifyResult.isErr()) {
      return err(verifyResult.error);
    }

    const payload = verifyResult.value;

    // Validate in store and check for reuse
    const storedToken = await tokenStore.validateAndRotate(
      payload.jti,
      payload.family
    );

    if (!storedToken) {
      // Token reuse detected or invalid
      return err(new InvalidToken());
    }

    // Get user info for new tokens
    const user = await this.getUserById(payload.sub);
    if (!user) {
      return err(new UserNotFound(payload.sub));
    }

    // Generate new token pair
    const newTokens = jwtService.generateTokenPair(
      user.id,
      user.organizationId,
      user.email,
      user.role,
      user.permissions
    );

    // Store new refresh token
    await tokenStore.storeToken(
      user.id,
      newTokens.refreshToken, // We need to decode to get JTI - fix this
      payload.family,
      newTokens.refreshTokenExpiresAt
    );

    // Mark old token as replaced
    const newRefreshPayload = jwtService.decodeRefreshToken(newTokens.refreshToken);
    if (newRefreshPayload) {
      await tokenStore.markReplaced(storedToken.id, newRefreshPayload.jti);
    }

    return ok(newTokens);
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<Result<void, InvalidToken>> {
    const verifyResult = jwtService.verifyRefreshToken(refreshToken);
    if (verifyResult.isErr()) {
      return err(verifyResult.error);
    }

    const payload = verifyResult.value;
    await tokenStore.revokeToken(payload.jti);

    return ok(undefined);
  }

  // ... other auth methods
}
```

### **Step 6: Secure Cookie Configuration**

**File**: `artifacts/api-server/src/middlewares/cookies.ts`

```typescript
import { Response } from 'express';

interface CookieOptions {
  accessToken?: string;
  refreshToken?: string;
  clear?: boolean;
}

/**
   * 2026 best practice: HttpOnly, Secure, SameSite cookies
   * Access token in memory/header for SPA, refresh in HttpOnly cookie
   */
export function setAuthCookies(res: Response, options: CookieOptions): void {
  if (options.clear) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return;
  }

  if (options.refreshToken) {
    // Refresh token - HttpOnly cookie
    res.cookie('refreshToken', options.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  // Access token typically sent in response body for SPAs to store in memory
  // NOT in cookies (XSS risk) and NOT in localStorage (XSS risk)
  // Store in memory (React state) and refresh silently
}
```

### **Step 7: Environment Configuration**

**File**: `.env.example`

```bash
# JWT Secrets - Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=your_access_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_different_from_access

# Token TTL
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

## 2026 Security Best Practices

### **Token Storage Strategy**

| Token | Storage | Reason |
|-------|---------|--------|
| Access Token | Memory (React state) | Short-lived, avoid XSS via localStorage |
| Refresh Token | HttpOnly Cookie | Protected from XSS, sent automatically |

### **Token Rotation Benefits**

1. **Limits Exposure Window**: Stolen tokens expire quickly
2. **Reuse Detection**: Old token use indicates theft
3. **Automatic Recovery**: New tokens issued on refresh

### **Security Checklist**

- [ ] Access tokens expire in ≤15 minutes
- [ ] Refresh tokens rotate on every use
- [ ] Refresh tokens stored hashed in database
- [ ] Token families revoked on reuse detection
- [ ] HttpOnly, Secure, SameSite=Strict cookies
- [ ] Secrets are cryptographically random (≥256 bits)
- [ ] Different secrets for access and refresh tokens
- [ ] Token IDs (JTI) used for revocation tracking

## Anti-Patterns to Avoid

❌ **Long-lived access tokens**:
```typescript
// WRONG - 24 hour access token
jwt.sign(payload, secret, { expiresIn: '24h' });
```

❌ **Storing tokens in localStorage**:
```typescript
// WRONG - vulnerable to XSS
localStorage.setItem('token', accessToken);
```

❌ **Not rotating refresh tokens**:
```typescript
// WRONG - same refresh token for 7 days
// If stolen, attacker has 7 days of access
```

❌ **Storing raw tokens in database**:
```typescript
// WRONG - store hash of token JTI, not the token
await db.insert(tokens).values({ token: refreshToken });
```

## Testing Token Rotation

```typescript
// tests/auth/token-rotation.test.ts
import { describe, it, expect } from 'vitest';
import { jwtService } from '../../src/services/jwt';
import { tokenStore } from '../../src/services/token-store';

describe('Token Rotation', () => {
  it('should rotate refresh tokens on use', async () => {
    // Generate initial tokens
    const tokens = jwtService.generateTokenPair(
      'user-123', 'org-456', 'test@example.com', 'user', []
    );

    // Store initial refresh token
    const decoded = jwtService.decodeRefreshToken(tokens.refreshToken);
    await tokenStore.storeToken(
      'user-123',
      decoded!.jti,
      decoded!.family,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    // Simulate refresh
    const newTokens = await authService.refreshToken(tokens.refreshToken);
    
    // Old token should be marked as replaced
    const oldToken = await tokenStore.findByJti(decoded!.jti);
    expect(oldToken?.replacedBy).toBeDefined();

    // Using old token again should fail (reuse detection)
    const reuseResult = await authService.refreshToken(tokens.refreshToken);
    expect(reuseResult.isErr()).toBe(true);
  });

  it('should detect token reuse and revoke family', async () => {
    // Test reuse detection logic
  });
});
```

## Verification Commands

```bash
# Verify JWT secrets are configured
grep -E "JWT_ACCESS_SECRET|JWT_REFRESH_SECRET" .env.example

# Check token expiration times
grep -r "expiresIn" artifacts/api-server/src/services/ | grep -v node_modules

# Verify no localStorage token storage
grep -r "localStorage.*token" artifacts/apex-os/src/ || echo "Clean"
```

---

## materialized-column-update

**Description:** Implement safe materialized counter updates inside database transactions to maintain aggregate data consistency when child records are modified.

# Materialized Column Update Implementation

## Overview

This skill guides the implementation of a robust system for updating materialized aggregate columns (counters, totals, percentages) in the same database transaction that modifies child records, ensuring data consistency and preventing race conditions.

## Core Architecture

### 1. Database Schema Patterns

#### Example: Project with Task Counters
```sql
-- Parent table with materialized columns
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Materialized counters
  task_count INTEGER NOT NULL DEFAULT 0,
  completed_task_count INTEGER NOT NULL DEFAULT 0,
  progress_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN task_count > 0 THEN (completed_task_count * 100.0 / task_count)
      ELSE 0
    END
  ) STORED,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Child table that triggers counter updates
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
```

### 2. Materialized Column Update Service

```typescript
// src/services/MaterializedColumnService.ts
import { Database } from 'drizzle-orm';
import { sql, eq, and } from 'drizzle-orm';
import { MaterializedUpdateError } from '../domain/errors';

export interface CounterUpdate {
  table: string;
  idColumn: string;
  id: string;
  counters: CounterField[];
}

export interface CounterField {
  column: string;
  operation: 'increment' | 'decrement' | 'set' | 'recalculate';
  value?: number;
  condition?: string; // SQL WHERE condition for conditional updates
}

export class MaterializedColumnService {
  constructor(private db: Database) {}

  /**
   * Execute atomic counter updates within a transaction
   */
  async updateCounters(
    updates: CounterUpdate[],
    tenantId: string,
    operationContext?: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      for (const update of updates) {
        await this.executeUpdate(tx, update, tenantId, operationContext);
      }
    });
  }

  /**
   * Update project counters when tasks are modified
   */
  async updateProjectTaskCounters(
    projectId: string,
    tenantId: string,
    operation: 'task_created' | 'task_updated' | 'task_deleted' | 'tasks_bulk_updated',
    taskData?: any
  ): Promise<void> {
    const updates: CounterUpdate[] = [];

    switch (operation) {
      case 'task_created':
        updates.push({
          table: 'projects',
          idColumn: 'id',
          id: projectId,
          counters: [
            {
              column: 'task_count',
              operation: 'increment',
              value: 1
            },
            {
              column: 'completed_task_count',
              operation: 'increment',
              value: taskData?.status === 'completed' ? 1 : 0
            }
          ]
        });
        break;

      case 'task_updated':
        if (taskData?.oldStatus && taskData?.newStatus) {
          // Handle completion status change
          if (taskData.oldStatus !== 'completed' && taskData.newStatus === 'completed') {
            updates.push({
              table: 'projects',
              idColumn: 'id',
              id: projectId,
              counters: [
                {
                  column: 'completed_task_count',
                  operation: 'increment',
                  value: 1
                }
              ]
            });
          } else if (taskData.oldStatus === 'completed' && taskData.newStatus !== 'completed') {
            updates.push({
              table: 'projects',
              idColumn: 'id',
              id: projectId,
              counters: [
                {
                  column: 'completed_task_count',
                  operation: 'decrement',
                  value: 1
                }
              ]
            });
          }
        }
        break;

      case 'task_deleted':
        updates.push({
          table: 'projects',
          idColumn: 'id',
          id: projectId,
          counters: [
            {
              column: 'task_count',
              operation: 'decrement',
              value: 1
            },
            {
              column: 'completed_task_count',
              operation: 'decrement',
              value: taskData?.status === 'completed' ? 1 : 0
            }
          ]
        });
        break;

      case 'tasks_bulk_updated':
        // For bulk operations, recalculate from scratch
        updates.push({
          table: 'projects',
          idColumn: 'id',
          id: projectId,
          counters: [
            {
              column: 'task_count',
              operation: 'recalculate'
            },
            {
              column: 'completed_task_count',
              operation: 'recalculate'
            }
          ]
        });
        break;
    }

    if (updates.length > 0) {
      await this.updateCounters(updates, tenantId, `project_task_${operation}`);
    }
  }

  /**
   * Execute a single counter update
   */
  private async executeUpdate(
    tx: Database,
    update: CounterUpdate,
    tenantId: string,
    operationContext?: string
  ): Promise<void> {
    const { table, idColumn, id, counters } = update;

    // Build the update query dynamically
    let updateQuery = `UPDATE ${table} SET updated_at = now()`;
    const updateValues: any[] = [];

    for (const counter of counters) {
      switch (counter.operation) {
        case 'increment':
          updateQuery += `, ${counter.column} = COALESCE(${counter.column}, 0) + $${updateValues.length + 1}`;
          updateValues.push(counter.value || 1);
          break;

        case 'decrement':
          updateQuery += `, ${counter.column} = GREATEST(COALESCE(${counter.column}, 0) - $${updateValues.length + 1}, 0)`;
          updateValues.push(counter.value || 1);
          break;

        case 'set':
          updateQuery += `, ${counter.column} = $${updateValues.length + 1}`;
          updateValues.push(counter.value);
          break;

        case 'recalculate':
          const recalcQuery = this.getRecalculationQuery(table, counter.column);
          if (recalcQuery) {
            updateQuery += `, ${counter.column} = (${recalcQuery})`;
          }
          break;
      }
    }

    updateQuery += ` WHERE ${idColumn} = $${updateValues.length + 1}`;
    updateValues.push(id);

    // Add tenant isolation
    updateQuery += ` AND tenant_id = $${updateValues.length + 1}`;
    updateValues.push(tenantId);

    try {
      await tx.execute(sql.raw(updateQuery, updateValues));
    } catch (error) {
      throw new MaterializedUpdateError(
        `Failed to update counters for ${table}(${id}): ${error.message}`,
        { table, id, counters, operationContext }
      );
    }
  }

  /**
   * Get recalculation query for specific counter columns
   */
  private getRecalculationQuery(table: string, column: string): string | null {
    const queries: Record<string, Record<string, string>> = {
      'projects': {
        'task_count': `
          SELECT COUNT(*) 
          FROM tasks 
          WHERE tasks.project_id = projects.id 
            AND tasks.tenant_id = projects.tenant_id
            AND tasks.status != 'cancelled'
        `,
        'completed_task_count': `
          SELECT COUNT(*) 
          FROM tasks 
          WHERE tasks.project_id = projects.id 
            AND tasks.tenant_id = projects.tenant_id
            AND tasks.status = 'completed'
        `
      },
      'clients': {
        'project_count': `
          SELECT COUNT(*) 
          FROM projects 
          WHERE projects.client_id = clients.id 
            AND projects.tenant_id = clients.tenant_id
            AND projects.status != 'archived'
        `,
        'active_project_count': `
          SELECT COUNT(*) 
          FROM projects 
          WHERE projects.client_id = clients.id 
            AND projects.tenant_id = clients.tenant_id
            AND projects.status = 'active'
        `
      },
      'organizations': {
        'user_count': `
          SELECT COUNT(*) 
          FROM users 
          WHERE users.organization_id = organizations.id 
            AND users.tenant_id = organizations.tenant_id
            AND users.is_active = true
        `,
        'project_count': `
          SELECT COUNT(*) 
          FROM projects 
          WHERE projects.organization_id = organizations.id 
            AND projects.tenant_id = organizations.tenant_id
            AND projects.status != 'archived'
        `
      }
    };

    return queries[table]?.[column] || null;
  }

  /**
   * Recalculate all counters for a specific entity
   */
  async recalculateAllCounters(
    table: string,
    id: string,
    tenantId: string
  ): Promise<void> {
    const counterColumns = this.getCounterColumns(table);
    
    const update: CounterUpdate = {
      table,
      idColumn: 'id',
      id,
      counters: counterColumns.map(column => ({
        column,
        operation: 'recalculate' as const
      }))
    };

    await this.updateCounters([update], tenantId, 'full_recalculation');
  }

  /**
   * Get all counter columns for a table
   */
  private getCounterColumns(table: string): string[] {
    const columns: Record<string, string[]> = {
      'projects': ['task_count', 'completed_task_count'],
      'clients': ['project_count', 'active_project_count', 'invoice_count'],
      'organizations': ['user_count', 'project_count', 'client_count'],
      'invoices': ['payment_count', 'allocated_amount'],
      'documents': ['version_count', 'download_count']
    };

    return columns[table] || [];
  }

  /**
   * Bulk recalculate counters for multiple entities
   */
  async bulkRecalculateCounters(
    table: string,
    ids: string[],
    tenantId: string
  ): Promise<void> {
    const counterColumns = this.getCounterColumns(table);
    
    for (const id of ids) {
      await this.recalculateAllCounters(table, id, tenantId);
    }
  }

  /**
   * Verify counter consistency (for debugging/auditing)
   */
  async verifyCounterConsistency(
    table: string,
    id: string,
    tenantId: string
  ): Promise<ConsistencyReport> {
    const counterColumns = this.getCounterColumns(table);
    const report: ConsistencyReport = {
      table,
      id,
      consistent: true,
      discrepancies: []
    };

    for (const column of counterColumns) {
      const recalcQuery = this.getRecalculationQuery(table, column);
      if (!recalcQuery) continue;

      // Get current value
      const currentResult = await this.db.execute(sql.raw(`
        SELECT ${column} FROM ${table} 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]));

      // Get calculated value
      const calculatedResult = await this.db.execute(sql.raw(`
        SELECT (${recalcQuery}) as calculated_value 
        FROM ${table} 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]));

      const currentValue = currentResult[0]?.[column];
      const calculatedValue = calculatedResult[0]?.calculated_value;

      if (currentValue !== calculatedValue) {
        report.consistent = false;
        report.discrepancies.push({
          column,
          currentValue,
          calculatedValue,
          difference: (currentValue || 0) - (calculatedValue || 0)
        });
      }
    }

    return report;
  }
}
```

### 3. Repository Integration

```typescript
// src/repositories/TaskRepository.ts
import { Database } from 'drizzle-orm';
import { tasks, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { MaterializedColumnService } from '../services/MaterializedColumnService';

export class TaskRepository {
  constructor(
    private db: Database,
    private materializedService: MaterializedColumnService
  ) {}

  /**
   * Create a new task with automatic counter updates
   */
  async createTask(
    taskData: CreateTaskRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Task> {
    return await this.db.transaction(async (tx) => {
      // Create the task
      const task = await tx.insert(tasks).values({
        tenantId,
        projectId: taskData.projectId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        createdBy
      }).returning();

      const createdTask = task[0];

      // Update project counters
      await this.materializedService.updateProjectTaskCounters(
        createdTask.project_id,
        tenantId,
        'task_created',
        {
          status: createdTask.status
        }
      );

      return createdTask;
    });
  }

  /**
   * Update task status with automatic counter updates
   */
  async updateTaskStatus(
    taskId: string,
    newStatus: string,
    tenantId: string
  ): Promise<Task> {
    return await this.db.transaction(async (tx) => {
      // Get current task
      const currentTask = await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenant_id, tenantId)
        ))
        .limit(1);

      if (!currentTask[0]) {
        throw new NotFoundError('Task not found');
      }

      const oldStatus = currentTask[0].status;

      // Update task
      const updated = await tx
        .update(tasks)
        .set({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Update project counters if status changed
      if (oldStatus !== newStatus) {
        await this.materializedService.updateProjectTaskCounters(
          currentTask[0].project_id,
          tenantId,
          'task_updated',
          {
            oldStatus,
            newStatus
          }
        );
      }

      return updated[0];
    });
  }

  /**
   * Delete a task with automatic counter updates
   */
  async deleteTask(
    taskId: string,
    tenantId: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get task before deletion
      const task = await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenant_id, tenantId)
        ))
        .limit(1);

      if (!task[0]) {
        throw new NotFoundError('Task not found');
      }

      // Delete the task
      await tx
        .delete(tasks)
        .where(eq(tasks.id, taskId));

      // Update project counters
      await this.materializedService.updateProjectTaskCounters(
        task[0].project_id,
        tenantId,
        'task_deleted',
        {
          status: task[0].status
        }
      );
    });
  }

  /**
   * Bulk update tasks with recalculation
   */
  async bulkUpdateTasks(
    updates: { id: string; status: string }[],
    tenantId: string
  ): Promise<Task[]> {
    return await this.db.transaction(async (tx) => {
      const updatedTasks: Task[] = [];
      const affectedProjectIds = new Set<string>();

      for (const update of updates) {
        // Get current task
        const currentTask = await tx
          .select()
          .from(tasks)
          .where(and(
            eq(tasks.id, update.id),
            eq(tasks.tenant_id, tenantId)
          ))
          .limit(1);

        if (currentTask[0]) {
          // Update task
          const updated = await tx
            .update(tasks)
            .set({
              status: update.status,
              completedAt: update.status === 'completed' ? new Date() : null,
              updatedAt: new Date()
            })
            .where(eq(tasks.id, update.id))
            .returning();

          updatedTasks.push(updated[0]);
          affectedProjectIds.add(currentTask[0].project_id);
        }
      }

      // Recalculate counters for all affected projects
      for (const projectId of affectedProjectIds) {
        await this.materializedService.updateProjectTaskCounters(
          projectId,
          tenantId,
          'tasks_bulk_updated'
        );
      }

      return updatedTasks;
    });
  }
}
```

### 4. API Integration

```typescript
// src/routes/tasks.ts
import { Router } from 'express';
import { TaskRepository } from '../repositories/TaskRepository';
import { validateRequest } from '../middleware/validation';

const router = Router();

// POST /api/tasks - Create task
router.post('/', validateRequest(createTaskSchema), async (req, res, next) => {
  try {
    const task = await taskRepository.createTask(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', validateRequest(updateStatusSchema), async (req, res, next) => {
  try {
    const task = await taskRepository.updateTaskStatus(
      req.params.id,
      req.body.status,
      req.tenant.id
    );

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    await taskRepository.deleteTask(req.params.id, req.tenant.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Identify all materialized counter columns in your schema
- [ ] Create MaterializedColumnService with update logic
- [ ] Implement recalculation queries for each counter type
- [ ] Integrate counter updates into repository methods
- [ ] Add transaction support for atomic updates
- [ ] Create bulk recalculation methods
- [ ] Add consistency verification utilities
- [ ] Implement audit logging for counter changes
- [ ] Add monitoring for counter update performance
- [ ] Create comprehensive test coverage

## Testing Requirements

### Unit Tests
- Test counter increment/decrement operations
- Test recalculation queries accuracy
- Test transaction rollback scenarios
- Test bulk update operations

### Integration Tests
- Test end-to-end counter updates
- Test concurrent modification scenarios
- Test data consistency under load
- Test error handling and recovery

### Consistency Tests
- Run consistency verification after operations
- Test counter accuracy after bulk operations
- Verify calculated vs stored values match

## Performance Considerations

- Use database transactions for atomicity
- Optimize recalculation queries with proper indexes
- Consider caching for frequently accessed counters
- Batch updates for bulk operations
- Monitor counter update performance

## Security Considerations

- Tenant isolation enforced in all queries
- Input validation for counter values
- Audit trail for counter modifications
- Rate limiting on bulk operations

## Monitoring

- Track counter update success rates
- Monitor transaction rollback frequency
- Alert on consistency discrepancies
- Track performance of recalculation queries
- Monitor database lock contention

---

## monorepo-structure

**Description:** Guide for understanding and working with YDM's pnpm workspace monorepo architecture, including package management, build systems, and development workflows

# Monorepo Structure Management

This skill guides you through working with YDM's sophisticated pnpm workspace monorepo architecture.

## Understanding the Workspace Structure

### Package Categories

**Artifacts (Deployable Applications)**
- `@workspace/api-server`: Express.js backend with esbuild
- `@workspace/nexus-digital`: React frontend with Vite
- `@workspace/mockup-sandbox`: Component preview system

**Libraries (Shared Code)**
- `@workspace/api-spec`: OpenAPI specification and Orval config
- `@workspace/api-client-react`: Generated React Query hooks
- `@workspace/api-zod`: Generated Zod validation schemas
- `@workspace/db`: Drizzle ORM models and database config

**Development Tools**
- `@workspace/scripts`: Build automation and Git hooks
- `lib/integrations/*`: External service integrations (empty currently)

### Workspace Configuration

**pnpm-workspace.yaml**
- Defines package patterns: artifacts/*, lib/*, lib/integrations/*, scripts/*
- Centralized dependency catalog for version consistency
- Security policies with supply chain protection
- Build optimization settings

**tsconfig.json**
- Project references for incremental builds
- Library packages use composite: true
- Path aliases for clean imports

## Common Development Workflows

### Initial Setup

1. **Install Dependencies**
   ```bash
   pnpm install --frozen-lockfile
   ```

2. **Type Check All Packages**
   ```bash
   pnpm run typecheck
   ```

3. **Build All Packages**
   ```bash
   pnpm run build
   ```

### Package-Specific Operations

**API Server Development**
```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run typecheck
```

**Frontend Development**
```bash
pnpm --filter @workspace/nexus-digital run dev
pnpm --filter @workspace/nexus-digital run build
pnpm --filter @workspace/nexus-digital run typecheck
```

**Database Operations**
```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run push-force
```

### Code Generation Workflow

1. **Update OpenAPI Specification**
   - Edit `lib/api-spec/openapi.yaml`
   - Add new endpoints or modify existing ones

2. **Generate Code**
   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

3. **Validate Integration**
   ```bash
   pnpm run typecheck
   ```

## Dependency Management

### Using the Catalog

The centralized catalog in `pnpm-workspace.yaml` manages shared dependencies:

```yaml
catalog:
  react: 19.1.0
  typescript: 5.9.2
  vite: 7.3.2
  tailwindcss: 4.1.14
```

### Adding New Dependencies

**For Shared Dependencies** (used across multiple packages):
1. Add to catalog in pnpm-workspace.yaml
2. Update individual package.json to reference catalog

**For Package-Specific Dependencies**:
1. Add to specific package.json
2. Use exact versions for consistency

### Internal Dependencies

Use workspace protocol for internal packages:
```json
{
  "dependencies": {
    "@workspace/api-client-react": "workspace:*",
    "@workspace/api-zod": "workspace:*"
  }
}
```

## Build System Architecture

### Build Order

1. **Libraries First**: Shared libraries build before applications
2. **Parallel Builds**: Applications build in parallel after libraries
3. **TypeScript Validation**: Full workspace typecheck before builds

### Build Commands

```bash
# Type check all packages
pnpm run typecheck

# Build all packages (typecheck + parallel build)
pnpm run build

# Type check libraries only
pnpm run typecheck:libs
```

### TypeScript Project References

- Root tsconfig.json references all packages
- Library packages use composite: true
- Incremental builds for better performance
- Cross-package type validation

## Security Configuration

### Supply Chain Protection

- **minimumReleaseAge**: 1440 minutes (1 day) for all packages
- **Exclusions**: Only @replit/* packages bypass release age
- **Platform Filtering**: Extensive package exclusions by platform

### Platform-Specific Exclusions

- Native modules excluded (sharp, bcrypt, sqlite3)
- Cloud SDKs excluded (@aws-sdk, @azure, @google-cloud)
- Build tools optimized for linux-x64 (Replit platform)

## Development Best Practices

### Code Organization

- **Single Responsibility**: Each package has clear purpose
- **Dependency Direction**: Artifacts depend on libraries, never vice versa
- **Type Safety**: End-to-end typing through code generation
- **Shared Code**: Common functionality in library packages

### Workflow Patterns

1. **API-First Development**: Update OpenAPI spec before implementation
2. **Code Generation**: Always run codegen after API changes
3. **Type Validation**: Run typecheck before committing
4. **Incremental Builds**: Leverage TypeScript project references

### Common Pitfalls to Avoid

- **Circular Dependencies**: Ensure clean dependency graph
- **Manual Type Definitions**: Use generated types, not manual interfaces
- **Bypassing Workspace**: Use pnpm commands, not individual npm installs
- **Generated File Edits**: Never edit files in lib/api-client-react or lib/api-zod

## Troubleshooting

### Common Issues

**Type Errors Across Packages**
```bash
# Run full workspace typecheck
pnpm run typecheck

# Check specific package
pnpm --filter @workspace/package-name run typecheck
```

**Build Failures**
```bash
# Clean build
pnpm run build

# Check individual package
pnpm --filter @workspace/package-name run build
```

**Dependency Issues**
```bash
# Reinstall with frozen lockfile
pnpm install --frozen-lockfile

# Check workspace graph
pnpm list --depth=0
```

### Git Hooks

**Post-Merge Hook** (scripts/post-merge.sh):
- Automatically runs on git merge
- Installs dependencies: `pnpm install --frozen-lockfile`
- Pushes database changes: `pnpm --filter db push`

## Environment Setup

### Required Environment Variables

- **PORT**: Server port (validated in Vite config)
- **BASE_PATH**: Frontend base path for routing
- **NODE_ENV**: Environment mode (development/production)
- **DATABASE_URL**: PostgreSQL connection string
- **REPL_ID**: Replit environment identifier (for conditional plugins)

### Development vs Production

**Development**:
- Replit plugins loaded (Cartographer, Dev Banner, Runtime Error Modal)
- Hot reload enabled
- Source maps generated
- Verbose logging

**Production**:
- Optimized builds
- No development plugins
- Minified output
- Performance optimizations

This monorepo structure provides excellent scalability, type safety, and developer experience for complex full-stack applications.

---

## multi-tenancy-strategy

**Description:** Implement multi-tenancy architecture patterns for Apex Unified Suite SaaS platform with hybrid tenancy models and tenant isolation.

# Multi-Tenancy Strategy Implementation

## Purpose
Design and implement multi-tenant architecture that serves multiple customers from a single codebase while ensuring data isolation, security, and scalability for Apex Unified Suite's 10 business domains.

## When to Use This Skill
- Designing tenant isolation strategies
- Planning database schema for multi-tenancy
- Implementing tenant-aware authentication and authorization
- Setting up tenant-specific configurations
- Scaling infrastructure for multiple tenants

## Prerequisites
- Understanding of database design patterns
- Knowledge of Apex Unified Suite business domains
- Familiarity with PostgreSQL and Drizzle ORM
- Understanding of SaaS compliance requirements

## Implementation Steps

### 1. Choose Tenancy Model
Based on 2026 SaaS best practices, implement hybrid tenancy:

```typescript
// lib/db/src/tenancy/types.ts
export enum TenancyModel {
  SHARED_SCHEMA = 'shared_schema',        // Row-level isolation for standard tier
  SCHEMA_PER_TENANT = 'schema_per_tenant', // Separate schema per tenant
  DATABASE_PER_TENANT = 'database_per_tenant', // Separate database per tenant
  HYBRID = 'hybrid'                     // Mix based on tier/compliance
}

export interface TenantConfig {
  id: string;
  name: string;
  tier: 'standard' | 'premium' | 'enterprise';
  tenancyModel: TenancyModel;
  database?: {
    host: string;
    name: string;
    schema?: string;
  };
  compliance: {
    dataIsolation: 'strict' | 'standard';
    auditRetention: number; // days
  };
}
```

### 2. Implement Tenant Detection
Create tenant resolution middleware:

```typescript
// lib/api-server/src/middleware/tenant-resolution.ts
import { Request, Response, NextFunction } from 'express';
import { TenantConfig } from '@workspace/db/src/tenancy/types';

export interface TenantRequest extends Request {
  tenant?: TenantConfig;
  tenantId?: string;
}

export function tenantResolution(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  // Extract tenant from subdomain or header
  const tenantId = extractTenantId(req);
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant identifier required' });
  }

  const tenant = await getTenantConfig(tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  req.tenant = tenant;
  req.tenantId = tenantId;
  
  next();
}

function extractTenantId(req: Request): string | null {
  // Priority: subdomain > header > query param
  const subdomain = req.hostname?.split('.')[0];
  const header = req.headers['x-tenant-id'] as string;
  const query = req.query.tenant as string;
  
  return subdomain || header || query;
}
```

### 3. Set Up Database Connection Pooling
Implement tenant-aware database connections:

```typescript
// lib/db/src/tenancy/connection-manager.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import { TenantConfig, TenancyModel } from './types';

class TenantConnectionManager {
  private pools = new Map<string, Pool>();
  private schemas = new Map<string, any>();

  async getConnection(tenantId: string): Promise<any> {
    const tenant = await getTenantConfig(tenantId);
    
    switch (tenant.tenancyModel) {
      case TenancyModel.SHARED_SCHEMA:
        return this.getSharedConnection(tenant);
      
      case TenancyModel.SCHEMA_PER_TENANT:
        return this.getSchemaConnection(tenant);
      
      case TenancyModel.DATABASE_PER_TENANT:
        return this.getDatabaseConnection(tenant);
      
      default:
        throw new Error(`Unsupported tenancy model: ${tenant.tenancyModel}`);
    }
  }

  private async getSharedConnection(tenant: TenantConfig) {
    const poolKey = 'shared';
    if (!this.pools.has(poolKey)) {
      const pool = new Pool({
        host: process.env.DB_HOST,
        database: tenant.database!.name,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 20,
      });
      this.pools.set(poolKey, pool);
    }
    
    const pool = this.pools.get(poolKey)!;
    const schema = tenant.database!.schema || 'public';
    return drizzle(pool, { schema });
  }

  private async getSchemaConnection(tenant: TenantConfig) {
    const poolKey = `schema_${tenant.id}`;
    if (!this.pools.has(poolKey)) {
      const pool = new Pool({
        host: process.env.DB_HOST,
        database: tenant.database!.name,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 10, // Lower max per tenant
      });
      this.pools.set(poolKey, pool);
    }
    
    const pool = this.pools.get(poolKey)!;
    return drizzle(pool, { 
      schema: tenant.database!.schema || `tenant_${tenant.id}` 
    });
  }
}

export const connectionManager = new TenantConnectionManager();
```

### 4. Create Tenant-Aware Schema Design
Implement row-level security for shared schema:

```typescript
// lib/db/src/schema/tenancy.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  tier: text('tier').notNull(),
  tenancyModel: text('tenancy_model').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Base table with tenant isolation
export function createTenantTable<T extends any>(
  tableName: string,
  columns: T,
  additionalConfig?: any
) {
  return pgTable(tableName, {
    ...columns,
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    ...additionalConfig,
  });
}

// Example: CRM leads with tenant isolation
export const leads = createTenantTable('leads', {
  id: uuid('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  status: text('status').notNull(),
  value: text('value'),
}, (table) => ({
  indexes: [index('idx_leads_tenant_status').on(table.tenantId, table.status)],
}));
```

### 5. Implement Tenant-Aware Repositories
Create base repository pattern with tenant filtering:

```typescript
// lib/db/src/repositories/base-tenant-repository.ts
import { connectionManager } from '../tenancy/connection-manager';

export abstract class BaseTenantRepository<T> {
  protected abstract tableName: string;
  protected abstract db: any;

  constructor(private tenantId: string) {
    this.db = connectionManager.getConnection(tenantId);
  }

  protected async withTenantFilter() {
    return this.db.select().from(this.tableName).where(eq(tenantId, this.tenantId));
  }

  async create(data: Omit<T, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const enrichedData = {
      ...data,
      tenantId: this.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return this.db.insert(this.tableName).values(enrichedData).returning();
  }

  async findById(id: string): Promise<T | null> {
    return this.withTenantFilter().where(eq(id, id)).limit(1);
  }

  async findMany(filter: Partial<T> = {}): Promise<T[]> {
    return this.withTenantFilter().where(filter);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.db
      .update(this.tableName)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(id, id), eq(tenantId, this.tenantId)))
      .returning();
  }

  async delete(id: string): Promise<void> {
    return this.db
      .delete(this.tableName)
      .where(and(eq(id, id), eq(tenantId, this.tenantId)));
  }
}
```

### 6. Set Up Tenant Migration System
Create tenant-aware database migrations:

```typescript
// lib/db/src/migrations/tenant-migrations.ts
export class TenantMigrationRunner {
  async runMigrationsForTenant(tenantId: string): Promise<void> {
    const tenant = await getTenantConfig(tenantId);
    const db = await connectionManager.getConnection(tenantId);
    
    // Run standard migrations for this tenant
    await this.runMigrations(db, tenant);
  }

  async runMigrationsForAllTenants(): Promise<void> {
    const tenants = await getAllTenants();
    
    for (const tenant of tenants) {
      try {
        await this.runMigrationsForTenant(tenant.id);
        console.log(`Migrations completed for tenant: ${tenant.name}`);
      } catch (error) {
        console.error(`Migration failed for tenant ${tenant.id}:`, error);
        // Continue with other tenants
      }
    }
  }

  private async runMigrations(db: any, tenant: TenantConfig): Promise<void> {
    // Use Drizzle migration with tenant-specific schema
    if (tenant.tenancyModel === TenancyModel.SCHEMA_PER_TENANT) {
      await migrate(db, { 
        migrationsFolder: './migrations',
        schema: tenant.database?.schema 
      });
    } else {
      await migrate(db, { 
        migrationsFolder: './migrations',
        schema: 'public' 
      });
    }
  }
}
```

### 7. Implement Tenant Configuration Management
Create tenant provisioning and management:

```typescript
// lib/api-server/src/services/tenant-service.ts
export class TenantService {
  async createTenant(data: CreateTenantRequest): Promise<TenantConfig> {
    const tenant = await this.db.insert(tenants).values({
      id: generateId(),
      name: data.name,
      domain: data.domain,
      tier: data.tier,
      tenancyModel: this.selectTenancyModel(data.tier, data.compliance),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning().get();

    // Provision tenant resources
    await this.provisionTenantResources(tenant);
    
    return tenant;
  }

  private selectTenancyModel(
    tier: string, 
    compliance: { dataIsolation: string }
  ): TenancyModel {
    // Enterprise with strict compliance gets database-per-tenant
    if (tier === 'enterprise' && compliance.dataIsolation === 'strict') {
      return TenancyModel.DATABASE_PER_TENANT;
    }
    
    // Premium gets schema-per-tenant
    if (tier === 'premium') {
      return TenancyModel.SCHEMA_PER_TENANT;
    }
    
    // Standard gets shared schema
    return TenancyModel.SHARED_SCHEMA;
  }

  private async provisionTenantResources(tenant: TenantConfig): Promise<void> {
    switch (tenant.tenancyModel) {
      case TenancyModel.DATABASE_PER_TENANT:
        await this.createTenantDatabase(tenant);
        break;
      case TenancyModel.SCHEMA_PER_TENANT:
        await this.createTenantSchema(tenant);
        break;
      case TenancyModel.SHARED_SCHEMA:
        // No provisioning needed for shared
        break;
    }
  }
}
```

## Verification Steps

### 1. Test Tenant Isolation
```bash
# Create test tenants
curl -X POST http://localhost:8081/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Corp", "domain": "testcorp.apex.com", "tier": "standard"}'

# Test data isolation
curl -X GET http://testcorp.apex.com:8081/api/crm/leads
curl -X GET http://anothercorp.apex.com:8081/api/crm/leads

# Verify no data leakage between tenants
```

### 2. Verify Database Performance
```bash
# Check connection pooling
psql -h localhost -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor query performance per tenant
psql -h localhost -U postgres -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### 3. Test Compliance Requirements
```bash
# Verify data isolation for enterprise tenants
pnpm --filter @workspace/db run test:tenant-isolation

# Check audit trail functionality
pnpm --filter @workspace/api-server run test:audit-trail
```

## Security Considerations

### Data Isolation
- **Row-level security**: Always filter by tenant_id in shared schemas
- **Schema separation**: Use separate schemas for premium tenants
- **Database separation**: Complete isolation for enterprise with compliance needs

### Access Control
- **Tenant-scoped authentication**: JWT tokens include tenant_id claim
- **Cross-tenant prevention**: Database constraints prevent cross-tenant access
- **Audit logging**: Log all tenant data access

### Performance Protection
- **Noisy neighbor prevention**: Resource quotas per tenant
- **Connection pooling**: Limit connections per tenant
- **Query optimization**: Tenant-specific indexes and query patterns

## Scaling Strategies

### Infrastructure Scaling
```typescript
// lib/api-server/src/config/tenant-scaling.ts
export const TENANT_LIMITS = {
  [TenancyModel.SHARED_SCHEMA]: {
    maxTenants: 1000,
    maxConnections: 100,
    resourceQuota: 'standard'
  },
  [TenancyModel.SCHEMA_PER_TENANT]: {
    maxTenants: 100,
    maxConnections: 50,
    resourceQuota: 'premium'
  },
  [TenancyModel.DATABASE_PER_TENANT]: {
    maxTenants: 10,
    maxConnections: 20,
    resourceQuota: 'enterprise'
  }
};
```

### Cost Optimization
- **Hybrid approach**: Standard tenants share infrastructure, enterprise gets isolation
- **Auto-tier migration**: Upgrade tenants to appropriate tenancy model
- **Resource monitoring**: Track per-tenant resource usage

## File Structure
```
lib/
├── db/
│   ├── src/
│   │   ├── tenancy/
│   │   │   ├── types.ts
│   │   │   ├── connection-manager.ts
│   │   │   └── migration-runner.ts
│   │   ├── schema/
│   │   │   ├── tenancy.ts
│   │   │   └── [domain-tables].ts
│   │   └── repositories/
│   │       └── base-tenant-repository.ts
├── api-server/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── tenant-resolution.ts
│   │   ├── services/
│   │   │   └── tenant-service.ts
│   │   └── routes/
│   │       └── tenants.ts
└── migrations/
    ├── shared/
    ├── schema-per-tenant/
    └── database-per-tenant/
```

## Success Metrics
- **Zero Data Leakage**: No cross-tenant data access
- **Performance SLA**: <200ms response time for 95% of requests
- **Compliance Adherence**: 100% for enterprise tenants
- **Cost Efficiency**: Infrastructure costs scale sub-linearly with tenant count
- **Provisioning Time**: <5 minutes to onboard new tenant

## Integration with Existing Skills
This skill works with:
- `database-schema-development` for tenant-aware table creation
- `authentication-implementation` for tenant-scoped auth
- `api-business-endpoints` for tenant management APIs
- `security-hardening` for isolation best practices

## Related Documentation
- [Azure SaaS Tenancy Patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns) - Database design patterns
- [Multi-Tenant Architecture Guide](https://www.arielsoftwares.com/multi-tenant-architecture-saas-guide/) - 2026 updated strategies
- [Apex Architecture Guide](./ydm-architecture.md) - Project-specific implementation

---

## password-security-implementation

**Description:** Implement password hashing with Argon2id using 2026 security best practices, including parameter selection and migration strategies

# Password Security Implementation

This skill guides you through implementing secure password hashing using Argon2id, the winner of the Password Hashing Competition and 2026 best practice for new applications.

## Current State Assessment

**Current State**: No password hashing implementation exists.

**2026 Recommendation**: Use Argon2id over bcrypt for new implementations.

**Why Argon2id?**
- Winner of Password Hashing Competition (2015)
- Memory-hard algorithm (resistant to GPU/ASIC attacks)
- Configurable memory usage (unlike bcrypt's fixed ~4KB)
- Three variants: Argon2d, Argon2i, Argon2id (use Argon2id)

## Argon2id vs bcrypt Comparison

### **Core Difference: Memory-Hardness**

| Feature | bcrypt | Argon2id |
|---------|--------|----------|
| Memory Usage | Fixed ~4KB | Configurable (64MB+ typical) |
| GPU Resistance | Moderate | High (memory bandwidth bound) |
| ASIC Resistance | Low | High (requires physical RAM) |
| Password Limit | 72 bytes | No limit |
| Standard | Established | PHC Winner |

### **Cost Parameter Selection (2026)**

The rule: **Pick the highest cost that still hashes in ~250ms on your production hardware**.

**Argon2id Recommended Settings**:
```typescript
const argon2Config = {
  type: argon2id,           // Use Argon2id variant
  memoryCost: 65536,        // 64 MB (in KB)
  timeCost: 3,              // 3 iterations
  parallelism: 4,             // 4 parallel threads
  hashLength: 32,             // 256-bit output
  saltLength: 16,             // 128-bit salt
};
// Target: ~250ms on production hardware
```

**Benchmark First**:
```typescript
import argon2 from 'argon2';

async function benchmarkArgon2() {
  const password = 'test-password';
  const configs = [
    { memoryCost: 65536, timeCost: 3, parallelism: 4 },   // 64MB
    { memoryCost: 131072, timeCost: 3, parallelism: 4 },    // 128MB
    { memoryCost: 65536, timeCost: 4, parallelism: 4 },    // More iterations
  ];

  for (const config of configs) {
    const start = Date.now();
    await argon2.hash(password, config);
    const duration = Date.now() - start;
    console.log(`Config ${JSON.stringify(config)}: ${duration}ms`);
  }
}
```

## Step-by-Step Implementation

### **Step 1: Install Dependencies**

Add to workspace catalog first:

```yaml
# In pnpm-workspace.yaml catalog:
argon2: ^0.40.1
```

Install in api-server:
```bash
pnpm --filter @workspace/api-server add argon2
```

### **Step 2: Create Password Service**

**File**: `artifacts/api-server/src/services/password.ts`

```typescript
import argon2 from 'argon2';
import { Result, ok, err } from 'neverthrow';
import { WeakPassword } from '../errors/domain-errors';

// Argon2id configuration
// Target: ~250ms hash time on production hardware
const ARGON2_CONFIG = {
  type: argon2.argon2id,      // Use Argon2id variant
  memoryCost: 65536,           // 64 MB (in KB)
  timeCost: 3,                 // 3 iterations
  parallelism: 4,              // 4 parallel threads
  hashLength: 32,              // 256-bit hash output
};

// Password strength requirements
const PASSWORD_CONFIG = {
  minLength: 12,               // 2026 minimum: 12 characters
  maxLength: 128,              // Prevent DoS with extremely long passwords
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordService {
  /**
   * Hash a password using Argon2id
   */
  async hashPassword(plainPassword: string): Promise<string> {
    // Argon2 handles salt generation internally
    return await argon2.hash(plainPassword, ARGON2_CONFIG);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(
    plainPassword: string, 
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      // If hash is malformed or verification fails
      return false;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Length check
    if (password.length < PASSWORD_CONFIG.minLength) {
      errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters`);
    }
    if (password.length > PASSWORD_CONFIG.maxLength) {
      errors.push(`Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`);
    }

    // Character variety checks
    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (PASSWORD_CONFIG.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (PASSWORD_CONFIG.requireSpecialChars) {
      const hasSpecial = new RegExp(`[${PASSWORD_CONFIG.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password);
      if (!hasSpecial) {
        errors.push('Password must contain at least one special character');
      }
    }

    // Common password check (basic)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash with validation - convenience method
   */
  async hashWithValidation(
    plainPassword: string
  ): Promise<Result<string, WeakPassword>> {
    const validation = this.validatePasswordStrength(plainPassword);
    
    if (!validation.isValid) {
      return err(new WeakPassword(validation.errors.join(', ')));
    }

    const hash = await this.hashPassword(plainPassword);
    return ok(hash);
  }

  /**
   * Check if password needs rehash (for algorithm upgrades)
   * Argon2 encoded hashes contain the parameters used
   */
  async needsRehash(hashedPassword: string): Promise<boolean> {
    return await argon2.needsRehash(hashedPassword, ARGON2_CONFIG);
  }
}

// Singleton instance
export const passwordService = new PasswordService();
```

### **Step 3: Rehash-on-Login Pattern**

For future algorithm upgrades, implement automatic rehashing:

**File**: `artifacts/api-server/src/services/auth.ts`

```typescript
import { passwordService } from './password';

export class AuthService {
  async authenticateUser(
    email: string, 
    password: string
  ): Promise<Result<AuthResult, InvalidCredentials>> {
    // Fetch user with password hash
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Timing attack protection: still hash to maintain constant time
      await passwordService.hashPassword(password);
      return err(new InvalidCredentials());
    }

    // Verify password
    const isValid = await passwordService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return err(new InvalidCredentials());
    }

    // Check if rehash needed (algorithm upgrade path)
    if (await passwordService.needsRehash(user.passwordHash)) {
      const newHash = await passwordService.hashPassword(password);
      await this.userRepo.updatePassword(user.id, newHash);
    }

    // Generate tokens and return
    const tokens = await this.generateTokens(user);
    return ok({ user, tokens });
  }
}
```

### **Step 4: Integration with Auth Flow**

**File**: `artifacts/api-server/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { passwordService } from '../services/password';
import { authService } from '../services/auth';

const router = Router();

// Registration with password validation
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  fullName: z.string().min(2),
  organizationId: z.string().uuid(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Validate password strength
    const validation = passwordService.validatePasswordStrength(data.password);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'WeakPassword',
        message: 'Password does not meet security requirements',
        details: validation.errors,
      });
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(data.password);

    // Create user
    const result = await authService.register({
      ...data,
      passwordHash,
    });

    if (result.isErr()) {
      return res.status(409).json({
        error: result.error.code,
        message: result.error.message,
      });
    }

    res.status(201).json({
      user: result.value.user,
      tokens: result.value.tokens,
    });
  } catch (error) {
    next(error);
  }
});

// Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  organizationId: z.string().uuid(),
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await authService.authenticateUser(
      data.email,
      data.password
    );

    if (result.isErr()) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid email or password',
      });
    }

    res.json({
      user: result.value.user,
      tokens: result.value.tokens,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### **Step 5: Rate Limiting on Auth Endpoints**

**File**: `artifacts/api-server/src/middlewares/rate-limit.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests (only count failures)
  skipSuccessfulRequests: false,
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'RateLimitExceeded',
    message: 'Too many requests. Please slow down.',
  },
});
```

### **Step 6: Unit Tests**

**File**: `artifacts/api-server/__tests__/services/password.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { passwordService } from '../../src/services/password';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should hash password using Argon2id', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordService.hashPassword(password);
      
      // Verify it's an Argon2id hash
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should produce different hashes for same password (different salts)', async () => {
      const password = 'SecurePass123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'SecurePass123!';
      const hash = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should handle malformed hashes gracefully', async () => {
      const isValid = await passwordService.verifyPassword('password', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = passwordService.validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = passwordService.validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('12 characters'));
    });

    it('should reject password without uppercase', () => {
      const result = passwordService.validatePasswordStrength('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('uppercase'));
    });

    it('should reject password without number', () => {
      const result = passwordService.validatePasswordStrength('NoNumbersHere!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('number'));
    });

    it('should reject password without special character', () => {
      const result = passwordService.validatePasswordStrength('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('special character'));
    });

    it('should reject common password', () => {
      const result = passwordService.validatePasswordStrength('password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('too common'));
    });
  });

  describe('hash time', () => {
    it('should complete in reasonable time (~250ms)', async () => {
      const password = 'TestPassword123!';
      const start = Date.now();
      await passwordService.hashPassword(password);
      const duration = Date.now() - start;
      
      // Should be between 100ms and 1000ms
      expect(duration).toBeGreaterThan(100);
      expect(duration).toBeLessThan(1000);
    });
  });
});
```

## Environment Configuration

**File**: `.env.example`

```bash
# Password hashing (optional overrides)
# ARGON2_MEMORY_COST=65536    # 64MB in KB
# ARGON2_TIME_COST=3          # Iterations
# ARGON2_PARALLELISM=4       # Threads
```

## Frontend Password Guidance

**File**: `artifacts/apex-os/src/components/auth/PasswordStrength.tsx`

```typescript
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const calculateStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 12) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 12.5;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 12.5;
    return score;
  };

  const strength = calculateStrength(password);
  
  const getColor = () => {
    if (strength <= 25) return 'bg-red-500';
    if (strength <= 50) return 'bg-yellow-500';
    if (strength <= 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <Progress value={strength} className={getColor()} />
      <p className="text-xs text-muted-foreground">
        Password must be at least 12 characters with uppercase, lowercase, number, and special character
      </p>
    </div>
  );
}
```

## Migration from bcrypt (if applicable)

If migrating from bcrypt:

```typescript
// Support both during transition
async function verifyPassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  // Check if it's a bcrypt hash
  if (hashedPassword.startsWith('$2')) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  // Otherwise use Argon2
  return await argon2.verify(hashedPassword, plainPassword);
}

// Rehash on successful bcrypt verification
if (isValidBcrypt && await bcrypt.compare(password, hash)) {
  // Upgrade to Argon2
  const newHash = await passwordService.hashPassword(password);
  await userRepo.updatePassword(user.id, newHash);
}
```

## Verification Commands

```bash
# Verify argon2 installed
pnpm --filter @workspace/api-server list argon2

# Check for bcrypt references (should be none)
grep -r "bcrypt" artifacts/api-server/src/ || echo "Clean - using Argon2"

# Test password hashing
cd artifacts/api-server
pnpm vitest run password.test.ts
```

## Security Checklist

- [ ] Argon2id (not Argon2d or Argon2i)
- [ ] Memory cost ≥ 64MB (65536 KB)
- [ ] Time cost ≥ 3 iterations
- [ ] Parallelism ≥ 4 threads
- [ ] Password minimum 12 characters
- [ ] Rate limiting on auth endpoints
- [ ] Rehash-on-login for algorithm upgrades
- [ ] Timing attack protection (constant time comparison)
- [ ] No plain text password logging
- [ ] Password strength validation enforced

---

## payment-allocation-service

**Description:** Implement financial payment processing service with atomic invoice updates, payment allocation logic, and automatic invoice status transitions when balance reaches zero.

# Payment Allocation Service Implementation

## Overview

This skill guides the implementation of a robust payment allocation system that handles payment processing, distributes payments across multiple invoices, maintains atomic consistency, and automatically updates invoice statuses based on remaining balances.

## Core Architecture

### 1. Database Schema Design

#### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('invoice_payment', 'prepayment', 'credit_payment')),
  reference_number VARCHAR(100), -- External payment processor reference
  processor_response JSONB, -- Response from payment processor
  failure_reason TEXT,
  allocated_amount DECIMAL(12,2) DEFAULT 0,
  unallocated_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount - allocated_amount) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_reference ON payments(reference_number);
```

#### Payment Allocations Table
```sql
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  allocation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  allocation_type VARCHAR(20) NOT NULL DEFAULT 'automatic' CHECK (allocation_type IN ('automatic', 'manual')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);
CREATE INDEX idx_payment_allocations_tenant ON payment_allocations(tenant_id);
CREATE UNIQUE INDEX idx_payment_allocations_unique ON payment_allocations(payment_id, invoice_id);
```

#### Invoices Table (Enhanced)
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number VARCHAR(50) NOT NULL,
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('ar', 'ap')), -- Accounts Receivable/Payable
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void', 'partially_paid')),
  last_payment_date TIMESTAMPTZ,
  payment_terms VARCHAR(50),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
```

### 2. Payment Allocation Service

```typescript
// src/services/PaymentAllocationService.ts
import { Database } from 'drizzle-orm';
import { payments, paymentAllocations, invoices, clients } from '../db/schema';
import { eq, and, gte, lte, sql, lt, gt, desc } from 'drizzle-orm';
import { PaymentProcessingError, InsufficientFundsError, InvoiceAlreadyPaidError } from '../domain/errors';

export interface CreatePaymentRequest {
  clientId: string;
  amount: number;
  currency?: string;
  paymentType: 'invoice_payment' | 'prepayment' | 'credit_payment';
  paymentMethodId: string;
  invoiceIds?: string[]; // For specific invoice payments
  allocationStrategy?: 'oldest_first' | 'newest_first' | 'proportional' | 'manual';
  notes?: string;
  referenceNumber?: string;
}

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
  invoiceBalance: number;
  willBeFullyPaid: boolean;
}

export class PaymentAllocationService {
  constructor(private db: Database) {}

  /**
   * Process a payment with automatic allocation to invoices
   */
  async processPayment(
    request: CreatePaymentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Payment> {
    return await this.db.transaction(async (tx) => {
      // 1. Validate client exists and belongs to tenant
      const client = await tx
        .select()
        .from(clients)
        .where(and(
          eq(clients.id, request.clientId),
          eq(clients.tenant_id, tenantId)
        ))
        .limit(1);

      if (!client[0]) {
        throw new PaymentProcessingError('Client not found or does not belong to tenant');
      }

      // 2. Create payment record
      const payment = await tx.insert(payments).values({
        tenantId,
        clientId: request.clientId,
        paymentMethodId: request.paymentMethodId,
        amount: request.amount,
        currency: request.currency || 'USD',
        paymentType: request.paymentType,
        referenceNumber: request.referenceNumber,
        notes: request.notes,
        status: 'processing',
        createdBy
      }).returning();

      const paymentRecord = payment[0];

      // 3. Determine allocation strategy
      const strategy = request.allocationStrategy || 'oldest_first';

      // 4. Calculate allocations
      const allocations = await this.calculateAllocations(
        tx,
        paymentRecord.id,
        request.clientId,
        request.amount,
        request.invoiceIds,
        strategy,
        tenantId
      );

      // 5. Apply allocations
      if (allocations.length > 0) {
        await this.applyAllocations(tx, paymentRecord.id, allocations, createdBy);
        
        // Update payment with allocated amount
        const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
        await tx.update(payments)
          .set({
            allocatedAmount: totalAllocated,
            status: totalAllocated >= request.amount ? 'completed' : 'partially_allocated',
            updatedAt: new Date()
          })
          .where(eq(payments.id, paymentRecord.id));
      }

      // 6. Emit domain events
      await this.emitEvent('PaymentProcessed', {
        paymentId: paymentRecord.id,
        clientId: request.clientId,
        amount: request.amount,
        allocatedAmount: allocations.reduce((sum, alloc) => sum + alloc.amount, 0),
        allocationCount: allocations.length
      });

      return paymentRecord;
    });
  }

  /**
   * Calculate how to allocate a payment across invoices
   */
  private async calculateAllocations(
    tx: Database,
    paymentId: string,
    clientId: string,
    paymentAmount: number,
    specificInvoiceIds?: string[],
    strategy: 'oldest_first' | 'newest_first' | 'proportional' | 'manual' = 'oldest_first',
    tenantId: string = ''
  ): Promise<PaymentAllocation[]> {
    let query = tx
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoice_number,
        totalAmount: invoices.total_amount,
        paidAmount: invoices.paid_amount,
        balanceAmount: invoices.balance_amount,
        dueDate: invoices.due_date,
        status: invoices.status
      })
      .from(invoices)
      .where(and(
        eq(invoices.client_id, clientId),
        eq(invoices.tenant_id, tenantId),
        gt(invoices.balance_amount, 0), -- Only invoices with remaining balance
        sql`${invoices.status} IN ('sent', 'partially_paid')` -- Only active invoices
      ));

    // Filter to specific invoices if provided
    if (specificInvoiceIds && specificInvoiceIds.length > 0) {
      query = query.where(and(
        query.getSQL().where,
        sql`${invoices.id} IN ${specificInvoiceIds}`
      ));
    }

    // Apply ordering based on strategy
    switch (strategy) {
      case 'oldest_first':
        query = query.orderBy(invoices.due_date, invoices.issue_date);
        break;
      case 'newest_first':
        query = query.orderBy(desc(invoices.due_date), desc(invoices.issue_date));
        break;
      case 'proportional':
        // For proportional, we'll handle in the allocation logic
        query = query.orderBy(invoices.due_date);
        break;
      case 'manual':
        // Manual allocation relies on specificInvoiceIds
        break;
    }

    const outstandingInvoices = await query;

    if (outstandingInvoices.length === 0) {
      return []; // No invoices to allocate to
    }

    return this.performAllocation(outstandingInvoices, paymentAmount, strategy);
  }

  /**
   * Perform the actual allocation calculation
   */
  private performAllocation(
    invoices: any[],
    paymentAmount: number,
    strategy: string
  ): PaymentAllocation[] {
    const allocations: PaymentAllocation[] = [];
    let remainingAmount = paymentAmount;

    switch (strategy) {
      case 'oldest_first':
      case 'newest_first':
      case 'manual':
        // Sequential allocation
        for (const invoice of invoices) {
          if (remainingAmount <= 0) break;

          const allocationAmount = Math.min(remainingAmount, invoice.balanceAmount);
          allocations.push({
            invoiceId: invoice.id,
            amount: allocationAmount,
            invoiceBalance: invoice.balanceAmount,
            willBeFullyPaid: allocationAmount >= invoice.balanceAmount
          });

          remainingAmount -= allocationAmount;
        }
        break;

      case 'proportional':
        // Proportional allocation across all invoices
        const totalBalance = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
        
        for (const invoice of invoices) {
          if (remainingAmount <= 0) break;

          const proportionalAmount = (invoice.balanceAmount / totalBalance) * paymentAmount;
          const allocationAmount = Math.min(proportionalAmount, invoice.balanceAmount);
          
          allocations.push({
            invoiceId: invoice.id,
            amount: allocationAmount,
            invoiceBalance: invoice.balanceAmount,
            willBeFullyPaid: allocationAmount >= invoice.balanceAmount
          });

          remainingAmount -= allocationAmount;
        }
        break;
    }

    return allocations.filter(alloc => alloc.amount > 0);
  }

  /**
   * Apply allocations to invoices and update their status
   */
  private async applyAllocations(
    tx: Database,
    paymentId: string,
    allocations: PaymentAllocation[],
    createdBy: string
  ): Promise<void> {
    for (const allocation of allocations) {
      // Create allocation record
      await tx.insert(paymentAllocations).values({
        paymentId,
        invoiceId: allocation.invoiceId,
        amount: allocation.amount,
        allocationType: 'automatic',
        createdBy
      });

      // Update invoice paid amount
      await tx.execute(sql`
        UPDATE invoices 
        SET 
          paid_amount = paid_amount + ${allocation.amount},
          updated_at = now(),
          last_payment_date = now()
        WHERE id = ${allocation.invoiceId}
      `);

      // Check if invoice is now fully paid and update status
      if (allocation.willBeFullyPaid) {
        await tx.execute(sql`
          UPDATE invoices 
          SET status = 'paid',
              updated_at = now()
          WHERE id = ${allocation.invoiceId}
            AND balance_amount - ${allocation.amount} <= 0
        `);

        // Emit domain event for fully paid invoice
        await this.emitEvent('InvoicePaid', {
          invoiceId: allocation.invoiceId,
          paymentId,
          amount: allocation.amount
        });
      } else {
        // Update status to partially_paid if it wasn't already
        await tx.execute(sql`
          UPDATE invoices 
          SET status = 'partially_paid',
              updated_at = now()
          WHERE id = ${allocation.invoiceId}
            AND status = 'sent'
        `);

        // Emit domain event for partial payment
        await this.emitEvent('InvoicePartialPayment', {
          invoiceId: allocation.invoiceId,
          paymentId,
          amount: allocation.amount,
          remainingBalance: allocation.invoiceBalance - allocation.amount
        });
      }
    }
  }

  /**
   * Manually allocate payment to specific invoices
   */
  async manualAllocation(
    paymentId: string,
    allocations: { invoiceId: string; amount: number }[],
    tenantId: string,
    createdBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Verify payment exists and belongs to tenant
      const payment = await tx
        .select()
        .from(payments)
        .where(and(
          eq(payments.id, paymentId),
          eq(payments.tenant_id, tenantId)
        ))
        .limit(1);

      if (!payment[0]) {
        throw new PaymentProcessingError('Payment not found');
      }

      if (payment[0].status !== 'processing') {
        throw new PaymentProcessingError('Payment cannot be modified in current status');
      }

      const unallocatedAmount = payment[0].amount - payment[0].allocatedAmount;
      const totalAllocationAmount = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

      if (totalAllocationAmount > unallocatedAmount) {
        throw new InsufficientFundsError('Allocation amount exceeds available funds');
      }

      // Apply each allocation
      for (const allocation of allocations) {
        // Verify invoice exists and has sufficient balance
        const invoice = await tx
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, allocation.invoiceId),
            eq(invoices.tenant_id, tenantId),
            gt(invoices.balance_amount, 0)
          ))
          .limit(1);

        if (!invoice[0]) {
          throw new PaymentProcessingError(`Invoice ${allocation.invoiceId} not found or already paid`);
        }

        const maxAllocation = Math.min(allocation.amount, invoice[0].balanceAmount);
        
        await this.applyAllocations(tx, paymentId, [{
          invoiceId: allocation.invoiceId,
          amount: maxAllocation,
          invoiceBalance: invoice[0].balanceAmount,
          willBeFullyPaid: maxAllocation >= invoice[0].balanceAmount
        }], createdBy);
      }

      // Update payment status
      const newAllocatedAmount = payment[0].allocatedAmount + totalAllocationAmount;
      await tx.update(payments)
        .set({
          allocatedAmount: newAllocatedAmount,
          status: newAllocatedAmount >= payment[0].amount ? 'completed' : 'partially_allocated',
          updatedAt: new Date()
        })
        .where(eq(payments.id, paymentId));
    });
  }

  /**
   * Get payment allocation details
   */
  async getPaymentAllocations(paymentId: string, tenantId: string): Promise<PaymentAllocationDetail[]> {
    const allocations = await this.db
      .select({
        id: paymentAllocations.id,
        invoiceId: paymentAllocations.invoice_id,
        invoiceNumber: invoices.invoice_number,
        amount: paymentAllocations.amount,
        allocationDate: paymentAllocations.allocation_date,
        allocationType: paymentAllocations.allocation_type,
        invoiceStatus: invoices.status,
        invoiceTotalAmount: invoices.total_amount,
        invoicePaidAmount: invoices.paid_amount,
        invoiceBalanceAmount: invoices.balance_amount
      })
      .from(paymentAllocations)
      .leftJoin(invoices, eq(paymentAllocations.invoice_id, invoices.id))
      .where(and(
        eq(paymentAllocations.payment_id, paymentId),
        eq(paymentAllocations.tenant_id, tenantId)
      ))
      .orderBy(paymentAllocations.allocation_date);

    return allocations.map(alloc => ({
      id: alloc.id,
      invoiceId: alloc.invoiceId,
      invoiceNumber: alloc.invoiceNumber,
      amount: alloc.amount,
      allocationDate: alloc.allocationDate,
      allocationType: alloc.allocationType,
      invoiceStatus: alloc.invoiceStatus,
      invoiceTotalAmount: alloc.invoiceTotalAmount,
      invoicePaidAmount: alloc.invoicePaidAmount,
      invoiceBalanceAmount: alloc.invoiceBalanceAmount
    }));
  }

  /**
   * Get client payment summary
   */
  async getClientPaymentSummary(
    clientId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ClientPaymentSummary> {
    let paymentsQuery = this.db
      .select({
        totalPaid: sql<number>`SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)`,
        totalPending: sql<number>`SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN amount ELSE 0 END)`,
        paymentCount: sql<number>`COUNT(*)`
      })
      .from(payments)
      .where(and(
        eq(payments.client_id, clientId),
        eq(payments.tenant_id, tenantId)
      ));

    if (startDate) {
      paymentsQuery = paymentsQuery.where(and(
        paymentsQuery.getSQL().where,
        gte(payments.payment_date, startDate)
      ));
    }

    if (endDate) {
      paymentsQuery = paymentsQuery.where(and(
        paymentsQuery.getSQL().where,
        lte(payments.payment_date, endDate)
      ));
    }

    const paymentsResult = await paymentsQuery;

    // Get outstanding invoices
    const outstandingInvoices = await this.db
      .select({
        totalOutstanding: sql<number>`SUM(balance_amount)`,
        invoiceCount: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.client_id, clientId),
        eq(invoices.tenant_id, tenantId),
        gt(invoices.balance_amount, 0),
        sql`${invoices.status} IN ('sent', 'partially_paid')`
      ));

    return {
      totalPaid: paymentsResult[0]?.totalPaid || 0,
      totalPending: paymentsResult[0]?.totalPending || 0,
      paymentCount: paymentsResult[0]?.paymentCount || 0,
      totalOutstanding: outstandingInvoices[0]?.totalOutstanding || 0,
      outstandingInvoiceCount: outstandingInvoices[0]?.invoiceCount || 0
    };
  }

  /**
   * Emit domain events (implementation depends on your event system)
   */
  private async emitEvent(eventName: string, data: any): Promise<void> {
    // Implementation depends on your event bus system
    // This could be using EventEmitter, DomainEventBus, etc.
    console.log(`Emitting event: ${eventName}`, data);
  }
}
```

### 3. API Endpoints

```typescript
// src/routes/payments.ts
import { Router } from 'express';
import { PaymentAllocationService } from '../services/PaymentAllocationService';
import { validateRequest } from '../middleware/validation';
import { createPaymentSchema, manualAllocationSchema } from '../schemas/payments';

const router = Router();

// POST /api/payments - Process new payment
router.post('/', validateRequest(createPaymentSchema), async (req, res, next) => {
  try {
    const payment = await paymentAllocationService.processPayment(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ payment });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/allocate - Manual allocation
router.post('/:id/allocate', 
  validateRequest(manualAllocationSchema),
  async (req, res, next) => {
    try {
      await paymentAllocationService.manualAllocation(
        req.params.id,
        req.body.allocations,
        req.tenant.id,
        req.user.id
      );

      res.json({ message: 'Allocation completed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/payments/:id/allocations - Get payment allocations
router.get('/:id/allocations', async (req, res, next) => {
  try {
    const allocations = await paymentAllocationService.getPaymentAllocations(
      req.params.id,
      req.tenant.id
    );

    res.json({ allocations });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:clientId/payment-summary - Get client payment summary
router.get('/clients/:clientId/payment-summary', async (req, res, next) => {
  try {
    const summary = await paymentAllocationService.getClientPaymentSummary(
      req.params.clientId,
      req.tenant.id,
      req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      req.query.endDate ? new Date(req.query.endDate as string) : undefined
    );

    res.json({ summary });
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Create payment and allocation database schema
- [ ] Implement PaymentAllocationService with all core methods
- [ ] Add transaction support for atomic operations
- [ ] Create allocation strategies (oldest_first, newest_first, proportional)
- [ ] Implement automatic invoice status updates
- [ ] Create API endpoints with proper validation
- [ ] Add domain events for payment lifecycle
- [ ] Implement manual allocation functionality
- [ ] Add comprehensive error handling
- [ ] Create integration tests for all scenarios
- [ ] Add payment reconciliation reports
- [ ] Implement audit logging for all payment operations

## Testing Requirements

### Unit Tests
- Test allocation calculation algorithms
- Test invoice status transitions
- Test transaction rollback scenarios
- Test payment processing logic

### Integration Tests
- Test end-to-end payment processing
- Test concurrent payment allocations
- Test payment processor integration
- Test manual allocation overrides

### Edge Cases
- Test insufficient funds scenarios
- Test duplicate payment handling
- Test payment refunds and reversals
- Test currency conversion scenarios

## Security Considerations

- All payment operations require proper authorization
- Audit trail for all payment modifications
- Input validation for all monetary values
- Rate limiting on payment endpoints
- Secure handling of payment processor responses
- Tenant isolation enforced at database level

## Performance Optimizations

- Database indexes on payment queries
- Efficient allocation calculations
- Batch processing for bulk payments
- Caching for client payment summaries

## Monitoring

- Track payment processing success rates
- Monitor allocation performance
- Alert on payment failures
- Track invoice payment aging
- Monitor payment processor response times

---

## performance-optimization

**Description:** Optimize bundle size, implement caching strategies, and monitor Core Web Vitals

# Performance Optimization Implementation

This skill guides you through implementing comprehensive performance optimizations for the Apex Unified Suite, including bundle optimization, caching strategies, and Core Web Vitals monitoring.

## Current Performance Assessment

**Performance Status**: Basic optimizations exist but need significant improvements.

**Current Issues**:
- No bundle size optimization or code splitting
- No caching strategies implemented
- No Core Web Vitals monitoring
- No image optimization
- No lazy loading for heavy components
- No performance monitoring

## Performance Architecture

### **Optimization Layers**
```
┌─────────────────────────────────────────┐
│           Network Layer                 │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ CDN Caching │  │ HTTP Caching    │   │
│  │ Asset Opt   │  │ Service Workers │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Application Layer               │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Code Split   │  │ Lazy Loading    │   │
│  │ Bundle Split │  │ Image Optimize  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Monitoring Layer              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ CWV Monitor │  │ Performance API │   │
│  │ Bundle Analy │  │ User Analytics  │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Bundle Optimization Configuration**

**Update**: `artifacts/apex-os/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@workspace/api-client-react': resolve(__dirname, '../../lib/api-client-react/src'),
      '@workspace/api-zod': resolve(__dirname, '../../lib/api-zod/src'),
      '@workspace/db': resolve(__dirname, '../../lib/db/src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom'],
          router: ['wouter', 'wouter-use-location'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          
          // Workspace packages
          'api-client': ['@workspace/api-client-react'],
          'api-zod': ['@workspace/api-zod'],
          
          // Feature chunks
          auth: ['@/contexts/AuthContext'],
          dashboard: ['@/pages/Dashboard'],
          crm: ['@/pages/CRM'],
          projects: ['@/pages/Projects'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@radix-ui/react-dialog',
      'recharts',
      'date-fns',
    ],
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
});
```

### **Step 2: Code Splitting Implementation**

**File**: `artifacts/apex-os/src/components/LazyComponents.tsx`
```typescript
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/ui/loading-states';

// Lazy loaded components
export const LazyCRM = React.lazy(() => 
  import('@/pages/CRM').then(module => ({
    default: module.CRMPage
  }))
);

export const LazyProjects = React.lazy(() => 
  import('@/pages/Projects').then(module => ({
    default: module.ProjectsPage
  }))
);

export const LazyDocuments = React.lazy(() => 
  import('@/pages/Documents').then(module => ({
    default: module.DocumentsPage
  }))
);

export const LazyFinance = React.lazy(() => 
  import('@/pages/Finance').then(module => ({
    default: module.FinancePage
  }))
);

export const LazyAssets = React.lazy(() => 
  import('@/pages/Assets').then(module => ({
    default: module.AssetsPage
  }))
);

export const LazyPortal = React.lazy(() => 
  import('@/pages/Portal').then(module => ({
    default: module.PortalPage
  }))
);

export const LazyAnalytics = React.lazy(() => 
  import('@/pages/Analytics').then(module => ({
    default: module.AnalyticsPage
  }))
);

export const LazySettings = React.lazy(() => 
  import('@/pages/Settings').then(module => ({
    default: module.SettingsPage
  }))
);

// Heavy components
export const LazyChart = React.lazy(() => 
  import('@/components/charts/RevenueChart').then(module => ({
    default: module.RevenueChart
  }))
);

export const LazyDataTable = React.lazy(() => 
  import('@/components/ui/DataTable').then(module => ({
    default: module.DataTable
  }))
);

// Loading wrappers
export function LazyWrapper({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <Suspense fallback={fallback || <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

export function ChartWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Page skeleton
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
```

### **Step 3: Image Optimization Component**

**File**: `artifacts/apex-os/src/components/ui/OptimizedImage.tsx`
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Use Intersection Observer for lazy loading
    if (!priority) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              img.src = src;
              observer.unobserve(img);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(img);
      return () => observer.disconnect();
    } else {
      img.src = src;
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc || !width) return '';
    
    const sizes = [width, width * 2, width * 1.5];
    return sizes
      .map(size => `${baseSrc}?w=${size}&q=75 ${size}w`)
      .join(', ');
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <span className="text-muted-foreground text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          {blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover blur-sm"
              style={{ filter: 'blur(20px)' }}
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      )}

      <img
        ref={imgRef}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-1'}`}
        srcSet={generateSrcSet(src)}
        sizes={`${width}px`}
      />
    </div>
  );
}

// Avatar component with optimization
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <div 
        className={`flex items-center justify-center bg-primary text-primary-foreground rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.4 }}>
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      priority={size > 80} // Prioritize larger avatars
    />
  );
}
```

### **Step 4: Service Worker Implementation**

**File**: `artifacts/apex-os/public/sw.js`
```javascript
const CACHE_NAME = 'apex-unified-suite-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/crm',
  '/projects',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first with network fallback
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.includes('.js') || 
      url.pathname.includes('.css') ||
      url.pathname.includes('.woff')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
        })
    );
    return;
  }

  // HTML pages - network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached HTML or fallback
        return caches.match(request)
          .then((response) => {
            return response || caches.match('/');
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions
  const offlineActions = await getOfflineActions();
  
  for (const action of offlineActions) {
    try {
      await fetch(action.url, action.options);
      await removeOfflineAction(action.id);
    } catch (error) {
      console.error('Failed to sync offline action:', error);
    }
  }
}

async function getOfflineActions() {
  // Get offline actions from IndexedDB
  return [];
}

async function removeOfflineAction(id) {
  // Remove action from IndexedDB
  return Promise.resolve();
}
```

**File**: `artifacts/apex-os/src/lib/serviceWorker.ts`
```typescript
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  if (confirm('New version available. Reload now?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
```

### **Step 5: Core Web Vitals Monitoring**

**File**: `artifacts/apex-os/src/lib/performance.ts`
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVitals {
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface PerformanceMetrics {
  webVitals: WebVitals;
  loadTime: number;
  domContentLoaded: number;
  resources: PerformanceResourceTiming[];
  navigation: PerformanceNavigationTiming;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<WebVitals> = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    // Monitor Core Web Vitals
    getCLS((metric) => {
      this.metrics.cls = metric.value;
      this.reportMetric('CLS', metric);
    });

    getFID((metric) => {
      this.metrics.fid = metric.value;
      this.reportMetric('FID', metric);
    });

    getFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.reportMetric('FCP', metric);
    });

    getLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.reportMetric('LCP', metric);
    });

    getTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.reportMetric('TTFB', metric);
    });

    // Monitor resource loading
    this.observeResources();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  private observeResources(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            this.analyzeResource(resource);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask') {
            this.reportLongTask(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  private analyzeResource(resource: PerformanceResourceTiming): void {
    const { name, duration, transferSize, encodedBodySize } = resource;
    
    // Flag slow resources
    if (duration > 1000) {
      console.warn('Slow resource detected:', {
        name,
        duration,
        transferSize,
      });
    }

    // Flag large resources
    if (transferSize > 1024 * 1024) { // 1MB
      console.warn('Large resource detected:', {
        name,
        transferSize,
        encodedBodySize,
      });
    }
  }

  private reportLongTask(entry: PerformanceEntry): void {
    console.warn('Long task detected:', {
      duration: entry.duration,
      startTime: entry.startTime,
    });
  }

  private reportMetric(name: string, metric: any): void {
    const value = metric.value;
    const rating = this.getRating(name, value);
    
    // Send to analytics
    this.sendToAnalytics({
      metric: name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Log poor performance
    if (rating === 'poor') {
      console.warn(`Poor ${name} performance:`, value);
    }
  }

  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'needs-improvement';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private sendToAnalytics(data: any): void {
    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to your analytics service
      // analytics.track('web_vital', data);
    }
  }

  getMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return {
      webVitals: this.metrics as WebVitals,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      resources,
      navigation,
    };
  }

  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Performance monitoring hook
export function usePerformanceMonitoring() {
  React.useEffect(() => {
    performanceMonitor.startMonitoring();
    
    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, []);

  const getReport = React.useCallback(() => {
    return performanceMonitor.getMetrics();
  }, []);

  return { getReport };
}
```

### **Step 6: Caching Implementation**

**File**: `artifacts/api-server/src/middlewares/cache.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  maxAge?: number;
  etag?: boolean;
  lastModified?: boolean;
  vary?: string[];
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    maxAge = 300, // 5 minutes default
    etag = true,
    lastModified = true,
    vary = ['Accept-Encoding'],
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Set cache control headers
    const cacheControl = [`max-age=${maxAge}`];
    if (maxAge === 0) {
      cacheControl.push('no-cache', 'no-store', 'must-revalidate');
    } else {
      cacheControl.push('public');
    }
    
    res.set('Cache-Control', cacheControl.join(', '));

    // Set Vary header
    if (vary.length > 0) {
      res.set('Vary', vary.join(', '));
    }

    // Generate ETag
    if (etag) {
      const data = JSON.stringify(req.query);
      const hash = require('crypto').createHash('md5').update(data).digest('hex');
      res.set('ETag', `"${hash}"`);

      // Check if client has current version
      if (req.headers['if-none-match'] === `"${hash}"`) {
        return res.status(304).end();
      }
    }

    // Set Last-Modified
    if (lastModified) {
      const now = new Date();
      res.set('Last-Modified', now.toUTCString());

      // Check if client has cached version
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (clientDate >= now) {
          return res.status(304).end();
        }
      }
    }

    next();
  };
}

// Redis cache implementation
export class RedisCache {
  private client: any; // Redis client

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

// Cache middleware for API responses
export function apiCache(cache: RedisCache, ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    // Try to get from cache
    const cached = await cache.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttl).catch(console.error);
      }
      
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
}
```

### **Step 7: Performance Monitoring Dashboard**

**File**: `artifacts/apex-os/src/components/performance/PerformanceDashboard.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMonitoring } from '@/lib/performance';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold: { good: number; poor: number };
  description: string;
}

function MetricCard({ title, value, unit, threshold, description }: MetricCardProps) {
  const getRating = () => {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const rating = getRating();
  const progress = Math.min((value / threshold.poor) * 100, 100);

  const colors = {
    good: 'text-green-600',
    'needs-improvement': 'text-yellow-600',
    poor: 'text-red-600',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">
            {value.toFixed(0)}{unit}
          </span>
          <Badge variant={rating === 'good' ? 'default' : rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
            {rating.replace('-', ' ')}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0</span>
          <span>{threshold.poor}{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceDashboard() {
  const { getReport } = usePerformanceMonitoring();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = () => {
      try {
        const report = getReport();
        setMetrics(report);
      } catch (error) {
        console.error('Failed to load performance metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getReport]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Performance metrics not available
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Badge variant="outline">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="LCP"
            value={metrics.webVitals.lcp || 0}
            unit="ms"
            threshold={{ good: 2500, poor: 4000 }}
            description="Largest Contentful Paint"
          />
          <MetricCard
            title="FID"
            value={metrics.webVitals.fid || 0}
            unit="ms"
            threshold={{ good: 100, poor: 300 }}
            description="First Input Delay"
          />
          <MetricCard
            title="CLS"
            value={metrics.webVitals.cls || 0}
            unit=""
            threshold={{ good: 0.1, poor: 0.25 }}
            description="Cumulative Layout Shift"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="FCP"
            value={metrics.webVitals.fcp || 0}
            unit="ms"
            threshold={{ good: 1800, poor: 3000 }}
            description="First Contentful Paint"
          />
          <MetricCard
            title="TTFB"
            value={metrics.webVitals.ttfb || 0}
            unit="ms"
            threshold={{ good: 800, poor: 1800 }}
            description="Time to First Byte"
          />
          <MetricCard
            title="Load Time"
            value={metrics.loadTime || 0}
            unit="ms"
            threshold={{ good: 1000, poor: 3000 }}
            description="Page Load Time"
          />
        </div>
      </div>

      {/* Resource Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Analysis</CardTitle>
          <CardDescription>
            Analysis of loaded resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Total Resources:</span>
              <span>{metrics.resources?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>DOM Content Loaded:</span>
              <span>{metrics.domContentLoaded?.toFixed(0)}ms</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Performance Checklist

### **Bundle Optimization**
- [ ] Implement code splitting for routes and components
- [ ] Configure manual chunks for vendor libraries
- [ ] Enable tree shaking and dead code elimination
- [ ] Implement proper minification with Terser
- [ ] Optimize bundle size with compression
- [ ] Use dynamic imports for heavy components

### **Image Optimization**
- [ ] Implement lazy loading for images
- [ ] Use responsive images with srcset
- [ ] Optimize image formats (WebP, AVIF)
- [ ] Implement image compression
- [ ] Add blur-up placeholders
- [ ] Use CDN for image delivery

### **Caching Strategies**
- [ ] Implement HTTP caching headers
- [ ] Use Redis for API response caching
- [ ] Implement service worker for offline caching
- [ ] Add cache invalidation strategies
- [ ] Implement browser storage for user data
- [ ] Use CDN for static assets

### **Performance Monitoring**
- [ ] Monitor Core Web Vitals
- [ ] Track resource loading performance
- [ ] Implement performance budgets
- [ ] Add real user monitoring (RUM)
- [ ] Create performance dashboard
- [ ] Set up performance alerts

### **Runtime Optimization**
- [ ] Implement virtual scrolling for large lists
- [ ] Use React.memo for expensive components
- [ ] Optimize re-renders with proper dependencies
- [ ] Implement debouncing for search inputs
- [ ] Use requestIdleCallback for non-critical tasks
- [ ] Implement progressive loading

This comprehensive performance optimization implementation significantly improves the Apex Unified Suite's performance, user experience, and monitoring capabilities.

---

## portal-magic-link-auth

**Description:** Complete implementation of portal magic link authentication with hash tokens, JWT exchange, rate limiting, and security hardening for client access.

# Portal Magic Link Authentication Implementation

## Overview
This skill guides you through implementing a secure magic link authentication system specifically for portal users (clients, customers, partners). Portal users access a limited subset of functionality and require a different authentication flow than internal users.

## Prerequisites
- Email service integration (see @email-service-implementation skill)
- JWT service implementation (see @jwt-service-implementation skill)
- Database access for portal users and magic tokens
- Rate limiting infrastructure

## Step 1: Database Schema Design

### Portal Users Table
Create `lib/db/src/schema/portal-users.ts`:

```typescript
import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const portalUsers = pgTable('portal_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  companyName: text('company_name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  role: text('role').notNull(), // 'client', 'partner', 'customer'
  permissions: text('permissions').array(), // Array of permission strings
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PortalUser = typeof portalUsers.$inferSelect;
export type NewPortalUser = typeof portalUsers.$inferInsert;
```

### Magic Tokens Table
Create `lib/db/src/schema/portal-magic-tokens.ts`:

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const portalMagicTokens = pgTable('portal_magic_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().index(),
  tokenHash: text('token_hash').notNull().unique(), // SHA-256 hash of the token
  rawToken: text('raw_token').notNull(), // For email sending (deleted after use)
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PortalMagicToken = typeof portalMagicTokens.$inferSelect;
export type NewPortalMagicToken = typeof portalMagicTokens.$inferInsert;
```

### Portal Sessions Table
Create `lib/db/src/schema/portal-sessions.ts`:

```typescript
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const portalSessions = pgTable('portal_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  refreshExpiresAt: timestamp('refresh_expires_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PortalSession = typeof portalSessions.$inferSelect;
export type NewPortalSession = typeof portalSessions.$inferInsert;
```

## Step 2: Token Generation Service

### Create Token Service
Create `artifacts/api-server/src/services/portal-token-service.ts`:

```typescript
import crypto from 'crypto';
import { db } from '@workspace/db';
import { portalMagicTokens } from '@workspace/db/src/schema/portal-magic-tokens';
import { eq, and, gt } from 'drizzle-orm';

export interface MagicLinkRequest {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

export class PortalTokenService {
  private readonly TOKEN_LENGTH = 32;
  private readonly TOKEN_EXPIRY_MINUTES = 15;
  private readonly RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_MAX_ATTEMPTS = 3;

  async generateMagicLink(request: MagicLinkRequest): Promise<MagicLinkResponse> {
    const { email, ipAddress, userAgent } = request;

    // Check rate limiting
    const rateLimitResult = await this.checkRateLimit(email, ipAddress);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: 'Too many requests. Please try again later.',
        rateLimited: true,
        retryAfter: rateLimitResult.retryAfter,
      };
    }

    try {
      // Generate secure token
      const rawToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      
      // Calculate expiry
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Delete any existing tokens for this email
      await db.delete(portalMagicTokens).where(eq(portalMagicTokens.email, email));

      // Store new token
      await db.insert(portalMagicTokens).values({
        email,
        tokenHash,
        rawToken, // Store temporarily for email sending
        expiresAt,
        ipAddress,
        userAgent,
      });

      // TODO: Send email with magic link (integrate with email service)
      // await this.sendMagicLinkEmail(email, rawToken);

      return {
        success: true,
        message: 'Magic link sent to your email address.',
      };
    } catch (error) {
      console.error('Error generating magic link:', error);
      return {
        success: false,
        message: 'Failed to generate magic link. Please try again.',
      };
    }
  }

  async verifyMagicLink(token: string, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    user?: PortalUser;
    sessionToken?: string;
    refreshToken?: string;
    message: string;
  }> {
    if (!token) {
      return { success: false, message: 'Token is required' };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
      // Find and consume token atomically
      const tokenRecord = await db.transaction(async (tx) => {
        const record = await tx
          .select()
          .from(portalMagicTokens)
          .where(
            and(
              eq(portalMagicTokens.tokenHash, tokenHash),
              eq(portalMagicTokens.isUsed, false),
              gt(portalMagicTokens.expiresAt, new Date())
            )
          )
          .limit(1);

        if (record.length === 0) {
          return null;
        }

        // Mark token as used
        await tx
          .update(portalMagicTokens)
          .set({
            isUsed: true,
            usedAt: new Date(),
          })
          .where(eq(portalMagicTokens.id, record[0].id));

        return record[0];
      });

      if (!tokenRecord) {
        return { success: false, message: 'Invalid or expired magic link' };
      }

      // Find or create portal user
      const user = await this.findOrCreatePortalUser(tokenRecord.email);
      if (!user) {
        return { success: false, message: 'User account not found or inactive' };
      }

      // Generate session tokens
      const sessionTokens = await this.generateSessionTokens(user.id, ipAddress, userAgent);

      // Update last login
      await this.updateLastLogin(user.id);

      return {
        success: true,
        user,
        sessionToken: sessionTokens.sessionToken,
        refreshToken: sessionTokens.refreshToken,
        message: 'Authentication successful',
      };
    } catch (error) {
      console.error('Error verifying magic link:', error);
      return { success: false, message: 'Authentication failed' };
    }
  }

  private async checkRateLimit(email: string, ipAddress?: string): Promise<{
    allowed: boolean;
    retryAfter?: number;
  }> {
    const windowStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW);
    
    const recentAttempts = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(portalMagicTokens)
      .where(
        and(
          eq(portalMagicTokens.email, email),
          gt(portalMagicTokens.createdAt, windowStart)
        )
      );

    const attempts = recentAttempts[0]?.count || 0;

    if (attempts >= this.RATE_LIMIT_MAX_ATTEMPTS) {
      const oldestAttempt = await db
        .select({ createdAt: portalMagicTokens.createdAt })
        .from(portalMagicTokens)
        .where(
          and(
            eq(portalMagicTokens.email, email),
            gt(portalMagicTokens.createdAt, windowStart)
          )
        )
        .orderBy(portalMagicTokens.createdAt)
        .limit(1);

      if (oldestAttempt.length > 0) {
        const retryAfter = Math.ceil(
          (oldestAttempt[0].createdAt.getTime() + this.RATE_LIMIT_WINDOW - Date.now()) / 1000
        );
        return { allowed: false, retryAfter };
      }
    }

    return { allowed: true };
  }

  private async findOrCreatePortalUser(email: string): Promise<PortalUser | null> {
    // This would depend on your business logic for portal user management
    // For now, assume portal users are pre-registered
    const user = await db
      .select()
      .from(portalUsers)
      .where(and(eq(portalUsers.email, email), eq(portalUsers.isActive, true)))
      .limit(1);

    return user[0] || null;
  }

  private async generateSessionTokens(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ sessionToken: string; refreshToken: string }> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(portalSessions).values({
      userId,
      sessionToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      ipAddress,
      userAgent,
    });

    return { sessionToken, refreshToken };
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await db
      .update(portalUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(portalUsers.id, userId));
  }

  private async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    // Integrate with email service
    const magicLink = `${process.env.PORTAL_BASE_URL}/auth/verify?token=${token}`;
    
    // TODO: Implement email sending
    // await emailService.sendMagicLink(email, magicLink);
  }
}
```

## Step 3: Authentication Routes

### Create Portal Auth Routes
Create `artifacts/api-server/src/routes/v1/portal-auth.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { PortalTokenService } from '../services/portal-token-service';
import { PortalJWTService } from '../services/portal-jwt-service';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const tokenService = new PortalTokenService();
const jwtService = new PortalJWTService();

// Rate limiting for magic link requests
const magicLinkRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 requests per 5 minutes per IP
  message: {
    error: 'Too many magic link requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request magic link
router.post('/magic-link', magicLinkRateLimit, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email('Invalid email format'),
    });

    const { email } = schema.parse(req.body);
    
    const result = await tokenService.generateMagicLink({
      email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    if (result.rateLimited) {
      return res.status(429).json({
        error: result.message,
        retryAfter: result.retryAfter,
      });
    }

    res.json({
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Magic link request error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Verify magic link and exchange for JWT
router.get('/verify', async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(1, 'Token is required'),
    });

    const { token } = schema.parse(req.query);
    
    const result = await tokenService.verifyMagicLink(
      token,
      req.ip,
      req.get('User-Agent')
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
      });
    }

    // Generate JWT tokens
    const jwtTokens = await jwtService.generateTokens({
      userId: result.user!.id,
      email: result.user!.email,
      role: result.user!.role,
      permissions: result.user!.permissions,
    });

    res.json({
      message: 'Authentication successful',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        firstName: result.user!.firstName,
        lastName: result.user!.lastName,
        companyName: result.user!.companyName,
        role: result.user!.role,
        permissions: result.user!.permissions,
      },
      tokens: jwtTokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Magic link verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    const schema = z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
    });

    const { refreshToken } = schema.parse(req.body);
    
    const result = await jwtService.refreshToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({
        error: result.message,
      });
    }

    res.json({
      tokens: result.tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Logout (invalidate session)
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);
    await jwtService.invalidateToken(token);

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export { router as portalAuthRouter };
```

## Step 4: JWT Service for Portal

### Create Portal JWT Service
Create `artifacts/api-server/src/services/portal-jwt-service.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { db } from '@workspace/db';
import { portalSessions } from '@workspace/db/src/schema/portal-sessions';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

export interface PortalJWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  tokenType: 'access' | 'refresh';
}

export interface PortalUser {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export class PortalJWTService {
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
  private readonly JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'fallback-secret-change-in-production';

  async generateTokens(user: PortalUser): Promise<JWTTokens> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Access token
    const accessTokenPayload: PortalJWTPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sessionId,
      tokenType: 'access',
    };

    const accessToken = jwt.sign(accessTokenPayload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'apex-unified-suite',
      audience: 'portal',
    });

    // Refresh token
    const refreshTokenPayload: PortalJWTPayload = {
      ...accessTokenPayload,
      tokenType: 'refresh',
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'apex-unified-suite',
      audience: 'portal',
    });

    // Store session in database
    await this.storeSession(user.userId, sessionId, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      refreshExpiresIn: this.REFRESH_TOKEN_EXPIRY,
    };
  }

  async verifyToken(token: string): Promise<{
    valid: boolean;
    payload?: PortalJWTPayload;
    error?: string;
  }> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'apex-unified-suite',
        audience: 'portal',
      }) as PortalJWTPayload;

      // Check if session is still active
      const session = await db
        .select()
        .from(portalSessions)
        .where(
          and(
            eq(portalSessions.userId, payload.userId),
            eq(portalSessions.sessionToken, payload.sessionId),
            eq(portalSessions.isActive, true),
            gt(portalSessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (session.length === 0) {
        return { valid: false, error: 'Session not found or expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      } else {
        return { valid: false, error: 'Token verification failed' };
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    tokens?: JWTTokens;
    message: string;
  }> {
    const verification = await this.verifyToken(refreshToken);

    if (!verification.valid || !verification.payload) {
      return { success: false, message: verification.error || 'Invalid refresh token' };
    }

    const payload = verification.payload;
    if (payload.tokenType !== 'refresh') {
      return { success: false, message: 'Invalid token type' };
    }

    // Generate new tokens
    const user: PortalUser = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };

    const newTokens = await this.generateTokens(user);

    // Invalidate old refresh token
    await this.invalidateToken(refreshToken);

    return {
      success: true,
      tokens: newTokens,
      message: 'Tokens refreshed successfully',
    };
  }

  async invalidateToken(token: string): Promise<void> {
    const verification = await this.verifyToken(token);

    if (verification.valid && verification.payload) {
      // Deactivate session
      await db
        .update(portalSessions)
        .set({ isActive: false })
        .where(eq(portalSessions.sessionToken, verification.payload.sessionId));
    }
  }

  private async storeSession(userId: string, sessionId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.ACCESS_TOKEN_EXPIRY * 1000);
    const refreshExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000);

    await db.insert(portalSessions).values({
      userId,
      sessionToken: sessionId,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    });
  }
}
```

## Step 5: Authentication Middleware

### Create Portal Auth Middleware
Create `artifacts/api-server/src/middleware/portal-auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PortalJWTService } from '../services/portal-jwt-service';

export interface PortalAuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
  };
}

export class PortalAuthMiddleware {
  private static jwtService = new PortalJWTService();

  static authenticate = async (req: PortalAuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const verification = await this.jwtService.verifyToken(token);
      
      if (!verification.valid || !verification.payload) {
        return res.status(401).json({
          error: verification.error || 'Invalid token',
        });
      }

      // Attach user info to request
      req.user = {
        userId: verification.payload.userId,
        email: verification.payload.email,
        role: verification.payload.role,
        permissions: verification.payload.permissions,
        sessionId: verification.payload.sessionId,
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({
        error: 'Authentication failed',
      });
    }
  };

  static requirePermission = (permission: string) => {
    return (req: PortalAuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
        });
      }

      next();
    };
  };

  static requireRole = (role: string) => {
    return (req: PortalAuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          error: 'Insufficient role privileges',
        });
      }

      next();
    };
  };
}
```

## Step 6: Portal Routes with Authentication

### Update Portal Routes
Create `artifacts/api-server/src/routes/v1/portal.ts`:

```typescript
import { Router } from 'express';
import { portalAuthRouter } from './portal-auth.js';
import { PortalAuthMiddleware, PortalAuthRequest } from '../middleware/portal-auth.js';

const router = Router();

// Public authentication routes
router.use('/auth', portalAuthRouter);

// Protected routes
router.get('/profile', PortalAuthMiddleware.authenticate, async (req: PortalAuthRequest, res) => {
  try {
    // Return user profile information
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
    });
  }
});

// Example protected route with permission check
router.get(
  '/documents',
  PortalAuthMiddleware.authenticate,
  PortalAuthMiddleware.requirePermission('documents:read'),
  async (req: PortalAuthRequest, res) => {
    try {
      // Return user's documents
      res.json({
        documents: [], // TODO: Implement document fetching
      });
    } catch (error) {
      console.error('Documents fetch error:', error);
      res.status(500).json({
        error: 'Failed to fetch documents',
      });
    }
  }
);

export { router as portalRouter };
```

## Step 7: Email Integration

### Create Magic Link Email Template
Create `artifacts/api-server/src/templates/magic-link-email.ts`:

```typescript
export interface MagicLinkEmailData {
  firstName: string;
  companyName: string;
  magicLink: string;
  expiryMinutes: number;
}

export const generateMagicLinkEmail = (data: MagicLinkEmailData): {
  subject: string;
  html: string;
  text: string;
} => {
  const subject = `Sign in to ${data.companyName} Portal`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in to Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #0066ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Portal Sign In</h1>
        </div>
        <div class="content">
          <p>Hello ${data.firstName},</p>
          <p>Click the button below to sign in to the ${data.companyName} portal:</p>
          <div style="text-align: center;">
            <a href="${data.magicLink}" class="button">Sign In to Portal</a>
          </div>
          <p><strong>Important:</strong> This link will expire in ${data.expiryMinutes} minutes for security reasons.</p>
          <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Apex Unified Suite portal.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${data.firstName},

    Sign in to the ${data.companyName} portal by clicking this link:
    ${data.magicLink}

    This link will expire in ${data.expiryMinutes} minutes for security reasons.

    If you didn't request this sign-in link, you can safely ignore this email.

    This is an automated message from the Apex Unified Suite portal.
  `;

  return { subject, html, text };
};
```

## Step 8: Frontend Integration

### Portal Login Component
Create `artifacts/apex-os/src/components/portal/PortalLogin.tsx`:

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

interface PortalLoginProps {
  onSuccess: (tokens: any) => void;
}

export function PortalLogin({ onSuccess }: PortalLoginProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const requestMagicLink = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/v1/portal/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send magic link');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      setError('');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const validatedEmail = loginSchema.parse({ email });
      requestMagicLink.mutate(validatedEmail.email);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        setError(validationError.errors[0].message);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            We've sent a magic link to <strong>{email}</strong>. Click the link to sign in to your portal.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            The link will expire in 15 minutes for security.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Send to a different email address
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Portal Sign In</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email address"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={requestMagicLink.isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {requestMagicLink.isPending ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        We'll send you a sign-in link that expires in 15 minutes.
      </div>
    </div>
  );
}
```

## Step 9: Security Hardening

### Security Headers and Configuration
Add security middleware for portal routes:

```typescript
// artifacts/api-server/src/middleware/portal-security.ts
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const portalSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

export const portalRateLimiting = {
  // Stricter limits for portal endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    message: 'Too many authentication attempts',
  }),
  
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Rate limit exceeded',
  }),
};
```

## Step 10: Testing and Validation

### Unit Tests
Create comprehensive tests for the portal authentication system:

```typescript
// tests/api/portal-auth.test.ts
import request from 'supertest';
import { app } from '../src/server';
import { db } from '@workspace/db';

describe('Portal Authentication', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(portalMagicTokens);
    await db.delete(portalSessions);
  });

  test('should send magic link', async () => {
    const response = await request(app)
      .post('/api/v1/portal/auth/magic-link')
      .send({ email: 'test@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.success).toBe(true);
  });

  test('should rate limit magic link requests', async () => {
    // Send multiple requests rapidly
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/v1/portal/auth/magic-link')
        .send({ email: 'test@example.com' });
    }

    const response = await request(app)
      .post('/api/v1/portal/auth/magic-link')
      .send({ email: 'test@example.com' })
      .expect(429);

    expect(response.body).toHaveProperty('error');
  });

  test('should verify valid magic link', async () => {
    // First request a magic link
    const magicLinkResponse = await request(app)
      .post('/api/v1/portal/auth/magic-link')
      .send({ email: 'test@example.com' });

    // Extract token from email (mocked)
    const token = 'mock-token';

    // Verify the token
    const verifyResponse = await request(app)
      .get(`/api/v1/portal/auth/verify?token=${token}`)
      .expect(200);

    expect(verifyResponse.body).toHaveProperty('tokens');
    expect(verifyResponse.body).toHaveProperty('user');
  });
});
```

## Common Issues and Solutions

### Token Not Found
- Check database connection
- Verify token hash generation
- Ensure proper TTL configuration

### JWT Verification Failures
- Verify JWT secret consistency
- Check token expiration handling
- Ensure proper audience/issuer claims

### Rate Limiting Issues
- Configure Redis for distributed rate limiting
- Adjust limits based on traffic patterns
- Implement proper IP detection

### Email Delivery Issues
- Verify email service configuration
- Check email templates and formatting
- Implement proper error handling

## Security Considerations

### Token Security
- Use cryptographically secure random token generation
- Store token hashes, not raw tokens
- Implement proper TTL for tokens
- Use HTTPS for all communications

### Rate Limiting
- Implement per-IP and per-email rate limiting
- Use distributed storage for rate limiting in production
- Monitor for abuse patterns

### Session Management
- Implement proper session invalidation
- Use secure session storage
- Monitor for concurrent sessions

### Email Security
- Validate email addresses properly
- Implement email delivery verification
- Use proper email headers and SPF/DKIM

This skill provides a comprehensive, secure magic link authentication system specifically designed for portal users in the Apex Unified Suite, with proper rate limiting, security hardening, and production-ready features.

---

## portal-permission-filter

**Description:** Implement client portal data access control with granular permission checking, ensuring clients can only view and interact with data they've been explicitly granted access to.

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

---

## repository-pattern-implementation

**Description:** Implement base repository with multi-tenancy, soft delete patterns, and type-safe queries using Drizzle ORM for all business entities

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

---

## security-hardening

**Description:** Implement 2026 security best practices including headers, rate limiting, OWASP ZAP integration, and audit logging

# Security Hardening Implementation

This skill guides you through implementing comprehensive security measures for the Apex Unified Suite, including security headers, rate limiting, input validation, and audit logging.

## Current Security Assessment

**Security Status**: Basic security measures exist but need significant hardening.

**Current Issues**:
- CORS allows all origins (`cors()` with no options)
- No security headers (HSTS, CSP, etc.)
- No rate limiting on API endpoints
- No audit logging for sensitive operations
- No input sanitization beyond Zod validation
- No CSRF protection
- No security monitoring

## Security Architecture

### **Security Layers**
```
┌─────────────────────────────────────────┐
│           Network Layer                 │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ HTTPS/TLS   │  │ CDN Security   │   │
│  │ DDoS Protect│  │ WAF Rules      │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Application Layer               │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Auth Headers│  │ Rate Limiting  │   │
│  │ CSP Headers │  │ Input Validation│   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Data Layer                    │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Audit Logs  │  │ Encryption     │   │
│  │ Access Ctrl  │  │ Backup Security│   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Step-by-Step Implementation

### **Step 1: Security Headers Middleware**

**File**: `artifacts/api-server/src/middlewares/security.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com", // Add allowed APIs
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Security headers
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (HTTPS only)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
}
```

### **Step 2: Rate Limiting Implementation**

**File**: `artifacts/api-server/src/middlewares/rateLimit.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 100,
    private cleanupIntervalMs: number = 60000 // 1 minute
  ) {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  private getKey(req: Request): string {
    // Use IP address for rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `rate_limit:${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  middleware(maxRequests?: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      const limit = maxRequests || this.maxRequests;

      if (!this.store[key]) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        return next();
      }

      const entry = this.store[key];

      if (now > entry.resetTime) {
        // Reset window
        entry.count = 1;
        entry.resetTime = now + this.windowMs;
        return next();
      }

      if (entry.count >= limit) {
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          resetIn,
        });

        res.set('Retry-After', resetIn.toString());
        res.set('X-RateLimit-Limit', limit.toString());
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', entry.resetTime.toString());

        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        });
      }

      entry.count++;

      res.set('X-RateLimit-Limit', limit.toString());
      res.set('X-RateLimit-Remaining', (limit - entry.count).toString());
      res.set('X-RateLimit-Reset', entry.resetTime.toString());

      next();
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Pre-configured rate limiters
export const authRateLimiter = new RateLimiter(60000, 5); // 5 requests per minute for auth
export const generalRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute general
export const uploadRateLimiter = new RateLimiter(60000, 10); // 10 uploads per minute
export const searchRateLimiter = new RateLimiter(60000, 30); // 30 searches per minute
```

### **Step 3: Input Sanitization**

**File**: `artifacts/api-server/src/lib/sanitization.ts`
```typescript
import DOMPurify from 'isomorphic-dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  textOnly?: boolean;
}

const defaultSanitizeOptions: SanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
  allowedAttributes: {
    'a': ['href', 'title'],
    '*': ['class'],
  },
  textOnly: false,
};

export function sanitizeHtml(
  html: string, 
  options: SanitizeOptions = {}
): string {
  const finalOptions = { ...defaultSanitizeOptions, ...options };
  
  if (finalOptions.textOnly) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: finalOptions.allowedTags || [],
    ALLOWED_ATTR: finalOptions.allowedAttributes || {},
  });
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML brackets
    .trim();
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, '') // Allow only safe characters
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .toLowerCase();
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .substring(0, 100); // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}
```

### **Step 4: Audit Logging System**

**File**: `artifacts/api-server/src/lib/auditLogger.ts`
```typescript
import { logger } from './logger';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log({
    userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success,
    error,
  }: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: ipAddress || 'unknown',
      userAgent,
      timestamp: new Date().toISOString(),
      success,
      error,
    };

    // Log to structured logger
    logger.info('Audit Event', {
      audit_id: auditLog.id,
      user_id: auditLog.userId,
      action: auditLog.action,
      resource: auditLog.resource,
      resource_id: auditLog.resourceId,
      success: auditLog.success,
      ip_address: auditLog.ipAddress,
      user_agent: auditLog.userAgent,
      details: auditLog.details,
      error: auditLog.error,
    });

    // In production, also store in database
    if (process.env.NODE_ENV === 'production') {
      await this.storeInDatabase(auditLog);
    }
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeInDatabase(auditLog: AuditLog): Promise<void> {
    try {
      // TODO: Store audit logs in database
      // await db.insert(auditLogsTable).values(auditLog);
    } catch (error) {
      logger.error('Failed to store audit log in database', { error, auditLog });
    }
  }

  // Convenience methods
  async logUserAction({
    userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success = true,
    error,
  }: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent?: string;
    success?: boolean;
    error?: string;
  }): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      error,
    });
  }

  async logSystemAction({
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
    success = true,
    error,
  }: {
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent?: string;
    success?: boolean;
    error?: string;
  }): Promise<void> {
    await this.log({
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      error,
    });
  }
}

export const auditLogger = AuditLogger.getInstance();
```

### **Step 5: Enhanced Authentication Security**

**Update**: `artifacts/api-server/src/services/auth.ts`
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '@workspace/db';
import { usersTable, rolesTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { auditLogger } from '../lib/auditLogger';
import { validateEmail } from '../lib/sanitization';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly maxLoginAttempts: number = 5;
  private readonly lockoutDuration: number = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async authenticateUser(email: string, password: string, ipAddress: string, userAgent?: string): Promise<{
    user: typeof usersTable.$inferSelect;
    tokens: AuthTokens;
  }> {
    // Validate email format
    if (!validateEmail(email)) {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email: 'invalid_format' },
        ipAddress,
        userAgent,
        success: false,
        error: 'Invalid email format',
      });
      throw new Error('Invalid email format');
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user[0]) {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, reason: 'user_not_found' },
        ipAddress,
        userAgent,
        success: false,
        error: 'User not found',
      });
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user[0].status === 'locked') {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, reason: 'account_locked' },
        ipAddress,
        userAgent,
        success: false,
        error: 'Account locked',
      });
      throw new Error('Account is locked');
    }

    // Check if account is inactive
    if (user[0].status !== 'active') {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, status: user[0].status },
        ipAddress,
        userAgent,
        success: false,
        error: 'Account not active',
      });
      throw new Error('Account is not active');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user[0].passwordHash);
    if (!isValidPassword) {
      await auditLogger.logSystemAction({
        action: 'login_attempt',
        resource: 'auth',
        details: { email, reason: 'invalid_password' },
        ipAddress,
        userAgent,
        success: false,
        error: 'Invalid password',
      });
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const permissions = await this.getUserPermissions(user[0].id);
    const tokens = this.generateTokens({
      userId: user[0].id,
      email: user[0].email,
      role: user[0].role,
      permissions,
    });

    // Update last login
    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user[0].id));

    // Log successful login
    await auditLogger.logUserAction({
      userId: user[0].id,
      action: 'login',
      resource: 'auth',
      details: { email },
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      user: {
        ...user[0],
        passwordHash: undefined, // Remove sensitive data
      },
      tokens,
    };
  }

  // ... rest of the AuthService implementation
}
```

### **Step 6: CSRF Protection**

**File**: `artifacts/api-server/src/middlewares/csrf.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFToken {
  token: string;
  expires: number;
}

export class CSRFProtection {
  private static instance: CSRFProtection;
  private tokens: Map<string, CSRFToken> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  constructor() {
    // Clean up expired tokens every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, token] of this.tokens.entries()) {
      if (token.expires <= now) {
        this.tokens.delete(key);
      }
    }
  }

  getToken(sessionId: string): string {
    const now = Date.now();
    const expires = now + (60 * 60 * 1000); // 1 hour

    let token = this.tokens.get(sessionId);
    if (!token || token.expires <= now) {
      token = {
        token: this.generateToken(),
        expires,
      };
      this.tokens.set(sessionId, token);
    }

    return token.token;
  }

  validateToken(sessionId: string, providedToken: string): boolean {
    const token = this.tokens.get(sessionId);
    if (!token) {
      return false;
    }

    if (token.expires <= Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }

    return token.token === providedToken;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip CSRF for API endpoints with Bearer tokens
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return next();
      }

      const sessionId = req.session?.id;
      const csrfToken = req.headers['x-csrf-token'];

      if (!sessionId || !csrfToken) {
        return res.status(403).json({ error: 'CSRF token missing' });
      }

      if (!this.validateToken(sessionId, csrfToken)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }

      next();
    };
  }
}

export const csrfProtection = CSRFProtection.getInstance();
```

### **Step 7: Enhanced API Routes with Security**

**Update**: `artifacts/api-server/src/routes/crm/contacts.ts`
```typescript
import { Router } from 'express';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '@workspace/db';
import { contactsTable, insertContactSchema, selectContactSchema } from '@workspace/db/schema';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';
import { securityHeaders } from '../middlewares/security';
import { generalRateLimiter, uploadRateLimiter } from '../middlewares/rateLimit';
import { sanitizeText, validateEmail, validatePhone } from '../lib/sanitization';
import { auditLogger } from '../lib/auditLogger';
import { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../middlewares/errorHandler';

const router = Router();

// Apply security headers to all routes
router.use(securityHeaders);

// Apply rate limiting
router.use(generalRateLimiter.middleware());

// GET /api/crm/contacts - List contacts
router.get('/', 
  authenticateToken, 
  requirePermission('crm:contacts:read'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Validate and sanitize inputs
    if (search) {
      const sanitizedSearch = sanitizeText(search);
      if (sanitizedSearch.length < 2) {
        throw new ValidationError([
          { field: 'search', message: 'Search term must be at least 2 characters' },
        ]);
      }
    }

    // Log data access
    await auditLogger.logUserAction({
      userId: req.user!.userId,
      action: 'list_contacts',
      resource: 'crm_contacts',
      details: { page, limit, search, status, assignedTo },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    });

    // ... rest of the implementation
  })
);

// POST /api/crm/contacts - Create contact
router.post('/', 
  authenticateToken, 
  requirePermission('crm:contacts:write'),
  uploadRateLimiter.middleware(5), // Stricter rate limiting for creation
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validatedData = insertContactSchema.parse(req.body);
    
    // Sanitize text fields
    const sanitizedData = {
      ...validatedData,
      firstName: sanitizeText(validatedData.firstName),
      lastName: sanitizeText(validatedData.lastName),
      company: sanitizeText(validatedData.company || ''),
      title: sanitizeText(validatedData.title || ''),
      notes: sanitizeText(validatedData.notes || ''),
    };

    // Validate email format
    if (!validateEmail(sanitizedData.email)) {
      throw new ValidationError([
        { field: 'email', message: 'Invalid email format' },
      ]);
    }

    // Validate phone format if provided
    if (sanitizedData.phone && !validatePhone(sanitizedData.phone)) {
      throw new ValidationError([
        { field: 'phone', message: 'Invalid phone format' },
      ]);
    }
    
    // Check for duplicate email
    const existingContact = await db
      .select()
      .from(contactsTable)
      .where(eq(contactsTable.email, sanitizedData.email))
      .limit(1);

    if (existingContact[0]) {
      await auditLogger.logUserAction({
        userId: req.user!.userId,
        action: 'create_contact_duplicate',
        resource: 'crm_contacts',
        details: { email: sanitizedData.email },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        error: 'Duplicate email',
      });
      
      throw new ConflictError('A contact with this email already exists');
    }
    
    const result = await db
      .insert(contactsTable)
      .values({
        ...sanitizedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Log successful creation
    await auditLogger.logUserAction({
      userId: req.user!.userId,
      action: 'create_contact',
      resource: 'crm_contacts',
      resourceId: result[0].id,
      details: { email: sanitizedData.email, name: `${sanitizedData.firstName} ${sanitizedData.lastName}` },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    });

    res.status(201).json({ data: result[0] });
  })
);

// ... rest of the routes with similar security enhancements

export default router;
```

### **Step 8: Security Monitoring**

**File**: `artifacts/api-server/src/lib/securityMonitor.ts`
```typescript
import { logger } from './logger';

export interface SecurityEvent {
  type: 'suspicious_login' | 'rate_limit_exceeded' | 'invalid_token' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  async reportEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Log security event
    logger.warn('Security Event', securityEvent);

    // High severity events require immediate attention
    if (event.severity === 'critical') {
      await this.sendAlert(securityEvent);
    }

    // Store in audit log
    // await this.storeSecurityEvent(securityEvent);
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    // TODO: Send to security monitoring service
    // await securityService.sendAlert(event);
    
    console.error('CRITICAL SECURITY EVENT:', event);
  }

  // Detection methods
  detectSuspiciousLogin(ipAddress: string, userAgent?: string): boolean {
    // Implement logic to detect suspicious login patterns
    // - Multiple failed attempts from same IP
    // - Unusual user agent
    // - Login from unusual geographic location
    return false;
  }

  detectPrivilegeEscalation(userId: string, requestedPermission: string, userPermissions: string[]): boolean {
    // Check if user is trying to access permissions they don't have
    return !userPermissions.includes(requestedPermission);
  }

  detectTokenAnomaly(token: string): boolean {
    // Detect suspicious tokens
    // - Blacklisted tokens
    // - Tokens from unusual sources
    // - Tokens with unusual patterns
    return false;
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
```

### **Step 9: Environment Security Configuration**

**File**: `.env.example`
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/apex_unified_suite

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_minimum_32_characters

# CORS Origins (comma-separated, specific domains only)
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com

# Security
SESSION_SECRET=your_session_secret_here_minimum_32_characters
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=900000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Security Headers
ENABLE_HSTS=true
ENABLE_CSP=true
ENABLE_XSS_PROTECTION=true

# Monitoring
SECURITY_WEBHOOK_URL=https://your-security-monitoring.com/webhook
SECURITY_ALERT_EMAIL=security@yourdomain.com

# Email (for security notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-security-email@gmail.com
SMTP_PASS=your-app-password
```

### **Step 10: Security Testing**

**File**: `tests/security/auth.test.ts`
```typescript
import request from 'supertest';
import { app } from '../../artifacts/api-server/src/app';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('should reject login with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body.error).toContain('validation error');
    });

    it('should rate limit login attempts', async () => {
      // Make multiple rapid login attempts
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse?.body.error).toBe('Too many requests');
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/healthz')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Input Validation Security', () => {
    it('should reject XSS attempts in contact creation', async () => {
      const xssPayload = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        email: 'test@example.com',
        notes: '<img src=x onerror=alert("xss")>',
      };

      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(xssPayload)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });

    it('should sanitize HTML in text fields', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          notes: '<b>Bold text</b> and <script>alert("xss")</script>',
        })
        .expect(201);

      // Notes should be sanitized
      expect(response.body.data.notes).not.toContain('<script>');
      expect(response.body.data.notes).not.toContain('</script>');
    });
  });

  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token for forms', async () => {
      const response = await request(app)
        .post('/api/crm/contacts')
        .set('Cookie', 'sessionId=test-session')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        })
        .expect(403);

      expect(response.body.error).toBe('CSRF token missing');
    });
  });
});
```

## Security Checklist

### **Authentication & Authorization**
- [ ] Implement strong JWT secrets (32+ characters)
- [ ] Use bcrypt with 12+ rounds for passwords
- [ ] Implement account lockout after failed attempts
- [ ] Add session management with secure cookies
- [ ] Implement RBAC with fine-grained permissions
- [ ] Audit log all authentication events

### **Input Validation & Sanitization**
- [ ] Validate all inputs with Zod schemas
- [ ] Sanitize user-generated content
- [ ] Implement HTML sanitization for rich text
- [ ] Validate file uploads with proper MIME types
- [ ] Implement filename sanitization
- [ ] Add input length limits

### **Rate Limiting & DDoS Protection**
- [ ] Implement rate limiting per endpoint
- [ ] Use different limits for auth vs. data endpoints
- [ ] Add IP-based blocking for abuse
- [ ] Implement exponential backoff for retries
- [ ] Add rate limit headers to responses

### **Security Headers**
- [ ] Implement Content Security Policy (CSP)
- [ ] Add HSTS for HTTPS enforcement
- [ ] Set X-Frame-Options to prevent clickjacking
- [ ] Add XSS protection headers
- [ ] Implement proper CORS configuration
- [ ] Remove server information headers

### **Audit & Monitoring**
- [ ] Log all security-relevant events
- [ ] Implement audit trail for data access
- [ ] Monitor for suspicious patterns
- [ ] Set up security alerts for critical events
- [ ] Implement log aggregation and analysis
- [ ] Add security metrics dashboard

This comprehensive security hardening implementation significantly improves the security posture of the Apex Unified Suite, protecting against common web application vulnerabilities and providing proper monitoring and audit capabilities.

---

## seed-data-management

**Description:** Implement database seeding system for development, testing, and staging environments with realistic mock data generation

# Seed Data Management

This skill guides you through implementing a database seeding system for populating development, testing, and staging environments with realistic mock data.

## Current State Assessment

**Current State**: No seed data exists - database is empty after schema creation.

**Missing Infrastructure**:
- No seed scripts for development
- No test data factories
- No realistic mock data generation
- No seeding for integration tests

## Seed Data Architecture

### **Seed Categories**

| Environment | Purpose | Data Volume |
|-------------|---------|-------------|
| **Development** | Local development | Minimal (10-50 records) |
| **Testing** | Automated tests | Controlled (fixed scenarios) |
| **Staging** | UAT/QA testing | Realistic (1000-10000 records) |
| **Demo** | Sales demos | Rich (pre-configured scenarios) |

### **Seed Order (Dependencies)**

```
1. Organizations (root entity)
2. Users, Roles, Permissions (identity)
3. Contacts, Companies (CRM foundation)
4. Leads, Deals (CRM active data)
5. Projects, Tasks (project management)
6. Invoices, Payments (finance)
7. Folders, Documents (documents)
8. Assets, Checkouts (assets)
9. Portal Clients (portal)
10. Settings, Integrations (system)
```

## Step-by-Step Implementation

### **Step 1: Create Seed Configuration**

**File**: `lib/db/src/seed/config.ts`

```typescript
/**
 * Seed configuration for different environments
 */
export const seedConfig = {
  development: {
    organizations: 2,
    usersPerOrg: 5,
    contactsPerOrg: 50,
    leadsPerOrg: 30,
    projectsPerOrg: 10,
    tasksPerProject: 5,
  },
  testing: {
    organizations: 1,
    usersPerOrg: 3,
    contactsPerOrg: 10,
    leadsPerOrg: 5,
    projectsPerOrg: 3,
    tasksPerProject: 3,
  },
  staging: {
    organizations: 5,
    usersPerOrg: 10,
    contactsPerOrg: 500,
    leadsPerOrg: 200,
    projectsPerOrg: 50,
    tasksPerProject: 10,
  },
};

export type SeedEnvironment = keyof typeof seedConfig;
```

### **Step 2: Create Data Generators**

**File**: `lib/db/src/seed/generators.ts`

```typescript
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

/**
 * Generate realistic but deterministic data
 */
export const generators = {
  uuid: () => randomUUID(),
  
  organizationName: () => faker.company.name(),
  organizationSlug: (name: string) => 
    name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
  
  userName: () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  }),
  
  email: (firstName: string, lastName: string, domain?: string) => {
    const d = domain || faker.internet.domainName();
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${d}`;
  },
  
  passwordHash: () => 
    // Argon2 hash for 'Password123!'
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$hashhere',
  
  contact: (orgDomain: string) => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({ domain: orgDomain }),
    phone: faker.phone.number(),
    company: faker.company.name(),
    title: faker.person.jobTitle(),
    status: faker.helpers.arrayElement(['active', 'inactive']) as 'active' | 'inactive',
    tags: faker.helpers.arrayElements(['vip', 'prospect', 'customer', 'partner'], { min: 0, max: 3 }),
    notes: faker.lorem.paragraph(),
  }),
  
  leadTitle: () => 
    faker.helpers.arrayElement([
      'Enterprise Software License',
      'Consulting Services',
      'Annual Support Contract',
      'Training Package',
      'Implementation Project',
    ]),
  
  leadStage: () => 
    faker.helpers.arrayElement([
      'new',
      'qualified',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost',
    ]) as 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
  
  projectName: () => 
    faker.helpers.arrayElement([
      'Website Redesign',
      'Mobile App Development',
      'CRM Integration',
      'Data Migration',
      'Security Audit',
      'Cloud Migration',
    ]),
  
  projectStatus: () =>
    faker.helpers.arrayElement([
      'planning',
      'active',
      'on_hold',
      'completed',
    ]) as 'planning' | 'active' | 'on_hold' | 'completed',
  
  taskTitle: () =>
    faker.helpers.arrayElement([
      'Initial Requirements Gathering',
      'Design Mockups',
      'API Development',
      'Frontend Implementation',
      'Testing & QA',
      'Documentation',
      'Deployment',
    ]),
  
  taskStatus: () =>
    faker.helpers.arrayElement([
      'todo',
      'in_progress',
      'done',
      'blocked',
    ]) as 'todo' | 'in_progress' | 'done' | 'blocked',
  
  invoiceAmount: () => faker.number.int({ min: 1000, max: 50000 }),
  
  documentName: () =>
    faker.helpers.arrayElement([
      'Contract.pdf',
      'Proposal.pdf',
      'Invoice.pdf',
      'NDA.pdf',
      'Statement of Work.pdf',
    ]),
};
```

### **Step 3: Create Seed Functions**

**File**: `lib/db/src/seed/seeders.ts`

```typescript
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  rolesTable,
} from '../schema/auth';
import { 
  contactsTable, 
  leadsTable 
} from '../schema/crm';
import { 
  projectsTable, 
  tasksTable 
} from '../schema/projects';
import { generators } from './generators';
import { seedConfig, SeedEnvironment } from './config';
import { eq } from 'drizzle-orm';

/**
 * Seed organizations
 */
export async function seedOrganizations(count: number) {
  const orgs = [];
  
  for (let i = 0; i < count; i++) {
    const name = generators.organizationName();
    const slug = generators.organizationSlug(name);
    
    const org = await db.insert(organizationsTable).values({
      id: generators.uuid(),
      name,
      slug,
      planType: i === 0 ? 'enterprise' : 'pro',
      settings: {},
    }).returning();
    
    orgs.push(org[0]);
  }
  
  console.log(`✓ Seeded ${orgs.length} organizations`);
  return orgs;
}

/**
 * Seed users for an organization
 */
export async function seedUsers(organizationId: string, count: number) {
  const users = [];
  const orgDomain = `org-${organizationId.slice(0, 8)}.example.com`;
  
  // Create admin user
  const adminName = generators.userName();
  const admin = await db.insert(usersTable).values({
    id: generators.uuid(),
    organizationId,
    email: generators.email(adminName.firstName, adminName.lastName, orgDomain),
    passwordHash: generators.passwordHash(),
    name: `${adminName.firstName} ${adminName.lastName}`,
    role: 'admin',
    status: 'active',
    emailVerified: true,
  }).returning();
  users.push(admin[0]);
  
  // Create regular users
  for (let i = 1; i < count; i++) {
    const name = generators.userName();
    const user = await db.insert(usersTable).values({
      id: generators.uuid(),
      organizationId,
      email: generators.email(name.firstName, name.lastName, orgDomain),
      passwordHash: generators.passwordHash(),
      name: `${name.firstName} ${name.lastName}`,
      role: i % 3 === 0 ? 'viewer' : 'user',
      status: 'active',
      emailVerified: true,
    }).returning();
    users.push(user[0]);
  }
  
  console.log(`✓ Seeded ${users.length} users for ${organizationId}`);
  return users;
}

/**
 * Seed default roles
 */
export async function seedRoles(organizationId: string) {
  const defaultRoles = [
    { name: 'admin', permissions: ['*'] },
    { name: 'user', permissions: ['crm:read', 'crm:write', 'projects:read', 'projects:write'] },
    { name: 'viewer', permissions: ['crm:read', 'projects:read'] },
  ];
  
  for (const role of defaultRoles) {
    await db.insert(rolesTable).values({
      id: generators.uuid(),
      organizationId,
      name: role.name,
      description: `${role.name} role`,
      permissions: role.permissions,
    });
  }
  
  console.log(`✓ Seeded default roles for ${organizationId}`);
}

/**
 * Seed contacts for an organization
 */
export async function seedContacts(
  organizationId: string, 
  count: number,
  userIds: string[]
) {
  const contacts = [];
  const orgDomain = `org-${organizationId.slice(0, 8)}.example.com`;
  
  for (let i = 0; i < count; i++) {
    const contactData = generators.contact(orgDomain);
    const assignedTo = userIds[i % userIds.length];
    
    const contact = await db.insert(contactsTable).values({
      id: generators.uuid(),
      organizationId,
      assignedTo,
      ...contactData,
    }).returning();
    
    contacts.push(contact[0]);
  }
  
  console.log(`✓ Seeded ${contacts.length} contacts for ${organizationId}`);
  return contacts;
}

/**
 * Seed leads for an organization
 */
export async function seedLeads(
  organizationId: string,
  count: number,
  contactIds: string[],
  userIds: string[]
) {
  const leads = [];
  
  for (let i = 0; i < count; i++) {
    const contactId = contactIds[i % contactIds.length];
    const assignedTo = userIds[i % userIds.length];
    
    const lead = await db.insert(leadsTable).values({
      id: generators.uuid(),
      organizationId,
      contactId,
      title: generators.leadTitle(),
      description: `Lead generated from ${faker.helpers.arrayElement(['website', 'referral', 'cold-call', 'email'])}`,
      value: generators.invoiceAmount().toString(),
      stage: generators.leadStage(),
      source: faker.helpers.arrayElement(['website', 'referral', 'cold-call', 'email', 'social']),
      assignedTo,
      probability: faker.number.int({ min: 0, max: 100 }),
      expectedCloseDate: faker.date.future(),
    }).returning();
    
    leads.push(lead[0]);
  }
  
  console.log(`✓ Seeded ${leads.length} leads for ${organizationId}`);
  return leads;
}

/**
 * Seed projects for an organization
 */
export async function seedProjects(
  organizationId: string,
  count: number,
  userIds: string[]
) {
  const projects = [];
  
  for (let i = 0; i < count; i++) {
    const project = await db.insert(projectsTable).values({
      id: generators.uuid(),
      organizationId,
      name: generators.projectName(),
      description: faker.lorem.paragraph(),
      status: generators.projectStatus(),
      ownerId: userIds[i % userIds.length],
      budget: faker.number.int({ min: 10000, max: 100000 }),
      startDate: faker.date.past(),
      targetEndDate: faker.date.future(),
    }).returning();
    
    projects.push(project[0]);
  }
  
  console.log(`✓ Seeded ${projects.length} projects for ${organizationId}`);
  return projects;
}

/**
 * Seed tasks for projects
 */
export async function seedTasks(
  organizationId: string,
  projectId: string,
  count: number,
  userIds: string[]
) {
  const tasks = [];
  
  for (let i = 0; i < count; i++) {
    const task = await db.insert(tasksTable).values({
      id: generators.uuid(),
      organizationId,
      projectId,
      title: generators.taskTitle(),
      description: faker.lorem.paragraph(),
      status: generators.taskStatus(),
      assignedTo: userIds[i % userIds.length],
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      dueDate: faker.date.future(),
    }).returning();
    
    tasks.push(task[0]);
  }
  
  console.log(`✓ Seeded ${tasks.length} tasks for project ${projectId}`);
  return tasks;
}
```

### **Step 4: Main Seed Script**

**File**: `lib/db/src/seed/index.ts`

```typescript
import { db } from '../db';
import { seedConfig, SeedEnvironment } from './config';
import {
  seedOrganizations,
  seedUsers,
  seedRoles,
  seedContacts,
  seedLeads,
  seedProjects,
  seedTasks,
} from './seeders';

/**
 * Main seed function
 */
export async function seed(environment: SeedEnvironment = 'development') {
  const config = seedConfig[environment];
  
  console.log(`\n🌱 Starting seed for ${environment} environment...\n`);
  
  try {
    // 1. Organizations
    const organizations = await seedOrganizations(config.organizations);
    
    for (const org of organizations) {
      // 2. Roles (must be before users)
      await seedRoles(org.id);
      
      // 3. Users
      const users = await seedUsers(org.id, config.usersPerOrg);
      const userIds = users.map(u => u.id);
      
      // 4. Contacts
      const contacts = await seedContacts(
        org.id, 
        config.contactsPerOrg, 
        userIds
      );
      const contactIds = contacts.map(c => c.id);
      
      // 5. Leads
      await seedLeads(org.id, config.leadsPerOrg, contactIds, userIds);
      
      // 6. Projects
      const projects = await seedProjects(org.id, config.projectsPerOrg, userIds);
      
      // 7. Tasks
      for (const project of projects) {
        await seedTasks(
          org.id,
          project.id,
          config.tasksPerProject,
          userIds
        );
      }
    }
    
    console.log('\n✅ Seed completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

/**
 * Clear all data (use with caution!)
 */
export async function clearDatabase() {
  console.log('\n🗑️  Clearing database...\n');
  
  // Delete in reverse order of dependencies
  await db.delete(tasksTable);
  await db.delete(projectsTable);
  await db.delete(leadsTable);
  await db.delete(contactsTable);
  await db.delete(usersTable);
  await db.delete(rolesTable);
  await db.delete(organizationsTable);
  
  console.log('✓ Database cleared\n');
}

// CLI execution
if (require.main === module) {
  const env = (process.argv[2] as SeedEnvironment) || 'development';
  const shouldClear = process.argv.includes('--clear');
  
  (async () => {
    if (shouldClear) {
      await clearDatabase();
    }
    await seed(env);
    process.exit(0);
  })();
}

// Import tables for clearDatabase
import { tasksTable, projectsTable } from '../schema/projects';
```

### **Step 5: Package.json Scripts**

**File**: `lib/db/package.json`

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/seed/index.ts",
    "db:seed:staging": "tsx src/seed/index.ts staging",
    "db:seed:clear": "tsx src/seed/index.ts --clear",
    "db:reset": "tsx src/seed/index.ts --clear && tsx src/seed/index.ts"
  }
}
```

### **Step 6: Test Data Factory**

**File**: `artifacts/api-server/__tests__/helpers/test-data-factory.ts`

```typescript
import { db } from '@workspace/db';
import { usersTable, organizationsTable } from '@workspace/db/schema/auth';
import { contactsTable } from '@workspace/db/schema/crm';
import { generators } from '@workspace/db/seed/generators';

/**
 * Factory for creating test data in integration tests
 */
export class TestDataFactory {
  private orgId: string;
  private userId: string;

  constructor() {
    this.orgId = generators.uuid();
    this.userId = generators.uuid();
  }

  async createOrganization(overrides?: Partial<typeof organizationsTable.$inferInsert>) {
    const org = await db.insert(organizationsTable).values({
      id: this.orgId,
      name: 'Test Organization',
      slug: 'test-org',
      planType: 'pro',
      ...overrides,
    }).returning();
    return org[0];
  }

  async createUser(overrides?: Partial<typeof usersTable.$inferInsert>) {
    const user = await db.insert(usersTable).values({
      id: this.userId,
      organizationId: this.orgId,
      email: 'test@example.com',
      passwordHash: generators.passwordHash(),
      name: 'Test User',
      role: 'user',
      status: 'active',
      ...overrides,
    }).returning();
    return user[0];
  }

  async createContact(overrides?: Partial<typeof contactsTable.$inferInsert>) {
    const contact = await db.insert(contactsTable).values({
      id: generators.uuid(),
      organizationId: this.orgId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: 'active',
      ...overrides,
    }).returning();
    return contact[0];
  }

  getOrgId() {
    return this.orgId;
  }

  getUserId() {
    return this.userId;
  }
}
```

## Verification Commands

```bash
# Seed development database
pnpm --filter @workspace/db run db:seed

# Seed with clear
pnpm --filter @workspace/db run db:reset

# Seed staging data
pnpm --filter @workspace/db run db:seed:staging

# Verify seed data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM contacts;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM leads;"
```

## Seed Checklist

- [ ] Seed script runs without errors
- [ ] Data respects multi-tenancy (organization_id set)
- [ ] Foreign key constraints satisfied
- [ ] Realistic data generated
- [ ] Clear function works for cleanup
- [ ] Test factory creates valid test data

---

## testing-infrastructure

**Description:** Complete testing setup with Vitest 2.0, React Testing Library, Playwright 1.45, and API endpoint tests using 2026 best practices

# Testing Infrastructure Setup

This skill guides you through implementing a comprehensive testing infrastructure for the Apex Unified Suite, covering unit tests, component tests, API tests, and end-to-end testing.

## Current State Assessment

**Testing Status**: Zero test files exist; no testing framework configured.

**Missing Infrastructure**:
- No test frameworks (Vitest, Playwright, React Testing Library)
- No test configuration files
- Zero test files across the entire codebase
- No CI/CD testing pipeline
- No test coverage reporting

## Testing Architecture

### **Testing Pyramid**
```
E2E Tests (Playwright)
├── User workflows across entire application
└── Critical business scenarios

Integration Tests
├── API endpoint testing with database
├── Component integration with React Query
└── Cross-module interaction testing

Unit Tests (Vitest)
├── Pure function testing
├── React component testing (RTL)
├── Hook testing
└── Utility function testing
```

## Step-by-Step Implementation

### **Step 1: Install Testing Dependencies**

**Backend Dependencies**:
```bash
pnpm --filter @workspace/api-server add -D vitest@^2.0.0 @vitest/supabase supertest @types/supertest
```

**Frontend Dependencies**:
```bash
pnpm --filter @workspace/apex-os add -D vitest@^2.0.0 @testing-library/react@^14.0.0 @testing-library/jest-dom@^6.0.0 @testing-library/user-event@^14.0.0 jsdom
```

**E2E Dependencies**:
```bash
pnpm add -D @playwright/test@^1.45.0 playwright
```

**Database Testing**:
```bash
pnpm --filter @workspace/db add -D @types/supertest vitest@^2.0.0
```

### **Step 2: Vitest Configuration**

**File**: `vitest.config.ts` (root level)
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.generated/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'artifacts/apex-os/src'),
      '@workspace/api-client-react': resolve(__dirname, 'lib/api-client-react/src'),
      '@workspace/api-zod': resolve(__dirname, 'lib/api-zod/src'),
      '@workspace/db': resolve(__dirname, 'lib/db/src'),
    },
  },
});
```

**File**: `tests/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Setup MSW
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close server after all tests
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

### **Step 3: Mock Service Worker Setup**

**File**: `tests/mocks/handlers.ts`
```typescript
import { rest } from 'msw';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          status: 'active',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        tokens: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
      })
    );
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer test-access-token')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          status: 'active',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        permissions: ['crm:contacts:read', 'crm:contacts:write'],
      })
    );
  }),

  // CRM endpoints
  rest.get('/api/crm/contacts', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 20;
    const search = req.url.searchParams.get('search') || '';

    const mockContacts = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        title: 'CEO',
        status: 'active',
        assignedTo: 'test-user-id',
        tags: ['vip', 'prospect'],
        notes: 'Important contact',
        lastContactedAt: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        company: 'Beta Inc',
        title: 'CTO',
        status: 'active',
        assignedTo: 'test-user-id',
        tags: ['tech', 'lead'],
        notes: 'Technical decision maker',
        lastContactedAt: '2024-01-14T15:30:00Z',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
      },
    ];

    // Filter by search
    const filteredContacts = search
      ? mockContacts.filter(contact =>
          contact.firstName.toLowerCase().includes(search.toLowerCase()) ||
          contact.lastName.toLowerCase().includes(search.toLowerCase()) ||
          contact.email.toLowerCase().includes(search.toLowerCase()) ||
          contact.company?.toLowerCase().includes(search.toLowerCase())
        )
      : mockContacts;

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        data: paginatedContacts,
        meta: {
          total: filteredContacts.length,
          page,
          limit,
          hasNext: endIndex < filteredContacts.length,
          hasPrev: page > 1,
        },
      })
    );
  }),

  rest.post('/api/crm/contacts', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: {
          id: 'new-contact-id',
          ...req.body,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Dashboard endpoints
  rest.get('/api/dashboard/metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          revenueMTD: 124500,
          activeProjects: 34,
          leadsCount: 128,
          overdueTasks: 12,
          revenueGrowth: 15.3,
          projectsGrowth: 8.7,
          leadsGrowth: 22.1,
          tasksGrowth: -5.2,
        },
      })
    );
  }),

  rest.get('/api/dashboard/activities', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: '1',
            type: 'contact_created',
            description: 'New contact John Doe was created',
            timestamp: '2024-01-15T10:00:00Z',
            user: 'Test User',
          },
          {
            id: '2',
            type: 'deal_won',
            description: 'Enterprise software deal was won',
            timestamp: '2024-01-14T15:30:00Z',
            user: 'Sales Team',
          },
          {
            id: '3',
            type: 'task_completed',
            description: 'Project setup task was completed',
            timestamp: '2024-01-13T09:15:00Z',
            user: 'Project Manager',
          },
        ],
      })
    );
  }),
];
```

**File**: `tests/mocks/server.ts`
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### **Step 4: Component Testing Examples**

**File**: `tests/components/CRM.test.tsx`
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMPage } from '@/pages/CRM';
import { AuthProvider } from '@/contexts/AuthContext';
import { test, expect } from 'vitest';

// Test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('CRM Page', () => {
  test('renders CRM page with contacts', async () => {
    renderWithProviders(<CRMPage />);

    // Check page title
    expect(screen.getByText('CRM')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();

    // Wait for contacts to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check contact details
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
  });

  test('searches contacts correctly', async () => {
    renderWithProviders(<CRMPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search contacts...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    // Wait for search results
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('opens create contact modal', async () => {
    renderWithProviders(<CRMPage />);

    // Click add contact button
    const addButton = screen.getByText('Add Contact');
    fireEvent.click(addButton);

    // Check if modal would open (in real implementation)
    // This would test the modal component
    expect(addButton).toBeInTheDocument();
  });

  test('handles pagination', async () => {
    renderWithProviders(<CRMPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check pagination controls
    // In real implementation, test next/previous buttons
    expect(screen.getByText(/Showing \d+ of \d+ contacts/)).toBeInTheDocument();
  });

  test('displays error state on API failure', async () => {
    // Mock server error
    global.server.use(
      rest.get('/api/crm/contacts', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    renderWithProviders(<CRMPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Error loading contacts/)).toBeInTheDocument();
    });
  });
});
```

**File**: `tests/components/Dashboard.test.tsx`
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/Dashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { test, expect } from 'vitest';

describe('Dashboard Page', () => {
  test('renders dashboard with metrics', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Check page title
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText('$124,500')).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('128')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    // Check metric labels
    expect(screen.getByText('Revenue MTD')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('New Leads')).toBeInTheDocument();
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
  });

  test('renders activity feed', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for activities to load
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('New contact John Doe was created')).toBeInTheDocument();
      expect(screen.getByText('Enterprise software deal was won')).toBeInTheDocument();
      expect(screen.getByText('Project setup task was completed')).toBeInTheDocument();
    });
  });
});
```

### **Step 5: API Endpoint Testing**

**File**: `tests/api/crm/contacts.test.ts`
```typescript
import request from 'supertest';
import { app } from '../../../artifacts/api-server/src/app';
import { db } from '@workspace/db';
import { contactsTable } from '@workspace/db/schema';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CRM Contacts API', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.delete(contactsTable);
  });

  afterEach(async () => {
    // Clean up after each test
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
      expect(response.body.meta.hasPrev).toBe(false);
    });

    it('should filter contacts by search term', async () => {
      await db.insert(contactsTable).values([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
          status: 'active',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          company: 'Beta Inc',
          status: 'active',
        },
      ]);

      const response = await request(app)
        .get('/api/crm/contacts?search=Acme')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].company).toBe('Acme Corp');
    });

    it('should filter contacts by status', async () => {
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
          status: 'inactive',
        },
      ]);

      const response = await request(app)
        .get('/api/crm/contacts?status=active')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/crm/contacts')
        .expect(401);
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
      expect(response.body.data.createdAt).toBeDefined();
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

    it('should enforce unique email constraint', async () => {
      // Create first contact
      await db.insert(contactsTable).values({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      });

      // Try to create duplicate
      const duplicateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com', // Same email
      };

      await request(app)
        .post('/api/crm/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send(duplicateData)
        .expect(500); // Database constraint error
    });
  });

  describe('PUT /api/crm/contacts/:id', () => {
    it('should update a contact', async () => {
      // Create contact first
      const created = await db.insert(contactsTable).values({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      }).returning();

      const updateData = {
        firstName: 'Jonathan',
        company: 'Updated Corp',
      };

      const response = await request(app)
        .put(`/api/crm/contacts/${created[0].id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.company).toBe(updateData.company);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent contact', async () => {
      const updateData = {
        firstName: 'Jonathan',
      };

      await request(app)
        .put('/api/crm/contacts/non-existent-id')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/crm/contacts/:id', () => {
    it('should delete a contact', async () => {
      // Create contact first
      const created = await db.insert(contactsTable).values({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      }).returning();

      const response = await request(app)
        .delete(`/api/crm/contacts/${created[0].id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.data.id).toBe(created[0].id);

      // Verify deletion
      const remaining = await db
        .select()
        .from(contactsTable)
        .where(eq(contactsTable.id, created[0].id));

      expect(remaining).toHaveLength(0);
    });

    it('should return 404 for non-existent contact', async () => {
      await request(app)
        .delete('/api/crm/contacts/non-existent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });
});
```

### **Step 6: Playwright E2E Testing**

**File**: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm --filter @workspace/apex-os run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

**2026 Updates**: Playwright 1.45 introduces component testing mode that reduces E2E+component test overlap by 72% compared to Jest + Cypress stacks. Consider adding component testing for critical UI components.

**File**: `tests/e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should allow user to logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});
```

**File**: `tests/e2e/crm.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('CRM Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display contacts list', async ({ page }) => {
    await page.goto('/crm');
    
    // Check if CRM page loads
    await expect(page.getByText('CRM')).toBeVisible();
    
    // Check contacts tab
    await expect(page.getByText('Contacts')).toBeVisible();
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();
  });

  test('should search contacts', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Search for specific contact
    await page.fill('input[placeholder="Search contacts..."]', 'Jane');
    
    // Should only show Jane
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('John Doe')).not.toBeVisible();
  });

  test('should create new contact', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Click add contact button
    await page.click('button:has-text("Add Contact")');
    
    // Fill contact form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'Contact');
    await page.fill('input[name="email"]', 'test.contact@example.com');
    await page.fill('input[name="company"]', 'Test Company');
    
    // Submit form
    await page.click('button:has-text("Create")');
    
    // Should show success message and new contact in list
    await expect(page.getByText('Contact created successfully')).toBeVisible();
    await expect(page.getByText('Test Contact')).toBeVisible();
  });

  test('should edit contact', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Click edit button for first contact
    await page.locator('button[aria-label*="edit"]').first().click();
    
    // Update contact
    await page.fill('input[name="firstName"]', 'Updated');
    await page.click('button:has-text("Update")');
    
    // Should show success message and updated contact
    await expect(page.getByText('Contact updated successfully')).toBeVisible();
    await expect(page.getByText('Updated Doe')).toBeVisible();
  });

  test('should delete contact', async ({ page }) => {
    await page.goto('/crm');
    await page.click('text=Contacts');
    
    // Wait for contacts to load
    await expect(page.getByText('John Doe')).toBeVisible();
    
    // Click delete button for first contact
    await page.locator('button[aria-label*="delete"]').first().click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Should show success message and remove contact
    await expect(page.getByText('Contact deleted successfully')).toBeVisible();
    await expect(page.getByText('John Doe')).not.toBeVisible();
  });
});
```

### **Step 7: Update Package Scripts**

**File**: `package.json` (root level additions)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:api": "vitest --config vitest.api.config.ts",
    "test:components": "vitest --config vitest.components.config.ts"
  }
}
```

**File**: `vitest.api.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

**File**: `vitest.components.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/components/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'artifacts/apex-os/src'),
    },
  },
});
```

### **Step 8: CI/CD Integration**

**File**: `.github/workflows/test.yml`
```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type check
        run: pnpm run typecheck

      - name: Run unit tests
        run: pnpm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
```

## Testing Best Practices

### **Unit Testing**
- Test pure functions in isolation
- Mock external dependencies
- Use descriptive test names
- Test edge cases and error conditions
- Maintain high test coverage (>80%)

### **Component Testing**
- Test user interactions, not implementation details
- Use React Testing Library for DOM testing
- Mock API calls with MSW
- Test loading and error states
- Test accessibility features

### **API Testing**
- Test all endpoints with various inputs
- Test authentication and authorization
- Test error handling and validation
- Use test database for integration tests
- Test database constraints and relationships

### **E2E Testing**
- Test critical user workflows
- Test cross-browser compatibility
- Test responsive design
- Use realistic test data
- Maintain stable test selectors

This comprehensive testing infrastructure ensures code quality, prevents regressions, and provides confidence in the Apex Unified Suite's functionality across all layers of the application.

---

## typescript-strict-configuration

**Description:** Enable and manage strict TypeScript compiler flags for production-grade type safety across the workspace

# TypeScript Strict Configuration

This skill guides you through enabling strict TypeScript compiler flags to catch errors at compile time and enforce production-ready code quality.

## Current State Assessment

**Current Configuration**: `tsconfig.base.json` has strict flags explicitly disabled:
- `noImplicitOverride: false`
- `noUnusedLocals: false`  
- `strictFunctionTypes: false`

**Impact**: These relaxed flags allow potential runtime errors and missed edge cases to slip through.

## Strict Mode Flags (2026 Best Practices)

### **Core Strict Flags**

| Flag | Purpose | Why Enable |
|------|---------|------------|
| `strict: true` | Master switch enabling all strict type checking | Foundation for type safety |
| `noImplicitOverride` | Requires `override` keyword when overriding methods | Prevents silent breaking changes in inheritance |
| `noUnusedLocals` | Errors on unused variables/parameters | Cleaner code, catches typos |
| `strictFunctionTypes` | Contravariant function parameter checking | Prevents unsafe function assignments |
| `noImplicitReturns` | Requires all code paths to return | Prevents undefined returns |
| `noFallthroughCasesInSwitch` | Errors on switch fallthrough | Prevents accidental case fallthrough |
| `noUncheckedIndexedAccess` | Indexed access returns `\| undefined` | Forces null checks on array/object access |
| `exactOptionalPropertyTypes` | Distinguishes `undefined` from missing | Prevents subtle type bugs |
| `useUnknownInCatchVariables` | Catch variables are `unknown` not `any` | Forces proper error handling |

### **2026 Recommended Configuration**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

## Step-by-Step Implementation

### **Step 1: Backup Current Configuration**

```bash
# Create backup of current tsconfig
cp tsconfig.base.json tsconfig.base.json.backup

# Note current error count
pnpm run typecheck 2>&1 | grep -c "error TS" || echo "0 errors"
```

### **Step 2: Enable Strict Flags Incrementally**

**Phase A**: Enable core strict flags
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "strictFunctionTypes": true
  }
}
```

**Phase B**: Add safety flags after Phase A passes
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Phase C**: Final strict configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true
  }
}
```

### **Step 3: Fix Common Error Patterns**

#### **noImplicitOverride Errors**

**Before**:
```typescript
class BaseService {
  async findById(id: string) { /* ... */ }
}

class UserService extends BaseService {
  async findById(id: string) { /* overrides silently */ }
}
```

**After**:
```typescript
class BaseService {
  async findById(id: string) { /* ... */ }
}

class UserService extends BaseService {
  override async findById(id: string) { /* explicit override */ }
}
```

#### **noUnusedLocals Errors**

**Before**:
```typescript
function processUser(user: User) {
  const name = user.name; // Unused variable
  return user.id;
}
```

**After** (fix by using or removing):
```typescript
function processUser(user: User) {
  return user.id;
}
```

Or prefix with underscore if intentionally unused:
```typescript
function processUser(_user: User, context: Context) {
  return context.id;
}
```

#### **strictFunctionTypes Errors**

**Before**:
```typescript
type Handler = (x: string | number) => void;

const myHandler: Handler = (x: string) => { /* accepts only string */ };
// Unsafe: myHandler might be called with number
```

**After**:
```typescript
type Handler = (x: string | number) => void;

const myHandler: Handler = (x: string | number) => { 
  // Must handle both types
  if (typeof x === 'string') { /* ... */ }
};
```

#### **noImplicitReturns Errors**

**Before**:
```typescript
function getStatus(value: number): string {
  if (value > 0) {
    return "positive";
  }
  // Missing return for value <= 0
}
```

**After**:
```typescript
function getStatus(value: number): string {
  if (value > 0) {
    return "positive";
  }
  return "non-positive"; // Explicit return
}
```

#### **useUnknownInCatchVariables Errors**

**Before**:
```typescript
try {
  riskyOperation();
} catch (error) {
  console.log(error.message); // error is any, unsafe
}
```

**After**:
```typescript
try {
  riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // Type-safe access
  } else {
    console.log("Unknown error:", error);
  }
}
```

#### **noUncheckedIndexedAccess Errors**

**Before**:
```typescript
const items = ["a", "b", "c"];
const first = items[0]; // string, but could be undefined if array empty
console.log(first.toUpperCase()); // Runtime error if empty
```

**After**:
```typescript
const items = ["a", "b", "c"];
const first = items[0]; // string | undefined
if (first) {
  console.log(first.toUpperCase()); // Safe
}
// Or use optional chaining
console.log(first?.toUpperCase());
```

### **Step 4: Update All Package tsconfig Files**

Each package must extend the base config:

**File**: `lib/db/tsconfig.json`
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**File**: `artifacts/api-server/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**File**: `artifacts/apex-os/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"]
}
```

### **Step 5: Verify Type Checking**

```bash
# Run typecheck across all packages
pnpm run typecheck

# Check specific packages
pnpm --filter @workspace/db run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/apex-os run typecheck

# Watch mode for development
pnpm --filter @workspace/api-server run typecheck --watch
```

## Domain Error Alignment

Strict TypeScript flags reinforce domain invariants:

```typescript
// strictFunctionTypes catches this at compile time
class LeadService {
  // Domain rule: Stage transitions must be valid
  async moveToStage(leadId: string, stage: LeadStage): Promise<Result<Lead, DomainError>> {
    const lead = await this.findById(leadId);
    if (!lead) {
      return err(new LeadNotFound(leadId));
    }
    
    // noImplicitReturns ensures all paths return
    if (!isValidTransition(lead.stage, stage)) {
      return err(new InvalidStageTransition(lead.stage, stage));
    }
    
    // Type system enforces we return a Result
    return ok(await this.updateStage(leadId, stage));
  }
}
```

## CI/CD Integration

Add type checking to your CI pipeline:

**File**: `.github/workflows/typecheck.yml`
```yaml
name: TypeCheck

on: [push, pull_request]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
```

## Anti-Patterns to Avoid

❌ **Disabling flags with @ts-ignore**:
```typescript
// @ts-ignore - temporary workaround
// This creates technical debt and hides real issues
```

❌ **Using `any` to bypass strictness**:
```typescript
const data: any = fetchData(); // Defeats type safety
```

❌ **Incremental strictness without fixing errors**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false  // Don't partially enable
  }
}
```

## Benefits of Strict Mode

1. **Catches null/undefined errors** at compile time
2. **Prevents method signature mismatches** in inheritance
3. **Eliminates unused code** automatically
4. **Forces proper error handling** in catch blocks
5. **Makes refactoring safer** with compiler assistance
6. **Improves IDE autocomplete** with precise types

## Verification Checklist

- [ ] `tsconfig.base.json` has all strict flags enabled
- [ ] All packages extend `tsconfig.base.json`
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] No `@ts-ignore` comments in codebase
- [ ] No explicit `any` types in new code
- [ ] CI pipeline includes typecheck job
- [ ] All errors fixed with proper types (not workarounds)

## Expected Outcome

After completing this skill:
- Zero TypeScript errors across the workspace
- All strict compiler flags enabled
- Type-safe domain invariants enforced at compile time
- CI/CD pipeline blocking type errors
- Developer confidence in refactoring

---

## ydm-api-development

**Description:** Complete guide for implementing API-first development from scratch in the YDM monorepo (currently only health check exists)

# YDM API Development Workflow

This skill guides you through the API-first development process that ensures end-to-end type safety across the YDM monorepo.

## Understanding the Architecture

### **Code Generation Pipeline**
```
OpenAPI Spec → Orval → React Query Hooks + Zod Schemas → Type-safe API
```

### **Key Components**
- **lib/api-spec/openapi.yaml**: Single source of truth for API contract
- **lib/api-spec/orval.config.ts**: Code generation configuration
- **lib/api-client-react**: Generated TanStack Query hooks
- **lib/api-zod**: Generated Zod validation schemas

## API Development Workflow

### **1. Define API Specification**

#### **OpenAPI Specification Structure**
```yaml
# lib/api-spec/openapi.yaml
openapi: 3.1.0
info:
  title: Api  # Must remain "Api" for import path compatibility
  version: 0.1.0
servers:
  - url: /api  # All endpoints use /api prefix

paths:
  /users:
    get:
      operationId: getUsers
      summary: Get all users
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email
      required:
        - id
        - name
        - email
```

#### **Schema Definition Best Practices**
- Use clear, descriptive property names
- Include proper type constraints (format, minLength, etc.)
- Define required properties explicitly
- Use consistent naming conventions
- Include example values for complex types

### **2. Configure Code Generation**

#### **Orval Configuration Overview**
The `lib/api-spec/orval.config.ts` is already configured for dual generation:

```typescript
export default {
  // React Query Client Generation
  'api-client-react': {
    target: '../api-client-react/src/generated',
    mode: 'split',
    client: 'react-query',
    // ... configuration
  },
  
  // Zod Schema Generation  
  'api-zod': {
    target: '../api-zod/src/generated/types',
    mode: 'split',
    schemas: true,
    // ... configuration
  }
};
```

#### **Generation Settings**
- **Mode**: split (separate files per operation)
- **Type Coercion**: Boolean, number, string for queries/params
- **Advanced Features**: Dates and BigInt support enabled
- **Clean Output**: Auto-cleans generated files

### **3. Run Code Generation**

#### **Generation Command**
```bash
pnpm --filter @workspace/api-spec run codegen
```

#### **What Gets Generated**
- **React Query Hooks**: In `lib/api-client-react/src/generated/`
- **Zod Schemas**: In `lib/api-zod/src/generated/types/`
- **Type Definitions**: Complete TypeScript types for all API operations

### **4. Implement Backend Endpoints**

#### **Express Route Implementation**
```typescript
// artifacts/api-server/src/routes/users.ts
import { Router } from 'express';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';
import { z } from 'zod';
import { insertUserSchema } from '@workspace/api-zod';

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const validated = insertUserSchema.parse(req.body);
    const result = await db.insert(usersTable)
      .values(validated)
      .returning();
    res.status(201).json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

export default router;
```

#### **Route Registration**
```typescript
// artifacts/api-server/src/routes/index.ts
import usersRouter from './users';
// ... other routers

const router = Router();
router.use('/users', usersRouter);
// ... other routes

export default router;
```

### **5. Use Generated Frontend Hooks**

#### **React Query Hook Usage**
```typescript
// artifacts/nexus-digital/src/pages/Users.tsx
import { useUsersQuery, useCreateUserMutation } from '@workspace/api-client-react';

export function UsersPage() {
  const { data: users, isLoading, error } = useUsersQuery();
  
  const createUserMutation = useCreateUserMutation({
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name} - {user.email}</li>
        ))}
      </ul>
      
      <button onClick={() => createUserMutation.mutate({
        name: 'New User',
        email: 'user@example.com'
      })}>
        Add User
      </button>
    </div>
  );
}
```

## Advanced Patterns

### **Request/Response Transformation**
```typescript
// Custom fetch mutator for headers, auth, etc.
// lib/api-spec/src/custom-fetch.ts
export const customFetch = async (url: string, options?: RequestInit) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers here
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
```

### **Error Handling Patterns**
```typescript
// Global error handling for API calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Retry on network errors, not on 4xx errors
        return failureCount < 3 && error.status >= 500;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### **Optimistic Updates**
```typescript
const createUserMutation = useCreateUserMutation({
  onMutate: async (newUser) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users'] });
    
    // Snapshot the previous value
    const previousUsers = queryClient.getQueryData(['users']);
    
    // Optimistically update to the new value
    queryClient.setQueryData(['users'], (old: User[] | undefined) => 
      [...(old || []), { ...newUser, id: Date.now() }]
    );
    
    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['users'], context.previousUsers);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

## Integration Patterns

### **Database Schema Integration**
```typescript
// lib/db/src/schema/users.ts
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// This schema will match the OpenAPI User schema
export const insertUserSchema = createInsertSchema(usersTable).omit({ 
  id: true, 
  createdAt: true 
});
```

### **Validation Chain**
1. **Frontend**: Zod schemas validate form inputs
2. **API Client**: Generated hooks include type validation
3. **Backend**: Zod schemas validate request bodies
4. **Database**: Drizzle enforces schema constraints

## Testing Strategies

### **API Endpoint Testing**
```typescript
// Use generated schemas for test data
import { insertUserSchema } from '@workspace/api-zod';

describe('POST /api/users', () => {
  it('should create a user with valid data', async () => {
    const validUser = insertUserSchema.parse({
      name: 'Test User',
      email: 'test@example.com'
    });

    const response = await request(app)
      .post('/api/users')
      .send(validUser)
      .expect(201);

    expect(response.body).toMatchObject(validUser);
  });

  it('should reject invalid data', async () => {
    const invalidUser = { name: '', email: 'invalid' };

    const response = await request(app)
      .post('/api/users')
      .send(invalidUser)
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
```

### **Frontend Hook Testing**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsersQuery } from '@workspace/api-client-react';

describe('useUsersQuery', () => {
  it('should fetch users successfully', async () => {
    const queryClient = new QueryClient();
    
    const { result } = renderHook(() => useUsersQuery(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(expectedUsers);
    });
  });
});
```

## Common Issues and Solutions

### **Type Mismatch Errors**
- **Problem**: Generated types don't match database schema
- **Solution**: Ensure OpenAPI schemas match Drizzle table definitions
- **Prevention**: Run typecheck after codegen to validate integration

### **Missing Hooks**
- **Problem**: React Query hooks not generated
- **Solution**: Check operationId in OpenAPI paths, ensure they're unique
- **Prevention**: Use consistent naming convention for operationIds

### **Validation Errors**
- **Problem**: Zod schemas too strict or too lenient
- **Solution**: Adjust OpenAPI schema constraints
- **Prevention**: Test validation with edge cases

## Best Practices

### **API Design**
- Use RESTful conventions for endpoints
- Include proper HTTP status codes
- Provide meaningful error messages
- Version APIs when breaking changes occur

### **Schema Management**
- Keep OpenAPI schemas in sync with database models
- Use descriptive names for all operations
- Include examples for complex types
- Document authentication requirements

### **Frontend Integration**
- Leverage loading and error states from generated hooks
- Implement proper error boundaries
- Use optimistic updates for better UX
- Cache data appropriately with TanStack Query

This API-first approach ensures type safety, consistency, and excellent developer experience across the full YDM stack.

---

## ydm-mockup-development

**Description:** Guide for developing components in the YDM mockup sandbox with hot reload, dynamic loading, and preview system

# YDM Mockup Sandbox Development

This skill guides you through creating and testing components in the YDM mockup sandbox system, which provides real-time component preview and development capabilities.

## Understanding the Mockup System

### **Architecture Overview**
```
Component Creation → Plugin Discovery → Dynamic Import → Preview Rendering
```

### **Key Components**
- **mockup-sandbox/**: Component preview application
- **mockupPreviewPlugin.ts**: Vite plugin for component discovery
- **src/components/mockups/**: Component development directory
- **.generated/mockup-components.ts**: Auto-generated import map

## Component Development Workflow

### **1. Create Component Structure**

#### **Component Location**
```typescript
// artifacts/mockup-sandbox/src/components/mockups/YourComponent.tsx
import React from 'react';

// Default export (primary method)
export default function YourComponent() {
  return (
    <div className="p-4 bg-white/10 rounded-lg">
      <h2>Your Component</h2>
      <p>This is a mockup component</p>
    </div>
  );
}

// Optional: Named export for specific preview
export function Preview() {
  return (
    <div className="p-8 bg-gradient-to-r from-blue-500 to-purple-600">
      <YourComponent />
    </div>
  );
}

// Optional: Multiple named exports
export function VariantA() {
  return <YourComponent />;
}

export function VariantB() {
  return (
    <div className="scale-110">
      <YourComponent />
    </div>
  );
}
```

#### **Component Resolution Priority**
1. **Default Export**: `export default Component`
2. **Preview Export**: `export const Preview`
3. **Named Export**: `export const ComponentName`
4. **Last Function**: Fallback to last function component found

### **2. Plugin Auto-Discovery**

#### **File Watching Configuration**
The plugin automatically:
- Scans `src/components/mockups/**/*.tsx` for components
- Excludes files/directories starting with `_` (private)
- Watches for file changes with 100ms debouncing
- Regenerates import map on file add/remove

#### **Generated Import Map**
```typescript
// .generated/mockup-components.ts (auto-generated)
export const modules = {
  "./components/mockups/Button.tsx": () => import("../components/mockups/Button.tsx"),
  "./components/mockups/Card.tsx": () => import("../components/mockups/Card.tsx"),
  "./components/mockups/YourComponent.tsx": () => import("../components/mockups/YourComponent.tsx"),
  // ... auto-generated entries
};

export interface DiscoveredComponent {
  globKey: string;
  importPath: string;
}
```

### **3. Access Component Preview**

#### **URL Structure**
- **Gallery**: Root path (`/`) shows component server info
- **Individual Preview**: `/preview/YourComponent` renders specific component
- **Base Path Support**: Respects `BASE_URL` environment variable

#### **Preview URL Examples**
```bash
# Development URLs
http://localhost:5173/                    # Component gallery
http://localhost:5173/preview/Button       # Button component
http://localhost:5173/preview/YourComponent # Your component

# With base path
http://localhost:5173/base/preview/Button   # With BASE_PATH=/base
```

## Advanced Component Patterns

### **Interactive Components**
```typescript
// artifacts/mockup-sandbox/src/components/mockups/InteractiveCard.tsx
import React, { useState } from 'react';

export default function InteractiveCard() {
  const [count, setCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`p-6 rounded-xl transition-all duration-300 ${
        isHovered ? 'bg-blue-500/20 scale-105' : 'bg-white/10'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="text-lg font-bold mb-4">Interactive Card</h3>
      <p className="mb-4">Hover and click to interact</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
      >
        Clicked {count} times
      </button>
    </div>
  );
}
```

### **Data-Driven Components**
```typescript
// artifacts/mockup-sandbox/src/components/mockups/DataTable.tsx
import React from 'react';

interface DataRow {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  lastUpdated: string;
}

const mockData: DataRow[] = [
  { id: 1, name: 'John Doe', status: 'active', lastUpdated: '2024-01-15' },
  { id: 2, name: 'Jane Smith', status: 'inactive', lastUpdated: '2024-01-10' },
  { id: 3, name: 'Bob Johnson', status: 'active', lastUpdated: '2024-01-20' },
];

export default function DataTable() {
  return (
    <div className="p-6 bg-white/10 rounded-xl">
      <h3 className="text-xl font-bold mb-4">Data Table</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="pb-2">ID</th>
              <th className="pb-2">Name</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id} className="border-b border-white/10">
                <td className="py-2">{row.id}</td>
                <td className="py-2">{row.name}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    row.status === 'active' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2">{row.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### **Animation Components**
```typescript
// artifacts/mockup-sandbox/src/components/mockups/AnimatedBox.tsx
import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBox() {
  return (
    <div className="p-8 flex items-center justify-center">
      <motion.div
        className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

// Preview with different animation
export function Preview() {
  return (
    <div className="p-8 bg-black/50">
      <motion.div
        className="w-48 h-48 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl shadow-2xl"
        animate={{
          y: [0, -20, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
```

## Development Features

### **Hot Reload System**
- **File Changes**: Automatic component reload on save
- **New Components**: Auto-discovery and import map regeneration
- **Error Handling**: Graceful error display for missing/invalid components
- **Debouncing**: 100ms stability threshold prevents excessive rebuilds

### **Error Display**
```typescript
// Component error boundary handling
const PreviewRenderer: React.FC<{ componentName: string }> = ({ componentName }) => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComponent(componentName)
      .then(setComponent)
      .catch(setError);
  }, [componentName]);

  if (error) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl">
        <h3 className="text-red-400 font-bold mb-2">Component Error</h3>
        <p className="text-red-300">{error}</p>
        <p className="text-sm text-gray-400 mt-2">
          Check the component file and ensure it exports a valid React component.
        </p>
      </div>
    );
  }

  if (!Component) {
    return <div className="p-8">Loading component...</div>;
  }

  return <Component />;
};
```

### **Component Gallery**
```typescript
// Root path shows available components
const ComponentGallery: React.FC = () => {
  const [components, setComponents] = useState<string[]>([]);

  useEffect(() => {
    // Load discovered components from plugin
    loadDiscoveredComponents().then(setComponents);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Mockup Components</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((component) => (
          <div key={component} className="p-4 bg-white/10 rounded-xl">
            <h3 className="font-bold mb-2">{component}</h3>
            <a 
              href={`/preview/${component}`}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Preview Component
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Integration Patterns

### **Using shadcn/ui Components**
```typescript
// artifacts/mockup-sandbox/src/components/mockups/FormExample.tsx
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function FormExample() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            {submitted ? 'Submitted!' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### **Testing Component Variants**
```typescript
// artifacts/mockup-sandbox/src/components/mockups/ButtonVariants.tsx
import React from 'react';
import { Button } from '../ui/button';

export default function ButtonVariants() {
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-xl font-bold">Button Variants</h3>
      
      <div className="flex flex-wrap gap-4">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>
  );
}

// Preview with different context
export function Preview() {
  return (
    <div className="p-8 bg-gradient-to-br from-purple-900 to-blue-900">
      <div className="max-w-md mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Button Showcase</h2>
        <ButtonVariants />
      </div>
    </div>
  );
}
```

## Best Practices

### **Component Organization**
- Use descriptive component names
- Keep components focused on single purpose
- Export multiple variants for comparison
- Use Preview export for styled showcase

### **Performance Optimization**
- Avoid heavy computations in render
- Use React.memo for expensive components
- Implement proper cleanup in useEffect
- Test with multiple components loaded

### **Development Workflow**
1. Create component in `src/components/mockups/`
2. Plugin auto-generates import map
3. Access via `/preview/ComponentName`
4. Iterate with hot reload
5. Test different variants and states

### **Common Issues**
- **Component Not Found**: Check file naming and export structure
- **Hot Reload Not Working**: Verify file watcher is running
- **Import Errors**: Ensure component exports valid React component
- **Styling Issues**: Check Tailwind CSS classes are available

## Troubleshooting

### **Plugin Issues**
```bash
# Restart development server
pnpm --filter @workspace/mockup-sandbox run dev

# Clear generated files
rm -rf .generated/

# Check plugin logs in terminal
```

### **Component Loading Issues**
- Verify component has valid React export
- Check for TypeScript errors in component file
- Ensure component doesn't have unmet dependencies
- Test with simple component first

This mockup system provides an excellent development environment for rapid component prototyping and testing within the YDM ecosystem.

---

