# TODO-P0-FOUNDATION.md – Phase 0: Domain Foundation

This document contains the foundational tasks for establishing the domain layer and core dependencies. These tasks must be completed first as they block all other work.

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
- [ ] DEP-001.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] DEP-001.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] DEP-001.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
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
**BDD:** Gherkin scenarios will be written using these terms. The glossary is a prerequisite for all BDD feature files. Academic research confirms that BDD's effectiveness depends on adopting the ubiquitous language from DDD—without it, scenario definitions drift from the business meaning.  
**Deep Module:** N/A – a glossary is a lightweight, public interface to the entire domain.

### Subtasks:
- [ ] DOMAIN-001.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] DOMAIN-001.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] DOMAIN-001.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] DOMAIN-001.1: Draft glossary from existing mock data and module names, including: Organization, Appointment, AvailabilityWindow, BookingRule, TimeSlot, PortalClient, MagicLink, PortalSession, SignatureRequest, Signer, ProjectScheduleView, EventType, RoutingForm, Waitlist, NoShow, CreditMemo, PaymentRun, ReconciliationEntry, ShareLink, VirtualDataRoom. (AGENT) – `docs/glossary.md`  
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
**Definition of Done:** A map (text or diagram) identifying **Identity & Access**, **CRM**, **Project Management**, **Finance**, **Document Management**, **Asset Tracking**, **Client Portal**, **Analytics**, **System Configuration**, **Appointments** (Calendly‑model, fully separate from Projects). The **Projects Scheduler** tab is a PM feature (recurring work planning), not a read‑out of Appointments. Cross‑context dependencies documented.  
**Out of Scope:** Implementation of anti‑corruption layers.  
**Blocks:** All domain modelling tasks (Phase 1)  
**Blocked By:** DOMAIN-001, DEP-001  
**Depends on:** DOMAIN-001, DEP-001  
**Related Files:** `docs/bounded-contexts.md`  
**Advanced Code Patterns:** Context‑constrained development; no cross‑context database joins or tight coupling.  
**Anti-Patterns:** Leaking one context's entities into another's API.  
**Rules to Follow:**  
- Contexts must be respected in database schema, API routes, and service layers.  
- Shared kernel is limited to User reference (with Organization as root).

**DDD:** The context map is the strategic design backbone. It prevents modelling mistakes and guides microservice‑or module‑level separation. In later phases, this map will inform the Consumer‑Driven Contracts (see INTEGRATE‑001) that enforce boundaries between contexts.  
**TDD:** N/A, but the map will be verified by architecture fitness tests later (e.g., no import from CRM in Finance service).  
**BDD:** Each context will have its own feature file; the map ensures scenarios stay within boundaries.  
**Deep Module:** Bounded contexts are the architectural equivalent of deep modules—each exposes a narrow interface (its API) while encapsulating complex internal logic and data. The context map defines these deep module boundaries.

### Subtasks:
- [ ] DOMAIN-002.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] DOMAIN-002.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] DOMAIN-002.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] DOMAIN-002.1: Draft context map based on business modules. (AGENT) – `docs/bounded-contexts.md`  
  **Verification:** File exists; all listed contexts documented with responsibilities and key aggregates.
- [ ] DOMAIN-002.2: Validate map and finalize. (HUMAN)  
  **Verification:** Context map approved.  
  **Blocks:** DOMAIN-003, all later implementation tasks.

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
