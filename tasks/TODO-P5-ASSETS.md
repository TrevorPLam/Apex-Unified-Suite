# TODO-P5-ASSETS.md – Phase 5: Assets Frontend Integration

Replaces all mock data in the Assets page with real API-backed React Query hooks and wires all asset management interactions: inventory browsing, checkout/check-in workflow with user and due-date selection, maintenance log creation and completion, and depreciation schedule display.

---

## [ ] FRONT‑ASSETS‑001: Assets & Inventory – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Assets.tsx` imports assets and maintenance data from `src/data/mockData.ts`. No `useAssetList` or `useMaintenanceLog` hooks exist.
**Size:** Small

**Description:** Create `useAssetList` and `useCheckoutList` hooks backed by `API-ASSETS-004` / `API-ASSETS-008`. Replace all mock data in the Assets page table and detail panel. Display asset status badges, category filters, and a per-asset maintenance log.

**Depends on:** API‑ASSETS‑004 (assets API green), API‑ASSETS‑008 (checkout API green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** FRONT‑INT‑ASSETS
**Related Files:** `artifacts/apex-os/src/pages/Assets.tsx`, `artifacts/apex-os/src/hooks/assets/useAssetList.ts`, `artifacts/apex-os/src/hooks/assets/useCheckoutList.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; API client for `GET /api/v1/assets`, `GET /api/v1/assets/:id/checkouts`, `GET /api/v1/assets/:id/maintenance`
- Exports: `useAssetList(filters?)`, `useCheckoutList(assetId)`, `useMaintenanceLog(assetId)`

**Definition of Done**
- [ ] `useAssetList` hook created with status (`available`, `checked-out`, `in-maintenance`, `retired`) and category filters; returns paginated results
- [ ] `useCheckoutList` hook fetches active and historical checkouts for a given asset
- [ ] `useMaintenanceLog` hook fetches maintenance events for a given asset, sorted by date descending
- [ ] Asset table: name, serial number, category, status badge, assigned user (if checked out), last maintenance date
- [ ] Asset detail panel: asset info, current checkout, maintenance log timeline
- [ ] Category and status filter dropdowns update the query; URL query params persist filters
- [ ] All `mockData` imports removed from `Assets.tsx`
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests pass: list renders; status filter narrows results; detail panel shows maintenance log

**Out of Scope**
- Checkout/check-in mutation forms (FRONT‑INT‑ASSETS)
- Maintenance scheduling (FRONT‑INT‑ASSETS)
- Depreciation schedule UI (separate asset sub-module — Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/assets/useAssetList.ts`, `artifacts/apex-os/src/hooks/assets/useCheckoutList.ts`, `artifacts/apex-os/src/hooks/assets/useMaintenanceLog.ts`, `artifacts/apex-os/src/pages/Assets.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/assets-list.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert `Assets.tsx` mock imports
- Halt condition: if the API returns assets for other tenants due to a missing scoping header, stop and verify `Authorization` header forwarding in the API client

**Rules to Follow**
- Status badges must be driven by the `status` enum from the API — never infer status from computed fields
- Category filter must be built from `GET /api/v1/asset-categories` — not a hardcoded list
- Paginate — do not load all assets in one request; default page size: 50

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- assets-list.test.tsx
```

**Advanced Code Patterns**
- `useAssetList` uses `keepPreviousData: true` so filter changes don't flash an empty table
- `useMaintenanceLog` uses `staleTime: 60_000` — maintenance logs change infrequently

**Anti-Patterns**
- Computing checkout status from a date field client-side — always use the `status` field from the API
- Loading all assets without pagination — large organisations can have thousands of assets

**DDD / TDD / BDD / Deep Module notes**
- DDD: Asset is an aggregate root in the Assets bounded context. Checkout and Maintenance are child aggregates linked by `asset_id`.
- TDD: MSW returns a list of 5 assets; assert table renders all 5; change status filter → assert query re-fires with updated param; click asset → assert maintenance log displayed.
- BDD: "As a firm user, I can browse my asset inventory, filter by status and category, and see the maintenance history for any asset."
- Deep Module: `useAssetList` and `useMaintenanceLog` hide API pagination, filter serialisation, and cache management; `Assets.tsx` just calls hooks.

---

### Subtasks

- [ ] FRONT‑ASSETS‑001.0.25 (AGENT): Read `Assets.tsx` in full and list every `mockData` reference and data shape consumed.
  *No action — pause until fully understood.*

- [ ] FRONT‑ASSETS‑001.1 (AGENT): Create `useAssetList`, `useCheckoutList`, and `useMaintenanceLog` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/assets/useAssetList.ts`, `artifacts/apex-os/src/hooks/assets/useCheckoutList.ts`, `artifacts/apex-os/src/hooks/assets/useMaintenanceLog.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑ASSETS‑001.2 (AGENT): Replace mock asset data in `Assets.tsx`; add status/category filters; wire asset detail panel.
  **File(s):** `artifacts/apex-os/src/pages/Assets.tsx`
  **Verification:** No `mockData` references; `pnpm run typecheck` passes.

- [ ] FRONT‑ASSETS‑001.3 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/assets-list.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- assets-list.test.tsx` → GREEN.

- [ ] FRONT‑ASSETS‑001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INT‑ASSETS: Assets Interactive Features Wiring
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No checkout/check-in forms or maintenance entry modals exist. All asset management is read-only.
**Size:** Medium

**Description:** Wire all Assets mutations: checkout (assign to user, due date), check-in, maintenance log entry (description, type, technician, cost), maintenance completion, and asset status change. All mutations show sonner toast feedback with optimistic status updates.

**Depends on:** FRONT‑ASSETS‑001, FRONT‑INFRA‑001, FRONT‑INFRA‑003
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/assets/CheckoutForm.tsx`, `artifacts/apex-os/src/components/assets/MaintenanceForm.tsx`, `artifacts/apex-os/src/pages/Assets.tsx`

**Imports / Exports**
- Imports: `useMutation`, `useQueryClient` from `@tanstack/react-query`; `useForm` from `react-hook-form`; `zodResolver` from `@hookform/resolvers/zod`; `toast` from `sonner`
- Exports: `CheckoutForm`, `MaintenanceForm`, `useCheckoutAsset()`, `useCheckinAsset()`, `useCreateMaintenanceEntry()`, `useCompleteMaintenanceEntry()`

**Definition of Done**
- [ ] `CheckoutForm` dialog: user selector (searchable, active users only), due date picker, optional notes; validation via Zod; calls `useCheckoutAsset` mutation
- [ ] Check-in: inline button in asset row/detail → confirmation dialog (optional damage notes) → `useCheckinAsset` mutation; status badge updates optimistically
- [ ] `MaintenanceForm` dialog: type (preventive/corrective/inspection), description, scheduled date, assigned technician, estimated cost; calls `useCreateMaintenanceEntry`
- [ ] Maintenance completion: "Complete" button on open maintenance entry → `useCompleteMaintenanceEntry` mutation; asks for actual cost and completion notes
- [ ] Asset status change (admin only): inline status selector for `available` → `retired`; calls `useUpdateAssetStatus` mutation; requires confirmation for `retired`
- [ ] All mutations disable the relevant button during `isPending`; sonner toast on success and error
- [ ] Integration tests with MSW cover checkout, check-in, maintenance create, and complete flows

**Out of Scope**
- QR code / barcode scanning for checkout (Phase 7+)
- Bulk checkout (Phase 7+)
- Mobile checkout app (Phase 9+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/assets/CheckoutForm.tsx`, `artifacts/apex-os/src/components/assets/MaintenanceForm.tsx`, `artifacts/apex-os/src/hooks/assets/useCheckoutAsset.ts`, `artifacts/apex-os/src/hooks/assets/useCheckinAsset.ts`, `artifacts/apex-os/src/hooks/assets/useCreateMaintenanceEntry.ts`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/assets-interactive.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `CheckoutForm` and `MaintenanceForm`; buttons disabled with "coming soon" tooltip
- Halt condition: if checkout mutation returns 200 but the asset status does not change to `checked-out`, stop and verify the API's state machine transition

**Rules to Follow**
- Only `available` assets can be checked out — disable checkout button for any other status; never rely solely on API rejection
- Retiring an asset requires explicit confirmation dialog; retired assets cannot be checked out
- Maintenance form requires at least a description and type before submission

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- assets-interactive.test.tsx
```

**Advanced Code Patterns**
- Optimistic checkout: immediately set asset status to `checked-out` and assigned user in cache; roll back on error and show error toast
- `useCompleteMaintenanceEntry` invalidates both `['assets', assetId, 'maintenance']` and `['assets', assetId]` to refresh the status badge if maintenance completion changes the asset status to `available`

**Anti-Patterns**
- Allowing checkout of already-checked-out assets — always check status client-side before showing the checkout button; the API enforces it but UX should prevent the attempt
- Storing cost as a string — always treat monetary values as numbers in cents (integer), never floating-point dollars

**DDD / TDD / BDD / Deep Module notes**
- DDD: Checkout is a bounded context transaction: it transitions an Asset from `available` to `checked-out` and creates a CheckoutRecord. Check-in reverses this. These are domain events, not just CRUD.
- TDD: MSW returns available asset; simulate checkout form submit → assert `POST /assets/:id/checkouts` called with user_id and due_date; assert status badge updates to `checked-out`; simulate check-in → assert asset reverts to `available`.
- BDD: "As a firm user, I can check out an asset to a team member, log maintenance events, and mark them complete."
- Deep Module: `CheckoutForm` and `MaintenanceForm` hide form validation, mutation firing, and cache invalidation; the page just renders them in dialogs.

---

### Subtasks

- [ ] FRONT‑INT‑ASSETS.0.25 (AGENT): List all Assets interactive surfaces (buttons, context menus) that need mutation wiring.
  *No action — pause until fully understood.*

- [ ] FRONT‑INT‑ASSETS.1 (AGENT): Implement `CheckoutForm` dialog and `useCheckoutAsset` / `useCheckinAsset` mutations with optimistic update.
  **File(s):** `artifacts/apex-os/src/components/assets/CheckoutForm.tsx`, `artifacts/apex-os/src/hooks/assets/useCheckoutAsset.ts`, `artifacts/apex-os/src/hooks/assets/useCheckinAsset.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑ASSETS.2 (AGENT): Implement `MaintenanceForm` dialog and `useCreateMaintenanceEntry` / `useCompleteMaintenanceEntry` mutations.
  **File(s):** `artifacts/apex-os/src/components/assets/MaintenanceForm.tsx`, `artifacts/apex-os/src/hooks/assets/useCreateMaintenanceEntry.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑ASSETS.3 (AGENT): Wire `useUpdateAssetStatus` for admin status changes; integrate forms into `Assets.tsx`.
  **File(s):** `artifacts/apex-os/src/pages/Assets.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INT‑ASSETS.4 (AGENT): Write integration tests covering checkout, check-in, maintenance create, and complete flows.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/assets-interactive.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- assets-interactive.test.tsx` → GREEN.

- [ ] FRONT‑INT‑ASSETS.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.
