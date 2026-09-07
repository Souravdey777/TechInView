import type {
  DifficultyLevel,
  InterviewMode,
  RoundScoreDimension,
  RoundType,
  SupportedLanguage,
} from "@/lib/constants";
import type { InterviewerPersonaId } from "@/lib/interviewer-personas";
import type { RoundValuesContext } from "@/lib/interview-values";
import type { ExperienceLevel } from "@/types";

export type HistoricalQuestionReviewStatus = "reviewed" | "staged";
export type LoopConfidence = "high" | "medium";

export type HistoricalQuestion = {
  id: string;
  company: string;
  roundType: RoundType;
  roleFamily: "swe_ic";
  levelBand: ExperienceLevel;
  topics: string[];
  jdTags: string[];
  prompt: string;
  sourceLabel: string;
  provenance: string;
  confidence: number;
  reviewStatus: HistoricalQuestionReviewStatus;
};

export type WorkspaceSection = {
  id: string;
  label: string;
  placeholder: string;
};

export type GeneratedLoopRound = {
  id: string;
  order: number;
  roundType: RoundType;
  title: string;
  summary: string;
  rationale: string;
  confidence: LoopConfidence;
  estimatedMinutes: number;
  difficulty: DifficultyLevel | null;
  focusAreas: string[];
  prompt: string;
  historicalQuestions: HistoricalQuestion[];
  workspaceSections: WorkspaceSection[];
};

export type LoopSummaryRound = Pick<GeneratedLoopRound, "id" | "order" | "roundType" | "title">;

export type GeneratedLoop = {
  id: string;
  mode: InterviewMode;
  loopName: string;
  company: string;
  roleTitle: string;
  experienceLevel: ExperienceLevel;
  jdText: string;
  jdSignals: string[];
  summary: string;
  confidence: LoopConfidence;
  personaId: InterviewerPersonaId;
  similarCompanyFallback: boolean;
  rounds: GeneratedLoopRound[];
  createdAt: string;
};

export type RoundRubric = {
  roundType: RoundType;
  dimensions: Record<
    RoundScoreDimension,
    {
      weight: number;
      description: string;
    }
  >;
};

export type LoopGenerationInput = {
  company: string;
  roleTitle: string;
  experienceLevel: ExperienceLevel;
  jdText: string;
};

export type StartRoundPayload = {
  mode: InterviewMode;
  roundType: RoundType;
  language: SupportedLanguage;
  difficulty?: DifficultyLevel;
  category?: string | null;
  generatedLoopId?: string | null;
  generatedLoopRoundId?: string | null;
  generatedLoopSummary?: LoopSummarySnapshot | null;
  generatedLoopRoundSnapshot?: RoundContextSnapshot | null;
  interviewerPersona?: string;
};

export type LoopSummarySnapshot = {
  id: string;
  loopName: string;
  company: string;
  roleTitle: string;
  experienceLevel: ExperienceLevel;
  rounds: LoopSummaryRound[];
  jdSignals: string[];
};

export type RoundContextSnapshot = {
  id: string;
  roundType: RoundType;
  title: string;
  summary: string;
  rationale: string;
  confidence: LoopConfidence;
  estimatedMinutes: number;
  difficulty: DifficultyLevel | null;
  focusAreas: string[];
  prompt: string;
  historicalQuestions: HistoricalQuestion[];
  workspaceSections: WorkspaceSection[];
  /**
   * Value lens the round is run and graded against. Present on behaviour-led
   * rounds (behavioural, engineering manager); absent on coding, technical Q&A,
   * and older stored snapshots, so every consumer must treat it as optional.
   */
  valuesContext?: RoundValuesContext | null;
};
