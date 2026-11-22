-- CyberX private developer access, audit and app-usage schema.
-- Run only in the dedicated CyberX Supabase project.
create table if not exists public.cyberx_developer_allowlist (
  email text primary key check (email = lower(email)),
  access_level text not null default 'developer' check (access_level in ('owner', 'developer')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.cyberx_developer_allowlist (email, access_level, enabled)
values ('brightonsabo@gmail.com', 'owner', true)
on conflict (email) do nothing;
alter table public.cyberx_developer_allowlist enable row level security;
revoke all on table public.cyberx_developer_allowlist from anon, authenticated;
grant select on table public.cyberx_developer_allowlist to authenticated;
drop policy if exists "Developer can read own allowlist record" on public.cyberx_developer_allowlist;
create policy "Developer can read own allowlist record" on public.cyberx_developer_allowlist
for select to authenticated using (enabled = true and email = lower(coalesce((select auth.jwt() ->> 'email'), '')));
create or replace function public.is_cyberx_developer()
returns boolean language sql stable security invoker set search_path = public, pg_temp
as $$
 select exists (
   select 1 from public.cyberx_developer_allowlist
   where enabled = true and email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
 );
$$;
revoke all on function public.is_cyberx_developer() from public;
grant execute on function public.is_cyberx_developer() to authenticated;
create table if not exists public.cyberx_developer_audit (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id) on delete restrict,
 action text not null check (length(action) between 1 and 120),
 details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
 created_at timestamptz not null default now()
);
create index if not exists cyberx_developer_audit_created_at_idx on public.cyberx_developer_audit(created_at desc);
alter table public.cyberx_developer_audit enable row level security;
revoke all on table public.cyberx_developer_audit from anon, authenticated;
grant select, insert on table public.cyberx_developer_audit to authenticated;
drop policy if exists "Developers can read audit trail" on public.cyberx_developer_audit;
create policy "Developers can read audit trail" on public.cyberx_developer_audit for select to authenticated
using ((select public.is_cyberx_developer()));
drop policy if exists "Developers can append own audit events" on public.cyberx_developer_audit;
create policy "Developers can append own audit events" on public.cyberx_developer_audit for insert to authenticated
with check (actor_id = (select auth.uid()) and (select public.is_cyberx_developer()));
create table if not exists public.cyberx_app_events (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id) on delete restrict,
 event_name text not null check (length(event_name) between 1 and 120),
 metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
 created_at timestamptz not null default now()
);
create index if not exists cyberx_app_events_created_at_idx on public.cyberx_app_events(created_at desc);
create index if not exists cyberx_app_events_actor_created_idx on public.cyberx_app_events(actor_id, created_at desc);
alter table public.cyberx_app_events enable row level security;
revoke all on table public.cyberx_app_events from anon, authenticated;
grant select, insert on table public.cyberx_app_events to authenticated;
drop policy if exists "Developers can read app events" on public.cyberx_app_events;
create policy "Developers can read app events" on public.cyberx_app_events for select to authenticated
using ((select public.is_cyberx_developer()));
drop policy if exists "Signed in users can append their own app events" on public.cyberx_app_events;
create policy "Signed in users can append their own app events" on public.cyberx_app_events for insert to authenticated
with check (actor_id = (select auth.uid()));
