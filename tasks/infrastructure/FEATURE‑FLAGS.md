# tasks/infrastructure/FEATURE‑FLAGS.md – Feature Flags & Plan Entitlements

This file establishes the central feature flag system that gates access to features based on an organization’s plan tier, rollout percentage, or emergency kill‑switch status. The system is mandated by `CROSS‑CUTTING‑RULES.md` §9; every beta, premium, or performance‑sensitive feature must be toggleable.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Database – Feature Flags

### [ ] DB‑FLAG‑001: Define Feature Flags Table
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No feature flag persistence exists. Plan gating and rollout cannot be enforced until this table is present.  
**Size:** Small  

**Description:**  
Define the `feature_flags` table. Each row represents a flag key scoped to an organization, with an enable/disable toggle, the minimum plan tier required to access the feature, and a last‑updated timestamp.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`  
**Blocks:** `API‑FLAG‑001`, `API‑FLAG‑002`, `API‑FLAG‑003`, `FRONT‑FLAG‑001`  
**Related Files:** `lib/db/src/schema/feature-flags/feature-flags.ts`, `lib/db/src/__tests__/feature-flags.test.ts`

**Definition of Done**
- [ ] Columns: `id` (uuid PK), `organization_id` (FK NOT NULL), `flag_key` (text NOT NULL), `enabled` (boolean NOT NULL default `true`), `plan_requirement` (pgEnum: `free|pro|enterprise`, NOT NULL default `free`), `updated_at` (timestamp NOT NULL default now). **No `deleted_at`** – flags are never soft‑deleted; they are removed by migration when the feature graduates.
- [ ] Composite unique constraint on `(organization_id, flag_key)`.
- [ ] Index on `(organization_id, flag_key)`.
- [ ] Zod schemas exported; `flag_key` is a known constant string (validated via enum at the service layer).
- [ ] Unit tests pass (TDD red → green).
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- `flag_key` values must be sourced from a shared `FeatureFlagKey` enum defined in a package accessible by both backend and frontend.  
- A row is created for the organization only when the flag is explicitly overridden; the default behavior (from migration or code) applies when no row exists.  
- The `plan_requirement` column documents the lowest plan that can access the feature; it is informational for the admin UI but the actual enforcement is done via middleware.

**Verification**
```bash
pnpm --filter @workspace/db test -- feature-flags.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Feature flags are a cross‑cutting infrastructure concern; they do not belong to a specific bounded context.  
- TDD: Assert column types, unique constraint, and plan enum.

---

### Subtasks
- [ ] DB‑FLAG‑001.0.25 (AGENT): Read DB‑ORG‑001 and existing schema patterns. No action — pause.
- [ ] DB‑FLAG‑001.1 (AGENT): Write failing schema test. **File:** `lib/db/src/__tests__/feature-flags.test.ts` **Verification:** RED.
- [ ] DB‑FLAG‑001.2 (AGENT): Implement table, enum, Zod schemas, types; update `index.ts`. **Verification:** GREEN; `pnpm typecheck` clean.
- [ ] DB‑FLAG‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Middleware & Evaluation

### [ ] API‑FLAG‑001: Feature Flag Evaluation Middleware
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No middleware exists to gate routes by feature flag. Premium features are accessible regardless of plan.  
**Size:** Medium  

**Description:**  
Implement an Express middleware factory `requireFeature(flagKey)` that:
- Reads the authenticated user’s `organizationId` from `req.user`.
- Checks the `feature_flags` table for that organization and flag key.
- If a row exists and `enabled = false`, returns **402 Payment Required** (or 403 Forbidden) with a descriptive error.
- If no row exists, derives the default from a hard‑coded default map and the organization’s plan (or assumes enabled if plan meets requirement).
- Caches the result per organization (all flags) with a 5‑minute TTL using an LRU cache, to avoid a DB query on every request.

