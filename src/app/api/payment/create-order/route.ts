import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS, getRegionForCountry } from "@/lib/constants";

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

    const creditPack = CREDIT_PACKS[pack];
    if (!creditPack) {
      return NextResponse.json(
        { success: false, error: "Invalid credit pack" },
        { status: 400 }
      );
    }

    const country = country_code ?? "US";
    const { region, currency } = getRegionForCountry(country);
    const amount = creditPack.prices[region];

    const order = await createOrder(
      amount,
      currency,
      `receipt_${user.id}_${Date.now()}`,
      {
        userId: user.id,
        pack,
        credits: String(creditPack.credits),
      }
    );

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
  } catch (error) {
    console.error("Create order error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
