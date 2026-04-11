"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";

type MarketingNavProps = {
  signupHref?: string;
};

type NavLink = {
  href: string;
  label: string;
  sectionId?: string;
};

const desktopNavLinks: readonly NavLink[] = [
  { href: "/#features", label: "Features", sectionId: "features" },
  { href: "/#how-it-works", label: "How It Works", sectionId: "how-it-works" },
  { href: "/#pricing", label: "Pricing", sectionId: "pricing" },
  { href: "/blog", label: "Blog" },
] as const;

const mobileNavLinks: readonly NavLink[] = [
  desktopNavLinks[0]!,
  desktopNavLinks[1]!,
  desktopNavLinks[2]!,
  { href: "/#faq", label: "FAQ", sectionId: "faq" },
  desktopNavLinks[3]!,
] as const;

const SECTION_TRIGGER_PX = 160;

export function MarketingNav({ signupHref = "/signup" }: MarketingNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("");

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let frame = 0;

    const updateNavState = () => {
      frame = 0;
      setScrolled(window.scrollY > 12);

      if (pathname.startsWith("/blog")) {
        setActiveHref("/blog");
        return;
      }

      if (pathname !== "/") {
        setActiveHref("");
        return;
      }

      const nextActive = desktopNavLinks
        .filter((link) => link.sectionId)
        .filter((link) => {
          const section = document.getElementById(link.sectionId!);
          return section ? section.getBoundingClientRect().top <= SECTION_TRIGGER_PX : false;
        })
        .at(-1)?.href;

      setActiveHref(nextActive ?? "");
    };

    const requestUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateNavState);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
    };
  }, [pathname]);

  const isLinkActive = (link: NavLink) => {
    if (link.href === "/blog") {
      return pathname.startsWith("/blog");
    }

    return pathname === "/" && activeHref === link.href;
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-300",
          scrolled
            ? "border-white/10 bg-brand-deep/84 backdrop-blur-md"
            : "border-brand-border bg-brand-deep/78 backdrop-blur-sm"
        )}
      >
        <div className="mx-auto max-w-6xl">
          <nav
            className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
            aria-label="Primary"
          >
            <Link href="/" className="shrink-0">
              <BrandLogo
                size="sm"
                boxClassName="h-7 w-7 rounded-md"
                wordmarkClassName="text-xl font-bold"
              />
            </Link>

            <div className="hidden flex-1 justify-center md:flex">
              <div className="flex items-center gap-8">
                {desktopNavLinks.map((link) => {
                  const active = isLinkActive(link);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-sm transition-colors",
                        active
                          ? "font-medium text-brand-text"
                          : "text-brand-muted hover:text-brand-text"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="hidden px-2 text-sm text-brand-muted transition-colors hover:text-brand-text sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href={signupHref}
                className="inline-flex items-center justify-center rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-cyan-300"
              >
                Start Free
              </Link>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-brand-text transition-colors hover:bg-brand-card md:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </nav>
        </div>
      </header>

      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-0 z-[100] md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-col bg-brand-deep transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-brand-border px-4">
            <span className="text-sm font-semibold text-brand-muted">Menu</span>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-brand-text transition-colors hover:bg-brand-card"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-1">
            {mobileNavLinks.map((link) => {
              const active = isLinkActive(link);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-card text-brand-text"
                      : "text-brand-text hover:bg-brand-card"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              className="rounded-lg px-4 py-3 text-sm text-brand-muted transition-colors hover:bg-brand-card hover:text-brand-text"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            </div>
          </div>

          <div className="border-t border-brand-border p-4">
            <div className="flex flex-col gap-3">
              <Link
                href={signupHref}
                className="inline-flex items-center justify-center rounded-xl bg-brand-cyan px-4 py-3 text-sm font-semibold text-brand-deep"
                onClick={() => setOpen(false)}
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
