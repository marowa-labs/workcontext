import { Router } from "express";
import { SubscriptionService } from "../../../services/subscriptionService";
import { PRODUCTS } from "../../../lib/lemonsqueezy/client";
import { prisma } from "../../../lib/prisma";
import { EmailService } from "../../../services/emailService";
import { UserService } from "../../../services/userService";
import { AuthService } from "../../../services/hybridAuthService";
import WebhookRetryService from "../../../services/webhookRetryService";
import SubscriptionMonitoringService from "../../../services/subscriptionMonitoringService";
import { SecretsService } from "../../../services/secrets-service";

const router: Router = Router();

// Test endpoint for manually triggering webhook events without signature verification
// ONLY for development/testing purposes
router.post("/test/:eventType", async (req, res) => {
  try {
    if ((await SecretsService.getNodeEnv()) === "production") {
      return res
        .status(403)
        .json({ error: "Test endpoint not available in production" });
    }

    const eventType = req.params.eventType;
    const testData = req.body;

    console.log(`Testing webhook event: ${eventType}`, testData);

    // Process the event based on type
    switch (eventType) {
      case "subscription_created": {
        await WebhookRetryService.processWithRetry(
          eventType,
          handleSubscriptionCreated,
          testData
        );
        break;
      }
      case "subscription_updated": {
        await WebhookRetryService.processWithRetry(
          eventType,
          handleSubscriptionUpdated,
          testData
        );
        break;
      }
      case "subscription_cancelled": {
        await WebhookRetryService.processWithRetry(
          eventType,
          handleSubscriptionCancelled,
          testData
        );
        break;
      }
      default:
        return res
          .status(400)
          .json({ error: `Unsupported event type: ${eventType}` });
    }

    return res.json({ received: true, processed: true });
  } catch (error) {
    console.error("Webhook test error:", error);
    return res.status(500).json({ error: "Webhook test processing failed" });
  }
});

// Reuse the existing handler functions
async function handleSubscriptionCreated(data: any) {
  const userId = data.attributes.custom_data?.user_id;
  const variantId = data.attributes.variant_id;
  const affiliateRef = data.attributes.custom_data?.affiliate_ref;
  const userEmail = data.attributes.user_email;
  const userFullName = data.attributes.user_name;

  // Check if this is a temporary user ID (for unauthenticated checkout)
  const isTempUser = userId && userId.startsWith("temp_");

  let actualUserId = userId;

  if (isTempUser) {
    // This is a checkout for an unauthenticated user
    // We need to create the user account first
    try {
      console.log("Creating user account for temporary user:", userId);

      // Check if user already exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (existingUser) {
        // User already exists, use existing user ID
        actualUserId = existingUser.id;
        console.log("User already exists with email:", userEmail);
      } else {
        // Create new user account
        console.log("Creating new user account for:", userEmail);

        // Create user in Supabase Auth
        const authResult = await AuthService.createUser({
          email: userEmail,
          password: Math.random().toString(36).slice(-8) + "A1!", // Generate a random password
          fullName: userFullName,
          userType: "student", // Default to student
          fieldOfStudy: "General", // Default field of study
        });

        if (!authResult.supabaseUser) {
          throw new Error("Failed to create user in authentication system");
        }

        actualUserId = authResult.supabaseUser.id;

        // Create user record in database
        await prisma.user.create({
          data: {
            id: actualUserId,
            email: userEmail,
            full_name: userFullName,
            user_type: "student",
            field_of_study: "General",
            storage_limit: 0.1, // Default storage limit
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        console.log("Created new user account:", actualUserId);
      }

      // Update the custom data with the actual user ID
      // Note: We can't update the LemonSqueezy subscription directly,
      // but we can use the actual user ID for our internal processing
    } catch (error) {
      console.error("Error creating user account for temporary user:", error);
      // We'll continue with the temporary user ID if account creation fails
    }
  }

  if (!actualUserId) {
    console.error("No user_id in webhook data");
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_created",
      "unknown",
      "failure",
      { error: "No user_id in webhook data" },
      0
    );
    return;
  }

  // Find which plan this variant belongs to
  const planId = Object.entries(PRODUCTS).find(
    ([_, product]) => product.variantId === variantId.toString()
  )?.[0];

  if (!planId) {
    console.error("Unknown variant ID:", variantId);
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_created",
      actualUserId,
      "failure",
      { error: `Unknown variant ID: ${variantId}` },
      0
    );
    return;
  }

  try {
    await SubscriptionService.syncSubscription({
      userId: actualUserId,
      planId,
      status: data.attributes.status,
      currentPeriodEnd: new Date(data.attributes.renews_at),
    });

    console.log(`Subscription created for user ${actualUserId}: ${planId}`);

    // Log successful event
    await SubscriptionMonitoringService.logEvent(
      "subscription_created",
      actualUserId,
      "success",
      { planId, status: data.attributes.status },
      0
    );

    // Get user details for email
    const user = await UserService.getUserById(actualUserId);
    if (user) {
      // Send subscription confirmation email
      const plan = (SubscriptionService as any).plans[planId];
      const amount = data.attributes.first_subscription_item?.price || 0;
      const billingPeriod = data.attributes.billing_anchor?.type || "month";
      const nextBillingDate = data.attributes.renews_at;

      await EmailService.sendSubscriptionConfirmationEmail(
        user.email,
        user.full_name || "",
        plan?.name || planId,
        amount / 100, // Convert cents to dollars
        billingPeriod,
        nextBillingDate
      );
    }
  } catch (error) {
    console.error("Error processing subscription created webhook:", error);
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_created",
      actualUserId,
      "failure",
      {
        planId,
        status: data.attributes.status,
        error: (error as Error).message,
      },
      0
    );
    throw error;
  }
}

