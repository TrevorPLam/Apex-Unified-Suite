# TODO-P5-DASHBOARD.md – Phase 5: Dashboard Data Integration

Replaces all `mockData` imports in the Dashboard page with real API data fetched via a React Query hook. Depends on `API-DASH-001` (backend aggregation endpoint) and the FRONT-INFRA foundation tasks.

---

## [ ] FRONT‑DASH‑001: Dashboard – Replace Mock Data with API Hooks
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Dashboard.tsx` imports metrics directly from `src/data/mockData.ts`. No `useDashboard` hook exists. The `QueryClient` is unconfigured (handled by FRONT‑INFRA‑001).
**Size:** Small

**Description:** Create a `useDashboard` hook that calls the `API-DASH-001` aggregation endpoint with a period parameter and exposes metrics for CRM, Projects, Finance, Appointments, Documents, and Portal. Replace all `mockData` imports in `Dashboard.tsx` with hook data, add loading skeletons and a 30-second polling refresh, and add an error state with retry.

**Depends on:** API‑DASH‑001 (dashboard aggregation endpoint), FRONT‑INFRA‑001 (QueryClient configured), FRONT‑INFRA‑002 (PageSkeleton), FRONT‑AUTH‑002 (dashboard behind ProtectedRoute)
**Blocks:** [N/A] — Dashboard is a leaf consumer of all domain API integrations
**Related Files:** `artifacts/apex-os/src/pages/Dashboard.tsx`, `artifacts/apex-os/src/hooks/useDashboard.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; generated API client hook for `GET /api/v1/dashboard`
- Exports: `useDashboard(period)` hook returning `{ data, isLoading, isError, refetch }`

**Definition of Done**
- [ ] `src/hooks/useDashboard.ts` created; calls `GET /api/v1/dashboard?period={period}` via React Query with `refetchInterval: 30000`
- [ ] `Dashboard.tsx` imports `useDashboard` and renders all metric cards (CRM, Projects, Finance, Appointments, Documents, Portal) from API data
- [ ] All `mockData` imports removed from `Dashboard.tsx` — file has zero references to `src/data/mockData`
- [ ] Loading state shows `PageSkeleton` during initial fetch
- [ ] Error state shows a retry banner with `refetch()` button
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component test with MSW passes: all metrics render; loading state shows skeleton; error state shows retry banner
- [ ] 30-second polling refresh verified by test using `vi.useFakeTimers()`

**Out of Scope**
- Dashboard widget customisation (drag-to-reorder, hide/show widgets)
- Real-time WebSocket push updates (polling is sufficient for Phase 5)
- Per-user dashboard preferences

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/useDashboard.ts`, `artifacts/apex-os/src/pages/Dashboard.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/Dashboard.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `useDashboard.ts`; revert `Dashboard.tsx` to restore mock data imports
- Halt condition: if `pnpm run typecheck` fails after removing mock imports, stop and verify API response type matches component expectations

**Rules to Follow**
- `refetchInterval: 30000` must be set in `useQuery` options — not via a `setInterval` outside React Query
- The period parameter must be one of the values accepted by the API (`'day' | 'week' | 'month' | 'quarter'`); default to `'month'`
- Never use `any` type for API response — use the generated Zod type or interface from `lib/api-zod`
- All numeric metrics must have null/undefined guards before rendering (API may return `null` for contexts with no data)

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- Dashboard.test.tsx
# Manual: navigate to /dashboard, verify all metric cards render; wait 30s and confirm data refreshes in network tab
```

**Advanced Code Patterns**
- `useQuery({ queryKey: ['dashboard', period], queryFn: fetchDashboard, refetchInterval: 30_000, staleTime: 25_000 })` — `staleTime` slightly below `refetchInterval` prevents cache staleness
- Expose a `pausePolling` function by toggling `enabled` in the query options via component state — allows a "Pause" button in the UI
- Use `keepPreviousData: true` (TanStack Query v5: `placeholderData: keepPreviousData`) so the previous period's data stays visible while the new period loads

**Anti-Patterns**
- Calling `setInterval` manually alongside React Query — double-polling and memory leaks
- Importing mock data as a fallback — production code must never reference `src/data/mockData`
- Not handling `null` metric values — throws during render when API returns empty context data

**DDD / TDD / BDD / Deep Module notes**
- DDD: Dashboard is a read-only aggregation view across bounded contexts; it does not own any data — it consumes projections from each context's API.
- TDD: Write the MSW mock for `GET /api/v1/dashboard` first; then write the test asserting metric card values; then implement the hook.
- BDD: "As a firm user, I can see live business metrics on my dashboard, refreshed automatically every 30 seconds."
- Deep Module: `useDashboard` is the deep module — `Dashboard.tsx` calls `useDashboard('month')` and gets typed data; all HTTP, caching, and polling complexity is hidden inside the hook.

---

### Subtasks

- [ ] FRONT‑DASH‑001.0.25 (AGENT): Read `Dashboard.tsx` in full and list every `mockData` import and the shape of data consumed.
  *No action — pause until fully understood.*

- [ ] FRONT‑DASH‑001.0.5 (AGENT): Confirm `API-DASH-001` response schema against `lib/api-zod/src/generated/` and note the exact period parameter values accepted.
  *Document findings briefly.*

- [ ] FRONT‑DASH‑001.1 (AGENT): Implement `useDashboard(period)` hook with React Query and 30-second polling.
  **File(s):** `artifacts/apex-os/src/hooks/useDashboard.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑DASH‑001.2 (AGENT): Update `Dashboard.tsx` to use `useDashboard`; render loading skeleton and error banner.
  **File(s):** `artifacts/apex-os/src/pages/Dashboard.tsx`
  **Verification:** `pnpm run typecheck` passes; no `mockData` references remain.

- [ ] FRONT‑DASH‑001.3 (AGENT): Remove all `mockData` imports and verify no mock references remain.
  **File(s):** `artifacts/apex-os/src/pages/Dashboard.tsx`
  **Verification:** `grep -r "mockData" artifacts/apex-os/src/pages/Dashboard.tsx` → zero results.

- [ ] FRONT‑DASH‑001.4 (AGENT): Write component test with MSW covering: data renders, loading skeleton, error banner, 30-second polling.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/Dashboard.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- Dashboard.test.tsx` → GREEN.

- [ ] FRONT‑DASH‑001.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.
