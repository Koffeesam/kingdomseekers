-- =========================
-- STORIES
-- =========================
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  bg_color TEXT NOT NULL DEFAULT 'from-amber-500 to-orange-600',
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'text' CHECK (media_type IN ('text','image')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  CONSTRAINT story_has_payload CHECK (
    (media_type = 'text' AND content IS NOT NULL AND length(content) > 0)
    OR (media_type = 'image' AND media_url IS NOT NULL)
  )
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active stories"
  ON public.stories FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "Users can post their own stories"
  ON public.stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON public.stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_stories_user ON public.stories(user_id);
CREATE INDEX idx_stories_expires ON public.stories(expires_at DESC);

-- =========================
-- STORY VIEWS
-- =========================
CREATE TABLE public.story_views (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewers can record their own views"
  ON public.story_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Viewers see their own view history"
  ON public.story_views FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id);

-- =========================
-- DIRECT MESSAGE ATTACHMENTS
-- =========================
ALTER TABLE public.direct_messages
  ADD COLUMN attachment_url TEXT,
  ADD COLUMN attachment_type TEXT CHECK (attachment_type IN ('image','file','audio')),
  ADD COLUMN attachment_name TEXT,
  ADD COLUMN attachment_size INTEGER;

-- Allow text to be empty when there's an attachment
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_text_check;
ALTER TABLE public.direct_messages
  ADD CONSTRAINT dm_has_payload CHECK (
    length(text) > 0 OR attachment_url IS NOT NULL
  );

-- =========================
-- STORAGE BUCKETS
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories-media', 'stories-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

-- ----- stories-media policies -----
CREATE POLICY "Stories media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories-media');

CREATE POLICY "Users upload to own stories folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'stories-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete their own stories media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'stories-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----- chat-media policies (private; recipient access via signed URLs) -----
-- We allow uploader to write into their own uid folder, and uploader OR
-- recipient (anyone listed in a direct_messages row referencing this path)
-- to read. For simplicity & security we restrict reads to authenticated users
-- whose uid appears in the file path OR who is party to a DM whose
-- attachment_url contains this object name.
CREATE POLICY "Chat media: uploader can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Chat media: uploader can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Read access: uploader OR a user that is sender/recipient on a DM with this file
CREATE POLICY "Chat media: uploader or DM party can read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.direct_messages dm
        WHERE dm.attachment_url LIKE '%' || name
          AND (dm.from_user_id = auth.uid() OR dm.to_user_id = auth.uid())
      )
    )
  );