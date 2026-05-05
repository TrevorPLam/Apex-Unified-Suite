# tasks/infrastructure/SETTINGS‑AUDIT.md – System Configuration & Audit Log

This file covers the System Settings and Audit Log bounded contexts: database schemas for system configuration (per‑org key‑value), audit logs (immutable append‑only event journal), user preferences (per‑user config), and the API layers for managing settings and querying audit logs. All administrative endpoints require admin authentication.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## System Settings – Database

### [ ] DB‑SETTINGS‑001: Define System Settings Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No settings table. Platform configuration is hardcoded.
**Size:** Small

**Description:** Define the `system_settings` table – a per‑organisation key‑value store for platform configuration values (e.g., org name, default currency, features enabled). Keys are predefined by the application; values are JSONB for flexibility.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑001`
**Related Files:** `lib/db/src/schema/settings/system_settings.ts`, `lib/db/src/__tests__/settings‑system.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK NOT NULL), `key` (text NOT NULL), `value` (jsonb NOT NULL), `updated_by` (uuid FK → users, nullable), `created_at`, `updated_at`
- [ ] Composite unique constraint on `(organization_id, key)`
- [ ] Zod schemas exported; `value` is validated as `z.unknown()` (application‑layer validation enforces specific types per key)
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Dynamic key creation (keys are predefined by the application; new keys are added via migrations)
- Per‑user settings (handled by DB‑SETTINGS‑003)

**Rules to Follow**
- All queries must include `organization_id`
- `key` is unique per organisation – composite unique constraint
- `value` is typed per‑key at the application validation layer (not the DB)

**Verification**
```bash
pnpm --filter @workspace/db test -- settings‑system.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: System settings are platform infrastructure – not a bounded context aggregate.
- TDD: Assert composite unique constraint, JSONB column, `updated_by` nullable.
- BDD: Enables “Admins can update platform configuration” scenarios.

---

### Subtasks
- [ ] DB‑SETTINGS‑001.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑SETTINGS‑001.0.5 (AGENT): Research Drizzle `jsonb` column and composite unique index.
- [ ] DB‑SETTINGS‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/settings‑system.test.ts` **Verification:** RED.
- [ ] DB‑SETTINGS‑001.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm run typecheck` clean.
- [ ] DB‑SETTINGS‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑SETTINGS‑002: Define Audit Logs Table (Append‑Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No audit log table. Domain events are not persisted for audit trail.
**Size:** Small

**Description:** Define the `audit_logs` table – an append‑only, immutable record of all significant domain events across every bounded context. Each row captures the action, context, entity, optional before/after diff, and the actor who performed it.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑001`, `infrastructure/EVENT‑BUS.md → EVENT‑SUBSCRIBE‑002`
**Related Files:** `lib/db/src/schema/settings/audit_logs.ts`, `lib/db/src/__tests__/settings‑audit.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `action` (text NOT NULL – e.g., `lead_created`, `invoice_paid`), `context` (text NOT NULL – bounded context name), `entity_type` (text NOT NULL), `entity_id` (uuid NOT NULL), `changes` (jsonb nullable), `performed_by` (uuid nullable), `performed_at` (timestamp NOT NULL default `now()`), `metadata` (jsonb nullable), `created_at` (NO `updated_at`, NO `deleted_at` – append‑only)
- [ ] Indexes: `(organization_id, performed_at DESC)`, `(entity_type, entity_id)`, `(action)`, `(context)`
- [ ] Zod schemas exported; unit tests pass
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Personal data redaction in audit logs (future compliance feature)
- Retention‑policy‑based auto‑purging (future)

**Rules to Follow**
- Absolutely no `UPDATE` or `DELETE` operations on this table – strictly append‑only
- `performed_by` can be null for system‑triggered events
- `changes` JSONB should contain a structured diff, not raw object dumps

**Verification**
```bash
pnpm --filter @workspace/db test -- settings‑audit.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Audit logs are an infrastructure cross‑cutting concern; they record domain events from all bounded contexts.
- TDD: Assert no `updated_at` column, indexes present, JSONB nullable.
- BDD: Enables “View complete history of all business actions” scenarios.

