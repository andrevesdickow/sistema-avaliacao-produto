import { NextResponse } from "next/server";
import { z } from "zod";

import { signUpSchema } from "@/lib/validation/sign-up";
import {
  createAccount,
  EmailAlreadyInUseError,
} from "@/server/accounts/create-account";

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

  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Confira os dados informados e tente novamente.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  try {
    const account = await createAccount(parsed.data);

    return NextResponse.json({ data: account }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      return errorResponse(
        409,
        "EMAIL_ALREADY_IN_USE",
        "Este e-mail já está cadastrado. Use outro e-mail para criar sua conta.",
      );
    }

    console.error("[sign-up] Falha ao criar conta", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Não foi possível criar sua conta agora. Tente novamente em instantes.",
    );
  }
}
