# TODO-P0-TOOLING.md – Phase 0: Development Tooling

This document contains tooling and infrastructure tasks that enable development workflow and code quality. These can run in parallel with other waves.

---

## [ ] TOOLING-001: Create Project Scaffolding Files
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The codebase has **no `README.md`** at root, **no `.env.example`**, and **no `.prettierrc`** — these files are completely missing. A `scripts/README.md` exists but does not serve as a project-level README.
**Size:** Medium

**Description** Create `README.md`, `.env.example`, and `.prettierrc` at the repository root. Implement Zod-based environment variable validation in the API server to fail fast on missing/invalid config.

**Depends on:** [N/A]
**Blocks:** All development tasks requiring environment setup or onboarding
**Related Files:** `README.md`, `.env.example`, `.prettierrc`, `artifacts/api-server/src/lib/env-validation.ts`

**Imports / Exports**
- Imports: [N/A]
- Exports: Exports `env` config object from `env-validation.ts` (typed, validated)

**Definition of Done**
- [ ] `README.md` exists with project overview, quick-start guide, architecture summary, and link to `docs/bounded-contexts.md`
- [ ] `.env.example` lists all required variables with descriptions (see Rules section for full list)
- [ ] `.prettierrc` exists with project-wide rules (`semi: true`, `singleQuote: true`, `trailingComma: "all"`)
- [ ] `artifacts/api-server/src/lib/env-validation.ts` exports a Zod-validated `env` object; server fails fast with clear error messages on missing/invalid variables
- [ ] `pnpm prettier --check src/` runs without errors after configuration

**Out of Scope**
- Full deployment or CI/CD documentation
- ESLint configuration (separate TOOLING task)
- Advanced Prettier plugin setup

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never modify: `.replit`, `pnpm-workspace.yaml`, root `tsconfig.json`
- Never commit: actual `.env` values, credentials, secrets — only `.env.example` with placeholder values
- `env-validation.ts` must never log or expose secret values; log only which key is missing/invalid

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/lib/env-validation.ts`
- Documentation: `README.md`, `.env.example`, `.prettierrc`

**Rollback**
- Granularity: file-level
- Halt condition: `pnpm typecheck` fails after adding `env-validation.ts` → revert the validation file; scaffolding files (README, .env.example, .prettierrc) can remain

**Rules to Follow**
- `README.md` must mention the domain and bounded contexts
- `.env.example` must document every required variable with a description:
  `DATABASE_URL`, `JWT_SECRET`, `PORT`, `PORTAL_JWT_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `ESIGN_PROVIDER_API_KEY`, `ESIGN_PROVIDER_BASE_URL`, `MAGIC_LINK_EXPIRY_MINUTES`, `PORTAL_JWT_EXPIRY_HOURS`
- All environment variables must be validated at server startup via Zod
- Configuration must be type-safe — consumers import `env` from `env-validation.ts`, never `process.env` directly
- Environment-specific validation rules must be enforced (e.g., `NODE_ENV` guards)

**Verification**
```bash
pnpm typecheck
pnpm prettier --check src/
# Manual: start api-server with a missing var and confirm descriptive error message
```

**Advanced Code Patterns**
- Centralised environment variable validation with Zod (`z.object({ DATABASE_URL: z.string().url(), ... })`)
- Type-safe configuration export: `export const env = schema.parse(process.env)` — typed `env` object used everywhere instead of `process.env` directly
- Environment-specific overrides via `NODE_ENV` branches within the Zod schema

**Anti-Patterns**
- Missing `.env.example` — developers guess required variables, leading to runtime failures
- Accessing `process.env.DATABASE_URL` directly in business logic without validation
- Logging secret values in error messages during startup validation
- Hardcoded environment variable values anywhere in source