---

### Subtasks
- [ ] DB‑SETTINGS‑002.0.25 (AGENT): Read DB‑ORG‑001. No action – pause.
- [ ] DB‑SETTINGS‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/settings‑audit.test.ts` **Verification:** RED.
- [ ] DB‑SETTINGS‑002.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm run typecheck` clean.
- [ ] DB‑SETTINGS‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑SETTINGS‑003: Define User Preferences Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No user preferences table. User‑specific settings (theme, notifications, timezone) cannot be persisted.
**Size:** Small

**Description:** Define the `user_preferences` table – stores per‑user configuration such as theme, language, notification settings, and timezone. One row per user; JSONB for flexible preference storage.

**Depends on:** `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑004`
**Related Files:** `lib/db/src/schema/settings/user_preferences.ts`, `lib/db/src/__tests__/settings‑prefs.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `user_id` (uuid FK UNIQUE → users), `organization_id` (FK), `preferences` (jsonb NOT NULL default `{}`), `created_at`, `updated_at`
- [ ] Unique constraint on `user_id` – one preferences row per user
- [ ] Zod schemas; `preferences` is a flexible JSONB blob validated at application layer
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Preferences are scoped to the user, not the organization – but `organization_id` is included for tenant data isolation

**Verification**
```bash
pnpm --filter @workspace/db test -- settings‑prefs.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: User preferences are a per‑user configuration value object – not an aggregate.
- TDD: Assert unique constraint, JSONB default.

---

### Subtasks
- [ ] DB‑SETTINGS‑003.0.25 (AGENT): Read DB‑IDENTITY‑001. No action – pause.
- [ ] DB‑SETTINGS‑003.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/settings‑prefs.test.ts` **Verification:** RED.
- [ ] DB‑SETTINGS‑003.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm run typecheck` clean.
- [ ] DB‑SETTINGS‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## System Settings – API

### [ ] API‑SETTINGS‑001: System Settings – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No settings endpoints exist in the OpenAPI spec. Platform configuration is hardcoded; admins cannot query or update settings via API.
**Size:** Small

**Description:** Extend the OpenAPI spec with system settings CRUD and audit endpoints, enabling codegen to produce typed hooks and Zod validators for settings management.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → DB‑SETTINGS‑001`, `DB‑SETTINGS‑002`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑002`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] OpenAPI spec adds `settings` tag with all paths
- [ ] `GET /settings` — list all key‑value settings (admin only)
- [ ] `GET /settings/public` — list public settings (no auth required, with cache headers)
- [ ] `PUT /settings/{key}` — update setting value (admin only)
- [ ] `POST /settings/bulk‑update` — update multiple settings atomically (admin only)
- [ ] `GET /settings/audit` — get audit log of setting changes (admin only)
- [ ] Schemas: `SystemSetting`, `SettingUpdate`, `BulkUpdateRequest`, `SettingAuditEntry`
- [ ] `pnpm --filter @workspace/api‑spec run codegen` succeeds; `pnpm run typecheck` passes

**Rules to Follow**
- Admin‑only endpoints must be clearly annotated with auth requirements
- `GET /settings/public` must be explicitly marked as no‑auth with cache headers
- Bulk update must be documented as atomic (all‑or‑nothing)

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: System settings are a cross‑cutting concern; the spec defines the admin management interface.
- TDD: Spec must be complete before API‑SETTINGS‑002 tests can be written.
- BDD: “As an admin, I can update the organisation name setting and see the change reflected immediately.”
- Deep Module: The spec hides validation, caching, and audit complexity behind simple key‑value REST endpoints.

---

