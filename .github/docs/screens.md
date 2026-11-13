# Screens

Detailed trace of every live screen: how it is reached, what it renders, where
its data comes from, and what can be interacted with.

## Shell (dashboard routes only)

The shell wraps `/dashboard`, `/timeline`, and `/blog`. The résumé/profile at
`/` and `/projects` render outside it — see screens 5 and 6. Legacy `/profile`
redirects to `/`.

- **Files:** `shell/dashboard.{ts,html}`, `shell/sidebar/sidebar.ts`,
  `shell/header/header.ts`, `shell/user-menu/user-menu.ts`,
  `shell/shell-state.service.ts`
- **Reach:** mounted for every dashboard path.
- **Shows:**
  - Sidebar (plain Tailwind, semantic tokens):
    - User menu trigger: `grad_1.jpeg` avatar + name + role. It is a real
      disclosure button, not a link.
    - Menu: Dashboard, Timeline, Blog (icon + label, `sr-only` label in rail).
    - Footer: desktop-only collapse/expand button; there is no separate Profile
      link in the footer.
  - Sticky header (`h-14`, border, `z-30`): mobile menu trigger below `md`, then
    the route page title (`h1`).
  - Content: centered `max-w-[75rem]`, `p-3`, inside `<main>`.
- **Title:** derived from the deepest active route's `data.pageTitle`, so it is
  correct on first load, deep links, reload, and back/forward. Each child route
  also sets `title` (`Label | Jonathan Golimlim`) for the document tab.
- **Active link:** `routerLinkActive` with exact matching, accent background, and
  `aria-current="page"`.
- **Desktop collapse:** full `16rem` ↔ icon rail `4.5rem`; persisted in
  `localStorage` (`portfolio-sidebar-collapsed`); does not affect mobile.
- **Mobile (below `md`, 48rem/768px):** off-canvas panel (`18rem`) + overlay;
  closes on navigation, overlay click, close button, or Escape; body scroll is
  locked while open; focus moves to the close button and returns to the header
  trigger on close.
- **Dropdown:** `role="menu"` with **View profile** (`/`), **Download
  CV** (`site.links.cv`, new tab), and a theme toggle whose label states the next
  action. Mouse and keyboard (ArrowUp/Down, Home/End, Escape); outside click
  closes; focus returns to the trigger.
- **Theme:** light/dark is applied to `<html>` before first paint (stored choice,
  otherwise `prefers-color-scheme`). The only toggle is inside the dropdown.
- **Profile navigation:** the account menu's **View profile** item navigates to
  `/`, which renders the résumé outside the shell. The old dashboard profile
  page is parked and unrouted; legacy `/profile` requests redirect to `/`.
  `/` and `/projects` each render a **View dashboard** icon link that returns
  to `/dashboard` in the same tab.

---

## 1. Dashboard / Overview — `/dashboard`

- **Files:** `pages/overview/overview.{ts,html}` (the `pages/home` wrapper was removed in 007).
- **Reach:** sidebar "Dashboard", wildcard redirect, or direct URL.
- **Data:**
  - `GET v1/overview` → `OverviewItem[]` (`key`, `count`) via
    `OverviewSignalService`.
  - `GET v1/github/owner/{site.github.username}/repositories/count` →
    `OverviewItem` via `GithubCountSignalService`.
  - `GET v1/notion/{site.notion.pageId}/count` → `OverviewItem` via
    `NotionCountSignalService`.
  - All three requests start in parallel on init.
- **States:**
  - `v1/overview`: three `app-skeleton` (`metric` variant) cards while loading;
    shared error block with **Try again** on failure; empty message when the API
    returns no items.
  - GitHub and Notion counts: each card shows its own compact skeleton, error
    message, and **Try again** action, so one failure does not hide the rest of
    the overview.
