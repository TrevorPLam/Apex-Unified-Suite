# TODO-P5-DOCUMENTS.md – Documents Frontend Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Documents Data Integration including file management, workflows, e-signature, and advanced document features.

---

## Documents Data Integration

### [ ] FRONT‑DOCS‑001: Documents & Folders – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑004 (documents green), API‑DOCS‑008 (folders green).  
**Definition of Done:** Document list and folder tree views use `useDocumentList` and `useFolderList` hooks. File type icons, size formatting, and date display. All mock data imports completely removed from Documents components and hooks. Component tests pass with MSW mocks. Manual testing confirms folder navigation and file browsing work correctly.  
**Related Files:** `artifacts/apex-os/src/pages/Documents.tsx`, `artifacts/apex-os/src/hooks/useDocuments.ts`

**DDD:** Documents bounded context frontend; folder hierarchy and file metadata views.  
**Deep Module:** Documents frontend module encapsulates file/folder management, navigation, and display logic. The module provides a unified interface for document operations while hiding the complexity of API calls, file type handling, and hierarchical navigation behind React Query hooks and well-organized components.

**TDD:** Component test with MSW – documents render in list; folder tree shows hierarchy; empty folder shows empty state.

**BDD:** "As a user, I can browse my documents and folders."

**Subtasks:**
- [ ] FRONT‑DOCS‑001.1: Create `useDocumentList` and `useFolderList` hooks with pagination and folder filtering. (AGENT) – `src/hooks/documents/useDocumentList.ts`, `useFolderList.ts`  
  **verification:** Hooks return typed data; `pnpm typecheck` passes.
- [ ] FRONT‑DOCS‑001.2: Replace mock document data in list view with API data; show loading skeleton during fetch. (AGENT) – `src/pages/Documents.tsx`  
  **verification:** Documents render from MSW mock; skeleton appears then disappears.
- [ ] FRONT‑DOCS‑001.3: Replace mock folder data in tree view; wire folder click to filter documents. (AGENT)  
  **verification:** Clicking folder filters document list; breadcrumb navigation updates.
- [ ] FRONT‑DOCS‑001.4: Remove all `mockData` imports from Documents page. (AGENT)  
  **verification:** File has no remaining mock data references.

---

### [ ] FRONT‑DOCS‑002: Basic File Upload Component
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑DOCS‑001, API‑DOCS‑004.  
**Definition of Done:** Basic file upload interface with drag‑and‑drop zone, file type validation, size limits, and progress indicators. Single file upload with error handling.  
**Related Files:** `artifacts/apex-os/src/components/documents/FileUpload.tsx`

**DDD:** Infrastructure component for document ingestion.  
**TDD:** Component test – upload a file, verify progress bar updates, verify success callback, verify error handling on network failure (MSW simulates failure).  
**BDD:** "As a user, I can upload files via drag‑and‑drop with progress feedback."

**Rules to Follow (Frontend):**
- Use TanStack Query for upload mutations
- Implement proper error handling with user feedback
- Show loading states during uploads
- Validate file types and sizes on client side
- Use TypeScript interfaces from generated API types
- Test all upload scenarios with MSW
- Handle network failures gracefully
- Provide clear success/error feedback

**Subtasks:**
- [ ] FRONT‑DOCS‑002.1: Build drag‑and‑drop upload zone component with file type/size validation. (AGENT) – `src/components/documents/FileUpload.tsx`  
  **verification:** `npm test -- file-upload-zone.test.tsx` - drop zone highlights on drag; invalid file type shows error message; size limit enforced.
- [ ] FRONT‑DOCS‑002.2: Implement upload progress tracking with progress bar component. (AGENT)  
  **verification:** `npm test -- upload-progress.test.tsx` - progress bar updates during upload; completion triggers success callback.
- [ ] FRONT‑DOCS‑002.3: Add error handling and retry logic for failed uploads. (AGENT)  
  **verification:** `npm test -- upload-error-handling.test.tsx` - failed uploads show retry button; retry succeeds.

---

### [ ] FRONT‑DOCS‑002.5: Advanced Upload Features
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑DOCS‑002, DOC‑INFRA‑002 (chunked upload).  
**Definition of Done:** Advanced upload features including batch upload queue, chunked upload for large files, and responsive mobile design.  
**Related Files:** `artifacts/apex-os/src/components/documents/FileUploadQueue.tsx`, `useChunkedUpload.ts`