**DDD / TDD / BDD / Deep Module notes**
- DDD: README should mention bounded contexts; `.env.example` documents infrastructure dependencies per context
- TDD: [N/A] – scaffolding task; env-validation catches runtime misconfiguration at startup
- BDD: [N/A]
- Deep Module: `env-validation.ts` is a deep module — simple `env` object interface hiding complex Zod parsing and validation logic

---

### Subtasks
- [ ] TOOLING-001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING-001.0.5 (AGENT): Research latest best practices (as of 05/2026). Review Zod v4 schema patterns for env validation; check if `zod/v4` import path is required (Zod v3.25+ ships compatibility path); identify any new env vars from DOMAIN-004 ADRs.
- [ ] TOOLING-001.0.75 (AGENT): Reason about the task. If any required env variable is unclear or its type is uncertain, ask the user before writing.
- [ ] TOOLING-001.1 (AGENT): Write `README.md` with project overview, quick start, architecture summary, and link to bounded contexts.
  **File(s):** `README.md`
  **Verification:** File exists; covers all required sections.
- [ ] TOOLING-001.2 (AGENT): Create `.env.example` with all required variables (see Rules section). Create Zod schema for `process.env` and validate at server startup.
  **File(s):** `.env.example`, `artifacts/api-server/src/lib/env-validation.ts`
  **Verification:** `.env.example` lists all required variables with descriptions; server fails fast with clear error on missing/invalid variables; `pnpm typecheck` passes.
- [ ] TOOLING-001.3 (AGENT): Add `.prettierrc` with project-wide rules (`semi: true`, `singleQuote: true`, `trailingComma: "all"`).
  **File(s):** `.prettierrc`
  **Verification:** `pnpm prettier --check src/` runs without errors after configuration.
- [ ] TOOLING-001.4 (AGENT): Add environment variables for future services to `.env.example`: `REDIS_URL` (if caching/real-time chosen), `MEILISEARCH_URL` or `TYPESENSE_URL` (if external search engine chosen in DOMAIN-004 ADR), `WS_PORT` (if WebSocket runs separately). Mark these as optional/conditional.
  **File(s):** `.env.example`, `artifacts/api-server/src/lib/env-validation.ts`
  **Verification:** All new variables documented; configuration validation passes with optional variables absent.
- [ ] TOOLING-001.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] TOOLING-002: Enable Strict TypeScript Flags
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `tsconfig.base.json` has `noImplicitOverride: false`, `noUnusedLocals: false`, and `strictFunctionTypes: false` — explicitly disabled for prototyping. All other strict flags (`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, etc.) are already enabled.
**Size:** Small

**Description** Enable the three remaining disabled strict flags in `tsconfig.base.json` and fix all resulting type errors, hardening the codebase for production-grade type safety.

**Depends on:** [N/A]
**Blocks:** All implementation tasks that rely on correct TypeScript strictness
**Related Files:** `tsconfig.base.json`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A]

**Definition of Done**
- [ ] `noImplicitOverride: true` set in `tsconfig.base.json`
- [ ] `noUnusedLocals: true` set in `tsconfig.base.json`
- [ ] `strictFunctionTypes: true` set in `tsconfig.base.json`
- [ ] `pnpm run typecheck` passes with zero errors after all three flags enabled

**Out of Scope**
- Full ESLint integration (separate TOOLING task)
- Enabling `noUnusedParameters` (deferred — may cause too many false positives during prototyping)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Apply changes **only** to `tsconfig.base.json` — do not modify individual workspace `tsconfig.json` files unless fixing a genuine error they expose

**Output Artifacts**
- Configuration change in: `tsconfig.base.json`
- Code fixes in: any file flagged by newly enabled strict rules

**Rollback**
- Granularity: file-level (`tsconfig.base.json`)
- Halt condition: A flag produces >20 unfixable errors in generated/third-party code → disable that specific flag and document the exception; do not revert the others

**Rules to Follow**
- Apply changes only to `tsconfig.base.json`
- Fix all flagged errors before marking complete; do not suppress with `// @ts-ignore` unless it's generated code
- Unused locals: prefix with `_` if intentionally unused (e.g., `_unusedParam`)

**Verification**
```bash
pnpm run typecheck    # must pass with zero errors
pnpm run build
```

**Advanced Code Patterns**
- Strict typing reinforces domain invariants (e.g., email format, required fields) at compile time without runtime overhead
- `strictFunctionTypes` prevents unsafe covariant function assignments in callback patterns (critical for repository and service interfaces)

**Anti-Patterns**
- Suppressing errors with `// @ts-ignore` or `any` casts instead of fixing the root cause
- Relaxing flags in individual `tsconfig.json` overrides to silence errors
- Leaving unused locals in domain code (signals incomplete refactors)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Strict typing reinforces domain invariants — e.g., `email format`, required fields — without runtime checks
- TDD: `pnpm typecheck` acts as a compile-time test; included in CI after TOOLING-002 is complete
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] TOOLING-002.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING-002.0.5 (AGENT): Research latest best practices (as of 05/2026). Review TypeScript 5.x strict flag documentation; understand the implications of each flag for the existing codebase.
- [ ] TOOLING-002.0.75 (AGENT): Reason about the task. Run a dry-run typecheck mentally or on a branch to estimate error count. If errors seem excessive, discuss with user before enabling all flags at once.
- [ ] TOOLING-002.1 (AGENT): Enable `noImplicitOverride: true` in `tsconfig.base.json`.
  **File(s):** `tsconfig.base.json`
  **Verification:** Flag enabled; `pnpm run typecheck` passes or all errors are documented.
