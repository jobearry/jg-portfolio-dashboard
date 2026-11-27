# Rule: Documentation

**Status: mandatory.** Documentation must describe reality, not intentions.

## Requirement

`docs/` records the **current state** of the application. It is not a
planning area and not a rulebook.

- Use the AI harness's planning facility for task plans; do not copy routine
  task plans into the repository.
- A persistent repository plan, when explicitly needed, lives in
  `.github/plans/plan.md`. Past implementation plans are summarized in
  `docs/implementation-history.md`.
- Agent/contributor rules go in `.opencode/rules/` (this file).
- Current behavior, architecture, and known issues go in `docs/`.

## Keeping docs accurate

Update `docs/` in the same change whenever any of these change:

- routes or navigation flow
- screen layout, content, or interactions
- API endpoints, request/response models, or data services
- state management patterns
- styling system or design tokens (including Spartan removal progress)
- environment variables, build steps, or deployment behavior
- known bugs, dead code, or technical debt

Stale docs are a defect. If a change makes a statement in `docs/`
untrue, the change is not complete.

## Writing rules

- Document what exists today; do not describe planned work as if it were built.
- Use the source of truth: read the code before editing docs.
- Include file paths for every claim so readers can verify.
- State gaps and risks explicitly; do not hide them.
- Do not add a README to `docs/`. `AGENTS.md` is the entry point and
  lists the documents.
- Keep documents focused:
  - `current-state.md` — architecture, routing, data layer, endpoints, models
  - `screens.md` — screen-by-screen behavior
  - `gaps.md` — bugs, dead code, missing states, open decisions
  - `implementation-history.md` — compact index of implemented or superseded work