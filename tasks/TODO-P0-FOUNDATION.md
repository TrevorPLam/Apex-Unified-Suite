# TODO-P0-FOUNDATION.md – Phase 0: Domain Foundation

This document contains the foundational tasks for establishing the domain layer and core dependencies. These tasks must be completed first as they block all other work.

---

## [ ] DEP-001: Add Missing Core Dependencies
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** `argon2 ^0.40.1`, all `@testing-library/*`, `jsdom ^25.0.1`, and `@vitest/coverage-v8 ^1.6.0` (outdated – must match vitest major) are already in the workspace catalog. Still missing: `neverthrow`, `vitest`, `@vitest/ui`. Root `package.json` has no `test` script.
**Size:** Small

**Description** Add `neverthrow ^8.2.0`, `vitest ^4.1.0`, and `@vitest/ui ^4.1.0` to the pnpm workspace catalog; upgrade the stale `@vitest/coverage-v8 ^1.6.0` → `^4.1.0`; and add a root-level `"test": "vitest"` script — unblocking all testing and authentication tasks.

**Depends on:** [N/A]
**Blocks:** DOMAIN-001, TOOLING-002, TOOLING-004, all testing and authentication tasks
**Related Files:** `pnpm-workspace.yaml`, `package.json` (root)

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A]

**Definition of Done**
- [ ] `neverthrow: ^8.2.0` added to workspace catalog
- [ ] `vitest: ^4.1.0` added to workspace catalog
- [ ] `@vitest/ui: ^4.1.0` added to workspace catalog
- [ ] `@vitest/coverage-v8` upgraded from `^1.6.0` → `^4.1.0` in catalog (must match vitest major)
- [ ] `"test": "vitest"` script present in root `package.json`
- [ ] `pnpm install --frozen-lockfile` succeeds with no peer-dependency conflicts

**Out of Scope**
- Upgrading any existing dependency other than `@vitest/coverage-v8`
- Adding non-essential or speculative packages
- ESLint or Prettier configuration (separate TOOLING tasks)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never modify: `.replit`, root `tsconfig.json`, or the `packages:` list in `pnpm-workspace.yaml` — only edit the `catalog:` section
- Never commit: `.env*`, credentials, secrets
- Never install packages beyond this task's scope without user confirmation

**Output Artifacts**
- Catalog additions/updates in: `pnpm-workspace.yaml`
- Script addition in: `package.json` (root)

**Rollback**
- Granularity: file-level (`pnpm-workspace.yaml`, `package.json`)
- Halt condition: `pnpm install --frozen-lockfile` fails or `pnpm typecheck` regresses → revert catalog entries and remove test script

**Rules to Follow**
- All dependencies must be added to the workspace catalog, not individual `package.json` files
- Use `^` for minor-updates-allowed, matching existing catalog style
- `@vitest/coverage-v8` major version must always match `vitest` major version
- Verify `pnpm install --frozen-lockfile` succeeds before marking any subtask complete

**Verification**
```bash
pnpm install --frozen-lockfile
pnpm vitest --version          # expect 4.x
pnpm typecheck
```

**Advanced Code Patterns**
- Workspace catalog management for consistent dependency versions across the entire monorepo
- `neverthrow` v8 `safeTry` (generator-based) syntax is preferred over the legacy v6 `safeUnwrap()` pattern

**Anti-Patterns**
- Adding `neverthrow` or `vitest` to individual `package.json` files instead of the workspace catalog
- Using floating versions (e.g., `"latest"`) in production workspace catalogs
- Mismatched `vitest` / `@vitest/coverage-v8` major versions — causes runtime coverage-collection failures

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – infrastructure dependency management
- TDD: Test framework setup (`vitest ^4.1.0`) enables all subsequent TDD tasks
- BDD: [N/A] – infrastructure prerequisite
- Deep Module: [N/A]

---

