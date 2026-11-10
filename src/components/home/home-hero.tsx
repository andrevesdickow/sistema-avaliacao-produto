import { Star } from "lucide-react";

export function HomeHero() {
  return (
    <section aria-labelledby="home-title" className="max-w-2xl">
      <p className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-primary uppercase">
        <Star
          aria-hidden
          className="size-3.5"
          fill="currentColor"
          strokeWidth={0}
        />
        Comunidade avalia.
      </p>

      <h1
        id="home-title"
        className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl"
      >
        Descubra o que <em>vale a pena</em>.
      </h1>

      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Uma vitrine pública de produtos escolhidos e avaliados por quem
        realmente testou. Explore e encontre sua próxima escolha com mais
        confiança.
      </p>
    </section>
  );
}
