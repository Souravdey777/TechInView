"use client";

import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelResizeHandleProps = {
  isDragging: boolean;
  onMouseDown: (e: ReactMouseEvent) => void;
  onTouchStart: (e: ReactTouchEvent) => void;
};

/** Vertical drag handle between the room's left panel and the workspace. */
export function PanelResizeHandle({
  isDragging,
  onMouseDown,
  onTouchStart,
}: PanelResizeHandleProps) {
  return (
    <div
      className={cn(
        "flex w-2 shrink-0 cursor-col-resize items-center justify-center border-r border-brand-border bg-brand-surface transition-colors hover:bg-brand-cyan/10 group",
        isDragging && "bg-brand-cyan/10"
      )}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <GripVertical
        className={cn(
          "h-5 w-5 text-brand-border transition-colors group-hover:text-brand-cyan/60",
          isDragging && "text-brand-cyan/60"
        )}
      />
    </div>
  );
}
