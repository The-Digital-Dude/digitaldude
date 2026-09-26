-- Migration: 0003_storage.sql
-- Description: Create public storage bucket for blog images and upload policies

-- 1. Insert bucket into storage.buckets if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Allow public read access to any file in 'blog-images' bucket
drop policy if exists "Public Access for blog-images" on storage.objects;
create policy "Public Access for blog-images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- 3. Allow service role full access (handled by Supabase service role key)
