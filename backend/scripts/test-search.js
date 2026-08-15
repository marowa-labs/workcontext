// Test the full search pipeline with the working embeddings
require("dotenv").config();
const {
  SearchAggregator,
} = require("../src/services/integrations/searchAggregator");

(async () => {
  const userId = "f619be46-e22d-4e4e-b7fb-8181099c8cba";

  console.log("Testing SearchAggregator.search()...");
  try {
    const results = await SearchAggregator.search({
      userId,
      query: "Website Redesign launch plan",
      workspaceId: undefined,
      toolTypes: ["notion"],
      contentTypes: undefined,
      k: 5,
      threshold: 0.3,
    });
    console.log("Notion results:", JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Search FAILED:", err.message);
  }

  console.log("\nTesting GitHub search...");
  try {
    const results = await SearchAggregator.search({
      userId,
      query: "authentication token refresh",
      workspaceId: undefined,
      toolTypes: ["github"],
      contentTypes: undefined,
      k: 5,
      threshold: 0.3,
    });
    console.log("GitHub results:", JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("GitHub search FAILED:", err.message);
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
