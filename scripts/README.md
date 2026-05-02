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
