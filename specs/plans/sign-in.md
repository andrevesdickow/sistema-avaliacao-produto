# Plano — Sign-In (Autenticação)

## 1. Objetivo

Permitir que uma pessoa com conta existente entre na plataforma com **e-mail + senha**, crie uma sessão em cookie e veja o estado autenticado no cabeçalho da plataforma.

Resultado esperado: `/auth/sign-in` funcional, `POST /api/v1/sign-in` criando sessão, header com botão **Entrar** (anônimo) ou avatar + nome/sobrenome + e-mail (autenticado), e layout base compartilhado para as páginas públicas.

## 2. Estado atual relevante

- Sign-up já implementado com `accounts`, bcrypt, `POST /api/v1/sign-up`, formulário e página `/auth/sign-up`.
- Não existe sessão, cookie de autenticação, leitura de usuário atual, header global nem página de sign-in.
- A home atual (`src/app/page.tsx`) é uma landing institucional. Ela será substituída pela feature **Home**; este plano **não** altera `src/app/page.tsx`.
- `next.config.ts` usa `cacheComponents: true` e `partialPrefetching: true`. Qualquer leitura de `cookies()` em Server Component precisa estar dentro de `<Suspense>`.

## 3. Decisões de arquitetura

### 3.1 Sessão

- Sessão **stateless assinada**, sem nova dependência: payload JSON `{ sub: accountId, exp }` + HMAC-SHA256 com `node:crypto` (`createHmac`, `timingSafeEqual`).
- Cookie: `avalia_session`.
  - `httpOnly: true`
  - `secure: process.env.NODE_ENV === "production"`
  - `sameSite: "lax"`
  - `path: "/"`
  - `maxAge: 60 * 60 * 24 * 7` (7 dias)
- `SESSION_SECRET`:
  - documentar em `.env.example`;
  - em produção, ausência do segredo deve lançar erro claro;
  - em desenvolvimento, usar fallback local determinístico apenas para não travar o `npm run dev` (documentado como inseguro).
- A sessão guarda somente o `accountId`. Os dados exibidos (nome/e-mail) são lidos da tabela `accounts` no servidor, nunca do cookie.

### 3.2 Autenticação

- Reutilizar `accounts` e `bcryptjs`.
- Normalizar e-mail com `trim().toLowerCase()` (mesma regra do sign-up).
- Buscar por `email` + `active = true`.
- Validar senha com `bcrypt.compare(password, account.password)`. O hash bcrypt já contém o salt; a coluna `salt` continua existindo, mas não é necessária para o compare.
- Erros de credencial **sempre genéricos**: `401` com “E-mail ou senha inválidos.”, tanto para e-mail inexistente/inativo quanto para senha errada.
- Executar um `bcrypt.compare` contra um hash dummy quando a conta não existir, para reduzir diferença de tempo entre os casos.
- Sem rate limit nesta entrega (registrar como evolução futura).

### 3.3 Layout e header

- Criar um layout base reutilizável em componentes (`SiteShell` + `SiteHeader`), sem alterar `src/app/layout.tsx` e sem colocar header em páginas de auth/legal.
- `SiteShell` será consumido por **Home** e **Feedback**.
- `SiteHeader` é um Server Component assíncrono que lê a sessão. Como lê `cookies()`, fica dentro de `<Suspense>` com skeleton no próprio `SiteShell`.
- Header anônimo: link **Entrar** para `/auth/sign-in` + CTA **Criar conta**.
- Header autenticado: avatar DiceBear, nome + sobrenome e e-mail; ação **Sair** (relacionada a autenticação) via `POST /api/v1/sign-out`.
- Avatar via DiceBear em `<img>` (URL externa), sem `next/image` e sem alterar `next.config.ts`.

### 3.4 Regra de convivência com as outras features

Para permitir execução paralela, esta feature é dona dos arquivos compartilhados de autenticação/layout. **Home e Feedback apenas consomem** os contratos abaixo.

## 4. Contratos compartilhados (obrigatórios)

### 4.1 `src/server/auth/session.ts`

