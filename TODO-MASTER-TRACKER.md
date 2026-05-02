# TODO-MASTER-TRACKER.md – P0, P1 & P2 Consolidated Master Tracker

This document provides dependency-aware execution tracking for all Phase 0 (Foundation), Phase 1 (Authentication), and Phase 2 (Database Schema) tasks. Use this to determine what can be executed in parallel and what's currently blocked.

---

## Phase 0: Foundation & Architecture (13 Parent Tasks)

### Wave 1: Foundation (No Dependencies) ✅ READY
**Status:** [ ] Complete (0/3 parent tasks done)

| Task | Dependencies | Status | Next Action |
|------|--------------|--------|-------------|
| DEP-001: Dependencies | None | ⏳ Not Started | DEP-001.1 (add neverthrow) |
| TOOLING-001: Scaffolding | None | ⏳ Not Started | TOOLING-001.1 (write README) |
| TOOLING-002: TypeScript Strict | None | ⏳ Not Started | TOOLING-002.1 (enable noImplicitOverride) |

**Execution Strategy:** All three can run in parallel immediately.

---

### Wave 2: Domain Foundation (Requires Wave 1) 🔄 BLOCKED
**Status:** [ ] Complete (0/2 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| DOMAIN-001: Glossary | DEP-001 | ⏳ Not Started | DEP-001 complete |
| DOMAIN-002: Bounded Contexts | DOMAIN-001, DEP-001 | ⏳ Not Started | DOMAIN-001 complete |

**Execution Strategy:** Sequential - DOMAIN-001 must complete before DOMAIN-002 can start.

---

### Wave 3: Architecture Decisions (Requires Foundation) 🔄 BLOCKED  
**Status:** [ ] Complete (0/6 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| ARCH-007: Appointments Boundary | DOMAIN-002 | ⏳ Not Started | DOMAIN-002 complete |
| ARCH-003: E-Sign Scope | None (but needs DOMAIN-003.4) | ⏳ Not Started | DOMAIN-003.4 complete |
| ARCH-004: Mockup Sandbox | None | ⏳ Not Started | Decision needed |
| DOMAIN-004: Cross-Cutting ADRs | DOMAIN-002 | ⏳ Not Started | DOMAIN-002 complete |
| ARCH-005: API Versioning Strategy | DOMAIN-002 | ⏳ Not Started | DOMAIN-002 complete |
| ARCH-001: Multi-Tenancy Strategy | DOMAIN-002, TOOLING-004 | ⏳ Not Started | DOMAIN-002 complete, TOOLING-004 complete |

**Execution Strategy:** 
- ARCH-004 can run anytime (decision task)
- Others require DOMAIN-002 completion
- ARCH-001 also requires TOOLING-004 completion

---

### Wave 4: Behavior Definition (Requires Foundation + Architecture) 🔄 BLOCKED
**Status:** [ ] Complete (0/2 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| DOMAIN-003: BDD Features | DOMAIN-001, DOMAIN-002 | ⏳ Not Started | DOMAIN-002 complete |
| ERROR-002-EXT: Error Catalog | DOMAIN-003 | ⏳ Not Started | DOMAIN-003 complete |

**Execution Strategy:** Sequential - DOMAIN-003 must complete before ERROR-002-EXT.

---

## Phase 1: Authentication System (14 Parent Tasks)

### Wave 1: Error Foundation (No Dependencies) ✅ READY
**Status:** [ ] Complete (0/2 parent tasks done)

| Task | Dependencies | Status | Next Action |
|------|--------------|--------|-------------|
| ERROR-002: Domain Error Types | DEP-001 (neverthrow) | ⏳ Not Started | ERROR-002.1 (base DomainError) |
| ERROR-001: Global Error Handler | ERROR-002 | ⏳ Not Started | ERROR-001.1 (error middleware) |

**Execution Strategy:** Sequential - ERROR-002 must complete before ERROR-001.

---

### Wave 2: Auth Services (Depends on Error Foundation) 🔄 BLOCKED
**Status:** [ ] Complete (0/3 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| AUTH-003: Password Hashing | DEP-001.3 (argon2id) | ⏳ Not Started | DEP-001 complete |
| AUTH-004: JWT Service | None | ⏳ Not Started | Ready |
| AUTH-005: Auth Service | ERROR-002, DEP-001.1, AUTH-003, AUTH-004 | ⏳ Not Started | ERROR-002, AUTH-003, AUTH-004 complete |

**Execution Strategy:** 
- AUTH-004 can run immediately
- AUTH-003 needs DEP-001.3
- AUTH-005 needs ERROR-002, AUTH-003, AUTH-004

---

### Wave 3: Auth API (Depends on Services & Error Foundation) 🔄 BLOCKED
**Status:** [ ] Complete (0/4 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| AUTH-001: OpenAPI Spec | DOMAIN-001, DOMAIN-002 | ⏳ Not Started | Domain tasks complete |
| AUTH-002: Integration Tests | AUTH-001, DEP-001.4 | ⏳ Not Started | AUTH-001 complete |
| AUTH-006: Auth Routes | AUTH-005, ERROR-001 | ⏳ Not Started | AUTH-005, ERROR-001 complete |
| AUTH-007: Run Tests Green | AUTH-006, DB-IDENTITY-005 | ⏳ Not Started | AUTH-006 complete, Phase 2 DB |

**Execution Strategy:** 
- AUTH-001 needs Phase 0 domain tasks
- AUTH-002 needs AUTH-001
- AUTH-006 needs services and error handler
- AUTH-007 needs Phase 2 database (stays red until then)

---

### Wave 4: Auth Middleware (Depends on Error & JWT Services) 🔄 BLOCKED
**Status:** [ ] Complete (0/1 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| AUTH-008: Auth Middleware | ERROR-001, AUTH-004 | ⏳ Not Started | ERROR-001, AUTH-004 complete |

**Execution Strategy:** Can run after ERROR-001 and AUTH-004 complete.

---

### Wave 5: Auth Frontend (Depends on API) 🔄 BLOCKED
**Status:** [ ] Complete (0/4 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| AUTH-009: Auth Context | AUTH-001 (generated hooks) | ⏳ Not Started | AUTH-001 complete |
| AUTH-010: Token Integration | AUTH-009 | ⏳ Not Started | AUTH-009 complete |
| AUTH-011: Header Integration | AUTH-009 | ⏳ Not Started | AUTH-009 complete |
| AUTH-012: E2E Test | AUTH-009, AUTH-010, AUTH-011 | ⏳ Not Started | Previous frontend tasks complete |

**Execution Strategy:** Sequential chain - each depends on the previous.

---

## Current Blockers Summary

### Immediate Blockers (Need Resolution)
1. **DEP-001** - Blocks ERROR-002, AUTH-003, DOMAIN-001, TOOLING-004
2. **DOMAIN-001** - Blocks DOMAIN-002 and all architecture work  
3. **DOMAIN-002** - Blocks ARCH-007, DOMAIN-004, DOMAIN-003, AUTH-001
4. **ERROR-002** - Blocks ERROR-001, AUTH-005
5. **ERROR-001** - Blocks AUTH-006, AUTH-008

### Decision Points
1. **ARCH-004.1** - Mockup sandbox fate (human decision required)
2. **ARCH-003.1** - E-Sign scope confirmation (human decision required)

### Phase Dependencies
1. **DB-IDENTITY-005 (Phase 2)** - Blocks AUTH-007 (test execution)
2. **Phase 0 Foundation Tasks** - Required before any Phase 1 work

---

## Parallel Execution Opportunities

### Can Run Immediately (Wave 1)
- DEP-001 (dependencies)
- TOOLING-001 (scaffolding) 
- TOOLING-002 (TypeScript strict)
- TOOLING-003 (dependency audit)
- TOOLING-004 (Zod compatibility)

### Can Run After Wave 1 Complete
- DOMAIN-001 (glossary)
- ARCH-004 (mockup decision - independent)
- ERROR-002 (after DEP-001)
- AUTH-004 (JWT service - independent)

### Can Run After Wave 2 Complete  
- DOMAIN-002 (bounded contexts)
- ARCH-007 (appointments boundary)
- DOMAIN-004 (cross-cutting ADRs)
- ARCH-005 (API versioning)
- ERROR-001 (after ERROR-002)
- AUTH-003 (after DEP-001.3)

### Can Run After Wave 3 Complete
- DOMAIN-003 (BDD features)
- ERROR-002-EXT (error catalog)
- AUTH-005 (after ERROR-002, AUTH-003, AUTH-004)
- ARCH-001 (after TOOLING-004)
- AUTH-001 (after domain tasks)

### Can Run After Services Complete
- AUTH-006 (after AUTH-005, ERROR-001)
- AUTH-008 (after ERROR-001, AUTH-004)
- AUTH-002 (after AUTH-001)

### Can Run After API Complete
- AUTH-009 (after AUTH-001)
- AUTH-010, AUTH-011 (after AUTH-009)
- AUTH-012 (after frontend chain complete)

---

## Progress Tracking

### Overall Status
**Phase 0:** [ ] 0/13 complete (Foundation & Architecture)
**Phase 1:** [ ] 0/14 complete (Authentication System)
**Total:** [ ] 0/27 parent tasks complete

### Phase 0 Critical Path
```
DEP-001 → DOMAIN-001 → DOMAIN-002 → DOMAIN-003 → ERROR-002-EXT
```

### Phase 1 Critical Path
```
DEP-001 → ERROR-002 → ERROR-001 → AUTH-006
DOMAIN tasks → AUTH-001 → AUTH-002
ERROR-002 + AUTH-003 + AUTH-004 → AUTH-005
AUTH-004 + ERROR-001 → AUTH-008
AUTH-001 → AUTH-009 → AUTH-010 → AUTH-011 → AUTH-012
```

### Parallel Tracks
```
Track A: DEP-001 → DOMAIN-001 → DOMAIN-002 → ARCH-007/DOMAIN-004/ARCH-005 → DOMAIN-003
Track B: TOOLING-001/TOOLING-002/TOOLING-003/TOOLING-004 (parallel to Track A)
Track C: ARCH-004/ARCH-001 (independent decisions, ARCH-001 needs TOOLING-004)
Track D: DEP-001 → ERROR-002 → ERROR-001 → AUTH-008
Track E: DEP-001 → AUTH-003 → AUTH-005 → AUTH-006
Track F: AUTH-004 (independent, joins Track E)
Track G: DOMAIN tasks → AUTH-001 → AUTH-002 → AUTH-007
Track H: AUTH-001 → AUTH-009 → AUTH-010 → AUTH-011 → AUTH-012
```

---

## Next Actions Checklist

### Immediate (Today)
- [ ] Start DEP-001.1: Add neverthrow to workspace catalog
- [ ] Start TOOLING-001.1: Write README.md  
- [ ] Start TOOLING-002.1: Enable noImplicitOverride
- [ ] Start TOOLING-003.1: Audit unused dependencies
- [ ] Start TOOLING-004.1: Verify Zod compatibility
- [ ] Start AUTH-004.1: Write JWT unit tests

### After Wave 1 Complete
- [ ] Start DOMAIN-001.1: Draft domain glossary
- [ ] Start ARCH-004.1: Decide mockup sandbox fate
- [ ] Start ERROR-002.1: Define base DomainError class

### After Domain Foundation Complete
- [ ] Start DOMAIN-002.1: Draft bounded context map
- [ ] Start ARCH-007.1: Write ADR-007
- [ ] Start DOMAIN-004.1: Create real-time notifications ADR
- [ ] Start ERROR-001.1: Create error handler middleware
- [ ] Start AUTH-003.1: Write password hashing tests

### After Architecture Complete  
- [ ] Start DOMAIN-003.1: Write auth.feature
- [ ] Start ERROR-002-EXT.1: Extract error codes from features
- [ ] Start AUTH-005.1: Write auth service tests (after ERROR-002)

### After Services Complete
- [ ] Start AUTH-005.2: Implement auth service
- [ ] Start AUTH-006.1: Create validation middleware
- [ ] Start AUTH-008.1: Write auth middleware tests
- [ ] Start AUTH-001.1: Add auth paths to OpenAPI spec

### After API Complete
- [ ] Start AUTH-009.1: Create AuthContext
- [ ] Start AUTH-010.1: Wire token integration
- [ ] Start AUTH-011.1: Update Header component

### Phase 2 Dependency
- [ ] AUTH-007.1: Run integration tests to green (after DB-IDENTITY-005)

---

## Verification Commands by Phase

### Phase 0 Wave 1 Verification
```bash
# DEP-001 verification
pnpm install --frozen-lockfile
pnpm vitest --version

# TOOLING-001 verification  
cat README.md
cat .env.example
pnpm prettier --check src/

# TOOLING-002 verification
pnpm run typecheck

# TOOLING-003 verification
npx depcheck

# TOOLING-004 verification
pnpm vitest run -- zod-compat.test.ts
```

### Phase 0 Wave 2 Verification
```bash
# DOMAIN-001 verification
cat docs/glossary.md

# DOMAIN-002 verification
cat docs/bounded-contexts.md
```

### Phase 0 Wave 3 Verification
```bash
# Architecture verification
ls docs/adr/*.md
cat docs/bounded-contexts.md | grep -i appointments
```

### Phase 0 Wave 4 Verification
```bash
# Behavior verification
ls docs/features/*.feature
wc -l docs/features/*.feature
cat docs/error-catalog-extended.md
```

### Phase 1 Wave 1 Verification
```bash
# ERROR-002 verification
pnpm vitest run -- domain-errors.test.ts
pnpm typecheck

# ERROR-001 verification  
pnpm vitest run -- error-handler.test.ts
```

### Phase 1 Wave 2 Verification
```bash
# AUTH-003 verification
pnpm vitest run -- crypto.test.ts

# AUTH-004 verification
pnpm vitest run -- jwt.test.ts

# AUTH-005 verification
pnpm vitest run -- auth.service.test.ts
pnpm typecheck
```

### Phase 1 Wave 3 Verification
```bash
# AUTH-001 verification
pnpm codegen
pnpm typecheck

# AUTH-002 verification
pnpm vitest run -- auth.test.ts (should be red)

# AUTH-006 verification
pnpm vitest run -- auth.routes.test.ts
pnpm vitest run -- validation.test.ts
```

### Phase 1 Wave 4 Verification
```bash
# AUTH-008 verification
pnpm vitest run -- auth.middleware.test.ts
```

### Phase 1 Wave 5 Verification
```bash
# AUTH-009 verification
pnpm vitest run -- auth-context.test.ts

# AUTH-010 verification
pnpm vitest run -- token-integration.test.ts

# AUTH-011 verification
pnpm vitest run -- header-auth.test.ts
```

---

## Risk Mitigation

### High Risk Dependencies
1. **DEP-001** - Without dependencies, testing and auth cannot proceed
2. **DOMAIN-001** - Without glossary, BDD features will use inconsistent terminology
3. **DOMAIN-002** - Without bounded contexts, architecture decisions lack boundaries
4. **ERROR-002** - Without domain errors, services cannot return proper error types
5. **ERROR-001** - Without global error handler, API responses will be inconsistent
6. **Phase 0 Domain Tasks** - Without glossary and bounded contexts, OpenAPI spec cannot be written

### Mitigation Strategies
- Start Wave 1 tasks immediately in parallel across both phases
- Human decisions for ARCH-003 and ARCH-004 should be made early
- Keep glossary and bounded context review cycles short (1-2 days max)
- AUTH-007 will remain red until Phase 2 - this is expected and acceptable
- Write integration tests early (AUTH-002) to guide service development

---

## Special Notes

### Phase 2 Dependency
- **AUTH-007** (Run Integration Tests to Green) cannot complete until Phase 2 database schema is implemented
- This is by design - Phase 1 builds the authentication system with stubbed persistence
- All other Phase 1 tasks can complete without database dependency

### Multi-Tenancy Considerations
- AUTH-001 OpenAPI spec must include `organizationId` in registration/login
- AUTH-005 service must validate organization existence (stubbed in Phase 1)
- Error catalog must include organization-related errors
- ARCH-001 multi-tenancy strategy must be established before Phase 2 schema work

### Testing Strategy
- AUTH-002 tests are written to fail (TDD Red) and guide implementation
- Unit tests for each service before implementation
- Integration tests validate end-to-end API contracts
- Frontend component tests use mocked API responses
- BDD feature files from DOMAIN-003 drive all behavior specifications

---

## Completion Criteria

### Phase 0 Complete When:
1. All Wave 1 tasks are done (dependencies, scaffolding, TypeScript)
2. All Wave 2 tasks are done (glossary, bounded contexts)  
3. All Wave 3 tasks are done (architecture decisions including API versioning and multi-tenancy)
4. All Wave 4 tasks are done (BDD features, error catalog)
5. All verification commands pass
6. Human approvals are obtained for all decision points

### Phase 1 Complete When:
1. All Wave 1-4 tasks are done (error foundation, services, API, middleware)
2. Wave 5 frontend tasks are done (auth context, token integration, UI updates)
3. All verification commands pass except AUTH-007 (waits for Phase 2)
4. AUTH-007 tests are written and failing (expected until Phase 2)
5. Manual E2E test (AUTH-012) validates complete auth flow

**Estimated Timeline:**
- Phase 0: 3-4 weeks with parallel execution, 5-6 weeks sequential
- Phase 1: 2-3 weeks with parallel execution, 4-5 weeks sequential
- Combined: 5-7 weeks with optimal parallel execution

---

## Phase 2: Database Schema (28 Parent Tasks)

### Wave 1: Foundation (No Dependencies) ✅ READY
**Status:** [ ] Complete (0/3 parent tasks done)

| Task | Dependencies | Status | Next Action |
|------|--------------|--------|-------------|
| TEST‑INFRA‑001: Test Infrastructure | DEP‑001 (vitest) | ⏳ Not Started | TEST‑INFRA‑001.1 (configure Vitest) |
| DB‑LOGGER‑001: Slow-Query Logger | None | ⏳ Not Started | DB‑LOGGER‑001.1 (add logger) |
| DB‑ORG‑001: Organizations Table | ARCH‑001 | ⏳ Not Started | DB‑ORG‑001.1 (write schema test) |

**Execution Strategy:** All three can run in parallel immediately.

---

### Wave 2: Identity & Access (Requires Foundation) 🔄 BLOCKED
**Status:** [ ] Complete (0/6 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| DB‑IDENTITY‑001: Users Table | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑IDENTITY‑002: Roles Table | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑IDENTITY‑003: Permissions Table | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑IDENTITY‑004: User‑Role Junction | DB‑IDENTITY‑001, DB‑IDENTITY‑002 | ⏳ Not Started | DB‑IDENTITY‑001/002 complete |
| DB‑IDENTITY‑005: Identity Migration/Seed | DB‑IDENTITY‑001 through 004 | ⏳ Not Started | All identity tables complete |
| DB‑IDENTITY‑006: Refresh Tokens | DB‑IDENTITY‑001, DB‑ORG‑001 | ⏳ Not Started | DB‑IDENTITY‑001 complete |

**Execution Strategy:**

- DB‑IDENTITY‑001, DB‑IDENTITY‑002, DB‑IDENTITY‑003 can run in parallel after DB‑ORG‑001
- DB‑IDENTITY‑004 requires both DB‑IDENTITY‑001 and DB‑IDENTITY‑002
- DB‑IDENTITY‑005 requires all identity tables
- DB‑IDENTITY‑006 can run in parallel with other identity tables after DB‑IDENTITY‑001

---

### Wave 3: Core Business Contexts (Requires Foundation) 🔄 BLOCKED
**Status:** [ ] Complete (0/14 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| DB‑APPT‑001: Appointments Table | DB‑ORG‑001, DB‑IDENTITY‑001 | ⏳ Not Started | DB‑ORG‑001/DB‑IDENTITY‑001 complete |
| DB‑APPT‑002: Availability Windows | DB‑ORG‑001, DB‑IDENTITY‑001 | ⏳ Not Started | DB‑ORG‑001/DB‑IDENTITY‑001 complete |
| DB‑APPT‑003: Booking Rules | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑APPT‑004: Client FK Migration | DB‑APPT‑001, DB‑CRM‑002 | ⏳ Not Started | DB‑APPT‑001/DB‑CRM‑002 complete |
| DB‑APPT‑005: Calendar Connections | DB‑ORG‑001, DB‑IDENTITY‑001 | ⏳ Not Started | DB‑ORG‑001/DB‑IDENTITY‑001 complete |
| DB‑APPT‑006: Meeting Integrations | DB‑APPT‑001, DB‑ORG‑001 | ⏳ Not Started | DB‑APPT‑001/DB‑ORG‑001 complete |
| DB‑APPT‑007: Payment Transactions | DB‑APPT‑001, DB‑ORG‑001 | ⏳ Not Started | DB‑APPT‑001/DB‑ORG‑001 complete |
| DB‑APPT‑008: Meeting Polls | DB‑ORG‑001, DB‑IDENTITY‑001 | ⏳ Not Started | DB‑ORG‑001/DB‑IDENTITY‑001 complete |
| DB‑APPT‑009: Event Types | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑APPT‑010: Event Type Questions | DB‑APPT‑009 | ⏳ Not Started | DB‑APPT‑009 complete |
| DB‑APPT‑011: Routing Forms | DB‑APPT‑009 | ⏳ Not Started | DB‑APPT‑009 complete |
| DB‑APPT‑012: Waitlist | DB‑APPT‑009 | ⏳ Not Started | DB‑APPT‑009 complete |
| DB‑APPT‑013: No‑Show Log | DB‑APPT‑001 | ⏳ Not Started | DB‑APPT‑001 complete |
| DB‑APPT‑014: Collective Exclusions | DB‑APPT‑009 | ⏳ Not Started | DB‑APPT‑009 complete |

**Execution Strategy:**
- DB‑APPT‑003 and DB‑APPT‑009 can run immediately after DB‑ORG‑001
- DB‑APPT‑001, DB‑APPT‑002, DB‑APPT‑005, DB‑APPT‑006, DB‑APPT‑007, DB‑APPT‑008 require DB‑IDENTITY‑001
- DB‑APPT‑010, DB‑APPT‑011, DB‑APPT‑012, DB‑APPT‑014 depend on DB‑APPT‑009
- DB‑APPT‑004 depends on CRM context (future dependency)
- DB‑APPT‑006, DB‑APPT‑007, DB‑APPT‑013 depend on DB‑APPT‑001

---

### Wave 4: Financial Context (Requires Foundation) 🔄 BLOCKED
**Status:** [ ] Complete (0/14 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| DB‑FIN‑001: Invoices Table | DB‑AR‑001 | ⏳ Not Started | DB‑AR‑001 complete |
| DB‑FIN‑002: Customer Payments | DB‑AR‑001, DB‑FIN‑001 | ⏳ Not Started | DB‑AR‑001/DB‑FIN‑001 complete |
| DB‑FIN‑003: Payment Allocations | DB‑FIN‑001, DB‑FIN‑002 | ⏳ Not Started | DB‑FIN‑001/DB‑FIN‑002 complete |
| DB‑FIN‑004: Expense Categories | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑FIN‑005: Bank Accounts | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑FIN‑006: Payment Methods | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑FIN‑007: Idempotency Records | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑FIN‑008: Credit Memos | DB‑AR‑001, DB‑FIN‑001 | ⏳ Not Started | DB‑AR‑001/DB‑FIN‑001 complete |
| DB‑FIN‑009: Multi‑Currency Migration | DB‑AP‑002, DB‑AR‑002 | ⏳ Not Started | DB‑AP‑002/DB‑AR‑002 complete |
| DB‑FIN‑010: Payment Runs | DB‑AP‑002, DB‑FIN‑005 | ⏳ Not Started | DB‑AP‑002/DB‑FIN‑005 complete |
| DB‑FIN‑011: 1099 Tracking | DB‑AP‑001 | ⏳ Not Started | DB‑AP‑001 complete |
| DB‑FIN‑012: Reconciliation Entries | DB‑FIN‑005 | ⏳ Not Started | DB‑FIN‑005 complete |
| DB‑FIN‑013: AP Inbox | DB‑AP‑002 | ⏳ Not Started | DB‑AP‑002 complete |
| DB‑FIN‑014: Collections Activity | DB‑AR‑001, DB‑AR‑002 | ⏳ Not Started | DB‑AR‑001/DB‑AR‑002 complete |

**Execution Strategy:**
- DB‑FIN‑004, DB‑FIN‑005, DB‑FIN‑006, DB‑FIN‑007 can run in parallel after DB‑ORG‑001
- DB‑AR‑001 must complete before most financial tables
- DB‑AP‑001 and DB‑AP‑002 must complete for AP-related financial tables
- DB‑FIN‑001 enables DB‑FIN‑002, DB‑FIN‑003, DB‑FIN‑008

---

### Wave 5: Accounts Payable (Requires Foundation) 🔄 BLOCKED
**Status:** [ ] Complete (0/4 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| DB‑AP‑001: Vendors Table | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑AP‑002: Bills Table | DB‑AP‑001, DB‑AP‑003 | ⏳ Not Started | DB‑AP‑001/DB‑AP‑003 complete |
| DB‑AP‑003: Approval Workflows | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑AP‑004: Purchase Orders | DB‑AP‑001 | ⏳ Not Started | DB‑AP‑001 complete |

**Execution Strategy:**
- DB‑AP‑001 and DB‑AP‑003 can run in parallel after DB‑ORG‑001
- DB‑AP‑002 requires both DB‑AP‑001 and DB‑AP‑003
- DB‑AP‑004 can run in parallel after DB‑AP‑001

---

### Wave 6: Accounts Receivable (Requires Foundation) 🔄 BLOCKED
**Status:** [ ] Complete (0/2 parent tasks done)

| Task | Dependencies | Status | Blockers |
|------|--------------|--------|----------|
| DB‑AR‑001: Customers Table | DB‑ORG‑001 | ⏳ Not Started | DB‑ORG‑001 complete |
| DB‑AR‑002: AR Invoices (Alias) | DB‑FIN‑001 | ⏳ Not Started | DB‑FIN‑001 complete |

**Execution Strategy:**
- DB‑AR‑001 can run immediately after DB‑ORG‑001
- DB‑AR‑002 is just an alias to DB‑FIN‑001 (no separate table needed)

---

## Updated Progress Tracking

### Overall Status

**Phase 0:** [ ] 0/13 complete (Foundation & Architecture)
**Phase 1:** [ ] 0/14 complete (Authentication System)
**Phase 2:** [ ] 0/28 complete (Database Schema)
**Total:** [ ] 0/55 parent tasks complete

### Phase 2 Context Breakdown

- **Infrastructure:** [ ] 0/3 complete
- **Identity & Access:** [ ] 0/6 complete
- **Appointments:** [ ] 0/14 complete
- **Financial:** [ ] 0/14 complete
- **Accounts Payable:** [ ] 0/4 complete
- **Accounts Receivable:** [ ] 0/2 complete

### Updated Critical Paths

```
Phase 0 Critical Path:
DEP-001 → DOMAIN-001 → DOMAIN-002 → DOMAIN-003 → ERROR-002-EXT

Phase 1 Critical Path:
DEP-001 → ERROR-002 → ERROR-001 → AUTH-006
DOMAIN tasks → AUTH-001 → AUTH-002
ERROR-002 + AUTH-003 + AUTH-004 → AUTH-005
AUTH-004 + ERROR-001 → AUTH-008
AUTH-001 → AUTH-009 → AUTH-010 → AUTH-011 → AUTH-012

Phase 2 Critical Path:
DB-ORG-001 → (enables all business contexts)
DB-IDENTITY-001 → DB-IDENTITY-004 → DB-IDENTITY-005
DB-APPT-009 → DB-APPT-010/011/012/014
DB-AR-001 → DB-FIN-001 → DB-FIN-002/003/008
DB-AP-001 → DB-AP-002 → DB-FIN-010
```

### Updated Parallel Tracks

```
Phase 0 Tracks:
Track A: DEP-001 → DOMAIN-001 → DOMAIN-002 → ARCH-007/DOMAIN-004/ARCH-005 → DOMAIN-003
Track B: TOOLING-001/TOOLING-002/TOOLING-003/TOOLING-004 (parallel to Track A)
Track C: ARCH-004/ARCH-001 (independent decisions, ARCH-001 needs TOOLING-004)

Phase 1 Tracks:
Track D: DEP-001 → ERROR-002 → ERROR-001 → AUTH-008
Track E: DEP-001 → AUTH-003 → AUTH-005 → AUTH-006
Track F: AUTH-004 (independent, joins Track E)
Track G: DOMAIN tasks → AUTH-001 → AUTH-002 → AUTH-007
Track H: AUTH-001 → AUTH-009 → AUTH-010 → AUTH-011 → AUTH-012

Phase 2 Tracks:
Track I: DB-ORG-001 → (enables all other tracks)
Track J: TEST-INFRA-001 → (enables integration testing)
Track K: DB-IDENTITY-001/002/003 → DB-IDENTITY-004/006
Track L: DB-APPT-009 → DB-APPT-010/011/012/014
Track M: DB-APPT-001/002/003 → DB-APPT-004/005/006/007/008/013
Track N: DB-AR-001 → DB-FIN-001 → DB-FIN-002/003/008
Track O: DB-AP-001 → DB-AP-002 → DB-FIN-010/011/013
Track P: DB-FIN-004/005/006/007 → (financial infrastructure)
```

---

## Updated Next Actions Checklist

### Immediate (Today)
- [ ] Start DEP-001.1: Add neverthrow to workspace catalog
- [ ] Start TOOLING-001.1: Write README.md  
- [ ] Start TOOLING-002.1: Enable noImplicitOverride
- [ ] Start TOOLING-003.1: Audit unused dependencies
- [ ] Start TOOLING-004.1: Verify Zod compatibility
- [ ] Start AUTH-004.1: Write JWT unit tests
- [ ] Start DB‑ORG‑001.1: Write organizations schema test
- [ ] Start TEST‑INFRA‑001.1: Configure Vitest for integration testing
- [ ] Start DB‑LOGGER‑001.1: Add slow-query logger configuration

### After Phase 0 Wave 1 Complete
- [ ] Start DOMAIN-001.1: Draft domain glossary
- [ ] Start ARCH-004.1: Decide mockup sandbox fate
- [ ] Start ERROR-002.1: Define base DomainError class
- [ ] Start DB‑IDENTITY‑001.1: Write users schema test
- [ ] Start DB‑IDENTITY‑002.1: Write roles schema test
- [ ] Start DB‑IDENTITY‑003.1: Write permissions schema test
- [ ] Start DB‑AR‑001.1: Write customers schema test
- [ ] Start DB‑APPT‑009.1: Write event types schema test
- [ ] Start DB‑APPT‑003.1: Write booking rules schema test
- [ ] Start DB‑AP‑001.1: Write vendors schema test
- [ ] Start DB‑AP‑003.1: Write approval workflows schema test

### After Domain Foundation Complete
- [ ] Start DOMAIN-002.1: Draft bounded context map
- [ ] Start ARCH-007.1: Write ADR-007
- [ ] Start DOMAIN-004.1: Create real-time notifications ADR
- [ ] Start ERROR-001.1: Create error handler middleware
- [ ] Start AUTH-003.1: Write password hashing tests
- [ ] Start DB‑IDENTITY‑004.1: Write user‑role junction test
- [ ] Start DB‑IDENTITY‑006.1: Write refresh tokens test
- [ ] Start DB‑FIN‑001.1: Write invoices schema test
- [ ] Start DB‑APPT‑001.1: Write appointments schema test

### After Architecture Complete  
- [ ] Start DOMAIN-003.1: Write auth.feature
- [ ] Start ERROR-002-EXT.1: Extract error codes from features
- [ ] Start AUTH-005.1: Write auth service tests (after ERROR-002)
- [ ] Start DB‑APPT‑010.1: Write event type questions test
- [ ] Start DB‑APPT‑011.1: Write routing forms test
- [ ] Start DB‑FIN‑002.1: Write customer payments test
- [ ] Start DB‑AP‑002.1: Write bills schema test

### After Services Complete
- [ ] Start AUTH-005.2: Implement auth service
- [ ] Start AUTH-006.1: Create validation middleware
- [ ] Start AUTH-008.1: Write auth middleware tests
- [ ] Start AUTH-001.1: Add auth paths to OpenAPI spec
- [ ] Start DB‑IDENTITY‑005.1: Generate identity migration
- [ ] Start DB‑FIN‑009.1: Create multi‑currency migration
- [ ] Start DB‑APPT‑004.1: Create client FK migration (after CRM)

### After API Complete
- [ ] Start AUTH-009.1: Create AuthContext
- [ ] Start AUTH-010.1: Wire token integration
- [ ] Start AUTH-011.1: Update Header component

### Phase 2 Dependency
- [ ] AUTH-007.1: Run integration tests to green (after DB-IDENTITY-005)

---

## Updated Verification Commands

### Phase 2 Wave 1 Verification
```bash
# DB-ORG-001 verification
pnpm test -- organizations.test.ts
pnpm typecheck

# TEST-INFRA-001 verification
pnpm vitest --version
pnpm test -- example.integration.test.ts

# DB-LOGGER-001 verification
# Check development logs for slow query output
```

### Phase 2 Wave 2 Verification
```bash
# Identity verification
pnpm test -- users.test.ts
pnpm test -- roles.test.ts
pnpm test -- permissions.test.ts
pnpm test -- user-roles.test.ts
pnpm test -- refresh-tokens.test.ts

# Migration verification
drizzle-kit generate
pnpm test -- identity.test.ts
```

### Phase 2 Wave 3-6 Verification
```bash
# Appointments verification
pnpm test -- appointments.test.ts
pnpm test -- availability-windows.test.ts
pnpm test -- booking-rules.test.ts
pnpm test -- event-types.test.ts

# Financial verification
pnpm test -- invoices.test.ts
pnpm test -- customer-payments.test.ts
pnpm test -- payment-allocations.test.ts

# AP verification
pnpm test -- vendors.test.ts
pnpm test -- bills.test.ts

# AR verification
pnpm test -- customers.test.ts
```

---

## Updated Completion Criteria

### Phase 2 Complete When:
1. All Wave 1 tasks are done (infrastructure foundation)
2. All Wave 2 tasks are done (identity & access system)
3. All Wave 3-6 tasks are done (business contexts)
4. All verification commands pass
5. All migrations are generated and tested
6. Seed data exists for development environments

**Updated Estimated Timeline:**
- Phase 0: 3-4 weeks with parallel execution, 5-6 weeks sequential
- Phase 1: 2-3 weeks with parallel execution, 4-5 weeks sequential
- Phase 2: 4-6 weeks with optimal parallel execution, 8-10 weeks sequential
- Combined: 9-13 weeks with optimal parallel execution

---

## File Index

### Phase 0 Files
- `TODO-P0-FOUNDATION.md` - Dependencies, glossary, bounded contexts
- `TODO-P0-ARCHITECTURE.md` - Architecture decisions and ADRs
- `TODO-P0-TOOLING.md` - Development tooling and setup
- `TODO-P0-BEHAVIOR.md` - BDD features and error catalog
- `TODO-P0-TRACKER.md` - Phase 0 execution tracking

### Phase 1 Files
- `TODO-P1-ERRORS.md` - Domain errors and global error handling
- `TODO-P1-AUTH-SERVICES.md` - Core authentication services
- `TODO-P1-AUTH-API.md` - Authentication API layer
- `TODO-P1-AUTH-MIDDLEWARE.md` - Authentication middleware
- `TODO-P1-AUTH-FRONTEND.md` - Frontend authentication
- `TODO-P1-TRACKER.md` - Phase 1 execution tracking

### Phase 2 Files
- `TODO-P2-INFRASTRUCTURE.md` - Test Infrastructure, DB Logger, Organizations
- `TODO-P2-IDENTITY.md` - Identity & Access context
- `TODO-P2-APPOINTMENTS.md` - Scheduling & Appointments context
- `TODO-P2-FINANCE.md` - Financial context (AR, AP, shared)
- `TODO-P2-TRACKER.md` - Phase 2 execution tracking and dependencies

### Consolidated
- `TODO-MASTER-TRACKER.md` - This file (consolidated P0, P1 & P2 tracking)
