# TODO-P4-SETTINGS.md – Phase 4 System Configuration Context



This file covers the System Settings and Audit Log retrieval APIs. Settings control platform behaviour; all changes are audited. All endpoints require admin authentication.

---

## System Configuration Context

*This section builds the System Settings and Audit Log retrieval APIs. Settings control platform behaviour; changes are audited. All endpoints require admin authentication.*

### [ ] API‑SETTINGS‑001: System Settings – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No settings endpoints exist in the OpenAPI spec. `lib/api-spec/openapi.yaml` has no `settings` tag. Platform configuration is hardcoded; admins cannot query or update settings via API.  
**Size:** Small  

**Description:** Extend the OpenAPI spec with system settings CRUD and audit endpoints, enabling codegen to produce typed hooks and Zod validators for settings management.  

**Depends on:** DB‑SETTINGS‑001 (system_settings table), DB‑SETTINGS‑002 (audit logs table)  
**Blocks:** API‑SETTINGS‑002 (integration tests require spec)  
**Related Files:** `lib/api-spec/openapi.yaml`  

**Imports / Exports**
- Imports: [N/A — YAML spec file]
- Exports: `settings` tag and paths in `lib/api-spec/openapi.yaml`; generated types via codegen

**Definition of Done**
- [ ] OpenAPI spec adds `settings` tag with all paths
- [ ] `GET /settings` — list all key-value settings (admin only)
- [ ] `GET /settings/public` — list public settings (no auth required, with cache headers)
- [ ] `PUT /settings/{key}` — update setting value (admin only)
- [ ] `POST /settings/bulk-update` — update multiple settings atomically (admin only)
- [ ] `GET /settings/audit` — get audit log of setting changes (admin only)
- [ ] Schemas: `SystemSetting`, `SettingUpdate`, `BulkUpdateRequest`, `SettingAuditEntry` in `components/schemas`
- [ ] `GET /settings/public` includes `Cache-Control: max-age=900` header annotation
- [ ] `pnpm --filter @workspace/api-spec run codegen` succeeds with no errors
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Dynamic setting key creation (keys are predefined)
- Real-time setting synchronisation via WebSocket
- User-level settings (this is organisation/system level)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Do not hand-edit generated files — always run `codegen` after spec changes

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — revert settings tag/paths from `openapi.yaml`; re-run codegen
- Halt condition: if `codegen` fails or produces type errors, stop and fix spec

**Rules to Follow**
- Admin-only endpoints must be clearly annotated with auth requirements
- `GET /settings/public` must be explicitly marked as no-auth with cache headers
- Bulk update must be documented as atomic (all-or-nothing)

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck
```

**Advanced Code Patterns**
- Reuse `PaginationParams` parameter component from existing spec
- Use `additionalProperties: false` on `BulkUpdateRequest` to prevent unexpected keys

**Anti-Patterns**
- Missing admin auth annotation — exposes sensitive configuration
- No cache header annotation on public settings — misses documentation of caching contract

**DDD / TDD / BDD / Deep Module notes**
- DDD: System settings are a cross-cutting concern; the spec defines the admin management interface
- TDD: Spec must be complete before API‑SETTINGS‑002 tests can be written
- BDD: "As an admin, I can update the organisation name setting and see the change reflected immediately"
- Deep Module: The spec hides validation, caching, and audit complexity behind simple key-value REST endpoints

---

### Subtasks

- [ ] API‑SETTINGS‑001.0.25 (AGENT): Read this task, `lib/api-spec/openapi.yaml` (existing structure), `DB‑SETTINGS‑001`, and `DB‑SETTINGS‑002` schema definitions in full.  
  *No action — pause until fully understood.*

- [ ] API‑SETTINGS‑001.0.5 (AGENT): Research OpenAPI 3.0 patterns for key-value configuration APIs (May 2026). Confirm cache header annotation approach in the spec.  
  *Document findings briefly or note "no changes."*

- [ ] API‑SETTINGS‑001.0.75 (AGENT): Reason about whether setting keys should be an enum in the spec or free-form strings. Default: use enum to enforce allowed keys and enable validation.  
  *If uncertain, use enum approach.*

- [ ] API‑SETTINGS‑001.1 (AGENT): Add settings paths and schemas to OpenAPI with auth annotations.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Spec validates; admin vs public access clearly marked.

- [ ] API‑SETTINGS‑001.2 (AGENT): Run `pnpm --filter @workspace/api-spec run codegen` and `pnpm run typecheck`.  
  **File(s):** [N/A — generated files]  
  **Verification:** No type errors; generated types available.

- [ ] API‑SETTINGS‑001.3 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑SETTINGS‑002: System Settings – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No settings integration tests exist. `artifacts/api-server/src/__tests__/api/settings/` does not exist. All settings endpoint tests are blocked until the API‑SETTINGS‑001 spec is complete.  
**Size:** Small  

**Description:** Write failing integration tests for all settings endpoints (TDD red phase), including public vs. admin access patterns, bulk update atomicity, and audit log verification.  

**Depends on:** API‑SETTINGS‑001, TEST‑INFRA‑001  
**Blocks:** API‑SETTINGS‑003 (service must satisfy these tests)
**Related Files:** `artifacts/api-server/src/__tests__/api/settings/settings.test.ts`  

**Imports / Exports**
- Imports: `supertest`; `createTestServer()`, `generateTestToken()` from test utilities
- Exports: [N/A — test file]

**Definition of Done**
- [ ] `artifacts/api-server/src/__tests__/api/settings/settings.test.ts` exists with failing tests for:
- [ ] `GET /settings/public` → 200, cache headers present
- [ ] `GET /settings` (admin) → 200, all settings returned
- [ ] `PUT /settings/{key}` (admin) → 200, audit log entry created
- [ ] `POST /settings/bulk-update` (admin) → 200, all settings updated atomically
- [ ] `POST /settings/bulk-update` with one invalid key → 400, no settings changed (atomicity)
- [ ] Unauthorized setting update → 403 `InsufficientPermissions`
- [ ] Invalid setting key → 400 `ConfigurationError`
- [ ] Setting not found → 404 `ConfigurationError`
- [ ] Test suite compiles and runs with all tests red
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Testing audit log write operations directly
- Performance or load testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Tests must always use `TEST_DATABASE_URL`

**Output Artifacts**
- Code changes in: [N/A]
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/settings/settings.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/__tests__/api/settings/`; no DB state changes
- Halt condition: if test file fails to compile, stop and fix TypeScript errors