**Depends on:** `DB‑FLAG‑001`, `infrastructure/AUTH.md → AUTH‑008`  
**Blocks:** `API‑FLAG‑004`, `API‑FLAG‑005`, all premium‑gated routes in Phase 4+

**Related Files:** `artifacts/api‑server/src/middlewares/feature-flag.ts`

**Definition of Done**
- [ ] `requireFeature(flagKey: FeatureFlagKey) : RequestHandler` exported.
- [ ] Middleware checks cache; on miss, queries `feature_flags` for `(organization_id, flag_key)`.
- [ ] If `enabled === false` → calls `next(new PaymentRequired(flagKey))`.
- [ ] Fallback logic: if no DB row, checks `planRequirements[flagKey]` against the current organization’s `plan_type` from `DB‑ORG‑001`. If the plan is insufficient, returns 402; otherwise, passes.
- [ ] LRU cache: max 500 entries, TTL 5 minutes.
- [ ] Cache key: `organizationId`. Cache invalidated on any `PATCH /admin/feature-flags/{flagKey}` call.
- [ ] Unit tests cover: enabled flag → next(), disabled flag → 402, missing row + plan insufficient → 402, missing row + plan sufficient → next(), cache hit, cache expiry.
- [ ] `pnpm typecheck` passes.

**Rules to Follow**
- The middleware must never throw; always call `next(err)` on denial.  
- The `FeatureFlagKey` enum must be the single source of truth; never accept arbitrary strings from callers.  
- All errors must use the standard `DomainError` hierarchy; `PaymentRequired` extends `DomainError` with code `FEATURE_LOCKED`.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- feature-flag.middleware.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The middleware is an infrastructure adapter that enforces plan‑scoped policies.
- TDD: Write tests for the middleware with mocked DB/cache before implementation.

---

### Subtasks
- [ ] API‑FLAG‑001.0.25 (AGENT): Read DB‑FLAG‑001, AUTH‑008, and the `FeatureFlagKey` enum location. No action — pause.
- [ ] API‑FLAG‑001.1 (AGENT): Write unit tests for `requireFeature` middleware. **File:** `artifacts/api‑server/__tests__/middlewares/feature-flag.middleware.test.ts` **Verification:** All red.
- [ ] API‑FLAG‑001.2 (AGENT): Implement `requireFeature` with DB lookup, plan fallback, LRU cache, and error generation. **File:** `artifacts/api‑server/src/middlewares/feature-flag.ts` **Verification:** Unit tests green; `pnpm typecheck` clean.
- [ ] API‑FLAG‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Admin Management

### [ ] API‑FLAG‑002: Feature Flag Admin Endpoints
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No API exists for admins to enable or disable feature flags per organization. All flag management is manual DB work.  
**Size:** Small  

**Description:**  
Create admin‑only endpoints to list, get, and patch feature flags for the admin’s organization. Every change is recorded in the audit log.

**Depends on:** `DB‑FLAG‑001`, `infrastructure/AUTH.md → AUTH‑008‑ADMIN`  
**Blocks:** `FRONT‑FLAG‑002` (admin UI)

