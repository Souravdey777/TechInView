"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { BODY, BTN_GHOST, BTN_PRIMARY, BTN_SM, FOCUS, LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

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
      <header className="sticky top-0 z-10 border-b border-white/[0.08] bg-brand-deep/80 backdrop-blur-[14px]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <BrandLogo size="sm" wordmarkClassName="text-base" />
          <Link
            href={backHref}
            className={cn("inline-flex items-center gap-1.5 text-sm text-brand-muted transition-colors hover:text-brand-text", FOCUS)}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center px-5 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-xl">
          <p className={LABEL}>
            Desktop-only room
          </p>
          <h1 className="mt-4 text-balance text-[clamp(32px,4.4vw,48px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
            {title}
          </h1>
          <p className={cn(BODY, "mt-5")}>
            {description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={backHref}
              className={cn(BTN_GHOST, BTN_SM, "gap-2")}
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
            <Link
              href="/practice"
              className={cn(BTN_PRIMARY, BTN_SM, "gap-2")}
            >
              Browse practice problems
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-8 border-t border-white/[0.08] pt-5 text-xs leading-relaxed text-brand-subtle">
            The rest of TechInView stays usable on mobile, but the live interview room needs a
            larger screen for voice, code, transcript, and controls together.
          </p>
        </div>
      </main>
    </div>
  );
}
