import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/landing/MarketingNav";

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
    <div className="min-h-screen bg-brand-deep text-brand-text overflow-x-hidden">
      <MarketingNav />
      {children}
      <footer className="py-10 px-4 border-t border-brand-border mt-auto">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
          <span className="font-heading font-semibold text-brand-text">
            TechInView<span className="text-brand-cyan">.</span>
          </span>
          <Link href="/" className="hover:text-brand-text transition-colors">
            Back to product
          </Link>
        </div>
      </footer>
    </div>
  );
}
