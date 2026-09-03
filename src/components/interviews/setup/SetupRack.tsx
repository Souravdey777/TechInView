"use client";

import type { ReactNode } from "react";
import { MonoLabel, Rack } from "@/components/shared/Rack";

/** Shared focus ring for the DSA setup racks — matches the Button primitive. */
export const SETUP_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card";

/** Mono micro-label used for rack headers, field labels, and metadata rows. */
export { MonoLabel as SetupMonoLabel } from "@/components/shared/Rack";

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
    <Rack
      className={className}
      bodyClassName={bodyClassName}
      label={
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
          {index}
          <span className="px-1.5 text-brand-subtle">·</span>
          {label}
        </p>
      }
      accessory={
        note ? (
          <MonoLabel className="tracking-[0.12em]">{note}</MonoLabel>
        ) : null
      }
    >
      {children}
    </Rack>
  );
}
