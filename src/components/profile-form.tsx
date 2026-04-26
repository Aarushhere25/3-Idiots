"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, LogOut } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { MEDIA_BUCKET } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/types/database";

type ProfileFormProps = {
  profile: ProfileRow;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const supabase = getSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveProfile() {
    setFeedback(null);
    startTransition(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id);

      setFeedback(error ? error.message : "Profile updated.");
    });
  }

  function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const path = `${profile.id}/avatar-${crypto.randomUUID()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: true });

      if (error) {
        setFeedback(error.message);
        return;
      }

      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      setFeedback("Avatar uploaded. Save to keep it.");
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-center">
        <h1 className="font-display text-5xl font-black">Profile & Settings</h1>
        <p className="mt-3 text-2xl text-ink/75">Make this chaotic space yours ✨</p>
      </div>
      <div className="mx-auto mt-12 max-w-4xl rounded-[2.5rem] border border-white/60 bg-white/80 p-8 shadow-glow backdrop-blur-xl md:p-12">
        <div className="relative mx-auto mb-12 w-fit">
          <Avatar src={avatarUrl} name={username} size="lg" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 grid h-14 w-14 place-items-center rounded-full bg-white shadow-glow"
          >
            <Camera className="h-5 w-5 text-ink/75" />
          </button>
          <input ref={fileInputRef} hidden type="file" accept="image/*" onChange={uploadAvatar} />
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-3 block text-lg font-semibold text-ink/80">Nickname</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-full border border-white/70 bg-white px-8 py-5 text-3xl font-bold text-ink outline-none"
            />
          </label>
          <button
            type="button"
            onClick={saveProfile}
            disabled={isPending}
            className="rounded-full border border-white/80 bg-white px-10 py-5 text-2xl font-bold text-ink shadow-sm transition hover:scale-[1.02]"
          >
            {isPending ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : "Save"}
          </button>
        </div>

        {feedback ? <p className="mt-4 text-base font-semibold text-ink/65">{feedback}</p> : null}

        <div className="mt-10 border-t border-slate-100 pt-8">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
