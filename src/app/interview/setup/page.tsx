"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  CheckCircle,
  XCircle,
  Shuffle,
  Clock,
  Code2,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type Category =
  | "any"
  | "arrays"
  | "strings"
  | "trees"
  | "graphs"
  | "dp"
  | "linked-lists"
  | "stacks-queues"
  | "binary-search"
  | "heap"
  | "backtracking";
type Language = "python" | "javascript" | "java" | "cpp";
type Duration = 30 | 45;
type MicStatus = "idle" | "checking" | "granted" | "denied";

type SetupFormState = {
  difficulty: Difficulty;
  category: Category;
  language: Language;
  duration: Duration;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTIES: { value: Difficulty; label: string; color: string; activeColor: string }[] = [
  {
    value: "easy",
    label: "Easy",
    color: "text-brand-green border-brand-border hover:border-brand-green/50",
    activeColor: "bg-brand-green/10 border-brand-green text-brand-green",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-brand-amber border-brand-border hover:border-brand-amber/50",
    activeColor: "bg-brand-amber/10 border-brand-amber text-brand-amber",
  },
  {
    value: "hard",
    label: "Hard",
    color: "text-brand-rose border-brand-border hover:border-brand-rose/50",
    activeColor: "bg-brand-rose/10 border-brand-rose text-brand-rose",
  },
];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "arrays", label: "Arrays" },
  { value: "strings", label: "Strings" },
  { value: "trees", label: "Trees" },
  { value: "graphs", label: "Graphs" },
  { value: "dp", label: "Dynamic Programming" },
  { value: "linked-lists", label: "Linked Lists" },
  { value: "stacks-queues", label: "Stacks & Queues" },
  { value: "binary-search", label: "Binary Search" },
  { value: "heap", label: "Heap / Priority Queue" },
  { value: "backtracking", label: "Backtracking" },
];

const LANGUAGES: { value: Language; label: string; ext: string }[] = [
  { value: "python", label: "Python", ext: ".py" },
  { value: "javascript", label: "JavaScript", ext: ".js" },
  { value: "java", label: "Java", ext: ".java" },
  { value: "cpp", label: "C++", ext: ".cpp" },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-brand-border bg-brand-card p-6",
        className
      )}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-muted">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewSetupPage() {
  const router = useRouter();

  const [form, setForm] = useState<SetupFormState>({
    difficulty: "medium",
    category: "any",
    language: "python",
    duration: 45,
  });
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ─── Mic check ──────────────────────────────────────────────────────────────

  async function handleMicCheck() {
    setMicStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleStartInterview() {
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: form.difficulty,
          category: form.category === "any" ? null : form.category,
          language: form.language,
          maxDurationSeconds: form.duration * 60,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to start interview");
      }

      const data = (await res.json()) as { data?: { interviewId?: string } };
      const interviewId = data.data?.interviewId;
      if (!interviewId) throw new Error("No interview ID returned");
      router.push(`/interview/${interviewId}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setIsCreating(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      {/* Header */}
      <div className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-brand-cyan" />
            <span className="font-semibold tracking-tight text-brand-text">
              TechInView
            </span>
          </div>
          <span className="text-sm text-brand-muted">AI Mock Interview</span>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">
            Set Up Your Interview
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Configure your session and Alex will guide you through the rest.
          </p>
        </div>

        {/* 1 – Problem Selection */}
        <SectionCard title="Problem Selection">
          <div className="flex items-center gap-3 rounded-lg border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-cyan bg-brand-cyan">
              <div className="h-2 w-2 rounded-full bg-brand-deep" />
            </div>
            <div className="flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-brand-cyan" />
              <span className="text-sm font-medium text-brand-text">
                Random Problem
              </span>
            </div>
            <span className="ml-auto text-xs text-brand-muted">
              Recommended
            </span>
          </div>
          <p className="mt-3 text-xs text-brand-muted">
            A problem will be selected based on your difficulty and category
            preferences below.
          </p>
        </SectionCard>

        {/* 2 – Difficulty */}
        <SectionCard title="Difficulty">
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setForm((f) => ({ ...f, difficulty: d.value }))}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150",
                  form.difficulty === d.value ? d.activeColor : d.color
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 3 – Category */}
        <SectionCard title="Topic Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setForm((f) => ({ ...f, category: c.value }))}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150",
                  form.category === c.value
                    ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                    : "border-brand-border text-brand-muted hover:border-brand-subtle hover:text-brand-text"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 4 – Language */}
        <SectionCard title="Coding Language">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setForm((f) => ({ ...f, language: lang.value }))}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-4 text-sm font-medium transition-all duration-150",
                  form.language === lang.value
                    ? "border-brand-cyan bg-brand-cyan/5 text-brand-cyan ring-1 ring-brand-cyan/30"
                    : "border-brand-border text-brand-muted hover:border-brand-subtle hover:text-brand-text"
                )}
              >
                <span className="font-mono text-xs text-brand-muted">
                  {lang.ext}
                </span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 5 – Duration */}
        <SectionCard title="Session Duration">
          <div className="flex gap-3">
            {([30, 45] as Duration[]).map((d) => (
              <button
                key={d}
                onClick={() => setForm((f) => ({ ...f, duration: d }))}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150",
                  form.duration === d
                    ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                    : "border-brand-border text-brand-muted hover:border-brand-subtle hover:text-brand-text"
                )}
              >
                <Clock className="h-4 w-4" />
                <span>{d} min</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-brand-muted">
            45 minutes mirrors a real FAANG interview loop. Choose 30 min for a
            focused practice round.
          </p>
        </SectionCard>

        {/* 6 – Mic Check */}
        <SectionCard title="Microphone Check">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-brand-text">
                Verify your microphone before starting
              </p>
              <p className="text-xs text-brand-muted">
                TechInView uses your mic for real-time voice interaction with
                Alex.
              </p>
            </div>
            <button
              onClick={handleMicCheck}
              disabled={micStatus === "checking"}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150",
                micStatus === "granted"
                  ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  : micStatus === "denied"
                    ? "border-brand-rose/40 bg-brand-rose/10 text-brand-rose"
                    : "border-brand-border text-brand-text hover:border-brand-subtle hover:bg-brand-card"
              )}
            >
              {micStatus === "checking" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : micStatus === "granted" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Mic Ready
                </>
              ) : micStatus === "denied" ? (
                <>
                  <XCircle className="h-4 w-4" />
                  Access Denied
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Test Microphone
                </>
              )}
            </button>
          </div>
          {micStatus === "denied" && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-rose/5 border border-brand-rose/20 px-3 py-2.5">
              <MicOff className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
              <p className="text-xs text-brand-rose">
                Microphone access was blocked. You can still type your responses
                during the interview, or grant access in your browser settings
                and try again.
              </p>
            </div>
          )}
          {micStatus === "granted" && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-green/5 border border-brand-green/20 px-3 py-2.5">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
              <p className="text-xs text-brand-green">
                Microphone detected and working. Voice interaction is enabled.
              </p>
            </div>
          )}
        </SectionCard>

        {/* Error */}
        {createError && (
          <div className="flex items-start gap-3 rounded-lg border border-brand-rose/30 bg-brand-rose/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
            <p className="text-sm text-brand-rose">{createError}</p>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2 pb-10">
          <Button
            size="lg"
            onClick={handleStartInterview}
            disabled={isCreating}
            className="w-full gap-2 text-base font-semibold"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Setting up your interview…
              </>
            ) : (
              <>
                Start Interview
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-brand-muted">
            By starting, you agree that Alex (our AI interviewer) will record
            and analyze your session.
          </p>
        </div>
      </div>
    </div>
  );
}
