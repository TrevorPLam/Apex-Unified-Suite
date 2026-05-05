# tasks/documents/DOCUMENTS‑SHARING.md – Documents: Sharing, E‑Sign & Collaboration

This file covers advanced document features within the Document Management bounded context: secure share links with access logging, e‑signature requests and webhooks, document annotation and feedback, version comparison viewer, approval workflows, document request lists, and Word‑based template generation. These features build on core document CRUD to provide ShareFile‑style collaboration and sharing capabilities.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Backlog Additions – 2026‑05‑05

| Task ID | Description | Depends On |
|---------|-------------|------------|
| API‑DOCS‑012 | Document version comparison endpoint | `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑014` |
| API‑DOCS‑015 | E-signature template CRUD | `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑010` |
| API‑ESIGN‑005 | eIDAS SES/AES/QES support planning and API flags | `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑015` |

### Subtasks
- [ ] API‑DOCS‑012.1 (AGENT): Define compare request/response contract and diff format.
- [ ] API‑DOCS‑015.1 (AGENT): Add reusable template CRUD for signature workflows.
- [ ] API‑ESIGN‑005.1 (AGENT): Define signature assurance levels and capability flags.

---

## API – Secure Share Links

### [ ] API‑DOCS‑013: Secure Share Link API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No share link API exists. Documents cannot be securely shared externally.
**Size:** Large

**Description:** Implement secure sharing endpoints: generate a share link with optional password, expiry, max downloads, and recipient verification; list active links with usage stats; update or revoke a link; and a public access endpoint that verifies credentials and logs access.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → DB‑DOCS‑004`, `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑004`
**Blocks:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑001` (watermarking/DRM integration)
**Related Files:** `artifacts/api‑server/src/services/documents/share‑link‑service.ts`, `artifacts/api‑server/src/routes/documents/share‑links.ts`, `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/share‑links` – list active share links with usage stats
- [ ] `POST /api/v1/documents/{documentId}/share‑link` – generate link with configurable `password`, `expires_at`, `max_downloads`, `recipient_verification_required`
- [ ] `GET /api/v1/share‑links/{linkToken}` – get link details
- [ ] `PATCH /api/v1/share‑links/{linkToken}` – update settings; `DELETE` revokes
- [ ] `GET /api/v1/share‑links/{linkToken}/access‑log` – view access log entries
- [ ] **Public endpoint (no auth):** `POST /api/v1/shared/{linkToken}/access` – verify password (if required), log access, return temporary download token
- [ ] Emits `ShareLinkCreated`, `ShareLinkAccessed`, `ShareLinkRevoked` domain events
- [ ] Integration tests including public access flow pass
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Watermarked document download (Phase 7+)
- Link analytics dashboard (Phase 8+)

**Rules to Follow**
- Generated link must be displayed only once — not re‑fetchable
- Revoke is irreversible — show confirmation dialog
- Password must be stored as a hash; never log raw tokens or access credentials

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/documents/share‑links.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Share links are ephemeral access tokens for Document aggregates; they have their own lifecycle.
- TDD: Simulate create share link → assert link URL shown; simulate "Revoke" → assert confirmation → confirm → assert link status changes to revoked.
- BDD: “As a firm user, I can generate a secure share link for a document with an expiry date and password.”
- Deep Module: `ShareLinkService.create(documentId, options)` hides token generation, hashing, expiry logic, and event emission.

---

