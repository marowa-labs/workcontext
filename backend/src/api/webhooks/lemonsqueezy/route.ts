import { Router } from "express";
import crypto from "crypto";
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

// Verify webhook signature
async function verifySignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  const secret = (await SecretsService.getLemonsqueezyWebhookSecret())!;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return signature === digest;
}

router.post("/", async (req, res) => {
  try {
    const body = JSON.stringify(req.body);
    const signature = req.headers["x-signature"] as string;

    if (!signature) {
      return res.status(401).json({ error: "Missing signature" });
    }

    // Verify webhook signature
    if (!(await verifySignature(body, signature))) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;
    const eventName = event.meta.event_name;
    const eventData = event.data;

    console.log("Lemonsqueezy webhook received:", eventName);

    // Handle different webhook events with retry logic
    switch (eventName) {
      case "subscription_created": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handleSubscriptionCreated,
          eventData,
        );
        break;
      }
      case "subscription_updated": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handleSubscriptionUpdated,
          eventData,
        );
        break;
      }
      case "subscription_cancelled": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handleSubscriptionCancelled,
          eventData,
        );
        break;
      }
      case "subscription_resumed": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handleSubscriptionResumed,
          eventData,
        );
        break;
      }
      case "subscription_expired": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handleSubscriptionExpired,
          eventData,
        );
        break;
      }
      case "subscription_payment_success": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handlePaymentSuccess,
          eventData,
        );
        break;
      }
      case "subscription_payment_failed": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handlePaymentFailed,
          eventData,
        );
        break;
      }
      case "subscription_payment_refunded": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handlePaymentRefunded,
          eventData,
        );
        break;
      }
      case "order_created": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handleOrderCreated,
          eventData,
        );
        break;
      }
      case "order_refunded": {
        await WebhookRetryService.processWithRetry(
          eventName,
          handleOrderRefunded,
          eventData,
        );
        break;
      }
      default:
        console.log("Unhandled event:", eventName);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Event handlers
