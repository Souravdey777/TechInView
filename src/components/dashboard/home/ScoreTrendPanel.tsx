"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { HIRE_LINE, type TrendPoint } from "@/lib/dashboard/home-metrics";
import { cn } from "@/lib/utils";

const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 200;
const PLOT_LEFT = 34;
const PLOT_RIGHT = 710;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 162;
const GRID_SCORES = [100, 85, 55, 25] as const;

const CARD_WIDTH = 214;
const CARD_HEIGHT = 86;
const CARD_GAP = 14;
const CARD_PAD = 13;
/** The card is fixed width, so the title has to be clipped by hand. */
const TITLE_MAX_CHARS = 26;

function scoreToY(score: number) {
  const clamped = Math.max(0, Math.min(100, score));
  return PLOT_TOP + (1 - clamped / 100) * (PLOT_BOTTOM - PLOT_TOP);
}

function takeToX(index: number, total: number) {
  if (total <= 1) return (PLOT_LEFT + PLOT_RIGHT) / 2;
  return PLOT_LEFT + (index / (total - 1)) * (PLOT_RIGHT - PLOT_LEFT);
}

/**
 * The SVG twin of getScoreColor. It lives here rather than in lib/utils because
 * Tailwind only scans src/app, src/components, and src/content for classes.
 */
