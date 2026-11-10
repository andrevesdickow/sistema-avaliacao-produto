import type { Product, ProductList } from "@/server/products/types";

export const PRODUCTS_PAGE_SIZE = 12;

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
};

export class ProductsApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ProductsApiError";
    this.code = code;
  }
}

type FetchProductsOptions = {
  page: number;
  limit?: number;
  signal?: AbortSignal;
};

export async function fetchProducts({
  page,
  limit = PRODUCTS_PAGE_SIZE,
  signal,
}: FetchProductsOptions): Promise<ProductList> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  let response: Response;

  try {
    response = await fetch(`/api/v1/products?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    // Deixa o TanStack Query tratar o cancelamento (ex.: troca de página).
    if (signal?.aborted) {
      throw error;
    }

    throw new ProductsApiError(
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | ({ data?: Product[]; pagination?: ProductList["pagination"] } & ErrorBody)
    | null;

  if (!response.ok || !body?.data || !body.pagination) {
    throw new ProductsApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ??
        "Não foi possível carregar os produtos. Tente novamente.",
    );
  }

  return {
    data: body.data,
    pagination: body.pagination,
  };
}

export type SubmitProductInput = {
  name: string;
  link: string;
  image: string;
  price: number;
};

export async function submitProduct(
  payload: SubmitProductInput,
): Promise<Product> {
  let response: Response;

  try {
    response = await fetch("/api/v1/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ProductsApiError(
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | ({ data?: Product } & ErrorBody)
    | null;

  if (!response.ok || !body?.data) {
    throw new ProductsApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ??
        "Não foi possível salvar o produto. Tente novamente.",
    );
  }

  return body.data;
}
