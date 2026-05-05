# tasks/infrastructure/DEVOPS.md – CI/CD, Build, Migrations, Jobs & Docker

This file covers infrastructure tasks for continuous integration/deployment, production build optimisation, database migration strategy, background job processing, containerization, dependency coordination, and code quality enforcement. These are prerequisites for secure, reliable, and repeatable deployments.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] CI‑001: CI/CD Pipeline with GitHub Actions
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No CI/CD pipeline exists. All quality checks (lint, typecheck, test) run manually or not at all. Monorepo CI best practice for pnpm workspaces uses GitHub Actions with parallel jobs and change‑based filtering.
**Size:** Medium

**Description:** Set up a comprehensive GitHub Actions CI/CD pipeline that runs linting, type checking, and testing on every pull request and push to main, with change‑based filtering for monorepo efficiency, frozen lockfile validation, and optional Turborepo caching for build acceleration.

**Depends on:** `foundation/TOOLING.md → TOOLING‑002`, `DEP‑001`, `infrastructure/DATABASE.md → TEST‑INFRA‑001`
**Blocks:** `infrastructure/DEVOPS.md → OPPORTUNITY‑002` (SAST/DAST), all Phase 6 security tasks, `infrastructure/DEVOPS.md → DOCKER‑001`
**Related Files:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `turbo.json` (optional)

**Definition of Done**
- [ ] `.github/workflows/ci.yml` created with PR validation workflow triggered on `pull_request` and `push` to `main`
- [ ] CI workflow includes four parallel jobs: `lint`, `typecheck`, `test`, and `build`
- [ ] `lint` job: runs `pnpm lint` (or `pnpm --filter "...[origin/main]" lint` for change‑based execution)
- [ ] `typecheck` job: runs `pnpm typecheck` across all workspaces; fails if any TypeScript errors are present
- [ ] `test` job: runs `pnpm test` with Vitest; uploads coverage report as artifact
- [ ] `build` job: runs `pnpm build` to verify production builds succeed
- [ ] `--frozen‑lockfile` enforced on every `pnpm install` in CI
- [ ] PR comments or status checks clearly indicate which job failed and why
- [ ] Optional: `turbo.json` configured for Turborepo caching of lint/typecheck/test/build
- [ ] Manual trigger (`workflow_dispatch`) for full‑suite runs against any branch
- [ ] CI pipeline completes in under 10 minutes for a typical PR

**Out of Scope**
- Deployment to production (separate `deploy.yml` workflow — `DOCKER‑001`)
- SAST/DAST security scanning (`infrastructure/SECURITY.md → OPPORTUNITY‑002`)
- End‑to‑end Playwright tests in CI (Phase 5)

**Rules to Follow**
- CI pipeline must use `pnpm install --frozen‑lockfile` to ensure reproducible installs
- All quality gates (lint, typecheck, test) must pass before a PR can be merged
- `lint` must be run‑only (no auto‑fix) in CI; auto‑fix is a local developer responsibility
- TypeScript strict mode is non‑negotiable — `pnpm typecheck` must have zero errors
- Change‑based execution: use `pnpm --filter "...[origin/main]"` or Turborepo to only run affected packages
- Each job must be independently parallelizable to minimise CI time

