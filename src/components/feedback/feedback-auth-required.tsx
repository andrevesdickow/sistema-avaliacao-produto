import { LockKeyhole, Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FeedbackAuthRequired() {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/70 p-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LockKeyhole aria-hidden className="size-5" />
      </div>

      <h2 className="mt-4 font-display text-2xl leading-tight tracking-tight">
        Entre para avaliar este produto
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Compartilhe sua experiência com quem também está pesquisando. É rápido e
        ajuda outras pessoas a escolherem melhor.
      </p>

      <div
        aria-hidden
        className="mt-5 flex items-center gap-0.5 text-primary/80"
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <Star
            key={rating}
            className="size-4"
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </div>

      <Button asChild size="lg" className="mt-5 h-11 w-full">
        <Link href="/auth/sign-in">Entrar na minha conta</Link>
      </Button>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/auth/sign-up"
          className="rounded-sm text-foreground underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-white/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
