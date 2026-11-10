import { BadgeCheck, Sparkles, Star, Users } from "lucide-react";
import type { ReactNode } from "react";

import { Brand } from "@/components/brand";

type AuthShellVariant = "sign-up" | "sign-in";

const shellCopy: Record<
  AuthShellVariant,
  { title: ReactNode; description: string }
> = {
  "sign-up": {
    title: (
      <>
        Opiniões reais.
        <br />
        <em>Escolhas melhores.</em>
      </>
    ),
    description:
      "Crie sua conta para avaliar produtos que você já usou e ajudar outras pessoas a escolherem com mais confiança.",
  },
  "sign-in": {
    title: (
      <>
        Bom te ver
        <br />
        <em>de novo.</em>
      </>
    ),
    description:
      "Entre para voltar às suas avaliações e ajudar outras pessoas a escolherem com mais confiança.",
  },
};

const highlights = [
  {
    icon: BadgeCheck,
    title: "Avaliações verificadas",
    description: "Opiniões de pessoas reais sobre produtos reais.",
  },
  {
    icon: Sparkles,
    title: "Descobertas sob medida",
    description: "Recomendações que fazem sentido para você.",
  },
  {
    icon: Users,
    title: "Comunidade engajada",
    description: "Compartilhe experiências e ajude outras pessoas.",
  },
];

const ratingKeys = ["one", "two", "three", "four", "five"];

function RatingLine() {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-5">
      <div aria-hidden className="flex items-center gap-0.5 text-primary">
        {ratingKeys.map((key) => (
          <Star
            key={key}
            className="size-3.5"
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Cada avaliação ajuda alguém a escolher melhor.
      </p>
    </div>
  );
}

export function AuthShell({
  children,
  variant = "sign-up",
}: {
  children: ReactNode;
  variant?: AuthShellVariant;
}) {
  const copy = shellCopy[variant];

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="hidden flex-col justify-between gap-12 px-10 py-12 lg:flex xl:px-16">
          <Brand />

          <div className="max-w-xl">
            <p className="font-display text-5xl leading-[1.05] tracking-tight text-balance xl:text-6xl">
              {copy.title}
            </p>

            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              {copy.description}
            </p>

            <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {highlights.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 py-4 first:pt-4 last:pb-4"
                >
                  <Icon
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <RatingLine />
        </aside>

        <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8 lg:border-l lg:border-white/[0.07] lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Brand />
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
