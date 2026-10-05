import type { ReactNode } from "react";
import { SetupPageHeader } from "@/components/interviews/SetupPageHeader";
import { LEAD, PAD } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

export type InterviewSetupStatus = "live" | "beta" | "planned";

const STATUS_STYLES: Record<InterviewSetupStatus, string> = {
  live: "border-brand-green/30 text-brand-green",
  beta: "border-brand-amber/30 text-brand-amber",
  planned: "border-white/[0.12] text-brand-subtle",
};

const META_CHIP =
  "rounded-full border border-white/[0.1] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted";

type InterviewSetupLayoutProps = {
  supportingText: string;
  children: ReactNode;
  aside?: ReactNode;
  containerClassName?: string;
};

/**
 * Setup page frame: hairline top bar, then the main column of racks on the
 * page itself (no boxed card) with an optional summary rail on the right.
 */
export function InterviewSetupLayout({
  supportingText,
  children,
  aside,
  containerClassName = "max-w-6xl",
}: InterviewSetupLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      <SetupPageHeader
        containerClassName={containerClassName}
        supportingText={supportingText}
      />
      <main className={cn("mx-auto w-full py-10 sm:py-14", PAD, containerClassName)}>
        <div
          className={cn(
            "grid gap-8",
            aside && "xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-10"
          )}
        >
          <div className="min-w-0">{children}</div>
          {aside ? <aside className="space-y-5">{aside}</aside> : null}
        </div>
      </main>
    </div>
  );
}

type InterviewSetupHeroProps = {
  title: string;
  description: string;
  status?: InterviewSetupStatus;
  metadata?: readonly string[];
  contextLabel?: string | null;
};

/** Landing-style page head: status + metadata chips, big font-normal title, lead. */
export function InterviewSetupHero({
  title,
  description,
  status = "live",
  metadata = [],
  contextLabel,
}: InterviewSetupHeroProps) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]",
            STATUS_STYLES[status]
          )}
        >
          {status}
        </span>
        {metadata.map((item) => (
          <span key={`${title}-${item}`} className={META_CHIP}>
            {item}
          </span>
        ))}
        {contextLabel ? <span className={META_CHIP}>{contextLabel}</span> : null}
      </div>
      <h1 className="mt-6 text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
        {title}
      </h1>
      <p className={cn(LEAD, "mt-4 max-w-3xl")}>{description}</p>
    </header>
  );
}

type InterviewSetupSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Hairline rack with a mono label header, the unit every setup form is built from. */
export function InterviewSetupSection({
  title,
  description,
  icon,
  children,
  className,
}: InterviewSetupSectionProps) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-white/[0.08] p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-brand-subtle">
        {icon}
        <span className="text-brand-text">{title}</span>
      </div>
      {description ? (
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

type InterviewSetupAsideCardProps = {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
};

/** Summary-rail rack: same hairline shell as a section, with a mono label. */
export function InterviewSetupAsideCard({
  title,
  children,
  icon,
}: InterviewSetupAsideCardProps) {
  return (
    <section className="rounded-[20px] border border-white/[0.08] p-5 sm:p-6">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}
