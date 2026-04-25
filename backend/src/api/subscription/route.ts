import express from "express";
import { SubscriptionController } from "../../controllers/subscriptionController";
import { withAuth } from "../../middleware/auth";

const router = express.Router();
const subscriptionController = new SubscriptionController();

// Apply auth middleware to all routes
router.use(withAuth);

// Get current user's subscription info
router.get("/", subscriptionController.getSubscription);

// Upgrade subscription
router.post("/upgrade", subscriptionController.upgradeSubscription);

// Downgrade subscription
router.post("/downgrade", subscriptionController.downgradeSubscription);

// Cancel subscription
router.post("/cancel", subscriptionController.cancelSubscription);

// Reactivate subscription
router.post("/reactivate", subscriptionController.reactivateSubscription);

// Get available upgrade options
router.get("/upgrade-options", subscriptionController.getUpgradeOptions);

// Check if user can perform a specific action
router.get("/can-perform/:action", subscriptionController.canPerformAction);

// Check if user has access to a specific feature
router.get("/has-feature/:feature", subscriptionController.hasFeatureAccess);

// Sync subscription with external provider
router.post("/sync", subscriptionController.syncSubscription);

export default router;
