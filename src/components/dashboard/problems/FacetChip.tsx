"use client";

import { cn } from "@/lib/utils";

type FacetChipProps = {
  label: string;
  /** Rendered dim after the label. Hidden when undefined. */
  count?: number;
  isActive: boolean;
  onClick: () => void;
  /** Colour that belongs to the value itself — difficulty tints keep it selected or not. */
  toneClassName?: string;
  /** Bare chips drop the resting border. Used inside the rack chrome header. */
  bare?: boolean;
  /** Chips that would empty the list are parked rather than clickable. */
  disabled?: boolean;
  title?: string;
  className?: string;
};

/**
 * Mono filter chip: a hairline box at rest, a raised well when selected. One
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
}: FacetChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md border px-2.5 py-1 font-mono text-[11px] tracking-[0.06em] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
        isActive
          ? cn(
              "border-brand-border bg-brand-card",
              toneClassName ?? "text-brand-text"
            )
          : cn(
              bare
                ? "border-transparent hover:bg-brand-card/60"
                : "border-brand-border hover:border-brand-subtle",
              toneClassName ?? "text-brand-subtle hover:text-brand-muted"
            ),
        disabled && "cursor-not-allowed opacity-40 hover:border-brand-border",
        className
      )}
    >
      {label}
      {count === undefined ? null : (
        <span
          className={cn(
            "ml-1.5",
            isActive ? "text-brand-muted" : "text-brand-subtle/70"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
