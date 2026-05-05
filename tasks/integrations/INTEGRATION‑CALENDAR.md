# tasks/integrations/INTEGRATION‑CALENDAR.md – Calendar Sync (Google, Microsoft, Apple)

This file covers two‑way calendar synchronization between Apex appointments and external calendar providers: Google Calendar, Microsoft Graph Calendar (Outlook), and Apple Calendar via CalDAV. All integrations implement a common `CalendarPort` interface to keep the Appointments domain provider‑agnostic. These tasks are part of Phase 7 and require provider OAuth credentials provisioned by a human operator.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] INT‑CALENDAR‑001: Google Calendar API Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Google Calendar integration exists. As of May 2026, Google Calendar API v3 supports OAuth 2.0 with PKCE, incremental sync via `syncToken`, and push notifications via webhooks. Automatic Meet link generation is built into the Calendar API.
**Size:** Medium

**Description:** Implement a full two‑way sync between Apex appointments and Google Calendar, including OAuth 2.0 PKCE flow, create/update/delete calendar events, incremental sync, webhook‑based real‑time updates, and automatic Google Meet link generation.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`, `foundation/ARCHITECTURE.md → DOMAIN‑004`
**Blocks:** `integrations/INTEGRATION‑CALENDAR.md → INT‑CALENDAR‑002`
**Related Files:** `integrations/google/oauth.ts`, `integrations/google/calendar‑client.ts`, `integrations/google/webhooks.ts`, `lib/integrations/calendar‑sync/google‑sync.ts`

**Definition of Done**
- [ ] OAuth 2.0 PKCE flow completed; tokens encrypted at rest and automatically refreshed when `expires_in` < 60 s
- [ ] `createEvent(appointmentId)` → creates a Google Calendar event with correct start/end times, timezone, location, and Meet link
- [ ] `updateEvent(appointmentId)` → updates the linked Google Calendar event; only changed fields sent (PATCH semantics)
- [ ] `deleteEvent(appointmentId)` → deletes the linked Google Calendar event
- [ ] Incremental sync: on demand or scheduled, uses `syncToken` to receive only added/updated/deleted events since last sync
- [ ] Webhook handler listens for Google Calendar push notifications; verifies `X‑Goog‑Channel‑Token` and resource state; triggers re‑sync
- [ ] Rate limiting: tracks daily quota usage per user, with backoff on `403 rateLimitExceeded`
- [ ] Unit tests pass using recorded fixture data (Google API responses)
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Google Workspace admin features (domain‑wide delegation, shared calendars)
- Importing historical events beyond the incremental sync window
- Google Tasks / Google Keep integration

**Rules to Follow**
- Use the `googleapis` Node.js client (v130+); do not hand‑roll REST calls
- Always use PKCE for OAuth 2.0; never store client secret in the frontend
- Set `conferenceDataVersion: 1` in event creation to auto‑generate Meet links
- Webhook channels must be renewed every 24 hours (Google Calendar webhook TTL)
- Incremental sync with `syncToken` must handle token expiration gracefully (fall back to full sync)

**Verification**
```bash
pnpm vitest run -- integrations/google/oauth.test.ts
pnpm vitest run -- integrations/google/calendar‑client.test.ts
pnpm vitest run -- integrations/google/webhooks.test.ts
pnpm vitest run -- lib/integrations/calendar‑sync/google‑sync.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Google Calendar is an external system in the Appointments bounded context. `GoogleCalendarAdapter` is an anti‑corruption layer implementing `CalendarPort`.
- TDD: Record Google API responses as fixtures via `nock`; all tests must pass without a live Google API connection.
- BDD: “As a service provider, my confirmed appointments appear automatically in my Google Calendar with a Google Meet link, and changes in either system stay in sync.”
- Deep Module: `GoogleSyncService.sync(userId)` hides OAuth refresh, syncToken management, webhook renewal, and conflict resolution.

---

### Subtasks
- [ ] INT‑CALENDAR‑001.0.25 (AGENT): Read the entire task and Google Calendar API v3 documentation. *No action – pause.*
- [ ] INT‑CALENDAR‑001.0.5 (AGENT): Research Google Calendar API v3 incremental sync, webhook channel lifecycle, and `googleapis` client v130+ OAuth PKCE patterns. *Document findings briefly.*
- [ ] INT‑CALENDAR‑001.1 (AGENT): Implement OAuth 2.0 PKCE flow and encrypted token storage.
  **File(s):** `integrations/google/oauth.ts`
  **Verification:** `pnpm vitest run -- oauth.test.ts`
- [ ] INT‑CALENDAR‑001.2 (AGENT): Implement calendar event CRUD (create, update, delete) with automatic Meet link generation.
  **File(s):** `integrations/google/calendar‑client.ts`
  **Verification:** `pnpm vitest run -- calendar‑client.test.ts`
- [ ] INT‑CALENDAR‑001.3 (AGENT): Implement webhook handler with channel verification and renewal.
  **File(s):** `integrations/google/webhooks.ts`
  **Verification:** `pnpm vitest run -- webhooks.test.ts`
