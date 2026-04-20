-- Drop overly broad SELECT policies that allow listing all files in public buckets.
-- Public URLs continue to work because public buckets serve files via CDN without needing a SELECT policy.
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Stories media public read" ON storage.objects;

-- Owner-scoped listing for avatars (so users can list/manage their own avatar files)
CREATE POLICY "Users can list their own avatar files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
