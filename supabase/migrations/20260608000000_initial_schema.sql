-- Lapor FST - Skema utama PostgreSQL/Supabase.
-- Status database memakai 'closed', tetapi UI menampilkan status ini sebagai "Selesai".

begin;

create extension if not exists pgcrypto;

-- =========================
-- ENUM TYPES
-- =========================
do $$
begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('open', 'on_progress', 'closed', 'duplicate');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.media_kind as enum ('image', 'video');
exception when duplicate_object then null;
end $$;

-- =========================
-- TABLES
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 3 and 40),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_\.]+$'),
  constraint profiles_display_name_len check (display_name is null or char_length(display_name) <= 80)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_len check (char_length(name) between 2 and 60),
  constraint categories_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_name_len check (char_length(name) between 2 and 80),
  constraint rooms_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title varchar(100) not null,
  description varchar(1024) not null,
  category_id uuid references public.categories(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  room_other text,
  observation_result varchar(1024),
  expected_result varchar(1024),
  status public.report_status not null default 'open',
  duplicate_of_report_id uuid references public.reports(id) on delete set null,
  reviewed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(room_other, '') || ' ' ||
      coalesce(observation_result, '') || ' ' ||
      coalesce(expected_result, '')
    )
  ) stored,
  constraint reports_title_len check (char_length(title) between 5 and 100),
  constraint reports_description_len check (char_length(description) between 10 and 1024),
  constraint reports_room_other_len check (room_other is null or char_length(room_other) between 2 and 100),
  constraint reports_observation_len check (observation_result is null or char_length(observation_result) <= 1024),
  constraint reports_expected_len check (expected_result is null or char_length(expected_result) <= 1024),
  constraint reports_not_duplicate_self check (duplicate_of_report_id is null or duplicate_of_report_id <> id)
);

create table if not exists public.report_media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  uploader_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  media_type public.media_kind not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  original_filename text,
  created_at timestamptz not null default now(),
  constraint report_media_path_unique unique (storage_bucket, storage_path),
  constraint report_media_storage_path_len check (char_length(storage_path) between 3 and 500),
  constraint report_media_file_size check (
    file_size_bytes > 0 and (
      (media_type = 'image' and file_size_bytes <= 33554432) or
      (media_type = 'video' and file_size_bytes <= 536870912)
    )
  ),
  constraint report_media_bucket_match check (
    (media_type = 'image' and storage_bucket = 'report-images') or
    (media_type = 'video' and storage_bucket = 'report-videos')
  )
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body varchar(1024) not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_body_len check (char_length(body) between 1 and 1024)
);

create table if not exists public.comment_media (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  uploader_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  media_type public.media_kind not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  original_filename text,
  created_at timestamptz not null default now(),
  constraint comment_media_path_unique unique (storage_bucket, storage_path),
  constraint comment_media_storage_path_len check (char_length(storage_path) between 3 and 500),
  constraint comment_media_file_size check (
    file_size_bytes > 0 and (
      (media_type = 'image' and file_size_bytes <= 33554432) or
      (media_type = 'video' and file_size_bytes <= 536870912)
    )
  ),
  constraint comment_media_bucket_match check (
    (media_type = 'image' and storage_bucket = 'comment-images') or
    (media_type = 'video' and storage_bucket = 'comment-videos')
  )
);

create table if not exists public.votes (
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table if not exists public.bookmarks (
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table if not exists public.report_status_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  old_status public.report_status,
  new_status public.report_status not null,
  note text,
  created_at timestamptz not null default now()
);

-- =========================
-- INDEXES
-- =========================
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists reports_author_created_idx on public.reports(author_id, created_at desc);
create index if not exists reports_updated_idx on public.reports(updated_at desc);
create index if not exists reports_reviewed_idx on public.reports(reviewed_at desc);
create index if not exists reports_title_idx on public.reports(lower(title));
create index if not exists reports_search_idx on public.reports using gin(search_vector);
create index if not exists comments_report_created_idx on public.comments(report_id, created_at asc);
create index if not exists report_media_report_idx on public.report_media(report_id);
create index if not exists comment_media_comment_idx on public.comment_media(comment_id);
create index if not exists votes_user_idx on public.votes(user_id);
create index if not exists bookmarks_user_idx on public.bookmarks(user_id);
create index if not exists status_logs_report_created_idx on public.report_status_logs(report_id, created_at desc);

-- =========================
-- FUNCTIONS
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _user_id
      and p.role = 'admin'
  );
