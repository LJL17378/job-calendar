# Job Calendar

A personal calendar for tracking job applications, interviews, and recruiting timelines.

Job Calendar combines a full day/week/month/year calendar with a recruiting pipeline and an editable cross-company timeline. It is a responsive web app and installable PWA for desktop, tablet, and mobile.

## Features

- 24-hour day, three-day, week, month, and 12-month year views
- Timed interviews and assessments with drag, resize, overlap, and cross-day support
- Context-menu event creation on desktop, plus touch selection on mobile and tablet
- Recurring events with single-occurrence exceptions
- Customizable application pipelines and immutable transition history
- Desktop/tablet recruiting timeline and mobile vertical pipeline
- ICS preview/import with UID-based idempotent updates
- Read-only China public holiday and adjusted-workday calendar
- Supabase email OTP, Postgres RLS, private storage, and local demo mode
- Vite PWA with install assets, offline shell, and update prompts

## Local development

Prerequisites: Node 22.21.1, pnpm 10.34.3, and Docker Desktop for local Supabase.

```bash
pnpm install
pnpm dev
```

Without Supabase environment variables the app starts in local demo mode and persists data in browser storage.

To use local Supabase, copy `.env.example` to `.env.local`, start the stack, and use the local API URL and publishable key:

```bash
pnpm dlx supabase@2.111.0 start
pnpm dlx supabase@2.111.0 status
```

For a hosted Supabase project, apply the migration under `supabase/migrations` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel. Never expose the service-role key to Vite.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Playwright runs critical flows in Chromium using desktop, iPhone, and iPad viewport profiles.

## Deployment

Import the repository into Vercel. The included `vercel.json` rewrites SPA routes to `index.html`; `vite-plugin-pwa` generates the manifest and service worker during `pnpm build`.

The project is licensed under the MIT License. FullCalendar Standard, vis-timeline, vite-plugin-pwa, and the China holiday data dependency are used under their respective permissive licenses.
