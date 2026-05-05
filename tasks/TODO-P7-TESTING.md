# TODO-P7-TESTING.md – Phase 7 Integration Testing

This document contains end‑to‑end integration testing tasks for all Phase 7 integrations. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 Integration Testing Task Index

- [ ] INT‑TEST‑001 – End‑to‑End Integration Testing

---

## [ ] INT‑TEST‑001: End‑to‑End Integration Testing
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No integration tests exist for any Phase 7 integrations. All integration adapters have been unit‑tested in isolation with recorded fixtures, but no cross‑integration workflows have been validated end‑to‑end. As of May 2026, best practice for testing external integrations uses a combination of mock API servers (Nock, MSW Node, WireMock) for deterministic tests, contract testing for API compatibility, and Docker‑composed test environments for isolated integration testing.
**Size:** Large

**Description:** Create a comprehensive integration test suite covering all Phase 7 integrations (calendars, video conferencing, storage, payments, accounting, AP/AR, document productivity, DLP), including mock service implementations for all external providers, end‑to‑end workflow tests, performance benchmarks, and monitoring setup for integration health.

**Depends on:** All Phase 7 integration tasks (INT‑CALENDAR‑001/002/003, INT‑VIDEO‑001/002/003, INT‑STORAGE‑001, INT‑PAYMENT‑001, INT‑AP‑001/002, INT‑AR‑001/002, INT‑FIN‑001/002/003, INT‑QB‑001, INT‑XERO‑001, INT‑DOCS‑001/002/003/004)
**Blocks:** [N/A] — final Phase 7 task; gate before Phase 8 work begins
**Related Files:** `tests/integrations/setup/`, `tests/integrations/e2e/`, `tests/integrations/performance/`, `tests/integrations/mocks/`, `tests/integrations/contracts/`, `monitoring/integrations/`, `tests/integrations/fixtures/`, `tests/integrations/utils/`

**Imports / Exports**
- Imports: All integration adapter ports and services, Vitest, Supertest, Nock/WireMock, `k6` or `autocannon` (performance), `pino` (logging)
- Exports: [N/A] — test suite and monitoring configuration

**Definition of Done**
- [ ] **Mock services environment** created under `tests/integrations/mocks/` with mock servers for all external providers:
  - Google Calendar API mock (calendar events, OAuth token exchange, webhook delivery)
  - Microsoft Graph API mock (calendar, Teams, OneDrive)
  - Apple CalDAV mock (iCloud event CRUD)
  - Zoom API mock (meetings, webhooks)
  - Stripe API mock (Payment Intents, subscriptions, webhooks)
  - Plaid API mock (bank accounts, transactions, webhooks)
  - QuickBooks Online API mock (vendors, bills, invoices, payments)
  - Xero API mock (contacts, bills, invoices, payments)
  - BILL API mock (vendor network, payments)
  - Wise API mock (FX rates, transfers)
  - DLP provider mock (document scanning)
  - All mocks replicate provider error scenarios (rate limiting, authentication failures, network timeouts)
- [ ] **End‑to‑end workflow tests** created under `tests/integrations/e2e/`:
  - Calendar sync workflow: create appointment in Apex → syncs to Google, Outlook, and Apple calendars → external update → reflected back in Apex
  - Video meeting workflow: create appointment → Zoom/Teams/Meet meeting generated → meeting link stored → meeting ended webhook → recording available
  - Payment processing workflow: create payment intent → confirm via Stripe Elements → webhook received → Apex status updated → refund processed
  - Document sharing workflow: upload document → generate share link → DLP scan → Outlook/Gmail add‑in sends secure link
  - Accounting sync workflow: create bill in Apex → syncs to QBO and Xero → payment synced back → reconciliation matches
  - Bank feed workflow: connect bank account via Plaid → transactions synced → automatically reconciled → reconciliation report generated
  - Multi‑currency payment workflow: create international bill → FX rate fetched → payment executed → NACHA file generated
- [ ] **Contract tests** created under `tests/integrations/contracts/`:
  - Each adapter's request/response shapes validated against provider OpenAPI specs
  - Error response mappings tested for all known error codes
  - Webhook payload schemas validated
