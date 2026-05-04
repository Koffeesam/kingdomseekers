-- 1. Direct messages: only allow toggling `read` flag
DROP POLICY IF EXISTS "Recipient can update read status" ON public.direct_messages;
CREATE POLICY "Recipient can mark as read"
  ON public.direct_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (
    auth.uid() = to_user_id
    AND from_user_id = (SELECT from_user_id FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND to_user_id   = (SELECT to_user_id   FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND text         = (SELECT text         FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND attachment_url IS NOT DISTINCT FROM (SELECT attachment_url FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND attachment_type IS NOT DISTINCT FROM (SELECT attachment_type FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND attachment_name IS NOT DISTINCT FROM (SELECT attachment_name FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND attachment_size IS NOT DISTINCT FROM (SELECT attachment_size FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND reply_to_id  IS NOT DISTINCT FROM (SELECT reply_to_id  FROM public.direct_messages d WHERE d.id = direct_messages.id)
    AND created_at   = (SELECT created_at   FROM public.direct_messages d WHERE d.id = direct_messages.id)
  );

-- 2. Calls: pin caller_id/callee_id on update
DROP POLICY IF EXISTS "Participants can update their calls" ON public.calls;
CREATE POLICY "Participants can update their calls"
  ON public.calls FOR UPDATE
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id)
  WITH CHECK (
    (auth.uid() = caller_id OR auth.uid() = callee_id)
    AND caller_id = (SELECT caller_id FROM public.calls c WHERE c.id = calls.id)
    AND callee_id = (SELECT callee_id FROM public.calls c WHERE c.id = calls.id)
    AND call_type = (SELECT call_type FROM public.calls c WHERE c.id = calls.id)
  );

-- 3. user_roles: restrict SELECT to own rows (admins can already read via has_role/ALL policy)
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Posts likes integrity: tighten UPDATE so likes column cannot be changed by owner
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND likes = (SELECT likes FROM public.posts p WHERE p.id = posts.id)
  );

-- Atomic toggle_like RPC managing both post_likes row and posts.likes counter
CREATE OR REPLACE FUNCTION public.toggle_post_like(_post_id uuid)
RETURNS TABLE(liked boolean, likes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing uuid;
  new_count integer;
  now_liked boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id INTO existing FROM public.post_likes
    WHERE post_id = _post_id AND user_id = uid;

  IF existing IS NOT NULL THEN
    DELETE FROM public.post_likes WHERE post_id = _post_id AND user_id = uid;
    UPDATE public.posts SET likes = GREATEST(0, likes - 1)
      WHERE id = _post_id RETURNING posts.likes INTO new_count;
    now_liked := false;
  ELSE
    INSERT INTO public.post_likes(post_id, user_id) VALUES (_post_id, uid);
    UPDATE public.posts SET likes = likes + 1
      WHERE id = _post_id RETURNING posts.likes INTO new_count;
    now_liked := true;
  END IF;

  RETURN QUERY SELECT now_liked, COALESCE(new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_post_like(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_post_like(uuid) TO authenticated;

-- 5. Lock down SECURITY DEFINER helper functions from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 6. Storage buckets: restrict mime types and size on avatars + stories-media
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'],
    file_size_limit = 10485760
WHERE id IN ('avatars', 'stories-media');
