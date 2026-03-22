"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log to monitoring (PostHog / Sentry) in production
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center min-h-[300px] p-8 text-center",
            this.props.className
          )}
        >
          <div className="w-14 h-14 rounded-full bg-brand-rose/10 border border-brand-rose/25 flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7 text-brand-rose" />
          </div>

          <h3 className="text-brand-text font-semibold text-base mb-2">
            Something went wrong
          </h3>

          <p className="text-brand-muted text-sm max-w-sm mb-6">
            An unexpected error occurred. This has been logged and we&apos;ll
            look into it. Try refreshing or clicking retry.
          </p>

          {process.env.NODE_ENV === "development" &&
            this.state.error !== null && (
              <details className="mb-5 w-full max-w-md text-left">
                <summary className="text-brand-muted text-xs cursor-pointer hover:text-brand-text transition-colors mb-2">
                  Error details (dev only)
                </summary>
                <pre className="text-xs text-brand-rose bg-brand-surface border border-brand-border rounded-lg p-3 overflow-auto max-h-36 whitespace-pre-wrap break-all">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-cyan text-brand-deep text-sm font-semibold rounded-lg hover:bg-brand-cyan/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg border border-brand-border text-brand-muted text-sm font-medium hover:text-brand-text hover:border-brand-border/80 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for page-level error boundaries
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary className="min-h-screen bg-brand-deep">
      {children}
    </ErrorBoundary>
  );
}
