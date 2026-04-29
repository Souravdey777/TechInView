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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DESIGN_SYSTEM_CHART_COLORS } from "@/lib/design-system";

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
    <div className="rounded-lg border border-brand-border bg-brand-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-brand-text">{raw?.dimension}</p>
      <p className="text-xs text-brand-cyan mt-0.5">
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Performance Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pb-6">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
              <PolarGrid
                stroke={DESIGN_SYSTEM_CHART_COLORS.grid}
                strokeWidth={1}
              />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{
                  fill: DESIGN_SYSTEM_CHART_COLORS.label,
                  fontSize: 12,
                  fontFamily: "Sora, system-ui, sans-serif",
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: DESIGN_SYSTEM_CHART_COLORS.tick,
                  fontSize: 10,
                }}
                tickCount={5}
                stroke={DESIGN_SYSTEM_CHART_COLORS.axis}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke={DESIGN_SYSTEM_CHART_COLORS.score}
                fill={DESIGN_SYSTEM_CHART_COLORS.score}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: DESIGN_SYSTEM_CHART_COLORS.score,
                  strokeWidth: 0,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
