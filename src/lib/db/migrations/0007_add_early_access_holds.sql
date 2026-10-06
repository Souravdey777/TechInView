-- Early access discount: each discounted Razorpay order holds one of the
-- EARLY_ACCESS_PURCHASE_LIMIT spots. A spot is used once the hold is paid, or
-- while an unpaid hold has not expired. Rows are never deleted, so a late
-- payment on an expired hold still counts.
--
-- Mirrored in supabase/migrations/009_add_early_access_holds.sql; both are idempotent, so applying either or both is safe.

CREATE TABLE IF NOT EXISTS public.early_access_holds (
  razorpay_order_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL,
  expires_at timestamptz NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS early_access_holds_user_id_idx ON public.early_access_holds (user_id);

-- Server-only (DATABASE_URL); no client access.
ALTER TABLE public.early_access_holds ENABLE ROW LEVEL SECURITY;
