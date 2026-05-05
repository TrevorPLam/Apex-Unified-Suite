# tasks/foundation/DOMAIN.md – Domain Definition & Behavior Foundation

This file contains all tasks related to establishing the domain glossary, bounded context map, and the behavioral specifications (BDD features, error catalog, automation strategy, and negative scenario coverage). These tasks define the shared language and system behavior for all subsequent development phases.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] DOMAIN‑001: Publish a Domain Glossary
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No domain glossary exists. Terms are used inconsistently across the codebase. Mock data uses terms like `leads`, `deals`, `invoices` but no canonical definitions exist.
**Size:** Medium

**Description:** Create `docs/glossary.md` defining every business entity, aggregate, and operation using precise ubiquitous language, so all future code, BDD scenarios, and documentation share the same canonical vocabulary.

**Depends on:** `foundation/TOOLING.md → DEP‑001`
**Blocks:** `foundation/DOMAIN.md → DOMAIN‑002`, `DOMAIN‑003`
**Related Files:** `docs/glossary.md`

**Definition of Done**
- [ ] `docs/glossary.md` exists with all business entities and operations defined
- [ ] Includes expanded terms: Organization, Appointment, AvailabilityWindow, BookingRule, TimeSlot, PortalClient, MagicLink, PortalSession, SignatureRequest, Signer, ProjectScheduleView, EventType, RoutingForm, Waitlist, NoShow, CreditMemo, PaymentRun, ReconciliationEntry, ShareLink, VirtualDataRoom — plus all base CRM/Finance/Projects/Assets/Analytics terms
- [ ] No technical or database‑centric synonyms used (e.g., not `user_id` but `Member`)
- [ ] Preamble states: any term in a Gherkin scenario must exist in this glossary
- [ ] Glossary reviewed and approved by stakeholder (HUMAN sign‑off)

**Out of Scope**
- Detailed entity lifecycle documentation or state diagrams
- Data model or ER diagram definitions
- Implementation specifics or database column names

**Rules to Follow**
- Every domain entity and operation must be listed
- Terms must match stakeholder language, not developer shorthand
- The glossary will be referenced by all other tasks
- Any term used in a Gherkin feature file must appear in this glossary