**Subtasks:**
- [ ] FRONT‑DOCS‑002.5.1: Add batch upload queue with individual file status (queued, uploading, done, error). (AGENT) – `src/components/documents/FileUploadQueue.tsx`  
  **verification:** `npm test -- upload-queue.test.tsx` - multiple files can be added; each shows independent progress; retry button on failed files.
- [ ] FRONT‑DOCS‑002.5.2: Integrate chunked upload for large files via `useChunkedUpload` hook. (AGENT)  
  **verification:** `npm test -- chunked-upload.test.tsx` - files > 100 MB use chunked endpoint; pause/resume works.
- [ ] FRONT‑DOCS‑002.5.3: Add responsive layout for mobile. (AGENT)  
  **verification:** `npm test -- upload-responsive.test.tsx` - upload zone adapts to small screens; touch events work.

---

### [ ] FRONT‑DOCS‑003: Advanced Search & Filtering Interface
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑DOCS‑001.  
**Definition of Done:** Advanced search capabilities:  
- Full‑text search across document names and content metadata (using API‑SEARCH‑001 for documents scope or dedicated document search).  
- Filter by file type, date range, folder, size with multi‑select.  
- Advanced sorting options (name, date, size, type) with direction toggle.  
- Search result highlighting and snippet preview.  
- Saved search filters with quick access shortcuts.  
- Real‑time search suggestions and auto‑complete.  
**Related Files:** `artifacts/apex-os/src/components/documents/DocumentSearch.tsx`, `SearchFilters.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑003.1: Build search bar with auto‑complete and suggestion dropdown. (AGENT)  
  **verification:** Typing shows suggestions; selecting navigates to result.
- [ ] FRONT‑DOCS‑003.2: Implement filter panel with file type, date range, folder, size multi‑select. (AGENT)  
  **verification:** Applying filters updates document list; clear filters resets.
- [ ] FRONT‑DOCS‑003.3: Add sorting controls with direction toggle. (AGENT)  
  **verification:** Clicking column header sorts; second click reverses.
- [ ] FRONT‑DOCS‑003.4: Implement saved search management (save, load, delete). (AGENT)  
  **verification:** Save current filters as named view; load from saved views dropdown.
- [ ] FRONT‑DOCS‑003.5: Add result highlighting in document list. (AGENT)  
  **verification:** Search terms highlighted in document names and snippets.

---

### [ ] FRONT‑DOCS‑004: Folder Management UI
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑DOCS‑001, API‑DOCS‑008.  
**Definition of Done:** Enhanced folder operations:  
- Create/rename/delete folders with modal dialogs and validation.  
- Drag‑and‑drop file organisation between folders with visual feedback.  
- Folder breadcrumb navigation with dropdown shortcuts.  
- Folder tree view with expand/collapse and lazy loading.  
- Bulk move operations with multi‑select and progress tracking.  
- Folder permission indicators and sharing status badges.  
**Related Files:** `artifacts/apex-os/src/components/documents/FolderManager.tsx`, `FolderTree.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑004.1: Build folder tree component with expand/collapse and lazy loading. (AGENT) – `src/components/documents/FolderTree.tsx`  
  **verification:** Tree renders; clicking expand loads children; lazy loading on large trees.
- [ ] FRONT‑DOCS‑004.2: Implement create/rename/delete folder modals with validation. (AGENT)  
  **verification:** Create folder → appears in tree; rename → name updates; delete → confirmation dialog, folder removed.
- [ ] FRONT‑DOCS‑004.3: Add drag‑and‑drop file movement between folders. (AGENT)  
  **verification:** Drag file to folder → file moves; API called; visual feedback during drag.
- [ ] FRONT‑DOCS‑004.4: Implement breadcrumb navigation with dropdown shortcuts. (AGENT)  
  **verification:** Breadcrumbs reflect current path; dropdown allows jumping to parent levels.
- [ ] FRONT‑DOCS‑004.5: Add bulk move with multi‑select checkboxes. (AGENT)  
  **verification:** Select multiple files → move to folder action → all files relocated.

---