**Verification**
```bash
# Test CI workflow locally using act (optional)
act pull_request -j lint

# Verify CI pipeline on a test PR
gh pr create --title "test: CI pipeline validation" --body "Testing CI pipeline"
# Check GitHub Actions tab for workflow run status
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/DevOps.
- TDD: CI pipeline enforces that all tests pass; it is the automated TDD gate.
- BDD: [N/A] — infrastructure concern.

---

### Subtasks
- [ ] CI‑001.0.25 (AGENT): Read the entire task and inspect the current monorepo structure, existing scripts in root `package.json`, and any existing `.github/` directory. *No action — pause.*
- [ ] CI‑001.0.5 (AGENT): Research GitHub Actions best practices for pnpm monorepos, `--filter` change‑based execution, and Turborepo caching (as of May 2026). *Document findings briefly.*
- [ ] CI‑001.1 (AGENT): Create `.github/workflows/ci.yml` with parallel lint, typecheck, test, and build jobs.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** Push a test commit and verify all four jobs run and pass in GitHub Actions.
- [ ] CI‑001.2 (AGENT): Add `--frozen‑lockfile` enforcement to the install step.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** A PR with a changed lockfile without `pnpm install --frozen‑lockfile` update fails CI.
- [ ] CI‑001.3 (AGENT): Configure change‑based filtering using `pnpm --filter "...[origin/main]"` or Turborepo.
  **File(s):** `.github/workflows/ci.yml`, `turbo.json` (if using Turborepo)
  **Verification:** A PR that only changes a single app runs CI only for that app and its dependencies.
- [ ] CI‑001.4 (AGENT): Add test coverage artifact upload.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** Coverage report downloadable from GitHub Actions run summary.
- [ ] CI‑001.N (HUMAN): Final review and sign‑off. Verify CI pipeline on a real PR. **Verification:** Approved.

---

## [ ] BUILD‑001: Production Build Optimization
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The monorepo has no build orchestration; each workspace package builds independently with no caching between steps. TypeScript 7's native compiler (tsgo) and isolated declarations can dramatically speed up declaration generation.
**Size:** Medium

**Description:** Optimise the monorepo build pipeline by configuring TypeScript project references for incremental builds, adding Turborepo for task orchestration and caching, enabling isolated declarations where supported, and establishing a single `pnpm build` command that produces production artifacts for all workspaces in dependency order.

**Depends on:** `foundation/TOOLING.md → TOOLING‑002`, `infrastructure/DEVOPS.md → CI‑001`
**Blocks:** `infrastructure/DEVOPS.md → DOCKER‑001`, all deployment tasks
**Related Files:** `tsconfig.base.json`, `turbo.json`, `package.json` (root), workspace `tsconfig.json` files

**Definition of Done**
- [ ] Root `package.json` has a `"build": "turbo build"` script (or `pnpm -r build` if not using Turborepo)
- [ ] `turbo.json` configured with pipeline definitions for `build`, `lint`, `typecheck`, `test`
- [ ] TypeScript project references wired between dependent packages (e.g., `lib/db` referenced by `artifacts/api‑server`)
- [ ] Isolated declarations enabled (`"isolatedDeclarations": true` in `tsconfig.base.json`) if supported by current TypeScript version
- [ ] Production build produces only the necessary output (no `node_modules` duplication, no devDependencies in output)
- [ ] `pnpm build` completes successfully at the monorepo root
- [ ] Build caching verified: second run of `pnpm build` with no changes completes in under 5 seconds
- [ ] `pnpm run typecheck` passes with zero errors after all build changes

**Out of Scope**
- Migrating to `tsgo` (TypeScript 7 native compiler) — deferred until TypeScript 7 is stable and adopted
- Bundle size analysis and optimization (separate performance task)
- Tree‑shaking and code splitting configuration
- Publishing individual packages to npm

**Rules to Follow**
- Project references must form a directed acyclic graph (DAG) — no circular references between packages
- Each workspace `tsconfig.json` must `"references"` only the packages it directly imports
- `isolatedDeclarations` requires explicit return type annotations on all exported functions — audit codebase before enabling
- Build must produce the same output whether run from root or from individual workspace
- Turborepo cache must be portable (not dependent on absolute file paths)

**Verification**
```bash
# Full build from root
pnpm build

# Verify second build is cached (should complete near‑instantly)
time pnpm build

# Typecheck after build
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/tooling.
- TDD: [N/A] — build optimization is verified by `pnpm build` and `pnpm typecheck`.
- BDD: [N/A] — infrastructure concern.

---

### Subtasks
- [ ] BUILD‑001.0.25 (AGENT): Read the entire task, inspect current `tsconfig.base.json`, workspace `tsconfig.json` files, and root `package.json` build scripts. *No action — pause.*
- [ ] BUILD‑001.0.5 (AGENT): Research TypeScript 5.8+ isolated declarations, project references configuration, and Turborepo v2 caching. *Document findings briefly.*
- [ ] BUILD‑001.1 (AGENT): Configure TypeScript project references between dependent packages.
  **File(s):** `tsconfig.base.json`, workspace `tsconfig.json` files
  **Verification:** `pnpm typecheck` passes; `tsc -b` builds in correct order.
- [ ] BUILD‑001.2 (AGENT): Install and configure Turborepo with pipeline definitions for lint, typecheck, test, and build.
  **File(s):** `turbo.json`, root `package.json`
  **Verification:** `pnpm build` completes; second run is fully cached.
