# TODO-P5-FINANCE.md – Finance Frontend Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Finance Data Integration including invoices, payments, budgets, and advanced financial features.

---

## Finance Data Integration

### [ ] FRONT‑FIN‑001: Invoices & Payments – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑004 (invoices green), API‑FIN‑008 (payments green).  
**Definition of Done:** Invoice list and payment views use `useInvoiceList` and `usePaymentList` hooks. Multi‑currency display (symbol + amount). Tax breakdown shown. All mock data imports completely removed from Finance components and hooks. Component tests pass with MSW mocks. Manual testing confirms currency display and tax calculations work correctly.

**Deep Module:** Finance frontend module encapsulates financial data management, currency handling, and tax calculations. The module provides a unified interface for financial operations while hiding the complexity of multi-currency formatting, tax calculations, and API calls behind React Query hooks and well-organized components.

**Subtasks:**
- [ ] FRONT‑FIN‑001.1: Create hooks for invoices and payments. (AGENT)  
- [ ] FRONT‑FIN‑001.2: Replace mock data; display currency symbols and tax amounts. (AGENT)  
- [ ] FRONT‑FIN‑001.3: Wire payment form with idempotency key (stored in component state, reused on retry). (AGENT)

---

### [ ] FRONT‑FIN‑002: Budgets & Spend Cards – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑016 (budgets green).  
**Definition of Done:** Budget list and virtual card views use `useBudgetList` and `useCardList` hooks. Budget progress bars reflect actual spend. Card freeze/unfreeze actions wired.

**Subtasks:**
- [ ] FRONT‑FIN‑002.1: Create hooks. (AGENT)  
- [ ] FRONT‑FIN‑002.2: Replace mock data; display budget vs actual progress. (AGENT)

---

### [ ] FRONT‑INT‑FIN: Finance Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑FIN‑001, FRONT‑FIN‑002.  
**Definition of Done:**  
- Invoice approve/reject buttons → `useUpdateInvoice` mutation.  
- Payment form with idempotency key generation (client‑side UUID) → `useCreatePayment` mutation; same key reused on retry.  
- Card freeze/unfreeze toggle → `useUpdateCard` mutation.  
- Budget update form → `useUpdateBudget` mutation.  
- Toast notifications for all outcomes.
- All interactive features tested with MSW mocks.
- Error handling provides clear user feedback.
- Idempotency key persistence works correctly.

**Deep Module:** Finance interactive features module encapsulates all user interactions, mutation handling, and financial state management. The module provides a unified interface for financial operations while hiding the complexity of API calls, idempotency key management, and error handling behind well-defined hooks and components.

**TDD:** Integration tests with MSW verify all interactive features work correctly. Tests cover invoice approvals, payment creation with idempotency, card operations, and budget updates. Each interaction is tested for both success and error paths, including idempotency key reuse scenarios.

**Anti-Patterns (Frontend):**
- Manual state management instead of React Query
- Missing idempotency key persistence
- Direct API calls in components
- Unhandled mutation errors
- Inconsistent error handling patterns
- Not invalidating queries after successful mutations
- Missing loading states during financial operations
- Hardcoded currency symbols or tax rates

**Subtasks:**
- [ ] FRONT‑INT‑FIN.1: Wire invoice approval/rejection. (AGENT)  
- [ ] FRONT‑INT‑FIN.2: Wire payment creation with idempotency key persistence. (AGENT)  
- [ ] FRONT‑INT‑FIN.3: Wire card freeze/unfreeze. (AGENT)  
- [ ] FRONT‑INT‑FIN.4: Add toast feedback for all finance mutations. (AGENT)

---

### [ ] FRONT‑FIN‑003: Invoice Template Designer
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑004 (invoices API).  
**Definition of Done:** Visual invoice template designer:  
- Drag‑and‑drop layout editor for customising invoice appearance (logo upload, colour picker, field placement, column selection).  
- Preview mode showing sample invoice with real data.  
- Save template with name; apply template when creating invoice.  
- Template list with edit and delete actions.  

