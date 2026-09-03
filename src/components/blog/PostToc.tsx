"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
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
    <nav
      aria-label="On this page"
      className="rounded-2xl border border-brand-border bg-brand-surface p-6"
    >
      <p className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted">
        On this page
      </p>
      <ul className="m-0 mt-4 max-h-[50vh] list-none space-y-1 overflow-y-auto p-0">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "block rounded-md py-1.5 text-sm leading-snug transition-colors",
                  h.level === 3 && "pl-4",
                  active
                    ? "font-medium text-brand-cyan"
                    : "text-brand-muted hover:text-brand-text"
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
