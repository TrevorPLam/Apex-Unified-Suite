Now producing **Phase 5 – Frontend Data Integration, E2E Tests & Contracts**, fully updated per all corrections. This phase replaces mock data with API‑driven React Query hooks, builds the missing auth pages and route guards, adds error boundaries and loading skeletons, and wires every interactive element to live mutations. It also establishes Playwright end‑to‑end tests and consumer‑driven contracts.

Key improvements applied:

- **Split `FRONT‑INT‑001`** into per‑context wiring tasks, each placed immediately after its corresponding “replace mock data” task.
- **FRONT‑AUTH‑003** (Portal Auth UI) separated from `FRONT‑AUTH‑002`.
- **FRONT‑PROJ‑003** (Scheduler tab) inserted after `FRONT‑PROJ‑001`.
- **FRONT‑PORTAL‑001** split into firm‑side and client‑side, with portal auth guard using `PortalAuthContext`.
- **FRONT‑APPT‑001** wires the Scheduler tab to the read‑only projection (anti‑corruption layer) and adds a standalone appointment booking flow.
- Verification commands, `depends_on` chains, and depth refactor checks where applicable.
- Pagination, error handling, and loading states are now fully integrated.

---

# Phase 5 – Frontend Data Integration, E2E Tests & Contracts

---

## Phase 5 Task Index

### Frontend Infrastructure
- [ ] FRONT‑INFRA‑001 – Configure React Query Client & Error Boundaries  
- [ ] FRONT‑INFRA‑002 – Add Loading Skeleton Usage Across Pages  

### Frontend Authentication
- [ ] FRONT‑AUTH‑001 – Build Login / Register Pages (Firm)  
- [ ] FRONT‑AUTH‑002 – Implement Protected Routes & Route Guards (Firm)  
- [ ] FRONT‑AUTH‑003 – Portal Authentication UI (Magic Link Flow)  

### Dashboard
- [ ] FRONT‑DASH‑001 – Dashboard – Replace Mock Data with API Hooks  

### CRM
- [ ] FRONT‑CRM‑001 – CRM Lead Pipeline – Replace Mock Data  
- [ ] FRONT‑CRM‑002 – CRM Contacts & Companies – Replace Mock Data  
- [ ] FRONT‑CRM‑003 – CRM Deals & Activities – Replace Mock Data  
- [ ] FRONT‑INT‑CRM – CRM Interactive Features Wiring (mutations, drag‑and‑drop)  

### Projects
- [ ] FRONT‑PROJ‑001 – Projects & Tasks – Replace Mock Data  
- [ ] FRONT‑PROJ‑002 – Milestones & Calendar – Replace Mock Data  
- [ ] FRONT‑PROJ‑003 – Scheduler Tab (Read‑Only Appointments)  
- [ ] FRONT‑INT‑PROJ – Projects Interactive Features Wiring (task toggle, status changes)  

### Finance
- [ ] FRONT‑FIN‑001 – Invoices & Payments – Replace Mock Data  
- [ ] FRONT‑FIN‑002 – Budgets & Spend Cards – Replace Mock Data  
- [ ] FRONT‑INT‑FIN – Finance Interactive Features Wiring (approve, pay, freeze)  

### Documents
- [ ] FRONT‑DOCS‑001 – Documents & Folders – Replace Mock Data  
- [ ] FRONT‑INT‑DOCS – Documents Interactive Features Wiring (upload, preview, delete)  

### Assets
- [ ] FRONT‑ASSETS‑001 – Assets & Check‑out – Replace Mock Data  
- [ ] FRONT‑INT‑ASSETS – Assets Interactive Features Wiring (checkout, checkin)  

### Client Portal
- [ ] FRONT‑PORTAL‑001a – Firm‑Side Portal Management – Replace Mock Data  
- [ ] FRONT‑PORTAL‑001b – Client‑Side Portal Access – Replace Mock Data  
- [ ] FRONT‑INT‑PORTAL – Portal Interactive Features Wiring (messages, permissions)  

### Appointments
- [ ] FRONT‑APPT‑001 – Appointments UI Integration (Scheduler + Booking)  

### Analytics
- [ ] FRONT‑ANALYTICS‑001 – Analytics – Replace Hardcoded Charts with API Hooks  

