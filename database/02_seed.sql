-- Lapor FST - data awal kategori dan ruangan.

insert into public.categories (name, slug)
values
  ('Kebersihan', 'kebersihan'),
  ('Masalah AC', 'masalah-ac'),
  ('Furnitur', 'furnitur'),
  ('Lainnya', 'lainnya')
on conflict (slug) do update set
  name = excluded.name,
  is_active = true;

insert into public.rooms (name, slug)
values
  ('Classroom 1', 'classroom-1'),
  ('Classroom 2', 'classroom-2'),
  ('Laboratorium', 'laboratorium'),
  ('Lainnya', 'lainnya')
on conflict (slug) do update set
  name = excluded.name,
  is_active = true;

-- Setelah ada user pertama dari register/login Supabase, jadikan admin dengan SQL ini:
-- update public.profiles set role = 'admin' where username = 'username_yang_dipilih';
