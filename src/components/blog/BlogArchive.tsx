"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  groupPostsByMonth,
  type BlogListItem,
  type BlogTopic,
} from "@/lib/blog-taxonomy";

type BlogArchiveProps = {
  posts: BlogListItem[];
  topics: { topic: BlogTopic; count: number }[];
};

function formatDayMonth(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function BlogArchive({ posts, topics }: BlogArchiveProps) {
  const [active, setActive] = useState<BlogTopic | "all">("all");

  const groups = useMemo(() => {
    const filtered =
      active === "all" ? posts : posts.filter((p) => p.topic === active);
    return groupPostsByMonth(filtered);
  }, [posts, active]);

  const shown = groups.reduce((n, g) => n + g.posts.length, 0);

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter posts by topic"
      >
        <button
          type="button"
          onClick={() => setActive("all")}
          aria-pressed={active === "all"}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
            active === "all"
              ? "border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan"
              : "border-brand-border text-brand-muted hover:border-brand-cyan/25 hover:text-brand-text"
          )}
        >
          All
          <span
            className={active === "all" ? "text-brand-cyan" : "text-brand-subtle"}
          >
            {posts.length}
          </span>
        </button>

        {topics.map(({ topic, count }) => {
          const on = active === topic;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => setActive(on ? "all" : topic)}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
                on
                  ? "border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan"
                  : "border-brand-border text-brand-muted hover:border-brand-cyan/25 hover:text-brand-text"
              )}
            >
              {topic}
              <span className={on ? "text-brand-cyan" : "text-brand-subtle"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {shown} {shown === 1 ? "post" : "posts"} shown
        {active === "all" ? "" : ` in ${active}`}
      </p>

      <div className="mt-10">
        {groups.map((group) => (
          <section key={group.key} className="mt-14 first:mt-0">
            <div className="flex items-center justify-between pb-4">
              <h2 className="m-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted">
                {group.label}
              </h2>
              <span className="font-mono text-[10px] tracking-[0.1em] text-brand-subtle">
                {group.posts.length}{" "}
                {group.posts.length === 1 ? "guide" : "guides"}
              </span>
            </div>

            <ul className="m-0 list-none p-0">
              {group.posts.map((post) => (
                <li key={post.slug} className="min-w-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className={cn(
                      "group grid grid-cols-1 gap-x-7 gap-y-2 border-t border-brand-border py-6 transition-colors",
                      "md:grid-cols-[92px_minmax(0,1fr)_170px_64px] md:items-baseline",
                      "hover:border-brand-cyan/25",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
                    )}
                  >
                    <span className="font-mono text-xs tracking-wide text-brand-subtle">
                      {formatDayMonth(post.date)}
                    </span>

                    <div className="min-w-0">
                      <h3 className="m-0 text-lg font-semibold leading-snug text-brand-text transition-colors group-hover:text-brand-cyan">
                        {post.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted">
                        {post.description}
                      </p>
                    </div>

                    <span className="font-mono text-[11px] tracking-wide text-brand-muted">
                      {post.topic}
                    </span>

                    <span className="font-mono text-[11px] text-brand-subtle md:text-right">
                      {post.readingTimeMinutes} min
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-brand-border" />
          </section>
        ))}
      </div>
    </div>
  );
}
