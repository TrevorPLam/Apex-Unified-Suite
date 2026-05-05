# TODO-P6-SECURITY.md – Phase 6: Security & Monitoring

This file covers security hardening, real‑time infrastructure, and monitoring requirements for production deployment. Every task incorporates explicit dependencies, verification commands, and clear entry/exit criteria. Engineered for 100% agentic coding using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 6 Security & Monitoring Task Index

**Security Hardening**
- [ ] SEC‑001 – Add Rate Limiting to Express App (Per‑IP & Per‑Tenant)
- [ ] SEC‑002 – Add Security Headers (Helmet) & CSP
- [ ] SEC‑003 – Configure CORS with Allowed Origins
- [ ] SEC‑004 – Enable Database SSL & Connection Pool Limits
- [ ] SEC‑005 – Threat Detection Alerts for Unusual Document Access

**Database Security**
- [ ] DB‑RLS‑FIN‑001 – Re‑evaluate Row Level Security for Financial Data

**Real‑Time Infrastructure**
- [ ] WS‑INFRA‑001 – WebSocket Server Setup

**Monitoring & Observability**
- [ ] MON‑001 – Add Health Check Endpoint Enhancements
- [ ] MON‑002 – Integrate Error Tracking (Sentry)
- [ ] MON‑003 – Set Up Structured Logging for Aggregation

**Documentation & Onboarding**
- [ ] DOCS‑001 – Finalize README with Architecture Diagram
- [ ] DOCS‑002 – Write CONTRIBUTING.md & API Docs Generation

---

## [ ] SEC‑001: Add Rate Limiting to Express App (Per‑IP & Per‑Tenant)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No rate limiting exists anywhere in the application. All endpoints are vulnerable to brute‑force attacks and denial‑of‑service. As of May 2026, `express-rate-limit` v7.5 is the standard middleware for Express, supporting in‑memory, Redis, or Memcached stores. In‑memory is fine for single‑instance development but production deployments require a shared store (Redis) when running multiple nodes.
**Size:** Medium

**Description:** Apply global IP‑based rate limiting (100 req/15 min), stricter auth endpoint limiting (20 req/10 min per IP with `skipSuccessfulRequests: true`), per‑tenant rate limiting (200 req/15 min per `organization_id`) after authentication, and WebSocket connection rate limiting (10 new connections per minute per IP). Use a Redis‑backed rate limiting store for multi‑node compatibility.

**Depends on:** ERROR‑001 (global error handler catches 429), JOB‑INFRA‑001 (Redis available)
**Blocks:** All public API endpoints (rate limiting must be applied before they go live)
**Related Files:** `artifacts/api-server/src/middlewares/rate-limiter.ts`, `artifacts/api-server/src/app.ts`

**Imports / Exports**
- Imports: `express-rate-limit`, `ioredis` or a `rate-limit-redis` store, `express` types
- Exports: `globalRateLimiter`, `authRateLimiter`, `tenantRateLimiter`, `wsRateLimiter` (middleware functions)

**Definition of Done**
- [ ] `express-rate-limit` middleware applied globally to all non‑static routes: 100 requests per 15 minutes per IP
- [ ] Stricter rate limit on auth endpoints (`/auth/*`): 20 requests per 10 minutes per IP, `skipSuccessfulRequests: true`
- [ ] Per‑tenant rate limit applied after `authMiddleware`: 200 requests per 15 minutes per `req.user.organizationId`
- [ ] WebSocket upgrade endpoint rate limited: 10 new connections per minute per IP
- [ ] Rate limit storage uses Redis via `rate-limit-redis` for multi‑node consistency; falls back to in‑memory if Redis is unavailable
- [ ] Rate limit responses return `429 Too Many Requests` with a standard error envelope and `Retry-After` header
- [ ] All rate limit values are configurable via environment variables: `RATE_LIMIT_IP_MAX`, `RATE_LIMIT_IP_WINDOW_MS`, etc.
- [ ] Integration test: exceeding IP limit returns 429; exceeding tenant limit as authenticated user returns 429
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Dynamic rate limiting based on user tier or endpoint sensitivity
- Rate limiting on GraphQL or WebSocket message throughput
- DDoS protection at the network layer (use a CDN/WAF for that)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, Redis URLs with passwords
- Rate limiting must never block the health check endpoint `/api/healthz`

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/middlewares/rate-limiter.ts`, `artifacts/api-server/src/app.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/middlewares/rate-limiter.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: middleware‑level — remove rate limiter middleware; revert `app.ts` to unprotected state
- Halt condition: if rate limiting blocks legitimate traffic at the default thresholds, stop and adjust configuration before proceeding

**Rules to Follow**
- All rate limit keys must be stored in Redis with appropriate TTL to prevent memory leaks
- `skipSuccessfulRequests: true` on auth endpoints: only failed login/register attempts count toward the rate limit
- Tenant rate limit must only apply after successful authentication (has `req.user.organizationId`)
- Always set `Retry-After` header on 429 responses per RFC 6585
- WebSocket rate limit must apply only to the HTTP upgrade request, not to message frequency

**Verification**
```bash
# Test global IP rate limit
for i in {1..101}; do curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/healthz; done | grep 429

# Test auth rate limit
for i in {1..21}; do curl -s -X POST http://localhost:8081/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong"}'; done | grep 429

# Test tenant rate limit
(for i in {1..201}; do curl -s http://localhost:8081/api/crm/leads -H "Authorization: Bearer $TOKEN"; done | grep 429)
```

**Advanced Code Patterns**
- Redis‑backed store with fallback: `try { store = new RedisStore({ client }); } catch { store = undefined; }` — graceful degradation
- Per‑tenant rate limiting using `keyGenerator: (req) => req.user?.organizationId || req.ip` — scoped to authenticated users
- WebSocket rate limiting via a separate `express-rate-limit` instance applied to the upgrade path only

**Anti‑Patterns**
- Using in‑memory store in production with multiple nodes — rate limits not shared, attackers can bypass by hitting different nodes
- Not setting `Retry-After` header — clients cannot retry intelligently
- Applying tenant rate limit before auth middleware — `req.user` is undefined, causing errors
- Hard‑coding rate limit values instead of using environment variables

**DDD / TDD / BDD / Deep Module notes**
- DDD: Rate limiting is an infrastructure concern; it is applied before any domain logic and does not belong to any bounded context
- TDD: Write integration test that exceeds the IP limit and verifies a 429 response with proper headers
- BDD: "As an API consumer, I receive a clear 429 response when I exceed the rate limit, with instructions on when to retry."
- Deep Module: `rate-limiter.ts` is a thin composition of `express-rate-limit` instances; consumers just import named middleware functions

---

### Subtasks
- [ ] SEC‑001.0.25 (AGENT): Read the entire task and current `app.ts` middleware stack to understand where to insert rate limiters.
  *No action — pause until fully understood.*

- [ ] SEC‑001.0.5 (AGENT): Research `express-rate-limit` v7.5 Redis store integration, WebSocket rate limiting patterns, and RFC 6585 (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] SEC‑001.0.75 (AGENT): Reason about rate limit thresholds — are the specified limits appropriate for the expected usage? Confirm with user if uncertain.
  *If uncertain, ask the user before executing.*

- [ ] SEC‑001.1 (AGENT): Implement global IP rate limiter and auth endpoint rate limiter with configurable thresholds.
  **File(s):** `artifacts/api-server/src/middlewares/rate-limiter.ts`, `artifacts/api-server/src/app.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- rate-limiter.test.ts` → GREEN.

- [ ] SEC‑001.2 (AGENT): Implement per‑tenant rate limiter for authenticated routes using Redis store.
  **File(s):** `artifacts/api-server/src/middlewares/rate-limiter.ts`
  **Verification:** Exceeding tenant limit as authenticated user returns 429.

- [ ] SEC‑001.3 (AGENT): Implement WebSocket upgrade request rate limiter.
  **File(s):** `artifacts/api-server/src/middlewares/rate-limiter.ts`
  **Verification:** 11 connection attempts in one minute from same IP → 10th succeeds, 11th returns 429.

- [ ] SEC‑001.4 (AGENT): Write integration tests for all rate limiting scenarios.
  **File(s):** `artifacts/api-server/src/__tests__/middlewares/rate-limiter.test.ts`
  **Verification:** All tests green; `pnpm run typecheck` clean.

- [ ] SEC‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] SEC‑002: Add Security Headers (Helmet) & CSP
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No security headers are set on any HTTP response. Express responses lack even basic protections like `X-Content-Type-Options: nosniff`. As of 2026, `helmet` v8 is the standard, now with more secure defaults (no `crossOriginEmbedderPolicy`, `crossOriginOpenerPolicy`, `crossOriginResourcePolicy`, `originAgentCluster` enabled by default). CSP should be nonce‑based for script execution where needed, with a report‑only mode initially to gather violation reports before enforcing.
**Size:** Small

