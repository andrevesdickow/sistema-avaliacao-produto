import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { io } from "next/cache";

import { RatingStars } from "@/components/feedback/rating-stars";
import type { FeedbackWithAuthor } from "@/server/feedback/types";

function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=f2e3c0`;
}

export async function FeedbackCard({
  feedback,
}: {
  feedback: FeedbackWithAuthor;
}) {
  // O date-fns lê a hora atual (`Date.now()`) para o "há X minutos". Com
  // `cacheComponents`, valores instáveis não podem ser computados durante o
  // prerender do shell: `await io()` suspende o prerender neste ponto e
  // resolve imediatamente em requests reais.
  await io();

  const fullName =
    `${feedback.author.firstName} ${feedback.author.lastName}`.trim() ||
    "Pessoa";
  const relativeDate = formatDistanceToNow(new Date(feedback.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article className="flex gap-3.5 sm:gap-4">
      {/* biome-ignore lint/performance/noImgElement: avatar externo do DiceBear, sem remotePatterns */}
      <img
        src={getAvatarUrl(feedback.author.id)}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        className="size-10 shrink-0 rounded-full border border-white/10 bg-muted"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium">{fullName}</p>
          <time
            dateTime={feedback.createdAt}
            className="text-xs text-muted-foreground"
          >
            {relativeDate}
          </time>
        </div>

        <RatingStars
          value={feedback.score}
          className="mt-1.5"
          label={`Nota ${feedback.score} de 5`}
        />

        <p className="mt-2.5 break-words whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {feedback.comment}
        </p>
      </div>
    </article>
  );
}