**Related Files:** `artifacts/apex‑os/src/components/finance/InvoiceTemplateDesigner.tsx`

**Subtasks:**
- [ ] FRONT‑FIN‑003.1: Build drag‑and‑drop template editor. (AGENT)  
- [ ] FRONT‑FIN‑003.2: Implement live preview panel. (AGENT)  
- [ ] FRONT‑FIN‑003.3: Wire template management hooks. (AGENT)  
- [ ] FRONT‑FIN‑003.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑FIN‑004: AP Inbox UI
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑021 (AP inbox API).  
**Definition of Done:** AP Inbox view showing captured vendor invoices:  
- List with status badges (pending_review, processed, error) and confidence scores.  
- Click into a captured invoice: view extracted data side‑by‑side with original file preview.  
- "Create Bill" button: pre‑fills bill form with extracted data; user can correct fields before saving.  
- "Reject" button to mark as erroneous.  
- Upload button to manually add invoice files.  

**Related Files:** `artifacts/apex‑os/src/components/finance/APInbox.tsx`

**Subtasks:**
- [ ] FRONT‑FIN‑004.1: Implement AP inbox list and detail view. (AGENT)  
- [ ] FRONT‑FIN‑004.2: Wire "Create Bill" flow with pre‑filled form. (AGENT)  
- [ ] FRONT‑FIN‑004.3: Add manual upload with drag‑and‑drop. (AGENT)  
- [ ] FRONT‑FIN‑004.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑FIN‑005: Payment Run UI
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑018 (payment run API).  
**Definition of Done:** Payment run management interface:  
- List of payment runs with status (draft, processing, completed, cancelled) and totals.  
- Create payment run: select approved bills, review total amount, choose payment date and bank account, confirm.  
- Payment run detail: bill breakdown, per‑vendor amounts, execution status.  
- Execute button on draft runs; cancel button for unexecuted runs.  
- Payment run history with reprint/filter options.  

**Related Files:** `artifacts/apex‑os/src/components/finance/PaymentRunUI.tsx`

**Subtasks:**
- [ ] FRONT‑FIN‑005.1: Build payment run list, create form, and detail view. (AGENT)  
- [ ] FRONT‑FIN‑005.2: Wire execute and cancel actions with confirmation dialogs. (AGENT)  
- [ ] FRONT‑FIN‑005.3: Component test with MSW. (AGENT)

---

### [ ] FRONT‑FIN‑006: Customer Payment Portal
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑023 (payment portal config API), API‑AR‑008 (AR invoices API).  
**Definition of Done:** Branded customer‑facing payment portal (separate from general portal):  
- Customer login via magic link (reuse portal auth).  
- Dashboard showing open invoices with amount due.  
- Payment page: select invoice, choose payment method (ACH, card), enter amount, submit.  
- Payment history with receipts.  
- Auto‑pay enrollment toggle.  
- Portal branding (logo, colours) driven by config API.  

**Related Files:** `artifacts/apex‑os/src/pages/portal/PaymentPortal.tsx`

**Subtasks:**
- [ ] FRONT‑FIN‑006.1: Build payment portal dashboard and invoice list. (AGENT)  
- [ ] FRONT‑FIN‑006.2: Implement payment form with Stripe Elements integration. (AGENT)  
- [ ] FRONT‑FIN‑006.3: Add auto‑pay enrollment and payment history. (AGENT)  
- [ ] FRONT‑FIN‑006.4: Apply portal branding from config. (AGENT)  
- [ ] FRONT‑FIN‑006.5: Component test with MSW. (AGENT)

---

