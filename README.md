# Task Manager

A collaborative project and task management app built with [Nuxt 3](https://nuxt.com), [Supabase](https://supabase.com), and [Tailwind CSS](https://tailwindcss.com).

## Tech Stack

- **Framework:** Nuxt 3 + Vue 3 + TypeScript
- **UI:** Tailwind CSS v3 (`@nuxtjs/tailwindcss` v6), custom CSS component classes
- **Backend:** Supabase (PostgreSQL, auth, RLS policies)
- **Icons:** Lucide Vue
- **Drag & Drop:** vuedraggable (board view)
- **Linting:** ESLint + Prettier
- **Type checking:** vue-tsc

## Features

- **Authentication** — Email/password signup and login via Supabase Auth
- **Projects** — Create, edit, archive, and delete projects
- **Members** — Add/remove project members by username or email
- **Task Management** — Create, edit, delete tasks with name, priority, and status
- **Board View** — Kanban-style drag-and-drop tasks across status columns
- **List View** — Sortable task list by name, priority, or creation date
- **Inline Editing** — Edit task name, priority, status, and assignee inline
- **Responsive** — Mobile-first layout with touch-friendly interactions
- **Dark Mode** — Automatic dark mode support via `@nuxtjs/color-mode`

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (or npm/yarn)
- A Supabase project (free tier works)

### Setup

1. Clone the repo and install dependencies:

```sh
pnpm install
```

2. Copy the environment file and fill in your Supabase credentials:

```sh
cp .env.example .env
```

Edit `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-publishable-key
```

3. Run the database migration:

Open the SQL file at `supabase/migration.sql` and run it in your Supabase project's SQL editor.

4. Start the dev server:

```sh
pnpm dev
```

## Project Structure

```
app.vue                  # App entry — NuxtLayout + NuxtPage
nuxt.config.ts           # Nuxt configuration
assets/css/main.css      # Tailwind entry + custom component classes
types/index.ts           # TypeScript type definitions

pages/
  index.vue              # Landing page
  login.vue              # Login
  register.vue           # Sign up
  dashboard.vue          # Project listing
  projects/
    create.vue           # New project form
    [id]/
      index.vue          # Project detail (members + tasks)
      tasks.vue          # Task list/board (redirects to project detail)

components/
  TaskList.vue           # View toggle (list/board), sort, task orchestration
  TaskBoard.vue          # Kanban board with drag-and-drop columns
  BoardTaskCard.vue      # Task card for board view
  ListTaskItem.vue       # Task row for list view
  StyledSelect.vue       # Customizable native select (appearance: base-select)
  NotificationToast.vue  # Toast notification display

composables/
  useSupabase.ts         # Supabase API calls (CRUD for projects, tasks, members)
  useTaskItem.ts         # Shared task editing logic (form state, validation)
  useValidation.ts       # Generic form validation
  useActionState.ts      # Global action-in-progress tracking
  useNotification.ts     # Toast notification state management

layouts/
  default.vue            # Main layout: nav bar, project switcher, logout

middleware/
  auth.global.ts         # Global auth guard (redirects unauthenticated users)

supabase/
  migration.sql          # Full database schema + RLS policies + triggers
```

## Database Schema

| Table             | Description                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `profiles`        | User profiles (id, email, username) — auto-created on signup via trigger                      |
| `projects`        | Projects with name, description, archived flag, and owner                                     |
| `project_members` | Many-to-many relationship between users and projects                                          |
| `tasks`           | Tasks with name, status (pending/in_progress/completed), priority (low/medium/high), assignee |

All tables have Row Level Security (RLS) enforcing:

- Users can only see projects they own or are members of
- Owners can manage projects, members, and all tasks
- Assignees can edit their own tasks

## Available Commands

| Command          | Description                           |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Start dev server                      |
| `pnpm build`     | Build for production                  |
| `pnpm generate`  | Static site generation                |
| `pnpm preview`   | Preview production build              |
| `pnpm check:all` | Run lint, format check, and typecheck |
| `pnpm fix:all`   | Auto-fix lint and format issues       |
| `pnpm lint`      | ESLint check                          |
| `pnpm format`    | Prettier check                        |
| `pnpm typecheck` | vue-tsc type checking                 |

## Architecture Notes

### CSS Component Classes

Custom utility classes are defined in `assets/css/main.css` under `@layer components` following a two-class pattern:

- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-danger` / `.btn-ghost` / `.btn-danger-ghost`
- `.btn-sm` / `.btn-xs` — size variants
- `.input` / `.input-error` / `.textarea`
- `.label` / `.error-text`
- `.card`
- `.badge` / `.badge-archived`

### StyledSelect Component

`<StyledSelect>` wraps native `<select>` using the [MDN Customizable Select API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#styling_with_css) (`appearance: base-select`). This provides native dropdown behavior with custom styling. Falls back gracefully in browsers without support.

Requires `selectedcontent` to be registered as a custom element in `nuxt.config.ts` to prevent Vue compilation warnings.

### Composable Pattern

Business logic is extracted into composables in `composables/`:

- `useTaskItem` — shared between `ListTaskItem` and `BoardTaskCard`
- `useSupabase` — all database operations through a single composable
- `useValidation` — generic rule-based validation (required, min/max length, pattern, email)
- `useActionState` — tracks whether any async operation is in progress across components
- `useNotification` — global toast notification queue
