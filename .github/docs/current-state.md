# Current State

Snapshot of the application architecture, flow, and shared infrastructure after
the Tailwind rewrite (002–008).

## 1. Stack

| Concern    | Current choice                                                                       |
| ---------- | ------------------------------------------------------------------------------------ |
| Framework  | Angular 21.2, standalone components, lazy `loadComponent` routes                     |
| Styling    | Tailwind CSS v4 (PostCSS), own `@theme` tokens, light + dark                         |
| Components | Plain Tailwind; shared `PageHeader`, `StateMessage`, `Skeleton` primitives           |
| Icons      | `@ng-icons/core` + `@ng-icons/lucide`                                                |
| HTTP       | `HttpClient`, wrapped by a custom `ApiClient`                                        |
| State      | Angular signals, per-entity services                                                 |
| Tests      | Vitest via `@angular/build:unit-test` (shell/routing/theme + screen + service specs) |
| Lint       | ESLint 9 flat config, `angular-eslint` + `typescript-eslint`, conservative rules     |
| Format     | Prettier 3 (`printWidth: 100`, `singleQuote: true`)                                  |
| CI         | GitHub Actions on PRs and `main` pushes: lint → format → build → test                |
| Deploy     | Vercel (`vercel.json`, `vercel-build` → `build:prod`)                                |

## 2. Entry chain

```
src/main.ts
  └─ App (src/app/app.ts)                 → <router-outlet/>
       └─ src/app/app.routes.ts
            ├─ /           → Home      (public landing page, no shell)
            ├─ /projects   → Projects  (public, no shell)
            ├─ /profile    → redirect to résumé at /
            └─ Dashboard shell ("")    → app-shell-sidebar + app-shell-header + <router-outlet/>
                 ├─ /dashboard  → Overview
                 ├─ /timeline   → Timeline
                 ├─ /blog       → Blog
                 └─ **          → redirectTo: dashboard
```

### Bootstrapping

`src/app/app.config.ts`:

```ts
providers: [
  provideBrowserGlobalErrorListeners(),
  provideHttpClient(withFetch()),
  provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
  provideAppInitializer(() => {
    inject(ThemeService);
  }),
];
```

- `HttpClient` is registered app-wide, so `ApiClient` resolves on every route.
- Router anchor scrolling is enabled for the résumé's section links.
- The theme initializer applies the stored/system theme and keeps it on `<html>`.
- No zone/change-detection configuration.
- No global state, interceptors, retries, or guards.

`src/app/app.ts` is a bare `<router-outlet/>` host. There is no global icon
registry: each component (sidebar, blog, profile, maintenance) registers the
lucide icons it uses through its own `provideIcons()`.

## 3. Routes

| Path        | Component              | Title                                    | Notes                         |
| ----------- | ---------------------- | ---------------------------------------- | ----------------------------- |
| `""` (full) | `Home` (resume)        | `Jonathan Golimlim \| Software Engineer` | Public landing page, no shell |
| `projects`  | `Projects` (resume)    | `Projects \| Jonathan Golimlim`          | Public, no shell              |
| `""`        | `Dashboard` (shell)    | `Dashboard \| Jonathan Golimlim`         | Always mounted                |
| `dashboard` | `Overview`             | `Dashboard \| Jonathan Golimlim`         | Default destination           |
| `timeline`  | `Timeline`             | `Timeline \| Jonathan Golimlim`          |                               |
| `profile`   | redirect → `""`        | —                                        | Legacy URL; résumé profile    |
| `blog`      | `Blog`                 | `Blog \| Jonathan Golimlim`              |                               |
| `**`        | redirect → `dashboard` | —                                        | Child wildcard                |

The public routes and `/profile` compatibility redirect are declared **above**
the dashboard shell route. Both the résumé landing page and the shell match the
empty path; `pathMatch: 'full'` on the landing route decides it, so declaration
order matters. Navigation between the halves is explicit and in-tab: the
account menu's View profile link navigates to `/`; both résumé pages link back
to `/dashboard`. The sidebar footer contains only the collapse/expand control.
Each dashboard child route sets both `title` (document tab) and
`data.pageTitle` (header `h1`) through the `page()` helper in `app.routes.ts`.

