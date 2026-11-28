# Rule: Backend Integration (C# / .NET)

**Status: mandatory.** The frontend consumes a C# / .NET REST API. The backend
is a separate codebase; this repository contains no server code.

## Contract

- Base URL comes from `environment.portfolioApi` (generated from `.env` by
  `scripts/genenv.js`). Never hardcode the API host in code.
- The app is **read-only for reads**: entity reads are GET. The explicit
  exceptions are JWT-gated experience add/edit on `/timeline` (`POST`/`PUT
  v1/admin/experience[/…]`), approved in implementation history 046; JWT-gated
  project creation from the routed experience projects page (`POST
  v1/admin/experience/{experienceId}/project`) and project field edit on
  `/dashboard/project/:id` (`PUT v1/admin/project/{id}`), approved in
  implementation histories 047 and 049; JWT-gated per-project stack replacement
  on `/dashboard/project/:id` (`PUT
  v1/admin/project/{id}/tech-stacks`), approved in history 051; and
  category/skill administration on `/dashboard/settings` (`POST
  v1/admin/skill-category`, `POST v1/admin/skill`), approved in history 050.
  Settings also calls JWT-gated category update/delete methods through
  `ProjectStackService`; skill edit/delete methods remain unused by the UI.
  Reorder is not implemented because the API exposes no order field.
  Project create/edit payloads must stay fields-only because the deployed
  schemas reject `techStackIds`. Do not build other CRUD UI without an explicit
  decision. Auth validation is also a GET, with a Bearer token.
- Live endpoints:
  - `GET v1/overview`
  - `GET v1/github/owner/{username}/repositories/count`
  - `GET v1/notion/{pageId}/count`
  - `GET v1/experience?includeProjects=false`
  - `GET v1/experience/{id}`
  - `GET v1/project?includeTools=false`
  - `GET v1/project/{id}`
  - `GET v1/skill`
  - `GET v1/skill-category`
  - `GET v1/recommendation`
  - `GET v1/notion/{pageId}`
  - `GET v1/auth/me` — Bearer token required; returns `AuthClaims`, including
    `exp` (Unix seconds in a `string[]`)
  - `POST v1/admin/experience` — Bearer token required; `ExperienceDto`
  - `PUT v1/admin/experience/{id}` — Bearer token required; `ExperienceDto`
  - `POST v1/admin/experience/{experienceId}/project` — Bearer token required;
    `CreateProjectRequest` returns `ProjectDto`
  - `PUT v1/admin/project/{id}` — Bearer token required; `UpdateProjectRequest`
    returns `ProjectDto`
  - `POST v1/admin/skill-category` — Bearer token required;
    `SkillCategoryRequest { category }` returns `SkillCategoryDto`
  - `POST v1/admin/skill` — Bearer token required; `CreateSkillRequest`
    `{ stackName, imgSrc, category }` returns `TechStackDto`; category is
    resolved by name
  - `PUT v1/admin/skill-category/{id}` — Bearer token required;
    `SkillCategoryRequest { category }` returns `SkillCategoryDto`
  - `DELETE v1/admin/skill-category/{id}` — Bearer token required; `204`, with
    `409` documented for conflicts
  - `PUT v1/admin/skill/{id}` — Bearer token required; `UpdateSkillRequest`
    `{ stackName, imgSrc, category }` returns `TechStackDto`; category is
    resolved by name
  - `DELETE v1/admin/skill/{id}` — Bearer token required; `204`, with `409`
    when projects still reference the skill
  - `PUT v1/admin/project/{id}/tech-stacks` — called by the project skills
    screen; `ReplaceProjectTechStacksRequest { techStackIds }` returns
    `ProjectDto`
- `POST v1/auth/login` is **not called by the frontend**. The admin JWT is
  obtained manually and pasted into the dashboard gate. Client-side expiry from
  `exp` is session UX only; the server remains the authority on validity.
- Legacy endpoints are not used: `v1/portfolio/count`,
  `v1/portfolio/projects`, `v1/experience/{id}/projects`.
- Do not guess endpoints or response shapes. If something is undocumented, ask.
- The deployed API exposes Swagger at `/swagger/v1/swagger.json`; the local
  checkout may lag the deployed contract. `environment.portfolioApi` plus the
  models in `core/models` remain the frontend source of truth.

## Code boundary

- All requests go through `ApiClient` and entity services. Components must not
  use `HttpClient` directly.
- Type request and response models in
  `src/app/features/dashboard/core/models/`.
- If write operations are introduced, add typed request/response models and a
  service method. Never put mutation logic in components.
- Update the corresponding interface **and** `docs/` whenever the
  backend contract changes.
- Surface API failures as explicit error states; do not swallow them or leave
  loading states stuck.

## Configuration and secrets

- Notion page ID and public domain must not be hardcoded in components; use the
  typed site configuration described in `docs/current-state.md`.
- Never commit secrets, tokens, API keys, or `.env` contents. `.env` is
  gitignored; `.env.example` is the template.
- Do not add CORS workarounds or proxy hacks without documenting the constraint.