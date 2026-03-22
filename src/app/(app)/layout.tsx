import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/shared/Sidebar";

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

  return (
    <div className="min-h-screen bg-brand-deep">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar userEmail={userEmail} />
      </div>

      {/* Main content area */}
      <main className="lg:ml-64 min-h-screen bg-brand-deep">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
