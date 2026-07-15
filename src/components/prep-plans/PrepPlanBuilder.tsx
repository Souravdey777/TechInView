"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Bot,
  Building2,
  FileSearch,
  FileText,
  Layers3,
  LibraryBig,
  MessagesSquare,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePrepPlans } from "@/hooks/usePrepPlans";
import type { PrepPlanSummary } from "@/lib/dashboard/models";

const EXAMPLE_PROMPTS = [
  "Senior Software Engineer at Google",
  "Frontend Engineer at Meta",
  "Staff Engineer at Amazon",
] as const;

const RESEARCH_ACTIVITIES = [
  {
    label: "Reading your target context",
    detail: "Identifying the company, role, seniority, and strongest JD signals.",
    icon: FileSearch,
  },
  {
    label: "Mapping the likely interview loop",
    detail: "Shaping the rounds around the role instead of using a generic checklist.",
    icon: Layers3,
  },
  {
    label: "Preparing round-specific questions",
    detail: "Generating realistic possibilities and keeping AI inferences clearly labeled.",
    icon: MessagesSquare,
  },
  {
    label: "Checking reviewed reports",
    detail: "Matching relevant community-reported patterns from the reviewed corpus.",
    icon: LibraryBig,
  },
] as const;

type GenerateResponse = {
  success: boolean;
  data?: PrepPlanSummary;
  error?: string;
};

type ResearchingStateProps = {
  activeIndex: number;
  target: string;
};

