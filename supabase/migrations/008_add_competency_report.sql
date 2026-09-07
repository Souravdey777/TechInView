-- Behaviour-led rounds (behavioral, hiring_manager) produce a per-competency
-- evidence report graded against the value framework the candidate picked at
-- setup. It is stored alongside the shared five dimension scores so the report
-- page can rebuild the full debrief after a reload.
--
-- Shape (see CompetencyReport in src/types/index.ts):
-- {
--   "framework_id": "amazon_lp",
--   "framework_label": "Amazon Leadership Principles",
--   "competencies": [
--     { "competency_id": "ownership", "label": "Ownership", "rating": "solid",
--       "score": 72, "evidence": "...", "gap": "...", "upgrade": "..." }
--   ],
--   "star_coverage": { "situation": 80, "task": 70, "action": 85, "result": 40, "reflection": 30 },
--   "debrief_note": "...",
--   "follow_up_drills": ["..."],
--   "key_strengths": ["..."],
--   "areas_to_improve": ["..."]
-- }

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS competency_report JSONB;

COMMENT ON COLUMN interviews.competency_report IS
  'Per-competency evidence report for behaviour-led rounds, graded against the round''s selected value framework. Null for coding and technical Q&A rounds.';
