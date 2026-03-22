import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const experienceLevelEnum = pgEnum("experience_level", [
  "junior",
  "mid",
  "senior",
  "staff",
]);

export const planEnum = pgEnum("plan", ["free", "starter", "pro"]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const interviewStatusEnum = pgEnum("interview_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const hireRecommendationEnum = pgEnum("hire_recommendation", [
  "strong_hire",
  "hire",
  "lean_hire",
  "lean_no_hire",
  "no_hire",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "interviewer",
  "candidate",
  "system",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  // References auth.users(id) — enforced at DB level via migration trigger
  id: uuid("id").primaryKey(),
  display_name: text("display_name"),
  avatar_url: text("avatar_url"),
  target_company: text("target_company"),
  experience_level: experienceLevelEnum("experience_level"),
  preferred_language: text("preferred_language"),
  plan: planEnum("plan").default("free").notNull(),
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  interviews_completed: integer("interviews_completed").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const problems = pgTable("problems", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  category: text("category").notNull(),
  company_tags: text("company_tags").array(),
  description: text("description").notNull(),
  examples: jsonb("examples"),
  constraints: text("constraints").array(),
  starter_code: jsonb("starter_code"),
  test_cases: jsonb("test_cases"),
  solution_approach: text("solution_approach"),
  hints: text("hints").array(),
  optimal_complexity: jsonb("optimal_complexity"),
  follow_up_questions: text("follow_up_questions").array(),
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  problem_id: uuid("problem_id")
    .references(() => problems.id, { onDelete: "restrict" })
    .notNull(),
  status: interviewStatusEnum("status").default("in_progress").notNull(),
  language: text("language").notNull(),
  duration_seconds: integer("duration_seconds"),
  max_duration_seconds: integer("max_duration_seconds").default(2700).notNull(),
  final_code: text("final_code"),
  code_passed_tests: boolean("code_passed_tests"),
  tests_passed: integer("tests_passed"),
  tests_total: integer("tests_total"),
  overall_score: integer("overall_score"),
  scores: jsonb("scores"),
  feedback_summary: text("feedback_summary"),
  hire_recommendation: hireRecommendationEnum("hire_recommendation"),
  started_at: timestamp("started_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});

export const messages = pgTable("messages", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  interview_id: uuid("interview_id")
    .references(() => interviews.id, { onDelete: "cascade" })
    .notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  audio_url: text("audio_url"),
  timestamp_ms: integer("timestamp_ms").notNull(),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const progress = pgTable(
  "progress",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    category: text("category").notNull(),
    problems_attempted: integer("problems_attempted").default(0).notNull(),
    problems_solved: integer("problems_solved").default(0).notNull(),
    avg_score: real("avg_score"),
  },
  (table) => ({
    user_category_unique: unique("progress_user_category_unique").on(
      table.user_id,
      table.category
    ),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  interviews: many(interviews),
  progress: many(progress),
}));

export const problemsRelations = relations(problems, ({ many }) => ({
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [interviews.user_id],
    references: [profiles.id],
  }),
  problem: one(problems, {
    fields: [interviews.problem_id],
    references: [problems.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  interview: one(interviews, {
    fields: [messages.interview_id],
    references: [interviews.id],
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  profile: one(profiles, {
    fields: [progress.user_id],
    references: [profiles.id],
  }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

export type Problem = InferSelectModel<typeof problems>;
export type NewProblem = InferInsertModel<typeof problems>;

export type Interview = InferSelectModel<typeof interviews>;
export type NewInterview = InferInsertModel<typeof interviews>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type Progress = InferSelectModel<typeof progress>;
export type NewProgress = InferInsertModel<typeof progress>;