**Description:** Install and configure `helmet` with strict defaults and a Content‑Security‑Policy tailored to a single‑page application that loads from self origin and trusted CDNs (if any). Use report‑only mode initially for CSP, then switch to enforcement after validating reports.

**Depends on:** [N/A]
**Blocks:** [N/A] — security hardening; no downstream blockers
**Related Files:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/middlewares/security-headers.ts`

**Imports / Exports**
- Imports: `helmet` from npm
- Exports: `securityHeadersMiddleware` (composed middleware function)

**Definition of Done**
- [ ] `helmet` middleware applied globally with all default protections enabled
- [ ] Content‑Security‑Policy header configured via helmet's `contentSecurityPolicy` option
  - `default-src 'self'` for scripts, styles, images, fonts, connect, media, objects
  - `script-src 'self'` (plus any trusted CDN origins if needed)
  - `style-src 'self' 'unsafe-inline'` (inline styles may be needed by UI framework)
  - `img-src 'self' data:` (allow data URIs for inline images)
  - `frame-ancestors 'none'` (prevents clickjacking)
- [ ] CSP initially configured in `reportOnly` mode to collect violation reports via `/csp-report` endpoint
- [ ] `/csp-report` endpoint logs violations to Pino and returns 204
- [ ] Integration test verifies all expected security headers are present in responses
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Implementing nonce‑based CSP for inline scripts (more complex; start with `'self'` and trusted CDNs)
- Subresource Integrity (SRI) for CDN scripts
- HTTP Strict Transport Security (HSTS) — already handled by `helmet` defaults

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Do not enable CSP enforcement until report‑only violations are reviewed to avoid breaking legitimate functionality

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/middlewares/security-headers.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/middlewares/security-headers.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: middleware‑level — remove `helmet` and CSP middleware from `app.ts`
- Halt condition: if CSP enforcement breaks core frontend functionality, switch back to report‑only mode until issues are resolved

**Rules to Follow**
- CSP must start in `reportOnly` mode for at least one deployment cycle before enforcement
- All CSP violation reports must be logged (not discarded silently)
- `frame-ancestors 'none'` must be set to prevent clickjacking of the application
- `helmet` must be one of the first middleware in the chain (before routes)

**Verification**
```bash
# Verify security headers are present
curl -I http://localhost:8081/api/healthz | grep -E "X-Content-Type-Options|X-Frame-Options|Content-Security-Policy"

# Test CSP report endpoint
curl -X POST http://localhost:8081/csp-report -H "Content-Type: application/csp-report" -d '{"csp-report": {"violated-directive":"script-src"}}'
# Expect 204
```

**Advanced Code Patterns**
- CSP report‑only mode: `directives: { ... }, reportOnly: true` in `helmet.contentSecurityPolicy()`
- CSP violation report endpoint: `app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => { logger.warn(req.body); res.status(204).end(); })`
- Environment‑specific CSP: if `NODE_ENV === 'development'`, allow `'unsafe-eval'` for hot‑reload; in production, strict

**Anti‑Patterns**
- Using `'unsafe-inline'` for scripts (allows XSS) — prefer nonces or strict `'self'`
- Enforcing CSP without first monitoring in report‑only mode — can break legitimate features
- Using duplicate CSP headers (Express may set both helmet's and a manual header)

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/security
- TDD: Integration test that sends a request and asserts all security headers are present
- BDD: "As a security engineer, every response from the API includes a strong Content‑Security‑Policy header."
- Deep Module: [N/A] — `helmet` does the heavy lifting

---

### Subtasks
- [ ] SEC‑002.0.25 (AGENT): Read the current `app.ts` and understand existing middleware order.
  *No action — pause until fully understood.*

- [ ] SEC‑002.0.5 (AGENT): Research `helmet` v8 defaults and CSP reporting best practices (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] SEC‑002.0.75 (AGENT): Reason about which CSP directives are needed based on the frontend's use of inline styles, images, and potential CDN loads. If uncertain, start with restrictive defaults.
  *If uncertain, start with `'self'` and expand when needed.*

- [ ] SEC‑002.1 (AGENT): Install `helmet` and apply it globally with strict defaults.
  **File(s):** `artifacts/api-server/src/app.ts`
  **Verification:** `curl -I http://localhost:8081/api/healthz` shows expected headers.

- [ ] SEC‑002.2 (AGENT): Configure CSP directives and add report‑only mode with `/csp-report` endpoint.
  **File(s):** `artifacts/api-server/src/middlewares/security-headers.ts`
  **Verification:** CSP report endpoint logs violations and returns 204.

- [ ] SEC‑002.3 (AGENT): Write integration test verifying all security headers are present.
  **File(s):** `artifacts/api-server/src/__tests__/middlewares/security-headers.test.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- security-headers.test.ts` → GREEN.

- [ ] SEC‑002.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] SEC‑003: Configure CORS with Allowed Origins
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** CORS is wide open — the Express app currently accepts requests from any origin. As of 2026, the `cors` npm package v2.8.5 is the standard. Best practice is to configure an explicit allowlist of origins in production, support the `OPTIONS` preflight, and enable credentials only when necessary.
**Size:** Small

**Description:** Configure the `cors` middleware with an environment‑driven `allowedOrigins` list (comma‑separated `ALLOWED_ORIGINS` env var). In production, restrict to the specific frontend domain. In development, allow `localhost` on common ports.

**Depends on:** [N/A]
**Blocks:** [N/A]
**Related Files:** `artifacts/api-server/src/app.ts`

**Imports / Exports**
- Imports: `cors` from npm
- Exports: [N/A] — middleware applied directly in `app.ts`

**Definition of Done**
- [ ] `cors()` middleware configured in `app.ts` with `origin` option reading from `ALLOWED_ORIGINS` env var
- [ ] `ALLOWED_ORIGINS` documented in `.env.example` with example values for dev and production
- [ ] In development, allow `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173`
- [ ] In production, restrict to the single frontend domain (e.g., `https://app.apex-os.com`)
- [ ] `OPTIONS` preflight requests handled correctly with `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers`
- [ ] Integration test: request from an allowed origin includes CORS headers; request from a disallowed origin is rejected
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Dynamic origin validation (regex patterns, subdomain matching) — explicit allowlist is sufficient
- CORS configuration for WebSocket connections (Socket.io handles this internally)
- Per‑route CORS overrides (global configuration only)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never use `origin: '*'` or `origin: true` in production

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/app.ts`, `artifacts/api-server/.env.example`
- Tests added/updated in: `artifacts/api-server/src/__tests__/middlewares/cors.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — revert `app.ts` CORS configuration to `cors({ origin: '*' })` (development only)
- Halt condition: if production CORS blocks legitimate API requests, stop and verify `ALLOWED_ORIGINS` configuration

**Rules to Follow**
- `ALLOWED_ORIGINS` must be a comma‑separated string with no spaces (e.g., `https://app.apex-os.com,https://admin.apex-os.com`)
- The `origin` option must be a function that checks the `Origin` header against the allowlist and returns the origin if allowed
- In development, fail gracefully if `ALLOWED_ORIGINS` is not set — default to common localhost origins
- Always include `Access-Control-Allow-Credentials: true` if the frontend sends credentials (cookies, Authorization headers)

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

**Advanced Code Patterns**
- Dynamic origin function: `origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) callback(null, origin); else callback(new Error('Not allowed by CORS')); }`
- Environment‑aware configuration: `const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173', 'http://localhost:3000']`

**Anti‑Patterns**
- Using `origin: true` in production — effectively allows any origin that sends a credential
- Not handling the `OPTIONS` preflight for non‑GET requests — browsers will block the actual request
- Hard‑coding a single origin instead of using an environment variable — requires redeploy to change

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/security
- TDD: Write integration test that sends requests from allowed and disallowed origins and asserts CORS headers
- BDD: "As an API consumer, I can only call the API from trusted origins configured by the organisation."
- Deep Module: [N/A]

---

### Subtasks
- [ ] SEC‑003.0.25 (AGENT): Read the current `app.ts` and identify where CORS middleware should be placed.
  *No action — pause until fully understood.*

- [ ] SEC‑003.0.5 (AGENT): Research `cors` package v2.8.5 and best practices for origin allowlisting in production (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] SEC‑003.0.75 (AGENT): Confirm the expected production frontend domain with user before setting `ALLOWED_ORIGINS` in `.env.example`.
  *If uncertain, ask the user before executing.*

- [ ] SEC‑003.1 (AGENT): Add `ALLOWED_ORIGINS` to `.env.example` and configure CORS middleware with origin validation.
  **File(s):** `artifacts/api-server/.env.example`, `artifacts/api-server/src/app.ts`
  **Verification:** `curl -H "Origin: http://localhost:5173" -I http://localhost:8081/api/healthz` returns `Access-Control-Allow-Origin`.

- [ ] SEC‑003.2 (AGENT): Write integration test for allowed and disallowed origins.
  **File(s):** `artifacts/api-server/src/__tests__/middlewares/cors.test.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- cors.test.ts` → GREEN.

