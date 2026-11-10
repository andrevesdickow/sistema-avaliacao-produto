# Plano — Feedback (Avaliações de Produto)

## 1. Objetivo

Criar a página pública de detalhe `/products/[id]` com informações do produto, lista de avaliações e formulário de nova avaliação (nota 1–5 + comentário) disponível apenas para pessoas autenticadas.

Resultado esperado: visitantes veem produto e avaliações; pessoas anônimas veem um bloco exigindo login; pessoas autenticadas conseguem enviar uma avaliação; a lista é atualizada após o envio.

## 2. Estado atual relevante

- Não existe página de detalhe de produto nem tabela de feedbacks.
- A Home criará a tabela `products` e o tipo `Product`; o link dos cards apontará para `/products/[id]`.
- Sign-In criará sessão, `getSession`, `getCurrentUser`, `SiteShell` e `SiteHeader`.
- `cacheComponents: true` e `params` assíncrono: a página de detalhe deve acessar `params`, banco e cookies dentro de `<Suspense>`.

## 3. Decisões de arquitetura

### 3.1 Banco de dados

Arquivo: `supabase/migrations/20261109020000_create_products_feedbacks.sql`

Tabela `public.products_feedbacks`:

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | `text` | PK, `nanoid()` na API |
| `score` | `integer` | `not null`, `check (score between 1 and 5)` |
| `comment` | `text` | `not null`, `trim`, 1–2000 caracteres |
| `created_at` | `timestamptz` | `not null default now()` |
| `created_by` | `text` | `not null`, FK → `accounts(id)` `on delete cascade` |
| `product_id` | `text` | `not null`, FK → `products(id)` `on delete cascade` |

Extras:
- índice `products_feedbacks_product_created_idx` em `(product_id, created_at desc)`;
- RLS habilitado sem policies públicas (API usa service role);
- migration depende de `products` e `accounts`; aplicar **depois** da migration de products.

### 3.2 Leitura e renderização

- A página de detalhe é um Server Component que busca produto + avaliações diretamente no banco (DAL), sem depender de fetch interno.
- Isso garante SEO, first paint rápido e lista pública.
- O formulário é Client Component e usa `POST /api/v1/products/[id]/feedbacks`.
- Após sucesso: `router.refresh()` para rebuscar os dados do servidor, resetar o formulário e mostrar feedback de sucesso. Sem cache global desnecessário.
- A página usa `SiteShell` (header/footer) e `SiteHeader` (estado autenticado) da feature Sign-In.
- `getCurrentUser()` define se o formulário ou o bloco de autenticação é exibido. A API **sempre** revalida a sessão; nunca confiar no client.

### 3.3 Sessão e autorização

- `GET` da página: público.
- `POST` de feedback: exige sessão válida.
  - sem sessão → `401 { error: { code: "UNAUTHENTICATED", message } }`;
  - produto inexistente → `404`.
- O `created_by` vem exclusivamente da sessão, nunca do body.
- Não há edição/exclusão de avaliações nesta entrega.
- Não há paginação de avaliações nesta entrega (a spec pede listar todas); registrar paginação como evolução se o volume crescer.

### 3.4 Exibição de autor

- Mostrar **primeiro nome + sobrenome** e avatar DiceBear (seed = `account.id`).
- **Não expor e-mail** de quem avaliou.
- Para montar a lista, buscar feedbacks e depois buscar as contas por `id` (evita depender do nome exato da constraint no select aninhado do Supabase).
- Datas com `date-fns` e locale `ptBR` (ex.: “há 2 dias”).

### 3.5 Regra de convivência com as outras features

- **Dona exclusiva de `src/app/products/[id]/**`, `src/app/api/v1/products/[id]/feedbacks/**`, `src/server/feedback/**`, `src/app/products/**` e da migration de feedbacks.
- **Dona de `src/server/products/get-product.ts`** (leitura pontual do produto para o detalhe). A Home é dona de `list-products.ts`/`create-product.ts`.
- Consumir `SiteShell` e `getCurrentUser`/`getSession` sem editá-los.
- Consumir o tipo `Product` de `src/server/products/types.ts` (criado pela Home).
- Não editar a home, a API de produtos, a migration de products, auth ou header.

## 4. API — `POST /api/v1/products/[id]/feedbacks`

Request JSON:

```json
{
  "score": 5,
  "comment": "Ótimo custo-benefício. Uso todos os dias."
}
```

Validação Zod:
- `score`: inteiro de 1 a 5;
- `comment`: string `trim`, mínimo 1, máximo 2000.

Respostas:

