"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutProps = {
  packId: string;
  countryCode: string;
  userName?: string;
  userEmail?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

let scriptLoaded = false;
let scriptLoading = false;

function loadRazorpayScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (scriptLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.body.appendChild(script);
  });
}

export function RazorpayCheckout({
  packId,
  countryCode,
  userName,
  userEmail,
  children,
  className,
  disabled,
}: RazorpayCheckoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRazorpayScript().catch(() => {});
  }, []);

  const handleBuy = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: packId, country_code: countryCode }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        toast({ title: "Order failed", description: orderData.error, variant: "error" });
        setLoading(false);
        return;
      }

      const { order_id, amount, currency, key_id, pack_label } = orderData.data;

      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency,
        name: "TechInView",
        description: `${pack_label} — Interview Pack`,
        order_id,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: { color: "#22d3ee" },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              const end = Date.now() + 800;
              const frame = () => {
                confetti({
                  particleCount: 3,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0, y: 0.7 },
                  colors: ["#22d3ee", "#34d399", "#fbbf24"],
                });
                confetti({
                  particleCount: 3,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1, y: 0.7 },
                  colors: ["#22d3ee", "#34d399", "#fbbf24"],
                });
                if (Date.now() < end) requestAnimationFrame(frame);
              };
              frame();

              toast({
                title: "Payment successful!",
                description: `${verifyData.data.credits} full interview credit${verifyData.data.credits > 1 ? "s" : ""} added to your account.`,
                variant: "success",
              });
              router.refresh();
            } else {
              toast({
                title: "Verification failed",
                description: verifyData.error ?? "Please contact support if credits are missing.",
                variant: "error",
              });
            }
          } catch {
            toast({
              title: "Verification error",
              description: "Payment may have succeeded. Credits will be added shortly.",
              variant: "error",
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      rzp.on("payment.failed", () => {
        toast({
          title: "Payment failed",
          description: "Please try again or use a different payment method.",
          variant: "error",
        });
        setLoading(false);
      });

      rzp.open();
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not initiate checkout. Please try again.",
        variant: "error",
      });
      setLoading(false);
    }
  }, [loading, disabled, packId, countryCode, userName, userEmail, router]);

  return (
    <button
      type="button"
      onClick={handleBuy}
      disabled={loading || disabled}
      className={cn(
        "relative inline-flex items-center justify-center transition-colors",
        loading && "cursor-wait",
        className
      )}
    >
      {loading && (
        <Loader2 className="absolute w-4 h-4 animate-spin" />
      )}
      <span className={cn(loading && "invisible")}>{children}</span>
    </button>
  );
}
