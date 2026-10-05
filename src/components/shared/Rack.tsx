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
        "font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle",
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
 * Hairline panel with a label row, the shared shell behind the setup,
 * settings, and dashboard racks. Follows the design system: hairline
 * borders, no fills or shadows, mono label header.
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
        "overflow-hidden rounded-[20px] border",
        isDanger ? "border-brand-rose/25" : "border-white/[0.08]",
        id && "scroll-mt-24",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-5 py-4 sm:px-6",
          isDanger ? "border-brand-rose/25" : "border-white/[0.08]",
          headerClassName
        )}
      >
        {label}
        {accessory}
      </div>
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}
