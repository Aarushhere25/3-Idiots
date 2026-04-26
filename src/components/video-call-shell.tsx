"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { RoomAudioRenderer } from "@livekit/components-react";
import { DisconnectReason, Room, RoomEvent, Track, type LocalVideoTrack, type RemoteVideoTrack } from "livekit-client";

type VideoCallShellProps = {
  tokenEndpoint: string;
  livekitUrl: string;
};

type PublishedVideo = {
  id: string;
  label: string;
  track: LocalVideoTrack | RemoteVideoTrack;
};

function AttachedVideoTile({ tile }: { tile: PublishedVideo }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    tile.track.attach(element);

    return () => {
      tile.track.detach(element);
    };
  }, [tile.track]);

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950">
      <video ref={videoRef} autoPlay playsInline muted={tile.track.source === Track.Source.Camera && tile.label === "You"} className="h-full min-h-[26rem] w-full object-cover" />
      <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-sm font-semibold text-white">{tile.label}</div>
    </div>
  );
}

export function VideoCallShell({ tokenEndpoint, livekitUrl }: VideoCallShellProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [hasTriedToJoin, setHasTriedToJoin] = useState(false);
  const [roomVersion, setRoomVersion] = useState(0);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const room = useMemo(() => new Room(), []);

  useEffect(() => {
    async function getToken() {
      const response = await fetch(tokenEndpoint);

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: "Could not create call token." }))) as { error?: string };
        setError(payload.error ?? "Could not create call token.");
        return;
      }

      const payload = (await response.json()) as { token: string };
      setToken(payload.token);
    }

    void getToken().catch((tokenError) => {
      setError(tokenError instanceof Error ? tokenError.message : "Could not create call token.");
    });
  }, [tokenEndpoint]);

  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  useEffect(() => {
    const sync = () => setRoomVersion((current) => current + 1);
    const disconnected = (reason?: DisconnectReason) => {
      setIsJoined(false);
      if (hasTriedToJoin && reason !== undefined && reason !== DisconnectReason.CLIENT_INITIATED) {
        setError(`Call disconnected: ${String(reason)}`);
      }
      setRoomVersion((current) => current + 1);
    };

    room
      .on(RoomEvent.Connected, sync)
      .on(RoomEvent.ParticipantConnected, sync)
      .on(RoomEvent.ParticipantDisconnected, sync)
      .on(RoomEvent.TrackSubscribed, sync)
      .on(RoomEvent.TrackUnsubscribed, sync)
      .on(RoomEvent.LocalTrackPublished, sync)
      .on(RoomEvent.LocalTrackUnpublished, sync)
      .on(RoomEvent.TrackMuted, sync)
      .on(RoomEvent.TrackUnmuted, sync)
      .on(RoomEvent.Disconnected, disconnected);

    return () => {
      room
        .off(RoomEvent.Connected, sync)
        .off(RoomEvent.ParticipantConnected, sync)
        .off(RoomEvent.ParticipantDisconnected, sync)
        .off(RoomEvent.TrackSubscribed, sync)
        .off(RoomEvent.TrackUnsubscribed, sync)
        .off(RoomEvent.LocalTrackPublished, sync)
        .off(RoomEvent.LocalTrackUnpublished, sync)
        .off(RoomEvent.TrackMuted, sync)
        .off(RoomEvent.TrackUnmuted, sync)
        .off(RoomEvent.Disconnected, disconnected);
      void room.disconnect();
    };
  }, [hasTriedToJoin, room]);

  useEffect(() => {
    return () => {
      previewStream?.getTracks().forEach((track) => track.stop());
    };
  }, [previewStream]);

  async function enablePreview() {
    setError(null);
    setIsRequestingMedia(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setPreviewStream((current) => {
        current?.getTracks().forEach((track) => track.stop());
        return stream;
      });
    } catch (mediaError) {
      setError(
        mediaError instanceof Error
          ? `Camera or microphone access failed: ${mediaError.message}`
          : "Camera or microphone access failed."
      );
    } finally {
      setIsRequestingMedia(false);
    }
  }

  async function joinCall() {
    if (!token) {
      setError("Call token is not ready yet.");
      return;
    }

    setError(null);
    setIsJoining(true);
    setHasTriedToJoin(true);

    const videoDeviceId = previewStream?.getVideoTracks()[0]?.getSettings().deviceId;
    const audioDeviceId = previewStream?.getAudioTracks()[0]?.getSettings().deviceId;

    try {
      await room.prepareConnection(livekitUrl, token).catch(() => undefined);
      await room.connect(livekitUrl, token);
      await room.localParticipant.setCameraEnabled(true, videoDeviceId ? { deviceId: { exact: videoDeviceId } } : undefined);
      await room.localParticipant.setMicrophoneEnabled(true, audioDeviceId ? { deviceId: { exact: audioDeviceId } } : undefined);
      if (!room.canPlaybackVideo) {
        await room.startVideo().catch(() => undefined);
      }
      if (!room.canPlaybackAudio) {
        await room.startAudio().catch(() => undefined);
      }

      previewStream?.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
      setIsJoined(true);
      setRoomVersion((current) => current + 1);
    } catch (joinError) {
      setError(joinError instanceof Error ? `Could not join family call: ${joinError.message}` : "Could not join family call.");
    } finally {
      setIsJoining(false);
    }
  }

  async function leaveCall() {
    setHasTriedToJoin(false);
    await room.disconnect();
    setIsJoined(false);
    setRoomVersion((current) => current + 1);
  }

  async function toggleCamera() {
    const enabled = Boolean((room.localParticipant as unknown as { isCameraEnabled?: boolean }).isCameraEnabled);
    try {
      setError(null);
      await room.localParticipant.setCameraEnabled(!enabled);
      setRoomVersion((current) => current + 1);
    } catch (cameraError) {
      setError(cameraError instanceof Error ? `Could not change camera state: ${cameraError.message}` : "Could not change camera state.");
    }
  }

  async function toggleMicrophone() {
    const enabled = Boolean((room.localParticipant as unknown as { isMicrophoneEnabled?: boolean }).isMicrophoneEnabled);
    try {
      setError(null);
      await room.localParticipant.setMicrophoneEnabled(!enabled);
      setRoomVersion((current) => current + 1);
    } catch (microphoneError) {
      setError(
        microphoneError instanceof Error
          ? `Could not change microphone state: ${microphoneError.message}`
          : "Could not change microphone state."
      );
    }
  }

  const localVideoEnabled = Boolean((room.localParticipant as unknown as { isCameraEnabled?: boolean }).isCameraEnabled);
  const localAudioEnabled = Boolean((room.localParticipant as unknown as { isMicrophoneEnabled?: boolean }).isMicrophoneEnabled);

  const publishedVideos = useMemo<PublishedVideo[]>(() => {
    void roomVersion;

    const tiles: PublishedVideo[] = [];

    room.localParticipant.videoTrackPublications.forEach((publication) => {
      if (publication.track && publication.track.source === Track.Source.Camera) {
        tiles.push({
          id: publication.trackSid,
          label: "You",
          track: publication.track as LocalVideoTrack
        });
      }
    });

    room.remoteParticipants.forEach((participant) => {
      participant.videoTrackPublications.forEach((publication) => {
        if (publication.track && publication.track.source === Track.Source.Camera) {
          tiles.push({
            id: publication.trackSid,
            label: participant.name || participant.identity,
            track: publication.track as RemoteVideoTrack
          });
        }
      });
    });

    return tiles;
  }, [room, roomVersion]);

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center rounded-[2rem] border border-rose-200 bg-white/80 p-8 text-center text-ink shadow-glow">
        <div className="max-w-lg space-y-3">
          <p className="text-2xl font-bold text-rose-600">Video call could not start</p>
          <p className="text-base text-ink/70">{error}</p>
          <p className="text-sm text-ink/60">If this keeps happening, try using two different accounts in the two browsers and restart the dev server.</p>
        </div>
      </div>
    );
  }

  if (!previewStream && !isJoined && !hasTriedToJoin) {
    return (
      <div className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-glow">
        <div className="grid min-h-[60vh] place-items-center rounded-[1.5rem] border border-white/60 bg-white/60 p-8 text-center">
          <div className="max-w-xl space-y-4">
            <p className="text-4xl font-black text-ink">Turn on your camera first</p>
            <p className="text-lg text-ink/70">
              The browser only shows the permission prompt after a direct click. Start by enabling camera and microphone,
              then we will show your self-preview before joining the family room.
            </p>
            <button
              type="button"
              onClick={() => void enablePreview()}
              disabled={isRequestingMedia}
              className="rounded-full bg-ink px-8 py-4 text-lg font-bold text-white transition hover:scale-[1.02] disabled:opacity-70"
            >
              {isRequestingMedia ? "Requesting access..." : "Enable camera & mic"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (previewStream && !isJoined && !hasTriedToJoin) {
    return (
      <div className="rounded-[2rem] border border-white/60 bg-white/70 p-4 shadow-glow">
        <div className="flex min-h-[72vh] flex-col gap-4 rounded-[1.5rem] bg-ink p-4">
          <div className="grid flex-1 place-items-center overflow-hidden rounded-[1.25rem] bg-slate-950">
            <video ref={previewVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-full bg-white/90 px-4 py-4">
            <button
              type="button"
              onClick={() => void enablePreview()}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-ink"
            >
              Refresh preview
            </button>
            <button
              type="button"
              onClick={() => void joinCall()}
              disabled={isJoining || !token}
              className="rounded-full bg-ink px-6 py-3 font-bold text-white disabled:opacity-70"
            >
              {isJoining ? "Joining..." : token ? "Join family call" : "Preparing room..."}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/60 bg-white/70 p-4 shadow-glow">
      <div className="flex min-h-[72vh] flex-col gap-4 rounded-[1.5rem] bg-ink p-4">
        <div className="flex-1">
          {publishedVideos.length ? (
            <div className="grid h-full min-h-[26rem] gap-4 md:grid-cols-2">
              {publishedVideos.map((tile) => (
                <AttachedVideoTile key={tile.id} tile={tile} />
              ))}
            </div>
          ) : (
            <div className="grid h-full min-h-[26rem] place-items-center rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center text-white">
              <div className="max-w-md space-y-3">
                <p className="text-2xl font-bold">Camera view is waiting to appear</p>
                <p className="text-sm text-white/70">The room connected, but no published camera tracks are visible yet.</p>
                <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-left text-sm text-white/75">
                  <p>Video enabled: {localVideoEnabled ? "yes" : "no"}</p>
                  <p>Audio enabled: {localAudioEnabled ? "yes" : "no"}</p>
                  <p>Remote participants: {room.remoteParticipants.size}</p>
                  <p>Local video publications: {room.localParticipant.videoTrackPublications.size}</p>
                  <p>Local audio publications: {room.localParticipant.audioTrackPublications.size}</p>
                  <p>Rendered tracks: {publishedVideos.length}</p>
                </div>
              </div>
            </div>
          )}
          <RoomAudioRenderer room={room} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-full bg-white/90 px-4 py-4">
          <button
            type="button"
            onClick={() => void toggleMicrophone()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-ink"
          >
            {localAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            {localAudioEnabled ? "Mute" : "Unmute"}
          </button>
          <button
            type="button"
            onClick={() => void toggleCamera()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-ink"
          >
            {localVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            {localVideoEnabled ? "Camera off" : "Camera on"}
          </button>
          <button
            type="button"
            onClick={() => void leaveCall()}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-bold text-white"
          >
            <PhoneOff className="h-5 w-5" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
