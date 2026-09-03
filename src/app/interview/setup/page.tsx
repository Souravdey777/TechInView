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
  Code2,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  BookOpen,
  X,
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
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import {
  FREE_TRIAL_DURATION_MINUTES,
  FULL_INTERVIEW_DURATION_MINUTES,
  SCORING_DIMENSIONS,
  type RoundType,
  type InterviewMode,
} from "@/lib/constants";
import { PHASE_ORDER } from "@/lib/interview-phases";
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
import { SetupPageHeader } from "@/components/interviews/SetupPageHeader";
import { InterviewSetupSection } from "@/components/interviews/InterviewSetupLayout";
import {
  SETUP_FOCUS_RING,
  SetupMonoLabel,
  SetupRack,
} from "@/components/interviews/dsa-setup/SetupRack";
import {
  SetupSegmentedControl,
  SetupSelect,
} from "@/components/interviews/dsa-setup/SetupControls";
import {
  DsaModePicker,
  type ModeChipTone,
} from "@/components/interviews/dsa-setup/DsaModePicker";
import { InterviewerPersonaPicker } from "@/components/interviews/dsa-setup/InterviewerPersonaPicker";
import {
  InterviewerVoiceCard,
  SessionFactsCard,
  type SessionFact,
} from "@/components/interviews/dsa-setup/SessionSummaryCards";
import type {
  GeneratedLoop,
  GeneratedLoopRound,
  HistoricalQuestion,
} from "@/lib/loops/types";
import type { ExperienceLevel } from "@/types";
import {
  DEFAULT_DSA_EXPERIENCE,
  normalizeDsaExperience,
  type DsaExperience,
} from "@/lib/dsa";

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
  is_free_solver_enabled: boolean;
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
    <InterviewSetupSection title={title} className={className}>
      <div className="mt-4">
      {children}
      </div>
    </InterviewSetupSection>
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

