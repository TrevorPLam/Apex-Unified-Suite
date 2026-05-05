# TODO-P0-ARCHITECTURE.md – Phase 0: Architecture Decisions

This document contains architecture-focused tasks that define boundaries, scope decisions, and cross-cutting technical capabilities. These tasks depend on foundation completion.

---

## [ ] ARCH-007: Define Appointments (Calendly-style) vs. PM Scheduler Boundary
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** The previous ARCH-002 ambiguously placed Scheduling as a read-only projection. The Scheduler tab is now confirmed as a PM feature. No ADR formalising this boundary exists.
**Size:** Medium

**Description** Write ADR-007 establishing Appointments as a standalone bounded context (Calendly-model: event types, routing forms, calendar sync, payments) and PM Scheduler as a Projects-owned feature for recurring work planning. Deprecate ARCH-002. Update `docs/bounded-contexts.md`.

**Depends on:** DOMAIN-002
**Blocks:** DB-APPT-* tasks, PROJ-* recurring work tasks
**Related Files:** `docs/adr/007-appointments-vs-scheduler.md`, `docs/bounded-contexts.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – ADR and documentation artifacts

**Definition of Done**
- [ ] `docs/adr/007-appointments-vs-scheduler.md` exists with Status: Accepted
- [ ] ADR establishes Appointments as a standalone bounded context (Calendly-model)
- [ ] ADR establishes PM Scheduler as a Projects feature for recurring work planning
- [ ] ARCH-002 formally deprecated in the ADR
- [ ] `docs/bounded-contexts.md` updated: Appointments listed independently; read-only ACL notes between Projects and Appointments removed
- [ ] HUMAN sign-off received

**Out of Scope**
- Detailed API contracts for either context (Phase 3)
- Actual implementation of bounded context separation
- Database schema for Appointments (Phase 2)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/adr/007-appointments-vs-scheduler.md`
- Documentation update: `docs/bounded-contexts.md`

**Rollback**
- Granularity: file-level
- Halt condition: Stakeholder disputes the boundary → pause; do not update `docs/bounded-contexts.md` until ARCH-007 ADR is approved

**Rules to Follow**
- ADR must use standard ADR format: Context, Decision, Consequences
- Appointments scenarios must not reference project entities; Projects scenarios must not reference appointment entities
- The anti-corruption layer concept from ARCH-002 is deprecated — do not carry it forward

**Verification**
```bash
# Manual: open docs/adr/007-appointments-vs-scheduler.md and verify Status: Accepted
# Manual: open docs/bounded-contexts.md and verify Appointments listed as standalone context
```

**Advanced Code Patterns**
- [N/A] – architectural decision record (documentation task)

**Anti-Patterns**
- Allowing Appointments entities (e.g., `TimeSlot`, `EventType`) to appear in PM Scheduler code
- Keeping the read-only ACL anti-corruption layer from ARCH-002 (creates implicit coupling)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Separates two distinct concepts — time-slot booking (Appointments) and periodic work planning (Projects). Ensures no leaky coupling. BDD scenario guidance: Appointments scenarios must not reference project entities; Projects scenarios must not reference appointment entities.
- TDD: [N/A] – documentation task
- BDD: Feature files for Appointments and Projects will reflect this separation
- Deep Module: [N/A]

---

### Subtasks
- [ ] ARCH-007.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ARCH-007.0.5 (AGENT): Research latest best practices (as of 05/2026). Review DDD bounded context separation patterns; study Calendly-model event booking vs. recurring work planning (JIRA/Linear-style) to confirm boundary rationale.
- [ ] ARCH-007.0.75 (AGENT): Reason about the task. If the boundary definition is unclear or controversial, raise with user before writing the ADR.
- [ ] ARCH-007.1 (AGENT): Write ADR-007: Appointments is a full bounded context (Calendly-style); PM Scheduler is a Projects feature. Deprecate ARCH-002.
  **File(s):** `docs/adr/007-appointments-vs-scheduler.md`
  **Verification:** ADR file exists; rationale clear; ARCH-002 deprecation noted.