### Subtasks
- [ ] API‑DOCS‑013.0.25 (AGENT): Read DB‑DOCS‑004 schema and existing document service. *No action – pause.*
- [ ] API‑DOCS‑013.1 (AGENT): Add share link paths to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑DOCS‑013.2 (AGENT): Write integration tests (red phase). **File:** `artifacts/api‑server/__tests__/api/documents/share‑links.test.ts` **Verification:** All red.
- [ ] API‑DOCS‑013.3 (AGENT): Implement `ShareLinkService` with security and access tracking. **File:** `artifacts/api‑server/src/services/documents/share‑link‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑DOCS‑013.4 (AGENT): Create routes and run integration tests to green. **File:** `artifacts/api‑server/src/routes/documents/share‑links.ts` **Verification:** All green; `pnpm typecheck`.
- [ ] API‑DOCS‑013.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – E‑Sign Integration

### [ ] API‑ESIGN‑001: E‑Sign – Expand OpenAPI Spec
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No e‑sign endpoints in `openapi.yaml`.
**Size:** Small

**Description:** Add e‑signature request endpoints: send for signature, retrieve status, void request, and completion certificate.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → DB‑ESIGN‑001`
**Blocks:** `documents/DOCUMENTS‑SHARING.md → API‑ESIGN‑002`
**Related Files:** `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `POST /documents/{documentId}/signature‑requests` – send for signature (body: signers, signing_order, authentication method)
- [ ] `GET /documents/{documentId}/signature‑requests/{requestId}` – status
- [ ] `DELETE /documents/{documentId}/signature‑requests/{requestId}` – void
- [ ] `GET /signature‑requests/{requestId}/certificate` – completion certificate
- [ ] Codegen runs successfully

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ESIGN‑001.1 (AGENT): Add e‑sign paths and schemas to OpenAPI. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen` ; `pnpm typecheck`.
- [ ] API‑ESIGN‑001.2 (HUMAN): Review and sign off. **Verification:** Approved.

---

### [ ] API‑ESIGN‑002: E‑Sign – Integration Tests & Service
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No e‑sign service exists.
**Size:** Large

**Description:** Implement `ESignService` with constructor injection of `ESignProviderPort` (SignWellClient stub). Handles sending for signature, status retrieval, voiding, and event emission.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑ESIGN‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `documents/DOCUMENTS‑SHARING.md → API‑ESIGN‑003`
**Related Files:** `artifacts/api‑server/src/services/documents/esign‑service.ts`, `artifacts/api‑server/src/lib/esign/esign‑provider‑port.ts`

**Definition of Done**
- [ ] `sendForSignature(documentId, signers, options)` – calls provider, stores `external_request_id` and initial status
- [ ] `getSignatureStatus(requestId)` – updates local status
- [ ] `voidRequest(requestId)` – voids
- [ ] Emits `DocumentSentForSignature`, `DocumentSigned`, `SignatureDeclined` events
- [ ] Integration tests: create signature request → 201; retrieve → 200 with status; void → 200; non‑existent document → 404
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/documents/esign.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: E‑Sign is implemented as an integration adapter within the Documents bounded context.
- TDD: Write integration tests with stubbed provider before implementation.
- Deep Module: `ESignService` hides provider API details behind domain methods.

---

### Subtasks
- [ ] API‑ESIGN‑002.0.25 (AGENT): Read API‑ESIGN‑001 spec and `ESignProviderPort` interface. *No action – pause.*
- [ ] API‑ESIGN‑002.1 (AGENT): Define `ESignProviderPort` and implement stub. **File:** `lib/esign/esign‑provider‑port.ts`, `mock‑provider.ts` **Verification:** `pnpm typecheck`.
- [ ] API‑ESIGN‑002.2 (AGENT): Implement `ESignService`. **File:** `artifacts/api‑server/src/services/documents/esign‑service.ts` **Verification:** Unit tests pass.
- [ ] API‑ESIGN‑002.3 (AGENT): Write integration tests (red then green). **File:** `artifacts/api‑server/__tests__/api/documents/esign.test.ts` **Verification:** All green.
- [ ] API‑ESIGN‑002.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑ESIGN‑003: E‑Sign – Webhook Handler
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No webhook handler exists for e‑sign provider callbacks.
**Size:** Medium

