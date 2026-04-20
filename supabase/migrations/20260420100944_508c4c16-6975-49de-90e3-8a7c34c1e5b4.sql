INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimony-videos',
  'testimony-videos',
  true,
  104857600, -- 100 MB
  ARRAY['video/mp4','video/webm','video/quicktime','video/x-matroska']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own testimony videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'testimony-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own testimony videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'testimony-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own testimony videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'testimony-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can list their own testimony-videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'testimony-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
