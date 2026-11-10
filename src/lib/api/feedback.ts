import type { FeedbackPayload } from "@/lib/validation/feedback";

export type FeedbackResult = {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
};

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
};

export class FeedbackApiError extends Error {
  readonly code: string;
  readonly fields?: Record<string, string[]>;

  constructor(
    code: string,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "FeedbackApiError";
    this.code = code;
    this.fields = fields;
  }
}

export async function submitFeedback(
  productId: string,
  payload: FeedbackPayload,
): Promise<FeedbackResult> {
  let response: Response;

  try {
    response = await fetch(
      `/api/v1/products/${encodeURIComponent(productId)}/feedbacks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
  } catch {
    throw new FeedbackApiError(
      "NETWORK_ERROR",
      "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | ({ data?: FeedbackResult } & ErrorBody)
    | null;

  if (!response.ok || !body?.data) {
    throw new FeedbackApiError(
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ??
        "Não foi possível publicar sua avaliação. Tente novamente.",
      body?.error?.fields,
    );
  }

  return body.data;
}
