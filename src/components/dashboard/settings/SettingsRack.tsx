import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MonoLabel, Rack } from "@/components/shared/Rack";

/** Mono micro-label used for rack headers and field labels. */
export { MonoLabel as SettingsMonoLabel } from "@/components/shared/Rack";

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
  return (
    <Rack
      id={id}
      tone={tone}
      className={className}
      bodyClassName={bodyClassName}
      label={
        <MonoLabel
          className={cn(
            "tracking-[0.18em]",
            tone === "danger" ? "text-brand-rose" : "text-brand-cyan"
          )}
        >
          {label}
        </MonoLabel>
      }
      accessory={
        note ? <MonoLabel className="tracking-[0.12em]">{note}</MonoLabel> : null
      }
    >
      {children}
    </Rack>
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
        <MonoLabel>{label}</MonoLabel>
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
