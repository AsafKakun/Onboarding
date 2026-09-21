# Onboarding HR Dashboard — Product & Technical Spec

A focused, desktop-first dashboard that lets HR and managers see, at a glance, where every new employee is in the onboarding process and what still needs attention.

This document is the source of truth for building the project with Claude Code. Where the original brief left something open, the simplest sensible option for an HR system was chosen and is marked **(Decision)**.

---

## 1. Goal, Users, Scope

| | |
|---|---|
| **Goal** | One place to track onboarding of new employees: stage, progress, open and overdue tasks, overall status. |
| **Users** | HR staff and managers. |
| **Device** | Desktop browser (design for ≥ 1280 px wide; must remain usable down to 1024 px). No mobile layout. |
| **Data (phase 1)** | Fictitious, generated sample data only. The data layer must be swappable for a real source later. |
| **Language / format** | English UI, left-to-right. Dates displayed as `DD/MM/YYYY` (e.g. `22/09/2026`). **(Decision)** |

### Out of scope

Anything not directly about onboarding: recruiting/ATS, payroll, performance reviews, leave management, org charts, chat, notifications/email sending, user login and roles, multi-language/RTL, mobile layout, editing employee master data, creating/deleting tasks in the UI.

---

## 2. Screens

The app has two screens, plus a shared header.

```
/                     Dashboard (overview + search/filter + employee table)
/employees/:id        Employee page (detail of one onboarding process)
```

Header: app name ("Onboarding"), and a link back to the dashboard. Nothing else.

### 2.1 Dashboard (`/`)

Top to bottom:

**A. KPI cards (5)**

| Card | Definition |
|---|---|
| New employees | All employees in the onboarding program (respects no filters — always the overall picture). |
| In progress | Employees whose overall status is not *Completed*. |
| Completed | Employees whose overall status is *Completed*. |
| Open tasks | Incomplete tasks that are **not yet overdue** (due today or later). |
| Overdue tasks | Incomplete tasks with a due date **before today**. Highlighted in red when > 0. |

**B. Two small visuals (side by side)**
- **Employees by stage** — horizontal bar chart, one bar per stage (5 bars), count of employees currently in that stage.
- **Employees by status** — stacked single bar or donut: Completed / On track / Needs attention, with counts in a legend.

Use plain SVG/CSS; no charting library. **(Decision)**

**C. "Needs attention" list** — up to 5 employees with the most overdue tasks (name, department, number of overdue tasks); each row links to the employee page. Hidden (replaced by a positive empty message) when nobody has overdue tasks.

**D. Search + filters + employee table**

- Search box: matches employee name (case-insensitive, partial).
- Filters: **Department**, **Manager**, **Stage**, **Status**, **Start date** (from – to date range).
- All filters combine with AND. A **Clear filters** button appears when any filter is active. A "Showing X of Y employees" line sits above the table.
- Filter and search state is kept in the URL query string so views can be shared/bookmarked and survive refresh.
- KPI cards and charts always show the whole organization; only the table (and its count) reacts to filters. **(Decision — keeps the "big picture" stable.)**

Table columns:

| Column | Notes |
|---|---|
| Employee | Name, with initials avatar. Row is clickable → employee page. |
| Position | |
| Department | |
| Manager | |
| Start date | `DD/MM/YYYY` |
| Stage | Stage name as a neutral chip. |
| Progress | Progress bar + `%`. |
| Tasks | `✔ completed · ○ open · ! overdue` as three compact counts (overdue count in red only when > 0). |
| Status | Colored status badge. |

Default sort: Needs attention first, then by start date ascending. Column headers for Employee, Start date, Progress, Status are click-to-sort. **(Decision)**

### 2.2 Employee page (`/employees/:id`)

**A. Header card** — name, position, department, direct manager, start date, "Day N" since start (or "Starts in N days"), overall status badge.

**B. Progress card** — large overall progress (`%` with ring or bar) and the task counts: completed / open / overdue.

**C. Stage stepper** — the 5 stages in order, each showing its own `completed/total` and a state: *Done*, *Current*, *Upcoming*. The current stage is visually emphasised.

**D. Task list, grouped by stage** (stages in order; the current stage expanded, others collapsed by default; completed stages show "Done" in the collapsed header). Each task row shows:

| Field | Notes |
|---|---|
| Checkbox | Mark completed / undo. |
| Task title | |
| Responsible | Badge: HR, Manager, Employee, IT. |
| Due date | `DD/MM/YYYY`. |
| Status | Completed / Open / Overdue badge. |

Example row: `Prepare computer | Responsible: IT | Target: 22/09 | Status: Completed`.

A small segmented control above the list filters tasks: **All / Open / Overdue / Completed**.

Toggling a task updates that task's status, the stage counts, the progress %, and the overall status immediately, and is persisted (see §5.4).

A **Back to dashboard** link sits at the top.

---

## 3. Domain Rules

These rules are the heart of the app. Implement them once, as pure functions, and reuse them everywhere.

### 3.1 Stages (ordered)

1. Before starting work
2. First day
3. First week
4. First month
5. End of onboarding period

### 3.2 Responsible parties

`HR`, `Manager`, `Employee`, `IT`.

### 3.3 Task status (mutually exclusive)

- **Completed** — the task has a completion date.
- **Overdue** — not completed **and** due date is before today.
- **Open** — not completed and due date is today or later.

So for any employee: `completed + open + overdue = total tasks`.

### 3.4 Progress

`progress % = round(completed tasks ÷ total tasks × 100)` across all five stages. Stage progress uses the same formula for that stage's tasks. An employee with zero tasks shows `0%` and the label "No tasks".

### 3.5 Current stage (based on start date and today)

| Condition | Current stage |
|---|---|
| Today is before the start date | Before starting work |
| Today is the start date | First day |
| Day 1 – 7 after start | First week |
| Day 8 – 30 after start | First month |
| Day 31 and later | End of onboarding period |

The onboarding period is **90 days** long. **(Decision)**

Stepper states: stages before the current one are *Done* only if all of their tasks are completed, otherwise they show as *Done* with an "incomplete" warning marker; the current one is *Current*; later ones are *Upcoming*. **(Decision — keeps leftover overdue work visible.)**

### 3.6 Overall employee status

| Status | Rule | Color |
|---|---|---|
| **Completed** | All tasks completed (and at least one task exists). | Green |
| **Needs attention** | At least one overdue task. | Red |
| **On track** | Everything else. | Blue |

Precedence: Completed → Needs attention → On track.

### 3.7 Task templates and due dates

Each employee gets the same 34 tasks, generated from templates. Due date = start date + offset (days). Offsets are the sensible defaults below and live in one config file.

**Before starting work**

| # | Task | Responsible | Offset |
|---|---|---|---|
| 1 | Sign employment contract | Employee | −10 |
| 2 | Fill out intake forms | Employee | −7 |
| 3 | Collect employee details | HR | −7 |
| 4 | Open employee in the HR system | HR | −5 |
| 5 | Order computer and equipment | IT | −10 |
| 6 | Prepare workstation | IT | −3 |
| 7 | Open user for the organization's systems | IT | −3 |
| 8 | Prepare employee badge | HR | −2 |
| 9 | Send first-day information | HR | −2 |

**First day**

| # | Task | Responsible | Offset |
|---|---|---|---|
| 1 | Introductory meeting with HR | HR | 0 |
| 2 | Meet the manager | Manager | 0 |
| 3 | Office tour | HR | 0 |
| 4 | Receive equipment | IT | 0 |
| 5 | Open system permissions | IT | 0 |
| 6 | Meet the team | Manager | 0 |
| 7 | Go over procedures | HR | 0 |
| 8 | Information security training | Employee | 0 |

**First week**

| # | Task | Responsible | Offset |
|---|---|---|---|
| 1 | Professional training for the role | Manager | +5 |
| 2 | Meetings with key people | Manager | +5 |
| 3 | Learn the work processes | Employee | +5 |
| 4 | Complete mandatory training | Employee | +7 |
| 5 | Set initial goals | Manager | +5 |
| 6 | First feedback meeting with the manager | Manager | +7 |

**First month**

| # | Task | Responsible | Offset |
|---|---|---|---|
| 1 | Complete mandatory training | Employee | +30 |
| 2 | Follow-up meeting with HR | HR | +21 |
| 3 | Feedback meeting with the manager | Manager | +28 |
| 4 | Check integration into the team | Manager | +28 |
| 5 | Update goals | Manager | +30 |
| 6 | Complete missing permissions and systems | IT | +21 |

