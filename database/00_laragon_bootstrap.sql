-- Lapor FST - Bootstrap khusus PostgreSQL lokal Laragon.
-- Jalankan file ini HANYA jika kamu memakai PostgreSQL biasa di Laragon.
-- Jangan jalankan file ini di Supabase Cloud/Supabase CLI karena auth dan storage sudah disediakan Supabase.

create extension if not exists pgcrypto;

-- Role Supabase-like agar policy "to anon/authenticated/service_role" tidak error di PostgreSQL lokal.
do $$
begin
  create role anon nologin;
exception when duplicate_object then null;
end $$;

do $$
begin
  create role authenticated nologin;
exception when duplicate_object then null;
end $$;

do $$
begin
  create role service_role nologin;
exception when duplicate_object then null;
end $$;

-- Stub auth schema untuk meniru auth.users dan auth.uid() Supabase.
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim', true), '')::jsonb, '{}'::jsonb);
$$;

-- Stub storage schema untuk meniru storage.buckets dan storage.objects Supabase.
create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null unique,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id) on delete cascade,
  name text not null,
  owner uuid,
  owner_id text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  version text,
  unique(bucket_id, name)
);

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select case
    when position('/' in name) = 0 then array[]::text[]
    else (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
  end;
$$;

alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
