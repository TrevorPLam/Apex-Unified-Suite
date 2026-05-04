# Scripts Directory

This directory contains utility scripts for the Apex Unified Suite project.

## Available Scripts

### consolidate-skills.cjs

**Purpose**: Consolidates all individual SKILL.md files from `.windsurf/skills/` directories into a single master `SKILL.md` file in the repository root.

**Features**:

- Automatically discovers all SKILL.md files in skill subdirectories
- Generates a table of contents with clickable links
- Preserves original file metadata (path, size)
- Adjusts markdown heading levels to prevent conflicts
- Adds generation timestamp and statistics
- Provides regeneration instructions

**Usage**:

```bash
# Run directly
node scripts/consolidate-skills.cjs

# Or use the convenience script
pnpm run consolidate-skills
```

**Output**: Creates `SKILL.md` in the repository root with:

- Table of contents with 29 skills
- Full content of each skill file
- Proper markdown formatting
- Generation metadata

**File Structure**:

```text
SKILL.md
├── Header with generation info
├── Table of Contents
├── Skills Documentation (29 skills)
│   ├── Skill 1: api-business-endpoints
│   ├── Skill 2: authentication-implementation
│   └── ... (remaining 27 skills)
└── Footer with regeneration instructions
```

**Notes**:

- This is a generated file - do not edit directly
- Edit individual SKILL.md files in `.windsurf/skills/` directories instead
- Script handles CommonJS/ES module compatibility
- Automatically sorts skills alphabetically

**Dependencies**: None (uses Node.js built-in modules only)

### consolidate-tasks.cjs

**Purpose**: Consolidates all TODO-*.md task files from the `tasks/` directory into a single master `TASKS-MASTER.md` file in the repository root.

**Features**:

- Automatically discovers all TODO-*.md files in the tasks directory
- Generates a table of contents organized by priority level (P0-P10)
- Preserves original file content and structure
- Calculates completion statistics and task counts
- Adds generation timestamp and file metadata
- Provides regeneration instructions

**Usage**:

```bash
# Run directly
node scripts/consolidate-tasks.cjs

# Or use the convenience script
pnpm run consolidate-tasks
```

**Output**: Creates `TASKS-MASTER.md` in the repository root with:

- Overview section with project statistics
- Table of contents organized by priority
- Full content of each task file in code blocks
- File metadata (size, modification date, line count)
- Regeneration instructions

**File Structure**:

```text
TASKS-MASTER.md
├── Header with generation info and statistics
├── Overview and priority legend
├── Table of Contents (by priority)
├── Task Files Documentation (70 files)
│   ├── Priority 0 (Foundation)
│   ├── Priority 1 (Core Infrastructure)
│   ├── Priority 2 (Domain Foundations)
│   └── ... (remaining priorities)
└── Footer with regeneration instructions
```

**Statistics Generated**:

- Total task files and individual tasks
- Completion rate tracking
- Priority level distribution
- Document size and metadata

**Notes**:

- This is a generated file - do not edit directly
- Edit individual TODO-*.md files in the `tasks/` directory instead
- Script handles CommonJS/ES module compatibility
- Automatically sorts files by priority then alphabetically
- Preserves original formatting and structure

**Dependencies**: None (uses Node.js built-in modules only)
