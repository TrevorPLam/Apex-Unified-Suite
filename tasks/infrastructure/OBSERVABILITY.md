# tasks/infrastructure/OBSERVABILITY.md – Observability & Tracing

This file covers tracing, business instrumentation, service-level objectives, and performance validation across the platform.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Tracing & SLOs

### [ ] OBS‑001: OpenTelemetry Platform Baseline
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Error tracking exists, but distributed tracing does not.

**Description:** Initialize OpenTelemetry in backend and frontend entrypoints with vendor-neutral OTLP export and shared trace context propagation.

**Depends on:** `foundation/ARCHITECTURE.md → ARCH‑009`
**Blocks:** `OBS‑002`, `OBS‑003`, `OBS‑004`, `OBS‑005`
**Related Files:** `artifacts/api‑server/src/observability/bootstrap.ts`, `artifacts/apex‑os/src/observability/bootstrap.ts`

### [ ] OBS‑002: HTTP & Database Instrumentation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Request, DB, and cache spans are not captured.

**Description:** Instrument Express, PostgreSQL, queue workers, and outbound HTTP calls with request IDs, sanitized attributes, and failure tagging.

**Depends on:** `infrastructure/OBSERVABILITY.md → OBS‑001`
**Blocks:** `OBS‑006`
**Related Files:** `artifacts/api‑server/src/app.ts`, `lib/db/src/index.ts`

### [ ] OBS‑003: Business Operation Spans
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** High-value flows are opaque during debugging.

**Description:** Add custom spans for payments, booking flow, document storage, email send/ingestion, and cross-domain automation events.

**Depends on:** `infrastructure/OBSERVABILITY.md → OBS‑001`
**Blocks:** `OBS‑006`
**Related Files:** `artifacts/api‑server/src/services`, `artifacts/apex‑os/src/hooks`

### [ ] OBS‑006: SLI/SLO Dashboard
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** No documented service objectives exist.

**Description:** Define service-level indicators and error budgets for latency, error rate, throughput, job processing, and integration health, with dashboards and alert rules.

**Depends on:** `infrastructure/OBSERVABILITY.md → OBS‑002`, `OBS‑003`
**Blocks:** `OBS‑007`
**Related Files:** `docs/observability/sli‑slo.md`, `ops/grafana/apex‑overview.json`

### [ ] OBS‑007: Performance Testing & Regression Gates
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** No load profile or performance regression gate exists.

**Description:** Define performance targets per endpoint class and add repeatable load tests with regression thresholds in CI or pre-release validation.

**Depends on:** `infrastructure/OBSERVABILITY.md → OBS‑006`
**Blocks:** [N/A]
**Related Files:** `scripts/perf`, `docs/observability/performance‑targets.md`

**Verification**
- [ ] Generate traces from HTTP through DB and one external call
- [ ] Publish an SLO dashboard with at least one burn-rate alert

## Subtasks
- [ ] OBS‑001.1 (AGENT): Document the OTel bootstrap and collector/export path.
- [ ] OBS‑001.2 (AGENT): Add backend and frontend initialization tasks.
- [ ] OBS‑002.1 (AGENT): Define required span attributes for HTTP, DB, and queues.
- [ ] OBS‑002.2 (AGENT): Add request-ID and trace-context propagation checks.
- [ ] OBS‑003.1 (AGENT): Select the business flows that require custom spans.
- [ ] OBS‑003.2 (AGENT): Define redaction rules for span attributes.
- [ ] OBS‑006.1 (AGENT): Draft SLI/SLO targets and dashboard requirements.
- [ ] OBS‑007.1 (AGENT): Define load-test scenarios and regression thresholds.