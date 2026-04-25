import * as LemonSqueezy from "@lemonsqueezy/lemonsqueezy.js";
import { config } from "../../config/env";
import { lemonSqueezyCircuitBreaker } from "../../services/circuitBreakerService";
import { SecretsService } from "../../services/secrets-service";

// Initialize Lemonsqueezy client
let isInitialized = false;

function initializeLemonSqueezy() {
  console.log("Initializing LemonSqueezy client...");
  console.log("Current initialization state:", isInitialized);
  console.log("API Key available:", !!config.lemonsqueezy.apiKey);
  console.log("API Key value:", config.lemonsqueezy.apiKey ? "SET" : "NOT_SET");

  if (!isInitialized) {
    if (!config.lemonsqueezy.apiKey) {
      console.error(
        "LEMONSQUEEZY_API_KEY is not configured in environment variables"
      );
      throw new Error(
        "LEMONSQUEEZY_API_KEY is not configured in environment variables"
      );
    }

    console.log("Setting up LemonSqueezy with API key...");
    try {
      LemonSqueezy.lemonSqueezySetup({
        apiKey: config.lemonsqueezy.apiKey,
      });
      console.log("LemonSqueezy setup completed successfully");
      isInitialized = true;
    } catch (error) {
      console.error("Error setting up LemonSqueezy:", error);
      throw error;
    }
  } else {
    console.log("LemonSqueezy client already initialized");
  }
}

export const LEMONSQUEEZY_STORE_ID = config.lemonsqueezy.storeId;

interface ProductConfig {
  productId: string | null;
  variantId: string | null;
  price: number;
  planId: string;
}

// Product/Variant IDs (get these from Lemonsqueezy dashboard)
export const PRODUCTS: {
  studentPro: ProductConfig;
  researcher: ProductConfig;
  oneTime: ProductConfig;
  institutional: ProductConfig;
} = {
  studentPro: {
    productId: null,
    variantId: null,
    price: 1200, // $12.00 in cents
    planId: "student_pro",
  },
  researcher: {
    productId: null,
    variantId: null,
    price: 2500, // $25.00 in cents
    planId: "researcher",
  },
  oneTime: {
    productId: null,
    variantId: null,
    price: 0, // Price is calculated dynamically for one-time payments
    planId: "onetime",
  },
  institutional: {
    productId: null,
    variantId: null,
    price: 0, // Price is calculated dynamically for institutional plans
    planId: "institutional",
  },
};

// Initialize the products configuration asynchronously
async function initializeProductsConfig() {
  PRODUCTS.studentPro.productId = await SecretsService.getSecret(
    "LEMONSQUEEZY_STUDENT_PRO_PRODUCT_ID"
  );
  PRODUCTS.studentPro.variantId = await SecretsService.getSecret(
    "LEMONSQUEEZY_STUDENT_PRO_VARIANT_ID"
  );
  PRODUCTS.researcher.productId = await SecretsService.getSecret(
    "LEMONSQUEEZY_RESEARCHER_PRODUCT_ID"
  );
  PRODUCTS.researcher.variantId = await SecretsService.getSecret(
    "LEMONSQUEEZY_RESEARCHER_VARIANT_ID"
  );
  PRODUCTS.oneTime.productId = await SecretsService.getSecret(
    "LEMONSQUEEZY_ONETIME_PRODUCT_ID"
  );
  PRODUCTS.oneTime.variantId = await SecretsService.getSecret(
    "LEMONSQUEEZY_ONETIME_VARIANT_ID"
  );
  PRODUCTS.institutional.productId = await SecretsService.getSecret(
    "LEMONSQUEEZY_INSTITUTIONAL_PRODUCT_ID"
  );
  PRODUCTS.institutional.variantId = await SecretsService.getSecret(
    "LEMONSQUEEZY_INSTITUTIONAL_VARIANT_ID"
  );
}

// Initialize the configuration
initializeProductsConfig();

// Generate checkout URL
export async function createCheckoutUrl(
  variantId: string,
  userId: string,
  userEmail: string,
  affiliateRef?: string,
  customPrice?: number // Optional custom price in cents for one-time payments
) {
  console.log("Creating checkout URL with parameters:", {
    variantId,
    userId,
    userEmail,
    affiliateRef,
    apiKey: config.lemonsqueezy.apiKey ? "SET" : "NOT_SET",
    storeId: LEMONSQUEEZY_STORE_ID,
    NODE_ENV: (await SecretsService.getNodeEnv()) || "development",
  });

  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey || !LEMONSQUEEZY_STORE_ID) {
    console.error("LemonSqueezy not configured:", {
      hasApiKey: !!config.lemonsqueezy.apiKey,
      hasStoreId: !!LEMONSQUEEZY_STORE_ID,
      storeIdValue: LEMONSQUEEZY_STORE_ID,
    });
    throw new Error(
      "LemonSqueezy is not configured. Please set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID in environment variables."
    );
  }

  initializeLemonSqueezy();

  console.log("Calling LemonSqueezy.createCheckout with:", {
    storeId: LEMONSQUEEZY_STORE_ID,
    variantId,
    userEmail,
    userId,
  });

  // Determine redirect URL based on environment
  const frontendUrl =
    (await SecretsService.getFrontendUrl()) || "http://localhost:3000";
  const successRedirectUrl = `${frontendUrl}/post-checkout`;
  const cancelRedirectUrl = `${frontendUrl}/pricing`;

  const checkout = await lemonSqueezyCircuitBreaker.execute(async () => {
    const checkoutParams: any = {
      checkoutData: {
        email: userEmail,
        custom: {
          user_id: userId, // Pass user ID for webhook processing
          ...(affiliateRef && { affiliate_ref: affiliateRef }), // Pass affiliate reference if available
        },
      },
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
        desc: true,
        discount: true,
        dark: false,
        subscriptionPreview: true,
      },
      productOptions: {
        redirectUrl: successRedirectUrl, // Redirect to post-checkout page on success
      },
      expiresAt: null,
      preview: false,
      testMode: (await SecretsService.getNodeEnv()) !== "production",
    };

    // Add custom price if provided (for one-time payments)
    if (customPrice !== undefined && customPrice > 0) {
      checkoutParams.customPrice = customPrice; // Custom price in cents
    }

    return await LemonSqueezy.createCheckout(
      LEMONSQUEEZY_STORE_ID,
      variantId,
      checkoutParams
    );
  });

  console.log("Checkout response:", checkout);

  if (!checkout.data) {
    throw new Error("Failed to create checkout");
  }

  return checkout.data.data.attributes.url;
}

