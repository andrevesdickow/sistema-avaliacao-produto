import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { cn } from "@/lib/utils";

import { SiteHeader, SiteHeaderSkeleton } from "./site-header";

const footerLinkClassName =
  "rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

export function SiteShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", className)}>
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>avalia. — avaliações que engajam</p>
          <nav aria-label="Informações legais" className="flex gap-5">
            <Link href="/legal/terms" className={footerLinkClassName}>
              Termos de uso
            </Link>
            <Link href="/legal/privacy" className={footerLinkClassName}>
              Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
