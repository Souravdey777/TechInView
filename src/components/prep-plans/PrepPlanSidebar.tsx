"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { History, Plus, X } from "lucide-react";
import { MonoLabel } from "@/components/shared/Rack";
import { DeletePrepPlanButton } from "@/components/prep-plans/DeletePrepPlanButton";
import {
  LOCAL_ONLY_NOTE,
  formatRelativeDay,
} from "@/components/prep-plans/PrepPlanMeta";
import type { PrepPlanSummary } from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";

type PrepPlanSidebarProps = {
  plans: readonly PrepPlanSummary[];
  isLoaded: boolean;
  activePlanId: string | null;
  onDeletePlan: (planId: string) => void;
  /** Provided by the chat page so a row swaps the thread instead of routing. */
  onSelectPlan?: (planId: string) => void;
  /** Provided by the chat page so "New plan" clears the thread in place. */
  onNewPlan?: () => void;
};

const ROW_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-card";

function NewPlanAction({
  onNewPlan,
  onNavigate,
}: {
  onNewPlan?: () => void;
  onNavigate?: () => void;
}) {
  const className = cn(
    "flex h-10 w-full items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-3",
    "text-sm font-medium text-brand-text transition-colors hover:border-brand-cyan/40 hover:bg-brand-card",
    ROW_FOCUS
  );

  if (onNewPlan) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          onNewPlan();
          onNavigate?.();
        }}
      >
        <Plus className="h-4 w-4 text-brand-cyan" />
        New plan
      </button>
    );
  }

  return (
    <Link href="/prep-guru" className={className} onClick={onNavigate}>
      <Plus className="h-4 w-4 text-brand-cyan" />
      New plan
    </Link>
  );
}

type PlanRowProps = {
  plan: PrepPlanSummary;
  isActive: boolean;
  onDeletePlan: (planId: string) => void;
  onSelectPlan?: (planId: string) => void;
  onNavigate?: () => void;
};

function PlanRow({
  plan,
  isActive,
  onDeletePlan,
  onSelectPlan,
  onNavigate,
}: PlanRowProps) {
  const rowClassName = cn(
    "min-w-0 flex-1 rounded-lg border-l-2 px-3 py-2 text-left transition-colors",
    isActive
      ? "border-brand-cyan bg-brand-card"
      : "border-transparent hover:border-brand-subtle hover:bg-brand-card",
    ROW_FOCUS
  );

  const rowLabel = `${plan.company} — ${plan.role}, updated ${formatRelativeDay(
    plan.updatedAt
  )}`;

  const rowBody = (
    <>
      <span
        className={cn(
          "block truncate text-[13px] font-medium",
          isActive ? "text-brand-text" : "text-brand-muted"
        )}
      >
        {plan.company}
      </span>
      <span className="mt-0.5 block truncate text-xs text-brand-subtle">
        {plan.role}
      </span>
      <MonoLabel className="mt-1.5 block text-[9px]">
        {formatRelativeDay(plan.updatedAt)}
      </MonoLabel>
    </>
  );

  return (
    <div className="flex items-start gap-1">
      {onSelectPlan ? (
        <button
          type="button"
          aria-label={rowLabel}
          aria-current={isActive ? "true" : undefined}
          onClick={() => {
            onSelectPlan(plan.id);
            onNavigate?.();
          }}
          className={rowClassName}
        >
          {rowBody}
        </button>
      ) : (
        <Link
          href={`/prep-guru/${plan.id}`}
          aria-label={rowLabel}
          aria-current={isActive ? "page" : undefined}
          onClick={onNavigate}
          className={cn(rowClassName, "block")}
        >
          {rowBody}
        </Link>
      )}

      <DeletePrepPlanButton
        planLabel={plan.label}
        onConfirm={() => onDeletePlan(plan.id)}
        triggerLabel="Delete loop"
        iconOnly
        variant="ghost"
      />
    </div>
  );
}

