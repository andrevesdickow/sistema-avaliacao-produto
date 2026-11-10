import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/products/product-image";
import type { Product } from "@/server/products/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/60 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/20 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link
        href={`/products/${product.id}`}
        tabIndex={-1}
        aria-hidden
        className="block aspect-[4/3] overflow-hidden bg-muted"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          className="transition duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-display text-lg leading-snug tracking-tight">
          <Link
            href={`/products/${product.id}`}
            className={`rounded-sm transition-colors hover:text-primary ${focusRing}`}
          >
            {product.name}
          </Link>
        </h2>

        {product.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <a
            href={product.externalLink}
            target="_blank"
            rel="noreferrer noopener"
            className={`inline-flex items-center gap-1.5 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-primary ${focusRing}`}
          >
            Ver na loja
            <ExternalLink aria-hidden className="size-3.5" />
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </div>
    </article>
  );
}
