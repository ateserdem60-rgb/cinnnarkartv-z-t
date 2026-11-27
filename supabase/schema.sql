-- Çınar Cafe & Restaurant — Supabase şeması
-- Supabase Dashboard → SQL Editor'de bir kez çalıştırın.

-- 1) İçerik tablosu: 'draft' (taslak) ve 'published' (yayımlanan) olmak üzere iki satır.
create table if not exists public.site_content (
  id text primary key check (id in ('draft', 'published')),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS açık ve hiçbir politika yok: tabloya yalnızca sunucudaki service_role anahtarı erişir.
-- Ziyaretçiler içeriği Next.js sunucusu üzerinden okur; tarayıcıdan doğrudan erişim yoktur.
alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;

-- 2) Medya deposu: herkese açık okunur (görseller/video/PDF ziyaretçiye gösterilir),
--    yazma yalnızca service_role ile (sunucudaki yetki kontrolünden sonra).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/avif','application/pdf','video/mp4']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
