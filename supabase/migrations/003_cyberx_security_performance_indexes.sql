create index if not exists cyberx_developer_audit_actor_created_idx
on public.cyberx_developer_audit (actor_id, created_at desc);
drop policy if exists "Developer can read own allowlist record" on public.cyberx_developer_allowlist;
create policy "Developer can read own allowlist record" on public.cyberx_developer_allowlist
for select to authenticated
using (enabled = true and email = lower(coalesce(((select auth.jwt()) ->> 'email'), '')));
