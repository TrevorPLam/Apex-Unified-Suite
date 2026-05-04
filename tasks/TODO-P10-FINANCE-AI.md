# TODO-P10-FINANCE-AI.md – Phase 10: Finance AI (Bill.com depth)

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

## Phase 10 Finance AI Task Index

**Finance AI (Bill.com depth)**
- [ ] AI‑FIN‑001 – AI Invoice Data Extraction
- [ ] AI‑FIN‑002 – AI Invoice Coding Suggestions
- [ ] AI‑FIN‑003 – AI Duplicate Detection
- [ ] AI‑FIN‑004 – Cash Flow Forecasting Engine
- [ ] AI‑FIN‑005 – Spend Analytics & Anomaly Detection

---

## Finance AI (Bill.com depth)

### [ ] AI‑FIN‑001: AI Invoice Data Extraction
**Status:** ⏳ Not Started  
**Depends on:** DOC‑AP‑001 (document storage), API‑FIN‑021 (AP inbox API).  
**Definition of Done:** AI‑powered extraction of structured data from invoice documents:
- Accept uploaded or emailed invoice files (PDF, JPG, PNG) and extract: vendor name, invoice number, invoice date, due date, line items (description, quantity, unit price, total), subtotal, tax amount, and total amount.
- Return structured data with per‑field confidence scores (0‑100%).
- Flag low‑confidence fields (below configurable threshold, default 80%) for manual review.
- Pre‑fill the bill creation form with extracted data; low‑confidence fields highlighted for correction.
- Learning from corrections: when a user corrects an extracted value, feed the correction back into the model to improve future extraction for that vendor.
- Integration with the AP inbox: extracted data stored alongside the captured invoice record; visible in the AP inbox detail view.
- Initial implementation can use a third‑party OCR/AI service (e.g., AWS Textract, Google Document AI, or a specialised invoice OCR API) with a well‑defined port interface so the provider can be swapped.

**DDD:** AI service within the Finance bounded context; bridges the AP inbox capture and bill creation workflows.  
**TDD:** Unit test with sample invoice images verifying that known fields are extracted with expected confidence; integration test verifying that low‑confidence scenarios trigger manual review flag; performance test verifying extraction completes within 10 seconds for standard invoices.  
**BDD:** "As an AP clerk, invoice data is automatically extracted from uploaded bills so I don't have to type it manually."

**Deep Module:** AI invoice data extraction system with OCR processing, confidence scoring, and learning from corrections. The module encapsulates OCR algorithms, field extraction patterns, confidence management, and correction learning while providing simple interfaces for automated invoice processing.

**Advanced Code Patterns:**
- Strategy pattern for different OCR providers (AWS Textract, Google Document AI, specialized invoice OCR)
- Observer pattern for extraction result notifications
- Factory pattern for creating field extractors per invoice type
- Command pattern for extraction correction and learning
- Adapter pattern for different OCR service APIs
- Event-driven architecture for extraction workflows

**Anti-Patterns (AI):**
- Do not rely solely on OCR without validation against known invoice formats
- Avoid overfitting extraction models to specific vendor invoice layouts
- Do not ignore confidence scores when auto-accepting extracted data
- Avoid training models on biased or unrepresentative invoice samples
- Do not cache extraction results without proper invalidation

**Advanced Code Patterns:**
- Repository pattern for extraction data and corrections persistence
- State machine for extraction lifecycle management
- Decorator pattern for adding extraction to invoice operations
- Caching strategies for OCR result optimization
- Queue management for batch invoice processing
- Feedback loop implementation for model improvement

**Anti-Patterns:**
- Do not block invoice operations with synchronous extraction
- Avoid storing raw invoice content in extraction logs
- Do not ignore user corrections to extraction results
- Avoid complex extraction rules without clear business value
- Do not bypass manual review for low-confidence extractions

**Rules to Follow:**
- Extraction must complete within 10 seconds for invoices <5MB
- Confidence scores must be displayed to users for all extracted fields
- User corrections must be incorporated into model within 24 hours
- Extraction accuracy must be validated quarterly against manual entry
- All extraction features must work offline with cached models
- Manual review queue must be processed within 2 business days

**Subtasks:**
- [ ] AI‑FIN‑001.1: Define `InvoiceOCRExtractorPort` interface and implement a concrete adapter using a third‑party OCR service. (AGENT) – `lib/ai/ocr/invoice‑ocr‑port.ts`, `adapters/aws-textract‑adapter.ts`  
  **verification:** Adapter returns structured data for a sample invoice image; confidence scores provided per field.
