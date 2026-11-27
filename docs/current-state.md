# Current State

Angular SPA after the Tailwind rewrite (002–008). Read-only data, JWT-gated
dashboard; no server code in this repository.

## Stack

| Concern | Choice |
|---|---|
| Framework | Angular 21.2, standalone, lazy `loadComponent` |
| Styling | Tailwind CSS v4 (`@theme` tokens), light + dark |
| UI | Plain Tailwind; `PageHeader`, `StateMessage`, `Skeleton` |
| Icons | `@ng-icons/core` + `@ng-icons/lucide` |
| HTTP | `HttpClient` via custom `ApiClient` |
| State | Angular signals, per-entity services |
| Tests | Vitest (`@angular/build:unit-test`) |
| Lint/Format | ESLint 9 flat; Prettier 3 |
| CI/Deploy | GitHub Actions; Vercel (`build:prod`) |

## Entry chain

```
src/main.ts → App → app.routes.ts
  /            → Home (public résumé, no shell)
  /projects    → Projects (public, no shell)
  /profile     → redirect to /
  ""           → Dashboard shell (authGuard → / when token missing/expired)
      dashboard → Overview
      timeline  → Timeline
      blog      → Blog
      **        → dashboard
```

`app.config.ts` registers `provideHttpClient(withFetch(), withInterceptors([authInterceptor]))`,
the router (anchor scrolling + 16px offset), and a `ThemeService` initializer.
Icons are registered per component. There are no retries or timeouts.

## Routes

| Path | Component | Title | Notes |
|---|---|---|---|
| `""` full | Home (résumé) | `Jonathan Golimlim \| Software Engineer` | Public, no shell |
| `projects` | Projects (résumé) | `Projects \| Jonathan Golimlim` | Public, no shell |
| `""` | Dashboard shell | `Dashboard \| Jonathan Golimlim` | `authGuard`; redirects to `/` without a valid, unexpired token |
| `dashboard` | Overview | `Dashboard \| Jonathan Golimlim` | Default |
| `timeline` | Timeline | `Timeline \| Jonathan Golimlim` | |
| `profile` | redirect → `""` | — | Legacy URL |
| `blog` | Blog | `Blog \| Jonathan Golimlim` | |
| `**` | redirect → `dashboard` | — | Child wildcard |

Order matters: the résumé routes are declared above the shell because both
match the empty path (`pathMatch: 'full'` picks the résumé). Each child sets
both `title` and `data.pageTitle`.

## Shell

`features/dashboard/shell/`: `dashboard.{ts,html}` (layout, Escape, navigation
close), `shell-state.service.ts` (signals + scroll lock), `sidebar/`, `header/`,
`user-menu/`.

- Header title = deepest route `data.pageTitle`; first load, deep links, and
  back/forward are correct.
- Sidebar items: Dashboard (`/dashboard`), Timeline (`/timeline`), Blog
  (`/blog`); active via `routerLinkActive` exact + `aria-current="page"`.
- Footer holds only the desktop collapse control (16rem ↔ 4.5rem, persisted in
  `localStorage`). Mobile: off-canvas 18rem panel below `md`, overlay, Escape,
  scroll lock, focus return.
- Avatar dropdown: session countdown (whole minutes), **View profile** (`/`),
  **Download CV**, theme toggle, **Lock dashboard** (clears the JWT and returns
  to `/`). Keyboard and outside-click handling included.

Shared UI in `src/app/shared/ui/`: `page-header`, `state-message` (error/empty
with **Try again**), `skeleton` (text/card/list/grid/entries, `role="status"`).

## Data layer

### Site config — `core/config/site.config.ts`

Typed `as const satisfies SiteConfig`: `profile` (name, handle, role, bio,
location), `links` (GitHub, CV, email), `assets` (avatar files), `notion` (page
ID + public domain), `github` (username). Consumers: route titles, shell, user
menu, overview, blog, résumé services.

### ApiClient — `core/api/api-client.ts`

`environment.portfolioApi` base URL, GET only, JSON, `firstValueFrom`. The
`authInterceptor` adds `Authorization: Bearer <token>` when a JWT is stored and
handles non-validation 401s. No retries, timeouts, or error mapping.

### Auth — `core/auth/`

- `AuthTokenStore` — the only token state: `token` and `expiresAt` signals plus
  `sessionStorage` (`portfolio-admin-token`, JSON). Deliberately has no HTTP
  dependency so the interceptor can read it without a DI cycle. `isExpired()`
  applies a 60-second leeway; legacy raw-token values are ignored, forcing a
  fresh paste.
