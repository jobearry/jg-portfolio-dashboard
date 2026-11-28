# Screens

Live screens: how they're reached, what they render, data source, interactions.

## Shell (`/dashboard`, `/timeline`, `/dashboard/experience/:experienceId/projects`, `/blog`, `/dashboard/project/:id`, `/dashboard/settings`)

**Files:** `features/dashboard/shell/{dashboard,sidebar/header,user-menu,shell-state.service}`

- Sidebar: avatar (name + role), menu (Dashboard/Timeline/Blog), Settings utility
  link directly above the footer, then a footer with desktop-only collapse
  (16rem ↔ 4.5rem, persisted). Mobile: off-canvas panel
  below `md` with overlay, Escape, scroll lock, focus return.
- Sticky header: mobile trigger + route title (`h1`) from `data.pageTitle`.
- Content: centered `max-w-[75rem]`, `p-3`, inside `<main>`.
- Active link: `routerLinkActive` exact + `aria-current="page"`.
- Avatar dropdown: session countdown (whole minutes), **View profile** (`/`),
  **Download CV** (new tab), **Lock dashboard** (clears the JWT, returns to `/`).
  Keyboard + outside click handled; focus returns to trigger. No theme item.
- Theme: stored choice / `prefers-color-scheme`, applied pre-paint; dashboard
  selection happens in Settings, while the public résumé keeps its compact toggle.
- **Access:** `authGuard` on the shell route sends visitors without a valid,
  unexpired JWT back to `/` and reopens the gate. Direct `/dashboard`,
  `/timeline`, `/dashboard/experience/:experienceId/projects`, `/blog`,
  `/dashboard/project/:id`, and `/dashboard/settings` URLs are gated too; a
  non-validation 401 does the same from inside the shell.

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
`components/experience-form/{ts,html}`

- **Data:** `v1/experience?includeProjects=false` → nullable `ExperienceDto[]`,
  mapped by `ExperienceMapper.fromDto` to `ExperienceTimeline[]`. Project reads,
  creation, and edits happen on the routed pages below; the timeline does not
  fetch projects.
- **Order:** `startedAt` newest first; invalid dates after valid ones.
- **States:** `app-skeleton` (`text` + `list`) while loading; shared error block
  with **Try again**; empty message when no experience.
- **Shows:** per experience — company (`h3`), optional `type` badge, role,
  `start – end` range (or `Present`) with duration line, description, and
  responsibility. Projects are reached through a separate route, not shown
  inline.
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
  - Each card's icon-only **View projects** link
    (`aria-label="View projects at {company}"`, `title="View projects"`) goes to
    `/dashboard/experience/{experienceId}/projects`. There is no modal, close
    control, or `401` state to manage here; the auth interceptor owns 401s.
  - Project create/edit stay fields-only because the deployed API rejects
    `techStackIds` on the project POST/PUT bodies (both schemas set
    `additionalProperties: false`). Categories and skills can be created on
    `/dashboard/settings`. Projects and `durationMonths` are not editable in the
    experience form. Delete is not implemented.

---

## 3. Projects by experience — `/dashboard/experience/:experienceId/projects`

**Files:** `features/dashboard/pages/timeline/components/experience-projects/{ts,html}`,
`components/project-form/{ts,html}`

- **Reach:** the timeline card's **View projects** link. Direct URLs are gated
  by `authGuard`.
- **Data:** `v1/experience/{experienceId}` through `ExperienceAdminService`;
  Add project calls `POST v1/admin/experience/{experienceId}/project` and then
  reloads the page. Project fields and stacks are not written together.
- **States:** list skeleton while loading; invalid-id, retryable load error,
  empty ("No projects yet"), and inline form error states. A failed `401` form
  write closes the form because the auth interceptor owns gate navigation.
- **Shows:** **Back to timeline**, a `Projects at {company}` header with the
  role as description, an **Add project** button, and project cards with name,
  description, contribution, and read-only stack chips.
- **Interactions:** the Add form saves `projectName` (required), `description`,
  and `contribution`; `400`/`404`/`503` appear in a form alert and the form
  stays open. Each card has a **View project** link to
  `/dashboard/project/{id}`. There is no modal, close button, or inline project
  edit action on this page.
- **Fields-only:** project create payloads omit `techStackIds` because the
  deployed schema sets `additionalProperties: false`. Skills are managed on the
  project screen.

---

## 4. Project details and skills — `/dashboard/project/:id`

**Files:** `features/dashboard/pages/project/{ts,html}`,
`features/dashboard/pages/timeline/components/project-form/{ts,html}`,
`components/stack-picker/{ts,html}`

