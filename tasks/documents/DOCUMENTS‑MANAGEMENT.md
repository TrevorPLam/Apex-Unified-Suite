# tasks/documents/DOCUMENTS‑MANAGEMENT.md – Documents: Core Management

This file contains tasks for the Document Management bounded context: file storage adapter (Cloudflare R2), documents and folders CRUD, file upload with chunked large‑file support, full‑text search, version comparison, secure share links, e‑signature templates, and the frontend integration for all document management interactions.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Storage Adapter

### [ ] DOC‑STORAGE‑001: File Storage Adapter (Cloudflare R2)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No concrete storage adapter exists. Documents cannot be uploaded or downloaded.
**Size:** Medium

**Description:** Implement the `StorageAdapter` interface for Cloudflare R2 using AWS SDK v3 (S3 client pointed at R2 endpoint). Environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.

**Depends on:** `infrastructure/EMAIL‑STORAGE.md → STORAGE‑001`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑003`, all document upload/download features
**Related Files:** `artifacts/api‑server/src/lib/storage/storage‑adapter.ts`, `artifacts/api‑server/src/lib/storage/r2‑adapter.ts`

**Definition of Done**
- [ ] `CloudflareR2Adapter` implements `StorageAdapter` with all methods (`upload`, `download`, `getSignedUrl`, `delete`, `list`)
- [ ] Environment variables added to `.env.example`
- [ ] Unit tests for the interface contract using an in‑memory mock adapter
- [ ] Smoke test against real R2 (manual)
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm test -- storage‑adapter && pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Storage is infrastructure; the adapter hides R2‑specific SDK details behind the `StorageAdapter` interface.

---

### Subtasks
- [ ] DOC‑STORAGE‑001.1 (AGENT): Create `StorageAdapter` interface. **File:** `storage‑adapter.ts` **Verification:** `pnpm typecheck`.
- [ ] DOC‑STORAGE‑001.2 (AGENT): Implement `CloudflareR2Adapter`. **File:** `r2‑adapter.ts` **Verification:** Unit test passes.
- [ ] DOC‑STORAGE‑001.3 (AGENT): Write contract tests for the interface. **Verification:** `pnpm test -- storage‑adapter` green.
- [ ] DOC‑STORAGE‑001.4 (AGENT): Add R2 env vars to `.env.example`. **Verification:** Variables documented.
- [ ] DOC‑STORAGE‑001.5 (HUMAN): Provision Cloudflare R2 bucket, run manual smoke test. **Verification:** Manual.

---

## Database – Documents & Folders

### [ ] DB‑DOCS‑001: Define Documents Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No documents table. The entire Documents context is blocked.
**Size:** Small

**Description:** Define the `documents` table – the core document entity. Supports versioning, mime‑type tracking, storage path references, and soft delete.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → DB‑DOCS‑002`, `DB‑DOCS‑003`, `DB‑DOCS‑004`, `DB‑DOCS‑005`, `DB‑DOCS‑006`, `DB‑DOCS‑007`, `API‑DOCS‑001`
**Related Files:** `lib/db/src/schema/documents/documents.ts`, `lib/db/src/__tests__/documents‑documents.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK), `folder_id` (uuid nullable FK → folders), `name` (text NOT NULL), `original_filename` (text NOT NULL), `mime_type` (text NOT NULL), `size_bytes` (bigint NOT NULL), `storage_path` (text NOT NULL), `version` (integer NOT NULL default `1`), `status` (pgEnum: `draft|active|archived`), `uploaded_by` (uuid FK → users), `description` (text nullable), `tags` (text[] default `{}`), `deleted_at`, `created_at`, `updated_at`
- [ ] Indexes: `(organization_id, folder_id)`, `(organization_id, status)`, `(uploaded_by)`, `(organization_id, name)`
- [ ] Zod schemas exported; `size_bytes` validated as non‑negative integer
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- documents‑documents.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document is the aggregate root of the Documents bounded context. Version is a value object.
- TDD: Assert status enum, `size_bytes` non‑nullable, array column for tags.
- BDD: Enables “Upload and manage documents with version history” scenarios.

---

### Subtasks
- [ ] DB‑DOCS‑001.0.25 (AGENT): Read DB‑ORG‑001 and existing schema patterns. No action – pause.
- [ ] DB‑DOCS‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/documents‑documents.test.ts` **Verification:** RED.
- [ ] DB‑DOCS‑001.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑DOCS‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DB‑DOCS‑002: Define Document Versions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No version history table. Document version tracking is blocked.
**Size:** Small

