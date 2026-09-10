CREATE TABLE public.email_health_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_health_events TO authenticated;
GRANT ALL ON public.email_health_events TO service_role;
ALTER TABLE public.email_health_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view email health events"
ON public.email_health_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX email_health_events_created_at_idx ON public.email_health_events (created_at DESC);