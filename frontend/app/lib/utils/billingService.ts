import { apiClient } from "./apiClient";

export interface Subscription {
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
    excludedFeatures: string[];
  };
  subscription: {
    status: string;
    current_period_end?: string;
  } | null;
  usage: {
    projects: {
      used: number;
      limit: number;
      percentage: number;
    };
    plagiarismChecks: {
      used: number;
      limit: number;
      percentage: number;
    };
    aiRequests: {
      used: number;
      limit: number;
      percentage: number;
    };
    aiChatMessages: {
      used: number;
      limit: number;
      percentage: number;
    };
    aiWebSearches: {
      used: number;
      limit: number;
      percentage: number;
    };
    aiDeepSearches: {
      used: number;
      limit: number;
      percentage: number;
    };
    aiCost: {
      used: number;
      limit: number;
      percentage: number;
    };
    words: {
      used: number;
      limit: number;
      percentage: number;
    };
    storage: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
}

export interface UsageMetric {
  name: string;
  used: number;
  limit: number | "unlimited";
  unit: string;
  percentage: number;
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "failed" | "refunded" | "pending";
  receiptUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex" | "paypal";
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  limits: {
    projects: number | "unlimited";
    words: number | "unlimited";
    plagiarismChecks: number | "unlimited";
    aiRequests: number | "unlimited";
    collaborators: number | "unlimited";
    storage: number; // in GB
  };
}

export interface OneTimePaymentPlan extends Plan {
  type: "one-time";
  sessionToken?: string;
  currentCost?: number;
}

class BillingService {
  // Cache for subscription data to prevent repeated requests
  private static subscriptionCache: {
    data: Subscription | null;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  } = {
    data: null,
    timestamp: 0,
    ttl: 30000, // 30 seconds cache
  };

  // Clear the subscription cache (useful when subscription data might have changed)
  static clearSubscriptionCache(): void {
    this.subscriptionCache.data = null;
    this.subscriptionCache.timestamp = 0;
  }

