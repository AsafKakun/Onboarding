# Practice.md — How the Project Is Built and Managed

This document describes **how** the project is built, saved and updated, not **what** it does.
The product specification (screens, business rules, data model and design) is in [SPEC.md](SPEC.md), and detailed run instructions are in [README.md](README.md).

## 1. Purpose of this file

- To document the actual working process: building with Claude Code, saving in Git, uploading to GitHub and publishing on GitHub Pages.
- To give anyone who continues the project (including me, a few months from now) a clear way to update it without breaking what already works.
- To serve as part of the project's submission documents.

The document separates two things:

- **What was actually done** in this project.
- **Working rules for the future**, which are explicitly marked as such. They are recommendations, not a description of what already happened.

## 2. Working environment

| Component | Details |
|---|---|
| Operating system | Windows 10 |
| Project folder | `C:\Users\selly\Desktop\Onboarding` |
| Development tool | Claude Code (in the Claude desktop app) |
| Node.js | Version 24 (installed on this computer with `winget`); GitHub Actions runs Node 22 |
| Technologies | Vite, React, TypeScript, React Router, Vitest, ESLint, Prettier |
| Version control | Git, with a GitHub repository: `AsafKakun/Onboarding` |
| Publishing | GitHub Pages: https://asafkakun.github.io/Onboarding/ |

Main folder structure (full explanation in the README):

```
src/domain/     Pure business logic (status, progress, current stage, filtering)
src/data/       Data access (currently sample data)
src/features/   The dashboard screen and the employee screen
src/components/ Shared UI components
.github/        Automatic publishing workflow
```

## 3. How Claude Code fits into the development process

The project was developed as a conversation with Claude Code, in these steps:

1. **Defining the goal.** I described what I wanted from the dashboard: who it is for, which data to show, which onboarding stages exist and what to leave out.
2. **Writing a specification.** Claude Code wrote `SPEC.md` based on my description. Where information was missing, it chose the simplest solution and marked it in the file as **(Decision)** so those choices can be found and changed.
3. **Building from the specification.** After the spec was saved to GitHub, Claude Code built the project from it: first the logic and data with tests, then the screens and design.
4. **Checking in the browser.** Claude Code ran the app in the app's built-in browser, checked it in practice and fixed things that looked wrong (for example, table columns that overflowed, and stages with overdue tasks that were collapsed).
5. **Fixing problems I reported.** When `index.html` opened as a blank page for me, Claude Code diagnosed that the cause was opening the file directly (without a server), added `start.bat` and explained it in the README.
6. **Git and GitHub actions** (commit, push, creating the repository, enabling Pages) were performed by Claude Code using `git` and `gh` commands, at my explicit request.

Principles followed when working with Claude Code:

- **Approval before significant actions.** Before creating a public GitHub repository and before installing Node.js on the computer, Claude Code asked me and acted only afterwards.
- **Documents kept separate from code.** The specification was saved and pushed before the build started.
- **Change only what I asked for.** For example, a Word file in the folder that does not belong to the project was not included in a commit.

## 4. How changes are saved and managed

- All changes are saved in Git. There is currently a single branch, `main`, and all commits were made directly on it (no other branches or Pull Requests were used).
- Each commit represents one clear change, with a message in English. The title is short and written as a command, and the message body adds an explanation when needed. Each message ends with a co-author line for Claude Code (`Co-Authored-By`).

Commit history so far:

| Commit | What was saved |
|---|---|
| `2bfffe9` | Initial commit: initial `README.md` |
| `118ea48` | Add project spec: added `SPEC.md` |
| `9c1002e` | Build onboarding dashboard from SPEC.md: all the application code |
| `0c1d2fc` | Add start.bat: one-click launch and an explanation of the blank page |
| `493e827` | Add GitHub Pages deployment: automatic publishing |

Files that are not saved in Git (defined in `.gitignore`): `node_modules`, `dist`, `*.local` files and the `.claude/` folder (local settings of the working environment).

## 5. Working with Git and GitHub

**What was done in practice:**

1. Creating the GitHub repository and connecting it to the local folder with `gh repo create`, using the `origin` remote. The repository is public, because I asked for that.
2. Working with `git add`, `git commit` and `git push` to `origin/main`.
3. Adding files to a commit by name, rather than "everything", so that unrelated files do not get in by accident.

**The usual update sequence:**

```bash
git status                       # what changed
git add <changed files>          # add only what is needed
git commit -m "Short description of the change"
git push                         # upload to GitHub
```

Note: Git on Windows sometimes shows a line-ending warning (`LF will be replaced by CRLF`). This is a normal warning, not an error.

## 6. Keeping a working version before and after changes

**What exists in practice:**

- The `main` branch is the working, published version. Every commit to `main` triggers an automatic workflow (`.github/workflows/deploy.yml`) that runs lint, tests and a build. **If any of them fails, the site is not updated**, and the version that is already published stays as it was.
- The commit history makes it possible to see every change and return to it.

