import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { MonoLabel } from "@/components/shared/Rack";
import type { PrepPlanSummary } from "@/lib/dashboard/models";

/**
 * The two turn shells behind every Prep Guru thread. Both stay quiet: the user
 * turn is a right-aligned recessed bubble, the assistant turn is a panel with a
 * mono byline above it.
 */

export function UserTurn({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <MonoLabel className="text-[9px]">You</MonoLabel>
      <div className="max-w-[92%] rounded-2xl rounded-br-md border border-brand-border bg-brand-surface px-4 py-3 sm:max-w-[85%]">
        {children}
      </div>
    </div>
  );
}

export function AssistantTurn({
  accessory,
  children,
}: {
  accessory?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <MonoLabel className="tracking-[0.18em] text-brand-cyan">
            Prep Guru
          </MonoLabel>
        </span>
        {accessory}
      </div>
      <div className="rounded-2xl rounded-tl-md border border-brand-border bg-brand-card p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}

/** The turn that opened a stored plan: whatever the candidate sent in. */
export function TargetTurn({ plan }: { plan: PrepPlanSummary }) {
  const pastedText = plan.jdText.trim();

  return (
    <UserTurn>
      <MonoLabel className="text-[9px]">
        {pastedText ? "Posting pasted" : "Target"}
      </MonoLabel>
      <p className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-brand-text">
        {pastedText || `${plan.role} at ${plan.company}`}
      </p>
    </UserTurn>
  );
}
