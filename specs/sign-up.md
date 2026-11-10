# Sign-up (Criação de conta)

## Escopo
Front-end, Back-end, Banco de Dados

## Contexto
Precisamos implementar o fluxo para criação de contas na plataforma. As pessoas precisarão fornecer:
- Primeiro nome
- Sobrenome
- E-mail
- Senha
- Confirmação de senha

## Requisitos funcionais
1. Precisamos adicionar validação no formulário na camada de cliente
  1.1. Caso o formulário esteja válido, podemos enviar a requisição para a API
2. Os campos de nome e sobrenome devem ser separados
3. Precisamos criar uma nova conta no banco de dados na tabela de accounts:
  3.1. `id`: nanoid (gerado com `nanoid` na camada de API)
  3.2. `first_name`: text
  3.3. `last_name`: text
  3.4. `created_at`: timestamp
  3.5. `updated_at`: timestamp
  3.6. `active`: boolean
  3.7. `email`: text
  3.8. `password`: text (hashed)
  3.9. `salt`: text (hashed)
4. A requisição deve ser um **POST** para `/api/v1/sign-up` e receber os dados como JSON no `body`
5. Caso tudo der certo, retornar `201` ou erros de acordo com a validação:
  5.1. `400`: Má formatação de dados

## Requisitos não funcionais
- Segurança: Precisamos salvar as senhas de forma segura no banco de dados
  - Precisamos receber os dados do cliente de forma segura usando HTTPS (para prevenir network sniff)
- UI/UX: Boa experiência de uso através de uma interface bonita, elegante, moderna
- Performance: O processo de criação de conta precisa ser rápido

## Você deve
- Criar a base do projeto com um endpoint inicial para criação de conta
- Criar a base do projeto com uma página inicial para a interface de criação de conta
- Configurar as bibliotecas base

## Você não deve
- Implementar qualquer outra funcionalidade que não esteja relaciona com sign-up (criação de contas)
- Não vamos realizar nenhum envio de e-mail no momento, apenas processar a requisição, salvar no banco de dados e retornar um sucesso

## Tecnologias (Stack)
React.js, Next.js, React-hook-form, Shadcn, TailwindCSS, Supabase, TRPC, bcryptjs, NPM

## Critérios de aceitação
- Temos uma página para criar uma nova conta em `/auth/sign-up`
- A página contém um formulário com validação
- A plataforma consegue se comunicar com a API para enviar os dados e enviar uma resposta
- Estamos informando possíveis erros
  - Mostrar um _alert_ em vermelho no formulário
  - Não permitir criar conta com um e-mail já existente
- Estamos informando o sucesso de criação de conta:
  - Navegar para `/auth/sign-up/success`

## Resultado
Pessoas conseguem criar uma nova conta na plataforma