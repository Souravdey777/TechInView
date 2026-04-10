DO $$
BEGIN
  CREATE TYPE interviewer_persona AS ENUM (
    'tia',
    'google',
    'meta',
    'amazon',
    'apple',
    'netflix'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS interviewer_persona interviewer_persona;

UPDATE interviews
SET interviewer_persona = 'tia'
WHERE interviewer_persona IS NULL;

ALTER TABLE interviews
ALTER COLUMN interviewer_persona SET DEFAULT 'tia';

ALTER TABLE interviews
ALTER COLUMN interviewer_persona SET NOT NULL;
