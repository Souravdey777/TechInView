import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeHeatmap } from "@/components/public-profile/PracticeHeatmap";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  BODY,
  ButtonLink,
  CELL,
  CHIP,
  CONTAINER,
  Eyebrow,
  GRID,
  H2,
  Kicker,
  LABEL,
  LEAD,
  LINK_ARROW,
  PAD,
} from "@/components/marketing/ds";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LANGUAGE_CONFIG } from "@/lib/constants";
import { getPublicProfileByUsername } from "@/lib/db/queries";
import { getOrderedPublicProfileLinks, getPublicProfilePath } from "@/lib/public-profile";
import { cn } from "@/lib/utils";

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
      title: "Profile not found | TechInView",
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
    `${displayName}'s interview practice on TechInView: completed mock interviews, scores by topic, and practice activity.`;
  // Only profiles the owner made public reach this point (the query filters on
  // is_public_profile). Of those, index the ones with something on them; an
  // empty profile is a thin page, so keep it out of search but let links count.
  const hasContent =
    profile.interviews_completed > 0 || Boolean(profile.public_bio?.trim());

  return {
    title,
    description,
    robots: { index: hasContent, follow: true },
    alternates: {
      canonical: getPublicProfilePath(profile.username),
    },
    openGraph: {
      title,
      description,
      url: getPublicProfilePath(profile.username),
      type: "profile",
      username: profile.username,
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
  const stats = [
    { label: "Interviews completed", value: String(profile.interviews_completed) },
    { label: "Average score", value: profile.average_score != null ? `${profile.average_score}/100` : "--" },
    { label: "Longest streak", value: `${profile.practice_activity.longestStreak}d` },
    { label: "Member since", value: formatMemberSince(profile.created_at) },
  ];
  const tags = [companyLabel && `Targeting ${companyLabel}`, experienceLabel, languageLabel].filter(
    (tag): tag is string => Boolean(tag)
  );

  return (
    <MarketingShell>
      {/* Profile header */}
      <header className={cn(PAD, "pb-16 pt-20 sm:pt-28")}>
        <div className={CONTAINER}>
          <Kicker>Public interview profile</Kicker>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end">
            <Avatar size="xl" className="h-24 w-24 shrink-0 border border-white/[0.12] bg-transparent">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={`Profile photo of ${displayName}`} />
              <AvatarFallback className="border-0 bg-transparent font-mono text-xl text-brand-text">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="break-words text-balance text-[clamp(40px,6vw,80px)] font-normal leading-[0.98] tracking-[-0.045em]">
                {displayName}
              </h1>
              <p className="mt-3 font-mono text-sm text-brand-subtle">@{profile.username}</p>
            </div>
          </div>

          {tags.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag} className={CHIP}>
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <p className={cn(LEAD, "mt-8 max-w-[620px]")}>
            {profile.public_bio?.trim() ||
              `${displayName} is practicing for software engineering interviews with voice mock interviews on TechInView.`}
          </p>

          {socialLinks.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3" aria-label="Around the web">
              {socialLinks.map((link) => (
                <li key={link.key}>
                  <a href={link.url} target="_blank" rel="noreferrer nofollow ugc" className={LINK_ARROW}>
                    {link.label}
                    <span aria-hidden>↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {/* Stats */}
      <section aria-label="Interview stats" className={cn(PAD, "pb-20")}>
        <dl className={cn(CONTAINER, GRID, "grid-cols-2 lg:grid-cols-4")}>
          {stats.map((stat) => (
            <div key={stat.label} className={cn(CELL, "flex flex-col-reverse gap-3 px-5 py-6 sm:px-7 sm:py-8")}>
              <dt className={LABEL}>{stat.label}</dt>
              <dd className="font-mono text-[clamp(24px,3vw,40px)] tracking-[-0.03em] text-brand-text">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Practice activity */}
      <section className={cn(PAD, "border-t border-white/[0.08] py-20")}>
        <div className={CONTAINER}>
          <Eyebrow n="01">Practice activity</Eyebrow>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className={cn(H2, "max-w-[18ch]")}>A year of rounds.</h2>
            <p className={cn(BODY, "max-w-[380px]")}>
              Days with mock interview sessions on TechInView over the past year.
            </p>
          </div>
          {profile.practice_activity.totalSessions > 0 ? (
            <PracticeHeatmap activity={profile.practice_activity} />
          ) : (
            <p className={cn(BODY, "border-y border-white/[0.08] py-10")}>
              No practice sessions yet. Activity shows up here after the first round.
            </p>
          )}
        </div>
      </section>

      {/* Strongest categories */}
      <section className={cn(PAD, "border-t border-white/[0.08] py-20")}>
        <div className={CONTAINER}>
          <Eyebrow n="02">Strongest categories</Eyebrow>
          <h2 className={cn(H2, "mb-10 max-w-[18ch]")}>Where the scores land.</h2>
          {profile.top_categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th scope="col" className={cn(LABEL, "py-3 pr-4 font-normal")}>Category</th>
                    <th scope="col" className={cn(LABEL, "py-3 pr-4 text-right font-normal")}>Avg score</th>
                    <th scope="col" className={cn(LABEL, "py-3 text-right font-normal")}>Solved</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.top_categories.map((category) => (
                    <tr key={category.category} className="border-b border-white/[0.08]">
                      <th scope="row" className="py-5 pr-4 text-[15px] font-normal text-brand-text">
                        {CATEGORY_LABELS[category.category] ?? titleCase(category.category)}
                      </th>
                      <td className="py-5 pr-4 text-right font-mono text-xl text-brand-text">{category.avg_score}</td>
                      <td className="py-5 text-right font-mono text-sm text-brand-muted">
                        {category.problems_solved} / {category.problems_attempted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={cn(BODY, "border-y border-white/[0.08] py-10")}>
              Topic scores appear here after a few interviews have been scored.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className={cn(PAD, "border-t border-white/[0.08] py-24")}>
        <div className={cn(CONTAINER, "flex flex-wrap items-end justify-between gap-10")}>
          <div>
            <Eyebrow>Built on TechInView</Eyebrow>
            <h2 className={cn(H2, "max-w-[16ch]")}>Practice the interview, not just the problem.</h2>
            <p className={cn(LEAD, "mt-6 max-w-[460px]")}>
              A voice interviewer that watches you code, asks follow-up questions, and scores every round skill by
              skill.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/signup">
              Create your own profile <span aria-hidden>→</span>
            </ButtonLink>
            <ButtonLink href="/how-ai-evaluates" variant="ghost">
              How rounds are scored
            </ButtonLink>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
