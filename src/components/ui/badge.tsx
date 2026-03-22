import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30",
        secondary:
          "bg-brand-surface text-brand-muted border border-brand-border",
        destructive:
          "bg-brand-rose/15 text-brand-rose border border-brand-rose/30",
        outline:
          "bg-transparent text-brand-text border border-brand-border",
        easy:
          "bg-brand-green/15 text-brand-green border border-brand-green/30",
        medium:
          "bg-brand-amber/15 text-brand-amber border border-brand-amber/30",
        hard:
          "bg-brand-rose/15 text-brand-rose border border-brand-rose/30",
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
