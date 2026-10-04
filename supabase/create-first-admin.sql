-- ============================================================================
-- GEOZZY STORE - create the first administrator
--
-- 1. Supabase > Authentication > Users > "Add user" > "Create new user".
--    Enter the owner's email and a strong password and tick "Auto Confirm User".
-- 2. Replace OWNER_EMAIL_HERE below with that exact email and run this file
--    in the SQL Editor.
-- ============================================================================
insert into public.profiles (id, email, full_name, role)
select id, email, 'Store Owner', 'admin'
from auth.users
where email = 'OWNER_EMAIL_HERE'
on conflict (id) do update set role = 'admin';

-- Check: should return one row with role = admin
select id, email, role from public.profiles;
