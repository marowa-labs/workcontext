import * as crypto from "crypto";

/**
 * Generates a SHA-256 hash for the given content
 * This is used to create a unique fingerprint for document content
 * to enable caching of plagiarism results for identical content
 *
 * @param content - The document content to hash
 * @returns A hexadecimal string representing the SHA-256 hash
 */
export function generateContentHash(content: string): string {
  // Normalize the content by trimming whitespace and converting to lowercase
  // This ensures that minor formatting differences don't create different hashes
  const normalizedContent = content.trim().toLowerCase();

  // Create SHA-256 hash
  const hash = crypto.createHash("sha256");
  hash.update(normalizedContent);

  return hash.digest("hex");
}

/**
 * Generates a hash for content while preserving case sensitivity
 * Useful when case matters for determining content uniqueness
 *
 * @param content - The document content to hash
 * @returns A hexadecimal string representing the SHA-256 hash
 */
export function generateCaseSensitiveContentHash(content: string): string {
  // Normalize the content by just trimming whitespace
  const normalizedContent = content.trim();

  // Create SHA-256 hash
  const hash = crypto.createHash("sha256");
  hash.update(normalizedContent);

  return hash.digest("hex");
}
