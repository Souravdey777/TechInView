import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

type BrandLogoProps = {
  className?: string;
  boxClassName?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  size?: LogoSize;
};

const SIZE_STYLES: Record<
  LogoSize,
  {
    gap: string;
    box: string;
    mark: string;
    wordmark: string;
  }
> = {
  sm: {
    gap: "gap-2",
    box: "h-7 w-7",
    mark: "h-full w-full",
    wordmark: "text-sm",
  },
  md: {
    gap: "gap-2.5",
    box: "h-8 w-8",
    mark: "h-full w-full",
    wordmark: "text-base",
  },
  lg: {
    gap: "gap-3",
    box: "h-11 w-11",
    mark: "h-full w-full",
    wordmark: "text-2xl",
  },
};

/**
 * The TechInView mark: code brackets holding the voice dot (logo concept C,
 * see /logo-lab and public/brand). Brackets follow the current text colour so
 * the mark works on dark and light; the dot is always brand cyan #22D3EE.
 * Below ~20px the 16px "cut" (wider bracket arms on whole pixels) is used by
 * the favicon in src/app/favicon.ico; this vector is the master geometry.
 */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-brand-text", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M11 4H4V28H11V25H7V7H11Z" fill="currentColor" />
      <path d="M21 4H28V28H21V25H25V7H21Z" fill="currentColor" />
      {/* Fixed brand cyan, not the theme token: the logo must not re-skin with .theme-claude. */}
      <circle cx="16" cy="16" r="4.5" fill="#22D3EE" />
    </svg>
  );
}

export function BrandLogo({
  className,
  boxClassName,
  markClassName,
  wordmarkClassName,
  size = "md",
}: BrandLogoProps) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={cn("inline-flex items-center", styles.gap, className)}>
      <div className={cn("relative flex shrink-0 items-center justify-center", styles.box, boxClassName)}>
        <BrandMark className={cn(styles.mark, markClassName)} />
      </div>

      <span
        className={cn(
          "font-heading font-semibold lowercase leading-none tracking-[-0.02em] text-brand-text",
          styles.wordmark,
          wordmarkClassName
        )}
      >
        techinview
      </span>
    </div>
  );
}
