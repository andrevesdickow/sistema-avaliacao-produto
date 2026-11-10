const MAX_SKELETON_ITEMS = 8;

type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  const items = Array.from(
    { length: Math.min(count, MAX_SKELETON_ITEMS) },
    (_, position) => `skeleton-${position}`,
  );

  return (
    <output className="block">
      <span className="sr-only">Carregando produtos…</span>

      <ul
        aria-hidden
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((key) => (
          <li
            key={key}
            className="overflow-hidden rounded-xl border border-border bg-card/40"
          >
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </output>
  );
}