function scoreFill(score: number) {
  if (score >= 85) return "fill-brand-green";
  if (score >= HIRE_LINE) return "fill-brand-cyan";
  if (score >= 55) return "fill-brand-amber";
  return "fill-brand-rose";
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function clipTitle(value: string) {
  return value.length > TITLE_MAX_CHARS
    ? `${value.slice(0, TITLE_MAX_CHARS - 1).trimEnd()}…`
    : value;
}

/** Above the point when there is room, below it otherwise, never out of frame. */
function cardOrigin(x: number, y: number) {
  const above = y - CARD_GAP - CARD_HEIGHT;
  return {
    x: Math.min(Math.max(x - CARD_WIDTH / 2, 0), VIEW_WIDTH - CARD_WIDTH),
    y: Math.min(
      Math.max(above >= 0 ? above : y + CARD_GAP, 0),
      VIEW_HEIGHT - CARD_HEIGHT
    ),
  };
}

function pointLabel(point: TrendPoint) {
  return [
    `Take ${point.take}`,
    point.title,
    point.typeLabel,
    formatShortDate(point.timestamp),
    `score ${point.score}`,
    point.verdictLabel,
    "view results",
  ]
    .filter(Boolean)
    .join(", ");
}

function LegendKey({ tone, label }: { tone: "line" | "hire"; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={
          tone === "line"
            ? "h-0.5 w-2.5 rounded-full bg-brand-cyan"
            : "h-0.5 w-2.5 rounded-full bg-brand-subtle"
        }
      />
      <MonoLabel className="tracking-[0.1em]">{label}</MonoLabel>
    </span>
  );
}

/** The hovered or focused take, drawn on top of everything else. */
function TrendCard({ point, x, y }: { point: TrendPoint; x: number; y: number }) {
  const origin = cardOrigin(x, y);
  const fill = scoreFill(point.score);

  return (
    <g pointerEvents="none">
      <rect
        x={origin.x}
        y={origin.y}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        rx={10}
        strokeWidth="1"
        className="fill-brand-deep stroke-brand-border"
      />
      <text
        x={origin.x + CARD_PAD}
        y={origin.y + 20}
        className="fill-brand-subtle font-mono text-[9px] uppercase tracking-[0.12em]"
      >
        {`Take ${point.take} · ${formatShortDate(point.timestamp)}`}
      </text>
      <text
        x={origin.x + CARD_PAD}
        y={origin.y + 40}
        className="fill-brand-text text-[12px] font-semibold"
      >
        {clipTitle(point.title)}
      </text>
      <text
        x={origin.x + CARD_PAD}
        y={origin.y + 56}
        className="fill-brand-muted font-mono text-[9px] uppercase tracking-[0.1em]"
      >
        {point.typeLabel}
      </text>
      <text
        x={origin.x + CARD_PAD}
        y={origin.y + 75}
        className={cn("font-mono text-[13px] font-bold", fill)}
      >
        {point.score}
        <tspan className="fill-brand-subtle text-[9px] font-normal">
          {" / 100"}
        </tspan>
      </text>
      {point.verdictLabel ? (
        <text
          x={origin.x + CARD_WIDTH - CARD_PAD}
          y={origin.y + 75}
          textAnchor="end"
          className={cn(
            "font-mono text-[9px] font-medium uppercase tracking-[0.1em]",
            fill
          )}
        >
          {point.verdictLabel}
        </text>
      ) : null}
    </g>
  );
}

/** Weighted-score trend with the hire line drawn in, matching the design canvas. */
export function ScoreTrendPanel({ trend }: { trend: readonly TrendPoint[] }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasTrend = trend.length >= 2;
  const active = activeIndex === null ? null : trend[activeIndex] ?? null;
  const points = trend
    .map((point, index) => `${takeToX(index, trend.length)},${scoreToY(point.score)}`)
    .join(" ");

  const labelIndexes = hasTrend
    ? Array.from(
        new Set([0, Math.floor((trend.length - 1) / 2), trend.length - 1])
      )
    : [];

  /** The plot spans exactly the first to the last point, so x maps to a take. */
  function nearestIndex(event: { clientX: number; currentTarget: SVGRectElement }) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return 0;
    const ratio = (event.clientX - bounds.left) / bounds.width;
    const index = Math.round(ratio * (trend.length - 1));
    return Math.max(0, Math.min(trend.length - 1, index));
  }

  return (
    <Rack
      label={<MonoLabel className="tracking-[0.18em]">Score trend</MonoLabel>}
      accessory={
        hasTrend ? (
          <span className="flex items-center gap-3.5">
            <LegendKey tone="line" label="Weighted" />
            <LegendKey tone="hire" label={`Hire line, ${HIRE_LINE}`} />
          </span>
        ) : null
      }
    >
      {hasTrend ? (
        <>
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            // Height follows the viewBox so a narrow column does not letterbox
            // the plot inside a fixed-height box.
            className="h-auto w-full"
            role="group"
            aria-label={`Weighted score across your last ${trend.length} scored rounds`}
          >
            {GRID_SCORES.map((score) => (
              <g key={score}>
                <line
                  x1={PLOT_LEFT}
                  y1={scoreToY(score)}
                  x2={PLOT_RIGHT}
                  y2={scoreToY(score)}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-brand-border"
                />
                <text
                  x={0}
                  y={scoreToY(score) + 4}
                  className="fill-brand-subtle font-mono text-[9px]"
                >
                  {score}
                </text>
              </g>
            ))}

            <line
              x1={PLOT_LEFT}
              y1={scoreToY(HIRE_LINE)}
              x2={PLOT_RIGHT}
              y2={scoreToY(HIRE_LINE)}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 4"
              className="text-brand-subtle"
            />

            {active && activeIndex !== null ? (
              <line
                x1={takeToX(activeIndex, trend.length)}
                y1={PLOT_TOP}
                x2={takeToX(activeIndex, trend.length)}
                y2={PLOT_BOTTOM}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 4"
                className="text-brand-cyan/40"
              />
            ) : null}

            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-cyan"
            />

            <g onMouseLeave={() => setActiveIndex(null)}>
              {/* Hovering anywhere over the plot snaps to the nearest take. */}
              <rect
                x={PLOT_LEFT}
                y={PLOT_TOP}
                width={PLOT_RIGHT - PLOT_LEFT}
                height={PLOT_BOTTOM - PLOT_TOP + 18}
                fill="transparent"
                className="cursor-pointer"
                onMouseMove={(event) => setActiveIndex(nearestIndex(event))}
                onClick={(event) => router.push(trend[nearestIndex(event)].href)}
              />

              {trend.map((point, index) => {
                const x = takeToX(index, trend.length);
                const y = scoreToY(point.score);
                const isActive = index === activeIndex;
                const isLatest = index === trend.length - 1;

                return (
                  <a
                    key={`${point.take}-${point.timestamp}`}
                    href={point.href}
                    role="link"
                    tabIndex={0}
                    aria-label={pointLabel(point)}
                    className="cursor-pointer outline-none"
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() =>
                      setActiveIndex((current) =>
                        current === index ? null : current
                      )
                    }
                    // Browsers do not synthesize a click on a focused SVG link.
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      router.push(point.href);
                    }}
                    onClick={(event) => {
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                      ) {
                        return;
                      }
                      event.preventDefault();
                      router.push(point.href);
                    }}
                  >
                    {isActive ? (
                      <circle
                        cx={x}
                        cy={y}
                        r={9}
                        strokeWidth="1"
                        className="fill-brand-cyan/20 stroke-brand-cyan/50"
                      />
                    ) : null}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 5.2 : isLatest ? 4.6 : 3.4}
                      strokeWidth="2"
                      className={
                        isActive || isLatest
                          ? "fill-brand-cyan stroke-brand-cyan"
                          : "fill-brand-card stroke-brand-cyan"
                      }
                    />
                  </a>
                );
              })}
            </g>

            {labelIndexes.map((index) => (
              <text
                key={index}
                x={takeToX(index, trend.length)}
                y={VIEW_HEIGHT - 10}
                textAnchor="middle"
                className="fill-brand-subtle font-mono text-[9px]"
              >
                T{trend[index].take}
              </text>
            ))}

            {active && activeIndex !== null ? (
              <TrendCard
                point={active}
                x={takeToX(activeIndex, trend.length)}
                y={scoreToY(active.score)}
              />
            ) : null}
          </svg>

          <p className="mt-1 text-center text-[11px] text-brand-subtle">
            Hover a take for its verdict, or open the round to read the scorecard.
          </p>
        </>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <MonoLabel>Not enough takes</MonoLabel>
          <p className="max-w-xs text-xs leading-relaxed text-brand-muted">
            Two scored rounds draw the first line. Until then the trend stays
            empty on purpose rather than guessing at a shape.
          </p>
        </div>
      )}
    </Rack>
  );
}
