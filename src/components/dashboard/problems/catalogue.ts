import type { DifficultyLevel, ProblemCategory } from "@/lib/constants";

/* ─── Shapes ──────────────────────────────────────────────────────────────── */

export type ProblemProgress = "solved" | "in_progress" | "untouched";

/** The signed-in user's saved solo-practice attempt for one problem. */
export type ProblemAttemptSummary = {
  isSolved: boolean;
  testsPassed: number | null;
  testsTotal: number | null;
};

export type BankProblem = {
  id: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  category: string;
  companyTags: string[];
  isFreeSolverEnabled: boolean;
  /** Public test cases shipped with the problem. Optional so older callers keep type-checking. */
  testsTotal?: number;
  /** Present only when this user has saved practice code against the problem. */
  attempt?: ProblemAttemptSummary | null;
};

export type ProblemBankSummary = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  solved: number;
  inProgress: number;
  untouched: number;
  free: number;
  categories: number;
  /** True once the user has at least one saved attempt, so progress facets are worth showing. */
  hasProgress: boolean;
};

/* ─── Labels ──────────────────────────────────────────────────────────────── */

/** Category names as the artboards write them — sentence case, no abbreviated dots. */
export const CATEGORY_LABELS: Record<ProblemCategory, string> = {
  arrays: "Arrays",
  strings: "Strings",
  trees: "Trees",
  graphs: "Graphs",
  dp: "DP",
  "linked-lists": "Linked lists",
  "stacks-queues": "Stacks & queues",
  "binary-search": "Binary search",
  heap: "Heap",
  backtracking: "Backtracking",
  "sliding-window": "Sliding window",
  trie: "Trie",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as ProblemCategory] ?? category;
}

/** Company slugs whose casing a naive title-case would get wrong. */
const COMPANY_LABELS: Record<string, string> = {
  "goldman-sachs": "Goldman Sachs",
  ibm: "IBM",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  ebay: "eBay",
  paypal: "PayPal",
  jpmorgan: "JPMorgan",
};

