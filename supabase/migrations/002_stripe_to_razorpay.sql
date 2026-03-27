-- ============================================================
-- TechInView.ai — Stripe to Razorpay Migration
-- 002_stripe_to_razorpay.sql
-- ============================================================

ALTER TABLE public.profiles RENAME COLUMN stripe_customer_id TO razorpay_customer_id;
ALTER TABLE public.profiles RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;
