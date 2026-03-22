"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-brand-rose text-sm font-semibold uppercase tracking-widest mb-4">
          Something went wrong
        </p>
        <h1 className="text-3xl font-bold text-brand-text mb-4">
          An unexpected error occurred
        </h1>
        {error.message && (
          <p className="text-brand-muted text-sm mb-8 font-mono bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-left break-words">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-cyan text-brand-deep font-semibold hover:bg-cyan-300 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
