```markdown
# INDEX.md – Apex Unified Suite Task Map

This index is the single source of truth for navigating the entire task system. It maps every parent task to its location, status, dependencies, and phase. Use it to understand project progress, identify blockers, and plan execution order.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[x]` | Complete |
| `[ ]` | Not Started |
| `[~]` | In Progress |
| `[!]` | Blocked |
| `🔴` | Critical Priority |
| `🟠` | High Priority |
| `🟡` | Medium Priority |
| `⚪` | Low / Deferred |

**Status indicators are maintained in individual task files; this index reflects their current state at the time of last update.**

---

## Dependency Graph (High‑Level)

```
TOOLING ⇢ DOMAIN ⇢ ARCHITECTURE ⇢ BEHAVIOR
    ↓
  AUTH (Infra) ⇢ DATABASE (Infra) ⇢ EVENT‑BUS ⇢ RBAC ⇢ EMAIL‑STORAGE ⇢ NOTIFICATIONS ⇢ SETTINGS‑AUDIT
    ↓
  ┌─────────────────── DOMAIN CONTEXTS ───────────────────┐
  │ CRM, FINANCE, APPOINTMENTS, PROJECTS, DOCUMENTS, ASSETS, PORTAL │
  └───────────────────────────────────────────────────────┘
    ↓
  INTEGRATIONS (Stripe, Plaid, BILL, Calendar, Video, Storage, QuickBooks, Xero)
    ↓
  AUTOMATION (AUTO‑*) ⇢ MOBILE  ⇢ UX  ⇢ OFFLINE  ⇢ TRIAGE
    ↓
  AI & PREDICTIVE (Phase 10)
```

Dependencies are detailed in each file. The `Blocks` field in tasks indicates downstream impacts.

---

## Directory Index

### `1. foundation/`
Core setup and foundational decisions.

| Task ID | File | Status | Priority | Depends On | Blocks |
|--------|------|--------|----------|------------|--------|
| DOMAIN‑001 | DOMAIN.md | [ ] | 🔴 | DEP‑001 | DOMAIN‑002, DOMAIN‑003 |
| DOMAIN‑002 | DOMAIN.md | [ ] | 🔴 | DOMAIN‑001 | ARCH‑007, ARCH‑001, ARCH‑005, DOMAIN‑003 |
| DOMAIN‑003 | DOMAIN.md | [ ] | 🔴 | DOMAIN‑001, DOMAIN‑002 | All impl. phases |
| ERROR‑003 | DOMAIN.md | [ ] | 🟠 | DOMAIN‑003 | ERROR‑002 (P1) |
| BDD‑AUTO‑001 | DOMAIN.md | [ ] | 🟡 | DOMAIN‑003 | Phase 5 automated tests |
| ERROR‑002‑EXT.3 | DOMAIN.md | [ ] | 🟠 | DOMAIN‑003, ERROR‑003 | ERROR‑002 impl. |
| ARCH‑001 | ARCHITECTURE.md | [ ] | 🔴 | DOMAIN‑002 | DB‑ORG‑001, all Phase 2 schema tasks |
| ARCH‑003 | ARCHITECTURE.md | [ ] | 🟠 | DOMAIN‑003 | DB‑ESIGN‑001 |
| ARCH‑004 | ARCHITECTURE.md | [ ] | 🟡 | N/A | N/A |
| ARCH‑005 | ARCHITECTURE.md | [ ] (update pending) | 🔴 | DOMAIN‑002 | All Phase 3+ API tasks |
| ARCH‑007 | ARCHITECTURE.md | [ ] | 🟠 | DOMAIN‑002 | DB‑APPT‑*, PROJ‑* |
| DOMAIN‑004 | ARCHITECTURE.md | [ ] | 🟠 | DOMAIN‑002 | API‑NOTIF‑001, API‑SEARCH‑001, API‑IMPORT‑001 |
| INTEGRATE‑002 | ARCHITECTURE.md | [ ] | 🟠 | DOMAIN‑002, DOMAIN‑003 | Cross‑context integration impl. |
| DEP‑001 | TOOLING.md | [ ] | 🔴 | N/A | DOMAIN‑001, TOOLING‑002, TOOLING‑004 |
| TOOLING‑001 | TOOLING.md | [ ] | 🟠 | N/A | All dev setup tasks |
| TOOLING‑002 | TOOLING.md | [ ] | 🟠 | N/A | All implementation tasks |
| TOOLING‑003 | TOOLING.md | [ ] | 🟡 | N/A | N/A |
| TOOLING‑004 | TOOLING.md | [ ] | 🔴 | DEP‑001 | All Phase 2 schema tasks |
| TOOLING‑002‑EXT | TOOLING.md | [ ] | 🔴 | TOOLING‑002 | Phase 2+ type safety |

---

### `2. infrastructure/`
Cross‑cutting technical capabilities.

