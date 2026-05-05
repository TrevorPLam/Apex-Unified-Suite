# Apex Unified Suite - Verified Current-State Analysis

This document reflects the current checked-in code in the live workspace as of May 5, 2026. It is intentionally descriptive rather than aspirational. When a feature is mock-only, visually present but inert, or missing, that is stated directly.

## 1. Executive Summary

- Apex Unified Suite is currently a polished frontend prototype wrapped around a real monorepo, code generation pipeline, and backend/database scaffolding.
- The primary product surface is `artifacts/apex-os`: a React app with nine routed domain pages plus a 404 route, a consistent dark design system, a collapsible sidebar, a header, and a command palette.
- Most domain behavior is local and mock-driven. The frontend does not call any business APIs, does not persist changes, and does not authenticate users.
- The backend is minimal: `artifacts/api-server` exposes only `GET /api/healthz`, which returns `{ "status": "ok" }`.
- The database package is wired to PostgreSQL through Drizzle but has no actual tables.
- The API-first workflow is prepared rather than exercised: the OpenAPI spec defines only `healthz`, and the generated React Query/Zod outputs contain only that contract.
- The most accurate label for the current codebase is "high-fidelity product mockup plus infrastructure scaffolding", not "production-ready SaaS".

## 2. Verified Repository Snapshot

Counts below distinguish between the curated product inventory in `WORKSPACE-MAP.md` and the raw live filesystem shape of this workspace.

- Product-focused inventory from `WORKSPACE-MAP.md`: 201 included files, 39 included directories
- Raw live filesystem count in this workspace, excluding only `.git` and `node_modules`: 368 files, 108 directories
- Applications: 3
- Shared packages: 4
- Main product surface: `artifacts/apex-os`
- Backend surface: `artifacts/api-server`
- Preview surface: `artifacts/mockup-sandbox`

| Surface | Current role | Current reality |
| --- | --- | --- |
| `artifacts/apex-os` | Main user-facing app | Most complete part of the repo; visually rich, mostly mock-backed |
| `artifacts/api-server` | Backend API | Express scaffold with one health route |
| `artifacts/mockup-sandbox` | Component preview app | Infrastructure present, but no mockup components are registered |
| `lib/api-spec` | API contract | Defines only `/healthz` |
| `lib/api-client-react` | Generated client + custom fetch | Client infrastructure exists but is unused by the frontend |
| `lib/api-zod` | Generated Zod schemas | Only health response schema exists |
| `lib/db` | Database access | Pool/Drizzle setup exists, schema is empty |

## 3. Frontend Application Reality (`artifacts/apex-os`)

### 3.0 Boot and runtime prerequisites

- `artifacts/apex-os/vite.config.ts` hard-requires both `PORT` and `BASE_PATH`; if either is missing, Vite throws during config evaluation before the app boots.
- The frontend dev server and preview server both bind `0.0.0.0`, reuse the same `PORT`, and enable `strictPort`.
- Frontend production output is written to `dist/public`.
- Replit-specific Vite plugins (`@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner`) only load when `NODE_ENV !== "production"` and `REPL_ID` is set.
- `artifacts/api-server/src/index.ts` hard-requires a numeric `PORT`.
- `lib/db/src/index.ts` hard-requires `DATABASE_URL`, but the current `artifacts/api-server/src` tree does not import `@workspace/db`, so the live health-only backend is not actually opening a database connection today.
- `.replit` expects the main frontend on `8080`, the backend on `8081`, and Vite preview on `24672`.

### 3.1 Shell, navigation, and look

- The app is mounted in `src/main.tsx` and renders `App` directly. There is no `React.StrictMode`.
- Routing uses Wouter with a base path derived from `import.meta.env.BASE_URL`. It is path-based routing, not hash routing.
- `/` redirects to `/dashboard`.
- All page modules are eagerly imported in `App.tsx`; there is no route-level lazy loading.
- `MainLayout` renders a fixed app shell: collapsible left sidebar, sticky top header, and a scrollable main content area.
- The sidebar exposes nine domain routes: Dashboard, CRM, Projects, Documents, Finance, Assets, Portal, Analytics, and Settings.
- The sidebar collapse control works and animates between narrow and expanded widths using Framer Motion.
- The header shows:
  - a breadcrumb-style label (`ApexOS / <Module>`)
  - a search button that opens the command palette
  - a static notification bell with a blue unread dot
  - a static round avatar button showing `JS`