**Rules to Follow**
- Atomicity test: send bulk update with one invalid key; verify zero settings were changed
- Admin vs public access must be verified with appropriate tokens
- Tests must be independent via `afterEach` teardown

**Verification**
```bash
pnpm --filter @workspace/api-server test -- settings.test.ts
# Expected: all tests red
pnpm run typecheck
```

**Advanced Code Patterns**
- Seed settings table with known values in `beforeAll` for predictable test assertions
- Use both admin and non-admin tokens to verify access control

**Anti-Patterns**
- Writing implementation before tests — violates TDD red phase
- Missing atomicity test for bulk update — critical business rule not verified

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: This IS the red phase; all tests must fail before implementation begins
- BDD: "When an admin updates the organisation name setting, the change is visible to all users immediately"
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑SETTINGS‑002.0.25 (AGENT): Read this task, API‑SETTINGS‑001 spec, and `TEST‑INFRA‑001` test harness documentation in full.  
  *No action — pause until fully understood.*

- [ ] API‑SETTINGS‑002.0.5 (AGENT): Research patterns for testing settings/config APIs with atomicity requirements (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑SETTINGS‑002.0.75 (AGENT): Reason about test data strategy for settings. Default: pre-seed known settings in `beforeAll`, verify via `GET /settings`.  
  *If uncertain, use direct DB seed approach.*

- [ ] API‑SETTINGS‑002.1 (AGENT): Write all integration tests for settings endpoints. Tests must all fail (red phase).  
  **File(s):** `artifacts/api-server/src/__tests__/api/settings/settings.test.ts`  
  **Verification:** `pnpm --filter @workspace/api-server test -- settings.test.ts` compiles and runs; all tests red.

- [ ] API‑SETTINGS‑002.2 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑SETTINGS‑003: System Settings – Service & Repository
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** No `SettingsRepository` or `SettingsService` exists. Settings management services are completely absent. Integration tests from API‑SETTINGS‑002 are all failing.  
**Size:** Medium  

**Description:** Implement `SettingsRepository` and `SettingsService` with key validation, in-memory caching for public settings (15 minutes), atomic bulk updates, and `SettingChanged` event emission.  

**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002, ARCH‑001.2 (BaseRepository)  
**Blocks:** API‑SETTINGS‑004 (routes require service)
**Related Files:** `lib/db/src/repositories/settings.ts`, `artifacts/api-server/src/services/settings/settings-service.ts`  

**Imports / Exports**
- Imports: `BaseRepository` from `@workspace/db`; `drizzle-orm` (eq); `SystemSetting` schema type; event bus interface
- Exports: `SettingsRepository` (class), `SettingsService` (class), `SettingKey` (enum), `SettingChanged` (event type)

**Definition of Done**
- [ ] `lib/db/src/repositories/settings.ts` exports `SettingsRepository` extending `BaseRepository<SystemSetting>`
- [ ] `artifacts/api-server/src/services/settings/settings-service.ts` exports `SettingsService` with:
  - [ ] `getPublicSettings()` — returns non-sensitive settings; caches result for 15 minutes per org
  - [ ] `updateSetting(key, value, userId)` — validates key exists, updates, emits `SettingChanged`
  - [ ] `bulkUpdate(updates, userId)` — atomic Drizzle transaction; emits events per change; rolls back if any key invalid
  - [ ] `getSettingAudit(key?, dateRange?)` — paginated audit log query
- [ ] Setting keys validated against `SettingKey` enum at service layer; unknown keys return `ConfigurationError`
- [ ] Public settings cache invalidated on any `updateSetting` or `bulkUpdate` call
- [ ] All service methods return `Result<T, DomainError>`
- [ ] Unit tests cover success paths, invalid key rejection, bulk atomicity, and cache invalidation
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Dynamic setting key creation
- Real-time cache synchronisation across multiple server instances
- User-level settings

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `SettingKey` enum is the source of truth — never accept arbitrary string keys from callers

**Output Artifacts**
- Code changes in: `lib/db/src/repositories/settings.ts`, `artifacts/api-server/src/services/settings/settings-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/settings/settings-service.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `lib/db/src/repositories/settings.ts` and `artifacts/api-server/src/services/settings/`; no DB state changes
- Halt condition: if `pnpm run typecheck` fails or bulk atomicity tests fail, stop and fix before proceeding

**Rules to Follow**
- `bulkUpdate` must be wrapped in a single Drizzle transaction — all-or-nothing semantics
- Public settings cache must be per-organisation (keyed by `organizationId`)
- Always emit `SettingChanged` event after successful update for audit trail
- Method count must be ≤ 4 to maintain deep module principle

**Verification**
```bash
pnpm --filter @workspace/api-server test -- settings-service
pnpm run typecheck
```

**Advanced Code Patterns**
- In-memory `Map<orgId, { data, expiresAt }>` cache for public settings — simple and effective for single-instance deployments
- Drizzle `db.transaction()` for `bulkUpdate` — atomic with automatic rollback on error
- `SettingKey` enum at the service layer — fail fast on invalid keys before any DB access

**Anti-Patterns**
- Accepting arbitrary string keys from callers — use `SettingKey` enum
- Cache without expiry or invalidation on write — stale data risk
- Missing atomicity in bulk update — partial updates violate business rule

**DDD / TDD / BDD / Deep Module notes**
- DDD: Settings are a platform infrastructure concern; the service enforces the allowed key schema
- TDD: Write unit tests for invalid key rejection and bulk atomicity before implementing
- BDD: "When an admin bulk-updates 3 settings and one has an invalid key, none of the 3 settings change"
- Deep Module: `SettingsService` hides caching, validation, transaction, and event emission behind four methods

---

### Subtasks

- [ ] API‑SETTINGS‑003.0.25 (AGENT): Read this task, `DB‑SETTINGS‑001` schema, `ARCH‑001.2-IMPL` BaseRepository spec, and `settings.test.ts` (integration tests) in full.  
  *No action — pause until fully understood.*

- [ ] API‑SETTINGS‑003.0.5 (AGENT): Research in-process caching patterns for Node.js ESM services (May 2026). Confirm `Map`-based TTL cache is sufficient vs. Redis for single-instance setup.  
  *Document findings briefly or note "no changes."*

- [ ] API‑SETTINGS‑003.0.75 (AGENT): Reason about whether `SettingKey` should be a TypeScript `enum` or `const` object. Default to `const` object with `as const` for better tree-shaking.  
  *If uncertain, use `const` object pattern.*

- [ ] API‑SETTINGS‑003.1 (AGENT): Implement `SettingsRepository` with audit support.  
  **File(s):** `lib/db/src/repositories/settings.ts`  
  **Verification:** Unit tests against test DB pass.

- [ ] API‑SETTINGS‑003.2 (AGENT): Implement `SettingsService` with validation, caching, and events.  
  **File(s):** `artifacts/api-server/src/services/settings/settings-service.ts`  
  **Verification:** Unit tests with mocked cache and repository pass.

- [ ] API‑SETTINGS‑003.3 (AGENT): Write unit tests for all service methods (success + error paths + atomicity).  
  **File(s):** `artifacts/api-server/src/__tests__/services/settings/settings-service.test.ts`  
  **Verification:** All tests green.

- [ ] API‑SETTINGS‑003.4 (AGENT): Verify method count ≤ 4 and service encapsulates all complexity.  
  **File(s):** [N/A — inspection]  
  **Verification:** `pnpm run typecheck` clean; manual inspection confirms method count.

- [ ] API‑SETTINGS‑003.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] API‑SETTINGS‑004: System Settings – Routes & Green Tests
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No settings routes exist. Integration tests from API‑SETTINGS‑002 are all failing (red). `artifacts/api-server/src/routes/settings.ts` does not exist.  
**Size:** Small  

**Description:** Wire settings routes with admin/public auth middleware and Zod validation, turning the API‑SETTINGS‑002 integration tests from red to green.  

**Depends on:** API‑SETTINGS‑003 (service), AUTH‑008 (admin auth middleware)  
**Blocks:** [N/A — final phase of settings implementation]
**Related Files:** `artifacts/api-server/src/routes/settings.ts`, `artifacts/api-server/src/routes/index.ts`  

**Imports / Exports**
- Imports: `express` (Router); `SettingsService`; `adminAuthMiddleware` from AUTH‑008; generated Zod schemas
- Exports: `settingsRouter` (Express Router)

**Definition of Done**
- [ ] `artifacts/api-server/src/routes/settings.ts` exports `settingsRouter` with all 5 endpoints wired
- [ ] `GET /settings/public` — no auth, sets `Cache-Control: max-age=900` header
- [ ] `GET /settings`, `PUT /settings/{key}`, `POST /settings/bulk-update`, `GET /settings/audit` — all require `adminAuthMiddleware`
- [ ] Request validation uses generated Zod schemas
- [ ] `settingsRouter` mounted at `/settings` in `routes/index.ts`
- [ ] All integration tests from API‑SETTINGS‑002 pass (green)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Cache warming or pre-loading on startup
- WebSocket push on setting change

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/settings.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: [N/A — existing tests from API‑SETTINGS‑002 must turn green]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/routes/settings.ts`; revert `routes/index.ts` mount
- Halt condition: if integration tests do not turn green after route wiring, stop and debug

**Rules to Follow**
- `GET /settings/public` must set `Cache-Control: max-age=900` header in the route handler
- All admin routes must use `adminAuthMiddleware`; public route must have NO auth middleware
- Use generated Zod schemas only; do not write custom validation schemas

**Verification**
```bash
pnpm --filter @workspace/api-server test -- settings.test.ts
# Expected: all tests green
pnpm run typecheck
```

**Advanced Code Patterns**
- Explicit `Cache-Control` header set in `GET /settings/public` route handler
- `asyncHandler` wrapper for all routes to avoid try/catch boilerplate

**Anti-Patterns**
- Admin middleware on the public settings endpoint — breaks anonymous access
- Custom validation schemas instead of generated ones — breaks type contract

**DDD / TDD / BDD / Deep Module notes**
- DDD: Routes are the API layer; they delegate to the domain service
- TDD: This is the green phase; routes must make API‑SETTINGS‑002 tests pass
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks

- [ ] API‑SETTINGS‑004.0.25 (AGENT): Read this task, `settings.test.ts`, `SettingsService` implementation, and `routes/index.ts` in full.  
  *No action — pause until fully understood.*

- [ ] API‑SETTINGS‑004.0.5 (AGENT): Research Express 5 `Cache-Control` header setting patterns and middleware ordering (May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] API‑SETTINGS‑004.0.75 (AGENT): Reason about middleware ordering for the public vs. admin settings routes. Ensure public route never passes through admin auth middleware.  
  *If uncertain, check existing route structure for the pattern.*

- [ ] API‑SETTINGS‑004.1 (AGENT): Create settings routes wired to `SettingsService` with appropriate auth middleware.  
  **File(s):** `artifacts/api-server/src/routes/settings.ts`  
  **Verification:** Route file compiles; `pnpm run typecheck` clean.

- [ ] API‑SETTINGS‑004.2 (AGENT): Mount `settingsRouter` in main router.  
  **File(s):** `artifacts/api-server/src/routes/index.ts`  
  **Verification:** `pnpm run typecheck` clean.

- [ ] API‑SETTINGS‑004.3 (AGENT): Run integration tests from API‑SETTINGS‑002 to green.  
  **File(s):** [N/A — run existing tests]  
  **Verification:** `pnpm --filter @workspace/api-server test -- settings.test.ts` → all green.

- [ ] API‑SETTINGS‑004.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

## Execution Order

```
API‑SETTINGS‑001 (OpenAPI spec + codegen)
  └─> API‑SETTINGS‑002 (integration tests, TDD red)
        └─> API‑SETTINGS‑003 (service & repository)
              └─> API‑SETTINGS‑004 (routes + green tests)
```
