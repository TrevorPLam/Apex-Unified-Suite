# TODO-P7-APAR.md – Phase 7 AP/AR Payment & Bank Integrations

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This document contains AP/AR payment and bank integration tasks including Stripe ACH, Plaid integration, Bill.com vendor network, multi-currency payments, and NACHA file generation. All tasks follow the established patterns with explicit dependencies and verification commands.

---

## Phase 7 AP/AR Integration Task Index

**AP/AR Payment & Bank Integrations**
- [ ] INT‑AP‑001 – Stripe ACH/Wire Integration  
- [ ] INT‑AP‑002 – Plaid Bank Feed Integration  
- [ ] INT‑AR‑001 – Stripe Payment Links (Customer Payments)  
- [ ] INT‑AR‑002 – Plaid Bank Account Verification  
- [ ] INT‑FIN‑001 – Bill.com Vendor Network Integration  
- [ ] INT‑FIN‑002 – Multi‑Currency Payment Execution  
- [ ] INT‑FIN‑003 – NACHA ACH File Generation  

---

## AP/AR Payment & Bank Integrations

### [ ] INT‑AP‑001: Stripe ACH/Wire Integration
**Status:** ⏳ Not Started  
**Depends on:** PAY‑EXEC‑001 (payment processor stub), API‑AP‑014 (bill payments).  
**Definition of Done:**
- Stripe Treasury/Connect integration for ACH credits (outgoing payments).
- `initiateStripeACHPayment(billPaymentId, bankAccountId, amount)` – creates Stripe Transfer.
- `handleStripeWebhook(event)` – processes `transfer.created`, `transfer.paid`, `transfer.failed` events.
- Idempotency through Stripe idempotency keys.
- Transfer reconciliation with bill payment records.

**Out of Scope:**
- Stripe ACH debits (customer collections)
- International wire transfers
- Real-time payments (RTP)

**Rules to Follow:**
- Stripe Treasury API: Use proper error handling with exponential backoff for rate limits
- Idempotency: Implement Stripe idempotency keys for all payment operations to prevent duplicates
- Webhook Security: Verify Stripe webhook signatures using their official library
- NACHA Compliance: Follow NACHA Operating Rules for ACH formatting and timing
- Error Handling: Map Stripe error codes to domain-specific error responses

**Deep Module:**
- Stripe Treasury integration as payment processing deep module with clear separation of concerns
- ACH payment lifecycle management with proper abstraction layers
- Webhook processing pipeline with event sourcing patterns
- Payment reconciliation service with domain-specific business logic

**Anti-Patterns:**
- Don't skip webhook signature verification
- Don't ignore Stripe transfer status updates
- Don't process payments without proper reconciliation
- Don't skip idempotency handling

**Related Files:**
- `integrations/stripe/ach-payments.ts` – ACH payment processing
- `integrations/stripe/ach-webhooks.ts` – ACH webhook handlers
- `lib/integrations/ach-reconciliation/` – Reconciliation service

**Depends on:**
- PAY‑EXEC‑001: Payment processor stub
- API‑AP‑014: Bill payments API

**Imports from/exports to:**
- Imports: Payment interface, webhook utilities
- Exports: ACH payment processor, webhook handlers

**Blocks:**
- INT‑AP‑002: Plaid Bank Feed Integration

**Verification:**
```bash
# Test ACH payment processing
pnpm vitest run -- integrations/stripe/ach-payments.test.ts

# Test ACH webhooks
pnpm vitest run -- integrations/stripe/ach-webhooks.test.ts

# Test reconciliation
pnpm vitest run -- lib/integrations/ach-reconciliation/reconciliation.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/stripe/ach/test-payment
```

### [ ] INT‑AP‑002: Plaid Bank Feed Integration
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑005 (bank accounts), API‑AP‑014.  
**Definition of Done:**
- Plaid Link integration for bank account connection (frontend).
- `syncBankTransactions(bankAccountId, startDate, endDate)` – pulls transactions via Plaid.
- Automatic payment reconciliation: match bank transactions to bill payments.
- Bank balance sync for cash flow forecasting.
- Webhook handling for new transaction notifications.

**Out of Scope:**
- Plaid Investments integration
- Plaid Credit integration
- Bank account aggregation for personal use

