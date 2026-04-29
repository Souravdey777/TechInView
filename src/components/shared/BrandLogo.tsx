import Image from "next/image";
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
    gap: "gap-2.5",
    box: "h-8 w-8 rounded-lg",
    mark: "h-full w-full",
    wordmark: "text-sm",
  },
  md: {
    gap: "gap-3",
    box: "h-9 w-9 rounded-xl",
    mark: "h-full w-full",
    wordmark: "text-base",
  },
  lg: {
    gap: "gap-3.5",
    box: "h-12 w-12 rounded-2xl",
    mark: "h-full w-full",
    wordmark: "text-2xl",
  },
};

export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <Image
      src="/images/techinview-logo.png"
      alt={title ?? ""}
      width={128}
      height={128}
      className={className}
      aria-hidden={title ? undefined : true}
      title={title}
    />
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
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          styles.box,
          boxClassName
        )}
      >
        <BrandMark
          className={cn(styles.mark, markClassName)}
        />
      </div>

      <span
        className={cn(
          "inline-flex items-baseline font-heading font-semibold tracking-tight leading-none text-brand-text",
          styles.wordmark,
          wordmarkClassName
        )}
      >
        <span>Techinview</span>
        <span className="ml-[0.06em] text-brand-cyan">.</span>
      </span>
    </div>
  );
}
