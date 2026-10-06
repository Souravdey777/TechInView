import { NextResponse } from "next/server";
import { EARLY_ACCESS_DISCOUNT_PERCENT, EARLY_ACCESS_PURCHASE_LIMIT } from "@/lib/constants";
import { getCachedEarlyAccessSpotsLeft } from "@/lib/db/queries";

export const revalidate = 60;

/** Public offer status for the early access banner and exit popup. */
export async function GET() {
  const left = await getCachedEarlyAccessSpotsLeft();
  return NextResponse.json({ left, limit: EARLY_ACCESS_PURCHASE_LIMIT, percent: EARLY_ACCESS_DISCOUNT_PERCENT });
}
