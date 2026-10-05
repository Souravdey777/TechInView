import { MarketingShell } from "@/components/marketing/MarketingShell";
import { ButtonLink, H1, Kicker, LABEL, LEAD, LINK_ARROW, PAD, READING } from "@/components/marketing/ds";
import { SUPPORT_EMAIL, createSupportMailto } from "@/lib/legal";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <MarketingShell>
      <section className={cn("py-[clamp(96px,16vh,180px)]", PAD)}>
        <div className={READING}>
          <Kicker>404 · Page not found</Kicker>
          <h1 className={H1}>This page does not exist.</h1>
          <p className={cn(LEAD, "mt-8")}>
            It may have moved, or the URL has a typo. Check the URL, or start from the home page.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/">Back to the home page</ButtonLink>
            <ButtonLink href="/practice" variant="ghost">
              Browse practice problems
            </ButtonLink>
          </div>
          <p className={cn(LABEL, "mt-14 flex flex-wrap items-center gap-x-3 gap-y-2")}>
            Still stuck?
            <a href={createSupportMailto({ subject: "Broken link on TechInView" })} className={LINK_ARROW}>
              {SUPPORT_EMAIL} →
            </a>
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
