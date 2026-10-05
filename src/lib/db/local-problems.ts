import fs from "node:fs";
import path from "node:path";
import { isFreeSolverProblemSlug } from "@/lib/dsa";
import type { Problem } from "./schema";

/**
 * Local-development fallback for the read-only problem catalog.
 *
 * When DATABASE_URL is not set outside production, catalog reads are served
 * from src/data/problems/*.json, mapped exactly like scripts/seed-problems.ts
 * maps them into the `problems` table. Production never takes this path: a
 * missing DATABASE_URL there should fail loudly, not serve stale files.
 * ponytail: ids are synthetic ("local:<slug>"); anything that writes rows
 * keyed by problem id (attempts, interviews) still needs a real database.
 */
export function shouldUseLocalProblemCatalog(): boolean {
  return !process.env.DATABASE_URL && process.env.NODE_ENV !== "production";
}

let catalog: Problem[] | null = null;

export function localProblemCatalog(): Problem[] {
  if (catalog) return catalog;
  const dir = path.join(process.cwd(), "src/data/problems");
  catalog = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      return {
        id: `local:${c.slug}`,
        title: c.title,
        slug: c.slug,
        difficulty: c.difficulty,
        category: c.category,
        company_tags: c.company_tags ?? [],
        description: c.description,
        examples: c.examples,
        constraints: c.constraints ?? [],
        starter_code: c.starter_code,
        test_cases: c.test_cases,
        solution_approach: c.solution_approach,
        hints: c.hints ?? [],
        optimal_complexity: c.optimal_complexity,
        follow_up_questions: c.follow_up_questions ?? [],
        is_free_solver_enabled: isFreeSolverProblemSlug(c.slug),
        created_at: new Date(0),
      } as Problem;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  return catalog;
}
