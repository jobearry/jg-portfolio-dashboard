# Gaps, Bugs, and Open Decisions

Known issues in the current app after the Tailwind rewrite.

## Resolved in 002 (baseline runtime)

- **`HttpClient` provider** — `provideHttpClient(withFetch())` is registered in
  `app.config.ts`.
- **No error handling** — `PortfolioSignalService` and `NotionSignalService` now
  catch failures, exit the loading state, and expose a user-safe message.
- **Stuck skeletons** — every data screen renders a shared error block with a
  **Try again** action when a request fails, and an empty state when a request
  succeeds with no rows.
- **Overview "View Details →"** — removed; the cards are informational. The
  invalid `<button>` inside `<button>` nesting is gone.
- **`console.log`** — removed from the base service and the shell.
- **Dead code** — `features/dashboard/bak/**`, `ProjectDialog`, `Card`, `Item`,
  `SectionButton`, `SkeletonCard`, and `ProjectSignalService` are deleted. The
  commented legacy route block is gone.
- **Stale test** — the assertion for the never-rendered
  `"Hello, Portfolio_Dashboard"` text is removed. 003 adds real shell/routing
  tests.

## Resolved in 005 (site config)

- **Shared site configuration** — typed profile, link, asset, Notion, and
  GitHub values live in `core/config/site.config.ts` and are used by dashboard
  routes and components.
- **Hardcoded Notion values** — page ID and public domain come from
  `site.notion`; the blog feature contains no literal.

## Résumé landing content

- Identity and links are configured: the hero reads `site.profile.name`,
  `site.profile.role`, `site.profile.bio`, `site.profile.location`,
  `site.assets.profileAvatar`, `site.links.github`, and `site.links.cv`.
- Remaining landing copy is local to components: the second hero role pill
  (“Fullstack Developer”), the About supporting paragraphs, and the
  certification labels are hardcoded.
- The contact panel has no email action because `site` exposes no public email;
  it links to the CV, GitHub, and dashboard instead.

## Resolved in 006 (shell)

- **Route-driven header title** — read from the deepest route's `data.pageTitle`,
  correct on first load, reload, deep links, and back/forward.
- **Active-link state** — `routerLinkActive` (exact) plus `aria-current="page"`.
- **Route-level titles** — every child sets a branded document title.
- **Default redirect** — explicit empty-path redirect to `/dashboard`.
- **Sidebar footer** — now holds the desktop collapse/expand control.
- **Profile access** — the account menu's View profile item opens the résumé at
  `/`; there is no separate Profile link in the sidebar footer. The old
  dashboard profile screen is parked.
- **Mobile navigation** — off-canvas panel with overlay, close on navigate,
  overlay click, Escape, body scroll lock, and focus return to the trigger.
- **Collapse persistence** — desktop rail state survives reloads
  (`portfolio-sidebar-collapsed`).

## Resolved screen and UI issues

- **Spartan removed from the dashboard screens** — `hlmH1`, `hlmH3`, `HlmIcon`,
  and `SkeletonItem` are no longer used by Overview, Timeline, the parked
  dashboard Profile, or Blog.
- **Overview header** — the name comes from `site.profile.name`; no hardcoded
  "Than" copy.
- **Timeline dates** — `startedAt` is parsed defensively; a missing or invalid
  date hides the year pill instead of rendering an empty/`Invalid Date` value.
- **Former dashboard Profile UI** — retained but unrouted; `/profile` redirects
  to the résumé at `/`.
- **Blog entries** — plain `ng-icon`, Tailwind hover/focus lift with a
  `motion-reduce` fallback, and a screen-reader new-tab hint.
- **Loading** — one shared `app-skeleton` with `text`, `card`, `list`, `grid`, and
  `entries` variants; the Spartan skeleton component is deleted.
- **Cleanup** — `common.styles.ts`, `portfolio.styles.ts`, and the unused
  portfolio icon/control constants are deleted; components register only the
  icons they use.

## Resolved in 008 (Spartan removal)

- **No Spartan left** — `libs/ui/**`, `components.json`, `@spartan-ng/*`, and the
  Helm path aliases are deleted.
- **Unused dependencies removed** — `class-variance-authority`, `clsx`,
  `tailwind-merge`, `tw-animate-css`, `@angular/cdk`, and `@angular/forms` are
  uninstalled.
- **Styles cleaned** — CDK overlay CSS, the `tw-animate-css` import, Spartan
  `data-*` variants, and the unused `--animate-indeterminate` keyframes are gone.
- **Unused models removed** — `PortfolioItems` and `Result<T>`.
- **`Maintenance` kept** — rewritten in plain Tailwind and still not routed.
- **Environment script fixed** — `dotenv` is now an explicit dev dependency, so
  `genenv` no longer silently writes an empty API base after the Spartan CLI is
  removed.
- **Tooling cleanup** — `libs/ui` ignores removed from ESLint and Prettier;
  README describes the current screens.

## Navigation and layout

- The former dashboard Profile screen is retained but unrouted. The account
  menu's View profile item opens the résumé at `/`; there is no separate
  sidebar footer Profile link. Legacy `/profile` requests redirect there.
- **No sidebar keyboard shortcut** — the Spartan version registered one; the
  plain shell does not. Not planned unless requested.
- **Desktop collapse only** — the mobile panel always opens full width.

## Dashboard / Overview

- Card data is entirely server-driven; an empty response now shows an empty
  state, but there is no static fallback.

## Timeline

