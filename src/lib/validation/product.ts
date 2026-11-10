import { z } from "zod";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 24;

function parseInteger(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isSafeInteger(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

/**
 * Queries inválidas são normalizadas para os defaults em vez de retornar erro:
 * a home nunca deve quebrar por causa de um parâmetro de URL malformado.
 */
function normalizePage(value: unknown): number {
  const page = parseInteger(value, DEFAULT_PAGE);

  return page >= 1 ? page : DEFAULT_PAGE;
}

function normalizeLimit(value: unknown): number {
  const limit = parseInteger(value, DEFAULT_LIMIT);

  if (limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, MAX_LIMIT);
}

export const listProductsQuerySchema = z.object({
  page: z.preprocess(normalizePage, z.number().int().min(1)),
  limit: z.preprocess(normalizeLimit, z.number().int().min(1).max(MAX_LIMIT)),
});

export type ListProductsQuery = z.output<typeof listProductsQuerySchema>;

const httpUrlSchema = z.url({
  protocol: /^https?$/i,
  error: "Informe uma URL válida começando com http:// ou https://.",
});

/**
 * Aceita preço numérico ou string numérica (inclusive com vírgula decimal,
 * comum em integrações brasileiras), normalizando para `number`.
 */
const priceSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const normalized = value.trim().replace(",", ".");

      if (normalized === "") {
        return value;
      }

      const parsed = Number(normalized);

      return Number.isFinite(parsed) ? parsed : value;
    }

    return value;
  },
  z
    .number({ error: "Informe um preço válido." })
    .finite("Informe um preço válido.")
    .nonnegative("O preço não pode ser negativo.")
    .max(9_999_999_999.99, "O preço informado é muito alto."),
);

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  link: httpUrlSchema,
  image: httpUrlSchema,
  price: priceSchema,
});

export type CreateProductInput = z.output<typeof createProductSchema>;
