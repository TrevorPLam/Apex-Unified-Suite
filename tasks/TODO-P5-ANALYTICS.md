# TODO-P5-ANALYTICS.md – Phase 5: Analytics & Settings Frontend Integration

Replaces all mock data in the Analytics page with real API-backed React Query hooks, builds a drag-and-drop report builder with Recharts, implements React Query `staleTime`/`gcTime` tuning for expensive analytics queries, adds CSV/PDF export, and wires the Settings page (system configuration and per-user preferences) to real APIs.

---

## [ ] FRONT‑ANALYTICS‑001: Reports Engine – Replace Mock Data & Report Builder
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Analytics.tsx` uses `mockData` for all chart data. No report builder exists. No `useReportsEngine` hook exists.
**Size:** Medium

**Description:** Replace Analytics page mock data with `useAnalyticsMetrics` hooks. Build a drag-and-drop report builder using Recharts: chart type selector (bar, line, pie, area), dimension/metric field picker, date range filter, and saved report list.

**Depends on:** API‑ANALYTICS‑001 (reports engine API green), FRONT‑INFRA‑001, FRONT‑INFRA‑002, FRONT‑AUTH‑002
**Blocks:** FRONT‑ANALYTICS‑003, FRONT‑ANALYTICS‑004
**Related Files:** `artifacts/apex-os/src/pages/Analytics.tsx`, `artifacts/apex-os/src/components/analytics/ReportBuilder.tsx`, `artifacts/apex-os/src/hooks/analytics/useAnalyticsMetrics.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; Recharts (`BarChart`, `LineChart`, `AreaChart`, `PieChart`); shadcn/ui Select, Tabs
- Exports: `useAnalyticsMetrics(reportConfig)`, `useReportList()`, `useSaveReport()`, `ReportBuilder` component

**Definition of Done**
- [ ] `useAnalyticsMetrics` hook: fetches aggregated data for a given `{ domain, metric, dimension, date_range }`; returns `{ data, isLoading, error }`
- [ ] Analytics page: replaces mock chart data with `useAnalyticsMetrics` hooks; all 4 domain-specific chart sections (CRM, Finance, Projects, Operations) load from API
- [ ] Report builder: drag-and-drop field picker from available metrics/dimensions per domain; chart type selector; date range picker (preset: today, 7d, 30d, 90d, custom); live preview as fields are added
- [ ] Saved reports: list of saved report configs; load/delete; save current config with name
- [ ] All `mockData` imports removed from `Analytics.tsx`
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] Component tests: chart renders with MSW data; report builder field selection triggers query update

**Out of Scope**
- AI-generated insights (Phase 10+)
- Real-time streaming analytics (Phase 8+)
- Custom formula metrics (FRONT‑ANALYTICS‑002)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/analytics/useAnalyticsMetrics.ts`, `artifacts/apex-os/src/components/analytics/ReportBuilder.tsx`, `artifacts/apex-os/src/pages/Analytics.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/analytics-reports.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: page-level — revert `Analytics.tsx` to mock data; remove `ReportBuilder` component
- Halt condition: if analytics API queries take > 10 seconds for the default date range, stop and add `suspense: false` + loading skeleton for each chart independently

