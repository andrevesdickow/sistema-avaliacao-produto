import "server-only";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import type { SignUpPayload } from "@/lib/validation/sign-up";
import { getSupabaseAdminClient } from "@/server/supabase";

const SALT_ROUNDS = 10;

type AccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
};

export type CreatedAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Este e-mail já está cadastrado.");
    this.name = "EmailAlreadyInUseError";
  }
}

export class AccountPersistenceError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível salvar a conta.", { cause });
    this.name = "AccountPersistenceError";
  }
}

/**
 * Cria uma conta com id nanoid, salt aleatório e hash bcrypt da senha.
 * A unicidade do e-mail é garantida pelo índice `accounts_email_unique`
 * (lower(email)), evitando condição de corrida entre requisições.
 */
export async function createAccount(
  payload: SignUpPayload,
): Promise<CreatedAccount> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const passwordHash = await bcrypt.hash(payload.password, salt);

  const { data, error } = await getSupabaseAdminClient()
    .from("accounts")
    .insert({
      id: nanoid(),
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: passwordHash,
      salt,
      active: true,
    })
    .select("id, first_name, last_name, email, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new EmailAlreadyInUseError();
    }

    throw new AccountPersistenceError(error);
  }

  const account = data as AccountRow;

  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    email: account.email,
    createdAt: account.created_at,
  };
}
