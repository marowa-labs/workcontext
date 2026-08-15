// Test the user's BYOK Google key against the Gemini API directly
require("dotenv").config();
const { BYOKService } = require("../src/services/byokService");

(async () => {
  const userId = "f619be46-e22d-4e4e-b7fb-8181099c8cba";
  const key = await BYOKService.getDecryptedKey(userId, "google");
  if (!key) {
    console.error("No BYOK Google key found");
    process.exit(1);
  }
  console.log(
    "BYOK Google key found, length:",
    key.length,
    "prefix:",
    key.slice(0, 8),
  );

  // List available models
  const listRes = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?key=" + key,
  );
  const listJson = await listRes.json();
  if (listJson.error) {
    console.error("List models error:", JSON.stringify(listJson.error));
  } else {
    const models = (listJson.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("embedContent"))
      .map((m) => m.name);
    console.log("Models supporting embedContent:", models);
  }

  // Try embedding with text-embedding-004
  const embedRes = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" +
      key,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: "test embedding" }] },
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    },
  );
  const embedJson = await embedRes.json();
  if (embedJson.error) {
    console.error("embedContent error:", JSON.stringify(embedJson.error));
  } else {
    console.log(
      "embedContent SUCCESS, dim:",
      embedJson.embedding?.values?.length,
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