**Rules to Follow**
- Analytics queries are expensive — always set `staleTime: 300_000` (5 minutes) and `gcTime: 600_000` (10 minutes) on all `useAnalyticsMetrics` calls
- Chart axes must show formatted values: currency with `Intl.NumberFormat`, percentages with 1 decimal, counts with commas
- Date range "custom" must enforce a maximum of 12 months to prevent runaway queries

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- analytics-reports.test.tsx
```

**Advanced Code Patterns**
- `useAnalyticsMetrics` serialises `reportConfig` as a stable JSON key for React Query: `queryKey: ['analytics', 'metrics', stableStringify(reportConfig)]`
- Report builder state: `useReducer` with actions `ADD_FIELD`, `REMOVE_FIELD`, `SET_CHART_TYPE`, `SET_DATE_RANGE`; no external state library

**Anti-Patterns**
- Loading all analytics metrics in one API call — separate calls per chart allow independent loading and caching
- Using `Date.now()` as a query key segment — causes cache misses on every render; always use the explicit `date_range` param

**DDD / TDD / BDD / Deep Module notes**
- DDD: Analytics reports are read-only projections across multiple bounded contexts (CRM, Finance, Projects). They do not belong to any single aggregate.
- TDD: MSW returns CRM metrics; assert CRM chart renders; change date range → assert query refires with new `date_range` param; save report → assert `POST /reports` called.
- BDD: "As a firm user, I can build custom reports combining metrics from multiple business areas and save them for later."
- Deep Module: `useAnalyticsMetrics` hides query serialisation, caching, and date range handling; `ReportBuilder` hides field picker state.

---

### Subtasks

- [ ] FRONT‑ANALYTICS‑001.0.25 (AGENT): Read `Analytics.tsx` in full and list every `mockData` reference and chart data shape.
  *No action — pause until fully understood.*

- [ ] FRONT‑ANALYTICS‑001.1 (AGENT): Create `useAnalyticsMetrics`, `useReportList`, `useSaveReport` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/analytics/useAnalyticsMetrics.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑ANALYTICS‑001.2 (AGENT): Replace mock chart data in `Analytics.tsx` with `useAnalyticsMetrics` hooks.
  **File(s):** `artifacts/apex-os/src/pages/Analytics.tsx`
  **Verification:** No `mockData` references; `pnpm run typecheck` passes.

- [ ] FRONT‑ANALYTICS‑001.3 (AGENT): Build `ReportBuilder` component with field picker, chart type selector, date range, and saved reports list.
  **File(s):** `artifacts/apex-os/src/components/analytics/ReportBuilder.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑ANALYTICS‑001.4 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/analytics-reports.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- analytics-reports.test.tsx` → GREEN.

- [ ] FRONT‑ANALYTICS‑001.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑ANALYTICS‑002: Metrics & KPI Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No KPI dashboard exists separate from the main Analytics charts. No `useKPIMetrics` hook exists.
**Size:** Medium

**Description:** Dedicated KPI dashboard tab in Analytics: real-time (5-minute refresh) metric cards per business domain, sparklines for trend, custom metric threshold alerts displayed as warning banners, and a metric comparison panel (period-over-period).

**Depends on:** API‑ANALYTICS‑002 (metrics API green), FRONT‑ANALYTICS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/analytics/KPIDashboard.tsx`, `artifacts/apex-os/src/hooks/analytics/useKPIMetrics.ts`

**Imports / Exports**
- Imports: `useQuery` from `@tanstack/react-query`; Recharts `Sparkline` (or `LineChart` with hidden axes)
- Exports: `useKPIMetrics(domain)`, `KPIDashboard` component