**Rules to Follow:**
- Plaid API: Use proper error handling with webhook signature verification
- Link Tokens: Generate secure, short-lived Plaid Link tokens for bank connections
- Transaction Sync: Implement incremental sync with proper change detection
- Bank Reconciliation: Use fuzzy matching algorithms for transaction-to-payment matching
- Data Security: Encrypt Plaid access tokens at rest and rotate regularly

**Deep Module:**
- Plaid bank feed integration with transaction categorization deep module
- Bank account verification workflow with multi-step authentication flows
- Transaction matching algorithms with machine learning categorization
- Balance synchronization service with real-time updates

**Anti-Patterns:**
- Don't store Plaid access tokens insecurely
- Don't skip transaction reconciliation
- Don't ignore Plaid webhook events
- Don't process bank data without validation

**Related Files:**
- `integrations/plaid/bank-feed.ts` – Bank transaction sync
- `integrations/plaid/link-client.ts` – Plaid Link integration
- `integrations/plaid/webhooks.ts` – Plaid webhook handlers
- `lib/integrations/bank-reconciliation/` – Reconciliation service

**Depends on:**
- DB‑FIN‑005: Bank accounts database
- API‑AP‑014: Bill payments API

**Imports from/exports to:**
- Imports: Bank interface, Plaid utilities
- Exports: Bank feed sync, reconciliation service

**Blocks:**
- INT‑AR‑001: Stripe Payment Links

**Verification:**
```bash
# Test bank feed sync
pnpm vitest run -- integrations/plaid/bank-feed.test.ts

# Test Plaid Link
pnpm vitest run -- integrations/plaid/link-client.test.ts

# Test bank reconciliation
pnpm vitest run -- lib/integrations/bank-reconciliation/reconciliation.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/plaid/test-sync
```

### [ ] INT‑AR‑001: Stripe Payment Links (Customer Payments)
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑012 (customer payments).  
**Definition of Done:**
- `createPaymentLink(invoiceId)` – generates Stripe Payment Link for invoice.
- Payment link webhook handling for `checkout.session.completed`.
- Automatic application of Stripe payments to AR invoices.
- Customer‑facing payment portal with Stripe Elements (embedded checkout).

**Out of Scope:**
- Stripe Checkout Session customization
- Customer payment method storage
- Recurring payment links

**Rules to Follow:**
- Use Stripe Payment Links API with proper error handling
- Implement secure payment link generation
- Handle Stripe webhook events
- Follow PCI compliance for payment portal

**Advanced Code Patterns:**
- Payment link lifecycle management
- Stripe Elements integration
- Webhook event processing
- Payment application algorithms

**Anti-Patterns:**
- Don't skip webhook signature verification
- Don't store payment details insecurely
- Don't ignore payment link expiration
- Don't skip payment reconciliation

**Related Files:**
- `integrations/stripe/payment-links.ts` – Payment link generation
- `integrations/stripe/payment-portal.ts` – Customer portal
- `integrations/stripe/payment-webhooks.ts` – Payment webhooks
- `lib/integrations/payment-application/` – Payment application service

**Depends on:**
- API‑AR‑012: Customer payments API

**Imports from/exports to:**
- Imports: Payment interface, Stripe utilities
- Exports: Payment link generator, payment portal

**Blocks:**
- INT‑AR‑002: Plaid Bank Account Verification

**Verification:**
```bash
# Test payment links
pnpm vitest run -- integrations/stripe/payment-links.test.ts

# Test payment portal
pnpm vitest run -- integrations/stripe/payment-portal.test.ts

# Test payment webhooks
pnpm vitest run -- integrations/stripe/payment-webhooks.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/stripe/test-payment-link
```

### [ ] INT‑AR‑002: Plaid Bank Account Verification
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑006 (payment methods).  
**Definition of Done:**
- Plaid Auth integration for bank account ownership verification.
- Micro‑deposit verification fallback.
- ACH debit authorization for automatic customer payments (if enabled).

**Out of Scope:**
- Real-time bank account validation
- International bank account verification
- Bank account risk scoring

**Rules to Follow:**
- Use Plaid Auth API with proper error handling
- Implement secure micro-deposit workflows
- Handle bank account authorization properly
- Follow ACH compliance requirements

**Advanced Code Patterns:**
- Bank account verification workflows
- Micro-deposit processing
- ACH authorization management
- Verification status tracking

