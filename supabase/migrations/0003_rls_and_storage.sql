-- ============================================================================
-- GEOZZY STORE - 0003: Row Level Security and Storage
--
-- Roles
--   visitor (anon)  : read published/visible content only. Can call
--                     create_order_enquiry(). Cannot read orders.
--   staff           : manage products, categories, images, variants, orders,
--                     promotions, reviews, FAQs and homepage content.
--   admin           : everything staff can do, plus delete products/categories,
--                     edit store settings and manage staff profiles.
-- ============================================================================

alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.product_images     enable row level security;
alter table public.product_variants   enable row level security;
alter table public.promotions         enable row level security;
alter table public.promotion_products enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.order_events       enable row level security;
alter table public.store_settings     enable row level security;
alter table public.homepage_sections  enable row level security;
alter table public.faqs               enable row level security;
alter table public.reviews            enable row level security;

-- ---------- profiles --------------------------------------------------------------
create policy profiles_select_own   on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_insert_admin on public.profiles for insert to authenticated
  with check ((select public.is_admin()));
create policy profiles_update_admin on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using ((select public.is_admin()));

-- ---------- categories --------------------------------------------------------------
create policy categories_select on public.categories for select
  using (is_visible or (select public.is_staff()));
create policy categories_insert on public.categories for insert to authenticated
  with check ((select public.is_staff()));
create policy categories_update on public.categories for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy categories_delete on public.categories for delete to authenticated
  using ((select public.is_admin()));

-- ---------- products ----------------------------------------------------------------
create policy products_select on public.products for select
  using (status = 'published' or (select public.is_staff()));
create policy products_insert on public.products for insert to authenticated
  with check ((select public.is_staff()));
create policy products_update on public.products for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy products_delete on public.products for delete to authenticated
  using ((select public.is_admin()));

-- ---------- product_images ----------------------------------------------------------
create policy product_images_select on public.product_images for select
  using (
    (select public.is_staff())
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy product_images_insert on public.product_images for insert to authenticated
  with check ((select public.is_staff()));
create policy product_images_update on public.product_images for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy product_images_delete on public.product_images for delete to authenticated
  using ((select public.is_staff()));

-- ---------- product_variants ---------------------------------------------------------
create policy product_variants_select on public.product_variants for select
  using (
    (select public.is_staff())
    or (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'published'))
  );
create policy product_variants_insert on public.product_variants for insert to authenticated
  with check ((select public.is_staff()));
create policy product_variants_update on public.product_variants for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy product_variants_delete on public.product_variants for delete to authenticated
  using ((select public.is_staff()));

-- ---------- promotions ---------------------------------------------------------------
create policy promotions_select on public.promotions for select
  using (is_active or (select public.is_staff()));
create policy promotions_insert on public.promotions for insert to authenticated
  with check ((select public.is_staff()));
create policy promotions_update on public.promotions for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy promotions_delete on public.promotions for delete to authenticated
  using ((select public.is_staff()));

create policy promotion_products_select on public.promotion_products for select
  using (
    (select public.is_staff())
    or exists (select 1 from public.promotions pr where pr.id = promotion_id and pr.is_active)
  );
create policy promotion_products_insert on public.promotion_products for insert to authenticated
  with check ((select public.is_staff()));
create policy promotion_products_update on public.promotion_products for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy promotion_products_delete on public.promotion_products for delete to authenticated
  using ((select public.is_staff()));

-- ---------- orders (staff only; visitors insert through create_order_enquiry) -----------
create policy orders_select on public.orders for select to authenticated
  using ((select public.is_staff()));
create policy orders_update on public.orders for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy orders_delete on public.orders for delete to authenticated
  using ((select public.is_admin()));

create policy order_items_select on public.order_items for select to authenticated
  using ((select public.is_staff()));
create policy order_events_select on public.order_events for select to authenticated
  using ((select public.is_staff()));

-- ---------- store_settings --------------------------------------------------------------
create policy store_settings_select on public.store_settings for select
  using (is_public or (select public.is_staff()));
create policy store_settings_insert on public.store_settings for insert to authenticated
  with check ((select public.is_admin()));
create policy store_settings_update on public.store_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy store_settings_delete on public.store_settings for delete to authenticated
  using ((select public.is_admin()));

-- ---------- homepage_sections ---------------------------------------------------------------
create policy homepage_sections_select on public.homepage_sections for select
  using (is_active or (select public.is_staff()));
create policy homepage_sections_insert on public.homepage_sections for insert to authenticated
  with check ((select public.is_staff()));
create policy homepage_sections_update on public.homepage_sections for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy homepage_sections_delete on public.homepage_sections for delete to authenticated
  using ((select public.is_staff()));

-- ---------- faqs ----------------------------------------------------------------------------------
create policy faqs_select on public.faqs for select
  using (is_published or (select public.is_staff()));
create policy faqs_insert on public.faqs for insert to authenticated
  with check ((select public.is_staff()));
create policy faqs_update on public.faqs for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy faqs_delete on public.faqs for delete to authenticated
  using ((select public.is_staff()));

-- ---------- reviews ----------------------------------------------------------------------------------
-- Visitors can only read approved reviews. There is no public insert policy:
-- reviews are added and approved by staff after they are verified.
create policy reviews_select on public.reviews for select
  using (status = 'approved' or (select public.is_staff()));
create policy reviews_insert on public.reviews for insert to authenticated
  with check ((select public.is_staff()));
create policy reviews_update on public.reviews for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy reviews_delete on public.reviews for delete to authenticated
  using ((select public.is_staff()));

-- ---------- Storage: one public-read bucket for all store images -----------------------------------
-- Folders used by the app: products/, categories/, homepage/, branding/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-media', 'store-media', true, 5242880,
  array['image/webp', 'image/jpeg', 'image/png', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists store_media_read   on storage.objects;
drop policy if exists store_media_insert on storage.objects;
drop policy if exists store_media_update on storage.objects;
drop policy if exists store_media_delete on storage.objects;

create policy store_media_read on storage.objects for select
  using (bucket_id = 'store-media');
create policy store_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'store-media' and (select public.is_staff()));
create policy store_media_update on storage.objects for update to authenticated
  using (bucket_id = 'store-media' and (select public.is_staff()))
  with check (bucket_id = 'store-media' and (select public.is_staff()));
create policy store_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'store-media' and (select public.is_staff()));