**Description:** Define the `document_versions` table – stores immutable version snapshots of a document’s metadata and content reference each time it is updated.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → DB‑DOCS‑001`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑003`
**Related Files:** `lib/db/src/schema/documents/versions.ts`, `lib/db/src/__tests__/versions.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `document_id` (FK, `onDelete: cascade`), `organization_id` (FK), `storage_path` (text NOT NULL), `version_number` (integer NOT NULL), `change_description` (text nullable), `changed_by` (uuid FK → users), `created_at` (only)
- [ ] Indexes: `(document_id, version_number)`, `(organization_id, document_id)`
- [ ] Zod schemas; `version_number` auto‑incremented per document
- [ ] Unit tests pass
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/db test -- versions.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑DOCS‑002.0.25 (AGENT): Read DB‑DOCS‑001. No action – pause.
- [ ] DB‑DOCS‑002.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/versions.test.ts` **Verification:** RED.
- [ ] DB‑DOCS‑002.2 (AGENT): Implement table, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑DOCS‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Documents

### [ ] API‑DOCS‑001: Documents – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No document endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add all document CRUD, upload, and download endpoints to the OpenAPI spec.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → DB‑DOCS‑002`, `DOC‑STORAGE‑001`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑002`, `API‑DOCS‑003`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/documents`, `POST /documents`, `GET /{documentId}`, `POST /upload`, `PATCH /{documentId}`, `DELETE /{documentId}` endpoints
- [ ] Schemas: `Document`, `DocumentCreate`, `DocumentUpdate` with examples
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑DOCS‑001.1 (AGENT): Add document paths and schemas to OpenAPI. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑DOCS‑001.2 (HUMAN): Review spec and sign off. **Verification:** Approved.

---

### [ ] API‑DOCS‑002: Documents – Integration Tests (TDD Red)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No document integration tests.
**Size:** Medium

**Description:** Write document integration tests covering CRUD, upload, version increments, and storage integration. All must fail (red) before implementation.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑003`
**Related Files:** `artifacts/api‑server/__tests__/api/documents/documents.test.ts`

**Definition of Done**
- [ ] Tests: upload file → 201, get document → 200 with signed URL, update → version increment, soft delete → 204
- [ ] Error tests: upload without file → 400, not found → 404, unauthorized → 401
- [ ] All tests fail (red)
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/documents/documents.test.ts
# Expected: all fail
pnpm typecheck
```

---

### Subtasks
- [ ] API‑DOCS‑002.0.25 (AGENT): Read API‑DOCS‑001 spec and TEST‑INFRA‑001. *No action – pause.*
- [ ] API‑DOCS‑002.1 (AGENT): Write all document integration tests. **File:** `artifacts/api‑server/__tests__/api/documents/documents.test.ts` **Verification:** All fail; `pnpm typecheck`.
- [ ] API‑DOCS‑002.2 (HUMAN): Review test coverage and confirm red phase. **Verification:** Approved.

---

### [ ] API‑DOCS‑003: Documents – Service & Repository (Deep Module)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No `DocumentRepository` or `DocumentService` exists.
**Size:** Large

**Description:** Implement `DocumentRepository` (soft delete, version tracking) and `DocumentService` with `StorageAdapter` injected via constructor. Encapsulates versioning, storage abstraction, and event publishing.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → DB‑DOCS‑001`, `DOC‑STORAGE‑001`, `infrastructure/DATABASE.md → ARCH‑001.2`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑004`
**Related Files:** `lib/db/src/repositories/documents/documents.ts`, `artifacts/api‑server/src/services/documents/document‑service.ts`

**Definition of Done**
- [ ] `DocumentRepository`: `findById`, `findByOrg`, `create`, `update`, `softDelete`
- [ ] `DocumentService`: `uploadDocument(file, metadata)`, `getDocument`, `updateDocument`, `deleteDocument`, `getDownloadUrl`. All return `Result<T, DomainError>`.
- [ ] Storage calls wrapped in try/catch → mapped to `StorageBackendUnavailable`
- [ ] Emits `DocumentUploaded`, `DocumentUpdated` domain events
- [ ] Unit tests pass
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/services/documents/__tests__/document‑service.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: DocumentService encapsulates versioning, storage abstraction, and event publishing.
- TDD: Unit tests with mocked `StorageAdapter` verify upload and download flows.

---

