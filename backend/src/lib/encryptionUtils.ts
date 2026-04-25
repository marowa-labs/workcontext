import * as crypto from "crypto";
import logger from "../monitoring/logger";
import { SecretsService } from "../services/secrets-service";

// Get encryption key from environment variables or generate a default one
// In production, this should be a securely generated and stored key
const DEFAULT_ENCRYPTION_KEY = "default-key-for-development-only-32bytes!";
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Gets the encryption key from secrets service
 * @returns Encryption key as string
 */
async function getEncryptionKey(): Promise<string> {
  const key = await SecretsService.getTokenEncryptionKey();
  return key || DEFAULT_ENCRYPTION_KEY;
}

/**
 * Encrypts a string using AES-256-CBC encryption
 * @param text The text to encrypt
 * @returns Encrypted text as hex string
 */
export async function encrypt(text: string): Promise<string> {
  try {
    const encryptionKey = await getEncryptionKey();

    // Ensure key is 32 bytes for AES-256
    let key = Buffer.from(encryptionKey, "utf8");
    if (key.length > 32) {
      key = key.slice(0, 32); // Truncate if too long
    } else if (key.length < 32) {
      // Pad with zeros if too short
      const paddedKey = Buffer.alloc(32);
      key.copy(paddedKey);
      key = paddedKey;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Prepend IV to encrypted data so we can use it for decryption
    const encryptedWithIv = iv.toString("hex") + ":" + encrypted;
    return encryptedWithIv;
  } catch (error) {
    logger.error("Error encrypting text", { error });
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypts a string using AES-256-CBC encryption
 * @param encryptedText The encrypted text to decrypt
 * @returns Decrypted text
 */
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const encryptionKey = await getEncryptionKey();

    // Ensure key is 32 bytes for AES-256
    let key = Buffer.from(encryptionKey, "utf8");
    if (key.length > 32) {
      key = key.slice(0, 32); // Truncate if too long
    } else if (key.length < 32) {
      // Pad with zeros if too short
      const paddedKey = Buffer.alloc(32);
      key.copy(paddedKey);
      key = paddedKey;
    }

    // Split IV and encrypted data
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts[0], "hex");
    const encrypted = textParts.slice(1).join(":"); // Join in case there were colons in the encrypted data

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Error decrypting text", { error });
    throw new Error("Decryption failed");
  }
}

/**
 * Hashes a string using SHA-256
 * @param text The text to hash
 * @returns Hashed text as hex string
 */
export function hash(text: string): string {
  try {
    const hash = crypto.createHash("sha256");
    hash.update(text);
    return hash.digest("hex");
  } catch (error) {
    logger.error("Error hashing text", { error });
    throw new Error("Hashing failed");
  }
}
