# tasks/infrastructure/ACCESSIBILITY.md – Accessibility Compliance (WCAG 2.2 AA)

This file defines the tasks required to achieve and maintain WCAG 2.2 AA compliance across the entire application.  
Accessibility is a legal requirement: the U.S. Department of Justice Title II enforces WCAG 2.1 AA (and 2.2 AA will be the upcoming standard); private‑sector ADA Title III enforcement is threat‑based. The EU’s European Accessibility Act (2025) also applies. Fines reach $75k for a first violation, $150k for repeat.  

> **Follow all rules in `CROSS‑CUTTING‑RULES.md` §10.**

---

## Audit & Baseline

### [ ] A11Y‑001: Accessibility Audit of All Existing UI Components
**Status:** ⏳ Not Started  
**Actor:** AGENT + HUMAN  
**Priority:** 🔴 Critical  
**Current State:** No accessibility audit has been performed. The app is likely non‑compliant.  
**Size:** Large  

**Description:**  
Run an automated accessibility audit using axe‑core (via Lighthouse or `@axe‑core/react`) on every page of the application. Generate a violation report listing each component and the specific WCAG success criterion it violates. This establishes the baseline that all subsequent accessibility tasks address.

**Depends on:** All frontend pages exist (they do, but may change)  
**Blocks:** All other A11Y tasks

**Related Files:** `docs/accessibility‑audit‑report.md`

**Definition of Done**
- [ ] Audit script created that navigates to every route in the application, captures screenshots, and runs axe‑core.  
- [ ] Violation report generated: grouped by component, severity, WCAG SC number, and a brief description of the fix needed.  
- [ ] Report reviewed by HUMAN and prioritized (critical issues must be fixed in Phase 0, others in Phase 1).  
- [ ] Audit report committed to `docs/accessibility‑audit‑report.md`.  
- [ ] `pnpm run typecheck` – N/A.

**Verification**
```bash
pnpm --filter @workspace/apex‑os run a11y:audit
# Manual: open docs/accessibility‑audit‑report.md and verify completeness
```

---

### Subtasks
- [ ] A11Y‑001.0.25 (AGENT): Research axe‑core integration options for React + Vite. Choose between `@axe‑core/react`, `lighthouse‑ci`, or `cypress‑axe`.
- [ ] A11Y‑001.1 (AGENT): Create audit script that runs axe on all routes. **File:** `artifacts/apex‑os/scripts/a11y‑audit.ts` **Verification:** Script runs and outputs JSON report.
- [ ] A11Y‑001.2 (AGENT): Parse JSON report into a Markdown file grouped by component. **File:** `docs/accessibility‑audit‑report.md` **Verification:** Report is human‑readable.
- [ ] A11Y‑001.3 (HUMAN): Review report, prioritize critical issues. **Verification:** Approved.

---

## Keyboard Navigation & Focus Management

### [ ] A11Y‑002: Keyboard Navigation and Focus Management
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No keyboard navigation testing has been done. Many interactions may be mouse‑only.  
**Size:** Large  

**Description:**  
Ensure all interactive elements are keyboard‑accessible (Tab/Shift+Tab, Enter, Space, Escape) and that focus management follows WCAG 2.4.3, 2.4.7, and 2.5.5. Implement:
- A logical tab order that matches visual order.
- Visible focus indicators on all interactive elements (minimum 2px solid outline with 3:1 contrast against adjacent colors, as required by WCAG 2.5.5).
- A skip‑to‑main‑content link that appears on first Tab.
- Focus trapping in modals/drawers (Tab cycles within the modal; Escape closes it).
- Focus restoration when a modal/drawer is closed (focus returns to the triggering element).

**Depends on:** `A11Y‑001` (audit identifies focus‑related violations)  
**Blocks:** Full keyboard accessibility

**Related Files:** All `.tsx` files with interactive elements; `artifacts/apex‑os/src/components/ui/` (modals, drawers, dialogs)

