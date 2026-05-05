Now producing `TODO-P7-PAYMENTS.md`.

---

# TODO-P7-PAYMENTS.md – Phase 7 Payment Processing

This document contains payment processing tasks for Stripe integration and compliance testing. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 Payment Processing Task Index

- [ ] INT‑PAYMENT‑001 – Stripe Payment Integration
- [ ] INT‑PAYMENT‑002 – Payment Testing & Compliance

---

## [ ] INT‑PAYMENT‑001: Stripe Payment Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No payment processing integration exists. As of May 2026, Stripe's Payment Intents API (with `2026-04-22` API version) is the primary interface for processing card, ACH, and bank transfer payments. Stripe Elements provides a PCI‑compliant UI component for card collection. Webhooks deliver asynchronous event notifications for payment status updates. The Stripe Node.js SDK (v17+) is the recommended client library.
**Size:** Large

**Description:** Implement a complete Stripe payment processing pipeline covering Payment Intents (card, ACH, bank transfer), Stripe Elements for secure card collection, webhook handlers for asynchronous status updates, subscription management for recurring payments, and refund processing with dispute handling.

**Depends on:** API‑APPT‑008 (appointment payment service), API‑APPT‑007 (appointment API), INT‑VIDEO‑003 (Google Meet — dependency listed in original schedule but should be parallel)
**Blocks:** INT‑PAYMENT‑002 (payment testing and compliance)
**Related Files:** `integrations/stripe/payment-intents.ts`, `integrations/stripe/subscriptions.ts`, `integrations/stripe/refunds.ts`, `integrations/stripe/webhooks.ts`, `integrations/stripe/stripe-elements.ts`, `lib/integrations/payment-sync/stripe-sync.ts`

**Imports / Exports**
- Imports: `stripe` npm SDK (v17+), `PaymentPort` interface, `Appointment` domain entity, `Invoice` domain entity
- Exports: `StripePaymentProcessor`, `StripeSubscriptionService`, `StripeRefundService`, `StripeWebhookHandler`, `StripePaymentPortal`

**Definition of Done**
- [ ] `createPaymentIntent(appointmentId, paymentMethodId)` creates a Stripe Payment Intent via `POST /v1/payment_intents` with correct amount (in cents), currency, and metadata containing `appointmentId`
- [ ] Payment method integration: supports `card`, `us_bank_account` (ACH), and `customer_balance` (bank transfer) payment method types
- [ ] `confirmPaymentIntent(paymentIntentId)` confirms the Payment Intent for server‑side confirmation flows; client‑side confirmation via Stripe Elements is also supported
- [ ] Stripe Elements integration: `StripePaymentPortal` renders Stripe's `PaymentElement` component for secure, PCI‑compliant card collection in the frontend
- [ ] Webhook handler at `/webhooks/stripe/payments` processes events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`, `charge.dispute.created`, `invoice.payment_succeeded`
- [ ] Stripe webhook signature verified using `stripe.webhooks.constructEvent()` on every inbound event; events with invalid signatures are rejected with HTTP 400
- [ ] Apex `Payment` record updated on payment success; Apex `Appointment` or `Invoice` status transitions based on webhook events
- [ ] Subscription management: `createSubscription(customerId, priceId)` for recurring appointments; handles `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` webhooks
- [ ] Refund processing: `createRefund(paymentIntentId, amount?)` issues full or partial refunds; `charge.refunded` webhook updates Apex payment status
- [ ] Idempotency: uses client‑side `Idempotency-Key` header (UUID v4) forwarded to Stripe; same key on retry returns the existing Payment Intent without creating duplicates
- [ ] Rate limiting: respects Stripe's 100 requests/second limit in test mode and 1000 requests/second in live mode; implements exponential backoff on `429 Too Many Requests`
- [ ] Error mapping: Stripe errors (`card_declined`, `processing_error`, `rate_limit`) mapped to Apex domain errors with user‑friendly messages
- [ ] Unit tests pass using Stripe test mode (`sk_test_*`) with fixture webhook payloads; no live Stripe calls in tests beyond initial fixture recording
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Stripe Connect (marketplace/platform payments)
- Stripe Terminal (in‑person card present payments)
- Stripe Issuing (virtual card creation — handled by Finance domain INT‑FIN‑001)
- Multi‑currency dynamic conversion
- Invoicing via Stripe Invoicing API (Apex generates its own invoices)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`
- Never use live Stripe keys in tests; always use `sk_test_*`
- Never skip webhook signature verification — unsigned webhooks are a critical injection vector
- PCI compliance: never let raw card data touch the Apex backend; use Stripe Elements or Checkout exclusively
- Never store raw card numbers, CVV, or bank account numbers in any Apex database
- Never log the raw `client_secret` from Payment Intents in server‑side logs

