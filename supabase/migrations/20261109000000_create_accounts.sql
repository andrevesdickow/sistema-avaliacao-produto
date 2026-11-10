-- Contas da plataforma.
-- O hash da senha é gerado na API com bcryptjs; a coluna `salt` guarda o salt
-- utilizado e `password` recebe apenas o hash (nunca a senha em texto puro).

create table if not exists public.accounts (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  password text not null,
  salt text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicidade case-insensitive: "User@Email.com" e "user@email.com" são iguais.
create unique index if not exists accounts_email_unique
  on public.accounts (lower(email));

-- A API acessa a tabela com a service role key (que ignora RLS).
-- Habilitar RLS impede acesso indevido com a anon key.
alter table public.accounts enable row level security;
