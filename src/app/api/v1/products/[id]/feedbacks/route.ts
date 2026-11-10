import { NextResponse } from "next/server";
import { z } from "zod";

import { feedbackSchema } from "@/lib/validation/feedback";
import { getCurrentUser } from "@/server/auth/session";
import { createFeedback } from "@/server/feedback/create-feedback";
import { getProduct } from "@/server/products/get-product";

type RouteParams = {
  params: Promise<{ id: string }>;
};

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

export async function POST(request: Request, context: RouteParams) {
  const { id } = await context.params;

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

  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Confira os dados informados e tente novamente.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(
        401,
        "UNAUTHENTICATED",
        "Entre na sua conta para avaliar este produto.",
      );
    }

    const product = await getProduct(id);

    if (!product) {
      return errorResponse(404, "PRODUCT_NOT_FOUND", "Produto não encontrado.");
    }

    const feedback = await createFeedback({
      productId: product.id,
      accountId: user.id,
      score: parsed.data.score,
      comment: parsed.data.comment,
    });

    return NextResponse.json(
      {
        data: {
          ...feedback,
          author: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[products/[id]/feedbacks] Falha ao criar avaliação", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Não foi possível publicar sua avaliação agora. Tente novamente em instantes.",
    );
  }
}