- The command palette opens from the header button and via `Ctrl+K` / `Cmd+K`.
- The palette contains a single `Pages` group and filters only top-level route labels. It does not search records, commands, or domain data.
- `PageTransition` adds a simple 0.2s fade/slide motion to page content.
- `index.css` defines the live visual language:
  - dark background and card tokens
  - electric blue accent
  - Inter for body text and Space Grotesk for display text
  - hover elevation utilities and light glass-style surfaces
- The repo includes a large `src/components/ui` library, but only a subset of those primitives is exercised by current pages.
- There is no theme switcher, no user session state in the header, and no personalization beyond static labels.

### 3.2 Data and state model in the UI

- `QueryClientProvider` is present in `App.tsx`, but the frontend does not use React Query to fetch business data.
- Search across `artifacts/apex-os/src` shows no usage of the generated API client or `useHealthCheck`.
- Page state is entirely local `useState` for tabs, drawers, selected records, and view toggles.
- Most domain data comes from `src/data/mockData.ts`.
- `mockData.ts` derives many visible dates from `today` using `date-fns`, so deadlines, activities, last-contact fields, due dates, and other date-driven labels shift relative to the day the bundle is evaluated rather than staying fixed to one calendar snapshot.
- Some visible UI data bypasses `mockData.ts` entirely: Analytics chart datasets, the Documents cabinet list, Portal Preview content, and Settings > Integrations all live inside page components instead of the shared mock-data module.
- Form dependencies and form components exist in the repo, but page flows do not use `react-hook-form` or Zod-backed form validation.
- There are no optimistic updates, cache invalidation flows, loading spinners tied to async data, or server-driven empty/error states because there are no real data fetches.

### 3.3 What users actually see by page

#### Dashboard

- Users land on a dark dashboard with:
  - four KPI cards from mock data
  - an `Upcoming Deadlines` card
  - an `Activity Feed` card
  - two top-right CTA buttons: `New Project` and `New Lead`
- The KPI cards and lists are display-only.
- The deadline and activity timestamps are relative mock entries generated from `today` at module-load time.
- The two CTA buttons are styled and clickable but have no handlers.
- There are no charts, drilldowns, filters, or live updates.

#### CRM

- CRM opens on the `Leads` tab.
- Tabs rendered: `Leads`, `Contacts`, `Deals`, `Email`, `Engagements`.
- `Leads` is a static kanban-style column layout built from `crmLeads` mock data.
- Clicking a lead opens a right-side slide-out drawer with:
  - lead/company details
  - mock value/source fields
  - hardcoded activity entries
  - a bottom action button (`Convert to Contact`)
- `Contacts` renders a static table from `crmContacts`; clicking a row opens the same style of slide-out drawer.
- The `Contacts` toolbar buttons (`My Contacts`, `Uncontacted`, `Hot Leads`) are visual only.
- The same drawer component is reused for both leads and contacts, so contact rows inherit generic fallback `Value` and `Source` boxes (`$0` and `Direct`) even though those fields are not part of `crmContacts`.
- `Deals`, `Email`, and `Engagements` do not exist beyond a placeholder panel that says the view is coming soon.
- The top-right `New <item>` button changes label based on the active tab but does not perform any action.

#### Projects

- Projects opens on the `Board` tab by default.
- The default `Board` view is not implemented; users first see a `Board view coming soon` placeholder.
- `My Week` is implemented and shows:
  - three columns (`Focus`, `This Week`, `Later`)
  - task cards pulled from `projectsData.tasks`
  - a placeholder `Mini Calendar UI` box
- The three `My Week` columns are labeled like status buckets, but the current rendering logic distributes tasks by array index modulo 3 rather than by the task `status` field.
- `Projects` is implemented and shows a table of projects from mock data.
- Clicking a project row opens a right-side details drawer with:
  - client name and project title
  - a static tab strip (`Tasks`, `Timeline`, `Time & Budget`, `Details`)
  - only the `Tasks` content is actually rendered
  - three placeholder tasks, one shown as completed
