"use client";

import { CHIP, CHIP_ACTIVE } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type FacetChipProps = {
  label: string;
  /** Rendered dim after the label. Hidden when undefined. */
  count?: number;
  isActive: boolean;
  onClick: () => void;
  /** Optional text colour for the resting chip. Selected chips always take the cyan accent. */
  toneClassName?: string;
  /** Bare chips drop the resting border. */
  bare?: boolean;
  /** Chips that would empty the list are parked rather than clickable. */
  disabled?: boolean;
  title?: string;
  className?: string;
  "aria-expanded"?: boolean;
};

/**
 * Design-system pill chip (CHIP / CHIP_ACTIVE) with an optional count. One
 * primitive behind the category, progress, access, and difficulty facets.
 */
export function FacetChip({
  label,
  count,
  isActive,
  onClick,
  toneClassName,
  bare = false,
  disabled = false,
  title,
  className,
  "aria-expanded": ariaExpanded,
}: FacetChipProps) {
  return (
    <button
      type="button"
      aria-pressed={ariaExpanded === undefined ? isActive : undefined}
      aria-expanded={ariaExpanded}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        CHIP,
        "shrink-0",
        isActive ? CHIP_ACTIVE : cn(bare && "border-transparent", toneClassName),
        disabled && "cursor-not-allowed opacity-40 hover:text-brand-muted",
        className
      )}
    >
      {label}
      {count === undefined ? null : (
        <span
          className={cn(
            "ml-1.5 tabular-nums",
            isActive ? "text-brand-cyan/70" : "text-brand-subtle"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
