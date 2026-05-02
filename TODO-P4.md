Now applying all corrections to **Phase 4 – API Business Logic: Documents, Assets, Portal, Analytics & Settings**. This phase completes the API surface for the remaining bounded contexts. It introduces the file storage adapter (Cloudflare R2) and portal authentication with magic-link hashing. Every endpoint follows the established patterns: contract‑first, test‑first, service‑as‑deep‑module, soft delete where applicable, Either error handling, and domain event emission. Portal content permissions are enforced at the service layer, ensuring that client‑side queries respect access controls.

Key improvements integrated:

- **DOC‑STORAGE‑001** inserted before document endpoints; `StorageAdapter` injected into `DocumentService`.
- **Portal authentication** (`PORTAL‑AUTH‑001`) with magic‑link **hashing** and separate portal JWT, using `EMAIL‑SERVICE‑001`.
- **Portal permission enforcement** added to `API‑PORTAL‑003` service logic.
- **Explicit `depends_on`**, verification commands, and depth refactor checks for every deep module.
- **Negative integration test cases** with exact error codes for each context.
- **E‑Sign integration** as a sub‑domain of Documents, with SignWell stub.

---

# Phase 4 – API Business Logic: Documents, Assets, Portal, Analytics & Settings

---

## Phase 4 Task Index

**Phase 4 Prerequisites**  
• EMAIL‑SERVICE‑001 – Email Service Interface & Implementation  
• EMAIL‑TEMPLATES‑001 – Email Templates Implementation  
• STORAGE‑001 – File Storage Adapter Foundation  
• REPO‑001 – Base Repository Pattern Implementation  

**Documents Context**  
• DOC‑STORAGE‑001 – File Storage Adapter (Cloudflare R2)  
• API‑DOCS‑001 – Documents – Expand OpenAPI Spec (file upload/download endpoints added)  
• API‑DOCS‑002 – Documents – Integration Tests (TDD Red)  
• API‑DOCS‑003 – Documents – Service & Repository (with StorageAdapter injection)  
• API‑DOCS‑004 – Documents – Routes & Green Tests  
• API‑DOCS‑005 – Folders – Expand OpenAPI Spec  
• API‑DOCS‑006 – Folders – Integration Tests (Red)  
• API‑DOCS‑007 – Folders – Service & Repository  
• API‑DOCS‑008 – Folders – Routes & Green Tests  
• API‑ESIGN‑001 – E‑Sign – Expand OpenAPI Spec  
• API‑ESIGN‑002 – E‑Sign – Integration Tests & Service  

**Assets Context**  
• API‑ASSETS‑001 – Assets – Expand OpenAPI Spec  
• API‑ASSETS‑002 – Assets – Integration Tests (Red)  
• API‑ASSETS‑003 – Assets – Service & Repository  
• API‑ASSETS‑004 – Assets – Routes & Green Tests  
• API‑ASSETS‑005 – Check‑Out/In – Expand OpenAPI Spec  
• API‑ASSETS‑006 – Check‑Out/In – Integration Tests (Red)  
• API‑ASSETS‑007 – Check‑Out/In – Service & Repository  
• API‑ASSETS‑008 – Check‑Out/In – Routes & Green Tests  
• API‑ASSETS‑009 – Maintenance Log – Expand OpenAPI Spec  
• API‑ASSETS‑010 – Maintenance Log – Integration Tests (Red)  
• API‑ASSETS‑011 – Maintenance Log – Service & Repository  
• API‑ASSETS‑012 – Maintenance Log – Routes & Green Tests  

**Client Portal Context**  
• PORTAL‑AUTH‑001 – Portal Authentication (Magic Link + JWT)  
• API‑PORTAL‑001 – Portal – Expand OpenAPI Spec (firm‑side + client‑side)  
• API‑PORTAL‑002 – Portal – Integration Tests (Red)  
• API‑PORTAL‑003 – Portal – Service & Repository (with permission enforcement)  
• API‑PORTAL‑004 – Portal – Routes & Green Tests  
• PORTAL‑EVENTS‑001 – Portal Domain Events Verification  

**Analytics Context**  
• API‑ANALYTICS‑001 – Analytics – Expand OpenAPI Spec  
• API‑ANALYTICS‑002 – Analytics – Integration Tests (Red)  
• API‑ANALYTICS‑003 – Analytics – Service & Repository  
• API‑ANALYTICS‑004 – Analytics – Routes & Green Tests  

