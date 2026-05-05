# TODO-P6-ADVANCED.md – Phase 6: Advanced Features & Opportunities

This file covers advanced AP/AR features that need detailed specifications and enhancement opportunities for post‑MVP development. These tasks are largely stubs or deferred to later phases. As noted in research, they need more detailed specifications before an agent can execute them.

---

## Phase 6 Advanced Task Index

- [ ] AI‑AP‑001 – Smart Invoice Coding (AI‑powered)
- [ ] AI‑AP‑002 – Duplicate Detection Engine
- [ ] ADV‑AP‑001 – Early Payment Discount Management
- [ ] ADV‑AR‑001 – Credit Management & Risk Scoring
- [ ] ADV‑AR‑002 – Automated Collections Workflow
- [ ] ADV‑AR‑003 – Usage‑Based & Metered Billing
- [ ] MULTI‑AP‑001 – Multi‑Entity AP/AR (Cross‑Entity Payments)
- [ ] INT‑QB‑001 – QuickBooks Online Sync (Stub)
- [ ] OPPORTUNITY‑001 – Storybook Integration
- [ ] OPPORTUNITY‑002 – SAST/DAST Security Scanning

---

## [ ] AI‑AP‑001: Smart Invoice Coding (AI‑powered)
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No AI‑powered invoice coding exists. GL account codes are manually assigned during bill creation. As of 2026, leading AP platforms (Avantiico, Snowfox, Centime, AppZen) use ML to surface the most likely GL account and dimension combination for each invoice line, validated against live chart‑of‑accounts data.
**Size:** Large
**⚠️ Detailed requirements, data sources, and integration points must be defined before work can begin.**

**Description:** Implement an AI‑powered GL coding suggestion service that learns from historical posting patterns and surfaces the most likely GL accounts, cost centres, and dimensions for each invoice line, with confidence scoring, manual override, and correction‑based learning loops.

**Depends on:** API‑AP‑008 (bills API), DB‑AP‑002 (bills schema), TOOLING‑004 (Zod/Drizzle compatibility)
**Blocks:** [N/A] — post‑MVP enhancement
**Related Files:** [N/A] — files not yet created

**Imports / Exports**
- Imports: [?] — `Bill` domain entity, `GLAccount` type, historical AP transaction data
- Exports: [?] — `AICodingService`, `CodingSuggestion` type, `CodingCorrectionPort`

**Definition of Done**
- [ ] `AICodingService` with `suggestGLCode(billId)`, `suggestAccountCodes(lineItem)`, `learnFromCorrection(billId, correctedCodes)`
- [ ] Initially rule‑based (vendor‑default mappings, historical frequency), evolving to ML
- [ ] Suggestions returned with confidence scores (0–100%) per field
- [ ] Low‑confidence fields (< 80%) flagged for manual review
- [ ] Learning: user overrides feed back into the model for future suggestions
- [ ] Vendor‑specific learning: repeated patterns for a vendor strengthen future suggestions
- [ ] Line‑item‑level suggestions: descriptions matched against known patterns (e.g., "software" → code 5300)
- [ ] Integrated into bill and invoice creation/edit forms as dropdown options

**Out of Scope**
- Full ML pipeline training and model serving infrastructure (use a third‑party API or pre‑trained model initially)
- Real‑time coding for bulk invoice imports (batch processing only at this phase)
- Integration with external ERP systems beyond Apex's own chart of accounts

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Suggestions are advisory only — never auto‑post to ledger without confirmation

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/ap/ai-coding-service.ts`, `lib/db/src/repositories/`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/ap/ai-coding.test.ts`
- Documentation: [N/A]
- Migration files: [?] — may require new tables for historical coding patterns

**Rollback**
- Granularity: function‑level — disable `AICodingService` via feature flag; bills fall back to manual coding
- Halt condition: if `learnFromCorrection` causes suggestion accuracy to degrade (model drift), stop and implement model versioning

**Rules to Follow**
- All coding suggestions must be explainable with contributing factors displayed in the UI
- Suggestion confidence must be displayed for all recommendations
- User corrections must be incorporated into model within 24 hours
- Suggestion accuracy must be validated quarterly against manual coding
- All coding features must work offline with cached patterns
- Manual coding overrides must always be available without justification

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- Strategy pattern for different suggestion algorithms (rule‑based, frequency‑based, ML‑based)
- Port interface for swapping between internal ML model and third‑party AI API (e.g., AWS Textract, Google Document AI)
- Command pattern for coding correction and learning
- Event‑driven architecture: publish `CodingCorrected` event when user overrides a suggestion

**Anti‑Patterns**
- Do not auto‑apply suggestions below the confidence threshold without user confirmation
- Do not train models on biased or unrepresentative invoice samples
- Do not block bill creation on coding suggestion failures
- Do not store sensitive financial data in suggestion logs

**DDD / TDD / BDD / Deep Module notes**
- DDD: AI coding service augments the AP sub‑domain within Finance; it does not own the GL posting process
- TDD: Unit test with known historical data and verify suggestion accuracy improves with corrections
- BDD: "As an AP clerk, GL codes are automatically suggested based on the vendor and what I've coded before, with confidence scores on low‑confidence fields."
- Deep Module: `AICodingService` hides model selection, confidence computation, and correction learning behind a simple `suggest(billId)` interface

---

### Subtasks
- [ ] AI‑AP‑001.0.25 (AGENT): Read the entire task, research current AI invoice coding platforms, and assess what historical data is available in the Apex DB for training.
  *No action — pause until fully understood.*

