"use client";

import { useEffect } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { BTN_PRIMARY, ButtonLink, H1, Kicker, LABEL, LEAD, LINK_ARROW, PAD, READING } from "@/components/marketing/ds";
import { SUPPORT_EMAIL, createSupportMailto } from "@/lib/legal";
import { cn } from "@/lib/utils";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MarketingShell>
      <section className={cn("py-[clamp(96px,16vh,180px)]", PAD)}>
        <div className={READING}>
          <Kicker>Error</Kicker>
          <h1 className={H1}>This page failed to load.</h1>
          <p className={cn(LEAD, "mt-8")}>
            Try again. If it keeps happening, email {SUPPORT_EMAIL} with what you were doing.
          </p>
          {error.message ? (
            <p className="mt-8 break-words border-l border-white/[0.18] pl-4 font-mono text-[13px] leading-relaxed text-brand-muted">
              {error.message}
              {error.digest ? <span className="block text-brand-subtle">Ref {error.digest}</span> : null}
            </p>
          ) : null}
          <div className="mt-10 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className={BTN_PRIMARY}>
              Try again
            </button>
            <ButtonLink href="/" variant="ghost">
              Back to the home page
            </ButtonLink>
          </div>
          <p className={cn(LABEL, "mt-14 flex flex-wrap items-center gap-x-3 gap-y-2")}>
            Need help?
            <a
              href={createSupportMailto({
                subject: "TechInView error report",
                body: error.digest ? `Error ref: ${error.digest}` : undefined,
              })}
              className={LINK_ARROW}
            >
              {SUPPORT_EMAIL} →
            </a>
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
