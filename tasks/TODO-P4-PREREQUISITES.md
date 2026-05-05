# TODO-P4-PREREQUISITES.md – Phase 4 Prerequisites: Email, Templates & Storage Foundation

This file covers the foundational services needed for Phase 4: the Email Service interface with templating, and the Storage Adapter foundation. These prerequisites must complete before the Documents, Portal, and Appointments contexts can begin.



---

## Phase 4 Prerequisites

### [ ] EMAIL‑SERVICE‑001: Email Service Interface & Implementation
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No email sending capability exists. `artifacts/api-server/src/lib/email/` does not exist. Portal magic links, appointment notifications, and document requests are all blocked until an `EmailServicePort` is defined.  
**Size:** Medium  

**Description:** Define the `EmailServicePort` interface and two concrete implementations — a production SMTP provider (Nodemailer) and a test mock provider — so all Phase 4 contexts can send emails without coupling to a specific transport.  

**Depends on:** [N/A]  
**Blocks:** PORTAL‑AUTH‑001 (magic link emails), API‑APPT‑003 (appointment notifications), API‑PORTAL‑003 (portal messaging), EMAIL‑TEMPLATES‑001  
**Related Files:** `artifacts/api-server/src/lib/email/email-service.ts`, `artifacts/api-server/src/lib/email/smtp-provider.ts`, `artifacts/api-server/src/lib/email/mock-provider.ts`, `artifacts/api-server/.env.example`  

**Imports / Exports**
- Imports: `nodemailer` (createTransport, Transporter); `zod` (for config validation)
- Exports: `EmailServicePort` (interface), `SMTPEmailProvider` (class), `MockEmailProvider` (class), `SentEmail` (type for mock inspection)

**Definition of Done**
- [ ] `artifacts/api-server/src/lib/email/email-service.ts` exports `EmailServicePort` interface with methods: `sendEmail(to, subject, body, html?)`, `sendTemplate(to, templateId, variables)`
- [ ] `artifacts/api-server/src/lib/email/smtp-provider.ts` implements `EmailServicePort` using Nodemailer with SMTP config from env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- [ ] `artifacts/api-server/src/lib/email/mock-provider.ts` implements `EmailServicePort` for testing; stores sent emails in memory with `getSentEmails()` and `clearSentEmails()` inspection methods
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` documented in `artifacts/api-server/.env.example` with placeholder values only
- [ ] Contract tests validate both providers against the same interface spec
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm --filter @workspace/api-server test -- email-service` passes

**Out of Scope**
- Email templating (covered by EMAIL‑TEMPLATES‑001)
- Webhook delivery verification or bounce handling
- HTML email design system or CSS inlining
- Rate limiting on email sends (per-context responsibility)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets; add SMTP vars to `.env.example` with placeholder values only

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/email/email-service.ts`, `smtp-provider.ts`, `mock-provider.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/lib/email/email-service.test.ts`
- Documentation: `artifacts/api-server/.env.example` (SMTP vars added)
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/lib/email/`; no DB state changes
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- `EmailServicePort` must be a TypeScript interface, not an abstract class — allows test doubles via structural typing
- `MockEmailProvider` must be stateless between test runs; callers call `clearSentEmails()` in `afterEach`
- SMTP connection config must be validated with Zod at construction time, not at send time
- Never log email body content — log only recipient/subject/timestamp at DEBUG level

