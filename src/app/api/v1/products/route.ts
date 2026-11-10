import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createProductSchema,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  listProductsQuerySchema,
} from "@/lib/validation/product";
import { createProduct } from "@/server/products/create-product";
import { listProducts } from "@/server/products/list-products";

function errorResponse(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string[]>,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = listProductsQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  const query = parsed.success
    ? parsed.data
    : { page: DEFAULT_PAGE, limit: DEFAULT_LIMIT };

  try {
    const result = await listProducts(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[products] Falha ao listar produtos", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Não foi possível carregar os produtos agora. Tente novamente em instantes.",
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "O corpo da requisição deve ser um JSON válido.",
    );
  }

  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Confira os dados informados e tente novamente.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  try {
    const product = await createProduct(parsed.data);

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error("[products] Falha ao criar produto", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Não foi possível salvar o produto agora. Tente novamente em instantes.",
    );
  }
}
