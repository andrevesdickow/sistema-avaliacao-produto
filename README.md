# avalia. — Módulo de engajamento e avaliação de produtos

Sistema de avaliação de produtos com autenticação, vitrine pública e avaliações
da comunidade.

## Features

- **Sign-up** — criação de conta com e-mail e senha.
- **Sign-in** — login, sessão em cookie assinado e logout.
- **Home** — vitrine pública de produtos com paginação infinita.
- **Feedback** — página de detalhe do produto com lista de avaliações e
  formulário autenticado (nota 1–5 + comentário).
- **Resumo por IA** — agente Mastra + GPT-4o mini resume as avaliações de cada
  produto, com cache no banco e destaque visual na página de detalhe.

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **TailwindCSS 4 + Shadcn UI** (design system)
- **React Hook Form + Zod** (formulários e validação)
- **TanStack React Query** (mutações e listagem infinita)
- **Mastra + OpenAI GPT-4o mini** (resumo das avaliações)
- **bcryptjs** (hash de senha)
- **nanoid** (IDs de contas, produtos e avaliações)
- **Supabase / PostgreSQL** (persistência)
- **Biome** (lint e formatação)
- **Date-fns** (datas relativas das avaliações)
- **Vercel** (deploy) e **N8N** (automações futuras)

## Como rodar

```bash
npm install
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SESSION_SECRET
npm run dev
```

Gere o `SESSION_SECRET` com:

```bash
openssl rand -base64 32
```

Rotas principais:

- [`/`](http://localhost:3000) — home com a vitrine de produtos;
- `/products/{id}` — detalhe do produto e avaliações;
- `/auth/sign-up` — criação de conta;
- `/auth/sign-in` — login.

### Banco de dados

Aplique as migrations no SQL Editor do Supabase **nesta ordem** (a de feedbacks
depende das duas anteriores):

1. [`20261109000000_create_accounts.sql`](supabase/migrations/20261109000000_create_accounts.sql)
2. [`20261109010000_create_products.sql`](supabase/migrations/20261109010000_create_products.sql)
3. [`20261109011000_products_image_and_price.sql`](supabase/migrations/20261109011000_products_image_and_price.sql)
4. [`20261109020000_create_products_feedbacks.sql`](supabase/migrations/20261109020000_create_products_feedbacks.sql)
5. [`20261110000000_create_product_summaries.sql`](supabase/migrations/20261110000000_create_product_summaries.sql)

A migration `20261109011000_products_image_and_price.sql` é idempotente e
ajusta instalações que já rodaram a migration anterior de produtos (renomeia
`image_url` para `image` e adiciona `price`).

Ou via CLI:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

> A aplicação usa a **service role key** apenas no servidor. As tabelas têm RLS
> habilitado e nenhuma policy pública: o acesso é feito exclusivamente pela API.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Acesso server-side ao banco (ignora RLS) |
| `SESSION_SECRET` | Em produção | Assinatura HMAC-SHA256 do cookie de sessão |
| `OPENAI_API_KEY` | Para o resumo por IA | Chave da OpenAI usada pelo agente Mastra (`openai/gpt-4o-mini`) |

Em desenvolvimento, a ausência de `SESSION_SECRET` usa um fallback local
inseguro apenas para não travar o `npm run dev`. Em produção, a ausência lança
um erro claro (`MissingSessionSecretError`). Trocar o segredo invalida todas as
sessões existentes.

## Contrato da API

Todas as respostas de erro seguem o formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Confira os dados informados e tente novamente.",
    "fields": {}
  }
}
```

### `POST /api/v1/sign-up`

Request:

```json
{
  "firstName": "Marina",
  "lastName": "Souza",
  "email": "marina@email.com",
  "password": "senha-segura",
  "confirmPassword": "senha-segura"
}
```

| Status | Cenário |
| --- | --- |
| `201` | Conta criada: `{ "data": { id, firstName, lastName, email, createdAt } }` |
| `400` | JSON inválido ou dados fora das regras de validação |
| `409` | E-mail já cadastrado |
| `500` | Falha inesperada |

### `POST /api/v1/sign-in`

```json
{
  "email": "marina@email.com",
  "password": "senha-segura"
}
```

| Status | Cenário |
| --- | --- |
| `200` | `{ "data": { "user": { id, firstName, lastName, email } } }` e cookie `avalia_session` |
| `400` | JSON/schema inválido |
| `401` | Credenciais inválidas (mensagem genérica, sem revelar se o e-mail existe) |
| `500` | Falha inesperada |

A senha não repete a regra mínima de 8 caracteres do cadastro; o login apenas
verifica se a senha confere.

### `POST /api/v1/sign-out`

Remove o cookie de sessão.

| Status | Cenário |
| --- | --- |
| `200` | `{ "data": { "ok": true } }` |
| `500` | Falha inesperada |

### `GET /api/v1/products`

Query params:

- `page` (inteiro ≥ 1, padrão `1`)
- `limit` (inteiro 1–24, padrão `12`)

Resposta `200`:

```json
{
  "data": [
    {
      "id": "abc123",
      "name": "Cafeteira X",
      "description": "Uma cafeteira simples e rápida.",
      "image": "https://...",
      "price": 199.9,
      "externalLink": "https://...",
      "score": false,
      "createdAt": "2026-11-09T12:00:00.000Z",
      "updatedAt": "2026-11-09T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 42,
    "totalPages": 4,
    "hasMore": true
  }
}
```

Ordenação: `created_at desc, id desc`. Base vazia retorna `200` com `data: []`.
Queries inválidas são normalizadas para os defaults, sem quebrar a home.

### `POST /api/v1/products`

Endpoint operacional/manual, público nesta entrega.

```json
{
  "name": "Cafeteira X",
  "link": "https://loja.exemplo.com/cafeteira-x",
  "image": "https://loja.exemplo.com/cafeteira-x.jpg",
  "price": 199.9
}
```

Mapeamento: `name` → `name`, `link` → `external_link`, `image` → `image`,
`price` → `price`.

Exemplo:

```bash
curl -i -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cafeteira X",
    "link": "https://loja.exemplo.com/cafeteira-x",
    "image": "https://loja.exemplo.com/cafeteira-x.jpg",
    "price": 199.9
  }'
