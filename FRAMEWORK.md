# The Framework — Complete Context Drop v2.0
*Agent-Ready Reference | Updated: May 2026 | Load this document cold to understand the full methodology*

---

## Document Purpose
This is the **framework-level intelligence brief** for non-developers practicing agentic development. It contains the architectural philosophy, patterns, rules, and hard-won lessons that govern how **any** codebase built under this framework is structured, planned, and executed. It is project-agnostic; project-specific details live in the project’s TODO, ADR, and glossary files.

**New in v2.0:** Integrated modern 2025‑2026 research on deep modules, DDD nuance, production-grade DB/auth patterns, TDD/BDD disciplines, and AI-assisted development. Revision annotations `[v2]` mark substantial updates.

---

## The Four-Pillar Framework
Every task is annotated against these four interconnected methodologies.

### 1. Domain-Driven Design (DDD)
Strategic & tactical backbone. Ensures code speaks the business language and is organized around business meaning.

**Strategic DDD (planning time):**
- **Ubiquitous Language** — Shared glossary of exact business terms. Used in code, docs, tests, conversation. No synonyms, no DB-centric names. If the business says "Submission," the table is `submissions`, class `Submission`, route `/submissions`. **Why?** Language drift causes misaligned models, accidental coupling (e.g., reusing a similar-sounding but different concept), and broken communication between domain experts and builders. [v2]
- **Bounded Contexts** — Hard architectural boundaries partitioning the domain. Each context owns its model, its data, its API. No context reaches directly into another’s DB. Cross-context communication via ports/ACL or domain events.
- **Context Map** — A living document of all contexts and their relationships. Patterns (from DDD Crew):
  | Pattern | Summary | When to use |
  |---|---|---|
  | Shared Kernel | Two contexts share a small, explicitly bounded subset of model/code; coordinate changes closely. | Only when teams can commit to joint governance; keep kernel minimal. |
  | Customer–Supplier | Upstream delivers what downstream demands; downstream can influence upstream backlog. | Internal teams where downstream priorities matter. |
  | Conformist | Downstream conforms to upstream’s model with little influence. | Third-party API, legacy system you can’t change, or when ACL is overkill. |
  | Anti-Corruption Layer (ACL) | Downstream translates upstream’s model through a protective layer to keep its own domain clean. | Core domain threatened by poor upstream model, semantic drift, or Big Ball of Mud. |
  | Open Host Service (OHS) | Upstream exposes a stable, well-documented protocol as the primary way to consume its capabilities. | Widely reused capabilities; avoid per-client bespoke integrations. |
  | Published Language | A shared language/schema used across contexts, often combined with OHS (e.g., iCalendar, ISO 20022). | When many consumers must agree on a common message format. |
  | Separate Ways | Contexts deliberately do not integrate because coordination cost exceeds benefit. | Independent capabilities; no value in coupling. |
  | Big Ball of Mud | A tangled, inconsistent model; an anti-pattern to be isolated, not reused directly. | Legacy systems; surround with ACL, plan modernization. |
  Document also which side is upstream/downstream; reflect organizational reality.

- **Anti‑Corruption Layer (ACL):**
  - Design elements: Facades (downstream-friendly interfaces), Translators/Mappers (convert upstream DTOs to domain objects), Adapters (handle transport, retries). [v2]
  - **Required** when: (1) upstream is Big Ball of Mud/poor model, (2) downstream is core domain, (3) upstream concepts conflict with your ubiquitous language.
  - **Optional** when: upstream model is simple, stable, and close to downstream; or integration is non-core and conformist is acceptable.
  - **Consequences of omission:** Model corruption, tight coupling to upstream changes, propagated Big Ball of Mud.

