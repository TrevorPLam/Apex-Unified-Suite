# TODO-P5-ASSETS.md – Assets Frontend Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Assets Data Integration including asset management, checkout/check-in, and maintenance tracking.

---

## Assets Data Integration

### [ ] FRONT‑ASSETS‑001: Assets & Check‑out – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑ASSETS‑004 (assets green), API‑ASSETS‑008 (checkout green).  
**Definition of Done:** Asset list uses `useAssetList` hook with status filter. Checkout/checkin actions wired. Maintenance log visible per asset. All mock data removed.  
**Deep Module:** Encapsulates asset management logic, checkout workflows, and maintenance tracking with clear API boundaries.  
**Advanced Code Patterns:** Hook-based state management, optimistic updates, form validation patterns.  
**Anti-Patterns:** Avoid direct API calls in components, prevent state synchronization issues.  
**Rules to Follow:** Always validate asset data, implement proper error handling, maintain audit trail.  
**Out of Scope:** Real-time asset tracking, advanced maintenance scheduling.  
**Verification:** `npm test -- useAssetList.test.ts && npm test -- assets.test.tsx && npm run typecheck`  
**Related Files:** `artifacts/apex-os/src/pages/Assets.tsx`

**Subtasks:**
- [ ] FRONT‑ASSETS‑001.1: Create `useAssetList` hook with status and category filters. (AGENT) – `src/hooks/useAssetList.ts`  
  **verification:** Hook returns filtered assets with proper loading states.
- [ ] FRONT‑ASSETS‑001.2: Replace mock asset data in table/grid view. (AGENT) – `src/pages/Assets.tsx`  
  **verification:** Real API data loads correctly.
- [ ] FRONT‑ASSETS‑001.3: Add checkout/checkin buttons per asset; wire mutations. (AGENT)  
  **verification:** Actions update asset status optimistically.
- [ ] FRONT‑ASSETS‑001.4: Display maintenance log on asset detail. (AGENT)  
  **verification:** Maintenance history loads and displays correctly.

---

### [ ] FRONT‑INT‑ASSETS: Assets Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑ASSETS‑001.  
**Definition of Done:** Wiring for: checkout/checkin forms (user selection, date), maintenance schedule creation, asset status update. All with toast feedback.  
**Deep Module:** Encapsulates form logic, validation, and user interaction patterns with clear separation from data layer.  
**Advanced Code Patterns:** Form validation, optimistic updates, toast notifications, modal patterns.  
**Anti-Patterns:** Avoid complex form state in components, prevent inconsistent UI states.  
**Rules to Follow:** Always validate form inputs, provide user feedback, maintain data consistency.  
**Out of Scope:** Advanced workflow automation, bulk operations.  
**Verification:** `npm test -- assets-interactive.test.tsx && npm run typecheck`

**Subtasks:**
- [ ] FRONT‑INT‑ASSETS.1: Wire checkout/checkin mutations with optimistic status change. (AGENT) – `src/components/assets/CheckoutForm.tsx`  
  **verification:** Form submits correctly, UI updates optimistically.
- [ ] FRONT‑INT‑ASSETS.2: Wire maintenance log creation and completion. (AGENT) – `src/components/assets/MaintenanceForm.tsx`  
  **verification:** Maintenance entries create and update correctly.

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Assets components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Assets pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard asset metrics depend on Assets API integration

### Related Master Tracker Tasks
- **API‑ASSETS‑004**: Assets API must be green before FRONT‑ASSETS‑001
- **API‑ASSETS‑008**: Checkout API must be green before FRONT‑ASSETS‑001

---

## Verification Commands

### Assets Integration Verification
```bash
# Core Assets verification
npm test -- useAssetList.test.ts
npm test -- assets.test.tsx

# Interactive features verification
npm test -- assets-interactive.test.tsx

# Manual verification
# Navigate to Assets page, verify all data loads from API
# Test checkout/checkin workflows
# Test maintenance log creation and updates
```

---

## Completion Criteria

### Assets Frontend Integration Complete When:
1. All Assets data (assets, status, maintenance) loads from APIs
2. Checkout/checkin workflows work with proper validation
3. Maintenance tracking provides complete asset lifecycle management
4. All mock data imports are removed from Assets components
5. Component tests pass with MSW mocks
6. Manual testing confirms complete Assets functionality

**Estimated Timeline:** 3-4 days with parallel execution
