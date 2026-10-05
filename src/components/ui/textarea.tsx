import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full resize-none rounded-[20px]",
          "border border-white/[0.12] bg-transparent",
          "px-5 py-3 text-[15px] text-brand-text",
          "placeholder:text-brand-subtle",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-brand-deep focus:border-brand-cyan",
          "hover:border-white/[0.18]",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-transparent",
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
