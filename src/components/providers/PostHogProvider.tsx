"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { initPostHog, posthog } from "@/lib/posthog/client";
import { useSupabase } from "@/hooks/useSupabase";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) url += `?${search}`;
      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

function PostHogIdentify() {
  const { user } = useSupabase();
  const ph = usePostHog();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ph) return;

    if (user && identifiedRef.current !== user.id) {
      ph.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
      });
      identifiedRef.current = user.id;
    }

    if (!user && identifiedRef.current) {
      ph.reset();
      identifiedRef.current = null;
    }
  }, [user, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}
