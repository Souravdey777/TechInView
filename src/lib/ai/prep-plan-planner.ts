import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { REVIEWED_HISTORICAL_QUESTIONS } from "@/data/historical-questions";
import {
  PRACTICE_INTERVIEW_KINDS,
  type PracticeInterviewKind,
  type PrepPlanSummary,
  type PrepPlanTrack,
} from "@/lib/dashboard/models";
import { createPrepPlan } from "@/lib/dashboard/prep-plan-generator";
import { PREP_PLAN_FALLBACK_MODEL, PREP_PLAN_PRIMARY_MODEL } from "./models";

const MAX_TOKENS = 3000;
const PREP_PLAN_MODELS = [PREP_PLAN_PRIMARY_MODEL, PREP_PLAN_FALLBACK_MODEL] as const;

const PrepPlanGenerationInputSchema = z
  .object({
    prompt: z.string().trim().max(12000).optional().default(""),
    company: z.string().trim().max(80).optional().default(""),
    role: z.string().trim().max(120).optional().default(""),
    jdText: z.string().trim().max(12000).optional().default(""),
  })
  .superRefine((value, ctx) => {
    const hasPrompt = value.prompt.length >= 10;
    const hasTarget = value.company.length >= 2 && value.role.length >= 2;
    const hasJd = value.jdText.length >= 40;

    if (!hasPrompt && !hasTarget && !hasJd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paste a job description or enter a role and company.",
      });
    }
  });

const AiTrackSchema = z.object({
  kind: z.enum(PRACTICE_INTERVIEW_KINDS),
  title: z.string().trim().min(4).max(80),
  rationale: z.string().trim().min(20).max(220),
  priority: z.enum(["core", "supporting"]),
  nextActionLabel: z.string().trim().min(8).max(120),
  likelyQuestions: z.array(z.string().trim().min(12).max(240)).min(3).max(8),
});

