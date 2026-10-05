import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { GeistFonts } from "@/components/marketing/MarketingShell";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { SITE_NAME } from "@/lib/blog-seo";
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
  SITE_SOCIAL_DESCRIPTION,
  SITE_THEME_COLOR,
  getSiteUrl,
} from "@/lib/site-seo";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  // No title template: child routes already append "| TechInView" themselves.
  title: SITE_DEFAULT_TITLE,
  description: SITE_DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "mock interview",
    "AI mock interview",
    "coding interview practice",
    "DSA practice",
    "technical interview",
    "behavioral interview practice",
    "engineering manager interview",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Only feed discovery here. Canonicals are set per route; a root canonical
  // would be inherited by every page that forgets its own.
  alternates: {
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  // og:image comes from src/app/opengraph-image.tsx (X falls back to it when
  // twitter:image is absent). No og:url here for the same reason as above.
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_DEFAULT_TITLE,
    description: SITE_SOCIAL_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_SOCIAL_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: SITE_THEME_COLOR,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <GeistFonts />
      </head>
      {/* .theme-landing on <body> so every route, and Radix portals and toasts
          rendered straight into <body>, share the design system tokens and Geist. */}
      <body className="theme-landing bg-brand-deep font-sans text-brand-text antialiased">
        <PostHogProvider>
          <div>{children}</div>
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
