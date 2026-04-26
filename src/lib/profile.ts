import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export async function ensureProfile(user: User): Promise<ProfileRow> {
  const supabase = await getSupabaseServerClient();

  const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackUsername =
    ((user.user_metadata?.username as string | undefined)?.trim() || user.email?.split("@")[0] || "Idiot").slice(0, 40);

  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email ?? null,
      username: fallbackUsername
    })
    .select()
    .single();

  if (error || !createdProfile) {
    throw new Error(error?.message || "Could not create profile for this user.");
  }

  return createdProfile;
}
