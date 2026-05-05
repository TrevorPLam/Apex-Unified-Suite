# tasks/foundation/TOOLING.md – Development Tooling & Dependency Foundation

This file contains dependency management and tooling tasks that enable the development workflow, type safety, and code quality. These tasks can run in parallel with other foundation waves and are prerequisites for all subsequent implementation phases.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] DEP‑001: Add Missing Core Dependencies
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** `argon2 ^0.40.1`, all `@testing-library/*`, `jsdom ^25.0.1`, and `@vitest/coverage‑v8 ^1.6.0` (outdated – must match vitest major) are already in the workspace catalog. Still missing: `neverthrow`, `vitest`, `@vitest/ui`. Root `package.json` has no `test` script.
**Size:** Small

**Description:** Add `neverthrow ^8.2.0`, `vitest ^4.1.0`, and `@vitest/ui ^4.1.0` to the pnpm workspace catalog; upgrade the stale `@vitest/coverage‑v8 ^1.6.0` → `^4.1.0`; and add a root‑level `"test": "vitest"` script — unblocking all testing and authentication tasks.

**Depends on:** [N/A]
**Blocks:** `foundation/DOMAIN.md → DOMAIN‑001`, `foundation/TOOLING.md → TOOLING‑002`, `TOOLING‑004`, all testing and authentication tasks
**Related Files:** `pnpm‑workspace.yaml`, `package.json` (root)

**Definition of Done**
- [ ] `neverthrow: ^8.2.0` added to workspace catalog
- [ ] `vitest: ^4.1.0` added to workspace catalog
- [ ] `@vitest/ui: ^4.1.0` added to workspace catalog
- [ ] `@vitest/coverage‑v8` upgraded from `^1.6.0` → `^4.1.0` in catalog (must match vitest major)
- [ ] `"test": "vitest"` script present in root `package.json`
- [ ] `pnpm install --frozen‑lockfile` succeeds with no peer‑dependency conflicts

**Out of Scope**
- Upgrading any existing dependency other than `@vitest/coverage‑v8`
- Adding non‑essential or speculative packages
- ESLint or Prettier configuration (separate `TOOLING` tasks)

**Rules to Follow**
- All dependencies must be added to the workspace catalog, not individual `package.json` files
- Use `^` for minor‑updates‑allowed, matching existing catalog style
- `@vitest/coverage‑v8` major version must always match `vitest` major version
- Verify `pnpm install --frozen‑lockfile` succeeds before marking any subtask complete

