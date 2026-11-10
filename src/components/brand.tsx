import { Star } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="avalia. — página inicial"
      className={cn(
        "inline-flex w-fit items-center gap-2.5 rounded-sm text-foreground transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        className,
      )}
    >
      <Star
        aria-hidden
        className="size-5 text-primary"
        fill="currentColor"
        strokeWidth={0}
      />
      <span className="font-display text-2xl leading-none tracking-tight">
        avalia<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
