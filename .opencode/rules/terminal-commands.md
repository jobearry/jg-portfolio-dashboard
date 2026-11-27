# Terminal command rules

The decision owner supervises shell access to this repository. An agent may run
commands, but it must not run commands that change state the owner has not
explicitly agreed to.

## 1. The default

**Show the command, then run it.** Before a command that is not on the
"routine" list in §2, state exactly what it will do and what it will touch.
The owner can veto.

Prefer the narrowest command that does the job:

- Edit files with the editor tools, not `sed`/`cat >`/heredocs. A file edit
  shows up in the diff; a shell rewrite does not.
- Read with the read tool, not `cat`.
- Reserve the shell for what only a shell can do: `npm run build`, `npm test`,
  `git`, `node`, process control.

## 2. Routine — run without asking

Read-only, local, and reversible. These do not need a preamble:

| Command | Why it is safe |
|---|---|
| `npm run build`, `npm test`, `npm start` | local, no side effects outside the repo |
| `git status`, `git diff`, `git log`, `git show`, `git blame` | read-only |
| `git add`, `git stash` | local and reversible |
| `grep`, `rg`, `find`, `ls`, `sed -n` (read-only) | read-only |
| `npm run lint` (once added) | reports only |

## 3. Ask first — state changes

Each of these needs the owner's explicit go-ahead. State the command, what it
changes, and what it cannot be undone by.

| Command | Why it needs approval |
|---|---|
| `npm install <package>` / `npm uninstall` | modifies `package.json` and lockfile |
| `git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard` | changes history or the remote |
| `git clean`, `rm`, `git checkout --` | **deletes work** |
| `git branch -D`, `git worktree remove` | destroys a branch or worktree |
| `git push --force` | rewrites the remote |
| `npm run build:prod` | modifies `src/environments/*.ts` (generated files) |
| `node scripts/genenv.js` | overwrites `src/environments/*.ts` |
| `curl`/`wget` that write files, or hit a non-localhost host | external effect |
| starting a long-running or background process | occupies a port and the machine |

**Environment regeneration is gated.** `npm start` and `npm run build*` run
`scripts/genenv.js`, which overwrites `src/environments/*.ts` from `.env`.
Edit `.env`, never the generated files. If you need to verify an environment
value, read `.env` and confirm `environment.portfolioApi` is populated — do not
edit the generated files directly.

## 4. Secrets

- Never print a secret value. `.env` contains secrets — read it, then redact the
  output before showing it.
- Never pass a secret on a command line; it lands in the shell history and in
  the process list. Use environment variables that are redacted in any output.
- Never `cat` a file whose contents are credentials (`.env` when it contains
  tokens).

## 5. Phases

When a task has phases, **stop and ask before starting the next one.** Report
what the finished phase did, what was verified, and what the next phase would
change. The owner decides whether to continue.

A phase boundary is also the right place to surface a question that would
otherwise be discovered mid-implementation — a missing decision, a
contradiction between two documents, or a choice that changes the shape of the
work.

## 6. Verification is not a phase

Running the build, the tests, or a read-only query to check the work is part
of the phase that produced it, not a new phase. Do it, then report the result.

But anything that **persists** — committing, pushing, installing a package —
is a phase boundary of its own.