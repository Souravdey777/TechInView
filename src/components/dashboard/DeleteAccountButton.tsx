"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CONFIRM_TEXT = "delete my account";

export function DeleteAccountButton() {
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
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
      window.location.replace("/login");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }, [confirmed]);

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
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="destructive"
        className="shrink-0"
      >
        Delete Account
      </Button>

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
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={!confirmed || loading}
              variant="destructive"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
