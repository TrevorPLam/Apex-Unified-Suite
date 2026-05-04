# TODO-P4-ASSETS-ALERTS.md – Phase 4: Asset Alerts System

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

## Phase 4 – Asset Alerts & Notifications

This section covers the configurable alert system for asset management, including lease expirations, warranty notifications, scheduled maintenance reminders, and overdue check-in alerts. These features provide proactive asset management capabilities matching AssetTiger's alert functionality.

---

## Asset Alerts System

### [ ] ASSETS-ALERT-001: Configurable Asset Alerts (Lease, Warranty, Maintenance, Overdue Check-In)
**Status:** ⏳ Not Started  
**Depends on:** API-ASSETS-001, EMAIL-SERVICE-001  
**Why added:** AssetTiger's alert system for lease/warranty expirations, scheduled maintenance, and overdue check-ins is crucial. Current plan lacks explicit alert configuration.  
**Definition of Done:**
- New table `asset_alerts` (organization_id, asset_id, alert_type enum, trigger_date, message, recipient_ids).  
- `POST /api/v1/assets/{assetId}/alerts` – create alert.  
- `GET /api/v1/assets/{assetId}/alerts` – list alerts.  
- Background job that checks due alerts daily and sends notifications via email/in-app.  
- Pre-defined alert types: lease_expiration, warranty_expiration, maintenance_due, checkin_overdue. Alerts fire N days before trigger date (configurable).  
**BDD:** "I receive an email 30 days before my laptop's lease expires so I can plan the renewal."  
**TDD:** Integration test verifying alert creation, scheduling, and notification delivery.  
**Deep Module:** Encapsulates alert lifecycle management, scheduling logic, and notification delivery.

**Advanced Code Patterns:**
- Alert scheduling with configurable lead time
- Background job processing with retry logic
- Multi-channel notification delivery (email, in-app)
- Alert type extensibility for future alert categories

**Anti-Patterns:**
- Hard-coded alert timing without configurability
- Missing retry logic for failed notifications
- No alert deduplication causing spam
- Synchronous notification blocking API responses

**Database Schema:**
```sql
-- Asset alerts table
CREATE TABLE asset_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_id UUID NOT NULL REFERENCES assets(id),
  alert_type VARCHAR(50) NOT NULL, -- 'lease_expiration', 'warranty_expiration', 'maintenance_due', 'checkin_overdue'
  trigger_date DATE NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 30,
  message TEXT,
  recipient_ids UUID[] NOT NULL, -- Array of user IDs to notify
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert notification log
CREATE TABLE alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES asset_alerts(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL, -- 'email', 'in_app'
  status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT
);

-- Indexes for alert queries
CREATE INDEX idx_asset_alerts_org ON asset_alerts(organization_id, alert_type);
CREATE INDEX idx_asset_alerts_trigger ON asset_alerts(trigger_date, is_active);
CREATE INDEX idx_asset_alerts_asset ON asset_alerts(asset_id);
```

**API Endpoints:**
- `POST /api/v1/assets/{assetId}/alerts` - Create new alert for asset
- `GET /api/v1/assets/{assetId}/alerts` - List all alerts for an asset
- `GET /api/v1/assets/alerts` - List all alerts for organization (with filters)
- `PATCH /api/v1/assets/alerts/{alertId}` - Update alert configuration
- `DELETE /api/v1/assets/alerts/{alertId}` - Deactivate/delete alert
- `POST /api/v1/assets/alerts/{alertId}/trigger` - Manually trigger alert (for testing)

**Subtasks:**
- [ ] ASSETS-ALERT-001.1: Create asset_alerts and alert_notifications table migrations. (AGENT) – `lib/db/src/migrations/`
  **verification:** Migration runs successfully; tables created with correct schema.
- [ ] ASSETS-ALERT-001.2: Add alert endpoints to OpenAPI spec. (AGENT) – `lib/api-spec/openapi.yaml`
  **verification:** Spec validates; codegen produces correct types.
- [ ] ASSETS-ALERT-001.3: Implement AlertService with scheduling logic. (AGENT) – `artifacts/api-server/src/services/assets/alert-service.ts`
  **verification:** Unit tests pass; service methods return Result<T, DomainError>.
- [ ] ASSETS-ALERT-001.4: Implement AlertRepository with query methods. (AGENT) – `lib/db/src/repositories/assets/alerts.ts`
  **verification:** Repository tests pass; soft delete and filtering work correctly.
- [ ] ASSETS-ALERT-001.5: Create alert routes with validation. (AGENT) – `artifacts/api-server/src/routes/assets/alerts.ts`
  **verification:** Routes wired; integration tests pass.
- [ ] ASSETS-ALERT-001.6: Implement background job for daily alert checks. (AGENT) – `artifacts/api-server/src/jobs/alert-processor.ts`
  **verification:** Job runs daily; processes alerts correctly; retry logic works.
- [ ] ASSETS-ALERT-001.7: Integrate with email service for notifications. (AGENT)
  **verification:** Emails sent for triggered alerts; in-app notifications created.
- [ ] ASSETS-ALERT-001.8: Write integration tests for full alert workflow. (AGENT) – `artifacts/api-server/__tests__/api/assets/alerts.test.ts`
  **verification:** Tests cover alert creation, triggering, and notification delivery.

---

## Progress Tracking

### Overall Status
**Asset Alerts Context:** [ ] 0/1 parent tasks complete

### Dependencies
- **API-ASSETS-001** enables asset CRUD operations
- **EMAIL-SERVICE-001** enables notification delivery
- **DB-ASSETS-*** provides underlying asset data

### Next Actions
- [ ] Start ASSETS-ALERT-001.1: Create database migrations
- [ ] Start ASSETS-ALERT-001.2: Add OpenAPI spec entries

### Verification Commands
```bash
# Database verification
pnpm --filter @workspace/db run push

# API verification
pnpm test -- alerts.test.ts
pnpm typecheck

# Background job verification
pnpm test -- alert-processor.test.ts
```

---

## File Index

### Asset Alerts
- `lib/db/src/migrations/` - Database migrations for asset_alerts table
- `lib/db/src/repositories/assets/alerts.ts` - Alert repository
- `artifacts/api-server/src/services/assets/alert-service.ts` - Alert service
- `artifacts/api-server/src/routes/assets/alerts.ts` - Alert routes
- `artifacts/api-server/src/jobs/alert-processor.ts` - Background job processor
- `artifacts/api-server/__tests__/api/assets/alerts.test.ts` - Integration tests

---

*End of Phase 4 Asset Alerts section.*
