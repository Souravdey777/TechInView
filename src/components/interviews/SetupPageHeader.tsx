"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Button } from "@/components/ui/button";
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
    <div className="border-b border-brand-border bg-brand-surface">
      <div
        className={cn(
          "mx-auto flex flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between",
          containerClassName
        )}
      >
        <button
          type="button"
          onClick={() => void handleLogoClick()}
          className="inline-flex w-fit items-center rounded-lg text-left transition-opacity hover:opacity-90"
          aria-label={user ? "Go to dashboard" : "Go to homepage"}
        >
          <BrandLogo size="sm" wordmarkClassName="text-base" />
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
          {supportingText ? (
            <span className="text-left text-xs text-brand-muted sm:text-sm md:text-right">
              {supportingText}
            </span>
          ) : null}

          {user ? (
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Go to dashboard
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
