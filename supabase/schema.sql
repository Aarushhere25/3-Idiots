create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  content text not null default '',
  type text not null default 'text' check (type in ('text', 'image', 'video', 'file')),
  file_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_url text not null,
  file_type text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.typing_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  username text not null,
  started_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.message_reads (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (message_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'Idiot')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.typing_status enable row level security;
alter table public.message_reads enable row level security;

create policy "authenticated profiles read"
on public.profiles for select
to authenticated
using (true);

create policy "authenticated profiles update self"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "authenticated profiles insert self"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "authenticated users can read messages"
on public.messages for select
to authenticated
using (true);

create policy "authenticated users can insert messages"
on public.messages for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "authenticated users can read attachments"
on public.attachments for select
to authenticated
using (true);

create policy "authenticated users can insert attachments"
on public.attachments for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "authenticated users can read typing"
on public.typing_status for select
to authenticated
using (true);

create policy "authenticated users manage their typing row"
on public.typing_status for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "authenticated users can read reads"
on public.message_reads for select
to authenticated
using (true);

create policy "authenticated users can insert own reads"
on public.message_reads for insert
to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute procedure public.update_updated_at_column();

insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

create policy "authenticated media select"
on storage.objects for select
to authenticated
using (bucket_id = 'chat-media');

create policy "authenticated media insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "authenticated media update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'chat-media'
  and owner = (select auth.uid())
);

create policy "authenticated media delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and owner = (select auth.uid())
);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.typing_status;