**Definition of Done**
- [ ] KPI dashboard tab in `Analytics.tsx`; 10 metric cards across CRM, Finance, Projects, Operations domains
- [ ] Each card: current value, delta vs. previous period, trend sparkline (7-day line), threshold indicator (green/amber/red)
- [ ] Threshold alerts: if metric exceeds configured threshold, show amber/red badge and a dismissible banner at the top of the tab
- [ ] Period-over-period comparison panel: select "vs last week / last month / last quarter"; shows side-by-side bar chart
- [ ] Auto-refresh: `refetchInterval: 300_000` (5 minutes); manual "Refresh Now" button
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Custom metric formula builder (Phase 8+)
- Push notifications for threshold breaches (Phase 7+)
- Slack/email alerts (Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/analytics/KPIDashboard.tsx`, `artifacts/apex-os/src/hooks/analytics/useKPIMetrics.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/analytics/__tests__/KPIDashboard.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `KPIDashboard` tab; Analytics shows report builder only
- Halt condition: if 5-minute polling causes visible performance degradation (jank), stop and switch to manual-refresh-only mode

**Rules to Follow**
- `staleTime: 240_000` (4 min) + `refetchInterval: 300_000` (5 min) — avoids the query being immediately stale on refetch
- Threshold values must be fetched from the API (`GET /api/v1/analytics/thresholds`) — never hardcoded

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- KPIDashboard.test.tsx
```

**Advanced Code Patterns**
- Sparklines: `<LineChart width={80} height={30}> <Line dot={false} />` — use `margin={{ top: 0, right: 0, bottom: 0, left: 0 }}`; no axes
- Delta badge: positive delta green with ↑, negative red with ↓, zero grey with →

**Anti-Patterns**
- Using `refetchInterval: 0` or very short intervals — always minimum 5 minutes for analytics queries
- Hardcoding thresholds — always fetch from API to allow admin configuration without redeployment

**DDD / TDD / BDD / Deep Module notes**
- DDD: KPIs are read-only projections; threshold breaches are domain events exposed via the API's metrics endpoint.
- TDD: MSW returns KPI data with one metric above threshold; assert threshold banner shown; simulate "Dismiss" → assert banner hidden (local state, not an API call).
- BDD: "As a firm manager, I can see a live KPI dashboard with trend sparklines and get alerted when a metric goes above its threshold."
- Deep Module: `useKPIMetrics` hides polling, threshold comparison, and delta calculation.

---

### Subtasks

- [ ] FRONT‑ANALYTICS‑002.1 (AGENT): Create `useKPIMetrics` hook with 5-minute polling and threshold data.
  **File(s):** `artifacts/apex-os/src/hooks/analytics/useKPIMetrics.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑ANALYTICS‑002.2 (AGENT): Build KPI metric cards with sparklines, delta badges, and threshold indicators.
  **File(s):** `artifacts/apex-os/src/components/analytics/KPIDashboard.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑ANALYTICS‑002.3 (AGENT): Add period-over-period comparison panel and manual refresh; write component tests.
  **File(s):** `artifacts/apex-os/src/components/analytics/KPIDashboard.tsx`, `artifacts/apex-os/src/components/analytics/__tests__/KPIDashboard.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- KPIDashboard.test.tsx` → GREEN.

- [ ] FRONT‑ANALYTICS‑002.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑ANALYTICS‑003: React Query Caching Layer Tuning
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** `App.tsx` creates a bare `new QueryClient()` with no custom configuration. All queries use React Query defaults (`staleTime: 0`, `gcTime: 300_000`). Analytics queries unnecessarily refetch on every window focus.
**Size:** Small

**Description:** Configure the global `QueryClient` in `App.tsx` with sensible defaults and add per-query overrides for expensive analytics queries. Add a developer-facing cache inspector component in development mode.

**Depends on:** FRONT‑ANALYTICS‑001, FRONT‑ANALYTICS‑002, FRONT‑INFRA‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/App.tsx`, `artifacts/apex-os/src/lib/queryClient.ts`

**Imports / Exports**
- Imports: `QueryClient` from `@tanstack/react-query`
- Exports: `queryClient` singleton from `src/lib/queryClient.ts`

**Definition of Done**
- [ ] `src/lib/queryClient.ts` created; exports a configured `QueryClient` singleton with:
  - `defaultOptions.queries.staleTime: 60_000` (1 minute default)
  - `defaultOptions.queries.gcTime: 300_000` (5 minutes default)
  - `defaultOptions.queries.retry: 2` (not the default 3)
  - `defaultOptions.queries.refetchOnWindowFocus: false` (prevents analytics refetch on tab switch)
- [ ] `App.tsx` imports `queryClient` from `src/lib/queryClient.ts` (removes `new QueryClient()` inline)
- [ ] Analytics hooks (`useAnalyticsMetrics`, `useKPIMetrics`) override to `staleTime: 300_000` at the hook level
- [ ] Auth and portal hooks override to `staleTime: 0` (always fresh)
- [ ] `ReactQueryDevtools` added to `App.tsx` behind `import.meta.env.DEV` guard — only in development
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Server-side cache headers (backend concern)
- Persistent cache (IndexedDB — Phase 8+)
- Custom retry strategies per query (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/lib/queryClient.ts`, `artifacts/apex-os/src/App.tsx`
- Tests added/updated in: [N/A] (infrastructure config — verified by `typecheck` + manual DevTools inspection)
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — revert `App.tsx` to `new QueryClient()`; delete `queryClient.ts`
- Halt condition: if setting `refetchOnWindowFocus: false` causes stale auth state to persist after logout (in another tab), stop and set `refetchOnWindowFocus: true` only for auth queries

**Rules to Follow**
- `refetchOnWindowFocus: false` is the correct default for business data — users do not expect data to change while they are in another tab
- Auth token queries must override to `staleTime: 0` and `refetchOnWindowFocus: true`
- `ReactQueryDevtools` must be tree-shaken in production — always behind `import.meta.env.DEV`

**Verification**
```bash
pnpm run typecheck
# Manual: open DevTools → check QueryClient config via ReactQueryDevtools panel
```

**Advanced Code Patterns**
- `staleTime` tiers: auth = 0; real-time = 30s; transactional = 60s; analytics = 5min; reference data (categories, currencies) = 30min
- Singleton: `export const queryClient = new QueryClient({ defaultOptions: { ... } })` — import everywhere instead of creating per-render

**Anti-Patterns**
- `new QueryClient()` inside a React component — creates a new cache on every render; always create outside the component tree
- Setting `staleTime: Infinity` for analytics — data does go stale; 5 minutes is the right balance

**DDD / TDD / BDD / Deep Module notes**
- DDD: [N/A] — infrastructure configuration, not a domain concern.
- TDD: [N/A] — verified manually via DevTools.
- BDD: "As a developer, I can inspect the React Query cache in development to understand what data is cached and when it will be refetched."
- Deep Module: `src/lib/queryClient.ts` is the single place where all React Query caching behaviour is configured.

---

### Subtasks

- [ ] FRONT‑ANALYTICS‑003.1 (AGENT): Create `src/lib/queryClient.ts` with configured `QueryClient` singleton.
  **File(s):** `artifacts/apex-os/src/lib/queryClient.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑ANALYTICS‑003.2 (AGENT): Update `App.tsx` to import singleton; add `ReactQueryDevtools` behind `DEV` guard.
  **File(s):** `artifacts/apex-os/src/App.tsx`
  **Verification:** `pnpm run typecheck` passes; no TypeScript errors.

- [ ] FRONT‑ANALYTICS‑003.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑ANALYTICS‑004: Export Reports
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No export functionality exists in the Analytics page.
**Size:** Small

**Description:** Export any report or chart to CSV (client-side) or PDF/Excel (server-side via API). Add a scheduled report delivery UI: configure schedule (daily/weekly/monthly), select recipients (firm user emails), and manage/cancel existing scheduled exports.

**Depends on:** FRONT‑ANALYTICS‑001, API‑ANALYTICS‑004 (export API green)
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/analytics/ExportPanel.tsx`

**Imports / Exports**
- Imports: `useMutation`, `useQuery` from `@tanstack/react-query`; `file-saver` for CSV/blob download; `toast` from `sonner`
- Exports: `ExportPanel` component; `useExportReport()`, `useScheduledReports()`, `useCreateScheduledReport()`, `useCancelScheduledReport()`

**Definition of Done**
- [ ] "Export" button on each saved report and on the current report builder state
- [ ] Export panel: format selector (CSV, PDF, Excel); CSV generated client-side from current chart data; PDF/Excel generated server-side via `POST /api/v1/analytics/export`
- [ ] CSV export: `convertToCSV(data)` → `file-saver`'s `saveAs(blob, 'report.csv')` — no server call
- [ ] PDF/Excel export: `useExportReport` mutation → polls `GET /api/v1/analytics/exports/:jobId` until status = `ready`; download link provided when ready (sonner toast with link)
- [ ] Scheduled reports: form (select report, format, frequency, recipient emails); list of active schedules with next run time; cancel button
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Branded PDF templates (Phase 7+)
- Slack/Zapier delivery (Phase 8+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/analytics/ExportPanel.tsx`
- Tests added/updated in: `artifacts/apex-os/src/components/analytics/__tests__/ExportPanel.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `ExportPanel`; export button hidden
- Halt condition: if PDF export job never reaches `ready` status (stuck in `processing`), stop and add a 5-minute timeout with a user-visible error message

**Rules to Follow**
- CSV export must not include PII columns that the current user is not permitted to export — check `canExportPII` permission before including name/email columns
- Scheduled report recipient emails must be validated before submitting

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- ExportPanel.test.tsx
```

**Advanced Code Patterns**
- PDF export polling: `useQuery({ queryKey: ['export', jobId], refetchInterval: 3_000, enabled: !!jobId })` — poll every 3 seconds until `status === 'ready'`, then stop and show download link

**Anti-Patterns**
- Generating PDF in the browser — large reports cause tab freezes; always delegate to server-side for PDF/Excel
- Using `window.open(downloadUrl)` for file download — blocked by pop-up blockers; use `saveAs` from `file-saver`

**DDD / TDD / BDD / Deep Module notes**
- DDD: Export is a cross-cutting query that spans all analytics aggregates. It does not mutate any data.
- TDD: Simulate CSV export → assert `saveAs` called with correct content; simulate PDF export → assert polling query fires → MSW returns `ready` → assert toast shown with download link.
- BDD: "As a firm user, I can export any report to CSV instantly or schedule weekly PDF reports to be emailed to my team."
- Deep Module: `ExportPanel` hides format selection, CSV generation, server export polling, and scheduled report management.

---

### Subtasks

- [ ] FRONT‑ANALYTICS‑004.1 (AGENT): Build export panel with CSV (client-side) and PDF/Excel (server-side with polling).
  **File(s):** `artifacts/apex-os/src/components/analytics/ExportPanel.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑ANALYTICS‑004.2 (AGENT): Add scheduled report creation form and active schedules list; write component tests.
  **File(s):** `artifacts/apex-os/src/components/analytics/ExportPanel.tsx`, `artifacts/apex-os/src/components/analytics/__tests__/ExportPanel.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- ExportPanel.test.tsx` → GREEN.

- [ ] FRONT‑ANALYTICS‑004.3 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑SETTINGS‑001: System Configuration – Replace Mock Data
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** `artifacts/apex-os/src/pages/Settings.tsx` uses mock data for org settings, integrations, billing, and API keys. No `useOrgSettings` or related hooks exist.
**Size:** Medium

**Description:** Replace all mock data in the Settings page with real React Query hooks. Wire organisation profile, integrations management (OAuth connections), billing plan display, and API key management.

**Depends on:** API‑SETTINGS‑003 (settings API green), FRONT‑INFRA‑001, FRONT‑AUTH‑002
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/pages/Settings.tsx`, `artifacts/apex-os/src/hooks/settings/useOrgSettings.ts`, `artifacts/apex-os/src/hooks/settings/useApiKeyList.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; `toast` from `sonner`
- Exports: `useOrgSettings()`, `useUpdateOrgSettings()`, `useApiKeyList()`, `useCreateApiKey()`, `useRevokeApiKey()`, `useIntegrationList()`

**Definition of Done**
- [ ] Organisation profile tab: name, logo (via `FileUpload`), timezone, date format, currency — edits call `useUpdateOrgSettings`; auto-save with 2-second debounce
- [ ] Integrations tab: list of available integrations (Stripe, QuickBooks, Google Calendar, Outlook, Slack) with connected/disconnected status; "Connect" initiates OAuth in new window; "Disconnect" calls `useDisconnectIntegration` with confirmation
- [ ] Billing tab: current plan name, billing cycle, next renewal date, usage meters (storage, users, API calls); "Upgrade Plan" link (navigates to pricing page — not in-app for Phase 5)
- [ ] API Keys tab: list of API keys (name, created date, last used, scopes, masked key); "Create Key" form; "Revoke" button with confirmation; created key shown once in a dialog with copy button
- [ ] All `mockData` imports removed from `Settings.tsx`
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- In-app plan upgrade / payment (Phase 7+)
- SSO/SAML configuration (Phase 9+)
- Audit log export (Phase 6+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/hooks/settings/useOrgSettings.ts`, `artifacts/apex-os/src/hooks/settings/useApiKeyList.ts`, `artifacts/apex-os/src/hooks/settings/useIntegrationList.ts`, `artifacts/apex-os/src/pages/Settings.tsx`
- Tests added/updated in: `artifacts/apex-os/src/pages/__tests__/settings.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: file-level — delete hook files; revert `Settings.tsx` mock imports
- Halt condition: if API key creation returns the full key value in subsequent `GET /api-keys` responses (a security issue), stop and ensure the API only returns masked keys after creation

**Rules to Follow**
- **CRITICAL**: API keys must be shown in full only once (at creation time) and immediately masked on all subsequent renders — never re-expose the full key from a GET request
- Integration OAuth must open in a new popup window (`window.open`) — never navigate the main app window away
- Billing data must never be editable in Phase 5 — display only

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- settings.test.tsx
```

**Advanced Code Patterns**
- API key created toast: show full key in a `<code>` block inside a sonner toast with a "Copy" button; dismiss hides it permanently
- `useOrgSettings` uses `staleTime: 300_000` — org settings rarely change

**Anti-Patterns**
- Displaying full API keys in the settings list — always show only the first 8 and last 4 characters
- Not confirming before revoking an API key — this is irreversible and breaks integrations using that key

**DDD / TDD / BDD / Deep Module notes**
- DDD: Organisation settings are a tenant-level configuration aggregate. API keys are access credential value objects — revoking them is a domain command.
- TDD: MSW returns org settings; assert form pre-fills; simulate name change → assert debounced `PATCH` called; simulate create API key → assert key shown once in toast; simulate revoke → assert confirmation shown.
- BDD: "As a firm admin, I can configure my organisation profile, manage integrations, and create API keys for external access."
- Deep Module: `useOrgSettings`, `useApiKeyList`, `useIntegrationList` hide all settings API concerns.

---

### Subtasks

- [ ] FRONT‑SETTINGS‑001.0.25 (AGENT): Read `Settings.tsx` in full and list every `mockData` reference and settings tab structure.
  *No action — pause until fully understood.*

- [ ] FRONT‑SETTINGS‑001.1 (AGENT): Create `useOrgSettings`, `useUpdateOrgSettings`, `useIntegrationList`, `useDisconnectIntegration` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/settings/useOrgSettings.ts`, `artifacts/apex-os/src/hooks/settings/useIntegrationList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑SETTINGS‑001.2 (AGENT): Create `useApiKeyList`, `useCreateApiKey`, `useRevokeApiKey` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/settings/useApiKeyList.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑SETTINGS‑001.3 (AGENT): Replace mock data in `Settings.tsx`; wire org profile, integrations, billing (read-only), and API keys tabs.
  **File(s):** `artifacts/apex-os/src/pages/Settings.tsx`
  **Verification:** No `mockData` references; `pnpm run typecheck` passes.

- [ ] FRONT‑SETTINGS‑001.4 (AGENT): Write component tests.
  **File(s):** `artifacts/apex-os/src/pages/__tests__/settings.test.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- settings.test.tsx` → GREEN.

- [ ] FRONT‑SETTINGS‑001.5 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## [ ] FRONT‑SETTINGS‑002: User Preferences
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No per-user preferences UI exists in Settings. User profile is only shown in the header avatar dropdown.
**Size:** Small

**Description:** Per-user preferences panel in Settings (under a "My Profile" or "Preferences" tab): profile photo, display name, notification preferences (email/in-app per event type), timezone override, date format, and theme toggle (dark/light — if applicable).

**Depends on:** API‑SETTINGS‑004 (user preferences API green), FRONT‑SETTINGS‑001
**Blocks:** [N/A]
**Related Files:** `artifacts/apex-os/src/components/settings/UserPreferences.tsx`, `artifacts/apex-os/src/hooks/settings/useUserPreferences.ts`

**Imports / Exports**
- Imports: `useQuery`, `useMutation` from `@tanstack/react-query`; shadcn/ui Switch, Select
- Exports: `useUserPreferences()`, `useUpdateUserPreferences()`, `UserPreferences` component

**Definition of Done**
- [ ] Profile section: avatar upload (via existing `FileUpload` component), display name, job title — edits auto-saved with 2-second debounce
- [ ] Notification preferences: toggle matrix — rows are event types (new message, invoice paid, task assigned, appointment confirmed), columns are delivery channels (email, in-app); each cell is a Switch
- [ ] Timezone: dropdown selector populated from `Intl.supportedValuesOf('timeZone')`; selected timezone stored and used everywhere in the app for date display
- [ ] Date format: selector (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD); applied globally via context
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Accessibility preferences (high contrast, font size — Phase 7+)
- Two-factor authentication enrollment (Phase 7+)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets

**Output Artifacts**
- Code changes in: `artifacts/apex-os/src/components/settings/UserPreferences.tsx`, `artifacts/apex-os/src/hooks/settings/useUserPreferences.ts`
- Tests added/updated in: `artifacts/apex-os/src/components/settings/__tests__/UserPreferences.test.tsx`
- Documentation: [N/A]
- Migration files: [N/A]

**Rollback**
- Granularity: component-level — remove `UserPreferences` tab from Settings; user profile is accessible only via header dropdown
- Halt condition: if timezone preference does not propagate correctly to date display across all pages, stop and verify the timezone context provider wraps all page components

**Rules to Follow**
- Timezone changes must be applied immediately via a React context that all date-display components consume — never require a page reload
- Notification preference changes are fire-and-forget — show optimistic confirmation; do not block UI while saving

**Verification**
```bash
pnpm run typecheck
pnpm --filter @workspace/apex-os test -- UserPreferences.test.tsx
```

**Advanced Code Patterns**
- Notification preference matrix: render as a 2D grid using CSS Grid; `useFieldArray` is not needed — use a `Map<eventType, Set<channel>>` in a `useReducer`
- Timezone from `Intl.supportedValuesOf('timeZone')` — available in all modern browsers; no external library needed

**Anti-Patterns**
- Saving preferences one at a time on each toggle — debounce and batch all changes into a single `PATCH` request
- Not propagating timezone change until page reload — always apply immediately via context

**DDD / TDD / BDD / Deep Module notes**
- DDD: User preferences are a per-user configuration value object — not an aggregate. They are scoped to the authenticated user.
- TDD: MSW returns user preferences; assert notification toggle matrix renders; simulate timezone change → assert `PATCH` called; assert date display updates immediately.
- BDD: "As a firm user, I can set my notification preferences per event type and channel, and choose my preferred timezone and date format."
- Deep Module: `useUserPreferences` hides preference loading, debounced saving, and timezone context injection.

---

### Subtasks

- [ ] FRONT‑SETTINGS‑002.1 (AGENT): Create `useUserPreferences` and `useUpdateUserPreferences` hooks.
  **File(s):** `artifacts/apex-os/src/hooks/settings/useUserPreferences.ts`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑SETTINGS‑002.2 (AGENT): Build `UserPreferences` component with avatar upload, notification matrix, timezone, and date format selectors.
  **File(s):** `artifacts/apex-os/src/components/settings/UserPreferences.tsx`
  **Verification:** `pnpm run typecheck` passes.

- [ ] FRONT‑SETTINGS‑002.3 (AGENT): Write component tests; integrate tab into `Settings.tsx`.
  **File(s):** `artifacts/apex-os/src/components/settings/__tests__/UserPreferences.test.tsx`, `artifacts/apex-os/src/pages/Settings.tsx`
  **Verification:** `pnpm --filter @workspace/apex-os test -- UserPreferences.test.tsx` → GREEN.

- [ ] FRONT‑SETTINGS‑002.4 (HUMAN): Final review and sign-off.
  **Verification:** Approved.

---

## Analytics & Settings Data Integration

### [ ] FRONT‑ANALYTICS‑001: Reports Engine – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑ANALYTICS‑001 (reports engine API).  
**Definition of Done:** Analytics dashboard uses `useReportsEngine` hook. Report builder UI with drag‑and‑drop chart components. Real-time data aggregation across all business contexts. Export functionality (PDF, CSV, Excel). All mock data removed.  
**Deep Module:** Encapsulates report generation logic, chart configuration, and data aggregation with clear API boundaries.  
**Advanced Code Patterns:** Hook-based state management, drag-and-drop UI, chart composition patterns.  
**Anti-Patterns:** Avoid hardcoded chart types, prevent data leakage between reports.  
**Rules to Follow:** Always validate report parameters, implement proper error handling, maintain responsive design.  
**Out of Scope:** Real-time collaboration on reports, advanced custom visualizations.  
**Verification:** `npm test -- reports-engine.test.tsx && npm run typecheck`

**Subtasks:**
- [ ] FRONT‑ANALYTICS‑001.1: Create `useReportsEngine` hook with report generation. (AGENT)  
- [ ] FRONT‑ANALYTICS‑001.2: Build report builder with chart components. (AGENT)  
- [ ] FRONT‑ANALYTICS‑001.3: Implement export functionality (PDF, CSV, Excel). (AGENT)  
- [ ] FRONT‑ANALYTICS‑001.4: Replace mock analytics data with real aggregations. (AGENT)

---

### [ ] FRONT‑ANALYTICS‑002: Metrics API – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑ANALYTICS‑002 (metrics API).  
**Definition of Done:** Metrics dashboard uses `useMetricsAPI` hook. Real-time KPI tracking across business contexts. Custom metric builder with formula editor. Alert thresholds and notifications. All mock data removed.

**Subtasks:**
- [ ] FRONT‑ANALYTICS‑002.1: Create `useMetricsAPI` hook with KPI tracking. (AGENT)  
- [ ] FRONT‑ANALYTICS‑002.2: Build custom metric builder with formula editor. (AGENT)  
- [ ] FRONT‑ANALYTICS‑002.3: Implement alert thresholds and notifications. (AGENT)  
- [ ] FRONT‑ANALYTICS‑002.4: Replace mock metrics data with real-time calculations. (AGENT)

---

### [ ] FRONT‑ANALYTICS‑003: Caching Layer – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑ANALYTICS‑003 (caching layer API).  
**Definition of Done:** Caching management UI uses `useCachingLayer` hook. Cache status monitoring, invalidation controls, performance metrics. Cache warming and preloading strategies. All mock data removed.

**Subtasks:**
- [ ] FRONT‑ANALYTICS‑003.1: Create `useCachingLayer` hook with cache management. (AGENT)  
- [ ] FRONT‑ANALYTICS‑003.2: Build cache status monitoring dashboard. (AGENT)  
- [ ] FRONT‑ANALYTICS‑003.3: Implement cache invalidation controls and warming strategies. (AGENT)  
- [ ] FRONT‑ANALYTICS‑003.4: Replace mock cache data with real performance metrics. (AGENT)

---

### [ ] FRONT‑ANALYTICS‑004: Export Reports – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑ANALYTICS‑004 (export reports API).  
**Definition of Done:** Export functionality uses `useExportReports` hook. Multiple format support (PDF, CSV, Excel, JSON). Scheduled report generation and email delivery. Export history tracking. All mock data removed.

**Subtasks:**
- [ ] FRONT‑ANALYTICS‑004.1: Create `useExportReports` hook with format support. (AGENT)  
- [ ] FRONT‑ANALYTICS‑004.2: Build scheduled report generation interface. (AGENT)  
- [ ] FRONT‑ANALYTICS‑004.3: Implement email delivery and history tracking. (AGENT)  
- [ ] FRONT‑ANALYTICS‑004.4: Replace mock export data with real report generation. (AGENT)

---

### [ ] FRONT‑SETTINGS‑001: System Configuration – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑SETTINGS‑003 (settings API).  
**Definition of Done:** Settings page uses `useSystemConfig` hook. Configuration management for all platform settings. Feature flags and environment variables. System health monitoring. All mock data removed.

**Subtasks:**
- [ ] FRONT‑SETTINGS‑001.1: Create `useSystemConfig` hook with configuration management. (AGENT)  
- [ ] FRONT‑SETTINGS‑001.2: Build feature flags and environment variables interface. (AGENT)  
- [ ] FRONT‑SETTINGS‑001.3: Implement system health monitoring dashboard. (AGENT)  
- [ ] FRONT‑SETTINGS‑001.4: Replace mock settings data with real configuration. (AGENT)

---

### [ ] FRONT‑SETTINGS‑002: User Preferences – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑SETTINGS‑004 (user preferences API).  
**Definition of Done:** User preferences page uses `useUserPreferences` hook. Personalization settings, notification preferences, theme and display options. Accessibility settings. All mock data removed.

**Subtasks:**
- [ ] FRONT‑SETTINGS‑002.1: Create `useUserPreferences` hook with preference management. (AGENT)  
- [ ] FRONT‑SETTINGS‑002.2: Build personalization and notification preferences interface. (AGENT)  
- [ ] FRONT‑SETTINGS‑002.3: Implement theme and display options with accessibility settings. (AGENT)  
- [ ] FRONT‑SETTINGS‑002.4: Replace mock preference data with real user settings. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: Analytics & Settings components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: Settings pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard analytics metrics depend on Analytics API integration

### Related Master Tracker Tasks
- **API‑ANALYTICS‑001**: Reports engine API must be green before FRONT‑ANALYTICS‑001
- **API‑ANALYTICS‑002**: Metrics API must be green before FRONT‑ANALYTICS‑002
- **API‑SETTINGS‑003**: Settings API must be green before FRONT‑SETTINGS‑001

---

## Verification Commands

### Analytics & Settings Integration Verification
```bash
# Analytics verification
npm test -- reports-engine.test.tsx
npm test -- metrics-api.test.tsx
npm test -- caching-layer.test.tsx
npm test -- export-reports.test.tsx

# Settings verification
npm test -- system-config.test.tsx
npm test -- user-preferences.test.tsx

# Manual verification
# Navigate to Analytics page, verify all data loads from API
# Test report building and export functionality
# Navigate to Settings page, verify configuration management
```

---

## Completion Criteria

### Analytics & Settings Frontend Integration Complete When:
1. All Analytics data (reports, metrics, caching, exports) loads from APIs
2. Analytics dashboard provides comprehensive business insights
3. Settings pages enable complete system configuration
4. User preferences allow full personalization
5. Caching layer optimizes performance for large datasets
6. Export functionality supports multiple formats and scheduling
7. All mock data imports are removed from Analytics & Settings components
8. Component tests pass with MSW mocks
9. Manual testing confirms complete Analytics & Settings functionality

**Estimated Timeline:** 6-8 days with parallel execution
