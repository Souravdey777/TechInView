CREATE TABLE IF NOT EXISTS api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  CONSTRAINT api_rate_limits_subject_action_window_unique
    UNIQUE (subject, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start
  ON api_rate_limits (window_start);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS beta_credits_granted boolean NOT NULL DEFAULT false;

UPDATE profiles AS profile
SET beta_credits_granted = true
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND COALESCE(auth_user.raw_user_meta_data->>'beta_credits_granted_at', '') <> '';

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage API rate limits"
  ON api_rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON api_rate_limits FROM anon, authenticated;

REVOKE SELECT ON problems FROM authenticated;
GRANT SELECT (
  id, title, slug, difficulty, category, company_tags, description, examples,
  constraints, starter_code, hints, optimal_complexity, follow_up_questions,
  is_free_solver_enabled, created_at
) ON problems TO authenticated;

REVOKE INSERT, UPDATE ON profiles FROM authenticated;
GRANT INSERT (
  id, display_name, avatar_url, username, public_bio, public_links,
  is_public_profile, target_company, experience_level, preferred_language,
  country_code
) ON profiles TO authenticated;
GRANT UPDATE (
  display_name, avatar_url, username, public_bio, public_links,
  is_public_profile, target_company, experience_level, preferred_language,
  country_code
) ON profiles TO authenticated;

REVOKE INSERT, UPDATE ON interviews FROM authenticated;
REVOKE INSERT ON messages FROM authenticated;
REVOKE INSERT, UPDATE ON progress FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON payments FROM authenticated;
