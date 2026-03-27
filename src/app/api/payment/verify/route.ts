import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, fetchPayment } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      (await req.json()) as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const payment = await fetchPayment(razorpay_payment_id);

    if (payment.status !== "captured") {
      return NextResponse.json(
        { success: false, error: "Payment not captured" },
        { status: 400 }
      );
    }

    // TODO: Credit the user's interview balance:
    //   1. Extract credits count from payment.notes.credits
    //   2. Increment profiles.interview_credits by that amount
    //   3. Store razorpay_customer_id on the profile if not already set

    return NextResponse.json({
      success: true,
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: "verified",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
