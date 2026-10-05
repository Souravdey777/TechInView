import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
