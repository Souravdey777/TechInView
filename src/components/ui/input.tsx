import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md",
          "bg-brand-surface border border-brand-border",
          "px-3 py-2 text-sm text-brand-text",
          "placeholder:text-brand-muted",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-brand-deep focus:border-brand-cyan/50",
          "hover:border-brand-subtle",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-brand-card",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-brand-text",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
