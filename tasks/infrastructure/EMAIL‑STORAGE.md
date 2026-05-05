# tasks/infrastructure/EMAIL‑STORAGE.md – Email Service & Storage Foundation

This file contains the foundational service interfaces and implementations for email delivery (with templating) and file storage abstraction. These must be completed before any Phase 4 domain tasks that require email or document storage (Portal, Documents, Appointments, etc.).

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] EMAIL‑SERVICE‑001: Email Service Interface & Implementation
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No email sending capability exists. `artifacts/api‑server/src/lib/email/` does not exist. Portal magic links, appointment notifications, and document requests are all blocked until an `EmailServicePort` is defined.
**Size:** Medium

**Description:** Define the `EmailServicePort` interface and two concrete implementations — a production SMTP provider (Nodemailer) and a test mock provider — so all Phase 4 contexts can send emails without coupling to a specific transport.

**Depends on:** [N/A]
**Blocks:** `infrastructure/EMAIL‑STORAGE.md → EMAIL‑TEMPLATES‑001`, `portal/PORTAL‑ACCESS.md → PORTAL‑AUTH‑001`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑003`, `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑010`
**Related Files:** `artifacts/api‑server/src/lib/email/email‑service.ts`, `artifacts/api‑server/src/lib/email/smtp‑provider.ts`, `artifacts/api‑server/src/lib/email/mock‑provider.ts`, `artifacts/api‑server/.env.example`

**Definition of Done**
- [ ] `EmailServicePort` interface with methods: `sendEmail(to, subject, body, html?)`, `sendTemplate(to, templateId, variables)`
- [ ] `SMTPEmailProvider` implements `EmailServicePort` using Nodemailer with SMTP config from env
- [ ] `MockEmailProvider` implements `EmailServicePort` for testing; stores sent emails in memory with `getSentEmails()` and `clearSentEmails()` inspection methods
- [ ] SMTP env vars documented in `.env.example`
- [ ] Contract tests validate both providers against the same interface spec
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Email templating (covered by EMAIL‑TEMPLATES‑001)
- Webhook delivery verification or bounce handling
- HTML email design system or CSS inlining

**Rules to Follow**
- `EmailServicePort` must be a TypeScript interface, not an abstract class
- `MockEmailProvider` must be stateless between test runs; callers call `clearSentEmails()` in `afterEach`
- SMTP connection config must be validated with Zod at construction time
- Never log email body content — log only recipient/subject/timestamp at DEBUG level

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- email‑service
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email sending is an infrastructure concern; the port isolates domain services from transport details.
- TDD: Write contract tests against the interface before implementing providers.
- BDD: [N/A] — infrastructure concern.
- Deep Module: `EmailServicePort` hides SMTP handshake, retry logic, and connection pooling behind two methods.

---

### Subtasks
- [ ] EMAIL‑SERVICE‑001.0.25 (AGENT): Read this task, `artifacts/api‑server/src/app.ts`, and `artifacts/api‑server/package.json` in full. *No action — pause.*
- [ ] EMAIL‑SERVICE‑001.0.5 (AGENT): Research Nodemailer v6+ API and confirm ESM compatibility. *Document findings briefly.*
- [ ] EMAIL‑SERVICE‑001.1 (AGENT): Create `EmailServicePort` interface and supporting types.
  **File(s):** `artifacts/api‑server/src/lib/email/email‑service.ts`
  **Verification:** `pnpm run typecheck` — no errors.
- [ ] EMAIL‑SERVICE‑001.2 (AGENT): Implement `SMTPEmailProvider` with Nodemailer and Zod‑validated config.
  **File(s):** `artifacts/api‑server/src/lib/email/smtp‑provider.ts`
  **Verification:** `pnpm run typecheck` — no errors.
- [ ] EMAIL‑SERVICE‑001.3 (AGENT): Implement `MockEmailProvider` with in‑memory email store and inspection methods.
  **File(s):** `artifacts/api‑server/src/lib/email/mock‑provider.ts`
  **Verification:** `pnpm run typecheck` — no errors.
- [ ] EMAIL‑SERVICE‑001.4 (AGENT): Write contract tests for both providers; add SMTP env vars to `.env.example`.
  **File(s):** `artifacts/api‑server/src/__tests__/lib/email/email‑service.test.ts`, `artifacts/api‑server/.env.example`
  **Verification:** `pnpm --filter @workspace/api‑server test -- email‑service` → all green.
- [ ] EMAIL‑SERVICE‑001.5 (HUMAN): Manual SMTP integration test with a real provider (Mailpit locally or SendGrid sandbox). Verify email arrives with correct subject and sender. **Verification:** Email arrives in inbox.
- [ ] EMAIL‑SERVICE‑001.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] EMAIL‑TEMPLATES‑001: Email Templates Implementation
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** No email template system exists. `EmailServicePort.sendTemplate()` is defined but has no backing implementation. Portal magic link and appointment emails are blocked.
**Size:** Medium

**Description:** Implement a Handlebars‑based template engine with a named template registry, and wire it into `EmailServicePort.sendTemplate()` so callers only supply a template ID and a variables dict.

**Depends on:** `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`
**Blocks:** `portal/PORTAL‑ACCESS.md → PORTAL‑AUTH‑001`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑003`
**Related Files:** `artifacts/api‑server/src/lib/email/template‑engine.ts`, `artifacts/api‑server/src/lib/email/templates/`

