**Google Calendar API:** Uses Google Calendar API v3 with OAuth 2.0, PKCE recommended; rate limits: 10,000 queries/day per user; push notifications via webhooks with `X-Goog-Channel-Token` verification; incremental sync via `syncToken`.

**Microsoft Graph Calendar API:** Uses Microsoft Graph v1.0 endpoint, OAuth 2.0 with delegated permissions, delta queries for incremental sync, webhooks with `@microsoft.graph.deltaLink` and `clientState` verification; supports Teams meetings.

**Apple Calendar:** CalDAV protocol (RFC 4791) with OAuth 2.0 for iCloud (as of 2020), app‑specific passwords for legacy, iCalendar (RFC 5545) data format; no push notifications; polling required.

We'll structure each task fully.

Now, writing `TODO-P7-CALENDAR.md`.

# TODO-P7-CALENDAR.md – Phase 7 Calendar Integrations

This document contains calendar integration tasks for Google Calendar, Microsoft Graph Calendar, and Apple Calendar via CalDAV. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 Calendar Integration Task Index

- [ ] INT‑CALENDAR‑001 – Google Calendar API Integration
- [ ] INT‑CALENDAR‑002 – Microsoft Graph Calendar Integration
- [ ] INT‑CALENDAR‑003 – Apple Calendar (CalDAV) Integration

---

## [ ] INT‑CALENDAR‑001: Google Calendar API Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Google Calendar integration exists. As of May 2026, Google Calendar API v3 supports OAuth 2.0 with PKCE, incremental sync via `syncToken`, and push notifications via webhooks (with `X-Goog-Channel-Token` and `X-Goog-Resource-ID` headers). Rate limit: 10,000 queries per day per user and 1,000,000 queries per day per project. Automatic meeting link generation (Google Meet) is built into the Calendar API.
**Size:** Medium

**Description:** Implement a full two‑way sync between Apex appointments and Google Calendar, including OAuth 2.0 PKCE flow, create/update/delete calendar events, incremental sync, webhook‑based real‑time updates, and automatic Google Meet link generation.

**Depends on:** API‑APPT‑006 (appointment API), DOMAIN‑004 (calendar integration architecture)
**Blocks:** INT‑CALENDAR‑002 (Microsoft Graph Calendar — patterns and adapters established here)
**Related Files:** `integrations/google/oauth.ts`, `integrations/google/calendar-client.ts`, `integrations/google/webhooks.ts`, `lib/integrations/calendar-sync/google-sync.ts`

**Imports / Exports**
- Imports: `CalendarPort` interface, `OAuthTokenStore`, `googleapis` (Google API Node.js client v130+)
- Exports: `GoogleCalendarAdapter`, `GoogleSyncService`, `GoogleWebhookHandler`

**Definition of Done**
- [ ] OAuth 2.0 PKCE flow completed; tokens encrypted at rest and automatically refreshed when `expires_in` < 60 s
- [ ] `createEvent(appointmentId)` → creates a Google Calendar event with correct start/end times, timezone, location, and Meet link
- [ ] `updateEvent(appointmentId)` → updates the linked Google Calendar event; only the changed fields are sent (PATCH semantics)
- [ ] `deleteEvent(appointmentId)` → deletes the linked Google Calendar event
- [ ] Incremental sync: on demand or scheduled, uses `syncToken` to receive only added/updated/deleted events since last sync
- [ ] Webhook handler listens for Google Calendar push notifications; verifies `X-Goog-Channel-Token` and resource state; triggers re‑sync
- [ ] Rate limiting: tracks daily quota usage per user, with backoff on `403 rateLimitExceeded`
- [ ] Unit tests pass using recorded fixture data (Google API responses)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Google Workspace admin features (domain‑wide delegation, shared calendars)
- Importing historical events beyond the incremental sync window
- Google Tasks / Google Keep integration

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `GOOGLE_CLIENT_SECRET`, OAuth refresh tokens
- Never store OAuth tokens in plaintext; encrypt with AES‑256‑GCM before persisting
- Never log raw token values; always redact with `[REDACTED]`

