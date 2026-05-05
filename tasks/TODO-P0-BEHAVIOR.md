# TODO-P0-BEHAVIOR.md – Phase 0: Behavior Definition

This document contains tasks for defining system behavior through BDD features and error handling. These tasks depend on foundation and architecture completion.

---

## [ ] DOMAIN-003: Write High-Level BDD Features
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No BDD feature files exist. No `docs/features/` directory. System behaviour is entirely unspecified — there are no Gherkin scenarios, no acceptance criteria, and no executable specifications covering any of the 10 business domains.
**Size:** Large

**Description** Produce one `.feature` file per bounded context in `docs/features/`, covering primary user goals (happy path) and all corresponding error/negative scenarios. These feature files will serve as the canonical definition of system behaviour and will be wired to Playwright+Cucumber automation in Phase 5.

**Depends on:** DOMAIN-001, DOMAIN-002
**Blocks:** All implementation phases (Phase 1–5), BDD-AUTO-001, ERROR-003, ERROR-002-EXT.3
**Related Files:** `docs/features/auth.feature`, `docs/features/crm.feature`, `docs/features/projects.feature`, `docs/features/finance.feature`, `docs/features/documents.feature`, `docs/features/assets.feature`, `docs/features/portal.feature`, `docs/features/analytics.feature`, `docs/features/settings.feature`, `docs/features/appointments.feature`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – Gherkin feature file documentation artifacts

**Definition of Done**
- [ ] `docs/features/auth.feature` exists with ≥4 scenarios (register success + duplicate, login success + invalid, logout, token refresh, weak password, expired token, unauthorized access)
- [ ] `docs/features/crm.feature` exists with ≥8 scenarios (pipeline stages, invalid stage transition, duplicate lead, lead conversion, duplicate merge, 360° workspace, assignment change, engagement lifecycle)
- [ ] `docs/features/projects.feature` exists with ≥8 scenarios (project/task creation, status update, task completion with progress rollup, direct-progress rejection, My Week planning, board lane movement, workspace drill-down, template instantiation, recurring work)
- [ ] `docs/features/finance.feature` exists with ≥8 scenarios (create invoice, pay invoice/idempotency, overpayment rejection, budget threshold alert, credit memo, payment run, 1099 tracking, collections workflow, multi-currency)
- [ ] `docs/features/documents.feature` exists with ≥6 scenarios (upload, E-Sign, approval workflow, secure share link, VDR, AI PII detection)
- [ ] `docs/features/assets.feature` exists with ≥4 scenarios (check-out, check-in, maintenance schedule, depreciation)
- [ ] `docs/features/portal.feature` exists with ≥5 scenarios (client onboard, portal login, payment portal, document request, client-side view)
- [ ] `docs/features/analytics.feature` exists with ≥3 scenarios (report generation, cross-domain metric, export)
- [ ] `docs/features/settings.feature` exists with ≥3 scenarios (user invite, role update, integration enable)
- [ ] `docs/features/appointments.feature` exists with ≥8 scenarios (book slot, event type selection, routing form, slot conflict, booking rule violation, waitlist, cancellation/reschedule, no-show)
- [ ] All negative scenarios cross-reference an expected domain error code (e.g., `InvalidStageTransition`, `DuplicateEmail`)
- [ ] All scenarios use ubiquitous language terms from `docs/glossary.md`
- [ ] All feature files approved by HUMAN

