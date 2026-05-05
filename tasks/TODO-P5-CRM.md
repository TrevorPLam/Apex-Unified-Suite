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

## [ ] FRONT‑CRM‑006: Follow‑Up Task Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No CRM follow-up task UI exists. `API-CRM-024` endpoints are not wired into the frontend.
**Size:** Medium

**Description:** Implement a "Tasks" tab on lead/contact/deal detail pages showing CRM follow-up tasks with due dates, assignees, priority levels, and completion checkboxes. Include task creation form with entity pre-linking, inline editing, and task status management.

**Depends on:** API‑CRM‑024 (CRM follow‑up tasks API green), FRONT‑CRM‑001, FRONT‑CRM‑002
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/TaskList.tsx`, `artifacts/apex-os/src/components/crm/TaskForm.tsx`, `artifacts/apex-os/src/hooks/crm/useCRMTaskList.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Checkbox, Badge from shadcn/ui; DatePicker from `@/components/ui/date-picker`
- Exports: `TaskList` component, `TaskForm` component, `useCRMTaskList`, `useCreateCRMTask`, `useUpdateCRMTask` hooks

**Definition of Done**
- [ ] "Tasks" tab appears on lead/contact/deal detail pages with task count badge
- [ ] Task list displays: title, due date (with overdue highlighting), assignee avatar/name, priority badge, completion checkbox
- [ ] Create task form pre-links to current entity (lead/contact/deal) with title, description, due date, assignee, priority
- [ ] Inline editing allows quick task title updates and status changes
- [ ] Task completion toggles checkbox and updates status via `useUpdateCRMTask`
- [ ] Overdue tasks shown with red accent and priority sorting
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Project task management (different context)
- Recurring task patterns (Phase 6+)
- Task templates and automation (Phase 6+)
- Task dependencies and Gantt charts

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Task creation must validate assignee is active user in the firm

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/TaskList.tsx`, `artifacts/apex-os/src/components/crm/TaskForm.tsx`, `artifacts/apex-os/src/hooks/crm/useCRMTaskList.ts`, `artifacts/apex-os/src/hooks/crm/useCreateCRMTask.ts`, `artifacts/apex-os/src/hooks/crm/useUpdateCRMTask.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/TaskList.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete task components and hooks; remove Tasks tab from entity detail pages
- Halt condition: if task creation creates orphaned tasks (no entity linkage), stop and fix entity pre-linking logic

**Rules to Follow**
- Task due dates must use local timezone formatting with clear relative indicators ("Due in 2 days", "Overdue by 3 days")
- Priority levels: High (red), Medium (yellow), Low (gray) — use consistent color coding
- Assignee selection must filter to active firm users only
- Task completion must show optimistic UI update with rollback on API error

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- TaskList.test.tsx
```

**Advanced Code Patterns**
- Use `useQuery` `select` option to sort tasks by due date and priority automatically
- Implement virtual scrolling for task lists with 100+ tasks using `react-window`
- Use `useMutation` `onMutate` for optimistic task completion with instant checkbox feedback

**Anti-Patterns**
- Hardcoding user list for assignee dropdown — always fetch from users API
- Storing task dates as strings instead of Date objects — use proper Date serialization
- Missing timezone handling — always display dates in user's local timezone

**DDD / TDD / BDD / Deep Module notes**
- DDD: CRM Tasks are domain entities within the CRM bounded context, linked to core CRM entities (leads/contacts/deals). Tasks represent follow-up actions and commitments.
- TDD: MSW returns tasks with different due dates → assert overdue highlighting works; simulate task completion → assert checkbox updates and API called.
- BDD: "As a firm user, I can view and manage follow-up tasks for a lead, mark them complete, and create new tasks that are automatically linked to the lead."
- Deep Module: `TaskList` component handles task display, sorting, and user interactions; `useCRMTaskList` hides API complexity and provides typed task data.

---

### Subtasks

- [ ] FRONT‑CRM‑006.0.25 (AGENT): Read existing task management patterns in the codebase and verify `API-CRM-024` schema.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑006.1 (AGENT): Create `useCRMTaskList`, `useCreateCRMTask`, and `useUpdateCRMTask` hooks with proper typing.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useCRMTaskList.ts`, `artifacts/apex-os/src/hooks/crm/useCreateCRMTask.ts`, `artifacts/apex-os/src/hooks/crm/useUpdateCRMTask.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑006.2 (AGENT): Implement `TaskList` component with sorting, filtering, and completion toggles.
  **File(s):** `artifacts/apex-os/src/components/crm/TaskList.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑006.3 (AGENT): Implement `TaskForm` component with entity pre-linking and validation.
  **File(s):** `artifacts/apex-os/src/components/crm/TaskForm.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑006.4 (AGENT): Integrate Tasks tab into lead/contact/deal detail pages.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** Tasks tab appears and functions correctly.

- [ ] FRONT‑CRM‑006.5 (AGENT): Write component tests with MSW for task CRUD operations.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/TaskList.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- TaskList.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑006.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑007: Email Mailbox Connection UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No email mailbox connection UI exists. `API-CRM-028` endpoints are not wired. OAuth 2.0 authentication standards for 2026 require modern token-based auth.
**Size:** Medium

**Description:** Implement mailbox connection management in CRM settings where users connect Google/Outlook mailboxes via OAuth 2.0 token-based authentication. Display connection status (active, error, sync cursor, last sync), provide disconnect functionality, and handle token refresh automatically.

**Depends on:** API‑CRM‑028 (mailbox connection API green), FRONT‑CRM‑001, FRONT‑AUTH‑002
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/MailboxConnection.tsx`, `artifacts/apex-os/src/hooks/crm/useMailboxConnection.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Button, Card from shadcn/ui; OAuth provider SDKs (Google, Microsoft)
- Exports: `MailboxConnection` component, `useMailboxConnection`, `useDisconnectMailbox` hooks

**Definition of Done**
- [ ] Mailbox connection section appears in CRM settings with "Connect Email" buttons for Google and Outlook
- [ ] OAuth 2.0 flow redirects to provider's official login portal (Microsoft, Google) — no password handling in frontend
- [ ] Connection status displays: provider icon, email address, connection state (Active/Error), last sync time, sync cursor position
- [ ] Error handling shows clear messages for: revoked access, expired tokens, network failures, quota exceeded
- [ ] Disconnect button available with confirmation dialog ("This will stop email sync and remove access tokens")
- [ ] Token refresh handled automatically in background without user intervention
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Multiple mailbox connections per user (Phase 6+)
- Custom IMAP/SMTP configuration (enterprise only)
- Email synchronization settings (folders to sync, etc.)
- Email signature management

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never store email passwords or OAuth tokens in localStorage — tokens managed server-side only
- OAuth client secrets must be server-side only — never exposed to frontend

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/MailboxConnection.tsx`, `artifacts/apex-os/src/hooks/crm/useMailboxConnection.ts`, `artifacts/apex-os/src/hooks/crm/useDisconnectMailbox.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/MailboxConnection.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete mailbox connection components and hooks; remove connection section from CRM settings
- Halt condition: if OAuth flow exposes client secrets or stores tokens insecurely, stop immediately and fix security implementation

**Rules to Follow**
- OAuth 2.0 implementation must follow 2026 security standards: token-based auth with limited lifetimes and provider-specific scopes
- Connection status must update in real-time via WebSocket or polling (not require page refresh)
- Error messages must be user-friendly and actionable ("Reconnect your mailbox" vs technical OAuth errors)
- Disconnect action must be immediate and revoke server-side tokens

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- MailboxConnection.test.tsx
```

