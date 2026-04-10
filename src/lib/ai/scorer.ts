import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getScorerSystemPrompt, getScoringPrompt } from "./prompts";
import { SCORING_DIMENSIONS } from "@/lib/constants";
import type { InterviewerPersonaId } from "@/lib/interviewer-personas";
import type { InterviewResult } from "@/types";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1500;

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
  interviewerPersonaId?: InterviewerPersonaId;
  problem: {
    title: string;
    description: string;
    optimal_complexity: { time: string; space: string };
  };
};

export async function scoreInterview(
  params: ScoreInterviewParams
): Promise<InterviewResult> {
  const { messages, finalCode, testsPassed, testsTotal, problem, interviewerPersonaId } = params;

  const client = new Anthropic();

  // Strip timestamp from messages for the prompt (transcript-only)
  const transcript = messages.map(({ role, content }) => ({ role, content }));

  const userPrompt = getScoringPrompt({
    transcript,
    finalCode,
    testsPassed,
    testsTotal,
    interviewerPersonaId,
    problem,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: getScorerSystemPrompt(interviewerPersonaId),
    messages: [{ role: "user", content: userPrompt }],
  });

  // Extract text content from response
  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  // Parse JSON — strip any accidental markdown code fences
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `Scorer returned invalid JSON. Raw response: ${rawText.slice(0, 500)}`
    );
  }

  // Validate with Zod
  const validated = ScoringResponseSchema.parse(parsed);

  // Recalculate weighted overall score from dimension scores for accuracy
  const recalculatedScore = calculateWeightedScore(validated.dimensions);

  // Derive hire recommendation from the calculated score to ensure consistency
  const hireRecommendation = deriveHireRecommendation(recalculatedScore);

  // Shape into InterviewResult
  const result: InterviewResult = {
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

  return result;
}
