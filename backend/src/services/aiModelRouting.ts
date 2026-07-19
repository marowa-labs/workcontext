/**
 * Pure AI model-routing helpers.
 * Kept free of any heavy imports (Prisma, SDKs, etc.) so they can be unit
 * tested in isolation.
 */

/**
 * Normalize model names to provider-prefixed format.
 * e.g. "gpt-4o-mini" → "openai/gpt-4o-mini", "claude-sonnet-4" → "anthropic/claude-sonnet-4"
 * Does NOT depend on a hardcoded model list — works for any model name.
 */
export const normalizeModelName = (modelName: string): string => {
  // Already has a provider prefix (contains /)
  if (modelName.includes("/")) return modelName;
  // Already a Gemini model
  if (modelName.startsWith("gemini")) return modelName;
  // OpenAI model patterns: gpt-*, o1-*, o3-*, o4-*
  if (/^(gpt-|o[134]-)/.test(modelName)) return "openai/" + modelName;
  // Anthropic model patterns: claude-*
  if (modelName.startsWith("claude-")) return "anthropic/" + modelName;
  // Unknown pattern — return as-is (will be routed through OpenRouter)
  return modelName;
};

/**
 * Determine which provider to use based on the model prefix.
 * Returns the provider identifier: "gemini" | "openai" | "anthropic" | "openrouter"
 */
export const getModelProvider = (
  modelName: string,
): "gemini" | "openai" | "anthropic" | "openrouter" => {
  if (modelName.startsWith("gemini")) return "gemini";
  if (modelName.startsWith("openai/")) return "openai";
  if (modelName.startsWith("anthropic/") || modelName.startsWith("claude-"))
    return "anthropic";
  return "openrouter";
};
