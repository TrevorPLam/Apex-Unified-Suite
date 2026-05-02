---
description: Work through a single TODO.md task following the structured 10-step sequence with production-quality changes, ending with a GitHub push
---

# Process TODO Task Workflow

This workflow guides you through completing **a single task** from `TODO.md` following the structured sequence defined in `prompt.md`. This workflow processes one task only, then pushes changes to GitHub. It does NOT automatically continue to the next task.

## Prerequisites

- Read `prompt.md` in full before using this workflow
- Read `TODO.md` to understand the task list
- Read `AGENTS.md` for project-specific guidance
- Repository must be in clean state (no uncommitted changes)

---

## Step 1: Read TODO.md in Full

Read the complete `TODO.md` file to understand all tasks and identify the **first task with status `pending`**.

### Action

Read TODO.md to identify first pending task.

### Output Required

From the selected parent task, extract and report:

- Task ID and title
- Priority / Urgency
- Task description
- **Research / Investigation** section content (if any)
- **Definition of Done**
- **Acceptance Criteria**
- **Related Files**
- **Dependencies**
- **Strict Rules**
- **Existing Code Patterns**
- **Anti-Patterns**
- **Testing Requirements**
- **Validation Steps**

---

## Step 2: Initial Codebase Analysis (READ-ONLY)

Before thinking about solutions, understand the current state. **DO NOT create, edit, or modify any files yet.**

### Targeted Analysis

Read all files explicitly mentioned in the task's **Related Files** section.

### Relational Analysis

Identify and read any files that are **directly imported by** or have a **direct dependency on** the targeted files. Understand the side effects of potential changes.

### Check Research / Investigation Field

If the task's **Research / Investigation** section contains specific questions or investigation items, **note them now**—they will be addressed in Step 3.

### Note Existing Patterns

Document the current implementation, relevant patterns, and any immediate constraints you observe.

### Output Required

- Current implementation summary
- Relevant patterns observed (compare with **Existing Code Patterns** from task)
- Immediate constraints
- Dependency relationships
- Potential side effects of changes
- **Outstanding investigation items from the task (if any)**

---

## Step 3: Targeted Online Research (Current as of 04/2026)

Inform your understanding with external best practices. This step **explicitly addresses** any investigation items identified in Step 2.

### Task-Specific Research

Conduct up-to-date research specifically on the topics and technologies involved in the task. **If the task's `Research / Investigation` field contained specific prompts, answer them now.**

### Focus Areas

Your research should cover:

- Best practices and modern patterns
- Enterprise solutions and architectural standards
- Advanced coding patterns relevant to the task
- Anti-patterns to avoid
- Security, accessibility, SEO, and performance implications

### Prioritize Official Sources

- Official documentation
- Changelogs
- Gold-standard reference implementations
- Secondary articles or tutorials (only if official sources are insufficient)

### Output Required

- Research findings with sources
- **Answers to any investigation items from the task**
- Best practices identified
- Anti-patterns to avoid
- Security/accessibility/performance implications
- Conflicts with existing codebase

---

## Step 4: Reassessment & Planning (STILL READ-ONLY)

Combine internal and external research to form a plan. **DO NOT create, edit, or modify any files yet.**

### Synthesize

Re-evaluate the targeted files and related files in light of your research. Would the original approach be improved by the new knowledge?

### Incorporate Strict Rules & Patterns

Explicitly verify that your planned approach complies with:

- The task's **Strict Rules**
- The task's **Existing Code Patterns** (unless you can justify a deliberate departure)
- The task's **Anti-Patterns** (ensuring you avoid them)

### Identify Conflicts

Note any discrepancies between the existing codebase and the best practices you've just researched.

### Formulate a Plan

Determine the exact, step-by-step changes you will make.

### Output Required

- Revised approach based on research
- **Compliance check with Strict Rules / Patterns**
- Conflicts identified
- Step-by-step implementation plan
- Rationale for each step

---

## Step 5: Determine Scope

Based on your plan, classify the change.

### Local / Safe Change

A focused fix or implementation within the existing architecture.

- Examples: creating a single component, updating a CSS variable, adding a new data file
- **Action**: Proceed immediately to implement

### Significant Change

Alters architecture, package boundaries, shared contracts, routing strategy, build tooling, deployment, authentication, or requires broad, cross-repo refactors.

- **Action**: STOP. DO NOT IMPLEMENT. Present findings and plan for approval.

### Output Required

- Scope classification (Local/Safe or Significant)
- Justification for classification

---

## Step 6: Execution Phase

### If Local / Safe Change

Proceed immediately to implement the changes according to the plan formulated in Step 4.

### If Significant Change

STOP. DO NOT IMPLEMENT. Present your findings and plan for approval.

### Approval Presentation Format (for Significant Changes)

Your explanation must include:

#### Issue

What is the core problem?

#### Proposed Solution

What do you plan to change, and how?

#### Rationale

Why is this the best approach, citing your research from Step 3?

#### Affected Areas

Which files, packages, or systems will likely be touched?

#### Risks & Tradeoffs

What could go wrong, and what are the downsides of this approach?

#### Validation Strategy

How will you verify the change is correct and safe?

**Wait for explicit approval before creating or modifying any files.**

---

## Step 7: Implementation (After Approval if Significant)

