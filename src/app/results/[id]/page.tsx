export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ScoreSummary } from "@/components/results/ScoreSummary";
import { ScoreRadar } from "@/components/results/ScoreRadar";
import { FeedbackCard } from "@/components/results/FeedbackCard";
import { TranscriptReview } from "@/components/results/TranscriptReview";
import { CodeReview } from "@/components/results/CodeReview";
import { SCORING_DIMENSIONS } from "@/lib/constants";
import type { HireRecommendation } from "@/lib/constants";

// ─── Mock data (replaces real DB fetch until backend is wired) ────────────────

type DimensionKey = "problem_solving" | "code_quality" | "communication" | "technical_knowledge" | "testing";

type MockScores = Record<DimensionKey, { score: number; feedback: string }>;

const MOCK_SCORES: MockScores = {
  problem_solving: {
    score: 82,
    feedback:
      "You quickly identified the hash map approach and correctly handled the edge case of duplicate inputs. Could have explored the two-pointer approach as a follow-up for sorted arrays.",
  },
  code_quality: {
    score: 76,
    feedback:
      "Variable names were clear and the logic was well-structured. Consider adding early returns to reduce nesting depth in the main loop.",
  },
  communication: {
    score: 80,
    feedback:
      "You verbalized your thought process clearly during approach discussion. Explaining the trade-off between time and space complexity would have strengthened your answer.",
  },
  technical_knowledge: {
    score: 74,
    feedback:
      "Correctly identified O(n) time and O(n) space. When asked about space optimization, the response was vague — practicing complexity deep-dives will help.",
  },
  testing: {
    score: 70,
    feedback:
      "You tested the main happy-path and the empty-array edge case. Missing: duplicate values in input, single-element arrays, and negative numbers.",
  },
};

const MOCK_TRANSCRIPT = [
  {
    role: "interviewer",
    content:
      "Hi! I'm Alex. Welcome to your mock interview session. Before we dive in, could you briefly tell me about your background and what kind of roles you're targeting?",
    timestamp_ms: 5000,
  },
  {
    role: "candidate",
    content:
      "Sure! I'm a software engineer with about 3 years of experience, mostly in backend Python. I'm targeting mid-level SWE roles at companies like Google and Meta.",
    timestamp_ms: 18000,
  },
  {
    role: "interviewer",
    content:
      "Great background! Let's get started. Today's problem is Two Sum. Given an array of integers and a target, return the indices of two numbers that add up to the target. Any questions before you start?",
    timestamp_ms: 35000,
  },
  {
    role: "candidate",
    content:
      "A couple quick questions — can I assume there's always exactly one solution? And can the same element be used twice?",
    timestamp_ms: 55000,
  },
  {
    role: "interviewer",
    content:
      "Good clarifying questions. Yes, exactly one valid answer exists, and no — you may not use the same element twice.",
    timestamp_ms: 68000,
  },
  {
    role: "candidate",
    content:
      "Okay. My first thought is a brute force O(n²) nested loop. But I think we can do better with a hash map — store each number and its index, then for each element check if the complement exists. That gives us O(n) time and O(n) space.",
    timestamp_ms: 95000,
  },
  {
    role: "interviewer",
    content:
      "That sounds like a solid approach. Walk me through the implementation.",
    timestamp_ms: 112000,
  },
  {
    role: "candidate",
    content:
      "I'll use a dictionary. For each index i, I compute complement = target - nums[i]. If complement is in the map, return its stored index and i. Otherwise, add nums[i] → i to the map.",
    timestamp_ms: 135000,
  },
  {
    role: "interviewer",
    content:
      "Perfect. Go ahead and code it up.",
    timestamp_ms: 150000,
  },
  {
    role: "candidate",
    content:
      "Done. I ran through the examples — both pass. Let me also consider: what if nums has only one element? The loop still works because there's nothing in the map yet, so it just adds and continues.",
    timestamp_ms: 890000,
  },
  {
    role: "interviewer",
    content:
      "Nice. Can you confirm the time and space complexity?",
    timestamp_ms: 920000,
  },
  {
    role: "candidate",
    content:
      "Time is O(n) — single pass. Space is O(n) for the hash map in the worst case.",
    timestamp_ms: 938000,
  },
  {
    role: "interviewer",
    content:
      "Excellent. One final question: is there any scenario where we could reduce space usage?",
    timestamp_ms: 960000,
  },
  {
    role: "candidate",
    content:
      "If the array were sorted, a two-pointer approach would be O(1) extra space. But since we need indices and the array isn't guaranteed sorted, the hash map is the better trade-off here.",
    timestamp_ms: 985000,
  },
  {
    role: "interviewer",
    content:
      "Great answer. That wraps up our session. You showed solid problem-solving instincts and clear communication. Overall a strong performance — well done!",
    timestamp_ms: 1010000,
  },
];

