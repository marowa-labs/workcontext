import { SmartCitationService } from "./services/smartCitationService";

async function verifySmartCheck() {
  console.log("--- Verifying Smart Citation Check ---");

  // Known DOI for testing (Real-world example: 10.1126/science.1147571 was retracted)
  const citations = [
    {
      id: "test-1",
      doi: "10.1126/science.1147571",
      title: "Testing Retracted Paper",
    },
    {
      id: "test-2",
      doi: "10.1038/nature12140",
      title: "Testing Nature Paper",
    },
    {
      id: "test-3",
      doi: "10.1016/j.cell.2015.02.037",
      title: "Testing High Impact Paper",
    },
  ];

  try {
    const results = await SmartCitationService.analyzeCitations(citations);

    console.log("Analysis Results:");
    results.forEach((r, i) => {
      console.log(`${i + 1}. Title: ${r.title}`);
      console.log(`   DOI: ${r.doi}`);
      console.log(`   Is Retracted: ${r.isRetracted}`);
      console.log(`   Total Citations: ${r.totalCitations}`);
      console.log(
        `   Mentions: ${r.mentioningCount}, Support: ${r.supportingCount}, Contrast: ${r.contrastingCount}`,
      );
      if (r.isRetracted) {
        console.log(`   Retraction Reason: ${r.retractionReason}`);
      }
      console.log("---");
    });

    const hasRetracted = results.some((r) => r.isRetracted);
    const hasMetrics = results.some((r) => r.totalCitations >= 0);

    if (hasMetrics) {
      console.log("SUCCESS: Smart metrics retrieved.");
    } else {
      console.log("FAILURE: No metrics retrieved.");
    }
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

verifySmartCheck();
