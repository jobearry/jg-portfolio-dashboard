# Current State

Angular SPA after the Tailwind rewrite (002–008). Read-only; no server code.

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
  ""           → Dashboard shell
      dashboard → Overview
      timeline  → Timeline
      blog      → Blog
      **        → dashboard
```

`app.config.ts` registers `provideHttpClient(withFetch())`, the router (anchor
scrolling + 16px offset), and a `ThemeService` initializer. No global state,
interceptors, retries, or guards. Icons are registered per component.

## Routes

| Path | Component | Title | Notes |
|---|---|---|---|
| `""` full | Home (résumé) | `Jonathan Golimlim \| Software Engineer` | Public, no shell |
| `projects` | Projects (résumé) | `Projects \| Jonathan Golimlim` | Public, no shell |
| `""` | Dashboard shell | `Dashboard \| Jonathan Golimlim` | Always mounted |
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
- Avatar dropdown: **View profile** (`/`), **Download CV**, theme toggle.
  Keyboard and outside-click handling included.

Shared UI in `src/app/shared/ui/`: `page-header`, `state-message` (error/empty
with **Try again**), `skeleton` (text/card/list/grid/entries, `role="status"`).

## Data layer

### Site config — `core/config/site.config.ts`

Typed `as const satisfies SiteConfig`: `profile` (name, handle, role, bio,
location), `links` (GitHub, CV, email), `assets` (avatar files), `notion` (page
ID + public domain), `github` (username). Consumers: route titles, shell, user
menu, overview, blog, résumé services.

### ApiClient — `core/api/api-client.ts`

`environment.portfolioApi` base URL, GET only, JSON, `firstValueFrom`. No
interceptors, retries, timeouts, or error mapping.

### Services

- `PortfolioSignalService<T>` — `{ content: T[], loading, error }`; `getState`,
  `setLoading`, `getPortfolioResource` (try/catch; clears content on failure).
- `ResourceSignalService<T>` — single-object counterpart for count endpoints.
- Entity services (`providedIn: 'root'`): `OverviewSignalService`,
  `ExperienceSignalService`, `SkillsSignalService`, `RecommendationService`,
  `GithubCountSignalService`, `NotionCountSignalService`,
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
| `v1/skill` | Résumé Home | `TechStackItem[]` |
| `v1/notion/{site.notion.pageId}` | Blog | `NotionPageCard[]` |

Legacy (`v1/portfolio/count`, `v1/portfolio/projects`,
`v1/experience/{id}/projects`) are unused. The GitHub token lives on the API.

### Models — `features/dashboard/core/models/`

- `OverviewItem { key, count }`
- `ExperienceTimeline { id, company, role, startedAt, finishedAt, durationMonths, description, responsibility, type, projects? }`
- `Project { id, projectName, description, contribution, techStacks? }`
- `TechStackItem { id, stackName, imgSrc, category }`
- `FeedbackItem { id, personName, description, careerPosition, postedAt }`
- `NotionPageCard { url, date, title }`
- `GithubRepo { id, name, fullName, htmlUrl, description, language, topics }` (`features/resume/core/models/`)

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
- [x] Timeline cards (brand year badge, role, responsibility, nested projects).
- [x] Blog list (numbered, date, external icon, Notion URL rewrite).
- [x] Résumé landing + projects pages.
- [x] Light/dark with persisted choice.
- [x] External links `target="_blank"` + `rel="noopener noreferrer"`.

Not present: forms, CRUD, auth, search/filter/pagination, live dialogs, toasts,
analytics, i18n.

## Removed in 008

`libs/ui/**`, `components.json`, all `@spartan-ng/*`, Helm aliases, CDK overlay
CSS, `tw-animate-css`, and unused deps (`class-variance-authority`, `clsx`,
`tailwind-merge`, `@angular/cdk`, `@angular/forms`). `Maintenance` remains in
plain Tailwind but is unrouted.