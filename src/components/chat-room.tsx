"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Phone, Video, MoreVertical, LogOut } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { MessageBubble } from "@/components/message-bubble";
import { MessageComposer } from "@/components/message-composer";
import { TypingIndicator } from "@/components/typing-indicator";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDayLabel } from "@/lib/utils";
import type { MessageRow, ProfileRow } from "@/types/database";

type ChatRoomProps = {
  initialMessages: MessageRow[];
  profile: ProfileRow;
  siblingProfiles: ProfileRow[];
};

export function ChatRoom({ initialMessages, profile, siblingProfiles }: ChatRoomProps) {
  const supabase = getSupabaseBrowserClient();
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const endRef = useAutoScroll(messages.length);

  useEffect(() => {
    const messageChannel = supabase
      .channel("room-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((current) => {
          if (current.some((message) => message.id === payload.new.id)) {
            return current;
          }

          return [...current, payload.new as MessageRow];
        });
      })
      .subscribe();

    const typingChannel = supabase
      .channel("room-typing")
      .on("postgres_changes", { event: "*", schema: "public", table: "typing_status" }, async () => {
        const { data } = await supabase.from("typing_status").select("username, user_id");
        setTypingUsers((data ?? []).filter((entry) => entry.user_id !== profile.id).map((entry) => entry.username));
      })
      .subscribe(async () => {
        const { data } = await supabase.from("typing_status").select("username, user_id");
        setTypingUsers((data ?? []).filter((entry) => entry.user_id !== profile.id).map((entry) => entry.username));
      });

    return () => {
      void supabase.removeChannel(messageChannel);
      void supabase.removeChannel(typingChannel);
    };
  }, [profile.id, supabase]);

  useEffect(() => {
    async function markSeen() {
      const unseen = messages.filter((message) => message.user_id !== profile.id);

      if (!unseen.length) return;

      await supabase.from("message_reads").upsert(
        unseen.map((message) => ({
          message_id: message.id,
          user_id: profile.id
        })),
        { onConflict: "message_id,user_id" }
      );
    }

    void markSeen();
  }, [messages, profile.id, supabase]);

  const groupedMessages = useMemo(() => {
    return messages.reduce<Array<{ day: string; messages: MessageRow[] }>>((groups, message) => {
      const day = formatDayLabel(message.created_at);
      const existingGroup = groups.at(-1);

      if (existingGroup && existingGroup.day === day) {
        existingGroup.messages.push(message);
        return groups;
      }

      groups.push({ day, messages: [message] });
      return groups;
    }, []);
  }, [messages]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-92px)] max-w-[98rem] flex-col px-2 py-4 md:px-6">
      <section className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/55 shadow-glow backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/50 bg-white/70 px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {siblingProfiles.slice(0, 4).map((member, index) => (
                <div key={member.id} className={index === 0 ? "" : "-ml-3"}>
                  <Avatar src={member.avatar_url} name={member.username} />
                </div>
              ))}
            </div>
            <div>
              <h1 className="font-display text-3xl font-black">{`3 Idiots`}</h1>
              <p className="text-lg font-semibold text-ink/70">Our Space 💛</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/call" className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:scale-105">
              <Phone className="h-6 w-6" />
            </Link>
            <Link href="/call" className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:scale-105">
              <Video className="h-6 w-6" />
            </Link>
            <button className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:scale-105">
              <MoreVertical className="h-6 w-6" />
            </button>
            <SignOutButton />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-dreamy px-5 py-8 md:px-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-8">
            {groupedMessages.map((group) => (
              <div key={group.day} className="space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-white/85 px-6 py-2 text-sm font-semibold text-slate-500 shadow-sm">{group.day}</div>
                </div>
                {group.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} isOwnMessage={message.user_id === profile.id} />
                ))}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-white/60 bg-white/75 px-5 py-4">
          <div className="mx-auto max-w-5xl">
            <TypingIndicator names={typingUsers} />
            <MessageComposer
              profile={profile}
              onMessageSent={(message) => setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function SignOutButton() {
  const supabase = getSupabaseBrowserClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }}
      className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:scale-105"
      aria-label="Sign out"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}
