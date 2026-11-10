import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "@/components/brand";

const linkClassName =
  "rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <Link href="/auth/sign-up" className={linkClassName}>
            Criar conta
          </Link>
        </header>

        <div className="flex-1 py-16">{children}</div>

        <footer className="flex items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-muted-foreground">
          <p>avalia.</p>
          <Link href="/" className={linkClassName}>
            Voltar ao início
          </Link>
        </footer>
      </div>
    </main>
  );
}
