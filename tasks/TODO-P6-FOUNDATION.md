# TODO-P6-FOUNDATION.md – Phase 6: Foundation & Tooling

This file covers the foundational tooling and infrastructure tasks required to prepare the Apex OS monorepo for production deployment. These tasks establish the CI/CD pipeline, build optimization, database migration strategy, background job processing, and containerization — all prerequisites for the security, monitoring, and advanced feature work in the rest of Phase 6.

---

## Phase 6 Foundation Task Index

- [ ] CI‑001 – CI/CD Pipeline with GitHub Actions
- [ ] BUILD‑001 – Production Build Optimization
- [ ] DB‑MIGRATE‑001 – Database Migration Strategy (Production)
- [ ] JOB‑INFRA‑001 – Background Job Infrastructure
- [ ] DOCKER‑001 – Docker & Deployment Configuration

---

## [ ] CI‑001: CI/CD Pipeline with GitHub Actions
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No CI/CD pipeline exists. All quality checks (lint, typecheck, test) run manually or not at all. As of May 2026, monorepo CI best practice for pnpm workspaces uses GitHub Actions with parallel jobs for lint, typecheck, and test, with `--filter` for change‑based execution to keep PR checks fast. Code quality gates should be enforced as "rules that cannot be merged if they fail" — running lint, typecheck, and unit test as a required sequence.
**Size:** Medium

**Description:** Set up a comprehensive GitHub Actions CI/CD pipeline that runs linting, type checking, and testing on every pull request and push to main, with change‑based filtering for monorepo efficiency, frozen lockfile validation, and optional Turborepo caching for build acceleration.

**Depends on:** TOOLING‑002 (strict TypeScript flags), DEP‑001 (dependencies catalog), TEST‑INFRA‑001 (test infrastructure)
**Blocks:** SEC‑001 (rate limiting), OPPORTUNITY‑002 (SAST/DAST), all Phase 6 deployment tasks
**Related Files:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `turbo.json` (optional)

**Imports / Exports**
- Imports: [N/A] — CI configuration files
- Exports: [N/A] — CI pipeline is infrastructure, not a code module

**Definition of Done**
- [ ] `.github/workflows/ci.yml` created with PR validation workflow triggered on `pull_request` and `push` to `main`
- [ ] CI workflow includes four parallel jobs: `lint`, `typecheck`, `test`, and `build`
- [ ] `lint` job: runs `pnpm lint` (or `pnpm --filter "...[origin/main]" lint` for change‑based execution)
- [ ] `typecheck` job: runs `pnpm typecheck` across all workspaces; fails if any TypeScript errors are present
- [ ] `test` job: runs `pnpm test` with Vitest; uploads coverage report as artifact
- [ ] `build` job: runs `pnpm build` to verify production builds succeed
- [ ] `--frozen-lockfile` enforced on every `pnpm install` in CI
- [ ] PR comments or status checks clearly indicate which job failed and why
- [ ] Optional: `turbo.json` configured for Turborepo caching of lint/typecheck/test/build
- [ ] Manual trigger (`workflow_dispatch`) for full‑suite runs against any branch
- [ ] CI pipeline completes in under 10 minutes for a typical PR

**Out of Scope**
- Deployment to production (separate `deploy.yml` workflow — DOCKER‑001)
- SAST/DAST security scanning (OPPORTUNITY‑002)
- End‑to‑end Playwright tests in CI (E2E‑001 in Phase 5)
- Discord/Slack notifications (future enhancement)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets, `DATABASE_URL`, API keys
- CI workflow must never expose secrets in logs — use `${{ secrets.X }}` exclusively
- Never run `drizzle-kit push` in CI without explicit human approval

**Output Artifacts**
- Configuration changes in: `.github/workflows/ci.yml`, `turbo.json` (optional)
- Tests added/updated in: [N/A] — CI pipeline is verified by successful runs
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `.github/workflows/ci.yml`; no persistent state
- Halt condition: if CI pipeline times out on every run, stop and implement change‑based filtering before proceeding

**Rules to Follow**
- CI pipeline must use `pnpm install --frozen-lockfile` to ensure reproducible installs across all environments
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

