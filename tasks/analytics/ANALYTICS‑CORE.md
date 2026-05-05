# tasks/analytics/ANALYTICS‑CORE.md – Analytics Core

This file defines the backend and frontend work required to turn the analytics module from a mock shell into a real reporting surface.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Analytics Platform

### [ ] DB‑ANALYTICS‑001: Reports Metadata Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Analytics configuration and saved reports have no persistence layer.

**Description:** Create the metadata table for saved analytics reports, filters, owners, and sharing flags.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `DB‑ANALYTICS‑002`, `API‑ANALYTICS‑001`

### [ ] DB‑ANALYTICS‑002: Snapshot Cache Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Expensive report results have nowhere to cache.

**Description:** Add cached analytics snapshot storage keyed by organization, report, filter hash, and expiry.

**Depends on:** `analytics/ANALYTICS‑CORE.md → DB‑ANALYTICS‑001`
**Blocks:** `API‑ANALYTICS‑003`

### [ ] API‑ANALYTICS‑001: Analytics API Baseline
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No analytics endpoints exist.

**Description:** Define analytics endpoints and report schemas for funnel conversion, invoice aging, project health, asset utilization, and appointment trends.

**Depends on:** `analytics/ANALYTICS‑CORE.md → DB‑ANALYTICS‑001`
**Blocks:** `API‑ANALYTICS‑002`, `API‑ANALYTICS‑003`

### [ ] API‑ANALYTICS‑003: Analytics Service
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No reporting service composes cross-domain metrics.

**Description:** Compute and cache cross-domain analytics with module-specific aggregations and consistent date-range filtering.

**Depends on:** `analytics/ANALYTICS‑CORE.md → DB‑ANALYTICS‑002`, `API‑ANALYTICS‑001`
**Blocks:** `API‑ANALYTICS‑004`, `FRONT‑ANALYTICS‑001`

### [ ] API‑ANALYTICS‑004: Routes & Green Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No analytics routes are mounted.

**Description:** Implement analytics routes, authorization, filters, and integration tests to green.

**Depends on:** `analytics/ANALYTICS‑CORE.md → API‑ANALYTICS‑002`, `API‑ANALYTICS‑003`
**Blocks:** `FRONT‑ANALYTICS‑001`

### [ ] FRONT‑ANALYTICS‑001: Analytics Page Real Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Analytics page is mock-backed.

**Description:** Replace mock charts and cards with live data hooks, filtering controls, and report views backed by the analytics API.

**Depends on:** `analytics/ANALYTICS‑CORE.md → API‑ANALYTICS‑004`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Analytics.tsx`

## Subtasks
- [ ] DB‑ANALYTICS‑001.1 (AGENT): Define report metadata schema and access rules.
- [ ] DB‑ANALYTICS‑002.1 (AGENT): Define cache invalidation and retention rules.
- [ ] API‑ANALYTICS‑001.1 (AGENT): Add analytics schemas and endpoints to OpenAPI.
- [ ] API‑ANALYTICS‑003.1 (AGENT): Map metrics to their source bounded contexts.
- [ ] API‑ANALYTICS‑004.1 (AGENT): Add integration tests for report filters and authorization.
- [ ] FRONT‑ANALYTICS‑001.1 (AGENT): Replace mock charts and wire date/module filters.