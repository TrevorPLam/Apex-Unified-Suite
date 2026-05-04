# TODO-P6-ADVANCED.md – Phase 6: Advanced Features & Opportunities

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

# Phase 6 – Production Readiness & DevOps (Advanced Features & Opportunities)

*This section contains advanced AP/AR features that need detailed specifications and enhancement opportunities for post‑MVP development. These tasks are largely stubs or deferred to later phases. Advanced features are separated from production-readiness tasks to maintain clear scope boundaries.*

---

## Phase 6 Task Index (Advanced Features & Opportunities)

### Advanced AP/AR Features (Deferred / Specification Needed)
- [ ] AI‑AP‑001 – Smart Invoice Coding (AI‑powered)  
- [ ] AI‑AP‑002 – Duplicate Detection Engine  
- [ ] ADV‑AP‑001 – Early Payment Discount Management  
- [ ] ADV‑AR‑001 – Credit Management & Risk Scoring  
- [ ] ADV‑AR‑002 – Automated Collections Workflow  
- [ ] ADV‑AR‑003 – Usage‑Based & Metered Billing  
- [ ] MULTI‑AP‑001 – Multi‑Entity AP/AR (Cross‑Entity Payments)  
- [ ] INT‑QB‑001 – QuickBooks Online Sync (Stub)  

### Enhancement Opportunities (Phase 6+)
- [ ] OPPORTUNITY‑001 – Storybook Integration  
- [ ] OPPORTUNITY‑002 – SAST/DAST Security Scanning  

---

## Advanced AP/AR Features

*These tasks are retained from the original Phase 6. They are largely stubs or deferred to later phases. As noted in the research, they need more detailed specifications before an agent can execute them.*

### ⚠️ AI‑AP‑001: Smart Invoice Coding (AI‑powered) – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** DOC‑AP‑001 (document storage), OCR‑AP‑001 (OCR stub).  
**Definition of Done:** *(Placeholder)*  
- `AICodingService` with `suggestVendor`, `suggestAccountCodes`, `learnFromCorrection` methods.  
- Initially rule‑based, evolving to ML.  
**⚠️ Detailed requirements, data sources, and integration points must be defined before work can begin.**  
**Scope Clarification:** This is an advanced AI feature deferred to post-MVP. It requires ML expertise and extensive training data. Not part of core production-readiness work.

### ⚠️ AI‑AP‑002: Duplicate Detection Engine – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑007 (bills service).  
**Definition of Done:** *(Placeholder)*  
- `DuplicateDetectionService` with `findPotentialDuplicates`, `getDuplicateConfidence`.  
- Flags duplicates during bill creation.  
**⚠️ Matching criteria, confidence thresholds, and handling of false positives need precise definition.**

### ⚠️ ADV‑AP‑001: Early Payment Discount Management – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑014 (bill payments).  
**Definition of Done:** *(Placeholder)*  
- `EarlyPaymentDiscountService` calculates discounts, recommends optimal payment schedule.  
**⚠️ Discount rules, integration with payment runs, and edge cases (partial payments) require specification.**  
**Scope Clarification:** This is an advanced financial feature deferred to post-MVP. Complex business logic and financial calculations make this unsuitable for initial production deployment.

### ⚠️ ADV‑AR‑001: Credit Management & Risk Scoring – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑003 (customers service).  
**Definition of Done:** *(Placeholder)*  
- `CreditManagementService` calculates credit scores, recommends limits, identifies risk alerts.  
**⚠️ Scoring algorithms, data points, and thresholds must be defined collaboratively with domain experts.**

### ⚠️ ADV‑AR‑002: Automated Collections Workflow – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑013 (reminder service), EMAIL‑SERVICE‑001.  
**Definition of Done:** *(Placeholder)*  
- Escalating dunning levels, payment plan negotiation interface, collections queue.  
**⚠️ Escalation rules, legal compliance, and integration with external agencies need detailed specification.**

### ⚠️ ADV‑AR‑003: Usage‑Based & Metered Billing – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑010 (recurring invoices).  
**Definition of Done:** *(Placeholder)*  
- Usage recording, invoice generation from usage, tiered pricing.  
**⚠️ Meter types, pricing tiers, and aggregation rules require business input.**

### ⚠️ MULTI‑AP‑001: Multi‑Entity AP/AR (Cross‑Entity Payments) – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** DB‑ORG‑001 (organizations), API‑AP‑014 (bill payments).  
**Definition of Done:** *(Placeholder)*  
- Cross‑entity bill payments, inter‑company transfers, consolidated reporting.  
**⚠️ Entity relationship model, permission scoping, and consolidation rules need architectural design.**

### ⚠️ INT‑QB‑001: QuickBooks Online Sync (Stub) – Needs Specification
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑008, API‑AR‑008.  
**Definition of Done:** *(Placeholder)*  
- Stub for pushing invoices, pulling vendors, checking sync status.  
**⚠️ Scope of sync (which entities, direction), error handling, and conflict resolution strategies must be defined.**

---

## Enhancement Opportunities (Phase 6+)

### OPPORTUNITY‑001: Storybook Integration
- **Priority:** Low (post‑MVP enhancement)  
- **Description:** Set up Storybook with component stories, design system documentation, and interactive playground.  
- **Benefits:** Improved developer experience, component testing, design consistency.  
- **Implementation:** Configure Storybook with Vite, add stories for key shadcn/ui components.

### OPPORTUNITY‑002: SAST/DAST Security Scanning
- **Priority:** Medium (security hardening)  
- **Description:** Implement Static and Dynamic Application Security Testing in the CI pipeline.  
- **Tools:** Consider Semgrep (SAST), OWASP ZAP (DAST), or commercial alternatives.  
- **Implementation:** Add tasks in a future Phase 6b or post‑MVP.

---

*End of Phase 6 Advanced Features & Opportunities. This completes the split of TODO-P6.md into three manageable files: Foundation & Tooling, Security & Monitoring, and Advanced Features & Opportunities.*