- [ ] TOOLING-002.2 (AGENT): Enable `noUnusedLocals: true` in `tsconfig.base.json`.
  **File(s):** `tsconfig.base.json`
  **Verification:** Flag enabled; unused locals removed or prefixed with `_`.
- [ ] TOOLING-002.3 (AGENT): Enable `strictFunctionTypes: true` in `tsconfig.base.json`.
  **File(s):** `tsconfig.base.json`
  **Verification:** Flag enabled; function type errors resolved.
- [ ] TOOLING-002.4 (AGENT): Run full workspace typecheck and fix all errors.
  **File(s):** affected workspace files
  **Verification:** `pnpm run typecheck` passes with zero errors.
- [ ] TOOLING-002.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] TOOLING-003: Audit and Clean Up Unused Dependencies
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** Multiple packages are declared but never imported — e.g., `cookie-parser`, `react-hook-form`, `next-themes`, `react-day-picker`, and others (see INCOMPLETE.md §12 for full list). Build output and install time are inflated by dead packages.
**Size:** Small

**Description** Audit all workspace `package.json` files for unused dependencies; for each, decide to wire into a Phase 1 feature or remove. Document every decision.

**Depends on:** [N/A]
**Blocks:** All implementation tasks (cleaner dependency tree reduces confusion and build time)
**Related Files:** `artifacts/apex-os/package.json`, `artifacts/api-server/package.json`, workspace `package.json` files

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A]

**Definition of Done**
- [ ] Every unused package identified and a fate decision documented (wire-in or remove)
- [ ] Packages decided for removal are removed from their `package.json` files
- [ ] `pnpm run typecheck` still passes after removals
- [ ] `npx depcheck` (or equivalent) shows no dead packages

**Out of Scope**
- Adding new dependencies
- Upgrading existing dependencies (separate task)
- ESLint or build config changes

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never modify: `.replit`, root `tsconfig.json`, `pnpm-workspace.yaml`
- Never commit: `.env*`, credentials, secrets
- Do not remove packages that will clearly be needed in Phase 1 (e.g., `react-hook-form` is used in auth forms)

**Output Artifacts**
- Updated `package.json` files for affected workspaces
- Documentation: decision log appended to `docs/dependencies.md` (create if absent)

**Rollback**
- Granularity: file-level (individual `package.json` files)
- Halt condition: `pnpm run typecheck` fails after a removal → restore that package and mark it as "wire-in" instead

