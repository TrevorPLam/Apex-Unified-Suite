# CROSS‑CUTTING‑RULES.md – Invariant Rules & Integration Framework

This document consolidates all project‑wide invariant rules that apply to every task, regardless of bounded context or phase. Individual task files contain only domain‑specific rules; anything listed here must be followed universally.

---

## 1. API Design & Conventions

### 1.1 Versioning & URL Structure
- **Base prefix:** All REST endpoints **must** use `/api/v1/` (ADR‑005).
- **No unversioned routes** in production; exceptions only for `/healthz` and webhook receivers.
- Paths follow resource‑oriented design: `/api/v1/{context}/{resource}`.
- Sub‑resource actions use `POST` on dedicated action paths (e.g., `/api/v1/invoices/{id}/send`).

### 1.2 Response Envelope
Every API response **must** conform to the standard envelope:

```json
{
  "success": true,
  "data": { … },
  "error": null
}
```

- `success` (boolean) – always present.
- `data` – present on success (2xx).
- `error` – present on failure (4xx/5xx), with `code` (string) and `message` (string).

### 1.3 Pagination
- List endpoints **must** support pagination via query parameters `page` (1‑based) and `limit` (default 20, max 100).
- Response **must** include a `meta` object:

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

### 1.4 Money Handling
- All monetary amounts **must** be stored and transmitted as **integer cents**.
- Never use floating‑point for currency; use `Intl.NumberFormat` for display only.

### 1.5 Soft‑Delete
- Entities are **never hard‑deleted** by default.
- Use a `deleted_at` timestamptz column; `null` means active.
- All repository queries **must** filter `WHERE deleted_at IS NULL` unless explicitly requesting deleted records.
- Delete endpoints return `204 No Content` and set `deleted_at`.

### 1.6 Status Codes
| Situation | HTTP Status |
|-----------|-------------|
| Validation / business rule violation | 400 |
| Authentication missing / invalid | 401 |
| Authorisation missing (forbidden) | 403 |
| Resource not found | 404 |
| Method not allowed | 405 |
| Conflict (duplicate, state conflict) | 409 |
| Unprocessable entity (semantic error) | 422 |
| Rate limit exceeded | 429 |
| Internal server error | 500 |

---

## 2. Database & Persistence

### 2.1 Multi‑Tenancy
- Every table that holds tenant‑scoped data **must** have an `organization_id` column (UUID, NOT NULL, FK → `organizations.id`).
- All queries **must** include `WHERE organization_id = $orgId`.
- Use `BaseRepository` pattern to enforce tenant scoping automatically.
- PostgreSQL Row‑Level Security is permitted as an additional defence layer (ADR‑001) but never as a replacement for application‑level filtering.

### 2.2 Schema Design
- Primary keys are UUIDv4 (`gen_random_uuid()`), never serial.
- Use `pgEnum` for fixed sets of values.
- JSONB columns **must** be validated with Zod schemas at the API boundary.
- Index on `(organization_id)` for every table; additional indexes for common query patterns.

### 2.3 Concurrency & Consistency
- Use **optimistic locking** (`version` integer column) for entities that support concurrent edits.
- All multi‑row operations that must be atomic **must** run inside a database transaction.
- Use `SELECT … FOR UPDATE` where appropriate (e.g., payment idempotency, waitlist filling).

### 2.4 Database Migrations
- **Development:** `drizzle-kit push` is acceptable for rapid iteration; **never** run in CI or production.
- **Production:** Use `drizzle-kit generate` + `drizzle-kit migrate` with versioned SQL files.
- CI **must** detect uncommitted migrations: `drizzle-kit generate && git diff --exit-code`.

---

## 3. Security

