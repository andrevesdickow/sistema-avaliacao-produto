/**
 * Formato retornado pelo Supabase (snake_case). Mantido separado do DTO para
 * que a camada de API nunca vaze detalhes do banco para o cliente.
 */
export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image: string;
  price: number;
  score: boolean;
  external_link: string;
  created_at: string;
  updated_at: string;
};

/** Produto no formato consumido pela API e pela UI (camelCase). */
export type Product = {
  id: string;
  name: string;
  description: string | null;
  image: string;
  price: number;
  externalLink: string;
  score: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type ProductList = {
  data: Product[];
  pagination: ProductPagination;
};

export const PRODUCT_COLUMNS =
  "id, name, description, image, price, score, external_link, created_at, updated_at";

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    price: Number(row.price),
    externalLink: row.external_link,
    score: row.score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