**Output Artifacts**
- Code changes in: `integrations/stripe/`, `lib/integrations/payment-sync/`
- Tests added/updated in: `integrations/stripe/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] — Stripe IDs stored in existing `payments` table as `externalPaymentId`

**Rollback**
- Granularity: file‑level — delete `integrations/stripe/` directory; deregister webhook endpoint from Stripe Dashboard; payments revert to manual recording
- Halt condition: if Stripe webhooks are not delivered in test mode, stop and verify webhook endpoint registration and Stripe CLI forwarding

**Rules to Follow**
- Use Stripe Node.js SDK v17+ (`stripe` npm package); pin the API version to `2026-04-22` via `new Stripe(key, { apiVersion: '2026-04-22' })`
- All monetary amounts must be in the smallest currency unit (cents for USD); convert using `Math.round(amount * 100)`
- Idempotency keys: generate a UUID v4 client‑side and include as the `Idempotency-Key` header; store in component state and reuse on retry
- Webhook endpoint must return HTTP 200 within 5 s; process all business logic asynchronously via BullMQ jobs
- Stripe Elements `clientSecret` must never be exposed in server‑side logs or error messages
- Map Stripe payment statuses to Apex domain statuses: `requires_payment_method` → `pending`, `processing` → `processing`, `succeeded` → `paid`, `canceled` → `cancelled`, `requires_action` → `awaiting_3ds`
- Use `expand` parameter on Payment Intent creation to reduce follow‑up API calls (e.g., `expand: ['payment_method']`)

**Verification**
```bash
# Test Payment Intent creation and confirmation
pnpm vitest run -- integrations/stripe/payment-intents.test.ts

# Test subscription management
pnpm vitest run -- integrations/stripe/subscriptions.test.ts

# Test refund processing
pnpm vitest run -- integrations/stripe/refunds.test.ts

# Test webhook processing
pnpm vitest run -- integrations/stripe/webhooks.test.ts

# Test error mapping and rate limiting
pnpm vitest run -- integrations/stripe/error-handling.test.ts

# Full typecheck
pnpm run typecheck

