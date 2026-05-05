# tasks/assets/ASSETS‑INVENTORY.md – Assets: Inventory, Check‑Out/In & Maintenance

This file covers the complete Asset Management bounded context: inventory tracking, check‑out/check‑in logs, maintenance scheduling and logging, contracts and licenses, and configurable alerts. Assets represent physical equipment, hardware, or other tracked items. Tasks span database schemas, API layers, service/repository implementations, and frontend integration.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database Schemas

### [ ] DB‑ASSETS‑001: Define Assets Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No assets table. The entire Assets context is blocked.
**Size:** Small

**Description:** Define the `assets` table – the core inventory entity. Supports category, location, status lifecycle, and soft delete.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑002`, `DB‑ASSETS‑003`, `API‑ASSETS‑001`
**Related Files:** `lib/db/src/schema/assets/assets.ts`, `lib/db/src/__tests__/assets‑assets.test.ts`

**Definition of Done**
- [ ] `lib/db/src/schema/assets/assets.ts` exists and compiles
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `serial_number` (text nullable), `category` (text NOT NULL), `location` (text nullable), `purchase_date` (date nullable), `purchase_price_cents` (integer nullable), `status` (pgEnum: `available|checked_out|maintenance|retired`), `assigned_to` (uuid nullable FK → users – current holder), `warranty_expiry` (date nullable), `notes` (text nullable), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, status)`, `(assigned_to)`, `(category)`, `(serial_number)` (where not null)
- [ ] Zod schemas exported; `status`, `category` validated as enum
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Status transitions: `available → checked_out|maintenance`; `checked_out → available|maintenance`; `maintenance → available`; `retired` is terminal
- `serial_number` uniqueness per organization (validated at service layer)

