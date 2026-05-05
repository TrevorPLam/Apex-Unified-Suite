# TODO-P4-DOCUMENTS.md – Phase 4 Documents Context



This file covers the complete Documents context: file storage adapter (Cloudflare R2), CRUD, folder management, request lists, approval workflows, feedback/annotation, version comparison, secure share links, retention policies, advanced e-sign, preview generation, chunked upload, and OCR.

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
**Advanced Code Patterns:** Interface segregation, dependency injection, proper error handling.  
**Anti-Patterns:** Avoid hardcoded credentials, prevent synchronous file operations.  
**Rules to Follow:** Always validate inputs, implement retry logic, handle network failures gracefully.  
**Out of Scope:** File compression, content transformation.  
**Verification:** `pnpm test -- storage-adapter && pnpm typecheck`

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
**Advanced Code Patterns:** RESTful API design with proper HTTP status codes, consistent error responses.  
**Anti-Patterns:** Avoid nested resource paths, prevent inconsistent naming conventions.  
**Rules to Follow:** Use OpenAPI 3.0.3 specification, include examples for all schemas, maintain backward compatibility.  
**Out of Scope:** Document content editing, bulk operations beyond pagination.

**Subtasks:** spec, codegen, typecheck.

---

### [ ] API‑DOCS‑002: Documents – Integration Tests (TDD Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Write comprehensive TDD red-phase integration tests for document CRUD endpoints, covering all success scenarios, error conditions, version management, and storage integration following 2026 document management testing best practices.

**Depends on:** API‑DOCS‑001, TEST‑INFRA‑001.  
**Blocks:** API‑DOCS‑003 (service implementation).  
**Related Files:** `artifacts/api-server/__tests__/api/documents/documents.test.ts`, `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: `describe`, `test`, `expect` from Jest, `request` from supertest, document test fixtures, mock storage adapter
- Exports: [N/A] – test suite only

**Definition of Done**
- [ ] `artifacts/api-server/__tests__/api/documents/documents.test.ts` contains comprehensive failing tests for all document operations
- [ ] Tests cover success scenarios: upload file (201), get document (200 with signed URL), update document (200 with version increment), soft delete (204)
- [ ] Tests cover error scenarios: upload without file (400), file not found (404), unauthorized (401), storage errors (502)
- [ ] Tests verify version increment behavior on document updates
- [ ] Tests verify signed download URL generation with proper expiry
- [ ] Tests verify soft delete behavior (excluded from listings, 404 on direct access)
- [ ] All tests compile and run, currently failing (red phase) because routes don't exist yet
- [ ] Test coverage shows >90% for document functionality

**Out of Scope**
- Performance testing for large file uploads
- UI/e2e testing for document workflows
- Bulk document operations testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, test data with real document content
- Never mock the storage adapter integration – test full request/response cycle
- Never allow tests to create actual files in production storage

**Output Artifacts**
- Tests added/updated in: `artifacts/api-server/__tests__/api/documents/documents.test.ts`
- Test fixtures: `artifacts/api-server/__tests__/fixtures/documents.ts`
- Mock storage adapter: `artifacts/api-server/__tests__/mocks/storage-adapter.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – entire test file can be reverted if test design is flawed
- Halt condition: if tests inadvertently pass due to existing routes – redesign test cases to ensure proper red phase

**Rules to Follow**
- All tests must fail before implementation (TDD red phase)
- Test all storage integration scenarios
- Test version increment behavior
- Test signed URL generation and expiry
- Test authentication and authorization
- Test file type validation

**Verification**
```bash
# Run tests (should fail - red phase)
pnpm --filter @workspace/api-server test -- documents.test.ts

# Verify test coverage
pnpm --filter @workspace/api-server test:coverage -- documents.test.ts

# Ensure tests compile
pnpm --filter @workspace/api-server typecheck
```

**Advanced Code Patterns**
- TDD red-green-refactor cycle
- Integration test design with full HTTP cycle
- Mock storage adapter for controlled testing
- File upload testing with multipart/form-data
- Signed URL testing with expiry validation

**Anti-Patterns**
- Missing storage integration tests
- Testing against mock HTTP layer
- Shared test state between cases
- Missing version increment testing
- Incomplete error scenario testing

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tests verify Document aggregate behavior through API contract, ensuring storage coordination
- TDD: Red-Green-Refactor cycle ensures tests drive implementation
- BDD: "As a user, I can upload, view, update, and delete documents with proper version control" scenarios
- Deep Module: Tests verify Document service encapsulation of storage operations and version management

