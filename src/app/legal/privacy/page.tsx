import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Como a avalia. coleta, usa e protege os dados das contas cadastradas.",
};

export default function PrivacyPage() {
  return (
    <article className="legal-prose">
      <h1 className="font-display text-4xl leading-tight tracking-tight">
        Política de privacidade
      </h1>
      <p>Última atualização: 9 de novembro de 2026.</p>

      <p>
        Esta política descreve quais dados a avalia. coleta no cadastro e como
        eles são usados e protegidos no estágio atual do produto.
      </p>

      <h2>Dados que coletamos</h2>
      <ul>
        <li>Nome, sobrenome e e-mail informados por você.</li>
        <li>
          Senha armazenada apenas como hash bcrypt, com salt individual. A senha
          em texto puro nunca é gravada.
        </li>
        <li>
          Data de criação e de atualização da conta e status ativo ou inativo.
        </li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Criar e manter sua conta.</li>
        <li>Autenticar seu acesso e proteger o serviço.</li>
        <li>Cumprir obrigações legais aplicáveis.</li>
      </ul>

      <h2>Compartilhamento</h2>
      <p>
        Não vendemos seus dados. Usamos provedores de infraestrutura para operar
        o serviço, incluindo banco de dados (Supabase) e hospedagem (Vercel).
      </p>

      <h2>Segurança</h2>
      <ul>
        <li>Senhas são protegidas com bcrypt e salt individual.</li>
        <li>
          O acesso da aplicação ao banco usa uma credencial restrita ao
          servidor.
        </li>
        <li>
          A tabela de contas tem controle de acesso por linha habilitado e não é
          exposta diretamente ao navegador.
        </li>
      </ul>

      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados. Os
        pedidos serão atendidos conforme a legislação aplicável, incluindo a Lei
        Geral de Proteção de Dados (LGPD).
      </p>

      <h2>Retenção</h2>
      <p>
        Mantemos os dados enquanto a conta existir ou pelo período exigido por
        lei. Este é um documento inicial e será revisado antes do lançamento
        público.
      </p>
    </article>
  );
}
