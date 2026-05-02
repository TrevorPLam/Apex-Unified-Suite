# TODO-P7-DOCS.md – Phase 7 Document Productivity Integrations

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This document contains document productivity integration tasks for Outlook Add-In, Gmail Add-On, Office 365 co-editing, and DLP integration. All tasks follow the established patterns with explicit dependencies and verification commands.

---

## Phase 7 Document Productivity Integration Task Index

- [ ] INT‑DOCS‑001 – Outlook Add‑In  
- [ ] INT‑DOCS‑002 – Gmail Add‑On  
- [ ] INT‑DOCS‑003 – Office 365 Co‑Editing Integration  
- [ ] INT‑DOCS‑004 – Third‑Party DLP Integration  

---

## Document Productivity Integrations

### [ ] INT‑DOCS‑001: Outlook Add‑In
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑013 (secure share link API), EMAIL‑SERVICE‑001.  
**Definition of Done:**
- A Microsoft Outlook add‑in (Office Add‑in or COM add‑in) that enables users to:
  - Attach files as secure ShareFile‑style links instead of traditional attachments.
  - Encrypt email body content for sensitive communications.
  - Save received attachments directly to the document storage (Cloudflare R2) with one click.
  - Request files from recipients via a document request list directly from the compose window.
- Add‑in is deployable via the Microsoft 365 admin center.

**Out of Scope:**
- Outlook mobile app integration
- Outlook on the web specific features
- Outlook calendar integration

**Rules to Follow:**
- Use Office JavaScript API for add‑in development
- Implement proper Office 365 authentication
- Follow Microsoft add‑in deployment guidelines
- Handle Outlook security restrictions properly

**Advanced Code Patterns:**
- Office JavaScript API integration
- Secure file upload and link generation
- Email encryption workflows
- Document request management
- Add‑in deployment and updates

**Anti-Patterns:**
- Don't bypass Outlook security model
- Don't store credentials in add‑in code
- Don't ignore Office API limitations
- Don't skip add‑in validation

**Related Files:**
- `integrations/outlook-addin/manifest.xml` – Add‑in manifest
- `integrations/outlook-addin/src/` – Add‑in source code
- `integrations/outlook-addin/secure-links.ts` – Secure link functionality
- `integrations/outlook-addin/email-encryption.ts` – Email encryption
- `integrations/outlook-addin/attachment-handler.ts` – Attachment processing
- `integrations/outlook-addin/document-requests.ts` – Document request functionality
- `lib/integrations/outlook-sync/` – Outlook sync service

**Depends on:**
- API‑DOCS‑013: Secure share link API
- EMAIL‑SERVICE‑001: Email service

**Imports from/exports to:**
- Imports: Document interface, email utilities
- Exports: Outlook add‑in package, deployment scripts

**Blocks:**
- INT‑DOCS‑002: Gmail Add-On

**Verification:**
```bash
# Test add‑in build
pnpm run build:integrations/outlook-addin

# Test secure links
pnpm vitest run -- integrations/outlook-addin/secure-links.test.ts

# Test email encryption
pnpm vitest run -- integrations/outlook-addin/email-encryption.test.ts

# Test attachment handler
pnpm vitest run -- integrations/outlook-addin/attachment-handler.test.ts

# Test document requests
pnpm vitest run -- integrations/outlook-addin/document-requests.test.ts

# Manual verification
# Deploy to Microsoft 365 and test in Outlook desktop/web
```

**Subtasks:**
- [ ] INT‑DOCS‑001.1: Build the Outlook add‑in manifest and basic UI using the Office JavaScript API. (AGENT) – `integrations/outlook‑addin/`  
  **verification:** Add‑in loads in Outlook desktop and web; ribbon button visible.
- [ ] INT‑DOCS‑001.2: Implement "Send Secure Link" function that uploads the attachment and replaces it with a link. (AGENT)  
  **verification:** Selecting a file and clicking the button generates a share link and inserts it into the email body.
- [ ] INT‑DOCS‑001.3: Implement "Save to Storage" function for received attachments. (AGENT)  
  **verification:** Clicking the button on a received email uploads attachments and shows a confirmation.
- [ ] INT‑DOCS‑001.4: Add "Request Files" function that creates a document request list and inserts a link into the email. (AGENT)  
  **verification:** Request list is created and link appears in email.
- [ ] INT‑DOCS‑001.5: Test add‑in in Outlook desktop and Outlook on the web. (HUMAN)  
  **verification:** Add‑in works correctly in both environments.

### [ ] INT‑DOCS‑002: Gmail Add‑On
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑013 (secure share link API), EMAIL‑SERVICE‑001.  
**Definition of Done:**
- A Google Workspace Add‑on (Gmail add‑on) that provides:
  - Attach files as secure links instead of regular attachments.
  - Encrypt email content.
  - Save received attachments directly to the document storage.
  - Request files from recipients via a document request list.
- Published to the Google Workspace Marketplace (or private domain install).

**Out of Scope:**
- Gmail mobile app integration
- Google Chat integration
- Google Meet integration

