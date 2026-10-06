import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS, earlyAccessPrice, getRegionForCountry } from "@/lib/constants";
import { captureServerEvent } from "@/lib/posthog/server";
import { enforceApiRateLimit } from "@/lib/api-security";
import { reserveEarlyAccessOrder } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rateLimited = await enforceApiRateLimit({
      userId: user.id,
      action: "payment_create_order",
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (rateLimited) return rateLimited;

    const { pack } = (await req.json()) as { pack: string };

    const creditPack = CREDIT_PACKS[pack as keyof typeof CREDIT_PACKS];
    if (!creditPack) {
      return NextResponse.json(
        { success: false, error: "Invalid interview pack" },
        { status: 400 }
      );
    }

    // Price from Vercel's geo header, never the request body: a client-sent country could claim a cheaper region.
    // Same source and fallback as the pages that display prices, so charge and display agree.
    const country = (req.headers.get("x-vercel-ip-country") ?? "US").toUpperCase();
    const { region, currency } = getRegionForCountry(country);
    const listAmount = creditPack.prices[region];
    const newOrder = (amount: number) =>
      createOrder(amount, currency, `rcpt_${user.id.slice(0, 8)}_${Date.now()}`, {
        userId: user.id,
        pack,
        credits: String(creditPack.credits),
      });

    // prices are in minor units; discount whole currency units so the charge matches the displayed price.
    const discounted = await reserveEarlyAccessOrder({
      userId: user.id,
      pack,
      amount: earlyAccessPrice(listAmount / 100) * 100,
      currency,
      createOrder: newOrder,
    });
    const earlyAccess = discounted !== null;
    const order = discounted ?? (await newOrder(listAmount));
    const amount = order.amount;

    captureServerEvent(user.id, "payment_initiated", {
      pack,
      amount,
      list_amount: listAmount,
      early_access: earlyAccess,
      currency,
      region,
      credits: creditPack.credits,
      order_id: order.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        pack_label: creditPack.label,
        credits: creditPack.credits,
      },
    });
  } catch (error: unknown) {
    const errDetail =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
    console.error("Create order error:", JSON.stringify(errDetail, null, 2));
    
    let message = "Failed to create order";
    if (error instanceof Error) {
      message = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "error" in error
    ) {
      const razorpayErr = error as { error: { description?: string } };
      message = razorpayErr.error?.description ?? message;
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
