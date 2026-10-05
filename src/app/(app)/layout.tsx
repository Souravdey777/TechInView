import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/shared/AppNav";
import { CONTAINER, PAD } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userEmail = user.email ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, username, is_public_profile, interview_credits")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-brand-deep selection:bg-brand-cyan selection:text-brand-deep">
      <AppNav
        userEmail={userEmail}
        displayName={profile?.display_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        username={profile?.username ?? null}
        isPublicProfile={profile?.is_public_profile ?? false}
        credits={profile?.interview_credits ?? 0}
      />

      <main className="min-h-screen">
        <div className={cn(CONTAINER, PAD, "py-10 sm:py-14")}>
          {children}
        </div>
      </main>
    </div>
  );
}
