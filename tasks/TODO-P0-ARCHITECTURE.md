# TODO-P0-ARCHITECTURE.md – Phase 0: Architecture Decisions

This document contains architecture-focused tasks that define boundaries, scope decisions, and cross-cutting technical capabilities. These tasks depend on foundation completion.

---

## [ ] ARCH-007: Define Appointments (Calendly-style) vs. PM Scheduler Boundary  
**Status:** ⏳ Not Started  
**Current state:** The previous ARCH-002 ambiguously placed Scheduling as a read-only projection. The Scheduler tab is now a PM feature.  
**Definition of Done:** ADR accepted establishing that **Appointments** is a standalone bounded context (Calendly-model with event types, routing forms, calendar sync, payments) and **PM Scheduler** is a Projects-owned feature for recurring work planning. The anti-corruption layer from ARCH-002 is deprecated. `docs/bounded-contexts.md` updated accordingly.  
**Blocks:** DB-APPT-* tasks, PROJ-* recurring work tasks  
**Blocked By:** DOMAIN-002  
**Depends on:** DOMAIN-002  
**Related Files:** `docs/adr/007-appointments-vs-scheduler.md`, `docs/bounded-contexts.md`  
**DDD:** Separates two distinct concepts: time-slot booking (Appointments) and periodic work planning (Projects). Ensures no leaky coupling.  
**TDD:** N/A – documentation task.  
**BDD:** Feature files for Appointments and Projects will reflect this separation.  
**Deep Module:** N/A.

### Subtasks:
- [ ] ARCH-007.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ARCH-007.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ARCH-007.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ARCH-007.1 (AGENT): Write ADR-007: Appointments is a full bounded context (Calendly-style), PM Scheduler is a Projects feature. Deprecate ARCH-002. – `docs/adr/007-appointments-vs-scheduler.md`  
  **Verification:** ADR file exists, rationale clear.
- [ ] ARCH-007.2 (AGENT): Update `docs/bounded-contexts.md` to reflect the new Appointments context and remove read-only ACL notes between Projects and Appointments.  
  **Verification:** Document updated, Appointments context listed independently.
- [ ] ARCH-007.3 (HUMAN): Confirm the boundary is correct and that all future "Scheduler" work falls under Projects.  
  **Verification:** Stakeholder sign-off.  
  **Blocks:** All Appointments and PM Scheduler tasks.

---

## [ ] ARCH-003: E-Sign Scope Decision (V1)  
**Status:** ⏳ Not Started  
**Current state:** E-Sign scope undefined – unclear if native implementation or third-party integration.  
**Definition of Done:** E-Sign scope confirmed as third-party integration (SignWell/DocuSign) within Documents context, bounded contexts doc updated, `documents.feature` updated with E-Sign scenarios.  
**Blocks:** DB-ESIGN-001  
**Blocked By:** none  
**Depends on:** DOMAIN-003.4  
**Related Files:** `docs/bounded-contexts.md`, `docs/features/documents.feature`

**DDD:** E-Sign V1 is implemented as an integration adapter within the Documents bounded context, not a standalone context. Delegates to third-party provider (SignWell).  
**TDD:** N/A – scope decision.  
**BDD:** E-Sign scenarios added to `documents.feature`.  
**Deep Module:** N/A – integration adapter pattern.

### Subtasks:
- [ ] ARCH-003.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ARCH-003.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ARCH-003.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ARCH-003.1 (NEW/HUMAN): Confirm E-Sign V1 scope: third-party integration (SignWell or DocuSign API) as a sub-domain within Documents context. Native E-Sign bounded context deferred to V2.  
  **Verification:** Scope confirmed.  
  **Blocks:** DB-ESIGN-001.
- [ ] ARCH-003.2 (NEW/AGENT): Update `docs/bounded-contexts.md` with E-Sign scope note: "E-Sign is implemented as an integration adapter within the Documents bounded context. It delegates to a third-party provider (SignWell). A `signature_requests` table tracks external request IDs and status. A standalone E-Sign bounded context is V2 scope."  
  **Verification:** `docs/bounded-contexts.md` updated.
- [ ] ARCH-003.3 (NEW/AGENT): Update `docs/features/documents.feature` to add E-Sign scenarios:  
  - Scenario: "I can send a document for e-signature via third-party provider"  
  - Scenario: "Signature status is reflected in the document list"  
  - Scenario: "I cannot send a document for signature if no signers are defined"  
  **Verification:** `docs/features/documents.feature` contains at least 3 E-Sign scenarios.

---

