import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSignature, fetchPayment } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import {
  getPaymentByRazorpayId,
  provisionPaymentCredits,
} from "@/lib/db/queries";
import { isPaymentBoundToUser } from "@/lib/api-boundaries";
import { sendPaidSupportEmail } from "@/lib/email/lifecycle";
import { captureServerEvent } from "@/lib/posthog/server";
import { enforceApiRateLimit } from "@/lib/api-security";

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
      action: "payment_verify",
      limit: 20,
      windowSeconds: 60 * 60,
    });
    if (rateLimited) return rateLimited;

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
      if (
        existingPayment.user_id !== user.id ||
        existingPayment.razorpay_order_id !== razorpay_order_id
      ) {
        return NextResponse.json(
          { success: false, error: "Payment does not belong to this account" },
          { status: 409 }
        );
      }

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
    const paymentOrderId = payment.order_id as string | null;

    if (!isPaymentBoundToUser({
      pack,
      credits,
      paymentUserId: notes.userId,
      authenticatedUserId: user.id,
      paymentOrderId,
      submittedOrderId: razorpay_order_id,
    })) {
      return NextResponse.json(
        { success: false, error: "Invalid payment metadata" },
        { status: 400 }
      );
    }

    const customerId = (payment as unknown as Record<string, unknown>).customer_id as string | undefined;
    const provisioning = await provisionPaymentCredits({
      user_id: user.id,
      razorpay_order_id,
      razorpay_payment_id,
      pack,
      credits,
      amount: payment.amount as number,
      currency: payment.currency as string,
      customer_id: customerId,
    });

    if (!provisioning.processed) {
      const processedPayment = await getPaymentByRazorpayId(razorpay_payment_id);
      if (!processedPayment || processedPayment.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: "Payment was already processed for another account" },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          status: "already_processed",
          credits: processedPayment.credits,
        },
      });
    }

    await sendPaidSupportEmail({
      userId: user.id,
      credits,
      pack,
      amount: payment.amount as number,
      currency: payment.currency as string,
    });

    captureServerEvent(user.id, "payment_completed", {
      pack,
      credits,
      amount: payment.amount,
      currency: payment.currency,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });

    return NextResponse.json({
      success: true,
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: "verified",
        credits,
        new_balance: provisioning.profile?.interview_credits ?? credits,
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
