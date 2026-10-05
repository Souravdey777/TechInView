import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import {
  BODY,
  ButtonLink,
  CELL,
  CONTAINER,
  Eyebrow,
  GRID,
  H1,
  H3,
  Kicker,
  LABEL,
  LEAD,
  PAD,
  SectionHeader,
} from "@/components/marketing/ds";
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
    "Did you ask about constraints and edge cases (empty input, duplicates, bounds) before writing code? Did you pick a sensible approach and explain why it fits? High scores go to candidates who change course when the interviewer points out a flaw instead of defending a dead end.",
  code_quality:
    "The scorer reads your final code in the session editor: naming, structure, control flow and whether you added complexity you did not need. Ask yourself if a teammate could review it in two minutes. Small cleanups you make along the way count.",
  communication:
    "The interviewer hears how you explain the plan, talk through tradeoffs and respond to hints. You do not need a polished speech. Saying \"I'm stuck on the duplicate case\" scores better than two minutes of silence.",
  technical_knowledge:
    "Correct time and space complexity, a reason for each data structure you chose, and a fair comparison with the alternatives (extra memory vs. in-place, sort vs. hash map). Vague answers to follow-up questions pull this score down.",
  testing:
    "Walk an example through your code, name the edge cases and check them, either by running tests in the editor or by tracing by hand. Finding and fixing your own bug scores better than code that only handles the happy path.",
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

const PAGE_TITLE = "How AI Mock Interviews Are Scored";
const PAGE_DESCRIPTION =
  "How TechInView scores an AI mock coding interview: five weighted dimensions, the overall score formula, hire recommendation bands, and a sample report.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | TechInView`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/how-ai-evaluates" },
  robots: { index: true, follow: true },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "article",
    url: `${baseUrl}/how-ai-evaluates`,
    siteName: "TechInView",
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "TechInView AI interview scorecard with five scored dimensions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

const DIMENSION_KEYS = Object.keys(SCORING_DIMENSIONS) as ScoringDimension[];
const pct = (w: number) => Math.round(w * 100);

