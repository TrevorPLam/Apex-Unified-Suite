---
trigger: always_on
---

# Dependency Management Rules

## Purpose
Manage project dependencies efficiently, remove unused packages, and maintain security through proper versioning.

## Current State Analysis

### Unused Dependencies Identified
- `cookie-parser` (api-server) - Declared but never imported
- `@hookform/resolvers` (apex-os) - Only used in shadcn form.tsx, not in pages
- `react-hook-form` (apex-os) - Never imported in any page
- `next-themes` (apex-os) - No theme switching implemented
- `react-day-picker` (apex-os) - No date picker usage
- `react-resizable-panels` (apex-os) - No resizable panel usage
- `vaul` (apex-os) - Drawer component unused
- `embla-carousel-react` (apex-os) - No carousel in pages

### Critical Dependencies
- `zod` version is floating (incompatible with drizzle-zod)
- Missing testing frameworks (Vitest, Playwright, RTL)
- Missing development tools (ESLint, Prettier config)

## Dependency Management Strategy

### Version Pinning Requirements
- Pin `zod` to `^3.23.x` for drizzle-zod compatibility
- Use exact versions for critical security dependencies
- Maintain consistent versions across workspace packages

### Unused Package Removal Process
1. Identify unused packages via grep search
2. Verify no imports exist across all files
3. Remove from package.json
4. Run `pnpm install --frozen-lockfile`
5. Verify no build errors

### Security Considerations
- Maintain 1440-minute minimum release age
- Review all new dependencies for security
- Use `pnpm audit` regularly
- Keep `@replit/*` packages exempt from release age

## Implementation Commands

### Audit Dependencies
```bash
# Find unused dependencies
pnpm list --depth=0
grep -r "@hookform/resolvers" artifacts/apex-os/src/
grep -r "react-hook-form" artifacts/apex-os/src/
```

### Remove Unused Packages
```bash
# Remove specific unused packages
pnpm --filter @workspace/api-server remove cookie-parser
pnpm --filter @workspace/apex-os remove @hookform/resolvers react-hook-form next-themes
```

### Pin Critical Versions
```bash
# Pin zod for compatibility
pnpm --filter @workspace/db add zod@3.23.8
pnpm --filter @workspace/api-zod add zod@3.23.8
pnpm --filter @workspace/api-client-react add zod@3.23.8
```

## Quality Gates
- Zero unused dependencies in production
- All security patches applied
- Consistent versions across workspace
- No floating major versions
- Regular dependency audits

## Monitoring
- Weekly dependency reviews
- Automated security scanning
- Package size analysis
- License compliance checks
