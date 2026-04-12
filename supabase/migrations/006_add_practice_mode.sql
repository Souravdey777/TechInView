-- ============================================================
-- TechInView.ai — DSA Practice Mode
-- 006_add_practice_mode.sql
-- ============================================================

ALTER TABLE public.profiles
  ALTER COLUMN interview_credits SET DEFAULT 0;

ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS is_free_solver_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id    UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  language      TEXT NOT NULL,
  last_code     TEXT,
  tests_passed  INTEGER,
  tests_total   INTEGER,
  is_solved     BOOLEAN NOT NULL DEFAULT false,
  last_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT practice_attempts_user_problem_unique UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_id
  ON public.practice_attempts (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_problem_id
  ON public.practice_attempts (problem_id);

ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own practice attempts" ON public.practice_attempts;
CREATE POLICY "Users can view their own practice attempts"
  ON public.practice_attempts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own practice attempts" ON public.practice_attempts;
CREATE POLICY "Users can insert their own practice attempts"
  ON public.practice_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own practice attempts" ON public.practice_attempts;
CREATE POLICY "Users can update their own practice attempts"
  ON public.practice_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can do everything on practice attempts" ON public.practice_attempts;
CREATE POLICY "Service role can do everything on practice attempts"
  ON public.practice_attempts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

UPDATE public.problems
SET is_free_solver_enabled = slug IN (
  'two-sum',
  'valid-parentheses',
  'binary-search',
  'merge-two-sorted-lists',
  'longest-substring-without-repeating',
  'group-anagrams',
  'product-of-array-except-self',
  'binary-tree-level-order-traversal',
  'number-of-islands',
  'top-k-frequent-elements',
  'trapping-rain-water',
  'word-ladder'
);

UPDATE public.profiles
SET interview_credits = 0
WHERE interview_credits = 1
  AND has_used_free_trial = false
  AND interviews_completed = 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.payments
    WHERE payments.user_id = profiles.id
  );
