import { MarketingNav } from "@/components/landing/MarketingNav";
import { MarketingFooter } from "@/components/landing/MarketingFooter";

export default function HowAiEvaluatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-brand-deep text-brand-text">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter signupHref="/login" />
    </div>
  );
}
