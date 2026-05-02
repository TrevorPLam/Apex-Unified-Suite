# TODO-P0-BEHAVIOR.md – Phase 0: Behavior Definition

This document contains tasks for defining system behavior through BDD features and error handling. These tasks depend on foundation and architecture completion.

---

## [ ] DOMAIN-003: Write High-Level BDD Features  
**Status:** ⏳ Not Started  
**Current state:** No BDD feature files exist – behaviour is unspecified.  
**Definition of Done:** One `.feature` file per context in `docs/features/`, covering primary user goals **and corresponding error/negative scenarios** for each feature.  
**Out of Scope:** Exhaustive edge-case scenarios.  
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

**DDD:** Errors must use ubiquitous language and map to BDD negative scenarios.  
**TDD:** The list will drive the creation of error class tests in P1.  
**BDD:** Each error code is sourced from a negative scenario.

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

## Behavior Wave Completion Criteria

**Wave Status:** [ ] Complete (0/2 parent tasks done)

**Dependencies for Next Waves:**
- DOMAIN-003 provides executable specifications for all implementation
- ERROR-002-EXT defines comprehensive error handling requirements

**Next Wave:** TOOLING tasks (can run in parallel with behavior tasks)