### [ ] FRONT‑DOCS‑005: Document Request List UI
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑009 (document request list API).  
**Definition of Done:** Interface for creating and managing document request lists:  
- Create request list: name, description, due date, items (document name, required flag).  
- View request list detail: item status (pending, uploaded, reviewed).  
- Client view: see what's requested, upload button per item, status indicators.  
- Firm view: review uploaded documents, mark as reviewed, send reminder.  
- Reminder button triggers email to client.  
**Related Files:** `artifacts/apex-os/src/components/documents/DocumentRequestList.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑005.1: Build request list creation form with dynamic item rows. (AGENT)  
  **verification:** Add/remove items; save creates list via API.
- [ ] FRONT‑DOCS‑005.2: Implement request list detail view with status columns. (AGENT)  
  **verification:** Items show pending/uploaded/reviewed status; uploaded files linked.
- [ ] FRONT‑DOCS‑005.3: Build client‑facing view with upload buttons per item. (AGENT)  
  **verification:** Client sees requested documents; uploads file; status updates.
- [ ] FRONT‑DOCS‑005.4: Add review actions (mark reviewed, send reminder). (AGENT)  
  **verification:** Mark reviewed updates status; reminder triggers API call.
- [ ] FRONT‑DOCS‑005.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑DOCS‑006: Document Approval Workflow UI
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑010 (approval workflow API).  
**Definition of Done:** Approval workflow interface:  
- Submit document for approval: select approvers, set order, add message.  
- Approver view: pending approvals list, document preview, approve/reject/comment buttons.  
- Submitter view: workflow status, current step, approver responses.  
- Full workflow timeline showing all actions chronologically.  
- Notifications for pending approvals (via in‑app notification system).  
**Related Files:** `artifacts/apex-os/src/components/documents/ApprovalWorkflow.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑006.1: Build submit‑for‑approval dialog with approver selection. (AGENT)  
  **verification:** Select users, set order, submit; workflow created.
- [ ] FRONT‑DOCS‑006.2: Implement approver dashboard showing pending items. (AGENT)  
  **verification:** Pending approvals listed; click opens document with action buttons.
- [ ] FRONT‑DOCS‑006.3: Build approve/reject/comment actions with confirmation. (AGENT)  
  **verification:** Approve advances workflow; reject with comment required; comment adds without advancing.
- [ ] FRONT‑DOCS‑006.4: Create workflow timeline component showing all actions. (AGENT)  
  **verification:** Timeline shows each step, approver, action, timestamp, comments.
- [ ] FRONT‑DOCS‑006.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑DOCS‑007: Document Version Comparison Viewer
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑012 (version comparison API).  
**Definition of Done:** Side‑by‑side diff viewer:  
- Two‑panel layout showing old version (left) and new version (right).  
- Colour‑coded additions (green), deletions (red), and modifications (yellow).  
- Version selector dropdown to choose which versions to compare.  
- Navigation between differences (prev/next change buttons).  
- Full‑screen mode for detailed review.  
**Related Files:** `artifacts/apex-os/src/components/documents/VersionDiff.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑007.1: Build version selector with dropdowns for version A and version B. (AGENT)  
  **verification:** Selecting versions triggers API call for diff data.
- [ ] FRONT‑DOCS‑007.2: Implement side‑by‑side diff display with colour‑coding. (AGENT)  
  **verification:** Additions shown in green, deletions in red, modifications highlighted.
- [ ] FRONT‑DOCS‑007.3: Add previous/next change navigation. (AGENT)  
  **verification:** Buttons scroll to next/previous diff block.
- [ ] FRONT‑DOCS‑007.4: Add full‑screen toggle. (AGENT)  
  **verification:** Expands to full viewport; ESC exits.
- [ ] FRONT‑DOCS‑007.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑DOCS‑008: Secure Share Link Generator
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑013 (secure share link API).  
**Definition of Done:** Share link creation interface:  
- Generate link dialog: set password (optional), expiry date, max downloads, recipient verification toggle.  
- Generated link displayed with copy‑to‑clipboard button.  
- Active links dashboard: list all share links with status (active, expired, revoked), download count, access log.  
- Revoke button for active links.  
- Edit link: update password, expiry, or download limit.  
**Related Files:** `artifacts/apex-os/src/components/documents/ShareLinkGenerator.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑008.1: Build share link creation dialog with all options. (AGENT)  
  **verification:** Set password, expiry, max downloads; generate returns link URL.
- [ ] FRONT‑DOCS‑008.2: Implement copy‑to‑clipboard with visual feedback. (AGENT)  
  **verification:** Click copies link; toast confirms.
