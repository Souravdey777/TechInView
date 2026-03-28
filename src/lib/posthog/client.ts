import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY || POSTHOG_KEY === "phc_...") return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: false, // manually tracked on route change for App Router
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
}

export { posthog };
