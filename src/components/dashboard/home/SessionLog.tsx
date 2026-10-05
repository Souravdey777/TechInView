"use client";

import Link from "next/link";
import { useState } from "react";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import {
  SESSION_LOG_FILTER_LABELS,
  buildSessionLogFilters,
  type SessionLogFilter,
  type SessionLogRow,
} from "@/lib/dashboard/session-log";
import { cn, getScoreColor } from "@/lib/utils";
import { CHIP, CHIP_ACTIVE } from "@/components/marketing/ds";

const ROW_GRID =
  "lg:grid lg:grid-cols-[2.5rem_minmax(0,1fr)_9rem_4.5rem_4.5rem_5.5rem] lg:items-center lg:gap-4";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function FilterChips({
  filters,
  value,
  onChange,
}: {
  filters: readonly SessionLogFilter[];
  value: SessionLogFilter;
  onChange: (next: SessionLogFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter sessions"
      className="flex flex-wrap items-center gap-1.5"
    >
      {filters.map((filter) => {
        const isActive = filter === value;

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(filter)}
            className={cn(CHIP, "px-2.5 py-0.5 text-[10px]", isActive && CHIP_ACTIVE)}
          >
            {SESSION_LOG_FILTER_LABELS[filter]}
          </button>
        );
      })}
    </div>
  );
}

/** Chronological log of every round and saved practice attempt. */
export function SessionLog({ rows }: { rows: readonly SessionLogRow[] }) {
  const filters = buildSessionLogFilters(rows);
  const [filter, setFilter] = useState<SessionLogFilter>("all");

  const visibleRows = rows.filter(
    (row) => filter === "all" || row.key === filter
  );

  return (
    <Rack
      label={<MonoLabel>Session log</MonoLabel>}
      accessory={
        filters.length > 0 ? (
          <FilterChips filters={filters} value={filter} onChange={setFilter} />
        ) : null
      }
      bodyClassName="p-0"
    >
      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <MonoLabel>Nothing logged yet</MonoLabel>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brand-muted">
            Every round and saved practice attempt lands here with its
            interviewer, duration, score, and verdict.
          </p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "hidden border-b border-white/[0.08] px-5 py-3 sm:px-6",
              ROW_GRID,
              "lg:grid"
            )}
          >
            <MonoLabel className="text-[10px]">Take</MonoLabel>
            <MonoLabel className="text-[10px]">Session</MonoLabel>
            <MonoLabel className="text-[10px]">Interviewer</MonoLabel>
            <MonoLabel className="text-[10px]">Duration</MonoLabel>
            <MonoLabel className="text-[10px]">Score</MonoLabel>
            <MonoLabel className="text-[10px] lg:text-right">Verdict</MonoLabel>
          </div>

          <div className="divide-y divide-white/[0.08]">
            {visibleRows.map((row) => (
              <Link
                key={`${row.key}-${row.id}`}
                href={row.href}
                className={cn(
                  "block px-5 py-4 transition-colors hover:bg-white/[0.02] sm:px-6",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan",
                  ROW_GRID
                )}
              >
                <div className="flex items-start justify-between gap-4 lg:contents">
                  <span className="hidden font-mono text-xs text-brand-subtle lg:block">
                    {row.take === null
                      ? "–"
                      : String(row.take).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <p className="truncate text-[15px] font-medium tracking-[-0.01em] text-brand-text">
                        {row.title}
                      </p>
                      <MonoLabel className="text-[10px]">
                        {row.typeLabel}
                      </MonoLabel>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-brand-muted lg:hidden">
                      <span>{row.interviewerLabel}</span>
                      {row.durationLabel ? (
                        <span className="font-mono">{row.durationLabel}</span>
                      ) : null}
                      {row.score !== null ? (
                        <span className={cn("font-mono tabular-nums", getScoreColor(row.score))}>
                          {row.score}
                        </span>
                      ) : null}
                      {row.resultLabel ? (
                        <span className="font-mono text-brand-subtle">
                          {row.resultLabel}
                        </span>
                      ) : null}
                      <span className="font-mono text-brand-subtle">
                        {formatShortDate(row.timestamp)}
                      </span>
                    </p>
                  </div>

                  <span className="hidden truncate text-xs text-brand-muted lg:block">
                    {row.interviewerLabel}
                  </span>
                  <span className="hidden font-mono text-xs text-brand-muted lg:block">
                    {row.durationLabel ?? "–"}
                  </span>
                  <span className="hidden lg:block">
                    {row.score !== null ? (
                      <span
                        className={cn(
                          "text-xl font-normal tabular-nums tracking-[-0.03em]",
                          getScoreColor(row.score)
                        )}
                      >
                        {row.score}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap font-mono text-[11px] text-brand-subtle">
                        {row.resultLabel ?? "–"}
                      </span>
                    )}
                  </span>

                  <span
                    className={cn(
                      "shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] lg:text-right",
                      row.verdictClassName
                    )}
                  >
                    {row.verdictLabel}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {visibleRows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-brand-muted">
              No {SESSION_LOG_FILTER_LABELS[filter]} sessions logged yet.
            </p>
          ) : null}
        </>
      )}
    </Rack>
  );
}