**Test Scenarios Include:**
- Upload file → 201, document metadata with `storage_path`, version=1
- Get document → 200 with `signed_download_url` (15-minute expiry)
- Update document (new file) → version increments to 2, new storage path
- Soft delete → 204, subsequent GET → 404
- Upload without file → 400 `FileRequired`
- File not found → 404 `DocumentNotFound`
- Unauthorized access → 401
- Storage backend unavailable → 502 `StorageBackendUnavailable`

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
**Deep Module:** Encapsulates versioning, storage abstraction, and event publishing with clear boundaries.  
**Advanced Code Patterns:** Dependency injection, error handling with Either pattern, event-driven architecture.  
**Anti-Patterns:** Avoid tight coupling to storage implementation, prevent synchronous file operations.  
**Rules to Follow:** Always validate inputs, use proper error handling, emit domain events for state changes.  
**Out of Scope:** Document content transformation, real-time collaboration.  
**Depth refactor check** completed: Service maintains single responsibility, clear separation from storage concerns.

---

### [ ] API‑DOCS‑004: Documents – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑003, AUTH‑008.  
**Subtasks:** routes, integration tests green.

---

### [ ] API‑DOCS‑005: Folders – Expand OpenAPI Spec
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Design and specify folder management endpoints following hierarchical data patterns with tree traversal, child validation, and proper deletion protection consistent with enterprise document organization systems.

**Depends on:** DB‑DOCS‑001.  
**Blocks:** API‑DOCS‑006 (integration tests).  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/documents/folder-service.ts`

**Imports / Exports**
- Imports: [N/A] – OpenAPI specification only
- Exports: Folder management API contract for code generation

**Definition of Done**
- [ ] OpenAPI spec adds folders tag and paths with `/api/v1/` prefix
- [ ] `GET /api/v1/folders` endpoint returns paginated folder list with optional tree view parameter
- [ ] `POST /api/v1/folders` endpoint creates folder with parent validation, returns 201 with Location header
- [ ] `GET /api/v1/folders/{folderId}` endpoint returns folder details with optional children tree
- [ ] `PATCH /api/v1/folders/{folderId}` endpoint updates folder name and parent with validation
- [ ] `DELETE /api/v1/folders/{folderId}` endpoint performs soft delete with child validation (400 if has children)
- [ ] Schemas defined: `Folder`, `FolderCreate`, `FolderUpdate`, `FolderTree`, `FolderListResponse`
- [ ] All endpoints include proper error responses (409 for circular reference, 400 for invalid parent, 404 for not found)
- [ ] Examples included for all request/response patterns
- [ ] Tree view option supports hierarchical display with nested children

**Out of Scope**
- Folder permissions and access control
- Folder sharing and collaboration
- Folder-level retention policies
- Bulk folder operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow folder deletion with child folders (protect against data loss)
- Never allow circular parent references (prevent infinite loops)

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated types in: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OpenAPI spec changes can be reverted
- Halt condition: if generated types contain errors or breaking changes – review spec design

**Rules to Follow**
- Folder hierarchy must be validated (no circular references)
- Delete protection for folders with children
- Tree view must support reasonable depth limits
- Pagination required for flat folder listings
- Parent validation for folder moves

**Verification**
```bash
# Validate OpenAPI spec
pnpm --filter @workspace/api-spec run validate

# Generate types and check for errors
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck

# Verify examples render in Swagger UI
pnpm --filter @workspace/api-server dev
# Navigate to /docs and test all examples
```

**Advanced Code Patterns**
- Hierarchical data modeling
- Tree traversal algorithms
- Circular reference detection
- Parent-child relationship validation
- Recursive deletion protection

**Anti-Patterns**
- Missing circular reference validation
- Allowing deletion of folders with children
- Infinite recursion in tree operations
- Missing parent validation
- Inconsistent folder hierarchy handling

**DDD / TDD / BDD / Deep Module notes**
- DDD: Folder is a separate aggregate with hierarchical behavior; delete protection is a business rule
- TDD: Integration tests (API-DOCS-006) will verify hierarchy validation and delete protection
- BDD: Enables "As a user, I can organize documents in folders with proper hierarchy and protection against accidental deletion" scenarios
- Deep Module: Folder service will encapsulate tree traversal complexity and validation logic

---

### [ ] API‑DOCS‑006: Folders – Integration Tests (Red)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Medium  

**Description** Write comprehensive TDD red-phase integration tests for folder management endpoints, covering all success scenarios, error conditions, hierarchy validation, and delete protection following enterprise folder management testing patterns.

**Depends on:** API‑DOCS‑005, TEST‑INFRA‑001.  
**Blocks:** API‑DOCS‑007 (service implementation).  
**Related Files:** `artifacts/api-server/__tests__/api/documents/folders.test.ts`, `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: `describe`, `test`, `expect` from Jest, `request` from supertest, folder test fixtures
- Exports: [N/A] – test suite only

