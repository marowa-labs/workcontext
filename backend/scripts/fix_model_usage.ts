/**
 * Script to fix incorrect model names in AIPerformanceMetric table
 * Run with: npx ts-node scripts/fix_model_usage.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "Starting to fix incorrect model names in AIPerformanceMetric...",
  );

  // Find all records with incorrect model names (gpt-4o-mini being used with Gemini API)
  const incorrectRecords = await prisma.aIPerformanceMetric.findMany({
    where: {
      model: "gpt-4o-mini",
    },
  });

  console.log(
    `Found ${incorrectRecords.length} records with model "gpt-4o-mini"`,
  );

  if (incorrectRecords.length > 0) {
    // Option 1: Delete incorrect records
    const deleteResult = await prisma.aIPerformanceMetric.deleteMany({
      where: {
        model: "gpt-4o-mini",
      },
    });

    console.log(
      `Deleted ${deleteResult.count} records with incorrect model name`,
    );

    // Option 2 (alternative): Update the records to use the correct model
    // Uncomment below if you want to update instead of delete
    /*
    const updateResult = await prisma.aIPerformanceMetric.updateMany({
      where: {
        model: "gpt-4o-mini",
      },
      data: {
        model: "gemini-3.1-flash-lite",
      },
    });
    console.log(`Updated ${updateResult.count} records to use "gemini-3.1-flash-lite"`);
    */
  }

  // Also check for any other incorrect model names
  const allModels = await prisma.aIPerformanceMetric.groupBy({
    by: ["model"],
    _count: {
      model: true,
    },
  });

  console.log("\nCurrent model usage in database:");
  allModels.forEach((m) => {
    console.log(`  ${m.model}: ${m._count.model} records`);
  });

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
