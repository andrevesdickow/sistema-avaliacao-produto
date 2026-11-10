import "server-only";

import {
  generateProductSummaryText,
  PRODUCT_SUMMARY_MODEL,
} from "@/server/ai/product-summary-agent";
import type { FeedbackWithAuthor } from "@/server/feedback/types";
import type { Product } from "@/server/products/types";
import { getSupabaseAdminClient } from "@/server/supabase";

export type ProductSummary = {
  summary: string;
  feedbackCount: number;
  generatedAt: string;
  model: string;
};

type ProductSummaryRow = {
  product_id: string;
  summary: string;
  feedback_count: number;
  model: string;
  generated_at: string;
};

const PRODUCT_SUMMARY_COLUMNS =
  "product_id, summary, feedback_count, model, generated_at";

export class ProductSummaryReadError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível carregar o resumo do produto.", { cause });
    this.name = "ProductSummaryReadError";
  }
}

/**
 * A tabela de cache não existe (migration pendente). Sem cache, cada visita
 * geraria uma nova chamada paga ao modelo, então interrompemos com erro de
 * configuração em vez de seguir sem persistência.
 */
export class ProductSummaryCacheError extends Error {
  constructor(cause: unknown) {
    super("O cache de resumos não está configurado no banco.", { cause });
    this.name = "ProductSummaryCacheError";
  }
}

function isMissingSummaryTable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const { code, message } = error as { code?: unknown; message?: unknown };

  return (
    code === "PGRST205" ||
    (typeof message === "string" && message.includes("product_summaries"))
  );
}

function mapProductSummaryRow(row: ProductSummaryRow): ProductSummary {
  return {
    summary: row.summary,
    feedbackCount: row.feedback_count,
    generatedAt: row.generated_at,
    model: row.model,
  };
}

async function getStoredProductSummary(
  productId: string,
): Promise<ProductSummary | null> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from("product_summaries")
      .select(PRODUCT_SUMMARY_COLUMNS)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      if (isMissingSummaryTable(error)) {
        throw new ProductSummaryCacheError(error);
      }

      throw new ProductSummaryReadError(error);
    }

    return data ? mapProductSummaryRow(data as ProductSummaryRow) : null;
  } catch (error) {
    if (error instanceof ProductSummaryCacheError) {
      throw error;
    }

    // Falhas transitórias de banco não impedem mostrar o resumo: seguimos sem
    // cache e tentamos persistir novamente na próxima leitura.
    console.error("[product-summaries] Falha ao ler resumo em cache", error);
    return null;
  }
}

async function saveProductSummary(
  productId: string,
  summary: ProductSummary,
): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from("product_summaries")
    .upsert(
      {
        product_id: productId,
        summary: summary.summary,
        feedback_count: summary.feedbackCount,
        model: summary.model,
        generated_at: summary.generatedAt,
      },
      { onConflict: "product_id" },
    );

  if (error) {
    throw new ProductSummaryReadError(error);
  }
}

/**
 * Devolve o resumo em cache ou gera um novo quando ainda não existe ou quando
 * o número de avaliações mudou desde a última geração. Sem avaliações, não há
 * resumo (`null`).
 */
export async function getOrGenerateProductSummary(
  product: Product,
  feedbacks: FeedbackWithAuthor[],
): Promise<ProductSummary | null> {
  if (feedbacks.length === 0) {
    return null;
  }

  const cached = await getStoredProductSummary(product.id);

  if (cached && cached.feedbackCount === feedbacks.length) {
    return cached;
  }

  const averageScore =
    feedbacks.reduce((total, feedback) => total + feedback.score, 0) /
    feedbacks.length;

  const summary = await generateProductSummaryText(
    product,
    feedbacks,
    averageScore,
  );

  const result: ProductSummary = {
    summary,
    feedbackCount: feedbacks.length,
    generatedAt: new Date().toISOString(),
    model: PRODUCT_SUMMARY_MODEL,
  };

  try {
    await saveProductSummary(product.id, result);
  } catch (error) {
    // O texto já foi gerado: devolvemos mesmo se o cache falhar. A próxima
    // leitura tenta persistir novamente.
    console.error("[product-summaries] Falha ao salvar resumo em cache", error);
  }

  return result;
}
