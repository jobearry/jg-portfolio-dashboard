# Rule: Planning Work

**Status: mandatory.** Choose a planning approach proportionate to the work.

## Planning

Use the AI harness's native planning facility (for example, Copilot or OpenCode)
for substantial, multi-step work when it is useful or requested. A plan is not
required for every feature, refactor, bug fix, or small change.

Do not create a numbered repository plan for each task. Keep task plans in the
AI harness rather than duplicating them in the repository.

## Repository plans

- Past numbered plans 001–040 are summarized in
  `docs/implementation-history.md`; original details remain in Git
  history.
- Do not add a repository plan for routine work. If a durable, cross-task plan
  is explicitly needed in the repository, use one living
  `.github/plans/plan.md` and update it.
- Keep rules in `.opencode/rules/` and current-state documentation in
  `docs/`.

## Documentation and verification

Update `docs/` when user-visible behavior or the documented current
state changes. Run the tests and checks appropriate to the change; record
verification in the harness plan when one is being used.