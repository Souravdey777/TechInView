import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq, and, ilike, inArray, sql, desc, asc } from "drizzle-orm";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { InterviewerPersonaId } from "@/lib/interviewer-personas";
import { DEFAULT_INTERVIEWER_PERSONA } from "@/lib/interviewer-personas";
import type {
  GeneratedLoop as GeneratedLoopSnapshot,
  HistoricalQuestion as HistoricalQuestionSnapshot,
  LoopSummarySnapshot,
  RoundContextSnapshot,
} from "@/lib/loops/types";
import type { InterviewMode, RoundType } from "@/lib/constants";

import type { Profile, Problem, Interview, Message, Progress, Payment, InterviewFeedback } from "./schema";

// ─── DB Connection (lazy, serverless-safe) ───────────────────────────────────

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!, {
      prepare: false,
      idle_timeout: 20,
      max: 1,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

function isMissingInterviewerPersonaColumnError(error: unknown): boolean {
  const err = error as { code?: string; message?: string; detail?: string };
  const haystack = `${err?.message ?? ""} ${err?.detail ?? ""}`.toLowerCase();
  return err?.code === "42703" && haystack.includes("interviewer_persona");
}

function isMissingSchemaObjectError(error: unknown, token: string): boolean {
  const err = error as { code?: string; message?: string; detail?: string };
  const haystack = `${err?.message ?? ""} ${err?.detail ?? ""}`.toLowerCase();
  return (
    (err?.code === "42703" || err?.code === "42P01" || err?.code === "42704") &&
    haystack.includes(token.toLowerCase())
  );
}

function withDefaultInterviewerPersona<T extends Record<string, unknown>>(row: T): Interview {
  return {
    ...row,
    interviewer_persona: DEFAULT_INTERVIEWER_PERSONA,
    mode: "general_dsa",
    round_type: "coding",
    round_title: null,
    generated_loop_id: null,
    generated_loop_round_id: null,
    company_snapshot: null,
    role_title_snapshot: null,
    loop_summary_snapshot: null,
    round_context_snapshot: null,
  } as unknown as Interview;
}

function stripRoundAwareInterviewFields(
  data: Partial<Omit<Interview, "id" | "user_id" | "problem_id" | "started_at">>
) {
  const {
    interviewer_persona: _persona,
    mode: _mode,
    round_type: _roundType,
    round_title: _roundTitle,
    generated_loop_id: _generatedLoopId,
    generated_loop_round_id: _generatedLoopRoundId,
    company_snapshot: _companySnapshot,
    role_title_snapshot: _roleTitleSnapshot,
    loop_summary_snapshot: _loopSummarySnapshot,
    round_context_snapshot: _roundContextSnapshot,
    ...legacyData
  } = data;

  return legacyData;
}

// ─── Profile Queries ──────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | undefined> {
  const db = getDb();
  try {
    const results = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId))
      .limit(1);
    return results[0];
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    const detail = [
      err?.message ?? String(error),
      err?.code ? `code=${err.code}` : null,
      err?.detail ? `detail=${err.detail}` : null,
      err?.hint ? `hint=${err.hint}` : null,
    ].filter(Boolean).join(" | ");
    throw new Error(`getProfile failed for user ${userId}: ${detail}`);
  }
}

export async function updateProfile(
  userId: string,
  data: Partial<Omit<Profile, "id" | "created_at">>
): Promise<Profile | undefined> {
  const db = getDb();
  const results = await db
    .update(schema.profiles)
    .set(data)
    .where(eq(schema.profiles.id, userId))
    .returning();
  return results[0];
}

// ─── Problem Queries ──────────────────────────────────────────────────────────

export type ProblemFilters = {
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
  search?: string;
};

