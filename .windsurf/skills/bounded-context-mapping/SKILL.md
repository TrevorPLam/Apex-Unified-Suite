---
name: bounded-context-mapping
description: Draw and maintain bounded context maps for Domain-Driven Design, defining context boundaries and relationships for the Apex Unified Suite
---

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
