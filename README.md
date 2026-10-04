# GEOZZY STORE

Online store for GEOZZY STORE (footwear and watches, Tanzania).
Customers browse and **order through WhatsApp only**. There is no online payment.

Stack: Next.js 15, TypeScript, Tailwind CSS 4, Supabase (database, login, image storage), Vercel.

## Build status

| Phase | Status |
|---|---|
| 1. Audit and plan | Done |
| 2. Foundation and database | Done |
| 3. Public storefront + Blogger import | Done |
| 4. Admin dashboard | Done |
| New logo, light mode default, SEO + AEO | **This version** |
| 5. WhatsApp ordering - testing on real phones | Next |
| 6. Final testing, 7. Deployment | Planned |

- Light mode is the default. The header and footer stay black to match the logo. Visitors can still switch to dark mode.
- See `SEO-GUIDE.md` (how to get found on Google and other search engines) and `GITHUB-UPLOAD.md` (GitHub + Vercel).

## Set up (about 20 minutes)

### 1. Create the Supabase project
1. Go to https://supabase.com and create a project (any region close to East Africa; pick a strong database password and save it).
2. Wait until the project finishes starting.

### 2. Create the database
In Supabase open **SQL Editor** > **New query**. For each file below, open it on your computer, copy everything, paste it, and press **Run**. **Run them in this order, one at a time:**

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_functions_triggers.sql`
3. `supabase/migrations/0003_rls_and_storage.sql`
4. `supabase/migrations/0004_seed.sql`

Each should end with "Success". If one fails, stop and send me the exact error message.

### 3. Create the owner login
1. Supabase > **Authentication > Users > Add user > Create new user**. Enter the owner's email and a strong password, and tick **Auto Confirm User**.
2. Supabase > **Authentication > Sign In / Providers** (or "Providers" > Email): turn **off** "Allow new users to sign up". Only people you add can sign in.
3. Open `supabase/create-first-admin.sql`, replace `OWNER_EMAIL_HERE` with that exact email, and run it in the SQL Editor. It should show one row with role `admin`.

### 4. Get your keys
Supabase > **Project Settings > API**. Copy:
- **Project URL** (yours is already filled into `.env.example`: `https://dubpdkzfctbvmvmyvzsg.supabase.co`)
- **anon public** key (or the "publishable" key)

Never use the `service_role` / secret key in this project.

### 5. Run it on your computer
Install Node.js 20 or newer, then in this folder:

```
cp .env.example .env.local
```
Open `.env.local` and paste your Project URL and anon key. Then:

```
npm install
npm run dev
```
- http://localhost:3000 shows the Swahili home page, http://localhost:3000/en the English one.
- http://localhost:3000/admin/login is the admin sign-in. After signing in you see the dashboard with real counts (all zero for now).

### 6. Put it on GitHub and Vercel
1. Create an empty **private** repository on GitHub and push this folder to it (`.env.local` is ignored automatically and must never be uploaded).
2. On https://vercel.com choose **Add New > Project**, import the repository.
3. Under **Environment Variables** add these from `.env.example`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ALLOW_INDEXING` (= false).
   Do NOT add ADMIN_EMAIL or ADMIN_PASSWORD to Vercel.
   Set `NEXT_PUBLIC_SITE_URL` to your Vercel address (for example `https://geozzy-store.vercel.app`).
4. Deploy. There is no custom domain yet; when you buy one, add it in Vercel and update `NEXT_PUBLIC_SITE_URL`.

## Security model

- **Row Level Security** is on for every table. Visitors can only read published products and visible content.
- **Staff** can manage products, categories, orders and content. **Admins** can additionally delete products and categories, edit store settings and manage staff.
- Admin pages are protected three times: middleware, the admin layout, and the database itself.
- A person can only enter `/admin` if a row exists for them in `profiles`. Signing up alone grants nothing.
- Order enquiries are recorded through one database function. It re-reads prices from the database, stores **no names, phone numbers or accounts**, and has an abuse limit.
- Only the public anon key is used. No secret keys are in the code.

## Using the admin (quick guide)

Sign in at `/admin/login`.

