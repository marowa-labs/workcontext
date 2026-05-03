import { Router, type Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import {
  createCheckoutUrl,
  PRODUCTS,
  cancelSubscriptionById,
  resumeSubscription,
  getCustomerPortalUrl,
  getUpcomingInvoice,
  applyDiscount,
} from "../../lib/lemonsqueezy/client";
import { SubscriptionService } from "../../services/subscriptionService";
import { prisma } from "../../lib/prisma";
import {
  sendSubscriptionCreatedNotification,
  sendSubscriptionUpdatedNotification,
  sendSubscriptionCancelledNotification,
  sendSubscriptionRenewedNotification,
  sendSubscriptionExpiringNotification,
  sendPaymentSuccessNotification,
  sendPaymentFailedNotification,
  sendPaymentRefundedNotification,
  sendInvoiceAvailableNotification,
  createBillingNotification,
} from "../../services/notificationService";
import PaymentDegradationService from "../../services/paymentDegradationService";
import { SecretsService } from "../../services/secrets-service";

const router: ExpressRouter = Router();

// Rate limiting middleware for billing endpoints
const billingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many billing requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all billing routes
router.use(billingRateLimit);

// Get current subscription
router.get("/subscription", async (req, res) => {
  try {
    // Prevent 304 responses that cause frontend retry loops
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    console.log("=== Subscription Route Debug ===");
    console.log("Request object keys:", Object.keys(req));
    console.log("User object:", (req as any).user);
    console.log("User ID:", userId);
    console.log("Request headers:", req.headers);

    // Check if user is authenticated
    if (!userId) {
      console.log("ERROR: User not authenticated - no user ID found");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    console.log("Fetching subscription info for user ID:", userId);

    // Log database connection status
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("Database connection is healthy");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
    }

    // Create a timeout wrapper function for the entire operation
    const withTimeout = <T>(
      promise: Promise<T>,
      ms: number,
      errorMessage: string,
    ): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(errorMessage)), ms),
        ),
      ]);
    };

    // Fetch subscription info with a single, clear timeout
    const subscriptionInfo = await withTimeout(
      SubscriptionService.getUserPlanInfo(userId),
      30000, // 30 second timeout for the entire operation
      "Subscription fetch timeout",
    );

    console.log("Successfully fetched subscription info:", subscriptionInfo);

    return res
      .status(200)
      .json({ success: true, subscription: subscriptionInfo });
  } catch (error: any) {
    console.error("=== ERROR in Subscription Route ===");
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    console.error("==================================");

    // Return a more detailed error message
    const errorMessage = error.message || "Failed to fetch subscription";

    // Handle timeout errors specifically
    if (error.message?.includes("timeout")) {
      return res.status(408).json({
        success: false,
        message:
          "Request timeout - service may be temporarily unavailable. Please try again later.",
        error:
          (await SecretsService.getNodeEnv()) === "development"
            ? error.message
            : undefined,
      });
    }

    // Handle network errors
    if (
      error.message?.includes("ERR_INSUFFICIENT_RESOURCES") ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("Network error")
    ) {
      return res.status(503).json({
        success: false,
        message: "Network error - please check your connection and try again",
        error:
          (await SecretsService.getNodeEnv()) === "development"
            ? error.message
            : undefined,
      });
    }

    // Handle authentication errors
    if (error.message === "User not authenticated") {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error:
        (await SecretsService.getNodeEnv()) === "development"
          ? error.message
          : undefined,
    });
  }
});

// Get usage metrics
router.get("/usage", async (req, res) => {
  try {
    // Prevent 304 responses that cause frontend retry loops
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    console.log("=== Usage Route Debug ===");
    console.log("Request object keys:", Object.keys(req));
    console.log("User object:", (req as any).user);
    console.log("User ID:", userId);

    // Check if user is authenticated
    if (!userId) {
      console.log("ERROR: User not authenticated - no user ID found");
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    console.log("Fetching usage metrics for user ID:", userId);

    // Add timeout to prevent hanging requests
    const usageInfo: any = await Promise.race([
      SubscriptionService.getUserPlanInfo(userId),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Usage metrics fetch timeout")),
          30000,
        ),
      ),
    ]);

    console.log("Successfully fetched usage info:", usageInfo);

    res.status(200).json({ success: true, metrics: usageInfo.usage });
  } catch (error: any) {
    console.error("=== ERROR in Usage Route ===");
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    console.error("==================================");

    // Return a more detailed error message
    const errorMessage = error.message || "Failed to fetch usage metrics";
    res.status(500).json({
      success: false,
      message: errorMessage,
      error:
        (await SecretsService.getNodeEnv()) === "development"
          ? error.message
          : undefined,
    });
  }
});