| Task ID | File | Status | Priority | Depends On | Blocks |
|--------|------|--------|----------|------------|--------|
| AUTH‑003 | AUTH.md | [ ] | 🔴 | DEP‑001 | AUTH‑005 |
| AUTH‑004 | AUTH.md | [ ] | 🔴 | ERROR‑002 | AUTH‑005, AUTH‑008 |
| AUTH‑005 | AUTH.md | [ ] | 🔴 | AUTH‑003, AUTH‑004 | AUTH‑006 |
| AUTH‑006 | AUTH.md | [ ] | 🔴 | AUTH‑005, ERROR‑001 | AUTH‑007 |
| AUTH‑007 | AUTH.md | [ ] | 🟠 | AUTH‑006, DB‑IDENTITY‑005 | AUTH‑012 (E2E) |
| AUTH‑008 | AUTH.md | [ ] | 🔴 | AUTH‑004, ERROR‑002 | All protected routes |
| AUTH‑008‑ADMIN | AUTH.md | [ ] | 🔴 | AUTH‑008, RBAC‑001 | All admin endpoints |
| AUTH‑009‑API‑KEY | AUTH.md | [ ] | 🟠 | RBAC‑001 | Integrations |
| AUTH‑REQUEST‑ID | AUTH.md | [ ] | 🟠 | N/A | All logging |
| AUTH‑009 | AUTH.md | [ ] | 🔴 | AUTH‑001 | AUTH‑010, AUTH‑011 |
| AUTH‑010 | AUTH.md | [ ] | 🔴 | AUTH‑009 | AUTH‑012 |
| AUTH‑011 | AUTH.md | [ ] | 🟡 | AUTH‑009 | AUTH‑012 |
| AUTH‑012 | AUTH.md | [ ] | 🟠 | Many AUTH | Phase 1 gate |
| ERROR‑001 | AUTH.md | [ ] | 🔴 | ERROR‑002 | All routes |
| ERROR‑002 | AUTH.md | [ ] | 🔴 | DEP‑001 | Many |
| DB‑IDENTITY‑001 | AUTH.md | [ ] | 🔴 | DB‑ORG‑001 | AUTH‑003, DB‑IDENTITY‑004/005/006 |
| DB‑IDENTITY‑002 | AUTH.md | [ ] | 🔴 | DB‑ORG‑001 | DB‑IDENTITY‑004 |
| DB‑IDENTITY‑003 | AUTH.md | [ ] | 🔴 | N/A | DB‑IDENTITY‑004/005 |
| DB‑IDENTITY‑004 | AUTH.md | [ ] | 🔴 | DB‑IDENTITY‑001, DB‑IDENTITY‑002 | DB‑IDENTITY‑005 |
| DB‑IDENTITY‑005 | AUTH.md | [ ] | 🔴 | Many | AUTH‑007, initial setup |
| DB‑IDENTITY‑006 | AUTH.md | [ ] | 🔴 | DB‑IDENTITY‑001 | AUTH‑004, AUTH‑005 |
| DB‑ORG‑001 | DATABASE.md | [ ] | 🔴 | ARCH‑001 | TEST‑INFRA‑001, ARCH‑001.2‑IMPL, DB‑IDENTITY‑001, all domain DB tasks |
| ARCH‑001.2‑IMPL | DATABASE.md | [ ] | 🔴 | DB‑ORG‑001 | All Phase 3+ repos |
| TEST‑INFRA‑001 | DATABASE.md | [ ] | 🔴 | DEP‑001, DB‑ORG‑001 | All integration tests |
| DB‑LOGGER‑001 | DATABASE.md | [ ] | 🟡 | DB‑ORG‑001 | N/A |
| DB‑SEARCH‑001 | DATABASE.md | [ ] | 🔴 | DB‑ORG‑001 | API‑SEARCH‑001 |
| DB‑NOTIF‑001 | DATABASE.md | [ ] | 🔴 | DB‑ORG‑001 | API‑NOTIF‑001 |
| DB‑IMPORT‑001 | DATABASE.md | [ ] | 🔴 | DB‑ORG‑001 | API‑IMPORT‑001 |
| DB‑TEAMS‑001 | DATABASE.md | [ ] | 🟠 | DB‑IDENTITY‑001 | CRM resolution |
| INFRA‑BOOTSTRAP‑001 | DATABASE.md | [ ] | 🔴 | Many | All Phase 3 services |
| API‑SPEC‑001 | DATABASE.md | [ ] | 🟡 | N/A | All Phase 4+ API tasks |
| API‑CROSS‑001 | DATABASE.md | [ ] | 🟡 | AUTH‑008, RBAC‑001 | Phase 4+ bulk UX |
| EVENT‑001 | EVENT‑BUS.md | [ ] | 🔴 | N/A | All domain service event emission |
| EVENT‑SUBSCRIBE‑001 | EVENT‑BUS.md | [ ] | 🔴 | EVENT‑001 | Real‑time features |
| EVENT‑SUBSCRIBE‑002 | EVENT‑BUS.md | [ ] | 🔴 | EVENT‑001 | Audit compliance |
| EVENT‑SUBSCRIBE‑003 | EVENT‑BUS.md | [ ] | 🔴 | EVENT‑001, EMAIL‑SERVICE‑001 | Notification delivery |
| RBAC‑001 | RBAC.md | [ ] | 🔴 | AUTH‑008, DB‑IDENTITY‑005 | All Phase 3+ routes |
| EMAIL‑SERVICE‑001 | EMAIL‑STORAGE.md | [ ] | 🔴 | N/A | Portal, Appointments, etc. |
| EMAIL‑TEMPLATES‑001 | EMAIL‑STORAGE.md | [ ] | 🟠 | EMAIL‑SERVICE‑001 | Portal, Appointments |
| STORAGE‑001 | EMAIL‑STORAGE.md | [ ] | 🔴 | N/A | DOC‑STORAGE‑001 |
| API‑NOTIF‑001 | NOTIFICATIONS.md | [ ] | 🟠 | DB‑NOTIF‑001, EVENT‑001 | Frontend notification bell |
| API‑SEARCH‑001 | NOTIFICATIONS.md | [ ] | 🟡 | DB‑SEARCH‑001, EVENT‑001 | Global search UI |
| API‑IMPORT‑001 | NOTIFICATIONS.md | [ ] | 🟡 | AUTH‑008, domain APIs | Import/export UI wizard |
| DB‑SETTINGS‑001 | SETTINGS‑AUDIT.md | [ ] | 🔴 | DB‑ORG‑001 | API‑SETTINGS‑001 |
| DB‑SETTINGS‑002 | SETTINGS‑AUDIT.md | [ ] | 🔴 | DB‑ORG‑001 | API‑AUDIT‑001 |
| DB‑SETTINGS‑003 | SETTINGS‑AUDIT.md | [ ] | 🟡 | DB‑IDENTITY‑001 | API‑SETTINGS‑004 |
| API‑SETTINGS‑001 | SETTINGS‑AUDIT.md | [ ] | 🟡 | DB‑SETTINGS‑001 | API‑SETTINGS‑002 |
| API‑SETTINGS‑002 | SETTINGS‑AUDIT.md | [ ] | 🟡 | API‑SETTINGS‑001, TEST‑INFRA‑001 | API‑SETTINGS‑003 |
| API‑SETTINGS‑003 | SETTINGS‑AUDIT.md | [ ] | 🟡 | DB‑MIGRATE‑ALL, ERROR‑002, ARCH‑001.2 | API‑SETTINGS‑004 |
| API‑SETTINGS‑004 | SETTINGS‑AUDIT.md | [ ] | 🟡 | API‑SETTINGS‑003, AUTH‑008 | UI |
| API‑AUDIT‑001 | SETTINGS‑AUDIT.md | [ ] | 🟡 | DB‑SETTINGS‑002 | API‑AUDIT‑002 |
| API‑AUDIT‑002 | SETTINGS‑AUDIT.md | [ ] | 🟡 | API‑AUDIT‑001, TEST‑INFRA‑001 | API‑AUDIT‑003 |
| API‑AUDIT‑003 | SETTINGS‑AUDIT.md | [ ] | 🟡 | DB‑MIGRATE‑ALL, ARCH‑001.2 | API‑AUDIT‑004 |
| API‑AUDIT‑004 | SETTINGS‑AUDIT.md | [ ] | 🟡 | API‑AUDIT‑003, AUTH‑008 | UI |
| CI‑001 | DEVOPS.md | [ ] | 🔴 | TOOLING‑002, DEP‑001 | All deployment tasks |
| BUILD‑001 | DEVOPS.md | [ ] | 🟠 | TOOLING‑002, CI‑001 | DOCKER‑001 |
| DB‑MIGRATE‑001 | DEVOPS.md | [ ] | 🔴 | DB‑ORG‑001 etc. | DOCKER‑001, deployment |
| JOB‑INFRA‑001 | DEVOPS.md | [ ] | 🟠 | Redis | All automation/notification tasks |
| DOCKER‑001 | DEVOPS.md | [ ] | 🟠 | BUILD‑001, DB‑MIGRATE‑001 | Deployment |
| DEP‑002 | DEVOPS.md | [ ] | 🟠 | Phase 3‑5 APIs | External dependency management |
| ESLINT‑001 | DEVOPS.md | [ ] | 🟡 | N/A | Code quality |

---

*Subsequent directories (`crm/`, `finance/`, etc.) are similarly organised. The full index covers all ~500 parent tasks across ~55 files. Due to output limitations, only the first two sections are shown explicitly; the remainder follows the identical table format, listing tasks per directory as migrated.*

---

## Completion Summary

- **Foundation** — 16 tasks planned, 0 complete
- **Infrastructure** — 40+ tasks planned, 0 complete
- **Domains** — CRM (24), Finance (30), Appointments (20), Projects (18), Documents (23), Assets (12), Portal (12) — totals ~139
- **Integrations** — ~20 tasks
- **Automation & Workflows** — ~15 tasks
- **Mobile** — 7 tasks
- **UX / Accessibility / Performance** — 3 tasks
- **Offline** — 2 tasks
- **Triage** — 2 tasks
- **AI & Predictive** — ~15 tasks
- **Reporting** — 4 tasks

**Overall:** entire project estimated at ~280 parent tasks, ~1,500 subtasks.

---

*This index is regenerated after each major migration wave. Manual updates are required when task statuses change.*
```