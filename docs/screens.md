# Screens

Live screens: how they're reached, what they render, data source, interactions.

## Shell (`/dashboard`, `/timeline`, `/blog`)

**Files:** `features/dashboard/shell/{dashboard,sidebar/header,user-menu,shell-state.service}`

- Sidebar: avatar (name + role), menu (Dashboard/Timeline/Blog), footer with
  desktop-only collapse (16rem ↔ 4.5rem, persisted). Mobile: off-canvas panel
  below `md` with overlay, Escape, scroll lock, focus return.
- Sticky header: mobile trigger + route title (`h1`) from `data.pageTitle`.
- Content: centered `max-w-[75rem]`, `p-3`, inside `<main>`.
- Active link: `routerLinkActive` exact + `aria-current="page"`.
- Avatar dropdown: session countdown (whole minutes), **View profile** (`/`),
  **Download CV** (new tab), theme toggle, **Lock dashboard** (clears the JWT,
  returns to `/`). Keyboard + outside click handled; focus returns to trigger.
- Theme: stored choice / `prefers-color-scheme`, applied pre-paint.
- **Access:** `authGuard` on the shell route sends visitors without a valid,
  unexpired JWT back to `/` and reopens the gate. Direct `/dashboard`,
  `/timeline`, and `/blog` URLs are gated too; a non-validation 401 does the
  same from inside the shell.

---

## 1. Overview — `/dashboard`

**File:** `features/dashboard/pages/overview/{ts,html}`

- **Data:** `v1/overview` → `OverviewItem[]`; GitHub count; Notion count. All in
  parallel via `OverviewSignalService`.