### [ ] FRONT‑FIN‑007: Collections Dashboard
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑022 (collections activity API), API‑FIN‑020 (reconciliation API).  
**Definition of Done:** AR collections workbench:  
- AR aging visualisation (bar chart by bucket: current, 1‑30, 31‑60, 61‑90, 90+).  
- Prioritised collection queue: overdue invoices grouped by customer, sorted by amount/age.  
- Contact logging: log call/email with outcome (contacted, left_message, promise_to_pay, disputed).  
- Promise‑to‑pay tracking with follow‑up date.  
- Escalation indicator: invoices overdue beyond threshold with no recent contact.  

**Related Files:** `artifacts/apex‑os/src/components/finance/CollectionsDashboard.tsx`

**Subtasks:**
- [ ] FRONT‑FIN‑007.1: Build aging chart and collection queue views. (AGENT)  
- [ ] FRONT‑FIN‑007.2: Implement contact logging form with outcome tracking. (AGENT)  
- [ ] FRONT‑FIN‑007.3: Add escalation indicators and promise‑to‑pay tracking. (AGENT)  
- [ ] FRONT‑FIN‑007.4: Component test with MSW. (AGENT)

---

### [ ] FRONT‑FIN‑008: 1099 Dashboard
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑019 (1099 preparation API).  
**Definition of Done:** 1099 tracking interface:  
- List of 1099‑eligible vendors with year‑to‑date payment totals.  
- Filter by year, filing status (not_started, ready_to_file, filed).  
- Vendor detail: payment breakdown by month, total, filing history.  
- "Refresh Totals" button to recalculate YTD amounts.  
- Export button for tax preparation (CSV download).  
- Filing status update: mark as ready, filed with date.  

**Related Files:** `artifacts/apex‑os/src/components/finance/1099Dashboard.tsx`

**Subtasks:**
- [ ] FRONT‑FIN‑008.1: Implement 1099 vendor list and detail views. (AGENT)  
- [ ] FRONT‑FIN‑008.2: Wire refresh totals and filing status update actions. (AGENT)  
- [ ] FRONT‑FIN‑008.3: Add CSV export button. (AGENT)  
- [ ] FRONT‑FIN‑008.4: Component test with MSW. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Finance components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Finance pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard finance metrics depend on Finance API integration
- **TODO-P5-PORTAL.md**: Customer payment portal depends on Portal authentication

### Related Master Tracker Tasks
- **API‑FIN‑004**: Invoices API must be green before FRONT‑FIN‑001
- **API‑FIN‑008**: Payments API must be green before FRONT‑FIN‑001
- **API‑FIN‑016**: Budgets API must be green before FRONT‑FIN‑002

---

## Verification Commands

### Finance Integration Verification
```bash
# Core Finance verification
npm test -- useInvoiceList.test.ts
npm test -- usePaymentList.test.ts
npm test -- useBudgetList.test.ts
npm test -- useCardList.test.ts

# Interactive features verification
npm test -- finance-interactive.test.tsx

# Advanced features verification
npm test -- invoice-template.test.tsx
npm test -- ap-inbox.test.tsx
npm test -- payment-run.test.tsx
npm test -- collections-dashboard.test.tsx
npm test -- 1099-dashboard.test.tsx

# Payment portal verification
npm test -- payment-portal.test.tsx

# Manual verification
# Navigate to Finance page, verify all data loads from API
# Test invoice creation, approval, and payment workflows
# Test budget management and card operations
# Test advanced finance features
```

---

## Completion Criteria

### Finance Frontend Integration Complete When:
1. All Finance data (invoices, payments, budgets, cards) loads from APIs
2. Interactive features work with proper idempotency and error handling
3. Advanced finance features (templates, AP inbox, payment runs) are functional
4. Collections and 1099 management provide comprehensive financial oversight
5. Customer payment portal enables self-service payments
6. All mock data imports are removed from Finance components
7. Component tests pass with MSW mocks
8. Manual testing confirms complete Finance functionality
9. Multi-currency display and tax calculations work correctly

**Estimated Timeline:** 8-10 days with parallel execution
