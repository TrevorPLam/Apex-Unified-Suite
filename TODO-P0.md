Now synthesizing all corrections and improvements into an updated **Phase 0** task list. This version incorporates:

- Mandatory `depends_on` / `blocks` chains
- Concrete scenario counts and negative‑scenario requirements for BDD features
- Verification commands on every subtask
- The multi‑tenancy ADR now explicitly includes identity tables as tenant‑scoped
- Human‑decision blocking annotations
- The E‑Sign and Scheduling boundary tasks properly placed and linked

---

# Phase 0 – Domain Foundation & Tooling

*This phase directly addresses the following gaps identified in the [codebase audit](./INCOMPLETE.md):*

- **No domain glossary** – no shared language; terms used inconsistently.
- **No bounded context map** – no architectural boundaries; risk of tight coupling.
- **No BDD feature files** – behaviour is unspecified; all mock data.
- **Missing project scaffolding**: no `README.md`, no `.env.example`, no `.prettierrc`.
- **Strict TypeScript flags disabled** – `tsconfig.base.json` has `noImplicitOverride: false`, `noUnusedLocals: false`, `strictFunctionTypes: false`.
- **Unused dependencies** (e.g., `cookie‑parser`, `react‑hook‑form`, `next‑themes`, etc.) – dead weight.
- **No Zod/Drizzle compatibility guard** – `zod` floating version could break schema generation.

Every task below closes exactly these gaps, with **DDD, TDD, BDD, and Deep Module** coverage injected as context. All updates from the correction round (security, multi‑tenancy scope, testing infrastructure, etc.) are reflected within.

---

## [ ] DEP-001: Add Missing Core Dependencies  
**Status:** ⏳ Not Started  
**Current state:** Critical dependencies missing from workspace catalog: `neverthrow`, `vitest`, `argon2`. These are required for authentication, error handling, and testing tasks.  
**Definition of Done:** All missing dependencies added to `pnpm-workspace.yaml` catalog and test script added to root package.json.  
**Out of Scope:** Upgrading existing dependencies or adding non-essential packages.  
**Blocks:** DOMAIN-001, TOOLING-002, TOOLING-004, all testing and authentication tasks  
**Blocked By:** none  
**Related Files:** `pnpm-workspace.yaml`, `package.json` (root)  
**Advanced Code Patterns:** Workspace catalog management for consistent dependency versions.  
**Anti-Patterns:** Adding dependencies without workspace catalog entries or using floating versions.  
**Rules to Follow:**  
- All dependencies must be added to the workspace catalog, not individual package.json files.  
- Use exact versions with ^ for minor updates allowed.  
- Verify installation succeeds after adding each dependency.

**DDD:** N/A – infrastructure dependency management.  
**TDD:** Test framework setup enables all subsequent TDD tasks.  
**BDD:** N/A – infrastructure prerequisite.  
**Deep Module:** N/A.

### Subtasks:
- [ ] DEP-001.1: Add `neverthrow: ^6.0.1` to workspace catalog for Either pattern in error handling. (AGENT) – `pnpm-workspace.yaml`  
  **verification:** `pnpm install --frozen-lockfile` succeeds; neverthrow available in workspace.
- [ ] DEP-001.2: Add `vitest: ^2.0.0` and `@vitest/ui: ^2.0.0` to workspace catalog for testing framework. (AGENT) – `pnpm-workspace.yaml`  
  **verification:** Vitest installs successfully; `pnpm vitest --version` works.
- [ ] DEP-001.3: Add `argon2: ^0.40.1` to workspace catalog for password hashing in authentication. (AGENT) – `pnpm-workspace.yaml`  
  **verification:** Argon2 installs successfully; available for import.
- [ ] DEP-001.4: Add test script to root package.json. (AGENT) – `package.json`  
  **verification:** `"test": "vitest"` script added; `pnpm run test --version` works.
