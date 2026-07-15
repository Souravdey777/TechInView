"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Bot, Building2, FileText, Loader2, Sparkles, UserRound } from "lucide-react";
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

type GenerateResponse = {
  success: boolean;
  data?: PrepPlanSummary;
  error?: string;
};

export function PrepPlanBuilder() {
  const router = useRouter();
  const { savePlan } = usePrepPlans();
  const [prompt, setPrompt] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [showTargetFields, setShowTargetFields] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = prompt.trim().length >= 10 || (company.trim().length >= 2 && role.trim().length >= 2);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isGenerating) return;

    setIsGenerating(true);
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
      </div>

      <form onSubmit={handleSubmit} className="sticky bottom-4 rounded-3xl border border-brand-border bg-brand-card/95 p-3 shadow-2xl shadow-black/25 backdrop-blur">
        {showTargetFields ? (
          <div className="grid gap-2 border-b border-brand-border px-1 pb-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                <Building2 className="h-3.5 w-3.5" /> Company
              </span>
              <Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Uber" />
            </label>
            <label className="space-y-1.5 text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                <UserRound className="h-3.5 w-3.5" /> Role
              </span>
              <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Senior Backend Engineer" />
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
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowTargetFields((current) => !current)}>
            <FileText className="h-3.5 w-3.5" />
            {showTargetFields ? "Hide company & role" : "Add company & role separately"}
          </Button>
          <Button type="submit" disabled={!canSubmit || isGenerating} className="rounded-full">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Researching the loop...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Build my prep plan <ArrowUp className="h-4 w-4" /></>
            )}
          </Button>
        </div>

        {error ? <p role="alert" className="px-3 pb-2 pt-2 text-left text-sm text-brand-rose">{error}</p> : null}
      </form>
      <p className="py-3 text-center text-[11px] text-brand-muted">
        AI-inferred questions are possibilities. Previously asked questions are separately labeled with source provenance.
      </p>
    </div>
  );
}
