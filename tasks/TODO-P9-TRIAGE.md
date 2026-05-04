# TODO-P9-TRIAGE.md - Karbon-Style Triage Inbox

This file contains tasks for implementing a unified triage inbox similar to Karbon's core differentiator - a single screen where emails, notifications, tasks, and document requests are processed together.

---

## Triage Inbox Tasks

- [ ] **TRI‑001: Unified Triage Inbox Backend**
  - **Status:** ⏳ Not Started  
  - **Depends on:** API‑NOTIF‑001, API‑DOCS‑004, API‑PROJ‑008, API‑CRM‑020, EMAIL‑SERVICE‑001  
  - **Why added:** Karbon's core differentiator is Triage – a single screen where emails, notifications, tasks, and document requests are processed. No equivalent exists.  
  - **Definition of Done:**
    - New aggregate `TriageItem` that references any actionable entity (CRM task, project task, document request, unread notification, email thread).  
    - `GET /api/v1/triage` – returns a unified, paginated list of triage items, sorted by priority/date. Filterable by type, status, assigned_to.  
    - `PATCH /api/v1/triage/{triageItemId}` – mark as "done", "snooze" (until a specified time), "assign" to a user.  
    - Backend job that creates `TriageItem` records whenever appropriate entities are created (via domain events).  
    - Triage items are automatically removed when the underlying entity is resolved.  
  - **BDD:** "As a team member, I can open the Triage screen and see all my emails, notifications, and tasks in one place, and process them with a single click."  
  - **TDD:** Integration test verifying triage items are created for different entity types and can be filtered/processed.  
  - **Deep Module:** Encapsulates triage item aggregation, domain event processing, and unified API endpoints.  

**Advanced Code Patterns:**  
- Domain event-driven triage item creation  
- Unified pagination and filtering across multiple entity types  
- Background job processing for triage item lifecycle management  
- Soft delete with automatic cleanup when underlying entities resolve  

**Anti-Patterns:**  
- Manual triage item creation without domain events  
- Inconsistent filtering across different entity types  
- Missing cleanup causing orphaned triage items  
- Synchronous triage processing blocking main operations  

**Database Schema Considerations:**  
```sql
CREATE TABLE triage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type VARCHAR(50) NOT NULL, -- 'crm_task', 'project_task', 'document_request', 'notification', 'email'
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'done', 'snoozed'
  snooze_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(organization_id, entity_type, entity_id)
);

CREATE INDEX idx_triage_organization ON triage_items(organization_id, deleted_at);
CREATE INDEX idx_triage_assigned ON triage_items(assigned_to, status, deleted_at);
CREATE INDEX idx_triage_priority ON triage_items(priority, created_at, deleted_at);
```

**Domain Events for Triage Creation:**  
- `CrmTaskCreated` → Create triage item
- `ProjectTaskCreated` → Create triage item  
- `DocumentRequestCreated` → Create triage item
- `NotificationCreated` → Create triage item
- `EmailReceived` → Create triage item
- Entity status changes → Update or remove triage items

---

- [ ] **TRI‑002: Triage Frontend Implementation**
  - **Status:** ⏳ Not Started  
  - **Depends on:** TRI‑001, FRONT‑INFRA‑001  
  - **Definition of Done:**
    - A dedicated route `/triage` in the frontend (apex‑os) with a tile‑based or list view.  
    - Each item shows a preview, entity type icon, and quick action buttons (Done, Snooze, Assign).  
    - Real‑time updates via WebSocket (or polling).  
    - "Snooze" picker with options (1 hour, 4 hours, tomorrow, custom).  
  - **BDD:** "I can snooze an email until tomorrow morning, and it disappears from my Triage view until then."  
  - **TDD:** Component tests verifying triage item rendering, actions, and real-time updates.  
  - **Deep Module:** Encapsulates triage UI components, real-time updates, and user interactions.  

**Advanced Code Patterns:**  
- Real-time WebSocket integration for live updates  
- Unified component rendering for different entity types  
- Optimistic updates with rollback capability  
- Infinite scroll with pagination for large triage lists  

**Anti-Patterns:**  
- Mixed UI patterns across different entity types  
- Missing real-time updates causing stale data  
- Inconsistent action handling across item types  
- Performance issues with large triage lists  

**Frontend Component Structure:**  
```typescript
// TriageItem component - unified rendering
interface TriageItem {
  id: string;
  entityType: 'crm_task' | 'project_task' | 'document_request' | 'notification' | 'email';
  entityId: string;
  title: string;
  description?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  status: 'pending' | 'done' | 'snoozed';
  snoozeUntil?: string;
  createdAt: string;
  entityData: any; // Type-specific data
}

// Real-time hooks
const useTriageUpdates = () => {
  // WebSocket connection for live updates
  // Auto-refresh on connection issues
};

// Unified actions
const useTriageActions = () => {
  const markDone = (itemId: string) => { /* ... */ };
  const snooze = (itemId: string, until: Date) => { /* ... */ };
  const assign = (itemId: string, userId: string) => { /* ... */ };
};
```

---

## Implementation Notes

### API Endpoint Design
- `GET /api/v1/triage` - List triage items with filtering
  - Query params: `type`, `status`, `assigned_to`, `priority`, `limit`, `offset`
  - Returns unified format with entity-specific metadata
- `PATCH /api/v1/triage/{id}` - Update triage item
  - Body: `{ status: 'done' | 'snoozed', snooze_until?: string, assigned_to?: string }`
- `GET /api/v1/triage/stats` - Get triage statistics
  - Returns counts by type, priority, and status

### Performance Considerations
- Use database views for complex triage queries
- Implement efficient pagination with cursor-based navigation
- Cache triage lists for frequently accessed users
- Background job cleanup for resolved items

### Integration Points
- **CRM**: Tasks, activities, notifications
- **Projects**: Tasks, milestones, assignments  
- **Documents**: Review requests, approvals, sharing requests
- **Email**: Unread messages, threads requiring action
- **Notifications**: System alerts, mentions, assignments

### Real-time Updates
- WebSocket events for triage item creation/updates
- Push notifications for high-priority items
- Live counters in UI showing pending items by type

### Security & Permissions
- Users only see triage items for entities they have access to
- Organization-scoped triage items prevent cross-tenant leakage
- Audit trail for all triage actions (done, snooze, assign)
