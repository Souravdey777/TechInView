import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  PRACTICE_INTERVIEW_KINDS,
  type PracticeInterviewKind,
  type PrepPlanSummary,
  type PrepPlanTrack,
} from "@/lib/dashboard/models";
import { createPrepPlan } from "@/lib/dashboard/prep-plan-generator";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1400;

const PrepPlanGenerationInputSchema = z.object({
  company: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(120),
  jdText: z.string().trim().min(40).max(12000),
});

const AiTrackSchema = z.object({
  kind: z.enum(PRACTICE_INTERVIEW_KINDS),
  title: z.string().trim().min(4).max(80),
  rationale: z.string().trim().min(20).max(220),
  priority: z.enum(["core", "supporting"]),
  questionCount: z.number().int().min(4).max(30),
  nextActionLabel: z.string().trim().min(8).max(120),
});

const AiPrepPlanSchema = z.object({
  planSummary: z.string().trim().min(30).max(500),
  jdSignals: z.array(z.string().trim().min(2).max(40)).max(8).default([]),
  tracks: z.array(AiTrackSchema).min(2).max(PRACTICE_INTERVIEW_KINDS.length),
}).superRefine((value, ctx) => {
  const seen = new Set<PracticeInterviewKind>();

  value.tracks.forEach((track, index) => {
    if (seen.has(track.kind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tracks", index, "kind"],
        message: "Each interview kind can appear at most once in the prep plan",
      });
      return;
    }

    seen.add(track.kind);
  });
});

export type PrepPlanGenerationInput = z.infer<typeof PrepPlanGenerationInputSchema>;

type AiPrepPlan = z.infer<typeof AiPrepPlanSchema>;

function sanitizeJsonResponse(rawText: string) {
  return rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function dedupeKinds(kinds: PracticeInterviewKind[]) {
  const seen = new Set<PracticeInterviewKind>();
  const ordered: PracticeInterviewKind[] = [];

  for (const kind of kinds) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    ordered.push(kind);
  }

  return ordered;
}

function normalizeSignals(signals: string[], fallbackSignals: string[]) {
  const unique = Array.from(
    new Set(
      signals
        .map((signal) => signal.trim())
        .filter(Boolean)
        .slice(0, 8)
    )
  );

  return unique.length > 0 ? unique : fallbackSignals;
}

function buildPrompt(input: PrepPlanGenerationInput) {
  return `
Create a structured software-interview prep plan for this candidate.

Company: ${input.company}
Role: ${input.role}
Job description:
${input.jdText}

The plan must cover exactly these six interview kinds:
- dsa
- machine_coding
- system_design
- technical_qa
- engineering_manager
- behavioral

Use your best judgment about the likely hiring pattern for this company and role. Use the job description to decide which tracks are core vs supporting, the order the user should practice them, and the rough volume of likely questions to prepare for.

Return JSON only in this exact shape:
{
  "planSummary": "Uber usually screens this role with a coding screen, then focuses the onsite on coding, design, and collaboration signal.",
  "jdSignals": ["backend systems", "stakeholder communication"],
  "tracks": [
    {
      "title": "Business Phone Screen",
      "kind": "dsa",
      "rationale": "This company often uses an elimination coding screen before the core onsite loop.",
      "priority": "core",
      "questionCount": 12,
      "nextActionLabel": "Run one medium coding screen focused on array and graph tradeoffs"
    }
  ]
}

Rules:
- Do not force all six interview kinds. Include only the rounds that actually look relevant for this company, role, and JD.
- Use between 2 and 6 tracks total.
- Each interview kind can appear at most once.
- The plan should feel like a company-shaped prep sequence, not a generic product checklist.
- Use track titles that match likely round naming, such as phone screen, technical deep dive, system design, collaboration, or hiring manager.
- Make questionCount realistic for prep planning, between 4 and 30.
- Keep nextActionLabel concise, specific, and imperative.
- Use short jdSignals that summarize what drove the plan.
- planSummary should briefly explain the likely company mix and why these rounds were chosen.
- Do not include markdown, prose, or explanations outside the JSON object.
  `.trim();
}

function getTextFromResponse(response: {
  content: Array<
    | { type: "text"; text: string }
    | { type: string; text?: string }
  >;
}) {
  return response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function normalizeTracks(
  aiPlan: AiPrepPlan,
  fallbackPlan: PrepPlanSummary
): {
  nextRecommendedKind: PracticeInterviewKind;
  nextActionLabel: string;
  tracks: PrepPlanTrack[];
} {
  const fallbackTrackMap = new Map(
    fallbackPlan.tracks.map((track) => [track.kind, track] as const)
  );
  const aiTrackMap = new Map(aiPlan.tracks.map((track) => [track.kind, track] as const));
  const normalizedKinds = dedupeKinds(aiPlan.tracks.map((track) => track.kind));

  const tracks = normalizedKinds.map((kind, index) => {
    const fallbackTrack = fallbackTrackMap.get(kind);
    const aiTrack = aiTrackMap.get(kind);

    return {
      kind,
      title: aiTrack?.title ?? fallbackTrack?.title,
      rationale: aiTrack?.rationale ?? fallbackTrack?.rationale,
      status: index === 0 ? "in_progress" : "not_started",
      progressPercent: index === 0 ? 15 : 0,
      priority: aiTrack?.priority ?? fallbackTrack?.priority ?? "supporting",
      questionCount: aiTrack?.questionCount ?? fallbackTrack?.questionCount ?? 6,
      nextActionLabel:
        aiTrack?.nextActionLabel ?? fallbackTrack?.nextActionLabel ?? "Start this prep track",
    } satisfies PrepPlanTrack;
  });

  return {
    nextRecommendedKind: tracks[0]?.kind ?? fallbackPlan.nextRecommendedKind,
    nextActionLabel: tracks[0]?.nextActionLabel ?? fallbackPlan.nextActionLabel,
    tracks,
  };
}

function mergeAiPlanIntoSummary(
  input: PrepPlanGenerationInput,
  aiPlan: AiPrepPlan
): PrepPlanSummary {
  const fallbackPlan = createPrepPlan(input);
  const normalized = normalizeTracks(aiPlan, fallbackPlan);

  return {
    ...fallbackPlan,
    planSummary: aiPlan.planSummary,
    jdSignals: normalizeSignals(aiPlan.jdSignals, fallbackPlan.jdSignals),
    nextRecommendedKind: normalized.nextRecommendedKind,
    nextActionLabel: normalized.nextActionLabel,
    tracks: normalized.tracks,
  };
}

export async function generatePrepPlanSummary(
  rawInput: unknown
): Promise<PrepPlanSummary> {
  const input = PrepPlanGenerationInputSchema.parse(rawInput);

  if (!process.env.ANTHROPIC_API_KEY) {
    return createPrepPlan(input);
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You generate structured interview prep plans. Return valid JSON only, with no markdown fences or commentary.",
      messages: [
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
    });

    const jsonText = sanitizeJsonResponse(getTextFromResponse(response));
    const parsed = JSON.parse(jsonText) as unknown;
    const validated = AiPrepPlanSchema.parse(parsed);

    return mergeAiPlanIntoSummary(input, validated);
  } catch (error) {
    console.error("Prep plan generation failed, falling back to heuristic plan:", error);
    return createPrepPlan(input);
  }
}
