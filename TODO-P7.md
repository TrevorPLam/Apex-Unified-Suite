# Phase 7 – Advanced Integrations

*This phase focuses on implementing the core external integrations that make the scheduling system comparable to Calendly. These integrations enable real-time calendar synchronization, video conferencing, and payment processing capabilities.*

---

## Phase 7 Task Index

**Calendar Integrations** – INT-CALENDAR-001 through INT-CALENDAR-003  
**Video Conferencing Integrations** – INT-VIDEO-001 through INT-VIDEO-003  
**Payment Processing** – INT-PAYMENT-001 through INT-PAYMENT-002  
**AP/AR Integrations** – INT-AP-001 through INT-AR-003  
**Accounting Software Sync** – INT-QB-001, INT-XERO-001  
**Integration Testing** – INT-TEST-001

---

## Calendar Integrations

### INT-CALENDAR-001: Google Calendar API Integration
**Status:** ⏳ Not Started  
**Depends on:** API-APPT-006 (calendar integration service), DOMAIN-004 (integration architecture).  
**Definition of Done:**
- Google Calendar API client implemented with OAuth 2.0 flow using PKCE.
- Real-time two-way sync between appointments and Google Calendar events.
- Conflict resolution with configurable priority rules.
- Rate limiting and quota management for Google API calls.
- Webhook support for instant Google Calendar updates.

**Subtasks:**
- [ ] INT-CALENDAR-001.1: Implement Google OAuth 2.0 flow with PKCE. (AGENT) – `integrations/google/oauth.ts`  
  **verification:** OAuth flow works in development with test credentials.
- [ ] INT-CALENDAR-001.2: Implement Google Calendar API client with CRUD operations. (AGENT) – `integrations/google/calendar-client.ts`  
  **verification:** Calendar events can be created, updated, and deleted.
- [ ] INT-CALENDAR-001.3: Add webhook handler for Google Calendar push notifications. (AGENT) – `integrations/google/webhooks.ts`  
  **verification:** Webhook events are processed and trigger sync operations.
- [ ] INT-CALENDAR-001.4: Implement rate limiting and error handling for Google API. (AGENT)  
  **verification:** Rate limits are respected and errors are handled gracefully.
- **Depends on:** API-APPT-006.
- **Blocks:** INT-CALENDAR-002.

### INT-CALENDAR-002: Microsoft Graph Calendar Integration
**Status:** ⏳ Not Started  
**Depends on:** INT-CALENDAR-001, API-APPT-006.  
**Definition of Done:**
- Microsoft Graph API client with OAuth 2.0 and Microsoft identity platform.
- Outlook calendar synchronization with event mapping.
- Microsoft-specific features support (Teams meetings, Skype integration).
- Proper handling of Microsoft API rate limits and pagination.
- Webhook support for Outlook calendar changes.

**Subtasks:**
- [ ] INT-CALENDAR-002.1: Implement Microsoft identity OAuth flow. (AGENT) – `integrations/microsoft/oauth.ts`  
  **verification:** Microsoft OAuth flow works with Azure AD test app.
- [ ] INT-CALENDAR-002.2: Implement Outlook calendar API client. (AGENT) – `integrations/microsoft/calendar-client.ts`  
  **verification:** Outlook calendar operations work correctly.
- [ ] INT-CALENDAR-002.3: Add Microsoft-specific event mapping and features. (AGENT)  
  **verification:** Teams meetings and other Microsoft features integrate properly.
- [ ] INT-CALENDAR-002.4: Implement Microsoft Graph webhook handling. (AGENT) – `integrations/microsoft/webhooks.ts`  
  **verification:** Outlook calendar changes trigger sync operations.
- **Depends on:** INT-CALENDAR-001.
- **Blocks:** INT-CALENDAR-003.

### INT-CALENDAR-003: Apple Calendar Integration
**Status:** ⏳ Not Started  
**Depends on:** INT-CALENDAR-002, API-APPT-006.  
**Definition of Done:**
- Apple Calendar integration via CalDAV protocol.
- iCloud authentication with app-specific passwords.
- Event synchronization with proper timezone handling.
- Support for Apple-specific calendar features (reminders, attachments).
- Conflict resolution for Apple Calendar limitations.

**Subtasks:**
- [ ] INT-CALENDAR-003.1: Implement CalDAV client for Apple Calendar. (AGENT) – `integrations/apple/caldav-client.ts`  
  **verification:** CalDAV operations work with iCloud test account.