- **Shows:**
  1. Header block: eyebrow "Hello,", `h2` with `site.profile.name` (config, not
     hardcoded copy), caption "Welcome back to your portfolio dashboard". The
     header stays visible during loading and error states.
  2. Responsive grid (`grid-cols-2`, `lg:grid-cols-3`) of five bordered cards
     (`bg-muted/30`):
     - three API metric cards with an uppercase, camelCase/underscore-aware
       label, count, and metric-specific subtitle
     - **GITHUB REPOSITORIES** with "Public repositories on GitHub"
     - **NOTION PAGES** with "Blog posts through my Notion workspace"
  3. The final card stays a normal one-column card; it does not span the full
     mobile width.
  4. Counts use `text-3xl` on mobile and `text-5xl` from `sm`; card padding is
     `p-3` on mobile and `p-5` from `sm`.
- **Interactions:** the only interactive controls are the **Try again** buttons
  on failed count cards; the overview metric cards are informational.

---

## 2. Timeline — `/timeline`

- **File:** `pages/timeline/timeline.ts` (inline template, no HTML file)
- **Reach:** sidebar "Timeline" or direct URL.
- **Data:** `GET v1/experience?includeProjects=false` → `ExperienceTimeline[]`.
- **Ordering:** experiences are ordered by `startedAt` newest to oldest.
- **States:** `app-skeleton` (`text` + `list` variants) while loading; shared
  error block with **Try again** on failure; empty message when there is no
  experience.
- **Shows:**
  1. Header block (`app-page-header`): eyebrow **CAREER**, `h2` **Experience
     timeline**, caption "Roles, responsibilities, and the projects I've worked
     on."
  2. Vertical list of bordered experience cards:
     - Company `company` (`h3`)
     - Subtle filled tag with start year from `startedAt` using the
       theme-aware `accent-brand`; it is omitted when the value is missing or
       not a valid date (no "Invalid Date")
     - `role` | `description`
     - `responsibility`
     - If projects exist: nested **PROJECTS** block (accent dot + `h4`)
       containing cards with:
       - `projectName`
       - `description`
       - chips for each `techStacks[].stackName`
- **Interactions:** none (read-only; no dialog, no links).
- **Comparison:** the legacy `bak/experience` page used a project dialog instead of
  inline nested projects.

---

## 3. Legacy Profile URL — `/profile`

- **Reach:** direct URL or an old bookmark.
- **Behavior:** redirects to `/`, which renders the résumé profile outside the
  dashboard shell.
- **Parked code:** the former dashboard profile page and its recommendation and
  skills components remain in the source but are not routed.

---

## 4. Blog — `/blog`

- **Files:** `pages/blog/blog.{ts,html}`, `core/*`, `store/*`
- **Reach:** sidebar "Blog" or direct URL.
- **Data:** `GET v1/notion/{site.notion.pageId}` → `NotionPageCard[]` via
  `NotionSignalService`. The page ID comes from `site.notion` (005).
- **Loading:** `app-skeleton` (`entries` variant).
- **Header:** `app-page-header` with eyebrow **WRITING**, `h2` **Notes from the
  journey**, caption "Thoughts on software, projects, and the lessons along the
  way."
- **Shows:** responsive 2-column grid (`lg:grid-cols-2`) of external links:
  - two-digit index (`01`, `02`, …; single digit gets a leading zero)
  - `title` (`h3`)
  - `date`
  - `lucideExternalLink` icon
  - visually hidden "(opens in a new tab)" for screen readers
- **URL rewrite:** `convertNotionUrl` rebuilds each URL as
  `https://{site.notion.publicDomain}{pathname}`; on parse failure it returns the
  original URL.
- **Interactions:** each entry opens in a new tab; hover/focus lifts the card
  (`-translate-y-0.5` + shadow) with a `motion-reduce` fallback.
- **Notes:** the public Notion domain comes from `site.notion` (005); if the API
  returns `null` or an empty list, an empty state is shown, and a failed request
  shows the shared error block with **Try again**.

---

## 5. Resume landing — `/`

- **Files:** `features/resume/pages/home/ui/home.{ts,html}`,
  `pages/home/components/**`, `components/**`
- **Reach:** the empty path with `pathMatch: 'full'`, declared directly above the
  dashboard shell route. Renders **without** the dashboard shell.