- [ ] AI‑FIN‑001.2: Implement extraction service with confidence thresholding and manual review flagging. (AGENT) – `services/finance/ai‑extraction‑service.ts`  
  **verification:** Low‑confidence fields correctly flagged; high‑confidence fields auto‑accepted.
- [ ] AI‑FIN‑001.3: Integrate extraction into AP inbox processing flow: when a file is uploaded, automatically trigger extraction and store results. (AGENT)  
  **verification:** Uploaded invoice appears in AP inbox with extracted data and confidence scores visible.
- [ ] AI‑FIN‑001.4: Implement correction learning: user corrections are stored and used to adjust future extractions for the same vendor. (AGENT)  
  **verification:** After correcting vendor X's invoice number 3 times, future extractions for vendor X show improved confidence.
- [ ] AI‑FIN‑001.5: Write integration tests for the full extraction‑to‑bill‑creation flow. (AGENT)  
  **verification:** End‑to‑end test passes; extracted data pre‑fills bill form correctly.
- **Depends on:** DOC‑AP‑001, API‑FIN‑021.

### [ ] AI‑FIN‑002: AI Invoice Coding Suggestions
**Status:** ⏳ Not Started  
**Depends on:** AI‑FIN‑001, API‑AP‑008 (bills API).  
**Definition of Done:** AI‑powered General Ledger coding suggestions for bills and invoices:
- When a bill is being created or processed, suggest: GL account codes, department codes, class codes, and tax codes based on the vendor, extracted line item descriptions, and historical coding patterns for the organisation.
- Suggestions are ranked by confidence; the top suggestion is pre‑selected with the option to override.
- Learning from corrections: when a user changes a suggested code, the model learns the correct mapping for future similar transactions.
- Vendor‑specific learning: if vendor X is always coded to account 5100, future bills from vendor X default to 5100.
- Line‑item‑level suggestions: if a line item description matches a known pattern (e.g., contains "software" → code 5300), suggest per line item.
- Integration with the bill and invoice creation/edit forms: suggestions appear as dropdown options or auto‑fill values.

**DDD:** AI service within Finance that augments the bill and invoice coding workflow.  
**TDD:** Unit test with historical transaction data verifying that suggestions match expected codes for known vendors and items; integration test verifying that suggestion accuracy improves with user corrections.  
**BDD:** "As an accountant, GL codes are automatically suggested based on the vendor and what I've coded before."

**Deep Module:** AI invoice coding suggestion system with historical pattern analysis, vendor-specific learning, and confidence scoring. The module encapsulates coding algorithms, pattern recognition, confidence management, and learning systems while providing simple interfaces for automated GL coding.

**Advanced Code Patterns:**
- Strategy pattern for different coding suggestion algorithms (rule-based, ML-based, hybrid)
- Observer pattern for coding suggestion notifications
- Factory pattern for creating coding suggestors per transaction type
- Command pattern for coding correction and learning
- Machine learning integration for adaptive coding models
- Event-driven architecture for coding workflows

**Anti-Patterns (AI):**
- Do not rely solely on historical patterns without context validation
- Avoid overfitting coding models to specific vendor patterns
- Do not ignore confidence scores when auto-applying suggestions
- Avoid training models on biased or unrepresentative coding samples
- Do not cache coding suggestions without proper invalidation

**Advanced Code Patterns:**
- Repository pattern for coding data and corrections persistence
- State machine for coding suggestion lifecycle management
- Decorator pattern for adding coding suggestions to invoice operations
- Caching strategies for coding pattern optimization
- Queue management for batch coding suggestions
- Feedback loop implementation for model improvement

**Anti-Patterns:**
- Do not block coding operations with synchronous suggestions
- Avoid storing sensitive financial data in suggestion logs
- Do not ignore user corrections to coding suggestions
- Avoid complex coding rules without clear accounting principles
- Do not bypass manual review for low-confidence suggestions

**Rules to Follow (AI):**
- All coding suggestions must be explainable with contributing factors
- Suggestion confidence must be displayed to users for all recommendations
- User corrections must be incorporated into model within 24 hours
- Suggestion accuracy must be validated quarterly against accountant reviews
- All coding features must work offline with cached patterns
- Manual coding overrides must always be available without justification

**Rules to Follow:**
- Coding suggestions must complete within 2 seconds for standard transactions
- Suggestion confidence must be displayed to users for all recommendations
- User corrections must be incorporated into model within 24 hours
- Suggestion accuracy must be validated quarterly against manual coding
- All coding features must work offline with cached patterns
- Manual coding overrides must always be available

