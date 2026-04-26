# 3 Idiots

3 Idiots is a private sibling group chat built with Next.js, Tailwind CSS, Supabase, Supabase Realtime, Supabase Storage, and LiveKit for group calling.

## Features

- Single shared group room for all authenticated users
- Email/password auth with Supabase Auth
- Realtime messages with avatars, usernames, timestamps, and smooth auto-scroll
- Media sharing for images, videos, and generic files
- Typing indicator and simple read tracking persistence
- Cozy pastel UI inspired by the provided mockups
- Profile and avatar editing
- Group video calling with LiveKit

## Stack

- Frontend: Next.js App Router
- Styling: Tailwind CSS
- Backend: Supabase Auth, Postgres, Storage, Realtime
- Calling: LiveKit WebRTC

## 1. Create Supabase Project

1. Create a new Supabase project.
2. In the SQL editor, run [supabase/schema.sql](/C:/Users/HP/3%20Idiots/supabase/schema.sql).
3. In `Database -> Replication`, make sure `messages` and `typing_status` are enabled for realtime if your project UI requires it.
4. In `Authentication -> Providers`, keep Email enabled.

## 2. Create LiveKit Project

1. Create a LiveKit Cloud project or self-host a LiveKit server.
2. Copy the server URL, API key, and API secret.
3. The app uses one shared room: `family-room`.

## 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

## 4. Install And Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 5. Production Notes

- Only authenticated users can access `/chat`, `/settings`, `/call`.
- RLS policies restrict Postgres and Storage access to authenticated users.
- Uploaded files are stored in the `chat-media` bucket under a folder keyed by the uploader's auth user id.
- Messages snapshot the sender name and avatar so the timeline remains stable even if profiles change later.

## Folder Structure

```text
src/
  app/
  components/
  hooks/
  lib/
  types/
supabase/
  schema.sql
```

## Useful Customization

- Change colors in [tailwind.config.ts](/C:/Users/HP/3%20Idiots/tailwind.config.ts)
- Update the room id in [src/lib/constants.ts](/C:/Users/HP/3%20Idiots/src/lib/constants.ts)
- Add reactions or richer seen states by extending `message_reads` and adding a `message_reactions` table