**Description:** Implement a public webhook endpoint that receives SignWell (or DocuSign) callbacks, verifies HMAC signatures, updates signature request status, and processes idempotent event delivery.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑ESIGN‑002`, `DB‑ESIGN‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/routes/esign‑webhooks.ts`, `artifacts/api‑server/src/lib/esign/webhook‑verifier.ts`

**Definition of Done**
- [ ] `POST /webhooks/esign` – public endpoint
- [ ] HMAC signature verification using `ESIGN_WEBHOOK_SECRET`
- [ ] Processes events: `signed`, `declined`, `expired`, `signer_authenticated`, `signing_order_completed`
- [ ] Idempotent by tracking processed webhook IDs
- [ ] Returns 200 for success, 400 for invalid signatures
- [ ] Unit tests for verification and payload processing; integration tests with simulated payloads
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/api/documents/esign‑webhooks.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑ESIGN‑003.0.25 (AGENT): Research SignWell webhook format. *No action – pause.*
- [ ] API‑ESIGN‑003.1 (AGENT): Add webhook endpoint to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen`.
- [ ] API‑ESIGN‑003.2 (AGENT): Implement webhook signature verification. **File:** `lib/esign/webhook‑verifier.ts` **Verification:** Unit tests pass.
- [ ] API‑ESIGN‑003.3 (AGENT): Implement webhook handler route. **File:** `routes/esign‑webhooks.ts` **Verification:** Route processes test payload correctly.
- [ ] API‑ESIGN‑003.4 (AGENT): Add idempotency handling. **Verification:** Duplicate webhook IDs ignored.
- [ ] API‑ESIGN‑003.5 (AGENT): Write integration tests. **Verification:** End‑to‑end webhook processing works.
- [ ] API‑ESIGN‑003.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend – Sharing & Collaboration

### [ ] FRONT‑DOCS‑008: Secure Share Link Generator
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No share link UI exists.
**Size:** Small

**Description:** Share link creation dialog (password, expiry, max downloads, recipient verification), generated link with copy‑to‑clipboard, active links dashboard with revoke/edit, and access log.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑013`, `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/ShareLinkGenerator.tsx`

**Definition of Done**
- [ ] “Share” button opens dialog with options
- [ ] Generated link with “Copy” button; active links dashboard; revoke/edit actions
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- ShareLinkGenerator.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Share links are ephemeral access tokens for Document aggregates.
- TDD: Simulate create share link → assert link URL shown; simulate "Revoke" → assert confirmation → confirm → assert link status changes.
- BDD: “As a firm user, I can generate a secure share link for a document with an expiry date and password.”

---

### Subtasks
- [ ] FRONT‑DOCS‑008.1 (AGENT): Build share link creation dialog. **File:** `ShareLinkGenerator.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑008.2 (AGENT): Build active links dashboard with revoke/edit. **File:** `ShareLinkGenerator.tsx` **Verification:** `pnpm --filter @workspace/apex‑os test -- ShareLinkGenerator.test.tsx` → GREEN.
- [ ] FRONT‑DOCS‑008.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑009: E‑Signature Template Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No e‑signature template builder exists.
**Size:** Medium

**Description:** Reusable e‑signature template builder: signer role management, drag‑and‑drop signature field placement on document preview, bulk send with CSV recipient upload, and template list with edit/duplicate/delete.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑015`, `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/ESignTemplateBuilder.tsx`

**Definition of Done**
- [ ] Signer role management; drag‑and‑drop signature field placement
- [ ] Bulk send with CSV upload and preview; template list with CRUD
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- ESignTemplateBuilder.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: E‑signature templates are factory configurations that produce SignatureRequest aggregates.
- TDD: Simulate add signer role → assert role appears; simulate drag field → assert coordinate stored.
- BDD: “As a firm user, I can create a reusable e‑signature template and bulk‑send it to a list of recipients from a CSV.”

---

### Subtasks
- [ ] FRONT‑DOCS‑009.1 (AGENT): Build signer role management and field placement. **File:** `ESignTemplateBuilder.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑009.2 (AGENT): Implement CSV bulk send and template list. **Verification:** `pnpm --filter @workspace/apex‑os test -- ESignTemplateBuilder.test.tsx` → GREEN.
- [ ] FRONT‑DOCS‑009.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑007: Document Version Comparison Viewer
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No version diff viewer exists.
**Size:** Small

