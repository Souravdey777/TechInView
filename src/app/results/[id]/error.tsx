"use client";

import { Button } from "@/components/ui/button";
import { BODY, ButtonLink, Eyebrow, LABEL, PAD } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ResultsError({ error, reset }: ErrorProps) {
  return (
    <main className={cn("flex min-h-screen flex-col items-center justify-center bg-brand-deep text-center", PAD)}>
      <Eyebrow className="text-brand-rose">Error</Eyebrow>
      <h1 className="mb-3 text-balance text-[clamp(28px,3.6vw,44px)] font-normal leading-[1.05] tracking-[-0.035em] text-brand-text">
        Could not load results
      </h1>
      <p className={cn(BODY, "mb-1 max-w-sm")}>
        {error.message || "An error occurred while loading your interview results."}
      </p>
      {error.digest && (
        <p className={cn(LABEL, "mb-6 mt-2 normal-case tracking-normal")}>
          Error ID: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-6" />}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/dashboard" variant="ghost" size="sm">
          Back to Dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
