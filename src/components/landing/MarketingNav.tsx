"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { BTN_PRIMARY, BTN_SM, CONTAINER, FOCUS, PAD } from "@/components/marketing/ds";

type MarketingNavProps = {
  loginHref?: string;
  signupHref?: string;
};

type NavLink = {
  href: string;
  label: string;
  /** Landing section this link scrolls to (scroll-spy target on "/"). */
  sectionId?: string;
  /** Route prefix that makes this link active, e.g. "/blog" for every post. */
  route?: string;
  /** Shown in the mobile menu only. */
  mobileOnly?: boolean;
};

const NAV_LINKS: readonly NavLink[] = [
  { href: "/#features", label: "Features", sectionId: "features" },
  { href: "/#how-it-works", label: "How it works", sectionId: "how-it-works" },
  { href: "/#pricing", label: "Pricing", sectionId: "pricing" },
  { href: "/#faq", label: "FAQ", sectionId: "faq", mobileOnly: true },
  { href: "/practice", label: "Practice", route: "/practice" },
  { href: "/how-ai-evaluates", label: "Scoring", route: "/how-ai-evaluates", mobileOnly: true },
  { href: "/blog", label: "Blog", route: "/blog" },
];

/**
 * Every landing section in page order. Sections without a nav link (room,
 * score) still count, so scrolling into them clears the previous highlight.
 */
const SPY_SECTION_IDS = ["room", "features", "how-it-works", "score", "pricing", "faq"];
const SECTION_TRIGGER_PX = 160;

const ICON_BTN = cn(
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.12] text-brand-text transition-colors hover:border-brand-cyan hover:text-brand-cyan",
  FOCUS,
  "focus-visible:rounded-full"
);

/** The app's real logo (icon + wordmark), sized for the marketing nav and footer. */
export function Wordmark() {
  return <BrandLogo size="sm" boxClassName="h-7 w-7 rounded-md" wordmarkClassName="text-lg font-semibold" />;
}

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function MarketingNav({ loginHref = "/login", signupHref = "/signup" }: MarketingNavProps) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Mobile menu: lock scroll, trap Tab, Escape closes, focus moves in and back out.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) menuButtonRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    closeButtonRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // The menu only exists below lg; close it if the viewport grows past that.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && setOpen(false);

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Scrolled background + landing scroll-spy.
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 12);

      if (pathname !== "/") {
        setActiveSection("");
        return;
      }

      const current = SPY_SECTION_IDS.filter((id) => {
        const section = document.getElementById(id);
        return section ? section.getBoundingClientRect().top <= SECTION_TRIGGER_PX : false;
      }).at(-1);

      setActiveSection(current ?? "");
    };

    const requestUpdate = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
    };
  }, [pathname]);

  const isActive = (link: NavLink) => {
    if (link.route) return matchesRoute(pathname, link.route);
    return pathname === "/" && activeSection === link.sectionId;
  };

  // Route links mark the current page; section links mark the current location on it.
  const ariaCurrent = (link: NavLink) => (isActive(link) ? (link.route ? "page" : "location") : undefined);

  const desktopLinks = NAV_LINKS.filter((link) => !link.mobileOnly);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-white/[0.08] backdrop-blur-[14px] transition-colors duration-300",
          scrolled ? "bg-brand-deep/80" : "bg-brand-deep/60"
        )}
      >
        <nav aria-label="Primary" className={cn(CONTAINER, PAD, "flex h-16 items-center justify-between gap-6")}>
          <Link href="/" className={cn("shrink-0", FOCUS)} aria-label="TechInView home">
            <Wordmark />
          </Link>

          <ul className="hidden items-center gap-7 font-mono text-xs uppercase tracking-[0.08em] lg:flex">
            {desktopLinks.map((link) => {
              const active = isActive(link);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={ariaCurrent(link)}
                    className={cn(
                      "transition-colors",
                      FOCUS,
                      active ? "text-brand-cyan" : "text-brand-muted hover:text-brand-text"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href={loginHref}
              className={cn("hidden text-sm text-brand-muted transition-colors hover:text-brand-text sm:inline-flex", FOCUS)}
            >
              Log in
            </Link>
            <Link href={signupHref} className={cn(BTN_PRIMARY, BTN_SM, "hidden min-[400px]:inline-flex")}>
              Practice free
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className={cn(ICON_BTN, "lg:hidden")}
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-nav"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        // Keeps the closed menu out of the tab order and accessibility tree.
        // React 18 only emits `inert` for a string value; use `inert={!open}` on React 19.
        {...(open ? {} : { inert: "" as unknown as boolean })}
        className={cn(
          "fixed inset-0 z-[100] flex flex-col bg-brand-deep transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Same height, container and gutter as the header so nothing jumps on open. */}
        <div className="shrink-0 border-b border-white/[0.08]">
          <div className={cn(CONTAINER, PAD, "flex h-16 items-center justify-between gap-6")}>
            <Link href="/" className={cn("shrink-0", FOCUS)} aria-label="TechInView home" onClick={() => setOpen(false)}>
              <Wordmark />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              className={ICON_BTN}
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul className={cn(CONTAINER, PAD, "flex flex-col py-6 font-mono text-sm uppercase tracking-[0.08em]")}>
            {NAV_LINKS.map((link) => {
              const active = isActive(link);
              return (
                <li key={link.href} className="border-b border-white/[0.08] first:border-t">
                  <Link
                    href={link.href}
                    aria-current={ariaCurrent(link)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between py-4 transition-colors",
                      FOCUS,
                      active ? "text-brand-cyan" : "text-brand-text hover:text-brand-cyan"
                    )}
                  >
                    {link.label}
                    <span aria-hidden className="text-brand-subtle">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
            <li className="border-b border-white/[0.08]">
              <Link
                href={loginHref}
                onClick={() => setOpen(false)}
                className={cn("flex py-4 text-brand-muted transition-colors hover:text-brand-cyan", FOCUS)}
              >
                Log in
              </Link>
            </li>
          </ul>
        </div>

        <div className="shrink-0 border-t border-white/[0.08]">
          <div className={cn(CONTAINER, PAD, "py-5")}>
            <Link href={signupHref} onClick={() => setOpen(false)} className={cn(BTN_PRIMARY, "w-full")}>
              Practice free <span className="font-mono">→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
