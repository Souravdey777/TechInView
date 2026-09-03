import { MonoLabel, Rack } from "@/components/shared/Rack";
import { HIRE_LINE, type TrendPoint } from "@/lib/dashboard/home-metrics";

const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 200;
const PLOT_LEFT = 34;
const PLOT_RIGHT = 710;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 162;
const GRID_SCORES = [100, 85, 55, 25] as const;

function scoreToY(score: number) {
  const clamped = Math.max(0, Math.min(100, score));
  return PLOT_TOP + (1 - clamped / 100) * (PLOT_BOTTOM - PLOT_TOP);
}

function takeToX(index: number, total: number) {
  if (total <= 1) return (PLOT_LEFT + PLOT_RIGHT) / 2;
  return PLOT_LEFT + (index / (total - 1)) * (PLOT_RIGHT - PLOT_LEFT);
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

/** Weighted-score trend with the hire line drawn in, matching the design canvas. */
export function ScoreTrendPanel({ trend }: { trend: readonly TrendPoint[] }) {
  const hasTrend = trend.length >= 2;
  const points = trend
    .map((point, index) => `${takeToX(index, trend.length)},${scoreToY(point.score)}`)
    .join(" ");

  const labelIndexes = hasTrend
    ? Array.from(
        new Set([0, Math.floor((trend.length - 1) / 2), trend.length - 1])
      )
    : [];

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
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="h-48 w-full"
          role="img"
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

          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-cyan"
          />

          {trend.map((point, index) => {
            const isLatest = index === trend.length - 1;
            return (
              <circle
                key={point.take}
                cx={takeToX(index, trend.length)}
                cy={scoreToY(point.score)}
                r={isLatest ? 4.6 : 3.4}
                strokeWidth="2"
                className={
                  isLatest
                    ? "fill-brand-cyan stroke-brand-cyan"
                    : "fill-brand-card stroke-brand-cyan"
                }
              >
                <title>{point.caption}</title>
              </circle>
            );
          })}

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
        </svg>
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