- [ ] AI‑AP‑001.0.5 (AGENT): Research AI invoice coding platforms (Avantiico, Snowfox, Centime, AppZen) and AWS Textract AnalyzeExpense API capabilities (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AI‑AP‑001.0.75 (AGENT): Reason about implementation approach — rule‑based first vs. third‑party API vs. custom ML. Confirm strategy with user before writing code.
  *If uncertain, ask the user before executing.*

- [ ] AI‑AP‑001.1 (AGENT): Define `AICodingService` interface and implement rule‑based initial version.
  **File(s):** `artifacts/api-server/src/services/ap/ai-coding-service.ts`
  **Verification:** Unit tests pass with mock historical data.

- [ ] AI‑AP‑001.2 (AGENT): Implement confidence scoring and manual review flagging.
  **File(s):** `artifacts/api-server/src/services/ap/ai-coding-service.ts`
  **Verification:** Low‑confidence fields correctly flagged.

- [ ] AI‑AP‑001.3 (AGENT): Implement correction learning loop.
  **File(s):** `artifacts/api-server/src/services/ap/ai-coding-service.ts`
  **Verification:** After correcting vendor X 3 times, future suggestions for vendor X show improved confidence.

- [ ] AI‑AP‑001.4 (AGENT): Integrate suggestions into bill creation/edit UI.
  **File(s):** `artifacts/apex-os/src/components/finance/BillForm.tsx`
  **Verification:** Suggestions appear as dropdown options; top suggestion pre‑selected.

- [ ] AI‑AP‑001.5 (AGENT): Write integration tests for full suggestion‑to‑correction loop.
  **File(s):** `artifacts/api-server/src/__tests__/services/ap/ai-coding.test.ts`
  **Verification:** End‑to‑end test passes.

- [ ] AI‑AP‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] AI‑AP‑002: Duplicate Detection Engine
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No duplicate detection exists for bills or invoices. Duplicate payments are a major risk — industry research indicates duplicate invoice detection is not a single binary test but a probabilistic score combining fuzzy matching across vendor name, amount, date, and invoice number. Modern AI‑based systems flag duplicates with confidence scores and route for resolution.
**Size:** Large
**⚠️ Matching criteria, confidence thresholds, and handling of false positives need precise definition.**

**Description:** Implement a duplicate detection engine that cross‑checks new bills/invoices against existing records using fuzzy matching on vendor, amount (±2% tolerance), date (±3 days), and invoice number, returning confidence scores and blocking or warning based on configurable thresholds.

**Depends on:** API‑AP‑008 (bills API), API‑FIN‑004 (invoices API)
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [?] — `Bill` domain entity, `Invoice` domain entity
- Exports: [?] — `DuplicateDetectionService`, `DuplicateScore` type

**Definition of Done**
- [ ] `DuplicateDetectionService` with `findPotentialDuplicates(entity)`, `getDuplicateConfidence(match)`
- [ ] Flags duplicates during bill/invoice creation and AP inbox processing
- [ ] Matching criteria: same vendor, similar amount (±2% tolerance), similar date (±3 days), similar invoice number (fuzzy match), similar line items
- [ ] Confidence scores returned per match (0–100%)
- [ ] High‑confidence (≥90%): block creation, show existing record
- [ ] Medium‑confidence (50–89%): warn user, allow with confirmation
- [ ] Low‑confidence (<50%): log for audit, do not interrupt workflow
- [ ] Learned non‑duplicate: user confirms "not a duplicate" → future similar pairs not flagged

**Out of Scope**
- Cross‑vendor duplicate detection (requires broader ML)
- Image‑based duplicate detection (OCR similarity)
- Real‑time detection during bulk imports (batch processing only)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Detection is advisory in warning mode — never block payments without explicit confirmation from a human

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/ap/duplicate-detection-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/ap/duplicate-detection.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function‑level — disable detection via feature flag
- Halt condition: if false‑positive rate exceeds 5% in production, stop and tune matching thresholds

**Rules to Follow**
- Duplicate detection must never block payment processing; it is advisory only
- All detection events must be logged in audit trail
- Learned non‑duplicate decisions must be reversible via admin UI
- Detection must complete within 2 seconds for standard datasets

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- Probabilistic scoring using weighted multi‑field comparison (vendor, amount, date, invoice number)
- Fuzzy matching via Levenshtein distance for invoice numbers
- Learned non‑duplicate recording in a `duplicate_overrides` table keyed by `(entityA, entityB)`

**Anti‑Patterns**
- Do not rely on exact matching only — misses re‑issued invoices with slightly different numbers
- Do not block all workflow on detection — warn, don't stop
- Do not skip logging detection events for audit purposes

**DDD / TDD / BDD / Deep Module notes**
- DDD: Duplicate detection is a validation service within the Finance bounded context
- TDD: Unit test with known duplicate and non‑duplicate pairs verifying scores are correctly calibrated
- BDD: "As an AP manager, the system warns me when a bill I'm entering looks like a duplicate so I don't pay twice."
- Deep Module: `DuplicateDetectionService` hides fuzzy matching, confidence scoring, and override learning behind a simple `check(bill)` interface

---

### Subtasks
- [ ] AI‑AP‑002.0.25 (AGENT): Read the entire task and research current duplicate detection techniques in AP automation.
  *No action — pause until fully understood.*

- [ ] AI‑AP‑002.0.5 (AGENT): Research fuzzy matching algorithms (Levenshtein distance, Jaro‑Winkler) and probabilistic scoring for invoice duplicate detection (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] AI‑AP‑002.0.75 (AGENT): Reason about matching criteria weights and confidence thresholds. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] AI‑AP‑002.1 (AGENT): Implement duplicate detection engine with fuzzy matching.
  **File(s):** `artifacts/api-server/src/services/ap/duplicate-detection-service.ts`
  **Verification:** Unit tests with known duplicate pairs pass.

- [ ] AI‑AP‑002.2 (AGENT): Implement confidence scoring with block/warn/ignore thresholds.
  **File(s):** `artifacts/api-server/src/services/ap/duplicate-detection-service.ts`
  **Verification:** High‑confidence duplicates blocked; medium‑confidence warned.

- [ ] AI‑AP‑002.3 (AGENT): Integrate detection into bill creation, invoice creation, and AP inbox flows.
  **File(s):** `artifacts/api-server/src/routes/finance/bills.ts`, `artifacts/api-server/src/routes/finance/invoices.ts`
  **Verification:** Detection runs automatically on new records.

- [ ] AI‑AP‑002.4 (AGENT): Implement learned non‑duplicate recording and admin UI for override management.
  **File(s):** `artifacts/api-server/src/services/ap/duplicate-detection-service.ts`
  **Verification:** User confirms "not a duplicate" → future similar pairs not flagged.

