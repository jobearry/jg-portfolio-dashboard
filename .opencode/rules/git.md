# Rule: Git

## Branch naming

- `feature/<short-topic>`  — integration branch for a feature
- `fix/<short-topic>`     — bug fix branch
- `chore/<short-topic>`   — maintenance/tooling branch
- `docs/<short-topic>`    — documentation branch
- `task/<short-topic>`    — short-lived task branch

## Branch strategy

### Feature branches

- **One `feature/<topic>` branch per feature** — the integration branch that
  accumulates completed phases.
- Feature branches receive PRs from their task branches.
- Only `feature/<topic>` branches are PR'd to `main`/`master`.
- Feature branches are based on `main` and may have task branches merged into
  them incrementally.

### Task branches

- **Each phase gets a `task/<phase-name>` branch** cut from the feature
  branch.
- Implement the phase on the task branch, verify, then open a PR **to the
  feature branch**.
- **Do not chain task branches** (task-2 cut from task-1); always cut from the
  current tip of the feature branch so phases integrate cleanly.
- Task branches are short-lived and deleted after their PR is merged to the
  feature branch.
- **Task branches never target `main` directly.**

### Commit messages

Conventional Commits format:

```
<type>(<scope>): <subject>

Body: explains **why**, not what (the diff shows what). Wrapped at ~72 chars.
Subject: imperative mood, ≤ 72 chars, no trailing period.

Types: feat, fix, docs, refactor, test, chore
```

### Verification before merge

- `npm run build` must pass
- `npm test` must pass
- `docs/` updated if routes, endpoints, models, UI behavior, or tooling changed
- No `@spartan-ng/*` or `libs/ui` imports added
- No `console.log`, commented-out code, or unused imports

## Reference

See `.opencode/rules/quality.md` for the Definition of Done checklist.
See `AGENTS.md` for project entry point and rules location.