**Tactical DDD (implementation time):**
- **Aggregates** — Cluster of entities/value objects treated as a unit for data changes. Aggregate root controls all mutations. Keep aggregates small — only entities that must be strongly consistent. Reference other aggregates by ID. One transaction modifies one aggregate; cross-aggregate consistency via domain events (eventual). [v2] Use **optimistic locking** (`version` column) to handle concurrent modifications to the same aggregate. (See Database Patterns.)
- **Value Objects** — Immutable, identified by attributes (e.g., `Money`, `EmailAddress`). No ID column. Validated on construction. Equality by value. Encapsulate domain logic (e.g., `Money.add()` that enforces currency). [v2]
- **Domain Services** — Stateless operations not naturally belonging to a single aggregate (e.g., `PricingService`, `CreditAssessmentService`). Defined in domain terms. Different from Application Services (orchestration) and Infrastructure Services (technical concerns). [v2]
- **Repository Pattern** — Per aggregate root, abstracting persistence. Exposes domain-oriented methods like `findOpenOrdersForCustomer(…)`, never raw SQL/filters. Application layer never imports ORM entities. [v2]
- **Domain Events** — Past-tense facts (`OrderPlaced`, `PaymentFailed`). Raised by aggregates. Distinguish between **domain events** (internal) and **integration events** (cross-context contracts). Integration events use published language, always async. [v2]

### 2. Test-Driven Development (TDD)
Development discipline, not just testing. Red-Green-Refactor cycle forces API design before implementation.

**Red-Green-Refactor cycle:**
- **Red** — Write a failing test expressing desired behavior. Must fail for the expected reason. No implementation exists yet.
- **Green** — Minimal code to pass. No speculative generalization.
- **Refactor** — Improve structure, remove duplication, enhance readability while tests stay green. Not optional.

**Test taxonomy (stack agnostic):**
| Type | Scope | Speed | Isolation | Purpose |
|------|-------|-------|-----------|---------|
| Unit | Single function/class in isolation | ms | High (deps mocked) | Validate logic, edge cases; bulk of suite (~70‑80%) |
| Integration | Multiple components (service+real test DB) | seconds | Medium (real boundaries) | Verify component composition and contract compliance |
| Contract (CDC) | Consumer–provider boundary (e.g., HTTP API, message) | seconds | Medium | Ensure provider meets consumer expectations; reduces need for many E2E tests [v2]|
| End-to-End (E2E) | Full critical user journey (browser/API) | seconds to minutes | Low (full stack) | Validate real‑world journeys; 5‑10% of suite |
| Smoke | Subset of E2E or integration (critical paths) | seconds | Low to medium | Quick sanity check after deploy |

**Test doubles (precise definitions):**
- **Dummy:** passed but never used.
- **Stub:** returns canned responses, no interaction assertions.
- **Mock:** pre‑programmed expectations on calls (args, count), asserted against.
- **Spy:** records calls, may wrap real implementation; later assertion on usage.
- **Fake:** working simplified implementation (in‑memory repository).

**TDD schools and the hybrid approach:**
- **Chicago (Inside‑Out, Classicist):** Start from domain core; state‑based tests; few mocks. Builds rich domain models but risks YAGNI.
- **London (Outside‑In, Mockist):** Start from external boundary; interaction tests; heavy mocks. Aligns with user journeys but can couple tests to internal design.
- **The Framework stance:** Use a **hybrid**. Outside‑in to drive API contracts and integration boundaries (use generated schema/mocks). Inside‑out for deep domain logic (use real objects or fakes). [v2]

**TDD sequencing rule:** Write the API contract (OpenAPI) first, then write integration‑level red tests to define the contract behavior before implementing route handlers and services. Unit tests come before service internals.

### 3. Behavior-Driven Development (BDD)
Bridges business intent and code through plain‑language scenarios (Gherkin). BDD operates at two levels: **specification** (Phase 0, before code) and **automation** (Phase 5, executable scenarios).

