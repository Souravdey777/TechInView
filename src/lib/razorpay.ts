import Razorpay from "razorpay";
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from "razorpay/dist/utils/razorpay-utils";

let _razorpay: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables must be set."
      );
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

export async function createOrder(
  amount: number,
  currency: string,
  receipt: string,
  notes?: Record<string, string>
): Promise<{ id: string; amount: number; currency: string; status: string }> {
  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });

  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
    status: order.status,
  };
}

export async function fetchOrder(orderId: string) {
  const razorpay = getRazorpayClient();
  return razorpay.orders.fetch(orderId);
}

export async function fetchPayment(paymentId: string) {
  const razorpay = getRazorpayClient();
  return razorpay.payments.fetch(paymentId);
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET environment variable is not set.");
  }

  return validatePaymentVerification(
    { order_id: orderId, payment_id: paymentId },
    signature,
    process.env.RAZORPAY_KEY_SECRET
  );
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error(
      "RAZORPAY_WEBHOOK_SECRET environment variable is not set."
    );
  }

  return validateWebhookSignature(
    body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );
}

export { getRazorpayClient };