**End of onboarding period** *(tasks not specified in the brief — proposed) **(Decision)***

| # | Task | Responsible | Offset |
|---|---|---|---|
| 1 | Complete onboarding survey | Employee | +80 |
| 2 | Final onboarding review with HR | HR | +85 |
| 3 | Final feedback meeting with the manager | Manager | +85 |
| 4 | Confirm goals for the next period | Manager | +90 |
| 5 | Close onboarding file in the HR system | HR | +90 |

"Today" comes from a single injectable clock (see §5.3) so behavior is testable.

---

## 4. Data Model

Store only raw facts. **Never store derived values** (progress, stage, status, counts) — compute them from the raw data with the domain functions above.

```ts
type Stage = 'before-start' | 'first-day' | 'first-week' | 'first-month' | 'end-of-period';
type Owner = 'HR' | 'Manager' | 'Employee' | 'IT';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  managerId: string;          // references Manager.id
  startDate: string;          // ISO date, "YYYY-MM-DD"
}

interface Manager {
  id: string;
  fullName: string;
  department: string;
}

interface OnboardingTask {
  id: string;
  employeeId: string;         // references Employee.id
  stage: Stage;
  title: string;
  owner: Owner;
  dueDate: string;            // ISO date
  completedAt: string | null; // ISO date, null = not completed
}
```

Derived (computed, never stored) view models: `EmployeeSummary` (employee + manager name + current stage + progress % + counts + status) and `TaskView` (task + status).

Missing/partial data is expected (see §7): `managerId` may not resolve, `department` may be empty, an employee may have no tasks. The types above stay strict for valid data; the mapping/display layer handles the gaps.

---

## 5. Architecture

### 5.1 Stack **(Decision)**

- **Vite + React + TypeScript** (strict mode)
- **React Router** for the two routes
- **Plain CSS with CSS variables** (design tokens) — no UI framework
- **Vitest** + React Testing Library for tests
- ESLint + Prettier
- No backend, no global state library (React state/context is enough)

### 5.2 Folder structure

```
/
├─ SPEC.md
├─ README.md
├─ index.html
├─ package.json
└─ src/
   ├─ main.tsx
   ├─ App.tsx                     # routes + layout
   ├─ domain/                     # pure logic, no React, no I/O
   │  ├─ types.ts                 # types from §4
   │  ├─ stages.ts                # stage list, labels, ordering
   │  ├─ taskTemplates.ts         # the 34 templates + offsets (§3.7)
   │  ├─ taskStatus.ts            # completed / open / overdue
   │  ├─ progress.ts              # progress %, counts
   │  ├─ currentStage.ts          # stage from start date
   │  ├─ employeeStatus.ts        # completed / needs attention / on track
   │  ├─ summarize.ts             # raw data -> EmployeeSummary / KPIs
   │  └─ filters.ts               # search + filter + sort
   ├─ data/                       # the only layer that knows where data comes from
   │  ├─ repository.ts            # OnboardingRepository interface
   │  ├─ mockRepository.ts        # in-memory + localStorage implementation
   │  └─ sampleData.ts            # seeded sample data generator
   ├─ features/
   │  ├─ dashboard/               # DashboardPage, KpiCards, StageChart, StatusChart,
   │  │                           #   NeedsAttention, FilterBar, EmployeeTable
   │  └─ employee/                # EmployeePage, EmployeeHeader, ProgressCard,
   │                              #   StageStepper, TaskList, TaskRow
   ├─ components/                 # shared UI: Badge, ProgressBar, EmptyState,
   │                              #   Avatar, SegmentedControl, Skeleton
   ├─ hooks/                      # useRepository, useEmployees, useUrlFilters
   ├─ utils/                      # date formatting/parsing, initials
   └─ styles/                     # tokens.css, base.css
```

Rules: `domain/` imports nothing from React or `data/`. UI never reads raw data files directly — only through the repository. Components stay small and single-purpose.

### 5.3 Time

All "today" logic goes through one `getToday()` function in `utils/date.ts` (returns a date with no time component, local timezone). Domain functions accept `today` as a parameter rather than calling `new Date()` internally. This makes overdue logic deterministic in tests.

### 5.4 Data layer (future-proofing)

