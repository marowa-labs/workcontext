import crypto from "crypto";
import logger from "../monitoring/logger";

/**
 * Encryption Service for secure storage of sensitive data like API keys
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly KEY_LENGTH = 32;
  private static readonly ITERATIONS = 100000;
  private static readonly DIGEST = "sha512";

  private static masterKey: Buffer | null = null;

  /**
   * Initialize the encryption service with the master key from environment
   */
  static initialize(): void {
    const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY;
    
    if (!masterKeyHex) {
      logger.error("ENCRYPTION_MASTER_KEY not configured. BYOK features will not work.");
      throw new Error("ENCRYPTION_MASTER_KEY environment variable is required");
    }

    if (masterKeyHex.length !== 64) {
      throw new Error("ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (256 bits)");
    }

    this.masterKey = Buffer.from(masterKeyHex, "hex");
    logger.info("EncryptionService initialized successfully");
  }

  /**
   * Get the master key, initializing if necessary
   */
  private static getMasterKey(): Buffer {
    if (!this.masterKey) {
      this.initialize();
    }
    return this.masterKey!;
  }

  /**
   * Derive an encryption key from the master key and a unique salt
   */
  private static deriveKey(salt: Buffer): Buffer {
    const masterKey = this.getMasterKey();
    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST
    );
  }

  /**
   * Encrypt sensitive data (like API keys)
   * Returns a base64-encoded string containing: salt + iv + authTag + encryptedData
   */
  static encrypt(plaintext: string): string {
    try {
      const masterKey = this.getMasterKey();
      
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      // Derive encryption key from master key and salt
      const key = this.deriveKey(salt);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine all components: salt + iv + authTag + encryptedData
      const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, "hex")
      ]);
      
      // Return base64 encoded result
      return combined.toString("base64");
    } catch (error: any) {
      logger.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt data that was encrypted with the encrypt method
   */
  static decrypt(ciphertext: string): string {
    try {
      // Decode base64
      const combined = Buffer.from(ciphertext, "base64");
      
      // Extract components
      const salt = combined.slice(0, this.SALT_LENGTH);
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const authTag = combined.slice(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH
      );
      const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH + this.AUTH_TAG_LENGTH);
      
      // Derive the key
      const key = this.deriveKey(salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString("utf8");
    } catch (error: any) {
      logger.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data - invalid ciphertext or corrupted data");
    }
  }

  /**
   * Validate that an API key format looks correct (basic validation)
   */
  static validateApiKeyFormat(key: string, provider: "google" | "anthropic" | "openai"): boolean {
    if (!key || key.length < 10) return false;
    
    switch (provider) {
      case "google":
        // Google AI Studio keys typically start with specific prefixes
        return key.startsWith("AIza") || key.length >= 39;
      case "anthropic":
        // Anthropic keys start with sk-ant-
        return key.startsWith("sk-ant-") || key.startsWith("sk-ant-api03-");
      case "openai":
        // OpenAI keys start with sk-
        return key.startsWith("sk-") && key.length >= 20;
      default:
        return false;
    }
  }

  /**
   * Mask an API key for display (show only first 4 and last 4 characters)
   */
  static maskApiKey(key: string): string {
    if (!key || key.length < 12) return "****";
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  /**
   * Generate a secure random key for testing/demo purposes
   */
  static generateRandomKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

export default EncryptionService;