export default function HowAiEvaluatesPage() {
  return (
    <>
      <section className={cn("pb-24 pt-20 sm:pt-28", PAD)}>
        <div className={CONTAINER}>
          <Kicker>Scoring · DSA coding rounds</Kicker>
          <h1 className={cn(H1, "max-w-[16ch]")}>How TechInView scores an AI mock interview</h1>
          <p className={cn(LEAD, "mt-9 max-w-[620px]")}>
            When a round ends, the scoring model reads the full transcript of what you said to the
            interviewer and the code you wrote in the editor. It scores five dimensions from 0 to 100.
            Your <strong className="font-medium text-brand-text">overall score</strong> is the weighted
            sum of those five, and it maps to a hire recommendation from Strong Hire to No Hire.
          </p>
          <p className={cn(LABEL, "mt-8")}>
            This page covers DSA coding rounds. Other round types use their own rubrics, noted below.
          </p>
        </div>
      </section>

      <section aria-labelledby="rubric-heading" className={cn("border-t border-white/[0.08] py-24", PAD)}>
        <div className={CONTAINER}>
          <SectionHeader
            n="01"
            eyebrow="Rubric"
            title={<span id="rubric-heading">The five dimensions</span>}
            description="Problem solving and code carry the most weight, as they do in most big-tech coding loops. Communication, technical depth and testing make up the rest."
          />
          <ul className={cn(GRID, "sm:grid-cols-2 lg:grid-cols-3")}>
            {DIMENSION_KEYS.map((key, i) => {
              const d = SCORING_DIMENSIONS[key];
              return (
                <li key={key} className={cn(CELL, "flex flex-col p-7")}>
                  <div className={cn(LABEL, "flex justify-between gap-4")}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-brand-cyan">{pct(d.weight)}% weight</span>
                  </div>
                  <h3 className={cn(H3, "mt-8")}>{d.label}</h3>
                  <p className="mt-2 text-[15px] text-brand-text/90">{d.description}</p>
                  <p className={cn(BODY, "mt-4")}>{DIMENSION_EXPLANATIONS[key]}</p>
                  <span aria-hidden className="mt-auto block pt-8">
                    <span className="relative block h-0.5 bg-white/[0.08]">
                      <span className="absolute inset-y-0 left-0 bg-brand-cyan" style={{ width: `${pct(d.weight)}%` }} />
                    </span>
                  </span>
                </li>
              );
            })}
            <li className={cn(CELL, "flex flex-col p-7")}>
              <div className={LABEL}>Overall score</div>
              <h3 className={cn(H3, "mt-8")}>The formula</h3>
              <p className={cn(BODY, "mt-2")}>Each dimension is scored 0 to 100, then weighted.</p>
              <pre className="mt-6 whitespace-pre-wrap font-mono text-[13px] leading-[1.9] text-brand-text">
                {"overall =\n" +
                  DIMENSION_KEYS.map(
                    (key, i) => `  ${i ? "+ " : "  "}${SCORING_DIMENSIONS[key].label} × ${pct(SCORING_DIMENSIONS[key].weight)}%`
                  ).join("\n")}
              </pre>
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="hire-bands-heading" className={cn("border-t border-white/[0.08] py-24", PAD)}>
        <div className={CONTAINER}>
          <SectionHeader
            n="02"
            eyebrow="Recommendation"
            title={<span id="hire-bands-heading">Hire recommendation bands</span>}
            description="The recommendation comes from the weighted overall score, not from any single dimension. A 95 in communication will not carry a 40 in problem solving."
          />
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-white/[0.08]">
                <th scope="col" className={cn(LABEL, "py-3 pr-4 font-normal")}>Recommendation</th>
                <th scope="col" className={cn(LABEL, "py-3 pr-4 font-normal")}>Overall</th>
                <th scope="col" className={cn(LABEL, "hidden py-3 font-normal sm:table-cell")}>
                  <span className="sr-only">Position on the 0 to 100 scale</span>
                  <span aria-hidden>0 to 100</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {HIRE_TIER_ORDER.map((rec, i) => {
                const cfg = HIRE_RECOMMENDATION_CONFIG[rec];
                const max = i === 0 ? 100 : HIRE_RECOMMENDATION_CONFIG[HIRE_TIER_ORDER[i - 1]!].minScore - 1;
                return (
                  <tr key={rec} className="border-b border-white/[0.08]">
                    <th scope="row" className="py-5 pr-4 text-[17px] font-normal tracking-[-0.01em]">
                      {cfg.label}
                    </th>
                    <td className="py-5 pr-4 font-mono text-[13px] tabular-nums text-brand-muted">
                      {hireScoreRangeLabel(rec, i)}
                    </td>
                    <td className="hidden w-1/2 py-5 sm:table-cell" aria-hidden>
                      <span className="relative block h-0.5 bg-white/[0.08]">
                        <span
                          className="absolute inset-y-0 bg-brand-cyan"
                          style={{ left: `${cfg.minScore}%`, width: `${max - cfg.minScore + 1}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="sample-heading" className={cn("border-t border-white/[0.08] py-24", PAD)}>
        <div className={CONTAINER}>
          <SectionHeader
            n="03"
            eyebrow="Sample report"
            title={<span id="sample-heading">What you get after a round</span>}
            description="A static example of the results page after a coding round with Tia: summary, radar chart and a note per dimension. Your real results page also has the transcript and your code."
          />
          <SampleReportPreview />
        </div>
      </section>

      <section aria-labelledby="other-rounds-heading" className={cn("border-t border-white/[0.08] py-24", PAD)}>
        <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
          <div>
            <Eyebrow n="04">Other rounds</Eyebrow>
            <h2 id="other-rounds-heading" className="text-[clamp(28px,3vw,40px)] font-normal leading-[1.05] tracking-[-0.03em]">
              Technical Q&amp;A, Engineering Manager and Behavioral
            </h2>
          </div>
          <div>
            <p className={LEAD}>
              Technical Q&amp;A, Engineering Manager and Behavioral rounds use a round rubric instead:
              problem solving, communication, technical depth, execution and judgment. Behavioral and
              Engineering Manager rounds also get a competency report graded against the value lens you
              choose at setup, such as Amazon Leadership Principles.
            </p>
          </div>
        </div>
      </section>

      <section className={cn("border-t border-white/[0.08] py-24", PAD)}>
        <div className={cn(CONTAINER, "flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between")}>
          <p className="max-w-[560px] text-pretty text-[clamp(24px,2.6vw,34px)] font-normal leading-[1.15] tracking-[-0.025em]">
            Want a scorecard of your own? Practice free, or start with a 5-minute AI interview.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/signup">
              Practice free <span className="font-mono">→</span>
            </ButtonLink>
            <ButtonLink href="/practice" variant="ghost">
              Browse DSA problems
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
