import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { ResearchCoPilotService } from "../services/researchCoPilotService";

async function testPlagiarism() {
  console.log("Starting Plagiarism Detection Test...");

  // 1. Test with known text (Attention Is All You Need)
  const knownText = `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.`;

  console.log("\n--- Test 1: Known Text (Expecting High Similarity) ---");
  console.log(`Text: "${knownText.substring(0, 50)}..."`);

  try {
    const result1 = await ResearchCoPilotService.checkPlagiarism(knownText);
    console.log("Result:", JSON.stringify(result1, null, 2));

    if (result1.score > 75) {
      console.log("✅ PASS: High similarity detected.");
    } else {
      console.log("❌ FAIL: High similarity NOT detected.");
    }
  } catch (error) {
    console.error("Error in Test 1:", error);
  }

  // 2. Test with unique text
  const uniqueText = `This is a completely unique sentence regarding the scholarship of underwater basket weaving in the context of neo-classical architecture on Mars in the year 3000.`;

  console.log("\n--- Test 2: Unique Text (Expecting Low Similarity) ---");
  console.log(`Text: "${uniqueText.substring(0, 50)}..."`);

  try {
    const result2 = await ResearchCoPilotService.checkPlagiarism(uniqueText);
    console.log("Result:", JSON.stringify(result2, null, 2));

    if (result2.score < 50) {
      console.log("✅ PASS: Low similarity detected.");
    } else {
      console.log("❌ FAIL: False positive detected.");
    }
  } catch (error) {
    console.error("Error in Test 2:", error);
  }
}

testPlagiarism();