**Core rules (extended):**
- **Ubiquitous language in `.feature` files.** No technical jargon. Every term must exist in the glossary. [v2]
- **Mandatory positive AND negative scenarios.** A feature file with only happy path is incomplete. Negative scenarios directly map to domain errors (traceability: scenario → error name → error class → test → service guard). [v2]
- **One scenario, one behavior.** Split multi‑behavior scenarios. Each tests exactly one business rule.
- **Declarative, not imperative.** Scenarios describe *what* the user wants and *what* outcomes are expected, not *how* the UI interacts (e.g., "Given a registered customer, When they place an order, Then the order is confirmed" — not "click #submit"). [v2]
- **Specification time vs. automation time:** First collaboratively write scenarios with domain experts (analysis), then automate. Keep them as living docs.

- **Gherkin structures:**
  - `Feature` / `Scenario` (or `Example`) / `Background` (common `Given` setup), `Scenario Outline` with `Examples` table, `Tags` (`@smoke`, `@billing`), `Doc Strings` (multiline text).
  - `Given` = preconditions in domain language; `When` = action; `Then` = observable outcome; `And` / `But` for additional steps at same level.

### 4. Deep Module Design
From Ousterhout: a module is **deep** when it has a simple interface but complex implementation — hiding most complexity behind a minimal surface.

**Deep vs. shallow:**
- **Shallow (anti‑pattern):** interface nearly as complex as implementation; pass‑through methods/classes add indirection without adding value.
- **Deep (correct):** small set of well‑named methods internally orchestrating complex logic. Caller knows nothing of internals.

**New sub‑principles [v2]:**
- **Complexity hiding:** Each module encapsulates specific design decisions; interface avoids leaking internal data structures, file formats, or algorithms.
- **Temporal decomposition (root cause of shallow modules):** Splitting modules by time sequence of steps instead of by cohesive knowledge (e.g., separate “create dataset” and “test dataset” modules that both duplicate dataset construction). ➔ Violation of information hiding. **Remedy:** Identify design decisions and encapsulate them in a single module.
- **Pass‑through methods/classes:** Red flag. Methods that mostly forward arguments with similar signature. **Eliminate by:** collapsing layers, moving logic into caller or callee, or redesigning interfaces to be higher‑level (e.g., `placeOrder()` instead of thin wrappers over `createOrder()`, `reserveInventory()`, `chargePayment()`). [v2]

**Tactical layer depth mapping (The Framework):**
| Layer | Depth | Rationale |
|---|---|---|
| Route handlers / Controllers | Shallow | Translate HTTP → DTO, validate, delegate; no business logic. |
| Application Services (use case orchestrators) | Deep | Coordinate domain services, repositories, transactions; expose simple methods like `registerUser()`. |
| Domain Services | Deep | Core business rules (e.g., `PricingService`); stateless, domain vocabulary. |
| Repositories | Deep | Abstract persistence; hide queries, schemas, connection details behind domain method names. |
| Auth middleware | Shallow interface, deep internal | Simple hook (`authenticate(req)`) hiding token verification, session management, etc. |
| Global error handler | Deep | Translates all domain/external errors into consistent HTTP responses; the only place `statusCode` is mapped. |
| DTO / type definitions | Shallow | Data shapes, no logic. |

---

## The Phase Structure (unchanged in sequence, enriched in content)
```
Phase 0  — Domain Foundation & Tooling
Phase 1  — Identity & Access
Phase 1.5 — Cross-Cutting Concerns
Phase 2  — Database Schema (All Bounded Contexts)
Phase 3  — API Business Logic (Per Context)
Phase 4  — Frontend Data Integration
Phase 4.5 — New Bounded Contexts Discovered Late (named sub-phase)
Phase 5  — E2E Tests, Contract Tests, Frontend Interactivity
Phase 6  — Production Readiness & DevOps
```
*Lesson:* New bounded contexts get their own named sub‑phase, not silently appended to existing phases.

---

## Architecture Decision Records (ADRs)
Every irreversible or high‑impact architectural decision must be an ADR **before** implementation. Lives in `docs/adr/`. Once implemented, ADR is immutable; if reversed, a new superseding ADR is written.

