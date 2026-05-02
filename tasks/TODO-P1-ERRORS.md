# TODO-P1-ERRORS.md – Phase 1: Error Handling Foundation

This document contains error handling tasks that provide the foundation for all authentication and domain operations. These tasks must be completed before service implementation.

---

## [ ] ERROR-002: Define Domain Error Types  
**Status:** ⏳ Not Started  
**Current state:** No domain error types exist – errors will be inconsistent and lack proper classification.  
**Definition of Done:** `artifacts/api-server/src/errors/domain-errors.ts` exports 40+ domain error classes using `neverthrow` Either pattern:  

**Identity & Access Errors:** `InvalidCredentials`, `TokenExpired`, `DuplicateEmail`, `UserNotFound`, `InvalidOrganization`, `InsufficientPermissions`, `RoleNotFound`, `PermissionDenied`  

**CRM Errors:** `InvalidStageTransition`, `LeadNotFound`, `DuplicateLead`, `ContactNotFound`, `DuplicateEmail`, `CompanyNotFound`, `DuplicateDomain`, `DealNotFound`, `InvalidProbability`, `ActivityNotFound`  

**Projects Errors:** `ProjectNotFound`, `TaskNotFound`, `TaskHasUnfinishedSubtasks`, `MilestoneAlreadyCompleted`, `ProgressIsReadOnly`, `InvalidStatusTransition`  

**Finance Errors:** `InvoiceNotFound`, `InvoiceTypeViolation`, `PaymentExceedsBalance`, `BudgetExceeded`, `BudgetThresholdReached`, `DuplicatePayment`, `VirtualCardNotFound`, `InsufficientLimit`  

**Document Errors:** `DocumentNotFound`, `SignatureRequestNotFound`, `DocumentAlreadySigned`, `StorageAdapterError`, `InvalidDocumentType`  

**Asset Errors:** `AssetNotFound`, `AssetNotAvailable`, `CheckoutNotAllowed`, `MaintenanceRequired`, `DepreciationError`  

**Portal Errors:** `MagicLinkInvalid`, `MagicLinkExpired`, `PortalAccessDenied`, `SessionNotFound`  

**Analytics & Settings:** `ReportNotFound`, `InvalidDateRange`, `ConfigurationError`  

**Generic Errors:** `ValidationError`, `DatabaseError`, `NetworkError`, `TimeoutError`

**Anti-Patterns:** Using string literals for errors; throwing exceptions instead of Either pattern; inconsistent error codes.  
**Related Files:** `artifacts/api-server/src/errors/domain-errors.ts`

**DDD:** Domain errors express business rule violations in the ubiquitous language. Each bounded context has its own error taxonomy.  
**TDD:** Write unit tests for each error class – verify error code, message, and metadata structure.  
**BDD:** These error types directly map to negative scenarios in feature files (e.g., `InvalidStageTransition` in CRM feature).  
**Deep Module:** Error module is shallow but provides a typed interface for all domain failures.

### Subtasks:
- [ ] ERROR-002.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ERROR-002.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ERROR-002.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ERROR-002.1: Define base DomainError class with code, message, and metadata structure using neverthrow Either. (AGENT) – `src/errors/domain-errors.ts`  
  **verification:** Base class compiles; Either type works correctly.
- [ ] ERROR-002.2: Implement all Identity & Access error classes (8 errors). (AGENT)  
  **verification:** Unit tests for each error class pass.
- [ ] ERROR-002.3: Implement all CRM error classes (9 errors). **Note:** Cross-reference error codes with integration test expectations - ensure all negative scenarios in feature files map to specific error codes. (AGENT)  
  **verification:** Unit tests pass; error codes match feature file expectations and integration test assertions.
- [ ] ERROR-002.4: Implement Projects, Finance, Documents, Assets, Portal, Analytics error classes (25+ errors). (AGENT)  
  **verification:** All 40+ error classes implemented and tested.
- [ ] ERROR-002.5: Create error factory functions for consistent error creation patterns. (AGENT)  
  **verification:** Factory functions return properly typed Either<Error, never>.
