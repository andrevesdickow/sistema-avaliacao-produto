import { NextResponse } from "next/server";
import { z } from "zod";

import { signInSchema } from "@/lib/validation/sign-in";
import {
  authenticateAccount,
  InvalidCredentialsError,
} from "@/server/accounts/authenticate-account";
import { createSession } from "@/server/auth/session";

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

  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Confira os dados informados e tente novamente.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  try {
    const user = await authenticateAccount(parsed.data);

    await createSession(user.id);

    return NextResponse.json({ data: { user } }, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return errorResponse(
        401,
        "INVALID_CREDENTIALS",
        "E-mail ou senha inválidos.",
      );
    }

    console.error("[sign-in] Falha ao autenticar", error);

    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Não foi possível entrar agora. Tente novamente em instantes.",
    );
  }
}
