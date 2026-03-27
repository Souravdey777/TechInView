-- ============================================================
-- TechInView.ai — Free Trial Flag on Interviews
-- 004_add_is_free_trial.sql
-- ============================================================

ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN NOT NULL DEFAULT false;