**Advanced Code Patterns**
- Use `useQueryClient` `invalidateQueries(['mailboxStatus'])` for real-time status updates after connection/disconnect
- Implement OAuth popup handling with `window.open()` and `postMessage` for secure token exchange
- Use `useMutation` `onError` with specific error type handling for OAuth vs API errors

**Anti-Patterns**
- Storing OAuth tokens in localStorage or sessionStorage — tokens must be server-side only
- Handling email passwords directly in frontend — always use OAuth 2.0 provider flows
- Missing automatic token refresh — implement background refresh to prevent connection failures
- Hardcoding OAuth client IDs — use environment variables with proper validation

**DDD / TDD / BDD / Deep Module notes**
- DDD: Mailbox Connection is a domain service within the CRM bounded context, managing external email provider integrations and authentication state.
- TDD: MSW mocks OAuth flow → assert redirect to provider occurs; mock connection status → assert proper display; simulate token expiry → assert error shown.
- BDD: "As a firm user, I can connect my Google Workspace mailbox to CRM via OAuth, see connection status, and disconnect securely when needed."
- Deep Module: `MailboxConnection` component handles OAuth UI flows and status display; `useMailboxConnection` hides OAuth complexity and provides typed connection state.

---

### Subtasks

- [ ] FRONT‑CRM‑007.0.25 (AGENT): Research OAuth 2.0 implementation patterns for Google and Microsoft in 2026.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑007.1 (AGENT): Create `useMailboxConnection` and `useDisconnectMailbox` hooks with OAuth flow handling.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useMailboxConnection.ts`, `artifacts/apex-os/src/hooks/crm/useDisconnectMailbox.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑007.2 (AGENT): Implement `MailboxConnection` component with provider buttons and status display.
  **File(s):** `artifacts/apex-os/src/components/crm/MailboxConnection.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑007.3 (AGENT): Add real-time status updates and error handling for token expiry.
  **File(s):** `artifacts/apex-os/src/components/crm/MailboxConnection.tsx`
  **Verification:** Status updates without page refresh; errors show actionable messages.

- [ ] FRONT‑CRM‑007.4 (AGENT): Integrate mailbox connection into CRM settings page.
  **File(s):** `artifacts/apex-os/src/pages/Settings.tsx`
  **Verification:** Connection section appears and functions correctly.

- [ ] FRONT‑CRM‑007.5 (AGENT): Write component tests with MSW for OAuth flow and status management.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/MailboxConnection.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- MailboxConnection.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑007.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑008: CRM Email Inbox UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No CRM email inbox UI exists. `API-CRM-029` endpoints are not wired.
**Size:** Medium

**Description:** Implement unified inbox view showing all synced email threads from connected mailboxes. Thread list with sender, subject, preview, and timestamp. Message detail view with full email content, attachments, and formatting. Compose/reply forms with CRM entity linking (lead/contact/deal) and automatic activity logging.

**Depends on:** API‑CRM‑029 (CRM email sync & inbox API green), FRONT‑CRM‑007 (mailbox connection), FRONT‑CRM‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/EmailInbox.tsx`, `artifacts/apex-os/src/components/crm/EmailThread.tsx`, `artifacts/apex-os/src/hooks/crm/useEmailInbox.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Rich text editor for compose; Avatar, Badge from shadcn/ui
- Exports: `EmailInbox` component, `EmailThread` component, `EmailComposer` component, `useEmailInbox`, `useSendEmail` hooks

**Definition of Done**
- [ ] Inbox shows threaded email list with sender avatar, subject, preview text, timestamp, and read/unread status
- [ ] Thread view displays full conversation with messages in chronological order, formatted HTML content, and attachments
- [ ] Compose/reply forms include rich text editor, recipient selection, CRM entity linking dropdown
- [ ] Sent emails automatically logged as activities against linked CRM entities
- [ ] Search and filter functionality by sender, subject, date range, and linked CRM entities
- [ ] Real-time updates for new emails without page refresh
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Email scheduling and drafts (Phase 6+)
- Email templates and merge fields (covered in FRONT-CRM-009)
- Bulk email operations (Phase 6+)
- Email analytics and tracking

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Email content must be sanitized before rendering to prevent XSS attacks
- File attachments must have size and type validation

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/EmailInbox.tsx`, `artifacts/apex-os/src/components/crm/EmailThread.tsx`, `artifacts/apex-os/src/components/crm/EmailComposer.tsx`, `artifacts/apex-os/src/hooks/crm/useEmailInbox.ts`, `artifacts/apex-os/src/hooks/crm/useSendEmail.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/EmailInbox.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete email components and hooks; remove inbox from CRM navigation
- Halt condition: if email sending creates duplicate activities or fails to log activities, stop and fix activity logging logic

**Rules to Follow**
- Email content must be sanitized using DOMPurify or similar before rendering
- Entity linking must validate user has access to selected CRM entities
- Thread grouping must use standard email threading headers (Message-ID, References, In-Reply-To)
- Search must be server-side with proper indexing for performance

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- EmailInbox.test.tsx
```

