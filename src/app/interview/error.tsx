"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { BTN_GHOST, BTN_PRIMARY, BTN_SM, LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InterviewError({ error, reset }: ErrorProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-brand-deep px-5 text-center">
      <AlertTriangle className="mb-5 h-6 w-6 text-brand-rose" />

      <h1 className="mb-3 text-3xl font-normal tracking-[-0.03em] text-brand-text">
        Interview Error
      </h1>
      <p className="mb-2 max-w-sm text-[15px] leading-relaxed text-brand-muted">
        {error.message || "Something went wrong during your interview session."}
      </p>
      {error.digest && (
        <p className={cn(LABEL, "mb-8 normal-case tracking-[0.04em]")}>
          Error ID: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-8" />}

      <div className="flex items-center gap-3">
        <button onClick={reset} className={cn(BTN_PRIMARY, BTN_SM)}>
          Try again
        </button>
        <Link href="/interviews/dsa/setup" className={cn(BTN_GHOST, BTN_SM)}>
          Return to Setup
        </Link>
      </div>
    </div>
  );
}
