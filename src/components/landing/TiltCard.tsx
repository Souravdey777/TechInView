"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees applied at the card edges. */
  maxTilt?: number;
  /** Scale applied while the pointer is over the card. */
  hoverScale?: number;
};

/**
 * Wraps content in a mouse-interactive 3D tilt surface. The card rotates toward
 * the cursor with a soft glare that tracks the pointer, then eases back to rest
 * on leave. Tilt is skipped for touch/coarse pointers and when the user prefers
 * reduced motion — in those cases it renders as a plain static panel.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 7,
  hoverScale = 1.02,
}: TiltCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const enabled = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      enabled.current = fine.matches && !reduced.matches;
    };
    sync();
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  const setVars = useCallback(
    (rx: number, ry: number, mx: number, my: number, active: boolean) => {
      const card = cardRef.current;
      if (!card) return;
      card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      card.style.setProperty("--mx", `${mx.toFixed(2)}%`);
      card.style.setProperty("--my", `${my.toFixed(2)}%`);
      card.style.setProperty("--scale", active ? `${hoverScale}` : "1");
      card.style.setProperty("--glare", active ? "1" : "0");
    },
    [hoverScale]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled.current) return;
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      const ry = (px - 0.5) * 2 * maxTilt; // rotateY: left/right
      const rx = (0.5 - py) * 2 * maxTilt; // rotateX: up/down
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setVars(rx, ry, px * 100, py * 100, true);
      });
    },
    [maxTilt, setVars]
  );

  const handleLeave = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    setVars(0, 0, 50, 50, false);
  }, [setVars]);

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ perspective: "1200px" }}
      className="[transform-style:preserve-3d]"
    >
      <div
        ref={cardRef}
        style={
          {
            "--rx": "0deg",
            "--ry": "0deg",
            "--mx": "50%",
            "--my": "50%",
            "--scale": "1",
            "--glare": "0",
            transform:
              "rotateX(var(--rx)) rotateY(var(--ry)) scale(var(--scale))",
            transformStyle: "preserve-3d",
            transition:
              "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease",
            willChange: "transform",
          } as CSSProperties
        }
        className={cn("relative", className)}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-200"
          style={{
            opacity: "var(--glare)",
            background:
              "radial-gradient(340px circle at var(--mx) var(--my), rgba(34,211,238,0.16), rgba(34,211,238,0.05) 40%, transparent 70%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}
