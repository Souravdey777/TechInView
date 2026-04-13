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
const PROFILE_NOT_FOUND_CODE = "PGRST116";

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

function createRedirectResponse(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.delete(REFERRAL_COOKIE_NAME);
  return response;
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
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError) {
        console.error("[auth/callback] Failed to load authenticated user", getUserError);
        return createRedirectResponse(`${origin}${next}`);
      }

      if (user) {
        let needsOnboarding = intent === "signup";
        let grantedBetaCreditsBalance: number | null = null;

        try {
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

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("target_company, experience_level, preferred_language, interviews_completed, interview_credits")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code !== PROFILE_NOT_FOUND_CODE) {
            console.error("[auth/callback] Failed to load profile", profileError);
          }

          needsOnboarding =
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

          if (shouldGrantBetaCredits) {
            try {
              const admin = createAdminClient();
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
            } catch (betaGrantError) {
              console.error("[auth/callback] Failed to grant beta credits", betaGrantError);
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
        } catch (postAuthError) {
          console.error("[auth/callback] Post-auth setup failed", postAuthError);
        }

        return createRedirectResponse(needsOnboarding ? `${origin}/onboarding` : `${origin}${next}`);
      }

      return createRedirectResponse(`${origin}${next}`);
    }

    console.error("[auth/callback] Failed to exchange auth code for session", error);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
