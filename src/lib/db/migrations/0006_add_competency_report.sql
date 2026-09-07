-- Behaviour-led rounds (behavioral, hiring_manager) produce a per-competency
-- evidence report graded against the value framework the candidate picks at
-- setup. Stored alongside the shared five dimension scores so the results page
-- can rebuild the full debrief after a reload.
--
-- Shape: see CompetencyReport in src/types/index.ts.
-- Mirrored in supabase/migrations/008_add_competency_report.sql; both are
-- idempotent, so applying either or both is safe.

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS competency_report jsonb;
