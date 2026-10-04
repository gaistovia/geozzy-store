-- ============================================================================
-- GEOZZY STORE - 0004: starter content
-- Contains NO products, reviews, statistics or testimonials.
-- Empty values (email, address, hours, social links) are hidden on the website
-- until you fill them in from the admin settings.
-- Safe to run more than once.
-- ============================================================================

insert into public.categories (slug, name_sw, name_en, sort_order, is_featured) values
  ('sneakers',     'Sneakers',          'Sneakers',      10, true),
  ('formal-shoes', 'Viatu Rasmi',       'Formal Shoes',  20, true),
  ('sandals',      'Sandals',           'Sandals',       30, true),
  ('sports',       'Viatu vya Michezo', 'Sports',        40, false),
  ('ladies',       'Wanawake',          'Ladies',        50, true),
  ('smartwatches', 'Smartwatches',      'Smartwatches',  60, false)
on conflict (slug) do nothing;

insert into public.store_settings (key, value) values
  ('store_name',          '"GEOZZY STORE"'),
  ('tagline',             '{"sw": "Viatu • Saa Kali", "en": "Shoes • Stylish Watches"}'),
  ('whatsapp_number',     '"255786282109"'),
  ('email',               '"geozzystore@gmail.com"'),
  ('address',             '""'),
  ('business_hours',      '{"sw": "", "en": ""}'),
  ('social_instagram',    '""'),
  ('social_facebook',     '""'),
  ('social_tiktok',       '""'),
  ('social_youtube',      '""'),
  ('currency',            '"TZS"'),
  ('announcement',        '{"sw": "", "en": ""}'),
  ('delivery_info',       '{"sw": "Gharama na muda wa delivery huthibitishwa kupitia WhatsApp baada ya kutuma oda yako.", "en": "Delivery cost and timing are confirmed on WhatsApp after you send your enquiry."}'),
  ('footer_text',         '{"sw": "", "en": ""}'),
  ('return_policy_days',  '3'),
  ('low_stock_threshold', '3'),
  ('logo_path',           '""')
on conflict (key) do nothing;

insert into public.homepage_sections (section_key, content, sort_order) values
  ('hero', '{
     "headline":    {"sw": "Viatu vya kisasa, kwa mtindo wako.", "en": "Modern footwear, made for your style."},
     "description": {"sw": "Chagua unachopenda kisha uagize moja kwa moja kupitia WhatsApp.", "en": "Pick what you like, then order directly on WhatsApp."},
     "primary_cta":   {"sw": "Nunua sasa", "en": "Shop now"},
     "secondary_cta": {"sw": "Angalia mkusanyiko", "en": "Explore collection"}
   }', 10),
  ('why_shop', '{
     "items": [
       {"title": {"sw": "Agiza kwa WhatsApp", "en": "Order on WhatsApp"},
        "text":  {"sw": "Tuma oda yako moja kwa moja, bila kujisajili.", "en": "Send your order straight away, no account needed."}},
       {"title": {"sw": "Thibitisha kabla ya kulipa", "en": "Confirm before you pay"},
        "text":  {"sw": "Tunathibitisha upatikanaji na size kupitia WhatsApp kabla ya malipo.", "en": "We confirm availability and size on WhatsApp before any payment."}},
       {"title": {"sw": "Kurudisha bidhaa", "en": "Returns"},
        "text":  {"sw": "Unaweza kurudisha bidhaa ndani ya siku {{return_days}}.", "en": "You can return items within {{return_days}} days."}}
     ]
   }', 20),
  ('whatsapp_cta', '{
     "headline": {"sw": "Una swali kuhusu bidhaa?", "en": "Questions about a product?"},
     "text":     {"sw": "Tuandikie WhatsApp, tutakusaidia kuchagua size na kuthibitisha upatikanaji.", "en": "Message us on WhatsApp and we will help you choose a size and confirm availability."}
   }', 30)
on conflict (section_key) do nothing;

insert into public.faqs (question_sw, question_en, answer_sw, answer_en, sort_order)
select * from (values
  ('GEOZZY STORE inauza nini?', 'What does GEOZZY STORE sell?',
   'GEOZZY STORE inauza viatu (sneakers, viatu rasmi, sandals na viatu vya wanawake) na saa kali. Tazama bidhaa zote kwenye ukurasa wa Duka.',
   'GEOZZY STORE sells shoes (sneakers, formal shoes, sandals and ladies'' shoes) and stylish watches. See everything on the Shop page.', 5),
  ('Naweza kununua viatu online Tanzania wapi?', 'Where can I buy shoes online in Tanzania?',
   'Unaweza kununua viatu online kupitia GEOZZY STORE. Chagua bidhaa na size kwenye tovuti hii kisha utume oda yako kupitia WhatsApp. Hakuna malipo kwenye tovuti.',
   'You can buy shoes online from GEOZZY STORE. Choose a product and size on this website, then send your order on WhatsApp. There is no payment on the website.', 6),
  ('Ninawezaje kuagiza?', 'How do I order?',
   'Chagua bidhaa na size, ziweke kwenye kikapu, kisha bonyeza "Agiza kupitia WhatsApp". Ujumbe wenye oda yako utafunguka WhatsApp, uutume kwetu.',
   'Choose a product and size, add it to your cart, then tap "Order via WhatsApp". A message with your order opens in WhatsApp for you to send to us.', 10),
  ('Je, bidhaa inapatikana?', 'How do I know an item is available?',
   'Tovuti inaonyesha hali ya upatikanaji. Baada ya kutuma oda yako, tunathibitisha upatikanaji kupitia WhatsApp.',
   'The website shows availability. After you send your order we confirm availability with you on WhatsApp.', 20),
  ('Nitachaguaje size sahihi?', 'How do I choose my size?',
   'Kila bidhaa inaonyesha size zilizopo. Ukiwa na shaka, tuulize kupitia WhatsApp kabla ya kuagiza.',
   'Each product lists its available sizes. If you are unsure, ask us on WhatsApp before ordering.', 30),
  ('Delivery inafanyikaje?', 'How does delivery work?',
   'Utaratibu, gharama na muda wa delivery huthibitishwa kupitia WhatsApp baada ya kutuma oda yako.',
   'Delivery arrangements, cost and timing are confirmed on WhatsApp after you send your order.', 40),
  ('Nalipaje?', 'How do I pay?',
   'Malipo hayafanyiki kwenye tovuti hii. Baada ya kuthibitisha oda kupitia WhatsApp, tutakupa maelekezo ya malipo.',
   'You do not pay on this website. After your order is confirmed on WhatsApp, we will give you payment instructions.', 50),
  ('Naweza kurudisha bidhaa?', 'Can I return an item?',
   'Ndiyo, unaweza kurudisha bidhaa ndani ya siku {{return_days}}. Wasiliana nasi kupitia WhatsApp kwa maelezo ya utaratibu.',
   'Yes, you can return an item within {{return_days}} days. Contact us on WhatsApp for how it works.', 60)
) as v(question_sw, question_en, answer_sw, answer_en, sort_order)
where not exists (select 1 from public.faqs);