- [ ] SEC‑003.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] SEC‑004: Enable Database SSL & Connection Pool Limits
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** Database connection is unencrypted and pool size is unbounded. As of 2026, production PostgreSQL connections must use SSL (`?sslmode=require`) and connection pools must be limited (`max: 20` is standard for Node.js/PostgreSQL). `pg` v8.13+ and `drizzle-orm` v0.39+ support connection pool configuration via `pg.Pool` with `max`, `idleTimeoutMillis`, and `connectionTimeoutMillis`.
**Size:** Small

**Description:** Force SSL on the database connection in production via `DATABASE_URL` query parameter, configure a bounded connection pool with `max: 20` (configurable via `PG_MAX` env var), and add connection pool metrics to the health check endpoint.

**Depends on:** MON‑001 (health check endpoint enhancement — pool metrics displayed there)
**Blocks:** [N/A]
**Related Files:** `lib/db/src/index.ts`, `artifacts/api-server/.env.example`

**Imports / Exports**
- Imports: `pg` (Pool), Drizzle ORM
- Exports: [N/A] — modifies existing `db` and `pool` exports

**Definition of Done**
- [ ] `DATABASE_URL` in `.env.example` includes `?sslmode=require` for production guidance
- [ ] Connection pool configured with `max: process.env.PG_MAX || 20`
- [ ] `idleTimeoutMillis: 30000` (close idle connections after 30 seconds)
- [ ] `connectionTimeoutMillis: 5000` (fail fast if database is unreachable)
- [ ] Connection errors logged at `error` level via Pino (without exposing credentials)
- [ ] Pool metrics (`totalCount`, `idleCount`, `waitingCount`) exposed in health check response
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Integration test verifies health check includes pool metrics

**Out of Scope**
- Read/write splitting or read replica configuration
- Database TLS certificate validation (require the full certificate chain)
- Connection pool warm‑up strategies

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `DATABASE_URL` with real credentials
- Never set `max` to `Infinity` or very high — exhausts database connections and causes outages

**Output Artifacts**
- Code changes in: `lib/db/src/index.ts`
- Documentation: `artifacts/api-server/.env.example` (SSL parameter added)
- Tests added/updated in: `artifacts/api-server/src/__tests__/lib/db-pool.test.ts`
- Migration files: [N/A]

**Rollback**
- Granularity: function‑level — revert pool configuration to defaults; remove SSL parameter from `.env.example`
- Halt condition: if connection pool exhaustion occurs under normal load, stop and increase `PG_MAX`

**Rules to Follow**
- `DATABASE_URL` must be read from environment — never hard‑code
- In development, SSL is optional; in production, SSL is mandatory
- Pool size must scale with available database connections; typical Node.js single‑process uses `max: 20`
- Pool metrics must be typed and serialisable for health check JSON response

**Verification**
```bash
# Verify SSL is enforced in production (blocking)
# Start server with DATABASE_URL without ?sslmode=require, verify connection fails (if production DB requires SSL)

# Check pool metrics in health check
curl http://localhost:8081/api/healthz | jq .pool
```

**Advanced Code Patterns**
- Pool configuration: `const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 })`
- Pool metrics via `pg` Pool events: `pool.on('connect', ...)`, `pool.on('error', ...)`
- Drizzle ORM integration: `const db = drizzle(pool, { schema })` — Drizzle accepts a `pg.Pool` directly

**Anti‑Patterns**
- Not limiting the pool `max` — a single misbehaving worker can exhaust all database connections
- Setting `idleTimeoutMillis: 0` — idle connections accumulate and never close, leaking database connections
- Logging the full `DATABASE_URL` (contains credentials) in error messages

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — database infrastructure
- TDD: Write integration test that verifies pool metrics are present in health check response
- BDD: "As a DevOps engineer, I can monitor database connection pool health and ensure connections are not leaking."
- Deep Module: `lib/db/src/index.ts` encapsulates pool configuration; consumers import `db` without knowing pool details

---

### Subtasks
- [ ] SEC‑004.0.25 (AGENT): Read the current `lib/db/src/index.ts` and understand how the Drizzle instance and `pg.Pool` are initialised.
  *No action — pause until fully understood.*

- [ ] SEC‑004.0.5 (AGENT): Research `pg` Pool configuration best practices, SSL modes, and pool metrics exposure (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] SEC‑004.0.75 (AGENT): Reason about appropriate pool size — is 20 connections sufficient for the expected load? Confirm with user.
  *If uncertain, default to 20.*

- [ ] SEC‑004.1 (AGENT): Update `lib/db/src/index.ts` with SSL‑enforced connection string and pool configuration.
  **File(s):** `lib/db/src/index.ts`
  **Verification:** `pnpm run typecheck` passes; server starts with configured pool.

- [ ] SEC‑004.2 (AGENT): Add `?sslmode=require` to `DATABASE_URL` in `.env.example` and document `PG_MAX`.
  **File(s):** `artifacts/api-server/.env.example`
  **Verification:** `.env.example` updated with SSL and pool documentation.

- [ ] SEC‑004.3 (AGENT): Write integration test verifying pool metrics appear in health check response.
  **File(s):** `artifacts/api-server/src/__tests__/lib/db-pool.test.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- db-pool.test.ts` → GREEN.

- [ ] SEC‑004.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] SEC‑005: Threat Detection Alerts for Unusual Document Access
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No threat detection exists for document access patterns. Enterprise document platforms (ShareFile, Box, Egnyte) have mature threat detection that identifies anomalous download volumes, unusual IP addresses, repeated failed access attempts, and suspicious sharing patterns. This is a key enterprise security feature.
**Size:** Large

**Description:** Implement a threat detection service that analyses document access audit logs in near‑real‑time against configurable rules (bulk download threshold, IP change detection, repeated failed share link access), generates security alerts with severity classification, and provides an admin dashboard for alert investigation and resolution.

**Depends on:** MON‑002 (Sentry integration for alert notifications), API‑DOCS‑013 (secure share link API), DB‑SETTINGS‑002 (audit logs)
**Blocks:** [N/A]
**Related Files:** `artifacts/api-server/src/services/security/threat-detection-service.ts`, `artifacts/api-server/src/routes/security/alerts.ts`, `artifacts/apex-os/src/components/settings/SecurityAlerts.tsx`

**Imports / Exports**
- Imports: `AuditRepository`, `NotificationService`, `Pino` logger
- Exports: `ThreatDetectionService`, `securityAlertsRouter`, `SecurityAlert` type

**Definition of Done**
- [ ] `ThreatDetectionService` with configurable detection rules:
  - `bulk_download`: N or more document downloads within a sliding time window (default: 50 downloads in 10 minutes)
  - `ip_change`: new IP address for the same user within a session
  - `failed_attempts`: repeated failed share link authorization attempts
  - `unusual_sharing`: document shared externally (outside organisation) for the first time
- [ ] Each rule has configurable `threshold_value`, `time_window_minutes`, and `is_active` flag
- [ ] Detected threats create a `SecurityAlert` record with `severity` (low/medium/high/critical), `description`, and `entity_id`
- [ ] Alerts sent to admin via email and in‑app notification (via existing `NotificationService`)
- [ ] Admin dashboard at `/settings/security-alerts` showing all alerts with filtering, investigation notes, and status management (open/investigating/resolved/false_positive)
- [ ] Detection runs as a scheduled background job (every 5 minutes) processing recent audit log entries
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Integration test: simulate bulk download pattern → alert created; verify notification sent

**Out of Scope**
- Machine‑learning‑based anomaly detection (rule‑based thresholds are sufficient for Phase 6)
- Real‑time streaming detection (5‑minute batch processing is acceptable)
- Automated response actions (auto‑block user) — manual investigation only

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Threat detection must never block legitimate user access without admin review
- Alert descriptions must never expose full PII data in plain text

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/security/threat-detection-service.ts`, `artifacts/api-server/src/routes/security/alerts.ts`, `artifacts/apex-os/src/components/settings/SecurityAlerts.tsx`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/security/threat-detection.test.ts`
- Documentation: [N/A]
- Migration files: Requires `security_alerts` and `threat_detection_rules` tables (ask human before DB push)

**Rollback**
- Granularity: file‑level — delete threat detection service, routes, and frontend component; drop new tables
- Halt condition: if false‑positive rate exceeds 10% in initial rollout, stop and tune threshold values before proceeding

**Rules to Follow**
- All detection rules must be configurable per organisation via admin UI, with sensible defaults
- Thresholds must be compared against organisation‑specific audit logs (scoped by `organization_id`)
- Alerts must be deduplicated: a repeat offence within the same time window should not create multiple alerts
- Alert lifecycle: `open → investigating → resolved | false_positive` with `assigned_to` and resolution notes
- Detection job must complete within the 5‑minute window to avoid overlapping runs

**Verification**
```bash
# Simulate bulk download detection
pnpm --filter @workspace/api-server test -- threat-detection.test.ts

# Verify alert creation
curl http://localhost:8081/api/security/alerts -H "Authorization: Bearer $ADMIN_TOKEN"

# Test admin dashboard
pnpm --filter @workspace/apex-os test -- SecurityAlerts.test.tsx
```

