# tasks/infrastructure/SUBSCRIPTION‑BILLING.md – Subscription Billing & Plans

Platform monetization via Stripe Billing subscriptions, plan management, metered billing, and the customer-facing billing settings page.  
Without this file, the platform cannot charge customers for premium features, and feature flag plan gating (FEATURE‑FLAGS.md) has no billing lifecycle backing it.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Subscriptions

### [ ] DB‑SUB‑001: Define Subscriptions & Plan Config Tables
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No subscription or plan tables exist. Stripe integration has no local data model to sync with.  
**Size:** Small  

**Description:**  
Define the `subscriptions` and `plan_configs` tables. `plan_configs` defines the available plan tiers and their Stripe price IDs; `subscriptions` tracks the current subscription status for each organization, including the Stripe subscription ID and current period dates.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`  
**Blocks:** `API‑SUB‑001`, `API‑SUB‑002`, `API‑SUB‑003`, `API‑SUB‑004`, `FRONT‑SUB‑001`

**Related Files:** `lib/db/src/schema/billing/subscriptions.ts`, `plan-configs.ts`, `lib/db/src/__tests__/billing‑subscriptions.test.ts`

**Definition of Done**
- [ ] `plan_configs` columns: `id` (uuid PK), `name` (text NOT NULL – "Free", "Pro", "Enterprise"), `features` (jsonb – list of feature flag keys enabled for this plan), `stripe_monthly_price_id` (text nullable), `stripe_yearly_price_id` (text nullable), `sort_order` (integer), `created_at`, `updated_at`.  
- [ ] `subscriptions` columns: `id` (uuid PK), `organization_id` (FK UNIQUE – one subscription per org), `plan_config_id` (FK), `stripe_subscription_id` (text nullable), `stripe_customer_id` (text nullable), `status` (pgEnum: `active|past_due|canceled|trialing|incomplete`), `current_period_start` (timestamp), `current_period_end` (timestamp), `cancel_at_period_end` (boolean default false), `trial_ends_at` (timestamp nullable), `created_at`, `updated_at`.  
- [ ] Index on `(organization_id)`, unique on `(stripe_subscription_id)`.  
- [ ] Zod schemas exported.  
- [ ] Unit tests pass (TDD red → green).  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/db test -- billing‑subscriptions.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DB‑SUB‑001.0.25 (AGENT): Read DB‑ORG‑001 and existing schema patterns. No action — pause.
- [ ] DB‑SUB‑001.1 (AGENT): Write failing schema tests. **File:** `lib/db/src/__tests__/billing‑subscriptions.test.ts` **Verification:** RED.
- [ ] DB‑SUB‑001.2 (AGENT): Implement tables, enums, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑SUB‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Stripe Integration

### [ ] API‑SUB‑001: Stripe Subscription Integration (Checkout, Webhooks, Customer Portal)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No Stripe integration exists. Organizations cannot subscribe to paid plans.  
**Size:** Large  

**Description:**  
Implement a complete Stripe Billing integration:
- Create Stripe Checkout sessions for subscription sign‑up and plan changes.
- Handle all Stripe webhook events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`).
- Sync subscription state from Stripe webhooks to the local `subscriptions` table.
- Provide a Stripe Customer Portal link for customers to manage payment methods and view invoice history.

**Depends on:** `DB‑SUB‑001`, `API‑FLAG‑001` (feature flags must be updated on plan change), `integrations/INTEGRATION‑STRIPE.md → INT‑PAYMENT‑001` (Stripe SDK and webhook handling established)  
**Blocks:** `API‑SUB‑002`, `API‑SUB‑003`, `FRONT‑SUB‑001`