const MOCK_CODE = `def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}

    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i

    return []  # No solution found (problem guarantees one exists)
`;

const OVERALL_SCORE = 78;
const HIRE_REC: HireRecommendation = "hire";
const SUMMARY =
  "You demonstrated strong problem-solving fundamentals with a clean hash map solution and good communication throughout. Your complexity analysis was accurate and you asked the right clarifying questions upfront. Focus on deeper edge-case testing and practicing follow-up optimizations to push into the Strong Hire range.";

// ─── Page ─────────────────────────────────────────────────────────────────────

type ResultsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  // In production: const { id } = await params; then fetch from DB
  // For now we use mock data regardless of id
  await params; // consume to satisfy Next.js

  const radarData = (Object.keys(MOCK_SCORES) as DimensionKey[]).map((key) => ({
    dimension: SCORING_DIMENSIONS[key].label,
    score: MOCK_SCORES[key].score,
    maxScore: 100,
  }));

  const feedbackCards = (Object.keys(MOCK_SCORES) as DimensionKey[]).map((key) => ({
    dimension: SCORING_DIMENSIONS[key].label,
    score: MOCK_SCORES[key].score,
    weight: SCORING_DIMENSIONS[key].weight,
    feedback: MOCK_SCORES[key].feedback,
  }));

  return (
    <main className="min-h-screen bg-brand-deep text-brand-text">
      <div className="max-w-5xl mx-auto py-8 px-4">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-brand-muted bg-brand-surface border border-brand-border px-3 py-1 rounded-full">
            Two Sum &middot; Medium &middot; Python
          </span>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            Interview Results
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Here&apos;s a detailed breakdown of your performance across all 5 dimensions.
          </p>
        </div>

        {/* ── Section 1: Score Summary ── */}
        <section className="mb-6">
          <ScoreSummary
            overallScore={OVERALL_SCORE}
            hireRecommendation={HIRE_REC}
            summary={SUMMARY}
          />
        </section>

        {/* ── Section 2: Radar Chart ── */}
        <section className="mb-6">
          <ScoreRadar scores={radarData} />
        </section>

        {/* ── Section 3: Feedback Cards (5-dimension grid) ── */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-brand-text mb-4">
            Dimension Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbackCards.map((card) => (
              <FeedbackCard
                key={card.dimension}
                dimension={card.dimension}
                score={card.score}
                weight={card.weight}
                feedback={card.feedback}
              />
            ))}
          </div>
        </section>

        {/* ── Section 4: Code Review ── */}
        <section className="mb-6">
          <CodeReview
            code={MOCK_CODE}
            language="python"
            testsPassed={4}
            testsTotal={5}
          />
        </section>

        {/* ── Section 5: Transcript ── */}
        <section className="mb-10">
          <TranscriptReview messages={MOCK_TRANSCRIPT} />
        </section>

        {/* ── CTA: Practice Again ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-brand-border">
          <p className="text-sm text-brand-muted">Ready to improve your score?</p>
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-cyan text-brand-deep font-semibold text-sm hover:bg-brand-cyan/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Practice Again
          </Link>
        </div>

      </div>
    </main>
  );
}