- [ ] BUILD‑001.3 (AGENT): Consolidate root‑level build, lint, typecheck, and test scripts to use Turborepo.
  **File(s):** root `package.json`
  **Verification:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all work from root.
- [ ] BUILD‑001.4 (AGENT): Verify production build output is correct and contains no devDependencies.
  **Verification:** `pnpm build` output directories inspected; no test files, no devDependencies.
- [ ] BUILD‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DB‑MIGRATE‑001: Database Migration Strategy (Production)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** The project exclusively uses `drizzle‑kit push` for schema changes — a rapid local iteration tool that is not safe for production.
**Size:** Large

**Description:** Replace the `drizzle‑kit push` development workflow with a proper production migration strategy using `drizzle‑kit generate` to create versioned SQL migration files and `drizzle‑kit migrate` to apply them. Add migration verification and drift detection to the CI/CD pipeline.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`, all Phase 2 schema tasks
**Blocks:** `infrastructure/DEVOPS.md → DOCKER‑001`, any production deployment
**Related Files:** `lib/db/drizzle.config.ts`, `lib/db/package.json`, `lib/db/src/migrations/`, `.github/workflows/ci.yml`

**Definition of Done**
- [ ] `lib/db/package.json` updated with scripts: `db:generate`, `db:migrate`, `db:push` (retained for local dev only)
- [ ] `drizzle‑kit generate` produces versioned SQL migration files in `lib/db/src/migrations/`
- [ ] `drizzle‑kit migrate` applies pending migrations in order against the target database
- [ ] Migration runner is programmatic (not CLI‑only) so it can be called from application startup or CI
- [ ] Migration tracking table exists to prevent re‑applying migrations
- [ ] CI pipeline includes a migration drift check: `drizzle‑kit generate` run in CI, fails if uncommitted migrations are detected
- [ ] Local development continues to use `drizzle‑kit push` for rapid iteration
- [ ] Production deployments run `drizzle‑kit migrate` as part of the deployment pipeline
- [ ] Rollback documentation: each migration file has a corresponding down‑migration documented
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Automatic rollback of failed migrations (manual rollback with documented down‑migration scripts)
- Zero‑downtime migration patterns (expand/contract pattern) — deferred to Phase 8+

**Rules to Follow**
- `drizzle‑kit push` must never be used in CI or against production — it is for local development only
- Migration files are append‑only — never modify or delete an existing migration after it has been applied
- Each migration must be tested against a clone of the production schema before deployment
- CI must detect uncommitted migrations: `drizzle‑kit generate` → `git diff --exit‑code` on the migrations directory

**Verification**
```bash
pnpm --filter @workspace/db run db:generate
pnpm --filter @workspace/db run db:migrate
git diff --exit‑code lib/db/src/migrations/
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — database infrastructure.
- TDD: Migration verification tests: apply migrations to a test DB, verify schema matches Drizzle definitions.
- BDD: [N/A] — infrastructure concern.

---

### Subtasks
- [ ] DB‑MIGRATE‑001.0.25 (AGENT): Read the entire task and inspect the current `drizzle.config.ts`, `package.json` db scripts, and existing migration state. *No action — pause.*
- [ ] DB‑MIGRATE‑001.0.5 (AGENT): Research `drizzle‑kit generate` and `drizzle‑kit migrate` vs `push` trade‑offs, and CI drift detection patterns. *Document findings briefly.*
- [ ] DB‑MIGRATE‑001.1 (AGENT): Update `lib/db/package.json` scripts: add `db:generate` and `db:migrate`; retain `db:push` for local dev.
  **File(s):** `lib/db/package.json`
  **Verification:** `pnpm --filter @workspace/db run db:generate` produces migration files.
- [ ] DB‑MIGRATE‑001.2 (AGENT): Generate baseline migration from current schema and add programmatic migration runner.
  **File(s):** `lib/db/src/migrations/`, `lib/db/src/migrate.ts`
  **Verification:** `pnpm --filter @workspace/db run db:migrate` applies migrations successfully.
- [ ] DB‑MIGRATE‑001.3 (AGENT): Add CI drift detection step to GitHub Actions workflow.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** Uncommitted schema changes fail CI.
- [ ] DB‑MIGRATE‑001.4 (AGENT): Document migration workflow in `docs/database‑migrations.md`.
  **File(s):** `docs/database‑migrations.md`
  **Verification:** Document covers generate, migrate, rollback, and CI drift detection.
