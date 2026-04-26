import { ChatRoom } from "@/components/chat-room";
import { SiteShell } from "@/components/site-shell";
import { ensureProfile } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const profile = await ensureProfile(user!);

  const [{ data: messages }, { data: profiles }] = await Promise.all([
    supabase.from("messages").select("*").order("created_at", { ascending: true }),
    supabase.from("profiles").select("*").order("created_at", { ascending: true })
  ]);

  return (
    <SiteShell active="chat">
      <ChatRoom initialMessages={messages ?? []} profile={profile} siblingProfiles={profiles ?? []} />
    </SiteShell>
  );
}
