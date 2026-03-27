import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq, and, ilike, sql, desc, asc } from "drizzle-orm";

import type { Profile, Problem, Interview, Message, Progress, Payment } from "./schema";

// ─── DB Connection (lazy) ─────────────────────────────────────────────────────

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!);
    _db = drizzle(client, { schema });
  }
  return _db;
}

// ─── Profile Queries ──────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | undefined> {
  const db = getDb();
  const results = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);
  return results[0];
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

export async function getProblems(
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

export async function getProblemBySlug(
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

// ─── Interview Queries ────────────────────────────────────────────────────────

export async function createInterview(
  userId: string,
  problemId: string,
  language: string,
  maxDuration = 2700,
  isFreeTrial = false
): Promise<Interview> {
  const db = getDb();
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
    .returning();
  return results[0];
}

export async function getInterview(
  interviewId: string
): Promise<Interview | undefined> {
  const db = getDb();
  const results = await db
    .select()
    .from(schema.interviews)
    .where(eq(schema.interviews.id, interviewId))
    .limit(1);
  return results[0];
}

export async function updateInterview(
  interviewId: string,
  data: Partial<Omit<Interview, "id" | "user_id" | "problem_id" | "started_at">>
): Promise<Interview | undefined> {
  const db = getDb();
  const results = await db
    .update(schema.interviews)
    .set(data)
    .where(eq(schema.interviews.id, interviewId))
    .returning();
  return results[0];
}

export async function getUserInterviews(
  userId: string,
  limit = 20
): Promise<Interview[]> {
  const db = getDb();
  return db
    .select()
    .from(schema.interviews)
    .where(eq(schema.interviews.user_id, userId))
    .orderBy(desc(schema.interviews.started_at))
    .limit(limit);
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
