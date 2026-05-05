# Apex Unified Suite - Verified Workspace Map

Verified against the live working tree on May 5, 2026.

## Scope

This map inventories the repository contents that are part of the current product and shared-code tree. The inventory explicitly excludes `.windsurf/` and `tasks/` per request, and also excludes `.git/` because Git internals are repository metadata rather than project source. All counts below refer only to the included tree.

## Verified Snapshot

- Included directories: 39
- Included files: 201
- Top-level included directories: 3 (`artifacts/`, `attached_assets/`, `lib/`)
- Root-level files: 15
- Deployable applications: 3
- Shared packages: 4
- `artifacts/apex-os/`: 11 directories, 85 files
- `artifacts/api-server/`: 6 directories, 11 files
- `artifacts/mockup-sandbox/`: 8 directories, 69 files
- `attached_assets/`: 1 directory, 1 file
- Shared libraries under `lib/`: 11 directories, 20 files

## Current State

- `artifacts/apex-os/` is the most complete product surface and is still driven by `artifacts/apex-os/src/data/mockData.ts`.
- `artifacts/api-server/` currently exposes only one route, `GET /api/healthz`, and validates the response with generated Zod output.
- `lib/api-spec/openapi.yaml` defines only the health-check contract, and the generated client/Zod packages reflect that single endpoint.
- `lib/db/src/schema/index.ts` is still a scaffold template; there are no concrete Drizzle tables in the current tree.
- All three application packages contain `.replit-artifact/artifact.toml`; those directories are not empty.
- The root workspace manifest still defines `consolidate-*` commands that point at helper paths not present in this checkout: `scripts/`, `scripts/consolidate-skills.cjs`, `scripts/consolidate-docs.cjs`, and `scripts/consolidate-tasks.cjs`.
- `artifacts/mockup-sandbox/mockupPreviewPlugin.ts` watches `src/components/mockups/**/*.tsx`, but that source directory does not exist in the current tree; only the generated registry file exists.

## Root Inventory

- `artifacts/` - Top-level directory containing the three application packages.
- `attached_assets/` - Top-level directory containing supplemental authored assets checked into the repository.
- `lib/` - Top-level directory containing the shared workspace packages.
- `.gitignore` - Git ignore rules for dependencies, build output, editor state, and local artifacts.
- `.npmrc` - npm/pnpm configuration that controls workspace install behavior.
- `.replit` - Replit runtime, port, and deployment configuration for the workspace.
- `.replitignore` - Replit ignore rules for files that should stay out of deployment/build sync.
- `AGENTS.md` - Repository-specific AI agent instructions, constraints, and workflow guidance.
- `ANALYSIS.md` - Human-authored narrative analysis of the codebase; useful context, but not the authoritative live inventory.
- `eslint.config.js` - Root ESLint configuration for workspace linting.
- `FRAMEWORK.md` - Project-agnostic methodology and delivery framework reference.
- `package.json` - Root workspace manifest with install, build, typecheck, lint, and consolidation scripts.
- `pnpm-lock.yaml` - Exact dependency lockfile for the workspace.
- `pnpm-workspace.yaml` - pnpm workspace membership, catalog, and package policy configuration.
- `replit.md` - Short Replit notes for running or deploying the workspace.
- `tsconfig.base.json` - Shared TypeScript compiler baseline used by workspace packages.
- `tsconfig.json` - Root TypeScript project-references file.
- `WORKSPACE-MAP.md` - This verified repository inventory.

## artifacts/apex-os

### Directories

- `artifacts/apex-os/` - Main React 19 frontend application for Apex OS.
- `artifacts/apex-os/.replit-artifact/` - Replit artifact metadata directory for the frontend package.
- `artifacts/apex-os/public/` - Public assets served directly by the frontend build.
- `artifacts/apex-os/src/` - Frontend source tree.
- `artifacts/apex-os/src/components/` - Reusable React components for layout and UI.
- `artifacts/apex-os/src/components/layout/` - Shell components that build the app frame.
- `artifacts/apex-os/src/components/ui/` - Shared UI primitives and wrappers used across the frontend.
- `artifacts/apex-os/src/data/` - Mock data used by the current product UI.
- `artifacts/apex-os/src/hooks/` - Frontend hooks for responsive state and toast behavior.
- `artifacts/apex-os/src/lib/` - Frontend utility helpers.
- `artifacts/apex-os/src/pages/` - Route-level business domain pages.