  // Get current subscription with retry logic and timeout
  static async getCurrentSubscription(
    retryCount = 0, // DISABLE retries to prevent infinite loops
    useCache = true
  ): Promise<Subscription> {
    // Check cache first if enabled
    if (useCache && this.subscriptionCache.data) {
      const now = Date.now();
      if (now - this.subscriptionCache.timestamp < this.subscriptionCache.ttl) {
        console.log("Returning cached subscription data");
        return this.subscriptionCache.data;
      }
    }

    try {
      // Fetch subscription data directly without additional timeout wrapper
      // The apiClient now handles timeouts properly with AbortController
      const response: any = await apiClient.get("/api/billing/subscription");

      // Handle 401 unauthorized responses
      if (response && response.error === "Unauthorized") {
        throw new Error("User not authenticated");
      }

      // The backend returns { success: true, subscription: data }
      // So we need to return response.subscription
      if (!response || !response.subscription) {
        throw new Error("Invalid response structure from billing service");
      }

      // Cache the response
      this.subscriptionCache.data = response.subscription;
      this.subscriptionCache.timestamp = Date.now();

      console.log("Subscription data from API:", response.subscription);
      return response.subscription;
    } catch (error: any) {
      console.error("Error fetching subscription:", error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error("Detailed error info:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }

      // If it's a connection pool timeout error, don't retry
      if (
        error.message?.includes("connection pool timeout") ||
        error.message?.includes("Timed out fetching a new connection") ||
        error.message?.includes("Subscription fetch timeout") ||
        error.message?.includes("Network error") ||
        error.message?.includes("ERR_INSUFFICIENT_RESOURCES") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Service temporarily unavailable") ||
        error.message?.includes("Request timeout") ||
        error.name === "AbortError"
      ) {
        console.log(
          "Subscription fetch failed - NOT retrying to prevent infinite loop"
        );
        // Return a default subscription object to prevent dashboard from hanging
        return {
          plan: {
            id: "free",
            name: "Free Plan",
            price: 0,
            features: [],
            excludedFeatures: [],
          },
          subscription: null,
          usage: {
            projects: { used: 0, limit: 3, percentage: 0 },
            plagiarismChecks: { used: 0, limit: 1, percentage: 0 },
            aiRequests: { used: 0, limit: 50, percentage: 0 },
            aiChatMessages: { used: 0, limit: 100, percentage: 0 },
            aiWebSearches: { used: 0, limit: 20, percentage: 0 },
            aiDeepSearches: { used: 0, limit: 5, percentage: 0 },
            aiCost: { used: 0, limit: 1, percentage: 0 },
            words: { used: 0, limit: 10000, percentage: 0 },
            storage: { used: 0, limit: 1, percentage: 0 },
          },
        };
      }

      // Provide more specific error messages based on the error type
      if (error.message?.includes("Service temporarily unavailable")) {
        throw new Error(
          "Service temporarily unavailable. Please try again later."
        );
      }

      if (
        error.message?.includes("Network error") ||
        error.message?.includes("Failed to fetch")
      ) {
        throw new Error(
          "Network connection error. Please check your internet connection and try again."
        );
      }

      if (error.message?.includes("Request timeout")) {
        throw new Error(
          "Request timeout - service may be temporarily unavailable. Please try again later."
        );
      }

      // Return a default subscription object as a fallback
      return {
        plan: {
          id: "free",
          name: "Free Plan",
          price: 0,
          features: [],
          excludedFeatures: [],
        },
        subscription: null,
        usage: {
          projects: { used: 0, limit: 3, percentage: 0 },
          plagiarismChecks: { used: 0, limit: 1, percentage: 0 },
          aiRequests: { used: 0, limit: 50, percentage: 0 },
          aiChatMessages: { used: 0, limit: 100, percentage: 0 },
          aiWebSearches: { used: 0, limit: 20, percentage: 0 },
          aiDeepSearches: { used: 0, limit: 5, percentage: 0 },
          aiCost: { used: 0, limit: 1, percentage: 0 },
          words: { used: 0, limit: 10000, percentage: 0 },
          storage: { used: 0, limit: 1, percentage: 0 },
        },
      };
    }
  }

  // Get usage metrics
  static async getUsageMetrics(): Promise<UsageMetric[]> {
    try {
      // Fetch usage metrics data directly without additional timeout wrapper
      // The apiClient now handles timeouts properly with AbortController
      const response: any = await apiClient.get("/api/billing/usage");

      // Handle 401 unauthorized responses
      if (response && response.error === "Unauthorized") {
        throw new Error("User not authenticated");
      }

      // The backend returns { success: true, metrics: data }
      // So we need to return response.metrics
      if (!response || !response.metrics) {
        throw new Error("Invalid response structure from billing service");
      }

      // Convert the backend metrics to the frontend UsageMetric format
      const metrics = response.metrics;
      const usageMetrics: UsageMetric[] = [
        {
          name: "Projects",
          used: metrics.projects.used,
          limit:
            metrics.projects.limit === -1
              ? "unlimited"
              : metrics.projects.limit,
          unit: "projects",
          percentage: metrics.projects.percentage,
        },
        {
          name: "Plagiarism Checks",
          used: metrics.plagiarismChecks.used,
          limit:
            metrics.plagiarismChecks.limit === -1
              ? "unlimited"
              : metrics.plagiarismChecks.limit,
          unit: "checks",
          percentage: metrics.plagiarismChecks.percentage,
        },
        {
          name: "AI Requests",
          used: metrics.aiRequests.used,
          limit:
            metrics.aiRequests.limit === -1
              ? "unlimited"
              : metrics.aiRequests.limit,
          unit: "requests",
          percentage: metrics.aiRequests.percentage,
        },
        {
          name: "AI Chat Messages",
          used: metrics.aiChatMessages.used,
          limit:
            metrics.aiChatMessages.limit === -1
              ? "unlimited"
              : metrics.aiChatMessages.limit,
          unit: "messages",
          percentage: metrics.aiChatMessages.percentage,
        },
        {
          name: "AI Web Searches",
          used: metrics.aiWebSearches.used,
          limit:
            metrics.aiWebSearches.limit === -1
              ? "unlimited"
              : metrics.aiWebSearches.limit,
          unit: "searches",
          percentage: metrics.aiWebSearches.percentage,
        },
        {
          name: "AI Deep Searches",
          used: metrics.aiDeepSearches.used,
          limit:
            metrics.aiDeepSearches.limit === -1
              ? "unlimited"
              : metrics.aiDeepSearches.limit,
          unit: "searches",
          percentage: metrics.aiDeepSearches.percentage,
        },
        {
          name: "AI Cost",
          used: metrics.aiCost.used,
          limit:
            metrics.aiCost.limit === -1 ? "unlimited" : metrics.aiCost.limit,
          unit: "USD",
          percentage: metrics.aiCost.percentage,
        },
        {
          name: "Words",
          used: metrics.words.used,
          limit: metrics.words.limit === -1 ? "unlimited" : metrics.words.limit,
          unit: "words",
          percentage: metrics.words.percentage,
        },
        {
          name: "Storage",
          used: metrics.storage.used,
          limit: metrics.storage.limit,
          unit: "GB",
          percentage: metrics.storage.percentage,
        },
      ];

      return usageMetrics;
    } catch (error: any) {
      console.error("Error fetching usage metrics:", error);

      // Handle network errors specifically
      if (
        error.message?.includes("ERR_INSUFFICIENT_RESOURCES") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network error") ||
        error.message?.includes("Request timeout")
      ) {
        throw new Error(
          "Network error - please check your connection and try again"
        );
      }

      throw new Error("Failed to fetch usage metrics");
    }
  }

  // Get AI cost analytics
  static async getAICostAnalytics(): Promise<{
    totalCost: number;
    costByModel: Record<
      string,
      { count: number; totalCost: number; avgCost: number }
    >;
    costByAction: Record<
      string,
      { count: number; totalCost: number; avgCost: number }
    >;
    predictedCost: number;
    trend: string;
  }> {
    try {
      const response = await apiClient.get("/api/ai/analytics/cost-analysis");

      if (!response || !response.data) {
        throw new Error(
          "Invalid response structure from AI cost analytics service"
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching AI cost analytics:", error);
      throw new Error("Failed to fetch AI cost analytics");
    }
  }

  // Get AI cost predictions
  static async getAICostPredictions(): Promise<{
    predictedCost: number;
    confidence: number;
    trend: string;
  }> {
    try {
      const response = await apiClient.get("/api/ai/analytics/cost-prediction");

      if (!response || !response.data) {
        throw new Error(
          "Invalid response structure from AI cost prediction service"
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching AI cost predictions:", error);
      throw new Error("Failed to fetch AI cost predictions");
    }
  }

  // Get cost efficiency recommendations
  static async getCostEfficiencyRecommendations(): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      priority: number;
      impact: string;
      action_type: string;
      action_data: any;
    }>
  > {
    try {
      const response = await apiClient.get(
        "/api/ai/analytics/cost-recommendations"
      );

      if (!response || !response.data) {
        throw new Error(
          "Invalid response structure from cost efficiency recommendations service"
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching cost efficiency recommendations:", error);
      throw new Error("Failed to fetch cost efficiency recommendations");
    }
  }

  // Get billing history
  static async getBillingHistory(): Promise<Invoice[]> {
    try {
      const response = await apiClient.get("/api/billing/invoices");
      // The backend returns { success: true, invoices: data }
      // So we need to return response.invoices
      if (!response || !response.invoices) {
        throw new Error("Invalid response structure from billing service");
      }
      return response.invoices;
    } catch (error) {
      console.error("Error fetching billing history:", error);
      throw new Error("Failed to fetch billing history");
    }
  }

  // Get payment methods
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get("/api/billing/payment-methods");
      // The backend returns { success: true, paymentMethods: data }
      // So we need to return response.paymentMethods
      if (!response || !response.paymentMethods) {
        throw new Error("Invalid response structure from billing service");
      }
      return response.paymentMethods;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw new Error("Failed to fetch payment methods");
    }
  }

  // Add payment method
  static async addPaymentMethod(
    paymentMethod: Omit<PaymentMethod, "id" | "isDefault">
  ): Promise<PaymentMethod> {
    try {
      const response = await apiClient.post(
        "/api/billing/payment-methods",
        paymentMethod
      );
      // The backend returns { success: true, paymentMethod: data }
      // So we need to return response.paymentMethod
      if (!response || !response.paymentMethod) {
        throw new Error("Invalid response structure from billing service");
      }
      return response.paymentMethod;
    } catch (error) {
      console.error("Error adding payment method:", error);
      throw new Error("Failed to add payment method");
    }
  }

  // Set default payment method
  static async setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
    try {
      const response = await apiClient.put(
        `/api/billing/payment-methods/${id}/default`,
        {}
      );
      // The backend returns { success: true, paymentMethod: data }
      // So we need to return response.paymentMethod
      if (!response || !response.paymentMethod) {
        throw new Error("Invalid response structure from billing service");
      }
      return response.paymentMethod;
    } catch (error) {
      console.error("Error setting default payment method:", error);
      throw new Error("Failed to set default payment method");
    }
  }

  // Remove payment method
  static async removePaymentMethod(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(
        `/api/billing/payment-methods/${id}`,
        {}
      );
      return response;
    } catch (error) {
      console.error("Error removing payment method:", error);
      throw new Error("Failed to remove payment method");
    }
  }

  // Get available plans
  static async getPlans(): Promise<Plan[]> {
    try {
      const response = await apiClient.get("/api/billing/plans");
      // The backend returns { success: true, plans: data }
      // So we need to return response.plans
      if (!response || !response.plans) {
        throw new Error("Invalid response structure from billing service");
      }
      return response.plans;
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw new Error("Failed to fetch plans");
    }
  }

  // Change plan
  static async changePlan(
    planId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post("/api/billing/change-plan", {
        planId,
      });
      return response;
    } catch (error) {
      console.error("Error changing plan:", error);
      throw new Error("Failed to change plan");
    }
  }

  // Cancel subscription
  static async cancelSubscription(
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post("/api/billing/cancel", { reason });
      return response;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw new Error("Failed to cancel subscription");
    }
  }

  // Reactivate subscription
  static async reactivateSubscription(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.post("/api/billing/reactivate", {});
      return response;
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw new Error("Failed to reactivate subscription");
    }
  }