- [ ] **Performance tests** created under `tests/integrations/performance/`:
  - Payment Intent creation latency (p95 < 2 s)
  - Calendar sync time for 100 appointments (p95 < 10 s)
  - Document upload with DLP scan (p95 < 5 s)
  - Concurrent webhook processing throughput (100 events/sec)
  - NACHA file generation for 500 payments (p95 < 5 s)
- [ ] **Integration monitoring** configured:
  - Health checks for each integration adapter (connection status, last sync time, error rate)
  - Prometheus metrics exposed for integration latency and error rates
  - Alert rules defined for integration failures (e.g., webhook delivery failure rate > 5%)
  - Grafana dashboard JSON for integration health overview
- [ ] All test suites pass in CI with deterministic results (no flaky tests)
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Load testing for full production scale (performance tests are benchmarking, not stress tests)
- Chaos engineering (random failure injection)
- Cross‑browser testing of add‑ins (Outlook/Gmail add‑in testing is manual)
- Production monitoring deployment (only configuration is generated)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, provider API keys, mock server secrets
- Mock servers must never make outbound calls to real provider APIs — all network access must be intercepted
- Test data must be anonymized and must not contain real PII

**Output Artifacts**
- Code changes in: [N/A] — test files only; no production code changes
- Tests added/updated in: `tests/integrations/` (all subdirectories)
- Documentation: `docs/integration-testing-guide.md` (how to run integration tests, mock server setup)
- Monitoring configuration: `monitoring/integrations/prometheus-rules.yml`, `monitoring/integrations/grafana-dashboard.json`

**Rollback**
- Granularity: file‑level — delete `tests/integrations/` directory; no production impact
- Halt condition: if any mock server fails to start or returns inconsistent data, stop and fix mock implementation before running workflow tests

**Rules to Follow**
- All integration tests must be hermetic — no external network calls; all dependencies mocked
- Tests must clean up after themselves (delete created test data) to ensure repeatability
- Mock servers must be started before test suite execution and stopped after (use Vitest `globalSetup` and `globalTeardown`)
- Each workflow test must exercise the complete flow end‑to‑end, including webhook callbacks simulated by the mock server
- Performance tests must use dedicated test infrastructure (not shared with unit tests) and report JUnit XML results
- Contract tests must run on every PR; workflow and performance tests can run on merge to main or a nightly schedule