// Get billing history (invoices)
router.get("/invoices", async (req, res) => {
  try {
    // Prevent 304 responses that cause frontend retry loops
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Fetch invoices from database
    const invoices = await prisma.invoice.findMany({
      where: { user_id: userId },
      orderBy: { issued_at: "desc" },
    });

    // Transform invoices to match the expected format
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      date: invoice.issued_at.toISOString(),
      description: invoice.description,
      amount: invoice.amount,
      status: invoice.status as "paid" | "failed" | "refunded" | "pending",
      receiptUrl: invoice.receipt_url || undefined,
    }));

    res.status(200).json({ success: true, invoices: formattedInvoices });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch billing history" });
  }
});

// Get available plans
router.get("/plans", async (req, res) => {
  try {
    // Prevent 304 responses that cause frontend retry loops
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    const plans = [
      {
        id: "free",
        name: "Free",
        price: {
          monthly: 0,
          annual: 0,
        },
        features: [
          "Basic templates, grammar & spell check",
          "5 citation formats",
          "Export to Word/PDF",
          "7-day version history",
          "Community support",
          "5,000 words/month (~30k tokens)",
          "Max 10 AI requests/month",
          "Gemini 2.5 Flash only",
          "No access to premium models",
          "100MB storage",
        ],
        limits: {
          projects: 1,
          words: 5000,
          plagiarismChecks: 0,
          aiRequests: 10,
          collaborators: 0,
          storage: 0.1, // in GB (100MB)
        },
      },
      {
        id: "student",
        name: "Student",
        price: {
          monthly: 15,
          annual: 144,
        },
        features: [
          "All templates",
          "Advanced plagiarism detection",
          "Real-time collaboration (up to 5 members)",
          "All citation formats",
          "30-day version history",
          "Email support",
          "Writing analytics dashboard",
          "75,000 words/month (~450k tokens)",
          "120 Gemini 2.5 Flash requests",
          "50 OpenRouter OSS model requests",
          "100GB storage",
        ],
        limits: {
          projects: "unlimited",
          words: 75000,
          plagiarismChecks: "unlimited",
          aiRequests: 80, // 50 + 10 + 20 = 80 total model requests
          collaborators: 5,
          storage: 100, // in GB
        },
      },
      {
        id: "researcher",
        name: "Researcher",
        price: {
          monthly: 35,
          annual: 336,
        },
        features: [
          "Custom templates",
          "Institution-grade plagiarism detection",
          "Unlimited collaboration",
          "Custom citation styles",
          "Unlimited version history",
          "Advanced analytics",
          "Phone & chat support",
          "Dedicated account manager",
          "300,000 words/month (~1.8M tokens)",
          "Unlimited Gemini 2.5 Flash requests",
          "200 Gemini 3.1 Flash Lite requests/month",
          "75 OpenRouter OSS model requests/month",
          "500GB storage",
        ],
        limits: {
          projects: "unlimited",
          words: 300000,
          plagiarismChecks: "unlimited",
          aiRequests: 375, // Sum of model-specific requests
          collaborators: "unlimited",
          storage: 500, // in GB
        },
      },
      {
        id: "onetime",
        name: "One-Time Pay-As-You-Go",
        price: {
          monthly: 15,
          annual: 15,
        },
        features: [
          "All templates & citation formats",
          "Real-time collaboration",
          "30-day version history",
          "Email support",
          "$15/session (minimum), usage-based overages",
          "First $15 covers up to 25,000 words",
          "Additional usage billed at $0.0006/word",
          "Models: Gemini 2.5 Flash + OpenRouter OSS models",
          "5GB storage",
        ],
        limits: {
          projects: "unlimited",
          words: 25000,
          plagiarismChecks: "unlimited",
          aiRequests: "unlimited",
          collaborators: "unlimited",
          storage: 5, // in GB
        },
      },
      // Adding new Team & Institutional plan for universities and research institutes
      {
        id: "institutional",
        name: "Institutional",
        price: {
          monthly: 0, // Tiered per seat pricing
          annual: 0, // Tiered per seat pricing
        },
        features: [
          "Everything in Researcher",
          "SSO integration (SAML/OAuth)",
          "Centralized admin dashboard",
          "Usage analytics & reporting",
          "White-label options",
          "Compliance-ready (FERPA/GDPR)",
          "API access with custom rate limits",
          "Bulk provisioning",
          "Premium support SLA",
          "Tiered per seat pricing:",
          "  1–50 users: $25/user/month",
          "  51–200 users: $20/user/month",
          "  201+ users: $15/user/month",
          "Usage Limits (per user):",
          "  500,000 words/month",
          "  Unlimited access to all models",
          "  1TB shared storage",
        ],
        limits: {
          projects: "unlimited",
          words: 500000, // per user
          plagiarismChecks: "unlimited",
          aiRequests: "unlimited",
          collaborators: "unlimited",
          storage: 1000, // 1TB in GB
        },
      },
    ];

    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
});

// Change plan
router.post("/change-plan", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { planId } = req.body;

    // Validate plan ID
    const validPlans = ["free", "student", "researcher"];
    if (!validPlans.includes(planId)) {
      res.status(400).json({ success: false, message: "Invalid plan ID" });
      return;
    }

    // For free plan, we just update the database
    if (planId === "free") {
      // Get current subscription to compare
      const currentSubscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      // Update subscription in database
      const subscription = await prisma.subscription.upsert({
        where: { user_id: userId },
        update: {
          plan: planId,
          status: "active",
          lemonsqueezy_subscription_id: null,
          current_period_end: null,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          plan: planId,
          status: "active",
        },
      });

      // Update user storage limit
      const planStorageLimit = (SubscriptionService as any).plans.free.features
        .storage;
      await prisma.user.update({
        where: { id: userId },
        data: {
          storage_limit: planStorageLimit,
          updated_at: new Date(),
        },
      });

      // Send plan change notification
      const plan = (SubscriptionService as any).plans[planId];
      const currentPlan = currentSubscription
        ? (SubscriptionService as any).plans[currentSubscription.plan]
        : { name: "Unknown", price: 0 };

      await sendSubscriptionUpdatedNotification(
        userId,
        currentPlan?.name || currentSubscription?.plan || "Unknown",
        plan?.name || planId,
        plan?.price || 0,
      );

      res.json({ success: true, message: "Plan changed successfully" });
      return;
    }

    // For paid plans, we need to create a checkout session
    // Get user email from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Create checkout URL
    let variantId: string;

    if (planId === "student") {
      variantId = PRODUCTS.studentPro.variantId!;
    } else if (planId === "researcher") {
      variantId = PRODUCTS.researcher.variantId!;
    } else {
      throw new Error("Invalid plan ID");
    }

    const checkoutUrl = await createCheckoutUrl(variantId, userId, user.email);

    res.json({ success: true, checkoutUrl });
  } catch (error) {
    console.error("Error changing plan:", error);
    res.status(500).json({ success: false, message: "Failed to change plan" });
  }
});

