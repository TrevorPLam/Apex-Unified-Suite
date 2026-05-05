# TODO-P4-DASHBOARD.md – Phase 4 Dashboard Aggregation & Frontend



This file covers the Dashboard Aggregation endpoint and Frontend implementation. The backend aggregates metrics across all bounded contexts; the frontend uses React Query hooks with a responsive bento grid layout.

---

### [ ] API‑DASH‑001: Dashboard Aggregation Endpoint
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟠 High  
**Current State:** No dashboard aggregation endpoint exists. `artifacts/api-server/src/services/dashboard/` and `routes/dashboard.ts` do not exist. The frontend dashboard uses static mock data. No OpenAPI spec entry for `/dashboard`.  
**Size:** Medium  

**Description:** Build `GET /api/v1/dashboard/aggregate` — a single endpoint that aggregates metrics from all bounded contexts (CRM, Projects, Finance, Appointments, Documents, Portal), org-scoped, with 5-minute in-process cache.  

**Depends on:** All Phase 3 API implementations (CRM, Projects, Finance) for data aggregation  
**Blocks:** FRONT‑DASH‑001 (frontend hook requires this endpoint)  
**Related Files:** `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/dashboard/dashboard-service.ts`, `artifacts/api-server/src/routes/dashboard.ts`  

**Imports / Exports**
- Imports: `BaseRepository` (per-context); `drizzle-orm` sql helpers; `express` Router
- Exports: `DashboardService` (class), `dashboardRouter` (Express Router), `DashboardAggregateResponse` (type)

**Definition of Done**
- [ ] OpenAPI spec adds `GET /dashboard/aggregate` with `period` query param (7d/30d/90d/1y) and full response schema
- [ ] `pnpm --filter @workspace/api-spec run codegen` succeeds
- [ ] Integration test: `GET /dashboard/aggregate` → 200 with all metric sections present (TDD red then green)
- [ ] `artifacts/api-server/src/services/dashboard/dashboard-service.ts` exports `DashboardService` with `aggregate(orgId, period)` method
- [ ] All metrics organisation-scoped; no cross-org data leakage
- [ ] 5-minute in-process cache keyed by `(orgId, period)`; cache invalidated on mutation events
- [ ] Response includes `lastUpdated: ISO timestamp`
- [ ] `dashboardRouter` mounted in `routes/index.ts` with `authMiddleware`
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time WebSocket updates (deferred to Phase 5+)
- Per-metric endpoint (single aggregation endpoint only)
- Historical trend data (current period snapshots only)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- All queries must include `WHERE organization_id = $orgId` — no global data

**Output Artifacts**
- Code changes in: `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/services/dashboard/dashboard-service.ts`, `artifacts/api-server/src/routes/dashboard.ts`, `artifacts/api-server/src/routes/index.ts`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/dashboard/dashboard.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/api-server/src/services/dashboard/`, `routes/dashboard.ts`; revert `routes/index.ts` mount; revert spec changes; re-run codegen
- Halt condition: if `pnpm run typecheck` fails or any integration test fails, stop and fix before proceeding

**Rules to Follow**
- Single `aggregate()` method on `DashboardService` — deep module principle
- Cache key must be `(orgId, period)` — never share data across organisations
- If any sub-aggregation fails (e.g. finance query errors), return partial results with an `errors` field

**Verification**
```bash
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server test -- dashboard.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- Parallel `Promise.allSettled()` for all 6 sub-aggregation queries — avoids serial blocking
- `Map<string, { data, expiresAt }>` in-process cache keyed by `(orgId, period)`
- Partial result pattern — return what succeeded plus an `errors[]` array for failed contexts

**Anti-Patterns**
- Serial aggregation queries — multiplies latency
- Missing org scoping — data leakage across organisations
- Failing entire response if one sub-context errors — poor UX; use partial results