### Subtasks
- [ ] DEP-001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DEP-001.0.5 (AGENT): Research latest best practices (as of 05/2026). Confirm stable versions: `neverthrow ^8.2.0`, `vitest ^4.1.0`, `@vitest/ui ^4.1.0`. Verify which catalog entries already exist and which are stale.
- [ ] DEP-001.0.75 (AGENT): Reason about the task. Cross-check the workspace catalog against every subtask before executing. If any version or catalog entry is uncertain, ask the user.
- [ ] DEP-001.1 (AGENT): Add `neverthrow: ^8.2.0` to workspace catalog for Result/Either-pattern error handling.
  **File(s):** `pnpm-workspace.yaml`
  **Verification:** `pnpm install --frozen-lockfile` succeeds; neverthrow importable from workspace.
- [ ] DEP-001.2 (AGENT): Add `vitest: ^4.1.0` and `@vitest/ui: ^4.1.0` to workspace catalog. Upgrade existing `@vitest/coverage-v8` entry from `^1.6.0` → `^4.1.0`.
  **File(s):** `pnpm-workspace.yaml`
  **Verification:** `pnpm vitest --version` outputs 4.x; `pnpm install --frozen-lockfile` succeeds.
- [ ] DEP-001.3 (AGENT): Verify `argon2: ^0.40.1` is already present in workspace catalog (confirm only — no change needed).
  **File(s):** `pnpm-workspace.yaml`
  **Verification:** Entry confirmed present; no action taken.
- [ ] DEP-001.4 (AGENT): Add `"test": "vitest"` script to root `package.json`.
  **File(s):** `package.json`
  **Verification:** `pnpm run test --version` works.
- [ ] DEP-001.5 (AGENT): Verify all dependencies install correctly together with no peer conflicts.
  **File(s):** workspace root
  **Verification:** `pnpm install --frozen-lockfile` succeeds; `pnpm typecheck` passes.
- [ ] DEP-001.6 (AGENT): Verify frontend test packages (`@testing-library/react ^16.1.0`, `@testing-library/jest-dom ^6.6.3`, `@testing-library/user-event ^14.5.2`, `jsdom ^25.0.1`) are already in catalog (confirm only — flag if versions are stale).
  **File(s):** `pnpm-workspace.yaml`
  **Verification:** All entries confirmed present; `pnpm install --frozen-lockfile` succeeds.
- [ ] DEP-001.7 (HUMAN): Final review and sign-off.
  **Verification:** Approved — all dependencies resolve, `pnpm typecheck` passes.

---

## [ ] DOMAIN-001: Publish a Domain Glossary
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No domain glossary exists. Terms are used inconsistently across the codebase. Mock data (`src/data/mockData.ts`) uses terms like `leads`, `deals`, `invoices` but no canonical definitions exist.
**Size:** Medium

**Description** Create `docs/glossary.md` defining every business entity, aggregate, and operation using precise ubiquitous language, so all future code, BDD scenarios, and documentation share the same canonical vocabulary.

**Depends on:** DEP-001
**Blocks:** DOMAIN-002, DOMAIN-003
**Related Files:** `docs/glossary.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – glossary is a shared reference document

**Definition of Done**
- [ ] `docs/glossary.md` exists with all business entities and operations defined
- [ ] Includes expanded terms: Organization, Appointment, AvailabilityWindow, BookingRule, TimeSlot, PortalClient, MagicLink, PortalSession, SignatureRequest, Signer, ProjectScheduleView, EventType, RoutingForm, Waitlist, NoShow, CreditMemo, PaymentRun, ReconciliationEntry, ShareLink, VirtualDataRoom — plus all base CRM/Finance/Projects/Assets/Analytics terms
- [ ] No technical or database-centric synonyms used (e.g., not `user_id` but `Member`)
- [ ] Preamble states: any term in a Gherkin scenario must exist in this glossary
- [ ] Glossary reviewed and approved by stakeholder (HUMAN sign-off)

**Out of Scope**
- Detailed entity lifecycle documentation or state diagrams
- Data model or ER diagram definitions
- Implementation specifics or database column names

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/glossary.md`

