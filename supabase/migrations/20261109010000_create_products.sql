-- Produtos exibidos na vitrine pública da home.
-- O id é um nanoid gerado na camada de API (assim como em `accounts`).

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  image_url text not null,
  score boolean not null default false,
  external_link text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ordenação da listagem paginada: mais recentes primeiro, com id como desempate.
create index if not exists products_created_at_id_idx
  on public.products (created_at desc, id desc);

-- A API acessa a tabela com a service role key (que ignora RLS).
-- Habilitar RLS impede acesso indevido com a anon key.
alter table public.products enable row level security;
