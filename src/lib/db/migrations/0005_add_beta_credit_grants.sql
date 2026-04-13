ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS beta_credits_granted_at timestamptz;
