# tasks/integrations/INTEGRATION‑STRIPE.md – Stripe Payment & Treasury Integration

This file covers Stripe integration for payment processing, ACH/wire via Treasury, customer payment links, and compliance testing. All Stripe interactions are abstracted behind a `PaymentPort` interface to keep domain logic provider‑agnostic. These tasks are part of Phase 7 and require a Stripe account provisioned by a human operator.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] INT‑PAYMENT‑001: Stripe Payment Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment processing integration exists. Appointments and invoices cannot be paid online.
**Size:** Large

**Description:** Implement a complete Stripe payment processing pipeline covering Payment Intents (card, ACH, bank transfer), Stripe Elements for secure card collection, webhook handlers for asynchronous status updates, subscription management for recurring payments, and refund processing with dispute handling.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑008`, `API‑APPT‑007`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑004`
**Blocks:** `integrations/INTEGRATION‑STRIPE.md → INT‑PAYMENT‑002`
**Related Files:** `integrations/stripe/payment‑intents.ts`, `subscriptions.ts`, `refunds.ts`, `webhooks.ts`, `stripe‑elements.ts`, `lib/integrations/payment‑sync/stripe‑sync.ts`

**Definition of Done**
- [ ] `createPaymentIntent(appointmentId, paymentMethodId)` creates a Stripe Payment Intent with correct amount, currency, and metadata containing `appointmentId`
- [ ] Payment method integration: supports `card`, `us_bank_account` (ACH), and `customer_balance` (bank transfer)
- [ ] `confirmPaymentIntent(paymentIntentId)` for server‑side confirmation; client‑side confirmation via Stripe Elements is also supported
- [ ] Stripe Elements integration: `StripePaymentPortal` renders Stripe’s `PaymentElement` component for PCI‑compliant card collection
- [ ] Webhook handler at `/webhooks/stripe/payments` processes: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `invoice.payment_succeeded`
- [ ] Stripe webhook signature verified using `stripe.webhooks.constructEvent()`
- [ ] Apex `Payment` record updated on payment success; Apex `Appointment` or `Invoice` status transitions based on webhook events
- [ ] Subscription management: `createSubscription(customerId, priceId)` for recurring appointments
- [ ] Refund processing: `createRefund(paymentIntentId, amount?)`; `charge.refunded` webhook updates Apex payment status
- [ ] Idempotency: client‑side `Idempotency‑Key` header (UUID v4) forwarded to Stripe; same key on retry returns existing Payment Intent
- [ ] Rate limiting: respects Stripe’s 100 req/s (test) / 1000 req/s (live); exponential backoff on `429`
- [ ] Error mapping: Stripe errors (`card_declined`, `processing_error`, `rate_limit`) mapped to Apex domain errors
- [ ] Unit tests pass using Stripe test mode (`sk_test_*`); no live Stripe calls in tests beyond initial fixture recording
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Stripe Connect (marketplace/platform payments)
- Stripe Terminal (in‑person payments)
- Stripe Issuing (virtual card creation – handled by Finance domain)
- Multi‑currency dynamic conversion
- Invoicing via Stripe Invoicing API (Apex generates its own invoices)

**Rules to Follow**
- Use Stripe Node.js SDK v17+; pin API version to `2026‑04‑22`
- All monetary amounts in smallest currency unit (cents for USD)
- Webhook endpoint must return HTTP 200 within 5 s; process business logic asynchronously via BullMQ jobs
- Stripe Elements `clientSecret` must never be exposed in server‑side logs
- PCI compliance: never let raw card data touch the Apex backend; use Stripe Elements or Checkout exclusively

