# TODO-P0-BEHAVIOR.md – Phase 0: Behavior Definition

This document contains tasks for defining system behavior through BDD features and error handling. These tasks depend on foundation and architecture completion.

---

## [ ] DOMAIN-003: Write High-Level BDD Features  
**Status:** ⏳ Not Started  
**Current state:** No BDD feature files exist – behaviour is unspecified.  
**Definition of Done:** One `.feature` file per context in `docs/features/`, covering primary user goals **and corresponding error/negative scenarios** for each feature.  
**Out of Scope:** Exhaustive edge-case scenarios; overly detailed implementation specifications.  
**Blocks:** All implementation phases (Phase 1–5)  
**Blocked By:** DOMAIN-001, DOMAIN-002  
**Depends on:** DOMAIN-001, DOMAIN-002  
**Related Files:** `docs/features/auth.feature`, `docs/features/crm.feature`, `docs/features/projects.feature`, `docs/features/finance.feature`, `docs/features/documents.feature`, `docs/features/assets.feature`, `docs/features/portal.feature`, `docs/features/analytics.feature`, `docs/features/settings.feature`, `docs/features/appointments.feature`  
**Advanced Code Patterns:** Gherkin with ubiquitous language; later automated as executable specifications.  
**Anti-Patterns:** Writing features in technical jargon or skipping BDD entirely.  
**Rules to Follow:**  
- Scenarios must use glossary terms.  
- Every feature must have a clear business value.  
- Positive and negative paths must be covered (e.g., successful flow and invalid input/domain rule violation).  
- Each feature file must contain at least the minimum scenario count specified in the subtasks.

**DDD:** N/A – behavior specification.  
**TDD:** N/A – behavior specification.  
**BDD:** This is the core BDD task – defining executable specifications that bridge business requirements and implementation.  
**Deep Module:** N/A.

### Subtasks:
- [ ] DOMAIN-003.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] DOMAIN-003.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] DOMAIN-003.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] DOMAIN-003.1: Write feature file for Identity & Access (`docs/features/auth.feature`) with **≥4 scenarios**: register (success + duplicate), login (success + invalid), logout, token refresh, plus negative cases (weak password, expired token, unauthorized access). (AGENT) – `docs/features/auth.feature`
  **Verification:** `docs/features/auth.feature` contains ≥4 scenarios, includes positive and negative paths, and uses glossary terms.
- [ ] DOMAIN-003.2: Write feature file for CRM (`docs/features/crm.feature`) with **≥8 scenarios** (expanded): process lead through pipeline, invalid stage transition, duplicate lead, lead conversion, duplicate merge, 360 workspace retrieval, assignment change, engagement lifecycle, etc. (AGENT) – `docs/features/crm.feature`
  **Verification:** `docs/features/crm.feature` contains ≥8 scenarios with negative cases.
- [ ] DOMAIN-003.3: Write feature file for Projects (`docs/features/projects.feature`) with **≥8 scenarios** (expanded): create project with tasks, update project status, mark task complete (progress updates), attempt to set progress directly (rejected), My Week planning, board lane movement, project workspace drill-down, template instantiation, recurring work generation. (AGENT) – `docs/features/projects.feature`
  **Verification:** `docs/features/projects.feature` contains ≥8 scenarios with negative paths.
- [ ] DOMAIN-003.4: Write feature file for Finance (`docs/features/finance.feature`) with **≥8 scenarios**: create invoice, pay invoice (idempotency), attempt overpayment, budget threshold alert, credit memo application, payment run (batch), 1099 tracking, collections workflow, multi-currency invoice. (AGENT) – `docs/features/finance.feature`
  **Verification:** `docs/features/finance.feature` contains ≥8 scenarios.
- [ ] DOMAIN-003.5: Write feature files for remaining contexts: Documents (≥6, including E-Sign, approval workflow, secure share link, VDR), Assets (≥4), Portal (≥5, including payment portal access), Analytics (≥3), Settings (≥3), Appointments (≥8, covering event types, routing forms, no-show, waitlist). (AGENT)
  **Verification:** Each file meets minimum scenario count and includes negative paths.
- [ ] DOMAIN-003.7 (NEW/AGENT): Write feature file for **Appointments** (`docs/features/appointments.feature`) with **≥8 scenarios** covering: book an available slot, select event type, routing form logic, slot conflict, booking rule violation, waitlist join, cancellation/reschedule, no-show marking. (AGENT) – `docs/features/appointments.feature`
  **Verification:** ≥8 scenarios, all terms in glossary.
- [ ] DOMAIN-003.8 (NEW/AGENT): Expand CRM feature file (`docs/features/crm.feature`) to include lead conversion, duplicate merge, 360° workspace, engagement lifecycle. (AGENT)
  **Verification:** Scenario count now ≥8, domain errors cross-referenced.
