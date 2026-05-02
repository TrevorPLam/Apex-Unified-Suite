# TODO-P4-DOCUMENTS.md – Phase 4 Documents Context

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the complete Documents context with ShareFile‑inspired features: document management, folders, request lists, approval workflows, feedback and annotation, version comparison, secure share links, retention policies, advanced e‑sign, and infrastructure for previews, chunked upload, and OCR.

---

## Documents Context

### [ ] DOC‑STORAGE‑001: File Storage Adapter (Cloudflare R2)
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

### [ ] API‑DOCS‑001: Documents – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑002, DOC‑STORAGE‑001 (for interface knowledge).  
**Definition of Done:** OpenAPI spec adds `documents` tag and paths with `/api/v1/` prefix:  
- `GET /api/v1/documents` – list with pagination, folder filter, search.  
- `POST /api/v1/documents` – create metadata record (without file content).  
- `GET /api/v1/documents/{documentId}` – metadata + `signed_download_url` (presigned, 15‑minute expiry).  
- `POST /api/v1/documents/upload` – multipart/form‑data upload (file + metadata). Returns document metadata with `signed_download_url`.  
- `PATCH /api/v1/documents/{documentId}` – update name, folder, version bumps on content change.  
- `DELETE /api/v1/documents/{documentId}` – soft delete (also deletes from storage).  
Schemas: `Document`, `DocumentCreate`, `DocumentUpdate`. Examples for all.

**Subtasks:** spec, codegen, typecheck.

---

### [ ] API‑DOCS‑002: Documents – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑001, TEST‑INFRA‑001.  
**Tests include:**
- Upload a file → 201, document metadata with `storage_path`, version=1.
- Get document → 200 with `signed_download_url`.
- Update document (new file) → version increments to 2.
- Soft delete → 204, subsequent GET → 404.
- Attempt to upload without file → 400.
- File not found → 404 `DocumentNotFound`.

---

### [ ] API‑DOCS‑003: Documents – Service & Repository (Deep Module)
**Status:** ⏳ Not Started  
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

### [ ] API‑DOCS‑004: Documents – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑003, AUTH‑008.  
**Subtasks:** routes, integration tests green.

---

### [ ] API‑DOCS‑005: Folders – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑001.  
**Definition of Done:** Folder CRUD endpoints: `GET /api/v1/folders`, `POST`, `GET /{folderId}`, `PATCH`, `DELETE` (soft delete, blocks if folder has children). Pagination, tree view option. Examples.

---

### [ ] API‑DOCS‑006: Folders – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑005, TEST‑INFRA‑001.  
**Tests include:** create folder, list tree, update name, delete empty folder → 204, delete folder with children → 400.

---

### [ ] API‑DOCS‑007: Folders – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `FolderRepository` and `FolderService` with tree management, child detection for delete protection. Either returns.

---

### [ ] API‑DOCS‑008: Folders – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑007.  
**Subtasks:** routes, tests green.

---

### [ ] API‑DOCS‑009: Document Request List API
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑003, API‑DOCS‑004.  
**Definition of Done:** Document collection request endpoints:  
- `GET /api/v1/document‑requests` – list request lists with pagination, filter by status.  
- `POST /api/v1/document‑requests` – create a new request list with items. Body: `{ name, description?, due_date?, items: [{ document_name, required }] }`.  
- `GET /api/v1/document‑requests/{requestId}` – detail with items and their submission status.  
- `PATCH /api/v1/document‑requests/{requestId}` – update name, due date, status.  
- `PATCH /api/v1/document‑requests/{requestId}/items/{itemId}` – update item (e.g., mark as reviewed).  
- `POST /api/v1/document‑requests/{requestId}/send‑reminder` – trigger reminder email to client.  
- `DELETE /api/v1/document‑requests/{requestId}` – archive.  
Emits `DocumentRequestCreated`, `DocumentRequestItemSubmitted` events.  
**DDD:** ShareFile document collection feature for gathering files from clients.  
**TDD:** Write integration tests for full lifecycle.

