# tasks/integrations/INTEGRATION‑VIDEO.md – Video Conferencing (Zoom, Teams, Meet)

This file covers video conferencing integrations: Zoom, Microsoft Teams, and Google Meet. All meeting providers are abstracted behind a common `VideoPort` interface, keeping the Appointments domain provider‑agnostic. Meeting links are automatically generated when appointments are confirmed, and webhook callbacks update meeting status in near‑real‑time. These tasks are part of Phase 7 and require provider credentials provisioned by a human operator.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] INT‑VIDEO‑001: Zoom Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Zoom integration exists. As of May 2026, Zoom REST API v2 supports Server‑to‑Server OAuth and standard OAuth 2.0 for meeting CRUD, webhooks for real‑time event notifications, and recording management. Meeting creation is rate‑limited to 100 requests per day per user (free/pro accounts).
**Size:** Medium

**Description:** Implement Zoom meeting lifecycle management (create, update, delete) via the Zoom REST API v2 with OAuth 2.0, real‑time webhook processing for meeting status updates, and recording download capabilities.

**Depends on:** `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`, `integrations/INTEGRATION‑CALENDAR.md → INT‑CALENDAR‑003`
**Blocks:** `integrations/INTEGRATION‑VIDEO.md → INT‑VIDEO‑002`
**Related Files:** `integrations/zoom/oauth.ts`, `integrations/zoom/meeting‑client.ts`, `integrations/zoom/webhooks.ts`, `integrations/zoom/recordings.ts`, `lib/integrations/video‑sync/zoom‑sync.ts`

**Definition of Done**
- [ ] OAuth 2.0 flow (Server‑to‑Server or standard OAuth) completed; tokens encrypted at rest
- [ ] `createMeeting(appointmentId)` → creates a Zoom meeting via `POST /v2/users/{userId}/meetings`; returns join URL, meeting ID, and passcode
- [ ] `updateMeeting(appointmentId)` → updates meeting settings (topic, start time, duration)
- [ ] `deleteMeeting(appointmentId)` → deletes the linked Zoom meeting
- [ ] Webhook handler processes events: `meeting.started`, `meeting.ended`, `meeting.updated`, `recording.completed`; verifies Zoom webhook signature
- [ ] Recording service: when `recording.completed` webhook received, downloads recording files and stores references in Apex
- [ ] Status machine: Apex appointment status transitions based on Zoom meeting lifecycle events
- [ ] Rate limiting: tracks daily meeting‑creation count per user (100/day default); exponential backoff on `429`
- [ ] Unit tests pass using recorded fixture webhook payloads
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Zoom Meeting SDK embedding (client‑side in‑browser Zoom experience)
- Zoom Phone, Zoom Chat, Zoom Events integrations
- Zoom Webinars

**Rules to Follow**
- Use Zoom REST API v2; base URL `https://api.zoom.us/v2`
- Meeting creation must include: `type: 2` (scheduled), `start_time`, `duration`, `timezone`, `topic`
- Webhook endpoint must be registered at `/webhooks/zoom`; return HTTP 200 within 3 s
- Meeting URLs must never be logged in plaintext to avoid unauthorised access

