# TODO-P5-CRM.md – Phase 5: CRM Frontend Integration

Replaces all mock data in the CRM page with real API-backed React Query hooks and wires all interactive mutations (lead stage changes, contact/company CRUD, deal pipeline, activity logging, lead conversion, and duplicate detection). Depends on Phase 3 CRM API routes being green.

---

## [ ] FRONT‑CRM‑001: CRM Lead Pipeline – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/CRM.tsx` imports leads directly from `src/data/mockData.ts`. No `useLeadList` hook exists. The Kanban columns are built from hardcoded stage names.
**Size:** Small

**Description:** Create a `useLeadList` hook backed by `API-CRM-005` and replace all mock lead data in the CRM Kanban view. Columns are built dynamically from the pipeline stage configuration. Drag-and-drop calls `useUpdateLead` with optimistic updates and rollback on failure.

**Depends on:** API‑CRM‑005 (leads API endpoint green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** FRONT‑INT‑CRM
**Related Files:** `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/hooks/crm/useLeadList.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`; generated API client for `GET /api/v1/leads`, `PATCH /api/v1/leads/:id`
- Exports: `useLeadList(filters?)` hook; `useUpdateLead()` mutation hook

**Definition of Done**
- [ ] `src/hooks/crm/useLeadList.ts` created; calls `GET /api/v1/leads` with stage filter; returns `{ leads, isLoading, isError }`
- [ ] CRM Kanban columns built dynamically from pipeline stage config returned by the API (not hardcoded)
- [ ] `useUpdateLead` mutation performs optimistic stage change; rolls back on API error; shows sonner toast on both success and failure
- [ ] All `mockData` imports removed from `CRM.tsx` — file has zero mock data references
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass: leads render in correct columns; drag-and-drop calls mutation; rollback occurs on simulated failure

**Out of Scope**
- Lead creation form (FRONT‑INT‑CRM)
- Contact/company views (FRONT‑CRM‑002)
- Lead scoring display (Phase 10)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/hooks/crm/useLeadList.ts`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/crm-kanban.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `useLeadList.ts`; revert `CRM.tsx` to restore mock imports
- Halt condition: if drag-and-drop optimistic update leaves the UI in a broken state after rollback, revert to non-optimistic update pattern

**Rules to Follow**
- Use TanStack Query for all API calls — no `fetch()` or `axios` directly in components
- Implement optimistic updates: call `queryClient.setQueryData` immediately; roll back in `onError` using the snapshot taken in `onMutate`
- Stage column order must come from the API pipeline config, not be hardcoded in the component
- After a successful stage change, call `queryClient.invalidateQueries(['leads'])` to sync with server

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- crm-kanban.test.tsx
```

**Advanced Code Patterns**
- TanStack Query optimistic update pattern: `onMutate` snapshot → `onError` rollback → `onSettled` invalidate
- Kanban drag-and-drop with `@dnd-kit/core` or `react-beautiful-dnd` — wire `onDragEnd` to `useUpdateLead`
- Use `useQuery` `select` option to group leads by stage, avoiding re-grouping logic in the component

**Anti-Patterns**
- Hardcoded stage names in component — breaks when pipeline config changes
- Not implementing rollback — leads appear to move even when API rejects the change
- Missing loading skeletons — blank columns during initial fetch confuse users

**DDD / TDD / BDD / Deep Module notes**
- DDD: Frontend Lead entity view; stage transitions respect domain rules via API mutations — no client-side business logic for stage validity.
- TDD: Write MSW handler returning leads in two stages; test Kanban renders them in correct columns; simulate drag → assert mutation called with new stage.
- BDD: "As a firm user, I can drag a lead card to a new stage and see it move immediately; if the save fails, it returns to its original stage."
- Deep Module: `useLeadList` hides API call, pagination, and filter logic; `CRM.tsx` just calls `useLeadList({ stage })` and gets typed lead arrays.

---

### Subtasks

- [ ] FRONT‑CRM‑001.0.25 (AGENT): Read `CRM.tsx` in full and list every `mockData` reference and the stage/column structure.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑001.1 (AGENT): Create `useLeadList` hook with stage filter and pagination.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useLeadList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑001.2 (AGENT): Replace mock leads in Kanban with API data; build columns from pipeline config; add loading skeleton.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** `pnpm run typecheck` passes; no `mockData` references remain.

- [ ] FRONT‑CRM‑001.3 (AGENT): Wire drag-and-drop to `useUpdateLead` mutation with optimistic update and rollback.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/hooks/crm/useUpdateLead.ts`
  **Verification:** `pnpm --filter @workspace/apex-os test -- crm-kanban.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑002: CRM Contacts & Companies – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Contact and company tables in CRM use mock data. No `useContactList` or `useCompanyList` hooks exist.
**Size:** Small

**Description:** Create `useContactList` and `useCompanyList` hooks backed by `API-CRM-009` / `API-CRM-013`. Replace mock data in contact and company table views; add search, sort, pagination, and soft-delete actions.

**Depends on:** API‑CRM‑009 (contacts API green), API‑CRM‑013 (companies API green), FRONT‑CRM‑001
**Blocks:** FRONT‑INT‑CRM
**Related Files:** `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/hooks/crm/useContactList.ts`, `artifacts/apex-os/src/hooks/crm/useCompanyList.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; API client for `GET /api/v1/contacts`, `GET /api/v1/companies`
- Exports: `useContactList(filters?)`, `useCompanyList(filters?)`

**Definition of Done**
- [ ] `useContactList` and `useCompanyList` hooks created with search/sort/pagination params
- [ ] Contact table displays: name, email, phone, `assigned_to`, `visibility`, `created_at`
- [ ] Company table displays: name, domain, size, assigned_to, contact count
- [ ] Soft-delete action available per row (via `FRONT‑INFRA‑004` undo pattern)
- [ ] All mock data imports removed from contact/company view components
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Contact/company creation forms (FRONT‑INT‑CRM)
- Contact timeline / activity view (FRONT‑CRM‑003)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/crm/useContactList.ts`, `artifacts/apex-os/src/hooks/crm/useCompanyList.ts`, `artifacts/apex-os/src/pages/CRM.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/crm-contacts.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete the two hook files; revert `CRM.tsx` mock imports
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- Server-side search and sort — never filter/sort in the browser; pass params to the API
- `assigned_to` field shows user display name, not raw UUID — join must be done server-side or by a separate `useUser` lookup
- Soft-delete must use the `useUndoableMutation` pattern from FRONT‑INFRA‑004

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- crm-contacts.test.tsx
```

**Advanced Code Patterns**
- Use `keepPreviousData` so the table doesn't flash empty on page change
- Debounce the search input with `useDeferredValue` (React 19) before passing to the query key

**Anti-Patterns**
- Client-side filtering of all contacts — doesn't scale; always filter server-side
- Re-fetching both lists on every interaction — use targeted `invalidateQueries` keyed by entity type

**DDD / TDD / BDD / Deep Module notes**
- DDD: Contacts and Companies are separate aggregate roots within the CRM bounded context.
- TDD: MSW returns a paginated list of contacts; assert table renders correct rows; assert search refetches with query param.
- BDD: "As a firm user, I can search for a contact by name and see matching results."
- Deep Module: Each hook hides pagination cursor management and filter serialisation.

---

### Subtasks

- [ ] FRONT‑CRM‑002.1 (AGENT): Create `useContactList` and `useCompanyList` hooks with search/sort/pagination.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useContactList.ts`, `artifacts/apex-os/src/hooks/crm/useCompanyList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑002.2 (AGENT): Replace mock data in contact and company tables; display `assigned_to` and `visibility` badges.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** No `mockData` references in contact/company sections.

- [ ] FRONT‑CRM‑002.3 (AGENT): Wire search, sort, and pagination controls to query params.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- crm-contacts.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑002.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑003: CRM Deals & Activities – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Deal pipeline and activity timeline use mock data. No `useDealList` or `useActivityList` hooks exist.
**Size:** Small

**Description:** Create `useDealList` and `useActivityList` hooks; replace mock data in the deals pipeline and activity timeline views. Deal stage changes call `useUpdateDeal` mutation with optimistic updates.

**Depends on:** API‑CRM‑017 (deals API green), API‑CRM‑021 (activities API green), FRONT‑CRM‑001
**Blocks:** FRONT‑INT‑CRM
**Related Files:** `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/hooks/crm/useDealList.ts`, `artifacts/apex-os/src/hooks/crm/useActivityList.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; API clients for deals and activities
- Exports: `useDealList(filters?)`, `useActivityList(entityId, entityType)`, `useUpdateDeal()`

**Definition of Done**
- [ ] `useDealList` and `useActivityList` hooks created
- [ ] Deal pipeline view shows deals grouped by stage; stage-change dropdown calls `useUpdateDeal` mutation with optimistic update
- [ ] Activity timeline shows chronological activity list with type icons and timestamps
- [ ] All mock data imports removed
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Activity creation form (FRONT‑INT‑CRM)
- Deal-to-project conversion (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/crm/useDealList.ts`, `artifacts/apex-os/src/hooks/crm/useActivityList.ts`, `artifacts/apex-os/src/pages/CRM.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/crm-deals.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert `CRM.tsx` mock imports
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- Activity list must support `entityId + entityType` parameters to show activities for a specific lead, contact, or deal
- Deal amount must be formatted with the correct currency symbol using `Intl.NumberFormat`

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- crm-deals.test.tsx
```

**Advanced Code Patterns**
- `useActivityList` should accept an array of entity IDs for the timeline view that spans multiple related entities
- Use `IntersectionObserver` inside the activity timeline for infinite scroll without a "Load More" button

**Anti-Patterns**
- Fetching all activities without entity scoping — returns unrelated activities for other clients
- Hardcoded deal stage names in the dropdown — use stage config from the API

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deals are aggregate roots; Activities are domain events logged against any CRM entity.
- TDD: MSW returns deals in two stages; assert pipeline renders them correctly; simulate stage dropdown change → assert mutation called.
- BDD: "As a firm user, I can see deals in their pipeline stage and move them to a new stage."
- Deep Module: `useDealList` hides deal grouping and pagination from the component.

---

### Subtasks

- [ ] FRONT‑CRM‑003.1 (AGENT): Create `useDealList`, `useActivityList`, and `useUpdateDeal` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useDealList.ts`, `artifacts/apex-os/src/hooks/crm/useActivityList.ts`, `artifacts/apex-os/src/hooks/crm/useUpdateDeal.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑003.2 (AGENT): Replace mock data; wire deal stage dropdown and activity timeline.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- crm-deals.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑003.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INT‑CRM: CRM Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No create/update/delete mutations are wired in the CRM page. All forms are non-functional beyond rendering.
**Size:** Medium

**Description:** Wire all CRM create/update/delete mutations: lead creation form → `useCreateLead`; activity logging → `useCreateActivity`; contact and deal CRUD. All mutations show sonner toast feedback. Idempotency keys are generated client-side and reused on retry for payment-adjacent mutations.

**Depends on:** FRONT‑CRM‑001, FRONT‑CRM‑002, FRONT‑CRM‑003, API‑CRM‑005 (routes exist), FRONT‑INFRA‑003 (MSW for tests), FRONT‑INFRA‑004 (undo pattern)
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/hooks/crm/`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; `toast` from `sonner`; `useUndoableMutation` from `FRONT‑INFRA‑004`
- Exports: `useCreateLead()`, `useCreateContact()`, `useCreateDeal()`, `useCreateActivity()`, `useDeleteLead()`, `useDeleteContact()`

**Definition of Done**
- [ ] Create lead form calls `useCreateLead`; on success, invalidates `['leads']` query and shows success toast
- [ ] `useUpdateLead` (from FRONT‑CRM‑001 drag-and-drop) and `useDeleteLead` wired; delete uses `useUndoableMutation`
- [ ] Create/update deal mutations wired to deal form
- [ ] `useCreateActivity` wired to activity creation form
- [ ] All mutation loading states disable the relevant submit button
- [ ] All mutation errors show user-friendly sonner toasts (never raw error objects)
- [ ] Integration tests with MSW cover all create/update/delete paths

**Out of Scope**
- Bulk operations (Phase 6+)
- Import from CSV (Phase 6+)
- Email integration (Phase 4+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/crm/useCreateLead.ts`, `artifacts/apex-os/src/hooks/crm/useDeleteLead.ts`, `artifacts/apex-os/src/hooks/crm/useCreateActivity.ts`, `artifacts/apex-os/src/pages/CRM.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/crm-interactive.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: function-level — comment out mutation wiring; forms revert to display-only
- Halt condition: if any mutation permanently corrupts lead state (e.g., duplicate creation), roll back and fix idempotency key handling

**Rules to Follow**
- Never call `mutate()` more than once per user action — always disable the button during `isPending`
- Query invalidation after successful mutations must be targeted: `['leads']` for lead mutations, `['deals']` for deal mutations — do not invalidate all queries
- Delete actions must use `useUndoableMutation` (FRONT‑INFRA‑004) — no unrecoverable deletes

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- crm-interactive.test.tsx
```

**Advanced Code Patterns**
- Invalidate both `['leads']` and `['dashboard']` after lead creation — keeps dashboard metrics fresh
- Use `useQueryClient().cancelQueries(['leads'])` in `onMutate` to prevent race conditions with in-flight background refetches

**Anti-Patterns**
- Invalidating all queries (`queryClient.invalidateQueries()`) — causes unnecessary refetches across unrelated modules
- Not cancelling in-flight queries before optimistic update — race condition between optimistic state and server response
- Missing `isPending` button disable — allows double-submit

**DDD / TDD / BDD / Deep Module notes**
- DDD: Mutations enforce CRM domain rules through the API; the frontend delegates validation to the backend — only form-level Zod validation is on the client.
- TDD: Integration test with MSW — submit create lead form → assert `POST /api/v1/leads` called with correct payload → assert success toast shown → assert lead appears in Kanban.
- BDD: "As a firm user, I can create a new lead from the CRM page and see it appear in the pipeline immediately."
- Deep Module: Each mutation hook hides the API call, optimistic update, cache invalidation, and toast logic from the calling component.

---

### Subtasks

- [ ] FRONT‑INT‑CRM.0.25 (AGENT): List all CRM forms and buttons that require mutation wiring; map each to its API endpoint.
  *No action — pause until fully understood.*

- [ ] FRONT‑INT‑CRM.1 (AGENT): Implement `useCreateLead`, `useDeleteLead` mutation hooks; wire to lead form and delete button.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useCreateLead.ts`, `artifacts/apex-os/src/hooks/crm/useDeleteLead.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑CRM.2 (AGENT): Implement `useCreateDeal`, `useUpdateDeal` mutation hooks; wire to deal form.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useCreateDeal.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑CRM.3 (AGENT): Implement `useCreateActivity` mutation hook; wire to activity creation form.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useCreateActivity.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑CRM.4 (AGENT): Add sonner toast feedback for all mutation outcomes; write integration tests.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/pages/__tests__/crm-interactive.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- crm-interactive.test.tsx` → GREEN.

- [ ] FRONT‑INT‑CRM.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑004: Lead Conversion UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No lead conversion UI exists. `API-CRM-022` lead conversion endpoint is not wired into the frontend.
**Size:** Small

**Description:** Add a "Convert to Contact" / "Convert to Deal" button on the lead detail panel that opens a wizard modal: select target type, optionally create a new entity, confirm conversion. On success the lead is marked converted and the new entity is linked.

**Depends on:** API‑CRM‑022 (lead conversion API), FRONT‑CRM‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/LeadConversionWizard.tsx`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; Dialog from `@/components/ui/dialog`
- Exports: `LeadConversionWizard` component

**Definition of Done**
- [ ] "Convert" button appears on the lead detail slide-out or lead card context menu
- [ ] Wizard modal: Step 1 — select target type (Contact / Deal / Both); Step 2 — confirm or create new entity; Step 3 — success screen with link to created entity
- [ ] `useConvertLead` mutation fires `POST /api/v1/leads/:id/convert`; on success invalidates `['leads']` and navigates to the new entity
- [ ] `DuplicateConversionError` is caught and shown as an inline error: "This lead has already been converted."
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Bulk lead conversion
- Conversion to Project (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/LeadConversionWizard.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/LeadConversionWizard.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `LeadConversionWizard.tsx`; remove button from lead detail
- Halt condition: if conversion creates duplicate records, stop and verify idempotency on the API side

**Rules to Follow**
- Conversion is irreversible — show a clear warning in Step 2 before the user confirms
- The wizard must close and the lead must be marked "converted" immediately after success (optimistic UI)

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- LeadConversionWizard.test.tsx
```

**Advanced Code Patterns**
- Step-based wizard pattern using a `step` state machine (`'select' | 'confirm' | 'success'`)
- After successful conversion, use Wouter `navigate('/crm/contacts/:id')` to land on the new record

**Anti-Patterns**
- Allowing double-click submission — disable the confirm button during `isPending`
- Not invalidating `['leads']` query after conversion — converted lead stays visible in the pipeline

**DDD / TDD / BDD / Deep Module notes**
- DDD: Lead conversion is a domain event; the API enforces business rules (e.g., duplicate prevention); the UI is a thin wizard over the conversion command.
- TDD: MSW mock returns success → assert lead marked converted; MSW mock returns `DuplicateConversionError` → assert inline error shown.
- BDD: "As a firm user, I can convert a qualified lead to a contact and optionally create a linked deal in one workflow."
- Deep Module: `LeadConversionWizard` hides the multi-step state machine; callers just render `<LeadConversionWizard leadId={id} onClose={fn} />`.

---

### Subtasks

- [ ] FRONT‑CRM‑004.1 (AGENT): Create `LeadConversionWizard` component with 3-step state machine and conversion mutation.
  **File(s):** `artifacts/apex-os/src/components/crm/LeadConversionWizard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑004.2 (AGENT): Wire "Convert" button in lead detail; handle `DuplicateConversionError`.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑004.3 (AGENT): Write component test with MSW (success and duplicate error paths).
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/LeadConversionWizard.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- LeadConversionWizard.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑004.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑005: Duplicate Detection & Merge UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No duplicate detection or merge UI exists. `API-CRM-023` endpoints are not wired.
**Size:** Medium

**Description:** Show a collapsible "Possible Duplicates" panel on lead/contact/company list pages, with a side-by-side merge preview and field survivorship selection. Execute merge via `useMergeRecords` mutation; secondary record is soft-deleted.

**Depends on:** API‑CRM‑023 (duplicate detection & merge API), FRONT‑CRM‑001, FRONT‑CRM‑002
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/DuplicatePanel.tsx`, `artifacts/apex-os/src/components/crm/MergePreview.tsx`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Dialog, Table from shadcn/ui
- Exports: `DuplicatePanel` component, `MergePreview` component

**Definition of Done**
- [ ] `DuplicatePanel` appears as a collapsible section when `GET /api/v1/{entity}/{id}/duplicates` returns candidates
- [ ] `MergePreview` shows side-by-side field comparison with radio buttons for field survivorship
- [ ] "Execute Merge" button fires `POST /api/v1/{entity}/merge`; on success, secondary record disappears and primary is updated
- [ ] Confirmation dialog warns: "This action cannot be undone."
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Automatic merge without user confirmation
- Bulk merge of multiple pairs simultaneously

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/DuplicatePanel.tsx`, `artifacts/apex-os/src/components/crm/MergePreview.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/MergePreview.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete both components; remove `DuplicatePanel` from list pages
- Halt condition: if merge causes data loss beyond the secondary record, stop immediately and report to backend team

**Rules to Follow**
- The merge action is irreversible — always require explicit confirmation dialog; never merge on single click
- Survivorship selection defaults to the primary record's field values; user can override per-field

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- MergePreview.test.tsx
```

**Advanced Code Patterns**
- Lazy-load `DuplicatePanel` only when duplicates exist (avoid rendering an empty panel)
- Use a `survivor` state object `{ [fieldName]: 'primary' | 'secondary' }` to track per-field selections

**Anti-Patterns**
- Showing duplicate panel unconditionally — adds visual noise when no duplicates exist
- Not invalidating the entity list after merge — secondary record remains visible

**DDD / TDD / BDD / Deep Module notes**
- DDD: Duplicate detection and merge are cross-entity operations; the API enforces referential integrity during merge.
- TDD: MSW returns two duplicate leads → assert panel shows candidates; simulate merge → assert secondary record removed from list.
- BDD: "As a firm user, I can review possible duplicates for a lead and merge them, choosing which field values to keep."
- Deep Module: `DuplicatePanel` handles duplicate loading and display; `MergePreview` handles the survivorship UI; callers just pass entity type and ID.

---

### Subtasks

- [ ] FRONT‑CRM‑005.1 (AGENT): Implement `DuplicatePanel` with duplicate candidate list and `useDuplicates` query hook.
  **File(s):** `artifacts/apex-os/src/components/crm/DuplicatePanel.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑005.2 (AGENT): Implement `MergePreview` with field survivorship selection and `useMergeRecords` mutation.
  **File(s):** `artifacts/apex-os/src/components/crm/MergePreview.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑005.3 (AGENT): Write component test with MSW (duplicates found, merge executed, no duplicates).
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/MergePreview.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- MergePreview.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑005.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## CRM Data Integration

### [ ] FRONT‑CRM‑001: CRM Lead Pipeline – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005 (leads API green).  
**Definition of Done:** Lead Kanban view in `artifacts/apex-os/src/pages/CRM.tsx` uses `useLeadList` hook with stage filtering. Columns dynamically built from pipeline stages. Card drag‑and‑drop wired to `useUpdateLead` mutation. All mock data imports removed from CRM components and hooks. Component tests pass with MSW mocks. Manual testing confirms drag-and-drop functionality works with optimistic updates and rollback on failure.  
**Related Files:** `artifacts/apex-os/src/pages/CRM.tsx`, potential extracted lead components.

**DDD:** Frontend Lead entity view (not aggregate - frontend manages presentation, domain logic lives in backend); stage changes respect domain rules via API mutations.  
**Deep Module:** CRM frontend forms a cohesive presentation layer that encapsulates lead state management, stage transitions, and user interactions. The module hides API complexity behind React Query hooks and provides a consistent interface for lead operations.

**TDD:** Component test with MSW – verify leads render in correct columns; drag‑and‑drop calls update API; rollback on failure.

**Advanced Code Patterns:**
- Optimistic updates with automatic rollback
- Custom hooks for data fetching and mutations
- Drag-and-drop with visual feedback
- Loading states and error boundaries
- Toast notifications for user feedback

**Anti-Patterns:**
- Direct API calls in components (use hooks instead)
- Mock data in production builds
- Unhandled mutation errors
- Missing loading states
- Hardcoded stage names (use dynamic pipeline config)

**Rules to Follow (Frontend):**
- Use TanStack Query for all API calls
- Implement optimistic updates for user actions
- Always show loading states during data fetching
- Handle errors gracefully with user feedback
- Use TypeScript interfaces from generated API types
- Follow component composition patterns
- Test all interactive features with MSW
- Remove all mock data imports before completion

**Subtasks:**
- [ ] FRONT‑CRM‑001.1: Create `useLeadList` hook with stage filtering and pagination. (AGENT) – `src/hooks/crm/useLeadList.ts`  
  **verification:** `npm test -- useLeadList.test.ts` - passes with typed lead data and stage filtering.
- [ ] FRONT‑CRM‑001.2: Replace mock leads in Kanban columns with API data; show loading skeleton during fetch. (AGENT)  
  **verification:** `npm run dev -- --port 3000 && npm test -- crm-kanban.test.tsx` - leads appear in correct stage columns; empty stage shows empty state.
- [ ] FRONT‑CRM‑001.3: Wire drag‑and‑drop to `useUpdateLead` mutation with optimistic update and rollback on failure. (AGENT)  
  **verification:** `npm test -- crm-drag-drop.test.tsx` - drag lead to new column → stage updates immediately; API error → card returns to original column; toast notification shown.

---

### [ ] FRONT‑CRM‑002: CRM Contacts & Companies – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑009 (contacts green), API‑CRM‑013 (companies green).  
**Definition of Done:** Contact and Company tables use `useContactList` and `useCompanyList` hooks. Search, sort, and pagination implemented. Soft‑delete actions wired. Ownership and visibility fields displayed.

**Subtasks:**
- [ ] FRONT‑CRM‑002.1: Create hooks `useContactList`, `useCompanyList`. (AGENT)  
- [ ] FRONT‑CRM‑002.2: Replace mock contact/company data in tables. (AGENT)  
- [ ] FRONT‑CRM‑002.3: Wire table sorting, searching, and pagination. (AGENT)  
- [ ] FRONT‑CRM‑002.4: Display `assigned_to` and `visibility` badges. (AGENT)

---

### [ ] FRONT‑CRM‑003: CRM Deals & Activities – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑017 (deals green), API‑CRM‑021 (activities green).  
**Definition of Done:** Deal pipeline and activity timeline use `useDealList` and `useActivityList` hooks. Deal stage change via dropdown wired to mutation.

**Subtasks:**
- [ ] FRONT‑CRM‑003.1: Create hooks and replace mock data. (AGENT)  
- [ ] FRONT‑CRM‑003.2: Wire deal stage change mutation with optimistic update. (AGENT)

---

### [ ] FRONT‑INT‑CRM: CRM Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑CRM‑001, FRONT‑CRM‑002, FRONT‑CRM‑003, API‑CRM‑005 (routes exist).  
**Definition of Done:**
- Drag‑and‑drop lead stage change calls `useUpdateLead` mutation (optimistic update: move card immediately, rollback on failure).
- Create lead form uses `useCreateLead` mutation, on success invalidates lead list.
- Deal stage change wired similarly.
- Activity creation form hooks to `useCreateActivity`.
- All mutation loading/error states displayed using toast notifications (sonner).
- **Idempotency Key Reuse:** Frontend must store generated idempotency key in component state and retransmit same key on retry attempts for payment mutations; persists until success.
- All interactive features tested with MSW mocks.
- Error handling provides clear user feedback.

**Deep Module:** CRM interactive features module encapsulates all user interactions, mutation handling, and state management. The module provides a unified interface for CRM operations while hiding the complexity of API calls, optimistic updates, and error handling behind well-defined hooks and components.

**TDD:** Integration tests with MSW verify all interactive features work correctly. Tests cover drag-and-drop operations, form submissions, mutation success/failure scenarios, and toast notifications. Each interaction is tested for both success and error paths.

**Anti-Patterns (Frontend):**
- Manual state management instead of React Query
- Direct DOM manipulation for drag-and-drop
- Missing optimistic updates
- Unhandled mutation errors
- Inconsistent error handling patterns
- Hardcoded API endpoints
- Missing loading states during mutations
- Not invalidating queries after successful mutations

**Subtasks:**
- [ ] FRONT‑INT‑CRM.1: Wire `useCreateLead`, `useUpdateLead`, `useDeleteLead` to forms and drag‑and‑drop. (AGENT)  
- [ ] FRONT‑INT‑CRM.2: Wire `useCreateDeal`, `useUpdateDeal` mutations. (AGENT)  
- [ ] FRONT‑INT‑CRM.3: Wire `useCreateActivity` to activity creation form. (AGENT)  
- [ ] FRONT‑INT‑CRM.4: Add toast feedback for all mutation outcomes. (AGENT)

---

### [ ] FRONT‑CRM‑004: Lead Conversion UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑022 (lead conversion API).  
**Definition of Done:** "Convert to Contact" / "Convert to Deal" button on lead detail fires a wizard modal: selects target type, optionally creates new entity, confirms conversion. Success: lead marked converted, new entity created, activity logged. Failure: error message displayed.  
**Related Files:** `artifacts/apex-os/src/components/crm/LeadConversionWizard.tsx`

**Subtasks:**
- [ ] FRONT‑CRM‑004.1: Create `LeadConversionWizard` component with step‑by‑step flow. (AGENT)  
- [ ] FRONT‑CRM‑004.2: Wire to `useConvertLead` mutation; handle duplicate conversion error. (AGENT)  
- [ ] FRONT‑CRM‑004.3: Add component test with MSW. (AGENT)

---

### [ ] FRONT‑CRM‑005: Duplicate Detection & Merge UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑023 (duplicate detection & merge API).  
**Definition of Done:** Duplicate candidates shown as a collapsible panel on lead/contact/company list pages. Preview merge: side‑by‑side comparison of fields with survivorship selection. Execute merge: secondary record soft‑deleted, references updated. Confirmation dialog with undo note (merge cannot be undone, but can be reviewed).  
**Related Files:** `artifacts/apex-os/src/components/crm/DuplicatePanel.tsx`, `MergePreview.tsx`

**Subtasks:**
- [ ] FRONT‑CRM‑005.1: Implement duplicate panel and merge preview UI. (AGENT)  
- [ ] FRONT‑CRM‑005.2: Wire to `useMergeRecords` mutation. (AGENT)  
- [ ] FRONT‑CRM‑005.3: Component test with MSW. (AGENT)

---

### [ ] FRONT‑CRM‑006: Follow‑Up Task Management UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑024 (CRM follow‑up tasks API).  
**Definition of Done:** "Tasks" tab on lead/contact/deal detail shows list of CRM follow‑up tasks with due dates, assignees, and completion checkboxes. Create task form with entity pre‑linked. Mark complete, edit, delete.

**Subtasks:**
- [ ] FRONT‑CRM‑006.1: Implement CRM task list and create/edit forms. (AGENT)  
- [ ] FRONT‑CRM‑006.2: Wire to `useCRMTaskList`, `useCreateCRMTask`, `useUpdateCRMTask` hooks. (AGENT)  
- [ ] FRONT‑CRM‑006.3: Component test. (AGENT)

---

### [ ] FRONT‑CRM‑007: Email Mailbox Connection UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑028 (mailbox connection API).  
**Definition of Done:** Settings area (or CRM settings) where user connects Google/Outlook mailbox via OAuth. Displays connection status (active, error, sync cursor, last sync). Disconnect button.

**Subtasks:**
- [ ] FRONT‑CRM‑007.1: Implement mailbox connection management UI. (AGENT)  
- [ ] FRONT‑CRM‑007.2: Wire OAuth flow and connection status hooks. (AGENT)

---

### [ ] FRONT‑CRM‑008: CRM Email Inbox UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑029 (CRM email sync & inbox API).  
**Definition of Done:** Unified inbox view showing all synced email threads. Clicking a thread shows messages. Compose/reply form links to CRM records (lead, contact, deal). Sent messages logged as activities.

**Subtasks:**
- [ ] FRONT‑CRM‑008.1: Implement inbox thread list and message detail views. (AGENT)  
- [ ] FRONT‑CRM‑008.2: Wire compose/reply with linked entity. (AGENT)

---

### [ ] FRONT‑CRM‑009: CRM Email Template Management UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑030 (CRM email template library API).  
**Definition of Done:** Template editor with variable insertion (`{{contact.first_name}}`). Category filter (intro, follow‑up, proposal, contract). Preview with sample data.

**Subtasks:**
- [ ] FRONT‑CRM‑009.1: Implement template list, editor, and preview. (AGENT)  
- [ ] FRONT‑CRM‑009.2: Wire CRUD hooks. (AGENT)

---

### [ ] FRONT‑CRM‑010: Engagement Management UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑031 (engagement aggregate API).  
**Definition of Done:** Engagements tab shows proposals, contracts, and renewals with status indicators. Create engagement from contact/deal. Status transitions via button (Send, Accept, Reject).

**Subtasks:**
- [ ] FRONT‑CRM‑010.1: Build engagement list and detail views. (AGENT)  
- [ ] FRONT‑CRM‑010.2: Wire mutations for status transitions. (AGENT)

---

### [ ] FRONT‑CRM‑011: Renewal Lifecycle UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑033 (renewal lifecycle API).  
**Definition of Done:** Renewal dashboard showing upcoming renewals with countdown indicators. Action buttons: mark as renewed, extend, or cancel. Filter by status and date range.

**Subtasks:**
- [ ] FRONT‑CRM‑011.1: Implement renewal dashboard and action flows. (AGENT)  
- [ ] FRONT‑CRM‑011.2: Wire to renewal hooks. (AGENT)

---

### [ ] FRONT‑CRM‑012: Contact 360 Workspace
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑026 (360° workspace endpoints).  
**Definition of Done:** Full‑page contact detail with tabs: Overview (profile, ownership), Activity Timeline (chronological feed), Deals (linked deals with stage), Documents (linked documents), Tasks (follow‑up tasks). Quick actions: email, schedule meeting, add task, convert from lead.

**Subtasks:**
- [ ] FRONT‑CRM‑012.1: Implement Contact 360 page with tabbed layout. (AGENT)  
- [ ] FRONT‑CRM‑012.2: Wire each tab to corresponding aggregate API. (AGENT)

---

### [ ] FRONT‑CRM‑013: Company 360 Workspace
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑026.  
**Definition of Done:** Company workspace showing linked contacts (sortable), open deals, revenue summary, engagement history, document summary, and ownership. Quick actions: add contact, create deal, schedule meeting.

**Subtasks:**
- [ ] FRONT‑CRM‑013.1: Implement Company 360 page. (AGENT)  
- [ ] FRONT‑CRM‑013.2: Wire to company workspace API. (AGENT)

---

### [ ] FRONT‑CRM‑014: Deal Workspace
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑026.  
**Definition of Done:** Deal workspace with pipeline stage, linked contacts, next steps, documents, proposal/engagement actions, forecast metadata (expected close, probability, amount). Stage progression bar with current stage highlighted.

**Subtasks:**
- [ ] FRONT‑CRM‑014.1: Implement Deal workspace page. (AGENT)  
- [ ] FRONT‑CRM‑014.2: Wire to deal workspace API. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: CRM components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: CRM pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard CRM metrics depend on CRM API integration
- **TODO-P5-DOCUMENTS.md**: CRM document links depend on Documents integration

### Related Master Tracker Tasks
- **API‑CRM‑005**: Leads API must be green before FRONT‑CRM‑001
- **API‑CRM‑009/013**: Contacts/Companies APIs must be green before FRONT‑CRM‑002
- **API‑CRM‑017/021**: Deals/Activities APIs must be green before FRONT‑CRM‑003

---

## Verification Commands

### CRM Integration Verification
```bash
# Core CRM verification
npm test -- useLeadList.test.ts
npm test -- useContactList.test.ts
npm test -- useCompanyList.test.ts
npm test -- useDealList.test.ts
npm test -- useActivityList.test.ts

# Interactive features verification
npm test -- crm-interactive.test.tsx

# Advanced features verification
npm test -- lead-conversion.test.tsx
npm test -- duplicate-detection.test.tsx
npm test -- crm-tasks.test.tsx

# Workspace verification
npm test -- contact-360.test.tsx
npm test -- company-360.test.tsx
npm test -- deal-workspace.test.tsx

# Manual verification
# Navigate to CRM page, verify all data loads from API
# Test drag-and-drop lead stage changes
# Test create/edit/delete operations
# Test advanced features (conversion, duplicates, etc.)
```

---

## Completion Criteria

### CRM Frontend Integration Complete When:
1. All CRM data (leads, contacts, companies, deals, activities) loads from APIs
2. Interactive features work with optimistic updates and rollback on failure
3. Advanced CRM features (conversion, duplicates, email, tasks) are functional
4. 360° workspaces provide comprehensive entity views
5. All mock data imports are removed from CRM components
6. Component tests pass with MSW mocks
7. Manual testing confirms complete CRM functionality
8. Error handling provides clear feedback and recovery paths

**Estimated Timeline:** 8-10 days with parallel execution