- [ ] AI‑AP‑002.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] ADV‑AP‑001: Early Payment Discount Management
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No early payment discount capture exists. Static discount terms (e.g., "2/10 Net 30") are stored on vendor records but never automatically evaluated. Industry data shows companies lose up to 40% of early payment discounts due to slow processing (PayStream Advisors). Dynamic discounting, where the discount is calculated on a sliding scale based on payment date, is the industry best practice as of 2026.
**Size:** Large
**⚠️ Discount rules, integration with payment runs, and edge cases (partial payments) require specification.**

**Description:** Implement an early payment discount calculation engine that evaluates all open AP invoices against vendor discount terms, recommends optimal payment schedules, and integrates with payment runs to automatically capture discounts where they exceed the cost of capital.

**Depends on:** API‑AP‑008 (bills API), API‑AP‑014 (bill payments), vendor schema (DB‑AP‑001)
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [?] — `Bill` domain entity, `Vendor` domain entity, payment run service
- Exports: [?] — `EarlyPaymentDiscountService`, `DiscountRecommendation` type

**Definition of Done**
- [ ] `EarlyPaymentDiscountService` with `calculateDiscounts(billId)`, `recommendPaymentSchedule`, `evaluateDiscountROI`
- [ ] Supports static discounts ("2/10 Net 30" — 2% if paid within 10 days)
- [ ] Supports dynamic discounting (sliding scale based on payment date proximity)
- [ ] Calculates annualised return (2/10 terms ≈ 37% annualised return)
- [ ] Evaluates discount against cost of capital; recommends only if discount > cost of capital
- [ ] Integrates with payment run creation: flagged bills eligible for early payment discount
- [ ] Dashboard showing captured vs. missed discounts with financial impact

**Out of Scope**
- Supply chain finance / third‑party financing integration
- Dynamic discounting negotiations with suppliers (buyer‑side only)
- Automatic payment execution (discount capture is advisory; payment runs require human approval)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Discount calculations are advisory — never auto‑execute payments without human review

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/ap/early-payment-discount-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/ap/discount.test.ts`
- Documentation: [N/A]
- Migration files: [?]

**Rollback**
- Granularity: function‑level — disable discount service; bills processed at face value
- Halt condition: if discount calculation produces incorrect amounts, stop and fix before any payment runs include discount‑adjusted amounts

**Rules to Follow**
- Discount ROI must be computed as annualised percentage and compared against cost of capital
- Payment timing must respect vendor payment terms and late‑fee policies
- All discount recommendations must be logged in audit trail with calculated ROI

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- Strategy pattern: `StaticDiscountStrategy` (2/10 Net 30) and `DynamicDiscountStrategy` (sliding scale)
- Annualised ROI calculation: `(discount / (invoice_amount - discount)) * (365 / (due_date_days - early_pay_days))`
- Integration with payment run service via observer pattern: discount‑eligible bills flagged automatically

**Anti‑Patterns**
- Do not assume all vendors offer discounts — verify discount terms are present before suggesting
- Do not recommend early payment if the discount is less than the cost of capital
- Do not auto‑execute discounted payments without approval workflow

**DDD / TDD / BDD / Deep Module notes**
- DDD: Discount management is a domain service within the AP sub‑domain of Finance
- TDD: Unit test with known discount terms and verify correct discount amounts and ROI calculations
- BDD: "As a finance manager, the system shows me which bills I should pay early to capture discounts and how much we'll save."
- Deep Module: `EarlyPaymentDiscountService` hides discount calculation, ROI analysis, and payment scheduling behind a simple `evaluate(billId)` interface

---

### Subtasks
- [ ] ADV‑AP‑001.0.25 (AGENT): Read the entire task and research dynamic discounting platforms (Taulia, SAP, C2FO).
  *No action — pause until fully understood.*

- [ ] ADV‑AP‑001.0.5 (AGENT): Research dynamic discounting models and annualised ROI calculation methods (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] ADV‑AP‑001.0.75 (AGENT): Reason about discount evaluation logic and integration with payment run workflow. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] ADV‑AP‑001.1 (AGENT): Implement discount calculation engine with static and dynamic models.
  **File(s):** `artifacts/api-server/src/services/ap/early-payment-discount-service.ts`
  **Verification:** Unit tests with known discount terms pass.

- [ ] ADV‑AP‑001.2 (AGENT): Implement ROI evaluation against cost of capital.
  **File(s):** `artifacts/api-server/src/services/ap/early-payment-discount-service.ts`
  **Verification:** Recommendations only when discount > cost of capital.

- [ ] ADV‑AP‑001.3 (AGENT): Integrate with payment run creation flow.
  **File(s):** `artifacts/api-server/src/routes/finance/payment-runs.ts`
  **Verification:** Discount‑eligible bills flagged in payment run UI.

- [ ] ADV‑AP‑001.4 (AGENT): Build discount capture dashboard.
  **File(s):** `artifacts/apex-os/src/components/finance/DiscountDashboard.tsx`
  **Verification:** Dashboard displays captured vs. missed discounts.

- [ ] ADV‑AP‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] ADV‑AR‑001: Credit Management & Risk Scoring
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No automated credit risk scoring exists. Credit limits are manually set on customer records. As of 2026, leading AR platforms (Billtrust, Bectran, Growfin) use AI‑powered, real‑time credit scoring combining behavioural insights, payment history, and third‑party data. Gartner research indicates organisations using AI‑driven continuous risk analytics identify credit deterioration earlier and reduce losses caused by delayed intervention.
**Size:** Medium
**⚠️ Scoring algorithms, data points, and thresholds must be defined collaboratively with domain experts.**

**Description:** Implement a credit risk scoring service that continuously monitors customer payment behaviour, external credit data, and account activity to produce risk scores, recommend credit limits, and generate alerts for accounts showing signs of deterioration.

**Depends on:** API‑AR‑001 (customers API), API‑AR‑008 (AR invoices), DB‑AR‑001 (customers schema)
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [?] — `Customer` domain entity, `Invoice` domain entity, payment history data
- Exports: [?] — `CreditManagementService`, `CreditScore` type, `RiskAlert` type

**Definition of Done**
- [ ] `CreditManagementService` with `calculateCreditScore(customerId)`, `recommendCreditLimit(customerId)`, `identifyRiskAlerts()`
- [ ] Scoring factors: payment history (on‑time %), days beyond terms, DSO trend, credit utilisation, external credit bureau data (if integrated)
- [ ] Scores displayed as numeric values (0–100) with risk classification: low risk (75–100), medium (40–74), high (0–39)
- [ ] Automatic credit limit recommendations based on risk score and payment history
- [ ] Real‑time alerts when risk indicators cross preset thresholds
- [ ] Ongoing monitoring — not just at credit application, but continuously

**Out of Scope**
- Integration with external credit bureaus (D&B, Experian) — stub only in this phase
- Automated credit hold/release decisions
- Trade credit insurance integration

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Risk scores are advisory — never auto‑block customer accounts without human review

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/ar/credit-management-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/ar/credit-management.test.ts`
- Documentation: [N/A]
- Migration files: [?]