**Definition of Done**
- [ ] `artifacts/api-server/__tests__/api/documents/folders.test.ts` contains comprehensive failing tests for all folder operations
- [ ] Tests cover success scenarios: create folder (201), list folders (200 with pagination), get folder details (200), update folder (200), delete empty folder (204)
- [ ] Tests cover error scenarios: create folder with invalid parent (400), delete folder with children (400), circular reference (409), folder not found (404)
- [ ] Tests verify tree view functionality with proper hierarchical structure
- [ ] Tests verify delete protection for folders containing subfolders or documents
- [ ] Tests verify circular reference detection in parent assignments
- [ ] All tests compile and run, currently failing (red phase) because routes don't exist yet
- [ ] Test coverage shows >90% for folder functionality

**Out of Scope**
- Performance testing for deep folder hierarchies
- UI/e2e testing for folder navigation
- Bulk folder operations testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, test data with real folder structures
- Never mock the hierarchy validation logic – test full request/response cycle
- Never allow tests to create actual folder structures in production database

**Output Artifacts**
- Tests added/updated in: `artifacts/api-server/__tests__/api/documents/folders.test.ts`
- Test fixtures: `artifacts/api-server/__tests__/fixtures/folders.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – entire test file can be reverted if test design is flawed
- Halt condition: if tests inadvertently pass due to existing routes – redesign test cases to ensure proper red phase

**Rules to Follow**
- All tests must fail before implementation (TDD red phase)
- Test all hierarchy validation scenarios
- Test delete protection behavior
- Test circular reference detection
- Test tree view functionality
- Test parent validation rules

**Verification**
```bash
# Run tests (should fail - red phase)
pnpm --filter @workspace/api-server test -- folders.test.ts

# Verify test coverage
pnpm --filter @workspace/api-server test:coverage -- folders.test.ts

# Ensure tests compile
pnpm --filter @workspace/api-server typecheck
```

**Advanced Code Patterns**
- TDD red-green-refactor cycle
- Integration test design with hierarchical data
- Tree structure testing algorithms
- Circular reference detection testing
- Parent-child relationship validation

**Anti-Patterns**
- Missing hierarchy validation tests
- Testing against mock HTTP layer
- Shared test state between cases
- Missing delete protection tests
- Incomplete tree structure testing

**DDD / TDD / BDD / Deep Module notes**
- DDD: Tests verify Folder aggregate behavior and hierarchical business rules
- TDD: Red-Green-Refactor cycle ensures tests drive implementation
- BDD: "As a user, I can organize documents in folders with proper hierarchy and protection against accidental deletion" scenarios
- Deep Module: Tests verify Folder service encapsulation of tree operations and validation logic

**Test Scenarios Include:**
- Create folder → 201, folder with proper parent validation
- List folders → 200 with pagination and optional tree view
- Get folder details → 200 with hierarchical information
- Update folder name → 200 with parent validation
- Delete empty folder → 204, folder marked as deleted
- Delete folder with children → 400 `FolderHasChildren`
- Create circular reference → 409 `CircularReferenceDetected`
- Invalid parent folder → 400 `InvalidParentFolder`
- Folder not found → 404 `FolderNotFound`

---

### [ ] API‑DOCS‑007: Folders – Service & Repository
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL.  
**Definition of Done:** `FolderRepository` and `FolderService` with tree management, child detection for delete protection. Service returns Either<DomainError, Result> with proper error handling.  
**Advanced Code Patterns:** Tree traversal algorithms, recursive validation, proper error mapping.  
**Anti-Patterns:** Avoid infinite recursion, prevent orphaned folders.  
**Rules to Follow:** Validate folder hierarchy, maintain referential integrity.  
**Out of Scope:** Folder permissions, sharing folders.  
**Depth refactor check** completed: Repository handles data access, service manages business logic.

---

### [ ] API‑DOCS‑008: Folders – Routes & Green Tests
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑007.  
**Subtasks:** routes, tests green.

---

### [ ] API‑DOCS‑009: Document Request List API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Design and specify document request list endpoints for client document collection workflows with item tracking, reminder systems, and status management following enterprise client portal patterns.

**Depends on:** DB‑DOCS‑003, API‑DOCS‑004.  
**Blocks:** API‑DOCS‑010 (approval workflows).  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/documents/document-request-service.ts`

**Imports / Exports**
- Imports: [N/A] – OpenAPI specification only
- Exports: Document request API contract for code generation

