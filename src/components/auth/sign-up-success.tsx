"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

export function SignUpSuccess() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="text-center">
      <span
        aria-hidden
        className="mx-auto grid size-14 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary"
      >
        <Check className="size-6" strokeWidth={2.5} />
      </span>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 font-display text-4xl leading-tight tracking-tight focus-visible:outline-none"
      >
        Conta criada com sucesso
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Sua conta na <span className="text-foreground">avalia.</span> está
        ativa. Quando as avaliações abrirem, você poderá compartilhar o que já
        usou e ajudar outras pessoas a escolherem melhor.
      </p>

      <Button
        asChild
        size="lg"
        className="mt-8 h-12 w-full rounded-lg text-sm font-semibold"
      >
        <Link href="/">Ir para o início</Link>
      </Button>
    </div>
  );
}
