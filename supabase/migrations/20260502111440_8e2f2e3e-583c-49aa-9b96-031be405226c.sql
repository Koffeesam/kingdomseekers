
-- Roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Anyone authenticated can view roles"
  ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  tag TEXT NOT NULL DEFAULT 'Service',
  starts_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view events"
  ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);
CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily content (motivation + prayer) admin can edit, fallback to deterministic rotation
CREATE TABLE public.daily_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('motivation','prayer')),
  for_date DATE NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  reference TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, for_date)
);
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view daily content"
  ON public.daily_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert daily content"
  ON public.daily_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);
CREATE POLICY "Admins can update daily content"
  ON public.daily_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete daily content"
  ON public.daily_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_daily_content_updated_at
  BEFORE UPDATE ON public.daily_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow comment authors AND post authors to delete comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;
CREATE POLICY "Comment author or post owner can delete"
  ON public.post_comments FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_comments.post_id AND p.user_id = auth.uid())
  );