function ResearchingState({ activeIndex, target }: ResearchingStateProps) {
  const activity = RESEARCH_ACTIVITIES[activeIndex] ?? RESEARCH_ACTIVITIES[0];
  const ActivityIcon = activity.icon;

  return (
    <div className="flex w-full flex-col items-center py-8 text-center" aria-live="polite" aria-atomic="true">
      <div className="relative flex h-28 w-28 items-center justify-center motion-reduce:animate-none">
        <div className="absolute inset-0 rounded-full border border-brand-cyan/10 bg-brand-cyan/[0.03] animate-pulse-ring motion-reduce:animate-none" />
        <div className="absolute inset-3 rounded-full border border-dashed border-brand-cyan/30 animate-spin motion-reduce:animate-none [animation-duration:10s]" />
        <div className="absolute inset-6 rounded-full border border-brand-cyan/20 shadow-[0_0_45px_rgba(34,211,238,0.16)]" />
        <div className="relative flex h-14 w-14 animate-soft-float items-center justify-center rounded-2xl border border-brand-cyan/35 bg-brand-card text-brand-cyan shadow-lg shadow-brand-cyan/10 motion-reduce:animate-none">
          <Bot className="h-7 w-7" />
        </div>
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">Prep Guru is researching</p>
      <h1 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
        Building your plan for {target}
      </h1>

      <div className="relative mt-7 w-full max-w-xl overflow-hidden rounded-2xl border border-brand-cyan/20 bg-brand-card p-5 text-left shadow-xl shadow-black/20">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.9),transparent)] bg-[length:200%_100%] animate-research-scan motion-reduce:animate-none" />
        <div key={activity.label} className="flex animate-fade-in items-start gap-4 motion-reduce:animate-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan">
            <ActivityIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text">{activity.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-muted">{activity.detail}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2" aria-hidden="true">
          {RESEARCH_ACTIVITIES.map((item, index) => (
            <div
              key={item.label}
              className={`h-1 rounded-full transition-colors duration-500 ${
                index === activeIndex ? "bg-brand-cyan shadow-[0_0_12px_rgba(34,211,238,0.55)]" : "bg-brand-border"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs text-brand-muted" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-cyan motion-reduce:animate-none [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-cyan motion-reduce:animate-none [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-cyan motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function PrepPlanBuilder() {
  const router = useRouter();
  const { savePlan } = usePrepPlans();
  const [prompt, setPrompt] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [showTargetFields, setShowTargetFields] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchActivityIndex, setResearchActivityIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;

    const intervalId = window.setInterval(() => {
      setResearchActivityIndex((current) => (current + 1) % RESEARCH_ACTIVITIES.length);
    }, 1800);

    return () => window.clearInterval(intervalId);
  }, [isGenerating]);

  const canSubmit = prompt.trim().length >= 10 || (company.trim().length >= 2 && role.trim().length >= 2);
  const researchTarget =
    company.trim() && role.trim()
      ? `${role.trim()} at ${company.trim()}`
      : prompt.trim().split("\n")[0]?.slice(0, 72) || "your target role";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isGenerating) return;

    setIsGenerating(true);
    setResearchActivityIndex(0);
    setError(null);

    try {
      const response = await fetch("/api/prep-guru/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          company: company.trim(),
          role: role.trim(),
          jdText: prompt.trim().length >= 40 ? prompt.trim() : "",
        }),
      });
      const result = (await response.json()) as GenerateResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Prep Guru could not create this plan.");
      }

      savePlan(result.data);
      router.push(`/prep-guru/${result.data.id}`);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Prep Guru could not create this plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-11rem)] max-w-4xl flex-col">
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        {isGenerating ? (
          <ResearchingState activeIndex={researchActivityIndex} target={researchTarget} />
        ) : (
          <>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan shadow-lg shadow-brand-cyan/5">
          <Bot className="h-6 w-6" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-brand-cyan">Prep Guru</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          What interview are you preparing for?
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted sm:text-base">
          Paste a job description, or tell me the role and company. I&apos;ll map the likely interview process,
          prepare questions for every round, and surface reviewed questions reported by past candidates.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setPrompt(example);
              }}
              className="rounded-full border border-brand-border bg-brand-card px-4 py-2 text-xs text-brand-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-text"
            >
              {example}
            </button>
          ))}
        </div>
          </>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`sticky bottom-4 rounded-3xl border bg-brand-card/95 p-3 shadow-2xl shadow-black/25 backdrop-blur transition-colors duration-500 ${
          isGenerating ? "border-brand-cyan/35 shadow-brand-cyan/5" : "border-brand-border"
        }`}
      >
        {showTargetFields ? (
          <div className="grid gap-2 border-b border-brand-border px-1 pb-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                <Building2 className="h-3.5 w-3.5" /> Company
              </span>
              <Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Uber" disabled={isGenerating} />
            </label>
            <label className="space-y-1.5 text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                <UserRound className="h-3.5 w-3.5" /> Role
              </span>
              <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Senior Backend Engineer" disabled={isGenerating} />
            </label>
          </div>
        ) : null}

        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Paste the JD, or type something like ‘Senior backend engineer at Uber’..."
          aria-label="Job description or target role and company"
          className="min-h-28 resize-y border-0 bg-transparent px-3 py-3 focus:ring-0 focus:ring-offset-0"
          maxLength={12000}
          disabled={isGenerating}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
          <Button type="button" variant="ghost" size="sm" disabled={isGenerating} onClick={() => setShowTargetFields((current) => !current)}>
            <FileText className="h-3.5 w-3.5" />
            {showTargetFields ? "Hide company & role" : "Add company & role separately"}
          </Button>
          <Button type="submit" disabled={!canSubmit || isGenerating} className="rounded-full disabled:opacity-100">
            {isGenerating ? (
              <><Bot className="h-4 w-4 animate-pulse motion-reduce:animate-none" /> Researching...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Build my prep plan <ArrowUp className="h-4 w-4" /></>
            )}
          </Button>
        </div>

        {error ? <p role="alert" className="px-3 pb-2 pt-2 text-left text-sm text-brand-rose">{error}</p> : null}
      </form>
      <p className="py-3 text-center text-[11px] text-brand-muted">
        Company rounds and possible questions are AI inferences. Community-reported patterns are separately labeled with provenance.
      </p>
    </div>
  );
}