- **Read-only and non-interactive.** No expansion, links, or dialog.
- Empty list now shows a message; no empty nested-projects block is rendered.

## Profile

- The résumé is the profile experience. The former dashboard profile with
  recommendations and skills is parked but its source remains available.

## Blog

- A `null` or empty response now shows an empty state instead of a blank grid.
- No pagination, filtering, search, or post preview/excerpt.

## Data layer

- No interceptors, retries, timeouts, or cancellation.
- All services are `providedIn: 'root'`, so state persists across navigation and
  pages re-fetch on every visit.
- No cache or shared store; each component fetches independently.
- No request/response typing beyond generics; runtime shape is assumed.
- **GitHub repository listing uses the existing owner/repositories API route.**
  The resume projects page calls
  `v1/github/owner/{username}/repositories`; the dashboard count uses the same
  route with `/count`.
- The resume Projects page reads client projects from
  `v1/project?includeTools=false`; the home page's Recent Projects preview is
  limited to the first two repositories returned by the GitHub list endpoint.

## Resume import (020)

- **Heatmap, ECharts wrapper, and commits pipeline were dropped.** In
  `web_resume` the heatmap was referenced nowhere and the chart wrapper only
  inside a commented-out line, so the whole ECharts dependency and the
  commit-aggregation effects were unreachable. They remain in git history via
  the import merge and can be resurrected from there.
- **Two `Maintenance` components exist** — the dashboard's
  `src/app/components/maintenance.ts` and
  `src/app/features/resume/components/maintenance.ts`. Both stay inside their
  own feature; unifying them is optional cleanup.
- **`devicon.min.css` no longer loads.** The redesigned tech-stack list uses
  derived letter marks instead of logo fonts, so the former jsDelivr stylesheet
  was removed from `src/index.html`.
- **`--type-color` was removed.** The alias for `--foreground` had no remaining
  consumers after the block system and imported templates were deleted.
- **`TRANSITION_MOVE_UP` was removed** with the old résumé card components; new
  components declare their own transition classes.
- The résumé and dashboard profile use the same `public/jg-profile.png` image.

## Dead code

- The unused résumé terminal widget and older marquee-based tech-stack
  component were removed during résumé cleanup. The landing page's active
  tech-stack list remains in use; its Maintenance component is retained but no
  longer rendered.
- The redesign removed the résumé block system (`BlockComponent`, dynamic host,
  block constants/types), the old `Card`, `Github`, `Highlights`, and `Spinner`
  components. The projects page now uses `ResumeSection`, `ProjectCard`, and
  `RepoGrid`.
- No known Spartan or rewrite dead code remains.

## Tooling / fixtures

- **ESLint** is configured (`eslint.config.js`, `npm run lint`) with
  conservative rules.
- **Prettier** is configured (`.prettierrc`, `format` / `format:check`), and all
  of `src/` is formatted.
- **CI** runs lint → format check → build → test on PRs and `main` pushes
  (`.github/workflows/ci.yml`).
- **Tests** cover shell routing, the shell state service, the user menu
  (keyboard/theme), the portfolio service error contract, theme behavior (OS
  preference, stored override, persistence), and the Overview, Timeline, and Blog
  screens (states, config header, date guard, URL rewrite).
- **Environment generation:** `scripts/genenv.js` overwrites
  `src/environments/*.ts` on `start`/`build` from `.env`; missing `.env` values
  produce an empty `portfolioApi`, which yields relative `/v1/...` calls. `dotenv`
  is an explicit dev dependency. CI does not need `.env` because the build only
  compiles.
- **Theme:** own `@theme` tokens replace the Spartan preset. Light and dark are
  both verified on every screen; the toggle lives in the avatar dropdown.
- **Dependencies:** Angular framework packages are floored at `^21.2.26`, which
  clears every runtime (`dependencies`) advisory — 0 high, 0 critical, 0 low in
  `npm audit`. Remaining advisories (2 distinct, moderate) are build/dev-only and
  reachable only through `@angular/cli` → `pacote`/`glob`/`minimatch` and the
  `eslint` dependency chain; each fix path requires a semver-major upgrade with
  no exposure for a static SPA.
- **Editor TypeScript version:** VS Code 1.143 bundles TypeScript 6.0.3, which
  reports TS5011 unless `rootDir` is explicit. `tsconfig.json` sets
  `rootDir: ./src`; the project still compiles with TypeScript 5.9.3.
- **Not applicable by architecture:** `HttpTransferCache` and SSR router
  advisories. `vercel.json` uses `@vercel/static-build` with no `server` output,
  and the app registers no `provideClientHydration()`, so those code paths never
  ship.

## Decisions for the Tailwind-only rewrite

1. **Legacy features:** dropped permanently (`bak` screens and dialog deleted).
2. **Routes:** unchanged URLs; light refresh only.
3. **Profile:** the résumé at `/` is the profile; the account menu's View
   profile item links there. Legacy `/profile` redirects to `/`.
4. **Header title:** derived from the route, with active-link styling. (006)
5. **Overview "View Details":** removed. (002)
6. **Error/empty states:** introduced in 002 and applied to every data screen;
   each screen styles them with the shared `StateMessage` (007).
7. **Icons:** keep `@ng-icons/lucide`; `HlmIcon` is gone and each component
   registers its own icons. (008)
8. **Design tokens:** own Tailwind `@theme` tokens replacing the Spartan preset.
   (004)
9. **Sidebar behavior:** reimplemented collapse and mobile overlay in plain
   Tailwind. (006)
10. **Notion config:** typed config module (decided). (005)
