Now producing `TODO-P7-DOCS.md`.

---

# TODO-P7-DOCS.md – Phase 7 Document Productivity Integrations

This document contains document productivity integration tasks for Microsoft Outlook Add‑In and Gmail Add‑On, Office 365 co‑editing, and Data Loss Prevention (DLP) integration. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 Document Productivity Integration Task Index

- [ ] INT‑DOCS‑001 – Outlook Add‑In  
- [ ] INT‑DOCS‑002 – Gmail Add‑On  
- [ ] INT‑DOCS‑003 – Office 365 Co‑Editing Integration  
- [ ] INT‑DOCS‑004 – Third‑Party DLP Integration  

---

## [ ] INT‑DOCS‑001: Outlook Add‑In
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No Microsoft Outlook add‑in exists. As of May 2026, Outlook add‑ins are built with the Office JavaScript API (Office.js) and deployed via the Microsoft 365 admin center or AppSource. Add‑ins can compose messages, insert links, read attachments, and interact with external services through a task pane or function commands. The manifest (XML) defines the add‑in's capabilities and ribbon commands.  
**Size:** Large  

**Description:** Build a Microsoft Outlook add‑in that enables users to replace attachments with secure ShareFile‑style links, encrypt email body content, save received attachments directly to Apex document storage (Cloudflare R2), and request files from recipients via a document request list directly from the compose window.

**Depends on:** API‑DOCS‑013 (secure share link API), DOC‑STORAGE‑001 (Cloudflare R2 storage), EMAIL‑SERVICE‑001 (email service for notifications)  
**Blocks:** INT‑DOCS‑002 (Gmail Add‑On – patterns reusable)  
**Related Files:** `integrations/outlook-addin/manifest.xml`, `integrations/outlook-addin/src/taskpane.ts`, `integrations/outlook-addin/src/commands.ts`, `integrations/outlook-addin/src/secure-links.ts`, `integrations/outlook-addin/src/email-encryption.ts`, `integrations/outlook-addin/src/attachment-handler.ts`, `integrations/outlook-addin/src/document-requests.ts`  

**Imports / Exports**  
- Imports: Office.js (JavaScript API for Office), Apex REST API client, `@microsoft/office-js-helpers` (if used)  
- Exports: [N/A] – add‑in package; distribution via Microsoft 365  

**Definition of Done**  
- [ ] Add‑in manifest (`manifest.xml`) defines: `Mailbox` permission set, `ItemSend` event extension point, `MessageComposeCommandSurface` and `MessageReadCommandSurface` ribbon buttons  
- [ ] "Send Secure Link" function command: user selects a file attachment, clicks the button; the file is uploaded to Apex document storage, a secure share link is generated via `API‑DOCS‑013`, and the attachment is replaced with the link in the email body  
- [ ] "Encrypt Email" function command: replaces email body content with an encrypted version using a shared encryption key; decryption hint included  
- [ ] "Save to Storage" function command (read mode): when viewing a received email, clicking the button uploads all attachments to Apex document storage and shows a confirmation with links  
- [ ] "Request Files" function command: opens a task pane where the user can create a document request list, set a due date, and insert a request link into the email body  
- [ ] Add‑in loads in Outlook desktop (Windows, Mac) and Outlook on the web  
- [ ] All API calls use the authenticated user's Apex session (SSO or separate login in task pane)  
- [ ] `pnpm run typecheck` passes with zero errors  

**Out of Scope**  
- Outlook mobile app add‑in (iOS/Android – different manifest and API surface)  
- Calendar integration (handled by calendar sync tasks)  
- Offline mode for the add‑in  