### Package and Entry Files

- `artifacts/apex-os/components.json` - shadcn/ui generator configuration for the frontend package.
- `artifacts/apex-os/index.html` - Vite HTML entry document for the frontend.
- `artifacts/apex-os/package.json` - Frontend package manifest with React, Vite, UI, form, and chart dependencies.
- `artifacts/apex-os/tsconfig.json` - Frontend-specific TypeScript configuration.
- `artifacts/apex-os/vite.config.ts` - Vite build and dev-server configuration for the frontend app.
- `artifacts/apex-os/.replit-artifact/artifact.toml` - Replit artifact manifest describing how the frontend artifact is built and served.
- `artifacts/apex-os/public/favicon.svg` - Frontend favicon.
- `artifacts/apex-os/public/opengraph.jpg` - Social/Open Graph preview image for the frontend.
- `artifacts/apex-os/src/App.tsx` - Top-level app component that wires React Query, Wouter routes, the shell layout, and toasts.
- `artifacts/apex-os/src/index.css` - Global styles, design tokens, and Tailwind layer definitions.
- `artifacts/apex-os/src/main.tsx` - React entrypoint that mounts the frontend app.

### Shell and Layout Files

- `artifacts/apex-os/src/components/CommandPalette.tsx` - Global command-palette component for keyboard-driven navigation/actions.
- `artifacts/apex-os/src/components/layout/Header.tsx` - Top header bar used by the main application shell.
- `artifacts/apex-os/src/components/layout/MainLayout.tsx` - Main application frame that wraps routed pages.
- `artifacts/apex-os/src/components/layout/Sidebar.tsx` - Primary left-navigation sidebar for domain switching.

### UI Primitive Files

