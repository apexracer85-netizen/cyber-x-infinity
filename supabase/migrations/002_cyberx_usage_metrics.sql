create or replace function public.cyberx_developer_metrics()
returns table(total_accounts bigint, active_users_7d bigint, total_app_events bigint, total_developer_events bigint)
language sql stable security invoker set search_path = public, pg_temp
as $$
 select
  (select count(distinct actor_id) from public.cyberx_app_events),
  (select count(distinct actor_id) from public.cyberx_app_events where created_at >= now() - interval '7 days'),
  (select count(*) from public.cyberx_app_events),
  (select count(*) from public.cyberx_developer_audit);
$$;
revoke all on function public.cyberx_developer_metrics() from public;
grant execute on function public.cyberx_developer_metrics() to authenticated;
