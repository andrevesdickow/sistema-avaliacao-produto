import "server-only";

import { Agent } from "@mastra/core/agent";

import type { FeedbackWithAuthor } from "@/server/feedback/types";
import type { Product } from "@/server/products/types";

/** Modelo usado no resumo. Trocável por qualquer id `provider/model` da Mastra. */
export const PRODUCT_SUMMARY_MODEL = "openai/gpt-4o-mini";

export class ProductSummaryConfigError extends Error {
  constructor() {
    super(
      "Configure OPENAI_API_KEY no arquivo .env.local para gerar resumos com IA.",
    );
    this.name = "ProductSummaryConfigError";
  }
}

export class ProductSummaryGenerationError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível gerar o resumo por IA.", { cause });
    this.name = "ProductSummaryGenerationError";
  }
}

const summaryAgent = new Agent({
  id: "product-review-summarizer",
  name: "Resumidor de avaliações",
  instructions: [
    "Você é um analista que resume avaliações de produtos para uma vitrine pública.",
    "Leia todas as avaliações fornecidas, com nota de 1 a 5 e comentário.",
    "Escreva um resumo geral em português do Brasil, com 2 a 4 frases curtas e corridas.",
    "Destaque os pontos positivos e negativos mais recorrentes e o sentimento geral.",
    "Não invente informações que não estejam nas avaliações.",
    "Não cite nomes de pessoas e não exponha dados pessoais.",
    "Não use listas, markdown, emojis, títulos ou aspas; devolva apenas o texto.",
    "Se houver poucas avaliações ou opiniões contraditórias, deixe isso claro em vez de generalizar.",
    "Comece situando o produto pelo nome.",
  ].join(" "),
  model: PRODUCT_SUMMARY_MODEL,
});

function formatAverage(averageScore: number): string {
  return averageScore.toFixed(1).replace(".", ",");
}

function buildPrompt(
  product: Product,
  feedbacks: FeedbackWithAuthor[],
  averageScore: number,
): string {
  const reviews = feedbacks
    .map(
      (feedback, index) =>
        `${index + 1}. Nota ${feedback.score}/5 — "${feedback.comment.trim()}"`,
    )
    .join("\n");

  return [
    `Produto: ${product.name}`,
    `Nota média: ${formatAverage(averageScore)} de 5 (${feedbacks.length} ${
      feedbacks.length === 1 ? "avaliação" : "avaliações"
    })`,
    "",
    "Avaliações:",
    reviews,
  ].join("\n");
}

/**
 * Chama o agente da Mastra com todas as avaliações do produto e devolve o
 * resumo em texto puro.
 */
export async function generateProductSummaryText(
  product: Product,
  feedbacks: FeedbackWithAuthor[],
  averageScore: number,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new ProductSummaryConfigError();
  }

  try {
    const result = await summaryAgent.generate(
      buildPrompt(product, feedbacks, averageScore),
      {
        modelSettings: {
          temperature: 0.3,
          maxOutputTokens: 240,
        },
      },
    );

    const summary = result.text.trim();

    if (!summary) {
      throw new Error("O modelo retornou um resumo vazio.");
    }

    return summary;
  } catch (error) {
    if (error instanceof ProductSummaryConfigError) {
      throw error;
    }

    throw new ProductSummaryGenerationError(error);
  }
}