- [ ] DEP-001.5: Verify all dependencies install correctly together. (AGENT)  
  **verification:** `pnpm install --frozen-lockfile` succeeds; no conflicts.
- [ ] DEP-001.6: Add frontend test framework packages to workspace catalog. (AGENT) – `pnpm-workspace.yaml`  
  **verification:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@vitest/coverage-v8`, and `jsdom` added to catalog; `pnpm install --frozen-lockfile` succeeds.

---

## [ ] DOMAIN-001: Publish a Domain Glossary  
**Status:** ⏳ Not Started  
**Current state:** No domain glossary exists – terms are used inconsistently across the codebase.  
**Definition of Done:** `docs/glossary.md` exists with business terms (Lead, Deal, Invoice, Asset, Project, Task, Organization, etc.) and no synonyms. All future code MUST use these terms.  
**Out of Scope:** Detailed entity lifecycle documentation.  
**Blocks:** DOMAIN-002, DOMAIN-003  
**Blocked By:** DEP-001  
**Related Files:** `docs/glossary.md`  
**Advanced Code Patterns:** Ubiquitous language enforcement; glossary drives naming.  
**Anti-Patterns:** Using technical/database‑centric names instead of domain names.  
**Rules to Follow:**  
- Every domain entity and operation must be listed.  
- Terms must match stakeholder language.  
- The glossary will be referenced by all other tasks.  
- Any term used in a Gherkin feature file must appear in this glossary.

**DDD:** This is the **ubiquitous language**. A shared vocabulary eliminates translation layers between code and business. All bounded contexts must use these terms consistently.  
**TDD:** Not testable per se, but a missing glossary leads to inconsistent naming and broken domain logic. We will review the glossary as part of the first test‑driven schema task.  
**BDD:** Gherkin scenarios will be written using these terms. The glossary is a prerequisite for all BDD feature files. Academic research confirms that BDD’s effectiveness depends on adopting the ubiquitous language from DDD—without it, scenario definitions drift from the business meaning.  
**Deep Module:** N/A – a glossary is a lightweight, public interface to the entire domain.

### Subtasks:
- [ ] DOMAIN-001.1: Draft glossary from existing mock data and module names, including: Organization, Appointment, AvailabilityWindow, BookingRule, TimeSlot, PortalClient, MagicLink, PortalSession, SignatureRequest, Signer, ProjectScheduleView. (AGENT) – `docs/glossary.md`  
  **Verification:** `docs/glossary.md` file exists and contains all listed terms with business definitions; no technical synonyms.
- [ ] DOMAIN-001.1a: Ensure that the glossary is referenced by every feature file; add a validation rule: any term appearing in a Gherkin scenario must exist in the glossary (to be enforced manually during feature review). (AGENT)  
  **Verification:** Cross‑check final feature files (DOMAIN‑003) against glossary; all terms present.
- [ ] DOMAIN-001.2: Review and finalize glossary with domain experts. (HUMAN)  
  **Verification:** Glossary approved by stakeholders.  
  **Blocks:** DOMAIN-002, DOMAIN-003 (all feature file writing).

---

## [ ] DOMAIN-002: Draw the Bounded Context Map  
**Status:** ⏳ Not Started  
**Current state:** No bounded context map exists – architectural boundaries are undefined.  
**Definition of Done:** A map (text or diagram) identifying **Identity & Access**, **CRM**, **Project Management**, **Finance**, **Document Management**, **Asset Tracking**, **Client Portal**, **Analytics**, **System Configuration**, **Scheduling & Appointments**. Cross‑context dependencies documented.  
**Out of Scope:** Implementation of anti‑corruption layers.  
**Blocks:** All domain modelling tasks (Phase 1)  
**Blocked By:** DOMAIN-001, DEP-001  
**Depends on:** DOMAIN-001, DEP-001  
**Related Files:** `docs/bounded-contexts.md`  
**Advanced Code Patterns:** Context‑constrained development; no cross‑context database joins or tight coupling.  
**Anti-Patterns:** Leaking one context’s entities into another’s API.  
**Rules to Follow:**  
- Contexts must be respected in database schema, API routes, and service layers.  
- Shared kernel is limited to User reference (with Organization as root).

**DDD:** The context map is the strategic design backbone. It prevents modelling mistakes and guides microservice‑ or module‑level separation. In later phases, this map will inform the Consumer‑Driven Contracts (see INTEGRATE‑001) that enforce boundaries between contexts.  
**TDD:** N/A, but the map will be verified by architecture fitness tests later (e.g., no import from CRM in Finance service).  
**BDD:** Each context will have its own feature file; the map ensures scenarios stay within boundaries.  
**Deep Module:** Bounded contexts are the architectural equivalent of deep modules—each exposes a narrow interface (its API) while encapsulating complex internal logic and data. The context map defines these deep module boundaries.

### Subtasks:
- [ ] DOMAIN-002.1: Draft context map based on business modules. (AGENT) – `docs/bounded-contexts.md`  
  **Verification:** File exists; all listed contexts documented with responsibilities and key aggregates.
- [ ] DOMAIN-002.2: Validate map and finalize. (HUMAN)  
  **Verification:** Context map approved.  
  **Blocks:** DOMAIN-003, all later implementation tasks.

---

## [ ] ARCH-002: Define Appointments/Scheduling Bounded Context Boundary  
**Status:** ⏳ Not Started  
**Current state:** Scheduling context not defined – appointments functionality missing from bounded contexts.  
**Definition of Done:** Bounded contexts document updated with Scheduling context, Projects Scheduler tab clarified as read‑only view via ACL, `appointments.feature` scenarios added to DOMAIN‑003.  
**Blocks:** DB-APPT-* tasks  
**Blocked By:** DOMAIN-002  
**Depends on:** DOMAIN-002  
**Related Files:** `docs/bounded-contexts.md`, `docs/features/appointments.feature`  

**DDD:** Scheduling & Appointments is a new bounded context (Calendly‑model) separate from Projects. Projects Scheduler tab is a READ‑ONLY projection via anti‑corruption layer.  
**TDD:** N/A – documentation task.  
**BDD:** Appointments feature file added to DOMAIN‑003 subtasks.  
**Deep Module:** The `ProjectSchedulerService` is a shallow adapter; `AppointmentService` is the deep module hiding scheduling complexity.  

### Subtasks:
- [ ] ARCH-002.1 (NEW/AGENT): Update `docs/bounded-contexts.md` (DOMAIN‑002) to add:  
  - New context: **Scheduling & Appointments** (Calendly‑model)  
  - Clarify Projects Scheduler tab: READ‑ONLY view — it renders an `AppointmentServicePort` projection via anti‑corruption layer; Projects context does NOT own scheduling data.  
  - Document the ACL: `ProjectSchedulerService` reads from `AppointmentServicePort` interface. All writes to appointments go through `AppointmentService`.  
  **Verification:** `docs/bounded-contexts.md` updated with Scheduling context and ACL notes.
- [ ] ARCH-002.2 (NEW/AGENT): Add `appointments.feature` to DOMAIN‑003 subtasks:  
  - Scenario: “As a client, I can book an available time slot”  
  - Scenario: “As a firm user, I can define availability windows”  
  - Scenario: “As a client, I cannot book a slot that is already taken (TimeSlotNotAvailable)”  
  - Scenario: “As a firm user, I can cancel an appointment (with reason)”  
  - Scenario: “Booking within minimum advance notice period is rejected (BookingRuleViolation)”  
  **Verification:** `docs/features/appointments.feature` contains at least 5 scenarios covering positive and negative paths.
- [ ] ARCH-002.3 (NEW/HUMAN): Confirm Scheduler tab intent in Projects page is view‑only.  
  **Verification:** Confirmed.  
  **Blocks:** DB-APPT-*, API-APPT-* tasks.

### DOMAIN-004: Define External Integration Architecture
**Status:** ⏳ Not Started  
**Current state:** External integration patterns undefined – calendar, video conferencing, and payment integrations lack architectural boundaries.  
**Definition of Done:** Architecture document updated with integration service boundaries, adapter patterns, and anti-corruption layers for external APIs.  
**Out of Scope:** Specific implementation details of third-party APIs.  
**Blocks:** API-APPT-006 through API-APPT-010 (integration services).  
**Blocked By:** DOMAIN-002, ARCH-002.  
**Depends on:** DOMAIN-002, ARCH-002.  
**Related Files:** `docs/integration-architecture.md`, `docs/bounded-contexts.md`.  

**DDD:** External integrations form separate adapter contexts with well-defined ports.  
**TDD:** N/A – documentation task.  
**Deep Module:** Integration adapters hide external API complexity behind stable interfaces.

### Subtasks:
- [ ] DOMAIN-004.1: Define integration adapter pattern for external APIs. (AGENT) – `docs/integration-architecture.md`  
  **Verification:** Architecture document defines adapter pattern with clear interfaces.
- [ ] DOMAIN-004.2: Document anti-corruption layers for calendar, video, and payment integrations. (AGENT)  
  **Verification:** Each integration has defined boundary and error handling strategy.
- [ ] DOMAIN-004.3: Update bounded contexts map to include integration contexts. (AGENT) – `docs/bounded-contexts.md`  
  **Verification:** Integration contexts properly separated from core business contexts.
- [ ] DOMAIN-004.4: Define integration error handling and retry patterns. (AGENT)  
  **Verification:** Error handling patterns documented for external API failures.

---

## [ ] DOMAIN-003: Write High‑Level BDD Features  
**Status:** ⏳ Not Started  
**Current state:** No BDD feature files exist – behaviour is unspecified.  
**Definition of Done:** One `.feature` file per context in `docs/features/`, covering primary user goals **and corresponding error/negative scenarios** for each feature.  
**Out of Scope:** Exhaustive edge‑case scenarios.  
**Blocks:** All implementation phases (Phase 1–5)  
**Blocked By:** DOMAIN-001, DOMAIN-002, ARCH-002  
**Depends on:** DOMAIN-001, DOMAIN-002, ARCH-002  
**Related Files:** `docs/features/auth.feature`, `docs/features/crm.feature`, `docs/features/projects.feature`, `docs/features/finance.feature`, `docs/features/documents.feature`, `docs/features/assets.feature`, `docs/features/portal.feature`, `docs/features/analytics.feature`, `docs/features/settings.feature`, `docs/features/appointments.feature`  
**Advanced Code Patterns:** Gherkin with ubiquitous language; later automated as executable specifications.  
**Anti-Patterns:** Writing features in technical jargon or skipping BDD entirely.  
**Rules to Follow:**  
- Scenarios must use glossary terms.  
- Every feature must have a clear business value.  
- Positive and negative paths must be covered (e.g., successful flow and invalid input/domain rule violation).  
- Each feature file must contain at least the minimum scenario count specified in the subtasks.

### Subtasks:
- [ ] DOMAIN-003.1: Write feature file for Identity & Access (`docs/features/auth.feature`) with **≥4 scenarios**: register (success + duplicate), login (success + invalid), logout, token refresh, plus negative cases (weak password, expired token, unauthorized access). (AGENT) – `docs/features/auth.feature`
  **Verification:** `docs/features/auth.feature` contains ≥4 scenarios, includes positive and negative paths, and uses glossary terms.
- [ ] DOMAIN-003.2: Write feature file for CRM (`docs/features/crm.feature`) with **≥5 scenarios**: process lead through pipeline, invalid stage transition, duplicate lead, lead not found, unauthorized access, and activity logging. (AGENT) – `docs/features/crm.feature`
  **Verification:** `docs/features/crm.feature` contains ≥5 scenarios with negative cases.
- [ ] DOMAIN-003.3: Write feature file for Projects (`docs/features/projects.feature`) with **≥4 scenarios**: create project with tasks, update project status, mark task complete (progress updates), attempt to set progress directly (rejected). (AGENT) – `docs/features/projects.feature`
  **Verification:** `docs/features/projects.feature` contains ≥4 scenarios with negative paths.
- [ ] DOMAIN-003.4: Write feature file for Finance (`docs/features/finance.feature`) with **≥4 scenarios**: create invoice, pay invoice (idempotency), attempt overpayment, budget threshold alert. (AGENT) – `docs/features/finance.feature`
  **Verification:** `docs/features/finance.feature` contains ≥4 scenarios.
- [ ] DOMAIN-003.5: Write feature files for remaining contexts: Documents (≥4, including E‑Sign), Assets (≥4), Portal (≥4, including permission checks), Analytics (≥3), Settings (≥3). (AGENT)
  **Verification:** Each file meets minimum scenario count and includes negative paths.
- [ ] ARCH-003: E-Sign Scope Decision (V1) – **MOVED AFTER DOMAIN-003.5** (see below)
- [ ] DOMAIN-003.5a: For every feature file, verify that all negative scenarios align with domain error types to be defined in ERROR‑002. Add a cross‑reference comment in the feature file. (AGENT)
  **Verification:** All negative scenarios list expected domain error code (e.g., `InvalidStageTransition`, `DuplicateEmail`).
- [ ] DOMAIN-003.6 (HUMAN): Review and approve all feature files for alignment with stakeholder goals.
  **Verification:** All feature files approved.
  **Blocks:** All implementation phases.
  **Note:** Future phases will wire these feature files to Playwright+Cucumber for automated acceptance tests, creating executable specifications that validate the system against business requirements.
- [ ] ARCH-003: E-Sign Scope Decision (V1)
  **Status:** ⏳ Not Started
  **Current state:** E‑Sign scope undefined – unclear if native implementation or third‑party integration.
  **Definition of Done:** E‑Sign scope confirmed as third‑party integration (SignWell/DocuSign) within Documents context, bounded contexts doc updated, `documents.feature` updated with E‑Sign scenarios.
  **Blocks:** DB-ESIGN-001
  **Blocked By:** none
  **Depends on:** DOMAIN-003.4
  **Related Files:** `docs/bounded-contexts.md`, `docs/features/documents.feature`  

  **DDD:** E‑Sign V1 is implemented as an integration adapter within the Documents bounded context, not a standalone context. Delegates to third‑party provider (SignWell).
  **TDD:** N/A – scope decision.
  **BDD:** E‑Sign scenarios added to `documents.feature`.
  **Deep Module:** N/A – integration adapter pattern.  
-----

## [ ] ARCH-003: E-Sign Scope Decision (V1)  
**Status:** ⏳ Not Started  
**Current state:** E‑Sign scope undefined – unclear if native implementation or third‑party integration.  
**Definition of Done:** E‑Sign scope confirmed as third‑party integration (SignWell/DocuSign) within Documents context, bounded contexts doc updated, `documents.feature` updated with E‑Sign scenarios.  
**Blocks:** DB-ESIGN-001  
**Blocked By:** none  
**Depends on:** DOMAIN-003.4  
**Related Files:** `docs/bounded-contexts.md`, `docs/features/documents.feature`  

**DDD:** E‑Sign V1 is implemented as an integration adapter within the Documents bounded context, not a standalone context. Delegates to third‑party provider (SignWell).  
**TDD:** N/A – scope decision.  
**BDD:** E‑Sign scenarios added to `documents.feature`.  
**Deep Module:** N/A – integration adapter pattern.  

### Subtasks:
- [ ] ARCH-003.1 (NEW/HUMAN): Confirm E‑Sign V1 scope: third‑party integration (SignWell or DocuSign API) as a sub‑domain within Documents context. Native E‑Sign bounded context deferred to V2.  
  **Verification:** Scope confirmed.  
  **Blocks:** DB-ESIGN-001.
- [ ] ARCH-003.2 (NEW/AGENT): Update `docs/bounded-contexts.md` with E‑Sign scope note: "E‑Sign is implemented as an integration adapter within the Documents bounded context. It delegates to a third‑party provider (SignWell). A `signature_requests` table tracks external request IDs and status. A standalone E‑Sign bounded context is V2 scope."  
  **Verification:** `docs/bounded-contexts.md` updated.
- [ ] ARCH-003.3 (NEW/AGENT): Update `docs/features/documents.feature` to add E‑Sign scenarios:  
  - Scenario: "I can send a document for e‑signature via third‑party provider"  
  - Scenario: "Signature status is reflected in the document list"  
  - Scenario: "I cannot send a document for signature if no signers are defined"  
  **Verification:** `docs/features/documents.feature` contains at least 3 E‑Sign scenarios.

---

## [ ] ARCH-004: Mockup Sandbox Deprecation Decision  
**Status:** ⏳ Not Started  
**Current state:** The 67‑file design tool `mockup-sandbox` is never mentioned again in any phase or task.  
**Definition of Done:** Decision made on mockup‑sandbox fate: deprecate, move to legacy folder, or assign maintenance. Documentation updated.  
**Out of Scope:** Complete rewrite or removal of existing functionality.  
**Blocks:** N/A – cleanup task.  
**Related Files:** `artifacts/mockup-sandbox/`, optional `legacy/` folder.  

**DDD:** N/A – tooling decision.  
**TDD:** N/A.  
**BDD:** N/A.  
**Deep Module:** N/A.

### Subtasks:
- [ ] ARCH-004.1 (NEW/HUMAN): Decide fate of mockup-sandbox: deprecate, move to legacy/, or maintain with assigned owner.  
  **Verification:** Decision documented in `docs/tooling-decisions.md`.  
- [ ] ARCH-004.2 (NEW/AGENT): Implement decision: if deprecating, add deprecation notice to README and move to `legacy/mockup-sandbox/`.  
  **Verification:** Mockup sandbox moved; README updated with deprecation notice.

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
- [ ] TOOLING-001.1: Write `README.md` with project overview, quick start, architecture summary, and link to bounded contexts. (AGENT) – `README.md`  
  **Verification:** `README.md` exists and covers all required sections.
- [ ] TOOLING-001.2: Create `.env.example` and environment variable validation. Create Zod schema for `process.env` and validate at server startup. List all required variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `PORTAL_JWT_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `ESIGN_PROVIDER_API_KEY`, `ESIGN_PROVIDER_BASE_URL`, `MAGIC_LINK_EXPIRY_MINUTES`, `PORTAL_JWT_EXPIRY_HOURS`, etc. (AGENT) – `.env.example`, `src/lib/env-validation.ts`  
  **Verification:** `.env.example` lists all required variables with descriptions; server fails fast with clear error messages for missing/invalid variables.