- [ ] DB‑MIGRATE‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] JOB‑INFRA‑001: Background Job Infrastructure
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The API server has no background job processing capability. All work executes synchronously in the HTTP request/response cycle.
**Size:** Large

**Description:** Implement a production‑grade background job infrastructure using BullMQ with Redis as the message broker, covering job queues, workers, repeatable scheduled jobs, retry logic with exponential backoff, and a Bull Board monitoring dashboard. Retain `node‑cron` for lightweight per‑instance tasks.

**Depends on:** [N/A] — infrastructure task; Redis instance must be provisioned
**Blocks:** All automation and notification tasks (AUTO‑001, AUTO‑FIN‑001, etc.), `infrastructure/DEVOPS.md → SEC‑001`
**Related Files:** `artifacts/api‑server/src/lib/jobs/queues.ts`, `artifacts/api‑server/src/lib/jobs/workers.ts`, `artifacts/api‑server/src/lib/jobs/scheduler.ts`

**Definition of Done**
- [ ] Redis connection configured via `REDIS_URL` environment variable; validated at startup
- [ ] BullMQ `Queue` instances created for: `emails`, `notifications`, `reports`, `sync`, `automation`
- [ ] `Worker` processes defined for each queue with concurrency controls and error handling
- [ ] Workers process jobs asynchronously; failures logged and retried up to 5 attempts with exponential backoff
- [ ] Repeatable jobs configured for scheduled tasks: daily cleanup, hourly sync, weekly reports
- [ ] Job progress reporting enabled for long‑running jobs (reports, bulk operations)
- [ ] Failed jobs stored in the queue for manual inspection (not automatically removed)
- [ ] Bull Board dashboard mounted at `/admin/queues` (admin‑only, behind auth middleware)
- [ ] Graceful shutdown: workers drain active jobs before process exit
- [ ] `node‑cron` retained for lightweight per‑instance tasks: log rotation, temp file cleanup, cache warming
- [ ] Unit tests verify job enqueuing, processing, and retry behaviour
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Redis cluster/sentinel configuration (single Redis instance is sufficient for initial production)
- Dead‑letter queue and advanced failure handling
- Job prioritisation beyond BullMQ’s built‑in priority queues

**Rules to Follow**
- All job handlers must be idempotent — BullMQ may deliver a job more than once (at‑least‑once delivery)
- Use `removeOnComplete: true` and `removeOnFail: false` — keep failed jobs for debugging
- Concurrency per worker must be configured based on job type (emails: 5, reports: 2, sync: 1)
- `node‑cron` must not be used for jobs that require exactly‑once execution across a cluster
- Graceful shutdown must drain active jobs within a configurable timeout (default 30 seconds)

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- jobs/
curl http://localhost:8081/admin/queues
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Background jobs are application‑layer infrastructure; they orchestrate domain services but do not own domain logic.
- TDD: Write unit tests for job handlers with mocked external dependencies; test retry and failure behaviour.
- BDD: “As a system administrator, I can monitor all background jobs from a dashboard and manually retry failed jobs.”
- Deep Module: `enqueueJob(queue, name, data)` hides BullMQ API complexity, Redis connection management, and retry configuration.

---

### Subtasks
- [ ] JOB‑INFRA‑001.0.25 (AGENT): Read the entire task and research BullMQ API, Redis connection patterns, and Bull Board dashboard setup. *No action — pause.*
- [ ] JOB‑INFRA‑001.0.5 (AGENT): Research BullMQ v5 API changes, `ioredis` connection pooling, and `node‑cron` vs BullMQ trade‑offs. *Document findings briefly.*
- [ ] JOB‑INFRA‑001.1 (AGENT): Implement Redis connection manager and BullMQ queue definitions.
  **File(s):** `artifacts/api‑server/src/lib/jobs/queues.ts`
  **Verification:** `pnpm run typecheck` passes; queues can be initialised.
- [ ] JOB‑INFRA‑001.2 (AGENT): Implement workers for each queue with concurrency, retry, and error handling.
  **File(s):** `artifacts/api‑server/src/lib/jobs/workers.ts`
  **Verification:** Unit tests verify workers process jobs and retry on failure.
