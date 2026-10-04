-- ============================================================================
-- GEOZZY STORE - 0002: helper functions, triggers, view and order RPC
-- ============================================================================

-- ---------- Role helpers (used by RLS policies) -------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'staff')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------- updated_at ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at          before update on public.profiles          for each row execute function public.set_updated_at();
create trigger categories_updated_at        before update on public.categories        for each row execute function public.set_updated_at();
create trigger products_updated_at          before update on public.products          for each row execute function public.set_updated_at();
create trigger product_variants_updated_at  before update on public.product_variants  for each row execute function public.set_updated_at();
create trigger promotions_updated_at        before update on public.promotions        for each row execute function public.set_updated_at();
create trigger orders_updated_at            before update on public.orders            for each row execute function public.set_updated_at();
create trigger store_settings_updated_at    before update on public.store_settings    for each row execute function public.set_updated_at();
create trigger homepage_sections_updated_at before update on public.homepage_sections for each row execute function public.set_updated_at();
create trigger faqs_updated_at              before update on public.faqs              for each row execute function public.set_updated_at();

-- ---------- published_at -------------------------------------------------------
create or replace function public.set_published_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger products_published_at
  before insert or update of status on public.products
  for each row execute function public.set_published_at();

-- ---------- Order status history -----------------------------------------------
create or replace function public.log_order_status_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, from_status, to_status, note)
    values (new.id, null, new.status, 'Enquiry created from website');
  elsif new.status is distinct from old.status then
    insert into public.order_events (order_id, from_status, to_status, created_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

create trigger orders_status_log
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();

-- ---------- Current price (single source of truth) ------------------------------
-- Lowest of: regular price, sale price, and any live promotion price.
-- SECURITY INVOKER: callers only see prices of rows their RLS allows.
create or replace function public.current_price(p_product_id uuid)
returns integer
language sql stable set search_path = ''
as $$
  select least(
    p.regular_price,
    coalesce(p.sale_price, p.regular_price),
    coalesce(
      (
        select min(pp.promo_price)
        from public.promotion_products pp
        join public.promotions pr on pr.id = pp.promotion_id
        where pp.product_id = p.id
          and pp.promo_price is not null
          and pr.is_active
          and (pr.starts_at is null or pr.starts_at <= now())
          and (pr.ends_at   is null or pr.ends_at   >  now())
      ),
      p.regular_price
    )
  )
  from public.products p
  where p.id = p_product_id;
$$;

-- ---------- Product listing view -------------------------------------------------
-- security_invoker = on  ->  the caller's RLS applies (visitors see published only).
create or replace view public.product_listing
with (security_invoker = on) as
select
  p.id,
  p.slug,
  p.name,
  p.brand,
  p.sku,
  p.category_id,
  c.slug     as category_slug,
  c.name_sw  as category_name_sw,
  c.name_en  as category_name_en,
  p.regular_price,
  p.sale_price,
  public.current_price(p.id) as current_price,
  case
    when p.regular_price > 0 and public.current_price(p.id) < p.regular_price
      then round((p.regular_price - public.current_price(p.id))::numeric * 100 / p.regular_price)::integer
    else 0
  end as discount_percent,
  p.status,
  p.is_featured,
  p.is_new,
  p.is_promotional,
  p.published_at,
  p.created_at,
  p.updated_at,
  img.storage_path as primary_image_path,
  img.alt          as primary_image_alt,
  coalesce(st.total_stock, 0)      as total_stock,
  coalesce(st.total_stock, 0) > 0  as in_stock
from public.products p
left join public.categories c on c.id = p.category_id
left join lateral (
  select i.storage_path, i.alt
  from public.product_images i
  where i.product_id = p.id
  order by i.is_primary desc, i.position asc, i.created_at asc
  limit 1
) img on true
left join lateral (
  select sum(v.stock_quantity)::integer as total_stock
  from public.product_variants v
  where v.product_id = p.id and v.is_active
) st on true;

-- ---------- Atomically switch the primary image -----------------------------------
create or replace function public.set_primary_image(p_image_id uuid)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_product uuid;
begin
  select product_id into v_product from public.product_images where id = p_image_id;
  if v_product is null then
    raise exception 'image_not_found' using errcode = 'P0002';
  end if;
  update public.product_images set is_primary = false
    where product_id = v_product and is_primary and id <> p_image_id;
  update public.product_images set is_primary = true where id = p_image_id;
end;
$$;

-- ---------- Record an order enquiry (anonymous) ------------------------------------
-- Called by the website when a customer taps "Order via WhatsApp".
-- * Prices are re-read from the database, never trusted from the browser.
-- * Stores no personal data.
-- * The website must open WhatsApp even if this call fails.
create or replace function public.create_order_enquiry(
  p_source    public.order_source,
  p_items     jsonb,
  p_reference text default null
)
returns table (order_reference text, order_total integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_order_id uuid;
  v_ref      text;
  v_total    integer := 0;
  v_count    integer := 0;
  v_item     jsonb;
  v_qty      integer;
  v_row      record;
  v_attempts integer := 0;
begin
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 30 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;

  -- Abuse breaker: refuse when an unusual number of enquiries arrive in minutes.
  if (select count(*) from public.orders where created_at > now() - interval '10 minutes') > 150 then
    raise exception 'too_many_requests' using errcode = '54000';
  end if;

  if p_reference is not null then
    -- The website generates the reference so the WhatsApp message and this record match.
    if p_reference !~ '^GZ-[0-9]{6}-[A-Z0-9]{5}$' then
      raise exception 'invalid_reference' using errcode = '22023';
    end if;
    v_ref := p_reference;
    begin
      insert into public.orders (reference, source, estimated_total, item_count)
      values (v_ref, p_source, 0, 0)
      returning id into v_order_id;
    exception when unique_violation then
      raise exception 'duplicate_reference' using errcode = '23505';
    end;
  else
    loop
      v_ref := 'GZ-'
        || to_char(now() at time zone 'Africa/Dar_es_Salaam', 'YYMMDD')
        || '-'
        || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
      begin
        insert into public.orders (reference, source, estimated_total, item_count)
        values (v_ref, p_source, 0, 0)
        returning id into v_order_id;
        exit;
      exception when unique_violation then
        v_attempts := v_attempts + 1;
        if v_attempts > 5 then
          raise;
        end if;
      end;
    end loop;
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    select v.id as variant_id, v.size, v.color, p.id as product_id, p.name,
           public.current_price(p.id) as price
      into v_row
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = (v_item ->> 'variant_id')::uuid
       and v.is_active
       and p.status = 'published';

    if not found then
      raise exception 'variant_unavailable' using errcode = 'P0002';
    end if;

    insert into public.order_items (order_id, product_id, variant_id, product_name, size, color, unit_price, quantity)
    values (v_order_id, v_row.product_id, v_row.variant_id, v_row.name, v_row.size, v_row.color, v_row.price, v_qty);

    v_total := v_total + v_row.price * v_qty;
    v_count := v_count + v_qty;
  end loop;

  update public.orders set estimated_total = v_total, item_count = v_count where id = v_order_id;

  return query select v_ref, v_total;
end;
$$;

revoke all on function public.create_order_enquiry(public.order_source, jsonb, text) from public;
grant execute on function public.create_order_enquiry(public.order_source, jsonb, text) to anon, authenticated;