# Verify all checks pass
gh pr checks
```

**Advanced Code Patterns**
- Change‑based filtering: `pnpm --filter "...[origin/main]" lint` — runs lint only on packages with changes vs main
- Turborepo caching: `turbo.json` with `"cache": true` for `lint`, `typecheck`, `test`, `build` tasks
- Parallel job splitting: lint, typecheck, test, and build as separate `jobs` in GitHub Actions for independent failure isolation
- Coverage artifact upload: `actions/upload-artifact@v4` for test coverage reports

**Anti‑Patterns**
- Running all CI checks in a single sequential job — failures are harder to diagnose and parallelism is lost
- Using `pnpm install` without `--frozen-lockfile` — causes CI‑only installs to differ from local development
- Long‑running CI (>15 minutes) causes developers to bypass checks — always aim for sub‑10‑minute pipelines
- Running full‑suite on every PR without change‑based filtering — wastes CI minutes and delays feedback
- Skipping the build step — typecheck alone does not guarantee the app will bundle correctly

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/DevOps, not a domain concern
- TDD: CI pipeline enforces that all tests pass; it is the automated TDD gate
- BDD: [N/A] — infrastructure concern
- Deep Module: [N/A] — CI configuration is intentionally shallow; complexity lives in individual tool configurations

---

### Subtasks
- [ ] CI‑001.0.25 (AGENT): Read the entire task and inspect the current monorepo structure, existing scripts in root `package.json`, and any existing `.github/` directory.
  *No action — pause until fully understood.*

- [ ] CI‑001.0.5 (AGENT): Research GitHub Actions best practices for pnpm monorepos, `--filter` change‑based execution, and Turborepo caching (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] CI‑001.0.75 (AGENT): Reason about whether Turborepo is warranted at this stage or if `pnpm --filter` is sufficient. Confirm with user.
  *If uncertain, start with `pnpm --filter` and add Turborepo later.*

- [ ] CI‑001.1 (AGENT): Create `.github/workflows/ci.yml` with parallel lint, typecheck, test, and build jobs.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** Push a test commit and verify all four jobs run and pass in GitHub Actions.

- [ ] CI‑001.2 (AGENT): Add `--frozen-lockfile` enforcement to the install step.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** A PR with a changed lockfile without `pnpm install --frozen-lockfile` update fails CI.

- [ ] CI‑001.3 (AGENT): Configure change‑based filtering using `pnpm --filter "...[origin/main]"` or Turborepo.
  **File(s):** `.github/workflows/ci.yml`, `turbo.json` (if using Turborepo)
  **Verification:** A PR that only changes a single app runs CI only for that app and its dependencies.

- [ ] CI‑001.4 (AGENT): Add test coverage artifact upload.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** Coverage report downloadable from GitHub Actions run summary.

- [ ] CI‑001.N (HUMAN): Final review and sign‑off. Verify CI pipeline on a real PR.
  **Verification:** Approved.

---

## [ ] BUILD‑001: Production Build Optimization
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The monorepo has no build orchestration; each workspace package builds independently with no caching between steps. As of 2026, TypeScript project references (`tsconfig.json` `references`) combined with `tsgo -b` (TypeScript 7's native compiler) can reduce monorepo declaration generation times by 3x to 8x. Teams with 50+ packages report declaration-generation speedups of 3x–8x using isolated declarations. For smaller monorepos, Turborepo with remote caching is the fastest path to CI acceleration.
**Size:** Medium

**Description:** Optimise the monorepo build pipeline by configuring TypeScript project references for incremental builds, adding Turborepo for task orchestration and caching, enabling isolated declarations where supported, and establishing a single `pnpm build` command that produces production artifacts for all workspaces in dependency order.

**Depends on:** TOOLING‑002 (strict TypeScript flags), CI‑001 (CI pipeline)
**Blocks:** DOCKER‑001 (Docker builds depend on optimised production builds), all deployment tasks
**Related Files:** `tsconfig.base.json`, `turbo.json`, `package.json` (root), workspace `tsconfig.json` files

**Imports / Exports**
- Imports: [N/A] — build configuration files
- Exports: [N/A] — infrastructure configuration

**Definition of Done**
- [ ] Root `package.json` has a `"build": "turbo build"` script (or `pnpm -r build` if not using Turborepo)
- [ ] `turbo.json` configured with pipeline definitions for `build`, `lint`, `typecheck`, `test`
- [ ] TypeScript project references wired between dependent packages (e.g., `lib/db` referenced by `artifacts/api-server`)
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

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never modify: `.replit` configuration
- Never commit: `.env*`, credentials, secrets
- Do not change `package.json` `"main"` or `"exports"` fields without verifying they don't break imports in consuming packages

**Output Artifacts**
- Configuration changes in: `turbo.json`, `tsconfig.base.json`, workspace `tsconfig.json` files, root `package.json`
- Tests added/updated in: [N/A] — build verification is via `pnpm build` + `pnpm typecheck`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — revert `turbo.json`, `tsconfig.base.json`, and workspace `tsconfig.json` changes; remove `turbo` from devDependencies
- Halt condition: if `pnpm build` produces different output than the unoptimized build, stop and compare build artifacts before proceeding

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

# Verify second build is cached (should complete near-instantly)
time pnpm build

# Typecheck after build
pnpm typecheck

# Verify individual workspace builds still work
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/apex-os build
```