**Verification**
```bash
pnpm vitest run -- integrations/zoom/oauth.test.ts
pnpm vitest run -- integrations/zoom/meeting‑client.test.ts
pnpm vitest run -- integrations/zoom/webhooks.test.ts
pnpm vitest run -- integrations/zoom/recordings.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Zoom is an external system in the Appointments bounded context. `ZoomAdapter` is an anti‑corruption layer implementing `VideoPort`.
- TDD: Use recorded Zoom API responses and webhook payloads as fixtures.
- BDD: “As a service provider, a Zoom meeting is automatically created when an appointment is confirmed, and the recording is available in Apex after the meeting ends.”
- Deep Module: `ZoomMeetingService.create(appointmentId)` hides OAuth refresh, rate limit tracking, webhook subscription, and meeting lifecycle.

---

### Subtasks
- [ ] INT‑VIDEO‑001.0.25 (AGENT): Read Zoom REST API v2 documentation (meetings, webhooks, recordings). *No action – pause.*
- [ ] INT‑VIDEO‑001.0.5 (AGENT): Research Zoom meeting creation, webhook signature verification, and Server‑to‑Server OAuth patterns. *Document findings briefly.*
- [ ] INT‑VIDEO‑001.1 (AGENT): Implement Zoom OAuth flow and encrypted token storage.
  **File(s):** `integrations/zoom/oauth.ts`
  **Verification:** `pnpm vitest run -- oauth.test.ts`
- [ ] INT‑VIDEO‑001.2 (AGENT): Implement meeting CRUD with rate limit tracking.
  **File(s):** `integrations/zoom/meeting‑client.ts`
  **Verification:** `pnpm vitest run -- meeting‑client.test.ts`
- [ ] INT‑VIDEO‑001.3 (AGENT): Implement webhook handler with signature verification and status‑machine transitions.
  **File(s):** `integrations/zoom/webhooks.ts`
  **Verification:** `pnpm vitest run -- webhooks.test.ts`
- [ ] INT‑VIDEO‑001.4 (AGENT): Implement recording download service with R2 upload.
  **File(s):** `integrations/zoom/recordings.ts`
  **Verification:** `pnpm vitest run -- recordings.test.ts`
- [ ] INT‑VIDEO‑001.5 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑VIDEO‑001.N (HUMAN): Final review – verify meeting creation end‑to‑end in Zoom sandbox, approve. **Verification:** Approved.

---

## [ ] INT‑VIDEO‑002: Microsoft Teams Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No Microsoft Teams integration exists. As of May 2026, Microsoft Graph API v1.0 provides the `POST /me/onlineMeetings` endpoint for creating standalone Teams meetings. Teams Live Events `isBroadcast` property is being retired — effective June 30 2026 for v1.0, replaced by Virtual Event APIs.
**Size:** Medium

**Description:** Implement Microsoft Teams meeting lifecycle management via Microsoft Graph API, including OAuth 2.0 flow, online meeting creation with auto‑generated join URLs, meeting update/deletion, and webhook subscription for change notifications.

**Depends on:** `integrations/INTEGRATION‑VIDEO.md → INT‑VIDEO‑001`, `appointments/APPOINTMENTS‑BOOKING.md → API‑APPT‑006`
**Blocks:** `integrations/INTEGRATION‑VIDEO.md → INT‑VIDEO‑003`
**Related Files:** `integrations/microsoft/teams‑oauth.ts`, `integrations/microsoft/teams‑client.ts`, `integrations/microsoft/teams‑webhooks.ts`, `lib/integrations/video‑sync/teams‑sync.ts`

**Definition of Done**
- [ ] OAuth 2.0 flow (authorization code with PKCE, delegated permissions) completed; tokens encrypted at rest
- [ ] `createMeeting(appointmentId)` → creates an online meeting via `POST /me/onlineMeetings` with `startDateTime`, `endDateTime`, `subject`; returns `joinWebUrl` and `meetingId`
- [ ] `updateMeeting(appointmentId)` → updates the meeting via `PATCH /me/onlineMeetings/{meetingId}`
- [ ] `deleteMeeting(appointmentId)` → deletes the meeting
- [ ] Webhook subscription: creates and renews subscriptions for `/communications/onlineMeetings` change notifications (max 3‑day lifetime)
- [ ] Webhook handler validates `clientState`; processes `updated` and `deleted` change types
- [ ] Licensing validation: checks the authenticated user has Teams enabled and licensed before creating meeting
- [ ] Rate limiting: respects Microsoft Graph throttling (10,000 requests per 10‑minute window); backoff on `HTTP 429`
- [ ] Unit tests pass using recorded fixture data
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- Teams Live Events (deprecated — use Virtual Event APIs, future phase)
- Teams Chat and Channels integration
- Microsoft 365 admin consent for organisation‑wide access

**Rules to Follow**
- Use `@microsoft/microsoft‑graph‑client` v3+ for all Graph API calls
- Required OAuth scopes: `OnlineMeetings.ReadWrite`, `offline_access`
- Meeting creation body: `{ startDateTime, endDateTime, subject, participants: { attendees: [] } }` (ISO 8601 with timezone offset)
- Do not use the deprecated `isBroadcast` property — it is retired for v1.0 as of June 30 2026

**Verification**
```bash
pnpm vitest run -- integrations/microsoft/teams‑oauth.test.ts
pnpm vitest run -- integrations/microsoft/teams‑client.test.ts
pnpm vitest run -- integrations/microsoft/teams‑webhooks.test.ts
pnpm vitest run -- lib/integrations/video‑sync/teams‑sync.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Microsoft Teams is an external system in the Appointments bounded context. `TeamsAdapter` implements `VideoPort`.
- TDD: Use recorded Graph API responses as fixtures.
- BDD: “As a service provider, a Teams meeting link is automatically generated when a client books an appointment, and they can join directly from the confirmation email.”
- Deep Module: `TeamsMeetingService.create(appointmentId)` hides OAuth refresh, licensing validation, webhook subscription, and meeting lifecycle.

---

### Subtasks
- [ ] INT‑VIDEO‑002.0.25 (AGENT): Read Microsoft Graph `onlineMeetings` API documentation. *No action – pause.*
- [ ] INT‑VIDEO‑002.0.5 (AGENT): Research Microsoft Graph v1.0 `onlineMeetings` endpoint, Teams Live Events deprecation timeline, and webhook subscription lifecycle. *Document findings briefly.*
- [ ] INT‑VIDEO‑002.1 (AGENT): Implement OAuth 2.0 flow (Microsoft identity platform) with encrypted token storage.
  **File(s):** `integrations/microsoft/teams‑oauth.ts`
  **Verification:** `pnpm vitest run -- teams‑oauth.test.ts`
