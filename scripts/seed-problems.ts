import * as fs from "fs";
import * as path from "path";

async function seedProblems() {
  const problemsDir = path.join(process.cwd(), "src/data/problems");
  const files = fs.readdirSync(problemsDir).filter((f) => f.endsWith(".json"));

  console.log(`Found ${files.length} problem files\n`);

  for (const file of files) {
    const filePath = path.join(problemsDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log(`✓ ${content.title} (${content.difficulty}) — ${content.category}`);
    // TODO: Insert into database via Drizzle
    // const db = getDb();
    // await db.insert(problems).values({ ...content }).onConflictDoUpdate(...);
  }

  console.log(`\n✅ Seeded ${files.length} problems`);
}

seedProblems().catch(console.error);