**Safety Boundaries**  
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`  
- Never commit: `.env*`, credentials, secrets, add‑in manifest containing internal URLs in production  
- Never expose the user's Apex API token in the add‑in task pane (use OAuth or SSO flow)  

**Output Artifacts**  
- Code changes in: `integrations/outlook-addin/`  
- Tests added/updated in: `integrations/outlook-addin/__tests__/`  
- Documentation: [N/A]  
- Migration files: [N/A]  

**Rollback**  
- Granularity: deployment‑level – remove the add‑in from the Microsoft 365 admin center; users revert to standard Outlook functionality  
- Halt condition: if the add‑in crashes Outlook on any supported platform, stop and fix before wider rollout  

**Rules to Follow**  
- Use Office JavaScript API v1.15+ (latest as of May 2026)  
- Manifest must specify `VersionOverrides` for ribbon command support  
- `ItemSend` event (synchronous) must complete within the time limit (~5 s); use `event.completed({ allowEvent: true })` to allow send or `{ allowEvent: false, errorMessage: '...' }` to block  
- All external API calls must handle network failures gracefully and show user‑friendly errors in the task pane  
- Add‑in must be side‑loaded for development and deployed via Microsoft 365 admin center for production  

**Verification**  
```bash
# Build add‑in
pnpm run build:integrations/outlook-addin

# Side‑load in Outlook desktop for manual testing
# Use `npx office-addin-debugging` or sideload manifest via Outlook UI