**Verification**
```bash
# Run email service tests
pnpm --filter @workspace/api-server test -- email-service

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Port-adapter pattern: `EmailServicePort` is the port; `SMTPEmailProvider` and `MockEmailProvider` are adapters
- Constructor injection for SMTP config (from validated env vars) enables dependency inversion
- `MockEmailProvider.getSentEmails()` in-memory store — avoids `vi.fn()` mocks for integration-test assertions

**Anti-Patterns**
- Coupling services directly to Nodemailer — always inject via `EmailServicePort`
- Logging raw email body — potential PII exposure
- Hard-coding `EMAIL_FROM` — must always come from environment variable

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email sending is an infrastructure concern; the port isolates domain services from transport details
- TDD: Write contract tests against the interface before implementing providers; mock provider enables offline testing
- BDD: [N/A]
- Deep Module: `EmailServicePort` hides SMTP handshake, retry logic, and connection pooling behind two methods

---

### Subtasks

- [ ] EMAIL‑SERVICE‑001.0.25 (AGENT): Read this task, `artifacts/api-server/src/app.ts`, and `artifacts/api-server/package.json` in full.  
  *No action — pause until fully understood.*

- [ ] EMAIL‑SERVICE‑001.0.5 (AGENT): Research Nodemailer v6+ API (May 2026) and confirm ESM compatibility with `"type": "module"` projects. Document `createTransport` signature.  
  *Document findings briefly or note "no changes."*

- [ ] EMAIL‑SERVICE‑001.0.75 (AGENT): Reason about whether `sendTemplate` belongs on the port or in a separate engine. Default: include on the port to keep the interface cohesive.  
  *If uncertain, ask the user before executing.*

- [ ] EMAIL‑SERVICE‑001.1 (AGENT): Create `EmailServicePort` interface and supporting types.  
  **File(s):** `artifacts/api-server/src/lib/email/email-service.ts`  
  **Verification:** `pnpm run typecheck` — no errors.

- [ ] EMAIL‑SERVICE‑001.2 (AGENT): Implement `SMTPEmailProvider` with Nodemailer and Zod-validated config.  
  **File(s):** `artifacts/api-server/src/lib/email/smtp-provider.ts`  
  **Verification:** `pnpm run typecheck` — no errors.

- [ ] EMAIL‑SERVICE‑001.3 (AGENT): Implement `MockEmailProvider` with in-memory email store and inspection methods.  
  **File(s):** `artifacts/api-server/src/lib/email/mock-provider.ts`  
  **Verification:** `pnpm run typecheck` — no errors.

- [ ] EMAIL‑SERVICE‑001.4 (AGENT): Write contract tests for both providers; add SMTP env vars to `.env.example`.  
  **File(s):** `artifacts/api-server/src/__tests__/lib/email/email-service.test.ts`, `artifacts/api-server/.env.example`  
  **Verification:** `pnpm --filter @workspace/api-server test -- email-service` → all green.

- [ ] EMAIL‑SERVICE‑001.5 (HUMAN): Manual SMTP integration test with a real provider (Mailpit locally or SendGrid sandbox). Verify email arrives with correct subject and sender.  
  **File(s):** [N/A]  
  **Verification:** Email arrives in inbox.

- [ ] EMAIL‑SERVICE‑001.6 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] EMAIL‑TEMPLATES‑001: Email Templates Implementation
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟠 High  
**Current State:** No email template system exists. `EmailServicePort.sendTemplate()` is defined but has no backing implementation. Portal magic link and appointment emails are blocked.  
**Size:** Medium  

**Description:** Implement a Handlebars-based template engine with a named template registry, and wire it into `EmailServicePort.sendTemplate()` so callers only supply a template ID and a variables dict.  

**Depends on:** EMAIL‑SERVICE‑001 (EmailServicePort interface)  
**Blocks:** PORTAL‑AUTH‑001 (magic link email), API‑APPT‑003 (appointment confirmation/cancellation emails)  
**Related Files:** `artifacts/api-server/src/lib/email/template-engine.ts`, `artifacts/api-server/src/lib/email/templates/`  

**Imports / Exports**
- Imports: `handlebars` (compile, SafeString); `zod` (for variable schema validation)
- Exports: `EmailTemplateEngine` (class), `TemplateId` (union type), `renderTemplate(id, vars)` (function)

**Definition of Done**
- [ ] `artifacts/api-server/src/lib/email/template-engine.ts` exports `EmailTemplateEngine` with `render(templateId, variables)` returning `{ subject, html, text }`
- [ ] Template registry maps `magic-link`, `appointment-confirmation`, `appointment-cancellation` to compiled Handlebars templates
- [ ] `templates/magic-link.hbs`: renders `{{link}}`, `{{expiresIn}}`, `{{orgName}}` — all HTML-escaped
- [ ] `templates/appointment-confirmation.hbs`: renders date, time, location, client name, cancellation link
- [ ] `templates/appointment-cancellation.hbs`: renders appointment details and optional `{{reason}}`
- [ ] Each template ID has a Zod variable schema; missing required variables surface a typed `TemplateVariableError`
- [ ] `SMTPEmailProvider.sendTemplate()` delegates to `EmailTemplateEngine.render()` and sends the resulting HTML/text
- [ ] Unit tests cover each template with valid data and with missing required variables
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm --filter @workspace/api-server test -- template-engine` passes

