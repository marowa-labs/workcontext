// Test the BYOK embedding fallback directly
require("dotenv").config();
const { EmbeddingService } = require("../src/services/embeddingService");

(async () => {
  const userId = "f619be46-e22d-4e4e-b7fb-8181099c8cba";

  console.log("Testing embed() with userId (BYOK fallback)...");
  try {
    const result = await EmbeddingService.embed(
      "ColabWize Tackle Later meeting notes about the collaboration platform",
      userId,
    );
    console.log("embed() SUCCESS:", {
      dim: result.dim,
      vectorLen: result.vector.length,
    });
  } catch (err) {
    console.error("embed() FAILED:", err.message);
  }

  console.log("\nTesting embedBatch() with userId (BYOK fallback)...");
  try {
    const results = await EmbeddingService.embedBatch(
      [
        "First chunk of text about ColabWize",
        "Second chunk about the launch plan",
      ],
      32,
      userId,
    );
    console.log(
      "embedBatch() SUCCESS:",
      results.map((r) => (r ? { dim: r.dim, len: r.vector.length } : null)),
    );
  } catch (err) {
    console.error("embedBatch() FAILED:", err.message);
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