# Unit tests
pnpm vitest run -- integrations/outlook-addin/__tests__/
```

**Advanced Code Patterns**  
- Office.js async API: use `Office.context.mailbox.item.getAttachmentsAsync` then `Office.context.mailbox.item.removeAttachmentAsync` to replace attachments  
- Task pane authentication: use `Office.context.ui.displayDialogAsync` to open a popup for OAuth flow, then exchange token via `Office.onReady`  
- Add‑in command to function mapping: ribbon button `action` element references a JavaScript function in `FunctionFile`  

**Anti‑Patterns**  
- Do not use `localStorage` in the add‑in to store auth tokens (cleared on add‑in reload)  
- Do not block email send with a synchronous API call that exceeds the time limit – use `event.completed` with a timeout  
- Do not hardcode the Apex API URL; use a configuration setting in the manifest or task pane  

**DDD / TDD / BDD / Deep Module notes**  
- DDD: The Outlook add‑in is a presentation layer (user interface) that delegates to the Documents and Email bounded contexts. It does not contain domain logic.  
- TDD: Write unit tests for the secure link, attachment upload, and document request functions using mocked Office.js APIs.  
- BDD: "As an Outlook user, I can replace a large attachment with a secure link before sending, saving storage and improving security."  
- Deep Module: The add‑in itself is a thin UI; the deep modules are the Apex services it calls (secure share link, document upload).  

---

### Subtasks

- [ ] INT‑DOCS‑001.0.25 (AGENT): Read the Office JavaScript API documentation, Outlook add‑in manifest schema, and `ItemSend` event extension point.  
  *No action – pause until fully understood.*

- [ ] INT‑DOCS‑001.0.5 (AGENT): Research Outlook add‑in development with Office.js v1.15+, side‑loading, and deployment via Microsoft 365 admin center (as of May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] INT‑DOCS‑001.1 (AGENT): Create Outlook add‑in manifest with `Mailbox` permission set and all required extension points.  
  **File(s):** `integrations/outlook-addin/manifest.xml`  
  **Verification:** Manifest validates against schema; side‑load in Outlook desktop works.

- [ ] INT‑DOCS‑001.2 (AGENT): Implement "Send Secure Link" function command (upload attachment, replace with link).  
  **File(s):** `integrations/outlook-addin/src/commands.ts`, `secure-links.ts`  
  **Verification:** Unit tests pass with mocked Office.js; manual test in Outlook succeeds.

- [ ] INT‑DOCS‑001.3 (AGENT): Implement "Save to Storage" and "Request Files" function commands.  
  **File(s):** `integrations/outlook-addin/src/attachment-handler.ts`, `document-requests.ts`  
  **Verification:** Unit tests pass; manual test in Outlook.

- [ ] INT‑DOCS‑001.4 (AGENT): Implement email encryption function command.  
  **File(s):** `integrations/outlook-addin/src/email-encryption.ts`  
  **Verification:** Encrypts body and inserts decryption note.

- [ ] INT‑DOCS‑001.N (HUMAN): Final review – test add‑in in Outlook desktop and web; verify all functions work; approve deployment.  
  **Verification:** Approved.

---

## [ ] INT‑DOCS‑002: Gmail Add‑On
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** No Gmail add‑on exists. As of May 2026, Gmail add‑ons are built with Google Apps Script and CardService for the UI. They are published to the Google Workspace Marketplace. Add‑ons can access the current email message, compose new messages, insert content, and call external APIs via `UrlFetchApp` with OAuth 2.0.  
**Size:** Large  

**Description:** Build a Google Workspace Add‑on (Gmail add‑on) that provides: attach files as secure links instead of regular attachments, encrypt email content, save received attachments directly to Apex document storage, and request files from recipients via a document request list.

**Depends on:** API‑DOCS‑013 (secure share link API), DOC‑STORAGE‑001, EMAIL‑SERVICE‑001  
**Blocks:** INT‑DOCS‑003 (Office 365 Co‑Editing – patterns reference)  
**Related Files:** `integrations/gmail-addon/appsscript.json`, `integrations/gmail-addon/Code.gs`, `integrations/gmail-addon/secure-links.gs`, `integrations/gmail-addon/email-encryption.gs`, `integrations/gmail-addon/attachment-handler.gs`, `integrations/gmail-addon/document-requests.gs`  

**Imports / Exports**  
- Imports: `CardService` (Google Workspace Add‑on API), `GmailApp`, `OAuth2` (for external API calls), `UrlFetchApp`  
- Exports: [N/A] – deployment via Google Workspace Marketplace  

**Definition of Done**  
- [ ] Add‑on manifest (`appsscript.json`) defines: `gmail` trigger with `composeTrigger`, `contextualTriggers` for opened messages  
- [ ] Compose trigger: when composing a new email, card shows "Send Secure Link", "Encrypt Email", "Request Files" actions  
- [ ] "Send Secure Link": user selects a file via a file picker or drag‑and‑drop (via a custom interface in a card); the file is uploaded to Apex, a secure link generated, and inserted into the email body  
- [ ] "Encrypt Email": encrypts the email body and replaces it; decryption hint inserted  
- [ ] Contextual trigger (read mode): when reading an email with attachments, "Save to Storage" card is shown; clicking it uploads all attachments to Apex  
- [ ] "Request Files" action: opens a card with a form to create a document request list and insert a request link into the email  
- [ ] All external API calls use OAuth 2.0 service for Apex API authentication (token stored securely in Apps Script Properties, not in code)  
- [ ] Add‑on published to Google Workspace Marketplace (or private domain install)  

**Out of Scope**  
- Gmail mobile app add‑on (same code works, but UI is constrained; test on mobile)  
- Google Chat integration  
- Google Meet integration (handled by INT‑VIDEO‑003)  

**Safety Boundaries**  
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`  
- Never commit: `.env*`, credentials, secrets, Service Account keys  
- Never store Apex API keys in plaintext in Apps Script files (use `PropertiesService.getScriptProperties()`)  

**Output Artifacts**  
- Code changes in: `integrations/gmail-addon/`  
- Tests added/updated in: `integrations/gmail-addon/__tests__/` (using `clasp` for local dev and testing)  
- Documentation: [N/A]  
- Migration files: [N/A]  

**Rollback**  
- Granularity: deployment‑level – unpublish or disable the add‑on from Google Workspace Marketplace  
- Halt condition: if the add‑on causes Gmail to load slowly or breaks compose functionality, disable immediately and debug  

