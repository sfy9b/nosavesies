# No Savesies 🚧

A mobile-optimized, crowdsourced map for reporting parking space savers (cones, chairs, trash cans) in Philadelphia and other dense cities.

## Tech stack

- React + Vite (TypeScript)
- Supabase (database, photo storage, real-time)
- Google Maps JavaScript API + Geocoding
- TailwindCSS

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).

2. **Table** — In the SQL editor, run:

```sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  lat float8 not null,
  lng float8 not null,
  photo_url text not null,
  city text default 'Philadelphia',
  object_type varchar,
  resolved boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '48 hours')
);

alter table public.reports enable row level security;

create policy "Allow public read" on public.reports for select using (true);
create policy "Allow public insert" on public.reports for insert with check (true);
create policy "Allow public update" on public.reports for update using (true);

-- If table already exists, run:
-- alter table public.reports add column if not exists object_type varchar;
-- alter table public.reports add column if not exists resolved boolean default false;
-- create policy "Allow public update" on public.reports for update using (true);
-- (Optional: remove old confirms column if present: alter table public.reports drop column if exists confirms;)
```

3. **Storage** — Create a bucket named `photos` (public). In Storage → New bucket → name: `photos`, Public bucket: ON. In Storage → Policies, add a policy so anyone can upload (e.g. allow `insert` and `update` for anon/authenticated on bucket `photos`). Allow public read so report photos are viewable.

4. **Realtime** — In Database → Replication, enable replication for the `reports` table.

## Google Cloud setup

1. Create a project and enable **Maps JavaScript API** and **Geocoding API**.
2. Create an API key and restrict it (HTTP referrers for production).

## Environment variables

Copy `.env.example` to `.env.local` and set:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_GOOGLE_MAPS_API_KEY` — Google Maps/Geocoding API key

## Run

```bash
npm install
npm run dev
```

Deploy to Vercel (or any static host); HTTPS is required for camera and geolocation.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
