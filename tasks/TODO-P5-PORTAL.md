# TODO-P5-PORTAL.md – Portal Frontend Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers Portal Data Integration including firm-side management and client-side access.

---

## Client Portal Data Integration

### [ ] FRONT‑PORTAL‑001a: Firm‑Side Portal Management – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑PORTAL‑004 (portal API green).  
**Definition of Done:** Firm‑side portal management pages use firm‑side hooks (`useClientList`, `usePortalUpdate`, `useGrantPermission`, etc.). Enable/disable portal per client, manage permissions, branding config, view messages. All mock data imports completely removed from Portal components and hooks. Component tests pass with MSW mocks. Manual testing confirms portal management and client access work correctly.

**Deep Module:** Portal frontend module encapsulates client management, permission handling, and messaging functionality. The module provides a unified interface for portal operations while hiding the complexity of multi-tenant access control, authentication flows, and real-time messaging behind React Query hooks and well-organized components.  
**Related Files:** `artifacts/apex-os/src/pages/PortalManagement.tsx`

**Subtasks:**
- [ ] FRONT‑PORTAL‑001a.1: Create firm‑side portal hooks. (AGENT)  
- [ ] FRONT‑PORTAL‑001a.2: Build portal client management UI (list, enable, permissions). (AGENT)  
- [ ] FRONT‑PORTAL‑001a.3: Implement firm‑side messaging interface. (AGENT)

---

### [ ] FRONT‑PORTAL‑001b: Client‑Side Portal Access – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑AUTH‑003 (portal auth), API‑PORTAL‑004.  
**Definition of Done:** Client‑side portal pages (under portal auth guard): dashboard, projects list, invoices, documents, messages. All use client‑side hooks. All mock data imports completely removed from client portal components. Component tests pass with MSW mocks. Manual testing confirms client portal functionality and access controls work correctly.

**Deep Module:** Client portal module encapsulates client-specific data access, resource viewing, and messaging within permission boundaries. The module provides a secure interface for client operations while enforcing access controls and hiding the complexity of multi-tenant data isolation behind React Query hooks and permission-aware components.  
**Related Files:** `artifacts/apex-os/src/pages/portal/ClientDashboard.tsx`

**Subtasks:**
- [ ] FRONT‑PORTAL‑001b.1: Create client‑side portal hooks. (AGENT)  
- [ ] FRONT‑PORTAL‑001b.2: Build client dashboard and resource views. (AGENT)  
- [ ] FRONT‑PORTAL‑001b.3: Implement client messaging interface. (AGENT)

---

### [ ] FRONT‑INT‑PORTAL: Portal Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑PORTAL‑001a, FRONT‑PORTAL‑001b.  
**Definition of Done:** Wiring: firm sends message, client replies (mutations with refetch), permission granting forms, branding config updates. Toast feedback for all. All interactive features tested with MSW mocks. Error handling provides clear user feedback. Permission boundaries enforced correctly.

**Deep Module:** Portal interactive features module encapsulates all user interactions, mutation handling, and permission management. The module provides a unified interface for portal operations while hiding the complexity of multi-tenant permissions, real-time messaging, and access control behind well-defined hooks and components.

**TDD:** Integration tests with MSW verify all interactive features work correctly. Tests cover messaging, permission management, branding updates, and access control enforcement. Each interaction is tested for both success and error paths, including permission boundary violations.

**Anti-Patterns (Frontend):**
- Manual state management instead of React Query
- Missing permission checks before operations
- Direct API calls without access control
- Unhandled mutation errors
- Inconsistent error handling patterns
- Not invalidating queries after successful mutations
- Missing loading states during portal operations
- Hardcoded permission logic instead of centralized checks

**Subtasks:**
- [ ] FRONT‑INT‑PORTAL.1: Wire message send/reply mutations. (AGENT)  
- [ ] FRONT‑INT‑PORTAL.2: Wire permission management (grant/revoke). (AGENT)  
- [ ] FRONT‑INT‑PORTAL.3: Wire branding config update. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Portal components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Portal pages depend on FRONT‑AUTH‑003 portal authentication
- **TODO-P5-DASHBOARD.md**: Dashboard portal metrics depend on Portal API integration
- **TODO-P5-FINANCE.md**: Portal payment features depend on Finance integration

### Related Master Tracker Tasks
- **API‑PORTAL‑004**: Portal API must be green before FRONT‑PORTAL‑001a/001b
- **PORTAL‑AUTH‑001**: Portal authentication must be complete before FRONT‑PORTAL‑001b

---

## Verification Commands

### Portal Integration Verification
```bash
# Firm-side Portal verification
npm test -- portal-management.test.tsx
npm test -- portal-firm-hooks.test.ts

# Client-side Portal verification
npm test -- client-dashboard.test.tsx
npm test -- portal-client-hooks.test.ts

# Interactive features verification
npm test -- portal-interactive.test.tsx

# Manual verification
# Navigate to Portal Management page, verify all data loads from API
# Test client portal access with magic link flow
# Test messaging and permission management
```

---

## Completion Criteria

### Portal Frontend Integration Complete When:
1. Firm-side portal management provides complete client administration
2. Client-side portal access delivers full self-service functionality
3. Portal authentication works seamlessly with magic link flow
4. Messaging and permission management work correctly
5. Branding configuration updates apply immediately
6. All mock data imports are removed from Portal components
7. Component tests pass with MSW mocks
8. Manual testing confirms complete Portal functionality

**Estimated Timeline:** 6-8 days with parallel execution
