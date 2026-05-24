DROP POLICY IF EXISTS "Public can read post-media" ON storage.objects;
CREATE POLICY "Authenticated can read post-media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'post-media');