### Subtasks:
- [ ] API‑DOCS‑009.1: Add document request paths to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑DOCS‑009.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑009.3: Implement `DocumentRequestService` and repository. (AGENT)  
- [ ] API‑DOCS‑009.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑010: Document Approval Workflow API
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑004, API‑DOCS‑004.  
**Definition of Done:** Multi‑step document approval endpoints:  
- `POST /api/v1/documents/{documentId}/submit‑for‑approval` – initiate approval workflow. Body: `{ approvers: [{ user_id, order }] }`. Returns workflow ID.  
- `GET /api/v1/documents/{documentId}/approval‑workflow` – get current workflow status with all approver responses.  
- `POST /api/v1/documents/{documentId}/approval‑workflow/approve` – approve current step. Body: `{ comment? }`.  
- `POST /api/v1/documents/{documentId}/approval‑workflow/reject` – reject with required comment.  
- `POST /api/v1/documents/{documentId}/approval‑workflow/comment` – add a comment without approving or rejecting.  
Status transitions: pending → in_progress → approved/rejected.  
Emits `WorkflowSubmitted`, `WorkflowStepApproved`, `WorkflowApproved`, `WorkflowRejected` events.  
**DDD:** ShareFile approval workflows for document collaboration.  
**Deep Module:** Encapsulates sequential approval logic and notification triggers.

### Subtasks:
- [ ] API‑DOCS‑010.1: Add approval workflow paths to OpenAPI. (AGENT)  
- [ ] API‑DOCS‑010.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑010.3: Implement `ApprovalWorkflowService` with step management. (AGENT)  
- [ ] API‑DOCS‑010.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑011: Document Feedback & Annotation API
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑004, API‑DOCS‑004.  
**Definition of Done:** Annotation and feedback endpoints for documents:  
- `GET /api/v1/documents/{documentId}/annotations` – list all annotations, filter by section, by user.  
- `POST /api/v1/documents/{documentId}/annotations` – create annotation. Body: `{ section_id, content, annotation_type (comment/highlight/suggestion), position_data_json? }`.  
- `PATCH /api/v1/documents/{documentId}/annotations/{annotationId}` – update annotation content.  
- `DELETE /api/v1/documents/{documentId}/annotations/{annotationId}` – soft delete annotation.  
- `POST /api/v1/documents/{documentId}/annotations/{annotationId}/reply` – threaded reply to an annotation.  
Emits `AnnotationCreated`, `AnnotationResolved` events.  
**DDD:** ShareFile collaborative document review with in‑context annotations.  
**Deep Module:** Encapsulates annotation threading and section mapping.

### Subtasks:
- [ ] API‑DOCS‑011.1: Add annotation/feedback paths to OpenAPI. (AGENT)  
- [ ] API‑DOCS‑011.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑011.3: Implement `DocumentAnnotationService` and repository. (AGENT)  
- [ ] API‑DOCS‑011.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑012: Document Version Comparison
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑004 (documents with versions).  
**Definition of Done:** Version comparison endpoint:  
- `GET /api/v1/documents/{documentId}/diff?versionFrom=1&versionTo=2` – returns diff data between two versions of a document. Response includes: additions, deletions, modifications highlighted with section/page references.  
- `GET /api/v1/documents/{documentId}/versions` – list all versions with metadata (version number, changed by, timestamp, size change).  
- `POST /api/v1/documents/{documentId}/versions/{versionId}/restore` – restore a previous version as the current version (creates a new version).  
**DDD:** ShareFile version navigation and comparison.  
**Integration tests:** compare versions, list versions, restore previous version.