## 4. Shell layout

`features/dashboard/shell/`

```
dashboard.{ts,html}       host layout, backdrop, Escape + navigation close
shell-state.service.ts    collapsed / mobileOpen / isDesktop signals, scroll lock
sidebar/sidebar.ts        plain Tailwind sidebar (rail, nav, footer)
header/header.ts          mobile trigger + route-driven <h1>
user-menu/user-menu.ts    avatar dropdown (profile, CV, theme toggle)
```

```
<div [style.--shell-sidebar-width]="collapsed() ? '4.5rem' : '16rem'">
  @if (mobile && open) { <overlay /> }
  <app-shell-sidebar />                 <!-- fixed; 16rem or 4.5rem rail; 18rem mobile -->
  <div class="md:pl-[var(--shell-sidebar-width)]">
    <app-shell-header />                <!-- sticky; trigger below md + <h1> -->
    <main class="max-w-[75rem] p-3"><router-outlet /></main>
  </div>
</div>
```

- The header title comes from the deepest route's `data.pageTitle`; there is no
  click handler and no `pagename` signal.
- Sidebar items come from `core/constants/sidebar-sections.ts`:

| Label     | URL          | Icon                    |
| --------- | ------------ | ----------------------- |
| Dashboard | `/dashboard` | `lucideLayoutDashboard` |
| Timeline  | `/timeline`  | `lucideChartGantt`      |
| Blog      | `/blog`      | `lucideRss`             |

- The sidebar footer contains the desktop collapse/expand control only. The
  avatar menu's **View profile** item links to `/`. The former
  dashboard profile screen remains in the source but is unrouted; legacy
  `/profile` requests redirect to the résumé.

- Active links use `routerLinkActive` with exact matching and
  `aria-current="page"`.
- Desktop collapse (16rem ↔ 4.5rem) is persisted in localStorage; mobile uses an
  off-canvas panel below `md` (48rem) with overlay, Escape, scroll lock, and
  focus return.
- The avatar block is a dropdown button with Profile, CV, and theme actions.

### Shared UI — `src/app/shared/ui/`

- `page-header` — shared eyebrow / `h2` / optional description block used by
  Timeline and Blog.
- `state-message` — error/empty block used by every data screen, with optional
  **Try again** output.
- `skeleton` — `app-skeleton` loading placeholder with `text`, `card`, `list`,
  `grid`, and `entries` variants plus an optional `rows` count. It mirrors the
  final layout, exposes `role="status"` with visually hidden "Loading…", and
  marks the visual blocks `aria-hidden`.

### Résumé feature — `src/app/features/resume/`

The public résumé feature was imported from `web_resume` (see
[`implementation-history.md`](./implementation-history.md)). Its lazy-loaded
routes `/` and `/projects` render outside the dashboard shell and share the
global theme, site configuration, and API client.

#### Landing page — `/`

`pages/home/ui/home.ts` and `home.html` compose a linear layout:
`ResumeHeader` → a `max-w-6xl` main containing the hero and five
`ResumeSection` panels (About, Experience, Certifications, Tech stack, Recent
projects) → the contact panel → `ResumeFooter`. Each panel receives a section
`id` for fragment navigation. The former block-content constants, dynamic host,
and profile component were removed from this page.

- **Header:** `components/resume-header/` provides the top bar with the
  name, fragment navigation (`about`, `experience`, `tech-stack`, `work`,
  `contact`), theme toggle, and **View dashboard** link. Anchor navigation is
  handled in the app shell configuration.
- **Hero:** `pages/home/components/hero/hero.ts` uses `site.profile`,
  `site.assets.profileAvatar`, `site.links.github`, and `site.links.cv`. It
  renders the avatar, role eyebrow, a two-tone name headline, bio, location,
  two role pills, **View projects** (`/projects`), **Download CV**, and a
  GitHub action. Profile name, role, bio, location, avatar, and links come
  from `site`; the second role pill and supporting copy are local.
- **Static content:** `pages/home/components/about.ts` pairs the configured bio
  with supporting paragraphs; `certifications/` lists the HackerRank
  certifications. Labels use the `brand` variant in `components/pill.ts`.