**Verification**
```bash
pnpm vitest run -- integrations/stripe/payment‑intents.test.ts
pnpm vitest run -- integrations/stripe/subscriptions.test.ts
pnpm vitest run -- integrations/stripe/refunds.test.ts
pnpm vitest run -- integrations/stripe/webhooks.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Stripe is an external payment service provider within the Appointments/Finance bounded contexts. `StripePaymentProcessor` is an anti‑corruption layer implementing `PaymentPort`.
- TDD: Use Stripe test mode with recorded fixture webhook payloads. All unit tests must be deterministic without a live Stripe connection.
- BDD: “As a client, I can pay for an appointment with a credit card or bank transfer, and as a provider, I receive automatic notifications when payments succeed or fail.”
- Deep Module: `StripePaymentProcessor.createPayment(amount, currency, metadata)` hides Stripe SDK complexity, idempotency key management, rate limit handling, and error mapping.

---

### Subtasks
- [ ] INT‑PAYMENT‑001.0.25 (AGENT): Read Stripe API documentation (Payment Intents, Subscriptions, Webhooks, Stripe Elements). *No action – pause.*
- [ ] INT‑PAYMENT‑001.0.5 (AGENT): Research Stripe Node.js SDK v17+ and `2026‑04‑22` API version changes. *Document findings briefly.*
- [ ] INT‑PAYMENT‑001.1 (AGENT): Install Stripe SDK and configure with `STRIPE_SECRET_KEY` and API version pinning.
  **File(s):** `integrations/stripe/index.ts`, `artifacts/api‑server/.env.example`
  **Verification:** `pnpm run typecheck` passes; Stripe client initialises without errors.
- [ ] INT‑PAYMENT‑001.2 (AGENT): Implement Payment Intent creation, confirmation, cancellation with idempotency key support.
  **File(s):** `integrations/stripe/payment‑intents.ts`
  **Verification:** `pnpm vitest run -- payment‑intents.test.ts`
- [ ] INT‑PAYMENT‑001.3 (AGENT): Implement Stripe Elements frontend integration (`PaymentElement` component) with React.
  **File(s):** `integrations/stripe/stripe‑elements.ts`, `artifacts/apex‑os/src/components/payments/StripePaymentForm.tsx`
  **Verification:** Component renders in dev server with Stripe test mode; test card payments succeed.
- [ ] INT‑PAYMENT‑001.4 (AGENT): Implement webhook handler with signature verification, deduplication, and async processing.
  **File(s):** `integrations/stripe/webhooks.ts`
  **Verification:** `pnpm vitest run -- webhooks.test.ts`
- [ ] INT‑PAYMENT‑001.5 (AGENT): Implement subscription management for recurring payments.
  **File(s):** `integrations/stripe/subscriptions.ts`
  **Verification:** `pnpm vitest run -- subscriptions.test.ts`
- [ ] INT‑PAYMENT‑001.6 (AGENT): Implement refund processing and dispute handling.
  **File(s):** `integrations/stripe/refunds.ts`
  **Verification:** `pnpm vitest run -- refunds.test.ts`
- [ ] INT‑PAYMENT‑001.7 (AGENT): Implement error mapping from Stripe errors to Apex domain errors.
  **File(s):** `integrations/stripe/error‑handling.ts`
  **Verification:** `pnpm vitest run -- error‑handling.test.ts`
- [ ] INT‑PAYMENT‑001.8 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑PAYMENT‑001.N (HUMAN): Final review – verify end‑to‑end payment flow in Stripe test mode, approve. **Verification:** Approved.

---

## [ ] INT‑AP‑001: Stripe ACH/Wire Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment execution layer exists. Bill payments in Apex are marked as “paid” manually. Stripe Treasury must be provisioned by the human operator.
**Size:** Medium

**Description:** Implement outbound ACH credit payment execution via Stripe Treasury, including idempotent transfer creation, webhook‑driven status updates, and reconciliation of Stripe transfers to Apex bill payment records.

**Depends on:** `finance/FINANCE‑BILLS‑APPROVALS.md → API‑AP‑008`, `API‑AP‑014`, `infrastructure/DEVOPS.md → JOB‑INFRA‑001`
**Blocks:** `integrations/INTEGRATION‑PLAID.md → INT‑AP‑002`
**Related Files:** `integrations/stripe/ach‑payments.ts`, `ach‑webhooks.ts`, `lib/integrations/ach‑reconciliation/index.ts`

**Definition of Done**
- [ ] `initiateStripeACHPayment(billPaymentId, bankAccountId, amount)` creates a Stripe Treasury `OutboundTransfer` with idempotency key derived from `billPaymentId`
- [ ] Webhook handler processes `outbound_transfer.created`, `outbound_transfer.posted`, `outbound_transfer.failed`, `outbound_transfer.returned` events
- [ ] Stripe webhook signature verified on every inbound event
- [ ] Bill payment record updated to `processing | paid | failed` based on webhook events
- [ ] Reconciliation service matches Stripe `OutboundTransfer.id` to `BillPayment.externalPaymentId`
- [ ] Idempotency: re‑submitting the same `billPaymentId` returns the existing transfer without creating a duplicate
- [ ] Rate limit handling: exponential backoff with jitter for Stripe 429 responses
- [ ] Unit tests pass using Stripe test mode with fixture webhook payloads
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Stripe ACH debits (customer collections – handled in INT‑AR‑001)
- International wire transfers via Stripe (handled in INT‑FIN‑002)
- Real‑time payments (RTP) network

**Rules to Follow**
- Use Stripe Node.js SDK v17+; pin API version to `2026‑04‑22`
- Idempotency keys: always pass `{ idempotencyKey: billPaymentId }` to every Stripe write call
- Webhook endpoint must be registered at `/webhooks/stripe/ach` and must return HTTP 200 within 5 s
- Store only the Stripe `OutboundTransfer.id` (not raw account numbers) in the DB as `externalPaymentId`

**Verification**
```bash
pnpm vitest run -- integrations/stripe/ach‑payments.test.ts
pnpm vitest run -- integrations/stripe/ach‑webhooks.test.ts
pnpm vitest run -- lib/integrations/ach‑reconciliation/reconciliation.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: ACH payment execution belongs to the AP sub‑domain of Finance. `StripeACHProcessor` is an infrastructure adapter.
- TDD: Write unit tests using Stripe test‑mode fixtures and pre‑recorded webhook payloads before implementing handlers.
- BDD: “Given a bill payment is approved and a bank account is linked, When `initiateStripeACHPayment` is called, Then a Stripe `OutboundTransfer` is created and the bill payment status transitions to `processing`.”
- Deep Module: `StripeACHProcessor` hides all Stripe SDK complexity behind a single `pay(billPaymentId)` method.

