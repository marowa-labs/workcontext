import { prisma } from "../lib/prisma";
import { plans } from "../services/subscriptionService";

/**
 * Get a user's subscription plan ID
 * @param userId The user ID
 * @returns The plan ID (e.g., "free", "student", "researcher", "institutional")
 */
export async function getUserPlanId(userId: string): Promise<string> {
  try {
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    let planId = subscription?.plan || "free";

    // Institutional plan removed in MVP
    /*
    // Check if user is part of an institutional subscription
    try {
      // Import the institutional subscription service dynamically to avoid circular dependencies
      const { InstitutionalSubscriptionService } =
        await import("../services/institutionalSubscriptionService");
      const institutionalService = new InstitutionalSubscriptionService();
      const institutionalSubscription =
        await institutionalService.getUserSubscription(userId);

      // If user is part of an institutional subscription, use the institutional plan
      if (institutionalSubscription) {
        planId = "institutional";
      }
    } catch (error) {
      console.error("Error checking institutional membership:", error);
    }
    */

    return planId;
  } catch (error) {
    console.error("Error getting user plan ID:", error);
    return "free"; // Default to free plan if error occurs
  }
}

/**
 * Validate that two users have the same subscription plan
 * @param ownerUserId The project owner's user ID
 * @param collaboratorUserId The collaborator's user ID
 * @returns Object with isValid boolean and optional reason string
 */
export async function validateSameSubscriptionPlan(
  ownerUserId: string,
  collaboratorUserId: string
): Promise<{ isValid: boolean; reason?: string }> {
  try {
    // Get both users' plan IDs
    const ownerPlanId = await getUserPlanId(ownerUserId);
    const collaboratorPlanId = await getUserPlanId(collaboratorUserId);

    // Check if both users have the same plan
    if (ownerPlanId === collaboratorPlanId) {
      return { isValid: true };
    }

    // Get plan names for error message
    const ownerPlan = plans[ownerPlanId as keyof typeof plans];
    const collaboratorPlan = plans[collaboratorPlanId as keyof typeof plans];

    return {
      isValid: false,
      reason: `Cross-plan collaboration is not allowed. Project owner is on the ${ownerPlan.name} plan, but collaborator is on the ${collaboratorPlan.name} plan.`,
    };
  } catch (error) {
    console.error("Error validating subscription plans:", error);
    return {
      isValid: false,
      reason: "An error occurred while validating subscription plans.",
    };
  }
}
