import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServerEvent, identifyServerUser } from "@/lib/posthog/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
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
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
