---
trigger: always_on
---

# TypeScript Strict Mode Rules

## Purpose
Enforce strict TypeScript configuration for production-ready code quality and type safety across the Apex Unified Suite monorepo.

## Current State
- `tsconfig.base.json` has relaxed flags for prototyping
- Strict flags are disabled: `noImplicitOverride: false`, `noUnusedLocals: false`, `strictFunctionTypes: false`
- This must be enabled for production deployment

## Required Configuration

### Strict Mode Settings
Enable these flags in `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Implementation Steps

1. Update `tsconfig.base.json` with strict flags
2. Run `pnpm typecheck` to identify errors
3. Fix all TypeScript errors systematically
4. Verify all packages pass type checking

## Error Resolution Patterns

### Common Issues and Solutions
- **Unused variables**: Remove or prefix with underscore
- **Implicit any**: Add explicit type annotations
- **Missing returns**: Add explicit return statements
- **Function type mismatches**: Fix parameter/return types

### Migration Strategy
- Fix files in dependency order (lib → artifacts)
- Address one error type at a time
- Use `// @ts-ignore` sparingly and with justification

## Quality Gates
- All packages must pass `pnpm typecheck`
- Zero `any` types in new code
- All functions have explicit return types
- No unused imports or variables

## Enforcement
This rule is always active and will guide TypeScript configuration decisions during development.
