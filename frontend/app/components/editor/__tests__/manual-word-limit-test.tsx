import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import WordLimitService from "../../../lib/utils/wordLimitService";
import WordLimitWarning from "../word-limit-warning";

// Mock window.location
const mockLocation = {
  href: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

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

describe("Manual Word Limit Test", () => {
  beforeEach(() => {
    // Clear any cached data
    WordLimitService.getInstance().clearCache();
    mockLocation.href = "";

    // Clear mocks
    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockClear();
  });

  it("should display word limit warning when limit is exceeded", async () => {
    // Mock subscription data showing user is close to limit
    const mockSubscription = {
      plan: { id: "free", name: "Free Plan" },
      usage: {
        words: {
          used: 4900,
          limit: 5000,
          percentage: 98,
        },
      },
    };

    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

    // Simulate user trying to add content that would exceed the limit
    const wordLimitService = WordLimitService.getInstance();
    const result = await wordLimitService.canAddWords(200); // Trying to add 200 words when only 100 remain

    expect(result.canAddWords).toBe(false);
    expect(result.message).toContain("You've reached your word limit");
    expect(result.plan).toBe("free");
  });

  it("should allow words for researcher plan", async () => {
    // Mock subscription data for researcher plan (unlimited)
    const mockSubscription = {
      plan: { id: "researcher", name: "Researcher Plan" },
      usage: {
        words: {
          used: 1000000,
          limit: -1, // Unlimited
          percentage: 0,
        },
      },
    };

    const BillingService = require("../../../lib/utils/billingService").default;
    BillingService.getCurrentSubscription.mockResolvedValue(mockSubscription);

    // Simulate user trying to add content
    const wordLimitService = WordLimitService.getInstance();
    const result = await wordLimitService.canAddWords(100000);

    expect(result.canAddWords).toBe(true);
    expect(result.wordLimit).toBe(-1); // Unlimited
    expect(result.plan).toBe("researcher");
  });

  it("should render word limit warning component correctly", () => {
    const mockOnUpgrade = jest.fn();

    render(
      <WordLimitWarning
        message="You've reached your word limit of 5,000 words. Please upgrade your plan to add more content."
        onUpgrade={mockOnUpgrade}
        plan="free"
      />
    );

    // Check that the warning message is displayed
    expect(screen.getByText("Word Limit Reached")).toBeInTheDocument();
    expect(
      screen.getByText(/You've reached your word limit/)
    ).toBeInTheDocument();

    // Check that the upgrade button is present for non-researcher plans
    const upgradeButton = screen.getByRole("button", { name: /Upgrade Plan/ });
    expect(upgradeButton).toBeInTheDocument();

    // Click the upgrade button
    fireEvent.click(upgradeButton);
    expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
  });

  it("should not show upgrade button for researcher plan", () => {
    render(
      <WordLimitWarning
        message="You've reached your word limit"
        onUpgrade={jest.fn()}
        plan="researcher"
      />
    );

    // Check that the upgrade button is NOT present for researcher plan
    expect(
      screen.queryByRole("button", { name: /Upgrade Plan/ })
    ).not.toBeInTheDocument();
  });
});