- [ ] INT‑VIDEO‑002.2 (AGENT): Implement online meeting CRUD with licensing validation.
  **File(s):** `integrations/microsoft/teams‑client.ts`
  **Verification:** `pnpm vitest run -- teams‑client.test.ts`
- [ ] INT‑VIDEO‑002.3 (AGENT): Implement webhook subscription management and change notification handler.
  **File(s):** `integrations/microsoft/teams‑webhooks.ts`
  **Verification:** `pnpm vitest run -- teams‑webhooks.test.ts`
- [ ] INT‑VIDEO‑002.4 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑VIDEO‑002.N (HUMAN): Final review – verify OAuth flow and meeting creation with a Microsoft 365 test account, approve. **Verification:** Approved.

---

## [ ] INT‑VIDEO‑003: Google Meet Integration
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Google Meet integration exists independent of the Google Calendar integration. As of May 2026, Google Meet is not a standalone API — it is embedded in the Google Calendar API via the `conferenceData` field. No extra OAuth scopes are needed beyond Calendar API scopes.
**Size:** Small

**Description:** Implement Google Meet meeting link generation as an enhancement to the Google Calendar integration (INT‑CALENDAR‑001), ensuring every Apex appointment generates a fresh Google Meet link via the Calendar API `conferenceData.createRequest` field, and provide recording access via Google Drive.

**Depends on:** `integrations/INTEGRATION‑CALENDAR.md → INT‑CALENDAR‑001`, `integrations/INTEGRATION‑VIDEO.md → INT‑VIDEO‑002`
**Blocks:** [N/A] — final video conferencing integration
**Related Files:** `integrations/google/meet‑client.ts`, `lib/integrations/video‑sync/meet‑sync.ts`

**Definition of Done**
- [ ] Extends Google Calendar event creation to always include `conferenceData.createRequest` with a unique `requestId` (UUID per appointment)
- [ ] Generates a fresh Google Meet link per appointment (no Meet code reuse between events)
- [ ] Reads Meet conference data from calendar events: `conferenceData.entryPoints[]` (video, phone, sip)
- [ ] Recording access: queries Google Drive for Meet recordings associated with the calendar event
- [ ] Status mapping: maps Meet conference status (`pending`, `accepted`, `declined`) to Apex appointment video status
- [ ] `pnpm run typecheck` passes

**Rules to Follow**
- Always use `conferenceDataVersion: 1` query parameter on Calendar API calls
- Always create a new `createRequest` with a unique `requestId` (UUID) per appointment — never reuse Meet codes
- Meet links are generated asynchronously; poll `conferenceData.status` if needed, but eventual consistency is acceptable
- Google Meet requires no additional OAuth scopes beyond what INT‑CALENDAR‑001 already requires for Calendar access

**Verification**
```bash
pnpm vitest run -- integrations/google/meet‑client.test.ts
pnpm vitest run -- lib/integrations/video‑sync/meet‑sync.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Google Meet is an integrated capability of Google Calendar within the Appointments bounded context. `MeetAdapter` implements `VideoPort` and delegates to `GoogleCalendarAdapter`.
- TDD: Use recorded Calendar API responses with `conferenceData` populated.
- BDD: “As a service provider, every booked appointment automatically gets a fresh Google Meet link, and clients can join directly from their confirmation.”
- Deep Module: `MeetAdapter` is a thin wrapper around the existing `GoogleCalendarAdapter`; all Meet‑specific logic is encapsulated within.

---

### Subtasks
- [ ] INT‑VIDEO‑003.0.25 (AGENT): Read Google Calendar `conferenceData` documentation and INT‑CALENDAR‑001 adapter code. *No action – pause.*
- [ ] INT‑VIDEO‑003.0.5 (AGENT): Research Google February 2026 Meet code reuse guidance, `conferenceData.createRequest` best practices. *Document findings briefly.*
- [ ] INT‑VIDEO‑003.1 (AGENT): Implement `MeetAdapter` wrapping `GoogleCalendarAdapter` with `createRequest` and unique `requestId` per appointment.
  **File(s):** `integrations/google/meet‑client.ts`
  **Verification:** `pnpm vitest run -- meet‑client.test.ts`
- [ ] INT‑VIDEO‑003.2 (AGENT): Implement recording access and conference data reading.
  **File(s):** `lib/integrations/video‑sync/meet‑sync.ts`
  **Verification:** `pnpm vitest run -- meet‑sync.test.ts`
- [ ] INT‑VIDEO‑003.3 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑VIDEO‑003.N (HUMAN): Final review – verify Meet link generation with a Google test account, approve. **Verification:** Approved.

---