function categoryLabel(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

function CategoryTag({ category }: { category: string }) {
  const label = categoryLabel(category);
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
      <SetupPageHeader
        containerClassName="max-w-6xl"
        supportingText="DSA · Interview setup"
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-brand-surface" />
        <div className="mt-6 grid gap-5 lg:grid-cols-12 lg:items-start">
          <div className="space-y-5 lg:col-span-8">
            <div className="h-40 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />
            <div className="h-48 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />
            <div className="h-56 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />
          </div>
          <div className="space-y-5 lg:col-span-4">
            <div className="h-72 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />
            <div className="h-40 animate-pulse rounded-2xl border border-brand-border bg-brand-card" />
          </div>
        </div>
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

  const [interviewMode] = useState<InterviewMode>("general_dsa");
  const [dsaExperience, setDsaExperience] = useState<DsaExperience>(DEFAULT_DSA_EXPERIENCE);
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
  const {
    devices: microphoneDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    deviceWarning,
  } = useMicrophoneDevices();

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
        const shouldForcePreviewDefaults = isFreeTrial && (data.interview_credits ?? 0) <= 0;
        setIsFreeTrialUser(isFreeTrial);
        setForm((f) => ({
          ...f,
          difficulty: shouldForcePreviewDefaults ? "easy" : f.difficulty,
          duration: shouldForcePreviewDefaults
            ? (FREE_TRIAL_DURATION_MINUTES as Duration)
            : f.duration,
          interviewerPersona: shouldForcePreviewDefaults
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
        if (shouldForcePreviewDefaults) {
          setProblemMode("random");
        }
      }
    })();
  }, [user, supabase]);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "targeted_loop") {
      router.replace("/prep-guru");
    }
  }, [router, searchParams]);

  useEffect(() => {
    setDsaExperience(normalizeDsaExperience(searchParams.get("dsaExperience")));
  }, [searchParams]);

  // Problem selection state
  const [problemMode, setProblemMode] = useState<ProblemMode>("random");
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemsError, setProblemsError] = useState<string | null>(null);
  const [practiceRandomMatches, setPracticeRandomMatches] = useState<ProblemSummary[]>([]);
  const [practiceRandomMatchesLoading, setPracticeRandomMatchesLoading] = useState(false);
  const [practiceRandomMatchesError, setPracticeRandomMatchesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProblem, setSelectedProblem] = useState<ProblemSummary | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const personaTouchedRef = useRef(false);
  const isSpecificSelected = problemMode === "specific" && selectedProblem !== null;
  const hasCredits = (credits ?? 0) > 0;
  const isPracticeMode = interviewMode === "general_dsa" && dsaExperience === "practice";
  const isAiInterviewMode = interviewMode === "general_dsa" && dsaExperience === "ai_interview";
  const isPreviewSession = isAiInterviewMode && !hasCredits && isFreeTrialUser;
  const isAiModeLocked = isAiInterviewMode && !hasCredits && !isFreeTrialUser;
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

  useEffect(() => {
    if (!isPreviewSession) return;

    setProblemMode("random");
    setSelectedProblem(null);
    setForm((previous) => ({
      ...previous,
      difficulty: "easy",
      duration: FREE_TRIAL_DURATION_MINUTES as Duration,
      interviewerPersona: DEFAULT_INTERVIEWER_PERSONA,
    }));
  }, [isPreviewSession]);

  // ─── Fetch problems ────────────────────────────────────────────────────────

  const fetchProblems = useCallback(async (query: string, freeOnly: boolean) => {
    setProblemsLoading(true);
    setProblemsError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (query.trim()) params.set("search", query.trim());
      if (freeOnly) params.set("freeOnly", "true");
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

  const fetchPracticeRandomOptions = useCallback(async () => {
    setPracticeRandomMatchesLoading(true);
    setPracticeRandomMatchesError(null);
    try {
      const params = new URLSearchParams({
        limit: "50",
        difficulty: form.difficulty,
        freeOnly: "true",
      });
      if (form.category !== "any") {
        params.set("category", form.category);
      }

      const res = await fetch(`/api/problems?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load practice problems");
      const json = (await res.json()) as {
        success: boolean;
        data?: { problems: ProblemSummary[] };
        error?: string;
      };
      if (!json.success) throw new Error(json.error ?? "Failed to load practice problems");
      setPracticeRandomMatches(json.data?.problems ?? []);
    } catch (err) {
      setPracticeRandomMatchesError(
        err instanceof Error ? err.message : "Failed to load practice problems"
      );
      setPracticeRandomMatches([]);
    } finally {
      setPracticeRandomMatchesLoading(false);
    }
  }, [form.category, form.difficulty]);

  // Load problems when "specific" mode is first activated
  useEffect(() => {
    if (problemMode === "specific" && problems.length === 0 && !problemsLoading) {
      fetchProblems("", isPracticeMode);
    }
  }, [problemMode, problems.length, problemsLoading, fetchProblems, isPracticeMode]);

  // Debounced search
  useEffect(() => {
    if (problemMode !== "specific") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProblems(searchQuery, isPracticeMode);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, problemMode, fetchProblems, isPracticeMode]);

  useEffect(() => {
    if (!isPracticeMode || problemMode !== "random") return;
    void fetchPracticeRandomOptions();
  }, [fetchPracticeRandomOptions, isPracticeMode, problemMode]);

  // Auto-select from ?problem=slug URL param
  useEffect(() => {
    const slugFromUrl = searchParams.get("problem");
    if (!slugFromUrl) return;

    setProblemMode("specific");
    const requestedExperience = normalizeDsaExperience(searchParams.get("dsaExperience"));

    // Fetch just the one problem by search to pre-select it
    const findAndSelect = async () => {
      try {
        const params = new URLSearchParams({
          search: slugFromUrl,
          limit: "50",
        });
        if (requestedExperience === "practice") {
          params.set("freeOnly", "true");
        }
        const res = await fetch(`/api/problems?${params.toString()}`);
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

  useEffect(() => {
    if (!isPracticeMode) return;
    setSelectedProblem((current) =>
      current && !current.is_free_solver_enabled ? null : current
    );
  }, [isPracticeMode]);

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
      await refreshDevices(true);
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
          isFreeInterview?: boolean;
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
        isFreeInterview: data.data?.isFreeInterview ?? false,
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

  function handleDsaExperienceChange(nextExperience: DsaExperience) {
    setDsaExperience(nextExperience);
    posthog?.capture("dsa_mode_selected", {
      mode: nextExperience,
      source: "dsa_setup",
    });

    const params = new URLSearchParams(searchParams.toString());
    params.set("dsaExperience", nextExperience);
    router.replace(`/interview/setup?${params.toString()}`);
  }

  async function handleStartPractice() {
    let targetProblem = selectedProblem;

    if (problemMode === "random") {
      if (practiceRandomMatches.length === 0) return;
      targetProblem =
        practiceRandomMatches[Math.floor(Math.random() * practiceRandomMatches.length)] ?? null;
    }

    if (!targetProblem) return;

    posthog?.capture("practice_started", {
      problem_slug: targetProblem.slug,
      difficulty: form.difficulty,
      category: form.category,
      language: form.language,
      problem_mode: problemMode,
    });

    router.push(`/practice/solve/${targetProblem.slug}`);
  }

  async function handleStartInterview() {
    posthog?.capture("interview_setup_started", {
      mode: "general_dsa",
      difficulty: form.difficulty,
      category: form.category,
      language: form.language,
      duration: form.duration,
      interviewer_persona: form.interviewerPersona,
      problem_mode: problemMode,
      is_free_trial: isPreviewSession,
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

  // ─── Display-only derivations ───────────────────────────────────────────────

  const scoringDimensionCount = Object.keys(SCORING_DIMENSIONS).length;
  const selectedLanguageLabel =
    LANGUAGES.find((lang) => lang.value === form.language)?.label ?? form.language;
  const selectedCategoryLabel = categoryLabel(form.category);
  const rackIndex = isPracticeMode
    ? { mode: "01", interviewer: "02", problem: "02", microphone: "03" }
    : { mode: "01", interviewer: "02", problem: "03", microphone: "04" };
  const aiModeStatus = isPreviewSession
    ? `${FREE_TRIAL_DURATION_MINUTES}-min preview`
    : isAiModeLocked
      ? "Locked"
      : "1 credit";
  const aiModeStatusTone: ModeChipTone = isAiModeLocked ? "rose" : "cyan";
  const aiModeCostSentence = isPreviewSession
    ? `Runs as your free ${FREE_TRIAL_DURATION_MINUTES}-minute audio preview.`
    : isAiModeLocked
      ? "Needs an interview pack before another round can start."
      : `Spends one interview credit on a full ${FULL_INTERVIEW_DURATION_MINUTES}-minute round.`;
  const aiModeDetail = `Voice interviewer, live editor, ${PHASE_ORDER.length} phases, scored on ${scoringDimensionCount} dimensions. ${aiModeCostSentence}`;
  const aiCostValue = isPreviewSession
    ? "Free preview"
    : isAiModeLocked
      ? "Interview pack needed"
      : credits === null
        ? "1 interview credit"
        : `1 of ${credits} credit${credits === 1 ? "" : "s"}`;
  const sessionFacts: SessionFact[] = isPracticeMode
    ? [
        { label: "Format", value: "Solo practice" },
        { label: "Timer", value: "Untimed" },
        { label: "Language", value: selectedLanguageLabel },
        { label: "Cost", value: "Free", emphasis: true },
      ]
    : [
        { label: "Duration", value: `${form.duration} min` },
        { label: "Phases", value: `${PHASE_ORDER.length}` },
        { label: "Scored on", value: `${scoringDimensionCount} dimensions` },
        { label: "Cost", value: aiCostValue, emphasis: true },
      ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-deep text-brand-text">
      {/* Header */}
      <SetupPageHeader
        containerClassName="max-w-6xl"
        supportingText="DSA · Interview setup"
      />

      {/* Body */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0">
            <SetupMonoLabel>New session</SetupMonoLabel>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
              Set up the room.
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-brand-muted lg:max-w-sm lg:text-right">
            Practice Mode is free and self-paced. AI Interview Mode spends one
            interview credit and runs a full{" "}
            {FULL_INTERVIEW_DURATION_MINUTES}-minute voice round that is scored on{" "}
            {scoringDimensionCount} dimensions.
          </p>
        </header>

        {isPracticeMode && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-5 py-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="text-sm font-semibold text-brand-text">Free Practice Mode</p>
              <p className="mt-1 text-xs text-brand-muted">
                Practice Mode gives you a curated set of DSA problems, code execution, and saved progress.
                Switch to AI Interview Mode when you want the 5-minute audio preview or a full interview round with voice and scoring.
              </p>
            </div>
          </div>
        )}

        {/* AI preview banner */}
        {isAiInterviewMode && isFreeTrialUser && !hasCredits && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-5 py-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
            <div>
              <p className="text-sm font-semibold text-brand-text">5-Minute Audio Preview</p>
              <p className="text-xs text-brand-muted mt-1">
                Your preview includes a {FREE_TRIAL_DURATION_MINUTES}-minute voice session with Tia, an easy random problem, and a basic score summary.
                Buy an interview pack to unlock company-specific personas, full {FULL_INTERVIEW_DURATION_MINUTES}-minute rounds, specific problem selection, and detailed AI feedback.
              </p>
            </div>
          </div>
        )}

        {/* No credits warning */}
        {isAiModeLocked && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-rose/30 bg-brand-rose/5 px-5 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-rose" />
            <div>
              <p className="text-sm font-semibold text-brand-text">AI Interview Mode Locked</p>
              <p className="text-xs text-brand-muted mt-1">
                Your audio preview has already been used.{" "}
                <a href="/settings" className="text-brand-cyan hover:underline">Buy an interview pack</a> to start another AI interview.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-12 lg:items-start">
          {/* ─── Configuration racks ─── */}
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">

        {interviewMode === "general_dsa" && (
          <SetupRack index={rackIndex.mode} label="Mode">
            <DsaModePicker
              value={dsaExperience}
              onChange={handleDsaExperienceChange}
              practiceStatus="Free"
              practiceStatusTone="green"
              practiceDetail="Solve solo and untimed with hints and code execution. Progress saves as you go and no interview credit is spent."
              aiStatus={aiModeStatus}
              aiStatusTone={aiModeStatusTone}
              aiDetail={aiModeDetail}
            />
          </SetupRack>
        )}

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

        {interviewMode === "general_dsa" && !isPracticeMode && (
          <SetupRack
            index={rackIndex.interviewer}
            label="Interviewer"
            note="Each has its own voice and scoring emphasis"
          >
            <InterviewerPersonaPicker
              personas={INTERVIEWER_PERSONAS}
              value={form.interviewerPersona}
              isPersonaLocked={(personaId) =>
                isPreviewSession && personaId !== DEFAULT_INTERVIEWER_PERSONA
              }
              onSelect={(personaId) => {
                if (isPreviewSession && personaId !== DEFAULT_INTERVIEWER_PERSONA) return;
                personaTouchedRef.current = true;
                setForm((prev) => ({ ...prev, interviewerPersona: personaId }));
              }}
            />

            <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface px-4 py-3">
              <SetupMonoLabel>
                Calibration · {selectedPersona.name} · {selectedPersona.companyLabel}
              </SetupMonoLabel>
              <p className="mt-2 text-xs leading-relaxed text-brand-muted">
                {selectedPersona.calibrationNotes}
              </p>
            </div>

            {isPreviewSession && (
              <p className="mt-3 text-xs text-brand-amber">
                Preview sessions are limited to Tia. Upgrade to unlock company-specific interviewer personas.
              </p>
            )}
          </SetupRack>
        )}

        <SetupRack index={rackIndex.problem} label="Problem">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviewMode === "general_dsa" && (
              <>
                <SetupSegmentedControl<Difficulty>
                  label="Difficulty"
                  value={form.difficulty}
                  className={cn(isSpecificSelected && "pointer-events-none opacity-40")}
                  onChange={(value) => setForm((f) => ({ ...f, difficulty: value }))}
                  options={DIFFICULTIES.map((d) => ({
                    value: d.value,
                    label: d.label,
                    disabled: isSpecificSelected || (isPreviewSession && d.value !== "easy"),
                    locked: isPreviewSession && d.value !== "easy",
                    inactiveClassName: d.color,
                    activeClassName: d.activeColor,
                  }))}
                />

                <SetupSelect<Category>
                  id="dsa-setup-category"
                  label="Category"
                  value={form.category}
                  options={CATEGORIES}
                  disabled={isSpecificSelected}
                  onChange={(value) => setForm((f) => ({ ...f, category: value }))}
                />
              </>
            )}

            <SetupSelect<Language>
              id="dsa-setup-language"
              label="Language"
              value={form.language}
              options={LANGUAGES}
              onChange={(value) => setForm((f) => ({ ...f, language: value }))}
            />
          </div>

          {interviewMode === "general_dsa" && (
            <>
              {isSpecificSelected && (
                <p className="mt-3 text-xs text-brand-amber">
                  Difficulty is locked to {selectedProblem?.difficulty} and category to{" "}
                  {selectedProblem?.category} — determined by the selected problem.
                </p>
              )}

              {isPreviewSession && !isSpecificSelected && (
                <p className="mt-3 text-xs text-brand-amber">
                  Audio preview is limited to easy problems. Buy a pack to unlock medium and hard.
                </p>
              )}

              {/* Chosen problem */}
              {problemMode === "random" ? (
                <div className="mt-4">
                  <div className="flex flex-col gap-3 rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Shuffle className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-text">
                          Random problem
                        </p>
                        <p className="mt-1">
                          <SetupMonoLabel>
                            {form.difficulty} · {selectedCategoryLabel} · Recommended
                          </SetupMonoLabel>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isPreviewSession && setProblemMode("specific")}
                      disabled={isPreviewSession}
                      className={cn(
                        "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-card px-3 text-xs font-medium text-brand-text transition-colors duration-150",
                        isPreviewSession
                          ? "cursor-not-allowed opacity-50"
                          : "hover:border-brand-subtle",
                        SETUP_FOCUS_RING
                      )}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Pick a specific problem
                      {isPreviewSession && (
                        <Lock className="h-3 w-3 text-brand-muted" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-brand-muted">
                    {isPracticeMode
                      ? "A free-practice problem will be selected from the curated DSA set based on your filters above."
                      : "A problem will be selected based on your difficulty and category preferences above."}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {selectedProblem ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-brand-cyan/40 bg-brand-cyan/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-text">
                            {selectedProblem.title}
                          </p>
                          <p className="mt-1">
                            <SetupMonoLabel>
                              {selectedProblem.difficulty} ·{" "}
                              {categoryLabel(selectedProblem.category)}
                            </SetupMonoLabel>
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProblem(null)}
                          className={cn(
                            "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-card px-3 text-xs font-medium text-brand-text transition-colors duration-150 hover:border-brand-subtle",
                            SETUP_FOCUS_RING
                          )}
                        >
                          <Search className="h-3.5 w-3.5" />
                          Pick another
                        </button>
                        <button
                          type="button"
                          onClick={() => setProblemMode("random")}
                          className={cn(
                            "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium text-brand-muted transition-colors duration-150 hover:text-brand-text",
                            SETUP_FOCUS_RING
                          )}
                        >
                          <Shuffle className="h-3.5 w-3.5" />
                          Use a random problem
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div hidden={selectedProblem !== null} className="space-y-3">
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
                        Click a problem above to select it for your {isPracticeMode ? "practice session" : "interview"}.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setProblemMode("random")}
                      className={cn(
                        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium text-brand-muted transition-colors duration-150 hover:text-brand-text",
                        SETUP_FOCUS_RING
                      )}
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      Use a random problem instead
                    </button>
                  </div>
                </div>
              )}

              {isPracticeMode && problemMode === "random" && practiceRandomMatchesError ? (
                <p className="mt-3 text-xs text-brand-rose">{practiceRandomMatchesError}</p>
              ) : null}

              {isPracticeMode && problemMode === "random" && !practiceRandomMatchesLoading && practiceRandomMatches.length === 0 ? (
                <p className="mt-3 text-xs text-brand-amber">
                  No free-practice problems match these filters right now. Adjust difficulty or category to continue.
                </p>
              ) : null}
            </>
          )}

          <p className="mt-4 text-xs leading-relaxed text-brand-muted">
            Python and JavaScript execute against real tests in the round. Java and
            C++ are selectable, but execution is still landing.
          </p>
        </SetupRack>

        {/* Microphone */}
        {!isPracticeMode && (
        <SetupRack index={rackIndex.microphone} label="Microphone">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                "flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150",
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
            <div className="mt-3 space-y-3 rounded-lg border border-brand-green/20 bg-brand-green/5 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                <p className="text-xs text-brand-green">
                  Microphone detected and working. Voice interaction is enabled.
                </p>
              </div>
              {microphoneDevices.length > 0 ? (
                <label className="block text-xs text-brand-muted">
                  <span className="mb-1 block">Microphone</span>
                  <select
                    value={selectedDeviceId}
                    onChange={(event) => setSelectedDeviceId(event.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:border-brand-cyan/60 focus:outline-none"
                  >
                    <option value="">System default</option>
                    {microphoneDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {deviceWarning ? <p className="text-xs text-brand-amber">{deviceWarning}</p> : null}
            </div>
          )}
        </SetupRack>
        )}

          </div>

          {/* ─── Summary rail ─── */}
          <div className="lg:col-span-4">
            <div className="flex flex-col gap-5 lg:sticky lg:top-8">
              {!isPracticeMode && <InterviewerVoiceCard persona={activePersona} />}

              <SessionFactsCard title="This session" facts={sessionFacts} />

              {interviewMode === "general_dsa" && !isPracticeMode && (
                <p
                  className={cn(
                    "text-xs leading-relaxed",
                    isPreviewSession ? "text-brand-amber" : "text-brand-muted"
                  )}
                >
                  {isPreviewSession
                    ? `Audio preview sessions are capped at ${FREE_TRIAL_DURATION_MINUTES} minutes. Upgrade for full ${FULL_INTERVIEW_DURATION_MINUTES}-minute interviews.`
                    : `Each interview credit unlocks one full ${FULL_INTERVIEW_DURATION_MINUTES}-minute mock interview.`}
                </p>
              )}

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
                <div className="flex flex-col gap-3">
                  {isPracticeMode ? (
                    <Button
                      size="lg"
                      onClick={handleStartPractice}
                      disabled={
                        isCreating ||
                        (problemMode === "specific" && !selectedProblem) ||
                        (problemMode === "random" && practiceRandomMatches.length === 0)
                      }
                      className="w-full gap-2 text-base font-semibold"
                    >
                      Start Practicing
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  ) : isAiModeLocked ? (
                    <Button asChild size="lg" className="w-full gap-2 text-base font-semibold">
                      <Link href="/settings">
                        Unlock AI Interview
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleStartInterview}
                      disabled={isCreating || (problemMode === "specific" && !selectedProblem)}
                      className="w-full gap-2 text-base font-semibold"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Setting up your interview…
                        </>
                      ) : (
                        <>
                          {isPreviewSession ? "Start 5-Minute Audio Interview" : "Start AI Interview"}
                          <ChevronRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  )}
                  {isAiInterviewMode && (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => handleDsaExperienceChange("practice")}
                      className="w-full gap-2 text-sm font-medium"
                    >
                      <Code2 className="h-4 w-4" />
                      Practice this free instead
                    </Button>
                  )}
                  {problemMode === "specific" && !selectedProblem && (
                    <p className="text-center text-xs text-brand-amber">
                      Select a problem above to continue.
                    </p>
                  )}
                  {isPracticeMode && problemMode === "random" && practiceRandomMatches.length === 0 && !practiceRandomMatchesLoading ? (
                    <p className="text-center text-xs text-brand-amber">
                      Adjust your filters to find at least one free-practice problem.
                    </p>
                  ) : null}
                  <p className="text-center text-xs text-brand-muted">
                    {isPracticeMode
                      ? "Practice Mode saves your progress as you code so you can resume later."
                      : <>By starting, you agree to live microphone processing by our voice provider. TechInView stores transcripts, code, timing, scores, and results—not raw microphone audio. See our <Link href="/privacy" className="text-brand-cyan hover:underline">Privacy Policy</Link>.</>}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-brand-border bg-brand-card px-5 py-4 text-sm text-brand-muted">
                  Generate a targeted loop above, then launch any round directly from the loop cards. The generated rounds will use {activePersona.name} as the interviewer calibration by default.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
