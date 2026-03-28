import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, fetchPayment } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import {
  getPaymentByRazorpayId,
  insertPayment,
  incrementCredits,
  updateProfile,
} from "@/lib/db/queries";

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

    const existingPayment = await getPaymentByRazorpayId(razorpay_payment_id);
    if (existingPayment) {
      return NextResponse.json({
        success: true,
        data: {
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          status: "already_processed",
          credits: existingPayment.credits,
        },
      });
    }

    const payment = await fetchPayment(razorpay_payment_id);

    if (payment.status !== "captured") {
      return NextResponse.json(
        { success: false, error: "Payment not captured" },
        { status: 400 }
      );
    }

    const notes = payment.notes as Record<string, string>;
    const credits = parseInt(notes.credits, 10);
    const pack = notes.pack;

    if (!credits || !pack) {
      return NextResponse.json(
        { success: false, error: "Invalid payment metadata" },
        { status: 400 }
      );
    }

    await insertPayment({
      user_id: user.id,
      razorpay_order_id,
      razorpay_payment_id,
      pack,
      credits,
      amount: payment.amount as number,
      currency: payment.currency as string,
    });

    const updatedProfile = await incrementCredits(user.id, credits);

    const customerId = (payment as unknown as Record<string, unknown>).customer_id as string | undefined;
    if (customerId) {
      await updateProfile(user.id, { razorpay_customer_id: customerId });
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: "verified",
        credits,
        new_balance: updatedProfile?.interview_credits ?? credits,
      },
    });
  } catch (error: unknown) {
    console.error("Payment verify error:", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
