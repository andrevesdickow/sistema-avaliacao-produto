export function ProductDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando produto e avaliações...</span>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <div className="h-4 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-5 aspect-[4/3] animate-pulse rounded-2xl border border-white/10 bg-muted motion-reduce:animate-none" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-3 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-2 h-20 w-full animate-pulse rounded-xl border border-white/10 bg-muted/60 motion-reduce:animate-none" />
          <div className="h-11 w-44 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="h-7 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-6 space-y-6">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-3.5">
                <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-muted/40 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