**Advanced Code Patterns**
- Sliding window detection: `SELECT user_id, COUNT(*) FROM document_access_logs WHERE created_at > NOW() - INTERVAL '10 minutes' GROUP BY user_id HAVING COUNT(*) > 50`
- Configurable rule engine: store rules in `threat_detection_rules` table; evaluate all active rules each run
- Alert deduplication: composite key `(alert_type, entity_id, date_trunc('hour', created_at))` prevents duplicate alerts within the same hour
- Background job scheduling: BullMQ repeatable job `threat-scan` with cron `*/5 * * * *`

**Anti‑Patterns**
- Using a single hard‑coded threshold for all organisations — different orgs have different download patterns
- Creating a new alert for every single violation — alert fatigue; deduplicate aggressively
- Not logging detection rule evaluations — impossible to tune thresholds without evaluation history
- Forgetting to scope audit queries by `organization_id`

**DDD / TDD / BDD / Deep Module notes**
- DDD: Threat detection is a cross‑cutting infrastructure service; it reads from audit logs (across all bounded contexts) but does not own domain logic
- TDD: Write integration test that seeds audit log entries matching a threat pattern, runs the detection service, and asserts an alert is created
- BDD: "As a security administrator, I am alerted when a user downloads more than 50 documents in 10 minutes, and I can investigate and resolve the alert from a dashboard."
- Deep Module: `ThreatDetectionService.scan()` hides rule evaluation, alert creation, deduplication, and notification dispatch behind a single method

---

### Subtasks
- [ ] SEC‑005.0.25 (AGENT): Read the entire task, DB‑SETTINGS‑002 audit log schema, and NotificationService API.
  *No action — pause until fully understood.*

- [ ] SEC‑005.0.5 (AGENT): Research threat detection patterns in enterprise document platforms (ShareFile, Box, Egnyte) and sliding window detection algorithms (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] SEC‑005.0.75 (AGENT): Reason about detection rule schema, alert severity classification, and background job scheduling. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] SEC‑005.1 (AGENT): Define `security_alerts` and `threat_detection_rules` Drizzle schemas.
  **File(s):** `lib/db/src/schema/security/`
  **Verification:** `pnpm run typecheck` clean; `pnpm --filter @workspace/db run push` (requires human approval).

- [ ] SEC‑005.2 (AGENT): Implement `ThreatDetectionService` with configurable rules, sliding window detection, alert creation, and deduplication.
  **File(s):** `artifacts/api-server/src/services/security/threat-detection-service.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- threat-detection.test.ts` → GREEN.

- [ ] SEC‑005.3 (AGENT): Create security alerts routes (list, detail, resolve) with admin auth.
  **File(s):** `artifacts/api-server/src/routes/security/alerts.ts`
  **Verification:** Admin can list and resolve alerts; non‑admin receives 403.

- [ ] SEC‑005.4 (AGENT): Build security alerts dashboard component.
  **File(s):** `artifacts/apex-os/src/components/settings/SecurityAlerts.tsx`
  **Verification:** Component renders; `pnpm --filter @workspace/apex-os test -- SecurityAlerts.test.tsx` → GREEN.

- [ ] SEC‑005.5 (AGENT): Schedule threat detection as a BullMQ repeatable job (every 5 minutes).
  **File(s):** `artifacts/api-server/src/lib/jobs/scheduler.ts`
  **Verification:** Job runs on schedule; alert created when threshold exceeded.

- [ ] SEC‑005.N (HUMAN): Final review and sign‑off. Verify threat detection end‑to‑end with mock data.
  **Verification:** Approved.

---

## [ ] DB‑RLS‑FIN‑001: Re‑evaluate Row Level Security for Financial Data
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** ARCH‑001 ADR deferred RLS implementation for MVP — the current application‑level tenant scoping via `organization_id` in every query is the only isolation mechanism. As of 2026, PostgreSQL RLS is widely adopted for multi‑tenant SaaS, with Drizzle ORM providing `pgPolicy` support for declarative RLS policies as of v0.39+. This task is to evaluate whether to add RLS as a defence‑in‑depth measure for financial tables.
**Size:** Small

**Description:** Evaluate all financial tables (invoices, bills, payments, transactions, credit memos) for row‑level security requirements. If RLS is deemed necessary, implement `pgPolicy` definitions via Drizzle and document the performance implications, migration strategy, and fallback behaviour.

**Depends on:** DB‑FIN‑001 (invoices), DB‑FIN‑002 (payments), DB‑AP‑002 (bills), all financial schema tasks
**Blocks:** [N/A]
**Related Files:** `lib/db/src/schema/finance/`, `lib/db/src/schema/ap/`, `docs/adr/001-multi-tenancy.md`

**Imports / Exports**
- Imports: `pgPolicy` from `drizzle-orm/pg-core`
- Exports: Updated Drizzle table definitions with RLS policies applied

**Definition of Done**
- [ ] Assessment documented: which tables hold regulated financial data and would benefit from RLS
- [ ] If RLS is to be implemented:
  - [ ] `pgPolicy` definitions added to Drizzle schema for each identified table: `CREATE POLICY organization_isolation ON invoices FOR ALL USING (organization_id = current_setting('app.current_organization_id')::uuid)`
  - [ ] PostgreSQL parameter `app.current_organization_id` set per‑session via `SET app.current_organization_id = ...` in the connection pool `connect` event
  - [ ] RLS policies tested to prevent cross‑tenant data access at the database level
  - [ ] Performance impact measured and documented (expect negligible overhead for simple `organization_id` filtering)
- [ ] If RLS is deferred again, document the decision with a revised ADR (update `docs/adr/001-multi-tenancy.md`)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- RLS on non‑financial tables (can be added incrementally)
- Column‑level security or data masking
- External database firewall policies

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `pnpm --filter @workspace/db run push` requires explicit human approval before applying RLS policies to production

**Output Artifacts**
- Code changes in: `lib/db/src/schema/finance/`, `lib/db/src/schema/ap/` (if implementing)
- Documentation: ADR update in `docs/adr/001-multi-tenancy.md`
- Migration files: generated by `drizzle-kit push` or `drizzle-kit generate`

**Rollback**
- Granularity: migration‑level — drop RLS policies via `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`; revert schema files
- Halt condition: if RLS policies cause a measurable performance regression (>5% slower queries), stop and evaluate before applying to production

**Rules to Follow**
- RLS is defence‑in‑depth, not a replacement for application‑level `WHERE organization_id =` clauses
- All RLS policies must be `PERMISSIVE` (not `RESTRICTIVE`) to compose with application logic
- `current_setting('app.current_organization_id')` must be set on every database session from the JWT or API key
- If the parameter is not set, the policy must default to rejecting access (safe by default)

**Verification**
```bash
# In psql, verify RLS is active:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices';

# Integration test: attempt to query invoices with wrong org_id → empty result or permission denied
pnpm --filter @workspace/api-server test -- rls-policies.test.ts
```

**Advanced Code Patterns**
- Drizzle `pgPolicy` declarative API: `export const invoices = pgTable('invoices', { ... }, (table) => ({ rls: pgPolicy('...', { as: 'PERMISSIVE', for: 'ALL', to: 'authenticated', using: sql`organization_id = current_setting('app.current_organization_id')::uuid` }) }))`
- Session parameter setter: `pool.on('connect', async (client) => { await client.query('SELECT set_config(...)'); })`
- Fallback: if `current_setting` fails (e.g., during migrations), the policy should not enforce isolation

**Anti‑Patterns**
- Using `current_user` or session variables that aren't explicitly set — inconsistent behaviour
- Adding RLS policies without benchmarking on realistic data volumes
- Removing application‑level scoping after adding RLS — RLS is a backup, not the primary enforcement

**DDD / TDD / BDD / Deep Module notes**
- DDD: Row‑level security is a database‑level enforcement of the multi‑tenancy aggregate boundary
- TDD: Write integration test that attempts to access another tenant's invoices from a different session and asserts it is blocked
- BDD: "As a platform architect, financial data is isolated at the database level to prevent accidental cross‑tenant exposure even if application code has a bug."
- Deep Module: [N/A] — database security configuration

---

### Subtasks
- [ ] DB‑RLS‑FIN‑001.0.25 (AGENT): Read ARCH‑001 ADR, current financial schemas, and Drizzle `pgPolicy` documentation.
  *No action — pause until fully understood.*

- [ ] DB‑RLS‑FIN‑001.0.5 (AGENT): Research PostgreSQL RLS best practices for multi‑tenant SaaS, `pgPolicy` in Drizzle v0.39+, and performance implications (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] DB‑RLS‑FIN‑001.0.75 (AGENT): Reason about whether RLS is warranted now or can be deferred further. Present recommendation with pros/cons to user.
  *If uncertain, present analysis and ask user.*

- [ ] DB‑RLS‑FIN‑001.1 (HUMAN): Decide whether to implement RLS for financial data or defer again.
  **Verification:** Decision documented in ADR update.

