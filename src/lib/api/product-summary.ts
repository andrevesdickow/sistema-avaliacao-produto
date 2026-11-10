export type ProductSummaryResult = {
  summary: string;
  feedbackCount: number;
  generatedAt: string;
  model: string;
};

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ProductSummaryApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ProductSummaryApiError";
    this.code = code;
  }
}

/**
 * Busca o resumo por IA do produto. O servidor devolve `null` quando o produto
 * ainda não tem avaliações.
 */
export async function fetchProductSummary(
  productId: string,
  signal?: AbortSignal,
): Promise<ProductSummaryResult | null> {
  let response: Response;

  try {
    response = await fetch(
      `/api/v1/products/${encodeURIComponent(productId)}/summary`,
      {
        headers: { Accept: "application/json" },
        signal,
      },
    );
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new ProductSummaryApiError(
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | ({ data?: ProductSummaryResult | null } & ErrorBody)
    | null;

  if (!response.ok) {
    throw new ProductSummaryApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ??
        "Não foi possível carregar o resumo por IA agora.",
    );
  }

  return body?.data ?? null;
}