**Verification**
```bash
pnpm --filter @workspace/db test -- assets‑assets.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Asset is the aggregate root of the Assets bounded context. Status is a value object with a defined state machine.
- TDD: Assert status enum, nullable serial number index, default `available` status.
- BDD: Enables “Add and track company assets” scenarios.

---

### Subtasks
- [ ] DB‑ASSETS‑001.0.25 (AGENT): Read DB‑ORG‑001 and existing schema patterns. No action – pause.
- [ ] DB‑ASSETS‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/assets‑assets.test.ts` **Verification:** RED.
- [ ] DB‑ASSETS‑001.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑ASSETS‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑ASSETS‑002: Define Asset Check‑Out/Check‑In Log Table (Append‑Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No checkout log table. Asset checkout/check‑in tracking is blocked.
**Size:** Small

**Description:** Define the `asset_checkouts` table – an append‑only log of every check‑out and subsequent check‑in. Each row represents a single check‑out/check‑in cycle, with check‑in fields nullable until the asset is returned.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑005`
**Related Files:** `lib/db/src/schema/assets/checkouts.ts`, `lib/db/src/__tests__/assets‑checkouts.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `asset_id` (FK → assets), `checked_out_to` (uuid FK → users), `checked_out_at` (timestamp NOT NULL), `due_date` (date nullable), `checked_in_at` (timestamp nullable), `checked_in_condition` (text nullable), `notes` (text nullable), `created_at` (NO `updated_at` – append‑only)
- [ ] Indexes: `(asset_id, checked_out_at)`, `(organization_id, checked_out_to)`, `(checked_in_at)`
- [ ] Zod schemas exported; `checked_in_at` omitted from insert, only set on check‑in
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- assets‑checkouts.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Check‑out is a domain event that transitions Asset status to `checked_out`. Check‑in is the inverse event.
- TDD: Assert `checked_in_at` nullable, no `updated_at` column, composite indexes.
- BDD: Enables “Check out an asset to a user and check it back in” scenarios.

---

### Subtasks
- [ ] DB‑ASSETS‑002.0.25 (AGENT): Read DB‑ASSETS‑001 and DB‑IDENTITY‑001. No action – pause.
- [ ] DB‑ASSETS‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/assets‑checkouts.test.ts` **Verification:** RED.
- [ ] DB‑ASSETS‑002.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑ASSETS‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑ASSETS‑003: Define Maintenance Log Table (Append‑Only)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No maintenance log table. Asset maintenance tracking is blocked.
**Size:** Small

**Description:** Define the `maintenance_log` table – an append‑only record of maintenance activities performed on an asset. Supports scheduling, cost tracking, and technician assignment.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑009`
**Related Files:** `lib/db/src/schema/assets/maintenance.ts`, `lib/db/src/__tests__/assets‑maintenance.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `asset_id` (FK → assets), `type` (pgEnum: `preventive|corrective|inspection`), `description` (text NOT NULL), `scheduled_date` (date nullable), `completed_date` (date nullable), `technician_id` (uuid nullable FK → users), `cost_cents` (integer nullable), `notes` (text nullable), `created_at` (NO `updated_at` – append‑only)
- [ ] Indexes: `(asset_id, scheduled_date)`, `(organization_id, type)`
- [ ] Zod schemas exported; `completed_date` nullable until maintenance is finished
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- assets‑maintenance.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Maintenance log is a collection of value objects within the Asset aggregate; each entry is an event.
- TDD: Assert enum for type, nullable completed_date, composite indexes.
- BDD: Enables “Log maintenance activities for an asset and track completion” scenarios.

---

### Subtasks
- [ ] DB‑ASSETS‑003.0.25 (AGENT): Read DB‑ASSETS‑001 and DB‑IDENTITY‑001. No action – pause.
- [ ] DB‑ASSETS‑003.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/assets‑maintenance.test.ts` **Verification:** RED.
- [ ] DB‑ASSETS‑003.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑ASSETS‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Asset CRUD

### [ ] API‑ASSETS‑001: Assets – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No asset endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add all asset CRUD endpoints, status enum, category, location fields, and schemas to the OpenAPI spec.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑002`, `API‑ASSETS‑003`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/assets`, `POST`, `GET /{assetId}`, `PATCH /{assetId}`, `DELETE /{assetId}` endpoints
- [ ] Schemas: `Asset`, `AssetCreate`, `AssetUpdate` with examples
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑001.1 (AGENT): Add assets paths and schemas to OpenAPI. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑ASSETS‑001.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑ASSETS‑002: Assets – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No asset integration tests.
**Size:** Medium

**Description:** Write integration tests covering CRUD, pagination, filtering, and auth – all must fail (red) before implementation.

**Depends on:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑003`
**Related Files:** `artifacts/api‑server/__tests__/api/assets/assets.test.ts`

**Definition of Done**
- [ ] Tests: create (201), list (200 with pagination), get by ID, update, soft delete, duplicate serial (409), not found (404), unauthorized (401)
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/assets/assets.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑002.0.25 (AGENT): Read API‑ASSETS‑001 spec and TEST‑INFRA‑001. *No action – pause.*
- [ ] API‑ASSETS‑002.1 (AGENT): Write all asset integration tests. **File:** `assets.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑ASSETS‑002.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑ASSETS‑003: Assets – Service & Repository (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `AssetRepository` or `AssetService` exists.
**Size:** Large

**Description:** Implement `AssetRepository` extending `BaseRepository<Asset>` with soft delete, and `AssetService` enforcing unique serial number per organization, optimistic locking, status transition validation, and event emission.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑001`, `infrastructure/DATABASE.md → ARCH‑001.2`, `infrastructure/AUTH.md → ERROR‑002`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑004`
**Related Files:** `lib/db/src/repositories/assets.ts`, `artifacts/api‑server/src/services/assets/asset‑service.ts`

**Definition of Done**
- [ ] `AssetRepository`: `findById`, `findByOrg`, `create`, `update`, `softDelete`
- [ ] `AssetService`: `create`, `get`, `list`, `update`, `softDelete`. All return `Result<T, DomainError>`.
- [ ] Status transition validation; optimistic locking; unique serial number enforcement
- [ ] Emits `AssetCreated`, `AssetUpdated` events
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/assets/__tests__/asset‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: AssetService encapsulates status machine, availability rules, and event publishing.
- TDD: Unit tests for service with mocked repository; status rules, duplicate serial.

---

### Subtasks
- [ ] API‑ASSETS‑003.0.25 (AGENT): Read DB‑ASSETS‑001 and ARCH‑001.2. *No action – pause.*
- [ ] API‑ASSETS‑003.1 (AGENT): Implement `AssetRepository`. **File:** `lib/db/src/repositories/assets.ts` **Verification:** Unit tests pass.
- [ ] API‑ASSETS‑003.2 (AGENT): Implement `AssetService`. **File:** `artifacts/api‑server/src/services/assets/asset‑service.ts` **Verification:** Unit tests with mocked repo pass.
- [ ] API‑ASSETS‑003.3 (AGENT): Write and run unit tests. **File:** `artifacts/api‑server/src/services/assets/__tests__/asset‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑ASSETS‑003.4 (HUMAN): Review status machine and uniqueness. Sign off. **Verification:** Approved.

---

### [ ] API‑ASSETS‑004: Assets – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No asset routes wired.
**Size:** Small

**Description:** Create asset route handlers, mount the router, and run integration tests to green.

**Depends on:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑003`, `API‑ASSETS‑002`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/routes/assets.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All CRUD handlers; `AssetNotFound` → 404; `DuplicateSerialError` → 409
- [ ] `pnpm test -- assets.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/assets/assets.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑004.0.25 (AGENT): Read existing route patterns.
- [ ] API‑ASSETS‑004.1 (AGENT): Implement assets router and mount. **File:** `routes/assets.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑ASSETS‑004.2 (AGENT): Run integration tests to green. **Verification:** All green; `pnpm typecheck`.
- [ ] API‑ASSETS‑004.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## API – Check‑Out/In & Maintenance

### [ ] API‑ASSETS‑005: Check‑Out/In – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No checkout/check‑in endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add checkout, check‑in, and checkout history endpoints to the OpenAPI spec.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑002`, `API‑ASSETS‑004`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑006`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `POST /api/v1/assets/{assetId}/checkout`, `POST /{assetId}/checkin`, `GET /{assetId}/checkout‑history` endpoints
- [ ] Schemas: `CheckoutRequest`, `CheckoutResponse`, `CheckoutHistoryEntry` with examples
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑005.1 (AGENT): Add checkout/checkin paths to OpenAPI. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑ASSETS‑005.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑ASSETS‑006: Check‑Out/In – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No checkout integration tests.
**Size:** Medium

**Description:** Write integration tests for checkout, check‑in, and history – all must fail (red) before implementation.

**Depends on:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑005`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑007`
**Related Files:** `artifacts/api‑server/__tests__/api/assets/checkout.test.ts`

**Definition of Done**
- [ ] Tests: checkout available asset → 201; checkout unavailable → 409; check‑in → 200; check‑in already available → 400; history → 200 with pagination; unauthorized → 401
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/assets/checkout.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑006.0.25 (AGENT): Read API‑ASSETS‑005 spec and TEST‑INFRA‑001. *No action – pause.*
- [ ] API‑ASSETS‑006.1 (AGENT): Write all checkout integration tests. **File:** `checkout.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑ASSETS‑006.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑ASSETS‑007: Check‑Out/In – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No checkout service or repository exists.
**Size:** Large

**Description:** Implement `CheckoutRepository` (append‑only) and `CheckoutService` with availability validation, atomic state transitions, and event emission.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑002`, `API‑ASSETS‑003`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑008`
**Related Files:** `lib/db/src/repositories/checkouts.ts`, `artifacts/api‑server/src/services/assets/checkout‑service.ts`

**Definition of Done**
- [ ] `CheckoutRepository`: `findById`, `findByAsset`, `create`, `findActiveCheckout`
- [ ] `CheckoutService`: `checkout(assetId, userId, dueDate)`, `checkin(assetId)`, `getCheckoutHistory`. All return `Result<T, DomainError>`.
- [ ] `checkout` validates asset availability; `checkin` requires active checkout; atomic status updates
- [ ] Emits `AssetCheckedOut`, `AssetCheckedIn` domain events
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/assets/__tests__/checkout‑service.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑007.0.25 (AGENT): Read DB‑ASSETS‑002 and AssetService. *No action – pause.*
- [ ] API‑ASSETS‑007.1 (AGENT): Implement `CheckoutRepository`. **File:** `lib/db/src/repositories/checkouts.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑ASSETS‑007.2 (AGENT): Implement `CheckoutService`. **File:** `artifacts/api‑server/src/services/assets/checkout‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑ASSETS‑007.3 (AGENT): Write and run unit tests. **File:** `checkout‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑ASSETS‑007.4 (HUMAN): Review availability validation and atomicity. Sign off. **Verification:** Approved.

---

### [ ] API‑ASSETS‑008: Check‑Out/In – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No checkout routes wired.
**Size:** Small

**Description:** Create checkout/check‑in route handlers, mount the router, and run integration tests to green.

**Depends on:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑007`, `API‑ASSETS‑006`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/routes/assets.ts` (extended)

**Definition of Done**
- [ ] Checkout, check‑in, and history routes; `AssetNotAvailable` → 409; `NoActiveCheckout` → 400
- [ ] `pnpm test -- checkout.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/assets/checkout.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑008.1 (AGENT): Create checkout routes with validation. **File:** `routes/assets.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑ASSETS‑008.2 (AGENT): Run integration tests to green. **Verification:** All green; `pnpm typecheck`.
- [ ] API‑ASSETS‑008.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

### [ ] API‑ASSETS‑009: Maintenance Log – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No maintenance log endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add maintenance log create, list, and complete endpoints to the OpenAPI spec.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑003`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑010`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/assets/{assetId}/maintenance‑log`, `POST`, `PATCH /{logId}/complete` endpoints
- [ ] Schemas: `MaintenanceEntry`, `MaintenanceCreate`, `MaintenanceResponse` with examples
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑009.1 (AGENT): Add maintenance log paths to OpenAPI. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑ASSETS‑009.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑ASSETS‑010: Maintenance Log – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No maintenance integration tests.
**Size:** Medium

**Description:** Write integration tests for maintenance log creation, listing, and completion – all must fail (red).

**Depends on:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑009`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑011`
**Related Files:** `artifacts/api‑server/__tests__/api/assets/maintenance.test.ts`

**Definition of Done**
- [ ] Tests: create entry → 201; list → 200 with pagination; complete → 200; complete already‑completed → 409; unauthorized → 401
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/assets/maintenance.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑010.0.25 (AGENT): Read API‑ASSETS‑009 spec. *No action – pause.*
- [ ] API‑ASSETS‑010.1 (AGENT): Write all maintenance integration tests. **File:** `maintenance.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑ASSETS‑010.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑ASSETS‑011: Maintenance Log – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No maintenance service or repository exists.
**Size:** Large

**Description:** Implement `MaintenanceRepository` (append‑only) and `MaintenanceService` with completion validation, asset existence check, and event emission.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑003`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑012`
**Related Files:** `lib/db/src/repositories/maintenance.ts`, `artifacts/api‑server/src/services/assets/maintenance‑service.ts`

**Definition of Done**
- [ ] `MaintenanceRepository`: `findByAsset`, `create`, `updateCompletion` (sets `completed_date`)
- [ ] `MaintenanceService`: `createEntry`, `completeEntry`, `getMaintenanceHistory`. All return `Result<T, DomainError>`.
- [ ] `completeEntry` rejects if already completed; validates asset exists
- [ ] Emits `MaintenanceScheduled`, `MaintenanceCompleted` domain events
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/assets/__tests__/maintenance‑service.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑011.0.25 (AGENT): Read DB‑ASSETS‑003 and AssetRepository. *No action – pause.*
- [ ] API‑ASSETS‑011.1 (AGENT): Implement `MaintenanceRepository`. **File:** `lib/db/src/repositories/maintenance.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑ASSETS‑011.2 (AGENT): Implement `MaintenanceService`. **File:** `artifacts/api‑server/src/services/assets/maintenance‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑ASSETS‑011.3 (AGENT): Write and run unit tests. **File:** `maintenance‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑ASSETS‑011.4 (HUMAN): Review append‑only enforcement and completion. Sign off. **Verification:** Approved.

---

### [ ] API‑ASSETS‑012: Maintenance Log – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No maintenance routes wired.
**Size:** Small

**Description:** Create maintenance log route handlers, mount the router, and run integration tests to green.

**Depends on:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑011`, `API‑ASSETS‑010`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/routes/assets.ts` (extended)

**Definition of Done**
- [ ] List, create, complete routes; `MaintenanceAlreadyCompleted` → 409
- [ ] `pnpm test -- maintenance.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/assets/maintenance.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ASSETS‑012.1 (AGENT): Create maintenance routes. **File:** `routes/assets.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑ASSETS‑012.2 (AGENT): Run integration tests to green. **Verification:** All green; `pnpm typecheck`.
- [ ] API‑ASSETS‑012.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## Frontend Integration

### [ ] FRONT‑ASSETS‑001: Assets & Inventory – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `Assets.tsx` imports assets from mock data. No `useAssetList`, `useCheckoutList`, or `useMaintenanceLog` hooks exist.
**Size:** Small

**Description:** Create `useAssetList`, `useCheckoutList`, and `useMaintenanceLog` hooks backed by the asset APIs. Replace all mock data in the Assets page table and detail panel.

**Depends on:** `assets/ASSETS‑INVENTORY.md → API‑ASSETS‑004`, `API‑ASSETS‑008`, `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑002`, `FRONT‑AUTH‑002`
**Blocks:** `assets/ASSETS‑INVENTORY.md → FRONT‑INT‑ASSETS`
**Related Files:** `artifacts/apex‑os/src/pages/Assets.tsx`, `artifacts/apex‑os/src/hooks/assets/useAssetList.ts`, `useCheckoutList.ts`, `useMaintenanceLog.ts`

**Definition of Done**
- [ ] `useAssetList`, `useCheckoutList`, and `useMaintenanceLog` hooks created
- [ ] Asset table: name, serial number, category, status badge, assigned user, last maintenance date
- [ ] Asset detail panel: asset info, current checkout, maintenance log timeline
- [ ] Category and status filter dropdowns; URL query params persist filters
- [ ] All `mockData` imports removed
- [ ] `pnpm typecheck` passes
- [ ] Component tests pass

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- assets‑list.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Asset is an aggregate root. Checkout and Maintenance are child aggregates.
- TDD: MSW returns 5 assets; assert table renders; change filter → assert query re‑fires; click asset → assert maintenance log displayed.
- BDD: “As a firm user, I can browse my asset inventory, filter by status and category, and see the maintenance history for any asset.”

---

### Subtasks
- [ ] FRONT‑ASSETS‑001.0.25 (AGENT): Read `Assets.tsx` in full and list every `mockData` reference. *No action – pause.*
- [ ] FRONT‑ASSETS‑001.1 (AGENT): Create `useAssetList`, `useCheckoutList`, and `useMaintenanceLog` hooks. **File:** `useAssetList.ts`, etc. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑ASSETS‑001.2 (AGENT): Replace mock data; add filters; wire detail panel. **File:** `Assets.tsx` **Verification:** No mockData; `pnpm typecheck`.
- [ ] FRONT‑ASSETS‑001.3 (AGENT): Write component tests. **File:** `artifacts/apex‑os/src/pages/__tests__/assets‑list.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑ASSETS‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑INT‑ASSETS: Assets Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No checkout/check‑in forms or maintenance entry modals exist.
**Size:** Medium

**Description:** Wire all Assets mutations: checkout (assign to user, due date), check‑in, maintenance log entry, maintenance completion, and asset status change. All mutations show sonner toast feedback with optimistic status updates.

**Depends on:** `assets/ASSETS‑INVENTORY.md → FRONT‑ASSETS‑001`, `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑003`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/assets/CheckoutForm.tsx`, `MaintenanceForm.tsx`, `Assets.tsx`

**Definition of Done**
- [ ] `CheckoutForm` dialog: user selector, due date, notes; calls mutation
- [ ] Check‑in: inline button with confirmation → mutation; optimistic status update
- [ ] `MaintenanceForm` dialog: type, description, scheduled date, technician, cost; calls mutation
- [ ] Maintenance completion button → mutation; asset status change (admin only)
- [ ] All mutations disable during `isPending`; sonner toast feedback
- [ ] Integration tests with MSW cover checkout, check‑in, maintenance create, and complete flows

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- assets‑interactive.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Checkout and maintenance are domain events, not just CRUD.
- TDD: MSW returns available asset; simulate checkout form → assert `POST /assets/:id/checkouts` called; simulate check‑in → assert asset reverts to `available`.
- BDD: “As a firm user, I can check out an asset to a team member, log maintenance events, and mark them complete.”

---

### Subtasks
- [ ] FRONT‑INT‑ASSETS.0.25 (AGENT): List all Assets interactive surfaces. *No action – pause.*
- [ ] FRONT‑INT‑ASSETS.1 (AGENT): Implement `CheckoutForm` and `useCheckoutAsset`/`useCheckinAsset` mutations. **File:** `CheckoutForm.tsx`, `useCheckoutAsset.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑ASSETS.2 (AGENT): Implement `MaintenanceForm` and mutations. **File:** `MaintenanceForm.tsx`, `useCreateMaintenanceEntry.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑ASSETS.3 (AGENT): Wire `useUpdateAssetStatus` for admin status changes. **File:** `Assets.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑ASSETS.4 (AGENT): Write integration tests. **File:** `assets‑interactive.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑INT‑ASSETS.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---