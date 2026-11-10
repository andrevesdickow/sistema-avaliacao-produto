# Plano — Home (Listagem de Produtos)

## 1. Objetivo

Transformar a home em uma vitrine pública de produtos, com listagem paginada por **infinite scroll**, cards com imagem/título/descrição e navegação para o detalhe de cada produto. Entregar também a tabela `products`, a migration e endpoints de listagem e inserção manual.

Resultado esperado: `/` lista produtos públicos sem autenticação; `GET /api/v1/products` pagina; `POST /api/v1/products` insere produto manualmente.

## 2. Estado atual relevante

- Home atual é uma landing institucional em `src/app/page.tsx`, com header/footer próprios.
- Não existe tabela `products`, endpoint de produtos nem componentes de produto.
- Sign-in criará `SiteShell`/`SiteHeader` e a sessão. A Home vai **consumir** esses componentes, sem editá-los.
- Feedback criará a página `/products/[id]`. A Home apenas linka para ela.
- `cacheComponents: true`: a Home deve continuar estática no shell; a listagem será carregada no cliente via React Query.

## 3. Decisões de arquitetura

### 3.1 Modelo de produtos

A spec lista os campos, mas não inclui explicitamente a coluna de imagem, embora exija exibir imagem e aceite “imagem” no `POST`. Decisão: adicionar `image_url`.

Tabela `public.products`:

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | `text` | PK, `nanoid()` na API |
| `name` | `text` | `not null` |
| `description` | `text` | opcional |
| `image_url` | `text` | `not null` (imagem é requisito de UI) |
| `score` | `boolean` | `not null default false` (conforme spec; sem uso de UI nesta entrega) |
| `external_link` | `text` | `not null` |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()` |

Extras:
- índice `products_created_at_id_idx` em `(created_at desc, id desc)` para paginação/ordenação;
- RLS habilitado sem policies públicas (a API usa service role, como em `accounts`);
- sem trigger de `updated_at` nesta entrega (o campo é atualizado futuramente quando houver edição).

### 3.2 Paginação

- Offset + página, simples e previsível: `?page=1&limit=12`.
- `limit` padrão `12`, máximo `24`.
- Ordenação: `created_at desc`, `id desc` como desempate.
- Resposta inclui `pagination` com `total`, `totalPages` e `hasMore`, permitindo `useInfiniteQuery`.
- Drift de offset é aceitável para uma vitrine pública; se necessário, migrar para cursor no futuro.

### 3.3 Estratégia de renderização

- O shell da home (hero, título, textos) é estático.
- A grade de produtos é um Client Component com `useInfiniteQuery` do TanStack Query.
- Primeira página carrega no cliente com skeleton; não há leitura de banco no build/prerender.
- Infinite scroll com `IntersectionObserver` + botão “Carregar mais” como fallback acessível.
- Imagens externas usam `<img loading="lazy" decoding="async">` com fallback visual; não usar `next/image` para não precisar configurar `remotePatterns` para domínios desconhecidos.

### 3.4 Inserção manual

- `POST /api/v1/products` é público, conforme a spec não pede autenticação; é um endpoint operacional/manual.
- Registrar no plano/README que isso pode ser protegido por admin no futuro.
- Validar URLs e tamanhos; nunca confiar no client.

### 3.5 Regra de convivência com as outras features

- **Dona exclusiva de `src/app/page.tsx`.**
- **Dona exclusiva de `src/app/api/v1/products/route.ts`** (GET + POST).
- **Dona exclusiva da migration de `products`.**
- Não editar autenticação, header, página de detalhe ou feedbacks.
- Consumir `SiteShell` de `@/components/layout/site-shell` (criado pela feature Sign-In).
- Consumir o tipo `Product` de `@/server/products/types`; Feedback pode importar esse tipo.

## 4. Banco de dados

Arquivo: `supabase/migrations/20261109010000_create_products.sql`

```sql
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

create index if not exists products_created_at_id_idx
  on public.products (created_at desc, id desc);

