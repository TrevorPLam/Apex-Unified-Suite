# tasks/infrastructure/GDPR‑COMPLIANCE.md – GDPR, CCPA, and EU Data Act Compliance

This file defines the platform capabilities required to comply with the GDPR (including the right to erasure and data portability), CCPA/CPRA, the California Delete Act, and the EU Data Act’s provider switching obligations.  
Without these, the platform cannot legally serve customers who process EU or California residents’ personal data, which is essentially all enterprise and many SMB customers.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**  
> **All tasks must ensure that PII is never logged, and that erasure operations are irreversible after the grace period unless a legal hold is active.**

---

## Data Export (Right of Access / Portability)

### [ ] GDPR‑001: Data Export API & Background Job
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No mechanism exists for a contact to request a copy of their personal data, or for an admin to perform a full organization export.  
**Size:** Large  

**Description:**  
Implement a comprehensive data export mechanism that supports two scopes:
1. **Subject Access Request (SAR):** A contact (authenticated via a token from the privacy center) can request all PII held about them across all modules (CRM, appointments, invoices, portal messages). The result is a structured JSON file.
2. **Organization Export:** An admin can request a complete export of all organization data (not limited to a single contact) in machine‑readable format, primarily driven by EU Data Act provider switching obligations.

Exports are generated asynchronously via a BullMQ job, stored in Cloudflare R2, and a time‑limited signed download URL is returned. The export request is recorded in the audit log.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → AUTH‑008`, all domain CRUD APIs (CRM, Finance, Projects, Appointments, Documents, Portal), `infrastructure/EMAIL‑STORAGE.md → DOC‑STORAGE‑001`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`  
**Blocks:** `GDPR‑002`, `FRONT‑GDPR‑001`, `EU‑DATA‑001`

**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/gdpr/export‑service.ts`, `artifacts/api‑server/src/jobs/gdpr‑export‑job.ts`, `artifacts/api‑server/src/routes/gdpr/export.ts`

**Definition of Done**
- [ ] `POST /api/v1/gdpr/export/contact` – accepts `{ contactId, email }`, sends a confirmation email, and upon confirmation (via a time‑limited token), triggers an export job for that contact’s data.  
- [ ] `POST /api/v1/gdpr/export/organization` – admin only; immediately triggers a full organization export job.  
- [ ] `GET /api/v1/gdpr/export/{jobId}` – returns the status of an export job (`pending | processing | completed | failed`) and, upon completion, a signed download URL (valid for 48 hours).  
- [ ] Export job for a contact aggregates data from:
  - CRM: leads, contacts, activities, tasks, deal associations, custom field values.
  - Appointments: booked appointments, event types, waitlist entries, no‑show records.
  - Finance: invoices, payments, credit memos related to the contact.
  - Documents: documents uploaded by or shared with the contact.
  - Portal: messages, client tasks, permissions.
- [ ] Export job for an organization exports all data across all modules in a structured JSON or NDJSON format.  
- [ ] R2 signed URL generated with 48‑hour expiry; credentials never exposed.  
- [ ] All exports logged to `gdpr_requests` table and audit log.  
- [ ] Integration tests: SAR flow end‑to‑end, admin export flow, job status polling, download.  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- SAR requests must be **verified** – the contact must confirm via email before any data is exported.  
- Export must not include other contacts’ PII (e.g., when exporting a contact, do not include other contacts on the same deal).  
- Do not export system‑internal IDs that could reveal other entities’ data.  
- The signed URL must be short‑lived and single‑use if possible (or limited to a small number of accesses).  
- `gdpr_requests` table must track: `id`, `organization_id`, `request_type`, `status`, `requested_by`, `requested_at`, `completed_at`, `file_path`, `expires_at`.

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm --filter @workspace/api‑server test -- gdpr‑export.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Data export is a cross‑cutting infrastructure operation that reads across all bounded contexts without owning domain logic.  
- TDD: Write integration tests that create test data across CRM, Appointments, and Finance, then call the export endpoint and assert the JSON contains all expected data.  
- BDD: “As a contact, I can request a copy of all my data, verify my email, and download a structured file.”

---

### Subtasks
- [ ] GDPR‑001.0.25 (AGENT): Read all domain CRUD APIs to understand data structures. No action — pause.
- [ ] GDPR‑001.0.5 (AGENT): Research GDPR SAR requirements, data aggregation patterns, and secure signed‑URL generation with R2.
- [ ] GDPR‑001.1 (AGENT): Add `gdpr_requests` table schema. **File:** `lib/db/src/schema/gdpr/gdpr‑requests.ts` **Verification:** Migration; `pnpm typecheck`.
- [ ] GDPR‑001.2 (AGENT): Add export endpoints to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen`.
- [ ] GDPR‑001.3 (AGENT): Implement `ExportService` that aggregates data across modules. **File:** `artifacts/api‑server/src/services/gdpr/export‑service.ts` **Verification:** Unit tests.
- [ ] GDPR‑001.4 (AGENT): Implement BullMQ export job and R2 upload. **File:** `artifacts/api‑server/src/jobs/gdpr‑export‑job.ts` **Verification:** Integration test with mock R2.
- [ ] GDPR‑001.5 (AGENT): Create routes for SAR and admin export. **File:** `artifacts/api‑server/src/routes/gdpr/export.ts` **Verification:** Integration tests green.
- [ ] GDPR‑001.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Right to Erasure (Right to be Forgotten)

