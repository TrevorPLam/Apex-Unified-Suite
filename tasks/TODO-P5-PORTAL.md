# TODO-P5-PORTAL.md – Phase 5: Portal Frontend Integration

Builds the client-facing portal experience and the firm-side portal management interface. The firm side (behind the main app auth) lets staff configure which clients have portal access, manage permissions, and view messages. The client side (behind `PortalAuthContext` — isolated from the firm `AuthContext`) gives clients a dedicated dashboard to view projects, invoices, documents, and messages. Portal branding (logo, colours) is always scoped to the portal container, never applied to `:root`.

---

## [ ] FRONT‑PORTAL‑001a: Firm‑Side Portal Management – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Portal.tsx` uses `mockData` for client list, portal settings, and messages. No firm-side portal hooks exist.
**Size:** Medium

**Description:** Replace all mock data in the firm-side Portal Management page with React Query hooks backed by `API-PORTAL-004`. Enable/disable portal per client, manage document and finance permissions, configure branding, and view/send messages in the firm-side messaging inbox.

**Depends on:** API‑PORTAL‑004 (portal API green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** FRONT‑INT‑PORTAL
**Related Files:** `artifacts/apex-os/src/pages/Portal.tsx`, `artifacts/apex-os/src/hooks/portal/useClientPortalList.ts`, `artifacts/apex-os/src/hooks/portal/usePortalSettings.ts`, `artifacts/apex-os/src/hooks/portal/useFirmMessages.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; API client for `GET /api/v1/portal/clients`, `GET /api/v1/portal/settings/:clientId`, `GET /api/v1/portal/messages`
- Exports: `useClientPortalList()`, `usePortalSettings(clientId)`, `useGrantPermission()`, `useRevokePermission()`, `useFirmMessages(clientId)`

**Definition of Done**
- [ ] `useClientPortalList` hook: returns all clients with portal enabled/disabled status, last login, active permissions
- [ ] Client list view: name, email, portal status toggle, last login, message count badge, "Manage" link
- [ ] Portal status toggle: calls `useTogglePortalAccess` mutation; shows confirmation before disabling (disabling revokes client access immediately)
- [ ] Client detail panel: tabs — Permissions, Branding, Activity Log, Messages
- [ ] Permissions tab: toggle individual permissions (`view_projects`, `view_invoices`, `view_documents`, `view_appointments`, `make_payments`); each toggle calls `useGrantPermission` / `useRevokePermission`
- [ ] Activity log tab: last 50 portal actions by the client (login, viewed invoice, downloaded document, sent message)
- [ ] Messages tab (firm view): conversation list with unread badge; message thread on click; reply input calls `useSendFirmMessage` mutation
- [ ] All `mockData` imports removed from `Portal.tsx`
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Branding configuration (FRONT‑INT‑PORTAL task)
- Client-side portal experience (FRONT‑PORTAL‑001b)
- Bulk permission changes (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/portal/useClientPortalList.ts`, `artifacts/apex-os/src/hooks/portal/usePortalSettings.ts`, `artifacts/apex-os/src/hooks/portal/useFirmMessages.ts`, `artifacts/apex-os/src/pages/Portal.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/portal-management.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert `Portal.tsx` mock imports
- Halt condition: if disabling portal access does not immediately invalidate the client's portal session tokens on the API, stop and verify the API revokes sessions on disable

**Rules to Follow**
- Disabling portal access must show a confirmation dialog — this immediately locks the client out
- Permission toggles must be per-permission granular — not a single "grant all" toggle (which exists separately as a convenience but calls individual permission grants)
- Message conversations must be tenant-scoped — never expose messages from one client to another

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- portal-management.test.tsx
```

**Advanced Code Patterns**
- `useClientPortalList` uses `staleTime: 30_000`; activity log uses `staleTime: 60_000` — activity is not real-time
- Permission toggle optimistic update: flip the permission locally immediately; roll back on API error with error toast

**Anti-Patterns**
- Loading all portal activity in one request — paginate to last 50 events; use `useInfiniteQuery` for "Load more"
- Not confirming before disabling portal access — this locks the client out immediately

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal access is a configuration value object on the Client aggregate. Permissions are a policy set. Messages are a separate Communication aggregate.
- TDD: MSW returns client list with portal enabled; simulate toggle disabled → assert confirmation shown → confirm → assert `PATCH /portal/clients/:id` called with `{ portal_enabled: false }`.
- BDD: "As a firm user, I can manage which clients have portal access, control their permissions, and view their portal messages."
- Deep Module: `useClientPortalList`, `usePortalSettings`, and `useFirmMessages` hide all portal management API concerns.

---

### Subtasks

- [ ] FRONT‑PORTAL‑001a.0.25 (AGENT): Read `Portal.tsx` in full and list every `mockData` reference and the data shape consumed.
  *No action — pause until fully understood.*

- [ ] FRONT‑PORTAL‑001a.1 (AGENT): Create `useClientPortalList`, `usePortalSettings`, `useGrantPermission`, `useRevokePermission`, `useFirmMessages`, `useSendFirmMessage` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/portal/useClientPortalList.ts`, `artifacts/apex-os/src/hooks/portal/usePortalSettings.ts`, `artifacts/apex-os/src/hooks/portal/useFirmMessages.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PORTAL‑001a.2 (AGENT): Build client list view, status toggle, permissions tab, and activity log tab.
  **File(s):** `artifacts/apex-os/src/pages/Portal.tsx`
  **Verification:** No `mockData` references; `pnpm run typecheck` passes.

- [ ] FRONT‑PORTAL‑001a.3 (AGENT): Build firm-side messages tab with conversation list and reply.
  **File(s):** `artifacts/apex-os/src/pages/Portal.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PORTAL‑001a.4 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/portal-management.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- portal-management.test.tsx` → GREEN.

- [ ] FRONT‑PORTAL‑001a.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑PORTAL‑001b: Client‑Side Portal Access
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No client-side portal pages exist. `PortalAuthContext` (FRONT‑AUTH‑003) provides the auth layer but no portal pages are built.
**Size:** Medium

**Description:** Client-facing portal experience under `PortalAuthContext`: a dashboard showing recent invoices, active projects, pending document requests, and upcoming appointments. Individual resource views (invoices, projects, documents) scoped to only the client's permitted resources. Client-side messaging inbox with reply capability.

**Depends on:** FRONT‑AUTH‑003 (portal auth context, magic-link), API‑PORTAL‑004 (portal client API green), FRONT‑PORTAL‑001a
**Blocks:** FRONT‑INT‑PORTAL
**Related Files:** `artifacts/apex-os/src/pages/portal/ClientDashboard.tsx`, `artifacts/apex-os/src/pages/portal/PortalInvoices.tsx`, `artifacts/apex-os/src/pages/portal/PortalProjects.tsx`, `artifacts/apex-os/src/pages/portal/PortalDocuments.tsx`, `artifacts/apex-os/src/pages/portal/PortalMessages.tsx`

**Imports / Exports**
- Imports: `usePortalAuth` from `PortalAuthContext`; `useQuery` from `@tanstack/react-query`; API client using portal JWT (separate from main app auth token)
- Exports: `ClientDashboard`, `PortalInvoices`, `PortalProjects`, `PortalDocuments`, `PortalMessages` page components; `usePortalInvoiceList()`, `usePortalProjectList()`, `usePortalDocumentList()`, `useClientMessages()`

**Definition of Done**
- [ ] Portal layout: separate from the main app layout — no sidebar navigation; minimal header with firm logo/branding; logout button
- [ ] Client dashboard: metric cards (outstanding balance, active projects count, pending document requests, upcoming appointments); recent invoices list; recent messages list
- [ ] Portal invoices page: list with status badges, amount due; "Pay Now" button (if `make_payments` permission granted) calls `usePortalPayment` mutation
- [ ] Portal projects page: read-only project list with status, milestones; no edit actions (client cannot modify projects)
- [ ] Portal documents page: document list scoped to documents explicitly shared with this client; download via signed URL
- [ ] Portal messages page: conversation list; thread view; reply input
- [ ] All portal pages behind `PortalAuthGuard` — redirect to `/portal/login` if not authenticated
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Portal notifications (push/email — Phase 7+)
- Client document upload from portal (Phase 6+)
- Client appointment booking from portal (FRONT‑APPT‑002 covers this via the booking flow)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/pages/portal/ClientDashboard.tsx`, `artifacts/apex-os/src/pages/portal/PortalInvoices.tsx`, `artifacts/apex-os/src/pages/portal/PortalProjects.tsx`, `artifacts/apex-os/src/pages/portal/PortalDocuments.tsx`, `artifacts/apex-os/src/pages/portal/PortalMessages.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/portal-client.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: page-level — remove all `/portal/*` routes; portal magic link leads to "Portal coming soon" page
- Halt condition: if client can see invoices they don't have permission to view, stop and verify the portal API's permission enforcement for each resource endpoint

**Rules to Follow**
- **CRITICAL**: Portal pages must use a completely separate API client instance with the portal JWT — never share the firm API client that uses the firm Bearer token
- Portal branding (firm logo, primary colour) must be applied via CSS variables scoped to the portal container element — never to `:root`
- Permissions are enforced by the API, but the UI must also hide actions the client is not permitted to perform (e.g., hide "Pay Now" if `make_payments` permission is not granted)
- Clients may only see resources explicitly shared with them — never show a generic list of all firm resources

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- portal-client.test.tsx
```

**Advanced Code Patterns**
- Separate portal API client: `const portalApiClient = createApiClient({ getToken: () => portalAuthContext.token })` — different from the main app API client
- Portal branding: on `PortalAuthContext` load, fetch branding settings → inject as CSS custom properties on the `<div id="portal-root">` element

**Anti-Patterns**
- Using the firm `AuthContext` token in portal API calls — portal client uses its own token; mixing auth contexts is a security vulnerability
- Applying branding CSS variables to `:root` — always scope to `#portal-root` or equivalent container

**DDD / TDD / BDD / Deep Module notes**
- DDD: The client portal is a separate bounded context from the firm app. Data returned by portal endpoints is already filtered by the server to only what the client is permitted to see.
- TDD: MSW returns portal-scoped invoices; assert only those invoices render; simulate "Pay Now" → assert `POST /portal/payments` called with portal JWT; simulate unauthenticated access → assert redirect to `/portal/login`.
- BDD: "As a client, I can log into my portal with a magic link, view my invoices, and pay outstanding balances."
- Deep Module: Each portal page hook uses the portal API client, not the firm API client; `PortalAuthGuard` enforces authentication for all portal pages.

---

### Subtasks

- [ ] FRONT‑PORTAL‑001b.1 (AGENT): Create portal API client instance using portal JWT from `PortalAuthContext`.
  **File(s):** `artifacts/apex-os/src/lib/portalApiClient.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PORTAL‑001b.2 (AGENT): Create portal hooks: `usePortalInvoiceList`, `usePortalProjectList`, `usePortalDocumentList`, `useClientMessages`.
  **File(s):** `artifacts/apex-os/src/hooks/portal/usePortalInvoiceList.ts`, `artifacts/apex-os/src/hooks/portal/usePortalProjectList.ts`, `artifacts/apex-os/src/hooks/portal/usePortalDocumentList.ts`, `artifacts/apex-os/src/hooks/portal/useClientMessages.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PORTAL‑001b.3 (AGENT): Build portal layout, `PortalAuthGuard`, and `ClientDashboard` with metrics and recent items.
  **File(s):** `artifacts/apex-os/src/pages/portal/ClientDashboard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PORTAL‑001b.4 (AGENT): Build `PortalInvoices`, `PortalProjects`, `PortalDocuments`, and `PortalMessages` pages; apply portal branding on container.
  **File(s):** `artifacts/apex-os/src/pages/portal/PortalInvoices.tsx`, `artifacts/apex-os/src/pages/portal/PortalProjects.tsx`, `artifacts/apex-os/src/pages/portal/PortalDocuments.tsx`, `artifacts/apex-os/src/pages/portal/PortalMessages.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑PORTAL‑001b.5 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/portal-client.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- portal-client.test.tsx` → GREEN.

- [ ] FRONT‑PORTAL‑001b.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INT‑PORTAL: Portal Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No portal mutations are wired. Messaging, permission management, branding updates, and payment actions are all non-functional.
**Size:** Medium

**Description:** Wire all portal mutations for both firm and client sides: firm sends message / client replies, permission grant/revoke, branding config update, and client payment. All mutations show sonner toast feedback.

**Depends on:** FRONT‑PORTAL‑001a, FRONT‑PORTAL‑001b, FRONT‑AUTH‑003, FRONT‑INFRA‑003
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/Portal.tsx`, `artifacts/apex-os/src/pages/portal/PortalMessages.tsx`, `artifacts/apex-os/src/hooks/portal/`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; `toast` from `sonner`; `useForm` from `react-hook-form`
- Exports: `useSendFirmMessage()`, `useSendClientMessage()`, `useGrantPermission()`, `useRevokePermission()`, `useUpdatePortalBranding()`, `usePortalPayment()`

**Definition of Done**
- [ ] Firm messaging: "Send" button in firm-side messages tab → `useSendFirmMessage` mutation → thread refetches; unread badge resets; `toast.success`
- [ ] Client messaging: reply input in `PortalMessages` → `useSendClientMessage` mutation (uses portal API client) → thread refetches
- [ ] Permission management: each toggle in Permissions tab → `useGrantPermission` / `useRevokePermission` with optimistic update; rollback on error
- [ ] Branding config: logo upload + colour picker in firm-side Branding tab → `useUpdatePortalBranding` mutation → saves logo (via existing `FileUpload`) and CSS variable values; `toast.success` on save
- [ ] Client payment: "Pay Now" button on portal invoice → `usePortalPayment` mutation → payment amount confirmation dialog → submit → success screen with receipt
- [ ] All mutations disable the relevant button during `isPending`
- [ ] Integration tests with MSW cover all 5 mutation flows

**Out of Scope**
- Real-time message push (WebSocket — Phase 7+)
- Automated payment receipts via email (Phase 7+)
- Stripe payment integration (Phase 7+; `usePortalPayment` calls the API which handles payment provider in Phase 7)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/portal/useSendFirmMessage.ts`, `artifacts/apex-os/src/hooks/portal/useSendClientMessage.ts`, `artifacts/apex-os/src/hooks/portal/useUpdatePortalBranding.ts`, `artifacts/apex-os/src/hooks/portal/usePortalPayment.ts`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/portal-interactive.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — comment out mutation wiring; buttons show "coming soon" tooltip
- Halt condition: if `usePortalPayment` can be called without `make_payments` permission (bypassing permission check), stop and add permission guard to the mutation hook

**Rules to Follow**
- Client-side mutations (`useSendClientMessage`, `usePortalPayment`) must use the portal API client (portal JWT) — never the firm API client
- `usePortalPayment` must show the payment amount in the confirmation dialog before submitting — no silent payments
- Branding logo is uploaded as a file (not base64) — use the existing `useUploadDocument` mechanism scoped to `portal-branding` folder

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- portal-interactive.test.tsx
```

**Advanced Code Patterns**
- Thread optimistic update: append the new message to the conversation cache immediately; roll back if the mutation fails
- Branding update: after `useUpdatePortalBranding` succeeds, inject the new CSS variables on `#portal-root` immediately — do not wait for a page reload

**Anti-Patterns**
- Using the firm auth token for client-side portal mutations — always use the portal token from `PortalAuthContext`
- Silent payment submission without confirmation — always show amount and confirm before calling `usePortalPayment`

**DDD / TDD / BDD / Deep Module notes**
- DDD: Portal messaging is a Communication aggregate shared between two bounded contexts (firm and client portal). Permission changes are domain commands on the PortalAccess value object.
- TDD: Simulate firm message send → assert `POST /portal/messages` called with firm token; simulate client reply → assert `POST /portal/messages` called with portal token; simulate pay → assert confirmation dialog shown → confirm → assert `POST /portal/payments` called.
- BDD: "As a firm user, I can message clients through the portal. As a client, I can reply and pay invoices directly in the portal."
- Deep Module: Each mutation hook hides auth token selection, cache invalidation, and optimistic update logic; the page components just call hooks.

---

### Subtasks

- [ ] FRONT‑INT‑PORTAL.1 (AGENT): Implement `useSendFirmMessage` and `useSendClientMessage` mutations with optimistic thread update.
  **File(s):** `artifacts/apex-os/src/hooks/portal/useSendFirmMessage.ts`, `artifacts/apex-os/src/hooks/portal/useSendClientMessage.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑PORTAL.2 (AGENT): Wire permission grant/revoke mutations with optimistic toggle update.
  **File(s):** `artifacts/apex-os/src/hooks/portal/useGrantPermission.ts`, `artifacts/apex-os/src/hooks/portal/useRevokePermission.ts`, `artifacts/apex-os/src/pages/Portal.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑PORTAL.3 (AGENT): Implement `useUpdatePortalBranding` and `usePortalPayment` mutations; wire branding tab and portal invoice pay button.
  **File(s):** `artifacts/apex-os/src/hooks/portal/useUpdatePortalBranding.ts`, `artifacts/apex-os/src/hooks/portal/usePortalPayment.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑PORTAL.4 (AGENT): Write integration tests for all 5 mutation flows.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/portal-interactive.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- portal-interactive.test.tsx` → GREEN.

- [ ] FRONT‑INT‑PORTAL.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

