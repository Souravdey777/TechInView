import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql as dsql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

async function seedProblems() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set. Run: source .env");
    process.exit(1);
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  const problemsDir = path.join(process.cwd(), "src/data/problems");
  const files = fs.readdirSync(problemsDir).filter((f) => f.endsWith(".json"));

  console.log(`Found ${files.length} problem files\n`);

  let inserted = 0;
  let updated = 0;

  for (const file of files) {
    const filePath = path.join(problemsDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    try {
      // Upsert by slug
      const result = await db
        .insert(schema.problems)
        .values({
          title: content.title,
          slug: content.slug,
          difficulty: content.difficulty,
          category: content.category,
          company_tags: content.company_tags || [],
          description: content.description,
          examples: content.examples,
          constraints: content.constraints || [],
          starter_code: content.starter_code,
          test_cases: content.test_cases,
          solution_approach: content.solution_approach,
          hints: content.hints || [],
          optimal_complexity: content.optimal_complexity,
          follow_up_questions: content.follow_up_questions || [],
        })
        .onConflictDoUpdate({
          target: schema.problems.slug,
          set: {
            title: dsql`excluded.title`,
            difficulty: dsql`excluded.difficulty`,
            category: dsql`excluded.category`,
            company_tags: dsql`excluded.company_tags`,
            description: dsql`excluded.description`,
            examples: dsql`excluded.examples`,
            constraints: dsql`excluded.constraints`,
            starter_code: dsql`excluded.starter_code`,
            test_cases: dsql`excluded.test_cases`,
            solution_approach: dsql`excluded.solution_approach`,
            hints: dsql`excluded.hints`,
            optimal_complexity: dsql`excluded.optimal_complexity`,
            follow_up_questions: dsql`excluded.follow_up_questions`,
          },
        })
        .returning({ id: schema.problems.id });

      if (result.length > 0) {
        console.log(`  ✓ ${content.title} (${content.difficulty}) — ${content.category}`);
        inserted++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${content.title}: ${msg}`);
    }
  }

  updated = inserted; // upsert counts as either
  console.log(`\n✅ Seeded ${inserted} problems (${updated} upserted)`);

  // Verify
  const count = await db.select({ count: dsql<number>`count(*)` }).from(schema.problems);
  console.log(`📊 Total problems in DB: ${count[0].count}`);

  await client.end();
}

seedProblems().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
