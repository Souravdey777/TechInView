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

type DeletePrepPlanButtonProps = {
  planLabel: string;
  onConfirm: () => void | Promise<void>;
  triggerLabel?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

export function DeletePrepPlanButton({
  planLabel,
  onConfirm,
  triggerLabel = "Delete plan",
  size = "sm",
  variant = "destructive",
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
        <Button size={size} variant={variant}>
          <Trash2 className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this prep plan?</DialogTitle>
          <DialogDescription>
            This will permanently remove <span className="text-brand-text">{planLabel}</span> from
            this browser and clear its saved progress.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
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
