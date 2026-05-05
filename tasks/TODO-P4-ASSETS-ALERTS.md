# TODO-P4-ASSETS-ALERTS.md – Phase 4: Asset Alerts System

This file covers the configurable alert system for asset management: lease expirations, warranty notifications, scheduled maintenance reminders, and overdue check-in alerts.

---

### [ ] ASSETS‑ALERT‑001: Configurable Asset Alerts (Lease, Warranty, Maintenance, Overdue Check-In)
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** No alert system exists for assets. `asset_alerts` and `alert_notifications` tables do not exist. No background job processor is registered. There is no way to notify users of expiring leases, warranties, or overdue check-ins.  
**Size:** Large  

**Description:** Build the full asset alert lifecycle: DB schema, CRUD API, background job that checks due alerts daily, email and in-app notification delivery, and deduplication to prevent spam.  

**Depends on:** API‑ASSETS‑001 (asset CRUD), EMAIL‑SERVICE‑001 (email delivery)  
**Blocks:** [N/A — standalone alert module; consumed by users and ASSETS‑CON‑001]
**Related Files:** `lib/db/src/schema/asset-alerts.ts`, `lib/db/src/repositories/assets/alerts.ts`, `artifacts/api-server/src/services/assets/alert-service.ts`, `artifacts/api-server/src/routes/assets/alerts.ts`, `artifacts/api-server/src/jobs/alert-processor.ts`, `lib/api-spec/openapi.yaml`  

**Imports / Exports**
- Imports: Drizzle `pgTable`, `uuid`, `text`, `date`, `integer`, `boolean`, `timestamp`, `pgEnum`; `EmailService`; `node-cron` (or equivalent scheduler)
- Exports: `assetAlertsTable`, `alertNotificationsTable` (schema); `AlertRepository` (class); `AlertService` (class); `alertsRouter` (Express Router); `startAlertProcessor()` (job function)

**Definition of Done**
- [ ] DB: `lib/db/src/schema/asset-alerts.ts` defines `asset_alerts` and `alert_notifications` tables with indexes on `(organization_id, alert_type)`, `(trigger_date, is_active)`, `(asset_id)`
- [ ] DB: `pnpm --filter @workspace/db run push` succeeds (with user approval)
- [ ] OpenAPI: `assets/alerts` tag with `POST /assets/{assetId}/alerts`, `GET /assets/{assetId}/alerts`, `GET /assets/alerts`, `PATCH /assets/alerts/{alertId}`, `DELETE /assets/alerts/{alertId}`, `POST /assets/alerts/{alertId}/trigger`
- [ ] `AlertService` methods: `createAlert`, `listAlerts`, `updateAlert`, `deactivateAlert`, `processAlerts` (used by background job)
- [ ] Background job (`alert-processor.ts`) runs daily via `node-cron`; queries alerts where `trigger_date - lead_time_days <= today`; sends notifications; logs to `alert_notifications`
- [ ] Alert deduplication: if an alert was sent in the last 24 hours for the same `(alertId, recipientId)`, skip
- [ ] Pre-defined alert types: `lease_expiration`, `warranty_expiration`, `maintenance_due`, `checkin_overdue`
- [ ] Integration test: create alert → advance mock clock → run processor → verify notification created
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- Real-time push notifications (WebSocket/mobile push) — Phase 5+
- Custom alert types beyond the 4 predefined types
- Multi-channel delivery beyond email and in-app

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, credentials, secrets
- `DELETE /assets/alerts/{alertId}` must set `is_active = false` (soft deactivate) — never hard delete
- `pnpm --filter @workspace/db run push` requires explicit user approval

**Output Artifacts**
- Code changes in: `lib/db/src/schema/asset-alerts.ts`, `lib/db/src/repositories/assets/alerts.ts`, `artifacts/api-server/src/services/assets/alert-service.ts`, `artifacts/api-server/src/routes/assets/alerts.ts`, `artifacts/api-server/src/jobs/alert-processor.ts`, `lib/api-spec/openapi.yaml`
- Tests added/updated in: `artifacts/api-server/src/__tests__/api/assets/alerts.test.ts`
- Documentation: [N/A]
- Migration files: `lib/db/src/migrations/` (via `drizzle-kit`)

**Rollback**
- Granularity: migration-level — revert migration file; drop `asset_alerts`, `alert_notifications` tables manually if pushed
- Halt condition: if `pnpm --filter @workspace/db run push` fails or integration tests fail, stop and fix before proceeding

**Rules to Follow**
- Alert processor must be idempotent — re-running it must not send duplicate notifications
- All alert queries must include `WHERE organization_id = $orgId`
- Background job must not block the Express event loop — use `node-cron` with async handler
- Retry failed email deliveries up to 3 times with exponential back-off