- [ ] FRONT‑DOCS‑008.3: Create active links dashboard with status badges and usage stats. (AGENT)  
  **verification:** Links listed; download count visible; expired links show warning.
- [ ] FRONT‑DOCS‑008.4: Add revoke and edit actions. (AGENT)  
  **verification:** Revoke immediately disables link; edit updates settings.
- [ ] FRONT‑DOCS‑008.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑DOCS‑009: E‑Signature Template Builder
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑015 (advanced e‑sign API).  
**Definition of Done:** Reusable signature template builder:  
- Create template: name, add signer roles (signer 1, signer 2, etc.), set routing order.  
- Drag‑and‑drop signature field placement on a sample document page.  
- Bulk send: upload CSV of recipients and auto‑generate signature requests.  
- Template list with edit, duplicate, and delete actions.  
**Related Files:** `artifacts/apex-os/src/components/documents/ESignTemplateBuilder.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑009.1: Build template creation form with signer role management. (AGENT)  
  **verification:** Add/remove signer roles; set sequential or parallel order.
- [ ] FRONT‑DOCS‑009.2: Implement drag‑and‑drop signature field placement on document preview. (AGENT)  
  **verification:** Drag field to position; coordinates saved; multiple fields supported.
- [ ] FRONT‑DOCS‑009.3: Add bulk send with CSV upload and recipient preview. (AGENT)  
  **verification:** Upload CSV; preview recipients; send creates multiple requests.
- [ ] FRONT‑DOCS‑009.4: Build template list with management actions. (AGENT)  
  **verification:** Templates listed; edit/duplicate/delete work.
- [ ] FRONT‑DOCS‑009.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑DOCS‑010: Document Annotation & Feedback Viewer
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑011 (document annotation API).  
**Definition of Done:** In‑browser annotation and feedback tools:  
- Comment sidebar showing all annotations grouped by document section.  
- Add comment: click on document area, type comment, submit.  
- Threaded replies to comments.  
- Resolve/reopen comment threads.  
- Highlight and suggestion annotation types (visual distinction).  
- Real‑time or near‑real‑time updates when others comment (polling initially).  
**Related Files:** `artifacts/apex-os/src/components/documents/DocumentAnnotations.tsx`

**Subtasks:**
- [ ] FRONT‑DOCS‑010.1: Build comment sidebar with section grouping. (AGENT)  
  **verification:** Annotations listed by section; click navigates to that part of document.
- [ ] FRONT‑DOCS‑010.2: Implement click‑to‑comment on document viewer. (AGENT)  
  **verification:** Click area → comment input appears; submit creates annotation.
- [ ] FRONT‑DOCS‑010.3: Build threaded reply UI within each comment. (AGENT)  
  **verification:** Reply to comment creates nested thread; all replies visible.
- [ ] FRONT‑DOCS‑010.4: Add resolve/reopen toggle with visual state change. (AGENT)  
  **verification:** Resolved comments collapse or show green check; reopen restores.
- [ ] FRONT‑DOCS‑010.5: Add polling for new comments (30‑second interval). (AGENT)  
  **verification:** New comments from other users appear without manual refresh.
- [ ] FRONT‑DOCS‑010.6: Component test with MSW. (AGENT)

---

### [ ] FRONT‑DOCS‑011: Document Template Builder (Word‑based)
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑004, DOC‑STORAGE‑001  
**Why updated:** ShareFile allows users to create Word‑based templates with autofill fields that map to CRM or other data. Currently missing.  
**Definition of Done:**
- `POST /api/v1/document‑templates` – upload a .docx file as a template, with optional field mappings (e.g., `{{contact.name}}` maps to `contacts.full_name`).  
- `GET /api/v1/document‑templates/{templateId}/render` – generate a new document by substituting mapped fields with actual data from a given entity (contact, deal, project).  
- Frontend: a "Templates" tab in the Documents module that lists available templates, and a "New from Template" action on entity detail pages.  
**BDD:** "When I click 'New from Template' on a contact, a pre‑filled document is generated with the contact's name and company."  
**TDD:** Integration test verifying template upload, field mapping, and document generation with real data.  
**Deep Module:** Encapsulates template management, field mapping logic, and document generation workflow.

**Advanced Code Patterns:**  
- Word document parsing and template variable extraction  
- Dynamic field mapping with validation  
- Document generation with data substitution  
- Template management with versioning  

**Anti-Patterns:**  
- Missing field validation allowing invalid template variables  
- Hard-coded entity mappings without flexibility  
- No template preview before generation  
- Missing error handling for malformed Word documents  

**Frontend Components:**  
- Template upload component with drag-and-drop  
- Field mapping interface with autocomplete  
- Template gallery with preview thumbnails  
- "New from Template" action buttons on entity pages  

**API Integration:**  
- Template upload and storage endpoints  
- Field extraction and mapping validation  
- Document generation with data substitution  
- Template listing and management  

---

### [ ] FRONT‑INT‑DOCS: Documents Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑DOCS‑001 through FRONT‑DOCS‑010.  
**Definition of Done:**  
- File upload (multipart or chunked, with progress) → `useUploadDocument` mutation.  
- Download via signed URL → click triggers download from `signed_download_url`.  
- Soft delete → `useDeleteDocument` mutation, optimistic removal from list.  
- Folder create/rename → mutations with cache invalidation.  
- All mutations show toast notifications.
- All interactive features tested with MSW mocks.
- Error handling provides clear user feedback.

**Deep Module:** Documents interactive features module encapsulates all user interactions, mutation handling, and state management. The module provides a unified interface for document operations while hiding the complexity of API calls, optimistic updates, and error handling behind well-defined hooks and components.

**TDD:** Integration tests with MSW verify all interactive features work correctly. Tests cover file uploads, downloads, delete operations, folder management, and error scenarios. Each interaction is tested for both success and error paths.

**Anti-Patterns (Frontend):**
- Manual state management instead of React Query
- Direct file handling without progress tracking
- Missing optimistic updates for delete operations
- Unhandled mutation errors
- Inconsistent error handling patterns
- Not invalidating queries after successful mutations
- Missing loading states during uploads
- Hardcoded API endpoints

**Subtasks:**
- [ ] FRONT‑INT‑DOCS.1: Wire upload mutation with progress callback. (AGENT)  
- [ ] FRONT‑INT‑DOCS.2: Wire download via signed URL (GET document, use returned URL). (AGENT)  
- [ ] FRONT‑INT‑DOCS.3: Wire soft delete with confirmation dialog and toast. (AGENT)  
- [ ] FRONT‑INT‑DOCS.4: Wire folder CRUD mutations. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Documents components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Documents pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard document metrics depend on Documents API integration
- **TODO-P5-CRM.md**: CRM document links depend on CRM integration

### Related Master Tracker Tasks
- **API‑DOCS‑004**: Documents API must be green before FRONT‑DOCS‑001
- **API‑DOCS‑008**: Folders API must be green before FRONT‑DOCS‑001
- **DOC‑INFRA‑002**: Chunked upload infrastructure must be complete before FRONT‑DOCS‑002

---

## Verification Commands

### Documents Integration Verification
```bash
# Core Documents verification
npm test -- useDocumentList.test.ts
npm test -- useFolderList.test.ts

