drop policy if exists "Developer can read own allowlist record" on public.cyberx_developer_allowlist;
create policy "Developer can read own allowlist record" on public.cyberx_developer_allowlist
for select to authenticated
using (enabled = true and email = lower(coalesce(((select auth.jwt()) ->> 'email'), '')));
