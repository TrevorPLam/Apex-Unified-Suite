# TODO-P4-DASHBOARD.md – Phase 4 Dashboard Aggregation & Frontend

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This file covers the Dashboard Aggregation endpoint and Frontend implementation strategy. The backend provides aggregated metrics across all bounded contexts, while the frontend implements a component-based dashboard with React Query hooks and responsive bento grid layout.

---

## Dashboard Aggregation

### [ ] API‑DASH‑001: Dashboard Aggregation Endpoint
**Status:** ⏳ Not Started  
**Depends on:** All Phase 3 API implementations (CRM, Projects, Finance) for data aggregation.  
**Definition of Done:** `GET /api/v1/dashboard/aggregate` endpoint that returns aggregated metrics across all bounded contexts for the dashboard:  
- **CRM metrics:** total leads, leads by stage, conversion rate, active deals count, total deal value  
- **Projects metrics:** active projects, overall completion percentage, overdue tasks count  
- **Finance metrics:** total unpaid invoices, monthly revenue, budget utilization percentage  
- **Appointments metrics:** upcoming appointments, availability utilization rate  
- **Document metrics:** total documents, pending signature requests  
- **Portal metrics:** active portal clients, recent activity count  
- **Time range filtering:** support `period` parameter (7d, 30d, 90d, 1y)  
- **Organization scoping:** all metrics filtered by authenticated user's organization  
- **Caching:** 5-minute cache for performance using organization_id + period as cache key  
**Response format:** `{ crm: {...}, projects: {...}, finance: {...}, appointments: {...}, documents: {...}, portal: {...}, lastUpdated: ISO timestamp }`  
**Related Files:** `artifacts/api-server/src/services/dashboard/dashboard-service.ts`, `routes/dashboard.ts`

### Subtasks:
- [ ] API‑DASH‑001.1: Add dashboard aggregation endpoint to OpenAPI spec with comprehensive response schema. (AGENT) – `lib/api‑spec/openapi.yaml`  
  **verification:** Spec validates; generated types include all metric fields.
- [ ] API‑DASH‑001.2: Write integration tests for aggregation endpoint (TDD Red). (AGENT) – `__tests__/api/dashboard.test.ts`  
  **verification:** Tests fail with 404 (no route).
- [ ] API‑DASH‑001.3: Implement `DashboardService` with aggregation queries across all contexts. (AGENT) – `services/dashboard/dashboard-service.ts`  
  **verification:** Unit tests with mocked repositories pass.
- [ ] API‑DASH‑001.4: Implement caching layer with organization_id + period cache key. (AGENT)  
  **verification:** Cache tests pass; second request within cache window returns cached data.
- [ ] API‑DASH‑001.5: Create route and wire to service. (AGENT) – `routes/dashboard.ts`  
  **verification:** Integration tests go green.
- [ ] API‑DASH‑001.6: Add endpoint to main router with auth middleware. (AGENT) – `routes/index.ts`  
  **verification:** `pnpm typecheck` passes.

---

## Dashboard Frontend

### [ ] FRONT‑DASH‑001: Dashboard Frontend Strategy
**Status:** ⏳ Not Started  
**Depends on:** API‑DASH‑001 (backend aggregation endpoint).  
**Definition of Done:** Frontend dashboard implementation strategy established with:  
- **Client‑side hooks approach:** Use React Query hooks to call API‑DASH‑001 endpoint until real‑time updates are needed  
- **Component structure:** `components/dashboard/` with modular metric cards (CRMCard, ProjectsCard, FinanceCard, etc.)  
- **Real‑time strategy:** Future Phase 5+ will add WebSocket updates; current Phase 4 uses polling (30‑second refresh)  
- **Loading states:** Skeleton loaders for each metric card during initial load and refresh  
- **Error handling:** Graceful degradation showing last successful data with error banner  
- **Responsive layout:** Bento grid layout that adapts to mobile/tablet/desktop viewports  
**Implementation decision:** Use client‑side hooks approach for Phase 4, defer real‑time WebSocket updates to Phase 5+ when infrastructure is ready.  
**Interim strategy:** Until API‑DASH‑001 exists, use client‑side hooks with mock data that matches the expected API response structure for seamless migration.  
**Related Files:** `artifacts/apex-os/src/components/dashboard/`, `src/hooks/useDashboard.ts`

### Subtasks:
- [ ] FRONT‑DASH‑001.1: Create dashboard component structure with metric cards. (AGENT) – `components/dashboard/`  
  **verification:** Components render with mock data.
- [ ] FRONT‑DASH‑001.2: Implement `useDashboard` hook using React Query to call API‑DASH‑001. (AGENT) – `src/hooks/useDashboard.ts`  
  **verification:** Hook fetches data successfully; includes loading/error states.
- [ ] FRONT‑DASH‑001.3: Add skeleton loaders and error handling to dashboard components. (AGENT)  
  **verification:** Loading states display properly; error banner appears on API failure.
- [ ] FRONT‑DASH‑001.4: Implement responsive bento grid layout for dashboard. (AGENT) – `components/dashboard/Dashboard.tsx`  
  **verification:** Layout adapts correctly to different viewport sizes.
- [ ] FRONT‑DASH‑001.5: Add 30‑second polling refresh with user control to pause/resume. (AGENT)  
  **verification:** Data refreshes automatically; pause/resume controls work.
- [ ] FRONT‑DASH‑001.6: Update main dashboard page to use new aggregation endpoint. (AGENT) – `src/pages/Dashboard.tsx`  
  **verification:** Dashboard displays real aggregated data from API.

---

## Progress Tracking

### Overall Status
**Dashboard Context:** [ ] 0/2 parent tasks complete

### Context Breakdown
- **Backend Aggregation:** [ ] 0/1 complete (API endpoint)
- **Frontend Implementation:** [ ] 0/1 complete (components & hooks)

### Dependencies
- **All Phase 3 APIs** provide data sources for aggregation
- **API‑DASH‑001** enables frontend dashboard functionality
- **React Query** provides data fetching and caching
- **Bento grid layout** provides responsive design system

### Next Actions
- [ ] Start API-DASH-001.1: Add dashboard endpoint to OpenAPI
- [ ] Start FRONT-DASH-001.1: Create dashboard component structure
- [ ] Start FRONT-DASH-001.2: Implement useDashboard hook

### Verification Commands
```bash
# Backend Dashboard verification
pnpm test -- dashboard
pnpm typecheck

# Frontend Dashboard verification
pnpm --filter @workspace/apex-os run dev
# Verify dashboard renders correctly
```

---

## File Index

### Backend
- `lib/api-spec/openapi.yaml` - Dashboard aggregation OpenAPI spec
- `artifacts/api-server/src/services/dashboard/dashboard-service.ts` - Dashboard aggregation service
- `routes/dashboard.ts` - Dashboard routes
- `artifacts/api-server/__tests__/api/dashboard.test.ts` - Integration tests

### Frontend
- `src/hooks/useDashboard.ts` - React Query hook for dashboard data
- `artifacts/apex-os/src/components/dashboard/Dashboard.tsx` - Main dashboard component
- `artifacts/apex-os/src/components/dashboard/` - Metric card components:
  - `CRMCard.tsx` - CRM metrics card
  - `ProjectsCard.tsx` - Projects metrics card
  - `FinanceCard.tsx` - Finance metrics card
  - `AppointmentsCard.tsx` - Appointments metrics card
  - `DocumentsCard.tsx` - Documents metrics card
  - `PortalCard.tsx` - Portal metrics card
- `src/pages/Dashboard.tsx` - Dashboard page (updated to use new aggregation)