### Settings
- [ ] FRONT‑SETTINGS‑001 – Settings & Audit Log – Replace Mock Data  

### Cross‑Cutting Integration
- [ ] FRONT‑INT‑CROSS – Wire Remaining Shared Features (command palette, toast notifications, etc.)  
- [ ] FRONT‑INT‑RETRY – Add Retry Mechanisms & Error Recovery  
- [ ] FRONT‑INT‑NETWORK – Add Network Status Detection & Offline Handling  
- [ ] FRONT‑INT‑PERF – Add Core Web Vitals Monitoring  

### End‑to‑End Testing
- [ ] E2E‑001 – Set Up Playwright & Write Critical Path Tests  
- [ ] E2E‑002 – Add Accessibility Testing with axe-core  

### Data Migration & Validation
- [ ] MIGRATE‑001 – Add Data Migration Validation Tests  

### Feature Flag Infrastructure (Post-MVP)
- [ ] FLAGS‑001 – Add Feature Flag System for Gradual Rollout *(Deferred to Post-MVP appendix unless backend service is made)*  

### Consumer‑Driven Contracts
- [ ] INTEGRATE‑001 – Define Consumer‑Driven Contracts Between Contexts

### API Specification Structure
- [ ] API‑SPEC‑STRUCTURE – OpenAPI Modularization Note *(When spec exceeds ~500 lines, split into per‑context files under `lib/api-spec/contexts/` and use `$ref`)*

### Code Quality & Architecture
- [ ] ESLINT‑001 – ESLint Cross‑Context Import Guard *(Configure `no-restricted-imports` to prevent, e.g., Finance importing CRM internals)*  

---

## Frontend Infrastructure

### FRONT‑INFRA‑001: Configure React Query Client & Error Boundaries
**Status:** ⏳ Not Started  
**Depends on:** None (pure frontend).  
**Definition of Done:**
- `QueryClient` in `App.tsx` is configured with: `staleTime: 5 * 60 * 1000`, `retry: 1`, `refetchOnWindowFocus: false`.
- A generic `ErrorBoundary` component (`components/error-boundary.tsx`) wraps all routes, catching rendering errors and showing a fallback UI with a “Retry” button.
- The boundary uses `react-error-boundary` or a custom class component.

**Subtasks:**
- [ ] FRONT‑INFRA‑001.1: Update `QueryClient` configuration. (AGENT)  
  **verification:** `pnpm typecheck` passes; app starts without errors.
- [ ] FRONT‑INFRA‑001.2: Implement `ErrorBoundary` component. (AGENT)  
  **verification:** Unit test with a broken child shows fallback UI.
- [ ] FRONT‑INFRA‑001.3: Wrap `App.tsx` routes with `ErrorBoundary`. (AGENT)  
  **verification:** Manual test forcing an error.
- **Blocks:** All data integration tasks (stability).

---

### FRONT‑INFRA‑002: Add Loading Skeleton Usage Across Pages
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑INFRA‑001.  
**Definition of Done:**
- A `PageSkeleton` component uses existing `skeleton.tsx` primitives to render a full‑page loading placeholder.
- A `<DataLoader>` wrapper or similar uses React Query’s `isLoading` to show the skeleton; when data arrives, it renders the children.
- At least the Dashboard and CRM pages integrate the loader.

**Subtasks:**
- [ ] FRONT‑INFRA‑002.1: Create `PageSkeleton` component. (AGENT)  
  **verification:** Visual test (Storybook or manual).
- [ ] FRONT‑INFRA‑002.2: Apply loader to top‑level page layout using a wrapper that checks `isLoading` from the primary query. (AGENT)  
  **verification:** During API call, skeleton appears; disappears on success.

---

## Frontend Authentication

### FRONT‑AUTH‑001: Build Login / Register Pages (Firm)
**Status:** ⏳ Not Started  
**Depends on:** AUTH‑009 (AuthContext), AUTH‑005 (service types).  
**Definition of Done:**
- `pages/login.tsx` and `pages/register.tsx` created with React Hook Form + Zod validation.
- Forms call `AuthContext.login()` and `AuthContext.register()`, showing errors from API (domain errors mapped to field messages).
- On success, redirect to dashboard.
- Organization selection/input included in registration form.

