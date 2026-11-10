import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getSupabaseAdminClient } from "@/server/supabase";

export const SESSION_COOKIE_NAME = "avalia_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Fallback usado apenas em desenvolvimento para não travar o `npm run dev`
 * quando `SESSION_SECRET` não estiver configurado. Nunca use este valor em
 * produção: todas as sessões assinadas com ele podem ser forjadas.
 */
const DEVELOPMENT_FALLBACK_SECRET =
  "avalia-development-only-insecure-session-secret";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type SessionPayload = {
  sub: string;
  exp: number;
};

type AccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export class MissingSessionSecretError extends Error {
  constructor() {
    super(
      "Configure SESSION_SECRET no ambiente de produção para assinar a sessão.",
    );
    this.name = "MissingSessionSecretError";
  }
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret && secret.length > 0) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new MissingSessionSecretError();
  }

  return DEVELOPMENT_FALLBACK_SECRET;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sub === "string" &&
    candidate.sub.length > 0 &&
    typeof candidate.exp === "number" &&
    Number.isFinite(candidate.exp)
  );
}

function createSessionToken(accountId: string): string {
  const payload: SessionPayload = {
    sub: accountId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );

  return `${encodedPayload}.${sign(encodedPayload, getSessionSecret())}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, providedSignature] = parts;

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, getSessionSecret());
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }

  if (!isSessionPayload(payload)) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function createSession(accountId: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(accountId), {
    ...cookieOptions,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

export async function getSession(): Promise<{ accountId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);

  if (!payload) {
    return null;
  }

  return { accountId: payload.sub };
}

/**
 * Resolve o usuário da sessão a partir da tabela `accounts`, nunca do cookie.
 *
 * Roda em um escopo `"use cache: private"` porque depende de dados de request:
 * lê `cookies()` e valida a expiração do token contra `Date.now()`. Sem isso,
 * o render de prerender do dev aborta com "unstable value `Date.now()` while
 * prerendering". O escopo privado é dinâmico por definição (fica fora do shell
 * estático, nunca é compartilhado entre sessões no servidor) e deduplica as
 * chamadas dentro de uma mesma request, além de permitir prefetch por sessão.
 * Retorna `null` quando não há sessão válida, a conta foi removida ou está
 * inativa.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  "use cache: private";

  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    const { data, error } = await getSupabaseAdminClient()
      .from("accounts")
      .select("id, first_name, last_name, email")
      .eq("id", session.accountId)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("[auth] Falha ao carregar o usuário da sessão", error);
      return null;
    }

    if (!data) {
      return null;
    }

    const account = data as AccountRow;

    return {
      id: account.id,
      firstName: account.first_name,
      lastName: account.last_name,
      email: account.email,
    };
  } catch (error) {
    console.error("[auth] Erro inesperado ao carregar o usuário", error);
    return null;
  }
}
