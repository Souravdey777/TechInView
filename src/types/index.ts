import type {
  SupportedLanguage,
  InterviewPhase,
  HireRecommendation,
  DifficultyLevel,
  ProblemCategory,
  ScoringDimension,
} from "@/lib/constants";

// ─── Profile ─────────────────────────────────────────────────────────────────

export type ExperienceLevel = "junior" | "mid" | "senior" | "staff";
export type UserPlan = "free" | "starter" | "pro";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  target_company: string | null;
  experience_level: ExperienceLevel | null;
  preferred_language: SupportedLanguage | null;
  plan: UserPlan;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  interviews_completed: number;
  created_at: string;
};

// ─── Problem ──────────────────────────────────────────────────────────────────

export type ProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

export type TestCase = {
  input: string;
  expected_output: string;
  is_hidden: boolean;
};

export type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  category: ProblemCategory;
  company_tags: string[];
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  starter_code: Record<SupportedLanguage, string>;
  test_cases: TestCase[];
  solution_approach: string;
  hints: string[];
  optimal_complexity: {
    time: string;
    space: string;
  };
  follow_up_questions: string[];
};

// ─── Code Execution ───────────────────────────────────────────────────────────

export type CodeExecutionResult = {
  stdout: string;
  stderr: string;
  exit_code: number;
  runtime_ms: number;
};

export type TestResult = {
  test_case: TestCase;
  actual_output: string;
  passed: boolean;
  runtime_ms: number;
};

// ─── Interview ────────────────────────────────────────────────────────────────

export type InterviewStatus = "in_progress" | "completed" | "abandoned";

export type Interview = {
  id: string;
  user_id: string;
  problem_id: string;
  status: InterviewStatus;
  language: SupportedLanguage;
  duration_seconds: number | null;
  max_duration_seconds: number;
  final_code: string | null;
  code_passed_tests: boolean | null;
  tests_passed: number | null;
  tests_total: number | null;
  overall_score: number | null;
  scores: Record<ScoringDimension, InterviewScore> | null;
  feedback_summary: string | null;
  hire_recommendation: HireRecommendation | null;
  started_at: string;
  completed_at: string | null;
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export type MessageRole = "interviewer" | "candidate" | "system";
export type MessageType = "hint" | "follow_up" | "code_review" | "intro" | "wrap_up";

export type Message = {
  id: string;
  interview_id: string;
  role: MessageRole;
  content: string;
  audio_url: string | null;
  timestamp_ms: number;
  metadata: {
    type?: MessageType;
  };
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

export type InterviewScore = {
  dimension: string;
  score: number;
  feedback: string;
};

export type InterviewResult = {
  overall_score: number;
  scores: Record<ScoringDimension, InterviewScore>;
  hire_recommendation: HireRecommendation;
  key_strengths: string[];
  areas_to_improve: string[];
  summary: string;
};

// ─── Voice ────────────────────────────────────────────────────────────────────

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";

// ─── Interview State Machine ──────────────────────────────────────────────────

export type InterviewPhaseState = {
  phase: InterviewPhase;
  started_at: number;
  hints_given: number;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
