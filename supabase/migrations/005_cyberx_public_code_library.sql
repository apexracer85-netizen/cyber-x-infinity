create table if not exists public.cyberx_public_library (
 library_key text primary key,
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 updated_at timestamptz not null default now()
);
alter table public.cyberx_public_library enable row level security;
revoke all on table public.cyberx_public_library from anon, authenticated;
grant select on table public.cyberx_public_library to anon, authenticated;
drop policy if exists "Public can read CyberX public catalogue" on public.cyberx_public_library;
create policy "Public can read CyberX public catalogue" on public.cyberx_public_library
for select to anon, authenticated using (true);
