"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketingNavProps = {
  signupHref?: string;
};

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
] as const;

export function MarketingNav({ signupHref = "/login" }: MarketingNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-brand-deep/80 backdrop-blur-md border-b border-brand-border">
      <nav
        className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4"
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <span className="text-xl font-bold font-heading text-brand-text tracking-tight">
            TechInView
          </span>
          <span className="text-brand-cyan text-2xl leading-none">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm text-brand-muted hover:text-brand-text transition-colors px-2"
          >
            Log in
          </Link>
          <Link
            href={signupHref}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-cyan text-brand-deep text-sm font-semibold hover:bg-cyan-300 transition-colors"
          >
            Get Started
          </Link>
          <button
            type="button"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-brand-text hover:bg-brand-card transition-colors"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        className={cn(
          "md:hidden fixed inset-0 z-[60] bg-brand-deep/95 backdrop-blur-lg transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-brand-border">
          <span className="text-sm font-semibold text-brand-muted">Menu</span>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-brand-text hover:bg-brand-card transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col p-4 gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-3 rounded-lg text-brand-text font-medium hover:bg-brand-card transition-colors"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="px-4 py-3 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors"
            onClick={() => setOpen(false)}
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
