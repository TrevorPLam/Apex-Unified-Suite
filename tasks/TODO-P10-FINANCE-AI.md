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
**TDD:** Unit test with sample invoice images verifying that known fields are extracted with expected confidence; low‑confidence scenarios trigger manual review flag.  
**BDD:** "As an AP clerk, invoice data is automatically extracted from uploaded bills so I don't have to type it manually."

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
**TDD:** Unit test with historical transaction data verifying that suggestions match expected codes for known vendors and items.  
**BDD:** "As an accountant, GL codes are automatically suggested based on the vendor and what I've coded before."

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
**TDD:** Unit test with known transaction data verifying forecast accuracy against a simple projection model.  
**BDD:** "As a CFO, I can see a 90‑day cash flow forecast and run 'what‑if' scenarios to plan for potential shortfalls."

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
**TDD:** Unit test with known transaction data verify that anomalies are correctly detected and non‑anomalies are not flagged.  
**BDD:** "As a finance director, I am automatically alerted to unusual spending patterns and potential cost savings opportunities."

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