**Advanced Code Patterns**
- TypeScript project references: `"references": [{ "path": "../lib/db" }]` in consuming package's `tsconfig.json`; `"composite": true` in referenced package
- Turborepo pipeline: `"build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] }` — builds dependencies first
- Isolated declarations: TypeScript 5.8+ feature that parallelises declaration generation; enable with `"isolatedDeclarations": true`
- `tsgo -b`: TypeScript 7 native compiler with built‑in incremental builds — future migration target

**Anti‑Patterns**
- Circular project references — TypeScript will reject them; always maintain a DAG
- Building all packages sequentially without caching — wastes CI minutes and developer time
- Skipping `composite: true` on referenced packages — required for project references to function
- Using relative imports across package boundaries instead of workspace package names — breaks build isolation

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/tooling, not a domain concern
- TDD: [N/A] — build optimization is verified by `pnpm build` and `pnpm typecheck`
- BDD: [N/A] — infrastructure concern
- Deep Module: [N/A] — build configuration is intentionally shallow

---

### Subtasks
- [ ] BUILD‑001.0.25 (AGENT): Read the entire task, inspect current `tsconfig.base.json`, workspace `tsconfig.json` files, and root `package.json` build scripts.
  *No action — pause until fully understood.*

- [ ] BUILD‑001.0.5 (AGENT): Research TypeScript 5.8+ isolated declarations, project references configuration, and Turborepo v2 caching (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] BUILD‑001.0.75 (AGENT): Reason about the dependency graph between workspace packages. Map out which packages depend on which, and verify no circular dependencies exist.
  *If the dependency graph is unclear, trace imports before designing project references.*

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
  **File(s):** [N/A] — inspection
  **Verification:** `pnpm build` output directories inspected; no `.ts` source files, no test files, no devDependencies.

- [ ] BUILD‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] DB‑MIGRATE‑001: Database Migration Strategy (Production)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** The project exclusively uses `drizzle-kit push` for schema changes — a rapid local iteration tool that is not safe for production. `drizzle-kit push` does not generate auditable SQL migration files and cannot be rolled back. As of 2026, `drizzle-kit generate` + `drizzle-kit migrate` is the recommended production path: `generate` produces versioned SQL migration files from schema changes, and `migrate` applies them in order against the target database. The two‑path approach (push for development, generate/migrate for production) is the standard recommendation.
**Size:** Large

**Description:** Replace the `drizzle-kit push` development workflow with a proper production migration strategy using `drizzle-kit generate` to create versioned SQL migration files and `drizzle-kit migrate` to apply them. Add migration scripts to the CI/CD pipeline, implement migration verification and drift detection, and document the production migration workflow.

**Depends on:** DB‑ORG‑001 (organizations schema), DB‑IDENTITY‑001 (users schema), all Phase 2 schema tasks
**Blocks:** DOCKER‑001 (Docker deployment includes migration step), any production deployment
**Related Files:** `lib/db/drizzle.config.ts`, `lib/db/package.json`, `lib/db/src/migrations/`, `.github/workflows/ci.yml`

**Imports / Exports**
- Imports: `drizzle-orm`, `drizzle-kit`, `pg` (PostgreSQL client)
- Exports: Migration runner, migration verification utilities