- [ ] DB‑RLS‑FIN‑001.2 (AGENT): If implementing: add `pgPolicy` to financial table schemas, configure session parameter setter, write migration.
  **File(s):** `lib/db/src/schema/finance/`, `lib/db/src/index.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- rls-policies.test.ts` → GREEN.

- [ ] DB‑RLS‑FIN‑001.3 (AGENT): If deferring: update ADR with rationale and new target phase.
  **File(s):** `docs/adr/001-multi-tenancy.md`
  **Verification:** ADR updated; deferral reason documented.

- [ ] DB‑RLS‑FIN‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] WS‑INFRA‑001: WebSocket Server Setup
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No WebSocket infrastructure exists. Real‑time features (notifications, live collaboration, appointment status updates) are blocked. As of 2026, Socket.io v4.8 is the standard for Node.js WebSocket applications, providing automatic fallback to HTTP long‑polling, room management, and a well‑supported client library. For production, Socket.io supports the WebSocket-only transport (`transports: ['websocket']`) when long‑polling is unnecessary.
**Size:** Large

**Description:** Establish a Socket.io server on the existing HTTP server, authenticated via JWT (query parameter during handshake), with organisation‑scoped rooms (`org:<orgId>`) and entity‑scoped rooms (`project:<projectId>`, etc.). Create a React context provider with auto‑reconnect and connection state management for the frontend.

**Depends on:** AUTH‑008 (JWT verification reused for WebSocket auth)
**Blocks:** NOTIF‑001 (real‑time notification delivery), all collaborative editing features
**Related Files:** `artifacts/api-server/src/lib/ws/socket-server.ts`, `artifacts/api-server/src/middlewares/ws-auth.ts`, `artifacts/apex-os/src/contexts/WebSocketContext.tsx`

**Imports / Exports**
- Imports: `socket.io` (Server), `jsonwebtoken`, Express HTTP server
- Exports: `io` (Socket.io server instance), `emitToOrg(orgId, event, data)`, `emitToRoom(room, event, data)`; `WebSocketProvider` React component, `useSocket()` hook

**Definition of Done**
- [ ] Socket.io server attached to the existing HTTP server (shares port; no separate port required)
- [ ] WebSocket authentication middleware: validates JWT from `auth.token` query parameter during handshake; rejects with `401` if invalid
- [ ] On connection: client auto‑joined to `org:<organizationId>` room based on JWT `organizationId` claim
- [ ] Additional rooms: clients can join entity‑specific rooms (`project:<id>`, `appointment:<id>`) on request
- [ ] Helper functions: `emitToOrg(orgId, event, data)` — broadcasts to all clients in that organisation room; `emitToRoom(room, event, data)`
- [ ] Graceful shutdown: Socket.io server properly closes connections on `SIGTERM`
- [ ] Frontend `WebSocketProvider` with auto‑reconnect (exponential backoff starting at 1s, max 30s), connection state (`connected | connecting | disconnected`), and `useSocket()` hook
- [ ] Frontend provider is suspendable — skips connection setup when user is not authenticated
- [ ] Integration test: authenticated client connects, receives an event emitted to its org room, and disconnects cleanly
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Scaling Socket.io across multiple nodes (requires Redis adapter — future phase)
- Message persistence or replay for clients that were offline
- Binary data or file transfer over WebSocket

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, JWT secrets, WebSocket auth tokens
- Never expose internal event names or room names in client‑facing error messages

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/ws/socket-server.ts`, `artifacts/api-server/src/middlewares/ws-auth.ts`, `artifacts/apex-os/src/contexts/WebSocketContext.tsx`
- Tests added/updated in: `artifacts/api-server/src/__tests__/lib/ws/socket-server.test.ts`, `artifacts/apex-os/src/contexts/__tests__/WebSocketContext.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — remove Socket.io server and frontend provider; revert HTTP server to standalone
- Halt condition: if WebSocket connections consume excessive memory or CPU, stop and investigate transport configuration

**Rules to Follow**
- JWT must be validated with the same secret and algorithm as regular HTTP authentication
- Rooms must use a consistent naming convention: `org:<orgId>`, `:<entityType>:<entityId>` (e.g., `project:<id>`, `appointment:<id>`)
- Never allow a client to join another organisation's room — enforce at the server level
- Auto‑reconnect must respect the user's authentication state — stop reconnecting if the token is expired
- `useSocket()` must return a stable reference; never create a new socket instance on every render

**Verification**
```bash
# Test WebSocket connection and event delivery
pnpm --filter @workspace/api-server test -- socket-server.test.ts

# Test frontend provider
pnpm --filter @workspace/apex-os test -- WebSocketContext.test.tsx

# Manual smoke test
curl -X POST http://localhost:8081/api/test/ws-emit -H "Authorization: Bearer $TOKEN" -d '{"orgId":"...","event":"test","data":{}}'
```

**Advanced Code Patterns**
- Socket.io auth middleware: `io.use(async (socket, next) => { try { const token = socket.handshake.auth.token; const payload = jwt.verify(token, secret); socket.data.user = payload; next(); } catch (err) { next(new Error('Authentication error')); } })`
- Room auto‑join: `socket.on('connection', (socket) => { socket.join(`org:${socket.data.user.organizationId}`); })`
- Frontend auto‑reconnect: `const socket = io(API_URL, { auth: { token }, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 30000 })`
- React context pattern: `const WebSocketContext = createContext<Socket | null>(null); export const useSocket = () => useContext(WebSocketContext)`

**Anti‑Patterns**
- Creating a new Socket.io server on every module import — use a singleton instance
- Not cleaning up Socket.io connections on component unmount — memory leak
- Emitting events without typing the payload — use typed event maps
- Using Socket.io without authentication — open relay for any client

**DDD / TDD / BDD / Deep Module notes**
- DDD: WebSocket infrastructure is a cross‑cutting application service; it does not belong to any bounded context but carries domain events across contexts
- TDD: Write integration test that connects an authenticated client, emits an event, and verifies the client receives it
- BDD: "As a user, I receive real‑time notifications when a lead is assigned to me or a project task is completed."
- Deep Module: `emitToOrg(orgId, event, data)` hides Socket.io room management, serialisation, and error handling behind a simple function call

---

### Subtasks
- [ ] WS‑INFRA‑001.0.25 (AGENT): Read the current HTTP server setup in `artifacts/api-server/src/index.ts` and `app.ts` to understand how the server is created.
  *No action — pause until fully understood.*

- [ ] WS‑INFRA‑001.0.5 (AGENT): Research Socket.io v4.8 API, JWT authentication middleware for WebSocket, and React context patterns for Socket.io clients (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] WS‑INFRA‑001.0.75 (AGENT): Reason about room naming convention and whether additional entity types need dedicated rooms at this stage. Confirm with user.
  *If uncertain, start with `org:<orgId>` rooms only.*

- [ ] WS‑INFRA‑001.1 (AGENT): Install Socket.io and attach server to the existing HTTP server with JWT authentication middleware.
  **File(s):** `artifacts/api-server/src/lib/ws/socket-server.ts`, `artifacts/api-server/src/middlewares/ws-auth.ts`
  **Verification:** Server starts without errors; authentication rejects invalid tokens.

- [ ] WS‑INFRA‑001.2 (AGENT): Implement room auto‑join and helper functions (`emitToOrg`, `emitToRoom`).
  **File(s):** `artifacts/api-server/src/lib/ws/socket-server.ts`
  **Verification:** Connected client receives events emitted to its org room.

- [ ] WS‑INFRA‑001.3 (AGENT): Write integration test for WebSocket connection lifecycle.
  **File(s):** `artifacts/api-server/src/__tests__/lib/ws/socket-server.test.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- socket-server.test.ts` → GREEN.

- [ ] WS‑INFRA‑001.4 (AGENT): Create frontend `WebSocketProvider` and `useSocket()` hook with auto‑reconnect.
  **File(s):** `artifacts/apex-os/src/contexts/WebSocketContext.tsx`
  **Verification:** Provider connects on app load; `pnpm --filter @workspace/apex-os test -- WebSocketContext.test.tsx` → GREEN.

- [ ] WS‑INFRA‑001.5 (AGENT): Integrate `WebSocketProvider` into `App.tsx` and verify it loads without crashing.
  **File(s):** `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os run dev` starts without WebSocket errors.

- [ ] WS‑INFRA‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] MON‑001: Add Health Check Endpoint Enhancements
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The existing `/api/healthz` endpoint returns a simple 200 with uptime. It does not check database connectivity, connection pool status, Redis connectivity, or WebSocket server health. As of 2026, health checks should return structured JSON with component‑level status (`ok | degraded | unavailable`) to support orchestration platforms (Kubernetes, Docker Compose) and monitoring dashboards.
**Size:** Medium

**Description:** Enhance the health check endpoint to return a structured JSON response with component status for: database connectivity, connection pool metrics, Redis, WebSocket server, and Cloudflare R2 storage. Return proper HTTP status codes (200 for all healthy, 503 if any critical component is unavailable).