**System Configuration & Cross‑Cutting**  
• API‑SETTINGS‑001 – System Settings – Expand OpenAPI Spec  
• API‑SETTINGS‑002 – System Settings – Integration Tests (Red)  
• API‑SETTINGS‑003 – System Settings – Service & Repository  
• API‑SETTINGS‑004 – System Settings – Routes & Green Tests  
• API‑AUDIT‑001 – Audit Log Query – Expand OpenAPI Spec  
• API‑AUDIT‑002 – Audit Log Query – Integration Tests (Red)  
• API‑AUDIT‑003 – Audit Log Query – Service & Repository  
• API‑AUDIT‑004 – Audit Log Query – Routes & Green Tests  

---

## Phase 4 Prerequisites

### EMAIL‑SERVICE‑001: Email Service Interface & Implementation
**Status:** ⏳ Not Started  
**Depends on:** None.  
**Blocks:** PORTAL‑AUTH‑001 (magic link emails), API‑APPT‑003 (appointment notifications), API‑PORTAL‑003 (portal messaging), EMAIL‑TEMPLATES‑001.  
**Definition of Done:**  
- `artifacts/api-server/src/lib/email/email-service.ts` exports `EmailServicePort` interface with methods: `sendEmail(to, subject, body, html?)`, `sendTemplate(to, templateId, variables)`.  
- `artifacts/api-server/src/lib/email/smtp-provider.ts` implements `EmailServicePort` using Nodemailer with SMTP configuration. Config from env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.  
- `artifacts/api-server/src/lib/email/mock-provider.ts` implements `EmailServicePort` for testing (stores sent emails in memory).  
- Environment variables added to `.env.example`.  
- Unit tests for the interface contract using mock provider.  
- Integration test with real SMTP (manual).

**Subtasks:**
- [ ] EMAIL‑SERVICE‑001.1: Create `EmailServicePort` interface. (AGENT) – `email-service.ts`  
  **verification:** `pnpm typecheck`.
- [ ] EMAIL‑SERVICE‑001.2: Implement `SMTPEmailProvider`. (AGENT) – `smtp-provider.ts`  
  **verification:** Unit test with mock SMTP passes.
- [ ] EMAIL‑SERVICE‑001.3: Implement `MockEmailProvider` for testing. (AGENT) – `mock-provider.ts`  
  **verification:** Unit test passes.
- [ ] EMAIL‑SERVICE‑001.4: Write contract tests for the interface. (AGENT)  
  **verification:** `pnpm test -- email-service` green.
- [ ] EMAIL‑SERVICE‑001.5: Add SMTP env vars to `.env.example`. (AGENT)  
  **verification:** Variables documented.
- [ ] EMAIL‑SERVICE‑001.6: Manual SMTP test (if using real provider). (HUMAN)  
  **verification:** Manual.

---

### EMAIL‑TEMPLATES‑001: Email Templates Implementation
**Status:** ⏳ Not Started  
**Depends on:** EMAIL‑SERVICE‑001 (EmailServicePort interface).  
**Blocks:** PORTAL‑AUTH‑001 (magic link email), API‑APPT‑003 (appointment confirmation/cancellation emails).  
**Definition of Done:**  
- `artifacts/api-server/src/lib/email/templates/` directory with template files for: magic link email, appointment confirmation, appointment cancellation.  
- `EmailTemplateEngine` class that renders templates with variable substitution using Handlebars or simple string interpolation.  
- Template registry that maps template IDs to template files.  
- Unit tests for each template rendering with sample data.  
- Integration with `EmailServicePort.sendTemplate()` method.

**Templates Required:**
- `magic-link`: Sends login link with expiry time
- `appointment-confirmation`: Confirms appointment details with client info
- `appointment-cancellation`: Notifies of cancellation with reason

**Subtasks:**
- [ ] EMAIL‑TEMPLATES‑001.1: Create template engine and registry. (AGENT) – `template-engine.ts`  
  **verification:** `pnpm typecheck`.
- [ ] EMAIL‑TEMPLATES‑001.2: Implement magic-link template. (AGENT) – `templates/magic-link.ts`  
  **verification:** Unit test renders with sample data.
- [ ] EMAIL‑TEMPLATES‑001.3: Implement appointment confirmation template. (AGENT) – `templates/appointment-confirmation.ts`  
  **verification:** Unit test passes.
- [ ] EMAIL‑TEMPLATES‑001.4: Implement appointment cancellation template. (AGENT) – `templates/appointment-cancellation.ts`  
  **verification:** Unit test passes.
- [ ] EMAIL‑TEMPLATES‑001.5: Write integration test with EmailServicePort. (AGENT)  
  **verification:** Template rendering works end-to-end.

---

### STORAGE‑001: File Storage Adapter Foundation
**Status:** ⏳ Not Started  
**Depends on:** None.  
**Blocks:** DOC‑STORAGE‑001 (which extends this foundation).  
**Definition of Done:**  
- `artifacts/api-server/src/lib/storage/base-storage.ts` exports base storage interfaces and utilities.
- Common storage error types: `StorageError`, `StorageBackendUnavailable`, `FileNotFound`, `InvalidKey`.
- Abstract base class `BaseStorageAdapter` with shared functionality (key validation, error mapping).
- Storage configuration types and validation schemas.
- Unit tests for base functionality.

