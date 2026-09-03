"use client";

import { cn } from "@/lib/utils";
import {
  PHASE_LABELS,
  PHASE_ORDER,
  PHASE_STEP,
  phaseIndex,
  type InterviewPhase,
} from "@/lib/interview-phases";

/**
 * The nine coding-round phases as a transport strip. Purely a read-out of
 * `currentPhase` — the interviewer advances the phase itself, with a time
 * floor, so nothing here is interactive.
 *
 * Collapses to a compact "Coding 5/9" below xl, where nine mono labels plus
 * the timer no longer fit the bar.
 */
export function PhaseTransport({ currentPhase }: { currentPhase: InterviewPhase }) {
  const activeIndex = phaseIndex(currentPhase);

  return (
    <>
      <ol
        className="m-0 hidden list-none items-center p-0 xl:flex"
        aria-label="Interview phase"
      >
        {PHASE_ORDER.map((phase, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={phase} className="flex items-center">
              {i > 0 ? (
                <span
                  className={cn(
                    "h-px w-2.5",
                    done || active ? "bg-brand-cyan/40" : "bg-brand-border"
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1",
                  active &&
                    "rounded-md border border-brand-cyan/40 bg-brand-cyan/[0.09]"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 rounded-full",
                    active
                      ? "h-1.5 w-1.5 bg-brand-cyan shadow-sm shadow-brand-cyan/60"
                      : done
                        ? "h-1 w-1 bg-brand-green"
                        : "h-1 w-1 bg-brand-border"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-wide",
                    active
                      ? "font-bold text-brand-cyan"
                      : done
                        ? "text-brand-subtle"
                        : "text-brand-muted"
                  )}
                >
                  {PHASE_LABELS[phase]}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-2 xl:hidden">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan shadow-sm shadow-brand-cyan/60"
          aria-hidden
        />
        <span className="font-mono text-[11px] font-bold tracking-wide text-brand-cyan">
          {PHASE_LABELS[currentPhase]}
        </span>
        <span className="font-mono text-[10px] text-brand-subtle">
          {PHASE_STEP[currentPhase]}/{PHASE_ORDER.length}
        </span>
      </div>
    </>
  );
}
