# Gaps, Bugs, and Open Decisions

Open items only. Resolved work is in
[implementation-history.md](./implementation-history.md).

## Navigation and layout

- Former dashboard Profile screen is parked and unrouted; legacy `/profile`
  redirects to `/` (the résumé). Source retained.
- No sidebar keyboard shortcut (the Spartan version had one). Not planned.
- Desktop collapse only; the mobile panel always opens full width.

## Dashboard / Overview

- Card data is entirely server-driven; empty response shows an empty state, no
  static fallback.

## Timeline

- Add/edit are implemented; delete is deferred despite the API exposing it.
- `projects` and server-derived `durationMonths` are read-only in the experience
  form. Projects are created from the routed per-experience projects page.
- Project edit is implemented for name/description/contribution on the project
  details screen; project delete is not, even though the API exposes it.
- Stacks on routed project-page rows are read-only. Project add/edit stay
  fields-only because the deployed API rejects `techStackIds` on
  `CreateProjectRequest`/`UpdateProjectRequest` (`additionalProperties: false`);
  use **View project** to edit skills. Category/skill catalog administration
  lives in Toolbox.
- The project skills picker is a combobox: typing opens a listbox of unused
  stacks, arrow keys choose a result, **Enter** or a click adds it, and added
  stacks become removable chips. Category grouping and browsing are deferred.
- Project stack IDs that exist on a project but are missing from `v1/skill` are
  not shown as chips; preserving or dropping them on save remains open.
- No field-level validation messages: required fields only disable **Save**, and
  server `ProblemDetails` is reduced to `detail ?? title ??` a status-based
  fallback through `getErrorMessage`.
- No drag-and-drop reordering or inline editing; changes reload the whole list.
- Timeline cards no longer render a nested-projects block or open a modal;
  **View projects** links to `/dashboard/experience/:experienceId/projects`.

## Project details and skills screen

- The screen edits project name, description, contribution, and stack links in
  separate forms; the routed projects page only creates projects and links here.
- Save is disabled until the selection differs from the loaded stacks; there is
  no undo beyond editing the selection again.

## Blog

- No pagination, filtering, search, or post preview/excerpt.

## Toolbox

- Full category and skill create/rename/delete is available in Toolbox. Skill
  delete returns `409` while projects still reference the skill; the row keeps
  its inline error and confirmation state after that failure. No reorder
  endpoint or order field is exposed. Categories with skills cannot be deleted
  from the UI.
- Skill create and edit select an existing category by name; neither form
  free-types or creates a category inline. `imgSrc` is deliberately not exposed
  because the résumé uses derived letter marks, and edits preserve its current
  value.
- A 401 during an admin write is handled by the interceptor (token cleared, gate
  reopened, return to `/`); the page also shows its load/form/row error state.

## Settings

- Settings is theme-only (Light/Dark); it has no catalog forms or API calls. It
  remains the utility link directly above the sidebar collapse control.

## Résumé content

- Identity and links come from `site`. About fastfetch copy (`cat bio.txt`
  narrative + facts) and certification labels are hardcoded in components.
- The résumé and parked dashboard profile use `public/jg-profile.png`.

## Data layer

- Only the JWT bearer/401 interceptor exists; no retries, timeouts, or
  cancellation.
- All services are `providedIn: 'root'`: state persists across navigation and
  pages re-fetch on every visit.
- No cache or shared store; each component fetches independently.
- No runtime response validation beyond generics; shapes are assumed.
- `github/repos` coverage relies on
  `v1/github/owner/{username}/repositories` (+`/count`). The token stays on the
  API; never put it in the frontend environment.

## Auth gate

- The gate protects the **view only**: portfolio, Notion, and GitHub reads are
  anonymous by design. Only `/auth/me` and `/admin/*` require the JWT on the
  server. Real access control needs a backend change.
- The JWT is a shared service token (`sub=portfolio-api`, `role=Admin`), not a
  user identity. Anyone holding it has admin access.
- Login is manual: the app never calls `/auth/login`. Expiry is client-side UX:
  `exp` from `/auth/me` drives a countdown and a guard check with a 60-second
  leeway, but the server remains the authority — rotation or revocation can
  produce a 401 before `exp`.
- A non-validation 401 clears the token, reopens the gate, and returns to `/`;
  the originating data request still shows its error state. An admin experience
  write closes its modal, and a project field write closes its inline editor, so
  the gate owns the response without a duplicate message. Toolbox forms and the
  project stack editor stay mounted and show the error while navigation is owned
  by the gate.
- The token and expiry are held in `sessionStorage` and the token is sent on
  every request. Legacy raw-token values are ignored. No runtime claim/role
  checks are performed in the frontend.
- The token dialog has no focus trap: Escape and focus return work, but Tab can
  reach background content.

## Resume import (020)

- Heatmap, ECharts wrapper, and commits pipeline were dropped (unreachable in
  `web_resume`); recoverable from git history.
- Two `Maintenance` components exist (dashboard + résumé). Unifying is optional.
- `devicon.min.css` no longer loads; the tech-stack list uses derived letter
  marks instead of logo fonts.

## Tooling

- ESLint (`eslint.config.js`, `npm run lint`) and Prettier (`.prettierrc`);
  `src/` is formatted.
- CI runs lint → format check → build → test (`.github/workflows/ci.yml`).
- Tests cover shell routing/state, user menu, portfolio service error contract,
  theme behavior, and Overview/Timeline/Project/Blog/Toolbox/Settings screens
  plus mapper and service contracts.
- `scripts/genenv.js` overwrites `src/environments/*.ts` on `start`/`build`
  from `.env`; missing values yield relative `/v1/...` calls. `dotenv` is an
  explicit dev dependency.
- Angular packages floored at `^21.2.26` (clears runtime advisories). Remaining
  moderate advisories are build/dev-only via `@angular/cli` and `eslint`.
- `tsconfig.json` sets `rootDir: ./src` for TypeScript 6 editor diagnostics;
  compiles with 5.9.3.

## Maintainability review

A read-only review after the routed projects work found no high-severity bloat;
`experience-projects`, `stack-picker`, `project-form`, the entity services,
`settings.ts`, `toolbox.ts`, and `user-menu.ts` are appropriately sized. Open cleanup
candidates:

- `features/dashboard/pages/project/project.{ts,html}` owns both field editing
  and stack replacement. Splitting `ProjectDetailsPanel` and
  `ProjectSkillsPanel` is optional unless either flow grows.
- `features/dashboard/pages/settings/settings.html` duplicates the Light/Dark
  button markup and class expressions; a standalone `ThemeToggle` would remove
  about 35 lines.
- `features/dashboard/pages/timeline/timeline.ts` keeps a non-trivial template
  inline; move it to `timeline.html`.
- Route-id validation in the project and experience-projects screens is
  duplicated; a `parseRouteId` helper in `shared/utils` is the small fix. A
  generic load-state wrapper is not warranted.
- Period formatting is duplicated between the dashboard and résumé timelines;
  a shared helper must preserve each screen's current dash character.
- `ShellSidebar.profileLink` / `core/constants/sidebar-sections.ts` →
  `resumeProfileLink` are unused and can be removed.