**Rules to Follow**  
- Use Google Apps Script with `clasp` CLI for local development and version control  
- All OAuth 2.0 tokens must be stored in `PropertiesService.getScriptProperties()`, never hardcoded  
- `CardService` must return `ActionResponse` for any action that modifies the email or calls an external API  
- Add‑on must respect Google's Apps Script quotas: 20,000 `UrlFetchApp` calls per day, 6 hours of script runtime per day  

**Verification**  
```bash
# Push to Apps Script
clasp push

# Open in Apps Script editor for testing
clasp open

# Unit tests (local with mocked CardService)
pnpm vitest run -- integrations/gmail-addon/__tests__/
```

**Advanced Code Patterns**  
- `CardService.newSelectionInput()` for dropdowns, `CardService.newImage()` for icons  
- `UrlFetchApp.fetch()` with OAuth 2.0 authorization header for Apex API calls  
- Use `OAuth2.createService('Apex')` to manage token lifecycle  

**Anti‑Patterns**  
- Do not use `eval` or dynamically generated code in Apps Script (security risk and prevents marketplace approval)  
- Do not exceed quota by making synchronous API calls in a loop – batch requests where possible  

**DDD / TDD / BDD / Deep Module notes**  
- DDD: The Gmail add‑on is a presentation layer delegating to the Documents bounded context.  
- TDD: Write unit tests for the Apps Script functions using mocked `CardService` and `UrlFetchApp`.  
- BDD: "As a Gmail user, I can send secure links instead of attachments and request documents from clients directly from the compose window."  
- Deep Module: The add‑on is a thin UI; deep modules are the Apex services it calls.  

---

### Subtasks

- [ ] INT‑DOCS‑002.0.25 (AGENT): Read the Google Workspace Add‑on documentation (Gmail add‑on, CardService, OAuth2 library).  
  *No action – pause until fully understood.*

- [ ] INT‑DOCS‑002.0.5 (AGENT): Research Apps Script quotas, `clasp` CLI usage, and Google Workspace Marketplace deployment process (as of May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] INT‑DOCS‑002.1 (AGENT): Create add‑on manifest (`appsscript.json`) and basic project structure.  
  **File(s):** `integrations/gmail-addon/appsscript.json`, `Code.gs`  
  **Verification:** `clasp push` succeeds; add‑on appears in Gmail.

- [ ] INT‑DOCS‑002.2 (AGENT): Implement "Send Secure Link" card action.  
  **File(s):** `integrations/gmail-addon/secure-links.gs`  
  **Verification:** Unit tests pass; manual test in Gmail.

- [ ] INT‑DOCS‑002.3 (AGENT): Implement "Save to Storage" and "Request Files" card actions.  
  **File(s):** `integrations/gmail-addon/attachment-handler.gs`, `document-requests.gs`  
  **Verification:** Unit tests pass; manual test.

- [ ] INT‑DOCS‑002.4 (AGENT): Implement email encryption action.  
  **File(s):** `integrations/gmail-addon/email-encryption.gs`  
  **Verification:** Unit tests pass.

- [ ] INT‑DOCS‑002.N (HUMAN): Final review – test in Gmail, verify all actions, approve marketplace deployment.  
  **Verification:** Approved.

---

## [ ] INT‑DOCS‑003: Office 365 Co‑Editing Integration  
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No real‑time collaborative editing exists for Office documents stored in Apex. As of May 2026, the Web Application Open Platform Interface (WOPI) protocol is the standard for integrating Office for the web (Word, Excel, PowerPoint) with third‑party storage providers. Office for the web connects to a WOPI host to discover and edit files stored in the document management system, handling locks, versioning, and real‑time co‑authoring.  
**Size:** Large  

**Description:** Implement a WOPI host that enables Office for the web to open, edit, and co‑author Word, Excel, and PowerPoint documents stored in the Apex document storage (Cloudflare R2). When a user clicks "Edit" on a document in the Apex web app, it opens the Office Online editor in an iframe or new tab with full collaborative editing capabilities.