**Definition of Done**
- [ ] Tab order verified on every page; `tabIndex={0}` added where needed, `tabIndex={-1}` removed on non‑interactive elements that shouldn't trap focus.  
- [ ] Visible focus indicator implemented globally via CSS (`:focus‑visible` with a 2px solid outline and 3:1 contrast ratio).  
- [ ] Skip‑to‑content link added as the first focusable element in `MainLayout.tsx`.  
- [ ] Focus trapping implemented in all `Dialog`, `Sheet`, `Drawer`, `AlertDialog`, and `Command` components.  
- [ ] Escape key closes modals; `onClose` called, focus restored to trigger.  
- [ ] Component tests verify focus behavior (e.g., Tab inside a modal stays within, Escape closes, focus returns).  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- Use native HTML elements when possible (`<button>`, `<input>`, `<select>`, `<textarea>`) instead of `<div>` with `onClick`. Native elements already handle keyboard.  
- Custom interactive widgets (combobox, listbox, grid) must follow WAI‑ARIA Authoring Practices.  
- Focus indicators must not be suppressed globally (do not use `outline: none` without a replacement visual indicator).  
- Skip‑to‑content link must be keyboard‑focusable and visible on focus (not hidden).  
- `aria‑modal="true"` must be set on modal containers when dialogs are open.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- keyboard‑focus.test.tsx
# Manual: navigate all pages with Tab and Shift+Tab; verify visible focus everywhere.
```

**DDD / TDD / BDD notes**
- TDD: Write component tests with `userEvent.tab()` and `userEvent.keyboard('{Escape}')` to verify focus trapping and modal close.

---

### Subtasks
- [ ] A11Y‑002.0.25 (AGENT): Read the current implementation of Dialog, Sheet, Drawer, and Command components. Identify where focus management is missing. No action — pause.
- [ ] A11Y‑002.1 (AGENT): Add `:focus‑visible` outline globally in `index.css`. **Verification:** Visible on all interactive elements.
- [ ] A11Y‑002.2 (AGENT): Add skip‑to‑content link to `MainLayout.tsx`. **Verification:** Focusable as first element.
- [ ] A11Y‑002.3 (AGENT): Implement focus trapping utility hook. **File:** `artifacts/apex‑os/src/hooks/useFocusTrap.ts` **Verification:** Unit tests pass.
- [ ] A11Y‑002.4 (AGENT): Apply focus trapping to all modal/drawer/dialog components. **Verification:** Component tests verify tab cycle and Escape.
- [ ] A11Y‑002.5 (AGENT): Add keyboard tests for each page's interactive elements. **File:** `artifacts/apex‑os/src/__tests__/accessibility/keyboard‑focus.test.tsx` **Verification:** GREEN.
- [ ] A11Y‑002.6 (HUMAN): Manual keyboard walkthrough of all pages. **Verification:** Approved.

---

## Screen‑Reader Support

### [ ] A11Y‑003: Screen‑Reader Support (ARIA labels, Landmarks, Live Regions)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** ARIA attributes are not consistently applied. Screen readers will not be able to navigate or describe the UI.  
**Size:** Large  

**Description:**  
Add appropriate ARIA labels, descriptions, landmarks, and live regions to all interactive components and page structures:
- **Landmarks:** All pages must have `<header>`, `<main>`, `<nav>`, and `<footer>` regions (or ARIA equivalents).
- **Interactive elements:** Buttons, inputs, selects, and toggles must have accessible names (`aria‑label`, `aria‑labelledby`, or visible text).
- **Live regions:** Async updates (toast notifications, booking confirmations, status changes) must be announced via `aria‑live` regions or programmatically via `aria‑alert`.
- **Error messages:** Form validation errors must be programmatically associated with their inputs via `aria‑describedby`.
- **Tables:** Data tables must have proper `<caption>`, `<thead>`, `<tbody>`, `<th scope="col">` / `<th scope="row">`.
- **Charts:** Recharts charts must have accessible alternatives (data tables or textual summaries).

**Depends on:** `A11Y‑001` (audit identifies ARIA violations)  
**Blocks:** Complete screen‑reader usability

**Related Files:** All page and component files.

**Definition of Done**
- [ ] All pages have a `<main>` landmark; `MainLayout` provides `<header>` and `<nav>`; sidebars and footers correctly tagged.  
- [ ] All icon‑only buttons have `aria‑label` (e.g., the notification bell, close buttons, action icon buttons).  
- [ ] All form inputs have associated `<label>` elements or `aria‑label` if the visible label is not programmatically associated.  
- [ ] All form error messages use `aria‑describedby` pointing to the error element.  
- [ ] All `<table>` elements have `<caption>` (visible or `sr‑only`) and proper `scope` attributes.  
- [ ] Toaster component uses `aria‑live="polite"` and announces new toasts.  
- [ ] Live regions added for loading states, search results updates, and async data changes.  
- [ ] Complex components (Kanban board, calendar, Gantt chart) have documented ARIA patterns.  
- [ ] Component tests verify ARIA attributes are present.  
- [ ] Manual screen‑reader test: VoiceOver (macOS) + NVDA (Windows) on all public‑facing flows (booking, portal login, document sharing).  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- Prefer semantic HTML (`<button>`, `<input>`) over ARIA‑heavy `<div>`s.  
- `aria‑label` must be in the user’s language (follows i18n).  
- Do not misuse ARIA roles or states (validate with `eslint‑plugin‑jsx‑a11y`).  
- Live regions must be used sparingly; too many announcements degrade the experience.  
- Complex widgets (listbox, grid, tree) must follow WAI‑ARIA Authoring Practices exactly.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- aria‑labels.test.tsx
# Manual: navigate using VoiceOver (macOS) and NVDA (Windows) through the booking flow, portal login, and document view.
```

