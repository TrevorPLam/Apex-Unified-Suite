# tasks/crm/CRM‑CONTACTS‑COMPANIES.md – CRM Contacts & Companies

This file contains tasks for CRM Contacts and Companies: database schema, API layers (OpenAPI spec, integration tests, service/repository, routes), and frontend integration (list views, interactive mutations, and duplicate/merge UI). Contacts are independent individuals optionally linked to a company; companies represent B2B organisations.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Contacts

### [ ] DB‑CRM‑002: Define Contacts Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No contacts table. CRM contact management and portal client linkage are blocked.
**Size:** Small

**Description:** Define the `contacts` table – independent contacts, optionally linked to a company. Supports visibility (`public|team|private`), assignment, and soft delete.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑003` (companies FK – can be nullable, added after companies)
**Blocks:** CRM portal client access (`portal/PORTAL‑ACCESS.md → DB‑PORTAL‑001`), appointment client FK (`appointments/APPOINTMENTS‑BOOKING.md → DB‑APPT‑004`), contacts API
**Related Files:** `lib/db/src/schema/crm/contacts.ts`, `lib/db/src/__tests__/crm‑contacts.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `first_name` (text NOT NULL), `last_name` (text NOT NULL), `email` (text nullable), `phone` (text nullable), `company_id` (uuid nullable FK → companies), `visibility` (pgEnum: `public|team|private`), `assigned_to` (uuid nullable FK → users), `deleted_at` (timestamp nullable), `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, email)`, `(company_id)`, `(assigned_to)`
- [ ] Unique constraint on `(organization_id, email)` where email is not null
- [ ] Zod schemas; visibility validated as enum
- [ ] Unit tests pass (TDD red → green)
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `email` unique per organization (not globally), only when not null
- Visibility filtering must be enforced at service/repository level

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑contacts.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Contact is an aggregate root in CRM. Visibility is a domain value object controlling data access.

---

### Subtasks
- [ ] DB‑CRM‑002.0.25 (AGENT): Read DB‑ORG‑001 and DB‑CRM‑003 schemas. *No action – pause.*
- [ ] DB‑CRM‑002.0.5 (AGENT): Research composite unique index with nullable column in Drizzle.
- [ ] DB‑CRM‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑contacts.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑002.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑CRM‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Database – Companies

### [ ] DB‑CRM‑003: Define Companies Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No companies table. B2B firm tracking is blocked.
**Size:** Small

**Description:** Companies table – B2B firm records with domain, size, revenue, settings JSONB.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002` (contacts.company_id FK added later), deals FK
**Related Files:** `lib/db/src/schema/crm/companies.ts`, `lib/db/src/__tests__/crm‑companies.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `name` (text NOT NULL), `domain` (text nullable), `size` (text nullable), `revenue_cents` (integer nullable), `industry` (text nullable), `settings` (jsonb default `{}`), `visibility` (pgEnum), `assigned_to` (uuid nullable FK → users), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, domain)`, `(assigned_to)`
- [ ] Unique constraint on `(organization_id, domain)` where domain not null
- [ ] Zod schemas and types exported
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- crm‑companies.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑CRM‑003.0.25 (AGENT): Read DB‑ORG‑001. *No action – pause.*
- [ ] DB‑CRM‑003.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/crm‑companies.test.ts` **Verification:** RED.
- [ ] DB‑CRM‑003.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑CRM‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Contacts

### [ ] API‑CRM‑006: Contacts – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No contact endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add all contact CRUD endpoints, request/response schemas, and enums to the OpenAPI spec.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002`, `crm/CRM‑LEADS.md → API‑CRM‑001` (pattern reference)
**Blocks:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑007`, `API‑CRM‑008`, `API‑CRM‑009`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/crm/contacts` with `page`, `limit`, `companyId`, `assignedTo`, `search`, `visibility` query params
- [ ] `POST /api/v1/crm/contacts` with `CreateContactRequestBody` schema
- [ ] `GET /api/v1/crm/contacts/{contactId}` defined
- [ ] `PATCH /api/v1/crm/contacts/{contactId}` with `UpdateContactRequestBody`
- [ ] `DELETE /api/v1/crm/contacts/{contactId}` (soft delete, 204)
- [ ] `email` field marked as unique‑per‑organisation in schema description
- [ ] `visibility` enum: `public`, `team`, `private`
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Contacts are a core aggregate in the CRM bounded context. Email uniqueness per organisation is a domain invariant.

---

### Subtasks
- [ ] API‑CRM‑006.0.25 (AGENT): Read DB‑CRM‑002 schema and API‑CRM‑001 as spec pattern. *No action – pause.*
- [ ] API‑CRM‑006.1 (AGENT): Add `Contact` schema and all contact endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑006.2 (HUMAN): Review spec and sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑007: Contacts – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No contact integration tests.
**Size:** Medium

**Description:** Write contact integration tests covering CRUD, email uniqueness enforcement, visibility filtering, and auth — all must fail (red) before implementation.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑006`
**Blocks:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑009`
**Related Files:** `artifacts/api‑server/__tests__/api/crm/contacts.test.ts`

