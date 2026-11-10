import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras de uso da avalia. no estágio atual do produto.",
};

export default function TermsPage() {
  return (
    <article className="legal-prose">
      <h1 className="font-display text-4xl leading-tight tracking-tight">
        Termos de uso
      </h1>
      <p>Última atualização: 9 de novembro de 2026.</p>

      <p>
        A avalia. está em desenvolvimento. Estes termos descrevem as regras para
        criar sua conta e, futuramente, usar os recursos de avaliação de
        produtos.
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>Informe dados verdadeiros e mantenha suas credenciais seguras.</li>
        <li>A conta é pessoal e intransferível.</li>
        <li>
          Podemos suspender contas que violem estes termos ou a legislação
          aplicável.
        </li>
      </ul>

      <h2>Uso da plataforma</h2>
      <ul>
        <li>
          Não é permitido publicar conteúdo ilegal, ofensivo, enganoso ou que
          viole direitos de terceiros.
        </li>
        <li>Avaliações devem refletir experiências reais com os produtos.</li>
        <li>
          Não é permitido tentar acessar dados de outras pessoas ou comprometer
          a segurança do serviço.
        </li>
      </ul>

      <h2>Conteúdo</h2>
      <p>
        Você mantém a titularidade do que publica e concede à avalia. permissão
        para exibir esse conteúdo na plataforma. Podemos remover conteúdo que
        viole estes termos.
      </p>

      <h2>Encerramento</h2>
      <p>
        Você pode solicitar o encerramento da conta a qualquer momento. Podemos
        descontinuar recursos em desenvolvimento, avisando quando possível.
      </p>

      <h2>Revisão</h2>
      <p>
        Este é um documento inicial e será revisado antes do lançamento público.
        Mudanças relevantes serão comunicadas nesta página.
      </p>
    </article>
  );
}