---

### Subtasks
- [ ] INT‑AP‑001.0.25 (AGENT): Read Stripe Treasury OutboundTransfer docs and the `PaymentPort` interface definition. *No action – pause.*
- [ ] INT‑AP‑001.0.5 (AGENT): Research Stripe Treasury OutboundTransfer API, idempotency key best practices, and webhook deduplication patterns. *Document findings briefly.*
- [ ] INT‑AP‑001.1 (AGENT): Implement `StripeACHProcessor` with idempotent `OutboundTransfer` creation.
  **File(s):** `integrations/stripe/ach‑payments.ts`
  **Verification:** `pnpm vitest run -- ach‑payments.test.ts`
- [ ] INT‑AP‑001.2 (AGENT): Implement webhook handler with signature verification and status‑machine transitions.
  **File(s):** `integrations/stripe/ach‑webhooks.ts`
  **Verification:** `pnpm vitest run -- ach‑webhooks.test.ts`
- [ ] INT‑AP‑001.3 (AGENT): Implement reconciliation service matching `OutboundTransfer.id` to `BillPayment`.
  **File(s):** `lib/integrations/ach‑reconciliation/index.ts`
  **Verification:** `pnpm vitest run -- reconciliation.test.ts`
- [ ] INT‑AP‑001.4 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑AP‑001.N (HUMAN): Final review – verify a test payment in Stripe dashboard and approve. **Verification:** Approved.

