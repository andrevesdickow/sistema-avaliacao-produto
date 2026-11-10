import "server-only";

import { nanoid } from "nanoid";

import type { CreateProductInput } from "@/lib/validation/product";
import {
  mapProductRow,
  PRODUCT_COLUMNS,
  type Product,
  type ProductRow,
} from "@/server/products/types";
import { getSupabaseAdminClient } from "@/server/supabase";

export class ProductPersistenceError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível salvar o produto.", { cause });
    this.name = "ProductPersistenceError";
  }
}

/** Insere um produto manualmente com id nanoid gerado na camada de API. */
export async function createProduct(
  payload: CreateProductInput,
): Promise<Product> {
  const { data, error } = await getSupabaseAdminClient()
    .from("products")
    .insert({
      id: nanoid(),
      name: payload.name,
      image: payload.image,
      price: payload.price,
      external_link: payload.link,
    })
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw new ProductPersistenceError(error);
  }

  return mapProductRow(data as ProductRow);
}