**DDD / TDD / BDD notes**
- TDD: Component tests use `screen.getByRole()` queries; test that buttons and inputs have accessible names.
- BDD: “As a screen‑reader user, I can navigate the header, main content, and sidebar landmarks, and form errors are read aloud.”

---

### Subtasks
- [ ] A11Y‑003.0.25 (AGENT): Audit every page for missing landmarks, button labels, and input labels. No action — pause.
- [ ] A11Y‑003.1 (AGENT): Add `<main>`, `<header>`, `<nav>`, `<footer>` landmarks in `MainLayout.tsx` and page wrappers.
- [ ] A11Y‑003.2 (AGENT): Add `aria‑label` to all icon‑only buttons (Sidebar, Header, CRM actions, Documents, etc.). **Verification:** `getByRole('button', { name: /close/i })` works.
- [ ] A11Y‑003.3 (AGENT): Fix form inputs to use `<label>` or `aria‑label`; add `aria‑describedby` for errors. **File:** All forms.
- [ ] A11Y‑003.4 (AGENT): Add proper `<caption>` and `scope` to all `<table>` components.
- [ ] A11Y‑003.5 (AGENT): Add `aria‑live` region to `<Toaster>` and async update areas. **File:** `Sonner.tsx`
- [ ] A11Y‑003.6 (AGENT): Write component tests for ARIA attributes. **File:** `artifacts/apex‑os/src/__tests__/accessibility/aria‑labels.test.tsx`
- [ ] A11Y‑003.7 (HUMAN): Manual screen‑reader test (VoiceOver + NVDA). **Verification:** Approved.

---

## Color Contrast

### [ ] A11Y‑004: Color Contrast Audit and Remediation
**Status:** ⏳ Not Started  
**Actor:** AGENT + DESIGNER  
**Priority:** 🔴 Critical  
**Current State:** No color contrast audit has been done. The dark theme may have insufficient contrast on some surfaces.  
**Size:** Medium  

**Description:**  
Audit the entire design system for WCAG 2.2 AA contrast ratios:
- Normal text: 4.5:1 minimum.
- Large text (18px bold or 24px regular): 3:1 minimum.
- UI components (icons, borders, charts): 3:1 minimum.
- Form error states must use an icon **in addition to** color (do not rely solely on red text to indicate errors).

Fix any failures by adjusting color tokens in `index.css` or the Tailwind config. Add a CI job that runs axe‑core and fails on contrast violations.

**Depends on:** `A11Y‑001` (audit identifies contrast violations)  
**Blocks:** None

**Related Files:** `artifacts/apex‑os/src/index.css`, `tailwind.config.ts`, `artifacts/apex‑os/src/components/ui/*.tsx`

**Definition of Done**
- [ ] All color tokens in the design system (Tailwind config + CSS variables) audited for contrast against their expected background.  
- [ ] Any failing token fixed (lighten/darken as needed).  
- [ ] Form error messages now include an error icon (e.g., `AlertCircle`) in addition to red text.  
- [ ] CI job added: `pnpm a11y:contrast` runs axe‑core and fails the build if any contrast violations are present.  
- [ ] Design system documentation updated with contrast ratios for each token.  
- [ ] `pnpm run typecheck` – N/A.

**Verification**
```bash
pnpm --filter @workspace/apex‑os run a11y:contrast
# Manual: open pages and visually verify text is readable; test with grayscale mode.
```

**DDD / TDD / BDD notes**
- BDD: “As a user with low vision, I can read all text and distinguish UI elements because the contrast is sufficient.”

---

### Subtasks
- [ ] A11Y‑004.0.25 (AGENT): Run color contrast audit on the current color tokens. Identify violations. No action — pause.
- [ ] A11Y‑004.1 (AGENT + DESIGNER): Adjust failing color tokens in `index.css` and Tailwind config. **Verification:** Audit passes.
- [ ] A11Y‑004.2 (AGENT): Add error icons to form validation messages across all forms. **File:** All forms.
- [ ] A11Y‑004.3 (AGENT): Add CI contrast check step. **File:** `.github/workflows/ci.yml`
- [ ] A11Y‑004.4 (HUMAN): Manual review of all pages. **Verification:** Approved.

---

## Accessible Form Patterns

### [ ] A11Y‑005: Accessible Form Patterns
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** Forms exist but do not consistently associate labels with inputs, mark required fields, announce errors, or use proper input types.  
**Size:** Medium  

