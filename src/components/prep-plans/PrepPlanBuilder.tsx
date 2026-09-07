"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { ArrowUp, Building2, Loader2, SlidersHorizontal, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MonoLabel } from "@/components/shared/Rack";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Senior Software Engineer at Google",
  "Frontend Engineer at Meta",
  "Staff Engineer at Amazon",
] as const;

const MAX_PROMPT_LENGTH = 12000;

export type PrepPlanRequest = {
  prompt: string;
  company: string;
  role: string;
};

type PrepPlanBuilderProps = {
  onSubmit: (request: PrepPlanRequest) => void;
  isGenerating: boolean;
  error?: string | null;
  /** "hero" adds the starter chips for a brand-new conversation. */
  variant?: "hero" | "docked";
  /** Any change clears the composer — used after a plan lands, and on New plan. */
  resetToken?: number;
};

/**
 * The Prep Guru composer. Free text is the main path: paste a posting or name
 * the target. Company and role stay available as explicit fields because the
 * generator reads them separately from the JD body.
 */
export function PrepPlanBuilder({
  onSubmit,
  isGenerating,
  error = null,
  variant = "docked",
  resetToken = 0,
}: PrepPlanBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [showTargetFields, setShowTargetFields] = useState(false);

  useEffect(() => {
    if (resetToken === 0) return;

    setPrompt("");
    setCompany("");
    setRole("");
    setShowTargetFields(false);
  }, [resetToken]);

  const canSubmit =
    prompt.trim().length >= 10 ||
    (company.trim().length >= 2 && role.trim().length >= 2);

  const submit = () => {
    if (!canSubmit || isGenerating) return;

    onSubmit({
      prompt: prompt.trim(),
      company: company.trim(),
      role: role.trim(),
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    if (!event.metaKey && !event.ctrlKey) return;

    event.preventDefault();
    submit();
  };

  return (
    <div className="flex flex-col gap-3">
      {variant === "hero" ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MonoLabel className="text-[9px]">Try one</MonoLabel>
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              disabled={isGenerating}
              onClick={() => setPrompt(example)}
              className={cn(
                "rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs text-brand-muted",
                "transition-colors hover:border-brand-cyan/40 hover:text-brand-text",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
                "disabled:pointer-events-none disabled:opacity-40"
              )}
            >
              {example}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "rounded-2xl border bg-brand-card p-2.5 transition-colors",
          isGenerating ? "border-brand-cyan/40" : "border-brand-border"
        )}
      >
        {showTargetFields ? (
          <div className="grid gap-3 border-b border-brand-border px-1 pb-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                <Building2 className="h-3.5 w-3.5" /> Company
              </span>
              <Input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="e.g. Uber"
                disabled={isGenerating}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                <UserRound className="h-3.5 w-3.5" /> Role
              </span>
              <Input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                disabled={isGenerating}
              />
            </label>
          </div>
        ) : null}

        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste the job description, or type something like “Senior backend engineer at Uber”…"
          aria-label="Job description, or target role and company"
          className="min-h-24 resize-y border-0 bg-transparent px-2.5 py-2.5 focus:ring-0 focus:ring-offset-0"
          maxLength={MAX_PROMPT_LENGTH}
          disabled={isGenerating}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isGenerating}
              onClick={() => setShowTargetFields((current) => !current)}
              className="text-brand-muted"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showTargetFields ? "Hide company & role" : "Company & role"}
            </Button>
            {prompt.length > 0 ? (
              <MonoLabel className="text-[9px]">
                {prompt.length.toLocaleString()} chars
              </MonoLabel>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5">
            <MonoLabel className="hidden text-[9px] sm:inline">
              ⌘ + ↵ to send
            </MonoLabel>
            <Button type="submit" size="sm" disabled={!canSubmit || isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                  Researching
                </>
              ) : (
                <>
                  Build the loop
                  <ArrowUp className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="px-2.5 pb-1 pt-2.5 text-sm leading-relaxed text-brand-rose">
            {error}
          </p>
        ) : null}
      </form>

      <p className="px-1 text-[11px] leading-relaxed text-brand-subtle">
        {variant === "hero"
          ? "Rounds and possible questions are AI inferences from what you paste. Community-reported patterns are labelled separately with their provenance."
          : "Rounds and questions are AI inferences. Reported patterns are labelled separately."}
      </p>
    </div>
  );
}