### [ ] GDPR‑002: Right to Erasure API & Background Job
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No mechanism to irreversibly delete personal data. This is a core GDPR requirement and a precondition for serving EU customers.  
**Size:** Large  

**Description:**  
Implement a two‑phase erasure process:
1. **Soft‑Delete Phase:** Immediately upon request, soft‑delete all PII‑containing records for the specified contact (sets `deleted_at`). The data is no longer visible but is recoverable for 30 days in case of error or legal hold.
2. **Hard‑Delete Phase:** After the 30‑day grace period (unless a legal hold is active), a background job permanently deletes all PII fields and anonymizes the contact record (e.g., replaces name with `[Erased]`, email with a hash). Associated transaction records are preserved but anonymized.

A request can be cancelled within the 30‑day window. All erasure requests are recorded in the `gdpr_requests` table and the audit log.

**Depends on:** `GDPR‑001` (shared `gdpr_requests` table), all domain CRUD APIs (must support hard‑delete of PII), `infrastructure/DEVOPS.md → JOB‑INFRA‑001`  
**Blocks:** `FRONT‑GDPR‑001`

**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/gdpr/erasure‑service.ts`, `artifacts/api‑server/src/jobs/gdpr‑erasure‑job.ts`, `artifacts/api‑server/src/routes/gdpr/erasure.ts`

**Definition of Done**
- [ ] `POST /api/v1/gdpr/erase/contact` – admin or contact (self‑service) initiates erasure. Sends verification email. Upon confirmation, sets `deleted_at` on all associated records and schedules hard‑deletion for 30 days later.  
- [ ] `POST /api/v1/gdpr/erase/contact/cancel` – cancels a pending erasure within the 30‑day window (admin only).  
- [ ] `GET /api/v1/gdpr/erase/status/{contactId}` – returns current erasure status.  
- [ ] `ErasureJob` (BullMQ delayed job, 30 days) performs:
  - Checks for active legal holds (from compliance table). If any hold exists, does not proceed; logs and alerts admin.
  - Permanently overwrites PII fields: `first_name`, `last_name`, `email`, `phone` with anonymized values.
  - Hard‑deletes associated activities, messages, and other non‑financial records.
  - Removes the contact from the `contacts` table and replaces with a placeholder.
  - Maintains referential integrity on financial records (invoices, payments) by anonymizing the customer field without breaking audit trails.
- [ ] All erasure steps logged to `gdpr_requests` and `audit_logs`.  
- [ ] Integration tests: erasure request → soft delete → cancel → verify restoration; erasure request → fast‑forward 30 days → verify PII permanently removed.  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- The 30‑day grace period must be **mandatory** – no immediate hard‑delete, even on admin request.  
- Legal holds (from a `legal_holds` table, created by compliance officers) **must** block hard‑deletion.  
- Anonymized records must not be re‑identifiable (do not store a mapping of original to anonymized values).  
- Financial transactions (invoices, payments) must be preserved for tax/audit purposes; only the customer reference is anonymized.  
- Background job must use `SELECT … FOR UPDATE` to prevent concurrent erasure/hold changes from causing inconsistencies.

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm --filter @workspace/api‑server test -- gdpr‑erasure.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD notes**
- DDD: Erasure is a cross‑context operation; it must be handled as a saga with compensating actions.  
- TDD: Write integration test that creates a contact with data across CRM and Appointments, triggers erasure, simulates time passage, and verifies PII is gone but financial records remain.
- BDD: “As a contact, I can request that my data be deleted, and after 30 days it is permanently anonymized, unless there is a legal hold.”

---

### Subtasks
- [ ] GDPR‑002.0.25 (AGENT): Read GDPR‑001, all domain CRUD APIs, and existing soft‑delete patterns. No action — pause.
- [ ] GDPR‑002.1 (AGENT): Add erasure endpoints to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen`.
- [ ] GDPR‑002.2 (AGENT): Implement `ErasureService` with soft‑delete orchestration and legal‑hold check. **File:** `artifacts/api‑server/src/services/gdpr/erasure‑service.ts` **Verification:** Unit tests.
- [ ] GDPR‑002.3 (AGENT): Implement `ErasureJob` with delayed hard‑deletion and PII overwrite rules. **File:** `artifacts/api‑server/src/jobs/gdpr‑erasure‑job.ts` **Verification:** Unit tests.
- [ ] GDPR‑002.4 (AGENT): Define `legal_holds` table for compliance holds that block erasure. **File:** `lib/db/src/schema/gdpr/legal‑holds.ts` **Verification:** Migration; `pnpm typecheck`.
- [ ] GDPR‑002.5 (AGENT): Create erasure routes. **File:** `artifacts/api‑server/src/routes/gdpr/erasure.ts` **Verification:** Integration tests green.
- [ ] GDPR‑002.6 (HUMAN): Final review – test full erasure lifecycle with and without legal hold. **Verification:** Approved.

