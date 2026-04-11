import { REVIEWED_HISTORICAL_QUESTIONS } from "@/data/historical-questions";
import { upsertHistoricalQuestions } from "@/lib/db/queries";

async function main() {
  await upsertHistoricalQuestions(REVIEWED_HISTORICAL_QUESTIONS);
  console.log(`Imported ${REVIEWED_HISTORICAL_QUESTIONS.length} historical questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