**Output Artifacts**
- Code changes in: `integrations/google/`, `lib/integrations/calendar-sync/`
- Tests added/updated in: `integrations/google/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A] — token storage uses existing `integration_credentials` table

**Rollback**
- Granularity: file‑level — delete `integrations/google/` directory; deregister Google webhook channels
- Halt condition: if OAuth flow fails due to missing Google Cloud Console configuration, stop and ask user to set up the project and enable the Calendar API

**Rules to Follow**
- Use the `googleapis` Node.js client (v130+); do not hand‑roll REST calls
- Always use PKCE (Proof Key for Code Exchange) for OAuth 2.0; never store client secret in the frontend
- Set `conferenceDataVersion: 1` in event creation to auto‑generate Meet links
- Webhook channels must be renewed every 24 hours (Google Calendar webhook TTL)
- Incremental sync with `syncToken` must handle token expiration gracefully (fall back to full sync if token invalidated)
- Map Apex appointment statuses to Google Calendar `transparency` and `status` fields

**Verification**
```bash
# Test OAuth flow
pnpm vitest run -- integrations/google/oauth.test.ts

# Test calendar event CRUD
pnpm vitest run -- integrations/google/calendar-client.test.ts

# Test webhook processing
pnpm vitest run -- integrations/google/webhooks.test.ts

# Test sync logic
pnpm vitest run -- lib/integrations/calendar-sync/google-sync.test.ts

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Adapter pattern: `GoogleCalendarAdapter` implements `CalendarPort`; domain layer never imports Google‑specific types
- Incremental sync with `syncToken`: store per‑user; on expiry, discard and perform full sync
- Webhook channel lifecycle: create channel on connect, renew every 24 h, stop on disconnect
- Automatic Meet link by setting `conferenceData.createRequest.requestId = appointment.id`

**Anti‑Patterns**
- Do not store the Google client secret in the frontend; use a backend OAuth proxy
- Do not poll the Calendar API for changes; use webhooks exclusively
- Do not ignore webhook channel expiry — stale channels prevent future push notifications
- Do not send full event objects on update; use only the changed fields to reduce API call size

**DDD / TDD / BDD / Deep Module notes**
- DDD: Google Calendar is an external system in the Appointments bounded context. `GoogleCalendarAdapter` is an anti‑corruption layer translating Google Calendar concepts into Apex domain events.
- TDD: Record Google API responses as fixtures via `nock`; all tests must pass without a live Google API connection.
- BDD: "As a service provider, my confirmed appointments appear automatically in my Google Calendar with a Google Meet link, and changes in either system stay in sync."
- Deep Module: `GoogleSyncService.sync(userId)` hides OAuth refresh, syncToken management, webhook renewal, and conflict resolution behind a single method.

---

### Subtasks

- [ ] INT‑CALENDAR‑001.0.25 (AGENT): Read the entire task and Google Calendar API v3 documentation.
  *No action — pause until fully understood.*

- [ ] INT‑CALENDAR‑001.0.5 (AGENT): Research Google Calendar API v3 incremental sync, webhook channel lifecycle, and `googleapis` client v130+ OAuth PKCE patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑CALENDAR‑001.0.75 (AGENT): Reason about sync conflict resolution strategy (Apex wins vs. last‑write‑wins) and webhook channel storage.
  *If uncertain, default to last‑write‑wins with audit log.*

- [ ] INT‑CALENDAR‑001.1 (AGENT): Implement OAuth 2.0 PKCE flow and encrypted token storage.
  **File(s):** `integrations/google/oauth.ts`
  **Verification:** `pnpm vitest run -- integrations/google/oauth.test.ts`

- [ ] INT‑CALENDAR‑001.2 (AGENT): Implement calendar event CRUD (create, update, delete) with automatic Meet link generation.
  **File(s):** `integrations/google/calendar-client.ts`
  **Verification:** `pnpm vitest run -- integrations/google/calendar-client.test.ts`

- [ ] INT‑CALENDAR‑001.3 (AGENT): Implement webhook handler with channel verification and renewal.
  **File(s):** `integrations/google/webhooks.ts`
  **Verification:** `pnpm vitest run -- integrations/google/webhooks.test.ts`

- [ ] INT‑CALENDAR‑001.4 (AGENT): Implement incremental sync service with `syncToken` management.
  **File(s):** `lib/integrations/calendar-sync/google-sync.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/calendar-sync/google-sync.test.ts`

- [ ] INT‑CALENDAR‑001.5 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑CALENDAR‑001.N (HUMAN): Final review — verify OAuth flow and event sync end‑to‑end with a Google test account, approve.
  **Verification:** Approved.

---