## [ ] ARCH-004: Mockup Sandbox Deprecation Decision  
**Status:** ⏳ Not Started  
**Current state:** The 67-file design tool `mockup-sandbox` is never mentioned again in any phase or task.  
**Definition of Done:** Decision made on mockup-sandbox fate: deprecate, move to legacy folder, or assign maintenance. Documentation updated.  
**Out of Scope:** Complete rewrite or removal of existing functionality.  
**Blocks:** N/A – cleanup task.  
**Related Files:** `artifacts/mockup-sandbox/`, optional `legacy/` folder.

**DDD:** N/A – tooling decision.  
**TDD:** N/A.  
**BDD:** N/A.  
**Deep Module:** N/A.

### Subtasks:
- [ ] ARCH-004.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ARCH-004.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ARCH-004.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ARCH-004.1 (NEW/HUMAN): Decide fate of mockup-sandbox: deprecate, move to legacy/, or maintain with assigned owner.  
  **Verification:** Decision documented in `docs/tooling-decisions.md`.
- [ ] ARCH-004.2 (NEW/AGENT): Implement decision: if deprecating, add deprecation notice to README and move to `legacy/mockup-sandbox/`.  
  **Verification:** Mockup sandbox moved; README updated with deprecation notice.

---

## [ ] DOMAIN-004: Define Cross-Cutting Technical Capabilities (ADRs)  
**Status:** ⏳ Not Started  
**Current state:** Cross-cutting capabilities like real-time notifications, global search, and CSV import/export lack architectural definition.  
**Definition of Done:** Three ADRs accepted for: real-time notification strategy (WebSockets vs. polling), cross-module search approach (PostgreSQL FTS vs. external engine), and generic import/export pipeline.  
**Blocks:** API-NOTIF-001, API-SEARCH-001, API-IMPORT-001, WS-INFRA-001, and all dependent frontend tasks.  
**Blocked By:** DOMAIN-002  
**Depends on:** DOMAIN-002  
**Related Files:** `docs/adr/008-real-time-notification-strategy.md`, `docs/adr/009-cross-module-search-strategy.md`, `docs/adr/010-import-export-strategy.md`

**DDD:** Infrastructure services must be designed as bounded-context ports; the ADRs ensure consistency across all business contexts.  
**TDD:** N/A – documentation task.  
**BDD:** N/A – infrastructure concern.  
**Deep Module:** The chosen strategies will become deep modules (e.g., WebSocket gateway hiding connection management).

### Subtasks:
- [ ] DOMAIN-004.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] DOMAIN-004.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] DOMAIN-004.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] DOMAIN-004.1 (AGENT): Create `docs/adr/008-real-time-notification-strategy.md` deciding between polling, WebSockets (Socket.io), and server-sent events. Includes implications for infrastructure, client libraries, and fallback behaviour.  
  **Verification:** ADR accepted.
- [ ] DOMAIN-004.2 (AGENT): Create `docs/adr/009-cross-module-search-strategy.md` deciding between PostgreSQL full-text search, Meilisearch/Typesense, or a simpler approach.  
  **Verification:** ADR accepted.
- [ ] DOMAIN-004.3 (AGENT): Create `docs/adr/010-import-export-strategy.md` defining the generic import/export pipeline, supported formats, and validation rules.  
  **Verification:** ADR accepted.
- [ ] DOMAIN-004.4 (HUMAN): Review and approve all three ADRs.  
  **Verification:** Approved.  
  **Blocks:** Implementation of notification, search, import services.

---

## [ ] ARCH-005: Define API Versioning Strategy  
**Status:** ⏳ Not Started  
**Current state:** No API versioning strategy defined – endpoints will conflict when evolving.  
**Definition of Done:** ADR accepted establishing `/api/v1/` prefix for all API endpoints from Phase 3 onward, with clear versioning policy and migration path.  
**Out of Scope:** Implementation of multiple concurrent versions (deferred to Phase 6+).  
**Blocks:** All Phase 3+ API implementation tasks  
**Blocked By:** DOMAIN-002 (context map established)  
**Related Files:** `docs/adr/005-api-versioning.md`  

**DDD:** API versioning is a cross-cutting concern that enables bounded context evolution without breaking contracts.  
**TDD:** N/A – architectural decision.  
**BDD:** N/A – infrastructure concern.  
**Deep Module:** N/A.

### Subtasks:
- [ ] ARCH-005.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ARCH-005.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ARCH-005.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ARCH-005.1: Create API versioning ADR with `/api/v1/` prefix policy. (AGENT) – `docs/adr/005-api-versioning.md`  
  **verification:** ADR file exists and defines versioning strategy.
