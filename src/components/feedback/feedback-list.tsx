import { Star } from "lucide-react";

import { FeedbackCard } from "@/components/feedback/feedback-card";
import type { FeedbackWithAuthor } from "@/server/feedback/types";

export function FeedbackList({
  feedbacks,
}: {
  feedbacks: FeedbackWithAuthor[];
}) {
  const count = feedbacks.length;

  return (
    <section aria-labelledby="feedbacks-heading" className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
        <h2
          id="feedbacks-heading"
          className="font-display text-2xl tracking-tight"
        >
          Avaliações
        </h2>
        <p className="text-sm text-muted-foreground">
          {count === 0
            ? "Nenhuma avaliação ainda"
            : `${count} ${count === 1 ? "avaliação" : "avaliações"}`}
        </p>
      </div>

      {count === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
          <Star
            aria-hidden
            className="mx-auto size-6 text-primary/70"
            fill="currentColor"
            strokeWidth={0}
          />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Ainda não há avaliações. Seja a primeira pessoa a avaliar.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10">
          {feedbacks.map((feedback) => (
            <li key={feedback.id} className="py-5 first:pt-5 last:pb-0">
              <FeedbackCard feedback={feedback} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