**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/routes/admin/feature-flags.ts`, `artifacts/api‑server/src/services/admin/feature-flag-service.ts`

**Definition of Done**
- [ ] OpenAPI spec: `GET /api/v1/admin/feature-flags` – list all flag keys for the organization, including their default plan requirement and current enabled status.  
- [ ] `PATCH /api/v1/admin/feature-flags/{flagKey}` – set `enabled` boolean.  
- [ ] All endpoints protected by `adminAuthMiddleware`.  
- [ ] Service returns `Result<T, DomainError>`; `FeatureFlagNotFound` → 404; `InvalidFlagKey` → 400.  
- [ ] Audit log entry written for every `PATCH` call.  
- [ ] The feature‑flag cache (from `API‑FLAG‑001`) is invalidated for the organization after a successful `PATCH`.  
- [ ] Integration tests pass.  
- [ ] `pnpm typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm --filter @workspace/api‑server test -- feature-flags-admin.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FLAG‑002.0.25 (AGENT): Read AUTH‑008‑ADMIN, DB‑FLAG‑001, and the cache invalidation mechanism in API‑FLAG‑001. No action — pause.
- [ ] API‑FLAG‑002.1 (AGENT): Add admin feature‑flag paths to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen && pnpm typecheck`.
- [ ] API‑FLAG‑002.2 (AGENT): Write integration tests (red phase). **File:** `artifacts/api‑server/__tests__/api/admin/feature-flags.test.ts` **Verification:** All red.
- [ ] API‑FLAG‑002.3 (AGENT): Implement `FeatureFlagAdminService` and repository methods. **Verification:** Unit tests pass.
- [ ] API‑FLAG‑002.4 (AGENT): Create routes with admin auth, wire cache invalidation. **File:** `artifacts/api‑server/src/routes/admin/feature-flags.ts` **Verification:** Integration tests green.
- [ ] API‑FLAG‑002.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Plan Entitlements & Seeding

### [ ] API‑FLAG‑003: Plan Entitlement Seed & Lifecycle
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No mechanism defines which flags are enabled per plan. Premium features are ungated.  
**Size:** Small  

**Description:**  
Define a `planFlagMap` that specifies, for each `FeatureFlagKey`, the minimum `plan_type` (`free | pro | enterprise`) required. When a new organization is created, seed the `feature_flags` table with rows for any flag whose requirement is above `free` (or leave them untouched – the fallback logic in the middleware handles it). Also, handle plan upgrades/downgrades by updating the `feature_flags` table (or simply rely on the middleware’s fallback based on `organizations.plan_type`).

**Depends on:** `DB‑FLAG‑001`, `DB‑IDENTITY‑005`, `API‑FLAG‑001`  
**Blocks:** None

**Related Files:** `lib/shared/feature-flags/plan-flag-map.ts`, `artifacts/api‑server/src/services/plan-entitlements.ts`

**Definition of Done**
- [ ] `planFlagMap` constant: `Record<FeatureFlagKey, PlanType>` or a function `getDefaultEnabled(flagKey, planType): boolean`.  
- [ ] On organization creation (in `ONBOARD‑001`), call a service that inserts `feature_flags` rows with `enabled = true` only for flags that are available for the chosen plan (or skip seeding entirely, relying on middleware fallback).  
- [ ] `POST /api/v1/admin/plan‑change` endpoint (or hook on subscription change) updates the organization’s `plan_type` and recalculates feature flags accordingly (existing overrides are preserved).  
- [ ] Unit tests verify that a `free` plan organization cannot access a `pro`‑required flag even if the DB row is absent.  
- [ ] `pnpm typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- plan-entitlements.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FLAG‑003.0.25 (AGENT): Read ONBOARD‑001, DB‑FLAG‑001, API‑FLAG‑001 fallback logic. No action — pause.
- [ ] API‑FLAG‑003.1 (AGENT): Define `planFlagMap` and `isFlagEnabledForPlan(flagKey, planType)` utility. **File:** `lib/shared/feature-flags/plan-flag-map.ts` **Verification:** Unit tests.
- [ ] API‑FLAG‑003.2 (AGENT): Integrate seed on organization creation (in `OnboardingService`) and plan‑change handler. **Verification:** Integration tests.
- [ ] API‑FLAG‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## API – Advanced Rollout & Kill Switch

### [ ] API‑FLAG‑004: Percentage Rollout Support
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** Feature flags are binary (on/off per org). No gradual rollout capabilities exist.  
**Size:** Small  

**Description:**  
Extend the feature flag evaluation to support percentage‑based rollouts for organizations that have the flag enabled. Use a deterministic hash of `organization_id + flag_key` to compute a stable bucket between 0‑100. If the bucket exceeds the rollout percentage, the flag is considered disabled.