**Verification**
```bash
pnpm --filter @workspace/db run push   # requires user approval
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server test -- alerts.test.ts
pnpm run typecheck
```

**Advanced Code Patterns**
- `node-cron` scheduled job with async handler and error boundary: `cron.schedule('0 8 * * *', async () => { ... })`
- Deduplication query: `SELECT 1 FROM alert_notifications WHERE alert_id = $1 AND recipient_id = $2 AND sent_at > NOW() - INTERVAL '24 hours'`
- Retry wrapper with exponential back-off: attempt 1 → 0 s, attempt 2 → 2 s, attempt 3 → 8 s

**Anti-Patterns**
- Synchronous notification sending in API response path — blocks response and risks timeout
- No deduplication check — users receive duplicate emails for the same expiration
- Hard-coded lead time (30 days) — must be per-alert configurable
- Missing retry logic for failed email delivery

**DDD / TDD / BDD / Deep Module notes**
- DDD: `AssetAlert` is a value object in the Asset bounded context; the background job is an application service (not a domain service)
- TDD: Write integration test for the full lifecycle (create → process → notify) before implementing the job
- BDD: "I receive an email 30 days before my laptop's lease expires so I can plan the renewal"
- Deep Module: `AlertService.processAlerts()` hides deduplication, scheduling logic, email dispatch, retry, and audit logging behind one method

---

### Subtasks

- [ ] ASSETS‑ALERT‑001.0.25 (AGENT): Read this task, `API‑ASSETS‑001` asset schema, `EMAIL‑SERVICE‑001` email interface, and `lib/api-spec/openapi.yaml` structure in full.  
  *No action — pause until fully understood.*

- [ ] ASSETS‑ALERT‑001.0.5 (AGENT): Research `node-cron` v3 API (May 2026) for ESM-compatible scheduled jobs. Confirm whether `@types/node-cron` is needed and check if `node-cron` is already in `package.json`.  
  *Document findings briefly or note "no changes."*

- [ ] ASSETS‑ALERT‑001.0.75 (AGENT): Reason about the background job execution model. Default: `node-cron` daily at 08:00 UTC; async handler; error boundary logs via Pino; no blocking of main event loop.  
  *If uncertain, ask the user before executing.*

- [ ] ASSETS‑ALERT‑001.1 (AGENT): Define `asset_alerts` and `alert_notifications` Drizzle schema with indexes.  
  **File(s):** `lib/db/src/schema/asset-alerts.ts`  
  **Verification:** Schema compiles; `pnpm run typecheck` clean.

- [ ] ASSETS‑ALERT‑001.2 (HUMAN): Approve and run `pnpm --filter @workspace/db run push`.  
  **Verification:** Migration applied; tables visible in DB.

- [ ] ASSETS‑ALERT‑001.3 (AGENT): Add alert endpoints to OpenAPI spec; run codegen.  
  **File(s):** `lib/api-spec/openapi.yaml`  
  **Verification:** Codegen succeeds; generated types available.

- [ ] ASSETS‑ALERT‑001.4 (AGENT): Implement `AlertRepository` with deduplication and filtering.  
  **File(s):** `lib/db/src/repositories/assets/alerts.ts`  
  **Verification:** Unit tests against test DB pass.

- [ ] ASSETS‑ALERT‑001.5 (AGENT): Implement `AlertService` with `createAlert`, `listAlerts`, `updateAlert`, `deactivateAlert`, `processAlerts`.  
  **File(s):** `artifacts/api-server/src/services/assets/alert-service.ts`  
  **Verification:** Unit tests with mocked repo and email service pass.

- [ ] ASSETS‑ALERT‑001.6 (AGENT): Create alert routes with Zod validation.  
  **File(s):** `artifacts/api-server/src/routes/assets/alerts.ts`  
  **Verification:** Routes compile; mount in assets router.

- [ ] ASSETS‑ALERT‑001.7 (AGENT): Implement `alert-processor.ts` background job with `node-cron`.  
  **File(s):** `artifacts/api-server/src/jobs/alert-processor.ts`  
  **Verification:** Unit test with mocked cron clock verifies notifications created; deduplication prevents double-send.

- [ ] ASSETS‑ALERT‑001.8 (AGENT): Write integration tests for full alert workflow.  
  **File(s):** `artifacts/api-server/src/__tests__/api/assets/alerts.test.ts`  
  **Verification:** `pnpm --filter @workspace/api-server test -- alerts.test.ts` → all green.

- [ ] ASSETS‑ALERT‑001.9 (HUMAN): Final review and sign-off.  
  **Verification:** Approved.