### Subtasks
- [ ] API‑SETTINGS‑001.0.25 (AGENT): Read `lib/api‑spec/openapi.yaml` structure, DB‑SETTINGS‑001, DB‑SETTINGS‑002. *No action – pause.*
- [ ] API‑SETTINGS‑001.1 (AGENT): Add settings paths and schemas to OpenAPI with auth annotations.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑SETTINGS‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑SETTINGS‑002: System Settings – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No settings integration tests exist.
**Size:** Small

**Description:** Write failing integration tests for all settings endpoints, including public vs. admin access patterns, bulk update atomicity, and audit log verification.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑003`
**Related Files:** `artifacts/api‑server/__tests__/api/settings/settings.test.ts`

**Definition of Done**
- [ ] Tests for: `GET /settings/public` → 200 with cache headers; `GET /settings` (admin) → 200; `PUT /settings/{key}` → 200 + audit log entry; `POST /settings/bulk‑update` → 200 atomic; invalid key → 400; unauthorized → 403; missing field → 400
- [ ] Atomicity test: bulk update with one invalid key → zero settings changed
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- settings.test.ts
# Expected: all tests red
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: Red phase.
- BDD: [N/A]

---

### Subtasks
- [ ] API‑SETTINGS‑002.0.25 (AGENT): Read API‑SETTINGS‑001 spec and TEST‑INFRA‑001. *No action – pause.*
- [ ] API‑SETTINGS‑002.1 (AGENT): Write all integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/settings/settings.test.ts` **Verification:** All red.
- [ ] API‑SETTINGS‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑SETTINGS‑003: System Settings – Service & Repository
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** No `SettingsRepository` or `SettingsService` exists.
**Size:** Medium

**Description:** Implement `SettingsRepository` and `SettingsService` with key validation, in‑memory caching for public settings (15 minutes), atomic bulk updates, and `SettingChanged` event emission.

**Depends on:** `infrastructure/DATABASE.md → DB‑MIGRATE‑ALL`, `infrastructure/AUTH.md → ERROR‑002`, `ARCH‑001.2`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑004`
**Related Files:** `lib/db/src/repositories/settings.ts`, `artifacts/api‑server/src/services/settings/settings‑service.ts`

**Definition of Done**
- [ ] `SettingsRepository` extending `BaseRepository<SystemSetting>`
- [ ] `SettingsService` methods: `getPublicSettings()`, `updateSetting(key, value, userId)`, `bulkUpdate(updates, userId)`, `getSettingAudit(key?, dateRange?)`
- [ ] Setting keys validated against `SettingKey` enum; unknown keys return `ConfigurationError`
- [ ] Public settings cached per organisation for 15 minutes; invalidated on any write
- [ ] `bulkUpdate` wrapped in a Drizzle transaction — all‑or‑nothing semantics
- [ ] `SettingChanged` event emitted after successful update
- [ ] All methods return `Result<T, DomainError>`
- [ ] Unit tests cover success paths, invalid key rejection, bulk atomicity, and cache invalidation
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Method count must be ≤ 4 to maintain deep module principle
- `SettingKey` enum is the source of truth — never accept arbitrary string keys from callers

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- settings‑service
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Settings are a platform infrastructure concern; the service enforces the allowed key schema.
- TDD: Write unit tests for invalid key rejection and bulk atomicity before implementing.
- BDD: “When an admin bulk‑updates 3 settings and one has an invalid key, none of the 3 settings change.”
- Deep Module: `SettingsService` hides caching, validation, transaction, and event emission behind four methods.

---

### Subtasks
- [ ] API‑SETTINGS‑003.0.25 (AGENT): Read DB‑SETTINGS‑001, ARCH‑001.2, and settings.test.ts. *No action – pause.*
- [ ] API‑SETTINGS‑003.1 (AGENT): Implement `SettingsRepository`. **File(s):** `lib/db/src/repositories/settings.ts` **Verification:** Unit tests pass.
- [ ] API‑SETTINGS‑003.2 (AGENT): Implement `SettingsService` with validation, caching, and events. **File(s):** `artifacts/api‑server/src/services/settings/settings‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑SETTINGS‑003.3 (AGENT): Write unit tests for all service methods. **File(s):** `artifacts/api‑server/src/__tests__/services/settings/settings‑service.test.ts` **Verification:** All green.
- [ ] API‑SETTINGS‑003.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑SETTINGS‑004: System Settings – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No settings routes wired. Integration tests are red.
**Size:** Small

