# TODO-P7-APAR.md – Phase 7 AP/AR Payment & Bank Integrations

This document contains AP/AR payment and bank integration tasks including Stripe ACH via Treasury, Plaid bank feed integration, BILL vendor network, multi‑currency payments, and NACHA file generation. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 AP/AR Integration Task Index

- [ ] INT‑AP‑001 – Stripe ACH/Wire Integration
- [ ] INT‑AP‑002 – Plaid Bank Feed Integration
- [ ] INT‑AR‑001 – Stripe Payment Links (Customer Payments)
- [ ] INT‑AR‑002 – Plaid Bank Account Verification
- [ ] INT‑FIN‑001 – BILL Vendor Network Integration
- [ ] INT‑FIN‑002 – Multi‑Currency Payment Execution
- [ ] INT‑FIN‑003 – NACHA ACH File Generation

---

## [ ] INT‑AP‑001: Stripe ACH/Wire Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment execution layer exists. Bill payments in Apex are marked as "paid" manually. As of May 2026, Stripe Treasury supports `OutboundTransfer` for ACH credits and domestic wires, with webhook‑driven status updates and idempotency keys. Stripe Node.js SDK v17+ is the current library. Stripe Treasury account must be provisioned by the human operator before this task runs.
**Size:** Medium

**Description:** Implement outbound ACH credit payment execution via Stripe Treasury, including idempotent transfer creation, webhook‑driven status updates, and reconciliation of Stripe transfers to Apex bill payment records.

**Depends on:** API‑AP‑008 (bills API), API‑AP‑014 (bill payments API), JOB‑INFRA‑001 (background jobs for async webhook processing)
**Blocks:** INT‑AP‑002 (Plaid bank feed reconciliation depends on payment records created here)
**Related Files:** `integrations/stripe/ach-payments.ts`, `integrations/stripe/ach-webhooks.ts`, `lib/integrations/ach-reconciliation/index.ts`

**Imports / Exports**
- Imports: `PaymentPort` interface, `stripe` npm SDK (v17+), `BillPayment` domain entity
- Exports: `StripeACHProcessor`, `ACHWebhookHandler`, `ACHReconciliationService`

**Definition of Done**
- [ ] `initiateStripeACHPayment(billPaymentId, bankAccountId, amount)` creates a Stripe Treasury `OutboundTransfer` with idempotency key derived from `billPaymentId`
- [ ] Webhook handler processes `outbound_transfer.created`, `outbound_transfer.posted`, `outbound_transfer.failed`, `outbound_transfer.returned` events
- [ ] Stripe webhook signature verified using `stripe.webhooks.constructEvent()` on every inbound event
- [ ] Bill payment record updated to `processing | paid | failed` based on webhook events
- [ ] Reconciliation service matches Stripe `OutboundTransfer.id` to `BillPayment.externalPaymentId`
- [ ] Idempotency: re‑submitting the same `billPaymentId` returns the existing transfer without creating a duplicate
- [ ] Rate limit handling: exponential backoff with jitter for Stripe 429 responses
- [ ] Unit tests pass using Stripe test mode (`sk_test_*`) with fixture webhook payloads
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- Stripe ACH debits (customer collections – handled in INT‑AR‑001)
- International wire transfers via Stripe (handled in INT‑FIN‑002)
- Real‑time payments (RTP) network
- Stripe Connect marketplace flows

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, any `sk_live_*` keys
- Never use live Stripe keys in tests; always use `sk_test_*`
- Never skip `stripe.webhooks.constructEvent()` signature verification

**Output Artifacts**
- Code changes in: `integrations/stripe/`, `lib/integrations/ach-reconciliation/`
- Tests added/updated in: `integrations/stripe/ach-payments.test.ts`, `integrations/stripe/ach-webhooks.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level – delete `integrations/stripe/ach-payments.ts` and `ach-webhooks.ts`; deregister Stripe webhook endpoint
- Halt condition: if Stripe Treasury `OutboundTransfer` returns status `failed` with code `insufficient_funds` consistently in sandbox, stop and ask user to verify Treasury test funds

**Rules to Follow**
- Use Stripe Node.js SDK v17+ (`stripe` npm package); pin the API version to `2026-04-22` via `new Stripe(key, { apiVersion: '2026-04-22' })`
- Idempotency keys: always pass `{ idempotencyKey: billPaymentId }` to every Stripe write call
- Webhook endpoint must be registered at `/webhooks/stripe/ach` and must return HTTP 200 within 5 s
- Store only the Stripe `OutboundTransfer.id` (not raw account numbers) in the DB as `externalPaymentId`
- Use Pino structured logging; log Stripe event type and `id` on receipt; never log raw event payload

**Verification**
```bash
# Test ACH payment processing
pnpm vitest run -- integrations/stripe/ach-payments.test.ts

# Test ACH webhooks
pnpm vitest run -- integrations/stripe/ach-webhooks.test.ts

# Test reconciliation
pnpm vitest run -- lib/integrations/ach-reconciliation/reconciliation.test.ts

# Full typecheck
pnpm run typecheck