- `artifacts/apex-os/src/components/ui/accordion.tsx` - Accordion primitive wrapper.
- `artifacts/apex-os/src/components/ui/alert-dialog.tsx` - Confirmation dialog primitives.
- `artifacts/apex-os/src/components/ui/alert.tsx` - Inline alert banner component.
- `artifacts/apex-os/src/components/ui/aspect-ratio.tsx` - Aspect-ratio utility wrapper.
- `artifacts/apex-os/src/components/ui/avatar.tsx` - Avatar primitive wrapper.
- `artifacts/apex-os/src/components/ui/badge.tsx` - Badge component for compact status/value display.
- `artifacts/apex-os/src/components/ui/breadcrumb.tsx` - Breadcrumb navigation component.
- `artifacts/apex-os/src/components/ui/button-group.tsx` - Grouped-button layout primitives.
- `artifacts/apex-os/src/components/ui/button.tsx` - Button variants and shared button styles.
- `artifacts/apex-os/src/components/ui/calendar.tsx` - Calendar/date-picker wrapper.
- `artifacts/apex-os/src/components/ui/card.tsx` - Card layout primitives.
- `artifacts/apex-os/src/components/ui/carousel.tsx` - Embla-based carousel primitives.
- `artifacts/apex-os/src/components/ui/chart.tsx` - Recharts container, styling, and helper components.
- `artifacts/apex-os/src/components/ui/checkbox.tsx` - Checkbox primitive wrapper.
- `artifacts/apex-os/src/components/ui/collapsible.tsx` - Collapsible container primitive.
- `artifacts/apex-os/src/components/ui/command.tsx` - cmdk-based command-menu primitives.
- `artifacts/apex-os/src/components/ui/context-menu.tsx` - Context-menu primitives.
- `artifacts/apex-os/src/components/ui/dialog.tsx` - Modal dialog primitives.
- `artifacts/apex-os/src/components/ui/drawer.tsx` - Drawer component based on `vaul`.
- `artifacts/apex-os/src/components/ui/dropdown-menu.tsx` - Dropdown-menu primitives.
- `artifacts/apex-os/src/components/ui/empty.tsx` - Empty-state presentation component.
- `artifacts/apex-os/src/components/ui/field.tsx` - Form-field layout helpers.
- `artifacts/apex-os/src/components/ui/form.tsx` - React Hook Form bindings and form helpers.
- `artifacts/apex-os/src/components/ui/hover-card.tsx` - Hover-card primitives.
- `artifacts/apex-os/src/components/ui/input-group.tsx` - Input-group wrappers and adornment helpers.
- `artifacts/apex-os/src/components/ui/input-otp.tsx` - OTP-input wrapper.
- `artifacts/apex-os/src/components/ui/input.tsx` - Shared text-input component.
- `artifacts/apex-os/src/components/ui/item.tsx` - Reusable item-row/list presentation primitive.
- `artifacts/apex-os/src/components/ui/kbd.tsx` - Keyboard-shortcut badge component.
- `artifacts/apex-os/src/components/ui/label.tsx` - Form-label primitive wrapper.
- `artifacts/apex-os/src/components/ui/menubar.tsx` - Menubar primitives.
- `artifacts/apex-os/src/components/ui/navigation-menu.tsx` - Navigation-menu primitives.
- `artifacts/apex-os/src/components/ui/PageTransition.tsx` - Small animation wrapper for page transitions.
- `artifacts/apex-os/src/components/ui/pagination.tsx` - Pagination controls.
- `artifacts/apex-os/src/components/ui/popover.tsx` - Popover primitives.
- `artifacts/apex-os/src/components/ui/progress.tsx` - Progress-bar primitive.
- `artifacts/apex-os/src/components/ui/radio-group.tsx` - Radio-group primitives.
- `artifacts/apex-os/src/components/ui/resizable.tsx` - Resizable-panel wrapper.
- `artifacts/apex-os/src/components/ui/scroll-area.tsx` - Custom scroll-area primitive.
- `artifacts/apex-os/src/components/ui/select.tsx` - Select primitives.
- `artifacts/apex-os/src/components/ui/separator.tsx` - Visual separator primitive.
- `artifacts/apex-os/src/components/ui/sheet.tsx` - Sheet/side-panel primitives.
- `artifacts/apex-os/src/components/ui/sidebar.tsx` - Reusable sidebar system and related sidebar UI pieces.
- `artifacts/apex-os/src/components/ui/skeleton.tsx` - Loading-skeleton primitive.
- `artifacts/apex-os/src/components/ui/slider.tsx` - Slider primitive wrapper.
- `artifacts/apex-os/src/components/ui/sonner.tsx` - Sonner toast wrapper.
- `artifacts/apex-os/src/components/ui/spinner.tsx` - Loading-spinner primitive.
- `artifacts/apex-os/src/components/ui/switch.tsx` - Switch/toggle-control primitive.
- `artifacts/apex-os/src/components/ui/table.tsx` - Table primitives.
- `artifacts/apex-os/src/components/ui/tabs.tsx` - Tab primitives.
- `artifacts/apex-os/src/components/ui/textarea.tsx` - Shared textarea component.
- `artifacts/apex-os/src/components/ui/toast.tsx` - Radix toast primitives.
- `artifacts/apex-os/src/components/ui/toaster.tsx` - Toast host component used by the app shell.
- `artifacts/apex-os/src/components/ui/toggle-group.tsx` - Toggle-group primitives.
- `artifacts/apex-os/src/components/ui/toggle.tsx` - Toggle primitive wrapper.
- `artifacts/apex-os/src/components/ui/tooltip.tsx` - Tooltip primitives.

### Data, Hooks, Utilities, and Pages