**Working rules for the future (recommendations):**

- Before starting to change something, make sure the current state is healthy: `git status` is clean, and `npm test` and `npm run build` pass.
- Make a small commit after each change that works, instead of collecting many changes into one commit.
- If a change broke something, a specific commit can be undone with `git revert <commit-id>`. This creates a new commit that cancels it, and the history stays intact. There has not yet been a need for this in this project.
- A large or experimental change is better made on a separate branch and merged into `main` only after it works. This has not yet been used in this project.

## 7. Principles for updating the code without harming existing functionality

These principles are guidelines that follow from the current code structure:

- **Logic lives only in `src/domain`.** Calculations of status, progress percentage, current stage and filtering are written once and used by all screens. A change to a business rule is made there, not inside UI components.
- **Calculated values are not stored.** Only raw facts are stored (employees, managers, tasks), and everything else is calculated from them.
- **Data goes through a single interface** (`OnboardingRepository` in `src/data/repository.ts`). To connect a real data source, replace the implementation in `src/hooks/useRepository.tsx`; the screens do not need to change.
- **The task list and due dates** are in a single file: `src/domain/taskTemplates.ts`.
- **Design through variables.** Colors, text sizes and spacing are defined in `src/styles/tokens.css`. Change them there, not in each file separately.
- **A test next to every logic change.** When changing a rule in `src/domain`, add or update a test that describes the desired behavior.
- **Do not change more than needed.** A small, well-defined change is easy to check and easy to undo.
- **Dates.** Every calculation of "today" goes through `getToday()` in `src/utils/date.ts`, which keeps the tests stable.

## 8. Basic checks before uploading a change

The commands are defined in `package.json`. In this project they were run before the code commit and before the publishing commit, and as a guideline for the future they should be run before every `push` that changes code:

```bash
npm run lint     # code style and quality check, no warnings allowed
npm test         # all automated tests
npm run build    # type check and production build
```

Existing automated tests (42 tests in 3 files):

| File | What is tested |
|---|---|
| `src/domain/domain.test.ts` | Task status, progress percentage, stage boundaries, employee status, filtering, search and sorting |
| `src/data/data.test.ts` | The sample data (amounts, spread of stages and statuses, stability) and saving task changes |
| `src/App.test.tsx` | Screen states: no employees, no filter results, load error, employee not found, progress update after ticking a task |

Quick manual check (mainly after a design change):

1. Run the app (`start.bat` or `npm run dev`).
2. Make sure the dashboard loads, the cards and charts are shown, and search and filters work.
3. Open an employee page, mark a task as completed and make sure the percentages update.
4. Check that the layout is correct at a screen width of about 1280 pixels or more (the dashboard is designed for a computer).

## 9. Updating the project and publishing on GitHub Pages

The site is published at https://asafkakun.github.io/Onboarding/.

**How publishing works:**

- GitHub Pages is set to use **GitHub Actions** as its source.
- The `Deploy to GitHub Pages` workflow runs on every `push` to `main`, and can also be started manually from the **Actions** tab.
- It installs dependencies (`npm ci`), runs lint and tests, builds the project into `dist`, and uploads it for publishing.

**Adjustments needed for the site to work on GitHub Pages:**

- Routing uses `HashRouter`, so addresses look like this: `.../Onboarding/#/employees/e-09`. This way, refreshing an inner page does not cause a 404 error.
- `vite.config.ts` sets `base: './'`, so the files load correctly even from a sub-path.

**Update and release process:**

1. Edit the code on the computer and check it locally.
2. Run `npm run lint`, `npm test` and `npm run build`.
3. `commit` and `push` to `main`.
4. Open the **Actions** tab on GitHub and make sure the run finished successfully (with a ✓ mark).
5. Open the site address and make sure the change appears (if needed, refresh with `Ctrl+F5`).

**Good to know:** the site shows sample data only. Task ticks are saved in each user's own browser (localStorage), not on a server.

## 10. General rules for continued development and maintenance

- Work in small steps: one change, a check, a commit.
- Do not mix different requests in one commit (for example, a bug fix and a redesign).
- Write short, clear commit messages that explain what changed.
- Add every new product decision to `SPEC.md`, and document only changes to the way of working in `Practice.md`.
- Update `README.md` when the run instructions or the folder structure change.
- When connecting real data, reconsider the publishing: the repository and Pages are currently public, so do not upload personal information of real employees.
- Do not store passwords, access keys or sensitive data in the code or in the repository.
- When using Claude Code for further development: describe exactly what to change and what not to, ask it to run the tests after the change, and review what changed (`git diff`) before committing.
- Check for dependency updates from time to time (`npm outdated`), and update only when needed, running all the tests afterwards.
