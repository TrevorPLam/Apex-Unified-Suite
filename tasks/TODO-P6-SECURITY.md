# TODO-P6-SECURITY.md – Phase 6: Security & Monitoring

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

# Phase 6 – Production Readiness & DevOps (Security & Monitoring)

*This section addresses security hardening, real-time infrastructure, and monitoring requirements for production deployment. Every task incorporates explicit dependencies, verification commands, and clear entry/exit criteria.*

---

## Phase 6 Task Index (Security & Monitoring)

### Security Hardening
- [ ] SEC‑001 – Add Rate Limiting to Express App (Per‑IP & Per‑Tenant)
- [ ] SEC‑002 – Add Security Headers (Helmet) & CSP
- [ ] SEC‑003 – Configure CORS with Allowed Origins
- [ ] SEC‑004 – Enable Database SSL & Connection Pool Limits

### Database Security
- [ ] DB‑RLS‑FIN‑001 – Re‑evaluate Row Level Security for Financial Data  

### Real‑Time Infrastructure
- [ ] WS‑INFRA‑001 – WebSocket Server Setup  

### Monitoring & Observability
- [ ] MON‑001 – Add Health Check Endpoint Enhancements  
- [ ] MON‑002 – Integrate Error Tracking (Sentry)  
- [ ] MON‑003 – Set Up Structured Logging for Aggregation  

### Documentation & Onboarding
- [ ] DOCS‑001 – Finalize README with Architecture Diagram  
- [ ] DOCS‑002 – Write CONTRIBUTING.md & API Docs Generation  

---

## Security Hardening

### SEC‑001: Add Rate Limiting to Express App (Per‑IP & Per‑Tenant)
**Status:** ⏳ Not Started  
**Depends on:** ERROR‑001 (global error handler catches 429).  
**Definition of Done:**
- `express‑rate‑limit` middleware applied globally: 100 requests per 15 minutes per IP.
- Per‑tenant rate limiting: 200 requests per 15 minutes per `organization_id` (extracted from authenticated user context).
- Stricter limit on auth endpoints: 20 requests per 10 minutes per IP with `skipSuccessfulRequests: true`.
- **Extended to protect WebSocket upgrade endpoint:** rate limit new WebSocket connections to 10 per minute per IP.
- Rate limit responses return `429 Too Many Requests` with a standard error envelope.
- Tenant limits only apply after authentication; IP limits apply to all requests.

**Advanced Code Patterns:**
- Rate limiting middleware with Redis-backed storage for distributed environments
- Sliding window algorithm for accurate rate limiting
- Per-endpoint rate limiting configuration
- WebSocket connection rate limiting with connection tracking

**Rules to Follow:**
- All rate limits must be configurable via environment variables
- Rate limiting must work in distributed deployments
- Authentication endpoints must have stricter limits
- WebSocket connections must be rate limited separately
- Rate limit responses must include retry-after headers

**Subtasks:**
- [ ] SEC‑001.1: Implement global and auth IP rate limiters. (AGENT) – `middlewares/rate‑limiter.ts`  
  **verification:** Unit test that exceeding IP limit returns 429.
- [ ] SEC‑001.2: Implement per‑tenant rate limiter for authenticated routes. (AGENT)  
  **verification:** Unit test that exceeding tenant limit returns 429 for authenticated requests.
- [ ] SEC‑001.3: Verify rate limiting is applied before auth middleware (to block brute force). (HUMAN)  
  **verification:** Manual test.
- [ ] SEC‑001.4: Add rate limiting for WebSocket upgrade requests. (AGENT)  
  **verification:** Exceeding 10 connections per minute from same IP blocks further upgrades with 429.

---

### SEC‑002: Add Security Headers (Helmet) & CSP
**Current state:** No security headers.  
**Definition of Done:**
- `helmet` middleware added (with defaults).
- Content‑Security‑Policy header configured to restrict scripts/styles to self origin and trusted CDNs (if any).
- Tests verify headers like `X‑Content‑Type‑Options: nosniff`, `X‑Frame‑Options: DENY` are present.

**Advanced Code Patterns:**
- Content Security Policy with nonce-based script execution
- Security header middleware with environment-based configuration
- CSP violation reporting and monitoring
- Dynamic header configuration for different environments

**Rules to Follow:**
- All security headers must be present in production
- CSP must be restrictive but allow legitimate functionality
- Security headers must be tested in integration tests
- CSP violations must be monitored and logged
- Header configuration must be environment-aware

**Subtasks:**
- [ ] SEC‑002.1: Install and configure helmet. (AGENT)  
  **verification:** Integration test checks headers.
- [ ] SEC‑002.2: Add CSP rules. (AGENT)  
  **verification:** CSP header present and valid.

---

### SEC‑003: Configure CORS with Allowed Origins
**Current state:** CORS is wide open.  
**Definition of Done:** `cors()` is configured with an `allowedOrigins` list read from `ALLOWED_ORIGINS` env var (comma‑separated). In production, this is the frontend domain.  

