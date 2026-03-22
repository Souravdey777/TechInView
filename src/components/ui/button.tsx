"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-cyan text-brand-deep hover:bg-brand-cyan/90 shadow-sm shadow-brand-cyan/20",
        secondary:
          "bg-brand-surface text-brand-text border border-brand-border hover:bg-brand-card hover:border-brand-subtle",
        outline:
          "border border-brand-border bg-transparent text-brand-text hover:bg-brand-card hover:border-brand-cyan/50",
        ghost:
          "bg-transparent text-brand-text hover:bg-brand-card hover:text-brand-text",
        destructive:
          "bg-brand-rose/10 text-brand-rose border border-brand-rose/30 hover:bg-brand-rose/20 hover:border-brand-rose/60",
        link: "text-brand-cyan underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md [&_svg]:size-3.5",
        default: "h-10 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-base rounded-lg [&_svg]:size-5",
        icon: "h-10 w-10 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
