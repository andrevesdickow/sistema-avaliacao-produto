import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductDetail } from "@/components/feedback/product-detail";
import { ProductDetailSkeleton } from "@/components/feedback/product-detail-skeleton";
import { SiteShell } from "@/components/layout/site-shell";
import { getProduct } from "@/server/products/get-product";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Produto não encontrado" };
  }

  const description =
    product.description?.trim() ||
    `Avaliações e opiniões sobre ${product.name}.`;

  return {
    title: product.name,
    description: description.slice(0, 160),
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <SiteShell>
      <Suspense fallback={<ProductDetailSkeleton />}>
        {params.then(({ id }) => (
          <ProductDetail id={id} />
        ))}
      </Suspense>
    </SiteShell>
  );
}
