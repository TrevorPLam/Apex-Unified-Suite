# TODO-P5-INFRA.md – Phase 5: Frontend Infrastructure

Foundation tasks that must complete before any Phase 5 data-integration work begins. React Query configuration, error boundaries, loading skeletons, the undo/soft-delete UX pattern, and Mock Service Worker (MSW) for isolated component testing.

---

## [ ] FRONT‑INFRA‑001: Configure React Query Client & Error Boundaries
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** `App.tsx` creates a bare `new QueryClient()` with no configuration. No `ErrorBoundary` exists; uncaught render errors produce a blank screen.
**Size:** Small

**Description:** Configure the TanStack React Query client with production-ready defaults and add a global `ErrorBoundary` component that prevents blank-screen failures and offers a user-facing retry path.

**Depends on:** [N/A]
**Blocks:** FRONT‑INFRA‑002, all Phase 5 data-integration tasks (requires stable query/error foundation)
**Related Files:** `artifacts/apex-os/src/App.tsx`, `artifacts/apex-os/src/components/error-boundary.tsx`

**Imports / Exports**
- Imports: `QueryClient`, `QueryClientProvider` from `@tanstack/react-query`; `ErrorBoundary` from `react-error-boundary` (or custom class component)
- Exports: Configured `queryClient` singleton; `ErrorBoundary` component

**Definition of Done**
- [ ] `QueryClient` configured with `staleTime: 5 * 60 * 1000`, `retry: 1`, `refetchOnWindowFocus: false`
- [ ] `ErrorBoundary` wraps all Wouter `<Switch>` routes in `App.tsx`; shows a fallback card with a "Retry" button on render error
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Unit test confirms: broken child component → fallback renders; retry button calls `resetErrorBoundary`

