import type { ReactNode } from "react";
import { MonoLabel } from "@/components/shared/Rack";
import type { PrepPlanSummary } from "@/lib/dashboard/models";

/**
 * The two turn shells behind every Prep Guru thread, read like an interview
 * transcript: a hairline rule above each turn and a mono speaker label. No
 * bubbles or panels; the user turn is set off by a quiet left rule.
 */

export function UserTurn({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-white/[0.08] pt-5">
      <MonoLabel className="mb-3 block">You</MonoLabel>
      <div className="border-l border-white/[0.18] pl-4">{children}</div>
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
    <div className="border-t border-white/[0.08] pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <MonoLabel className="text-brand-text">Prep Guru</MonoLabel>
        {accessory}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** The turn that opened a stored plan: whatever the candidate sent in. */
export function TargetTurn({ plan }: { plan: PrepPlanSummary }) {
  const pastedText = plan.jdText.trim();

  return (
    <UserTurn>
      <MonoLabel>{pastedText ? "Posting pasted" : "Target"}</MonoLabel>
      <p className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed text-brand-text">
        {pastedText || `${plan.role} at ${plan.company}`}
      </p>
    </UserTurn>
  );
}
