import "server-only";

import bcrypt from "bcryptjs";

import type { SignInPayload } from "@/lib/validation/sign-in";
import { getSupabaseAdminClient } from "@/server/supabase";

/**
 * Hash bcrypt descartável usado quando a conta não existe (ou está inativa)
 * para que o custo do `bcrypt.compare` seja parecido nos dois caminhos e não
 * revele, pelo tempo de resposta, se um e-mail está cadastrado.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$10$HnrKwrSo.AvkOGUtNYa82O4GG.MvKMynorIB0btFWmlftgbgqobjC";

type AccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export type AuthenticatedAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super("E-mail ou senha inválidos.");
    this.name = "InvalidCredentialsError";
  }
}

export class AccountLookupError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível consultar a conta.", { cause });
    this.name = "AccountLookupError";
  }
}

/**
 * Valida e-mail + senha contra a tabela `accounts`. Qualquer falha de
 * credencial (e-mail inexistente, conta inativa ou senha errada) resulta no
 * mesmo `InvalidCredentialsError`, sem revelar qual campo falhou.
 */
export async function authenticateAccount(
  payload: SignInPayload,
): Promise<AuthenticatedAccount> {
  const { data, error } = await getSupabaseAdminClient()
    .from("accounts")
    .select("id, first_name, last_name, email, password")
    .eq("email", payload.email)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new AccountLookupError(error);
  }

  if (!data) {
    await bcrypt.compare(payload.password, DUMMY_PASSWORD_HASH);
    throw new InvalidCredentialsError();
  }

  const account = data as AccountRow;
  const passwordMatches = await bcrypt.compare(
    payload.password,
    account.password,
  );

  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    email: account.email,
  };
}
