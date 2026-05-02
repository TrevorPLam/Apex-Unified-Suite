---
trigger: glob
globs: artifacts/api-server/src/routes/*.ts
---

# API Endpoint Standards

Enforce consistent API endpoint development patterns for all backend routes in the Apex Unified Suite.

## Route Structure

### **File Organization**
```typescript
// Route file structure
import { Router } from 'express';
import { z } from 'zod';
import { db } from '@workspace/db';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middlewares/auth';
import { resourceNameTable, insertResourceSchema } from '@workspace/db/schema';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';

const router = Router();

// Route handlers here

export default router;
```

### **Route Registration**
```typescript
// In artifacts/api-server/src/routes/index.ts
import resourceRouter from './crm/contacts';

router.use('/crm/contacts', contactsRouter);
```

## Authentication & Authorization

### **Middleware Usage**
```typescript
// All routes must be authenticated
router.get('/', authenticateToken, requirePermission('crm:contacts:read'), handler);
router.post('/', authenticateToken, requirePermission('crm:contacts:write'), handler);
router.put('/:id', authenticateToken, requirePermission('crm:contacts:write'), handler);
router.delete('/:id', authenticateToken, requirePermission('crm:contacts:delete'), handler);
```

### **Permission Patterns**
- Read permissions: `{module}:{resource}:read`
- Write permissions: `{module}:{resource}:write`
- Delete permissions: `{module}:{resource}:delete`
- Special permissions: `{module}:{resource}:approve`, `{module}:{resource}:admin`

## Request Validation

### **Input Validation**
```typescript
// Always validate input with Zod schemas
router.post('/', authenticateToken, requirePermission('crm:contacts:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = insertContactSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors,
      });
    }
    // Handle other errors
  }
});
```

### **Parameter Validation**
```typescript
// Validate path parameters
router.get('/:id', authenticateToken, requirePermission('crm:contacts:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Process request
  } catch (error) {
    // Handle errors
  }
});
```

## Response Format

### **Success Response Structure**
```typescript
// Single resource response
res.status(201).json({ data: createdResource });

// List response with pagination
res.json({
  data: resources,
  meta: {
    total: totalCount,
    page,
    limit,
    hasNext: offset + limit < totalCount,
    hasPrev: page > 1,
  },
});

// Action response
res.json({ 
  message: 'Resource updated successfully',
  data: updatedResource 
});
```

### **Error Response Structure**
```typescript
// Validation error
res.status(400).json({ 
  error: 'Validation error',
  details: zodError.errors,
});

// Not found error
res.status(404).json({ error: 'Resource not found' });

// Authorization error
res.status(403).json({ 
  error: 'Insufficient permissions',
  required: 'crm:contacts:write',
});

// Server error
res.status(500).json({ error: 'Internal server error' });
```

## CRUD Operations

### **List Endpoint Pattern**
```typescript
router.get('/', authenticateToken, requirePermission('crm:contacts:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;
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
          ilike(contactsTable.email, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(contactsTable.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalCount = await db
      .select({ count: contactsTable.id })
      .from(contactsTable)
      .where(and(...conditions));

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
```

### **Create Endpoint Pattern**
```typescript
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
```

### **Update Endpoint Pattern**
```typescript
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
```

### **Delete Endpoint Pattern**
```typescript
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
```

## Database Operations

### **Query Patterns**
- Use Drizzle ORM query builders
- Never concatenate SQL strings
- Use parameterized queries
- Implement proper error handling
- Use transactions for multi-table operations

### **Performance Considerations**
- Select only required columns
- Use appropriate indexes
- Implement pagination for large datasets
- Consider database connection pooling

## Error Handling

### **Error Types**
```typescript
// Validation errors (400)
if (error instanceof z.ZodError) {
  return res.status(400).json({ 
    error: 'Validation error',
    details: error.errors,
  });
}

// Not found errors (404)
if (!result[0]) {
  return res.status(404).json({ error: 'Resource not found' });
}

// Authorization errors (403)
return res.status(403).json({ 
  error: 'Insufficient permissions',
  required: requiredPermission,
});

// Server errors (500)
console.error('Operation error:', error);
res.status(500).json({ error: 'Internal server error' });
```

### **Logging Requirements**
- Log all errors with context
- Include user ID in logs when available
- Log validation errors for debugging
- Use structured logging format

## Custom Endpoints

### **Business Logic Endpoints**
```typescript
// Custom action endpoints
router.post('/:id/approve', authenticateToken, requirePermission('crm:leads:approve'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Business logic here
    const result = await approveLead(id, notes, req.user!.userId);
    
    res.json({ data: result });
  } catch (error) {
    console.error('Approve lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Testing Requirements

### **Unit Tests**
- Test all CRUD operations
- Test validation logic
- Test error scenarios
- Mock database operations

### **Integration Tests**
- Test with actual database
- Test authentication middleware
- Test authorization logic
- Test error handling

## Anti-Patterns

❌ **Never** skip input validation
❌ **Never** use raw SQL queries
❌ **Never** expose sensitive data in responses
❌ **Never** ignore error handling
❌ **Never** skip authentication/authorization
❌ **Never** use inconsistent response formats

## Quality Checklist

- [ ] All routes have authentication middleware
- [ ] Authorization permissions are properly scoped
- [ ] Input validation uses Zod schemas
- [ ] Response format follows standards
- [ ] Error handling is comprehensive
- [ ] Database operations use Drizzle ORM
- [ ] Logging includes appropriate context
- [ ] Tests cover all scenarios
- [ ] Performance considerations are addressed
- [ ] Documentation is complete

This rule ensures consistent, secure, and maintainable API endpoints across the entire Apex Unified Suite.