**Description:** Side‑by‑side diff viewer: version selector dropdowns, colour‑coded additions/deletions/modifications, prev/next change navigation, and full‑screen toggle.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑012`, `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/VersionDiff.tsx`

**Definition of Done**
- [ ] Side‑by‑side diff panel; prev/next navigation; full‑screen toggle
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- VersionDiff.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document versions are immutable snapshots within the Document aggregate.
- TDD: MSW returns two version contents; assert diff panel renders added/removed spans.
- BDD: “As a firm user, I can compare two versions of a document and see what changed highlighted in colour.”

---

### Subtasks
- [ ] FRONT‑DOCS‑007.1 (AGENT): Build version selector and side‑by‑side diff panel. **File:** `VersionDiff.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑007.2 (AGENT): Add prev/next navigation and full‑screen toggle; write tests. **File:** `__tests__/VersionDiff.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑007.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑010: Document Annotation & Feedback Viewer
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No document annotation UI exists.
**Size:** Medium

**Description:** In‑browser annotation viewer: comment sidebar grouped by document section, click‑to‑comment on document area, threaded replies, resolve/reopen toggle, and 30‑second polling for new comments.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑011`, `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/DocumentAnnotations.tsx`

**Definition of Done**
- [ ] Comment sidebar grouped by section; click‑to‑comment
- [ ] Threaded replies; resolve/reopen toggle; 30‑second polling
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- DocumentAnnotations.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Annotations are domain events attached to a Document aggregate.
- TDD: MSW returns annotations; assert sidebar groups by section; simulate click‑to‑comment → assert `POST /annotations` called.
- BDD: “As a firm user, I can annotate a document and my colleagues can reply to my comments.”

---

### Subtasks
- [ ] FRONT‑DOCS‑010.1 (AGENT): Build comment sidebar and click‑to‑comment. **File:** `DocumentAnnotations.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑010.2 (AGENT): Add threaded replies, resolve/reopen, polling; write tests. **File:** `__tests__/DocumentAnnotations.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑010.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑005: Document Request List UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No document request list UI exists.
**Size:** Small

**Description:** Interface for firm to create document request lists (name, items with required flag, due date) and for clients to upload items. Firm view shows upload status and allows “Mark Reviewed” and “Send Reminder” actions.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑009`, `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/DocumentRequestList.tsx`

**Definition of Done**
- [ ] Create request list form with dynamic item rows
- [ ] Firm detail view with status and actions; client upload view
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- DocumentRequestList.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document Request List is a collaboration aggregate bridging firm and client bounded contexts.
- TDD: MSW returns request list; assert firm view shows items with status; simulate client upload → assert status updates.
- BDD: “As a firm user, I can create a document checklist for a client and track which documents they have uploaded.”

---

### Subtasks
- [ ] FRONT‑DOCS‑005.1 (AGENT): Build request list creation form. **File:** `DocumentRequestList.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑005.2 (AGENT): Implement firm detail and client upload views; write tests. **File:** `__tests__/DocumentRequestList.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑005.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑006: Document Approval Workflow UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No approval workflow UI exists.
**Size:** Medium

**Description:** Submit‑for‑approval dialog (select approvers, order, message), approver pending approvals list, approve/reject/comment actions with required comment on reject, and a full chronological workflow timeline.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑010`, `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/ApprovalWorkflow.tsx`

**Definition of Done**
- [ ] Submit dialog; approver dashboard; approve/reject/comment actions
- [ ] Workflow timeline; reject requires comment
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- ApprovalWorkflow.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Approval workflow is a process aggregate with a defined state machine.
- TDD: MSW returns pending approval; assert buttons render; simulate reject without comment → assert button disabled.
- BDD: “As an approver, I can approve or reject a document and leave a comment explaining my decision.”

---

