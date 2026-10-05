"use client";

import type { ReactNode } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETUP_FOCUS_RING,
  SetupMonoLabel,
} from "@/components/interviews/setup/SetupRack";

export type SetupSegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  locked?: boolean;
  inactiveClassName?: string;
  activeClassName?: string;
};

type SetupSegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly SetupSegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  groupClassName?: string;
};

/** Labelled pill segmented control rendered as a radiogroup. */
export function SetupSegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  groupClassName,
}: SetupSegmentedControlProps<T>) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <SetupMonoLabel>{label}</SetupMonoLabel>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "flex gap-1 rounded-full border border-white/[0.12] p-1",
          groupClassName
        )}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={option.disabled}
              onClick={() => {
                if (option.disabled) return;
                onChange(option.value);
              }}
              className={cn(
                "relative flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-sm transition-colors duration-150",
                option.locked && "cursor-not-allowed opacity-40",
                isActive
                  ? option.activeClassName ?? "bg-brand-cyan/[0.1] text-brand-cyan"
                  : option.inactiveClassName ??
                      "text-brand-muted hover:bg-white/[0.04] hover:text-brand-text",
                SETUP_FOCUS_RING
              )}
            >
              {option.icon}
              <span>{option.label}</span>
              {option.locked ? (
                <Lock className="h-3 w-3 shrink-0 text-brand-muted" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type SetupSelectProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

/** Labelled native select styled as a FIELD pill. */
export function SetupSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: SetupSelectProps<T>) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id}>
        <SetupMonoLabel>{label}</SetupMonoLabel>
      </label>
      <div className="relative">
        {/* Opaque brand-deep (not transparent) so native option lists stay dark. */}
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as T)}
          className={cn(
            "min-h-[46px] w-full appearance-none rounded-full border border-white/[0.12] bg-brand-deep px-5 pr-10 text-[15px] text-brand-text transition-colors focus:border-brand-cyan",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "hover:border-white/[0.2]",
            SETUP_FOCUS_RING
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted" />
      </div>
    </div>
  );
}
