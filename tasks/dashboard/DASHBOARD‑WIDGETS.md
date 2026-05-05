# tasks/dashboard/DASHBOARD‑WIDGETS.md – Dashboard Widgets & KPIs

This file covers the composite dashboard API and the real-data widget surface for the home dashboard.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Unified Dashboard

### [ ] API‑DASH‑001: Composite Dashboard Endpoint
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Dashboard data is assembled from mock values only.

**Description:** Define `GET /api/v1/dashboard` and its response schema for KPI summary cards, recent activity, overdue finance items, and upcoming work widgets.

**Depends on:** All domain APIs
**Blocks:** `API‑DASH‑002`, `FRONT‑DASH‑001`

### [ ] API‑DASH‑002: Dashboard Aggregation Service
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No service composes home-page KPIs.

**Description:** Aggregate data across modules with caching, partial-failure handling, and organization scoping.

**Depends on:** `dashboard/DASHBOARD‑WIDGETS.md → API‑DASH‑001`
**Blocks:** `FRONT‑DASH‑001`

### [ ] FRONT‑DASH‑001: Dashboard Real Data Widgets
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Widget cards are mock-driven.

**Description:** Replace mock widget content with live KPI, recent activity, appointments, pipeline, and invoice widgets, preserving the existing bento layout quality.

**Depends on:** `dashboard/DASHBOARD‑WIDGETS.md → API‑DASH‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Dashboard.tsx`

## Subtasks
- [ ] API‑DASH‑001.1 (AGENT): Define the dashboard response contract and caching expectations.
- [ ] API‑DASH‑002.1 (AGENT): Map each widget to its source service and fallback behavior.
- [ ] FRONT‑DASH‑001.1 (AGENT): Replace widget mock data with generated API hooks.
- [ ] FRONT‑DASH‑001.2 (AGENT): Verify empty, loading, and partial-failure states per widget.