**Rollback**
- Granularity: function‑level — disable credit scoring; credit limits revert to manual management
- Halt condition: if scoring produces false‑positive risk alerts at an unacceptable rate, stop and recalibrate model

**Rules to Follow**
- All scoring models must be explainable with factor breakdowns
- Risk scores must be updated within 5 minutes of relevant events
- Manual credit limit overrides must always be available
- Historical scoring data must be retained for at least 2 years

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- Strategy pattern for different scoring models (payment‑history‑based, ML‑based)
- Observer pattern for real‑time risk alerts on payment events
- Port interface for swapping between internal scoring and external credit bureau API

**Anti‑Patterns**
- Do not train scoring models on biased historical data
- Do not use scoring models without regular validation against actual default rates
- Do not black‑box scoring — always provide factor breakdowns to users

**DDD / TDD / BDD / Deep Module notes**
- DDD: Credit management is a domain service within the AR sub‑domain of Finance
- TDD: Unit test with known payment histories and verify risk scores correlate with actual outcomes
- BDD: "As a credit manager, I can see real‑time risk scores for all customers and get alerts when scores deteriorate."
- Deep Module: `CreditManagementService` hides scoring algorithms, data aggregation, and alert logic behind a simple `assess(customerId)` interface

---

### Subtasks
- [ ] ADV‑AR‑001.0.25 (AGENT): Read the entire task and research AI credit scoring platforms (Billtrust, Bectran, Growfin).
  *No action — pause until fully understood.*

- [ ] ADV‑AR‑001.0.5 (AGENT): Research credit scoring models and risk factor weighting (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] ADV‑AR‑001.0.75 (AGENT): Reason about scoring factors, data sources, and risk thresholds. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] ADV‑AR‑001.1 (AGENT): Implement credit scoring engine with configurable factors and weights.
  **File(s):** `artifacts/api-server/src/services/ar/credit-management-service.ts`
  **Verification:** Unit tests verify scores correlate with payment history.

- [ ] ADV‑AR‑001.2 (AGENT): Implement risk alert generation and credit limit recommendations.
  **File(s):** `artifacts/api-server/src/services/ar/credit-management-service.ts`
  **Verification:** Risk alerts triggered when thresholds crossed.

- [ ] ADV‑AR‑001.3 (AGENT): Build credit risk dashboard.
  **File(s):** `artifacts/apex-os/src/components/finance/CreditRiskDashboard.tsx`
  **Verification:** Dashboard displays scores, trends, and alerts.

- [ ] ADV‑AR‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] ADV‑AR‑002: Automated Collections Workflow
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No automated collections workflow exists. Collections activity is manually logged. Industry best practice in 2026 uses multi‑level dunning with escalation based on aging, amount, and customer risk — best‑in‑class AR organisations can reduce DSO by up to 25% through structured escalation and AI‑driven prioritisation.
**Size:** Large
**⚠️ Escalation rules, legal compliance, and integration with external agencies need detailed specification.**

**Description:** Implement a multi‑level dunning and collections escalation engine that automatically sends reminders at configurable intervals, escalates overdue accounts through defined levels (reminder → formal notice → collector assignment → manager review → external collections), and provides a prioritised collector worklist.

**Depends on:** API‑AR‑008 (AR invoices), API‑FIN‑022 (collections activity), EMAIL‑SERVICE‑001
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [?] — `Invoice` domain entity, `Customer` domain entity, email service
- Exports: [?] — `CollectionsWorkflowService`, `EscalationRule` type, `CollectorWorklist` type

**Definition of Done**
- [ ] Multi‑level dunning sequences: Level 1 (friendly reminder), Level 2 (formal notice), Level 3 (collector assignment), Level 4 (manager review), Level 5 (external collections referral)
- [ ] Escalation based on: days overdue, invoice amount, customer risk score, previous dunning history
- [ ] Payment plan negotiation interface — record promise‑to‑pay with follow‑up tracking
- [ ] Prioritised collector worklist with next‑best‑action recommendations
- [ ] Automated email reminders sent via configurable templates per dunning level
- [ ] Pause capability per customer (payment plan agreed, dispute in progress)
- [ ] Escalation history logged on invoice and customer records

