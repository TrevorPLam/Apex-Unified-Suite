# TODO-P7-CALENDAR.md – Phase 7 Calendar Integrations

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This document contains calendar integration tasks for Google Calendar, Microsoft Graph Calendar, and Apple Calendar via CalDAV. All tasks follow the established patterns with explicit dependencies and verification commands.

---

## Phase 7 Calendar Integration Task Index

- [ ] INT‑CALENDAR‑001 – Google Calendar API Integration  
- [ ] INT‑CALENDAR‑002 – Microsoft Graph Calendar Integration  
- [ ] INT‑CALENDAR‑003 – Apple Calendar Integration  

---

## Calendar Integrations

### [ ] INT‑CALENDAR‑001: Google Calendar API Integration
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑006 (calendar integration service), DOMAIN‑004 (integration architecture).  
**Definition of Done:**
- Google Calendar API client implemented with OAuth 2.0 flow using PKCE.
- Real‑time two‑way sync between appointments and Google Calendar events.
- Conflict resolution with configurable priority rules.
- Rate limiting and quota management for Google API calls.
- Webhook support for instant Google Calendar updates.

**Out of Scope:**
- Google Meet integration (handled in INT-VIDEO-003)
- Google Drive integration (handled in INT-STORAGE-001)
- Google Workspace admin features and bulk operations

**Rules to Follow:**
- Google Calendar API v3: Use proper error handling with exponential backoff for rate limits
- OAuth Security: Implement PKCE flow with secure token storage and automatic refresh
- Sync Strategy: Use incremental sync with conflict resolution based on priority rules
- Quota Management: Respect Google API limits (10,000 queries/day per user) with intelligent batching
- Webhook Security: Verify webhook signatures and filter events to prevent unnecessary syncs

**Deep Module:**
- Google Calendar API integration with OAuth 2.0 PKCE authentication flow
- Real-time sync engine with conflict resolution and priority rules
- Webhook processing pipeline with event filtering and routing
- Rate limiting and quota management with intelligent backoff strategies

**Anti-Patterns:**
- Don't store access tokens in localStorage
- Don't ignore Google API rate limits
- Don't hardcode OAuth credentials
- Don't skip webhook signature verification

**Related Files:**
- `integrations/google/oauth.ts` – OAuth 2.0 PKCE implementation
- `integrations/google/calendar-client.ts` – Calendar API client
- `integrations/google/webhooks.ts` – Webhook handlers
- `lib/integrations/calendar-sync/` – Sync service layer

**Depends on:**
- API‑APPT‑006: Calendar integration service
- DOMAIN‑004: Integration architecture ADR

**Imports from/exports to:**
- Imports: Calendar sync service, OAuth utilities
- Exports: Google Calendar adapter, sync status

**Blocks:**
- INT‑CALENDAR‑002: Microsoft Graph Calendar Integration

**Verification:**
```bash
# Test OAuth flow
pnpm vitest run -- integrations/google/oauth.test.ts

# Test calendar operations
pnpm vitest run -- integrations/google/calendar-client.test.ts

# Test webhook processing
pnpm vitest run -- integrations/google/webhooks.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/google/calendar/test-oauth
```

**Subtasks:**
- [ ] INT‑CALENDAR‑001.1: Implement Google OAuth 2.0 flow with PKCE. (AGENT) – `integrations/google/oauth.ts`  
  **verification:** Unit tests pass for OAuth flow with test credentials.
- [ ] INT‑CALENDAR‑001.2: Implement Google Calendar API client with CRUD operations. (AGENT) – `integrations/google/calendar-client.ts`  
  **verification:** Unit tests pass for calendar event operations.
- [ ] INT‑CALENDAR‑001.3: Add webhook handler for Google Calendar push notifications. (AGENT) – `integrations/google/webhooks.ts`  
  **verification:** Unit tests pass for webhook event processing.
- [ ] INT‑CALENDAR‑001.4: Implement rate limiting and error handling for Google API. (AGENT)  
  **verification:** Unit tests pass for rate limiting and error scenarios.

### [ ] INT‑CALENDAR‑002: Microsoft Graph Calendar Integration
**Status:** ⏳ Not Started  
**Depends on:** INT‑CALENDAR‑001, API‑APPT‑006.  
**Definition of Done:**
- Microsoft Graph API client with OAuth 2.0 and Microsoft identity platform.
- Outlook calendar synchronization with event mapping.
- Microsoft‑specific features support (Teams meetings, Skype integration).
- Proper handling of Microsoft API rate limits and pagination.
- Webhook support for Outlook calendar changes.

**Out of Scope:**
- Microsoft Teams integration (handled in INT-VIDEO-002)
- OneDrive integration (handled in INT-STORAGE-001)

**Rules to Follow:**
- Microsoft Graph API v1.0: Use proper error handling with throttling response management
- Identity Platform: Implement OAuth 2.0 flow with proper token caching and refresh
- Pagination: Handle Microsoft API pagination correctly with @odata.nextLink
- Rate Limiting: Follow Microsoft API throttling with retry-after header handling
- Webhook Security: Validate Microsoft Graph webhooks with proper signature verification

**Deep Module:**
- Microsoft Graph API integration with identity platform authentication
- Outlook calendar sync engine with Teams meeting integration
- Delta query implementation for incremental sync efficiency
- Microsoft-specific event mapping and feature handling

