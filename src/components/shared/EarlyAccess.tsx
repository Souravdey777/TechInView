"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BTN_PRIMARY } from "@/components/marketing/ds";
import {
  COUNTRY_COOKIE,
  CREDIT_PACKS,
  EARLY_ACCESS_DISCOUNT_PERCENT,
  FREE_TRIAL_DURATION_MINUTES,
  earlyAccessPrice,
  getDisplayPricingKey,
  getRegionForCountry,
} from "@/lib/constants";

// Copy lives here so the offer can change without touching layout code.
const BANNER_TEXT = `Early access: ${EARLY_ACCESS_DISCOUNT_PERCENT}% off every interview pack.`;
const BANNER_HREF = "/#pricing";
const BANNER_CTA = "See pricing";
const CTA_HREF = "/signup";
const CTA_LABEL = "Try it free";

const BANNER_KEY = "tiv-early-access-banner-dismissed";
const EXIT_KEY = "tiv-early-access-exit-shown";

// Live interview rooms are full-height and must stay distraction-free.
// Setup and results pages still get the banner.
const HIDE_ON = [/^\/interview\/(?!setup)[^/]+/, /^\/interviews\/[^/]+\/(?!setup|results)[^/]+$/];

/** Single-interview list and early-access price in the visitor's currency, from the middleware's country cookie. */
function localSinglePrice() {
  const country = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([A-Z]{2})`))?.[1] ?? "US";
  const { region, symbol } = getRegionForCountry(country);
  const full = CREDIT_PACKS.single.displayPrices[getDisplayPricingKey(region)];
  const fmt = (n: number) => `${symbol}${n.toLocaleString(region === "INR" ? "en-IN" : "en-US")}`;
  return { was: fmt(full), now: fmt(earlyAccessPrice(full)) };
}

function readFlag(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {}
}

export function EarlyAccessBanner() {
  const pathname = usePathname();
  const ph = usePostHog();
  // Start hidden-safe: render on the server, hide after mount if dismissed.
  const [dismissed, setDismissed] = useState(false);
  // Cookie is client-only; the price appears after mount so server and client markup match.
  const [price, setPrice] = useState<{ was: string; now: string } | null>(null);

  useEffect(() => {
    setDismissed(readFlag(BANNER_KEY));
    setPrice(localSinglePrice());
  }, []);

  if (dismissed || HIDE_ON.some((re) => re.test(pathname))) return null;

  return (
    <div className="relative border-b border-brand-cyan/20 bg-brand-cyan/[0.08] px-10 py-2 text-center text-[13px] text-brand-text">
      <span className="mr-1.5 rounded-full bg-brand-cyan/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-brand-cyan">
        Early access
      </span>
      {BANNER_TEXT}{" "}
      {price && (
        <span className="mr-1 whitespace-nowrap tabular-nums">
          <span className="sr-only">One interview, was {price.was}, now {price.now}.</span>
          <span aria-hidden>
            1 interview <s className="text-brand-subtle">{price.was}</s>{" "}
            <span className="font-medium text-brand-text">{price.now}</span>
          </span>
        </span>
      )}{" "}
      <Link
        href={BANNER_HREF}
        onClick={() => ph?.capture("early_access_banner_clicked", { pathname, price: price?.now })}
        className="whitespace-nowrap font-medium text-brand-cyan underline-offset-4 hover:underline"
      >
        {BANNER_CTA} →
      </Link>
      <button
        type="button"
        aria-label="Dismiss early access banner"
        onClick={() => {
          setFlag(BANNER_KEY);
          setDismissed(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-brand-muted hover:bg-white/[0.06] hover:text-brand-text"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Exit-intent offer for public pages: opens once per session when a desktop
 * pointer leaves through the top of the window (towards the tab bar / URL bar).
 * ponytail: no mobile trigger, there is no reliable exit signal on touch devices.
 */
export function ExitIntentOffer() {
  const ph = usePostHog();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readFlag(EXIT_KEY) || !window.matchMedia("(pointer: fine)").matches) return;

    const armedAt = Date.now() + 5000; // ignore stray movements right after load
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 0 || Date.now() < armedAt) return;
      setFlag(EXIT_KEY);
      setOpen(true);
      ph?.capture("early_access_exit_popup_shown");
      document.removeEventListener("mouseout", onLeave);
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [ph]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-wider text-brand-cyan">Early access</p>
        <DialogTitle className="mt-2 text-2xl font-medium tracking-tight text-brand-text">
          Before you go, try one round
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-relaxed text-brand-muted">
          Talk through a real coding problem with Tia, our AI interviewer, in a free{" "}
          {FREE_TRIAL_DURATION_MINUTES}-minute trial. You get a scorecard at the end. No card needed.
        </DialogDescription>
        <Link
          href={CTA_HREF}
          onClick={() => ph?.capture("early_access_exit_popup_clicked")}
          className={`${BTN_PRIMARY} mt-6 w-full justify-center`}
        >
          {CTA_LABEL} →
        </Link>
      </DialogContent>
    </Dialog>
  );
}