- **Timeline:** `pages/home/components/timeline/` uses the shared
  `ExperienceSignalService` and requests
  `v1/experience?includeProjects=false`. It sorts valid start dates newest
  first, places invalid dates after valid ones, and displays at most three
  entries as a responsive horizontal/vertical timeline. Each entry shows the
  period, role, company, type, and responsibility (falling back to
  description); the period is omitted for an invalid start date. Loading,
  empty, and retryable error states are shown.
- **Recent Projects:** `pages/home/components/recent-repositories/` uses
  `GithubRepoSignalService` and shows the first two public repositories through
  the shared `components/repo-grid/` and `components/repo-card/`. Cards open
  GitHub in a new tab; loading, empty, and retryable error states are
  supported. **View more** links to `/projects`.
- **Technical Stack:** `pages/home/components/tech-stack-list/` uses the shared
  `SkillsSignalService` and `v1/skill`, groups skills by API category into a
  responsive grid, and derives a two-letter mark per skill. Loading, empty, and
  retryable error states are shown; there is no fixed-height scroll area.
- **Contact:** `pages/home/components/contact/contact.ts` closes the page with
  CV, GitHub, and dashboard actions. There is no public email in `site`, so no
  email affordance is rendered.

#### Projects page — `/projects`

`pages/projects/ui/projects.ts` renders `ResumeHeader`, a page intro with a
**Back to profile** link, two `ResumeSection` panels, and `ResumeFooter`.
It starts the client-project and GitHub repository requests in parallel:

- `ResumeProjectSignalService` calls `v1/project?includeTools=false`. The page
  maps each API project to a `ProjectCard` in a responsive two-column grid,
  using contribution text or falling back to its description. Because the query
  omits tools, project technology tags are normally empty; any
  `techStackSpecs` returned are still mapped and rendered.
- `GithubRepoSignalService` calls
  `v1/github/owner/{site.github.username}/repositories`; the shared `RepoGrid`
  shows the full list, while the landing page uses only the first two.
  Repository links open in a new tab.
- Client projects have loading, empty, and retryable error states. GitHub
  repositories have loading, empty, and retryable error states through
  `RepoGrid`.

`pages/projects/components/project-card/` is presentational and
non-interactive because the API exposes no project URL. The shared
`components/` directory supplies pills, footer (`resume-footer`), header
(`resume-header`), section panel (`resume-section`), dashboard link, theme
toggle, and the repository card/grid; `Maintenance` is retained but unrouted.
`core/models/github-repo.ts` defines the repository response, and
`shared/constants/styles.constants.ts` holds the shared résumé transition
utility.

## 5. Data layer

### Site config — `src/app/core/config/site.config.ts`

Single typed source of truth for personal content and public integrations:

- `site.profile` — name, handle, role, bio, location.
- `site.links` — GitHub and CV URLs.
- `site.assets` — sidebar and profile avatar filenames (served from `public/`).
- `site.notion` — page ID and public domain.
- `site.github` — GitHub username used by the repository list and count endpoints.

The object is `as const satisfies SiteConfig`. Consumers include route titles,
dashboard shell/user menu/overview and its parked Profile page, Blog, and the
résumé GitHub repository service. The public résumé profile reads its avatar,
location, GitHub link, and CV link from `site`; its name and role labels remain
hardcoded (see `.github/docs/gaps.md`). Menu labels/URLs/icons stay in
`core/constants/sidebar-sections.ts`.

### `ApiClient` — `src/app/core/api/api-client.ts`

- Base URL: `environment.portfolioApi` (Azure App Service URL, regenerated from
  `.env` by `scripts/genenv.js`).
- `GET` only, JSON headers, `firstValueFrom(HttpClient.get(...))`.
- No interceptors, retries, timeouts, or error mapping.

### `PortfolioSignalService<T>` — `src/app/shared/services/portfolio-base.service.ts`

Signal state `{ content: T[], loading: boolean, error: string | null }` with:

- `getState()`
- `setLoading()` — sets `loading: true`, clears the previous error
- `getPortfolioResource(endpoint)` — fetch in `try/catch`; success replaces
  content, failure clears content, exits loading, and stores a user-safe message
