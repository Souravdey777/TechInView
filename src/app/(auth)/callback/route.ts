import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent, identifyServerUser } from "@/lib/posthog/server";
import { BETA_INVITE_CODE, BETA_CREDITS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const ref = searchParams.get("ref");
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

        const { data: profile } = await supabase
          .from("profiles")
          .select("target_company, experience_level, preferred_language, interviews_completed, interview_credits")
          .eq("id", user.id)
          .single();

        const needsOnboarding =
          !profile?.target_company ||
          !profile?.experience_level ||
          !profile?.preferred_language;

        const isNewUser =
          needsOnboarding &&
          (profile?.interviews_completed ?? 0) === 0;

        if (isNewUser && ref === BETA_INVITE_CODE) {
          await supabase
            .from("profiles")
            .update({ interview_credits: BETA_CREDITS, has_used_free_trial: true })
            .eq("id", user.id);

          captureServerEvent(user.id, "beta_credits_granted", {
            credits: BETA_CREDITS,
            ref,
          });
        }

        if (needsOnboarding) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