- **Reach:** **View project** on the routed projects page. Not linked from the
  public `/projects` cards.
- **Data:** `v1/project/{id}` → mapped `Project`, plus `v1/skill` →
  `TechStackItem[]`, loaded in parallel through `ExperienceAdminService` and
  `ProjectStackService`. Field edits call `PUT v1/admin/project/{id}`.
- **States:** skeletons while loading; shared retryable error for project or
  catalog failures (`400`/`404`/`503` and other failures); empty "Project not
  found" fallback; inline `role="alert"` for field/save failures; `role="status"`
  after a successful field or stack save.
- **Shows:** **Back to timeline**, project title, contribution, description, an
  icon-only pencil (`aria-label="Edit project details"`, `title="Edit project"`),
  and the search-only stack picker with current stacks as removable chips.
- **Field edit:** the pencil swaps the details panel for the shared `ProjectForm`
  prefilled with `projectName`, `description`, and `contribution`. Saving sends
  only those three fields, keeps any unsaved stack selection intact, shows
  "Project details saved.", and closes the form. `400`/`404`/`503` appear in a
  form alert; `401` closes the form without a duplicate message because the
  auth interceptor owns gate navigation.
- **Picker:** no checkboxes; type to search, press **Enter** to add the first
  unused match, remove chips individually, or **Clear**. Unknown stack IDs that
  the catalog does not return remain a deferred gap. The picker is busy while
  fields are being saved.
- **Stack save:** enabled only when the selection differs from the loaded stacks
  and the field form is closed; calls `PUT v1/admin/project/{id}/tech-stacks`
  with `{ techStackIds }` and replaces the local project/chips from the returned
  DTO. A `401` shows the page's error state while the auth interceptor owns gate
  navigation.

---

## 5. Legacy profile URL — `/profile`

Redirects to `/` (résumé renders without shell). Former dashboard profile is
parked, unrouted, source retained.

---

## 6. Blog — `/blog`

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

## 7. Settings — `/dashboard/settings`

**Files:** `features/dashboard/pages/settings/{ts,html}`

- **Reach:** dashboard shell child route; utility link above the sidebar footer.
- **Data:** `v1/skill-category` and `v1/skill` load in parallel through
  `ProjectStackService`. Create forms post to `POST v1/admin/skill-category` and
  `POST v1/admin/skill`; both require the JWT. The stack form selects an existing
  category because the API resolves it by name.
- **States:** skeleton while loading, retryable error block for load failures,
  empty messages for either catalog, and inline `role="alert"` form errors using
  `ProblemDetails.detail ?? title`. No edit/delete controls.
- **Shows:** Light/Dark segmented control with `aria-pressed`, category chips,
  and stack rows with their category.
- **Interactions:** add category/stack appends the mapped response to the local
  list; theme buttons call `ThemeService.set()` and persist the choice. The
  account menu no longer changes theme.

---

## 8. Résumé landing — `/`

**File:** `features/resume/pages/home/{ui/home.ts,html}`

- **Reach:** empty path (`pathMatch: 'full'`), rendered without shell.
- **Layout:** `max-w-6xl` linear: ResumeHeader → Hero → About → Experience /
  Certifications / Tech stack / Recent projects → Contact → ResumeFooter.
- **Hero:** two-column at `md` (photo / name + **View projects** + **Download CV**
  + GitHub action), single column below. Data from `site`.
- **About:** terminal-styled (`~/about` title bar, JG ASCII mark, `cat bio.txt`,
  fact list).
- **Sections** (ResumeSection panels): Experience (timeline, top 3 by date),
  Certifications (HackerRank labels), Tech stack (category grid: known master
  order first, then new API categories appended, with **View more/Show less**),
  Recent projects (top 3 repos).
- **Contact:** **Send email** (`mailto:`), **Download CV**, **View GitHub**,
  **View dashboard** (plain link; the guard reopens the gate automatically when
  no valid token is stored).
- **Data states:** Timeline, tech stack, recent projects each show loading /
  empty / retryable error.
- **Interactions:** fragment links scroll to anchors; theme toggle via
  `ThemeService`.

---

## 9. Projects — `/projects`

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

## 10. Dashboard gate (token dialog)

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
- **Direct URLs:** `authGuard` redirects `/dashboard`, `/timeline`, `/blog`,
  `/dashboard/experience/:experienceId/projects`, `/dashboard/project/:id`, and
  `/dashboard/settings` to `/` when the token is missing or expired.
- **Exit:** **Lock dashboard** in the user menu clears the token and returns to
  `/`.

---

## 11. Fallback

Unknown child path → `redirectTo: "dashboard"` (then `authGuard` applies).