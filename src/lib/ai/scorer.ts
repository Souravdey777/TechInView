import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getLoopScoringPrompt, getScorerSystemPrompt, getScoringPrompt } from "./prompts";
import { ROUND_SCORING_DIMENSIONS, SCORING_DIMENSIONS, type InterviewMode, type RoundType } from "@/lib/constants";
import type { InterviewerPersonaId } from "@/lib/interviewer-personas";
import type { CompetencyReport, InterviewResult } from "@/types";
import type { RoundContextSnapshot } from "@/lib/loops/types";
import { resolveValueCompetencies } from "@/lib/interview-values";
import { INTERVIEW_MODEL } from "./models";

const MAX_TOKENS = 1500;
/**
 * Behaviour-led rounds emit the five dimensions *plus* a per-competency report
 * with evidence, gap and upgrade text for up to four competencies, STAR
 * coverage, a debrief note and rehearsal drills. Measured at ~3.3k output
 * tokens for two competencies, so this leaves real headroom for four: a
 * `max_tokens` stop truncates the JSON mid-string and loses the whole score.
 */
const COMPETENCY_MAX_TOKENS = 8000;

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const DimensionScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(1),
});

const ScoringResponseSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  dimensions: z.object({
    problem_solving: DimensionScoreSchema,
    code_quality: DimensionScoreSchema,
    communication: DimensionScoreSchema,
    technical_knowledge: DimensionScoreSchema,
    testing: DimensionScoreSchema,
  }),
  hire_recommendation: z.enum([
    "strong_hire",
    "hire",
    "lean_hire",
    "lean_no_hire",
    "no_hire",
  ]),
  key_strengths: z.array(z.string()).min(1).max(5),
  areas_to_improve: z.array(z.string()).min(1).max(5),
  summary: z.string().min(1),
});

type ScoringResponse = z.infer<typeof ScoringResponseSchema>;

const LoopScoringResponseSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  dimensions: z.object({
    problem_solving: DimensionScoreSchema,
    communication: DimensionScoreSchema,
    technical_depth: DimensionScoreSchema,
    execution: DimensionScoreSchema,
    judgment: DimensionScoreSchema,
  }),
  hire_recommendation: z.enum([
    "strong_hire",
    "hire",
    "lean_hire",
    "lean_no_hire",
    "no_hire",
  ]),
  key_strengths: z.array(z.string()).min(1).max(5),
  areas_to_improve: z.array(z.string()).min(1).max(5),
  summary: z.string().min(1),
});

type LoopScoringResponse = z.infer<typeof LoopScoringResponseSchema>;

const CompetencySignalSchema = z.object({
  competency_id: z.string().min(1),
  label: z.string().min(1),
  rating: z.enum(["strong", "solid", "mixed", "insufficient"]),
  score: z.number().int().min(0).max(100),
  evidence: z.string().min(1),
  gap: z.string().min(1),
  upgrade: z.string().min(1),
});

const StarCoverageSchema = z.object({
  situation: z.number().int().min(0).max(100),
  task: z.number().int().min(0).max(100),
  action: z.number().int().min(0).max(100),
  result: z.number().int().min(0).max(100),
  reflection: z.number().int().min(0).max(100),
});

/**
 * Behaviour-led rounds return the shared five dimensions plus a per-competency
 * evidence report graded against the round's value lens.
 */
const CompetencyRoundScoringResponseSchema = LoopScoringResponseSchema.extend({
  competency_report: z.object({
    competencies: z.array(CompetencySignalSchema).min(1).max(6),
    star_coverage: StarCoverageSchema,
    debrief_note: z.string().min(1),
    follow_up_drills: z.array(z.string()).min(1).max(5),
  }),
});

type CompetencyRoundScoringResponse = z.infer<
  typeof CompetencyRoundScoringResponseSchema
>;

/** Rounds that are graded against a value lens rather than a coding artifact. */
const COMPETENCY_ROUND_TYPES: readonly RoundType[] = ["behavioral", "hiring_manager"];

export function shouldScoreCompetencies(
  roundType: RoundType,
  roundContext?: RoundContextSnapshot | null
): boolean {
  return (
    COMPETENCY_ROUND_TYPES.includes(roundType) &&
    (roundContext?.valuesContext?.competencies?.length ?? 0) > 0
  );
}

/**
 * Aligns the model's competency entries with the competencies the candidate
 * actually selected. Unknown ids are dropped and un-graded competencies are
 * added back as `insufficient`, so the report always mirrors the setup choices
 * rather than whatever the model chose to talk about.
 */