### Subtasks:
- [ ] API‑DOCS‑012.1: Add version comparison paths to OpenAPI. (AGENT)  
- [ ] API‑DOCS‑012.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑012.3: Implement `DocumentVersionService` with diff logic (may delegate to a diff library or external service). (AGENT)  
- [ ] API‑DOCS‑012.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑013: Secure Share Link API
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑005, API‑DOCS‑004.  
**Definition of Done:** Secure sharing endpoints:  
- `GET /api/v1/share‑links` – list active share links created by the user, with usage stats.  
- `POST /api/v1/documents/{documentId}/share‑link` – generate a secure share link. Body: `{ password?, expires_at?, max_downloads?, recipient_verification_required (bool) }`. Returns `{ link_url, link_token }`.  
- `GET /api/v1/share‑links/{linkToken}` – get link details (status, usage count, expiry).  
- `PATCH /api/v1/share‑links/{linkToken}` – update password, expiry, or max downloads.  
- `DELETE /api/v1/share‑links/{linkToken}` – revoke a share link.  
- `GET /api/v1/share‑links/{linkToken}/access‑log` – view access log entries.  
- **Public endpoint (no auth):** `POST /api/v1/shared/{linkToken}/access` – verify password (if required), log access, and return a temporary download token. Body: `{ password?, recipient_name?, recipient_email? }`.  
Emits `ShareLinkCreated`, `ShareLinkAccessed`, `ShareLinkRevoked` events.  
**DDD:** ShareFile secure file sharing without requiring account login.  
**Deep Module:** Encapsulates link generation, password verification, access logging, and expiry management.

### Subtasks:
- [ ] API‑DOCS‑013.1: Add share link paths to OpenAPI (public and authenticated). (AGENT)  
- [ ] API‑DOCS‑013.2: Write integration tests including public access flow. (AGENT)  
- [ ] API‑DOCS‑013.3: Implement `ShareLinkService` with security and access tracking. (AGENT)  
- [ ] API‑DOCS‑013.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑014: File Retention Policy API
**Status:** ⏳ Not Started  
**Depends on:** DB‑DOCS‑006, API‑DOCS‑008 (folders).  
**Definition of Done:** Retention policy management endpoints:  
- `GET /api/v1/folders/{folderId}/retention‑policy` – get current retention policy.  
- `PUT /api/v1/folders/{folderId}/retention‑policy` – create or update policy. Body: `{ delete_after_days, is_inheritable, override_allowed }`.  
- `DELETE /api/v1/folders/{folderId}/retention‑policy` – remove policy.  
- `GET /api/v1/folders/{folderId}/retention‑status` – preview which files would be affected by the current policy.  
- `POST /api/v1/retention‑policies/enforce` – manually trigger enforcement (admin only).  
Emits `RetentionPolicyUpdated`, `RetentionEnforced` events.  
**DDD:** ShareFile compliance and data lifecycle management.  
**Deep Module:** Encapsulates policy inheritance, enforcement logic, and preview calculations.

### Subtasks:
- [ ] API‑DOCS‑014.1: Add retention policy paths to OpenAPI. (AGENT)  
- [ ] API‑DOCS‑014.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑014.3: Implement `RetentionPolicyService` with inheritance and preview. (AGENT)  
- [ ] API‑DOCS‑014.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑015: Advanced E‑Sign API Enhancements
**Status:** ⏳ Not Started  
**Depends on:** DB‑ESIGN‑001 (expanded), API‑ESIGN‑002.  
**Definition of Done:** Extended e‑sign capabilities on top of the existing `API‑ESIGN‑001` / `API‑ESIGN‑002`:  
- Support `signing_order` (sequential/parallel) in signature request creation.  
- Support `signer_authentication_method` (email/sms/kba).  
- `POST /api/v1/documents/{documentId}/signature‑requests/bulk` – bulk send to multiple recipients via CSV upload or JSON array.  
- `PUT /api/v1/documents/{documentId}/signature‑requests/{requestId}/field‑positions` – update pre‑placed signature fields.  
- `GET /api/v1/documents/{documentId}/signature‑requests/{requestId}/certificate` – generate completion certificate.  
**Integration tests:** create request with sequential signing, bulk send, update field positions, retrieve certificate.  
**DDD:** ShareFile RightSignature depth within the existing e‑sign adapter.

