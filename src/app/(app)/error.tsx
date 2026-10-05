"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BODY, ButtonLink, Eyebrow } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Eyebrow className="flex items-center gap-2 text-brand-rose">
        <AlertTriangle className="h-3.5 w-3.5" />
        Error
      </Eyebrow>

      <h1 className="mb-3 text-[clamp(28px,3.4vw,40px)] font-normal leading-[1.05] tracking-[-0.035em] text-brand-text">
        Something went wrong
      </h1>
      <p className={cn(BODY, "mb-1 max-w-sm")}>
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && (
        <p className="mb-8 font-mono text-xs text-brand-subtle">
          Error ID: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-8" />}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/dashboard" variant="ghost" size="sm" className="h-10 py-0">
          Go to Dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