- [ ] ARCH-007.2 (AGENT): Update `docs/bounded-contexts.md` to reflect the new Appointments context and remove read-only ACL notes between Projects and Appointments.
  **File(s):** `docs/bounded-contexts.md`
  **Verification:** Document updated; Appointments context listed independently.
- [ ] ARCH-007.3 (HUMAN): Confirm the boundary is correct and that all future "Scheduler" work falls under Projects.
  **Verification:** Stakeholder sign-off.
  **Blocks:** All Appointments and PM Scheduler tasks.
- [ ] ARCH-007.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] ARCH-003: E-Sign Scope Decision (V1)
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** E-Sign scope undefined. It is unclear whether to implement natively or integrate via a third-party provider. No database table or API adapter exists.
**Size:** Small

**Description** Confirm E-Sign V1 scope as a third-party integration adapter (SignWell or DocuSign) within the Documents bounded context. Update `docs/bounded-contexts.md` and add E-Sign scenarios to `docs/features/documents.feature`.

**Depends on:** DOMAIN-003 (subtask 3.4)
**Blocks:** DB-ESIGN-001
**Related Files:** `docs/bounded-contexts.md`, `docs/features/documents.feature`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – scope decision and documentation artifacts

**Definition of Done**
- [ ] HUMAN confirms E-Sign V1 scope: third-party integration (SignWell or DocuSign) as adapter within Documents context; native E-Sign bounded context deferred to V2
- [ ] `docs/bounded-contexts.md` updated with E-Sign scope note
- [ ] `docs/features/documents.feature` contains at least 3 new E-Sign scenarios (send for signature, status reflected, cannot send without signers)

**Out of Scope**
- Native E-Sign implementation (V2 scope)
- Database schema for `signature_requests` (DB-ESIGN-001)
- Third-party API integration code (Phase 3)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, API keys
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation update: `docs/bounded-contexts.md`
- Feature file update: `docs/features/documents.feature`

**Rollback**
- Granularity: file-level
- Halt condition: Stakeholder decides to build E-Sign natively → scope changes significantly; pause and redesign before proceeding

**Rules to Follow**
- All E-Sign operations must go through integration adapter (no direct provider SDK calls in business logic)
- Provider credentials must be stored in configuration, not code (see TOOLING-001 env vars)
- Signature status must be tracked locally in a `signature_requests` table
- All external API calls must be retryable with exponential backoff
- ADR note: provider selection (SignWell vs. DocuSign) is a configuration decision, not an architectural one

**Verification**
```bash
# Manual: open docs/bounded-contexts.md and verify E-Sign scope note present
# Manual: open docs/features/documents.feature and verify ≥3 E-Sign scenarios
```

**Advanced Code Patterns**
- Integration adapter pattern: isolates third-party provider behind a consistent internal interface
- Configuration-driven provider selection: swap SignWell ↔ DocuSign via env var without code changes
- Async signature request lifecycle management: webhook-based status updates, not polling

**Anti-Patterns**
- Direct SDK calls to SignWell/DocuSign in Documents service (breaks adapter isolation)
- Hardcoded provider credentials anywhere in source
- Synchronous signature status checking (must be async/event-driven)
- Lack of fallback or retry mechanisms for external API failures

**DDD / TDD / BDD / Deep Module notes**
- DDD: E-Sign V1 is implemented as an integration adapter within the Documents bounded context, not a standalone context. Delegates to third-party provider (SignWell). A `signature_requests` table tracks external request IDs and status. Standalone E-Sign bounded context is V2 scope.
- TDD: [N/A] – scope decision task
- BDD: E-Sign scenarios added to `docs/features/documents.feature`
- Deep Module: [N/A] – integration adapter pattern

---

