export const PUBLIC_PROFILE_USERNAME_MIN_LENGTH = 3;
export const PUBLIC_PROFILE_USERNAME_MAX_LENGTH = 30;
export const PUBLIC_PROFILE_BIO_MAX_LENGTH = 160;

const PUBLIC_PROFILE_USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_PUBLIC_USERNAMES = new Set([
  "api",
  "blog",
  "callback",
  "dashboard",
  "design-system",
  "favicon.ico",
  "apple-icon.png",
  "icon.png",
  "how-ai-evaluates",
  "icon.svg",
  "interview",
  "interviews",
  "login",
  "onboarding",
  "opengraph-image",
  "practice",
  "prep-plans",
  "problems",
  "progress",
  "results",
  "robots.txt",
  "settings",
  "signup",
  "sitemap.xml",
  "u",
]);

export const PUBLIC_PROFILE_LINK_ORDER = [
  "github",
  "linkedin",
  "peerlist",
  "devto",
  "hashnode",
  "medium",
  "twitter",
] as const;

export type PublicProfileLinkKey = (typeof PUBLIC_PROFILE_LINK_ORDER)[number];
export type PublicProfileLinks = Partial<Record<PublicProfileLinkKey, string>>;

type PublicProfileLinkConfig = {
  label: string;
  placeholder: string;
  helpText: string;
  buildUrl: (handle: string) => string;
};

export const PUBLIC_PROFILE_LINK_CONFIG: Record<
  PublicProfileLinkKey,
  PublicProfileLinkConfig
> = {
  github: {
    label: "GitHub",
    placeholder: "github.com/yourname or yourname",
    helpText: "Open source, side projects, or your pinned repos.",
    buildUrl: (handle) => `https://github.com/${handle}`,
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "linkedin.com/in/yourname or yourname",
    helpText: "Your professional profile or hiring-facing presence.",
    buildUrl: (handle) => `https://www.linkedin.com/in/${handle}`,
  },
  peerlist: {
    label: "Peerlist",
    placeholder: "peerlist.io/yourname or yourname",
    helpText: "Showcase your projects, work, and profile credibility.",
    buildUrl: (handle) => `https://peerlist.io/${handle}`,
  },
  devto: {
    label: "dev.to",
    placeholder: "dev.to/yourname or yourname",
    helpText: "Technical writing or dev community posts.",
    buildUrl: (handle) => `https://dev.to/${handle}`,
  },
  hashnode: {
    label: "Hashnode",
    placeholder: "hashnode.com/@yourname or yourname",
    helpText: "Your blog or engineering notes on Hashnode.",
    buildUrl: (handle) => `https://hashnode.com/@${handle.replace(/^@/, "")}`,
  },
  medium: {
    label: "Medium",
    placeholder: "medium.com/@yourname or yourname",
    helpText: "Long-form writing and engineering essays.",
    buildUrl: (handle) => `https://medium.com/@${handle.replace(/^@/, "")}`,
  },
  twitter: {
    label: "Twitter",
    placeholder: "x.com/yourname or yourname",
    helpText: "Social proof, writing threads, or public updates.",
    buildUrl: (handle) => `https://x.com/${handle.replace(/^@/, "")}`,
  },
};

export type OrderedPublicProfileLink = {
  key: PublicProfileLinkKey;
  label: string;
  url: string;
};

export type PublicProfilePracticeCell = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
};

export type PublicProfilePracticeWeek = {
  key: string;
  days: PublicProfilePracticeCell[];
};

export type PublicProfilePracticeMonthLabel = {
  label: string;
  column: number;
};

export type PublicProfilePracticeActivity = {
  totalSessions: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  weeks: PublicProfilePracticeWeek[];
  monthLabels: PublicProfilePracticeMonthLabel[];
};

type PracticeCountRow = {
  date: string;
  count: number;
};

export function normalizePublicUsername(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized
    .slice(0, PUBLIC_PROFILE_USERNAME_MAX_LENGTH)
    .replace(/-+$/g, "");
}

export function isValidPublicUsername(value: string): boolean {
  return (
    value.length >= PUBLIC_PROFILE_USERNAME_MIN_LENGTH &&
    value.length <= PUBLIC_PROFILE_USERNAME_MAX_LENGTH &&
    PUBLIC_PROFILE_USERNAME_PATTERN.test(value) &&
    !isReservedPublicUsername(value)
  );
}

export function getPublicProfilePath(username: string): string {
  return `/u/${normalizePublicUsername(username)}`;
}

export function getPublicProfileUrl(baseUrl: string, username: string): string {
  return `${baseUrl.replace(/\/$/, "")}${getPublicProfilePath(username)}`;
}

export function isReservedPublicUsername(value: string): boolean {
  return RESERVED_PUBLIC_USERNAMES.has(normalizePublicUsername(value));
}

function looksLikeAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizeUrl(value: string): string | null {
  const candidate = looksLikeAbsoluteUrl(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    url.protocol = "https:";
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/g, "");
    return url.toString().replace(/\/$/g, "");
  } catch {
    return null;
  }
}

