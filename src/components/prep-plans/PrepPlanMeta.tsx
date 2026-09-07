import { cn } from "@/lib/utils";
import {
  getPracticeCard,
  type PracticeInterviewKind,
  type PrepPlanStatus,
  type PrepPlanTrack,
  type PrepPlanTrackStatus,
} from "@/lib/dashboard/models";

/**
 * Shared chrome for the Prep Guru surface: the tag, dot, and date treatments
 * that the loop cards and the loop detail both stamp on every round.
 */

const TAG_BASE =
  "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em]";

const TAG_TONES = {
  cyan: "border-brand-cyan/30 text-brand-cyan",
  green: "border-brand-green/30 text-brand-green",
  amber: "border-brand-amber/30 text-brand-amber",
  muted: "border-brand-border text-brand-subtle",
} as const;

export type TagTone = keyof typeof TAG_TONES;

export function Tag({
  tone = "muted",
  children,
  className,
}: {
  tone?: TagTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(TAG_BASE, TAG_TONES[tone], className)}>{children}</span>
  );
}

/**
 * A round is only launchable end to end when `models.ts` still marks its kind
 * live. Everything else is drawn as parked rather than promised.
 */
export function isRoundLive(kind: PracticeInterviewKind) {
  return getPracticeCard(kind)?.status === "live";
}

const AVAILABILITY_TAGS: Record<
  NonNullable<ReturnType<typeof getPracticeCard>>["status"],
  { label: string; tone: TagTone }
> = {
  live: { label: "Live", tone: "green" },
  beta: { label: "Beta", tone: "cyan" },
  planned: { label: "Planned", tone: "amber" },
  coming_soon: { label: "Soon", tone: "muted" },
};

/** Live / Soon, read straight off the round-type config. */
export function AvailabilityTag({ kind }: { kind: PracticeInterviewKind }) {
  const status = getPracticeCard(kind)?.status ?? "coming_soon";
  const tag = AVAILABILITY_TAGS[status];

  return <Tag tone={tag.tone}>{tag.label}</Tag>;
}

/** Core focus vs supporting round, as weighted by the generator. */
export function PriorityTag({ priority }: { priority: PrepPlanTrack["priority"] }) {
  return (
    <Tag tone={priority === "core" ? "cyan" : "muted"}>
      {priority === "core" ? "Core" : "Supporting"}
    </Tag>
  );
}

/** Active / Completed on the loop itself. */
export function PlanStatusTag({ status }: { status: PrepPlanStatus }) {
  return (
    <Tag tone={status === "completed" ? "green" : "cyan"}>
      {status === "completed" ? "Completed" : "Active"}
    </Tag>
  );
}

const TRACK_STATUS_DOTS: Record<
  PrepPlanTrackStatus,
  { label: string; dotClassName: string; textClassName: string }
> = {
  completed: {
    label: "Done",
    dotClassName: "bg-brand-green",
    textClassName: "text-brand-green",
  },
  in_progress: {
    label: "Started",
    dotClassName: "bg-brand-cyan",
    textClassName: "text-brand-cyan",
  },
  not_started: {
    label: "Not started",
    dotClassName: "bg-brand-border",
    textClassName: "text-brand-subtle",
  },
};

/** Dot + word, the System artboard's three-state indicator. */
export function TrackStatusDot({ status }: { status: PrepPlanTrackStatus }) {
  const tone = TRACK_STATUS_DOTS[status];

  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dotClassName)} />
      <span
        className={cn(
          "font-mono text-[9px] font-medium uppercase tracking-[0.16em]",
          tone.textClassName
        )}
      >
        {tone.label}
      </span>
    </span>
  );
}

export function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unknown";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "today", "3 days ago", then falls back to a date once it stops being news. */
export function formatRelativeDay(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unknown";

  const days = Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;

  return formatShortDate(value);
}

/**
 * Loops are per-device until `usePrepPlans` moves off localStorage. Say it
 * where it is user-visible instead of implying an account-wide history.
 */
export const LOCAL_ONLY_NOTE =
  "Saved loops live in this browser only. They are not synced to your account yet, so they will not follow you to another device.";

export const INFERENCE_NOTE =
  "Loops are inferred from the posting, not confirmed by the company. Treat one as a rehearsal plan, not a leak.";