**Advanced Code Patterns**
- Use virtual scrolling for email lists with 1000+ threads using `react-window`
- Implement optimistic UI for sending emails with instant thread update and rollback on failure
- Use WebSockets for real-time email updates without polling

**Anti-Patterns**
- Rendering raw HTML email content without sanitization — XSS vulnerability
- Client-side email search with large datasets — always use server-side search
- Missing activity logging when emails are sent — breaks CRM data integrity
- Not handling email threading correctly — duplicate conversations

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email Inbox is a read model projection of synced email data, integrated with CRM entities through activity logging.
- TDD: MSW returns email threads → assert proper threading display; simulate send email → assert activity logged; test search filtering.
- BDD: "As a firm user, I can view my synced emails in a unified inbox, read full conversations, and compose replies that are automatically logged as CRM activities."
- Deep Module: `EmailInbox` handles email display and interactions; `useEmailInbox` hides email API complexity and provides typed email data.

---

### Subtasks

- [ ] FRONT‑CRM‑008.0.25 (AGENT): Research email UI patterns and threading implementations in modern CRM systems.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑008.1 (AGENT): Create `useEmailInbox` and `useSendEmail` hooks with threading and activity logging.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useEmailInbox.ts`, `artifacts/apex-os/src/hooks/crm/useSendEmail.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑008.2 (AGENT): Implement `EmailInbox` component with thread list and search functionality.
  **File(s):** `artifacts/apex-os/src/components/crm/EmailInbox.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑008.3 (AGENT): Implement `EmailThread` and `EmailComposer` components with entity linking.
  **File(s):** `artifacts/apex-os/src/components/crm/EmailThread.tsx`, `artifacts/apex-os/src/components/crm/EmailComposer.tsx`
  **Verification:** Email rendering and composition work correctly.

- [ ] FRONT‑CRM‑008.4 (AGENT): Add real-time updates and integrate inbox into CRM navigation.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** Inbox appears in CRM and updates in real-time.

- [ ] FRONT‑CRM‑008.5 (AGENT): Write component tests with MSW for email CRUD and activity logging.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/EmailInbox.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- EmailInbox.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑008.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑009: CRM Email Template Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No email template management UI exists. `API-CRM-030` endpoints are not wired.
**Size:** Medium

**Description:** Implement email template library with visual editor supporting variable insertion ({{contact.first_name}}, {{company.name}}, {{deal.amount}}). Category filtering (intro, follow-up, proposal, contract, renewal). Live preview with sample data. Template CRUD operations with usage analytics.

**Depends on:** API‑CRM‑030 (CRM email template library API green), FRONT‑CRM‑008 (email inbox)
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/EmailTemplateEditor.tsx`, `artifacts/apex-os/src/components/crm/EmailTemplateLibrary.tsx`, `artifacts/apex-os/src/hooks/crm/useEmailTemplates.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Rich text editor with variable support; Select, Badge from shadcn/ui
- Exports: `EmailTemplateLibrary` component, `EmailTemplateEditor` component, `useEmailTemplates`, `useCreateEmailTemplate` hooks

**Definition of Done**
- [ ] Template library shows categorized templates with name, subject preview, category badge, and usage count
- [ ] Template editor provides rich text editing with variable insertion dropdown and syntax highlighting
- [ ] Variable system supports: contact fields, company fields, deal fields, custom fields, firm information
- [ ] Live preview panel shows template rendered with sample data as user types
- [ ] Category filtering: Intro, Follow-up, Proposal, Contract, Renewal, Custom
- [ ] Template usage analytics show send count, open rate, click rate (when available)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Advanced template automation and conditional logic (Phase 6+)
- Template A/B testing and analytics (Phase 6+)
- Template approval workflows and permissions
- Bulk template operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Template content must be sanitized to prevent XSS in variable substitution
- Variable validation must prevent infinite loops or circular references

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/EmailTemplateLibrary.tsx`, `artifacts/apex-os/src/components/crm/EmailTemplateEditor.tsx`, `artifacts/apex-os/src/hooks/crm/useEmailTemplates.ts`, `artifacts/apex-os/src/hooks/crm/useCreateEmailTemplate.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/EmailTemplateLibrary.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete template components and hooks; remove template section from CRM settings
- Halt condition: if variable substitution causes XSS or template rendering fails, stop and fix sanitization

**Rules to Follow**
- Variable syntax must use double curly braces: {{entity.field}} with proper validation
- Template content must support both HTML and plain text formats
- Variable substitution must be server-side for security and data consistency
- Template names must be unique within categories

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- EmailTemplateLibrary.test.tsx
```

