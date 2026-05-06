-- Apply MIME and size restrictions to testimony-videos (bucket pre-existed, prior INSERT..ON CONFLICT DO NOTHING was a no-op)
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'video/mp4', 'video/webm', 'video/ogg',
    'video/quicktime', 'video/x-msvideo'
  ],
  file_size_limit = 104857600
WHERE id = 'testimony-videos';

-- Add missing UPDATE policy on stories-media so users can only overwrite files in their own folder
CREATE POLICY "Users can update their own stories-media files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'stories-media' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'stories-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
