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

- Read-only and non-interactive: no expansion, links, or dialog.
- No empty nested-projects block is rendered.

## Blog

- No pagination, filtering, search, or post preview/excerpt.

## Résumé content

- Identity and links come from `site`. About fastfetch copy (`cat bio.txt`
  narrative + facts) and certification labels are hardcoded in components.
- The résumé and parked dashboard profile use `public/jg-profile.png`.

## Data layer

- No interceptors, retries, timeouts, or cancellation.
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
- Login is manual: the app never calls `/auth/login`. Tokens expire in ~60
  minutes; an expired token still passes the guard after a reload until a
  request fails. There is no global 401 handler — data screens show their
  error state, and **Lock dashboard** clears the token.
- The token is held in `sessionStorage` and sent on every request. No runtime
  claim/role checks are performed in the frontend.
- The Contact section's **View dashboard** CTA is still a plain `routerLink`;
  with no token the guard sends it back to `/` without opening the token dialog.
  The header icon is the supported unlock entry point.
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
  theme behavior, and Overview/Timeline/Blog screens.
- `scripts/genenv.js` overwrites `src/environments/*.ts` on `start`/`build`
  from `.env`; missing values yield relative `/v1/...` calls. `dotenv` is an
  explicit dev dependency.
- Angular packages floored at `^21.2.26` (clears runtime advisories). Remaining
  moderate advisories are build/dev-only via `@angular/cli` and `eslint`.
- `tsconfig.json` sets `rootDir: ./src` for TypeScript 6 editor diagnostics;
  compiles with 5.9.3.