**Verification**
```bash
pnpm install --frozen‑lockfile
pnpm vitest --version          # expect 4.x
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – infrastructure dependency management
- TDD: Test framework setup (`vitest ^4.1.0`) enables all subsequent TDD tasks
- BDD: [N/A] – infrastructure prerequisite
- Deep Module: [N/A]

---

### Subtasks
- [ ] DEP‑001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DEP‑001.0.5 (AGENT): Research latest best practices (as of 05/2026). Confirm stable versions: `neverthrow ^8.2.0`, `vitest ^4.1.0`, `@vitest/ui ^4.1.0`. Verify which catalog entries already exist and which are stale.
- [ ] DEP‑001.0.75 (AGENT): Reason about the task. Cross‑check the workspace catalog against every subtask before executing. If any version or catalog entry is uncertain, ask the user.
- [ ] DEP‑001.1 (AGENT): Add `neverthrow: ^8.2.0` to workspace catalog for Result/Either‑pattern error handling.
  **File(s):** `pnpm‑workspace.yaml`
  **Verification:** `pnpm install --frozen‑lockfile` succeeds; neverthrow importable from workspace.
- [ ] DEP‑001.2 (AGENT): Add `vitest: ^4.1.0` and `@vitest/ui: ^4.1.0` to workspace catalog. Upgrade existing `@vitest/coverage‑v8` entry from `^1.6.0` → `^4.1.0`.
  **File(s):** `pnpm‑workspace.yaml`
  **Verification:** `pnpm vitest --version` outputs 4.x; `pnpm install --frozen‑lockfile` succeeds.
- [ ] DEP‑001.3 (AGENT): Verify `argon2: ^0.40.1` is already present in workspace catalog (confirm only — no change needed).
  **File(s):** `pnpm‑workspace.yaml`
  **Verification:** Entry confirmed present; no action taken.
- [ ] DEP‑001.4 (AGENT): Add `"test": "vitest"` script to root `package.json`.
  **File(s):** `package.json`
  **Verification:** `pnpm run test --version` works.
- [ ] DEP‑001.5 (AGENT): Verify all dependencies install correctly together with no peer conflicts.
  **File(s):** workspace root
  **Verification:** `pnpm install --frozen‑lockfile` succeeds; `pnpm typecheck` passes.
- [ ] DEP‑001.6 (AGENT): Verify frontend test packages (`@testing-library/react ^16.1.0`, `@testing-library/jest‑dom ^6.6.3`, `@testing-library/user‑event ^14.5.2`, `jsdom ^25.0.1`) are already in catalog (confirm only — flag if versions are stale).
  **File(s):** `pnpm‑workspace.yaml`
  **Verification:** All entries confirmed present; `pnpm install --frozen‑lockfile` succeeds.
- [ ] DEP‑001.7 (HUMAN): Final review and sign‑off.
  **Verification:** Approved — all dependencies resolve, `pnpm typecheck` passes.

---

## [ ] TOOLING‑001: Create Project Scaffolding Files
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The codebase has **no `README.md`** at root, **no `.env.example`**, and **no `.prettierrc`** — these files are completely missing. A `scripts/README.md` exists but does not serve as a project‑level README.
**Size:** Medium

**Description:** Create `README.md`, `.env.example`, and `.prettierrc` at the repository root. Implement Zod‑based environment variable validation in the API server to fail fast on missing/invalid config.

**Depends on:** [N/A]
**Blocks:** All development tasks requiring environment setup or onboarding
**Related Files:** `README.md`, `.env.example`, `.prettierrc`, `artifacts/api‑server/src/lib/env‑validation.ts`

**Definition of Done**
- [ ] `README.md` exists with project overview, quick‑start guide, architecture summary, and link to `docs/bounded‑contexts.md`
- [ ] `.env.example` lists all required variables with descriptions (see Rules section for full list)
- [ ] `.prettierrc` exists with project‑wide rules (`semi: true`, `singleQuote: true`, `trailingComma: "all"`)
- [ ] `artifacts/api‑server/src/lib/env‑validation.ts` exports a Zod‑validated `env` object; server fails fast with clear error messages on missing/invalid variables
- [ ] `pnpm prettier --check src/` runs without errors after configuration

**Out of Scope**
- Full deployment or CI/CD documentation
- ESLint configuration (separate `TOOLING` task)
- Advanced Prettier plugin setup

**Rules to Follow**
- `README.md` must mention the domain and bounded contexts
- `.env.example` must document every required variable with a description:
  `DATABASE_URL`, `JWT_SECRET`, `PORT`, `PORTAL_JWT_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `ESIGN_PROVIDER_API_KEY`, `ESIGN_PROVIDER_BASE_URL`, `MAGIC_LINK_EXPIRY_MINUTES`, `PORTAL_JWT_EXPIRY_HOURS`
- All environment variables must be validated at server startup via Zod
- Configuration must be type‑safe — consumers import `env` from `env‑validation.ts`, never `process.env` directly