**Definition of Done**
- [ ] OpenAPI spec adds document-requests tag and paths with `/api/v1/` prefix
- [ ] `GET /api/v1/document-requests` endpoint returns paginated request lists with status filtering
- [ ] `POST /api/v1/document-requests` endpoint creates request lists with multiple items, returns 201 with Location header
- [ ] `GET /api/v1/document-requests/{requestId}` endpoint returns detailed request with item submission status
- [ ] `PATCH /api/v1/document-requests/{requestId}` endpoint updates request metadata (name, due date, status)
- [ ] `PATCH /api/v1/document-requests/{requestId}/items/{itemId}` endpoint updates individual item status
- [ ] `POST /api/v1/document-requests/{requestId}/send-reminder` endpoint triggers client reminder emails
- [ ] `DELETE /api/v1/document-requests/{requestId}` endpoint archives request (soft delete)
- [ ] Schemas defined: `DocumentRequest`, `DocumentRequestCreate`, `DocumentRequestItem`, `DocumentRequestUpdate`
- [ ] All endpoints include proper error responses and validation
- [ ] Event emission for `DocumentRequestCreated`, `DocumentRequestItemSubmitted`

**Out of Scope**
- Bulk document request operations
- Document request templates
- Advanced reminder scheduling
- Client portal interface (handled separately)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow deletion of active requests with submitted documents
- Never allow reminder sending without proper email service integration

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated types in: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OpenAPI spec changes can be reverted
- Halt condition: if generated types contain errors or breaking changes – review spec design

**Rules to Follow**
- Request status transitions must be validated
- Item submission tracking must be atomic
- Reminder sending requires email service availability
- Archive requests should preserve submission history

**Verification**
```bash
# Validate OpenAPI spec
pnpm --filter @workspace/api-spec run validate

# Generate types and check for errors
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck

# Verify examples render in Swagger UI
pnpm --filter @workspace/api-server dev
# Navigate to /docs and test all examples
```

**Advanced Code Patterns**
- State machine pattern for request status transitions
- Event-driven architecture for reminder triggers
- Atomic item submission tracking
- Client notification workflows

**Anti-Patterns**
- Missing status transition validation
- Non-atomic item updates
- Missing event emission
- Inconsistent reminder scheduling

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document request is a separate aggregate with item collection and status workflow
- TDD: Integration tests cover full lifecycle from creation to archive
- BDD: "As a firm user, I can request documents from clients with tracking and reminders" scenarios
- Deep Module: Document request service encapsulates collection workflow and notification logic

**DDD:** ShareFile document collection feature for gathering files from clients with proper workflow tracking.  
**TDD:** Write integration tests for full lifecycle including item submission and reminder triggers.

### Subtasks:
- [ ] API‑DOCS‑009.1: Add document request paths to OpenAPI. (AGENT)  
  **verification:** Spec validates.
- [ ] API‑DOCS‑009.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑009.3: Implement `DocumentRequestService` and repository. (AGENT)  
- [ ] API‑DOCS‑009.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑010: Document Approval Workflow API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Design and specify multi-step document approval workflow endpoints with sequential approver management, state machine validation, and audit trail functionality following enterprise document approval patterns.

**Depends on:** DB‑DOCS‑004, API‑DOCS‑004.  
**Blocks:** API-DOCS-011 (annotations).  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/documents/approval-workflow-service.ts`

**Imports / Exports**
- Imports: [N/A] – OpenAPI specification only
- Exports: Approval workflow API contract for code generation

**Definition of Done**
- [ ] OpenAPI spec adds approval-workflow tag and paths with `/api/v1/` prefix
- [ ] `POST /api/v1/documents/{documentId}/submit-for-approval` endpoint initiates workflow with approvers list, returns 201 with workflow ID
- [ ] `GET /api/v1/documents/{documentId}/approval-workflow` endpoint returns workflow status with approver responses
- [ ] `POST /api/v1/documents/{documentId}/approval-workflow/approve` endpoint approves current step with optional comment
- [ ] `POST /api/v1/documents/{documentId}/approval-workflow/reject` endpoint rejects with required comment
- [ ] `POST /api/v1/documents/{documentId}/approval-workflow/comment` endpoint adds comment without decision
- [ ] Status transitions: pending → in_progress → approved/rejected with proper validation
- [ ] Schemas defined: `ApprovalWorkflow`, `WorkflowCreate`, `WorkflowResponse`, `ApproverResponse`
- [ ] All endpoints include proper error responses and approver validation
- [ ] Event emission for `WorkflowSubmitted`, `WorkflowStepApproved`, `WorkflowApproved`, `WorkflowRejected`

**Out of Scope**
- Parallel approval workflows
- Automatic approval based on conditions
- Delegation of approval authority
- Bulk approval operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow approval without proper permissions validation
- Never allow invalid state transitions in workflow

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated types in: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OpenAPI spec changes can be reverted
- Halt condition: if generated types contain errors or breaking changes – review spec design

**Rules to Follow**
- Validate approver permissions before workflow creation
- Enforce sequential approval order
- Maintain complete audit trail of all actions
- Prevent concurrent approval modifications

**Verification**
```bash
# Validate OpenAPI spec
pnpm --filter @workspace/api-spec run validate

# Generate types and check for errors
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck

