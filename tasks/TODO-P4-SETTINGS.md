# TODO-P4-SETTINGS.md – Phase 4 System Configuration Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the System Settings and Audit Log retrieval APIs. Settings control platform behaviour; changes are audited. All endpoints require admin authentication.

---

## System Configuration Context

*This section builds the System Settings and Audit Log retrieval APIs. Settings control platform behaviour; changes are audited. All endpoints require admin authentication.*

### [ ] API‑SETTINGS‑001: System Settings – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑SETTINGS‑001, DB‑SETTINGS‑002.  
**Definition of Done:** OpenAPI spec adds `settings` tag and paths:  
- `GET /settings` – list all key‑value settings (admin only)  
- `GET /settings/public` – list public settings (no auth required)  
- `PUT /settings/{key}` – update setting value (admin only)  
- `POST /settings/bulk‑update` – update multiple settings atomically (admin only)  
- `GET /settings/audit` – get audit log of setting changes (admin only)  

Schemas: `SystemSetting`, `SettingUpdate`, `BulkUpdateRequest`, `SettingAuditEntry`.  
**Caching:** Public settings endpoint includes cache headers (15 minutes).  
**Audit:** All changes logged with user context and timestamp.

**Subtasks:**
- [ ] API‑SETTINGS‑001.1: Add settings paths and schemas to OpenAPI with auth annotations. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; admin vs public access clearly marked.
- [ ] API‑SETTINGS‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.

---

### [ ] API‑SETTINGS‑002: System Settings – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑SETTINGS‑001, TEST‑INFRA‑001.  
**Definition of Done:** `artifacts/api-server/__tests__/api/settings/settings.test.ts` contains failing tests for:  
- `GET /settings/public` → 200, cache headers present  
- `PUT /settings/{key}` (admin) → 200, audit log entry created  
- `POST /settings/bulk‑update` → 200, all settings updated atomically  
- Unauthorized setting update → 403 `InsufficientPermissions`  
- Invalid setting key → 400 `ConfigurationError`  
- Setting not found → 404 `ConfigurationError`

**Subtasks:**
- [ ] API‑SETTINGS‑002.1: Write integration tests for all settings endpoints. (AGENT)  
  **verification:** Tests compile and run, all red.

---

### [ ] API‑SETTINGS‑003: System Settings – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002, ARCH‑001.2.  
**Definition of Done:**  
- `lib/db/src/repositories/settings.ts` exports `SettingsRepository` extending `BaseRepository<SystemSetting>`.  
- `artifacts/api-server/src/services/settings/settings-service.ts` exports `SettingsService` with methods:  
  - `getPublicSettings()` – returns non‑sensitive settings with caching  
  - `updateSetting(key, value, userId)` – validates setting exists, updates, emits `SettingChanged` event  
  - `bulkUpdate(updates, userId)` – atomic transaction, emits events for each change  
  - `getSettingAudit(key?, dateRange?)` – paginated audit log  
- **Validation:** Setting keys validated against allowed keys schema  
- **Caching:** Public settings cached in memory for 15 minutes  
- **Events:** Emits `SettingChanged` for audit trail  
- **Deep Module:** Service hides validation, caching, and audit complexity

**Subtasks:**
- [ ] API‑SETTINGS‑003.1: Implement `SettingsRepository` with audit support. (AGENT) – `lib/db/src/repositories/settings.ts`  
  **verification:** Unit tests pass.
- [ ] API‑SETTINGS‑003.2: Implement `SettingsService` with validation, caching, and events. (AGENT) – `settings-service.ts`  
  **verification:** Unit tests with mocked cache and event bus pass.
- [ ] API‑SETTINGS‑003.3: Write unit tests for all service methods. (AGENT)  
  **verification:** All tests green.
- [ ] API‑SETTINGS‑003.4: Depth refactor check: method count ≤ 6, service encapsulates validation/caching/audit. (AGENT)  
  **verification:** Manual inspection + `pnpm typecheck`.

---

### [ ] API‑SETTINGS‑004: System Settings – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑SETTINGS‑003, AUTH‑008.  
**Subtasks:** routes with admin auth, integration tests green.

---

## Progress Tracking

### Overall Status
**System Configuration Context:** [ ] 0/4 parent tasks complete

### Context Breakdown
- **Settings API:** [ ] 0/1 complete (OpenAPI spec)
- **Settings Tests:** [ ] 0/1 complete (integration tests)
- **Settings Service:** [ ] 0/1 complete (service & repository)
- **Settings Routes:** [ ] 0/1 complete (routes & green tests)

### Dependencies
- **DB-SETTINGS-001/002** enable settings database operations
- **ERROR-002** enables proper error handling
- **AUTH-008** enables admin authentication
- **ARCH-001.2** provides BaseRepository pattern

### Next Actions
- [ ] Start API-SETTINGS-001.1: Add settings paths to OpenAPI
- [ ] Start API-SETTINGS-002.1: Write integration tests (red)
- [ ] Start API-SETTINGS-003.1: Implement SettingsRepository

### Verification Commands
```bash
# Settings verification
pnpm test -- settings
pnpm typecheck

# Service verification
pnpm test -- settings-service
pnpm typecheck

# Routes verification
pnpm test -- settings-routes
pnpm typecheck
```

---

## File Index

### Settings Backend
- `lib/api-spec/openapi.yaml` - Settings OpenAPI paths and schemas
- `artifacts/api-server/src/services/settings/settings-service.ts` - Settings management service
- `lib/db/src/repositories/settings.ts` - Settings repository
- `routes/settings.ts` - Settings routes
- `artifacts/api-server/__tests__/api/settings/settings.test.ts` - Integration tests

### Settings Components
- `artifacts/api-server/src/services/settings/` - Settings service modules:
  - `cache-service.ts` - Settings caching
  - `audit-service.ts` - Audit logging