async function _getProblems(
  filters?: ProblemFilters
): Promise<Problem[]> {
  const db = getDb();

  const conditions = [];

  if (filters?.difficulty) {
    conditions.push(eq(schema.problems.difficulty, filters.difficulty));
  }

  if (filters?.category) {
    conditions.push(eq(schema.problems.category, filters.category));
  }

  if (filters?.search) {
    conditions.push(ilike(schema.problems.title, `%${filters.search}%`));
  }

  const query = db
    .select()
    .from(schema.problems)
    .orderBy(asc(schema.problems.title));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

/** Cached across requests for 1 hour; deduped within a single request via React cache. */
export const getProblems = cache(
  (filters?: ProblemFilters) =>
    unstable_cache(
      () => _getProblems(filters),
      ["problems", JSON.stringify(filters ?? {})],
      { revalidate: 3600 }
    )()
);

async function _getProblemBySlug(
  slug: string
): Promise<Problem | undefined> {
  const db = getDb();
  const results = await db
    .select()
    .from(schema.problems)
    .where(eq(schema.problems.slug, slug))
    .limit(1);
  return results[0];
}

/** Cached across requests for 1 hour; deduped within a single request via React cache. */
export const getProblemBySlug = cache(
  (slug: string) =>
    unstable_cache(
      () => _getProblemBySlug(slug),
      ["problem-by-slug", slug],
      { revalidate: 3600 }
    )()
);

export async function getRandomProblem(
  difficulty?: "easy" | "medium" | "hard",
  category?: string
): Promise<Problem | undefined> {
  const db = getDb();

  const conditions = [];

  if (difficulty) {
    conditions.push(eq(schema.problems.difficulty, difficulty));
  }

  if (category) {
    conditions.push(eq(schema.problems.category, category));
  }

  const query = db
    .select()
    .from(schema.problems)
    .orderBy(sql`random()`)
    .limit(1);

  if (conditions.length > 0) {
    return (await query.where(and(...conditions)))[0];
  }

  return (await query)[0];
}

export async function getRandomProblemForCompany(options: {
  company?: string | null;
  difficulty?: "easy" | "medium" | "hard";
  categories?: string[];
}): Promise<Problem | undefined> {
  const db = getDb();
  const baseConditions = [];

  if (options.difficulty) {
    baseConditions.push(eq(schema.problems.difficulty, options.difficulty));
  }

  if (options.categories && options.categories.length > 0) {
    baseConditions.push(inArray(schema.problems.category, options.categories));
  }

  const query = db
    .select()
    .from(schema.problems)
    .orderBy(sql`random()`)
    .limit(1);

  if (options.company) {
    const companyMatch = sql`${schema.problems.company_tags} @> ARRAY[${options.company}]::text[]`;
    const companyResult = baseConditions.length > 0
      ? await query.where(and(...baseConditions, companyMatch))
      : await query.where(companyMatch);

    if (companyResult[0]) return companyResult[0];
  }

  if (baseConditions.length > 0) {
    return (await query.where(and(...baseConditions)))[0];
  }

  return (await query)[0];
}

export async function getRelatedProblems(
  categories: string[],
  limit = 4
): Promise<Problem[]> {
  if (categories.length === 0) return [];
  const db = getDb();
  return db
    .select()
    .from(schema.problems)
    .where(inArray(schema.problems.category, categories))
    .orderBy(sql`random()`)
    .limit(limit);
}

// ─── Interview Queries ────────────────────────────────────────────────────────

export async function createInterview(params: {
  userId: string;
  problemId: string | null;
  interviewerPersona: InterviewerPersonaId;
  language: string;
  maxDuration?: number;
  isFreeTrial?: boolean;
  mode?: InterviewMode;
  roundType?: RoundType;
  roundTitle?: string | null;
  generatedLoopId?: string | null;
  generatedLoopRoundId?: string | null;
  companySnapshot?: string | null;
  roleTitleSnapshot?: string | null;
  loopSummarySnapshot?: LoopSummarySnapshot | null;
  roundContextSnapshot?: RoundContextSnapshot | null;
}): Promise<Interview> {
  const db = getDb();
  const {
    userId,
    problemId,
    interviewerPersona,
    language,
    maxDuration = 2700,
    isFreeTrial = false,
    mode = "general_dsa",
    roundType = "coding",
    roundTitle = null,
    generatedLoopId = null,
    generatedLoopRoundId = null,
    companySnapshot = null,
    roleTitleSnapshot = null,
    loopSummarySnapshot = null,
    roundContextSnapshot = null,
  } = params;

  try {
    const results = await db
      .insert(schema.interviews)
      .values({
        user_id: userId,
        problem_id: problemId,
        interviewer_persona: interviewerPersona,
        mode,
        round_type: roundType,
        round_title: roundTitle,
        generated_loop_id: generatedLoopId,
        generated_loop_round_id: generatedLoopRoundId,
        company_snapshot: companySnapshot,
        role_title_snapshot: roleTitleSnapshot,
        loop_summary_snapshot: loopSummarySnapshot ?? null,
        round_context_snapshot: roundContextSnapshot ?? null,
        language,
        max_duration_seconds: maxDuration,
        is_free_trial: isFreeTrial,
        status: "in_progress",
      })
      .returning();
    return results[0];
  } catch (error) {
    if (
      !isMissingInterviewerPersonaColumnError(error) &&
      !isMissingSchemaObjectError(error, "mode") &&
      !isMissingSchemaObjectError(error, "round_type") &&
      !isMissingSchemaObjectError(error, "round_title")
    ) {
      throw error;
    }

    const results = await db
      .insert(schema.interviews)
      .values({
        user_id: userId,
        problem_id: problemId,
        language,
        max_duration_seconds: maxDuration,
        is_free_trial: isFreeTrial,
        status: "in_progress",
      })
      .returning({
        id: schema.interviews.id,
        user_id: schema.interviews.user_id,
        problem_id: schema.interviews.problem_id,
        status: schema.interviews.status,
        language: schema.interviews.language,
        duration_seconds: schema.interviews.duration_seconds,
        max_duration_seconds: schema.interviews.max_duration_seconds,
        final_code: schema.interviews.final_code,
        code_passed_tests: schema.interviews.code_passed_tests,
        tests_passed: schema.interviews.tests_passed,
        tests_total: schema.interviews.tests_total,
        overall_score: schema.interviews.overall_score,
        scores: schema.interviews.scores,
        feedback_summary: schema.interviews.feedback_summary,
        hire_recommendation: schema.interviews.hire_recommendation,
        is_free_trial: schema.interviews.is_free_trial,
        started_at: schema.interviews.started_at,
        completed_at: schema.interviews.completed_at,
      });

    return withDefaultInterviewerPersona(results[0]);
  }
}

export async function getInterview(
  interviewId: string
): Promise<Interview | undefined> {
  const db = getDb();
  try {
    const results = await db
      .select()
      .from(schema.interviews)
      .where(eq(schema.interviews.id, interviewId))
      .limit(1);
    return results[0];
  } catch (error) {
    if (!isMissingInterviewerPersonaColumnError(error)) {
      throw error;
    }

    const results = await db
      .select({
        id: schema.interviews.id,
        user_id: schema.interviews.user_id,
        problem_id: schema.interviews.problem_id,
        status: schema.interviews.status,
        language: schema.interviews.language,
        duration_seconds: schema.interviews.duration_seconds,
        max_duration_seconds: schema.interviews.max_duration_seconds,
        final_code: schema.interviews.final_code,
        code_passed_tests: schema.interviews.code_passed_tests,
        tests_passed: schema.interviews.tests_passed,
        tests_total: schema.interviews.tests_total,
        overall_score: schema.interviews.overall_score,
        scores: schema.interviews.scores,
        feedback_summary: schema.interviews.feedback_summary,
        hire_recommendation: schema.interviews.hire_recommendation,
        is_free_trial: schema.interviews.is_free_trial,
        started_at: schema.interviews.started_at,
        completed_at: schema.interviews.completed_at,
      })
      .from(schema.interviews)
      .where(eq(schema.interviews.id, interviewId))
      .limit(1);

    return results[0] ? withDefaultInterviewerPersona(results[0]) : undefined;
  }
}

export async function updateInterview(
  interviewId: string,
  data: Partial<Omit<Interview, "id" | "user_id" | "problem_id" | "started_at">>
): Promise<Interview | undefined> {
  const db = getDb();
  try {
    const results = await db
      .update(schema.interviews)
      .set(data)
      .where(eq(schema.interviews.id, interviewId))
      .returning();
    return results[0];
  } catch (error) {
    if (
      !isMissingInterviewerPersonaColumnError(error) &&
      !isMissingSchemaObjectError(error, "mode") &&
      !isMissingSchemaObjectError(error, "round_type") &&
      !isMissingSchemaObjectError(error, "round_title")
    ) {
      throw error;
    }

    const legacyData = stripRoundAwareInterviewFields(data);
    const results = await db
      .update(schema.interviews)
      .set(legacyData)
      .where(eq(schema.interviews.id, interviewId))
      .returning({
        id: schema.interviews.id,
        user_id: schema.interviews.user_id,
        problem_id: schema.interviews.problem_id,
        status: schema.interviews.status,
        language: schema.interviews.language,
        duration_seconds: schema.interviews.duration_seconds,
        max_duration_seconds: schema.interviews.max_duration_seconds,
        final_code: schema.interviews.final_code,
        code_passed_tests: schema.interviews.code_passed_tests,
        tests_passed: schema.interviews.tests_passed,
        tests_total: schema.interviews.tests_total,
        overall_score: schema.interviews.overall_score,
        scores: schema.interviews.scores,
        feedback_summary: schema.interviews.feedback_summary,
        hire_recommendation: schema.interviews.hire_recommendation,
        is_free_trial: schema.interviews.is_free_trial,
        started_at: schema.interviews.started_at,
        completed_at: schema.interviews.completed_at,
      });

    return results[0] ? withDefaultInterviewerPersona(results[0]) : undefined;
  }
}

export async function getUserInterviews(
  userId: string,
  limit = 20
): Promise<Interview[]> {
  const db = getDb();
  try {
    return db
      .select()
      .from(schema.interviews)
      .where(eq(schema.interviews.user_id, userId))
      .orderBy(desc(schema.interviews.started_at))
      .limit(limit);
  } catch (error) {
    if (!isMissingInterviewerPersonaColumnError(error)) {
      throw error;
    }

    const rows = await db
      .select({
        id: schema.interviews.id,
        user_id: schema.interviews.user_id,
        problem_id: schema.interviews.problem_id,
        status: schema.interviews.status,
        language: schema.interviews.language,
        duration_seconds: schema.interviews.duration_seconds,
        max_duration_seconds: schema.interviews.max_duration_seconds,
        final_code: schema.interviews.final_code,
        code_passed_tests: schema.interviews.code_passed_tests,
        tests_passed: schema.interviews.tests_passed,
        tests_total: schema.interviews.tests_total,
        overall_score: schema.interviews.overall_score,
        scores: schema.interviews.scores,
        feedback_summary: schema.interviews.feedback_summary,
        hire_recommendation: schema.interviews.hire_recommendation,
        is_free_trial: schema.interviews.is_free_trial,
        started_at: schema.interviews.started_at,
        completed_at: schema.interviews.completed_at,
      })
      .from(schema.interviews)
      .where(eq(schema.interviews.user_id, userId))
      .orderBy(desc(schema.interviews.started_at))
      .limit(limit);

    return rows.map((row) => withDefaultInterviewerPersona(row));
  }
}

// ─── Message Queries ──────────────────────────────────────────────────────────

export async function addMessage(
  interviewId: string,
  role: "interviewer" | "candidate" | "system",
  content: string,
  timestampMs: number,
  metadata?: Record<string, unknown>
): Promise<Message> {
  const db = getDb();
  const results = await db
    .insert(schema.messages)
    .values({
      interview_id: interviewId,
      role,
      content,
      timestamp_ms: timestampMs,
      metadata: metadata ?? null,
    })
    .returning();
  return results[0];
}

export async function getInterviewMessages(
  interviewId: string
): Promise<Message[]> {
  const db = getDb();
  return db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.interview_id, interviewId))
    .orderBy(asc(schema.messages.timestamp_ms));
}