- `AuthService.verify(token)` — trims, stores temporarily (so the interceptor
  can attach the header), calls `GET v1/auth/me`, and stores the `exp` claim as
  `expiresAt` on success. Missing or unusable `exp` is rejected. On failure it
  clears the token and sets `error`. `clear()` and `clearError()` reset state.
- `authInterceptor` — attaches the Bearer header to every request when a token
  exists. On a 401 from any endpoint except `/v1/auth/me`, it clears the token,
  requests the gate, and navigates to `/`; validation 401s stay visible in the
  dialog.
- `authGuard` — applied to the dashboard shell route; redirects to `/` when the
  token is missing or expired, and requests the gate so the dialog reopens.
- `AuthGateService` — shared `unlockRequested` signal; the dashboard-link dialog
  consumes it to reopen without a manual click.
- Registration is **out of band**: the app never calls `POST v1/auth/login`.
  The JWT is obtained manually and pasted into the dashboard-link dialog. Local
  expiry is session UX only; the server remains the authority on validity.

### Services

- `PortfolioSignalService<T>` — `{ content: T[], loading, error }`; `getState`,
  `setLoading`, `getPortfolioResource` (try/catch; clears content on failure).
  `ExperienceSignalService` also exposes `setContent`/`setError` so mapped DTOs
  can replace the signal state.
- `ResourceSignalService<T>` — single-object counterpart for count endpoints.
- `getErrorMessage` / `getApiErrorMessage` (`shared/utils/error.util.ts`) —
  status-based fallback and `ProblemDetails.detail ?? title` for admin forms.
- `ApiClient` — `get<T>` plus typed `post<T>`/`put<T>`; all send JSON headers and
  are the only HTTP boundary used by services.
- Entity services (`providedIn: 'root'`): `OverviewSignalService`,
  `ExperienceSignalService`, `ExperienceAdminService` (mapped reload + admin
  writes for experiences and projects), `ProjectStackService` (stack catalog +
  stack replacement, prepared but not called by the UI), `SkillsSignalService`,
  `RecommendationService`, `GithubCountSignalService`, `NotionCountSignalService`,
  `GithubRepoSignalService`, `ResumeProjectSignalService`, `NotionSignalService`.

### Live endpoints

| Endpoint | Used by | Response |
|---|---|---|
| `v1/overview` | Overview | `OverviewItem[]` |
| `v1/project?includeTools=false` | Résumé Projects | `Project[]` |
| `v1/github/owner/{username}/repositories/count` | Overview | `OverviewItem` |
| `v1/github/owner/{username}/repositories` | Résumé Home + Projects | `GithubRepo[]` |
| `v1/notion/{pageId}/count` | Overview | `OverviewItem` |
| `v1/experience?includeProjects=false` | Dashboard Timeline, Résumé Home | `ExperienceTimeline[]` |
| `v1/experience/{id}` | Timeline projects modal | `ExperienceDto` |
| `POST v1/admin/experience` | Timeline add form | `ExperienceDto` (Bearer required) |
| `PUT v1/admin/experience/{id}` | Timeline edit form | `ExperienceDto` (Bearer required) |
| `POST v1/admin/experience/{experienceId}/project` | Timeline add-project form | `ProjectDto` (Bearer required) |
| `PUT v1/admin/project/{id}` | Timeline edit-project form | `ProjectDto` (Bearer required) |
| `v1/skill` | Résumé Home | `TechStackItem[]` |
| `v1/notion/{site.notion.pageId}` | Blog | `NotionPageCard[]` |
| `v1/auth/me` | `AuthService.verify` (Bearer required) | `AuthClaims` |

`PUT v1/admin/project/{id}/tech-stacks` is implemented in `ProjectStackService`
but is not called by any current UI; project stack writes are deferred. Legacy
(`v1/portfolio/count`, `v1/portfolio/projects`,
`v1/experience/{id}/projects`) are unused. `v1/auth/login` is called manually
outside the app, not by any service. The GitHub token lives on the API.

### Models — `features/dashboard/core/models/`

- `OverviewItem { key, count }`
- `ExperienceTimeline { id, company, role, startedAt, finishedAt, durationMonths, description, responsibility, type, projects? }`
- `ExperienceDto` — nullable API form of `ExperienceTimeline`; its `projects` are
  `ProjectDto[] | null`. `ExperienceMapper.fromDto` supplies empty-string/zero/null
  defaults and maps nested projects with `ProjectMapper.fromDto`.