**Rollback**
- Granularity: file-level (`docs/glossary.md`)
- Halt condition: Stakeholder rejects a term definition → revise and resubmit before proceeding to DOMAIN-002

**Rules to Follow**
- Every domain entity and operation must be listed
- Terms must match stakeholder language, not developer shorthand
- The glossary will be referenced by all other tasks
- Any term used in a Gherkin feature file must appear in this glossary

**Verification**
```bash
# Manual: open docs/glossary.md and verify all required terms present
# Cross-check final feature files (DOMAIN-003) against glossary — all terms must be present
```

**Advanced Code Patterns**
- Ubiquitous language enforcement — glossary drives naming across all layers (domain models, API routes, UI labels, test step definitions)

**Anti-Patterns**
- Using technical/database-centric names instead of domain names (e.g., `user_record` instead of `Member`)
- Allowing synonyms for the same concept (e.g., both `Task` and `Todo`)
- Writing glossary in isolation without stakeholder review

**DDD / TDD / BDD / Deep Module notes**
- DDD: This is the **ubiquitous language** — a shared vocabulary eliminating translation layers between code and business. All bounded contexts must use these terms consistently.
- TDD: Not directly testable, but a missing glossary produces inconsistent naming and broken domain logic; validated during first test-driven schema task.
- BDD: Prerequisite for all BDD feature files. BDD effectiveness depends on DDD ubiquitous language — without it, Gherkin scenarios drift from business intent.
- Deep Module: [N/A] — a glossary is a lightweight, public interface to the entire domain.

---

### Subtasks
- [ ] DOMAIN-001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DOMAIN-001.0.5 (AGENT): Research latest best practices (as of 05/2026). Review DDD ubiquitous language patterns; study mock data (`src/data/mockData.ts`) for existing term inventory.
- [ ] DOMAIN-001.0.75 (AGENT): Reason about the task. If any business term is ambiguous or scope is unclear, ask the user before writing.
- [ ] DOMAIN-001.1 (AGENT): Draft glossary from existing mock data and module names, including all expanded terms listed in the Definition of Done.
  **File(s):** `docs/glossary.md`
  **Verification:** File exists; all required terms present with business definitions; no technical synonyms.
- [ ] DOMAIN-001.1a (AGENT): Add validation rule to glossary preamble: any term used in a Gherkin scenario must exist in this glossary. Enforce manually during feature review.
  **File(s):** `docs/glossary.md`
  **Verification:** Preamble includes cross-check rule; validated when DOMAIN-003 feature files are written.
- [ ] DOMAIN-001.2 (HUMAN): Review and finalize glossary with domain experts.
  **Verification:** Glossary approved by stakeholders.
  **Blocks:** DOMAIN-002, DOMAIN-003 (all feature file writing).
- [ ] DOMAIN-001.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] DOMAIN-002: Draw the Bounded Context Map
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No bounded context map exists. Architectural boundaries are undefined, creating risk of cross-context coupling. The 10 business modules exist as UI pages but have no formal context definitions, aggregates, or interface contracts.
**Size:** Medium

**Description** Produce `docs/bounded-contexts.md` identifying all 10 bounded contexts with responsibilities, key aggregates, and cross-context dependencies — establishing the strategic design backbone for all subsequent implementation phases.

**Depends on:** DOMAIN-001, DEP-001
**Blocks:** DOMAIN-003, ARCH-007, ARCH-003, ARCH-001, ARCH-005, DOMAIN-004, all domain modelling tasks (Phase 1)
**Related Files:** `docs/bounded-contexts.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – context map is a shared reference document

**Definition of Done**
- [ ] `docs/bounded-contexts.md` exists
- [ ] All 10 contexts identified: Identity & Access, CRM, Project Management, Finance, Document Management, Asset Tracking, Client Portal, Analytics, System Configuration, Appointments
- [ ] Each context defines: responsibilities, key aggregates, primary data ownership
- [ ] Cross-context dependencies documented (upstream/downstream relationships, shared kernel)
- [ ] Appointments explicitly identified as standalone bounded context (Calendly-model), distinct from PM Scheduler
- [ ] PM Scheduler confirmed as a Projects-owned feature for recurring work planning (not Appointments)
- [ ] Shared kernel limited to User reference (with Organization as root aggregate)
- [ ] Document reviewed and approved by stakeholder

**Out of Scope**
- Implementation of anti-corruption layers (Phase 3+)
- Detailed API contracts between contexts (see ARCH-005)
- Database schema definitions (Phase 2)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/bounded-contexts.md`