**Out of Scope**
- Dynamic template creation by end-users
- HTML email design system or CSS inlining
- Template versioning or A/B testing
- Rich-text editor for template content

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never render user-supplied template strings — only render from the registry

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/email/template-engine.ts`, `artifacts/api-server/src/lib/email/templates/`
- Tests added/updated in: `artifacts/api-server/src/__tests__/lib/email/template-engine.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/lib/email/templates/` and `template-engine.ts`; no DB state changes
- Halt condition: if any template renders unescaped user data (XSS risk), stop and fix escaping before proceeding

**Rules to Follow**
- All Handlebars expressions must use `{{variable}}` (HTML-escaped), never `{{{variable}}}` (raw)
- Variable validation schema must be defined per template ID; missing required variables throw `TemplateVariableError`
- Templates are compiled once at startup and cached — no runtime recompilation
- `sendTemplate` must return `Result<void, EmailError>`, not throw

**Verification**
```bash
# Run template engine tests
pnpm --filter @workspace/api-server test -- template-engine

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Compiled Handlebars templates cached at module load — zero runtime compilation overhead
- Zod schema per template ID in a discriminated union — compile-time variable type safety
- Template registry as `Record<TemplateId, CompiledTemplate>` — O(1) lookup, no dynamic string matching

**Anti-Patterns**
- Using `{{{triple-braces}}}` for any user-controlled variable — XSS vulnerability
- Loading and compiling templates on every `sendTemplate()` call — performance issue
- Silently sending empty email on template render failure — always surface render errors

**DDD / TDD / BDD / Deep Module notes**
- DDD: Template engine is an infrastructure adapter; the domain only knows template IDs and variable dicts
- TDD: Test each template with valid data first, then with missing required variables
- BDD: "Given a new portal client, when I trigger magic link, then the client receives a formatted email with their login link"
- Deep Module: Template engine hides Handlebars compilation, file loading, and Zod validation behind a single `render()` call

---

### Subtasks

- [ ] EMAIL‑TEMPLATES‑001.0.25 (AGENT): Read this task and `EMAIL‑SERVICE‑001` (`email-service.ts` interface) in full.  
  *No action — pause until the `EmailServicePort` contract is fully understood.*

- [ ] EMAIL‑TEMPLATES‑001.0.5 (AGENT): Research Handlebars v4 ESM compatibility (May 2026). Confirm it works with `"type": "module"` projects. If not, document fallback (string interpolation with Zod validation).  
  *Document findings briefly or note "no changes."*

- [ ] EMAIL‑TEMPLATES‑001.0.75 (AGENT): Reason about whether templates should be `.hbs` files or inline TypeScript strings. Default to inline TypeScript strings for simplicity; use `.hbs` files only if maintainability requires it.  
  *If uncertain, use inline TypeScript template strings.*

- [ ] EMAIL‑TEMPLATES‑001.1 (AGENT): Create template engine with registry and Zod variable validation.  
  **File(s):** `artifacts/api-server/src/lib/email/template-engine.ts`  
  **Verification:** `pnpm run typecheck` — no errors.

- [ ] EMAIL‑TEMPLATES‑001.2 (AGENT): Implement `magic-link` template with required variable schema.  
  **File(s):** `artifacts/api-server/src/lib/email/templates/magic-link.ts`  
  **Verification:** Unit test renders with sample data and rejects missing required variables.

- [ ] EMAIL‑TEMPLATES‑001.3 (AGENT): Implement `appointment-confirmation` template.  
  **File(s):** `artifacts/api-server/src/lib/email/templates/appointment-confirmation.ts`  
  **Verification:** Unit test passes.

- [ ] EMAIL‑TEMPLATES‑001.4 (AGENT): Implement `appointment-cancellation` template.  
  **File(s):** `artifacts/api-server/src/lib/email/templates/appointment-cancellation.ts`  
  **Verification:** Unit test passes.

- [ ] EMAIL‑TEMPLATES‑001.5 (AGENT): Write integration test with `MockEmailProvider` to verify full `sendTemplate` flow end-to-end.  
  **File(s):** `artifacts/api-server/src/__tests__/lib/email/template-engine.test.ts`  
  **Verification:** `pnpm --filter @workspace/api-server test -- template-engine` → all green.

- [ ] EMAIL‑TEMPLATES‑001.6 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] STORAGE‑001: File Storage Adapter Foundation
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No file storage abstraction exists. `artifacts/api-server/src/lib/storage/` does not exist. Document upload (DOC‑STORAGE‑001) is blocked until common storage error types and the base adapter contract are defined.  
**Size:** Small  

**Description:** Define the base storage interfaces, common error types, and abstract `BaseStorageAdapter` that all concrete storage implementations (R2, local FS) must extend.  