  // Update payment method
  static async updatePaymentMethod(): Promise<{
    success: boolean;
    redirectUrl: string;
  }> {
    try {
      const response = await apiClient.post(
        "/api/billing/update-payment-method",
        {}
      );
      return response;
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw new Error("Failed to update payment method");
    }
  }

  // Get customer portal URL
  static async getCustomerPortalUrl(): Promise<{
    success: boolean;
    url: string;
  }> {
    try {
      const response = await apiClient.get("/api/billing/customer-portal");
      return response;
    } catch (error) {
      console.error("Error getting customer portal URL:", error);
      throw new Error("Failed to get customer portal URL");
    }
  }

  // Apply promo code
  static async applyPromoCode(code: string): Promise<{
    success: boolean;
    message: string;
    discount?: number;
    newPrice?: number;
  }> {
    try {
      const response = await apiClient.post("/api/billing/apply-promo", {
        code,
      });
      return response;
    } catch (error) {
      console.error("Error applying promo code:", error);
      throw new Error("Failed to apply promo code");
    }
  }

  // Get upcoming invoice
  static async getUpcomingInvoice(): Promise<{
    amount: number;
    date: string;
    items: { description: string; amount: number }[];
  }> {
    try {
      const response = await apiClient.get("/api/billing/upcoming-invoice");
      // The backend returns { success: true, invoice: data }
      // So we need to return response.invoice
      if (!response || !response.invoice) {
        throw new Error("Invalid response structure from billing service");
      }
      return response.invoice;
    } catch (error) {
      console.error("Error fetching upcoming invoice:", error);
      throw new Error("Failed to fetch upcoming invoice");
    }
  }