**Definition of Done**
- [ ] `lib/db/package.json` updated with scripts: `db:generate`, `db:migrate`, `db:push` (retained for local dev only)
- [ ] `drizzle-kit generate` produces versioned SQL migration files in `lib/db/src/migrations/`
- [ ] `drizzle-kit migrate` applies pending migrations in order against the target database
- [ ] Migration runner is programmatic (not CLI‑only) so it can be called from application startup or CI
- [ ] Migration tracking table (`__drizzle_migrations` or similar) exists to prevent re‑applying migrations
- [ ] CI pipeline includes a migration drift check: `drizzle-kit generate` run in CI, fails if uncommitted migrations are detected
- [ ] Local development continues to use `drizzle-kit push` for rapid iteration
- [ ] Production deployments run `drizzle-kit migrate` as part of the deployment pipeline
- [ ] Rollback documentation: each migration file has a corresponding down‑migration documented (manual, not automatic)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Automatic rollback of failed migrations (manual rollback with documented down‑migration scripts)
- Zero‑downtime migration patterns (expand/contract pattern) — deferred to Phase 8+
- Point‑in‑time recovery configuration
- Database backup automation (separate infrastructure task)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `DATABASE_URL`, database credentials
- Never run `drizzle-kit migrate` against production without explicit human approval
- Never delete migration files once they have been applied to any environment

**Output Artifacts**
- Code changes in: `lib/db/package.json`, `lib/db/drizzle.config.ts`, `lib/db/src/migrations/` (new directory)
- Documentation: Migration workflow documentation in `docs/database-migrations.md`
- Migration files: `lib/db/src/migrations/0000_initial.sql`, `0001_*.sql`, etc.

**Rollback**
- Granularity: migration‑level — each migration has a documented down‑migration SQL script
- Halt condition: if `drizzle-kit generate` produces schema drift (differences between actual DB and schema definition), stop and reconcile before proceeding

**Rules to Follow**
- `drizzle-kit push` must never be used in CI or against production — it is for local development only
- Migration files are append‑only — never modify or delete an existing migration after it has been applied
- Migration tracking table is managed by `drizzle‑kit` automatically; never modify it manually
- Each migration must be tested against a clone of the production schema before deployment
- CI must detect uncommitted migrations: `drizzle-kit generate` → `git diff --exit-code` on the migrations directory

**Verification**
```bash
# Generate migrations from current schema
pnpm --filter @workspace/db run db:generate

# Apply migrations to local dev DB
pnpm --filter @workspace/db run db:migrate

# Check for migration drift in CI
pnpm --filter @workspace/db run db:generate
git diff --exit-code lib/db/src/migrations/

# Verify migration tracking table exists
psql $DATABASE_URL -c "SELECT * FROM __drizzle_migrations;"
```

**Advanced Code Patterns**
- Programmatic migration runner: `import { migrate } from 'drizzle-orm/node-postgres/migrator'; await migrate(db, { migrationsFolder: './src/migrations' })` — called from application startup
- CI drift detection: run `drizzle-kit generate` in CI; if any `.sql` files are created/modified, fail the build with "Uncommitted migration detected"
- Two‑path strategy: `push` for development (fast, no files), `generate`/`migrate` for staging/production (auditable, version‑controlled)

**Anti‑Patterns**
- Using `drizzle-kit push` in production — no audit trail and no rollback capability
- Modifying applied migration files — breaks the migration ledger and causes inconsistencies across environments
- Skipping the CI drift check — allows schema changes to reach production without corresponding migration files
- Manually applying SQL to production without going through the migration system

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — database infrastructure, not a domain concern
- TDD: Migration verification tests: apply migrations to a test DB, verify schema matches Drizzle definitions
- BDD: [N/A] — infrastructure concern
- Deep Module: [N/A] — migration strategy is intentionally explicit and auditable

---

### Subtasks
- [ ] DB‑MIGRATE‑001.0.25 (AGENT): Read the entire task and inspect the current `drizzle.config.ts`, `package.json` db scripts, and existing migration state.
  *No action — pause until fully understood.*