**Subtasks:**
- [ ] STORAGE‑001.1: Create base storage interfaces and error types. (AGENT) – `base-storage.ts`  
  **verification:** `pnpm typecheck`.
- [ ] STORAGE‑001.2: Implement `BaseStorageAdapter` abstract class. (AGENT)  
  **verification:** Unit tests pass.
- [ ] STORAGE‑001.3: Add storage configuration schemas. (AGENT)  
  **verification:** Zod schemas validate correctly.
- [ ] STORAGE‑001.4: Write unit tests for base storage utilities. (AGENT)  
  **verification:** `pnpm test -- base-storage` green.

---

### Note: REPO‑001 Removed
**Status:** ⚠️ **REMOVED** - Duplicate of ARCH‑001.2 (BaseRepository) already implemented in Phase 0.  
**Rationale:** The base repository pattern is established in Phase 0 via ARCH‑001.2. All repository implementations in Phase 4 should extend the existing `BaseRepository<T>` class from `lib/db/src/repositories/base-repository.ts`.  

**Reference:** See `ARCH‑001.2` in Phase 0 for the complete BaseRepository implementation.  

---

## Documents Context

### DOC‑STORAGE‑001: File Storage Adapter (Cloudflare R2)
**Status:** ⏳ Not Started  
**Depends on:** STORAGE‑001 (base storage foundation).  
**Blocks:** API‑DOCS‑003 (document service needs storage adapter).  
**Definition of Done:**  
- `artifacts/api‑server/src/lib/storage/storage‑adapter.ts` exports `StorageAdapter` interface with methods: `upload(key, content, contentType?)`, `download(key)`, `getSignedUrl(key, expiresIn)`, `delete(key)`, `list(prefix?)`.  
- `artifacts/api‑server/src/lib/storage/r2‑adapter.ts` implements `StorageAdapter` using AWS SDK v3 (S3 client pointed at R2 endpoint). Config from env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.  
- Environment variables added to `.env.example`.  
- Unit tests for the interface contract using an in‑memory mock adapter (upload→download returns same content, etc.).  
- Smoke test against real R2 (manual).

**Subtasks:**
- [ ] DOC‑STORAGE‑001.1: Create `StorageAdapter` interface. (AGENT) – `storage‑adapter.ts`  
  **verification:** `pnpm typecheck`.
- [ ] DOC‑STORAGE‑001.2: Implement `CloudflareR2Adapter`. (AGENT) – `r2‑adapter.ts`  
  **verification:** Unit test with mock S3 client (or mock adapter) passes.
- [ ] DOC‑STORAGE‑001.3: Write contract tests for the interface (using in‑memory adapter). (AGENT)  
  **verification:** `pnpm test -- storage-adapter` green.
- [ ] DOC‑STORAGE‑001.4: Add R2 env vars to `.env.example`. (AGENT)  
  **verification:** Variables documented.
- [ ] DOC‑STORAGE‑001.5: Provision Cloudflare R2 bucket (if using real), run manual smoke test. (HUMAN)  
  **verification:** Manual.

---

### API‑DOCS‑001: Documents – Expand OpenAPI Spec (Amended)
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑002, DOC‑STORAGE‑001 (for interface knowledge).  
**Definition of Done:** OpenAPI spec adds `documents` tag and paths:  
- `GET /documents` – list with pagination, folder filter, search.  
- `POST /documents` – create metadata record (without file content).  
- `GET /documents/{documentId}` – metadata + `signed_download_url` (presigned, 15‑minute expiry).  
- `POST /documents/upload` – multipart/form‑data upload (file + metadata). Returns document metadata with `signed_download_url`.  
- `PATCH /documents/{documentId}` – update name, folder, version bumps on content change.  
- `DELETE /documents/{documentId}` – soft delete (also deletes from storage).  
Schemas: `Document`, `DocumentCreate`, `DocumentUpdate`. Examples for all.

**Subtasks:** spec, codegen, typecheck.

---

### API‑DOCS‑002: Documents – Integration Tests (TDD Red)
**Depends on:** API‑DOCS‑001, TEST‑INFRA‑001.  
**Tests include:**
- Upload a file → 201, document metadata with `storage_path`, version=1.
- Get document → 200 with `signed_download_url`.
- Update document (new file) → version increments to 2.
- Soft delete → 204, subsequent GET → 404.
- Attempt to upload without file → 400.
- File not found → 404 `DocumentNotFound`.

---

