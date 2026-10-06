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
  EARLY_ACCESS_PURCHASE_LIMIT,
  FREE_TRIAL_DURATION_MINUTES,
  FULL_INTERVIEW_DURATION_MINUTES,
  earlyAccessPrice,
  getDisplayPricingKey,
  getRegionForCountry,
} from "@/lib/constants";

// Copy lives here so the offer can change without touching layout code.
const BANNER_TEXT = `Early access: ${EARLY_ACCESS_DISCOUNT_PERCENT}% off the first ${EARLY_ACCESS_PURCHASE_LIMIT} purchases.`;
const BANNER_HREF = "/#pricing";
const BANNER_CTA = "See pricing";
// Shown once the discounted spots are gone (or before the offer status loads).
const FREE_TEXT = "Early access is open. Try a free AI mock interview, no card needed.";
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

type Offer = { left: number; was: string; now: string };

let offerRequest: Promise<Offer | null> | null = null;

/** Live discount offer, or null once the spots are gone. Banner and popup share one request. */
function useEarlyAccessOffer() {
  const [offer, setOffer] = useState<Offer | null>(null);
  useEffect(() => {
    offerRequest ??= fetch("/api/early-access")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { left?: number } | null) => (d?.left ? { left: d.left, ...localSinglePrice() } : null))
      .catch(() => null);
    let live = true;
    offerRequest.then((o) => live && setOffer(o));
    return () => {
      live = false;
    };
  }, []);
  return offer;
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
  // Client-only (cookie + fetch), so the offer appears after mount and server/client markup match.
  const offer = useEarlyAccessOffer();

  useEffect(() => setDismissed(readFlag(BANNER_KEY)), []);

  if (dismissed || HIDE_ON.some((re) => re.test(pathname))) return null;

  return (
    <div className="relative border-b border-brand-cyan/20 bg-brand-cyan/[0.08] px-10 py-2 text-center text-[13px] text-brand-text">
      <span className="mr-1.5 rounded-full bg-brand-cyan/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-brand-cyan">
        Early access
      </span>
      {offer ? (
        <>
          {BANNER_TEXT} <span className="whitespace-nowrap text-brand-cyan">{offer.left} left.</span>{" "}
          <span className="mr-1 whitespace-nowrap tabular-nums">
            <span className="sr-only">One interview, was {offer.was}, now {offer.now}.</span>
            <span aria-hidden>
              1 interview <s className="text-brand-subtle">{offer.was}</s>{" "}
              <span className="font-medium text-brand-text">{offer.now}</span>
            </span>
          </span>{" "}
          <Link
            href={BANNER_HREF}
            onClick={() => ph?.capture("early_access_banner_clicked", { pathname, offer: "discount", left: offer.left })}
            className="whitespace-nowrap font-medium text-brand-cyan underline-offset-4 hover:underline"
          >
            {BANNER_CTA} →
          </Link>
        </>
      ) : (
        <>
          {FREE_TEXT}{" "}
          <Link
            href={CTA_HREF}
            onClick={() => ph?.capture("early_access_banner_clicked", { pathname, offer: "free_trial" })}
            className="whitespace-nowrap font-medium text-brand-cyan underline-offset-4 hover:underline"
          >
            {CTA_LABEL} →
          </Link>
        </>
      )}
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
  const offer = useEarlyAccessOffer();

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
        {offer ? (
          <>
            <DialogTitle className="mt-2 text-2xl font-medium tracking-tight text-brand-text">
              Before you go, {EARLY_ACCESS_DISCOUNT_PERCENT}% off
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-relaxed text-brand-muted">
              For the first {EARLY_ACCESS_PURCHASE_LIMIT} purchases only, {offer.left} left. A full{" "}
              {FULL_INTERVIEW_DURATION_MINUTES}-minute AI interview with Tia and a scorecard for{" "}
              <s className="text-brand-subtle">{offer.was}</s> <span className="font-medium text-brand-text">{offer.now}</span>.
            </DialogDescription>
            <Link
              href={BANNER_HREF}
              onClick={() => {
                setOpen(false);
                ph?.capture("early_access_exit_popup_clicked", { cta: "pricing", left: offer.left });
              }}
              className={`${BTN_PRIMARY} mt-6 w-full justify-center`}
            >
              Claim {EARLY_ACCESS_DISCOUNT_PERCENT}% off →
            </Link>
            <Link
              href={CTA_HREF}
              onClick={() => ph?.capture("early_access_exit_popup_clicked", { cta: "free_trial" })}
              className="mt-3 inline-block text-sm text-brand-muted underline-offset-4 hover:text-brand-text hover:underline"
            >
              Or try a free {FREE_TRIAL_DURATION_MINUTES}-minute trial, no card needed
            </Link>
          </>
        ) : (
          <>
            <DialogTitle className="mt-2 text-2xl font-medium tracking-tight text-brand-text">
              Before you go, try one round
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-relaxed text-brand-muted">
              Talk through a real coding problem with Tia, our AI interviewer, in a free{" "}
              {FREE_TRIAL_DURATION_MINUTES}-minute trial. You get a scorecard at the end. No card needed.
            </DialogDescription>
            <Link
              href={CTA_HREF}
              onClick={() => ph?.capture("early_access_exit_popup_clicked", { cta: "free_trial" })}
              className={`${BTN_PRIMARY} mt-6 w-full justify-center`}
            >
              {CTA_LABEL} →
            </Link>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