# Manual smoke test (Stripe test mode)
curl -X POST http://localhost:8081/integrations/stripe/test-payment
```

**Advanced Code Patterns**
- Adapter pattern: `StripePaymentProcessor` implements `PaymentPort`; domain layer never imports Stripe‑specific types
- Webhook deduplication: use `event.id` as a dedup key in a `processed_webhook_events` table; check before processing
- Payment Intent metadata: embed `{ appointmentId, orgId, invoiceId }` in the `metadata` field for zero‑ambiguity correlation in webhook handlers
- Stripe Elements integration: use `@stripe/react-stripe-js` and `@stripe/stripe-js` for the React frontend; create `Elements` wrapper with `clientSecret` from the Payment Intent
- Proactive `clientSecret` expiry: if a client‑side confirmation is pending beyond the `clientSecret` TTL, generate a new one and return it to the frontend
- Optimistic payment status: update Apex payment status optimistically on `payment_intent.processing`; confirm/revert on `succeeded`/`failed` events

**Anti‑Patterns**
- Do not create Payment Intents without metadata — webhook handlers cannot correlate events to Apex entities
- Do not store `clientSecret` in the database or log it — it is a short‑lived secret
- Do not skip webhook signature verification; Stripe may send test events that appear valid but fail signature check
- Do not process webhook events synchronously; the Stripe timeout is tight, and processing business logic may exceed it
- Do not use `source` objects (legacy); always use `PaymentIntent` and `PaymentMethod` (SAA)
- Do not hardcode payment method types; derive from appointment/event configuration

**DDD / TDD / BDD / Deep Module notes**
- DDD: Stripe is an external payment service provider within the Appointments Finance bounded context. `StripePaymentProcessor` is an anti‑corruption layer implementing `PaymentPort`, translating Stripe concepts (Payment Intent, Subscription) into Apex domain events.
- TDD: Use Stripe test mode with recorded fixture webhook payloads. All unit tests must be deterministic without a live Stripe connection.
- BDD: "As a client, I can pay for an appointment with a credit card or bank transfer, and as a provider, I receive automatic notifications when payments succeed or fail."
- Deep Module: `StripePaymentProcessor.createPayment(amount, currency, metadata)` hides Stripe SDK complexity, idempotency key management, rate limit handling, and error mapping behind a single method. `StripeWebhookHandler.process(event)` hides signature verification, event deduplication, and business logic orchestration.

---

### Subtasks

- [ ] INT‑PAYMENT‑001.0.25 (AGENT): Read the entire task and Stripe API documentation (Payment Intents, Subscriptions, Webhooks, Stripe Elements).
  *No action — pause until fully understood.*

- [ ] INT‑PAYMENT‑001.0.5 (AGENT): Research Stripe Node.js SDK v17+ API (`stripe.paymentIntents.create`, webhook signature verification, Stripe Elements React integration) and Stripe's `2026-04-22` API version changes (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑PAYMENT‑001.0.75 (AGENT): Reason about webhook deduplication strategy, Payment Intent metadata schema, and `clientSecret` lifecycle. Present design to user if uncertain.
  *If uncertain, ask the user before executing.*

- [ ] INT‑PAYMENT‑001.1 (AGENT): Install Stripe SDK and configure with `STRIPE_SECRET_KEY` and API version pinning.
  **File(s):** `integrations/stripe/index.ts`, `artifacts/api-server/.env.example`
  **Verification:** `pnpm run typecheck` passes; Stripe client initialises without errors.

- [ ] INT‑PAYMENT‑001.2 (AGENT): Implement Payment Intent creation, confirmation, and cancellation with idempotency key support.
  **File(s):** `integrations/stripe/payment-intents.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/payment-intents.test.ts`

- [ ] INT‑PAYMENT‑001.3 (AGENT): Implement Stripe Elements frontend integration (`PaymentElement` component) with React.
  **File(s):** `integrations/stripe/stripe-elements.ts`, `artifacts/apex-os/src/components/payments/StripePaymentForm.tsx`
  **Verification:** Component renders in dev server with Stripe test mode; test card payments succeed.

- [ ] INT‑PAYMENT‑001.4 (AGENT): Implement webhook handler with signature verification, deduplication, and async processing.
  **File(s):** `integrations/stripe/webhooks.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/webhooks.test.ts`

- [ ] INT‑PAYMENT‑001.5 (AGENT): Implement subscription management for recurring payments.
  **File(s):** `integrations/stripe/subscriptions.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/subscriptions.test.ts`

- [ ] INT‑PAYMENT‑001.6 (AGENT): Implement refund processing and dispute handling.
  **File(s):** `integrations/stripe/refunds.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/refunds.test.ts`

- [ ] INT‑PAYMENT‑001.7 (AGENT): Implement error mapping from Stripe errors to Apex domain errors.
  **File(s):** `integrations/stripe/error-handling.ts`
  **Verification:** `pnpm vitest run -- integrations/stripe/error-handling.test.ts`

- [ ] INT‑PAYMENT‑001.8 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑PAYMENT‑001.N (HUMAN): Final review — verify end‑to‑end payment flow in Stripe test mode (create Payment Intent, confirm via Elements, verify webhook received), approve.
  **Verification:** Approved.

---

## [ ] INT‑PAYMENT‑002: Payment Testing & Compliance
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No payment testing suite or PCI compliance validation exists. As of May 2026, Stripe provides extensive test card numbers and test bank account numbers for simulating all payment outcomes. PCI DSS v4.0.1 is the current standard (transition deadline March 31 2025), requiring SAQ A or SAQ D compliance depending on integration method. SAQ A (simplest) applies when using only Stripe Elements or Checkout (card data never touches the merchant's server).
**Size:** Medium

**Description:** Create a comprehensive payment test suite covering all Stripe payment scenarios (success, decline, 3D Secure, subscription lifecycle, refund, dispute, webhook failure), implement automated PCI compliance validation checks, and configure performance testing for payment processing.

**Depends on:** INT‑PAYMENT‑001 (Stripe integration must be implemented)
**Blocks:** [N/A] — final gate before production payment processing
**Related Files:** `tests/integrations/payments/test-suite.ts`, `tests/integrations/payments/performance/`, `security/pci-compliance.ts`, `tests/integrations/payments/security/`

**Imports / Exports**
- Imports: `stripe` SDK (test mode), `StripePaymentProcessor`, `StripeWebhookHandler`, `Supertest` (API test client)
- Exports: [N/A] — test outputs and compliance reports

**Definition of Done**
- [ ] Test suite covers all major Stripe payment scenarios:
  - Card payments: success (`pm_card_visa`), decline (`pm_card_declined`), 3D Secure (`pm_card_authenticationRequired`), insufficient funds
  - ACH payments: success, failure, return
  - Subscriptions: creation, renewal, cancellation, payment failure
  - Refunds: full, partial, refund decline
  - Disputes: dispute creation, response, resolution
  - Webhooks: valid signature, invalid signature, retry on failure, idempotency
  - Idempotency: same key on retry returns 200 with original Payment Intent
  - Rate limiting: simulate `HTTP 429` from Stripe and verify exponential backoff
- [ ] Edge case testing: network timeout during Payment Intent creation, webhook delivery failure and retry, concurrent payment attempts with same idempotency key
- [ ] PCI compliance validation automated:
  - Verify that no raw card, CVV, or bank account numbers appear in any server‑side log, database, or API response
  - Verify that Stripe Elements is the only card collection mechanism (no raw form fields for card data exist in the codebase)
  - Verify that the `STRIPE_SECRET_KEY` is never exposed to the client (appears only in server‑side imports)
  - Verify webhook signature validation is enabled (not skipped in any code path)
  - Verify SAQ A eligibility: no card data touches the merchant server; integration method is Stripe.js / Elements
- [ ] Performance tests: measure Payment Intent creation latency under load (target: < 2 s p95), webhook processing time (target: < 5 s)
- [ ] Test report generation: all test results output as JUnit XML for CI integration
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Live production payment testing (requires real card processing — use Stripe test mode only)
- External PCI certification audit (automated checks are preparatory, not a substitute for an audit)
- Payment fraud detection testing
- Cross‑border payment regulatory compliance testing

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, live Stripe keys
- Never use live Stripe keys in tests; always use `sk_test_*` and test card numbers
- Test fixtures must use only Stripe‑documented test card numbers (never real card numbers)
- Do not log real payment information during tests

**Output Artifacts**
- Code changes in: [N/A] — tests and compliance scripts only; no production code changes
- Tests added/updated in: `tests/integrations/payments/`, `security/pci-compliance.ts`
- Documentation: `docs/pci-compliance-checklist.md` (compliance report after validation)
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete test files and compliance scripts; no production impact
- Halt condition: if the test suite itself fails to compile, stop and fix TypeScript errors before running tests

**Rules to Follow**
- All tests must use Stripe test mode (no live Stripe calls)
- Webhook tests must use `stripe.webhooks.generateTestHeaderString()` to generate valid signatures with a test secret
- PCI compliance checks must be run as part of the CI pipeline (blocking on critical violations)
- Performance tests must use `autocannon` or `k6` and run against a local test instance, not production
- Test data must be cleaned up after each test run (cancel incomplete Payment Intents, delete test subscriptions)

**Verification**
```bash
# Run full payment test suite
pnpm vitest run -- tests/integrations/payments/