- [ ] TOOLING-001.3: Add `.prettierrc` with project‑wide rules (semi: true, singleQuote: true, trailingComma: 'all'). (AGENT) – `.prettierrc`  
  **Verification:** `pnpm prettier --check src/` runs without errors after configuration.

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
- [ ] TOOLING-002.1: Update `tsconfig.base.json` with strict flags. (AGENT) – `tsconfig.base.json`  
  **Verification:** Diff shows flags set to `true`.
- [ ] TOOLING-002.2: Fix type errors across all packages. (AGENT) – various source files  
  **Verification:** `pnpm typecheck` passes.
- [ ] TOOLING-002.3: Run `pnpm typecheck` and verify pass. (HUMAN)  
  **Verification:** Confirmed; no errors.  
  **Blocks:** All subsequent phases.

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
- For each package flagged in the analysis, determine if it’s needed immediately.  
- If not, remove it (with a comment if it will be reintroduced later).  

**DDD:** N/A – purely technical cleanup.  
**TDD:** N/A.  
**BDD:** N/A.  
**Deep Module:** N/A.

### Subtasks:
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
- If Zod 3.25.76 + drizzle-zod 0.45.2 tests pass, document compatibility and do not change the pin.  
- The verification test must generate Zod schemas from a representative Drizzle table and compile cleanly.