**Advanced Code Patterns:**
- Dynamic CORS configuration based on environment
- Origin validation with regex patterns
- Pre-flight request caching
- CORS middleware with configurable options per route

**Rules to Follow:**
- CORS must be restrictive in production
- Development environments can have relaxed CORS
- Origin validation must be case-insensitive
- CORS configuration must support localhost and subdomains
- Pre-flight requests must be handled efficiently

**Subtasks:**
- [ ] SEC‑003.1: Add `ALLOWED_ORIGINS` to `.env.example` and configure CORS middleware. (AGENT)  
  **verification:** Preflight OPTIONS request returns correct headers.

---

### SEC‑004: Enable Database SSL & Connection Pool Limits
**Definition of Done:**  
- `DATABASE_URL` in production forces `?sslmode=require`.  
- Pool size limited to `PG_MAX` env var (default 10).  
**Advanced Code Patterns:**
- Database connection pool with health monitoring
- SSL certificate validation and rotation
- Connection pool metrics and monitoring
- Graceful degradation on connection issues

**Rules to Follow:**
- All production connections must use SSL
- Connection pool size must be environment-appropriate
- Database connections must be monitored for health
- Connection failures must trigger appropriate alerts
- Pool configuration must support both read and write operations

**Subtasks:** update DB connection config, add env vars.

---

## Database Security

### DB‑RLS‑FIN‑001: Re‑evaluate Row Level Security for Financial Data
**Status:** ⏳ Not Started  
**Depends on:** All financial schema tasks (DB‑FIN‑001, DB‑FIN‑002, DB‑FIN‑003).  
**Current state:** ARCH‑001 ADR deferred RLS implementation for MVP.  
**Definition of Done:**
- Evaluate financial tables (invoices, payments, transactions) for RLS requirements.
- If RLS is needed, implement policies for multi‑tenant data isolation.
- Document RLS strategy and performance implications.
- Add tests to verify RLS policies work correctly.
**Related Files:** Database migration files, RLS policy documentation.

**Subtasks:**
- [ ] DB‑RLS‑FIN‑001.1: Assess RLS requirements for regulated financial data. (HUMAN)  
  **verification:** Assessment document created.
- [ ] DB‑RLS‑FIN‑001.2: Implement RLS policies if required (or document decision to defer). (AGENT)  
  **verification:** Policies work correctly or deferral documented.
- [ ] DB‑RLS‑FIN‑001.3: Add RLS testing to ensure tenant isolation. (AGENT)  
  **verification:** Tests pass for cross‑tenant data access.

---

## Real‑Time Infrastructure

### WS‑INFRA‑001: WebSocket Server Setup
**Status:** ⏳ Not Started  
**Depends on:** None (infrastructure task).  
**Blocks:** Real‑time features (in‑app notifications delivery, live document collaboration, appointment status updates).  
**Definition of Done:**  
- A WebSocket server is established alongside Express using Socket.io (or `ws`).  
- Connections are authenticated via JWT (passed as a query parameter during handshake).  
- Channel/room management is implemented: rooms based on organisation ID and per‑entity IDs (e.g., `org:<orgId>`, `project:<projectId>`).  
- A client‑side WebSocket provider with auto‑reconnect and connection state management is scaffolded (actual frontend integration follows in relevant UI tasks).  
- Concurrency and graceful shutdown are tested.  
**Related Files:** `artifacts/api-server/src/lib/ws/websocket-server.ts`, `artifacts/api-server/src/middlewares/ws-auth.ts`

**DDD:** Infrastructure service; all bounded contexts can emit events through the bus that get relayed to subscribed clients.  
**TDD:** Write integration test that verifies an authenticated client can connect, join a room, and receive a message.  
**BDD:** N/A – infrastructure.  
**Deep Module:** The WebSocket gateway hides connection management, authentication, and room logic.

**Subtasks:**
- [ ] WS‑INFRA‑001.1: Install Socket.io and integrate with the HTTP server. (AGENT)  
  **verification:** Server starts without errors; `ws://localhost:8081/socket.io/` responds.
- [ ] WS‑INFRA‑001.2: Implement authentication middleware for WebSocket connections (JWT validation). (AGENT) – `src/middlewares/ws-auth.ts`  
  **verification:** Connection rejected with 401 for invalid token; `socket.data.user` set for valid token.
- [ ] WS‑INFRA‑001.3: Implement organisation‑scoped rooms and helper to emit events from services. (AGENT) – `src/lib/ws/event‑emitter.ts`  
  **verification:** Service publishes event → clients in matching `org:<id>` room receive it.
- [ ] WS‑INFRA‑001.4: Create frontend WebSocket provider with auto‑reconnect (suspendable). (AGENT) – `artifacts/apex-os/src/contexts/WebSocketContext.tsx`  
  **verification:** Provider connects on app load; reconnects after network drop.
- [ ] WS‑INFRA‑001.5: Write integration test for full WebSocket lifecycle (connect, authenticate, subscribe, receive, disconnect). (AGENT)  
  **verification:** Test passes.

---