**Rules to Follow**
- For each package flagged, determine if it's needed in Phase 1 before removing
- If removing, add a comment in `docs/dependencies.md` noting what was removed and why
- Lean dependency tree — only keep what is actively used or imminently needed

**Verification**
```bash
pnpm run typecheck
npx depcheck --ignore-patterns="*.test.ts"
pnpm run build
```

**Advanced Code Patterns**
- [N/A] – dependency audit is a maintenance task

**Anti-Patterns**
- Leaving dead dependencies that inflate the build bundle and confuse developers about available libraries
- Removing packages without checking if they're needed in an upcoming phase

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – technical cleanup
- TDD: [N/A]
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] TOOLING-003.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING-003.0.5 (AGENT): Research latest best practices (as of 05/2026). Review `depcheck` usage in pnpm monorepos; identify which packages on the "unused" list will be consumed in Phase 1 (e.g., `react-hook-form` for auth forms).
- [ ] TOOLING-003.0.75 (AGENT): Reason about the task. If any package's fate is ambiguous, ask the user before removing.
- [ ] TOOLING-003.1 (HUMAN): Audit list of unused deps and decide fate of each: wire-in or remove.
  **File(s):** workspace `package.json` files
  **Verification:** Decision documented in `docs/dependencies.md` or as comments in `package.json`.
  **Blocks:** TOOLING-003.2 (removal).
- [ ] TOOLING-003.2 (AGENT): Remove packages decided as unnecessary.
  **File(s):** affected `package.json` files
  **Verification:** `pnpm run typecheck` passes; `npx depcheck` shows no dead packages.
- [ ] TOOLING-003.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] TOOLING-004: Pin Zod Version & Verify drizzle-zod Compatibility
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `zod` is catalog-pinned to `^3.25.76`. `drizzle-zod` is `^0.8.3` in `lib/db/package.json`. The DB schema template (`lib/db/src/schema/index.ts`) already uses `import { z } from "zod/v4"` — indicating the `zod/v4` sub-path export from Zod 3.25+ is in use. Compatibility must be verified with an actual test before any version changes.
**Size:** Small

**Description** Verify that `drizzle-zod 0.8.3` + `drizzle-orm 0.45.2` + `zod 3.25.76` (including the `zod/v4` sub-path) work correctly together by running a minimal schema test. Document the finding. If the test fails, determine the correct version pin strategy.