**Rules to Follow:**
- Use Google Apps Script with CardService for UI
- Implement proper Google Workspace authentication
- Follow Google Workspace add‑on guidelines
- Handle Gmail security restrictions properly

**Advanced Code Patterns:**
- Google Apps Script development
- CardService UI framework
- Google Workspace OAuth 2.0
- Gmail add‑in deployment
- Document request workflows

**Anti-Patterns:**
- Don't bypass Gmail security model
- Don't store credentials in Apps Script
- Don't ignore Google API quotas
- Don't skip add‑in validation

**Related Files:**
- `integrations/gmail-addon/appsscript.json` – Apps Script manifest
- `integrations/gmail-addon/Code.gs` – Main Apps Script code
- `integrations/gmail-addon/secure-links.ts` – Secure link functionality
- `integrations/gmail-addon/email-encryption.ts` – Email encryption
- `integrations/gmail-addon/attachment-handler.ts` – Attachment processing
- `integrations/gmail-addon/document-requests.ts` – Document request functionality
- `lib/integrations/gmail-sync/` – Gmail sync service

**Depends on:**
- API‑DOCS‑013: Secure share link API
- EMAIL‑SERVICE‑001: Email service

**Imports from/exports to:**
- Imports: Document interface, email utilities
- Exports: Gmail add‑on package, deployment scripts

**Blocks:**
- INT‑DOCS‑003: Office 365 Co-Editing Integration

**Verification:**
```bash
# Test Apps Script
clasp push

# Test secure links
pnpm vitest run -- integrations/gmail-addon/secure-links.test.ts

# Test email encryption
pnpm vitest run -- integrations/gmail-addon/email-encryption.test.ts

# Test attachment handler
pnpm vitest run -- integrations/gmail-addon/attachment-handler.test.ts

# Test document requests
pnpm vitest run -- integrations/gmail-addon/document-requests.test.ts

# Manual verification
# Deploy to Google Workspace Marketplace and test in Gmail
```

**Subtasks:**
- [ ] INT‑DOCS‑002.1: Create the Gmail add‑on using Google Apps Script and CardService. (AGENT) – `integrations/gmail‑addon/`  
  **verification:** Add‑on appears in Gmail sidebar; card UI renders.
- [ ] INT‑DOCS‑002.2: Implement "Send Secure Link" and "Save to Storage" card actions. (AGENT)  
  **verification:** Actions work within the Gmail interface.
- [ ] INT‑DOCS‑002.3: Add "Request Files" card action. (AGENT)  
  **verification:** Document request list created and link inserted into email.
- [ ] INT‑DOCS‑002.4: Test and deploy to Google Workspace Marketplace. (HUMAN)  
  **verification:** Add‑on installable from marketplace and functional.

### [ ] INT‑DOCS‑003: Office 365 Co‑Editing Integration
**Status:** ⏳ Not Started  
**Depends on:** DOC‑STORAGE‑001, API‑DOCS‑004.  
**Definition of Done:**
- Enable real‑time collaborative editing of Word, Excel, and PowerPoint documents stored in the document management system using Office Online.
- When a user opens a document, a WOPI‑like integration (or direct Office Online embedding) allows editing in the browser.
- Changes are automatically saved back to the document storage.
- Support multiple users editing simultaneously with lock management.
- Integration is seamless: clicking "Edit" on a document in the web app opens the Office Online editor in an iframe or new tab.

**Out of Scope:**
- Office desktop application integration
- Office mobile app integration
- Advanced Office Online features (macros, add‑ins)

**Rules to Follow:**
- Use Office Online APIs with proper authentication
- Implement document lock management
- Handle Office Online licensing requirements
- Follow Microsoft WOPI protocol guidelines

**Advanced Code Patterns:**
- WOPI protocol implementation
- Office Online embedding
- Document lock management
- Real-time collaboration
- Change synchronization

**Anti-Patterns:**
- Don't bypass Office Online security
- Don't ignore document locking
- Don't skip change synchronization
- Don't store Office credentials insecurely

**Related Files:**
- `lib/integrations/office-online/wopi-host.ts` – WOPI host implementation
- `lib/integrations/office-online/document-editor.ts` – Document editor integration
- `lib/integrations/office-online/lock-manager.ts` – Document lock management
- `lib/integrations/office-online/change-sync.ts` – Change synchronization
- `lib/integrations/office-online/office-embed.ts` – Office Online embedding
- `lib/integrations/office-sync/` – Office sync service

**Depends on:**
- DOC‑STORAGE‑001: Cloudflare R2 storage
- API‑DOCS‑004: Document management API

**Imports from/exports to:**
- Imports: Document interface, Office utilities
- Exports: Office Online adapter, WOPI host, lock manager

**Blocks:**
- INT‑DOCS‑004: Third-Party DLP Integration

**Verification:**
```bash
# Test WOPI host
pnpm vitest run -- lib/integrations/office-online/wopi-host.test.ts

# Test document editor
pnpm vitest run -- lib/integrations/office-online/document-editor.test.ts

# Test lock manager
pnpm vitest run -- lib/integrations/office-online/lock-manager.test.ts

# Test change sync
pnpm vitest run -- lib/integrations/office-online/change-sync.test.ts

# Test Office embed
pnpm vitest run -- lib/integrations/office-online/office-embed.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/office-online/test-edit
```