- helper `getContent<T>(endpoint, service)` — `setLoading()` then fetch

### `ResourceSignalService<T>` — `src/app/shared/services/resource-base.service.ts`

Single-object counterpart to `PortfolioSignalService`, used by count endpoints.

- state `{ content: T | null, loading, error }`
- same `getState()` / `setLoading()` / `getResource(endpoint)` contract
- helper `getResource<T>(endpoint, service)`

### Entity services (all `providedIn: 'root'`)

`OverviewSignalService`, `ExperienceSignalService`, `SkillsSignalService`,
`RecommendationService`, `GithubCountSignalService`,
`NotionCountSignalService`, `GithubRepoSignalService`, and
`ResumeProjectSignalService` (résumé Projects page).

### Notion service

`NotionSignalService` keeps its own state
`{ content: NotionPageCard[] | null, loading, error }` and fetches
`v1/notion/{pageId}` with the same `try/catch` contract.

### Endpoints

Live:

| Endpoint                                        | Used by                  | Response type          |
| ----------------------------------------------- | ------------------------ | ---------------------- |
| `v1/overview`                                   | Overview                 | `OverviewItem[]`       |
| `v1/project?includeTools=false`                 | Resume → Projects        | `Project[]`            |
| `v1/github/owner/{username}/repositories/count` | Overview                 | `OverviewItem`         |
| `v1/github/owner/{username}/repositories`       | Resume → Home + Projects | `GithubRepo[]`         |
| `v1/notion/{pageId}/count`                      | Overview                 | `OverviewItem`         |
| `v1/experience?includeProjects=false`           | Dashboard → Timeline     | `ExperienceTimeline[]` |
| `v1/experience?includeProjects=false`           | Resume → Home            | `ExperienceTimeline[]` |
| `v1/skill`                                      | Resume → Home            | `TechStackItem[]`      |
| `v1/notion/{site.notion.pageId}`                | Blog                     | `NotionPageCard[]`     |

The legacy endpoints (`v1/portfolio/count`, `v1/portfolio/projects`,
`v1/experience/{id}/projects`) are no longer referenced now that the `bak`
screens are deleted.

The résumé timeline requests `v1/experience?includeProjects=false`, sorts valid
dates newest first, and displays at most three company, role, and type entries;
the year tag is hidden for invalid dates. The résumé Projects page requests
`v1/project?includeTools=false`, so it renders client projects without tool
details. The former dashboard profile page is parked and unrouted; its
`v1/recommendation` call is not used by a live route. The résumé Technical
Stack section uses `v1/skill`.

`GithubRepoSignalService` uses the owner/repositories endpoint without the
`/count` suffix. The résumé home page displays its first two results; `/projects`
displays the full list. The GitHub token deliberately lives on the API: the
imported `web_resume` shipped it in the browser bundle; the résumé import
removed it.

### Models

`src/app/features/dashboard/core/models/`

- `OverviewItem { key, count }`; Overview displays each API-provided `key` in
  uppercase with camelCase/underscore word breaks and a matching local subtitle
  (key-derived fallback for unknown values). The same model types the GitHub and
  Notion count responses.
- `ExperienceTimeline { id, company: Company, duration: Period, description, role: Role, responsibility, type, projects?: Project[] | null }`
- `Project { projectId, projectName, description, coverImg, duration, contribution, techStackSpecs: TechStack[] }`
- `TechStack { specId, toolName, imgSrc, createdAt, stackId, stack }`
- `TechStackItem { id, category, createdAt, imgSrc, stackName }`
- `FeedbackItem { id, personName, description, careerPosition: Role, postedAt }`
- Value objects: `Company { name }`, `Period { startedAt, finishedAt, duration }`,
  `Role { value }`
- `NotionPageCard { url, date, title }`

`src/app/features/resume/core/models/`:

- `GithubRepo { id, name, fullName, htmlUrl, description, language, topics }` —
  the API normalises `description`/`language` to empty strings and returns only
  public repositories.

The résumé Projects page uses the dashboard `Project` model from
`v1/project?includeTools=true`; the résumé home's Recent Projects preview uses
the first two results from the GitHub repository list.