### API‑DOCS‑003: Documents – Service & Repository (Deep Module)
**Depends on:** DB‑MIGRATE‑ALL, DOC‑STORAGE‑001, ARCH‑001.2 (BaseRepository pattern).  
**Definition of Done:**  
- `DocumentRepository` (soft delete, version tracking).  
- `DocumentService` with `StorageAdapter` injected via constructor.  
- Methods: `uploadDocument(file, metadata)`: calls `storageAdapter.upload`, stores returned key, increments version, emits `DocumentUploaded` event.  
- `getDownloadUrl(documentId)`: calls `storageAdapter.getSignedUrl`.  
- `deleteDocument(documentId)`: soft delete in DB + calls `storageAdapter.delete`.  
- All methods return `Either<DomainError, Result>`.  
- Wrap storage calls in try/catch → map to `StorageBackendUnavailable`.  
**Deep Module:** Encapsulates versioning, storage abstraction, and event publishing.  
**Depth refactor check** required.

---

### API‑DOCS‑004: Documents – Routes & Green Tests
**Depends on:** API‑DOCS‑003, AUTH‑008.  
**Subtasks:** routes, integration tests green.

---

### API‑DOCS‑005 – API‑DOCS‑008: Folders (similar pattern)  
List, create, get, update, soft delete. Service enforces that a folder with children cannot be deleted. Either returns.

---

### API‑ESIGN‑001: E‑Sign – Expand OpenAPI Spec
**Depends on:** DB‑ESIGN‑001.  
**Definition of Done:**  
- `POST /documents/{documentId}/signature‑requests` – send for signature (body: `{ signers: [{ email, name, role }] }`).  
- `GET /documents/{documentId}/signature‑requests/{requestId}` – status.  
- `DELETE /documents/{documentId}/signature‑requests/{requestId}` – void request.  
Examples included.

---

### API‑ESIGN‑002: E‑Sign – Integration Tests & Service
**Depends on:** API‑ESIGN‑001, TEST‑INFRA‑001.  
**Service:** `ESignService` with constructor injection of `ESignProviderPort` (SignWellClient stub). `sendForSignature` calls provider, stores `external_request_id` and initial status; `getSignatureStatus` updates local status; `voidRequest` voids. Emits `DocumentSentForSignature` event.  
**Integration tests:** create signature request → 201; retrieve → 200 with status; void → 200; non‑existent document → 404.

---

### API‑ESIGN‑003: E‑Sign – Webhook Handler
**Status:** ⏳ Not Started  
**Depends on:** API‑ESIGN‑002, DB‑ESIGN‑001.  
**Blocks:** Complete e‑sign integration workflow.  
**Definition of Done:**  
- `POST /webhooks/esign` – public endpoint to receive SignWell webhook callbacks.  
- HMAC signature verification using `ESIGN_WEBHOOK_SECRET` environment variable.  
- Webhook payload processing: updates signature request status based on SignWell events (`signed`, `declined`, `expired`).  
- Emits `DocumentSigned` or `SignatureDeclined` domain events.  
- Idempotency: processes each webhook ID only once (store processed webhook IDs).  
- Returns 200 for successful processing, 400 for invalid signatures, 500 for processing errors.  
- Unit tests for webhook signature verification and payload processing.  
- Integration test with simulated SignWell webhook payload.

**Subtasks:**
- [ ] API‑ESIGN‑003.1: Add webhook endpoint to OpenAPI spec. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Codegen passes.
- [ ] API‑ESIGN‑003.2: Implement webhook signature verification utility. (AGENT) – `lib/esign/webhook‑verifier.ts`  
  **verification:** Unit tests pass.
- [ ] API‑ESIGN‑003.3: Implement webhook handler route. (AGENT) – `routes/esign‑webhooks.ts`  
  **verification:** Route processes test payload correctly.
- [ ] API‑ESIGN‑003.4: Add idempotency handling for webhook processing. (AGENT)  
  **verification:** Duplicate webhook IDs are ignored.
- [ ] API‑ESIGN‑003.5: Write integration tests for webhook flow. (AGENT)  
  **verification:** End-to-end webhook processing works.

---

