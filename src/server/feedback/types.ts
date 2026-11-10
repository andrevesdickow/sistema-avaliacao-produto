/**
 * Formato retornado pelo Supabase (snake_case). Mantido separado do DTO para
 * que a camada de API nunca vaze detalhes do banco para o cliente.
 */
export type FeedbackRow = {
  id: string;
  score: number;
  comment: string;
  created_at: string;
  created_by: string;
  product_id: string;
};

/** Autor de uma avaliação, sem dados sensíveis como e-mail. */
export type FeedbackAuthor = {
  id: string;
  firstName: string;
  lastName: string;
};

/** Avaliação no formato consumido pela API e pela UI (camelCase). */
export type Feedback = {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
};

export type FeedbackWithAuthor = Feedback & {
  author: FeedbackAuthor;
};

export const FEEDBACK_COLUMNS =
  "id, score, comment, created_at, created_by, product_id";

export function mapFeedbackRow(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    score: row.score,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