## [ ] INT‑CALENDAR‑002: Microsoft Graph Calendar Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Microsoft Graph Calendar integration exists. As of May 2026, Microsoft Graph v1.0 provides calendar event CRUD, delta queries for incremental sync, and webhook subscriptions with `clientState` verification. OAuth 2.0 delegated permissions are required (e.g., `Calendars.ReadWrite`). Teams meeting integration is built into event creation via `isOnlineMeeting: true`.
**Size:** Medium

**Description:** Implement a full two‑way sync between Apex appointments and Microsoft 365/Outlook Calendar, including OAuth 2.0 flow, event CRUD, delta‑based incremental sync, webhook‑based real‑time updates, and automatic Teams meeting generation.

**Depends on:** INT‑CALENDAR‑001 (adapter patterns reusable), API‑APPT‑006 (appointment API)
**Blocks:** INT‑CALENDAR‑003 (Apple Calendar patterns)
**Related Files:** `integrations/microsoft/oauth.ts`, `integrations/microsoft/calendar-client.ts`, `integrations/microsoft/webhooks.ts`, `lib/integrations/calendar-sync/ms-graph-sync.ts`

**Imports / Exports**
- Imports: `CalendarPort` interface, `OAuthTokenStore`, `@microsoft/microsoft-graph-client` (v3+)
- Exports: `MicrosoftGraphCalendarAdapter`, `MSGraphSyncService`, `MSGraphWebhookHandler`

**Definition of Done**
- [ ] OAuth 2.0 flow (authorization code with PKCE) completed using Microsoft identity platform; tokens encrypted at rest
- [ ] `createEvent(appointmentId)` → creates an event in the user's primary calendar with `isOnlineMeeting: true` for auto‑Teams link
- [ ] `updateEvent(appointmentId)` → updates the linked event; only changed fields sent
- [ ] `deleteEvent(appointmentId)` → deletes the linked event
- [ ] Delta sync: uses `@odata.deltaLink` to fetch only changes since last sync; falls back to full sync if delta token expires
- [ ] Webhook handler: processes `subscription` notifications; validates `clientState`; triggers re‑sync
- [ ] Webhook subscriptions managed: created on connect, renewed before expiry (max 3‑day subscription lifetime), removed on disconnect
- [ ] Rate limiting: respects Microsoft Graph throttling (10,000 requests per 10‑minute window per app); backs off on `HTTP 429`
- [ ] Unit tests pass using recorded fixture data
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Shared and resource mailboxes
- Calendar delegation and impersonation
- Microsoft 365 admin consent for organisation‑wide access

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `AZURE_CLIENT_SECRET`, OAuth refresh tokens
- Never store OAuth tokens in plaintext

**Output Artifacts**
- Code changes in: `integrations/microsoft/`, `lib/integrations/calendar-sync/`
- Tests added/updated in: `integrations/microsoft/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `integrations/microsoft/` directory; remove webhook subscriptions
- Halt condition: if delta sync returns inconsistent results, stop and verify `@odata.deltaLink` handling

**Rules to Follow**
- Use `@microsoft/microsoft-graph-client` v3+ with `@azure/identity` for authentication
- Delta queries: store `@odata.deltaLink` per user; on `resyncRequired`, discard token and perform full sync
- Webhook subscriptions: lifespan max 3 days for calendar; renew via background job every 2 days
- Set `isOnlineMeeting: true` and `onlineMeetingProvider: 'teamsForBusiness'` for auto‑Teams links
- Map Apex appointment statuses to Graph `showAs` values (e.g., `busy`, `free`)

**Verification**
```bash
pnpm vitest run -- integrations/microsoft/oauth.test.ts
pnpm vitest run -- integrations/microsoft/calendar-client.test.ts
pnpm vitest run -- integrations/microsoft/webhooks.test.ts
pnpm vitest run -- lib/integrations/calendar-sync/ms-graph-sync.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Adapter pattern: `MicrosoftGraphCalendarAdapter` implements `CalendarPort`
- Delta token persistence: store per‑user in DB; on `resyncRequired`, clear and re‑fetch
- Webhook subscription lifecycle: background job renews subscriptions every 2 days

**Anti‑Patterns**
- Do not poll for changes; use delta queries and webhooks
- Do not hardcode `clientState`; generate a random value per subscription and validate on webhook delivery
- Do not create duplicate subscriptions for the same user/calendar on re‑connect