- [ ] INT-CALENDAR-003.2: Add iCloud authentication with app-specific passwords. (AGENT) – `integrations/apple/auth.ts`  
  **verification:** iCloud authentication works securely.
- [ ] INT-CALENDAR-003.3: Implement Apple Calendar event mapping and sync. (AGENT)  
  **verification:** Apple Calendar events sync correctly.
- [ ] INT-CALENDAR-003.4: Handle Apple-specific features and limitations. (AGENT)  
  **verification:** Apple Calendar limitations are documented and handled.
- **Depends on:** INT-CALENDAR-002.
- **Blocks:** INT-VIDEO-001.

---

## Video Conferencing Integrations

### INT-VIDEO-001: Zoom SDK Integration
**Status:** ⏳ Not Started  
**Depends on:** API-APPT-007 (video integration service), INT-CALENDAR-003.  
**Definition of Done:**
- Zoom SDK integration with OAuth 2.0 authentication.
- Meeting creation, update, and deletion via Zoom API.
- Real-time meeting status updates via Zoom webhooks.
- Recording management and download capabilities.
- Zoom-specific features (breakout rooms, polling, reactions).

**Subtasks:**
- [ ] INT-VIDEO-001.1: Implement Zoom OAuth and API client. (AGENT) – `integrations/zoom/client.ts`  
  **verification:** Zoom API operations work with test credentials.
- [ ] INT-VIDEO-001.2: Add meeting lifecycle management. (AGENT) – `integrations/zoom/meeting-manager.ts`  
  **verification:** Meeting creation, updates, and deletion work correctly.
- [ ] INT-VIDEO-001.3: Implement Zoom webhook handlers. (AGENT) – `integrations/zoom/webhooks.ts`  
  **verification:** Meeting status updates are processed in real-time.
- [ ] INT-VIDEO-001.4: Add recording management capabilities. (AGENT) – `integrations/zoom/recordings.ts`  
  **verification:** Recording download and management work properly.
- **Depends on:** INT-CALENDAR-003.
- **Blocks:** INT-VIDEO-002.

### INT-VIDEO-002: Microsoft Teams Integration
**Status:** ⏳ Not Started  
**Depends on:** INT-VIDEO-001, API-APPT-007.  
**Definition of Done:**
- Microsoft Teams integration via Graph API.
- Teams meeting creation and management.
- Integration with Outlook calendar for automatic Teams meetings.
- Teams-specific features (channel meetings, live events, recording policies).
- Proper handling of Microsoft Teams licensing and permissions.

**Subtasks:**
- [ ] INT-VIDEO-002.1: Implement Teams meeting creation via Graph API. (AGENT) – `integrations/microsoft/teams-client.ts`  
  **verification:** Teams meetings are created successfully.
- [ ] INT-VIDEO-002.2: Add Teams-specific features and capabilities. (AGENT)  
  **verification:** Channel meetings and other Teams features work.
- [ ] INT-VIDEO-002.3: Implement Teams recording management. (AGENT) – `integrations/microsoft/teams-recordings.ts`  
  **verification:** Teams recordings are managed properly.
- [ ] INT-VIDEO-002.4: Handle Teams licensing and permissions. (AGENT)  
  **verification:** Teams operations respect licensing limitations.
- **Depends on:** INT-VIDEO-001.
- **Blocks:** INT-VIDEO-003.

### INT-VIDEO-003: Google Meet Integration
**Status:** ⏳ Not Started  
**Depends on:** INT-VIDEO-002, API-APPT-007.  
**Definition of Done:**
- Google Meet integration via Google Calendar API.
- Automatic meeting link generation for appointments.
- Meet-specific features (live captions, recording, breakout rooms).
- Integration with Google Workspace for enhanced meeting features.
- Proper handling of Meet API limitations and quotas.

**Subtasks:**
- [ ] INT-VIDEO-003.1: Implement Google Meet meeting creation. (AGENT) – `integrations/google/meet-client.ts`  
  **verification:** Google Meet meetings are created successfully.
- [ ] INT-VIDEO-003.2: Add Meet-specific features and capabilities. (AGENT)  
  **verification:** Meet features like captions work properly.
- [ ] INT-VIDEO-003.3: Implement Meet recording management. (AGENT) – `integrations/google/meet-recordings.ts`  
  **verification:** Meet recordings are managed correctly.
- [ ] INT-VIDEO-003.4: Handle Meet API limitations and quotas. (AGENT)  
  **verification:** Meet operations respect API limits.
