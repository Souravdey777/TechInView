"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { MonoLabel, Rack } from "@/components/shared/Rack";
import { DESIGN_SYSTEM_CHART_COLORS } from "@/lib/design-system";

/** Chart gridlines and axes are drawn as white/[0.08] hairlines. */
const HAIRLINE = "rgba(255,255,255,0.08)";

type RadarDataPoint = {
  dimension: string;
  score: number;
  maxScore: number;
};

type ScoreRadarProps = {
  scores: RadarDataPoint[];
};

type TooltipPayloadEntry = {
  value: unknown;
  name: string;
  payload: RadarDataPoint;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const raw = entry?.payload;

  return (
    <div className="rounded-xl border border-white/[0.12] bg-brand-deep px-3 py-2">
      <p className="text-xs text-brand-text">{raw?.dimension}</p>
      <p className="mt-0.5 font-mono text-xs tabular-nums text-brand-cyan">
        {raw?.score} / {raw?.maxScore}
      </p>
    </div>
  );
}

export function ScoreRadar({ scores }: ScoreRadarProps) {
  const data = scores.map((s) => ({
    ...s,
    fullMark: s.maxScore,
  }));

  return (
    <Rack label={<MonoLabel>Performance breakdown</MonoLabel>} className="w-full" bodyClassName="p-4 sm:p-6">
      <div className="h-[320px] w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 640, height: 320 }}
        >
          <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
            <PolarGrid
              stroke={HAIRLINE}
              strokeWidth={1}
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{
                fill: DESIGN_SYSTEM_CHART_COLORS.label,
                fontSize: 11,
                fontFamily: "var(--font-mono), ui-monospace, monospace",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{
                fill: DESIGN_SYSTEM_CHART_COLORS.tick,
                fontSize: 10,
                fontFamily: "var(--font-mono), ui-monospace, monospace",
              }}
              tickCount={5}
              stroke={HAIRLINE}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke={DESIGN_SYSTEM_CHART_COLORS.score}
              fill={DESIGN_SYSTEM_CHART_COLORS.score}
              fillOpacity={0.12}
              strokeWidth={1.5}
              dot={{
                r: 3,
                fill: DESIGN_SYSTEM_CHART_COLORS.score,
                strokeWidth: 0,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Rack>
  );
}