**Verification**
```bash
# Manual: open docs/glossary.md and verify all required terms present
# Cross‑check final feature files (DOMAIN‑003) against glossary — all terms must be present
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: This is the **ubiquitous language** — a shared vocabulary eliminating translation layers between code and business. All bounded contexts must use these terms consistently.
- TDD: Not directly testable, but a missing glossary produces inconsistent naming and broken domain logic; validated during first test‑driven schema task.
- BDD: Prerequisite for all BDD feature files. BDD effectiveness depends on DDD ubiquitous language — without it, Gherkin scenarios drift from business intent.
- Deep Module: [N/A] — a glossary is a lightweight, public interface to the entire domain.

---

### Subtasks
- [ ] DOMAIN‑001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DOMAIN‑001.0.5 (AGENT): Research latest best practices (as of 05/2026). Review DDD ubiquitous language patterns; study mock data (`src/data/mockData.ts`) for existing term inventory.
- [ ] DOMAIN‑001.0.75 (AGENT): Reason about the task. If any business term is ambiguous or scope is unclear, ask the user before writing.
- [ ] DOMAIN‑001.1 (AGENT): Draft glossary from existing mock data and module names, including all expanded terms listed in the Definition of Done.
  **File(s):** `docs/glossary.md`
  **Verification:** File exists; all required terms present with business definitions; no technical synonyms.
- [ ] DOMAIN‑001.1a (AGENT): Add validation rule to glossary preamble: any term used in a Gherkin scenario must exist in this glossary. Enforce manually during feature review.
  **File(s):** `docs/glossary.md`
  **Verification:** Preamble includes cross‑check rule; validated when DOMAIN‑003 feature files are written.
- [ ] DOMAIN‑001.2 (HUMAN): Review and finalize glossary with domain experts.
  **Verification:** Glossary approved by stakeholders.
  **Blocks:** `DOMAIN‑002`, `DOMAIN‑003`
- [ ] DOMAIN‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DOMAIN‑002: Draw the Bounded Context Map
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No bounded context map exists. Architectural boundaries are undefined, creating risk of cross‑context coupling. The 10 business modules exist as UI pages but have no formal context definitions, aggregates, or interface contracts.
**Size:** Medium

**Description:** Produce `docs/bounded‑contexts.md` identifying all 10 bounded contexts with responsibilities, key aggregates, and cross‑context dependencies — establishing the strategic design backbone for all subsequent implementation phases.

**Depends on:** `foundation/DOMAIN.md → DOMAIN‑001`, `foundation/TOOLING.md → DEP‑001`
**Blocks:** `foundation/DOMAIN.md → DOMAIN‑003`, `foundation/ARCHITECTURE.md → ARCH‑007`, `ARCH‑003`, `ARCH‑001`, `ARCH‑005`, `DOMAIN‑004`, all domain modelling tasks (Phase 1)
**Related Files:** `docs/bounded‑contexts.md`

**Definition of Done**
- [ ] `docs/bounded‑contexts.md` exists
- [ ] All 10 contexts identified: Identity & Access, CRM, Project Management, Finance, Document Management, Asset Tracking, Client Portal, Analytics, System Configuration, Appointments
- [ ] Each context defines: responsibilities, key aggregates, primary data ownership
- [ ] Cross‑context dependencies documented (upstream/downstream relationships, shared kernel)
- [ ] Appointments explicitly identified as standalone bounded context (Calendly‑model), distinct from PM Scheduler
- [ ] PM Scheduler confirmed as a Projects‑owned feature for recurring work planning (not Appointments)
- [ ] Shared kernel limited to User reference (with Organization as root aggregate)
- [ ] Document reviewed and approved by stakeholder

**Out of Scope**
- Implementation of anti‑corruption layers (Phase 3+)
- Detailed API contracts between contexts (see `ARCH‑005`)
- Database schema definitions (Phase 2)

**Rules to Follow**
- Contexts must be respected in database schema, API routes, and service layers
- Shared kernel is limited to User reference (with Organization as root aggregate)
- No cross‑context database joins or tight coupling permitted
- Each context must have a clearly defined primary aggregate

**Verification**
```bash
# Manual: open docs/bounded‑contexts.md and verify all 10 contexts present
# Verify Appointments listed as standalone context; PM Scheduler listed under Projects
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The context map is the strategic design backbone. It prevents modelling mistakes and guides module‑level separation. In later phases, it informs Consumer‑Driven Contracts (INTEGRATE‑001) enforcing boundaries.
- TDD: [N/A] – but will be verified by architecture fitness tests later (e.g., no import from CRM in Finance service).
- BDD: Each context will have its own feature file; the map ensures scenarios stay within boundaries.
- Deep Module: Bounded contexts are the architectural equivalent of deep modules — each exposes a narrow interface (its API) while encapsulating complex internal logic and data.

---

### Subtasks
- [ ] DOMAIN‑002.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DOMAIN‑002.0.5 (AGENT): Research latest best practices (as of 05/2026). Study DDD context mapping patterns; review Evans and Vernon on strategic design; consider the Appointments‑vs‑Scheduler distinction carefully.
- [ ] DOMAIN‑002.0.75 (AGENT): Reason about the task. If any context boundary is ambiguous, raise with the user before writing the document.
- [ ] DOMAIN‑002.1 (AGENT): Draft context map based on business modules, explicitly separating Appointments (Calendly‑model) from PM Scheduler (Projects feature).
  **File(s):** `docs/bounded‑contexts.md`
  **Verification:** File exists; all 10 contexts documented with responsibilities and key aggregates; Appointments boundary is unambiguous.
- [ ] DOMAIN‑002.2 (HUMAN): Validate map and finalize.
  **Verification:** Context map approved.
  **Blocks:** `DOMAIN‑003`, all later implementation tasks.