### Subtasks
- [ ] ARCH-003.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ARCH-003.0.5 (AGENT): Research latest best practices (as of 05/2026). Compare SignWell vs. DocuSign API capabilities (pricing, webhook support, embedded signing, compliance). Review integration adapter patterns for e-sign providers.
- [ ] ARCH-003.0.75 (AGENT): Reason about the task. If provider selection or scope is unclear, check with user before writing.
- [ ] ARCH-003.1 (HUMAN): Confirm E-Sign V1 scope: third-party integration (SignWell or DocuSign API) as adapter sub-domain within Documents context. Native E-Sign deferred to V2.
  **Verification:** Scope confirmed.
  **Blocks:** DB-ESIGN-001.
- [ ] ARCH-003.2 (AGENT): Update `docs/bounded-contexts.md` with E-Sign scope note: "E-Sign is implemented as an integration adapter within the Documents bounded context. It delegates to a third-party provider (SignWell or DocuSign). A `signature_requests` table tracks external request IDs and status. A standalone E-Sign bounded context is V2 scope."
  **File(s):** `docs/bounded-contexts.md`
  **Verification:** `docs/bounded-contexts.md` updated.
- [ ] ARCH-003.3 (AGENT): Update `docs/features/documents.feature` with E-Sign scenarios: (1) "I can send a document for e-signature via third-party provider", (2) "Signature status is reflected in the document list", (3) "I cannot send a document for signature if no signers are defined."
  **File(s):** `docs/features/documents.feature`
  **Verification:** Feature file contains ≥3 E-Sign scenarios.
- [ ] ARCH-003.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] ARCH-004: Mockup Sandbox Deprecation Decision
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** The `artifacts/mockup-sandbox/` design-tool workspace (67 files: `index.html`, `src/`, `mockupPreviewPlugin.ts`, `vite.config.ts`, etc.) is never referenced in any Phase 0–10 task. No owner or maintenance plan exists.
**Size:** Small

**Description** Decide the fate of `artifacts/mockup-sandbox/`: deprecate and move to `legacy/`, maintain with assigned owner, or integrate into the main development workflow. Document the decision.

