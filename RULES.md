# Rules

This document consolidates all development rules and guidelines for the Apex Unified Suite.

Generated on: 2026-05-02

Total Rules: 49

---

## Accessibility Rules (WCAG 2.2 AA)

**File:** `.windsurf/rules/accessibility.md`

---
trigger: always_on
---



All components must meet WCAG 2.2 AA accessibility standards:

<!-- SECTION: aria_requirements -->

<aria_requirements>
- ActivityFeed: role="log" with aria-live="polite"
- CommandPalette: role="combobox" with aria-expanded and aria-activedescendant
- AttentionQueue: Each decision packet needs role="article" and descriptive aria-label
- All modals: Focus trapped, role="dialog", aria-modal="true", aria-labelledby pointing to modal title
- All interactive elements: Accessible names via aria-label or visible label
</aria_requirements>

<!-- ENDSECTION: aria_requirements -->

<!-- SECTION: color_contrast -->

<color_contrast>
- All text must meet 4.5:1 contrast ratio on dark backgrounds
- Verify contrast for all text sizes and colors
- Test with both normal and large text (18pt+ or 14pt+ bold)
</color_contrast>

<!-- ENDSECTION: color_contrast -->

<!-- SECTION: keyboard_navigation -->

<keyboard_navigation>
- Tab order must follow visual order
- All actions must be reachable without mouse
- Ensure focus indicators are visible (electric blue)
- Skip to main content link if needed
</keyboard_navigation>

<!-- ENDSECTION: keyboard_navigation -->

<!-- SECTION: motion_reduced -->

<motion_reduced>
- Wrap all CSS animations in @media (prefers-reduced-motion: no-preference)
- Respect user's motion preferences
- Provide alternatives for essential animations
</motion_reduced>

<!-- ENDSECTION: motion_reduced -->

<!-- SECTION: semantic_html -->

<semantic_html>
- Use proper HTML5 semantic elements
- Ensure proper heading hierarchy (h1-h6)
- Use landmark regions (main, nav, aside, etc.)
- Provide alt text for all images
</semantic_html>

<!-- ENDSECTION: semantic_html -->

---

## API Endpoint Development Rules

**File:** `.windsurf/rules/api-endpoint-development.md`

---
trigger: glob
globs: artifacts/api-server/src/routes/**/*.ts
---



## Route Structure

- Import generated Zod schemas from `@workspace/api-zod`
- Validate all request bodies with `schema.parse(req.body)`
- Use proper HTTP status codes: 200, 201, 400, 404, 500
- Handle ZodError separately from generic errors
- Log all errors with structured Pino logger
- Include async/await error handling with try/catch blocks
- Export router as default from each route file

## Authentication & Authorization

- Use `authenticateToken` middleware for protected endpoints
- Use `requirePermission(permission)` for authorization checks
- Use `requireRole(role)` for role-based access control
- Include user context from `AuthenticatedRequest`
- Validate user permissions before resource access

## Request Validation

- Always validate input with Zod schemas from generated types
- Use `insertSchema` for POST requests
- Use `insertSchema.partial()` for PUT/PATCH requests
- Validate query parameters with separate schemas
- Return 400 status with validation error details
- Include field-level error messages for client feedback

## Response Format

- Use consistent response structure: `{ data: T, meta?: object }`
- Include pagination metadata for list endpoints
- Return 201 status for successful creation
- Return 204 for successful deletion (no content)
- Include error details in error responses
- Use snake_case for JSON response keys

## Error Handling

```typescript
try {
  const validatedData = schema.parse(req.body);
  // ... business logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      error: 'Validation error',
      details: error.errors,
    });
  }
  
  console.error('Operation error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

## Database Operations

- Use Drizzle ORM with proper typing
- Include `createdAt` and `updatedAt` timestamps
- Use transactions for multi-table operations
- Handle database errors gracefully
- Return created/updated resources to client
- Use `returning()` for efficient queries

## Query Patterns

- **List endpoints**: Include pagination, search, filtering
- **Detail endpoints**: Include related data with joins
- **Create endpoints**: Validate input, set defaults
- **Update endpoints**: Allow partial updates, validate changes
- **Delete endpoints**: Soft delete when appropriate

## Search and Filtering

- Support search with `ILIKE` operations
- Filter by status, date ranges, foreign keys
- Use proper SQL injection prevention
- Include search in query parameters
- Limit search results for performance

## Rate Limiting

- Implement rate limiting per endpoint
- Use different limits for auth vs. data endpoints
- Include rate limit headers in responses
- Log rate limit violations
- Consider user-based rate limiting

## Logging Requirements

- Log all API requests with method and path
- Include user context in logs for authenticated requests
- Log validation errors with request details
- Log database operations and errors
- Use structured logging with Pino

## Security Practices

- Never log sensitive data (passwords, tokens)
- Sanitize all user inputs
- Use parameterized queries (Drizzle handles this)
- Validate file uploads with proper MIME types
- Implement CORS with specific origins
- Include security headers in production

## Testing Requirements

- Unit test all route handlers
- Test validation with valid and invalid data
- Test authentication and authorization
- Include integration tests for API flows
- Mock database operations for unit tests
- Test error scenarios and edge cases

## OpenAPI Integration

- Keep OpenAPI spec in sync with implementation
- Include all endpoints in OpenAPI specification
- Use proper operationId for code generation
- Document all parameters and responses
- Include authentication requirements

## Performance Guidelines

- Use database indexes for queried columns
- Implement pagination for large datasets
- Cache frequently accessed data
- Use connection pooling (Drizzle handles this)
- Monitor query performance
- Avoid N+1 query problems

---

## API Endpoint Standards

**File:** `.windsurf/rules/api-endpoint-standards.md`

---
trigger: glob
globs: artifacts/api-server/src/routes/*.ts
---



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

---

## API-First Development Rule

**File:** `.windsurf/rules/api-first-development.md`

---
trigger: always_on
---



Enforce API-first development methodology where OpenAPI specifications drive all implementation.

## Core Requirements

### **Specification First**
- All new features MUST start with OpenAPI specification updates in `lib/api-spec/openapi.yaml`
- Never implement backend routes without corresponding OpenAPI definitions
- Never implement frontend data fetching without generated React Query hooks

### **Code Generation Workflow**
1. Update `lib/api-spec/openapi.yaml` with new endpoints
2. Run `pnpm --filter @workspace/api-spec run codegen` to generate:
   - React Query hooks in `lib/api-client-react/src/generated/`
   - Zod schemas in `lib/api-zod/src/generated/`
3. Use generated types and hooks in implementation
4. Never manually edit generated files

### **Type Safety Enforcement**
- All API responses must use generated Zod schemas for validation
- Frontend must use generated React Query hooks, not manual fetch calls
- Backend must validate requests using generated Zod schemas
- End-to-end type safety from database to frontend

### **Implementation Order**
1. Define OpenAPI specification
2. Generate types and hooks
3. Implement backend routes with validation
4. Implement frontend components with generated hooks
5. Add integration tests

## Anti-Patterns

❌ **Never** implement backend routes without OpenAPI spec
❌ **Never** use manual `fetch()` in frontend components
❌ **Never** write custom validation logic - use generated Zod schemas
❌ **Never** manually create TypeScript interfaces for API data

## Validation Commands

```bash
# Verify code generation is up to date
pnpm --filter @workspace/api-spec run codegen

# Check that all generated files are recent
ls -la lib/api-client-react/src/generated/
ls -la lib/api-zod/src/generated/

# Ensure no manual edits to generated files
git status lib/api-client-react/src/generated/
git status lib/api-zod/src/generated/
```

## Examples

### ✅ Correct Workflow
```typescript
// 1. OpenAPI spec defines endpoint
GET /api/crm/contacts
responses:
  200:
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ContactList'

// 2. Generated hook usage
import { useListContacts } from '@workspace/api-client-react';

