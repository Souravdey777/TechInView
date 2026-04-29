"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TimelineTone = "cyan" | "green" | "amber" | "rose";

type InterviewArcStep = {
  window: string;
  label: string;
  title: string;
  description: string;
  signal: string;
  tone: TimelineTone;
};

const TIMELINE_STYLES: Record<
  TimelineTone,
  {
    activeBadge: string;
    activeCard: string;
    activeMarker: string;
    badgeText: string;
    border: string;
    glow: string;
    surface: string;
  }
> = {
  cyan: {
    activeBadge: "border-brand-cyan/45 bg-brand-cyan/15 text-brand-cyan shadow-sm shadow-brand-cyan/10",
    activeCard: "bg-brand-cyan/[0.09] ring-1 ring-brand-cyan/30",
    activeMarker: "border-brand-cyan/45 bg-brand-cyan/15 text-brand-cyan shadow-lg shadow-brand-cyan/20",
    badgeText: "text-brand-cyan",
    border: "border-brand-cyan/25",
    glow: "shadow-xl shadow-brand-cyan/10",
    surface: "bg-brand-cyan/10",
  },
  green: {
    activeBadge: "border-brand-green/45 bg-brand-green/15 text-brand-green shadow-sm shadow-brand-green/10",
    activeCard: "bg-brand-green/[0.08] ring-1 ring-brand-green/30",
    activeMarker: "border-brand-green/45 bg-brand-green/15 text-brand-green shadow-lg shadow-brand-green/20",
    badgeText: "text-brand-green",
    border: "border-brand-green/25",
    glow: "shadow-xl shadow-brand-green/10",
    surface: "bg-brand-green/10",
  },
  amber: {
    activeBadge: "border-brand-amber/45 bg-brand-amber/15 text-brand-amber shadow-sm shadow-brand-amber/10",
    activeCard: "bg-brand-amber/[0.08] ring-1 ring-brand-amber/30",
    activeMarker: "border-brand-amber/45 bg-brand-amber/15 text-brand-amber shadow-lg shadow-brand-amber/20",
    badgeText: "text-brand-amber",
    border: "border-brand-amber/25",
    glow: "shadow-xl shadow-brand-amber/10",
    surface: "bg-brand-amber/10",
  },
  rose: {
    activeBadge: "border-brand-rose/45 bg-brand-rose/15 text-brand-rose shadow-sm shadow-brand-rose/10",
    activeCard: "bg-brand-rose/[0.08] ring-1 ring-brand-rose/30",
    activeMarker: "border-brand-rose/45 bg-brand-rose/15 text-brand-rose shadow-lg shadow-brand-rose/20",
    badgeText: "text-brand-rose",
    border: "border-brand-rose/25",
    glow: "shadow-xl shadow-brand-rose/10",
    surface: "bg-brand-rose/10",
  },
};

const INTERVIEW_ARC_STEPS: readonly InterviewArcStep[] = [
  {
    window: "00:00 - 01:00",
    label: "Phase 1 · Introduction",
    title: "Quick intro and bar setting",
    description:
      "The interviewer opens warmly, calibrates your background, and establishes that this is a real screen, not a practice sandbox with infinite hints.",
    signal: "Tone, confidence, and clarity start getting judged immediately",
    tone: "cyan",
  },
  {
    window: "01:00 - 02:00",
    label: "Phase 2 · Problem",
    title: "Problem statement gets delivered live",
    description:
      "You hear the prompt, examples, and constraints the way you would in a live round, with enough context to start reasoning but not enough to skip thinking.",
    signal: "You need to absorb the prompt and stay conversational under pressure",
    tone: "cyan",
  },
  {
    window: "02:00 - 05:00",
    label: "Phase 3 · Clarification",
    title: "Clarify assumptions before you commit",
    description:
      "Strong candidates use this window to de-risk ambiguity, confirm edge conditions, and show they know how to frame the problem before they touch the keyboard.",
    signal: "Good questions shrink the solution space early",
    tone: "green",
  },
  {
    window: "05:00 - 12:00",
    label: "Phase 4 · Approach",
    title: "Explain the approach and defend it",
    description:
      "You walk through the plan, tradeoffs, and data structures. If the path is weak, the interviewer pushes back instead of letting you code into a dead end.",
    signal: "Reasoning quality matters as much as eventual code",
    tone: "green",
  },
  {
    window: "12:00 - 32:00",
    label: "Phase 5 · Coding",
    title: "Code while the interviewer listens",
    description:
      "This is the long execution stretch: narrate key decisions, keep momentum, and recover cleanly if you hit a bug or need to change direction mid-solution.",
    signal: "Voice, implementation speed, and code quality all get tested together",
    tone: "amber",
  },
  {
    window: "32:00 - 37:00",
    label: "Phase 6 · Testing",
    title: "Trace examples and hunt edge cases",
    description:
      "You prove the solution against concrete cases, talk through tricky inputs, and show whether you can debug systematically instead of hoping the code is right.",
    signal: "Edge cases and bug recovery separate solid answers from shaky ones",
    tone: "amber",
  },
  {
    window: "37:00 - 40:00",
    label: "Phase 7 · Complexity",
    title: "Defend time and space complexity",
    description:
      "The interviewer pressures the analysis, checks whether the tradeoffs match the actual implementation, and looks for sloppy reasoning around scale.",
    signal: "Your analysis has to match the code you actually wrote",
    tone: "rose",
  },
  {
    window: "40:00 - 43:00",
    label: "Phase 8 · Follow-up",
    title: "Handle the harder variant if time allows",
    description:
      "Stronger rounds get stretched with a tighter constraint, a scaling twist, or a variant that forces you to generalize the original solution without panicking.",
    signal: "Better candidates get pushed deeper, not let off early",
    tone: "rose",
  },
  {
    window: "43:00 - 45:00",
    label: "Phase 9 · Wrap-up",
    title: "Close like a real technical screen",
    description:
      "The round lands with a concise wrap-up instead of a vague ending, leaving enough signal across communication, execution, testing, and judgment to score credibly.",
    signal: "The session ends with a realistic final impression, not just a timeout",
    tone: "cyan",
  },
] as const;

