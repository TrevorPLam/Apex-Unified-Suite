# tasks/infrastructure/SECURITY.md – Security, WebSocket & Monitoring

This file covers security hardening, real‑time infrastructure, and monitoring requirements for production deployment. These tasks establish the operational security and observability foundation for the entire platform.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Backlog Additions – 2026‑05‑05

| Task ID | Description | Depends On |
|---------|-------------|------------|
| WS‑DLQ‑001 | Webhook dead letter queue with replay and alerting | `infrastructure/DEVOPS.md → JOB‑INFRA‑001.6` |
| SEC‑006 | WAF/DDoS protection ADR | [N/A] |
| SEC‑007 | Tenant-isolation automated test suite | `infrastructure/RBAC.md → RBAC‑001`, `infrastructure/DATABASE.md → DB‑ORG‑001` |
| SEC‑008 | Incident response plan and breach notification cross-reference | `infrastructure/INCIDENT‑RESPONSE.md → IR‑001`, `IR‑002` |
| SEC‑009 | Vendor risk management cross-reference | `infrastructure/VENDOR‑RISK‑MANAGEMENT.md → VRM‑001` |
| SEC‑010 | Cyber insurance readiness evidence | `infrastructure/SECURITY.md → SEC‑008` |
| SEC‑011 | Tiered rate limiting by plan | `infrastructure/FEATURE‑FLAGS.md → API‑FLAG‑003` |
| SEC‑012 | Circuit breaker integration in health and security posture | `infrastructure/RESILIENCE.md → RESILIENCE‑001` |

### Subtasks
- [ ] WS‑DLQ‑001.1 (AGENT): Define failed-webhook storage, replay, and alert thresholds.
- [ ] SEC‑006.1 (HUMAN): Document WAF/DDoS provider decision and baseline controls.
- [ ] SEC‑007.1 (AGENT): Add cross-tenant attack scenarios to CI test coverage.
- [ ] SEC‑008.1 (AGENT): Align security backlog with the incident response documents.
- [ ] SEC‑009.1 (AGENT): Cross-reference security controls with vendor risk review obligations.
- [ ] SEC‑010.1 (HUMAN): Define cyber insurance evidence checklist and renewal cadence.
- [ ] SEC‑011.1 (AGENT): Define plan-tier rate limits and enforcement points.
- [ ] SEC‑012.1 (AGENT): Expose breaker state through health and operational diagnostics.

---

## Rate Limiting & Security Headers

### [ ] SEC‑001: Add Rate Limiting to Express App (Per‑IP & Per‑Tenant)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No rate limiting exists anywhere in the application. All endpoints are vulnerable to brute‑force attacks and denial‑of‑service.
**Size:** Medium

**Description:** Apply global IP‑based rate limiting (100 req/15 min), stricter auth endpoint limiting (20 req/10 min per IP with `skipSuccessfulRequests: true`), per‑tenant rate limiting (200 req/15 min per `organization_id`) after authentication, and WebSocket connection rate limiting (10 new connections per minute per IP). Use a Redis‑backed rate limiting store for multi‑node compatibility.

