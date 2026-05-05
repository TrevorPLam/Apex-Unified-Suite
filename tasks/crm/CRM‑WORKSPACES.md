# tasks/crm/CRM‑WORKSPACES.md – CRM Workspaces & 360 Views

This file owns the CRM workspace surfaces that existing Leads, Contacts, Deals, Activities, and Tasks tasks already depend on. It defines the composite backend and frontend work needed for unified CRM entity workspaces.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Composite CRM Workspaces

### [ ] API‑CRM‑026: CRM Workspace Composite Endpoint
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No composite CRM workspace endpoint exists.

**Description:** Implement composite endpoints for lead, contact, company, and deal workspaces that assemble entity profile, activities, CRM tasks, linked documents, related records, and recent engagement metadata.

**Depends on:** `crm/CRM‑LEADS.md → API‑CRM‑022`, `API‑CRM‑023`, `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑009`, `API‑CRM‑013`, `crm/CRM‑DEALS.md → API‑CRM‑017`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑021`, `API‑CRM‑024`
**Blocks:** `crm/CRM‑DEALS.md → FRONT‑CRM‑014`, `crm/CRM‑LEADS.md → FRONT‑CRM‑010`
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/crm/crm‑workspace‑service.ts`, `artifacts/api‑server/src/routes/crm/workspaces.ts`

**Definition of Done**
- [ ] Composite routes exist for lead, contact, company, and deal workspace retrieval
- [ ] Responses are paginated where activity/task lists can grow unbounded
- [ ] Authorization follows organization scope and entity visibility rules

### [ ] FRONT‑CRM‑010: Lead & Contact Workspace UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Lead and contact detail workspaces are partial or mock-driven.

**Description:** Replace fragmented detail panels with a full workspace experience including overview, activity timeline, tasks, related records, and documents.

**Depends on:** `crm/CRM‑WORKSPACES.md → API‑CRM‑026`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/crm/LeadWorkspace.tsx`, `ContactWorkspace.tsx`

### [ ] FRONT‑CRM‑015: Company Workspace UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Company 360 view does not exist.

**Description:** Add a company workspace showing people, deals, recent activity, open tasks, documents, and communication history.

**Depends on:** `crm/CRM‑WORKSPACES.md → API‑CRM‑026`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/crm/CompanyWorkspace.tsx`

**Verification**
- [ ] Load a deal workspace and confirm related activities, tasks, and documents resolve in one view
- [ ] Verify entity visibility and missing-section empty states

## Subtasks
- [ ] API‑CRM‑026.1 (AGENT): Define composite response schemas and route contracts in OpenAPI.
- [ ] API‑CRM‑026.2 (AGENT): Implement `crm‑workspace‑service.ts` and composite routes.
- [ ] API‑CRM‑026.3 (AGENT): Add integration tests for lead, contact, company, and deal workspace responses.
- [ ] FRONT‑CRM‑010.1 (AGENT): Create lead and contact workspace hooks and components.
- [ ] FRONT‑CRM‑010.2 (AGENT): Replace mock-driven detail panels with composite data loading.
- [ ] FRONT‑CRM‑015.1 (AGENT): Create the company workspace with related-record sections.
- [ ] FRONT‑CRM‑015.2 (HUMAN): Review workspace completeness and usability.