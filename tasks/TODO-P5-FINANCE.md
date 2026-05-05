# TODO-P5-FINANCE.md – Phase 5: Finance Frontend Integration

Replaces all mock data in the Finance page with real API-backed React Query hooks and wires all financial interactions: invoice CRUD, payment creation with idempotency, budget/card management, AP inbox, payment runs, collections workbench, 1099 dashboard, and the customer payment portal.

---

## [ ] FRONT‑FIN‑001: Invoices & Payments – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Finance.tsx` imports invoices and payments from `src/data/mockData.ts`. No `useInvoiceList` or `usePaymentList` hooks exist.
**Size:** Small

**Description:** Create `useInvoiceList` and `usePaymentList` hooks backed by `API-FIN-004` / `API-FIN-008`. Replace all mock data in invoice list and payment views. Display multi-currency amounts (symbol + formatted value) and tax breakdowns.

**Depends on:** API‑FIN‑004 (invoices API green), API‑FIN‑008 (payments API green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** FRONT‑INT‑FIN
**Related Files:** `artifacts/apex-os/src/pages/Finance.tsx`, `artifacts/apex-os/src/hooks/finance/useInvoiceList.ts`, `artifacts/apex-os/src/hooks/finance/usePaymentList.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; API client for `GET /api/v1/invoices`, `GET /api/v1/payments`
- Exports: `useInvoiceList(filters?)`, `usePaymentList(filters?)`

**Definition of Done**
- [ ] `useInvoiceList` and `usePaymentList` hooks created with filter params
- [ ] Invoice list shows: number, client, amount (formatted with `Intl.NumberFormat`), currency symbol, tax breakdown, status badge, due date
- [ ] Payment list shows: invoice number, amount, payment date, method, status
- [ ] All `mockData` imports removed from `Finance.tsx`
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass with MSW mock data

**Out of Scope**
- Invoice creation form (FRONT‑INT‑FIN)
- Payment execution (FRONT‑INT‑FIN)
- Customer payment portal (FRONT‑FIN‑006)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/finance/useInvoiceList.ts`, `artifacts/apex-os/src/hooks/finance/usePaymentList.ts`, `artifacts/apex-os/src/pages/Finance.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/finance-list.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert `Finance.tsx` mock imports
- Halt condition: if `pnpm run typecheck` fails due to currency type mismatch, stop and align types with `lib/api-zod` schema

**Rules to Follow**
- ALL currency amounts must use `Intl.NumberFormat` with the currency code from the invoice — never hardcode currency symbols
- Tax amounts must be displayed as a breakdown line (e.g., "VAT 20%: £X.XX") — not folded into the total
- Server-side sorting and filtering only — never sort/filter invoice arrays in the browser

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- finance-list.test.tsx
```

**Advanced Code Patterns**
- Abstract currency formatting: `formatCurrency(amount: number, currencyCode: string): string` utility in `src/lib/format.ts`
- Use `keepPreviousData` on invoice list pagination so the table does not flash empty on page change

**Anti-Patterns**
- Hardcoding "$" — finance is multi-currency; always use the currency code from the invoice
- Client-side tax calculation — taxes are always server-computed; display only what the API returns

**DDD / TDD / BDD / Deep Module notes**
- DDD: Invoice and Payment are separate aggregate roots in the Finance bounded context.
- TDD: MSW returns 3 invoices with different currencies; assert each is formatted correctly; assert tax breakdown lines render.
- BDD: "As a firm user, I can see all invoices with correct amounts in the invoice currency."
- Deep Module: `useInvoiceList` hides pagination, filter serialisation, and currency data.

---

### Subtasks

- [ ] FRONT‑FIN‑001.0.25 (AGENT): Read `Finance.tsx` in full and list every `mockData` reference and the currency/tax data shape consumed.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑001.0.5 (AGENT): Research latest best practices for multi-currency display and React Query patterns in finance applications (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑001.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑001.1 (AGENT): Create `useInvoiceList` and `usePaymentList` hooks with filter params.
  **File(s):** `artifacts/apex-os/src/hooks/finance/useInvoiceList.ts`, `artifacts/apex-os/src/hooks/finance/usePaymentList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑001.2 (AGENT): Replace mock data; display multi-currency amounts and tax breakdowns.
  **File(s):** `artifacts/apex-os/src/pages/Finance.tsx`
  **Verification:** No `mockData` references remain; `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑001.3 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/finance-list.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- finance-list.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑002: Budgets & Spend Cards – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Budget list and virtual card views in Finance use mock data. No `useBudgetList` or `useCardList` hooks exist.
**Size:** Small

**Description:** Create `useBudgetList` and `useCardList` hooks backed by `API-FIN-016`. Replace mock data in budget list and card views; display budget progress bars with actual vs budgeted spend; wire card freeze/unfreeze actions.

**Depends on:** API‑FIN‑016 (budgets API green), FRONT‑FIN‑001
**Blocks:** FRONT‑INT‑FIN
**Related Files:** `artifacts/apex-os/src/pages/Finance.tsx`, `artifacts/apex-os/src/hooks/finance/useBudgetList.ts`, `artifacts/apex-os/src/hooks/finance/useCardList.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; API client for budgets and cards
- Exports: `useBudgetList(filters?)`, `useCardList(filters?)`, `useFreezeCard()`

**Definition of Done**
- [ ] `useBudgetList` and `useCardList` hooks created
- [ ] Budget list: name, budgeted amount, actual spend, progress bar (colour-coded: green < 80%, amber 80-99%, red ≥ 100%)
- [ ] Card list: last 4 digits, cardholder, spending limit, current balance, status badge (active/frozen)
- [ ] Freeze/unfreeze toggle calls `useFreezeCard` mutation; card status badge updates optimistically
- [ ] All mock data removed from budget/card views
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Budget creation form (FRONT‑INT‑FIN)
- Virtual card creation (Phase 6+ — requires card issuing provider integration)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/finance/useBudgetList.ts`, `artifacts/apex-os/src/hooks/finance/useCardList.ts`, `artifacts/apex-os/src/pages/Finance.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/finance-budgets.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert mock imports
- Halt condition: if card freeze mutation affects card issuing provider state unexpectedly, stop and verify the API contract

**Rules to Follow**
- Budget progress percentage: `(actual / budgeted) * 100` — server-computed preferred; client fallback acceptable
- Freeze/unfreeze must disable the toggle during `isPending` to prevent double-submit

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- finance-budgets.test.tsx
```

**Advanced Code Patterns**
- Progress bar colour computed from percentage: `cn({ 'bg-green-500': pct < 80, 'bg-amber-500': pct < 100, 'bg-red-500': pct >= 100 })`

**Anti-Patterns**
- Computing budget progress client-side with floating-point arithmetic — use server-provided `actual_spend` field

**DDD / TDD / BDD / Deep Module notes**
- DDD: Budgets and Cards are separate aggregate roots in the Finance bounded context.
- TDD: MSW returns a budget at 95% — assert amber bar; simulate card freeze → assert status badge changes to "frozen".
- BDD: "As a firm user, I can see budget utilisation at a glance and freeze a card instantly."
- Deep Module: `useBudgetList` and `useCardList` hide pagination and mutation wiring.

---

### Subtasks

- [ ] FRONT‑FIN‑002.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑002.0.5 (AGENT): Research latest best practices for budget progress visualization and card status management (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑002.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑002.1 (AGENT): Create `useBudgetList` and `useCardList` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/finance/useBudgetList.ts`, `artifacts/apex-os/src/hooks/finance/useCardList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑002.2 (AGENT): Replace mock data; display budget progress bars and card status; wire freeze/unfreeze.
  **File(s):** `artifacts/apex-os/src/pages/Finance.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- finance-budgets.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑002.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INT‑FIN: Finance Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Invoice approve/reject buttons, payment form, and budget update form all render but have no mutation wiring.
**Size:** Medium

**Description:** Wire all Finance create/update mutations with idempotency key handling: invoice approve/reject (`useUpdateInvoice`), payment creation with client-side UUID idempotency key reused on retry (`useCreatePayment`), card freeze/unfreeze (`useUpdateCard`), budget update form (`useUpdateBudget`). All mutations show sonner toast feedback.

**Depends on:** FRONT‑FIN‑001, FRONT‑FIN‑002, FRONT‑INFRA‑003, FRONT‑INFRA‑004
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/Finance.tsx`, `artifacts/apex-os/src/hooks/finance/`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; `toast` from `sonner`; `crypto.randomUUID()`
- Exports: `useUpdateInvoice()`, `useCreatePayment()`, `useUpdateCard()`, `useUpdateBudget()`

**Definition of Done**
- [ ] Invoice approve button → `useUpdateInvoice({ status: 'approved' })`; rejection shows a reason input dialog first
- [ ] Payment form → `useCreatePayment` with idempotency key: generated as `crypto.randomUUID()` on form open; same key reused on retry (stored in component state, not re-generated)
- [ ] Card freeze/unfreeze → `useUpdateCard` with optimistic update
- [ ] Budget update form → `useUpdateBudget`; on success invalidates `['budgets']`
- [ ] All mutation `isPending` states disable the relevant button
- [ ] All mutations show sonner success/error toasts
- [ ] Integration tests with MSW cover all paths including idempotency key reuse

**Out of Scope**
- Payment execution via external payment rails (Stripe/ACH wiring — Phase 6+)
- Automated approval workflows (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/finance/useUpdateInvoice.ts`, `artifacts/apex-os/src/hooks/finance/useCreatePayment.ts`, `artifacts/apex-os/src/hooks/finance/useUpdateCard.ts`, `artifacts/apex-os/src/hooks/finance/useUpdateBudget.ts`, `artifacts/apex-os/src/pages/Finance.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/finance-interactive.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — comment out mutation wiring; forms revert to display-only
- Halt condition: if a duplicate payment is created despite idempotency key, stop immediately and audit the key reuse logic

**Rules to Follow**
- CRITICAL: Idempotency key must be generated ONCE per payment form session and REUSED on retry — never generate a new key on retry
- Rejection reason for invoice rejection is REQUIRED — do not call the mutation without a reason string
- Never display raw API error objects to the user — always show a human-readable toast message

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- finance-interactive.test.tsx
```

**Advanced Code Patterns**
- Idempotency key pattern: `const [idempotencyKey] = useState(() => crypto.randomUUID())` — initialised once on form mount; reused on all submit attempts
- Invalide both `['invoices']` and `['dashboard']` after invoice approval — keeps dashboard metrics current

**Anti-Patterns**
- Generating a new idempotency key on each retry — defeats the purpose; risks duplicate payments
- Calling mutation on button double-click — always disable button during `isPending`

**DDD / TDD / BDD / Deep Module notes**
- DDD: Finance mutations enforce domain rules (invoice approval workflow, payment immutability) via the API.
- TDD: Simulate payment form submit twice with the same idempotency key → assert only one `POST /payments` is sent with that key; MSW returns 200 for first, 409 Conflict for second → assert no duplicate toast.
- BDD: "As a firm user, I can approve an invoice and submit a payment, knowing that accidental double-submission won't create duplicate records."
- Deep Module: `useCreatePayment` hides idempotency key management and retry handling; the component just calls `mutate(formData)`.

---

### Subtasks

- [ ] FRONT‑INT‑FIN.0.25 (AGENT): List all Finance mutation surfaces; verify idempotency key storage pattern.
  *No action — pause until fully understood.*

- [ ] FRONT‑INT‑FIN.1 (AGENT): Implement `useUpdateInvoice`; wire approve/reject with reason dialog.
  **File(s):** `artifacts/apex-os/src/hooks/finance/useUpdateInvoice.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑FIN.2 (AGENT): Implement `useCreatePayment` with idempotency key; wire payment form.
  **File(s):** `artifacts/apex-os/src/hooks/finance/useCreatePayment.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑FIN.3 (AGENT): Implement `useUpdateBudget`; wire budget update form.
  **File(s):** `artifacts/apex-os/src/hooks/finance/useUpdateBudget.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑FIN.4 (AGENT): Add sonner toasts for all mutations; write integration tests including idempotency key reuse.
  **File(s):** `artifacts/apex-os/src/pages/Finance.tsx`, `artifacts/apex-os/src/pages/__tests__/finance-interactive.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- finance-interactive.test.tsx` → GREEN.

- [ ] FRONT‑INT‑FIN.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑003: Invoice Template Designer
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No invoice template designer UI exists.
**Size:** Medium

**Description:** Visual invoice template designer with drag-and-drop layout editor (logo, colour picker, field placement, column selection), live preview with sample data, template save/apply, and template list with edit/delete.

**Depends on:** API‑FIN‑004 (invoices API, template sub-resource), FRONT‑FIN‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/finance/InvoiceTemplateDesigner.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; dnd-kit for layout drag-and-drop; shadcn/ui ColorPicker
- Exports: `InvoiceTemplateDesigner` component

**Definition of Done**
- [ ] Drag-and-drop layout editor: move logo, address block, line items table, totals block, footer text
- [ ] Colour picker for header background and accent colour
- [ ] Live preview panel shows a sample invoice rendered with current template settings
- [ ] "Save Template" form: template name input; calls `useCreateInvoiceTemplate` mutation
- [ ] Template list with "Apply to new invoices" toggle and delete action
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- PDF generation (server-side — triggered on invoice send)
- Custom font upload (Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/finance/InvoiceTemplateDesigner.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/finance/__tests__/InvoiceTemplateDesigner.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `InvoiceTemplateDesigner`; template UI reverts to list-only
- Halt condition: if colour picker crashes on certain browser environments, fall back to hex input field

**Rules to Follow**
- Template layout is stored as a JSON blob (field positions array) — never as hardcoded CSS in the DB
- Live preview must debounce colour picker changes (250 ms) to avoid excessive re-renders

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- InvoiceTemplateDesigner.test.tsx
```

**Advanced Code Patterns**
- Represent the layout as `{ id: string, position: { x: number, y: number }, width: number }[]` — dnd-kit manages position state
- Generate the preview as a React component (not an iframe or canvas) for easy styling

**Anti-Patterns**
- Storing pixel-exact positions — use a grid system so templates remain usable across different paper sizes

**DDD / TDD / BDD / Deep Module notes**
- DDD: Invoice templates are a configuration concept within the Finance bounded context; they don't affect Invoice aggregate data.
- TDD: MSW returns template list; assert list renders; simulate save → assert `POST /invoice-templates` called with layout JSON.
- BDD: "As a firm user, I can design a branded invoice template and apply it to all new invoices."
- Deep Module: `InvoiceTemplateDesigner` hides drag-and-drop layout state, preview rendering, and template CRUD.

---

### Subtasks

- [ ] FRONT‑FIN‑003.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑003.0.5 (AGENT): Research latest best practices for drag-and-drop template designers and live preview patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑003.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑003.1 (AGENT): Build drag-and-drop layout editor with dnd-kit.
  **File(s):** `artifacts/apex-os/src/components/finance/InvoiceTemplateDesigner.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑003.2 (AGENT): Implement live preview panel with debounced updates.
  **File(s):** `artifacts/apex-os/src/components/finance/InvoiceTemplateDesigner.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑003.3 (AGENT): Wire template save/list/delete mutations; write component test.
  **File(s):** `artifacts/apex-os/src/components/finance/InvoiceTemplateDesigner.tsx`, `artifacts/apex-os/src/components/finance/__tests__/InvoiceTemplateDesigner.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- InvoiceTemplateDesigner.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑003.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑004: AP Inbox UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No AP Inbox UI exists. `API-FIN-021` is not wired.
**Size:** Medium

**Description:** AP Inbox view for captured vendor invoices: list with status badges and confidence scores, detail view with extracted data side-by-side with original file preview, "Create Bill" button pre-filling the bill form, "Reject" button, and manual file upload.

**Depends on:** API‑FIN‑021 (AP inbox API green), FRONT‑FIN‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/finance/APInbox.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `useDropzone` from `react-dropzone`
- Exports: `APInbox` component

**Definition of Done**
- [ ] Inbox list: vendor name (or "Unknown"), status badge (`pending_review` / `processed` / `error`), confidence score (%), capture date
- [ ] Detail view: side-by-side — left: original file preview (PDF iframe or image); right: extracted fields (editable)
- [ ] "Create Bill" button: navigates to bill form with extracted fields pre-populated; user can correct before saving
- [ ] "Reject" button: calls `useRejectAPCapture` mutation; requires rejection note
- [ ] Manual upload drag-and-drop: calls `useUploadAPCapture` mutation; shows upload progress; refreshes inbox list on completion
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- OCR engine configuration (backend concern)
- AI-powered data extraction (Phase 10)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/finance/APInbox.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/finance/__tests__/APInbox.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `APInbox`; AP tab shows placeholder
- Halt condition: if file upload sends files without size validation, stop and add client-side size check (max 10 MB)

**Rules to Follow**
- File upload must validate: max 10 MB, allowed types `application/pdf`, `image/jpeg`, `image/png` — reject client-side before API call
- Confidence score < 60% must display a warning: "Low confidence — please review all extracted fields carefully"

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- APInbox.test.tsx
```

**Advanced Code Patterns**
- Upload progress: use `XMLHttpRequest` with `onprogress` event (not `fetch`) to track upload percentage
- Side-by-side layout: CSS Grid with `grid-cols-[1fr_1fr]` — resize handle optional in Phase 5

**Anti-Patterns**
- Accepting all file types — always validate MIME type and file size before upload
- Not showing upload progress — users abandon large uploads without feedback

**DDD / TDD / BDD / Deep Module notes**
- DDD: AP capture records are pre-processing artifacts; they become AP Bill entities only after "Create Bill" is executed.
- TDD: MSW returns inbox list; assert status badges render; simulate "Create Bill" → assert navigation to bill form with pre-filled data.
- BDD: "As an AP clerk, I can review automatically captured vendor invoices and convert them to bills with one click."
- Deep Module: `APInbox` hides file upload progress tracking, extraction confidence display, and bill pre-fill navigation.

---

### Subtasks

- [ ] FRONT‑FIN‑004.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑004.0.5 (AGENT): Research latest best practices for AP inbox UI and file upload with confidence scoring (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑004.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑004.1 (AGENT): Implement AP inbox list with status badges and confidence scores.
  **File(s):** `artifacts/apex-os/src/components/finance/APInbox.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑004.2 (AGENT): Build detail view (side-by-side file preview + extracted fields) and "Create Bill" navigation.
  **File(s):** `artifacts/apex-os/src/components/finance/APInbox.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑004.3 (AGENT): Add manual file upload with validation and progress tracking; write component test.
  **File(s):** `artifacts/apex-os/src/components/finance/APInbox.tsx`, `artifacts/apex-os/src/components/finance/__tests__/APInbox.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- APInbox.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑004.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑005: Payment Run UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No payment run UI exists. `API-FIN-018` is not wired.
**Size:** Medium

**Description:** Payment run management: list of runs with status and totals, create payment run wizard (select approved bills → review total → choose date/bank account → confirm), payment run detail view (bill breakdown, per-vendor amounts), execute/cancel actions with confirmation dialogs, and payment run history.

**Depends on:** API‑FIN‑018 (payment run API green), FRONT‑FIN‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/finance/PaymentRunUI.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Dialog, Table from shadcn/ui
- Exports: `PaymentRunUI` component

**Definition of Done**
- [ ] Payment run list: run ID, status badge (`draft`/`processing`/`completed`/`cancelled`), total amount, payment date, bill count
- [ ] Create payment run wizard: Step 1 — select approved bills (checkbox list with total preview); Step 2 — choose payment date and bank account; Step 3 — review summary → confirm
- [ ] Run detail: per-bill breakdown table; per-vendor subtotals
- [ ] Execute button (on `draft` runs) shows confirmation dialog → calls `useExecutePaymentRun` mutation
- [ ] Cancel button (on unexecuted runs) calls `useCancelPaymentRun` mutation with reason
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- External payment rail execution (Stripe/ACH — Phase 6+)
- Payment reconciliation (FRONT‑FIN‑007)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/finance/PaymentRunUI.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/finance/__tests__/PaymentRunUI.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `PaymentRunUI`; payment run tab shows placeholder
- Halt condition: if execute action cannot be rolled back (payment processing starts), add a real-time status poller before enabling the execute button

**Rules to Follow**
- Execute action: must require explicit confirmation with a warning: "This will initiate payment processing and cannot be undone."
- Cancel action: only allowed on `draft` status runs — button must be hidden/disabled for `processing` and `completed`

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- PaymentRunUI.test.tsx
```

**Advanced Code Patterns**
- Wizard step state machine: `'select-bills' | 'configure' | 'confirm' | 'processing'`
- Running total computation in Step 1: sum selected bills' amounts client-side for instant preview (server confirms on execute)

**Anti-Patterns**
- Allowing bill selection without showing the running total — users need to see what they're committing to
- Enabling execute on non-draft runs — always gate behind status check

**DDD / TDD / BDD / Deep Module notes**
- DDD: Payment Run is an aggregate root in the Finance bounded context; it aggregates multiple Bill payments into a single execution.
- TDD: MSW returns draft payment run; assert detail shows bills; simulate execute → assert confirmation dialog shown → confirm → assert `POST /payment-runs/:id/execute` called.
- BDD: "As an AP manager, I can create a payment run from approved bills and execute it to initiate payment."
- Deep Module: `PaymentRunUI` hides multi-step wizard state, bill selection, and execution confirmation.

---

### Subtasks

- [ ] FRONT‑FIN‑005.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑005.0.5 (AGENT): Research latest best practices for payment run wizards and multi-step financial workflows (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑005.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑005.1 (AGENT): Build payment run list and detail view.
  **File(s):** `artifacts/apex-os/src/components/finance/PaymentRunUI.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑005.2 (AGENT): Implement create payment run wizard with bill selection and summary.
  **File(s):** `artifacts/apex-os/src/components/finance/PaymentRunUI.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑005.3 (AGENT): Wire execute/cancel actions with confirmation dialogs; write component test.
  **File(s):** `artifacts/apex-os/src/components/finance/PaymentRunUI.tsx`, `artifacts/apex-os/src/components/finance/__tests__/PaymentRunUI.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- PaymentRunUI.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑005.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑006: Customer Payment Portal
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No customer payment portal UI exists. `API-FIN-023` and `API-AR-008` are not wired.
**Size:** Medium

**Description:** Branded customer-facing payment portal (separate route from the firm portal): magic-link login, dashboard of open invoices, payment page with ACH/card method selection, payment history with receipts, auto-pay enrollment toggle, and branding driven by the portal config API.

**Depends on:** API‑FIN‑023 (payment portal config API), API‑AR‑008 (AR invoices API), FRONT‑AUTH‑003 (portal magic-link auth)
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/portal/PaymentPortal.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `PortalAuthContext` (FRONT‑AUTH‑003); portal config API
- Exports: `PaymentPortal` page; register route in `App.tsx`

**Definition of Done**
- [ ] Route `/portal/pay` registered and behind `PortalProtectedRoute`
- [ ] Dashboard: open invoices list with amounts due, due dates, and "Pay Now" action
- [ ] Payment page: choose payment method (ACH or card); enter amount; submit via `useCreateClientPayment` with idempotency key
- [ ] Payment history: list of past payments with date, amount, method, and "Download Receipt" link
- [ ] Auto-pay enrollment toggle: calls `useUpdateAutoPayPreference` mutation
- [ ] Portal branding (logo, primary colour) applied from `GET /api/v1/portal-config` response
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Stripe Elements card input (Phase 6+ — requires Stripe integration)
- Multiple client logins within one session

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/pages/portal/PaymentPortal.tsx`, `artifacts/apex-os/src/App.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/portal/__tests__/PaymentPortal.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: remove the route from `App.tsx`; delete `PaymentPortal.tsx`
- Halt condition: if portal branding CSS variable injection conflicts with the global design system, isolate the portal under a scoped CSS class

**Rules to Follow**
- Payment idempotency key: same pattern as FRONT‑INT‑FIN — `crypto.randomUUID()` on page load; reused on retry
- Portal branding CSS variables must be applied to a scoped container (`data-portal` attribute) — never to `:root` (would affect firm UI)

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- PaymentPortal.test.tsx
```

**Advanced Code Patterns**
- Inject portal branding as inline CSS variables on the portal root element: `style={{ '--brand-color': config.primaryColor }}`
- Use a `PortalBrandingProvider` context so nested components can read brand tokens without prop drilling

**Anti-Patterns**
- Setting branding variables on `:root` — bleeds into the firm UI
- Sharing the same auth context as the firm portal — payment portal clients must use `PortalAuthContext`, not `AuthContext`

**DDD / TDD / BDD / Deep Module notes**
- DDD: The payment portal serves the client-side of the Finance bounded context; it is a read-only consumer of AR invoices and a write consumer of AR payments.
- TDD: MSW returns open invoices; assert dashboard shows them; simulate payment submit → assert `POST /client-payments` called with idempotency key.
- BDD: "As a client, I can log in to the payment portal, see my outstanding invoices, and make a payment."
- Deep Module: `PaymentPortal` hides portal auth, branding injection, and payment submission from the firm's main app.

---

### Subtasks

- [ ] FRONT‑FIN‑006.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑006.0.5 (AGENT): Research latest best practices for customer payment portals and branded client experiences (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑006.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑006.1 (AGENT): Create `PaymentPortal` page; register route; apply portal branding from config.
  **File(s):** `artifacts/apex-os/src/pages/portal/PaymentPortal.tsx`, `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑006.2 (AGENT): Build open invoices dashboard and payment page with idempotency key.
  **File(s):** `artifacts/apex-os/src/pages/portal/PaymentPortal.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑006.3 (AGENT): Add payment history, auto-pay toggle; write component tests.
  **File(s):** `artifacts/apex-os/src/pages/portal/PaymentPortal.tsx`, `artifacts/apex-os/src/pages/portal/__tests__/PaymentPortal.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- PaymentPortal.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑006.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑007: Collections Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No collections workbench UI exists. `API-FIN-022` is not wired.
**Size:** Medium

**Description:** AR collections workbench: AR aging bar chart (current / 1-30 / 31-60 / 61-90 / 90+ days buckets), prioritised collection queue grouped by customer, contact logging (call/email with outcome), promise-to-pay tracking with follow-up date, and escalation indicators.

**Depends on:** API‑FIN‑022 (collections activity API), API‑FIN‑020 (reconciliation API), FRONT‑FIN‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/finance/CollectionsDashboard.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `BarChart` from `recharts`
- Exports: `CollectionsDashboard` component

**Definition of Done**
- [ ] AR aging bar chart: one bar per aging bucket; clicking a bucket filters the collection queue below
- [ ] Collection queue: overdue invoices grouped by customer, sorted by amount owed; expandable row showing invoice detail
- [ ] Contact log form: activity type (call/email), outcome (`contacted`/`left_message`/`promise_to_pay`/`disputed`), notes, follow-up date; calls `useLogCollectionActivity`
- [ ] Promise-to-pay tracking: follow-up date badge on customer row; overdue follow-ups shown in red
- [ ] Escalation indicator: invoices > 90 days with no contact in last 30 days show a red flag badge
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Automated dunning emails (Phase 7+)
- Debt sale workflow (Phase 8+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/finance/CollectionsDashboard.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/finance/__tests__/CollectionsDashboard.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `CollectionsDashboard`; collections tab shows placeholder
- Halt condition: if escalation indicator logic is incorrect (false positives/negatives), stop and verify the escalation rule against API documentation

**Rules to Follow**
- Aging bucket boundaries are as defined by the API — do not hardcode different thresholds
- Contact logging outcome `'promise_to_pay'` must require a follow-up date — block form submission without it

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- CollectionsDashboard.test.tsx
```

**Advanced Code Patterns**
- Use Recharts `onClick` on the aging bar chart to set a filter state that scopes the collection queue below
- Escalation computation: `(invoice.daysOverdue > 90 && invoice.lastContactDate < 30 days ago)` — prefer server-computed `is_escalated` flag if available

**Anti-Patterns**
- Loading all AR invoices to compute aging client-side — always use the API's pre-aggregated aging response
- Allowing contact log submission without outcome selection — outcome is required for tracking

**DDD / TDD / BDD / Deep Module notes**
- DDD: Collections is an AR sub-domain; collection activities are domain events logged against Invoice aggregates.
- TDD: MSW returns aging data; assert 5 bars render; simulate bucket click → assert collection queue filtered; simulate contact log submit → assert mutation called.
- BDD: "As an AR manager, I can see aging receivables at a glance, work through the collection queue, and log contact attempts."
- Deep Module: `CollectionsDashboard` hides aging chart data, queue grouping, and activity logging mutations.

---

### Subtasks

- [ ] FRONT‑FIN‑007.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑007.0.5 (AGENT): Research latest best practices for collections dashboards and AR aging visualizations (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑007.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑007.1 (AGENT): Build AR aging bar chart (Recharts) with bucket click filter.
  **File(s):** `artifacts/apex-os/src/components/finance/CollectionsDashboard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑007.2 (AGENT): Build collection queue with expandable customer rows and contact log form.
  **File(s):** `artifacts/apex-os/src/components/finance/CollectionsDashboard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑007.3 (AGENT): Add escalation indicators and promise-to-pay follow-up tracking; write component test.
  **File(s):** `artifacts/apex-os/src/components/finance/CollectionsDashboard.tsx`, `artifacts/apex-os/src/components/finance/__tests__/CollectionsDashboard.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- CollectionsDashboard.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑007.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑008: 1099 Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No 1099 tracking UI exists. `API-FIN-019` is not wired.
**Size:** Small

**Description:** 1099 tracking interface: list of 1099-eligible vendors with year-to-date payment totals, filter by year and filing status, vendor detail with monthly payment breakdown, "Refresh Totals" action, CSV export, and filing status update.

**Depends on:** API‑FIN‑019 (1099 preparation API), FRONT‑FIN‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/finance/Dashboard1099.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `saveAs` from `file-saver` for CSV download
- Exports: `Dashboard1099` component

**Definition of Done**
- [ ] Vendor list: name, EIN (masked), YTD amount, filing status badge (`not_started`/`ready_to_file`/`filed`)
- [ ] Year filter and filing status filter controls; both filter server-side via query params
- [ ] Vendor detail panel: month-by-month payment breakdown table; total; filing history
- [ ] "Refresh Totals" button calls `useRefresh1099Totals` mutation; shows spinner while processing
- [ ] "Export CSV" button: calls `GET /api/v1/1099/export?year=YYYY` → triggers browser download via `file-saver`
- [ ] Filing status update: "Mark Ready" / "Mark Filed" buttons per vendor; call `useUpdate1099Status` mutation
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- IRS e-file submission (Phase 7+ — requires IRS TCC setup)
- W-9 collection workflow (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/finance/Dashboard1099.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/finance/__tests__/Dashboard1099.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `Dashboard1099`; 1099 tab shows placeholder
- Halt condition: if CSV export contains real EINs without masking, stop and verify the API response masks sensitive fields

**Rules to Follow**
- EIN must be masked in the list view (show last 4 digits: `***-**-1234`) — full EIN shown only on vendor detail for authorised users
- "Refresh Totals" must be idempotent — calling it twice should not double-count payments

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- Dashboard1099.test.tsx
```

**Advanced Code Patterns**
- Trigger CSV download via `fetch` + `file-saver`: `fetch('/api/v1/1099/export?year=2025').then(r => r.blob()).then(blob => saveAs(blob, '1099-2025.csv'))`
- Year filter defaults to the current year: `new Date().getFullYear()`

**Anti-Patterns**
- Displaying unmasked EINs in the list — PII exposure risk; always mask in list view
- Sending multiple export requests in parallel — use a loading state to disable the export button during download

**DDD / TDD / BDD / Deep Module notes**
- DDD: 1099 preparation is a compliance sub-domain of Finance; it aggregates payment data from AP to satisfy IRS reporting requirements.
- TDD: MSW returns vendor list; assert masked EINs; assert filing status badges; simulate "Refresh Totals" → assert mutation called; simulate "Export CSV" → assert download triggered.
- BDD: "As an accountant, I can track 1099 filing status for all eligible vendors and export the data for tax preparation."
- Deep Module: `Dashboard1099` hides YTD computation display, CSV export fetch, and filing status mutation.

---

### Subtasks

- [ ] FRONT‑FIN‑008.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑008.0.5 (AGENT): Research latest best practices for 1099 compliance interfaces and tax preparation workflows (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑008.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑008.1 (AGENT): Build vendor list with EIN masking, filters, and filing status badges.
  **File(s):** `artifacts/apex-os/src/components/finance/Dashboard1099.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑008.2 (AGENT): Build vendor detail panel; wire "Refresh Totals" and "Mark Filed" mutations.
  **File(s):** `artifacts/apex-os/src/components/finance/Dashboard1099.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑008.3 (AGENT): Implement CSV export button; write component tests.
  **File(s):** `artifacts/apex-os/src/components/finance/Dashboard1099.tsx`, `artifacts/apex-os/src/components/finance/__tests__/Dashboard1099.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- Dashboard1099.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑008.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑FIN‑009: Mobile Swipe-to-Approve / Reason-on-Denial
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Invoice approval/rejection uses button-based actions only. No swipe gesture support exists.
**Size:** Small

**Description:** Add swipe-to-approve / swipe-to-deny gesture interactions on invoice/bill list items on mobile (progressive enhancement: also available as mouse drag on desktop). Swipe right → `useUpdateInvoice` approved mutation. Swipe left → rejection modal with required reason. 5-second undo toast after any swipe action.

**Depends on:** FRONT‑INT‑FIN
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/finance/SwipeableInvoiceItem.tsx`

**Imports / Exports**
- Imports: `useMutation` from `@tanstack/react-query`; `useSwipeable` from `react-swipeable`; `toast` from `sonner`
- Exports: `SwipeableInvoiceItem` component

**Definition of Done**
- [ ] Swipe right shows green "Approve" reveal; releases → fires approve mutation with optimistic update
- [ ] Swipe left shows red "Deny" reveal; releases → opens denial modal requiring a reason text input
- [ ] 5-second undo toast: clicking "Undo" fires a reversal mutation before the timeout
- [ ] Button-based approve/reject still available (accessible alternative for keyboard/screen reader users)
- [ ] Desktop: drag gesture with mouse triggers the same logic (progressive enhancement)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Swipe actions for non-finance entities (future scope)
- Native mobile app (PWA only in Phase 5)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/finance/SwipeableInvoiceItem.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/finance/__tests__/SwipeableInvoiceItem.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — revert invoice list to standard `InvoiceItem` without swipe; remove `SwipeableInvoiceItem`
- Halt condition: if swipe gesture conflicts with page scroll on mobile, disable swipe and keep button-based workflow

**Rules to Follow**
- Swipe actions must not fire if the swipe distance is < 40% of the item width — prevent accidental triggers
- Denial reason is REQUIRED before the mutation fires — block the modal submit if the reason field is empty
- Undo must fire a reversal API call, not just optimistic cache rollback — the backend must support approval reversal

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- SwipeableInvoiceItem.test.tsx
```

**Advanced Code Patterns**
- `react-swipeable` `onSwipedRight` / `onSwipedLeft` with `delta: 0.4 * itemWidth` threshold
- Undo state: `const [pendingUndo, setPendingUndo] = useState<{ invoiceId: string; action: 'approve' | 'deny' } | null>(null)` with `setTimeout` for auto-commit

**Anti-Patterns**
- Using a new idempotency key on undo reversal — undo must send a distinct `PATCH` reversal, not a repeat of the original action
- Missing keyboard-accessible alternative — swipe-only UX fails WCAG 2.5.1 (pointer gestures)

**DDD / TDD / BDD / Deep Module notes**
- DDD: Swipe gesture is a view-layer interaction; the Finance domain mutation is the same regardless of input method.
- TDD: Simulate swipe right → assert approve mutation called; simulate swipe left → assert denial modal opens; simulate "Undo" click → assert reversal mutation called.
- BDD: "On my phone, I can quickly approve an invoice by swiping right, or deny it by swiping left and writing a short reason."
- Deep Module: `SwipeableInvoiceItem` wraps any invoice row with swipe logic; the calling list just replaces `<InvoiceItem>` with `<SwipeableInvoiceItem>`.

---

### Subtasks

- [ ] FRONT‑FIN‑009.0.25 (AGENT): Read the entire task and all related info.
  *No action — pause until fully understood.*

- [ ] FRONT‑FIN‑009.0.5 (AGENT): Research latest best practices for mobile swipe gestures and accessibility in financial apps (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑FIN‑009.0.75 (AGENT): Reason about the task and any ambiguity.
  *If uncertain, ask the user before executing.*

- [ ] FRONT‑FIN‑009.1 (AGENT): Implement `SwipeableInvoiceItem` with right/left swipe reveals using `react-swipeable`.
  **File(s):** `artifacts/apex-os/src/components/finance/SwipeableInvoiceItem.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑009.2 (AGENT): Wire swipe-right to approve mutation (optimistic); swipe-left to denial modal with required reason.
  **File(s):** `artifacts/apex-os/src/components/finance/SwipeableInvoiceItem.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑FIN‑009.3 (AGENT): Add 5-second undo toast with reversal mutation; write component tests.
  **File(s):** `artifacts/apex-os/src/components/finance/SwipeableInvoiceItem.tsx`, `artifacts/apex-os/src/components/finance/__tests__/SwipeableInvoiceItem.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- SwipeableInvoiceItem.test.tsx` → GREEN.

- [ ] FRONT‑FIN‑009.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---