- [ ] DOMAIN-003.9 (NEW/AGENT): Expand Projects feature file (`docs/features/projects.feature`) to include My Week planning, board behaviour, full workspace drill-down, template instantiation, time entry, recurring work generation. (AGENT)
  **Verification:** ≥8 scenarios, all mapped to PM error codes.
- [ ] DOMAIN-003.10 (NEW/AGENT): Expand Documents feature file (`docs/features/documents.feature`) to include secure share link, document request list, approval workflow, version comparison, VDR, AI PII detection. (AGENT)
  **Verification:** ≥6 scenarios, all mapped to document domain errors.
- [ ] DOMAIN-003.11 (NEW/AGENT): Expand Finance feature file (`docs/features/finance.feature`) to include AP inbox capture, payment run, 1099 tracking, collections workflow, multi-currency, credit memo. (AGENT)
  **Verification:** ≥8 scenarios, all mapped to finance domain errors.
- [ ] DOMAIN-003.12 (NEW/AGENT): Expand Portal feature file (`docs/features/portal.feature`) to include payment portal access, document request list from client side. (AGENT)
  **Verification:** ≥5 scenarios.
- [ ] DOMAIN-003.5a: For every feature file, verify that all negative scenarios align with domain error types to be defined in ERROR-002-EXT. Add a cross-reference comment in the feature file. (AGENT)
  **Verification:** All negative scenarios list expected domain error code (e.g., `InvalidStageTransition`, `DuplicateEmail`).
- [ ] DOMAIN-003.6 (HUMAN): Review and approve all feature files for alignment with stakeholder goals.
  **Verification:** All feature files approved.
  **Blocks:** All implementation phases.
  **Note:** Future phases will wire these feature files to Playwright+Cucumber for automated acceptance tests, creating executable specifications that validate the system against business requirements.

---

## [ ] ERROR-002-EXT: Extend Domain Error Catalog (Planning)  
**Status:** ⏳ Not Started  
**Current state:** The original error taxonomy (ERROR-002 in P1) only covers basic contexts. New feature depth requires many additional error codes.  
**Definition of Done:** A comprehensive list of new domain error codes for Appointments, advanced Finance, advanced Documents, and CRM/Projects depth is produced and added to a shared spec (`docs/error-catalog-extended.md`). This list will be used to extend the actual error classes in P1 (ERROR-002.6).  
**Out of Scope:** Implementing the error classes (that's P1).  
**Blocks:** ERROR-002 implementation (P1)  
**Blocked By:** DOMAIN-003 (feature files)  
**Related Files:** `docs/error-catalog-extended.md`

**DDD:** Errors must use ubiquitous language and map to BDD negative scenarios. Event flow mapping ensures errors are properly propagated across bounded contexts.  
**TDD:** The list will drive the creation of error class tests in P1.  
**BDD:** Each error code is sourced from a negative scenario.  
**Event Flow Map:** Error events must be defined for cross-context communication (e.g., LeadConversionFailed event emitted by CRM, consumed by Analytics).

### Subtasks:
- [ ] ERROR-002-EXT.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ERROR-002-EXT.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ERROR-002-EXT.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ERROR-002-EXT.1 (AGENT): Extract all negative scenario error codes from the expanded feature files and compile them into a master list. Ensure coverage for Appointments (NoShowRecorded, WaitlistFull, EventTypeNotFound, BookingLimitReached, etc.), Finance (CreditMemoNotFound, PaymentRunNotFound, CurrencyMismatch, ReconciliationFailed, etc.), Documents (ApprovalAlreadySubmitted, DocumentRetentionPrevented, ShareLinkExpired, etc.), CRM (LeadConversionFailed, DuplicateMergeFailed, etc.), and Projects (SchedulerConflict, RecurringWorkDuplicate, etc.). – `docs/error-catalog-extended.md`
  **Verification:** File exists, all domain errors mapped to scenarios.
- [ ] ERROR-002-EXT.2 (HUMAN): Review and approve the extended error catalog.
  **Verification:** Approved.
  **Blocks:** P1 ERROR-002.6.

---

## [ ] INTEGRATE-002: Define Cross-Context Event Flow ADR  
**Status:** ⏳ Not Started  
**Current state:** No clear definition of how events flow between bounded contexts (e.g., CRM lead conversion creating Finance invoice).  
**Definition of Done:** ADR accepted defining event flow patterns, async communication, and consistency guarantees between contexts.  
**Blocks:** All cross-context integration scenarios  
**Blocked By:** DOMAIN-002, DOMAIN-003  
**Related Files:** `docs/adr/011-cross-context-event-flow.md`

**Advanced Code Patterns:** Event sourcing patterns; saga pattern for distributed transactions; eventual consistency; message broker abstraction.
**Anti-Patterns:** Synchronous cross-context calls; tight coupling between bounded contexts; lack of compensation mechanisms.
**Rules to Follow:**
- All cross-context communication must be asynchronous
- Events must be immutable and append-only
- Failed operations must have compensation actions
- Event schemas must be versioned

**DDD:** Event flow defines how bounded contexts communicate while maintaining autonomy and avoiding tight coupling.
**TDD:** Event handlers must be tested with mock event buses.
**BDD:** Cross-context scenarios must be captured as feature files.
**Deep Module:** Event bus is a deep module hiding complex routing and delivery mechanics.

### Subtasks:
- [ ] INTEGRATE-002.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] INTEGRATE-002.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] INTEGRATE-002.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] INTEGRATE-002.1 (AGENT): Create ADR defining event flow patterns between contexts (CRM→Finance, Projects→Analytics, etc.). – `docs/adr/011-cross-context-event-flow.md`
  **Verification:** ADR exists with clear event flow patterns.
