ALTER TABLE profiles
  ALTER COLUMN interview_credits SET DEFAULT 0;

ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS is_free_solver_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  language text NOT NULL,
  last_code text,
  tests_passed integer,
  tests_total integer,
  is_solved boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT practice_attempts_user_problem_unique UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_id
  ON practice_attempts (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_problem_id
  ON practice_attempts (problem_id);

UPDATE problems
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

UPDATE profiles
SET interview_credits = 0
WHERE interview_credits = 1
  AND has_used_free_trial = false
  AND interviews_completed = 0
  AND NOT EXISTS (
    SELECT 1
    FROM payments
    WHERE payments.user_id = profiles.id
  );
