import CitationAccessControl from "../../../lib/utils/citationAccessControl";
import BillingService from "../../../lib/utils/billingService";

// Mock the BillingService
jest.mock("../../../lib/utils/billingService");

describe("CitationAccessControl", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear cache before each test
    CitationAccessControl.clearCache();
  });

  describe("getUserCitationAccess", () => {
    it("should return correct access info for free plan", async () => {
      const mockSubscription = {
        plan: { id: "free", name: "Free Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const accessInfo = await CitationAccessControl.getUserCitationAccess();

      expect(accessInfo).toEqual({
        canAccess: true,
        plan: "free",
        maxFormats: 5,
        canCreateCustomFormats: false,
        canAccessInstitutionalFormats: false,
        message:
          "Upgrade to access more citation formats and advanced features.",
        upgradePath: "/billing",
      });
    });

    it("should return correct access info for onetime plan", async () => {
      const mockSubscription = {
        plan: { id: "onetime", name: "One Time User Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const accessInfo = await CitationAccessControl.getUserCitationAccess();

      expect(accessInfo).toEqual({
        canAccess: true,
        plan: "onetime",
        maxFormats: Infinity,
        canCreateCustomFormats: false,
        canAccessInstitutionalFormats: false,
      });
    });

    it("should return correct access info for student plan", async () => {
      const mockSubscription = {
        plan: { id: "student", name: "Student Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const accessInfo = await CitationAccessControl.getUserCitationAccess();

      expect(accessInfo).toEqual({
        canAccess: true,
        plan: "student",
        maxFormats: Infinity,
        canCreateCustomFormats: true,
        canAccessInstitutionalFormats: false,
      });
    });

    it("should return correct access info for researcher plan", async () => {
      const mockSubscription = {
        plan: { id: "researcher", name: "Researcher Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const accessInfo = await CitationAccessControl.getUserCitationAccess();

      expect(accessInfo).toEqual({
        canAccess: true,
        plan: "researcher",
        maxFormats: Infinity,
        canCreateCustomFormats: true,
        canAccessInstitutionalFormats: true,
      });
    });

    it("should return correct access info for institutional plan", async () => {
      const mockSubscription = {
        plan: { id: "institutional", name: "Institutional Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const accessInfo = await CitationAccessControl.getUserCitationAccess();

      expect(accessInfo).toEqual({
        canAccess: true,
        plan: "institutional",
        maxFormats: Infinity,
        canCreateCustomFormats: true,
        canAccessInstitutionalFormats: true,
      });
    });

    it("should handle subscription service errors gracefully", async () => {
      (BillingService.getCurrentSubscription as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const accessInfo = await CitationAccessControl.getUserCitationAccess();

      expect(accessInfo).toEqual({
        canAccess: true,
        plan: "unknown",
        maxFormats: 5,
        canCreateCustomFormats: false,
        canAccessInstitutionalFormats: false,
        message:
          "Unable to verify subscription status. Showing limited citation features.",
        upgradePath: "/billing",
      });
    });
  });

  describe("canUseCitationFormat", () => {
    it("should allow free users to use standard formats", async () => {
      const mockSubscription = {
        plan: { id: "free", name: "Free Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await CitationAccessControl.canUseCitationFormat("apa");
      expect(result.allowed).toBe(true);
    });

    it("should restrict free users from using non-standard formats", async () => {
      const mockSubscription = {
        plan: { id: "free", name: "Free Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await CitationAccessControl.canUseCitationFormat("ieee");
      expect(result.allowed).toBe(false);
      expect(result.message).toBe(
        "This citation format is not available on your current plan. Upgrade to access more formats."
      );
    });

    it("should allow paid users to use all formats", async () => {
      const mockSubscription = {
        plan: { id: "student", name: "Student Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await CitationAccessControl.canUseCitationFormat("ieee");
      expect(result.allowed).toBe(true);
    });
  });

  describe("canCreateCustomFormats", () => {
    it("should deny custom format creation for free users", async () => {
      const mockSubscription = {
        plan: { id: "free", name: "Free Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await CitationAccessControl.canCreateCustomFormats();
      expect(result.allowed).toBe(false);
      expect(result.message).toBe(
        "Custom citation format creation is not available on your current plan."
      );
    });

    it("should allow custom format creation for student users", async () => {
      const mockSubscription = {
        plan: { id: "student", name: "Student Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await CitationAccessControl.canCreateCustomFormats();
      expect(result.allowed).toBe(true);
    });

    it("should allow custom format creation for researcher users", async () => {
      const mockSubscription = {
        plan: { id: "researcher", name: "Researcher Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result = await CitationAccessControl.canCreateCustomFormats();
      expect(result.allowed).toBe(true);
    });
  });

  describe("canAccessInstitutionalFormats", () => {
    it("should deny institutional format access for free users", async () => {
      const mockSubscription = {
        plan: { id: "free", name: "Free Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result =
        await CitationAccessControl.canAccessInstitutionalFormats();
      expect(result.allowed).toBe(false);
      expect(result.message).toBe(
        "Institutional citation formats are not available on your current plan."
      );
    });

    it("should deny institutional format access for student users", async () => {
      const mockSubscription = {
        plan: { id: "student", name: "Student Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result =
        await CitationAccessControl.canAccessInstitutionalFormats();
      expect(result.allowed).toBe(false);
      expect(result.message).toBe(
        "Institutional citation formats are not available on your current plan."
      );
    });

    it("should allow institutional format access for researcher users", async () => {
      const mockSubscription = {
        plan: { id: "researcher", name: "Researcher Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result =
        await CitationAccessControl.canAccessInstitutionalFormats();
      expect(result.allowed).toBe(true);
    });

    it("should allow institutional format access for institutional users", async () => {
      const mockSubscription = {
        plan: { id: "institutional", name: "Institutional Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      const result =
        await CitationAccessControl.canAccessInstitutionalFormats();
      expect(result.allowed).toBe(true);
    });
  });

  describe("cache functionality", () => {
    it("should use cached data for subsequent calls", async () => {
      const mockSubscription = {
        plan: { id: "student", name: "Student Plan" },
      };

      (
        BillingService.getCurrentSubscription as jest.Mock
      ).mockResolvedValueOnce(mockSubscription);

      // First call
      await CitationAccessControl.getUserCitationAccess();

      // Second call should use cache
      await CitationAccessControl.getUserCitationAccess();

      // Expect the service to be called only once
      expect(BillingService.getCurrentSubscription).toHaveBeenCalledTimes(1);
    });

    it("should clear cache when clearCache is called", async () => {
      const mockSubscription = {
        plan: { id: "student", name: "Student Plan" },
      };

      (BillingService.getCurrentSubscription as jest.Mock).mockResolvedValue(
        mockSubscription
      );

      // First call
      await CitationAccessControl.getUserCitationAccess();

      // Clear cache
      CitationAccessControl.clearCache();

      // Second call should fetch fresh data
      await CitationAccessControl.getUserCitationAccess();

      // Expect the service to be called twice
      expect(BillingService.getCurrentSubscription).toHaveBeenCalledTimes(2);
    });
  });
});
