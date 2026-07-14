-- Atomic, database-backed fixed-window rate limits for server API routes.
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT api_rate_limits_subject_action_window_unique
    UNIQUE (subject, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start
  ON public.api_rate_limits (window_start);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage API rate limits"
  ON public.api_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.api_rate_limits FROM anon, authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_credits_granted BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles AS profile
SET beta_credits_granted = true
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND COALESCE(auth_user.raw_user_meta_data->>'beta_credits_granted_at', '') <> '';

-- Authenticated browser clients may read problem statements, but never hidden
-- tests or solution guidance. Server-side DATABASE_URL queries are unaffected.
REVOKE SELECT ON public.problems FROM authenticated;
GRANT SELECT (
  id,
  title,
  slug,
  difficulty,
  category,
  company_tags,
  description,
  examples,
  constraints,
  starter_code,
  hints,
  optimal_complexity,
  follow_up_questions,
  is_free_solver_enabled,
  created_at
) ON public.problems TO authenticated;

-- Browser clients only need to edit user-controlled profile fields. Credits,
-- plan state, counters, interviews, messages, and progress are server-owned.
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT INSERT (
  id,
  display_name,
  avatar_url,
  username,
  public_bio,
  public_links,
  is_public_profile,
  target_company,
  experience_level,
  preferred_language,
  country_code
) ON public.profiles TO authenticated;
GRANT UPDATE (
  display_name,
  avatar_url,
  username,
  public_bio,
  public_links,
  is_public_profile,
  target_company,
  experience_level,
  preferred_language,
  country_code
) ON public.profiles TO authenticated;

REVOKE INSERT, UPDATE ON public.interviews FROM authenticated;
REVOKE INSERT ON public.messages FROM authenticated;
REVOKE INSERT, UPDATE ON public.progress FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM authenticated;