### Subtasks
- [ ] API‑DOCS‑003.0.25 (AGENT): Read DB‑DOCS‑001 and DOC‑STORAGE‑001. *No action – pause.*
- [ ] API‑DOCS‑003.1 (AGENT): Implement `DocumentRepository`. **File:** `lib/db/src/repositories/documents/documents.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑DOCS‑003.2 (AGENT): Implement `DocumentService`. **File:** `artifacts/api‑server/src/services/documents/document‑service.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑DOCS‑003.3 (AGENT): Write and run unit tests. **File:** `artifacts/api‑server/src/services/documents/__tests__/document‑service.test.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑DOCS‑003.4 (HUMAN): Review storage abstraction and versioning. Sign off. **Verification:** Approved.

---

### [ ] API‑DOCS‑004: Documents – Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No document routes wired.
**Size:** Small

**Description:** Create document route handlers, mount the router, and run integration tests to green.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑003`, `API‑DOCS‑002`, `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** All other documents sub‑features
**Related Files:** `artifacts/api‑server/src/routes/documents/documents.ts`, `artifacts/api‑server/src/routes/index.ts`

**Definition of Done**
- [ ] All CRUD + upload routes implemented; signed URL download; soft delete
- [ ] `pnpm test -- documents.test.ts` — 0 failures
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/documents/documents.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑DOCS‑004.0.25 (AGENT): Read existing route patterns. *No action – pause.*
- [ ] API‑DOCS‑004.1 (AGENT): Implement documents router and mount. **File:** `routes/documents.ts`, `routes/index.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑DOCS‑004.2 (AGENT): Run integration tests to green. **Verification:** All green; `pnpm typecheck`.
- [ ] API‑DOCS‑004.3 (HUMAN): Final sign‑off. **Verification:** Approved.

---

## Frontend – Documents

### [ ] FRONT‑DOCS‑001: Documents & Folders – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `Documents.tsx` imports documents and folders from mock data. No `useDocumentList` or `useFolderList` hooks exist.
**Size:** Small

**Description:** Create `useDocumentList` and `useFolderList` hooks backed by `API‑DOCS‑004` / `API‑DOCS‑008`. Replace mock data in document list and folder tree views.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑004`, `API‑DOCS‑008`, `infrastructure/AUTH.md → FRONT‑INFRA‑001`, `FRONT‑INFRA‑002`, `FRONT‑AUTH‑002`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑INT‑DOCS`
**Related Files:** `artifacts/apex‑os/src/pages/Documents.tsx`, `artifacts/apex‑os/src/hooks/documents/useDocumentList.ts`, `useFolderList.ts`

**Definition of Done**
- [ ] `useDocumentList` and `useFolderList` hooks created
- [ ] Document list shows: name, type icon, size, uploaded by, last modified, status badge
- [ ] Folder tree renders hierarchically; breadcrumb navigation updates on folder click
- [ ] All `mockData` imports removed
- [ ] `pnpm typecheck` passes
- [ ] Component tests pass

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- documents‑list.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Documents and Folders are aggregate roots in the Documents bounded context.
- TDD: MSW returns documents in root folder; assert list renders; simulate folder click → assert list re‑fetches.
- BDD: “As a firm user, I can browse my documents in a folder tree and see files with their type, size, and modified date.”

---

### Subtasks
- [ ] FRONT‑DOCS‑001.0.25 (AGENT): Read `Documents.tsx` in full. *No action – pause.*
- [ ] FRONT‑DOCS‑001.1 (AGENT): Create `useDocumentList` and `useFolderList` hooks. **File:** `useDocumentList.ts`, `useFolderList.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑001.2 (AGENT): Replace mock data; add breadcrumb navigation. **File:** `Documents.tsx` **Verification:** No mockData; `pnpm typecheck`.
- [ ] FRONT‑DOCS‑001.3 (AGENT): Write component tests. **File:** `artifacts/apex‑os/src/pages/__tests__/documents‑list.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑002: File Upload Component
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No file upload UI exists in Documents.
**Size:** Small

**Description:** Build a drag‑and‑drop file upload zone with file type/size validation and per‑file progress tracking. Single and batch upload queue UI. Files > 100 MB use the chunked upload endpoint via `useChunkedUpload`.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`, `API‑DOCS‑004`, `documents/DOCUMENTS‑INFRASTRUCTURE.md → DOC‑INFRA‑002`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑INT‑DOCS`
**Related Files:** `artifacts/apex‑os/src/components/documents/FileUpload.tsx`, `FileUploadQueue.tsx`, `artifacts/apex‑os/src/hooks/documents/useChunkedUpload.ts`

**Definition of Done**
- [ ] Drag‑and‑drop zone highlights on drag‑enter; rejects invalid MIME types client‑side; rejects files > 500 MB
- [ ] Upload queue: each file shows independent progress bar, status badge, retry button on error
- [ ] Files ≤ 100 MB: multipart POST; files > 100 MB: chunked upload via `useChunkedUpload`
- [ ] On successful upload, document list refreshes
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- FileUpload.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: File upload is an infrastructure operation; the resulting Document entity is created by the API after successful upload.
- TDD: Simulate drop of valid file → assert mutation called; drop invalid type → assert error message.
- BDD: “As a firm user, I can drag files onto the upload zone and track their upload progress.”

---

