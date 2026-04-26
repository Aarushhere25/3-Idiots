"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthCard() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitLabel = mode === "sign-in" ? "Join the Chaos" : "Create my chaos pass";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const normalizedName = username.trim() || email.split("@")[0] || "Idiot";

      if (mode === "sign-up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: normalizedName
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email ?? email,
            username: normalizedName
          });
        }

        setMessage("Account created. Check your inbox if email confirmation is enabled, then sign in.");
        setMode("sign-in");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/chat");
      router.refresh();
    });
  }

  return (
    <div className="relative mx-auto w-full max-w-xl rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-glow backdrop-blur-xl md:p-14">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 grid h-32 w-32 place-items-center rounded-[2rem] bg-shell text-6xl shadow-glow">👨‍👩‍👧</div>
        <h1 className="font-display text-5xl font-black tracking-tight text-ink">3 Idiots</h1>
        <p className="mt-3 text-lg font-semibold text-ink/70">Smart enough to be idiots together 💛</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink/75">Nickname</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="The Smart One 🤓"
              className="w-full rounded-full border border-white/70 bg-white px-6 py-4 text-base text-ink outline-none ring-0 placeholder:text-slate-400"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink/75">
            <Mail className="h-4 w-4" />
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="idiot@family.com"
            className="w-full rounded-full border border-white/70 bg-white px-6 py-4 text-base text-ink outline-none ring-0 placeholder:text-slate-400"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink/75">
            <Lock className="h-4 w-4" />
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full rounded-full border border-white/70 bg-white px-6 py-4 text-base text-ink outline-none ring-0 placeholder:text-slate-400"
            required
            minLength={6}
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-ink px-6 py-5 text-lg font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {submitLabel}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
          setMessage(null);
        }}
        className="mt-8 w-full text-center text-base font-semibold text-ink/55 transition hover:text-ink"
      >
        {mode === "sign-in" ? "New idiot? Create an account" : "Already in the gang? Sign in"}
      </button>
    </div>
  );
}
