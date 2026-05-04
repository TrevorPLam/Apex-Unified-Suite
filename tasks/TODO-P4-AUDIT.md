# TODO-P4-AUDIT.md – Phase 4 Cross‑Cutting Audit & Monitoring

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the Audit Log Query API and management capabilities. Audit logs are append‑only records of all domain events across contexts.

---

## Cross‑Cutting Audit & Monitoring

*This section provides the audit log query API and management capabilities. Audit logs are append‑only records of all domain events across contexts.*

### [ ] API‑AUDIT‑001: Audit Log Query – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑SETTINGS‑002 (audit logs table).  
**Definition of Done:** OpenAPI spec adds `audit` tag and paths:  
- `GET /audit/logs` – list audit logs with pagination, filter by context, action, date range, user  
- `GET /audit/logs/{logId}` – get specific audit log entry  
- `GET /audit/summary` – get audit statistics (counts by action, by context)  
- `POST /audit/export` – export audit logs to CSV (async job)  

All endpoints require admin authentication.  
Performance optimized with database indexes and pagination limits.

**Subtasks:**
- [ ] API‑AUDIT‑001.1: Add audit paths and schemas to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates with admin auth requirements.
- [ ] API‑AUDIT‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.

---

### [ ] API‑AUDIT‑002: Audit Log Query – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑AUDIT‑001, TEST‑INFRA‑001.  
**Definition of Done:** Failing tests for audit log retrieval, filtering, pagination, and export functionality.

**Subtasks:**
- [ ] API‑AUDIT‑002.1: Write integration tests for audit endpoints. (AGENT)  
  **verification:** Tests compile and run, all red.

---

### [ ] API‑AUDIT‑003: Audit Log Query – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ARCH‑001.2.  
**Definition of Done:**  
- `AuditRepository` extending `BaseRepository<AuditLog>` (no soft delete, append‑only)  
- `AuditService` with methods for querying, filtering, and exporting audit logs  
- Optimized queries using database indexes on `(organization_id, created_at)`, `(action)`, `(context)`  
- Advanced Code Patterns: Repository pattern with query optimization, service layer with error handling  
- Anti-Patterns: Avoid N+1 queries, prevent direct database access from routes  

**Subtasks:**
- [ ] API‑AUDIT‑003.1: Implement repository and service for audit logs. (AGENT)  
  **verification:** Unit tests pass.

---

### [ ] API‑AUDIT‑004: Audit Log Query – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑AUDIT‑003, AUTH‑008.  
**Subtasks:** routes with admin auth, integration tests green.

---

## Progress Tracking

### Overall Status
**Cross‑Cutting Audit & Monitoring:** [ ] 0/4 parent tasks complete

### Context Breakdown
- **Audit API:** [ ] 0/1 complete (OpenAPI spec)
- **Audit Tests:** [ ] 0/1 complete (integration tests)
- **Audit Service:** [ ] 0/1 complete (service & repository)
- **Audit Routes:** [ ] 0/1 complete (routes & green tests)

### Dependencies
- **DB-SETTINGS-002** enables audit log database operations
- **AUTH-008** enables admin authentication
- **ARCH-001.2** provides BaseRepository pattern

### Next Actions
- [ ] Start API-AUDIT-001.1: Add audit paths to OpenAPI
- [ ] Start API-AUDIT-002.1: Write integration tests (red)
- [ ] Start API-AUDIT-003.1: Implement repository and service

### Verification Commands
```bash
# Audit verification
pnpm test -- audit
pnpm typecheck

# Service verification
pnpm test -- audit-service
pnpm typecheck

# Routes verification
pnpm test -- audit-routes
pnpm typecheck
```

---

## File Index

### Audit Backend
- `lib/api-spec/openapi.yaml` - Audit OpenAPI paths and schemas
- `artifacts/api-server/src/services/audit/audit-service.ts` - Audit management service
- `lib/db/src/repositories/audit.ts` - Audit repository
- `routes/audit/audit.ts` - Audit routes
- `artifacts/api-server/__tests__/api/audit/audit.test.ts` - Integration tests

### Audit Components
- `artifacts/api-server/src/services/audit/` - Audit service modules:
  - `export-service.ts` - CSV export functionality
  - `filter-service.ts` - Query filtering logic
