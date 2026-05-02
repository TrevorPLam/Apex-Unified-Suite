---
name: dependency-auditing
description: Audit and clean up unused dependencies, pin critical versions, and maintain a lean, secure dependency tree for the monorepo
---

# Dependency Auditing

This skill guides you through auditing project dependencies, removing unused packages, and pinning critical versions for a lean, secure, and maintainable dependency tree.

## Current State Assessment

**Identified Unused Dependencies**:
- `cookie-parser` (api-server) - Declared but never imported
- `@hookform/resolvers` (apex-os) - Only used in shadcn form.tsx, not in pages
- `react-hook-form` (apex-os) - Never imported in any page
- `next-themes` (apex-os) - No theme switching implemented
- `react-day-picker` (apex-os) - No date picker usage
- `react-resizable-panels` (apex-os) - No resizable panel usage
- `vaul` (apex-os) - Drawer component unused
- `embla-carousel-react` (apex-os) - No carousel in pages

**Version Issues**:
- `zod` floating version incompatible with `drizzle-zod`
- Missing testing frameworks (Vitest 2.0, Playwright 1.45)

## Dependency Audit Process

### **Step 1: Analyze Current Dependencies**

```bash
# List all dependencies across workspace
pnpm list --depth=0

# Check for outdated packages
pnpm outdated

# Find unused dependencies (requires depcheck)
npx depcheck --ignores="@types/*,eslint*,prettier*"

# Audit security vulnerabilities
pnpm audit
```

### **Step 2: Identify Unused Dependencies**

Search for imports across the codebase:

```bash
# Check if cookie-parser is imported
grep -r "cookie-parser" artifacts/api-server/src/ || echo "NOT USED"

# Check react-hook-form usage
grep -r "react-hook-form" artifacts/apex-os/src/ || echo "NOT USED"

# Check @hookform/resolvers
grep -r "@hookform/resolvers" artifacts/apex-os/src/ || echo "NOT USED"

# Check next-themes
grep -r "next-themes\|useTheme" artifacts/apex-os/src/ || echo "NOT USED"

# Check react-day-picker
grep -r "react-day-picker\|DayPicker" artifacts/apex-os/src/ || echo "NOT USED"

# Check react-resizable-panels
grep -r "react-resizable-panels\|ResizablePanel" artifacts/apex-os/src/ || echo "NOT USED"

# Check vaul
grep -r "vaul\|Drawer" artifacts/apex-os/src/ || echo "NOT USED"

# Check embla-carousel
grep -r "embla-carousel" artifacts/apex-os/src/ || echo "NOT USED"
```

### **Step 3: Remove Unused Dependencies**

**Decision Matrix**:
| Package | Status | Action | Notes |
|---------|--------|--------|-------|
| cookie-parser | Unused | Remove | No imports found |
| react-hook-form | Unused | Keep for Phase 5 | Will be used for forms |
| @hookform/resolvers | Unused | Keep for Phase 5 | Paired with react-hook-form |
| next-themes | Unused | Remove | No theme switching planned |
| react-day-picker | Unused | Remove | No date picker requirement |
| react-resizable-panels | Unused | Remove | No resizable UI planned |
| vaul | Unused | Remove | shadcn Drawer exists |
| embla-carousel-react | Unused | Keep | May use for marketing |

**Remove confirmed unused packages**:

```bash
# Remove from api-server
pnpm --filter @workspace/api-server remove cookie-parser

# Remove from apex-os
pnpm --filter @workspace/apex-os remove next-themes react-day-picker react-resizable-panels vaul
```

### **Step 4: Pin Critical Versions**

**Zod Compatibility Fix**:

```bash
# Pin zod to compatible version for drizzle-zod
pnpm --filter @workspace/db add zod@3.23.8
pnpm --filter @workspace/api-zod add zod@3.23.8
pnpm --filter @workspace/api-client-react add zod@3.23.8
pnpm --filter @workspace/api-server add zod@3.23.8
pnpm --filter @workspace/apex-os add zod@3.23.8
```

**Add Missing Critical Dependencies**:

```bash
# Add to workspace catalog in pnpm-workspace.yaml
cat << 'EOF'

# Critical dependencies for upcoming features
neverthrow: ^6.0.1
vitest: ^2.0.0
@vitest/ui: ^2.0.0
argon2: ^0.40.1
@playwright/test: ^1.45.0
EOF

# Then run install
pnpm install
```

### **Step 5: Update pnpm-workspace.yaml**

**File**: `pnpm-workspace.yaml`

```yaml
packages:
  - "artifacts/*"
  - "lib/*"
  - "lib/integrations/*"
  - "scripts/*"

catalog:
  # Framework
  react: 19.1.0
  react-dom: 19.1.0
  
  # Build Tools
  typescript: 5.9.2
  vite: 7.3.2
  esbuild: 0.27.3
  
  # Database & API
  drizzle-orm: 0.45.2
  drizzle-zod: 0.8.3
  zod: 3.23.8  # Pinned for compatibility
  
  # Authentication & Security
  argon2: ^0.40.1
  jsonwebtoken: ^9.0.2
  
  # Testing (new)
  vitest: ^2.0.0
  @vitest/ui: ^2.0.0
  @playwright/test: ^1.45.0
  
  # Error Handling
  neverthrow: ^6.0.1
  
  # UI (existing)
  tailwindcss: 4.1.14
  framer-motion: 11.0.0
  
  # Utilities
  date-fns: ^3.0.0
  uuid: ^9.0.0

# Keep existing security configuration
catalogs: []
```

