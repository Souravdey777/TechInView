"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Laptop2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

type DesktopOnlyInterviewNoticeProps = {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

export function DesktopOnlyInterviewNotice({
  title,
  description,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: DesktopOnlyInterviewNoticeProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-deep text-brand-text">
      <header className="border-b border-brand-border bg-brand-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <BrandLogo size="sm" wordmarkClassName="text-base" />
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-brand-muted transition-colors hover:text-brand-text"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-brand-border bg-brand-card p-6 text-center shadow-[0_24px_80px_-48px_rgba(34,211,238,0.32)] sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-cyan/20 bg-brand-cyan/10">
            <Laptop2 className="h-8 w-8 text-brand-cyan" />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Desktop-only room
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:text-base">
            {description}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={backHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border px-4 py-3 text-sm font-medium text-brand-text transition-colors hover:bg-brand-surface"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-4 py-3 text-sm font-semibold text-brand-deep transition-colors hover:bg-cyan-300"
            >
              Browse practice problems
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-brand-muted">
            The rest of TechInView stays usable on mobile, but the live interview room needs a
            larger screen for voice, code, transcript, and controls together.
          </p>
        </div>
      </main>
    </div>
  );
}
