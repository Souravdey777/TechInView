"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const CONFIRM_TEXT = "delete my account";

export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmation.toLowerCase().trim() === CONFIRM_TEXT;

  const handleDelete = useCallback(async () => {
    if (!confirmed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }, [confirmed, router]);

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-brand-rose border border-brand-rose/30 bg-brand-rose/5 hover:bg-brand-rose/10 transition-colors"
      >
        Delete Account
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-rose">
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all interview history,
              scores, and progress. Unused credits will be forfeited. This
              action <strong className="text-brand-text">cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="confirm-delete"
              className="text-sm text-brand-muted"
            >
              Type <span className="text-brand-text font-medium">{CONFIRM_TEXT}</span> to confirm:
            </label>
            <Input
              id="confirm-delete"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={CONFIRM_TEXT}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-sm text-brand-rose">{error}</p>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-surface border border-brand-border transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!confirmed || loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-rose hover:bg-brand-rose/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Deleting..." : "Delete Account"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
