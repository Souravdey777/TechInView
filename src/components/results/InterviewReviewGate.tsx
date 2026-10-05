"use client";

import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BODY, CONTAINER, Eyebrow, LABEL, PAD } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type RatingKey = "realism" | "ai_quality" | "problem_fit" | "scoring_accuracy" | "overall";

type InterviewReviewGateProps = {
  interviewId: string;
  interviewerName?: string;
  onComplete: () => void;
};

const STAR_LABELS = ["Poor", "Below Average", "Average", "Good", "Excellent"];

const RATING_QUESTIONS: { key: RatingKey; label: string; description: string }[] = [
  {
    key: "realism",
    label: "Interview Realism",
    description: "How realistic did the interview feel compared to a real tech interview?",
  },
  {
    key: "ai_quality",
    label: "AI Interviewer Quality",
    description: "How was the AI interviewer at asking questions, giving hints, and guiding the session?",
  },
  {
    key: "problem_fit",
    label: "Problem Appropriateness",
    description: "Was the problem difficulty appropriate for your selected level?",
  },
  {
    key: "scoring_accuracy",
    label: "Scoring Accuracy",
    description: "How fair and accurate do you feel the scoring was?",
  },
  {
    key: "overall",
    label: "Overall Experience",
    description: "How would you rate your overall experience with TechInView?",
  },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors duration-150",
                star <= display
                  ? "fill-brand-cyan text-brand-cyan"
                  : "text-white/[0.18] hover:text-brand-muted"
              )}
            />
          </button>
        ))}
      </div>
      {display > 0 && (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted animate-in fade-in-0 slide-in-from-left-1 duration-150">
          {STAR_LABELS[display - 1]}
        </span>
      )}
    </div>
  );
}

function NpsRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-9 w-9 rounded-full border font-mono text-[13px] tabular-nums transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
              n === value
                ? "border-brand-cyan/40 bg-brand-cyan/[0.08] text-brand-cyan"
                : "border-white/[0.12] text-brand-muted hover:border-white/[0.18] hover:text-brand-text"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={cn(LABEL, "flex max-w-[402px] justify-between px-0.5")}>
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
}

export function InterviewReviewGate({
  interviewId,
  interviewerName = "your AI interviewer",
  onComplete,
}: InterviewReviewGateProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    realism: 0,
    ai_quality: 0,
    problem_fit: 0,
    scoring_accuracy: 0,
    overall: 0,
  });
  const [nps, setNps] = useState(0);
  const [wentWell, setWentWell] = useState("");
  const [toImprove, setToImprove] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allRated =
    Object.values(ratings).every((v) => v > 0) && nps > 0;

  const filledCount =
    Object.values(ratings).filter((v) => v > 0).length + (nps > 0 ? 1 : 0);

  async function handleSubmit() {
    if (!allRated) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          ratings: { ...ratings, nps },
          wentWell: wentWell.trim() || undefined,
          toImprove: toImprove.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onComplete();
      } else {
        setError(json.error || "Failed to submit feedback");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={cn("min-h-screen bg-brand-deep text-brand-text", PAD)}>
      <div className={cn(CONTAINER, "max-w-2xl py-14")}>
        {/* Header */}
        <div className="mb-10">
          <Eyebrow>Before your report</Eyebrow>
          <h1 className="text-balance text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.02] tracking-[-0.035em] text-brand-text">
            How was your interview?
          </h1>
          <p className={cn(BODY, "mt-4 max-w-md")}>
            Rate your experience across a few dimensions. Your feedback directly
            shapes how we improve TechInView.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-0.5 flex-1 transition-colors duration-300",
                  i < filledCount ? "bg-brand-cyan" : "bg-white/[0.08]"
                )}
              />
            ))}
          </div>
          <span className={cn(LABEL, "tabular-nums")}>
            {filledCount}/6
          </span>
        </div>

        {/* Rating questions */}
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {RATING_QUESTIONS.map((q) => (
            <div key={q.key} className="py-6">
              <div className="mb-4">
                <h3 className="text-[17px] tracking-[-0.01em] text-brand-text">
                  {q.label}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                  {q.key === "ai_quality"
                    ? `How was ${interviewerName} at asking questions, giving hints, and guiding the session?`
                    : q.description}
                </p>
              </div>
              <StarRating
                value={ratings[q.key]}
                onChange={(v) =>
                  setRatings((prev) => ({ ...prev, [q.key]: v }))
                }
              />
            </div>
          ))}

          {/* NPS */}
          <div className="py-6">
            <div className="mb-4">
              <h3 className="text-[17px] tracking-[-0.01em] text-brand-text">
                Likelihood to Recommend
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                How likely are you to recommend TechInView to a friend?
              </p>
            </div>
            <NpsRating value={nps} onChange={setNps} />
          </div>
        </div>

        {/* Text feedback */}
        <div className="mt-10 space-y-6">
          <div className="space-y-1.5">
            <label
              htmlFor="went-well"
              className={cn(LABEL, "block")}
            >
              What went well?
              <span className="ml-1 normal-case tracking-normal">(optional)</span>
            </label>
            <Textarea
              id="went-well"
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="e.g. The AI interviewer felt realistic, hints were helpful..."
              rows={2}
              maxLength={500}
              className="min-h-0"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="to-improve"
              className={cn(LABEL, "block")}
            >
              What could be better?
              <span className="ml-1 normal-case tracking-normal">(optional)</span>
            </label>
            <Textarea
              id="to-improve"
              value={toImprove}
              onChange={(e) => setToImprove(e.target.value)}
              placeholder="e.g. Voice was laggy, problem was too easy, scoring felt off..."
              rows={2}
              maxLength={500}
              className="min-h-0"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-6 text-sm text-brand-rose">{error}</p>
        )}

        {/* Submit */}
        <div className="mt-10 flex flex-col items-start gap-3 border-t border-white/[0.08] pt-8">
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!allRated || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {allRated ? "Submit & View Results" : `Rate all 6 to continue (${filledCount}/6)`}
          </Button>
          <p className={LABEL}>
            Your feedback is required before viewing the report.
          </p>
        </div>
      </div>
    </main>
  );
}