**Verification**
```bash
pnpm typecheck
pnpm prettier --check src/
# Manual: start api‑server with a missing var and confirm descriptive error message
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: README should mention bounded contexts; `.env.example` documents infrastructure dependencies per context.
- TDD: [N/A] – scaffolding task; env‑validation catches runtime misconfiguration at startup.
- BDD: [N/A]
- Deep Module: `env‑validation.ts` is a deep module — simple `env` object interface hiding complex Zod parsing and validation logic.

---

### Subtasks
- [ ] TOOLING‑001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING‑001.0.5 (AGENT): Research latest best practices (as of 05/2026). Review Zod v4 schema patterns for env validation; check if `zod/v4` import path is required (Zod v3.25+ ships compatibility path); identify any new env vars from DOMAIN‑004 ADRs.
- [ ] TOOLING‑001.0.75 (AGENT): Reason about the task. If any required env variable is unclear or its type is uncertain, ask the user before writing.
- [ ] TOOLING‑001.1 (AGENT): Write `README.md` with project overview, quick start, architecture summary, and link to bounded contexts.
  **File(s):** `README.md`
  **Verification:** File exists; covers all required sections.
- [ ] TOOLING‑001.2 (AGENT): Create `.env.example` with all required variables (see Rules section). Create Zod schema for `process.env` and validate at server startup.
  **File(s):** `.env.example`, `artifacts/api‑server/src/lib/env‑validation.ts`
  **Verification:** `.env.example` lists all required variables with descriptions; server fails fast with clear error on missing/invalid variables; `pnpm typecheck` passes.
- [ ] TOOLING‑001.3 (AGENT): Add `.prettierrc` with project‑wide rules (`semi: true`, `singleQuote: true`, `trailingComma: "all"`).
  **File(s):** `.prettierrc`
  **Verification:** `pnpm prettier --check src/` runs without errors after configuration.
- [ ] TOOLING‑001.4 (AGENT): Add environment variables for future services to `.env.example`: `REDIS_URL` (if caching/real‑time chosen), `MEILISEARCH_URL` or `TYPESENSE_URL` (if external search engine chosen in DOMAIN‑004 ADR), `WS_PORT` (if WebSocket runs separately). Mark these as optional/conditional.
  **File(s):** `.env.example`, `artifacts/api‑server/src/lib/env‑validation.ts`
  **Verification:** All new variables documented; configuration validation passes with optional variables absent.
- [ ] TOOLING‑001.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] TOOLING‑002: Enable Strict TypeScript Flags
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `tsconfig.base.json` has `noImplicitOverride: false`, `noUnusedLocals: false`, and `strictFunctionTypes: false` — explicitly disabled for prototyping. All other strict flags (`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, etc.) are already enabled.
**Size:** Small

**Description:** Enable the three remaining disabled strict flags in `tsconfig.base.json` and fix all resulting type errors, hardening the codebase for production‑grade type safety.

**Depends on:** [N/A]
**Blocks:** All implementation tasks that rely on correct TypeScript strictness
**Related Files:** `tsconfig.base.json`

**Definition of Done**
- [ ] `noImplicitOverride: true` set in `tsconfig.base.json`
- [ ] `noUnusedLocals: true` set in `tsconfig.base.json`
- [ ] `strictFunctionTypes: true` set in `tsconfig.base.json`
- [ ] `pnpm run typecheck` passes with zero errors after all three flags enabled

**Out of Scope**
- Full ESLint integration (separate `TOOLING` task)
- Enabling `noUnusedParameters` (deferred — may cause too many false positives during prototyping)

**Rules to Follow**
- Apply changes **only** to `tsconfig.base.json` — do not modify individual workspace `tsconfig.json` files unless fixing a genuine error they expose
- Fix all flagged errors before marking complete; do not suppress with `// @ts‑ignore` unless it’s generated code
- Unused locals: prefix with `_` if intentionally unused (e.g., `_unusedParam`)

**Verification**
```bash
pnpm run typecheck    # must pass with zero errors
pnpm run build
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Strict typing reinforces domain invariants (e.g., email format, required fields) at compile time without runtime overhead.
- TDD: `pnpm typecheck` acts as a compile‑time test; included in CI after `TOOLING‑002` is complete.
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] TOOLING‑002.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING‑002.0.5 (AGENT): Research latest best practices (as of 05/2026). Review TypeScript 5.x strict flag documentation; understand the implications of each flag for the existing codebase.
- [ ] TOOLING‑002.0.75 (AGENT): Reason about the task. Run a dry‑run typecheck mentally or on a branch to estimate error count. If errors seem excessive, discuss with user before enabling all flags at once.
- [ ] TOOLING‑002.1 (AGENT): Enable `noImplicitOverride: true` in `tsconfig.base.json`.
  **File(s):** `tsconfig.base.json`
  **Verification:** Flag enabled; `pnpm run typecheck` passes or all errors are documented.
- [ ] TOOLING‑002.2 (AGENT): Enable `noUnusedLocals: true` in `tsconfig.base.json`.
  **File(s):** `tsconfig.base.json`
  **Verification:** Flag enabled; unused locals removed or prefixed with `_`.
- [ ] TOOLING‑002.3 (AGENT): Enable `strictFunctionTypes: true` in `tsconfig.base.json`.
  **File(s):** `tsconfig.base.json`
  **Verification:** Flag enabled; function type errors resolved.
- [ ] TOOLING‑002.4 (AGENT): Run full workspace typecheck and fix all errors.
  **File(s):** affected workspace files
  **Verification:** `pnpm run typecheck` passes with zero errors.
- [ ] TOOLING‑002.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] TOOLING‑002‑EXT: Enable `noUncheckedIndexedAccess`
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `noUncheckedIndexedAccess` is not enabled in `tsconfig.base.json`. This flag causes all indexed access (arrays, objects) to include `undefined` in the resulting type, catching a large class of runtime errors at compile time. Required for production‑grade type safety in Phase 2+.
**Size:** Small

**Description:** Enable `noUncheckedIndexedAccess: true` in `tsconfig.base.json` and fix all resulting type errors across the codebase.

**Depends on:** `foundation/TOOLING.md → TOOLING‑002`
**Blocks:** All Phase 2+ implementation tasks (ensures array/object access is always safe)
**Related Files:** `tsconfig.base.json`

**Definition of Done**
- [ ] `noUncheckedIndexedAccess: true` set in `tsconfig.base.json`
- [ ] `pnpm run typecheck` passes with zero errors after the flag is enabled

**Out of Scope**
- Enabling any additional strict flags beyond this one

**Rules to Follow**
- Apply change only to `tsconfig.base.json`
- Fix all flagged errors; use optional chaining (`?.`) or explicit `undefined` guards as appropriate

**Verification**
```bash
pnpm run typecheck    # must pass with zero errors
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Strengthens domain invariant enforcement at compile time.
- TDD: Type checking acts as a test; integrated into CI pipeline.
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] TOOLING‑002‑EXT.1 (AGENT): Enable `noUncheckedIndexedAccess: true` in `tsconfig.base.json`.
  **File(s):** `tsconfig.base.json`
  **Verification:** Flag enabled.
