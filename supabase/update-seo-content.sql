-- Run ONCE in Supabase > SQL Editor if you already ran the earlier SQL files.
-- (A brand-new project gets all of this from 0004_seed.sql automatically.)

-- New tagline matching the new logo
insert into public.store_settings (key, value)
values ('tagline', '{"sw": "Viatu • Saa Kali", "en": "Shoes • Stylish Watches"}')
on conflict (key) do update set value = excluded.value;

-- Contact email
insert into public.store_settings (key, value)
values ('email', '"geozzystore@gmail.com"')
on conflict (key) do update set value = excluded.value;

-- Two plain-language questions that search and answer engines like to quote
insert into public.faqs (question_sw, question_en, answer_sw, answer_en, sort_order)
select * from (values
  ('GEOZZY STORE inauza nini?', 'What does GEOZZY STORE sell?',
   'GEOZZY STORE inauza viatu (sneakers, viatu rasmi, sandals na viatu vya wanawake) na saa kali. Tazama bidhaa zote kwenye ukurasa wa Duka.',
   'GEOZZY STORE sells shoes (sneakers, formal shoes, sandals and ladies'' shoes) and stylish watches. See everything on the Shop page.', 5),
  ('Naweza kununua viatu online Tanzania wapi?', 'Where can I buy shoes online in Tanzania?',
   'Unaweza kununua viatu online kupitia GEOZZY STORE. Chagua bidhaa na size kwenye tovuti hii kisha utume oda yako kupitia WhatsApp. Hakuna malipo kwenye tovuti.',
   'You can buy shoes online from GEOZZY STORE. Choose a product and size on this website, then send your order on WhatsApp. There is no payment on the website.', 6)
) as v(question_sw, question_en, answer_sw, answer_en, sort_order)
where not exists (select 1 from public.faqs f where f.question_en = v.question_en);