**ADR template (MADR‑style):**
```
# ADR-NNN: Title
Status: Proposed | Accepted | Rejected | Deprecated | Superseded by [ADR-XXX]
Context: Problem statement and forces.
Decision: Precisely stated choice.
Rationale: Why this option over alternatives.
Consequences: What becomes easier/harder, constraints.
```
*Add optional:* Considered Options, Pros/Cons, Confirmation (how to verify compliance).

**Decisions that require an ADR:**
- Multi‑tenancy strategy, migration tooling, authentication strategy (internal/external), error handling pattern (throw vs. Either/Result), external integrations, any choice that would require modifying every table/service/test if reversed, monorepo structure.

**Heuristic for NOT needing an ADR:** highly local, easily reversible decisions (minor class names, small refactorings, stylistic conventions). [v2]

**ADR lifecycle:** Proposed → Accepted (or Rejected) → (later) Superseded. When superseding, update old ADR’s status to “Superseded by ADR‑NNN”. Cross‑link. ADR index file maintained.

---

## Multi-Tenancy — Shared-Schema Pattern
**Decision:** Shared‑schema multi‑tenancy with a `tenant_id` (UUID) column on every business table. (Alternative patterns: schema-per-tenant, DB-per-tenant — rejected for V1.)

**Rules:**
- Every business table (not global lookup) has non‑null FK to `organizations` (or equivalent anchor). Index on `(tenant_id)` mandatory.
- `BaseRepository<T>` auto‑injects `WHERE tenant_id = :tenant` into all queries; services never manually filter. (Layer 1 defense)
- PostgreSQL Row‑Level Security (RLS) as Layer 2 defense. Enables policies that enforce tenant isolation even if app‑layer filter is missed:
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY; ALTER TABLE ... FORCE ROW LEVEL SECURITY;`
  - Policy: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`
  - App sets `SET LOCAL app.tenant_id = '...'` at start of each transaction (local for connection pool safety).
  - **Limitations:** Superusers, roles with `BYPASSRLS` are not restricted; `row_security = off` bypasses. Grant minimal privileges. [v2]
- RLS is **mandatory for regulated data**; application‑layer filtering alone is insufficient (bugs, SQL injection, analytics tools could leak data). [v2]

**Tenant onboarding:** Shared‑schema: insert row in tenants table, optionally seed per‑tenant records. Always idempotent and auditable.

**Global (cross‑tenant) reference tables:** Store without `tenant_id`, separate from tenant‑scoped data. Use documented guidelines.

---

## Domain Error Hierarchy & Either/Result Pattern
**Decision:** Services return `Result<SuccessType, DomainError>` (using `neverthrow`). They never throw domain errors.

