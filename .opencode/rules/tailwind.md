# Rule: Tailwind CSS

**Status: mandatory.** Tailwind is the only styling system in this project.

## Migration constraint

The project is migrating **away from Spartan UI** to plain Tailwind CSS.

- Do **not** add new `@spartan-ng/*` imports, components, or directives.
- Do **not** scaffold into `libs/ui` or modify `components.json`.
- Do **not** import `@spartan-ng/brain/hlm-tailwind-preset.css` in new work.
- Replace Spartan incrementally as each Tailwind equivalent lands.
- When the redesign is complete, uninstall `@spartan-ng/*`, delete `libs/ui/**`
  and `components.json`, and remove the preset import.
- Do not introduce another component library without an explicit decision.
- A **light visual refresh** is allowed (spacing, typography, card styling), but
  screens, flow, routes, and features must be preserved.

## Configuration

- Tailwind **v4** is CSS-first. Define tokens in `src/styles.css` using `@theme`
  and CSS variables; do not add a JS Tailwind config unless a concrete need
  arises.
- Reuse existing tokens: `--background`, `--foreground`, `--card`, `--muted`,
  `--border`, `--ring`, `--sidebar*`, `--radius`.
- The brand accent is `#912F56`. Use it sparingly for labels, active states, and
  emphasis. Do not invent new brand colors.
- Never construct class names dynamically (for example `` `bg-${color}-500` ``).
  Tailwind cannot detect them. Use complete static strings, class maps, or
  conditional full class names.
- Prefer utilities and tokens over arbitrary values. Arbitrary values such as
  `bg-[#912F56]` are allowed only when no token exists.
- No inline `style` attributes for theming. Use utilities or CSS variables.
- Avoid `@apply` except for global base setup in `src/styles.css`.

## Layout and responsive design

- Mobile-first: style the small viewport first, then layer `sm:`, `md:`, `lg:`.
- Preserve the current responsive behavior unless a change is requested.
- Keep the shared layout consistent: centered content, `max-w-300` (~1200px),
  `p-3`, and a sticky header with `border-b` and background.
- Prefer `flex`/`grid` with `gap-*` over margins for spacing between siblings.

## Theme

- Dark is the default theme (`<html class="dark">`).
- A light/dark toggle is part of the target design. It must:
  - toggle the `dark` class on `<html>`,
  - persist the user's choice,
  - respect `prefers-color-scheme` on first load,
  - update `color-scheme` and both token sets.
- Every color used in a component must be legible in both themes once the toggle
  exists.

## Motion and states

- Use transition utilities (`transition-all duration-300`) rather than custom
  keyframes unless a design requires more.
- Always implement hover, focus-visible, disabled, loading, empty, and error
  visual states for interactive UI.
- Maintain visible focus indicators; never remove outlines without a replacement.