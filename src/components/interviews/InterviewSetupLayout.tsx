import type { ReactNode } from "react";
import { SetupPageHeader } from "@/components/interviews/SetupPageHeader";
import { cn } from "@/lib/utils";

export type InterviewSetupStatus = "live" | "beta" | "planned";

const STATUS_STYLES: Record<InterviewSetupStatus, string> = {
  live: "border-brand-green/25 bg-brand-green/10 text-brand-green",
  beta: "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan",
  planned: "border-brand-amber/25 bg-brand-amber/10 text-brand-amber",
};

type InterviewSetupLayoutProps = {
  supportingText: string;
  children: ReactNode;
  aside?: ReactNode;
  containerClassName?: string;
};

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
      <main className={cn("mx-auto px-4 py-8 sm:px-6 sm:py-10", containerClassName)}>
        <div
          className={cn(
            "grid gap-6",
            aside && "xl:grid-cols-[minmax(0,1fr)_24rem]"
          )}
        >
          <div className="min-w-0 rounded-3xl border border-brand-border bg-brand-card p-6 sm:p-8">
            {children}
          </div>
          {aside ? <aside className="space-y-4">{aside}</aside> : null}
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

export function InterviewSetupHero({
  title,
  description,
  status = "live",
  metadata = [],
  contextLabel,
}: InterviewSetupHeroProps) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            STATUS_STYLES[status]
          )}
        >
          {status}
        </span>
        {metadata.map((item) => (
          <span
            key={`${title}-${item}`}
            className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted"
          >
            {item}
          </span>
        ))}
        {contextLabel ? (
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-[11px] text-brand-muted">
            {contextLabel}
          </span>
        ) : null}
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-brand-text">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-muted">
        {description}
      </p>
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
        "rounded-2xl border border-brand-border bg-brand-surface p-5",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
        {icon}
        {title}
      </div>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">{description}</p>
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

export function InterviewSetupAsideCard({
  title,
  children,
  icon,
}: InterviewSetupAsideCardProps) {
  return (
    <section className="rounded-3xl border border-brand-border bg-brand-card p-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}