**Base DomainError class:**
```typescript
abstract class DomainError extends Error {
  abstract readonly code: string;       // UPPER_SNAKE_CASE, e.g., 'INVALID_STAGE_TRANSITION'
  abstract readonly statusCode: number; // HTTP status this maps to at the boundary
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

**Error catalog:** One per bounded context (e.g., `identity.errors.ts`). Codes machine‑readable, names PascalCase using ubiquitous language.

**Why Result:**
- Thrown errors invisible in signatures; `Result<T, DomainError>` makes error contract part of the function type, enabling exhaustive handling.
- Global error handler middleware is the **only translation point** between `DomainError` and HTTP responses. It reads `err.statusCode` and produces a consistent JSON envelope. No route handler sets an HTTP status code.

**Traceability chain (BDD → error):** Write negative BDD scenario → identify domain error name → add to error catalog → implement error class → unit test assertion → service guard returns it. [v2]

---

## Authentication Architecture

### Internal Users (Staff / Admin)
- JWT‑based: short‑lived **access tokens** (15 min), longer‑lived **refresh tokens** (7‑30 days, depending on sensitivity). Refresh token rotation mandatory; reuse of a rotated token invalidates entire token family (stateful tracking required). [v2]
- Password hashing: **Argon2id** (preferred for new systems; parameters: ≥64 MiB memory, iterations ≥3). Bcrypt acceptable for legacy with cost ≥10. Per‑password salts mandatory. [v2]
- JWT secrets in env vars (`JWT_SECRET`); never hardcoded.
- Auth middleware validates access token, sets `req.user`; protected routes always through this middleware.

### External Users (Portal / Client)
- **Magic link authentication:** No passwords. Token is cryptographically random (256‑bit), stored **hashed** in a `magic_links` table. Single use, short expiry (15 min). After verification, a **portal JWT** is issued. Server‑side tracking via `portal_sessions` with `expires_at` for revocation. [v2]
- Portal JWT secret (`PORTAL_JWT_SECRET`) **completely separate** from internal `JWT_SECRET`. Separate middleware, separate auth context on frontend.
- **Why magic links:** eliminate password reset, weak passwords, onboarding friction. Brute force infeasible due to token entropy and short TTL. [v2]

### Session Model: Hybrid Stateful JWT (clarification) [v2]
- Framework uses short‑lived JWTs with server‑side token family tracking to enable instant revocation and reuse detection. This is **not a pure stateless JWT session**; it requires a token store. OWASP discourages pure stateless sessions for sensitive applications because revocation is hard. Our approach is a **hybrid**: signed JWT for distributed scale, but backed by server‑side state for security. Refresh token rotation and family tracking achieve effective session management.

### Separation Non‑Negotiable
Internal and external auth realms must remain completely separate (secrets, middleware, session stores, front‑end contexts). Sharing any primitive creates a privilege escalation vector. Architecturally enforced.

---

## API Design Patterns
- **API‑Contract‑First (OpenAPI):** Write the OpenAPI spec before code. Codegen produces typed client hooks (React Query, etc.) and validation schemas (Zod). Contract is source of truth; changing spec forces re‑generation and type errors across stack.
- **Route Handlers Are Shallow:** Thin adapters: validate request body via generated schema, call exactly one service method, return result or pass error to global handler. Zero business logic.
- **Code Generation Quirks (Orval & drizzle-zod):** [v2]
  - `drizzle-zod` is deprecated as of Drizzle ORM v1.0.0-beta.15+. Use Drizzle's built‑in schema generation to produce Zod schemas. Verify compatibility with Zod v4 (released July 2025). The built‑in approach is the recommended path.
  - Orval may generate a `_type` discriminator in Zod schemas; post‑codegen patch step required to remove/ignore. Document this in codegen tasks.

---

## Database Patterns

### Soft Delete
- `deleted_at TIMESTAMPTZ` nullable column. Hard deletes never on business data. Repositories automatically filter `WHERE deleted_at IS NULL`. Restore possible. Audit trail preserved.
- **Exception:** Append‑only log tables (audit logs, event store) are immutable — no `deleted_at`. [v2]
- **Performance:** Consider partial index `WHERE deleted_at IS NULL` for frequently queried tables. Schedule periodic purges of old deleted rows for privacy/compliance where needed. [v2]

### JSONB Strategy
- Suitable for: flexible per‑entity config, event payloads, integration metadata with unstable shapes. Not a substitute for relational modeling of known queryable fields.
- **GIN index required.** Choose operator class based on query patterns:
  - `jsonb_ops` (default): supports many operators (`?`, `?|`, `@>`), indexes each key separately, larger index.
  - `jsonb_path_ops`: optimized for `@>` containment queries, smaller and faster for those queries, but does not support all operators.
  - **Guideline:** use `jsonb_path_ops` if your primary JSONB query pattern is `data @> '{"field":"value"}'`; otherwise default. [v2]
- If a JSONB key becomes a common filter predicate, **promote it to a dedicated column** with appropriate index; document future work trigger.

### Computed / Materialized Columns
- Application‑managed materialized columns (e.g., `progress_percent`, `total_amount`) updated in same DB transaction as the triggering change by the service layer. **Owner:** the service method making the triggering change.
- **Avoid:** PostgreSQL `GENERATED` columns (limited ORM support, e.g., Drizzle) and triggers (hidden side effects, hard to test). [v2]

### Idempotency Keys
- Any non‑idempotent write (financial txns, notifications, external API calls) must include an `idempotency_key` with UNIQUE constraint.
- **Preferred pattern [v2]:** use a separate `idempotency_records` table (`key UUID PK`, `response JSONB`, `created_at`). Service checks existence before executing operation; if found, returns stored response. This avoids bloating main business tables. Client generates key (e.g., UUID v4) and sends in header `Idempotency-Key`.

### Optimistic Locking [v2]
- For aggregates that can experience concurrent updates, add an integer `version` column. On read, client gets version; on update, use `WHERE id = :id AND version = :expectedVersion`, and increment `version`.
- If `UPDATE` affects 0 rows, conflict detected; service returns a `ConcurrentModificationError` (domain error). Client can re‑fetch and retry. This aligns with "one transaction per aggregate" and prevents lost updates without long‑held locks.

### Migration Strategy
- **Development (Phase 0–5):** `drizzle-kit push` acceptable. No production data.
- **Production (Phase 6+):** Switch to `drizzle-kit generate` + `drizzle-kit migrate`. Creates versioned SQL migration files. Auditable, CI‑validated.
- **Rollback:** Never roll back. Forward‑only compensating migrations. Strategy in `docs/adr/002-migration-strategy.md`.
- **Zero‑Downtime Migrations (Expand/Contract) [v2]:** For production, follow the Expand/Contract pattern to avoid locking:
  1. *Expand:* Add new columns/tables in a backward‑compatible way (nullable, no constraints). Deploy app that writes to both old and new.
  2. *Backfill:* Migrate existing data to new structures in background.
  3. *Cutover:* Switch reads to new schema, monitor.
  4. *Contract:* Drop old columns/tables and remove dual‑write logic in a subsequent migration/deploy.
  This ensures zero‑downtime schema changes.

---

## Dependency Management
- **Zod v4 strategy:** Since Zod v4 became default npm package in July 2025, `import { z } from 'zod'` gives you Zod v4. Check Drizzle ORM’s built‑in Zod schema generation compatibility (as of Drizzle v1.x, it supports Zod v4 directly). Always run compatibility tests before upgrading; document in `docs/dependencies.md`. Do not pin preemptively.
- **Dependency Hygiene:** Declare only imports actually used. Remove phantom deps. In monorepos, use a central catalog (`pnpm` catalog or npm workspaces) to pin shared versions; individual `package.json` files reference catalog entries.

---

## Task Structure Standard
Every task follows this template (unchanged):
```markdown
## [ ] TASK-ID: Task Title
**Status:** ⏳ Not Started | 🔄 In Progress | ✅ Done
**Current state:** ...
**Definition of Done:** specific, verifiable criteria.
**Out of Scope:** explicit exclusions.
**Advanced Code Patterns:** repository, Either, deep module, etc.
**Anti-Patterns:** what must NOT be done.
**Rules to Follow:** specific constraints.
**Related Files:** exact file paths.
**Blocks / Blocked By:** dependency chain.

