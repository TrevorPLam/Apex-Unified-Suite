## [ ] TASK‑ID: Short Descriptive Title
**Status:** ⏳ Not Started | 🔄 In Progress | ✅ Done  
**Actor:** AGENT | HUMAN | MIXED  
**Priority:** 🔴 Critical | 🟠 High | 🟡 Medium | ⚪ Low  
**Current State:** *(Optional – brief “as‑is” description)*  
**Size:** *(Optional – Small / Medium / Large / “Focused table definition”)*  

**Description** *(1–2 sentences capturing intent and scope; omit if title is self‑explanatory)*  

**Depends on:** [List of TASK‑ID(s) or external constraints]  
**Blocks:** [List of downstream tasks]  
**Related Files:** `path/to/file1.ts`, `path/to/file2.md`, …  

**Imports / Exports** *(Optional – typical in interface/integration tasks)*  
- Imports: [list of imported symbols / interfaces]  
- Exports: [list of exported symbols / modules]  

**Definition of Done** *(checkable, observable criteria)*  
- [ ] Criterion 1  
- [ ] Criterion 2  
…  

**Out of Scope** *(Functional scope boundaries – what is NOT included)*  
- Explicitly …  

**Safety Boundaries** *(Files/operations the agent must NEVER touch, regardless of task)*  
- Never modify: `path/to/legacy/`, `path/to/generated/`, …  
- Never commit: `.env*`, credentials, secrets  

**Output Artifacts** *(Deliverables the task must produce)*  
- Code changes in: `path/to/source`  
- Tests added/updated in: `path/to/tests`  
- Documentation: `path/to/docs` (if applicable)  
- Migration files: `path/to/migrations` (if applicable)  

**Rollback** *(How to safely undo if the change fails)*  
- Granularity: file‑level | function‑level | commit‑level  
- Halt condition: which verification gate stops further changes  

**Rules to Follow** *(Must‑follow technical/domain/business rules)*  
- …  

**Verification** *(Executable commands that prove the task is complete)*  
```bash
pnpm test -- specific-test.test.ts
pnpm typecheck
```

**Advanced Code Patterns** *(when relevant)*  
- …  

**Anti‑Patterns** *(when relevant)*  
- …  

**DDD / TDD / BDD / Deep Module notes** *(optional, per context – add only if relevant)*  
- DDD: …  
- TDD: …  
- BDD: …  
- Deep Module: …  

---

### Subtasks
- [ ] TASK‑ID.0.25 (AGENT): Read the entire task and all related info.  
  *No action – pause until fully understood.*

- [ ] TASK‑ID.0.5 (AGENT): Research latest best practices, patterns, and anti‑patterns (as of May 2026).  
  *Document findings briefly or note “no changes.”*

- [ ] TASK‑ID.0.75 (AGENT): Reason about the task and any ambiguity.  
  *If uncertain, ask the user before executing.*

- [ ] TASK‑ID.1 (AGENT): [Specific action with exact file path(s)]  
  **File(s):** `exact/path/to/file.ts`  
  **Verification:** `pnpm test -- my.test.ts`

- [ ] TASK‑ID.2 (AGENT or HUMAN): [Next action]  
  **File(s):** …  
  **Verification:** …

  … additional subtasks as needed …

- [ ] TASK‑ID.N (HUMAN): Final review and sign‑off.  
  **Verification:** Approved.
```

This template captures every informational aspect observed across all Phase 0–10 task files, plus the three critical additions identified through research: **Safety Boundaries**, **Output Artifacts**, and **Rollback**. It is ready for immediate use in agentic or human‑driven workflows.