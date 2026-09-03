import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/shared/AppNav";

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
    .select("display_name, interview_credits")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-brand-deep">
      <AppNav
        userEmail={userEmail}
        displayName={profile?.display_name ?? null}
        credits={profile?.interview_credits ?? 0}
      />

      <main className="min-h-screen bg-brand-deep">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