function ContactsPage() {
  const { data: contacts, isLoading, error } = useListContacts();
  // ...
}
```

### ❌ Incorrect Workflow
```typescript
// Manual fetch - NOT ALLOWED
function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  
  useEffect(() => {
    fetch('/api/crm/contacts')
      .then(res => res.json())
      .then(setContacts);
  }, []);
  // ...
}
```

## Compliance Checklist

- [ ] OpenAPI spec updated before implementation
- [ ] Code generation run after spec changes
- [ ] Generated hooks used in frontend
- [ ] Generated Zod schemas used for validation
- [ ] No manual edits to generated files
- [ ] End-to-end type safety verified

This rule ensures consistent, type-safe API development across the entire Apex Unified Suite.

---

## Appointment Booking Rules Enforcement

**File:** `.windsurf/rules/appointment-booking-rules-enforcement.md`

---
trigger: model_decision
description: Must always validate BookingRule values before accepting a booking; reject with BookingRuleViolation otherwise.
---



## Purpose

Enforce that all appointment bookings must validate against configured booking rules before being accepted. Any violation must result in a `BookingRuleViolation` error with specific details about which rules were broken.

## Required Booking Rule Validations

### Core Rule Categories

**1. Time-Based Rules**
- Minimum advance booking hours
- Maximum advance booking days
- Working hours constraints
- Allowed weekdays restrictions

**2. Capacity Rules**
- Maximum appointments per day
- Maximum appointments per week
- Buffer time between appointments
- Resource availability limits

**3. Business Rules**
- Client eligibility requirements
- Service-specific constraints
- Provider availability rules
- Special event restrictions

## Implementation Requirements

### Service Layer Validation

```typescript
// src/services/AppointmentService.ts
export class AppointmentService {
  async createAppointment(
    appointmentData: CreateAppointmentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Appointment> {
    return await this.db.transaction(async (tx) => {
      // 1. Normalize timezone and convert to UTC
      const normalizedData = this.normalizeAppointmentData(appointmentData);

      // 2. Get applicable booking rules
      const bookingRules = await this.getBookingRules(
        tx,
        normalizedData.resourceId,
        tenantId
      );

      // 3. Validate all booking rules
      const violations = await this.validateBookingRules(
        tx,
        normalizedData,
        bookingRules,
        tenantId
      );

      if (violations.length > 0) {
        throw new BookingRuleViolationError(
          'Appointment violates booking rules',
          violations
        );
      }

      // 4. Check for conflicts
      const conflicts = await this.detectConflicts(
        tx,
        normalizedData,
        tenantId
      );

      if (conflicts.length > 0) {
        throw new AppointmentConflictError(
          'Appointment time conflicts with existing appointments',
          conflicts
        );
      }

      // 5. Create appointment
      const appointment = await this.createAppointmentRecord(
        tx,
        normalizedData,
        tenantId,
        createdBy
      );

      // 6. Emit domain event
      await this.emitEvent('AppointmentCreated', {
        appointmentId: appointment.id,
        resourceId: normalizedData.resourceId,
        clientId: normalizedData.clientId,
        startTime: normalizedData.startTime,
        endTime: normalizedData.endTime
      });

      return appointment;
    });
  }

  private async validateBookingRules(
    tx: Database,
    appointmentData: NormalizedAppointmentData,
    bookingRules: BookingRule[],
    tenantId: string
  ): Promise<BookingRuleViolation[]> {
    const violations: BookingRuleViolation[] = [];
    const now = new Date();

    for (const rule of bookingRules) {
      if (!rule.isActive) continue;

      // Validate minimum advance booking
      if (rule.minAdvanceHours > 0) {
        const minAdvanceTime = new Date(
          now.getTime() + (rule.minAdvanceHours * 60 * 60 * 1000)
        );

        if (appointmentData.startTime < minAdvanceTime) {
          violations.push({
            ruleType: 'min_advance_hours',
            ruleId: rule.id,
            message: `Appointment must be booked at least ${rule.minAdvanceHours} hours in advance`,
            currentValue: Math.floor(
              (appointmentData.startTime.getTime() - now.getTime()) / (60 * 60 * 1000)
            ),
            requiredValue: rule.minAdvanceHours,
            severity: 'error'
          });
        }
      }

      // Validate maximum advance booking
      if (rule.maxAdvanceDays > 0) {
        const maxAdvanceTime = new Date(
          now.getTime() + (rule.maxAdvanceDays * 24 * 60 * 60 * 1000)
        );

        if (appointmentData.startTime > maxAdvanceTime) {
          violations.push({
            ruleType: 'max_advance_days',
            ruleId: rule.id,
            message: `Appointment cannot be booked more than ${rule.maxAdvanceDays} days in advance`,
            currentValue: Math.floor(
              (appointmentData.startTime.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            ),
            requiredValue: rule.maxAdvanceDays,
            severity: 'error'
          });
        }
      }

      // Validate working hours
      if (rule.workingHoursStart && rule.workingHoursEnd) {
        const appointmentHour = appointmentData.startTime.getUTCHours();
        const startHour = parseInt(rule.workingHoursStart.split(':')[0]);
        const endHour = parseInt(rule.workingHoursEnd.split(':')[0]);

        if (appointmentHour < startHour || appointmentHour >= endHour) {
          violations.push({
            ruleType: 'working_hours',
            ruleId: rule.id,
            message: `Appointment must be within working hours (${rule.workingHoursStart} - ${rule.workingHoursEnd})`,
            currentValue: `${appointmentHour}:00`,
            requiredValue: `${rule.workingHoursStart} - ${rule.workingHoursEnd}`,
            severity: 'error'
          });
        }
      }

      // Validate allowed weekdays
      if (rule.allowedWeekdays && rule.allowedWeekdays.length > 0) {
        const appointmentDay = appointmentData.startTime.getUTCDay();
        
        if (!rule.allowedWeekdays.includes(appointmentDay)) {
          violations.push({
            ruleType: 'allowed_weekdays',
            ruleId: rule.id,
            message: `Appointment not allowed on this day of week`,
            currentValue: this.getDayName(appointmentDay),
            requiredValue: rule.allowedWeekdays.map(d => this.getDayName(d)).join(', '),
            severity: 'error'
          });
        }
      }

      // Validate maximum appointments per day
      if (rule.maxPerDay > 0) {
        const dayStart = new Date(appointmentData.startTime);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const dayAppointments = await tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(appointments)
          .where(and(
            eq(appointments.resource_id, appointmentData.resourceId),
            eq(appointments.tenant_id, tenantId),
            gte(appointments.start_time, dayStart),
            lt(appointments.start_time, dayEnd),
            sql`${appointments.status} IN ('requested', 'confirmed')`
          ));

        const currentCount = dayAppointments[0].count;

        if (currentCount >= rule.maxPerDay) {
          violations.push({
            ruleType: 'max_per_day',
            ruleId: rule.id,
            message: `Maximum ${rule.maxPerDay} appointments per day allowed`,
            currentValue: currentCount + 1,
            requiredValue: rule.maxPerDay,
            severity: 'error'
          });
        }
      }

      // Validate maximum appointments per week
      if (rule.maxPerWeek > 0) {
        const weekStart = this.getWeekStart(appointmentData.startTime);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

        const weekAppointments = await tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(appointments)
          .where(and(
            eq(appointments.resource_id, appointmentData.resourceId),
            eq(appointments.tenant_id, tenantId),
            gte(appointments.start_time, weekStart),
            lt(appointments.start_time, weekEnd),
            sql`${appointments.status} IN ('requested', 'confirmed')`
          ));

        const currentCount = weekAppointments[0].count;

        if (currentCount >= rule.maxPerWeek) {
          violations.push({
            ruleType: 'max_per_week',
            ruleId: rule.id,
            message: `Maximum ${rule.maxPerWeek} appointments per week allowed`,
            currentValue: currentCount + 1,
            requiredValue: rule.maxPerWeek,
            severity: 'error'
          });
        }
      }

      // Validate buffer time between appointments
      if (rule.bufferMinutes > 0) {
        const bufferStart = new Date(
          appointmentData.startTime.getTime() - (rule.bufferMinutes * 60 * 1000)
        );
        const bufferEnd = new Date(
          appointmentData.endTime.getTime() + (rule.bufferMinutes * 60 * 1000)
        );

        const conflictingAppointments = await tx
          .select()
          .from(appointments)
          .where(and(
            eq(appointments.resource_id, appointmentData.resourceId),
            eq(appointments.tenant_id, tenantId),
            sql`${appointments.status} IN ('requested', 'confirmed')`,
            sql`(${appointments.start_time} < ${bufferEnd} AND ${appointments.end_time} > ${bufferStart})`
          ));

        if (conflictingAppointments.length > 0) {
          violations.push({
            ruleType: 'buffer_time',
            ruleId: rule.id,
            message: `Appointment must have ${rule.bufferMinutes} minutes buffer from other appointments`,
            currentValue: 'No buffer',
            requiredValue: `${rule.bufferMinutes} minutes`,
            severity: 'error',
            conflictingAppointments: conflictingAppointments.map(a => ({
              id: a.id,
              startTime: a.start_time,
              endTime: a.end_time
            }))
          });
        }
      }
    }

    return violations;
  }

  private normalizeAppointmentData(data: CreateAppointmentRequest): NormalizedAppointmentData {
    // Convert all times to UTC for consistent storage
    const startTime = this.convertToUTC(data.startTime, data.timezone);
    const endTime = this.convertToUTC(data.endTime, data.timezone);

    return {
      ...data,
      startTime,
      endTime,
      timezone: data.timezone || 'UTC'
    };
  }

  private convertToUTC(date: Date, timezone: string): Date {
    // Convert from tenant timezone to UTC
    return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  }

  private getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    return weekStart;
  }
}
```

### Domain Error Classes

```typescript
export class BookingRuleViolationError extends DomainError {
  constructor(
    message: string,
    public readonly violations: BookingRuleViolation[]
  ) {
    super('BOOKING_RULE_VIOLATION', message, { violations });
  }
}

export interface BookingRuleViolation {
  ruleType: string;
  ruleId: string;
  message: string;
  currentValue: any;
  requiredValue: any;
  severity: 'warning' | 'error';
  conflictingAppointments?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
  }>;
}
```

### API Endpoint Implementation

```typescript
// src/routes/appointments.ts
router.post('/', validateRequest(createAppointmentSchema), async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ appointment });
  } catch (error) {
    if (error instanceof BookingRuleViolationError) {
      return res.status(422).json({
        error: error.message,
        code: error.code,
        violations: error.violations.map(violation => ({
          type: violation.ruleType,
          message: violation.message,
          currentValue: violation.currentValue,
          requiredValue: violation.requiredValue,
          severity: violation.severity,
          conflictingAppointments: violation.conflictingAppointments
        })),
        suggestions: [
          'Choose a different time slot',
          'Adjust booking parameters to meet requirements',
          'Contact support for rule exceptions'
        ],
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for booking with rule validation
export const AppointmentBookingForm: React.FC = () => {
  const [bookingData, setBookingData] = useState<CreateAppointmentRequest>({});
  const [ruleViolations, setRuleViolations] = useState<BookingRuleViolation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRuleViolations([]);

    try {
      const appointment = await createAppointment(bookingData);
      onBookingSuccess(appointment);
    } catch (error) {
      if (error instanceof BookingRuleViolationError) {
        setRuleViolations(error.violations);
        showRuleViolationsDialog(error.violations);
      } else {
        showGenericError('Failed to book appointment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableTimeSlots = async () => {
    try {
      const slots = await getAvailableSlots({
        resourceId: bookingData.resourceId,
        startDate: bookingData.startTime,
        endDate: bookingData.endTime,
        timezone: bookingData.timezone
      });

      setAvailableTimeSlots(slots.filter(slot => !slot.hasViolations));
    } catch (error) {
      console.error('Failed to get available slots:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {ruleViolations.length > 0 && (
        <div className="rule-violations">
          <h3>Booking Rule Violations</h3>
          {ruleViolations.map((violation, index) => (
            <div key={index} className={`violation ${violation.severity}`}>
              <p>{violation.message}</p>
              <small>
                Current: {violation.currentValue} | Required: {violation.requiredValue}
              </small>
              {violation.conflictingAppointments && (
                <div className="conflicts">
                  <p>Conflicting appointments:</p>
                  {violation.conflictingAppointments.map(apt => (
                    <div key={apt.id}>
                      {formatDateTime(apt.startTime)} - {formatDateTime(apt.endTime)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Booking...' : 'Book Appointment'}
      </button>
    </form>
  );
};
```

### Database Schema Support

```sql
-- Booking rules table
CREATE TABLE booking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_id UUID REFERENCES resources(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Time-based rules
  min_advance_hours INTEGER DEFAULT 0,
  max_advance_days INTEGER DEFAULT 365,
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '17:00:00',
  allowed_weekdays INTEGER[], -- Array of weekday numbers (0=Sunday)
  
  -- Capacity rules
  max_per_day INTEGER DEFAULT 8,
  max_per_week INTEGER DEFAULT 40,
  buffer_minutes INTEGER DEFAULT 0,
  
  -- Business rules
  client_eligibility JSONB,
  service_constraints JSONB,
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_booking_rules_resource ON booking_rules(resource_id);
CREATE INDEX idx_booking_rules_tenant ON booking_rules(tenant_id);
CREATE INDEX idx_booking_rules_active ON booking_rules(is_active);
```

## Testing Requirements

### Unit Tests

**Test rule validation logic:**

```typescript
describe('Booking Rules Validation', () => {
  test('should reject appointment outside working hours', async () => {
    const rules = [createWorkingHoursRule('09:00', '17:00')];
    const appointmentData = {
      startTime: new Date('2026-01-01T20:00:00Z'),
      endTime: new Date('2026-01-01T21:00:00Z')
    };

    const violations = await validateBookingRules(appointmentData, rules);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleType).toBe('working_hours');
    expect(violations[0].severity).toBe('error');
  });

  test('should reject appointment with insufficient advance time', async () => {
    const rules = [createMinAdvanceRule(24)]; // 24 hours minimum
    const appointmentData = {
      startTime: new Date(Date.now() + (12 * 60 * 60 * 1000)), // 12 hours from now
      endTime: new Date(Date.now() + (13 * 60 * 60 * 1000))
    };

    const violations = await validateBookingRules(appointmentData, rules);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleType).toBe('min_advance_hours');
  });

  test('should reject appointment exceeding daily capacity', async () => {
    const rules = [createMaxPerDayRule(3)];
    
    // Mock existing appointments for the day
    mockExistingAppointments(3); // Already at capacity

    const appointmentData = {
      startTime: new Date('2026-01-01T10:00:00Z'),
      endTime: new Date('2026-01-01T11:00:00Z')
    };

    const violations = await validateBookingRules(appointmentData, rules);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleType).toBe('max_per_day');
  });
});
```

### Integration Tests

**Test end-to-end booking flow:**

1. **Rule Application**: Test that rules are properly applied during booking
2. **Multiple Rules**: Test interaction between multiple rule types
3. **Resource-Specific Rules**: Test rules vary by resource
4. **Timezone Handling**: Test timezone conversion in rule validation

### Edge Cases

**Test these scenarios:**

1. **Conflicting Rules**: When multiple rules conflict, most restrictive wins
2. **Rule Overrides**: Admin users can override certain rules
3. **Grace Periods**: Rules with warning severity vs error severity
4. **Bulk Bookings**: Multiple appointments in single transaction

## Performance Considerations

### Efficient Rule Validation

```typescript
// Cache frequently accessed rules
private ruleCache = new Map<string, BookingRule[]>();

private async getCachedRules(resourceId: string, tenantId: string): Promise<BookingRule[]> {
  const cacheKey = `${tenantId}:${resourceId}`;
  
  if (!this.ruleCache.has(cacheKey)) {
    const rules = await this.getBookingRules(resourceId, tenantId);
    this.ruleCache.set(cacheKey, rules);
    
    // Cache for 5 minutes
    setTimeout(() => this.ruleCache.delete(cacheKey), 5 * 60 * 1000);
  }
  
  return this.ruleCache.get(cacheKey)!;
}
```

### Database Optimization

- Indexes on rule queries for performance
- Efficient date range queries for capacity checks
- Batch rule validation for multiple appointments

## Enforcement Checklist

- [ ] All booking rules are validated before appointment creation
- [ ] BookingRuleViolationError includes detailed violation information
- [ ] API endpoints return structured violation responses
- [ ] Frontend displays clear rule violation messages
- [ ] Database schema supports flexible rule configuration
- [ ] Timezone normalization is applied consistently
- [ ] Rule caching improves performance
- [ ] Comprehensive test coverage for all rule types
- [ ] Audit logging for rule violations
- [ ] Support for rule severity levels (warning vs error)
- [ ] Resource-specific rule inheritance
- [ ] Monitoring for rule validation performance

---

## Appointment Timezone Normalization Rule

**File:** `.windsurf/rules/appointment-timezone-normalization.md`

---
trigger: model_decision
description: All stored times must be in UTC; conversion to tenant timezone only at the presentation layer. Essential to avoid scheduling chaos.
---



## Purpose

Enforce that all appointment times are stored in UTC in the database, with timezone conversion only happening at the presentation layer. This prevents scheduling chaos and ensures consistent time handling across different timezones.

## Core Requirements

### Storage Standard

**All time data must be stored as:**

- Database columns: `TIMESTAMPTZ` (UTC)
- API payloads: ISO 8601 strings with timezone information
- Internal processing: UTC Date objects
- Timezone information: Stored as separate metadata field

### Conversion Points

**UTC → Tenant Timezone (Presentation):**
- API responses to frontend
- Email notifications
- Calendar exports
- User interface display

**Tenant Timezone → UTC (Storage):**
- API request processing
- Form submissions
- Calendar imports
- External integrations

## Implementation Requirements

### Database Schema

```sql
-- Appointments table with timezone support
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  resource_id UUID NOT NULL REFERENCES resources(id),
  
  -- Time fields (always stored in UTC)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timezone metadata
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  original_start_time TIMESTAMPTZ, -- Store original local time for reference
  original_end_time TIMESTAMPTZ,
  
  status VARCHAR(20) NOT NULL DEFAULT 'requested',
  notes TEXT,
  created_by UUID REFERENCES users(id)
);

-- Indexes for time-based queries
CREATE INDEX idx_appointments_resource_time ON appointments(resource_id, start_time, end_time);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
```

### Service Layer Implementation

```typescript
// src/services/TimezoneService.ts
export class TimezoneService {
  /**
   * Convert local time to UTC for storage
   */
  toUTC(localDate: Date, timezone: string): Date {
    // Create a date string in the local timezone
    const localString = localDate.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse it as if it's in the local timezone, then convert to UTC
    const utcDate = new Date(localString + ' UTC');
    return utcDate;
  }

  /**
   * Convert UTC time to local timezone for display
   */
  fromUTC(utcDate: Date, timezone: string): Date {
    // Create a date string representing the UTC time
    const utcString = utcDate.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse it as UTC and display in local timezone
    const localDate = new Date(utcString);
    return localDate;
  }

  /**
   * Validate timezone string
   */
  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get timezone offset in minutes
   */
  getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    const utcDate = new Date(date.toISOString());
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    
    return (localDate.getTime() - utcDate.getTime()) / (60 * 1000);
  }

  /**
   * Format time for display in tenant timezone
   */
  formatForDisplay(utcDate: Date, timezone: string, format: 'full' | 'date' | 'time' = 'full'): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: format === 'full' || format === 'date' ? 'numeric' : undefined,
      month: format === 'full' || format === 'date' ? 'long' : undefined,
      day: format === 'full' || format === 'date' ? 'numeric' : undefined,
      hour: format === 'full' || format === 'time' ? 'numeric' : undefined,
      minute: format === 'full' || format === 'time' ? 'numeric' : undefined,
      hour12: true
    };

    return utcDate.toLocaleString('en-US', options);
  }
}

// src/services/AppointmentService.ts
export class AppointmentService {
  constructor(
    private db: Database,
    private timezoneService: TimezoneService
  ) {}

  async createAppointment(
    appointmentData: CreateAppointmentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Appointment> {
    // Validate timezone
    if (!this.timezoneService.isValidTimezone(appointmentData.timezone)) {
      throw new InvalidTimezoneError(`Invalid timezone: ${appointmentData.timezone}`);
    }

    // Convert times to UTC for storage
    const utcStartTime = this.timezoneService.toUTC(
      appointmentData.startTime,
      appointmentData.timezone
    );
    const utcEndTime = this.timezoneService.toUTC(
      appointmentData.endTime,
      appointmentData.timezone
    );

    // Validate time logic in UTC
    if (utcEndTime <= utcStartTime) {
      throw new InvalidTimeRangeError('End time must be after start time');
    }

    return await this.db.transaction(async (tx) => {
      // Store appointment with UTC times and timezone metadata
      const appointment = await tx.insert(appointments).values({
        tenantId,
        clientId: appointmentData.clientId,
        resourceId: appointmentData.resourceId,
        startTime: utcStartTime,
        endTime: utcEndTime,
        timezone: appointmentData.timezone,
        originalStartTime: appointmentData.startTime,
        originalEndTime: appointmentData.endTime,
        status: 'requested',
        notes: appointmentData.notes,
        createdBy
      }).returning();

      return appointment[0];
    });
  }

  async getAppointmentsForDate(
    resourceId: string,
    date: Date,
    tenantId: string,
    timezone: string
  ): Promise<AppointmentWithLocalTimes[]> {
    // Convert the requested date to UTC range
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // Query appointments in UTC
    const appointments = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.resource_id, resourceId),
        eq(appointments.tenant_id, tenantId),
        gte(appointments.start_time, startOfDay),
        lt(appointments.start_time, endOfDay),
        sql`${appointments.status} IN ('requested', 'confirmed')`
      ))
      .orderBy(appointments.start_time);

    // Convert back to local times for display
    return appointments.map(apt => ({
      ...apt,
      localStartTime: this.timezoneService.fromUTC(apt.start_time, timezone),
      localEndTime: this.timezoneService.fromUTC(apt.end_time, timezone),
      formattedStartTime: this.timezoneService.formatForDisplay(apt.start_time, timezone, 'time'),
      formattedEndTime: this.timezoneService.formatForDisplay(apt.end_time, timezone, 'time')
    }));
  }

  async updateAppointmentTime(
    appointmentId: string,
    newStartTime: Date,
    newEndTime: Date,
    timezone: string,
    tenantId: string,
    updatedBy: string
  ): Promise<Appointment> {
    // Convert to UTC
    const utcStartTime = this.timezoneService.toUTC(newStartTime, timezone);
    const utcEndTime = this.timezoneService.toUTC(newEndTime, timezone);

    return await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(appointments)
        .set({
          startTime: utcStartTime,
          endTime: utcEndTime,
          timezone,
          originalStartTime: newStartTime,
          originalEndTime: newEndTime,
          updatedAt: new Date(),
          updatedBy
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenant_id, tenantId)
        ))
        .returning();

      return updated[0];
    });
  }
}
```

### API Layer Implementation

```typescript
// src/routes/appointments.ts
router.post('/', validateRequest(createAppointmentSchema), async (req, res, next) => {
  try {
    // Request should include timezone
    const { timezone = 'UTC', ...appointmentData } = req.body;

    // Validate timezone
    if (!timezoneService.isValidTimezone(timezone)) {
      return res.status(400).json({
        error: 'Invalid timezone provided',
        code: 'INVALID_TIMEZONE',
        supportedTimezones: getSupportedTimezones()
      });
    }

    const appointment = await appointmentService.createAppointment(
      {
        ...appointmentData,
        timezone
      },
      req.tenant.id,
      req.user.id
    );

    // Return appointment with both UTC and local times
    res.status(201).json({
      appointment: {
        ...appointment,
        localStartTime: timezoneService.fromUTC(appointment.start_time, timezone),
        localEndTime: timezoneService.fromUTC(appointment.end_time, timezone),
        formattedTimeRange: `${timezoneService.formatForDisplay(appointment.start_time, timezone, 'time')} - ${timezoneService.formatForDisplay(appointment.end_time, timezone, 'time')}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.findById(req.params.id, req.tenant.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Get user's preferred timezone (from user profile or request header)
    const timezone = req.headers['x-timezone'] || req.user.timezone || 'UTC';

    res.json({
      appointment: {
        ...appointment,
        localStartTime: timezoneService.fromUTC(appointment.start_time, timezone),
        localEndTime: timezoneService.fromUTC(appointment.end_time, timezone),
        timezone,
        formattedDate: timezoneService.formatForDisplay(appointment.start_time, timezone, 'date'),
        formattedTimeRange: `${timezoneService.formatForDisplay(appointment.start_time, timezone, 'time')} - ${timezoneService.formatForDisplay(appointment.end_time, timezone, 'time')}`
      }
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for appointment booking
export const AppointmentBookingForm: React.FC = () => {
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Fetch available slots for the selected date
    fetchAvailableSlots(selectedDate, timezone);
  }, [selectedDate, timezone]);

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    // Refresh available slots for new timezone
    fetchAvailableSlots(selectedDate, newTimezone);
  };

  const handleBooking = async (slot: TimeSlot) => {
    try {
      // Send booking request with local times and timezone
      const appointment = await createAppointment({
        resourceId: slot.resourceId,
        clientId: selectedClient.id,
        startTime: slot.startTime, // Local time
        endTime: slot.endTime, // Local time
        timezone: timezone
      });

      onBookingSuccess(appointment);
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  return (
    <div>
      <div className="timezone-selector">
        <label htmlFor="timezone">Timezone:</label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
        >
          {getSupportedTimezones().map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div className="date-picker">
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          timeZone={timezone}
        />
      </div>

      <div className="time-slots">
        <h3>Available Times - {formatDate(selectedDate, timezone)}</h3>
        {availableSlots.map(slot => (
          <TimeSlotCard
            key={slot.id}
            slot={slot}
            timezone={timezone}
            onBook={handleBooking}
          />
        ))}
      </div>
    </div>
  );
};

// Utility function for formatting dates
function formatDate(date: Date, timezone: string): string {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
```

### Domain Error Classes

```typescript
export class InvalidTimezoneError extends DomainError {
  constructor(message: string) {
    super('INVALID_TIMEZONE', message);
  }
}

export class InvalidTimeRangeError extends DomainError {
  constructor(message: string) {
    super('INVALID_TIME_RANGE', message);
  }
}

export class TimezoneConversionError extends DomainError {
  constructor(message: string, public readonly details: any) {
    super('TIMEZONE_CONVERSION_ERROR', message, details);
  }
}
```

## Testing Requirements

### Unit Tests

**Test timezone conversion logic:**

```typescript
describe('TimezoneService', () => {
  describe('toUTC', () => {
    test('should convert EST time to UTC correctly', () => {
      const localTime = new Date('2026-01-15T14:00:00'); // 2 PM EST
      const utcTime = timezoneService.toUTC(localTime, 'America/New_York');
      
      // EST is UTC-5 in January, so 2 PM EST = 7 PM UTC
      expect(utcTime.getUTCHours()).toBe(19);
      expect(utcTime.getUTCDate()).toBe(15);
    });

    test('should handle daylight saving time correctly', () => {
      const localTime = new Date('2026-07-15T14:00:00'); // 2 PM EDT
      const utcTime = timezoneService.toUTC(localTime, 'America/New_York');
      
      // EDT is UTC-4 in July, so 2 PM EDT = 6 PM UTC
      expect(utcTime.getUTCHours()).toBe(18);
    });
  });

  describe('fromUTC', () => {
    test('should convert UTC time to EST correctly', () => {
      const utcTime = new Date('2026-01-15T19:00:00Z'); // 7 PM UTC
      const localTime = timezoneService.fromUTC(utcTime, 'America/New_York');
      
      // Should display as 2 PM local time
      expect(localTime.getHours()).toBe(14);
    });
  });

  describe('formatForDisplay', () => {
    test('should format time correctly for different timezones', () => {
      const utcTime = new Date('2026-01-15T19:00:00Z');
      
      const formatted = timezoneService.formatForDisplay(
        utcTime, 
        'America/New_York', 
        'full'
      );
      
      expect(formatted).toContain('2:00 PM');
      expect(formatted).toContain('January 15, 2026');
    });
  });
});
```

### Integration Tests

**Test end-to-end timezone handling:**

1. **Appointment Creation**: Test appointment creation with different timezones
2. **Time Display**: Verify correct display in user's timezone
3. **Availability Calculation**: Test slot generation respects timezone
4. **Cross-Timezone Queries**: Test appointments spanning timezone boundaries

### Edge Cases

**Test these scenarios:**

1. **Invalid Timezones**: Handle invalid timezone strings gracefully
2. **DST Transitions**: Test appointments during daylight saving time changes
3. **International Date Line**: Test date calculations across date lines
4. **Leap Years**: Test February 29th handling

## Performance Considerations

### Caching Strategy

```typescript
// Cache timezone conversions for performance
private timezoneCache = new Map<string, Map<string, Date>>();

getCachedConversion(utcDate: Date, timezone: string): Date {
  const cacheKey = `${utcDate.toISOString()}-${timezone}`;
  
  if (!this.timezoneCache.has(cacheKey)) {
    const localDate = this.fromUTC(utcDate, timezone);
    this.timezoneCache.set(cacheKey, localDate);
    
    // Cache for 1 hour
    setTimeout(() => this.timezoneCache.delete(cacheKey), 60 * 60 * 1000);
  }
  
  return this.timezoneCache.get(cacheKey)!;
}
```

### Database Optimization

- Use `TIMESTAMPTZ` for all time columns
- Index on UTC time columns for efficient queries
- Avoid timezone conversions in database queries

## Monitoring

**Track timezone-related metrics:**

- Timezone conversion success/failure rates
- Performance of timezone conversion functions
- User timezone distribution
- Appointment booking errors by timezone

## Enforcement Checklist

- [ ] All time data stored in UTC in database
- [ ] Timezone conversion only at presentation layer
- [ ] API accepts timezone information in requests
- [ ] Frontend displays times in user's local timezone
- [ ] Timezone validation prevents invalid values
- [ ] Comprehensive test coverage for timezone scenarios
- [ ] Performance monitoring for conversion operations
- [ ] Error handling for timezone conversion failures
- [ ] Support for daylight saving time transitions
- [ ] Audit logging for timezone-related operations
- [ ] Documentation of timezone handling patterns
- [ ] User preference management for timezone selection

---

## Bento Grid Layout Rules

**File:** `.windsurf/rules/bento-grid-layout.md`

---
trigger: always_on
---



Bento Grid Design is a modular layout pattern inspired by Japanese bento boxes, using asymmetric content blocks in varying sizes to create organized, visually striking interfaces.

<!-- SECTION: core_principles -->

<core_principles>

- **Hierarchy through Size**: Important elements get more space
- **Visual Rhythm**: Variation creates interest
- **Consistent Spacing**: Uniform gaps between all elements
- **Rounded Corners**: Soft, modern aesthetic

</core_principles>

<!-- ENDSECTION: core_principles -->

<!-- SECTION: css_grid_foundation -->

<css_grid_foundation>

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

/* Spanning variants */
.bento-item--large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-item--wide {
  grid-column: span 2;
}

.bento-item--tall {
  grid-row: span 2;
}
```

</css_grid_foundation>

<!-- ENDSECTION: css_grid_foundation -->

<!-- SECTION: responsive_breakpoints -->

<responsive_breakpoints>

```css
/* Mobile: Single column */
@media (max-width: 640px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-item--large,
  .bento-item--wide,
  .bento-item--tall {
    grid-column: span 1;
    grid-row: span 1;
  }
}

/* Tablet: 2 columns */
@media (min-width: 641px) and (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3-4 columns */
@media (min-width: 1025px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1440px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

</responsive_breakpoints>

<!-- ENDSECTION: responsive_breakpoints -->

<!-- SECTION: project_integration -->

<project_integration>

Use Bento Grid for:

- **Dashboard**: AgentFleetPanel, ActivityFeed, AmbientStatusBanner in modular layout
- **Budget Dashboard**: NetWorthCard, CashFlowSummary, BudgetCategoryCard grid
- **Settings**: Integration cards (MCPServerCard) in grid layout
- **Analytics**: Cost breakdown charts and metrics in organized blocks

</project_integration>

<!-- ENDSECTION: project_integration -->

<!-- SECTION: visual_identity -->

<visual_identity>

- Card background: `bg-[#111111]` for content cards
- Glass cards: `backdrop-blur-md bg-white/5 border border-white/10` for shell surfaces
- Border radius: `rounded-xl` (1rem)
- Gap: `gap-4` (1rem)
- Padding: `p-4` to `p-6` depending on content density

</visual_identity>

<!-- ENDSECTION: visual_identity -->

<!-- SECTION: motion_integration -->

<motion_integration>

```tsx
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

<motion.div
  className="bento-grid"
  variants={containerVariants}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      className={`bento-item ${item.size}`}
      variants={itemVariants}
      whileHover={{ y: -4 }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

</motion_integration>

<!-- ENDSECTION: motion_integration -->

<!-- SECTION: accessibility -->

<accessibility>

- Use semantic HTML: `<article>` for bento items, `<section>` for grid container
- Proper heading hierarchy within each bento item
- Keyboard navigation: Tab order follows visual left-to-right, top-to-bottom
- Focus indicators: Electric blue ring on all interactive elements
- ARIA labels for decorative items that contain interactive content
- Ensure color contrast meets WCAG 2.2 AA (4.5:1 minimum)

</accessibility>

<!-- ENDSECTION: accessibility -->

<!-- SECTION: performance -->

<performance>

- Use CSS Grid for layout (GPU-accelerated)
- Avoid JavaScript layout calculations
- Lazy load images in bento items below the fold
- Use `content-visibility: auto` for off-screen bento items
- Test with 50+ items to ensure smooth scrolling

</performance>

<!-- ENDSECTION: performance -->

<!-- SECTION: best_practices -->

<best_practices>

- Keep bento items focused on single purpose
- Use size variants to establish visual hierarchy
- Maintain consistent gap and padding across all breakpoints
- Don't force content into bento grid if it doesn't fit naturally
- Consider content aspect ratio when assigning spans
- Use `minmax()` for responsive column sizing

</best_practices>

<!-- ENDSECTION: best_practices -->

<!-- SECTION: anti_patterns -->

<anti_patterns>

- Do NOT use fixed pixel widths for columns
- Do NOT use JavaScript for layout calculations
- Do NOT create deep nesting within bento items
- Do NOT use bento grid for simple lists (use standard list instead)
- Do NOT mix alignment systems (Flexbox + Grid) within same grid
- Do NOT ignore mobile - always provide single-column fallback

</anti_patterns>

<!-- ENDSECTION: anti_patterns -->

---

## Component Development Rules

**File:** `.windsurf/rules/component-development.md`

---
trigger: glob
globs: artifacts/apex-os/src/**/*.tsx
---



Enforce consistent React component development patterns for the Apex Unified Suite frontend.

## Component Structure

### **File Organization**
```typescript
// Component file structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useListContacts } from '@workspace/api-client-react';

interface ComponentProps {
  // Component props here
}

export function ComponentName({ prop }: ComponentProps) {
  // Hooks and state
  // Business logic
  // Render JSX
}

export default ComponentName;
```

### **Import Order**
1. React imports
2. Third-party library imports (React Query, etc.)
3. shadcn/ui component imports
4. Custom hooks and contexts
5. Generated API hooks
6. Utility functions
7. Types and interfaces

## TypeScript Requirements

### **Component Props**
- Always define explicit prop interfaces
- Use proper TypeScript types for all props
- Include optional properties with `?` syntax
- Default props should be handled in component logic

### **Type Safety**
- Never use `any` type
- Use generated types from API hooks
- Define proper return types for custom hooks
- Use type guards for conditional rendering

## React Query Integration

### **Data Fetching Patterns**
```typescript
// ✅ Correct pattern
export function ContactsList() {
  const { data: contacts, isLoading, error, refetch } = useListContacts({
    page: 1,
    limit: 20,
  });

  if (isLoading) return <ContactsSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!contacts) return <EmptyState />;

  return (
    <div>
      {contacts.data.map(contact => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
```

### **Mutation Patterns**
```typescript
// ✅ Correct mutation pattern
export function CreateContactModal({ isOpen, onClose }: CreateContactModalProps) {
  const createContact = useCreateContact();
  
  const handleSubmit = async (data: ContactFormData) => {
    try {
      await createContact.mutateAsync(data);
      onClose();
      toast.success('Contact created successfully');
    } catch (error) {
      toast.error('Failed to create contact');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ContactForm onSubmit={handleSubmit} isLoading={createContact.isPending} />
    </Modal>
  );
}
```

## Accessibility Requirements

### **WCAG 2.2 AA Compliance**
- All interactive elements have accessible names
- Proper heading hierarchy (h1-h6)
- Keyboard navigation support
- Focus indicators are visible
- ARIA labels for complex components
- Color contrast meets 4.5:1 minimum

### **Accessibility Patterns**
```typescript
// ✅ Accessible button
<Button
  onClick={handleClick}
  aria-label="Delete contact"
  disabled={isDeleting}
>
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Delete contact</span>
</Button>

// ✅ Accessible form field
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    required
    aria-describedby="email-error"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-destructive">
      {errors.email.message}
    </p>
  )}
</div>
```

## Error Handling

### **Error Boundaries**
- Wrap components in error boundaries
- Provide fallback UI for errors
- Log errors appropriately
- Allow users to recover from errors

### **Loading States**
- Show skeleton loaders for data fetching
- Provide loading indicators for actions
- Disable buttons during mutations
- Show progress for long-running operations

### **Error Display**
```typescript
// ✅ Error handling pattern
export function DataComponent() {
  const { data, isLoading, error } = useGetData();

  if (isLoading) return <SkeletonLoader />;
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load data'}
        </AlertDescription>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return <ComponentWithData data={data} />;
}
```

## Performance Optimization

### **Component Optimization**
- Use `React.memo()` for expensive components
- Implement proper dependency arrays in hooks
- Avoid unnecessary re-renders
- Use `useCallback()` for event handlers

### **Code Splitting**
```typescript
// ✅ Lazy loading patterns
import { lazy } from 'react';

const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const CRMPage = lazy(() => import('@/pages/CRM'));

// Use with Suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/crm" element={<CRMPage />} />
  </Routes>
</Suspense>
```

## UI Component Usage

### **shadcn/ui Components**
- Use shadcn/ui components consistently
- Follow established design patterns
- Customize with CSS variables when needed
- Maintain visual consistency

### **Component Patterns**
```typescript
// ✅ Card pattern
<Card>
  <CardHeader>
    <CardTitle>Contact Information</CardTitle>
    <CardDescription>View and edit contact details</CardDescription>
  </CardHeader>
  <CardContent>
    <ContactForm />
  </CardContent>
</Card>

// ✅ Form pattern
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="firstName">First Name</Label>
      <Input id="firstName" {...register('firstName')} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">Last Name</Label>
      <Input id="lastName" {...register('lastName')} />
    </div>
  </div>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Saving...' : 'Save Contact'}
  </Button>
</form>
```

## State Management

### **Local State**
- Use `useState` for simple component state
- Use `useReducer` for complex state logic
- Keep state close to where it's used
- Avoid prop drilling when possible

### **Server State**
- Use React Query for all server data
- Implement proper cache strategies
- Handle optimistic updates
- Provide proper error handling

## Testing Requirements

### **Component Tests**
- Test user interactions
- Test loading and error states
- Test accessibility features
- Mock API calls appropriately

### **Test Patterns**
```typescript
// ✅ Component test pattern
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactCard } from './ContactCard';

describe('ContactCard', () => {
  test('renders contact information', () => {
    const mockContact = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    render(<ContactCard contact={mockContact} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('handles delete action', async () => {
    const onDelete = vi.fn();
    const mockContact = { /* ... */ };

    render(<ContactCard contact={mockContact} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(mockContact.id);
    });
  });
});
```

## Anti-Patterns

❌ **Never** use `any` type in components
❌ **Never** skip accessibility testing
❌ **Never** use inline styles extensively
❌ **Never** create deeply nested component hierarchies
❌ **Never** ignore loading and error states
❌ **Never** use direct DOM manipulation

## Quality Checklist

- [ ] Component has proper TypeScript types
- [ ] Accessibility requirements are met
- [ ] Loading states are implemented
- [ ] Error handling is comprehensive
- [ ] Performance optimizations are applied
- [ ] Tests cover user interactions
- [ ] shadcn/ui components are used correctly
- [ ] React Query patterns are followed
- [ ] Component is properly documented
- [ ] Code follows established patterns

This rule ensures consistent, accessible, and performant React components across the Apex Unified Suite.

---

## Core Web Vitals - INP (Interaction to Next Paint)

**File:** `.windsurf/rules/core-web-vitals-inp.md`

---
trigger: always_on
---



INP is a Core Web Vital metric that measures overall page responsiveness, replacing FID (First Input Delay). It measures the time from user interaction to the next visual update.

<!-- SECTION: inp_thresholds -->

<inp_thresholds>

- **Good**: INP ≤ 200ms
- **Needs Improvement**: 200ms < INP ≤ 500ms
- **Poor**: INP > 500ms

Measure at 75th percentile of page loads, segmented by mobile and desktop.

</inp_thresholds>

<!-- ENDSECTION: inp_thresholds -->

<!-- SECTION: measured_interactions -->

<measured_interactions>

INP measures these interaction types:

- Mouse clicks
- Touchscreen taps
- Keyboard key presses (keydown, keypress, keyup)

Note: Scrolling and hovering are NOT measured by INP.

</measured_interactions>

<!-- ENDSECTION: measured_interactions -->

<!-- SECTION: interaction_components -->

<interaction_components>

An interaction consists of:

1. **Input Delay**: Time before event handler starts
2. **Processing Duration**: Time for all event handlers to execute
3. **Presentation Delay**: Time until next frame paints

INP = longest duration among all three phases.

</interaction_components>

<!-- ENDSECTION: interaction_components -->

<!-- SECTION: optimization_strategies -->

<optimization_strategies>

**Reduce JavaScript Execution Time**

- Code-split large bundles with React.lazy()
- Use TanStack Query for efficient data caching
- Debounce/throttle event handlers (use useCallback)
- Avoid long-running tasks on main thread
- Use Web Workers for heavy computations

**Optimize Event Handlers**

```tsx
// BAD - Inline function recreated on every render
<button onClick={() => handleClick()}>Click</button>

// GOOD - Stable function reference
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);

<button onClick={handleClick}>Click</button>
```

**Reduce Layout Thrashing**

- Only animate transform and opacity properties
- Avoid reading layout properties (offsetWidth, scrollTop) in loops
- Use requestAnimationFrame for visual updates
- Batch DOM reads and writes

**Optimize Animations**

- Use CSS transitions for simple state changes (150ms ease-out)
- Use motion library with reduced motion checks
- Test animations on low-end devices
- Keep animation duration under 200ms for interactive elements

**Improve Rendering Performance**

- Use React.memo() for expensive components
- Virtualize long lists with react-window
- Use useMemo() for expensive computations
- Avoid unnecessary re-renders with proper dependency arrays

</optimization_strategies>

<!-- ENDSECTION: optimization_strategies -->

<!-- SECTION: project_specific_optimizations -->

<project_specific_optimizations>

**TanStack Query Integration**

```tsx
// Use staleTime to reduce unnecessary refetches
const { data } = useQuery(['agents'], fetchAgents, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Use optimistic updates for instant feedback
const mutation = useMutation(updateAgent, {
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['agents']);
    const previous = queryClient.getQueryData(['agents']);
    queryClient.setQueryData(['agents'], (old) => [...old, newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['agents'], context.previous);
  },
});
```

**Motion Library Performance**

```tsx
// Use LazyMotion for code splitting
import { LazyMotion, domAnimation, m } from 'motion/react';

<LazyMotion features={domAnimation}>
  <m.div animate={{ opacity: 1 }}>
    Content
  </m.div>
</LazyMotion>

// Respect reduced motion
const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 300 };
```

**Virtualization for Long Lists**

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

</project_specific_optimizations>

<!-- ENDSECTION: project_specific_optimizations -->

<!-- SECTION: measurement -->

<measurement>

**Lab Testing**

```tsx
import { getINP } from 'web-vitals';

getINP((metric) => {
  console.log('INP:', metric.value);
  // Send to analytics
});
```

**Field Testing**

- Use Chrome User Experience Report (CrUX) data
- Test on real devices (mobile and desktop)
- Monitor 75th percentile across users
- Segment by device type and connection speed

</measurement>

<!-- ENDSECTION: measurement -->

<!-- SECTION: common_issues -->

<common_issues>

**Long Event Handlers**

- Symptom: Clicks feel sluggish
- Solution: Break up long tasks, use Web Workers

**Layout Thrashing**

- Symptom: Janky animations, low FPS
- Solution: Batch DOM reads/writes, avoid layout reads in loops

**Excessive JavaScript**

- Symptom: High INP on page load
- Solution: Code-split, lazy load, reduce bundle size

**Slow Animations**

- Symptom: Interactions delayed by animations
- Solution: Keep animations under 200ms, use GPU-accelerated properties

</common_issues>

<!-- ENDSECTION: common_issues -->

<!-- SECTION: best_practices -->

<best_practices>

- Aim for INP under 200ms (good threshold)
- Test on low-end devices and slow connections
- Monitor INP in production with RUM (Real User Monitoring)
- Optimize critical interaction paths first
- Use performance budgets in CI/CD
- Regularly audit with Lighthouse and WebPageTest

</best_practices>

<!-- ENDSECTION: best_practices -->

<!-- SECTION: anti_patterns -->

<anti_patterns>

- Do NOT block main thread with long-running tasks
- Do NOT use inline event handlers in render loops
- Do NOT animate layout properties (width, height, margin)
- Do NOT ignore reduced motion preferences
- Do NOT skip code-splitting for large bundles
- Do NOT measure INP only on high-end devices

</anti_patterns>

<!-- ENDSECTION: anti_patterns -->

---

## CRM Lead Conversion Rule

**File:** `.windsurf/rules/crm-lead-conversion.md`

---
trigger: model_decision
description: Enforce that closed_won leads automatically create a Deal and transition CRM stage according to the business lifecycle rules.
---



## Purpose

Enforce the business rule that when a lead reaches `closed_won` status, a Deal must be automatically created and the CRM stage must be transitioned appropriately. This prevents data inconsistency and ensures proper sales pipeline tracking.

## Implementation Requirements

### Lead Status Transition Validation

**When a lead is updated to `closed_won`:**

1. **Verify Lead Existence**: Confirm the lead exists and belongs to the tenant
2. **Check Current Status**: Ensure the lead is transitioning from a valid status (not already `closed_won`)
3. **Validate Required Fields**: Ensure lead has all required fields for deal creation:
   - `client_id` or contact information
   - `deal_value` or `estimated_value`
   - `sales_rep_id`
   - `conversion_date`

### Automatic Deal Creation

**Create a new Deal with:**

```typescript
// Required deal fields from lead
const dealData = {
  tenantId: lead.tenant_id,
  clientId: lead.client_id,
  leadId: lead.id,
  title: `${lead.company_name} - ${lead.lead_source}`,
  description: `Converted from lead: ${lead.title}`,
  value: lead.deal_value || lead.estimated_value,
  currency: lead.currency || 'USD',
  stage: 'qualification', // Initial deal stage
  probability: 25, // Starting probability for converted leads
  expectedCloseDate: calculateExpectedCloseDate(lead.created_at),
  salesRepId: lead.sales_rep_id,
  sourceCampaign: lead.source_campaign,
  convertedFromLead: true,
  conversionDate: new Date(),
  createdBy: context.userId
};
```

### CRM Stage Transition

**Update client CRM stage based on deal value:**

```typescript
// Stage determination logic
function determineClientStage(dealValue: number): string {
  if (dealValue >= 100000) return 'enterprise';
  if (dealValue >= 25000) return 'commercial';
  if (dealValue >= 5000) return 'small_business';
  return 'prospect';
}
```

### Service Implementation Pattern

```typescript
// In LeadService.updateLeadStatus()
async updateLeadStatus(
  leadId: string, 
  newStatus: string, 
  tenantId: string, 
  updatedBy: string
): Promise<Lead> {
  return await this.db.transaction(async (tx) => {
    // 1. Update lead status
    const updatedLead = await this.updateLeadStatusOnly(tx, leadId, newStatus, tenantId, updatedBy);
    
    // 2. Handle closed_won conversion
    if (newStatus === 'closed_won') {
      await this.handleLeadConversion(tx, updatedLead, updatedBy);
    }
    
    return updatedLead;
  });
}

private async handleLeadConversion(tx: Database, lead: Lead, updatedBy: string): Promise<void> {
  // Check if deal already exists for this lead
  const existingDeal = await tx
    .select()
    .from(deals)
    .where(and(
      eq(deals.lead_id, lead.id),
      eq(deals.tenant_id, lead.tenant_id)
    ))
    .limit(1);

  if (existingDeal.length > 0) {
    throw new BusinessRuleError('Deal already exists for this lead');
  }

  // Create deal
  const deal = await this.createDealFromLead(tx, lead, updatedBy);
  
  // Update client CRM stage
  await this.updateClientCRMStage(tx, lead.client_id, deal.value);
  
  // Emit domain events
  await this.emitEvent('LeadConverted', {
    leadId: lead.id,
    dealId: deal.id,
    clientId: lead.client_id,
    convertedBy: updatedBy
  });
}
```

### Error Handling

**Required domain errors:**

- `LeadAlreadyConvertedError` - When trying to convert an already converted lead
- `DealAlreadyExistsError` - When a deal already exists for the lead
- `InsufficientLeadDataError` - When lead lacks required fields for conversion
- `InvalidLeadStatusTransitionError` - When status transition is not allowed

### Validation Rules

**Lead must have these fields before conversion to `closed_won`:**

- `client_id` must be populated (not null)
- `deal_value` must be > 0 or `estimated_value` must be > 0
- `sales_rep_id` must be assigned
- Lead must not already have an associated deal
- Lead status must be transitioning from `qualified`, `proposal_sent`, or `negotiation`

### Database Constraints

**Add constraints to enforce the rule:**

```sql
-- Check constraint to prevent duplicate deals from same lead
ALTER TABLE deals ADD CONSTRAINT unique_deal_per_lead 
  UNIQUE (tenant_id, lead_id) 
  WHERE lead_id IS NOT NULL;

-- Trigger to automatically create deal on lead conversion
CREATE OR REPLACE FUNCTION create_deal_on_lead_conversion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed_won' AND OLD.status != 'closed_won' THEN
    -- Insert deal logic here
    INSERT INTO deals (tenant_id, client_id, lead_id, title, value, stage, ...)
    VALUES (NEW.tenant_id, NEW.client_id, NEW.id, ...);
    
    -- Update client CRM stage
    UPDATE clients SET crm_stage = determine_stage_from_value(NEW.deal_value)
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lead_conversion
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_deal_on_lead_conversion();
```

### API Endpoint Enforcement

**Lead update endpoint must enforce conversion:**

```typescript
// PUT /api/crm/leads/:id/status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Validate status transition
    const validTransitions = {
      'new': ['contacted', 'qualified', 'closed_lost'],
      'contacted': ['qualified', 'closed_lost'],
      'qualified': ['proposal_sent', 'closed_won', 'closed_lost'],
      'proposal_sent': ['negotiation', 'closed_won', 'closed_lost'],
      'negotiation': ['closed_won', 'closed_lost'],
      'closed_won': [], // Terminal state
      'closed_lost': []  // Terminal state
    };

    const lead = await leadService.findById(req.params.id, req.tenant.id);
    
    if (!validTransitions[lead.status].includes(status)) {
      throw new InvalidLeadStatusTransitionError(
        `Cannot transition from ${lead.status} to ${status}`
      );
    }

    const updatedLead = await leadService.updateLeadStatus(
      req.params.id,
      status,
      req.tenant.id,
      req.user.id
    );

    res.json({ lead: updatedLead });
  } catch (error) {
    next(error);
  }
});
```

### Testing Requirements

**Unit tests must cover:**

1. **Conversion Logic**: Test that `closed_won` status creates deal and updates stage
2. **Duplicate Prevention**: Test that already converted leads throw errors
3. **Validation**: Test that insufficient lead data prevents conversion
4. **Status Transitions**: Test that only valid status transitions are allowed
5. **Transaction Rollback**: Test that failures roll back all changes

**Integration tests must verify:**

1. **End-to-end Conversion**: Lead → Deal → Client Stage Update
2. **Concurrent Conversions**: Multiple users can't convert same lead simultaneously
3. **Domain Events**: Proper events are emitted on conversion
4. **Data Consistency**: All related data stays consistent after conversion

### Monitoring

**Track these metrics:**

- Lead conversion rate (leads converted to deals)
- Conversion failure rate and reasons
- Time from lead creation to conversion
- Deal value distribution by conversion source
- Client stage progression accuracy

### Audit Trail

**Log all conversion events:**

```typescript
interface LeadConversionLog {
  leadId: string;
  dealId: string;
  clientId: string;
  previousStatus: string;
  newStatus: string;
  dealValue: number;
  previousClientStage: string;
  newClientStage: string;
  convertedBy: string;
  conversionDate: Date;
}
```

## Enforcement Checklist

- [ ] Lead status update validates transition rules
- [ ] `closed_won` status automatically creates deal in same transaction
- [ ] Client CRM stage is updated based on deal value
- [ ] Duplicate deal creation is prevented
- [ ] Required lead fields are validated before conversion
- [ ] Domain events are emitted for conversion
- [ ] Comprehensive error handling for edge cases
- [ ] Audit trail tracks all conversions
- [ ] Database constraints prevent data inconsistency
- [ ] API endpoints enforce business rules
- [ ] Tests cover all conversion scenarios
- [ ] Monitoring tracks conversion metrics

---

## CRM Unique Constraints Rule

**File:** `.windsurf/rules/crm-unique-constraints.md`

---
trigger: model_decision
description: Define mandatory unique fields per CRM entity and the expected DuplicateX domain error for consistent duplicate detection across all CRM entities.
---



## Purpose

Standardize duplicate detection across all CRM entities by defining mandatory unique fields per entity type and ensuring consistent `DuplicateX` domain error responses. This prevents data inconsistency and provides predictable duplicate handling behavior.

## Entity-Specific Unique Constraints

### Contacts

**Required unique fields:**
- `email` must be unique per organization (tenant)
- `phone` must be unique per organization (tenant) if provided

**Duplicate error:** `DuplicateContact`

```typescript
// Contact creation validation
async createContact(contactData: CreateContactRequest, tenantId: string): Promise<Contact> {
  // Check email uniqueness
  if (contactData.email) {
    const existingEmail = await this.db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.tenant_id, tenantId),
        eq(contacts.email, contactData.email.toLowerCase())
      ))
      .limit(1);

    if (existingEmail[0]) {
      throw new DuplicateContactError('Email already exists', {
        field: 'email',
        value: contactData.email,
        existingContactId: existingEmail[0].id
      });
    }
  }

  // Check phone uniqueness
  if (contactData.phone) {
    const normalizedPhone = this.normalizePhoneNumber(contactData.phone);
    const existingPhone = await this.db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.tenant_id, tenantId),
        eq(contacts.phone, normalizedPhone)
      ))
      .limit(1);

    if (existingPhone[0]) {
      throw new DuplicateContactError('Phone number already exists', {
        field: 'phone',
        value: contactData.phone,
        existingContactId: existingPhone[0].id
      });
    }
  }

  // Create contact...
}
```

### Companies

**Required unique fields:**
- `name` must be unique per organization (tenant)
- `domain` must be unique per organization (tenant) if provided
- `tax_id` must be unique per organization (tenant) if provided

**Duplicate error:** `DuplicateCompany`

```typescript
// Company creation validation
async createCompany(companyData: CreateCompanyRequest, tenantId: string): Promise<Company> {
  // Check name uniqueness (case-insensitive)
  const existingName = await this.db
    .select()
    .from(companies)
    .where(and(
      eq(companies.tenant_id, tenantId),
      sql`LOWER(${companies.name}) = LOWER(${companyData.name})`
    ))
    .limit(1);

  if (existingName[0]) {
    throw new DuplicateCompanyError('Company name already exists', {
      field: 'name',
      value: companyData.name,
      existingCompanyId: existingName[0].id
    });
  }

  // Check domain uniqueness
  if (companyData.domain) {
    const normalizedDomain = this.normalizeDomain(companyData.domain);
    const existingDomain = await this.db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenant_id, tenantId),
        eq(companies.domain, normalizedDomain)
      ))
      .limit(1);

    if (existingDomain[0]) {
      throw new DuplicateCompanyError('Domain already exists', {
        field: 'domain',
        value: companyData.domain,
        existingCompanyId: existingDomain[0].id
      });
    }
  }

  // Check tax ID uniqueness
  if (companyData.taxId) {
    const normalizedTaxId = this.normalizeTaxId(companyData.taxId);
    const existingTaxId = await this.db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenant_id, tenantId),
        eq(companies.tax_id, normalizedTaxId)
      ))
      .limit(1);

    if (existingTaxId[0]) {
      throw new DuplicateCompanyError('Tax ID already exists', {
        field: 'tax_id',
        value: companyData.taxId,
        existingCompanyId: existingTaxId[0].id
      });
    }
  }

  // Create company...
}
```

### Leads

**Required unique fields:**
- `email` must be unique per organization (tenant) if provided
- `phone` must be unique per organization (tenant) if provided
- Combination of `company_name` + `contact_name` must be unique per organization

**Duplicate error:** `DuplicateLead`

```typescript
// Lead creation validation
async createLead(leadData: CreateLeadRequest, tenantId: string): Promise<Lead> {
  // Check email uniqueness
  if (leadData.email) {
    const existingEmail = await this.db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenant_id, tenantId),
        eq(leads.email, leadData.email.toLowerCase())
      ))
      .limit(1);

    if (existingEmail[0]) {
      throw new DuplicateLeadError('Email already exists in leads', {
        field: 'email',
        value: leadData.email,
        existingLeadId: existingEmail[0].id
      });
    }
  }

  // Check phone uniqueness
  if (leadData.phone) {
    const normalizedPhone = this.normalizePhoneNumber(leadData.phone);
    const existingPhone = await this.db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenant_id, tenantId),
        eq(leads.phone, normalizedPhone)
      ))
      .limit(1);

    if (existingPhone[0]) {
      throw new DuplicateLeadError('Phone number already exists in leads', {
        field: 'phone',
        value: leadData.phone,
        existingLeadId: existingPhone[0].id
      });
    }
  }

  // Check company + contact name uniqueness
  if (leadData.companyName && leadData.contactName) {
    const existingCombo = await this.db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenant_id, tenantId),
        sql`LOWER(${leads.company_name}) = LOWER(${leadData.companyName})`,
        sql`LOWER(${leads.contact_name}) = LOWER(${leadData.contactName})`
      ))
      .limit(1);

    if (existingCombo[0]) {
      throw new DuplicateLeadError('Company and contact name combination already exists', {
        field: 'company_contact_combo',
        value: `${leadData.companyName} + ${leadData.contactName}`,
        existingLeadId: existingCombo[0].id
      });
    }
  }

  // Create lead...
}
```

### Deals

**Required unique fields:**
- No unique constraints required (deals can have multiple per company)
- However, `deal_number` must be unique per organization (tenant) if used

**Duplicate error:** `DuplicateDeal` (only for deal_number conflicts)

```typescript
// Deal creation validation
async createDeal(dealData: CreateDealRequest, tenantId: string): Promise<Deal> {
  // Check deal number uniqueness if provided
  if (dealData.dealNumber) {
    const existingDealNumber = await this.db
      .select()
      .from(deals)
      .where(and(
        eq(deals.tenant_id, tenantId),
        eq(deals.deal_number, dealData.dealNumber)
      ))
      .limit(1);

    if (existingDealNumber[0]) {
      throw new DuplicateDealError('Deal number already exists', {
        field: 'deal_number',
        value: dealData.dealNumber,
        existingDealId: existingDealNumber[0].id
      });
    }
  }

  // Create deal...
}
```

## Standardized Duplicate Error Format

### Base Duplicate Error Class

```typescript
export class DuplicateEntityError extends DomainError {
  constructor(
    entityType: string,
    message: string,
    public readonly details: {
      field: string;
      value: string;
      existingEntityId: string;
      additionalInfo?: Record<string, any>;
    }
  ) {
    super(`DUPLICATE_${entityType.toUpperCase()}`, message, details);
  }
}

export class DuplicateContactError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Contact', message, details);
  }
}

export class DuplicateCompanyError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Company', message, details);
  }
}

export class DuplicateLeadError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Lead', message, details);
  }
}

export class DuplicateDealError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Deal', message, details);
  }
}
```

### API Response Format

**Standardized duplicate error response:**

```typescript
// In error handler middleware
if (error instanceof DuplicateEntityError) {
  return res.status(409).json({
    error: error.message,
    code: error.code,
    details: {
      field: error.details.field,
      value: error.details.value,
      existingEntityId: error.details.existingEntityId,
      entityType: error.constructor.name.replace('Error', '').toLowerCase()
    },
    suggestions: [
      'Check if you meant to update the existing record instead',
      'Verify the duplicate data is not a data entry error',
      'Contact support if you believe this is an error'
    ],
    timestamp: new Date().toISOString()
  });
}
```

## Database Constraints

### Unique Indexes

```sql
-- Contacts unique constraints
CREATE UNIQUE INDEX idx_contacts_tenant_email 
  ON contacts(tenant_id, email) 
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX idx_contacts_tenant_phone 
  ON contacts(tenant_id, phone) 
  WHERE phone IS NOT NULL;

-- Companies unique constraints
CREATE UNIQUE INDEX idx_companies_tenant_name 
  ON companies(tenant_id, LOWER(name));

CREATE UNIQUE INDEX idx_companies_tenant_domain 
  ON companies(tenant_id, domain) 
  WHERE domain IS NOT NULL;

CREATE UNIQUE INDEX idx_companies_tenant_tax_id 
  ON companies(tenant_id, tax_id) 
  WHERE tax_id IS NOT NULL;

-- Leads unique constraints
CREATE UNIQUE INDEX idx_leads_tenant_email 
  ON leads(tenant_id, email) 
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX idx_leads_tenant_phone 
  ON leads(tenant_id, phone) 
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX idx_leads_tenant_company_contact 
  ON leads(tenant_id, LOWER(company_name), LOWER(contact_name)) 
  WHERE company_name IS NOT NULL AND contact_name IS NOT NULL;

-- Deals unique constraint for deal numbers
CREATE UNIQUE INDEX idx_deals_tenant_deal_number 
  ON deals(tenant_id, deal_number) 
  WHERE deal_number IS NOT NULL;
