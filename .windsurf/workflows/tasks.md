---
description: Execute the first active parent task from TASKS.md with PowerShell-optimized execution and quality assessment
---

# Task Execution Workflow

This workflow guides you through completing **the first active parent task** from the planning documentation following a structured sequence with PowerShell-optimized execution and quality assessment.

## Prerequisites

- Read `docs/1/MD.md` for markdown formatting guidelines and token optimization practices
- Read the TASKS.md file to understand the task list
- Repository must be in clean state (no uncommitted changes)

---

## Step 1: Analyze Markdown Guidelines

Read and understand the markdown formatting guidelines from `docs/1/MD.md`.

### Key Guidelines to Apply

- **One H1 per document** - first heading = title (sentence case)
- **ATX headings only** - never skip levels (H1→H2→…)
- **Blank lines** - exactly one blank line between different block types
- **Line length** - ≤100 characters (79 for "about_" articles)
- **Spaces, never tabs** - consistent indentation (4 spaces for nested lists)
- **No trailing spaces** - affects rendering
- **Code blocks** - fenced + language tag; blank lines around
- **Tables** - leading/trailing pipes; align logically
- **Links** - prefer inline over reference for self-containment
- **End files with single newline**

### Token Optimization

- Use concise tables over verbose prose
- Use rule references (`#RULE-ID`) instead of repeating full text
- Apply inverted-pyramid structure: TL;DR summary first, details in appendices
- Keep descriptions to ≤1 sentence where possible

---

## Step 2: Find First Active Parent Task

Read `docs/1/TASKS.md` (the correct location for the task file) to identify the **first parent task with unchecked subtasks**.

### Step 2 Action

Scan the task list sequentially from Task 1 onward. Find the first parent task where at least one subtask checkbox is unchecked (`[ ]`).

### Step 2 Output Required

Report:

- Task number and title
- File path being modified
- All subtasks (both completed and pending)
- Total completion status

---

## Step 3: Read Task in Full

Read the complete task details including all subtasks and context.

### Step 3 Action

Extract the full task description, all subtask bullets, and any implicit requirements from the task structure.

### Step 3 Output Required

- Complete task description
- All subtasks listed with current status
- Related files mentioned
- Dependencies implied by the task

---

## Step 4: Reason Over PowerShell Commands

Analyze the task actions and determine what PowerShell commands would allow for optimized task execution.

### Analysis Points

Consider which operations could be automated or accelerated with PowerShell:

- **File operations**: Creating, moving, copying files
- **Search and replace**: Bulk text replacements across files
- **Pattern matching**: Finding specific patterns in markdown files
- **Validation**: Checking markdown syntax, link validity
- **Token counting**: Estimating token usage of documentation
- **YAML processing**: Validating YAML structure

### PowerShell Command Strategy

For documentation tasks, useful PowerShell patterns include:

```powershell
# Search for patterns in markdown files
Select-String -Path "docs/**/*.md" -Pattern "pattern" -Context 2,2

# Replace text across files
(Get-Content "file.md") -replace "old", "new" | Set-Content "file.md"

# Count lines or tokens
(Get-Content "file.md" | Measure-Object -Line).Lines

# Validate YAML structure
Get-Content "file.yaml" | ConvertFrom-Yaml

# Find all markdown files
Get-ChildItem -Path "docs" -Filter "*.md" -Recurse
```

### Step 4 Output Required

- List of PowerShell commands that could optimize execution
- Rationale for each command
- Manual operations that cannot be automated

---

## Step 5: Execute the Task

Implement the task changes following the markdown guidelines and using PowerShell commands where appropriate.

### Execution Standards

- Apply all markdown formatting guidelines from Step 1
- Use PowerShell commands for bulk operations where applicable
- Make minimal, focused changes
- Preserve existing structure unless the task requires restructuring
- Update checkboxes in TASKS.md as subtasks are completed

### Scope Control

- Complete all subtasks of the parent task
- Do not expand scope to other parent tasks
- If related issues are discovered, note them but do not address unless part of current task

### Step 5 Output Required

- Summary of changes made
- Files modified
- PowerShell commands used (if any)
- Subtasks completed

---

## Step 6: Quality Assessment

Conduct a quality assessment once the task is finished.

### Assessment Criteria

- **Markdown Compliance**: Verify all guidelines from MD.md are followed
- **Token Efficiency**: Check that changes follow token optimization practices
- **Completeness**: Confirm all subtasks are completed
- **Consistency**: Ensure formatting matches across the modified file
- **Link Validity**: Verify all cross-references are correct
- **YAML Validity**: If YAML files were modified, validate structure

### Assessment Actions

```powershell
# Check for trailing spaces
Select-String -Path "docs/**/*.md" -Pattern " +$" | Select-Object Path, LineNumber

# Validate line length
Get-Content "file.md" | ForEach-Object { if ($_.Length -gt 100) { $_ } }

# Check for consistent heading hierarchy
# (Manual review required)

# Validate YAML syntax
# (Use yaml-lint or similar tool if available)
```

### Step 6 Output Required

- Assessment results for each criterion
- Any issues found and their resolution
- Overall quality rating
- Recommendations for improvement (if any)

---

## Step 7: Mark Task Complete

Update the TASKS.md file to mark the parent task as complete.

### Update Actions

- Change all subtask checkboxes from `[ ]` to `[x]`
- If applicable, add a brief completion note after the task
- Ensure no other tasks were accidentally modified

### Step 7 Output Required

- Confirmation that all checkboxes are updated
- Summary of the completed task

---

## Source-of-Truth Order

When deciding what to do, prioritize in this order:

1. The markdown formatting guidelines in `docs/1/MD.md`
2. The task specification in `docs/1/TASKS.md`
3. The actual current state of the file being modified
4. Token optimization best practices
5. CommonMark and GFM standards

If TASKS.md conflicts with markdown guidelines, **follow the guidelines and briefly explain the conflict.**

---

## Response Style

- Be concise but clear
- Explain technical decisions in plain English
- Use PowerShell commands where they add value
- Document manual operations that cannot be automated
- Never ignore the markdown guidelines

---

## Notes

- The user is not a software developer – communicate clearly, avoid unnecessary jargon
- PowerShell commands should be safe and reversible where possible
- Always verify changes before marking tasks complete
- Quality assessment is mandatory before completion

---

## Error Handling

If you encounter issues:

1. Re-read the task description in TASKS.md
2. Re-analyze the markdown guidelines
3. Check that the file path is correct
4. Verify PowerShell command syntax
5. Adjust the approach and document the change
6. Document any blockers or dependencies discovered
