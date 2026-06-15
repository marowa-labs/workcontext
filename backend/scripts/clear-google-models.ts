// One-shot script: clear cached Google models so they get re-fetched with correct sort order
import { prisma } from "../src/lib/prisma";
import logger from "../src/monitoring/logger";

async function main() {
  // Find users with cached Google models
  const users = await prisma.user.findMany({
    where: {
      byok_google_models: { not: null },
    },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log("No users with cached Google models found.");
    return;
  }

  console.log(`Found ${users.length} user(s) with cached Google models:`);
  for (const u of users) {
    console.log(`  - ${u.email || u.id}`);
    await prisma.user.update({
      where: { id: u.id },
      data: { byok_google_models: null },
    });
    console.log(
      `    ✓ Cleared cached models — will re-fetch from Google API on next request`,
    );
  }

  console.log(
    "\nDone. Models will be re-fetched with gemini-first sort on next AI request.",
  );
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
