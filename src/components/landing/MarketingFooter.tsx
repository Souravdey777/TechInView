import Link from "next/link";
import { Wordmark } from "@/components/landing/MarketingNav";
import { BODY, BTN_GHOST, BTN_PRIMARY, BTN_SM, CONTAINER, FOCUS, LABEL, PAD } from "@/components/marketing/ds";
import { LEGAL_LINKS, SUPPORT_EMAIL, createSupportMailto } from "@/lib/legal";
import { cn } from "@/lib/utils";

type MarketingFooterProps = {
  signupHref?: string;
};

type FooterLink = { href: string; label: string };

const COLUMNS: { heading: string; links: readonly FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/practice", label: "DSA practice problems" },
      { href: "/how-ai-evaluates", label: "How AI scoring works" },
      { href: "/blog", label: "Blog" },
    ],
  },
  { heading: "Legal & support", links: LEGAL_LINKS },
];

const LINK = cn("text-sm text-brand-muted transition-colors hover:text-brand-cyan", FOCUS);

export function MarketingFooter({ signupHref = "/signup" }: MarketingFooterProps) {
  const year = new Date().getFullYear();
  const supportHref = createSupportMailto({ subject: "TechInView support request" });

  return (
    <footer aria-label="Site footer" className="border-t border-white/[0.08] bg-brand-deep">
      <div className={cn(CONTAINER, PAD)}>
        <div className="grid gap-14 py-16 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <Link href="/" className={cn("inline-flex", FOCUS)} aria-label="TechInView home">
              <Wordmark />
            </Link>
            <p className={cn(BODY, "mt-6 max-w-[40ch]")}>
              Voice mock interviews for coding, Technical Q&amp;A, Behavioral and Engineering Manager rounds, with a
              scorecard after each one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={signupHref} className={cn(BTN_PRIMARY, BTN_SM)}>
                Practice free <span className="font-mono">→</span>
              </Link>
              <Link href="/practice" className={cn(BTN_GHOST, BTN_SM)}>
                Browse practice problems
              </Link>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h2 className={cn(LABEL, "mb-5 border-b border-white/[0.08] pb-3")}>{column.heading}</h2>
                <ul className="flex flex-col gap-3">
                  {column.links.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={LINK}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/[0.08] py-8 font-mono text-xs uppercase tracking-[0.08em] text-brand-subtle">
          <span>© {year} TechInView</span>
          <a href={supportHref} className={cn("normal-case tracking-normal text-brand-muted transition-colors hover:text-brand-cyan", FOCUS)}>
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
