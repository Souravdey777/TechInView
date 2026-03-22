import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import type Stripe from "stripe";

// Stripe requires the raw request body for signature verification,
// so this route must NOT use the default JSON body parser.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { success: false, error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = await constructWebhookEvent(rawBody, signature);
  } catch (_error) {
    // Signature verification failure — reject immediately
    return NextResponse.json(
      { success: false, error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // TODO: Provision access for the new subscriber:
        //   1. Extract userId from session.metadata.userId
        //   2. Extract customerId from session.customer (string)
        //   3. Extract subscriptionId from session.subscription (string)
        //   4. Determine plan from the price ID on the subscription line items
        //   5. Update profiles table: set plan, stripe_customer_id, stripe_subscription_id
        void session;
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // TODO: Sync subscription status changes:
        //   1. Look up profile by stripe_customer_id = subscription.customer
        //   2. Derive plan from subscription.items.data[0].price.id
        //   3. Handle status: "active" → keep plan, "past_due" → warn user, "canceled" → downgrade
        //   4. Update profiles table accordingly
        void subscription;
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // TODO: Downgrade the user to the free plan:
        //   1. Look up profile by stripe_customer_id = subscription.customer
        //   2. Set profile.plan = "free"
        //   3. Clear stripe_subscription_id
        //   4. Optionally send a "sorry to see you go" email via Resend
        void subscription;
        break;
      }

      default:
        // Unhandled event types are silently acknowledged to avoid Stripe retries
        break;
    }

    // Acknowledge receipt to Stripe — must respond within 30s
    return NextResponse.json({ received: true });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

