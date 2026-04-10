"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Search,
  BookOpen,
  X,
  Braces,
  Network,
  MonitorSmartphone,
  Lock,
  Sparkles,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInterviewStore } from "@/stores/interview-store";
import { useSupabase } from "@/hooks/useSupabase";
import {
  FREE_TRIAL_DURATION_MINUTES,
  FULL_INTERVIEW_DURATION_MINUTES,
} from "@/lib/constants";

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
  | "backtracking"
  | "sliding-window"
  | "trie";
type Language = "python" | "javascript" | "java" | "cpp";
type Duration =
  | typeof FREE_TRIAL_DURATION_MINUTES
  | typeof FULL_INTERVIEW_DURATION_MINUTES;
type MicStatus = "idle" | "checking" | "granted" | "denied";
type ProblemMode = "random" | "specific";

type ProblemSummary = {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  company_tags: string[] | null;
};

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

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: "bg-brand-green/10 text-brand-green border border-brand-green/30",
  medium: "bg-brand-amber/10 text-brand-amber border border-brand-amber/30",
  hard: "bg-brand-rose/10 text-brand-rose border border-brand-rose/30",
};

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
  { value: "sliding-window", label: "Sliding Window" },
  { value: "trie", label: "Trie" },
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

// ─── Difficulty badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        DIFFICULTY_BADGE[difficulty]
      )}
    >
      {difficulty}
    </span>
  );
}

// ─── Category tag ─────────────────────────────────────────────────────────────

