-- ============================================================
-- TechInView.ai — Initial Schema Migration
-- 001_initial_schema.sql
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE experience_level AS ENUM ('junior', 'mid', 'senior', 'staff');
CREATE TYPE plan AS ENUM ('free', 'starter', 'pro');
CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE interview_status AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE hire_recommendation AS ENUM (
  'strong_hire',
  'hire',
  'lean_hire',
  'lean_no_hire',
  'no_hire'
);
CREATE TYPE message_role AS ENUM ('interviewer', 'candidate', 'system');

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- profiles: extends auth.users (one-to-one)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT,
  avatar_url            TEXT,
  target_company        TEXT,
  experience_level      experience_level,
  preferred_language    TEXT,
  plan                  plan NOT NULL DEFAULT 'free',
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT,
  interviews_completed  INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- problems: DSA problem bank
CREATE TABLE IF NOT EXISTS public.problems (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  difficulty           difficulty NOT NULL,
  category             TEXT NOT NULL,
  company_tags         TEXT[],
  description          TEXT NOT NULL,
  examples             JSONB,
  constraints          TEXT[],
  starter_code         JSONB,
  test_cases           JSONB,
  solution_approach    TEXT,
  hints                TEXT[],
  optimal_complexity   JSONB,
  follow_up_questions  TEXT[],
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- interviews: session records
CREATE TABLE IF NOT EXISTS public.interviews (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id              UUID NOT NULL REFERENCES public.problems(id) ON DELETE RESTRICT,
  status                  interview_status NOT NULL DEFAULT 'in_progress',
  language                TEXT NOT NULL,
  duration_seconds        INTEGER,
  max_duration_seconds    INTEGER NOT NULL DEFAULT 2700,
  final_code              TEXT,
  code_passed_tests       BOOLEAN,
  tests_passed            INTEGER,
  tests_total             INTEGER,
  overall_score           INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  scores                  JSONB,
  feedback_summary        TEXT,
  hire_recommendation     hire_recommendation,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at            TIMESTAMPTZ
);

-- messages: conversation log per interview
CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id  UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  role          message_role NOT NULL,
  content       TEXT NOT NULL,
  audio_url     TEXT,
  timestamp_ms  INTEGER NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- progress: aggregated stats per user per category
CREATE TABLE IF NOT EXISTS public.progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category            TEXT NOT NULL,
  problems_attempted  INTEGER NOT NULL DEFAULT 0,
  problems_solved     INTEGER NOT NULL DEFAULT 0,
  avg_score           REAL,
  CONSTRAINT progress_user_category_unique UNIQUE (user_id, category)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_interviews_user_id
  ON public.interviews (user_id);

CREATE INDEX IF NOT EXISTS idx_interviews_status
  ON public.interviews (status);

CREATE INDEX IF NOT EXISTS idx_interviews_started_at
  ON public.interviews (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_problems_difficulty
  ON public.problems (difficulty);

CREATE INDEX IF NOT EXISTS idx_problems_category
  ON public.problems (category);

CREATE INDEX IF NOT EXISTS idx_problems_slug
  ON public.problems (slug);

CREATE INDEX IF NOT EXISTS idx_messages_interview_id
  ON public.messages (interview_id);

CREATE INDEX IF NOT EXISTS idx_messages_timestamp_ms
  ON public.messages (interview_id, timestamp_ms ASC);

CREATE INDEX IF NOT EXISTS idx_progress_user_id
  ON public.progress (user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- problems policies (all authenticated users can read)
CREATE POLICY "Authenticated users can read problems"
  ON public.problems FOR SELECT
  TO authenticated
  USING (true);

-- interviews policies
CREATE POLICY "Users can view their own interviews"
  ON public.interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interviews"
  ON public.interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews"
  ON public.interviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- messages policies (scoped to interview ownership)
CREATE POLICY "Users can view messages for their interviews"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.id = messages.interview_id
        AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for their interviews"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.id = messages.interview_id
        AND interviews.user_id = auth.uid()
    )
  );

-- progress policies
CREATE POLICY "Users can view their own progress"
  ON public.progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own progress"
  ON public.progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Service Role Bypass Policies ────────────────────────────────────────────
-- Allow backend (service role) to read/write all rows for scoring, seeding, etc.

CREATE POLICY "Service role can do everything on profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on problems"
  ON public.problems FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on interviews"
  ON public.interviews FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on messages"
  ON public.messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on progress"
  ON public.progress FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── Auto-create Profile Trigger ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Seed Permissions (anon cannot access problems — auth required) ───────────
-- Revoke public/anon access; all access is via authenticated or service_role

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.interviews FROM anon;
REVOKE ALL ON public.messages FROM anon;
REVOKE ALL ON public.progress FROM anon;
REVOKE ALL ON public.problems FROM anon;

GRANT SELECT ON public.problems TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.interviews TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.progress TO authenticated;