```

## Data Normalization Utilities

### Phone Number Normalization

```typescript
normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle country codes (assuming US format for now)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return cleaned; // Return as-is if format is unexpected
}
```

### Domain Normalization

```typescript
normalizeDomain(domain: string): string {
  // Remove protocol and www, convert to lowercase
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .toLowerCase();
}
```

### Tax ID Normalization

```typescript
normalizeTaxId(taxId: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  return taxId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
```

## Duplicate Detection API Endpoint

### Check for Duplicates Before Creation

```typescript
// POST /api/crm/check-duplicates
router.post('/check-duplicates', async (req, res, next) => {
  try {
    const { entityType, data } = req.body;
    
    const duplicates = await crmService.checkForDuplicates(
      entityType,
      data,
      req.tenant.id
    );

    res.json({
      hasDuplicates: duplicates.length > 0,
      duplicates: duplicates.map(dup => ({
        field: dup.field,
        value: dup.value,
        existingEntity: dup.existingEntity,
        confidence: dup.confidence // How likely this is a true duplicate
      }))
    });
  } catch (error) {
    next(error);
  }
});
```

## Testing Requirements

### Unit Tests

**Test each entity's duplicate detection:**

1. **Email Uniqueness**: Verify email duplicates are caught across entities
2. **Phone Uniqueness**: Test phone normalization and duplicate detection
3. **Name Combinations**: Test company + contact name uniqueness for leads
4. **Domain Uniqueness**: Test domain normalization and duplicate detection
5. **Error Format**: Verify all duplicate errors follow the same format

### Integration Tests

**Test cross-entity duplicate scenarios:**

1. **Contact-Lead Conflicts**: Same email in both contacts and leads
2. **Company-Lead Conflicts**: Same domain in both companies and leads
3. **Case Sensitivity**: Verify uniqueness is case-insensitive where appropriate
4. **Normalization**: Verify phone and domain normalization works correctly

### Edge Cases

**Test these scenarios:**

1. **Null Values**: Ensure null values don't trigger duplicate errors
2. **Partial Matches**: Test partial data doesn't create false positives
3. **Special Characters**: Test special characters in names and emails
4. **International Formats**: Test international phone numbers and domains

## Enforcement Checklist

- [ ] All CRM entities have defined unique constraints
- [ ] Duplicate errors follow standardized format
- [ ] Database unique indexes enforce constraints at DB level
- [ ] Data normalization utilities are implemented
- [ ] API endpoints validate duplicates before creation
- [ ] Cross-entity duplicate checking is available
- [ ] Comprehensive test coverage for all scenarios
- [ ] Proper error handling and user feedback
- [ ] Monitoring for duplicate detection performance
- [ ] Audit logging for duplicate detection events

---

## CSS @property Animated Gradient Borders

**File:** `.windsurf/rules/css-property-animations.md`

---
trigger: always_on
---



Modern CSS provides native support for animated gradient borders using the `@property` rule, eliminating the need for JavaScript-heavy solutions.

<!-- SECTION: property_rule -->

<property_rule>

- Use `@property` to register custom properties as animatable types
- Enables smooth interpolation of custom properties in keyframes
- Browser support: All modern browsers (Firefox added support Dec 2023)

</property_rule>

<!-- ENDSECTION: property_rule -->

<!-- SECTION: implementation_pattern -->

<implementation_pattern>

```css
/* Register animatable angle property */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

/* Card with animated gradient border */
.card {
  position: relative;
  z-index: 1;
  background-color: #111111; /* Hides gradient behind face */
}

.card::after {
  content: '';
  position: absolute;
  inset: -4px; /* Expand beyond card edges */
  z-index: -1;
  border-radius: inherit;
  background: conic-gradient(
    from var(--angle),
    #0066ff,
    #00aaff,
    #0066ff /* Repeat first stop for seamless loop */
  );
  animation: spin 3s linear infinite;
}

@keyframes spin {
  to {
    --angle: 360deg;
  }
}
```

</implementation_pattern>

<!-- ENDSECTION: implementation_pattern -->

<!-- SECTION: use_cases -->

<use_cases>

- **AmbientStatusBanner**: Animated conic-gradient border for system health indicator

- **CommandPalette**: Subtle rotating border for active focus state

- **Status indicators**: Pulsing gradient borders for critical alerts

- **CTA buttons**: Animated gradient borders on hover for premium feel

</use_cases>

<!-- ENDSECTION: use_cases -->

<!-- SECTION: performance_considerations -->

<performance_considerations>

- GPU-accelerated animation (transforms and opacity)

- No JavaScript required for animation loop

- Lower CPU overhead compared to JS-based solutions

- Test on low-end devices for performance impact

</performance_considerations>

<!-- ENDSECTION: performance_considerations -->

<!-- SECTION: accessibility -->

<accessibility>

- Wrap animations in `@media (prefers-reduced-motion: no-preference)`

- When reduced motion is requested, use static border or very slow animation

- Ensure color contrast meets WCAG 2.2 AA (4.5:1 minimum)

- Animated borders should not distract from content

</accessibility>

<!-- ENDSECTION: accessibility -->

<!-- SECTION: reduced_motion -->

<reduced_motion>

```css
@media (prefers-reduced-motion: reduce) {
  .card::after {
    animation: none;
    /* Use static gradient or solid border */
    background: linear-gradient(90deg, #0066ff, #00aaff);
  }
}
```

</reduced_motion>

<!-- ENDSECTION: reduced_motion -->

<!-- SECTION: anti_patterns -->

<anti_patterns>

- Do NOT use JavaScript to continuously redraw gradients

- Do NOT use SVG filters layered behind content (outdated approach)

- Do NOT animate layout properties (width, height) with @property
- Do NOT use @property for simple color transitions (use CSS transitions instead)
- Do NOT overuse animated borders - reserve for key interactive elements

</anti_patterns>

<!-- ENDSECTION: anti_patterns -->

<!-- SECTION: color_integration -->

<color_integration>

- Use project's electric blue gradient: `#0066ff → #00aaff`
- For status indicators: red (#ff4545), green (#00ff99), amber (#ffaa00)
- Ensure gradient colors match the visual identity tokens

</color_integration>

<!-- ENDSECTION: color_integration -->

---

## Database Schema Development Rules

**File:** `.windsurf/rules/database-development.md`

---
trigger: glob
globs: lib/db/src/schema/**/*.ts
---



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

---

## Database Schema Rules

**File:** `.windsurf/rules/database-schema-rules.md`

---
trigger: glob
globs: lib/db/src/schema/*.ts
---



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

---

## Dependency Management Rules

**File:** `.windsurf/rules/dependency-management.md`

---
trigger: always_on
---



## Purpose
Manage project dependencies efficiently, remove unused packages, and maintain security through proper versioning.

## Current State Analysis (Updated 2026)

### Unused Dependencies Identified
- `cookie-parser` (api-server) - Declared but never imported
- `@hookform/resolvers` (apex-os) - Only used in shadcn form.tsx, not in pages
- `react-hook-form` (apex-os) - Never imported in any page
- `next-themes` (apex-os) - No theme switching implemented
- `react-day-picker` (apex-os) - No date picker usage
- `react-resizable-panels` (apex-os) - No resizable panel usage
- `vaul` (apex-os) - Drawer component unused
- `embla-carousel-react` (apex-os) - No carousel in pages

### Critical Dependencies (2026 Standards)
- `zod` version is floating (incompatible with drizzle-zod)
- Missing testing frameworks (Vitest 2.0, Playwright 1.45, RTL 14.0)
- Missing development tools (ESLint, Prettier config)
- Need to evaluate bundle size impact of new dependencies
- Consider edge deployment compatibility for all packages

## Dependency Management Strategy

### Version Pinning Requirements
- Pin `zod` to `^3.23.x` for drizzle-zod compatibility
- Use exact versions for critical security dependencies
- Maintain consistent versions across workspace packages

### Unused Package Removal Process
1. Identify unused packages via grep search
2. Verify no imports exist across all files
3. Remove from package.json
4. Run `pnpm install --frozen-lockfile`
5. Verify no build errors

### Security Considerations
- Maintain 1440-minute minimum release age
- Review all new dependencies for security
- Use `pnpm audit` regularly
- Keep `@replit/*` packages exempt from release age

## Implementation Commands

### Audit Dependencies
```bash
# Find unused dependencies
pnpm list --depth=0
grep -r "@hookform/resolvers" artifacts/apex-os/src/
grep -r "react-hook-form" artifacts/apex-os/src/
```

### Remove Unused Packages
```bash
# Remove specific unused packages
pnpm --filter @workspace/api-server remove cookie-parser
pnpm --filter @workspace/apex-os remove @hookform/resolvers react-hook-form next-themes
```

### Pin Critical Versions
```bash
# Pin zod for compatibility
pnpm --filter @workspace/db add zod@3.23.8
pnpm --filter @workspace/api-zod add zod@3.23.8
pnpm --filter @workspace/api-client-react add zod@3.23.8
```

## Quality Gates
- Zero unused dependencies in production
- All security patches applied
- Consistent versions across workspace
- No floating major versions
- Regular dependency audits

## Monitoring
- Weekly dependency reviews
- Automated security scanning
- Package size analysis
- License compliance checks

---

## Design Tokens Rules

**File:** `.windsurf/rules/design-tokens.md`

---
trigger: always_on
---



Define CSS custom properties in tokens.css for consistent theming:

<!-- SECTION: token_definition -->

<token_definition>

Define these CSS custom properties in src/tokens.css:
- --color-accent: Electric blue (#0066ff)
- --color-surface: Deep charcoal (#111111)
- --motion-duration: 150ms
- --motion-ease: ease-out

</token_definition>

<!-- ENDSECTION: token_definition -->

<!-- SECTION: tailwind_integration -->

<tailwind_integration>

Reference these tokens in tokens.css using @theme directive:
- Use @theme to map CSS variables to Tailwind utilities
- Example: @theme { --color-accent: #0066ff; }
- Add @source directive for component discovery

</tailwind_integration>

<!-- ENDSECTION: tailwind_integration -->

<!-- SECTION: usage -->

<usage>

- Use CSS variables instead of hardcoded values for themeable properties
- Reference via Tailwind utilities where possible
- Direct CSS variable usage for custom components

</usage>

<!-- ENDSECTION: usage -->

---

## Document Versioning Policy Rule

**File:** `.windsurf/rules/document-versioning-policy.md`

---
trigger: model_decision
description: When a document is updated, version must increment; soft-delete of a document also marks all its versions as deleted.
---



## Purpose

Enforce that document updates automatically increment the version number and maintain complete version history. Additionally, ensure that soft-deleting a document marks all associated versions as deleted to maintain referential integrity.

## Core Versioning Requirements

### Version Increment Logic

**When a document is updated with new file content:**

1. **Content Comparison**: Check if new file content differs from current version
2. **Version Increment**: If content differs, increment version number
3. **Version History**: Preserve all previous versions with metadata
4. **Latest Reference**: Update document's latest_version_id reference
5. **Change Description**: Record reason for version change

### Soft Delete Propagation

**When a document is soft-deleted:**

1. **Document Status**: Mark document as inactive
2. **Version Status**: Mark all versions as inactive
3. **Access Control**: Prevent access to all versions of deleted document
4. **Audit Trail**: Log deletion event with affected versions

## Implementation Requirements

### Service Layer Implementation

```typescript
// src/services/DocumentVersioningService.ts
export class DocumentVersioningService {
  constructor(private db: Database) {}

  async updateDocument(
    documentId: string,
    updateData: UpdateDocumentRequest,
    tenantId: string,
    updatedBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Get current document and latest version
      const currentDocument = await this.getDocumentWithLatestVersion(
        tx,
        documentId,
        tenantId
      );

      if (!currentDocument) {
        throw new DocumentNotFoundError('Document not found');
      }

      let newVersionNumber = currentDocument.current_version;
      let shouldCreateNewVersion = false;

      // Check if file content changed
      if (updateData.file) {
        const newFileHash = this.calculateFileHash(updateData.file.buffer);
        const currentFileHash = currentDocument.latestVersion?.file_hash;

        if (currentFileHash !== newFileHash) {
          newVersionNumber = currentDocument.current_version + 1;
          shouldCreateNewVersion = true;

          // Mark previous version as not latest
          await tx.update(documentVersions)
            .set({ is_latest: false })
            .where(and(
              eq(documentVersions.document_id, documentId),
              eq(documentVersions.is_latest, true)
            ));

          // Create new version
          const filePath = await this.storageService.uploadFile(
            tenantId,
            documentId,
            newVersionNumber,
            updateData.file.buffer,
            updateData.file.originalName
          );

          await tx.insert(documentVersions).values({
            tenantId,
            documentId,
            versionNumber: newVersionNumber,
            filePath,
            fileSize: updateData.file.size,
            fileHash: newFileHash,
            mimeType: updateData.file.mimeType,
            uploadedBy: updatedBy,
            changeDescription: updateData.changeDescription || `Version ${newVersionNumber}`,
            isLatest: true,
            storageMetadata: await this.storageService.getFileMetadata(filePath)
          });
        }
      }

      // Update document metadata
      const updatedDocument = await tx.update(documents)
        .set({
          name: updateData.name || currentDocument.name,
          description: updateData.description !== undefined 
            ? updateData.description 
            : currentDocument.description,
          currentVersion: newVersionNumber,
          latestVersionId: shouldCreateNewVersion 
            ? sql`(
              SELECT id FROM document_versions 
              WHERE document_id = ${documentId} AND version_number = ${newVersionNumber}
            )`
            : currentDocument.latest_version_id,
          tags: updateData.tags || currentDocument.tags,
          metadata: updateData.metadata || currentDocument.metadata,
          updatedBy,
          updatedAt: new Date()
        })
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId)
        ))
        .returning();

      // Emit domain event
      await this.emitEvent(shouldCreateNewVersion ? 'DocumentVersionCreated' : 'DocumentUpdated', {
        documentId,
        versionNumber: newVersionNumber,
        updatedBy,
        changeDescription: updateData.changeDescription
      });

      return updatedDocument[0];
    });
  }

  async softDeleteDocument(
    documentId: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get document to verify existence
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
        throw new DocumentNotFoundError('Document not found or already deleted');
      }

      // Mark document as inactive
      await tx.update(documents)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: deletedBy
        })
        .where(eq(documents.id, documentId));

      // Mark all versions as inactive
      await tx.update(documentVersions)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(documentVersions.document_id, documentId),
          eq(documentVersions.tenant_id, tenantId),
          eq(documentVersions.is_active, true)
        ));

      // Get affected version count for audit
      const affectedVersions = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(documentVersions)
        .where(and(
          eq(documentVersions.document_id, documentId),
          eq(documentVersions.tenant_id, tenantId)
        ));

      // Emit domain event
      await this.emitEvent('DocumentDeleted', {
        documentId,
        deletedBy,
        affectedVersionCount: affectedVersions[0].count
      });
    });
  }

  async restoreDocument(
    documentId: string,
    tenantId: string,
    restoredBy: string
  ): Promise<Document> {
    return await this.db.transaction(async (tx) => {
      // Mark document as active
      await tx.update(documents)
        .set({
          isActive: true,
          updatedAt: new Date(),
          updatedBy: restoredBy
        })
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId),
          eq(documents.is_active, false)
        ));

      // Mark all versions as active
      await tx.update(documentVersions)
        .set({
          isActive: true,
          updatedAt: new Date()
        })
        .where(and(
          eq(documentVersions.document_id, documentId),
          eq(documentVersions.tenant_id, tenantId),
          eq(documentVersions.is_active, false)
        ));

      // Get restored document
      const restoredDocument = await tx
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      // Emit domain event
      await this.emitEvent('DocumentRestored', {
        documentId,
        restoredBy
      });

      return restoredDocument[0];
    });
  }

  private async getDocumentWithLatestVersion(
    tx: Database,
    documentId: string,
    tenantId: string
  ): Promise<any> {
    const result = await tx
      .select({
        id: documents.id,
        name: documents.name,
        description: documents.description,
        currentVersion: documents.current_version,
        isActive: documents.is_active,
        tags: documents.tags,
        metadata: documents.metadata,
        latestVersion: {
          id: documentVersions.id,
          versionNumber: documentVersions.version_number,
          fileHash: documentVersions.file_hash,
          filePath: documentVersions.file_path,
          fileSize: documentVersions.file_size,
          mimeType: documentVersions.mime_type,
          isLatest: documentVersions.is_latest
        }
      })
      .from(documents)
      .leftJoin(
        documentVersions,
        and(
          eq(documentVersions.document_id, documents.id),
          eq(documentVersions.is_latest, true)
        )
      )
      .where(and(
        eq(documents.id, documentId),
        eq(documents.tenant_id, tenantId)
      ))
      .limit(1);

    return result[0];
  }

  private calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
```

### Database Schema Constraints

```sql
-- Documents table with versioning support
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  folder_id UUID REFERENCES document_folders(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(50) NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  latest_version_id UUID REFERENCES document_versions(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Document versions table
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  change_description TEXT,
  is_latest BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  storage_provider VARCHAR(50) DEFAULT 'local',
  storage_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Constraints to ensure data integrity
ALTER TABLE documents 
  ADD CONSTRAINT fk_documents_latest_version 
    FOREIGN KEY (latest_version_id) REFERENCES document_versions(id);

CREATE UNIQUE INDEX idx_document_versions_unique ON document_versions(document_id, version_number);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_latest ON document_versions(document_id, is_latest);
CREATE INDEX idx_document_versions_active ON document_versions(is_active);
CREATE INDEX idx_document_versions_hash ON document_versions(file_hash);
```

### API Endpoint Implementation

```typescript
// PUT /api/documents/:id
router.put('/:id', 
  upload.single('file'),
  validateRequest(updateDocumentSchema),
  async (req, res, next) => {
    try {
      const updateData = {
        ...req.body,
        file: req.file ? {
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        } : undefined
      };

      const document = await documentVersioningService.updateDocument(
        req.params.id,
        updateData,
        req.tenant.id,
        req.user.id
      );

      res.json({ document });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await documentVersioningService.softDeleteDocument(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/documents/:id/restore
router.post('/:id/restore', async (req, res, next) => {
  try {
    const document = await documentVersioningService.restoreDocument(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.json({ document });
  } catch (error) {
    next(error);
  }
});
```

### Domain Error Classes

```typescript
export class DocumentVersioningError extends DomainError {
  constructor(message: string, public readonly details?: any) {
    super('DOCUMENT_VERSIONING_ERROR', message, details);
  }
}

export class DuplicateContentError extends DocumentVersioningError {
  constructor(documentId: string) {
    super('Document with identical content already exists', { documentId });
  }
}

export class VersionLimitExceededError extends DocumentVersioningError {
  constructor(currentVersion: number, maxVersions: number) {
    super('Maximum version limit exceeded', {
      currentVersion,
      maxVersions
    });
  }
}
```

### Frontend Integration

```typescript
// React component for document upload with versioning
export const DocumentUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [versionHistory, setVersionHistory] = useState<DocumentVersion[]>([]);

  const handleFileUpload = async (file: File, changeDescription?: string) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('changeDescription', changeDescription || '');

      const response = await updateDocument(documentId, formData);
      
      // Refresh version history
      await fetchVersionHistory();
      
      showSuccessMessage(`Document updated to version ${response.current_version}`);
    } catch (error) {
      if (error instanceof DuplicateContentError) {
        showWarningMessage('No changes detected - file content is identical to current version');
      } else {
        showErrorMessage('Failed to upload document');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('This will delete the document and all its versions. Continue?')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      showSuccessMessage('Document deleted successfully');
      onDocumentDeleted();
    } catch (error) {
      showErrorMessage('Failed to delete document');
    }
  };

  return (
    <div>
      <div className="version-info">
        <h3>Current Version: {document.currentVersion}</h3>
        <p>Updated: {formatDate(document.updatedAt)}</p>
      </div>

      <FileUpload
        onUpload={handleFileUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        disabled={uploading}
      />

      <div className="version-history">
        <h4>Version History</h4>
        {versionHistory.map(version => (
          <VersionCard
            key={version.id}
            version={version}
            onDownload={() => downloadVersion(version.id)}
          />
        ))}
      </div>

      <div className="document-actions">
        <button onClick={handleDelete} className="danger">
          Delete Document
        </button>
      </div>
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

**Test version increment logic:**

```typescript
describe('Document Versioning', () => {
  test('should increment version when content changes', async () => {
    const document = await createDocument();
    const newFile = createMockFile('New content');

    const updated = await updateDocument(document.id, {
      file: newFile,
      changeDescription: 'Updated content'
    });

    expect(updated.currentVersion).toBe(2);
  });

  test('should not increment version when content is identical', async () => {
    const document = await createDocument();
    const sameFile = document.file; // Same content

    await expect(
      updateDocument(document.id, { file: sameFile })
    ).rejects.toThrow(DuplicateContentError);
  });

  test('should mark all versions as inactive when document is deleted', async () => {
    const document = await createDocument();
    // Create multiple versions
    await createVersion(document.id, 2);
    await createVersion(document.id, 3);

    await softDeleteDocument(document.id);

    const versions = await getDocumentVersions(document.id);
    expect(versions.every(v => !v.isActive)).toBe(true);
  });
});
```

### Integration Tests

**Test end-to-end versioning workflow:**

1. **Document Creation**: Initial version creation
2. **Multiple Updates**: Sequential version increments
3. **Version History**: Complete version history tracking
4. **Soft Delete**: Version status propagation
5. **Document Restoration**: Version restoration

### Edge Cases

**Test these scenarios:**

1. **Concurrent Updates**: Handle simultaneous document updates
2. **Large Files**: Version management for large file uploads
3. **Version Limits**: Maximum version count enforcement
4. **Storage Failures**: Handle storage provider failures

## Performance Considerations

### Efficient Version Queries

```typescript
// Optimized query for document with latest version
private async getDocumentWithLatestVersionOptimized(
  tx: Database,
  documentId: string,
  tenantId: string
): Promise<any> {
  return await tx
    .select({
      id: documents.id,
      name: documents.name,
      currentVersion: documents.current_version,
      latestVersion: {
        id: documentVersions.id,
        versionNumber: documentVersions.version_number,
        fileHash: documentVersions.file_hash
      }
    })
    .from(documents)
    .innerJoin(
      documentVersions,
      sql`${documentVersions.id} = (
        SELECT id FROM document_versions 
        WHERE document_id = ${documentId} AND is_latest = true
      )`
    )
    .where(and(
      eq(documents.id, documentId),
      eq(documents.tenant_id, tenantId)
    ))
    .limit(1);
}
```

## Enforcement Checklist

- [ ] Document updates increment version number when content changes
- [ ] Duplicate content detection prevents unnecessary version creation
- [ ] Soft delete marks all versions as inactive
- [ ] Version history is maintained with complete metadata
- [ ] Latest version reference is always accurate
- [ ] Database constraints ensure referential integrity
- [ ] API endpoints enforce versioning policies
- [ ] Frontend shows clear version information
- [ ] Comprehensive test coverage for versioning scenarios
- [ ] Performance optimization for version queries
- [ ] Audit logging for all versioning operations
- [ ] Error handling for versioning edge cases
- [ ] Storage provider integration for version files

---

## Domain Error Result Pattern Rule

**File:** `.windsurf/rules/domain-error-result-pattern.md`

---
trigger: always_on
---



## Core Requirement
All services **must** return `Result<T, DomainError>` (using neverthrow) and **never throw** exceptions. Route handlers only translate domain errors to HTTP responses.

## Pattern Enforcement

### Service Layer
Services must use Result pattern for all operations:

```typescript
// ✅ CORRECT - Use Result pattern
import { Result, ok, err } from 'neverthrow';

class UserService {
  async createUser(data: CreateUserData): Promise<Result<User, DomainError>> {
    try {
      // Validate input
      const validation = this.validateUserData(data);
      if (validation.isErr()) {
        return err(validation.error);
      }

      // Check for existing user
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        return err(new DomainError('USER_ALREADY_EXISTS', 'User with this email already exists'));
      }

      // Create user
      const user = await this.userRepository.create(data);
      return ok(user);
    } catch (error) {
      // Log unexpected errors but don't throw
      console.error('Unexpected error in createUser:', error);
      return err(new DomainError('INTERNAL_ERROR', 'Failed to create user'));
    }
  }
}

// ❌ INCORRECT - Throwing exceptions
class UserService {
  async createUser(data: CreateUserData): Promise<User> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('User already exists'); // NEVER DO THIS
    }
    return await this.userRepository.create(data);
  }
}
```

### Domain Error Types
All domain errors must extend DomainError:

```typescript
// ✅ CORRECT - Structured domain errors
export class DomainError {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {}
}

export class ValidationError extends DomainError {
  constructor(field: string, message: string) {
    super('VALIDATION_ERROR', message, { field });
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found`, { resource, id });
  }
}

export class BusinessRuleError extends DomainError {
  constructor(rule: string, message: string) {
    super('BUSINESS_RULE_VIOLATION', message, { rule });
  }
}
```

### Repository Layer
Repositories must also return Results:

```typescript
// ✅ CORRECT - Repository returns Result
class UserRepository {
  async findById(id: string): Promise<Result<User | null, DomainError>> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, id),
      });
      return ok(user);
    } catch (error) {
      console.error('Database error in findById:', error);
      return err(new DomainError('DATABASE_ERROR', 'Failed to fetch user'));
    }
  }
}

// ❌ INCORRECT - Repository throws
class UserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      return await this.db.query.users.findFirst({
        where: eq(users.id, id),
      });
    } catch (error) {
      throw new Error('Database error'); // NEVER DO THIS
    }
  }
}
```

### Route Handler Pattern
Route handlers must only translate domain errors to HTTP responses:

```typescript
// ✅ CORRECT - Route handler translates errors
router.post('/users', async (req, res) => {
  const result = await userService.createUser(req.body);
  
  if (result.isErr()) {
    const error = result.error;
    
    // Translate domain errors to HTTP responses
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return res.status(400).json({
          error: error.message,
          details: error.details,
        });
        
      case 'USER_ALREADY_EXISTS':
        return res.status(409).json({
          error: error.message,
          code: error.code,
        });
        
      case 'INTERNAL_ERROR':
        return res.status(500).json({
          error: 'Internal server error',
        });
        
      default:
        return res.status(500).json({
          error: 'Unknown error occurred',
        });
    }
  }
  
  res.status(201).json(result.value);
});

// ❌ INCORRECT - Route handler contains business logic
router.post('/users', async (req, res) => {
  try {
    // Business logic in route handler - NEVER DO THIS
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});
```

## Error Handling Middleware

### Global Error Handler
Create a global error handler that catches unexpected exceptions and converts them to domain errors:

```typescript
// artifacts/api-server/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { DomainError } from '@workspace/shared/src/errors/domain-error';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  console.error('Unhandled error:', error);
  
  // Convert to domain error if needed
  const domainError = error instanceof DomainError 
    ? error 
    : new DomainError('INTERNAL_ERROR', 'An unexpected error occurred');
  
  // Translate to HTTP response
  const statusCode = getStatusCodeFromError(domainError);
  
  res.status(statusCode).json({
    error: domainError.message,
    code: domainError.code,
    details: domainError.details,
    timestamp: new Date().toISOString(),
  });
};

function getStatusCodeFromError(error: DomainError): number {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'USER_ALREADY_EXISTS':
    case 'RESOURCE_CONFLICT':
      return 409;
    case 'BUSINESS_RULE_VIOLATION':
      return 422;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'INTERNAL_ERROR':
    case 'DATABASE_ERROR':
    default:
      return 500;
  }
}
```

## Testing Requirements

### Unit Tests
Test all error paths in services:

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should return validation error for invalid data', async () => {
      const invalidData = { email: 'invalid-email' };
      const result = await userService.createUser(invalidData);
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
    
    it('should return conflict error for existing user', async () => {
      const existingUserData = { email: 'existing@example.com' };
      const result = await userService.createUser(existingUserData);
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('USER_ALREADY_EXISTS');
    });
    
    it('should return user on success', async () => {
      const validData = { email: 'new@example.com' };
      const result = await userService.createUser(validData);
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toHaveProperty('email', 'new@example.com');
    });
  });
});
```

### Integration Tests
Test error translation in route handlers:

```typescript
describe('POST /users', () => {
  it('should return 400 for validation errors', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ email: 'invalid-email' })
      .expect(400);
      
    expect(response.body).toHaveProperty('error');
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 409 for existing user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ email: 'existing@example.com' })
      .expect(409);
      
    expect(response.body).toHaveProperty('error');
    expect(response.body.code).toBe('USER_ALREADY_EXISTS');
  });
});
```

## Common Violations and Fixes

### Throwing Exceptions
**Violation**: Throwing exceptions from services
```typescript
// ❌ WRONG
if (!user) {
  throw new Error('User not found');
}
```

**Fix**: Return Result with error
```typescript
// ✅ CORRECT
if (!user) {
  return err(new NotFoundError('User', id));
}
```

### Business Logic in Routes
**Violation**: Business logic in route handlers
```typescript
// ❌ WRONG
router.post('/users', async (req, res) => {
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  // ... more business logic
});
```

**Fix**: Move to service layer
```typescript
// ✅ CORRECT
router.post('/users', async (req, res) => {
  const result = await userService.createUser(req.body);
  // ... error translation
});
```

### Unhandled Exceptions
**Violation**: Not catching database errors
```typescript
// ❌ WRONG
async findById(id: string): Promise<User> {
  return await this.db.query.users.findFirst({ where: eq(users.id, id) });
}
```

**Fix**: Wrap in try-catch and return Result
```typescript
// ✅ CORRECT
async findById(id: string): Promise<Result<User | null, DomainError>> {
  try {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    return ok(user);
  } catch (error) {
    return err(new DomainError('DATABASE_ERROR', 'Failed to fetch user'));
  }
}
```

## Migration Strategy

### Step 1: Add DomainError Types
Create domain error classes and Result utilities.

### Step 2: Update Services
Convert services to return Results instead of throwing.

### Step 3: Update Repositories
Convert repositories to return Results.

### Step 4: Update Route Handlers
Convert route handlers to translate domain errors.

### Step 5: Add Global Error Handler
Implement global error handling middleware.

### Step 6: Add Tests
Add comprehensive error path testing.

## Benefits

1. **Type Safety**: Result type makes error handling explicit
2. **Consistency**: All errors follow the same pattern
3. **Testability**: Error paths are easily testable
4. **Maintainability**: Clear separation of concerns
5. **Reliability**: No unexpected exceptions bubble up

This rule ensures robust error handling throughout the Apex Unified Suite, making the system more predictable and maintainable.

---

## Focus Restoration Rules

**File:** `.windsurf/rules/focus-restoration.md`

---
trigger: always_on
---



Ensure proper focus management for accessibility:

<!-- SECTION: focus_restoration -->

<focus_restoration>

- After closing any modal/drawer, return focus to the element that triggered it
- Store the trigger element ref in Zustand before opening modal/drawer
- Restore focus on close using the stored ref
- Use React.useRef to capture the trigger element

</focus_restoration>

<!-- ENDSECTION: focus_restoration -->

<!-- SECTION: implementation -->

<implementation>

```typescript
// In uiStore or similar
interface UIState {
  focusTriggerRef: React.RefObject<HTMLElement> | null;
  setFocusTriggerRef: (ref: React.RefObject<HTMLElement>) => void;
}

// When opening modal
const triggerRef = React.useRef<HTMLElement>(null);
setFocusTriggerRef(triggerRef);

// When closing modal
if (focusTriggerRef?.current) {
  focusTriggerRef.current.focus();
}
```

</implementation>

<!-- ENDSECTION: implementation -->

<!-- SECTION: accessibility -->

<accessibility>

- This is required for WCAG 2.2 AA compliance
- Prevents focus loss for keyboard users
- Ensures predictable navigation flow

</accessibility>

<!-- ENDSECTION: accessibility -->

---

## Frontend API Integration Rules

**File:** `.windsurf/rules/frontend-api-integration.md`

---
trigger: glob
globs: artifacts/apex-os/src/pages/**/*.tsx
---



## React Query Usage

- Import React Query hooks from `@workspace/api-client-react`
- Use generated hooks, never manual fetch calls
- Handle loading states with `isLoading` from hooks
- Handle error states with `error` from hooks
- Implement proper error boundaries around page components
- Use optimistic updates for mutations where appropriate
- Never import from `mockData.ts` in production code

## Data Fetching Patterns

```typescript
// Correct pattern
const { data: contacts, isLoading, error } = useContactsQuery({
  page: currentPage,
  search: searchTerm,
});

// Loading state
if (isLoading) return <ContactListSkeleton />;

// Error state  
if (error) return <ErrorMessage error={error} />;

// Success state
return <ContactList contacts={contacts || []} />;
```

## Mutation Patterns

- Use generated mutation hooks from `@workspace/api-client-react`
- Include success/error handling with `onSuccess`/`onError`
- Use `onMutate` for optimistic updates
- Invalidate related queries after successful mutations
- Show user feedback with toast notifications
- Handle loading states during mutations

## Error Handling

- Wrap pages in ErrorBoundary components
- Show user-friendly error messages
- Include retry mechanisms for failed requests
- Log errors appropriately for debugging
- Handle network errors gracefully
- Provide fallback UI for failed states

## Loading States

- Use Skeleton components for initial loading
- Show loading indicators for data mutations
- Implement progressive loading for large datasets
- Use shimmer effects for better UX
- Avoid blocking UI during data fetching
- Show loading states for form submissions

## Pagination Implementation

- Use `usePaginatedData` hook for list endpoints
- Implement proper pagination controls
- Maintain page state in URL parameters
- Handle empty states gracefully
- Show total count and page information
- Support infinite scroll when appropriate

## Search and Filtering

- Debounce search inputs (300ms delay)
- Update URL parameters for shareable links
- Clear search when navigating away
- Support multiple filter criteria
- Show search loading states
- Handle search result highlighting

## Form Integration

- Use React Hook Form with Zod resolvers
- Validate forms with generated schemas
- Handle form submission with mutations
- Show loading states during submission
- Reset forms after successful submission
- Include proper error messages for validation

## State Management

- Use React Query for server state
- Use local state for UI state only
- Avoid global state for component-specific data
- Use Context API for authentication/user data
- Implement proper cache invalidation
- Use optimistic updates for better UX

## Performance Optimization

- Implement React.memo for expensive components
- Use useMemo/useCallback appropriately
- Lazy load routes with React.lazy()
- Implement virtual scrolling for large lists
- Use proper dependency arrays
- Avoid unnecessary re-renders

## Code Organization

- Keep API logic separate from UI components
- Use custom hooks for complex data operations
- Group related queries together
- Use consistent naming conventions
- Implement proper TypeScript types
- Keep components focused and reusable

## Testing Requirements

- Test components with React Testing Library
- Mock API calls in unit tests
- Test loading and error states
- Test user interactions and mutations
- Include integration tests for data flows
- Test error boundary behavior

## Security Considerations

- Never expose sensitive data in client-side code
- Use proper authentication token management
- Implement proper logout functionality
- Handle token expiration gracefully
- Validate data on client and server
- Use HTTPS in production

## Accessibility Requirements

- Include proper ARIA labels for dynamic content
- Implement keyboard navigation
- Provide screen reader support for loading states
- Use semantic HTML elements
- Include focus management for modals
- Test with accessibility tools

## Development Workflow

1. Replace mock data imports with React Query hooks
2. Add proper loading and error states
3. Implement optimistic updates for mutations
4. Add proper error boundaries
5. Test with various data scenarios
6. Update TypeScript types if needed
7. Run typecheck to validate integration

## Migration from Mock Data

- Remove imports from `mockData.ts`
- Add React Query hooks for data fetching
- Update component props to handle async data
- Add loading skeleton components
- Implement error handling and retry logic
- Test with real API endpoints
- Update documentation and comments

---

## Idempotency Key Pattern Rule

**File:** `.windsurf/rules/idempotency-key-pattern.md`

---
trigger: model_decision
---



## Core Requirement
Finance payments and external calls require an idempotency key with a separate `idempotency_records` table to prevent duplicate operations and ensure exactly-once processing.

## Pattern Enforcement

### Database Schema Pattern

```typescript
// ✅ CORRECT - Idempotency records table
export const idempotencyRecords = pgTable('idempotency_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  operationType: text('operation_type').notNull(), // 'payment', 'refund', 'external_call'
  operationId: text('operation_id').notNull(), // Payment ID, refund ID, etc.
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  requestPayload: json('request_payload'),
  responsePayload: json('response_payload'),
  errorMessage: text('error_message'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fast lookups
  keyIdx: pgIndex('idempotency_key_idx').on(table.key),
  operationIdx: pgIndex('idempotency_operation_idx').on(table.operationType, table.operationId),
  statusIdx: pgIndex('idempotency_status_idx').on(table.status),
  // TTL index for cleanup
  expiresAtIdx: pgIndex('idempotency_expires_idx').on(table.expiresAt),
}));

// ✅ CORRECT - Payment table with idempotency reference
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  userId: uuid('user_id').notNull(),
  method: text('method').notNull(), // 'credit_card', 'bank_transfer', 'ach'
  externalId: text('external_id'), // Payment processor ID
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  idempotencyKeyIdx: pgIndex('payments_idempotency_key_idx').on(table.idempotencyKey),
  userIdIdx: pgIndex('payments_user_idx').on(table.userId),
  statusIdx: pgIndex('payments_status_idx').on(table.status),
}));

// ❌ INCORRECT - No idempotency handling
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('pending'),
  userId: uuid('user_id').notNull(),
  // Missing idempotency_key
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Idempotency Service Pattern

```typescript
// ✅ CORRECT - Idempotency service
export class IdempotencyService {
  constructor(private db: DrizzleDB) {}

  async checkAndLock<T>(
    key: string,
    operationType: string,
    operationId: string,
    ttlMinutes: number = 60
  ): Promise<Result<{ exists: boolean; record?: IdempotencyRecord }, DomainError>> {
    try {
      // Check if key already exists
      const existing = await this.db
        .select()
        .from(idempotencyRecords)
        .where(eq(idempotencyRecords.key, key))
        .limit(1);

      if (existing.length > 0) {
        const record = existing[0];
        
        // Check if expired
        if (record.expiresAt < new Date()) {
          // Clean up expired record
          await this.db
            .delete(idempotencyRecords)
            .where(eq(idempotencyRecords.key, key));
          
          return ok({ exists: false });
        }

        return ok({ exists: true, record });
      }

      // Create new idempotency record
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
      
      const [record] = await this.db
        .insert(idempotencyRecords)
        .values({
          key,
          operationType,
          operationId,
          status: 'processing',
          expiresAt,
        })
        .returning();

      return ok({ exists: false, record });
    } catch (error) {
      console.error('Error checking idempotency:', error);
      return err(new DomainError('IDEMPOTENCY_ERROR', 'Failed to check idempotency key'));
    }
  }

  async updateStatus(
    key: string,
    status: 'completed' | 'failed',
    responsePayload?: any,
    errorMessage?: string
  ): Promise<Result<void, DomainError>> {
    try {
      await this.db
        .update(idempotencyRecords)
        .set({
          status,
          responsePayload: responsePayload ? JSON.stringify(responsePayload) : null,
          errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(idempotencyRecords.key, key));

      return ok(undefined);
    } catch (error) {
      console.error('Error updating idempotency status:', error);
      return err(new DomainError('IDEMPOTENCY_ERROR', 'Failed to update idempotency status'));
    }
  }

  async getRecord(key: string): Promise<IdempotencyRecord | null> {
    const records = await this.db
      .select()
      .from(idempotencyRecords)
      .where(eq(idempotencyRecords.key, key))
      .limit(1);

    return records[0] || null;
  }

  async cleanupExpired(): Promise<void> {
    await this.db
      .delete(idempotencyRecords)
      .where(lt(idempotencyRecords.expiresAt, new Date()));
  }
}
```

### Payment Service with Idempotency

```typescript
// ✅ CORRECT - Payment service with idempotency
export class PaymentService {
  constructor(
    private paymentRepository: PaymentRepository,
    private idempotencyService: IdempotencyService,
    private externalPaymentProvider: ExternalPaymentProvider
  ) {}

  async createPayment(
    data: CreatePaymentData,
    idempotencyKey: string
  ): Promise<Result<Payment, DomainError>> {
    // Check idempotency
    const idempotencyCheck = await this.idempotencyService.checkAndLock(
      idempotencyKey,
      'payment',
      `payment_${Date.now()}_${Math.random()}`
    );

    if (idempotencyCheck.isErr()) {
      return err(idempotencyCheck.error);
    }

    const { exists, record } = idempotencyCheck.value;

    if (exists && record) {
      // Return existing result if completed
      if (record.status === 'completed' && record.responsePayload) {
        const existingPayment = await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existingPayment) {
          return ok(existingPayment);
        }
      }

      // Return error if failed
      if (record.status === 'failed') {
        return err(new DomainError('PAYMENT_FAILED', record.errorMessage || 'Payment failed'));
      }

      // Return conflict if still processing
      return err(new DomainError('PAYMENT_PROCESSING', 'Payment is already being processed'));
    }

    try {
      // Create payment record
      const payment = await this.paymentRepository.create({
        ...data,
        idempotencyKey,
        status: 'pending',
      });

      // Process payment with external provider
      const externalResult = await this.externalPaymentProvider.processPayment({
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        metadata: data.metadata,
        referenceId: payment.id,
      });

      if (externalResult.success) {
        // Update payment status
        await this.paymentRepository.update(payment.id, {
          status: 'completed',
          externalId: externalResult.transactionId,
        });

        // Update idempotency record
        await this.idempotencyService.updateStatus(
          idempotencyKey,
          'completed',
          externalResult
        );

        return ok(payment);
      } else {
        // Update payment status
        await this.paymentRepository.update(payment.id, {
          status: 'failed',
        });

        // Update idempotency record
        await this.idempotencyService.updateStatus(
          idempotencyKey,
          'failed',
          undefined,
          externalResult.error
        );

        return err(new DomainError('PAYMENT_FAILED', externalResult.error));
      }
    } catch (error) {
      // Update idempotency record on error
      await this.idempotencyService.updateStatus(
        idempotencyKey,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return err(new DomainError('PAYMENT_ERROR', 'Failed to process payment'));
    }
  }

  async getPayment(idempotencyKey: string): Promise<Result<Payment | null, DomainError>> {
    const idempotencyRecord = await this.idempotencyService.getRecord(idempotencyKey);
    
    if (!idempotencyRecord) {
      return ok(null);
    }

    const payment = await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
    return ok(payment);
  }
}

// ❌ INCORRECT - Payment service without idempotency
export class PaymentService {
  async createPayment(data: CreatePaymentData): Promise<Result<Payment, DomainError>> {
    // No idempotency check - can create duplicate payments
    const payment = await this.paymentRepository.create({
      ...data,
      status: 'pending',
    });

    const externalResult = await this.externalPaymentProvider.processPayment(data);
    
    if (externalResult.success) {
      await this.paymentRepository.update(payment.id, {
        status: 'completed',
        externalId: externalResult.transactionId,
      });
      return ok(payment);
    } else {
      await this.paymentRepository.update(payment.id, { status: 'failed' });
      return err(new DomainError('PAYMENT_FAILED', externalResult.error));
    }
  }
}
```

### API Route with Idempotency

```typescript
// ✅ CORRECT - API route with idempotency handling
router.post('/payments', async (req, res, next) => {
  const idempotencyKey = req.get('Idempotency-Key');
  
  if (!idempotencyKey) {
    return next(new ValidationError('idempotency_key', 'Idempotency-Key header is required'));
  }

  const validation = createPaymentSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }

  const result = await paymentService.createPayment(validation.data, idempotencyKey);
  
  if (result.isErr()) {
    if (result.error.code === 'PAYMENT_PROCESSING') {
      return res.status(409).json({
        error: result.error.message,
        code: result.error.code,
      });
    }
    
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

// ✅ CORRECT - GET payment by idempotency key
router.get('/payments/by-idempotency/:key', async (req, res, next) => {
  const result = await paymentService.getPayment(req.params.key);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  if (!result.value) {
    return res.status(404).json({
      error: 'Payment not found',
    });
  }
  
  res.json(result.value);
});
```

### External Call Idempotency

```typescript
// ✅ CORRECT - External API calls with idempotency
export class ExternalAPIService {
  constructor(
    private idempotencyService: IdempotencyService,
    private httpClient: HttpClient
  ) {}

  async makeIdempotentCall<T>(
    endpoint: string,
    data: any,
    idempotencyKey: string,
    options?: RequestOptions
  ): Promise<Result<T, DomainError>> {
    // Check idempotency
    const idempotencyCheck = await this.idempotencyService.checkAndLock(
      idempotencyKey,
      'external_call',
      `${endpoint}_${Date.now()}`
    );

    if (idempotencyCheck.isErr()) {
      return err(idempotencyCheck.error);
    }

    const { exists, record } = idempotencyCheck.value;

    if (exists && record) {
      if (record.status === 'completed' && record.responsePayload) {
        return ok(JSON.parse(record.responsePayload));
      }

      if (record.status === 'failed') {
        return err(new DomainError('EXTERNAL_CALL_FAILED', record.errorMessage || 'External call failed'));
      }

      return err(new DomainError('EXTERNAL_CALL_PROCESSING', 'Call is already being processed'));
    }

    try {
      const response = await this.httpClient.post(endpoint, data, options);
      
      // Update idempotency record
      await this.idempotencyService.updateStatus(
        idempotencyKey,
        'completed',
        response.data
      );

      return ok(response.data);
    } catch (error) {
      // Update idempotency record
      await this.idempotencyService.updateStatus(
        idempotencyKey,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return err(new DomainError('EXTERNAL_CALL_ERROR', 'Failed to make external call'));
    }
  }
}
```

## Idempotency Key Generation

### Client-Side Key Generation

```typescript
// ✅ CORRECT - Client generates idempotency keys
export class IdempotencyKeyGenerator {
  static generate(operationType: string, userId?: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const userSuffix = userId ? `_${userId}` : '';
    
    return `${operationType}_${timestamp}_${random}${userSuffix}`;
  }

  static validate(key: string): boolean {
    // Basic validation - at least 20 characters, contains timestamp
    return key.length >= 20 && /\d{13}/.test(key);
  }
}

// Frontend usage
class PaymentAPI {
  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    const idempotencyKey = IdempotencyKeyGenerator.generate('payment', currentUser.id);
    
    const response = await fetch('/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Payment failed');
    }

    return response.json();
  }

  async retryPayment(paymentData: CreatePaymentData, originalKey: string): Promise<Payment> {
    // Use same idempotency key for retry
    const response = await fetch('/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': originalKey,
      },
      body: JSON.stringify(paymentData),
    });

    return response.json();
  }
}
```

## Testing Requirements

### Unit Tests

```typescript
describe('PaymentService', () => {
  describe('idempotency', () => {
    it('should prevent duplicate payments with same key', async () => {
      const paymentData = {
        amount: 100,
        currency: 'USD',
        userId: 'user-123',
        method: 'credit_card',
      };
      const idempotencyKey = 'test-key-123';

      // First call should succeed
      const result1 = await paymentService.createPayment(paymentData, idempotencyKey);
      expect(result1.isOk()).toBe(true);

      // Second call with same key should return existing result
      const result2 = await paymentService.createPayment(paymentData, idempotencyKey);
      expect(result2.isOk()).toBe(true);
      expect(result2.value.id).toBe(result1.value.id);
    });

    it('should handle processing status correctly', async () => {
      // Mock idempotency service to return processing status
      idempotencyService.checkAndLock = jest.fn().mockResolvedValue(ok({
        exists: true,
        record: { status: 'processing' }
      }));

      const result = await paymentService.createPayment(paymentData, 'key-123');
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('PAYMENT_PROCESSING');
    });

    it('should return failed result for failed payments', async () => {
      // Mock failed payment
      idempotencyService.checkAndLock = jest.fn().mockResolvedValue(ok({
        exists: true,
        record: { 
          status: 'failed',
          errorMessage: 'Payment declined'
        }
      }));

      const result = await paymentService.createPayment(paymentData, 'key-123');
      
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('PAYMENT_FAILED');
    });
  });
});
```

### Integration Tests

```typescript
describe('POST /payments', () => {
  it('should require idempotency key', async () => {
    const response = await request(app)
      .post('/api/v1/payments')
      .send({
        amount: 100,
        currency: 'USD',
        userId: 'user-123',
        method: 'credit_card',
      })
      .expect(400);

    expect(response.body.error).toContain('Idempotency-Key');
  });

  it('should handle duplicate requests with same key', async () => {
    const paymentData = {
      amount: 100,
      currency: 'USD',
      userId: 'user-123',
      method: 'credit_card',
    };
    const idempotencyKey = 'test-key-123';

    // First request
    const response1 = await request(app)
      .post('/api/v1/payments')
      .set('Idempotency-Key', idempotencyKey)
      .send(paymentData)
      .expect(201);

    // Second request with same key
    const response2 = await request(app)
      .post('/api/v1/payments')
      .set('Idempotency-Key', idempotencyKey)
      .send(paymentData)
      .expect(201);

    expect(response2.body.id).toBe(response1.body.id);
  });
});
```

## Common Violations and Fixes

### Missing Idempotency Key

**Violation**: No idempotency handling
```typescript
// ❌ WRONG
router.post('/payments', async (req, res, next) => {
  const result = await paymentService.createPayment(req.body);
  // Can create duplicate payments
});
```

**Fix**: Add idempotency key requirement
```typescript
// ✅ CORRECT
router.post('/payments', async (req, res, next) => {
  const idempotencyKey = req.get('Idempotency-Key');
  if (!idempotencyKey) {
    return next(new ValidationError('idempotency_key', 'Idempotency-Key required'));
  }
  
  const result = await paymentService.createPayment(req.body, idempotencyKey);
});
```

### No Idempotency Records Table

**Violation**: No tracking table
```typescript
// ❌ WRONG - No idempotency tracking
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey(),
  amount: numeric('amount').notNull(),
  // Missing idempotency tracking
});
```

**Fix**: Add idempotency records table
```typescript
// ✅ CORRECT
export const idempotencyRecords = pgTable('idempotency_records', {
  id: uuid('id').primaryKey(),
  key: text('key').notNull().unique(),
  operationType: text('operation_type').notNull(),
  status: text('status').notNull(),
  // ... other fields
});
```

### Race Conditions

**Violation**: No atomic operations
```typescript
// ❌ WRONG - Race condition possible
async createPayment(data, key) {
  const existing = await this.findByKey(key);
  if (existing) {
    return existing;
  }
  // Another request could create here
  return await this.create(data);
}
```

**Fix**: Use database-level locking
```typescript
// ✅ CORRECT - Atomic operation
async createPayment(data, key) {
  return await this.db.transaction(async (tx) => {
    const existing = await tx.select().from(idempotencyRecords)
      .where(eq(idempotencyRecords.key, key))
      .forUpdate();
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    return await tx.insert(idempotencyRecords).values({...}).returning();
  });
}
```

## Benefits

1. **Exactly-Once Processing**: Prevents duplicate operations
2. **Client Retries**: Safe retry mechanisms for network failures
3. **Financial Safety**: Prevents double charges and payments
4. **Audit Trail**: Complete record of all operations
5. **API Reliability**: Robust handling of network issues

This rule ensures financial operations and external calls are safe from duplication, providing exactly-once semantics critical for financial transactions.

---

## Invoice Status Transitions Rule

**File:** `.windsurf/rules/invoice-status-transitions.md`

---
trigger: model_decision
description: Defines valid status transitions: draft → sent → paid, draft → void, sent → overdue, etc. Any other transition must be rejected with InvalidInvoiceStatusTransition.
---



## Purpose

Enforce strict invoice status transition rules to maintain financial data integrity. Only predefined status transitions are allowed, and any invalid transition must result in an `InvalidInvoiceStatusTransition` error.

## Allowed Status Transitions

### Accounts Receivable (AR) Invoices

**Valid transitions:**
- `draft` → `sent`
- `draft` → `void`
- `sent` → `paid`
- `sent` → `overdue`
- `sent` → `void`
- `overdue` → `paid`
- `overdue` → `void`
- `paid` → `void` (with reversal)
- `void` → `draft` (with reversal)

### Accounts Payable (AP) Invoices

**Valid transitions:**
- `draft` → `sent`
- `draft` → `void`
- `sent` → `paid`
- `sent` → `void`
- `paid` → `void` (with reversal)

### Terminal States

**Final states (no further transitions allowed):**
- `paid`
- `void`

## Implementation Requirements

### Service Layer Validation

```typescript
// src/services/InvoiceService.ts
export class InvoiceService {
  constructor(private db: Database) {}

  async updateInvoiceStatus(
    invoiceId: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string,
    reason?: string
  ): Promise<Invoice> {
    return await this.db.transaction(async (tx) => {
      // Get current invoice
      const currentInvoice = await tx
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.tenant_id, tenantId)
        ))
        .limit(1);

      if (!currentInvoice[0]) {
        throw new InvoiceNotFoundError('Invoice not found');
      }

      const currentStatus = currentInvoice[0].status;
      const invoiceType = currentInvoice[0].invoice_type;

      // Validate status transition
      this.validateStatusTransition(
        invoiceType,
        currentStatus,
        newStatus
      );

      // Update invoice status
      const updatedInvoice = await tx
        .update(invoices)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedBy,
          // Set specific timestamps for certain transitions
          ...(newStatus === 'sent' && { sentAt: new Date() }),
          ...(newStatus === 'paid' && { paidAt: new Date(), lastPaymentDate: new Date() }),
          ...(newStatus === 'overdue' && { becameOverdueAt: new Date() }),
          ...(newStatus === 'void' && { voidedAt: new Date(), voidReason: reason })
        })
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.tenant_id, tenantId)
        ))
        .returning();

      // Handle side effects for specific transitions
      await this.handleStatusTransitionEffects(
        tx,
        updatedInvoice[0],
        currentStatus,
        newStatus,
        tenantId,
        updatedBy
      );

      // Emit domain event
      await this.emitEvent('InvoiceStatusChanged', {
        invoiceId,
        invoiceType,
        previousStatus: currentStatus,
        newStatus,
        updatedBy,
        reason
      });

      return updatedInvoice[0];
    });
  }

  private validateStatusTransition(
    invoiceType: string,
    currentStatus: string,
    newStatus: string
  ): void {
    const validTransitions = this.getValidTransitions(invoiceType);
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new InvalidInvoiceStatusTransitionError(
        `Invalid invoice status transition: ${currentStatus} → ${newStatus} for ${invoiceType} invoice`
      );
    }
  }

  private getValidTransitions(invoiceType: string): Record<string, string[]> {
    const arTransitions = {
      'draft': ['sent', 'void'],
      'sent': ['paid', 'overdue', 'void'],
      'overdue': ['paid', 'void'],
      'paid': ['void'],
      'void': ['draft'] // With reversal capability
    };

    const apTransitions = {
      'draft': ['sent', 'void'],
      'sent': ['paid', 'void'],
      'paid': ['void'], // With reversal capability
      'void': ['draft'] // With reversal capability
    };

    return invoiceType === 'ar' ? arTransitions : apTransitions;
  }

  private async handleStatusTransitionEffects(
    tx: Database,
    invoice: Invoice,
    previousStatus: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string
  ): Promise<void> {
    // Handle payment allocation when invoice is marked as paid
    if (newStatus === 'paid' && previousStatus !== 'paid') {
      await this.processPaymentCompletion(tx, invoice, tenantId);
    }

    // Update client financial metrics
    if (['sent', 'paid', 'overdue'].includes(newStatus)) {
      await this.updateClientFinancialMetrics(
        tx,
        invoice.client_id,
        tenantId
      );
    }

    // Send notifications for specific transitions
    if (newStatus === 'sent' && previousStatus === 'draft') {
      await this.sendInvoiceNotification(tx, invoice, 'invoice_sent');
    } else if (newStatus === 'overdue') {
      await this.sendInvoiceNotification(tx, invoice, 'invoice_overdue');
    } else if (newStatus === 'paid') {
      await this.sendInvoiceNotification(tx, invoice, 'invoice_paid');
    }
  }

  private async processPaymentCompletion(
    tx: Database,
    invoice: Invoice,
    tenantId: string
  ): Promise<void> {
    // Update related payment records
    await tx
      .update(payments)
      .set({
        status: 'completed',
        completedAt: new Date()
      })
      .where(and(
        eq(payments.invoice_id, invoice.id),
        eq(payments.tenant_id, tenantId),
        eq(payments.status, 'processing')
      ));

    // Update project financial metrics if applicable
    if (invoice.project_id) {
      await this.updateProjectFinancialMetrics(
        tx,
        invoice.project_id,
        tenantId
      );
    }
  }

  private async updateClientFinancialMetrics(
    client: string,
    tenantId: string
  ): Promise<void> {
    // Update client's total outstanding, paid amounts, etc.
    const metrics = await this.db
      .select({
        totalInvoiced: sql<number>`SUM(CASE WHEN status IN ('sent', 'overdue') THEN amount ELSE 0 END)`,
        totalPaid: sql<number>`SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)`,
        totalOverdue: sql<number>`SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.client_id, client),
        eq(invoices.tenant_id, tenantId),
        eq(invoices.is_active, true)
      ));

    await this.db
      .update(clients)
      .set({
        totalInvoiced: metrics[0]?.totalInvoiced || 0,
        totalPaid: metrics[0]?.totalPaid || 0,
        totalOverdue: metrics[0]?.totalOverdue || 0,
        updatedAt: new Date()
      })
      .where(eq(clients.id, client));
  }

  private async updateProjectFinancialMetrics(
    project: string,
    tenantId: string
  ): Promise<void> {
    // Update project's financial metrics
    const metrics = await this.db
      .select({
        totalInvoiced: sql<number>`SUM(CASE WHEN status IN ('sent', 'overdue') THEN amount ELSE 0 END)`,
        totalPaid: sql<number>`SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)`,
        totalOverdue: sql<number>`SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.project_id, project),
        eq(invoices.tenant_id, tenantId),
        eq(invoices.is_active, true)
      ));

    await this.db
      .update(projects)
      .set({
        totalInvoiced: metrics[0]?.totalInvoiced || 0,
        totalPaid: metrics[0]?.totalPaid || 0,
        totalOverdue: metrics[0]?.totalOverdue || 0,
        updatedAt: new Date()
      })
      .where(eq(projects.id, project));
  }

  private async sendInvoiceNotification(
    tx: Database,
    invoice: Invoice,
    notificationType: string
  ): Promise<void> {
    // Create notification record
    await tx.insert(notifications).values({
      tenantId: invoice.tenant_id,
      clientId: invoice.client_id,
      type: 'invoice',
      title: `Invoice ${notificationType}`,
      message: `Invoice #${invoice.invoice_number} ${notificationType.replace('_', ' ')}`,
      entityId: invoice.id,
      entityType: 'invoice',
      status: 'pending',
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.total_amount,
        dueDate: invoice.due_date
      },
      createdAt: new Date(),
      scheduledFor: new Date()
    });
  }
}
```

### Domain Error Classes

```typescript
export class InvalidInvoiceStatusTransitionError extends DomainError {
  constructor(
    message: string,
    public readonly details: {
      invoiceId: string;
      invoiceType: string;
      currentStatus: string;
      newStatus: string;
      validTransitions: string[];
    }
  ) {
    super('INVALID_INVOICE_STATUS_TRANSITION', message, details);
  }
}