**Description:** Wire settings routes with admin/public auth middleware and Zod validation, turning the API‑SETTINGS‑002 integration tests from red to green.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑003`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A] – final phase of settings implementation
**Related Files:** `artifacts/api‑server/src/routes/settings.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All 5 endpoints wired; `GET /settings/public` sets `Cache‑Control: max‑age=900`
- [ ] Admin routes protected by `adminAuthMiddleware`
- [ ] All integration tests from API‑SETTINGS‑002 pass (green)
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- settings.test.ts
# Expected: all tests green
pnpm run typecheck
```

---

### Subtasks
- [ ] API‑SETTINGS‑004.0.25 (AGENT): Read settings.test.ts, SettingsService, and routes/index.ts. *No action – pause.*
- [ ] API‑SETTINGS‑004.1 (AGENT): Create settings routes with auth. **File(s):** `artifacts/api‑server/src/routes/settings.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑SETTINGS‑004.2 (AGENT): Mount router. **File(s):** `artifacts/api‑server/src/routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑SETTINGS‑004.3 (AGENT): Run integration tests to green. **Verification:** All green.
- [ ] API‑SETTINGS‑004.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Audit Log – API

### [ ] API‑AUDIT‑001: Audit Log Query – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No audit log query endpoints in the OpenAPI spec.
**Size:** Small

**Description:** Extend the OpenAPI spec with the audit log query and export API.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → DB‑SETTINGS‑002`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑002`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] OpenAPI spec adds `audit` tag with paths: `GET /audit/logs`, `GET /audit/logs/{logId}`, `GET /audit/summary`, `POST /audit/export`
- [ ] All endpoints annotated with admin authentication requirement
- [ ] Schemas: `AuditLog`, `AuditSummary`, `ExportJobResponse`
- [ ] `pnpm codegen` succeeds; `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Audit logs are an immutable record of domain events; this spec exposes read‑only access.
- TDD: Spec must be complete before API‑AUDIT‑002 tests can be written.
- BDD: “As an admin, I can view audit logs filtered by date range and export them to CSV.”

---

### Subtasks
- [ ] API‑AUDIT‑001.0.25 (AGENT): Read DB‑SETTINGS‑002 and existing spec structure. *No action – pause.*
- [ ] API‑AUDIT‑001.1 (AGENT): Add audit paths and schemas to OpenAPI spec with admin auth annotations.
  **File(s):** `lib/api‑spec/openapi.yaml`
  **Verification:** `pnpm codegen` ; `pnpm typecheck`
- [ ] API‑AUDIT‑001.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑AUDIT‑002: Audit Log Query – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No audit integration tests exist.
**Size:** Small

