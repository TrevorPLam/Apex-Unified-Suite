# TODO-P1-ERRORS.md – Phase 1: Error Handling Foundation

This document contains error handling tasks that provide the foundation for all authentication and domain operations. These tasks must be completed before service implementation.

---

## [ ] ERROR-002: Define Domain Error Types
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No `errors/` directory exists under `artifacts/api-server/src/`. No domain error types are defined. All errors are currently untyped and inconsistent.
**Size:** Large

**Description:** Define and export a typed, exhaustive domain error catalog (40+ classes) covering all bounded contexts, using the `neverthrow` Either pattern as the project-wide error contract.

**Depends on:** DEP-001 (neverthrow dependency installed)
**Blocks:** AUTH-003, AUTH-004, AUTH-005, AUTH-006, AUTH-008, and all Phase 3+ service implementations
**Related Files:** `artifacts/api-server/src/errors/domain-errors.ts`

**Imports / Exports**
- Imports: `neverthrow` (`Result`, `err`, `ok`, `Err`)
- Exports: `DomainError` (base class), all context-specific error classes, error factory functions

**Definition of Done**
- [ ] `artifacts/api-server/src/errors/domain-errors.ts` exists and compiles without errors
- [ ] `DomainError` base class exposes `code: string`, `message: string`, and optional `metadata?: Record<string, unknown>`
- [ ] All 8 Identity & Access error classes implemented: `InvalidCredentials`, `TokenExpired`, `DuplicateEmail`, `UserNotFound`, `InvalidOrganization`, `InsufficientPermissions`, `RoleNotFound`, `PermissionDenied`
- [ ] All 9 CRM error classes implemented: `InvalidStageTransition`, `LeadNotFound`, `DuplicateLead`, `ContactNotFound`, `CompanyNotFound`, `DuplicateDomain`, `DealNotFound`, `InvalidProbability`, `ActivityNotFound`
- [ ] All Projects error classes implemented: `ProjectNotFound`, `TaskNotFound`, `TaskHasUnfinishedSubtasks`, `MilestoneAlreadyCompleted`, `ProgressIsReadOnly`, `InvalidStatusTransition`
- [ ] All Finance error classes implemented: `InvoiceNotFound`, `InvoiceTypeViolation`, `PaymentExceedsBalance`, `BudgetExceeded`, `BudgetThresholdReached`, `DuplicatePayment`, `VirtualCardNotFound`, `InsufficientLimit`
- [ ] All Document error classes implemented: `DocumentNotFound`, `SignatureRequestNotFound`, `DocumentAlreadySigned`, `StorageAdapterError`, `InvalidDocumentType`
- [ ] All Asset error classes implemented: `AssetNotFound`, `AssetNotAvailable`, `CheckoutNotAllowed`, `MaintenanceRequired`, `DepreciationError`
- [ ] All Portal error classes implemented: `MagicLinkInvalid`, `MagicLinkExpired`, `PortalAccessDenied`, `SessionNotFound`
- [ ] Analytics & Settings errors: `ReportNotFound`, `InvalidDateRange`, `ConfigurationError`
- [ ] Generic errors: `ValidationError`, `DatabaseError`, `NetworkError`, `TimeoutError`
- [ ] Extended catalog (ERROR-002.6) includes Appointments, advanced Finance/Documents/CRM/Projects errors
- [ ] Error factory functions exist and return properly typed `Err<DomainError, never>`
- [ ] Unit tests exist for every error class verifying code, message, and metadata shape
- [ ] `pnpm typecheck` passes

