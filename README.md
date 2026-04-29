# FORGE

Mobile-first PWA for solo strength training. Log sessions in real time, track PRs, visualise progression charts, record body metrics, and get feedback from a rule-based coach engine.

---

## Features

- Real-time session logging with set-by-set tracking (reps, weight, RPE)
- Automatic PR detection (estimated 1RM, max weight, max reps, session volume)
- Progression charts per exercise and body metric
- Body metrics tracking (weight, body fat %, measurements) with progress photos
- Rule-based coach engine surfacing cues based on recent performance
- Workout program templates (Push / Pull / Legs or custom)
- Works offline — data syncs when the connection is restored
- Installable as a standalone app on iOS and Android

---

## Tech stack

| Layer | Library / Tool |
|---|---|
| Build | Vite 6 |
| UI | React 18, TypeScript 5, Tailwind CSS v3 |
| Routing | React Router v6 |
| State | Zustand v5 |
| Charts | Recharts v3 |
| Animations | Framer Motion v12 |
| Backend | Supabase JS v2 (Auth, Postgres, Storage) |
| PWA | vite-plugin-pwa (Workbox) |

---

## Prerequisites

- Node.js 18+
- A Supabase project (free tier is sufficient)

---

## Local installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Then open .env and fill in the two variables:
#   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<your-anon-key>

# 3. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Supabase setup

### 1. Create a project

Go to [supabase.com](https://supabase.com), create a new project, and wait for it to be ready.

### 2. Apply the schema

In the Supabase dashboard, open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.

This creates the following tables:

| Table | Purpose |
|---|---|
| `workouts` | Workout program templates |
| `exercises_template` | Exercises belonging to a program |
| `sessions` | Completed workout sessions |
| `session_sets` | Individual sets logged during a session |
| `body_metrics` | Weight, body fat %, and measurements |
| `progress_photos` | References to photos stored in Supabase Storage |
| `personal_records` | PR history per exercise and type |
| `goals` | User-defined goals with target values and deadlines |

### 3. Apply row-level security policies

In SQL Editor, paste the contents of `supabase/rls.sql` and run it. All tables are locked to the authenticated owner — no user can read or modify another user's data.

### 4. Create the storage bucket

In the Supabase dashboard, go to **Storage** and create a new bucket named `progress-photos`. Set it to **private**.

Then add an RLS policy on the bucket so users can only access files under their own folder (files should be uploaded with a path like `<user_id>/filename.jpg`):

```sql
-- Allow authenticated users to manage their own files
create policy "storage_owner"
  on storage.objects for all
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Copy API credentials

In **Settings > API**, copy:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

Paste them into your `.env` file.

---

## Seed data (optional)

The file `supabase/seed.sql` inserts a Push / Pull / Legs program with typical exercises.

1. Open `supabase/seed.sql` and replace every occurrence of `YOUR_USER_ID` with your actual user UUID.
   - Find your UUID in the Supabase dashboard under **Authentication > Users** after signing up once.
2. Run the file in SQL Editor.

---

## Build & deploy

### Build

```bash
npm run build
```

Output is written to `dist/`. The PWA service worker and manifest are generated automatically by vite-plugin-pwa.

### Deploy to Vercel

1. Push the repository to GitHub (or GitLab / Bitbucket).
2. Import the project in [vercel.com](https://vercel.com).
3. In **Project Settings > Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Vercel detects Vite automatically — no framework configuration needed.

> The build command is `npm run build` and the output directory is `dist`.

---

## Install as a PWA

### iPhone (Safari)

1. Open the app URL in Safari.
2. Tap the **Share** button (box with arrow).
3. Tap **Add to Home Screen**.
4. Confirm with **Add**.

### Android (Chrome)

1. Open the app URL in Chrome.
2. Tap the three-dot menu.
3. Tap **Install app** (or **Add to Home screen**).
4. Confirm.

Once installed, the app runs in standalone mode (no browser chrome) and caches assets for offline use.

---

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

Both variables must be prefixed with `VITE_` to be exposed to the browser by Vite.