**Advanced Code Patterns**
- Use Monaco Editor or CodeMirror for template editing with syntax highlighting and autocomplete
- Implement real-time variable validation with error highlighting in the editor
- Use `useMutation` optimistic updates for template CRUD with instant UI feedback

**Anti-Patterns**
- Client-side variable substitution — security risk and data inconsistency
- Hardcoding variable names — use dynamic variable discovery from API
- Missing template validation — allow invalid variable syntax or references
- Not sanitizing template content — XSS vulnerability

**DDD / TDD / BDD / Deep Module notes**
- DDD: Email Templates are domain entities within the CRM bounded context, representing reusable communication patterns with variable substitution.
- TDD: MSW returns templates → assert library displays correctly; test variable insertion → assert syntax validation; test preview → assert sample data renders.
- BDD: "As a firm user, I can create email templates with variables, preview them with sample data, and use them in email composition for consistent communication."
- Deep Module: `EmailTemplateEditor` handles template editing and variable management; `useEmailTemplates` hides template API complexity and provides typed template data.

---

### Subtasks

- [ ] FRONT‑CRM‑009.0.25 (AGENT): Research email template systems and variable substitution patterns.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑009.1 (AGENT): Create `useEmailTemplates` and `useCreateEmailTemplate` hooks with variable validation.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useEmailTemplates.ts`, `artifacts/apex-os/src/hooks/crm/useCreateEmailTemplate.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑009.2 (AGENT): Implement `EmailTemplateLibrary` component with categorization and search.
  **File(s):** `artifacts/apex-os/src/components/crm/EmailTemplateLibrary.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑009.3 (AGENT): Implement `EmailTemplateEditor` with rich text editing and variable insertion.
  **File(s):** `artifacts/apex-os/src/components/crm/EmailTemplateEditor.tsx`
  **Verification:** Template editing and variable insertion work correctly.

- [ ] FRONT‑CRM‑009.4 (AGENT): Add live preview and integrate template library into email composer.
  **File(s):** `artifacts/apex-os/src/components/crm/EmailComposer.tsx`
  **Verification:** Templates appear in email composer and preview correctly.

- [ ] FRONT‑CRM‑009.5 (AGENT): Write component tests with MSW for template CRUD and variable substitution.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/EmailTemplateLibrary.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- EmailTemplateLibrary.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑009.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑010: Engagement Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No engagement management UI exists. `API-CRM-031` endpoints are not wired.
**Size:** Medium

**Description:** Implement Engagements tab on contact/company/deal pages showing proposals, contracts, and renewals with status indicators. Create engagement from CRM entities. Status transition buttons (Send, Accept, Reject, Expire). Document preview and e-signature integration. Revenue tracking and forecasting.

**Depends on:** API‑CRM‑031 (engagement aggregate API green), FRONT‑CRM‑002, FRONT‑CRM-003
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/EngagementList.tsx`, `artifacts/apex-os/src/components/crm/EngagementDetail.tsx`, `artifacts/apex-os/src/hooks/crm/useEngagements.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Badge, Button from shadcn/ui; Document viewer component
- Exports: `EngagementList` component, `EngagementDetail` component, `useEngagements`, `useCreateEngagement` hooks

**Definition of Done**
- [ ] Engagements tab shows proposals, contracts, renewals with status badges (Draft, Sent, Accepted, Rejected, Expired)
- [ ] Engagement cards display: title, type, amount, client, status, created date, expiry date
- [ ] Status transition buttons available based on current state and user permissions
- [ ] Document preview shows PDF/content with zoom and download options
- [ ] Create engagement wizard: select type, template, client, terms, generate document
- [ ] Revenue tracking shows projected vs actual revenue by engagement status
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Advanced document generation with custom layouts (Phase 6+)
- E-signature workflow integration (Phase 6+)
- Engagement analytics and reporting (Phase 6+)
- Automated renewal reminders

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Document access must validate user permissions for the associated client/entity
- Status transitions must validate business rules (e.g., cannot accept expired engagement)

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/EngagementList.tsx`, `artifacts/apex-os/src/components/crm/EngagementDetail.tsx`, `artifacts/apex-os/src/hooks/crm/useEngagements.ts`, `artifacts/apex-os/src/hooks/crm/useCreateEngagement.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/EngagementList.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete engagement components and hooks; remove Engagements tab from entity pages
- Halt condition: if status transitions violate business rules or create invalid states, stop and fix validation logic

**Rules to Follow**
- Status transitions must follow state machine: Draft → Sent → (Accepted/Rejected/Expired)
- Revenue calculations must use consistent currency formatting and conversion rates
- Document generation must be server-side for security and template management
- User permissions must be checked for each status transition action

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- EngagementList.test.tsx
```

