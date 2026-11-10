-- Avaliações de produtos feitas por pessoas autenticadas.
-- `created_by` referencia a conta que criou a avaliação e `product_id` o
-- produto avaliado. A API usa a service role key (ignora RLS), portanto RLS
-- fica habilitado sem policies públicas.
-- Depende de `public.accounts` e `public.products`: aplicar depois das duas.

create table if not exists public.products_feedbacks (
  id text primary key,
  score integer not null check (score between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  created_by text not null references public.accounts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade
);

-- A listagem sempre filtra por produto e ordena da avaliação mais recente
-- para a mais antiga.
create index if not exists products_feedbacks_product_created_idx
  on public.products_feedbacks (product_id, created_at desc);

alter table public.products_feedbacks enable row level security;