# Manual smoke test (Stripe test mode)
curl -X POST http://localhost:8081/integrations/stripe/ach/test-payment
```

**Advanced Code Patterns**
- Idempotency via Stripe idempotency keys tied to internal `billPaymentId` prevents duplicate transfers on retry
- Webhook idempotency: use `event.id` as a deduplication key in a `processed_webhook_events` table to handle Stripe re‑deliveries
- Status machine: `BillPayment` follows `pending → processing → paid | failed | returned`; transitions driven exclusively by webhook events

**Anti‑Patterns**
- Do not poll Stripe for transfer status – use webhooks exclusively for status updates
- Do not skip webhook signature verification – unsigned webhooks are a critical SSRF/injection vector
- Do not store raw bank account numbers; store only Stripe `BankAccount.id` or `FinancialAccount.id`
- Do not process webhooks synchronously in the HTTP handler; enqueue to a job queue and return 200 immediately

**DDD / TDD / BDD / Deep Module notes**
- DDD: ACH payment execution belongs to the AP sub‑domain of Finance. `StripeACHProcessor` is an infrastructure adapter; the domain service `PaymentRunService` calls it via `PaymentPort`.
- TDD: Write unit tests using Stripe test‑mode fixtures and pre‑recorded webhook payloads before implementing handlers.
- BDD: Scenario – "Given a bill payment is approved and a bank account is linked, When `initiateStripeACHPayment` is called, Then a Stripe `OutboundTransfer` is created with the correct amount and the bill payment status transitions to `processing`."
- Deep Module: `StripeACHProcessor` hides all Stripe SDK complexity (idempotency, retries, rate limits) behind a single `pay(billPaymentId)` method.

---

### Subtasks

- [ ] INT‑AP‑001.0.25 (AGENT): Read the entire task, Stripe Treasury OutboundTransfer docs, and the `PaymentPort` interface definition.
  *No action – pause until fully understood.*

- [ ] INT‑AP‑001.0.5 (AGENT): Research Stripe Treasury OutboundTransfer API (as of May 2026), idempotency key best practices, and webhook deduplication patterns.
  *Document findings briefly or note "no changes."*

- [ ] INT‑AP‑001.0.75 (AGENT): Reason about idempotency key design, webhook deduplication table schema, and whether the job queue exists for async webhook processing.
  *If uncertain about infrastructure, ask the user before executing.*

- [ ] INT‑AP‑001.1 (AGENT): Implement `StripeACHProcessor` with idempotent `OutboundTransfer` creation.
  **File(s):** `integrations/stripe/ach-payments.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/ach-payments.test.ts`

- [ ] INT‑AP‑001.2 (AGENT): Implement webhook handler with signature verification and status‑machine transitions.
  **File(s):** `integrations/stripe/ach-webhooks.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/ach-webhooks.test.ts`

- [ ] INT‑AP‑001.3 (AGENT): Implement reconciliation service matching `OutboundTransfer.id` to `BillPayment`.
  **File(s):** `lib/integrations/ach-reconciliation/index.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/ach-reconciliation/reconciliation.test.ts`

- [ ] INT‑AP‑001.4 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑AP‑001.N (HUMAN): Final review – verify a test payment in Stripe dashboard and approve.
  **Verification:** Approved.

---

## [ ] INT‑AP‑002: Plaid Bank Feed Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No bank feed exists. Bank accounts are manually reconciled in Apex. As of May 2026, Plaid's `/transactions/sync` endpoint replaces the deprecated `/transactions/get` for cursor‑based incremental transaction sync. `plaid` npm SDK v14+ is the current library. Plaid sandbox credentials must be provisioned by the human operator.
**Size:** Large

**Description:** Implement Plaid Link for bank account connection, incremental transaction sync using Plaid's `/transactions/sync` endpoint, automatic payment reconciliation, and real‑time webhook processing for new transaction notifications.

**Depends on:** DB‑FIN‑005 (bank accounts schema), API‑AP‑008 (bills API), API‑AP‑014 (bill payments API)
**Blocks:** INT‑AR‑001 (Stripe Payment Links – bank account data referenced)
**Related Files:** `integrations/plaid/bank-feed.ts`, `integrations/plaid/link-client.ts`, `integrations/plaid/webhooks.ts`, `lib/integrations/bank-reconciliation/index.ts`

**Imports / Exports**
- Imports: `plaid` npm SDK (v14+), `PlaidApi`, `PlaidEnvironments`, `BankAccount` domain entity
- Exports: `PlaidBankFeedService`, `PlaidLinkTokenService`, `PlaidWebhookHandler`, `BankReconciliationService`

**Definition of Done**
- [ ] `createLinkToken(userId, accountId)` generates a short‑lived Plaid Link token for the frontend
- [ ] `exchangePublicToken(publicToken)` exchanges for `access_token`; access token stored encrypted in DB
- [ ] `syncBankTransactions(bankAccountId, cursor)` uses `/transactions/sync` for incremental updates (added/modified/removed)
- [ ] Sync cursor (`next_cursor`) persisted per bank account for resumable incremental sync
- [ ] Automatic reconciliation matches Plaid transactions to Apex bill payments using amount + date fuzzy matching
- [ ] Bank balance synced via `/accounts/balance/get` after each transaction sync
- [ ] Plaid webhook handler processes `TRANSACTIONS_SYNC_UPDATES_AVAILABLE` and `ITEM_ERROR` events
- [ ] Plaid webhook signature verified using the raw request body and `Plaid-Verification` header
- [ ] Access tokens stored encrypted (AES‑256‑GCM) in DB; never logged or returned in API responses
- [ ] Unit tests pass against Plaid sandbox
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- Plaid Investments product
- Plaid Identity product
- Plaid Signal (ACH risk scoring)
- International bank accounts (non‑US/CA)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `PLAID_SECRET`, `PLAID_CLIENT_ID`, Plaid access tokens
- Never log Plaid access tokens or account numbers in any log statement
- Never use Plaid production environment without explicit human approval

**Output Artifacts**
- Code changes in: `integrations/plaid/`, `lib/integrations/bank-reconciliation/`
- Tests added/updated in: `integrations/plaid/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] – access token column added to existing `bank_accounts` table (requires DB push approval)

**Rollback**
- Granularity: file‑level – delete `integrations/plaid/`; revoke Plaid access tokens via `/item/remove`; revert DB column if added
- Halt condition: if Plaid returns `ITEM_LOGIN_REQUIRED` for all test institutions, stop and ask user to re‑authenticate the Plaid sandbox item