### Subtasks
- [ ] FRONT‑DOCS‑006.1 (AGENT): Build submit‑for‑approval dialog and approver list. **File:** `ApprovalWorkflow.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑006.2 (AGENT): Implement approve/reject/comment actions and timeline; write tests. **File:** `__tests__/ApprovalWorkflow.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑006.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑DOCS‑011: Word‑Based Document Template Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Word‑based template upload or field‑mapping UI exists.
**Size:** Medium

**Description:** Templates tab in Documents: upload a `.docx` file as a template, map `{{variables}}` to CRM/entity fields, and generate pre‑filled documents from entity detail pages via a “New from Template” action.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑004`, `DOC‑STORAGE‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/WordTemplateBuilder.tsx`

**Definition of Done**
- [ ] Templates tab with list and upload flow; variable extraction; field mapping UI
- [ ] “New from Template” button on entity detail pages; preview before generation
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex‑os test -- WordTemplateBuilder.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Document Template is a factory configuration in the Documents bounded context.
- TDD: MSW returns extracted variables; assert mapping UI shows them; simulate "New from Template" → assert `POST /documents/from‑template` called.
- BDD: “As a firm user, I can upload a Word document template and generate pre‑filled documents for any contact with one click.”

---

### Subtasks
- [ ] FRONT‑DOCS‑011.1 (AGENT): Build template list, upload flow, and variable mapping. **File:** `WordTemplateBuilder.tsx` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑DOCS‑011.2 (AGENT): Implement `NewFromTemplateButton`; write tests. **File:** `__tests__/WordTemplateBuilder.test.tsx` **Verification:** GREEN.
- [ ] FRONT‑DOCS‑011.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## E‑Sign Adapter Implementation (Deferred)

### [ ] API‑ESIGN‑004: E‑Sign – Concrete Adapter Implementation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** E‑Sign service uses a stub. Production requires a real SignWell (or DocuSign) adapter.
**Size:** Large

**Description:** Implement `SignWellAdapter` (or `DocuSignAdapter`) conforming to `ESignProviderPort` using the provider’s HTTP API, with retry logic, error mapping, and rate limiting handling.

**Depends on:** `documents/DOCUMENTS‑SHARING.md → API‑ESIGN‑002`, `API‑ESIGN‑003`
**Blocks:** Production‑ready e‑sign functionality
**Related Files:** `artifacts/api‑server/src/lib/esign/signwell‑adapter.ts`

**Definition of Done**
- [ ] Concrete adapter implements `ESignProviderPort`
- [ ] HTTP client with retry logic and exponential backoff
- [ ] Configuration via environment variables (`SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL`)
- [ ] Error mapping to domain errors (`ESignProviderUnavailable`, `InvalidSigner`, etc.)
- [ ] Unit tests with mocked HTTP responses; manual sandbox test
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm test -- artifacts/api‑server/src/lib/esign/signwell‑adapter.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The concrete adapter is an anti‑corruption layer implementing the provider port.

---

### Subtasks
- [ ] API‑ESIGN‑004.0.25 (AGENT): Read `ESignProviderPort` and SignWell API docs. *No action – pause.*
- [ ] API‑ESIGN‑004.1 (AGENT): Implement SignWell HTTP client wrapper. **File:** `signwell‑client.ts` **Verification:** Unit tests pass.
- [ ] API‑ESIGN‑004.2 (AGENT): Implement `SignWellAdapter`. **File:** `signwell‑adapter.ts` **Verification:** Adapter implements port correctly.
- [ ] API‑ESIGN‑004.3 (AGENT): Add error mapping and retry logic. **Verification:** Error scenarios handled correctly.
- [ ] API‑ESIGN‑004.4 (AGENT): Write comprehensive unit tests. **Verification:** All test cases pass.
- [ ] API‑ESIGN‑004.5 (AGENT): Add env vars to `.env.example`. **Verification:** Variables documented.
- [ ] API‑ESIGN‑004.6 (HUMAN): Manual sandbox test (optional). **Verification:** Manual.

---