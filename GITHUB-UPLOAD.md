# Kuweka mradi GitHub na Vercel

Hakuna haraka: unaweza kuendelea kuijaribu kwenye `localhost:3000` kwanza. Fanya hatua hizi ukiwa tayari.

## A. Kwa Git (njia bora)
1. Weka Git: git-scm.com. Fungua akaunti github.com.
2. GitHub > **New repository** > jina `geozzy-store` > chagua **Private** > **usiweke** README/.gitignore/license > Create.
3. Kwenye folda ya mradi (terminal):
   ```
   git init
   git add .
   git status
   ```
   Kagua orodha: **haipaswi** kuwa na `.env.local` wala `node_modules`. (`.gitignore` tayari inazizuia.)
   ```
   git commit -m "GEOZZY STORE"
   git branch -M main
   git remote add origin https://github.com/JINA-LAKO/geozzy-store.git
   git push -u origin main
   ```
   Badilisha `JINA-LAKO` na jina lako la GitHub. Itakuomba login ya GitHub.

## B. Bila Git (kwa browser)
1. Fungua repository mpya (kama hatua 2 hapo juu) > **uploading an existing file**.
2. Buruta **maudhui** ya folda (si folda ya `node_modules`, si `.env.local`, si `.next`). Upload hufanya kazi kwa vipande; ukizidiwa tumia njia A.
3. Commit changes.

## C. Vercel
1. vercel.com > **Add New > Project** > chagua repository `geozzy-store` > Import.
2. Environment Variables (kutoka `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (anwani ya Vercel utakayopewa; ukijua, weka kisha Redeploy)
   - `NEXT_PUBLIC_ALLOW_INDEXING` = `false` (kwa sasa)
   **Usiweke** `ADMIN_EMAIL` wala `ADMIN_PASSWORD` Vercel.
3. Deploy. Ukipata anwani, jaribu `/admin/login`.
4. Ukitaka Google ione tovuti, fuata `SEO-GUIDE.md`.