### Subtasks:
- [ ] API‑DOCS‑015.1: Extend OpenAPI spec with advanced e‑sign fields and bulk endpoint. (AGENT)  
- [ ] API‑DOCS‑015.2: Write integration tests for new capabilities. (AGENT)  
- [ ] API‑DOCS‑015.3: Extend `ESignService` with signing order, authentication, bulk send. (AGENT)  
- [ ] API‑DOCS‑015.4: Run all e‑sign tests to green. (AGENT)

---

## Document Infrastructure

### [ ] DOC‑INFRA‑001: Document Preview / Thumbnail Generation
**Status:** ⏳ Not Started  
**Depends on:** DOC‑STORAGE‑001, API‑DOCS‑004.  
**Definition of Done:** Server‑side preview generation service:  
- `POST /api/v1/documents/{documentId}/preview` – trigger preview generation for a document.  
- `GET /api/v1/documents/{documentId}/preview` – returns preview image URLs or thumbnails.  
- Support for common file types: PDF (first page image), images (resized thumbnail), Office documents (via conversion).  
- Preview metadata stored alongside the document (e.g., `preview_urls_json`).  
- Async generation via background job or on‑demand with caching.  
**Integration tests:** upload PDF, request preview, verify thumbnail generated.  
**DDD:** Browser preview capability (ShareFile).

### Subtasks:
- [ ] DOC‑INFRA‑001.1: Implement preview generation service (stubbed for complex types). (AGENT)  
- [ ] DOC‑INFRA‑001.2: Add preview endpoints and integrate with document response. (AGENT)  
- [ ] DOC‑INFRA‑001.3: Write integration tests. (AGENT)

---

### [ ] DOC‑INFRA‑002: Chunked Upload for Large Files
**Status:** ⏳ Not Started  
**Depends on:** DOC‑STORAGE‑001.  
**Definition of Done:** Resumable chunked upload endpoint:  
- `POST /api/v1/documents/upload/init` – initialise a multipart upload. Body: `{ filename, total_size, content_type }`. Returns upload session ID.  
- `POST /api/v1/documents/upload/{sessionId}/chunk` – upload a chunk. Headers: `Content-Range: bytes X-Y/Z`. Returns progress or completion status.  
- `POST /api/v1/documents/upload/{sessionId}/complete` – finalise upload, create document record.  
- `POST /api/v1/documents/upload/{sessionId}/abort` – cancel and clean up.  
- Progress tracking: `GET /api/v1/documents/upload/{sessionId}/progress`.  
- Support for files up to 5GB.  
**Integration tests:** upload file in chunks, verify reassembled correctly, abort mid‑upload.  
**DDD:** Infrastructure for handling large files (ShareFile supports up to 100GB).

### Subtasks:
- [ ] DOC‑INFRA‑002.1: Implement chunked upload service with session management. (AGENT)  
- [ ] DOC‑INFRA‑002.2: Add chunked upload endpoints to OpenAPI. (AGENT)  
- [ ] DOC‑INFRA‑002.3: Write integration tests for full chunked flow. (AGENT)

---

### [ ] DOC‑INFRA‑003: OCR Text Extraction for Uploaded Documents
**Status:** ⏳ Not Started  
**Depends on:** DOC‑STORAGE‑001, API‑DOCS‑004.  
**Definition of Done:** OCR extraction service:  
- `POST /api/v1/documents/{documentId}/ocr` – trigger OCR text extraction (async).  
- `GET /api/v1/documents/{documentId}/ocr‑text` – retrieve extracted text.  
- Extraction triggered automatically on upload for image‑based files (PDFs, images).  
- Extracted text stored alongside the document and used for full‑text search indexing.  
- Initial implementation: stub that extracts basic metadata or uses a third‑party OCR API; full local OCR deferred.  
**Integration tests:** upload image‑based document, verify OCR text appears.  
**DDD:** Content searchability (ShareFile feature).

