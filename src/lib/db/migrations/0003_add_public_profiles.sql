ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_bio text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_links jsonb;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_public_profile boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_unique'
      AND conrelid = 'profiles'::regclass
  ) AND to_regclass('profiles_username_unique') IS NULL THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_username_unique UNIQUE (username);
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_username_format
    CHECK (username IS NULL OR username ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_public_bio_length
    CHECK (public_bio IS NULL OR char_length(public_bio) <= 160);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