const ACTIVE_TRIGGER_PX = 240;

export function HowItWorksTimeline() {
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [visibleCards, setVisibleCards] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(INTERVIEW_ARC_STEPS.map((_, index) => [index, index < 2]))
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const visibleObserver = new IntersectionObserver(
      (entries) => {
        setVisibleCards((current) => {
          let changed = false;
          const next = { ...current };

          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            const isVisible = entry.isIntersecting;

            if (next[index] !== isVisible) {
              next[index] = isVisible;
              changed = true;
            }
          }

          return changed ? next : current;
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    for (const element of cardRefs.current) {
      if (!element) continue;
      visibleObserver.observe(element);
    }

    return () => {
      visibleObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const updateActiveCard = () => {
      frame = 0;

      const positionedCards = cardRefs.current
        .map((element, index) => ({
          index,
          top: element?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        }))
        .filter((card) => Number.isFinite(card.top));

      if (positionedCards.length === 0) return;

      const passedCards = positionedCards.filter((card) => card.top <= ACTIVE_TRIGGER_PX);
      const nextActiveIndex =
        passedCards.length > 0
          ? passedCards[passedCards.length - 1]!.index
          : positionedCards.reduce((closest, card) =>
              card.top < closest.top ? card : closest
            ).index;

      setActiveIndex((current) => (current === nextActiveIndex ? current : nextActiveIndex));
    };

    const requestUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateActiveCard);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute left-5 top-4 hidden w-px bg-gradient-to-b from-brand-cyan/45 via-brand-green/35 via-brand-amber/28 to-brand-rose/18 md:block"
        style={{ bottom: "1rem" }}
        aria-hidden
      />

      <div className="space-y-4">
        {INTERVIEW_ARC_STEPS.map((step, index) => {
          const style = TIMELINE_STYLES[step.tone];
          const isVisible = visibleCards[index] ?? false;
          const isActive = index === activeIndex;
          const hasPassed = index < activeIndex;

          return (
            <div key={step.label} className="relative pl-0 md:pl-14">
              <div
                className={cn(
                  "absolute left-0 top-4 hidden h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-500 ease-out md:flex",
                  style.border,
                  style.surface,
                  style.badgeText,
                  isActive && cn("scale-[1.18]", style.activeMarker),
                  hasPassed && "opacity-65"
                )}
              >
                <span className="text-sm font-semibold">{index + 1}</span>
              </div>

              <div
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                data-index={index}
                className={cn(
                  "landing-panel origin-top p-5 transition-[opacity,transform,filter,border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                  style.border,
                  isActive ? cn(style.glow, style.activeCard) : "shadow-none",
                  isVisible
                    ? "translate-y-0 scale-100 opacity-100 blur-0"
                    : hasPassed
                      ? "-translate-y-6 scale-[0.985] opacity-35 blur-[1px]"
                      : "translate-y-6 scale-[0.985] opacity-35 blur-[1px]",
                  !isActive && isVisible && "opacity-80",
                  isActive && "scale-[1.015]"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-500",
                        isActive ? style.badgeText : "text-brand-muted"
                      )}
                    >
                      {step.window}
                    </p>
                    <h3
                      className="mt-2 text-lg font-semibold text-brand-text transition-colors duration-500"
                    >
                      {step.title}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-500",
                      style.border,
                      style.surface,
                      style.badgeText,
                      isActive && style.activeBadge
                    )}
                  >
                    {step.signal}
                  </span>
                </div>

                <p
                  className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted/90 transition-colors duration-500"
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "mt-3 text-sm leading-relaxed transition-colors duration-500",
                    isActive ? "text-brand-text/90" : "text-brand-muted"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