- **Depends on:** INT-VIDEO-002.
- **Blocks:** INT-PAYMENT-001.

---

## Storage Integrations

### INT-STORAGE-001: Advanced Storage Integrations
**Status:** ⏳ Not Started  
**Depends on:** DOC-STORAGE-001, DOMAIN-004.  
**Definition of Done:** Extended storage provider support:
- Amazon S3 integration as alternative to Cloudflare R2 with full feature parity
- Google Drive integration for document import/export with OAuth 2.0 flow
- OneDrive/SharePoint integration with Microsoft Graph API
- Local file system storage for development with configurable path
- Storage provider failover and redundancy with automatic switching
- Cross-provider file synchronization with conflict resolution
**Related Files:** `lib/integrations/storage/`, `StorageAdapterFactory.ts`

**Subtasks:**
- [ ] INT-STORAGE-001.1: Implement Amazon S3 storage adapter. (AGENT) – `lib/integrations/storage/s3-adapter.ts`  
  **verification:** S3 storage operations work with test credentials.
- [ ] INT-STORAGE-001.2: Implement Google Drive integration. (AGENT) – `lib/integrations/storage/gdrive-adapter.ts`  
  **verification:** Google Drive import/export works correctly.
- [ ] INT-STORAGE-001.3: Implement OneDrive/SharePoint integration. (AGENT) – `lib/integrations/storage/onedrive-adapter.ts`  
  **verification:** OneDrive operations work properly.
- [ ] INT-STORAGE-001.4: Add storage provider failover logic. (AGENT) – `lib/integrations/storage/failover-manager.ts`  
  **verification:** Failover works seamlessly between providers.
- [ ] INT-STORAGE-001.5: Implement cross-provider synchronization. (AGENT) – `lib/integrations/storage/sync-manager.ts`  
  **verification:** File synchronization works across providers.
- **Depends on:** DOC-STORAGE-001.
- **Blocks:** ENT-DOCS-001.

---

## Payment Processing

### INT-PAYMENT-001: Stripe Payment Integration
**Status:** ⏳ Not Started  
**Depends on:** API-APPT-008 (payment service), INT-VIDEO-003.  
**Definition of Done:**
- Stripe payment processing with PCI compliance.
- Payment intent creation and confirmation workflows.
- Subscription management for recurring appointments.
- Refund processing and dispute handling.
- Stripe webhook integration for real-time payment updates.

**Subtasks:**
- [ ] INT-PAYMENT-001.1: Implement Stripe payment intent workflows. (AGENT) – `integrations/stripe/payment-intents.ts`  
  **verification:** Payment intents are created and confirmed correctly.
- [ ] INT-PAYMENT-001.2: Add subscription management capabilities. (AGENT) – `integrations/stripe/subscriptions.ts`  
  **verification:** Recurring appointments work with subscriptions.
- [ ] INT-PAYMENT-001.3: Implement refund and dispute handling. (AGENT) – `integrations/stripe/refunds.ts`  
  **verification:** Refunds are processed correctly.
- [ ] INT-PAYMENT-001.4: Add Stripe webhook handlers. (AGENT) – `integrations/stripe/webhooks.ts`  
  **verification:** Payment status updates are processed in real-time.
- **Depends on:** INT-VIDEO-003.
- **Blocks:** INT-PAYMENT-002.

### INT-PAYMENT-002: Payment Testing & Compliance
**Status:** ⏳ Not Started  
**Depends on:** INT-PAYMENT-001.  
**Definition of Done:**
- Comprehensive test suite for payment workflows.
- PCI compliance validation and security audits.
- Test environment with Stripe test mode.
- Payment error handling and edge case testing.
- Performance testing for payment processing.

**Subtasks:**
- [ ] INT-PAYMENT-002.1: Create comprehensive payment test suite. (AGENT) – `tests/integrations/payments/`  
  **verification:** All payment scenarios are tested.
- [ ] INT-PAYMENT-002.2: Implement PCI compliance validation. (AGENT) – `security/pci-compliance.ts`  
  **verification:** PCI compliance requirements are met.
- [ ] INT-PAYMENT-002.3: Add payment error handling tests. (AGENT)  
  **verification:** Payment errors are handled correctly.
- [ ] INT-PAYMENT-002.4: Performance testing for payment processing. (AGENT)  
  **verification:** Payment processing meets performance requirements.
- **Depends on:** INT-PAYMENT-001.
- **Blocks:** INT-TEST-001.