- `artifacts/apex-os/src/data/mockData.ts` - Central mock dataset that powers the current frontend modules.
- `artifacts/apex-os/src/hooks/use-mobile.tsx` - Hook for mobile/breakpoint detection.
- `artifacts/apex-os/src/hooks/use-toast.ts` - Hook and state helpers for toast notifications.
- `artifacts/apex-os/src/lib/utils.ts` - Shared frontend utility helpers.
- `artifacts/apex-os/src/pages/Analytics.tsx` - Analytics module page.
- `artifacts/apex-os/src/pages/Assets.tsx` - Asset-management module page.
- `artifacts/apex-os/src/pages/CRM.tsx` - CRM module page.
- `artifacts/apex-os/src/pages/Dashboard.tsx` - Dashboard landing page.
- `artifacts/apex-os/src/pages/Documents.tsx` - Document-management module page.
- `artifacts/apex-os/src/pages/Finance.tsx` - Finance module page.
- `artifacts/apex-os/src/pages/not-found.tsx` - Not-found/404 route component.
- `artifacts/apex-os/src/pages/Portal.tsx` - Client-portal module page.
- `artifacts/apex-os/src/pages/Projects.tsx` - Project-management module page.
- `artifacts/apex-os/src/pages/Settings.tsx` - Settings module page.

## artifacts/api-server

### Directories

- `artifacts/api-server/` - Express 5 backend application package.
- `artifacts/api-server/.replit-artifact/` - Replit artifact metadata directory for the backend package.
- `artifacts/api-server/src/` - Backend source tree.
- `artifacts/api-server/src/lib/` - Backend library helpers.
- `artifacts/api-server/src/middlewares/` - Placeholder directory for Express middleware modules.
- `artifacts/api-server/src/routes/` - Route modules mounted by the API server.

### Files

- `artifacts/api-server/build.mjs` - esbuild script that bundles the backend into `dist/index.mjs`.
- `artifacts/api-server/package.json` - Backend package manifest with Express, Drizzle, Pino, and build scripts.
- `artifacts/api-server/tsconfig.json` - Backend-specific TypeScript configuration.
- `artifacts/api-server/.replit-artifact/artifact.toml` - Replit artifact manifest describing backend build/run behavior.
- `artifacts/api-server/src/app.ts` - Express app setup with pino-http logging, CORS, body parsing, and `/api` route mounting.
- `artifacts/api-server/src/index.ts` - Backend entrypoint that validates `PORT` and starts the Express app.
- `artifacts/api-server/src/lib/.gitkeep` - Placeholder file that keeps the backend lib directory in Git.
- `artifacts/api-server/src/lib/logger.ts` - Shared Pino logger with redaction and pretty-print transport outside production.
- `artifacts/api-server/src/middlewares/.gitkeep` - Placeholder file that keeps the middlewares directory in Git.
- `artifacts/api-server/src/routes/health.ts` - Health-check route that returns a Zod-validated `{ status: "ok" }` response.
- `artifacts/api-server/src/routes/index.ts` - Route aggregator for the backend API package.

## artifacts/mockup-sandbox

### Directories

- `artifacts/mockup-sandbox/` - Standalone Vite sandbox used to preview generated/mockup components.
- `artifacts/mockup-sandbox/.replit-artifact/` - Replit artifact metadata directory for the sandbox package.
- `artifacts/mockup-sandbox/src/` - Sandbox source tree.
- `artifacts/mockup-sandbox/src/.generated/` - Generated sandbox source output directory.
- `artifacts/mockup-sandbox/src/components/` - Sandbox component directory.
- `artifacts/mockup-sandbox/src/components/ui/` - Sandbox-local copies of UI primitives used for previewing.
- `artifacts/mockup-sandbox/src/hooks/` - Sandbox hooks.
- `artifacts/mockup-sandbox/src/lib/` - Sandbox utility helpers.

### Package and Entry Files