# Verify examples render in Swagger UI
pnpm --filter @workspace/api-server dev
# Navigate to /docs and test all examples
```

**Advanced Code Patterns**
- State machine pattern for workflow transitions
- Event-driven architecture for notifications
- Sequential approval validation
- Audit trail maintenance

**Anti-Patterns**
- Concurrent approval modifications
- Invalid state transitions
- Missing approver validation
- Incomplete audit trail

**DDD / TDD / BDD / Deep Module notes**
- DDD: Approval workflow is a separate aggregate with sequential state machine and approver coordination
- TDD: Integration tests cover all workflow states and transition validation
- BDD: "As a manager, I can submit documents for sequential approval with tracking and audit trail" scenarios
- Deep Module: Approval workflow service encapsulates state machine logic and notification triggers

**DDD:** ShareFile approval workflows for document collaboration with proper sequential validation.  
**Deep Module:** Encapsulates sequential approval logic and notification triggers with clear state management.  
**Advanced Code Patterns:** State machine pattern, event-driven workflow, proper validation.  
**Anti-Patterns:** Avoid concurrent approval modifications, prevent invalid state transitions.  
**Rules to Follow:** Validate approver permissions, maintain audit trail, enforce business rules.  
**Out of Scope:** Parallel approval workflows, automatic approval based on conditions.  
**Depth refactor check** completed: Service maintains workflow state, repository handles persistence.

### Subtasks:
- [ ] API‑DOCS‑010.1: Add approval workflow paths to OpenAPI. (AGENT)  
- [ ] API‑DOCS‑010.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑010.3: Implement `ApprovalWorkflowService` with step management. (AGENT)  
- [ ] API‑DOCS‑010.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑011: Document Feedback & Annotation API
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Design and specify document annotation and feedback endpoints with threaded conversations, section mapping, position tracking, and collaborative review features following enterprise document collaboration patterns.

**Depends on:** DB‑DOCS‑004, API‑DOCS‑004.  
**Blocks:** API-DOCS-012 (version comparison).  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/documents/annotation-service.ts`

**Imports / Exports**
- Imports: [N/A] – OpenAPI specification only
- Exports: Document annotation API contract for code generation

**Definition of Done**
- [ ] OpenAPI spec adds annotations tag and paths with `/api/v1/` prefix
- [ ] `GET /api/v1/documents/{documentId}/annotations` endpoint returns paginated annotations with filtering by section and user
- [ ] `POST /api/v1/documents/{documentId}/annotations` endpoint creates annotations with position data, returns 201 with Location header
- [ ] `PATCH /api/v1/documents/{documentId}/annotations/{annotationId}` endpoint updates annotation content, returns 200
- [ ] `DELETE /api/v1/documents/{documentId}/annotations/{annotationId}` endpoint soft deletes annotation, returns 204
- [ ] `POST /api/v1/documents/{documentId}/annotations/{annotationId}/reply` endpoint creates threaded replies, returns 201
- [ ] Schemas defined: `Annotation`, `AnnotationCreate`, `AnnotationUpdate`, `AnnotationReply`, `AnnotationListResponse`
- [ ] All endpoints include proper error responses and validation
- [ ] Event emission for `AnnotationCreated`, `AnnotationResolved`, `AnnotationReplied`

**Out of Scope**
- Real-time annotation synchronization
- Annotation drawing/graphics tools
- Advanced annotation analytics
- Bulk annotation operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow annotation modification without proper authorization
- Never expose internal document structure through position data

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated types in: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OpenAPI spec changes can be reverted
- Halt condition: if generated types contain errors or breaking changes – review spec design

**Rules to Follow**
- Validate annotation permissions before creation/modification
- Maintain thread integrity for replies
- Store position data securely and validate structure
- Support multiple annotation types (comment/highlight/suggestion)

**Verification**
```bash
# Validate OpenAPI spec
pnpm --filter @workspace/api-spec run validate

# Generate types and check for errors
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck

# Verify examples render in Swagger UI
pnpm --filter @workspace/api-server dev
# Navigate to /docs and test all examples
```

**Advanced Code Patterns**
- Threaded conversation modeling
- Position-based annotation mapping
- Event-driven collaboration
- Soft delete with audit trail

**Anti-Patterns**
- Missing thread validation
- Insecure position data handling
- Missing authorization checks
- Broken reply chains

**DDD / TDD / BDD / Deep Module notes**
- DDD: Annotation is a separate aggregate with threading and document context
- TDD: Integration tests cover all annotation operations and thread integrity
- BDD: "As a collaborator, I can add comments and feedback to documents with threaded discussions" scenarios
- Deep Module: Annotation service encapsulates threading logic and position mapping complexity

**DDD:** ShareFile collaborative document review with in‑context annotations and threaded discussions.  
**Deep Module:** Encapsulates annotation threading and section mapping with proper validation.