**Depends on:** DOC‑STORAGE‑001 (Cloudflare R2), API‑DOCS‑004 (documents API)  
**Blocks:** INT‑DOCS‑004 (DLP – co‑editing can trigger DLP checks)  
**Related Files:** `lib/integrations/wopi/wopi-host.ts`, `lib/integrations/wopi/document-lock-manager.ts`, `lib/integrations/wopi/office-embed.ts`  

**Imports / Exports**  
- Imports: `StoragePort` (for file read/write), JWT service (for generating access tokens), `crypto` (for lock management)  
- Exports: `WopiHostRouter` (Express router), `WopiDocumentLockManager`  

**Definition of Done**  
- [ ] WOPI host implements the required endpoints per the WOPI protocol:  
  - `GET /wopi/files/{fileId}` – CheckFileInfo (returns file metadata, user permissions, supported capabilities)  
  - `GET /wopi/files/{fileId}/contents` – GetFile (streams file contents to Office for the web)  
  - `POST /wopi/files/{fileId}/contents` – PutFile (saves edited file contents back to storage)  
  - `POST /wopi/files/{fileId}` – Lock, Unlock, RefreshLock, UnlockAndRelock operations for co‑authoring  
- [ ] Document lock management: `WopiDocumentLockManager` implements a distributed lock service (in‑memory for single instance or Redis for multi‑node); locks have configurable TTL and refresh  
- [ ] Proof key validation: validates the `X-WOPI-Proof` and `X-WOPI-ProofOld` headers per the WOPI specification to ensure requests originate from Microsoft  
- [ ] `CheckFileInfo` response includes: `BaseFileName`, `OwnerId`, `Size`, `Version` (last modified timestamp), `SupportsCoauthoring`, `SupportsLocks`, `UserCanWrite`, `UserFriendlyName`  
- [ ] Apex web app "Edit" button redirects to Office for the web via a constructed URL with `WOPISrc` parameter pointing to the WOPI host  
- [ ] Co‑authoring: multiple users can edit the same document simultaneously; changes are saved incrementally and versioned  
- [ ] Unit tests simulate WOPI protocol requests with valid and invalid proof keys  
- [ ] `pnpm run typecheck` passes with zero errors  

**Out of Scope**  
- Office desktop application integration (WOPI is for Office for the web only)  
- Custom WOPI actions beyond edit and co‑author (no view‑only or mobile‑optimised actions)  
- Integration with third‑party WOPI clients beyond Microsoft  