- `artifacts/mockup-sandbox/components.json` - shadcn/ui generator configuration for the sandbox package.
- `artifacts/mockup-sandbox/index.html` - Vite HTML entry document for the sandbox.
- `artifacts/mockup-sandbox/mockupPreviewPlugin.ts` - Vite plugin that scans mockup component files and regenerates the sandbox module registry.
- `artifacts/mockup-sandbox/package.json` - Sandbox package manifest with Vite, React, UI, and file-watching dependencies.
- `artifacts/mockup-sandbox/tsconfig.json` - Sandbox-specific TypeScript configuration.
- `artifacts/mockup-sandbox/vite.config.ts` - Vite build and dev-server configuration for the sandbox.
- `artifacts/mockup-sandbox/.replit-artifact/artifact.toml` - Replit artifact manifest describing sandbox build/run behavior.
- `artifacts/mockup-sandbox/src/App.tsx` - Top-level sandbox application component.
- `artifacts/mockup-sandbox/src/index.css` - Global styles for the sandbox.
- `artifacts/mockup-sandbox/src/main.tsx` - React entrypoint that mounts the sandbox app.
- `artifacts/mockup-sandbox/src/.generated/mockup-components.ts` - Generated registry of previewable mockup component modules.

### UI Primitive Files

- `artifacts/mockup-sandbox/src/components/ui/accordion.tsx` - Sandbox copy of the accordion primitive wrapper.
- `artifacts/mockup-sandbox/src/components/ui/alert-dialog.tsx` - Sandbox copy of the confirmation-dialog primitives.
- `artifacts/mockup-sandbox/src/components/ui/alert.tsx` - Sandbox copy of the inline alert banner.
- `artifacts/mockup-sandbox/src/components/ui/aspect-ratio.tsx` - Sandbox copy of the aspect-ratio utility wrapper.
- `artifacts/mockup-sandbox/src/components/ui/avatar.tsx` - Sandbox copy of the avatar primitive wrapper.
- `artifacts/mockup-sandbox/src/components/ui/badge.tsx` - Sandbox copy of the badge component.
- `artifacts/mockup-sandbox/src/components/ui/breadcrumb.tsx` - Sandbox copy of the breadcrumb component.
- `artifacts/mockup-sandbox/src/components/ui/button-group.tsx` - Sandbox copy of the grouped-button layout primitives.
- `artifacts/mockup-sandbox/src/components/ui/button.tsx` - Sandbox copy of the shared button component.
- `artifacts/mockup-sandbox/src/components/ui/calendar.tsx` - Sandbox copy of the calendar wrapper.
- `artifacts/mockup-sandbox/src/components/ui/card.tsx` - Sandbox copy of the card primitives.
- `artifacts/mockup-sandbox/src/components/ui/carousel.tsx` - Sandbox copy of the carousel primitives.
- `artifacts/mockup-sandbox/src/components/ui/chart.tsx` - Sandbox copy of the chart container and helpers.
- `artifacts/mockup-sandbox/src/components/ui/checkbox.tsx` - Sandbox copy of the checkbox primitive.
- `artifacts/mockup-sandbox/src/components/ui/collapsible.tsx` - Sandbox copy of the collapsible primitive.
- `artifacts/mockup-sandbox/src/components/ui/command.tsx` - Sandbox copy of the command-menu primitives.
- `artifacts/mockup-sandbox/src/components/ui/context-menu.tsx` - Sandbox copy of the context-menu primitives.
- `artifacts/mockup-sandbox/src/components/ui/dialog.tsx` - Sandbox copy of the dialog primitives.
- `artifacts/mockup-sandbox/src/components/ui/drawer.tsx` - Sandbox copy of the drawer component.
- `artifacts/mockup-sandbox/src/components/ui/dropdown-menu.tsx` - Sandbox copy of the dropdown-menu primitives.
- `artifacts/mockup-sandbox/src/components/ui/empty.tsx` - Sandbox copy of the empty-state component.
- `artifacts/mockup-sandbox/src/components/ui/field.tsx` - Sandbox copy of the form-field helpers.
- `artifacts/mockup-sandbox/src/components/ui/form.tsx` - Sandbox copy of the form helpers and bindings.
- `artifacts/mockup-sandbox/src/components/ui/hover-card.tsx` - Sandbox copy of the hover-card primitives.
- `artifacts/mockup-sandbox/src/components/ui/input-group.tsx` - Sandbox copy of the input-group helpers.
- `artifacts/mockup-sandbox/src/components/ui/input-otp.tsx` - Sandbox copy of the OTP-input wrapper.
- `artifacts/mockup-sandbox/src/components/ui/input.tsx` - Sandbox copy of the text-input component.
- `artifacts/mockup-sandbox/src/components/ui/item.tsx` - Sandbox copy of the reusable item-row/list primitive.
- `artifacts/mockup-sandbox/src/components/ui/kbd.tsx` - Sandbox copy of the keyboard-shortcut badge.
- `artifacts/mockup-sandbox/src/components/ui/label.tsx` - Sandbox copy of the label primitive.
- `artifacts/mockup-sandbox/src/components/ui/menubar.tsx` - Sandbox copy of the menubar primitives.
- `artifacts/mockup-sandbox/src/components/ui/navigation-menu.tsx` - Sandbox copy of the navigation-menu primitives.
- `artifacts/mockup-sandbox/src/components/ui/pagination.tsx` - Sandbox copy of the pagination controls.
- `artifacts/mockup-sandbox/src/components/ui/popover.tsx` - Sandbox copy of the popover primitives.
- `artifacts/mockup-sandbox/src/components/ui/progress.tsx` - Sandbox copy of the progress-bar primitive.
- `artifacts/mockup-sandbox/src/components/ui/radio-group.tsx` - Sandbox copy of the radio-group primitives.
- `artifacts/mockup-sandbox/src/components/ui/resizable.tsx` - Sandbox copy of the resizable-panel wrapper.
- `artifacts/mockup-sandbox/src/components/ui/scroll-area.tsx` - Sandbox copy of the scroll-area primitive.
- `artifacts/mockup-sandbox/src/components/ui/select.tsx` - Sandbox copy of the select primitives.
- `artifacts/mockup-sandbox/src/components/ui/separator.tsx` - Sandbox copy of the separator primitive.
- `artifacts/mockup-sandbox/src/components/ui/sheet.tsx` - Sandbox copy of the sheet primitives.
- `artifacts/mockup-sandbox/src/components/ui/sidebar.tsx` - Sandbox copy of the sidebar UI system.
- `artifacts/mockup-sandbox/src/components/ui/skeleton.tsx` - Sandbox copy of the loading-skeleton primitive.
- `artifacts/mockup-sandbox/src/components/ui/slider.tsx` - Sandbox copy of the slider primitive.
- `artifacts/mockup-sandbox/src/components/ui/sonner.tsx` - Sandbox copy of the Sonner wrapper.
- `artifacts/mockup-sandbox/src/components/ui/spinner.tsx` - Sandbox copy of the loading-spinner primitive.
- `artifacts/mockup-sandbox/src/components/ui/switch.tsx` - Sandbox copy of the switch primitive.
- `artifacts/mockup-sandbox/src/components/ui/table.tsx` - Sandbox copy of the table primitives.
- `artifacts/mockup-sandbox/src/components/ui/tabs.tsx` - Sandbox copy of the tab primitives.
- `artifacts/mockup-sandbox/src/components/ui/textarea.tsx` - Sandbox copy of the textarea component.
- `artifacts/mockup-sandbox/src/components/ui/toast.tsx` - Sandbox copy of the toast primitives.
- `artifacts/mockup-sandbox/src/components/ui/toaster.tsx` - Sandbox copy of the toast host component.
- `artifacts/mockup-sandbox/src/components/ui/toggle-group.tsx` - Sandbox copy of the toggle-group primitives.
- `artifacts/mockup-sandbox/src/components/ui/toggle.tsx` - Sandbox copy of the toggle primitive.
- `artifacts/mockup-sandbox/src/components/ui/tooltip.tsx` - Sandbox copy of the tooltip primitives.