**Depends on:** SEC‑004 (connection pool configuration), WS‑INFRA‑001 (WebSocket server), JOB‑INFRA‑001 (Redis available)
**Blocks:** DOCKER‑001 (Docker HEALTHCHECK uses this endpoint)
**Related Files:** `artifacts/api-server/src/routes/health.ts`

**Imports / Exports**
- Imports: `pg` Pool instance, `ioredis` client, Socket.io server, Pino logger
- Exports: `healthRouter` (existing, updated)

**Definition of Done**
- [ ] `GET /api/healthz` returns structured JSON response:
  ```json
  {
    "status": "ok",
    "uptime": 123456,
    "timestamp": "2026-05-04T...",
    "components": {
      "database": { "status": "ok", "pool": { "total": 20, "idle": 15, "waiting": 0 } },
      "redis": { "status": "ok" },
      "websocket": { "status": "ok", "connectedClients": 42 },
      "storage": { "status": "ok" }
    }
  }
  ```
- [ ] Database check: executes `SELECT 1` with a 2‑second timeout; returns `unavailable` if it fails
- [ ] Connection pool metrics: `totalCount`, `idleCount`, `waitingCount` from `pg.Pool`
- [ ] Redis check: pings Redis with a 2‑second timeout; returns `unavailable` if it fails
- [ ] WebSocket check: verifies the Socket.io server is accepting connections; returns `degraded` if unavailable but not critical
- [ ] R2 storage check: attempts to list the bucket with a 3‑second timeout (if configured); returns `degraded` if unavailable but not critical
- [ ] Returns HTTP 200 if `database` and `redis` are `ok`; returns HTTP 503 if either is `unavailable`
- [ ] All health checks time‑boxed to prevent the endpoint from hanging
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Dependency health checks (external APIs, third‑party services)
- Historical health metrics storage
- Uptime monitoring dashboards (use external tools: UptimeRobot, Pingdom)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Health check must never expose connection strings, passwords, or sensitive configuration in the response

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/routes/health.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/routes/health.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — revert `health.ts` to simple uptime‑only endpoint
- Halt condition: if a health check timeout cascades and causes the endpoint to hang indefinitely, stop and ensure all checks have short timeouts (<5 seconds total)

**Rules to Follow**
- All component health checks must have an explicit timeout (2–3 seconds) to prevent the endpoint from hanging
- If a component is not configured (e.g., Redis not required), its status should be `not_configured`, not `unavailable`
- Health check must be cache‑free — fresh results on every call
- The response must be JSON with a predictable schema (typed and documented in OpenAPI)

**Verification**
```bash
# Verify healthy response
curl http://localhost:8081/api/healthz | jq .

# Simulate database unavailability (stop PostgreSQL) and verify 503
docker compose stop postgres
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/healthz
# Expected: 503
docker compose start postgres
```

**Advanced Code Patterns**
- Component status aggregation: `const components = await Promise.allSettled([checkDatabase(), checkRedis(), ...])` — individual failures don't block the entire check
- Connection pool metrics: `const { totalCount, idleCount, waitingCount } = pool;` — available from `pg.Pool` instance
- Redis ping: `await redis.ping();` — throws on failure
- WebSocket health: `io.engine.clientsCount` — number of connected clients

**Anti‑Patterns**
- Returning a 200 with a body that says `database: "unavailable"` — always match the HTTP status code to the overall health
- Making health checks synchronous and blocking — use `Promise.allSettled` with timeouts
- Exposing internal IP addresses or connection strings in health check output
- Health check taking more than 5 seconds — render it useless for orchestration liveness probes

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure monitoring
- TDD: Write integration test that verifies healthy response, simulates database failure and verifies 503
- BDD: "As a DevOps engineer, I can call `/api/healthz` and receive structured component health status for monitoring and alerting."
- Deep Module: [N/A] — health check is intentionally simple

---

### Subtasks
- [ ] MON‑001.0.25 (AGENT): Read the current `health.ts` route handler and `app.ts` to understand the existing health check.
  *No action — pause until fully understood.*

- [ ] MON‑001.0.5 (AGENT): Research health check best practices for Node.js/Express, structured response schemas, and Docker HEALTHCHECK integration (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] MON‑001.0.75 (AGENT): Reason about which components are critical (database, Redis) vs. non‑critical (WebSocket, R2). Confirm with user.
  *If uncertain, classify database and Redis as critical; WebSocket and R2 as non‑critical.*

- [ ] MON‑001.1 (AGENT): Rewrite health route handler with structured JSON response, database connectivity check, pool metrics, and Redis check.
  **File(s):** `artifacts/api-server/src/routes/health.ts`
  **Verification:** `curl http://localhost:8081/api/healthz` returns structured JSON with all components.

- [ ] MON‑001.2 (AGENT): Add WebSocket and R2 storage health checks.
  **File(s):** `artifacts/api-server/src/routes/health.ts`
  **Verification:** When WebSocket is up, status is `ok`; when R2 is unreachable, status is `degraded`.

- [ ] MON‑001.3 (AGENT): Write integration tests for healthy, database‑down (503), and degraded (R2 down) scenarios.
  **File(s):** `artifacts/api-server/src/__tests__/routes/health.test.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- health.test.ts` → GREEN.

- [ ] MON‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] MON‑002: Integrate Error Tracking (Sentry)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No error tracking is integrated. Unhandled errors are only logged locally. As of 2026, Sentry SDK for Node.js (`@sentry/node`) v9 with Express integration provides automatic error capture, request context, distributed tracing, and performance monitoring. The SDK initialises with `Sentry.init({ dsn })` and the Express integration captures all unhandled errors.
**Size:** Small

**Description:** Integrate the Sentry Node.js SDK into the API server to capture all unhandled errors with request context, user information, and distributed tracing. Ensure Sentry is loaded after the global error handler (ERROR‑001) and strips sensitive data (passwords, tokens) from error reports.

**Depends on:** ERROR‑001 (global error handler)
**Blocks:** [N/A]
**Related Files:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/lib/sentry.ts`

**Imports / Exports**
- Imports: `@sentry/node` (Sentry.init, setupExpressErrorHandler), `@sentry/profiling-node` (optional)
- Exports: [N/A] — Sentry is initialised as a side effect; error handler is set up in `app.ts`

**Definition of Done**
- [ ] `@sentry/node` installed as a production dependency
- [ ] `Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 })` configured in a separate `sentry.ts` module
- [ ] `Sentry.setupExpressErrorHandler(app)` registered as the last error‑handling middleware (after ERROR‑001)
- [ ] Request handler `Sentry.Handlers.requestHandler()` added to the middleware stack to capture request context
- [ ] Sensitive data stripped via `beforeSend` hook: remove `password`, `password_hash`, `token`, `refreshToken` from request bodies, headers, and error details
- [ ] User context set via `Sentry.setUser({ id: req.user?.userId, organizationId: req.user?.organizationId })` in the auth middleware (AUTH‑008)
- [ ] Sentry degrades gracefully when `SENTRY_DSN` is not set — no errors; no Sentry initialisation
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Integration test verifies that a thrown error is captured by Sentry (with a mock DSN or test verification)

**Out of Scope**
- Frontend Sentry integration (separate task: FRONT‑INFRA‑005 or similar)
- Performance tracing with Sentry (tracesSampleRate set to 0.1 as a starting point)
- Release tracking and source map uploads

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- Never send raw passwords or tokens to Sentry — strip them in the `beforeSend` hook

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/sentry.ts`, `artifacts/api-server/src/app.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/lib/sentry.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `lib/sentry.ts`; revert `app.ts` to remove Sentry middleware
- Halt condition: if Sentry initialisation causes a startup crash when `SENTRY_DSN` is set but unreachable, stop and add a connection timeout

**Rules to Follow**
- `SENTRY_DSN` is optional — if not set, Sentry must be a complete no‑op with zero performance impact
- `setupExpressErrorHandler` must be the last middleware in the chain (after all routes and after the custom error handler)
- `beforeSend` must strip all sensitive fields from event data before transmission
- Set `environment` to `process.env.NODE_ENV` to separate production errors from development noise

**Verification**
```bash
# Verify Sentry loads without DSN (no errors)
SENTRY_DSN='' pnpm --filter @workspace/api-server run dev

