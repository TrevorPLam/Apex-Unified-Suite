This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

Now producing the final phase: **Phase 6 – Production Readiness & DevOps**. This phase addresses all remaining P1 and P2 audit findings that prevent secure, reliable deployment. Every task incorporates the same rigor: explicit `depends_on`, verification commands on subtasks, and clear entry/exit criteria. The migration strategy is switched from `push` to proper `generate`/`migrate` (TOOLING‑005), CI/CD pipelines are set up, Docker images are built, and security hardening is applied.

---

# Phase 6 – Production Readiness & DevOps

*This phase covers database migration strategy, CI/CD, containerization, security hardening, monitoring, and documentation. It transforms the codebase from a development‑only prototype into a production‑grade deployable system.*

---

## Phase 6 Task Index

### Database Migration Strategy
- [ ] TOOLING‑005 – Switch from drizzle‑kit push to generate/migrate  

### CI/CD Pipeline
- [ ] CI‑001 – Set Up GitHub Actions – Lint, Typecheck, Test  
- [ ] CI‑002 – Database Migration Check in CI  
- [ ] CI‑003 – Build & Push Docker Images  
- [ ] CI‑004 – Run E2E Tests in CI  

### Containerization & Deployment
- [ ] DOCKER‑001 – Create Frontend Dockerfile & Nginx Config  
- [ ] DOCKER‑002 – Create Backend Dockerfile  
- [ ] DOCKER‑003 – Create docker‑compose for Local Development  
- [ ] DOCKER‑004 – Environment Variable Management (.env.production)  

### Security Hardening
- [ ] SEC‑001 – Add Rate Limiting to Express App (Per‑IP & Per‑Tenant)
- [ ] SEC‑002 – Add Security Headers (Helmet) & CSP
- [ ] SEC‑003 – Configure CORS with Allowed Origins
- [ ] SEC‑004 – Enable Database SSL & Connection Pool Limits

### Database Security
- [ ] DB‑RLS‑FIN‑001 – Re‑evaluate Row Level Security for Financial Data  

### Monitoring & Observability
- [ ] MON‑001 – Add Health Check Endpoint Enhancements  
- [ ] MON‑002 – Integrate Error Tracking (Sentry)  
- [ ] MON‑003 – Set Up Structured Logging for Aggregation  

### Documentation & Onboarding
- [ ] DOCS‑001 – Finalize README with Architecture Diagram  
- [ ] DOCS‑002 – Write CONTRIBUTING.md & API Docs Generation  

---

## Database Migration Strategy

### TOOLING‑005: Switch from drizzle‑kit push to drizzle‑kit generate/migrate
**Status:** ⏳ Not Started  
**Depends on:** DB‑MIGRATE‑ALL (all tables defined).  
**Blocks:** CI‑002, DOCKER‑004.  
**Current state:** Database changes are applied via `drizzle‑kit push`, which directly modifies the schema without versioned migration files. This works for development but is unsafe for production.  
**Definition of Done:**  
- `lib/db/package.json` includes scripts: `generate` (drizzle‑kit generate), `migrate` (drizzle‑kit migrate), and `push‑force` is removed or deprecated.  
- Migration files are stored in `lib/db/migrations/` and version‑controlled.  
- The seed and smoke test from Phase 2 run against a migrated database (not pushed).  
- Migrations are idempotent: running `migrate` twice has no side effects.  
- Rollback strategy documented in `docs/adr/002-migration-strategy.md`.  
**Related Files:** `lib/db/package.json`, `lib/db/migrations/`, `docs/adr/002-migration-strategy.md`

**DDD:** N/A – infrastructure concern.  
**TDD:** The smoke test (DB‑MIGRATE‑ALL.5) serves as validation.  
**Deep Module:** N/A.

**Subtasks:**
- [ ] TOOLING‑005.1: Add `generate` and `migrate` scripts to `lib/db/package.json`; remove or comment out `push`/`push-force` scripts. (AGENT)  
  **verification:** `pnpm run --filter db generate` produces migration files.
- [ ] TOOLING‑005.2: Generate initial migration from the current schema (baseline migration). (AGENT)  
  **verification:** Migration files exist in `lib/db/migrations/` and are valid SQL.
