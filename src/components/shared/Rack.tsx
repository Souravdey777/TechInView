import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mono micro-label used for rack headers, field labels, and metadata rows. */
export function MonoLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
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

type RackProps = {
  /** Rendered at the left of the chrome header — usually a mono label. */
  label: ReactNode;
  /** Rendered at the right of the chrome header: a note, legend, or filter chips. */
  accessory?: ReactNode;
  children: ReactNode;
  id?: string;
  tone?: "default" | "danger";
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

/**
 * Bordered panel with a recessed chrome header — the shared shell behind the
 * setup, settings, and dashboard racks.
 */
export function Rack({
  label,
  accessory,
  children,
  id,
  tone = "default",
  className,
  headerClassName,
  bodyClassName,
}: RackProps) {
  const isDanger = tone === "danger";

  return (
    <section
      id={id}
      className={cn(
        "overflow-hidden rounded-2xl border bg-brand-card",
        isDanger ? "border-brand-rose/25" : "border-brand-border",
        id && "scroll-mt-24",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-brand-surface px-4 py-3 sm:px-5",
          isDanger ? "border-brand-rose/25" : "border-brand-border",
          headerClassName
        )}
      >
        {label}
        {accessory}
      </div>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