**DDD:** N/A – technical plumbing to keep the validation layer (Zod) aligned with the persistence layer (Drizzle).  
**TDD:**  
- Create `lib/db/src/__tests__/zod-compat.test.ts`.  
- Write a test that defines a minimal Drizzle table (e.g., `test_table`) and generates `insertTestTableSchema` / `selectTestTableSchema` using `drizzle‑zod`.  
- The test must verify that `selectTestTableSchema` is a Zod object with the expected shape and that `pnpm typecheck` passes.  
**BDD:** N/A – no user‑visible behaviour.  
**Deep Module:** N/A.

### Subtasks:
- [ ] TOOLING-004.1: Verify Zod 3.25.76 + drizzle-zod 0.8.3 compatibility by running the test in TOOLING‑004.2 BEFORE changing any version pin. If the test passes, REMOVE the version pin change from the task entirely. (AGENT)  
  **Verification:** Test passes → no pin change needed; document finding. Test fails → decide on pin/zod upgrade strategy.
- [ ] TOOLING-004.2: Create a minimal test table in `lib/db/src/__tests__/zod-compat.test.ts` and implement the Zod schema generation assertions. (AGENT)  
  **Verification:** `pnpm vitest run zod-compat` passes; `pnpm typecheck` passes.
- [ ] TOOLING-004.3: Document the compatibility finding in `docs/dependencies.md`. (AGENT)  
  **Verification:** `docs/dependencies.md` states “Zod 3.25.76 is compatible with drizzle-zod 0.45.2 as of [date]; re‑verify on any drizzle‑zod upgrade.”