async function handleSubscriptionUpdated(data: any) {
  const userId = data.attributes.custom_data?.user_id;
  const variantId = data.attributes.variant_id;

  if (!userId) {
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_updated",
      "unknown",
      "failure",
      { error: "No user_id in webhook data" },
      0
    );
    return;
  }

  const planId = Object.entries(PRODUCTS).find(
    ([_, product]) => product.variantId === variantId.toString()
  )?.[0];

  if (!planId) {
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_updated",
      userId,
      "failure",
      { error: `Unknown variant ID: ${variantId}` },
      0
    );
    return;
  }

  try {
    await SubscriptionService.syncSubscription({
      userId,
      planId,
      status: data.attributes.status,
      currentPeriodEnd: new Date(data.attributes.renews_at),
    });

    console.log(`Subscription updated for user ${userId}`);

    // Log successful event
    await SubscriptionMonitoringService.logEvent(
      "subscription_updated",
      userId,
      "success",
      { planId, status: data.attributes.status },
      0
    );
  } catch (error) {
    console.error("Error processing subscription updated webhook:", error);
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_updated",
      userId,
      "failure",
      {
        planId,
        status: data.attributes.status,
        error: (error as Error).message,
      },
      0
    );
    throw error;
  }
}

async function handleSubscriptionCancelled(data: any) {
  const userId = data.attributes.custom_data?.user_id;

  if (!userId) {
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_cancelled",
      "unknown",
      "failure",
      { error: "No user_id in webhook data" },
      0
    );
    return;
  }

  try {
    await prisma.subscription.update({
      where: { user_id: userId },
      data: {
        status: "cancelled",
        current_period_end: new Date(data.attributes.ends_at),
      },
    });

    console.log(`Subscription cancelled for user ${userId}`);

    // Log successful event
    await SubscriptionMonitoringService.logEvent(
      "subscription_cancelled",
      userId,
      "success",
      { endsAt: data.attributes.ends_at },
      0
    );
  } catch (error) {
    console.error("Error processing subscription cancelled webhook:", error);
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_cancelled",
      userId,
      "failure",
      { endsAt: data.attributes.ends_at, error: (error as Error).message },
      0
    );
    throw error;
  }
}

export default router;