// Get subscription details
export async function getSubscriptionDetails(subscriptionId: string) {
  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  initializeLemonSqueezy();
  const subscription = await lemonSqueezyCircuitBreaker.execute(async () => {
    return await LemonSqueezy.getSubscription(subscriptionId);
  });
  return subscription.data;
}

// Cancel subscription
export async function cancelSubscriptionById(subscriptionId: string) {
  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  initializeLemonSqueezy();
  const result = await lemonSqueezyCircuitBreaker.execute(async () => {
    return await LemonSqueezy.cancelSubscription(subscriptionId);
  });
  return result.data;
}

// Update subscription (change plan)
export async function updateSubscriptionDetails(
  subscriptionId: string,
  newVariantId: number
) {
  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  initializeLemonSqueezy();
  const result = await lemonSqueezyCircuitBreaker.execute(async () => {
    return await LemonSqueezy.updateSubscription(subscriptionId, {
      variantId: newVariantId,
    });
  });
  return result.data;
}

// Resume cancelled subscription
export async function resumeSubscription(subscriptionId: string) {
  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  initializeLemonSqueezy();
  const result = await lemonSqueezyCircuitBreaker.execute(async () => {
    return await LemonSqueezy.updateSubscription(subscriptionId, {
      cancelled: false,
    });
  });
  return result.data;
}

// Get customer portal URL
// LemonSqueezy doesn't have a direct API for this, so we'll create a workaround
export async function getCustomerPortalUrl(storeId: string) {
  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  // The customer portal URL follows this pattern:
  // https://your-store-name.lemonsqueezy.com/my-orders
  // We need to get the store name from the store ID

  initializeLemonSqueezy();
  try {
    const store = await lemonSqueezyCircuitBreaker.execute(async () => {
      return await LemonSqueezy.getStore(storeId);
    });
    const storeSlug = store.data?.data?.attributes?.slug;

    if (!storeSlug) {
      throw new Error("Could not retrieve store slug");
    }

    return `https://${storeSlug}.lemonsqueezy.com/my-orders`;
  } catch (error) {
    console.error("Error getting customer portal URL:", error);
    // Fallback to a generic URL
    return "https://app.lemonsqueezy.com/my-orders";
  }
}

// Get upcoming invoice
export async function getUpcomingInvoice(subscriptionId: string) {
  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  initializeLemonSqueezy();

  try {
    // Generate a subscription invoice which represents the upcoming invoice
    const invoice = await lemonSqueezyCircuitBreaker.execute(async () => {
      return await LemonSqueezy.generateSubscriptionInvoice(subscriptionId);
    });
    return invoice.data;
  } catch (error) {
    console.error("Error getting upcoming invoice:", error);
    throw error;
  }
}

// Apply discount to checkout
export async function applyDiscount(checkoutId: string, discountCode: string) {
  // Skip if LemonSqueezy is not configured
  if (!config.lemonsqueezy.apiKey) {
    throw new Error("LemonSqueezy is not configured");
  }

  initializeLemonSqueezy();

  try {
    // First, we need to find the discount by code
    const discounts = await lemonSqueezyCircuitBreaker.execute(async () => {
      return await LemonSqueezy.listDiscounts();
    });
    const discount = discounts.data?.data?.find(
      (d: any) => d.attributes.code === discountCode
    );

    if (!discount) {
      throw new Error("Invalid discount code");
    }

    // Apply discount to checkout
    // Note: The LemonSqueezy API doesn't have a direct way to apply a discount to an existing checkout
    // We'll return the discount information so the frontend can handle it
    return {
      discountId: discount.id,
      discountCode: discount.attributes.code,
      discountType:
        (discount.attributes as any).type ||
        (discount.attributes as any).discount_type ||
        "",
      discountAmount:
        (discount.attributes as any).amount_cents ||
        (discount.attributes as any).amount ||
        0,
      discountPercentage:
        (discount.attributes as any).percentage ||
        (discount.attributes as any).percent ||
        0,
    };
  } catch (error) {
    console.error("Error applying discount:", error);
    throw error;
  }
}