The unused `PortfolioItems` and `Result<T>` models were deleted in 008.

## 6. Asset and environment notes

- Public assets: `public/favicon.ico`, `public/grad_1.jpeg` (sidebar avatar),
  `public/jg-profile.png` (dashboard and résumé profile photo).
- `scripts/genenv.js` rewrites `src/environments/environment*.ts` from `.env`
  (`PORTFOLIO_API_HOST`, etc.) on every `npm start` / `npm run build*`. It uses
  `dotenv`, now an explicit dev dependency; without `.env` the API base is empty
  and requests become relative `/v1/...` calls.
- `index.html` no longer hardcodes a theme class. A small inline script applies
  the stored theme (or `prefers-color-scheme` on first load) before first paint.
- **Theme:** `ThemeService` (`core/theme`) exposes `theme`, `set()`, and
  `toggle()`, persists to `localStorage` (`portfolio-theme`), and toggles the
  `.dark` class plus `color-scheme` on `<html>`. The toggle lives in the avatar
  dropdown.
- **TypeScript config:** `tsconfig.json` sets `rootDir: ./src` so the app and
  spec projects stay compatible with TypeScript 6 editors (VS Code bundles
  6.0.3); the project itself compiles with TypeScript 5.9.3.
- `src/styles.css` owns the token layer: `@theme inline` mapping plus light/dark
  CSS variables (`--background`, `--foreground`, `--card`, `--muted`,
  `--border`, `--sidebar*`, `--radius: 0.625rem`). It has no Spartan preset, CDK
  overlay CSS, `tw-animate-css` import, or untyped `data-*` variants (all removed
  in 008).
- Accent color: token `--color-accent-brand` is theme-aware (`#912f56` in light
  mode and plum `#c39bd3` in dark mode); templates no longer repeat the hex.
- Template neutrals use semantic tokens (`text-muted-foreground`, `bg-muted/50`)
  so both themes stay legible.

## 7. Functional inventory

- [x] Router shell + lazy children + wildcard redirect to `/dashboard`.
- [x] Sidebar with three dashboard menu items and a collapse/expand footer
      control. Profile navigation is provided by the account menu's View profile
      link to `/`.
- [x] Collapsible sidebar on desktop; off-canvas/mobile behavior via the sidebar trigger.
- [x] Sticky top header with sidebar trigger and current page title.
- [x] Content wrapper: centered, max-width ~1200px, padding.
- [x] Skeleton loading state on every data screen, with error and empty states.
- [x] Five GET fetches (four portfolio + one Notion).
- [x] Dashboard overview header + responsive 5-card metric grid, including
      GitHub repository and Notion page counts with independent retry states.
- [x] Timeline experience cards with a theme-aware brand-accent year badge,
      role/description, responsibility,
      nested projects, and technology chips.
- [x] Résumé profile hero (avatar, name, handle, bio), GitHub and CV links.
- [x] Blog list: numbered entries, title, date, external link icon, URL rewrite
      to the public Notion domain, new-tab links.
- [x] Hover/focus lift transition on blog cards.
- [x] Light and dark theme with persisted choice; toggle in the avatar dropdown.
- [x] External links use `target="_blank"` + `rel="noopener noreferrer"`.

Not present today: forms, CRUD, auth, search/filter/pagination, dialogs in live
code, toasts, analytics, i18n.

## 8. Removed in the Tailwind rewrite (008)

- `libs/ui/**`, `components.json`, and the `@spartan-ng/helm/*` TypeScript path
  aliases.
- `@spartan-ng/brain`, `@spartan-ng/cli`, `class-variance-authority`, `clsx`,
  `tailwind-merge`, `tw-animate-css`, `@angular/cdk`, and the unused
  `@angular/forms`.
- `HlmIcon` and all Helm directives; `Maintenance` remains but is now plain
  Tailwind (it is not routed).
- CDK overlay CSS, the `tw-animate-css` import, Spartan `data-*` variants, and
  the unused `--animate-indeterminate` keyframes.
- The unused `PortfolioItems` and `Result<T>` models.

`Maintenance` is intentionally retained for future placeholder use. No live code
imports `@spartan-ng/*` or `libs/ui`.