function normalizeCompetencyReport(
  report: CompetencyRoundScoringResponse["competency_report"],
  roundContext?: RoundContextSnapshot | null
): CompetencyReport {
  const values = roundContext?.valuesContext ?? null;
  const selected = resolveValueCompetencies(
    values?.frameworkId,
    (values?.competencies ?? []).map((competency) => competency.id)
  );
  const byId = new Map(
    report.competencies.map((entry) => [entry.competency_id, entry] as const)
  );

  const competencies = selected.map((competency) => {
    const graded = byId.get(competency.id);

    if (!graded) {
      return {
        competency_id: competency.id,
        label: competency.label,
        rating: "insufficient" as const,
        score: 0,
        evidence: "This competency was not meaningfully probed during the round.",
        gap: `No specific example covering ${competency.label.toLowerCase()}.`,
        upgrade: `Prepare one story that demonstrates ${competency.label.toLowerCase()} with a concrete action and measurable outcome.`,
      };
    }

    return { ...graded, label: competency.label };
  });

  return {
    framework_id: values?.frameworkId ?? "generic",
    framework_label: values?.frameworkLabel ?? "Universal Competency Set",
    competencies,
    star_coverage: report.star_coverage,
    debrief_note: report.debrief_note,
    follow_up_drills: report.follow_up_drills,
    key_strengths: [],
    areas_to_improve: [],
  };
}

// ─── Score Calculation ────────────────────────────────────────────────────────

function calculateWeightedScore(dimensions: ScoringResponse["dimensions"]): number {
  const weighted =
    dimensions.problem_solving.score * SCORING_DIMENSIONS.problem_solving.weight +
    dimensions.code_quality.score * SCORING_DIMENSIONS.code_quality.weight +
    dimensions.communication.score * SCORING_DIMENSIONS.communication.weight +
    dimensions.technical_knowledge.score * SCORING_DIMENSIONS.technical_knowledge.weight +
    dimensions.testing.score * SCORING_DIMENSIONS.testing.weight;

  return Math.round(weighted);
}

function calculateLoopWeightedScore(dimensions: LoopScoringResponse["dimensions"]): number {
  const weighted =
    dimensions.problem_solving.score * ROUND_SCORING_DIMENSIONS.problem_solving.weight +
    dimensions.communication.score * ROUND_SCORING_DIMENSIONS.communication.weight +
    dimensions.technical_depth.score * ROUND_SCORING_DIMENSIONS.technical_depth.weight +
    dimensions.execution.score * ROUND_SCORING_DIMENSIONS.execution.weight +
    dimensions.judgment.score * ROUND_SCORING_DIMENSIONS.judgment.weight;

  return Math.round(weighted);
}

function deriveHireRecommendation(
  score: number
): InterviewResult["hire_recommendation"] {
  if (score >= 85) return "strong_hire";
  if (score >= 70) return "hire";
  if (score >= 55) return "lean_hire";
  if (score >= 40) return "lean_no_hire";
  return "no_hire";
}

// ─── Main Scorer ──────────────────────────────────────────────────────────────

type ScoreInterviewParams = {
  messages: { role: string; content: string; timestamp_ms: number }[];
  finalCode: string;
  testsPassed: number;
  testsTotal: number;
  mode?: InterviewMode;
  roundType?: RoundType;
  roundTitle?: string;
  interviewerPersonaId?: InterviewerPersonaId;
  problem?: {
    title: string;
    description: string;
    optimal_complexity: { time: string; space: string };
  } | null;
  roundContext?: RoundContextSnapshot | null;
};

