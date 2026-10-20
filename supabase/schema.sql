-- Run this once in the Supabase SQL editor (Project > SQL Editor) for a fresh project.

create extension if not exists "pgcrypto";

create type project_status as enum ('pending', 'processing', 'completed');

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  client_name text not null,
  client_email text not null,
  status project_status not null default 'pending',
  floor_plan_url text not null,
  model_glb_url text,
  created_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_slug_idx on public.projects (slug);

-- RLS is enabled with no policies: all access goes through the service-role
-- client used in Server Actions / Server Components (lib/supabase/admin.ts),
-- which bypasses RLS. The browser never talks to this table directly.
alter table public.projects enable row level security;

-- Storage buckets ------------------------------------------------------
-- Create these in the Supabase dashboard (Storage) or via the API:
--   floor-plans  (public read — needed so the admin can preview/download originals)
--   models       (public read — needed so the <model-viewer>/Three.js GLTFLoader
--                  in the browser can fetch the .glb directly by URL)
-- Both buckets are only ever written to via the service-role client.