const AiPrepPlanSchema = z.object({
  company: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(120),
  planSummary: z.string().trim().min(30).max(500),
  researchNote: z.string().trim().min(20).max(300),
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
Create a structured, company-shaped software interview prep plan for this candidate.

Company: ${input.company}
Role: ${input.role}
Candidate message: ${input.prompt || "Not provided"}
Job description:
${input.jdText || "Not provided. Infer the target from the candidate message."}

Available interview kinds:
- dsa
- machine_coding
- system_design
- technical_qa
- engineering_manager
- behavioral

Your job:
- Infer the likely interview loop from the company, role title, seniority signals, and job description.
- Select only the tracks that are realistically useful. Do not include a track just because it exists.
- Mark a track "core" only when it is likely to affect hiring outcome for this role. Mark it "supporting" when it is useful prep but probably not the main screen.
- Order tracks in the sequence the candidate should practice them, starting with the highest-leverage next step.
- Make the plan feel specific to this role, not a generic checklist.

Return JSON only in this exact shape:
{
  "company": "Uber",
  "role": "Senior Backend Engineer",
  "planSummary": "Uber usually screens this role with a coding screen, then focuses the onsite on coding, design, and collaboration signal.",
  "researchNote": "Built from the supplied JD, known public interview patterns, and the reviewed historical-question corpus available in TechInView.",
  "jdSignals": ["backend systems", "stakeholder communication"],
  "tracks": [
    {
      "title": "Business Phone Screen",
      "kind": "dsa",
      "rationale": "This company often uses an elimination coding screen before the core onsite loop.",
      "priority": "core",
      "nextActionLabel": "Run one medium coding screen focused on array and graph tradeoffs",
      "likelyQuestions": [
        "Solve a graph traversal problem and explain the tradeoffs in your chosen representation.",
        "Find the lowest-cost path under changing edge constraints and test the main edge cases.",
        "Optimize a working solution and explain the time and space complexity precisely."
      ]
    }
  ]
}

Rules:
- Do not force all six interview kinds. Include only the rounds that actually look relevant for this company, role, and JD.
- Infer company and role from the pasted JD or candidate message when they were not entered separately.
- Return 3-8 realistic likelyQuestions for every track. These are AI-inferred possibilities, not claims that the company asked them before.
- Use between 2 and 6 tracks total.
- Each interview kind can appear at most once.
- Prefer 3-4 tracks unless the JD clearly requires more.
- Include dsa for general SWE roles unless the JD is clearly non-coding or leadership-only.
- Include system_design mainly for senior/staff/platform/backend/distributed systems roles.
- Include machine_coding when the JD implies frontend/product engineering, API implementation, full-stack execution, or take-home style evaluation.
- Include technical_qa when the JD names specific frameworks, runtime/platform expertise, debugging, performance, or infrastructure ownership.
- Include engineering_manager when role fit, seniority, ownership, leadership, stakeholder alignment, or people influence is prominent.
- Include behavioral when collaboration, ownership, ambiguity, customer impact, or cross-functional work appears in the JD.
- Use track titles that match likely round naming, such as phone screen, technical deep dive, system design, collaboration, or hiring manager.
- Keep nextActionLabel concise, specific, and imperative.
- Use short jdSignals that summarize what drove the plan; avoid copying generic JD filler.
- planSummary should briefly explain the likely company mix, the chosen tracks, and the main risk area for the candidate.
- Rationale should name the exact JD/company signal that made the track relevant.
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

  const tracks = normalizedKinds.map((kind) => {
    const fallbackTrack = fallbackTrackMap.get(kind);
    const aiTrack = aiTrackMap.get(kind);

    return {
      kind,
      title: aiTrack?.title ?? fallbackTrack?.title,
      rationale: aiTrack?.rationale ?? fallbackTrack?.rationale,
      status: "not_started",
      priority: aiTrack?.priority ?? fallbackTrack?.priority ?? "supporting",
      nextActionLabel:
        aiTrack?.nextActionLabel ?? fallbackTrack?.nextActionLabel ?? "Start this prep track",
      likelyQuestions: aiTrack?.likelyQuestions ?? fallbackTrack?.likelyQuestions ?? [],
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
  const resolvedInput = {
    company: aiPlan.company,
    role: aiPlan.role,
    jdText: input.jdText || input.prompt,
  };
  const fallbackPlan = createPrepPlan(resolvedInput);
  const normalized = normalizeTracks(aiPlan, fallbackPlan);
  const jdSignals = normalizeSignals(aiPlan.jdSignals, fallbackPlan.jdSignals);
  const tracks = attachHistoricalQuestions({
    ...fallbackPlan,
    jdSignals,
    tracks: normalized.tracks,
  }).tracks;

  return {
    ...fallbackPlan,
    planSummary: aiPlan.planSummary,
    researchNote: aiPlan.researchNote,
    jdSignals,
    nextRecommendedKind: normalized.nextRecommendedKind,
    nextActionLabel: normalized.nextActionLabel,
    tracks,
  };
}

function attachHistoricalQuestions(plan: PrepPlanSummary): PrepPlanSummary {
  const trackRoundTypes = {
    dsa: "coding",
    machine_coding: null,
    system_design: "system_design",
    technical_qa: "technical_qa",
    engineering_manager: "hiring_manager",
    behavioral: "behavioral",
  } as const;
  const companySlug = plan.company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const knownCompany = ["google", "meta", "amazon", "apple", "netflix"].find((company) =>
    companySlug.includes(company)
  );
  const signalText = plan.jdSignals.join(" ").toLowerCase();
  const tracks = plan.tracks.map((track) => {
    const roundType = trackRoundTypes[track.kind];
    const questions = REVIEWED_HISTORICAL_QUESTIONS
      .filter((question) => roundType !== null && question.reviewStatus === "reviewed" && question.roundType === roundType)
      .map((question) => ({
        question,
        score:
          (question.company === knownCompany ? 100 : question.company === "generic" ? 20 : 0) +
          question.jdTags.filter((tag) => signalText.includes(tag.toLowerCase())).length * 5,
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || b.question.confidence - a.question.confidence)
      .slice(0, 3)
      .map(({ question }) => ({
        id: question.id,
        prompt: question.prompt,
        topics: question.topics,
        sourceLabel: question.sourceLabel,
        provenance: question.provenance,
        confidence: question.confidence,
      }));

    return { ...track, historicalQuestions: questions };
  });

  return { ...plan, tracks };
}

export async function generatePrepPlanSummary(
  rawInput: unknown
): Promise<PrepPlanSummary> {
  const input = PrepPlanGenerationInputSchema.parse(rawInput);

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Prep Guru AI is not configured. Please try again after the AI service is enabled.");
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  let lastError: unknown;

  for (const model of PREP_PLAN_MODELS) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system:
          "You are a senior technical recruiter and interview coach. Generate realistic, company-shaped interview prep plans from job descriptions. Return valid JSON only, with no markdown fences or commentary.",
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
      lastError = error;
      console.warn(`Prep plan generation failed with ${model}; trying fallback if available.`, error);
    }
  }

  console.error("All AI prep plan models failed; refusing to create an unreliable plan:", lastError);
  throw new Error("Prep Guru could not complete reliable AI research for this target. Please try again.");
}
