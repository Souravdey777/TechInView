"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/hooks/useSupabase";
import {
  AuthDivider,
  AuthErrorBanner,
  AuthSplitLayout,
} from "@/components/auth/AuthSplitLayout";
import { AuthProviderButton } from "@/components/auth/AuthProviderButton";
import { FREE_TRIAL_DURATION_MINUTES } from "@/lib/constants";

type OAuthProvider = "google" | "github";

export default function LoginPage() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const next = searchParams.get("next");
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setError(null);
    posthog?.capture("login_clicked", { provider });
    try {
      const callbackUrl = new URL("/callback", window.location.origin);
      callbackUrl.searchParams.set("intent", "login");
      if (ref) callbackUrl.searchParams.set("ref", ref);
      if (next) callbackUrl.searchParams.set("next", next);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoadingProvider(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoadingProvider(null);
    }
  };

  const signupHref =
    ref || next
      ? `/signup?${new URLSearchParams(
          Object.fromEntries(
            [
              ["ref", ref],
              ["next", next],
            ].filter((entry): entry is [string, string] => Boolean(entry[1]))
          )
        ).toString()}`
      : "/signup";

  return (
    <AuthSplitLayout
      eyebrow="Welcome back"
      heading="Log in."
      panelHeadline="Your interviewers are still awake."
      panelSupporting={`Pick up practice where you left off, or spend your ${FREE_TRIAL_DURATION_MINUTES}-minute audio preview on a company persona.`}
      footer={
        <>
          No account yet?{" "}
          <Link
            href={signupHref}
            className="rounded-sm text-brand-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
          >
            Start free
          </Link>
        </>
      }
      reassurance="Rounds run best on desktop. Voice, editor, and test output need the screen and a working microphone."
    >
      {error && <AuthErrorBanner message={error} />}

      <div className="flex flex-col gap-3">
        <AuthProviderButton
          provider="google"
          loading={loadingProvider === "google"}
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth("google")}
        />

        <AuthDivider />

        <AuthProviderButton
          provider="github"
          loading={loadingProvider === "github"}
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth("github")}
        />
      </div>
    </AuthSplitLayout>
  );
}
