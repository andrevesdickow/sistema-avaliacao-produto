"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchProductSummary } from "@/lib/api/product-summary";

type ProductAiSummaryProps = {
  productId: string;
  feedbackCount: number;
};

export function ProductAiSummary({
  productId,
  feedbackCount,
}: ProductAiSummaryProps) {
  const [mounted, setMounted] = useState(false);

  // A consulta usa `Date.now()` internamente; só montamos no cliente para não
  // quebrar o prerender do shell com `cacheComponents`.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (feedbackCount === 0) {
    return null;
  }

  if (!mounted) {
    return <ProductAiSummarySkeleton />;
  }

  return (
    <ProductAiSummaryContent
      productId={productId}
      feedbackCount={feedbackCount}
    />
  );
}

function ProductAiSummaryContent({
  productId,
  feedbackCount,
}: ProductAiSummaryProps) {
  const { data, status, error, refetch, isFetching } = useQuery({
    // A contagem entra na chave para regenerar o resumo após uma nova avaliação.
    queryKey: ["product-summary", productId, feedbackCount],
    queryFn: ({ signal }) => fetchProductSummary(productId, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  if (status === "pending") {
    return <ProductAiSummarySkeleton />;
  }

  if (status === "error") {
    return (
      <section
        aria-labelledby="ai-summary-heading"
        className="rounded-2xl border border-primary/20 bg-card/50 px-5 py-4 sm:px-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles aria-hidden className="size-4 text-primary/80" />
            <h2 id="ai-summary-heading" className="font-medium text-foreground">
              Resumo por IA indisponível
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              aria-hidden
              className={
                isFetching ? "animate-spin motion-reduce:animate-none" : ""
              }
            />
            Tentar novamente
          </Button>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Não foi possível gerar o resumo agora."}
        </p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section
      aria-labelledby="ai-summary-heading"
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-linear-to-br from-primary/12 via-card/80 to-card/40 p-5 sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 size-48 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.16em] text-primary uppercase">
          <Sparkles aria-hidden className="size-3.5" />
          Resumo por IA
        </span>

        <h2 id="ai-summary-heading" className="sr-only">
          Resumo gerado por IA das avaliações
        </h2>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-pretty text-foreground/90">
          {data.summary}
        </p>

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>
            Gerado a partir de {data.feedbackCount}{" "}
            {data.feedbackCount === 1 ? "avaliação" : "avaliações"}.
          </span>
          <span aria-hidden>·</span>
          <span>Resumo automático: pode conter imprecisões.</span>
        </p>
      </div>
    </section>
  );
}

function ProductAiSummarySkeleton() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card/70 to-card/40 p-5 sm:p-6"
    >
      <span className="sr-only">Gerando resumo por IA das avaliações...</span>
      <div className="h-6 w-36 animate-pulse rounded-full bg-primary/15 motion-reduce:animate-none" />
      <div className="mt-4 space-y-2.5">
        <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>
      <div className="mt-4 h-3 w-56 animate-pulse rounded bg-muted/70 motion-reduce:animate-none" />
    </section>
  );
}