**Depends on:** `infrastructure/AUTH.md → ERROR‑001`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001` (Redis available)
**Blocks:** All public API endpoints (rate limiting must be applied before they go live)
**Related Files:** `artifacts/api‑server/src/middlewares/rate‑limiter.ts`, `artifacts/api‑server/src/app.ts`

**Definition of Done**
- [ ] `express‑rate‑limit` middleware applied globally to all non‑static routes: 100 requests per 15 minutes per IP
- [ ] Stricter rate limit on auth endpoints (`/auth/*`): 20 requests per 10 minutes per IP, `skipSuccessfulRequests: true`
- [ ] Per‑tenant rate limit applied after `authMiddleware`: 200 requests per 15 minutes per `req.user.organizationId`
- [ ] WebSocket upgrade endpoint rate limited: 10 new connections per minute per IP
- [ ] Rate limit storage uses Redis via `rate‑limit‑redis` for multi‑node consistency; falls back to in‑memory if Redis is unavailable
- [ ] Rate limit responses return `429 Too Many Requests` with a standard error envelope and `Retry‑After` header
- [ ] All rate limit values are configurable via environment variables
- [ ] Integration test: exceeding IP limit returns 429; exceeding tenant limit as authenticated user returns 429
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Dynamic rate limiting based on user tier or endpoint sensitivity
- Rate limiting on GraphQL or WebSocket message throughput
- DDoS protection at the network layer (use a CDN/WAF for that)

**Rules to Follow**
- All rate limit keys must be stored in Redis with appropriate TTL to prevent memory leaks
- `skipSuccessfulRequests: true` on auth endpoints: only failed login/register attempts count toward the rate limit
- Tenant rate limit must only apply after successful authentication
- Always set `Retry‑After` header on 429 responses per RFC 6585
- Rate limiting must never block the health check endpoint `/api/healthz`

**Verification**
```bash
# Test global IP rate limit
for i in {1..101}; do curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/healthz; done | grep 429

# Test auth rate limit
for i in {1..21}; do curl -s -X POST http://localhost:8081/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong"}'; done | grep 429

# Test tenant rate limit
(for i in {1..201}; do curl -s http://localhost:8081/api/crm/leads -H "Authorization: Bearer $TOKEN"; done | grep 429)
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Rate limiting is an infrastructure concern; it is applied before any domain logic and does not belong to any bounded context.
- TDD: Write integration test that exceeds the IP limit and verifies a 429 response with proper headers.
- BDD: “As an API consumer, I receive a clear 429 response when I exceed the rate limit, with instructions on when to retry.”
- Deep Module: `rate‑limiter.ts` is a thin composition of `express‑rate‑limit` instances; consumers just import named middleware functions.

---

### Subtasks
- [ ] SEC‑001.0.25 (AGENT): Read the entire task and current `app.ts` middleware stack to understand where to insert rate limiters. *No action — pause.*
- [ ] SEC‑001.0.5 (AGENT): Research `express‑rate‑limit` v7.5 Redis store integration, WebSocket rate limiting patterns, and RFC 6585. *Document findings briefly.*
- [ ] SEC‑001.1 (AGENT): Implement global IP rate limiter and auth endpoint rate limiter with configurable thresholds.
  **File(s):** `artifacts/api‑server/src/middlewares/rate‑limiter.ts`, `artifacts/api‑server/src/app.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- rate‑limiter.test.ts` → GREEN.
- [ ] SEC‑001.2 (AGENT): Implement per‑tenant rate limiter for authenticated routes using Redis store.
  **File(s):** `artifacts/api‑server/src/middlewares/rate‑limiter.ts`
  **Verification:** Exceeding tenant limit as authenticated user returns 429.
- [ ] SEC‑001.3 (AGENT): Implement WebSocket upgrade request rate limiter.
  **File(s):** `artifacts/api‑server/src/middlewares/rate‑limiter.ts`
  **Verification:** 11 connection attempts in one minute from same IP → 10th succeeds, 11th returns 429.
- [ ] SEC‑001.4 (AGENT): Write integration tests for all rate limiting scenarios.
  **File(s):** `artifacts/api‑server/src/__tests__/middlewares/rate‑limiter.test.ts`
  **Verification:** All tests green; `pnpm run typecheck` clean.
- [ ] SEC‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] SEC‑002: Add Security Headers (Helmet) & CSP
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No security headers are set on any HTTP response. Express responses lack even basic protections like `X‑Content‑Type‑Options: nosniff`.
**Size:** Small

**Description:** Install and configure `helmet` with strict defaults and a Content‑Security‑Policy tailored to a single‑page application that loads from self origin and trusted CDNs (if any). Use report‑only mode initially for CSP, then switch to enforcement after validating reports.

**Depends on:** [N/A]
**Blocks:** [N/A] — security hardening; no downstream blockers
**Related Files:** `artifacts/api‑server/src/app.ts`, `artifacts/api‑server/src/middlewares/security‑headers.ts`

**Definition of Done**
- [ ] `helmet` middleware applied globally with all default protections enabled
- [ ] Content‑Security‑Policy header configured via helmet’s `contentSecurityPolicy` option
  - `default‑src 'self'` for scripts, styles, images, fonts, connect, media, objects
  - `script‑src 'self'` (plus any trusted CDN origins if needed)
  - `style‑src 'self' 'unsafe‑inline'` (inline styles may be needed by UI framework)
  - `img‑src 'self' data:` (allow data URIs for inline images)
  - `frame‑ancestors 'none'` (prevents clickjacking)
- [ ] CSP initially configured in `reportOnly` mode to collect violation reports via `/csp‑report` endpoint
- [ ] `/csp‑report` endpoint logs violations to Pino and returns 204
- [ ] Integration test verifies all expected security headers are present in responses
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Implementing nonce‑based CSP for inline scripts (start with `'self'` and trusted CDNs)
- Subresource Integrity (SRI) for CDN scripts

**Rules to Follow**
- CSP must start in `reportOnly` mode for at least one deployment cycle before enforcement
- All CSP violation reports must be logged (not discarded silently)
- `frame‑ancestors 'none'` must be set to prevent clickjacking of the application
- `helmet` must be one of the first middleware in the chain (before routes)

**Verification**
```bash
# Verify security headers are present
curl -I http://localhost:8081/api/healthz | grep -E "X-Content-Type-Options|X-Frame-Options|Content-Security-Policy"

# Test CSP report endpoint
curl -X POST http://localhost:8081/csp-report -H "Content-Type: application/csp-report" -d '{"csp-report": {"violated-directive":"script-src"}}'
# Expect 204
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/security.
- TDD: Integration test that sends a request and asserts all security headers are present.
- BDD: “As a security engineer, every response from the API includes a strong Content‑Security‑Policy header.”

---

### Subtasks
- [ ] SEC‑002.0.25 (AGENT): Read the current `app.ts` and understand existing middleware order. *No action — pause.*
- [ ] SEC‑002.0.5 (AGENT): Research `helmet` v8 defaults and CSP reporting best practices. *Document findings briefly.*
- [ ] SEC‑002.1 (AGENT): Install `helmet` and apply it globally with strict defaults.
  **File(s):** `artifacts/api‑server/src/app.ts`
  **Verification:** `curl -I http://localhost:8081/api/healthz` shows expected headers.
- [ ] SEC‑002.2 (AGENT): Configure CSP directives and add report‑only mode with `/csp‑report` endpoint.
  **File(s):** `artifacts/api‑server/src/middlewares/security‑headers.ts`
  **Verification:** CSP report endpoint logs violations and returns 204.
- [ ] SEC‑002.3 (AGENT): Write integration test verifying all security headers are present.
  **File(s):** `artifacts/api‑server/src/__tests__/middlewares/security‑headers.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- security‑headers.test.ts` → GREEN.
- [ ] SEC‑002.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] SEC‑003: Configure CORS with Allowed Origins
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** CORS is wide open — the Express app currently accepts requests from any origin.
**Size:** Small

**Description:** Configure the `cors` middleware with an environment‑driven `allowedOrigins` list (comma‑separated `ALLOWED_ORIGINS` env var). In production, restrict to the specific frontend domain. In development, allow `localhost` on common ports.

**Depends on:** [N/A]
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/app.ts`

**Definition of Done**
- [ ] `cors()` middleware configured in `app.ts` with `origin` option reading from `ALLOWED_ORIGINS` env var
- [ ] `ALLOWED_ORIGINS` documented in `.env.example` with example values for dev and production
- [ ] In development, allow `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`
- [ ] In production, restrict to the single frontend domain
- [ ] `OPTIONS` preflight requests handled correctly
- [ ] Integration test: request from an allowed origin includes CORS headers; request from a disallowed origin is rejected
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `ALLOWED_ORIGINS` must be a comma‑separated string with no spaces
- The `origin` option must be a function that checks the `Origin` header against the allowlist
- Never use `origin: '*'` or `origin: true` in production

**Verification**
```bash
# Test allowed origin
curl -H "Origin: http://localhost:5173" -I http://localhost:8081/api/healthz | grep "Access-Control-Allow-Origin"

# Test disallowed origin
curl -H "Origin: https://evil.com" -I http://localhost:8081/api/healthz | grep "Access-Control-Allow-Origin"
# Expected: header absent or different from the evil origin

# Test preflight
curl -X OPTIONS -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" -I http://localhost:8081/api/auth/login
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/security.
- TDD: Write integration test that sends requests from allowed and disallowed origins and asserts CORS headers.
- BDD: “As an API consumer, I can only call the API from trusted origins configured by the organisation.”

---

### Subtasks
- [ ] SEC‑003.0.25 (AGENT): Read the current `app.ts` and identify where CORS middleware should be placed. *No action — pause.*
- [ ] SEC‑003.0.5 (AGENT): Research `cors` package v2.8.5 and best practices for origin allowlisting in production. *Document findings briefly.*
- [ ] SEC‑003.1 (AGENT): Add `ALLOWED_ORIGINS` to `.env.example` and configure CORS middleware with origin validation.
  **File(s):** `.env.example`, `artifacts/api‑server/src/app.ts`
  **Verification:** `curl -H "Origin: http://localhost:5173" -I http://localhost:8081/api/healthz` returns `Access‑Control‑Allow‑Origin`.
- [ ] SEC‑003.2 (AGENT): Write integration test for allowed and disallowed origins.
  **File(s):** `artifacts/api‑server/src/__tests__/middlewares/cors.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- cors.test.ts` → GREEN.
- [ ] SEC‑003.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] SEC‑004: Enable Database SSL & Connection Pool Limits
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** Database connection is unencrypted and pool size is unbounded.
**Size:** Small

**Description:** Force SSL on the database connection in production via `DATABASE_URL` query parameter, configure a bounded connection pool with `max: 20` (configurable via `PG_MAX` env var), and add connection pool metrics to the health check endpoint.

**Depends on:** `infrastructure/SECURITY.md → MON‑001` (health check endpoint enhancement — pool metrics displayed there)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/index.ts`, `.env.example`

**Definition of Done**
- [ ] `DATABASE_URL` in `.env.example` includes `?sslmode=require` for production guidance
- [ ] Connection pool configured with `max: process.env.PG_MAX || 20`
- [ ] `idleTimeoutMillis: 30000` (close idle connections after 30 seconds)
- [ ] `connectionTimeoutMillis: 5000` (fail fast if database is unreachable)
- [ ] Connection errors logged at `error` level via Pino (without exposing credentials)
- [ ] Pool metrics (`totalCount`, `idleCount`, `waitingCount`) exposed in health check response
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Read/write splitting or read replica configuration
- Database TLS certificate validation (require the full certificate chain)

**Rules to Follow**
- `DATABASE_URL` must be read from environment — never hard‑code
- In development, SSL is optional; in production, SSL is mandatory
- Pool size must scale with available database connections; typical Node.js single‑process uses `max: 20`
- Never log the full `DATABASE_URL` (contains credentials) in error messages

**Verification**
```bash
# Check pool metrics in health check
curl http://localhost:8081/api/healthz | jq .pool
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — database infrastructure.
- TDD: Write integration test that verifies pool metrics are present in health check response.
- BDD: “As a DevOps engineer, I can monitor database connection pool health and ensure connections are not leaking.”

---

### Subtasks
- [ ] SEC‑004.0.25 (AGENT): Read the current `lib/db/src/index.ts` and understand how the Drizzle instance and `pg.Pool` are initialised. *No action — pause.*
- [ ] SEC‑004.0.5 (AGENT): Research `pg` Pool configuration best practices, SSL modes, and pool metrics exposure. *Document findings briefly.*
- [ ] SEC‑004.1 (AGENT): Update `lib/db/src/index.ts` with SSL‑enforced connection string and pool configuration.
  **File(s):** `lib/db/src/index.ts`
  **Verification:** `pnpm run typecheck` passes; server starts with configured pool.
- [ ] SEC‑004.2 (AGENT): Add `?sslmode=require` to `DATABASE_URL` in `.env.example` and document `PG_MAX`.
  **File(s):** `.env.example`
  **Verification:** `.env.example` updated.
- [ ] SEC‑004.3 (AGENT): Write integration test verifying pool metrics appear in health check response.
  **File(s):** `artifacts/api‑server/src/__tests__/lib/db‑pool.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- db‑pool.test.ts` → GREEN.
- [ ] SEC‑004.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] SEC‑005: Threat Detection Alerts for Unusual Document Access
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No threat detection exists for document access patterns. Enterprise document platforms have mature threat detection that identifies anomalous download volumes, unusual IP addresses, and repeated failed access attempts.
**Size:** Large

**Description:** Implement a threat detection service that analyzes document access audit logs in near‑real‑time against configurable rules (bulk download threshold, IP change detection, repeated failed share link access), generates security alerts with severity classification, and provides an admin dashboard for alert investigation and resolution.

**Depends on:** `infrastructure/SECURITY.md → MON‑002` (Sentry integration for alert notifications), `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑013`, `infrastructure/SETTINGS‑AUDIT.md → DB‑SETTINGS‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/security/threat‑detection‑service.ts`, `artifacts/api‑server/src/routes/security/alerts.ts`, `artifacts/apex‑os/src/components/settings/SecurityAlerts.tsx`

**Definition of Done**
- [ ] `ThreatDetectionService` with configurable rules: `bulk_download` (N or more downloads in a sliding time window), `ip_change` (new IP address for same user within a session), `failed_attempts` (repeated failed share link authorization), `unusual_sharing` (document shared externally for the first time)
- [ ] Each rule has configurable `threshold_value`, `time_window_minutes`, and `is_active` flag
- [ ] Detected threats create a `SecurityAlert` record with `severity` (low/medium/high/critical), `description`, and `entity_id`
- [ ] Alerts sent to admin via email and in‑app notification
- [ ] Admin dashboard at `/settings/security‑alerts` with filtering, investigation notes, and status management
- [ ] Detection runs as a scheduled background job (every 5 minutes)
- [ ] Integration test: simulate bulk download pattern → alert created; verify notification sent
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Machine‑learning‑based anomaly detection (rule‑based thresholds are sufficient for Phase 6)
- Real‑time streaming detection (5‑minute batch processing is acceptable)
- Automated response actions (auto‑block user) — manual investigation only

**Rules to Follow**
- All detection rules must be configurable per organisation via admin UI, with sensible defaults
- Thresholds must be compared against organisation‑specific audit logs (scoped by `organization_id`)
- Alerts must be deduplicated: a repeat offence within the same time window should not create multiple alerts
- Alert lifecycle: `open → investigating → resolved | false_positive` with `assigned_to` and resolution notes

**Verification**
```bash
# Simulate bulk download detection
pnpm --filter @workspace/api‑server test -- threat‑detection.test.ts

# Verify alert creation
curl http://localhost:8081/api/security/alerts -H "Authorization: Bearer $ADMIN_TOKEN"

# Test admin dashboard
pnpm --filter @workspace/apex‑os test -- SecurityAlerts.test.tsx
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Threat detection is a cross‑cutting infrastructure service; it reads from audit logs across all bounded contexts but does not own domain logic.
- TDD: Write integration test that seeds audit log entries matching a threat pattern, runs the detection service, and asserts an alert is created.
- BDD: “As a security administrator, I am alerted when a user downloads more than 50 documents in 10 minutes, and I can investigate and resolve the alert from a dashboard.”
- Deep Module: `ThreatDetectionService.scan()` hides rule evaluation, alert creation, deduplication, and notification dispatch behind a single method.

---

### Subtasks
- [ ] SEC‑005.0.25 (AGENT): Read the entire task, DB‑SETTINGS‑002 audit log schema, and NotificationService API. *No action — pause.*
- [ ] SEC‑005.0.5 (AGENT): Research threat detection patterns in enterprise document platforms (ShareFile, Box, Egnyte) and sliding window detection algorithms. *Document findings briefly.*
- [ ] SEC‑005.1 (AGENT): Define `security_alerts` and `threat_detection_rules` Drizzle schemas.
  **File(s):** `lib/db/src/schema/security/`
  **Verification:** `pnpm run typecheck` clean; `pnpm --filter @workspace/db run push` (requires human approval).
- [ ] SEC‑005.2 (AGENT): Implement `ThreatDetectionService` with configurable rules, sliding window detection, alert creation, and deduplication.
  **File(s):** `artifacts/api‑server/src/services/security/threat‑detection‑service.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- threat‑detection.test.ts` → GREEN.
- [ ] SEC‑005.3 (AGENT): Create security alerts routes (list, detail, resolve) with admin auth.
  **File(s):** `artifacts/api‑server/src/routes/security/alerts.ts`
  **Verification:** Admin can list and resolve alerts; non‑admin receives 403.
- [ ] SEC‑005.4 (AGENT): Build security alerts dashboard component.
  **File(s):** `artifacts/apex‑os/src/components/settings/SecurityAlerts.tsx`
  **Verification:** `pnpm --filter @workspace/apex‑os test -- SecurityAlerts.test.tsx` → GREEN.
- [ ] SEC‑005.5 (AGENT): Schedule threat detection as a BullMQ repeatable job (every 5 minutes).
  **File(s):** `artifacts/api‑server/src/lib/jobs/scheduler.ts`
  **Verification:** Job runs on schedule; alert created when threshold exceeded.
- [ ] SEC‑005.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Database Row‑Level Security

### [ ] SEC‑013: Financial Data RLS Review & Adoption Plan
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** ARCH‑001 ADR deferred RLS implementation for MVP. This task evaluates whether to add RLS as a defence‑in‑depth measure for financial tables.
**Size:** Small

**Description:** Evaluate all financial tables (invoices, bills, payments, transactions, credit memos) for row‑level security requirements. If RLS is deemed necessary, implement `pgPolicy` definitions via Drizzle and document the performance implications.

**Depends on:** `finance/FINANCE‑INVOICES‑PAYMENTS.md → DB‑FIN‑001`, `DB‑FIN‑002`, `finance/FINANCE‑BILLS‑APPROVALS.md → DB‑AP‑002`
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/`, `lib/db/src/schema/ap/`, `docs/adr/001‑multi‑tenancy.md`

**Definition of Done**
- [ ] Assessment documented: which tables hold regulated financial data and would benefit from RLS
- [ ] If RLS is to be implemented:
  - `pgPolicy` definitions added to Drizzle schema for each identified table
  - PostgreSQL parameter `app.current_organization_id` set per‑session via connection pool hook
  - RLS policies tested to prevent cross‑tenant data access at the database level
  - Performance impact measured and documented
- [ ] If RLS is deferred again, document the decision with a revised ADR
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- RLS is defence‑in‑depth, not a replacement for application‑level `WHERE organization_id =` clauses
- All RLS policies must be `PERMISSIVE` (not `RESTRICTIVE`)
- `current_setting('app.current_organization_id')` must be set on every database session from the JWT or API key
- If the parameter is not set, the policy must default to rejecting access (safe by default)

**Verification**
```bash
# In psql, verify RLS is active:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices';

# Integration test: attempt to query invoices with wrong org_id → empty result or permission denied
pnpm --filter @workspace/api‑server test -- rls‑policies.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Row‑level security is a database‑level enforcement of the multi‑tenancy aggregate boundary.
- TDD: Write integration test that attempts to access another tenant’s invoices from a different session and asserts it is blocked.
- BDD: “As a platform architect, financial data is isolated at the database level to prevent accidental cross‑tenant exposure even if application code has a bug.”

---

### Subtasks
- [ ] SEC‑013.0.25 (AGENT): Read ARCH‑001 ADR, current financial schemas, and Drizzle `pgPolicy` documentation. *No action — pause.*
- [ ] SEC‑013.0.5 (AGENT): Research PostgreSQL RLS best practices for multi‑tenant SaaS, `pgPolicy` in Drizzle v0.39+, and performance implications. *Document findings briefly.*
- [ ] SEC‑013.1 (HUMAN): Decide whether to implement RLS for financial data or defer again. **Verification:** Decision documented in ADR update.
- [ ] SEC‑013.2 (AGENT): If implementing: add `pgPolicy` to financial table schemas, configure session parameter setter, write migration.
  **File(s):** `lib/db/src/schema/finance/`, `lib/db/src/index.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- rls‑policies.test.ts` → GREEN.
- [ ] SEC‑013.3 (AGENT): If deferring: update ADR with rationale and new target phase.
  **File(s):** `docs/adr/001‑multi‑tenancy.md`
  **Verification:** ADR updated; deferral reason documented.
- [ ] SEC‑013.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## WebSocket Infrastructure

### [ ] WS‑INFRA‑001: WebSocket Server Setup
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No WebSocket infrastructure exists. Real‑time features (notifications, live collaboration, appointment status updates) are blocked.
**Size:** Large

**Description:** Establish a Socket.io server on the existing HTTP server, authenticated via JWT (query parameter during handshake), with organisation‑scoped rooms (`org:<orgId>`) and entity‑scoped rooms (`project:<projectId>`, etc.). Create a React context provider with auto‑reconnect and connection state management for the frontend.

**Depends on:** `infrastructure/AUTH.md → AUTH‑008` (JWT verification reused for WebSocket auth)
**Blocks:** Real‑time notification delivery, all collaborative editing features
**Related Files:** `artifacts/api‑server/src/lib/ws/socket‑server.ts`, `artifacts/api‑server/src/middlewares/ws‑auth.ts`, `artifacts/apex‑os/src/contexts/WebSocketContext.tsx`

**Definition of Done**
- [ ] Socket.io server attached to the existing HTTP server (shares port; no separate port required)
- [ ] WebSocket authentication middleware: validates JWT from `auth.token` query parameter during handshake; rejects with `401` if invalid
- [ ] On connection: client auto‑joined to `org:<organizationId>` room based on JWT `organizationId` claim
- [ ] Additional rooms: clients can join entity‑specific rooms on request
- [ ] Helper functions: `emitToOrg(orgId, event, data)`, `emitToRoom(room, event, data)`
- [ ] Graceful shutdown: Socket.io server properly closes connections on `SIGTERM`
- [ ] Frontend `WebSocketProvider` with auto‑reconnect (exponential backoff starting at 1s, max 30s), connection state (`connected | connecting | disconnected`), and `useSocket()` hook
- [ ] Frontend provider is suspendable — skips connection setup when user is not authenticated
- [ ] Integration test: authenticated client connects, receives an event emitted to its org room, and disconnects cleanly
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Scaling Socket.io across multiple nodes (requires Redis adapter — future phase)
- Message persistence or replay for clients that were offline
- Binary data or file transfer over WebSocket

**Rules to Follow**
- JWT must be validated with the same secret and algorithm as regular HTTP authentication
- Rooms must use a consistent naming convention: `org:<orgId>`, `:<entityType>:<entityId>`
- Never allow a client to join another organisation’s room — enforce at the server level
- Auto‑reconnect must respect the user’s authentication state — stop reconnecting if the token is expired
- `useSocket()` must return a stable reference; never create a new socket instance on every render

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- socket‑server.test.ts
pnpm --filter @workspace/apex‑os test -- WebSocketContext.test.tsx
curl -X POST http://localhost:8081/api/test/ws‑emit -H "Authorization: Bearer $TOKEN" -d '{"orgId":"...","event":"test","data":{}}'
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: WebSocket infrastructure is a cross‑cutting application service; it does not belong to any bounded context but carries domain events across contexts.
- TDD: Write integration test that connects an authenticated client, emits an event, and verifies the client receives it.
- BDD: “As a user, I receive real‑time notifications when a lead is assigned to me or a project task is completed.”
- Deep Module: `emitToOrg(orgId, event, data)` hides Socket.io room management, serialisation, and error handling behind a simple function call.

---

### Subtasks
- [ ] WS‑INFRA‑001.0.25 (AGENT): Read the current HTTP server setup in `artifacts/api‑server/src/index.ts` and `app.ts`. *No action — pause.*
- [ ] WS‑INFRA‑001.0.5 (AGENT): Research Socket.io v4.8 API, JWT authentication middleware for WebSocket, and React context patterns for Socket.io clients. *Document findings briefly.*
- [ ] WS‑INFRA‑001.1 (AGENT): Install Socket.io and attach server to the existing HTTP server with JWT authentication middleware.
  **File(s):** `artifacts/api‑server/src/lib/ws/socket‑server.ts`, `artifacts/api‑server/src/middlewares/ws‑auth.ts`
  **Verification:** Server starts without errors; authentication rejects invalid tokens.
- [ ] WS‑INFRA‑001.2 (AGENT): Implement room auto‑join and helper functions (`emitToOrg`, `emitToRoom`).
  **File(s):** `artifacts/api‑server/src/lib/ws/socket‑server.ts`
  **Verification:** Connected client receives events emitted to its org room.
- [ ] WS‑INFRA‑001.3 (AGENT): Write integration test for WebSocket connection lifecycle.
  **File(s):** `artifacts/api‑server/src/__tests__/lib/ws/socket‑server.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- socket‑server.test.ts` → GREEN.
- [ ] WS‑INFRA‑001.4 (AGENT): Create frontend `WebSocketProvider` and `useSocket()` hook with auto‑reconnect.
  **File(s):** `artifacts/apex‑os/src/contexts/WebSocketContext.tsx`
  **Verification:** Provider connects on app load; `pnpm --filter @workspace/apex‑os test -- WebSocketContext.test.tsx` → GREEN.
- [ ] WS‑INFRA‑001.5 (AGENT): Integrate `WebSocketProvider` into `App.tsx` and verify it loads without crashing.
  **File(s):** `artifacts/apex‑os/src/App.tsx`
  **Verification:** `pnpm --filter @workspace/apex‑os run dev` starts without WebSocket errors.
- [ ] WS‑INFRA‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Monitoring & Observability

### [ ] MON‑001: Add Health Check Endpoint Enhancements
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The existing `/api/healthz` endpoint returns a simple 200 with uptime. It does not check database connectivity, connection pool status, Redis connectivity, or WebSocket server health.
**Size:** Medium

**Description:** Enhance the health check endpoint to return a structured JSON response with component status for database, Redis, WebSocket, and Cloudflare R2 storage. Return proper HTTP status codes (200 for all healthy, 503 if any critical component is unavailable).

**Depends on:** `infrastructure/SECURITY.md → SEC‑004` (connection pool configuration), `WS‑INFRA‑001` (WebSocket server), `infrastructure/DEVOPS.md → JOB‑INFRA‑001` (Redis available)
**Blocks:** `infrastructure/DEVOPS.md → DOCKER‑001` (Docker HEALTHCHECK uses this endpoint)
**Related Files:** `artifacts/api‑server/src/routes/health.ts`

**Definition of Done**
- [ ] `GET /api/healthz` returns structured JSON with `{ status, uptime, timestamp, components: { database, redis, websocket, storage } }`
- [ ] Database check: executes `SELECT 1` with a 2‑second timeout; returns `unavailable` if it fails
- [ ] Connection pool metrics: `totalCount`, `idleCount`, `waitingCount` from `pg.Pool`
- [ ] Redis check: pings Redis with a 2‑second timeout; returns `unavailable` if it fails
- [ ] WebSocket check: verifies the Socket.io server is accepting connections; returns `degraded` if unavailable but not critical
- [ ] R2 storage check: attempts to list the bucket with a 3‑second timeout (if configured); returns `degraded` if unavailable but not critical
- [ ] Returns HTTP 200 if `database` and `redis` are `ok`; returns HTTP 503 if either is `unavailable`
- [ ] All health checks time‑boxed to prevent the endpoint from hanging
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- All component health checks must have an explicit timeout (2–3 seconds)
- If a component is not configured, its status should be `not_configured`, not `unavailable`
- Health check must be cache‑free — fresh results on every call
- The response must be JSON with a predictable schema

**Verification**
```bash
curl http://localhost:8081/api/healthz | jq .

# Simulate database unavailability (stop PostgreSQL) and verify 503
docker compose stop postgres
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/healthz
# Expected: 503
docker compose start postgres
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure monitoring.
- TDD: Write integration test that verifies healthy response, simulates database failure and verifies 503.
- BDD: “As a DevOps engineer, I can call `/api/healthz` and receive structured component health status for monitoring and alerting.”

---

### Subtasks
- [ ] MON‑001.0.25 (AGENT): Read the current `health.ts` route handler and `app.ts`. *No action — pause.*
- [ ] MON‑001.0.5 (AGENT): Research health check best practices for Node.js/Express, structured response schemas, and Docker HEALTHCHECK integration. *Document findings briefly.*
- [ ] MON‑001.1 (AGENT): Rewrite health route handler with structured JSON response, database connectivity check, pool metrics, and Redis check.
  **File(s):** `artifacts/api‑server/src/routes/health.ts`
  **Verification:** `curl http://localhost:8081/api/healthz` returns structured JSON with all components.
- [ ] MON‑001.2 (AGENT): Add WebSocket and R2 storage health checks.
  **File(s):** `artifacts/api‑server/src/routes/health.ts`
  **Verification:** When WebSocket is up, status is `ok`; when R2 is unreachable, status is `degraded`.
- [ ] MON‑001.3 (AGENT): Write integration tests for healthy, database‑down (503), and degraded (R2 down) scenarios.
  **File(s):** `artifacts/api‑server/src/__tests__/routes/health.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- health.test.ts` → GREEN.
- [ ] MON‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] MON‑002: Integrate Error Tracking (Sentry)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No error tracking is integrated. Unhandled errors are only logged locally.
**Size:** Small

**Description:** Integrate the Sentry Node.js SDK into the API server to capture all unhandled errors with request context, user information, and distributed tracing. Ensure Sentry is loaded after the global error handler and strips sensitive data from error reports.

**Depends on:** `infrastructure/AUTH.md → ERROR‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/app.ts`, `artifacts/api‑server/src/lib/sentry.ts`

**Definition of Done**
- [ ] `@sentry/node` installed as a production dependency
- [ ] `Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 })` configured
- [ ] `Sentry.setupExpressErrorHandler(app)` registered as the last error‑handling middleware (after ERROR‑001)
- [ ] `Sentry.Handlers.requestHandler()` added to the middleware stack
- [ ] Sensitive data stripped via `beforeSend` hook: remove `password`, `password_hash`, `token`, `refreshToken`
- [ ] User context set via `Sentry.setUser({ id: req.user?.userId, organizationId: req.user?.organizationId })` in auth middleware
- [ ] Sentry degrades gracefully when `SENTRY_DSN` is not set
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `SENTRY_DSN` is optional — if not set, Sentry must be a complete no‑op with zero performance impact
- `setupExpressErrorHandler` must be the last middleware in the chain
- `beforeSend` must strip all sensitive fields from event data before transmission

**Verification**
```bash
# Verify Sentry loads without DSN (no errors)
SENTRY_DSN='' pnpm --filter @workspace/api‑server run dev

# Integration test: trigger an error and verify it’s captured
pnpm --filter @workspace/api‑server test -- sentry.test.ts
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/monitoring.
- TDD: Write integration test that throws an error and verifies Sentry’s test endpoint received it (or mock the Sentry transport).
- BDD: “As a developer, I receive real‑time alerts in Sentry when production errors occur, with full request context but no sensitive data.”

---

### Subtasks
- [ ] MON‑002.0.25 (AGENT): Read ERROR‑001 error handler, AUTH‑008 middleware, and current `app.ts` middleware stack. *No action — pause.*
- [ ] MON‑002.0.5 (AGENT): Research `@sentry/node` v9 Express integration, `beforeSend` hook patterns, and `setupExpressErrorHandler` placement. *Document findings briefly.*
- [ ] MON‑002.1 (AGENT): Install `@sentry/node`, create `lib/sentry.ts` with conditional initialisation and `beforeSend` hook.
  **File(s):** `artifacts/api‑server/src/lib/sentry.ts`
  **Verification:** `pnpm run typecheck` passes; server starts without SENTRY_DSN set.
- [ ] MON‑002.2 (AGENT): Add `Sentry.Handlers.requestHandler()` and `Sentry.setupExpressErrorHandler(app)` to `app.ts`; add user context in AUTH‑008.
  **File(s):** `artifacts/api‑server/src/app.ts`, `artifacts/api‑server/src/middlewares/auth.ts`
  **Verification:** Error throws show up in Sentry dashboard (when DSN is configured).
- [ ] MON‑002.3 (AGENT): Write integration test verifying error capture and sensitive data stripping.
  **File(s):** `artifacts/api‑server/src/__tests__/lib/sentry.test.ts`
  **Verification:** `pnpm --filter @workspace/api‑server test -- sentry.test.ts` → GREEN.
- [ ] MON‑002.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] MON‑003: Set Up Structured Logging for Aggregation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Logging exists via Pino but request IDs are not consistently propagated, and log format is not fully structured for aggregation.
**Size:** Small

**Description:** Ensure all logs are structured JSON with consistent `requestId` propagation via `pino‑http`. Configure `LOG_LEVEL` from environment variable. Ready for future log aggregation without any further code changes.

**Depends on:** [N/A] — Pino is already used; this is a configuration and consistency pass
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/lib/logger.ts`, `artifacts/api‑server/src/app.ts`

**Definition of Done**
- [ ] Pino instance configured with `LOG_LEVEL` env var (default: `'info'`), `timestamp` enabled, and `formatters` for clean output
- [ ] `pino‑http` middleware registered early in the Express stack with `genReqId: () => crypto.randomUUID()`
- [ ] All route handlers and services log with the Pino `logger` instance (not `console.log`)
- [ ] Request ID (`reqId`) included in every log line via `pino‑http` auto‑population; `userId` included when `req.user` is populated
- [ ] All existing `console.log` or `console.error` calls in the API server replaced with Pino logger calls
- [ ] `NODE_ENV=production` uses compact JSON output; `NODE_ENV=development` uses `pino‑pretty` for human‑readable logs
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `genReqId` must use a cryptographically random UUID — never a sequential ID
- Pino serializers must strip `password`, `password_hash`, `token`, `refreshToken`, and `authorization` from `req` and `res` objects
- `logger` instance must be a singleton; import from `lib/logger.ts` everywhere — never create new Pino instances
- All `console.log` and `console.error` must be replaced with `logger.info`, `logger.error`, etc.

**Verification**
```bash
# Start server in production mode and verify JSON output
NODE_ENV=production pnpm --filter @workspace/api‑server run start | head -n 1 | jq .
# Check that each log line includes `reqId` and `level`
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/observability.
- BDD: “As a DevOps engineer, all logs are structured JSON with request IDs, ready for shipment to a log aggregator without additional transformation.”

---

### Subtasks
- [ ] MON‑003.0.25 (AGENT): Read the current `logger.ts` (if it exists) and audit all `console.log`/`console.error` calls in `artifacts/api‑server/src/`. *No action — pause.*
- [ ] MON‑003.0.5 (AGENT): Research `pino‑http` v9 integration, `genReqId` best practices, and Pino serializers for redaction. *Document findings briefly.*
- [ ] MON‑003.1 (AGENT): Configure Pino instance with `LOG_LEVEL`, serializers, and conditional pretty‑printing.
  **File(s):** `artifacts/api‑server/src/lib/logger.ts`
  **Verification:** `NODE_ENV=development pnpm --filter @workspace/api‑server run dev` — logs are pretty‑printed.
- [ ] MON‑003.2 (AGENT): Add `pino‑http` middleware with `genReqId` to the Express stack; replace all `console.log`/`console.error` with Pino logger calls.
  **File(s):** `artifacts/api‑server/src/app.ts`, [all files with console calls]
  **Verification:** `grep -r "console\." artifacts/api‑server/src/` returns zero results.
- [ ] MON‑003.3 (AGENT): Verify JSON output in production mode includes `reqId`.
  **Verification:** `NODE_ENV=production pnpm --filter @workspace/api‑server run start | head -n 1 | jq .reqId` — contains a UUID.
- [ ] MON‑003.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Documentation & Onboarding

### [ ] DOCS‑001: Finalize README with Architecture Diagram
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `README.md` exists from TOOLING‑001 but lacks an architecture diagram and bounded context summary.
**Size:** Small

**Description:** Enhance the root `README.md` with a Mermaid architecture diagram showing bounded contexts and data flows, a bounded context map summary with links to ADRs, and a complete environment variables reference.

**Depends on:** `foundation/TOOLING.md → TOOLING‑001`, `foundation/DOMAIN.md → DOMAIN‑002`
**Blocks:** [N/A]
**Related Files:** `README.md`, `docs/bounded‑contexts.md`

**Definition of Done**
- [ ] Mermaid architecture diagram added to README showing: all 10 bounded contexts, data flow relationships (domain events), external integrations, and infrastructure (PostgreSQL, Redis, R2)
- [ ] Bounded context summary table: context name, primary aggregate, key ADR references, link to context docs
- [ ] Environment variables reference table added, listing all required variables with description and example values
- [ ] Links to `docs/glossary.md`, `docs/bounded‑contexts.md`, `docs/adr/`, and `CONTRIBUTING.md`
- [ ] Diagram renders correctly in GitHub (no broken Mermaid syntax)

**Out of Scope**
- Detailed data model diagrams (in `docs/bounded‑contexts.md`)
- Sequence diagrams for specific workflows
- Deployment architecture diagrams (in deployment docs)

**Rules to Follow**
- Mermaid diagram must be valid `graph TD` or `C4 Context` syntax
- Do not use external image hosting for the diagram — Mermaid is self‑contained in the markdown
- Environment variables table must not include actual values — only descriptions and examples

**Verification**
```bash
# View README locally with Mermaid rendering
# Open README.md in VS Code with Markdown Preview Mermaid extension
# Or push to a temporary branch and view on GitHub
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Architecture diagram is the strategic design visualisation of the bounded context map.

---

### Subtasks
- [ ] DOCS‑001.0.25 (AGENT): Read current `README.md`, `docs/bounded‑contexts.md`, and all ADRs to understand the architecture. *No action — pause.*
- [ ] DOCS‑001.0.5 (AGENT): Research Mermaid syntax for C4 context diagrams or architecture graphs. *Document findings briefly.*
- [ ] DOCS‑001.1 (AGENT): Add Mermaid architecture diagram to README.
  **File(s):** `README.md`
  **Verification:** Diagram renders correctly in GitHub.
- [ ] DOCS‑001.2 (AGENT): Add bounded context summary table and environment variables reference.
  **File(s):** `README.md`
  **Verification:** README updated with complete reference.
- [ ] DOCS‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] DOCS‑002: Write CONTRIBUTING.md & API Docs Generation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No `CONTRIBUTING.md` exists. OpenAPI spec exists but is not served as interactive documentation.
**Size:** Small

**Description:** Write a comprehensive `CONTRIBUTING.md` covering development workflow, TDD expectations, commit conventions, and DDD patterns. Mount Swagger UI at `/api‑docs` serving the OpenAPI spec, with a link from the README.

**Depends on:** `infrastructure/DATABASE.md → API‑SPEC‑001`, `infrastructure/SECURITY.md → SEC‑002`
**Blocks:** [N/A]
**Related Files:** `CONTRIBUTING.md`, `artifacts/api‑server/src/app.ts`, `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `CONTRIBUTING.md` covers: monorepo structure, prerequisites, development workflow, TDD expectations, DDD patterns, BDD feature file usage, commit conventions, PR process and CI checks
- [ ] Swagger UI mounted at `/api‑docs` serving the spec from `lib/api‑spec/openapi.yaml`
- [ ] CSP updated (if enforcing) to allow Swagger UI scripts and styles
- [ ] Link to `/api‑docs` added in README
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- `swagger‑ui‑express` must serve the spec directly from the YAML file — not a pre‑built JSON copy
- Swagger UI must be mounted with `explorer: true` for the search bar
- Do not require authentication for `/api‑docs`

**Verification**
```bash
# Verify Swagger UI loads
curl -s http://localhost:8081/api‑docs | head -n 5
# Open in browser and verify spec is interactive
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: API documentation is the external contract for all bounded contexts; `CONTRIBUTING.md` describes how to evolve those contexts.
- BDD: “As an API consumer, I can browse the full API reference at `/api‑docs` and test endpoints interactively.”

---

### Subtasks
- [ ] DOCS‑002.0.25 (AGENT): Read the current OpenAPI spec location, `app.ts`, and existing `README.md`. *No action — pause.*
- [ ] DOCS‑002.0.5 (AGENT): Research `swagger‑ui‑express` v5 integration, serving YAML specs, and Conventional Commits format. *Document findings briefly.*
- [ ] DOCS‑002.1 (AGENT): Write `CONTRIBUTING.md` covering development workflow, TDD, DDD, BDD, and commit conventions.
  **File(s):** `CONTRIBUTING.md`
  **Verification:** File exists; covers all required sections.
- [ ] DOCS‑002.2 (AGENT): Mount Swagger UI at `/api‑docs` serving the OpenAPI spec; update CSP if needed.
  **File(s):** `artifacts/api‑server/src/app.ts`
  **Verification:** `http://localhost:8081/api‑docs` displays interactive Swagger UI.
- [ ] DOCS‑002.3 (AGENT): Add `/api‑docs` link to `README.md`.
  **File(s):** `README.md`
  **Verification:** Link works; `README.md` updated.
- [ ] DOCS‑002.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---