- [ ] TOOLING‑005.3: Test migration on a fresh database: run `drizzle‑kit migrate`, then seed, then smoke test. (HUMAN)  
  **verification:** `pnpm run --filter db migrate` works; `pnpm test -- smoke` passes.
- [ ] TOOLING‑005.4: Test idempotency – run `migrate` again, no errors. (HUMAN)  
  **verification:** Second run does nothing harmful.
- [ ] TOOLING‑005.5: Document rollback strategy in `docs/adr/002-migration-strategy.md`. (AGENT)  
  **verification:** ADR file explains irreversible vs. reversible migrations, and how to test rollbacks locally.
- [ ] TOOLING‑005.6: Implement Expand/Contract migration pattern for safe schema changes. (AGENT) – `lib/db/migrations/`  
  **verification:** Documentation and examples show expand (add new column/table), contract (remove old column/table), and sync (data migration) patterns; all new migrations follow this pattern.
## CI/CD Pipeline

### CI‑001: Set Up GitHub Actions – Lint, Typecheck, Test, & Supply Chain Security  
**Status:** ⏳ Not Started  
**Current state:** No CI exists.  
**Definition of Done:**  
- `.github/workflows/ci.yml` triggers on push to `main` and pull requests.
- Jobs: `lint` (ESLint – a basic config is created if missing), `typecheck` (runs `pnpm typecheck` across workspace), `test` (runs `pnpm test` for all unit/integration tests, excluding E2E), `security` (runs `pnpm audit` for supply chain scanning).
- **Breaking change detection**: Add `oasdiff` check to compare OpenAPI spec changes and detect breaking changes between versions.
- Workspace caching for `pnpm` store and node modules to speed up runs.
- Dependabot or Renovate configuration for automated dependency updates.
**Related Files:** `.github/workflows/ci.yml`, `.github/dependabot.yml` or `renovate.json`

**Subtasks:**
- [ ] CI‑001.1: Create workflow file with lint, typecheck, test, and security jobs. (AGENT)  
  **verification:** Workflow runs on GitHub Actions (manual push triggers).
- [ ] CI‑001.2: Add exact ESLint config (`.eslintrc.cjs`) with parser, plugins, and rules:  
  - Parser: `@typescript-eslint/parser`  
  - Plugins: `@typescript-eslint`, `react-hooks`, `import`  
  - Extends: `eslint:recommended`, `@typescript-eslint/recommended`, `plugin:react-hooks/recommended`  
  - Rules: `@typescript-eslint/no-unused-vars: error`, `@typescript-eslint/no-explicit-any: warn`, `import/order: error`, `react-hooks/rules-of-hooks: error`, `react-hooks/exhaustive-deps: warn`  
  - Environment: `es2022`, `node`, `browser`  
  (AGENT) – `.eslintrc.cjs`  
  **verification:** `pnpm lint` passes on codebase; config file exists with exact parser, plugins, and rules specified.
- [ ] CI‑001.3: Add supply chain security job with `pnpm audit` and Dependabot/Renovate config. (AGENT)  
  **verification:** Security job passes and dependency update PRs are created.
- [ ] CI‑001.4: Verify that a failing test or type error breaks build. (HUMAN)  
  **verification:** GitHub Actions check shows failure.
- **Depends on:** Phase 0–5 implementation (so there is test content).

---

### CI‑002: Database Migration Check in CI
**Status:** ⏳ Not Started  
**Depends on:** TOOLING‑005, CI‑001.  
**Definition of Done:** A CI job spins up a Postgres service container, runs `drizzle‑kit migrate` with the test database, then runs the DB smoke test. This ensures migrations are always valid and idempotent.

**Subtasks:**
- [ ] CI‑002.1: Add Postgres service container to CI workflow. (AGENT)  
  **verification:** Workflow config valid.
- [ ] CI‑002.2: Add a job that runs `drizzle‑kit migrate` and then smoke test. (AGENT)  
  **verification:** Job passes in CI.

---