async function handleSubscriptionCreated(data: any) {
  const startTime = Date.now();
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
      Date.now() - startTime,
    );
    return;
  }

  // Find which plan this variant belongs to
  const planId = Object.entries(PRODUCTS).find(
    ([_, product]) => product.variantId === variantId.toString(),
  )?.[0];

  if (!planId) {
    console.error("Unknown variant ID:", variantId);
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_created",
      actualUserId,
      "failure",
      { error: `Unknown variant ID: ${variantId}` },
      Date.now() - startTime,
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
      Date.now() - startTime,
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
        nextBillingDate,
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
      Date.now() - startTime,
    );
    throw error;
  }

  // Track affiliate conversion if applicable
  if (affiliateRef) {
    try {
      // Get the subscription amount
      const amount = data.attributes.first_subscription_item?.price || 0;

      // Call the affiliate conversion webhook
      const response = await fetch(
        `${(await SecretsService.getBackendUrl()) || "http://localhost:3001"}/api/webhooks/affiliate/conversion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            linkCode: affiliateRef,
            userId: actualUserId,
            subscriptionId: data.id,
            amount: amount,
          }),
        },
      );

      if (!response.ok) {
        console.error(
          "Failed to track affiliate conversion:",
          await response.text(),
        );
      }
    } catch (error) {
      console.error("Error tracking affiliate conversion:", error);
    }
  }
}

async function handleSubscriptionUpdated(data: any) {
  const startTime = Date.now();
  const userId = data.attributes.custom_data?.user_id;
  const variantId = data.attributes.variant_id;

  if (!userId) {
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_updated",
      "unknown",
      "failure",
      { error: "No user_id in webhook data" },
      Date.now() - startTime,
    );
    return;
  }

  const planId = Object.entries(PRODUCTS).find(
    ([_, product]) => product.variantId === variantId.toString(),
  )?.[0];

  if (!planId) {
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_updated",
      userId,
      "failure",
      { error: `Unknown variant ID: ${variantId}` },
      Date.now() - startTime,
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
      Date.now() - startTime,
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
      Date.now() - startTime,
    );
    throw error;
  }
}

async function handleSubscriptionCancelled(data: any) {
  const startTime = Date.now();
  const userId = data.attributes.custom_data?.user_id;

  if (!userId) {
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_cancelled",
      "unknown",
      "failure",
      { error: "No user_id in webhook data" },
      Date.now() - startTime,
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
      Date.now() - startTime,
    );
  } catch (error) {
    console.error("Error processing subscription cancelled webhook:", error);
    // Log failure event
    await SubscriptionMonitoringService.logEvent(
      "subscription_cancelled",
      userId,
      "failure",
      { endsAt: data.attributes.ends_at, error: (error as Error).message },
      Date.now() - startTime,
    );
    throw error;
  }
}

async function handleSubscriptionResumed(data: any) {
  const userId = data.attributes.custom_data?.user_id;

  if (!userId) return;

  await prisma.subscription.update({
    where: { user_id: userId },
    data: {
      status: "active",
    },
  });

  console.log(`Subscription resumed for user ${userId}`);
}

async function handleSubscriptionExpired(data: any) {
  const userId = data.attributes.custom_data?.user_id;

  if (!userId) return;

  await prisma.subscription.update({
    where: { user_id: userId },
    data: {
      status: "expired",
    },
  });

  console.log(`Subscription expired for user ${userId}`);
}

async function handlePaymentSuccess(data: any) {
  console.log("Payment successful for subscription:", data.id);

  const userId = data.attributes.custom_data?.user_id;
  if (!userId) return;

  // Get user details for email
  const user = await UserService.getUserById(userId);
  if (user) {
    // Send payment success email
    const amount = data.attributes.first_order_item?.price || 0;
    const planName =
      data.attributes.first_order_item?.product_name || "ScholarForge AI";
    const transactionId = data.id;
    const date = data.attributes.created_at;

    await EmailService.sendPaymentSuccessEmail(
      user.email,
      user.full_name || "",
      planName,
      amount / 100, // Convert cents to dollars
      transactionId,
    );
  }
}

async function handlePaymentFailed(data: any) {
  const userId = data.attributes.custom_data?.user_id;

  if (!userId) return;

  await prisma.subscription.update({
    where: { user_id: userId },
    data: {
      status: "past_due",
    },
  });

  console.log(`Payment failed for user ${userId}`);

  // Get user details for email
  const user = await UserService.getUserById(userId);
  if (user) {
    // Send payment failed email
    const amount = data.attributes.first_order_item?.price || 0;
    const planName =
      data.attributes.first_order_item?.product_name || "ScholarForge AI";
    const errorMessage = data.attributes.error || "Payment processing failed";

    await EmailService.sendPaymentFailedEmail(
      user.email,
      user.full_name || "",
      planName,
      amount / 100, // Convert cents to dollars
    );
  }
}

async function handlePaymentRefunded(data: any) {
  console.log("Payment refunded for subscription:", data.id);

  const userId = data.attributes.custom_data?.user_id;
  if (!userId) return;

  // Get user details for email
  const user = await UserService.getUserById(userId);
  if (user) {
    // Send refund notification email
    const amount = data.attributes.first_order_item?.price || 0;
    const planName =
      data.attributes.first_order_item?.product_name || "ScholarForge AI";
    const transactionId = data.id;
    const date = data.attributes.created_at;

    // For refund notifications, we can use the payment success email template with modifications
    await EmailService.sendNotificationEmail(
      user.email,
      user.full_name || "",
      "ScholarForge AIPayment Refunded",
      `Your payment of $${(amount / 100).toFixed(2)} for ${planName} has been refunded. The refund should appear in your account within 5-10 business days.`,
      "payment_refund",
    );
  }
}

async function handleOrderCreated(data: any) {
  console.log("Order created:", data.id);

  const userId = data.attributes.custom_data?.user_id;
  if (!userId) return;

  // Get user details for email
  const user = await UserService.getUserById(userId);
  if (user) {
    // Send invoice available email
    const amount = data.attributes.first_order_item?.price || 0;
    const planName =
      data.attributes.first_order_item?.product_name || "ScholarForge AI";
    const invoiceId = data.id;
    const dueDate = data.attributes.created_at; // Using order creation date as due date
    const downloadUrl = data.attributes.urls?.receipt || "#";

    await EmailService.sendInvoiceAvailableEmail(
      user.email,
      user.full_name || "",
      planName,
      amount / 100, // Convert cents to dollars
      downloadUrl,
    );
  }
}

async function handleOrderRefunded(data: any) {
  console.log("Order refunded:", data.id);

  const userId = data.attributes.custom_data?.user_id;
  if (!userId) return;

  // Get user details for email
  const user = await UserService.getUserById(userId);
  if (user) {
    // Send refund notification email
    const amount = data.attributes.first_order_item?.price || 0;
    const planName =
      data.attributes.first_order_item?.product_name || "ScholarForge AI";

    await EmailService.sendNotificationEmail(
      user.email,
      user.full_name || "",
      "ScholarForge AIOrder Refunded",
      `Your order of $${(amount / 100).toFixed(2)} for ${planName} has been refunded. The refund should appear in your account within 5-10 business days.`,
      "order_refund",
    );
  }
}

export default router;
