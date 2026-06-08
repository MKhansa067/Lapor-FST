# Lapor FST Starter

Starter proyek untuk aplikasi pelaporan masalah fasilitas fakultas berbasis Next.js, TypeScript, Supabase, dan PostgreSQL.

## Isi starter

- `database/01_schema_supabase.sql`: skema utama database, RLS, trigger, view, storage bucket, dan policy.
- `database/02_seed.sql`: data awal kategori dan ruangan.
- `database/00_laragon_bootstrap.sql`: bootstrap opsional untuk PostgreSQL Laragon biasa.
- `supabase/migrations/20260608000000_initial_schema.sql`: migration Supabase CLI.
- `supabase/seed.sql`: seed Supabase CLI.
- `src/app`: route Next.js App Router.
- `src/components`: komponen header, list laporan, detail laporan, form laporan, auth.
- `src/lib/supabase`: Supabase client browser/server.

## Catatan penting lokal Laragon

Laragon PostgreSQL bisa menjalankan struktur tabel PostgreSQL, tetapi tidak menyediakan Supabase Auth, Storage API, PostgREST, dan Realtime. Untuk menjalankan aplikasi penuh secara lokal, gunakan Supabase CLI atau Supabase Cloud. Laragon cocok untuk mengecek SQL dan tabel.

Urutan SQL jika memakai PostgreSQL Laragon biasa:

```sql
-- 1. Jalankan ini hanya di Laragon PostgreSQL biasa
\i database/00_laragon_bootstrap.sql

-- 2. Jalankan skema utama
\i database/01_schema_supabase.sql

-- 3. Jalankan seed
\i database/02_seed.sql
```

## Local development dengan Supabase CLI

```bash
npm install
npx supabase init
npx supabase start
npx supabase db reset
cp .env.example .env.local
npm run dev
```

Isi `.env.local` dengan URL dan publishable key dari Supabase local atau Supabase Cloud.

## Deployment ringkas ke Vercel

1. Buat project Supabase Cloud.
2. Jalankan SQL migration `database/01_schema_supabase.sql`, lalu `database/02_seed.sql`, atau pakai Supabase CLI migration.
3. Push repo ke GitHub.
4. Import repo di Vercel.
5. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
6. Deploy.
7. Di Supabase Auth URL Configuration, set Site URL ke domain produksi dan tambahkan redirect URL lokal serta preview Vercel.

## Mapping status database ke UI

| Database | UI |
|---|---|
| `open` | Terbuka |
| `on_progress` | Di Proses |
| `closed` | Selesai |
| `duplicate` | Duplikat |

## Membuat admin pertama

Register user pertama dari UI, lalu jalankan SQL ini di Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where username = 'username_yang_dipilih';
```