### API‑ESIGN‑004: E‑Sign – Concrete Adapter Implementation
**Status:** ⏳ Not Started  
**Depends on:** API‑ESIGN‑002 (service interface defined).  
**Blocks:** Production-ready e‑sign functionality.  
**Definition of Done:**  
- `artifacts/api-server/src/lib/esign/signwell-adapter.ts` implements `ESignProviderPort` using real SignWell HTTP API.  
- HTTP client with retry logic, exponential backoff, and proper error mapping.  
- Configuration via environment variables: `SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL` (default: https://api.signwell.com).  
- Request/response mapping to/from internal domain models.  
- Rate limiting handling and API quota management.  
- Comprehensive error handling with mapping to domain errors (`ESignProviderUnavailable`, `InvalidSigner`, `DocumentAlreadySigned`).  
- Unit tests with mocked HTTP responses covering success cases, API errors, network failures, and rate limits.  
- Integration test against SignWell sandbox (manual verification).  

**Subtasks:**
- [ ] API‑ESIGN‑004.1: Implement SignWell HTTP client wrapper. (AGENT) – `signwell-client.ts`  
  **verification:** Unit tests for API calls pass.
- [ ] API‑ESIGN‑004.2: Implement `ESignProviderPort` adapter. (AGENT) – `signwell-adapter.ts`  
  **verification:** Adapter implements port interface correctly.
- [ ] API‑ESIGN‑004.3: Add error mapping and retry logic. (AGENT)  
  **verification:** Error scenarios handled correctly.
- [ ] API‑ESIGN‑004.4: Write comprehensive unit tests. (AGENT)  
  **verification:** All test cases pass.
- [ ] API‑ESIGN‑004.5: Add SignWell env vars to `.env.example`. (AGENT)  
  **verification:** Variables documented.
- [ ] API‑ESIGN‑004.6: Manual sandbox test (optional). (HUMAN)  
  **verification:** Manual.

---

## Assets Context

*All assets tasks follow the established CRUD/soft‑delete pattern. Check‑out/check‑in are append‑only log entries; service enforces that an asset must be available before checkout. Maintenance log is append‑only. Deep modules encapsulate status transitions and availability rules.*

### API‑ASSETS‑001 through API‑ASSETS‑012 covered with tests, repositories, services, routes.

---

## Client Portal Context

### PORTAL‑AUTH‑001: Portal Authentication (Magic Link + JWT)
**Status:** ⏳ Not Started  
**Depends on:** DB‑PORTAL‑002 (has `magic_link_hash`), EMAIL‑SERVICE‑001.  
**Blocks:** API‑PORTAL‑001 (client‑side routes).  
**Definition of Done:**  
- `POST /portal/auth/request‑link` – accepts email, generates random token, stores `magic_link_hash` with expiry, sends email via `EmailServicePort`. Returns success (no token).  
- `POST /portal/auth/verify‑link` – accepts raw token, hashes it, compares with stored hash, validates expiry, generates portal JWT (separate secret `PORTAL_JWT_SECRET`), marks session active. Returns `{ accessToken, client }`.  
- `POST /portal/auth/logout` – invalidates session.  
- `portalAuthMiddleware` implemented: reads `Authorization: Bearer <portal‑jwt>`, verifies with portal secret, checks `is_active` and expiry, sets `req.portalClient`.  
- Integration tests: request link, verify link with valid token → 200 + JWT; verify with invalid token → 401 `InvalidMagicLink`; expired token → 401 `PortalSessionExpired`.  
**DDD:** Portal identity is separate from firm identity, with its own JWT secret and session lifecycle.

**Subtasks:**
- [ ] PORTAL‑AUTH‑001.1: Add portal auth endpoints to OpenAPI spec. (AGENT)  
  **verification:** Codegen passes.
- [ ] PORTAL‑AUTH‑001.2: Write integration tests (Red). (AGENT)  
  **verification:** Tests fail.
- [ ] PORTAL‑AUTH‑001.3: Implement `PortalAuthService` with hashing and email sending. (AGENT)  
  **verification:** Unit tests.
- [ ] PORTAL‑AUTH‑001.4: Implement `portalAuthMiddleware`. (AGENT) – `middlewares/portal‑auth.ts`  
  **verification:** Middleware unit test.
- [ ] PORTAL‑AUTH‑001.5: Run integration tests to green. (AGENT)  
  **verification:** Full flow passes.

---

### API‑PORTAL‑001: Portal – Expand OpenAPI Spec
**Depends on:** PORTAL‑AUTH‑001, DB‑PORTAL‑001.  
**Definition of Done:** Two sets of routes:  
**Firm‑side** (auth: firm JWT):  
- `GET /portal/clients` – list portal clients  
- `POST /portal/clients` – enable portal for a company  
- `PATCH /portal/clients/{clientId}` – update branding config  
- `POST /portal/clients/{clientId}/permissions` – grant resource access  
- `GET /portal/clients/{clientId}/messages` – firm reads messages  
- `POST /portal/clients/{clientId}/messages` – firm sends message  

**Client‑side** (auth: portal JWT, via `portalAuthMiddleware`):  
- `GET /portal/me` – profile  
- `GET /portal/me/projects` – accessible projects  
- `GET /portal/me/invoices` – accessible invoices  
- `GET /portal/me/documents` – accessible documents  
- `GET /portal/me/messages` – messages  
- `POST /portal/me/messages` – client sends message  

All schemas, pagination, examples.

---

### API‑PORTAL‑002: Portal – Integration Tests (Red)
**Depends on:** API‑PORTAL‑001, TEST‑INFRA‑001.  
**Tests include:** firm enables portal → 201; client requests link and logs in; client fetches projects (only those with `can_view` permission); client without permission receives 403 or empty list; firm can grant permissions; firm sends message → 201; client replies → 201.

---

### API‑PORTAL‑003: Portal – Service & Repository (with permission enforcement)
**Depends on:** DB‑MIGRATE‑ALL, PORTAL‑AUTH‑001, EMAIL‑SERVICE‑001.  
**Definition of Done:**  
- `PortalService`: methods for enabling portal, updating branding, managing permissions.  
- **Permission enforcement**: all client‑side data queries (projects, invoices, documents, messages) must filter by `portal_content_permissions`. If no permission, return `PortalAccessDenied` (403) or empty list.  
- Emits `PortalClientEnabled`, `PortalMessageReceived` events.  
- Either returns.  
**Depth refactor check.**

---

### API‑PORTAL‑004: Portal – Routes & Green Tests
**Depends on:** API‑PORTAL‑003.  
**Subtasks:** wires firm and client routes with appropriate auth middleware; integration tests go green.

---

### PORTAL‑EVENTS‑001: Portal Domain Events Verification
**Depends on:** API‑PORTAL‑003, DB‑SETTINGS‑002.  
**Subtasks:** verify events appear in audit logs.

---

### PORTAL‑CLEANUP‑001: Portal Session Cleanup
**Status:** ⏳ Not Started  
**Depends on:** DB‑PORTAL‑002 (has `magic_link_hash` with expiry).  
**Blocks:** Long-term portal data hygiene.  
**Definition of Done:**  
- Background job or scheduled task to purge expired `magic_link_hash` rows from `portal_magic_links` table.  
- Configurable cleanup window (default: delete links expired > 24 hours).  
- Safe cleanup: only deletes rows where `expires_at` < NOW() - cleanup_window.  
- Logging: records count of cleaned rows per run for monitoring.  
- Error handling: continues cleanup even if individual deletions fail.  
- Environment variable: `PORTAL_CLEANUP_HOURS` (default: 24).  
- Unit tests for cleanup logic with expired and non‑expired links.  
- Integration test with real database cleanup.

**Implementation Options:**
- **Option A:** Scheduled job using node-cron (runs every 6 hours).  
- **Option B:** Manual CLI command `pnpm cleanup:portal-sessions`.  
- **Option C:** Database trigger/function for automatic cleanup.

**Subtasks:**
- [ ] PORTAL‑CLEANUP‑001.1: Choose implementation approach and create cleanup service. (AGENT) – `services/portal/session-cleanup.ts`  
  **verification:** Service logic unit tests pass.
- [ ] PORTAL‑CLEANUP‑001.2: Implement scheduled job or CLI command. (AGENT)  
  **verification:** Cleanup runs successfully.
- [ ] PORTAL‑CLEANUP‑001.3: Add cleanup configuration and logging. (AGENT)  
  **verification:** Configurable cleanup window works.
- [ ] PORTAL‑CLEANUP‑001.4: Write unit and integration tests. (AGENT)  
  **verification:** All tests pass.
- [ ] PORTAL‑CLEANUP‑001.5: Document cleanup process and add to deployment checklist. (AGENT)  
  **verification:** Documentation complete.

---

## Analytics Context

### API‑ANALYTICS‑001 through API‑ANALYTICS‑004: Deferred to Phase 4b
**Reason:** These tasks currently lack sufficient detail (subtasks, verification commands, file paths). Will be fully specified in Phase 4b with proper task breakdown including:
- OpenAPI spec expansion with comprehensive analytics schemas
- Integration test coverage for complex query scenarios
- Service implementation with data aggregation logic
- Route implementation with proper admin authentication
- Performance considerations for large dataset queries

---

## System Configuration & Cross‑Cutting

### API‑SETTINGS‑001 through API‑SETTINGS‑004: Deferred to Phase 4b
**Reason:** Key‑value settings tasks need detailed specification including:
- Settings schema validation and type safety
- Caching strategy for frequently accessed settings
- Audit logging for configuration changes
- Environment-specific settings management
- Rollback capabilities for critical setting changes

### API‑AUDIT‑001 through API‑AUDIT‑004: Deferred to Phase 4b
**Reason:** Audit log query tasks require comprehensive specification covering:
- Complex filtering and pagination strategies
- Performance optimization for large audit datasets
- Data retention policies and archival procedures
- Export functionality (CSV, JSON)
- Real-time audit streaming capabilities
- Cross‑context event correlation

---

Now applying all corrections to **Phase 4.5 – API Business Logic: Appointments (Scheduling Context)**. This phase adds the Scheduling & Appointments bounded context (Calendly‑model), separate from Projects. The Projects Scheduler tab will eventually consume a read‑only projection from this service via an anti‑corruption layer. Every endpoint is built contract‑first and test‑first. The service encapsulates slot availability algorithms and state machine rules.

Key improvements integrated:

- **Explicit auth annotations** on each endpoint (firm JWT vs. portal client JWT) per correction 5.2.
- **Email reminders** – the service will inject `EmailServicePort` (from EMAIL‑SERVICE‑001) and send confirmation/cancellation emails (as a placeholder for real notifications).
- **Negative integration tests** with domain error codes (`TimeSlotNotAvailable`, `BookingRuleViolation`, `InvalidAppointmentStatusTransition`).
- **Depth refactor check** for `AppointmentService`.
- **Anti‑corruption layer** (`API‑APPT‑005`) that exposes a read‑only projection for the Projects Scheduler tab.
- **Verification commands** on every subtask.
- **`depends_on`** chains linking to DB‑APPT tables, PORTAL‑AUTH‑001, and EMAIL‑SERVICE‑001.

---

# Phase 4.5 – API Business Logic: Appointments (Scheduling Context)

---

## Phase 4.5 Task Index

- [ ] API‑APPT‑001 – Appointments – Expand OpenAPI Spec  
- [ ] API‑APPT‑002 – Appointments – Integration Tests (TDD Red)  
- [ ] API‑APPT‑003 – Appointments – Service & Repository (Deep Module)  
- [ ] API‑APPT‑004 – Appointments – Routes & Green Tests  
- [ ] API‑APPT‑005 – ProjectSchedulerService – Anti‑Corruption Layer  

---

## Appointments Endpoints

### API‑APPT‑001: Appointments – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑APPT‑001, DB‑APPT‑002, DB‑APPT‑003, DOMAIN‑003 (appointments feature file).  
**Definition of Done:** OpenAPI spec adds `appointments` tag and paths, with **auth annotations** for each endpoint:

**Firm‑side (auth: firm JWT):**
- `GET /appointments` – list all appointments (filter by provider, status, date range). Pagination standard.
- `GET /appointments/{appointmentId}` – get by ID.
- `PATCH /appointments/{appointmentId}/confirm` – confirm appointment (firm only).
- `PATCH /appointments/{appointmentId}/cancel` – cancel with reason (firm side).
- `GET /appointments/availability‑windows` – list provider windows.
- `POST /appointments/availability‑windows` – create availability window.
- `GET /appointments/booking‑rules` – get org booking rules.
- `PUT /appointments/booking‑rules` – upsert org booking rules (single rule set per org).

**Client‑side (auth: portal JWT):**
- `GET /appointments/availability` – query available slots by provider, date range.
- `POST /appointments` – request a booking (client books their own appointment).

All request/response schemas (`Appointment`, `AppointmentCreate`, `AvailabilityWindow`, `BookingRule`). Examples required.  
**BDD:** Enables the scenarios from `appointments.feature` (book, cancel, confirm, etc.).

**Subtasks:**
- [ ] API‑APPT‑001.1: Add paths, schemas, and auth annotations to OpenAPI. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec contains all paths; `x-auth` notes or operationId prefixes (`firm-`, `client-`) make intent clear.
- [ ] API‑APPT‑001.2: Run `pnpm codegen` and `pnpm typecheck`. (HUMAN/AGENT)  
  **verification:** No type errors.

---

### API‑APPT‑002: Appointments – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑001, TEST‑INFRA‑001, DB‑MIGRATE‑ALL (availability windows and booking rules must exist in seed).  
**Definition of Done:** `artifacts/api‑server/__tests__/api/appointments/appointments.test.ts` contains failing tests for:

**Positive scenarios:**
- `GET /appointments/availability` → 200, returns available slots based on windows.
- `POST /appointments` (client) → 201, appointment created with `status: requested`.
- `PATCH /appointments/{id}/confirm` (firm) → 200, `status: confirmed`, email sent to client (via EmailService mock).
- `PATCH /appointments/{id}/cancel` with reason → 200, `status: cancelled`.

**Negative scenarios:**
- Book slot that is already taken → 409 `TimeSlotNotAvailable`.
- Book within minimum advance notice → 400 `BookingRuleViolation`.
- Cancel an already completed appointment → 400 `InvalidAppointmentStatusTransition`.
- Confirm a cancelled appointment → 400 `InvalidAppointmentStatusTransition`.
- Unauthorized: client tries to call firm‑side endpoint → 401/403.
- Missing provider or date range in query → 400.

**Subtasks:**
- [ ] API‑APPT‑002.1: Write all integration tests. (AGENT)  
  **verification:** Test suite compiles and runs, all red.

---

### API‑APPT‑003: Appointments – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL, ERROR‑002 (Appointments errors), EMAIL‑SERVICE‑001 (for notifications), REPO‑001 (base repository pattern).  
**Definition of Done:**
- `lib/db/src/repositories/appointments.ts` exports `AppointmentRepository` (extends `BaseRepository`, soft delete via `deleted_at`).
- `AppointmentService` (artifacts/api‑server/src/services/appointments/appointment‑service.ts) with methods:
  - `requestAppointment(dto)`: checks provider availability windows, applies booking rules (min notice, max advance, buffer times), ensures no overlap with existing confirmed appointments, creates appointment in `requested` status, emits `AppointmentRequested` event, and sends confirmation email to client (via `EmailServicePort`). Returns `Either<DomainError, Appointment>`.
  - `confirmAppointment(id)`: state machine `requested` → `confirmed`, emits `AppointmentConfirmed`, sends email.
  - `cancelAppointment(id, reason)`: state machine `*` → `cancelled` (except `completed`), emits `AppointmentCancelled`, sends email.
  - `getAvailableSlots(providerId, dateRange)`: computes open slots from availability windows minus confirmed appointments, factoring in buffer times and max appointments per window.
- All methods use `Either`; complex slot logic is internal.
- **Email integration:** The service receives `EmailServicePort` via constructor; sends transactional emails (using templates or simple text stubs).
- **Deep Module:** The interface is simple (4 methods) while hiding slot computation, rule validation, and event/email orchestration.

**Depth refactor check:** After implementation, verify public methods ≤ 5, internal logic ≥150 lines, all errors are Either.

**Subtasks:**
- [ ] API‑APPT‑003.1: Implement `AppointmentRepository`. (AGENT) – `lib/db/src/repositories/appointments.ts`  
  **verification:** Unit tests for repository green.
- [ ] API‑APPT‑003.2: Implement `AppointmentService` with state machine, slot availability algorithm, and email hooks. (AGENT)  
  **verification:** Unit tests with mocked repo, event bus, and email port pass.
- [ ] API‑APPT‑003.3: Write unit tests for `AppointmentService` (mocked): happy paths, slot conflict, rule violation, state transitions, email calls. (AGENT)  
  **verification:** Green.
- [ ] API‑APPT‑003.4: Depth refactor check. (AGENT)  
  **verification:** Count lines, check no throw, `pnpm typecheck`.

---

### API‑APPT‑004: Appointments – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑003, AUTH‑008 (firm middleware), PORTAL‑AUTH‑001 (portal middleware).  
**Definition of Done:** Routes split into firm‑auth and portal‑auth groups, wired to service. Integration tests from API‑APPT‑002 go green.

**Subtasks:**
- [ ] API‑APPT‑004.1: Create routes with appropriate middleware. (AGENT) – `routes/appointments.ts`  
  **verification:** Route tests with supertest and mocked service pass.
- [ ] API‑APPT‑004.2: Run integration tests, fix, and turn green. (AGENT)  
  **verification:** `pnpm test -- appointments.test.ts` all green.

---

### API‑APPT‑005: ProjectSchedulerService – Anti‑Corruption Layer
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑003 (AppointmentService exists), ARCH‑002 (ACL design).  
**Definition of Done:**
- `artifacts/api‑server/src/services/projects/project‑scheduler‑service.ts` exports `ProjectSchedulerService`.
- Implements read‑only projection from AppointmentService into Projects context.
- `getProjectSchedule(projectId)`: returns `ScheduleItem[]` (appointments mapped with minimal information: id, start, end, status, client name). The projects context never sees raw appointment data; only this projection.
- **No write operations** – Projects calls cannot create or modify appointments.
- `AppointmentServicePort` interface defines the contract between the two contexts; `ProjectSchedulerService` depends on this port, not the concrete `AppointmentService`.
- Unit tests with mocked `AppointmentServicePort` verify mapping.

**DDD:** This is the anti‑corruption layer: Projects context remains clean, only consuming a narrow, stable interface.  
**Deep Module:** The ACL is shallow (a mapper), but enforces the boundary.

**Subtasks:**
- [ ] API‑APPT‑005.1: Define `AppointmentServicePort` interface. (AGENT)  
  **verification:** `pnpm typecheck`.
- [ ] API‑APPT‑005.2: Implement `ProjectSchedulerService`. (AGENT)  
  **verification:** Unit test with mock port passes.
- [ ] API‑APPT‑005.3: Write unit test verifying that only specified fields are included and no write methods exist. (AGENT)  
  **verification:** Green.

---

*End of Phase 4. Next: Phase 4.5 – Appointments API (Scheduling context) and Phase 5 – Frontend Data Integration.*