### 3.1 Code and Secrets
- **Never modify** generated code under `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, or `.generated/`.
- **Never commit** `.env*`, credentials, secrets, API keys, `DATABASE_URL`, or `JWT_SECRET` to source control.
- All secrets **must** be read from environment variables or a secure vault; never hard‑coded.

### 3.2 Authentication & Authorisation
- Use argon2id for password hashing (OWASP‑recommended parameters).
- JWTs: short‑lived access tokens (≤15 min), explicit algorithm (`HS256` or `RS256`), strong secret (≥256 bits).
- Refresh token rotation with family‑tracking and reuse detection.
- Auth error messages **must be generic** to prevent user enumeration (e.g., “Invalid email or password”, not “User not found”).
- Every protected route **must** go through `requireAuth` middleware.
- Admin endpoints **must** be additionally protected by `adminAuthMiddleware`.

### 3.3 API Security
- Rate limiting is required on all public endpoints; stricter limits on auth routes.
- CORS: explict allowlist via `ALLOWED_ORIGINS`; never `origin: '*'` in production.
- Security headers: Helmet with strict Content‑Security‑Policy (report‑only initially).
- Database connections in production **must** use TLS.

### 3.4 Webhook Security
- All incoming webhooks **must** have their signatures verified before processing (Stripe, Zoom, Plaid, Google, etc.).
- Invalid signatures → discard with HTTP 400.

---

## 4. Testing Standards

### 4.1 General
- All new features require tests following **TDD red‑green‑refactor**.
- Unit tests for domain services with mocked repositories.
- Integration tests for API routes using supertest + test database.
- Component tests for frontend using React Testing Library + MSW.

### 4.2 Test Isolation
- Tests must be fully independent; `afterEach` to clean up database tables.
- Use a dedicated `TEST_DATABASE_URL`; never touch development/production data.
- Test fixtures must be realistic but never contain real PII.

### 4.3 Coverage & Quality
- Repository and service tests target >95% code coverage.
- All negative scenarios from BDD feature files must have a corresponding integration test.

---

## 5. Integration Rules

### 5.1 OAuth & Tokens
- All OAuth 2.0 flows **must** use PKCE where the provider supports it.
- OAuth tokens (access + refresh) **must** be encrypted at rest with AES‑256‑GCM before storing in the database.
- Never log raw tokens; redact with `[REDACTED]` in log output.

### 5.2 External API Calls
- Implement exponential backoff (with jitter) on all external HTTP calls.
- Respect the provider’s rate limits; use a token bucket or similar to stay compliant.
- Never make blocking external calls inside a database transaction.

### 5.3 Webhook Delivery & Processing
- Webhook handlers **must** return HTTP 2xx within the external service’s timeout (typically 5–10 seconds); heavy processing must be delegated to a background job.
- Deduplicate using the provider’s event ID (store in a `processed_webhook_events` table).

### 5.4 Storage Adapters
- All file operations **must** go through the `StoragePort` / `StorageAdapter` interface; no direct SDK calls in domain code.
- Generate signed URLs for client downloads with configurable expiry; never expose raw bucket URLs.

---

## 6. Coding Standards & Architecture

### 6.1 Language & TypeScript
- TypeScript strict mode is enforced; all `tsconfig.base.json` strict flags must be `true`.
- Use `neverthrow` for all service‑layer error handling; services **never** throw.
- `DomainError` subclasses carry a unique `code` string; HTTP mapping happens in the global error handler only.

### 6.2 Domain‑Driven Design
- Every bounded context owns its aggregates; cross‑context communication occurs only via domain events.
- Repository interfaces are defined in the domain layer; implementations remain in infrastructure.
- Use ubiquitous language from `docs/glossary.md` in all code, tests, and documentation.

### 6.3 Deep Module Principle
- Services must expose a narrow public interface (≤ 7 methods) that hides all internal complexity.
- Route handlers contain zero business logic; they only validate, call a service method, and map the result to HTTP.

### 6.4 Dependency Injection
- Dependencies (repositories, event bus, external adapters) are passed via constructor injection; never import a concrete implementation directly in a domain service.

---

## 7. Infrastructure & Deployment

### 7.1 Docker
- Containers **must** run as a non‑root user.
- All images include a `HEALTHCHECK` instruction.
- `.dockerignore` is mandatory; secrets and `node_modules` never copied into the image.

### 7.2 Environment Configuration
- `.env.example` must be kept up to date with all required variables and descriptions.
- Environment‑specific overrides (`.env.production`) are git‑ignored.
- Zod‑based validation is required at application startup; the process must exit immediately on missing/invalid configuration.

### 7.3 CI/CD
- Every pull request must pass `pnpm lint`, `pnpm typecheck`, `pnpm test` before merge.
- Production deployment requires manual approval.
- Database migrations are run automatically in the deployment pipeline after approval.

---

## 8. Documentation & Logging

- Structured logging with Pino; `requestId` must be propagated on every request.
- Never log passwords, tokens, or PII; use serializers to redact sensitive fields.
- All significant events must be recorded in the audit log (`audit_logs` table).

---

## 9. Feature Flags

- New features that may impact stability or performance should be gated behind a feature flag.
- Flags are organisation‑scoped and can be toggled via admin settings.
- Feature flag changes are audited.

---

## 10. Accessibility & Internationalisation

- WCAG 2.2 AA compliance is the minimum target; AAA where feasible.
- All user‑facing strings must be extracted into translation files; never hard‑coded.
- RTL layout must be supported for any added locale.

---

*Refer to this document from every task file by including the single line:*
> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

*(Any domain‑specific rules, such as specific state transitions or business validations, remain in the individual task files.)*