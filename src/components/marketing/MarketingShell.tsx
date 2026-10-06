import type { ReactNode } from "react";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { cn } from "@/lib/utils";

const NOISE =
  "url(\"data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
  ) +
  "\")";

/** Geist / Geist Mono, loaded once by the root layout (not part of next/font in this Next version). */
export function GeistFonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap"
      />
    </>
  );
}

type MarketingShellProps = {
  children: ReactNode;
  loginHref?: string;
  signupHref?: string;
  /** Nav CTA label, for pages selling something other than interviews. */
  ctaLabel?: string;
  /** Hide the header and footer, e.g. for focused auth screens. */
  chrome?: boolean;
  className?: string;
};

/**
 * Frame for every public page: landing theme tokens (also on <body>), film grain,
 * skip link, header and footer. Pages render <section>s inside it.
 */
export function MarketingShell({
  children,
  loginHref = "/login",
  signupHref = "/signup",
  ctaLabel,
  chrome = true,
  className,
}: MarketingShellProps) {
  return (
    <div
      className={cn(
        "theme-landing flex min-h-screen flex-col [overflow-x:clip] bg-brand-deep font-sans text-brand-text antialiased selection:bg-brand-cyan selection:text-brand-deep",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.07]"
        style={{ backgroundImage: NOISE, backgroundSize: "220px 220px" }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-brand-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-deep"
      >
        Skip to content
      </a>
      {chrome ? <MarketingNav loginHref={loginHref} signupHref={signupHref} ctaLabel={ctaLabel} /> : null}
      <main id="main" className="flex-1">
        {children}
      </main>
      {chrome ? <MarketingFooter signupHref={signupHref} /> : null}
    </div>
  );
}