**Depends on:** [N/A]  
**Blocks:** DOC‑STORAGE‑001 (Cloudflare R2 adapter extends this foundation)  
**Related Files:** `artifacts/api-server/src/lib/storage/base-storage.ts`  

**Imports / Exports**
- Imports: `zod` (for key validation schema); `node:stream` (Readable, for streaming interface)
- Exports: `StorageAdapter` (interface), `BaseStorageAdapter` (abstract class), `StorageError`, `StorageBackendUnavailable`, `FileNotFound`, `InvalidKey` (error classes), `StorageKey` (branded type)

**Definition of Done**
- [ ] `artifacts/api-server/src/lib/storage/base-storage.ts` exports `StorageAdapter` interface with: `upload(key, content, contentType?)`, `download(key)`, `getSignedUrl(key, expiresIn)`, `delete(key)`, `list(prefix?)`
- [ ] `BaseStorageAdapter` abstract class implements `StorageKey` brand validation and common error mapping; leaves concrete operations abstract
- [ ] Error hierarchy: `StorageError` (base) → `StorageBackendUnavailable`, `FileNotFound`, `InvalidKey`, each with a `code` string property
- [ ] Storage configuration types and Zod validation schemas exported
- [ ] Unit tests cover key validation logic and error hierarchy instantiation
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Concrete storage implementations (R2, local FS) — covered by DOC‑STORAGE‑001
- File compression or content transformation
- Access control or signed URL policy configuration

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/storage/base-storage.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/lib/storage/base-storage.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/lib/storage/`; no DB state changes
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- Storage keys must be validated as a branded `StorageKey` type — prevent path traversal attacks with key regex validation
- Error classes must extend `StorageError` with a `code` string for programmatic `switch` handling
- Abstract methods must carry JSDoc comments documenting expected behavior for implementors

**Verification**
```bash
# Run storage base tests
pnpm --filter @workspace/api-server test -- base-storage

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Branded type `StorageKey = string & { readonly __brand: 'StorageKey' }` — prevents raw strings from bypassing validation
- Error hierarchy with `code` enum — enables `switch(err.code)` handling without `instanceof` chains
- Abstract template method pattern — `BaseStorageAdapter` handles cross-cutting concerns; subclasses handle storage-specific I/O

**Anti-Patterns**
- Accepting raw strings as storage keys without validation — path traversal risk
- Buffering entire file content in memory — use streams for large files
- Catching all errors and rethrowing a generic `StorageError` — loses error specificity

**DDD / TDD / BDD / Deep Module notes**
- DDD: Storage is a pure infrastructure concern; no domain knowledge in the adapter
- TDD: Test key validation and error hierarchy before writing any concrete adapter
- BDD: [N/A]
- Deep Module: `StorageAdapter` interface hides all transport details; callers only know keys and content

---

### Subtasks

- [ ] STORAGE‑001.0.25 (AGENT): Read this task and `DOC‑STORAGE‑001` in `TODO-P4-DOCUMENTS.md` to understand how the base will be extended by the R2 adapter.  
  *No action — pause until fully understood.*

- [ ] STORAGE‑001.0.5 (AGENT): Research AWS SDK v3 `@aws-sdk/client-s3` ESM support (May 2026) and Cloudflare R2 compatibility patterns. Confirm `GetObjectCommand` streaming API.  
  *Document findings briefly or note "no changes."*

- [ ] STORAGE‑001.0.75 (AGENT): Reason about whether to use `Readable` streams or `Buffer` for `download`. Default to `Buffer` first for simplicity; note as a future streaming migration point.  
  *If uncertain, use `Buffer` first.*

- [ ] STORAGE‑001.1 (AGENT): Create base storage interfaces, error types, and abstract class.  
  **File(s):** `artifacts/api-server/src/lib/storage/base-storage.ts`  
  **Verification:** `pnpm run typecheck` — no errors.

- [ ] STORAGE‑001.2 (AGENT): Write unit tests for key validation and error hierarchy.  
  **File(s):** `artifacts/api-server/src/__tests__/lib/storage/base-storage.test.ts`  
  **Verification:** `pnpm --filter @workspace/api-server test -- base-storage` → all green.

- [ ] STORAGE‑001.3 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

## Execution Order

```
EMAIL‑SERVICE‑001 (email port + providers)
  └─> EMAIL‑TEMPLATES‑001 (template engine + registry)
STORAGE‑001 (base storage interfaces)
  └─> DOC‑STORAGE‑001 (R2 adapter, in TODO-P4-DOCUMENTS.md)
```

EMAIL‑SERVICE‑001 and STORAGE‑001 can run in parallel.
