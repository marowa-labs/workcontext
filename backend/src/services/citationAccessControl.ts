import logger from "../monitoring/logger";
import { SubscriptionService } from "./subscriptionService";

interface CitationAccessInfo {
  canAccess: boolean;
  plan: string;
  maxFormats: number;
  canCreateCustomFormats: boolean;
  canAccessInstitutionalFormats: boolean;
  message?: string;
}

interface CitationPlanLimits {
  maxFormats: number;
  canCreateCustomFormats: boolean;
  canAccessInstitutionalFormats: boolean;
}

export class CitationAccessControl {
  // Define citation format limits based on subscription plans - ALL SET TO UNLIMITED
  private static readonly PLAN_LIMITS: Record<string, CitationPlanLimits> = {
    free: {
      maxFormats: Infinity, // Remove limitation
      canCreateCustomFormats: true, // Allow custom formats for all
      canAccessInstitutionalFormats: true, // Allow institutional formats for all
    },
    onetime: {
      maxFormats: Infinity,
      canCreateCustomFormats: true,
      canAccessInstitutionalFormats: true,
    },
    student: {
      maxFormats: Infinity,
      canCreateCustomFormats: true,
      canAccessInstitutionalFormats: true,
    },
    researcher: {
      maxFormats: Infinity,
      canCreateCustomFormats: true,
      canAccessInstitutionalFormats: true,
    },
    institutional: {
      maxFormats: Infinity,
      canCreateCustomFormats: true,
      canAccessInstitutionalFormats: true,
    },
  };

  // Check if user can access citation features based on their subscription - UPDATED FOR UNLIMITED ACCESS
  static async checkCitationAccess(
    userId: string
  ): Promise<CitationAccessInfo> {
    try {
      // Get user's subscription plan
      const subscriptionInfo =
        await SubscriptionService.getUserPlanInfo(userId);
      const plan = subscriptionInfo?.plan?.id || "free";

      // Get plan limits - NOW ALL PLANS HAVE UNLIMITED ACCESS
      const limits = this.PLAN_LIMITS[plan] || this.PLAN_LIMITS.free;

      return {
        canAccess: true,
        plan,
        maxFormats: limits.maxFormats,
        canCreateCustomFormats: limits.canCreateCustomFormats,
        canAccessInstitutionalFormats: limits.canAccessInstitutionalFormats,
      };
    } catch (error) {
      logger.error("Error checking citation access:", error);
      // Fail gracefully with full access
      return {
        canAccess: true,
        plan: "unknown",
        maxFormats: Infinity,
        canCreateCustomFormats: true,
        canAccessInstitutionalFormats: true,
      };
    }
  }

  // Check if user can use a specific citation format - REMOVED ALL LIMITATIONS
  static async canUseCitationFormat(
    userId: string,
    format: string
  ): Promise<{
    allowed: boolean;
    message?: string;
  }> {
    // All users can now use any citation format
    return {
      allowed: true,
    };
  }

  // Check if user can create custom citation formats - REMOVED ALL LIMITATIONS
  static async canCreateCustomFormats(userId: string): Promise<{
    allowed: boolean;
    message?: string;
  }> {
    // All users can now create custom citation formats
    return {
      allowed: true,
    };
  }

  // Check if user can access institutional citation formats - REMOVED ALL LIMITATIONS
  static async canAccessInstitutionalFormats(userId: string): Promise<{
    allowed: boolean;
    message?: string;
  }> {
    // All users can now access institutional citation formats
    return {
      allowed: true,
    };
  }
}
