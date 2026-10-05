"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DeletePrepPlanButtonProps = {
  planLabel: string;
  onConfirm: () => void | Promise<void>;
  triggerLabel?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /** Trash glyph only, with the label kept for screen readers. */
  iconOnly?: boolean;
};

export function DeletePrepPlanButton({
  planLabel,
  onConfirm,
  triggerLabel = "Delete plan",
  size = "sm",
  variant = "destructive",
  iconOnly = false,
}: DeletePrepPlanButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant={variant}
          aria-label={iconOnly ? `${triggerLabel}: ${planLabel}` : undefined}
          className={cn(
            iconOnly && "h-8 w-8 shrink-0 px-0 text-brand-subtle hover:text-brand-rose"
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {iconOnly ? null : triggerLabel}
        </Button>
      </DialogTrigger>

      {/* Portaled outside the themed layout, so it re-applies the theme itself. */}
      <DialogContent className="theme-landing rounded-[20px] border-white/[0.08] bg-brand-deep font-sans shadow-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal tracking-[-0.03em]">
            Delete this prep plan?
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            This removes <span className="text-brand-text">{planLabel}</span> from this browser
            along with its saved round progress. Plans are not synced to your account yet, so
            there is no copy to restore it from.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-white/[0.08]">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