### Subtasks:
- [ ] API‑DOCS‑011.1: Add annotation/feedback paths to OpenAPI. (AGENT)  
- [ ] API‑DOCS‑011.2: Write integration tests (red). (AGENT)  
- [ ] API‑DOCS‑011.3: Implement `DocumentAnnotationService` and repository. (AGENT)  
- [ ] API‑DOCS‑011.4: Create routes, run tests to green. (AGENT)

---

### [ ] API‑DOCS‑012: Document Version Comparison
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Design and specify document version comparison and restoration endpoints with diff generation, version metadata tracking, and safe restoration patterns following enterprise document version control best practices.

**Depends on:** API‑DOCS‑004 (documents with versions).  
**Blocks:** API-DOCS-013 (secure sharing).  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/documents/version-service.ts`

**Imports / Exports**
- Imports: [N/A] – OpenAPI specification only
- Exports: Document version comparison API contract for code generation

**Definition of Done**
- [ ] OpenAPI spec adds version-comparison tag and paths with `/api/v1/` prefix
- [ ] `GET /api/v1/documents/{documentId}/diff` endpoint returns diff data between versions with section/page references
- [ ] `GET /api/v1/documents/{documentId}/versions` endpoint returns paginated version list with metadata
- [ ] `POST /api/v1/documents/{documentId}/versions/{versionId}/restore` endpoint creates new version from previous version
- [ ] Schemas defined: `VersionDiff`, `VersionMetadata`, `VersionListResponse`, `VersionRestore`
- [ ] All endpoints include proper error responses and version validation
- [ ] Diff response includes additions, deletions, modifications with proper highlighting
- [ ] Version metadata includes version number, changed by, timestamp, size changes

**Out of Scope**
- Real-time diff generation
- Advanced diff algorithms (semantic comparison)
- Version branching and merging
- Bulk version operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow version restoration without proper validation
- Never expose internal diff algorithm details

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`
- Generated types in: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OpenAPI spec changes can be reverted
- Halt condition: if generated types contain errors or breaking changes – review spec design

**Rules to Follow**
- Validate version existence before comparison
- Ensure restoration creates new version (not overwrite)
- Maintain version integrity and audit trail
- Support reasonable diff size limits

**Verification**
```bash
# Validate OpenAPI spec
pnpm --filter @workspace/api-spec run validate

# Generate types and check for errors
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck

# Verify examples render in Swagger UI
pnpm --filter @workspace/api-server dev
# Navigate to /docs and test all examples
```

**Advanced Code Patterns**
- Diff algorithm integration
- Version metadata tracking
- Safe restoration patterns
- Audit trail maintenance

**Anti-Patterns**
- Missing version validation
- Overwriting existing versions
- Incomplete diff generation
- Missing audit trail

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document version is a separate aggregate with diff and restoration capabilities
- TDD: Integration tests cover all version operations and diff accuracy
- BDD: "As a user, I can compare document versions and restore previous versions with proper tracking" scenarios
- Deep Module: Version service encapsulates diff logic and restoration complexity

**DDD:** ShareFile version navigation and comparison with proper audit trail and safe restoration.  
**Integration tests:** compare versions, list versions, restore previous version with validation.

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
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Implement server-side document preview generation service with async processing, caching strategies, and format-specific handlers for PDF, images, and Office documents following enterprise document management patterns.

**Depends on:** DOC‑STORAGE‑001, API‑DOCS‑004.  
**Blocks:** DOC-INFRA-002 (chunked upload).  
**Related Files:** `artifacts/api-server/src/services/documents/preview-service.ts`, `artifacts/api-server/src/lib/preview/processors/`

**Imports / Exports**
- Imports: Preview processors, caching service, storage adapter, background job queue
- Exports: `PreviewService` with async generation capabilities

**Definition of Done**
- [ ] `POST /api/v1/documents/{documentId}/preview` endpoint triggers async preview generation
- [ ] `GET /api/v1/documents/{documentId}/preview` endpoint returns preview URLs or generation status
- [ ] Support for PDF (first page image), images (resized thumbnail), Office documents (via conversion)
- [ ] Preview metadata stored alongside document in `preview_urls_json` field
- [ ] Async generation via background job system with progress tracking
- [ ] Caching strategy implemented for generated previews
- [ ] Format-specific processors for different file types
- [ ] Integration tests verify preview generation and caching

**Out of Scope**
- Real-time preview updates
- Video preview generation
- Advanced image processing (watermarks, filters)
- Batch preview generation

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow preview generation without proper file validation
- Never expose internal file paths through preview URLs

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/documents/preview-service.ts`
- Preview processors: `artifacts/api-server/src/lib/preview/processors/`
- Tests added/updated in: `artifacts/api-server/__tests__/services/documents/preview.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – service and processors can be reverted
- Halt condition: if preview generation causes memory leaks or storage issues – review resource management

