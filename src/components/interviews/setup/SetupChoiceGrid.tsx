"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETUP_FOCUS_RING,
  SetupMonoLabel,
} from "@/components/interviews/setup/SetupRack";

export type SetupChoiceOption<T extends string> = {
  value: T;
  label: string;
  caption?: string;
  disabled?: boolean;
};

type ChoiceCellProps = {
  role: "radio" | "checkbox";
  label: string;
  caption?: string;
  isChecked: boolean;
  disabled?: boolean;
  indicator: ReactNode;
  onClick: () => void;
};

function ChoiceCell({
  role,
  label,
  caption,
  isChecked,
  disabled,
  indicator,
  onClick,
}: ChoiceCellProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={isChecked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
        disabled && "cursor-not-allowed opacity-50",
        isChecked
          ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
          : "border-brand-border bg-brand-surface hover:border-brand-subtle",
        SETUP_FOCUS_RING
      )}
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block font-heading text-sm font-semibold tracking-tight",
            isChecked ? "text-brand-text" : "text-brand-muted"
          )}
        >
          {label}
        </span>
        {caption ? (
          <span className="mt-1.5 block text-xs leading-relaxed text-brand-muted">
            {caption}
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 shrink-0">{indicator}</span>
    </button>
  );
}

type ChoiceGridShellProps = {
  label?: string;
  note?: string;
  children: ReactNode;
  className?: string;
};

function ChoiceGridShell({ label, note, children, className }: ChoiceGridShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label || note ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {label ? <SetupMonoLabel>{label}</SetupMonoLabel> : null}
          {note ? (
            <SetupMonoLabel className="tracking-[0.12em]">{note}</SetupMonoLabel>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

type SetupRadioGridProps<T extends string> = {
  label?: string;
  note?: string;
  options: readonly SetupChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columnsClassName?: string;
  className?: string;
  ariaLabel: string;
};

/** Single-select grid of setup cells — one choice, check mark on the active cell. */
export function SetupRadioGrid<T extends string>({
  label,
  note,
  options,
  value,
  onChange,
  columnsClassName = "sm:grid-cols-2",
  className,
  ariaLabel,
}: SetupRadioGridProps<T>) {
  return (
    <ChoiceGridShell label={label} note={note} className={className}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={cn("grid grid-cols-1 gap-3", columnsClassName)}
      >
        {options.map((option) => {
          const isChecked = option.value === value;

          return (
            <ChoiceCell
              key={option.value}
              role="radio"
              label={option.label}
              caption={option.caption}
              isChecked={isChecked}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
              indicator={
                isChecked ? (
                  <Check className="h-3.5 w-3.5 text-brand-cyan" />
                ) : null
              }
            />
          );
        })}
      </div>
    </ChoiceGridShell>
  );
}

type SetupCheckboxGridProps<T extends string> = {
  label?: string;
  note?: string;
  options: readonly SetupChoiceOption<T>[];
  values: readonly T[];
  onToggle: (value: T) => void;
  columnsClassName?: string;
  className?: string;
  ariaLabel: string;
};

/** Multi-select grid of setup cells — every cell carries its own check box. */
export function SetupCheckboxGrid<T extends string>({
  label,
  note,
  options,
  values,
  onToggle,
  columnsClassName = "sm:grid-cols-2 lg:grid-cols-3",
  className,
  ariaLabel,
}: SetupCheckboxGridProps<T>) {
  return (
    <ChoiceGridShell label={label} note={note} className={className}>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn("grid grid-cols-1 gap-3", columnsClassName)}
      >
        {options.map((option) => {
          const isChecked = values.includes(option.value);

          return (
            <ChoiceCell
              key={option.value}
              role="checkbox"
              label={option.label}
              caption={option.caption}
              isChecked={isChecked}
              disabled={option.disabled}
              onClick={() => onToggle(option.value)}
              indicator={
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-[5px] border",
                    isChecked
                      ? "border-brand-cyan bg-brand-cyan text-brand-deep"
                      : "border-brand-border bg-brand-card"
                  )}
                >
                  {isChecked ? <Check className="h-3 w-3" /> : null}
                </span>
              }
            />
          );
        })}
      </div>
    </ChoiceGridShell>
  );
}
