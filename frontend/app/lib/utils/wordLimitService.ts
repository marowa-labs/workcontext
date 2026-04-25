import BillingService from "./billingService";

export interface WordLimitResult {
  wordCount: number;
  characterCount: number;
  characterCountWithSpaces: number;
  isWithinLimit: boolean;
  limit?: number;
}

export interface WordLimitInfo {
  wordsUsed: number;
  wordLimit: number;
  wordsRemaining?: number;
  plan: string;
  canAddWords: boolean;
  message?: string;
}

class WordLimitService {
  private static instance: WordLimitService;
  private cache: Map<string, any>;
  private cacheTimestamp: number | null = null;
  private cacheTTL: number = 30000; // 30 seconds

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): WordLimitService {
    if (!WordLimitService.instance) {
      WordLimitService.instance = new WordLimitService();
    }
    return WordLimitService.instance;
  }

  /**
   * Calculate word count and character count from text content
   * @param text The text content to analyze
   * @returns Word and character count information
   */
  public calculateWordCount = (text: string): WordLimitResult => {
    // Count words by splitting on whitespace and filtering out empty strings
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const wordCount = words.length;

    // Count characters excluding spaces
    const characterCount = text.replace(/\s/g, "").length;

    // Count characters including spaces
    const characterCountWithSpaces = text.length;

    return {
      wordCount,
      characterCount,
      characterCountWithSpaces,
      isWithinLimit: true, // Default to true, add limit logic if needed
    };
  };

  /**
   * Check if text is within specified word limit
   * @param text The text content to check
   * @param limit The maximum allowed word count (optional)
   * @returns Word count information with limit status
   */
  public checkWordLimit = (text: string, limit?: number): WordLimitResult => {
    const result = this.calculateWordCount(text);

    if (limit !== undefined) {
      return {
        ...result,
        limit,
        isWithinLimit: result.wordCount <= limit,
      };
    }

    return {
      ...result,
      isWithinLimit: true,
    };
  };

  /**
   * Get word count for Yjs document content
   * @param ydocContent The Yjs document content to analyze
   * @returns Word count information
   */
  public getYjsWordCount = (ydocContent: any): WordLimitResult => {
    // This would typically process Yjs document structure
    // For now, we'll convert to string and calculate
    let textContent = "";

    if (typeof ydocContent === "string") {
      textContent = ydocContent;
    } else if (ydocContent && typeof ydocContent === "object") {
      // Handle Yjs document structure if needed
      textContent = JSON.stringify(ydocContent);
    }

    return this.calculateWordCount(textContent);
  };

  /**
   * Get AI word limit information
   * @returns Word limit information based on user's subscription
   */
  public async getAIWordLimitInfo(): Promise<WordLimitInfo> {
    // Check if we have cached data and if it's still valid
    if (this.cache.has("wordLimitInfo") && this.cacheTimestamp) {
      const now = Date.now();
      if (now - this.cacheTimestamp < this.cacheTTL) {
        return this.cache.get("wordLimitInfo");
      }
    }

    try {
      const subscription = await BillingService.getCurrentSubscription();
      const wordsUsed = subscription.usage.words.used;
      const wordLimit = subscription.usage.words.limit;
      const plan = subscription.plan.id;

      const result: WordLimitInfo = {
        wordsUsed,
        wordLimit,
        plan,
        canAddWords: wordLimit === -1 || wordsUsed < wordLimit, // -1 means unlimited
      };

      // Cache the result
      this.cache.set("wordLimitInfo", result);
      this.cacheTimestamp = Date.now();

      return result;
    } catch (error) {
      console.error("Error getting AI word limit info:", error);
      // Return default values in case of error
      return {
        wordsUsed: 0,
        wordLimit: 10000, // Default limit
        plan: "free",
        canAddWords: true,
      };
    }
  }

  /**
   * Check if user can add a certain number of words based on their subscription
   * @param wordsToAdd Number of words the user wants to add
   * @returns Information about whether words can be added
   */
  public async canAddWords(wordsToAdd: number): Promise<WordLimitInfo> {
    try {
      const subscription = await BillingService.getCurrentSubscription();
      const wordsUsed = subscription.usage.words.used;
      const wordLimit = subscription.usage.words.limit;
      const plan = subscription.plan.id;

      // Calculate if adding these words would exceed the limit
      const totalAfterAddition = wordsUsed + wordsToAdd;
      const canAddWords = wordLimit === -1 || totalAfterAddition <= wordLimit; // -1 means unlimited

      const result: WordLimitInfo = {
        wordsUsed,
        wordLimit,
        plan,
        canAddWords,
      };

      if (!canAddWords) {
        result.message = `You've reached your word limit. Current usage: ${wordsUsed}/${wordLimit === -1 ? "Unlimited" : wordLimit} words.`;
      }

      return result;
    } catch (error) {
      console.error("Error checking if words can be added:", error);
      // Return true in case of error to not block user functionality
      return {
        wordsUsed: 0,
        wordLimit: 10000,
        plan: "free",
        canAddWords: true,
      };
    }
  }

  /**
   * Clear the service cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = null;
  }

  /**
   * Get word limit information (alias for getAIWordLimitInfo)
   * @returns Word limit information based on user's subscription
   */
  public async getWordLimitInfo(): Promise<WordLimitInfo> {
    return this.getAIWordLimitInfo();
  }
}

export default WordLimitService;