### Hooks and Utilities

- `artifacts/mockup-sandbox/src/hooks/use-mobile.tsx` - Sandbox hook for mobile/breakpoint detection.
- `artifacts/mockup-sandbox/src/hooks/use-toast.ts` - Sandbox toast-state hook and helpers.
- `artifacts/mockup-sandbox/src/lib/utils.ts` - Sandbox utility helpers.

## attached_assets

### Directory

- `attached_assets/` - Supplemental asset directory for pasted source material and design prompts.

### Files

- `attached_assets/Pasted-Build-ApexOS-a-unified-business-management-SaaS-with-a-_1777660655466.txt` - Pasted product/UI brief that describes the intended Apex OS information architecture, tabs, and visual direction.

## lib/api-client-react

### Directories

- `lib/api-client-react/` - Shared package that exposes generated React Query hooks and the custom fetch client.
- `lib/api-client-react/src/` - Source tree for the React API client package.
- `lib/api-client-react/src/generated/` - Generated API client output directory.

### Files

- `lib/api-client-react/package.json` - Package manifest for the shared React API client library.
- `lib/api-client-react/tsconfig.json` - TypeScript configuration for the API client package.
- `lib/api-client-react/src/custom-fetch.ts` - Shared fetch implementation with auth-token support, parsing helpers, and typed error handling.
- `lib/api-client-react/src/index.ts` - Package entrypoint that re-exports the client surface.
- `lib/api-client-react/src/generated/api.schemas.ts` - Generated TypeScript schema/types file derived from the OpenAPI spec.
- `lib/api-client-react/src/generated/api.ts` - Generated React Query hook and request helpers for the health-check endpoint.

