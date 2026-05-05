# tasks/integrations/INTEGRATION‑PLAID.md – Plaid Bank Integration

This file covers Plaid integration for bank account connection, transaction sync, and bank account verification (Plaid Auth with micro‑deposit fallback). All Plaid interactions are abstracted behind port interfaces to keep domain logic provider‑agnostic. These tasks are part of Phase 7 and require Plaid sandbox credentials provisioned by a human operator.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] INT‑AP‑002: Plaid Bank Feed Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No bank feed exists. Bank accounts are manually reconciled in Apex. Plaid sandbox credentials must be provisioned by the human operator.
**Size:** Large

**Description:** Implement Plaid Link for bank account connection, incremental transaction sync using Plaid’s `/transactions/sync` endpoint, automatic payment reconciliation, and real‑time webhook processing for new transaction notifications.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑005`, `finance/FINANCE‑BILLS‑APPROVALS.md → API‑AP‑008`, `API‑AP‑014`
**Blocks:** `integrations/INTEGRATION‑STRIPE.md → INT‑AR‑001` (bank account data referenced)
**Related Files:** `integrations/plaid/bank‑feed.ts`, `link‑client.ts`, `webhooks.ts`, `lib/integrations/bank‑reconciliation/index.ts`

**Definition of Done**
- [ ] `createLinkToken(userId, accountId)` generates a short‑lived Plaid Link token for the frontend
- [ ] `exchangePublicToken(publicToken)` exchanges for `access_token`; access token stored encrypted in DB
- [ ] `syncBankTransactions(bankAccountId, cursor)` uses `/transactions/sync` for incremental updates (added/modified/removed)
- [ ] Sync cursor (`next_cursor`) persisted per bank account for resumable incremental sync
- [ ] Automatic reconciliation matches Plaid transactions to Apex bill payments using amount + date fuzzy matching
- [ ] Bank balance synced via `/accounts/balance/get` after each transaction sync
- [ ] Plaid webhook handler processes `TRANSACTIONS_SYNC_UPDATES_AVAILABLE` and `ITEM_ERROR` events
- [ ] Plaid webhook signature verified using the raw request body and `Plaid‑Verification` header
- [ ] Access tokens stored encrypted (AES‑256‑GCM) in DB; never logged or returned in API responses
- [ ] Unit tests pass against Plaid sandbox
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Plaid Investments product
- Plaid Identity product
- Plaid Signal (ACH risk scoring)
- International bank accounts (non‑US/CA)

**Rules to Follow**
- Use `plaid` Node.js SDK v14+; use `PlaidEnvironments.sandbox` for all non‑production work
- Always use `/transactions/sync` (not the deprecated `/transactions/get`)
- Encrypt Plaid `access_token` with AES‑256‑GCM before storing; decrypt only at call time
- Reconciliation: use amount‑within‑$0.01 AND date‑within‑2‑days fuzzy match; flag ambiguous matches for human review
- Webhook endpoint at `/webhooks/plaid` must verify the `Plaid‑Verification` JWT using Plaid’s JWKS endpoint

**Verification**
```bash
pnpm vitest run -- integrations/plaid/bank‑feed.test.ts
pnpm vitest run -- integrations/plaid/link‑client.test.ts
pnpm vitest run -- integrations/plaid/webhooks.test.ts
pnpm vitest run -- lib/integrations/bank‑reconciliation/reconciliation.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bank feed integration is infrastructure in the Finance bounded context. `PlaidBankFeedService` is an adapter; reconciliation logic lives in the domain service `BankReconciliationService`.
- TDD: Use Plaid sandbox with pre‑seeded transactions; record API responses as fixtures for deterministic tests.
- BDD: “Given a bank account is connected via Plaid Link, When the sync job runs, Then new transactions appear in Apex and matched transactions are auto‑reconciled against existing bill payments.”
- Deep Module: `PlaidBankFeedService` hides cursor management, encryption, and Plaid SDK details behind `sync(bankAccountId): Promise<SyncResult>`.

---

### Subtasks
- [ ] INT‑AP‑002.0.25 (AGENT): Read the entire task and Plaid `/transactions/sync` documentation. *No action – pause.*
- [ ] INT‑AP‑002.0.5 (AGENT): Research Plaid SDK v14+ breaking changes, `/transactions/sync` cursor semantics, and JWKS webhook verification. *Document findings briefly.*
- [ ] INT‑AP‑002.1 (AGENT): Implement Plaid Link token creation and public token exchange with encrypted access token storage.
  **File(s):** `integrations/plaid/link‑client.ts`
  **Verification:** `pnpm vitest run -- link‑client.test.ts`
