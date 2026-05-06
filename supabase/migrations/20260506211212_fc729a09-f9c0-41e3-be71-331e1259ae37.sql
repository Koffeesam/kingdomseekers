-- Extend posts table
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS link_url text;

-- Create the post-media bucket (idempotent + ensure restrictions applied)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media', 'post-media', true, 10485760,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/heic',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/heic',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','text/csv'
  ]
WHERE id = 'post-media';

-- Storage RLS policies for post-media
CREATE POLICY "Public can read post-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Users can upload to their own post-media folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own post-media files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post-media files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
