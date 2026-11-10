import { NextResponse } from "next/server";

import { deleteSession } from "@/server/auth/session";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({ data: { ok: true } }, { status: 200 });
  } catch (error) {
    console.error("[sign-out] Falha ao encerrar a sessão", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Não foi possível sair agora. Tente novamente.",
        },
      },
      { status: 500 },
    );
  }
}