- [ ] TOOLING-004.4: Run `pnpm test` and `pnpm typecheck`; ensure compatibility. (HUMAN)  
  **Verification:** Confirmed.  
  **Blocks:** All schema tasks (Phase 2).

---

## [ ] ARCH-005: Define API Versioning Strategy  
**Status:** ⏳ Not Started  
**Current state:** No API versioning strategy defined – endpoints will conflict when evolving.  
**Definition of Done:** ADR accepted establishing `/api/v1/` prefix for all API endpoints from Phase 3 onward, with clear versioning policy and migration path.  
**Out of Scope:** Implementation of multiple concurrent versions (deferred to Phase 6+).  
**Blocks:** All Phase 3+ API implementation tasks  
**Blocked By:** DOMAIN-002 (context map established)  
**Related Files:** `docs/adr/005-api-versioning.md`  

**DDD:** API versioning is a cross-cutting concern that enables bounded context evolution without breaking contracts.  
**TDD:** N/A – architectural decision.  
**BDD:** N/A – infrastructure concern.  
**Deep Module:** N/A.

### Subtasks:
- [ ] ARCH-005.1: Create API versioning ADR with `/api/v1/` prefix policy. (AGENT) – `docs/adr/005-api-versioning.md`  
  **verification:** ADR file exists and defines versioning strategy.
