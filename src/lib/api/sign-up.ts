import type { SignUpPayload } from "@/lib/validation/sign-up";

export type SignUpResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
};

export class SignUpApiError extends Error {
  readonly code: string;
  readonly fields?: Record<string, string[]>;

  constructor(
    code: string,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "SignUpApiError";
    this.code = code;
    this.fields = fields;
  }
}

export async function submitSignUp(
  payload: SignUpPayload,
): Promise<SignUpResult> {
  let response: Response;

  try {
    response = await fetch("/api/v1/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new SignUpApiError(
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | ({ data?: SignUpResult } & ErrorBody)
    | null;

  if (!response.ok || !body?.data) {
    throw new SignUpApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ??
        "Não foi possível criar sua conta. Tente novamente.",
      body?.error?.fields,
    );
  }

  return body.data;
}