**Advanced Code Patterns**
- Use state machine pattern for engagement status transitions with proper validation
- Implement optimistic UI for status changes with instant feedback and rollback
- Use virtual scrolling for large engagement lists with filtering and sorting

**Anti-Patterns**
- Client-side document generation — security risk and template inconsistency
- Missing status validation — allow invalid state transitions
- Hardcoded status workflows — use configurable state machine from API
- Not checking user permissions — security vulnerability

**DDD / TDD / BDD / Deep Module notes**
- DDD: Engagements are domain entities representing formal business relationships with documents, status workflows, and revenue implications.
- TDD: MSW returns engagements → assert proper status display; test status transitions → assert state machine validation; test creation → assert wizard flow.
- BDD: "As a firm user, I can view all engagements for a client, transition their status, and create new engagements with proper document generation."
- Deep Module: `EngagementList` handles engagement display and status management; `useEngagements` hides engagement API complexity and provides typed engagement data.

---

### Subtasks

- [ ] FRONT‑CRM‑010.0.25 (AGENT): Research engagement management workflows and status state machines.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑010.1 (AGENT): Create `useEngagements` and `useCreateEngagement` hooks with status validation.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useEngagements.ts`, `artifacts/apex-os/src/hooks/crm/useCreateEngagement.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑010.2 (AGENT): Implement `EngagementList` component with status management and transitions.
  **File(s):** `artifacts/apex-os/src/components/crm/EngagementList.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑010.3 (AGENT): Implement `EngagementDetail` component with document preview and revenue tracking.
  **File(s):** `artifacts/apex-os/src/components/crm/EngagementDetail.tsx`
  **Verification:** Engagement details and document preview work correctly.

- [ ] FRONT‑CRM‑010.4 (AGENT): Add engagement creation wizard and integrate into entity pages.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** Creation wizard works and integrates properly.

- [ ] FRONT‑CRM‑010.5 (AGENT): Write component tests with MSW for engagement CRUD and status transitions.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/EngagementList.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- EngagementList.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑010.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑011: Renewal Lifecycle UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No renewal lifecycle UI exists. `API-CRM‑033` endpoints are not wired.
**Size:** Medium

**Description:** Implement renewal dashboard showing upcoming renewals with countdown indicators and revenue impact. Action buttons: mark as renewed, extend, or cancel. Filter by status and date range. Automated renewal insights and revenue forecasting. Integration with engagement management.

**Depends on:** API‑CRM‑033 (renewal lifecycle API green), FRONT‑CRM‑010 (engagement management)
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/RenewalDashboard.tsx`, `artifacts/apex-os/src/hooks/crm/useRenewals.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Card, Badge from shadcn/ui; Date range picker
- Exports: `RenewalDashboard` component, `RenewalCard` component, `useRenewals`, `useProcessRenewal` hooks

**Definition of Done**
- [ ] Dashboard shows upcoming renewals with countdown timers (30, 60, 90 days)
- [ ] Renewal cards display: client name, engagement type, renewal date, revenue amount, status, probability score
- [ ] Action buttons available: Mark Renewed, Extend (30/60/90 days), Cancel, Send Reminder
- [ ] Revenue impact calculation shows projected vs actual renewal revenue
- [ ] Filtering by status: Upcoming, Overdue, Processed, Cancelled
- [ ] Date range filtering for renewal forecasting
- [ ] Automated insights: high-risk renewals, revenue trends, renewal rate metrics
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Automated renewal processing and billing (Phase 6+)
- Advanced renewal analytics and predictive modeling (Phase 6+)
- Custom renewal workflows and approval processes
- Integration with external billing systems

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Revenue calculations must validate currency and conversion rates
- User permissions must be checked for renewal actions (based on client ownership)

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/RenewalDashboard.tsx`, `artifacts/apex-os/src/hooks/crm/useRenewals.ts`, `artifacts/apex-os/src/hooks/crm/useProcessRenewal.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/RenewalDashboard.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete renewal components and hooks; remove renewal dashboard from CRM
- Halt condition: if renewal processing creates duplicate engagements or incorrect revenue calculations, stop and fix logic

**Rules to Follow**
- Renewal dates must use user's local timezone with clear relative indicators
- Revenue calculations must be consistent across all renewal views and filters
- Renewal actions must validate business rules (e.g., cannot cancel already processed renewals)
- Probability scores must be calculated server-side based on engagement history and client behavior

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- RenewalDashboard.test.tsx
```

**Advanced Code Patterns**
- Use real-time countdown timers with `setInterval` for upcoming renewals
- Implement optimistic UI for renewal actions with instant feedback and rollback
- Use data visualization for renewal trends and revenue forecasting

**Anti-Patterns**
- Client-side revenue calculations — use server-side calculations for consistency
- Missing renewal validation — allow invalid state transitions
- Hardcoded renewal periods — use configurable periods from API
- Not updating engagement status when renewal processed — data inconsistency