**DDD:** bounded context/aggregate.
**TDD:** test order and assertions.
**BDD:** feature file scenarios implemented.
**Deep Module:** classification.
### Subtasks:
- [ ] TASK-ID.1: (AGENT or HUMAN) – affected file path
```
AGENT vs. HUMAN annotations are mandatory; an agent must not proceed past an unresolved HUMAN checkpoint.

---

## The ARCH Task Pattern (unchanged)
Architectural decisions discovered late get `ARCH-NNN` tasks inserted before dependent work. They contain an ADR creation subtask and a human review subtask, always last.

---

## Planning Rules (Lessons Learned, extended)
1. **Scope before you sequence.** Map all bounded contexts and dependencies before writing any implementation task.
2. **Blocking relationships must be explicit.** The tenancy anchor table must exist first because every business table has a FK to it.
3. **Verify before applying a fix.** Compatibility changes fast. Re‑verify dependency interactions (e.g., Zod + Drizzle) and document verification date.
4. **Separate auth contexts are non‑negotiable.** No shared secrets, middleware, or contexts between internal and external users.
5. **Dev and prod tooling are different.** `drizzle-kit push` vs. `generate+migrate`. Production migration strategy includes zero‑downtime expand/contract.
6. **Error semantics belong in the domain.** Domain errors are tested, appear in negative BDD scenarios, and are never anonymous `Error` throws. They have code, status, message.
7. **Computed columns need a defined owner.** Explicitly document which service method updates them in the same transaction.
8. **Cross‑context reads use adapters (ports), not direct queries.** Even if schemas are technically accessible, you must respect bounded context boundaries. Use an ACL if the other context’s model is different.
9. **Negative BDD scenarios drive domain error creation.** Traceability chain: scenario → error name → error class → unit test → service guard.
10. **HUMAN checkpoints cannot be skipped.** An agent must not build on unverified HUMAN tasks.
11. **One scenario, one behavior.** Split multi‑behavior scenarios.
12. **Aggregate boundaries protect consistency.** Modify one aggregate per transaction; use optimistic locking to prevent lost updates. Cross‑aggregate consistency via domain events and a documented acceptable consistency window.
13. **Avoid temporal decomposition and pass‑through modules.** [v2] When decomposing, ask: what knowledge does this module hide? If the answer is “nothing” or “it just calls another,” collapse it.
14. **BDD scenarios are declarative, not imperative.** [v2] Write in terms of business goals, not UI interaction.
15. **Use consumer‑driven contract tests for service boundaries.** [v2] Pact (or similar) tests reduce over‑reliance on flaky E2E tests and ensure providers meet consumer expectations.

---

## File Naming & Organization Conventions (unchanged)
```
lib/db/src/schema/
  index.ts                  ← re‑exports all schema objects
  [anchor].ts               ← tenancy anchor table (always first)
  [context]/
    [entity].ts             ← one file per table/aggregate
    index.ts                ← re‑exports context tables