**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/billing/subscription‑service.ts`, `artifacts/api‑server/src/routes/billing/subscriptions.ts`, `artifacts/api‑server/src/routes/webhooks/stripe‑billing.ts`

**Definition of Done**
- [ ] `POST /api/v1/billing/subscribe` – creates a Stripe Checkout session for the organization’s selected plan and price ID. Accepts `{ plan_config_id, billing_interval: 'monthly' | 'yearly' }`. Returns the Checkout URL for redirect.  
- [ ] `POST /api/v1/billing/change‑plan` – for upgrading/downgrading, calls Stripe API to update the subscription’s price; returns updated subscription details.  
- [ ] `POST /api/v1/billing/customer‑portal` – generates a Stripe Customer Portal link for the organization’s Stripe customer.  
- [ ] Webhook handler `POST /webhooks/stripe/billing`:
  - Verifies Stripe signature.
  - `checkout.session.completed` → creates/updates `subscriptions` row, sets `status: active`, updates `organizations.plan_type` and triggers feature flag recalculation.
  - `customer.subscription.updated` → updates local subscription metadata, status, current period.
  - `customer.subscription.deleted` → sets local subscription status to `canceled`, downgrades organization to `free` plan.
  - `invoice.paid` → logs payment; `invoice.payment_failed` → sets status to `past_due`, sends notification to organization admin.
- [ ] Idempotency handled via Stripe’s `idempotency_key` and webhook event ID deduplication.  
- [ ] Integration tests with Stripe test mode: subscribe, change plan, cancel, payment failure.  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- Stripe webhook endpoint must return HTTP 200 within 5 seconds; heavy processing (plan update, feature flag recalculation) must be delegated to a BullMQ job.  
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` must be environment variables; never committed.  
- All monetary amounts in cents; use Stripe’s `unit_amount` directly.  
- Stripe Customer ID must be stored on the `subscriptions` row for future API calls.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- billing‑subscriptions.test.ts
# Manual: use Stripe test mode to simulate a full subscription lifecycle
pnpm run typecheck
```

**DDD / TDD / BDD notes**
- DDD: Billing is a cross‑cutting infrastructure concern; it updates the Organization aggregate’s plan type, which gates feature flags.  
- TDD: Write integration tests with Stripe test mode fixtures; all must fail before implementation.  
- BDD: “As an organization admin, I can subscribe to a paid plan via Stripe Checkout, and my features unlock immediately upon successful payment.”

---

### Subtasks
- [ ] API‑SUB‑001.0.25 (AGENT): Read DB‑SUB‑001, INT‑PAYMENT‑001, and Stripe Billing API docs. No action — pause.
- [ ] API‑SUB‑001.1 (AGENT): Add billing endpoints and webhook paths to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen && pnpm typecheck`.
- [ ] API‑SUB‑001.2 (AGENT): Write integration tests (red). **File:** `artifacts/api‑server/__tests__/api/billing/subscriptions.test.ts` **Verification:** All red.
- [ ] API‑SUB‑001.3 (AGENT): Implement `SubscriptionService` with Checkout session creation, plan change, and customer portal. **File:** `artifacts/api‑server/src/services/billing/subscription‑service.ts` **Verification:** Unit tests.
- [ ] API‑SUB‑001.4 (AGENT): Implement Stripe billing webhook handler with signature verification and async processing. **File:** `artifacts/api‑server/src/routes/webhooks/stripe‑billing.ts` **Verification:** Unit tests.
- [ ] API‑SUB‑001.5 (AGENT): Implement routes. **File:** `artifacts/api‑server/src/routes/billing/subscriptions.ts` **Verification:** Integration tests green.
- [ ] API‑SUB‑001.6 (HUMAN): Manual test with Stripe test mode – subscribe, upgrade, cancel. **Verification:** Approved.

---

### [ ] API‑SUB‑002: Plan Management & Entitlement Sync
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** Plan configurations are static. Admins cannot view available plans, and feature flags are not automatically synced on plan changes.  
**Size:** Medium  

**Description:**  
Create endpoints for the frontend to query available plans and the organization’s current plan. On any plan change (via webhook or direct API), automatically synchronize the organization’s `plan_type` and the feature flag table (preserving any explicit admin overrides but ensuring new premium features are available).

**Depends on:** `API‑SUB‑001`, `API‑FLAG‑003` (plan‑flag map)  
**Blocks:** `FRONT‑SUB‑001`

