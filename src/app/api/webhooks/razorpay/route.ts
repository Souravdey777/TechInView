import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import {
  getPaymentByRazorpayId,
  provisionPaymentCredits,
} from "@/lib/db/queries";
import { CREDIT_PACKS } from "@/lib/constants";
import { sendPaidSupportEmail } from "@/lib/email/lifecycle";

export const dynamic = "force-dynamic";

type RazorpayPaymentEntity = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  customer_id?: string;
  notes: Record<string, string>;
};

type RazorpayWebhookPayload = {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
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
        if (!payment) break;

        const existing = await getPaymentByRazorpayId(payment.id);
        if (existing) break;

        const { userId, pack, credits: creditsStr } = payment.notes;
        const credits = parseInt(creditsStr, 10);
        const creditPack = CREDIT_PACKS[pack as keyof typeof CREDIT_PACKS];

        if (!userId || !creditPack || credits !== creditPack.credits) {
          console.error("[razorpay-webhook] Missing notes on payment:", payment.id);
          break;
        }

        const provisioning = await provisionPaymentCredits({
          user_id: userId,
          razorpay_order_id: payment.order_id,
          razorpay_payment_id: payment.id,
          pack,
          credits,
          amount: payment.amount,
          currency: payment.currency,
          customer_id: payment.customer_id,
        });

        if (!provisioning.processed) break;

        await sendPaidSupportEmail({
          userId,
          credits,
          pack,
          amount: payment.amount,
          currency: payment.currency,
        });

        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment?.entity;
        if (payment) {
          console.error("[razorpay-webhook] Payment failed:", payment.id, payment.notes);
        }
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