### Subtasks:
- [ ] DOC‑INFRA‑003.1: Implement OCR service with stub or third‑party integration. (AGENT)  
- [ ] DOC‑INFRA‑003.2: Add OCR endpoints and auto‑trigger on document upload. (AGENT)  
- [ ] DOC‑INFRA‑003.3: Write integration tests. (AGENT)

---

## E‑Sign Integration

### [ ] API‑ESIGN‑001: E‑Sign – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Depends on:** DB‑ESIGN‑001.  
**Definition of Done:**  
- `POST /documents/{documentId}/signature‑requests` – send for signature (body: `{ signers: [{ email, name, role, order? }], signing_order?, signer_authentication_method? }`).  
- `GET /documents/{documentId}/signature‑requests/{requestId}` – status.  
- `DELETE /documents/{documentId}/signature‑requests/{requestId}` – void request.  
- `GET /signature‑requests/{requestId}/certificate` – completion certificate.  
Examples included.

---

### [ ] API‑ESIGN‑002: E‑Sign – Integration Tests & Service
**Status:** ⏳ Not Started  
**Depends on:** API‑ESIGN‑001, TEST‑INFRA‑001.  
**Service:** `ESignService` with constructor injection of `ESignProviderPort` (SignWellClient stub). `sendForSignature` calls provider, stores `external_request_id` and initial status; `getSignatureStatus` updates local status; `voidRequest` voids. Emits `DocumentSentForSignature` event.  
**Integration tests:** create signature request → 201; retrieve → 200 with status; void → 200; non‑existent document → 404.

---

### [ ] API‑ESIGN‑003: E‑Sign – Webhook Handler (Expanded)
**Status:** ⏳ Not Started  
**Depends on:** API‑ESIGN‑002, DB‑ESIGN‑001.  
**Definition of Done:**  
- `POST /webhooks/esign` – public endpoint to receive SignWell webhook callbacks.  
- HMAC signature verification using `ESIGN_WEBHOOK_SECRET` environment variable.  
- Webhook payload processing: updates signature request status based on SignWell events (`signed`, `declined`, `expired`, `signer_authenticated`, `signing_order_completed`).  
- Emits `DocumentSigned`, `SignatureDeclined`, `SigningOrderCompleted` domain events.  
- Idempotency: processes each webhook ID only once by checking `processed_webhooks` table before processing (see DB‑ESIGN‑002).  
- Returns 200 for successful processing, 400 for invalid signatures, 500 for processing errors.  
- Unit tests for webhook signature verification and payload processing.  
- Integration test with simulated SignWell webhook payloads for each event type.

### Subtasks:
- [ ] API‑ESIGN‑003.1: Add webhook endpoint to OpenAPI spec. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Codegen passes.
- [ ] API‑ESIGN‑003.2: Implement webhook signature verification utility. (AGENT) – `lib/esign/webhook‑verifier.ts`  
  **verification:** Unit tests pass.
- [ ] API‑ESIGN‑003.3: Implement webhook handler route with expanded event processing. (AGENT) – `routes/esign‑webhooks.ts`  
  **verification:** Route processes test payload correctly.
- [ ] API‑ESIGN‑003.4: Add idempotency handling for webhook processing. (AGENT)  
  **verification:** Duplicate webhook IDs are ignored.
- [ ] API‑ESIGN‑003.5: Write integration tests for all webhook event types. (AGENT)  
  **verification:** End‑to‑end webhook processing works.

---