| Status | Cenário | Body |
| --- | --- | --- |
| `201` | Avaliação criada | `{ "data": { "id", "score", "comment", "createdAt", "author": { "firstName", "lastName" } } }` |
| `400` | JSON/schema inválido | `{ "error": { "code": "INVALID_JSON" \| "VALIDATION_ERROR", "message", "fields?" } }` |
| `401` | Sem sessão válida | `{ "error": { "code": "UNAUTHENTICATED", "message": "Entre na sua conta para avaliar este produto." } }` |
| `404` | Produto não encontrado | `{ "error": { "code": "PRODUCT_NOT_FOUND", "message" } }` |
| `500` | Falha inesperada | `{ "error": { "code": "INTERNAL_ERROR", "message" } }` |

Observação: não será criado `GET /api/v1/products/[id]/feedbacks` nesta entrega, pois a página server-side já lista as avaliações. Se o formulário precisar de atualização sem refresh completo no futuro, o endpoint pode ser adicionado.

## 5. Arquivos

### Criar

| Arquivo | Responsabilidade |
| --- | --- |
| `supabase/migrations/20261109020000_create_products_feedbacks.sql` | Tabela, FKs, check, índice e RLS |
| `src/server/products/get-product.ts` | Busca produto por id para o detalhe |
| `src/server/feedback/types.ts` | `Feedback`, `FeedbackRow`, `FeedbackWithAuthor` |
| `src/server/feedback/list-feedbacks.ts` | Feedbacks do produto + autores |
| `src/server/feedback/create-feedback.ts` | Insert com `nanoid()` e `created_by` da sessão |
| `src/lib/validation/feedback.ts` | Schema Zod de criação + tipos |
| `src/lib/api/feedback.ts` | `submitFeedback` + erros tipados |
| `src/app/products/[id]/page.tsx` | Página pública de detalhe com metadata + Suspense |
| `src/app/api/v1/products/[id]/feedbacks/route.ts` | Route Handler `POST` |
| `src/components/feedback/product-detail.tsx` | Composição server-side do detalhe |
| `src/components/feedback/product-hero.tsx` | Imagem, título, descrição, link externo, resumo de nota |
| `src/components/feedback/feedback-list.tsx` | Lista pública de avaliações |
| `src/components/feedback/feedback-card.tsx` | Item com avatar, autor, data, estrelas e comentário |
| `src/components/feedback/feedback-form.tsx` | Formulário client com RHF/Zod/React Query |
| `src/components/feedback/feedback-auth-required.tsx` | Bloco para visitante anônimo |
| `src/components/feedback/rating-stars.tsx` | Estrelas acessíveis (exibição e input) |
| `src/components/feedback/product-detail-skeleton.tsx` | Skeleton da página |
| `src/components/ui/textarea.tsx` | Primitivo Shadcn necessário para o comentário (somente esta feature) |

### Modificar

Nenhum arquivo de outra feature. A página `/products/[id]` é nova e todos os componentes são novos.

### Não tocar

- `src/app/page.tsx`, `src/app/api/v1/products/route.ts`, `src/server/products/list-products.ts`, `src/server/products/create-product.ts`, `src/server/products/types.ts`
- `supabase/migrations/*_create_products.sql`
- `src/components/layout/**`, `src/server/auth/**`, `src/app/auth/**`, `src/app/api/v1/sign-in/**`
- `src/app/layout.tsx`, `src/app/globals.css`, `next.config.ts`
- `package.json`, `README.md`
- Componentes de UI existentes em `src/components/ui/**` (exceto criar `textarea.tsx`)

## 6. Fluxo da página

1. `app/products/[id]/page.tsx` renderiza `SiteShell` e um `<Suspense fallback={<ProductDetailSkeleton />}>`.
2. Dentro do Suspense, resolve `params` (`Promise<{ id: string }>`) e renderiza `<ProductDetail id={id} />`.
3. `ProductDetail` (Server Component) executa em paralelo:
   - `getProduct(id)`;
   - `listFeedbacks(id)`;
   - `getCurrentUser()`.
4. Se o produto não existir → `notFound()`.
5. Renderiza `ProductHero`, `FeedbackList` e:
   - `FeedbackAuthRequired` se `user` for `null`;
   - `FeedbackForm productId={id}` se autenticado.
6. `FeedbackForm` valida no client, envia `POST`, exibe erro em alerta e, no sucesso, mostra mensagem, limpa campos e chama `router.refresh()`.

## 7. UI/UX

