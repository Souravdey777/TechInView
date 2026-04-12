import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart2,
  Code2,
  ExternalLink,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import { PracticeHeatmap } from "@/components/public-profile/PracticeHeatmap";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LANGUAGE_CONFIG } from "@/lib/constants";
import { getPublicProfileByUsername } from "@/lib/db/queries";
import { getOrderedPublicProfileLinks, getPublicProfilePath } from "@/lib/public-profile";
import { cn, getScoreColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  junior: "Junior engineer",
  mid: "Mid-level engineer",
  senior: "Senior engineer",
  staff: "Staff+ engineer",
};

const CATEGORY_LABELS: Record<string, string> = {
  arrays: "Arrays",
  strings: "Strings",
  trees: "Trees",
  graphs: "Graphs",
  dp: "Dynamic Programming",
  "linked-lists": "Linked Lists",
  "stacks-queues": "Stacks & Queues",
  "binary-search": "Binary Search",
  heap: "Heap / Priority Queue",
  backtracking: "Backtracking",
  "sliding-window": "Sliding Window",
  trie: "Trie",
};

type PublicProfilePageProps = {
  params: {
    username: string;
  };
};

function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCompanyLabel(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const explicitLabels: Record<string, string> = {
    google: "Google",
    meta: "Meta",
    amazon: "Amazon",
    apple: "Apple",
    microsoft: "Microsoft",
    netflix: "Netflix",
    uber: "Uber",
    airbnb: "Airbnb",
    stripe: "Stripe",
    openai: "OpenAI",
    other: "Other companies",
  };

  return explicitLabels[value] ?? titleCase(value);
}

function getDisplayName(displayName: string | null, username: string): string {
  return displayName?.trim() || username;
}

function getInitials(name: string): string {
  const parts = name
    .replace(/^@/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "TV";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function formatMemberSince(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export async function generateMetadata(
  { params }: PublicProfilePageProps
): Promise<Metadata> {
  const profile = await getPublicProfileByUsername(params.username);

  if (!profile) {
    return {
      title: "Profile Not Found | TechInView",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const displayName = getDisplayName(profile.display_name, profile.username);
  const title = `${displayName} (@${profile.username}) | TechInView`;
  const description =
    profile.public_bio?.trim() ||
    `${displayName} is practicing software engineering interviews on TechInView.`;

  return {
    title,
    description,
    alternates: {
      canonical: getPublicProfilePath(profile.username),
    },
    openGraph: {
      title,
      description,
      url: getPublicProfilePath(profile.username),
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const profile = await getPublicProfileByUsername(params.username);

  if (!profile) {
    notFound();
  }

  const displayName = getDisplayName(profile.display_name, profile.username);
  const companyLabel = formatCompanyLabel(profile.target_company);
  const socialLinks = getOrderedPublicProfileLinks(profile.public_links);
  const languageLabel =
    profile.preferred_language && profile.preferred_language in LANGUAGE_CONFIG
      ? LANGUAGE_CONFIG[profile.preferred_language as keyof typeof LANGUAGE_CONFIG].label
      : null;
  const experienceLabel = profile.experience_level
    ? EXPERIENCE_LEVEL_LABELS[profile.experience_level]
    : null;
  const averageScoreLabel = profile.average_score != null
    ? `${profile.average_score}/100`
    : "No scored rounds yet";

  return (
    <div className="min-h-screen bg-brand-deep">
      <header className="border-b border-brand-border/80 bg-brand-deep/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3 text-brand-text">
            <BrandLogo size="sm" wordmarkClassName="text-base" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-cyan/90"
          >
            Start practicing
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <section className="overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-brand-card via-brand-surface to-brand-deep">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[minmax(0,1fr)_280px] md:px-8 md:py-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                <Sparkles className="h-3.5 w-3.5" />
                Public interview profile
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar size="xl" className="h-20 w-20 border border-brand-border bg-brand-card">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback className="text-xl text-brand-text">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <div>
                    <h1 className="text-3xl font-bold text-brand-text md:text-4xl">
                      {displayName}
                    </h1>
                    <p className="text-sm text-brand-muted">@{profile.username}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {companyLabel ? (
                      <span className="rounded-full border border-brand-border bg-brand-card px-3 py-1 text-xs text-brand-text">
                        Targeting {companyLabel}
                      </span>
                    ) : null}
                    {experienceLabel ? (
                      <span className="rounded-full border border-brand-border bg-brand-card px-3 py-1 text-xs text-brand-text">
                        {experienceLabel}
                      </span>
                    ) : null}
                    {languageLabel ? (
                      <span className="rounded-full border border-brand-border bg-brand-card px-3 py-1 text-xs text-brand-text">
                        {languageLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-7 text-brand-muted md:text-base">
                {profile.public_bio?.trim() ||
                  `${displayName} is sharpening interview skills with voice-led mock interviews on TechInView.`}
              </p>

              {socialLinks.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-brand-muted">
                    Around the web
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.key}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-card px-3 py-1.5 text-xs font-medium text-brand-text transition-colors hover:border-brand-cyan/30 hover:text-brand-cyan"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 self-start">
              <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                  Interviews completed
                </p>
                <p className="mt-2 text-2xl font-bold text-brand-text md:text-3xl">
                  {profile.interviews_completed}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                  Average score
                </p>
                <p className={cn("mt-2 text-2xl font-bold md:text-3xl", profile.average_score != null ? getScoreColor(profile.average_score) : "text-brand-text")}>
                  {averageScoreLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                  Longest streak
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-brand-text md:text-3xl">
                  <Flame className="h-5 w-5 text-brand-amber" />
                  {profile.practice_activity.longestStreak}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">
                  Member since
                </p>
                <p className="mt-2 text-2xl font-bold text-brand-text md:text-3xl">
                  {formatMemberSince(profile.created_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <PracticeHeatmap activity={profile.practice_activity} />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-3xl border border-brand-border bg-brand-card p-6">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-lg font-semibold text-brand-text">
                Strongest categories
              </h2>
            </div>

            {profile.top_categories.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {profile.top_categories.map((category) => (
                  <div
                    key={category.category}
                    className="rounded-2xl border border-brand-border bg-brand-surface p-4"
                  >
                    <p className="text-sm font-semibold text-brand-text">
                      {CATEGORY_LABELS[category.category] ?? titleCase(category.category)}
                    </p>
                    <p className={cn("mt-2 text-2xl font-bold", getScoreColor(category.avg_score))}>
                      {category.avg_score}
                    </p>
                    <p className="mt-3 text-xs leading-6 text-brand-muted">
                      {category.problems_solved}/{category.problems_attempted} strong outcomes
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-brand-muted">
                Completed round data will show up here once enough interviews are scored.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-brand-border bg-brand-card p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-lg font-semibold text-brand-text">
                Why TechInView
              </h2>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-7 text-brand-muted">
              <p className="flex items-start gap-3">
                <Code2 className="mt-1 h-4 w-4 shrink-0 text-brand-cyan" />
                Voice-led mock interviews with live coding and AI follow-ups.
              </p>
              <p className="flex items-start gap-3">
                <BarChart2 className="mt-1 h-4 w-4 shrink-0 text-brand-cyan" />
                Structured feedback across problem solving, code quality, communication, and more.
              </p>
            </div>

            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-2 text-sm font-semibold text-brand-cyan transition-colors hover:bg-brand-cyan/15"
            >
              Create your own profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
