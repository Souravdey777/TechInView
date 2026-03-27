-- ============================================================
-- TechInView.ai — Credits & Payments Migration
-- 003_add_credits_and_payments.sql
-- ============================================================

-- ─── Simplify plan enum: free | paid ─────────

ALTER TYPE plan RENAME TO plan_old;
CREATE TYPE plan AS ENUM ('free', 'paid');
ALTER TABLE public.profiles ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN plan TYPE plan USING (
    CASE WHEN plan::text = 'free' THEN 'free'::plan ELSE 'paid'::plan END
  );
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';
DROP TYPE plan_old;

-- ─── Add credit-related columns to profiles ──────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interview_credits INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_used_free_trial BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code TEXT;

-- ─── Payments table (idempotency for Razorpay credit provisioning) ───────────

CREATE TABLE IF NOT EXISTS public.payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  razorpay_order_id    TEXT NOT NULL,
  razorpay_payment_id  TEXT UNIQUE NOT NULL,
  pack                 TEXT NOT NULL,
  credits              INTEGER NOT NULL,
  amount               INTEGER NOT NULL,
  currency             TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'captured',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
  ON public.payments (user_id);

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON public.payments (razorpay_payment_id);

-- ─── RLS for payments ────────────────────────────────────────────────────────

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on payments"
  ON public.payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.payments FROM anon;
GRANT SELECT ON public.payments TO authenticated;
