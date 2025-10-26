-- Add the missing pre_registrations table to your existing Supabase database
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.pre_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  user_type user_type_enum NOT NULL,
  invited_by uuid NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'registered'::character varying, 'expired'::character varying]::text[])),
  invitation_token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  registered_at timestamp with time zone,
  registered_user_id uuid,
  CONSTRAINT pre_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT pre_registrations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id),
  CONSTRAINT pre_registrations_registered_user_id_fkey FOREIGN KEY (registered_user_id) REFERENCES public.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pre_registrations_email ON public.pre_registrations(email);
CREATE INDEX IF NOT EXISTS idx_pre_registrations_token ON public.pre_registrations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_pre_registrations_status ON public.pre_registrations(status);
CREATE INDEX IF NOT EXISTS idx_pre_registrations_invited_by ON public.pre_registrations(invited_by);

-- Enable RLS
ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy for pre_registrations (adjust based on your security needs)
CREATE POLICY "Allow all operations on pre_registrations" ON public.pre_registrations FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.pre_registrations TO authenticated;
GRANT SELECT, UPDATE ON public.pre_registrations TO anon;
