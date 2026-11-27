---
name: angular-add-component
description: Add a new standalone Angular component following the project conventions
---

# Add a new Angular component

## Prerequisites

- You are on the `task/harness-enhancement` or a feature branch
- The component has been designed and mocked in `docs/`

## Steps

### 1. Create component TypeScript file

Create `src/app/features/<area>/<component-name>.ts`:
- Use `standalone: true`
- Use `imports` for any needed directives (usually `CommonModule`, `NgIf`, `NgFor`)
- Use `changeDetection: ChangeDetectionStrategy.OnPush`
- Define inputs with `input()` and outputs with `output()`
- Use signals for internal state
- Inject dependencies via `inject()` (not constructor injection for new code)

### 2. Create HTML template

Create `src/app/features/<area>/<component-name>.html`:
- Use built-in control flow (`@if`, `@for`, `@switch`)
- Always provide stable `track` expression in `@for`
- No nested interactive elements (button inside button, link inside button)
- Keep accessibility first: `aria-label` on icon-only controls, `:focus-visible` states
- Use the design tokens, not arbitrary values

### 3. Create inline or separate styles

Prefer Tailwind CSS classes directly in HTML. If separate CSS is needed:
- Define styles in `src/styles.css` using `@theme` and CSS variables
- Reuse existing tokens: `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--ring`
- The brand accent is `#912F56`

### 4. Register in routes

If the component is a page, add it to `src/app/app.routes.ts`:
- Use `loadComponent` for lazy loading
- Keep routes backwards compatible
- Derive page titles from the router

### 5. Add to providers if needed

- `provideHttpClient()` must already be registered in `app.config.ts`
- Add HTTP services via `providedIn: 'root'` if they're shared
- Use `inject()` to get the `ApiClient` or entity services in the component

### 6. Handle states

Every component must handle:
- Loading state (show spinner/skeleton)
- Success state (display data)
- Empty state (show appropriate empty message)
- Error state (show error message with retry option)

### 7. Verify

- Run `npm run build` — no new warnings
- Run `npm test` — all tests pass
- Check responsive behavior from mobile to desktop
- Verify `:focus-visible` states are visible
- Check that no `@spartan-ng/*` imports were added