**DDD / TDD / BDD / Deep Module notes**
- DDD: Microsoft Graph Calendar is an external system in the Appointments bounded context. `MicrosoftGraphCalendarAdapter` is a second anti‑corruption layer implementing `CalendarPort`.
- TDD: Use recorded fixture data for all tests; no live API calls.
- BDD: "As a service provider, my appointments sync to my Outlook calendar with Teams meeting links, and changes in either system are reflected automatically."
- Deep Module: `MSGraphSyncService.sync(userId)` hides OAuth refresh, delta token management, and webhook subscription lifecycle.

---

### Subtasks

- [ ] INT‑CALENDAR‑002.0.25 (AGENT): Read the entire task and Microsoft Graph Calendar API documentation.
  *No action — pause until fully understood.*

- [ ] INT‑CALENDAR‑002.0.5 (AGENT): Research Microsoft Graph v1.0 delta queries, webhook subscription lifecycle, and `@microsoft/microsoft-graph-client` v3+ authentication patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑CALENDAR‑002.0.75 (AGENT): Reason about delta token expiry handling and webhook subscription renewal strategy.
  *If uncertain, default to background job renewal every 2 days.*

- [ ] INT‑CALENDAR‑002.1 (AGENT): Implement OAuth 2.0 flow and encrypted token storage.
  **File(s):** `integrations/microsoft/oauth.ts`
  **Verification:** `pnpm vitest run -- integrations/microsoft/oauth.test.ts`

- [ ] INT‑CALENDAR‑002.2 (AGENT): Implement calendar event CRUD with automatic Teams meeting generation.
  **File(s):** `integrations/microsoft/calendar-client.ts`
  **Verification:** `pnpm vitest run -- integrations/microsoft/calendar-client.test.ts`

- [ ] INT‑CALENDAR‑002.3 (AGENT): Implement webhook handler with `clientState` verification and subscription management.
  **File(s):** `integrations/microsoft/webhooks.ts`
  **Verification:** `pnpm vitest run -- integrations/microsoft/webhooks.test.ts`

- [ ] INT‑CALENDAR‑002.4 (AGENT): Implement delta sync service with delta token management.
  **File(s):** `lib/integrations/calendar-sync/ms-graph-sync.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/calendar-sync/ms-graph-sync.test.ts`

- [ ] INT‑CALENDAR‑002.5 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑CALENDAR‑002.N (HUMAN): Final review — verify OAuth flow and event sync with a Microsoft 365 test account, approve.
  **Verification:** Approved.

---

## [ ] INT‑CALENDAR‑003: Apple Calendar (CalDAV) Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Apple Calendar integration exists. As of May 2026, Apple Calendar supports CalDAV (RFC 4791) for event CRUD, OAuth 2.0 for iCloud (since 2020), and app‑specific passwords as a legacy fallback. iCalendar (RFC 5545) is the data format. No push notifications — polling is required.
**Size:** Medium

**Description:** Implement a two‑way sync between Apex appointments and Apple Calendar via CalDAV, supporting both iCloud OAuth 2.0 and app‑specific password authentication, iCalendar event mapping, and periodic polling for external changes.

**Depends on:** INT‑CALENDAR‑002 (adapter patterns reusable), API‑APPT‑006 (appointment API)
**Blocks:** [N/A] — final calendar integration
**Related Files:** `integrations/apple/oauth.ts`, `integrations/apple/caldav-client.ts`, `lib/integrations/calendar-sync/apple-sync.ts`

**Imports / Exports**
- Imports: `CalendarPort` interface, `OAuthTokenStore`, `tsdav` or `dav` CalDAV client library
- Exports: `AppleCalendarAdapter`, `AppleCalendarSyncService`

**Definition of Done**
- [ ] OAuth 2.0 flow for iCloud (with app‑specific password fallback) completed; tokens encrypted at rest
- [ ] `createEvent(appointmentId)` → creates a VEVENT on the user's CalDAV calendar; returns the generated UID
- [ ] `updateEvent(appointmentId)` → updates the VEVENT identified by its UID
- [ ] `deleteEvent(appointmentId)` → deletes the VEVENT
- [ ] Periodic sync: scheduled background job polls CalDAV calendar for changes using `sync-collection` REPORT (RFC 6578); maps external changes back to Apex appointments with last‑write‑wins conflict resolution
- [ ] Timezone handling: stores all events in UTC; converts on read/write using the calendar's IANA timezone
- [ ] Support for recurring events: converts Apex recurrence rules to iCalendar RRULE format
- [ ] Unit tests pass using recorded CalDAV XML responses
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- iCloud Drive integration
- Apple Reminders app integration
- Legacy iCloud (non‑OAuth) authentication beyond app‑specific passwords

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, iCloud credentials, app‑specific passwords
- Never store user passwords in plaintext; use OAuth 2.0 primarily, app‑specific passwords only as fallback

