"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/hooks/useSupabase";
import {
  AuthDivider,
  AUTH_LINK,
  AuthErrorBanner,
  AuthNote,
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
      kicker="Voice-first AI mock interviews"
      eyebrow={isBeta ? "Beta invite" : "Start free"}
      heading="Create account."
      panelHeadline="Practice against the interview you will actually sit."
      panelSupporting={`Free solo practice on a curated set of DSA problems, plus one ${FREE_TRIAL_DURATION_MINUTES}-minute voice interview on the house.`}
      intro={
        isBeta ? (
          <AuthNote title="Your invite">
            Sign up with this invite and your account starts with{" "}
            <span className="text-brand-cyan">{BETA_CREDITS} full interview credits</span>.
          </AuthNote>
        ) : null
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={loginHref}
            className={AUTH_LINK}
          >
            Log in
          </Link>
        </>
      }
      reassurance={
        <>
          By signing up, you agree to our{" "}
          <Link href="/terms" className={AUTH_LINK}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className={AUTH_LINK}>
            Privacy Policy
          </Link>
          . Interviews work best on a desktop or laptop with a working microphone, since the voice panel, editor and
          test output share the screen.
        </>
      }
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