- `ExperienceWriteRequest` (aliased as `CreateExperienceRequest` /
  `UpdateExperienceRequest`) — nullable `company`, `role`, `startedAt`,
  `finishedAt`, `description`, `responsibility`, `type`. `durationMonths` and
  `projects` are never written.
- `Project { id, projectName, description, contribution, techStacks? }`
- `CreateProjectRequest { projectName, description, contribution }` — nullable
  payload for `POST v1/admin/experience/{experienceId}/project`; also used for
  `PUT v1/admin/project/{id}` via the `UpdateProjectRequest` alias.
- `ReplaceProjectTechStacksRequest { techStackIds }` — body of the stack PUT,
  prepared for deferred stack editing.
- `ProjectDto` — nullable API response for a project; `ProjectMapper.fromDto`
  maps it to `Project` with safe defaults, including nested `TechStackDto[]`.
- `TechStackDto` — nullable API form of a stack, mapped by
  `TechStackMapper.fromDto` into `TechStackItem`.
- `TechStackItem { id, stackName, imgSrc, category }`
- `ProblemDetails { type?, title?, status?, detail?, instance? }` — API error body
- `FeedbackItem { id, personName, description, careerPosition, postedAt }`
- `NotionPageCard { url, date, title }`
- `GithubRepo { id, name, fullName, htmlUrl, description, language, topics }` (`features/resume/core/models/`)
- `AuthClaims { sub, role, nbf, exp, iat, iss, aud }` — every claim is a
  `string[]`, including the JWT timestamps

## Assets and environment

- Assets: `public/favicon.ico`, `public/grad_1.jpeg` (sidebar avatar),
  `public/jg-profile.png` (profile photo).
- `scripts/genenv.js` rewrites `src/environments/*.ts` from `.env` on
  `start`/`build`; without `.env` the API base is empty (relative `/v1/...`).
  `dotenv` is an explicit dev dependency.
- Theme: `ThemeService` persists to `localStorage` (`portfolio-theme`), toggles
  `.dark` + `color-scheme` on `<html>`; inline script applies it pre-paint.
- `src/styles.css`: `@theme inline` + light/dark variables (`--background`,
  `--foreground`, `--card`, `--muted`, `--border`, `--sidebar*`,
  `--radius`). Accent token `--color-accent-brand` (`#912f56` light, `#c39bd3`
  dark).
- `tsconfig.json` sets `rootDir: ./src` for TypeScript 6 editor diagnostics;
  the project compiles with TypeScript 5.9.3.

## What exists

- [x] Shell + lazy children + wildcard redirect.
- [x] Sidebar, sticky header, content wrapper (~1200px, `p-3`).
- [x] Skeleton loading + error/empty states on every data screen.
- [x] Overview metric cards (API + GitHub + Notion counts, independent retry).
- [x] Timeline cards (company/type badge, role, date range, duration,
  responsibility) with per-card Edit and View projects actions; projects are no
  longer rendered inline.
- [x] JWT-gated timeline add/edit modal; reloads the list after save and shows
  `400`/`404`/`503` errors in the form (`401` stays with the auth interceptor).
- [x] Per-experience projects modal with loading/empty/error/list states, an
  Add project form (`POST`), and an icon-only per-project edit action opening
  the same form prefilled (`PUT` of project fields only). Stack chips are
  read-only; no stack writes are performed.
- [x] Blog list (numbered, date, external icon, Notion URL rewrite).
- [x] Résumé landing + projects pages.
- [x] JWT gate: pasted token, `/auth/me` validation, `exp`-based expiry, route
  guard, 401 handling, Bearer header, session storage, countdown, lock control.
- [x] Light/dark with persisted choice.
- [x] External links `target="_blank"` + `rel="noopener noreferrer"`.

Not present: delete UI, project stack writes, stack/category creation UI,
in-app login/registration, search/filter/pagination, toasts, analytics, i18n.
The flat search-only `StackPicker` and `ProjectStackService` are retained but
unwired for the planned stack-editing work.

## Removed in 008

`libs/ui/**`, `components.json`, all `@spartan-ng/*`, Helm aliases, CDK overlay
CSS, `tw-animate-css`, and unused deps (`class-variance-authority`, `clsx`,
`tailwind-merge`, `@angular/cdk`, `@angular/forms`). `Maintenance` remains in
plain Tailwind but is unrouted.