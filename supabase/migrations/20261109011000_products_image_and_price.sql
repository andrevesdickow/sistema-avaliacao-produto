-- Ajusta `public.products` ao contrato do endpoint de criação:
--   { "name": "...", "link": "...", "image": "...", "price": 0 }
--
-- - `image_url` passa a se chamar `image`;
-- - adiciona `price` (numeric, não negativo).
--
-- Idempotente: pode ser aplicada tanto no banco que já rodou a migration
-- anterior quanto em uma instalação nova que aplique todas em ordem.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image_url'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image'
  ) then
    alter table public.products rename column image_url to image;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image'
  ) then
    alter table public.products add column image text;
    update public.products set image = '' where image is null;
    alter table public.products alter column image set not null;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'price'
  ) then
    alter table public.products add column price numeric(12, 2);
    update public.products set price = 0 where price is null;
    alter table public.products alter column price set not null;
    alter table public.products
      add constraint products_price_non_negative check (price >= 0);
  end if;
end $$;
