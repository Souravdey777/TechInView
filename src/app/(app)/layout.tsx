import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  const headersList = headers();
  const country = headersList.get("x-vercel-ip-country") ?? "US";
  const isIndia = country === "IN";

  return (
    <div className="min-h-screen bg-brand-deep">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar userEmail={userEmail} isIndia={isIndia} />
      </div>

      {/* Main content area */}
      <main className="lg:ml-64 min-h-screen bg-brand-deep">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
