"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Mail,
  Menu,
  Settings2,
  Ticket,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/hooks/useSupabase";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { createSupportMailto } from "@/lib/legal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/problems", label: "Problems" },
  { href: "/prep-guru", label: "Prep Guru" },
  { href: "/progress", label: "Progress" },
];

const SUPPORT_HREF = createSupportMailto({
  subject: "TechInView support request",
});

const ROUNDS_HREF = "/settings#rounds";

type AppNavProps = {
  userEmail: string;
  displayName?: string | null;
  credits?: number;
};

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatRounds(credits: number) {
  return `${credits} round${credits === 1 ? "" : "s"} left`;
}

/** Mono meta text used for the rounds counter. */
function RoundsCounter({
  credits,
  className,
}: {
  credits: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] tracking-[0.1em]",
        credits > 0 ? "text-brand-muted" : "text-brand-subtle",
        className
      )}
    >
      {formatRounds(credits)}
    </span>
  );
}

function AccountMenu({
  userEmail,
  displayName,
}: {
  userEmail: string;
  displayName?: string | null;
}) {
  const router = useRouter();
  const { signOut } = useSupabase();
  const initial = (displayName?.trim() || userEmail || "?")
    .charAt(0)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full",
          "border border-brand-border bg-brand-card text-xs font-semibold text-brand-muted",
          "transition-colors hover:border-brand-cyan/40 hover:text-brand-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface",
          "data-[state=open]:border-brand-cyan/40 data-[state=open]:text-brand-text"
        )}
        aria-label="Account menu"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2.5 pb-2 pt-1.5">
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-brand-subtle">
            Signed in as
          </p>
          <p
            className="mt-1 truncate text-sm font-medium text-brand-text"
            title={userEmail}
          >
            {displayName?.trim() || userEmail}
          </p>
          {displayName?.trim() ? (
            <p className="truncate text-xs text-brand-muted" title={userEmail}>
              {userEmail}
            </p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings2 />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUNDS_HREF}>
            <Ticket />
            Rounds and billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={SUPPORT_HREF}>
            <Mail />
            Contact support
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleSignOut()}
          className="text-brand-muted hover:text-brand-rose focus:text-brand-rose [&_svg]:hover:text-brand-rose"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppNav({ userEmail, displayName, credits = 0 }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSupabase();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [open]);

  const handleSignOut = async () => {
    close();
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand-border bg-brand-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-7">
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-90"
              aria-label="Go to dashboard"
            >
              <BrandLogo size="sm" wordmarkClassName="text-sm" />
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {NAV_ITEMS.map(({ href, label }) => {
                const isActive = isItemActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-sm text-[13px] transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-brand-surface",
                      isActive
                        ? "font-semibold text-brand-text"
                        : "text-brand-subtle hover:text-brand-text"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block border-b pb-[3px]",
                        isActive ? "border-brand-cyan" : "border-transparent"
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3 lg:gap-4">
            <RoundsCounter credits={credits} className="hidden sm:inline" />

            <Link
              href={ROUNDS_HREF}
              className={cn(
                "hidden h-9 items-center rounded-md border border-brand-border px-3.5",
                "text-[13px] font-medium text-brand-muted transition-colors",
                "hover:border-brand-cyan/40 hover:text-brand-text lg:inline-flex",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface"
              )}
            >
              Buy rounds
            </Link>

            <div className="hidden lg:block">
              <AccountMenu userEmail={userEmail} displayName={displayName} />
            </div>

            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md",
                "border border-brand-border text-brand-muted transition-colors",
                "hover:border-brand-cyan/40 hover:text-brand-text lg:hidden"
              )}
              aria-expanded={open}
              aria-controls="app-nav-drawer"
              aria-label={open ? "Close navigation" : "Open navigation"}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="app-nav-drawer"
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          className={cn(
            "absolute inset-0 bg-brand-deep/70 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={close}
          aria-label="Close navigation overlay"
        />

        <aside
          className={cn(
            "absolute inset-x-0 top-0 flex flex-col border-b border-brand-border bg-brand-surface shadow-2xl transition-transform duration-200",
            open ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-brand-border px-4 sm:px-6">
            <BrandLogo size="sm" wordmarkClassName="text-sm" />
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-brand-border text-brand-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-text"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-col px-4 py-2 sm:px-6">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = isItemActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  tabIndex={open ? 0 : -1}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center border-l px-4 text-sm transition-colors",
                    isActive
                      ? "border-brand-cyan bg-brand-card font-semibold text-brand-text"
                      : "border-transparent text-brand-muted hover:bg-brand-card hover:text-brand-text"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-brand-border px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <RoundsCounter credits={credits} />
              <Link
                href={ROUNDS_HREF}
                onClick={close}
                tabIndex={open ? 0 : -1}
                className="inline-flex h-9 items-center rounded-md border border-brand-border px-3.5 text-[13px] font-medium text-brand-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-text"
              >
                Buy rounds
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-brand-border px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2.5 pb-2">
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-card text-xs font-semibold text-brand-muted">
                {(displayName?.trim() || userEmail || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-brand-subtle">
                  Signed in as
                </p>
                <p
                  className="truncate text-sm font-medium text-brand-text"
                  title={userEmail}
                >
                  {displayName?.trim() || userEmail}
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              onClick={close}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm text-brand-muted transition-colors hover:bg-brand-card hover:text-brand-text"
            >
              <Settings2 className="h-4 w-4" />
              Settings
            </Link>
            <a
              href={SUPPORT_HREF}
              onClick={close}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm text-brand-muted transition-colors hover:bg-brand-card hover:text-brand-text"
            >
              <Mail className="h-4 w-4" />
              Contact support
            </a>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-brand-rose/5 hover:text-brand-rose"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