- [ ] INT‑CALENDAR‑001.4 (AGENT): Implement incremental sync service with `syncToken` management.
  **File(s):** `lib/integrations/calendar‑sync/google‑sync.ts`
  **Verification:** `pnpm vitest run -- google‑sync.test.ts`
- [ ] INT‑CALENDAR‑001.5 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑CALENDAR‑001.N (HUMAN): Final review – verify OAuth flow and event sync end‑to‑end with a Google test account, approve. **Verification:** Approved.

---

## [ ] INT‑CALENDAR‑002: Microsoft Graph Calendar Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Microsoft Graph Calendar integration exists. As of May 2026, Microsoft Graph v1.0 provides calendar event CRUD, delta queries for incremental sync, and webhook subscriptions. Teams meeting integration is built into event creation via `isOnlineMeeting: true`.
**Size:** Medium

**Description:** Implement a full two‑way sync between Apex appointments and Microsoft 365/Outlook Calendar, including OAuth 2.0 flow, event CRUD, delta‑based incremental sync, webhook‑based real‑time updates, and automatic Teams meeting generation.

**Depends on:** `integrations/INTEGRATION‑CALENDAR.md → INT‑CALENDAR‑001`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`
**Blocks:** `integrations/INTEGRATION‑CALENDAR.md → INT‑CALENDAR‑003`
**Related Files:** `integrations/microsoft/oauth.ts`, `integrations/microsoft/calendar‑client.ts`, `integrations/microsoft/webhooks.ts`, `lib/integrations/calendar‑sync/ms‑graph‑sync.ts`

**Definition of Done**
- [ ] OAuth 2.0 flow (authorization code with PKCE) completed using Microsoft identity platform; tokens encrypted at rest
- [ ] `createEvent(appointmentId)` → creates an event in the user’s primary calendar with `isOnlineMeeting: true` for auto‑Teams link
- [ ] `updateEvent(appointmentId)` → updates the linked event; only changed fields sent
- [ ] `deleteEvent(appointmentId)` → deletes the linked event
- [ ] Delta sync: uses `@odata.deltaLink` to fetch only changes since last sync; falls back to full sync if delta token expires
- [ ] Webhook handler: processes `subscription` notifications; validates `clientState`; triggers re‑sync
- [ ] Webhook subscriptions managed: created on connect, renewed before expiry (max 3‑day lifecycle), removed on disconnect
- [ ] Rate limiting: respects Microsoft Graph throttling (10,000 requests per 10‑minute window); backs off on `HTTP 429`
- [ ] Unit tests pass using recorded fixture data
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Use `@microsoft/microsoft‑graph‑client` v3+ with `@azure/identity` for authentication
- Delta queries: store `@odata.deltaLink` per user; on `resyncRequired`, discard token and perform full sync
- Webhook subscriptions: lifespan max 3 days for calendar; renew via background job every 2 days
- Set `isOnlineMeeting: true` and `onlineMeetingProvider: 'teamsForBusiness'` for auto‑Teams links

**Verification**
```bash
pnpm vitest run -- integrations/microsoft/oauth.test.ts
pnpm vitest run -- integrations/microsoft/calendar‑client.test.ts
pnpm vitest run -- integrations/microsoft/webhooks.test.ts
pnpm vitest run -- lib/integrations/calendar‑sync/ms‑graph‑sync.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Microsoft Graph Calendar is an external system in the Appointments bounded context. `MicrosoftGraphCalendarAdapter` implements `CalendarPort`.
- TDD: Use recorded fixture data for all tests; no live API calls.
- BDD: “As a service provider, my appointments sync to my Outlook calendar with Teams meeting links, and changes in either system are reflected automatically.”
- Deep Module: `MSGraphSyncService.sync(userId)` hides OAuth refresh, delta token management, and webhook subscription lifecycle.

---

### Subtasks
- [ ] INT‑CALENDAR‑002.0.25 (AGENT): Read the entire task and Microsoft Graph Calendar API documentation. *No action – pause.*
- [ ] INT‑CALENDAR‑002.0.5 (AGENT): Research Microsoft Graph v1.0 delta queries, webhook subscription lifecycle, and `@microsoft/microsoft‑graph‑client` v3+ authentication patterns. *Document findings briefly.*
- [ ] INT‑CALENDAR‑002.1 (AGENT): Implement OAuth 2.0 flow and encrypted token storage.
  **File(s):** `integrations/microsoft/oauth.ts`
  **Verification:** `pnpm vitest run -- oauth.test.ts`
- [ ] INT‑CALENDAR‑002.2 (AGENT): Implement calendar event CRUD with automatic Teams meeting generation.
  **File(s):** `integrations/microsoft/calendar‑client.ts`
  **Verification:** `pnpm vitest run -- calendar‑client.test.ts`
- [ ] INT‑CALENDAR‑002.3 (AGENT): Implement webhook handler with `clientState` verification and subscription management.
  **File(s):** `integrations/microsoft/webhooks.ts`
  **Verification:** `pnpm vitest run -- webhooks.test.ts`
