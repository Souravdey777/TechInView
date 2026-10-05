import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function HowAiEvaluatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