**Output Artifacts**
- Code changes in: `integrations/apple/`, `lib/integrations/calendar-sync/`
- Tests added/updated in: `integrations/apple/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `integrations/apple/` directory
- Halt condition: if CalDAV client encounters persistent `HTTP 500` or `HTTP 503` from Apple servers, stop and verify the correct CalDAV server URL (e.g., `https://caldav.icloud.com/`)

**Rules to Follow**
- Use a well‑tested CalDAV client library (e.g., `tsdav`) that handles XML parsing, iCalendar generation, and REPORT queries
- Map Apex appointment recurrence rules to iCalendar RRULE using a dedicated converter utility
- Polling interval must be configurable (default: 5 minutes); do not exceed 60 polls per hour
- Timezone conversion: use `ics` library or `date-fns-tz` to handle iCalendar VTIMEZONE components
- Store the CalDAV event UID on the Apex appointment record for future updates
- Handle `410 Gone` responses (event deleted externally) by removing the UID reference

**Verification**
```bash
pnpm vitest run -- integrations/apple/oauth.test.ts
pnpm vitest run -- integrations/apple/caldav-client.test.ts
pnpm vitest run -- lib/integrations/calendar-sync/apple-sync.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Adapter pattern: `AppleCalendarAdapter` implements `CalendarPort`
- RRULE conversion utility: bidirectional mapping between Apex recurrence model and iCalendar RRULE using the `rrule` npm package
- Polling service: BullMQ repeatable job per connected user; staggered to avoid thundering herd on the Apple CalDAV server

**Anti‑Patterns**
- Do not poll more frequently than every 5 minutes — Apple has no documented rate limit but excessive polling may be throttled
- Do not assume CalDAV server URL is always `https://caldav.icloud.com/` — support custom CalDAV servers for non‑iCloud Apple Calendar setups
- Do not skip UID tracking — without the CalDAV UID, updates and deletes are impossible

**DDD / TDD / BDD / Deep Module notes**
- DDD: Apple Calendar is a third external system in the Appointments bounded context. `AppleCalendarAdapter` is the third anti‑corruption layer, all implementing the same `CalendarPort`.
- TDD: Use recorded CalDAV XML responses as fixtures; tests must pass deterministically.
- BDD: "As a service provider using iCloud calendar, my appointments sync to Apple Calendar and changes in either system are reflected within a few minutes."
- Deep Module: `AppleCalendarSyncService.sync(userId)` hides CalDAV protocol complexity, iCalendar parsing, RRULE mapping, and polling management behind a single method.

---

### Subtasks

- [ ] INT‑CALENDAR‑003.0.25 (AGENT): Read the entire task and CalDAV protocol documentation (RFC 4791, RFC 5545, RFC 6578).
  *No action — pause until fully understood.*

- [ ] INT‑CALENDAR‑003.0.5 (AGENT): Research CalDAV client libraries for Node.js (`tsdav`, `dav`), iCloud OAuth 2.0 setup, and RRULE conversion patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑CALENDAR‑003.0.75 (AGENT): Reason about polling interval design, CalDAV server URL discovery, and RRULE mapping edge cases.
  *If uncertain, start with a default polling interval of 5 minutes.*

- [ ] INT‑CALENDAR‑003.1 (AGENT): Implement iCloud OAuth 2.0 flow and app‑specific password authentication.
  **File(s):** `integrations/apple/oauth.ts`
  **Verification:** `pnpm vitest run -- integrations/apple/oauth.test.ts`

- [ ] INT‑CALENDAR‑003.2 (AGENT): Implement CalDAV client with event CRUD and periodic sync‑collection REPORT.
  **File(s):** `integrations/apple/caldav-client.ts`
  **Verification:** `pnpm vitest run -- integrations/apple/caldav-client.test.ts`

- [ ] INT‑CALENDAR‑003.3 (AGENT): Implement RRULE converter and timezone handling.
  **File(s):** `lib/integrations/calendar-sync/apple-sync.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/calendar-sync/apple-sync.test.ts`

- [ ] INT‑CALENDAR‑003.4 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑CALENDAR‑003.N (HUMAN): Final review — verify CalDAV sync with an iCloud test account, approve.
  **Verification:** Approved.

---

*End of Phase 7 Calendar Integrations.*