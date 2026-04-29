import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full resize-none rounded-md",
          "border border-brand-border bg-brand-surface",
          "px-3 py-2 text-sm text-brand-text",
          "placeholder:text-brand-muted",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-brand-deep focus:border-brand-cyan/50",
          "hover:border-brand-subtle",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-brand-card",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