**Definition of Done**
- [ ] Tests cover: list (paginated), create (201), create duplicate email (409), get by ID, update, soft delete, auth (401 without token)
- [ ] Visibility filter test: private contacts not visible to other users
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/contacts.test.ts
# Expected: all fail
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email uniqueness is a domain invariant tested via API.
- TDD: Red phase only.

---

### Subtasks
- [ ] API‑CRM‑007.0.25 (AGENT): Read API‑CRM‑007 and generated contact schemas. *No action – pause.*
- [ ] API‑CRM‑007.1 (AGENT): Write all contact integration tests. **File(s):** `artifacts/api‑server/__tests__/api/crm/contacts.test.ts` **Verification:** All fail (red); `pnpm typecheck`.
- [ ] API‑CRM‑007.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑CRM‑008: Contacts – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `ContactRepository` or `ContactService` exists.
**Size:** Large

**Description:** Implement `ContactRepository` (DB queries with org‑scoping and visibility filtering) and `ContactService` (email uniqueness enforcement, visibility rules, event emission) using neverthrow Results.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑009`
**Related Files:** `lib/db/src/repositories/crm/contacts.ts`, `artifacts/api‑server/src/services/crm/contact‑service.ts`

**Definition of Done**
- [ ] `ContactRepository`: `findById`, `findByOrg` (paginated, visibility‑filtered), `create`, `update`, `softDelete`, `findByEmail`
- [ ] `ContactService`: `listContacts`, `getContact`, `createContact`, `updateContact`, `deleteContact`. All return `Result<T, DomainError>`.
- [ ] Email uniqueness: `createContact` checks for existing non‑deleted contact with same email in same org
- [ ] Visibility filtering: `listContacts` filters by user’s access rights
- [ ] Emits `ContactCreated`, `ContactUpdated` domain events
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/crm/__tests__/contact‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email uniqueness and visibility are domain rules controlling data access.

---

### Subtasks
- [ ] API‑CRM‑008.0.25 (AGENT): Read DB‑CRM‑002, `LeadRepository` as pattern reference. *No action – pause.*
- [ ] API‑CRM‑008.1 (AGENT): Implement `ContactRepository`. **File(s):** `lib/db/src/repositories/crm/contacts.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑008.2 (AGENT): Implement `ContactService` with email uniqueness, visibility, and events. **File(s):** `artifacts/api‑server/src/services/crm/contact‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑008.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/crm/__tests__/contact‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑008.4 (HUMAN): Review email uniqueness and visibility enforcement. Sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑009: Contacts – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No contact routes wired.
**Size:** Small

**Description:** Create contact route handlers, mount the router, and run integration tests to green.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑008`, `API‑CRM‑007`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑025`, `crm/CRM‑WORKSPACES.md → API‑CRM‑026`
**Related Files:** `artifacts/api‑server/src/routes/crm/contacts.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All 5 CRUD route handlers implemented; `DuplicateEmail` → 409; `ContactNotFound` → 404
- [ ] `pnpm test -- contacts.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/contacts.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑009.0.25 (AGENT): Read `routes/crm/leads.ts` as pattern. *No action – pause.*
- [ ] API‑CRM‑009.1 (AGENT): Implement contacts router and mount. **File(s):** `artifacts/api‑server/src/routes/crm/contacts.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑009.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑009.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## API – Companies

