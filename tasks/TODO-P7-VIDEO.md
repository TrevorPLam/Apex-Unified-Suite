Now producing `TODO-P7-VIDEO.md`.

---

# TODO-P7-VIDEO.md – Phase 7 Video Conferencing Integrations

This document contains video conferencing integration tasks for Zoom, Microsoft Teams, and Google Meet. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 Video Integration Task Index

- [ ] INT‑VIDEO‑001 – Zoom Integration
- [ ] INT‑VIDEO‑002 – Microsoft Teams Integration
- [ ] INT‑VIDEO‑003 – Google Meet Integration

---

## [ ] INT‑VIDEO‑001: Zoom Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Zoom integration exists. As of May 2026, Zoom REST API v2 supports Server‑to‑Server OAuth and standard OAuth 2.0 for meeting CRUD, webhooks for real‑time event notifications, and recording management. Meeting creation is rate‑limited to 100 requests per day per user (free/pro accounts) or higher tiers for business/enterprise. Starting March 2 2026, OBF (On Behalf Of) tokens are required for Meeting SDK bots joining external meetings.
**Size:** Medium

**Description:** Implement Zoom meeting lifecycle management (create, update, delete) via the Zoom REST API v2 with OAuth 2.0, real‑time webhook processing for meeting status updates, and recording download capabilities.

**Depends on:** API‑APPT‑006 (appointment API), INT‑CALENDAR‑003 (Apple Calendar integration — patterns reference)
**Blocks:** INT‑VIDEO‑002 (Microsoft Teams — adapter patterns reusable)
**Related Files:** `integrations/zoom/oauth.ts`, `integrations/zoom/meeting-client.ts`, `integrations/zoom/webhooks.ts`, `integrations/zoom/recordings.ts`, `lib/integrations/video-sync/zoom-sync.ts`

**Imports / Exports**
- Imports: `VideoPort` interface, `OAuthTokenStore`, Zoom REST API client
- Exports: `ZoomAdapter`, `ZoomMeetingService`, `ZoomWebhookHandler`, `ZoomRecordingService`

**Definition of Done**
- [ ] OAuth 2.0 flow (Server‑to‑Server or standard OAuth) completed; tokens encrypted at rest
- [ ] `createMeeting(appointmentId)` → creates a Zoom meeting via `POST /v2/users/{userId}/meetings`; returns join URL, meeting ID, and passcode
- [ ] `updateMeeting(appointmentId)` → updates meeting settings (topic, start time, duration); handles `PATCH /v2/meetings/{meetingId}`
- [ ] `deleteMeeting(appointmentId)` → deletes the linked Zoom meeting via `DELETE /v2/meetings/{meetingId}`
- [ ] Webhook handler processes events: `meeting.started`, `meeting.ended`, `meeting.updated`, `recording.completed`; verifies Zoom webhook signature using the verification token
- [ ] Recording service: when `recording.completed` webhook received, downloads recording files and stores references in Apex
- [ ] Status machine: Apex appointment status transitions based on Zoom meeting lifecycle events
- [ ] Rate limiting: tracks daily meeting‑creation count per user (100/day default); implements exponential backoff on `429 Too Many Requests`
- [ ] Unit tests pass using recorded fixture webhook payloads
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Zoom Meeting SDK embedding (client‑side in‑browser Zoom experience) — this task covers REST API only
- Zoom Phone, Zoom Chat, Zoom Events integrations
- Zoom Webinars
- OBF token management for Meeting SDK bots

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_VERIFICATION_TOKEN`
- Never store OAuth tokens in plaintext
- Never skip webhook signature verification — unsigned webhooks are a spoofing vector

**Output Artifacts**
- Code changes in: `integrations/zoom/`, `lib/integrations/video-sync/`
- Tests added/updated in: `integrations/zoom/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `integrations/zoom/` directory; deregister Zoom webhook endpoint
- Halt condition: if Zoom returns persistent `401` or `403` errors, stop and verify OAuth credentials and scopes before continuing

**Rules to Follow**
- Use Zoom REST API v2; the base URL is `https://api.zoom.us/v2`
- Meeting creation must include: `type: 2` (scheduled meeting), `start_time`, `duration`, `timezone`, `topic`
- Webhook endpoint must be registered at `/webhooks/zoom`; return HTTP 200 within 3 s and process asynchronously
- Zoom webhook signature verification: compute HMAC‑SHA256 of the raw request body using the verification token and compare to the `x-zm-signature` header (Note: current Zoom docs indicate the header is `x-zm-signature` — verify against the latest Zoom webhook documentation as the exact header name can vary by webhook version)
- Meeting URLs must never be logged in plaintext to avoid unauthorised access
- Respect Zoom's 100 meetings/day/user rate limit; implement a counter per connected user

