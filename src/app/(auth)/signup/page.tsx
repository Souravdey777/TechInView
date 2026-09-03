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
import {
  BETA_CREDITS,
  BETA_INVITE_CODE,
  FREE_TRIAL_DURATION_MINUTES,
} from "@/lib/constants";

type OAuthProvider = "google" | "github";

export default function SignupPage() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const next = searchParams.get("next");
  const isBeta = ref === BETA_INVITE_CODE;
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setError(null);
    posthog?.capture("signup_clicked", { provider, ref: ref ?? undefined });
    try {
      const callbackUrl = new URL("/callback", window.location.origin);
      callbackUrl.searchParams.set("intent", "signup");
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

  const loginHref =
    ref || next
      ? `/login?${new URLSearchParams(
          Object.fromEntries(
            [
              ["ref", ref],
              ["next", next],
            ].filter((entry): entry is [string, string] => Boolean(entry[1]))
          )
        ).toString()}`
      : "/login";

  return (
    <AuthSplitLayout
      eyebrow={isBeta ? "Beta invite" : "Start free"}
      heading="Create account."
      panelHeadline="Practice against the interview you will actually sit."
      panelSupporting={`Free DSA practice on the full catalog, plus one ${FREE_TRIAL_DURATION_MINUTES}-minute audio round on the house.`}
      intro={
        isBeta ? (
          <div className="mt-5 flex flex-col items-start gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
              Beta Invite
            </span>
            <p className="text-sm text-brand-muted">
              You&apos;ve been invited! Sign up to get{" "}
              <span className="font-semibold text-brand-cyan">
                {BETA_CREDITS} full interview credits
              </span>
            </p>
          </div>
        ) : null
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="rounded-sm text-brand-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
          >
            Sign in
          </Link>
        </>
      }
      reassurance="By signing up, you agree to our Terms of Service and Privacy Policy. Rounds run best on desktop — voice, editor, and test output need the screen and a working microphone."
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
