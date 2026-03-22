"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastVariant = "default" | "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

// ─── Global state (module-level, sonner-style) ────────────────────────────────

let listeners: Array<(toasts: ToastItem[]) => void> = [];
let toastQueue: ToastItem[] = [];

function notify() {
  listeners.forEach((l) => l([...toastQueue]));
}

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).slice(2, 9);
  const item: ToastItem = {
    id,
    title: options.title,
    description: options.description,
    variant: options.variant ?? "default",
  };

  // Cap at 3 visible toasts — remove oldest if at limit
  if (toastQueue.length >= 3) {
    toastQueue = toastQueue.slice(-2);
  }
  toastQueue = [...toastQueue, item];
  notify();

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    dismiss(id);
  }, 4000);
}

function dismiss(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notify();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  return { toast };
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const variantStyles: Record<ToastVariant, string> = {
  default: "border-brand-cyan/50",
  success: "border-brand-green/50",
  error: "border-brand-rose/50",
};

const variantTitleStyles: Record<ToastVariant, string> = {
  default: "text-brand-cyan",
  success: "text-brand-green",
  error: "text-brand-rose",
};

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in on mount
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "relative flex flex-col gap-1 px-4 py-3 pr-10 rounded-xl",
        "bg-brand-card border shadow-xl",
        "transition-all duration-300 ease-out",
        variantStyles[item.variant],
        visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8"
      )}
    >
      <p
        className={cn(
          "text-sm font-semibold leading-tight",
          variantTitleStyles[item.variant]
        )}
      >
        {item.title}
      </p>
      {item.description && (
        <p className="text-xs text-brand-muted leading-snug">
          {item.description}
        </p>
      )}
      <button
        onClick={() => onDismiss(item.id)}
        className="absolute top-2.5 right-2.5 text-brand-muted hover:text-brand-text transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Toaster (mount once in root layout) ─────────────────────────────────────

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const handleUpdate = useCallback((updated: ToastItem[]) => {
    setToasts(updated);
  }, []);

  useEffect(() => {
    listeners.push(handleUpdate);
    return () => {
      listeners = listeners.filter((l) => l !== handleUpdate);
    };
  }, [handleUpdate]);

  const handleDismiss = useCallback((id: string) => {
    dismiss(id);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)]"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}
