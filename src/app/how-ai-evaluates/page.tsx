import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  HIRE_RECOMMENDATION_CONFIG,
  SCORING_DIMENSIONS,
  type HireRecommendation,
  type ScoringDimension,
} from "@/lib/constants";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/blog-seo";
import { SampleReportPreview } from "./sample-report-preview";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://techinview.dev";

/** Longer copy for the rubric cards; keys must match SCORING_DIMENSIONS. */
const DIMENSION_EXPLANATIONS: Record<ScoringDimension, string> = {
  problem_solving:
    "TechInView evaluates whether you clarify requirements and constraints, propose a reasonable approach, and reason about edge cases (empty input, duplicates, bounds) before leaning on code. Strong scores usually mean you can defend why your approach fits the problem and adjust when Tia pushes back like a real interviewer.",
  code_quality:
    "TechInView scores how readable and maintainable your solution is in the session editor: naming, structure, control flow, and whether you avoid needless complexity. Idiomatic use of your language and small refactors when you notice smell help—panels care that someone else could review or extend your code.",
  communication:
    "In TechInView AI interviews, Tia hears how you explain your plan, narrate trade-offs, and respond to hints. You do not need a polished speech—structured, honest explanation (including when you are stuck) scores better than long silence.",
  technical_knowledge:
    "TechInView weights depth in your answers: correct time and space complexity, why your data structures fit the constraints, and how you compare alternatives (e.g. extra space vs. in-place). Calibrated follow-ups and crisp answers when discussing bottlenecks or optimizations matter.",
  testing:
    "TechInView credits walking through examples, calling out edge cases, and checking your logic when something fails—whether you run tests in the built-in editor or trace by hand. Proactively testing corner cases and fixing bugs when output is wrong looks stronger than only happy-path code.",
};

const HIRE_TIER_ORDER: HireRecommendation[] = [
  "strong_hire",
  "hire",
  "lean_hire",
  "lean_no_hire",
  "no_hire",
];

function hireScoreRangeLabel(rec: HireRecommendation, index: number): string {
  const min = HIRE_RECOMMENDATION_CONFIG[rec].minScore;
  const max =
    index === 0
      ? 100
      : HIRE_RECOMMENDATION_CONFIG[HIRE_TIER_ORDER[index - 1]!].minScore - 1;
  return `${min}\u2013${max}`;
}

export const metadata: Metadata = {
  title: "How TechInView Evaluates You — AI Interview Scoring | TechInView",
  description:
    "TechInView (TIV): how AI mock interviews are scored after you talk with Tia—five weighted dimensions, overall score, hire bands, and a sample report before you practice.",
  keywords: [
    "TechInView",
    "TIV",
    "Tia AI interviewer",
    "AI interview scoring",
    "mock interview feedback",
    "FAANG interview rubric",
    "coding interview evaluation",
  ],
  authors: [{ name: "TechInView", url: baseUrl }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/how-ai-evaluates" },
  openGraph: {
    title: "How TechInView Evaluates You",
    description:
      "TechInView scoring: five weighted dimensions, hire recommendation bands, and a sample post-interview report from a Tia session.",
    type: "website",
    url: `${baseUrl}/how-ai-evaluates`,
    siteName: "TechInView",
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "TechInView — How AI interview scoring works",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How TechInView Evaluates You",
    description:
      "TechInView: five dimensions, weighted overall score, hire bands, and a sample Tia interview report.",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export default function HowAiEvaluatesPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[280px] w-[min(90vw,36rem)] -translate-x-1/2 rounded-full bg-brand-cyan/[0.07] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16 sm:px-6">
        <header className="mb-12 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-cyan">
            Resources
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            How TechInView Evaluates You
          </h1>
          <p className="mt-3 text-xs text-brand-muted sm:text-sm">
            TechInView (TIV) — AI DSA mock interviews with Tia, your AI interviewer.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-muted sm:text-base">
            When you finish a session on TechInView, our scoring model reviews what you
            said to Tia and the code you wrote in the interview editor. Each dimension is
            scored from 0–100. Your{" "}
            <strong className="font-medium text-brand-text">overall score</strong> is the
            weighted sum of those five scores. That overall maps to a hire-style
            recommendation so you can benchmark yourself against a strong loop.
          </p>
        </header>

        <section className="mb-14" aria-labelledby="rubric-heading">
          <h2
            id="rubric-heading"
            className="text-lg font-semibold text-brand-text mb-2"
          >
            The five dimensions
          </h2>
          <p className="text-sm text-brand-muted mb-6 max-w-2xl">
            TechInView&apos;s rubric weights mirror how many FAANG-style panels emphasize
            problem solving and code, while still rewarding communication, depth, and
            testing in an AI interview.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(SCORING_DIMENSIONS) as ScoringDimension[]).map((key) => {
              const d = SCORING_DIMENSIONS[key];
              const pct = Math.round(d.weight * 100);
              return (
                <li
                  key={key}
                  className="rounded-xl border border-brand-border bg-brand-card/60 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-brand-text">
                      {d.label}
                    </h3>
                    <span className="shrink-0 rounded-full border border-brand-border bg-brand-surface px-2 py-0.5 text-xs text-brand-muted">
                      {pct}% weight
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-brand-text/90">
                    {d.description}
                  </p>
                  <p className="mt-3 text-sm text-brand-muted leading-relaxed">
                    {DIMENSION_EXPLANATIONS[key]}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-brand-muted max-w-2xl">
            Overall = (Problem Solving × 30%) + (Code Quality × 25%) + (Communication ×
            20%) + (Technical Knowledge × 15%) + (Testing × 10%), each using the
            0–100 score for that dimension.
          </p>
        </section>

        <section className="mb-14" aria-labelledby="hire-bands-heading">
          <h2
            id="hire-bands-heading"
            className="text-lg font-semibold text-brand-text mb-2"
          >
            Hire recommendation bands
          </h2>
          <p className="text-sm text-brand-muted mb-6 max-w-2xl">
            On TechInView, your hire recommendation comes from your weighted overall
            score—not from any single dimension in isolation.
          </p>
          <ul className="space-y-3 max-w-xl">
            {HIRE_TIER_ORDER.map((rec, i) => {
              const cfg = HIRE_RECOMMENDATION_CONFIG[rec];
              return (
                <li
                  key={rec}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-brand-border bg-brand-surface/50 px-4 py-3"
                >
                  <span className={cn("text-sm font-semibold", cfg.color)}>
                    {cfg.label}
                  </span>
                  <span className="text-sm tabular-nums text-brand-muted">
                    Overall {hireScoreRangeLabel(rec, i)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mb-10" aria-labelledby="sample-heading">
          <h2
            id="sample-heading"
            className="text-lg font-semibold text-brand-text mb-2"
          >
            Sample report
          </h2>
          <p className="text-sm text-brand-muted mb-8 max-w-2xl">
            Below is a static preview of what TechInView shows after a Tia interview:
            summary, radar chart, and per-dimension cards. A real run also includes your
            transcript and code review on your TechInView results page.
          </p>
          <SampleReportPreview />
        </section>

        <div className="flex flex-col items-start gap-4 border-t border-brand-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-muted">
            Ready for your own TechInView report?
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/practice"
              className="inline-flex items-center justify-center rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text transition-colors hover:bg-brand-card"
            >
              Browse problems
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
            >
              Start practicing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
