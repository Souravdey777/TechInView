import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/blog-seo";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

export const SUPPORT_EMAIL = "support@mail.techinview.dev";
export const LEGAL_LAST_UPDATED = "April 12, 2026";
export const LEGAL_LAST_UPDATED_ISO = "2026-04-12";

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy", description: "How TechInView collects, uses, and stores data." },
  { href: "/terms", label: "Terms", description: "Rules for accounts, interview credits, and platform usage." },
  { href: "/refunds", label: "Refunds", description: "When duplicate charges, missing credits, and unused packs can be reviewed." },
  { href: "/contact", label: "Contact", description: "Email support for billing, account, bug, and privacy requests." },
] as const;

export type LegalLink = (typeof LEGAL_LINKS)[number];
export type LegalHref = LegalLink["href"];

export function createSupportMailto(input: {
  subject?: string;
  body?: string;
} = {}) {
  const params = new URLSearchParams();

  if (input.subject) {
    params.set("subject", input.subject);
  }

  if (input.body) {
    params.set("body", input.body);
  }

  const query = params.toString();

  return query
    ? `mailto:${SUPPORT_EMAIL}?${query}`
    : `mailto:${SUPPORT_EMAIL}`;
}

export function createLegalMetadata(input: {
  path: LegalHref;
  title: string;
  description: string;
}): Metadata {
  const url = absoluteUrl(baseUrl, input.path);

  return {
    title: `${input.title} | TechInView`,
    description: input.description,
    authors: [{ name: "TechInView", url: baseUrl }],
    robots: { index: true, follow: true },
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      type: "website",
      url,
      siteName: "TechInView",
      locale: "en_US",
      images: [
        {
          url: DEFAULT_OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: `${input.title} - TechInView`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}
