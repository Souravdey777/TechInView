import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