### **Step 6: Verify Installation**

```bash
# Clean install to verify changes
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile

# Verify no peer dependency issues
pnpm install 2>&1 | grep -i "peer" || echo "No peer issues"

# Type check to ensure nothing broke
pnpm run typecheck

# Build to ensure compatibility
pnpm run build
```

## Workspace Catalog Management

### **Catalog Pattern Benefits**

1. **Consistent versions** across all packages
2. **Single source of truth** for dependency versions
3. **Simplified updates** - change in one place
4. **Security enforcement** via workspace policies

### **Adding to Catalog**

```yaml
# In pnpm-workspace.yaml
catalog:
  # Use exact versions for stability
  package-name: 1.2.3
  
  # Use ^ for minor updates
  another-package: ^2.0.0
```

### **Using Catalog in package.json**

```json
{
  "dependencies": {
    "package-name": "catalog:"
  }
}
```

## Security Considerations

### **Version Pinning Strategy**

| Scenario | Strategy | Example |
|----------|----------|---------|
| Core framework | Exact version | `react: 19.1.0` |
| Security libraries | Exact version | `argon2: 0.40.1` |
| Utility libraries | Caret range | `date-fns: ^3.0.0` |
| Type definitions | Caret range | `@types/node: ^20.0.0` |

### **Audit Schedule**

```bash
# Weekly security audit
pnpm audit

# Monthly outdated check
pnpm outdated

# Quarterly deep audit
npx depcheck
pnpm licenses list
```

## Dependency Decision Framework

### **When to Add a Dependency**

✅ **Yes**:
- Solves a complex problem (e.g., password hashing with Argon2)
- Well-maintained with active community
- Tree-shakeable and small bundle size
- Used in multiple packages (add to catalog)

❌ **No**:
- Can be implemented in <50 lines of code
- Used in only one place with simple usage
- Last updated >2 years ago
- Has known security vulnerabilities

### **Bundle Size Analysis**

```bash
# Analyze bundle size impact
pnpm --filter @workspace/apex-os build
npx bundlesize

# Check specific package size
npx package-size react-hook-form
```

## Documentation Requirements

After auditing, document decisions:

**File**: `docs/dependencies.md`

```markdown
# Dependency Decisions

## Removed Dependencies
- **cookie-parser**: Never imported, Express has built-in cookie parsing
- **next-themes**: No theme switching requirement in current scope
- **react-day-picker**: Date picker not used in any page
- **react-resizable-panels**: No resizable panel UI planned
- **vaul**: Duplicate of shadcn/ui Drawer component

## Pinned Versions
- **zod**: Pinned to 3.23.8 for drizzle-zod compatibility
- **drizzle-orm**: Pinned to 0.45.2 for stability

## Kept Dependencies (Future Use)
- **react-hook-form**: Will be used in Phase 5 form validation
- **@hookform/resolvers**: Paired with react-hook-form for Zod
- **embla-carousel-react**: Potential marketing page usage

## Security Notes
- All packages use exact or caret-pinned versions
- Weekly `pnpm audit` runs in CI
- No native modules in frontend packages
```

## Verification Checklist

- [ ] All unused dependencies removed
- [ ] Critical versions pinned (zod, argon2, etc.)
- [ ] New dependencies added to workspace catalog
- [ ] `pnpm install --frozen-lockfile` succeeds
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` succeeds
- [ ] No peer dependency warnings
- [ ] `pnpm audit` shows no high/critical vulnerabilities
- [ ] Documentation updated with dependency decisions

## Anti-Patterns

❌ **Floating major versions**:
```json
{
  "dependencies": {
    "package": "^1.0.0"  // Risky, allows breaking changes
  }
}
```

❌ **Mixed version strategies**:
```yaml
# Inconsistent in catalog
catalog:
  pkg-a: 1.0.0  # Exact
  pkg-b: ^2.0.0  # Caret
  pkg-c: ~3.0.0  # Tilde - avoid this
```

❌ **Installing without catalog**:
```bash
# Don't bypass catalog
pnpm add some-package  # Wrong

# Use catalog instead
pnpm add some-package@catalog:  # Correct
```

## Commands Reference

```bash
# Audit and maintenance
pnpm audit                    # Security vulnerabilities
pnpm outdated                 # Outdated packages
pnpm list --depth=0          # Top-level dependencies
npx depcheck                 # Find unused dependencies
pnpm licenses list           # License compliance

# Modifying dependencies
pnpm --filter <workspace> add <package>
pnpm --filter <workspace> remove <package>
pnpm --filter <workspace> update <package>

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install --frozen-lockfile
```