- [ ] TOOLING‑002‑EXT.2 (AGENT): Run `pnpm run typecheck` and fix all resulting errors.
  **Verification:** `pnpm run typecheck` passes with zero errors.
- [ ] TOOLING‑002‑EXT.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] TOOLING‑003: Audit and Clean Up Unused Dependencies
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** Multiple packages are declared but never imported — e.g., `cookie‑parser`, `react‑hook‑form`, `next‑themes`, `react‑day‑picker`, and others. Build output and install time are inflated by dead packages.
**Size:** Small

**Description:** Audit all workspace `package.json` files for unused dependencies; for each, decide to wire into a Phase 1 feature or remove. Document every decision.

**Depends on:** [N/A]
**Blocks:** All implementation tasks (cleaner dependency tree reduces confusion and build time)
**Related Files:** `artifacts/apex‑os/package.json`, `artifacts/api‑server/package.json`, workspace `package.json` files

**Definition of Done**
- [ ] Every unused package identified and a fate decision documented (wire‑in or remove)
- [ ] Packages decided for removal are removed from their `package.json` files
- [ ] `pnpm run typecheck` still passes after removals
- [ ] `npx depcheck` (or equivalent) shows no dead packages

**Out of Scope**
- Adding new dependencies
- Upgrading existing dependencies (separate task)
- ESLint or build config changes

**Rules to Follow**
- For each package flagged, determine if it’s needed in Phase 1 before removing
- If removing, add a comment in `docs/dependencies.md` noting what was removed and why
- Lean dependency tree — only keep what is actively used or imminently needed