- **States:** `app-skeleton` (`metric` cards) while loading; shared error block
  with **Try again**; empty message when no items. Each count card has its own
  skeleton/error/**Try again**.
- **Shows:** header ("Hello," + name from `site.profile.name`), five-card grid
  (three metric + GitHub repositories + Notion pages).
- **Interactions:** **Try again** on failed count cards. Cards are informational.

---

## 2. Timeline — `/timeline`

**Files:** `features/dashboard/pages/timeline/timeline.ts`,
`components/experience-form/{ts,html}`,
`components/experience-projects/{ts,html}`, `components/project-form/{ts,html}`,
`components/stack-picker/{ts,html}`

- **Data:** `v1/experience?includeProjects=false` → nullable `ExperienceDto[]`,
  mapped by `ExperienceMapper.fromDto` to `ExperienceTimeline[]`. The projects
  modal fetches one experience with `v1/experience/{id}`, creates projects with
  `POST v1/admin/experience/{experienceId}/project`, and edits them with
  `PUT v1/admin/project/{id}`. It does not read `v1/skill` or write stack links.
- **Order:** `startedAt` newest first; invalid dates after valid ones.
- **States:** `app-skeleton` (`text` + `list`) while loading; shared error block
  with **Try again**; empty message when no experience.
- **Shows:** per experience — company (`h3`), optional `type` badge, role,
  `start – end` range (or `Present`) with duration line, description, and
  responsibility. Projects are shown only in the modal.
- **Layout:** a single ordered vertical timeline in a centered column with wider
  responsive gutters and a continuous accent rail with one node per experience
  entry. Each entry contains an equal-height bordered card that leads with company
  and role, groups the period, type, and duration as metadata, and places two
  icon-only actions in the upper-right corner: **View projects** and edit. Both
  show their name as a native tooltip and keep an `aria-label`
  (`features/dashboard/pages/timeline/timeline.ts`).
- **Interactions:**
  - Header **Add experience** and each card's upper-right pencil button
    (`aria-label="Edit experience at {company}"`) open one modal form.
  - The form edits `company`, `role`, `startedAt`, `finishedAt`, `description`,
    `responsibility`, `type`; the first three are required. Native inputs and
    signals are used; `@angular/forms` is not installed.
  - Save calls `POST`/`PUT v1/admin/experience[/id]`, closes the modal, then
    reloads the list. `400`/`404`/`503` appear in a form alert; `401` is left to
    the auth interceptor (gate reopens, form closes, no duplicate message).
  - Each card's **View projects** button opens a modal titled
    `Projects at {company}` with loading skeleton, empty state, error retry, and
    project names/descriptions/contributions/read-only tech chips. Close or
    `401` closes the modal; `401` remains with the auth interceptor.
  - The modal's **Add project** form saves `projectName` (required),
    `description`, and `contribution` to
    `POST v1/admin/experience/{experienceId}/project`, then reloads the modal
    data. No stacks are selected or written. `400`/`404`/`503` appear in a form
    alert.
  - Each project row has an icon-only pencil action
    (`aria-label="Edit project {projectName}"`, `title="Edit project"`). It swaps
    the list for the same form component within the modal, prefilled with that
    project's values. Saving calls `PUT v1/admin/project/{id}` with the three
    fields, updates the row from the returned DTO, and closes the form; it never
    writes stacks. `400`/`404`/`503` appear in a form alert and `401` is left to
    the auth interceptor.
  - No stack or category creation UI exists. The flat, search-only
    `components/stack-picker/{ts,html}` and `ProjectStackService` are retained
    for future stack-editing work but are not rendered or called. Projects and
    `durationMonths` are not editable in the experience form. Delete is not
    implemented.

---

## 3. Legacy profile URL — `/profile`

Redirects to `/` (résumé renders without shell). Former dashboard profile is
parked, unrouted, source retained.

---

## 4. Blog — `/blog`

**File:** `features/dashboard/pages/blog/{ts,html}`

- **Data:** `v1/notion/{site.notion.pageId}` → `NotionPageCard[]`.
- **Loading:** `app-skeleton` (`entries`).
- **Header:** `app-page-header` (WRITING / Notes from the journey).
- **Shows:** 2-column grid (`lg:grid-cols-2`) — two-digit index, title (`h3`),
  date, external-link icon, visually hidden "(new tab)" hint.
- **URL:** rewritten to `https://{site.notion.publicDomain}{pathname}`; on parse
  failure returns original.
- **Interactions:** opens in new tab; hover/focus lift card (`-translate-y-0.5`
  + shadow), `motion-reduce` fallback. Null/empty → empty state; failure → error
  block with **Try again**.
- **No:** pagination, search, excerpts.

---

## 5. Résumé landing — `/`

**File:** `features/resume/pages/home/{ui/home.ts,html}`

- **Reach:** empty path (`pathMatch: 'full'`), rendered without shell.
- **Layout:** `max-w-6xl` linear: ResumeHeader → Hero → About → Experience /
  Certifications / Tech stack / Recent projects → Contact → ResumeFooter.
- **Hero:** two-column at `md` (photo / name + **View projects** + **Download CV**
  + GitHub action), single column below. Data from `site`.
- **About:** terminal-styled (`~/about` title bar, JG ASCII mark, `cat bio.txt`,
  fact list).
- **Sections** (ResumeSection panels): Experience (timeline, top 3 by date),
  Certifications (HackerRank labels), Tech stack (category grid, master order,
  **View more/Show less**), Recent projects (top 3 repos).
- **Contact:** **Send email** (`mailto:`), **Download CV**, **View GitHub**,
  **View dashboard** (plain link; the guard reopens the gate automatically when
  no valid token is stored).
- **Data states:** Timeline, tech stack, recent projects each show loading /
  empty / retryable error.
- **Interactions:** fragment links scroll to anchors; theme toggle via
  `ThemeService`.

---

## 6. Projects — `/projects`

**File:** `features/resume/pages/projects/{ui/projects.ts,html}`

- **Reach:** top-level `projects` route.
- **Shows:** ResumeHeader → **Back to profile** → **Selected work** + Projects
  heading → two ResumeSection panels:
  - **Client projects:** 3-column cards at `lg` (2 at `sm`), from `v1/project?includeTools=false`; each card = index, title, contribution/description, tech tags. Non-interactive (API has no URL).
  - **GitHub repositories:** shared `RepoGrid`, full public list from
    `v1/github/owner/{username}/repositories`.
- **States:** card skeletons while loading; separate empty messages per section;
  `role="alert"` error message with **Try again** per section.
- Ends with `ResumeFooter`.

---

## 7. Dashboard gate (token dialog)

**Files:** `features/resume/components/dashboard-link/{dashboard-link.ts,dashboard-link.html}`,
`core/auth/{auth-token-store,auth.service,auth.interceptor,auth.guard,auth-gate.service}`

- **Trigger:** dashboard icon in `ResumeHeader` on both public pages; also
  automatic when the guard or interceptor requests an unlock.
- **Dialog:** password input, **Unlock** / **Cancel**, close button, Escape,
  overlay click; focus moves to the input on open and back to the trigger on
  close. `role="dialog"` + `aria-modal="true"`.
- **Submit:** pasted JWT is trimmed, sent as a Bearer token to `GET v1/auth/me`,
  then stored with the `exp` claim in `sessionStorage` on success before routing
  to `/dashboard`. Rejection clears the token and shows a `role="alert"`
  message; the dialog stays open.
- **Expiry:** `exp` (Unix seconds) drives the user-menu countdown and the guard
  check with a 60-second leeway. An expired token is cleared, the gate reopens,
  and the visitor returns to `/`. Server 401s outside `/auth/me` do the same;
  validation 401s remain in the dialog.
- **Direct URLs:** `authGuard` redirects `/dashboard`, `/timeline`, and `/blog`
  to `/` when the token is missing or expired.
- **Exit:** **Lock dashboard** in the user menu clears the token and returns to
  `/`.

---

## 8. Fallback

Unknown child path → `redirectTo: "dashboard"` (then `authGuard` applies).