**Depends on:** [N/A]
**Blocks:** [N/A] – cleanup/housekeeping task
**Related Files:** `artifacts/mockup-sandbox/`, `legacy/` (optional), `docs/tooling-decisions.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A]

**Definition of Done**
- [ ] Decision documented in `docs/tooling-decisions.md` (create if absent): deprecate, maintain, or integrate
- [ ] If deprecating: deprecation notice added to `artifacts/mockup-sandbox/README.md`; directory moved to `legacy/mockup-sandbox/`
- [ ] If maintaining: owner assigned and documented
- [ ] HUMAN sign-off received

**Out of Scope**
- Complete rewrite or removal of existing mockup-sandbox functionality
- Migrating mockup-sandbox components into `artifacts/apex-os`

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never modify: `.replit`, `pnpm-workspace.yaml` workspace list without user approval
- Never commit: `.env*`, credentials, secrets
- Do not delete `artifacts/mockup-sandbox/` — only move it to `legacy/` if deprecating

**Output Artifacts**
- Documentation: `docs/tooling-decisions.md`
- If deprecating: updated `artifacts/mockup-sandbox/README.md` + move to `legacy/mockup-sandbox/`

**Rollback**
- Granularity: directory-level
- Halt condition: Moving to `legacy/` breaks a build or CI step → restore original location and update `pnpm-workspace.yaml` if needed

**Rules to Follow**
- Decision must be human-approved before any files are moved
- If deprecating: do not delete, only archive to `legacy/`
- `pnpm-workspace.yaml` must be updated if the directory is moved (requires user approval)

**Verification**
```bash
pnpm run build    # must still pass after any directory move
pnpm typecheck
```

**Advanced Code Patterns**
- [N/A] – tooling decision task

**Anti-Patterns**
- Silently removing mockup-sandbox without documentation
- Leaving the directory in `artifacts/` with no owner or purpose

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – tooling decision
- TDD: [N/A]
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] ARCH-004.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ARCH-004.0.5 (AGENT): Research latest best practices (as of 05/2026). Review monorepo conventions for archiving unused workspaces; identify if mockup-sandbox is referenced anywhere in `pnpm-workspace.yaml` or build scripts.
- [ ] ARCH-004.0.75 (AGENT): Reason about the task. Inspect `artifacts/mockup-sandbox/` and confirm it has no active references. If uncertain, ask the user.
- [ ] ARCH-004.1 (HUMAN): Decide fate of mockup-sandbox: deprecate (move to `legacy/`), maintain with assigned owner, or integrate into workflow.
  **Verification:** Decision documented in `docs/tooling-decisions.md`.
- [ ] ARCH-004.2 (AGENT): Implement decision: if deprecating, add deprecation notice to `artifacts/mockup-sandbox/README.md` and move to `legacy/mockup-sandbox/`. Update `pnpm-workspace.yaml` if needed (requires user approval).
  **File(s):** `artifacts/mockup-sandbox/README.md`, `legacy/mockup-sandbox/` (if created), `pnpm-workspace.yaml`
  **Verification:** Mockup sandbox moved (if applicable); README updated; `pnpm run build` passes.
- [ ] ARCH-004.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DOMAIN-004: Define Cross-Cutting Technical Capabilities (ADRs)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Real-time notifications, cross-module search, and CSV import/export lack any architectural definition. No ADRs exist for these cross-cutting concerns. WebSocket infrastructure, search engine selection, and import pipeline design are all undefined.
**Size:** Large

**Description** Produce three ADRs covering: (1) real-time notification strategy (WebSockets/SSE/polling), (2) cross-module search approach (PostgreSQL FTS vs. Meilisearch vs. Typesense), and (3) generic import/export pipeline. These decisions unblock API and infrastructure implementation in Phase 3+.

**Depends on:** DOMAIN-002
**Blocks:** API-NOTIF-001, API-SEARCH-001, API-IMPORT-001, WS-INFRA-001, and all dependent frontend tasks
**Related Files:** `docs/adr/008-real-time-notification-strategy.md`, `docs/adr/009-cross-module-search-strategy.md`, `docs/adr/010-import-export-strategy.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – ADR documentation artifacts

**Definition of Done**
- [ ] `docs/adr/008-real-time-notification-strategy.md` accepted: decides between polling, WebSockets (Socket.io), and SSE; includes fallback behaviour and client library implications
- [ ] `docs/adr/009-cross-module-search-strategy.md` accepted: decides between PostgreSQL FTS, Meilisearch, and Typesense; includes indexing strategy and relevance tuning approach
- [ ] `docs/adr/010-import-export-strategy.md` accepted: defines generic pipeline, supported formats (CSV, XLSX), validation rules, and error handling
- [ ] All three ADRs reviewed and approved by HUMAN
- [ ] ADR-009 specifies that search index updates are eventually consistent (async, via event-driven updates post write)

