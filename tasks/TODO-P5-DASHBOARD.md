# TODO-P5-DASHBOARD.md – Dashboard Data Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Dashboard data integration, replacing mock data with real API hooks.

---

## Dashboard

### [ ] FRONT‑DASH‑001: Dashboard – Replace Mock Data with API Hooks
**Status:** ⏳ Not Started  
**Depends on:** API‑DASH‑001 (dashboard aggregation endpoint).  
**Definition of Done:** `src/pages/Dashboard.tsx` fetches real data from the `API‑DASH‑001` endpoint using a React Query hook. All mock data imports (`mockData.metrics`, etc.) are removed except for fallback states.  
**Related Files:** `artifacts/apex-os/src/pages/Dashboard.tsx`, `artifacts/apex-os/src/hooks/useDashboard.ts`

**DDD:** Dashboard is a read‑only aggregation view across bounded contexts.  
**TDD:** Use MSW to mock the API‑DASH‑001 response and verify component renders data.  
**BDD:** "As a user, I can see my business metrics on the dashboard."  
**Deep Module:** N/A – frontend view.

**Subtasks:**
- [ ] FRONT‑DASH‑001.1: Implement `useDashboard` hook calling `API‑DASH‑001` with period parameter. (AGENT) – `src/hooks/useDashboard.ts`  
  **verification:** `pnpm typecheck`; hook fetches data from MSW mock.
- [ ] FRONT‑DASH‑001.2: Update `Dashboard.tsx` to use `useDashboard` hook and render real data for all metric cards (CRM, Projects, Finance, Appointments, Documents, Portal). (AGENT)  
  **verification:** Component test with MSW – all metrics render; loading state shows skeleton; error state shows retry banner.
- [ ] FRONT‑DASH‑001.3: Remove all `mockData` imports from `Dashboard.tsx`. (AGENT)  
  **verification:** File has no remaining mock data references.
- [ ] FRONT‑DASH‑001.4: Test 30‑second polling refresh works via React Query `refetchInterval`. (AGENT)  
  **verification:** Data refreshes automatically; pause button stops refresh.

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Dashboard depends on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Dashboard depends on FRONT‑AUTH‑002 protected routes
- **TODO-P5-CRM.md**: Dashboard CRM metrics depend on CRM API integration
- **TODO-P5-PROJECTS.md**: Dashboard project metrics depend on Projects API integration
- **TODO-P5-FINANCE.md**: Dashboard finance metrics depend on Finance API integration

### Related Master Tracker Tasks
- **FRONT‑DASH‑001**: Replaces mock data with real dashboard aggregation API
- **API‑DASH‑001**: Backend aggregation endpoint must be complete first

---

## Verification Commands

### Dashboard Integration Verification
```bash
# FRONT-DASH-001 verification
npm test -- useDashboard.test.ts
npm test -- dashboard.test.tsx
pnpm typecheck

# Manual verification
# Navigate to dashboard, verify metrics load from API
# Test pause/resume functionality
# Test error states with MSW failure simulation
```

---

## Completion Criteria

### Dashboard Integration Complete When:
1. Dashboard fetches real data from API‑DASH‑001 endpoint
2. All metric cards display live business data across contexts
3. Loading states show skeletons during data fetching
4. Error states provide retry mechanisms
5. 30-second polling refresh works with pause control
6. All mock data imports are removed
7. Component tests pass with MSW mocks
8. Manual testing confirms complete dashboard functionality

**Estimated Timeline:** 2-3 days
