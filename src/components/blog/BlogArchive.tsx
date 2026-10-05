"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BODY,
  CHIP,
  CHIP_ACTIVE,
  HAIRLINE,
  LABEL,
  LINK_ARROW,
} from "@/components/marketing/ds";
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
        <TopicChip
          label="All"
          count={posts.length}
          on={active === "all"}
          onClick={() => setActive("all")}
        />
        {topics.map(({ topic, count }) => (
          <TopicChip
            key={topic}
            label={topic}
            count={count}
            on={active === topic}
            onClick={() => setActive(active === topic ? "all" : topic)}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {shown} {shown === 1 ? "post" : "posts"} shown
        {active === "all" ? "" : ` in ${active}`}
      </p>

      {groups.length === 0 ? (
        <div className={cn("mt-10 border-t pt-6", HAIRLINE)}>
          <p className={BODY}>No guides in this topic yet.</p>
          <button
            type="button"
            onClick={() => setActive("all")}
            className={cn(LINK_ARROW, "mt-4")}
          >
            Show all guides <span aria-hidden>→</span>
          </button>
        </div>
      ) : null}

      <div className="mt-10">
        {groups.map((group) => (
          <section key={group.key} className="mt-14 first:mt-0">
            <div className="flex items-center justify-between pb-4">
              <h2 className={cn(LABEL, "m-0")}>{group.label}</h2>
              <span className={LABEL}>
                {group.posts.length}{" "}
                {group.posts.length === 1 ? "guide" : "guides"}
              </span>
            </div>

            <ul className={cn("m-0 list-none border-b p-0", HAIRLINE)}>
              {group.posts.map((post) => (
                <li key={post.slug} className="min-w-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className={cn(
                      "group grid grid-cols-1 gap-x-8 gap-y-2 border-t py-7",
                      HAIRLINE,
                      "md:grid-cols-[80px_minmax(0,1fr)_150px_56px] md:items-baseline",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                    )}
                  >
                    <time
                      dateTime={post.date}
                      className="font-mono text-xs uppercase tracking-[0.06em] text-brand-subtle"
                    >
                      {formatDayMonth(post.date)}
                    </time>

                    <div className="min-w-0">
                      <h3 className="m-0 text-xl font-normal leading-snug tracking-[-0.02em] text-brand-text transition-colors group-hover:text-brand-cyan">
                        {post.title}
                      </h3>
                      <p className={cn(BODY, "mt-2 max-w-[600px]")}>
                        {post.description}
                      </p>
                    </div>

                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-muted">
                      {post.topic}
                    </span>

                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-subtle md:text-right">
                      {post.readingTimeMinutes} min
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function TopicChip({
  label,
  count,
  on,
  onClick,
}: {
  label: string;
  count: number;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        CHIP,
        "gap-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan",
        on && CHIP_ACTIVE
      )}
    >
      {label}
      <span className={on ? "text-brand-cyan" : "text-brand-subtle"}>
        {count}
      </span>
    </button>
  );
}