/** The history list itself, shared by the desktop rail and the mobile drawer. */
function SidebarBody({
  plans,
  isLoaded,
  activePlanId,
  onDeletePlan,
  onSelectPlan,
  onNewPlan,
  onNavigate,
}: PrepPlanSidebarProps & { onNavigate?: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <NewPlanAction onNewPlan={onNewPlan} onNavigate={onNavigate} />

      <div className="flex items-baseline justify-between gap-3 border-b border-brand-border pb-2">
        <MonoLabel className="tracking-[0.18em]">Your plans</MonoLabel>
        <MonoLabel className="text-[9px] tracking-[0.12em]">
          {isLoaded ? `${plans.length} saved` : "Reading"}
        </MonoLabel>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!isLoaded ? (
          <div className="flex flex-col gap-2 py-1" aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <div key={row} className="px-3 py-2">
                <span className="block h-2 w-24 rounded-sm bg-brand-border" />
                <span className="mt-2 block h-2 w-16 rounded-sm bg-brand-border/60" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="px-3 py-2 text-xs leading-relaxed text-brand-muted">
            No plans yet. Describe a target in the composer and Prep Guru will
            map the loop.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                isActive={plan.id === activePlanId}
                onDeletePlan={onDeletePlan}
                onSelectPlan={onSelectPlan}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      <p className="border-t border-brand-border pt-3 text-[11px] leading-relaxed text-brand-subtle">
        {LOCAL_ONLY_NOTE}
      </p>
    </div>
  );
}

/**
 * Record of every generated plan: a persistent rail from `lg` up, and a
 * slide-over drawer below it so 390px keeps the conversation full width.
 */
export function PrepPlanSidebar(props: PrepPlanSidebarProps) {
  const { plans, isLoaded, activePlanId } = props;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Returning focus to the trigger is what makes the drawer dismissable
  // without a mouse: otherwise focus is left on a node that just unmounted
  // and the next Tab restarts from the top of the document.
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Move focus in on open. The close button is the safe landing spot — the
  // plan rows below it are a list of unknown length.
  useEffect(() => {
    if (!isDrawerOpen) return;
    closeButtonRef.current?.focus();
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }

      // A drawer that covers the page has to trap Tab, or focus walks into the
      // conversation behind it while the overlay still swallows the clicks.
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => node.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? null;

  return (
    <>
      {/* ─── Mobile trigger ─── */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          ref={triggerRef}
          onClick={() => setIsDrawerOpen(true)}
          aria-expanded={isDrawerOpen}
          aria-controls="prep-guru-plan-drawer"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-3",
            "text-xs font-medium text-brand-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-text",
            ROW_FOCUS
          )}
        >
          <History className="h-3.5 w-3.5" />
          Your plans
          <span className="font-mono text-[10px] text-brand-subtle">
            {isLoaded ? plans.length : "–"}
          </span>
        </button>
        {activePlan ? (
          <MonoLabel className="min-w-0 truncate text-[9px]">
            {activePlan.company}
          </MonoLabel>
        ) : null}
      </div>

      {/* ─── Desktop rail ─── */}
      <aside className="hidden lg:sticky lg:top-[4.5rem] lg:flex lg:max-h-[calc(100vh-6.5rem)] lg:flex-col lg:self-start lg:rounded-2xl lg:border lg:border-brand-border lg:bg-brand-card lg:p-3">
        <SidebarBody {...props} />
      </aside>

      {/* ─── Mobile drawer ─── */}
      <div
        id="prep-guru-plan-drawer"
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!isDrawerOpen}
      >
        {/*
          * Click-outside-to-close only. Escape and the X button are the
          * announced close paths, so labelling the scrim too would put the
          * same action in the accessibility tree twice.
          */}
        <div
          aria-hidden="true"
          onClick={closeDrawer}
          className={cn(
            "absolute inset-0 bg-brand-deep/70 backdrop-blur-sm transition-opacity",
            isDrawerOpen ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Prep plan history"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[19rem] max-w-[88vw] flex-col border-r border-brand-border bg-brand-surface shadow-2xl transition-transform duration-200",
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-brand-border px-4">
            <MonoLabel className="tracking-[0.18em]">Prep Guru</MonoLabel>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={closeDrawer}
              tabIndex={isDrawerOpen ? 0 : -1}
              aria-label="Close plan history"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-brand-border text-brand-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mounted only while open so the closed drawer holds nothing focusable. */}
          <div className="flex min-h-0 flex-1 flex-col p-3">
            {isDrawerOpen ? (
              <SidebarBody {...props} onNavigate={closeDrawer} />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