- [ ] DB‑MIGRATE‑001.0.5 (AGENT): Research `drizzle-kit generate` and `drizzle-kit migrate` vs `push` trade‑offs, and CI drift detection patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] DB‑MIGRATE‑001.0.75 (AGENT): Reason about initial migration strategy: generate one baseline migration from current schema state, or rebuild migrations from scratch. Confirm with user.
  *If uncertain, prefer baseline migration from current schema state.*

- [ ] DB‑MIGRATE‑001.1 (AGENT): Update `lib/db/package.json` scripts: add `db:generate` and `db:migrate`; retain `db:push` for local dev.
  **File(s):** `lib/db/package.json`
  **Verification:** `pnpm --filter @workspace/db run db:generate` produces migration files.

- [ ] DB‑MIGRATE‑001.2 (AGENT): Generate baseline migration from current schema and add programmatic migration runner.
  **File(s):** `lib/db/src/migrations/`, `lib/db/src/migrate.ts`
  **Verification:** `pnpm --filter @workspace/db run db:migrate` applies migrations successfully.

- [ ] DB‑MIGRATE‑001.3 (AGENT): Add CI drift detection step to GitHub Actions workflow.
  **File(s):** `.github/workflows/ci.yml`
  **Verification:** Uncommitted schema changes fail CI.

- [ ] DB‑MIGRATE‑001.4 (AGENT): Document migration workflow in `docs/database-migrations.md`.
  **File(s):** `docs/database-migrations.md`
  **Verification:** Document covers generate, migrate, rollback, and CI drift detection.

- [ ] DB‑MIGRATE‑001.N (HUMAN): Final review and sign‑off. Verify migration workflow end‑to‑end on a staging database.
  **Verification:** Approved.

---

## [ ] JOB‑INFRA‑001: Background Job Infrastructure
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The API server has no background job processing capability. All work executes synchronously in the HTTP request/response cycle. As of 2026, the recommended architecture splits background work into two tiers: `node-cron` for per‑instance lightweight scheduled tasks (cleanup, health checks) and BullMQ (Redis‑backed) for anything that must run exactly once across a cluster, survive restarts, and support retries with exponential backoff. BullMQ is the successor to Bull and is the preferred choice for new projects.
**Size:** Large

**Description:** Implement a production‑grade background job infrastructure using BullMQ with Redis as the message broker, covering job queues, workers, repeatable scheduled jobs, retry logic with exponential backoff, and a Bull Board monitoring dashboard. For lightweight per‑instance tasks that do not require durability, retain `node-cron` as a simpler alternative.

**Depends on:** [N/A] — infrastructure task; Redis instance must be provisioned
**Blocks:** AUTO‑001 (reminder sequences), AUTO‑FIN‑001 (payment run scheduling), AUTO‑PROJ‑003 (recurring work generation), all automation and notification tasks
**Related Files:** `artifacts/api-server/src/lib/jobs/`, `artifacts/api-server/src/lib/jobs/queues.ts`, `artifacts/api-server/src/lib/jobs/workers.ts`, `artifacts/api-server/src/lib/jobs/scheduler.ts`

**Imports / Exports**
- Imports: `bullmq` (Queue, Worker, QueueScheduler), `ioredis` (Redis client), `express` (for Bull Board UI)
- Exports: `createQueue(name, opts)`, `enqueueJob(queue, name, data, opts)`, `startWorkers()`, `startSchedulers()`; queue instances: `emailQueue`, `notificationQueue`, `reportQueue`, `syncQueue`

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
- [ ] `node-cron` retained for lightweight per‑instance tasks: log rotation, temp file cleanup, cache warming
- [ ] Unit tests verify job enqueuing, processing, and retry behaviour
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Redis cluster/sentinel configuration (single Redis instance is sufficient for initial production)
- Dead‑letter queue and advanced failure handling
- Job prioritisation beyond BullMQ's built‑in priority queues
- Kafka/RabbitMQ integration (BullMQ is sufficient for the MVP‑scale architecture)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `REDIS_URL`, Redis credentials
- Never commit job data containing PII to Redis without encryption
- Never expose the Bull Board dashboard without admin authentication

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/jobs/queues.ts`, `workers.ts`, `scheduler.ts`, `bull-board.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/lib/jobs/`
- Documentation: [N/A]
- Migration files: [N/A] — Redis is schema‑less

**Rollback**
- Granularity: function‑level — disable background workers via feature flag; HTTP endpoints work synchronously as before
- Halt condition: if Redis is unreachable and jobs are silently lost, stop and implement startup validation that fails fast if `REDIS_URL` is configured but Redis is not reachable

**Rules to Follow**
- All job handlers must be idempotent — BullMQ may deliver a job more than once (at‑least‑once delivery)
- Use `removeOnComplete: true` and `removeOnFail: false` — keep failed jobs for debugging, clean up successes
- Concurrency per worker must be configured based on job type (emails: 5, reports: 2, sync: 1)
- `node-cron` must not be used for jobs that require exactly‑once execution across a cluster
- All BullMQ jobs must use the shared Redis connection (not create per‑job connections)
- Graceful shutdown must drain active jobs within a configurable timeout (default 30 seconds)

**Verification**
```bash
# Run job infrastructure unit tests
pnpm --filter @workspace/api-server test -- jobs/