# File management verification
npm test -- file-upload.test.tsx
npm test -- folder-manager.test.tsx
npm test -- document-search.test.tsx

# Workflow verification
npm test -- document-request-list.test.tsx
npm test -- approval-workflow.test.tsx
npm test -- version-diff.test.tsx
npm test -- share-link-generator.test.tsx

# E-signature verification
npm test -- esign-template-builder.test.tsx
npm test -- document-annotations.test.tsx

# Interactive features verification
npm test -- documents-interactive.test.tsx

# Manual verification
# Navigate to Documents page, verify all data loads from API
# Test file upload with progress tracking
# Test folder operations and file management
# Test advanced features (search, workflows, e-signature)
```

---

## Completion Criteria

### Documents Frontend Integration Complete When:
1. All Documents data (files, folders, metadata) loads from APIs
2. File upload works with progress tracking and chunked upload for large files
3. Advanced features (search, workflows, e-signature, annotations) are functional
4. Folder management provides intuitive document organization
5. Document workflows (requests, approvals, sharing) work end-to-end
6. All mock data imports are removed from Documents components
7. Component tests pass with MSW mocks
8. Manual testing confirms complete Documents functionality
9. Real-time features (annotations, notifications) work correctly

**Estimated Timeline:** 12-15 days with parallel execution