- The top-right `New Project` button and the drawer `Add Task` button are presentational only.
- `Board`, `Templates`, and `Scheduler` are placeholders even though `mockData.ts` contains board data.
- This page feels half built: a real table and drawer exist, but the default entry view is still a stub.

#### Documents

- Documents opens on `Repository`.
- `Repository` is the most complete document view and contains:
  - a left cabinet list with static folder names
  - a search input
  - a table of repository files from mock data
- The top-right `E-Sign` and `Upload` buttons are styled but inert.
- The folder buttons are visual only; the file list does not actually change.
- The search field is visual only; typing does not filter anything.
- The selected cabinet label (`Client Contracts`) and file count (`3 files`) are hardcoded display strings rather than derived from cabinet state.
- Clicking a repository row opens a modal with:
  - a fake document preview canvas
  - share/download buttons
  - static version history entries
- `E-Sign` is implemented as a table using `documentsData.esign`.
- `Workflows` and `Inbox` are placeholders that show `coming soon`.

#### Finance

- Finance opens on `AP`.
- `AP` renders:
  - an approvals queue table from `financeData.ap`
  - approve/reject icon buttons for pending rows
  - a static invoice capture card with a fake inbox address
- The `Run Batch Payment` button is presentational only.
- The approve/reject icon buttons are presentational only; there is no action wiring.
- `Spend` renders:
  - two hardcoded virtual cards
  - a third tile inviting the user to issue a physical card
  - budget-vs-actual bars based on `financeData.spend`
- The `Issue New Card` button and `Issue Physical Card` tile are presentational only.
- `AR` is a placeholder that says `AR view coming soon`.
- `mockData.ts` already contains `financeData.ar`, but the page does not use it.
- Finance looks visually strong but does not yet behave like an actual AP/AR product.

#### Assets

- Assets opens on `Inventory`.
- `Inventory` renders a table from `assetsData`.
- Rows show name, category, location, status, and serial number.
- The top-right `Scan Barcode` and `New Asset` buttons are presentational only.
- Row action affordances appear on hover, but they do not open a menu or invoke any handler.
- There is no detail view, edit flow, checkout flow, or search/filter UI.
- `Check-Out`, `Maintenance`, and `Depreciation` are placeholders.

#### Portal

- Portal opens on `Management`.
- `Management` renders:
  - a client table from `portalClients`
  - a branding card with read-only custom domain and brand color fields
- The `Portal Access` toggle is rendered as a visual switch but is not interactive.
- The management table column is labeled `Last Login`, but the data shown comes from the mock field `portalClients.lastActivity`; there is no separate login/audit source.
- `Preview` is implemented as a light-themed fake client portal:
  - browser chrome
  - `Acme Portal` branding
  - three KPI cards
  - an `Action Required` list with `Review` and `Pay Now` buttons
- The preview buttons are visual only.
- Portal is one of the few pages where both tabs render real UI, but it is still mock-driven and static.

#### Analytics

- Analytics opens on `Overview`.
- Left-side category navigation is implemented.
- `Overview` renders actual Recharts components:
  - area chart for revenue
  - bar chart for lead volume
  - donut chart for lead sources
- All chart data is hardcoded inside the page component.
- The lead-sources donut sits inside a three-column grid that currently renders only one populated chart card.
- `CRM`, `Projects`, `Finance`, `Assets`, and `Custom` all render a placeholder `charts coming soon` state.
- There is no report builder, export flow, or drilldown behavior.

#### Settings

- Settings opens on `Users & Permissions`.
- Left-side category navigation is implemented.
- `Users & Permissions` renders a table from `settingsUsers`.
- The `Invite User` button is styled but inert.
- Each row includes:
  - initials avatar
  - email
  - role `<select>`
  - a styled status toggle
- The role select can be changed in the DOM but is not saved anywhere.
- The status toggle is a styled `div`, not an interactive control.
- `Integrations` renders six static cards (`Stripe`, `Salesforce`, `QuickBooks`, `Google Drive`, `Slack`, `DocuSign`) with `Connected`/`Not Connected` badges and inert buttons.
- `General`, `Email & Notifications`, `Audit Log`, `Billing`, and `API & Webhooks` all show placeholder `settings coming soon` panels.

