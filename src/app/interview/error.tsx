"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InterviewError({ error, reset }: ErrorProps) {
  return (
    <div className="fixed inset-0 bg-brand-deep flex flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-rose/30 bg-brand-rose/10 mb-5">
        <AlertTriangle className="h-7 w-7 text-brand-rose" />
      </div>

      <h1 className="text-xl font-bold font-heading text-brand-text mb-2">
        Interview Error
      </h1>
      <p className="text-sm text-brand-muted max-w-sm mb-1">
        {error.message || "Something went wrong during your interview session."}
      </p>
      {error.digest && (
        <p className="text-xs text-brand-muted/60 mb-6 font-mono">
          Error ID: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-6" />}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-brand-cyan text-brand-deep text-sm font-semibold hover:bg-brand-cyan/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/interview/setup"
          className="px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-brand-card transition-colors"
        >
          Return to Setup
        </Link>
      </div>
    </div>
  );
}
