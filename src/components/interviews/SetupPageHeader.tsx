"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Button } from "@/components/ui/button";
import { FOCUS, PAD } from "@/components/marketing/ds";
import { useSupabase } from "@/hooks/useSupabase";
import { cn } from "@/lib/utils";

type SetupPageHeaderProps = {
  supportingText?: string;
  containerClassName?: string;
};

export function SetupPageHeader({
  supportingText,
  containerClassName,
}: SetupPageHeaderProps) {
  const router = useRouter();
  const { supabase, user } = useSupabase();

  const handleLogoClick = async () => {
    try {
      const activeUser =
        user ?? (await supabase.auth.getUser()).data.user;
      router.push(activeUser ? "/dashboard" : "/");
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="border-b border-white/[0.08] bg-brand-deep">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between",
          PAD,
          containerClassName
        )}
      >
        <button
          type="button"
          onClick={() => void handleLogoClick()}
          className={cn(
            "inline-flex w-fit items-center text-left transition-opacity hover:opacity-90",
            FOCUS
          )}
          aria-label={user ? "Go to dashboard" : "Go to homepage"}
        >
          <BrandLogo size="sm" wordmarkClassName="text-base" />
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
          {supportingText ? (
            <span className="text-left font-mono text-[11px] uppercase tracking-[0.12em] text-brand-subtle md:text-right">
              {supportingText}
            </span>
          ) : null}

          {user ? (
            <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
              <Link href="/dashboard">
                <LayoutDashboard />
                Go to dashboard
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
