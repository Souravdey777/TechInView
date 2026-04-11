import { useId } from "react";
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
  boxed?: boolean;
  showWordmark?: boolean;
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
    gap: "gap-2.5",
    box: "h-8 w-8 rounded-lg",
    mark: "h-5 w-5",
    wordmark: "text-sm",
  },
  md: {
    gap: "gap-3",
    box: "h-9 w-9 rounded-xl",
    mark: "h-5.5 w-5.5",
    wordmark: "text-base",
  },
  lg: {
    gap: "gap-3.5",
    box: "h-12 w-12 rounded-2xl",
    mark: "h-7 w-7",
    wordmark: "text-2xl",
  },
};

export function BrandMark({ className, title }: BrandMarkProps) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="14" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
      </defs>

      <path
        d="M22 14H18C13.582 14 10 17.582 10 22V42C10 46.418 13.582 50 18 50H22"
        stroke={`url(#${gradientId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 14H46C50.418 14 54 17.582 54 22V42C54 46.418 50.418 50 46 50H42"
        stroke={`url(#${gradientId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="24" y="25" width="4" height="14" rx="2" fill={`url(#${gradientId})`} />
      <rect x="30" y="20" width="4" height="24" rx="2" fill={`url(#${gradientId})`} />
      <rect x="36" y="25" width="4" height="14" rx="2" fill={`url(#${gradientId})`} />
    </svg>
  );
}

export function BrandLogo({
  className,
  boxClassName,
  markClassName,
  wordmarkClassName,
  size = "md",
  boxed = true,
  showWordmark = true,
}: BrandLogoProps) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={cn("inline-flex items-center", styles.gap, className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          boxed &&
            "border border-brand-cyan/25 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(17,24,32,0.45))] shadow-[0_0_24px_rgba(34,211,238,0.08)]",
          styles.box,
          boxClassName
        )}
      >
        <BrandMark
          className={cn(styles.mark, markClassName)}
          title={showWordmark ? undefined : "TechInView logo"}
        />
      </div>

      {showWordmark ? (
        <span
          className={cn(
            "inline-flex items-baseline font-heading font-semibold tracking-tight leading-none text-brand-text",
            styles.wordmark,
            wordmarkClassName
          )}
        >
          <span>TechInView</span>
          <span className="ml-[0.06em] text-brand-cyan">.</span>
        </span>
      ) : null}
    </div>
  );
}
