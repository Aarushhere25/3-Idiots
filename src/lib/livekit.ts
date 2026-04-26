import { AccessToken } from "livekit-server-sdk";
import { GROUP_ROOM_ID } from "@/lib/constants";

export async function createLiveKitToken(identity: string, name: string) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity,
      name,
      ttl: "2h"
    }
  );

  token.addGrant({
    room: GROUP_ROOM_ID,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true
  });

  return await token.toJwt();
}