**DDD / TDD / BDD / Deep Module notes**
- DDD: Dashboard is a cross-cutting read model; it reads from multiple bounded contexts but writes to none
- TDD: Write integration test (red) before implementing the service
- BDD: "As a user, I see up-to-date metrics from all business areas on a single dashboard screen"
- Deep Module: `DashboardService.aggregate()` hides 6 parallel DB queries, caching, error tolerance, and org scoping behind one call

---

### Subtasks

- [ ] API‑DASH‑001.0.25 (AGENT): Read this task, existing Phase 3 API implementations, and `lib/api-spec/openapi.yaml` structure in full.  
  *No action — pause until fully understood.*

- [ ] API‑DASH‑001.0.5 (AGENT): Research `Promise.allSettled()` aggregation patterns and in-process caching strategies for Express 5 ESM (May 2026). Confirm partial result pattern.  
  *Document findings briefly or note "no changes."*

- [ ] API‑DASH‑001.0.75 (AGENT): Reason about which Phase 3 repositories to inject into `DashboardService`. Default: inject per-context repository instances; do not create new DB connections.  
  *If uncertain, ask before executing.*

- [ ] API‑DASH‑001.1 (AGENT): Add `GET /dashboard/aggregate` to OpenAPI spec; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen succeeds; generated types available.

- [ ] API‑DASH‑001.2 (AGENT): Write integration test for aggregation endpoint (TDD red phase).  
  **File(s):** `artifacts/api-server/src/__tests__/api/dashboard/dashboard.test.ts`  
  **Verification:** Test compiles and fails with 404 (no route).

- [ ] API‑DASH‑001.3 (AGENT): Implement `DashboardService.aggregate()` with parallel queries and caching.  
  **File(s):** `artifacts/api-server/src/services/dashboard/dashboard-service.ts`  
  **Verification:** Unit tests with mocked repositories pass.

- [ ] API‑DASH‑001.4 (AGENT): Create route and wire to service; mount in main router.  
  **File(s):** `artifacts/api-server/src/routes/dashboard.ts`, `artifacts/api-server/src/routes/index.ts`  
  **Verification:** Integration test turns green.

- [ ] API‑DASH‑001.5 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

### [ ] FRONT‑DASH‑001: Dashboard Frontend Strategy
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟠 High  
**Current State:** The dashboard page (`artifacts/apex-os/src/pages/Dashboard.tsx`) renders static mock data. No `useDashboard` hook exists. No `components/dashboard/` metric card components exist. UI cannot display real aggregated data.  
**Size:** Medium  

**Description:** Implement the dashboard frontend using React Query hooks against `API‑DASH‑001`, modular bento-grid metric cards with skeleton loaders, and 30-second polling with pause/resume control.  

**Depends on:** API‑DASH‑001 (backend aggregation endpoint)  
**Blocks:** [N/A — final phase of dashboard implementation]
**Related Files:** `artifacts/apex-os/src/hooks/useDashboard.ts`, `artifacts/apex-os/src/components/dashboard/`, `artifacts/apex-os/src/pages/Dashboard.tsx`  

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; generated dashboard API hook; `Skeleton`, `Card` from `shadcn/ui`; `motion` from `framer-motion`
- Exports: `useDashboard` (hook), `DashboardPage` (page component), metric card components

