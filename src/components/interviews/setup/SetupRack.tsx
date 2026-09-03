"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared focus ring for the DSA setup racks — matches the Button primitive. */
export const SETUP_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card";

type SetupMonoLabelProps = {
  children: ReactNode;
  className?: string;
};

/** Mono micro-label used for rack headers, field labels, and metadata rows. */
export function SetupMonoLabel({ children, className }: SetupMonoLabelProps) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-brand-subtle",
        className
      )}
    >
      {children}
    </span>
  );
}

type SetupRackProps = {
  index: string;
  label: string;
  note?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Numbered configuration panel with a recessed chrome header. */
export function SetupRack({
  index,
  label,
  note,
  children,
  className,
  bodyClassName,
}: SetupRackProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-brand-border bg-brand-card",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-brand-border bg-brand-surface px-4 py-3 sm:px-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
          {index}
          <span className="px-1.5 text-brand-subtle">·</span>
          {label}
        </p>
        {note ? (
          <SetupMonoLabel className="tracking-[0.12em]">{note}</SetupMonoLabel>
        ) : null}
      </div>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