// Cancel subscription
router.post("/cancel", async (req, res) => {
  try {
    // Check if payment service is degraded
    const degradationService = PaymentDegradationService.getInstance();
    if (degradationService.isDegraded()) {
      console.log("Payment service is degraded, returning fallback response");
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { reason } = req.body;

    console.log(`Cancelling subscription. Reason: ${reason}`);

    // Get current subscription for notification and to get LemonSqueezy subscription ID
    const currentSubscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    // Cancel subscription in payment provider if LemonSqueezy subscription ID exists
    if (currentSubscription?.lemonsqueezy_subscription_id) {
      try {
        await cancelSubscriptionById(
          currentSubscription.lemonsqueezy_subscription_id,
        );
        console.log(
          `Cancelled LemonSqueezy subscription: ${currentSubscription.lemonsqueezy_subscription_id}`,
        );
      } catch (error) {
        console.error("Error cancelling LemonSqueezy subscription:", error);
        // Report failure to degradation service
        degradationService.reportPaymentServiceFailure(
          error as Error,
          "cancel-subscription-lemonsqueezy",
        );
        // Continue with database update even if LemonSqueezy fails
      }
    }

    // Update subscription in database
    await prisma.subscription.update({
      where: { user_id: userId },
      data: {
        status: "cancelled",
        current_period_end: new Date(), // Set to current date to end immediately
      },
    });

    // Send cancellation notification
    if (currentSubscription) {
      const plan = (SubscriptionService as any).plans[currentSubscription.plan];
      await sendSubscriptionCancelledNotification(
        userId,
        plan?.name || currentSubscription.plan,
        new Date().toISOString(),
      );
    }

    // Report successful operation to degradation service
    degradationService.reportPaymentServiceRecovery("cancel-subscription");

    return res.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);

    // Report failure to degradation service
    const degradationService = PaymentDegradationService.getInstance();
    degradationService.reportPaymentServiceFailure(
      error,
      "cancel-subscription",
    );

    // If service is degraded, return fallback response
    if (degradationService.isDegraded()) {
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel subscription" });
  }
});

// Reactivate subscription
router.post("/reactivate", async (req, res) => {
  try {
    // Check if payment service is degraded
    const degradationService = PaymentDegradationService.getInstance();
    if (degradationService.isDegraded()) {
      console.log("Payment service is degraded, returning fallback response");
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    console.log("Reactivating subscription");

    // Get current subscription for notification and to get LemonSqueezy subscription ID
    const currentSubscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    // Reactivate subscription in payment provider if LemonSqueezy subscription ID exists
    if (currentSubscription?.lemonsqueezy_subscription_id) {
      try {
        await resumeSubscription(
          currentSubscription.lemonsqueezy_subscription_id,
        );
        console.log(
          `Resumed LemonSqueezy subscription: ${currentSubscription.lemonsqueezy_subscription_id}`,
        );
      } catch (error) {
        console.error("Error resuming LemonSqueezy subscription:", error);
        // Report failure to degradation service
        degradationService.reportPaymentServiceFailure(
          error as Error,
          "reactivate-subscription-lemonsqueezy",
        );
        // Continue with database update even if LemonSqueezy fails
      }
    }

    // Update subscription in database
    await prisma.subscription.update({
      where: { user_id: userId },
      data: {
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Send reactivation notification
    if (currentSubscription) {
      const plan = (SubscriptionService as any).plans[currentSubscription.plan];
      await sendSubscriptionRenewedNotification(
        userId,
        plan?.name || currentSubscription.plan,
        plan?.price || 0,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      );
    }

    // Report successful operation to degradation service
    degradationService.reportPaymentServiceRecovery("reactivate-subscription");

    return res.json({
      success: true,
      message: "Subscription reactivated successfully",
    });
  } catch (error: any) {
    console.error("Error reactivating subscription:", error);

    // Report failure to degradation service
    const degradationService = PaymentDegradationService.getInstance();
    degradationService.reportPaymentServiceFailure(
      error,
      "reactivate-subscription",
    );

    // If service is degraded, return fallback response
    if (degradationService.isDegraded()) {
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to reactivate subscription" });
  }
});

// Update payment method
router.post("/update-payment-method", async (req, res) => {
  try {
    // Check if payment service is degraded
    const degradationService = PaymentDegradationService.getInstance();
    if (degradationService.isDegraded()) {
      console.log("Payment service is degraded, returning fallback response");
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    // Generate a redirect URL to the payment provider's portal
    const redirectUrl = await getCustomerPortalUrl(
      (await SecretsService.getLemonsqueezyStoreId())!,
    );

    // Report successful operation to degradation service
    degradationService.reportPaymentServiceRecovery("update-payment-method");

    return res.json({ success: true, redirectUrl });
  } catch (error: any) {
    console.error("Error updating payment method:", error);

    // Report failure to degradation service
    const degradationService = PaymentDegradationService.getInstance();
    degradationService.reportPaymentServiceFailure(
      error,
      "update-payment-method",
    );

    // If service is degraded, return fallback response
    if (degradationService.isDegraded()) {
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to update payment method" });
  }
});

// Get customer portal URL
router.get("/customer-portal", async (req, res) => {
  try {
    // Check if payment service is degraded
    const degradationService = PaymentDegradationService.getInstance();
    if (degradationService.isDegraded()) {
      console.log("Payment service is degraded, returning fallback response");
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    // Generate a customer portal URL from the payment provider
    const url = await getCustomerPortalUrl(
      (await SecretsService.getLemonsqueezyStoreId())!,
    );

    // Report successful operation to degradation service
    degradationService.reportPaymentServiceRecovery("customer-portal");

    return res.json({ success: true, url });
  } catch (error: any) {
    console.error("Error getting customer portal URL:", error);

    // Report failure to degradation service
    const degradationService = PaymentDegradationService.getInstance();
    degradationService.reportPaymentServiceFailure(error, "customer-portal");

    // If service is degraded, return fallback response
    if (degradationService.isDegraded()) {
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to get customer portal URL" });
  }
});

// Apply promo code
router.post("/apply-promo", async (req, res) => {
  try {
    // Check if payment service is degraded
    const degradationService = PaymentDegradationService.getInstance();
    if (degradationService.isDegraded()) {
      console.log("Payment service is degraded, returning fallback response");
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { code } = req.body;

    // Validate the promo code with the payment provider
    try {
      const discountInfo = await applyDiscount("", code); // We don't have a checkout ID, so we'll pass empty string

      // Apply the discount and return updated pricing
      return res.json({
        success: true,
        message: "Promo code applied successfully",
        discount:
          discountInfo.discountPercentage || discountInfo.discountAmount,
        discountType: discountInfo.discountType,
        newPrice:
          7.0 -
          (discountInfo.discountType === "percentage"
            ? (7.0 * discountInfo.discountPercentage) / 100
            : discountInfo.discountAmount / 100), // Assuming base price of $7.00
      });

      // Report successful operation to degradation service
      degradationService.reportPaymentServiceRecovery("apply-promo");
    } catch (error: any) {
      console.error("Error applying promo code:", error);
      // Report failure to degradation service
      degradationService.reportPaymentServiceFailure(
        error,
        "apply-promo-validation",
      );

      // If service is degraded, return fallback response
      if (degradationService.isDegraded()) {
        const fallbackResponse =
          degradationService.getSubscriptionManagementFallbackResponse();
        return res.status(503).json(fallbackResponse);
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Invalid promo code",
      });
    }
  } catch (error: any) {
    console.error("Error applying promo code:", error);

    // Report failure to degradation service
    const degradationService = PaymentDegradationService.getInstance();
    degradationService.reportPaymentServiceFailure(error, "apply-promo");

    // If service is degraded, return fallback response
    if (degradationService.isDegraded()) {
      const fallbackResponse =
        degradationService.getSubscriptionManagementFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to apply promo code" });
  }
});

// Initialize subscription for new user
router.post("/init-subscription", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { planId } = req.body;

    // Validate plan ID
    const validPlans = ["free", "student", "researcher"];
    if (!validPlans.includes(planId)) {
      res.status(400).json({ success: false, message: "Invalid plan ID" });
      return;
    }

    // Create or update subscription and update user storage limit
    const subscription = await SubscriptionService.syncSubscription({
      userId,
      planId,
      status: "active",
      currentPeriodEnd:
        planId === "free"
          ? undefined
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Send subscription created notification
    const plan = (SubscriptionService as any).plans[planId];
    await sendSubscriptionCreatedNotification(
      userId,
      plan?.name || planId,
      plan?.price || 0,
      "month",
    );

    return res.json({ success: true, subscription });
  } catch (error) {
    console.error("Error initializing subscription:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to initialize subscription" });
  }
});

// Get upcoming invoice
router.get("/upcoming-invoice", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    // Fetch upcoming invoice from payment provider
    // First, get the user's subscription to get the LemonSqueezy subscription ID
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    if (!subscription?.lemonsqueezy_subscription_id) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    try {
      const invoiceData: any = await getUpcomingInvoice(
        subscription.lemonsqueezy_subscription_id,
      );

      // Format the invoice data to match the expected response structure
      const invoice = {
        amount: invoiceData?.attributes?.total
          ? invoiceData.attributes.total / 100
          : 0, // Convert from cents
        date: invoiceData?.attributes?.created_at || new Date().toISOString(),
        items:
          invoiceData?.attributes?.invoice_items?.map((item: any) => ({
            description: item.name,
            amount: item.total / 100, // Convert from cents
          })) || [],
      };

      return res.json({ success: true, invoice });
      return;
    } catch (error: any) {
      console.error(
        "Error fetching upcoming invoice from LemonSqueezy:",
        error,
      );
      // Propagate the error instead of falling back to mock data
      throw new Error(
        `Failed to fetch upcoming invoice: ${error.message || error}`,
      );
    }
  } catch (error: any) {
    console.error("Error getting upcoming invoice:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to get upcoming invoice" });
    return;
  }
});

// Create checkout session
router.post("/create-checkout", async (req, res) => {
  try {
    console.log("Create checkout session request received:", req.body);

    // Check if payment service is degraded
    const degradationService = PaymentDegradationService.getInstance();
    if (degradationService.isDegraded()) {
      console.log("Payment service is degraded, returning fallback response");
      const fallbackResponse = degradationService.getCheckoutFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { planId } = req.body;

    console.log("User ID:", userId);
    console.log("Plan ID:", planId);

    // Validate plan ID
    const validPlans = ["student", "researcher", "onetime"];
    if (!validPlans.includes(planId)) {
      console.log("Invalid plan ID:", planId);
      res.status(400).json({ success: false, message: "Invalid plan ID" });
      return;
    }

    // Get user email from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    console.log("User from database:", user);

    if (!user) {
      console.log("User not found for ID:", userId);
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Log product configuration
    console.log("PRODUCTS configuration:", {
      studentPro: PRODUCTS.studentPro,
      researcher: PRODUCTS.researcher,
      hasStudentProductId: !!PRODUCTS.studentPro.productId,
      hasStudentVariantId: !!PRODUCTS.studentPro.variantId,
      hasResearcherProductId: !!PRODUCTS.researcher.productId,
      hasResearcherVariantId: !!PRODUCTS.researcher.variantId,
    });

    // Create checkout URL
    let variantId: string;

    if (planId === "student") {
      variantId = PRODUCTS.studentPro.variantId!;
    } else if (planId === "researcher") {
      variantId = PRODUCTS.researcher.variantId!;
    } else if (planId === "onetime") {
      variantId = PRODUCTS.oneTime.variantId!;
    } else {
      throw new Error("Invalid plan ID");
    }

    const checkoutUrl = await createCheckoutUrl(variantId, userId, user.email);

    console.log("Checkout URL created:", checkoutUrl);

    // Report successful operation to degradation service
    degradationService.reportPaymentServiceRecovery("create-checkout");

    return res.json({ success: true, checkoutUrl });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);

    // Report failure to degradation service
    const degradationService = PaymentDegradationService.getInstance();
    degradationService.reportPaymentServiceFailure(error, "create-checkout");

    // If service is degraded, return fallback response
    if (degradationService.isDegraded()) {
      const fallbackResponse = degradationService.getCheckoutFallbackResponse();
      return res.status(503).json(fallbackResponse);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create checkout session",
    });
  }
});

// Create checkout session for unauthenticated users (new signup flow)
router.post("/create-checkout-unauth", async (req, res) => {
  try {
    console.log(
      "Create unauthenticated checkout session request received:",
      req.body,
    );

    const { planId, email, fullName, phoneNumber } = req.body;

    console.log("Plan ID:", planId);
    console.log("Email:", email);
    console.log("Full Name:", fullName);
    console.log("Phone Number:", phoneNumber);

    // Validate required fields
    if (!planId || !email || !fullName) {
      console.log("Missing required fields for unauthenticated checkout");
      res.status(400).json({
        success: false,
        message: "Plan ID, email, and full name are required",
      });
      return;
    }

    // Validate plan ID
    const validPlans = ["student", "researcher", "onetime"];
    if (!validPlans.includes(planId)) {
      console.log("Invalid plan ID for unauthenticated checkout:", planId);
      res.status(400).json({ success: false, message: "Invalid plan ID" });
      return;
    }

    // Log product configuration
    console.log("PRODUCTS configuration:", {
      studentPro: PRODUCTS.studentPro,
      researcher: PRODUCTS.researcher,
      hasStudentProductId: !!PRODUCTS.studentPro.productId,
      hasStudentVariantId: !!PRODUCTS.studentPro.variantId,
      hasResearcherProductId: !!PRODUCTS.researcher.productId,
      hasResearcherVariantId: !!PRODUCTS.researcher.variantId,
    });

    // Create a temporary user ID for this checkout session
    // This will be replaced with the actual user ID after signup
    const tempUserId = `temp_${Date.now()}`;

    // Create checkout URL with temporary user ID
    let variantId: string;

    if (planId === "student") {
      variantId = PRODUCTS.studentPro.variantId!;
    } else if (planId === "researcher") {
      variantId = PRODUCTS.researcher.variantId!;
    } else if (planId === "onetime") {
      variantId = PRODUCTS.oneTime.variantId!;
    } else {
      throw new Error("Invalid plan ID");
    }

    const checkoutUrl = await createCheckoutUrl(variantId, tempUserId, email);

    console.log("Unauthenticated checkout URL created:", checkoutUrl);

    // Store the user details temporarily for post-checkout processing
    // Store user details in the temporary database table for post-checkout processing
    try {
      await prisma.temporaryUser.create({
        data: {
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          plan_id: planId,
          temp_user_id: tempUserId,
          checkout_url: checkoutUrl,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        },
      });
      console.log("Temporary user data stored in database:", tempUserId);
    } catch (storageError) {
      console.error("Error storing temporary user data:", storageError);
      // Continue with the checkout process even if storage fails
    }

    res.json({
      success: true,
      checkoutUrl,
      tempUserId,
      userData: {
        email,
        fullName,
        phoneNumber,
        planId,
      },
    });
  } catch (error: any) {
    console.error("Error creating unauthenticated checkout session:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create checkout session",
    });
  }
});

// Get payment methods
router.get("/payment-methods", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Fetch payment methods from database (using mapped userId)
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: userId },
      orderBy: { created_at: "desc" },
    });

    // Transform payment methods to match the expected format
    const formattedPaymentMethods = paymentMethods.map((method: any) => ({
      id: method.id,
      type: method.type as "visa" | "mastercard" | "amex" | "paypal",
      lastFour: method.last_four,
      expiryMonth: method.expiry_month,
      expiryYear: method.expiry_year,
      isDefault: method.is_default,
    }));

    res.json({ success: true, paymentMethods: formattedPaymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment methods" });
  }
});

// Add payment method
router.post("/payment-methods", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const paymentMethodData = req.body;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Validate required fields
    if (!paymentMethodData.type || !paymentMethodData.lastFour) {
      res.status(400).json({
        success: false,
        message: "Type and last four digits are required",
      });
      return;
    }

    // Create payment method in database
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        user_id: userId,
        type: paymentMethodData.type,
        last_four: paymentMethodData.lastFour,
        expiry_month: paymentMethodData.expiryMonth || 1,
        expiry_year: paymentMethodData.expiryYear || 2025,
        is_default: paymentMethodData.isDefault || false,
      },
    });

    // Transform payment method to match the expected format
    const formattedPaymentMethod = {
      id: paymentMethod.id,
      type: paymentMethod.type as "visa" | "mastercard" | "amex" | "paypal",
      lastFour: paymentMethod.last_four,
      expiryMonth: paymentMethod.expiry_month,
      expiryYear: paymentMethod.expiry_year,
      isDefault: paymentMethod.is_default,
    };

    res.json({ success: true, paymentMethod: formattedPaymentMethod });
  } catch (error) {
    console.error("Error adding payment method:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add payment method" });
  }
});

