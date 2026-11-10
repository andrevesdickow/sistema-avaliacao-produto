import "server-only";

import type { ListProductsQuery } from "@/lib/validation/product";
import {
  mapProductRow,
  PRODUCT_COLUMNS,
  type ProductList,
  type ProductRow,
} from "@/server/products/types";
import { getSupabaseAdminClient } from "@/server/supabase";

export class ProductListError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível listar os produtos.", { cause });
    this.name = "ProductListError";
  }
}

/**
 * Lista produtos de forma paginada (offset). A ordenação usa `id` como
 * desempate para que a ordem seja estável entre requisições.
 */
export async function listProducts(
  query: ListProductsQuery,
): Promise<ProductList> {
  const { page, limit } = query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await getSupabaseAdminClient()
    .from("products")
    .select(PRODUCT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    throw new ProductListError(error);
  }

  const total = count ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const rows = (data ?? []) as ProductRow[];

  return {
    data: rows.map(mapProductRow),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}
