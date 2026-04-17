"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Settings2,
  LogOut,
  Sparkles,
  FolderKanban,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/hooks/useSupabase";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { createSupportMailto } from "@/lib/legal";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prep-plans", label: "Prep Plans", icon: FolderKanban },
  { href: "/problems", label: "Problems", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const SIDEBAR_SUPPORT_HREF = createSupportMailto({
  subject: "TechInView support request",
});

type SidebarProps = {
  userEmail: string;
  startingPrice?: string;
};

type SidebarContentProps = SidebarProps & {
  onNavigate?: () => void;
};

function SidebarContent({
  userEmail,
  startingPrice = "$19",
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSupabase();

  const handleSignOut = async () => {
    onNavigate?.();
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-brand-border">
        <BrandLogo size="sm" wordmarkClassName="text-base" />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border",
                isActive
                  ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20"
                  : "text-brand-muted hover:text-brand-text hover:bg-brand-card border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-brand-cyan" : "text-brand-muted"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade prompt */}
      <div className="px-3 pb-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex flex-col gap-2 p-3 rounded-xl bg-gradient-to-br from-brand-cyan/10 via-brand-card to-brand-green/10 border border-brand-cyan/20 hover:border-brand-cyan/40 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-semibold text-brand-text">Get more interviews</span>
          </div>
          <p className="text-[11px] text-brand-muted leading-relaxed">
            Buy interview packs starting at {startingPrice}. Practice more, score higher.
          </p>
          <span className="text-[11px] font-semibold text-brand-cyan">
            View pricing &rarr;
          </span>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <a
          href={SIDEBAR_SUPPORT_HREF}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2.5 text-xs font-medium text-brand-muted transition-colors hover:border-brand-cyan/30 hover:bg-brand-card hover:text-brand-text"
        >
          <Mail className="h-3.5 w-3.5 text-brand-cyan" />
          Contact support
        </a>
      </div>

      {/* User Info + Sign Out */}
      <div className="px-3 py-4 border-t border-brand-border space-y-1">
        <div className="px-3 py-2 rounded-lg bg-brand-card border border-brand-border">
          <p className="text-brand-muted text-xs mb-0.5">Signed in as</p>
          <p
            className="text-brand-text text-sm font-medium truncate"
            title={userEmail}
          >
            {userEmail}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-rose hover:bg-brand-rose/5 border border-transparent transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ userEmail, startingPrice = "$19" }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-brand-border bg-brand-surface lg:flex">
      <SidebarContent userEmail={userEmail} startingPrice={startingPrice} />
    </aside>
  );
}

export function MobileAppNav({ userEmail, startingPrice = "$19" }: SidebarProps) {
  const pathname = usePathname();
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

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <BrandLogo size="sm" wordmarkClassName="text-base" />
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-card text-brand-text transition-colors hover:border-brand-cyan/30 hover:text-brand-cyan"
            aria-expanded={open}
            aria-controls="mobile-app-nav"
            aria-label={open ? "Close app navigation" : "Open app navigation"}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div
        id="mobile-app-nav"
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-brand-deep/70 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={close}
          aria-label="Close navigation overlay"
        />

        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col border-r border-brand-border bg-brand-surface shadow-2xl transition-transform",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            userEmail={userEmail}
            startingPrice={startingPrice}
            onNavigate={close}
          />
        </aside>
      </div>
    </>
  );
}