### CI‑003: Build & Push Docker Images
**Status:** ⏳ Not Started  
**Depends on:** DOCKER‑001, DOCKER‑002 (Dockerfiles exist).  
**Definition of Done:** On tag push (e.g., `v*`), a workflow builds multi‑stage Docker images for frontend and backend, tags them with the Git tag and `latest`, and pushes them to GitHub Container Registry (or another registry).  
**Related Files:** `.github/workflows/build-and-push.yml`

**Subtasks:**
- [ ] CI‑003.1: Create build‑and‑push workflow. (AGENT)  
  **verification:** Workflow config valid.
- [ ] CI‑003.2: Test that a tag push triggers the build and pushes images. (HUMAN)  
  **verification:** Images appear in registry.

---

### CI‑004: Run E2E Tests in CI
**Status:** ⏳ Not Started  
**Depends on:** E2E‑001 (Playwright tests written), CI‑001.  
**Definition of Done:** On pull requests or main pushes, an E2E job starts the full docker‑compose stack (frontend, backend, db), runs Playwright tests against it, and uploads artifacts on failure.  
**BDD:** This automates the executable specifications from Phase 0.  
**Subtasks:**
- [ ] CI‑004.1: Create E2E workflow. (AGENT)  
  **verification:** Workflow runs.
- [ ] CI‑004.2: Ensure tests pass in CI; if flaky, add retries. (HUMAN)  
  **verification:** CI green.

---

## Containerization & Deployment

### DOCKER‑001: Create Frontend Dockerfile & Nginx Config
**Status:** ⏳ Not Started  
**Current state:** No Dockerfiles exist.  
**Definition of Done:**  
- `Dockerfile.frontend` uses multi‑stage build: Node 24 for Vite build, Nginx (alpine) for serving static files.  
- `nginx.conf` includes SPA rewrite rule (all routes → index.html except static files), gzip, and security headers (X‑Frame‑Options, etc.).  
- Image exposes port 80.

**Subtasks:**
- [ ] DOCKER‑001.1: Write `Dockerfile.frontend` and `nginx.conf`. (AGENT)  
  **verification:** `docker build -f Dockerfile.frontend -t apex-frontend .` succeeds, `docker run` serves the app.

---

### DOCKER‑002: Create Backend Dockerfile
**Definition of Done:** `Dockerfile.backend` is multi‑stage: builds with esbuild (or pnpm run build), runs via Node 24. Health check defined (`HEALTHCHECK CMD curl -f http://localhost:8081/api/healthz`). Exposes port 8081. **Entry script runs `pnpm run migrate` before starting the backend.**

**Subtasks:** write, verify build.

---

### DOCKER‑003: Create docker‑compose for Local Development
**Definition of Done:** `docker‑compose.yml` defines: postgres (with volume), backend (depends_on postgres, env vars), frontend (depends_on backend). Uses `.env.example` variables. Networks configured.  
**Subtasks:** write, test `docker compose up`.

---

### DOCKER‑004: Environment Variable Management
**Depends on:** TOOLING‑001.2 (`.env.example` exists).  
**Definition of Done:**  
- `.env.example` (already created) is audited for completeness across all services (frontend, backend, portal).  
- `.env.production` template is created (without secrets, with production‑grade defaults: `NODE_ENV=production`, `PORT=8081`, etc.).  
**Subtasks:** audit and create template.

---

## Security Hardening

### SEC‑001: Add Rate Limiting to Express App (Per‑IP & Per‑Tenant)
**Status:** ⏳ Not Started  
**Depends on:** ERROR‑001 (global error handler catches 429).  
**Definition of Done:**
- `express‑rate‑limit` middleware applied globally: 100 requests per 15 minutes per IP.
- Per‑tenant rate limiting: 200 requests per 15 minutes per `organization_id` (extracted from authenticated user context).
- Stricter limit on auth endpoints: 20 requests per 10 minutes per IP with `skipSuccessfulRequests: true`.
- Rate limit responses return `429 Too Many Requests` with a standard error envelope.
- Tenant limits only apply after authentication; IP limits apply to all requests.
**Subtasks:**
- [ ] SEC‑001.1: Implement global and auth IP rate limiters. (AGENT) – `middlewares/rate‑limiter.ts`  
  **verification:** Unit test that exceeding IP limit returns 429.