### [ ] API‑CRM‑010: Companies – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No company endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add all company CRUD endpoints and schemas to the OpenAPI spec, including the `settings` JSONB field and domain uniqueness constraint.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑003`
**Blocks:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑011`, `API‑CRM‑012`, `API‑CRM‑013`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/crm/companies`, `POST`, `GET /{companyId}`, `PATCH /{companyId}`, `DELETE /{companyId}` all defined
- [ ] `settings` field documented as JSONB/object type
- [ ] `domain` field marked as unique‑per‑organisation
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑010.0.25 (AGENT): Read DB‑CRM‑003 schema and existing spec patterns. *No action – pause.*
- [ ] API‑CRM‑010.1 (AGENT): Add `Company` schema and all company endpoints to `openapi.yaml`. **File(s):** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑CRM‑010.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑011: Companies – Integration Tests (Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No company integration tests.
**Size:** Medium

**Description:** Write company integration tests covering CRUD, domain uniqueness, `settings` JSONB, and auth (TDD red phase).

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑010`
**Blocks:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑013`
**Related Files:** `artifacts/api‑server/__tests__/api/crm/companies.test.ts`

**Definition of Done**
- [ ] Tests cover: list, create, create duplicate domain → 409, get by ID, update `settings`, soft delete, auth enforcement
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/companies.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑011.0.25 (AGENT): Read API‑CRM‑011 and generated company schemas. *No action – pause.*
- [ ] API‑CRM‑011.1 (AGENT): Write all company integration tests. **File(s):** `artifacts/api‑server/__tests__/api/crm/companies.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑CRM‑011.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑CRM‑012: Companies – Service & Repository
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `CompanyRepository` or `CompanyService` exists.
**Size:** Large

**Description:** Implement `CompanyRepository` and `CompanyService` with domain uniqueness enforcement, JSONB `settings` merge, soft delete, and event emission using neverthrow Results.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑003`, `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/AUTH.md → ERROR‑002`
**Blocks:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑013`
**Related Files:** `lib/db/src/repositories/crm/companies.ts`, `artifacts/api‑server/src/services/crm/company‑service.ts`

**Definition of Done**
- [ ] `CompanyRepository`: `findById`, `findByOrg`, `create`, `update`, `softDelete`, `findByDomain`
- [ ] `CompanyService`: `listCompanies`, `getCompany`, `createCompany`, `updateCompany`, `deleteCompany`. All return `Result<T, DomainError>`.
- [ ] Domain uniqueness enforced in `createCompany`
- [ ] `settings` JSONB merge: `updateCompany` merges incoming settings with existing
- [ ] `CompanyCreated`, `CompanyUpdated` domain events emitted
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/crm/__tests__/company‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Company `settings` is a JSONB aggregate that merges rather than replaces.

---

### Subtasks
- [ ] API‑CRM‑012.0.25 (AGENT): Read DB‑CRM‑003, JSONB merge operator docs, and `ContactRepository` as pattern. *No action – pause.*
- [ ] API‑CRM‑012.1 (AGENT): Implement `CompanyRepository`. **File(s):** `lib/db/src/repositories/crm/companies.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑012.2 (AGENT): Implement `CompanyService` with domain check, JSONB merge, events. **File(s):** `artifacts/api‑server/src/services/crm/company‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑012.3 (AGENT): Write and run unit tests. **File(s):** `artifacts/api‑server/src/services/crm/__tests__/company‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑012.4 (HUMAN): Review JSONB merge and domain uniqueness. Sign off. **Verification:** Approved.

---

### [ ] API‑CRM‑013: Companies – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No company routes wired.
**Size:** Small

**Description:** Create company route handlers, mount the router, and run integration tests to green.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑012`, `API‑CRM‑011`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `crm/CRM‑LEADS.md → API‑CRM‑025`, `crm/CRM‑WORKSPACES.md → API‑CRM‑026`
**Related Files:** `artifacts/api‑server/src/routes/crm/companies.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All 5 CRUD handlers; `DuplicateDomain` → 409
- [ ] `pnpm test -- companies.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/crm/companies.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑CRM‑013.0.25 (AGENT): Read `routes/crm/contacts.ts` as pattern. *No action – pause.*
- [ ] API‑CRM‑013.1 (AGENT): Implement companies router and mount. **File(s):** `artifacts/api‑server/src/routes/crm/companies.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑CRM‑013.2 (AGENT): Run integration tests to green. **File(s):** As needed **Verification:** All green; `pnpm typecheck`.
- [ ] API‑CRM‑013.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## Frontend Integration – Contacts & Companies

### [ ] FRONT‑CRM‑002: CRM Contacts & Companies – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Contact and company tables in CRM use mock data. No `useContactList` or `useCompanyList` hooks exist.
**Size:** Small

**Description:** Create `useContactList` and `useCompanyList` hooks backed by `API‑CRM‑009` / `API‑CRM‑013`. Replace mock data in contact and company table views; add search, sort, pagination, and soft‑delete actions.

**Depends on:** `crm/CRM‑CONTACTS‑COMPANIES.md → API‑CRM‑009`, `API‑CRM‑013`, `crm/CRM‑LEADS.md → FRONT‑CRM‑001`
**Blocks:** `crm/CRM‑LEADS.md → FRONT‑INT‑CRM`
**Related Files:** `artifacts/apex‑os/src/pages/CRM.tsx`, `artifacts/apex‑os/src/hooks/crm/useContactList.ts`, `useCompanyList.ts`

**Definition of Done**
- [ ] `useContactList` and `useCompanyList` hooks created with search/sort/pagination params
- [ ] Contact table displays: name, email, phone, assigned_to, visibility, created_at
- [ ] Company table displays: name, domain, size, assigned_to, contact count
- [ ] Soft‑delete action available per row (via `FRONT‑INFRA‑004` undo pattern)
- [ ] All mock data imports removed
- [ ] `pnpm typecheck` passes
- [ ] Component tests pass

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- crm‑contacts.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Contacts and Companies are separate aggregate roots within the CRM bounded context.
- TDD: MSW returns paginated list; assert table renders; assert search refetches.
- BDD: “As a firm user, I can search for a contact by name and see matching results.”

---

### Subtasks
- [ ] FRONT‑CRM‑002.1 (AGENT): Create `useContactList` and `useCompanyList` hooks with search/sort/pagination. **File(s):** `artifacts/apex‑os/src/hooks/crm/useContactList.ts`, `useCompanyList.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑CRM‑002.2 (AGENT): Replace mock data in contact and company tables. **File(s):** `artifacts/apex‑os/src/pages/CRM.tsx` **Verification:** No mockData references.
- [ ] FRONT‑CRM‑002.3 (AGENT): Wire search, sort, and pagination controls. **Verification:** `pnpm --filter @workspace/apex‑os test -- crm‑contacts.test.tsx` → GREEN.
- [ ] FRONT‑CRM‑002.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---