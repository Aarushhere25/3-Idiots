import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { VideoCallShell } from "@/components/video-call-shell";

export default function CallPage() {
  return (
    <SiteShell active="chat">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-black">Family Call Room</h1>
            <p className="mt-2 text-lg text-ink/70">Join, mute, turn video on or off, and yell lovingly across devices.</p>
          </div>
          <Link href="/chat" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-ink shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Link>
        </div>
        <VideoCallShell tokenEndpoint="/api/livekit/token" livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!} />
      </div>
    </SiteShell>
  );
}