- [ ] SEC‑001.2: Implement per‑tenant rate limiter for authenticated routes. (AGENT)  
  **verification:** Unit test that exceeding tenant limit returns 429 for authenticated requests.
- [ ] SEC‑001.3: Verify rate limiting is applied before auth middleware (to block brute force). (HUMAN)  
  **verification:** Manual test.

---

### SEC‑002: Add Security Headers (Helmet) & CSP
**Current state:** No security headers.  
**Definition of Done:**
- `helmet` middleware added (with defaults).
- Content‑Security‑Policy header configured to restrict scripts/styles to self origin and trusted CDNs (if any).
- Tests verify headers like `X‑Content‑Type‑Options: nosniff`, `X‑Frame‑Options: DENY` are present.
**Subtasks:**
- [ ] SEC‑002.1: Install and configure helmet. (AGENT)  
  **verification:** Integration test checks headers.
- [ ] SEC‑002.2: Add CSP rules. (AGENT)  
  **verification:** CSP header present and valid.

---

### SEC‑003: Configure CORS with Allowed Origins
**Current state:** CORS is wide open.  
**Definition of Done:** `cors()` is configured with an `allowedOrigins` list read from `ALLOWED_ORIGINS` env var (comma‑separated). In production, this is the frontend domain.  
**Subtasks:**
- [ ] SEC‑003.1: Add `ALLOWED_ORIGINS` to `.env.example` and configure CORS middleware. (AGENT)  
  **verification:** Preflight OPTIONS request returns correct headers.

---

### SEC‑004: Enable Database SSL & Connection Pool Limits
**Definition of Done:**  
- `DATABASE_URL` in production forces `?sslmode=require`.  
- Pool size limited to `PG_MAX` env var (default 10).  
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

## Monitoring & Observability

### MON‑001: Add Health Check Endpoint Enhancements (DB, Pool & Query Monitoring)
**Depends on:** TOOLING‑005 (migrations applied).  
**Definition of Done:** `GET /api/healthz` now also checks:
- Database connectivity (`SELECT 1`) and returns 503 if DB is down.
- Connection pool status (active/idle counts, saturation percentage).
- Slow query monitoring threshold (queries exceeding 500ms logged as warnings).
- Uptime still included.
- Health check response includes detailed status object for monitoring systems.  
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

---

### MON‑002: Integrate Error Tracking (Sentry)
**Depends on:** ERROR‑001 (global handler).  
**Definition of Done:** Sentry SDK integrated in backend (Express error handler captures errors) and frontend (ErrorBoundary reports to Sentry). Sentry DSN from env vars.  
**Subtasks:** install, configure, test.

---

### MON‑003: Set Up Structured Logging for Aggregation
**Definition of Done:** Pino logs are JSON and include a `requestId` (via `pino‑http`). Log level configurable via `LOG_LEVEL`. Ready for future log aggregation.  
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

## Advanced AP/AR Features

### AI‑AP‑001: Smart Invoice Coding (AI-powered)
**Status:** ⏳ Not Started  
**Depends on:** DOC‑AP‑001 (document storage), OCR‑AP‑001 (OCR stub).  
**Definition of Done:** `artifacts/api-server/src/services/ap/ai-coding-service.ts` exports `AICodingService`:
- `suggestVendor(extractedData)` – suggests vendor match based on extracted invoice data using ML/AI (integrate with OpenAI/Claude API or custom model).
- `suggestAccountCodes(extractedData)` – suggests GL account codes based on line item descriptions.
- `learnFromCorrection(invoiceId, correctedData)` – improves suggestions based on user corrections.
- Confidence scores for all suggestions.
**Note:** Can start with rule-based heuristics and evolve to ML.

### AI‑AP‑002: Duplicate Detection Engine
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑007 (bills service).  
**Definition of Done:** `artifacts/api-server/src/services/ap/duplicate-detection-service.ts` exports `DuplicateDetectionService`:
- `findPotentialDuplicates(billData)` – checks for duplicate bills by amount, vendor, date proximity, invoice number.
- `getDuplicateConfidence(existingBill, newBill)` – returns confidence score (0-1) of duplication.
- Flags potential duplicates during bill creation.
- Prevents duplicate payments by checking payment history.

