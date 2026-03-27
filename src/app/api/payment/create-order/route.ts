import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CREDIT_PACKS: Record<
  string,
  { credits: number; amount_inr: number; label: string }
> = {
  single: { credits: 1, amount_inr: 34900, label: "1 Interview" },
  "3pack": { credits: 3, amount_inr: 79900, label: "3-Pack" },
  "5pack": { credits: 5, amount_inr: 109900, label: "5-Pack" },
};

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

    const { pack } = (await req.json()) as { pack: string };
    const creditPack = CREDIT_PACKS[pack];

    if (!creditPack) {
      return NextResponse.json(
        { success: false, error: "Invalid credit pack" },
        { status: 400 }
      );
    }

    const order = await createOrder(
      creditPack.amount_inr,
      "INR",
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