- [ ] ERROR-002.6 (NEW/AGENT): Extend the domain error catalog with the new error types that arise from the expanded BDD feature files (Appointments, advanced Finance, advanced Documents, CRM/Projects depth).  
  Add: `NoShowRecorded`, `WaitlistFull`, `EventTypeNotFound`, `BookingLimitReached`, `InvalidEventTypeConfiguration`, `CollectiveNotAvailable` (Appointments).  
  Add: `CreditMemoNotFound`, `PaymentRunNotFound`, `CurrencyMismatch`, `ReconciliationFailed`, `DuplicatePaymentRun`, `Non1099Vendor`, `TaxMiscalculation` (Finance).  
  Add: `ApprovalAlreadySubmitted`, `DocumentRetentionPrevented`, `ShareLinkExpired`, `InvalidShareLinkToken`, `AnnotationRequired`, `WorkflowStepMissing` (Documents).  
  Add: `LeadConversionFailed`, `DuplicateMergeFailed`, `EngagementNotFound`, `RenewalNotFound`, `ProposalGenerationFailed` (CRM).  
  Add: `SchedulerConflict`, `RecurringWorkDuplicate`, `TemplateVersionNotFound`, `TimeEntryOverlap`, `BudgetActualMismatch` (Projects).  
  **verification:** Unit tests exist for all new error classes; the entire catalog compiles; a cross‑reference shows every negative scenario from the expanded feature files has a matching error; `pnpm typecheck` passes.
- **Depends on:** DEP-001 (neverthrow).  
- **Blocks:** All service implementations in Phase 3 and beyond.

---

## [ ] ERROR-001: Global Express Error Handling Middleware
**Status:** ⏳ Not Started  
**Current state:** No global error handler exists – errors will be inconsistent and lack proper HTTP response formatting.  
**Definition of Done:** `artifacts/api-server/src/middlewares/error-handler.ts` exports global error handling middleware that:
- Catches all errors (sync and async) in Express routes
- Maps `DomainError` instances from ERROR‑002 to appropriate HTTP status codes and standard response envelope
- Handles unexpected errors with generic 500 response
- Logs errors with structured format (request ID, user context)
- Returns consistent error envelope: `{ success: false, error: { code, message, details? } }`
- Integrates with Sentry (when configured) for error tracking

**Error Mapping Examples:**
- `InvalidCredentials` → 401
- `TokenExpired` → 401  
- `DuplicateEmail` → 409
- `LeadNotFound` → 404
- `ValidationError` → 400
- `DatabaseError` → 500
- Unknown errors → 500

**Anti-Patterns:** Leaking implementation details in error messages; inconsistent error formats; missing request correlation.  
**Related Files:** `artifacts/api-server/src/middlewares/error-handler.ts`

**DDD:** Global error handler translates domain errors into HTTP responses while preserving domain semantics.  
**TDD:** Write unit tests for each error mapping scenario.  
**BDD:** Ensures all negative scenarios from feature files return appropriate HTTP responses.  
**Deep Module:** Error handler is a cross-cutting concern that provides a clean interface between domain errors and HTTP responses.

### Subtasks:
- [ ] ERROR-001.0.25: Read the task in full, do not execute any actions until you have read the entire task and all its info, included related files. (AGENT)
- [ ] ERROR-001.0.5: Conduct up to date (05/2026), online research on the topics of the tasks and subtasks. This should include, but not be limited to, proper implementation, best practices, highest standards, advanced code patterns, anti-patterns, etc. (AGENT)
- [ ] ERROR-001.0.75: Reason over the entire task, the targeted and related code files, and your research. Does this task seem accurate, or is something not right? If there is ANY ambiguity or uncertainty, check with the user before execution. (AGENT)
- [ ] ERROR-001.1: Create error handler middleware with DomainError mapping. (AGENT) – `src/middlewares/error-handler.ts`  
  **verification:** Unit tests for error mappings pass.
- [ ] ERROR-001.2: Add structured logging with request ID correlation. (AGENT)  
  **verification:** Error logs include request ID and user context.
- [ ] ERROR-001.3: Integrate error handler as last middleware in Express app. (AGENT) – `app.ts`  
  **verification:** All routes use global error handler.
- [ ] ERROR-001.4: Add Sentry integration (optional, based on env config). (AGENT)  
  **verification:** Errors are sent to Sentry when DSN is provided.
- **Depends on:** ERROR‑002 (domain errors defined).
- **Blocks:** All route implementations (AUTH‑006, API‑CRM‑004, etc.).

---

## Error Handling Wave Completion Criteria

**Wave Status:** [ ] Complete (0/2 parent tasks done)

**Dependencies for Other Waves:**
- ERROR-002 provides domain error types for all services
- ERROR-001 provides consistent HTTP error responses for all routes

**Next Wave:** AUTH-SERVICES (depends on ERROR-002)
