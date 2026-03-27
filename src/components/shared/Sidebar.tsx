"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Settings2,
  LogOut,
  Cpu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/hooks/useSupabase";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

type SidebarProps = {
  userEmail: string;
  startingPrice?: string;
};

export function Sidebar({ userEmail, startingPrice = "$8" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSupabase();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-brand-surface border-r border-brand-border z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-brand-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30">
          <Cpu className="w-4 h-4 text-brand-cyan" />
        </div>
        <span className="text-brand-text font-heading font-semibold text-base tracking-tight">
          TechInView
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20"
                  : "text-brand-muted hover:text-brand-text hover:bg-brand-card border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-brand-cyan" : "text-brand-muted"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade prompt */}
      <div className="px-3 pb-2">
        <Link
          href="/settings"
          className="flex flex-col gap-2 p-3 rounded-xl bg-gradient-to-br from-brand-cyan/10 via-brand-card to-purple-500/10 border border-brand-cyan/20 hover:border-brand-cyan/40 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-semibold text-brand-text">Get more interviews</span>
          </div>
          <p className="text-[11px] text-brand-muted leading-relaxed">
            Buy credit packs starting at {startingPrice}. Practice more, score higher.
          </p>
          <span className="text-[11px] font-semibold text-brand-cyan">
            View pricing &rarr;
          </span>
        </Link>
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
    </aside>
  );
}