**Out of Scope**
- Actual implementation of notification, search, or import services (Phase 3)
- Real-time notification UI components (Phase 4)
- Specific API contract definitions (Phase 3)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/adr/008-real-time-notification-strategy.md`
- Documentation: `docs/adr/009-cross-module-search-strategy.md`
- Documentation: `docs/adr/010-import-export-strategy.md`

**Rollback**
- Granularity: file-level (per ADR)
- Halt condition: HUMAN rejects an ADR → revise and resubmit before implementing any dependent infrastructure

**Rules to Follow**
- All notifications must be asynchronous (never block request handlers)
- Delivery failures must be logged and retried with exponential backoff
- Real-time notifications must fall back to polling if WebSocket connection is unavailable
- Notification content must be template-driven (not hardcoded strings)
- ADR-009 must specify that API versioning supports consumer-driven contract testing
- Import pipelines must validate before committing (dry-run mode required)

**Verification**
```bash
# Manual: verify all three ADR files exist with Status: Accepted
# Manual: verify fallback behaviour is documented in ADR-008
# Manual: verify search index update strategy is documented in ADR-009
```

**Advanced Code Patterns**
- Strategy pattern for notification delivery (WebSocket / SSE / polling interchangeable)
- Observer pattern for event-driven notification triggers
- Connection pooling for WebSocket connections (avoid per-request connections)
- Message queue for async processing (Bull/BullMQ or similar, if chosen in ADR)
- Search index updates via domain events (eventual consistency, not synchronous on write)

**Anti-Patterns**
- Blocking notification delivery in request handlers (synchronous sends)
- Mixed concerns: notification logic embedded in business logic instead of domain events
- Lack of delivery guarantees (fire-and-forget without retry)
- Polling interval under 5 seconds (server load risk)
- Rebuilding entire search index on every write

**DDD / TDD / BDD / Deep Module notes**
- DDD: Infrastructure services must be designed as bounded-context ports; ADRs ensure consistency across all business contexts. Notification events must use ubiquitous language terms from the glossary.
- TDD: [N/A] – documentation task
- BDD: [N/A] – infrastructure concern
- Deep Module: The chosen strategies will become deep modules (e.g., WebSocket gateway hiding connection management behind a simple `notify(userId, event)` interface)

---

### Subtasks
- [ ] DOMAIN-004.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DOMAIN-004.0.5 (AGENT): Research latest best practices (as of 05/2026). Compare Socket.io vs. native WebSocket vs. SSE for real-time notifications (2026 landscape); compare Meilisearch v1.x vs. Typesense 27.x vs. PostgreSQL FTS for search; review Bull/BullMQ for async notification processing; review Papa Parse and SheetJS for import/export.
- [ ] DOMAIN-004.0.75 (AGENT): Reason about the task. If technology selection is controversial (especially search engine), raise trade-offs with user before finalising ADRs.
- [ ] DOMAIN-004.1 (AGENT): Create `docs/adr/008-real-time-notification-strategy.md` deciding between polling, WebSockets (Socket.io), and SSE. Include client library implications, fallback behaviour, and infrastructure requirements.
  **File(s):** `docs/adr/008-real-time-notification-strategy.md`
  **Verification:** ADR accepted.
- [ ] DOMAIN-004.2 (AGENT): Create `docs/adr/009-cross-module-search-strategy.md` deciding between PostgreSQL FTS, Meilisearch, and Typesense. Include indexing strategy, relevance tuning, and eventual-consistency update approach.
  **File(s):** `docs/adr/009-cross-module-search-strategy.md`
  **Verification:** ADR accepted.
- [ ] DOMAIN-004.3 (AGENT): Create `docs/adr/010-import-export-strategy.md` defining generic import/export pipeline, supported formats (CSV, XLSX), validation rules, dry-run mode, and error handling.
  **File(s):** `docs/adr/010-import-export-strategy.md`
  **Verification:** ADR accepted.
- [ ] DOMAIN-004.4 (HUMAN): Review and approve all three ADRs.
  **Verification:** Approved.
  **Blocks:** Implementation of notification, search, and import services.
- [ ] DOMAIN-004.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [x] ARCH-005: Define API Versioning Strategy
**Status:** ✅ Done
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** ADR-005 (`docs/adr/005-api-versioning.md`) was created on 2026-05-02 and is Status: Accepted. It establishes `/api/v1/` URL prefix for all Phase 3+ endpoints. ARCH-005.2 (updating Phase 3+ task files) is still pending.
**Size:** Small

**Description** Define and accept the API versioning strategy for all Phase 3+ endpoints. ADR already accepted; remaining work is propagating the `/api/v1/` prefix requirement to all Phase 3+ task files.

**Depends on:** DOMAIN-002
**Blocks:** All Phase 3+ API implementation tasks
**Related Files:** `docs/adr/005-api-versioning.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – ADR documentation artifact