### [ ] API‑ESIGN‑004: E‑Sign – Concrete Adapter Implementation
**Status:** ⏳ Not Started  
**Depends on:** API‑ESIGN‑002 (service interface defined).  
**Blocks:** Production‑ready e‑sign functionality.  
**Definition of Done:**  
- `artifacts/api-server/src/lib/esign/signwell-adapter.ts` implements `ESignProviderPort` using real SignWell HTTP API.  
- HTTP client with retry logic, exponential backoff, and proper error mapping.  
- Configuration via environment variables: `SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL` (default: https://api.signwell.com).  
- Request/response mapping to/from internal domain models.  
- Rate limiting handling and API quota management.  
- Comprehensive error handling with mapping to domain errors (`ESignProviderUnavailable`, `InvalidSigner`, `DocumentAlreadySigned`, `BulkSendLimitExceeded`).  
- Unit tests with mocked HTTP responses covering success cases, API errors, network failures, rate limits, and bulk send scenarios.  
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

## Progress Tracking

### Overall Status
**Documents Context:** [ ] 0/23 parent tasks complete

### Context Breakdown
- **Storage Foundation:** [ ] 0/1 complete
- **Document CRUD:** [ ] 0/4 complete  
- **Folder Management:** [ ] 0/4 complete
- **Document Workflows:** [ ] 0/6 complete (requests, approval, annotations, versions, sharing, retention)
- **E‑Sign Integration:** [ ] 0/4 complete
- **Document Infrastructure:** [ ] 0/3 complete (previews, chunked upload, OCR)

### Dependencies
- **STORAGE-001** enables all document storage operations
- **DOC-STORAGE-001** enables document upload/download functionality
- **EMAIL-SERVICE-001** enables document request notifications
- **DB-MIGRATE-ALL** enables all document database operations

### Next Actions
- [ ] Start DOC-STORAGE-001.1: Create StorageAdapter interface
- [ ] Start API-DOCS-001.1: Add documents paths to OpenAPI
- [ ] Start API-DOCS-005.1: Add folders paths to OpenAPI

### Verification Commands
```bash
# Storage verification
pnpm test -- storage-adapter
pnpm typecheck

# Documents CRUD verification
pnpm test -- documents
pnpm typecheck

# Folders verification
pnpm test -- folders
pnpm typecheck

# E-Sign verification
pnpm test -- esign
pnpm typecheck

# Infrastructure verification
pnpm test -- doc-infra
pnpm typecheck
```

---

## File Index

### Storage Foundation
- `artifacts/api-server/src/lib/storage/base-storage.ts` - Base interfaces (from STORAGE-001)
- `artifacts/api-server/src/lib/storage/storage-adapter.ts` - StorageAdapter interface
- `artifacts/api-server/src/lib/storage/r2-adapter.ts` - Cloudflare R2 implementation

### Document CRUD
- `artifacts/api-server/src/services/documents/document-service.ts` - Document service
- `lib/db/src/repositories/documents.ts` - Document repository
- `routes/documents.ts` - Document routes

### Folder Management
- `artifacts/api-server/src/services/documents/folder-service.ts` - Folder service
- `lib/db/src/repositories/folders.ts` - Folder repository
- `routes/folders.ts` - Folder routes

### Document Workflows
- `artifacts/api-server/src/services/documents/document-request-service.ts` - Request lists
- `artifacts/api-server/src/services/documents/approval-workflow-service.ts` - Approval workflows
- `artifacts/api-server/src/services/documents/annotation-service.ts` - Annotations
- `artifacts/api-server/src/services/documents/version-service.ts` - Version comparison
- `artifacts/api-server/src/services/documents/share-link-service.ts` - Secure sharing
- `artifacts/api-server/src/services/documents/retention-service.ts` - Retention policies

### E-Sign Integration
- `artifacts/api-server/src/lib/esign/signwell-adapter.ts` - SignWell adapter
- `artifacts/api-server/src/lib/esign/webhook-verifier.ts` - Webhook verification
- `routes/esign-webhooks.ts` - E-sign webhook handler
- `artifacts/api-server/src/services/documents/esign-service.ts` - E-sign service

### Document Infrastructure
- `artifacts/api-server/src/services/documents/preview-service.ts` - Preview generation
- `artifacts/api-server/src/services/documents/chunked-upload-service.ts` - Chunked uploads
- `artifacts/api-server/src/services/documents/ocr-service.ts` - OCR extraction
