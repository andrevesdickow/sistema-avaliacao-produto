import "server-only";

import {
  mapProductRow,
  PRODUCT_COLUMNS,
  type Product,
  type ProductRow,
} from "@/server/products/types";
import { getSupabaseAdminClient } from "@/server/supabase";

export class ProductReadError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível carregar o produto.", { cause });
    this.name = "ProductReadError";
  }
}

/** Busca um produto pelo id. Retorna `null` quando ele não existe. */
export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ProductReadError(error);
  }

  if (!data) {
    return null;
  }

  return mapProductRow(data as ProductRow);
}