**Out of Scope**
- HTTP status code mapping (belongs in ERROR-001)
- Sentry/monitoring integration (belongs in ERROR-001)
- Any database migrations or schema changes
- Auth token storage or validation logic

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never touch `app.ts` or any route files (this task is purely the error catalog)

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/errors/domain-errors.ts` (new file)
- Tests added/updated in: `artifacts/api-server/__tests__/errors/domain-errors.test.ts` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `domain-errors.ts` and its test file
- Halt condition: if `pnpm typecheck` fails after implementation, revert the entire file before proceeding

**Rules to Follow**
- All domain errors must extend the base `DomainError` class
- Error `code` values must be unique across all bounded contexts; use context prefix convention: `AUTH_`, `CRM_`, `PROJ_`, `FIN_`, `DOC_`, `ASSET_`, `PORTAL_`, `ANALYTICS_`, `GEN_`
- Error messages must be user-friendly and actionable; never expose internal implementation details or DB error text
- Auth-related error messages must be deliberately generic to prevent user enumeration (OWASP Auth Cheat Sheet): e.g., `InvalidCredentials` message must read "Invalid email or password" — not "User not found" vs "Wrong password"
- All errors must return `Err<DomainError, never>` via neverthrow — never throw exceptions
- Error metadata must include debugging context but must NEVER include credentials, tokens, or PII

**Verification**
```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server test -- domain-errors.test.ts
```

**Advanced Code Patterns**
- Either monad (`Result<T, DomainError>`) from `neverthrow` as the universal error contract across all services
- Domain error taxonomy with a shared base class and per-context subclasses
- Error factory functions (`makeInvalidCredentials(meta?)`) for concise, consistent error creation at call sites
- Error codes as string literal constants (not enums) for tree-shaking and easy serialization
- Deliberate constant-time messaging for auth errors to prevent timing-based user enumeration (OWASP)

**Anti-Patterns**
- Using raw string literals at return sites instead of typed error factories
- Mixing domain errors with infrastructure/technical errors in the same class hierarchy level
- Exposing SQL errors, stack traces, or DB field names in error `message` fields
- Using numeric error codes (collision-prone and opaque to consumers)
- Placing HTTP status code mapping logic inside error classes (belongs in error-handler middleware)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain errors express business rule violations in ubiquitous language. Each bounded context owns its error namespace. `InvalidCredentials` belongs to Identity; `InvalidStageTransition` belongs to CRM.
- TDD: Write unit tests for each error class before marking the task complete. Tests verify code uniqueness, message format, and metadata structure.
- BDD: Error types map directly to negative BDD scenarios — `DuplicateEmail` corresponds to the "register with existing email" scenario in `auth.feature`.
- Deep Module: The error module is shallow in interface (simple constructors/factories) but provides a deep, typed contract for all domain failures across the entire backend.

---

### Subtasks

- [ ] ERROR-002.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] ERROR-002.0.5 (AGENT): Research latest best practices for domain error modeling with neverthrow, OWASP error handling, and user enumeration prevention (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] ERROR-002.0.75 (AGENT): Reason about the task — particularly error code uniqueness constraints, prefix conventions, and the extended catalog scope.
  *If uncertain about any error's bounded context ownership, ask the user before executing.*

- [ ] ERROR-002.1 (AGENT): Define base `DomainError` class with `code`, `message`, and optional `metadata`; set up `Err<DomainError, never>` return type using neverthrow.
  **File(s):** `artifacts/api-server/src/errors/domain-errors.ts`
  **Verification:** Base class compiles; `Err<DomainError, never>` type resolves correctly via `pnpm typecheck`

- [ ] ERROR-002.2 (AGENT): Implement all 8 Identity & Access error classes with deliberately generic auth messages.
  **File(s):** `artifacts/api-server/src/errors/domain-errors.ts`
  **Verification:** Unit tests for each Identity error pass; error codes use `AUTH_` prefix; `InvalidCredentials.message` is generic

- [ ] ERROR-002.3 (AGENT): Implement all 9 CRM error classes. Cross-reference codes with any feature file negative scenarios.
  **File(s):** `artifacts/api-server/src/errors/domain-errors.ts`
  **Verification:** Unit tests pass; codes use `CRM_` prefix; codes match feature file expectations

- [ ] ERROR-002.4 (AGENT): Implement Projects, Finance, Documents, Assets, Portal, Analytics & Settings, and Generic error classes (25+ errors).
  **File(s):** `artifacts/api-server/src/errors/domain-errors.ts`
  **Verification:** All 40+ error classes implemented and tested; `pnpm typecheck` passes

- [ ] ERROR-002.5 (AGENT): Create error factory functions for consistent call-site usage.
  **File(s):** `artifacts/api-server/src/errors/domain-errors.ts`
  **Verification:** Factory functions return `Err<DomainError, never>`; consumers never need to call `new DomainError()` directly

- [ ] ERROR-002.6 (AGENT): Extend catalog with error types for expanded BDD feature files.
  Add Appointments: `NoShowRecorded`, `WaitlistFull`, `EventTypeNotFound`, `BookingLimitReached`, `InvalidEventTypeConfiguration`, `CollectiveNotAvailable`
  Add Finance: `CreditMemoNotFound`, `PaymentRunNotFound`, `CurrencyMismatch`, `ReconciliationFailed`, `DuplicatePaymentRun`, `Non1099Vendor`, `TaxMiscalculation`
  Add Documents: `ApprovalAlreadySubmitted`, `DocumentRetentionPrevented`, `ShareLinkExpired`, `InvalidShareLinkToken`, `AnnotationRequired`, `WorkflowStepMissing`
  Add CRM: `LeadConversionFailed`, `DuplicateMergeFailed`, `EngagementNotFound`, `RenewalNotFound`, `ProposalGenerationFailed`
  Add Projects: `SchedulerConflict`, `RecurringWorkDuplicate`, `TemplateVersionNotFound`, `TimeEntryOverlap`, `BudgetActualMismatch`
  **File(s):** `artifacts/api-server/src/errors/domain-errors.ts`
  **Verification:** Unit tests exist for all new error classes; entire catalog compiles; cross-reference shows every negative BDD scenario has a matching error; `pnpm typecheck` passes

- [ ] ERROR-002.N (HUMAN): Final review and sign-off on error catalog completeness and naming conventions.
  **Verification:** Approved.

---

## [ ] ERROR-001: Global Express Error Handling Middleware
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No global error handler exists in `artifacts/api-server/src/`. `app.ts` mounts the main router but has no error-handling middleware. Unhandled errors propagate as Express default 500 responses with no structured envelope.
**Size:** Medium

**Description:** Implement an Express 5 error-handling middleware that maps all `DomainError` instances to appropriate HTTP status codes and a standard response envelope, and registers it as the final middleware in `app.ts`.

**Depends on:** ERROR-002 (domain errors must be defined first)
**Blocks:** AUTH-006 (auth routes), AUTH-008 (auth middleware), all future route implementations
**Related Files:** `artifacts/api-server/src/middlewares/error-handler.ts`, `artifacts/api-server/src/app.ts`

**Imports / Exports**
- Imports: `DomainError` from `errors/domain-errors.ts`; `ErrorRequestHandler` from `express`; `logger` from `lib/logger.ts`; optional Sentry SDK
- Exports: `errorHandler` (Express `ErrorRequestHandler`)

**Definition of Done**
- [ ] `artifacts/api-server/src/middlewares/error-handler.ts` exists and compiles
- [ ] Middleware catches all errors (sync and async) propagated via `next(err)` from Express routes
- [ ] `DomainError` instances map to correct HTTP status codes per the mapping table below
- [ ] All responses follow the envelope: `{ success: false, error: { code, message, details? } }`
- [ ] Unknown/unexpected errors return `500` with a generic message — no stack trace in response body
- [ ] All errors are logged at `error` level with Pino, including `requestId` (from `req.id`) and `userId` when available on `req.user`
- [ ] `errorHandler` is registered as the **last** middleware in `app.ts`
- [ ] Sentry integration fires when `SENTRY_DSN` env var is set; is a no-op otherwise
- [ ] Unit tests cover each HTTP status mapping scenario
- [ ] `pnpm typecheck` passes

**Error Mapping (DomainError code → HTTP status)**
- `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED` → 401
- `AUTH_INSUFFICIENT_PERMISSIONS`, `AUTH_PERMISSION_DENIED` → 403
- `AUTH_USER_NOT_FOUND`, `CRM_LEAD_NOT_FOUND`, `PROJ_TASK_NOT_FOUND`, `*_NOT_FOUND` → 404
- `AUTH_DUPLICATE_EMAIL`, `CRM_DUPLICATE_LEAD`, `CRM_DUPLICATE_DOMAIN` → 409
- `GEN_VALIDATION_ERROR` → 400
- `GEN_DATABASE_ERROR`, `GEN_NETWORK_ERROR`, `GEN_TIMEOUT_ERROR` → 500
- Unknown (non-DomainError) → 500

**Out of Scope**
- Defining error classes (belongs in ERROR-002)
- Route-level try/catch or per-route error handling
- CSRF protection or rate limiting
- Frontend error display

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never expose stack traces, DB connection strings, or internal file paths in response bodies

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/middlewares/error-handler.ts` (new file)
- Code changes in: `artifacts/api-server/src/app.ts` (register `errorHandler` as last middleware)
- Tests added/updated in: `artifacts/api-server/__tests__/middlewares/error-handler.test.ts` (new file)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `error-handler.ts`; revert the `errorHandler` registration line in `app.ts`
- Halt condition: if `pnpm typecheck` fails or any existing test breaks, revert the `app.ts` change first

