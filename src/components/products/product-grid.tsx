"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ProductCard } from "@/components/products/product-card";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { Button } from "@/components/ui/button";
import { fetchProducts, PRODUCTS_PAGE_SIZE } from "@/lib/api/products";

export function ProductGrid() {
  const [mounted, setMounted] = useState(false);

  // TanStack Query usa `Date.now()` internamente. Com `cacheComponents`, esse
  // valor é instável durante o prerender do shell. A grade só é montada no
  // cliente; no servidor (e na primeira renderização) exibimos o skeleton.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ProductGridSkeleton />;
  }

  return <ProductGridContent />;
}

function ProductGridContent() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    status,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["products"],
    queryFn: ({ pageParam, signal }) =>
      fetchProducts({ page: pageParam, limit: PRODUCTS_PAGE_SIZE, signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  });

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !hasNextPage || isFetchNextPageError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  if (status === "pending") {
    return <ProductGridSkeleton />;
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-center rounded-xl border border-border bg-card/50 px-6 py-14 text-center"
      >
        <p className="font-display text-2xl">Algo saiu do previsto.</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Não foi possível carregar os produtos agora."}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => void refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const products = data?.pages.flatMap((page) => page.data) ?? [];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-display text-2xl">Ainda não há produtos por aqui.</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          A vitrine está sendo montada. Crie sua conta para participar ou
          cadastre um produto pela API.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/auth/sign-up">Criar minha conta</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.id} className="h-full">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      {isFetchingNextPage ? (
        <div className="mt-5">
          <ProductGridSkeleton count={3} />
        </div>
      ) : null}

      {hasNextPage ? (
        <div className="mt-10 flex flex-col items-center gap-4">
          {isFetchNextPageError ? (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar mais produtos.
            </p>
          ) : null}

          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />

          <Button
            variant="outline"
            className="min-w-40"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                Carregando…
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>

          <output className="sr-only">
            {isFetchingNextPage ? "Carregando mais produtos." : ""}
          </output>
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Você chegou ao fim.
        </p>
      )}
    </div>
  );
}