```

| Status | Cenário |
| --- | --- |
| `201` | `{ "data": Product }` |
| `400` | JSON/schema inválido (`name` 2–120, URLs `http/https`, `price` numérico ≥ 0) |
| `500` | Falha de persistência |

> Em produção, considere proteger este endpoint com autenticação administrativa.

### `GET /api/v1/products/[id]/summary`

Resumo por IA das avaliações do produto. Público e sem autenticação. O agente
Mastra (`openai/gpt-4o-mini`) recebe **todas** as avaliações, notas e comentários
e devolve um texto corrido em português.

Resposta `200` com avaliações:

```json
{
  "data": {
    "summary": "A Cafeteira X é bem avaliada pela praticidade...",
    "feedbackCount": 5,
    "generatedAt": "2026-11-10T12:00:00.000Z",
    "model": "openai/gpt-4o-mini"
  }
}
```

Sem avaliações, retorna `200` com `{ "data": null }`.

| Status | Cenário |
| --- | --- |
| `200` | Resumo em cache ou recém-gerado |
| `404` | Produto não encontrado |
| `503` | `OPENAI_API_KEY` ausente (`AI_NOT_CONFIGURED`), falha do modelo (`AI_UNAVAILABLE`) ou tabela de cache ausente (`AI_CACHE_UNAVAILABLE`) |
| `500` | Falha ao ler o cache/banco |

O resumo fica persistido em `product_summaries`. O cache é considerado válido
enquanto o número de avaliações não mudar; ao publicar uma nova avaliação, a
próxima leitura regenera o texto. Nenhum e-mail ou nome de autor é enviado ao
modelo. Sem a migration da tabela, o endpoint responde `503`
(`AI_CACHE_UNAVAILABLE`) em vez de chamar o modelo a cada visita.

### `POST /api/v1/products/[id]/feedbacks`

Exige sessão válida. O autor (`created_by`) vem exclusivamente do cookie de
sessão, nunca do body.

```json
{
  "score": 5,
  "comment": "Ótimo custo-benefício. Uso todos os dias."
}
```

| Status | Cenário |
| --- | --- |
| `201` | `{ "data": { id, score, comment, createdAt, author: { firstName, lastName } } }` |
| `400` | JSON/schema inválido (`score` inteiro 1–5, `comment` 1–2000) |
| `401` | Sem sessão válida |
| `404` | Produto não encontrado |
| `500` | Falha inesperada |

A leitura das avaliações é feita diretamente no servidor na página de detalhe;
não há `GET` deste endpoint nesta entrega. E-mails de autores nunca são expostos.

## Sessão e autenticação

- Cookie `avalia_session`, `httpOnly`, `sameSite=lax`, `path=/`, `secure` em
  produção e validade de 7 dias.
- Sessão **stateless assinada** com HMAC-SHA256 (`node:crypto`), sem tabela de
  sessões e sem dependência adicional. O payload guarda apenas `sub`
  (`accountId`) e `exp`.
- `getCurrentUser()` lê o cookie, valida a assinatura/expiração e busca a conta
  ativa em `accounts`; é deduplicado por render com `cache()` do React.
- O header é um Server Component dentro de `<Suspense>` (exigência do
  `cacheComponents` do Next.js 16), exibindo:
  - anônimo: **Entrar** + **Criar conta**;
  - autenticado: avatar DiceBear, nome, e-mail e **Sair**.
- Rotas públicas: home, detalhe do produto, listagem de produtos.
- Rotas autenticadas: criação de avaliação.

## Estrutura

```text
src/
├── app/
│   ├── page.tsx                       # home: hero + vitrine de produtos
│   ├── products/[id]/page.tsx         # detalhe do produto + avaliações
│   ├── auth/
│   │   ├── sign-in/                   # login
│   │   └── sign-up/                   # cadastro + confirmação
│   ├── api/v1/
│   │   ├── sign-up/route.ts
│   │   ├── sign-in/route.ts
│   │   ├── sign-out/route.ts
│   │   └── products/
│   │       ├── route.ts               # GET (lista) + POST (manual)
│   │       └── [id]/
│   │           ├── feedbacks/route.ts # criação de avaliação
│   │           └── summary/route.ts   # resumo por IA (cache + agente)
│   ├── legal/                         # termos e privacidade
│   └── layout.tsx / globals.css
├── components/
│   ├── layout/                        # SiteShell, SiteHeader, SignOutButton
│   ├── auth/                          # shells e formulários
│   ├── home/                          # hero da home
│   ├── products/                      # grade, card, imagem, skeleton
│   ├── feedback/                      # detalhe, lista, formulário, estrelas, resumo IA
│   ├── ui/                            # componentes Shadcn
│   └── providers.tsx                  # QueryClientProvider
├── lib/
│   ├── api/                           # clients HTTP + erros tipados
│   ├── validation/                    # schemas Zod compartilhados
│   └── utils.ts
└── server/
    ├── auth/session.ts                # sessão, cookie e usuário atual
    ├── accounts/                      # criação e autenticação de contas
    ├── products/                      # tipos, listagem, criação, detalhe
    ├── feedback/                      # tipos, listagem e criação
    ├── ai/                            # agente Mastra + cache do resumo
    └── supabase.ts                    # client admin (server-only)
