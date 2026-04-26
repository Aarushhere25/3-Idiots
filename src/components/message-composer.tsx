"use client";

import { useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Paperclip, SendHorizonal, SmilePlus } from "lucide-react";
import { MAX_UPLOAD_SIZE_MB, MEDIA_BUCKET } from "@/lib/constants";
import { getAttachmentType } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MessageRow, ProfileRow } from "@/types/database";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type MessageComposerProps = {
  profile: ProfileRow;
  onMessageSent: (message: MessageRow) => void;
};

export function MessageComposer({ profile, onMessageSent }: MessageComposerProps) {
  const supabase = getSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function upsertTyping(isTyping: boolean) {
    if (isTyping) {
      await supabase.from("typing_status").upsert({
        user_id: profile.id,
        username: profile.username
      });
      return;
    }

    await supabase.from("typing_status").delete().eq("user_id", profile.id);
  }

  async function createMessage(payload: Partial<MessageRow> & Pick<MessageRow, "content" | "type">) {
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        user_id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        content: payload.content,
        type: payload.type,
        file_url: payload.file_url ?? null
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    onMessageSent(data);
    await upsertTyping(false);
    setContent("");
  }

  function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createMessage({ content: trimmed, type: "text" });
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : "Could not send message.");
      }
    });
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setError(`Files must be under ${MAX_UPLOAD_SIZE_MB}MB.`);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const path = `${profile.id}/${crypto.randomUUID()}.${fileExt}`;
    const type = getAttachmentType(file);

    setError(null);
    startTransition(async () => {
      const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

      await supabase.from("attachments").insert({
        user_id: profile.id,
        file_url: publicUrlData.publicUrl,
        file_type: type
      });

      try {
        await createMessage({
          content: type === "file" ? file.name : "",
          file_url: publicUrlData.publicUrl,
          type
        });
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : "Could not upload attachment.");
      }
    });
  }

  return (
    <div className="relative rounded-[2rem] border border-white/60 bg-white/90 p-4 shadow-glow">
      {showEmojiPicker ? (
        <div className="absolute bottom-24 left-4 z-20">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setContent((current) => `${current}${emojiData.emoji}`);
              setShowEmojiPicker(false);
            }}
          />
        </div>
      ) : null}

      <form className="flex items-center gap-3" onSubmit={handleSend}>
        <button
          type="button"
          onClick={() => setShowEmojiPicker((current) => !current)}
          className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:scale-105"
        >
          <SmilePlus className="h-6 w-6" />
        </button>
        <div className="flex-1 rounded-full border border-slate-200 bg-white px-6 py-4">
          <input
            value={content}
            onChange={(event) => {
              const value = event.target.value;
              setContent(value);
              void upsertTyping(value.trim().length > 0);
            }}
            placeholder="Say something nice... or not 😈"
            className="w-full bg-transparent text-base text-ink outline-none placeholder:text-slate-400"
          />
        </div>
        <input ref={fileInputRef} hidden type="file" onChange={handleFileSelected} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:scale-105"
        >
          <Paperclip className="h-6 w-6" />
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white transition hover:scale-105 disabled:opacity-70"
        >
          <SendHorizonal className="h-6 w-6" />
        </button>
      </form>
      {error ? <p className="mt-3 px-2 text-sm font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}
