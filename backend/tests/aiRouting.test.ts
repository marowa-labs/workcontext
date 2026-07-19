/**
 * Lightweight unit test for AI model routing + API-key format validation.
 * Run with: npx tsx tests/aiRouting.test.ts
 *
 * No test framework is installed; this script uses node:assert and exits
 * non-zero on the first failure.
 */
import assert from "node:assert/strict";
import {
  normalizeModelName,
  getModelProvider,
} from "../src/services/aiModelRouting";
import { EncryptionService } from "../src/services/encryptionService";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("normalizeModelName:");
check("leaves gemini models untouched", () => {
  assert.equal(normalizeModelName("gemini-2.5-pro"), "gemini-2.5-pro");
});
check("prefixes gpt-* with openai/", () => {
  assert.equal(normalizeModelName("gpt-4o-mini"), "openai/gpt-4o-mini");
});
check("prefixes o1/o3/o4 with openai/", () => {
  assert.equal(normalizeModelName("o3-mini"), "openai/o3-mini");
});
check("prefixes claude-* with anthropic/", () => {
  assert.equal(
    normalizeModelName("claude-3-5-haiku-20241022"),
    "anthropic/claude-3-5-haiku-20241022",
  );
});
check("keeps already-prefixed names", () => {
  assert.equal(normalizeModelName("openai/gpt-4o"), "openai/gpt-4o");
  assert.equal(
    normalizeModelName("anthropic/claude-sonnet-4"),
    "anthropic/claude-sonnet-4",
  );
});
check("unknown patterns pass through (routed to OpenRouter)", () => {
  assert.equal(normalizeModelName("mistralai/mixtral-8x7b"), "mistralai/mixtral-8x7b");
});

console.log("getModelProvider:");
check("routes gemini-* to gemini", () => {
  assert.equal(getModelProvider("gemini-2.0-flash"), "gemini");
});
check("routes openai/* to openai", () => {
  assert.equal(getModelProvider("openai/gpt-4o"), "openai");
});
check("routes anthropic/* to anthropic", () => {
  assert.equal(getModelProvider("anthropic/claude-sonnet-4"), "anthropic");
});
check("routes claude-* to anthropic", () => {
  assert.equal(getModelProvider("claude-3-opus-20240229"), "anthropic");
});
check("routes everything else to openrouter", () => {
  assert.equal(getModelProvider("mistralai/mixtral-8x7b"), "openrouter");
  assert.equal(getModelProvider("some-custom-model"), "openrouter");
});

console.log("EncryptionService.validateApiKeyFormat:");
check("accepts Google AIza keys", () => {
  assert.equal(
    EncryptionService.validateApiKeyFormat(
      "AIzaSy" + "a".repeat(33),
      "google",
    ),
    true,
  );
});
check("accepts long Google keys without AIza prefix", () => {
  assert.equal(
    EncryptionService.validateApiKeyFormat("A".repeat(39), "google"),
    true,
  );
});
check("rejects short Google keys", () => {
  assert.equal(
    EncryptionService.validateApiKeyFormat("AIzaShort", "google"),
    false,
  );
});
check("accepts Anthropic sk-ant keys", () => {
  assert.equal(
    EncryptionService.validateApiKeyFormat(
      "sk-ant-api03-" + "a".repeat(40),
      "anthropic",
    ),
    true,
  );
});
check("rejects non-anthropic keys for anthropic", () => {
  assert.equal(
    EncryptionService.validateApiKeyFormat("sk-wrong", "anthropic"),
    false,
  );
});
check("accepts OpenAI sk- keys", () => {
  assert.equal(
    EncryptionService.validateApiKeyFormat("sk-" + "a".repeat(40), "openai"),
    true,
  );
});
check("rejects short OpenAI keys", () => {
  assert.equal(EncryptionService.validateApiKeyFormat("sk-short", "openai"), false);
});
check("rejects empty keys", () => {
  assert.equal(EncryptionService.validateApiKeyFormat("", "google"), false);
});

console.log(`\nAll ${passed} checks passed.`);
