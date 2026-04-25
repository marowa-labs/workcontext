import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscriptionService";
import { prisma } from "../lib/prisma";

// Extend the Request type to include the user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export class SubscriptionController {
  // Get current user's subscription info
  async getSubscription(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const subscriptionInfo =
        await SubscriptionService.getUserPlanInfo(userId);

      return res.json({
        success: true,
        data: subscriptionInfo,
      });
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch subscription",
      });
    }
  }

  // Upgrade subscription
  async upgradeSubscription(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { planId, lemonsqueezySubscriptionId } = req.body;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: "Plan ID is required",
        });
      }

      // Check if upgrade is allowed
      const canUpgrade = await SubscriptionService.canUpgradeToPlan(
        userId,
        planId,
      );
      if (!canUpgrade.allowed) {
        return res.status(400).json({
          success: false,
          message: canUpgrade.reason || "Upgrade not allowed",
        });
      }

      // Generate idempotency key for this operation
      const idempotencyKey = `upgrade_${userId}_${planId}_${Date.now()}`;

      const result = await SubscriptionService.upgradeSubscription(
        userId,
        planId,
        lemonsqueezySubscriptionId,
        idempotencyKey,
      );

      return res.json({
        success: true,
        message: result.message,
        data: result.subscription,
      });
    } catch (error: any) {
      console.error("Error upgrading subscription:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upgrade subscription",
      });
    }
  }

  // Downgrade subscription
  async downgradeSubscription(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: "Plan ID is required",
        });
      }

      // Generate idempotency key for this operation
      const idempotencyKey = `downgrade_${userId}_${planId}_${Date.now()}`;

      const result = await SubscriptionService.downgradeSubscription(
        userId,
        planId,
        idempotencyKey,
      );

      return res.json({
        success: true,
        message: result.message,
        data: result.subscription,
      });
    } catch (error: any) {
      console.error("Error downgrading subscription:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to downgrade subscription",
      });
    }
  }

  // Cancel subscription
  async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { immediately } = req.body;

      // Generate idempotency key for this operation
      const idempotencyKey = `cancel_${userId}_${immediately ? "immediate" : "scheduled"}_${Date.now()}`;

      const result = await SubscriptionService.cancelSubscription(
        userId,
        immediately,
        idempotencyKey,
      );

      return res.json({
        success: true,
        message: result.message,
        data: result.subscription,
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel subscription",
      });
    }
  }

  // Reactivate subscription
  async reactivateSubscription(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Generate idempotency key for this operation
      const idempotencyKey = `reactivate_${userId}_${Date.now()}`;

      const result = await SubscriptionService.reactivateSubscription(
        userId,
        idempotencyKey,
      );

      return res.json({
        success: true,
        message: result.message,
        data: result.subscription,
      });
    } catch (error: any) {
      console.error("Error reactivating subscription:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to reactivate subscription",
      });
    }
  }

  // Get available upgrade options
  async getUpgradeOptions(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const options = await SubscriptionService.getUpgradeOptions(userId);

      return res.json({
        success: true,
        data: options,
      });
    } catch (error: any) {
      console.error("Error fetching upgrade options:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch upgrade options",
      });
    }
  }

  // Check if user can perform a specific action
  async canPerformAction(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { action } = req.params;

      if (!action) {
        return res.status(400).json({
          success: false,
          message: "Action parameter is required",
        });
      }

      const result = await SubscriptionService.canPerformAction(
        userId,
        action as any,
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error checking action permission:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to check action permission",
      });
    }
  }

  // Check if user has access to a specific feature
  async hasFeatureAccess(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { feature } = req.params as { feature: string };

      if (!feature) {
        return res.status(400).json({
          success: false,
          message: "Feature parameter is required",
        });
      }

      const result = await SubscriptionService.hasFeatureAccess(
        userId,
        feature,
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error checking feature access:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to check feature access",
      });
    }
  }

  // Sync subscription with external provider (e.g., LemonSqueezy)
  async syncSubscription(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { planId, status, currentPeriodEnd } = req.body;

      if (!planId || !status) {
        return res.status(400).json({
          success: false,
          message: "Plan ID and status are required",
        });
      }

      const result = await SubscriptionService.syncSubscription({
        userId,
        planId,
        status,
        currentPeriodEnd: currentPeriodEnd
          ? new Date(currentPeriodEnd)
          : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error syncing subscription:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to sync subscription",
      });
    }
  }
}