Follow the plan from Step 4.

### Change Standards

- Prefer the smallest high-quality change that fully solves the task
- Do **not** make speculative rewrites
- Do **not** introduce new dependencies unless clearly justified
- Preserve existing conventions unless they are part of the problem
- Keep the code production-grade, readable, and maintainable
- Consider edge cases, error handling, accessibility, responsiveness, performance, SEO, and security
- **Adhere strictly to the task's `Strict Rules` and `Existing Code Patterns`**
- **Actively avoid the task's listed `Anti-Patterns`**

### Scope Control

- Work on one task at a time
- Do **not** silently expand scope
- If you notice related low-risk problems, either fix them only if clearly part of the same task, or **add them to `TODO.md` as follow-up items**

---

## Step 8: Validation

Before marking a task complete, **perform the exact validation steps listed in the task's `Validation Steps` field**, and then run any automated checks.

### 1. Task-Specific Validation (Mandatory)

- Execute each bullet point in the task's **Validation Steps** section.
- Document the result of each step.

### 2. Automated Checks (If Applicable)

Run the most relevant checks for the changed area:

- Tests: `npm test` or specific test suite
- Lint: `npm run lint`
- Typecheck: `npm run check`
- Build: `npm run build`
- Framework-specific validation

### 3. Testing Requirements Verification

- Verify that any tests required by the task's **Testing Requirements** section exist and pass.
- If the task required new tests, confirm they have been written and are passing.

### Fix Issues

Fix any issues introduced by your changes **before** marking the task complete.

### Document Limitations

If full validation is not possible, state exactly what you could and could not verify. **This information belongs in the completion note (Step 9).**

---

## Step 9: Update TODO.md

Only mark a task complete in `TODO.md` after:

1. The implementation is finished
2. **ALL `Validation Steps` have been performed successfully**
3. **`Testing Requirements` have been met**
4. Any limitations are explicitly documented

### Update Actions

- Update `TODO.md` if the current description is wrong or incomplete
- **Change the task's status from `pending` to `completed`**
- **Optionally, add a completion note** that includes:
  - What was changed
  - Key files touched
  - Validation performed (referencing `Validation Steps`)
  - Follow-up tasks discovered, if any
  - **Any limitations encountered during validation**

---

## Step 10: Update Documentation

After completing the task and updating TODO.md, review and update relevant documentation if the changes warrant it.

### Documentation to Review

- **README.md**: Update if the task changes project structure, setup instructions, or key features
- **AGENTS.md**: Update if the task introduces new patterns, changes technology stack, or modifies architectural guidelines
- **Other documentation**: Update any other relevant docs (e.g., component docs, API docs, migration guides)

### When to Update Documentation

Update documentation when:

- New features or capabilities were added
- Architectural patterns changed
- Dependencies or tooling were modified
- Setup or deployment processes changed
- New conventions or best practices were established

### When to Skip Documentation

Skip documentation updates when:

- Changes are minor bug fixes or typo corrections
- Changes are internal implementation details not visible to users
- Changes are temporary or experimental

### Output Required

- List of documentation files updated (if any)
- Summary of documentation changes made
- Reason for each update (or reason for skipping)

---

## Step 11: Push to GitHub

After completing the task, updating TODO.md, and updating documentation (if applicable), push the changes to GitHub.

### Actions

1. Stage all changes: `git add .`
2. Commit with a descriptive message following the task context
3. Push to the appropriate branch

### Commit Message Guidelines

- Reference the task ID if applicable
- Use clear, descriptive language
- Summarize what was changed and why
- Example: "Complete task-001: Add contact form validation"

### Branch Considerations

- If working on a feature branch, push to that branch
- If working directly on main, ensure changes are ready for production
- Consider creating a pull request for significant changes

### Output Required

- Confirmation that changes were committed and pushed
- Commit message used
- Branch pushed to

---

## Source-of-Truth Order

When deciding what to do, prioritize in this order:

1. The current codebase and actual implementation
2. `TODO.md` (the task specification) – **especially the task's `Strict Rules`, `Existing Code Patterns`, and `Anti-Patterns`**
3. Official documentation for Astro 6.x, Tailwind v4, and dependencies in `package.json`
4. Strong reference implementations or gold-standard repositories
5. Secondary articles or tutorials (only if official sources are insufficient)

If `TODO.md` conflicts with current best practices, security guidance, official docs, or the actual architecture of the repo, **follow the best-supported approach and briefly explain the conflict.**

---

## Response Style

- Be concise but clear
- Explain technical decisions in plain English
- For significant changes, ask before implementing
- For local fixes, implement first, then summarize what changed and why
- Never ignore the repository docs, but never assume they are correct without verification

---

## Notes

- The user is not a software developer – communicate clearly, avoid unnecessary jargon
- Treat `TODO.md` and `AGENTS.md` as important context, not unquestioned truth
- They may occasionally be outdated, but represent the primary specification
- Always verify information against the actual codebase

---

## Error Handling

If you encounter issues:

1. Re-read the task description in `TODO.md`
2. Re-analyze the codebase with fresh perspective
3. **Re-visit the task's `Research / Investigation` field** – perhaps the answer is there
4. Conduct additional research if needed
5. Adjust the plan and present for approval if scope changes
6. Document any blockers or dependencies discovered