**DDD / TDD / BDD / Deep Module notes**
- DDD: Renewal Lifecycle is a domain concept within the CRM bounded context, managing the end-to-end process of engagement renewals and revenue continuity.
- TDD: MSW returns renewals → assert countdown displays correctly; test renewal actions → assert proper state transitions and revenue updates.
- BDD: "As a firm user, I can view upcoming renewals with countdown indicators, take renewal actions, and see revenue impact projections for business planning."
- Deep Module: `RenewalDashboard` handles renewal display and actions; `useRenewals` hides renewal API complexity and provides typed renewal data with business logic.

---

### Subtasks

- [ ] FRONT‑CRM‑011.0.25 (AGENT): Research renewal lifecycle management patterns and revenue forecasting.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑011.1 (AGENT): Create `useRenewals` and `useProcessRenewal` hooks with countdown calculations.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useRenewals.ts`, `artifacts/apex-os/src/hooks/crm/useProcessRenewal.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑011.2 (AGENT): Implement `RenewalDashboard` component with countdown timers and filtering.
  **File(s):** `artifacts/apex-os/src/components/crm/RenewalDashboard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑011.3 (AGENT): Add renewal action buttons and revenue impact calculations.
  **File(s):** `artifacts/apex-os/src/components/crm/RenewalDashboard.tsx`
  **Verification:** Renewal actions work and revenue calculations are accurate.

- [ ] FRONT‑CRM‑011.4 (AGENT): Add automated insights and integrate renewal dashboard into CRM.
  **File(s):** `artifacts/apex-os/src/pages/CRM.tsx`
  **Verification:** Dashboard appears and insights work correctly.

- [ ] FRONT‑CRM‑011.5 (AGENT): Write component tests with MSW for renewal CRUD and countdown logic.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/RenewalDashboard.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- RenewalDashboard.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑011.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑012: Contact 360 Workspace
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Contact 360 workspace exists. `API-CRM‑026` endpoints are not wired.
**Size:** Medium

**Description:** Implement full-page contact detail with tabbed layout: Overview (profile, ownership), Activity Timeline (chronological feed), Deals (linked deals with stage), Documents (linked documents), Tasks (follow-up tasks). Quick actions: email, schedule meeting, add task, convert from lead. Real-time updates and comprehensive entity relationship mapping.

**Depends on:** API‑CRM‑026 (360° workspace endpoints green), FRONT‑CRM‑002, FRONT‑CRM‑003, FRONT‑CRM‑006
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/ContactWorkspace.tsx`, `artifacts/apex-os/src/hooks/crm/useContactWorkspace.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Tabs from shadcn/ui; Activity timeline component
- Exports: `ContactWorkspace` component, `useContactWorkspace` hook

**Definition of Done**
- [ ] Full-page workspace with tabbed navigation and consistent layout
- [ ] Overview tab: contact profile, ownership, communication preferences, social links, custom fields
- [ ] Activity Timeline tab: chronological feed of all activities (emails, calls, meetings, tasks) with filtering
- [ ] Deals tab: linked deals with pipeline stages, amounts, and quick deal creation
- [ ] Documents tab: linked documents with preview, upload, and organization
- [ ] Tasks tab: follow-up tasks with due dates, assignees, and completion tracking
- [ ] Quick action bar: email, schedule meeting, add task, create deal, convert from lead
- [ ] Real-time updates across all tabs without page refresh
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Advanced contact analytics and scoring (Phase 6+)
- Contact relationship mapping and org charts (Phase 6+)
- Contact segmentation and marketing automation (Phase 6+)
- Contact import/export and bulk operations

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Contact access must validate user permissions and data visibility rules
- Document access must validate permissions for linked documents

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/ContactWorkspace.tsx`, `artifacts/apex-os/src/hooks/crm/useContactWorkspace.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/ContactWorkspace.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete workspace components and hooks; revert to simple contact detail view
- Halt condition: if workspace shows data user shouldn't have access to, stop and fix permission validation

**Rules to Follow**
- Tab navigation must maintain state when switching between tabs
- Activity timeline must use infinite scrolling for large activity histories
- Quick actions must validate permissions before enabling
- Real-time updates must use WebSockets or efficient polling

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- ContactWorkspace.test.tsx
```

**Advanced Code Patterns**
- Use lazy loading for tab content to improve initial page load performance
- Implement optimistic UI for quick actions with instant feedback and rollback
- Use virtual scrolling for activity timelines with 1000+ activities

**Anti-Patterns**
- Loading all tab content simultaneously — poor performance
- Missing permission validation in quick actions — security vulnerability
- Not handling real-time updates — stale data across tabs
- Hardcoded tab layouts — use configurable layout from API

**DDD / TDD / BDD / Deep Module notes**
- DDD: Contact Workspace is a comprehensive view pattern within the CRM bounded context, providing a unified interface for all contact-related operations and data.
- TDD: MSW returns contact data → assert all tabs render correctly; test quick actions → assert proper mutations called; test real-time updates → assert tabs update without refresh.
- BDD: "As a firm user, I can view a comprehensive 360° view of a contact including all related activities, deals, documents, and tasks, and take quick actions from a single interface."
- Deep Module: `ContactWorkspace` handles the entire contact interface with tabbed navigation; `useContactWorkspace` hides workspace API complexity and provides unified contact data.

---

### Subtasks