**Verification**
```bash
pnpm run typecheck
npx depcheck --ignore‑patterns="*.test.ts"
pnpm run build
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – technical cleanup
- TDD: [N/A]
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] TOOLING‑003.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING‑003.0.5 (AGENT): Research latest best practices (as of 05/2026). Review `depcheck` usage in pnpm monorepos; identify which packages on the “unused” list will be consumed in Phase 1 (e.g., `react‑hook‑form` for auth forms).
- [ ] TOOLING‑003.0.75 (AGENT): Reason about the task. If any package’s fate is ambiguous, ask the user before removing.
- [ ] TOOLING‑003.1 (HUMAN): Audit list of unused deps and decide fate of each: wire‑in or remove.
  **File(s):** workspace `package.json` files
  **Verification:** Decision documented in `docs/dependencies.md` or as comments in `package.json`.
  **Blocks:** TOOLING‑003.2 (removal).
- [ ] TOOLING‑003.2 (AGENT): Remove packages decided as unnecessary.
  **File(s):** affected `package.json` files
  **Verification:** `pnpm run typecheck` passes; `npx depcheck` shows no dead packages.
- [ ] TOOLING‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] TOOLING‑004: Pin Zod Version & Verify drizzle‑zod Compatibility
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `zod` is catalog‑pinned to `^3.25.76`. `drizzle‑zod` is `^0.8.3` in `lib/db/package.json`. The DB schema template (`lib/db/src/schema/index.ts`) already uses `import { z } from "zod/v4"` — indicating the `zod/v4` sub‑path export from Zod 3.25+ is in use. Compatibility must be verified with an actual test before any version changes.
**Size:** Small

**Description:** Verify that `drizzle‑zod 0.8.3` + `drizzle‑orm 0.45.2` + `zod 3.25.76` (including the `zod/v4` sub‑path) work correctly together by running a minimal schema test. Document the finding. If the test fails, determine the correct version pin strategy.

**Depends on:** `foundation/TOOLING.md → DEP‑001`
**Blocks:** All database schema tasks (Phase 2)
**Related Files:** `pnpm‑workspace.yaml`, `lib/db/package.json`, `lib/db/src/schema/index.ts`, `lib/db/src/__tests__/zod‑compat.test.ts`, `docs/dependencies.md`

**Definition of Done**
- [ ] `lib/db/src/__tests__/zod‑compat.test.ts` exists with a minimal Drizzle table and `createSelectSchema` / `createInsertSchema` assertions
- [ ] Test passes: `pnpm vitest run zod‑compat`
- [ ] `pnpm typecheck` passes with no new errors
- [ ] `docs/dependencies.md` states compatibility finding and re‑verification instructions
- [ ] If incompatible: version pin strategy documented and approved by HUMAN before any changes

**Out of Scope**
- Upgrading Zod to v4.x (full major) without user approval
- Defining actual production schema tables (Phase 2 DB tasks)

**Rules to Follow**
- Verify compatibility BEFORE changing any version pin
- If test passes → no pin change needed; document the finding
- If test fails → decide on pin/zod upgrade strategy with user approval
- `zod/v4` sub‑path is a compatibility shim in Zod 3.25+; do not confuse with Zod v4 full major
- Security vulnerabilities in any pinned dependency must be addressed within 30 days

**Verification**
```bash
pnpm vitest run zod‑compat
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – technical plumbing keeping the validation layer (Zod) aligned with the persistence layer (Drizzle).
- TDD: Create `lib/db/src/__tests__/zod‑compat.test.ts`; write a test defining a minimal Drizzle table and asserting `createInsertSchema` / `createSelectSchema` produce correct Zod shapes; test must pass before marking complete.
- BDD: [N/A] – no user‑visible behaviour.
- Deep Module: [N/A]

---

### Subtasks
- [ ] TOOLING‑004.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] TOOLING‑004.0.5 (AGENT): Research latest best practices (as of 05/2026). Confirm `drizzle‑zod 0.8.3` peer dependency requirements; understand the `zod/v4` sub‑path in Zod 3.25+ vs. a full Zod v4 upgrade; review Drizzle changelog for any breaking changes since 0.45.x.
- [ ] TOOLING‑004.0.75 (AGENT): Reason about the task. Inspect `lib/db/src/schema/index.ts` for the `zod/v4` import. If the compatibility matrix is unclear, discuss with user before running tests.
- [ ] TOOLING‑004.1 (AGENT): Verify `zod 3.25.76` + `drizzle‑zod 0.8.3` + `zod/v4` sub‑path compatibility by running the test in TOOLING‑004.2 BEFORE changing any version pin.
  **File(s):** `lib/db/src/__tests__/zod‑compat.test.ts`
  **Verification:** Test passes → no pin change needed; document finding. Test fails → determine version strategy.
- [ ] TOOLING‑004.2 (AGENT): Create minimal test table in `lib/db/src/__tests__/zod‑compat.test.ts` and implement Zod schema generation assertions using `createSelectSchema` and `createInsertSchema`.
  **File(s):** `lib/db/src/__tests__/zod‑compat.test.ts`
  **Verification:** `pnpm vitest run zod‑compat` passes; `pnpm typecheck` passes.
- [ ] TOOLING‑004.3 (AGENT): Document the compatibility finding in `docs/dependencies.md`.
  **File(s):** `docs/dependencies.md`
  **Verification:** File states “Zod 3.25.76 is compatible with drizzle‑zod 0.8.3 as of [date]; re‑verify on any drizzle‑zod upgrade.”
- [ ] TOOLING‑004.4 (HUMAN): Run `pnpm test` and `pnpm typecheck`; confirm compatibility.
  **Verification:** Confirmed.
  **Blocks:** All schema tasks (Phase 2).
- [ ] TOOLING‑004.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