---

## Consent Management

### [ ] GDPR‑003: Consent Management API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No consent tracking exists. GDPR and ePrivacy require explicit consent for marketing and certain data processing activities.  
**Size:** Medium  

**Description:**  
Implement a consent management system that tracks marketing consent, cookie consent, and per‑purpose data processing consent for contacts. Each consent record includes the timestamp, IP address, and the specific legal basis. Contacts can view and update their consent preferences via the privacy center (FRONT‑GDPR‑001).

**Depends on:** `GDPR‑001` (contacts reference), `crm/CRM‑CONTACTS‑COMPANIES.md → DB‑CRM‑002`  
**Blocks:** `FRONT‑GDPR‑001`

**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/gdpr/consent‑service.ts`, `artifacts/api‑server/src/routes/gdpr/consent.ts`

**Definition of Done**
- [ ] `consents` table: `id`, `organization_id`, `contact_id` (FK), `purpose` (pgEnum: `marketing`, `data_processing`, `cookies_analytics`, `cookies_marketing`, `third_party_sharing`), `granted` (boolean), `granted_at` (timestamp), `ip_address`, `user_agent`, `legal_basis` (text).  
- [ ] `GET /api/v1/gdpr/consent/{contactId}` – returns all consent records for a contact (admin or the contact via self‑service token).  
- [ ] `PATCH /api/v1/gdpr/consent/{contactId}` – update one or more consent flags. Each change creates a new record (append‑only log).  
- [ ] Consent changes are logged in the audit log.  
- [ ] Integration tests: grant consent, revoke consent, verify history.  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- Consent records are append‑only; never overwrite a previous consent grant – always create a new revision.  
- The `ip_address` must be recorded from the request at the time of consent (required for GDPR evidence).  
- Marketing consent must be opt‑in (pre‑checked boxes are illegal under GDPR).  
- If a contact revokes consent, all automated marketing emails must stop immediately.

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm --filter @workspace/api‑server test -- gdpr‑consent.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] GDPR‑003.0.25 (AGENT): Read DB‑CRM‑002 and GDPR‑001. No action — pause.
- [ ] GDPR‑003.1 (AGENT): Define `consents` table schema. **File:** `lib/db/src/schema/gdpr/consents.ts` **Verification:** Migration; `pnpm typecheck`.
- [ ] GDPR‑003.2 (AGENT): Add consent endpoints to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen`.
- [ ] GDPR‑003.3 (AGENT): Implement `ConsentService` with append‑only logging. **File:** `artifacts/api‑server/src/services/gdpr/consent‑service.ts` **Verification:** Unit tests.
- [ ] GDPR‑003.4 (AGENT): Create consent routes. **File:** `artifacts/api‑server/src/routes/gdpr/consent.ts` **Verification:** Integration tests green.
- [ ] GDPR‑003.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Privacy Center UI