**Verification**
```bash
# Start mock servers and run all integration tests
pnpm vitest run -- tests/integrations/

# Run only end‑to‑end workflow tests
pnpm vitest run -- tests/integrations/e2e/

# Run only performance tests
pnpm vitest run -- tests/integrations/performance/

# Run only contract tests
pnpm vitest run -- tests/integrations/contracts/

# Check mock server health
pnpm vitest run -- tests/integrations/mocks/health.test.ts

# Generate JUnit report
pnpm vitest run -- tests/integrations/ --reporter=junit

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Hermetic mock servers: use `nock` (for HTTP interception) or standalone mock server processes (WireMock Docker containers) with pre‑recorded fixtures; Vitest `globalSetup` starts mock servers, `globalTeardown` stops them
- Fixture recording: use `nock.recorder.rec()` to capture real API interactions once, then replay during tests
- Contract testing: validate adapter request bodies against OpenAPI schemas using `openapi-schema-validator`
- Webhook simulation: mock servers expose an admin endpoint (`POST /mock/{provider}/trigger-webhook`) that the test suite calls to simulate webhook delivery
- Performance benchmarks: use `k6` with a script that exercises integration endpoints against a local test server; results compared to baseline thresholds
- Prometheus integration metrics: expose a `/metrics` endpoint in the API server that reports `integration_requests_total`, `integration_request_duration_seconds`, `integration_errors_total` per provider

**Anti‑Patterns**
- Do not test against live provider APIs in CI — network flakiness and rate limits cause unreliable tests
- Do not skip cleanup after each test — accumulated test data causes false passes
- Do not use hardcoded IDs that collide across test runs — generate UUIDs per test
- Do not ignore mock server startup failures — an unreachable mock server causes all tests to fail silently
- Do not run performance tests on shared CI runners with inconsistent resources — use dedicated performance test runs
- Do not add integration test coverage for every edge case that unit tests already cover — focus on cross‑integration workflows

**DDD / TDD / BDD / Deep Module notes**
- DDD: Integration tests validate that bounded contexts correctly communicate with external systems through their anti‑corruption layers (adapters). They verify that the `Port` interfaces are correctly implemented and that domain events are properly translated to/from provider‑specific formats.
- TDD: These integration tests are the final TDD step for Phase 7. Unit tests (adapter‑level) are written during implementation; integration tests verify the assembled system.
- BDD: "As a system integrator, I can run a full integration test suite that validates all external provider connections work correctly, including error handling, rate limiting, and recovery scenarios."
- Deep Module: The mock server infrastructure hides provider API simulation complexity behind a simple startup/shutdown interface. Test writers call `await startMockServers()` and `await stopMockServers()` without knowing which providers are being mocked.

---

### Subtasks

- [ ] INT‑TEST‑001.0.25 (AGENT): Read all Phase 7 integration task files to understand the full scope of integrations and their adapter interfaces.
  *No action — pause until fully understood.*

- [ ] INT‑TEST‑001.0.5 (AGENT): Research Nock usage with Vitest globalSetup/teardown, OpenAPI contract testing libraries, `k6` performance testing patterns, and Prometheus metric exposition for Node.js (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑TEST‑001.0.75 (AGENT): Reason about which mock server approach (Nock in‑process vs. standalone WireMock containers) is best for the Apex codebase. Present recommendation to user.
  *If uncertain, start with Nock for simplicity and escalate to WireMock if needed for complex webhook delivery simulation.*

- [ ] INT‑TEST‑001.1 (AGENT): Create integration test setup with Vitest `globalSetup`/`globalTeardown`, mock server infrastructure, and test utilities.
  **File(s):** `tests/integrations/setup/`, `vitest.integration.config.ts`
  **Verification:** `pnpm vitest run -- tests/integrations/setup/health.test.ts` confirms mock servers start and stop.

- [ ] INT‑TEST‑001.2 (AGENT): Implement mock servers for all external providers with fixture data and error scenario simulation.
  **File(s):** `tests/integrations/mocks/`
  **Verification:** Each mock server's health endpoint returns 200; webhook trigger endpoint works.

- [ ] INT‑TEST‑001.3 (AGENT): Write end‑to‑end workflow tests for calendar, video, payment, document, accounting, bank feed, and multi‑currency flows.
  **File(s):** `tests/integrations/e2e/`
  **Verification:** `pnpm vitest run -- tests/integrations/e2e/` → GREEN.

- [ ] INT‑TEST‑001.4 (AGENT): Write contract tests for all adapters validating request/response shapes against provider OpenAPI specs.
  **File(s):** `tests/integrations/contracts/`
  **Verification:** `pnpm vitest run -- tests/integrations/contracts/` → GREEN.

- [ ] INT‑TEST‑001.5 (AGENT): Write performance benchmarks for critical integration flows.
  **File(s):** `tests/integrations/performance/`
  **Verification:** `pnpm vitest run -- tests/integrations/performance/` results within thresholds.

- [ ] INT‑TEST‑001.6 (AGENT): Configure integration monitoring metrics and alert rules.
  **File(s):** `monitoring/integrations/`, `artifacts/api-server/src/lib/metrics/integration-metrics.ts`
  **Verification:** `/metrics` endpoint shows integration metrics; Grafana dashboard JSON valid.

- [ ] INT‑TEST‑001.7 (AGENT): Document integration testing guide.
  **File(s):** `docs/integration-testing-guide.md`
  **Verification:** Guide covers mock server setup, running tests, and interpreting results.

- [ ] INT‑TEST‑001.8 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑TEST‑001.N (HUMAN): Final review — run full integration test suite, verify results, review monitoring dashboard, approve.
  **Verification:** Approved.

---

*End of Phase 7 Integration Testing.*