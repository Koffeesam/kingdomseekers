
CREATE TABLE public.saved_teachings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_teachings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view saved teachings"
  ON public.saved_teachings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert saved teachings"
  ON public.saved_teachings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Admins can update saved teachings"
  ON public.saved_teachings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete saved teachings"
  ON public.saved_teachings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_saved_teachings_updated_at
  BEFORE UPDATE ON public.saved_teachings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_saved_teachings_date ON public.saved_teachings (session_date DESC);