  // Create checkout session
  static async createCheckoutSession(planId: string): Promise<{
    success: boolean;
    checkoutUrl?: string;
    message?: string;
  }> {
    try {
      const response = await apiClient.post("/api/billing/create-checkout", {
        planId,
      });
      return response;
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create checkout session"
      );
    }
  }

  // Create checkout session for unauthenticated users
  static async createUnauthCheckoutSession(userData: {
    planId: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
  }): Promise<{
    success: boolean;
    checkoutUrl?: string;
    tempUserId?: string;
    userData?: any;
    message?: string;
  }> {
    try {
      const response = await apiClient.post(
        "/api/billing/create-checkout-unauth",
        userData
      );
      return response;
    } catch (error: any) {
      console.error("Error creating unauthenticated checkout session:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create checkout session"
      );
    }
  }

  // Check if user has access to a specific feature with improved timeout handling
  static async hasFeatureAccess(feature: string): Promise<boolean> {
    try {
      // Add timeout to prevent hanging requests (increased from 5s to 15s)
      let subscription: Subscription;
      try {
        subscription = (await Promise.race([
          this.getCurrentSubscription(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Feature access check timeout")),
              30000 // Increased timeout to 30 seconds
            )
          ),
        ])) as Subscription;
      } catch (timeoutError) {
        // Log timeout but don't rethrow - instead try without timeout
        console.warn(
          `Timeout checking feature access for ${feature}, trying without timeout`
        );
        try {
          // Try one more time without timeout but with cache disabled
          subscription = await this.getCurrentSubscription(0, false);
        } catch (finalError) {
          console.error(
            `Final error checking feature access for ${feature}:`,
            finalError
          );
          // Return false to prevent breaking the UI
          return false;
        }
      }

      return this.checkFeatureAccessDirect(subscription, feature);
    } catch (error: any) {
      console.error(`Error checking feature access for ${feature}:`, error);

      // Handle network errors specifically
      if (
        error.message?.includes("ERR_INSUFFICIENT_RESOURCES") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("Network error") ||
        error.message?.includes("Feature access check timeout") ||
        error.message?.includes("Service temporarily unavailable") ||
        error.message?.includes("Request timeout")
      ) {
        console.warn(
          `Network error during feature access check for ${feature}, defaulting to false`
        );
        // Return false immediately for network errors to prevent infinite loops
        return false;
      }

      // Return false as a fallback
      return false;
    }
  }

  // Check feature access directly with a provided subscription (no additional API calls)
  static checkFeatureAccessDirect(
    subscription: Subscription,
    feature: string
  ): boolean {
    const planId = subscription.plan.id;
    console.log(`Checking feature access for ${feature}. Plan ID: ${planId}`);

    // Check if user has access to the feature based on their plan
    switch (feature) {
      case "analytics":
        // Analytics available for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      case "research_impact":
        // Research impact analytics only for Researcher plan
        return planId === "researcher";
      case "advanced_templates":
        // Advanced templates for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      case "custom_templates":
        // Custom templates only for Researcher plan
        return planId === "researcher";
      case "all_citation_formats":
        // All citation formats for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      case "custom_citation_formats":
        // Custom citation formats only for Researcher plan
        return planId === "researcher";
      case "unlimited_version_history":
        // Unlimited version history only for Researcher plan
        return planId === "researcher";
      case "role_based_permissions":
        // Role-based permissions only for Researcher plan
        return planId === "researcher";
      case "advanced_role_based_permissions":
        // Advanced role-based permissions only for Researcher plan
        return planId === "researcher";
      case "custom_ai_prompts":
        // Custom AI prompts for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      case "unlimited_custom_ai_prompts":
        // Unlimited custom AI prompts only for Researcher plan
        return planId === "researcher";
      case "advanced_plagiarism":
        // Advanced plagiarism for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      case "institution_grade_plagiarism":
        // Institution-grade plagiarism only for Researcher plan
        return planId === "researcher";
      case "phone_chat_support":
        // Phone & chat support only for Researcher plan
        return planId === "researcher";
      case "dedicated_manager": {
        // Dedicated account manager only for Researcher plan
        return planId === "researcher";
      }
      case "journal_ready_export":
        // Journal-ready export formats only for Researcher plan
        return planId === "researcher";
      case "co_author_management":
        // Co-author management only for Researcher plan
        return planId === "researcher";
      case "compliance_ready":
        // Compliance-ready only for Researcher plan
        return planId === "researcher";
      case "integration_options":
        // Integration options only for Researcher plan
        return planId === "researcher";
      case "collaboration_chat_upload":
        // File uploads in chat for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      case "collaboration_chat_message":
        // Chat messaging for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      // Add missing feature access checks
      case "collaboration_insights":
        // Collaboration insights for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      case "ai_analytics":
        // AI analytics for Student Pro and Researcher plans
        return planId === "student" || planId === "researcher";
      default:
        return false;
    }
  }

  // Send test billing notification
  static async sendTestBillingNotification(
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post("/api/billing/test-notification", {
        type,
        title,
        message,
        data,
      });
      return response;
    } catch (error) {
      console.error("Error sending test billing notification:", error);
      throw new Error("Failed to send test billing notification");
    }
  }
}

export default BillingService;