**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/billing/plan‑service.ts`, `artifacts/api‑server/src/routes/billing/plans.ts`

**Definition of Done**
- [ ] `GET /api/v1/billing/plans` – returns all available plan configs with their features, monthly/yearly price IDs (if applicable), and sort order.  
- [ ] `GET /api/v1/billing/current` – returns the organization’s current subscription status, plan, and upcoming invoice (if any).  
- [ ] On any plan change (via webhook processing in API‑SUB‑001), call `PlanService.syncEntitlements(organizationId, newPlanConfigId)`:
  - Updates `organizations.plan_type`.
  - Iterates over feature flags defined in `planFlagMap`; for any flag whose minimum plan requirement is ≤ new plan, sets `enabled = true` if no override exists; for flags above new plan, sets `enabled = false` unless an explicit admin override exists.
- [ ] Unit tests for entitlement sync logic.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- plan‑service.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] API‑SUB‑002.1 (AGENT): Add plan endpoints to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen`.
- [ ] API‑SUB‑002.2 (AGENT): Implement `PlanService` with plan listing and entitlement sync. **File:** `artifacts/api‑server/src/services/billing/plan‑service.ts` **Verification:** Unit tests.
- [ ] API‑SUB‑002.3 (AGENT): Create routes. **File:** `artifacts/api‑server/src/routes/billing/plans.ts` **Verification:** Integration tests.
- [ ] API‑SUB‑002.4 (HUMAN): Final review and sign‑off.

---

### [ ] API‑SUB‑003: Subscription Webhook Event Processing & Notifications
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** Stripe webhooks are received but only update the subscription record. No user‑facing notifications are sent for billing events.  
**Size:** Medium  

**Description:**  
Extend the webhook processing to send in‑app notifications and emails for billing events:
- `invoice.payment_succeeded` → “Your payment of $X was successful.”
- `invoice.payment_failed` → “Payment failed. Please update your billing information to avoid service interruption.”
- `customer.subscription.trial_will_end` → “Your trial ends in 3 days. Add a payment method to continue.”
- `customer.subscription.deleted` → “Your subscription has been canceled.”

If a payment failure puts the subscription into `past_due`, also show a banner in the app header warning admins.

**Depends on:** `API‑SUB‑001`, `infrastructure/NOTIFICATIONS.md → API‑NOTIF‑001`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/services/billing/billing‑notifications.ts`

**Definition of Done**
- [ ] `BillingNotificationService` subscribes to billing events (or is called directly from the webhook handler).  
- [ ] Each billing event type mapped to a notification template (in‑app + email).  
- [ ] Failed payment notification includes a direct link to the billing settings page.  
- [ ] `past_due` banner: an API endpoint `GET /api/v1/billing/past‑due‑banner` returns `{ show: true, message: "..." }` if subscription is `past_due`. Frontend header checks this on load.  
- [ ] Integration tests: payment failure webhook → notification created and email sent.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- billing‑notifications.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] API‑SUB‑003.1 (AGENT): Implement `BillingNotificationService`. **File:** `artifacts/api‑server/src/services/billing/billing‑notifications.ts` **Verification:** Unit tests.
- [ ] API‑SUB‑003.2 (AGENT): Add `past‑due‑banner` endpoint and wire frontend header to display it. **File:** `artifacts/api‑server/src/routes/billing/index.ts`, `artifacts/apex‑os/src/components/layout/Header.tsx`
- [ ] API‑SUB‑003.3 (HUMAN): Final review – test with Stripe test mode webhook simulation.

---

### [ ] API‑SUB‑004: Metered Billing
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** Only flat‑rate subscriptions are planned. Usage‑based pricing (per seat, per document, per appointment) is specified in the product plan but has no implementation.  
**Size:** Large  

**Description:**  
Implement metered billing via Stripe Metered Billing API. For plans that include usage‑based components:
- Report usage records to Stripe Metered Billing API on a regular interval (hourly or daily).
- Usage events must be idempotent; duplicate events must not result in double billing.
- Supported usage dimensions: `seats` (number of active users), `documents` (number of documents stored), `appointments` (number of booked appointments per month).
- Metered usage is aggregated per organization and reported to Stripe via the `usage_records` API.

**Depends on:** `API‑SUB‑001`, `DB‑SUB‑001`, all domain services (must emit usage events)  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/services/billing/metered‑billing‑service.ts`, `artifacts/api‑server/src/jobs/metered‑usage‑reporter.ts`