**Subtasks:**
- [ ] AI‑FIN‑002.1: Implement coding suggestion engine using historical transaction data per organisation. (AGENT) – `services/finance/ai‑coding‑service.ts`  
  **verification:** Engine returns ranked suggestions based on vendor and line item patterns.
- [ ] AI‑FIN‑002.2: Build vendor‑specific and line‑item‑specific learning models. (AGENT)  
  **verification:** Repeated coding patterns for a vendor strengthen future suggestions.
- [ ] AI‑FIN‑002.3: Implement correction learning: user overrides feed back into the model. (AGENT)  
  **verification:** After overriding a suggestion, future similar transactions reflect the correction.
- [ ] AI‑FIN‑002.4: Integrate suggestions into bill and invoice creation/edit UI. (AGENT)  
  **verification:** Suggestions appear in the coding fields; top suggestion pre‑selected.
- [ ] AI‑FIN‑002.5: Write integration tests for suggestion accuracy and learning behaviour. (AGENT)  
  **verification:** Tests pass; accuracy improves with corrections.
- **Depends on:** AI‑FIN‑001, API‑AP‑008.

### [ ] AI‑FIN‑003: AI Duplicate Detection
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑008 (bills API), API‑FIN‑004 (invoices API).  
**Definition of Done:** AI‑powered duplicate invoice and bill detection:
- When a new bill or invoice is being created (manually or via AP inbox), cross‑check against existing records in the database for potential duplicates.
- Duplicate matching criteria: same vendor, similar amount (±2% tolerance), similar date (±3 days), similar invoice number (fuzzy match, e.g., "INV‑001" vs "INV‑001A"), or similar line items.
- Return a confidence score (0‑100%) for each potential duplicate match found.
- If a high‑confidence duplicate is detected (score ≥ 90%), prevent creation and show the existing record with a message: "This appears to be a duplicate of bill #1234."
- If a medium‑confidence duplicate is detected (score 50‑89%), warn the user but allow creation with confirmation: "This may be a duplicate. Are you sure you want to proceed?"
- Duplicate detection runs automatically on AP inbox processing and manual bill/invoice creation.
- Duplicate resolution: if user confirms it's not a duplicate, record the decision so future similar matches are not flagged (learned non‑duplicate).

**DDD:** AI validation service within Finance; prevents duplicate payments and overbilling.  
**TDD:** Unit test with known duplicate and non‑duplicate pairs verifying that scores are correctly calibrated.  
**BDD:** "As an AP manager, the system warns me when a bill I'm entering looks like a duplicate so I don't pay twice."

**Subtasks:**
- [ ] AI‑FIN‑003.1: Implement duplicate detection engine with fuzzy matching on vendor, amount, date, and invoice number. (AGENT) – `services/finance/duplicate‑detection‑service.ts`  
  **verification:** Engine detects known duplicates with high confidence; non‑duplicates with low confidence.
- [ ] AI‑FIN‑003.2: Implement confidence scoring with thresholds for block vs. warn. (AGENT)  
  **verification:** High‑confidence duplicates blocked; medium‑confidence warned; low‑confidence ignored.
- [ ] AI‑FIN‑003.3: Integrate detection into bill creation, invoice creation, and AP inbox processing flows. (AGENT)  
  **verification:** Detection runs automatically; user sees warning or block as appropriate.
- [ ] AI‑FIN‑003.4: Implement learned non‑duplicate recording. (AGENT)  
  **verification:** User confirms "not a duplicate" → future similar pairs are not flagged.
- [ ] AI‑FIN‑003.5: Write integration tests for full duplicate detection workflow. (AGENT)  
  **verification:** End‑to‑end test passes; detection prevents duplicate bill creation.
- **Depends on:** API‑AP‑008, API‑FIN‑004.

### [ ] AI‑FIN‑004: Cash Flow Forecasting Engine
**Status:** ⏳ Not Started  
**Depends on:** REPORT‑FIN‑003 (cash flow report service), API‑FIN‑004 (invoices), API‑AP‑008 (bills), INT‑AP‑002 (Plaid bank feed).  
**Definition of Done:** AI‑powered cash flow forecasting:
- Predict future cash position using: scheduled AP payments (bills with due dates), expected AR receipts (invoices with due dates, adjusted by historical customer payment behaviour), recurring transactions (recurring invoices and bills), and historical seasonal patterns.
- Provide forecasts for: 7 days, 30 days, 90 days, and 12 months out.
- Display confidence intervals (e.g., 80% confidence range) alongside each forecast point.
- "What‑if" scenario modelling: adjust variables (e.g., "what if all customers pay 15 days late?" or "what if we delay all AP by 7 days?") and see the impact on forecasted cash position.
- Identify potential cash shortfalls (days where projected balance < 0) with alerts and recommendations (e.g., "accelerate AR collections by 5 days to avoid shortfall on March 15").
- Integrate actual bank balances from Plaid for a real‑time starting position.
- Visualisation: cash flow timeline chart with actuals (past), forecast (future), and confidence bands.

