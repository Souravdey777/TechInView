import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

type LoadingSpinnerProps = {
  size?: SpinnerSize;
  message?: string;
  className?: string;
};

const SIZE_CONFIG: Record<
  SpinnerSize,
  { spinner: string; track: string; text: string }
> = {
  sm: {
    spinner: "w-4 h-4 border-2",
    track: "w-4 h-4 border-2",
    text: "text-xs",
  },
  md: {
    spinner: "w-8 h-8 border-2",
    track: "w-8 h-8 border-2",
    text: "text-sm",
  },
  lg: {
    spinner: "w-12 h-12 border-[3px]",
    track: "w-12 h-12 border-[3px]",
    text: "text-base",
  },
};

export function LoadingSpinner({
  size = "md",
  message,
  className,
}: LoadingSpinnerProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      role="status"
      aria-label={message ?? "Loading"}
    >
      {/* Spinner container (relative, so track and spinner stack) */}
      <div className="relative flex items-center justify-center">
        {/* Track ring */}
        <div
          className={cn(
            "absolute rounded-full border-brand-border",
            config.track
          )}
        />
        {/* Animated spinner */}
        <div
          className={cn(
            "rounded-full border-transparent border-t-brand-cyan animate-spin",
            config.spinner
          )}
          style={{ animationDuration: "0.7s" }}
        />
      </div>

      {message && (
        <p className={cn("text-brand-muted font-medium", config.text)}>
          {message}
        </p>
      )}
    </div>
  );
}

// Full-screen centered variant
export function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center">
      <LoadingSpinner size="lg" message={message ?? "Loading..."} />
    </div>
  );
}