**Definition of Done**
- [ ] `artifacts/apex-os/src/hooks/useDashboard.ts` exports `useDashboard(period)` using React Query, polling every 30 seconds
- [ ] Hook exposes `{ data, isLoading, isError, lastUpdated, pause, resume }` API
- [ ] `artifacts/apex-os/src/components/dashboard/` contains: `CRMCard.tsx`, `ProjectsCard.tsx`, `FinanceCard.tsx`, `AppointmentsCard.tsx`, `DocumentsCard.tsx`, `PortalCard.tsx`
- [ ] Each metric card shows skeleton loader during `isLoading`; graceful error state with last known data
- [ ] `artifacts/apex-os/src/pages/Dashboard.tsx` updated to use `useDashboard` hook (not mock data)
- [ ] Responsive bento grid layout adapts to mobile/tablet/desktop
- [ ] Pause/resume polling control visible in dashboard header
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm --filter @workspace/apex-os run dev` shows live dashboard data

**Out of Scope**
- WebSocket real-time updates (deferred to Phase 5+)
- Per-metric drill-down pages (separate analytics feature)
- Dashboard customisation (pinning/reordering cards)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Do not add business logic to metric card components — they are pure display components

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/useDashboard.ts`, `artifacts/apex-os/src/components/dashboard/`, `artifacts/apex-os/src/pages/Dashboard.tsx`
- Tests added/updated in: [N/A]
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `artifacts/apex-os/src/hooks/useDashboard.ts` and `components/dashboard/`; revert `Dashboard.tsx` to mock data version
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- Use generated React Query hook from `lib/api-client-react` — do not hand-write `fetch()` calls
- All metric cards must be pure display components with no data fetching
- `useDashboard` is the single source of truth for dashboard data — no per-card fetching

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os run dev
# Navigate to /dashboard; verify live data, skeleton loaders, pause/resume
```

**Advanced Code Patterns**
- `useQuery` with `refetchInterval: 30_000` and `enabled: !isPaused` state for pause/resume polling
- Skeleton components as direct replacements for metric cards during loading
- `AnimatePresence` for smooth card transitions when data updates

**Anti-Patterns**
- Per-card data fetching — creates N parallel requests; use single `useDashboard` hook
- Hard-coded mock data in production components — use `mockData.ts` only during dev until API is live
- Polling without pause/resume — unnecessary load on the backend when tab is in background

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A — frontend presentation layer]
- TDD: [N/A — no unit tests for pure display components; rely on typecheck and visual verification]
- BDD: "As a user, I see my dashboard data refresh every 30 seconds with a visible last-updated timestamp"
- Deep Module: `useDashboard` hides React Query setup, polling, pause/resume, and error handling behind a simple hook API

---

### Subtasks

- [ ] FRONT‑DASH‑001.0.25 (AGENT): Read this task, `API‑DASH‑001` response schema, existing `Dashboard.tsx`, and mock data shape in full.  
  *No action — pause until fully understood.*

- [ ] FRONT‑DASH‑001.0.5 (AGENT): Research React Query `refetchInterval` and `enabled` patterns for pause/resume polling (May 2026). Confirm `AnimatePresence` usage for card transitions.  
  *Document findings briefly or note "no changes."*

- [ ] FRONT‑DASH‑001.0.75 (AGENT): Reason about whether to use the generated hook from `api-client-react` or build a custom one. Default: use the generated hook; wrap it in `useDashboard` for polling control.  
  *If uncertain, use the generated hook approach.*

- [ ] FRONT‑DASH‑001.1 (AGENT): Create all 6 metric card components with skeleton loader states.  
  **File(s):** `artifacts/apex-os/src/components/dashboard/`  
  **Verification:** Components render with placeholder props; `pnpm run typecheck` clean.

- [ ] FRONT‑DASH‑001.2 (AGENT): Implement `useDashboard` hook with polling and pause/resume.  
  **File(s):** `artifacts/apex-os/src/hooks/useDashboard.ts`  
  **Verification:** Hook returns `{ data, isLoading, isError, pause, resume }`; `pnpm run typecheck` clean.

- [ ] FRONT‑DASH‑001.3 (AGENT): Update `Dashboard.tsx` to use `useDashboard` hook and bento grid layout.  
  **File(s):** `artifacts/apex-os/src/pages/Dashboard.tsx`  
  **Verification:** `pnpm run typecheck` clean; dev server renders dashboard.

- [ ] FRONT‑DASH‑001.4 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.

---

## Execution Order

```
API‑DASH‑001 (OpenAPI spec + service + routes)
  └─> FRONT‑DASH‑001 (React components + useDashboard hook)
```
