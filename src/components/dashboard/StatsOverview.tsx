import { cn } from "@/lib/utils";
import {
  Mic,
  Target,
  CheckCircle2,
  Flame,
} from "lucide-react";

type StatCard = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  suffix?: string;
};

type StatsOverviewProps = {
  totalInterviews: number;
  avgScore: number;
  problemsSolved: number;
  streak: number;
};

export function StatsOverview({
  totalInterviews,
  avgScore,
  problemsSolved,
  streak,
}: StatsOverviewProps) {
  const stats: StatCard[] = [
    {
      label: "Total Interviews",
      value: totalInterviews,
      icon: Mic,
      accentClass: "text-brand-cyan",
      bgClass: "bg-brand-cyan/10",
      borderClass: "border-brand-cyan/20",
    },
    {
      label: "Average Score",
      value: avgScore,
      icon: Target,
      accentClass: "text-brand-green",
      bgClass: "bg-brand-green/10",
      borderClass: "border-brand-green/20",
      suffix: "/100",
    },
    {
      label: "Problems Solved",
      value: problemsSolved,
      icon: CheckCircle2,
      accentClass: "text-brand-amber",
      bgClass: "bg-brand-amber/10",
      borderClass: "border-brand-amber/20",
    },
    {
      label: "Current Streak",
      value: streak,
      icon: Flame,
      accentClass: "text-brand-rose",
      bgClass: "bg-brand-rose/10",
      borderClass: "border-brand-rose/20",
      suffix: " days",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(
        ({
          label,
          value,
          icon: Icon,
          accentClass,
          bgClass,
          borderClass,
          suffix,
        }) => (
          <div
            key={label}
            className={cn(
              "bg-brand-card rounded-xl border p-5 flex items-start gap-4",
              borderClass
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                bgClass
              )}
            >
              <Icon className={cn("w-5 h-5", accentClass)} />
            </div>
            <div className="min-w-0">
              <p className="text-brand-muted text-xs font-medium mb-1 uppercase tracking-wide">
                {label}
              </p>
              <p className={cn("text-2xl font-bold font-heading", accentClass)}>
                {value === 0 && label === "Average Score" ? (
                  <span className="text-brand-muted text-xl">—</span>
                ) : (
                  <>
                    {value}
                    {suffix && (
                      <span className="text-sm font-normal text-brand-muted ml-0.5">
                        {suffix}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