- [ ] JOB‑INFRA‑001.3 (AGENT): Implement repeatable job scheduler and graceful shutdown.
  **File(s):** `artifacts/api‑server/src/lib/jobs/scheduler.ts`
  **Verification:** Repeatable jobs fire on schedule; shutdown drains active jobs.
- [ ] JOB‑INFRA‑001.4 (AGENT): Mount Bull Board dashboard at `/admin/queues` with admin auth.
  **File(s):** `artifacts/api‑server/src/lib/jobs/bull‑board.ts`
  **Verification:** Dashboard accessible; all queues visible.
- [ ] JOB‑INFRA‑001.5 (AGENT): Retain `node‑cron` for lightweight per‑instance tasks; document usage criteria.
  **File(s):** `artifacts/api‑server/src/lib/jobs/cron‑jobs.ts`
  **Verification:** Lightweight tasks run on schedule.
- [ ] JOB‑INFRA‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DOCKER‑001: Docker & Deployment Configuration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Docker configuration exists. The application has no containerization, no Dockerfiles, and no `docker‑compose.yml` for local or production orchestration.
**Size:** Medium

**Description:** Create production‑grade Dockerfiles for the API server and frontend application, a `docker‑compose.yml` for local development that includes PostgreSQL, Redis, and the application services, and a deployment configuration that supports environment‑specific overrides and health checks.

**Depends on:** `infrastructure/DEVOPS.md → BUILD‑001`, `DB‑MIGRATE‑001`, `CI‑001`
**Blocks:** Any production deployment, `infrastructure/SECURITY.md → SEC‑004`, `MON‑001`
**Related Files:** `Dockerfile.api`, `Dockerfile.web`, `docker‑compose.yml`, `.dockerignore`

**Definition of Done**
- [ ] `Dockerfile.api`: multi‑stage build for the Express API server; non‑root user; `HEALTHCHECK` configured
- [ ] `Dockerfile.web`: multi‑stage build for the Vite/React frontend; served via `nginx:alpine` or Node.js static server
- [ ] `.dockerignore` excludes `node_modules`, `.git`, `dist`, test files, and environment files
- [ ] `docker‑compose.yml` includes services: `postgres`, `redis`, `api‑server`, `web` with persistent volumes
- [ ] Database migrations run automatically on API server startup in development mode
- [ ] `pnpm docker:up` starts all services; `pnpm docker:down` tears them down
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Kubernetes manifests (future phase)
- Cloud‑specific deployment configuration (AWS ECS, GCP Cloud Run)
- Secrets management (`.env` file in development; vault integration in future phase)

**Rules to Follow**
- API server Docker image must run as non‑root user (`node`) — never as root
- `.dockerignore` must exclude `node_modules` to prevent host `node_modules` leakage into the image
- All environment variables for production must be passed at runtime, not baked into the image
- Docker Compose volumes must be named for data persistence

