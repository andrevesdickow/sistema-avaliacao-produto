-- Cache dos resumos gerados por IA a partir das avaliações de cada produto.
-- `feedback_count` guarda quantas avaliações existiam quando o resumo foi
-- gerado; quando a contagem muda, o resumo é regenerado na próxima leitura.
-- Depende de `public.products`: aplicar depois da migration de produtos.

create table if not exists public.product_summaries (
  product_id text primary key references public.products(id) on delete cascade,
  summary text not null,
  feedback_count integer not null check (feedback_count > 0),
  model text not null,
  generated_at timestamptz not null default now()
);

alter table public.product_summaries enable row level security;
