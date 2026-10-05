import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-full",
          "bg-transparent border border-white/[0.12]",
          "px-5 py-2 text-[15px] text-brand-text",
          "placeholder:text-brand-subtle",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-brand-deep focus:border-brand-cyan",
          "hover:border-white/[0.18]",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-transparent",
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
