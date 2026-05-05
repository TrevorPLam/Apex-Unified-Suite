# tasks/infrastructure/EVENT‑BUS.md – Domain Event Bus & Subscribers

This file contains the infrastructure for type‑safe, in‑process domain event publication and subscription, plus the concrete subscribers that power notification creation, audit logging, and email delivery. All tasks must be completed before any domain service that emits events.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] EVENT‑001: Domain Event Bus Infrastructure
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No domain event bus exists; no mechanism for decoupled communication between bounded contexts.
**Size:** Large

**Description:** Build a type‑safe, in‑process domain event bus that supports fire‑and‑forget async event publishing with error‑isolated handlers, an in‑memory event store for test replay, and Zod‑based schema validation — underpinning all domain event emission across every bounded context.

**Depends on:** [N/A] — infrastructure foundation
**Blocks:** `infrastructure/EVENT‑BUS.md → EVENT‑SUBSCRIBE‑001`, `EVENT‑SUBSCRIBE‑002`, `EVENT‑SUBSCRIBE‑003`, all domain service event emission subtasks (CRM, Finance, Projects, Documents, etc.)
**Related Files:** `artifacts/api‑server/src/events/domain‑event‑bus.ts`, `artifacts/api‑server/src/events/event‑types.ts`

**Definition of Done**
- [ ] `artifacts/api‑server/src/events/event‑types.ts` exports Zod schemas for all initial domain events: `LeadCreated`, `LeadStageChanged`, `InvoiceCreated`, `InvoicePaid`, `ProjectCompleted`, `TaskCompleted`, `UserRegistered` (integration event)
- [ ] `artifacts/api‑server/src/events/domain‑event‑bus.ts` exports `DomainEventBus` class with `publish(event)` and `subscribe(type, handler)` methods
- [ ] `publish` is async and fire‑and‑forget; handler errors are caught, logged at `error` level, and do not propagate to the caller
- [ ] Each handler runs in isolation — one handler failure does not prevent others from running
- [ ] In‑memory event store records all published events; `getEvents(type?)` and `clearEvents()` support test replay/assertion
- [ ] Performance monitoring: event processing time logged at `debug` level
- [ ] Unit tests cover: publish+subscribe, error isolation, event store replay, handler deregistration, typed schema validation rejection
- [ ] `pnpm typecheck` passes

**Out of Scope**
- Durable/persistent event storage (database‑backed event store) — future phase
- Message broker integration (Kafka, RabbitMQ, Redis Streams)
- Cross‑service event distribution
- Dead‑letter queues or retry logic for handler failures

**Rules to Follow**
- All handler errors must be caught and logged; never let them escape `publish()`
- Event schemas must be validated with Zod at publish time; invalid events throw synchronously before reaching handlers
- The event bus singleton must be initialised once at app startup and injected via constructor/DI
- Distinguish domain events (internal aggregate state changes) from integration events (cross‑context notifications) in the type system
- Use `correlationId` and `causationId` metadata fields on all events for distributed tracing readiness

