
-- Tighten post_comments SELECT to mirror posts visibility
DROP POLICY IF EXISTS "Authenticated can view comments" ON public.post_comments;
CREATE POLICY "View comments on approved/own/admin posts"
ON public.post_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_comments.post_id
      AND (p.status = 'approved' OR p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Tighten post_likes SELECT to mirror posts visibility
DROP POLICY IF EXISTS "Authenticated can view likes" ON public.post_likes;
CREATE POLICY "View likes on approved/own/admin posts"
ON public.post_likes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_likes.post_id
      AND (p.status = 'approved' OR p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);