**Subtasks:**
- [ ] INT‑DOCS‑003.1: Implement a WOPI host endpoint (or use Microsoft Graph for OneDrive co‑editing integration). (AGENT) – `lib/integrations/office‑online/`  
  **verification:** Office documents can be opened in edit mode via Office Online.
- [ ] INT‑DOCS‑003.2: Configure the document service to redirect "Edit" actions to the Office Online URL with the file token. (AGENT)  
  **verification:** Clicking "Edit" on a Word document opens it in the browser with full editing capabilities.
- [ ] INT‑DOCS‑003.3: Implement save‑back and conflict resolution. (AGENT)  
  **verification:** Changes made in Office Online are saved as a new document version.
- [ ] INT‑DOCS‑003.4: Test co‑editing with multiple users. (HUMAN)  
  **verification:** Two users can edit simultaneously; changes merge correctly.

### [ ] INT‑DOCS‑004: Third‑Party DLP Integration
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑013 (share link API), DOC‑STORAGE‑001.  
**Definition of Done:**
- Integrate with a Data Loss Prevention (DLP) system (e.g., Symantec, McAfee, Microsoft Information Protection, or a cloud‑based DLP API) to scan files for sensitive content (PII, PHI, PCI, custom patterns) before allowing sharing or upload.
- When a user attempts to share a file or create a share link, the file is scanned. If a policy violation is detected:
  - The user is warned and given the option to encrypt the file or cancel.
  - Administrators can configure blocking (prevent share) or warning mode.
- Scan results are logged in the audit trail.
- The DLP integration is abstracted behind a port interface so the provider can be swapped.

**Out of Scope:**
- Real-time DLP scanning during document editing
- Endpoint DLP integration
- Network traffic DLP monitoring

**Rules to Follow:**
- Use DLP provider APIs with proper authentication
- Implement secure file content transmission
- Handle DLP policy configuration properly
- Follow data protection regulations

**Advanced Code Patterns:**
- DLP provider abstraction
- Content scanning workflows
- Policy enforcement engine
- Audit trail integration
- Provider switching capabilities

**Anti-Patterns:**
- Don't transmit file content insecurely
- Don't ignore DLP policy violations
- Don't skip audit logging
- Don't hardcode DLP provider logic

**Related Files:**
- `lib/integrations/dlp/dlp-port.ts` – DLP provider interface
- `lib/integrations/dlp/mock-provider.ts` – Mock DLP provider
- `lib/integrations/dlp/dlp-scanner.ts` – Content scanning service
- `lib/integrations/dlp/policy-enforcer.ts` – Policy enforcement
- `lib/integrations/dlp/dlp-config.ts` – DLP configuration
- `lib/integrations/dlp/audit-logger.ts` – Audit logging
- `lib/integrations/dlp-sync/` – DLP sync service

**Depends on:**
- API‑DOCS‑013: Secure share link API
- DOC‑STORAGE‑001: Cloudflare R2 storage

**Imports from/exports to:**
- Imports: Document interface, DLP utilities
- Exports: DLP adapter, policy enforcer, audit logger

**Blocks:**
- INT‑TEST‑001: End-to-End Integration Testing

**Verification:**
```bash
# Test DLP port
pnpm vitest run -- lib/integrations/dlp/dlp-port.test.ts

# Test mock provider
pnpm vitest run -- lib/integrations/dlp/mock-provider.test.ts

# Test DLP scanner
pnpm vitest run -- lib/integrations/dlp/dlp-scanner.test.ts

# Test policy enforcer
pnpm vitest run -- lib/integrations/dlp/policy-enforcer.test.ts

# Test audit logger
pnpm vitest run -- lib/integrations/dlp/audit-logger.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/dlp/test-scan
```

**Subtasks:**
- [ ] INT‑DOCS‑004.1: Define `DLPProviderPort` interface and implement a stub/mock provider. (AGENT) – `lib/integrations/dlp/dlp‑port.ts`  
  **verification:** Interface defined; mock returns safe/flag based on test data.
- [ ] INT‑DOCS‑004.2: Integrate DLP check into the document upload and share link creation flows. (AGENT)  
  **verification:** Uploading a file with mock PII triggers a warning; sharing is blocked or warned.
- [ ] INT‑DOCS‑004.3: Implement a concrete DLP adapter (e.g., calling an external API). (AGENT)  
  **verification:** Adapter sends file content to external service and parses response.
- [ ] INT‑DOCS‑004.4: Add admin settings for DLP policy configuration (block vs. warn, patterns). (AGENT)  
  **verification:** Settings page allows updating DLP policies.
- [ ] INT‑DOCS‑004.5: Write integration tests for DLP scenarios. (AGENT)  
  **verification:** Tests verify policy enforcement and logging.

---

*End of Phase 7 Document Productivity Integrations. Next: TODO-P7-TESTING.md – Integration Testing.*