**Out of Scope**
- Integration with external collection agencies (API)
- Legal collections workflow
- Credit bureau reporting integration

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Dunning communications must comply with relevant regulations (no harassment, respect opt‑outs)
- Never auto‑escalate to external collections without explicit human approval

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/ar/collections-workflow-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/ar/collections-workflow.test.ts`
- Documentation: [N/A]
- Migration files: [?]

**Rollback**
- Granularity: function‑level — disable collections automation; revert to manual collections
- Halt condition: if automated dunning sends erroneous communications to VIP accounts, stop immediately and implement customer‑segment gating

**Rules to Follow**
- Dunning levels must be configurable per organisation with customisable templates
- Escalation must be segmented by customer relationship (VIP accounts get softer treatment)
- All automated communications must be logged in audit trail
- Pause/resume must be available per customer and per invoice

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- State machine for dunning levels with configurable transitions and entry/exit actions
- Composite rule engine for escalation conditions (days overdue + amount + customer risk + reminder history)
- Observer pattern for real‑time escalation events

**Anti‑Patterns**
- Do not send harsh dunning to VIP accounts
- Do not escalate without considering customer payment history
- Do not ignore legal/regulatory requirements for collections communications

**DDD / TDD / BDD / Deep Module notes**
- DDD: Collections workflow is a domain service within the AR sub‑domain of Finance
- TDD: Integration test verifying escalation triggers at correct thresholds
- BDD: "As a collections manager, overdue invoices automatically escalate through defined levels until resolved."
- Deep Module: `CollectionsWorkflowService` hides dunning sequences, escalation rules, and collector assignment behind a simple `processOverdue()` interface

---

### Subtasks
- [ ] ADV‑AR‑002.0.25 (AGENT): Read the entire task and research collections automation platforms (Tesorio, Billtrust, HighRadius).
  *No action — pause until fully understood.*

- [ ] ADV‑AR‑002.0.5 (AGENT): Research dunning best practices and escalation level design (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] ADV‑AR‑002.0.75 (AGENT): Reason about escalation rules, dunning level design, and regulatory compliance. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] ADV‑AR‑002.1 (AGENT): Implement multi‑level dunning engine with configurable escalation rules.
  **File(s):** `artifacts/api-server/src/services/ar/collections-workflow-service.ts`
  **Verification:** Unit tests verify escalation triggers at correct thresholds.

- [ ] ADV‑AR‑002.2 (AGENT): Implement payment plan negotiation and promise‑to‑pay tracking.
  **File(s):** `artifacts/api-server/src/services/ar/collections-workflow-service.ts`
  **Verification:** Promise‑to‑pay recorded; follow‑up tracked.

- [ ] ADV‑AR‑002.3 (AGENT): Build collector worklist and collections dashboard.
  **File(s):** `artifacts/apex-os/src/components/finance/CollectionsDashboard.tsx`
  **Verification:** Worklist prioritised by risk and amount.

- [ ] ADV‑AR‑002.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] ADV‑AR‑003: Usage‑Based & Metered Billing
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No usage‑based billing exists. All invoices are manually created or generated from fixed recurring templates. As of 2026, 74% of SaaS vendors have adopted usage‑based pricing models. A robust UBB system consists of three layers: Metering (tracking events), Aggregation (collecting over a billing period), and Rating (applying pricing rules).
**Size:** Large
**⚠️ Meter types, pricing tiers, and aggregation rules require business input.**

**Description:** Implement a usage‑based billing engine with three‑layer architecture (Metering, Aggregation, Rating) that tracks customer consumption events, aggregates usage over billing periods, applies tiered pricing rules, and generates invoices from metered usage data.

**Depends on:** API‑AR‑008 (AR invoices), API‑AR‑010 (recurring templates)
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [?] — `Invoice` domain entity, `Customer` domain entity, usage event data
- Exports: [?] — `UsageBillingService`, `MeteredPricingPlan` type, `UsageEvent` type

**Definition of Done**
- [ ] Metering layer: instrument application to emit usage events (API calls, storage bytes, compute hours, seats, data processed)
- [ ] Aggregation layer: collect and aggregate usage events per customer per billing period
- [ ] Rating layer: apply pricing rules (flat rate, tiered, volume, prepaid‑commit‑with‑overage)
- [ ] Usage‑based invoice generation: create line items from aggregated and rated usage
- [ ] Tiered pricing support: price per unit changes based on volume
- [ ] Prepaid commit support: track drawdown against committed amount; bill overage at premium rate
- [ ] Usage dashboard for customers showing current consumption vs. plan limits

**Out of Scope**
- Real‑time usage streaming (batch aggregation at end of billing period is sufficient)
- Integration with Stripe Billing Meters (optional future enhancement)
- Multi‑attribute rating (combining multiple usage dimensions into a single price)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Usage data must be immutable once rated and invoiced

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/ar/usage-billing-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/ar/usage-billing.test.ts`
- Documentation: [N/A]
- Migration files: [?] — requires `usage_events` and `usage_aggregations` tables

**Rollback**
- Granularity: function‑level — disable usage billing; customers billed on fixed recurring plans only
- Halt condition: if rating produces incorrect invoice amounts, stop and implement invoice preview before generation

**Rules to Follow**
- Usage events must be immutable and append‑only
- Aggregation must be idempotent — re‑running must not double‑count events
- Rating rules must be version‑controlled and auditable
- All usage‑based invoices must show consumption breakdown

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- Three‑layer architecture: Metering (event ingestion pipeline), Aggregation (SQL window functions), Rating (strategy pattern for pricing models)
- Idempotent aggregation with watermark tracking (high‑water mark per customer per period)
- Port interface for swapping between Stripe Billing Meters and internal metering

**Anti‑Patterns**
- Do not use usage data without customer‑visible breakdown
- Do not silently change pricing rules between billing periods
- Do not aggregate without idempotency — ensure events are not double‑counted

**DDD / TDD / BDD / Deep Module notes**
- DDD: Usage billing is a domain service within the AR sub‑domain of Finance
- TDD: Unit test with known usage events and verify correct aggregation and rating
- BDD: "As a finance manager, customers are billed accurately based on their actual product consumption."
- Deep Module: `UsageBillingService` hides metering, aggregation, and rating behind a simple `generateInvoice(customerId, period)` interface

---

### Subtasks
- [ ] ADV‑AR‑003.0.25 (AGENT): Read the entire task and research usage‑based billing platforms (m3ter, Stripe Billing Meters, Zuora).
  *No action — pause until fully understood.*

- [ ] ADV‑AR‑003.0.5 (AGENT): Research usage‑based billing architectures and metering/aggregation/rating patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] ADV‑AR‑003.0.75 (AGENT): Reason about metering infrastructure, pricing model design, and aggregation strategy. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] ADV‑AR‑003.1 (AGENT): Implement metering layer — usage event ingestion and persistence.
  **File(s):** `artifacts/api-server/src/services/ar/usage-billing-service.ts`
  **Verification:** Usage events stored and immutable.

- [ ] ADV‑AR‑003.2 (AGENT): Implement aggregation layer with idempotent watermark tracking.
  **File(s):** `artifacts/api-server/src/services/ar/usage-billing-service.ts`
  **Verification:** Re‑running aggregation does not double‑count events.

- [ ] ADV‑AR‑003.3 (AGENT): Implement rating layer with tiered and volume pricing strategies.
  **File(s):** `artifacts/api-server/src/services/ar/usage-billing-service.ts`
  **Verification:** Correct amounts calculated for each pricing model.