# Run PCI compliance validation
pnpm tsx security/pci-compliance.ts

# Run payment performance tests
pnpm vitest run -- tests/integrations/payments/performance/

# Run payment security tests
pnpm vitest run -- tests/integrations/payments/security/

# Run full typecheck
pnpm run typecheck

# Manual: verify compliance report output
cat docs/pci-compliance-checklist.md
```

**Advanced Code Patterns**
- Test fixture generation: use `nock` or similar to record Stripe API responses once and replay deterministically
- Stripe webhook test helper: `stripe.webhooks.generateTestHeaderString({ payload, secret })` for signature verification testing
- Idempotency test pattern: send two requests with the same `Idempotency-Key` header; assert second request returns the same response (200, same Payment Intent ID)
- PCI compliance checker: a script that greps the codebase for patterns like `/sk_live_/` (live secret keys), `<input type="card">`, and logs any violations
- Performance test automation: use `k6` or `autocannon` JSON output parsed into test assertions

**Anti‑Patterns**
- Do not test with live Stripe keys; accidental live charges in a test suite can be costly
- Do not skip webhook signature verification in tests — it must be tested as part of the compliance suite
- Do not hardcode test card numbers outside of Stripe's documented test cards
- Do not run performance tests against production; always against a local or staging instance
- Do not skip PCI compliance validation in CI — this is a gating check before deployment

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — testing and compliance are cross‑cutting infrastructure concerns.
- TDD: The test suite itself is written following TDD principles — tests for the Stripe integration were written before the implementation; this task extends and formalises them.
- BDD: "As a compliance officer, I can run automated PCI compliance checks that verify no card data touches our servers and that all Stripe webhooks are properly validated."
- Deep Module: [N/A] — tests are intentionally shallow wrappers around the Stripe SDK; complexity lives in the integration adapters they test.

---

### Subtasks

- [ ] INT‑PAYMENT‑002.0.25 (AGENT): Read the entire task, Stripe test mode documentation, PCI DSS SAQ A requirements, and the Stripe integration code from INT‑PAYMENT‑001.
  *No action — pause until fully understood.*

- [ ] INT‑PAYMENT‑002.0.5 (AGENT): Research Stripe test card numbers, `stripe.webhooks.generateTestHeaderString()` API, PCI DSS v4.0.1 SAQ A requirements, and performance testing tools for Node.js (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑PAYMENT‑002.0.75 (AGENT): Reason about test coverage strategy — which scenarios are highest priority and what constitutes a sufficient compliance check. Present to user if uncertain.
  *If uncertain, start with the scenarios listed in Definition of Done and expand incrementally.*

- [ ] INT‑PAYMENT‑002.1 (AGENT): Write comprehensive payment scenario test suite using Stripe test mode.
  **File(s):** `tests/integrations/payments/test-suite.ts`
  **Verification:** `pnpm vitest run -- tests/integrations/payments/test-suite.ts` → GREEN.

- [ ] INT‑PAYMENT‑002.2 (AGENT): Write PCI compliance validation script (SAQ A checks).
  **File(s):** `security/pci-compliance.ts`
  **Verification:** `pnpm tsx security/pci-compliance.ts` runs without critical violations.

- [ ] INT‑PAYMENT‑002.3 (AGENT): Write payment performance tests.
  **File(s):** `tests/integrations/payments/performance/`
  **Verification:** Performance tests run; latency and throughput measured.

- [ ] INT‑PAYMENT‑002.4 (AGENT): Write security and edge case tests (invalid signatures, network failures, concurrent requests).
  **File(s):** `tests/integrations/payments/security/`, `tests/integrations/payments/edge-cases/`
  **Verification:** All tests green.

- [ ] INT‑PAYMENT‑002.5 (AGENT): Generate JUnit XML output and integrate with CI.
  **File(s):** `vitest.config.ts` (update reporter), `.github/workflows/ci.yml`
  **Verification:** CI pipeline runs payment tests and fails on critical PCI violations.

- [ ] INT‑PAYMENT‑002.N (HUMAN): Final review — review compliance report, verify all tests pass, approve.
  **Verification:** Approved.

---

## Integration Rules Framework

To avoid rules duplication across all integration tasks, the following common rules framework applies:

### Common Integration Rules
- **Authentication**: Use OAuth 2.0 with proper token management and refresh flows; encrypt tokens at rest with AES‑256‑GCM
- **Error Handling**: Implement exponential backoff for rate limits and network errors
- **Security**: Store credentials securely via environment variables; never log raw tokens or credentials; verify webhook signatures
- **Rate Limiting**: Respect provider‑specific API limits with intelligent throttling
- **Testing**: Use provider test environments with comprehensive unit test coverage; record API responses as fixtures
- **Logging**: Implement structured logging (Pino) with security‑sensitive data redaction; use `[REDACTED]` for tokens and credentials

### Provider‑Specific Rules
Each integration task includes only rules specific to that provider, not duplicating the common rules above.

---

*End of Phase 7 Payment Processing.*