**Rollback**
- Granularity: file-level (`docs/bounded-contexts.md`)
- Halt condition: Stakeholder identifies a context boundary conflict → revise context map before proceeding to DOMAIN-003

**Rules to Follow**
- Contexts must be respected in database schema, API routes, and service layers
- Shared kernel is limited to User reference (with Organization as root aggregate)
- No cross-context database joins or tight coupling permitted
- Each context must have a clearly defined primary aggregate

**Verification**
```bash
# Manual: open docs/bounded-contexts.md and verify all 10 contexts present
# Verify Appointments listed as standalone context; PM Scheduler listed under Projects
```

**Advanced Code Patterns**
- Context-constrained development — no cross-context database joins or tight coupling
- Consumer-Driven Contracts (INTEGRATE-001) will be informed by this map in Phase 3+

**Anti-Patterns**
- Leaking one context's entities into another's API (e.g., CRM `Lead` model imported in Finance service)
- Treating Appointments and PM Scheduler as the same context
- Over-granular contexts (micro-bounded contexts) leading to excessive integration complexity

**DDD / TDD / BDD / Deep Module notes**
- DDD: The context map is the strategic design backbone. It prevents modelling mistakes and guides module-level separation. In later phases, it informs Consumer-Driven Contracts (INTEGRATE-001) enforcing boundaries.
- TDD: [N/A] – but will be verified by architecture fitness tests later (e.g., no import from CRM in Finance service).
- BDD: Each context will have its own feature file; the map ensures scenarios stay within boundaries.
- Deep Module: Bounded contexts are the architectural equivalent of deep modules — each exposes a narrow interface (its API) while encapsulating complex internal logic and data.

---

### Subtasks
- [ ] DOMAIN-002.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DOMAIN-002.0.5 (AGENT): Research latest best practices (as of 05/2026). Study DDD context mapping patterns; review Evans and Vernon on strategic design; consider the Appointments-vs-Scheduler distinction carefully.
- [ ] DOMAIN-002.0.75 (AGENT): Reason about the task. If any context boundary is ambiguous, raise with the user before writing the document.
- [ ] DOMAIN-002.1 (AGENT): Draft context map based on business modules, explicitly separating Appointments (Calendly-model) from PM Scheduler (Projects feature).
  **File(s):** `docs/bounded-contexts.md`
  **Verification:** File exists; all 10 contexts documented with responsibilities and key aggregates; Appointments boundary is unambiguous.
- [ ] DOMAIN-002.2 (HUMAN): Validate map and finalize.
  **Verification:** Context map approved.
  **Blocks:** DOMAIN-003, all later implementation tasks.
- [ ] DOMAIN-002.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## Foundation Wave Completion Criteria

**Wave Status:** [ ] Complete (0/3 parent tasks done)

**Dependencies for Next Waves:**
- DEP-001 enables testing and authentication infrastructure
- DOMAIN-001 provides ubiquitous language for all subsequent tasks  
- DOMAIN-002 establishes architectural boundaries

**Next Wave:** ARCHITECTURE tasks (requires foundation completion)

**Note:** Total Phase 0 contains 13 parent tasks across 4 waves:
- Wave 1 (Foundation): 3 tasks
- Wave 2 (Domain): 2 tasks  
- Wave 3 (Architecture): 6 tasks
- Wave 4 (Behavior): 2 tasks
