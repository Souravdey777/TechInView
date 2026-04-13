import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent, identifyServerUser } from "@/lib/posthog/server";
import {
  BETA_CREDITS,
  BETA_INVITE_CODE,
  REFERRAL_COOKIE_NAME,
} from "@/lib/constants";
import {
  sendBetaWelcomeEmail,
  sendWelcomeEmail,
} from "@/lib/email/lifecycle";
import { createAdminClient } from "@/lib/supabase/admin";

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;

function isRecentlyCreatedUser(createdAt: string | undefined) {
  if (!createdAt) {
    return false;
  }

  const createdAtMs = Date.parse(createdAt);
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  return Date.now() - createdAtMs <= SIGNUP_WINDOW_MS;
}

function getUserDisplayName(
  user: {
    user_metadata?: Record<string, unknown>;
  }
) {
  return (
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    null
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent");
  const ref = searchParams.get("ref") ?? request.cookies.get(REFERRAL_COOKIE_NAME)?.value;
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        identifyServerUser(user.id, {
          email: user.email,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
          provider: user.app_metadata?.provider,
        });
        captureServerEvent(user.id, "user_signed_up", {
          provider: user.app_metadata?.provider,
          ref: ref ?? undefined,
        });

        const admin = createAdminClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("target_company, experience_level, preferred_language, interviews_completed, interview_credits")
          .eq("id", user.id)
          .single();

        const needsOnboarding =
          !profile?.target_company ||
          !profile?.experience_level ||
          !profile?.preferred_language;

        const isFreshSignup =
          intent === "signup" &&
          needsOnboarding &&
          (profile?.interviews_completed ?? 0) === 0 &&
          isRecentlyCreatedUser(user.created_at);

        const betaCreditsGrantedAt =
          typeof user.user_metadata?.beta_credits_granted_at === "string"
            ? user.user_metadata.beta_credits_granted_at
            : null;
        const shouldGrantBetaCredits =
          ref === BETA_INVITE_CODE &&
          betaCreditsGrantedAt == null &&
          (isFreshSignup || intent === "login");

        let grantedBetaCreditsBalance: number | null = null;
        if (shouldGrantBetaCredits) {
          const { data: updatedProfile, error: profileUpdateError } = await admin
            .from("profiles")
            .update({
              interview_credits: (profile?.interview_credits ?? 0) + BETA_CREDITS,
              has_used_free_trial: true,
            })
            .eq("id", user.id)
            .select("interview_credits")
            .single();

          if (profileUpdateError) {
            throw profileUpdateError;
          }

          grantedBetaCreditsBalance = updatedProfile?.interview_credits ?? null;

          const { error: metadataUpdateError } = await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(user.user_metadata ?? {}),
              beta_credits_granted_at: new Date().toISOString(),
            },
          });

          if (metadataUpdateError) {
            console.error("[auth/callback] Failed to persist beta grant marker", metadataUpdateError);
          }
        }

        if (grantedBetaCreditsBalance != null) {
          captureServerEvent(user.id, "beta_credits_granted", {
            credits: BETA_CREDITS,
            new_balance: grantedBetaCreditsBalance,
            ref,
            intent: intent ?? undefined,
          });
        }

        if (isFreshSignup && ref === BETA_INVITE_CODE && grantedBetaCreditsBalance != null && user.email) {
          await sendBetaWelcomeEmail({
            email: user.email,
            name: getUserDisplayName(user),
          });
        } else if (isFreshSignup && user.email) {
          await sendWelcomeEmail({
            email: user.email,
            name: getUserDisplayName(user),
          });
        }

        const redirectUrl = needsOnboarding ? `${origin}/onboarding` : `${origin}${next}`;
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete(REFERRAL_COOKIE_NAME);
        return response;
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete(REFERRAL_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
