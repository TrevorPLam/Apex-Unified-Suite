# tasks/assets/DEPRECIATION.md – Asset Depreciation

This file covers depreciation schedules, generated entries, calculation jobs, and reporting for the Assets domain.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Depreciation Engine

### [ ] DB‑ASSETS‑004: Depreciation Schedules Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Assets do not store depreciation policy.

**Description:** Add depreciation schedule persistence including method, useful life, salvage value, and effective dates.

**Depends on:** `assets/ASSETS‑INVENTORY.md → DB‑ASSETS‑001`
**Blocks:** `DB‑ASSETS‑005`, `API‑ASSETS‑013`

### [ ] DB‑ASSETS‑005: Depreciation Entries Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No append-only history of depreciation events exists.

**Description:** Store generated monthly depreciation entries with period, amount, accumulated depreciation, and remaining book value.

**Depends on:** `assets/DEPRECIATION.md → DB‑ASSETS‑004`
**Blocks:** `API‑ASSETS‑013`

### [ ] API‑ASSETS‑013: Depreciation Engine
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No calculation engine or scheduled job exists.

**Description:** Implement schedule calculation, retroactive catch-up, and monthly generation logic for supported depreciation methods.

**Depends on:** `assets/DEPRECIATION.md → DB‑ASSETS‑004`, `DB‑ASSETS‑005`
**Blocks:** `API‑ASSETS‑014`, `FRONT‑ASSETS‑002`

### [ ] API‑ASSETS‑014: Depreciation API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No API exposes schedules or entries.

**Description:** Add schedule and entry endpoints, recalculation triggers, and validation for method changes.

**Depends on:** `assets/DEPRECIATION.md → API‑ASSETS‑013`
**Blocks:** `FRONT‑ASSETS‑002`

### [ ] FRONT‑ASSETS‑002: Depreciation Report UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Asset reporting does not include book value or depreciation history.

**Description:** Build schedule and entry views with charts, filters, and book-value reporting.

**Depends on:** `assets/DEPRECIATION.md → API‑ASSETS‑014`
**Blocks:** [N/A]

## Subtasks
- [ ] DB‑ASSETS‑004.1 (AGENT): Define supported depreciation methods and schedule fields.
- [ ] DB‑ASSETS‑005.1 (AGENT): Define append-only entry structure and period uniqueness.
- [ ] API‑ASSETS‑013.1 (AGENT): Document calculation rules and monthly job triggers.
- [ ] API‑ASSETS‑014.1 (AGENT): Add schedule and entry endpoints to OpenAPI.
- [ ] FRONT‑ASSETS‑002.1 (AGENT): Design report tables and charts for finance users.