**DDD:** Financial intelligence service within the Finance bounded context.  
**TDD:** Unit test with known transaction data verifying forecast accuracy against a simple projection model; integration test verifying that scenario modeling updates forecasts in real-time; performance test verifying that forecasts complete within 5 seconds.  
**BDD:** "As a CFO, I can see a 90‑day cash flow forecast and run 'what‑if' scenarios to plan for potential shortfalls."

**Deep Module:** Cash flow forecasting engine with predictive modeling, scenario analysis, and confidence interval calculation. The module encapsulates forecasting algorithms, scenario management, confidence calculation, and bank integration while providing simple interfaces for financial planning.

**Advanced Code Patterns:**
- Strategy pattern for different forecasting models (ARIMA, exponential smoothing, ML-based)
- Observer pattern for forecast update notifications
- Factory pattern for creating scenario models
- Command pattern for scenario parameter adjustments
- Machine learning integration for adaptive forecasting
- Event-driven architecture for forecast workflows

**Anti-Patterns (AI):**
- Do not rely on single forecasting model without ensemble methods
- Avoid overfitting models to recent market conditions
- Do not ignore confidence intervals when presenting forecasts
- Avoid training models on biased or unrepresentative financial data
- Do not cache forecasts without proper invalidation on new transactions

**Advanced Code Patterns:**
- Repository pattern for forecast data persistence
- State machine for forecast lifecycle management
- Decorator pattern for adding forecasting to financial operations
- Caching strategies for forecast calculation optimization
- Queue management for batch forecast updates
- Integration patterns for external bank data sources

**Anti-Patterns:**
- Do not block financial operations with synchronous forecasting
- Avoid storing sensitive bank data in forecast logs
- Do not ignore user feedback on forecast accuracy
- Avoid complex forecasting models without business validation
- Do not bypass confidence intervals for presentation simplicity

**Rules to Follow (AI):**
- All forecasts must include confidence intervals and accuracy metrics
- Forecast models must be retrained monthly with new data
- Scenario modeling must complete within 2 seconds of parameter changes
- Forecast accuracy must be validated quarterly against actual cash flow
- All forecasting features must work offline with cached models
- Manual forecast adjustments must always be available

**Rules to Follow:**
- Forecasts must complete within 5 seconds for standard datasets
- Scenario updates must be reflected in real-time across all views
- Bank data integration must be encrypted at rest and in transit
- Forecast accuracy must be tracked and reported monthly
- All forecasting features must work with 5+ years of historical data
- Shortfall alerts must be delivered within 1 hour of detection

**Subtasks:**
- [ ] AI‑FIN‑004.1: Implement cash flow forecasting model using scheduled transactions, historical patterns, and customer payment behaviour. (AGENT) – `services/finance/cash‑flow‑forecast‑service.ts`  
  **verification:** Forecast produces reasonable projections when tested against known historical data.
- [ ] AI‑FIN‑004.2: Add confidence interval calculation and display. (AGENT)  
  **verification:** Forecast includes confidence bands; wider for longer horizons.
- [ ] AI‑FIN‑004.3: Build "what‑if" scenario modelling engine with adjustable variables. (AGENT)  
  **verification:** Changing variables updates forecast in real‑time; scenarios can be saved and compared.
- [ ] AI‑FIN‑004.4: Implement shortfall detection and recommendation generation. (AGENT)  
  **verification:** Projected shortfalls trigger alerts with actionable recommendations.
- [ ] AI‑FIN‑004.5: Integrate bank balance data from Plaid and build forecast visualisation UI. (AGENT) – `src/components/finance/CashFlowForecast.tsx`  
  **verification:** Forecast chart displays with actuals, projections, and confidence bands; drill‑down available.
- **Depends on:** REPORT‑FIN‑003, API‑FIN‑004, API‑AP‑008, INT‑AP‑002.