```

## Decisões

- **Senhas**: `bcrypt.genSalt(10)` + `bcrypt.hash`. O bcrypt já embute o salt; a
  coluna `salt` é mantida conforme a especificação. Limite de 72 bytes.
- **E-mail único**: índice `unique (lower(email))`; a API normaliza para
  minúsculas.
- **Sessão sem tabela**: HMAC-SHA256 com `SESSION_SECRET`. Simples, sem
  dependências e sem custo de banco por requisição.
- **Login genérico**: e-mail inexistente, conta inativa e senha errada retornam
  o mesmo `401`; um `bcrypt.compare` contra hash dummy reduz diferença de tempo.
- **`products.image` e `products.price`**: a coluna de imagem foi renomeada de
  `image_url` para `image` e o preço foi adicionado para refletir o contrato do
  endpoint (`name`, `link`, `image`, `price`). A migration incremental é
  idempotente.
- **`products.score`**: mantido como `boolean` conforme a spec, sem uso na UI
  nesta entrega.
- **Paginação por offset** (`page`/`limit`): simples e previsível. Inserções
  durante o scroll podem duplicar/pular itens; cursor fica como evolução.
- **Imagens externas**: `<img loading="lazy">` com fallback visual, evitando
  configurar `remotePatterns` para domínios arbitrários no `next/image`.
- **Feedbacks sem paginação**: a spec pede listar todas; paginar apenas se o
  volume crescer.
- **Resumo por IA com cache**: o agente só é chamado quando não há resumo salvo
  ou quando o número de avaliações mudou. O texto é gerado no servidor e
  cacheado em `product_summaries`, evitando custo e latência a cada visita.
- **Sem rate limit** no login: evolução futura.
- **Sem edição/exclusão de avaliações**: fora do escopo desta entrega.

## Interface e acessibilidade

- **Tipografia**: Newsreader (display) nos títulos e Geist na interface; tema
  dark com acento dourado.
- **Hierarquia**: um único `<h1>` por página.
- **Formulários**: validação client com Zod, erros por campo com
  `aria-describedby`, alerta `destructive` com foco em erros de servidor.
- **Estrelas**: radio group acessível por teclado, com rótulos claros.
- **Infinite scroll**: `IntersectionObserver` + botão “Carregar mais” como
  fallback acessível.
- **Movimento**: spinners e transições respeitam `prefers-reduced-motion`.
- **Navegação**: marca leva à home; header e footer vêm do `SiteShell`.

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # servir build
npm run lint       # Biome
npm run check      # Biome check
npm run typecheck  # TypeScript sem emitir arquivos
```