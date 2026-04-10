import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS, getRegionForCountry } from "@/lib/constants";
import { captureServerEvent } from "@/lib/posthog/server";

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

    const { pack, country_code } = (await req.json()) as {
      pack: string;
      country_code?: string;
    };

    const creditPack = CREDIT_PACKS[pack as keyof typeof CREDIT_PACKS];
    if (!creditPack) {
      return NextResponse.json(
        { success: false, error: "Invalid interview pack" },
        { status: 400 }
      );
    }

    const country = country_code?.toUpperCase() ?? "US";
    const { region, currency } = getRegionForCountry(country);
    const amount = creditPack.prices[region];

    const order = await createOrder(
      amount,
      currency,
      `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
      {
        userId: user.id,
        pack,
        credits: String(creditPack.credits),
      }
    );

    captureServerEvent(user.id, "payment_initiated", {
      pack,
      amount,
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