# Integration test: trigger an error and verify it's captured
pnpm --filter @workspace/api-server test -- sentry.test.ts
```

**Advanced Code Patterns**
- `beforeSend` hook: `beforeSend(event, hint) => { delete event.request?.data?.password; delete event.request?.data?.password_hash; return event; }`
- User context from auth middleware: in `AUTH‑008`, after setting `req.user`, call `Sentry.setUser({ id: req.user.userId, organizationId: req.user.organizationId })`
- Graceful no‑op: `const dsn = process.env.SENTRY_DSN; if (dsn) { Sentry.init({ dsn, ... }) }` — wrap all Sentry calls in a conditional

**Anti‑Patterns**
- Forgetting the `beforeSend` hook — raw passwords get sent to Sentry
- Placing `setupExpressErrorHandler` before the custom error handler — Sentry captures errors but the custom handler doesn't format the response
- Hard‑coding `SENTRY_DSN` — always from environment variable
- Setting `tracesSampleRate: 1.0` in production — consumes significant quota

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/monitoring
- TDD: Write integration test that throws an error and verifies Sentry's test endpoint received it (or mock the Sentry transport)
- BDD: "As a developer, I receive real‑time alerts in Sentry when production errors occur, with full request context but no sensitive data."
- Deep Module: `lib/sentry.ts` is a thin wrapper around Sentry SDK initialisation; complexity lives in the SDK

---

### Subtasks
- [ ] MON‑002.0.25 (AGENT): Read ERROR‑001 error handler, AUTH‑008 middleware, and current `app.ts` middleware stack.
  *No action — pause until fully understood.*

- [ ] MON‑002.0.5 (AGENT): Research `@sentry/node` v9 Express integration, `beforeSend` hook patterns, and `setupExpressErrorHandler` placement (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] MON‑002.0.75 (AGENT): Reason about what data fields to strip in the `beforeSend` hook. Confirm the list with user.
  *If uncertain, strip `password`, `password_hash`, `token`, `refreshToken`, `accessToken`, `authorization`.*

- [ ] MON‑002.1 (AGENT): Install `@sentry/node`, create `lib/sentry.ts` with conditional initialisation and `beforeSend` hook.
  **File(s):** `artifacts/api-server/src/lib/sentry.ts`
  **Verification:** `pnpm run typecheck` passes; server starts without SENTRY_DSN set.

- [ ] MON‑002.2 (AGENT): Add `Sentry.Handlers.requestHandler()` and `Sentry.setupExpressErrorHandler(app)` to `app.ts`; add user context in AUTH‑008.
  **File(s):** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/middlewares/auth.ts`
  **Verification:** Error throws show up in Sentry dashboard (when DSN is configured).

- [ ] MON‑002.3 (AGENT): Write integration test verifying error capture and sensitive data stripping.
  **File(s):** `artifacts/api-server/src/__tests__/lib/sentry.test.ts`
  **Verification:** `pnpm --filter @workspace/api-server test -- sentry.test.ts` → GREEN.

- [ ] MON‑002.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] MON‑003: Set Up Structured Logging for Aggregation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Logging exists via Pino but request IDs are not consistently propagated, and log format is not fully structured for aggregation. As of 2026, `pino-http` with `genReqId` generates a unique `requestId` per request, and Pino JSON output is ready for shipping to log aggregation platforms (Elasticsearch, Datadog, Grafana Loki) without transformation.
**Size:** Small

**Description:** Ensure all logs are structured JSON with consistent `requestId` propagation via `pino-http`. Configure `LOG_LEVEL` from environment variable. Ready for future log aggregation without any further code changes.

**Depends on:** [N/A] — Pino is already used; this is a configuration and consistency pass
**Blocks:** [N/A]
**Related Files:** `artifacts/api-server/src/lib/logger.ts`, `artifacts/api-server/src/app.ts`

**Imports / Exports**
- Imports: `pino`, `pino-http`, `crypto` (for request ID generation)
- Exports: `logger` (Pino instance), `requestIdMiddleware` (express middleware)

**Definition of Done**
- [ ] Pino instance configured with `LOG_LEVEL` env var (default: `'info'`), `timestamp` enabled, and `formatters` for clean output
- [ ] `pino-http` middleware registered early in the Express stack with `genReqId: () => crypto.randomUUID()`
- [ ] All route handlers and services log with the Pino `logger` instance (not `console.log`)
- [ ] Request ID (`reqId`) included in every log line via `pino-http` auto‑population; `userId` included when `req.user` is populated
- [ ] All existing `console.log` or `console.error` calls in the API server replaced with Pino logger calls
- [ ] `NODE_ENV=production` uses compact JSON output; `NODE_ENV=development` uses `pino-pretty` for human‑readable logs
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Shipping logs to external aggregation services (Datadog, Elasticsearch) — the JSON output is ready for any log shipper
- Log sampling or rate limiting
- Log retention policies

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never log `password`, `password_hash`, `token`, `refreshToken`, or full JWT values — use a serialiser that redacts sensitive fields

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/logger.ts`, `artifacts/api-server/src/app.ts`
- Tests added/updated in: [N/A] — logging is verified by manual inspection and integration tests
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — revert `logger.ts` and `app.ts` to previous logging configuration
- Halt condition: if `pino-http` causes a measurable performance regression (>5% request latency), stop and investigate middleware placement

**Rules to Follow**
- `genReqId` must use a cryptographically random UUID — never a sequential ID
- Pino serializers must strip `password`, `password_hash`, `token`, `refreshToken`, and `authorization` from `req` and `res` objects
- `logger` instance must be a singleton; import from `lib/logger.ts` everywhere — never create new Pino instances
- All `console.log` and `console.error` must be replaced with `logger.info`, `logger.error`, etc.

**Verification**
```bash
# Start server in development mode and verify human‑readable logs
NODE_ENV=development pnpm --filter @workspace/api-server run dev

