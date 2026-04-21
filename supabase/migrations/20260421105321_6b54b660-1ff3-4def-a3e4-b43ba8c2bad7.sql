-- Posts table for testimonies
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text','video')),
  content TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  video_category TEXT CHECK (video_category IN ('short','reel')),
  video_duration NUMERIC,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX idx_posts_user_id ON public.posts (user_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view posts"
ON public.posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own posts"
ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Likes table
CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view likes"
ON public.post_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like as themselves"
ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike themselves"
ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post_id ON public.post_comments (post_id, created_at);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view comments"
ON public.post_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can comment as themselves"
ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;