```ts
export const SESSION_COOKIE_NAME = "avalia_session";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export async function createSession(accountId: string): Promise<void>;
export async function deleteSession(): Promise<void>;
export async function getSession(): Promise<{ accountId: string } | null>;
export const getCurrentUser: () => Promise<SessionUser | null>;
```

Regras:
- `getCurrentUser` usa `cache()` do React para deduplicar dentro do render.
- `getCurrentUser` retorna `null` se não houver sessão, conta inativa ou conta removida.
- Toda leitura/escrita de cookie é `await cookies()`.

### 4.2 `src/components/layout/site-shell.tsx`

```tsx
export function SiteShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement;
```

Inclui `SiteHeader` dentro de `<Suspense>`, conteúdo central e footer simples. Home/Feedback não devem duplicar header/footer.

### 4.3 `src/components/layout/site-header.tsx`

Exporta `SiteHeader` (Server Component assíncrono) e, se necessário, `SiteHeaderSkeleton`.

## 5. API — `POST /api/v1/sign-in`

Request JSON:

```json
{
  "email": "marina@email.com",
  "password": "senha-segura"
}
```

Respostas:

| Status | Cenário | Body |
| --- | --- | --- |
| `200` | Credenciais válidas; cookie de sessão criado | `{ "data": { "user": { "id", "firstName", "lastName", "email" } } }` |
| `400` | JSON inválido ou schema inválido | `{ "error": { "code": "INVALID_JSON" \| "VALIDATION_ERROR", "message", "fields?" } }` |
| `401` | Credenciais inválidas | `{ "error": { "code": "INVALID_CREDENTIALS", "message": "E-mail ou senha inválidos." } }` |
| `500` | Falha inesperada | `{ "error": { "code": "INTERNAL_ERROR", "message" } }` |

Regras:
- Schema Zod compartilhado: `email` válido + `password` mínimo 1 (não repetir a regra de 8 caracteres do cadastro no login).
- `400` não deve revelar se o e-mail existe.
- `401` deve ser o único erro de credencial exibido no formulário.
- Sucesso também pode retornar `204`? **Não**: manter `200` com dados do usuário para o cliente atualizar o header.

### 5.1 `POST /api/v1/sign-out` (pequeno, relacionado)

- Remove o cookie de sessão.
- Retorna `204` ou `200 { "data": { "ok": true } }`.
- Usado pelo botão **Sair** do header.

## 6. Arquivos

