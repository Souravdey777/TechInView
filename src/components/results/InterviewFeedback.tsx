"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type InterviewFeedbackProps = {
  interviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STAR_LABELS = ["Poor", "Below Average", "Average", "Good", "Excellent"];

export function InterviewFeedback({
  interviewId,
  open,
  onOpenChange,
}: InterviewFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [wentWell, setWentWell] = useState("");
  const [toImprove, setToImprove] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(false);

  useEffect(() => {
    if (!open || !interviewId) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/interview/feedback?interviewId=${interviewId}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setExistingFeedback(true);
          setRating(json.data.rating);
          setWentWell(json.data.went_well ?? "");
          setToImprove(json.data.to_improve ?? "");
          setSubmitted(true);
        }
      } catch {
        // Ignore — show fresh form
      }
    })();
  }, [open, interviewId]);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          rating,
          wentWell: wentWell.trim() || undefined,
          toImprove: toImprove.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        setTimeout(() => onOpenChange(false), 1800);
      }
    } catch {
      // Silently fail — non-critical
    } finally {
      setSubmitting(false);
    }
  }

  const displayStar = hoveredStar || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 border border-brand-green/20">
              <CheckCircle2 className="h-7 w-7 text-brand-green" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-text">
                {existingFeedback ? "Feedback Updated" : "Thanks for your feedback!"}
              </h3>
              <p className="text-sm text-brand-muted mt-1.5">
                Your input helps us make TechInView better for everyone.
              </p>
            </div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-5 w-5 transition-colors",
                    star <= rating
                      ? "fill-brand-amber text-brand-amber"
                      : "text-brand-border"
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-cyan" />
                How was your interview?
              </DialogTitle>
              <DialogDescription>
                Rate your experience and share what worked or what could be
                better.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-1">
              {/* Star rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-text">
                  Overall experience
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-1 focus:ring-offset-brand-card"
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 transition-colors duration-150",
                            star <= displayStar
                              ? "fill-brand-amber text-brand-amber"
                              : "text-brand-border hover:text-brand-muted"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {displayStar > 0 && (
                    <span className="text-xs text-brand-muted animate-in fade-in-0 slide-in-from-left-1 duration-150">
                      {STAR_LABELS[displayStar - 1]}
                    </span>
                  )}
                </div>
              </div>

              {/* What went well */}
              <div className="space-y-1.5">
                <label
                  htmlFor="went-well"
                  className="text-sm font-medium text-brand-text"
                >
                  What went well?
                  <span className="text-brand-muted font-normal ml-1">
                    (optional)
                  </span>
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

              {/* What could be better */}
              <div className="space-y-1.5">
                <label
                  htmlFor="to-improve"
                  className="text-sm font-medium text-brand-text"
                >
                  What could be better?
                  <span className="text-brand-muted font-normal ml-1">
                    (optional)
                  </span>
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

              {/* Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-sm text-brand-muted hover:text-brand-text transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                    rating > 0
                      ? "bg-brand-cyan text-brand-deep hover:bg-brand-cyan/90 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-brand-surface text-brand-muted cursor-not-allowed border border-brand-border"
                  )}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Feedback
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