## lib/api-spec

### Directory

- `lib/api-spec/` - Shared package that owns the workspace OpenAPI contract and codegen configuration.

### Files

- `lib/api-spec/openapi.yaml` - Current OpenAPI 3.1 specification; it defines only the `GET /healthz` endpoint and `HealthStatus` schema.
- `lib/api-spec/orval.config.ts` - Orval configuration that generates the React client and Zod outputs from the spec.
- `lib/api-spec/package.json` - Package manifest for the API-spec/codegen package.

## lib/api-zod

### Directories

- `lib/api-zod/` - Shared package that exports generated Zod schemas from the OpenAPI contract.
- `lib/api-zod/src/` - Source tree for the generated Zod package.
- `lib/api-zod/src/generated/` - Generated Zod output directory.
- `lib/api-zod/src/generated/types/` - Generated type-support directory for schema-specific exports.

### Files

- `lib/api-zod/package.json` - Package manifest for the generated Zod schema library.
- `lib/api-zod/tsconfig.json` - TypeScript configuration for the Zod package.
- `lib/api-zod/src/index.ts` - Package entrypoint that re-exports generated schemas.
- `lib/api-zod/src/generated/api.ts` - Generated Zod schema file containing the `HealthCheckResponse` schema.
- `lib/api-zod/src/generated/types/healthStatus.ts` - Generated type/schema support for the `HealthStatus` contract.
- `lib/api-zod/src/generated/types/index.ts` - Barrel export for generated type-support files.

## lib/db

### Directories

- `lib/db/` - Shared database package for Drizzle ORM and PostgreSQL access.
- `lib/db/src/` - Database package source tree.
- `lib/db/src/schema/` - Directory reserved for Drizzle table/schema definitions.

### Files

- `lib/db/drizzle.config.ts` - Drizzle configuration that points at the schema entry file and uses environment-provided database credentials.
- `lib/db/package.json` - Package manifest for the database layer, including `push` and `push-force` scripts.
- `lib/db/tsconfig.json` - TypeScript configuration for the database package.
- `lib/db/src/index.ts` - Database bootstrap that requires `DATABASE_URL`, creates the `pg` pool, and exports the Drizzle instance.
- `lib/db/src/schema/index.ts` - Placeholder schema scaffold that documents how future Drizzle tables and insert schemas should be added.