### Subtasks
- [ ] FRONT‑DOCS‑002.1 (AGENT): Build drag‑and‑drop upload zone. **File:** `FileUpload.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑002.2 (AGENT): Implement upload queue with per‑file progress bars. **File:** `FileUploadQueue.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑002.3 (AGENT): Implement `useChunkedUpload` for files > 100 MB. **File:** `useChunkedUpload.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑002.4 (AGENT): Write component tests. **File:** `FileUpload.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑002.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑003: Advanced Search & Filtering
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Documents search is a non‑functional input field.
**Size:** Small

**Description:** Full‑text document search with auto‑complete suggestions, multi‑select filters (type, date range, folder, size), advanced sorting, result highlighting, and saved search views.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/DocumentSearch.tsx`

**Definition of Done**
- [ ] Search bar: debounced full‑text search with auto‑complete
- [ ] Filter panel: file type, date range, folder, size range
- [ ] Sorting: name, date, size, type; direction toggle
- [ ] Search term highlighted in results
- [ ] Saved searches: save/load/delete named views
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- DocumentSearch.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Search is a read‑only cross‑aggregate query projection.
- TDD: MSW returns search results; assert term is highlighted; assert filter params sent in API request.
- BDD: “As a firm user, I can search for documents by name and filter by type and date.”

---

### Subtasks
- [ ] FRONT‑DOCS‑003.1 (AGENT): Build search bar with auto‑complete and debounce. **File:** `DocumentSearch.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑003.2 (AGENT): Implement filter panel and sorting controls. **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑003.3 (AGENT): Add result highlighting and saved search management; write tests. **File:** `__tests__/DocumentSearch.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑003.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑004: Folder Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Folder tree is read‑only. No folder CRUD modals, drag‑and‑drop file movement, or bulk operations exist.
**Size:** Small

**Description:** Full folder management: create/rename/delete folder modals, drag‑and‑drop file movement between folders, lazy‑loading folder tree with expand/collapse, breadcrumb navigation with dropdown shortcuts, and bulk move with multi‑select.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`, `API‑DOCS‑008`
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑INT‑DOCS`
**Related Files:** `artifacts/apex‑os/src/components/documents/FolderTree.tsx`, `FolderManager.tsx`

**Definition of Done**
- [ ] Folder tree: lazy‑loads children on expand; context menu with rename, delete, new subfolder
- [ ] Create/rename/delete folder modals with name validation
- [ ] Drag‑and‑drop file movement; bulk move with multi‑select
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- FolderManager.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Folder is a lightweight organisational entity.
- TDD: Simulate create folder → assert `POST /folders` called; simulate drag file → assert mutation called.
- BDD: “As a firm user, I can create folders, move files between them, and delete empty folders.”

---

### Subtasks
- [ ] FRONT‑DOCS‑004.1 (AGENT): Build `FolderTree` with lazy‑load and context menu. **File:** `FolderTree.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑004.2 (AGENT): Implement create/rename/delete folder modals. **File:** `FolderManager.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑004.3 (AGENT): Add drag‑and‑drop and bulk move; write tests. **File:** `__tests__/FolderManager.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑004.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑INT‑DOCS: Documents Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Download, soft‑delete, and folder CRUD mutations are not wired.
**Size:** Small

**Description:** Wire all core Documents mutations: file upload, download via signed URL, soft‑delete with undo, folder CRUD. All mutations show sonner toast feedback.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`, `FRONT‑DOCS‑002`, `FRONT‑DOCS‑004`, `infrastructure/AUTH.md → FRONT‑INFRA‑003`, `FRONT‑INFRA‑004`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Documents.tsx`, `artifacts/apex‑os/src/hooks/documents/`

**Definition of Done**
- [ ] Upload action wired to `FileUpload` component
- [ ] Download button fetches `signed_download_url` then triggers browser download
- [ ] Soft‑delete → `useDeleteDocument` via `useUndoableMutation`; undo toast with 5‑second window
- [ ] Folder CRUD mutations wired
- [ ] Integration tests with MSW cover upload, download, delete, and undo paths

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- documents‑interactive.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Documents interactive mutations enforce access control via signed URLs and soft‑delete domain events.
- TDD: Simulate delete → assert `PATCH /documents/:id` called → assert undo toast → simulate undo → assert restore mutation called.
- BDD: “As a firm user, I can download a document, delete it with an undo option, and upload new files.”

---

### Subtasks
- [ ] FRONT‑INT‑DOCS.0.25 (AGENT): List all Documents mutation surfaces. *No action – pause.*
- [ ] FRONT‑INT‑DOCS.1 (AGENT): Implement `useDownloadDocument` and `useDeleteDocument` with undo. **File:** `useDownloadDocument.ts`, `useDeleteDocument.ts` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑DOCS.2 (AGENT): Wire upload and folder CRUD mutations. **File:** `Documents.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑INT‑DOCS.3 (AGENT): Write integration tests. **File:** `__tests__/documents‑interactive.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑INT‑DOCS.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---