import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-md",
            "bg-brand-surface border border-brand-border",
            "px-3 py-2 pr-9 text-sm text-brand-text",
            "transition-colors cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-brand-deep focus:border-brand-cyan/50",
            "hover:border-brand-subtle",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-brand-card",
            "[&>option]:bg-brand-card [&>option]:text-brand-text",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted"
          aria-hidden="true"
        />
      </div>
    );
  }
);
Select.displayName = "Select";

const SelectOption = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => (
  <option
    ref={ref}
    className={cn("bg-brand-card text-brand-text py-1", className)}
    {...props}
  />
));
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
