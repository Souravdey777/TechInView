import type { ReactNode } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LEGAL_LAST_UPDATED,
  LEGAL_LAST_UPDATED_ISO,
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
  summary: string;
  sections: LegalSection[];
};

const LABEL_CLASSES =
  "font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-subtle";

const PROSE_CLASSES =
  "prose prose-invert prose-sm max-w-none text-brand-muted prose-headings:font-heading prose-headings:text-brand-text prose-p:text-brand-muted prose-p:leading-relaxed prose-strong:text-brand-text prose-li:text-brand-muted prose-li:leading-relaxed prose-a:text-brand-cyan prose-a:no-underline hover:prose-a:text-cyan-300 prose-ul:pl-5 prose-ol:pl-5";

function LegalSidebar({
  currentPath,
  summary,
}: {
  currentPath: LegalHref;
  summary: string;
}) {
  return (
    <div className="lg:sticky lg:top-24">
      <nav aria-label="Legal pages">
        <p className={LABEL_CLASSES}>Legal</p>
        <ul className="mt-3.5 space-y-px">
          {LEGAL_LINKS.map((item) => {
            const isCurrent = item.href === currentPath;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "flex items-center border-l-2 px-3.5 py-2.5 text-sm transition-colors",
                    isCurrent
                      ? "border-brand-cyan bg-brand-card font-semibold text-brand-text"
                      : "border-transparent text-brand-muted hover:border-brand-border hover:bg-brand-surface/60 hover:text-brand-text"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-7 rounded-xl border border-brand-border bg-brand-surface/40 p-4">
        <p className={LABEL_CLASSES}>Plain-language summary</p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-brand-muted">
          {summary}
        </p>
      </div>
    </div>
  );
}

export function LegalPageShell({
  currentPath,
  title,
  description,
  summary,
  sections,
}: LegalPageShellProps) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/35 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-10">
          <aside className="lg:col-span-3">
            <LegalSidebar currentPath={currentPath} summary={summary} />
          </aside>

          <div className="lg:col-span-9">
            <p className={LABEL_CLASSES}>
              Last updated{" "}
              <time dateTime={LEGAL_LAST_UPDATED_ISO}>{LEGAL_LAST_UPDATED}</time>
            </p>
            <h1 className="mt-4 font-heading text-[2.125rem] font-bold leading-[1.05] tracking-[-0.03em] text-brand-text sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-muted sm:text-[1.0625rem]">
              {description}
            </p>

            <div className="mt-10 sm:mt-12">
              {sections.map((section, index) => (
                <section
                  key={section.title}
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 border-t border-brand-border py-7 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-x-7 sm:py-8"
                >
                  <span
                    className="pt-0.5 font-mono text-xs font-bold tracking-[0.06em] text-brand-cyan sm:pt-1"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] text-brand-text sm:text-xl">
                      {section.title}
                    </h2>
                    <div className={cn("mt-3.5", PROSE_CLASSES)}>
                      {section.content}
                    </div>
                  </div>
                </section>
              ))}
              <div className="border-t border-brand-border" aria-hidden />
            </div>

            <div className="mt-10 flex flex-col gap-5 rounded-xl border border-brand-border bg-brand-surface/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-6">
              <div>
                <p className="text-[15px] font-medium text-brand-text">
                  Something here not clear enough?
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
                  Email {SUPPORT_EMAIL}. We review requests in the order they
                  arrive.
                </p>
              </div>
              <a
                href={createSupportMailto({ subject: `Question about ${title}` })}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-card px-5 py-3 text-sm font-medium text-brand-text transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