- [ ] ARCH-005.2: Update Phase 3+ task descriptions to reference `/api/v1/` prefix requirement. (AGENT) – TODO-P3.md, TODO-P4.md, TODO-P5.md  
  **verification:** All API endpoint paths in Phase 3+ include `/api/v1/` prefix.
- [ ] ARCH-005.3: Review and approve ADR. (HUMAN)  
  **verification:** ADR approved.
- **Blocks:** All Phase 3+ API development tasks.

---

## [ ] ARCH-001: Define Multi-Tenancy Strategy (BLOCKING)  
**Status:** ⏳ Not Started  
**Current state:** No multi‑tenancy strategy defined – database schema lacks tenant isolation.  
**Blocks:** Every Phase 2 schema task. Must be resolved before DB‑CRM‑001.  
**Blocked By:** none  
**Depends on:** DOMAIN-002, TOOLING-004 (logical, not enforced)  
**Decision Made by Agent:** Shared‑schema with `organization_id` column.  
**Definition of Done:** ADR accepted, base repository implemented, organizations table defined, all Phase 2 schema tasks updated with `organization_id` column requirement (including identity tables).  
**Related Files:** `docs/adr/001-multi-tenancy.md`, `lib/db/src/repositories/base-repository.ts`  

**DDD:** Multi‑tenancy is a cross‑cutting architectural concern. The shared‑schema approach keeps all tenant data in one database while enforcing isolation via `organization_id` filters. Every bounded context must respect this column.  
**TDD:** Repository tests must verify that all queries are automatically scoped to the current tenant.  
**BDD:** N/A – infrastructure concern.  
**Deep Module:** The `BaseRepository` is a deep module – simple interface hiding complex tenant‑scoping logic.  