**Subtasks:**
- [ ] FRONT‑AUTH‑001.1: Create `Login` page. (AGENT)  
  **verification:** Unit test with mocked auth context.
- [ ] FRONT‑AUTH‑001.2: Create `Register` page. (AGENT)  
  **verification:** Test with mocked register.
- **Blocks:** FRONT‑AUTH‑002 (protected routes point to login).

---

### FRONT‑AUTH‑002: Implement Protected Routes & Route Guards (Firm)
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑AUTH‑001, AUTH‑009.  
**Definition of Done:**
- A `ProtectedRoute` component checks `useAuth().isAuthenticated`; if false, redirects to `/login`.
- All business pages (Dashboard, CRM, Projects, etc.) are wrapped with `ProtectedRoute`.
- The guard is separate from the portal guard (portal routes are not handled here).

**Subtasks:**
- [ ] FRONT‑AUTH‑002.1: Implement `ProtectedRoute`. (AGENT)  
  **verification:** Unit test: unauthenticated → redirect; authenticated → renders children.
- [ ] FRONT‑AUTH‑002.2: Wrap all firm pages with the component. (AGENT)  
  **verification:** Manual test.

---

### FRONT‑AUTH‑003: Portal Authentication UI (Magic Link Flow)
**Status:** ⏳ Not Started  
**Depends on:** PORTAL‑AUTH‑001 (API), EMAIL‑SERVICE‑001 (concept).  
**Definition of Done:**
- `PortalAuthContext` and `usePortalAuth` hook created (separate from firm auth, stored in its own context / localStorage key).
- Portal login page at `/portal/login`: email input → `POST /portal/auth/request-link` → success message.
- Portal verify page at `/portal/verify?token=...`: auto‑submits token on load, stores portal JWT, redirects to portal dashboard.
- Portal auth guard (a `PortalProtectedRoute` or a wrapper that checks `usePortalAuth`) protects client‑side routes.

**Subtasks:**
- [ ] FRONT‑AUTH‑003.1: Implement `PortalAuthContext` and `usePortalAuth`. (AGENT)  
  **verification:** Unit test.
- [ ] FRONT‑AUTH‑003.2: Create `/portal/login` page. (AGENT)  
  **verification:** Simulate email form submission → API mock.
- [ ] FRONT‑AUTH‑003.3: Create `/portal/verify` page. (AGENT)  
  **verification:** Test with mock token.
- [ ] FRONT‑AUTH‑003.4: Implement portal route guard. (AGENT)  
  **verification:** Redirect test.
- **Blocks:** FRONT‑PORTAL‑001b (client‑side portal data).

---

## Dashboard

### FRONT‑DASH‑001: Dashboard – Replace Mock Data with API Hooks
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005, API‑PROJ‑004, API‑FIN‑004 (dashboard aggregates data from multiple contexts – a summary API may be needed; otherwise it will call multiple endpoints). Assume we will create a lightweight dashboard aggregation endpoint or it will query several hooks.  
**Definition of Done:** Dashboard fetches real data. If aggregation endpoint doesn't exist yet, the task will combine `useLeadList`, `useProjectList`, etc., with client‑side reduction. All mock imports removed.

---

## CRM Data Integration

### FRONT‑CRM‑001: CRM Lead Pipeline – Replace Mock Data
Replace `mockData.crmLeads` with `useLeadList` and stage filtering. Kanban columns dynamically built from API data.

### FRONT‑CRM‑002: CRM Contacts & Companies – Replace Mock Data
Use `useContactList`, `useCompanyList`. Search and sort implemented.

### FRONT‑CRM‑003: CRM Deals & Activities – Replace Mock Data
Use `useDealList`, `useActivityList`. Pipeline updates wired via mutations later.

---

### FRONT‑INT‑CRM: CRM Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑CRM‑001, FRONT‑CRM‑002, FRONT‑CRM‑003, API‑CRM‑005 (routes exist).  
**Definition of Done:**  
- Drag‑and‑drop lead stage change calls `useUpdateLead` mutation (optimistic update: move card immediately, rollback on failure).
- Create lead form uses `useCreateLead` mutation, on success invalidates lead list.
- Deal stage change wired similarly.
- Activity creation form hooks to `useCreateActivity`.
- All mutation loading/error states displayed using toast notifications.