- [ ] DOMAIN‑002.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] DOMAIN‑003: Write High‑Level BDD Features
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No BDD feature files exist. No `docs/features/` directory. System behaviour is entirely unspecified — there are no Gherkin scenarios, no acceptance criteria, and no executable specifications covering any of the 10 business domains.
**Size:** Large

**Description:** Produce one `.feature` file per bounded context in `docs/features/`, covering primary user goals (happy path) and all corresponding error/negative scenarios. These feature files will serve as the canonical definition of system behaviour and will be wired to Playwright+Cucumber automation in Phase 5.

**Depends on:** `foundation/DOMAIN.md → DOMAIN‑001`, `DOMAIN‑002`
**Blocks:** All implementation phases (Phase 1–5), `foundation/DOMAIN.md → BDD‑AUTO‑001`, `foundation/DOMAIN.md → ERROR‑003`, `ERROR‑002‑EXT.3`
**Related Files:** `docs/features/auth.feature`, `docs/features/crm.feature`, `docs/features/projects.feature`, `docs/features/finance.feature`, `docs/features/documents.feature`, `docs/features/assets.feature`, `docs/features/portal.feature`, `docs/features/analytics.feature`, `docs/features/settings.feature`, `docs/features/appointments.feature`

**Definition of Done**
- [ ] `docs/features/auth.feature` exists with ≥4 scenarios (register success + duplicate, login success + invalid, logout, token refresh, weak password, expired token, unauthorized access)
- [ ] `docs/features/crm.feature` exists with ≥8 scenarios (pipeline stages, invalid stage transition, duplicate lead, lead conversion, duplicate merge, 360° workspace, assignment change, engagement lifecycle)
- [ ] `docs/features/projects.feature` exists with ≥8 scenarios (project/task creation, status update, task completion with progress rollup, direct‑progress rejection, My Week planning, board lane movement, workspace drill‑down, template instantiation, recurring work)
- [ ] `docs/features/finance.feature` exists with ≥8 scenarios (create invoice, pay invoice/idempotency, overpayment rejection, budget threshold alert, credit memo, payment run, 1099 tracking, collections workflow, multi‑currency)
- [ ] `docs/features/documents.feature` exists with ≥6 scenarios (upload, E‑Sign, approval workflow, secure share link, VDR, AI PII detection)
- [ ] `docs/features/assets.feature` exists with ≥4 scenarios (check‑out, check‑in, maintenance schedule, depreciation)
- [ ] `docs/features/portal.feature` exists with ≥5 scenarios (client onboard, portal login, payment portal, document request, client‑side view)
- [ ] `docs/features/analytics.feature` exists with ≥3 scenarios (report generation, cross‑domain metric, export)
- [ ] `docs/features/settings.feature` exists with ≥3 scenarios (user invite, role update, integration enable)
- [ ] `docs/features/appointments.feature` exists with ≥8 scenarios (book slot, event type selection, routing form, slot conflict, booking rule violation, waitlist, cancellation/reschedule, no‑show)
- [ ] All negative scenarios cross‑reference an expected domain error code (e.g., `InvalidStageTransition`, `DuplicateEmail`)
- [ ] All scenarios use ubiquitous language terms from `docs/glossary.md`
- [ ] All feature files approved by HUMAN

**Out of Scope**
- Exhaustive edge‑case scenarios (Phase 5 fills gaps incrementally)
- Step definitions or automation (Phase 5, `BDD‑AUTO‑001`)
- Implementation of any feature described in the files

**Rules to Follow**
- Scenarios must use ubiquitous language from `docs/glossary.md` only (no technical jargon)
- Every feature must have a clear business value statement (`In order to... As a... I want to...`)
- Positive and negative paths must both be covered for every feature
- Each feature file must meet the minimum scenario count specified in DoD
- Step definitions must be declarative (what), not imperative (how)
- Step text must be present‑tense action: "When the user submits the lead form" not "When user.submit() is called"