#### NotFound

- Unknown routes render a light-gray 404 card with the message `Did you forget to add the page to the router?`
- Because `NotFound` is rendered inside `MainLayout`, the page appears inside the main shell but uses a much lighter visual style than the rest of the app.
- It reads as a developer-facing placeholder, not a polished user-facing 404.

### 3.4 Cross-cutting UX observations

- The app feels consistent at the shell and component level.
- Many surfaces are intentionally styled to look interactive even when they are not yet wired.
- That mismatch is especially visible in prominent CTA/button surfaces such as `New Project`, `New Lead`, `Upload`, `Run Batch Payment`, `Invite User`, `Scan Barcode`, and several card/action affordances inside drawers and tables.
- There are no live toasts triggered by current domain flows, even though toaster infrastructure is present.
- There is no auth gate, onboarding flow, tenant switching, real notifications panel, global entity search, or saved personalization.
- Several pages are stronger as visual mockups than as product workflows:
  - CRM has partial drawers but three empty tabs
  - Projects defaults to an empty tab
  - Documents has a strong preview modal but fake search/folder state
  - Finance has mock tables and visuals but no mutation logic
  - Analytics has one real chart screen and five empty categories

## 4. Backend, API, and shared packages

### 4.1 `artifacts/api-server`

- The backend is a very small Express 5 ESM app.
- `src/app.ts` wires:
  - `pino-http`
  - default `cors()`
  - JSON parsing
  - URL-encoded form parsing
  - `/api` router mount
- `src/index.ts` requires a numeric `PORT` environment variable and refuses to start without it.
- `src/routes/index.ts` mounts only one router: `healthRouter`.
- `src/routes/health.ts` returns `HealthCheckResponse.parse({ status: "ok" })`.
- The health response is only `{ status: "ok" }`; it does not include `timestamp`, `uptime`, or any dependency checks.
- There are no business routes, no auth middleware, no RBAC, no request validation beyond the health response schema, no database queries, and no global error mapping layer.
- `src/middlewares/` is empty except for `.gitkeep`.
- `cookie-parser` is installed in `package.json` but unused in the app.
- `src/lib/logger.ts` is solid for the current scale:
  - redacts authorization and cookie data
  - pretty-prints outside production

### 4.2 API contract and generated client packages

- `lib/api-spec/openapi.yaml` defines one server base (`/api`) and one path (`/healthz`).
- `lib/api-spec/orval.config.ts` correctly generates two outputs from that spec:
  - React Query client code into `lib/api-client-react/src/generated`
  - Zod schemas into `lib/api-zod/src/generated`
- `lib/api-client-react/src/generated/api.ts` currently exports:
  - `healthCheck`
  - `getHealthCheckQueryOptions`
  - `useHealthCheck`
- `lib/api-client-react/src/custom-fetch.ts` is more mature than the rest of the app:
  - optional base URL override
  - optional async bearer token getter
  - media-type aware parsing
  - typed `ApiError` and `ResponseParseError`
- `lib/api-client-react/src/index.ts` re-exports the generated API surface, generated schema/types, `setBaseUrl`, and `setAuthTokenGetter`, so the package is ready to be consumed from its root entrypoint.
- That client is not currently used anywhere in `artifacts/apex-os/src`.
- `lib/api-zod/src/generated/api.ts` exports only `HealthCheckResponse`.
- `lib/api-zod/src/index.ts` re-exports both the generated schema file and generated type helpers.

### 4.3 Database layer

- `lib/db/src/index.ts` creates a `pg.Pool` and Drizzle instance and throws immediately if `DATABASE_URL` is missing.
- `lib/db/src/schema/index.ts` is still a commented template with example code only.
- There are no real tables, relations, or migrations in the included tree.
- `@workspace/db` is declared as a backend dependency, but the current `artifacts/api-server/src` tree does not import it at all, so the running health-only API is not actually touching PostgreSQL today.

### 4.4 `artifacts/mockup-sandbox`

- The sandbox is a second Vite app intended to preview isolated components.
- `src/App.tsx` has two behaviors:
  - show a simple gallery/instructions page
  - load a component from `/preview/<component path>`