**Anti-Patterns:**
- Don't ignore Microsoft API throttling responses
- Don't hardcode Microsoft app credentials
- Don't skip delta token handling
- Don't process webhooks without signature validation

**Related Files:**
- `integrations/microsoft/oauth.ts` – Microsoft identity OAuth
- `integrations/microsoft/calendar-client.ts` – Graph API client
- `integrations/microsoft/webhooks.ts` – Webhook handlers
- `lib/integrations/microsoft-sync/` – Microsoft sync service

**Depends on:**
- INT‑CALENDAR‑001: Google Calendar integration patterns
- API‑APPT‑006: Calendar integration service

**Imports from/exports to:**
- Imports: Calendar sync interface, OAuth utilities
- Exports: Microsoft Calendar adapter, Teams integration

**Blocks:**
- INT‑CALENDAR‑003: Apple Calendar Integration

**Verification:**
```bash
# Test Microsoft OAuth
pnpm vitest run -- integrations/microsoft/oauth.test.ts

# Test Graph API operations
pnpm vitest run -- integrations/microsoft/calendar-client.test.ts

# Test Microsoft webhooks
pnpm vitest run -- integrations/microsoft/webhooks.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/microsoft/calendar/test-oauth
```

**Subtasks:**
- [ ] INT‑CALENDAR‑002.1: Implement Microsoft identity OAuth flow. (AGENT) – `integrations/microsoft/oauth.ts`  
  **verification:** Unit tests pass for Microsoft OAuth flow with Azure AD test app.
- [ ] INT‑CALENDAR‑002.2: Implement Outlook calendar API client. (AGENT) – `integrations/microsoft/calendar-client.ts`  
  **verification:** Unit tests pass for Outlook calendar operations.
- [ ] INT‑CALENDAR‑002.3: Add Microsoft‑specific event mapping and features. (AGENT)  
  **verification:** Unit tests pass for Teams meetings and Microsoft features.
- [ ] INT‑CALENDAR‑002.4: Implement Microsoft Graph webhook handling. (AGENT) – `integrations/microsoft/webhooks.ts`  
  **verification:** Unit tests pass for webhook processing and sync triggering.

### [ ] INT‑CALENDAR‑003: Apple Calendar Integration
**Status:** ⏳ Not Started  
**Depends on:** INT‑CALENDAR‑002, API‑APPT‑006.  
**Definition of Done:**
- Apple Calendar integration via CalDAV protocol.
- iCloud authentication with app‑specific passwords.
- Event synchronization with proper timezone handling.
- Support for Apple‑specific calendar features (reminders, attachments).
- Conflict resolution for Apple Calendar limitations.

**Out of Scope:**
- iCloud Drive integration (handled elsewhere)
- Apple Reminders app integration

**Rules to Follow:**
- Use CalDAV protocol with proper RFC compliance
- Handle iCloud authentication securely
- Implement proper timezone conversion
- Work around Apple Calendar API limitations

**Advanced Code Patterns:**
- CalDAV client implementation with RFC 4791 compliance
- iCloud app-specific password authentication
- iCalendar data format parsing/generation
- Timezone-aware event handling

**Anti-Patterns:**
- Don't store iCloud passwords directly
- Don't ignore CalDAV multistatus responses
- Don't skip timezone conversion
- Don't assume Apple Calendar features match Google/Microsoft

**Related Files:**
- `integrations/apple/caldav-client.ts` – CalDAV protocol client
- `integrations/apple/auth.ts` – iCloud authentication
- `lib/integrations/apple-sync/` – Apple sync service
- `lib/integrations/timezone/` – Timezone handling utilities

**Depends on:**
- INT‑CALENDAR‑002: Microsoft Calendar integration patterns
- API‑APPT‑006: Calendar integration service

**Imports from/exports to:**
- Imports: Calendar sync interface, CalDAV utilities
- Exports: Apple Calendar adapter, timezone handlers

**Blocks:**
- INT‑VIDEO‑001: Zoom SDK Integration

**Verification:**
```bash
# Test CalDAV client
pnpm vitest run -- integrations/apple/caldav-client.test.ts

# Test iCloud authentication
pnpm vitest run -- integrations/apple/auth.test.ts

# Test Apple calendar sync
pnpm vitest run -- lib/integrations/apple-sync/sync.test.ts

# Manual verification
curl -X POST http://localhost:8081/integrations/apple/calendar/test-caldav
```

**Subtasks:**
- [ ] INT‑CALENDAR‑003.1: Implement CalDAV client for Apple Calendar. (AGENT) – `integrations/apple/caldav-client.ts`  
  **verification:** CalDAV operations work with iCloud test account.
- [ ] INT‑CALENDAR‑003.2: Add iCloud authentication with app‑specific passwords. (AGENT) – `integrations/apple/auth.ts`  
  **verification:** iCloud authentication works securely.
- [ ] INT‑CALENDAR‑003.3: Implement Apple Calendar event mapping and sync. (AGENT)  
  **verification:** Apple Calendar events sync correctly.
- [ ] INT‑CALENDAR‑003.4: Handle Apple‑specific features and limitations. (AGENT)  
  **verification:** Apple Calendar limitations are documented and handled.

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

*End of Phase 7 Calendar Integrations. Next: TODO-P7-VIDEO.md – Video Conferencing Integrations.*
