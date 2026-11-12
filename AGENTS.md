# AGENTS.md

Entry point for AI agents and contributors. This file is intentionally short:
**facts here, rules in `.github/rules/`, and current state in `.github/docs/`.**
When this file and a rule disagree, the rule wins.

## 1. What this is

A portfolio and résumé dashboard for a software engineer (Jonathan Golimlim).
The résumé feature in `src/app/features/resume/` provides the public pages at
`/` and `/projects`, outside the dashboard shell. `/` composes the profile,
About, timeline, certifications, Recent Projects, and Technical Stack;
`/projects` shows client-project cards and the full GitHub repository list.
The dashboard lives under `/dashboard` and provides an overview, career
timeline, and a Notion-backed blog. The app is **read-only**.

Angular SPA that consumes an external **C# / .NET REST API**; no server code
lives in this repository.

The UI is **plain Tailwind CSS**; the Spartan-to-Tailwind rewrite is complete.
Past implementation work is summarized in
`.github/docs/implementation-history.md`.

## 2. Stack and commands

| Concern   | Choice                                           |
| --------- | ------------------------------------------------ |
| Framework | Angular 21 — standalone, signals, lazy routes    |
| Language  | TypeScript 5.9                                   |
| Styling   | Tailwind CSS v4 (PostCSS), dark by default       |
| Icons     | `@ng-icons/core` + `@ng-icons/lucide`            |
| Tests     | Vitest via `@angular/build:unit-test`            |
| Hosting   | Vercel                                           |
| Backend   | C# / .NET REST API at `environment.portfolioApi` |

```bash
npm start          # generate env + dev server (development)
npm run start:prod # generate env + dev server (production)
npm run build      # generate env + development build
npm run build:prod # generate env + production build (Vercel)
npm test           # unit tests
```

`npm start` / `npm run build*` run `scripts/genenv.js`, which **overwrites**
`src/environments/environment*.ts` from `.env`. Edit `.env`, never the generated
files. Never commit secrets.

## 3. Read before changing anything

- **Current state:** `.github/docs/`
  - `current-state.md` — architecture, routing, data layer, endpoints
  - `screens.md` — screen-by-screen behavior
  - `gaps.md` — bugs, dead code, missing states
  - `implementation-history.md` — compact index of past implementation work

- **Mandatory rules:** `.github/rules/`
  - [`angular.md`](./.github/rules/angular.md) — components, signals, HTTP,
    routing, templates, accessibility
  - [`tailwind.md`](./.github/rules/tailwind.md) — tokens, theme, responsive
    design, Spartan migration constraints
  - [`backend.md`](./.github/rules/backend.md) — .NET API contract and
    integration
  - [`quality.md`](./.github/rules/quality.md) — definition of done
  - [`plans.md`](./.github/rules/plans.md) — when and where to plan work
  - [`documentation.md`](./.github/rules/documentation.md) — documentation rules

- **Implementation history:** `.github/docs/implementation-history.md` — consult
  only when historical context is relevant; it is not a required step for each
  task.

## 4. Non-negotiables

1. **Plan appropriately.** Use the AI harness's planning facility (Copilot or
   OpenCode) for substantial work when useful or requested. Do not create a
   repository plan file for every change.
2. **No Spartan UI.** It was removed. Do not reintroduce `@spartan-ng/*`,
   a vendored `libs/ui`, or a Spartan Tailwind preset; build with plain Tailwind.
3. **Angular conventions.** Standalone components only; `inject()`; signals;
   `input()`/`output()`; `OnPush`; built-in control flow with `track`.
4. **Respect the HTTP boundary.** All requests go through `ApiClient` and
   entity services — never `HttpClient` in a component. `provideHttpClient()`
   must be registered.
5. **Type everything.** API responses live in `core/models`; no `any`, no inline
   response shapes. Handle loading, empty, and error states — never leave a
   skeleton running forever.
6. **Keep the routes.** `/` (résumé/profile), `/projects`, `/dashboard`,
   `/timeline`, `/blog`, legacy `/profile` → `/`, and wildcard → `/dashboard`.
   Titles and active states come from the router.
7. **Tailwind only.** Reuse design tokens; accent `#912F56`; never build class
   names dynamically (`bg-${color}`); mobile-first.
8. **Accessibility and valid HTML.** Landmarks, heading order, `aria-label` on
   icon-only controls, visible focus, no nested interactive elements.
9. **No secrets, no generated-file edits, no `console.log`.**
10. **Update the docs.** If behavior, routes, endpoints, models, or tooling
    change, update `.github/docs/` in the same change.

## 5. Known landmines

These are real constraints and intentional gaps, not hypotheticals:

- `Maintenance` is retained but unrouted; it is plain Tailwind, not a route.
- `/` is the résumé/profile page and renders **outside** the dashboard shell.
  The shell owns the empty path too, so the landing route must stay declared
  first with `pathMatch: 'full'`. `/` no longer redirects to `/dashboard`;
  **View profile** in the account menu links to `/`, and both résumé pages link
  back to `/dashboard`. The sidebar footer contains only the collapse control.
  Legacy `/profile` redirects to `/`.
- `github/repos` is not implemented in the .NET API yet; the projects page shows
  its empty state until it is. The GitHub token lives on the API — never put one
  in the frontend environment.
- Blog intentionally has no pagination, search, or excerpts.
- `scripts/genenv.js` requires `.env` (`dotenv` is explicit); running
  `npm run build` rewrites `src/environments/*.ts`.

See `.github/docs/gaps.md` for the full list.

## 6. Workflow

1. Read `.github/docs/` for the area you are touching.
2. For substantial work, use the AI harness's planning facility when useful or
   requested; consult the implementation history only when relevant.
3. Implement in small steps.
4. Verify: `npm run build`, `npm test`, manual check of every affected route,
   loading/empty/error states, responsive and keyboard behavior.
5. Update `.github/docs/` when behavior or current-state information changes.

The full definition of done is in `.github/rules/quality.md`.

## 7. Repository map

```
src/app/core/            # ApiClient, site config, theme, sidebar menu
src/app/features/dashboard/
  shell/                 # sidebar + header + router outlet
  pages/                 # overview, timeline, profile, blog
  core/                  # models
src/app/features/resume/ # public landing page + projects (imported, 020)
  pages/home/            # résumé landing page
  pages/projects/        # project cards + GitHub repos
  components/  github/  projects/  core/
src/app/shared/          # services, signal state, utils
src/app/components/      # Maintenance placeholder (unrouted)
src/environments/        # generated by scripts/genenv.js — do not edit
public/                  # static assets
.github/docs/            # current state and compact implementation history
.github/rules/           # mandatory rules
```
