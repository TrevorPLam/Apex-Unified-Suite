# TODO-P5-INFRA.md – Frontend Infrastructure

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Frontend Infrastructure including React Query configuration, error boundaries, loading skeletons, and Mock Service Worker setup for testing.

---

## Frontend Infrastructure

### [ ] FRONT‑INFRA‑001: Configure React Query Client & Error Boundaries
**Status:** ⏳ Not Started  
**Depends on:** None (pure frontend).  
**Definition of Done:**
- `QueryClient` in `App.tsx` is configured with: `staleTime: 5 * 60 * 1000`, `retry: 1`, `refetchOnWindowFocus: false`.
- A generic `ErrorBoundary` component (`components/error-boundary.tsx`) wraps all routes, catching rendering errors and showing a fallback UI with a "Retry" button.
- The boundary uses `react-error-boundary` or a custom class component.

**DDD:** N/A – infrastructure.  
**TDD:** Write component tests for error boundary behaviour.  
**BDD:** N/A.  
**Deep Module:** N/A.

**Subtasks:**
- [ ] FRONT‑INFRA‑001.1: Update `QueryClient` configuration in `App.tsx`. (AGENT) – `artifacts/apex‑os/src/App.tsx`  
  **verification:** `pnpm typecheck` passes; app starts without errors.
- [ ] FRONT‑INFRA‑001.2: Implement `ErrorBoundary` component with fallback UI and retry button. (AGENT) – `artifacts/apex‑os/src/components/error-boundary.tsx`  
  **verification:** Unit test with a broken child shows fallback UI; retry button calls reset.
- [ ] FRONT‑INFRA‑001.3: Wrap `App.tsx` routes with `ErrorBoundary`. (AGENT)  
  **verification:** Manual test forcing an error shows fallback instead of blank screen.
- **Blocks:** All data integration tasks (stability).

---

### [ ] FRONT‑INFRA‑002: Add Loading Skeleton Usage Across Pages
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑INFRA‑001.  
**Definition of Done:**
- A `PageSkeleton` component uses existing `skeleton.tsx` primitives to render a full‑page loading placeholder.
- A `<DataLoader>` wrapper or similar uses React Query's `isLoading` to show the skeleton; when data arrives, it renders the children.
- At least the Dashboard and CRM pages integrate the loader.

**Subtasks:**
- [ ] FRONT‑INFRA‑002.1: Create `PageSkeleton` component. (AGENT) – `artifacts/apex‑os/src/components/page-skeleton.tsx`  
  **verification:** Visual test (manual) – skeleton renders with cards, table rows, and text placeholders.
- [ ] FRONT‑INFRA‑002.2: Apply loader to top‑level page layout using a wrapper that checks `isLoading` from the primary query. (AGENT)  
  **verification:** During API call, skeleton appears; disappears on success. Test with throttled network.
- **Blocks:** All data integration tasks (UX consistency).

---

### [ ] FRONT‑INFRA‑003: Set Up Mock Service Worker (MSW) for Frontend Testing
**Status:** ⏳ Not Started  
**Depends on:** DEP‑001 (MSW dependency added to catalog).  
**Definition of Done:**
- MSW is configured in the frontend test environment with mock API handlers
- Service worker is properly registered for development and test modes
- Mock handlers cover critical API endpoints used in Phase 5 integration tests
- Test setup includes MSW browser and node configurations
- Component tests can run without real backend dependencies

**Related Files:** `artifacts/apex-os/src/mocks/handlers.ts`, `artifacts/apex-os/src/mocks/server.ts`, `artifacts/apex-os/src/setupTests.ts`

**DDD:** N/A – testing infrastructure prerequisite.  
**TDD:** MSW enables isolated component testing with realistic API responses.  
**BDD:** Supports executable specifications by mocking API contracts.  
**Deep Module:** N/A.

**Subtasks:**
- [ ] FRONT‑INFRA‑003.1: Create MSW handlers for auth endpoints (register, login, refresh, logout). (AGENT) – `src/mocks/handlers.ts`  
  **verification:** Handlers return proper mock responses matching OpenAPI schema.
- [ ] FRONT‑INFRA‑003.2: Set up MSW server configuration for browser and node environments. (AGENT) – `src/mocks/server.ts`  
  **verification:** Server starts and stops correctly in test setup.
- [ ] FRONT‑INFRA‑003.3: Configure MSW in test setup file (`setupTests.ts`). (AGENT)  
  **verification:** Component tests can run with mocked API responses.
- [ ] FRONT‑INFRA‑003.4: Add mock handlers for key business endpoints (CRM leads, projects, invoices, appointments). (AGENT)  
  **verification:** Integration tests with MSW pass without real backend.
- **Blocks:** All Phase 5 integration testing tasks (FRONT‑INT‑* series).

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-AUTH.md**: Authentication components depend on FRONT‑INFRA‑001 error boundaries
- **TODO-P5-DASHBOARD.md**: Dashboard integration depends on FRONT‑INFRA‑002 loading skeletons
- **All TODO-P5-*.md files**: Integration testing depends on FRONT‑INFRA‑003 MSW setup

### Related Master Tracker Tasks
- **FRONT‑INFRA‑001**: Enables stable frontend for all data integration
- **FRONT‑INFRA‑002**: Provides consistent UX across all pages
- **FRONT‑INFRA‑003**: Enables testing without backend dependencies

---

## Verification Commands

### Infrastructure Verification
```bash
# FRONT-INFRA-001 verification
pnpm typecheck
pnpm dev  # Verify app starts with QueryClient config
npm test -- error-boundary.test.tsx

# FRONT-INFRA-002 verification
npm test -- page-skeleton.test.tsx
# Manual test: throttle network in dev tools, navigate to pages

# FRONT-INFRA-003 verification
npm test -- msw-setup.test.tsx
npm test -- handlers.test.ts
```

---

## Completion Criteria

### Frontend Infrastructure Complete When:
1. React Query is properly configured with production-ready settings
2. Error boundaries prevent app crashes and provide recovery paths
3. Loading skeletons provide consistent UX during data fetching
4. MSW enables comprehensive frontend testing without backend
5. All verification commands pass
6. Integration tests can run in isolation with mocked APIs

**Estimated Timeline:** 2-3 days with parallel execution
