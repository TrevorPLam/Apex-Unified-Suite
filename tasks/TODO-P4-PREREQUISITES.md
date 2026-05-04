# TODO-P4-PREREQUISITES.md – Phase 4 Prerequisites: Email, Templates & Storage Foundation

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the foundational services needed for Phase 4: Email Service with templating, and Storage Adapter foundation. These prerequisites enable the Documents, Portal, and Appointments contexts.

---

## Phase 4 Prerequisites

### [ ] EMAIL‑SERVICE‑001: Email Service Interface & Implementation
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

### [ ] EMAIL‑TEMPLATES‑001: Email Templates Implementation
**Status:** ⏳ Not Started  
**Depends on:** EMAIL‑SERVICE‑001 (EmailServicePort interface).  
**Blocks:** PORTAL‑AUTH‑001 (magic link email), API‑APPT‑003 (appointment confirmation/cancellation emails).  
**Definition of Done:**  
- `artifacts/api-server/src/lib/email/templates/` directory with template files for: magic link email, appointment confirmation, appointment cancellation.  
- `EmailTemplateEngine` class that renders templates with variable substitution using Handlebars or simple string interpolation.  
- Template registry that maps template IDs to template files.  
- Unit tests for each template rendering with sample data.  
- Integration with `EmailServicePort.sendTemplate()` method.  
**Deep Module:** Encapsulates template rendering logic, variable substitution, and template registry management.  
**Advanced Code Patterns:** Template engine pattern, registry pattern, proper separation of concerns.  
**Anti-Patterns:** Avoid hardcoded templates, prevent injection vulnerabilities.  
**Rules to Follow:** Always validate template variables, escape user input, maintain template versioning.  
**Out of Scope:** Dynamic template creation, user-defined templates.  
**Verification:** `pnpm test -- email-templates && pnpm typecheck`

**Templates Required:**
- `magic-link`: Sends login link with expiry time
- `appointment-confirmation`: Confirms appointment details with client info
- `appointment-cancellation`: Notifies of cancellation with reason

**Subtasks:**
- [ ] EMAIL‑TEMPLATES‑001.1: Create template engine and registry. (AGENT) – `template-engine.ts`  
  **verification:** `pnpm typecheck`.
- [ ] EMAIL‑TEMPLATES‑001.2: Implement magic-link template with proper validation. (AGENT) – `templates/magic-link.ts`  
  **verification:** Unit test renders with sample data, validates required variables.
- [ ] EMAIL‑TEMPLATES‑001.3: Implement appointment confirmation template. (AGENT) – `templates/appointment-confirmation.ts`  
  **verification:** Unit test passes.
- [ ] EMAIL‑TEMPLATES‑001.4: Implement appointment cancellation template. (AGENT) – `templates/appointment-cancellation.ts`  
  **verification:** Unit test passes.
- [ ] EMAIL‑TEMPLATES‑001.5: Write integration test with EmailServicePort. (AGENT)  
  **verification:** Template rendering works end-to-end.

---

### [ ] STORAGE‑001: File Storage Adapter Foundation
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

## Progress Tracking

### Overall Status
**Phase 4 Prerequisites:** [ ] 0/3 parent tasks complete

### Dependencies
- **EMAIL-SERVICE-001** enables all email-based functionality in Phase 4
- **EMAIL-TEMPLATES-001** enables templated email communications
- **STORAGE-001** enables all file storage operations

### Next Actions
- [ ] Start EMAIL-SERVICE-001.1: Create EmailServicePort interface
- [ ] Start STORAGE-001.1: Create base storage interfaces
- [ ] Start EMAIL-TEMPLATES-001.1: Create template engine (after EMAIL-SERVICE-001)

### Verification Commands
```bash
# EMAIL-SERVICE-001 verification
pnpm test -- email-service
pnpm typecheck

# EMAIL-TEMPLATES-001 verification
pnpm test -- email-templates
pnpm typecheck

# STORAGE-001 verification
pnpm test -- base-storage
pnpm typecheck
```

---

## File Index
- `artifacts/api-server/src/lib/email/email-service.ts` - EmailServicePort interface
- `artifacts/api-server/src/lib/email/smtp-provider.ts` - SMTP implementation
- `artifacts/api-server/src/lib/email/mock-provider.ts` - Test implementation
- `artifacts/api-server/src/lib/email/templates/` - Template directory
- `artifacts/api-server/src/lib/storage/base-storage.ts` - Storage foundation
