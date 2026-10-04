# Kupatikana kwenye Google na search engines nyingine (SEO + AEO)

## Ukweli muhimu kwanza
- `http://localhost:3000` iko kwenye kompyuta yako tu. **Google, Bing na wengine hawawezi kuiona.** Tovuti lazima iwe mtandaoni (Vercel) kwanza.
- Hakuna mtu anayeweza kuhakikisha nafasi ya kwanza kwenye Google. Tulichofanya ni kuiandaa tovuti vizuri ili itambulike haraka na ipate nafasi nzuri. Matokeo huchukua siku hadi wiki.
- Mpaka utakapowasha, tovuti inajificha kwenye search engines (`NEXT_PUBLIC_ALLOW_INDEXING=false`). Hiyo ni makusudi ili ukurasa ambao haujakamilika usionekane.

## Ambacho tayari kimejengwa kwenye code
- Title na description za kipekee kwa kila ukurasa (Kiswahili na English), zenye maneno kama "nunua viatu online Tanzania".
- Canonical + hreflang (Kiswahili `/`, English `/en`) ili Google ijue lugha zote mbili.
- Open Graph + Twitter card + picha ya kushare (`og-image.png`) kwa WhatsApp, Facebook, Instagram, X.
- Structured data (JSON-LD): Duka (OnlineStore), WebSite + search, Bidhaa (bei TZS, upatikanaji, SKU, siku za kurudisha), BreadcrumbList, ItemList (orodha ya bidhaa), FAQPage. Maoni na rating huonekana **tu** kama una maoni halisi yaliyoidhinishwa.
- `sitemap.xml` (kurasa zote + picha za bidhaa + lugha), `robots.txt`.
- AEO (kwa answer engines kama Google AI, ChatGPT, Perplexity): aya fupi ya maelezo juu ya homepage, maswali ya FAQ yenye majibu mafupi, na faili `/llms.txt` yenye muhtasari wa duka.
- Favicon (G + kiatu + saa, bila maandishi), manifest ya simu, preconnect ya picha, picha zenye alt text, HTML sahihi.

## Hatua za kuwasha (fanya baada ya tovuti kuwa live)
1. **Weka tovuti Vercel** (angalia `GITHUB-UPLOAD.md`).
2. **Domain:** inashauriwa kununua domain yako (mfano `geozzystore.com` au `.co.tz`) kabla ya kuomba Google. Ukianza na `xxx.vercel.app` kisha ukahamia domain, unaanza upya.
3. Kwenye Vercel > Settings > Environment Variables weka:
   - `NEXT_PUBLIC_SITE_URL` = anwani halisi (mfano `https://geozzystore.com`)
   - `NEXT_PUBLIC_ALLOW_INDEXING` = `true`
   Kisha **Redeploy**.
4. **Google Search Console** (search.google.com/search-console): Add property > URL prefix > weka anwani. Chagua "HTML tag", nakili thamani ya `content="..."` pekee, uiweke Vercel kama `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, Redeploy, kisha bonyeza Verify.
5. Search Console > **Sitemaps** > weka `sitemap.xml` > Submit. Kisha kwenye "URL inspection" weka homepage na bidhaa chache > **Request indexing**.
6. **Bing Webmaster Tools** (bing.com/webmasters): unaweza "Import from Google Search Console". Hii inashughulikia Bing, Yahoo, DuckDuckGo na Ecosia pia.
7. (Hiari) Yandex Webmaster kwa `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION`.
8. Test: search.google.com/test/rich-results (weka ukurasa wa bidhaa) na pagespeed.web.dev.

## Mambo yanayoongeza nafasi (unayoweza kufanya mwenyewe)
- Majina ya bidhaa yaeleze wazi: aina + brand + rangi (mfano "Black leather loafers Gucci"). Epuka majina kama "DB9668".
- Jaza maelezo ya Kiswahili na English kwa kila bidhaa, na maelezo ya picha (alt text) kwenye admin.
- Weka picha nzuri na nyingi kwa kila bidhaa.
- Ongeza maswali kwenye FAQs (admin > FAQs) yanayoulizwa na wateja kweli.
- Ongeza maoni halisi ya wateja (admin > Reviews).
- Weka link ya tovuti mpya kwenye Instagram, TikTok, Facebook na WhatsApp Business. Jina liwe lilelile "GEOZZY STORE" kila mahali.
- Weka kwenye duka la zamani la Blogger tangazo lenye link ya tovuti mpya.
- Ukipata anwani halisi ya duka, jaza kwenye Store settings na uunde **Google Business Profile**.
- Baadaye: **Google Merchant Center** (orodha ya bure ya bidhaa kwenye Google Shopping) - tunaweza kuongeza feed.