**Rules to Follow**
- Error handler must be declared with exactly 4 parameters `(err, req, res, next)` — Express 5 requires this signature to identify it as an error-handling middleware
- Sensitive information (passwords, tokens, DB strings, stack traces) must never appear in response bodies
- All errors must be logged at `error` level with structured Pino format including `requestId` for distributed tracing
- Error response envelope must be consistent across ALL routes — no ad-hoc error shapes in route handlers
- Sentry integration must degrade gracefully when `SENTRY_DSN` is absent
- `errorHandler` must be the last `app.use()` call in `app.ts`

**Verification**
```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server test -- error-handler.test.ts
```

**Advanced Code Patterns**
- Express 5 async error propagation: errors thrown in async route handlers are automatically forwarded to error-handling middleware without `asyncHandler` wrappers (Express 5 behavior change from Express 4)
- Status code lookup: plain `Record<string, number>` object keyed by `DomainError.code` for O(1) mapping — avoids large switch/case statements
- Correlation ID: read `X-Request-ID` header or generate a UUID via `crypto.randomUUID()`; set on `req.id` early in the middleware chain for tracing across logs

**Anti-Patterns**
- Leaking stack traces, SQL errors, or internal paths in error response bodies
- Inconsistent error envelope shapes between routes (some `{ error: string }`, others `{ message: string }`)
- Missing `requestId` in error logs (makes production debugging impossible)
- Using `res.json()` directly in route handlers for errors instead of `next(err)` (bypasses global handler)
- Swallowing errors silently without logging