- [ ] ADV‑AR‑003.4 (AGENT): Implement usage‑based invoice generation.
  **File(s):** `artifacts/api-server/src/services/ar/usage-billing-service.ts`
  **Verification:** Invoices generated with consumption breakdowns.

- [ ] ADV‑AR‑003.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] MULTI‑AP‑001: Multi‑Entity AP/AR (Cross‑Entity Payments)
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No multi‑entity AP/AR support exists. Each organisation is treated as a single entity. As of 2026, platforms like Tipalti, Oracle Cloud ERP, and Sage Intacct provide native multi‑entity AP/AR with cross‑entity payments, inter‑company transfers, and consolidated reporting.
**Size:** Large
**⚠️ Entity relationship model, permission scoping, and consolidation rules need architectural design.**

**Description:** Extend the organisational model to support parent‑subsidiary entity relationships, enabling cross‑entity bill payments, inter‑company transfer tracking, consolidated AR/AP reporting, and entity‑level permission scoping for finance staff.

**Depends on:** DB‑ORG‑001 (organizations), API‑AP‑008 (bills), API‑AP‑014 (bill payments), API‑AR‑008 (AR invoices)
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [?] — `Organization` domain entity, `Bill`, `Invoice`, `Payment` domain entities
- Exports: [?] — `MultiEntityService`, `EntityRelationship` type, `InterCompanyTransfer` type

**Definition of Done**
- [ ] Parent‑subsidiary entity relationships stored in organisations table or a junction table
- [ ] Cross‑entity bill payment: parent entity can pay bills belonging to subsidiary from a shared bank account
- [ ] Inter‑company transfer tracking: loans, transfers, shared expenses recorded with proper accounting entries
- [ ] Consolidated reporting: AP aging, AR aging, cash flow across all entities or filtered by entity
- [ ] Entity‑level permission scoping: finance staff restricted to specific entities
- [ ] Multi‑entity dashboard showing key metrics per entity with drill‑down

**Out of Scope**
- Inter‑company elimination entries for financial consolidation
- Multi‑currency consolidation at the entity level
- Tax jurisdiction management per entity

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Entity‑level data isolation is critical — never expose one entity's data to users without explicit permission for that entity

**Output Artifacts**
- Code changes in: `artifacts/api-server/src/services/finance/multi-entity-service.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/services/finance/multi-entity.test.ts`
- Documentation: [N/A]
- Migration files: [?] — requires schema changes to organisations table

**Rollback**
- Granularity: migration‑level — revert entity relationship schema; disable multi‑entity features
- Halt condition: if cross‑entity payments produce incorrect accounting entries, stop immediately and implement validation guards

**Rules to Follow**
- All cross‑entity transactions must create corresponding inter‑company transfer records
- Entity permissions must be enforced at the database level (RLS or application‑level scoping)
- Consolidated reports must support drill‑down to individual entities
- Cash flow forecasting must include inter‑entity transfer impacts

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- Entity hierarchy modelled as a tree structure with recursive CTE queries for consolidation
- Inter‑company transfer as a double‑entry transaction (debit one entity, credit another)
- Permission scoping via RLS or application‑level `WHERE entity_id IN (allowed_entities)` filter

**Anti‑Patterns**
- Do not allow cross‑entity data access without explicit permission validation
- Do not store inter‑company transfers without proper accounting entries
- Do not hard‑code entity relationships — use a flexible parent‑subsidiary model

**DDD / TDD / BDD / Deep Module notes**
- DDD: Multi‑entity management extends the Organisation aggregate in the Finance bounded context
- TDD: Integration test verifying a parent entity can pay a subsidiary bill and correct transfer records are created
- BDD: "As a CFO, I can manage AP and AR across multiple subsidiaries from a single platform."
- Deep Module: `MultiEntityService` hides entity hierarchy, transfer accounting, and consolidation logic behind a simple interface

---

### Subtasks
- [ ] MULTI‑AP‑001.0.25 (AGENT): Read the entire task and research multi‑entity AP/AR platforms.
  *No action — pause until fully understood.*

- [ ] MULTI‑AP‑001.0.5 (AGENT): Research multi‑entity accounting architectures and inter‑company transfer patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] MULTI‑AP‑001.0.75 (AGENT): Reason about entity relationship model and permission scoping. Confirm architectural decisions with user.
  *If uncertain, ask the user before executing.*

- [ ] MULTI‑AP‑001.1 (AGENT): Extend organisation schema with parent‑subsidiary relationships.
  **File(s):** `lib/db/src/schema/organizations.ts`
  **Verification:** Entity relationships stored; constraints enforced.

- [ ] MULTI‑AP‑001.2 (AGENT): Implement cross‑entity bill payment with inter‑company transfer creation.
  **File(s):** `artifacts/api-server/src/services/finance/multi-entity-service.ts`
  **Verification:** Parent pays subsidiary bill; transfer record created; both entity balances updated.

- [ ] MULTI‑AP‑001.3 (AGENT): Implement consolidated reporting views and entity‑level permission scoping.
  **File(s):** `artifacts/api-server/src/services/finance/multi-entity-service.ts`
  **Verification:** Reports show consolidated and per‑entity breakdowns.

- [ ] MULTI‑AP‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] INT‑QB‑001: QuickBooks Online Sync (Stub)
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (deferred post‑MVP)
**Current State:** No QuickBooks integration exists. QBO v3 REST API uses OAuth 2.0 with 60‑minute access tokens, 100‑day rolling refresh tokens, and 500 requests per minute per realmId. Every writable entity uses `SyncToken` for optimistic concurrency control.
**Size:** [?]
**⚠️ Scope of sync (which entities, direction), error handling, and conflict resolution strategies must be defined.**

**Description:** Implement a stub for bidirectional QuickBooks Online sync covering OAuth 2.0 authentication, vendor/customer push, invoice/bill sync, and payment sync, using the QBO v3 REST API.

**Depends on:** API‑AP‑008 (bills), API‑AR‑008 (invoices)
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [?]
- Exports: [?] — `QBOAdapter`, `QBOSyncService`