function sanitizeHandle(value: string): string {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export function normalizePublicProfileLink(
  key: PublicProfileLinkKey,
  value: string
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const shouldTreatAsUrl =
    looksLikeAbsoluteUrl(trimmed) ||
    trimmed.includes("/") ||
    trimmed.includes(".com") ||
    trimmed.includes(".io");

  if (shouldTreatAsUrl) {
    return normalizeUrl(trimmed);
  }

  const handle = sanitizeHandle(trimmed);

  if (!handle) {
    return null;
  }

  return normalizeUrl(PUBLIC_PROFILE_LINK_CONFIG[key].buildUrl(handle));
}

export function normalizePublicProfileLinks(
  links: PublicProfileLinks
): PublicProfileLinks {
  const normalized: PublicProfileLinks = {};

  for (const key of PUBLIC_PROFILE_LINK_ORDER) {
    const url = normalizePublicProfileLink(key, links[key] ?? "");

    if (url) {
      normalized[key] = url;
    }
  }

  return normalized;
}

export function getOrderedPublicProfileLinks(
  links: PublicProfileLinks | null | undefined
): OrderedPublicProfileLink[] {
  if (!links) {
    return [];
  }

  return PUBLIC_PROFILE_LINK_ORDER.flatMap((key) => {
    const url = links[key];

    if (!url) {
      return [];
    }

    return [
      {
        key,
        label: PUBLIC_PROFILE_LINK_CONFIG[key].label,
        url,
      },
    ];
  });
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function startOfUtcWeek(date: Date): Date {
  const normalized = startOfUtcDay(date);
  const day = normalized.getUTCDay();
  const offset = (day + 6) % 7;
  normalized.setUTCDate(normalized.getUTCDate() - offset);
  return normalized;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKeyFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateFromKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function getDayDifference(left: string, right: string): number {
  const leftDate = dateFromKey(left).getTime();
  const rightDate = dateFromKey(right).getTime();
  return Math.round((rightDate - leftDate) / 86400000);
}

function getHeatLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  if (maxCount === 1) {
    return 4;
  }

  const scaledLevel = Math.ceil((count / maxCount) * 4);
  return Math.min(4, Math.max(1, scaledLevel)) as 1 | 2 | 3 | 4;
}

function getCurrentStreak(dateKeys: string[], todayKey: string): number {
  if (dateKeys.length === 0) {
    return 0;
  }

  const practicedDays = new Set(dateKeys);
  let cursor = todayKey;

  if (!practicedDays.has(cursor)) {
    const yesterday = dateKeyFromDate(addUtcDays(dateFromKey(todayKey), -1));

    if (!practicedDays.has(yesterday)) {
      return 0;
    }

    cursor = yesterday;
  }

  let streak = 0;

  while (practicedDays.has(cursor)) {
    streak += 1;
    cursor = dateKeyFromDate(addUtcDays(dateFromKey(cursor), -1));
  }

  return streak;
}

function getLongestStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < dateKeys.length; index += 1) {
    if (getDayDifference(dateKeys[index - 1], dateKeys[index]) === 1) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > longest) {
      longest = current;
    }
  }

  return longest;
}

export function buildPublicProfilePracticeActivity(
  rows: PracticeCountRow[],
  today = new Date()
): PublicProfilePracticeActivity {
  const countsByDate = new Map<string, number>();

  for (const row of rows) {
    if (!row.date || row.count <= 0) {
      continue;
    }

    countsByDate.set(row.date, row.count);
  }

  const normalizedToday = startOfUtcDay(today);
  const todayKey = dateKeyFromDate(normalizedToday);
  const startWeek = addUtcDays(startOfUtcWeek(normalizedToday), -(52 * 7));
  const displayedWeeks = 53;
  const dateKeys = Array.from(countsByDate.keys()).sort();
  const maxCount = rows.reduce((max, row) => Math.max(max, row.count), 0);
  const monthLabels: PublicProfilePracticeMonthLabel[] = [];
  const monthTokens = new Set<string>();
  const weeks: PublicProfilePracticeWeek[] = [];

  for (let weekIndex = 0; weekIndex < displayedWeeks; weekIndex += 1) {
    const weekStart = addUtcDays(startWeek, weekIndex * 7);
    const days: PublicProfilePracticeCell[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addUtcDays(weekStart, dayIndex);
      const dateKey = dateKeyFromDate(date);
      const isFuture = dateKey > todayKey;
      const count = isFuture ? 0 : countsByDate.get(dateKey) ?? 0;
      const level = isFuture ? 0 : getHeatLevel(count, maxCount);

      days.push({
        date: dateKey,
        count,
        level,
        isFuture,
      });

      const monthToken = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      const shouldAddMonthLabel =
        date.getUTCDate() === 1 &&
        !isFuture &&
        !monthTokens.has(monthToken);

      if (shouldAddMonthLabel) {
        monthTokens.add(monthToken);
        monthLabels.push({
          label: date.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
          column: weekIndex,
        });
      }
    }

    weeks.push({
      key: dateKeyFromDate(weekStart),
      days,
    });
  }

  if (weeks.length > 0 && monthLabels.length > 0 && monthLabels[0]?.column !== 0) {
    const firstVisibleDate = dateFromKey(weeks[0].days[0].date);
    monthLabels.unshift({
      label: firstVisibleDate.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      }),
      column: 0,
    });
  }

  return {
    totalSessions: rows.reduce((sum, row) => sum + row.count, 0),
    activeDays: dateKeys.length,
    currentStreak: getCurrentStreak(dateKeys, todayKey),
    longestStreak: getLongestStreak(dateKeys),
    weeks,
    monthLabels,
  };
}
