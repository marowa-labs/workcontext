import WordLimitService from "../../../lib/utils/wordLimitService";
import type { WordLimitInfo } from "../../../lib/utils/wordLimitService";

// Mock the BillingService
jest.mock("../../../lib/utils/billingService", () => {
  return {
    __esModule: true,
    default: {
      getCurrentSubscription: jest.fn(),
    },
  };
});

describe("WordLimitService", () => {
  let wordLimitService: WordLimitService;

  beforeEach(() => {
    wordLimitService = WordLimitService.getInstance();
    wordLimitService.clearCache();
  });

  describe("canAddWords", () => {
    it("should allow adding words for researcher plan (unlimited)", async () => {
      const mockSubscription = {
        plan: { id: "researcher" },
        usage: { words: { used: 1000000, limit: -1 } },
      };

      const billingService =
        require("../../../lib/utils/billingService").default;
      billingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

      const result = await wordLimitService.canAddWords(5000);

      expect(result.canAddWords).toBe(true);
      expect(result.wordLimit).toBe(-1); // Unlimited
    });

    it("should allow adding words when within limit", async () => {
      const mockSubscription = {
        plan: { id: "student" },
        usage: { words: { used: 20000, limit: 50000 } },
      };

      const billingService =
        require("../../../lib/utils/billingService").default;
      billingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

      const result = await wordLimitService.canAddWords(20000);

      expect(result.canAddWords).toBe(true);
      expect(result.wordsUsed).toBe(20000);
      expect(result.wordLimit).toBe(50000);
    });

    it("should prevent adding words when exceeding limit", async () => {
      const mockSubscription = {
        plan: { id: "free" },
        usage: { words: { used: 4000, limit: 5000 } },
      };

      const billingService =
        require("../../../lib/utils/billingService").default;
      billingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

      const result = await wordLimitService.canAddWords(2000);

      expect(result.canAddWords).toBe(false);
      expect(result.message).toContain("You've reached your word limit");
    });

    it("should handle errors gracefully", async () => {
      const billingService =
        require("../../../lib/utils/billingService").default;
      billingService.getCurrentSubscription.mockRejectedValue(
        new Error("Network error")
      );

      const result = await wordLimitService.canAddWords(1000);

      // Should allow adding words when there's an error (fail gracefully)
      expect(result.canAddWords).toBe(true);
    });
  });

  describe("getWordLimitInfo", () => {
    it("should return word limit information", async () => {
      const mockSubscription = {
        plan: { id: "student" },
        usage: { words: { used: 30000, limit: 50000 } },
      };

      const billingService =
        require("../../../lib/utils/billingService").default;
      billingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

      const result = await wordLimitService.getWordLimitInfo();

      expect(result.wordsUsed).toBe(30000);
      expect(result.wordLimit).toBe(50000);
      expect(result.plan).toBe("student");
    });
  });
});