---

## [ ] INT‑AR‑001: Stripe Payment Links (Customer Payments)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Customers must pay invoices manually (wire/check). No self‑serve payment portal exists.
**Size:** Medium

**Description:** Generate Stripe Payment Links for AR invoices so customers can pay by card or bank transfer; handle `checkout.session.completed` webhooks to auto‑apply payments to Apex invoices; embed Stripe Elements for a branded payment portal.

**Depends on:** `finance/FINANCE‑MULTI‑ENTITY.md → API‑AR‑008`, `API‑AR‑012`
**Blocks:** `integrations/INTEGRATION‑PLAID.md → INT‑AR‑002`
**Related Files:** `integrations/stripe/payment‑links.ts`, `payment‑portal.ts`, `payment‑webhooks.ts`, `lib/integrations/payment‑application/index.ts`

**Definition of Done**
- [ ] `createPaymentLink(invoiceId)` generates a Stripe Payment Link with correct amount, currency, and metadata containing `invoiceId`
- [ ] Payment link includes both card and ACH bank transfer as payment method options
- [ ] `checkout.session.completed` webhook handler auto‑applies the Stripe payment to the Apex AR invoice
- [ ] Customer‑facing payment portal embeds Stripe Elements (`PaymentElement`) for a white‑labelled experience
- [ ] Payment link expiry configurable (default 30 days); expired links return a branded expiry page
- [ ] Webhook signature verified for all events; idempotency via `session.id` deduplication
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Use Stripe SDK v17+ pinned to API version `2026‑04‑22`
- Always include `invoiceId` in Stripe `metadata` on Payment Link creation
- PCI compliance: never let raw card data touch the Apex backend; use Stripe Elements exclusively

**Verification**
```bash
pnpm vitest run -- integrations/stripe/payment‑links.test.ts
pnpm vitest run -- integrations/stripe/payment‑portal.test.ts
pnpm vitest run -- integrations/stripe/payment‑webhooks.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Payment collection is an AR sub‑domain concern. `StripePaymentLinkService` is an infrastructure adapter.
- TDD: Use Stripe CLI (`stripe listen --forward‑to localhost:8081/webhooks/stripe/payments`) to replay test events during development.
- BDD: “Given an open invoice exists, When `createPaymentLink` is called and the customer pays, Then the invoice status transitions to `paid`.”
- Deep Module: `PaymentApplicationService` hides payment‑to‑invoice matching, partial payment handling, and AR balance updates.

---

### Subtasks
- [ ] INT‑AR‑001.0.25 (AGENT): Read Stripe Payment Links API docs. *No action – pause.*
- [ ] INT‑AR‑001.0.5 (AGENT): Research Stripe Payment Links API changes in `2026‑04‑22` version and `PaymentElement` embedding patterns. *Document findings briefly.*
- [ ] INT‑AR‑001.1 (AGENT): Implement `createPaymentLink` with metadata and payment method configuration.
  **File(s):** `integrations/stripe/payment‑links.ts`
  **Verification:** `pnpm vitest run -- payment‑links.test.ts`
- [ ] INT‑AR‑001.2 (AGENT): Implement customer payment portal with embedded Stripe Elements.
  **File(s):** `integrations/stripe/payment‑portal.ts`, `artifacts/apex‑os/src/pages/portal/PaymentPortal.tsx`
  **Verification:** Portal renders correctly in dev server with Stripe test mode.
- [ ] INT‑AR‑001.3 (AGENT): Implement webhook handler and payment application service.
  **File(s):** `integrations/stripe/payment‑webhooks.ts`, `lib/integrations/payment‑application/index.ts`
  **Verification:** `pnpm vitest run -- payment‑webhooks.test.ts`
- [ ] INT‑AR‑001.4 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑AR‑001.N (HUMAN): Final review – verify end‑to‑end payment flow in Stripe test mode, approve. **Verification:** Approved.

---

## [ ] INT‑PAYMENT‑002: Payment Testing & Compliance
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No payment testing suite or PCI compliance validation exists.
**Size:** Medium

**Description:** Create a comprehensive payment test suite covering all Stripe payment scenarios, implement automated PCI compliance validation checks, and configure performance testing for payment processing.

**Depends on:** `integrations/INTEGRATION‑STRIPE.md → INT‑PAYMENT‑001`
**Blocks:** [N/A] — final gate before production payment processing
**Related Files:** `tests/integrations/payments/test‑suite.ts`, `performance/`, `security/pci‑compliance.ts`

**Definition of Done**
- [ ] Test suite covers: card payments (success, decline, 3D Secure, insufficient funds), ACH payments (success, failure, return), subscriptions (creation, renewal, cancellation), refunds (full, partial, decline), disputes, webhooks (valid/invalid signature, retry), idempotency, rate limiting
- [ ] Edge case testing: network timeout, webhook delivery failure, concurrent payment attempts with same idempotency key
- [ ] PCI compliance validation automated: verify no raw card/CVV/bank numbers in logs, database, or API responses; verify Stripe Elements is the only card collection mechanism; verify `STRIPE_SECRET_KEY` never exposed to client; verify webhook signature validation always enabled
- [ ] Performance tests: measure Payment Intent creation latency (target: < 2 s p95), webhook processing time (target: < 5 s)
- [ ] Test report generation: JUnit XML output for CI integration
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- All tests must use Stripe test mode (no live Stripe calls)
- Webhook tests must use `stripe.webhooks.generateTestHeaderString()`
- PCI compliance checks must be run as part of the CI pipeline (blocking on critical violations)
- Test data must be cleaned up after each test run

**Verification**
```bash
pnpm vitest run -- tests/integrations/payments/
pnpm tsx security/pci‑compliance.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — testing and compliance are cross‑cutting infrastructure concerns.
- TDD: The test suite itself follows TDD principles; tests for the Stripe integration were written before implementation.
- BDD: “As a compliance officer, I can run automated PCI compliance checks that verify no card data touches our servers.”