**Verification**
```bash
# Manual: verify docs/features/ directory exists with 10 .feature files
# Manual: count scenarios per file and verify minimum counts
# Manual: verify all negative scenarios list expected error codes as comments
# Manual: verify all terms match docs/glossary.md
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Feature files must honour bounded context language — CRM scenarios use CRM glossary, Finance scenarios use Finance glossary. No cross‑context terms should leak.
- TDD: [N/A] – specification document
- BDD: This IS the core BDD task. Feature files are the primary bridge between business requirements and implementation. All Phase 1–5 implementation tasks must trace back to a scenario here.
- Deep Module: [N/A]

---

### Subtasks
- [ ] DOMAIN‑003.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DOMAIN‑003.0.5 (AGENT): Research latest best practices (as of 05/2026). Review Gherkin 6 syntax updates; BDD best practices in 2026; Playwright+Cucumber integration patterns; Gherkin linting tools (gherkin‑lint, spectral‑bdd).
- [ ] DOMAIN‑003.0.75 (AGENT): Reason about the task. Verify all 10 bounded contexts are covered. If any domain is unclear (e.g., Appointments boundaries), check with user before writing.
- [ ] DOMAIN‑003.1 (AGENT): Write `docs/features/auth.feature` — ≥4 scenarios.
- [ ] DOMAIN‑003.2 (AGENT): Write `docs/features/crm.feature` — ≥8 scenarios.
- [ ] DOMAIN‑003.3 (AGENT): Write `docs/features/projects.feature` — ≥8 scenarios.
- [ ] DOMAIN‑003.4 (AGENT): Write `docs/features/finance.feature` — ≥8 scenarios.
- [ ] DOMAIN‑003.5 (AGENT): Write `docs/features/documents.feature` — ≥6 scenarios.
- [ ] DOMAIN‑003.6 (AGENT): Write `docs/features/assets.feature` — ≥4 scenarios.
- [ ] DOMAIN‑003.7 (AGENT): Write `docs/features/portal.feature` — ≥5 scenarios.
- [ ] DOMAIN‑003.8 (AGENT): Write `docs/features/analytics.feature` — ≥3 scenarios.
- [ ] DOMAIN‑003.9 (AGENT): Write `docs/features/settings.feature` — ≥3 scenarios.
- [ ] DOMAIN‑003.10 (AGENT): Write `docs/features/appointments.feature` — ≥8 scenarios.
- [ ] DOMAIN‑003.11 (AGENT): For every feature file, verify all negative scenarios have a cross‑reference comment to an expected domain error code. Add missing error code references.
- [ ] DOMAIN‑003.12 (HUMAN): Review and approve all 10 feature files for alignment with business goals.
  **Blocks:** All implementation phases (Phase 1–5), `ERROR‑003`, `BDD‑AUTO‑001`.
- [ ] DOMAIN‑003.13 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] ERROR‑003: Extend Domain Error Catalog (Planning)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The original error taxonomy (ERROR‑002 in P1) covers only basic contexts. The new feature depth from DOMAIN‑003 requires additional error codes for Appointments, advanced Finance, advanced Documents, and CRM/Projects depth. No `docs/error‑catalog‑extended.md` file exists.
**Size:** Medium

**Description:** Extract all negative scenario error codes from the DOMAIN‑003 feature files and compile a comprehensive master list in `docs/error‑catalog‑extended.md`. Every negative scenario from DOMAIN‑003 must have a corresponding error code. This catalog drives P1 ERROR‑002.6 implementation and cross‑context event naming.

**Depends on:** `foundation/DOMAIN.md → DOMAIN‑003`
**Blocks:** `infrastructure/AUTH.md → ERROR‑002` implementation (P1), `foundation/DOMAIN.md → ERROR‑002‑EXT.3`
**Related Files:** `docs/error‑catalog‑extended.md`

**Definition of Done**
- [ ] `docs/error‑catalog‑extended.md` exists
- [ ] All negative scenarios from every `docs/features/*.feature` file have a corresponding error code entry
- [ ] Each entry includes: `ErrorCode` (PascalCase), `HttpStatus`, `Context` (bounded context), `Description`, `Recovery hint`
- [ ] Appointments errors covered: `NoShowRecorded`, `WaitlistFull`, `EventTypeNotFound`, `BookingLimitReached`, `SlotConflict`, `BookingRuleViolation`, `CancellationWindowExpired`
- [ ] Finance errors covered: `CreditMemoNotFound`, `PaymentRunNotFound`, `CurrencyMismatch`, `ReconciliationFailed`, `OverpaymentRejected`, `BudgetThresholdExceeded`, `InvoiceAlreadyPaid`, `TaxIdMissing`
- [ ] Documents errors covered: `ApprovalAlreadySubmitted`, `DocumentRetentionPrevented`, `ShareLinkExpired`, `ESignDeclined`, `VDRAccessDenied`, `PIIDetected`
- [ ] CRM errors covered: `LeadConversionFailed`, `DuplicateMergeFailed`, `InvalidStageTransition`, `DuplicateEmail`, `EngagementNotFound`
- [ ] Projects errors covered: `SchedulerConflict`, `RecurringWorkDuplicate`, `DirectProgressOverride`, `TemplateInstantiationFailed`
- [ ] Catalog approved by HUMAN

**Out of Scope**
- Implementing the error classes in TypeScript (Phase 1, `ERROR‑002.6`)
- Error monitoring/alerting setup (Phase 2 infrastructure)

**Rules to Follow**
- Error codes must use ubiquitous language (PascalCase, descriptive, domain‑scoped)
- Every error code must map to exactly one bounded context
- Error codes must be sourced from DOMAIN‑003 feature file negative scenarios — no invented codes
- HTTP status must be appropriate: 400 for validation/business rule, 404 for not‑found, 409 for conflict, 422 for unprocessable, 500 for internal

**Verification**
```bash
# Manual: open docs/error‑catalog‑extended.md and verify all domains are covered
# Manual: cross‑check every negative scenario in docs/features/*.feature against catalog
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Errors must use ubiquitous language and map one‑to‑one to domain events. Cross‑context error propagation must be explicitly named (e.g., `LeadConversionFailed` event emitted by CRM, consumed by Analytics).
- TDD: The catalog drives creation of error class tests in P1 (`ERROR‑002.6`). Each entry becomes a failing test.
- BDD: Every error code is sourced from a negative scenario — the catalog IS the negative scenario vocabulary.
- Deep Module: [N/A]

---

### Subtasks
- [ ] ERROR‑003.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ERROR‑003.0.5 (AGENT): Research latest best practices (as of 05/2026). Review HTTP status code conventions for REST APIs in 2026; RFC 9457 (Problem Details for HTTP APIs); domain error catalog patterns in DDD.
- [ ] ERROR‑003.0.75 (AGENT): Reason about the task. Verify DOMAIN‑003 is complete before starting. If feature files are incomplete, list which contexts are missing and block until DOMAIN‑003 is done.
- [ ] ERROR‑003.1 (AGENT): Read all `docs/features/*.feature` files. Extract every negative scenario and its expected error code cross‑reference. Compile into master list.
  **File(s):** `docs/features/*.feature` (read‑only), `docs/error‑catalog‑extended.md` (create)
  **Verification:** `docs/error‑catalog‑extended.md` exists with entries for every negative scenario.
- [ ] ERROR‑003.2 (AGENT): Expand the catalog with error event names for cross‑context communication (e.g., `LeadConversionFailed` domain event). Add `EventName` column to catalog.
  **File(s):** `docs/error‑catalog‑extended.md`
  **Verification:** All cross‑context negative scenarios have a corresponding domain event name.
- [ ] ERROR‑003.3 (HUMAN): Review and approve the extended error catalog.
  **Verification:** Catalog approved.
  **Blocks:** P1 `ERROR‑002.6` implementation.
- [ ] ERROR‑003.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] BDD‑AUTO‑001: Define BDD‑to‑Playwright Automation Strategy
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** BDD feature files will exist after DOMAIN‑003, but there is no automation strategy for converting Gherkin features to executable Playwright+Cucumber tests. No `docs/testing/` directory exists. Tool selection and step definition patterns are undefined.
**Size:** Small

**Description:** Write and accept a strategy document (`docs/testing/bdd‑automation‑strategy.md`) defining how DOMAIN‑003 Gherkin feature files will be wired to Playwright+Cucumber automated tests in Phase 5. Covers tool selection rationale, step definition architecture, test data strategy, and parallel execution approach.

**Depends on:** `foundation/DOMAIN.md → DOMAIN‑003`
**Blocks:** All automated acceptance testing (Phase 5)
**Related Files:** `docs/testing/bdd‑automation‑strategy.md`

**Definition of Done**
- [ ] `docs/testing/bdd‑automation‑strategy.md` exists and is accepted
- [ ] Document covers: tool selection (Cucumber.js + Playwright), step definition architecture (page object model), test data strategy (factories, not fixtures), parallel execution approach
- [ ] Document specifies conventions: step definition file structure, tag‑based test suite organisation (@smoke, @regression, @negative), reporting format
- [ ] Document defines contract between feature files (DOMAIN‑003) and step definitions (Phase 5)
- [ ] Document approved by HUMAN

**Out of Scope**
- Actual implementation of step definitions (Phase 5)
- Tool selection for unit/integration tests (covered in `TOOLING‑001`)
- CI/CD integration for test execution (Phase 3 infrastructure)

**Rules to Follow**
- All step definitions must be reusable across feature files (no duplication)
- Test data must be generated programmatically via factories (never hardcoded or shared state)
- Tests must be designed to run in parallel without conflicts (no shared mutable state)
- UI interactions must go through page objects (not raw Playwright locators in step files)
- Step text must match DOMAIN‑003 Gherkin syntax exactly

**Verification**
```bash
# Manual: open docs/testing/bdd‑automation‑strategy.md and verify all sections present
# Phase 5: pnpm --filter @workspace/apex-os run test:e2e --tag @smoke passes
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – testing infrastructure
- TDD: Step definitions themselves must be unit tested where logic exists
- BDD: This strategy document enables automated execution of DOMAIN‑003 BDD scenarios, completing the BDD loop: business specification → feature file → automated test → implementation verification
- Deep Module: Test framework is a deep module — `runScenario(featureFile, tag)` interface hides complex browser automation, state setup, and assertion mechanics

---

### Subtasks
- [ ] BDD‑AUTO‑001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] BDD‑AUTO‑001.0.5 (AGENT): Research latest best practices (as of 05/2026). Review Cucumber.js v10+ with Playwright integration; compare @cucumber/cucumber vs. playwright‑bdd library; review parallel execution strategies; review semantic locator best practices in Playwright 1.4x+.
- [ ] BDD‑AUTO‑001.0.75 (AGENT): Reason about the task. If the choice between `@cucumber/cucumber` and `playwright‑bdd` is non‑obvious, present trade‑offs to user before writing strategy.
- [ ] BDD‑AUTO‑001.1 (AGENT): Create `docs/testing/bdd‑automation‑strategy.md` covering tool selection rationale, step definition architecture, page object structure, test data factory pattern, tag conventions, and parallel execution approach.
  **File(s):** `docs/testing/bdd‑automation‑strategy.md`
  **Verification:** Strategy document exists with all required sections.
- [ ] BDD‑AUTO‑001.2 (HUMAN): Review and approve automation strategy.
  **Verification:** Strategy approved.
  **Blocks:** Phase 5 automated acceptance test implementation.
- [ ] BDD‑AUTO‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] ERROR‑002‑EXT.3: Audit Negative Scenario Coverage
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Feature files from DOMAIN‑003 may have gaps in negative scenario coverage. No audit process exists. No `docs/testing/` directory. No systematic check verifies that all domain error codes from ERROR‑003 have corresponding Gherkin negative scenarios.
**Size:** Medium

**Description:** Perform a systematic audit of all 10 `docs/features/*.feature` files against the `docs/error‑catalog‑extended.md` catalog. Identify gaps where error codes have no Gherkin scenario. Add missing negative scenarios to the appropriate feature files. Produce a coverage report.

**Depends on:** `foundation/DOMAIN.md → DOMAIN‑003`, `ERROR‑003`
**Blocks:** `infrastructure/AUTH.md → ERROR‑002` implementation (P1)
**Related Files:** `docs/testing/negative‑scenario‑audit.md`, `docs/features/*.feature`, `docs/error‑catalog‑extended.md`

**Definition of Done**
- [ ] `docs/testing/negative‑scenario‑audit.md` exists with a coverage matrix: error codes vs. feature files
- [ ] Every error code in `docs/error‑catalog‑extended.md` has at least one corresponding Gherkin `Scenario` in `docs/features/*.feature`
- [ ] All gaps identified in audit have been resolved (scenarios added to feature files)
- [ ] Coverage report shows 100% error code coverage
- [ ] Updated feature files re‑approved by HUMAN if new scenarios were added

**Out of Scope**
- Implementing error handling in TypeScript (Phase 1)
- UI‑level error display testing (Phase 4)
- Performance/load testing of error paths (Phase 5)

**Rules to Follow**
- Every domain error code must have a corresponding negative Gherkin scenario
- New scenarios added during audit must follow the same conventions as DOMAIN‑003
- Audit report must be machine‑readable (table format) for future automation
- Error messages in scenarios must be validated (not just error type)
- Boundary conditions must be covered (e.g., exactly‑at‑limit and one‑over‑limit scenarios)

**Verification**
```bash
# Manual: open docs/testing/negative‑scenario‑audit.md and verify 100% coverage matrix
# Manual: verify every row in docs/error‑catalog‑extended.md has a Feature: reference
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain error handling is part of the model — missing error scenarios mean incomplete domain specification.
- TDD: Audit results drive creation of error‑path unit tests in Phase 1. Each gap becomes a failing test.
- BDD: Negative scenarios are first‑class BDD citizens. An error code without a Gherkin scenario is an unspecified behaviour.
- Deep Module: [N/A]

---

### Subtasks
- [ ] ERROR‑002‑EXT.3.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ERROR‑002‑EXT.3.0.5 (AGENT): Research latest best practices (as of 05/2026). Review boundary value analysis techniques; mutation testing for error paths; negative test scenario design patterns; RFC 9457 Problem Details format for error documentation.
- [ ] ERROR‑002‑EXT.3.0.75 (AGENT): Reason about the task. Verify DOMAIN‑003 and ERROR‑003 are both complete before starting. If either is incomplete, list blocking gaps.
- [ ] ERROR‑002‑EXT.3.1 (AGENT): Build coverage matrix: for each error code in `docs/error‑catalog‑extended.md`, find the corresponding negative scenario in `docs/features/*.feature`. Document matches and gaps in `docs/testing/negative‑scenario‑audit.md`.
  **File(s):** `docs/testing/negative‑scenario‑audit.md`
  **Verification:** Audit file exists with complete coverage matrix.
- [ ] ERROR‑002‑EXT.3.2 (AGENT): For each gap identified in ERROR‑002‑EXT.3.1, add a negative `Scenario` to the appropriate `docs/features/*.feature` file. Scenarios must follow DOMAIN‑003 conventions and cross‑reference the error code.
  **File(s):** Applicable `docs/features/*.feature` files
  **Verification:** All gaps resolved; coverage matrix updated to show 100%.
- [ ] ERROR‑002‑EXT.3.3 (HUMAN): Review updated feature files and approve new negative scenarios.
  **Verification:** All additions approved.
  **Blocks:** `ERROR‑002` Phase 1 implementation.
- [ ] ERROR‑002‑EXT.3.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---