**Anti-Patterns:**
- Don't store bank credentials insecurely
- Don't skip verification status updates
- Don't ignore Plaid Auth errors
- Don't process ACH without proper authorization

**Related Files:**
- `integrations/plaid/account-verification.ts` – Bank verification
- `integrations/plaid/micro-deposits.ts` – Micro-deposit processing
- `integrations/plaid/ach-authorization.ts` – ACH authorization
- `lib/integrations/verification-workflow/` – Verification service

**Depends on:**
- DB‑FIN‑006: Payment methods database

**Imports from/exports to:**
- Imports: Verification interface, Plaid utilities
- Exports: Account verification service, ACH authorization

**Blocks:**
- INT‑FIN‑001: Bill.com Vendor Network Integration

**Verification:**
```bash
# Test account verification
pnpm vitest run -- integrations/plaid/account-verification.test.ts

# Test micro-deposits
pnpm vitest run -- integrations/plaid/micro-deposits.test.ts

# Test ACH authorization
pnpm vitest run -- integrations/plaid/ach-authorization.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/plaid/test-verification
```

### [ ] INT‑FIN‑001: Bill.com Vendor Network Integration
**Status:** ⏳ Not Started  
**Depends on:** INT‑AP‑001, API‑AP‑004 (vendors).  
**Definition of Done:**
- Connect to the Bill.com vendor network API to search, invite, and sync vendors.
- Enable sending and receiving payments to/from network‑connected vendors.
- Sync vendor details (name, address, payment preferences) bidirectionally with the internal vendor database.
- Handle network‑specific status updates (invited, connected, declined).
- Map network vendor IDs to internal vendor records.

**Rules to Follow:**
- Bill.com API: Use OAuth 2.0 with proper token management and refresh flows
- Vendor Sync: Implement bidirectional sync with conflict resolution for data conflicts
- Network Payments: Handle vendor payment preferences and network-specific status updates
- Rate Limiting: Respect Bill.com API limits (1000 requests/hour per app)
- Error Mapping: Map Bill.com error codes to domain-specific business errors

**Subtasks:**
- [ ] INT‑FIN‑001.1: Implement Bill.com vendor network API client with authentication. (AGENT) – `integrations/bill‑com/vendor‑network‑client.ts`  
  **verification:** Client can search and retrieve vendor data.
- [ ] INT‑FIN‑001.2: Build vendor sync service (import/update from network). (AGENT) – `integrations/bill‑com/vendor‑sync‑service.ts`  
  **verification:** Vendors from network appear in internal database with proper mapping.
- [ ] INT‑FIN‑001.3: Add payment sending/receiving through network‑connected vendors. (AGENT)  
  **verification:** Payment created for a network vendor triggers external payment and updates internal status.
- [ ] INT‑FIN‑001.4: Write integration tests for vendor sync and payment flow. (AGENT)  
  **verification:** Tests pass against sandbox environment.

**Related Files:**
- `integrations/bill-com/vendor-network-client.ts` – Bill.com API client
- `integrations/bill-com/vendor-sync-service.ts` – Vendor sync service
- `integrations/bill-com/network-payments.ts` – Network payment processing
- `lib/integrations/bill-com-sync/` – Sync service layer

**Verification:**
```bash
# Test Bill.com client
pnpm vitest run -- integrations/bill-com/vendor-network-client.test.ts

# Test vendor sync
pnpm vitest run -- integrations/bill-com/vendor-sync-service.test.ts

# Test network payments
pnpm vitest run -- integrations/bill-com/network-payments.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/bill-com/test-sync
```

### [ ] INT‑FIN‑002: Multi‑Currency Payment Execution
**Status:** ⏳ Not Started  
**Depends on:** API‑FIN‑018 (payment run API), INT‑AP‑001.  
**Definition of Done:**
- Execute international wire transfers in the vendor's local currency using a provider (e.g., Wise, OFX, or Stripe multi‑currency).
- Capture exchange rates and transaction fees at the time of payment.
- Record payment in both the original currency and the organisation's base currency with proper conversion.
- Support multiple destination countries and currency codes.
- Provide payment tracking and reconciliation for international payments.