**Safety Boundaries**  
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`  
- Never commit: `.env*`, WOPI proof keys, JWT signing secrets  
- WOPI endpoints must not be exposed to the public internet without authentication (they are called by Microsoft's servers, not end users)  
- Proof key validation must never be skipped in production  

**Output Artifacts**  
- Code changes in: `lib/integrations/wopi/`  
- Tests added/updated in: `lib/integrations/wopi/__tests__/`  
- Documentation: [N/A]  
- Migration files: [N/A]  

**Rollback**  
- Granularity: file‑level – delete WOPI host routes; revert "Edit" button to download only  
- Halt condition: if WOPI proof key validation fails continuously due to expired keys, stop and implement automatic proof key rotation  

**Rules to Follow**  
- Implement WOPI protocol version 12 (current as of May 2026)  
- Proof keys must be obtained from Microsoft and stored securely; rotated when `X-WOPI-ProofOld` expires  
- Lock operations must use a distributed store (Redis) if running multiple API server instances; in‑memory locks are acceptable for single node in Phase 7  
- `PutFile` must be idempotent – the same content upload repeated must produce the same file state  
- Office for the web Cobalt‑based co‑authoring requires sending deltas; ensure the `SupportsCobalt` capability is set in CheckFileInfo if supported  

**Verification**  
```bash
# Unit tests for WOPI host
pnpm vitest run -- lib/integrations/wopi/__tests__/
```  

**Advanced Code Patterns**  
- Redis‑based lock store: use `ioredis` with `SET lockKey clientId NX EX ttl` for lock acquisition, `GET + DEL` for release  
- Proof key validation: download the current WOPI proof keys from Microsoft's well‑known URL, cache for 1 hour, and validate the header signature using RSA‑SHA256  
- `CheckFileInfo` response: use the file's `updatedAt` timestamp as the version string for optimistic concurrency  

**Anti‑Patterns**  
- Do not omit proof key validation – without it, any service can impersonate Office for the web and access files  
- Do not use database row‑level locks for WOPI document locks (contention and performance issues)  
- Do not expose WOPI endpoints without a reverse proxy that restricts source IP ranges to Microsoft's published ranges  

**DDD / TDD / BDD / Deep Module notes**  
- DDD: WOPI host is an infrastructure service that sits outside bounded contexts; it reads and writes documents through the Documents bounded context's storage adapter.  
- TDD: Write integration tests that simulate WOPI protocol requests and verify correct responses, including lock acquisition and release.  
- BDD: "As a user, I can click 'Edit' on a Word document and open it in my browser for full editing, with changes saved automatically back to the document storage."  
- Deep Module: The WOPI host hides complex Microsoft protocol requirements, proof key validation, and co‑authoring lock management behind a set of REST endpoints.  

---

### Subtasks

- [ ] INT‑DOCS‑003.0.25 (AGENT): Read the WOPI protocol specification (version 12) and Microsoft's WOPI discovery documentation.  
  *No action – pause until fully understood.*

- [ ] INT‑DOCS‑003.0.5 (AGENT): Research WOPI proof key rotation, lock management with Redis, and Office for the web URL construction (as of May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] INT‑DOCS‑003.1 (AGENT): Implement WOPI host endpoints: CheckFileInfo, GetFile, PutFile.  
  **File(s):** `lib/integrations/wopi/wopi-host.ts`  
  **Verification:** Unit tests with mock WOPI client pass.

- [ ] INT‑DOCS‑003.2 (AGENT): Implement document lock manager with Redis (or in‑memory fallback) and lock/unlock/refresh endpoints.  
  **File(s):** `lib/integrations/wopi/document-lock-manager.ts`  
  **Verification:** Lock acquisition, refresh, and release work correctly in tests.

- [ ] INT‑DOCS‑003.3 (AGENT): Implement proof key validation middleware.  
  **File(s):** `lib/integrations/wopi/wopi-host.ts` (middleware)  
  **Verification:** Requests with valid proof keys pass; invalid keys rejected.

- [ ] INT‑DOCS‑003.4 (AGENT): Update Apex "Edit" button to construct Office for the web URL with `WOPISrc`.  
  **File(s):** `artifacts/apex-os/src/components/documents/DocumentActions.tsx`  
  **Verification:** Clicking "Edit" opens Office for the web in a new tab.

- [ ] INT‑DOCS‑003.N (HUMAN): Final review – test co‑editing with two users, verify save‑back and versioning, approve.  
  **Verification:** Approved.

---

## [ ] INT‑DOCS‑004: Third‑Party DLP Integration  
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No Data Loss Prevention (DLP) integration exists. As of May 2026, DLP providers (Symantec DLP, Microsoft Purview Information Protection, Nightfall AI, Netskope, etc.) offer REST APIs for scanning files for sensitive content including PII, PHI, PCI, and custom patterns. Integration is typically via a content‑scanning API where files are sent for analysis and a risk score is returned.  
**Size:** Large  

**Description:** Implement a DLP integration that scans documents for sensitive content before sharing or upload. Integrate with a DLP provider's API via an abstract `DLPProviderPort`. When a user attempts to share a file or create a share link, the file is scanned. If a policy violation is detected, the user is warned and given the option to encrypt or cancel. Administrators can configure blocking or warning mode per policy.

**Depends on:** API‑DOCS‑013 (share link API), DOC‑STORAGE‑001 (file storage)  
**Blocks:** [N/A] – enables secure document sharing  
**Related Files:** `lib/integrations/dlp/dlp-provider-port.ts`, `lib/integrations/dlp/dlp-scanner.ts`, `lib/integrations/dlp/policy-enforcer.ts`, `lib/integrations/dlp/dlp-config.ts`, `lib/integrations/dlp/mock-provider.ts`  

**Imports / Exports**  
- Imports: `DLPProviderPort` interface, `StoragePort` (for file retrieval), `Pino` logger, `NotificationService`  
- Exports: `DLPScannerService`, `DLPPolicyEnforcer`, `DLPConfigRouter` (admin routes), `MockDLPProvider` (for testing)  

**Definition of Done**  
- [ ] `DLPProviderPort` interface defined: `scanFile(fileId, content): Promise<ScanResult>` where `ScanResult` includes `{ findings: { type, location, severity }[], riskScore }`  
- [ ] `MockDLPProvider` implements the port for development and testing; simulates PII/PHI/PCI detection with configurable responses  
- [ ] Optional concrete adapter for a chosen DLP provider (e.g., Nightfall AI or Microsoft Purview) that calls the provider's REST API  
- [ ] `DLPScannerService`: triggers scan on document upload, share‑link creation, and periodic background scans for existing files  
- [ ] `DLPPolicyEnforcer`: checks scan results against organisation‑configured policies (block vs. warn per data type); logs all enforcement actions to audit trail  
- [ ] Admin settings UI for DLP configuration: enable/disable scanning, configure policy thresholds, view scan history  
- [ ] When a policy violation is detected during share link creation: if policy is "block", prevent creation and show detailed error; if policy is "warn", show confirmation dialog with violation details  
- [ ] All scans are logged: file ID, findings, risk score, action taken, timestamp  
- [ ] `pnpm run typecheck` passes with zero errors  

**Out of Scope**  
- Real‑time DLP scanning during document editing  
- Endpoint DLP (device‑level controls)  
- Network traffic DLP monitoring  

**Safety Boundaries**  
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`  
- Never commit: `.env*`, DLP provider API keys, credentials  
- Never transmit file contents to the DLP provider in an unencrypted channel  
- Never cache raw scan results that contain PII in logs  

