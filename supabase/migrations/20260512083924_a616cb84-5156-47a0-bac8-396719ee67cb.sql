
-- 1) Add status column
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check CHECK (status IN ('pending','approved','rejected'));

-- 2) Backfill existing rows so the feed is not emptied
UPDATE public.posts SET status = 'approved' WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS posts_status_created_at_idx
  ON public.posts (status, created_at DESC);

-- 3) Replace SELECT policy: only approved posts are visible to everyone;
--    authors can see their own pending/rejected; admins see everything.
DROP POLICY IF EXISTS "Authenticated can view posts" ON public.posts;
CREATE POLICY "View approved or own or admin"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4) Owner UPDATE: keep restriction that likes are unchanged AND status is unchanged
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND likes  = (SELECT p.likes  FROM public.posts p WHERE p.id = posts.id)
    AND status = (SELECT p.status FROM public.posts p WHERE p.id = posts.id)
  );

-- 5) Admin UPDATE: can change status (moderation)
DROP POLICY IF EXISTS "Admins can moderate posts" ON public.posts;
CREATE POLICY "Admins can moderate posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
