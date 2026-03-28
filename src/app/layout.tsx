import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TechInView — AI Mock Interview Platform",
  description:
    "Voice-powered AI mock interviews for software engineers. Practice DSA problems with a real-time AI interviewer, live code editor, and FAANG-calibrated scoring.",
  keywords: [
    "mock interview",
    "coding interview",
    "DSA practice",
    "FAANG interview prep",
    "AI interviewer",
    "technical interview",
    "voice interview",
  ],
  authors: [{ name: "TechInView" }],
  creator: "TechInView",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.ai"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://techinview.ai",
    siteName: "TechInView",
    title: "TechInView — AI Mock Interview Platform",
    description:
      "Voice-powered AI mock interviews for software engineers. Practice DSA with a real-time AI interviewer and get FAANG-calibrated feedback.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TechInView — AI Mock Interview Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TechInView — AI Mock Interview Platform",
    description:
      "Voice-powered AI mock interviews for software engineers. Practice DSA with a real-time AI interviewer and get FAANG-calibrated feedback.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <body
        className={`${sora.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <PostHogProvider>
          <div>{children}</div>
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
