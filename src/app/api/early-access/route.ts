import { NextResponse } from "next/server";
import { EARLY_ACCESS_DISCOUNT_PERCENT, EARLY_ACCESS_PURCHASE_LIMIT } from "@/lib/constants";
import { getCachedEarlyAccessSpotsLeft, getProfile, hasCapturedPayment } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Paid user with rounds still in the bank: no need to pitch them the offer. */
async function isPaidWithRounds(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (!user) return false;
    const [profile, paid] = await Promise.all([getProfile(user.id), hasCapturedPayment(user.id)]);
    return paid && (profile?.interview_credits ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Offer status for the early access banner and exit popup. */
export async function GET() {
  const [left, paid] = await Promise.all([getCachedEarlyAccessSpotsLeft(), isPaidWithRounds()]);
  return NextResponse.json({ left, paid, limit: EARLY_ACCESS_PURCHASE_LIMIT, percent: EARLY_ACCESS_DISCOUNT_PERCENT });
}
