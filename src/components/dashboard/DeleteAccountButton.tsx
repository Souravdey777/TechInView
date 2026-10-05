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
import { FIELD, LABEL } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

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
        Delete account
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        {/* Portaled outside the themed layout, so it carries the theme itself. */}
        <DialogContent className="max-w-md rounded-[20px] border-white/[0.08] bg-brand-deep shadow-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-normal tracking-[-0.03em] text-brand-rose">
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all interview history,
              scores, and progress. Unused credits will be forfeited. This
              action <strong className="text-brand-text">cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label
              htmlFor="confirm-delete"
              className={cn(LABEL, "block")}
            >
              Type <span className="normal-case tracking-normal text-brand-text">{CONFIRM_TEXT}</span> to confirm:
            </label>
            <Input
              id="confirm-delete"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={CONFIRM_TEXT}
              disabled={loading}
              autoComplete="off"
              className={cn(FIELD, "h-auto")}
            />
          </div>

          {error && (
            <p className="text-sm text-brand-rose">{error}</p>
          )}

          <DialogFooter className="border-white/[0.08]">
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