**Description:** Write failing integration tests for all audit log endpoints.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑003`
**Related Files:** `artifacts/api‑server/__tests__/api/audit/audit.test.ts`

**Definition of Done**
- [ ] Tests for: `GET /audit/logs` → 200 with paginated results; filter by context, action, date range; `GET /audit/logs/{logId}` → 200 / 404; `GET /audit/summary` → 200; `POST /audit/export` → 200 with async job ID; unauthorized → 403
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- audit.test.ts
# Expected: all red
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A]
- TDD: Red phase.

---

### Subtasks
- [ ] API‑AUDIT‑002.0.25 (AGENT): Read API‑AUDIT‑001 spec and TEST‑INFRA‑001. *No action – pause.*
- [ ] API‑AUDIT‑002.1 (AGENT): Write all integration tests (red phase). **File(s):** `artifacts/api‑server/__tests__/api/audit/audit.test.ts` **Verification:** All red.
- [ ] API‑AUDIT‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑AUDIT‑003: Audit Log Query – Service & Repository
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** No `AuditRepository` or `AuditService` exists.
**Size:** Medium

**Description:** Implement `AuditRepository` (append‑only, no soft delete) and `AuditService` with filtering, pagination, and CSV export, backed by optimised DB indexes.

**Depends on:** `infrastructure/DATABASE.md → DB‑MIGRATE‑ALL`, `ARCH‑001.2`
**Blocks:** `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑004`
**Related Files:** `lib/db/src/repositories/audit.ts`, `artifacts/api‑server/src/services/audit/audit‑service.ts`

**Definition of Done**
- [ ] `AuditRepository` extending `BaseRepository<AuditLog>` — no soft delete, append‑only
- [ ] `AuditService` methods: `queryLogs(filter, pagination)`, `getLogById(id)`, `getSummary(filter)`, `exportToCsv(filter)` (async job)
- [ ] All queries use DB indexes on `(organization_id, created_at)`, `(action)`, `(context)`
- [ ] All methods return `Result<T, DomainError>`
- [ ] Unit tests for repository and service with mocked DB
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `AuditRepository` is append‑only — never expose `update()` or `delete()` methods
- Avoid N+1 queries — use single‑query aggregation for summary endpoint

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- audit‑service
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Audit logs are an immutable event record; the repository enforces append‑only semantics.
- TDD: Write unit tests for filter combinations before implementing queries.
- BDD: [N/A]
- Deep Module: `AuditService` hides complex filtering, pagination, and export scheduling behind four simple methods.

---

### Subtasks
- [ ] API‑AUDIT‑003.0.25 (AGENT): Read DB‑SETTINGS‑002, ARCH‑001.2, and audit.test.ts. *No action – pause.*
- [ ] API‑AUDIT‑003.1 (AGENT): Implement `AuditRepository`. **File(s):** `lib/db/src/repositories/audit.ts` **Verification:** Unit tests pass.
- [ ] API‑AUDIT‑003.2 (AGENT): Implement `AuditService` with query, summary, and export methods. **File(s):** `artifacts/api‑server/src/services/audit/audit‑service.ts` **Verification:** Unit tests with mocked repository pass.
- [ ] API‑AUDIT‑003.3 (AGENT): Write unit tests for all service methods. **File(s):** `artifacts/api‑server/src/__tests__/services/audit/audit‑service.test.ts` **Verification:** All green.
- [ ] API‑AUDIT‑003.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑AUDIT‑004: Audit Log Query – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No audit routes exist. Integration tests are red.
**Size:** Small

**Description:** Wire audit log query routes with admin auth middleware and Zod validation, turning the API‑AUDIT‑002 integration tests green.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑003`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A] – final phase of audit implementation
**Related Files:** `artifacts/api‑server/src/routes/audit/audit.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All 4 endpoints wired; protected by `adminAuthMiddleware`
- [ ] All integration tests from API‑AUDIT‑002 pass (green)
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- audit.test.ts
# Expected: all green
pnpm run typecheck
```

---

### Subtasks
- [ ] API‑AUDIT‑004.0.25 (AGENT): Read audit.test.ts, AuditService, and routes/index.ts. *No action – pause.*
- [ ] API‑AUDIT‑004.1 (AGENT): Create audit routes with admin auth. **File(s):** `artifacts/api‑server/src/routes/audit/audit.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑AUDIT‑004.2 (AGENT): Mount router. **File(s):** `artifacts/api‑server/src/routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑AUDIT‑004.3 (AGENT): Run integration tests to green. **Verification:** All green.
- [ ] API‑AUDIT‑004.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---