- Manter a identidade existente: dark, Newsreader, dourado, bordas suaves.
- Layout em coluna única no mobile e duas colunas no desktop:
  - esquerda: imagem grande do produto + informações;
  - direita: resumo da nota, quantidade de avaliações e formulário/bloco de login.
- `ProductHero`:
  - breadcrumb/voltar para a home;
  - nome como `<h1>`;
  - descrição;
  - botão “Ver site do produto” com `target="_blank"` e `rel="noreferrer noopener"`;
  - nota média com estrelas e contagem.
- Lista:
  - cards com avatar, nome do autor, data relativa, estrelas e comentário;
  - separadores sutis, sem excesso de caixas;
  - estado vazio: “Ainda não há avaliações. Seja a primeira pessoa a avaliar.”
- Formulário:
  - título “Avalie este produto”;
  - estrelas 1–5 como radio group acessível (teclado, `aria-label`, foco visível);
  - `Textarea` com contador opcional de caracteres;
  - botão “Publicar avaliação” com estado pendente;
  - erros por campo e alerta destrutivo para erro de servidor;
  - mensagem de sucesso discreta após `router.refresh()`.
- Bloco anônimo:
  - ícone de cadeado/estrela;
  - texto “Entre para avaliar este produto”;
  - botão para `/auth/sign-in`;
  - link secundário para criar conta.
- Acessibilidade:
  - estrelas com `role="radiogroup"` e rótulos claros;
  - `aria-describedby` nos erros;
  - foco no alerta em erro de servidor;
  - imagens com `alt` e fallback;
  - respeito a `prefers-reduced-motion`.

## 8. Critérios de aceitação → onde é atendido

| Critério | Atendimento |
| --- | --- |
| Página `/products/[id]` | `src/app/products/[id]/page.tsx` |
| Mostra informações do produto | `ProductHero` + `getProduct` |
| Lista todas as avaliações | `listFeedbacks` + `FeedbackList` |
| Formulário para nova avaliação | `FeedbackForm` |
| Bloco de autenticação para anônimo | `FeedbackAuthRequired` |
| Nota 1–5 + comentário | `rating-stars.tsx` + `textarea.tsx` + Zod |
| Tabela `products_feedbacks` | migration `20261109020000_create_products_feedbacks.sql` |
| Endpoint de criação | `POST /api/v1/products/[id]/feedbacks` |

## 9. Verificação

Executar apenas sobre os arquivos desta feature:

```bash
npx biome check src/server/feedback src/server/products/get-product.ts \
  src/lib/validation/feedback.ts src/lib/api/feedback.ts \
  src/app/products src/app/api/v1/products/\[id\]/feedbacks \
  src/components/feedback src/components/ui/textarea.tsx
```

O orquestrador rodará `npm run typecheck`, `npm run check` e `npm run build` após as três features.

Checklist manual (com migrations aplicadas):
- `/products/{id}` de produto existente → detalhe + avaliações;
- produto inexistente → 404;
- visitante anônimo → lista visível + bloco de login, sem formulário;
- autenticado → formulário visível;
- nota fora de 1–5 ou comentário vazio → `400` + erros no form;
- envio válido → `201`, lista atualiza e formulário limpa;
- sessão expirada/removida → `401` e bloco de login ao recarregar;
- autor exibido sem e-mail.

## 10. Riscos e observações

- **Dependência de products**: se a migration de products não estiver aplicada, a página e o POST falham. Aplicar na ordem correta.
- **Dependência de accounts**: `created_by` referencia `accounts`; contas removidas com `on delete cascade` removem seus feedbacks.
- **Dependência do Sign-In**: `SiteShell`, `getSession` e `getCurrentUser` precisam existir no merge final. Durante a execução paralela, o import pode ficar temporariamente sem resolução; o orquestrador valida o build final.
- **`cacheComponents`**: acessar `params`, banco ou `cookies()` fora do `<Suspense>` quebra o build. O plano já coloca tudo dentro da fronteira.
- **Sem paginação de feedbacks**: adequado ao escopo; se um produto tiver muitas avaliações, adicionar paginação/cursor depois.
- **`router.refresh()`**: rebusca os dados server-side; é mais simples e confiável do que manter uma lista client duplicada. Em troca, há uma requisição extra após o envio.
- **Sem edição/exclusão/moderação**: fora do escopo.
- **`textarea.tsx`**: único primitivo Shadcn novo; para evitar conflito, apenas a feature Feedback cria esse arquivo.
- **Não aplicar migrations durante a execução paralela**; o orquestrador fará a validação e a aplicação ao final.
- **Não atualizar README** nesta feature; o orquestrador consolida a documentação.