**Output Artifacts**  
- Code changes in: `lib/integrations/dlp/`, `artifacts/api-server/src/routes/dlp-config.ts`, `artifacts/apex-os/src/components/settings/DLPConfig.tsx`  
- Tests added/updated in: `lib/integrations/dlp/__tests__/`  
- Documentation: [N/A]  
- Migration files: [N/A] – configuration stored in `system_settings` table  

**Rollback**  
- Granularity: feature‑level – disable DLP scanning via admin setting; documents are shared without scanning  
- Halt condition: if scanning causes significant latency (>5 seconds) on document upload/share, stop and implement async scanning with queuing  

**Rules to Follow**  
- DLP scanning must be asynchronous for document uploads; do not block the upload response  
- Share link creation may be synchronous (scan result needed before link goes live) but must complete within 2 seconds; use pre‑scanned results when available  
- All scan results must be stored with a TTL for audit purposes (default: 90 days)  
- The `DLPProviderPort` must allow swapping provider implementations without changing policy enforcement logic  

**Verification**  
```bash
# Unit tests for DLP scanner and policy enforcer
pnpm vitest run -- lib/integrations/dlp/__tests__/
```  

**Advanced Code Patterns**  
- Adapter pattern: concrete DLP providers (Nightfall, Purview) implement `DLPProviderPort`; policy enforcer works against the interface  
- Async scan queue: use BullMQ to queue scan jobs; `DLPScannerService.scanAsync(fileId)` returns immediately, and a webhook or notification updates the scan status  
- Policy engine: composite specification pattern – `PolicySpecification` with `AndSpecification`, `OrSpecification` to combine multiple data‑type rules  

