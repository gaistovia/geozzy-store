-- ============================================================================
-- GEOZZY STORE - 0001: tables, constraints and indexes
-- Run order: 0001 -> 0002 -> 0003 -> 0004 (Supabase > SQL Editor).
-- Prices are whole Tanzanian shillings (TZS) stored as integers.
-- Stock lives on product_variants (a product with no real sizes gets one
-- "One Size" variant), so there is no separate inventory table to keep in sync.
-- ============================================================================

-- ---------- Enumerated types -------------------------------------------------
create type public.user_role      as enum ('admin', 'staff');
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.review_status  as enum ('pending', 'approved', 'rejected', 'hidden');
create type public.order_source   as enum ('cart', 'product');
create type public.order_status   as enum (
  'new_enquiry',
  'contacted',
  'availability_confirmed',
  'awaiting_customer_decision',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- ---------- Staff profiles ----------------------------------------------------
-- A row here (role admin/staff) is what grants access to /admin.
-- Rows are created manually by an administrator (see create-first-admin.sql).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.user_role not null default 'staff',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Categories --------------------------------------------------------
create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name_sw         text not null check (char_length(name_sw) between 1 and 80),
  name_en         text not null check (char_length(name_en) between 1 and 80),
  description_sw  text,
  description_en  text,
  image_path      text,                      -- path inside the store-media bucket
  is_visible      boolean not null default true,
  is_featured     boolean not null default false,   -- shown on the homepage
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- Products ----------------------------------------------------------
create table public.products (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique
                          check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  name                  text not null check (char_length(name) between 2 and 200),
  short_description_sw  text,
  short_description_en  text,
  description_sw        text,
  description_en        text,
  brand                 text,
  sku                   text unique,
  category_id           uuid references public.categories (id) on delete restrict,
  regular_price         integer not null check (regular_price >= 0),   -- original price (TZS)
  sale_price            integer check (sale_price is null or (sale_price >= 0 and sale_price < regular_price)),
  status                public.product_status not null default 'draft',
  is_featured           boolean not null default false,
  is_new                boolean not null default false,
  is_promotional        boolean not null default false,
  specifications        jsonb not null default '{}'::jsonb
                          check (jsonb_typeof(specifications) = 'object'),
  video_url             text,
  legacy_url            text,                -- old Blogger URL, kept for redirect mapping
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint published_needs_category check (status <> 'published' or category_id is not null)
);

create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null,               -- path inside the store-media bucket
  alt           text,
  position      integer not null default 0,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);
-- At most one primary image per product.
create unique index product_images_one_primary
  on public.product_images (product_id) where is_primary;

create table public.product_variants (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products (id) on delete cascade,
  size            text,
  color           text,
  sku             text,
  stock_quantity  integer not null default 0 check (stock_quantity >= 0),
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint variant_has_attribute check (size is not null or color is not null)
);
create unique index product_variants_unique_combo
  on public.product_variants (product_id, coalesce(size, ''), coalesce(color, ''));

-- ---------- Promotions --------------------------------------------------------
create table public.promotions (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique
                       check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name               text not null check (char_length(name) between 2 and 120),
  description_sw     text,
  description_en     text,
  banner_image_path  text,
  starts_at          timestamptz,
  ends_at            timestamptz,
  is_active          boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint promotion_dates_valid check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.promotion_products (
  promotion_id  uuid not null references public.promotions (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  promo_price   integer check (promo_price is null or promo_price >= 0),  -- optional price while promotion is live
  primary key (promotion_id, product_id)
);

-- ---------- Order enquiries ---------------------------------------------------
-- Created when a customer taps "Order via WhatsApp". It records WHAT was
-- prepared. It does NOT prove the WhatsApp message was sent, delivered or read,
-- and it stores no customer name, phone number or account.
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,
  status              public.order_status not null default 'new_enquiry',
  source              public.order_source not null default 'cart',
  estimated_total     integer not null default 0 check (estimated_total >= 0),
  item_count          integer not null default 0 check (item_count >= 0),
  notes               text,                  -- private staff notes
  whatsapp_clicked_at timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  variant_id    uuid references public.product_variants (id) on delete set null,
  product_name  text not null,               -- snapshot at enquiry time
  size          text,
  color         text,
  unit_price    integer not null check (unit_price >= 0),
  quantity      integer not null check (quantity between 1 and 99),
  line_total    integer generated always as (unit_price * quantity) stored
);

create table public.order_events (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  from_status  public.order_status,
  to_status    public.order_status not null,
  note         text,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------- Store content -----------------------------------------------------
-- key/value settings. Bilingual values are stored as {"sw": "...", "en": "..."}.
create table public.store_settings (
  key         text primary key check (key ~ '^[a-z0-9_]+$'),
  value       jsonb not null,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

create table public.homepage_sections (
  id            uuid primary key default gen_random_uuid(),
  section_key   text not null unique check (section_key ~ '^[a-z0-9_]+$'),
  content       jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  image_path    text,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  updated_at    timestamptz not null default now()
);

create table public.faqs (
  id            uuid primary key default gen_random_uuid(),
  question_sw   text not null,
  question_en   text not null,
  answer_sw     text not null,
  answer_en     text not null,
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Reviews are never auto-generated. Staff add or approve real ones only.
create table public.reviews (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid references public.products (id) on delete cascade,
  reviewer_name         text not null check (char_length(reviewer_name) between 1 and 80),
  rating                smallint not null check (rating between 1 and 5),
  body                  text not null check (char_length(body) between 1 and 2000),
  status                public.review_status not null default 'pending',
  is_verified_purchase  boolean not null default false,
  created_at            timestamptz not null default now()
);

-- ---------- Indexes -----------------------------------------------------------
create index products_status_idx          on public.products (status);
create index products_category_idx        on public.products (category_id);
create index products_created_idx         on public.products (created_at desc);
create index products_featured_idx        on public.products (is_featured) where is_featured;
create index products_new_idx             on public.products (is_new) where is_new;
create index product_images_product_idx   on public.product_images (product_id, position);
create index product_variants_product_idx on public.product_variants (product_id);
create index promotion_products_prod_idx  on public.promotion_products (product_id);
create index orders_status_created_idx    on public.orders (status, created_at desc);
create index order_items_order_idx        on public.order_items (order_id);
create index order_events_order_idx       on public.order_events (order_id, created_at);
create index reviews_product_status_idx   on public.reviews (product_id, status);
create index categories_sort_idx          on public.categories (sort_order);
create index faqs_sort_idx                on public.faqs (sort_order);
