# tasks/infrastructure/RESILIENCE.md – External Dependency Resilience

This file covers circuit breakers, graceful degradation, and resilience telemetry for all external service dependencies.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Resilience Patterns

### [ ] RESILIENCE‑001: Circuit Breakers for External Calls
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** External integrations fail directly into application flows.

**Description:** Wrap all external dependencies with circuit breakers, timeout budgets, and fallback handling for degraded conditions.

**Depends on:** All integration points
**Blocks:** `RESILIENCE‑002`, `RESILIENCE‑003`
**Related Files:** `artifacts/api‑server/src/lib/resilience`, `docs/resilience/dependency‑matrix.md`

### [ ] RESILIENCE‑002: Graceful Degradation Patterns
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** Degraded-mode behavior is undocumented.

**Description:** Define per-domain fallback behavior when payments, email, storage, video, accounting, or calendar providers are unavailable.

**Depends on:** `infrastructure/RESILIENCE.md → RESILIENCE‑001`
**Blocks:** [N/A]
**Related Files:** `docs/resilience/degraded‑mode.md`

### [ ] RESILIENCE‑003: Failure Metrics & Dashboards
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** External dependency failure rates are not surfaced centrally.

**Description:** Publish breaker state, retry counts, fallback activations, and recovery metrics through the observability stack.

**Depends on:** `infrastructure/RESILIENCE.md → RESILIENCE‑001`, `infrastructure/OBSERVABILITY.md → OBS‑006`
**Blocks:** [N/A]
**Related Files:** `ops/grafana/dependency‑resilience.json`

**Verification**
- [ ] Simulate one external outage and confirm the breaker opens and a fallback path activates
- [ ] Surface breaker state in observability dashboards

## Subtasks
- [ ] RESILIENCE‑001.1 (AGENT): Inventory every external integration and assign timeout budgets.
- [ ] RESILIENCE‑001.2 (AGENT): Define breaker thresholds and fallback ownership.
- [ ] RESILIENCE‑002.1 (AGENT): Document degraded-mode behavior by bounded context.
- [ ] RESILIENCE‑002.2 (HUMAN): Review customer-visible failure behavior and support messaging.
- [ ] RESILIENCE‑003.1 (AGENT): Define resilience metrics and dashboard requirements.
- [ ] RESILIENCE‑003.2 (AGENT): Add alert thresholds for prolonged degraded states.