**Out of Scope**
- Exhaustive edge-case scenarios (Phase 5 fills gaps incrementally)
- Step definitions or automation (Phase 5, BDD-AUTO-001)
- Implementation of any feature described in the files

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/features/auth.feature`
- Documentation: `docs/features/crm.feature`
- Documentation: `docs/features/projects.feature`
- Documentation: `docs/features/finance.feature`
- Documentation: `docs/features/documents.feature`
- Documentation: `docs/features/assets.feature`
- Documentation: `docs/features/portal.feature`
- Documentation: `docs/features/analytics.feature`
- Documentation: `docs/features/settings.feature`
- Documentation: `docs/features/appointments.feature`

**Rollback**
- Granularity: file-level (per .feature file)
- Halt condition: HUMAN rejects a feature file → revise before wiring to automation

**Rules to Follow**
- Scenarios must use ubiquitous language from `docs/glossary.md` only (no technical jargon)
- Every feature must have a clear business value statement (`In order to... As a... I want to...`)
- Positive and negative paths must both be covered for every feature
- Each feature file must meet the minimum scenario count specified in DoD
- Step definitions must be declarative (what), not imperative (how)
- Step text must be present-tense action: "When the user submits the lead form" not "When user.submit() is called"

**Verification**
```bash
# Manual: verify docs/features/ directory exists with 10 .feature files
# Manual: count scenarios per file and verify minimum counts
# Manual: verify all negative scenarios list expected error codes as comments
# Manual: verify all terms match docs/glossary.md
```

**Advanced Code Patterns**
- Gherkin with ubiquitous language; Scenario Outline with Examples tables for parameterised paths
- Background steps for shared preconditions (e.g., logged-in user)
- Tags for grouping scenarios: @smoke, @negative, @regression
- Three Amigos sessions (business analyst + developer + tester perspective per feature)

**Anti-Patterns**
- Writing scenarios in technical jargon or implementation detail
- Happy-path only feature files (missing negative scenarios)
- Coupling scenarios so they must run in sequence
- Overly granular UI steps ("When the user clicks button X")

**DDD / TDD / BDD / Deep Module notes**
- DDD: Feature files must honour bounded context language — CRM scenarios use CRM glossary, Finance scenarios use Finance glossary. No cross-context terms should leak.
- TDD: [N/A] – specification document
- BDD: This IS the core BDD task. Feature files are the primary bridge between business requirements and implementation. All Phase 1–5 implementation tasks must trace back to a scenario here.
- Deep Module: [N/A]

---

### Subtasks
- [ ] DOMAIN-003.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] DOMAIN-003.0.5 (AGENT): Research latest best practices (as of 05/2026). Review Gherkin 6 syntax updates; BDD best practices in 2026; Playwright+Cucumber integration patterns; Gherkin linting tools (gherkin-lint, spectral-bdd).
- [ ] DOMAIN-003.0.75 (AGENT): Reason about the task. Verify all 10 bounded contexts are covered. If any domain is unclear (e.g., Appointments boundaries), check with user before writing.
- [ ] DOMAIN-003.1 (AGENT): Write `docs/features/auth.feature` — ≥4 scenarios: register (success + duplicate email), login (success + invalid credentials), logout, token refresh, weak password rejection, expired token, unauthorized access attempt.
  **File(s):** `docs/features/auth.feature`
  **Verification:** File exists, ≥4 scenarios, negative paths included, error codes referenced.
- [ ] DOMAIN-003.2 (AGENT): Write `docs/features/crm.feature` — ≥8 scenarios: lead through pipeline, invalid stage transition, duplicate lead creation, lead-to-contact conversion, duplicate merge, 360° workspace retrieval, assignment change, engagement lifecycle.
  **File(s):** `docs/features/crm.feature`
  **Verification:** ≥8 scenarios, negative cases use domain error codes.
- [ ] DOMAIN-003.3 (AGENT): Write `docs/features/projects.feature` — ≥8 scenarios: create project with tasks, status update, task completion triggers progress rollup, direct-progress-override rejection, My Week planning, board lane movement, workspace drill-down, template instantiation, recurring work generation.
  **File(s):** `docs/features/projects.feature`
  **Verification:** ≥8 scenarios, PM error codes cross-referenced.
- [ ] DOMAIN-003.4 (AGENT): Write `docs/features/finance.feature` — ≥8 scenarios: create invoice, pay invoice (idempotency guard), overpayment rejection, budget threshold alert, credit memo application, payment run (batch), 1099 tracking, collections workflow, multi-currency invoice.
  **File(s):** `docs/features/finance.feature`
  **Verification:** ≥8 scenarios, Finance error codes cross-referenced.
- [ ] DOMAIN-003.5 (AGENT): Write `docs/features/documents.feature` — ≥6 scenarios: document upload, E-Sign workflow, approval workflow, secure share link (expiry), VDR room creation, AI PII detection warning.
  **File(s):** `docs/features/documents.feature`
  **Verification:** ≥6 scenarios, document domain error codes included.
- [ ] DOMAIN-003.6 (AGENT): Write `docs/features/assets.feature` — ≥4 scenarios: asset check-out, check-in, maintenance schedule creation, depreciation calculation trigger.
  **File(s):** `docs/features/assets.feature`
  **Verification:** ≥4 scenarios.
- [ ] DOMAIN-003.7 (AGENT): Write `docs/features/portal.feature` — ≥5 scenarios: client onboarding, portal login, payment portal access, document request from client, client-side portal view.
  **File(s):** `docs/features/portal.feature`
  **Verification:** ≥5 scenarios.
- [ ] DOMAIN-003.8 (AGENT): Write `docs/features/analytics.feature` — ≥3 scenarios: cross-domain report generation, domain metric drill-down, report export.
  **File(s):** `docs/features/analytics.feature`
  **Verification:** ≥3 scenarios.
- [ ] DOMAIN-003.9 (AGENT): Write `docs/features/settings.feature` — ≥3 scenarios: user invite, role permission update, integration enable/disable.
  **File(s):** `docs/features/settings.feature`
  **Verification:** ≥3 scenarios.
- [ ] DOMAIN-003.10 (AGENT): Write `docs/features/appointments.feature` — ≥8 scenarios: book an available slot, select event type, routing form logic, slot conflict rejection, booking rule violation, waitlist join, cancellation/reschedule, no-show marking.
  **File(s):** `docs/features/appointments.feature`
  **Verification:** ≥8 scenarios, all terms in glossary.
- [ ] DOMAIN-003.11 (AGENT): For every feature file, verify all negative scenarios have a cross-reference comment to an expected domain error code. Add missing error code references.
  **File(s):** All `docs/features/*.feature`
  **Verification:** Every negative scenario ends with `# Error: <ErrorCode>` comment.
- [ ] DOMAIN-003.12 (HUMAN): Review and approve all 10 feature files for alignment with business goals.
  **Verification:** All feature files approved.
  **Blocks:** All implementation phases (Phase 1–5), ERROR-003, BDD-AUTO-001.
- [ ] DOMAIN-003.13 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] ERROR-003: Extend Domain Error Catalog (Planning)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The original error taxonomy (ERROR-002 in P1) covers only basic contexts. The new feature depth from DOMAIN-003 requires additional error codes for Appointments, advanced Finance, advanced Documents, and CRM/Projects depth. No `docs/error-catalog-extended.md` file exists.
**Size:** Medium

**Description** Extract all negative scenario error codes from the DOMAIN-003 feature files and compile a comprehensive master list in `docs/error-catalog-extended.md`. Every negative scenario from DOMAIN-003 must have a corresponding error code. This catalog drives P1 ERROR-002.6 implementation and cross-context event naming.

**Depends on:** DOMAIN-003
**Blocks:** ERROR-002 implementation (P1), ERROR-002-EXT.3
**Related Files:** `docs/error-catalog-extended.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – catalog documentation artifact

**Definition of Done**
- [ ] `docs/error-catalog-extended.md` exists
- [ ] All negative scenarios from every `docs/features/*.feature` file have a corresponding error code entry
- [ ] Each entry includes: `ErrorCode` (PascalCase), `HttpStatus`, `Context` (bounded context), `Description`, `Recovery hint`
- [ ] Appointments errors covered: `NoShowRecorded`, `WaitlistFull`, `EventTypeNotFound`, `BookingLimitReached`, `SlotConflict`, `BookingRuleViolation`, `CancellationWindowExpired`
- [ ] Finance errors covered: `CreditMemoNotFound`, `PaymentRunNotFound`, `CurrencyMismatch`, `ReconciliationFailed`, `OverpaymentRejected`, `BudgetThresholdExceeded`, `InvoiceAlreadyPaid`, `TaxIdMissing`
- [ ] Documents errors covered: `ApprovalAlreadySubmitted`, `DocumentRetentionPrevented`, `ShareLinkExpired`, `ESignDeclined`, `VDRAccessDenied`, `PIIDetected`
- [ ] CRM errors covered: `LeadConversionFailed`, `DuplicateMergeFailed`, `InvalidStageTransition`, `DuplicateEmail`, `EngagementNotFound`
- [ ] Projects errors covered: `SchedulerConflict`, `RecurringWorkDuplicate`, `DirectProgressOverride`, `TemplateInstantiationFailed`
- [ ] Catalog approved by HUMAN

**Out of Scope**
- Implementing the error classes in TypeScript (Phase 1, ERROR-002.6)
- Error monitoring/alerting setup (Phase 2 infrastructure)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/error-catalog-extended.md`

**Rollback**
- Granularity: file-level
- Halt condition: HUMAN rejects the catalog → revise error codes before any P1 implementation begins

**Rules to Follow**
- Error codes must use ubiquitous language (PascalCase, descriptive, domain-scoped)
- Every error code must map to exactly one bounded context
- Error codes must be sourced from DOMAIN-003 feature file negative scenarios — no invented codes
- HTTP status must be appropriate: 400 for validation/business rule, 404 for not-found, 409 for conflict, 422 for unprocessable, 500 for internal

**Verification**
```bash
# Manual: open docs/error-catalog-extended.md and verify all domains are covered
# Manual: cross-check every negative scenario in docs/features/*.feature against catalog
```

**Advanced Code Patterns**
- Structured error catalog with machine-readable fields (can be used for code generation in Phase 1)
- Error codes as string literals (not numeric) for readability and debuggability
- Domain prefix convention: e.g., `CRM_LEAD_CONVERSION_FAILED` (alternative to PascalCase for catalog)

**Anti-Patterns**
- Generic error codes (`InvalidInput`, `NotFound`) without domain specificity
- Missing HTTP status mapping
- Error codes invented without a corresponding BDD negative scenario
- Overlapping error codes across bounded contexts

**DDD / TDD / BDD / Deep Module notes**
- DDD: Errors must use ubiquitous language and map one-to-one to domain events. Cross-context error propagation must be explicitly named (e.g., `LeadConversionFailed` event emitted by CRM, consumed by Analytics).
- TDD: The catalog drives creation of error class tests in P1 (ERROR-002.6). Each entry becomes a failing test.
- BDD: Every error code is sourced from a negative scenario — the catalog IS the negative scenario vocabulary.
- Deep Module: [N/A]

---

### Subtasks
- [ ] ERROR-003.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ERROR-003.0.5 (AGENT): Research latest best practices (as of 05/2026). Review HTTP status code conventions for REST APIs in 2026; RFC 9457 (Problem Details for HTTP APIs); domain error catalog patterns in DDD.
- [ ] ERROR-003.0.75 (AGENT): Reason about the task. Verify DOMAIN-003 is complete before starting. If feature files are incomplete, list which contexts are missing and block until DOMAIN-003 is done.
- [ ] ERROR-003.1 (AGENT): Read all `docs/features/*.feature` files. Extract every negative scenario and its expected error code cross-reference. Compile into master list.
  **File(s):** `docs/features/*.feature` (read-only), `docs/error-catalog-extended.md` (create)
  **Verification:** `docs/error-catalog-extended.md` exists with entries for every negative scenario.
- [ ] ERROR-003.2 (AGENT): Expand the catalog with error event names for cross-context communication (e.g., `LeadConversionFailed` domain event). Add `EventName` column to catalog.
  **File(s):** `docs/error-catalog-extended.md`
  **Verification:** All cross-context negative scenarios have a corresponding domain event name.
- [ ] ERROR-003.3 (HUMAN): Review and approve the extended error catalog.
  **Verification:** Catalog approved.
  **Blocks:** P1 ERROR-002.6 implementation.
- [ ] ERROR-003.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] INTEGRATE-002: Define Cross-Context Event Flow ADR
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** No definition exists for how events flow between bounded contexts (e.g., CRM lead conversion triggering Finance invoice creation). No ADR for async cross-context communication exists. All 10 bounded contexts are currently isolated with no integration contracts.
**Size:** Small

**Description** Write and accept ADR-011 defining event flow patterns, asynchronous communication strategy, and consistency guarantees between bounded contexts. This ADR provides the architectural backbone for all Phase 3+ cross-context integration scenarios.

**Depends on:** DOMAIN-002, DOMAIN-003
**Blocks:** All cross-context integration implementation (Phase 3+)
**Related Files:** `docs/adr/011-cross-context-event-flow.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – ADR documentation artifact

**Definition of Done**
- [ ] `docs/adr/011-cross-context-event-flow.md` exists with Status: Accepted
- [ ] ADR defines event flow patterns for all cross-context interactions identified in DOMAIN-003 (e.g., CRM→Finance on lead conversion, Projects→Analytics on project completion)
- [ ] ADR specifies: async-only cross-context communication, event schema versioning strategy, at-least-once delivery guarantee, idempotency requirements, and compensation/saga pattern for multi-context operations
- [ ] ADR names at minimum: `LeadConverted`, `ProjectCompleted`, `InvoiceCreated`, `PaymentReceived`, `DocumentSigned`, `AssetCheckedOut`, `AppointmentBooked`
- [ ] ADR approved by HUMAN

**Out of Scope**
- Implementation of event bus or message broker (Phase 3 infrastructure)
- Specific API contracts for event payloads (Phase 3)
- UI notifications triggered by events (Phase 4)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/adr/011-cross-context-event-flow.md`

**Rollback**
- Granularity: file-level (ADR only)
- Halt condition: HUMAN rejects the async event strategy → pause all cross-context integration planning; redesign

**Rules to Follow**
- All cross-context communication must be asynchronous (never synchronous service calls)
- Events must be immutable and append-only
- Failed operations must have named compensation actions (saga pattern)
- Event schemas must be versioned (v1, v2, etc.)
- Event names must use past tense (domain event convention: `OrderPlaced`, not `PlaceOrder`)

**Verification**
```bash
# Manual: open docs/adr/011-cross-context-event-flow.md and verify Status: Accepted
# Manual: verify all 10 bounded context event interactions are documented
```

**Advanced Code Patterns**
- Event sourcing: events as the source of truth for cross-context state changes
- Saga pattern for distributed transactions: choreography (event-driven) preferred over orchestration
- Outbox pattern for reliable event publishing (prevents dual-write problems)
- Idempotency keys on all event handlers (prevent duplicate processing)

**Anti-Patterns**
- Synchronous cross-context calls (tight coupling, availability dependency)
- Missing compensation actions for failed multi-step operations
- Events without schema versioning (breaking changes on schema evolution)
- Domain logic embedded in event handlers (handlers must be pure routers, not business logic)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain events are the primary mechanism for bounded context communication. Each context publishes events for state changes it owns; no context should directly query another context's database.
- TDD: Event handlers must be unit tested with mock event buses. Integration tests verify end-to-end event flows.
- BDD: Cross-context scenarios captured in feature files (e.g., "Given a lead is converted, When the Finance context processes the event, Then an invoice is created") validate this ADR.
- Deep Module: Event bus is a deep module — `publish(event)` / `subscribe(eventType, handler)` interface hides complex routing, delivery, and retry mechanics.

---

### Subtasks
- [ ] INTEGRATE-002.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] INTEGRATE-002.0.5 (AGENT): Research latest best practices (as of 05/2026). Review event-driven architecture patterns (outbox, saga choreography vs. orchestration); compare BullMQ, Kafka, NATS, and in-process event bus for Node.js monolith at MVP scale; review RFC 9635 AsyncAPI 3.0 spec format.
- [ ] INTEGRATE-002.0.75 (AGENT): Reason about the task. If the choice of event infrastructure (in-process vs. external broker) is unclear for MVP scale, raise trade-offs with user before writing ADR.
- [ ] INTEGRATE-002.1 (AGENT): Create `docs/adr/011-cross-context-event-flow.md`. Define: async communication contract, event naming convention, schema versioning, delivery guarantee, saga compensation, and list of initial domain events.
  **File(s):** `docs/adr/011-cross-context-event-flow.md`
  **Verification:** ADR exists with clear event flow patterns and event inventory.
- [ ] INTEGRATE-002.2 (HUMAN): Review and approve event flow ADR.
  **Verification:** ADR approved.
  **Blocks:** Cross-context integration implementation (Phase 3+).
- [ ] INTEGRATE-002.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] BDD-AUTO-001: Define BDD-to-Playwright Automation Strategy
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** BDD feature files will exist after DOMAIN-003, but there is no automation strategy for converting Gherkin features to executable Playwright+Cucumber tests. No `docs/testing/` directory exists. Tool selection and step definition patterns are undefined.
**Size:** Small

**Description** Write and accept a strategy document (`docs/testing/bdd-automation-strategy.md`) defining how DOMAIN-003 Gherkin feature files will be wired to Playwright+Cucumber automated tests in Phase 5. Covers tool selection rationale, step definition architecture, test data strategy, and parallel execution approach.

**Depends on:** DOMAIN-003
**Blocks:** All automated acceptance testing (Phase 5)
**Related Files:** `docs/testing/bdd-automation-strategy.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – strategy documentation artifact

**Definition of Done**
- [ ] `docs/testing/bdd-automation-strategy.md` exists and is accepted
- [ ] Document covers: tool selection (Cucumber.js + Playwright), step definition architecture (page object model), test data strategy (factories, not fixtures), parallel execution approach
- [ ] Document specifies conventions: step definition file structure, tag-based test suite organisation (@smoke, @regression, @negative), reporting format
- [ ] Document defines contract between feature files (DOMAIN-003) and step definitions (Phase 5)
- [ ] Document approved by HUMAN

**Out of Scope**
- Actual implementation of step definitions (Phase 5)
- Tool selection for unit/integration tests (covered in TOOLING-001)
- CI/CD integration for test execution (Phase 3 infrastructure)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/testing/bdd-automation-strategy.md`

**Rollback**
- Granularity: file-level
- Halt condition: HUMAN rejects the strategy → revise before any Phase 5 step definition work begins

**Rules to Follow**
- All step definitions must be reusable across feature files (no duplication)
- Test data must be generated programmatically via factories (never hardcoded or shared state)
- Tests must be designed to run in parallel without conflicts (no shared mutable state)
- UI interactions must go through page objects (not raw Playwright locators in step files)
- Step text must match DOMAIN-003 Gherkin syntax exactly

**Verification**
```bash
# Manual: open docs/testing/bdd-automation-strategy.md and verify all sections present
# Phase 5: pnpm --filter @workspace/apex-os run test:e2e --tag @smoke passes
```

**Advanced Code Patterns**
- Page object model with component objects (reusable UI interaction helpers)
- Step definition composition (shared Given/When/Then steps re-used across all features)
- Test data factory pattern (each test creates its own isolated tenant and data)
- Parallel test execution via Playwright workers with isolated browser contexts

**Anti-Patterns**
- Brittle selectors (CSS class names, XPath) instead of semantic locators (`role`, `label`, `testid`)
- Mixed concerns in step definitions (business logic embedded in step code)
- Hardcoded test data or shared state between tests
- Sequential test dependencies (Test B requires Test A to pass first)

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] – testing infrastructure
- TDD: Step definitions themselves must be unit tested where logic exists
- BDD: This strategy document enables automated execution of DOMAIN-003 BDD scenarios, completing the BDD loop: business specification → feature file → automated test → implementation verification
- Deep Module: Test framework is a deep module — `runScenario(featureFile, tag)` interface hides complex browser automation, state setup, and assertion mechanics

---

### Subtasks
- [ ] BDD-AUTO-001.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] BDD-AUTO-001.0.5 (AGENT): Research latest best practices (as of 05/2026). Review Cucumber.js v10+ with Playwright integration; compare @cucumber/cucumber vs. playwright-bdd library; review parallel execution strategies; review semantic locator best practices in Playwright 1.4x+.
- [ ] BDD-AUTO-001.0.75 (AGENT): Reason about the task. If the choice between `@cucumber/cucumber` and `playwright-bdd` is non-obvious, present trade-offs to user before writing strategy.
- [ ] BDD-AUTO-001.1 (AGENT): Create `docs/testing/bdd-automation-strategy.md` covering tool selection rationale, step definition architecture, page object structure, test data factory pattern, tag conventions, and parallel execution approach.
  **File(s):** `docs/testing/bdd-automation-strategy.md`
  **Verification:** Strategy document exists with all required sections.
- [ ] BDD-AUTO-001.2 (HUMAN): Review and approve automation strategy.
  **Verification:** Strategy approved.
  **Blocks:** Phase 5 automated acceptance test implementation.
- [ ] BDD-AUTO-001.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] ERROR-002-EXT.3: Audit Negative Scenario Coverage
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Feature files from DOMAIN-003 may have gaps in negative scenario coverage. No audit process exists. No `docs/testing/` directory. No systematic check verifies that all domain error codes from ERROR-003 have corresponding Gherkin negative scenarios.
**Size:** Medium

**Description** Perform a systematic audit of all 10 `docs/features/*.feature` files against the `docs/error-catalog-extended.md` catalog. Identify gaps where error codes have no Gherkin scenario. Add missing negative scenarios to the appropriate feature files. Produce a coverage report.

**Depends on:** DOMAIN-003, ERROR-003
**Blocks:** ERROR-002 implementation (P1)
**Related Files:** `docs/testing/negative-scenario-audit.md`, `docs/features/*.feature`, `docs/error-catalog-extended.md`

**Imports / Exports**
- Imports: [N/A]
- Exports: [N/A] – audit report and updated feature files (documentation artifacts)

**Definition of Done**
- [ ] `docs/testing/negative-scenario-audit.md` exists with a coverage matrix: error codes vs. feature files
- [ ] Every error code in `docs/error-catalog-extended.md` has at least one corresponding Gherkin `Scenario` in `docs/features/*.feature`
- [ ] All gaps identified in audit have been resolved (scenarios added to feature files)
- [ ] Coverage report shows 100% error code coverage
- [ ] Updated feature files re-approved by HUMAN if new scenarios were added

**Out of Scope**
- Implementing error handling in TypeScript (Phase 1)
- UI-level error display testing (Phase 4)
- Performance/load testing of error paths (Phase 5)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- This task produces documentation only — no source code files should be created or modified

**Output Artifacts**
- Documentation: `docs/testing/negative-scenario-audit.md` (coverage matrix + gap report)
- Documentation updates: `docs/features/*.feature` (added missing negative scenarios if gaps found)

**Rollback**
- Granularity: file-level (per feature file if new scenarios added)
- Halt condition: ERROR-003 catalog is incomplete → block until ERROR-003 is done

**Rules to Follow**
- Every domain error code must have a corresponding negative Gherkin scenario
- New scenarios added during audit must follow the same conventions as DOMAIN-003
- Audit report must be machine-readable (table format) for future automation
- Error messages in scenarios must be validated (not just error type)
- Boundary conditions must be covered (e.g., exactly-at-limit and one-over-limit scenarios)

**Verification**
```bash
# Manual: open docs/testing/negative-scenario-audit.md and verify 100% coverage matrix
# Manual: verify every row in docs/error-catalog-extended.md has a Feature: reference
```

**Advanced Code Patterns**
- Coverage matrix linking error codes to feature file line numbers
- Boundary value analysis: test at exact limit (N), below (N-1), and above (N+1) for numeric thresholds
- Mutation testing mindset: for every `if (x)` branch in planned implementation, ensure a Gherkin scenario exercises both the true and false path

**Anti-Patterns**
- Happy-path only testing (all positive scenarios, no negatives)
- Missing edge cases that cause production incidents (e.g., exactly-at-limit not tested)
- Untested error conditions (error codes with no corresponding Gherkin scenario)
- Testing error message text that changes frequently (test error type/code instead)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain error handling is part of the model — missing error scenarios mean incomplete domain specification.
- TDD: Audit results drive creation of error-path unit tests in Phase 1. Each gap becomes a failing test.
- BDD: Negative scenarios are first-class BDD citizens. An error code without a Gherkin scenario is an unspecified behaviour.
- Deep Module: [N/A]

---

### Subtasks
- [ ] ERROR-002-EXT.3.0.25 (AGENT): Read the entire task and all related info. No action – pause until fully understood.
- [ ] ERROR-002-EXT.3.0.5 (AGENT): Research latest best practices (as of 05/2026). Review boundary value analysis techniques; mutation testing for error paths; negative test scenario design patterns; RFC 9457 Problem Details format for error documentation.
- [ ] ERROR-002-EXT.3.0.75 (AGENT): Reason about the task. Verify DOMAIN-003 and ERROR-003 are both complete before starting. If either is incomplete, list blocking gaps.
- [ ] ERROR-002-EXT.3.1 (AGENT): Build coverage matrix: for each error code in `docs/error-catalog-extended.md`, find the corresponding negative scenario in `docs/features/*.feature`. Document matches and gaps in `docs/testing/negative-scenario-audit.md`.
  **File(s):** `docs/testing/negative-scenario-audit.md`
  **Verification:** Audit file exists with complete coverage matrix.
- [ ] ERROR-002-EXT.3.2 (AGENT): For each gap identified in ERROR-002-EXT.3.1, add a negative `Scenario` to the appropriate `docs/features/*.feature` file. Scenarios must follow DOMAIN-003 conventions and cross-reference the error code.
  **File(s):** Applicable `docs/features/*.feature` files
  **Verification:** All gaps resolved; coverage matrix updated to show 100%.
- [ ] ERROR-002-EXT.3.3 (HUMAN): Review updated feature files and approve new negative scenarios.
  **Verification:** All additions approved.
  **Blocks:** ERROR-002 Phase 1 implementation.
- [ ] ERROR-002-EXT.3.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## Behavior Wave Completion Criteria

**Wave Status:** [ ] Complete (0/5 parent tasks done)

**Dependencies for Next Waves:**
- DOMAIN-003 provides executable specifications for all implementation
- ERROR-003 defines comprehensive error handling requirements (sourced from DOMAIN-003)
- INTEGRATE-002 defines cross-context event flow patterns
- BDD-AUTO-001 defines automated testing strategy for Phase 5
- ERROR-002-EXT.3 ensures 100% negative scenario coverage

**Next Wave:** TOOLING tasks (can run in parallel with behavior tasks)