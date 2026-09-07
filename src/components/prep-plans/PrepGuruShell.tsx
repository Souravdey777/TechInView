"use client";

import type { ReactNode } from "react";
import { PrepPlanSidebar } from "@/components/prep-plans/PrepPlanSidebar";
import type { PrepPlanSummary } from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";

type PrepGuruShellProps = {
  plans: readonly PrepPlanSummary[];
  isLoaded: boolean;
  activePlanId: string | null;
  onDeletePlan: (planId: string) => void;
  onSelectPlan?: (planId: string) => void;
  onNewPlan?: () => void;
  children: ReactNode;
  /** The conversation column measure. Wider on the plan transcript. */
  mainClassName?: string;
  /**
   * Names the page for assistive tech. A chat surface has no visible page
   * title — every heading in the thread belongs to a turn, not the page — so
   * the h1 is visually hidden rather than absent.
   */
  heading?: string;
};

/**
 * Prep Guru's two-part frame: a plan-history rail on the left and one
 * comfortably measured conversation column on the right. Below `lg` the rail
 * becomes a drawer and the conversation takes the full width.
 */
export function PrepGuruShell({
  children,
  mainClassName,
  heading = "Prep Guru",
  ...sidebarProps
}: PrepGuruShellProps) {
  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-6">
      <h1 className="sr-only">{heading}</h1>

      <PrepPlanSidebar {...sidebarProps} />

      <div
        className={cn(
          "mx-auto mt-5 w-full max-w-3xl lg:mt-0",
          mainClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