**Definition of Done**
- [x] `docs/adr/005-api-versioning.md` exists with Status: Accepted (complete)
- [x] ADR establishes `/api/v1/` prefix for all Phase 3+ endpoints (complete)
- [x] Versioning policy documented: semver, 6-month backward-compatibility window, deprecation headers (complete)
- [ ] All Phase 3+ task files updated to reference `/api/v1/` prefix requirement

**Out of Scope**
- Implementation of multiple concurrent API versions (deferred to Phase 6+)
- Version negotiation via `Accept` headers (deferred to Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Documentation: `docs/adr/005-api-versioning.md` (already exists)
- Task file updates: `TODO-P3-CRM-CORE.md`, `TODO-P3-FINANCE-CORE.md`, `TODO-P3-PROJECTS-CORE.md`, `TODO-P3-SERVICES.md`, and all Phase 4+ API task files

**Rollback**
- Granularity: file-level (task file text changes only; no code changes required at Phase 0)
- Halt condition: [N/A] – documentation-only update

**Rules to Follow**
- All API endpoints must include `/api/v1/` version prefix
- Breaking changes require a new version (v2, v3, etc.)
- Old versions maintained for at least 6 months after new version introduction
- API contracts must be automatically documented via OpenAPI spec

**Verification**
```bash
# Manual: open docs/adr/005-api-versioning.md and verify Status: Accepted
# Manual: verify Phase 3+ task files reference /api/v1/ prefix
```

**Advanced Code Patterns**
- URL path versioning (`/api/v1/`) is the most explicit and cache-friendly approach
- `Accept: application/vnd.apex.v1+json` header negotiation for future use
- Deprecation headers: `Deprecation: true`, `Sunset: <date>` in responses for old versions

**Anti-Patterns**
- Breaking changes without a version bump
- Mixing versioned and unversioned endpoints in the same service
- Lack of a deprecation policy or timeline

**DDD / TDD / BDD / Deep Module notes**
- DDD: API versioning is a cross-cutting concern enabling bounded context evolution without breaking contracts
- TDD: [N/A] – architectural decision
- BDD: [N/A] – infrastructure concern
- Deep Module: [N/A]

---

### Subtasks
- [x] ARCH-005.0.25 (AGENT): Read the entire task and all related info. *(Complete)*
- [x] ARCH-005.0.5 (AGENT): Research latest best practices. *(Complete)*
- [x] ARCH-005.0.75 (AGENT): Reason about the task. *(Complete)*
- [x] ARCH-005.1 (AGENT): Create API versioning ADR with `/api/v1/` prefix policy.
  **File(s):** `docs/adr/005-api-versioning.md`
  **Verification:** ADR file exists and defines versioning strategy. *(Complete — created 2026-05-02)*
- [ ] ARCH-005.2 (AGENT): Update Phase 3+ task descriptions to reference `/api/v1/` prefix requirement.
  **File(s):** `TODO-P3-CRM-CORE.md`, `TODO-P3-FINANCE-CORE.md`, `TODO-P3-PROJECTS-CORE.md`, `TODO-P3-SERVICES.md`, `TODO-P4-ANALYTICS.md`, `TODO-P4-DASHBOARD.md`, `TODO-P4-SETTINGS.md`, and others
  **Verification:** All API endpoint paths in Phase 3+ include `/api/v1/` prefix.
- [ ] ARCH-005.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.
  **Blocks:** All Phase 3+ API development tasks.

---

## [ ] ARCH-001: Define Multi-Tenancy Strategy (BLOCKING)
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No multi-tenancy strategy defined. Database schema is empty (`lib/db/src/schema/index.ts`). No `organizations` table, no `organization_id` columns, and no tenant-scoping logic exists anywhere.
**Size:** Medium

**Description** Write ADR-001 formalising shared-schema multi-tenancy with `organization_id` on all business tables. Implement a `BaseRepository` pattern providing automatic tenant scoping. Define the `organizations` anchor table and mandate `organization_id` on every Phase 2 schema task.

**Depends on:** DOMAIN-002, TOOLING-004 (logical, not hard-blocked)
**Blocks:** DB-ORG-001, all DB-* schema tasks, every Phase 2 task
**Related Files:** `docs/adr/001-multi-tenancy.md`, `lib/db/src/repositories/base-repository.ts`, `lib/db/src/schema/index.ts`

**Imports / Exports**
- Imports: `drizzle-orm`, `zod`
- Exports: `BaseRepository<T>` class, `organizationsTable` schema, `Organization` type

**Definition of Done**
- [ ] `docs/adr/001-multi-tenancy.md` exists with Status: Accepted, listing all tables requiring `organization_id`
- [ ] ADR specifies: shared-schema approach, `organization_id` (UUID, NOT NULL, FK to `organizations`) on every business table
- [ ] ADR includes convention list covering: users, roles, user_roles, leads, contacts, companies, deals, activities, projects, tasks, milestones, invoices, payments, cards, budgets, folders, documents, assets, asset_checkouts, maintenance_logs, portal_clients, analytics reports, settings, audit_logs, and all domain-expanded tables
- [ ] ADR notes PostgreSQL RLS as Layer 2 defence (deferred post-MVP; isolation via BaseRepository for MVP)
- [ ] ADR approved by HUMAN before any Phase 2 work begins
- [ ] `organizations` table added to Phase 2 schema plan (DB-ORG-001): `id` (uuid PK), `name`, `slug` (unique), `plan_type` (enum), `settings` (JSONB), `created_at`, `updated_at`
- [ ] All Phase 2 DB-* tasks updated with `organization_id` column requirement

**Out of Scope**
- PostgreSQL RLS implementation (deferred post-MVP)
- BaseRepository implementation (Phase 2, ARCH-001.2 subtask)
- Actual schema table creation (Phase 2)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never modify: `.replit`, root `tsconfig.json`
- Never commit: `.env*`, credentials, secrets, actual DATABASE_URL values
- Do NOT run `pnpm --filter @workspace/db run push` without explicit user approval

**Output Artifacts**
- Documentation: `docs/adr/001-multi-tenancy.md`
- Schema plan update: Phase 2 DB-* task files (adding `organization_id` requirement)
- Code (Phase 2): `lib/db/src/repositories/base-repository.ts` (BaseRepository — implemented in ARCH-001.2, Phase 2)

**Rollback**
- Granularity: file-level (ADR and task file updates only at this phase)
- Halt condition: HUMAN rejects the shared-schema strategy → pause all Phase 2 schema work; redesign tenant isolation approach

**Rules to Follow**
- All repositories MUST extend BaseRepository (implemented in Phase 2)
- Tenant filtering must be automatic and transparent — no manual `WHERE organization_id =` in service code
- Repository methods must return domain objects, not raw database rows
- All database operations must be transactional
- PostgreSQL RLS as Layer 2 defence must be evaluated for all tables holding PII or financial data
- Column naming: always `organization_id`, never `tenant_id` or `org_id`

**Verification**
```bash
# Manual: open docs/adr/001-multi-tenancy.md and verify Status: Accepted
# Manual: verify organization_id column requirement added to Phase 2 DB-* tasks
# Phase 2 verification: pnpm vitest run base-repository
# Phase 2 verification: pnpm typecheck
```

**Advanced Code Patterns**
- Repository pattern with automatic tenant scoping via `BaseRepository<T>(organizationId)` constructor
- Generic CRUD operations in base class: `findById`, `findAll`, `create`, `update`, `delete` — all auto-scoped
- Unit of work pattern for transaction management across multiple repository operations
- Index on `(organization_id)` for all high-read tables (mandatory for query performance)

**Anti-Patterns**
- Direct database queries without tenant filtering (`SELECT * FROM leads` without `WHERE organization_id = ?`)
- Manual `organization_id` handling in every query (error-prone; defeats the purpose of BaseRepository)
- Repository methods returning raw `pg` rows instead of domain entities
- Missing FK constraint on `organization_id` → orphaned records

**DDD / TDD / BDD / Deep Module notes**
- DDD: Multi-tenancy is a cross-cutting architectural concern. Shared-schema keeps all tenant data in one database while enforcing isolation via `organization_id` filters. Every bounded context must respect this column. Organization is the root aggregate for all tenant-owned data.
- TDD: Repository tests MUST verify all queries are automatically scoped to current tenant (cannot return data for wrong organization).
- BDD: [N/A] – infrastructure concern
- Deep Module: `BaseRepository` is a deep module — simple interface (`findAll(orgId)`) hiding complex tenant-scoping, query building, and result mapping logic

---

### Subtasks
- [ ] ARCH-001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ARCH-001.0.5 (AGENT): Research latest best practices (as of 05/2026). Review shared-schema vs. schema-per-tenant vs. DB-per-tenant trade-offs for SaaS; study PostgreSQL RLS patterns for Drizzle ORM; review BaseRepository patterns in TypeScript monorepos.
- [ ] ARCH-001.0.75 (AGENT): Reason about the task. If any aspect of the multi-tenancy strategy is ambiguous or the column convention list is incomplete, check with the user before writing.
- [ ] ARCH-001.1 (AGENT): Create `docs/adr/001-multi-tenancy.md` with Status: Accepted. Content: Decision (shared-schema with `organization_id`), Rationale (Drizzle compatibility, simple migrations, single PostgreSQL DB, RLS deferred), Convention (full table list), Repository filter pattern (BaseRepository).
  **File(s):** `docs/adr/001-multi-tenancy.md`
  **Verification:** ADR file exists and lists all tables including identity and domain tables.
- [ ] ARCH-001.2 (AGENT): *(Moved to Phase 2 as ARCH-001.2 — see TODO-P2.md after DB-ORG-001.2)* Implement `BaseRepository<T>` with automatic `organization_id` scoping.
  **File(s):** `lib/db/src/repositories/base-repository.ts`
  **Verification:** Phase 2 — `pnpm vitest run base-repository` passes.
- [ ] ARCH-001.3 (AGENT): Add `organizations` table to Phase 2 schema plan (DB-ORG-001): `id` (uuid PK), `name` (text), `slug` (unique), `plan_type` (enum: free/pro/enterprise), `settings` (JSONB default {}), `created_at`, `updated_at`.
  **File(s):** Phase 2 task file (TODO-P2-ORGANIZATIONS.md or equivalent)
  **Verification:** Schema plan for organizations table documented.
- [ ] ARCH-001.4 (AGENT): Add `organization_id` column requirement to EVERY Phase 2 DB-* task, including identity tables. Blanket amendment: every DB-* "Definition of Done" must include `organization_id: uuid('organization_id').notNull().references(() => organizationsTable.id)` with index on `(organization_id)` for high-read tables.
  **File(s):** All Phase 2 `TODO-P2-*.md` files
  **Verification:** All Phase 2 schema tasks include `organization_id` requirement.
- [ ] ARCH-001.5 (HUMAN): Review ADR and confirm strategy before any Phase 2 work begins.
  **Verification:** ADR approved.
  **Blocks:** DB-ORG-001, all DB-* tasks, TOOLING-004.
- [ ] ARCH-001.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.
---

## Architecture Wave Completion Criteria

**Wave Status:** [ ] Complete (1/6 parent tasks done — ARCH-005 ✅)

**Dependencies for Next Waves:**
- ARCH-007 clarifies Appointments vs Projects boundary
- ARCH-003 defines E-Sign integration scope
- ARCH-004 establishes cross-cutting infrastructure strategy and resolves mockup-sandbox maintenance question
- ARCH-005 ✅ API versioning ADR accepted (`docs/adr/005-api-versioning.md`) — Phase 3+ task updates still pending (ARCH-005.2)
- ARCH-001 establishes critical multi-tenancy strategy (BLOCKING all Phase 2 schema work)
- DOMAIN-004 defines cross-cutting capability ADRs (notifications, search, import/export)

**Next Wave:** BEHAVIOR tasks (requires architecture decisions)