export async function scoreInterview(
  params: ScoreInterviewParams
): Promise<InterviewResult> {
  const {
    messages,
    finalCode,
    testsPassed,
    testsTotal,
    mode = "general_dsa",
    roundType = "coding",
    roundTitle = "Interview Round",
    problem,
    interviewerPersonaId,
    roundContext,
  } = params;

  const client = new Anthropic();

  // Strip timestamp from messages for the prompt (transcript-only)
  const transcript = messages.map(({ role, content }) => ({ role, content }));
  const withCompetencies = shouldScoreCompetencies(roundType, roundContext);

  const userPrompt =
    mode === "targeted_loop"
      ? getLoopScoringPrompt({
          transcript,
          finalCode,
          testsPassed,
          testsTotal,
          interviewerPersonaId,
          roundType,
          roundTitle,
          problem,
          roundContext,
          includeCompetencyReport: withCompetencies,
        })
      : getScoringPrompt({
          transcript,
          finalCode,
          testsPassed,
          testsTotal,
          interviewerPersonaId,
          problem: {
            title: problem?.title ?? "Unknown Problem",
            description: problem?.description ?? "",
            optimal_complexity: problem?.optimal_complexity ?? { time: "Unknown", space: "Unknown" },
          },
        });

  const responseSchema =
    mode === "targeted_loop"
      ? withCompetencies
        ? CompetencyRoundScoringResponseSchema
        : LoopScoringResponseSchema
      : ScoringResponseSchema;

  async function requestScores(schema: z.ZodType, maxTokens: number, prompt: string) {
    const response = await client.messages.parse({
      model: INTERVIEW_MODEL,
      max_tokens: maxTokens,
      system: getScorerSystemPrompt(interviewerPersonaId),
      messages: [{ role: "user", content: prompt }],
      output_config: {
        format: zodOutputFormat(schema),
      },
    });

    if (!response.parsed_output) {
      throw new Error("Scorer returned no structured output");
    }

    return response;
  }

  let response;
  let competencyReportAvailable = withCompetencies;

  try {
    response = await requestScores(
      responseSchema,
      withCompetencies ? COMPETENCY_MAX_TOKENS : MAX_TOKENS,
      userPrompt
    );
  } catch (error) {
    // The competency report is the largest and most fragile part of the output.
    // If it fails to come back cleanly, fall back to plain round scoring rather
    // than leaving the candidate with no scores at all.
    if (!withCompetencies) throw error;

    console.error("Competency scoring failed, retrying without the report:", error);
    competencyReportAvailable = false;
    response = await requestScores(
      LoopScoringResponseSchema,
      MAX_TOKENS,
      getLoopScoringPrompt({
        transcript,
        finalCode,
        testsPassed,
        testsTotal,
        interviewerPersonaId,
        roundType,
        roundTitle,
        problem,
        roundContext,
        includeCompetencyReport: false,
      })
    );
  }

  if (mode === "targeted_loop") {
    const parsedCompetencyRound = competencyReportAvailable
      ? CompetencyRoundScoringResponseSchema.parse(response.parsed_output)
      : null;
    const validated: LoopScoringResponse =
      parsedCompetencyRound ?? LoopScoringResponseSchema.parse(response.parsed_output);
    const recalculatedScore = calculateLoopWeightedScore(validated.dimensions);
    const hireRecommendation = deriveHireRecommendation(recalculatedScore);
    const competencyReport = parsedCompetencyRound
      ? {
          ...normalizeCompetencyReport(
            parsedCompetencyRound.competency_report,
            roundContext
          ),
          key_strengths: validated.key_strengths,
          areas_to_improve: validated.areas_to_improve,
        }
      : null;

    return {
      overall_score: recalculatedScore,
      scores: {
        problem_solving: {
          dimension: "problem_solving",
          score: validated.dimensions.problem_solving.score,
          feedback: validated.dimensions.problem_solving.feedback,
        },
        communication: {
          dimension: "communication",
          score: validated.dimensions.communication.score,
          feedback: validated.dimensions.communication.feedback,
        },
        technical_depth: {
          dimension: "technical_depth",
          score: validated.dimensions.technical_depth.score,
          feedback: validated.dimensions.technical_depth.feedback,
        },
        execution: {
          dimension: "execution",
          score: validated.dimensions.execution.score,
          feedback: validated.dimensions.execution.feedback,
        },
        judgment: {
          dimension: "judgment",
          score: validated.dimensions.judgment.score,
          feedback: validated.dimensions.judgment.feedback,
        },
      },
      hire_recommendation: hireRecommendation,
      key_strengths: validated.key_strengths,
      areas_to_improve: validated.areas_to_improve,
      summary: validated.summary,
      competency_report: competencyReport,
    };
  }

  const validated = ScoringResponseSchema.parse(response.parsed_output);
  const recalculatedScore = calculateWeightedScore(validated.dimensions);
  const hireRecommendation = deriveHireRecommendation(recalculatedScore);

  return {
    overall_score: recalculatedScore,
    scores: {
      problem_solving: {
        dimension: "problem_solving",
        score: validated.dimensions.problem_solving.score,
        feedback: validated.dimensions.problem_solving.feedback,
      },
      code_quality: {
        dimension: "code_quality",
        score: validated.dimensions.code_quality.score,
        feedback: validated.dimensions.code_quality.feedback,
      },
      communication: {
        dimension: "communication",
        score: validated.dimensions.communication.score,
        feedback: validated.dimensions.communication.feedback,
      },
      technical_knowledge: {
        dimension: "technical_knowledge",
        score: validated.dimensions.technical_knowledge.score,
        feedback: validated.dimensions.technical_knowledge.feedback,
      },
      testing: {
        dimension: "testing",
        score: validated.dimensions.testing.score,
        feedback: validated.dimensions.testing.feedback,
      },
    },
    hire_recommendation: hireRecommendation,
    key_strengths: validated.key_strengths,
    areas_to_improve: validated.areas_to_improve,
    summary: validated.summary,
  };
}
