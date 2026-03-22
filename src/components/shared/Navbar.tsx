"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Cpu, Menu, X, ArrowRight } from "lucide-react";

type NavLink = {
  href: string;
  label: string;
};

const NAV_LINKS: NavLink[] = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#demo", label: "Demo" },
];

type NavbarProps = {
  isLoggedIn?: boolean;
};

export function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-brand-deep/80 backdrop-blur-md border-b border-brand-border/60",
        "transition-all duration-200"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          onClick={closeMobile}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-brand-cyan/10 border border-brand-cyan/30 group-hover:border-brand-cyan/50 transition-colors">
            <Cpu className="w-3.5 h-3.5 text-brand-cyan" />
          </div>
          <span className="text-brand-text font-heading font-semibold text-sm tracking-tight">
            TechInView<span className="text-brand-cyan">.ai</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "text-brand-cyan"
                  : "text-brand-muted hover:text-brand-text"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-cyan text-brand-deep text-sm font-semibold rounded-lg hover:bg-brand-cyan/90 transition-colors"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-cyan text-brand-deep text-sm font-semibold rounded-lg hover:bg-brand-cyan/90 transition-colors shadow-sm shadow-brand-cyan/20"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-border/80 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-surface/95 backdrop-blur-md">
          <nav className="max-w-6xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-card transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-brand-border space-y-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={closeMobile}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-cyan text-brand-deep text-sm font-semibold rounded-lg hover:bg-brand-cyan/90 transition-colors"
                >
                  Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobile}
                    className="flex items-center justify-center px-4 py-2.5 rounded-lg border border-brand-border text-brand-muted text-sm font-medium hover:text-brand-text hover:border-brand-border/80 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-cyan text-brand-deep text-sm font-semibold rounded-lg hover:bg-brand-cyan/90 transition-colors"
                  >
                    Get Started Free
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