**Depends on:** `API‑FLAG‑001`  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/middlewares/feature-flag.ts`

**Definition of Done**
- [ ] `feature_flags` table extended with a nullable `rollout_percent` column (integer 0‑100, null means 100% or binary).  
- [ ] Middleware evaluation: if `enabled = true` and `rollout_percent` is set, compute `hashOrgFlag(orgId, flagKey) % 100`. If the result < `rollout_percent`, the flag is on; otherwise off.  
- [ ] The hash function must be deterministic and uniformly distributed.  
- [ ] Unit tests verify that a 50% rollout yields roughly half the orgs enabled.  
- [ ] `pnpm typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- feature-flag.rollout.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FLAG‑004.1 (AGENT): Add `rollout_percent` column and updated Zod schemas. **File:** `lib/db/src/schema/feature-flags/feature-flags.ts` **Verification:** `pnpm --filter @workspace/db run push` (human approval).
- [ ] API‑FLAG‑004.2 (AGENT): Implement hash‑based rollout evaluation in the middleware. **Verification:** Unit tests.
- [ ] API‑FLAG‑004.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] API‑FLAG‑005: Kill Switch Pattern
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No emergency toggle exists to instantly disable a feature across all organizations.  
**Size:** Small  

**Description:**  
Implement kill‑switch flags. A kill‑switch flag has `enabled = true` by default; when an admin disables it, the feature is immediately turned off for the entire organization, bypassing the normal cache TTL. This is achieved by using a short‑lived (e.g., 10 seconds) or no‑cache entry for kill‑switch flags.

