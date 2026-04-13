ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_credits_granted_at TIMESTAMPTZ;
