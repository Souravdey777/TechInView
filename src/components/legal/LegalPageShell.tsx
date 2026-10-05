import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BODY,
  CHIP,
  CHIP_ACTIVE,
  CONTAINER,
  H3,
  Kicker,
  LABEL,
  LEAD,
  LINK_ARROW,
  PAD,
  PROSE,
} from "@/components/marketing/ds";
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

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const num = (i: number) => String(i + 1).padStart(2, "0");

export function LegalPageShell({ currentPath, title, description, summary, sections }: LegalPageShellProps) {
  return (
    <section className={cn("pb-[120px] pt-16 sm:pt-24", PAD)}>
      <div className={cn(CONTAINER, "grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16")}>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="Legal pages">
            <p className={LABEL}>Legal</p>
            <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:border-l lg:border-white/[0.08]">
              {LEGAL_LINKS.map((item) => {
                const isCurrent = item.href === currentPath;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={cn(
                        CHIP,
                        isCurrent && CHIP_ACTIVE,
                        "lg:-ml-px lg:rounded-none lg:border-0 lg:border-l lg:bg-transparent lg:px-4 lg:py-2",
                        isCurrent ? "lg:border-brand-cyan" : "lg:border-transparent"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label="On this page" className="mt-10 hidden lg:block">
            <p className={LABEL}>On this page</p>
            <ol className="mt-4 space-y-2.5">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <a
                    href={`#${slug(s.title)}`}
                    className="flex gap-3 font-mono text-[11px] uppercase leading-snug tracking-[0.06em] text-brand-muted transition-colors hover:text-brand-cyan"
                  >
                    <span className="text-brand-subtle">{num(i)}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0 max-w-[720px]">
          <Kicker>Legal</Kicker>
          <h1 className="text-balance text-[clamp(40px,5.2vw,72px)] font-normal leading-[0.98] tracking-[-0.045em]">{title}</h1>
          <p className={cn(LEAD, "mt-7")}>{description}</p>
          <p className={cn(LABEL, "mt-6")}>
            Last updated <time dateTime={LEGAL_LAST_UPDATED_ISO}>{LEGAL_LAST_UPDATED}</time>
          </p>

          <div className="mt-12 border-y border-white/[0.08] py-7">
            <p className={LABEL}>Plain-language summary</p>
            <p className={cn(BODY, "mt-3")}>{summary}</p>
          </div>

          {sections.map((section, i) => (
            <section
              key={section.title}
              id={slug(section.title)}
              aria-labelledby={`${slug(section.title)}-title`}
              className="scroll-mt-28 border-b border-white/[0.08] py-12"
            >
              <div className="mb-4 font-mono text-xs tracking-[0.14em] text-brand-subtle" aria-hidden>
                {num(i)}
              </div>
              <h2
                id={`${slug(section.title)}-title`}
                className="text-[28px] font-normal leading-tight tracking-[-0.025em] text-brand-text"
              >
                {section.title}
              </h2>
              <div className={cn(PROSE, "mt-6")}>{section.content}</div>
            </section>
          ))}

          <div className="flex flex-col gap-5 pt-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={H3}>Something here not clear enough?</h2>
              <p className={cn(BODY, "mt-2")}>
                Email {SUPPORT_EMAIL}. We review requests in the order they arrive.
              </p>
            </div>
            <a href={createSupportMailto({ subject: `Question about ${title}` })} className={cn(LINK_ARROW, "shrink-0")}>
              Contact us →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