**Rules to Follow**
- Use `plaid` Node.js SDK v14+ (`plaid` npm package); use `PlaidEnvironments.sandbox` for all non‑production work
- Always use `/transactions/sync` (not the deprecated `/transactions/get`) for incremental syncing
- Encrypt Plaid `access_token` with AES‑256‑GCM before storing; decrypt only at call time
- Reconciliation: use amount‑within‑$0.01 AND date‑within‑2‑days fuzzy match; flag ambiguous matches for human review
- Webhook endpoint at `/webhooks/plaid` must verify the `Plaid-Verification` JWT using Plaid's JWKS endpoint

**Verification**
```bash
# Test bank feed sync
pnpm vitest run -- integrations/plaid/bank-feed.test.ts

# Test Plaid Link token creation
pnpm vitest run -- integrations/plaid/link-client.test.ts

# Test webhook processing
pnpm vitest run -- integrations/plaid/webhooks.test.ts

# Test bank reconciliation
pnpm vitest run -- lib/integrations/bank-reconciliation/reconciliation.test.ts

# Full typecheck
pnpm run typecheck

# Manual smoke test (Plaid sandbox)
curl -X POST http://localhost:8081/integrations/plaid/test-sync
```

**Advanced Code Patterns**
- Cursor‑based incremental sync: store `next_cursor` per `bankAccountId`; pass on every `/transactions/sync` call to receive only deltas
- Encrypted token vault: wrap all access token read/write in `PlaidTokenVault.get(bankAccountId)` / `PlaidTokenVault.set(bankAccountId, token)` to centralise encryption logic
- Reconciliation confidence score: calculate a 0–1 score combining amount match, date proximity, and payee similarity; auto‑apply at ≥ 0.9, flag for review at 0.5–0.89

**Anti‑Patterns**
- Do not use `/transactions/get` – it is deprecated; use `/transactions/sync` exclusively
- Do not store Plaid `access_token` in plaintext anywhere (env var, DB column, log)
- Do not skip the JWKS‑based webhook verification – unsigned Plaid webhooks are a spoofing risk
- Do not bulk‑reconcile without a dry‑run mode; always allow human review of ambiguous matches

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bank feed integration is infrastructure in the Finance bounded context. `PlaidBankFeedService` is an adapter; reconciliation logic lives in the domain service `BankReconciliationService`.
- TDD: Use Plaid sandbox with pre‑seeded transactions; record API responses as fixtures for deterministic tests.
- BDD: Scenario – "Given a bank account is connected via Plaid Link, When the sync job runs, Then new transactions appear in Apex and matched transactions are auto‑reconciled against existing bill payments."
- Deep Module: `PlaidBankFeedService` hides cursor management, encryption, and Plaid SDK details behind `sync(bankAccountId): Promise<SyncResult>`.

---

### Subtasks

- [ ] INT‑AP‑002.0.25 (AGENT): Read the entire task and Plaid `/transactions/sync` documentation.
  *No action – pause until fully understood.*