alter table public.products enable row level security;
```

A migration de feedback dependerá desta tabela (FK `product_id`). Ordem de aplicação: **products antes de products_feedbacks**.

## 5. API

### 5.1 `GET /api/v1/products`

Query params:
- `page` (inteiro ≥ 1, padrão 1)
- `limit` (inteiro 1–24, padrão 12)

Resposta `200`:

```json
{
  "data": [
    {
      "id": "abc123",
      "name": "Cafeteira X",
      "description": "Uma cafeteira simples e rápida.",
      "imageUrl": "https://...",
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

Casos:
- sem produtos → `200` com `data: []` e `hasMore: false`;
- query inválida → normalizar para os defaults (não retornar erro por página inválida) ou `400`; preferir normalizar;
- falha de banco → `500 { error: { code: "INTERNAL_ERROR", message } }`.

### 5.2 `POST /api/v1/products`

Request:

```json
{
  "name": "Cafeteira X",
  "description": "Uma cafeteira simples e rápida.",
  "imageUrl": "https://...",
  "externalLink": "https://..."
}
```

Validação Zod:
- `name`: 2–120 caracteres, `trim`;
- `description`: até 500 caracteres, opcional, `trim`;
- `imageUrl`: URL válida;
- `externalLink`: URL válida.

Respostas:
- `201 { data: Product }`;
- `400` JSON/schema inválido;
- `500` falha de persistência.

## 6. Arquivos

### Criar

| Arquivo | Responsabilidade |
| --- | --- |
| `supabase/migrations/20261109010000_create_products.sql` | Tabela, índice e RLS |
| `src/server/products/types.ts` | `Product`, `ProductRow`, mapeamento row → DTO |
| `src/server/products/list-products.ts` | Query paginada + total |
| `src/server/products/create-product.ts` | `nanoid()` + insert |
| `src/lib/validation/product.ts` | Schemas de listagem e criação |
| `src/lib/api/products.ts` | `fetchProducts`, `submitProduct`, erros tipados |
| `src/app/api/v1/products/route.ts` | `GET` + `POST` |
| `src/components/products/product-grid.tsx` | Client com `useInfiniteQuery` + observer |
| `src/components/products/product-card.tsx` | Card com imagem, título, descrição |
| `src/components/products/product-grid-skeleton.tsx` | Skeleton de carregamento |
| `src/components/products/product-image.tsx` | Imagem com fallback de erro |
| `src/components/home/home-hero.tsx` | Título/intro da home (opcional, se ajudar a manter `page.tsx` limpo) |

### Modificar

| Arquivo | Mudança |
| --- | --- |
| `src/app/page.tsx` | Substituir a landing pela home de produtos, usando `SiteShell` |

### Não tocar

- `src/app/layout.tsx`, `src/app/globals.css`, `next.config.ts`
- `src/components/layout/**`, `src/server/auth/**`, `src/app/auth/**`, `src/app/api/v1/sign-in/**`
- `src/app/products/**`, `src/app/api/v1/products/[id]/**`, `src/server/feedback/**`, `src/components/feedback/**`
- `supabase/migrations/*_create_products_feedbacks.sql`
- `package.json`, `README.md`
- `src/components/ui/**` existentes (se precisar de um primitivo novo, criar componente local em `src/components/products/`)

## 7. Etapas de implementação

1. Criar migration e tipos de produto.
2. Implementar validação compartilhada de query/body.
3. Implementar `listProducts` com `range` e `count: "exact"`.
4. Implementar `createProduct` com `nanoid()`.
5. Criar Route Handler com `GET` e `POST`.
6. Criar client HTTP `fetchProducts`/`submitProduct` com erros tipados.
7. Criar `ProductCard`, `ProductImage` e skeleton.
8. Criar `ProductGrid` com `useInfiniteQuery`, `IntersectionObserver` e fallback “Carregar mais”.
9. Reescrever `src/app/page.tsx` usando `SiteShell` + hero + grade.
10. Verificar estados: loading, vazio, erro, fim da lista e link para `/products/[id]`.

## 8. UI/UX

- Hero curto, sem competir com os produtos:
  - eyebrow “Comunidade avalia.”;
  - título editorial “Descubra o que vale a pena.”;
  - subtítulo de uma linha.
- Grade responsiva: 1 coluna no mobile, 2 em `sm`, 3 em `lg` (cards com imagem 4:3).
- Card:
  - imagem com `object-cover`, borda sutil e fallback com inicial do produto;
  - nome como link para `/products/{id}`;
  - descrição com `line-clamp-2`;
  - link externo discreto (ícone `ExternalLink`) com `target="_blank"` e `rel="noreferrer noopener"`;
  - não aninhar links clicáveis.
- Hover: elevação leve/borda dourada, sem exagero.
- Loading: skeleton com a mesma proporção dos cards.
- Vazio: mensagem “Ainda não há produtos por aqui.” + CTA para criar conta ou sugestão de inserir via API.
- Erro: bloco com mensagem e botão “Tentar novamente”.
- Fim da lista: mensagem sutil “Você chegou ao fim”.
- Header/footer vêm do `SiteShell` (feature Sign-In), mantendo consistência entre Home e detalhe.
- Acessibilidade: sentinela com `aria-hidden`, botão de fallback real, foco visível, `alt` descritivo, contraste e `prefers-reduced-motion`.

## 9. Critérios de aceitação → onde é atendido

| Critério | Atendimento |
| --- | --- |
| Home lista todos os produtos | `ProductGrid` + `GET /api/v1/products` |
| Paginação com infinite scroll | `useInfiniteQuery` + `IntersectionObserver` |
| Card com título, imagem e descrição | `ProductCard` |
| Tabela `products` + migration | migration `20261109010000_create_products.sql` |
| `GET /api/v1/products` com `200`/vazio | Route Handler |
| Clique no nome navega para detalhe | `Link href={/products/${id}}` |
| Endpoint manual `POST /products` | `POST /api/v1/products` |

## 10. Verificação

Executar apenas sobre os arquivos desta feature:

```bash
npx biome check src/server/products src/lib/validation/product.ts \
  src/lib/api/products.ts src/app/api/v1/products/route.ts \
  src/components/products src/components/home src/app/page.tsx
```

O orquestrador rodará `npm run typecheck`, `npm run check` e `npm run build` após as três features.

Checklist manual (com migration aplicada):
- abrir `/` e ver skeleton → cards;
- rolar até o fim e carregar a próxima página;
- base vazia → estado vazio;
- `POST /api/v1/products` cria item e ele aparece após recarregar;
- clicar no nome abre `/products/{id}` (após a feature Feedback);
- imagem quebrada cai no fallback.

## 11. Riscos e observações

- **`image_url` não está na spec original**: foi adicionada porque a UI exige imagem e o `POST` aceita “imagem”. Validar com o time.
- **`score` boolean**: mantido literalmente conforme a spec, mas não é exibido; provavelmente será um agregado de avaliações no futuro. Não alterar o tipo sem decisão de produto.
- **POST público**: endpoint manual sem autenticação. Documentar e considerar admin/secret em produção.
- **Offset pagination**: pode duplicar/pular itens se produtos forem inseridos durante o scroll. Aceitável para o escopo; cursor fica como evolução.
- **Dependência de `SiteShell`**: se a feature Sign-In ainda não tiver criado o componente, a Home pode escrever o import e o build final será validado pelo orquestrador. Não criar uma cópia local.
- **`next/image` evitado**: imagens vêm de domínios arbitrários; `<img>` + fallback reduz configuração e risco.
- **Migrations não são aplicadas durante a execução paralela**; o orquestrador/aplicação manual fará isso ao final, na ordem products → feedbacks.
- **Link para detalhe**: pode retornar 404 até a feature Feedback concluir; isso é esperado durante a execução paralela.
- **Não atualizar README** nesta feature; o orquestrador consolida a documentação ao final.