### [ ] FRONT‑GDPR‑001: Privacy Center UI
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No interface exists for contacts to exercise their rights. GDPR requires a public, accessible privacy center.  
**Size:** Medium  

**Description:**  
Build a privacy center page at `/privacy` (public, no authentication) that allows a contact to:
- Enter their email, receive a one‑time access token (magic link), and log in to view their data.
- View all PII held about them (read‑only).
- Download their data (triggers GDPR‑001 export).
- Request erasure of their data (triggers GDPR‑002).
- Manage their consent preferences (marketing, cookies, data processing).

The privacy center uses portal‑style magic‑link authentication scoped strictly to the privacy center (not full portal access).

**Depends on:** `GDPR‑001`, `GDPR‑002`, `GDPR‑003`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`, `infrastructure/AUTH.md → FRONT‑AUTH‑003`  
**Blocks:** None

**Related Files:** `artifacts/apex‑os/src/pages/PrivacyCenter.tsx`, `artifacts/apex‑os/src/contexts/PrivacyAuthContext.tsx`

**Definition of Done**
- [ ] Public page at `/privacy`.  
- [ ] “Access My Data” form: enters email, receives a magic link valid for 15 minutes with a scope limited to privacy operations.  
- [ ] After authentication: tabbed interface showing “My Data”, “Download”, “Erase”, and “Consent”.  
- [ ] “My Data” tab: displays personal data in a structured, readable format.  
- [ ] “Download” button triggers export (GDPR‑001); shows job status and download link when ready.  
- [ ] “Erase” button with double confirmation; shows erasure status.  
- [ ] “Consent” tab: toggles for each consent purpose, with grant/revoke history.  
- [ ] All actions are accessible (WCAG 2.2 AA).  
- [ ] Component tests with MSW.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- PrivacyCenter.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD notes**
- BDD: “As a contact, I can visit the privacy center, verify my email, view my data, download it, and request its deletion.”

---

### Subtasks
- [ ] FRONT‑GDPR‑001.0.25 (AGENT): Read GDPR‑001, GDPR‑002, GDPR‑003 backend APIs. No action — pause.
- [ ] FRONT‑GDPR‑001.1 (AGENT): Build `PrivacyCenter` page with email verification flow and tabbed data viewer. **File:** `artifacts/apex‑os/src/pages/PrivacyCenter.tsx`
- [ ] FRONT‑GDPR‑001.2 (AGENT): Implement privacy‑scoped magic‑link auth context. **File:** `artifacts/apex‑os/src/contexts/PrivacyAuthContext.tsx`
- [ ] FRONT‑GDPR‑001.3 (AGENT): Build data view, download, erasure, and consent tabs. **Verification:** Component tests.
- [ ] FRONT‑GDPR‑001.4 (HUMAN): Final review and sign‑off – manual test of full privacy center flow.

---

## Extended Compliance: CCPA, California Delete Act, EU Data Act

### [ ] GDPR‑004: CCPA/CPRA & California Delete Act Compliance
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No CCPA/CPRA compliance exists. California residents have rights similar to GDPR, plus the California Delete Act requires a universal deletion mechanism.  
**Size:** Medium  

**Description:**  
Extend the GDPR compliance infrastructure to also support CCPA/CPRA requirements:
- **Do Not Sell/Share My Personal Information:** A global opt‑out mechanism that prevents the platform from “selling” or “sharing” personal information (as defined by CCPA) for any contact. This is largely a policy/configuration switch that categorically disables third‑party data sharing.
- **California Delete Act:** Integration with the California Data Protection Authority’s DROP (Deletion Request Online Portal) to process deletion requests every 45 days. Also includes annual registration as a data broker if applicable.

**Depends on:** `GDPR‑001`, `GDPR‑002`  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/services/gdpr/ccpa‑service.ts`