export class InvoiceNotFoundError extends DomainError {
  constructor(invoiceId: string) {
    super('INVOICE_NOT_FOUND', `Invoice not found: ${invoiceId}`);
  }
}
```

### API Layer Implementation

```typescript
// src/routes/invoices.ts
router.patch('/:id/status', validateRequest(updateStatusSchema), async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    
    const invoice = await invoiceService.updateInvoiceStatus(
      req.params.id,
      status,
      req.tenant.id,
      req.user.id,
      reason
    );

    res.json({ invoice });
  } catch (error) {
    if (error instanceof InvalidInvoiceStatusTransitionError) {
      return res.status(422).json({
        error: error.message,
        code: error.code,
        details: {
          invoiceId: error.details.invoiceId,
          invoiceType: error.details.invoiceType,
          currentStatus: error.details.currentStatus,
          newStatus: error.details.newStatus,
          validTransitions: error.details.validTransitions
        },
        suggestions: [
          'Check the current invoice status',
          'Verify the intended status transition',
          'Contact support for status clarification'
        ],
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});

// GET /api/invoices/:id/transitions
router.get('/:id/transitions', async (req, res, next) => {
  try {
    const invoice = await invoiceService.findById(req.params.id, req.tenant.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const validTransitions = invoiceService.getValidTransitions(invoice.invoice_type);
    
    res.json({
      currentStatus: invoice.status,
      validTransitions,
      canVoid: invoice.status !== 'void',
      canReverse: invoice.status !== 'draft'
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for invoice status management
export const InvoiceStatusManager: ReactFC<{ invoice: Invoice }> = ({ invoice }) => {
  const [updating, setUpdating] = useState(false);
  const [availableTransitions, setAvailableTransitions] = useState<string[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    // Load available transitions
    loadAvailableTransitions();
  }, [invoice.id]);

  const loadAvailableTransitions = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/transitions`);
      const data = await response.json();
      setAvailableTransitions(data.validTransitions);
    } catch (error) {
      console.error('Failed to load transitions:', error);
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    setStatusError(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        onStatusUpdated(updatedInvoice);
        await loadAvailableTransitions(); // Refresh transitions
      }
    } catch (error) {
      if (error instanceof ResponseError && error.status === 422) {
        const errorData = await error.response.json();
        setStatusError(errorData.error);
      } else {
        setStatusError('Failed to update invoice status');
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      draft: 'gray',
      sent: 'blue',
      paid: 'green',
      overdue: 'red',
      void: 'black'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusIcon = (status: string): string => {
    const icons = {
      draft: 'file-text',
      sent: 'send',
      paid: 'check-circle',
      overdue: 'alert-triangle',
      void: 'x-circle'
    };
    return icons[status as keyof typeof icons] || 'file-text';
  };

  return (
    <div className="invoice-status-manager">
      <div className="status-display">
        <span className={`status-indicator ${getStatusColor(invoice.status)}`}>
          {getStatusIcon(invoice.status)}
        </span>
        <span className="status-text">{invoice.status.toUpperCase()}</span>
      </div>

      <div className="status-actions">
        <StatusDropdown
          currentStatus={invoice.status}
          availableTransitions={availableTransitions}
          onStatusChange={handleStatusChange}
          disabled={updating}
        />
      </div>

      {statusError && (
        <div className="error-message">
          {statusError}
        </div>
      )}

      {updating && (
        <div className="updating-indicator">
          Updating...
        </div>
      )}
    </div>
  );
};

// Status dropdown component
const StatusDropdown: React.FC<{
  currentStatus: string;
  availableTransitions: string[];
  onStatusChange: (status: string, reason?: string) => void;
  disabled: boolean;
}> = ({ 
  currentStatus, 
  availableTransitions, 
  onStatusChange, 
  disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown open={isOpen} onOpenChange={setIsOpen}>
      <DropdownTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {currentStatus.toUpperCase()} <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end">
        {availableTransitions.map(status => (
          <DropdownItem
            key={status}
            onClick={() => {
              onStatusChange(status);
              setIsOpen(false);
            }}
          >
            {status.toUpperCase()}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
};
```

### Database Schema Constraints

```sql
-- Invoices table with status constraints
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number VARCHAR(50) NOT NULL,
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('ar', 'ap')),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'paid', 'overdue', 'void')
  ),
  
  -- Timestamps for status transitions
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  became_overdue_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  
  metadata JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Unique constraint for invoice numbers
CREATE UNIQUE INDEX idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);

-- Indexes for status queries
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_project ON invoices(project_id);

-- Check constraint for status transitions
CREATE OR REPLACE FUNCTION validate_invoice_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the old and new status
  DECLARE old_status TEXT;
  DECLARE new_status TEXT;
  DECLARE invoice_type TEXT;
  
  SELECT status INTO old_status FROM invoices WHERE id = NEW.id;
  SELECT invoice_type INTO invoice_type FROM invoices WHERE id = NEW.id;
  SELECT NEW.status INTO new_status;
  
  -- Check if transition is valid
  IF NOT EXISTS (
    SELECT 1 FROM valid_transitions 
    WHERE invoice_type = invoice_type 
      AND current_status = old_status 
      AND next_status = new_status
  ) THEN
    RAISE EXCEPTION 'Invalid invoice status transition: % → %', old_status, new_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_invoice_status_transition
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION validate_invoice_status_transition();
```

## Testing Requirements

### Unit Tests

**Test status transition validation:**

```typescript
describe('Invoice Status Transitions', () => {
  test('should allow valid AR transitions', async () => {
    const invoice = await createInvoice({ status: 'draft', invoice_type: 'ar' });
    
    // draft → sent
    const updated = await invoiceService.updateInvoiceStatus(
      invoice.id,
      'sent',
      tenantId,
      userId
    );
    expect(updated.status).toBe('sent');
    
    // sent → paid
    const paid = await invoiceService.updateInvoiceStatus(
      invoice.id,
      'paid',
      tenantId,
      userId
    );
    expect(paid.status).toBe('paid');
  });

  test('should reject invalid transitions', async () => {
    const invoice = await createInvoice({ status: 'sent', invoice_type: 'ar' });
    
    // sent → draft (invalid)
    await expect(
      invoiceService.updateInvoiceStatus(invoice.id, 'draft', tenantId, userId)
    ).rejects.toThrow(InvalidInvoiceStatusTransitionError);
    
    // paid → sent (invalid)
    await expect(
      invoiceService.updateInvoiceStatus(invoice.id, 'sent', tenantId, userId)
    ).rejects.toThrow(InvalidInvoiceStatusTransitionError);
  });

  test('should allow void → draft reversal with proper permissions', async () => {
    const invoice = await createInvoice({ status: 'void', invoice_type: 'ar' });
    
    const updated = await invoiceService.updateInvoiceStatus(
      invoice.id,
      'draft',
      tenantId,
      userId,
      'Reversal requested'
    );
    expect(updated.status).toBe('draft');
  });
});
```

### Integration Tests

**Test end-to-end status workflows:**

1. **Invoice Lifecycle**: Complete invoice from draft to paid
2. **Payment Processing**: Status updates trigger payment allocation
3. **Notification System**: Proper notifications sent for status changes
4. **Financial Metrics**: Client and project metrics updated correctly

### Edge Cases

**Test these scenarios:**

1. **Concurrent Updates**: Handle simultaneous status changes
2. **Status Reversal**: Reversal permissions and audit trail
3. **Cross-Tenant Access**: Prevent cross-tenant status changes
4. **Database Constraints**: Database enforces transition rules

## Performance Considerations

### Efficient Status Queries

```typescript
// Optimized query for status-based filtering
private async getInvoicesByStatus(
  tenantId: string,
  status: string,
  limit: number = 50
): Promise<Invoice[]> {
  return await this.db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.tenant_id, tenantId),
      eq(invoices.status, status),
      eq(invoices.is_active, true)
    ))
    .orderBy(desc(invoices.created_at))
    .limit(limit);
}
```

### Database Indexes

```sql
-- Optimize status-based queries
CREATE INDEX idx_invoices_status_tenant ON invoices(status, tenant_id);
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX idx_invoices_due_date_status ON invoices(due_date, status);
CREATE INDEX idx_invoices_amount_status ON invoices(total_amount, status);
```

## Enforcement Checklist

- [ ] Status transitions are validated before database update
- [ ] Database constraints prevent invalid transitions
- **[ ] All API endpoints enforce transition rules**
- [ ] Frontend shows only valid transition options
- [ ] Comprehensive test coverage for all transition scenarios
- [ ] Side effects are handled for specific transitions
- [ ] Audit trail tracks all status changes
- [ ] Error handling prevents invalid transitions
- [ ] Performance optimization for status-based queries
- [ **[ ] Database triggers enforce constraints at database level**
- [ ] Client and project metrics updated automatically
- [ ] Notification system triggers for important transitions
- [ ] Status reversal requires proper authorization
- [ ] Cross-tenant isolation is maintained

---

## Keyboard Shortcut Hints Rules

**File:** `.windsurf/rules/keyboard-shortcuts.md`

---
trigger: always_on
---



Display keyboard shortcuts using <kbd> tags:

<!-- SECTION: kbd_usage -->

<kbd_usage>

- Use <kbd> tags for common actions (e.g., ⌘K, Ctrl+K)
- Show on hover or in tooltips
- Format: <kbd class="kbd">⌘K</kbd>
- Style with Tailwind: px-2 py-1 bg-white/10 rounded text-xs font-mono

</kbd_usage>

<!-- ENDSECTION: kbd_usage -->

<!-- SECTION: common_shortcuts -->

<common_shortcuts>

- Command palette: ⌘K / Ctrl+K
- Save: ⌘S / Ctrl+S
- New item: ⌘N / Ctrl+N
- Search: ⌘F / Ctrl+F
- Close modal: Escape

</common_shortcuts>

<!-- ENDSECTION: common_shortcuts -->

<!-- SECTION: styling -->

<styling>

```css
.kbd {
  @apply px-2 py-1 bg-white/10 rounded text-xs font-mono border border-white/10;
}
```

</styling>

<!-- ENDSECTION: styling -->

---

## Markdown Block Editing Rule

**File:** `.windsurf/rules/markdown-block-editing.md`

---
trigger: always_on
---



Prevent structural damage by treating multi-line structures as atomic units.

<!-- SECTION: Core Principle -->

## Core Principle

**NEVER edit single lines inside lists, tables, or code blocks.** Always regenerate entire blocks.

<!-- ENDSECTION: Core Principle -->

<!-- SECTION: Block Types and Requirements -->

## Block Types and Requirements

### Lists
- Include **all items** when editing any item
- Preserve indentation levels exactly
- Maintain blank lines between list items if present

### Tables
- Include **header row, separator row, and all data rows**
- Preserve column alignment markers (`:---`, `:---:`, `---:`)
- Keep consistent column count across all rows

### Code Blocks
- Include opening fence (``` or ~~~) with language identifier
- Include **entire code content** without truncation
- Include closing fence on its own line

## Example Pattern

When asked to fix a typo in a list item:

**WRONG:** Edit just the line with the typo.
**CORRECT:** Regenerate the entire list with the typo fixed.

```markdown
<!-- If this list has a typo in item 2 -->
- First item
- Seond item  (typo here)
- Third item

<!-- Regenerate the entire list -->
- First item
- Second item  (fixed)
- Third item
```

<!-- ENDSECTION: Example Pattern -->

<!-- SECTION: Enforcement -->

## Enforcement

- Before any Markdown edit, identify the block type
- If edit affects a multi-line structure, expand scope to entire block
- Verify output maintains block boundaries

<!-- ENDSECTION: Enforcement -->

---

## Markdown Fence Avoidance Rule

**File:** `.windsurf/rules/markdown-fence-avoidance.md`

---
trigger: always_on
---



Prevent code fence collisions between file content and response formatting.

<!-- SECTION: Problem -->

## Problem

Triple-backtick fences in Markdown files collide with AI response formatting, corrupting edits.

<!-- ENDSECTION: Problem -->

<!-- SECTION: Solutions -->

## Solutions

### 1. Use Alternative Fences in Responses

When file uses backticks (```), use tildes (~~~) in your response fences:

```markdown
<!-- File content uses backticks -->
```typescript
const x = 1;
```

<!-- Your response uses tildes -->
~~~typescript
const y = 2;
~~~
```

### 2. Output Raw Content When Instructed

If user says: *"Output raw, corrected content directly"*

- Do NOT wrap in Markdown code blocks
- Output the corrected text directly
- This prevents fence nesting entirely

### 3. Use Boundary Markers

For complex edits, precede with explicit markers:

```markdown
<!-- REPLACE_START: section-name -->

[corrected content here]

<!-- REPLACE_END: section-name -->
```

### 4. Indentation for Code Blocks

When appropriate, use indented code blocks (4 spaces) instead of fenced:

    This is an indented code block
    It avoids fence collisions entirely

<!-- ENDSECTION: Solutions -->

<!-- SECTION: Response Format Decision Tree -->

## Response Format Decision Tree

1. Does the file contain backtick fences?
   → Use tildes (~~~) in your response

2. Did user request "raw output"?
   → No fences, direct text output

3. Is this a complex multi-part edit?
   → Use HTML comment markers as boundaries

<!-- ENDSECTION: Response Format Decision Tree -->

<!-- SECTION: Anti-Patterns -->

## Anti-Patterns

❌ Nesting backticks inside backticks
❌ Using ```suggestion blocks that collide with file content
❌ Forgetting to escape or alternate fence characters

<!-- ENDSECTION: Anti-Patterns -->

---

## Markdown Link Style Rule

**File:** `.windsurf/rules/markdown-link-style.md`

---
trigger: always_on
---



Prefer self-contained inline links over reference-style to prevent breakage.

<!-- SECTION: Primary Rule -->

## Primary Rule

**Use inline links `[text](url)` whenever possible.**

<!-- ENDSECTION: Primary Rule -->

<!-- SECTION: Rationale -->

## Rationale

Inline links are self-contained. Reference-style links risk broken references when text moves without its definition.

<!-- ENDSECTION: Rationale -->

<!-- SECTION: Patterns -->

## Patterns

### Preferred: Inline Links

```markdown
[Visit Google](https://google.com)

[Read the Docs](https://docs.example.com/guide)
```

### Acceptable: Reference-Style with Proximity Rule

If reference-style must be used, keep definitions **immediately after** the paragraph:

```markdown
Visit [Google](https://google.com) or [Bing](https://bing.com) for search.
```

Or use a dedicated section at end of file:

```markdown
## Footnotes and References

[Link text](https://example.com/1)
[Another link](https://example.com/2)
```

<!-- ENDSECTION: Patterns -->

<!-- SECTION: Reference Label Generation -->

## Reference Label Generation

When creating new reference-style links, use unique dated labels:

```markdown
[Link text](https://example.com/1)
[Another link](https://example.com/2)
```

Format: `ref-YYYY-MM-DD-NN` where NN is sequential.

<!-- ENDSECTION: Reference Label Generation -->

<!-- SECTION: Editing Rules -->

## Editing Rules

1. **Moving link text?** Also move its reference definition
2. **Deleting link?** Also delete its reference definition
3. **Converting inline to reference?** Add definition immediately or to Footnotes section
4. **Converting reference to inline?** Remove the definition

<!-- ENDSECTION: Editing Rules -->

<!-- SECTION: Validation -->

## Validation

After any link edit:

- [ ] All reference definitions have at least one usage
- [ ] All reference usages have a matching definition
- [ ] No orphaned definitions remain

<!-- ENDSECTION: Validation -->

---

## Markdown Whitespace Preservation Rule

**File:** `.windsurf/rules/markdown-whitespace-preservation.md`

---
trigger: always_on
---



Blank lines and indentation are structural. Preserve them exactly.

<!-- SECTION: Critical Rule -->

## Critical Rule

**Preserve ALL existing blank lines and indentation.**

<!-- ENDSECTION: Critical Rule -->

<!-- SECTION: Specific Requirements -->

## Specific Requirements

### Blank Lines
- An empty line must remain an empty line
- Do not join lines currently separated by a blank line
- Do not add blank lines where none existed
- When inserting content, explicitly state where blank lines go

### Indentation
- Preserve existing indentation levels exactly
- Use spaces (not tabs) consistent with the file
- Common indent sizes: 2 spaces, 4 spaces
- Nested structures maintain relative indentation

<!-- ENDSECTION: Specific Requirements -->

<!-- SECTION: Examples -->

## Examples

### Preserving List Separation
```markdown
<!-- BEFORE - Two separate lists -->
- Item A
- Item B

- Item C
- Item D

<!-- AFTER - Still two separate lists -->
- Item A
- Item B

- Item C
- Item D
```

### Insertion with Explicit Blank Lines
When inserting after a heading:
```markdown
# Heading

New paragraph here.  (one blank line between heading and paragraph)
```

<!-- ENDSECTION: Examples -->

<!-- SECTION: Enforcement Checklist -->

## Enforcement Checklist

- [ ] Count blank lines before and after edit - they must match
- [ ] Verify indentation levels unchanged
- [ ] Confirm no lines were inadvertently joined
- [ ] Ensure no spurious blank lines added

<!-- ENDSECTION: Enforcement Checklist -->

---

## Materialized Aggregate Counters Rule

**File:** `.windsurf/rules/materialized-aggregate-counters.md`

---
trigger: model_decision
description: Whenever an aggregate has derived counts (like task_count, progress_percent), they must be updated in the same DB transaction that modifies the parent aggregate. This generalizes the project progress rule.
---



## Purpose

Enforce that materialized aggregate counters (counts, totals, percentages) are updated atomically in the same database transaction that modifies child records. This prevents data inconsistency and ensures aggregate data always reflects the current state of child records.

## Core Requirements

### Atomic Update Pattern

**When child records are modified:**

1. **Same Transaction**: All updates must occur in a single database transaction
2. **Immediate Update**: Aggregate counters updated immediately after child modification
3. **Rollback Safety**: Failed operations roll back both child and aggregate updates
4. **Performance**: Use efficient SQL calculations for aggregate updates

### Required Aggregate Updates

**Common aggregates that must be updated:**

- **Project Task Count**: When tasks are created, deleted, or status changes
- **Project Progress**: When task completion status changes
- **Client Metrics**: When invoices are created, paid, or status changes
- **Document Counts**: When documents are created, deleted, or versioned
- **User Activity Counts**: When users perform actions affecting counts

## Implementation Requirements

### Repository Layer Pattern

```typescript
// src/repositories/ProjectRepository.ts
export class ProjectRepository {
  constructor(
    private db: Database,
    private materializedColumnService: MaterializedColumnService
  ) {}

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
        status: taskData.status || 'todo',
        createdBy
      }).returning();

      const createdTask = task[0];

      // Update project counters in the same transaction
      await this.materializedColumnService.updateCounters(tx, [
        {
          table: 'projects',
          id: taskData.projectId,
          counters: [
            { column: 'task_count', operation: 'increment' },
            { column: 'completed_task_count', operation: taskData.status === 'completed' ? 'increment' : 'no_change' },
            { column: 'progress_percent', operation: 'recalculate' }
          ]
        }
      ]);

      return createdTask;
    });
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string
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
        throw new TaskNotFoundError('Task not found');
      }

      const oldStatus = currentTask[0].status;
      const projectId = currentTask[0].project_id;

      // Update task status
      const updatedTask = await tx
        .update(tasks)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedBy,
          completedAt: newStatus === 'completed' ? new Date() : null
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Update project counters in the same transaction
      await this.materializedColumnService.updateCounters(tx, [
        {
          table: 'projects',
          id: projectId,
          counters: [
            { column: 'completed_task_count', operation: oldStatus === 'completed' ? 'decrement' : 'no_change' },
            { column: 'in_progress_task_count', operation: newStatus === 'in_progress' ? 'increment' : 'no_change' },
            { column: 'todo_task_count', operation: newStatus === 'todo' ? 'increment' : 'no_change' },
            { column: 'progress_percent', operation: 'recalculate' }
          ]
        }
      ]);

      return updatedTask[0];
    });
  }

  async deleteTask(
    taskId: string,
    tenantId: string,
    deletedBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Get task details before deletion
      const task = await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenant_id, tenantId)
        ))
        .limit(1);

      if (!task[0]) {
        throw new TaskNotFoundError('Task not found');
      }

      const projectId = task[0].project_id;
      const taskStatus = task[0].status;

      // Delete the task
      await tx.delete(tasks)
        .where(eq(tasks.id, taskId));

      // Update project counters in the same transaction
      await this.materializedColumnService.updateCounters(tx, [
        {
          table: 'projects',
          id: projectId,
          counters: [
            { column: 'task_count', operation: 'decrement' },
            { column: `${taskStatus}_task_count`, operation: 'decrement' },
            { column: 'progress_percent', operation: 'recalculate' }
          ]
        }
      ]);
    });
  }

  async bulkUpdateTaskStatus(
    taskIds: string[],
    newStatus: string,
    tenantId: string,
    updatedBy: string
  ): Promise<Task[]> {
    return await this.db.transaction(async (tx => {
      // Get all affected projects
      const projectIds = await tx
        .select({ projectId: tasks.project_id })
        .from(tasks)
        .where(and(
          inArray(tasks.id, taskIds),
          eq(tasks.tenant_id, tenantId)
        ))
        .groupBy(tasks.project_id)
        .map(group => group.projectId);

      // Update each project's counters
      for (const { projectId } of projectIds) {
        const affectedTaskCount = await tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(tasks)
          .where(and(
            eq(tasks.project_id, projectId),
            eq(tasks.tenant_id, tenantId),
            sql`${tasks.status} = ${newStatus}`
          ))
          .limit(1);

        await this.materializedService.updateCounters(tx, [
          {
            table: 'projects',
            id: projectId,
            counters: [
              { column: `${newStatus}_task_count`, operation: 'set' },
              { column: 'progress_percent', operation: 'recalculate' }
            ]
          }
        ]);
      }

      // Update all tasks
      await tx
        .update(tasks)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedBy
        })
        .where(and(
          inArray(tasks.id, taskIds),
          eq(tasks.tenant_id, tenantId)
        ));

      // Return updated tasks
      return await tx
        .select()
        .from(tasks)
        .where(and(
          inArray(tasks.id, taskIds),
          eq(tasks.tenant_id, tenantId)
        ))
        .orderBy(tasks.created_at);
    });
  }
}
```

### Materialized Column Service Implementation

```typescript
// src/services/MaterializedColumnService.ts
export class MaterializedColumnService {
  constructor(private db: Database) {}

  async updateCounters(
    tx: Database,
    updates: CounterUpdate[]
  ): Promise<void> {
    for (const update of updates) {
      const { table, id, counters } = update;

      for (const counter of counters) {
        const updateQuery = this.buildUpdateQuery(table, id, counter);
        await tx.execute(sql.raw(updateQuery));
      }
    }
  }

  private buildUpdateQuery(
    table: string,
    id: string,
    counter: CounterField
  ): string {
    const { column, operation, value } = counter;
    
    switch (operation) {
      case 'increment':
        return `UPDATE ${table} SET ${column} = COALESCECE(${column}, 0) + ${value}) WHERE id = ${id}`;
      
      case 'decrement':
        return `UPDATE ${table} SET ${column} = GREATEST(COALESCE(${column}, 0) - ${value}, 0) WHERE id = ${id}`;
      
      case 'set':
        return `UPDATE ${table} SET ${column} = ${value} WHERE id = ${id}`;
      
      case 'recalculate':
        return `UPDATE ${table} SET ${column} = (${this.getRecalculationQuery(table, column)}) WHERE id = ${id}`;
      
      default:
        throw new Error(`Unsupported counter operation: ${operation}`);
    }
  }

  private getRecalculationQuery(table: string, column: string): string {
    const recalcQueries: Record<string, string> = {
      'projects': {
        'task_count': `
          (SELECT COUNT(*) 
           FROM tasks 
           WHERE project_id = projects.id 
             AND tasks.status != 'cancelled'
          )
        `,
        'completed_task_count': `
          (SELECT COUNT(*) 
           FROM tasks 
           WHERE project_id = projects.id 
             AND tasks.status = 'completed'
          )
        `,
        'progress_percent': `
          (SELECT CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
              (SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
          END
          FROM tasks 
          WHERE project_id = projects.id 
            AND tasks.status != 'cancelled'
          )
        `
      },
      'clients': {
        'project_count': `
          (SELECT COUNT(*) 
           FROM projects 
           WHERE client_id = clients.id 
             AND projects.status != 'archived'
          )
        `,
        'active_project_count': `
          (SELECT COUNT(*) 
           FROM projects 
           WHERE client_id = clients.id 
             AND projects.status = 'active'
          )
        `,
        'invoice_count': `
          (SELECT COUNT(*) 
           FROM invoices 
           WHERE client_id = clients.id 
             AND invoices.status IN ('sent', 'overdue', 'paid')
          )
        `,
        'paid_amount': `
          (SELECT COALESCE(SUM(amount), 0) 
           FROM invoices 
           WHERE client_id = clients.id 
             AND invoices.status = 'paid'
          )
        `
      };

    return recalcQueries[table]?.[column] || '';
  }
}
```

### Database Schema Support

```sql
-- Projects table with materialized counters
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Materialized counters
  task_count INTEGER NOT NULL DEFAULT 0,
  completed_task_count INTEGER NOT NULL DEFAULT 0,
  in_progress_task_count INTEGER NOT NULL DEFAULT 0,
  progress_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN task_count = 0 THEN 0
      ELSE ROUND(
        (completed_task_count * 100.0 / task_count, 2
    END
  ) STORED,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Clients table with materialized counters
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Materialized counters
  project_count INTEGER NOT NULL DEFAULT 0,
  active_project_count INTEGER NOT NULL DEFAULT 0,
  invoice_count INTEGER NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_overdue DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for efficient counter updates
CREATE INDEX idx_projects_counters ON projects(id);
CREATE INDEX idx_clients_counters ON clients(id);
CREATE INDEX idx_clients_projects ON clients(id, project_id);
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status);
```

### API Layer Implementation

```typescript
// src/routes/projects.ts
router.patch('/:id/tasks/bulk-update', validateRequest(bulkTaskUpdateSchema), async (req, res, next) => {
  try {
    const { taskIds, status } = req.body;
    
    const updatedTasks = await projectRepository.bulkUpdateTaskStatus(
      taskIds,
      status,
      req.tenant.id,
      req.user.id
    );

    res.json({
      tasks: updatedTasks,
      updatedCount: updatedTasks.length,
      requestedCount: taskIds.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/metrics
router.get('/:id/metrics', async (req, res, next) => {
  try {
    const project = await projectRepository.findById(req.params.id, req.tenant.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      projectId: project.id,
      metrics: {
        taskCount: project.taskCount,
        completedTaskCount: project.completedTaskCount,
        inProgressTaskCount: project.inProgressTaskCount,
        progressPercent: project.progressPercent
      }
    });
  } catch (error) {
    next(error);
  }
});
```

## Testing Requirements

### Unit Tests

**Test atomic counter updates:**

```typescript
describe('Materialized Column Updates', () => {
  test('should update counters atomically in same transaction', async () => {
    const project = await createProject();
    const initialCount = project.taskCount;

    // Add task and verify counter update
    await projectRepository.createTask(
      { projectId: project.id, title: 'New Task' },
      tenantId,
      userId
    );

    const updatedProject = await projectRepository.findById(project.id, tenantId);
    expect(updatedProject.taskCount).toBe(initialCount + 1);
  });

  test('should rollback counter updates on transaction failure', async () => {
    const project = await createProject();
    const initialCount = project.taskCount;

    // Mock database failure on second update
    const mockDb = mockDatabase();
    projectRepository.db = mockDb;

    try {
      await projectRepository.createTask(
        { projectId: project.id, title: 'New Task' },
        tenantId,
        userId
      );
      fail('Database error');
    } catch (error) {
      // Verify original count is unchanged
      const unchangedProject = await projectRepository.findById(project.id, tenantId);
      expect(unchangedProject.taskCount).toBe(initialCount);
    }
  });

  test('should handle multiple counter updates in single transaction', async () => {
    const project = await createProject();
    const taskIds = await createMultipleTasks(project.id, 3);
    
    await projectRepository.bulkUpdateTaskStatus(
      taskIds,
      'completed',
      tenantId,
      userId
    );

    const updatedProject = await projectRepository.findById(project.id, tenantId);
    expect(updatedProject.completedTaskCount).toBe(3);
    expect(updatedProject.progressPercent).toBeCloseTo(100);
  });
});
```

### Integration Tests

**Test end-to-end counter scenarios:**

1. **Task Management**: Complete task lifecycle with counter updates
2. **Project Progress**: Progress calculation accuracy
3. **Client Metrics**: Financial metrics aggregation
4. **Concurrent Operations**: Multiple users modifying same project

### Performance Tests

**Test performance under load:**

```typescript
describe('Materialized Column Performance', () => {
  test('should handle high-volume updates efficiently', async () => {
      const project = await createLargeProject(1000 tasks);
      
      const startTime = Date.now();
      
      // Perform many updates
      for (let i = 0; i < 100; i++) {
        await projectRepository.updateTaskStatus(
          `task-${i}`,
          'completed',
          tenantId,
          userId
        );
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Under 5 seconds for 100 updates
    });
  });
});
```

## Performance Considerations

### Efficient Query Patterns

```typescript
// Batch counter updates for better performance
private async batchUpdateCounters(
  tx: Database,
  updates: CounterUpdate[]
): Promise<void> {
  // Group updates by table for efficiency
  const updatesByTable = updates.reduce((acc, update) => {
    acc[update.table] = acc[update.table] || [];
    acc[update.table].push(update);
    return acc;
  }, {});

  for (const [table, tableUpdates] of Object.entries(updatesByTable)) {
    const updateQuery = tableUpdates
      .map(update => 
        this.buildUpdateQuery(table, update.id, update)
      ).join('; ');

    await tx.execute(sql.raw(updateQuery));
  }
}
```

### Database Optimization

```sql
-- Use triggers for automatic counter updates when possible
CREATE OR REPLACE FUNCTION update_project_task_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET task_count = (
    SELECT COUNT(*) 
    FROM tasks 
    WHERE project_id = NEW.id 
      AND tasks.status != 'cancelled'
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_task_count
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_task_count();
```

## Enforcement Checklist

- [ ] All aggregate counters are updated in same transaction as child modifications
- [ **[ ] Database triggers enforce automatic counter updates where possible**
- [ ] Repository methods use materializedColumnService for counter updates
- [ ] API endpoints ensure atomic operations
- [ ] Comprehensive test coverage for atomic updates
- [ ] Performance optimization for high-volume operations
- [ ] Error handling ensures transaction rollback
- [ ] Audit logging for counter changes
- [ ] Database indexes support efficient counter queries
- [ ] Frontend displays real-time counter updates
- [ ] Cross-entity consistency maintained across aggregates
- [ ] Concurrent modifications handled safely without conflicts

---

## Motion Hierarchy Rules

**File:** `.windsurf/rules/motion-hierarchy.md`

---
trigger: always_on
---



To keep the UI disciplined and premium, categorize every animated element:

<!-- SECTION: motion_levels -->

<motion_levels>

**Alive Level**
- Use cases: Core navigation, state changes, user feedback
- Allowed techniques: Spring physics (type: "spring", stiffness: 300, damping: 30), shared layout animations (layoutId), glow on hover
- Example components: Sidebar expand/collapse, active nav pill, command palette stagger, chat input LED border

**Quiet Level**
- Use cases: Secondary elements, content reveals, tooltips
- Allowed techniques: Opacity fades, very short transitions (≤150ms), no glow
- Example components: Tooltips, dropdown menus, skeleton loaders

**Static Level**
- Use cases: Dense data tables, repeated items, non-interactive elements
- Allowed techniques: No animation – use instant changes
- Example components: Long transaction lists (except loading), calendar grid cells

</motion_levels>

<!-- ENDSECTION: motion_levels -->

<!-- SECTION: rule_of_thumb -->

<rule_of_thumb>

If an interaction is primary (navigation, sending a message, moving a task), use spring.
If it is informational (tooltip, hover detail), use quiet fade.
- If it is data-dense (table rows), keep static.

</rule_of_thumb>

<!-- ENDSECTION: rule_of_thumb -->

---

## Framer Motion Rules (v11.0+)

**File:** `.windsurf/rules/motion-library.md`

---
trigger: always_on
---



This project uses Framer Motion 11.0.0 for all animations, not the motion library.

<!-- SECTION: library_usage -->

<library_usage>
- **Package name**: `framer-motion` (not `motion`)
- **Version**: 11.0.0 (from catalog)
- **Import from**: `framer-motion` for React components
- **Components**: `motion.div`, `motion.button`, etc. for animated elements
- **AnimatePresence**: For exit animations and component lifecycle
- **Layout Animations**: Use layoutId and layout props for shared elements
</library_usage>

<!-- ENDSECTION: library_usage -->

<!-- SECTION: spring_animations -->

<spring_animations>
- Use spring physics for primary interactions (navigation, state changes, user feedback)
- Spring config: `type: "spring", stiffness: 300, damping: 30`
- Avoid spring for informational elements (tooltips, hover details) - use quiet fade instead
- Spring animations feel "alive" and premium when used appropriately
</spring_animations>

<!-- ENDSECTION: spring_animations -->

<!-- SECTION: stagger_animations -->

<stagger_animations>
- Use `staggerChildren` for list reveals (AgentCard grid, command palette items)
- Stagger delay: 0.05s for small lists, 0.08s for larger grids
- Apply to parent container with `variants` object
- Creates premium, orchestrated reveal effect
</stagger_animations>

<!-- ENDSECTION: stagger_animations -->

<!-- SECTION: layout_animations -->

<layout_animations>
- Use `layoutId` for shared element transitions (active nav pill, moving elements)
- Enables smooth morphing between element positions
- Example: Active selection pill moving between sidebar nav items
- Use `layout` prop for automatic layout animations when content size changes
</layout_animations>

<!-- ENDSECTION: layout_animations -->

<!-- SECTION: exit_animations -->

<exit_animations>
- Wrap removable elements in `AnimatePresence` component
- Provide `initial`, `animate`, and `exit` props
- Exit pattern: `opacity: 0, y: -8` or `scale: 0.9, opacity: 0`
- Mode: "wait" for sequential, "popLayout" for layout-aware exits
- Required for modals, drawers, list item removals
</exit_animations>

<!-- ENDSECTION: exit_animations -->

<!-- SECTION: performance -->

<performance>
- **Only animate transform and opacity properties** for GPU acceleration
- Never animate width, height, left, top, or margin (causes layout thrashing)
- Use `will-change` sparingly - only for complex animations
- Prefer CSS transitions for simple hover states (150ms ease-out)
- Use `LazyMotion` to load animation features on demand
- Test animations on low-end devices
</performance>

<!-- ENDSECTION: performance -->

<!-- SECTION: reduced_motion -->

<reduced_motion>
- Wrap all motion animations in `useReducedMotion()` hook check
- When reduced motion is requested:
  - Replace spring animations with instant state changes or very short fades (≤50ms)
  - Disable stagger effects
  - Skip exit animations
  - Preserve clarity - don't disable everything
- Respect `prefers-reduced-motion: reduce` media query
</reduced_motion>

<!-- ENDSECTION: reduced_motion -->

<!-- SECTION: micro_interactions -->

<micro_interactions>
- **LED border effect**: Gradient border that glows on focus, flashes brighter on keypress (100ms)
- **Hover lift**: Subtle `y: -1` or `y: -2` lift on interactive elements
- **Glow effect**: Expanding box-shadow on hover using `whileHover`
- **Pulse animation**: Use keyframes for status indicators (scale + opacity loop)
- Keep micro-interactions subtle - don't overwhelm
</micro_interactions>

<!-- ENDSECTION: micro_interactions -->

<!-- SECTION: animation_hierarchy -->

<animation_hierarchy>
- **Alive tier** (core navigation, state changes): Spring physics, shared layout, glow on hover
- **Quiet tier** (secondary elements, tooltips): Opacity fades, ≤150ms transitions, no glow
- **Static tier** (dense data tables, repeated items): No animation - instant changes
- Apply hierarchy consistently across the application
</animation_hierarchy>

<!-- ENDSECTION: animation_hierarchy -->

<!-- SECTION: common_patterns -->

<common_patterns>
```tsx
// Spring animation for interactive element
<motion.button
  whileHover={{ scale: 1.02, y: -1 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
  Click me
</motion.button>

// Staggered list reveal
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={containerVariants} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>

// Exit animation with AnimatePresence
<AnimatePresence mode="popLayout">
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>

// Shared layout animation
<motion.div layoutId="active-pill" className="bg-blue-500 h-8" />

// Reduced motion check
const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300 };
```
</common_patterns>

<!-- ENDSECTION: common_patterns -->

<!-- SECTION: anti_patterns -->

<anti_patterns>
- **Layout Properties**: Do NOT animate width, height, margin, padding (causes layout thrashing)
- **Over-Animation**: Do NOT use spring animations for every element - reserve for primary interactions
- **Reduced Motion**: Do NOT ignore reduced motion preferences
- **CSS vs JS**: Do NOT use heavy JavaScript animations when CSS transitions suffice
- **Off-Screen Elements**: Do NOT animate elements that are off-screen or not visible
- **Package Name**: Do NOT use `motion` package - use `framer-motion`
- **Bundle Size**: Do NOT import all animation features - use specific components
</anti_patterns>

<!-- ENDSECTION: anti_patterns -->

---

## Motion Preference Rules

**File:** `.windsurf/rules/motion-preference.md`

---
trigger: always_on
---



Respect user's motion preferences for accessibility:

<!-- SECTION: hook_implementation -->

<hook_implementation>

Create useMotionPreference() hook that reads prefers-reduced-motion:

```typescript
const useMotionPreference = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReducedMotion;
};
```

</hook_implementation>

<!-- ENDSECTION: hook_implementation -->

<!-- SECTION: behavior -->

<behavior>

When reduced motion is requested:
- Replace spring animations with instant state changes
- Or use very short fades (≤50ms)
- Do not simply "disable everything" – preserve clarity
- Essential information should still be conveyed

</behavior>

<!-- ENDSECTION: behavior -->

<!-- SECTION: usage -->

<usage>

- Call useMotionPreference() in all animated components
- Conditionally apply motion based on the hook result
- Example: `const reducedMotion = useMotionPreference();`
- Example: `transition={reducedMotion ? { duration: 0 } : { duration: 0.15 }}`

</usage>

<!-- ENDSECTION: usage -->

<!-- SECTION: css_media_query -->

<css_media_query>

Wrap all CSS animations in @media (prefers-reduced-motion: no-preference):

```css
@media (prefers-reduced-motion: no-preference) {
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}
```

</css_media_query>

<!-- ENDSECTION: css_media_query -->

---

## Performance Rules

**File:** `.windsurf/rules/performance.md`

---
trigger: always_on
---



All components and pages must follow performance best practices:

<!-- SECTION: code_splitting -->

<code_splitting>

- Use React.lazy() for route-based code splitting
- Use dynamic imports for heavy components
- Load charts and visualizations on demand
- Split by route using React Router

</code_splitting>

<!-- ENDSECTION: code_splitting -->

<!-- SECTION: rendering_optimization -->

<rendering_optimization>

- Use React.memo() for expensive components
- Use useMemo() for expensive computations
- Use useCallback() for function props
- Avoid unnecessary re-renders with proper dependency arrays
- Virtualize long lists using react-window (standard library for this project)
- Apply virtualization to ActivityFeed, transaction lists, news feed, and any scrollable list >50 items

</rendering_optimization>

<!-- ENDSECTION: rendering_optimization -->

<!-- SECTION: image_optimization -->

<image_optimization>

- Use standard HTML img tags with loading="lazy" for below-the-fold images
- Use appropriate image formats (WebP, AVIF)
- Implement responsive images with srcset
- Add placeholder blur using CSS or background colors
- Consider using a lightweight image optimization library if needed

</image_optimization>

<!-- ENDSECTION: image_optimization -->

<!-- SECTION: data_fetching -->

<data_fetching>

- Use TanStack Query for efficient data caching
- Implement proper cache invalidation
- Use optimistic updates where appropriate
- Prefetch data for likely user actions
- Deduplicate parallel requests

</data_fetching>

<!-- ENDSECTION: data_fetching -->

<!-- SECTION: bundle_optimization -->

<bundle_optimization>

- Analyze bundle size regularly
- Tree-shake unused code
- Use import statements over require
- Avoid large dependencies when possible
- Use ES modules for better tree-shaking

</bundle_optimization>

<!-- ENDSECTION: bundle_optimization -->

<!-- SECTION: motion_performance -->

<motion_performance>

- Use CSS transforms and opacity for animations
- Avoid animating layout properties (width, height)
- Use will-change sparingly
- Respect prefers-reduced-motion
- Test animations on low-end devices

</motion_performance>

<!-- ENDSECTION: motion_performance -->

---

## pnpm Workspace Patterns

**File:** `.windsurf/rules/pnpm-workspace-patterns.md`

---
trigger: always_on
---



This project uses pnpm workspaces with extensive security configurations and centralized dependency management. Follow these guidelines for all workspace operations.

<!-- SECTION: workspace_structure -->

<workspace_structure>
- **Root Configuration**: pnpm-workspace.yaml defines workspace patterns, security, and catalog
- **Package Patterns**: artifacts/*, lib/*, lib/integrations/*, scripts/*
- **Catalog Management**: Centralized dependency versions in pnpm-workspace.yaml catalog
- **Workspace Names**: Use @workspace/* prefix for all internal packages
- **Build Order**: Libraries build first, then artifacts (deployable applications)
- **Supply Chain Protection**: 1440-minute minimum release age enforcement
</workspace_structure>

<!-- ENDSECTION: workspace_structure -->

<!-- SECTION: dependency_management -->

<dependency_management>
- **Catalog Usage**: All shared dependencies must be defined in catalog section
- **Exact Versions**: Use exact versions (e.g., "19.1.0" not "^19.1.0") in catalog
- **Internal Dependencies**: Use workspace protocol (e.g., "@workspace/api-client-react")
- **Security**: minimumReleaseAge: 1440 minutes for all packages (1-day delay)
- **Exclusions**: Only @replit/* packages and stripe-replit-sync bypass release age
- **Auto Install**: autoInstallPeers: false (prevents automatic peer installation)
- **Platform Filtering**: Extensive platform-specific package exclusions for security
</dependency_management>

<!-- ENDSECTION: dependency_management -->

<!-- SECTION: common_commands -->

<common_commands>
- **Full Typecheck**: `pnpm run typecheck` (validates all packages)
- **Build All**: `pnpm run build` (typecheck + parallel build)
- **Code Generation**: `pnpm --filter @workspace/api-spec run codegen`
- **Database Push**: `pnpm --filter @workspace/db run push`
- **API Server Dev**: `pnpm --filter @workspace/api-server run dev`
- **Frontend Dev**: `pnpm --filter @workspace/nexus-digital run dev`
- **Install Dependencies**: `pnpm install --frozen-lockfile`
</common_commands>

<!-- ENDSECTION: common_commands -->

<!-- SECTION: package_patterns -->

<package_patterns>

**Artifacts (Deployable Applications)**:
- `@workspace/api-server`: Express.js backend with esbuild
- `@workspace/nexus-digital`: React frontend with Vite
- `@workspace/mockup-sandbox`: Component preview system

**Libraries (Shared Code)**:
- `@workspace/api-spec`: OpenAPI specification and Orval config
- `@workspace/api-client-react`: Generated React Query hooks
- `@workspace/api-zod`: Generated Zod validation schemas
- `@workspace/db`: Drizzle ORM models and database config

**Development Tools**:
- `@workspace/scripts`: Build automation and Git hooks
- `lib/integrations/*`: External service integrations (empty currently)

</package_patterns>

<!-- ENDSECTION: package_patterns -->

<!-- SECTION: build_system -->

<build_system>
- **TypeScript Project References**: Use tsconfig.json with incremental builds
- **Parallel Builds**: artifacts build in parallel after libraries complete
- **Composite Builds**: Library packages use composite: true for better performance
- **Build Scripts**: Each package has its own build script in package.json
- **Type Checking**: Separate typecheck command for validation without building
</build_system>

<!-- ENDSECTION: build_system -->

<!-- SECTION: security_configuration -->

<security_configuration>
- **Supply Chain Protection**: 1440-minute minimum release age enforcement
- **Platform Filtering**: Extensive platform-specific package exclusions
- **Trusted Packages**: @replit/* packages bypass release age requirements
- **Native Modules**: Excluded from builds for security (sharp, bcrypt, etc.)
- **Cloud SDKs**: Excluded by default (AWS, Azure, Google Cloud)
- **Build Tools**: Specific build tools pinned for security (esbuild 0.27.3)
</security_configuration>

<!-- ENDSECTION: security_configuration -->

<!-- SECTION: development_workflow -->

<development_workflow>
- **Code First**: Update OpenAPI spec before implementing API changes
- **Generate Types**: Run codegen after OpenAPI changes
- **Type Check**: Always run typecheck before committing
- **Build验证**: Use build command to ensure all packages compile
- **Git Hooks**: Post-merge hook automatically installs dependencies and pushes DB changes
- **Workspace Commands**: Use --filter flag for package-specific operations
</development_workflow>

<!-- ENDSECTION: development_workflow -->

<!-- SECTION: best_practices -->

<best_practices>
- **Workspace Dependencies**: Always use workspace protocol for internal packages
- **Catalog Management**: Define all shared dependencies in catalog, not individual package.json
- **Version Consistency**: Use catalog to ensure version consistency across packages
- **Security First**: Never bypass supply chain protections without explicit reason
- **Type Safety**: Leverage TypeScript project references for better performance
- **Code Generation**: Never manually edit generated files (api-client-react, api-zod)
</best_practices>

<!-- ENDSECTION: best_practices -->

---

## Portal Data Isolation Rule

**File:** `.windsurf/rules/portal-data-isolation.md`

---
trigger: model_decision
description: Client portal routes must always call the permission filter; never return unfiltered data. Any missing permission must result in PortalAccessDenied.
---



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

---

## Portal Message Access Rule

**File:** `.windsurf/rules/portal-message-access.md`

---
trigger: model_decision
description: Portal messages are scoped by portal_client_id; firm users can read client messages but never vice-versa unless message is addressed to the client.
---



## Purpose

Enforce strict access control for portal messages where firm users can read all client messages, but clients can only read messages specifically addressed to them. This maintains proper communication boundaries while allowing firm oversight.

## Core Access Requirements

### Message Scoping Rules

**Message access by user type:**

1. **Firm Users**: Can read all messages (both sent and received)
2. **Portal Clients**: Can only read messages where `portal_client_id` matches their ID
3. **Message Direction**: Access depends on message direction and addressing

### Direction-Based Access

**Message direction determines access:**

- **firm_to_client**: Client can read + Firm users can read
- **client_to_firm**: Only firm users can read (unless addressed to specific client)
- **general_announcement**: Both firm users and all clients can read

## Implementation Requirements

### Database Schema Support

```sql
-- Portal messages table with direction and addressing
CREATE TABLE portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'general' CHECK (message_type IN ('general', 'document_share', 'appointment_reminder', 'invoice_notification')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('firm_to_client', 'client_to_firm')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  reply_to_id UUID REFERENCES portal_messages(id), -- For message threads
  attachments JSONB, -- Array of attachment metadata
  addressed_to_client_id UUID REFERENCES portal_clients(id), -- For specific client addressing
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient message queries
CREATE INDEX idx_portal_messages_client ON portal_messages(portal_client_id);
CREATE INDEX idx_portal_messages_tenant ON portal_messages(tenant_id);
CREATE INDEX idx_portal_messages_direction ON portal_messages(direction);
CREATE INDEX idx_portal_messages_unread ON portal_messages(portal_client_id, is_read);
CREATE INDEX idx_portal_messages_thread ON portal_messages(reply_to_id);
CREATE INDEX idx_portal_messages_addressed ON portal_messages(addressed_to_client_id);
```

### Service Layer Implementation

```typescript
// src/services/PortalMessageService.ts
export class PortalMessageService {
  constructor(private db: Database) {}

  async getClientMessages(
    clientContext: ClientContext,
    options: MessageOptions = {}
  ): Promise<PortalMessage[]> {
    let query = this.db
      .select({
        id: portal_messages.id,
        subject: portal_messages.subject,
        content: portal_messages.content,
        messageType: portal_messages.message_type,
        direction: portal_messages.direction,
        isRead: portal_messages.is_read,
        readAt: portal_messages.read_at,
        sentAt: portal_messages.sent_at,
        replyToId: portal_messages.reply_to_id,
        attachments: portal_messages.attachments,
        createdBy: portal_messages.created_by,
        addressedToClientId: portal_messages.addressed_to_client_id
      })
      .from(portal_messages)
      .where(and(
        eq(portal_messages.portal_client_id, clientContext.clientId),
        eq(portal_messages.tenant_id, clientContext.tenantId)
      ));

    // Apply filters
    if (options.unreadOnly) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.is_read, false)
      ));
    }

    if (options.messageType) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.message_type, options.messageType)
      ));
    }

    // Apply client access rules
    query = query.where(
      sql`(
        (${portal_messages.direction} = 'firm_to_client') OR 
        (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} = ${clientContext.clientId}) OR
        (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} IS NULL)
      )`
    );

    return await query
      .orderBy(portal_messages.sent_at)
      .limit(options.limit || 50)
      .offset(options.offset || 0);
  }

  async getFirmMessages(
    tenantId: string,
    userId?: string,
    options: MessageOptions = {}
  ): Promise<PortalMessage[]> {
    let query = this.db
      .select({
        id: portal_messages.id,
        portalClientId: portal_messages.portal_client_id,
        subject: portal_messages.subject,
        content: portal_messages.content,
        messageType: portal_messages.message_type,
        direction: portal_messages.direction,
        isRead: portal_messages.is_read,
        readAt: portal_messages.read_at,
        sentAt: portal_messages.sent_at,
        replyToId: portal_messages.reply_to_id,
        attachments: portal_messages.attachments,
        addressedToClientId: portal_messages.addressed_to_client_id,
        createdBy: portal_messages.created_by,
        clientName: portal_clients.name
      })
      .from(portal_messages)
      .leftJoin(
        portal_clients,
        eq(portal_clients.id, portal_messages.portal_client_id)
      )
      .where(eq(portal_messages.tenant_id, tenantId));

    // Firm users can see all messages
    if (options.clientId) {
      // Filter by specific client
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.portal_client_id, options.clientId)
      ));
    }

    // Apply filters
    if (options.unreadOnly) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.is_read, false)
      ));
    }

    if (options.messageType) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.message_type, options.messageType)
      ));
    }

    return await query
      .orderBy(desc(portal_messages.sent_at))
      .limit(options.limit || 50)
      .offset(options.offset || 0);
  }

  async sendMessageToClient(
    tenantId: string,
    clientId: string,
    subject: string,
    content: string,
    messageType: string = 'general',
    createdBy: string,
    attachments?: any[],
    addressedToClientId?: string
  ): Promise<PortalMessage> {
    return await this.db.transaction(async (tx) => {
      const message = await tx.insert(portal_messages).values({
        tenantId,
        portalClientId: clientId,
        subject,
        content,
        messageType,
        direction: 'firm_to_client',
        attachments: attachments || [],
        addressedToClientId: addressedToClientId || clientId, // Default to client
        createdBy
      }).returning();

      // Emit domain event
      await this.emitEvent('PortalMessageSent', {
        messageId: message[0].id,
        clientId,
        direction: 'firm_to_client',
        messageType,
        createdBy
      });

      return message[0];
    });
  }

  async sendMessageFromClient(
    clientContext: ClientContext,
    subject: string,
    content: string,
    attachments?: any[]
  ): Promise<PortalMessage> {
    return await this.db.transaction(async (tx) => {
      const message = await tx.insert(portal_messages).values({
        tenantId: clientContext.tenantId,
        portalClientId: clientContext.clientId,
        subject,
        content,
        messageType: 'general',
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
    });
  }

  async markAsRead(
    messageIds: string[],
    clientContext: ClientContext
  ): Promise<void> {
    await this.db
      .update(portal_messages)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        inArray(portal_messages.id, messageIds),
        eq(portal_messages.portal_client_id, clientContext.clientId),
        eq(portal_messages.tenant_id, clientContext.tenantId),
        eq(portal_messages.is_read, false)
      ));
  }

  async getUnreadCounts(
    tenantId: string
  ): Promise<{ total: number; byClient: Array<{ clientId: string; clientName: string; count: number }> }> {
    const totalCount = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(portal_messages)
      .where(and(
        eq(portal_messages.tenant_id, tenantId),
        eq(portal_messages.is_read, false)
      ));

    const byClient = await this.db
      .select({
        clientId: portal_messages.portal_client_id,
        clientName: portal_clients.name,
        count: sql<number>`COUNT(*)`
      })
      .from(portal_messages)
      .leftJoin(
        portal_clients,
        eq(portal_clients.id, portal_messages.portal_client_id)
      )
      .where(and(
        eq(portal_messages.tenant_id, tenantId),
        eq(portal_messages.is_read, false)
      ))
      .groupBy(portal_messages.portal_client_id, portal_clients.name)
      .orderBy(sql`COUNT(*) DESC`);

    return {
      total: totalCount[0].count,
      byClient: byClient
    };
  }

  async getMessageThread(
    messageId: string,
    clientContext?: ClientContext,
    tenantId?: string
  ): Promise<PortalMessage[]> {
    let query = this.db
      .select({
        id: portal_messages.id,
        portalClientId: portal_messages.portal_client_id,
        subject: portal_messages.subject,
        content: portal_messages.content,
        messageType: portal_messages.message_type,
        direction: portal_messages.direction,
        isRead: portal_messages.is_read,
        readAt: portal_messages.read_at,
        sentAt: portal_messages.sent_at,
        replyToId: portal_messages.reply_to_id,
        attachments: portal_messages.attachments,
        createdBy: portal_messages.created_by,
        addressedToClientId: portal_messages.addressed_to_client_id,
        clientName: portal_clients.name
      })
      .from(portal_messages)
      .leftJoin(
        portal_clients,
        eq(portal_clients.id, portal_messages.portal_client_id)
      )
      .where(eq(portal_messages.id, messageId));

    // Apply client context filtering if provided
    if (clientContext) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.tenant_id, clientContext.tenantId),
        sql`(
          (${portal_messages.direction} = 'firm_to_client') OR 
          (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} = ${clientContext.clientId}) OR
          (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} IS NULL)
        )`
      ));
    } else if (tenantId) {
      query = query.where(eq(portal_messages.tenant_id, tenantId));
    }

    // Get thread messages (including replies)
    const threadMessages = await query.orderBy(portal_messages.sent_at);

    // If we have a client context, filter thread messages for client access
    if (clientContext) {
      return threadMessages.filter(msg => {
        return (
          msg.direction === 'firm_to_client' ||
          (msg.direction === 'client_to_firm' && 
            (msg.addressedToClientId === clientContext.clientId || msg.addressedToClientId === null))
        );
      });
    }

    return threadMessages;
  }
}
```

### API Layer Implementation

```typescript
// src/routes/portal/messages.ts
router.get('/', async (req: PortalRequest, res, next) => {
  try {
    const messages = await portalMessageService.getClientMessages(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      {
        unreadOnly: req.query.unreadOnly === 'true',
        messageType: req.query.messageType as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      }
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post('/', validateRequest(sendMessageSchema), async (req: PortalRequest, res, next) => {
  try {
    const { subject, content, attachments } = req.body;

    const message = await portalMessageService.sendMessageFromClient(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      subject,
      content,
      attachments
    );

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req: PortalRequest, res, next) => {
  try {
    const { messageIds } = req.body;
    
    await portalMessageService.markAsRead(
      Array.isArray(messageIds) ? messageIds : [req.params.id],
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
});

router.get('/thread/:messageId', async (req: PortalRequest, res, next) => {
  try {
    const thread = await portalMessageService.getMessageThread(
      req.params.messageId,
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      }
    );

    res.json({ thread });
  } catch (error) {
    next(error);
  }
});

// Firm user routes (different auth middleware)
router.get('/firm/all', async (req, res, next) => {
  try {
    const messages = await portalMessageService.getFirmMessages(
      req.tenant.id,
      req.user?.id,
      {
        clientId: req.query.clientId as string,
        unreadOnly: req.query.unreadOnly === 'true',
        messageType: req.query.messageType as string,
        limit: parseInt(req.query.limit as string) || 50
      }
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post('/firm/send', validateRequest(firmSendMessageSchema), async (req, res, next) => {
  try {
    const { clientId, subject, content, messageType, attachments, addressedToClientId } = req.body;

    const message = await portalMessageService.sendMessageToClient(
      req.tenant.id,
      clientId,
      subject,
      content,
      messageType,
      req.user.id,
      attachments,
      addressedToClientId
    );

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

router.get('/firm/unread-counts', async (req, res, next) => {
  try {
    const counts = await portalMessageService.getUnreadCounts(req.tenant.id);
    
    res.json(counts);
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for client portal messages
export const ClientMessageList: ReactFC = () => {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portal/messages');
      const data = await response.json();
      setMessages(data.messages);
      setUnreadCount(data.messages.filter(m => !m.isRead).length);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (subject: string, content: string) => {
    try {
      const response = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, content })
      });

      if (response.ok) {
        await loadMessages(); // Refresh messages
        showSuccessMessage('Message sent successfully');
      }
    } catch (error) {
      showErrorMessage('Failed to send message');
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/portal/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds: [messageId] })
      });

      await loadMessages(); // Refresh messages
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  return (
    <div className="portal-messages">
      <div className="messages-header">
        <h2>Messages</h2>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount} unread</span>
        )}
      </div>

      <div className="message-list">
        {messages.map(message => (
          <MessageCard
            key={message.id}
            message={message}
            onRead={() => handleMarkAsRead(message.id)}
          />
        ))}
      </div>

      <div className="message-composer">
        <MessageComposer onSend={handleSendMessage} />
      </div>
    </div>
  );
};

// Message card component
const MessageCard: React.FC<{
  message: PortalMessage;
  onRead: () => void;
}> = ({ message, onRead }) => {
  const isFromFirm = message.direction === 'firm_to_client';
  const isUnread = !message.isRead;

  return (
    <div className={`message-card ${isFromFirm ? 'from-firm' : 'from-client'} ${isUnread ? 'unread' : 'read'}`}>
      <div className="message-header">
        <span className="message-direction">
          {isFromFirm ? 'Firm' : 'You'}
        </span>
        <span className="message-time">
          {formatDateTime(message.sentAt)}
        </span>
        {isUnread && (
          <span className="unread-indicator">●</span>
        )}
      </div>

      <div className="message-content">
        <h4>{message.subject}</h4>
        <p>{message.content}</p>
      </div>

      {message.attachments && message.attachments.length > 0 && (
        <div className="message-attachments">
          {message.attachments.map((attachment, index) => (
            <AttachmentItem key={index} attachment={attachment} />
          ))}
        </div>
      )}

      <div className="message-actions">
        {isUnread && (
          <button onClick={() => onRead()} className="mark-read-btn">
            Mark as Read
          </button>
        )}
        {message.replyToId && (
          <button className="reply-btn">
            Reply
          </button>
        )}
      </div>
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

**Test message access control:**

```typescript
describe('Portal Message Access', () => {
  test('should allow client to read their own messages', async () => {
    const clientContext = createMockClientContext();
    const service = new PortalMessageService(db);

    // Create messages for client
    await createMessage({ 
      direction: 'firm_to_client', 
      portalClientId: clientContext.clientId 
    });
    await createMessage({ 
      direction: 'client_to_firm', 
      portalClientId: clientContext.clientId 
    });

    const messages = await service.getClientMessages(clientContext);
    
    expect(messages).toHaveLength(2);
    expect(messages.every(m => 
      m.portalClientId === clientContext.clientId
    ));
  });

  test('should prevent client from reading other client messages', async () => {
    const clientA = createMockClientContext('client-a');
    const clientB = createMockClientContext('client-b');
    const service = new PortalMessageService(db);

    // Create message for client A
    await createMessage({ 
      direction: 'firm_to_client', 
      portalClientId: clientA.clientId 
    });

    // Client B tries to read messages
    const messages = await service.getClientMessages(clientB);
    
    expect(messages).toHaveLength(0);
  });

  test('should allow client to read addressed messages', async () => {
    const clientContext = createMockClientContext();
    const service = new PortalMessageService(db);

    // Create message addressed to specific client
    await createMessage({ 
      direction: 'client_to_firm', 
      portalClientId: clientContext.clientId,
      addressedToClientId: clientContext.clientId 
    });

    const messages = await service.getClientMessages(clientContext);
    
    expect(messages).toHaveLength(1);
    expect(messages[0].addressedToClientId).toBe(clientContext.clientId);
  });
});
```

### Integration Tests

**Test end-to-end message flow:**

1. **Message Creation**: Different message types and directions
2. **Access Control**: Proper permission enforcement
3. **Thread Management**: Reply and conversation flow
4. **Read Status**: Mark as read functionality

### Security Tests

**Test security scenarios:**

1. **Client Isolation**: Clients cannot access each other's messages
2. **Message Spoofing**: Direction and addressing validation
3. **Attachment Security**: Proper access control for attachments
4. **Content Filtering**: XSS prevention in message content

## Enforcement Checklist

- [ ] Client messages are scoped by portal_client_id
- [ ] Firm users can read all messages
- [ ] Clients can only read messages addressed to them
- [ ] Message direction determines access rights
- [ ] Database schema supports addressing and direction
- [ ] API endpoints enforce access rules consistently
- [ ] Frontend respects access control in UI
- [ ] Comprehensive test coverage for access scenarios
- [ ] Message threads maintain proper access control
- [ ] Unread count tracking works correctly
- [ ] Audit logging for message access events
- [ ] Error handling prevents unauthorized access
- [ ] Performance optimization for message queries

---

## Presigned URL Standards Rule

**File:** `.windsurf/rules/presigned-url-standards.md`

---
trigger: model_decision
description: Signed download/upload URLs must have a configurable expiry time and be generated through a single StorageAdapter method to ensure consistency.
---



## Purpose

Standardize the generation and management of presigned URLs for file uploads and downloads across the application. Ensure consistent expiry times, security policies, and centralized URL generation through a unified StorageAdapter interface.

## Core Requirements

### URL Generation Standards

**All presigned URLs must:**

1. **Use Centralized Method**: Generated through `StorageAdapter.generatePresignedUrl()`
2. **Configurable Expiry**: Default 15 minutes, configurable per use case
3. **Security Headers**: Include proper CORS and content security headers
4. **Consistent Format**: Standardized URL structure and parameters
5. **Access Control**: URLs respect user permissions and tenant isolation

### Expiry Time Standards

**Default expiry times by use case:**

- **File Upload**: 15 minutes (900 seconds)
- **File Download**: 15 minutes (900 seconds)
- **Document Preview**: 5 minutes (300 seconds)
- **Bulk Operations**: 30 minutes (1800 seconds)
- **Admin Operations**: 1 hour (3600 seconds)

## Implementation Requirements

### Storage Adapter Interface

```typescript
// src/services/storage/StorageAdapter.ts
export interface StorageAdapter {
  generatePresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrl>;
  uploadFile(file: UploadRequest): Promise<UploadResult>;
  downloadFile(fileId: string): Promise<DownloadResult>;
  deleteFile(fileId: string): Promise<void>;
  getFileMetadata(fileId: string): Promise<FileMetadata>;
}

export interface PresignedUrlOptions {
  operation: 'upload' | 'download' | 'preview';
  fileId: string;
  fileName?: string;
  contentType?: string;
  expiresIn?: number; // Seconds
  tenantId: string;
  userId?: string;
  permissions?: string[]; // Additional access controls
  metadata?: Record<string, any>;
}

export interface PresignedUrl {
  url: string;
  expiresAt: Date;
  headers: Record<string, string>;
  fileId: string;
  operation: string;
}
```

### Centralized URL Generation Service

```typescript
// src/services/PresignedUrlService.ts
export class PresignedUrlService {
  constructor(
    private storageAdapter: StorageAdapter,
    private permissionService: PermissionService
  ) {}

  async generateUploadUrl(
    fileId: string,
    fileName: string,
    contentType: string,
    tenantId: string,
    userId: string,
    expiresIn: number = 900 // 15 minutes default
  ): Promise<PresignedUrl> {
    // Validate user permissions for upload
    await this.permissionService.checkUploadPermission(
      tenantId,
      userId,
      fileId
    );

    const options: PresignedUrlOptions = {
      operation: 'upload',
      fileId,
      fileName,
      contentType,
      expiresIn,
      tenantId,
      userId,
      metadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    };

    return await this.storageAdapter.generatePresignedUrl(options);
  }

  async generateDownloadUrl(
    fileId: string,
    tenantId: string,
    userId?: string,
    expiresIn: number = 900, // 15 minutes default
    clientContext?: PortalClientContext
  ): Promise<PresignedUrl> {
    // Check download permissions
    if (clientContext) {
      // Portal client permission check
      const hasPermission = await this.permissionService.checkPermission(
        clientContext,
        'document',
        fileId,
        'download'
      );

      if (!hasPermission) {
        throw new PortalAccessDeniedError('No download permission for this document');
      }
    } else {
      // Internal user permission check
      if (userId) {
        await this.permissionService.checkDownloadPermission(
          tenantId,
          userId,
          fileId
        );
      }
    }

    const options: PresignedUrlOptions = {
      operation: 'download',
      fileId,
      expiresIn,
      tenantId,
      userId,
      permissions: userId ? ['internal_download'] : ['portal_download']
    };

    return await this.storageAdapter.generatePresignedUrl(options);
  }

  async generatePreviewUrl(
    fileId: string,
    tenantId: string,
    userId?: string,
    expiresIn: number = 300 // 5 minutes default for preview
  ): Promise<PresignedUrl> {
    // Preview URLs require view permission
    if (userId) {
      await this.permissionService.checkViewPermission(
        tenantId,
        userId,
        fileId
      );
    }

    const options: PresignedUrlOptions = {
      operation: 'preview',
      fileId,
      expiresIn,
      tenantId,
      userId,
      permissions: ['preview']
    };

    return await this.storageAdapter.generatePresignedUrl(options);
  }

  async generateBulkDownloadUrls(
    fileIds: string[],
    tenantId: string,
    userId: string,
    expiresIn: number = 1800 // 30 minutes for bulk operations
  ): Promise<PresignedUrl[]> {
    // Check bulk download permission
    await this.permissionService.checkBulkDownloadPermission(
      tenantId,
      userId,
      fileIds
    );

    const urls: PresignedUrl[] = [];

    for (const fileId of fileIds) {
      try {
        const url = await this.generateDownloadUrl(
          fileId,
          tenantId,
          userId,
          expiresIn
        );
        urls.push(url);
      } catch (error) {
        // Log error but continue with other files
        console.error(`Failed to generate download URL for file ${fileId}:`, error);
      }
    }

    return urls;
  }

  async validatePresignedUrl(
    url: string,
    operation: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Extract URL components (implementation depends on storage provider)
      const urlComponents = this.parsePresignedUrl(url);
      
      // Validate expiry
      if (urlComponents.expiresAt < new Date()) {
        return false;
      }

      // Validate operation
      if (urlComponents.operation !== operation) {
        return false;
      }

      // Validate tenant (if embedded in URL)
      if (urlComponents.tenantId && urlComponents.tenantId !== tenantId) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private parsePresignedUrl(url: string): PresignedUrlComponents {
    // Implementation depends on storage provider (S3, R2, etc.)
    // This is a placeholder for the actual parsing logic
    const urlParams = new URL(url).searchParams;
    
    return {
      fileId: urlParams.get('X-Amz-Server-Side-Encryption-Aws-Kms-Key-Id') || '',
      operation: urlParams.get('X-Amz-Algorithm')?.includes('upload') ? 'upload' : 'download',
      expiresAt: new Date(urlParams.get('X-Amz-Expires') || ''),
      tenantId: urlParams.get('X-Amz-Meta-Tenant-Id') || ''
    };
  }
}
```

### S3 Storage Adapter Implementation

```typescript
// src/services/storage/S3StorageAdapter.ts
export class S3StorageAdapter implements StorageAdapter {
  constructor(
    private s3Client: AWS.S3,
    private bucketName: string
  ) {}

  async generatePresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrl> {
    const s3Params: AWS.S3.PresignedUrl.Params = {
      Bucket: this.bucketName,
      Key: this.buildFilePath(options),
      Expires: options.expiresIn || 900,
      ContentType: options.contentType,
      Metadata: {
        'tenant-id': options.tenantId,
        'user-id': options.userId || '',
        'operation': options.operation,
        ...options.metadata
      }
    };

    let url: string;
    let headers: Record<string, string> = {};

    switch (options.operation) {
      case 'upload':
        url = await this.s3Client.getSignedUrlPromise('putObject', s3Params);
        headers = {
          'Content-Type': options.contentType || 'application/octet-stream',
          'x-amz-meta-tenant-id': options.tenantId,
          'x-amz-meta-user-id': options.userId || '',
          'x-amz-acl': 'private'
        };
        break;

      case 'download':
        url = await this.s3Client.getSignedUrlPromise('getObject', s3Params);
        headers = {
          'Content-Disposition': `attachment; filename="${options.fileName || 'download'}"`,
          'Cache-Control': 'no-cache'
        };
        break;

      case 'preview':
        url = await this.s3Client.getSignedUrlPromise('getObject', {
          ...s3Params,
          ResponseContentType: 'application/pdf',
          ResponseContentDisposition: `inline; filename="${options.fileName || 'preview'}"`
        });
        headers = {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${options.fileName || 'preview'}"`
        };
        break;

      default:
        throw new Error(`Unsupported operation: ${options.operation}`);
    }

    return {
      url,
      expiresAt: new Date(Date.now() + (options.expiresIn || 900) * 1000),
      headers,
      fileId: options.fileId,
      operation: options.operation
    };
  }

  private buildFilePath(options: PresignedUrlOptions): string {
    return `${options.tenantId}/${options.fileId}`;
  }
}
```

### API Endpoint Implementation

```typescript
// src/routes/documents.ts
router.get('/:id/download-url', async (req, res, next) => {
  try {
    const { expiresIn } = req.query;
    
    const presignedUrl = await presignedUrlService.generateDownloadUrl(
      req.params.id,
      req.tenant.id,
      req.user?.id,
      expiresIn ? parseInt(expiresIn as string) : undefined
    );

    res.json({
      url: presignedUrl.url,
      expiresAt: presignedUrl.expiresAt,
      fileId: presignedUrl.fileId,
      headers: presignedUrl.headers
    });
  } catch (error) {
    if (error instanceof PortalAccessDeniedError) {
      return res.status(403).json({
        error: error.message,
        code: error.code
      });
    }
    next(error);
  }
});

router.post('/:id/upload-url', validateRequest(uploadUrlSchema), async (req, res, next) => {
  try {
    const { fileName, contentType, expiresIn } = req.body;
    
    const fileId = randomUUID();
    const presignedUrl = await presignedUrlService.generateUploadUrl(
      fileId,
      fileName,
      contentType,
      req.tenant.id,
      req.user.id,
      expiresIn
    );

    res.status(201).json({
      url: presignedUrl.url,
      expiresAt: presignedUrl.expiresAt,
      fileId: presignedUrl.fileId,
      headers: presignedUrl.headers,
      uploadMethod: 'PUT'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/preview-url', async (req, res, next) => {
  try {
    const presignedUrl = await presignedUrlService.generatePreviewUrl(
      req.params.id,
      req.tenant.id,
      req.user?.id
    );

    res.json({
      url: presignedUrl.url,
      expiresAt: presignedUrl.expiresAt,
      fileId: presignedUrl.fileId,
      headers: presignedUrl.headers
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bulk-download-urls', validateRequest(bulkDownloadSchema), async (req, res, next) => {
  try {
    const { fileIds, expiresIn } = req.body;
    
    const presignedUrls = await presignedUrlService.generateBulkDownloadUrls(
      fileIds,
      req.tenant.id,
      req.user.id,
      expiresIn
    );

    res.json({
      urls: presignedUrls,
      total: presignedUrls.length,
      requested: fileIds.length
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for file upload with presigned URLs
export const FileUploader: React.FC<{ onUploadComplete: (fileId: string) => void }> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          expiresIn: 900 // 15 minutes
        })
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, fileId, headers } = await uploadUrlResponse.json();

      // Step 2: Upload file to presigned URL
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setUploadProgress((event.loaded / event.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          onUploadComplete(fileId);
          setUploadProgress(100);
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed');
      });

      xhr.open('PUT', url);
      
      // Set required headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(file);

    } catch (error) {
      console.error('Upload failed:', error);
      showErrorMessage('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span>{Math.round(uploadProgress)}%</span>
        </div>
      )}
    </div>
  );
};

// Component for file download with presigned URLs
export const FileDownloader: React.FC<{ fileId: string; fileName: string }> = ({ 
  fileId, 
  fileName 
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);

    try {
      // Get presigned download URL
      const downloadUrlResponse = await fetch(`/api/documents/${fileId}/download-url`);
      
      if (!downloadUrlResponse.ok) {
        throw new Error('Failed to get download URL');
      }

      const { url, headers } = await downloadUrlResponse.json();

      // Download file using presigned URL
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      
      // Add security headers if needed
      Object.entries(headers).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Download failed:', error);
      showErrorMessage('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className="download-button"
    >
      {downloading ? 'Downloading...' : `Download ${fileName}`}
    </button>
  );
};
```

## Testing Requirements

### Unit Tests

**Test presigned URL generation:**

```typescript
describe('PresignedUrlService', () => {
  test('should generate upload URL with correct expiry', async () => {
    const url = await presignedUrlService.generateUploadUrl(
      'file-123',
      'test.pdf',
      'application/pdf',
      'tenant-1',
      'user-1',
      900 // 15 minutes
    );

    expect(url.operation).toBe('upload');
    expect(url.expiresAt).toBeInstanceOf(Date);
    expect(url.fileId).toBe('file-123');
    expect(url.headers['Content-Type']).toBe('application/pdf');
  });

  test('should validate expired URLs', async () => {
    const expiredUrl = createExpiredPresignedUrl();
    
    const isValid = await presignedUrlService.validatePresignedUrl(
      expiredUrl.url,
      'download',
      'tenant-1'
    );

    expect(isValid).toBe(false);
  });

  test('should check permissions before URL generation', async () => {
    // Mock permission check failure
    permissionService.checkUploadPermission.mockRejectedValue(
      new PortalAccessDeniedError('No upload permission')
    );

    await expect(
      presignedUrlService.generateUploadUrl('file-123', 'test.pdf', 'application/pdf', 'tenant-1', 'user-1')
    ).rejects.toThrow(PortalAccessDeniedError);
  });
});
```

### Integration Tests

**Test end-to-end URL workflow:**

1. **Upload Flow**: Generate URL → Upload file → Verify file stored
2. **Download Flow**: Generate URL → Download file → Verify content
3. **Permission Check**: Unauthorized users can't generate URLs
4. **Expiry Handling**: URLs expire after configured time

### Security Tests

**Test security aspects:**

1. **URL Tampering**: Modified URLs are rejected
2. **Cross-Tenant Access**: Can't access other tenant's files
3. **Permission Bypass**: URLs respect current permissions
4. **Header Injection**: Headers are properly validated

## Security Considerations

### URL Security

```typescript
// URL validation middleware
export const validatePresignedUrl = (req: Request, res: Response, next: NextFunction) => {
  const { url, operation } = req.body;
  
  if (!url || !operation) {
    return res.status(400).json({ error: 'URL and operation required' });
  }

  // Validate URL format and signature
  if (!isValidPresignedUrlFormat(url)) {
    return res.status(400).json({ error: 'Invalid presigned URL format' });
  }

  // Validate operation matches URL purpose
  const urlOperation = extractOperationFromUrl(url);
  if (urlOperation !== operation) {
    return res.status(400).json({ error: 'URL operation mismatch' });
  }

  next();
};
```

### Access Control

- URLs are tenant-scoped
- User permissions are checked before URL generation
- URLs expire automatically
- File metadata includes access control information

## Performance Considerations

### URL Caching

```typescript
// Cache presigned URLs for short duration
private urlCache = new Map<string, PresignedUrl>();

async getCachedUrl(options: PresignedUrlOptions): Promise<PresignedUrl> {
  const cacheKey = this.buildCacheKey(options);
  
  if (this.urlCache.has(cacheKey)) {
    const cached = this.urlCache.get(cacheKey)!;
    
    // Return cached URL if not expired
    if (cached.expiresAt > new Date()) {
      return cached;
    } else {
      this.urlCache.delete(cacheKey);
    }
  }

  // Generate new URL and cache
  const url = await this.storageAdapter.generatePresignedUrl(options);
  this.urlCache.set(cacheKey, url);
  
  return url;
}
```

## Enforcement Checklist

- [ ] All presigned URLs generated through centralized StorageAdapter
- [ ] Default expiry time is 15 minutes for standard operations
- [ ] Expiry times are configurable per use case
- [ ] Permission checks performed before URL generation
- [ ] URLs include proper security headers
- [ ] Tenant isolation enforced in URL generation
- [ ] URL validation prevents tampering
- [ ] Comprehensive test coverage for URL workflows
- [ ] Performance optimization with URL caching
- [ ] Audit logging for URL generation events
- [ ] Error handling for URL generation failures
- [ ] Security monitoring for URL access patterns

---

## Replit Deployment Rules

**File:** `.windsurf/rules/replit-deployment.md`

---
trigger: always_on
---



This project uses Replit Autoscaling deployment with specific configurations and optimizations. Follow these deployment patterns.

<!-- SECTION: deployment_configuration -->

<deployment_configuration>
- **Platform**: Replit Autoscaling with automatic scaling
- **Runtime**: Node.js 24 with ES modules support
- **Port Mapping**: Internal 23379 → External 80
- **Build Process**: Parallel builds with post-build pnpm store pruning
- **Environment**: Development and production configurations
- **Git Integration**: Automatic deployment on git push with post-merge hooks
- **Agent Configuration**: PNPM_WORKSPACE stack with expertMode enabled
</deployment_configuration>

<!-- ENDSECTION: deployment_configuration -->

<!-- SECTION: replit_configuration -->

<replit_configuration>

**.replit file structure**:
```toml
modules = ["nodejs-24"]

[deployment]
router = "application"
deploymentTarget = "autoscale"

[deployment.postBuild]
args = ["pnpm", "store", "prune"]
env = { "CI" = "true" }

[workflows]
runButton = "Project"

[agent]
stack = "PNPM_WORKSPACE"
expertMode = true

[postMerge]
path = "scripts/post-merge.sh"
timeoutMs = 20000

[[ports]]
localPort = 23379
externalPort = 80
```

**Key Settings**:
- **modules**: Node.js 24 runtime specification
- **deployment.router**: Application routing mode
- **deploymentTarget**: Autoscaling deployment target
- **postBuild**: pnpm store pruning for optimization
- **agent.stack**: PNPM_WORKSPACE for monorepo support
- **expertMode**: Advanced agent features enabled
- **postMerge**: Git hook automation with 20s timeout
- **ports**: Internal 23379 to external 80 mapping

</replit_configuration>

<!-- ENDSECTION: replit_configuration -->

<!-- SECTION: build_optimization -->

<build_optimization>
- **Post-Build Hook**: Automatic pnpm store pruning
- **Bundle Size**: Optimized for fast deployment
- **Parallel Builds**: Libraries build first, then artifacts
- **Source Maps**: Enabled for debugging, hidden in production
- **Asset Optimization**: Images and static assets optimized
- **Dependency Caching**: Leverage pnpm workspace caching
</build_optimization>

<!-- ENDSECTION: build_optimization -->

<!-- SECTION: environment_variables -->

<environment_variables>
- **PORT**: Server port (provided by Replit, validated in Vite config)
- **BASE_PATH**: Frontend base path for routing (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit environment identifier (for conditional plugins)
- **DATABASE_URL**: PostgreSQL connection string
- **LOG_LEVEL**: Logging level (defaults to "info")
</environment_variables>

<!-- ENDSECTION: environment_variables -->

<!-- SECTION: development_plugins -->

<development_plugins>
- **Cartographer**: Workspace mapping tool with root path resolution
- **Dev Banner**: Development environment indicator
- **Runtime Error Modal**: Enhanced error display for debugging
- **Conditional Loading**: Only in development (NODE_ENV !== "production" && REPL_ID !== undefined)
- **Performance**: Excluded from production builds
</development_plugins>

<!-- ENDSECTION: development_plugins -->

<!-- SECTION: git_workflow -->

<git_workflow>
- **Automatic Deployment**: Push to main branch triggers deployment
- **Post-Merge Hook**: Runs scripts/post-merge.sh after git merge
- **Dependency Installation**: Automatic pnpm install --frozen-lockfile
- **Database Push**: Automatic schema changes with pnpm --filter db push
- **Build Validation**: Full workspace typecheck and build
</git_workflow>

<!-- ENDSECTION: git_workflow -->

<!-- SECTION: security_configuration -->

<security_configuration>
- **Supply Chain Protection**: 1440-minute minimum release age
- **Platform Filtering**: Extensive package exclusions
- **Trusted Packages**: @replit/* packages bypass release age
- **Native Modules**: Excluded for security (sharp, bcrypt, etc.)
- **Cloud SDKs**: Excluded by default (AWS, Azure, Google Cloud)
- **Environment Variables**: No hardcoded secrets in code
</security_configuration>

<!-- ENDSECTION: security_configuration -->

<!-- SECTION: performance_optimization -->

<performance_optimization>
- **Autoscaling**: Automatic scale based on traffic patterns
- **Cold Starts**: Optimized for fast startup
- **Bundle Splitting**: Code splitting for faster initial load
- **Static Assets**: Optimized delivery through CDN
- **Database Connections**: Efficient connection pooling
- **Caching**: Built-in caching with TanStack Query
</performance_optimization>

<!-- ENDSECTION: performance_optimization -->

<!-- SECTION: monitoring -->

<monitoring>
- **Health Checks**: /api/healthz endpoint for uptime monitoring
- **Logging**: Structured logging with Pino
- **Error Tracking**: Runtime error modal in development
- **Performance Metrics**: Built-in Replit monitoring
- **Resource Usage**: CPU and memory monitoring
- **Request Tracking**: Request/response logging
</monitoring>

<!-- ENDSECTION: monitoring -->

<!-- SECTION: deployment_commands -->

<deployment_commands>

**Local Development**:
```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/nexus-digital run dev

# Build all packages
pnpm run build

# Type check all packages
pnpm run typecheck
```

**Deployment**:
```bash
# Trigger deployment (automatic on git push)
git push origin main

# Manual rebuild (if needed)
# Replit automatically rebuilds on file changes
```

**Database Operations**:
```bash
# Push schema changes
pnpm --filter @workspace/db run push

# Force push (development only)
pnpm --filter @workspace/db run push-force
```

</deployment_commands>

<!-- ENDSECTION: deployment_commands -->

<!-- SECTION: troubleshooting -->

<troubleshooting>
- **Build Failures**: Check pnpm-workspace.yaml and package.json configurations
- **Port Conflicts**: Replit automatically handles port mapping
- **Dependency Issues**: Run pnpm install --frozen-lockfile
- **Database Connection**: Verify DATABASE_URL environment variable
- **Plugin Errors**: Check conditional plugin loading logic
- **Deployment Stuck**: Check Replit deployment logs
</troubleshooting>

<!-- ENDSECTION: troubleshooting -->

<!-- SECTION: best_practices -->

<best_practices>
- **Environment Variables**: Use Replit environment variables, never hardcode
- **Build Optimization**: Leverage post-build hooks for smaller images
- **Security**: Follow pnpm workspace security policies
- **Monitoring**: Implement health checks and structured logging
- **Performance**: Use autoscaling and caching strategies
- **Development**: Use Replit development tools for optimal experience
</best_practices>

<!-- ENDSECTION: best_practices -->

<!-- SECTION: strict_constraints -->

<strict_constraints>
- **Replit Only**: Use Replit deployment, not Vercel/Netlify
- **Environment Variables**: Use Replit environment variables, not .env files
- **Build System**: Use pnpm workspace builds, not individual builds
- **Security**: Follow pnpm-workspace.yaml security policies
- **Plugins**: Use Replit-specific development plugins conditionally
- **Database**: Use PostgreSQL provided by Replit, not external databases
</strict_constraints>

<!-- ENDSECTION: strict_constraints -->

---

## Security Standards

**File:** `.windsurf/rules/security-standards.md`

---
trigger: model_decision
description: Security requirements and validation checkpoints for all code changes
---



Enforce comprehensive security standards for all development activities in the Apex Unified Suite.

## When This Rule Applies

Cascade should reference this rule when:
- Implementing authentication or authorization features
- Handling user input or data validation
- Working with sensitive data (PII, credentials, tokens)
- Modifying API endpoints or middleware
- Database schema changes
- Frontend form implementations

## Authentication & Authorization

### **JWT Implementation Requirements**
- Use `jsonwebtoken` with RS256 algorithm for production
- Access tokens: 15-minute expiry maximum
- Refresh tokens: 7-day expiry maximum
- Secure token storage: httpOnly cookies or secure localStorage
- Token rotation on every refresh
- Immediate token invalidation on logout

### **Password Security**
- Minimum 12 characters with complexity requirements
- Hash with bcrypt (cost factor 12+)
- No password hints or recovery questions
- Rate limiting on authentication endpoints
- Account lockout after failed attempts (5 attempts, 15-minute lockout)

### **RBAC Implementation**
- Principle of least privilege for all roles
- Permission-based access control (not role-based)
- Audit logging for all permission changes
- Session timeout for inactive users
- Multi-factor authentication for admin roles

## Input Validation & Sanitization

### **API Input Validation**
- All inputs must be validated using Zod schemas
- Never trust client-side validation
- Sanitize all user inputs before processing
- Validate file uploads (type, size, content)
- Implement request size limits

### **SQL Injection Prevention**
- Use parameterized queries (Drizzle ORM)
- Never concatenate SQL strings
- Validate all database query parameters
- Use ORM-level query builders
- Implement query result type checking

### **XSS Prevention**
- Escape all user-generated content in HTML
- Use Content Security Policy headers
- Sanitize markdown content before rendering
- Validate URLs in user content
- Implement safe HTML rendering libraries

## Data Protection

### **PII Handling**
- Encrypt sensitive data at rest
- Mask sensitive data in logs
- Implement data retention policies
- Use secure data transmission (HTTPS)
- Comply with data protection regulations

### **Session Security**
- Use secure, httpOnly cookies
- Implement session timeout
- Regenerate session IDs on login
- Secure cookie flags: Secure, HttpOnly, SameSite=Strict
- Store session data server-side only

## API Security

### **Rate Limiting**
- Implement rate limiting on all public endpoints
- Different limits per user role
- IP-based rate limiting for anonymous users
- Burst protection for API endpoints
- Rate limit headers in responses

### **CORS Configuration**
- Restrict CORS origins to specific domains
- Use strict CORS policies in production
- Validate preflight requests
- No wildcard origins in production
- Secure headers for cross-origin requests

### **Security Headers**
```typescript
// Required security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
}));
```

## Frontend Security

### **Client-Side Validation**
- Implement client-side validation for UX
- Never rely on client-side validation for security
- Sanitize all user inputs before display
- Use secure form libraries with built-in validation
- Implement proper error handling

### **Secure Storage**
- Never store sensitive data in localStorage
- Use secure cookies for authentication tokens
- Implement secure session storage
- Clear sensitive data on logout
- Use memory storage for temporary data only

### **Content Security**
- Implement Content Security Policy
- Validate all external resources
- Use subresource integrity for critical resources
- Implement safe iframe policies
- Restrict dynamic code execution

## Database Security

### **Connection Security**
- Use SSL/TLS for database connections
- Implement connection pooling with secure configuration
- Rotate database credentials regularly
- Use least privilege database users
- Encrypt sensitive database columns

### **Query Security**
- Use parameterized queries exclusively
- Implement query result limits
- Validate all query parameters
- Use database-level constraints
- Implement audit logging for data changes

## Security Testing

### **Security Test Coverage**
- Authentication bypass attempts
- SQL injection vulnerabilities
- XSS attack vectors
- CSRF token validation
- Authorization boundary testing
- Input validation bypass attempts

### **Security Tools Integration**
```bash
# Security scanning
pnpm audit
npm audit --audit-level high

# Dependency vulnerability scanning
snyk test
npm ls --depth=0 | grep -v "^$"

# Static analysis
eslint --ext .js,.ts,.jsx,.tsx
```

## Security Checklist

### **Before Deployment**
- [ ] All inputs are validated and sanitized
- [ ] Authentication is properly implemented
- [ ] Authorization follows principle of least privilege
- [ ] Security headers are configured
- [ ] Rate limiting is implemented
- [ ] CORS policies are restrictive
- [ ] Database connections are secure
- [ ] Sensitive data is encrypted
- [ ] Security tests pass
- [ ] Dependency vulnerabilities are patched

### **Ongoing Monitoring**
- [ ] Security logs are monitored
- [ ] Intrusion detection is active
- [ ] Vulnerability scans run regularly
- [ ] Security patches are applied promptly
- [ ] Access logs are reviewed
- [ ] Failed authentication attempts are monitored

## Incident Response

### **Security Incident Protocol**
1. Immediate containment of affected systems
2. Assessment of incident scope and impact
3. Notification of security team and stakeholders
4. Investigation and root cause analysis
5. Implementation of security fixes
6. Post-incident review and improvements

### **Security Contact Information**
- Security team: security@apex-unified.com
- Incident response: incident@apex-unified.com
- Vulnerability reporting: security@apex-unified.com

This rule ensures comprehensive security standards are maintained across all development activities in the Apex Unified Suite.

---

## Shallow Route Handlers Rule

**File:** `.windsurf/rules/shallow-route-handlers.md`

---
trigger: always_on
---



## Core Requirement
Route handlers must contain **zero business logic** - validate input, call one service method, pass errors to global handler. Maximum 5-10 lines per handler.

## Pattern Enforcement

### Correct Route Handler Structure

```typescript
// ✅ CORRECT - Shallow route handler
router.post('/users', async (req, res, next) => {
  const result = await userService.createUser(req.body);
  
  if (result.isErr()) {
    return next(result.error); // Pass to global error handler
  }
  
  res.status(201).json(result.value);
});

// ✅ CORRECT - With input validation
router.post('/users', async (req, res, next) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error)); // Pass to global handler
  }
  
  const result = await userService.createUser(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});
```

### Prohibited Patterns

```typescript
// ❌ INCORRECT - Business logic in route handler
router.post('/users', async (req, res) => {
  // Business logic - NEVER DO THIS
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  // More business logic - NEVER DO THIS
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  
  const user = await User.create(req.body);
  res.status(201).json(user);
});

// ❌ INCORRECT - Complex error handling in route
router.post('/users', async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    
    // Complex error handling - MOVE TO GLOBAL HANDLER
    if (result.error?.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: result.error.message });
    } else if (result.error?.code === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({ error: result.error.message });
    } else if (result.error?.code === 'INTERNAL_ERROR') {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.status(201).json(result.value);
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error' });
  }
});

// ❌ INCORRECT - Multiple service calls
router.post('/orders', async (req, res) => {
  // Multiple service calls - CONSOLIDATE INTO SERVICE
  const user = await userService.findById(req.body.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const product = await productService.findById(req.body.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const order = await orderService.create({ ...req.body, user, product });
  res.status(201).json(order);
});
```

## Service Layer Responsibilities

All business logic must be in service layer:

```typescript
// ✅ CORRECT - Service contains all business logic
class UserService {
  async createUser(data: CreateUserData): Promise<Result<User, DomainError>> {
    // Input validation
    const validation = this.validateUserData(data);
    if (validation.isErr()) {
      return err(validation.error);
    }
    
    // Business rule: Check for existing user
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      return err(new DomainError('USER_ALREADY_EXISTS', 'User with this email already exists'));
    }
    
    // Business rule: Password confirmation
    if (data.password !== data.confirmPassword) {
      return err(new ValidationError('password', 'Passwords do not match'));
    }
    
    // Create user
    const user = await this.userRepository.create(data);
    return ok(user);
  }
}

class OrderService {
  async createOrder(data: CreateOrderData): Promise<Result<Order, DomainError>> {
    // Business logic: Validate user exists
    const userResult = await this.userService.findById(data.userId);
    if (userResult.isErr()) {
      return err(userResult.error);
    }
    if (!userResult.value) {
      return err(new NotFoundError('User', data.userId));
    }
    
    // Business logic: Validate product exists
    const productResult = await this.productService.findById(data.productId);
    if (productResult.isErr()) {
      return err(productResult.error);
    }
    if (!productResult.value) {
      return err(new NotFoundError('Product', data.productId));
    }
    
    // Business logic: Create order
    const order = await this.orderRepository.create({
      ...data,
      user: userResult.value,
      product: productResult.value,
    });
    
    return ok(order);
  }
}
```

## Validation Pattern

### Input Validation in Routes
Only basic input validation should be in routes:

```typescript
// ✅ CORRECT - Simple validation only
router.post('/users', async (req, res, next) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await userService.createUser(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
```

### Business Validation in Services
All business validation in services:

```typescript
class UserService {
  private validateUserData(data: CreateUserData): Result<void, DomainError> {
    // Business validation rules
    if (data.password.length < 8) {
      return err(new ValidationError('password', 'Password must be at least 8 characters'));
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      return err(new ValidationError('password', 'Password must contain uppercase, lowercase, and number'));
    }
    
    if (data.firstName.length < 2) {
      return err(new ValidationError('firstName', 'First name must be at least 2 characters'));
    }
    
    return ok(undefined);
  }
}
```

## Error Handling Pattern

### Global Error Handler
Create a global error handler that translates domain errors:

```typescript
// artifacts/api-server/src/middleware/error-handler.ts
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof DomainError) {
    const statusCode = getStatusCodeFromError(error);
    return res.status(statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Handle unexpected errors
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
};

function getStatusCodeFromError(error: DomainError): number {
  switch (error.code) {
    case 'VALIDATION_ERROR': return 400;
    case 'UNAUTHORIZED': return 401;
    case 'FORBIDDEN': return 403;
    case 'NOT_FOUND': return 404;
    case 'USER_ALREADY_EXISTS': return 409;
    case 'BUSINESS_RULE_VIOLATION': return 422;
    default: return 500;
  }
}
```

### Route Handler Error Pattern
Always use `next(error)` to pass errors to global handler:

```typescript
// ✅ CORRECT - Pass errors to global handler
router.get('/users/:id', async (req, res, next) => {
  const result = await userService.findById(req.params.id);
  
  if (result.isErr()) {
    return next(result.error); // Pass to global handler
  }
  
  if (!result.value) {
    return next(new NotFoundError('User', req.params.id));
  }
  
  res.json(result.value);
});

// ❌ INCORRECT - Handle errors locally
router.get('/users/:id', async (req, res) => {
  const result = await userService.findById(req.params.id);
  
  if (result.isErr()) {
    if (result.error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    } else {
      return res.status(500).json({ error: 'Internal error' });
    }
  }
  
  res.json(result.value);
});
```

## Route Handler Templates

### CRUD Operations

```typescript
// CREATE
router.post('/resource', async (req, res, next) => {
  const validation = createResourceSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await resourceService.create(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

// READ
router.get('/resource/:id', async (req, res, next) => {
  const result = await resourceService.findById(req.params.id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  if (!result.value) {
    return next(new NotFoundError('Resource', req.params.id));
  }
  
  res.json(result.value);
});

// UPDATE
router.put('/resource/:id', async (req, res, next) => {
  const validation = updateResourceSchema.safeParse(req.body);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await resourceService.update(req.params.id, validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

// DELETE
router.delete('/resource/:id', async (req, res, next) => {
  const result = await resourceService.delete(req.params.id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(204).send();
});

// LIST
router.get('/resource', async (req, res, next) => {
  const validation = listResourceSchema.safeParse(req.query);
  if (!validation.success) {
    return next(new ValidationError(validation.error));
  }
  
  const result = await resourceService.list(validation.data);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});
```

## Testing Requirements

### Route Handler Tests
Test route handlers are shallow:

```typescript
describe('User Routes', () => {
  describe('POST /users', () => {
    it('should call userService.createUser and return result', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const createSpy = jest.spyOn(userService, 'createUser')
        .mockResolvedValue(ok(mockUser));
      
      const response = await request(app)
        .post('/api/v1/users')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);
      
      expect(createSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      expect(response.body).toEqual(mockUser);
    });
    
    it('should pass validation errors to global handler', async () => {
      const createSpy = jest.spyOn(userService, 'createUser')
        .mockResolvedValue(err(new ValidationError('email', 'Invalid email')));
      
      const response = await request(app)
        .post('/api/v1/users')
        .send({ email: 'invalid', password: 'password123' })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid email');
    });
  });
});
```

## Common Violations and Fixes

### Business Logic in Routes
**Violation**: Business rules in route handlers
```typescript
// ❌ WRONG
router.post('/orders', async (req, res) => {
  if (req.body.amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  // ... more business logic
});
```

**Fix**: Move to service layer
```typescript
// ✅ CORRECT
router.post('/orders', async (req, res, next) => {
  const result = await orderService.createOrder(req.body);
  if (result.isErr()) return next(result.error);
  res.status(201).json(result.value);
});
```

### Multiple Service Calls
**Violation**: Multiple service calls in route
```typescript
// ❌ WRONG
router.post('/orders', async (req, res) => {
  const user = await userService.findById(req.body.userId);
  const product = await productService.findById(req.body.productId);
  // ...
});
```

**Fix**: Single service call
```typescript
// ✅ CORRECT
router.post('/orders', async (req, res, next) => {
  const result = await orderService.createOrder(req.body);
  if (result.isErr()) return next(result.error);
  res.status(201).json(result.value);
});
```

### Local Error Handling
**Violation**: Error handling in routes
```typescript
// ❌ WRONG
router.post('/users', async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    if (result.error?.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: result.error.message });
    }
    res.status(201).json(result.value);
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});
```

**Fix**: Use global error handler
```typescript
// ✅ CORRECT
router.post('/users', async (req, res, next) => {
  const result = await userService.createUser(req.body);
  if (result.isErr()) return next(result.error);
  res.status(201).json(result.value);
});
```

## Benefits

1. **Separation of Concerns**: Routes handle HTTP, services handle business logic
2. **Testability**: Routes are simple to test, business logic is isolated
3. **Maintainability**: Changes to business logic don't affect routes
4. **Consistency**: All error handling is centralized
5. **Readability**: Route handlers are easy to understand

This rule ensures clean separation between HTTP handling and business logic throughout the Apex Unified Suite.

---

## Soft Delete Standard Rule

**File:** `.windsurf/rules/soft-delete-standard.md`

---
trigger: model_decision
---



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

---

## Task Completion Constraints Rule

**File:** `.windsurf/rules/task-completion-constraints.md`

---
trigger: model_decision
description: When a task is marked done, all subtasks must be done; otherwise return TaskHasUnfinishedSubtasks. Enforce hierarchical task completion constraints.
---



## Purpose

Enforce hierarchical task completion rules where a parent task cannot be marked as `done` until all its subtasks are also completed. This prevents incomplete work from being marked as finished and ensures proper task dependency management.

## Core Constraint Logic

### Parent Task Completion Validation

**When updating a task status to `done`:**

1. **Check for Subtasks**: Query all direct subtasks of the parent task
2. **Validate Subtask Status**: Ensure all subtasks have status `done`
3. **Enforce Constraint**: If any subtask is not done, reject with `TaskHasUnfinishedSubtasks`
4. **Cascade Completion**: When parent is marked done, update project progress if applicable

### Subtask Status Validation

**When updating a subtask status:**

1. **Parent Status Check**: If marking subtask as `done`, check if this completes all siblings
2. **Auto-Complete Parent**: If all subtasks are done, automatically mark parent as `done`
3. **Progress Updates**: Update parent task's completion percentage
4. **Project Impact**: Update project progress counters if needed

## Implementation Requirements

### Service Layer Implementation

```typescript
// src/services/TaskService.ts
export class TaskService {
  async updateTaskStatus(
    taskId: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string
  ): Promise<Task> {
    return await this.db.transaction(async (tx) => {
      // Get current task with subtasks
      const taskWithSubtasks = await this.getTaskWithSubtasks(tx, taskId, tenantId);
      
      if (!taskWithSubtasks) {
        throw new NotFoundError('Task not found');
      }

      const { task, subtasks } = taskWithSubtasks;

      // Validate status transition
      this.validateStatusTransition(task.status, newStatus);

      // If marking as done, check subtasks constraint
      if (newStatus === 'done' && subtasks.length > 0) {
        const unfinishedSubtasks = subtasks.filter(subtask => subtask.status !== 'done');
        
        if (unfinishedSubtasks.length > 0) {
          throw new TaskHasUnfinishedSubtasksError(
            'Cannot mark task as done while subtasks are incomplete',
            {
              taskId,
              unfinishedSubtaskIds: unfinishedSubtasks.map(st => st.id),
              unfinishedSubtaskTitles: unfinishedSubtasks.map(st => st.title)
            }
          );
        }
      }

      // Update the task
      const updatedTask = await this.updateTaskStatusOnly(
        tx, 
        taskId, 
        newStatus, 
        tenantId, 
        updatedBy
      );

      // Handle cascading effects
      await this.handleTaskCompletionEffects(tx, updatedTask, updatedBy);

      return updatedTask;
    });
  }

  private async handleTaskCompletionEffects(
    tx: Database,
    task: Task,
    updatedBy: string
  ): Promise<void> {
    // If task was just completed, check if parent should be auto-completed
    if (task.status === 'done' && task.parent_task_id) {
      await this.checkParentAutoCompletion(tx, task.parent_task_id, updatedBy);
    }

    // Update project counters if this affects project progress
    if (task.project_id) {
      await this.updateProjectTaskCounters(tx, task.project_id, updatedBy);
    }
  }

  private async checkParentAutoCompletion(
    tx: Database,
    parentTaskId: string,
    updatedBy: string
  ): Promise<void> {
    const parentWithSubtasks = await this.getTaskWithSubtasks(tx, parentTaskId, '');
    
    if (!parentWithSubtasks) return;

    const { parent, subtasks } = parentWithSubtasks;
    const allSubtasksDone = subtasks.every(st => st.status === 'done');

    if (allSubtasksDone && parent.status !== 'done') {
      await this.updateTaskStatusOnly(tx, parentTaskId, 'done', '', updatedBy);
      
      // Recursively check if this completes the parent's parent
      if (parent.parent_task_id) {
        await this.checkParentAutoCompletion(tx, parent.parent_task_id, updatedBy);
      }
    }
  }

  private async getTaskWithSubtasks(
    tx: Database,
    taskId: string,
    tenantId: string
  ): Promise<{ task: Task; subtasks: Task[] } | null> {
    const task = await tx
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.id, taskId),
        tenantId ? eq(tasks.tenant_id, tenantId) : sql`1=1`
      ))
      .limit(1);

    if (!task[0]) return null;

    const subtasks = await tx
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.parent_task_id, taskId),
        eq(tasks.tenant_id, task[0].tenant_id)
      ))
      .orderBy(tasks.sort_order);

    return { task: task[0], subtasks };
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'todo': ['in_progress', 'cancelled'],
      'in_progress': ['done', 'blocked', 'cancelled'],
      'blocked': ['in_progress', 'cancelled'],
      'done': [], // Terminal state
      'cancelled': ['todo', 'in_progress'] // Can be reactivated
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new InvalidTaskStatusTransitionError(
        `Cannot transition task from ${currentStatus} to ${newStatus}`
      );
    }
  }
}
```

### Domain Error Class

```typescript
export class TaskHasUnfinishedSubtasksError extends DomainError {
  constructor(
    message: string,
    public readonly details: {
      taskId: string;
      unfinishedSubtaskIds: string[];
      unfinishedSubtaskTitles: string[];
    }
  ) {
    super('TASK_HAS_UNFINISHED_SUBTASKS', message, details);
  }
}

export class InvalidTaskStatusTransitionError extends DomainError {
  constructor(message: string) {
    super('INVALID_TASK_STATUS_TRANSITION', message);
  }
}
```

### API Endpoint Implementation

```typescript
// src/routes/tasks.ts
router.patch('/:id/status', validateRequest(updateTaskStatusSchema), async (req, res, next) => {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.body.status,
      req.tenant.id,
      req.user.id
    );

    res.json({ task });
  } catch (error) {
    if (error instanceof TaskHasUnfinishedSubtasksError) {
      return res.status(422).json({
        error: error.message,
        code: error.code,
        details: {
          taskId: error.details.taskId,
          unfinishedSubtasks: error.details.unfinishedSubtaskIds.map((id, index) => ({
            id,
            title: error.details.unfinishedSubtaskTitles[index]
          }))
        },
        suggestions: [
          'Complete all subtasks first',
          'Move unfinished subtasks to a different parent task',
          'Cancel the subtasks if they are no longer needed'
        ],
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});
```

### Database Schema Support

```sql
-- Tasks table with hierarchical support
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  sort_order INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assignee_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for hierarchical queries
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);

-- Prevent circular references using trigger
CREATE OR REPLACE FUNCTION prevent_circular_task_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if we're creating a circular reference
  IF NEW.parent_task_id IS NOT NULL THEN
    -- Recursive CTE to check for circular references
    WITH RECURSIVE task_hierarchy AS (
      SELECT id, parent_task_id, 1 as level
      FROM tasks 
      WHERE id = NEW.parent_task_id
      
      UNION ALL
      
      SELECT t.id, t.parent_task_id, th.level + 1
      FROM tasks t
      INNER JOIN task_hierarchy th ON t.id = th.parent_task_id
      WHERE th.level < 10 -- Prevent infinite recursion
    )
    SELECT 1 FROM task_hierarchy WHERE id = NEW.id;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Circular task reference detected';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_circular_references
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_task_references();
```

### Frontend Integration

```typescript
// React component for task status update
export const TaskStatusUpdate: React.FC<{ task: Task }> = ({ task }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateTaskStatus(task.id, newStatus);
      
      if (newStatus === 'done') {
        // Show success message
        toast.success('Task completed successfully!');
      }
    } catch (error) {
      if (error instanceof TaskHasUnfinishedSubtasksError) {
        setError(`Cannot complete task: ${error.details.unfinishedSubtaskTitles.length} subtasks remain unfinished`);
        // Show subtasks that need completion
        showUnfinishedSubtasksDialog(error.details);
      } else {
        setError('Failed to update task status');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <select
        value={task.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className="task-status-select"
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
        <option value="cancelled">Cancelled</option>
      </select>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

**Test constraint enforcement:**

```typescript
describe('Task Completion Constraints', () => {
  test('should prevent parent completion when subtasks exist', async () => {
    // Create parent task with subtasks
    const parent = await createTask({ title: 'Parent Task' });
    const subtask1 = await createTask({ 
      title: 'Subtask 1', 
      parentTaskId: parent.id,
      status: 'done'
    });
    const subtask2 = await createTask({ 
      title: 'Subtask 2', 
      parentTaskId: parent.id,
      status: 'in_progress'
    });

    // Try to mark parent as done
    await expect(
      taskService.updateTaskStatus(parent.id, 'done', tenantId, userId)
    ).rejects.toThrow(TaskHasUnfinishedSubtasksError);
  });

  test('should allow parent completion when all subtasks are done', async () => {
    // Create parent task with completed subtasks
    const parent = await createTask({ title: 'Parent Task' });
    await createTask({ 
      title: 'Subtask 1', 
      parentTaskId: parent.id,
      status: 'done'
    });
    await createTask({ 
      title: 'Subtask 2', 
      parentTaskId: parent.id,
      status: 'done'
    });

    // Mark parent as done - should succeed
    const updated = await taskService.updateTaskStatus(parent.id, 'done', tenantId, userId);
    expect(updated.status).toBe('done');
  });

  test('should auto-complete parent when last subtask is completed', async () => {
    // Create parent task with almost complete subtasks
    const parent = await createTask({ title: 'Parent Task' });
    await createTask({ 
      title: 'Subtask 1', 
      parentTaskId: parent.id,
      status: 'done'
    });
    const subtask2 = await createTask({ 
      title: 'Subtask 2', 
      parentTaskId: parent.id,
      status: 'in_progress'
    });

    // Complete last subtask
    await taskService.updateTaskStatus(subtask2.id, 'done', tenantId, userId);

    // Parent should be auto-completed
    const updatedParent = await taskService.findById(parent.id, tenantId);
    expect(updatedParent?.status).toBe('done');
  });
});
```

### Integration Tests

**Test hierarchical scenarios:**

1. **Multi-level hierarchies**: Test 3+ levels of task nesting
2. **Concurrent updates**: Test simultaneous subtask updates
3. **Project progress**: Verify project counters update correctly
4. **Circular reference prevention**: Test database constraints

### Edge Cases

**Test these scenarios:**

1. **Empty subtasks**: Parent with no subtasks can be completed
2. **Cancelled subtasks**: Cancelled subtasks don't block parent completion
3. **Deep hierarchies**: Test performance with many nesting levels
4. **Status validation**: Test invalid status transitions

## Performance Considerations

### Query Optimization

```typescript
// Efficient query for checking subtask completion
private async areAllSubtasksCompleted(
  tx: Database,
  parentTaskId: string,
  tenantId: string
): Promise<boolean> {
  const result = await tx
    .select({ count: sql<number>`COUNT(*)` })
    .from(tasks)
    .where(and(
      eq(tasks.parent_task_id, parentTaskId),
      eq(tasks.tenant_id, tenantId),
      sql`${tasks.status} != 'done'`
    ))
    .limit(1);

  return result[0].count === 0;
}
```

### Caching Strategy

- Cache task hierarchy for frequently accessed projects
- Invalidate cache when task status changes
- Use database triggers for real-time updates

## Enforcement Checklist

- [ ] Parent task completion validates all subtasks are done
- [ ] Subtask completion triggers parent auto-completion
- [ ] Proper error handling with TaskHasUnfinishedSubtasks
- [ ] Database constraints prevent circular references
- [ ] Status transition validation is implemented
- [ ] Project progress counters update correctly
- [ ] Frontend shows clear error messages
- [ ] Comprehensive test coverage for all scenarios
- [ ] Performance optimization for hierarchical queries
- [ ] Audit logging for task completion events
- [ ] API responses include helpful error details
- [ ] Recursive auto-completion works for multi-level hierarchies

---

## Tech Stack Rules

**File:** `.windsurf/rules/tech-stack.md`

---
trigger: always_on
---



This project uses a locked tech stack optimized for pnpm workspace monorepo architecture on Replit. Do not deviate from these technologies:

<!-- SECTION: core_technologies -->

<core_technologies>
- **Monorepo**: pnpm workspaces with TypeScript 5.9.2
- **Frontend**: React 19.1.0 + TypeScript (Vite 7.3.2 build tool)
- **UI Framework**: Tailwind CSS v4.1.14 + shadcn/ui (55+ components)
- **State Management**: TanStack Query v5.90.21 for server state
- **Routing**: Wouter (lightweight alternative to React Router)
- **Backend**: Express 5 + esbuild 0.27.3 with ESM modules
- **Database**: PostgreSQL + Drizzle ORM 0.45.2
- **Validation**: Zod 3.25.76 with auto-generated schemas
- **Code Generation**: Orval 8.5.2 for OpenAPI to TypeScript/Zod
- **Animations**: Framer Motion 11.0.0 (not motion library)
- **Platform**: Replit Autoscaling deployment with Node.js 24
</core_technologies>

<!-- ENDSECTION: core_technologies -->

<!-- SECTION: monorepo_structure -->

<monorepo_structure>
- **Package Manager**: pnpm with centralized catalog in pnpm-workspace.yaml
- **Workspace Pattern**: artifacts/*, lib/*, lib/integrations/*, scripts/*
- **Shared Dependencies**: React 19.1.0, TypeScript 5.9.2, Vite 7.3.2, Tailwind 4.1.14
- **Build System**: Parallel builds with esbuild (backend) and Vite (frontend)
- **Type Safety**: End-to-end from OpenAPI spec to frontend via code generation
- **Security**: Supply chain protection with 1440min release age requirement
</monorepo_structure>

<!-- ENDSECTION: monorepo_structure -->

<!-- SECTION: api_first_development -->

<api_first_development>
- **OpenAPI Spec**: Single source of truth in lib/api-spec/openapi.yaml
- **Code Generation**: Orval generates React Query hooks and Zod schemas
- **Generated Packages**: 
  - lib/api-client-react: Auto-generated TanStack Query hooks
  - lib/api-zod: Auto-generated Zod validation schemas
- **Workflow**: Update OpenAPI → Run codegen → Use generated types
- **Type Safety**: Database → Zod → API → Frontend (end-to-end)
</api_first_development>

<!-- ENDSECTION: api_first_development -->

<!-- SECTION: replit_specific_requirements -->

<replit_specific_requirements>
- **Deployment**: Replit Autoscaling with Node.js 24 runtime
- **Development Plugins**: Cartographer, Dev Banner, Runtime Error Modal
- **Environment Variables**: PORT and BASE_PATH required with validation
- **Build Process**: Post-build pnpm store pruning for optimization
- **Port Mapping**: Internal 23379 → External 80
- **Git Hooks**: Post-merge hook for dependency installation and DB push
- **Platform Exclusions**: Extensive package filtering for security and size
</replit_specific_requirements>

<!-- ENDSECTION: replit_specific_requirements -->

<!-- SECTION: strict_constraints -->

<strict_constraints>
- **Routing**: Use Wouter, NOT React Router v6
- **Animations**: Use framer-motion, NOT motion library
- **Package Manager**: Use pnpm workspaces, NOT npm/yarn
- **Build Tools**: Use esbuild for backend, Vite for frontend
- **Code Generation**: Never modify generated files in lib/api-client-react or lib/api-zod
- **Database**: Use Drizzle ORM with Zod schemas, NOT Prisma or TypeORM
- **Deployment**: Use Replit configuration, NOT Vercel/Netlify configs
- **API Development**: API-first approach with OpenAPI spec, NOT direct implementation
- **TypeScript**: Use project references with tsconfig.json, NOT single tsconfig
- **Security**: Follow pnpm-workspace.yaml security policies, NOT bypass them
</strict_constraints>

<!-- ENDSECTION: strict_constraints -->

<!-- SECTION: component_requirements -->
<component_requirements>
- **Frontend Components**: Use shadcn/ui components as base (55+ available)
- **State Management**: Use generated TanStack Query hooks from @workspace/api-client-react
- **Styling**: Use Tailwind CSS v4 with glass-card utility for morphism effects
- **Animations**: Use Framer Motion with PageTransition wrapper
- **Data**: Use static data in src/data/ for marketing content, API for dynamic data
- **TypeScript**: All components must use TypeScript with proper typing
- **Path Aliases**: Use @/ for src imports, @assets/ for attached_assets (when implemented)
</component_requirements>
<!-- ENDSECTION: component_requirements -->

---

## Testing Requirements

**File:** `.windsurf/rules/testing-requirements.md`

---
trigger: model_decision
description: Guidelines for comprehensive testing requirements including unit, integration, and E2E tests
---



Enforce comprehensive testing standards for all code changes in the Apex Unified Suite.

## When This Rule Applies

Cascade should reference this rule when:
- Implementing new features or components
- Modifying existing business logic
- Adding API endpoints
- Making significant UI changes
- During code reviews

## Testing Pyramid Requirements

### **Unit Tests (Vitest)**
- All pure functions must have unit tests
- React components must have tests with React Testing Library
- Hooks must be tested individually
- Utility functions require 100% coverage

### **Integration Tests**
- API endpoints must have integration tests with database
- Component integration with React Query hooks
- Cross-module interactions must be tested
- Database operations require test coverage

### **E2E Tests (Playwright)**
- Critical user workflows must have E2E tests
- Authentication flows require full coverage
- Business processes (CRM, Projects, Finance) need E2E validation
- Cross-browser testing required for critical paths

## Coverage Requirements

### **Minimum Coverage Thresholds**
- **Unit Tests**: 80% line coverage, 80% branch coverage
- **Integration Tests**: 90% line coverage for API endpoints
- **E2E Tests**: 100% coverage for critical user journeys

### **Critical Path Coverage**
- Authentication: login, logout, session management
- CRUD operations: create, read, update, delete for all modules
- Error handling: validation errors, server errors, network failures
- Performance: loading states, error boundaries, retry logic

## Test File Organization

### **File Structure**
```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── services/
├── integration/
│   ├── api/
│   └── database/
├── e2e/
│   ├── auth.spec.ts
│   ├── crm.spec.ts
│   ├── projects.spec.ts
│   └── finance.spec.ts
└── fixtures/
    ├── mockData.ts
    └── testUtils.ts
```

### **Naming Conventions**
- Unit tests: `ComponentName.test.tsx` or `functionName.test.ts`
- Integration tests: `moduleName.test.ts`
- E2E tests: `featureName.spec.ts`
- Fixtures: descriptive names like `mockUsers.ts`, `testContacts.ts`

## Testing Patterns

### **Component Testing**
```typescript
// ✅ Correct pattern
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CRMPage } from '@/pages/CRM';

describe('CRM Page', () => {
  test('renders contacts list', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CRMPage />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### **API Testing**
```typescript
// ✅ Correct pattern
import request from 'supertest';
import { app } from '../src/app';
import { db } from '@workspace/db';
import { contactsTable } from '@workspace/db/schema';

describe('Contacts API', () => {
  beforeEach(async () => {
    await db.delete(contactsTable);
  });

  it('should create contact', async () => {
    const response = await request(app)
      .post('/api/crm/contacts')
      .send(validContactData)
      .expect(201);
      
    expect(response.body.data.email).toBe(validContactData.email);
  });
});
```

### **E2E Testing**
```typescript
// ✅ Correct pattern
import { test, expect } from '@playwright/test';

test('should allow user to create contact', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.goto('/crm');
  await page.click('button:has-text("Add Contact")');
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button:has-text("Create")');
  
  await expect(page.getByText('Contact created successfully')).toBeVisible();
});
```

## Anti-Patterns

❌ **Never** implement features without tests
❌ **Never** use `test.skip` without justification
❌ **Never** mock entire modules when unit testing
❌ **Never** test implementation details instead of behavior
❌ **Never** ignore test failures in CI/CD

## Quality Gates

### **Before Commit**
- All new code must have corresponding tests
- Test coverage must meet minimum thresholds
- All tests must pass locally
- No `test.skip` or `test.only` in committed code

### **CI/CD Requirements**
- Unit tests run on every PR
- Integration tests run on every merge
- E2E tests run on main branch
- Coverage reports generated and archived
- Performance tests for critical paths

## Testing Commands

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage

# Run tests with coverage thresholds
pnpm test:coverage --threshold
```

## Testing Checklist

- [ ] Unit tests written for new functions
- [ ] Component tests cover user interactions
- [ ] Integration tests cover API endpoints
- [ ] E2E tests cover critical workflows
- [ ] Mock data is realistic and comprehensive
- [ ] Tests are maintainable and readable
- [ ] Coverage thresholds are met
- [ ] No test failures in CI/CD

This rule ensures comprehensive testing coverage across all layers of the Apex Unified Suite.

---

## TypeScript Strict Mode Rules

**File:** `.windsurf/rules/typescript-strict-mode.md`

---
trigger: always_on
---



## Purpose
Enforce strict TypeScript configuration for production-ready code quality and type safety across the Apex Unified Suite monorepo.

## Current State
- `tsconfig.base.json` has relaxed flags for prototyping
- Strict flags are disabled: `noImplicitOverride: false`, `noUnusedLocals: false`, `strictFunctionTypes: false`
- This must be enabled for production deployment

## Required Configuration

### Strict Mode Settings
Enable these flags in `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Implementation Steps

1. Update `tsconfig.base.json` with strict flags
2. Run `pnpm typecheck` to identify errors
3. Fix all TypeScript errors systematically
4. Verify all packages pass type checking

## Error Resolution Patterns

### Common Issues and Solutions
- **Unused variables**: Remove or prefix with underscore
- **Implicit any**: Add explicit type annotations
- **Missing returns**: Add explicit return statements
- **Function type mismatches**: Fix parameter/return types

### Migration Strategy
- Fix files in dependency order (lib → artifacts)
- Address one error type at a time
- Use `// @ts-ignore` sparingly and with justification

## Quality Gates
- All packages must pass `pnpm typecheck`
- Zero `any` types in new code
- All functions have explicit return types
- No unused imports or variables

## Enforcement
This rule is always active and will guide TypeScript configuration decisions during development.

---

## Visual Identity Rules

**File:** `.windsurf/rules/visual-identity.md`

---
trigger: always_on
---



Follow these visual design guidelines for all components:

<!-- SECTION: color_scheme -->

<color_scheme>
- Base backgrounds: #050507 (slightly blue-shifted near-black) and #0a0a0a
- Card surfaces: Deep charcoal (#111111, #1a1a1a)
- Accent color: Electric blue (#0066ff → #00aaff gradient)
- Accent uses: CTAs, focus rings, active nav, status pulses
</color_scheme>

<!-- ENDSECTION: color_scheme -->

<!-- SECTION: typography -->

<typography>
- Font: Inter or system-ui
- Base size: 14px
- Line height: Generous for readability
- Headings: Tight letter-spacing
</typography>

<!-- ENDSECTION: typography -->

<!-- SECTION: glass_panels -->

<glass_panels>
- Use backdrop-blur-md on selected shell surfaces (main frame, drawer surfaces, command palette, hero cards)
- Add noise-overlay utility only for these glass shell surfaces
- Background: bg-white/5
- Border: border border-white/10
- Rounded corners: rounded-xl
- Ordinary content cards use quieter dark surface (bg-[#111111])
</glass_panels>

<!-- ENDSECTION: glass_panels -->

<!-- SECTION: motion -->

<motion>
- Transition duration: 150ms
- Easing: ease-out
- Apply to all interactive elements
- Use skeleton loaders on every data fetch
- Add animated pulse on live status indicators
- Respect prefers-reduced-motion media query
- See motion-hierarchy.md for Alive/Quiet/Static categorization
</motion>

<!-- ENDSECTION: motion -->

<!-- SECTION: layout_structure -->

<layout_structure>
- Fixed left sidebar: 64px collapsed / 240px expanded
- Scrollable main content area
- Collapsible right utility panel: 320px
- Persistent bottom status bar: 32px
</layout_structure>

<!-- ENDSECTION: layout_structure -->

---

## Vite Configuration Rules

**File:** `.windsurf/rules/vite-config.md`

---
trigger: always_on
---



This project uses Vite 7.3.2 with Replit-specific optimizations and conditional plugin loading. Follow these configuration patterns.

<!-- SECTION: project_setup -->

<project_setup>
- Use Vite 7.3.2 for React 19.1.0 + TypeScript projects
- Configure path aliases in vite.config.ts for clean imports
- Use @/ alias for src directory imports, @assets/ for attached_assets
- Validate required environment variables (PORT, BASE_PATH) with error throwing
- Conditional loading of Replit development plugins based on NODE_ENV and REPL_ID
</project_setup>

<!-- ENDSECTION: project_setup -->

<!-- SECTION: configuration_structure -->

<configuration_structure>

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Environment variable validation
const rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;
if (!basePath) {
  throw new Error("BASE_PATH environment variable is required but was not provided.");
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
```

</configuration_structure>

<!-- ENDSECTION: configuration_structure -->

<!-- SECTION: replit_plugins -->

<replit_plugins>
- **Cartographer**: Workspace mapping tool with root path resolution
- **Dev Banner**: Development environment indicator for Replit
- **Runtime Error Modal**: Enhanced error display for debugging
- **Conditional Loading**: Only load when NODE_ENV !== "production" and REPL_ID !== undefined
- **Performance**: Plugins excluded from production builds for optimization
</replit_plugins>

<!-- ENDSECTION: replit_plugins -->

<!-- SECTION: environment_validation -->

<environment_validation>
- **Required Variables**: PORT and BASE_PATH must be defined
- **PORT Validation**: Must be a valid number (NaN check)
- **BASE_PATH Validation**: Must be a non-empty string
- **Error Handling**: Vite config throws descriptive errors for missing/invalid variables
- **Development vs Production**: Different validation rules for each environment
</environment_validation>

<!-- ENDSECTION: environment_validation -->

<!-- SECTION: tsconfig_paths -->

<tsconfig_paths>

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@assets/*": ["../attached_assets/*"]
    }
  }
}
```

</tsconfig_paths>

<!-- ENDSECTION: tsconfig_paths -->

<!-- SECTION: environment_variables -->

<environment_variables>
- **Required**: PORT (server port), BASE_PATH (routing base)
- **Optional**: NODE_ENV (development/production), REPL_ID (Replit identifier)
- **Access**: import.meta.env.VITE_VARIABLE_NAME for VITE_ prefixed variables
- **Process**: process.env for Node.js environment variables
- **Validation**: Required variables validated in Vite config
</environment_variables>

<!-- ENDSECTION: environment_variables -->

<!-- SECTION: replit_deployment -->

<replit_deployment>
- **Autoscaling**: Automatic port mapping from internal to external (23379 → 80)
- **Build Output**: dist/public directory for static assets
- **Node.js Runtime**: Optimized for Node.js 24 with ES modules
- **Post-Build**: Automatic pnpm store pruning for smaller images
- **Environment**: Replit provides PORT and other runtime variables
</replit_deployment>

<!-- ENDSECTION: replit_deployment -->

<!-- SECTION: build_optimization -->

<build_optimization>
- **Source Maps**: Enabled for debugging (hidden in production)
- **Manual Chunks**: vendor and UI libraries separated
- **Tree Shaking**: Automatic unused code elimination
- **Output Directory**: dist/public for Replit deployment
- **Empty OutDir**: Clean builds every time
- **Asset Optimization**: Proper naming and caching strategies
</build_optimization>

<!-- ENDSECTION: build_optimization -->

<!-- SECTION: dev_server -->

<dev_server>
- **Port Configuration**: PORT environment variable with fallback to 3000
- **Host**: 0.0.0.0 for Replit network access
- **Strict Port**: Ensures port availability or fails fast
- **Allowed Hosts**: True for flexible Replit deployment
- **Hot Reload**: Automatic with Vite HMR
</dev_server>

<!-- ENDSECTION: dev_server -->

<!-- SECTION: strict_constraints -->

<strict_constraints>
- **Framework**: Use Vite, NOT Next.js, Remix, or any SSR framework
- **Build Output**: Static SPA bundles in dist/public
- **Replit Specific**: Use Replit plugins and configurations, NOT Vercel/Netlify
- **Environment Variables**: Validate required variables, don't assume they exist
- **Path Aliases**: Use @/ for src, @assets/ for attached_assets
- **Plugins**: Conditional loading of Replit development plugins
</strict_constraints>

<!-- ENDSECTION: strict_constraints -->

---

## Webhook Security Rule

**File:** `.windsurf/rules/webhook-security.md`

---
trigger: model_decision
description: Phase 4 has a SignWell webhook receiver. A rule must enforce HMAC signature verification and webhook-idempotency (store processed webhook IDs).
---



## Purpose

Enforce strict security for all webhook endpoints, particularly the SignWell webhook receiver. Must enforce HMAC signature verification and implement webhook-idempotency by storing processed webhook IDs to prevent duplicate processing.

## Core Security Requirements

### HMAC Signature Verification

**All webhook endpoints must:**

1. **Verify Signature**: Validate HMAC signature using shared secret
2. **Check Timestamp**: Ensure request is within acceptable time window
3. **Validate Body**: Ensure body content matches signature
4. **Replay Attack Prevention**: Prevent replay attacks with timestamp checks

### Webhook ID Management

**Idempotency requirements:**

1. **Store Processed IDs**: Track all successfully processed webhook IDs
2. **Duplicate Prevention**: Reject duplicate webhook IDs with 409 status
3. **Cleanup**: Clean up old processed IDs periodically
4. **Audit Trail**: Log all webhook processing attempts

## Implementation Requirements

### Webhook Signature Verification Service

```typescript
// src/services/WebhookSecurityService.ts
export class WebhookSecurityService {
  constructor(
    private webhookConfig: WebhookConfig
  ) {}

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    algorithm: string,
    timestamp: string,
    nonce?: string
  ): Promise<boolean> {
    try {
      // Get the appropriate secret for the algorithm
      const secret = this.getSecret(algorithm);
      
      // Create the expected signature
      const expectedSignature = crypto
        .createHmac(secret, payload, algorithm)
        .digest('hex');

      // Compare signatures
      const providedSignature = Buffer.from(signature, 'hex');
      const expectedSignatureHex = Buffer.from(expectedSignature, 'hex');

      return crypto.timingSafeEqual(
        providedSignature,
        expectedSignatureHex
      );
    } catch (error) {
      return false;
    }
  }

  private getSecret(algorithm: string): string {
    const secrets = this.webhookConfig.secrets;
    
    switch (algorithm) {
      case 'sha256':
        return secrets.sha256;
      case 'sha1':
        return secrets.sha1;
      case 'hmac-sha256':
        return secrets.hmacSha256;
      default:
        throw new Error(`Unsupported signature algorithm: ${algorithm}`);
    }
  }

  async validateTimestamp(
    timestamp: string,
    maxAgeSeconds: number = 300 // 5 minutes default
  ): Promise<boolean> {
    try {
      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      
      const timeDiff = Math.abs(currentTime - requestTime);
      
      return timeDiff <= maxAgeSeconds;
    } catch (error) {
      return false;
    }
  }

  async validateBodyIntegrity(
    payload: string,
    signature: string,
    algorithm: string,
    timestamp: string
  ): Promise<boolean> {
    try {
      // Recreate the signature to validate body integrity
      const expectedSignature = crypto
        .createHmac(this.getSecret(algorithm), payload, algorithm)
        .digest('hex');

      const providedSignature = Buffer.from(signature, 'hex');
      const expectedSignatureHex = Buffer.from(expectedSignature, 'hex');

      return crypto.timingSafeEqual(
        providedSignature,
        expectedSignatureHex
      );
    } catch (error) {
      return false;
    }
  }
}
```

### Webhook ID Management Service

```typescript
// src/services/WebhookIdempotencyService.ts
export class WebhookIdempotencyService {
  constructor(
    private db: Database,
    private cleanupDays: number = 30 // Keep records for 30 days
  ) {}

  async isProcessed(
    webhookId: string,
    tenantId: string
  ): Promise<boolean> {
    const record = await this.db
      .select()
      .from(processed_webhooks)
      .where(and(
        eq(processed_webhooks.webhook_id, webhookId),
        eq(processed_webhooks.tenant_id, tenantId),
        eq(processed_webhooks.processed, true)
      ))
      .limit(1);

    return record.length > 0;
  }

  async markAsProcessed(
    webhookId: string,
    tenantId: string,
    requestHeaders: Record<string, string>,
    requestBody: string,
    responseStatus: number,
    responseBody: string
  ): Promise<void> {
    await this.db.insert(processed_webhooks).values({
      webhookId,
      tenantId,
      requestHeaders,
      requestBody: requestBody,
      responseStatus,
      responseBody,
      processedAt: new Date(),
      processed: true
    }).onConflict(() => {
      // Handle duplicate ID gracefully
      console.warn(`Duplicate webhook ID: ${webhookId}`);
    });
  }

  async cleanupOldProcessedIds(
    tenantId: string
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupDays);

    const deletedCount = await this.db
      .delete(processed_webhooks)
      .where(and(
        eq(processed_webhooks.tenant_id, tenantId),
        eq(processed_webhooks.processed, true),
        lt(processed_webhooks.processed_at, cutoffDate)
      ));

    return deletedCount;
  }

  async getProcessedWebhooks(
    tenantId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ProcessedWebhook[]> {
    return await this.db
      .select({
        id: processed_webhooks.id,
        webhookId: processed_webhooks.webhook_id,
        requestHeaders: processed_webhooks.request_headers,
        requestBody: processed_webhooks.request_body,
        responseStatus: processed_webhooks.response_status,
        responseBody: processed_webhooks.response_body,
        processedAt: processed_webhooks.processed_at,
        createdAt: processed_webhooks.created_at
      })
      .where(and(
        eq(processed_webhooks.tenant_id, tenantId),
        eq(processed_webhooks.processed, true)
      ))
      .orderBy(desc(processed_webhooks.processed_at))
      .limit(limit)
      .offset(offset);
  }
}
```

### Webhook Receiver Implementation

```typescript
// src/controllers/WebhookController.ts
export class WebhookController {
  constructor(
    private webhookSecurityService: WebhookService,
    private webhookIdempotencyService: WebhookIdempotencyService,
    private invoiceService: InvoiceService
  ) {}

  async handleSignWellWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers['x-signature'];
      const timestamp = req.headers['x-timestamp'];
      const algorithm = req.headers['x-algorithm'];
      const body = req.body;

      // Verify signature
      const isValid = await this.webhookSecurityService.verifyWebhookSignature(
        body,
        signature,
        algorithm,
        timestamp
      );

      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      // Validate timestamp
      const isTimestampValid = await this.webhookSecurityService.validateTimestamp(
        timestamp
      );

      if (!isTimestampValid) {
        return res.status(401).json({
          error: 'Request timestamp too old',
          code: 'EXPIRED_TIMESTAMP'
        });
      }

      // Validate body integrity
      const isBodyValid = await this.webhookSecurityService.validateBodyIntegrity(
        body,
        signature,
        algorithm,
        timestamp
      );

      if (!isBodyValid) {
        return res.status(400).json({
          error: 'Body integrity check failed',
          code: 'INVALID_BODY'
        }));
      }

      // Check for duplicate webhook ID
      const webhookId = req.headers['x-webhook-id'];
      const isDuplicate = await this.webhookIdempotencyService.isProcessed(
        webhookId,
        req.tenantId
      );

      if (isDuplicate) {
        return res.status(409).json({
          error: 'Webhook already processed',
          code: 'DUPLICATE_WEBHOOK',
          webhookId
        }));
      }

      // Process the webhook
      const result = await this.processSignWellWebhook(
        body,
        req.headers,
        req.ip
      );

      // Mark as processed
      await this.webhookIdempotencyService.markAsProcessed(
        webhookId,
        req.tenantId,
        req.headers,
        body,
        result.status,
        result.body,
        result.headers
      );

      res.status(result.status).json(result.body);

    } catch (error) {
      console.error('Webhook processing failed:', error);
      next(error);
    }
  }

  private async processSignWellWebhook(
    body: string,
    headers: Record<string, string>,
    ipAddress: string
  ): Promise<WebhookResult> {
    try {
      // Parse the invoice data from webhook payload
      const invoiceData = JSON.parse(body);

      // Validate invoice data
      const validation = await this.invoiceService.validateInvoiceData(invoiceData);
      if (!validation.isValid) {
        throw new Error('Invalid invoice data');
      }

      // Create or update invoice
      const invoice = await this.invoiceService.upsertInvoice(invoiceData);

      // Send confirmation email
      await this.sendConfirmationEmail(invoice.id, invoiceData);

      return {
        status: 200,
        body: JSON.stringify({
          id: invoice.id,
          status: invoice.status,
          message: 'Invoice processed successfully'
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': headers['x-webhook-id']
        }
      };
    } catch (error) {
      return {
        status: 400,
        body: JSON.stringify({
          error: 'Webhook processing failed',
          details: error.message
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': headers['x-webhook-id']
        }
      };
    }
  }
}
```

### API Endpoint Implementation

```typescript
// src/routes/webhooks.ts
import { webhookAuthMiddleware } from '../middleware/webhook-auth';
import { webhookSecurityService } from '../services/WebhookService';

// Apply webhook auth to all webhook routes
router.use(webhookAuthMiddleware);

// POST /api/webhooks/signwell
router.post('/signwell', async (req, res, next) => {
  try {
    const result = await webhookController.handleSignWellWebhook(req, res);
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

// POST /api/webhooks/quickbooks
router.post('/quickbooks', async (req, res, next) => {
  try {
    const result = await webhookController.handleQuickBooksWebhook(req, res);
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

// GET /api/webhooks/processed
router.get('/processed', async (req, res, next) => {
  try {
    const processed = await webhookIdempotencyService.getProcessedWebhooks(
      req.tenant.id,
      parseInt(req.query.limit as string) || 50
    );

    res.json({
      processed,
      total: processed.length
    });
  } catch (error) {
    next(error);
  }
});
```

### Domain Error Classes

```typescript
export class WebhookSecurityError extends DomainError {
  constructor(message: string, public readonly details?: any) {
    super('WEBHOOK_SECURITY_ERROR', message, details);
  }
}

export class DuplicateWebhookError extends WebhookSecurityError {
  constructor(webhookId: string) {
    super('DUPLICATE_WEBHOOK', `Webhook ${webhookId} already processed`, {
      webhookId
    });
  }

export class InvalidWebhookSignatureError extends WebhookSecurityError {
  constructor(details: { algorithm: string; timestamp: string }) {
    super('INVALID_WEBHOOK_SIGNATURE', 'Invalid webhook signature', {
      algorithm,
      timestamp
    });
  }

export class ExpiredWebhookError extends WebhookError {
  constructor(timestamp: string, maxAge: number) {
    super('EXPIRED_WEBHOOK', `Webhook timestamp ${timestamp} expired (max age: ${maxAge}s)`);
  }
}
```

### Database Schema Support

```sql
-- Processed webhooks table
CREATE TABLE processed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  webhook_id VARCHAR(255) NOT NULL UNIQUE,
  request_headers JSONB NOT NULL,
  request_body TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body TEXT,
  response_headers JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_processed_webhooks_unique ON processed_webhooks(webhook_id, tenant_id);
CREATE INDEX idx_processed_webhooks_tenant ON processed_webhooks(tenant_id);
CREATE INDEX idx_processed_webhooks_processed_at ON processed_webhooks(processed_at);

-- Webhook configuration table
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  webhook_name VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(500) NOT NULL,
  secret_key VARCHAR(255) NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'sha256',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for efficient webhook queries
CREATE INDEX idx_webhook_configs_tenant_active ON webhook_configs(tenant_id, webhook_name);
CREATE INDEX idx_webhook_configs_name ON webhook_configs(webhook_name, is_active);
```

## Testing Requirements

### Unit Tests

**Test signature verification:**

```typescript
describe('Webhook Security', () => {
  test('should verify valid SignWell signature', async () => {
    const payload = JSON.stringify({
      id: 'inv-123',
      amount: 1250.00,
      date: '2026-01-15T12:00:00Z'
    });

    const signature = crypto
      .createHmac('secret-key', payload, 'sha256')
      .digest('hex');

    const isValid = await webhookSecurityService.verifyWebhookSignature(
      payload,
      signature,
      'sha256',
      '16432176095' // Mock timestamp
    );

    expect(isValid).toBe(true);
  });

  test('should reject expired timestamp', async () => {
    const oldTimestamp = '1643217595';
    const signature = crypto
      .createHmac('secret-key', payload, 'sha256')
      .digest('hex');

    const isValid = await webhookSecurityService.validateTimestamp(oldTimestamp, 60); // 1 minute max age

    expect(isValid).toBe(false);
  });

  test('should reject invalid signature algorithm', async () => {
      const signature = crypto
        .createHmac('wrong-key', payload, 'sha256')
        .digest('hex');

      const isValid = await webhookSecurityService.verifyWebhookSignature(
        payload,
        signature,
        'sha256',
        '16432176095'
      );

    expect(isValid).toBe(false);
  });
});
```

### Integration Tests

**Test end-to-end webhook workflow:**

1. **Signature Verification**: Complete signature validation flow
2. **Idempotency**: Duplicate handling and cleanup
3. **Processing**: End-to-end webhook processing
4. **Error Handling**: Invalid signatures and expired timestamps

### Security Tests

**Test security scenarios:**

1. **Replay Attacks**: Timestamp manipulation prevention
2. **Algorithm Confusion**: Algorithm switching attacks
3. **Body Tampering**: Content modification detection
4. **Cross-Tenant Access**: Cross-tenant webhook access prevention

## Performance Considerations

### Efficient Signature Verification

```typescript
// Cache frequently used secrets
private secretCache = new Map<string, string>();

getCachedSecret(algorithm: string): string {
  if (!this.secretCache.has(algorithm)) {
    this.secretCache.set(algorithm, this.getSecret(algorithm));
  }
  return this.secretCache.get(algorithm)!;
}

// Use timing-safe comparison
private timingSafeEqual(
  a: Buffer,
  b: Buffer
): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] ^ b[i];
    if (diff !== 0) return false;
  }
  
  return true;
}
```

### Database Optimization

```sql
-- Optimized query for duplicate checking
CREATE UNIQUE INDEX idx_processed_webhooks_tenant_webhook_id_unique ON processed_webhooks(webhook_tenant_id, webhook_id);

-- Partition old records for better performance
CREATE TABLE processed_webhooks_2024_01 PARTITION OF processed_webhooks
  INCLUDE (
    PARTITION p2024_01_01
    PARTITION p2024_01_02
    PARTITION p2024_01_03
    PARTITION p2024_01_04
    PARTITION p2024_01_05
  );

CREATE INDEX idx_processed_webhooks_2024_01_01 ON processed_webhooks_tenant_webhook_id WHERE processed_at >= '2024-01-01' AND processed_at < '2024-01-02';
CREATE INDEX idx_processed_webhooks_2024_01_02 ON processed_webhooks_tenant_webhook_id WHERE processed_at >= '2024-01-02' AND processed_at < '2024-01-03';
CREATE INDEX idx_processed_webhooks_2024_01_03 ON processed_webhooks_tenant_webhook_id WHERE processed_at >= '2024-01-03' AND processed_at < '2024-01_04';
```

## Enforcement Checklist

- [ ] All webhook endpoints verify HMAC signatures
- [ ] Timestamp validation prevents replay attacks
- **[ ] Webhook ID tracking prevents duplicate processing**
- [ ] Database constraints enforce unique webhook IDs
- [ ] Comprehensive test coverage for security scenarios
- [ ] Performance optimization for signature verification
- [ ] Error handling for security violations
- [ ] Audit logging for all webhook events
- [ ] Regular cleanup of old processed webhook records
- [ ] Monitoring for security events and anomalies
- [ ] Rate limiting on webhook endpoints
- [ ] Secret key management and rotation
- [ ] Cross-tenant access prevention

---

## Wouter Routing Rules

**File:** `.windsurf/rules/wouter-routing.md`

---
trigger: always_on
---



This project uses Wouter for routing, not React Router. Wouter is a lightweight alternative that provides the same functionality with a smaller bundle size.

<!-- SECTION: routing_setup -->

<routing_setup>
- **Package**: wouter (catalog version ^3.3.5)
- **Import**: Use Router, Route, Link, and useLocation hooks from wouter
- **Base Path**: Uses BASE_PATH environment variable for deployment
- **Navigation**: Use Link component for client-side navigation
- **Active State**: Detect active routes manually or with useLocation
</routing_setup>

<!-- ENDSECTION: routing_setup -->

<!-- SECTION: basic_usage -->

<basic_usage>

```typescript
// App.tsx
import { Router, Route } from 'wouter';
import { PageTransition } from './components/PageTransition';

export function App() {
  return (
    <Router base={import.meta.env.BASE_PATH}>
      <PageTransition>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/blog/:slug" component={BlogPostPage} />
        <Route path="/:rest*" component={NotFoundPage} />
      </PageTransition>
    </Router>
  );
}
```

</basic_usage>

<!-- ENDSECTION: basic_usage -->

<!-- SECTION: navigation_patterns -->

<navigation_patterns>

```typescript
// Navbar.tsx
import { Link, useLocation } from 'wouter';

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav>
      <Link href="/" className={location === '/' ? 'active' : ''}>
        Home
      </Link>
      <Link href="/about" className={location === '/about' ? 'active' : ''}>
        About
      </Link>
      <Link href="/contact" className={location === '/contact' ? 'active' : ''}>
        Contact
      </Link>
    </nav>
  );
}
```

</navigation_patterns>

<!-- ENDSECTION: navigation_patterns -->

<!-- SECTION: route_parameters -->

<route_parameters>
- **Static Routes**: `/about`, `/contact`
- **Dynamic Routes**: `/blog/:slug`, `/users/:id`
- **Catch-all**: `/:rest*` for 404 pages
- **Optional Params**: Use RegExp for complex patterns
- **Query Params**: Use URLSearchParams or custom hooks
</route_parameters>

<!-- ENDSECTION: route_parameters -->

<!-- SECTION: programmatic_navigation -->

<programmatic_navigation>

```typescript
import { useNavigate } from 'wouter';

export function SomeComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/about');
  };

  const goBack = () => {
    navigate(-1);
  };

  return <button onClick={handleClick}>Go to About</button>;
}
```

</programmatic_navigation>

<!-- ENDSECTION: programmatic_navigation -->

<!-- SECTION: route_guards -->

<route_guards>

```typescript
// ProtectedRoute.tsx
import { Route, Redirect } from 'wouter';

export function ProtectedRoute({ path, component: Component }) {
  const [user] = useUser();

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Route path={path} component={Component} />;
}

// Usage
<ProtectedRoute path="/dashboard" component={DashboardPage} />
```

</route_guards>

<!-- ENDSECTION: route_guards -->

<!-- SECTION: strict_constraints -->

<strict_constraints>
- **No React Router**: Never import from react-router-dom
- **Wouter Only**: Use wouter for all routing needs
- **Base Path**: Always respect BASE_PATH environment variable
- **Link Component**: Use Link for navigation, not <a> tags
- **Route Structure**: Keep routes flat and predictable
- **404 Handling**: Always include catch-all route for 404s
</strict_constraints>

<!-- ENDSECTION: strict_constraints -->

---

## YDM Architecture Rules

**File:** `.windsurf/rules/ydm-architecture.md`

---
trigger: always_on
---



## Project Overview

YDM is a **Replit-based monorepo** using **pnpm workspaces** with TypeScript. This architecture prioritizes type safety, API-first development, and supply chain security over traditional setups.

## Core Architectural Patterns

### **1. Monorepo Structure**
- **Workspace Management**: pnpm workspaces with centralized catalog
- **Package Categories**: 
  - `artifacts/*` (deployable applications)
  - `lib/*` (shared libraries)
  - `lib/integrations/*` (external services)
  - `scripts/*` (build automation)
- **Build Order**: Libraries build first, then artifacts in parallel

### **2. API-First Development**
- **Single Source of Truth**: `lib/api-spec/openapi.yaml`
- **Code Generation**: Orval generates React Query hooks and Zod schemas
- **Type Safety**: End-to-end from database to frontend
- **Workflow**: Update OpenAPI → Run codegen → Use generated types

### **3. Technology Stack Constraints**
- **Frontend**: React 19.1.0 + TypeScript + Vite 7.3.2 + Tailwind 4.1.14
- **Backend**: Express 5 + esbuild 0.27.3 + Pino logging
- **Database**: PostgreSQL + Drizzle ORM 0.45.2
- **Animation**: Framer Motion 11.0.0 (NOT motion library)
- **Routing**: Wouter (NOT React Router)

### **4. Replit-Specific Requirements**
- **Deployment**: Replit Autoscaling with Node.js 24
- **Environment Variables**: PORT and BASE_PATH required with validation
- **Development Plugins**: Cartographer, Dev Banner, Runtime Error Modal
- **Security**: Supply chain protection with 1440min release age

## Development Workflow Rules

### **Package Management**
- **Use pnpm only**: Preinstall script enforces this
- **Workspace Protocol**: Use `@workspace/package-name` for internal dependencies
- **Catalog Dependencies**: Shared dependencies managed in `pnpm-workspace.yaml`
- **Exact Versions**: No semver ranges in catalog

### **Code Generation Workflow**
1. **Update OpenAPI**: Edit `lib/api-spec/openapi.yaml`
2. **Run Codegen**: `pnpm --filter @workspace/api-spec run codegen`
3. **Type Check**: `pnpm run typecheck` to validate integration
4. **Use Generated Types**: Import from `@workspace/api-client-react` and `@workspace/api-zod`

### **Database Operations**
- **Schema Management**: Drizzle ORM with migrations
- **Development Push**: `pnpm --filter @workspace/db run push`
- **Validation**: Zod schemas auto-generated from database models
- **Integration**: Backend uses `@workspace/db` and `@workspace/api-zod`

### **Build System**
- **TypeScript Project References**: Incremental builds with cross-package validation
- **Parallel Builds**: Applications build after libraries complete
- **Source Maps**: Enabled for development, hidden in production
- **Bundle Optimization**: Post-build pnpm store pruning

## Security Requirements

### **Supply Chain Protection**
- **Release Age**: 1440-minute minimum for all packages
- **Exclusions**: Only @replit/* packages bypass release age
- **Platform Filtering**: Extensive package exclusions by platform
- **Native Modules**: Excluded for security (sharp, bcrypt, etc.)

### **Development Security**
- **Environment Variables**: No hardcoded secrets, use Replit environment variables
- **Type Safety**: Strict TypeScript configuration prevents runtime errors
- **Validation**: Use generated Zod schemas for all API validation

## Package-Specific Rules

### **API Server (@workspace/api-server)**
- **Framework**: Express 5 with ESM modules
- **Build**: esbuild with external dependencies
- **Logging**: Pino structured logging with security redaction
- **Validation**: Use `@workspace/api-zod` schemas
- **Database**: Use `@workspace/db` for all data operations

### **Frontend (@workspace/nexus-digital)**
- **Routing**: Wouter with BASE_PATH support
- **State Management**: TanStack Query for server state
- **UI Framework**: shadcn/ui components with Tailwind CSS v4
- **Animations**: Framer Motion with reduced motion support
- **Build**: Vite with Replit development plugins

### **Mockup Sandbox (@workspace/mockup-sandbox)**
- **Purpose**: Component preview and development
- **Hot Reload**: File watching with chokidar
- **Dynamic Loading**: Auto-generated component import maps
- **Error Handling**: Graceful error display for missing components

## Strict Constraints

### **Never Use**
- React Router v6 (use Wouter instead)
- motion library (use framer-motion)
- npm/yarn (use pnpm workspaces)
- Manual API client implementations (use generated hooks)
- Manual type definitions (use generated schemas)
- Direct database queries (use Drizzle ORM)

### **Always Use**
- pnpm workspace commands for package operations
- Generated types from OpenAPI specification
- Workspace protocol for internal dependencies
- Replit environment variables for configuration
- TypeScript strict mode settings

### **File Organization**
- **Components**: Organize by feature/domain, not by type
- **Shared Code**: Place in library packages, not individual artifacts
- **Generated Files**: Never edit files in `lib/api-client-react` or `lib/api-zod`
- **Configuration**: Centralize in root workspace files

## Common Commands

```bash
# Full workspace operations
pnpm run typecheck          # Type check all packages
pnpm run build             # Build all packages

# Package-specific operations
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/nexus-digital run dev
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push

# Dependency management
pnpm install --frozen-lockfile
pnpm list --depth=0
```

## Error Handling Patterns

### **TypeScript Errors**
- Run full workspace typecheck to catch cross-package issues
- Check individual packages with filter commands
- Verify project references in tsconfig.json

### **Build Failures**
- Ensure dependencies are installed with frozen lockfile
- Check for circular dependencies
- Verify workspace protocol usage

### **Code Generation Issues**
- Validate OpenAPI spec syntax
- Check Orval configuration
- Run typecheck after codegen to verify integration

This architecture ensures type safety, developer experience, and deployment optimization for scalable full-stack applications.

---