**Definition of Done**
- [ ] `EmailTemplateEngine` with `render(templateId, variables)` returning `{ subject, html, text }`
- [ ] Template registry maps `magic‑link`, `appointment‑confirmation`, `appointment‑cancellation` to compiled Handlebars templates
- [ ] Each template ID has a Zod variable schema; missing required variables surface a typed `TemplateVariableError`
- [ ] `SMTPEmailProvider.sendTemplate()` delegates to `EmailTemplateEngine.render()` and sends the resulting HTML/text
- [ ] Unit tests cover each template with valid data and with missing required variables
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Dynamic template creation by end‑users
- HTML email design system or CSS inlining
- Template versioning or A/B testing

**Rules to Follow**
- All Handlebars expressions must use `{{variable}}` (HTML‑escaped), never `{{{variable}}}` (raw)
- Variable validation schema must be defined per template ID
- Templates are compiled once at startup and cached — no runtime recompilation
- `sendTemplate` must return `Result<void, EmailError>`, not throw

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- template‑engine
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Template engine is an infrastructure adapter.
- TDD: Test each template with valid data first, then with missing required variables.
- BDD: “Given a new portal client, when I trigger magic link, then the client receives a formatted email with their login link.”
- Deep Module: Template engine hides Handlebars compilation, file loading, and Zod validation behind a single `render()` call.

---

### Subtasks
- [ ] EMAIL‑TEMPLATES‑001.0.25 (AGENT): Read this task and `EMAIL‑SERVICE‑001` interface. *No action — pause.*
- [ ] EMAIL‑TEMPLATES‑001.0.5 (AGENT): Research Handlebars v4 ESM compatibility. If not compatible, use inline TypeScript templates. *Document findings briefly.*
- [ ] EMAIL‑TEMPLATES‑001.1 (AGENT): Create template engine with registry and Zod variable validation.
  **File(s):** `artifacts/api‑server/src/lib/email/template‑engine.ts`
  **Verification:** `pnpm run typecheck` — no errors.
- [ ] EMAIL‑TEMPLATES‑001.2 (AGENT): Implement `magic‑link` template.
  **File(s):** `artifacts/api‑server/src/lib/email/templates/magic‑link.ts`
  **Verification:** Unit test renders and rejects missing variables.
- [ ] EMAIL‑TEMPLATES‑001.3 (AGENT): Implement `appointment‑confirmation` template. **Verification:** Unit test passes.
- [ ] EMAIL‑TEMPLATES‑001.4 (AGENT): Implement `appointment‑cancellation` template. **Verification:** Unit test passes.
- [ ] EMAIL‑TEMPLATES‑001.5 (AGENT): Write integration test with `MockEmailProvider` to verify full `sendTemplate` flow.
  **File(s):** `artifacts/api‑server/src/__tests__/lib/email/template‑engine.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- template‑engine` → all green.
- [ ] EMAIL‑TEMPLATES‑001.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] STORAGE‑001: File Storage Adapter Foundation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No file storage abstraction exists. `artifacts/api‑server/src/lib/storage/` does not exist. Document upload (DOC‑STORAGE‑001) is blocked until common storage error types and the base adapter contract are defined.
**Size:** Small

**Description:** Define the base storage interfaces, common error types, and abstract `BaseStorageAdapter` that all concrete storage implementations (R2, local FS) must extend.

**Depends on:** [N/A]
**Blocks:** `documents/DOCUMENTS‑MANAGEMENT.md → DOC‑STORAGE‑001`
**Related Files:** `artifacts/api‑server/src/lib/storage/base‑storage.ts`

**Definition of Done**
- [ ] `StorageAdapter` interface with: `upload(key, content, contentType?)`, `download(key)`, `getSignedUrl(key, expiresIn)`, `delete(key)`, `list(prefix?)`
- [ ] `BaseStorageAdapter` abstract class implements `StorageKey` brand validation and common error mapping
- [ ] Error hierarchy: `StorageError` (base) → `StorageBackendUnavailable`, `FileNotFound`, `InvalidKey`
- [ ] Storage configuration types and Zod validation schemas exported
- [ ] Unit tests cover key validation logic and error hierarchy instantiation
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Concrete storage implementations (R2, local FS) — covered by DOC‑STORAGE‑001
- File compression or content transformation
- Access control or signed URL policy configuration

**Rules to Follow**
- Storage keys must be validated as a branded `StorageKey` type — prevent path traversal attacks with key regex validation
- Error classes must extend `StorageError` with a `code` string for programmatic `switch` handling

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- base‑storage
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Storage is a pure infrastructure concern; no domain knowledge in the adapter.
- TDD: Test key validation and error hierarchy before writing any concrete adapter.
- BDD: [N/A]
- Deep Module: `StorageAdapter` interface hides all transport details; callers only know keys and content.

---

### Subtasks
- [ ] STORAGE‑001.0.25 (AGENT): Read this task and `documents/DOCUMENTS‑MANAGEMENT.md → DOC‑STORAGE‑001` to understand how the base will be extended. *No action — pause.*
- [ ] STORAGE‑001.0.5 (AGENT): Research AWS SDK v3 `@aws‑sdk/client‑s3` ESM support and Cloudflare R2 compatibility. *Document findings briefly.*
- [ ] STORAGE‑001.1 (AGENT): Create base storage interfaces, error types, and abstract class.
  **File(s):** `artifacts/api‑server/src/lib/storage/base‑storage.ts`
  **Verification:** `pnpm run typecheck` — no errors.
- [ ] STORAGE‑001.2 (AGENT): Write unit tests for key validation and error hierarchy.
  **File(s):** `artifacts/api‑server/src/__tests__/lib/storage/base‑storage.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- base‑storage` → all green.
- [ ] STORAGE‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---