**Anti‑Patterns**  
- Do not scan the same file synchronously on every share – use cached scan results with TTL  
- Do not transmit entire file content to DLP provider unless necessary; use metadata or sample‑based scanning where supported  
- Do not expose DLP provider API keys to the frontend  

**DDD / TDD / BDD / Deep Module notes**  
- DDD: DLP integration is a cross‑cutting infrastructure service. It belongs to the Security bounded context (or a shared kernel), not any specific business domain.  
- TDD: Write unit tests for the policy enforcer with mocked scan results; verify blocking and warning behaviors.  
- BDD: "As a compliance officer, I am warned when a user attempts to share a document containing sensitive data, and I can configure policies to block or warn per data type."  
- Deep Module: `DLPScannerService.scan(fileId)` hides provider selection, async job queuing, and caching behind a single method.  

---

### Subtasks

- [ ] INT‑DOCS‑004.0.25 (AGENT): Read about DLP integration patterns, common DLP providers, and the system_settings table schema.  
  *No action – pause until fully understood.*

- [ ] INT‑DOCS‑004.0.5 (AGENT): Research Nightfall AI, Microsoft Purview Information Protection, and other DLP REST APIs for content scanning (as of May 2026).  
  *Document findings briefly or note "no changes."*

- [ ] INT‑DOCS‑004.1 (AGENT): Define `DLPProviderPort` interface and implement `MockDLPProvider`.  
  **File(s):** `lib/integrations/dlp/dlp-provider-port.ts`, `mock-provider.ts`  
  **Verification:** Unit tests with mock provider pass.

- [ ] INT‑DOCS‑004.2 (AGENT): Implement `DLPScannerService` with async scan queue and cached results.  
  **File(s):** `lib/integrations/dlp/dlp-scanner.ts`  
  **Verification:** Scan is queued; cached result used when available.

- [ ] INT‑DOCS‑004.3 (AGENT): Implement `DLPPolicyEnforcer` with configurable rules (block vs. warn).  
  **File(s):** `lib/integrations/dlp/policy-enforcer.ts`  
  **Verification:** Policy evaluation blocks or warns correctly.

- [ ] INT‑DOCS‑004.4 (AGENT): Integrate DLP checks into document upload and share link creation flows.  
  **File(s):** `artifacts/api-server/src/routes/documents.ts`, `share-links.ts`  
  **Verification:** Upload and share trigger scan; policy enforced.

- [ ] INT‑DOCS‑004.5 (AGENT): Build admin DLP settings UI.  
  **File(s):** `artifacts/apex-os/src/components/settings/DLPConfig.tsx`, `artifacts/api-server/src/routes/dlp-config.ts`  
  **Verification:** Admin can configure policies; scan history visible.

- [ ] INT‑DOCS‑004.N (HUMAN): Final review – test with mock provider to verify blocking and warning flows; approve.  
  **Verification:** Approved.

---

## Integration Rules Framework

To avoid rules duplication across all integration tasks, the following common rules framework applies:

### Common Integration Rules
- **Authentication**: Use OAuth 2.0 with proper token management and refresh flows; encrypt tokens at rest with AES‑256‑GCM  
- **Error Handling**: Implement exponential backoff for rate limits and network errors  
- **Security**: Store credentials securely via environment variables; never log raw tokens or credentials; verify webhook signatures  
- **Rate Limiting**: Respect provider‑specific API limits with intelligent throttling  
- **Testing**: Use provider test environments; record API responses as fixtures for deterministic tests  
- **Logging**: Implement structured logging (Pino) with security‑sensitive data redaction  

### Provider‑Specific Rules  
Each integration task includes only rules specific to that provider, not duplicating the common rules above.

---

*End of Phase 7 Document Productivity Integrations.*