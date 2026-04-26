import Link from "next/link";
import { Bell, Heart, MessageCircleMore, Settings2, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  active: "chat" | "settings";
  children: React.ReactNode;
};

export function SiteShell({ active, children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-dreamy text-ink">
      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="flex items-center gap-3">
              <span className="font-display text-3xl font-black tracking-tight">{APP_NAME}</span>
              <span className="text-3xl">🤪</span>
            </Link>
            <div className="hidden items-center gap-4 text-ink/80 md:flex">
              <Sparkles className="h-4 w-4" />
              <Heart className="h-4 w-4 fill-current" />
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/chat"
              className={cn(
                "rounded-full px-5 py-3 text-sm font-semibold transition",
                active === "chat" ? "bg-white text-ink shadow-glow" : "text-ink/65 hover:bg-white/70"
              )}
            >
              <span className="flex items-center gap-2">
                <MessageCircleMore className="h-4 w-4" />
                Chat Dashboard
              </span>
            </Link>
            <Link
              href="/settings"
              className={cn(
                "rounded-full px-5 py-3 text-sm font-semibold transition",
                active === "settings" ? "bg-shell text-ink shadow-glow" : "text-ink/65 hover:bg-white/70"
              )}
            >
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Profile & Settings
              </span>
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-ink/5 bg-white p-3 text-ink/70 shadow-sm transition hover:scale-105">
              <Bell className="h-5 w-5" />
            </button>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm">✨</div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