- **Shows:** a linear public résumé layout inside a `max-w-6xl` container:
  - `ResumeHeader` with the name, fragment links (About, Experience, Tech
    stack, Work, Contact), theme toggle, and **View dashboard**.
  - Hero: a centered two-column layout from `md` up — the circularly cropped
    photo (`/jg-profile.png`) alone in the first column, and the name headline,
    **View projects**, **Download CV**, and a GitHub icon action in the second.
    On smaller screens it stacks into a centered single column, with text
    left-aligned at `md`. Role, location, and bio are omitted here because the
    About section already reports them; the hero is identity, photo, and
    actions only. Photo, GitHub URL, CV URL, and name come from `site`.
  - About is a standalone terminal-styled section (`section#about`) with a
    `~/about` title bar, a JG ASCII mark, a `cat bio.txt` narrative, and a
    profile fact list.
  - The remaining section panels use `ResumeSection`: Experience (responsive
    timeline), Certifications (HackerRank labels), Tech stack (category grid with
    derived marks), and Recent projects (three repository cards). About and
    Contact are plain sections. Fragment jumps stop 16px below the viewport top
    (a `ViewportScroller` offset set in `app.config.ts`).
  - Closing Contact panel with a **Send email** primary CTA (`mailto:` from
    `site.links.email`), then **Download CV**, **View GitHub**, and **View
    dashboard** as secondary actions.
  - Footer with the current year, name, GitHub link, back-to-top link, and a red
    `DEV` marker when `environment.title` is non-empty (development builds only).
- **Data:** About and Certifications are static. Timeline loads
  `ExperienceTimeline[]` from `v1/experience?includeProjects=false`, sorts
  valid start dates newest first (invalid dates after valid ones), and displays
  at most three entries. Entries show period, role, company, type, and
  responsibility (falling back to description); invalid dates omit the period.
  Tech stack loads `TechStackItem[]` from `v1/skill` and renders all published
  categories in a fixed master order (`Frontend → Backend → Database → Cloud &
  Infrastructure → Language → AI Tool`). The collapsed view shows the first
  three; **View more / Show less** (shown only when something is truncated)
  reveals the full grid and removes the four-row cap. Recent projects
  loads the first three public repositories from
  `v1/github/owner/{username}/repositories`.
- **Title:** `Jonathan Golimlim | Software Engineer`.
- **Interactions:** **View projects** and **View more** navigate to `/projects`;
  **View dashboard** navigates to `/dashboard`; header fragment links scroll to
  section anchors; the theme toggle uses the shared `ThemeService`.
- **Data states:** Timeline, Tech stack, and Recent projects each show loading,
  empty, and retryable error states for their API requests. Recent projects
  renders **View more** only after its data loads.

---

## 6. Projects — `/projects`

- **Files:** `features/resume/pages/projects/ui/projects.{ts,html}`,
  `pages/projects/components/project-card/`,
  `features/resume/projects/project.service.ts`
- **Reach:** top-level `projects` route, above the shell.
- **Shows:** the public `ResumeHeader`, then a `max-w-6xl` main with a **Back to
  profile** link, a **Selected work** eyebrow, the **Projects** heading, and a
  short description. Two `ResumeSection` panels follow:
  - **Client projects** — responsive three-column cards at `lg` (two at `sm`),
    built from the API; the skeleton uses the same three-column layout. Each
    card shows its index, title, contribution (or description), and any
    technology tags returned. Cards are non-interactive because the API has no
    project URL.
  - **GitHub repositories** — the shared `RepoGrid` with the full public
    repository list, identical cards to the landing-page preview.
    The page ends with `ResumeFooter`.
- **Data:** `GithubRepoSignalService` →
  `ApiClient.get('v1/github/owner/{username}/repositories')`;
  `ResumeProjectSignalService` → `ApiClient.get('v1/project?includeTools=false')`.
- The GitHub repository block shows the full result here; the home page shows
  the first three returned repositories as its Recent Projects preview.
- **States:**
  - Loading — card skeletons in each section.
  - Empty — separate messages for client projects and GitHub repositories.
  - Error — each section shows a `role="alert"` message with **Try again**.
- **Note:** the list uses the same owner/repositories route as the dashboard's
  GitHub count, without the `/count` suffix.

---

## 7. Fallback

- Unknown child path → `redirectTo: "dashboard"`.
