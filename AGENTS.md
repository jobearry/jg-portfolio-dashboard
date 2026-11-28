# AGENTS.md

Entry point for AI agents and contributors. This file is intentionally short:
**facts here, rules in `.opencode/rules/`, and current state in `docs/`.**
When this file and a rule disagree, the rule wins.

## 1. What this is

A portfolio and résumé dashboard for a software engineer (Jonathan Golimlim).
The résumé feature in `src/app/features/resume/` provides the public pages at
`/` and `/projects`, outside the dashboard shell. `/` composes the profile,
About, timeline, certifications, Recent Projects, and Technical Stack;
`/projects` shows client-project cards and the full GitHub repository list.
The dashboard lives under `/dashboard` and provides an overview, career
timeline, a Notion-backed blog, a routed per-experience projects page, a project
details and skills screen, and a Settings page. Data access is **read-only except
for JWT-gated experience add/edit on `/timeline`, project creation from the
per-experience projects page, project field edit and stack replacement on
`/dashboard/project/:id`, plus create-only category/skill administration on
`/dashboard/settings`**. The dashboard is gated by a JWT that the visitor pastes
into the header dialog; the public résumé pages stay open. **View projects** on a
timeline card opens `/dashboard/experience/:experienceId/projects`, where new
projects are created and existing ones link to `/dashboard/project/:id`. Project
create/edit payloads stay fields-only; skills are managed on the project screen.
The account menu contains session/account actions only; the Light/Dark theme
control lives in Settings.

Angular SPA that consumes an external **C# / .NET REST API**; no server code
lives in this repository.

The UI is **plain Tailwind CSS**; the Spartan-to-Tailwind rewrite is complete.
Past implementation work is summarized in
`docs/implementation-history.md`.

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

- **Current state:** `docs/`
  - `current-state.md` — architecture, routing, data layer, endpoints
  - `screens.md` — screen-by-screen behavior
  - `gaps.md` — bugs, dead code, missing states
  - `implementation-history.md` — compact index of past implementation work

- **Mandatory rules:** `.opencode/rules/` (the canonical harness rules)
  - [`angular.md`](./.opencode/rules/angular.md) — components, signals, HTTP,
    routing, templates, accessibility
  - [`tailwind.md`](./.opencode/rules/tailwind.md) — tokens, theme, responsive
    design, Spartan migration constraints
  - [`backend.md`](./.opencode/rules/backend.md) — .NET API contract and
    integration
  - [`quality.md`](./.opencode/rules/quality.md) — definition of done
  - [`plans.md`](./.opencode/rules/plans.md) — when and where to plan work
  - [`documentation.md`](./.opencode/rules/documentation.md) — documentation rules
  - [`testing.md`](./.opencode/rules/testing.md) — Vitest testing conventions
  - [`terminal-commands.md`](./.opencode/rules/terminal-commands.md) — shell rules

- **Implementation history:** `docs/implementation-history.md` — consult
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
   `/timeline`, `/dashboard/experience/:experienceId/projects`, `/blog`,
   `/dashboard/project/:id`, `/dashboard/settings`, legacy `/profile` → `/`, and
   wildcard → `/dashboard`. Titles and active states come from the router.
7. **Tailwind only.** Reuse design tokens; accent `#912F56`; never build class
   names dynamically (`bg-${color}`); mobile-first.
8. **Accessibility and valid HTML.** Landmarks, heading order, `aria-label` on
   icon-only controls, visible focus, no nested interactive elements.
9. **No secrets, no generated-file edits, no `console.log`.**
10. **Keep auth in `core/auth`.** The JWT is pasted at runtime, stored in
    `sessionStorage`, and attached by `authInterceptor`. Never commit a token
    or put one in the environment; the app does not call `/auth/login`.
11. **Update the docs.** If behavior, routes, endpoints, models, or tooling
    change, update `docs/` in the same change.

## 5. Known landmines

These are real constraints and intentional gaps, not hypotheticals:

- `Maintenance` is retained but unrouted; it is plain Tailwind, not a route.
- `/` is the résumé/profile page and renders **outside** the dashboard shell.
  The shell owns the empty path too, so the landing route must stay declared
  first with `pathMatch: 'full'`. `/` no longer redirects to `/dashboard`;
  **View profile** in the account menu links to `/`, and both résumé pages link
  back to `/dashboard`. The Settings utility link sits directly above the
  sidebar footer, which contains only the collapse control. Legacy `/profile`
  redirects to `/`.
- `github/repos` is not implemented in the .NET API yet; the projects page shows
  its empty state until it is. The GitHub token lives on the API — never put one
  in the frontend environment.
- The dashboard gate is UI-only for reads: portfolio reads stay anonymous on the
  server, while the admin experience, project, and stack write endpoints require
  the JWT. Project create/edit payloads stay fields-only; stack replacement is
  called only from `/dashboard/project/:id`. The JWT is a shared service token,
  not a user identity. It is pasted at runtime and never committed.
- Blog intentionally has no pagination, search, or excerpts.
- `scripts/genenv.js` requires `.env` (`dotenv` is explicit); running
  `npm run build` rewrites `src/environments/*.ts`.

See `docs/gaps.md` for the full list.

## 6. Workflow

1. Read `docs/` for the area you are touching.
2. For substantial work, use the AI harness's planning facility when useful or
   requested; consult the implementation history only when relevant.
3. Implement in small steps.
4. Verify: `npm run build`, `npm test`, manual check of every affected route,
   loading/empty/error states, responsive and keyboard behavior.
5. Update `docs/` when behavior or current-state information changes.

The full definition of done is in `.opencode/rules/quality.md`.

## 7. Repository map

```
src/app/core/            # ApiClient, site config, theme, sidebar menu
src/app/features/dashboard/
  shell/                 # sidebar + header + router outlet
  pages/                 # overview, timeline, project, profile, blog, settings
  core/                  # models
src/app/features/resume/ # public landing page + projects (imported, 020)
  pages/home/            # résumé landing page
  pages/projects/        # project cards + GitHub repos
  components/  github/  projects/  core/
src/app/shared/          # services, signal state, utils
src/app/components/      # Maintenance placeholder (unrouted)
src/environments/        # generated by scripts/genenv.js — do not edit
public/                  # static assets
docs/            # current state and compact implementation history
.opencode/               # OpenCode harness: rules, skills, agents, commands
```
