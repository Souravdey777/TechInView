"use client";

import { useState } from "react";
import { Braces, Network, MonitorSmartphone, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type InterviewType = "dsa" | "system-design" | "machine-coding";

type InterviewTypTabsProps = {
  children: React.ReactNode;
};

const COMING_SOON_TABS: { id: InterviewType; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: "system-design",
    label: "System Design",
    icon: Network,
    description: "Design scalable systems with an AI interviewer, whiteboard diagrams, and real-time feedback. Just like a real FAANG system design round.",
  },
  {
    id: "machine-coding",
    label: "Machine Coding",
    icon: MonitorSmartphone,
    description: "Build real features in a multi-file IDE with time constraints. Test your ability to ship clean, working code under pressure.",
  },
];

export function InterviewTypeTabs({ children }: InterviewTypTabsProps) {
  const [activeTab, setActiveTab] = useState<InterviewType>("dsa");

  const comingSoonTab = COMING_SOON_TABS.find((t) => t.id === activeTab);

  return (
    <>
      {/* Tab bar */}
      <div className="w-full rounded-2xl border border-brand-border bg-brand-card p-2">
        <div className="grid gap-2 sm:grid-cols-3">
        <button
          onClick={() => setActiveTab("dsa")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
            activeTab === "dsa"
              ? "border-brand-cyan/35 bg-brand-cyan/10 text-brand-text shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]"
              : "border-transparent text-brand-muted hover:border-brand-border hover:bg-brand-surface hover:text-brand-text"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-brand-surface transition-colors",
              activeTab === "dsa"
                ? "border-brand-cyan/30 text-brand-cyan"
                : "border-brand-border text-brand-muted group-hover:text-brand-text"
            )}
          >
            <Braces className="h-4 w-4" />
          </div>
          <span
            className={cn(
              "min-w-0 flex-1 text-sm font-semibold",
              activeTab === "dsa" ? "text-brand-cyan" : "text-brand-text"
            )}
          >
            DSA / Coding
          </span>
        </button>
        {COMING_SOON_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
              activeTab === tab.id
                ? "border-brand-amber/35 bg-brand-amber/10 text-brand-text shadow-[inset_0_0_0_1px_rgba(251,191,36,0.12)]"
                : "border-transparent text-brand-muted hover:border-brand-border hover:bg-brand-surface hover:text-brand-text"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-brand-surface transition-colors",
                activeTab === tab.id
                  ? "border-brand-amber/30 text-brand-amber"
                  : "border-brand-border text-brand-muted group-hover:text-brand-text"
              )}
            >
              <tab.icon className="h-4 w-4" />
            </div>
            <span
              className={cn(
                "min-w-0 flex-1 text-sm font-semibold",
                activeTab === tab.id ? "text-brand-text" : "text-brand-text/90"
              )}
            >
              {tab.label}
            </span>
            <span className="shrink-0 rounded-full border border-brand-amber/30 bg-brand-amber/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-amber">
              Soon
            </span>
          </button>
        ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "dsa" ? (
        children
      ) : comingSoonTab ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-amber/10 border border-brand-amber/25 mb-5">
            <comingSoonTab.icon className="w-7 h-7 text-brand-amber" />
          </div>
          <h3 className="text-lg font-bold text-brand-text mb-2">
            {comingSoonTab.label} — Coming Soon
          </h3>
          <p className="text-sm text-brand-muted max-w-sm mb-4">
            {comingSoonTab.description}
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-card border border-brand-border">
            <Lock className="w-3.5 h-3.5 text-brand-amber" />
            <span className="text-xs text-brand-muted">Expected in the next update</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
