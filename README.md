# Onboarding Dashboard

A focused, desktop-first dashboard for HR and managers to track the onboarding of new employees:
where each person is in the process, how far along they are, and what still needs attention.

The full product and technical spec is in [SPEC.md](SPEC.md).

The app currently runs on **generated sample data**. The data layer is designed so a real source can be connected later (see below).

## Getting started

Requires [Node.js](https://nodejs.org) 20 or newer.

**On Windows, the easiest way:** double-click `start.bat`. It installs what is needed the first time and opens the dashboard in your browser. Keep its window open while you use the dashboard.

> Opening `index.html` directly (double-click) shows a blank page. This is a web app that needs a small local server, so always start it with `start.bat` or `npm run dev`.

```bash
npm install
npm run dev
```

Then open the URL that Vite prints (usually http://localhost:5173).

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `npm run dev`    | Start the development server                        |
| `npm run build`  | Type-check and create a production build in `dist/` |
| `npm test`       | Run the unit and component tests                    |
| `npm run lint`   | Lint the code (no warnings allowed)                 |
| `npm run format` | Format the code with Prettier                       |

## Connecting Airtable

The dashboard shows employees from the Airtable table **Onboarding Employees**
(fields: Employee ID, Full Name, Position, Department, Manager, Start Date, Overdue Tasks, Status).

**Live data (every page load)**

1. Create a personal access token at https://airtable.com/create/tokens with the
   `data.records:read` scope and access to the base. Copy the **whole** token
   (`pat…` + `.` + 64 characters): Airtable shows it only once.
2. Open the dashboard, click **Connect Airtable** at the bottom of the page, paste the token and
   click **Save and load**.

The token is saved only in that browser (never on the site or in the code) and is sent only to
`api.airtable.com`. From then on, every time the page opens or is refreshed it reads Airtable.
**Disconnect** removes the token from the browser.

**Visitors without a token** see a saved copy of the table, `src/data/airtableSnapshot.json`.
To refresh that copy, put the token in `.env.local` (see `.env.example`), then:

```bash
npm run sync:airtable
git add src/data/airtableSnapshot.json
git commit -m "Update Airtable data"
git push
```

**Where the data comes from**

| Situation                                         | Data                  |
| ------------------------------------------------- | --------------------- |
| Token pasted in the dashboard, or in `.env.local` | Live from Airtable    |
| No token                                          | The saved copy        |
| Saved copy deleted                                | Generated sample data |

Onboarding tasks are generated from the standard templates so that each employee has the number
of overdue tasks set in Airtable; ticking a task is saved in your browser only.

## What you can do

- **Dashboard (`/`)**: KPI cards, employees by stage and by status, a "Needs attention" list, and a searchable, filterable, sortable employee table. Filters and sorting are kept in the URL, so a view can be bookmarked or shared.
- **Employee page (`/employees/:id`)**: employee details, overall progress, the five stages, and every task with its owner, due date and status. Tick a task to mark it completed.
- A small **Reset demo data** link in the footer restores the sample data (task changes are kept in your browser's localStorage).

## Project structure

```
src/
├─ domain/       Pure business logic (no React, no I/O): stages, task templates,
│                task status, progress, current stage, employee status, filters
├─ data/         The only layer that knows where data comes from:
│                repository interface, sample data generator, mock repository
├─ features/
│  ├─ dashboard/ Dashboard screen and its parts
│  └─ employee/  Employee screen and its parts
├─ components/   Shared UI: Badge, ProgressBar, Avatar, EmptyState, ...
├─ hooks/        useRepository, useOnboardingData, useUrlFilters
├─ utils/        Date helpers, initials
└─ styles/       Design tokens (colors, spacing, type) and base styles
```

Rules of thumb:

- Only raw facts are stored (employees, managers, tasks). Progress, stage, status and counts are **always computed** by the functions in `src/domain`.
- "Today" comes from a single `getToday()` function, and domain functions take `today` as a parameter, so behavior is easy to test.

## Connecting a real data source

1. Implement the `OnboardingRepository` interface from [`src/data/repository.ts`](src/data/repository.ts). Its methods are async, so it can call an API or a database.
2. In [`src/hooks/useRepository.tsx`](src/hooks/useRepository.tsx), replace `new MockRepository()` with your implementation.

No other file needs to change.

The data shapes (`Employee`, `Manager`, `OnboardingTask`) are defined in [`src/domain/types.ts`](src/domain/types.ts). Dates are ISO strings (`YYYY-MM-DD`).

## Customizing the process

The 34 onboarding tasks, their responsible party and their due-date offsets (days relative to the start date) live in one file: [`src/domain/taskTemplates.ts`](src/domain/taskTemplates.ts).
