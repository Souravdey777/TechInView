"use client";

import type { ReactNode } from "react";
import { MonoLabel, Rack } from "@/components/shared/Rack";

/** Shared focus ring for the setup racks — matches the Button primitive. */
export const SETUP_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep";

/**
 * Focus ring for cells inside a hairline grid: drawn inset so it is not
 * clipped by, or doubled with, the neighbouring cell borders.
 */
export const SETUP_CELL_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan";

/** Selected state for a hairline grid cell: cyan inset hairline + faint tint. */
export const SETUP_CELL_SELECTED = "bg-brand-cyan/[0.06] ring-1 ring-inset ring-brand-cyan/40";

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

/** Numbered hairline rack with a mono "01 · Label" header, one per setup step. */
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
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-subtle">
          {index}
          <span className="px-1.5">·</span>
          <span className="text-brand-text">{label}</span>
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