**Verification**
```bash
pnpm test -- artifacts/api‑server/__tests__/events/domain‑event‑bus.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Domain events communicate state changes within and between bounded contexts without tight coupling.
- TDD: Write bus unit tests first. Test publish‑subscribe, handler error isolation, and event store replay.
- BDD: “When a lead is created, the `LeadCreated` event is emitted and the notification handler receives it without blocking the HTTP response.”
- Deep Module: `DomainEventBus` exposes 2 methods (`publish`, `subscribe`) hiding async dispatch, error isolation, schema validation, and event storage.

---

### Subtasks
- [ ] EVENT‑001.0.25 (AGENT): Read EVENT‑001 and all downstream tasks that depend on it. Understand which events are needed.
- [ ] EVENT‑001.0.5 (AGENT): Research in‑process event bus patterns for Node.js 22+, `AsyncLocalStorage` for correlation ID propagation, and `Promise.allSettled` handler isolation. *Document findings briefly.*
- [ ] EVENT‑001.1 (AGENT): Define Zod event schemas for all Phase 3 domain events.
  **File(s):** `artifacts/api‑server/src/events/event‑types.ts`
  **Verification:** `pnpm typecheck`
- [ ] EVENT‑001.2 (AGENT): Implement `DomainEventBus` with `publish` (async fire‑and‑forget) and `subscribe`.
  **File(s):** `artifacts/api‑server/src/events/domain‑event‑bus.ts`
  **Verification:** `pnpm test -- domain‑event‑bus.test.ts -t "publishes to subscriber"`
- [ ] EVENT‑001.3 (AGENT): Add handler error isolation using `Promise.allSettled`; log failures at `error` level.
  **Verification:** `pnpm test -- domain‑event‑bus.test.ts -t "handler error does not propagate"`
- [ ] EVENT‑001.4 (AGENT): Implement in‑memory `EventStore` with `push`, `getEvents(type?)`, `clearEvents()` for test support.
  **Verification:** `pnpm test -- domain‑event‑bus.test.ts -t "event store replay"`
- [ ] EVENT‑001.5 (AGENT): Add Zod schema validation at publish time; invalid events rejected synchronously.
  **Verification:** `pnpm test -- domain‑event‑bus.test.ts -t "rejects invalid event schema"`
- [ ] EVENT‑001.6 (AGENT): Write comprehensive unit tests; target ≥90% coverage.
  **File(s):** `artifacts/api‑server/__tests__/events/domain‑event‑bus.test.ts`
  **Verification:** `pnpm test -- domain‑event‑bus.test.ts --coverage` ≥90%
- [ ] EVENT‑001.7 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] EVENT‑SUBSCRIBE‑001: Notification Creation Subscriber
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** No subscriber exists to create in‑app notifications from domain events. `API‑NOTIF‑001` needs this to function.
**Size:** Small

**Description:** Implement a subscriber that listens for all business‑relevant domain events (lead assigned, invoice paid, task due, etc.) and calls `NotificationService.create()` to persist an in‑app notification for the affected user(s). The subscriber must be non‑blocking and never fail the source event.

**Depends on:** `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/NOTIFICATIONS.md → API‑NOTIF‑001`
**Blocks:** Real‑time notification delivery
**Related Files:** `artifacts/api‑server/src/events/subscribers/notification‑subscriber.ts`

**Definition of Done**
- [ ] Subscriber registered for all notification‑worthy event types: `LeadAssigned`, `InvoicePaid`, `TaskDue`, `AppointmentBooked`, `DocumentShared`, etc.
- [ ] Each event maps to a notification type, title template, and recipient resolution logic
- [ ] `NotificationService.create()` is called with the resolved data
- [ ] Errors are caught, logged, and never re‑thrown
- [ ] Unit tests verify that a published event results in a `NotificationService.create()` call
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- notification‑subscriber.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The subscriber is an adapter that translates domain events into user‑facing notifications.
- TDD: Write unit test with a mock NotificationService and event bus.

---

### Subtasks
- [ ] EVENT‑SUBSCRIBE‑001.1 (AGENT): Define the mapping of domain events to notification types. **File(s):** `artifacts/api‑server/src/events/event‑notification‑mapping.ts`
- [ ] EVENT‑SUBSCRIBE‑001.2 (AGENT): Implement the subscriber. **File(s):** `artifacts/api‑server/src/events/subscribers/notification‑subscriber.ts` **Verification:** Unit tests pass.
- [ ] EVENT‑SUBSCRIBE‑001.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] EVENT‑SUBSCRIBE‑002: Audit Log Writer Subscriber
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🔴 Critical
**Current State:** Domain events are not automatically persisted to the audit log. `DB‑SETTINGS‑002` exists but has no writer.
**Size:** Small

**Description:** Implement a subscriber that listens for **all** domain events and writes a structured entry to the `audit_logs` table. This provides a durable, append‑only compliance trail.

**Depends on:** `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/SETTINGS‑AUDIT.md → DB‑SETTINGS‑002`
**Blocks:** Compliance and audit reporting
**Related Files:** `artifacts/api‑server/src/events/subscribers/audit‑log‑subscriber.ts`

**Definition of Done**
- [ ] Subscriber registered for **all** domain events via a wildcard or catch‑all subscription
- [ ] Each event is transformed into an `audit_logs` row: `{ organization_id, action, context, entity_type, entity_id, changes, performed_by, performed_at }`
- [ ] Insert is fire‑and‑forget; failures are logged but never block
- [ ] Unit tests verify that an event results in an audit log entry
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- audit‑log‑subscriber.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Audit log is a cross‑cutting infrastructure concern; the subscriber is the adapter.

---

### Subtasks
- [ ] EVENT‑SUBSCRIBE‑002.1 (AGENT): Implement the subscriber. **File(s):** `artifacts/api‑server/src/events/subscribers/audit‑log‑subscriber.ts` **Verification:** Unit tests pass.
- [ ] EVENT‑SUBSCRIBE‑002.2 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] EVENT‑SUBSCRIBE‑003: Email Notification Subscriber
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No automated email dispatch from domain events. Business events like “invoice paid” or “appointment confirmed” should trigger emails.
**Size:** Small

**Description:** Implement a subscriber that listens for specific business events (e.g., `AppointmentConfirmed`, `InvoicePaid`, `DocumentShared`) and dispatches transactional emails via `EmailServicePort.sendTemplate()`.

**Depends on:** `infrastructure/EVENT‑BUS.md → EVENT‑001`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`, `EMAIL‑TEMPLATES‑001`
**Blocks:** Automated email workflows
**Related Files:** `artifacts/api‑server/src/events/subscribers/email‑subscriber.ts`

**Definition of Done**
- [ ] Subscriber registered for specific email‑triggering events
- [ ] For each event, resolves the correct template ID and recipient(s)
- [ ] Calls `EmailServicePort.sendTemplate()`; handles failures gracefully (retries via BullMQ are handled separately)
- [ ] Unit tests with a mock email service verify correct template selection and sending
- [ ] `pnpm typecheck` passes

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- email‑subscriber.test.ts
pnpm typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Adapter translating domain events into external email delivery.

---

### Subtasks
- [ ] EVENT‑SUBSCRIBE‑003.1 (AGENT): Define event‑to‑template mapping. **File(s):** `artifacts/api‑server/src/events/event‑email‑mapping.ts`
- [ ] EVENT‑SUBSCRIBE‑003.2 (AGENT): Implement the subscriber. **File(s):** `artifacts/api‑server/src/events/subscribers/email‑subscriber.ts` **Verification:** Unit tests pass.
- [ ] EVENT‑SUBSCRIBE‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---