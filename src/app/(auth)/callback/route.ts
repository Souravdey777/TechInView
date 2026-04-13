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

function getUserAvatarUrl(
  user: {
    user_metadata?: Record<string, unknown>;
  }
) {
  return typeof user.user_metadata?.avatar_url === "string"
    ? user.user_metadata.avatar_url
    : null;
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

          let { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("target_company, experience_level, preferred_language, interviews_completed, interview_credits")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code !== PROFILE_NOT_FOUND_CODE) {
            console.error("[auth/callback] Failed to load profile", profileError);
          }

          if (!profile && profileError?.code === PROFILE_NOT_FOUND_CODE) {
            const { data: createdProfile, error: createProfileError } = await supabase
              .from("profiles")
              .upsert({
                id: user.id,
                display_name: getUserDisplayName(user),
                avatar_url: getUserAvatarUrl(user),
              })
              .select("target_company, experience_level, preferred_language, interviews_completed, interview_credits")
              .single();

            if (createProfileError) {
              console.error("[auth/callback] Failed to create missing profile", createProfileError);
            } else {
              profile = createdProfile;
              profileError = null;
            }
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
            betaCreditsGrantedAt == null;

          if (shouldGrantBetaCredits) {
            try {
              const nextCredits = (profile?.interview_credits ?? 0) + BETA_CREDITS;
              const { data: updatedProfile, error: profileUpdateError } = await supabase
                .from("profiles")
                .upsert({
                  id: user.id,
                  display_name: getUserDisplayName(user),
                  avatar_url: getUserAvatarUrl(user),
                  interview_credits: nextCredits,
                  has_used_free_trial: true,
                })
                .select("interview_credits")
                .single();

              if (profileUpdateError) {
                throw profileUpdateError;
              }

              grantedBetaCreditsBalance = updatedProfile?.interview_credits ?? null;
              profile = profile
                ? { ...profile, interview_credits: grantedBetaCreditsBalance }
                : {
                    target_company: null,
                    experience_level: null,
                    preferred_language: null,
                    interviews_completed: 0,
                    interview_credits: grantedBetaCreditsBalance,
                  };

              const { error: metadataUpdateError } = await supabase.auth.updateUser({
                data: {
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