**Subtasks** for each mutation, with component tests using MSW.

---

## Projects Data Integration

### FRONT‑PROJ‑001: Projects & Tasks – Replace Mock Data
Replace mock projects/tasks with `useProjectList`, `useTaskList`. Task status displayed from API.

### FRONT‑PROJ‑002: Milestones & Calendar – Replace Mock Data
Use `useMilestoneList`, wire calendar to real milestones and deadlines.

### FRONT‑PROJ‑003: Scheduler Tab (Read‑Only Appointments)
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑005 (ProjectSchedulerService – ACL), FRONT‑PROJ‑001.  
**Definition of Done:** The Scheduler tab in Projects renders a read‑only calendar grid populated by a `useProjectSchedule` hook that calls the ACL endpoint (`GET /projects/{id}/schedule`). No booking forms appear here.

---

### FRONT‑INT‑PROJ: Projects Interactive Features Wiring
**Depends on:** FRONT‑PROJ‑001–003.  
**Wiring:** task toggle (checkbox → `useUpdateTask` mutation, optimistic), project status change, milestone completion. All with toast feedback.

---

## Finance Data Integration

### FRONT‑FIN‑001: Invoices & Payments – Replace Mock Data
### FRONT‑FIN‑002: Budgets & Spend Cards – Replace Mock Data

### FRONT‑INT‑FIN: Finance Interactive Features Wiring
**Depends on:** FRONT‑FIN‑001, FRONT‑FIN‑002.  
**Wiring:** invoice approve/reject, payment form with idempotency key generation (client‑side UUID), card freeze/unfreeze, budget update. Mutation hooks with cache invalidation.  
**Idempotency Key Reuse:** Frontend must store the generated idempotency key in component state and retransmit the same key on retry attempts. The key persists until the payment succeeds or fails permanently, preventing duplicate charges.

---

## Documents Data Integration

### FRONT‑DOCS‑001: Documents & Folders – Replace Mock Data

### FRONT‑INT‑DOCS: Documents Interactive Features Wiring
**Depends on:** FRONT‑DOCS‑001.  
**Wiring:** file upload (multipart, progress), download via signed URL, soft delete, folder create/rename. Use mutation hooks.

---

## Assets Data Integration

### FRONT‑ASSETS‑001: Assets & Check‑out – Replace Mock Data

### FRONT‑INT‑ASSETS: Assets Interactive Features Wiring
**Wiring:** checkout/checkin forms, maintenance schedule creation.

---

## Client Portal Data Integration

### FRONT‑PORTAL‑001a: Firm‑Side Portal Management – Replace Mock Data
Uses firm‑side hooks (`useClientList`, `usePortalUpdate`, `useGrantPermission`, etc.).

### FRONT‑PORTAL‑001b: Client‑Side Portal Access – Replace Mock Data
Uses client‑side hooks under portal auth guard. Pages: portal dashboard, projects list, invoices, documents, messages.

### FRONT‑INT‑PORTAL: Portal Interactive Features Wiring
**Wiring:** firm sends message, client replies (real‑time? not yet – mutations with refetch), permission granting forms.

---

## Appointments UI Integration

### FRONT‑APPT‑001: Appointments UI Integration
**Status:** ⏳ Not Started  
**Depends on:** API‑APPT‑004 (appointments API), FRONT‑PROJ‑003 (scheduler tab), FRONT‑AUTH‑003 (portal auth).  
**Definition of Done:**  
- Scheduler tab in Projects already wired (read‑only).  
- A dedicated Appointments page (or modal) for firm users lists appointments and allows confirmation/cancellation.  
- A client‑facing booking flow (after portal login) shows available slots and allows booking a time.  
- All uses React Query hooks (`useAppointmentList`, `useAvailableSlots`, `useRequestAppointment`, `useConfirmAppointment`, `useCancelAppointment`).

**Subtasks:**
- [ ] FRONT‑APPT‑001.1: Firm appointment management UI. (AGENT)  
  **verification:** Unit test.
- [ ] FRONT‑APPT‑001.2: Client booking flow UI. (AGENT)  
  **verification:** Test with portal auth mock.
