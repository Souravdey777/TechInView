import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const dynamic = "force-dynamic";

// Login, signup and onboarding are account screens, not search landing pages.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell chrome={false}>{children}</MarketingShell>;
}