- [ ] INT‑CALENDAR‑002.4 (AGENT): Implement delta sync service with delta token management.
  **File(s):** `lib/integrations/calendar‑sync/ms‑graph‑sync.ts`
  **Verification:** `pnpm vitest run -- ms‑graph‑sync.test.ts`
- [ ] INT‑CALENDAR‑002.5 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑CALENDAR‑002.N (HUMAN): Final review – verify OAuth flow and event sync with a Microsoft 365 test account, approve. **Verification:** Approved.

---

## [ ] INT‑CALENDAR‑003: Apple Calendar (CalDAV) Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Apple Calendar integration exists. As of May 2026, Apple Calendar supports CalDAV (RFC 4791) for event CRUD, OAuth 2.0 for iCloud, and app‑specific passwords as a legacy fallback. No push notifications – polling is required.
**Size:** Medium

**Description:** Implement a two‑way sync between Apex appointments and Apple Calendar via CalDAV, supporting both iCloud OAuth 2.0 and app‑specific password authentication, iCalendar event mapping, and periodic polling for external changes.

**Depends on:** `integrations/INTEGRATION‑CALENDAR.md → INT‑CALENDAR‑002`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`
**Blocks:** [N/A] — final calendar integration
**Related Files:** `integrations/apple/oauth.ts`, `integrations/apple/caldav‑client.ts`, `lib/integrations/calendar‑sync/apple‑sync.ts`

**Definition of Done**
- [ ] OAuth 2.0 flow for iCloud (with app‑specific password fallback) completed; tokens encrypted at rest
- [ ] `createEvent(appointmentId)` → creates a VEVENT on the user’s CalDAV calendar; returns the generated UID
- [ ] `updateEvent(appointmentId)` → updates the VEVENT identified by its UID
- [ ] `deleteEvent(appointmentId)` → deletes the VEVENT
- [ ] Periodic sync: scheduled background job polls CalDAV calendar for changes using `sync‑collection` REPORT (RFC 6578); maps external changes back to Apex appointments with last‑write‑wins conflict resolution
- [ ] Timezone handling: stores all events in UTC; converts on read/write using the calendar’s IANA timezone
- [ ] Support for recurring events: converts Apex recurrence rules to iCalendar RRULE format
- [ ] Unit tests pass using recorded CalDAV XML responses
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Use a well‑tested CalDAV client library (e.g., `tsdav`) that handles XML parsing, iCalendar generation, and REPORT queries
- Map Apex appointment recurrence rules to iCalendar RRULE using a dedicated converter utility
- Polling interval must be configurable (default: 5 minutes); do not exceed 60 polls per hour
- Store the CalDAV event UID on the Apex appointment record for future updates

**Verification**
```bash
pnpm vitest run -- integrations/apple/oauth.test.ts
pnpm vitest run -- integrations/apple/caldav‑client.test.ts
pnpm vitest run -- lib/integrations/calendar‑sync/apple‑sync.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Apple Calendar is a third external system in the Appointments bounded context. `AppleCalendarAdapter` implements `CalendarPort`.
- TDD: Use recorded CalDAV XML responses as fixtures; tests must pass deterministically.
- BDD: “As a service provider using iCloud calendar, my appointments sync to Apple Calendar and changes in either system are reflected within a few minutes.”
- Deep Module: `AppleCalendarSyncService.sync(userId)` hides CalDAV protocol complexity, iCalendar parsing, RRULE mapping, and polling management.

---

### Subtasks
- [ ] INT‑CALENDAR‑003.0.25 (AGENT): Read the entire task and CalDAV protocol documentation (RFC 4791, RFC 5545, RFC 6578). *No action – pause.*
- [ ] INT‑CALENDAR‑003.0.5 (AGENT): Research CalDAV client libraries for Node.js (`tsdav`, `dav`), iCloud OAuth 2.0 setup, and RRULE conversion patterns. *Document findings briefly.*
- [ ] INT‑CALENDAR‑003.1 (AGENT): Implement iCloud OAuth 2.0 flow and app‑specific password authentication.
  **File(s):** `integrations/apple/oauth.ts`
  **Verification:** `pnpm vitest run -- oauth.test.ts`
- [ ] INT‑CALENDAR‑003.2 (AGENT): Implement CalDAV client with event CRUD and periodic sync‑collection REPORT.
  **File(s):** `integrations/apple/caldav‑client.ts`
  **Verification:** `pnpm vitest run -- caldav‑client.test.ts`
- [ ] INT‑CALENDAR‑003.3 (AGENT): Implement RRULE converter and timezone handling.
  **File(s):** `lib/integrations/calendar‑sync/apple‑sync.ts`
  **Verification:** `pnpm vitest run -- apple‑sync.test.ts`
- [ ] INT‑CALENDAR‑003.4 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑CALENDAR‑003.N (HUMAN): Final review – verify CalDAV sync with an iCloud test account, approve. **Verification:** Approved.

---