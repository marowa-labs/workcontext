import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import WordLimitService from "../../../lib/utils/wordLimitService";

// Mock the entire BillingService module
jest.mock("../../../lib/utils/billingService", () => {
  const mockGetCurrentSubscription = jest.fn();

  return {
    __esModule: true,
    default: {
      getCurrentSubscription: mockGetCurrentSubscription,
    },
  };
});

describe("Word Limit Integration Test", () => {
  beforeEach(() => {
    // Clear cache before each test
    WordLimitService.getInstance().clearCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should allow unlimited words for researcher plan", async () => {
    // Mock researcher plan with high usage but unlimited limit
    const mockSubscription = {
      plan: { id: "researcher", name: "Researcher Plan" },
      subscription: { status: "active" },
      usage: {
        words: { used: 1000000, limit: -1, percentage: 0 },
      },
    };

    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

    const wordLimitService = WordLimitService.getInstance();
    const result = await wordLimitService.canAddWords(50000);

    expect(result.canAddWords).toBe(true);
    expect(result.wordLimit).toBe(-1); // Unlimited
    expect(result.plan).toBe("researcher");
  });

  it("should prevent adding words when free plan limit is exceeded", async () => {
    // Mock free plan nearing limit
    const mockSubscription = {
      plan: { id: "free", name: "Free Plan" },
      subscription: { status: "active" },
      usage: {
        words: { used: 4800, limit: 5000, percentage: 96 },
      },
    };

    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

    const wordLimitService = WordLimitService.getInstance();
    // Try to add 300 words when only 200 remain
    const result = await wordLimitService.canAddWords(300);

    expect(result.canAddWords).toBe(false);
    expect(result.wordsUsed).toBe(4800);
    expect(result.wordLimit).toBe(5000);
    expect(result.message).toContain("You've reached your word limit");
  });

  it("should allow adding words when within student plan limit", async () => {
    // Mock student plan with room for more words
    const mockSubscription = {
      plan: { id: "student", name: "Student Pro Plan" },
      subscription: { status: "active" },
      usage: {
        words: { used: 30000, limit: 50000, percentage: 60 },
      },
    };

    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

    const wordLimitService = WordLimitService.getInstance();
    // Try to add 10000 words when 20000 remain
    const result = await wordLimitService.canAddWords(10000);

    expect(result.canAddWords).toBe(true);
    expect(result.wordsUsed).toBe(30000);
    expect(result.wordLimit).toBe(50000);
    expect(result.wordsRemaining).toBe(20000);
  });

  it("should handle network errors gracefully", async () => {
    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockRejectedValue(
      new Error("Network error")
    );

    const wordLimitService = WordLimitService.getInstance();
    const result = await wordLimitService.canAddWords(1000);

    // Should allow adding words when there's a network error (fail gracefully)
    expect(result.canAddWords).toBe(true);
    expect(result.plan).toBe("free"); // Should default to free plan when error occurs
  });

  it("should cache subscription data and reuse it", async () => {
    const mockSubscription = {
      plan: { id: "student", name: "Student Pro Plan" },
      subscription: { status: "active" },
      usage: {
        words: { used: 25000, limit: 50000, percentage: 50 },
      },
    };

    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

    const wordLimitService = WordLimitService.getInstance();

    // First call should hit the service
    await wordLimitService.canAddWords(5000);
    expect(BillingService.getCurrentSubscription).toHaveBeenCalledTimes(1);

    // Second call should use cached data
    await wordLimitService.canAddWords(3000);
    expect(BillingService.getCurrentSubscription).toHaveBeenCalledTimes(1); // Still 1

    // Clear cache and call again
    wordLimitService.clearCache();
    await wordLimitService.canAddWords(2000);
    expect(BillingService.getCurrentSubscription).toHaveBeenCalledTimes(2); // Now 2
  });
});
