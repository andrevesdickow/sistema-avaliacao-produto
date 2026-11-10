"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Imagem de produto com fallback visual. Usa `<img>` (em vez de `next/image`)
 * porque as URLs vêm de lojas externas arbitrárias e não há `remotePatterns`
 * configurado; o fallback evita cards quebrados quando a imagem falha.
 */
export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    const initial = alt.trim().charAt(0).toUpperCase() || "?";

    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex size-full items-center justify-center bg-muted",
          className,
        )}
      >
        <span
          aria-hidden
          className="font-display text-4xl text-muted-foreground"
        >
          {initial}
        </span>
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: imagens externas de domínios arbitrários
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={cn("size-full object-cover", className)}
    />
  );
}
