import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-brand-cyan/[0.08] text-brand-cyan border border-brand-cyan/40",
        secondary:
          "bg-transparent text-brand-muted border border-white/[0.1]",
        destructive:
          "bg-brand-rose/[0.08] text-brand-rose border border-brand-rose/40",
        outline:
          "bg-transparent text-brand-text border border-white/[0.12]",
        easy:
          "bg-brand-green/[0.08] text-brand-green border border-brand-green/40",
        medium:
          "bg-brand-amber/[0.08] text-brand-amber border border-brand-amber/40",
        hard:
          "bg-brand-rose/[0.08] text-brand-rose border border-brand-rose/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
