import type { Metadata } from "next";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { MarketingFooter } from "@/components/landing/MarketingFooter";

const site = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.ai";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": `${site.replace(/\/$/, "")}/blog/rss.xml`,
    },
  },
};

export default function BlogLayout({
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
