export const DSA_EXPERIENCES = ["practice", "ai_interview"] as const;

export type DsaExperience = (typeof DSA_EXPERIENCES)[number];

export const DEFAULT_DSA_EXPERIENCE: DsaExperience = "practice";

export const FREE_SOLVER_PROBLEM_SLUGS = [
  "two-sum",
  "valid-parentheses",
  "binary-search",
  "merge-two-sorted-lists",
  "longest-substring-without-repeating",
  "group-anagrams",
  "product-of-array-except-self",
  "binary-tree-level-order-traversal",
  "number-of-islands",
  "top-k-frequent-elements",
  "trapping-rain-water",
  "word-ladder",
] as const;

const FREE_SOLVER_PROBLEM_SLUGS_SET = new Set<string>(FREE_SOLVER_PROBLEM_SLUGS);

export function isDsaExperience(value: string | null | undefined): value is DsaExperience {
  return value === "practice" || value === "ai_interview";
}

export function normalizeDsaExperience(value: string | null | undefined): DsaExperience {
  return isDsaExperience(value) ? value : DEFAULT_DSA_EXPERIENCE;
}

export function isFreeSolverProblemSlug(slug: string | null | undefined) {
  if (!slug) return false;
  return FREE_SOLVER_PROBLEM_SLUGS_SET.has(slug);
}
