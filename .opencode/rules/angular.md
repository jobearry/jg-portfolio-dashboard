# Rule: Angular

**Status: mandatory.** Applies to every Angular file in `src/`.

## Components

- **Standalone components only.** Never create `NgModule`s.
- Use `inject()` for dependency injection. Do not use constructor parameter
  injection in new code.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on new components.
- Use `input()` and `output()` signal APIs for component boundaries.
- Prefer `templateUrl` + a separate `.html` for non-trivial templates. Inline
  templates are acceptable only for small components.
- No direct DOM manipulation; use bindings, signals, and Angular APIs.
- Do not create components that both fetch and own layout in the same class;
  separate data access (services) from presentation.

## State and data

- Use **signals** for component and shared state. Do not add NgRx or another
  state library.
- Keep **all HTTP access behind a service** (`ApiClient` and entity services).
  Components must never inject `HttpClient` directly.
- `provideHttpClient()` must be registered in `app.config.ts`.
- Every request must handle **loading, success, empty, and error**. Never leave a
  skeleton or spinner running indefinitely.
- Type every API response with an interface in
  `src/app/features/dashboard/core/models/`. No `any`, no untyped generic call
  sites, no inline response shapes.
- Do not hardcode API origins, Notion page IDs, or environment-specific URLs in
  components; use `environment` or a dedicated config module.
- Prefer `firstValueFrom` + signals (current pattern) or
  `takeUntilDestroyed`; avoid manual subscriptions that can leak.
- No `console.log` or debug output in committed code.

## Routing

- Lazy-load route components with `loadComponent`; keep the shell eager.
- Keep routes backwards compatible unless a change is explicitly requested:
  `/dashboard`, `/timeline`, `/profile`, `/blog`, wildcard → `/dashboard`.
- Derive page titles and active states from the router, not from click handlers.
- Route definitions must remain typed and centralized in `app.routes.ts`.

## Templates

- Use the built-in control flow (`@if`, `@for`, `@switch`).
- Always provide a stable `track` expression in `@for`.
- Do not nest interactive elements (for example `<button>` inside `<button>` or
  a link inside a button).
- Keep accessibility first: landmark elements (`nav`, `main`, `section`), logical
  heading order, `aria-label` on icon-only controls, and visible
  `:focus-visible` states.

## Component hygiene

- Prefer signals over mutable class fields for reactive values.
- Remove unused imports and dead code in the same change that makes them unused.
- Do not leave commented-out implementations.
- Keep components small and single-purpose.