# Start API server and verify Bull Board dashboard
curl http://localhost:8081/admin/queues

# Enqueue a test job and verify it processes
curl -X POST http://localhost:8081/api/test/enqueue-job
```

**Advanced Code Patterns**
- BullMQ repeatable jobs: `queue.add('job-name', data, { repeat: { pattern: '0 2 * * *' }, jobId: 'unique-job-id' })` — `jobId` prevents duplicates
- Shared Redis connection: create a single `IORedis` instance and pass it to all `Queue` and `Worker` constructors
- Bull Board integration: `createBullBoard({ queues: [new BullMQAdapter(queue)], serverAdapter }).getRouter()` — mounted on Express
- Graceful shutdown: `await worker.close(); await queue.close(); await redis.quit()`

**Anti‑Patterns**
- Using `node-cron` for jobs that must run exactly once in a multi‑instance cluster — each instance fires independently
- Not configuring `jobId` on repeatable jobs — creates duplicate schedule entries on restart
- Auto‑removing failed jobs — lose visibility into production failures; always keep failed jobs for debugging
- Creating Redis connections per queue — causes connection exhaustion under load

**DDD / TDD / BDD / Deep Module notes**
- DDD: Background jobs are application‑layer infrastructure; they orchestrate domain services but do not own domain logic
- TDD: Write unit tests for job handlers with mocked external dependencies; test retry and failure behaviour
- BDD: "As a system administrator, I can monitor all background jobs from a dashboard and manually retry failed jobs."
- Deep Module: `enqueueJob(queue, name, data)` hides BullMQ API complexity, Redis connection management, and retry configuration behind a simple interface

---

### Subtasks
- [ ] JOB‑INFRA‑001.0.25 (AGENT): Read the entire task and research BullMQ API, Redis connection patterns, and Bull Board dashboard setup.
  *No action — pause until fully understood.*

- [ ] JOB‑INFRA‑001.0.5 (AGENT): Research BullMQ v5 API changes, `ioredis` connection pooling, and `node-cron` vs BullMQ trade‑offs for per‑instance tasks (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] JOB‑INFRA‑001.0.75 (AGENT): Reason about queue design — how many queues are needed and what concurrency each requires. Confirm with user.
  *If uncertain, propose a queue list with rationale.*

- [ ] JOB‑INFRA‑001.1 (AGENT): Implement Redis connection manager and BullMQ queue definitions.
  **File(s):** `artifacts/api-server/src/lib/jobs/queues.ts`
  **Verification:** `pnpm run typecheck` passes; queues can be initialised.

- [ ] JOB‑INFRA‑001.2 (AGENT): Implement workers for each queue with concurrency, retry, and error handling.
  **File(s):** `artifacts/api-server/src/lib/jobs/workers.ts`
  **Verification:** Unit tests verify workers process jobs and retry on failure.

- [ ] JOB‑INFRA‑001.3 (AGENT): Implement repeatable job scheduler and graceful shutdown.
  **File(s):** `artifacts/api-server/src/lib/jobs/scheduler.ts`
  **Verification:** Repeatable jobs fire on schedule; shutdown drains active jobs.

- [ ] JOB‑INFRA‑001.4 (AGENT): Mount Bull Board dashboard at `/admin/queues` with admin auth.
  **File(s):** `artifacts/api-server/src/lib/jobs/bull-board.ts`
  **Verification:** Dashboard accessible; all queues visible.

- [ ] JOB‑INFRA‑001.5 (AGENT): Retain `node-cron` for lightweight per‑instance tasks; document usage criteria.
  **File(s):** `artifacts/api-server/src/lib/jobs/cron-jobs.ts`
  **Verification:** Lightweight tasks run on schedule; documented criteria for choosing node-cron vs BullMQ.

- [ ] JOB‑INFRA‑001.N (HUMAN): Final review and sign‑off. Verify job enqueuing, processing, and monitoring end‑to‑end.
  **Verification:** Approved.

---

## [ ] DOCKER‑001: Docker & Deployment Configuration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Docker configuration exists. The application has no containerization, no Dockerfiles, and no `docker-compose.yml` for local or production orchestration. As of 2026, Docker best practices for Node.js/Express applications include multi‑stage builds, running as non‑root user, health checks, logging to stdout/stderr, and using `.dockerignore` to exclude unnecessary files. Production images should be slim (using `node:22-alpine` or similar) and include only production dependencies.
**Size:** Medium

**Description:** Create production‑grade Dockerfiles for the API server and frontend application, a `docker-compose.yml` for local development that includes PostgreSQL, Redis, and the application services, and a deployment configuration that supports environment‑specific overrides and health checks.

**Depends on:** BUILD‑001 (production build optimization), DB‑MIGRATE‑001 (migration strategy), CI‑001 (CI pipeline)
**Blocks:** Any production deployment, SEC‑004 (database SSL in Docker), MON‑001 (health checks)
**Related Files:** `Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml`, `.dockerignore`, `docker/`

**Imports / Exports**
- Imports: [N/A] — Docker configuration files
- Exports: [N/A] — infrastructure configuration

**Definition of Done**
- [ ] `Dockerfile.api`: multi‑stage build for the Express API server
  - Stage 1 (build): installs all dependencies, runs `pnpm build`
  - Stage 2 (production): `node:22-alpine`, non‑root user, only production dependencies
  - `HEALTHCHECK` instruction configured to call `/api/healthz`
- [ ] `Dockerfile.web`: multi‑stage build for the Vite/React frontend
  - Stage 1 (build): installs dependencies, runs `pnpm build`
  - Stage 2 (serve): serves static files via `nginx:alpine` or `node:22-alpine` with a static file server
- [ ] `.dockerignore` excludes `node_modules`, `.git`, `dist`, test files, and environment files
- [ ] `docker-compose.yml` includes services: `postgres`, `redis`, `api-server`, `web`
  - PostgreSQL with persistent volume for development data
  - Redis for BullMQ and caching
  - API server with environment variables sourced from `.env` (not committed)
  - Frontend with proper `VITE_API_URL` configuration
- [ ] Environment‑specific override support via `docker-compose.override.yml` (git‑ignored)
- [ ] `pnpm docker:up` starts all services; `pnpm docker:down` tears them down
- [ ] Database migrations run automatically on API server startup in development mode
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Kubernetes manifests (future phase)
- Cloud‑specific deployment configuration (AWS ECS, GCP Cloud Run)
- CI/CD deployment pipeline (builds on CI‑001)
- Secrets management (`.env` file in development; vault integration in future phase)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, API keys
- Never commit `docker-compose.override.yml` (contains local environment overrides)
- Never include `.env` files or secrets in Docker images (use build args or runtime env vars)

**Output Artifacts**
- Configuration files: `Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml`, `.dockerignore`
- Code changes in: root `package.json` (docker scripts)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete all Docker files; no persistent state changes
- Halt condition: if Docker build fails due to missing dependencies in the production stage, stop and audit `pnpm install --prod` output

**Rules to Follow**
- API server Docker image must run as non‑root user (`node`) — never as root
- `HEALTHCHECK` must use the application's health endpoint, not a simple `curl localhost`
- Production images must be tagged with both `latest` and the git commit SHA
- `.dockerignore` must exclude `node_modules` to prevent host `node_modules` leakage into the image
- All environment variables for production must be passed at runtime, not baked into the image
- Docker Compose volumes must be named for data persistence across container restarts

**Verification**
```bash
# Build API server image
docker build -f Dockerfile.api -t apex-api:latest .

