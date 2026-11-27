# Rule: Definition of Done

**Status: mandatory.** A change is not complete until every item below is true.

## Verification

- [ ] `npm run build` succeeds with no new warnings.
- [ ] `npm test` passes.
- [ ] `npm run lint` passes once ESLint is added.
- [ ] All live screens still render: `/dashboard`, `/timeline`, `/profile`, `/blog`.
- [ ] Every affected data screen handles loading, empty, and error states.
- [ ] Keyboard navigation and `:focus-visible` states work.
- [ ] Responsive behavior is verified from mobile to desktop.
- [ ] No `@spartan-ng/*` or `libs/ui` imports were added.
- [ ] No `console.log`, commented-out code, or unused imports were introduced.
- [ ] No secrets or environment-specific URLs were committed.

## Process

- [ ] Use the AI harness's planning facility for substantial work when useful
  or requested; do not create a repository plan for every change.
- [ ] `docs/` is updated if routes, endpoints, models, UI behavior, or
  tooling changed.

## Anti-patterns

Do not:

- mark work done while a known failure or stuck loading state remains,
- defer documentation to a follow-up change,
- leave dead code "for later" without documenting its owner or rationale,
- add a dependency without recording its reason in the relevant change context,
- claim tooling (ESLint, CI, tests) exists before it is committed.