### Subtasks:
- [ ] ARCH-001.1 (NEW/AGENT): Create `docs/adr/001-multi-tenancy.md` with the following content:  
  - Status: Accepted  
  - Decision: Shared‑schema with `organization_id` column on every business table  
  - Rationale: Drizzle ORM compatibility, simpler migrations, single PostgreSQL database, PostgreSQL RLS provides defense‑in‑depth (Note: RLS is deferred post‑MVP; isolation is handled by BaseRepository automatic tenant filtering)  
  - Convention: Column named `organization_id` (UUID, NOT NULL, FK to `organizations` table) on: **users, roles, user_roles**, leads, contacts, companies, deals, activities, projects, tasks, milestones, invoices, payments, cards, budgets, folders, documents, assets, asset_checkouts, maintenance_logs, portal_clients, analytics reports, settings, audit_logs  
  - Repository filter pattern: automatic injection via BaseRepository (see ARCH‑001.2 in Phase 2)  
  **Verification:** ADR file exists and lists all tables, including identity tables.
- [ ] ARCH-001.2 (NEW/AGENT): This subtask moved to Phase 2 as ARCH‑001.2 — see TODO‑P2.md after DB‑ORG‑001.2.
- [ ] ARCH-001.3 (NEW/AGENT): Add `organizations` table to Phase 2 schema (insert as DB‑ORG‑001):  
  - `id` (uuid PK), `name` (text), `slug` (unique), `plan_type` (enum: free/pro/enterprise), `settings` (JSONB default {}), `created_at`, `updated_at`  
  - This is the anchor table for all `organization_id` foreign keys.  
  **Verification:** Schema test for organizations table passes.
- [ ] ARCH-001.4 (NEW/AGENT): Add `organization_id` column to EVERY schema task in Phase 2, including identity tables that will be moved there. This is a blanket amendment — every DB‑* task's “Definition of Done” must include `organization_id: text('organization_id').notNull().references(() => organizationsTable.id)` with an index on `(organization_id)` for all high‑read tables.  
  **Verification:** All Phase 2 schema tests verify the column.
- [ ] ARCH-001.5 (NEW/HUMAN): Review ADR and confirm the strategy before any Phase 2 work begins.  
  **Verification:** ADR approved.  
  **Blocks:** DB-ORG-001, all DB‑* tasks, TOOLING-004.

---

*End of Phase 0. Next: Phase 1 – Identity & Access (Authentication & Users) — re‑ordered so that identity DB tables are defined after the Organization table in Phase 2, while Phase 1 focuses on OpenAPI, services, and middleware using test doubles.*