-- Run this ONLY if you already ran 0004_seed.sql before the email was added.
insert into public.store_settings (key, value)
values ('email', '"geozzystore@gmail.com"')
on conflict (key) do update set value = excluded.value;
