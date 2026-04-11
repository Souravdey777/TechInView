"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";
import { BETA_INVITE_CODE, BETA_CREDITS } from "@/lib/constants";
import { BrandLogo } from "@/components/shared/BrandLogo";

type OAuthProvider = "google" | "github";

export default function SignupPage() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const isBeta = ref === BETA_INVITE_CODE;
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setError(null);
    posthog?.capture("signup_clicked", { provider, ref: ref ?? undefined });
    try {
      const callbackUrl = new URL("/callback", window.location.origin);
      if (ref) callbackUrl.searchParams.set("ref", ref);

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

  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <BrandLogo size="lg" wordmarkClassName="text-2xl font-bold" />
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h1 className="text-xl font-bold text-brand-text text-center mb-2">
            Create your account
          </h1>
          {isBeta ? (
            <div className="flex flex-col items-center gap-2 mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 px-3 py-1 text-xs font-semibold text-brand-cyan">
                Beta Invite
              </span>
              <p className="text-brand-muted text-sm text-center">
                You&apos;ve been invited! Sign up for{" "}
                <span className="text-brand-cyan font-semibold">{BETA_CREDITS} free interviews</span>
              </p>
            </div>
          ) : (
            <p className="text-brand-muted text-sm text-center mb-8">
              Start with 1 free interview per week
            </p>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* Google */}
            <button
              onClick={() => handleOAuth("google")}
              disabled={loadingProvider !== null}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-brand-border bg-brand-card text-brand-text text-sm font-medium transition-all",
                "hover:bg-brand-surface hover:border-brand-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loadingProvider === "google" ? (
                <span className="w-5 h-5 border-2 border-brand-muted border-t-brand-cyan rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* GitHub */}
            <button
              onClick={() => handleOAuth("github")}
              disabled={loadingProvider !== null}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-brand-border bg-brand-card text-brand-text text-sm font-medium transition-all",
                "hover:bg-brand-surface hover:border-brand-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loadingProvider === "github" ? (
                <span className="w-5 h-5 border-2 border-brand-muted border-t-brand-cyan rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5 text-brand-text fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              Continue with GitHub
            </button>
          </div>

          <p className="text-brand-muted text-xs text-center mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-brand-muted text-sm mt-6">
          Already have an account?{" "}
          <Link
            href={ref ? `/login?ref=${ref}` : "/login"}
            className="text-brand-cyan hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