- [ ] FRONT‑APPT‑001.3: Wire mutations with toast feedback. (AGENT)  
  **verification:** End‑to‑end manual test.

---

## Analytics & Settings Data Integration

### FRONT‑ANALYTICS‑001: Analytics – Replace Hardcoded Charts
Use `useReportList` and dynamic chart configurations.

### FRONT‑SETTINGS‑001: Settings & Audit Log – Replace Mock Data
Use `useSettings`, `useAuditLogList`, role management forms.

### FRONT‑INT‑CROSS: Wire Remaining Shared Features
**Wiring:** command palette actions, global toast notifications, theme toggle. Already mostly functional, but ensure they interface with real data where applicable.

---

### FRONT‑INT‑RETRY: Add Retry Mechanisms & Error Recovery
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑INFRA‑001 (React Query configured).  
**Definition of Done:**
- Critical queries (dashboard metrics, user data) configured with `retry: 3` and exponential backoff
- Network error detection with user-friendly retry buttons
- Failed mutations queued for automatic retry when network restored
- Error boundary includes "Try Again" functionality that refetches data
- Offline queue for user actions that sync when connection restored

**Subtasks:**
- [ ] FRONT‑INT‑RETRY.1: Configure retry logic for critical queries. (AGENT)  
  **verification:** Network failure shows retry UI, automatic retry works.
- [ ] FRONT‑INT‑RETRY.2: Add offline action queue. (AGENT)  
  **verification:** Actions taken offline sync when connection restored.
- [ ] FRONT‑INT‑RETRY.3: Enhance error boundary with retry functionality. (AGENT)  
  **verification:** Error boundary provides retry button that refetches data.

---

### FRONT‑INT‑NETWORK: Add Network Status Detection & Offline Handling
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑INT‑RETRY.  
**Definition of Done:**
- Network status indicator in header (online/offline with connection quality)
- Automatic detection of network connectivity changes
- Offline mode shows cached data with clear "offline" indicators
- Background sync when connection restored
- Graceful degradation for slow/poor connections

**Subtasks:**
- [ ] FRONT‑INT‑NETWORK.1: Implement network status detection. (AGENT)  
  **verification:** Status indicator updates when network changes.
- [ ] FRONT‑INT‑NETWORK.2: Add offline mode UI. (AGENT)  
  **verification:** Offline shows cached data with clear indicators.
- [ ] FRONT‑INT‑NETWORK.3: Implement background sync. (AGENT)  
  **verification:** Data syncs automatically when connection restored.

---

### FRONT‑INT‑PERF: Add Core Web Vitals Monitoring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑INFRA‑001.  
**Definition of Done:**
- Core Web Vitals (LCP, INP, CLS) monitoring integrated
- Performance metrics sent to backend for aggregation
- Performance budget warnings in development
- Bundle size monitoring and alerts
- User experience scoring dashboard

**Subtasks:**
- [ ] FRONT‑INT‑PERF.1: Integrate web-vitals library. (AGENT)  
  **verification:** Metrics appear in browser console and backend logs.
- [ ] FRONT‑INT‑PERF.2: Add performance budget monitoring. (AGENT)  
  **verification:** Development warnings when budgets exceeded.
- [ ] FRONT‑INT‑PERF.3: Create performance dashboard. (AGENT)  
  **verification:** Dashboard shows UX scores and trends.

---

## End‑to‑End Testing

### E2E‑001: Set Up Playwright & Write Critical Path Tests
**Status:** ⏳ Not Started  
**Depends on:** All Phase 5 integration tasks (app functional), TEST‑INFRA‑001.  
**Definition of Done:**
- Playwright installed and configured (`playwright.config.ts`).
- Test database provisioned for E2E, seeded with known data.
- Critical path script: register organisation → login → create lead → move to contacted → convert to deal → create project → assign task → mark task complete → verify progress updated.
- Additional scenarios: invoice approval, asset checkout, magic link portal booking.
- Tests run headless and pass.

**Subtasks:**
- [ ] E2E‑001.1: Configure Playwright and base URL. (AGENT)  
  **verification:** `npx playwright test` runs.
- [ ] E2E‑001.2: Create seed for E2E test database. (AGENT)  
  **verification:** Seed runs.