**Verification**
```bash
# Test OAuth flow
pnpm vitest run -- integrations/zoom/oauth.test.ts

# Test meeting CRUD
pnpm vitest run -- integrations/zoom/meeting-client.test.ts

# Test webhook processing
pnpm vitest run -- integrations/zoom/webhooks.test.ts

# Test recording download
pnpm vitest run -- integrations/zoom/recordings.test.ts

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Adapter pattern: `ZoomAdapter` implements `VideoPort`; domain layer never imports Zoom‑specific types
- Webhook deduplication: use `event_id` from Zoom webhook payload as a dedup key in a `processed_webhook_events` table
- Rate limit tracker: `Map<userId, { count, resetAt }>` per 24‑hour window; reset at UTC midnight
- Recording download: async background job downloads each recording file, uploads to R2 storage, and links to the appointment

**Anti‑Patterns**
- Do not poll Zoom for meeting status — use webhooks exclusively
- Do not hardcode meeting settings (duration, type) — derive from the Apex appointment configuration
- Do not expose meeting passcodes or join URLs in API responses that don't require auth
- Do not create duplicate meetings — always check for an existing `externalMeetingId` on the appointment before creating
- Do not skip webhook signature verification

**DDD / TDD / BDD / Deep Module notes**
- DDD: Zoom is an external system in the Appointments bounded context. `ZoomAdapter` is an anti‑corruption layer implementing `VideoPort`, translating Zoom meeting concepts into Apex domain events.
- TDD: Use recorded Zoom API responses and webhook payloads as fixtures. All tests must be deterministic without a live Zoom connection.
- BDD: "As a service provider, a Zoom meeting is automatically created when an appointment is confirmed, and the recording is available in Apex after the meeting ends."
- Deep Module: `ZoomMeetingService.create(appointmentId)` hides OAuth refresh, rate limit tracking, webhook subscription, and meeting lifecycle behind one method.

---

### Subtasks

- [ ] INT‑VIDEO‑001.0.25 (AGENT): Read the entire task and Zoom REST API v2 documentation (meetings, webhooks, recordings).
  *No action — pause until fully understood.*

- [ ] INT‑VIDEO‑001.0.5 (AGENT): Research Zoom REST API v2 meeting creation, webhook signature verification, and Server‑to‑Server OAuth patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑VIDEO‑001.0.75 (AGENT): Reason about rate limit strategy (100 meetings/day/user) and webhook deduplication. Confirm OAuth flow type (Server‑to‑Server vs. standard OAuth) with user.
  *If uncertain about OAuth type, ask the user before executing.*

- [ ] INT‑VIDEO‑001.1 (AGENT): Implement Zoom OAuth flow and encrypted token storage.
  **File(s):** `integrations/zoom/oauth.ts`
  **Verification:** `pnpm vitest run -- integrations/zoom/oauth.test.ts`

- [ ] INT‑VIDEO‑001.2 (AGENT): Implement meeting CRUD (create, update, delete) with rate limit tracking.
  **File(s):** `integrations/zoom/meeting-client.ts`
  **Verification:** `pnpm vitest run -- integrations/zoom/meeting-client.test.ts`

- [ ] INT‑VIDEO‑001.3 (AGENT): Implement webhook handler with signature verification and status‑machine transitions.
  **File(s):** `integrations/zoom/webhooks.ts`
  **Verification:** `pnpm vitest run -- integrations/zoom/webhooks.test.ts`

- [ ] INT‑VIDEO‑001.4 (AGENT): Implement recording download service with R2 upload.
  **File(s):** `integrations/zoom/recordings.ts`
  **Verification:** `pnpm vitest run -- integrations/zoom/recordings.test.ts`

- [ ] INT‑VIDEO‑001.5 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑VIDEO‑001.N (HUMAN): Final review — verify OAuth flow and meeting creation end‑to‑end in Zoom sandbox, approve.
  **Verification:** Approved.

---

## [ ] INT‑VIDEO‑002: Microsoft Teams Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Microsoft Teams integration exists. As of May 2026, Microsoft Graph API v1.0 provides the `POST /me/onlineMeetings` endpoint for creating standalone Teams meetings. OAuth 2.0 delegated permissions (`OnlineMeetings.ReadWrite`) are required. Teams Live Events `isBroadcast` property is being retired — effective March 31 2026 (beta) and June 30 2026 (v1.0), replaced by Virtual Event APIs for webinars and town halls. Meeting creation requires Microsoft 365 work/school accounts with Teams enabled.
**Size:** Medium

**Description:** Implement Microsoft Teams meeting lifecycle management via Microsoft Graph API, including OAuth 2.0 flow, online meeting creation with auto‑generated join URLs, meeting update/deletion, and webhook subscription for change notifications.

**Depends on:** INT‑VIDEO‑001 (Zoom — adapter patterns reusable), API‑APPT‑006 (appointment API)
**Blocks:** INT‑VIDEO‑003 (Google Meet — patterns reference)
**Related Files:** `integrations/microsoft/teams-oauth.ts`, `integrations/microsoft/teams-client.ts`, `integrations/microsoft/teams-webhooks.ts`, `lib/integrations/video-sync/teams-sync.ts`

**Imports / Exports**
- Imports: `VideoPort` interface, `OAuthTokenStore`, `@microsoft/microsoft-graph-client` (v3+)
- Exports: `TeamsAdapter`, `TeamsMeetingService`, `TeamsWebhookHandler`

**Definition of Done**
- [ ] OAuth 2.0 flow (authorization code with PKCE, delegated permissions) completed; tokens encrypted at rest
- [ ] `createMeeting(appointmentId)` → creates an online meeting via `POST /me/onlineMeetings` with `startDateTime`, `endDateTime`, `subject`; returns `joinWebUrl` and `meetingId`
- [ ] `updateMeeting(appointmentId)` → updates the meeting via `PATCH /me/onlineMeetings/{meetingId}` (subject, start/end times)
- [ ] `deleteMeeting(appointmentId)` → deletes the meeting via `DELETE /me/onlineMeetings/{meetingId}`
- [ ] Webhook subscription: creates a subscription for `/communications/onlineMeetings` change notifications; renews before expiry (max subscription lifetime: 3 days); removes on disconnect
- [ ] Webhook handler: validates `clientState`; processes `updated` and `deleted` change types; triggers re‑sync
- [ ] Licensing validation: checks that the authenticated user has Teams enabled and licensed before attempting meeting creation
- [ ] Rate limiting: respects Microsoft Graph throttling (10,000 requests per 10‑minute window per app); backoff on `HTTP 429`
- [ ] Unit tests pass using recorded fixture data
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Teams Live Events (deprecated — use Virtual Event APIs, future phase)
- Teams Chat and Channels integration
- Microsoft 365 admin consent for organisation‑wide access
- Recording download via OneDrive/SharePoint (future phase)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `AZURE_CLIENT_SECRET`, OAuth refresh tokens
- Never store OAuth tokens in plaintext
- Never skip webhook `clientState` validation

**Output Artifacts**
- Code changes in: `integrations/microsoft/`, `lib/integrations/video-sync/`
- Tests added/updated in: `integrations/microsoft/*.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — delete `integrations/microsoft/` Teams files; remove webhook subscriptions
- Halt condition: if Teams meeting creation fails with licensing errors, stop and verify the test account has Teams enabled

**Rules to Follow**
- Use `@microsoft/microsoft-graph-client` v3+ for all Graph API calls
- Required OAuth scopes: `OnlineMeetings.ReadWrite`, `offline_access`
- Meeting creation body: `{ startDateTime, endDateTime, subject, participants: { attendees: [] } }` (ISO 8601 with timezone offset)
- Webhook subscriptions: validate `clientState` on every notification; renew within 3‑day max lifespan
- Do not use the deprecated `isBroadcast` property — it is retired for v1.0 as of June 30 2026

**Verification**
```bash
pnpm vitest run -- integrations/microsoft/teams-oauth.test.ts
pnpm vitest run -- integrations/microsoft/teams-client.test.ts
pnpm vitest run -- integrations/microsoft/teams-webhooks.test.ts
pnpm vitest run -- lib/integrations/video-sync/teams-sync.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Adapter pattern: `TeamsAdapter` implements `VideoPort`
- Webhook subscription lifecycle: background job renews every 2 days (3‑day max lifespan minus safety margin)
- Licensing check: call `GET /me/licenseDetails` before meeting creation; cache result for 1 hour
- Idempotent meeting creation: store `externalMeetingId` on the appointment; check before creating

**Anti‑Patterns**
- Do not use `isBroadcast` or Teams Live Events creation — deprecated as of 2026
- Do not create meetings without verifying the user has Teams licensed
- Do not create duplicate webhook subscriptions — check existing subscriptions before creating new ones
- Do not call the Graph API synchronously in request handlers — always process in background jobs

**DDD / TDD / BDD / Deep Module notes**
- DDD: Microsoft Teams is an external system in the Appointments bounded context. `TeamsAdapter` implements `VideoPort`, the same interface as `ZoomAdapter`.
- TDD: Use recorded Graph API responses as fixtures; tests must not require a live Microsoft 365 tenant.
- BDD: "As a service provider, a Teams meeting link is automatically generated when a client books an appointment, and they can join directly from the confirmation email."
- Deep Module: `TeamsMeetingService.create(appointmentId)` hides OAuth refresh, licensing validation, webhook subscription, and meeting lifecycle behind one method.

---

### Subtasks

- [ ] INT‑VIDEO‑002.0.25 (AGENT): Read the entire task and Microsoft Graph `onlineMeetings` API documentation.
  *No action — pause until fully understood.*

- [ ] INT‑VIDEO‑002.0.5 (AGENT): Research Microsoft Graph v1.0 `onlineMeetings` endpoint, Teams Live Events deprecation timeline, and webhook subscription lifecycle (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑VIDEO‑002.0.75 (AGENT): Reason about licensing validation approach and whether to use delegated or application permissions. Confirm with user.
  *If uncertain, default to delegated permissions.*

- [ ] INT‑VIDEO‑002.1 (AGENT): Implement OAuth 2.0 flow (Microsoft identity platform) with encrypted token storage.
  **File(s):** `integrations/microsoft/teams-oauth.ts`
  **Verification:** `pnpm vitest run -- integrations/microsoft/teams-oauth.test.ts`

- [ ] INT‑VIDEO‑002.2 (AGENT): Implement online meeting CRUD with licensing validation.
  **File(s):** `integrations/microsoft/teams-client.ts`
  **Verification:** `pnpm vitest run -- integrations/microsoft/teams-client.test.ts`

- [ ] INT‑VIDEO‑002.3 (AGENT): Implement webhook subscription management and change notification handler.
  **File(s):** `integrations/microsoft/teams-webhooks.ts`
  **Verification:** `pnpm vitest run -- integrations/microsoft/teams-webhooks.test.ts`

- [ ] INT‑VIDEO‑002.4 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑VIDEO‑002.N (HUMAN): Final review — verify OAuth flow and meeting creation with a Microsoft 365 test account, approve.
  **Verification:** Approved.

---

## [ ] INT‑VIDEO‑003: Google Meet Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Google Meet integration exists independent of the Google Calendar integration (INT‑CALENDAR‑001). As of May 2026, Google Meet is not a standalone API — it is embedded in the Google Calendar API via the `conferenceData` field. Setting `conferenceData.createRequest` on a calendar event automatically generates a Meet link asynchronously. As of February 2026, Google recommends generating a new conference via `createRequest` for every new event rather than reusing Meet codes, to avoid unintended access to meetings. No extra OAuth scopes are needed beyond Calendar API scopes.
**Size:** Small

**Description:** Implement Google Meet meeting link generation as an enhancement to the Google Calendar integration (INT‑CALENDAR‑001), ensuring every Apex appointment generates a fresh Google Meet link via the Calendar API `conferenceData.createRequest` field, and provide recording access via Google Drive.

**Depends on:** INT‑CALENDAR‑001 (Google Calendar integration), INT‑VIDEO‑002 (Teams — patterns reference)
**Blocks:** [N/A] — final video conferencing integration
**Related Files:** `integrations/google/meet-client.ts`, `lib/integrations/video-sync/meet-sync.ts`

**Imports / Exports**
- Imports: `VideoPort` interface, `GoogleCalendarAdapter` (from INT‑CALENDAR‑001), `googleapis`
- Exports: `MeetAdapter`, `MeetRecordingService`

**Definition of Done**
- [ ] Extends Google Calendar event creation to always include `conferenceData.createRequest` with a unique `requestId` (UUID per appointment)
- [ ] Generates a fresh Google Meet link per appointment (no Meet code reuse between events)
- [ ] Reads Meet conference data from calendar events: `conferenceData.entryPoints[]` (video, phone, sip)
- [ ] Recording access: queries Google Drive for Meet recordings associated with the calendar event (recordings are auto‑saved to the organiser's Drive)
- [ ] Status mapping: maps Meet conference status (`pending`, `accepted`, `declined`) to Apex appointment video status
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Google Meet REST API for live meeting control (mute, remove participant) — not available via public API
- Meet live streaming
- Google Workspace admin features for Meet

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `GOOGLE_CLIENT_SECRET`, OAuth refresh tokens
- Never reuse Meet codes across events — always generate a fresh `createRequest` per event

**Output Artifacts**
- Code changes in: `integrations/google/meet-client.ts`, `lib/integrations/video-sync/meet-sync.ts`
- Tests added/updated in: `integrations/google/meet-client.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file‑level — revert Meet‑specific code; Google Calendar events created without Meet links
- Halt condition: if Meet conference creation consistently returns `declined` status, stop and verify Google Workspace settings have Meet enabled

**Rules to Follow**
- Always use `conferenceDataVersion: 1` query parameter on Calendar API calls
- Always create a new `createRequest` with a unique `requestId` (UUID) per appointment — never reuse Meet codes
- Meet links are generated asynchronously; poll `conferenceData.status` if needed, but eventual consistency is acceptable
- Google Meet requires no additional OAuth scopes beyond what INT‑CALENDAR‑001 already requires for Calendar access
- Recordings are auto‑saved to Google Drive; access them via the Drive API (future enhancement) or via `conferenceData` entry points

**Verification**
```bash
pnpm vitest run -- integrations/google/meet-client.test.ts
pnpm vitest run -- lib/integrations/video-sync/meet-sync.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Adapter pattern: `MeetAdapter` implements `VideoPort`, wrapping the Google Calendar adapter
- Unique `requestId`: `crypto.randomUUID()` per appointment, stored on the appointment record; ensures Meet link regeneration on reschedule
- Conference data polling: optional background job that checks `conferenceData.status` for pending conferences and updates the appointment

**Anti‑Patterns**
- Do not reuse Meet codes across calendar events — this causes access issues and exposes meeting details to unintended users (per Google's February 2026 guidance)
- Do not call a separate "Google Meet API" — it does not exist as a standalone API; always use the Calendar API
- Do not assume the Meet link is available synchronously after event creation — it is generated asynchronously

**DDD / TDD / BDD / Deep Module notes**
- DDD: Google Meet is an integrated capability of Google Calendar within the Appointments bounded context. `MeetAdapter` implements `VideoPort` and delegates to `GoogleCalendarAdapter`.
- TDD: Use recorded Calendar API responses with `conferenceData` populated.
- BDD: "As a service provider, every booked appointment automatically gets a fresh Google Meet link, and clients can join directly from their confirmation."
- Deep Module: `MeetAdapter` is a thin wrapper around the existing `GoogleCalendarAdapter`; all Meet‑specific logic is encapsulated within.

---

### Subtasks

- [ ] INT‑VIDEO‑003.0.25 (AGENT): Read the entire task, Google Calendar `conferenceData` documentation, and the INT‑CALENDAR‑001 adapter code.
  *No action — pause until fully understood.*

- [ ] INT‑VIDEO‑003.0.5 (AGENT): Research Google February 2026 Meet code reuse guidance, `conferenceData.createRequest` best practices, and Meet recording access patterns (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑VIDEO‑003.0.75 (AGENT): Reason about whether Meet should be a standalone adapter or an enhancement to INT‑CALENDAR‑001. Default: thin adapter wrapping the existing Google Calendar adapter.
  *If uncertain, use the thin‑wrapper approach.*

- [ ] INT‑VIDEO‑003.1 (AGENT): Implement `MeetAdapter` wrapping `GoogleCalendarAdapter` with `createRequest` and unique `requestId` per appointment.
  **File(s):** `integrations/google/meet-client.ts`
  **Verification:** `pnpm vitest run -- integrations/google/meet-client.test.ts`

- [ ] INT‑VIDEO‑003.2 (AGENT): Implement recording access and conference data reading.
  **File(s):** `lib/integrations/video-sync/meet-sync.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/video-sync/meet-sync.test.ts`

- [ ] INT‑VIDEO‑003.3 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑VIDEO‑003.N (HUMAN): Final review — verify Meet link generation with a Google test account, approve.
  **Verification:** Approved.

---

## Integration Rules Framework

To avoid rules duplication across all integration tasks, the following common rules framework applies:

### Common Integration Rules
- **Authentication**: Use OAuth 2.0 with proper token management and refresh flows; encrypt tokens at rest with AES‑256‑GCM
- **Error Handling**: Implement exponential backoff for rate limits and network errors
- **Security**: Verify webhook signatures and store credentials securely; never log raw token values
- **Rate Limiting**: Respect provider‑specific API limits with intelligent throttling
- **Testing**: Use provider test environments with comprehensive unit test coverage; record API responses as fixtures
- **Logging**: Implement structured logging with security‑sensitive data redaction (Pino, `[REDACTED]` for tokens/credentials)

### Provider‑Specific Rules
Each integration task includes only rules specific to that provider, not duplicating the common rules above.

---

*End of Phase 7 Video Conferencing Integrations.*