import { NextResponse } from "next/server";
import { createLiveKitToken } from "@/lib/livekit";
import { ensureProfile } from "@/lib/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureProfile(user);
  const token = await createLiveKitToken(user.id, profile.username ?? "Sibling");

  return NextResponse.json({ token });
}