# Start server in production mode and verify JSON output
NODE_ENV=production pnpm --filter @workspace/api-server run start | head -n 1 | jq .
# Check that each log line includes `reqId` and `level`
```

**Advanced Code Patterns**
- Pino serializers: `const serializers = { req: (req) => ({ method: req.method, url: req.url, headers: { ...req.headers, authorization: undefined } }) }` — redacts sensitive headers
- `genReqId`: `genReqId: (req) => req.headers['x-request-id']?.toString() || crypto.randomUUID()` — reuse client‑provided ID if available
- Conditional pretty‑printing: `const transport = process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { colorize: true } }`

**Anti‑Patterns**
- Using `console.log` anywhere in production code after this task — use `logger.info` exclusively
- Logging the request body without stripping sensitive fields — always redact via serializers
- Creating multiple Pino instances — defeats log correlation and request ID propagation
- Forgetting to add `pino-http` middleware — subsequent middleware cannot access `req.log`

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/observability
- TDD: [N/A] — logging is verified by manual inspection and integration tests
- BDD: "As a DevOps engineer, all logs are structured JSON with request IDs, ready for shipment to a log aggregator without additional transformation."
- Deep Module: `lib/logger.ts` is a thin wrapper around Pino configuration; the logger instance is the deep module

---

### Subtasks
- [ ] MON‑003.0.25 (AGENT): Read the current `logger.ts` (if it exists) and audit all `console.log`/`console.error` calls in `artifacts/api-server/src/`.
  *No action — pause until fully understood.*

- [ ] MON‑003.0.5 (AGENT): Research `pino-http` v9 integration, `genReqId` best practices, and Pino serializers for redaction (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] MON‑003.0.75 (AGENT): Reason about whether `pino-http` is already installed and configured. If not, plan the installation and integration. Confirm with user.
  *If uncertain, audit `package.json` first.*

- [ ] MON‑003.1 (AGENT): Configure Pino instance with `LOG_LEVEL`, serializers, and conditional pretty‑printing.
  **File(s):** `artifacts/api-server/src/lib/logger.ts`
  **Verification:** `NODE_ENV=development pnpm --filter @workspace/api-server run dev` — logs are pretty‑printed.

- [ ] MON‑003.2 (AGENT): Add `pino-http` middleware with `genReqId` to the Express stack; replace all `console.log`/`console.error` with Pino logger calls.
  **File(s):** `artifacts/api-server/src/app.ts`, [all files with console calls]
  **Verification:** `grep -r "console\." artifacts/api-server/src/` returns zero results.

- [ ] MON‑003.3 (AGENT): Verify JSON output in production mode includes `reqId`.
  **Verification:** `NODE_ENV=production pnpm --filter @workspace/api-server run start | head -n 1 | jq .reqId` — contains a UUID.

- [ ] MON‑003.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] DOCS‑001: Finalize README with Architecture Diagram
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `README.md` exists from TOOLING‑001 but lacks an architecture diagram and bounded context summary. As of 2026, Mermaid diagrams are directly renderable in GitHub markdown, making architecture diagrams maintenance‑free compared to image files.
**Size:** Small

**Description:** Enhance the root `README.md` with a Mermaid architecture diagram showing bounded contexts and data flows, a bounded context map summary with links to ADRs, and a complete environment variables reference.

**Depends on:** TOOLING‑001 (initial README exists), DOMAIN‑002 (bounded context map)
**Blocks:** [N/A]
**Related Files:** `README.md`, `docs/bounded-contexts.md`

**Imports / Exports**
- Imports: [N/A] — documentation
- Exports: [N/A] — documentation

**Definition of Done**
- [ ] Mermaid architecture diagram added to README showing: all 10 bounded contexts, data flow relationships (domain events), external integrations, and infrastructure (PostgreSQL, Redis, R2)
- [ ] Bounded context summary table: context name, primary aggregate, key ADR references, link to context docs
- [ ] Environment variables reference table added, listing all required variables with description and example values
- [ ] Links to `docs/glossary.md`, `docs/bounded-contexts.md`, `docs/adr/`, and `CONTRIBUTING.md`
- [ ] Diagram renders correctly in GitHub (no broken Mermaid syntax)

**Out of Scope**
- Detailed data model diagrams (in `docs/bounded-contexts.md`)
- Sequence diagrams for specific workflows
- Deployment architecture diagrams (in deployment docs)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Documentation: `README.md` (updated)
- Documentation: [N/A] — no new files
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — revert `README.md` to previous version
- Halt condition: if the Mermaid diagram breaks GitHub rendering, stop and fix Mermaid syntax

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

**Advanced Code Patterns**
- Mermaid C4 Context diagram: `C4Context` or `graph TD` with bounded contexts as nodes and event flows as labelled edges
- Environment variables table: Markdown table with columns `Variable`, `Required`, `Description`, `Example`

**Anti‑Patterns**
- Using an image file for the architecture diagram — gets stale; Mermaid is source‑controlled and diffable
- Listing every environment variable without grouping — organise by functional area (database, auth, storage, integrations)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Architecture diagram is the strategic design visualisation of the bounded context map
- TDD: [N/A] — documentation task
- BDD: [N/A] — documentation task
- Deep Module: [N/A]

---

### Subtasks
- [ ] DOCS‑001.0.25 (AGENT): Read current `README.md`, `docs/bounded-contexts.md`, and all ADRs to understand the architecture.
  *No action — pause until fully understood.*

- [ ] DOCS‑001.0.5 (AGENT): Research Mermaid syntax for C4 context diagrams or architecture graphs (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] DOCS‑001.0.75 (AGENT): Sketch the architecture diagram based on the bounded context map and existing Phase 0–5 implementation. Confirm accuracy with user if uncertain.
  *If uncertain, ask the user before executing.*

- [ ] DOCS‑001.1 (AGENT): Add Mermaid architecture diagram to README.
  **File(s):** `README.md`
  **Verification:** Diagram renders correctly in GitHub.

- [ ] DOCS‑001.2 (AGENT): Add bounded context summary table and environment variables reference.
  **File(s):** `README.md`
  **Verification:** README updated with complete reference.

- [ ] DOCS‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] DOCS‑002: Write CONTRIBUTING.md & API Docs Generation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No `CONTRIBUTING.md` exists. OpenAPI spec exists (`lib/api-spec/openapi.yaml`) but is not served as interactive documentation. As of 2026, Swagger UI (`swagger-ui-express` v5) and ReDoc are the standard for serving OpenAPI docs from Express apps. `swagger-ui-express` serves a bundled Swagger UI at a chosen route, while Redoc renders a standalone interactive document.
**Size:** Small

**Description:** Write a comprehensive `CONTRIBUTING.md` covering development workflow, TDD expectations, commit conventions, and DDD patterns. Mount Swagger UI at `/api-docs` serving the OpenAPI spec, with a link from the README.

**Depends on:** API‑SPEC‑001 (OpenAPI spec exists), SEC‑002 (CSP must allow the Swagger UI assets)
**Blocks:** [N/A]
**Related Files:** `CONTRIBUTING.md`, `artifacts/api-server/src/app.ts`, `lib/api-spec/openapi.yaml`

**Imports / Exports**
- Imports: `swagger-ui-express`, `yaml` (for parsing OpenAPI spec), or `fs` to read the file
- Exports: [N/A] — route mounted in `app.ts`

**Definition of Done**
- [ ] `CONTRIBUTING.md` covers:
  - Monorepo structure and workspace overview
  - Prerequisites (Node.js 22, pnpm 9, PostgreSQL 16, Redis 7)
  - Development workflow (`pnpm dev`, `pnpm typecheck`, `pnpm test`, `pnpm lint`)
  - TDD expectations: red‑green‑refactor, tests before implementation
  - DDD patterns: bounded contexts, aggregates, repositories, deep modules
  - BDD feature file usage and location (`docs/features/`)
  - Commit conventions (Conventional Commits)
  - PR process and CI checks
- [ ] Swagger UI mounted at `/api-docs` serving the spec from `lib/api-spec/openapi.yaml`
- [ ] CSP updated (if enforcing) to allow Swagger UI scripts and styles
- [ ] Link to `/api-docs` added in README
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Redoc integration (Swagger UI is sufficient)
- API version‑specific documentation endpoints (`/api-docs/v1`, `/api-docs/v2`)
- Hosting the OpenAPI spec externally (e.g., Postman, Stoplight)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `/api-docs` must not require authentication — it is a public documentation endpoint

**Output Artifacts**
- Documentation: `CONTRIBUTING.md`
- Code changes in: `artifacts/api-server/src/app.ts`
- Documentation: `README.md` (link added)
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `CONTRIBUTING.md`; remove Swagger UI route from `app.ts`
- Halt condition: if Swagger UI fails to load due to CSP violations, stop and update CSP directives before proceeding

**Rules to Follow**
- `swagger-ui-express` must serve the spec directly from the YAML file — not a pre‑built JSON copy that may go stale
- Swagger UI must be mounted with `explorer: true` for the search bar
- `CONTRIBUTING.md` must be actionable and concise — under 3 pages of text
- Do not require authentication for `/api-docs`

**Verification**
```bash
# Verify Swagger UI loads
curl -s http://localhost:8081/api-docs | head -n 5

# Open in browser and verify spec is interactive
open http://localhost:8081/api-docs

# Verify CONTRIBUTING.md exists
cat CONTRIBUTING.md | head -n 20
```

**Advanced Code Patterns**
- `swagger-ui-express` setup: `const swaggerDocument = YAML.load(readFileSync(join(__dirname, '../../lib/api-spec/openapi.yaml'), 'utf8')); app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }))`
- CSP update: if CSP is enforced, add `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline'` for the Swagger UI route only, or globally

**Anti‑Patterns**
- Reading the OpenAPI spec on every request — read once at startup and cache in memory
- Using a pre‑built static JSON copy that drifts from the canonical YAML
- Forgetting to update CSP when adding Swagger UI — the page loads blank

**DDD / TDD / BDD / Deep Module notes**
- DDD: API documentation is the external contract for all bounded contexts; `CONTRIBUTING.md` describes how to evolve those contexts
- TDD: [N/A] — documentation task
- BDD: "As an API consumer, I can browse the full API reference at `/api-docs` and test endpoints interactively."
- Deep Module: [N/A]

---

### Subtasks
- [ ] DOCS‑002.0.25 (AGENT): Read the current OpenAPI spec location, `app.ts`, and existing `README.md`.
  *No action — pause until fully understood.*

- [ ] DOCS‑002.0.5 (AGENT): Research `swagger-ui-express` v5 integration, serving YAML specs, and Conventional Commits format (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] DOCS‑002.0.75 (AGENT): Reason about CSP implications — will Swagger UI's inline scripts/styles break under the current CSP? Plan CSP updates if needed.
  *If CSP is enforcing, plan to relax for `/api-docs` route only.*

- [ ] DOCS‑002.1 (AGENT): Write `CONTRIBUTING.md` covering development workflow, TDD, DDD, BDD, and commit conventions.
  **File(s):** `CONTRIBUTING.md`
  **Verification:** File exists; covers all required sections.

- [ ] DOCS‑002.2 (AGENT): Mount Swagger UI at `/api-docs` serving the OpenAPI spec; update CSP if needed.
  **File(s):** `artifacts/api-server/src/app.ts`
  **Verification:** `http://localhost:8081/api-docs` displays interactive Swagger UI.

- [ ] DOCS‑002.3 (AGENT): Add `/api-docs` link to `README.md`.
  **File(s):** `README.md`
  **Verification:** Link works; `README.md` updated.

- [ ] DOCS‑002.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## Execution Order

```
SEC‑001 (rate limiting)
SEC‑002 (security headers) —— parallel
SEC‑003 (CORS) —————— parallel

SEC‑004 (DB SSL & pool) —— after DB‑MIGRATE‑001
SEC‑005 (threat detection) —— after MON‑002
DB‑RLS‑FIN‑001 (RLS evaluation) —— after all financial schemas

WS‑INFRA‑001 (WebSocket) —— independent; infrastructure prerequisite
MON‑001 (health checks) —— after SEC‑004, WS‑INFRA‑001
MON‑002 (Sentry) —— after ERROR‑001
MON‑003 (structured logging) —— independent

DOCS‑001 (README) —— after DOMAIN‑002
DOCS‑002 (CONTRIBUTING) —— after API‑SPEC‑001
```

SEC‑001, SEC‑002, and SEC‑003 can run in parallel. SEC‑004 depends on database configuration. WS‑INFRA‑001 is independent. MON‑001 depends on SEC‑004 and WS‑INFRA‑001. DOCS‑001 and DOCS‑002 are independent documentation tasks.

---

*End of Phase 6 Security & Monitoring.*