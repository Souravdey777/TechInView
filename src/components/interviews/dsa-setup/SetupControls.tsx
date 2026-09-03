"use client";

import type { ReactNode } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETUP_FOCUS_RING,
  SetupMonoLabel,
} from "@/components/interviews/dsa-setup/SetupRack";

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

/** Labelled segmented control rendered as a radiogroup. */
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
          "flex overflow-hidden rounded-lg border border-brand-border bg-brand-surface",
          groupClassName
        )}
      >
        {options.map((option, index) => {
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
                "relative flex min-h-[44px] flex-1 items-center justify-center gap-1.5 px-2 text-sm font-medium transition-colors duration-150",
                index > 0 && "border-l",
                option.locked && "cursor-not-allowed opacity-40",
                isActive
                  ? option.activeClassName ??
                      "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                  : option.inactiveClassName ??
                      "border-brand-border text-brand-muted hover:text-brand-text",
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

/** Labelled native select styled to match the setup racks. */
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
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as T)}
          className={cn(
            "min-h-[44px] w-full appearance-none rounded-lg border border-brand-border bg-brand-surface px-3 pr-9 text-sm text-brand-text",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "hover:border-brand-subtle",
            SETUP_FOCUS_RING
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted" />
      </div>
    </div>
  );
}
