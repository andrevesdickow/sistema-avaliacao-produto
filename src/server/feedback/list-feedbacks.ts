import "server-only";

import {
  FEEDBACK_COLUMNS,
  type FeedbackAuthor,
  type FeedbackRow,
  type FeedbackWithAuthor,
  mapFeedbackRow,
} from "@/server/feedback/types";
import { getSupabaseAdminClient } from "@/server/supabase";

type AuthorRow = {
  id: string;
  first_name: string;
  last_name: string;
};

export class FeedbackListError extends Error {
  constructor(cause: unknown) {
    super("Não foi possível carregar as avaliações.", { cause });
    this.name = "FeedbackListError";
  }
}

/**
 * Lista as avaliações de um produto (mais recentes primeiro) e resolve os
 * autores em uma segunda consulta. Apenas nome e sobrenome são expostos;
 * e-mail nunca é selecionado.
 */
export async function listFeedbacks(
  productId: string,
): Promise<FeedbackWithAuthor[]> {
  const client = getSupabaseAdminClient();

  const { data, error } = await client
    .from("products_feedbacks")
    .select(FEEDBACK_COLUMNS)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new FeedbackListError(error);
  }

  const rows = (data ?? []) as FeedbackRow[];

  if (rows.length === 0) {
    return [];
  }

  const authorIds = [...new Set(rows.map((row) => row.created_by))];

  const { data: authorData, error: authorError } = await client
    .from("accounts")
    .select("id, first_name, last_name")
    .in("id", authorIds);

  if (authorError) {
    throw new FeedbackListError(authorError);
  }

  const authors = new Map<string, FeedbackAuthor>();

  for (const row of (authorData ?? []) as AuthorRow[]) {
    authors.set(row.id, {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
    });
  }

  return rows.map((row) => ({
    ...mapFeedbackRow(row),
    author: authors.get(row.created_by) ?? {
      id: row.created_by,
      firstName: "Pessoa",
      lastName: "",
    },
  }));
}
