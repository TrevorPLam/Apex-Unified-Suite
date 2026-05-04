# TODO-P5-AUTH.md – Frontend Authentication

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Frontend Authentication including login/register pages, protected routes, and portal authentication UI.

---

## Frontend Authentication

### [ ] FRONT‑AUTH‑001: Build Login / Register Pages (Firm)
**Status:** ⏳ Not Started  
**Depends on:** AUTH‑009 (AuthContext), AUTH‑005 (service types).  
**Definition of Done:**
- `pages/login.tsx` and `pages/register.tsx` created with React Hook Form + Zod validation.
- Forms call `AuthContext.login()` and `AuthContext.register()`, showing errors from API (domain errors mapped to field messages).
- On success, redirect to dashboard.
- Organization selection/input included in registration form.

**Subtasks:**
- [ ] FRONT‑AUTH‑001.1: Create `Login` page with email, password, and organization fields; handle error states inline. (AGENT) – `artifacts/apex‑os/src/pages/login.tsx`  
  **verification:** `npm test -- login.test.tsx` – form submission calls `login`, shows error message on failure, redirects on success.
- [ ] FRONT‑AUTH‑001.2: Create `Register` page with full‑name, email, password, organization name; handle `DuplicateEmail` error on the email field. (AGENT) – `artifacts/apex‑os/src/pages/register.tsx`  
  **verification:** `npm test -- register.test.tsx` – validates form, handles duplicate email error.
- **Blocks:** FRONT‑AUTH‑002 (protected routes point to login).

---

### [ ] FRONT‑AUTH‑002: Implement Protected Routes & Route Guards (Firm)
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑AUTH‑001, AUTH‑009.  
**Definition of Done:**
- A `ProtectedRoute` component checks `useAuth().isAuthenticated`; if false, redirects to `/login`.
- All business pages (Dashboard, CRM, Projects, etc.) are wrapped with `ProtectedRoute`.
- The guard is separate from the portal guard (portal routes are not handled here).

**Subtasks:**
- [ ] FRONT‑AUTH‑002.1: Implement `ProtectedRoute` component. (AGENT) – `artifacts/apex‑os/src/components/protected-route.tsx`  
  **verification:** Unit test: unauthenticated → redirect to `/login`; authenticated → renders children.
- [ ] FRONT‑AUTH‑002.2: Wrap all firm pages (Dashboard, CRM, Projects, Finance, Documents, Assets, Appointments, Settings) with `ProtectedRoute`. (AGENT) – `artifacts/apex‑os/src/App.tsx`  
  **verification:** Manual test – attempting to navigate to `/dashboard` while logged out redirects to login.

---

### [ ] FRONT‑AUTH‑003: Portal Authentication UI (Magic Link Flow)
**Status:** ⏳ Not Started  
**Depends on:** PORTAL‑AUTH‑001 (API), EMAIL‑SERVICE‑001 (concept).  
**Definition of Done:**
- `PortalAuthContext` and `usePortalAuth` hook created (separate from firm auth, stored in its own context / localStorage key).
- Portal login page at `/portal/login`: email input → `POST /portal/auth/request‑link` → success message.
- Portal verify page at `/portal/verify?token=...`: auto‑submits token on load, stores portal JWT, redirects to portal dashboard.
- Portal auth guard (a `PortalProtectedRoute` or a wrapper that checks `usePortalAuth`) protects client‑side routes.

**Subtasks:**
- [ ] FRONT‑AUTH‑003.1: Implement `PortalAuthContext` and `usePortalAuth`. (AGENT) – `artifacts/apex‑os/src/contexts/PortalAuthContext.tsx`, `src/hooks/usePortalAuth.ts`  
  **verification:** Unit test – login sets token in context, logout clears it.
- [ ] FRONT‑AUTH‑003.2: Create `/portal/login` page. (AGENT) – `artifacts/apex‑os/src/pages/portal/login.tsx`  
  **verification:** Simulate email form submission → success message; API mock called with correct payload.
- [ ] FRONT‑AUTH‑003.3: Create `/portal/verify` page. (AGENT) – `artifacts/apex‑os/src/pages/portal/verify.tsx`  
  **verification:** Test with mock token – page auto‑submits, stores JWT, redirects.
- [ ] FRONT‑AUTH‑003.4: Implement portal route guard. (AGENT) – `artifacts/apex‑os/src/components/portal‑protected‑route.tsx`  
  **verification:** Redirect test – unauthenticated portal user goes to `/portal/login`.
- **Blocks:** FRONT‑PORTAL‑001b (client‑side portal data).

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Authentication components depend on FRONT‑INFRA‑001 error boundaries
- **TODO-P5-DASHBOARD.md**: Protected dashboard routes depend on FRONT‑AUTH‑002
- **TODO-P5-PORTAL.md**: Portal authentication depends on FRONT‑AUTH‑003
- **All TODO-P5-*.md files**: Protected business pages depend on FRONT‑AUTH‑002

### Related Master Tracker Tasks
- **FRONT‑AUTH‑001**: Enables firm user access to the system
- **FRONT‑AUTH‑002**: Secures all business pages behind authentication
- **FRONT‑AUTH‑003**: Enables separate client portal access

---

## Verification Commands

### Authentication Verification
```bash
# FRONT-AUTH-001 verification
npm test -- login.test.tsx
npm test -- register.test.tsx
# Manual test: complete registration flow with mock API

# FRONT-AUTH-002 verification
npm test -- protected-route.test.tsx
# Manual test: navigate to protected pages while logged out

# FRONT-AUTH-003 verification
npm test -- portal-auth-context.test.tsx
npm test -- portal-login.test.tsx
npm test -- portal-verify.test.tsx
npm test -- portal-protected-route.test.tsx
```

---

## Completion Criteria

### Frontend Authentication Complete When:
1. Login and registration forms work with proper validation and error handling
2. Protected routes prevent unauthorized access to business pages
3. Portal authentication provides separate client access with magic link flow
4. All authentication states persist appropriately (firm vs portal)
5. Error boundaries handle authentication failures gracefully
6. All verification commands pass
7. Manual testing confirms complete authentication flows

**Estimated Timeline:** 3-4 days with parallel execution