// ─── Progress Queries ─────────────────────────────────────────────────────────

export async function updateProgress(
  userId: string,
  category: string,
  score: number
): Promise<Progress> {
  const db = getDb();

  // Upsert: if row exists, increment counters and recalculate avg_score
  const results = await db
    .insert(schema.progress)
    .values({
      user_id: userId,
      category,
      problems_attempted: 1,
      problems_solved: score >= 55 ? 1 : 0,
      avg_score: score,
    })
    .onConflictDoUpdate({
      target: [schema.progress.user_id, schema.progress.category],
      set: {
        problems_attempted: sql`${schema.progress.problems_attempted} + 1`,
        problems_solved: sql`${schema.progress.problems_solved} + ${score >= 55 ? 1 : 0}`,
        avg_score: sql`(
          ${schema.progress.avg_score} * ${schema.progress.problems_attempted} + ${score}
        ) / (${schema.progress.problems_attempted} + 1)`,
      },
    })
    .returning();

  return results[0];
}

export async function getUserProgress(userId: string): Promise<Progress[]> {
  const db = getDb();
  return db
    .select()
    .from(schema.progress)
    .where(eq(schema.progress.user_id, userId))
    .orderBy(asc(schema.progress.category));
}

// ─── Payment Queries ─────────────────────────────────────────────────────────