// Set default payment method
router.put("/payment-methods/:id/default", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { id } = req.params;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // First, set all user's payment methods to non-default
    await prisma.paymentMethod.updateMany({
      where: { user_id: userId },
      data: { is_default: false },
    });

    // Then, set the specified payment method as default
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id, user_id: userId },
      data: { is_default: true },
    });

    // Transform payment method to match the expected format
    const formattedPaymentMethod = {
      id: paymentMethod.id,
      type: paymentMethod.type as "visa" | "mastercard" | "amex" | "paypal",
      lastFour: paymentMethod.last_four,
      expiryMonth: paymentMethod.expiry_month,
      expiryYear: paymentMethod.expiry_year,
      isDefault: paymentMethod.is_default,
    };

    res.json({ success: true, paymentMethod: formattedPaymentMethod });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set default payment method",
    });
  }
});

// Remove payment method
router.delete("/payment-methods/:id", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { id } = req.params;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Delete payment method from database
    await prisma.paymentMethod.delete({
      where: { id, user_id: userId },
    });

    res.json({ success: true, message: "Payment method removed successfully" });
  } catch (error) {
    console.error("Error removing payment method:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove payment method" });
  }
});

// Send test billing notification
router.post("/test-notification", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware in main-server.ts
    const userId = (req as any).user?.id;
    const { type, title, message, data } = req.body;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Validate notification type
    const validTypes = [
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_renewed",
      "subscription_expiring",
      "payment_success",
      "payment_failed",
      "payment_refunded",
      "invoice_available",
    ];

    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        message: "Invalid notification type",
      });
      return;
    }

    // Send the notification based on type
    switch (type) {
      case "subscription_created":
        await sendSubscriptionCreatedNotification(
          userId,
          data?.planName || "Test Plan",
          data?.amount || 10,
          data?.billingPeriod || "month",
        );
        break;
      case "subscription_updated":
        await sendSubscriptionUpdatedNotification(
          userId,
          data?.oldPlanName || "Old Plan",
          data?.newPlanName || "New Plan",
          data?.amount || 15,
        );
        break;
      case "subscription_cancelled":
        await sendSubscriptionCancelledNotification(
          userId,
          data?.planName || "Test Plan",
          data?.endDate || new Date().toISOString(),
        );
        break;
      case "subscription_renewed":
        await sendSubscriptionRenewedNotification(
          userId,
          data?.planName || "Test Plan",
          data?.amount || 12,
          data?.nextBillingDate ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        );
        break;
      case "subscription_expiring":
        await sendSubscriptionExpiringNotification(
          userId,
          data?.planName || "Test Plan",
          data?.expirationDate ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          data?.amount || 12,
        );
        break;
      case "payment_success":
        await sendPaymentSuccessNotification(
          userId,
          data?.amount || 12,
          data?.planName || "Test Plan",
          data?.transactionId || "txn_123456",
        );
        break;
      case "payment_failed":
        await sendPaymentFailedNotification(
          userId,
          data?.amount || 12,
          data?.planName || "Test Plan",
          data?.errorMessage || "Payment processing failed",
        );
        break;
      case "payment_refunded":
        await sendPaymentRefundedNotification(
          userId,
          data?.amount || 12,
          data?.planName || "Test Plan",
          data?.transactionId || "txn_123456",
        );
        break;
      case "invoice_available":
        await sendInvoiceAvailableNotification(
          userId,
          data?.invoiceId || "inv_123456",
          data?.amount || 12,
          data?.dueDate || new Date().toISOString(),
          data?.downloadUrl || "https://example.com/invoice.pdf",
        );
        break;
      default:
        await createBillingNotification(userId, type, title, message, data);
    }

    res.json({ success: true, message: "Test notification sent successfully" });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send test notification" });
  }
});

// Trigger post-payment operations
router.post("/post-payment-operations", async (req, res) => {
  try {
    // User ID will be attached by the authentication middleware
    const userId = (req as any).user?.id;
    const { paymentType, amount } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Log the post-payment operations trigger
    console.log(
      `Post-payment operations triggered for user ${userId}: ${paymentType} payment of $${amount}`,
    );

    // In a real implementation, you might want to:
    // 1. Update user's account status/features
    // 2. Trigger any necessary backend processes
    // 3. Send notifications
    // 4. Update analytics/metrics
    // 5. Handle any integration-specific logic

    return res.json({
      success: true,
      message: "Post-payment operations triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering post-payment operations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to trigger post-payment operations",
    });
  }
});

// Track AI-inserted words
router.post("/track-ai-words", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { wordsInserted } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!wordsInserted || wordsInserted <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid word count",
      });
    }

    // Track the AI-inserted words
    const result = await SubscriptionService.trackAIWords(
      userId,
      wordsInserted,
    );

    return res.status(200).json({
      success: true,
      message: "AI words tracked successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error tracking AI words:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track AI words",
      error: error.message,
    });
  }
});

export default router;
