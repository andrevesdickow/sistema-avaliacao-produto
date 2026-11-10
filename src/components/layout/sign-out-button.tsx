"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasError, setHasError] = useState(false);

  const handleSignOut = () => {
    setHasError(false);

    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/sign-out", {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Falha ao sair: ${response.status}`);
        }

        router.refresh();
      } catch (error) {
        console.error("[auth] Não foi possível encerrar a sessão", error);
        setHasError(true);
      }
    });
  };

  return (
    <>
      {hasError ? (
        <span
          role="alert"
          className="hidden text-xs text-destructive sm:inline"
        >
          Não foi possível sair.
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="h-10 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground sm:px-3"
        onClick={handleSignOut}
        disabled={isPending}
        aria-label="Sair da conta"
      >
        <LogOut aria-hidden className="size-4" />
        <span className="hidden sm:inline">
          {isPending ? "Saindo..." : "Sair"}
        </span>
      </Button>
    </>
  );
}