**Description:**  
Standardize form accessibility across the entire application:
- Every `<input>`, `<select>`, and `<textarea>` must have a programmatically associated label.
- Required fields marked with both a visual indicator (`*`) and the `aria‑required="true"` attribute.
- Input types declared (`type="email"`, `type="tel"`, `type="number"`, `type="date"`) to trigger appropriate virtual keyboards on mobile.
- Form validation errors announced via `aria‑describedby` and visually associated with the erroring field.
- Grouped fields (radio groups, checkboxes) wrapped in `<fieldset>` with `<legend>`.
- The form element has an accessible name (if multiple forms exist on a page, each must have a unique `aria‑label` or `<legend>`).

**Depends on:** `A11Y‑003` (screen‑reader support)  
**Blocks:** None

**Related Files:** All page components with forms, `artifacts/apex‑os/src/components/ui/form.tsx`, `input.tsx`, `select.tsx`

**Definition of Done**
- [ ] All forms audited; every input has a label or `aria‑label`.  
- [ ] `aria‑required` added to required fields; visual `*` indicator styled consistently.  
- [ ] Input types corrected across the app (`email`, `tel`, `url`, `date`).  
- [ ] Form error messages linked via `aria‑describedby` and visible as red text with an error icon.  
- [ ] Radio/checkbox groups wrapped in `<fieldset>` with `<legend>`.  
- [ ] `eslint‑plugin‑jsx‑a11y` rule `label‑has‑associated‑control` enabled and enforced.  
- [ ] Component tests verify that labels, required indicators, and error associations exist.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm lint  # must pass jsx-a11y rules
pnpm --filter @workspace/apex‑os test -- accessible‑forms.test.tsx
```

---

### Subtasks
- [ ] A11Y‑005.1 (AGENT): Audit every form for missing labels, required markers, and proper input types.
- [ ] A11Y‑005.2 (AGENT): Fix missing labels and add `aria‑required` where needed. **File:** All forms.
- [ ] A11Y‑005.3 (AGENT): Wrap radio/checkbox groups in `<fieldset>`/`<legend>`.
- [ ] A11Y‑005.4 (AGENT): Enable `label‑has‑associated‑control` in ESLint. **File:** `eslint.config.js`
- [ ] A11Y‑005.5 (AGENT): Write component tests. **File:** `artifacts/apex‑os/src/__tests__/accessibility/accessible‑forms.test.tsx`
- [ ] A11Y‑005.6 (HUMAN): Manual review of all form flows.

---

## Accessibility CI Enforcement

### [ ] A11Y‑006: Accessibility CI Enforcement
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No automated accessibility checks in CI. Violations will accumulate without enforcement.  
**Size:** Small  

**Description:**  
Integrate `eslint‑plugin‑jsx‑a11y` into the existing ESLint configuration with rules calibrated to catch WCAG 2.2 AA violations at compile time. Add an axe‑core step to the CI test job that runs automated accessibility checks on the current build and fails on any critical or serious violations. This is the final gate that ensures accessibility does not regress.

**Depends on:** `A11Y‑001` through `A11Y‑005` (violations must be fixed before enforcement)  
**Blocks:** Future accessibility regressions

**Related Files:** `eslint.config.js`, `.github/workflows/ci.yml`, `artifacts/apex‑os/package.json`

**Definition of Done**
- [ ] `eslint‑plugin‑jsx‑a11y` integrated with the following rules enabled as `error`:
  - `alt‑text`
  - `anchor‑has‑content`
  - `aria‑role`
  - `aria‑proptypes`
  - `heading‑has‑content`
  - `html‑has‑lang`
  - `iframe‑has‑title`
  - `img‑redux‑alt` (if applicable)
  - `label‑has‑associated‑control`
  - `no‑redundant‑roles`
  - `role‑has‑required‑aria‑props`
  - `role‑supports‑aria‑props`
  - `scope`
  - `tabindex‑no‑positive`
- [ ] `pnpm lint` runs these rules as part of the existing lint job; PR that violates them fails CI.  
- [ ] Additional CI job: `a11y:check` runs axe‑core against a built version of the app; critical and serious violations fail the build.  
- [ ] Exception list documented: any known false positives or intentionally suppressed violations are justified in `docs/accessibility‑audit‑report.md`.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm lint        # must pass jsx-a11y rules
pnpm a11y:check  # must pass axe-core audit
```

---

### Subtasks
- [ ] A11Y‑006.1 (AGENT): Add `eslint‑plugin‑jsx‑a11y` to devDependencies and configure rules. **File:** `eslint.config.js`
- [ ] A11Y‑006.2 (AGENT): Add `a11y:check` script using axe‑core or `@axe‑core/cli`. **File:** `artifacts/apex‑os/package.json`
- [ ] A11Y‑006.3 (AGENT): Add CI job for accessibility checks. **File:** `.github/workflows/ci.yml`
- [ ] A11Y‑006.4 (AGENT): Fix any remaining lint violations that emerge after enabling strict rules.
- [ ] A11Y‑006.5 (HUMAN): Final review – verify that a PR with an accessibility regression fails CI.

---