**Depends on:** `API‑FLAG‑001`  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/middlewares/feature-flag.ts`

**Definition of Done**
- [ ] Kill‑switch flags are identified by a naming convention (`killswitch_` prefix) or a boolean column `is_kill_switch`.  
- [ ] When the middleware evaluates a kill‑switch flag, it bypasses the normal cache and queries the database directly (or uses a separate short‑TTL cache).  
- [ ] Admin UI marks such flags with a red warning “KILL SWITCH”.  
- [ ] Unit tests verify that disabling a kill‑switch flag takes effect within 10 seconds even if the normal cache hasn’t expired.  
- [ ] `pnpm typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- feature-flag.killswitch.test.ts
pnpm typecheck
```

---

### Subtasks
- [ ] API‑FLAG‑005.1 (AGENT): Add `is_kill_switch` boolean column (default false) to DB‑FLAG‑001. **Verification:** Migration and typecheck.
- [ ] API‑FLAG‑005.2 (AGENT): Implement kill‑switch cache bypass in middleware. **Verification:** Unit tests.
- [ ] API‑FLAG‑005.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Frontend – Feature‑Aware UI

### [ ] FRONT‑FLAG‑001: Plan‑Aware UI Gating (Hook & Upgrade Prompt)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** The frontend has no concept of feature flags or plan tiers. All pages are accessible regardless of the contracted plan.  
**Size:** Medium  

**Description:**  
Create a React hook `useFeatureFlag(flagKey: FeatureFlagKey): { enabled: boolean; planRequired?: PlanType }` that evaluates whether a feature is available for the current organization. If a feature is locked, the consuming component renders an upgrade prompt (a card with a comparison link to the billing page) instead of the locked content. Also add a plan badge to the header showing the current plan tier.

**Depends on:** `API‑FLAG‑001`, `FRONT‑AUTH‑002` (AuthContext provides `organization.planType`)  
**Blocks:** Gating of all premium features in the frontend

**Related Files:** `artifacts/apex‑os/src/hooks/feature-flags/useFeatureFlag.ts`, `artifacts/apex‑os/src/components/feature-flags/PlanGate.tsx`, `artifacts/apex‑os/src/components/layout/Header.tsx`

**Definition of Done**
- [ ] `useFeatureFlag(flagKey)` returns `{ enabled: boolean, loading: boolean }`.  
- [ ] The hook calls a lightweight backend endpoint `GET /api/v1/feature-flags/evaluate?keys=xxx,yyy` that returns an evaluated map for the current organization, or computes the result client‑side from the organization’s plan type and a public plan‑flag map (to avoid per‑component API calls).  
- [ ] `PlanGate` wrapper component: when `enabled === false`, renders an upgrade card with a link to `/settings/billing?plan=upgrade`.  
- [ ] Header plan badge: displays the current plan (Free / Pro / Enterprise) from `useAuth()`, with a link to billing settings.  
- [ ] Component tests: locked feature shows upgrade card; enabled feature renders children.  
- [ ] `pnpm run typecheck` passes.

**DDD / TDD / BDD / Deep Module notes**
- DDD: Feature flag evaluation is a presentation‑level concern driven by the organization’s plan, which is a core identity concept.  
- TDD: MSW returns `{ "some-pro-feature": false }`; assert upgrade card is rendered instead of the actual component.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- PlanGate.test.tsx useFeatureFlag.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] FRONT‑FLAG‑001.0.25 (AGENT): Read API‑FLAG‑001 and the shared `FeatureFlagKey`/plan map. No action — pause.
- [ ] FRONT‑FLAG‑001.1 (AGENT): Build `useFeatureFlag` hook with client‑side evaluation. **File:** `artifacts/apex‑os/src/hooks/feature-flags/useFeatureFlag.ts` **Verification:** Unit tests.
- [ ] FRONT‑FLAG‑001.2 (AGENT): Build `PlanGate` upgrade prompt component. **File:** `artifacts/apex‑os/src/components/feature-flags/PlanGate.tsx` **Verification:** Component tests.
- [ ] FRONT‑FLAG‑001.3 (AGENT): Add plan badge to `Header.tsx`. **File:** `artifacts/apex‑os/src/components/layout/Header.tsx` **Verification:** Renders correctly.
- [ ] FRONT‑FLAG‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

### [ ] FRONT‑FLAG‑002: Feature Flag Admin UI
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** Admins have no visual interface to toggle feature flags; any change requires a direct database edit.  
**Size:** Medium  

**Description:**  
Build an admin settings page at `/settings/feature-flags` that lists all feature flags for the organization. Each flag shows its description, plan requirement, current enabled/disabled state, and rollout percentage if applicable. Admins can toggle flags on/off, set rollout percentages, and activate/deactivate kill switches. A “Reset to Plan Defaults” button clears all overrides.

**Depends on:** `API‑FLAG‑002`, `FRONT‑FLAG‑001`  
**Blocks:** Operational safety

**Related Files:** `artifacts/apex‑os/src/pages/settings/FeatureFlagsSettings.tsx`

**Definition of Done**
- [ ] Page accessible at `/settings/feature-flags` (admin only).  
- [ ] Table or list showing: flag key, description, plan requirement, current status badge (active/inactive/partial rollout).  
- [ ] Toggle switch for enabled/disabled; slider or input for rollout percentage (0‑100).  
- [ ] Kill‑switch flags are visually distinct (red background).  
- [ ] “Reset to Plan Defaults” button with confirmation modal → calls `DELETE /api/v1/admin/feature-flags` (or a bulk reset endpoint).  
- [ ] All mutations use sonner toast feedback.  
- [ ] Component tests: toggle calls `PATCH`, reset calls bulk delete.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- FeatureFlagsSettings.test.tsx
pnpm run typecheck
```

---

### Subtasks
- [ ] FRONT‑FLAG‑002.0.25 (AGENT): Read API‑FLAG‑002 and the generated admin client hooks. No action — pause.
- [ ] FRONT‑FLAG‑002.1 (AGENT): Build `FeatureFlagsSettings` page with toggle switches and rollout slider. **File:** `artifacts/apex‑os/src/pages/settings/FeatureFlagsSettings.tsx` **Verification:** Component tests.
- [ ] FRONT‑FLAG‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---
