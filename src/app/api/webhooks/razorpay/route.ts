import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

type RazorpayWebhookPayload = {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: { entity: Record<string, unknown> };
    subscription?: { entity: Record<string, unknown> };
  };
  created_at: number;
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json(
      { success: false, error: "Missing x-razorpay-signature header" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  try {
    const valid = verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    const event = JSON.parse(rawBody) as RazorpayWebhookPayload;

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment?.entity;

        // TODO: Provision access for the paid user:
        //   1. Extract userId from payment.notes.userId
        //   2. Extract orderId from payment.order_id
        //   3. Determine credit pack from the order amount
        //   4. Credit interview_credits in profiles table
        //   5. Store razorpay_customer_id if available
        void payment;
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment?.entity;

        // TODO: Handle failed payment:
        //   1. Log the failure for debugging
        //   2. Optionally notify the user
        void payment;
        break;
      }

      case "subscription.activated": {
        const subscription = event.payload.subscription?.entity;

        // TODO: Activate subscription:
        //   1. Look up profile by razorpay_customer_id
        //   2. Set plan to the appropriate tier
        //   3. Store razorpay_subscription_id
        void subscription;
        break;
      }

      case "subscription.cancelled": {
        const subscription = event.payload.subscription?.entity;

        // TODO: Downgrade the user:
        //   1. Look up profile by razorpay_customer_id
        //   2. Set plan = "free"
        //   3. Clear razorpay_subscription_id
        void subscription;
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