- [ ] INT‑AP‑002.0.5 (AGENT): Research Plaid SDK v14+ breaking changes, `/transactions/sync` cursor semantics, and JWKS webhook verification (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑AP‑002.0.75 (AGENT): Reason about encrypted token storage strategy and reconciliation confidence score thresholds.
  *If uncertain, ask the user before executing.*

- [ ] INT‑AP‑002.1 (AGENT): Implement Plaid Link token creation and public token exchange with encrypted access token storage.
  **File(s):** `integrations/plaid/link-client.ts`
  **Verification:** `pnpm vitest run -- integrations/plaid/link-client.test.ts`

- [ ] INT‑AP‑002.2 (AGENT): Implement incremental transaction sync using `/transactions/sync` with cursor persistence.
  **File(s):** `integrations/plaid/bank-feed.ts`
  **Verification:** `pnpm vitest run -- integrations/plaid/bank-feed.test.ts`

- [ ] INT‑AP‑002.3 (AGENT): Implement webhook handler with JWKS signature verification.
  **File(s):** `integrations/plaid/webhooks.ts`
  **Verification:** `pnpm vitest run -- integrations/plaid/webhooks.test.ts`

- [ ] INT‑AP‑002.4 (AGENT): Implement fuzzy‑match reconciliation service.
  **File(s):** `lib/integrations/bank-reconciliation/index.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/bank-reconciliation/reconciliation.test.ts`

- [ ] INT‑AP‑002.5 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑AP‑002.N (HUMAN): Final review – verify Plaid Link flow and a transaction sync in sandbox, approve.
  **Verification:** Approved.

---

## [ ] INT‑AR‑001: Stripe Payment Links (Customer Payments)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Customers must pay invoices manually (wire/check). No self‑serve payment portal exists. As of May 2026, Stripe Payment Links provide a hosted checkout page that supports card, ACH, and bank transfer payment methods with metadata correlation. Stripe SDK v17+ with `2026-04-22` API version is the current standard.
**Size:** Medium

**Description:** Generate Stripe Payment Links for AR invoices so customers can pay by card or bank transfer; handle `checkout.session.completed` webhooks to auto‑apply payments to Apex invoices; embed Stripe Elements for a branded payment portal.

**Depends on:** API‑AR‑008 (AR invoices API), API‑AR‑012 (customer payments API)
**Blocks:** INT‑AR‑002 (Plaid bank account verification – complements customer payment methods)
**Related Files:** `integrations/stripe/payment-links.ts`, `integrations/stripe/payment-portal.ts`, `integrations/stripe/payment-webhooks.ts`, `lib/integrations/payment-application/index.ts`

**Imports / Exports**
- Imports: `stripe` npm SDK (v17+), `Invoice` domain entity, `PaymentPort`
- Exports: `StripePaymentLinkService`, `StripePaymentPortal`, `PaymentWebhookHandler`

**Definition of Done**
- [ ] `createPaymentLink(invoiceId)` generates a Stripe Payment Link with correct amount, currency, and metadata containing `invoiceId`
- [ ] Payment link includes both card and ACH bank transfer as payment method options
- [ ] `checkout.session.completed` webhook handler auto‑applies the Stripe payment to the Apex AR invoice
- [ ] Customer‑facing payment portal embeds Stripe Elements (`PaymentElement`) for a white‑labelled experience
- [ ] Payment link expiry configurable (default 30 days); expired links return a branded expiry page
- [ ] Webhook signature verified for all events; idempotency via `session.id` deduplication
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- Recurring Payment Links (subscription billing)
- Stripe Checkout Session customisation beyond branding
- Saving customer payment methods for future use (Phase 8+)

**Safety Boundaries**
- Never modify: generated files under `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Never commit: `.env*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Never return or log raw Stripe `PaymentIntent.client_secret` in server‑side logs

**Output Artifacts**
- Code changes in: `integrations/stripe/`, `lib/integrations/payment-application/`
- Tests added/updated in: `integrations/stripe/payment-links.test.ts`, `integrations/stripe/payment-webhooks.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level – delete `integrations/stripe/payment-links.ts` and related files; deactivate Payment Links in Stripe dashboard
- Halt condition: if `checkout.session.completed` webhooks are not received in test mode, stop and verify webhook endpoint registration

**Rules to Follow**
- Use Stripe SDK v17+ pinned to API version `2026-04-22`
- Always include `invoiceId` in Stripe `metadata` on Payment Link creation for webhook correlation
- Webhook endpoint at `/webhooks/stripe/payments`; return HTTP 200 within 5 s; process asynchronously
- Use `stripe.webhooks.constructEvent()` for signature verification; reject any event that fails verification with HTTP 400
- PCI compliance: never let raw card data touch the Apex backend; use Stripe Elements exclusively

**Verification**
```bash
pnpm vitest run -- integrations/stripe/payment-links.test.ts
pnpm vitest run -- integrations/stripe/payment-portal.test.ts
pnpm vitest run -- integrations/stripe/payment-webhooks.test.ts
pnpm run typecheck
curl -X POST http://localhost:8081/integrations/stripe/test-payment-link
```

**Advanced Code Patterns**
- Metadata correlation: embed `{ invoiceId, orgId }` in Stripe `metadata` on Payment Link; extract in webhook handler for zero‑ambiguity invoice lookup
- Optimistic locking: before applying payment to invoice, check invoice status is still `open`; reject if already `paid`

**Anti‑Patterns**
- Do not create Payment Links without `metadata.invoiceId` – webhook handler cannot correlate payment to invoice
- Do not skip webhook signature verification
- Do not block the webhook HTTP response while processing payment application – return 200 first, apply in background

**DDD / TDD / BDD / Deep Module notes**
- DDD: Payment collection is an AR sub‑domain concern. `StripePaymentLinkService` is an infrastructure adapter; `PaymentApplicationService` is the domain service that applies collected funds.
- TDD: Use Stripe CLI (`stripe listen --forward-to localhost:8081/webhooks/stripe/payments`) to replay test events during development.
- BDD: Scenario – "Given an open invoice exists, When `createPaymentLink` is called and the customer pays, Then the invoice status transitions to `paid` and a payment record is created."
- Deep Module: `PaymentApplicationService` hides the logic of payment‑to‑invoice matching, partial payment handling, and AR balance updates behind `applyPayment(invoiceId, amount, currency)`.

---

### Subtasks

- [ ] INT‑AR‑001.0.25 (AGENT): Read the entire task and Stripe Payment Links API docs.
  *No action – pause until fully understood.*

- [ ] INT‑AR‑001.0.5 (AGENT): Research Stripe Payment Links API changes in the `2026-04-22` version and `PaymentElement` embedding patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑AR‑001.0.75 (AGENT): Reason about metadata schema, partial payment handling, and Stripe Elements vs. Checkout Session trade‑offs.
  *If uncertain about UX design, ask the user before executing.*

- [ ] INT‑AR‑001.1 (AGENT): Implement `createPaymentLink` with metadata and payment method configuration.
  **File(s):** `integrations/stripe/payment-links.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/payment-links.test.ts`

- [ ] INT‑AR‑001.2 (AGENT): Implement customer payment portal with embedded Stripe Elements.
  **File(s):** `integrations/stripe/payment-portal.ts`, `artifacts/apex-os/src/pages/portal/PaymentPortal.tsx`
  **Verification:** Portal renders correctly in dev server with Stripe test mode.

- [ ] INT‑AR‑001.3 (AGENT): Implement webhook handler and payment application service.
  **File(s):** `integrations/stripe/payment-webhooks.ts`, `lib/integrations/payment-application/index.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/payment-webhooks.test.ts`

- [ ] INT‑AR‑001.4 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑AR‑001.N (HUMAN): Final review – verify end‑to‑end payment flow in Stripe test mode, approve.
  **Verification:** Approved.

---

## [ ] INT‑AR‑002: Plaid Bank Account Verification
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Bank account ownership is not verified before ACH debit authorisation. Micro‑deposit verification does not exist. As of May 2026, Plaid Auth provides instant bank account verification via `/auth/get`, with micro‑deposit as a fallback for institutions that don't support Auth. NACHA requires explicit ACH authorisation (mandate) before debiting an account.
**Size:** Small

**Description:** Implement Plaid Auth for instant bank account ownership verification plus a micro‑deposit fallback, enabling ACH debit authorisation for automatic customer payment collection.

**Depends on:** DB‑FIN‑006 (payment methods schema)
**Blocks:** INT‑FIN‑001 (BILL vendor network – verified bank accounts required for payments)
**Related Files:** `integrations/plaid/account-verification.ts`, `integrations/plaid/micro-deposits.ts`, `integrations/plaid/ach-authorization.ts`, `lib/integrations/verification-workflow/index.ts`

**Imports / Exports**
- Imports: `plaid` SDK v14+, `PlaidApi`, `BankAccount` domain entity
- Exports: `PlaidAccountVerificationService`, `MicroDepositService`, `ACHAuthorizationService`

**Definition of Done**
- [ ] `verifyBankAccount(bankAccountId)` uses Plaid Auth (`/auth/get`) to instantly verify routing and account numbers
- [ ] Micro‑deposit fallback initiated when Plaid Auth is unavailable for the institution
- [ ] ACH debit authorisation captured as a stored mandate record with timestamp and IP
- [ ] Verification status (`pending | verified | failed`) stored on `payment_methods` table
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- Real‑time bank account balance validation at payment time
- International bank account verification (IBAN, SWIFT)
- Bank account risk scoring (Plaid Signal – future phase)

**Safety Boundaries**
- Never modify: generated files
- Never commit: `.env*`, Plaid secrets, raw account/routing numbers
- Never store unencrypted bank account numbers in any DB column

**Output Artifacts**
- Code changes in: `integrations/plaid/`, `lib/integrations/verification-workflow/`
- Tests added/updated in: `integrations/plaid/account-verification.test.ts`
- Documentation: [N/A]
- Migration files: Requires `verification_status` column on `payment_methods` table (ask human before DB push)

**Rollback**
- Granularity: file‑level – delete verification files; revert DB column migration
- Halt condition: if Plaid Auth returns `PRODUCT_NOT_READY` for all sandbox institutions, stop and note this limitation

**Rules to Follow**
- Use Plaid Auth product; fall back to same‑day micro‑deposits if institution does not support Auth
- Store ACH mandate: `{ bankAccountId, authorisedAt: ISO8601, ipAddress, userAgent }` in `ach_mandates` table
- Never auto‑initiate ACH debit without explicit mandate record; legal requirement (NACHA rules)

**Verification**
```bash
pnpm vitest run -- integrations/plaid/account-verification.test.ts
pnpm vitest run -- integrations/plaid/micro-deposits.test.ts
pnpm vitest run -- integrations/plaid/ach-authorization.test.ts
pnpm run typecheck
curl -X POST http://localhost:8081/integrations/plaid/test-verification
```

**Advanced Code Patterns**
- Strategy pattern: `VerificationStrategy` with `PlaidAuthStrategy` (instant) and `MicroDepositStrategy` (fallback) selected based on institution capability check

**Anti‑Patterns**
- Do not store raw routing/account numbers; store only Plaid `account_id`
- Do not initiate ACH without a stored mandate record
- Do not skip micro‑deposit fallback – some institutions only support manual verification

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bank account verification is an AR infrastructure concern. ACH mandate is a domain concept with legal significance.
- TDD: Test both verification paths (instant Auth and micro‑deposit) with Plaid sandbox.
- BDD: Scenario – "Given a customer's bank account is unverified, When Plaid Auth completes successfully, Then the account status transitions to `verified` and ACH debits are enabled."
- Deep Module: [N/A] – this is a thin integration layer.

---

### Subtasks

- [ ] INT‑AR‑002.0.25 (AGENT): Read the task and Plaid Auth product documentation.
  *No action – pause until fully understood.*

- [ ] INT‑AR‑002.0.5 (AGENT): Research Plaid Auth vs. Identity Verification, micro‑deposit best practices (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑AR‑002.0.75 (AGENT): Reason about mandate storage schema and whether micro‑deposits require a separate UI flow.
  *If uncertain, ask the user before executing.*

- [ ] INT‑AR‑002.1 (AGENT): Implement instant bank account verification using Plaid Auth.
  **File(s):** `integrations/plaid/account-verification.ts`
  **Verification:** `pnpm vitest run -- integrations/plaid/account-verification.test.ts`

- [ ] INT‑AR‑002.2 (AGENT): Implement micro‑deposit fallback service.
  **File(s):** `integrations/plaid/micro-deposits.ts`
  **Verification:** `pnpm vitest run -- integrations/plaid/micro-deposits.test.ts`

- [ ] INT‑AR‑002.3 (AGENT): Implement ACH mandate capture and storage.
  **File(s):** `integrations/plaid/ach-authorization.ts`
  **Verification:** `pnpm vitest run -- integrations/plaid/ach-authorization.test.ts`

- [ ] INT‑AR‑002.N (HUMAN): Final review – confirm mandate schema meets legal requirements, approve.
  **Verification:** Approved.

---

## [ ] INT‑FIN‑001: BILL Vendor Network Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No BILL (formerly Bill.com) integration exists. Vendor payments to network‑connected vendors are processed manually. As of May 2026, BILL API v2 uses OAuth 2.0 Client Credentials flow with 1,000 req/hour rate limits. The vendor network enables searching, inviting, and paying network‑connected vendors.
**Size:** Medium

**Description:** Integrate with the BILL vendor network API to search, invite, and sync vendors; enable sending payments to network‑connected vendors; bidirectionally sync vendor details between BILL and the Apex vendor database.

**Depends on:** INT‑AP‑001 (payment infrastructure), API‑AP‑004 (vendors API)
**Blocks:** INT‑FIN‑002 (multi‑currency payments – vendor network used for international)
**Related Files:** `integrations/bill-com/vendor-network-client.ts`, `integrations/bill-com/vendor-sync-service.ts`, `integrations/bill-com/network-payments.ts`, `lib/integrations/bill-com-sync/index.ts`

**Imports / Exports**
- Imports: `VendorPort` interface, BILL API SDK or fetch client, `Vendor` domain entity
- Exports: `BILLVendorNetworkClient`, `BILLVendorSyncService`, `BILLNetworkPaymentService`

**Definition of Done**
- [ ] OAuth 2.0 flow authenticates with BILL API; tokens stored encrypted
- [ ] `searchNetworkVendors(query)` searches BILL's vendor network and returns matching vendors
- [ ] `inviteVendorToNetwork(vendorId)` sends a BILL network invitation to a vendor
- [ ] `syncVendorFromNetwork(billNetworkVendorId)` imports or updates vendor details (name, address, payment preferences) in Apex
- [ ] `sendNetworkPayment(billPaymentId, networkVendorId, amount)` submits payment through BILL network
- [ ] Network status updates (`invited | connected | declined`) propagate to Apex vendor records
- [ ] Rate limits respected: BILL API allows 1,000 req/hour per app
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- BILL AP/AR automation beyond vendor network payments
- BILL Spend & Expense (separate product)
- BILL AI‑powered invoice capture

**Safety Boundaries**
- Never modify: generated files
- Never commit: `.env*`, `BILL_CLIENT_SECRET`, BILL API tokens
- Never use BILL production environment without explicit human approval

**Output Artifacts**
- Code changes in: `integrations/bill-com/`, `lib/integrations/bill-com-sync/`
- Tests added/updated in: `integrations/bill-com/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level – delete `integrations/bill-com/`
- Halt condition: if BILL sandbox returns persistent authentication errors, stop and ask user to verify BILL sandbox app credentials

**Rules to Follow**
- Use BILL API v2 (current as of May 2026); authenticate via OAuth 2.0 Client Credentials flow
- Rate limiting: implement token‑bucket at 1,000 req/hour with per‑request cost tracking
- All BILL API error codes must be mapped to domain‑specific errors (`VendorNotFoundError`, `PaymentRejectedError`)
- Use Pino structured logging; redact BILL API tokens and account numbers

**Verification**
```bash
pnpm vitest run -- integrations/bill-com/vendor-network-client.test.ts
pnpm vitest run -- integrations/bill-com/vendor-sync-service.test.ts
pnpm vitest run -- integrations/bill-com/network-payments.test.ts
pnpm run typecheck
curl -X POST http://localhost:8081/integrations/bill-com/test-sync
```

**Advanced Code Patterns**
- Adapter pattern: `BILLVendorNetworkClient` implements `VendorNetworkPort`; business logic never imports BILL‑specific types
- Status machine: vendor network status `none → invited → connected | declined`; transitions driven by BILL webhooks

**Anti‑Patterns**
- Do not call BILL production API in tests; use sandbox exclusively
- Do not ignore BILL network status updates; stale `invited` status blocks payment flows
- Do not bypass rate limiting; BILL will suspend the app on repeated 429 violations

**DDD / TDD / BDD / Deep Module notes**
- DDD: BILL integration is an infrastructure adapter in the AP sub‑domain. `VendorNetworkPort` is the domain port; `BILLVendorNetworkClient` is the adapter.
- TDD: Use BILL sandbox with pre‑seeded vendor data; write tests before implementation.
- BDD: Scenario – "Given a vendor is connected to the BILL network, When a payment run includes that vendor, Then the payment is submitted via BILL network and the vendor's `networkPaymentStatus` updates to `submitted`."
- Deep Module: [N/A] – thin adapter layer.

---

### Subtasks

- [ ] INT‑FIN‑001.0.25 (AGENT): Read the task and BILL API v2 vendor network documentation.
  *No action – pause until fully understood.*

- [ ] INT‑FIN‑001.0.5 (AGENT): Research BILL API v2 authentication changes, rate limits, and webhook support (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑FIN‑001.0.75 (AGENT): Reason about status machine design and whether BILL webhooks are available for network status updates.
  *If uncertain, ask the user before executing.*

- [ ] INT‑FIN‑001.1 (AGENT): Implement BILL OAuth 2.0 client and vendor network search/invite.
  **File(s):** `integrations/bill-com/vendor-network-client.ts`
  **Verification:** `pnpm vitest run -- integrations/bill-com/vendor-network-client.test.ts`

- [ ] INT‑FIN‑001.2 (AGENT): Implement vendor sync service (import/update from network).
  **File(s):** `integrations/bill-com/vendor-sync-service.ts`
  **Verification:** `pnpm vitest run -- integrations/bill-com/vendor-sync-service.test.ts`

- [ ] INT‑FIN‑001.3 (AGENT): Implement network payment submission service.
  **File(s):** `integrations/bill-com/network-payments.ts`
  **Verification:** `pnpm vitest run -- integrations/bill-com/network-payments.test.ts`

- [ ] INT‑FIN‑001.4 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑FIN‑001.N (HUMAN): Final review – verify vendor sync and payment in BILL sandbox, approve.
  **Verification:** Approved.

---

## [ ] INT‑FIN‑002: Multi‑Currency Payment Execution
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** All payments are in the organisation's base currency (USD). No FX provider is integrated. As of May 2026, Wise Business API v3 supports quote‑based international wire transfers with real‑time exchange rates and fee transparency. Stripe FX (via multi‑currency PaymentIntents) is a viable fallback. Banking regulations require displaying exchange rates and fees before confirmation.
**Size:** Medium

**Description:** Execute international wire transfers in vendor local currencies via an FX provider (Wise Business API preferred; Stripe multi‑currency as fallback), capturing exchange rates and fees at payment time and recording dual‑currency amounts in Apex.

**Depends on:** API‑FIN‑018 (payment run API), INT‑AP‑001 (Stripe ACH – domestic payment infrastructure)
**Blocks:** [N/A]
**Related Files:** `integrations/fx/fx-provider.ts`, `integrations/payments/international-wire-service.ts`, `integrations/fx/exchange-rate-cache.ts`, `lib/integrations/international-payments/index.ts`

**Imports / Exports**
- Imports: `FXPort` interface, Wise Business API client or `stripe` SDK, `Payment` domain entity
- Exports: `WiseFXProvider`, `InternationalWireService`, `ExchangeRateCache`

**Definition of Done**
- [ ] `getExchangeRate(fromCurrency, toCurrency)` fetches live rate from FX provider with TTL‑based caching (5‑minute cache)
- [ ] `executeInternationalWire(paymentId, amount, currency, recipientBankDetails)` submits international transfer
- [ ] Exchange rate and fee captured at payment initiation time and stored on `payment` record
- [ ] Payment record stores both `originalAmount` + `originalCurrency` and `baseAmount` + `baseCurrency` (after conversion)
- [ ] Payment tracking: status updates via FX provider webhooks or polling
- [ ] Support for at least: USD, EUR, GBP, CAD, AUD, JPY, CHF
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- FX hedging and forward contracts
- Crypto payments
- Consumer cross‑border payments

**Safety Boundaries**
- Never modify: generated files
- Never commit: `.env*`, `WISE_API_KEY`, FX provider secrets
- Never execute live FX transfers without explicit human approval

**Output Artifacts**
- Code changes in: `integrations/fx/`, `integrations/payments/`, `lib/integrations/international-payments/`
- Tests added/updated in: `integrations/fx/*.test.ts`, `integrations/payments/international-wire-service.test.ts`
- Documentation: [N/A]
- Migration files: Requires `originalAmount`, `originalCurrency` columns on `payments` table (ask human before DB push)

**Rollback**
- Granularity: file‑level – delete FX integration files; revert DB column migration
- Halt condition: if FX provider sandbox returns rate fetch errors consistently, stop and ask user to verify API key

**Rules to Follow**
- Use Wise Business API v3 as primary FX provider; fall back to Stripe FX (via `currency` param on PaymentIntent) if Wise unavailable
- Cache exchange rates for 5 minutes maximum; re‑fetch before large payments (>$10,000 equivalent)
- Always display the exchange rate and fee to the user before confirming a payment (NACHA / banking regulation requirement)
- Dual‑currency record: `{ originalAmount, originalCurrency, baseAmount, baseCurrency, exchangeRate, fxFee, rateLockedAt }`

**Verification**
```bash
pnpm vitest run -- integrations/fx/fx-provider.test.ts
pnpm vitest run -- integrations/payments/international-wire-service.test.ts
pnpm vitest run -- integrations/fx/exchange-rate-cache.test.ts
pnpm run typecheck
curl -X POST http://localhost:8081/integrations/fx/test-rates
```

**Advanced Code Patterns**
- Provider abstraction: `FXPort` interface with `WiseFXProvider` and `StripeFXProvider` implementations; swap via config
- Rate locking: generate a quote with TTL from Wise; include `quoteId` in wire submission

**Anti‑Patterns**
- Do not cache rates beyond 5 minutes for large transactions; rates move significantly
- Do not execute international wires without displaying rate + fee to the user
- Do not hardcode currency lists; fetch supported currencies from FX provider at startup

**DDD / TDD / BDD / Deep Module notes**
- DDD: Multi‑currency payment execution is a Finance domain capability. `FXPort` is the domain port; `WiseFXProvider` is the adapter.
- TDD: Mock FX API responses with fixed rates for deterministic tests; test rate caching TTL expiry.
- BDD: Scenario – "Given a vendor requires payment in EUR and the org base currency is USD, When a payment run is executed, Then the EUR amount is calculated at the live rate, the fee is displayed, and after confirmation the wire is submitted."
- Deep Module: [N/A]

---

### Subtasks

- [ ] INT‑FIN‑002.0.25 (AGENT): Read the task and Wise Business API v3 documentation.
  *No action – pause until fully understood.*

- [ ] INT‑FIN‑002.0.5 (AGENT): Research Wise API v3 quote and transfer flow, rate caching patterns, and Stripe multi‑currency fallback (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑FIN‑002.0.75 (AGENT): Reason about quote TTL, rate‑lock UX, and dual‑currency record schema.
  *If uncertain about UX flow, ask the user before executing.*

- [ ] INT‑FIN‑002.1 (AGENT): Implement `FXPort` interface and `WiseFXProvider` with rate caching.
  **File(s):** `integrations/fx/fx-provider.ts`, `integrations/fx/exchange-rate-cache.ts`
  **Verification:** `pnpm vitest run -- integrations/fx/fx-provider.test.ts`

- [ ] INT‑FIN‑002.2 (AGENT): Implement `InternationalWireService` with dual‑currency record creation.
  **File(s):** `integrations/payments/international-wire-service.ts`
  **Verification:** `pnpm vitest run -- integrations/payments/international-wire-service.test.ts`

- [ ] INT‑FIN‑002.N (HUMAN): Final review – verify rate display and wire submission in Wise sandbox, approve.
  **Verification:** Approved.

---

## [ ] INT‑FIN‑003: NACHA ACH File Generation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No NACHA file generation exists. Banks require NACHA‑formatted files for batch ACH submissions. As of May 2026, the NACHA Operating Rules 2025 edition governs ACH file formats (94‑character fixed‑width records, CR+LF line endings, ABA routing number check‑digit validation). CCD and PPD are the standard entry class codes for corporate and consumer payments respectively.
**Size:** Medium

**Description:** Generate NACHA‑compliant ACH files (CCD, PPD entry class codes) for batch vendor payment submissions; validate entries against NACHA standards; provide a preview before finalisation; allow file download for bank portal upload.

**Depends on:** INT‑AP‑001 (payment infrastructure), API‑FIN‑018 (payment run API)
**Blocks:** [N/A]
**Related Files:** `lib/payments/nacha-generator.ts`, `lib/payments/nacha-validator.ts`, `lib/payments/nacha-formats.ts`, `lib/integrations/nacha-processing/index.ts`

**Imports / Exports**
- Imports: `PaymentRun` domain entity, `BankAccount` domain entity
- Exports: `NACHAGenerator`, `NACHAValidator`, `NACHAFilePreview`

**Definition of Done**
- [ ] `generateNACHAFile(paymentRunId)` produces a valid NACHA ACH file with correct file header, batch header, entry detail, batch control, and file control records
- [ ] Supports CCD (corporate‑to‑corporate) and PPD (corporate‑to‑consumer) entry class codes
- [ ] All entries validated before generation: routing number check digit, account number format, amount > 0
- [ ] Preview endpoint returns human‑readable NACHA file content before finalisation
- [ ] Generated file downloadable as `.ach` text file with correct line‑ending format (CR+LF per NACHA spec)
- [ ] Batch control totals (`Entry/Addenda Count`, `Total Debit Amount`, `Total Credit Amount`) computed and validated
- [ ] Unit tests cover: valid file generation, invalid routing number rejection, batch total validation
- [ ] `pnpm run typecheck` passes with no errors

**Out of Scope**
- ACH debits (customer collections) – different authorisation requirements
- CTX (corporate trade exchange) with addenda records – future phase
- Same‑day ACH (different settlement timing rules)
- Direct bank submission (user uploads to bank portal manually)

**Safety Boundaries**
- Never modify: generated files
- Never commit: `.env*`, bank routing numbers in test fixtures (use NACHA test routing numbers)
- Never auto‑submit NACHA files to banks; user downloads and uploads manually

**Output Artifacts**
- Code changes in: `lib/payments/`, `lib/integrations/nacha-processing/`
- Tests added/updated in: `lib/payments/nacha-generator.test.ts`, `lib/payments/nacha-validator.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level – delete `lib/payments/nacha-*.ts` files
- Halt condition: if generated files fail NACHA validator (third‑party) checks, halt and document the failing records

**Rules to Follow**
- Follow NACHA Operating Rules 2025 edition; fixed‑width 94‑character records with CR+LF line endings
- Use NACHA test routing number `021000021` in all test fixtures
- Routing number check digit validation: ABA checksum algorithm (3×d1 + 7×d2 + d3 + 3×d4 + 7×d5 + d6 + 3×d7 + 7×d8 + d9 = 0 mod 10)
- File header immediate origin/destination: use configurable company IDs from environment variables
- Batch sequence numbers must be sequential starting at 1 within each file

**Verification**
```bash
pnpm vitest run -- lib/payments/nacha-generator.test.ts
pnpm vitest run -- lib/payments/nacha-validator.test.ts
pnpm vitest run -- lib/payments/nacha-formats.test.ts
pnpm run typecheck
curl -X POST http://localhost:8081/payments/nacha/test-generation
```

**Advanced Code Patterns**
- Builder pattern: `NACHAFileBuilder` with `addBatch(entries)` → `build()` produces the complete fixed‑width file string
- Checksum validation: `NACHAValidator.validateRoutingNumber(routingNumber)` runs ABA mod‑10 check before adding any entry

**Anti‑Patterns**
- Do not use variable‑width fields; all NACHA records are exactly 94 characters
- Do not skip check‑digit validation; invalid routing numbers cause bank rejections with fees
- Do not allow zero‑amount entries; NACHA rejects files with $0 entries
- Do not use LF‑only line endings; NACHA requires CR+LF (`\r\n`)

**DDD / TDD / BDD / Deep Module notes**
- DDD: NACHA file generation is a Finance domain capability. `NACHAGenerator` is a pure domain service with no external dependencies.
- TDD: Write tests first for each record type (file header, batch header, entry detail, batch control, file control) with known‑good expected outputs.
- BDD: Scenario – "Given a payment run contains 3 approved bill payments with valid bank accounts, When `generateNACHAFile` is called, Then a downloadable NACHA file is produced with correct batch totals and all 3 entry detail records."
- Deep Module: `NACHAGenerator` is a deep module – complex internal formatting logic behind a simple `generate(paymentRunId): string` interface.

---

### Subtasks

- [ ] INT‑FIN‑003.0.25 (AGENT): Read the task and NACHA ACH file format specification (file header, batch, entry, control records).
  *No action – pause until fully understood.*

- [ ] INT‑FIN‑003.0.5 (AGENT): Research NACHA 2025 rule updates, ABA routing number check‑digit algorithm, and existing Node.js NACHA libraries (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑FIN‑003.0.75 (AGENT): Reason about whether to use an existing NACHA library or build from scratch; evaluate `nacha` npm package vs. custom implementation.
  *If uncertain, choose custom implementation for control; document rationale.*

- [ ] INT‑FIN‑003.1 (AGENT): Implement NACHA record formats (file header, batch header, entry detail, batch control, file control).
  **File(s):** `lib/payments/nacha-formats.ts`
  **Verification:** `pnpm vitest run -- lib/payments/nacha-formats.test.ts`

- [ ] INT‑FIN‑003.2 (AGENT): Implement NACHA validator with routing number check‑digit and amount validation.
  **File(s):** `lib/payments/nacha-validator.ts`
  **Verification:** `pnpm vitest run -- lib/payments/nacha-validator.test.ts`

- [ ] INT‑FIN‑003.3 (AGENT): Implement `NACHAGenerator` using builder pattern; integrate into payment run completion flow.
  **File(s):** `lib/payments/nacha-generator.ts`
  **Verification:** `pnpm vitest run -- lib/payments/nacha-generator.test.ts`

- [ ] INT‑FIN‑003.4 (AGENT): Add preview endpoint and downloadable file response.
  **File(s):** `artifacts/api-server/src/routes/nacha.ts`
  **Verification:** `curl -X POST http://localhost:8081/payments/nacha/test-generation` returns valid NACHA file content.

- [ ] INT‑FIN‑003.N (HUMAN): Final review – validate generated file against NACHA validator tool, approve.
  **Verification:** Approved.

---

*End of Phase 7 AP/AR Payment & Bank Integrations.*