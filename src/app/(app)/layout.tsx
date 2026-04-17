import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { MobileAppNav, Sidebar } from "@/components/shared/Sidebar";
import {
  CREDIT_PACKS,
  getDisplayPricingKey,
  getRegionForCountry,
} from "@/lib/constants";

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
  const country = (headersList.get("x-vercel-ip-country") ?? "US").toUpperCase();
  const { region, symbol } = getRegionForCountry(country);
  const displayKey = getDisplayPricingKey(region);
  const startingPrice = `${symbol}${CREDIT_PACKS.single.displayPrices[displayKey]}`;

  return (
    <div className="min-h-screen bg-brand-deep">
      <MobileAppNav userEmail={userEmail} startingPrice={startingPrice} />

      <div className="hidden lg:block">
        <Sidebar userEmail={userEmail} startingPrice={startingPrice} />
      </div>

      <main className="lg:ml-64 min-h-screen bg-brand-deep">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