**Definition of Done**
- [ ] OAuth 2.0 flow implemented with secure token storage (encrypted at rest)
- [ ] `pushVendorToQB(vendorId)` — creates or updates vendor in QBO
- [ ] `pushInvoiceToQB(invoiceId)` — creates invoice in QBO AR
- [ ] `pullPaymentsFromQB()` — syncs customer payments from QBO
- [ ] Sync status dashboard stub showing connection status, last sync time
- [ ] Rate limit handling: 500 req/min per realmId, exponential backoff on 429

**Out of Scope**
- QuickBooks Desktop integration
- QuickBooks Payroll/Time tracking
- Real‑time webhook‑driven sync

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `QUICKBOOKS_CLIENT_SECRET`, OAuth tokens
- Never store OAuth tokens unencrypted

**Output Artifacts**
- Code changes in: `integrations/quickbooks/`
- Tests added/updated in: `integrations/quickbooks/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `integrations/quickbooks/` directory
- Halt condition: if QBO returns persistent 401 errors after token refresh, verify credentials

**Rules to Follow**
- Use OAuth 2.0 with PKCE; never hand‑roll OAuth
- All QBO write operations must include current `SyncToken` to prevent version conflicts
- Token refresh must be proactive when `expires_in` < 60 seconds
- Respect QBO API limits: 500 req/min, 10 concurrent requests

**Verification**
```bash
[?] — Verification commands to be defined when implementation plan is created
```

**Advanced Code Patterns**
- Adapter pattern implementing `AccountingPort` for provider‑agnostic sync
- Change Data Capture (CDC) for incremental sync instead of full‑dataset polling
- SyncToken‑based optimistic locking and retry on version conflict (error 5010)

**Anti‑Patterns**
- Do not poll full datasets — use CDC for incremental sync
- Do not ignore SyncToken — causes version conflict errors
- Do not store OAuth tokens in environment files or unencrypted DB columns

**DDD / TDD / BDD / Deep Module notes**
- DDD: QuickBooks is an external system within the Finance bounded context; `QBOAdapter` is an anti‑corruption layer
- TDD: Write unit tests against QBO sandbox fixtures before implementation
- BDD: "As an accountant, I can sync my Apex vendors and invoices to QuickBooks Online."
- Deep Module: [N/A] — thin adapter layer

---

### Subtasks
- [ ] INT‑QB‑001.0.25 (AGENT): Read the entire task and QBO v3 API reference.
  *No action — pause until fully understood.*

- [ ] INT‑QB‑001.0.5 (AGENT): Research QBO OAuth 2.0 PKCE flow, rate limits, and SyncToken concurrency control (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑QB‑001.0.75 (AGENT): Reason about sync scope, conflict resolution strategy, and entity mapping (QBO Customer → Apex Contact, etc.).
  *If uncertain, ask the user before executing.*

- [ ] INT‑QB‑001.1 (AGENT): Implement QBO OAuth 2.0 flow and encrypted token storage.
  **File(s):** `integrations/quickbooks/oauth.ts`
  **Verification:** OAuth flow completes; tokens stored encrypted.

- [ ] INT‑QB‑001.2 (AGENT): Implement vendor and invoice push stubs.
  **File(s):** `integrations/quickbooks/vendor-sync.ts`, `integrations/quickbooks/invoice-sync.ts`
  **Verification:** Stubs push data to QBO sandbox.

- [ ] INT‑QB‑001.3 (AGENT): Implement payment pull stub and sync status dashboard.
  **File(s):** `integrations/quickbooks/payment-sync.ts`
  **Verification:** Payment data pulled; dashboard displays sync status.

- [ ] INT‑QB‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] OPPORTUNITY‑001: Storybook Integration
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** ⚪ Low (post‑MVP enhancement)
**Current State:** No Storybook is configured in the `artifacts/apex-os` workspace. As of May 2026, Storybook 8.6 focuses on Storybook Test, bringing real‑time component, accessibility, and visual UI tests into the component workshop; `@storybook/addon-vitest` integration is the recommended testing approach for Vite‑based projects.
**Size:** Medium

**Description:** Set up Storybook with component stories, design system documentation, interactive playground, visual regression testing via Chromatic, and `@storybook/addon-vitest` integration for running component tests.

**Depends on:** FRONT‑INFRA‑001 (React Query configured), FRONT‑INFRA‑003 (MSW for testing)
**Blocks:** [N/A]
**Related Files:** [N/A] — files not yet created

**Imports / Exports**
- Imports: [N/A] — Storybook configuration
- Exports: [N/A] — Storybook stories and documentation

**Definition of Done**
- [ ] Storybook installed and configured in `artifacts/apex-os` with Vite builder
- [ ] Stories created for all shadcn/ui components (Button, Card, Dialog, Select, etc.)
- [ ] Stories created for key business components (LeadCard, InvoiceTable, TaskBoard, etc.)
- [ ] `@storybook/addon-vitest` integrated for running Vitest tests against stories
- [ ] Visual regression testing configured via Chromatic
- [ ] Accessibility tests run as part of story tests via `@storybook/addon-a11y`
- [ ] Design token documentation integrated into Storybook
- [ ] `pnpm run storybook` starts the Storybook dev server

**Out of Scope**
- Comprehensive E2E testing via Storybook (use Playwright for E2E)
- Automated Chromatic approval workflows
- Custom Storybook addons

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Storybook is a dev‑only dependency — must not be bundled into production builds

**Output Artifacts**
- Code changes in: `artifacts/apex-os/.storybook/`, `artifacts/apex-os/src/**/*.stories.tsx`
- Tests added/updated in: [N/A]
- Documentation: Storybook as living documentation
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `.storybook/` directory and all `.stories.tsx` files; remove Storybook dependencies
- Halt condition: if Storybook significantly increases `pnpm install` time, stop and move to optional `devDependencies`

**Rules to Follow**
- Stories must use Component Story Format (CSF) 3.0
- All stories must include a `play` function for interaction testing
- Accessibility addon must be enabled for all stories
- Design tokens must be documented alongside components

**Verification**
```bash
pnpm --filter @workspace/apex-os run storybook
pnpm --filter @workspace/apex-os test -- storybook
```

**Advanced Code Patterns**
- Component Story Format (CSF) 3.0 with `satisfies Meta<typeof Component>`
- `@storybook/addon-vitest` for running Vitest tests against stories in browser mode
- Chromatic integration for visual regression on PR

**Anti‑Patterns**
- Do not create stories that test implementation details — focus on component behaviour and appearance
- Do not skip accessibility annotations in stories
- Do not commit Chromatic build output

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — development tooling
- TDD: Storybook stories serve as visual regression tests
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] OPPORTUNITY‑001.0.25 (AGENT): Read the entire task and assess current component inventory in `artifacts/apex-os/src/components/`.
  *No action — pause until fully understood.*

- [ ] OPPORTUNITY‑001.0.5 (AGENT): Research Storybook 8.6 `@storybook/addon-vitest` integration patterns and CSF 3.0 best practices (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] OPPORTUNITY‑001.0.75 (AGENT): Reason about which components to prioritise for stories. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] OPPORTUNITY‑001.1 (AGENT): Install and configure Storybook with Vite builder and addons (a11y, vitest, chromatic).
  **File(s):** `artifacts/apex-os/.storybook/main.ts`, `artifacts/apex-os/.storybook/preview.ts`
  **Verification:** `pnpm run storybook` starts successfully.

- [ ] OPPORTUNITY‑001.2 (AGENT): Create stories for all shadcn/ui components.
  **File(s):** `artifacts/apex-os/src/components/ui/**/*.stories.tsx`
  **Verification:** All shadcn/ui components have stories with interaction tests.

- [ ] OPPORTUNITY‑001.3 (AGENT): Create stories for key business components (LeadCard, InvoiceTable, TaskBoard, etc.).
  **File(s):** `artifacts/apex-os/src/components/**/*.stories.tsx`
  **Verification:** Key business components have stories covering all variants and states.

- [ ] OPPORTUNITY‑001.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

## [ ] OPPORTUNITY‑002: SAST/DAST Security Scanning
**Status:** ⏳ Not Started
**Actor:** [?]
**Priority:** 🟡 Medium (security hardening)
**Current State:** No automated security scanning exists in the CI/CD pipeline. As of 2026, industry best practice is to integrate SAST (Semgrep), DAST (OWASP ZAP), and dependency scanning in the CI pipeline as a required gate before deployment. Semgrep's AI‑powered detection (beta as of March 2026) can identify complex business logic flaws including IDORs and broken authorization.
**Size:** Medium

**Description:** Implement Static Application Security Testing (SAST) via Semgrep and Dynamic Application Security Testing (DAST) via OWASP ZAP in the CI/CD pipeline, with automated blocking on critical findings and SARIF upload to GitHub Security dashboard.

**Depends on:** [N/A] — CI/CD pipeline must exist
**Blocks:** [N/A]
**Related Files:** [N/A]

**Imports / Exports**
- Imports: [N/A] — CI/CD configuration
- Exports: [N/A]

**Definition of Done**
- [ ] Semgrep SAST configured in GitHub Actions workflow (`.github/workflows/security.yml`)
- [ ] Semgrep scans for: SQL injection, XSS, hard‑coded secrets, authentication bypass patterns
- [ ] Semgrep findings uploaded as SARIF to GitHub Code Scanning dashboard
- [ ] OWASP ZAP DAST configured to scan deployed application against OWASP Top 10
- [ ] ZAP authenticated scanning configured for logged‑in user flows
- [ ] Dependency vulnerability scanning via `npm audit` or Dependabot
- [ ] Critical/High findings block PR merge; Medium findings create a warning comment
- [ ] Security scanning runs on every PR and push to main

**Out of Scope**
- Penetration testing by external security firms
- Container image scanning (future phase)
- Secrets detection in git history (future phase)

**Safety Boundaries**
- Never commit: `.env*`, ZAP scan results containing sensitive data, API keys
- Security scan results must not be publicly accessible

**Output Artifacts**
- Code changes in: `.github/workflows/security.yml`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — remove `security.yml` workflow; revert CI pipeline
- Halt condition: if security scanning significantly increases CI time (>5 minutes), optimise scan targets and caching

**Rules to Follow**
- SAST must run before DAST in the pipeline
- Critical findings must block the pipeline
- All security tools must be pinned to specific versions for reproducibility
- Scan results must be archived as build artifacts for audit

**Verification**
```bash
# Trigger security scan manually
gh workflow run security.yml