**Depends on:** DEP-001
**Blocks:** All database schema tasks (Phase 2)
**Related Files:** `pnpm-workspace.yaml`, `lib/db/package.json`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/zod-compat.test.ts`, `docs/dependencies.md`

**Imports / Exports**
- Imports: `drizzle-orm/pg-core`, `drizzle-zod`, `zod/v4`
- Exports: test artifacts only (no production exports from this task)

**Definition of Done**
- [ ] `lib/db/src/__tests__/zod-compat.test.ts` exists with a minimal Drizzle table and `createSelectSchema` / `createInsertSchema` assertions
- [ ] Test passes: `pnpm vitest run zod-compat`
- [ ] `pnpm typecheck` passes with no new errors
- [ ] `docs/dependencies.md` states compatibility finding and re-verification instructions
- [ ] If incompatible: version pin strategy documented and approved by HUMAN before any changes

**Out of Scope**
- Upgrading Zod to v4.x (full major) without user approval
- Defining actual production schema tables (Phase 2 DB tasks)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never modify: `.replit`, root `tsconfig.json`
- Never commit: `.env*`, credentials, secrets
- Do NOT change any version pin before the compatibility test passes — test first, change later if needed

**Output Artifacts**
- Tests added in: `lib/db/src/__tests__/zod-compat.test.ts`
- Documentation: `docs/dependencies.md`

**Rollback**
- Granularity: file-level
- Halt condition: Test fails and the version incompatibility cannot be resolved → halt all Phase 2 schema work; raise with user for resolution

**Rules to Follow**
- Verify compatibility BEFORE changing any version pin
- If test passes → no pin change needed; document the finding
- If test fails → decide on pin/zod upgrade strategy with user approval
- `zod/v4` sub-path is a compatibility shim in Zod 3.25+; do not confuse with Zod v4 full major
- Security vulnerabilities in any pinned dependency must be addressed within 30 days

**Verification**
```bash
pnpm vitest run zod-compat
pnpm typecheck
```

**Advanced Code Patterns**
- Compatibility testing before dependency upgrades — test the integration, not just the individual packages
- Semantic versioning awareness: `drizzle-zod 0.8.x` uses `drizzle-orm` peer dependency; always verify peer ranges before upgrading either

**Anti-Patterns**
- Changing version pins before running the compatibility test
- Assuming Zod 3.25 `zod/v4` sub-path is identical to Zod v4.x full release (they are different)
- Manual dependency management without documented compatibility matrix

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – technical plumbing keeping the validation layer (Zod) aligned with the persistence layer (Drizzle)
- TDD: Create `lib/db/src/__tests__/zod-compat.test.ts`; write a test defining a minimal Drizzle table and asserting `createInsertSchema` / `createSelectSchema` produce correct Zod shapes; test must pass before marking complete
- BDD: [N/A] – no user-visible behaviour
- Deep Module: [N/A]

---

### Subtasks
- [ ] TOOLING-004.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING-004.0.5 (AGENT): Research latest best practices (as of 05/2026). Confirm `drizzle-zod 0.8.3` peer dependency requirements; understand the `zod/v4` sub-path in Zod 3.25+ vs. a full Zod v4 upgrade; review Drizzle changelog for any breaking changes since 0.45.x.
- [ ] TOOLING-004.0.75 (AGENT): Reason about the task. Inspect `lib/db/src/schema/index.ts` for the `zod/v4` import. If the compatibility matrix is unclear, discuss with user before running tests.
- [ ] TOOLING-004.1 (AGENT): Verify `zod 3.25.76` + `drizzle-zod 0.8.3` + `zod/v4` sub-path compatibility by running the test in TOOLING-004.2 BEFORE changing any version pin.
  **File(s):** `lib/db/src/__tests__/zod-compat.test.ts`
  **Verification:** Test passes → no pin change needed; document finding. Test fails → determine version strategy.
- [ ] TOOLING-004.2 (AGENT): Create minimal test table in `lib/db/src/__tests__/zod-compat.test.ts` and implement Zod schema generation assertions using `createSelectSchema` and `createInsertSchema`.
  **File(s):** `lib/db/src/__tests__/zod-compat.test.ts`
  **Verification:** `pnpm vitest run zod-compat` passes; `pnpm typecheck` passes.
- [ ] TOOLING-004.3 (AGENT): Document the compatibility finding in `docs/dependencies.md`.
  **File(s):** `docs/dependencies.md`
  **Verification:** File states "Zod 3.25.76 is compatible with drizzle-zod 0.8.3 as of [date]; re-verify on any drizzle-zod upgrade."
- [ ] TOOLING-004.4 (HUMAN): Run `pnpm test` and `pnpm typecheck`; confirm compatibility.
  **Verification:** Confirmed.
  **Blocks:** All schema tasks (Phase 2).
- [ ] TOOLING-004.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## Tooling Wave Completion Criteria

**Wave Status:** [ ] Complete (0/4 parent tasks done)

**Dependencies for Other Waves:**
- TOOLING-001 enables development workflow and environment setup
- TOOLING-002 ensures code quality and type safety
- TOOLING-003 removes dead dependencies for cleaner builds
- TOOLING-004 validates Zod/Drizzle compatibility for schema work

**Parallel Execution:** Can run alongside FOUNDATION, ARCHITECTURE, and BEHAVIOR waves
