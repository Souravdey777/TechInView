/**
 * Static mapping from blog post keyword → relevant problem categories.
 * Used to show "Related Practice Problems" at the bottom of blog posts.
 *
 * Posts with no DSA affinity map to [] → the section doesn't render.
 */

import type { ProblemCategory } from "./constants";

export const BLOG_KEYWORD_TO_CATEGORIES: Record<string, ProblemCategory[]> = {
  // two-sum-interview.mdx
  "two sum interview": ["arrays"],

  // coding-interview-communication.mdx
  "coding interview communication": ["arrays", "strings", "trees"],

  // faang-interview-scoring.mdx
  "FAANG interview scoring": ["arrays", "dp", "trees"],

  // time-complexity-cheat-sheet.mdx
  "time complexity cheat sheet": ["arrays", "trees", "dp", "binary-search", "graphs"],

  // coding-interview-pressure-live-coding.mdx
  "coding interview under pressure": ["arrays", "strings", "stacks-queues"],

  // how-to-read-coding-interview-problems.mdx
  "how to approach leetcode problems": ["arrays", "strings", "binary-search"],

  // 90-day-coding-interview-prep-plan.mdx
  "coding interview preparation": ["arrays", "dp", "trees", "graphs"],

  // faang-coding-interview-differences.mdx
  "Google vs Amazon coding interview": ["arrays", "trees", "dp", "graphs"],

  // ai-mock-interview-2026.mdx
  "AI mock interview": ["arrays", "strings", "dp"],

  // new-grad-intern-interview-prep-priorities.mdx
  "internship interview prep": ["arrays", "strings", "binary-search"],

  // system-design-interview-prep-2026.mdx
  "system design interview prep": [],

  // behavioral-interview-software-engineer-star.mdx
  "behavioral interview software engineer": [],

  // software-engineer-resume-ats-checklist.mdx
  "software engineer resume ATS": [],

  // software-engineer-take-home-assignment-tips.mdx
  "software engineer take home assignment": [],
};

export function getCategoriesForKeyword(keyword: string): ProblemCategory[] {
  return BLOG_KEYWORD_TO_CATEGORIES[keyword] ?? [];
}