export function companyLabel(tag: string): string {
  return (
    COMPANY_LABELS[tag] ??
    tag
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export const PROGRESS_CONFIG: Record<
  ProblemProgress,
  { label: string; dotClassName: string; textClassName: string }
> = {
  solved: {
    label: "Solved",
    dotClassName: "bg-brand-green",
    textClassName: "text-brand-green",
  },
  in_progress: {
    label: "In progress",
    dotClassName: "bg-brand-amber",
    textClassName: "text-brand-amber",
  },
  untouched: {
    label: "Not started",
    dotClassName: "border border-brand-subtle",
    textClassName: "text-brand-subtle",
  },
};

/** Difficulty carries its own colour in this list, selected or not. */
export const DIFFICULTY_TONE: Record<DifficultyLevel | "all", string> = {
  all: "text-brand-text",
  easy: "text-brand-green",
  medium: "text-brand-amber",
  hard: "text-brand-rose",
};

/* ─── Derivation ──────────────────────────────────────────────────────────── */

export function problemProgress(problem: BankProblem): ProblemProgress {
  if (!problem.attempt) return "untouched";
  return problem.attempt.isSolved ? "solved" : "in_progress";
}

export function summarizeBank(
  problems: readonly BankProblem[]
): ProblemBankSummary {
  let easy = 0;
  let medium = 0;
  let hard = 0;
  let solved = 0;
  let inProgress = 0;
  let free = 0;
  const categories = new Set<string>();

  for (const problem of problems) {
    if (problem.difficulty === "easy") easy += 1;
    else if (problem.difficulty === "medium") medium += 1;
    else hard += 1;

    const progress = problemProgress(problem);
    if (progress === "solved") solved += 1;
    else if (progress === "in_progress") inProgress += 1;

    if (problem.isFreeSolverEnabled) free += 1;
    categories.add(problem.category);
  }

  return {
    total: problems.length,
    easy,
    medium,
    hard,
    solved,
    inProgress,
    untouched: problems.length - solved - inProgress,
    free,
    categories: categories.size,
    hasProgress: solved + inProgress > 0,
  };
}

/** Both launch paths for a problem. Free-solver problems get the solo editor. */
export function problemLaunchHrefs(problem: BankProblem) {
  return {
    practice: `/practice/solve/${problem.slug}`,
    round: `/interview/setup?problem=${problem.slug}&dsaExperience=ai_interview`,
  };
}

/* ─── Facets ──────────────────────────────────────────────────────────────── */

export type ProblemFacets = {
  search: string;
  difficulty: DifficultyLevel | "all";
  category: string;
  progress: ProblemProgress | "all";
  freeOnly: boolean;
};

export const EMPTY_FACETS: ProblemFacets = {
  search: "",
  difficulty: "all",
  category: "all",
  progress: "all",
  freeOnly: false,
};

export function hasActiveFacets(facets: ProblemFacets): boolean {
  return (
    facets.search.trim() !== "" ||
    facets.difficulty !== "all" ||
    facets.category !== "all" ||
    facets.progress !== "all" ||
    facets.freeOnly
  );
}

type FacetKey = keyof ProblemFacets;

function matchesSearch(problem: BankProblem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (problem.title.toLowerCase().includes(q)) return true;
  if (categoryLabel(problem.category).toLowerCase().includes(q)) return true;
  return problem.companyTags.some(
    (tag) =>
      tag.toLowerCase().includes(q) ||
      companyLabel(tag).toLowerCase().includes(q)
  );
}

/**
 * True when the problem satisfies every facet except `ignore`. Leaving one
 * facet out is what lets each chip show the count it would produce.
 */
export function matchesFacets(
  problem: BankProblem,
  facets: ProblemFacets,
  ignore?: FacetKey
): boolean {
  if (ignore !== "search" && !matchesSearch(problem, facets.search)) {
    return false;
  }
  if (
    ignore !== "difficulty" &&
    facets.difficulty !== "all" &&
    problem.difficulty !== facets.difficulty
  ) {
    return false;
  }
  if (
    ignore !== "category" &&
    facets.category !== "all" &&
    problem.category !== facets.category
  ) {
    return false;
  }
  if (
    ignore !== "progress" &&
    facets.progress !== "all" &&
    problemProgress(problem) !== facets.progress
  ) {
    return false;
  }
  if (ignore !== "freeOnly" && facets.freeOnly && !problem.isFreeSolverEnabled) {
    return false;
  }
  return true;
}

export function filterProblems(
  problems: readonly BankProblem[],
  facets: ProblemFacets
): BankProblem[] {
  return problems.filter((problem) => matchesFacets(problem, facets));
}

export type FacetCounts = {
  difficulty: Record<DifficultyLevel | "all", number>;
  /** Keyed by category slug, plus an "all" total. */
  category: Record<string, number>;
  progress: Record<ProblemProgress | "all", number>;
  free: number;
};

/**
 * Counts each chip against the other facets, so a chip that would empty the
 * list reads 0 and can be parked rather than clicked into a dead end.
 */
export function computeFacetCounts(
  problems: readonly BankProblem[],
  facets: ProblemFacets
): FacetCounts {
  const difficulty: Record<DifficultyLevel | "all", number> = {
    all: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  };
  const category: Record<string, number> = { all: 0 };
  const progress: Record<ProblemProgress | "all", number> = {
    all: 0,
    solved: 0,
    in_progress: 0,
    untouched: 0,
  };
  let free = 0;

  for (const problem of problems) {
    if (matchesFacets(problem, facets, "difficulty")) {
      difficulty.all += 1;
      difficulty[problem.difficulty] += 1;
    }
    if (matchesFacets(problem, facets, "category")) {
      category.all += 1;
      category[problem.category] = (category[problem.category] ?? 0) + 1;
    }
    if (matchesFacets(problem, facets, "progress")) {
      progress.all += 1;
      progress[problemProgress(problem)] += 1;
    }
    if (
      problem.isFreeSolverEnabled &&
      matchesFacets(problem, facets, "freeOnly")
    ) {
      free += 1;
    }
  }

  return { difficulty, category, progress, free };
}