- [ ] ARCH-005.2: Update Phase 3+ task descriptions to reference `/api/v1/` prefix requirement. (AGENT) – TODO-P3.md, TODO-P4.md, etc.  
  **verification:** All API endpoint paths in Phase 3+ include `/api/v1/` prefix.
- [ ] ARCH-005.3: Review and approve ADR. (HUMAN)  
  **verification:** ADR approved.
- **Blocks:** All Phase 3+ API development tasks.

---

## [ ] ARCH-001: Define Multi-Tenancy Strategy (BLOCKING)  
**Status:** ⏳ Not Started  
**Current state:** No multi‑tenancy strategy defined – database schema lacks tenant isolation.  
**Blocks:** Every Phase 2 schema task. Must be resolved before DB‑CRM‑001.  
**Blocked By:** none  
**Depends on:** DOMAIN-002, TOOLING-004 (logical, not enforced)  
**Decision Made by Agent:** Shared‑schema with `organization_id` column.  
**Definition of Done:** ADR accepted, base repository implemented, organizations table defined, all Phase 2 schema tasks updated with `organization_id` column requirement (including identity tables).  
**Related Files:** `docs/adr/001-multi-tenancy.md`, `lib/db/src/repositories/base-repository.ts`  

**DDD:** Multi‑tenancy is a cross‑cutting architectural concern. The shared‑schema approach keeps all tenant data in one database while enforcing isolation via `organization_id` filters. Every bounded context must respect this column.  
**TDD:** Repository tests must verify that all queries are automatically scoped to the current tenant.  
**BDD:** N/A – infrastructure concern.  
**Deep Module:** The `BaseRepository` is a deep module – simple interface hiding complex tenant‑scoping logic.

### Subtasks:
- [ ] ARCH-001.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ARCH-001.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ARCH-001.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ARCH-001.1 (NEW/AGENT): Create `docs/adr/001-multi-tenancy.md` with the following content:  
  - Status: Accepted  
  - Decision: Shared‑schema with `organization_id` column on every business table  
  - Rationale: Drizzle ORM compatibility, simpler migrations, single PostgreSQL database, PostgreSQL RLS provides defense‑in‑depth (Note: RLS is deferred post‑MVP; isolation is handled by BaseRepository automatic tenant filtering)  
  - Convention: Column named `organization_id` (UUID, NOT NULL, FK to `organizations` table) on: **users, roles, user_roles**, leads, contacts, companies, deals, activities, projects, tasks, milestones, invoices, payments, cards, budgets, folders, documents, assets, asset_checkouts, maintenance_logs, portal_clients, analytics reports, settings, audit_logs, and all new tables from expanded contexts.  
  - Repository filter pattern: automatic injection via BaseRepository (see ARCH‑001.2 in Phase 2)  
  **Verification:** ADR file exists and lists all tables, including identity tables and new domain tables.
- [ ] ARCH-001.2 (NEW/AGENT): This subtask moved to Phase 2 as ARCH‑001.2 — see TODO‑P2.md after DB‑ORG‑001.2.
- [ ] ARCH-001.3 (NEW/AGENT): Add `organizations` table to Phase 2 schema (insert as DB‑ORG‑001):  
  - `id` (uuid PK), `name` (text), `slug` (unique), `plan_type` (enum: free/pro/enterprise), `settings` (JSONB default {}), `created_at`, `updated_at`  
  - This is the anchor table for all `organization_id` foreign keys.  
  **Verification:** Schema test for organizations table passes.
- [ ] ARCH-001.4 (NEW/AGENT): Add `organization_id` column to EVERY schema task in Phase 2, including identity tables that will be moved there. This is a blanket amendment — every DB‑* task's "Definition of Done" must include `organization_id: text('organization_id').notNull().references(() => organizationsTable.id)` with an index on `(organization_id)` for all high‑read tables.  
  **Verification:** All Phase 2 schema tests verify the column.
- [ ] ARCH-001.5 (NEW/HUMAN): Review ADR and confirm the strategy before any Phase 2 work begins.  
  **Verification:** ADR approved.  
  **Blocks:** DB-ORG-001, all DB‑* tasks, TOOLING-004.

---

## Architecture Wave Completion Criteria

**Wave Status:** [ ] Complete (0/6 parent tasks done)

**Dependencies for Next Waves:**
- ARCH-007 clarifies Appointments vs Projects boundary
- ARCH-003 defines E-Sign integration scope  
- ARCH-004 establishes cross-cutting infrastructure strategy
- ARCH-004 resolves mockup-sandbox maintenance question
- ARCH-005 defines API versioning strategy for future development
- ARCH-001 establishes critical multi-tenancy strategy (BLOCKING all Phase 2 schema work)

**Next Wave:** BEHAVIOR tasks (requires architecture decisions)
