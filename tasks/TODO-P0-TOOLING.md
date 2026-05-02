# TODO-P0-TOOLING.md – Phase 0: Development Tooling

This document contains tooling and infrastructure tasks that enable development workflow and code quality. These can run in parallel with other waves.

---

## [ ] TOOLING-001: Create Project Scaffolding Files  
**Status:** ⏳ Not Started  
**Current state:** The codebase has **no `README.md`**, **no `.env.example`**, and **no `.prettierrc`** – these files are completely missing.  
**Definition of Done:** `README.md`, `.env.example`, `.prettierrc` exist and are up‑to‑date.  
**Out of Scope:** Full deployment documentation, advanced ESLint config (ESLint is not configured at all – that can be added in a future tooling pass).  
**Blocks:** All development tasks  
**Blocked By:** none  
**Related Files:** `README.md`, `.env.example`, `.prettierrc`  
**Advanced Code Patterns:** Centralised environment variable documentation; consistent code formatting.  
**Anti-Patterns:** Missing `.env.example` (devs guessing variables), no README (onboarding chaos).  
**Rules to Follow:**  
- `README.md` must explain the project, setup, and architecture highlights.  
- `.env.example` must document every required variable.

**DDD:** N/A – project scaffolding, but the README should mention the domain and bounded contexts.  
**TDD:** N/A.  
**BDD:** N/A.  
**Deep Module:** N/A.

### Subtasks:
- [ ] TOOLING-001.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] TOOLING-001.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] TOOLING-001.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] TOOLING-001.1: Write `README.md` with project overview, quick start, architecture summary, and link to bounded contexts. (AGENT) – `README.md`  
  **Verification:** `README.md` exists and covers all required sections.