export async function getPaymentByRazorpayId(
  razorpayPaymentId: string
): Promise<Payment | undefined> {
  const db = getDb();
  const results = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.razorpay_payment_id, razorpayPaymentId))
    .limit(1);
  return results[0];
}

export async function insertPayment(data: {
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  pack: string;
  credits: number;
  amount: number;
  currency: string;
  status?: string;
}): Promise<Payment> {
  const db = getDb();
  const results = await db
    .insert(schema.payments)
    .values(data)
    .returning();
  return results[0];
}

export async function incrementCredits(
  userId: string,
  amount: number
): Promise<Profile | undefined> {
  const db = getDb();
  const results = await db
    .update(schema.profiles)
    .set({
      interview_credits: sql`${schema.profiles.interview_credits} + ${amount}`,
    })
    .where(eq(schema.profiles.id, userId))
    .returning();
  return results[0];
}

export async function decrementCredits(
  userId: string
): Promise<Profile | undefined> {
  const db = getDb();
  const results = await db
    .update(schema.profiles)
    .set({
      interview_credits: sql`GREATEST(${schema.profiles.interview_credits} - 1, 0)`,
    })
    .where(
      and(
        eq(schema.profiles.id, userId),
        sql`${schema.profiles.interview_credits} > 0`
      )
    )
    .returning();
  return results[0];
}