### ADV‑AP‑001: Early Payment Discount Management
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑014 (bill payments).  
**Definition of Done:** `artifacts/api-server/src/services/ap/early-payment-service.ts` exports `EarlyPaymentDiscountService`:
- `calculateDiscountAvailability(billId)` – shows available early payment discounts (e.g., 2/10 Net 30).
- `getOptimalPaymentSchedule()` – recommends payment schedule to maximize discounts captured.
- `projectDiscountSavings(startDate, endDate)` – calculates potential savings from early payments.
- Integration with cash flow forecasting.

### ADV‑AR‑001: Credit Management & Risk Scoring
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑003 (customers service).  
**Definition of Done:** `artifacts/api-server/src/services/ar/credit-management-service.ts` exports `CreditManagementService`:
- `calculateCreditScore(customerId)` – internal credit score based on payment history, days to pay, invoice amounts.
- `recommendCreditLimit(customerId)` – suggests credit limit adjustments.
- `getRiskAlerts()` – flags customers with deteriorating payment patterns.
- `setCreditHold(customerId, reason)` – prevents new invoices for high-risk customers.

### ADV‑AR‑002: Automated Collections Workflow
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑013 (reminder service), EMAIL‑SERVICE‑001.  
**Definition of Done:** Collections automation beyond basic reminders:
- Escalating dunning levels (reminder → firm reminder → final notice → collections handoff).
- Customizable email templates per escalation level.
- Payment plan negotiation interface (schedule partial payments over time).
- Collections queue for staff follow-up on unresponsive accounts.
- Integration with external collections agency API (stubbed).

### ADV‑AR‑003: Usage-Based & Metered Billing
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑010 (recurring invoices).  
**Definition of Done:** Support for metered billing scenarios:
- `recordUsage(customerId, meterName, quantity, timestamp)` – records usage data.
- `generateInvoiceFromUsage(customerId, periodStart, periodEnd)` – creates invoice based on recorded usage.
- Usage reporting dashboard for customers.
- Tiered and volume pricing calculations.

### MULTI‑AP‑001: Multi-Entity AP/AR (Cross-Entity Payments)
**Status:** ⏳ Not Started  
**Depends on:** DB‑ORG‑001 (organizations), API‑AP‑014 (bill payments).  
**Definition of Done:** Support for organizations with multiple subsidiaries:
- Cross-entity bill payment (pay subsidiary's bills from parent account).
- Inter-company transfer tracking.
- Consolidated aging reports across entities.
- Entity-level permission scoping for AP/AR staff.

### INT‑QB‑001: QuickBooks Online Sync (Stub)
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑008, API‑AR‑008.  
**Definition of Done:** Stub implementation for QuickBooks integration:
- `pushInvoiceToQB(invoiceId)` – logs QB push request (stubbed).
- `pullVendorsFromQB()` – returns mock QB vendor data.
- `syncStatus(entityType, entityId)` – shows last sync status.
- **Note:** Full QBO integration deferred to P7.

---

## Enhancement Opportunities (Phase 6+)

### Storybook Integration
- **OPPORTUNITY‑001:** Add Storybook for component development and documentation
  - **Priority:** Low (post‑MVP enhancement)
  - **Description:** Set up Storybook with component stories, design system documentation, and interactive playground
  - **Benefits:** Improved developer experience, component testing, design consistency
  - **Implementation:** Configure Storybook with Vite, add stories for key shadcn/ui components

### SAST/DAST Security Scanning
- **OPPORTUNITY‑002:** Implement Static and Dynamic Application Security Testing
  - **Priority:** Medium (security hardening)
  - **Description:** Add automated security scanning in CI pipeline
  - **Tools:** Consider Semgrep (SAST), OWASP ZAP (DAST), or commercial alternatives
  - **Implementation:** Create placeholder task for Phase 6b or post‑MVP

---

*End of Phase 6. This completes the journey from a UI prototype with an empty database to a production‑ready, fully tested, containerized, and secure SaaS platform. The entire TODO is now implemented with precise dependencies, verification, and traceability to audit findings and domain‑driven design principles.*