# TODO-P6-FOUNDATION.md – Phase 6: Infrastructure & Tooling

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

# Phase 6 – Production Readiness & DevOps (Foundation & Tooling)

*This section addresses infrastructure and tooling requirements for secure, reliable deployment. Every task incorporates explicit dependencies, verification commands, and clear entry/exit criteria.*

---

## Phase 6 Task Index (Foundation & Tooling)

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
- Rollback strategy documented in `docs/adr/002‑migration‑strategy.md`.  
**Related Files:** `lib/db/package.json`, `lib/db/migrations/`, `docs/adr/002‑migration‑strategy.md`

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
- [ ] TOOLING‑005.5: Document rollback strategy in `docs/adr/002‑migration‑strategy.md`. (AGENT)  
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
**Related Files:** `.github/workflows/build‑and‑push.yml`

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

*End of Phase 6 Foundation & Tooling section. Continue with TODO-P6-SECURITY.md for security and monitoring tasks.*