- **Products > Add product**: fill the form, enter sizes like `40-45` and the stock per size, press Create. On the next page add photos (pick many at once), set the main photo, then change Status to **Published**.
- **Publish / Unpublish** are one-click buttons in the products list. A draft is never visible to customers.
- **Sizes, colors and stock** (bottom of a product): change stock per size, switch a size off, add or delete options. A size with 0 stock cannot be chosen by customers.
- **Order enquiries**: each time a customer taps Order via WhatsApp you see the reference, items and total. Match it to the WhatsApp message, then update the status and add private notes.
- **Promotions**: create one, add products and (optionally) a promotion price. While it is switched on and inside its dates, those prices apply on the whole website and the Offers page appears in the menu.
- **Homepage**: edit the banner words and picture and the other homepage blocks. Featured products and categories are chosen with the Featured / Show on the homepage options.
- **Reviews**: nothing is automatic. Add reviews customers really sent you, then Approve them to show on the product page.
- **Store settings** (administrator only): WhatsApp number, email, address, hours, social links, announcement bar, return days. Changing the WhatsApp number updates every WhatsApp button.

Staff can do everything except delete products or categories and edit store settings. Only an administrator can do those.

## Already ran the SQL files before the logo / SEO update?

Run `supabase/update-seo-content.sql` once in the SQL Editor. It sets the new tagline and contact email and adds two search-friendly FAQs. It is safe to run twice. New projects get all of this automatically.

## Import the old Blogger products (one time)

1. Make sure steps 1-5 above are done and you can sign in at `/admin/login`.
2. In `.env.local` fill in `ADMIN_EMAIL` and `ADMIN_PASSWORD` (the admin login from step 3). These stay on your computer only.
3. Preview first (changes nothing):
   ```
   npm run import:blogger -- --dry-run
   ```
   Check the list: names, categories, prices, sizes, image counts. Anything odd is listed under "Things to check".
4. Run the real import:
   ```
   npm run import:blogger
   ```
   It downloads the full-size photos from Blogger and uploads them to your Supabase Storage. It is safe to run again; products that already exist are skipped.
5. Every product is imported as a **draft** (hidden). To publish one, open the `products` table in Supabase (Table Editor), set `status` to `published`, and the store shows it within about 5 minutes. (Phase 4 gives you proper admin screens for this.)

What the import does with your data:
- Old price becomes `regular_price`, current price becomes `sale_price`.
- "Ladies Heels" products go to the **Ladies** category.
- The same generic sentence repeated on most products ("Hii kiatu unaipata popote ulipo...") is not imported. Specific descriptions are kept.
- **Stock numbers:** Blogger had none, so every size is set to **10 as a placeholder**. Update the real numbers (`product_variants.stock_quantity`) before publishing.
- If the Blogger feed is set to "Short", descriptions may be cut off. In Blogger: Settings > Site feed > Allow Blog Feed = **Full**.

## Going live checklist (later phases)
- Set `NEXT_PUBLIC_ALLOW_INDEXING=true` only when the real domain is connected. Until then the whole site tells search engines not to index it.
- Fill in store details (email, address, hours, social links). They are hidden until set.

## Important notes

- An order enquiry record means a customer tapped "Order via WhatsApp". It does **not** prove the message was sent, delivered or read. The customer's WhatsApp message and the store's reply are the real order.
- Prices are whole TZS. The cart rechecks prices and stock with the database every time it opens. Final price and availability are confirmed on WhatsApp.
- The enquiry record is created in the background; if it fails, WhatsApp still opens.
- Store contact details start empty and are hidden until you fill them in.
- Admin screens are in English; the public site is Swahili first with English.
- Not built (by design or still to do): wishlist, recently viewed, logo upload (the logo is fixed in the code), staff account management (add staff with a SQL insert like `create-first-admin.sql`), and privacy/terms/returns pages (published only after you confirm the wording).

## Project layout

```
supabase/migrations/    the four SQL files (run in order)
supabase/create-first-admin.sql
src/app/[locale]/       public site: home, shop, category, product, cart, about, contact, faq
src/app/admin/          admin login and dashboard
src/lib/                supabase clients, auth, settings, whatsapp, i18n, formatting
src/components/         shared UI and storefront components
scripts/import-blogger.mjs   one-time product import
src/middleware.ts       language routing + admin gate
public/brand/           logo files (made for dark backgrounds), OG image, app icons
```

Commands: `npm run dev`, `npm run build`, `npm run start`, `npm run typecheck`, `npm run import:blogger`.