---

## AP/AR Payment Integrations

### INT-AP-001: Stripe ACH/Wire Integration
**Status:** ⏳ Not Started  
**Depends on:** PAY‑EXEC‑001 (payment processor stub), API‑AP‑014 (bill payments).  
**Definition of Done:**
- Stripe Treasury/Connect integration for ACH credits (outgoing payments).
- `initiateStripeACHPayment(billPaymentId, bankAccountId, amount)` – creates Stripe Transfer.
- `handleStripeWebhook(event)` – processes `transfer.created`, `transfer.paid`, `transfer.failed` events.
- Idempotency through Stripe idempotency keys.
- Transfer reconciliation with bill payment records.

### INT-AP-002: Plaid Bank Feed Integration
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑005 (bank accounts), API‑AP‑014.  
**Definition of Done:**
- Plaid Link integration for bank account connection (frontend).
- `syncBankTransactions(bankAccountId, startDate, endDate)` – pulls transactions via Plaid.
- Automatic payment reconciliation: match bank transactions to bill payments.
- Bank balance sync for cash flow forecasting.
- Webhook handling for new transaction notifications.

### INT-AR-001: Stripe Payment Links (Customer Payments)
**Status:** ⏳ Not Started  
**Depends on:** API‑AR‑012 (customer payments).  
**Definition of Done:**
- `createPaymentLink(invoiceId)` – generates Stripe Payment Link for invoice.
- Payment link webhook handling for `checkout.session.completed`.
- Automatic application of Stripe payments to AR invoices.
- Customer-facing payment portal with Stripe Elements (embedded checkout).

### INT-AR-002: Plaid Bank Account Verification
**Status:** ⏳ Not Started  
**Depends on:** DB‑FIN‑006 (payment methods).  
**Definition of Done:**
- Plaid Auth integration for bank account ownership verification.
- Micro-deposit verification fallback.
- ACH debit authorization for automatic customer payments (if enabled).

---

## Accounting Software Integrations

### INT-QB-001: QuickBooks Online Full Integration
**Status:** ⏳ Not Started  
**Depends on:** INT‑QB‑001 (stub), API‑AP‑008, API‑AR‑008.  
**Definition of Done:**
- QuickBooks OAuth 2.0 flow for firm authorization.
- `pushVendorToQB(vendorId)` – creates/updates vendor in QBO.
- `pushBillToQB(billId)` – creates bill in QBO Accounts Payable.
- `pushInvoiceToQB(invoiceId)` – creates invoice in QBO Accounts Receivable.
- `pullPaymentsFromQB()` – syncs customer payments from QBO.
- Bidirectional sync with conflict resolution (last-write-wins configurable).
- Sync status dashboard showing last sync time, pending items, errors.

### INT-XERO-001: Xero Integration
**Status:** ⏳ Not Started  
**Depends on:** INT‑QB‑001 (patterns established).  
**Definition of Done:**
- Xero OAuth 2.0 flow.
- Vendor, bill, invoice, and payment sync (similar to QBO).
- Xero-specific chart of accounts mapping.
- Contact sync (vendors ↔ Xero contacts, customers ↔ Xero contacts).

---

## Integration Testing

### INT-TEST-001: End-to-End Integration Testing
**Status:** ⏳ Not Started  
**Depends on:** All integration tasks (INT-CALENDAR-*, INT-VIDEO-*, INT-PAYMENT-*).  
**Definition of Done:**
- End-to-end test scenarios covering all integrations.
- Integration test environment with mock external services.
- Automated testing of integration workflows.
- Performance testing for all integrations.
- Integration monitoring and alerting setup.

**Subtasks:**
- [ ] INT-TEST-001.1: Create integration test environment. (AGENT) – `tests/integrations/setup/`  
  **verification:** Test environment works with all integrations.
- [ ] INT-TEST-001.2: Implement end-to-end integration tests. (AGENT) – `tests/integrations/e2e/`  
  **verification:** All integration workflows are tested.
- [ ] INT-TEST-001.3: Add integration performance tests. (AGENT) – `tests/integrations/performance/`  
  **verification:** Integration performance meets requirements.
- [ ] INT-TEST-001.4: Set up integration monitoring. (AGENT) – `monitoring/integrations/`  
  **verification:** Integration health is monitored properly.
- **Depends on:** All integration tasks.
- **Blocks:** None.

---

*End of Phase 7. Next: Phase 8 – Enterprise Features.*
