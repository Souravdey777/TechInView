import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsMonoLabelProps = {
  children: ReactNode;
  className?: string;
};

/** Mono micro-label used for rack headers and field labels. */
export function SettingsMonoLabel({
  children,
  className,
}: SettingsMonoLabelProps) {
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

type SettingsRackProps = {
  id: string;
  label: string;
  note?: string;
  children: ReactNode;
  tone?: "default" | "danger";
  className?: string;
  bodyClassName?: string;
};

/** Bordered settings panel with a recessed chrome header. */
export function SettingsRack({
  id,
  label,
  note,
  children,
  tone = "default",
  className,
  bodyClassName,
}: SettingsRackProps) {
  const isDanger = tone === "danger";

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-brand-card",
        isDanger ? "border-brand-rose/25" : "border-brand-border",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-brand-surface px-4 py-3 sm:px-5",
          isDanger ? "border-brand-rose/25" : "border-brand-border"
        )}
      >
        <SettingsMonoLabel
          className={cn(
            "tracking-[0.18em]",
            isDanger ? "text-brand-rose" : "text-brand-cyan"
          )}
        >
          {label}
        </SettingsMonoLabel>
        {note ? (
          <SettingsMonoLabel className="tracking-[0.12em]">
            {note}
          </SettingsMonoLabel>
        ) : null}
      </div>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

type SettingsFieldProps = {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

/** Mono label + control + optional hint, stacked like the design's field cells. */
export function SettingsField({
  label,
  hint,
  htmlFor,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="block">
        <SettingsMonoLabel>{label}</SettingsMonoLabel>
      </label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-brand-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

type SettingsToggleRowProps = {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
};

/** Preference row: copy on the left, pill switch on the right. */
export function SettingsToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  label,
}: SettingsToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-brand-border/60 py-5 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-text">{title}</p>
        {description ? (
          <p className="mt-1.5 text-xs leading-relaxed text-brand-subtle">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? title}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card",
          checked
            ? "border-brand-cyan bg-brand-cyan"
            : "border-brand-border bg-brand-surface"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-[18px] w-[18px] rounded-full transition-all",
            checked
              ? "left-[calc(100%-21px)] bg-brand-deep"
              : "left-[3px] bg-brand-subtle"
          )}
        />
      </button>
    </div>
  );
}