**Definition of Done**
- [ ] `metered_usage_events` table: `id`, `organization_id`, `dimension` (pgEnum: `seats|documents|appointments`), `quantity` (integer), `recorded_at` (timestamp), `reported_to_stripe` (boolean default false), `stripe_subscription_item_id` (text), `idempotency_key` (text UNIQUE).  
- [ ] Domain events that affect usage (user created/deactivated → seats; document uploaded/deleted → documents; appointment booked → appointments) emitted and handled by `MeteredUsageCollector`.  
- [ ] `MeteredBillingReporter` job (BullMQ, runs hourly) aggregates unreported usage events by organization and dimension, calls Stripe `POST /v1/subscription_items/{item}/usage_records` with `quantity` and `idempotency_key`, marks events as reported.  
- [ ] Plan config includes `usage_dimensions: [{ dimension: 'seats', included: 5, price_per_unit_cents: 1000 }]` (example: 5 seats included, then $10/seat).  
- [ ] Integration test: simulate 3 user creations → verify usage events stored → run reporter → verify Stripe test mode received 3 seats.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- metered‑billing.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] API‑SUB‑004.0.25 (AGENT): Research Stripe Metered Billing API and idempotency key best practices.
- [ ] API‑SUB‑004.1 (AGENT): Define `metered_usage_events` schema. **File:** `lib/db/src/schema/billing/metered‑usage‑events.ts` **Verification:** Migration; `pnpm typecheck`.
- [ ] API‑SUB‑004.2 (AGENT): Implement `MeteredUsageCollector` that listens for domain events and records usage. **File:** `artifacts/api‑server/src/services/billing/metered‑usage‑collector.ts` **Verification:** Unit tests.
- [ ] API‑SUB‑004.3 (AGENT): Implement `MeteredBillingReporter` BullMQ job. **File:** `artifacts/api‑server/src/jobs/metered‑usage‑reporter.ts` **Verification:** Integration test with Stripe test mode.
- [ ] API‑SUB‑004.4 (HUMAN): Manual verification of usage reporting in Stripe dashboard.

---

## Frontend – Billing Settings

### [ ] FRONT‑SUB‑001: Billing Settings Page
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No billing settings page exists. Users cannot view their current plan, upgrade/downgrade, or manage payment methods.  
**Size:** Medium  

**Description:**  
Build a billing settings page at `/settings/billing` under the Settings module. It displays:
- Current plan with feature comparison.
- “Upgrade” / “Downgrade” buttons with Stripe Checkout redirect.
- Invoice history with PDF download (via Stripe Customer Portal link or embedded).
- Payment method management (via Stripe Customer Portal).
- Usage meter (if on a metered plan).

**Depends on:** `API‑SUB‑002`, `API‑SUB‑001`, `FRONT‑FLAG‑001`  
**Blocks:** None

**Related Files:** `artifacts/apex‑os/src/pages/settings/BillingSettings.tsx`, `artifacts/apex‑os/src/hooks/billing/useCurrentSubscription.ts`, `useAvailablePlans.ts`

**Definition of Done**
- [ ] Page accessible at `/settings/billing` (admin only).  
- [ ] Plan card: current plan name, price, billing interval, and status badge.  
- [ ] Feature comparison table: rows for each premium feature, columns for Free / Pro / Enterprise with checkmarks.  
- [ ] “Change Plan” button opens a plan selector modal; selecting a new plan redirects to Stripe Checkout.  
- [ ] “Manage Payment Method” and “View Invoices” buttons link to Stripe Customer Portal.  
- [ ] Usage meter (if applicable): shows current usage vs included quantity.  
- [ ] Component tests with MSW.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- BillingSettings.test.tsx
pnpm run typecheck
```

---

### Subtasks
- [ ] FRONT‑SUB‑001.0.25 (AGENT): Read API‑SUB‑002 and API‑SUB‑001 generated client hooks. No action — pause.
- [ ] FRONT‑SUB‑001.1 (AGENT): Build `BillingSettings` page with plan display and upgrade flow. **File:** `artifacts/apex‑os/src/pages/settings/BillingSettings.tsx`
- [ ] FRONT‑SUB‑001.2 (AGENT): Implement feature comparison table and usage meter. **Verification:** Component tests.
- [ ] FRONT‑SUB‑001.3 (HUMAN): Manual test – upgrade, downgrade, verify plan changes in Stripe test mode and local DB.

---