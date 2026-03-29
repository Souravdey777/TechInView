"use client";

import { useState } from "react";
import { Star, Send, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingKey = "realism" | "ai_quality" | "problem_fit" | "scoring_accuracy" | "overall";

type Ratings = Record<RatingKey, number> & { nps: number };

type InterviewReviewGateProps = {
  interviewId: string;
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
    description: "How was Tia at asking questions, giving hints, and guiding the session?",
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
            className="p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-1 focus:ring-offset-brand-deep"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors duration-150",
                star <= display
                  ? "fill-brand-amber text-brand-amber"
                  : "text-brand-border hover:text-brand-muted"
              )}
            />
          </button>
        ))}
      </div>
      {display > 0 && (
        <span className="text-xs text-brand-muted animate-in fade-in-0 slide-in-from-left-1 duration-150">
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
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-9 w-9 rounded-lg text-sm font-medium transition-all",
              "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-1 focus:ring-offset-brand-deep",
              n === value
                ? n <= 6
                  ? "bg-brand-rose/20 text-brand-rose border border-brand-rose/40"
                  : n <= 8
                    ? "bg-brand-amber/20 text-brand-amber border border-brand-amber/40"
                    : "bg-brand-green/20 text-brand-green border border-brand-green/40"
                : "bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-muted hover:text-brand-text"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-brand-muted px-0.5">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
}

export function InterviewReviewGate({
  interviewId,
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
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-deep text-brand-text relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-cyan/3 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 mb-4">
            <MessageSquare className="h-7 w-7 text-brand-cyan" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            How was your interview?
          </h1>
          <p className="text-sm text-brand-muted mt-2 max-w-md mx-auto">
            Rate your experience across a few dimensions. Your feedback directly
            shapes how we improve TechInView.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors duration-300",
                  i < filledCount ? "bg-brand-cyan" : "bg-brand-border"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-brand-muted ml-1">
            {filledCount}/6
          </span>
        </div>

        {/* Rating questions */}
        <div className="space-y-6">
          {RATING_QUESTIONS.map((q) => (
            <div
              key={q.key}
              className={cn(
                "rounded-xl border p-5 transition-colors duration-200",
                ratings[q.key] > 0
                  ? "border-brand-cyan/20 bg-brand-card"
                  : "border-brand-border bg-brand-card/50"
              )}
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-brand-text">
                  {q.label}
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">{q.description}</p>
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
          <div
            className={cn(
              "rounded-xl border p-5 transition-colors duration-200",
              nps > 0
                ? "border-brand-cyan/20 bg-brand-card"
                : "border-brand-border bg-brand-card/50"
            )}
          >
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-brand-text">
                Likelihood to Recommend
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                How likely are you to recommend TechInView to a friend?
              </p>
            </div>
            <NpsRating value={nps} onChange={setNps} />
          </div>
        </div>

        {/* Text feedback */}
        <div className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="went-well"
              className="text-sm font-medium text-brand-text"
            >
              What went well?
              <span className="text-brand-muted font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="went-well"
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="e.g. The AI interviewer felt realistic, hints were helpful..."
              rows={2}
              maxLength={500}
              className={cn(
                "w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2",
                "text-sm text-brand-text placeholder:text-brand-muted/50",
                "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent",
                "resize-none transition-colors"
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="to-improve"
              className="text-sm font-medium text-brand-text"
            >
              What could be better?
              <span className="text-brand-muted font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="to-improve"
              value={toImprove}
              onChange={(e) => setToImprove(e.target.value)}
              placeholder="e.g. Voice was laggy, problem was too easy, scoring felt off..."
              rows={2}
              maxLength={500}
              className={cn(
                "w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2",
                "text-sm text-brand-text placeholder:text-brand-muted/50",
                "focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent",
                "resize-none transition-colors"
              )}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-4 text-sm text-brand-rose text-center">{error}</p>
        )}

        {/* Submit */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allRated || submitting}
            className={cn(
              "inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all",
              allRated
                ? "bg-brand-cyan text-brand-deep hover:bg-brand-cyan/90 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-brand-surface text-brand-muted cursor-not-allowed border border-brand-border"
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {allRated ? "Submit & View Results" : `Rate all 6 to continue (${filledCount}/6)`}
          </button>
          <p className="text-[11px] text-brand-muted">
            Your feedback is required before viewing the report.
          </p>
        </div>
      </div>
    </main>
  );
}
