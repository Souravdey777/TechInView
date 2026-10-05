import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const site = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

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
  return <MarketingShell>{children}</MarketingShell>;
}
