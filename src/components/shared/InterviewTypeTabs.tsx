"use client";

import { useState } from "react";
import { Braces, Network, MonitorSmartphone, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BODY, CELL, GRID } from "@/components/marketing/ds";
import {
  SETUP_CELL_FOCUS,
  SETUP_CELL_SELECTED,
} from "@/components/interviews/setup/SetupRack";

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

const TAB_BASE = cn(
  CELL,
  "group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-150",
  SETUP_CELL_FOCUS
);

export function InterviewTypeTabs({ children }: InterviewTypTabsProps) {
  const [activeTab, setActiveTab] = useState<InterviewType>("dsa");

  const comingSoonTab = COMING_SOON_TABS.find((t) => t.id === activeTab);

  return (
    <>
      {/* Tab bar: hairline grid, cyan inset hairline on the active cell */}
      <div className={cn(GRID, "w-full grid-cols-1 sm:grid-cols-3")}>
        <button
          onClick={() => setActiveTab("dsa")}
          className={cn(
            TAB_BASE,
            activeTab === "dsa" ? SETUP_CELL_SELECTED : "hover:bg-white/[0.03]"
          )}
        >
          <Braces
            className={cn(
              "h-4 w-4 shrink-0",
              activeTab === "dsa" ? "text-brand-cyan" : "text-brand-subtle group-hover:text-brand-text"
            )}
          />
          <span
            className={cn(
              "min-w-0 flex-1 text-[15px] font-medium tracking-[-0.01em]",
              activeTab === "dsa" ? "text-brand-text" : "text-brand-muted"
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
              TAB_BASE,
              activeTab === tab.id ? SETUP_CELL_SELECTED : "hover:bg-white/[0.03]"
            )}
          >
            <tab.icon
              className={cn(
                "h-4 w-4 shrink-0",
                activeTab === tab.id ? "text-brand-cyan" : "text-brand-subtle group-hover:text-brand-text"
              )}
            />
            <span
              className={cn(
                "min-w-0 flex-1 text-[15px] font-medium tracking-[-0.01em]",
                activeTab === tab.id ? "text-brand-text" : "text-brand-muted"
              )}
            >
              {tab.label}
            </span>
            <span className="shrink-0 rounded-full border border-brand-amber/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-amber">
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
          <comingSoonTab.icon className="mb-5 h-6 w-6 text-brand-subtle" />
          <h3 className="mb-3 text-2xl font-normal tracking-[-0.03em] text-brand-text">
            {comingSoonTab.label} · Coming soon
          </h3>
          <p className={cn(BODY, "mb-5 max-w-sm")}>
            {comingSoonTab.description}
          </p>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.1] px-4 py-2">
            <Lock className="h-3.5 w-3.5 text-brand-amber" />
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted">Expected in the next update</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
