import Link from "next/link";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";

import { SignOutButton } from "./sign-out-button";

function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=f2e3c0`;
}

const headerClassName =
  "border-b border-white/10 bg-background/80 backdrop-blur";
const containerClassName =
  "mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8";

export function SiteHeaderSkeleton() {
  return (
    <header className={headerClassName}>
      <div className={containerClassName}>
        <Brand />
        <div
          aria-hidden
          className="h-10 w-32 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
        />
      </div>
    </header>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <header className={headerClassName}>
        <div className={containerClassName}>
          <Brand />
          <nav
            aria-label="Conta"
            className="flex items-center gap-1.5 sm:gap-2"
          >
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-10 px-3 text-muted-foreground hover:text-foreground"
            >
              <Link href="/auth/sign-in">Entrar</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-10 px-3.5 text-sm font-semibold sm:px-4"
            >
              <Link href="/auth/sign-up">Criar conta</Link>
            </Button>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClassName}>
      <div className={containerClassName}>
        <Brand />
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* biome-ignore lint/performance/noImgElement: avatar externo do DiceBear, sem remotePatterns */}
            <img
              src={getAvatarUrl(user.id)}
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-full border border-white/10 bg-muted"
            />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {user.email}
              </span>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