### Criar

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/validation/sign-in.ts` | Schema Zod de login + tipos |
| `src/lib/api/sign-in.ts` | `submitSignIn`, erros tipados |
| `src/server/auth/session.ts` | Assinatura/verificação do cookie, `getSession`, `getCurrentUser`, create/delete |
| `src/server/accounts/authenticate-account.ts` | Busca da conta + `bcrypt.compare` + erro genérico |
| `src/app/api/v1/sign-in/route.ts` | Route Handler `POST` |
| `src/app/api/v1/sign-out/route.ts` | Route Handler `POST` de logout |
| `src/app/auth/sign-in/page.tsx` | Página `/auth/sign-in` com metadata |
| `src/components/auth/sign-in-form.tsx` | Formulário client com RHF + Zod + React Query |
| `src/components/layout/site-shell.tsx` | Layout base compartilhado |
| `src/components/layout/site-header.tsx` | Header server + estados anônimo/autenticado |
| `src/components/layout/sign-out-button.tsx` | Ação client de logout |

### Modificar

| Arquivo | Mudança |
| --- | --- |
| `src/components/auth/auth-shell.tsx` | Aceitar variante/copy de sign-in sem quebrar sign-up |
| `.env.example` | Documentar `SESSION_SECRET` |
| `src/components/auth/sign-up-form.tsx` | Link “Já tem conta? Entrar” (opcional, mesma área de auth) |

### Não tocar

- `src/app/page.tsx` (pertence à Home)
- `src/app/api/v1/products/**`, `src/app/products/**`
- `src/server/products/**`, `src/server/feedback/**`
- `src/components/products/**`, `src/components/feedback/**`
- `supabase/migrations/**` (esta feature não cria migration)
- `README.md`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`

## 7. Etapas de implementação

1. **Fundação de sessão**: criar `session.ts`, variáveis de ambiente e testes manuais de assinatura/expiração.
2. **Autenticação server-side**: `authenticate-account.ts` + schemas + erros tipados.
3. **Route Handlers**: sign-in e sign-out.
4. **Layout base**: `SiteShell`, `SiteHeader`, skeleton do header, avatar DiceBear e botão Sair.
5. **Página e formulário**: `/auth/sign-in`, validação client, alerta vermelho genérico, redirect para `/` com `router.refresh()`.
6. **Ajustes visuais**: variante de copy no `AuthShell`, cross-link com sign-up, responsividade e acessibilidade.
7. **Verificação local** dos arquivos desta feature.

## 8. UI/UX

- Manter a linguagem visual existente: tema dark, Newsreader nos títulos, dourado no acento.
- Página com `AuthShell`: painel editorial à esquerda e formulário à direita.
- Título: “Entre na sua conta”; subtítulo curto e acolhedor.
- Campos: e-mail (`autoComplete="email"`, `inputMode="email"`) e senha (`autoComplete="current-password"`) com botão mostrar/ocultar de 44×44 px.
- Erros por campo com `aria-describedby`; erro de servidor em `Alert` `variant="destructive"` com foco no alerta.
- Erro de credencial sempre: **“E-mail ou senha inválidos.”**
- Botão primário em largura total; estado `pending` com spinner e `motion-reduce`.
- Footer do formulário: “Ainda não tem conta? Criar conta”.
- Header autenticado: avatar 36 px, nome completo em uma linha, e-mail truncado; no mobile, e-mail pode ser ocultado.
- Skeleton do header evita salto de layout enquanto a sessão resolve.

## 9. Critérios de aceitação → onde é atendido

| Critério | Atendimento |
| --- | --- |
| Página `/auth/sign-in` | `src/app/auth/sign-in/page.tsx` |
| Formulário com validação client | `sign-in-form.tsx` + `sign-in.ts` |
| Comunicação com API e resposta | `submitSignIn` + `/api/v1/sign-in` |
| Erros exibidos em alerta vermelho | `Alert destructive` + mensagem genérica |
| Navegar para `/` no sucesso | `router.push("/")` + `router.refresh()` |
| Botão de login no header | `SiteHeader` anônimo |
| Avatar + nome + e-mail no header | `SiteHeader` autenticado |

## 10. Verificação

Executar apenas sobre os arquivos desta feature:

```bash
npx biome check src/lib/validation/sign-in.ts src/lib/api/sign-in.ts \
  src/server/auth src/server/accounts/authenticate-account.ts \
  src/app/api/v1/sign-in src/app/api/v1/sign-out \
  src/app/auth/sign-in src/components/auth/sign-in-form.tsx \
  src/components/layout src/components/auth/auth-shell.tsx
```

O orquestrador rodará `npm run typecheck`, `npm run check` e `npm run build` após as três features.

Checklist manual (quando o banco estiver disponível):
- conta existente + senha correta → `200`, cookie `avalia_session`, redirect `/`, header autenticado;
- senha errada, e-mail inexistente e conta inativa → `401` com mensagem genérica;
- body inválido/JSON inválido → `400`;
- acesso à home sem cookie → botão **Entrar**;
- logout → cookie removido e header anônimo.

## 11. Riscos e observações

- **Sessão sem tabela**: stateless por HMAC. Trocar `SESSION_SECRET` invalida todas as sessões; documentar.
- **`cacheComponents`**: qualquer uso de `getCurrentUser`/`cookies()` fora de `<Suspense>` gera erro de build. O header já nasce dentro de `Suspense`; a página de Feedback deve fazer o mesmo ao ler sessão.
- **Sem migration nesta feature**: a tabela `accounts` já existe.
- **Sem rate limit**: aceitável no escopo atual; não bloquear a entrega por isso.
- **Header global**: não será colocado no root layout para não aparecer duplicado em `/auth/*` e `/legal/*`. Home e Feedback usam `SiteShell`.
- **Home skeleton**: a spec de sign-in pede “home sem nada por enquanto”, mas a feature Home substituirá a home. Para evitar conflito, a Home é dona de `src/app/page.tsx` e este plano não a altera.
- **Não aplicar migrations** nesta feature.