---

### Subtasks
- [ ] INT‑PAYMENT‑002.0.25 (AGENT): Read Stripe test mode documentation, PCI DSS SAQ A requirements, and the Stripe integration code. *No action – pause.*
- [ ] INT‑PAYMENT‑002.0.5 (AGENT): Research Stripe test card numbers, `stripe.webhooks.generateTestHeaderString()` API, PCI DSS v4.0.1 SAQ A requirements. *Document findings briefly.*
- [ ] INT‑PAYMENT‑002.1 (AGENT): Write comprehensive payment scenario test suite using Stripe test mode.
  **File(s):** `tests/integrations/payments/test‑suite.ts`
  **Verification:** `pnpm vitest run -- test‑suite.ts` → GREEN.
- [ ] INT‑PAYMENT‑002.2 (AGENT): Write PCI compliance validation script (SAQ A checks).
  **File(s):** `security/pci‑compliance.ts`
  **Verification:** `pnpm tsx security/pci‑compliance.ts` runs without critical violations.
- [ ] INT‑PAYMENT‑002.3 (AGENT): Write payment performance tests.
  **File(s):** `tests/integrations/payments/performance/`
  **Verification:** Performance tests run; latency and throughput measured.
- [ ] INT‑PAYMENT‑002.4 (AGENT): Write security and edge case tests.
  **File(s):** `tests/integrations/payments/security/`, `edge‑cases/`
  **Verification:** All tests green.
- [ ] INT‑PAYMENT‑002.5 (AGENT): Generate JUnit XML output and integrate with CI.
  **File(s):** `vitest.config.ts`, `.github/workflows/ci.yml`
  **Verification:** CI pipeline runs payment tests and fails on critical PCI violations.
- [ ] INT‑PAYMENT‑002.N (HUMAN): Final review – review compliance report, verify all tests pass, approve. **Verification:** Approved.

---