## Monitoring & Observability

### MON‑001: Add Health Check Endpoint Enhancements (DB, Pool & Query Monitoring)
**Depends on:** TOOLING‑005 (migrations applied).  
**Definition of Done:** `GET /api/healthz` now also checks:
- Database connectivity (`SELECT 1`) and returns 503 if DB is down.
- Connection pool status (active/idle counts, saturation percentage).
- Slow query monitoring threshold (queries exceeding 500ms logged as warnings).
- **WebSocket server health:** verify the WebSocket server is accepting connections; return `degraded` if the WebSocket service is unreachable.
- Uptime still included.
- Health check response includes detailed status object for monitoring systems.

**Advanced Code Patterns:**
- Health check middleware with component status aggregation
- Database connection pool metrics collection
- Slow query detection with configurable thresholds
- WebSocket health monitoring with connection testing
- Graceful degradation for partial system failures

**Rules to Follow:**
- All critical components must be health-checked
- Health checks must be fast and lightweight
- Partial failures must return appropriate status codes
- Health check data must be structured for monitoring
- External dependencies must have timeout handling

**Subtasks:**
- [ ] MON‑001.1: Enhance health handler with DB connectivity check. (AGENT)  
  **verification:** Endpoint returns 503 when DB is down.
- [ ] MON‑001.2: Add connection pool monitoring to health check. (AGENT)  
  **verification:** Health response includes pool metrics.
- [ ] MON‑001.3: Implement slow query logging and threshold monitoring. (AGENT)  
  **verification:** Slow queries appear in structured logs.
- [ ] MON‑001.4: Add integration tests for all health check scenarios. (AGENT)  
  **verification:** Tests cover healthy, degraded, and failed states.
- [ ] MON‑001.5: Add R2 storage health check to monitor Cloudflare R2 connectivity and bucket access. (AGENT)  
  **verification:** Health check includes R2 status; returns degraded status if R2 is unavailable.
- [ ] MON‑001.6: Add WebSocket health check to the health endpoint. (AGENT)  
  **verification:** Health response includes `websocket: { status: "ok" | "degraded" }`; degraded if the WS server is not accepting connections.

---

### MON‑002: Integrate Error Tracking (Sentry)
**Depends on:** ERROR‑001 (global handler).  
**Definition of Done:** Sentry SDK integrated in backend (Express error handler captures errors) and frontend (ErrorBoundary reports to Sentry). Sentry DSN from env vars.  
**Advanced Code Patterns:**
- Error tracking middleware with context enrichment
- Sentry integration with user and organization context
- Error grouping and deduplication
- Performance monitoring integration

**Rules to Follow:**
- All errors must be captured and reported
- Sensitive data must be stripped from error reports
- Error context must include relevant user information
- Error tracking must not impact application performance
- Critical errors must trigger immediate alerts

**Subtasks:** install, configure, test.

---

### MON‑003: Set Up Structured Logging for Aggregation
**Definition of Done:** Pino logs are JSON and include a `requestId` (via `pino‑http`). Log level configurable via `LOG_LEVEL`. Ready for future log aggregation.  
**Advanced Code Patterns:**
- Structured logging with request tracing
- Log correlation across microservices
- Performance metrics logging
- Sensitive data filtering in logs

**Rules to Follow:**
- All logs must be structured JSON format
- Request IDs must be included in all log entries
- Sensitive data must be filtered from logs
- Log levels must be configurable per environment
- Performance metrics must be logged consistently

**Subtasks:** add request ID middleware, ensure all logs are structured.

---

## Documentation & Onboarding

### DOCS‑001: Finalize README with Architecture Diagram
**Depends on:** TOOLING‑001.1 (initial README).  
**Definition of Done:** README includes: project overview, architecture diagram (Mermaid), bounded context summary, quick start, environment variables list, and link to CONTRIBUTING.  
**DDD:** Architecture diagram highlights bounded contexts and their relationships.  
**Subtasks:**
- [ ] DOCS‑001.1: Add Mermaid diagram showing contexts and data flows. (AGENT)  
  **verification:** Diagram renders in GitHub.
- [ ] DOCS‑001.2: Add bounded context map summary. (AGENT)  
  **verification:** README updated.

---

### DOCS‑002: Write CONTRIBUTING.md & API Docs Generation
**Definition of Done:**  
- `CONTRIBUTING.md` covers: development workflow (pnpm, typecheck, test), TDD expectations, DDD patterns, BDD feature file usage, commit conventions (conventional commits).  
- API docs are generated from OpenAPI using Swagger UI or Redoc, served at a route (`/api-docs`). Link in README.  
**Subtasks:**
- [ ] DOCS‑002.1: Write CONTRIBUTING.md. (AGENT)  
  **verification:** File exists.
- [ ] DOCS‑002.2: Configure Swagger UI route in Express. (AGENT)  
  **verification:** Visiting `/api-docs` shows the spec.

---

*End of Phase 6 Security & Monitoring section. Continue with TODO-P6-ADVANCED.md for advanced features and opportunities.*