lib/domain-errors/src/
  base-error.ts
  [context].errors.ts       ← one error catalog per bounded context

[api-server]/src/
  services/                 ← deep modules, one per bounded context
  routes/                   ← shallow adapters, one per resource
  middlewares/              ← cross‑cutting concerns (auth, validate, error)
  lib/                      ← infrastructure utilities (jwt, crypto, catch-async)

docs/
  glossary.md               ← ubiquitous language, always first document written
  bounded-contexts.md       ← context map and relationship types
  adr/
    NNN-[kebab-title].md    ← one file per architectural decision record
  features/
    [context].feature       ← one feature file per bounded context
  dependencies.md           ← verified compatibility notes with dates
```

---

## Quick Reference: Which Layer Does What (unchanged)
| Concern | Layer | Deep or Shallow |
|---|---|---|
| HTTP request parsing | Route handler | Shallow |
| Input validation | `validate(schema)` middleware | Shallow |
| Business rules / use case orchestration | Service (application & domain) | **Deep** |
| Data access | Repository (extends BaseRepository) | **Deep** |
| DB schema definition | ORM table/entity file | Shallow |
| Error classification & HTTP mapping | Global error handler middleware | **Deep** |
| Token issuance & validation | Auth service | **Deep** |
| Cross‑context reads | Port interface + ACL adapter | Shallow adapter / Deep impl |
| Domain events | Event emitter + subscriber | **Deep** (internal logic) |
| Audit logging | Event subscriber | **Deep** |
| DTO / response shape | Type/interface definition | Shallow |
| Migration execution | Database tooling (not application code) | N/A |

---

*End of The Framework Context Drop v2.0.*
*This document is the framework. Project details live in the TODO and ADRs. Treat this as the architectural constitution for all development activities.*
```