$$;

create or replace function public.is_report_owner(_report_id uuid, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reports r
    where r.id = _report_id
      and r.author_id = _user_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := coalesce(
    nullif(regexp_replace(new.raw_user_meta_data->>'username', '[^a-zA-Z0-9_\.]', '', 'g'), ''),
    nullif(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-zA-Z0-9_\.]', '', 'g'), ''),
    'user'
  );

  final_username := left(base_username, 28) || '_' || left(new.id::text, 8);

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', final_username)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and auth.uid() is not null
     and not public.is_admin(auth.uid()) then
    raise exception 'Only admin can change profile role.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_report_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_admin boolean := public.is_admin(auth.uid());
begin
  if new.author_id is distinct from old.author_id then
    raise exception 'Report author cannot be changed.';
  end if;

  -- Direct SQL/service contexts may not have auth.uid(); allow trusted DB maintenance.
  if actor_id is null then
    if new.status is distinct from old.status then
      new.reviewed_at := now();
      if new.status = 'closed' then
        new.resolved_at := now();
      else
        new.resolved_at := null;
      end if;
    end if;
    return new;
  end if;

  if not actor_is_admin then
    if actor_id is null or actor_id <> old.author_id then
      raise exception 'Only the report author or admin can update this report.';
    end if;

    if new.status is distinct from old.status then
      if not (new.status = 'closed' and old.status <> 'closed') then
        raise exception 'User can only mark their own report as closed.';
      end if;
    end if;

    if new.duplicate_of_report_id is distinct from old.duplicate_of_report_id then
      raise exception 'Only admin can set duplicate reference.';
    end if;

    if new.reviewed_at is distinct from old.reviewed_at then
      new.reviewed_at := old.reviewed_at;
    end if;

    if new.resolved_at is distinct from old.resolved_at then
      new.resolved_at := old.resolved_at;
    end if;
  end if;

  if new.status is distinct from old.status then
    new.reviewed_at := now();

    if new.status = 'closed' then
      new.resolved_at := now();
    else
      new.resolved_at := null;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.log_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is not null and not exists (select 1 from public.profiles where id = actor) then
    actor := null;
  end if;

  if new.status is distinct from old.status then
    insert into public.report_status_logs (report_id, actor_id, old_status, new_status)
    values (new.id, actor, old.status, new.status);
  end if;

  return new;
end;
$$;

create or replace function public.enforce_report_media_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_images integer;
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.uploader_id is distinct from auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'Media uploader must be the current user.';
  end if;

  if not exists (
    select 1
    from public.reports r
    where r.id = new.report_id
      and (r.author_id = new.uploader_id or public.is_admin(new.uploader_id))
  ) then
    raise exception 'Only report author or admin can attach report media.';
  end if;

  if new.media_type = 'image' then
    select count(*) into existing_images
    from public.report_media rm
    where rm.report_id = new.report_id
      and rm.media_type = 'image'
      and (tg_op = 'INSERT' or rm.id <> old.id);

    if existing_images >= 5 then
      raise exception 'A report can have maximum 5 images.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_comment_media_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.uploader_id is distinct from auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'Media uploader must be the current user.';
  end if;

  if not exists (
    select 1
    from public.comments c
    where c.id = new.comment_id
      and (c.author_id = new.uploader_id or public.is_admin(new.uploader_id))
  ) then
    raise exception 'Only comment author or admin can attach comment media.';
  end if;

  return new;
end;
$$;

-- =========================
-- TRIGGERS
-- =========================
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists enforce_report_update_rules on public.reports;
create trigger enforce_report_update_rules
before update on public.reports
for each row execute function public.enforce_report_update_rules();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

drop trigger if exists log_report_status_change on public.reports;
create trigger log_report_status_change
after update on public.reports
for each row execute function public.log_report_status_change();

drop trigger if exists enforce_report_media_rules on public.report_media;
create trigger enforce_report_media_rules
before insert or update on public.report_media
for each row execute function public.enforce_report_media_rules();

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists enforce_comment_media_rules on public.comment_media;
create trigger enforce_comment_media_rules
before insert or update on public.comment_media
for each row execute function public.enforce_comment_media_rules();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- STORAGE BUCKETS
-- =========================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('report-images', 'report-images', false, 33554432, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('report-videos', 'report-videos', false, 536870912, array['video/mp4', 'video/webm', 'video/quicktime']::text[]),
  ('comment-images', 'comment-images', false, 33554432, array['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('comment-videos', 'comment-videos', false, 536870912, array['video/mp4', 'video/webm', 'video/quicktime']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.rooms enable row level security;
alter table public.reports enable row level security;
alter table public.report_media enable row level security;
alter table public.comments enable row level security;
alter table public.comment_media enable row level security;
alter table public.votes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.report_status_logs enable row level security;

-- Profiles
drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles for select
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

-- Categories
drop policy if exists "Categories are readable" on public.categories;
create policy "Categories are readable"
on public.categories for select
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
on public.categories for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Rooms
drop policy if exists "Rooms are readable" on public.rooms;
create policy "Rooms are readable"
on public.rooms for select
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "Admins manage rooms" on public.rooms;
create policy "Admins manage rooms"
on public.rooms for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Reports
drop policy if exists "Reports are readable" on public.reports;
create policy "Reports are readable"
on public.reports for select
using (true);

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
on public.reports for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "Authors and admins update reports" on public.reports;
create policy "Authors and admins update reports"
on public.reports for update
to authenticated
using (author_id = auth.uid() or public.is_admin(auth.uid()))
with check (author_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins delete reports" on public.reports;
create policy "Admins delete reports"
on public.reports for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Report media metadata
drop policy if exists "Report media metadata readable" on public.report_media;
create policy "Report media metadata readable"
on public.report_media for select
using (true);

drop policy if exists "Authors insert report media metadata" on public.report_media;
create policy "Authors insert report media metadata"
on public.report_media for insert
to authenticated
with check (
  uploader_id = auth.uid()
  and (
    public.is_report_owner(report_id, auth.uid())
    or public.is_admin(auth.uid())
  )
);

drop policy if exists "Authors update report media metadata" on public.report_media;
create policy "Authors update report media metadata"
on public.report_media for update
to authenticated
using (uploader_id = auth.uid() or public.is_admin(auth.uid()))
with check (uploader_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Authors delete report media metadata" on public.report_media;
create policy "Authors delete report media metadata"
on public.report_media for delete
to authenticated
using (uploader_id = auth.uid() or public.is_admin(auth.uid()));

-- Comments
drop policy if exists "Comments are readable" on public.comments;
create policy "Comments are readable"
on public.comments for select
using (is_deleted = false or author_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Users create comments" on public.comments;
create policy "Users create comments"
on public.comments for insert
to authenticated
with check (author_id = auth.uid());

drop policy if exists "Authors and admins update comments" on public.comments;
create policy "Authors and admins update comments"
on public.comments for update
to authenticated
using (author_id = auth.uid() or public.is_admin(auth.uid()))
with check (author_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Authors and admins delete comments" on public.comments;
create policy "Authors and admins delete comments"
on public.comments for delete
to authenticated
using (author_id = auth.uid() or public.is_admin(auth.uid()));

-- Comment media metadata
drop policy if exists "Comment media metadata readable" on public.comment_media;
create policy "Comment media metadata readable"
on public.comment_media for select
using (true);

drop policy if exists "Comment authors insert media metadata" on public.comment_media;
create policy "Comment authors insert media metadata"
on public.comment_media for insert
to authenticated
with check (uploader_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Comment authors update media metadata" on public.comment_media;
create policy "Comment authors update media metadata"
on public.comment_media for update
to authenticated
using (uploader_id = auth.uid() or public.is_admin(auth.uid()))
with check (uploader_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Comment authors delete media metadata" on public.comment_media;
create policy "Comment authors delete media metadata"
on public.comment_media for delete
to authenticated
using (uploader_id = auth.uid() or public.is_admin(auth.uid()));

-- Votes
drop policy if exists "Votes are readable" on public.votes;
create policy "Votes are readable"
on public.votes for select
using (true);

drop policy if exists "Users vote once" on public.votes;
create policy "Users vote once"
on public.votes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users remove own vote" on public.votes;
create policy "Users remove own vote"
on public.votes for delete
to authenticated
using (user_id = auth.uid());

-- Bookmarks
drop policy if exists "Users read own bookmarks" on public.bookmarks;
create policy "Users read own bookmarks"
on public.bookmarks for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users create own bookmarks" on public.bookmarks;
create policy "Users create own bookmarks"
on public.bookmarks for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users delete own bookmarks" on public.bookmarks;
create policy "Users delete own bookmarks"
on public.bookmarks for delete
to authenticated
using (user_id = auth.uid());

-- Status logs
drop policy if exists "Status logs are readable" on public.report_status_logs;
create policy "Status logs are readable"
on public.report_status_logs for select
using (true);

drop policy if exists "Admins insert status logs" on public.report_status_logs;
create policy "Admins insert status logs"
on public.report_status_logs for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- Storage object policies
drop policy if exists "Authenticated users read Lapor FST media" on storage.objects;
create policy "Authenticated users read Lapor FST media"
on storage.objects for select
to authenticated
using (bucket_id in ('report-images', 'report-videos', 'comment-images', 'comment-videos'));

drop policy if exists "Authenticated users upload to own media folder" on storage.objects;
create policy "Authenticated users upload to own media folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('report-images', 'report-videos', 'comment-images', 'comment-videos')
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Authenticated users update own media folder" on storage.objects;
create policy "Authenticated users update own media folder"
on storage.objects for update
to authenticated
using (
  bucket_id in ('report-images', 'report-videos', 'comment-images', 'comment-videos')
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id in ('report-images', 'report-videos', 'comment-images', 'comment-videos')
  and (storage.foldername(name))[1] = (auth.uid())::text
);

drop policy if exists "Authenticated users delete own media folder" on storage.objects;
create policy "Authenticated users delete own media folder"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('report-images', 'report-videos', 'comment-images', 'comment-videos')
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- =========================
-- REPORT LIST VIEW
-- =========================
drop view if exists public.report_list_view;
create view public.report_list_view
with (security_invoker = true)
as
select
  r.id,
  r.author_id,
  p.username as author_username,
  r.title,
  r.description,
  r.status,
  r.category_id,
  c.name as category_name,
  r.room_id,
  ro.name as room_name,
  r.room_other,
  r.observation_result,
  r.expected_result,
  r.duplicate_of_report_id,
  r.created_at,
  r.updated_at,
  r.reviewed_at,
  r.resolved_at,
  coalesce(v.vote_count, 0)::integer as vote_count,
  coalesce(cm.comment_count, 0)::integer as comment_count,
  coalesce(m.media_count, 0)::integer as media_count
from public.reports r
join public.profiles p on p.id = r.author_id
left join public.categories c on c.id = r.category_id
left join public.rooms ro on ro.id = r.room_id
left join (
  select report_id, count(*) as vote_count
  from public.votes
  group by report_id
) v on v.report_id = r.id
left join (
  select report_id, count(*) as comment_count
  from public.comments
  where is_deleted = false
  group by report_id
) cm on cm.report_id = r.id
left join (
  select report_id, count(*) as media_count
  from public.report_media
  group by report_id
) m on m.report_id = r.id;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.report_list_view to anon, authenticated, service_role;
grant select on public.profiles, public.categories, public.rooms, public.reports, public.report_media, public.comments, public.comment_media, public.votes, public.report_status_logs to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;

commit;
