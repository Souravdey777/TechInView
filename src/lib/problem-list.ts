import "server-only";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/constants";
import { getProblems, getRecentPracticeAttempts } from "@/lib/db/queries";
import {
  EMPTY_FACETS,
  SORT_LABELS,
  computeFacetCounts,
  filterProblems,
  sortProblems,
  type BankProblem,
  type FacetCounts,
  type ProblemFacets,
  type ProblemSort,
} from "@/components/dashboard/problems/catalogue";

/** One saved attempt per problem, so this covers the whole bank comfortably. */
const ATTEMPT_LIMIT = 250;
export const PROBLEM_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 100;

export type ProblemPage = {
  items: BankProblem[];
  /** Problems matching the facets. */
  total: number;
  /** Problems in the whole bank, regardless of facets. */
  bankTotal: number;
  counts: FacetCounts;
};

/** The whole bank as list rows, with the signed-in user's attempts joined in when given. */
export async function getBankProblems(userId?: string): Promise<BankProblem[]> {
  const [problems, attempts] = await Promise.all([
    getProblems(),
    // Progress is a nice-to-have: a failure here should not take the list down.
    userId ? getRecentPracticeAttempts(userId, ATTEMPT_LIMIT).catch(() => []) : [],
  ]);
  const attemptByProblem = new Map(attempts.map((attempt) => [attempt.problem_id, attempt]));

  // "Recommended" order: problems open in the free solver lead, catalogue order otherwise.
  const ordered = [...problems].sort(
    (a, b) => Number(b.is_free_solver_enabled) - Number(a.is_free_solver_enabled)
  );

  return ordered.map((problem) => {
    const attempt = attemptByProblem.get(problem.id);
    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty as DifficultyLevel,
      category: problem.category,
      companyTags: (problem.company_tags as string[] | null) ?? [],
      isFreeSolverEnabled: problem.is_free_solver_enabled,
      testsTotal: Array.isArray(problem.test_cases) ? problem.test_cases.length : 0,
      attempt: attempt
        ? {
            isSolved: attempt.is_solved,
            testsPassed: attempt.tests_passed,
            testsTotal: attempt.tests_total,
          }
        : null,
    };
  });
}

/** Filter, count, sort and slice the bank on the server so the browser only receives one page. */
export function pageProblems(
  bank: readonly BankProblem[],
  facets: ProblemFacets = EMPTY_FACETS,
  sort: ProblemSort = "default",
  offset = 0,
  limit = PROBLEM_PAGE_SIZE
): ProblemPage {
  const filtered = sortProblems(filterProblems(bank, facets), sort);
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    bankTotal: bank.length,
    counts: computeFacetCounts(bank, facets),
  };
}

const PROGRESS_VALUES = ["all", "solved", "in_progress", "untouched"] as const;

/** Parses list query params (a trust boundary), falling back to defaults on anything unexpected. */
export function parseProblemListParams(params: URLSearchParams) {
  const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  const int = (value: string | null, fallback: number, max: number) => {
    const n = Number.parseInt(value ?? "", 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : fallback;
  };

  const facets: ProblemFacets = {
    search: (params.get("search") ?? "").slice(0, 100),
    difficulty: pick(params.get("difficulty"), ["all", ...DIFFICULTY_LEVELS], "all"),
    category: (params.get("category") ?? "all").slice(0, 40),
    progress: pick(params.get("progress"), PROGRESS_VALUES, "all"),
    freeOnly: params.get("freeOnly") === "true",
    company: (params.get("company") ?? "all").slice(0, 40),
  };
  const sort = pick(params.get("sort"), Object.keys(SORT_LABELS) as ProblemSort[], "default");

  return {
    facets,
    sort,
    offset: int(params.get("offset"), 0, 100_000),
    limit: int(params.get("limit"), PROBLEM_PAGE_SIZE, MAX_PAGE_SIZE) || PROBLEM_PAGE_SIZE,
  };
}