- [ ] INT‑AP‑002.2 (AGENT): Implement incremental transaction sync using `/transactions/sync` with cursor persistence.
  **File(s):** `integrations/plaid/bank‑feed.ts`
  **Verification:** `pnpm vitest run -- bank‑feed.test.ts`
- [ ] INT‑AP‑002.3 (AGENT): Implement webhook handler with JWKS signature verification.
  **File(s):** `integrations/plaid/webhooks.ts`
  **Verification:** `pnpm vitest run -- webhooks.test.ts`
- [ ] INT‑AP‑002.4 (AGENT): Implement fuzzy‑match reconciliation service.
  **File(s):** `lib/integrations/bank‑reconciliation/index.ts`
  **Verification:** `pnpm vitest run -- reconciliation.test.ts`
- [ ] INT‑AP‑002.5 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑AP‑002.N (HUMAN): Final review – verify Plaid Link flow and a transaction sync in sandbox, approve. **Verification:** Approved.

---

## [ ] INT‑AR‑002: Plaid Bank Account Verification
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Bank account ownership is not verified before ACH debit authorisation. Micro‑deposit verification does not exist. NACHA requires explicit ACH authorisation before debiting an account.
**Size:** Small

**Description:** Implement Plaid Auth for instant bank account ownership verification plus a micro‑deposit fallback, enabling ACH debit authorisation for automatic customer payment collection.

**Depends on:** `finance/FINANCE‑SPEND‑BUDGETS.md → DB‑FIN‑006`
**Blocks:** `integrations/INTEGRATION‑ACCOUNTING.md → INT‑FIN‑001` (BILL vendor network – verified bank accounts required)
**Related Files:** `integrations/plaid/account‑verification.ts`, `micro‑deposits.ts`, `ach‑authorization.ts`, `lib/integrations/verification‑workflow/index.ts`

**Definition of Done**
- [ ] `verifyBankAccount(bankAccountId)` uses Plaid Auth (`/auth/get`) to instantly verify routing and account numbers
- [ ] Micro‑deposit fallback initiated when Plaid Auth is unavailable for the institution
- [ ] ACH debit authorisation captured as a stored mandate record with timestamp and IP
- [ ] Verification status (`pending | verified | failed`) stored on `payment_methods` table
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Real‑time bank account balance validation at payment time
- International bank account verification (IBAN, SWIFT)
- Bank account risk scoring (Plaid Signal – future phase)

**Rules to Follow**
- Use Plaid Auth product; fall back to same‑day micro‑deposits if institution does not support Auth
- Store ACH mandate: `{ bankAccountId, authorisedAt: ISO8601, ipAddress, userAgent }` in `ach_mandates` table
- Never auto‑initiate ACH debit without explicit mandate record; legal requirement (NACHA rules)
- Never store raw routing/account numbers; store only Plaid `account_id`

**Verification**
```bash
pnpm vitest run -- integrations/plaid/account‑verification.test.ts
pnpm vitest run -- integrations/plaid/micro‑deposits.test.ts
pnpm vitest run -- integrations/plaid/ach‑authorization.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Bank account verification is an AR infrastructure concern. ACH mandate is a domain concept with legal significance.
- TDD: Test both verification paths (instant Auth and micro‑deposit) with Plaid sandbox.
- BDD: “Given a customer’s bank account is unverified, When Plaid Auth completes successfully, Then the account status transitions to `verified` and ACH debits are enabled.”
- Deep Module: [N/A] – this is a thin integration layer.

---

### Subtasks
- [ ] INT‑AR‑002.0.25 (AGENT): Read Plaid Auth product documentation. *No action – pause.*
- [ ] INT‑AR‑002.0.5 (AGENT): Research Plaid Auth vs. Identity Verification, micro‑deposit best practices. *Document findings briefly.*
- [ ] INT‑AR‑002.1 (AGENT): Implement instant bank account verification using Plaid Auth.
  **File(s):** `integrations/plaid/account‑verification.ts`
  **Verification:** `pnpm vitest run -- account‑verification.test.ts`
- [ ] INT‑AR‑002.2 (AGENT): Implement micro‑deposit fallback service.
  **File(s):** `integrations/plaid/micro‑deposits.ts`
  **Verification:** `pnpm vitest run -- micro‑deposits.test.ts`
- [ ] INT‑AR‑002.3 (AGENT): Implement ACH mandate capture and storage.
  **File(s):** `integrations/plaid/ach‑authorization.ts`
  **Verification:** `pnpm vitest run -- ach‑authorization.test.ts`
- [ ] INT‑AR‑002.N (HUMAN): Final review – confirm mandate schema meets legal requirements, approve. **Verification:** Approved.

---
