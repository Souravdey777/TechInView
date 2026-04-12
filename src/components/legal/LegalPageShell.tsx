import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LEGAL_LAST_UPDATED,
  LEGAL_LINKS,
  SUPPORT_EMAIL,
  createSupportMailto,
  type LegalHref,
} from "@/lib/legal";

export type LegalSection = {
  title: string;
  content: ReactNode;
};

type LegalPageShellProps = {
  currentPath: LegalHref;
  title: string;
  description: string;
  sections: LegalSection[];
  aside?: ReactNode;
};

const PROSE_CLASSES =
  "prose prose-invert prose-sm max-w-none text-brand-muted sm:prose-base prose-headings:font-heading prose-headings:text-brand-text prose-p:text-brand-muted prose-strong:text-brand-text prose-li:text-brand-muted prose-a:text-brand-cyan prose-a:no-underline hover:prose-a:text-cyan-300 prose-ul:pl-5 prose-ol:pl-5";

function DefaultAside({ currentPath }: { currentPath: LegalHref }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-border bg-brand-card/70 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-cyan">
          Support
        </p>
        <h2 className="mt-3 text-lg font-semibold text-brand-text">
          Need help with billing, access, or privacy?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">
          Email the TechInView team and include any order ID, account email,
          or page URL that will help us reproduce the issue faster.
        </p>
        <a
          href={createSupportMailto({ subject: "TechInView support request" })}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-cyan-300"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {SUPPORT_EMAIL}
        </a>
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-surface/60 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
          Legal pages
        </p>
        <div className="mt-3 space-y-2">
          {LEGAL_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-xl border px-3 py-3 transition-colors",
                item.href === currentPath
                  ? "border-brand-cyan/30 bg-brand-cyan/10"
                  : "border-brand-border bg-brand-card/40 hover:border-brand-cyan/20 hover:bg-brand-card/70"
              )}
            >
              <p
                className={cn(
                  "text-sm font-medium",
                  item.href === currentPath ? "text-brand-cyan" : "text-brand-text"
                )}
              >
                {item.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LegalPageShell({
  currentPath,
  title,
  description,
  sections,
  aside,
}: LegalPageShellProps) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[280px] w-[min(90vw,40rem)] -translate-x-1/2 rounded-full bg-brand-cyan/[0.08] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-muted sm:text-lg">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
            <span className="rounded-full border border-brand-border bg-brand-card/60 px-3 py-1.5">
              Last updated: {LEGAL_LAST_UPDATED}
            </span>
            <a
              href={createSupportMailto({ subject: `Question about ${title}` })}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface/70 px-3 py-1.5 transition-colors hover:border-brand-cyan/30 hover:text-brand-text"
            >
              <Mail className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <div className="space-y-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-brand-border bg-brand-card/60 p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-brand-text sm:text-xl">
                  {section.title}
                </h2>
                <div className={cn("mt-4", PROSE_CLASSES)}>{section.content}</div>
              </section>
            ))}
          </div>

          <aside className="lg:sticky lg:top-24">
            {aside ?? <DefaultAside currentPath={currentPath} />}
          </aside>
        </div>

        <section className="mt-12 rounded-2xl border border-brand-border bg-brand-surface/60 p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            Next step
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-brand-text">
                Ready to get back to interview prep?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                Browse free practice problems or head to login to continue with
                your TechInView account.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text transition-colors hover:bg-brand-card"
              >
                Browse practice
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-cyan-300"
              >
                Go to login
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