- `mockupPreviewPlugin.ts` watches `src/components/mockups/**/*.tsx` and rebuilds `src/.generated/mockup-components.ts`.
- In the current tree:
  - `src/components/mockups` does not exist
  - `src/.generated/mockup-components.ts` exports an empty registry
- Result: the sandbox infrastructure is present, but there are no actual previewable mockups checked in.

## 5. Security, tooling, and quality posture

### 5.1 What is meaningfully present

- `pnpm-workspace.yaml` includes real supply-chain controls:
  - `minimumReleaseAge: 1440`
  - a narrow allowlist for early installs
  - extensive platform/binary exclusions
  - centralized catalog versions
- `tsconfig.base.json` enables strict TypeScript settings.
- `eslint.config.js` contains TypeScript lint rules plus bounded-context import restrictions.
- The backend logger redacts sensitive headers.
- The codegen pipeline is in place and coherent.

### 5.2 What is not yet present in the product itself

- No authentication UI
- No backend auth or protected API surface
- No RBAC enforcement
- No persisted domain data
- No jobs/queues, notifications, or background processing in the checked-in app code
- No file upload implementation beyond mock UI
- No real integrations with Stripe, Plaid, calendars, storage providers, or email providers
- No committed runtime test suite under `artifacts/` or `lib/`
- No error boundaries or recoverable async failure flows in the frontend
- No real API consumption by the frontend

### 5.3 Tooling drift and script caveats

- Root `package.json` exposes `consolidate-skills`, `consolidate-docs`, and `consolidate-tasks`, but the referenced Node `.cjs` files are missing.
- `.replit` points to `scripts/post-merge.sh`, but that file is absent from the current tree.
- `scripts/` currently contains only `consolidate-tasks.ps1`, so the one surviving consolidation utility is PowerShell-based while the root scripts still point at missing Node wrappers.
- The root `preinstall` script uses `sh -c`.
- `artifacts/api-server/package.json` uses POSIX `export NODE_ENV=development && ...` in its `dev` script.
- Those script choices fit a Replit/POSIX environment better than a plain Windows shell.
- Default backend CORS is permissive because the app calls `cors()` with no explicit origin policy.

### 5.4 Current workspace diagnostics

- In the current editor session, `artifacts/apex-os/tsconfig.json` reports missing `node` and `vite/client` type definition files, which indicates unresolved frontend dependencies in this environment.
- The active shell has `node` available, but `pnpm` is not on `PATH`, so the repo’s standard root commands cannot currently be executed from this terminal without additional setup.
- Independent of that environment issue, the checked-in `artifacts/apex-os/src/pages/Finance.tsx` source contains two obvious unresolved icon references by inspection: `Mail` and `Plus` are used in JSX but are not imported from `lucide-react`.

## 6. Current maturity assessment

| Area | Current state |
| --- | --- |
| App shell and visual design | Strong and cohesive |
| Routed page coverage | Broad |
| Domain interactivity | Partial and mostly local-only |
| Persisted business logic | Not present |
| API surface | Minimal |
| Database model | Empty scaffold |
| Generated client/schema workflow | Ready but barely used |
| Testing | No committed test suite in included tree |
| Operational scripts | Partly stale or missing |
| Production readiness | Not ready |

A more precise maturity summary:

- `artifacts/apex-os` is a high-quality design prototype with working navigation and selective page depth.
- `artifacts/api-server` is a bootstrap backend, not a domain API.
- `lib/db` and the codegen packages are scaffolding for future implementation, not evidence of completed end-to-end flows.

## 7. Bottom line

Apex Unified Suite currently presents itself as a unified business SaaS at the UI layer, and users can click through a convincing dark-theme shell across CRM, projects, documents, finance, assets, portal, analytics, and settings. What they experience today is mostly a guided product mockup: tab changes, drawers, charts, previews, and tables work locally, but almost all business actions stop at the UI.

The repo is well-organized and the foundations are sensible. The frontend shell is ahead of the backend by a large margin. The backend, database, and test layers are still at the "prepare the rails" stage, while the frontend is at the "show the product shape" stage. The truthful current description is: a polished, mock-driven frontend prototype with real monorepo, API, and database scaffolding, but without implemented domain persistence or end-to-end workflows.