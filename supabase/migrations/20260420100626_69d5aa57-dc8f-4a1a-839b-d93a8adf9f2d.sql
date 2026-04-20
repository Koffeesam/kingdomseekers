-- 1. Realtime channel authorization
-- Restrict realtime.messages so users only receive updates from topics where they're a participant.
-- Topics used in code: `call-{callId}` and `incoming-calls-{userId}`

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can receive their own incoming-calls topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'incoming-calls-' || auth.uid()::text
);

CREATE POLICY "Participants can receive call topic updates"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'call-%'
  AND EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id::text = substring(realtime.topic() from 6)
      AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
  )
);

-- 2. Story owners can read view records on their own stories
CREATE POLICY "Story owners can see views on their stories"
ON public.story_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_views.story_id
      AND s.user_id = auth.uid()
  )
);

-- 3. UPDATE policy on chat-media bucket (private)
CREATE POLICY "Users can update their own chat-media files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Restrict listing of stories-media public bucket
-- Drop overly broad SELECT policy on stories-media if it exists, replace with owner-scoped listing.
-- Files remain publicly accessible via direct URL (bucket is public), but listing is restricted.
DROP POLICY IF EXISTS "Stories media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view stories media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view stories media" ON storage.objects;

CREATE POLICY "Users can list their own stories-media files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'stories-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
