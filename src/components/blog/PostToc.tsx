"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HAIRLINE, LABEL } from "@/components/marketing/ds";
import type { BlogHeading } from "@/lib/blog-taxonomy";

/**
 * Table of contents with scroll-spy. Renders as plain anchors, so it still
 * works if the observer never runs; the highlight is the only enhancement.
 */
export function PostToc({ headings }: { headings: BlogHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      // bias towards the heading nearest the top of the reading area
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );

    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((n): n is HTMLElement => n !== null);

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className={cn(LABEL, "m-0")}>On this page</p>
      <ul
        className={cn(
          "m-0 mt-5 max-h-[60vh] list-none overflow-y-auto border-l p-0",
          HAIRLINE
        )}
      >
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-1.5 pl-4 text-sm leading-snug transition-colors",
                  h.level === 3 && "pl-7",
                  active
                    ? "border-brand-cyan text-brand-cyan"
                    : "border-transparent text-brand-muted hover:text-brand-text"
                )}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