- [ ] FRONT‑CRM‑012.0.25 (AGENT): Research 360° workspace patterns and tabbed interface best practices.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑012.1 (AGENT): Create `useContactWorkspace` hook with tabbed data loading and real-time updates.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useContactWorkspace.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑012.2 (AGENT): Implement `ContactWorkspace` component with tabbed layout and navigation.
  **File(s):** `artifacts/apex-os/src/components/crm/ContactWorkspace.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑012.3 (AGENT): Implement individual tabs: Overview, Activity Timeline, Deals, Documents, Tasks.
  **File(s):** `artifacts/apex-os/src/components/crm/ContactWorkspace.tsx`
  **Verification:** All tabs render and function correctly.

- [ ] FRONT‑CRM‑012.4 (AGENT): Add quick actions and real-time updates to workspace.
  **File(s):** `artifacts/apex-os/src/components/crm/ContactWorkspace.tsx`
  **Verification:** Quick actions work and updates are real-time.

- [ ] FRONT‑CRM‑012.5 (AGENT): Write component tests with MSW for workspace functionality and tab navigation.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/ContactWorkspace.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- ContactWorkspace.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑012.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑013: Company 360 Workspace
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Company 360 workspace exists. `API-CRM‑026` endpoints are not wired.
**Size:** Medium

**Description:** Implement company workspace showing linked contacts (sortable), open deals, revenue summary, engagement history, document summary, and ownership. Quick actions: add contact, create deal, schedule meeting. Company hierarchy and relationship mapping. Advanced analytics and reporting.

**Depends on:** API‑CRM‑026 (360° workspace endpoints green), FRONT‑CRM‑002, FRONT‑CRM‑003, FRONT‑CRM‑010
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/CompanyWorkspace.tsx`, `artifacts/apex-os/src/hooks/crm/useCompanyWorkspace.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Tabs from shadcn/ui; Data visualization components
- Exports: `CompanyWorkspace` component, `useCompanyWorkspace` hook

**Definition of Done**
- [ ] Full-page workspace with tabbed navigation and consistent layout
- [ ] Overview tab: company profile, industry, size, revenue, ownership, key contacts
- [ ] Contacts tab: sortable list of linked contacts with roles and contact information
- [ ] Deals tab: open deals with pipeline stages, amounts, probabilities, and weighted forecast
- [ ] Engagements tab: proposals, contracts, renewals with status and revenue tracking
- [ ] Documents tab: company documents with folder organization and access control
- [ ] Analytics tab: revenue trends, deal velocity, engagement metrics, contact growth
- [ ] Quick action bar: add contact, create deal, schedule meeting, upload document
- [ ] Real-time updates across all tabs without page refresh
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Company hierarchy and parent/subsidiary relationships (Phase 6+)
- Advanced company scoring and credit risk analysis (Phase 6+)
- Company data enrichment and external integrations (Phase 6+)
- Bulk company operations and data management

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Company access must validate user permissions and data visibility rules
- Financial data must be properly secured and access-controlled

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/CompanyWorkspace.tsx`, `artifacts/apex-os/src/hooks/crm/useCompanyWorkspace.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/CompanyWorkspace.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete workspace components and hooks; revert to simple company detail view
- Halt condition: if workspace shows financial data user shouldn't have access to, stop and fix permission validation

**Rules to Follow**
- Revenue calculations must use consistent currency formatting and conversion rates
- Contact sorting must support multiple criteria (name, role, last activity)
- Analytics data must be cached and updated efficiently to avoid performance issues
- Quick actions must validate permissions before enabling

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- CompanyWorkspace.test.tsx
```

**Advanced Code Patterns**
- Use lazy loading for tab content to improve initial page load performance
- Implement optimistic UI for quick actions with instant feedback and rollback
- Use data visualization libraries (Recharts) for analytics dashboard
- Use virtual scrolling for large contact lists with 1000+ contacts

**Anti-Patterns**
- Loading all tab content simultaneously — poor performance
- Missing permission validation for financial data — security vulnerability
- Not caching analytics calculations — repeated expensive operations
- Hardcoded analytics layouts — use configurable layout from API

**DDD / TDD / BDD / Deep Module notes**
- DDD: Company Workspace is a comprehensive view pattern within the CRM bounded context, providing unified access to all company-related operations and analytics.
- TDD: MSW returns company data → assert all tabs render correctly; test analytics → assert proper calculations; test quick actions → assert proper mutations called.
- BDD: "As a firm user, I can view a comprehensive 360° view of a company including contacts, deals, revenue, and analytics, and take quick actions from a single interface."
- Deep Module: `CompanyWorkspace` handles the entire company interface with tabbed navigation; `useCompanyWorkspace` hides workspace API complexity and provides unified company data.

---

### Subtasks

