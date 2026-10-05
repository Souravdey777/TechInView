"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  LogOut,
  Mail,
  Menu,
  Settings2,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/hooks/useSupabase";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { BTN_GHOST, BTN_SM, CONTAINER, FOCUS, PAD } from "@/components/marketing/ds";
import { createSupportMailto } from "@/lib/legal";
import { getPublicProfilePath } from "@/lib/public-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
const PUBLIC_PAGE_HREF = "/settings#public-page";

type AppNavProps = {
  userEmail: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  isPublicProfile?: boolean;
  credits?: number;
};

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getAvatarInitial(displayName: string | null | undefined, userEmail: string) {
  return (displayName?.trim() || userEmail || "?").charAt(0).toUpperCase();
}

/**
 * The public page only resolves once a handle exists and the profile is
 * published, so link straight to it when it is live and to the settings
 * section that turns it on otherwise.
 */
function getPublicProfileLink(
  username: string | null | undefined,
  isPublicProfile: boolean
) {
  const handle = username?.trim();

  if (handle && isPublicProfile) {
    return { href: getPublicProfilePath(handle), isLive: true as const };
  }

  return { href: PUBLIC_PAGE_HREF, isLive: false as const };
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
  avatarUrl,
  username,
  isPublicProfile,
}: {
  userEmail: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  isPublicProfile: boolean;
}) {
  const router = useRouter();
  const { signOut } = useSupabase();
  const initial = getAvatarInitial(displayName, userEmail);
  const publicProfile = getPublicProfileLink(username, isPublicProfile);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group shrink-0 rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
        )}
        aria-label="Account menu"
      >
        <Avatar
          className={cn(
            "h-8 w-8 border border-white/[0.12] bg-transparent text-xs text-brand-muted",
            "transition-colors group-hover:border-brand-cyan/40 group-hover:text-brand-text",
            "group-data-[state=open]:border-brand-cyan/40 group-data-[state=open]:text-brand-text"
          )}
        >
          <AvatarImage src={avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="border-0 bg-transparent text-xs font-semibold text-inherit">
            {initial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      {/* Portaled to <body>, outside the layout theme, so it re-applies it. */}
      <DropdownMenuContent align="end" className="theme-landing w-64 font-sans">
        <div className="flex items-center gap-2.5 px-2.5 pb-2 pt-1.5">
          <Avatar className="h-9 w-9 border border-white/[0.12] bg-transparent text-brand-muted">
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="border-0 bg-transparent text-xs font-semibold text-inherit">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
              Signed in as
            </p>
            <p
              className="mt-0.5 truncate text-sm font-medium text-brand-text"
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
        </div>
        <DropdownMenuSeparator />
        {publicProfile.isLive ? (
          <DropdownMenuItem asChild>
            <a href={publicProfile.href} target="_blank" rel="noreferrer">
              <UserRound />
              Public profile
              <ExternalLink className="ml-auto !size-3.5" />
            </a>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={publicProfile.href}>
              <UserRound />
              Set up public profile
            </Link>
          </DropdownMenuItem>
        )}
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

export function AppNav({
  userEmail,
  displayName,
  avatarUrl,
  username,
  isPublicProfile = false,
  credits = 0,
}: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSupabase();
  const [open, setOpen] = useState(false);
  const publicProfile = getPublicProfileLink(username, isPublicProfile);

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
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-brand-deep/80 backdrop-blur-[14px]">
        <div className={cn(CONTAINER, PAD, "flex h-16 items-center justify-between gap-6")}>
          <div className="flex min-w-0 items-center gap-10">
            <Link
              href="/dashboard"
              className={cn("inline-flex shrink-0 items-center transition-opacity hover:opacity-90", FOCUS)}
              aria-label="Go to dashboard"
            >
              <BrandLogo size="sm" boxClassName="h-7 w-7 rounded-md" wordmarkClassName="text-lg font-semibold" />
            </Link>

            <nav aria-label="App" className="hidden items-center gap-7 font-mono text-xs uppercase tracking-[0.08em] lg:flex">
              {NAV_ITEMS.map(({ href, label }) => {
                const isActive = isItemActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "transition-colors",
                      FOCUS,
                      isActive ? "text-brand-cyan" : "text-brand-muted hover:text-brand-text"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3 lg:gap-4">
            <RoundsCounter credits={credits} className="hidden sm:inline" />

            <Link
              href={ROUNDS_HREF}
              className={cn(BTN_GHOST, BTN_SM, "hidden lg:inline-flex")}
            >
              Buy rounds
            </Link>

            <div className="hidden lg:block">
              <AccountMenu
                userEmail={userEmail}
                displayName={displayName}
                avatarUrl={avatarUrl}
                username={username}
                isPublicProfile={isPublicProfile}
              />
            </div>

            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full",
                "border border-white/[0.12] text-brand-text transition-colors",
                "hover:border-brand-cyan hover:text-brand-cyan lg:hidden"
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
            "absolute inset-x-0 top-0 flex flex-col border-b border-white/[0.08] bg-brand-deep transition-transform duration-200",
            open ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className={cn(PAD, "flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/[0.08]")}>
            <BrandLogo size="sm" boxClassName="h-7 w-7 rounded-md" wordmarkClassName="text-lg font-semibold" />
            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] text-brand-text transition-colors hover:border-brand-cyan hover:text-brand-cyan"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav aria-label="App" className={cn(PAD, "flex flex-col py-2")}>
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
                    "flex h-14 items-center border-b border-white/[0.08] text-2xl font-normal tracking-[-0.03em] transition-colors",
                    isActive ? "text-brand-cyan" : "text-brand-text hover:text-brand-cyan"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className={cn(PAD, "py-4")}>
            <div className="flex items-center justify-between gap-3">
              <RoundsCounter credits={credits} />
              <Link
                href={ROUNDS_HREF}
                onClick={close}
                tabIndex={open ? 0 : -1}
                className={cn(BTN_GHOST, BTN_SM)}
              >
                Buy rounds
              </Link>
            </div>
          </div>

          <div className={cn(PAD, "flex flex-col gap-1 border-t border-white/[0.08] py-4")}>
            <div className="flex items-center gap-2.5 pb-2">
              <Avatar className="h-8 w-8 border border-white/[0.12] bg-transparent text-brand-muted">
                <AvatarImage src={avatarUrl ?? undefined} alt="" />
                <AvatarFallback className="border-0 bg-transparent text-xs font-semibold text-inherit">
                  {getAvatarInitial(displayName, userEmail)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-subtle">
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

            {publicProfile.isLive ? (
              <a
                href={publicProfile.href}
                target="_blank"
                rel="noreferrer"
                onClick={close}
                tabIndex={open ? 0 : -1}
                className="flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-brand-text"
              >
                <UserRound className="h-4 w-4" />
                Public profile
                <ExternalLink className="ml-auto h-3.5 w-3.5" />
              </a>
            ) : (
              <Link
                href={publicProfile.href}
                onClick={close}
                tabIndex={open ? 0 : -1}
                className="flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-brand-text"
              >
                <UserRound className="h-4 w-4" />
                Set up public profile
              </Link>
            )}

            <Link
              href="/settings"
              onClick={close}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-brand-text"
            >
              <Settings2 className="h-4 w-4" />
              Settings
            </Link>
            <a
              href={SUPPORT_HREF}
              onClick={close}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-brand-text"
            >
              <Mail className="h-4 w-4" />
              Contact support
            </a>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              tabIndex={open ? 0 : -1}
              className="flex items-center gap-2.5 rounded-full px-3 py-2.5 text-left text-sm text-brand-muted transition-colors hover:bg-brand-rose/5 hover:text-brand-rose"
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