# Build frontend image
docker build -f Dockerfile.web -t apex-web:latest .

# Start all services locally
docker compose up -d

# Verify health check
curl http://localhost:8081/api/healthz

# Verify database migrations ran
docker compose logs api-server | grep -i migration

# Tear down
docker compose down
```

**Advanced Code Patterns**
- Multi‑stage build: `FROM node:22-alpine AS build` → install devDependencies + build → `FROM node:22-alpine AS production` → copy only production artifacts
- `HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8081/api/healthz || exit 1`
- Docker Compose dependency ordering: `depends_on` with `condition: service_healthy` for PostgreSQL before API server starts
- `.dockerignore` pattern: `**/node_modules`, `.git`, `**/dist`, `**/__tests__`, `*.md`, `.env*`

**Anti‑Patterns**
- Running as `root` in the container — security vulnerability
- Copying `node_modules` from the host into the image — platform‑specific binaries break in the container
- Not using `.dockerignore` — bloats the Docker build context and slows builds
- Hard‑coding database URLs or secrets in `docker-compose.yml` — use environment variables
- Missing health checks — orchestrators cannot detect unhealthy containers

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/deployment, not a domain concern
- TDD: [N/A] — verified by successful build and health check
- BDD: "As a developer, I can spin up the entire application stack locally with a single `docker compose up` command."
- Deep Module: [N/A] — Docker configuration is intentionally explicit

---

### Subtasks
- [ ] DOCKER‑001.0.25 (AGENT): Read the entire task and inspect the monorepo structure to understand build outputs and dependency graph.
  *No action — pause until fully understood.*

- [ ] DOCKER‑001.0.5 (AGENT): Research Docker multi‑stage builds for pnpm monorepos, `node:22-alpine` image, and nginx static file serving (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] DOCKER‑001.0.75 (AGENT): Reason about Docker Compose service topology — which services are needed, port mappings, and volume mounts. Confirm with user.
  *If uncertain, propose a topology with rationale.*

- [ ] DOCKER‑001.1 (AGENT): Create `Dockerfile.api` with multi‑stage build, non‑root user, and health check.
  **File(s):** `Dockerfile.api`
  **Verification:** `docker build -f Dockerfile.api -t apex-api:latest .` succeeds; health check passes.

- [ ] DOCKER‑001.2 (AGENT): Create `Dockerfile.web` with multi‑stage build and nginx static serving.
  **File(s):** `Dockerfile.web`
  **Verification:** `docker build -f Dockerfile.web -t apex-web:latest .` succeeds.

- [ ] DOCKER‑001.3 (AGENT): Create `.dockerignore` and `docker-compose.yml` with PostgreSQL, Redis, API, and web services.
  **File(s):** `.dockerignore`, `docker-compose.yml`
  **Verification:** `docker compose up -d` starts all services; `docker compose down` tears them down.

- [ ] DOCKER‑001.4 (AGENT): Add Docker scripts to root `package.json`: `docker:up`, `docker:down`, `docker:build`.
  **File(s):** root `package.json`
  **Verification:** `pnpm docker:up` and `pnpm docker:down` work correctly.

- [ ] DOCKER‑001.N (HUMAN): Final review and sign‑off. Verify full stack runs end‑to‑end in Docker.
  **Verification:** Approved.

---

## Execution Order

```
CI‑001 (CI/CD pipeline) — parallel with BUILD‑001, DB‑MIGRATE‑001
BUILD‑001 (build optimization) — parallel with CI‑001, DB‑MIGRATE‑001
DB‑MIGRATE‑001 (migration strategy) — parallel with CI‑001, BUILD‑001
JOB‑INFRA‑001 (background jobs) — can start after Redis available
DOCKER‑001 (Docker/deployment) — depends on BUILD‑001, DB‑MIGRATE‑001
```

CI‑001, BUILD‑001, and DB‑MIGRATE‑001 can run in parallel. JOB‑INFRA‑001 depends only on Redis availability. DOCKER‑001 should run after BUILD‑001 and DB‑MIGRATE‑001 are complete, as it depends on optimized builds and the migration runner.

---

*End of Phase 6 Foundation & Tooling*