**DDD / TDD / BDD / Deep Module notes**
- DDD: The error handler is an infrastructure adapter — it translates domain language (`DomainError` codes) into HTTP protocol (status codes and envelopes) with zero business logic.
- TDD: Write tests for each `DomainError` → HTTP status mapping before implementing. Use supertest with a dummy route that throws each error type.
- BDD: Ensures all negative scenarios in feature files return the specified HTTP responses.
- Deep Module: Single exported function (`errorHandler`) hides all mapping complexity. Route handlers only call `next(err)`.

---

### Subtasks

- [ ] ERROR-001.0.25 (AGENT): Read the entire task and all related info.
  *No action – pause until fully understood.*

- [ ] ERROR-001.0.5 (AGENT): Research Express 5 error handling changes vs Express 4, Pino structured logging with correlation IDs, and Sentry Node.js SDK integration (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] ERROR-001.0.75 (AGENT): Reason about the task — particularly the Express 5 4-parameter signature requirement and the DomainError code prefix convention from ERROR-002.
  *If uncertain, ask the user before executing.*

- [ ] ERROR-001.1 (AGENT): Create error handler middleware with DomainError → HTTP status mapping and standard response envelope.
  **File(s):** `artifacts/api-server/src/middlewares/error-handler.ts`
  **Verification:** Unit tests for all DomainError code → HTTP status mappings pass; no sensitive data in response body

- [ ] ERROR-001.2 (AGENT): Add structured Pino logging with `requestId` and user context correlation.
  **File(s):** `artifacts/api-server/src/middlewares/error-handler.ts`
  **Verification:** Error logs include `requestId` and optional `userId`; verified via test log output inspection

- [ ] ERROR-001.3 (AGENT): Register `errorHandler` as the last middleware in Express app.
  **File(s):** `artifacts/api-server/src/app.ts`
  **Verification:** All routes propagate errors through global handler; existing health-check test still passes; `pnpm typecheck` clean

- [ ] ERROR-001.4 (AGENT): Add optional Sentry integration guarded by `SENTRY_DSN` env var.
  **File(s):** `artifacts/api-server/src/middlewares/error-handler.ts`
  **Verification:** No crash when `SENTRY_DSN` is absent; errors captured when DSN is set

- [ ] ERROR-001.N (HUMAN): Final review and sign-off — confirm error envelope format and HTTP status mappings.
  **Verification:** Approved.

---

## Error Handling Wave Completion Criteria

**Wave Status:** [ ] Complete (0/2 parent tasks done)

**Dependencies for Other Waves:**
- ERROR-002 provides typed domain error classes for all services and routes
- ERROR-001 provides consistent HTTP error responses for all routes

**Dependencies:**
- DEP-001 (neverthrow installed)

**Next Wave:** AUTH-SERVICES (depends on ERROR-002)