**Subtasks:**
- [ ] INT‑FIN‑002.1: Implement foreign exchange rate provider integration (e.g., Wise or Stripe FX API). (AGENT) – `integrations/fx/fx‑provider.ts`  
  **verification:** Exchange rates fetched correctly and cached.
- [ ] INT‑FIN‑002.2: Build multi‑currency wire transfer service that uses payment runs. (AGENT) – `integrations/payments/international‑wire‑service.ts`  
  **verification:** Wire payment created with correct converted amounts and fees.
- [ ] INT‑FIN‑002.3: Add reconciliation reporting showing base and foreign amounts. (AGENT)  
  **verification:** Payment detail displays both original and converted amounts.
- [ ] INT‑FIN‑002.4: Write integration tests with mock FX provider. (AGENT)  
  **verification:** International payment flow works end‑to‑end.

**Related Files:**
- `integrations/fx/fx-provider.ts` – Foreign exchange provider
- `integrations/payments/international-wire-service.ts` – International payment service
- `integrations/fx/exchange-rate-cache.ts` – Exchange rate caching
- `lib/integrations/international-payments/` – Payment service layer

**Verification:**
```bash
# Test FX provider
pnpm vitest run -- integrations/fx/fx-provider.test.ts

# Test international payments
pnpm vitest run -- integrations/payments/international-wire-service.test.ts

# Test exchange rate cache
pnpm vitest run -- integrations/fx/exchange-rate-cache.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/fx/test-rates
```

### [ ] INT‑FIN‑003: NACHA ACH File Generation
**Status:** ⏳ Not Started  
**Depends on:** INT‑AP‑001, API‑FIN‑024 (payment run API).  
**Definition of Done:**
- Generate NACHA‑formatted ACH files for batch payment submissions to banks.
- Support both ACH credits (outgoing vendor payments) and ACH debits (customer collections).
- Validate all entries against NACHA standards (routing numbers, account numbers, amounts).
- Provide a preview of the ACH file before final generation.
- Include settlement date, batch control totals, and required headers/footers.
- Allow download of the generated file for upload to the bank portal.

**Subtasks:**
- [ ] INT‑FIN‑003.1: Implement NACHA file generator library. (AGENT) – `lib/payments/nacha‑generator.ts`  
  **verification:** Generated file passes basic NACHA structure validation.
- [ ] INT‑FIN‑003.2: Integrate NACHA generation into payment run completion flow. (AGENT)  
  **verification:** Completing a payment run with ACH method yields a downloadable NACHA file.
- [ ] INT‑FIN‑003.3: Add validation and error reporting for invalid entries. (AGENT)  
  **verification:** Entries with invalid routing numbers are flagged before generation.
- [ ] INT‑FIN‑003.4: Write unit tests for NACHA file format correctness. (AGENT)  
  **verification:** Tests verify file structure, control totals, and sample data.

**Related Files:**
- `lib/payments/nacha-generator.ts` – NACHA file generator
- `lib/payments/nacha-validator.ts` – NACHA validation rules
- `lib/payments/nacha-formats.ts` – NACHA record formats
- `lib/integrations/nacha-processing/` – NACHA processing service

**Verification:**
```bash
# Test NACHA generator
pnpm vitest run -- lib/payments/nacha-generator.test.ts

# Test NACHA validator
pnpm vitest run -- lib/payments/nacha-validator.test.ts

# Test NACHA formats
pnpm vitest run -- lib/payments/nacha-formats.test.ts

# Manual verification
curl -X POST http://localhost:8081/payments/nacha/test-generation
```

---

## Integration Rules Framework

To avoid rules duplication across all integration tasks, the following common rules framework applies:

### **Common Integration Rules**
- **Authentication**: Use OAuth 2.0 with proper token management and refresh flows
- **Error Handling**: Implement exponential backoff for rate limits and network errors
- **Security**: Verify webhook signatures and store credentials securely
- **Rate Limiting**: Respect provider-specific API limits with intelligent throttling
- **Testing**: Use provider test environments with comprehensive unit test coverage
- **Logging**: Implement structured logging with security-sensitive data redaction

### **Provider-Specific Rules**
Each integration task should only include rules specific to that provider, not duplicate the common rules above.

---

*End of Phase 7 AP/AR Payment & Bank Integrations. Next: TODO-P7-ACCOUNTING.md – Accounting Software Integrations.*