**Definition of Done**
- [ ] `organizations.settings` includes a `do_not_sell` flag that applies to all contacts under that organization.  
- [ ] `GET /api/v1/gdpr/ccpa/status/{contactId}` returns whether “Do Not Sell” is active.  
- [ ] `POST /api/v1/gdpr/ccpa/opt‑out` creates an opt‑out record (globally or per contact).  
- [ ] DROP integration: scheduled job every 45 days that fetches deletion requests from the California DROP portal (via API or CSV import) and automatically creates erasure requests (GDPR‑002).  
- [ ] Integration tests: opt‑out recorded, DROP import flow.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- ccpa.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] GDPR‑004.1 (AGENT): Extend consent system with CCPA‑specific opt‑out. **File:** `artifacts/api‑server/src/services/gdpr/ccpa‑service.ts`
- [ ] GDPR‑004.2 (AGENT): Implement DROP integration job. **File:** `artifacts/api‑server/src/jobs/drop‑sync‑job.ts`
- [ ] GDPR‑004.3 (HUMAN): Final review and sign‑off.

---

### [ ] GDPR‑005: EU Data Act – Provider Switching
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No comprehensive organization export exists. The EU Data Act requires that customers can switch providers with minimal friction.  
**Size:** Medium  

**Description:**  
Ensure the organization‑level export (GDPR‑001) meets EU Data Act provider switching requirements:
- Export all data in a structured, machine‑readable format (JSON/CSV/NDJSON).
- Provide switching assistance documentation.
- Maintain the export API for at least 30 days after contract termination.
- The export must include: all CRM records, projects, tasks, invoices, payments, documents (with download links), appointments, portal messages, asset records, and audit logs.

**Depends on:** `GDPR‑001` (organization export), `DOC‑STORAGE‑001`  
**Blocks:** None

**Related Files:** `docs/switching‑assistance.md`, `artifacts/api‑server/src/services/gdpr/export‑service.ts` (extended)

**Definition of Done**
- [ ] Organization export format documented and validated to be machine‑readable.  
- [ ] Export file includes a README describing the data schema and how to import it into alternative platforms.  
- [ ] `docs/switching‑assistance.md` published, providing step‑by‑step instructions for migrating to another provider.  
- [ ] Integration test: full organization export, verify file structure, verify documentation is consistent with export format.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- eu-data‑act‑export.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] GDPR‑005.1 (AGENT): Enhance organization export to include all required modules and generate a README. **File:** `artifacts/api‑server/src/services/gdpr/export‑service.ts`
- [ ] GDPR‑005.2 (AGENT): Write switching assistance documentation. **File:** `docs/switching‑assistance.md`
- [ ] GDPR‑005.3 (HUMAN): Final review – verify export completeness against a reference tenant.