```ts
interface OnboardingRepository {
  getEmployees(): Promise<Employee[]>;
  getManagers(): Promise<Manager[]>;
  getTasks(): Promise<OnboardingTask[]>;        // all tasks
  getTasksForEmployee(employeeId: string): Promise<OnboardingTask[]>;
  setTaskCompleted(taskId: string, completed: boolean): Promise<OnboardingTask>;
}
```

- Methods are **async** even though the mock is synchronous, so a real API/DB can replace it without touching the UI.
- Phase 1 uses `MockRepository`: loads generated sample data, keeps it in memory, and persists task changes to `localStorage` so refreshes keep the user's changes.
- Connecting a real source later = write a new class implementing `OnboardingRepository` and swap it in one place (`useRepository`). No other file should change.
- A small **Reset demo data** text link in the footer clears the local changes and regenerates the sample data. It is shown only while the mock repository is in use.

---

## 6. Sample Data

Generated by `data/sampleData.ts` from a **fixed random seed**, so the app looks the same on every load, but with dates **relative to today** so there are always realistic overdue tasks.

**Volume**
- 18 employees, 6 departments (Engineering, Product, Sales, Marketing, Finance, Customer Support), 6 managers (one per department), realistic positions per department (e.g. Frontend Developer, Product Designer, Account Executive, Content Specialist, Financial Analyst, Support Team Lead).
- Diverse, realistic full names.

**Spread of start dates** (so every stage and status is represented)

| Group | Count | Start date | Task completion pattern |
|---|---|---|---|
| Not started yet | 3 | 3–14 days in the future | Most pre-start tasks done; a few pending, one with an overdue task |
| Day 0 | 1 | today | First-day tasks partly done |
| First week | 3 | 2–7 days ago | Mixed; one with overdue tasks |
| First month | 4 | 10–29 days ago | Mixed; two with overdue tasks |
| End of period | 3 | 35–80 days ago | Mostly done; one with overdue tasks |
| Fully completed | 4 | 95–150 days ago | All tasks completed |

Requirements for the generator:
- Completion is generated from the task's due date: tasks due in the past are usually completed (most), with a controlled number left overdue; tasks due in the future are mostly open (a few completed early).
- `completedAt` is never before the employee's start date minus 14 days, and never in the future.
- Include at least: one employee with 0 overdue tasks mid-process, one with 5+ overdue tasks, one at 100%.

---

## 7. States & Edge Cases

Every one of these must be handled deliberately, with a clear message rather than a broken layout.

| Situation | Behavior |
|---|---|
| No employees at all | Dashboard shows an empty state: "No employees in onboarding yet." KPIs show `0`; charts and table replaced by the empty state. |
| Search/filters return nothing | Table area shows "No employees match your filters" with a **Clear filters** button. |
| No overdue tasks (org-wide) | "Needs attention" card shows "Nothing overdue — great work." in green. |
| No open tasks for an employee | Task list filter "Open" shows "No open tasks." |
| Employee has no tasks | Employee page shows "No onboarding tasks assigned yet." Progress `0%`, status On track. |
| All tasks completed | Status *Completed*, progress `100%`, a small success message on the employee page. |
| Missing manager | Show "Unassigned" in muted text; filter list includes an "Unassigned" option. |
| Missing department or position | Show "—" in muted text. |
| Missing/invalid start date | Show "Start date missing"; stage shows "—"; the employee is excluded from the date filter and sorted last. |
| Task with missing due date | Shows "No due date"; treated as *Open* (never overdue). |
| Employee id not found (`/employees/xyz`) | "Employee not found" message with a link back to the dashboard. |
| Loading | Skeleton placeholders for cards and table (the async repository may be slow later). |
| Data fails to load | Error message with a **Try again** button. |
| Very long names/titles | Truncate with ellipsis in table cells; full text available via `title` tooltip. |

---

## 8. Design

**Feel:** modern, clean, professional, calm. Generous whitespace, few elements, clear hierarchy. No decorative clutter.

**Layout:** centered content area, max width ~1280 px; cards with soft rounded corners (8–12 px) and a subtle shadow/border on a light gray page background. Table rows have comfortable height with hover highlight.

**Typography:** system font stack or Inter; 4 sizes used consistently (page title, section title, body, caption). Numbers in KPI cards are large and bold.