function CategoryTag({ category }: { category: string }) {
  const label =
    CATEGORIES.find((c) => c.value === category)?.label ?? category;
  return (
    <span className="rounded-full border border-brand-border px-2 py-0.5 text-xs text-brand-muted">
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewSetupPage() {
  return (
    <Suspense fallback={<SetupSkeleton />}>
      <InterviewSetupInner />
    </Suspense>
  );
}

function SetupSkeleton() {
  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      <div className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-brand-cyan" />
            <span className="font-semibold tracking-tight text-brand-text">TechInView</span>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-brand-card" />
        <div className="h-40 animate-pulse rounded-xl bg-brand-card" />
        <div className="h-24 animate-pulse rounded-xl bg-brand-card" />
      </div>
    </div>
  );
}

function InterviewSetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const initFromSetup = useInterviewStore((s) => s.initFromSetup);
  const { supabase, user } = useSupabase();

  const [form, setForm] = useState<SetupFormState>({
    difficulty: "medium",
    category: "any",
    language: "python",
    duration: FULL_INTERVIEW_DURATION_MINUTES,
  });
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Freemium state
  const [isFreeTrialUser, setIsFreeTrialUser] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("interview_credits, has_used_free_trial")
        .eq("id", user.id)
        .single();
      if (data) {
        setCredits(data.interview_credits ?? 0);
        const isFreeTrial = !(data.has_used_free_trial ?? false);
        setIsFreeTrialUser(isFreeTrial);
        if (isFreeTrial) {
          setForm((f) => ({
            ...f,
            difficulty: "easy",
            duration: FREE_TRIAL_DURATION_MINUTES as Duration,
          }));
          setProblemMode("random");
        }
      }
    })();
  }, [user, supabase]);

  // Problem selection state
  const [problemMode, setProblemMode] = useState<ProblemMode>("random");
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemsError, setProblemsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProblem, setSelectedProblem] = useState<ProblemSummary | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSpecificSelected = problemMode === "specific" && selectedProblem !== null;

  // ─── Fetch problems ────────────────────────────────────────────────────────

  const fetchProblems = useCallback(async (query: string) => {
    setProblemsLoading(true);
    setProblemsError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (query.trim()) params.set("search", query.trim());
      const res = await fetch(`/api/problems?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load problems");
      const json = (await res.json()) as {
        success: boolean;
        data?: { problems: ProblemSummary[] };
        error?: string;
      };
      if (!json.success) throw new Error(json.error ?? "Failed to load problems");
      setProblems(json.data?.problems ?? []);
    } catch (err) {
      setProblemsError(err instanceof Error ? err.message : "Failed to load problems");
    } finally {
      setProblemsLoading(false);
    }
  }, []);

  // Load problems when "specific" mode is first activated
  useEffect(() => {
    if (problemMode === "specific" && problems.length === 0 && !problemsLoading) {
      fetchProblems("");
    }
  }, [problemMode, problems.length, problemsLoading, fetchProblems]);

  // Debounced search
  useEffect(() => {
    if (problemMode !== "specific") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProblems(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, problemMode, fetchProblems]);

  // Auto-select from ?problem=slug URL param
  useEffect(() => {
    const slugFromUrl = searchParams.get("problem");
    if (!slugFromUrl) return;

    setProblemMode("specific");

    // Fetch just the one problem by search to pre-select it
    const findAndSelect = async () => {
      try {
        const res = await fetch(`/api/problems?search=${encodeURIComponent(slugFromUrl)}&limit=50`);
        if (!res.ok) return;
        const json = (await res.json()) as {
          success: boolean;
          data?: { problems: ProblemSummary[] };
        };
        const match = json.data?.problems?.find((p) => p.slug === slugFromUrl);
        if (match) {
          setSelectedProblem(match);
          // Also populate full list so the user sees context
          setProblems(json.data?.problems ?? []);
        }
      } catch {
        // Silently ignore — user can still search manually
      }
    };

    void findAndSelect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Focus search input when switching to specific mode
  useEffect(() => {
    if (problemMode === "specific") {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [problemMode]);

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
    posthog?.capture("interview_setup_started", {
      difficulty: form.difficulty,
      category: form.category,
      language: form.language,
      duration: form.duration,
      problem_mode: problemMode,
      is_free_trial: isFreeTrialUser,
    });
    try {
      const body: Record<string, unknown> = {
        difficulty: form.difficulty,
        category: form.category === "any" ? null : form.category,
        language: form.language,
        maxDurationSeconds: form.duration * 60,
      };

      if (problemMode === "specific" && selectedProblem) {
        body.problemSlug = selectedProblem.slug;
      }

      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const responseBody = (await res.json()) as { error?: string };
        throw new Error(responseBody.error ?? "Failed to start interview");
      }

      const data = (await res.json()) as {
        data?: {
          interviewId?: string;
          problem?: Record<string, unknown>;
          language?: string;
          maxDuration?: number;
          startedAt?: string;
        };
      };
      const interviewId = data.data?.interviewId;
      if (!interviewId) throw new Error("No interview ID returned");

      // Store full setup data in Zustand so InterviewRoom + Results can read it
      initFromSetup({
        interviewId,
        problem: data.data?.problem as Parameters<typeof initFromSetup>[0]["problem"],
        language: data.data?.language ?? form.language,
        maxDurationSeconds: data.data?.maxDuration ?? form.duration * 60,
        difficulty: form.difficulty,
        category: form.category === "any" ? null : form.category,
        startedAt: data.data?.startedAt ?? new Date().toISOString(),
      });

      router.push(`/interview/${interviewId}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setIsCreating(false);
    }
  }

  // ─── Filtered problems for display ──────────────────────────────────────────

  // If a problem is pre-selected, show it pinned at top, then rest below
  const displayProblems: ProblemSummary[] = selectedProblem
    ? [
        selectedProblem,
        ...problems.filter((p) => p.slug !== selectedProblem.slug),
      ]
    : problems;

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
            Configure your session and Tia will guide you through the rest.
          </p>
        </div>

        {/* Free trial banner */}
        {isFreeTrialUser && (
          <div className="flex items-start gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-5 py-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="text-sm font-semibold text-brand-text">Free Trial Interview</p>
              <p className="text-xs text-brand-muted mt-1">
                Your free trial includes a {FREE_TRIAL_DURATION_MINUTES}-minute voice session with an easy problem and a basic score summary.
                Buy an interview pack to unlock full {FULL_INTERVIEW_DURATION_MINUTES}-minute rounds, all difficulties, and detailed AI feedback.
              </p>
            </div>
          </div>
        )}

        {/* No credits warning */}
        {credits !== null && credits <= 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-brand-rose/30 bg-brand-rose/5 px-5 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-rose" />
            <div>
              <p className="text-sm font-semibold text-brand-text">No Credits Remaining</p>
              <p className="text-xs text-brand-muted mt-1">
                You need interview credits to start a session.{" "}
                <a href="/settings" className="text-brand-cyan hover:underline">Buy an interview pack</a> to continue practicing.
              </p>
            </div>
          </div>
        )}

        {/* 0 – Interview Type */}
        <SectionCard title="Interview Type">
          <div className="grid grid-cols-3 gap-3">
            {/* DSA — active */}
            <button
              className="flex items-start gap-3 rounded-lg border border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30 px-4 py-4 text-left transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-cyan/10 border border-brand-cyan/30">
                <Braces className="h-4 w-4 text-brand-cyan" />
              </div>
              <div>
                <span className="text-sm font-semibold text-brand-cyan">DSA / Coding</span>
                <p className="text-xs text-brand-muted mt-0.5">
                  Algorithms &amp; data structures
                </p>
              </div>
            </button>

            {/* System Design — coming soon */}
            <div className="flex items-start gap-3 rounded-lg border border-brand-border px-4 py-4 text-left opacity-50 cursor-not-allowed">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface border border-brand-border">
                <Network className="h-4 w-4 text-brand-muted" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-muted">System Design</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-amber/10 text-brand-amber border border-brand-amber/25">
                    <Lock className="h-2.5 w-2.5" />
                    Soon
                  </span>
                </div>
                <p className="text-xs text-brand-muted/60 mt-0.5">
                  Scalable architecture
                </p>
              </div>
            </div>

            {/* Machine Coding — coming soon */}
            <div className="flex items-start gap-3 rounded-lg border border-brand-border px-4 py-4 text-left opacity-50 cursor-not-allowed">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface border border-brand-border">
                <MonitorSmartphone className="h-4 w-4 text-brand-muted" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-muted">Machine Coding</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-amber/10 text-brand-amber border border-brand-amber/25">
                    <Lock className="h-2.5 w-2.5" />
                    Soon
                  </span>
                </div>
                <p className="text-xs text-brand-muted/60 mt-0.5">
                  Multi-file IDE projects
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 1 – Problem Selection */}
        <SectionCard title="Problem Selection">
          {/* Mode toggle */}
          <div className="flex gap-3">
            {/* Random option */}
            <button
              onClick={() => setProblemMode("random")}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-150",
                problemMode === "random"
                  ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                  : "border-brand-border hover:border-brand-subtle"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  problemMode === "random"
                    ? "border-brand-cyan bg-brand-cyan"
                    : "border-brand-border"
                )}
              >
                {problemMode === "random" && (
                  <div className="h-2 w-2 rounded-full bg-brand-deep" />
                )}
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
            </button>

            {/* Specific option */}
            <button
              onClick={() => !isFreeTrialUser && setProblemMode("specific")}
              disabled={isFreeTrialUser}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-150",
                isFreeTrialUser && "opacity-50 cursor-not-allowed",
                problemMode === "specific"
                  ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                  : "border-brand-border hover:border-brand-subtle"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  problemMode === "specific"
                    ? "border-brand-cyan bg-brand-cyan"
                    : "border-brand-border"
                )}
              >
                {problemMode === "specific" && (
                  <div className="h-2 w-2 rounded-full bg-brand-deep" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-cyan" />
                <span className="text-sm font-medium text-brand-text">
                  Choose Specific
                </span>
                {isFreeTrialUser && (
                  <Lock className="h-3 w-3 text-brand-muted" />
                )}
              </div>
            </button>
          </div>

          {/* Random mode hint */}
          {problemMode === "random" && (
            <p className="mt-3 text-xs text-brand-muted">
              A problem will be selected based on your difficulty and category
              preferences below.
            </p>
          )}

          {/* Specific mode: search + list */}
          {problemMode === "specific" && (
            <div className="mt-4 space-y-3">
              {/* Selected problem banner */}
              {selectedProblem && (
                <div className="flex items-center gap-3 rounded-lg border border-brand-cyan/40 bg-brand-cyan/5 px-4 py-2.5">
                  <CheckCircle className="h-4 w-4 shrink-0 text-brand-cyan" />
                  <span className="flex-1 text-sm font-medium text-brand-text">
                    {selectedProblem.title}
                  </span>
                  <DifficultyBadge difficulty={selectedProblem.difficulty} />
                  <button
                    onClick={() => setSelectedProblem(null)}
                    className="ml-1 rounded p-0.5 text-brand-muted hover:text-brand-text"
                    aria-label="Clear selection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problems by title…"
                  className="w-full rounded-lg border border-brand-border bg-brand-surface py-2.5 pl-9 pr-4 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Problems list */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-brand-border">
                {problemsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-brand-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading problems…
                  </div>
                ) : problemsError ? (
                  <div className="flex items-center gap-2 px-4 py-6 text-sm text-brand-rose">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {problemsError}
                  </div>
                ) : displayProblems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-brand-muted">
                    {searchQuery
                      ? `No problems match "${searchQuery}"`
                      : "No problems found"}
                  </div>
                ) : (
                  <ul className="divide-y divide-brand-border">
                    {displayProblems.map((problem) => {
                      const isSelected = selectedProblem?.slug === problem.slug;
                      return (
                        <li key={problem.slug}>
                          <button
                            onClick={() =>
                              setSelectedProblem(isSelected ? null : problem)
                            }
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100",
                              isSelected
                                ? "border-l-2 border-brand-cyan bg-brand-cyan/5"
                                : "hover:bg-brand-surface"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "truncate text-sm font-medium",
                                  isSelected
                                    ? "text-brand-cyan"
                                    : "text-brand-text"
                                )}
                              >
                                {problem.title}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <CategoryTag category={problem.category} />
                              <DifficultyBadge difficulty={problem.difficulty} />
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-brand-cyan" />
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Prompt if none selected */}
              {!selectedProblem && !problemsLoading && (
                <p className="text-xs text-brand-muted">
                  Click a problem above to select it for your interview.
                </p>
              )}
            </div>
          )}
        </SectionCard>

        {/* 2 – Difficulty */}
        <SectionCard title="Difficulty">
          <div className={cn("flex gap-3", isSpecificSelected && "opacity-40 pointer-events-none")}>
            {DIFFICULTIES.map((d) => {
              const lockedByTrial = isFreeTrialUser && d.value !== "easy";
              return (
                <button
                  key={d.value}
                  disabled={isSpecificSelected || lockedByTrial}
                  onClick={() => !lockedByTrial && setForm((f) => ({ ...f, difficulty: d.value }))}
                  className={cn(
                    "relative flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150",
                    lockedByTrial && "opacity-40 cursor-not-allowed",
                    form.difficulty === d.value ? d.activeColor : d.color
                  )}
                >
                  {d.label}
                  {lockedByTrial && (
                    <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-brand-muted" />
                  )}
                </button>
              );
            })}
          </div>
          {isSpecificSelected && (
            <p className="mt-2 text-xs text-brand-amber">
              Locked to {selectedProblem?.difficulty} — determined by the selected problem.
            </p>
          )}
          {isFreeTrialUser && !isSpecificSelected && (
            <p className="mt-2 text-xs text-brand-amber">
              Free trial is limited to easy problems. Buy a pack to unlock medium and hard.
            </p>
          )}
        </SectionCard>

        {/* 3 – Category */}
        <SectionCard title="Topic Category">
          <div className={cn("flex flex-wrap gap-2", isSpecificSelected && "opacity-40 pointer-events-none")}>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                disabled={isSpecificSelected}
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
          {isSpecificSelected && (
            <p className="mt-2 text-xs text-brand-amber">
              Locked to {selectedProblem?.category} — determined by the selected problem.
            </p>
          )}
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
          {isFreeTrialUser ? (
            <>
              <div className="flex gap-3">
                <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-cyan bg-brand-cyan/10 text-brand-cyan px-4 py-3 text-sm font-semibold">
                  <Clock className="h-4 w-4" />
                  <span>{FREE_TRIAL_DURATION_MINUTES} min</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-brand-amber">
                Free trial sessions are capped at {FREE_TRIAL_DURATION_MINUTES} minutes. Upgrade for full {FULL_INTERVIEW_DURATION_MINUTES}-minute interviews.
              </p>
            </>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-cyan bg-brand-cyan/10 text-brand-cyan px-4 py-3 text-sm font-semibold">
                  <Clock className="h-4 w-4" />
                  <span>{FULL_INTERVIEW_DURATION_MINUTES} min</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-brand-muted">
                Each paid interview credit unlocks one full {FULL_INTERVIEW_DURATION_MINUTES}-minute mock interview.
              </p>
            </>
          )}
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
                Tia.
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
            disabled={
              isCreating ||
              (problemMode === "specific" && !selectedProblem) ||
              (credits !== null && credits <= 0)
            }
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
          {problemMode === "specific" && !selectedProblem && (
            <p className="mt-2 text-center text-xs text-brand-amber">
              Select a problem above to continue.
            </p>
          )}
          <p className="mt-3 text-center text-xs text-brand-muted">
            By starting, you agree that Tia (our AI interviewer) will record
            and analyze your session.
          </p>
        </div>
      </div>
    </div>
  );
}