- [ ] FRONT‑CRM‑013.0.25 (AGENT): Research company workspace patterns and analytics best practices.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑013.1 (AGENT): Create `useCompanyWorkspace` hook with tabbed data loading and analytics calculations.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useCompanyWorkspace.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑013.2 (AGENT): Implement `CompanyWorkspace` component with tabbed layout and navigation.
  **File(s):** `artifacts/apex-os/src/components/crm/CompanyWorkspace.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑013.3 (AGENT): Implement individual tabs: Overview, Contacts, Deals, Engagements, Documents, Analytics.
  **File(s):** `artifacts/apex-os/src/components/crm/CompanyWorkspace.tsx`
  **Verification:** All tabs render and function correctly.

- [ ] FRONT‑CRM‑013.4 (AGENT): Add analytics dashboard and quick actions to workspace.
  **File(s):** `artifacts/apex-os/src/components/crm/CompanyWorkspace.tsx`
  **Verification:** Analytics display correctly and quick actions work.

- [ ] FRONT‑CRM‑013.5 (AGENT): Write component tests with MSW for workspace functionality and analytics.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/CompanyWorkspace.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- CompanyWorkspace.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑013.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑CRM‑014: Deal Workspace
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Deal workspace exists. `API-CRM‑026` endpoints are not wired.
**Size:** Medium

**Description:** Implement deal workspace with pipeline stage, linked contacts, next steps, documents, proposal/engagement actions, and forecast metadata (expected close, probability, amount). Stage progression bar with current stage highlighted. Deal activity timeline and collaboration tools.

**Depends on:** API‑CRM‑026 (360° workspace endpoints green), FRONT‑CRM‑003, FRONT‑CRM‑010
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/crm/DealWorkspace.tsx`, `artifacts/apex-os/src/hooks/crm/useDealWorkspace.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; Tabs from shadcn/ui; Progress bar component
- Exports: `DealWorkspace` component, `useDealWorkspace` hook

**Definition of Done**
- [ ] Full-page workspace with tabbed navigation and stage progression bar
- [ ] Overview tab: deal details, stage, amount, probability, expected close, next steps
- [ ] Contacts tab: linked contacts with roles and contact information
- [ ] Activities tab: chronological activity timeline with filtering and search
- [ ] Documents tab: deal-related documents with version control and access tracking
- [ ] Engagements tab: linked proposals, contracts, renewals with status tracking
- [ ] Stage progression bar showing current stage with transition options
- [ ] Quick actions: create proposal, schedule meeting, add task, upload document
- [ ] Real-time updates across all tabs without page refresh
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Advanced deal forecasting and AI-powered probability scoring (Phase 6+)
- Deal collaboration and team assignment workflows (Phase 6+)
- Deal templates and automation (Phase 6+)
- Deal analytics and reporting dashboards (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Deal access must validate user permissions and data visibility rules
- Financial amount access must be properly controlled based on user roles

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/crm/DealWorkspace.tsx`, `artifacts/apex-os/src/hooks/crm/useDealWorkspace.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/crm/__tests__/DealWorkspace.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete workspace components and hooks; revert to simple deal detail view
- Halt condition: if workspace shows financial data user shouldn't have access to, stop and fix permission validation

**Rules to Follow**
- Stage transitions must validate business rules and user permissions
- Financial amounts must use consistent currency formatting and conversion rates
- Activity timeline must use infinite scrolling for large activity histories
- Probability calculations must be server-side with proper validation

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- DealWorkspace.test.tsx
```

**Advanced Code Patterns**
- Use lazy loading for tab content to improve initial page load performance
- Implement optimistic UI for stage transitions with instant feedback and rollback
- Use virtual scrolling for activity timelines with 1000+ activities
- Use state machine pattern for stage progression with proper validation

**Anti-Patterns**
- Client-side probability calculations — use server-side calculations for consistency
- Missing stage validation — allow invalid state transitions
- Loading all tab content simultaneously — poor performance
- Hardcoded stage workflows — use configurable pipeline from API

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deal Workspace is a comprehensive view pattern within the CRM bounded context, providing unified access to all deal-related operations and stage management.
- TDD: MSW returns deal data → assert all tabs render correctly; test stage transitions → assert proper validation; test activity timeline → assert chronological display.
- BDD: "As a firm user, I can view a comprehensive 360° view of a deal including stage progression, contacts, activities, and documents, and manage deal progression from a single interface."
- Deep Module: `DealWorkspace` handles the entire deal interface with stage management; `useDealWorkspace` hides workspace API complexity and provides unified deal data.

---

### Subtasks

- [ ] FRONT‑CRM‑014.0.25 (AGENT): Research deal workspace patterns and pipeline management best practices.
  *No action — pause until fully understood.*

- [ ] FRONT‑CRM‑014.1 (AGENT): Create `useDealWorkspace` hook with stage management and tabbed data loading.
  **File(s):** `artifacts/apex-os/src/hooks/crm/useDealWorkspace.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑014.2 (AGENT): Implement `DealWorkspace` component with stage progression bar and tabbed layout.
  **File(s):** `artifacts/apex-os/src/components/crm/DealWorkspace.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑CRM‑014.3 (AGENT): Implement individual tabs: Overview, Contacts, Activities, Documents, Engagements.
  **File(s):** `artifacts/apex-os/src/components/crm/DealWorkspace.tsx`
  **Verification:** All tabs render and function correctly.

- [ ] FRONT‑CRM‑014.4 (AGENT): Add stage progression management and quick actions to workspace.
  **File(s):** `artifacts/apex-os/src/components/crm/DealWorkspace.tsx`
  **Verification:** Stage transitions work and quick actions function properly.

- [ ] FRONT‑CRM‑014.5 (AGENT): Write component tests with MSW for workspace functionality and stage management.
  **File(s):** `artifacts/apex-os/src/components/crm/__tests__/DealWorkspace.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- DealWorkspace.test.tsx` → GREEN.

- [ ] FRONT‑CRM‑014.6 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

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
