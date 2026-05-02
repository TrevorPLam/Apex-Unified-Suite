---
name: typescript-strict-configuration
description: Enable and manage strict TypeScript compiler flags for production-grade type safety across the workspace
---

# TypeScript Strict Configuration

This skill guides you through enabling strict TypeScript compiler flags to catch errors at compile time and enforce production-ready code quality.

## Current State Assessment

**Current Configuration**: `tsconfig.base.json` has strict flags explicitly disabled:
- `noImplicitOverride: false`
- `noUnusedLocals: false`  
- `strictFunctionTypes: false`

**Impact**: These relaxed flags allow potential runtime errors and missed edge cases to slip through.

## Strict Mode Flags (2026 Best Practices)

### **Core Strict Flags**

| Flag | Purpose | Why Enable |
|------|---------|------------|
| `strict: true` | Master switch enabling all strict type checking | Foundation for type safety |
| `noImplicitOverride` | Requires `override` keyword when overriding methods | Prevents silent breaking changes in inheritance |
| `noUnusedLocals` | Errors on unused variables/parameters | Cleaner code, catches typos |
| `strictFunctionTypes` | Contravariant function parameter checking | Prevents unsafe function assignments |
| `noImplicitReturns` | Requires all code paths to return | Prevents undefined returns |
| `noFallthroughCasesInSwitch` | Errors on switch fallthrough | Prevents accidental case fallthrough |
| `noUncheckedIndexedAccess` | Indexed access returns `\| undefined` | Forces null checks on array/object access |
| `exactOptionalPropertyTypes` | Distinguishes `undefined` from missing | Prevents subtle type bugs |
| `useUnknownInCatchVariables` | Catch variables are `unknown` not `any` | Forces proper error handling |

### **2026 Recommended Configuration**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

## Step-by-Step Implementation

### **Step 1: Backup Current Configuration**

```bash
# Create backup of current tsconfig
cp tsconfig.base.json tsconfig.base.json.backup

# Note current error count
pnpm run typecheck 2>&1 | grep -c "error TS" || echo "0 errors"
```

### **Step 2: Enable Strict Flags Incrementally**

**Phase A**: Enable core strict flags
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "strictFunctionTypes": true
  }
}
```

**Phase B**: Add safety flags after Phase A passes
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Phase C**: Final strict configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true
  }
}
```

### **Step 3: Fix Common Error Patterns**

#### **noImplicitOverride Errors**

**Before**:
```typescript
class BaseService {
  async findById(id: string) { /* ... */ }
}

class UserService extends BaseService {
  async findById(id: string) { /* overrides silently */ }
}
```

**After**:
```typescript
class BaseService {
  async findById(id: string) { /* ... */ }
}

class UserService extends BaseService {
  override async findById(id: string) { /* explicit override */ }
}
```

#### **noUnusedLocals Errors**

**Before**:
```typescript
function processUser(user: User) {
  const name = user.name; // Unused variable
  return user.id;
}
```

**After** (fix by using or removing):
```typescript
function processUser(user: User) {
  return user.id;
}
```

Or prefix with underscore if intentionally unused:
```typescript
function processUser(_user: User, context: Context) {
  return context.id;
}
```

#### **strictFunctionTypes Errors**

**Before**:
```typescript
type Handler = (x: string | number) => void;

const myHandler: Handler = (x: string) => { /* accepts only string */ };
// Unsafe: myHandler might be called with number
```

**After**:
```typescript
type Handler = (x: string | number) => void;

const myHandler: Handler = (x: string | number) => { 
  // Must handle both types
  if (typeof x === 'string') { /* ... */ }
};
```

#### **noImplicitReturns Errors**

**Before**:
```typescript
function getStatus(value: number): string {
  if (value > 0) {
    return "positive";
  }
  // Missing return for value <= 0
}
```

**After**:
```typescript
function getStatus(value: number): string {
  if (value > 0) {
    return "positive";
  }
  return "non-positive"; // Explicit return
}
```

#### **useUnknownInCatchVariables Errors**

**Before**:
```typescript
try {
  riskyOperation();
} catch (error) {
  console.log(error.message); // error is any, unsafe
}
```

**After**:
```typescript
try {
  riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // Type-safe access
  } else {
    console.log("Unknown error:", error);
  }
}
```

#### **noUncheckedIndexedAccess Errors**

**Before**:
```typescript
const items = ["a", "b", "c"];
const first = items[0]; // string, but could be undefined if array empty
console.log(first.toUpperCase()); // Runtime error if empty
```

**After**:
```typescript
const items = ["a", "b", "c"];
const first = items[0]; // string | undefined
if (first) {
  console.log(first.toUpperCase()); // Safe
}
// Or use optional chaining
console.log(first?.toUpperCase());
```

### **Step 4: Update All Package tsconfig Files**

Each package must extend the base config:

**File**: `lib/db/tsconfig.json`
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**File**: `artifacts/api-server/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**File**: `artifacts/apex-os/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"]
}
```

### **Step 5: Verify Type Checking**

```bash
# Run typecheck across all packages
pnpm run typecheck

# Check specific packages
pnpm --filter @workspace/db run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/apex-os run typecheck

# Watch mode for development
pnpm --filter @workspace/api-server run typecheck --watch
```

## Domain Error Alignment

Strict TypeScript flags reinforce domain invariants:

```typescript
// strictFunctionTypes catches this at compile time
class LeadService {
  // Domain rule: Stage transitions must be valid
  async moveToStage(leadId: string, stage: LeadStage): Promise<Result<Lead, DomainError>> {
    const lead = await this.findById(leadId);
    if (!lead) {
      return err(new LeadNotFound(leadId));
    }
    
    // noImplicitReturns ensures all paths return
    if (!isValidTransition(lead.stage, stage)) {
      return err(new InvalidStageTransition(lead.stage, stage));
    }
    
    // Type system enforces we return a Result
    return ok(await this.updateStage(leadId, stage));
  }
}
```

## CI/CD Integration

Add type checking to your CI pipeline:

**File**: `.github/workflows/typecheck.yml`
```yaml
name: TypeCheck

on: [push, pull_request]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
```

## Anti-Patterns to Avoid

❌ **Disabling flags with @ts-ignore**:
```typescript
// @ts-ignore - temporary workaround
// This creates technical debt and hides real issues
```

❌ **Using `any` to bypass strictness**:
```typescript
const data: any = fetchData(); // Defeats type safety
```

❌ **Incremental strictness without fixing errors**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false  // Don't partially enable
  }
}
```

## Benefits of Strict Mode

1. **Catches null/undefined errors** at compile time
2. **Prevents method signature mismatches** in inheritance
3. **Eliminates unused code** automatically
4. **Forces proper error handling** in catch blocks
5. **Makes refactoring safer** with compiler assistance
6. **Improves IDE autocomplete** with precise types

## Verification Checklist

- [ ] `tsconfig.base.json` has all strict flags enabled
- [ ] All packages extend `tsconfig.base.json`
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] No `@ts-ignore` comments in codebase
- [ ] No explicit `any` types in new code
- [ ] CI pipeline includes typecheck job
- [ ] All errors fixed with proper types (not workarounds)

## Expected Outcome

After completing this skill:
- Zero TypeScript errors across the workspace
- All strict compiler flags enabled
- Type-safe domain invariants enforced at compile time
- CI/CD pipeline blocking type errors
- Developer confidence in refactoring