- [ ] E2E‑001.3: Write critical path test. (AGENT)  
  **verification:** Test passes against running stack.
- [ ] E2E‑001.4: Write additional scenario tests. (AGENT)  
  **verification:** All green.

---

### E2E‑002: Add Accessibility Testing with axe-core
**Status:** ⏳ Not Started  
**Depends on:** E2E‑001 (Playwright configured).  
**Definition of Done:**
- axe-core integrated into Playwright test suite
- Critical path tests include accessibility audits
- WCAG 2.2 AA compliance verification on all major pages
- Automated accessibility reporting with test failures
- Color contrast, keyboard navigation, and screen reader tests

**Subtasks:**
- [ ] E2E‑002.1: Install and configure axe-core with Playwright. (AGENT)  
  **verification:** Accessibility checks run in existing tests.
- [ ] E2E‑002.2: Add accessibility audits to critical path tests. (AGENT)  
  **verification:** WCAG violations cause test failures.
- [ ] E2E‑002.3: Create dedicated accessibility test suite. (AGENT)  
  **verification:** All pages pass accessibility checks.

---

## Data Migration & Validation

### MIGRATE‑001: Add Data Migration Validation Tests
**Status:** ⏳ Not Started  
**Depends on:** All data integration tasks complete.  
**Definition of Done:**
- Tests validate migration from mock data structure to real API data
- Data integrity checks ensure no data loss during migration
- Performance tests for large dataset migrations
- Rollback procedures tested and documented
- Migration dry-run functionality validated

**Subtasks:**
- [ ] MIGRATE‑001.1: Create data structure comparison tests. (AGENT)  
  **verification:** Mock and API data structures match expected schema.
- [ ] MIGRATE‑001.2: Add migration integrity validation. (AGENT)  
  **verification:** No data corruption during migration process.
- [ ] MIGRATE‑001.3: Test migration rollback procedures. (AGENT)  
  **verification:** Rollback restores original state correctly.

---

## Feature Flag Infrastructure

### FLAGS‑001: Add Feature Flag System for Gradual Rollout
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑INFRA‑001.  
**Definition of Done:**
- Feature flag service integrated (client-side with remote config)
- Critical features flagged for gradual rollout
- A/B testing framework capability
- Feature flag dashboard for management
- Emergency kill switch functionality

**Subtasks:**
- [ ] FLAGS‑001.1: Implement feature flag client service. (AGENT)  
  **verification:** Features can be toggled via configuration.
- [ ] FLAGS‑001.2: Add flags to critical new features. (AGENT)  
  **verification:** New features respect flag state.
- [ ] FLAGS‑001.3: Create feature flag management interface. (AGENT)  
  **verification:** Dashboard allows flag management.
- [ ] FLAGS‑001.4: Add emergency kill switch. (AGENT)  
  **verification:** Critical features can be disabled instantly.

---

## Consumer‑Driven Contracts

### INTEGRATE‑001: Define Consumer‑Driven Contracts Between Contexts
**Status:** ⏳ Not Started  
**Depends on:** All API contexts are implemented.  
**Definition of Done:**
- Use file‑based contracts (JSON files in `contracts/`).
- Define at least the CRM‑Projects boundary: contract specifies the shape of `GET /crm/companies/{id}` response consumed by Projects.
- Consumer test (Projects service) verifies it expects `{ id, name, domain }`.
- Provider verification (CRM endpoint) runs against a running server and checks that the response matches the contract.
- Script `pnpm run contracts:verify` runs both sides.

**Subtasks:**
- [ ] INTEGRATE‑001.1: Create contract file for CRM‑Projects. (AGENT)  
  **verification:** File valid.
- [ ] INTEGRATE‑001.2: Write consumer test (Projects side). (AGENT)  
  **verification:** Test fails until provider verification passes.
- [ ] INTEGRATE‑001.3: Write provider verification test. (AGENT)  
  **verification:** Pass.
- [ ] INTEGRATE‑001.4: Add `contracts:verify` script. (AGENT)  
  **verification:** `pnpm run contracts:verify` works.

---

*End of Phase 5. The application is now fully data‑driven, interactive, and covered by E2E and contract tests. Next: Phase 6 – Production Readiness & DevOps.*