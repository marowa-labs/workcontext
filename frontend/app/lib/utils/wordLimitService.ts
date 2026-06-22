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

  private constructor() {}

  public static getInstance(): WordLimitService {
    if (!WordLimitService.instance) {
      WordLimitService.instance = new WordLimitService();
    }
    return WordLimitService.instance;
  }

  /**
   * Calculate word count and character count from text
   */
  public calculateWordCount(text: string): WordLimitResult {
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const wordCount = words.length;
    const characterCount = text.replace(/\s/g, "").length;
    const characterCountWithSpaces = text.length;

    return {
      wordCount,
      characterCount,
      characterCountWithSpaces,
      isWithinLimit: true,
    };
  }

  /**
   * Check if text is within a word limit
   */
  public checkWordLimit(text: string, limit?: number): WordLimitResult {
    const result = this.calculateWordCount(text);
    if (limit !== undefined && limit > 0) {
      result.isWithinLimit = result.wordCount <= limit;
      result.limit = limit;
    }
    return result;
  }

  /**
   * Get word count from Yjs document content
   */
  public getYjsWordCount(ydocContent: any): number {
    let textContent = "";
    try {
      if (typeof ydocContent === "string") {
        textContent = ydocContent;
      } else {
        textContent = JSON.stringify(ydocContent);
      }
    } catch {
      textContent = "";
    }
    return this.calculateWordCount(textContent).wordCount;
  }

  /**
   * Get AI word limit information - all users have unlimited words
   */
  public async getAIWordLimitInfo(): Promise<WordLimitInfo> {
    return {
      wordsUsed: 0,
      wordLimit: -1,
      plan: "free",
      canAddWords: true,
    };
  }

  /**
   * Check if user can add words - all users have unlimited
   */
  public async canAddWords(wordsToAdd: number): Promise<WordLimitInfo> {
    return {
      wordsUsed: 0,
      wordLimit: -1,
      plan: "free",
      canAddWords: true,
    };
  }

  /**
   * Clear the service cache
   */
  public clearCache(): void {
    // No-op - no cache needed
  }
}

export default WordLimitService.getInstance();