---

## Data Processing Audit Log

### [ ] GDPR‑006: GDPR Request Audit Log
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** The `gdpr_requests` table is defined but not yet audited – the system must log every SAR, erasure, and consent change to demonstrate compliance to regulators.  
**Size:** Small  

**Description:**  
Ensure that every GDPR‑related operation (export request, erasure request, consent change, DROP import) is recorded in both the `gdpr_requests` table (for internal tracking) and the `audit_logs` table (for auditor review). The `gdpr_requests` table must be queryable by regulators via a dedicated admin page.

**Depends on:** `GDPR‑001`, `GDPR‑002`, `GDPR‑003`, `infrastructure/SETTINGS‑AUDIT.md → DB‑SETTINGS‑002`, `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑001`  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/services/gdpr/gdpr‑audit‑log.ts`, `artifacts/apex‑os/src/components/admin/GDPRRequestLog.tsx`

**Definition of Done**
- [ ] Every GDPR service call automatically writes to `gdpr_requests` (lifecycle tracking) and `audit_logs` (compliance record).  
- [ ] `GET /api/v1/admin/gdpr‑requests` – admin endpoint to list all GDPR requests for the organization, filterable by type, status, and date range.  
- [ ] Admin UI page at `/settings/gdpr‑requests` showing a table of all requests with status badges and action buttons (cancel, view details).  
- [ ] Integration tests verify that each operation creates the correct audit entries.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- gdpr‑audit.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] GDPR‑006.1 (AGENT): Implement `GdprAuditService` that writes to both tables in a transaction. **File:** `artifacts/api‑server/src/services/gdpr/gdpr‑audit‑log.ts`
- [ ] GDPR‑006.2 (AGENT): Add admin query endpoint and route. **File:** `artifacts/api‑server/src/routes/admin/gdpr‑requests.ts`
- [ ] GDPR‑006.3 (AGENT): Build admin UI page for GDPR request log. **File:** `artifacts/apex‑os/src/pages/settings/GDPRRequests.tsx`
- [ ] GDPR‑006.4 (HUMAN): Final review and sign‑off.

---

## Data Protection Impact Assessment (DPIA) Template

### [ ] GDPR‑007: DPIA Template
**Status:** ⏳ Not Started  
**Actor:** HUMAN (legal review required)  
**Priority:** 🟡 Medium  
**Current State:** No DPIA exists. For processing that is likely to result in high risk to individuals (e.g., large‑scale processing of special categories of data), a DPIA is legally required before processing begins.  
**Size:** Small  

**Description:**  
Create a Data Protection Impact Assessment (DPIA) template that documents:
- The nature, scope, context, and purposes of the processing.
- The necessity and proportionality of the processing.
- The risks to individuals’ rights and freedoms.
- The measures in place to address those risks (encryption, access controls, anonymization, breach notification).
This template is a static document, filled out by the data controller (the customer) with assistance from Apex’s documentation.

**Depends on:** None  
**Blocks:** None

**Related Files:** `docs/gdpr/dpia‑template.md`

**Definition of Done**
- [ ] Template document created covering all Article 35 requirements.  
- [ ] Template reviewed by a legal professional.  
- [ ] Published in the help center / security documentation.

**Verification**
```bash
# Manual: open docs/gdpr/dpia‑template.md and verify completeness
```

---

### Subtasks
- [ ] GDPR‑007.1 (AGENT): Draft DPIA template. **File:** `docs/gdpr/dpia‑template.md`
- [ ] GDPR‑007.2 (HUMAN): Legal review. **Verification:** Approved.
- [ ] GDPR‑007.3 (AGENT): Publish in help center. **Verification:** Accessible.

---