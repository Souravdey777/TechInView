import { MonoLabel } from "@/components/shared/Rack";
import { CELL, GRID } from "@/components/marketing/ds";
import {
  AvailabilityTag,
  PriorityTag,
  TrackStatusDot,
  isRoundLive,
} from "@/components/prep-plans/PrepPlanMeta";
import { getPracticeKindLabel, type PrepPlanTrack } from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";

type PrepPlanRoundGridProps = {
  tracks: readonly PrepPlanTrack[];
  /** Namespaces the cell keys when several loops render on one page. */
  planId: string;
  /** Show only the first n rounds and summarise the rest. */
  limit?: number;
  columnsClassName?: string;
  className?: string;
  /** The per-round progress dot is noise inside a dense card. */
  showStatus?: boolean;
};

/**
 * The per-round breakdown of a loop as a hairline grid: one cell per round,
 * borders drawn once so the rounds read as one panel. Used by the
 * generated-plan turn in the Prep Guru thread and by the dashboard loop card.
 */
export function PrepPlanRoundGrid({
  tracks,
  planId,
  limit,
  columnsClassName = "sm:grid-cols-2",
  className,
  showStatus = false,
}: PrepPlanRoundGridProps) {
  const visibleTracks =
    typeof limit === "number" ? tracks.slice(0, limit) : [...tracks];
  const hiddenCount = tracks.length - visibleTracks.length;

  if (visibleTracks.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-brand-muted">
        This loop has no rounds attached.
      </p>
    );
  }

  return (
    <div
      className={cn(
        GRID,
        "grid-cols-1",
        columnsClassName,
        className
      )}
    >
      {visibleTracks.map((track, index) => {
        const isLive = isRoundLive(track.kind);

        return (
          <div
            key={`${planId}-${track.kind}`}
            className={cn(CELL, "flex flex-col gap-2.5 px-5 py-4")}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <MonoLabel>Round {index + 1}</MonoLabel>
              <div className="flex flex-wrap items-center gap-1.5">
                <PriorityTag priority={track.priority} />
                <AvailabilityTag kind={track.kind} />
              </div>
            </div>

            <div>
              <p
                className={cn(
                  "text-[15px] font-medium tracking-[-0.01em]",
                  isLive ? "text-brand-text" : "text-brand-muted"
                )}
              >
                {track.title ?? getPracticeKindLabel(track.kind)}
              </p>
              <MonoLabel className="mt-1 block">
                {getPracticeKindLabel(track.kind)}
              </MonoLabel>
            </div>

            {track.rationale ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-brand-muted">
                {track.rationale}
              </p>
            ) : null}

            {showStatus ? (
              <div className="mt-auto pt-1.5">
                <TrackStatusDot status={track.status} />
              </div>
            ) : null}
          </div>
        );
      })}

      {hiddenCount > 0 ? (
        <div className={cn(CELL, "flex items-center px-5 py-4")}>
          <MonoLabel>
            +{hiddenCount} more round{hiddenCount === 1 ? "" : "s"}
          </MonoLabel>
        </div>
      ) : null}
    </div>
  );
}