// ─── Interview Feedback Queries ──────────────────────────────────────────────

export async function insertInterviewFeedback(data: {
  interview_id: string;
  user_id: string;
  rating: number;
  ratings?: Record<string, number>;
  went_well?: string;
  to_improve?: string;
}): Promise<InterviewFeedback> {
  const db = getDb();
  const results = await db
    .insert(schema.interviewFeedback)
    .values(data)
    .onConflictDoUpdate({
      target: schema.interviewFeedback.interview_id,
      set: {
        rating: data.rating,
        ratings: data.ratings ?? null,
        went_well: data.went_well ?? null,
        to_improve: data.to_improve ?? null,
      },
    })
    .returning();
  return results[0];
}

export async function createGeneratedLoop(params: {
  userId?: string | null;
  loop: GeneratedLoopSnapshot;
}): Promise<{ id: string; rounds: { id: string; order: number }[] } | null> {
  const db = getDb();

  try {
    const loopResults = await db
      .insert(schema.generatedLoops)
      .values({
        user_id: params.userId ?? null,
        mode: params.loop.mode,
        company: params.loop.company,
        role_title: params.loop.roleTitle,
        experience_level: params.loop.experienceLevel,
        jd_snapshot: params.loop.jdText,
        jd_signals: params.loop.jdSignals,
        loop_name: params.loop.loopName,
        summary: params.loop.summary,
        confidence: params.loop.confidence,
        persona_id: params.loop.personaId,
        similar_company_fallback: params.loop.similarCompanyFallback,
      })
      .returning({
        id: schema.generatedLoops.id,
      });

    const generatedLoopId = loopResults[0]?.id;
    if (!generatedLoopId) return null;

    const roundResults = await db
      .insert(schema.generatedLoopRounds)
      .values(
        params.loop.rounds.map((round) => ({
          generated_loop_id: generatedLoopId,
          round_order: round.order,
          round_type: round.roundType,
          title: round.title,
          summary: round.summary,
          rationale: round.rationale,
          confidence: round.confidence,
          estimated_minutes: round.estimatedMinutes,
          difficulty: round.difficulty,
          focus_areas: round.focusAreas,
          prompt: round.prompt,
          historical_question_ids: round.historicalQuestions.map((question) => question.id),
          workspace_sections: round.workspaceSections,
        }))
      )
      .returning({
        id: schema.generatedLoopRounds.id,
        round_order: schema.generatedLoopRounds.round_order,
      });

    return {
      id: generatedLoopId,
      rounds: roundResults.map((round) => ({
        id: round.id,
        order: round.round_order,
      })),
    };
  } catch (error) {
    if (
      isMissingSchemaObjectError(error, "generated_loops") ||
      isMissingSchemaObjectError(error, "generated_loop_rounds")
    ) {
      return null;
    }

    throw error;
  }
}

