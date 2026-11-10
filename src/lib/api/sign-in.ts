import type { SignInPayload } from "@/lib/validation/sign-in";

export type SignInUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type SignInResult = {
  user: SignInUser;
};

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
};

export class SignInApiError extends Error {
  readonly code: string;
  readonly fields?: Record<string, string[]>;

  constructor(
    code: string,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "SignInApiError";
    this.code = code;
    this.fields = fields;
  }
}

export async function submitSignIn(
  payload: SignInPayload,
): Promise<SignInUser> {
  let response: Response;

  try {
    response = await fetch("/api/v1/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new SignInApiError(
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | ({ data?: SignInResult } & ErrorBody)
    | null;

  if (!response.ok || !body?.data?.user) {
    throw new SignInApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? "Não foi possível entrar. Tente novamente.",
      body?.error?.fields,
    );
  }

  return body.data.user;
}
