"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, Suspense, type ChangeEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mic,
  MicOff,
  CheckCircle,
  XCircle,
  Shuffle,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  BookOpen,
  X,
  Braces,
  Lock,
  Sparkles,
  Building2,
  FileText,
  FileUp,
  Target,
  ListFilter,
  MessageSquare,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInterviewStore } from "@/stores/interview-store";
import { useSupabase } from "@/hooks/useSupabase";
import {
  FREE_TRIAL_DURATION_MINUTES,
  FULL_INTERVIEW_DURATION_MINUTES,
  type RoundType,
  type InterviewMode,
} from "@/lib/constants";
import {
  DEFAULT_INTERVIEWER_PERSONA,
  INTERVIEWER_PERSONAS,
  getDefaultInterviewerPersona,
  getInterviewerPersona,
  type InterviewerPersonaId,
} from "@/lib/interviewer-personas";
import {
  buildLoopStartPayload,
} from "@/lib/loops/generator";
import { ROUND_TYPE_LABELS } from "@/lib/loops/round-config";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type {
  GeneratedLoop,
  GeneratedLoopRound,
  HistoricalQuestion,
} from "@/lib/loops/types";
import type { ExperienceLevel } from "@/types";

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
  interviewerPersona: InterviewerPersonaId;
};

type TargetedLoopFormState = {
  company: string;
  roleTitle: string;
  experienceLevel: ExperienceLevel;
  jdText: string;
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

const EXPERIENCE_LEVEL_OPTIONS: {
  value: ExperienceLevel;
  label: string;
  description: string;
}[] = [
  { value: "junior", label: "Junior", description: "Early-career IC with execution focus." },
  { value: "mid", label: "Mid", description: "Independent IC expected to deliver cleanly." },
  { value: "senior", label: "Senior", description: "Ownership, design judgment, and broader scope." },
  { value: "staff", label: "Staff", description: "High-autonomy architecture and leadership bar." },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
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

function HistoricalQuestionPreview({ question }: { question: HistoricalQuestion }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
          {ROUND_TYPE_LABELS[question.roundType]}
        </span>
        <span className="text-[11px] text-brand-muted">{Math.round(question.confidence * 100)}% confidence</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-text">{question.prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {question.topics.map((topic) => (
          <span
            key={`${question.id}-${topic}`}
            className="rounded-full border border-brand-border px-2 py-0.5 text-[11px] text-brand-muted"
          >
            {topic}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-brand-muted">{question.sourceLabel}</p>
    </div>
  );
}

function GeneratedLoopRoundCard({
  round,
  isStarting,
  onStart,
}: {
  round: GeneratedLoopRound;
  isStarting: boolean;
  onStart: (round: GeneratedLoopRound) => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              Round {round.order}
            </span>
            <span className="rounded-full border border-brand-border px-3 py-1 text-[11px] font-medium text-brand-muted">
              {ROUND_TYPE_LABELS[round.roundType]}
            </span>
            <span className="rounded-full border border-brand-border px-3 py-1 text-[11px] font-medium text-brand-muted">
              {round.estimatedMinutes} min
            </span>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium",
                round.confidence === "high"
                  ? "border-brand-green/20 bg-brand-green/10 text-brand-green"
                  : "border-brand-amber/20 bg-brand-amber/10 text-brand-amber"
              )}
            >
              {round.confidence === "high" ? "Company-specific" : "Similar-company fallback"}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-brand-text">{round.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">{round.summary}</p>
          <p className="mt-3 text-xs leading-relaxed text-brand-muted">{round.rationale}</p>
        </div>

        <Button
          onClick={() => onStart(round)}
          disabled={isStarting}
          className="shrink-0"
        >
          {isStarting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              Start This Round
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {round.focusAreas.map((focus) => (
          <span
            key={`${round.id}-${focus}`}
            className="rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs text-brand-muted"
          >
            {focus}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {round.historicalQuestions.map((question) => (
          <HistoricalQuestionPreview key={question.id} question={question} />
        ))}
      </div>
    </div>
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
          <BrandLogo size="sm" wordmarkClassName="text-base" />
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

  const [interviewMode, setInterviewMode] = useState<InterviewMode>("general_dsa");
  const [form, setForm] = useState<SetupFormState>({
    difficulty: "medium",
    category: "any",
    language: "python",
    duration: FULL_INTERVIEW_DURATION_MINUTES,
    interviewerPersona: DEFAULT_INTERVIEWER_PERSONA,
  });
  const [targetedForm, setTargetedForm] = useState<TargetedLoopFormState>({
    company: "Google",
    roleTitle: "Software Engineer",
    experienceLevel: "mid",
    jdText: "",
  });
  const [generatedLoop, setGeneratedLoop] = useState<GeneratedLoop | null>(null);
  const [isGeneratingLoop, setIsGeneratingLoop] = useState(false);
  const [loopError, setLoopError] = useState<string | null>(null);
  const [isParsingJd, setIsParsingJd] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showQuestionExplorer, setShowQuestionExplorer] = useState(false);
  const [historicalQuestions, setHistoricalQuestions] = useState<HistoricalQuestion[]>([]);
  const [historicalQuestionsLoading, setHistoricalQuestionsLoading] = useState(false);
  const [historicalQuestionsError, setHistoricalQuestionsError] = useState<string | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionTopicFilter, setQuestionTopicFilter] = useState("all");
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
        .select("interview_credits, has_used_free_trial, target_company, experience_level")
        .eq("id", user.id)
        .single();
      if (data) {
        setCredits(data.interview_credits ?? 0);
        const isFreeTrial = !(data.has_used_free_trial ?? false);
        setIsFreeTrialUser(isFreeTrial);
        setForm((f) => ({
          ...f,
          difficulty: isFreeTrial ? "easy" : f.difficulty,
          duration: isFreeTrial
            ? (FREE_TRIAL_DURATION_MINUTES as Duration)
            : f.duration,
          interviewerPersona: isFreeTrial
            ? DEFAULT_INTERVIEWER_PERSONA
            : personaTouchedRef.current
              ? f.interviewerPersona
              : getDefaultInterviewerPersona(data.target_company ?? null, false),
        }));
        setTargetedForm((prev) => ({
          ...prev,
          company: data.target_company
            ? data.target_company.charAt(0).toUpperCase() + data.target_company.slice(1)
            : prev.company,
          experienceLevel: (data.experience_level as ExperienceLevel | null) ?? prev.experienceLevel,
        }));
        if (isFreeTrial) {
          setProblemMode("random");
        }
      }
    })();
  }, [user, supabase]);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "targeted_loop") {
      router.replace("/prep-plans/new");
    }
  }, [router, searchParams]);

  // Problem selection state
  const [problemMode, setProblemMode] = useState<ProblemMode>("random");
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemsError, setProblemsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProblem, setSelectedProblem] = useState<ProblemSummary | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const personaTouchedRef = useRef(false);
  const isSpecificSelected = problemMode === "specific" && selectedProblem !== null;
  const selectedPersona = getInterviewerPersona(form.interviewerPersona);
  const targetedPersona = getInterviewerPersona(
    generatedLoop?.personaId ??
      getDefaultInterviewerPersona(targetedForm.company.trim().toLowerCase(), false)
  );
  const activePersona = interviewMode === "targeted_loop" ? targetedPersona : selectedPersona;
  const availableQuestionTopics = Array.from(
    new Set(
      generatedLoop?.rounds.flatMap((round) =>
        round.historicalQuestions.flatMap((question) => question.topics)
      ) ?? []
    )
  );

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

  async function launchInterview(body: Record<string, unknown>) {
    setIsCreating(true);
    setCreateError(null);

    try {
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
          mode?: InterviewMode;
          roundType?: RoundType;
          interviewerPersona?: InterviewerPersonaId;
          round?: Parameters<typeof initFromSetup>[0]["roundContext"];
          generatedLoopSummary?: Parameters<typeof initFromSetup>[0]["loopSummary"];
          problem?: Parameters<typeof initFromSetup>[0]["problem"];
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
        mode: data.data?.mode ?? "general_dsa",
        roundType: data.data?.roundType ?? "coding",
        problem: data.data?.problem ?? null,
        roundContext: data.data?.round ?? null,
        language: data.data?.language ?? form.language,
        maxDurationSeconds: data.data?.maxDuration ?? form.duration * 60,
        difficulty: (body.difficulty as Difficulty | undefined) ?? form.difficulty,
        category:
          (body.category as string | null | undefined) ??
          (form.category === "any" ? null : form.category),
        interviewerPersona: data.data?.interviewerPersona ?? form.interviewerPersona,
        generatedLoopId: (body.generatedLoopId as string | null | undefined) ?? null,
        generatedLoopRoundId: (body.generatedLoopRoundId as string | null | undefined) ?? null,
        company:
          (body.generatedLoopSummary as { company?: string } | null | undefined)?.company ?? null,
        roleTitle:
          (body.generatedLoopSummary as { roleTitle?: string } | null | undefined)?.roleTitle ?? null,
        experienceLevel:
          (body.generatedLoopSummary as { experienceLevel?: string } | null | undefined)
            ?.experienceLevel ?? null,
        loopName:
          (body.generatedLoopSummary as { loopName?: string } | null | undefined)?.loopName ?? null,
        loopSummary: data.data?.generatedLoopSummary ?? null,
        startedAt: data.data?.startedAt ?? new Date().toISOString(),
      });

      router.push(`/interview/${interviewId}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsCreating(false);
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleStartInterview() {
    posthog?.capture("interview_setup_started", {
      mode: "general_dsa",
      difficulty: form.difficulty,
      category: form.category,
      language: form.language,
      duration: form.duration,
      interviewer_persona: form.interviewerPersona,
      problem_mode: problemMode,
      is_free_trial: isFreeTrialUser,
    });

    const body: Record<string, unknown> = {
      mode: "general_dsa",
      roundType: "coding",
      difficulty: form.difficulty,
      category: form.category === "any" ? null : form.category,
      language: form.language,
      maxDurationSeconds: form.duration * 60,
      interviewerPersona: form.interviewerPersona,
    };

    if (problemMode === "specific" && selectedProblem) {
      body.problemSlug = selectedProblem.slug;
    }

    await launchInterview(body);
  }

  async function handleGenerateLoop() {
    setIsGeneratingLoop(true);
    setLoopError(null);
    setGeneratedLoop(null);

    try {
      const res = await fetch("/api/loops/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetedForm),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { loop: GeneratedLoop };
        error?: string;
      };

      if (!res.ok || !json.success || !json.data?.loop) {
        throw new Error(json.error ?? "Failed to generate targeted loop");
      }

      setGeneratedLoop(json.data.loop);
      setShowQuestionExplorer(false);
      posthog?.capture("targeted_loop_generated", {
        company: json.data.loop.company,
        role_title: json.data.loop.roleTitle,
        experience_level: json.data.loop.experienceLevel,
        round_count: json.data.loop.rounds.length,
        used_fallback: json.data.loop.similarCompanyFallback,
      });
    } catch (err) {
      setLoopError(err instanceof Error ? err.message : "Failed to generate loop");
    } finally {
      setIsGeneratingLoop(false);
    }
  }

  async function handleUploadJd(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingJd(true);
    setLoopError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/jd/parse", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { fileName: string; jdText: string };
        error?: string;
      };

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Failed to parse the uploaded JD");
      }

      setUploadedFileName(json.data.fileName);
      setTargetedForm((prev) => ({ ...prev, jdText: json.data?.jdText ?? prev.jdText }));
    } catch (err) {
      setLoopError(err instanceof Error ? err.message : "Failed to parse the uploaded JD");
    } finally {
      setIsParsingJd(false);
      event.target.value = "";
    }
  }

  async function handleStartTargetedRound(round: GeneratedLoopRound) {
    if (!generatedLoop) return;

    posthog?.capture("targeted_round_started", {
      company: generatedLoop.company,
      role_title: generatedLoop.roleTitle,
      round_type: round.roundType,
      round_order: round.order,
    });

    const payload = buildLoopStartPayload(generatedLoop, round, form.language);
    await launchInterview({
      ...payload,
      maxDurationSeconds: round.estimatedMinutes * 60,
    });
  }

  const fetchHistoricalQuestions = useCallback(async () => {
    if (!generatedLoop || !showQuestionExplorer) return;

    setHistoricalQuestionsLoading(true);
    setHistoricalQuestionsError(null);
    try {
      const params = new URLSearchParams({
        company: generatedLoop.company,
      });
      if (questionSearch.trim()) params.set("search", questionSearch.trim());
      if (questionTopicFilter !== "all") params.set("topic", questionTopicFilter);

      const res = await fetch(`/api/historical-questions?${params.toString()}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { questions: HistoricalQuestion[] };
        error?: string;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to fetch historical questions");
      }

      setHistoricalQuestions(json.data?.questions ?? []);
    } catch (err) {
      setHistoricalQuestionsError(
        err instanceof Error ? err.message : "Failed to fetch historical questions"
      );
    } finally {
      setHistoricalQuestionsLoading(false);
    }
  }, [generatedLoop, questionSearch, questionTopicFilter, showQuestionExplorer]);

  useEffect(() => {
    void fetchHistoricalQuestions();
  }, [fetchHistoricalQuestions]);

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
          <BrandLogo size="sm" wordmarkClassName="text-base" />
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
            {interviewMode === "targeted_loop"
              ? "Paste your JD, generate the likely loop, and start the round you want to practice first."
              : `Configure your session and ${activePersona.name} will guide you through the rest.`}
          </p>
        </div>

        {/* Free trial banner */}
        {isFreeTrialUser && (
          <div className="flex items-start gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-5 py-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="text-sm font-semibold text-brand-text">Free Trial Interview</p>
              <p className="text-xs text-brand-muted mt-1">
                Your free trial includes a {FREE_TRIAL_DURATION_MINUTES}-minute voice session with Tia, an easy problem, and a basic score summary.
                Buy an interview pack to unlock company-specific personas, full {FULL_INTERVIEW_DURATION_MINUTES}-minute rounds, all difficulties, and detailed AI feedback.
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
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setInterviewMode("general_dsa")}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-4 text-left transition-all",
                interviewMode === "general_dsa"
                  ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                  : "border-brand-border hover:border-brand-subtle hover:bg-brand-surface"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  interviewMode === "general_dsa"
                    ? "border-brand-cyan/30 bg-brand-cyan/10"
                    : "border-brand-border bg-brand-surface"
                )}
              >
                <Braces className={cn("h-4 w-4", interviewMode === "general_dsa" ? "text-brand-cyan" : "text-brand-muted")} />
              </div>
              <div>
                <span className={cn("text-sm font-semibold", interviewMode === "general_dsa" ? "text-brand-cyan" : "text-brand-text")}>
                  General DSA Round
                </span>
                <p className="text-xs text-brand-muted mt-0.5">
                  Pick difficulty, topic, persona, and start a traditional coding interview.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/prep-plans/new")}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-4 text-left transition-all",
                interviewMode === "targeted_loop"
                  ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                  : "border-brand-border hover:border-brand-subtle hover:bg-brand-surface"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  interviewMode === "targeted_loop"
                    ? "border-brand-cyan/30 bg-brand-cyan/10"
                    : "border-brand-border bg-brand-surface"
                )}
              >
                <Target className={cn("h-4 w-4", interviewMode === "targeted_loop" ? "text-brand-cyan" : "text-brand-muted")} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", interviewMode === "targeted_loop" ? "text-brand-cyan" : "text-brand-text")}>
                    Targeted Loop
                  </span>
                  <span className="rounded-full border border-brand-green/20 bg-brand-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-green">
                    Company + role + JD
                  </span>
                </div>
                <p className="text-xs text-brand-muted mt-0.5">
                  Generate coding, behavioral, hiring manager, and system design rounds from the job you are actually applying for.
                </p>
              </div>
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-brand-muted">
            Company, role, and JD-based prep planning now lives in <Link href="/prep-plans/new" className="text-brand-cyan hover:underline">Prep Plans</Link>, outside interview setup.
          </p>
        </SectionCard>

        {interviewMode === "targeted_loop" && (
          <>
            <SectionCard title="Target Role">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
                    <Building2 className="h-3.5 w-3.5" />
                    Company
                  </label>
                  <input
                    type="text"
                    value={targetedForm.company}
                    onChange={(event) =>
                      setTargetedForm((prev) => ({ ...prev, company: event.target.value }))
                    }
                    placeholder="Google"
                    className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
                    <Target className="h-3.5 w-3.5" />
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={targetedForm.roleTitle}
                    onChange={(event) =>
                      setTargetedForm((prev) => ({ ...prev, roleTitle: event.target.value }))
                    }
                    placeholder="Senior Software Engineer"
                    className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
                  <ListFilter className="h-3.5 w-3.5" />
                  Experience Level
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {EXPERIENCE_LEVEL_OPTIONS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() =>
                        setTargetedForm((prev) => ({ ...prev, experienceLevel: level.value }))
                      }
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left transition-all",
                        targetedForm.experienceLevel === level.value
                          ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                          : "border-brand-border hover:border-brand-subtle hover:bg-brand-surface"
                      )}
                    >
                      <p className="text-sm font-semibold text-brand-text">{level.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                        {level.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-muted">
                  <FileText className="h-3.5 w-3.5" />
                  Job Description
                </label>
                <textarea
                  value={targetedForm.jdText}
                  onChange={(event) =>
                    setTargetedForm((prev) => ({ ...prev, jdText: event.target.value }))
                  }
                  rows={12}
                  placeholder="Paste the job description here. We’ll use the company, role, and JD signals to assemble a likely interview loop."
                  className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-3 text-sm leading-relaxed text-brand-text placeholder:text-brand-muted focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-brand-muted">
                    {uploadedFileName ? `Uploaded: ${uploadedFileName}` : "Paste the JD or upload a text-based file."}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.rtf,.csv,.pdf"
                      className="hidden"
                      onChange={handleUploadJd}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isParsingJd}
                    >
                      {isParsingJd ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <FileUp className="h-4 w-4" />
                          Upload JD
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGenerateLoop}
                      disabled={isGeneratingLoop || targetedForm.jdText.trim().length < 40}
                    >
                      {isGeneratingLoop ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating loop...
                        </>
                      ) : (
                        <>
                          Generate Loop
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </SectionCard>

            {generatedLoop && (
              <SectionCard title="Likely Interview Loop">
                <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-text">{generatedLoop.loopName}</p>
                      <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                        {generatedLoop.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-brand-border px-3 py-1 text-[11px] font-medium text-brand-muted">
                          {targetedPersona.name} · {targetedPersona.companyLabel}
                        </span>
                        {generatedLoop.jdSignals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-full border border-brand-border px-3 py-1 text-[11px] font-medium text-brand-muted"
                          >
                            {signal.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                        Confidence
                      </p>
                      <p className="mt-2 text-sm font-semibold text-brand-text">
                        {generatedLoop.confidence === "high" ? "High confidence" : "Mixed with similar-company signals"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {generatedLoop.rounds.map((round) => (
                    <GeneratedLoopRoundCard
                      key={round.id}
                      round={round}
                      isStarting={isCreating}
                      onStart={handleStartTargetedRound}
                    />
                  ))}
                </div>

                <div className="mt-5 border-t border-brand-border pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-brand-text">See all reviewed historical questions</p>
                      <p className="text-xs text-brand-muted mt-1">
                        Browse the company-specific corpus behind this loop by topic or keyword.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowQuestionExplorer((prev) => !prev)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {showQuestionExplorer ? "Hide question explorer" : "Open question explorer"}
                    </Button>
                  </div>

                  {showQuestionExplorer && (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
                        <input
                          type="text"
                          value={questionSearch}
                          onChange={(event) => setQuestionSearch(event.target.value)}
                          placeholder="Search by topic, keyword, or question phrasing"
                          className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                        />
                        <select
                          value={questionTopicFilter}
                          onChange={(event) => setQuestionTopicFilter(event.target.value)}
                          className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text focus:border-brand-cyan/60 focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                        >
                          <option value="all">All topics</option>
                          {availableQuestionTopics.map((topic) => (
                            <option key={topic} value={topic}>
                              {topic}
                            </option>
                          ))}
                        </select>
                      </div>

                      {historicalQuestionsLoading ? (
                        <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-4 py-6 text-sm text-brand-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading reviewed questions...
                        </div>
                      ) : historicalQuestionsError ? (
                        <div className="rounded-lg border border-brand-rose/20 bg-brand-rose/5 px-4 py-3 text-sm text-brand-rose">
                          {historicalQuestionsError}
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {historicalQuestions.map((question) => (
                            <HistoricalQuestionPreview key={question.id} question={question} />
                          ))}
                          {historicalQuestions.length === 0 && (
                            <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-6 text-sm text-brand-muted">
                              No reviewed questions matched this filter.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {interviewMode === "general_dsa" && (
          <>
        <SectionCard title="Interviewer Persona">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTERVIEWER_PERSONAS.map((persona) => {
              const isLocked = isFreeTrialUser && persona.id !== DEFAULT_INTERVIEWER_PERSONA;
              const isSelected = form.interviewerPersona === persona.id;

              return (
                <button
                  key={persona.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    personaTouchedRef.current = true;
                    setForm((prev) => ({ ...prev, interviewerPersona: persona.id }));
                  }}
                  className={cn(
                    "relative rounded-xl border px-4 py-4 text-left transition-all duration-150",
                    isLocked && "cursor-not-allowed opacity-50",
                    isSelected
                      ? "border-brand-cyan bg-brand-cyan/5 ring-1 ring-brand-cyan/30"
                      : "border-brand-border hover:border-brand-subtle hover:bg-brand-surface"
                  )}
                >
                  {isLocked && (
                    <Lock className="absolute right-3 top-3 h-3.5 w-3.5 text-brand-muted" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-text">
                        {persona.name}
                      </p>
                      <p className="text-xs text-brand-cyan">
                        {persona.companyLabel}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 shrink-0 text-brand-cyan" />
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-brand-muted">
                    {persona.shortStyleSummary}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
            <p className="text-sm font-medium text-brand-text">
              {selectedPersona.name} · {selectedPersona.companyLabel}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-muted">
              {selectedPersona.calibrationNotes}
            </p>
          </div>

          {isFreeTrialUser && (
            <p className="mt-3 text-xs text-brand-amber">
              Free trial sessions are limited to Tia. Upgrade to unlock company-specific interviewer personas.
            </p>
          )}
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
          </>
        )}

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
        {interviewMode === "general_dsa" && (
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
        )}

        {/* 6 – Mic Check */}
        <SectionCard title="Microphone Check">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-brand-text">
                Verify your microphone before starting
              </p>
              <p className="text-xs text-brand-muted">
                TechInView uses your mic for real-time voice interaction with
                {" "}{activePersona.name}.
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
        {loopError && (
          <div className="flex items-start gap-3 rounded-lg border border-brand-rose/30 bg-brand-rose/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" />
            <p className="text-sm text-brand-rose">{loopError}</p>
          </div>
        )}

        {/* CTA */}
        {interviewMode === "general_dsa" ? (
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
              By starting, you agree that {activePersona.name} will record and analyze your session.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-brand-border bg-brand-card px-5 py-4 text-sm text-brand-muted">
            Generate a targeted loop above, then launch any round directly from the loop cards. The generated rounds will use {activePersona.name} as the interviewer calibration by default.
          </div>
        )}
      </div>
    </div>
  );
}
