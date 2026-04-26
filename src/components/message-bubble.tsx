import Link from "next/link";
import { Download } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { cn, formatTime } from "@/lib/utils";
import type { MessageRow } from "@/types/database";

type MessageBubbleProps = {
  message: MessageRow;
  isOwnMessage: boolean;
};

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div className={cn("flex max-w-3xl gap-3", isOwnMessage && "ml-auto flex-row-reverse")}>
      <Avatar src={message.avatar_url} name={message.username} size="sm" />
      <div className={cn("space-y-2", isOwnMessage && "items-end text-right")}>
        <p className="text-sm font-semibold text-ink/60">{isOwnMessage ? "You" : message.username}</p>
        <div
          className={cn(
            "rounded-[1.75rem] px-5 py-4 text-base text-ink shadow-bubble",
            isOwnMessage ? "rounded-tr-md bg-candy/90" : "rounded-tl-md bg-white/90"
          )}
        >
          {message.type === "image" && message.file_url ? (
            <img src={message.file_url} alt={message.content || "Shared image"} className="mb-3 max-h-72 rounded-3xl object-cover" />
          ) : null}
          {message.type === "video" && message.file_url ? (
            <video controls className="mb-3 max-h-72 rounded-3xl">
              <source src={message.file_url} />
            </video>
          ) : null}
          {message.type === "file" && message.file_url ? (
            <Link
              href={message.file_url}
              target="_blank"
              className="mb-3 flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-ink"
            >
              <Download className="h-4 w-4" />
              Download attachment
            </Link>
          ) : null}
          {message.content ? <p className="whitespace-pre-wrap break-words">{message.content}</p> : null}
        </div>
        <p className="px-2 text-sm font-semibold text-slate-400">{formatTime(message.created_at)}</p>
      </div>
    </div>
  );
}
