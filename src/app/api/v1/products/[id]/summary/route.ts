import { NextResponse } from "next/server";

import {
  getOrGenerateProductSummary,
  ProductSummaryCacheError,
} from "@/server/ai/product-summary";
import {
  ProductSummaryConfigError,
  ProductSummaryGenerationError,
} from "@/server/ai/product-summary-agent";
import { listFeedbacks } from "@/server/feedback/list-feedbacks";
import { getProduct } from "@/server/products/get-product";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

/**
 * Resumo por IA das avaliações do produto. Usa o cache persistido e só chama
 * o modelo quando o resumo não existe ou ficou desatualizado.
 */
export async function GET(_request: Request, context: RouteParams) {
  const { id } = await context.params;

  try {
    const product = await getProduct(id);

    if (!product) {
      return errorResponse(404, "PRODUCT_NOT_FOUND", "Produto não encontrado.");
    }

    const feedbacks = await listFeedbacks(product.id);
    const summary = await getOrGenerateProductSummary(product, feedbacks);

    return NextResponse.json(
      { data: summary },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ProductSummaryConfigError) {
      console.error("[products/[id]/summary] OPENAI_API_KEY ausente", error);

      return errorResponse(
        503,
        "AI_NOT_CONFIGURED",
        "O resumo por IA ainda não está configurado.",
      );
    }

    if (error instanceof ProductSummaryGenerationError) {
      console.error("[products/[id]/summary] Falha ao gerar resumo", error);

      return errorResponse(
        503,
        "AI_UNAVAILABLE",
        "Não foi possível gerar o resumo por IA agora. Tente novamente em instantes.",
      );
    }

    if (error instanceof ProductSummaryCacheError) {
      console.error(
        "[products/[id]/summary] Tabela product_summaries ausente: aplique a migration 20261110000000_create_product_summaries.sql",
        error,
      );

      return errorResponse(
        503,
        "AI_CACHE_UNAVAILABLE",
        "O resumo por IA está temporariamente indisponível.",
      );
    }

    console.error("[products/[id]/summary] Falha ao carregar resumo", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Não foi possível carregar o resumo agora. Tente novamente em instantes.",
    );
  }
}
