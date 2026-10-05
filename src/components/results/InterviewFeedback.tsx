"use client";

import { useState, useEffect } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BODY, LABEL } from "@/components/marketing/ds";
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
            <div>
              <p className={cn(LABEL, "text-brand-green")}>Received</p>
              <h3 className="mt-3 text-2xl font-normal tracking-[-0.03em] text-brand-text">
                {existingFeedback ? "Feedback Updated" : "Thanks for your feedback"}
              </h3>
              <p className={cn(BODY, "mt-2")}>
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
                      ? "fill-brand-cyan text-brand-cyan"
                      : "text-white/[0.18]"
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                How was your interview?
              </DialogTitle>
              <DialogDescription>
                Rate your experience and share what worked or what could be
                better.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-1 space-y-5">
              {/* Star rating */}
              <div className="space-y-2">
                <label className={LABEL}>
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
                        className="rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 transition-colors duration-150",
                            star <= displayStar
                              ? "fill-brand-cyan text-brand-cyan"
                              : "text-white/[0.18] hover:text-brand-muted"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {displayStar > 0 && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted animate-in fade-in-0 slide-in-from-left-1 duration-150">
                      {STAR_LABELS[displayStar - 1]}
                    </span>
                  )}
                </div>
              </div>

              {/* What went well */}
              <div className="space-y-1.5">
                <label
                  htmlFor="went-well"
                  className={LABEL}
                >
                  What went well?
                  <span className="ml-1 normal-case tracking-normal">
                    (optional)
                  </span>
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

              {/* What could be better */}
              <div className="space-y-1.5">
                <label
                  htmlFor="to-improve"
                  className={LABEL}
                >
                  What could be better?
                  <span className="ml-1 normal-case tracking-normal">
                    (optional)
                  </span>
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

              {/* Submit */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Feedback
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
