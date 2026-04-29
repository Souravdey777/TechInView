"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  DESIGN_SYSTEM_CHART_COLORS,
  getDesignSystemScoreColor,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

type DataPoint = {
  score: number;
  date: string;
  label: string;
};

type ScoreTrendChartProps = {
  data: DataPoint[];
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: DataPoint }[];
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const { value, payload: point } = payload[0];
  const color = getDesignSystemScoreColor(value);

  return (
    <div className="bg-brand-deep border border-brand-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-brand-muted mb-1">{point.label}</p>
      <p className="text-lg font-bold font-mono" style={{ color }}>
        {value}
        <span className="text-xs text-brand-muted font-normal ml-0.5">
          /100
        </span>
      </p>
    </div>
  );
}

function CustomDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: DataPoint;
}) {
  if (!cx || !cy || !payload) return null;
  const score = payload.score;
  const fill = getDesignSystemScoreColor(score);

  return (
    <g>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.15} />
      {/* Dot */}
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill={fill}
        stroke={DESIGN_SYSTEM_CHART_COLORS.background}
        strokeWidth={1.5}
      />
    </g>
  );
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const avgScore =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length)
      : 0;

  const latestScore = data.length > 0 ? data[data.length - 1].score : 0;
  const firstScore = data.length > 0 ? data[0].score : 0;
  const trend = latestScore - firstScore;

  return (
    <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden">
      {/* Stats row */}
      <div className="flex items-center gap-6 px-6 pt-5 pb-2">
        <div>
          <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-0.5">
            Latest
          </p>
          <p
            className={cn(
              "text-2xl font-bold font-mono",
              latestScore >= 70
                ? "text-brand-green"
                : latestScore >= 55
                ? "text-brand-amber"
                : "text-brand-rose"
            )}
          >
            {latestScore}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-0.5">
            Average
          </p>
          <p className="text-2xl font-bold font-mono text-brand-cyan">
            {avgScore}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-0.5">
            Trend
          </p>
          <p
            className={cn(
              "text-2xl font-bold font-mono",
              trend > 0
                ? "text-brand-green"
                : trend < 0
                ? "text-brand-rose"
                : "text-brand-muted"
            )}
          >
            {trend > 0 ? "+" : ""}
            {trend}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[11px] text-brand-muted">
            {data.length} interview{data.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DESIGN_SYSTEM_CHART_COLORS.score} stopOpacity={0.25} />
                <stop offset="100%" stopColor={DESIGN_SYSTEM_CHART_COLORS.score} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke={DESIGN_SYSTEM_CHART_COLORS.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: DESIGN_SYSTEM_CHART_COLORS.tick, fontSize: 10 }}
              axisLine={{ stroke: DESIGN_SYSTEM_CHART_COLORS.axis }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: DESIGN_SYSTEM_CHART_COLORS.tick, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dx={-4}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: DESIGN_SYSTEM_CHART_COLORS.grid, strokeWidth: 1 }}
            />
            {/* Hire threshold line */}
            <ReferenceLine
              y={70}
              stroke={DESIGN_SYSTEM_CHART_COLORS.success}
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              label={{
                value: "Hire",
                position: "right",
                fill: DESIGN_SYSTEM_CHART_COLORS.success,
                fontSize: 10,
                opacity: 0.5,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={DESIGN_SYSTEM_CHART_COLORS.score}
              strokeWidth={2.5}
              fill="url(#scoreGradient)"
              dot={<CustomDot />}
              activeDot={{
                r: 5,
                fill: DESIGN_SYSTEM_CHART_COLORS.score,
                stroke: DESIGN_SYSTEM_CHART_COLORS.background,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-6 pb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-green" />
          <span className="text-[10px] text-brand-muted">85+ Strong Hire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-cyan" />
          <span className="text-[10px] text-brand-muted">70+ Hire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-amber" />
          <span className="text-[10px] text-brand-muted">55+ Lean Hire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-rose" />
          <span className="text-[10px] text-brand-muted">&lt;55 No Hire</span>
        </div>
      </div>
    </div>
  );
}
