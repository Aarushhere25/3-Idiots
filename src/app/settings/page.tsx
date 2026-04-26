import { ProfileForm } from "@/components/profile-form";
import { ensureProfile } from "@/lib/profile";
import { SiteShell } from "@/components/site-shell";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const profile = await ensureProfile(user!);

  return (
    <SiteShell active="settings">
      <ProfileForm profile={profile} />
    </SiteShell>
  );
}
