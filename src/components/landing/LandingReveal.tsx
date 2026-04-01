"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Fades content in when the section enters the viewport (respects prefers-reduced-motion via CSS).
 */
export function LandingReveal({ children, className }: LandingRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            obs.unobserve(el);
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("animate-on-scroll", className)}>
      {children}
    </div>
  );
}
