create extension if not exists pgcrypto;

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  participant_code text not null,
  organisation text,
  stakeholder_role text not null check (stakeholder_role in ('Worker','Manager','Safety','Technical','Business','Other')),
  task text not null,
  pain_point text not null,
  frequency text not null default 'Unknown',
  impact text not null default 'Unknown',
  workaround text,
  desired_outcome text,
  concerns text,
  evidence_quote text,
  checklist text[] not null default '{}',
  role_answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interviews_role_idx on public.interviews(stakeholder_role);
create index if not exists interviews_owner_idx on public.interviews(owner_id);
create index if not exists interviews_created_at_idx on public.interviews(created_at desc);
create index if not exists interviews_search_idx on public.interviews using gin (
  to_tsvector('english', coalesce(task,'') || ' ' || coalesce(pain_point,'') || ' ' || coalesce(desired_outcome,''))
);

alter table public.interviews enable row level security;
drop policy if exists "Users can read own interviews" on public.interviews;
drop policy if exists "Users can insert own interviews" on public.interviews;
drop policy if exists "Users can update own interviews" on public.interviews;
drop policy if exists "Users can delete own interviews" on public.interviews;

create policy "Users can read own interviews" on public.interviews
  for select to authenticated using (owner_id = auth.uid());
create policy "Users can insert own interviews" on public.interviews
  for insert to authenticated with check (owner_id = auth.uid());
create policy "Users can update own interviews" on public.interviews
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users can delete own interviews" on public.interviews
  for delete to authenticated using (owner_id = auth.uid());