### [ ] AI‑FIN‑005: Spend Analytics & Anomaly Detection
**Status:** ⏳ Not Started  
**Depends on:** API‑AP‑008 (bills), API‑FIN‑004 (invoices), ENT‑FIN‑002 (spend analytics).  
**Definition of Done:** AI‑powered spend intelligence:
- Automatically categorise all spend across AP by vendor, category, department, and time period.
- Detect anomalies in spending patterns: vendor price increases (same item, higher unit price vs historical), duplicate subscriptions (multiple payments to the same vendor that look like subscriptions), unusual spending spikes (amount significantly above moving average for that vendor or category), and out‑of‑policy spend (bills without associated POs, over‑budget categories).
- Anomaly scoring: each anomaly receives a severity score; high‑severity anomalies trigger immediate alerts to finance team.
- Vendor spend trends: month‑over‑month and year‑over‑year comparisons with visual sparklines.
- Subscription identification: automatically flag recurring payments that appear to be subscriptions (same amount, same vendor, regular interval) with total annualised cost.
- Executive spend dashboard: key metrics (total spend, top vendors, category breakdown, anomalies detected this month) with drill‑down capability.
- Configurable alert thresholds per spend category and anomaly type.

**DDD:** AI spend intelligence within Finance (Bill.com Spend & Expense feature).  
**TDD:** Unit test with known transaction data verify that anomalies are correctly detected and non‑anomalies are not flagged; integration test verifying that anomaly alerts are delivered within 5 minutes of detection.  
**BDD:** "As a finance director, I am automatically alerted to unusual spending patterns and potential cost savings opportunities."

**Deep Module:** Spend analytics and anomaly detection system with categorization algorithms, trend analysis, and alert management. The module encapsulates spend analysis patterns, anomaly detection algorithms, subscription identification, and executive dashboard functionality while providing simple interfaces for spend intelligence.

**Advanced Code Patterns:**
- Strategy pattern for different anomaly detection algorithms (statistical, ML-based, rule-based)
- Observer pattern for spend anomaly notifications
- Factory pattern for creating spend analyzers per category
- Command pattern for anomaly alert management
- Machine learning integration for adaptive anomaly detection
- Event-driven architecture for spend analysis workflows

**Anti-Patterns (AI):**
- Do not rely on single anomaly detection method without ensemble approaches
- Avoid overfitting anomaly models to recent spending patterns
- Do not ignore seasonal variations in anomaly detection
- Avoid training models on biased or unrepresentative spend data
- Do not cache anomaly scores without proper invalidation

**Advanced Code Patterns:**
- Repository pattern for spend data persistence
- State machine for anomaly lifecycle management
- Decorator pattern for adding anomaly detection to spend operations
- Caching strategies for spend analysis optimization
- Queue management for batch spend analysis
- Dashboard patterns for executive spend visualization

**Anti-Patterns:**
- Do not block spend operations with synchronous anomaly detection
- Avoid storing sensitive vendor data in anomaly logs
- Do not ignore user feedback on anomaly accuracy
- Avoid complex anomaly rules without clear business justification
- Do not bypass anomaly alerts for any user role

**Rules to Follow:**
- Anomaly detection must complete within 10 seconds for standard datasets
- Anomaly alerts must be delivered within 5 minutes of detection
- Spend categorization must be configurable by finance administrators
- Anomaly accuracy must be validated quarterly against manual reviews
- All spend features must work with 3+ years of historical data
- Executive dashboard must load within 3 seconds

**Subtasks:**
- [ ] AI‑FIN‑005.1: Implement spend categorisation engine and anomaly detection algorithms (price changes, duplicates, spikes, out‑of‑policy). (AGENT) – `services/finance/spend‑anomaly‑service.ts`  
  **verification:** Engine correctly categorises spend and detects known anomalies in test data.
- [ ] AI‑FIN‑005.2: Build subscription identification logic. (AGENT)  
  **verification:** Recurring payments to same vendor at regular intervals flagged as potential subscriptions.
- [ ] AI‑FIN‑005.3: Create executive spend dashboard with anomaly alerts. (AGENT) – `src/components/finance/SpendDashboard.tsx`  
  **verification:** Dashboard displays all metrics; anomalies surfaced with severity indicators.
- [ ] AI‑FIN‑005.4: Add alert configuration and notification delivery. (AGENT)  
  **verification:** Finance team receives notifications for high‑severity anomalies; thresholds configurable.
- [ ] AI‑FIN‑005.5: Write integration tests for anomaly detection accuracy. (AGENT)  
  **verification:** Known anomalies detected; false positive rate acceptable.
- **Depends on:** API‑AP‑008, API‑FIN‑004, ENT‑FIN‑002.

---
