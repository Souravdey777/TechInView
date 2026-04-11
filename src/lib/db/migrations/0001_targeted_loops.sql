DO $$
BEGIN
  CREATE TYPE interview_mode AS ENUM ('general_dsa', 'targeted_loop');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE round_type AS ENUM ('coding', 'behavioral', 'hiring_manager', 'system_design');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE historical_question_review_status AS ENUM ('reviewed', 'staged');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE interviews
  ALTER COLUMN problem_id DROP NOT NULL;

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS mode interview_mode DEFAULT 'general_dsa' NOT NULL,
  ADD COLUMN IF NOT EXISTS round_type round_type DEFAULT 'coding' NOT NULL,
  ADD COLUMN IF NOT EXISTS round_title text,
  ADD COLUMN IF NOT EXISTS generated_loop_id text,
  ADD COLUMN IF NOT EXISTS generated_loop_round_id text,
  ADD COLUMN IF NOT EXISTS company_snapshot text,
  ADD COLUMN IF NOT EXISTS role_title_snapshot text,
  ADD COLUMN IF NOT EXISTS loop_summary_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS round_context_snapshot jsonb;

CREATE TABLE IF NOT EXISTS generated_loops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  mode interview_mode DEFAULT 'targeted_loop' NOT NULL,
  company text NOT NULL,
  role_title text NOT NULL,
  experience_level experience_level NOT NULL,
  jd_snapshot text NOT NULL,
  jd_signals text[] DEFAULT ARRAY[]::text[] NOT NULL,
  loop_name text NOT NULL,
  summary text NOT NULL,
  confidence text NOT NULL,
  persona_id interviewer_persona DEFAULT 'tia' NOT NULL,
  similar_company_fallback boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS generated_loop_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_loop_id uuid REFERENCES generated_loops(id) ON DELETE CASCADE NOT NULL,
  round_order integer NOT NULL,
  round_type round_type NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  rationale text NOT NULL,
  confidence text NOT NULL,
  estimated_minutes integer NOT NULL,
  difficulty difficulty,
  focus_areas text[] DEFAULT ARRAY[]::text[] NOT NULL,
  prompt text NOT NULL,
  historical_question_ids text[] DEFAULT ARRAY[]::text[] NOT NULL,
  workspace_sections jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS historical_questions (
  id text PRIMARY KEY,
  company text NOT NULL,
  round_type round_type NOT NULL,
  role_family text NOT NULL,
  level_band experience_level NOT NULL,
  topics text[] DEFAULT ARRAY[]::text[] NOT NULL,
  jd_tags text[] DEFAULT ARRAY[]::text[] NOT NULL,
  prompt text NOT NULL,
  source_label text NOT NULL,
  provenance text NOT NULL,
  confidence real NOT NULL,
  review_status historical_question_review_status DEFAULT 'staged' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
