# TODO-P5-DOCUMENTS.md – Phase 5: Documents Frontend Integration

Replaces all mock data in the Documents page with real API-backed React Query hooks and wires all document management interactions: file upload (with chunked large-file support), folder CRUD, full-text search, document request lists, approval workflows, version diff viewer, secure share links, e-signature template builder, in-browser annotation, and Word-based template generation.

---

## [ ] FRONT‑DOCS‑001: Documents & Folders – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Documents.tsx` imports documents and folders from `src/data/mockData.ts`. No `useDocumentList` or `useFolderList` hooks exist.
**Size:** Small

**Description:** Create `useDocumentList` and `useFolderList` hooks backed by `API-DOCS-004` / `API-DOCS-008`. Replace mock data in document list and folder tree views. Show file type icons, formatted file sizes, and dates.

**Depends on:** API‑DOCS‑004 (documents API green), API‑DOCS‑008 (folders API green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** FRONT‑INT‑DOCS
**Related Files:** `artifacts/apex-os/src/pages/Documents.tsx`, `artifacts/apex-os/src/hooks/documents/useDocumentList.ts`, `artifacts/apex-os/src/hooks/documents/useFolderList.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; API client for `GET /api/v1/documents`, `GET /api/v1/folders`
- Exports: `useDocumentList(folderId?, filters?)`, `useFolderList(parentId?)`

**Definition of Done**
- [ ] `useDocumentList` hook created with `folderId`, search, and sort params; returns paginated documents
- [ ] `useFolderList` hook created; returns folder tree for a given parent (null = root)
- [ ] Document list shows: name (with file type icon), size (formatted as KB/MB), uploaded by, last modified date, status badge
- [ ] Folder tree renders hierarchically; clicking a folder filters the document list
- [ ] Breadcrumb navigation updates on folder navigation
- [ ] All `mockData` imports removed from `Documents.tsx`
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass: documents render; folder click filters list; empty folder shows empty state

**Out of Scope**
- File upload (FRONT‑DOCS‑002)
- Advanced search (FRONT‑DOCS‑003)
- Folder CRUD modals (FRONT‑DOCS‑004)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/documents/useDocumentList.ts`, `artifacts/apex-os/src/hooks/documents/useFolderList.ts`, `artifacts/apex-os/src/pages/Documents.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/documents-list.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert `Documents.tsx` mock imports
- Halt condition: if `pnpm run typecheck` fails due to file type enum mismatch, stop and align types with the generated schema

**Rules to Follow**
- File type icons must be driven by the `mime_type` field, not file extension string matching
- File sizes formatted: bytes → KB (1 decimal) if < 1 MB, MB (2 decimal) otherwise; use a utility function in `src/lib/format.ts`

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- documents-list.test.tsx
```

**Advanced Code Patterns**
- `useFolderList` with `enabled: !!parentId` so root folders load immediately; child folders lazy-load on expand
- Use `select` option in `useDocumentList` to attach file type icon names to each document

**Anti-Patterns**
- Mapping file types by extension — use MIME type from API; extensions can be spoofed
- Loading all folders recursively on mount — always lazy-load children on expand

**DDD / TDD / BDD / Deep Module notes**
- DDD: Documents and Folders are aggregate roots in the Documents bounded context. A Folder is a pure organisational concept — it has no content of its own.
- TDD: MSW returns 3 documents in root folder; assert list renders; simulate folder click → assert document list re-fetches with `folderId`.
- BDD: "As a firm user, I can browse my documents in a folder tree and see files with their type, size, and modified date."
- Deep Module: `useDocumentList` and `useFolderList` hide API pagination and folder scoping; `Documents.tsx` just calls hooks with current folder ID.

---

### Subtasks

- [ ] FRONT‑DOCS‑001.0.25 (AGENT): Read `Documents.tsx` in full and list every `mockData` reference and the data shape consumed.
  *No action — pause until fully understood.*

- [ ] FRONT‑DOCS‑001.1 (AGENT): Create `useDocumentList` and `useFolderList` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/documents/useDocumentList.ts`, `artifacts/apex-os/src/hooks/documents/useFolderList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑001.2 (AGENT): Replace mock document and folder data; add breadcrumb navigation.
  **File(s):** `artifacts/apex-os/src/pages/Documents.tsx`
  **Verification:** No `mockData` references; `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑001.3 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/documents-list.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- documents-list.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑002: File Upload Component
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No file upload UI exists in Documents.
**Size:** Small

**Description:** Build a drag-and-drop file upload zone with file type/size validation and per-file progress tracking. Single and batch upload queue UI. Files > 100 MB use the chunked upload endpoint via `useChunkedUpload`.

**Depends on:** FRONT‑DOCS‑001, API‑DOCS‑004 (upload endpoint), DOC‑INFRA‑002 (chunked upload API)
**Blocks:** FRONT‑INT‑DOCS
**Related Files:** `artifacts/apex-os/src/components/documents/FileUpload.tsx`, `artifacts/apex-os/src/components/documents/FileUploadQueue.tsx`, `artifacts/apex-os/src/hooks/documents/useChunkedUpload.ts`

**Imports / Exports**
- Imports: `useDropzone` from `react-dropzone`; `useMutation` from `@tanstack/react-query`; `toast` from `sonner`
- Exports: `FileUpload` component, `FileUploadQueue` component, `useChunkedUpload()`

**Definition of Done**
- [ ] Drag-and-drop zone: highlights on drag-enter; rejects invalid MIME types client-side; rejects files > 500 MB
- [ ] Upload queue: each file shows independent progress bar, status badge (queued/uploading/done/error), retry button on error
- [ ] Files ≤ 100 MB: multipart POST via `useUploadDocument` mutation
- [ ] Files > 100 MB: chunked upload via `useChunkedUpload`; pause/resume supported
- [ ] On successful upload, `['documents']` query invalidated; file appears in list
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests: upload success, file type rejection, retry on failure

**Out of Scope**
- Folder selection during upload (Phase 6+ UX enhancement)
- Virus scanning UI indicator (backend concern; Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/FileUpload.tsx`, `artifacts/apex-os/src/components/documents/FileUploadQueue.tsx`, `artifacts/apex-os/src/hooks/documents/useChunkedUpload.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/FileUpload.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `FileUpload` and `FileUploadQueue`; upload button shows "coming soon"
- Halt condition: if chunked upload leaves orphaned chunk records on abort, stop and verify the API's chunk cleanup on cancel

**Rules to Follow**
- Allowed MIME types: `application/pdf`, `image/*`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`, `text/plain` — reject all others client-side before any API call
- Max size hard limit: 500 MB — show descriptive error message, do not attempt upload
- Use `XMLHttpRequest` (not `fetch`) for upload progress tracking — `fetch` does not expose upload progress

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- FileUpload.test.tsx
```

**Advanced Code Patterns**
- Chunk size: 5 MB per chunk; `useChunkedUpload` manages chunk index, retry on individual chunk failure, and completion assembly call
- Upload queue state: `Map<fileId, { file, progress, status, error }>` managed in `useReducer` inside `FileUploadQueue`

**Anti-Patterns**
- Using `fetch` for upload — no progress events; always use `XHR` or a library with `onUploadProgress`
- Blocking the UI during upload — queue runs in the background; users can browse while uploading

**DDD / TDD / BDD / Deep Module notes**
- DDD: File upload is an infrastructure operation; the resulting Document entity is created by the API after successful upload.
- TDD: Simulate drop of valid file → assert mutation called; drop invalid type → assert error message; simulate network failure → assert retry button shown.
- BDD: "As a firm user, I can drag files onto the upload zone and track their upload progress."
- Deep Module: `FileUploadQueue` hides chunk management, retry logic, and progress state; callers just render `<FileUpload folderId={id} />`.

---

### Subtasks

- [ ] FRONT‑DOCS‑002.1 (AGENT): Build drag-and-drop upload zone with MIME type and size validation.
  **File(s):** `artifacts/apex-os/src/components/documents/FileUpload.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑002.2 (AGENT): Implement upload queue with per-file progress bars and retry on error.
  **File(s):** `artifacts/apex-os/src/components/documents/FileUploadQueue.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑002.3 (AGENT): Implement `useChunkedUpload` for files > 100 MB with pause/resume.
  **File(s):** `artifacts/apex-os/src/hooks/documents/useChunkedUpload.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑002.4 (AGENT): Write component tests (success, type rejection, retry, chunked flow).
  **File(s):** `artifacts/apex-os/src/components/documents/__tests__/FileUpload.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- FileUpload.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑002.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑003: Advanced Search & Filtering
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Documents search is a non-functional input field.
**Size:** Small

**Description:** Full-text document search with auto-complete suggestions, multi-select filters (type, date range, folder, size), advanced sorting, result highlighting, and saved search views.

**Depends on:** FRONT‑DOCS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/DocumentSearch.tsx`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; `useDeferredValue` from `react`; shadcn/ui Popover, Command
- Exports: `DocumentSearch` component

**Definition of Done**
- [ ] Search bar: debounced full-text search against `GET /api/v1/documents/search?q=`; auto-complete suggestions shown in a Command dropdown
- [ ] Filter panel: file type (multi-select), date range picker, folder selector, size range slider
- [ ] All filters combine server-side — no client-side filtering
- [ ] Sorting: name, date, size, type; direction toggle (asc/desc)
- [ ] Search term highlighted in result names and snippet previews
- [ ] Saved searches: save current filter state as a named view; load/delete from dropdown
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Content indexing and full-text extraction (backend concern)
- AI semantic search (Phase 10)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/DocumentSearch.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/DocumentSearch.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `DocumentSearch`; search reverts to non-functional input
- Halt condition: if search returns unscoped cross-tenant results, stop immediately and verify tenant isolation in the API

**Rules to Follow**
- Debounce the search input with `useDeferredValue` (React 19) — minimum 300 ms before API call
- Highlight matching terms: wrap matches in `<mark>` tags — do not use `dangerouslySetInnerHTML`; use a safe highlight utility

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- DocumentSearch.test.tsx
```

**Advanced Code Patterns**
- `useQuery({ queryKey: ['documents', 'search', deferredQuery, filters], enabled: deferredQuery.length >= 2 })` — avoid searching for single characters
- Save filter state as a URL query string and persist to `localStorage`; sync with `GET /api/v1/saved-searches`

**Anti-Patterns**
- `dangerouslySetInnerHTML` for search result highlighting — XSS risk; always sanitise or use a safe highlight component
- Client-side filtering on the full document list — doesn't scale; always pass search params to the API

**DDD / TDD / BDD / Deep Module notes**
- DDD: Search is a read-only cross-aggregate query projection; it does not belong to the Document aggregate.
- TDD: MSW returns search results with a matching term; assert the term is highlighted in the result; assert filter params are sent in the API request URL.
- BDD: "As a firm user, I can search for documents by name and filter by type and date."
- Deep Module: `DocumentSearch` hides debouncing, filter serialisation, and highlight logic.

---

### Subtasks

- [ ] FRONT‑DOCS‑003.1 (AGENT): Build search bar with auto-complete and `useDeferredValue` debounce.
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentSearch.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑003.2 (AGENT): Implement filter panel (type, date, folder, size) and sorting controls.
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentSearch.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑003.3 (AGENT): Add result highlighting and saved search management; write component tests.
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentSearch.tsx`, `artifacts/apex-os/src/components/documents/__tests__/DocumentSearch.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- DocumentSearch.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑003.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑004: Folder Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Folder tree is read-only. No folder CRUD modals, drag-and-drop file movement, or bulk operations exist.
**Size:** Small

**Description:** Full folder management: create/rename/delete folder modals, drag-and-drop file movement between folders, lazy-loading folder tree with expand/collapse, breadcrumb navigation with dropdown shortcuts, and bulk move with multi-select.

**Depends on:** FRONT‑DOCS‑001, API‑DOCS‑008
**Blocks:** FRONT‑INT‑DOCS
**Related Files:** `artifacts/apex-os/src/components/documents/FolderTree.tsx`, `artifacts/apex-os/src/components/documents/FolderManager.tsx`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; dnd-kit; Dialog, ContextMenu from shadcn/ui
- Exports: `FolderTree`, `FolderManager` components

**Definition of Done**
- [ ] Folder tree: lazy-loads children on expand; context menu on each folder: Rename, Delete, New Subfolder
- [ ] Create/rename/delete folder modals with name validation (no `/`, no empty names)
- [ ] Delete folder: confirmation dialog warns if folder contains files; requires reassignment or deletion of contents
- [ ] Drag-and-drop: drag file from document list → drop on folder in tree → `useMoveDocument` mutation fires; visual feedback during drag
- [ ] Bulk move: multi-select checkboxes on document rows → "Move to Folder" action bar → folder picker → confirm
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Folder-level permissions UI (Phase 6+)
- Shared folder collaboration (Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/FolderTree.tsx`, `artifacts/apex-os/src/components/documents/FolderManager.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/FolderManager.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — revert to read-only folder tree; remove CRUD components
- Halt condition: if folder deletion cascades to documents unexpectedly, stop and verify the API's soft-delete behaviour

**Rules to Follow**
- Folder name validation: max 255 characters, no `/`, no leading/trailing whitespace — validate client-side before API call
- Bulk move must send a single `PATCH /documents/bulk-move` request with an array of document IDs and the target folder ID

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- FolderManager.test.tsx
```

**Advanced Code Patterns**
- Context menu on folder tree items using Radix UI `ContextMenu` component
- Optimistic folder rename: update display name in cache immediately; roll back on error

**Anti-Patterns**
- Sending N individual PATCH requests for bulk move — always batch into one request
- Not showing file count in delete confirmation — users need to know what they are deleting

**DDD / TDD / BDD / Deep Module notes**
- DDD: Folder is a lightweight organisational entity; it does not own documents — documents reference their parent folder.
- TDD: Simulate create folder → assert `POST /folders` called; simulate drag file → assert `PATCH /documents/:id` with new `folder_id`.
- BDD: "As a firm user, I can create folders, move files between them, and delete empty folders."
- Deep Module: `FolderManager` hides folder CRUD mutations and bulk-move logic.

---

### Subtasks

- [ ] FRONT‑DOCS‑004.1 (AGENT): Build `FolderTree` with lazy-load expand/collapse and context menu.
  **File(s):** `artifacts/apex-os/src/components/documents/FolderTree.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑004.2 (AGENT): Implement create/rename/delete folder modals with validation.
  **File(s):** `artifacts/apex-os/src/components/documents/FolderManager.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑004.3 (AGENT): Add drag-and-drop file movement and bulk move action bar; write component tests.
  **File(s):** `artifacts/apex-os/src/components/documents/FolderManager.tsx`, `artifacts/apex-os/src/components/documents/__tests__/FolderManager.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- FolderManager.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑004.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑005: Document Request List UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No document request list UI exists. `API-DOCS-009` is not wired.
**Size:** Small

**Description:** Interface for firm to create document request lists (name, items with required flag, due date) and for clients to upload items. Firm view shows upload status and allows "Mark Reviewed" and "Send Reminder" actions.

**Depends on:** API‑DOCS‑009 (document request list API), FRONT‑DOCS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/DocumentRequestList.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `toast` from `sonner`
- Exports: `DocumentRequestList` component

**Definition of Done**
- [ ] Create request list form: name, description, due date, dynamic item rows (document name, required toggle); calls `useCreateDocumentRequest`
- [ ] Request list detail (firm view): items with status badges (`pending`/`uploaded`/`reviewed`); "Mark Reviewed" button per uploaded item; "Send Reminder" button calls `useSendDocumentReminder`
- [ ] Client view: list of requested items; upload button per item calls `useClientDocumentUpload`; status badges show progress
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass with MSW (create, review, reminder flows)

**Out of Scope**
- Automated reminders via schedule (Phase 7+)
- E-signature request within the document request flow (FRONT‑DOCS‑009)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/DocumentRequestList.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/DocumentRequestList.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `DocumentRequestList`; requests tab shows placeholder
- Halt condition: if reminder triggers emails without the API confirming recipient existence, stop and add recipient validation

**Rules to Follow**
- At least one item is required before a request list can be saved
- Due date must be in the future — validate client-side before API call

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- DocumentRequestList.test.tsx
```

**Advanced Code Patterns**
- Dynamic item rows: manage with `useFieldArray` from React Hook Form

**Anti-Patterns**
- Allowing request creation with zero items — validate minimum one item before submit

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document Request List is a collaboration aggregate bridging the firm and client bounded contexts.
- TDD: MSW returns request list; assert firm view shows items with status; simulate client upload → assert status updates to `uploaded`.
- BDD: "As a firm user, I can create a document checklist for a client and track which documents they have uploaded."
- Deep Module: `DocumentRequestList` hides request CRUD, reminder, and client upload flows.

---

### Subtasks

- [ ] FRONT‑DOCS‑005.1 (AGENT): Build request list creation form with dynamic item rows.
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentRequestList.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑005.2 (AGENT): Implement firm detail view (status, mark reviewed, send reminder) and client upload view.
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentRequestList.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- DocumentRequestList.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑005.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑006: Document Approval Workflow UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No approval workflow UI exists. `API-DOCS-010` is not wired.
**Size:** Medium

**Description:** Submit-for-approval dialog (select approvers, order, message), approver pending approvals list, approve/reject/comment actions with required comment on reject, and a full chronological workflow timeline.

**Depends on:** API‑DOCS‑010 (approval workflow API), FRONT‑DOCS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/ApprovalWorkflow.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; shadcn/ui Dialog, Timeline (custom or Radix)
- Exports: `ApprovalWorkflow` component

**Definition of Done**
- [ ] "Submit for Approval" dialog: approver selector (multi-user search), sequential vs parallel order toggle, optional message
- [ ] Approver dashboard tab: pending approvals list; click → document preview with Approve / Reject / Comment buttons
- [ ] Reject action: requires comment — blocks submit if empty
- [ ] Comment action: adds comment without advancing workflow state
- [ ] Submitter view: current step indicator, per-approver status badge, full workflow timeline (chronological)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Automated escalation if approver doesn't respond (Phase 7+)
- Mobile push notifications for pending approvals

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/ApprovalWorkflow.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/ApprovalWorkflow.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `ApprovalWorkflow`; approval tab shows placeholder
- Halt condition: if approval state machine allows skipping steps, stop and verify step ordering on the API

**Rules to Follow**
- Rejection requires a non-empty comment — block the submit button if comment field is empty
- Sequential approval: "Approve" button must only be enabled for the current step's approver — not all approvers simultaneously

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- ApprovalWorkflow.test.tsx
```

**Advanced Code Patterns**
- Workflow timeline: render a vertical timeline using CSS; each node has an icon (approve ✓, reject ✗, comment 💬)
- Use `useInfiniteQuery` for large approval histories

**Anti-Patterns**
- Showing the "Approve" button to non-current-step approvers — always gate by current user's role in the workflow

**DDD / TDD / BDD / Deep Module notes**
- DDD: Approval workflow is a process aggregate with a defined state machine (`draft → in_review → approved/rejected`).
- TDD: MSW returns pending approval; assert approve/reject buttons render; simulate reject without comment → assert button disabled; add comment → assert button enabled.
- BDD: "As an approver, I can approve or reject a document and leave a comment explaining my decision."
- Deep Module: `ApprovalWorkflow` hides the workflow state machine and sequential step enforcement.

---

### Subtasks

- [ ] FRONT‑DOCS‑006.1 (AGENT): Build submit-for-approval dialog and approver pending list.
  **File(s):** `artifacts/apex-os/src/components/documents/ApprovalWorkflow.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑006.2 (AGENT): Implement approve/reject/comment actions and workflow timeline.
  **File(s):** `artifacts/apex-os/src/components/documents/ApprovalWorkflow.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- ApprovalWorkflow.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑006.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑007: Document Version Comparison Viewer
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No version diff viewer exists. `API-DOCS-012` is not wired.
**Size:** Small

**Description:** Side-by-side diff viewer: version selector dropdowns, colour-coded additions/deletions/modifications, prev/next change navigation, and full-screen toggle.

**Depends on:** API‑DOCS‑012 (version comparison API), FRONT‑DOCS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/VersionDiff.tsx`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; `diffWords` from `diff` npm package
- Exports: `VersionDiff` component

**Definition of Done**
- [ ] Version A and Version B selector dropdowns (populated from `GET /api/v1/documents/:id/versions`)
- [ ] Side-by-side diff panel: additions highlighted in green, deletions in red, modifications in amber
- [ ] Prev/next navigation between diff blocks
- [ ] Full-screen toggle; ESC exits full-screen
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Binary file diff (images, PDFs) — text diff only in Phase 5
- Three-way merge view (Phase 8+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/VersionDiff.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/VersionDiff.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `VersionDiff`; version history shows list only (no diff)
- Halt condition: if API returns binary diff data (not text), stop and add a "Binary file — diff not available" placeholder

**Rules to Follow**
- Diff rendering must be safe — never use `dangerouslySetInnerHTML`; build diff spans programmatically from the `diff` library output
- Full-screen mode must trap focus within the viewer for accessibility

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- VersionDiff.test.tsx
```

**Advanced Code Patterns**
- Use the `diff` npm package's `diffWords` for word-level granularity instead of line-level
- Collect all diff block positions on render; `prev/next` navigates using `scrollIntoView`

**Anti-Patterns**
- `dangerouslySetInnerHTML` for highlighted diff — XSS risk; build spans from diff output array

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document versions are immutable snapshots within the Document aggregate.
- TDD: MSW returns two version contents; assert diff panel renders added/removed spans; simulate "Next" → assert scroll to next diff block.
- BDD: "As a firm user, I can compare two versions of a document and see what changed highlighted in colour."
- Deep Module: `VersionDiff` hides version loading, diff computation, and navigation.

---

### Subtasks

- [ ] FRONT‑DOCS‑007.1 (AGENT): Build version selector and side-by-side diff panel with `diff` library.
  **File(s):** `artifacts/apex-os/src/components/documents/VersionDiff.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑007.2 (AGENT): Add prev/next navigation and full-screen toggle; write component tests.
  **File(s):** `artifacts/apex-os/src/components/documents/VersionDiff.tsx`, `artifacts/apex-os/src/components/documents/__tests__/VersionDiff.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- VersionDiff.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑007.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑008: Secure Share Link Generator
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No secure share link UI exists. `API-DOCS-013` is not wired.
**Size:** Small

**Description:** Share link creation dialog (password, expiry date, max downloads, recipient verification), generated link with copy-to-clipboard, active links dashboard with revoke/edit, and access log.

**Depends on:** API‑DOCS‑013 (secure share link API), FRONT‑DOCS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/ShareLinkGenerator.tsx`

**Imports / Exports**
- Imports: `useMutation`, `useQuery` from `@tanstack/react-query`; shadcn/ui Dialog, Input
- Exports: `ShareLinkGenerator` component

**Definition of Done**
- [ ] "Share" button opens dialog: password (optional, toggled), expiry date picker, max downloads input, recipient email verification toggle
- [ ] Generated share link displayed in a read-only input with "Copy" button; clicking shows checkmark confirmation
- [ ] Active links dashboard: list of links with status (active/expired/revoked), download count, created date, "Revoke" and "Edit" actions
- [ ] Edit link: update password, expiry, max downloads; calls `useUpdateShareLink` mutation
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Watermarked document download (Phase 7+)
- Link analytics dashboard (Phase 8+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/ShareLinkGenerator.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/ShareLinkGenerator.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `ShareLinkGenerator`; share button disabled
- Halt condition: if share links can be accessed without the intended password, stop and verify the API enforces password validation

**Rules to Follow**
- Revoke is irreversible — show confirmation dialog before revoking
- Generated link must be displayed only once — not re-fetchable; "Copy before closing" warning shown in dialog

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- ShareLinkGenerator.test.tsx
```

**Advanced Code Patterns**
- `navigator.clipboard.writeText(link)` for copy-to-clipboard; fall back to `execCommand('copy')` for older browsers
- Show a 3-second checkmark animation on the copy button after successful copy

**Anti-Patterns**
- Storing the generated link in component state after dialog close — it should be cleared on close to prevent reuse without re-opening the dialog

**DDD / TDD / BDD / Deep Module notes**
- DDD: Share links are ephemeral access tokens for Document aggregates; they have their own lifecycle (create → expire/revoke).
- TDD: Simulate create share link → assert link URL shown; simulate "Revoke" → assert confirmation shown → confirm → assert link status changes to revoked.
- BDD: "As a firm user, I can generate a secure share link for a document with an expiry date and password."
- Deep Module: `ShareLinkGenerator` hides link creation, clipboard API, and revocation logic.

---

### Subtasks

- [ ] FRONT‑DOCS‑008.1 (AGENT): Build share link creation dialog and copy-to-clipboard display.
  **File(s):** `artifacts/apex-os/src/components/documents/ShareLinkGenerator.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑008.2 (AGENT): Build active links dashboard with revoke/edit actions; write component tests.
  **File(s):** `artifacts/apex-os/src/components/documents/ShareLinkGenerator.tsx`, `artifacts/apex-os/src/components/documents/__tests__/ShareLinkGenerator.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- ShareLinkGenerator.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑008.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑009: E‑Signature Template Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No e-signature template builder exists. `API-DOCS-015` is not wired.
**Size:** Medium

**Description:** Reusable e-signature template builder: signer role management, drag-and-drop signature field placement on document preview, bulk send with CSV recipient upload, and template list with edit/duplicate/delete.

**Depends on:** API‑DOCS‑015 (advanced e-sign API), FRONT‑DOCS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/ESignTemplateBuilder.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; dnd-kit; `useDropzone` for CSV upload
- Exports: `ESignTemplateBuilder` component

**Definition of Done**
- [ ] Template creation: name input, signer roles (add/remove, sequential/parallel order toggle)
- [ ] Drag-and-drop signature field placement on sample document page preview; field coordinates saved as `{ x, y, page, signerRole }`
- [ ] Bulk send: CSV upload with column preview; `useCreateBulkSignatureRequests` mutation; shows progress count
- [ ] Template list: name, signer count, field count, usage count; edit/duplicate/delete actions
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- In-browser document editing before sending (Phase 7+)
- DocuSign/Adobe Sign synchronisation (Phase 8+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/ESignTemplateBuilder.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/ESignTemplateBuilder.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `ESignTemplateBuilder`; e-sign tab shows placeholder
- Halt condition: if bulk send creates duplicate signature requests, stop and add idempotency key to the bulk mutation

**Rules to Follow**
- At least one signer role and one signature field are required before a template can be saved
- CSV bulk send must preview recipients before sending — never auto-send without user confirmation

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- ESignTemplateBuilder.test.tsx
```

**Advanced Code Patterns**
- Signature field placement: use a `<canvas>` overlay on the document preview image; convert click coordinates to percentage-based positions (device-independent)
- CSV parsing: use `papaparse` for robust browser-side CSV parsing with header detection

**Anti-Patterns**
- Storing field positions as absolute pixel coordinates — breaks when the document preview scales; use percentage-based coordinates

**DDD / TDD / BDD / Deep Module notes**
- DDD: E-signature templates are factory configurations that produce SignatureRequest aggregates via bulk send.
- TDD: Simulate add signer role → assert role appears; simulate drag field → assert coordinate stored; simulate bulk send → assert `POST /signature-requests/bulk` called.
- BDD: "As a firm user, I can create a reusable e-signature template and bulk-send it to a list of recipients from a CSV."
- Deep Module: `ESignTemplateBuilder` hides field placement coordinates, CSV parsing, and bulk request creation.

---

### Subtasks

- [ ] FRONT‑DOCS‑009.1 (AGENT): Build signer role management and drag-and-drop field placement.
  **File(s):** `artifacts/apex-os/src/components/documents/ESignTemplateBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑009.2 (AGENT): Implement CSV bulk send with preview; build template list with CRUD.
  **File(s):** `artifacts/apex-os/src/components/documents/ESignTemplateBuilder.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- ESignTemplateBuilder.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑009.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑010: Document Annotation & Feedback Viewer
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No document annotation UI exists. `API-DOCS-011` is not wired.
**Size:** Medium

**Description:** In-browser annotation viewer: comment sidebar grouped by document section, click-to-comment on document area, threaded replies, resolve/reopen toggle, highlight and suggestion annotation types, and 30-second polling for new comments.

**Depends on:** API‑DOCS‑011 (document annotation API), FRONT‑DOCS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/DocumentAnnotations.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; shadcn/ui Popover
- Exports: `DocumentAnnotations` component

**Definition of Done**
- [ ] Comment sidebar lists all annotations grouped by document section; clicking an annotation navigates to that section
- [ ] Click-to-comment: clicking on the document area opens a popover input; submit calls `useCreateAnnotation` mutation
- [ ] Threaded replies visible under each top-level comment; "Reply" button expands inline input
- [ ] Resolve toggle: resolved threads show green check and collapse; "Reopen" restores
- [ ] Highlight (yellow) and suggestion (blue) annotation types rendered with distinct visual styling
- [ ] 30-second polling: `refetchInterval: 30_000` on annotation list query
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time WebSocket updates (Phase 7+)
- Annotation on binary files (images/PDFs) — text documents only in Phase 5

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/DocumentAnnotations.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/DocumentAnnotations.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `DocumentAnnotations`; document viewer shows read-only
- Halt condition: if polling returns annotations for documents belonging to other tenants, stop immediately and verify tenant scoping in the API

**Rules to Follow**
- Click coordinates must be converted to percentage-based positions (same rule as e-signature fields)
- Comment text input must strip HTML — store and display as plain text only; no rich text in Phase 5

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- DocumentAnnotations.test.tsx
```

**Advanced Code Patterns**
- Sidebar groups annotations by `section_id` using `Object.groupBy` (ES2024) or `reduce`
- `refetchInterval` combined with `staleTime: 25_000` prevents cache from going stale between polls

**Anti-Patterns**
- Rendering annotation comment text with `innerHTML` — plain text only; no HTML injection risk
- Polling every second — 30-second polling is sufficient for collaborative annotation; real-time is Phase 7

**DDD / TDD / BDD / Deep Module notes**
- DDD: Annotations are domain events attached to a Document aggregate; they do not modify the document content.
- TDD: MSW returns annotations; assert sidebar groups by section; simulate click-to-comment → assert `POST /annotations` called; simulate "Resolve" → assert annotation status updates.
- BDD: "As a firm user, I can annotate a document and my colleagues can reply to my comments."
- Deep Module: `DocumentAnnotations` hides polling, position computation, and threading logic.

---

### Subtasks

- [ ] FRONT‑DOCS‑010.1 (AGENT): Build comment sidebar with section grouping and click-to-comment.
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentAnnotations.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑010.2 (AGENT): Add threaded replies, resolve/reopen toggle, 30-second polling; write component tests.
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentAnnotations.tsx`, `artifacts/apex-os/src/components/documents/__tests__/DocumentAnnotations.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- DocumentAnnotations.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑010.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑DOCS‑011: Word-Based Document Template Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Word-based template upload or field-mapping UI exists. `POST /api/v1/document-templates` is not wired.
**Size:** Medium

**Description:** Templates tab in Documents: upload a `.docx` file as a template, map `{{variables}}` to CRM/entity fields, and generate pre-filled documents from entity detail pages via a "New from Template" action.

**Depends on:** API‑DOCS‑004 (document templates sub-resource), DOC‑STORAGE‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/documents/WordTemplateBuilder.tsx`

**Imports / Exports**
- Imports: `useMutation`, `useQuery` from `@tanstack/react-query`; `useDropzone` for `.docx` upload
- Exports: `WordTemplateBuilder` component; `NewFromTemplateButton` component

**Definition of Done**
- [ ] Templates tab: list of uploaded templates (name, variable count, usage count); "Upload Template" button
- [ ] Upload template: drag-and-drop `.docx` file; API extracts `{{variable}}` placeholders; displays extracted variables
- [ ] Field mapping UI: map each `{{variable}}` to a CRM/project entity field using a searchable Select; save mapping
- [ ] "New from Template" button on entity detail pages (Contact, Deal, Project): select a template → preview the variable values to be substituted → confirm → generated document appears in Documents list
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- PDF generation (server-side; Phase 6+)
- Template variable nesting (e.g., `{{deal.contact.name}}` — Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/documents/WordTemplateBuilder.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/documents/__tests__/WordTemplateBuilder.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `WordTemplateBuilder` and `NewFromTemplateButton`; templates tab shows placeholder
- Halt condition: if template generation produces a corrupted `.docx`, stop and verify the API's `docxtemplater` configuration

**Rules to Follow**
- Only `.docx` files accepted for template upload — reject `.doc`, `.pdf` client-side before API call
- Variable mapping must use only approved field paths from the API's field registry — do not allow arbitrary JSON path input

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- WordTemplateBuilder.test.tsx
```

**Advanced Code Patterns**
- Field mapping: render a table of `{{variable}}` → `Select` pairs; the Select options come from `GET /api/v1/field-registry?entity=contact`
- "New from Template" generates a preview of substituted values before creating the document — dry-run API call

**Anti-Patterns**
- Accepting arbitrary entity field paths as mapping values — always use the field registry endpoint to constrain options

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document Template is a factory configuration in the Documents bounded context; the generated Document is a new aggregate instance.
- TDD: MSW returns extracted variables from uploaded template; assert mapping UI shows them; simulate "New from Template" → assert `POST /documents/from-template` called with entity ID.
- BDD: "As a firm user, I can upload a Word document template and generate pre-filled documents for any contact with one click."
- Deep Module: `WordTemplateBuilder` hides template upload, variable extraction, and generation flow.

---

### Subtasks

- [ ] FRONT‑DOCS‑011.1 (AGENT): Build template list, upload flow, and variable mapping UI.
  **File(s):** `artifacts/apex-os/src/components/documents/WordTemplateBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DOCS‑011.2 (AGENT): Implement `NewFromTemplateButton` with preview and generation flow; write component tests.
  **File(s):** `artifacts/apex-os/src/components/documents/WordTemplateBuilder.tsx`, `artifacts/apex-os/src/components/documents/__tests__/WordTemplateBuilder.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- WordTemplateBuilder.test.tsx` → GREEN.

- [ ] FRONT‑DOCS‑011.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INT‑DOCS: Documents Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Download, soft-delete, and folder CRUD mutations are not wired. No interactive mutations exist in the Documents page.
**Size:** Small

**Description:** Wire all core Documents mutations: file upload (FRONT‑DOCS‑002), download via signed URL, soft-delete with undo, folder CRUD (FRONT‑DOCS‑004). All mutations show sonner toast feedback.

**Depends on:** FRONT‑DOCS‑001, FRONT‑DOCS‑002, FRONT‑DOCS‑004, FRONT‑INFRA‑003, FRONT‑INFRA‑004
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/Documents.tsx`, `artifacts/apex-os/src/hooks/documents/`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; `useUndoableMutation` (FRONT‑INFRA‑004); `toast` from `sonner`
- Exports: `useUploadDocument()`, `useDownloadDocument()`, `useDeleteDocument()`, `useCreateFolder()`, `useRenameFolder()`, `useDeleteFolder()`

**Definition of Done**
- [ ] Upload action wired to `FileUpload` component (FRONT‑DOCS‑002); on success invalidates `['documents', folderId]`
- [ ] Download button fetches `signed_download_url` via `GET /api/v1/documents/:id/download-url` then triggers browser download
- [ ] Soft-delete → `useDeleteDocument` via `useUndoableMutation` (FRONT‑INFRA‑004); undo toast with 5-second window
- [ ] Folder CRUD mutations wired (FRONT‑DOCS‑004): create/rename/delete folders with cache invalidation
- [ ] All mutations disable the relevant button during `isPending`
- [ ] Integration tests with MSW cover upload, download, delete, and undo paths

**Out of Scope**
- Bulk delete (Phase 6+)
- Permanent delete with purge (requires additional confirmation flow)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/documents/useDeleteDocument.ts`, `artifacts/apex-os/src/hooks/documents/useDownloadDocument.ts`, `artifacts/apex-os/src/hooks/documents/useCreateFolder.ts`, `artifacts/apex-os/src/pages/Documents.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/documents-interactive.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — comment out mutation wiring; buttons revert to non-functional
- Halt condition: if soft-delete cannot be reversed via the undo API, stop and verify the API supports restoration before using `useUndoableMutation`

**Rules to Follow**
- Download must use `signed_download_url` from the API — never expose storage bucket URLs directly to the client
- Soft-delete must use `useUndoableMutation` — no permanent deletes without explicit UI confirmation and Phase 6 purge workflow

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- documents-interactive.test.tsx
```

**Advanced Code Patterns**
- Download: `fetch(signedUrl).then(r => r.blob()).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click() })` — avoids new tab pop-up
- Invalidate `['documents', folderId]` not `['documents']` globally — scoped invalidation prevents refetching all folders

**Anti-Patterns**
- Passing raw storage bucket URLs to download link — signed URLs expire; always fetch a fresh one immediately before download
- Invalidating all queries after every document mutation — causes unnecessary refetches across all modules

**DDD / TDD / BDD / Deep Module notes**
- DDD: Documents interactive mutations enforce access control via signed URLs and soft-delete domain events.
- TDD: Simulate delete button click → assert `PATCH /documents/:id` called with `{ deleted_at: now }` → assert undo toast shown → simulate undo click → assert restore mutation called.
- BDD: "As a firm user, I can download a document, delete it with an undo option, and upload new files."
- Deep Module: Each mutation hook hides signed URL lifecycle, cache invalidation, and undo state.

---

### Subtasks

- [ ] FRONT‑INT‑DOCS.0.25 (AGENT): List all Documents mutation surfaces; map to API endpoints.
  *No action — pause until fully understood.*

- [ ] FRONT‑INT‑DOCS.1 (AGENT): Implement `useDownloadDocument` and `useDeleteDocument` (with `useUndoableMutation`).
  **File(s):** `artifacts/apex-os/src/hooks/documents/useDownloadDocument.ts`, `artifacts/apex-os/src/hooks/documents/useDeleteDocument.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑DOCS.2 (AGENT): Wire upload (from FRONT‑DOCS‑002) and folder CRUD mutations.
  **File(s):** `artifacts/apex-os/src/hooks/documents/useCreateFolder.ts`, `artifacts/apex-os/src/hooks/documents/useRenameFolder.ts`, `artifacts/apex-os/src/pages/Documents.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑DOCS.3 (AGENT): Write integration tests covering upload, download, delete, undo, and folder CRUD.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/documents-interactive.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- documents-interactive.test.tsx` → GREEN.

- [ ] FRONT‑INT‑DOCS.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---
