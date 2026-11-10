"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RatingStars } from "@/components/feedback/rating-stars";
import { Button } from "@/components/ui/button";
import type { Product } from "@/server/products/types";

type ProductHeroProps = {
  product: Product;
  averageScore: number | null;
  feedbackCount: number;
};

function formatAverage(score: number): string {
  return score.toFixed(1).replace(".", ",");
}

function pluralize(count: number): string {
  return count === 1 ? "avaliação" : "avaliações";
}

export function ProductHero({
  product,
  averageScore,
  feedbackCount,
}: ProductHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = product.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para produtos
        </Link>

        <div className="mt-5 aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-muted/40">
          {imageFailed ? (
            <div className="grid h-full w-full place-items-center">
              <span
                aria-hidden
                className="font-display text-7xl text-primary/60"
              >
                {initial}
              </span>
              <span className="sr-only">Imagem de {product.name}</span>
            </div>
          ) : (
            // biome-ignore lint/performance/noImgElement: imagens externas de domínios desconhecidos, sem remotePatterns
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Produto
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
          {product.name}
        </h1>

        {product.description ? (
          <p className="mt-4 max-w-prose whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border border-white/10 bg-card/60 p-4">
          {averageScore !== null && feedbackCount > 0 ? (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <RatingStars
                value={averageScore}
                label={`Nota média ${formatAverage(averageScore)} de 5`}
              />
              <span className="text-sm font-medium">
                {formatAverage(averageScore)}
              </span>
              <span className="text-sm text-muted-foreground">
                · {feedbackCount} {pluralize(feedbackCount)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este produto ainda não recebeu avaliações.
            </p>
          )}
        </div>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="mt-6 h-11 w-fit px-4"
        >
          <a
            href={product.externalLink}
            target="_blank"
            rel="noreferrer noopener"
          >
            Ver site do produto
            <ExternalLink aria-hidden className="size-4" />
          </a>
        </Button>
      </div>
    </section>
  );
}