**Rules to Follow**
- Always validate file types before processing
- Implement proper error handling for unsupported formats
- Cache results to avoid repeated processing
- Use async processing for large files
- Monitor resource usage and implement limits

**Verification**
```bash
# Run preview service tests
pnpm --filter @workspace/api-server test -- preview.test.ts

# Type checking
pnpm run typecheck

# Manual preview generation test
pnpm --filter @workspace/api-server dev
# Upload test PDF and verify preview generation
```

**Advanced Code Patterns**
- Async job processing with queue management
- Caching strategies with TTL
- Format-specific handler pattern
- Resource monitoring and limits
- Background job status tracking

**Anti-Patterns**
- Blocking operations for large files
- Memory leaks with image processing
- Missing file type validation
- Inconsistent caching behavior
- Missing error handling

**DDD / TDD / BDD / Deep Module notes**
- DDD: Preview generation is a domain service supporting document browsing capability
- TDD: Integration tests verify async processing and caching behavior
- BDD: "As a user, I can see document previews without downloading the full file" scenarios
- Deep Module: Preview service encapsulates format-specific processing and caching complexity

**DDD:** Browser preview capability (ShareFile) with async generation and caching.  
**Deep Module:** Encapsulates preview generation logic, caching strategy, and format conversion with proper resource management.  
**Advanced Code Patterns:** Async job processing, caching strategies, format-specific handlers.  
**Anti-Patterns:** Avoid blocking operations, prevent memory leaks with large files.  
**Rules to Follow:** Always validate file types, implement proper error handling, cache results.  
**Out of Scope:** Real-time preview updates, video preview generation.  
**Verification:** `pnpm test -- doc-infra-preview && pnpm typecheck`

### Subtasks:
- [ ] DOC‑INFRA‑001.1: Implement preview generation service (stubbed for complex types). (AGENT)  
- [ ] DOC‑INFRA‑001.2: Add preview endpoints and integrate with document response. (AGENT)  
- [ ] DOC‑INFRA‑001.3: Write integration tests. (AGENT)

---

### [ ] DOC‑INFRA‑002: Chunked Upload for Large Files
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Implement resumable chunked upload system with session management, progress tracking, and large file support following enterprise file upload patterns with proper error handling and cleanup.

**Depends on:** DOC‑STORAGE‑001.  
**Blocks:** DOC-INFRA-003 (OCR extraction).  
**Related Files:** `artifacts/api-server/src/services/documents/chunked-upload-service.ts`, `artifacts/api-server/src/lib/upload/session-manager.ts`

**Imports / Exports**
- Imports: Storage adapter, session manager, file validation utilities
- Exports: `ChunkedUploadService` with session management and progress tracking

**Definition of Done**
- [ ] `POST /api/v1/documents/upload/init` endpoint initializes multipart upload session, returns session ID
- [ ] `POST /api/v1/documents/upload/{sessionId}/chunk` endpoint uploads chunks with Content-Range headers
- [ ] `POST /api/v1/documents/upload/{sessionId}/complete` endpoint finalizes upload and creates document record
- [ ] `POST /api/v1/documents/upload/{sessionId}/abort` endpoint cancels upload and cleans up resources
- [ ] `GET /api/v1/documents/upload/{sessionId}/progress` endpoint returns upload progress and status
- [ ] Support for files up to 5GB with proper validation
- [ ] Session management with timeout and cleanup
- [ ] Chunk reassembly and validation
- [ ] Integration tests verify complete chunked upload flow

**Out of Scope**
- Parallel chunk uploads
- Upload acceleration (CDN distribution)
- Advanced file validation (virus scanning)
- Upload queue management

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never allow unlimited file sizes without validation
- Never expose internal storage paths through upload endpoints

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/documents/chunked-upload-service.ts`
- Session manager: `artifacts/api-server/src/lib/upload/session-manager.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/services/documents/chunked-upload.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – service and session manager can be reverted
- Halt condition: if chunked upload causes storage corruption – review reassembly logic

**Rules to Follow**
- Validate file size and type before upload initialization
- Implement proper session timeout and cleanup
- Validate Content-Range headers for chunk ordering
- Reassemble chunks in correct order
- Handle network interruptions gracefully

**Verification**
```bash
# Run chunked upload tests
pnpm --filter @workspace/api-server test -- chunked-upload.test.ts

# Type checking
pnpm run typecheck

# Manual chunked upload test
pnpm --filter @workspace/api-server dev
# Test large file upload with chunking
```

**Advanced Code Patterns**
- Session-based upload management
- Chunk reassembly algorithms
- Progress tracking with real-time updates
- Resource cleanup and timeout handling
- Resumable upload patterns

**Anti-Patterns**
- Missing session cleanup
- Incorrect chunk ordering validation
- Memory leaks with large file handling
- Missing progress tracking
- Poor error handling for network issues