- [ ] TOOLING-001.2: Create `.env.example` and environment variable validation. Create Zod schema for `process.env` and validate at server startup. List all required variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `PORTAL_JWT_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `ESIGN_PROVIDER_API_KEY`, `ESIGN_PROVIDER_BASE_URL`, `MAGIC_LINK_EXPIRY_MINUTES`, `PORTAL_JWT_EXPIRY_HOURS`, etc. (AGENT) – `.env.example`, `src/lib/env-validation.ts`  
  **Verification:** `.env.example` lists all required variables with descriptions; server fails fast with clear error messages for missing/invalid variables.
- [ ] TOOLING-001.3: Add `.prettierrc` with project‑wide rules (semi: true, singleQuote: true, trailingComma: 'all'). (AGENT) – `.prettierrc`  
  **Verification:** `pnpm prettier --check src/` runs without errors after configuration.
- [ ] TOOLING-001.4 (AGENT): Add environment variables for new services: `REDIS_URL` (if caching/real‑time component chosen), `MEILISEARCH_URL` or `TYPESENSE_URL` (if external search engine chosen in ADR), `WS_PORT` (if WebSocket server runs separately). Update `.env.example` accordingly.  
  **Verification:** All new variables documented.

---

## [ ] TOOLING-002: Enable Strict TypeScript Flags  
**Status:** ⏳ Not Started  
**Current state:** `tsconfig.base.json` currently has `noImplicitOverride: false`, `noUnusedLocals: false`, `strictFunctionTypes: false` – these are explicitly disabled for prototyping. This task enables them for production rigour.  
**Definition of Done:** `tsconfig.base.json` sets `noImplicitOverride: true`, `noUnusedLocals: true`, `strictFunctionTypes: true`. Workspace typecheck passes.  
**Out of Scope:** Full ESLint integration.  
**Blocks:** All implementation tasks  
**Blocked By:** none  
**Related Files:** `tsconfig.base.json`  
**Advanced Code Patterns:** Strict type checking to catch domain invariant violations at compile time.  
**Anti-Patterns:** Relaxed flags masking missing overloads or unreachable code.  
**Rules to Follow:**  
- Apply changes only to `tsconfig.base.json`.  
- Fix all flagged errors before marking complete.

**DDD:** Strict typing reinforces domain invariants (e.g., email format, required fields) without runtime checks.  
**TDD:** Run `pnpm typecheck` as a test; we will later include typecheck in CI.  
**BDD:** N/A.  
**Deep Module:** N/A.

### Subtasks:
- [ ] TOOLING-002.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] TOOLING-002.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] TOOLING-002.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] TOOLING-002.1: Enable `noImplicitOverride: true` in `tsconfig.base.json`. (AGENT) – `tsconfig.base.json`  
  **Verification:** Flag enabled; typecheck passes or errors are documented.
- [ ] TOOLING-002.2: Enable `noUnusedLocals: true` in `tsconfig.base.json`. (AGENT) – `tsconfig.base.json`  
  **Verification:** Flag enabled; unused locals removed or prefixed with underscore.
- [ ] TOOLING-002.3: Enable `strictFunctionTypes: true` in `tsconfig.base.json`. (AGENT) – `tsconfig.base.json`  
  **Verification:** Flag enabled; function type errors resolved.
- [ ] TOOLING-002.4: Run full workspace typecheck and fix all errors. (AGENT)  
  **Verification:** `pnpm run typecheck` passes without errors.

---

## [ ] TOOLING-003: Audit and Clean Up Unused Dependencies  
**Status:** ⏳ Not Started  
**Current state:** Multiple packages are declared but never imported – e.g., `cookie‑parser`, `react‑hook‑form`, `next‑themes`, `react‑day‑picker`, etc. (see INCOMPLETE.md §12 for full list).  
**Definition of Done:** Unused packages are either wired into a Phase 1 feature or removed, with decision documented.  
**Out of Scope:** Adding new dependencies.  
**Blocks:** All implementation tasks  
**Blocked By:** none  
**Advanced Code Patterns:** Lean dependency tree; only keep what is used.  
**Anti-Patterns:** Leaving dead dependencies that bloat the build and confuse developers.  
**Rules to Follow:**  
- For each package flagged in the analysis, determine if it's needed immediately.  
- If not, remove it (with a comment if it will be reintroduced later).  

**DDD:** N/A – purely technical cleanup.  
**TDD:** N/A.  
**BDD:** N/A.  
**Deep Module:** N/A.

### Subtasks:
- [ ] TOOLING-003.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] TOOLING-003.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] TOOLING-003.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] TOOLING-003.1: Audit list of unused deps and decide fate. (HUMAN)  
  **Verification:** Decision documented in a comment within the relevant `package.json` or in a separate audit file.  
  **Blocks:** TOOLING-003.2 (removal).
- [ ] TOOLING-003.2: Remove those decided as unnecessary. (AGENT) – `package.json` files  
  **Verification:** `pnpm run typecheck` still passes, and a dependency‑check tool (e.g., `npx depcheck`) shows no dead packages.

---

## [ ] TOOLING-004: Pin Zod Version & Verify drizzle‑zod Compatibility  
**Status:** ⏳ Not Started  
**Current state:** `zod` version is catalog‑pinned to `3.25.76`. Actual `drizzle-zod` version is `0.8.3` (not 0.45.2), compatibility must be verified before proceeding.  
**Definition of Done:**  
- Compatibility test passes: `drizzle-zod 0.8.3` works with catalog Zod `3.25.76`.  
- A minimal Drizzle schema + `drizzle‑zod` test exists, proving `createSelectSchema` and `createInsertSchema` work correctly and pass `pnpm typecheck`.  
- Documentation updated to reflect actual compatibility status (compatible or pinned).  
**Out of Scope:** Full ESLint integration.  
**Blocks:** All database schema tasks  
**Blocked By:** DEP-001.4  
**Related Files:** `package.json` (root and relevant workspaces), `lib/db/src/__tests__/zod-compat.test.ts`  
**Advanced Code Patterns:** Dependency pinning to avoid silent type inference breakage.  
**Anti-Patterns:** Floating dependency versions that can introduce incompatibilities without notice.  
**Rules to Follow:**  
- Verify compatibility BEFORE changing any version pin.  
- If Zod 3.25.76 + drizzle-zod 0.8.3 tests pass, document compatibility and do not change the pin.  
- The verification test must generate Zod schemas from a representative Drizzle table and compile cleanly.

**DDD:** N/A – technical plumbing to keep the validation layer (Zod) aligned with the persistence layer (Drizzle).  
**TDD:**  
- Create `lib/db/src/__tests__/zod-compat.test.ts`.  
- Write a test that defines a minimal Drizzle table (e.g., `test_table`) and generates `insertTestTableSchema` / `selectTestTableSchema` using `drizzle‑zod`.  
- The test must verify that `selectTestTableSchema` is a Zod object with the expected shape and that `pnpm typecheck` passes.  
**BDD:** N/A – no user‑visible behaviour.  
**Deep Module:** N/A.

### Subtasks:
- [ ] TOOLING-004.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] TOOLING-004.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] TOOLING-004.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] TOOLING-004.1: Verify Zod 3.25.76 + drizzle-zod 0.8.3 compatibility by running the test in TOOLING‑004.2 BEFORE changing any version pin. If the test passes, REMOVE the version pin change from the task entirely. (AGENT)  
  **Verification:** Test passes → no pin change needed; document finding. Test fails → decide on pin/zod upgrade strategy.
- [ ] TOOLING-004.2: Create a minimal test table in `lib/db/src/__tests__/zod-compat.test.ts` and implement the Zod schema generation assertions. (AGENT)  
  **Verification:** `pnpm vitest run zod-compat` passes; `pnpm typecheck` passes.
- [ ] TOOLING-004.3: Document the compatibility finding in `docs/dependencies.md`. (AGENT)  
  **Verification:** `docs/dependencies.md` states "Zod 3.25.76 is compatible with drizzle-zod 0.8.3 as of [date]; re‑verify on any drizzle‑zod upgrade."
- [ ] TOOLING-004.4: Run `pnpm test` and `pnpm typecheck`; ensure compatibility. (HUMAN)  
  **Verification:** Confirmed.  
  **Blocks:** All schema tasks (Phase 2).

---

## Tooling Wave Completion Criteria

**Wave Status:** [ ] Complete (0/4 parent tasks done)

**Dependencies for Other Waves:**
- TOOLING-001 enables development workflow and environment setup
- TOOLING-002 ensures code quality and type safety
- TOOLING-003 removes dead dependencies for cleaner builds
- TOOLING-004 validates Zod/Drizzle compatibility for schema work

**Parallel Execution:** Can run alongside FOUNDATION, ARCHITECTURE, and BEHAVIOR waves
