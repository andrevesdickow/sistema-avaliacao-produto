import "server-only";

import { nanoid } from "nanoid";

import {
  FEEDBACK_COLUMNS,
  type Feedback,
  type FeedbackRow,
  mapFeedbackRow,
} from "@/server/feedback/types";
import { getSupabaseAdminClient } from "@/server/supabase";

export type CreateFeedbackInput = {
  productId: string;
  accountId: string;
  score: number;
  comment: string;
};

export class FeedbackPersistenceError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível salvar a avaliação.", { cause });
    this.name = "FeedbackPersistenceError";
  }
}

/**
 * Cria uma avaliação com id nanoid. `created_by` vem exclusivamente da sessão
 * resolvida no servidor, nunca do corpo da requisição.
 */
export async function createFeedback(
  input: CreateFeedbackInput,
): Promise<Feedback> {
  const { data, error } = await getSupabaseAdminClient()
    .from("products_feedbacks")
    .insert({
      id: nanoid(),
      score: input.score,
      comment: input.comment,
      created_by: input.accountId,
      product_id: input.productId,
    })
    .select(FEEDBACK_COLUMNS)
    .single();

  if (error) {
    throw new FeedbackPersistenceError(error);
  }

  return mapFeedbackRow(data as FeedbackRow);
}