**DDD / TDD / BDD / Deep Module notes**
- DDD: Chunked upload is infrastructure service supporting large file handling
- TDD: Integration tests verify complete upload flow and error scenarios
- BDD: "As a user, I can upload large files reliably with progress tracking and resume capability" scenarios
- Deep Module: Chunked upload service encapsulates session management and reassembly complexity

**DDD:** Infrastructure for handling large files (ShareFile supports up to 100GB) with reliable chunked upload patterns.

### Subtasks:
- [ ] DOC‑INFRA‑002.1: Implement chunked upload service with session management. (AGENT)  
- [ ] DOC‑INFRA‑002.2: Add chunked upload endpoints to OpenAPI. (AGENT)  
- [ ] DOC‑INFRA‑002.3: Write integration tests for full chunked flow. (AGENT)

---

### [ ] DOC‑INFRA‑003: OCR Text Extraction for Uploaded Documents
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Size:** Large  

**Description** Implement OCR text extraction service with async processing, third-party API integration, and automatic triggering for image-based documents following enterprise document searchability patterns.

**Depends on:** DOC‑STORAGE‑001, API‑DOCS‑004.  
**Blocks:** [N/A] – completes document infrastructure.  
**Related Files:** `artifacts/api-server/src/services/documents/ocr-service.ts`, `artifacts/api-server/src/lib/ocr/ocr-provider.ts`

**Imports / Exports**
- Imports: OCR provider interface, storage adapter, background job queue
- Exports: `OCRService` with async text extraction capabilities

**Definition of Done**
- [ ] `POST /api/v1/documents/{documentId}/ocr` endpoint triggers async OCR text extraction
- [ ] `GET /api/v1/documents/{documentId}/ocr-text` endpoint returns extracted text or processing status
- [ ] OCR extraction triggered automatically on upload for image-based files (PDFs, images)
- [ ] Extracted text stored alongside document in `extracted_text` field
- [ ] Text used for full-text search indexing
- [ ] Initial implementation uses third-party OCR API with fallback to stub
- [ ] Integration tests verify OCR extraction and search integration
- [ ] Proper error handling for unsupported file types

**Out of Scope**
- Full local OCR implementation (deferred to later phase)
- Advanced OCR features (language detection, handwriting recognition)
- Real-time OCR processing
- Batch OCR operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never expose OCR API keys or internal processing details
- Never allow OCR processing without proper file validation

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/documents/ocr-service.ts`
- OCR provider: `artifacts/api-server/src/lib/ocr/ocr-provider.ts`
- Tests added/updated in: `artifacts/api-server/__tests__/services/documents/ocr.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level – OCR service and provider can be reverted
- Halt condition: if OCR processing causes storage issues – review text storage strategy

**Rules to Follow**
- Validate file types before OCR processing
- Use third-party OCR API with proper error handling
- Store extracted text securely with proper encoding
- Implement async processing to avoid blocking uploads
- Handle OCR service failures gracefully

**Verification**
```bash
# Run OCR service tests
pnpm --filter @workspace/api-server test -- ocr.test.ts

# Type checking
pnpm run typecheck

# Manual OCR extraction test
pnpm --filter @workspace/api-server dev
# Upload image-based document and verify OCR text
```

**Advanced Code Patterns**
- Async text extraction with job queuing
- Third-party API integration with fallback
- Text storage and indexing integration
- File type validation for OCR compatibility
- Background processing with status tracking

**Anti-Patterns**
- Synchronous OCR processing
- Missing error handling for OCR failures
- Insecure API key storage
- Missing file type validation
- Poor text encoding handling

**DDD / TDD / BDD / Deep Module notes**
- DDD: OCR extraction is domain service supporting document searchability
- TDD: Integration tests verify text extraction and search integration
- BDD: "As a user, I can search within document contents after upload" scenarios
- Deep Module: OCR service encapsulates third-party integration and text processing complexity

**DDD:** Content searchability (ShareFile feature) with automatic OCR processing and search integration.

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
**Service:** `ESignService` with constructor injection of `ESignProviderPort` (SignWellClient stub). `sendForSignature` calls provider, stores `external_request_id` and initial status; `getSignatureStatus` updates local status; `voidRequest` voids. Emits `DocumentSentForSignature`, `DocumentSigned`, `SignatureDeclined` events.  
**Integration tests:** create signature request → 201; retrieve → 200 with status; void → 200; non‑existent document → 404.  
**Advanced Code Patterns:** Port-adapter pattern, event emission, proper error handling.  
**Anti-Patterns:** Avoid synchronous API calls, prevent missing event emissions.  
**Rules to Follow:** Always emit events for state changes, validate inputs before API calls.  
**Out of Scope:** Real-time signature updates, bulk signature requests.

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
