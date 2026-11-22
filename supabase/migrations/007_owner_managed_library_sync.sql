grant insert, update on public.cyberx_public_library to authenticated;
drop policy if exists "CyberX developers can insert shared library data" on public.cyberx_public_library;
create policy "CyberX developers can insert shared library data" on public.cyberx_public_library
for insert to authenticated with check ((select public.is_cyberx_developer()));
drop policy if exists "CyberX developers can update shared library data" on public.cyberx_public_library;
create policy "CyberX developers can update shared library data" on public.cyberx_public_library
for update to authenticated using ((select public.is_cyberx_developer()))
with check ((select public.is_cyberx_developer()));