**Out of Scope**
- Network error handling (handled by React Query's retry)
- Route-level error boundaries (use the single global boundary for now)
- Custom error reporting / Sentry integration

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/App.tsx`, `artifacts/apex-os/src/components/error-boundary.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/__tests__/error-boundary.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `App.tsx` to `new QueryClient()`; delete `error-boundary.tsx`
- Halt condition: if `pnpm run typecheck` fails after changes, stop and fix types before proceeding

**Rules to Follow**
- `staleTime`, `retry`, and `refetchOnWindowFocus` must be set — leaving defaults causes excessive refetching and poor UX
- `ErrorBoundary` must never swallow errors silently — always log to console in development
- Use `react-error-boundary` package if already in the dependency catalog; otherwise implement as a class component (React 19 still requires class components for error boundaries)

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os run dev
pnpm --filter @workspace/apex-os test -- error-boundary.test.tsx
```

**Advanced Code Patterns**
- `QueryClient` singleton pattern: create once at module level, pass to `QueryClientProvider` — avoids re-creation on re-renders
- `react-error-boundary` `FallbackComponent` prop pattern: keeps boundary declarative and testable
- Use `useQueryErrorResetBoundary` to reset React Query cache on retry

**Anti-Patterns**
- Creating `QueryClient` inside the component function — new instance on every render, loses cache
- Wrapping only some routes with error boundary — partial coverage leaves other routes unprotected
- Catching errors but not re-throwing in class component `componentDidCatch` — hides bugs in development

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — pure infrastructure.
- TDD: Write the boundary test first: mount a component that throws → assert fallback renders → click retry → assert reset called.
- BDD: [N/A] — developer infrastructure, not user-facing feature.
- Deep Module: `ErrorBoundary` is a narrow-interface deep module — callers just wrap children; all error lifecycle complexity is hidden inside.

---

### Subtasks

- [ ] FRONT‑INFRA‑001.0.25 (AGENT): Read `artifacts/apex-os/src/App.tsx` in full and note current `QueryClient` construction.
  *No action — pause until fully understood.*

- [ ] FRONT‑INFRA‑001.0.5 (AGENT): Research TanStack Query v5 recommended `QueryClient` defaults and `react-error-boundary` v4 API (May 2026). Confirm `useQueryErrorResetBoundary` compatibility with React 19.
  *Document findings briefly.*

- [ ] FRONT‑INFRA‑001.1 (AGENT): Update `QueryClient` configuration in `App.tsx`.
  **File(s):** `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes; `pnpm --filter @workspace/apex-os run dev` starts without console errors.

- [ ] FRONT‑INFRA‑001.2 (AGENT): Implement `ErrorBoundary` component with fallback UI and retry button.
  **File(s):** `artifacts/apex-os/src/components/error-boundary.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INFRA‑001.3 (AGENT): Wrap `App.tsx` routes with `ErrorBoundary`; write unit test.
  **File(s):** `artifacts/apex-os/src/App.tsx`, `artifacts/apex-os/src/components/__tests__/error-boundary.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- error-boundary.test.tsx` → GREEN.

- [ ] FRONT‑INFRA‑001.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INFRA‑002: Add Loading Skeleton Usage Across Pages
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Pages render nothing (or a flash of empty content) during data fetches. The `skeleton.tsx` shadcn component exists in `components/ui/` but is unused at page level.
**Size:** Small

**Description:** Create a reusable `PageSkeleton` component and a `DataLoader` wrapper that displays skeleton placeholders during React Query loading states, then renders children when data arrives.

**Depends on:** FRONT‑INFRA‑001
**Blocks:** All Phase 5 data-integration tasks (required for consistent loading UX)
**Related Files:** `artifacts/apex-os/src/components/page-skeleton.tsx`, `artifacts/apex-os/src/components/data-loader.tsx`, `artifacts/apex-os/src/pages/Dashboard.tsx`, `artifacts/apex-os/src/pages/CRM.tsx`

**Imports / Exports**
- Imports: `Skeleton` from `@/components/ui/skeleton`; React Query `isLoading`, `isFetching` states
- Exports: `PageSkeleton` component; `DataLoader` wrapper component

**Definition of Done**
- [ ] `PageSkeleton` renders a realistic placeholder layout (metric cards, table rows, text lines) using `Skeleton` primitives
- [ ] `DataLoader` accepts `isLoading` prop; renders `PageSkeleton` when true, `children` when false
- [ ] Dashboard and CRM pages integrate `DataLoader` and show skeleton during API fetches
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Per-component inline skeletons (handled by individual component authors)
- Suspense-based loading (use React Query `isLoading` for now)
- Animated shimmer beyond what `skeleton.tsx` provides

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/page-skeleton.tsx`, `artifacts/apex-os/src/components/data-loader.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/__tests__/page-skeleton.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `page-skeleton.tsx` and `data-loader.tsx`; remove `DataLoader` usage from pages
- Halt condition: if `pnpm run typecheck` fails, stop and fix types before proceeding

**Rules to Follow**
- `PageSkeleton` must be purely presentational — no data fetching, no side effects
- `DataLoader` must not re-mount children when transitioning from loading to loaded state (use conditional render, not unmount)
- Apply `DataLoader` only at page root level — not for every sub-component fetch

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- page-skeleton.test.tsx
# Manual: throttle network in devtools → navigate to Dashboard → confirm skeleton appears then disappears
```

**Advanced Code Patterns**
- Compose `PageSkeleton` from `Skeleton` primitives matching the actual page grid layout — makes transitions less jarring
- `DataLoader` can be generic: `<DataLoader isLoading={isLoading} skeleton={<PageSkeleton />}>{children}</DataLoader>`

**Anti-Patterns**
- Using `isFetching` (not `isLoading`) for the skeleton — would show skeleton on every background refetch, causing flicker
- Importing skeleton in every page individually instead of using the `DataLoader` wrapper

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — pure UI infrastructure.
- TDD: Test that `DataLoader` renders `PageSkeleton` when `isLoading=true` and children when `isLoading=false`.
- BDD: "As a user, I see a structured loading placeholder instead of a blank page during data fetches."
- Deep Module: `DataLoader` is a minimal interface hiding the loading-state conditional logic.

---

### Subtasks

- [ ] FRONT‑INFRA‑002.0.25 (AGENT): Inspect `artifacts/apex-os/src/components/ui/skeleton.tsx` to understand available primitives.
  *No action — pause until fully understood.*

- [ ] FRONT‑INFRA‑002.1 (AGENT): Create `PageSkeleton` component mirroring the Dashboard bento-grid layout.
  **File(s):** `artifacts/apex-os/src/components/page-skeleton.tsx`
  **Verification:** Visual inspection in dev — skeleton matches page structure.

- [ ] FRONT‑INFRA‑002.2 (AGENT): Implement `DataLoader` wrapper accepting `isLoading` and `skeleton` props.
  **File(s):** `artifacts/apex-os/src/components/data-loader.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INFRA‑002.3 (AGENT): Apply `DataLoader` to Dashboard and CRM pages; write component test.
  **File(s):** `artifacts/apex-os/src/pages/Dashboard.tsx`, `artifacts/apex-os/src/pages/CRM.tsx`, `artifacts/apex-os/src/components/__tests__/page-skeleton.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- page-skeleton.test.tsx` → GREEN.

- [ ] FRONT‑INFRA‑002.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INFRA‑003: Set Up Mock Service Worker (MSW) for Frontend Testing
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No test infrastructure exists for `@workspace/apex-os`. Vitest and MSW are not configured. Component tests cannot run without a live backend.
**Size:** Medium

**Description:** Configure MSW v2 in the Vite/Vitest test environment so that all Phase 5 component and integration tests can run without a real backend. Set up browser and Node (Vitest) handlers, wire them into the test setup file, and add handlers for the critical API endpoints used by Phase 5 tasks.

**Depends on:** [?] (MSW v2 must be in the `@workspace/apex-os` devDependencies — confirm or add)
**Blocks:** All FRONT‑INT‑* integration testing tasks; all component tests in Phase 5
**Related Files:** `artifacts/apex-os/src/mocks/handlers.ts`, `artifacts/apex-os/src/mocks/server.ts`, `artifacts/apex-os/src/setupTests.ts`, `artifacts/apex-os/vitest.config.ts`

**Imports / Exports**
- Imports: `http`, `HttpResponse` from `msw`; `setupServer` from `msw/node`
- Exports: `server` (MSW Node server instance); `handlers` array

**Definition of Done**
- [ ] MSW v2 is installed in `@workspace/apex-os` devDependencies
- [ ] `artifacts/apex-os/vitest.config.ts` created with `setupFiles: ['./src/setupTests.ts']`
- [ ] `src/setupTests.ts` starts/resets/closes MSW server around each test
- [ ] `src/mocks/handlers.ts` includes handlers for: auth endpoints, CRM leads, projects, invoices, appointments
- [ ] `src/mocks/server.ts` exports the configured MSW Node server
- [ ] All handlers return responses conforming to the OpenAPI schema types
- [ ] `pnpm --filter @workspace/apex-os test` runs without "no tests found" error

**Out of Scope**
- MSW browser service worker for development mode (Node/Vitest handler is sufficient for tests)
- E2E test setup (covered by TODO-P5-TESTING.md E2E tasks)
- Exhaustive handler coverage for every endpoint (add handlers incrementally per feature)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- Never use real HTTP requests in unit/component tests — all network calls must be intercepted by MSW

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/mocks/handlers.ts`, `artifacts/apex-os/src/mocks/server.ts`, `artifacts/apex-os/src/setupTests.ts`, `artifacts/apex-os/vitest.config.ts`
- Tests added/updated in: `artifacts/apex-os/src/mocks/__tests__/handlers.test.ts`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `src/mocks/`, `src/setupTests.ts`, `vitest.config.ts`; no persistent state
- Halt condition: if `pnpm --filter @workspace/apex-os test` cannot discover tests after setup, verify Vitest config glob patterns

**Rules to Follow**
- Use MSW v2 `http.get()`/`http.post()` handlers (not the v1 `rest.*` API)
- `server.resetHandlers()` in `afterEach` prevents test-order coupling
- `server.close()` in `afterAll` prevents open handles in Vitest
- Handler response bodies must match the Zod schemas from `lib/api-zod/src/generated/` exactly

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- handlers.test.ts
pnpm --filter @workspace/apex-os test
```

**Advanced Code Patterns**
- MSW v2 `HttpResponse.json()` with typed response bodies ensures mock data matches generated types
- `server.use(http.get('/api/...', resolver))` for per-test handler overrides (error states, edge cases)
- Keep base handlers in `handlers.ts`; test-specific overrides use `server.use()` in individual test files

**Anti-Patterns**
- Using v1 `rest.*` API with MSW v2 — breaks silently
- Global state in handlers (shared mutable arrays) — causes test-order flakiness
- Handlers that return data mismatched with OpenAPI schema — masks type errors in tests

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — testing infrastructure, not a domain concern.
- TDD: This task IS the TDD enabler for all Phase 5 frontend tests.
- BDD: Supports executable BDD scenarios by mocking API contracts.
- Deep Module: `server.ts` is a deep module — callers get `server.use()` / `server.resetHandlers()`; all MSW lifecycle complexity is hidden inside.

---

### Subtasks

- [ ] FRONT‑INFRA‑003.0.25 (AGENT): Check `artifacts/apex-os/package.json` for MSW and Vitest presence; note versions.
  *No action — pause until fully understood.*

- [ ] FRONT‑INFRA‑003.0.5 (AGENT): Research MSW v2 Vitest integration pattern (May 2026) — confirm `setupServer` from `msw/node` is the correct approach for Vitest environments.
  *Document any breaking changes from v1.*

- [ ] FRONT‑INFRA‑003.1 (AGENT): Create `vitest.config.ts` and `setupTests.ts` with MSW server lifecycle hooks.
  **File(s):** `artifacts/apex-os/vitest.config.ts`, `artifacts/apex-os/src/setupTests.ts`
  **Verification:** `pnpm --filter @workspace/apex-os test -- --list` shows test discovery working.

- [ ] FRONT‑INFRA‑003.2 (AGENT): Create base MSW handlers for auth, CRM, projects, invoices, appointments endpoints.
  **File(s):** `artifacts/apex-os/src/mocks/handlers.ts`, `artifacts/apex-os/src/mocks/server.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INFRA‑003.3 (AGENT): Write smoke test verifying MSW intercepts a request and returns mock data.
  **File(s):** `artifacts/apex-os/src/mocks/__tests__/handlers.test.ts`
  **Verification:** `pnpm --filter @workspace/apex-os test -- handlers.test.ts` → GREEN.

- [ ] FRONT‑INFRA‑003.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑INFRA‑004: Undo / Soft-Delete UX Pattern
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Destructive actions (deletes) across all domain pages have no undo mechanism. Users who accidentally delete a record have no recovery path within the UI.
**Size:** Medium

**Description:** Implement a `useUndoableMutation` hook that wraps TanStack Query mutations; after any soft-delete or destructive status change it shows a 10-second sonner toast with an "Undo" button. Clicking Undo calls the restore API. Apply the hook to all soft-delete actions across CRM, Projects, Finance, Documents, and Assets.

**Depends on:** FRONT‑INFRA‑001
**Blocks:** [N/A] — enhances existing delete actions after they are wired in domain tasks
**Related Files:** `artifacts/apex-os/src/hooks/useUndoableMutation.ts`, `artifacts/apex-os/src/components/UndoToast.tsx`, `artifacts/apex-os/src/hooks/__tests__/useUndoableMutation.test.tsx`

**Imports / Exports**
- Imports: `useMutation` from `@tanstack/react-query`; `toast` from `sonner`; React `useRef`, `useCallback`
- Exports: `useUndoableMutation(options)` hook

**Definition of Done**
- [ ] `useUndoableMutation` accepts `mutationFn`, `undoFn`, `onSuccess`, `onError` and wraps `useMutation`
- [ ] On mutation success, shows a sonner toast with "Undo" button active for 10 seconds; after timeout the toast dismisses
- [ ] Clicking "Undo" calls `undoFn`, invalidates relevant query cache, and dismisses toast
- [ ] Keyboard shortcut `Ctrl+Z` (when undo toast is active) triggers the undo action
- [ ] Hook applied to: CRM lead delete, CRM contact delete, Project delete, Finance invoice delete, Document file delete
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Unit tests cover: mutation fires, undo toast appears, undo triggers restore, timeout expires without undo

**Out of Scope**
- Undo for non-destructive mutations (status changes, renames)
- Multi-level undo (only the most recent action is undoable)
- Persistent undo across page navigation

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/useUndoableMutation.ts`, `artifacts/apex-os/src/components/UndoToast.tsx`
- Tests added/updated in: `artifacts/apex-os/src/hooks/__tests__/useUndoableMutation.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete `useUndoableMutation.ts` and `UndoToast.tsx`; replace `useUndoableMutation` calls with plain `useMutation`
- Halt condition: if undo API call fails and causes data inconsistency, roll back to plain `useMutation` until the restore endpoint is verified

**Rules to Follow**
- The undo window must be exactly 10 seconds — use `setTimeout` referenced via `useRef` to avoid stale closures
- `Ctrl+Z` listener must be removed (`removeEventListener`) when the toast dismisses or the component unmounts
- Never block the UI during the 10-second window — the next action should be possible immediately
- The `undoFn` must invalidate the same query keys that the original `mutationFn` would have invalidated on success

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- useUndoableMutation.test.tsx
```

**Advanced Code Patterns**
- Store the `setTimeout` id in a `useRef` so the cleanup function always references the current timer
- Use `sonner`'s `toast.custom()` to render a countdown progress bar inside the toast
- Expose `isPending` and `isUndoing` states separately so calling components can disable buttons during both phases

**Anti-Patterns**
- Using `useState` for the timer id — triggers re-renders and potentially multiple timers
- Calling `invalidateQueries` inside `undoFn` without awaiting — list may re-fetch before restore completes
- Global singleton for undo state — multiple simultaneous deletes overwrite each other's undo callbacks

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — cross-cutting UX infrastructure, not a domain concept.
- TDD: Write tests first: mutation fires → assert toast shown; click undo → assert `undoFn` called; wait 10s → assert `undoFn` NOT called.
- BDD: "When I delete a lead, a toast appears with 'Undo' for 10 seconds; clicking it restores the lead immediately."
- Deep Module: `useUndoableMutation` is the canonical deep module — callers get a simple `mutate()` function; timer management, toast lifecycle, and keyboard listener complexity are hidden inside.

---

### Subtasks

- [ ] FRONT‑INFRA‑004.0.25 (AGENT): Read `use-toast.ts` and the existing `sonner` usage to understand the toast API in this project.
  *No action — pause until fully understood.*

- [ ] FRONT‑INFRA‑004.0.5 (AGENT): Research `sonner` toast API for custom content and programmatic dismiss (May 2026). Confirm `Ctrl+Z` `keydown` listener pattern in React 19.
  *Document findings briefly.*

- [ ] FRONT‑INFRA‑004.1 (AGENT): Implement `useUndoableMutation` hook with timer and toast logic.
  **File(s):** `artifacts/apex-os/src/hooks/useUndoableMutation.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑INFRA‑004.2 (AGENT): Implement `UndoToast` component with countdown progress bar.
  **File(s):** `artifacts/apex-os/src/components/UndoToast.tsx`
  **Verification:** `pnpm run typecheck` passes; visual check shows countdown bar.

- [ ] FRONT‑INFRA‑004.3 (AGENT): Add `Ctrl+Z` keyboard shortcut and write unit tests.
  **File(s):** `artifacts/apex-os/src/hooks/useUndoableMutation.ts`, `artifacts/apex-os/src/hooks/__tests__/useUndoableMutation.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- useUndoableMutation.test.tsx` → GREEN.

- [ ] FRONT‑INFRA‑004.4 (AGENT): Apply `useUndoableMutation` to CRM lead delete, CRM contact delete, Project delete, Finance invoice delete, Document file delete.
  **File(s):** Respective component files in `artifacts/apex-os/src/components/crm/`, `projects/`, `finance/`, `documents/`
  **Verification:** Manual test: delete a record → undo toast appears → click Undo → record restored.

- [ ] FRONT‑INFRA‑004.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.
