# PortfolioDashboard

![angular](https://img.shields.io/badge/angular_v21-darkred?style=for-the-badge&logo=angular)
![tailwindcss](https://img.shields.io/badge/tailwindcss_v4-black?style=for-the-badge&logo=tailwindcss)

A portfolio and résumé dashboard for Jonathan Golimlim, built with Angular 21,
Tailwind CSS v4, and an external C# / .NET REST API. The public résumé pages are
open to everyone; the dashboard and its admin actions are gated by a JWT pasted
at runtime. This repository contains only the Angular SPA — no server code.

## Pages

### Public résumé

| Route       | Description                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`         | Résumé landing page: profile, About, experience timeline, certifications, projects, recommendations, technical stack, and GitHub activity. |
| `/projects` | Client project cards and the GitHub repository list.                                                                                       |
| `/profile`  | Legacy alias that redirects to `/`.                                                                                                        |

These pages render outside the dashboard shell. `/` is the landing route, not a
redirect to the dashboard.

### Dashboard

The dashboard shell is guarded by `authGuard`. Its sidebar contains Dashboard,
Timeline, Blog, and Toolbox; Settings is a utility link above the footer.

| Route                                          | Description                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dashboard`                                   | Overview metrics from the API, GitHub, and Notion.                                  |
| `/timeline`                                    | Career timeline with add/edit experience forms.                                     |
| `/dashboard/experience/:experienceId/projects` | Projects for one experience, with an add-project form and links to project details. |
| `/dashboard/project/:id`                       | Project details, fields-only edit, and tech-stack picker/replacement.               |
| `/blog`                                        | Notion-backed post list with links to the public pages.                             |
| `/dashboard/toolbox`                           | Admin tables for tech-stack categories and skills.                                  |
| `/dashboard/settings`                          | Theme-only Light/Dark control.                                                      |
| `/settings`                                    | Legacy alias that redirects to Toolbox.                                             |
| `/*` (inside the shell)                        | Redirects to `/dashboard`.                                                          |

Dashboard content pages share a centered `max-w-5xl` column with responsive
gutters so Overview, Timeline, projects, Blog, Toolbox, and Settings line up.

## Admin access and writes

The app does not call `POST /auth/login`. Obtain an admin JWT out of band and
paste it into the dashboard gate dialog. The token is validated with
`GET v1/auth/me`, stored in `sessionStorage`, attached as a Bearer header, and
given a local expiry warning based on the `exp` claim. The server remains the
authority on validity, and the account menu can lock the session immediately.

Portfolio reads stay anonymous on the server. JWT-gated writes are limited to:

- Add/edit experiences from `/timeline`.
- Add projects from `/dashboard/experience/:experienceId/projects`.
- Edit project fields and replace tech stacks from `/dashboard/project/:id`.
- Create, rename, recategorize, and delete categories/skills from
  `/dashboard/toolbox`.

Toolbox uses tabular views with icon-only actions, native tooltips, accessible
labels, inline delete confirmations, usage counts, and row-level errors. Project
create/edit payloads remain fields-only; skills are managed on the project
screen or in Toolbox.

## Architecture

- Angular 21 standalone components, signals, `input()`/`output()`, `OnPush`, and
  lazy-loaded routes.
- All HTTP goes through `ApiClient` and typed entity services; components never
  call `HttpClient` directly.
- Typed API DTOs and request models live in `features/dashboard/core/models`.
- Every data screen handles loading, empty, and error states with retry where
  appropriate.
- Plain Tailwind CSS v4 with CSS-first `@theme` tokens; no Spartan UI.
- Dark theme by default, with a persisted Light/Dark toggle in Settings.
- `@ng-icons/core` + `@ng-icons/lucide` for icons; no component library.
- Vitest unit tests, ESLint, and Prettier.

## Commands

| Command                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `npm install`          | Install dependencies.                                   |
| `npm start`            | Generate env files and start the development server.    |
| `npm run start:prod`   | Generate env files and start the production dev server. |
| `npm run build`        | Generate env files and run a development build.         |
| `npm run build:prod`   | Generate env files and run a production build.          |
| `npm test`             | Run the Vitest suite in watch mode.                     |
| `npm run lint`         | Lint TypeScript and HTML with ESLint.                   |
| `npm run format:check` | Check source formatting with Prettier.                  |

Vercel uses `npm run vercel-build`, which runs the production build.

## Configuration

Create a local `.env` from `.env.example` and set `PORTFOLIO_API` to the .NET
API base URL. `npm start` and every `npm run build*` script run
`scripts/genenv.js`, which overwrites `src/environments/*.ts`. Edit `.env`, never
the generated files, and do not commit secrets.
