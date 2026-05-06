-- Length constraints on user-generated text
ALTER TABLE public.post_comments
  ADD CONSTRAINT post_comments_text_length
  CHECK (length(text) > 0 AND length(text) <= 1000);

ALTER TABLE public.posts
  ADD CONSTRAINT posts_content_length
  CHECK (length(content) <= 2000);

ALTER TABLE public.stories
  ADD CONSTRAINT stories_content_length
  CHECK (content IS NULL OR length(content) <= 500);

-- Permissive SELECT policies for the public buckets so authenticated API reads work
CREATE POLICY "Authenticated can read avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated can read stories-media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'stories-media');