# Check scan results
gh run view --log
```

**Advanced Code Patterns**
- Semgrep CI with diff‑aware scanning (only scan changed code on PRs)
- ZAP automation framework with YAML‑defined scan policies and headless execution
- SARIF output from all tools consolidated in GitHub Code Scanning dashboard

**Anti‑Patterns**
- Do not run security scans only on `main` branch — scan every PR
- Do not ignore Medium findings — they accumulate into technical debt
- Do not hard‑code exclusion rules without documentation

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure/DevSecOps
- TDD: [N/A]
- BDD: [N/A]
- Deep Module: [N/A]

---

### Subtasks
- [ ] OPPORTUNITY‑002.0.25 (AGENT): Read the entire task and assess current CI/CD pipeline configuration.
  *No action — pause until fully understood.*

- [ ] OPPORTUNITY‑002.0.5 (AGENT): Research Semgrep CI configuration patterns and OWASP ZAP automation with Docker (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] OPPORTUNITY‑002.0.75 (AGENT): Reason about CI pipeline architecture and whether security scanning should be blocking or advisory. Confirm with user.
  *If uncertain, ask the user before executing.*

- [ ] OPPORTUNITY‑002.1 (AGENT): Configure Semgrep SAST in GitHub Actions with SARIF upload.
  **File(s):** `.github/workflows/security.yml`
  **Verification:** Semgrep runs on PR; findings visible in GitHub Security tab.

- [ ] OPPORTUNITY‑002.2 (AGENT): Configure OWASP ZAP DAST for authenticated scanning.
  **File(s):** `.github/workflows/security.yml`
  **Verification:** ZAP scan completes; findings reported.

- [ ] OPPORTUNITY‑002.3 (AGENT): Configure dependency vulnerability scanning.
  **File(s):** `.github/workflows/security.yml`
  **Verification:** `npm audit` findings reported.

- [ ] OPPORTUNITY‑002.N (HUMAN): Final review and sign‑off.
  **Verification:** Approved.

---

*End of Phase 6 Advanced Features & Opportunities.*