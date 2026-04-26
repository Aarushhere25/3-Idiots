import { AuthCard } from "@/components/auth-card";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute left-10 top-10 text-6xl text-ink/55">♥</div>
      <div className="pointer-events-none absolute bottom-20 left-1/4 text-5xl text-ink/40">◌</div>
      <div className="pointer-events-none absolute right-24 top-1/4 text-6xl text-amber-300">★</div>
      <div className="pointer-events-none absolute bottom-10 right-12 text-5xl text-slate-500/60">💬</div>
      <div className="flex min-h-screen items-center justify-center">
        <AuthCard />
      </div>
    </main>
  );
}
