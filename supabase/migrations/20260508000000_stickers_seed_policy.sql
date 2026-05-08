-- Grant INSERT/UPDATE privileges to service_role so seed script can upsert stickers.
-- By default Supabase only grants SELECT on tables with only a SELECT RLS policy.
grant select, insert, update on public.stickers to service_role;
grant select, insert, update on public.stickers to authenticated;
grant select on public.stickers to anon;