**Verification**
```bash
docker build -f Dockerfile.api -t apex‑api:latest .
docker build -f Dockerfile.web -t apex‑web:latest .
docker compose up -d
curl http://localhost:8081/api/healthz
docker compose down
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/deployment.
- BDD: “As a developer, I can spin up the entire application stack locally with a single `docker compose up` command.”

---

### Subtasks
- [ ] DOCKER‑001.0.25 (AGENT): Read the entire task and inspect the monorepo structure to understand build outputs and dependency graph. *No action — pause.*
- [ ] DOCKER‑001.0.5 (AGENT): Research Docker multi‑stage builds for pnpm monorepos, `node:22‑alpine` image, and nginx static file serving. *Document findings briefly.*
- [ ] DOCKER‑001.1 (AGENT): Create `Dockerfile.api` with multi‑stage build, non‑root user, and health check.
  **File(s):** `Dockerfile.api`
  **Verification:** `docker build -f Dockerfile.api -t apex‑api:latest .` succeeds.
- [ ] DOCKER‑001.2 (AGENT): Create `Dockerfile.web` with multi‑stage build and nginx static serving.
  **File(s):** `Dockerfile.web`
  **Verification:** `docker build -f Dockerfile.web -t apex‑web:latest .` succeeds.
- [ ] DOCKER‑001.3 (AGENT): Create `.dockerignore` and `docker‑compose.yml` with PostgreSQL, Redis, API, and web services.
  **File(s):** `.dockerignore`, `docker‑compose.yml`
  **Verification:** `docker compose up -d` starts all services; `docker compose down` tears them down.
- [ ] DOCKER‑001.4 (AGENT): Add Docker scripts to root `package.json`: `docker:up`, `docker:down`, `docker:build`.
  **File(s):** root `package.json`
  **Verification:** `pnpm docker:up` and `pnpm docker:down` work correctly.
- [ ] DOCKER‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DEP‑002: Phase 3–5 External Dependency Coordination
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Multiple Phase 3–5 tasks require external libraries (`csv‑parse`, `csv‑stringify`, `multer`, `lru‑cache`, `date‑fns`, `react‑dropzone`, `diff`, `rrule`, `node‑cron`, `bullmq`, etc.) that are not yet in the workspace catalog.
**Size:** Small

**Description:** Coordinate the addition of all Phase 3–5 external dependencies to the pnpm workspace catalog, ensuring compatible versions and resolving any peer‑dependency conflicts. This unblocks all Phase 3–5 API and frontend integration tasks.

**Depends on:** Phase 3–5 API specifications (the `TODO‑P3-*` and `TODO‑P5-*` files define the required packages)
**Blocks:** All Phase 3+ and frontend integration tasks
**Related Files:** `pnpm‑workspace.yaml`

**Definition of Done**
- [ ] All required packages added to `catalog:` section of `pnpm‑workspace.yaml` with pinned semver ranges
- [ ] `pnpm install --frozen‑lockfile` succeeds with zero peer‑dependency warnings
- [ ] `pnpm run typecheck` passes with no new errors

**Verification**
```bash
pnpm install --frozen‑lockfile
pnpm run typecheck
```

---

### Subtasks
- [ ] DEP‑002.0.25 (AGENT): Compile a complete list of required dependencies from Phase 3–5 task descriptions. *No action — pause.*
- [ ] DEP‑002.0.5 (AGENT): Research latest stable versions of each required package (as of May 2026). *Document findings briefly.*
- [ ] DEP‑002.1 (AGENT): Add all dependencies to the workspace catalog in `pnpm‑workspace.yaml`.
  **File(s):** `pnpm‑workspace.yaml`
  **Verification:** `pnpm install --frozen‑lockfile` succeeds; `pnpm typecheck` passes.
- [ ] DEP‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] ESLINT‑001: ESLint Configuration and CI Enforcement
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No ESLint configuration exists. Code quality is enforced only by TypeScript strictness and Prettier formatting. ESLint will catch additional runtime bugs and enforce consistent coding standards.
**Size:** Small

**Description:** Configure ESLint with the TypeScript‑recommended rule set, Prettier integration, and import order rules. Add a `lint` script to all workspaces and enforce lint checks in the CI pipeline.

**Depends on:** `foundation/TOOLING.md → TOOLING‑002`
**Blocks:** Code quality enforcement across all phases
**Related Files:** `.eslintrc.cjs` (root), workspace `package.json` files, `.github/workflows/ci.yml`

**Definition of Done**
- [ ] Root `.eslintrc.cjs` (or `.eslintrc.js`) configured with:
  - `@typescript‑eslint/recommended`
  - `plugin:prettier/recommended`
  - Import order rule (`simple‑import‑sort`)
- [ ] All workspaces have a `"lint": "eslint src/"` script
- [ ] CI pipeline runs `pnpm lint`; fails on any warning or error
- [ ] Existing codebase passes all lint rules (no warnings or errors)
- [ ] `pnpm run typecheck` passes

**Verification**
```bash
pnpm lint
pnpm run typecheck
```

---

### Subtasks
- [ ] ESLINT‑001.0.25 (AGENT): Research ESLint flat config vs. legacy config and choose appropriate approach. *Document findings briefly.*
- [ ] ESLINT‑001.1 (AGENT): Install ESLint and related plugins; create root config.
  **File(s):** `.eslintrc.cjs`, root `package.json`
  **Verification:** `pnpm lint` runs; `pnpm typecheck` passes.
- [ ] ESLINT‑001.2 (AGENT): Add `lint` scripts to all workspace `package.json` files.
  **Verification:** `pnpm lint` from root succeeds with zero errors.
- [ ] ESLINT‑001.3 (AGENT): Add lint step to CI pipeline.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** CI fails on lint errors.
- [ ] ESLINT‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.