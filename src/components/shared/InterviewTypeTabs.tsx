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
      <div className="flex items-center gap-1 p-1 rounded-lg bg-brand-surface border border-brand-border w-fit">
        <button
          onClick={() => setActiveTab("dsa")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150",
            activeTab === "dsa"
              ? "bg-brand-card text-brand-cyan shadow-sm border border-brand-border"
              : "text-brand-muted hover:text-brand-text"
          )}
        >
          <Braces className="w-3.5 h-3.5" />
          DSA / Coding
        </button>
        {COMING_SOON_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-brand-card text-brand-amber shadow-sm border border-brand-border"
                : "text-brand-muted hover:text-brand-text"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-brand-amber/10 text-brand-amber border border-brand-amber/30">
              Soon
            </span>
          </button>
        ))}
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