- [ ] INTEGRATE-002.2 (HUMAN): Review and approve event flow ADR.
  **Verification:** ADR approved.
  **Blocks:** Cross-context implementation scenarios.

---

## [ ] BDD-AUTO-001: Define BDD-to-Playwright Automation Strategy  
**Status:** ⏳ Not Started  
**Current state:** BDD feature files exist but no automation strategy defined for converting them to executable tests.  
**Definition of Done:** Strategy accepted for wiring Gherkin features to Playwright+Cucumber tests with automated execution.  
**Blocks:** All automated acceptance testing  
**Blocked By:** DOMAIN-003  
**Related Files:** `docs/testing/bdd-automation-strategy.md`

**Advanced Code Patterns:** Page object model; step definition patterns; test data factories; parallel test execution.
**Anti-Patterns:** Brittle selectors; mixed concerns in step definitions; hard-coded test data; sequential test dependencies.
**Rules to Follow:**
- All step definitions must be reusable across features
- Test data must be generated programmatically
- Tests must run in parallel without conflicts
- UI interactions must use page objects

**DDD:** N/A – testing infrastructure.
**TDD:** Step definitions must be unit tested.
**BDD:** This task enables automated execution of BDD scenarios.
**Deep Module:** Test framework is a deep module hiding complex browser automation.

### Subtasks:
- [ ] BDD-AUTO-001.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] BDD-AUTO-001.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] BDD-AUTO-001.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] BDD-AUTO-001.1 (AGENT): Create BDD automation strategy document. – `docs/testing/bdd-automation-strategy.md`
  **Verification:** Strategy document exists with clear implementation approach.
- [ ] BDD-AUTO-001.2 (HUMAN): Review and approve automation strategy.
  **Verification:** Strategy approved.
  **Blocks:** Automated acceptance test implementation.

---

## [ ] ERROR-002-EXT.3: Audit Negative Scenario Coverage  
**Status:** ⏳ Not Started  
**Current state:** Feature files may miss critical negative scenarios and error handling paths.  
**Definition of Done:** Complete audit of all feature files to ensure comprehensive negative scenario coverage aligned with domain error catalog.  
**Blocks:** ERROR-002 implementation  
**Blocked By:** DOMAIN-003, ERROR-002-EXT  
**Related Files:** `docs/testing/negative-scenario-audit.md`

**Advanced Code Patterns:** Error scenario testing; boundary testing; mutation testing for error paths.
**Anti-Patterns:** Happy-path only testing; missing edge cases; untested error conditions.
**Rules to Follow:**
- Every feature must have negative scenarios
- All domain errors must have corresponding test scenarios
- Error messages must be validated in tests
- Boundary conditions must be tested

**DDD:** Ensures domain error handling is properly specified and tested.
**TDD:** Error paths must have unit test coverage.
**BDD:** Negative scenarios must be captured as Gherkin scenarios.
**Deep Module:** N/A – testing methodology.

### Subtasks:
- [ ] ERROR-002-EXT.3.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ERROR-002-EXT.3.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ERROR-002-EXT.3.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ERROR-002-EXT.3.1 (AGENT): Audit all feature files for negative scenario coverage. – `docs/testing/negative-scenario-audit.md`
  **Verification:** Audit complete with coverage report.
- [ ] ERROR-002-EXT.3.2 (AGENT): Add missing negative scenarios to feature files.
  **Verification:** All features have comprehensive negative coverage.
  **Blocks:** ERROR-002 implementation.

---

## Behavior Wave Completion Criteria

**Wave Status:** [ ] Complete (0/5 parent tasks done)

**Dependencies for Next Waves:**
- DOMAIN-003 provides executable specifications for all implementation
- ERROR-002-EXT defines comprehensive error handling requirements
- INTEGRATE-002 defines cross-context event flow patterns
- BDD-AUTO-001 defines automated testing strategy
- ERROR-002-EXT.3 ensures comprehensive negative scenario coverage

**Next Wave:** TOOLING tasks (can run in parallel with behavior tasks)