**Color tokens** (defined once in `styles/tokens.css`; hex values are the defaults):

| Token | Use | Value |
|---|---|---|
| `--color-bg` | Page background | `#F5F7FA` |
| `--color-surface` | Cards | `#FFFFFF` |
| `--color-border` | Dividers | `#E3E8EF` |
| `--color-text` | Main text | `#1F2937` |
| `--color-text-muted` | Secondary text | `#6B7280` |
| `--color-primary` | Buttons, links, focus | `#3B5BDB` |
| `--color-success` / bg | Completed | `#2F9E5B` / `#E6F6EC` |
| `--color-info` / bg | Open, On track | `#2F7DD1` / `#E7F1FB` |
| `--color-danger` / bg | Overdue, Needs attention | `#D64545` / `#FDECEC` |
| `--color-neutral` / bg | Upcoming / neutral chips | `#6B7280` / `#EEF1F5` |

**Status color mapping (used consistently everywhere)**

| Meaning | Color |
|---|---|
| Completed | Green |
| Open / On track | Blue |
| Overdue / Needs attention | Red |
| Upcoming / not applicable | Gray |

**Accessibility:** color is never the only signal — every badge has text (and, where useful, a small icon). Text/background contrast at least WCAG AA. All interactive elements are keyboard-reachable with a visible focus ring. Table rows that are clickable also contain a real link on the name.

**Usability for first-time users:**
- Plain-language labels; no jargon or abbreviations except HR/IT.
- Short helper text under each KPI card (e.g. "Not yet due", "Past due date").
- Filters labeled with their names and an "All" default; an obvious "Clear filters".
- The current stage and any overdue work are the most visually prominent things on each screen.

---

## 9. Quality Requirements

- TypeScript `strict`; no `any`.
- Domain logic in pure, unit-tested functions. **Required tests** (Vitest) with a fixed `today`:
  - task status (completed / open on due date / overdue day after)
  - progress % and counts, including zero tasks
  - current stage at each boundary (day −1, 0, 1, 7, 8, 30, 31)
  - employee status precedence
  - filters and search combinations, including no results
  - sample data generator produces the expected group spread and is deterministic
- A few component tests: empty state, filtered-empty state, toggling a task updates progress.
- `npm run dev`, `npm run build`, `npm test`, `npm run lint` all pass with no warnings.
- `README.md` explains: how to run, project structure, and how to connect a real data source (implement `OnboardingRepository`).
- Small, readable files; descriptive names; comments only where the "why" isn't obvious.

---

## 10. Suggested Build Order (for Claude Code)

1. **Scaffold** — Vite + React + TS, ESLint/Prettier, Vitest, routes, tokens/base CSS.
2. **Domain** — types, stages, task templates, status/progress/stage/employee-status functions, with tests.
3. **Data** — repository interface, sample data generator, mock repository (with localStorage), tests.
4. **Shared components** — Badge, ProgressBar, Avatar, EmptyState, SegmentedControl, Skeleton.
5. **Dashboard** — KPI cards, charts, needs-attention list, employee table.
6. **Search & filters** — filter bar, URL sync, sorting, filtered-empty state.
7. **Employee page** — header, progress, stage stepper, grouped task list, task toggle.
8. **Edge cases & polish** — all rows of §7, loading/error states, accessibility pass, README.

---

## 11. Acceptance Checklist

- [ ] Dashboard shows the 5 KPI cards with correct numbers matching the sample data.
- [ ] Stage and status charts render and match the table.
- [ ] Table shows all required fields: name, position, department, manager, start date, stage, progress %, completed/open/overdue counts, overall status.
- [ ] Search by name works; filters for department, manager, stage, status and start date work alone and combined; Clear filters resets everything; filters survive a page refresh.
- [ ] Clicking an employee opens their page with details, progress %, 5-stage stepper and the full task list.
- [ ] Each task shows responsible party, due date and a Completed / Open / Overdue status; statuses use the agreed colors.
- [ ] Marking a task complete/incomplete updates counts, progress, stage state and overall status immediately, and persists after refresh.
- [ ] Sample data includes all groups in §6, including overdue tasks and fully completed employees.
- [ ] All edge cases in §7 behave as specified.
- [ ] Swapping the mock repository for another implementation requires changing one file only.
- [ ] Tests, lint and build pass.
