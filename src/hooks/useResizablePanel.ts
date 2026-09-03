"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type UseResizablePanelOptions = {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
};

/**
 * Drag-to-resize state for the room's left panel. Shared by the AI interview
 * room and the practice room so both panels behave identically.
 */
export function useResizablePanel({
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 700,
}: UseResizablePanelOptions = {}) {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(defaultWidth);

  const handleResizeStart = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
    },
    [width]
  );

  const handleTouchResizeStart = useCallback(
    (e: ReactTouchEvent) => {
      setIsDragging(true);
      dragStartX.current = e.touches[0].clientX;
      dragStartWidth.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number) => {
      const delta = clientX - dragStartX.current;
      const newWidth = Math.min(
        maxWidth,
        Math.max(minWidth, dragStartWidth.current + delta)
      );
      setWidth(newWidth);
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onEnd = () => setIsDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onEnd);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, maxWidth, minWidth]);

  return { width, isDragging, handleResizeStart, handleTouchResizeStart };
}