export async function getGeneratedLoopById(loopId: string): Promise<{
  loop: schema.GeneratedLoop;
  rounds: schema.GeneratedLoopRound[];
} | null> {
  const db = getDb();

  try {
    const loop = await db
      .select()
      .from(schema.generatedLoops)
      .where(eq(schema.generatedLoops.id, loopId))
      .limit(1);

    if (!loop[0]) return null;

    const rounds = await db
      .select()
      .from(schema.generatedLoopRounds)
      .where(eq(schema.generatedLoopRounds.generated_loop_id, loopId))
      .orderBy(asc(schema.generatedLoopRounds.round_order));

    return {
      loop: loop[0],
      rounds,
    };
  } catch (error) {
    if (
      isMissingSchemaObjectError(error, "generated_loops") ||
      isMissingSchemaObjectError(error, "generated_loop_rounds")
    ) {
      return null;
    }

    throw error;
  }
}

export async function upsertHistoricalQuestions(
  questions: HistoricalQuestionSnapshot[]
): Promise<void> {
  const db = getDb();

  try {
    await db
      .insert(schema.historicalQuestions)
      .values(
        questions.map((question) => ({
          id: question.id,
          company: question.company,
          round_type: question.roundType,
          role_family: question.roleFamily,
          level_band: question.levelBand,
          topics: question.topics,
          jd_tags: question.jdTags,
          prompt: question.prompt,
          source_label: question.sourceLabel,
          provenance: question.provenance,
          confidence: question.confidence,
          review_status: question.reviewStatus,
        }))
      )
      .onConflictDoUpdate({
        target: schema.historicalQuestions.id,
        set: {
          company: sql`excluded.company`,
          round_type: sql`excluded.round_type`,
          role_family: sql`excluded.role_family`,
          level_band: sql`excluded.level_band`,
          topics: sql`excluded.topics`,
          jd_tags: sql`excluded.jd_tags`,
          prompt: sql`excluded.prompt`,
          source_label: sql`excluded.source_label`,
          provenance: sql`excluded.provenance`,
          confidence: sql`excluded.confidence`,
          review_status: sql`excluded.review_status`,
        },
      });
  } catch (error) {
    if (isMissingSchemaObjectError(error, "historical_questions")) {
      return;
    }
    throw error;
  }
}

export async function getInterviewFeedback(
  interviewId: string
): Promise<InterviewFeedback | undefined> {
  const db = getDb();
  const results = await db
    .select()
    .from(schema.interviewFeedback)
    .where(eq(schema.interviewFeedback.interview_id, interviewId))
    .limit(1);
  return results[0];
}
