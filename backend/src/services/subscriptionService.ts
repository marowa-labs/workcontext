import { prisma } from "../lib/prisma";
import IdempotencyService from "./idempotencyService";
import SubscriptionMonitoringService from "./subscriptionMonitoringService";
import {
  createBillingNotification,
  sendPaymentSuccessNotification,
  sendPaymentFailedNotification,
  sendSubscriptionRenewedNotification,
  sendSubscriptionExpiringNotification,
  sendSubscriptionCancelledNotification,
  sendSubscriptionCreatedNotification,
  sendSubscriptionUpdatedNotification,
  sendPaymentRefundedNotification,
  sendInvoiceAvailableNotification,
} from "./notificationService";

// Plan definitions with comprehensive feature sets
export const plans = {
  free: {
    name: "Free",
    price: 0,
    features: {
      projects: -1, // unlimited
      plagiarismChecks: 0,
      aiRequests: 25,
      aiChatMessages: 10,
      aiWebSearches: 0,
      aiDeepSearches: 0,
      collaborators: 10,
      storage: 0.1, // in GB (100MB)
      words: 5000, // AI words/month
      templates: "basic",
      citationFormats: 26000,
      versionHistory: 7, // days
      support: "community",
      aiCostLimit: 0, // No AI cost limit since it's included
    },
    analytics: {
      writingProductivity: false,
      originalityInsights: false,
      writingQuality: false,
      collaborationInsights: false,
      researchImpact: false,
    },
    featuresList: [
      "Basic templates",
      "All citation formats",
      "Export to Word/PDF",
      "Real-time collaboration (up to 10 members)",
      "7-day version history",
      "5,000 AI words/month",
      "Grammar & spell check",
      "Unlimited projects",
      "Basic writing suggestions",
      "Max 25 AI Requests/Month",
      "GPT-4o-mini",
      "No Access to Premium Models (Gemini 2.0 Flash Only, GPT-4o, Claude 3.5 Sonnet, Claude 3 Haiku, Gemini 3.1 Flash Lite)",
      "100MB Storage",
      "Community Support",
    ],
    // Features NOT included in free plan
    excludedFeatures: [
      "Plagiarism Detection",
      "Real-time Collaboration",
      "Tone & Clarity Analysis",
      "Custom AI Prompts",
      "Advanced Plagiarism Database",
      "Role-based Permissions",
      "Team Members",
      "Writing Analytics",
      "Direct Support",
      "Premium AI Models",
    ],
  },
  onetime: {
    name: "One-Time Pay-As-You-Go",
    price: 15, // $15 minimum session
    features: {
      projects: -1, // unlimited
      plagiarismChecks: -1, // unlimited
      aiRequests: -1, // unlimited gpt-4o-mini + gemini-2.5-flash
      aiChatMessages: -1, // unlimited
      aiWebSearches: -1, // unlimited
      aiDeepSearches: -1, // unlimited
      collaborators: -1, // unlimited
      storage: 5, // in GB
      words: 25000, // First $15 covers up to 25,000 AI words/month
      templates: "all",
      citationFormats: "all",
      versionHistory: 30, // days
      support: "email",
      aiCostLimit: 15, // $15 one-time payment AI cost limit
    },
    analytics: {
      writingProductivity: true,
      originalityInsights: true,
      writingQuality: true,
      collaborationInsights: true,
      researchImpact: false,
    },
    featuresList: [
      "All templates & citation formats",
      "Real-time collaboration",
      "30-day version history",
      "$15/session (minimum), usage-based overages",
      "First $15 covers up to 25,000 words",
      "Additional usage billed at $0.0006/word",
      "Models: GPT-4o-mini + Gemini Flash",
      "Email support",
      "5GB storage",
    ],
    excludedFeatures: [
      "Phone & Chat Support",
      "Dedicated Account Manager",
      "Unlimited Version History",
      "Research Impact Analytics",
      "Custom Templates",
      "Premium AI Models (GPT-4o, Claude 3.5 Sonnet, Gemini 3.1 Flash Lite)",
      "Institution-grade Plagiarism Detection (1B+ sources)",
      "Custom Citation Formats (journal or publisher-specific)",
      "Advanced Writing Analytics (insights, originality scoring)",
      "Journal-ready export formats (DOCX, PDF, LaTeX, journal templates)",
      "Co-author management & collaborative versioning",
      "Integration options (Zotero, Mendeley, Overleaf, etc.)",
    ],
  },
  student: {
    name: "Student",
    price: 15,
    features: {
      projects: -1, // unlimited
      plagiarismChecks: -1, // unlimited
      aiRequests: 170, // 100 GPT-4o-mini + 20 claude-3-haiku + 50 Gemini Flash = 170 total
      aiChatMessages: 1000,
      aiWebSearches: 50,
      aiDeepSearches: 10,
      collaborators: 100,
      storage: 100, // in GB
      words: 75000, // AI words/month
      templates: "all",
      citationFormats: "all",
      versionHistory: 30, // days
      support: "email",
      aiCostLimit: 20, // $20 monthly AI cost limit
    },
    analytics: {
      writingProductivity: true,
      originalityInsights: true,
      writingQuality: true,
      collaborationInsights: true,
      researchImpact: false,
    },
    featuresList: [
      "All templates",
      "Advanced plagiarism detection",
      "Real-time collaboration (up to 100 members)",
      "All citation formats",
      "30-day version history",
      "Email support",
      "Writing analytics dashboard",
      "75,000 AI words/month (~450k tokens)",
      "100 GPT-4o-mini requests",
      "20 Claude-3-Haiku requests (complex assignments)",
      "50 Gemini Flash requests",
      "100GB storage",
    ],
    excludedFeatures: [
      "Unlimited Team Members",
      "Advanced Role-based Permissions",
      "Phone & Chat Support",
      "Dedicated Account Manager",
      "Unlimited Version History",
      "Research Impact Analytics",
      "Custom Templates",
      "Premium AI Models (Claude 3.5 Sonnet, Gemini 3.1 Flash Lite)",
      "Unlimited Custom AI Prompts",
      "Institution-grade Plagiarism Detection (1B+ sources)",
      "Custom Citation Formats (journal or publisher-specific)",
      "Advanced Writing Analytics (insights, originality scoring)",
      "Journal-ready export formats (DOCX, PDF, LaTeX, journal templates)",
      "Co-author management & collaborative versioning",
      "Integration options (Zotero, Mendeley, Overleaf, etc.)",
    ],
  },
  researcher: {
    name: "Researcher",
    price: 35,
    features: {
      projects: -1, // unlimited
      plagiarismChecks: -1, // unlimited
      aiRequests: 375, // 100 GPT-4o  + 100 Gemini Pro  + 50 Claude Haiku  + 25 Claude Sonnet = 375 total, Unlimited GPT-4o-mini & Gemini Flash requests
      aiChatMessages: 5000,
      aiWebSearches: 500,
      aiDeepSearches: 100,
      collaborators: -1, // unlimited
      storage: 500, // in GB
      words: 300000, // AI words/month
      templates: "all", // custom templates
      citationFormats: "custom", // custom citation formats
      versionHistory: -1, // unlimited
      support: "phone_chat",
      aiCostLimit: 100, // $100 monthly AI cost limit
    },
    analytics: {
      writingProductivity: true,
      originalityInsights: true,
      writingQuality: true,
      collaborationInsights: true,
      researchImpact: true,
    },
    featuresList: [
      "All templates",
      "Institution-grade plagiarism detection",
      "Unlimited collaboration",
      "Custom citation styles",
      "Unlimited version history",
      "Advanced analytics",
      "Phone & chat support",
      "Dedicated account manager",
      "300,000 AI words/month (~1.8M tokens)",
      "Unlimited GPT-4o-mini & Gemini Flash requests",
      "100 GPT-4o requests/month",
      "50 Claude Haiku requests/month",
      "25 Claude Sonnet requests/month",
      "100 Gemini Pro requests/month",
      "500GB storage",
    ],
    excludedFeatures: [],
  },
};

// Define the return type interface
interface PlanInfo {
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
    excludedFeatures: string[];
    analytics: {
      writingProductivity: boolean;
      originalityInsights: boolean;
      writingQuality: boolean;
      collaborationInsights: boolean;
      researchImpact: boolean;
    };
  };
  subscription: {
    status: string;
    current_period_end: Date | null;
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

export class SubscriptionService {
  // Enhanced method to check if user can perform an action based on their plan and usage
  static async canPerformAction(
    userId: string,
    action:
      | "create_project"
      | "plagiarism_check"
      | "ai_request"
      | "ai_chat_message"
      | "ai_web_search"
      | "ai_deep_search"
      | "add_collaborator"
      | "use_advanced_templates"
      | "use_all_citation_formats"
      | "access_analytics"
      | "access_research_impact"
      | "use_custom_ai_prompts"
      | "access_advanced_plagiarism"
      | "use_role_based_permissions"
      | "access_phone_chat_support"
      | "access_api"
      | "access_dedicated_manager"
      | "unlimited_version_history"
      | "collaboration_chat_message"
      | "collaboration_chat_upload",
  ): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    let planId = (subscription?.plan as keyof typeof plans) || "free";
    const planLimits = plans[planId].features;

    // Check if user is part of an institutional subscription
    let isInstitutionalMember = false;
    /*
    try {
      // Import the institutional subscription service dynamically to avoid circular dependencies
      const { InstitutionalSubscriptionService } =
        await import("./institutionalSubscriptionService");
      const institutionalService = new InstitutionalSubscriptionService();
      const institutionalSubscription =
        await institutionalService.getUserSubscription(userId);
      isInstitutionalMember = !!institutionalSubscription;

      // If user is part of an institutional subscription, use the institutional plan limits
      if (isInstitutionalMember) {
        planId = "institutional";
        // Institutional users get unlimited access to all features
        const institutionalPlan = plans.institutional;
        Object.assign(planLimits, institutionalPlan.features);
      }
    } catch (error) {
      console.error("Error checking institutional membership:", error);
    }
    */

    switch (action) {
      case "create_project": {
        // Allow unlimited project creation for all users
        return { allowed: true };
      }

      case "plagiarism_check": {
        if (planLimits.plagiarismChecks === -1) return { allowed: true };
        // Count checks this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const checksThisMonth = await prisma.plagiarismReport.count({
          where: {
            user_id: userId,
            created_at: { gte: startOfMonth },
          },
        });
        if (checksThisMonth >= (planLimits.plagiarismChecks as number)) {
          return {
            allowed: false,
            reason: `You've used all ${planLimits.plagiarismChecks} plagiarism checks this month. Upgrade for unlimited checks.`,
          };
        }
        return { allowed: true };
      }

      case "ai_request": {
        if (
          planLimits.aiRequests === -1 ||
          (planLimits.aiRequests as number) === -1
        )
          return { allowed: true };
        // Count AI requests this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get AI usage for the current month
        const usage: any = await prisma.aIUsage.findUnique({
          where: {
            user_id_month_year: {
              user_id: userId,
              month: startOfMonth.getMonth() + 1,
              year: startOfMonth.getFullYear(),
            },
          },
        });

        const totalRequests =
          (usage?.request_count || 0) +
          (usage?.chat_message_count || 0) +
          (usage?.image_generation_count || 0) +
          (usage?.web_search_count || 0) +
          (usage?.deep_search_count || 0);

        if (totalRequests >= planLimits.aiRequests) {
          return {
            allowed: false,
            reason: `You've used all ${planLimits.aiRequests} AI requests this month. Upgrade for more.`,
          };
        }
        return { allowed: true };
      }

      case "ai_chat_message": {
        if (
          planLimits.aiChatMessages === -1 ||
          (planLimits.aiChatMessages as number) === -1
        )
          return { allowed: true };
        // Count AI chat messages this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get AI usage for the current month
        const usage: any = await prisma.aIUsage.findUnique({
          where: {
            user_id_month_year: {
              user_id: userId,
              month: startOfMonth.getMonth() + 1,
              year: startOfMonth.getFullYear(),
            },
          },
        });

        const chatMessages = usage?.chat_message_count || 0;

        if (chatMessages >= planLimits.aiChatMessages) {
          return {
            allowed: false,
            reason: `You've used all ${planLimits.aiChatMessages} AI chat messages this month. Upgrade for more.`,
          };
        }
        return { allowed: true };
      }

      case "ai_web_search": {
        if (
          planLimits.aiWebSearches === -1 ||
          (planLimits.aiWebSearches as number) === -1
        )
          return { allowed: true };
        // Count AI web searches this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get AI usage for the current month
        const usage: any = await prisma.aIUsage.findUnique({
          where: {
            user_id_month_year: {
              user_id: userId,
              month: startOfMonth.getMonth() + 1,
              year: startOfMonth.getFullYear(),
            },
          },
        });

        const webSearches = usage?.web_search_count || 0;

        if (webSearches >= planLimits.aiWebSearches) {
          return {
            allowed: false,
            reason: `You've used all ${planLimits.aiWebSearches} AI web searches this month. Upgrade for more.`,
          };
        }
        return { allowed: true };
      }

      case "ai_deep_search": {
        if (
          planLimits.aiDeepSearches === -1 ||
          (planLimits.aiDeepSearches as number) === -1
        )
          return { allowed: true };
        // Count AI deep searches this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get AI usage for the current month
        const usage: any = await prisma.aIUsage.findUnique({
          where: {
            user_id_month_year: {
              user_id: userId,
              month: startOfMonth.getMonth() + 1,
              year: startOfMonth.getFullYear(),
            },
          },
        });

        const deepSearches = usage?.deep_search_count || 0;

        if (deepSearches >= planLimits.aiDeepSearches) {
          return {
            allowed: false,
            reason: `You've used all ${planLimits.aiDeepSearches} AI deep searches this month. Upgrade for more.`,
          };
        }
        return { allowed: true };
      }

      case "add_collaborator": {
        // Check collaborator limit
        if (planLimits.collaborators === -1) return { allowed: true }; // Unlimited

        // Count current collaborators across all projects
        const collaboratorCount = await prisma.CollaboratorPresence.count({
          where: {
            project: {
              user_id: userId,
            },
          },
        });

        if (collaboratorCount >= planLimits.collaborators) {
          return {
            allowed: false,
            reason: `You've reached your collaborator limit (${planLimits.collaborators}). Upgrade for more collaborators.`,
          };
        }
        return { allowed: true };
      }

      case "use_advanced_templates": {
        // Only Student Pro and Researcher plans have access to all templates
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "advanced_templates",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Advanced templates require Student Pro or Researcher plan.",
        };
      }

      case "use_all_citation_formats": {
        // Only Student Pro and Researcher plans have access to all citation formats
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "all_citation_formats",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "All citation formats require Student Pro or Researcher plan.",
        };
      }

      case "access_analytics": {
        // Only Student Pro and Researcher plans have access to analytics
        const featureAccess = await this.hasFeatureAccess(userId, "analytics");
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Analytics dashboard requires Student Pro or Researcher plan.",
        };
      }

      case "access_research_impact": {
        // Only Researcher plan has access to research impact analytics
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "research_impact",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Research impact analytics require Researcher plan.",
        };
      }

      case "use_custom_ai_prompts": {
        // Only Student Pro and Researcher plans have access to custom AI prompts
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "custom_ai_prompts",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Custom AI prompts require Student Pro or Researcher plan.",
        };
      }

      case "access_advanced_plagiarism": {
        // Only Student Pro and Researcher plans have access to advanced plagiarism detection
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "advanced_plagiarism",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Advanced plagiarism detection requires Student Pro or Researcher plan.",
        };
      }

      case "use_role_based_permissions": {
        // Only Researcher plan has advanced role-based permissions
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "advanced_role_based_permissions",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Advanced role-based permissions require Researcher plan.",
        };
      }

      case "access_phone_chat_support": {
        // Only Researcher plan has phone & chat support
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "phone_chat_support",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Phone & chat support requires Researcher plan.",
        };
      }

      case "access_dedicated_manager": {
        // Only Researcher plan has dedicated account manager
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "dedicated_manager",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Dedicated account manager requires Researcher plan.",
        };
      }

      case "unlimited_version_history": {
        // Only Researcher plan has unlimited version history
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "unlimited_version_history",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Unlimited version history requires Researcher plan.",
        };
      }

      case "collaboration_chat_message": {
        // Allow chat messages for Student Pro and Researcher plans
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "collaboration_chat_message",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "Chat messaging requires Student Pro or Researcher plan.",
        };
      }

      case "collaboration_chat_upload": {
        // Allow file uploads for Student Pro and Researcher plans
        const featureAccess = await this.hasFeatureAccess(
          userId,
          "collaboration_chat_upload",
        );
        if (featureAccess.hasAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason:
            featureAccess.reason ||
            "File uploads in chat require Student Pro or Researcher plan.",
        };
      }

      default:
        return { allowed: false, reason: "Unknown action" };
    }
  }

  // Get user's current plan and usage
  static async getUserPlanInfo(
    userId: string,
    retryCount = 2, // Reduced retry count to prevent cascading delays
  ): Promise<PlanInfo> {
    console.log(`Fetching plan info for user: ${userId}`);
    console.log(`Retry count: ${retryCount}`);

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    console.log(`Start of month: ${startOfMonth.toISOString()}`);

    try {
      // Create a timeout wrapper function
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

      // Execute all database queries with proper timeout handling
      console.log(`Executing database queries for user: ${userId}`);

      // Execute queries with individual timeouts to prevent one slow query from blocking others
      // Use Promise.allSettled to ensure all promises are handled even if some fail
      const [
        subscriptionResult,
        aiUsageResult,
        projectCountResult,
        plagiarismCountResult,
        wordCountResult,
        storageUsedResult,
        aiWordCountResult,
      ] = await Promise.allSettled([
        withTimeout(
          prisma.subscription.findUnique({
            where: { user_id: userId },
          }),
          10000, // 10 second timeout
          "Subscription query timeout",
        ),
        withTimeout(
          prisma.aIUsage.findUnique({
            where: {
              user_id_month_year: {
                user_id: userId,
                month: startOfMonth.getMonth() + 1,
                year: startOfMonth.getFullYear(),
              },
            },
          }),
          10000, // 10 second timeout
          "AI usage query timeout",
        ),
        withTimeout(
          prisma.project.count({
            where: {
              user_id: userId,
              status: {
                not: "archived",
              },
            },
          }),
          8000, // 8 second timeout
          "Project count query timeout",
        ),
        withTimeout(
          prisma.taskTracking.count({
            where: {
              user_id: userId,
              service_type: "plagiarism",
              created_at: { gte: startOfMonth },
            },
          }),
          8000, // 8 second timeout
          "Plagiarism count query timeout",
        ),
        withTimeout(
          this.getUserWordCount(userId),
          12000, // 12 second timeout
          "Word count query timeout",
        ),
        withTimeout(
          this.getUserStorageUsed(userId),
          8000, // 8 second timeout
          "Storage used query timeout",
        ),
        withTimeout(
          this.getAIWordCount(userId),
          12000, // 12 second timeout
          "AI word count query timeout",
        ),
      ]);

      // Handle any rejected promises
      if (subscriptionResult.status === "rejected") {
        console.error("Subscription query failed:", subscriptionResult.reason);
        throw subscriptionResult.reason;
      }

      if (aiUsageResult.status === "rejected") {
        console.error("AI usage query failed:", aiUsageResult.reason);
        throw aiUsageResult.reason;
      }

      if (projectCountResult.status === "rejected") {
        console.error("Project count query failed:", projectCountResult.reason);
        throw projectCountResult.reason;
      }

      if (plagiarismCountResult.status === "rejected") {
        console.error(
          "Plagiarism count query failed:",
          plagiarismCountResult.reason,
        );
        throw plagiarismCountResult.reason;
      }

      if (storageUsedResult.status === "rejected") {
        console.error("Storage used query failed:", storageUsedResult.reason);
        throw storageUsedResult.reason;
      }

      // Extract values from fulfilled promises with proper typing
      const subscription = subscriptionResult.value as any;
      const aiUsage = aiUsageResult.value as any;
      const projectCount = projectCountResult.value as number;
      const plagiarismCount = plagiarismCountResult.value as number;
      const storageUsed =
        storageUsedResult.status === "fulfilled"
          ? (storageUsedResult.value as number)
          : 0;
      const wordCount =
        wordCountResult.status === "fulfilled"
          ? (wordCountResult.value as number)
          : 0;
      // aiWordCountResult is available if needed, but we rely on aggregating AIUsage tokens for cost estimation if needed,
      // or we could use it for specific limits. For now, let's just make sure we have the variable.
      // const aiWordCount = aiWordCountResult.status === "fulfilled" ? (aiWordCountResult.value as number) : 0;

      console.log(`Database queries completed for user: ${userId}`);

      let planId = subscription?.plan || "free";

      const plan = plans[planId as keyof typeof plans];

      // Calculate total AI usage
      const totalAIRequests =
        (aiUsage?.request_count || 0) +
        (aiUsage?.chat_message_count || 0) +
        (aiUsage?.image_generation_count || 0) +
        (aiUsage?.web_search_count || 0) +
        (aiUsage?.deep_search_count || 0);

      console.log(`Building response object for user: ${userId}`);

      const result = {
        plan: {
          id: planId,
          name: plan.name,
          price: plan.price,
          features: plan.featuresList,
          excludedFeatures: plan.excludedFeatures,
          analytics: plan.analytics,
        },
        subscription: subscription
          ? {
              status: subscription.status,
              current_period_end: subscription.current_period_end,
            }
          : null,
        usage: {
          projects: {
            used: projectCount,
            limit: plan.features.projects,
            percentage:
              plan.features.projects === -1
                ? 0
                : Math.min((projectCount / plan.features.projects) * 100, 100),
          },
          plagiarismChecks: {
            used: plagiarismCount,
            limit: plan.features.plagiarismChecks,
            percentage:
              plan.features.plagiarismChecks === -1
                ? 0
                : Math.min(
                    (plagiarismCount / plan.features.plagiarismChecks) * 100,
                    100,
                  ),
          },
          aiRequests: {
            used: totalAIRequests,
            limit: plan.features.aiRequests,
            percentage:
              plan.features.aiRequests === -1
                ? 0
                : Math.min(
                    (totalAIRequests / plan.features.aiRequests) * 100,
                    100,
                  ),
          },
          aiChatMessages: {
            used: aiUsage?.chat_message_count || 0,
            limit: plan.features.aiChatMessages,
            percentage:
              plan.features.aiChatMessages === -1
                ? 0
                : Math.min(
                    ((aiUsage?.chat_message_count || 0) /
                      plan.features.aiChatMessages) *
                      100,
                    100,
                  ),
          },
          aiWebSearches: {
            used: aiUsage?.web_search_count || 0,
            limit: plan.features.aiWebSearches,
            percentage:
              plan.features.aiWebSearches === -1
                ? 0
                : Math.min(
                    ((aiUsage?.web_search_count || 0) /
                      plan.features.aiWebSearches) *
                      100,
                    100,
                  ),
          },
          aiDeepSearches: {
            used: aiUsage?.deep_search_count || 0,
            limit: plan.features.aiDeepSearches,
            percentage:
              plan.features.aiDeepSearches === -1
                ? 0
                : Math.min(
                    ((aiUsage?.deep_search_count || 0) /
                      plan.features.aiDeepSearches) *
                      100,
                    100,
                  ),
          },
          storage: {
            used: storageUsed,
            limit: plan.features.storage,
            percentage: Math.min(
              (storageUsed / plan.features.storage) * 100,
              100,
            ),
          },
          aiCost: {
            used: aiUsage?.total_cost_estimate || 0,
            limit: SubscriptionService.getPlanAICostLimit(planId),
            percentage:
              SubscriptionService.getPlanAICostLimit(planId) === 0
                ? 0
                : Math.min(
                    ((aiUsage?.total_cost_estimate || 0) /
                      SubscriptionService.getPlanAICostLimit(planId)) *
                      100,
                    100,
                  ),
          },
          words: {
            used: wordCount,
            limit: plan.features.words,
            percentage:
              plan.features.words === -1
                ? 0
                : Math.min((wordCount / plan.features.words) * 100, 100),
          },
        },
      };

      console.log(`Successfully built response for user: ${userId}`);
      return result;
    } catch (error) {
      console.error(`Error fetching plan info for user ${userId}:`, error);

      // Handle connection pool timeout errors with retry logic
      if (
        retryCount > 0 &&
        error instanceof Error &&
        (error.message?.includes("timeout") ||
          error.message?.includes("connection pool") ||
          error.message?.includes("Timed out fetching a new connection") ||
          error.message?.includes("ERR_INSUFFICIENT_RESOURCES") ||
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("Network error"))
      ) {
        console.log(
          `Retrying getUserPlanInfo for user ${userId}... (${retryCount} attempts left)`,
        );
        // Wait before retrying (shorter delay to prevent cascading delays)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // ONLY retry if we have attempts left - prevent infinite recursion
        if (retryCount > 0) {
          return this.getUserPlanInfo(userId, retryCount - 1);
        } else {
          // If we've exhausted retries, throw a specific error
          throw new Error(
            `Max retries exceeded for user ${userId}. Last error: ${error.message}`,
          );
        }
      }

      // Log specific error details for debugging
      if (error instanceof Error) {
        console.error(`Detailed error for user ${userId}:`, {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }

      // Return a minimal response instead of throwing to prevent complete failure
      // This only executes if we've exhausted retries or have a non-retryable error
      console.log(`Returning default response for user ${userId} due to error`);
      const planId = "free";
      const plan = plans[planId as keyof typeof plans];

      return {
        plan: {
          id: planId,
          name: plan.name,
          price: plan.price,
          features: plan.featuresList,
          excludedFeatures: plan.excludedFeatures,
          analytics: plan.analytics,
        },
        subscription: null,
        usage: {
          projects: {
            used: 0,
            limit: plan.features.projects,
            percentage: 0,
          },
          plagiarismChecks: {
            used: 0,
            limit: plan.features.plagiarismChecks,
            percentage: 0,
          },
          aiRequests: {
            used: 0,
            limit: plan.features.aiRequests,
            percentage: 0,
          },
          aiChatMessages: {
            used: 0,
            limit: plan.features.aiChatMessages,
            percentage: 0,
          },
          aiWebSearches: {
            used: 0,
            limit: plan.features.aiWebSearches,
            percentage: 0,
          },
          aiDeepSearches: {
            used: 0,
            limit: plan.features.aiDeepSearches,
            percentage: 0,
          },
          aiCost: {
            used: 0,
            limit: this.getPlanAICostLimit(planId),
            percentage: 0,
          },
          words: {
            used: 0,
            limit: plan.features.words,
            percentage: 0,
          },
          storage: {
            used: 0,
            limit: plan.features.storage,
            percentage: 0,
          },
        },
      };
    }
  }

  // Get AI cost limit based on user's plan
  private static getPlanAICostLimit(planId: string): number {
    // Cost limits in USD per month
    const costLimits: Record<string, number> = {
      free: 0, // No AI cost limit for free plan since it's included
      student: 20, // $20 limit for student plan
      researcher: 100, // $100 limit for researcher plan
    };

    return costLimits[planId] ?? 0; // Default to free plan limit if not found
  }

  // Helper method to get user's word count
  static async getUserWordCount(userId: string): Promise<number> {
    try {
      const projects = await prisma.project.findMany({
        where: { user_id: userId },
        select: { word_count: true },
      });

      return projects.reduce(
        (sum: number, project: any) => sum + (project.word_count || 0),
        0,
      );
    } catch (error) {
      console.error("Error calculating user word count:", error);
      return 0;
    }
  }

  // New method to get AI-inserted word count
  static async getAIWordCount(userId: string): Promise<number> {
    try {
      // Check if the prisma client and model are properly initialized
      if (!prisma || typeof prisma.aIUsage === "undefined") {
        console.warn("Prisma aIUsage model is not available, returning 0");
        return 0;
      }

      const aggregations = await prisma.aIUsage.aggregate({
        _sum: {
          total_tokens_used: true,
        },
        where: {
          user_id: userId,
        },
      });

      // Approximate words from tokens (roughly 0.75 words per token)
      return Math.round((aggregations._sum.total_tokens_used || 0) * 0.75);
    } catch (error) {
      console.error("Error fetching AI word count:", error);
      return 0;
    }
  }

  // Helper method to get user's storage usage
  static async getUserStorageUsed(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { storage_used: true },
      });

      return user?.storage_used || 0;
    } catch (error) {
      console.error("Error fetching user storage usage:", error);
      return 0;
    }
  }

  // Sync subscription and update user storage limits
  static async syncSubscription(data: {
    userId: string;
    planId: string;
    status: string;
    currentPeriodEnd?: Date;
    idempotencyKey?: string;
  }) {
    const startTime = Date.now();
    const { userId, planId, status, currentPeriodEnd, idempotencyKey } = data;

    try {
      // If idempotency key is provided, use idempotency service
      let result;
      if (idempotencyKey) {
        result = await IdempotencyService.processWithIdempotency(
          idempotencyKey,
          () =>
            this.syncSubscriptionWithoutIdempotency({
              userId,
              planId,
              status,
              currentPeriodEnd,
            }),
        );
      } else {
        // Otherwise, process normally
        result = await this.syncSubscriptionWithoutIdempotency({
          userId,
          planId,
          status,
          currentPeriodEnd,
        });
      }

      // Log successful event
      const processingTime = Date.now() - startTime;
      await SubscriptionMonitoringService.logEvent(
        "sync_subscription",
        userId,
        "success",
        { planId, status },
        processingTime,
      );

      return result;
    } catch (error) {
      // Log failure event
      const processingTime = Date.now() - startTime;
      await SubscriptionMonitoringService.logEvent(
        "sync_subscription",
        userId,
        "failure",
        { planId, status, error: (error as Error).message },
        processingTime,
      );
      throw error;
    }
  }

  // Internal method without idempotency wrapper
  private static async syncSubscriptionWithoutIdempotency(data: {
    userId: string;
    planId: string;
    status: string;
    currentPeriodEnd?: Date;
  }) {
    const { userId, planId, status, currentPeriodEnd } = data;

    try {
      // Get the storage limit for this plan
      const planStorageLimit =
        plans[planId as keyof typeof plans]?.features?.storage || 0.1; // Default to 0.1 GB (100MB)

      console.log(
        `Starting subscription sync for user ${userId} to plan ${planId} with status ${status}`,
      );

      // Update or create subscription record
      const subscription = await prisma.subscription.upsert({
        where: { user_id: userId },
        update: {
          plan: planId,
          status: status,
          current_period_end: currentPeriodEnd,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          plan: planId,
          status: status,
          lemonsqueezy_subscription_id: null, // Will be set by webhook
          current_period_end: currentPeriodEnd,
        },
      });

      console.log(
        `Subscription record updated for user ${userId}, updating user storage limit to ${planStorageLimit}GB`,
      );

      // Update user's storage limit based on their new plan
      await prisma.user.update({
        where: { id: userId },
        data: {
          storage_limit: planStorageLimit,
          updated_at: new Date(),
        },
      });

      console.log(
        `Synced subscription for user ${userId} to plan ${planId} with storage limit ${planStorageLimit}GB`,
      );

      return subscription;
    } catch (error) {
      console.error(`Error syncing subscription for user ${userId}:`, error);
      throw new Error(
        `Failed to sync subscription: ${(error as Error).message}`,
      );
    }
  }

  // Check if user has access to specific analytics feature
  static async hasAnalyticsAccess(
    userId: string,
    feature: string,
  ): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const planId = (subscription?.plan as keyof typeof plans) || "free";
    const plan = plans[planId];

    // Check if the specific analytics feature is enabled for this plan
    return plan.analytics[feature as keyof typeof plan.analytics] || false;
  }

  // Check if user has access to a specific feature
  static async hasFeatureAccess(
    userId: string,
    feature: string,
  ): Promise<{ hasAccess: boolean; planId: string; reason?: string }> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      const planId = (subscription?.plan as keyof typeof plans) || "free";
      const plan = plans[planId];

      // Check if user is part of an institutional subscription
      let isInstitutionalMember = false;
      /*
      try {
        // Import the institutional subscription service dynamically to avoid circular dependencies
        const { InstitutionalSubscriptionService } =
          await import("./institutionalSubscriptionService");
        const institutionalService = new InstitutionalSubscriptionService();
        const institutionalSubscription =
          await institutionalService.getUserSubscription(userId);
        isInstitutionalMember = !!institutionalSubscription;
      } catch (error) {
        console.error("Error checking institutional membership:", error);
      }
      */

      // If user is part of an institutional subscription, grant them full access
      if (isInstitutionalMember) {
        return {
          hasAccess: true,
          planId: "institutional",
          reason: undefined,
        };
      }

      // Check if user has access to the feature based on their plan
      switch (feature) {
        case "analytics":
          return {
            hasAccess: plan.analytics.writingProductivity || false,
            planId,
            reason: plan.analytics.writingProductivity
              ? undefined
              : `Analytics dashboard requires Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        case "research_impact":
          return {
            hasAccess: plan.analytics.researchImpact || false,
            planId,
            reason: plan.analytics.researchImpact
              ? undefined
              : `Research impact analytics requires Researcher plan. Current plan: ${plan.name}`,
          };
        case "advanced_templates":
          const hasAdvancedTemplates =
            plan.features.templates === "all" ||
            plan.features.templates === "custom";
          return {
            hasAccess: hasAdvancedTemplates,
            planId,
            reason: hasAdvancedTemplates
              ? undefined
              : `Advanced templates require Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        case "custom_templates":
          return {
            hasAccess: plan.features.templates === "custom",
            planId,
            reason:
              plan.features.templates === "custom"
                ? undefined
                : `Custom templates require Researcher plan. Current plan: ${plan.name}`,
          };
        case "all_citation_formats":
          const hasAllCitationFormats =
            plan.features.citationFormats === "all" ||
            plan.features.citationFormats === "custom";
          return {
            hasAccess: hasAllCitationFormats,
            planId,
            reason: hasAllCitationFormats
              ? undefined
              : `All citation formats require Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        case "custom_citation_formats":
          return {
            hasAccess: plan.features.citationFormats === "custom",
            planId,
            reason:
              plan.features.citationFormats === "custom"
                ? undefined
                : `Custom citation formats require Researcher plan. Current plan: ${plan.name}`,
          };
        case "unlimited_version_history":
          return {
            hasAccess: plan.features.versionHistory === -1,
            planId,
            reason:
              plan.features.versionHistory === -1
                ? undefined
                : `Unlimited version history requires Researcher plan. Current plan: ${plan.name}`,
          };
        case "role_based_permissions":
          const hasRoleBasedPermissions =
            planId === "researcher" ||
            (planId === "student" &&
              (plan.features.collaborators as number) > 0);
          return {
            hasAccess: hasRoleBasedPermissions,
            planId,
            reason: hasRoleBasedPermissions
              ? undefined
              : `Role-based permissions require Student Pro (with collaborators) or Researcher plan. Current plan: ${plan.name}`,
          };
        case "advanced_role_based_permissions":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Advanced role-based permissions require Researcher plan. Current plan: ${plan.name}`,
          };
        case "custom_ai_prompts":
          const hasCustomAiPrompts =
            planId === "student" || planId === "researcher";
          return {
            hasAccess: hasCustomAiPrompts,
            planId,
            reason: hasCustomAiPrompts
              ? undefined
              : `Custom AI prompts require Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        case "unlimited_custom_ai_prompts":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Unlimited custom AI prompts require Researcher plan. Current plan: ${plan.name}`,
          };
        case "advanced_plagiarism":
          const hasAdvancedPlagiarism =
            planId === "student" || planId === "researcher";
          return {
            hasAccess: hasAdvancedPlagiarism,
            planId,
            reason: hasAdvancedPlagiarism
              ? undefined
              : `Advanced plagiarism detection requires Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        case "institution_grade_plagiarism":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Institution-grade plagiarism detection requires Researcher plan. Current plan: ${plan.name}`,
          };
        case "phone_chat_support":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Phone & chat support requires Researcher plan. Current plan: ${plan.name}`,
          };
        case "dedicated_manager":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Dedicated account manager requires Researcher plan. Current plan: ${plan.name}`,
          };
        case "journal_ready_export":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Journal-ready export formats require Researcher plan. Current plan: ${plan.name}`,
          };
        case "co_author_management":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Co-author management requires Researcher plan. Current plan: ${plan.name}`,
          };
        case "compliance_ready":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Compliance-ready features require Researcher plan. Current plan: ${plan.name}`,
          };
        case "integration_options":
          return {
            hasAccess: planId === "researcher",
            planId,
            reason:
              planId === "researcher"
                ? undefined
                : `Integration options require Researcher plan. Current plan: ${plan.name}`,
          };
        case "collaboration_chat_upload":
          const hasChatUpload = planId === "student" || planId === "researcher";
          return {
            hasAccess: hasChatUpload,
            planId,
            reason: hasChatUpload
              ? undefined
              : `File uploads in chat require Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        case "collaboration_chat_message":
          const hasChatMessage =
            planId === "student" || planId === "researcher";
          return {
            hasAccess: hasChatMessage,
            planId,
            reason: hasChatMessage
              ? undefined
              : `Chat messaging requires Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        case "ai_analytics":
          const hasAiAnalytics =
            planId === "student" || planId === "researcher";
          return {
            hasAccess: hasAiAnalytics,
            planId,
            reason: hasAiAnalytics
              ? undefined
              : `AI analytics require Student Pro or Researcher plan. Current plan: ${plan.name}`,
          };
        default:
          return {
            hasAccess: false,
            planId,
            reason: `Unknown feature: ${feature}`,
          };
      }
    } catch (error) {
      console.error("Error checking feature access:", error);
      return {
        hasAccess: false,
        planId: "unknown",
        reason: "Error checking feature access",
      };
    }
  }

  // Send billing notification
  static async sendBillingNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ) {
    try {
      // Create billing notification
      const notification = await createBillingNotification(
        userId,
        type as any,
        title,
        message,
        data,
      );

      return notification;
    } catch (error) {
      console.error("Error sending billing notification:", error);
      throw error;
    }
  }

  // Send billing reminder notification (e.g., before payment is due)
  static async sendBillingReminder(
    userId: string,
    daysUntilDue: number,
    amount: number,
    planName: string,
  ) {
    try {
      const title = "Upcoming Payment Due";
      const message = `Your ${planName} subscription payment of $${amount.toFixed(
        2,
      )} is due in ${daysUntilDue} day${
        daysUntilDue !== 1 ? "s" : ""
      }. Please ensure your payment method is up to date to avoid service interruption.`;

      return await this.sendBillingNotification(
        userId,
        "billing_reminder",
        title,
        message,
        {
          amount,
          planName,
          daysUntilDue,
        },
      );
    } catch (error) {
      console.error("Error sending billing reminder:", error);
      throw error;
    }
  }

  // Send payment method update notification
  static async sendPaymentMethodUpdate(
    userId: string,
    action: "added" | "removed" | "updated",
  ) {
    try {
      let title = "";
      let message = "";

      switch (action) {
        case "added":
          title = "Payment Method Added";
          message =
            "A new payment method has been added to your account. You can manage your payment methods in your account settings.";
          break;
        case "removed":
          title = "Payment Method Removed";
          message =
            "A payment method has been removed from your account. Please ensure you have at least one valid payment method on file.";
          break;
        case "updated":
          title = "Payment Method Updated";
          message =
            "Your payment method information has been updated. You can manage your payment methods in your account settings.";
          break;
      }

      return await this.sendBillingNotification(
        userId,
        "payment_method_update",
        title,
        message,
      );
    } catch (error) {
      console.error("Error sending payment method update notification:", error);
      throw error;
    }
  }

  // Send plan change confirmation notification
  static async sendPlanChangeConfirmation(
    userId: string,
    oldPlanName: string,
    newPlanName: string,
    effectiveDate: Date,
    proratedAmount?: number,
  ) {
    try {
      const title = "Subscription Plan Updated";
      let message = `Your subscription has been updated from ${oldPlanName} to ${newPlanName}, effective ${effectiveDate.toDateString()}.`;

      if (proratedAmount !== undefined && proratedAmount > 0) {
        message += ` A prorated charge of $${proratedAmount.toFixed(
          2,
        )} will be applied to your next bill.`;
      } else if (proratedAmount !== undefined && proratedAmount < 0) {
        message += ` A prorated credit of $${Math.abs(proratedAmount).toFixed(
          2,
        )} will be applied to your account.`;
      }

      return await this.sendBillingNotification(
        userId,
        "plan_change",
        title,
        message,
        {
          oldPlanName,
          newPlanName,
          effectiveDate: effectiveDate.toISOString(),
          proratedAmount,
        },
      );
    } catch (error) {
      console.error("Error sending plan change confirmation:", error);
      throw error;
    }
  }

  // Send usage limit warning notification
  static async sendUsageLimitWarning(
    userId: string,
    resourceName: string,
    used: number,
    limit: number,
    planName: string,
  ) {
    try {
      const percentage = Math.round((used / limit) * 100);
      const title = "Usage Limit Warning";
      const message = `You have used ${percentage}% of your ${resourceName} limit (${used}/${limit}) on your ${planName} plan. Please consider upgrading to avoid service limitations.`;

      return await this.sendBillingNotification(
        userId,
        "usage_limit_warning",
        title,
        message,
        {
          resourceName,
          used,
          limit,
          percentage,
          planName,
        },
      );
    } catch (error) {
      console.error("Error sending usage limit warning:", error);
      throw error;
    }
  }

  // Send storage limit warning notification
  static async sendStorageLimitWarning(
    userId: string,
    usedGB: number,
    limitGB: number,
  ) {
    try {
      const percentage = Math.round((usedGB / limitGB) * 100);
      const title = "Storage Limit Warning";
      const message = `You have used ${percentage}% of your storage space (${usedGB.toFixed(
        2,
      )}GB/${limitGB}GB). Please consider upgrading or freeing up space to avoid service limitations.`;

      return await this.sendBillingNotification(
        userId,
        "storage_limit_warning",
        title,
        message,
        {
          usedGB,
          limitGB,
          percentage,
        },
      );
    } catch (error) {
      console.error("Error sending storage limit warning:", error);
      throw error;
    }
  }

  // Send trial ending notification
  static async sendTrialEndingNotification(
    userId: string,
    daysRemaining: number,
    planName: string,
  ) {
    try {
      const title = "Trial Period Ending Soon";
      const message = `Your ${planName} trial period ends in ${daysRemaining} day${
        daysRemaining !== 1 ? "s" : ""
      }. Please add a payment method to continue enjoying premium features after your trial ends.`;

      return await this.sendBillingNotification(
        userId,
        "trial_ending",
        title,
        message,
        {
          daysRemaining,
          planName,
        },
      );
    } catch (error) {
      console.error("Error sending trial ending notification:", error);
      throw error;
    }
  }

  // Send billing summary notification (monthly/annual)
  static async sendBillingSummary(
    userId: string,
    period: "monthly" | "annual",
    totalAmount: number,
    breakdown: Array<{ item: string; amount: number }>,
  ) {
    try {
      const title = `${period === "monthly" ? "Monthly" : "Annual"} Billing Summary`;
      let message = `Your ${period} billing summary:\n\n`;

      breakdown.forEach((item) => {
        message += `- ${item.item}: $${item.amount.toFixed(2)}\n`;
      });

      message += `\nTotal: $${totalAmount.toFixed(2)}`;

      return await this.sendBillingNotification(
        userId,
        "billing_summary",
        title,
        message,
        {
          period,
          totalAmount,
          breakdown,
        },
      );
    } catch (error) {
      console.error("Error sending billing summary:", error);
      throw error;
    }
  }

  // Handle subscription created event
  static async handleSubscriptionCreated(
    userId: string,
    planId: string,
    amount: number,
    billingPeriod: string,
  ) {
    try {
      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        throw new Error(`Unknown plan ID: ${planId}`);
      }

      // Send subscription created notification
      await sendSubscriptionCreatedNotification(
        userId,
        plan.name,
        amount,
        billingPeriod,
      );

      console.log(`Subscription created notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling subscription created event:", error);
      throw error;
    }
  }

  // Handle subscription updated event
  static async handleSubscriptionUpdated(
    userId: string,
    oldPlanId: string,
    newPlanId: string,
    amount: number,
  ) {
    try {
      const oldPlan = plans[oldPlanId as keyof typeof plans];
      const newPlan = plans[newPlanId as keyof typeof plans];

      if (!oldPlan || !newPlan) {
        throw new Error(`Unknown plan ID: ${oldPlanId} or ${newPlanId}`);
      }

      // Send subscription updated notification
      await sendSubscriptionUpdatedNotification(
        userId,
        oldPlan.name,
        newPlan.name,
        amount,
      );

      console.log(`Subscription updated notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling subscription updated event:", error);
      throw error;
    }
  }

  // Handle subscription cancelled event
  static async handleSubscriptionCancelled(
    userId: string,
    planId: string,
    endDate: Date,
  ) {
    try {
      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        throw new Error(`Unknown plan ID: ${planId}`);
      }

      // Send subscription cancelled notification
      await sendSubscriptionCancelledNotification(
        userId,
        plan.name,
        endDate.toISOString(),
      );

      console.log(
        `Subscription cancelled notification sent for user ${userId}`,
      );
    } catch (error) {
      console.error("Error handling subscription cancelled event:", error);
      throw error;
    }
  }

  // Handle subscription renewed event
  static async handleSubscriptionRenewed(
    userId: string,
    planId: string,
    amount: number,
    nextBillingDate: Date,
  ) {
    try {
      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        throw new Error(`Unknown plan ID: ${planId}`);
      }

      // Send subscription renewed notification
      await sendSubscriptionRenewedNotification(
        userId,
        plan.name,
        amount,
        nextBillingDate.toISOString(),
      );

      console.log(`Subscription renewed notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling subscription renewed event:", error);
      throw error;
    }
  }

  // Handle subscription expiring event
  static async handleSubscriptionExpiring(
    userId: string,
    planId: string,
    expirationDate: Date,
    amount: number,
  ) {
    try {
      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        throw new Error(`Unknown plan ID: ${planId}`);
      }

      // Send subscription expiring notification
      await sendSubscriptionExpiringNotification(
        userId,
        plan.name,
        expirationDate.toISOString(),
        amount,
      );

      console.log(`Subscription expiring notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling subscription expiring event:", error);
      throw error;
    }
  }

  // Handle payment success event
  static async handlePaymentSuccess(
    userId: string,
    amount: number,
    planId: string,
    transactionId: string,
  ) {
    try {
      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        throw new Error(`Unknown plan ID: ${planId}`);
      }

      // Send payment success notification
      await sendPaymentSuccessNotification(
        userId,
        amount,
        plan.name,
        transactionId,
      );

      console.log(`Payment success notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling payment success event:", error);
      throw error;
    }
  }

  // Handle payment failed event
  static async handlePaymentFailed(
    userId: string,
    amount: number,
    planId: string,
    errorMessage: string,
  ) {
    try {
      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        throw new Error(`Unknown plan ID: ${planId}`);
      }

      // Send payment failed notification
      await sendPaymentFailedNotification(
        userId,
        amount,
        plan.name,
        errorMessage,
      );

      console.log(`Payment failed notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling payment failed event:", error);
      throw error;
    }
  }

  // Handle payment refunded event
  static async handlePaymentRefunded(
    userId: string,
    amount: number,
    planId: string,
    transactionId: string,
  ) {
    try {
      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        throw new Error(`Unknown plan ID: ${planId}`);
      }

      // Send payment refunded notification
      await sendPaymentRefundedNotification(
        userId,
        amount,
        plan.name,
        transactionId,
      );

      console.log(`Payment refunded notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling payment refunded event:", error);
      throw error;
    }
  }

  // Handle invoice available event
  static async handleInvoiceAvailable(
    userId: string,
    invoiceId: string,
    amount: number,
    dueDate: Date,
    downloadUrl: string,
  ) {
    try {
      // Send invoice available notification
      await sendInvoiceAvailableNotification(
        userId,
        invoiceId,
        amount,
        dueDate.toISOString(),
        downloadUrl,
      );

      console.log(`Invoice available notification sent for user ${userId}`);
    } catch (error) {
      console.error("Error handling invoice available event:", error);
      throw error;
    }
  }

  // Upgrade user subscription
  static async upgradeSubscription(
    userId: string,
    newPlanId: string,
    lemonsqueezySubscriptionId?: string,
    idempotencyKey?: string,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // If idempotency key is provided, use idempotency service
      let result;
      if (idempotencyKey) {
        result = await IdempotencyService.processWithIdempotency(
          idempotencyKey,
          () =>
            this.upgradeSubscriptionWithoutIdempotency(
              userId,
              newPlanId,
              lemonsqueezySubscriptionId,
            ),
        );
      } else {
        // Otherwise, process normally
        result = await this.upgradeSubscriptionWithoutIdempotency(
          userId,
          newPlanId,
          lemonsqueezySubscriptionId,
        );
      }

      // Log successful event
      const processingTime = Date.now() - startTime;
      await SubscriptionMonitoringService.logEvent(
        "upgrade_subscription",
        userId,
        "success",
        { newPlanId, lemonsqueezySubscriptionId },
        processingTime,
      );

      return result;
    } catch (error) {
      // Log failure event
      const processingTime = Date.now() - startTime;
      await SubscriptionMonitoringService.logEvent(
        "upgrade_subscription",
        userId,
        "failure",
        {
          newPlanId,
          lemonsqueezySubscriptionId,
          error: (error as Error).message,
        },
        processingTime,
      );
      throw error;
    }
  }

  // Internal method without idempotency wrapper
  private static async upgradeSubscriptionWithoutIdempotency(
    userId: string,
    newPlanId: string,
    lemonsqueezySubscriptionId?: string,
  ): Promise<any> {
    try {
      console.log(
        `Starting subscription upgrade for user ${userId} to plan ${newPlanId}`,
      );

      // Validate the new plan exists
      const newPlan = plans[newPlanId as keyof typeof plans];
      if (!newPlan) {
        throw new Error(`Invalid plan: ${newPlanId}`);
      }

      // Get current subscription
      const currentSubscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      if (!currentSubscription) {
        throw new Error("No existing subscription found for user");
      }

      const currentPlanId = currentSubscription.plan as keyof typeof plans;
      const currentPlan = plans[currentPlanId];

      console.log(
        `Current plan for user ${userId}: ${currentPlanId}, upgrading to: ${newPlanId}`,
      );

      // Check if user is already on the target plan
      if (currentPlanId === newPlanId) {
        throw new Error(`You are already on the ${newPlan.name} plan.`);
      }

      // Check upgrade path validity
      const validUpgradePaths: Record<string, string[]> = {
        free: ["student", "researcher"],
        student: ["researcher"],
        researcher: [],
        institutional: [],
      };

      const validUpgrades = validUpgradePaths[currentPlanId] || [];
      if (!validUpgrades.includes(newPlanId)) {
        throw new Error(
          `You cannot upgrade from ${currentPlan.name} to ${newPlan.name}.`,
        );
      }

      // Calculate prorated amount if needed (simplified for now)
      // In a real implementation, this would calculate the prorated difference
      const proratedAmount = newPlan.price - (currentPlan?.price || 0);
      console.log(`Prorated amount for upgrade: ${proratedAmount}`);

      // Update subscription
      console.log(`Updating subscription record for user ${userId}`);
      const updatedSubscription = await prisma.subscription.update({
        where: { user_id: userId },
        data: {
          plan: newPlanId,
          lemonsqueezy_subscription_id: lemonsqueezySubscriptionId,
          current_period_end: currentSubscription.current_period_end
            ? new Date(currentSubscription.current_period_end)
            : undefined,
          updated_at: new Date(),
        },
      });

      // Update user storage limit based on new plan
      const storageLimit = newPlan.features.storage || 0.1;
      console.log(
        `Updating user storage limit for user ${userId} to ${storageLimit}GB`,
      );
      await prisma.user.update({
        where: { id: userId },
        data: {
          storage_limit: storageLimit,
        },
      });

      // Send notification about upgrade
      await this.handleSubscriptionUpdated(
        userId,
        currentPlanId,
        newPlanId,
        proratedAmount,
      );

      console.log(
        `Successfully upgraded subscription for user ${userId} to ${newPlanId}`,
      );
      return {
        success: true,
        subscription: updatedSubscription,
        message: `Successfully upgraded to ${newPlan.name} plan`,
      };
    } catch (error) {
      console.error(`Error upgrading subscription for user ${userId}:`, error);
      throw new Error(
        `Failed to upgrade subscription: ${(error as Error).message}`,
      );
    }
  }

  // Downgrade user subscription
  static async downgradeSubscription(
    userId: string,
    newPlanId: string,
    idempotencyKey?: string,
  ): Promise<any> {
    // If idempotency key is provided, use idempotency service
    if (idempotencyKey) {
      return IdempotencyService.processWithIdempotency(idempotencyKey, () =>
        this.downgradeSubscriptionWithoutIdempotency(userId, newPlanId),
      );
    }

    // Otherwise, process normally
    return this.downgradeSubscriptionWithoutIdempotency(userId, newPlanId);
  }

  // Internal method without idempotency wrapper
  private static async downgradeSubscriptionWithoutIdempotency(
    userId: string,
    newPlanId: string,
  ): Promise<any> {
    try {
      // Validate the new plan exists
      const newPlan = plans[newPlanId as keyof typeof plans];
      if (!newPlan) {
        throw new Error(`Invalid plan: ${newPlanId}`);
      }

      // Get current subscription
      const currentSubscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      if (!currentSubscription) {
        throw new Error("No existing subscription found for user");
      }

      const currentPlanId = currentSubscription.plan as keyof typeof plans;
      const currentPlan = plans[currentPlanId];

      // Check if user is already on the target plan
      if (currentPlanId === newPlanId) {
        throw new Error(`You are already on the ${newPlan.name} plan.`);
      }

      // Check downgrade path validity (opposite of upgrade paths)
      const validDowngradePaths: Record<string, string[]> = {
        researcher: ["student", "free"],
        student: ["free"],
        free: [],
        institutional: [],
      };

      const validDowngrades = validDowngradePaths[currentPlanId] || [];
      if (!validDowngrades.includes(newPlanId)) {
        throw new Error(
          `You cannot downgrade from ${currentPlan.name} to ${newPlan.name}.`,
        );
      }

      // For downgrades, we might want to schedule it for the end of the billing period
      // or apply it immediately. Here we'll apply it immediately for simplicity.
      // const proratedAmount = newPlan.price - (currentPlan?.price || 0);

      // Calculate actual prorated amount based on remaining time in billing cycle
      let proratedAmount = 0;
      if (currentSubscription.current_period_end) {
        const currentDate = new Date();
        const periodEndDate = new Date(currentSubscription.current_period_end);

        // Calculate the total duration of the billing period in days
        const periodStartDate = new Date(periodEndDate);
        periodStartDate.setMonth(periodStartDate.getMonth() - 1); // Assuming monthly billing

        const totalPeriodDays =
          (periodEndDate.getTime() - periodStartDate.getTime()) /
          (1000 * 60 * 60 * 24);
        const remainingDays =
          (periodEndDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24);

        // Calculate the prorated refund for the old plan
        const dailyRateOldPlan = currentPlan.price / 30; // Approximate daily rate
        const refundAmount = dailyRateOldPlan * remainingDays;

        // Calculate the prorated charge for the new plan
        const dailyRateNewPlan = newPlan.price / 30; // Approximate daily rate
        const chargeAmount = dailyRateNewPlan * remainingDays;

        // Net prorated amount (positive for charge, negative for credit)
        proratedAmount = chargeAmount - refundAmount;
      } else {
        // If no billing period end date, use simple difference
        proratedAmount = newPlan.price - (currentPlan?.price || 0);
      }

      // Update subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { user_id: userId },
        data: {
          plan: newPlanId,
          current_period_end: currentSubscription.current_period_end
            ? new Date(currentSubscription.current_period_end)
            : undefined,
          updated_at: new Date(),
        },
      });

      // Update user storage limit based on new plan
      const storageLimit = newPlan.features.storage || 0.1;
      await prisma.user.update({
        where: { id: userId },
        data: {
          storage_limit: storageLimit,
        },
      });

      // Send notification about downgrade
      await this.handleSubscriptionUpdated(
        userId,
        currentPlanId,
        newPlanId,
        proratedAmount,
      );

      return {
        success: true,
        subscription: updatedSubscription,
        message: `Successfully downgraded to ${newPlan.name} plan`,
      };
    } catch (error) {
      console.error("Error downgrading subscription:", error);
      throw error;
    }
  }

  // Cancel user subscription
  static async cancelSubscription(
    userId: string,
    immediately = false,
    idempotencyKey?: string,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // If idempotency key is provided, use idempotency service
      let result;
      if (idempotencyKey) {
        result = await IdempotencyService.processWithIdempotency(
          idempotencyKey,
          () => this.cancelSubscriptionWithoutIdempotency(userId, immediately),
        );
      } else {
        // Otherwise, process normally
        result = await this.cancelSubscriptionWithoutIdempotency(
          userId,
          immediately,
        );
      }

      // Log successful event
      const processingTime = Date.now() - startTime;
      await SubscriptionMonitoringService.logEvent(
        "cancel_subscription",
        userId,
        "success",
        { immediately },
        processingTime,
      );

      return result;
    } catch (error) {
      // Log failure event
      const processingTime = Date.now() - startTime;
      await SubscriptionMonitoringService.logEvent(
        "cancel_subscription",
        userId,
        "failure",
        { immediately, error: (error as Error).message },
        processingTime,
      );
      throw error;
    }
  }

  // Internal method without idempotency wrapper
  private static async cancelSubscriptionWithoutIdempotency(
    userId: string,
    immediately = false,
  ): Promise<any> {
    try {
      console.log(
        `Starting subscription cancellation for user ${userId}, immediately: ${immediately}`,
      );

      // Get current subscription
      const currentSubscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      if (!currentSubscription) {
        throw new Error("No existing subscription found for user");
      }

      const currentPlanId = currentSubscription.plan as keyof typeof plans;
      const currentPlan = plans[currentPlanId];

      console.log(`Current plan for user ${userId}: ${currentPlanId}`);

      // If immediately is true, cancel right away
      if (immediately) {
        console.log(`Cancelling subscription immediately for user ${userId}`);
        const updatedSubscription = await prisma.subscription.update({
          where: { user_id: userId },
          data: {
            status: "cancelled",
            updated_at: new Date(),
          },
        });

        // Send notification about cancellation
        const endDate = currentSubscription.current_period_end
          ? new Date(currentSubscription.current_period_end)
          : new Date();

        await this.handleSubscriptionCancelled(userId, currentPlanId, endDate);

        console.log(`Subscription cancelled immediately for user ${userId}`);
        return {
          success: true,
          subscription: updatedSubscription,
          message: `Subscription cancelled immediately. Your ${currentPlan.name} plan will end on ${endDate.toDateString()}.`,
        };
      } else {
        // Schedule cancellation for end of billing period
        console.log(
          `Scheduling subscription cancellation for user ${userId} at end of billing period`,
        );
        const updatedSubscription = await prisma.subscription.update({
          where: { user_id: userId },
          data: {
            status: "scheduled_for_cancellation",
            updated_at: new Date(),
          },
        });

        // Send notification about scheduled cancellation
        const endDate = currentSubscription.current_period_end
          ? new Date(currentSubscription.current_period_end)
          : new Date();

        await this.handleSubscriptionExpiring(
          userId,
          currentPlanId,
          endDate,
          0, // No additional charge for cancellation
        );

        console.log(
          `Subscription scheduled for cancellation for user ${userId}`,
        );
        return {
          success: true,
          subscription: updatedSubscription,
          message: `Subscription scheduled for cancellation. Your ${currentPlan.name} plan will remain active until ${endDate.toDateString()}.`,
        };
      }
    } catch (error) {
      console.error(`Error cancelling subscription for user ${userId}:`, error);
      throw new Error(
        `Failed to cancel subscription: ${(error as Error).message}`,
      );
    }
  }

  // Reactivate cancelled subscription
  static async reactivateSubscription(
    userId: string,
    idempotencyKey?: string,
  ): Promise<any> {
    // If idempotency key is provided, use idempotency service
    if (idempotencyKey) {
      return IdempotencyService.processWithIdempotency(idempotencyKey, () =>
        this.reactivateSubscriptionWithoutIdempotency(userId),
      );
    }

    // Otherwise, process normally
    return this.reactivateSubscriptionWithoutIdempotency(userId);
  }

  // Internal method without idempotency wrapper
  private static async reactivateSubscriptionWithoutIdempotency(
    userId: string,
  ): Promise<any> {
    try {
      // Get current subscription
      const currentSubscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      if (!currentSubscription) {
        throw new Error("No existing subscription found for user");
      }

      // Check if subscription can be reactivated
      if (
        currentSubscription.status !== "cancelled" &&
        currentSubscription.status !== "scheduled_for_cancellation"
      ) {
        throw new Error("Subscription is not eligible for reactivation");
      }

      // If subscription has already expired, we might need to create a new one
      const now = new Date();
      const isExpired =
        currentSubscription.current_period_end &&
        new Date(currentSubscription.current_period_end) < now;

      if (isExpired) {
        // For expired subscriptions, we'll need to create a new subscription
        // Get the current plan to pre-select it in the checkout flow
        const currentPlanId = currentSubscription.plan as keyof typeof plans;
        const currentPlan = plans[currentPlanId];

        // Return a structured response that indicates the client should redirect to payment
        // Instead of throwing an error, we provide actionable information
        return {
          success: false,
          requiresPayment: true,
          message: "Subscription has expired and requires renewal.",
          currentPlan: {
            id: currentPlanId,
            name: currentPlan.name,
            price: currentPlan.price,
          },
          redirectUrl: "/billing/subscription", // Standard subscription management page
        };
      }

      // Reactivate subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { user_id: userId },
        data: {
          status: "active",
          updated_at: new Date(),
        },
      });

      const currentPlanId = currentSubscription.plan as keyof typeof plans;
      const currentPlan = plans[currentPlanId];

      // Send notification about reactivation
      await this.handleSubscriptionRenewed(
        userId,
        currentPlanId,
        currentPlan.price,
        currentSubscription.current_period_end
          ? new Date(currentSubscription.current_period_end)
          : new Date(),
      );

      return {
        success: true,
        subscription: updatedSubscription,
        message: `Subscription successfully reactivated. Your ${currentPlan.name} plan is now active.`,
      };
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw error;
    }
  }

  // Check if user can upgrade to a specific plan
  static async canUpgradeToPlan(
    userId: string,
    targetPlanId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Validate target plan exists
    if (!plans[targetPlanId as keyof typeof plans]) {
      return {
        allowed: false,
        reason: `Invalid plan: ${targetPlanId}`,
      };
    }

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const currentPlanId = (subscription?.plan as keyof typeof plans) || "free";
    const currentPlan = plans[currentPlanId];
    const targetPlan = plans[targetPlanId as keyof typeof plans];

    // Check if user is already on the target plan
    if (currentPlanId === targetPlanId) {
      return {
        allowed: false,
        reason: `You are already on the ${targetPlan.name} plan.`,
      };
    }

    // Check upgrade path validity
    const validUpgradePaths: Record<string, string[]> = {
      free: ["student", "researcher"],
      student: ["researcher"],
      researcher: [],
      institutional: [],
    };

    const validUpgrades = validUpgradePaths[currentPlanId] || [];
    if (!validUpgrades.includes(targetPlanId)) {
      return {
        allowed: false,
        reason: `You cannot upgrade from ${currentPlan.name} to ${targetPlan.name}.`,
      };
    }

    return { allowed: true };
  }

  // Get available upgrade options for a user
  static async getUpgradeOptions(userId: string): Promise<
    Array<{
      planId: string;
      name: string;
      price: number;
      features: string[];
      canUpgrade: boolean;
      reason?: string;
    }>
  > {
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const currentPlanId = (subscription?.plan as keyof typeof plans) || "free";
    const validUpgradePaths: Record<string, string[]> = {
      free: ["student", "researcher"],
      student: ["researcher"],
      researcher: [],
      institutional: [],
    };

    const availablePlans = Object.keys(plans).filter(
      (planId) => planId !== "institutional",
    );
    const upgradeOptions = [];

    for (const planId of availablePlans) {
      const plan = plans[planId as keyof typeof plans];
      const canUpgrade =
        validUpgradePaths[currentPlanId]?.includes(planId) || false;
      let reason: string | undefined;

      if (!canUpgrade && currentPlanId !== planId) {
        if (currentPlanId === planId) {
          reason = "You are already on this plan";
        } else {
          reason = "This upgrade path is not available";
        }
      }

      upgradeOptions.push({
        planId,
        name: plan.name,
        price: plan.price,
        features: plan.featuresList,
        canUpgrade,
        reason,
      });
    }

    return upgradeOptions;
  }

  // Track AI usage for a user
  static async trackAIUsage(
    userId: string,
    usageData: {
      requestType: string;
      tokensUsed: number;
      cost: number;
      model?: string;
      inputTokens?: number;
      outputTokens?: number;
    },
  ): Promise<any> {
    try {
      // Get current month and year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Get or create AI usage record for the current month
      let aiUsage = await prisma.aIUsage.findUnique({
        where: {
          user_id_month_year: {
            user_id: userId,
            month,
            year,
          },
        },
      });

      if (!aiUsage) {
        aiUsage = await prisma.aIUsage.create({
          data: {
            user_id: userId,
            month,
            year,
            request_count: 0,
            chat_message_count: 0,
            image_generation_count: 0,
            web_search_count: 0,
            deep_search_count: 0,
          },
        });
      }

      // Update usage counts based on request type
      const updateData: any = {};
      switch (usageData.requestType) {
        case "ai_request":
          updateData.request_count = {
            increment: 1,
          };
          break;
        case "ai_chat_message":
          updateData.chat_message_count = {
            increment: 1,
          };
          break;
        case "ai_web_search":
          updateData.web_search_count = {
            increment: 1,
          };
          break;
        case "ai_deep_search":
          updateData.deep_search_count = {
            increment: 1,
          };
          break;
      }

      // Update AI usage record
      const updatedAIUsage = await prisma.aIUsage.update({
        where: {
          user_id_month_year: {
            user_id: userId,
            month,
            year,
          },
        },
        data: updateData,
      });

      return {
        success: true,
        aiUsage: updatedAIUsage,
      };
    } catch (error) {
      console.error("Error tracking AI usage:", error);
      throw error;
    }
  }

  // New method to track AI-inserted words
  static async trackAIWords(
    userId: string,
    wordsInserted: number,
  ): Promise<any> {
    try {
      // Check if the prisma client and model are properly initialized
      if (!prisma || typeof prisma.AIUsage === "undefined") {
        console.warn(
          "Prisma AIUsage model is not available, skipping tracking",
        );
        return null;
      }

      // Get or create AI word usage record
      let AIUsage = await prisma.AIUsage.findUnique({
        where: { user_id: userId },
      });

      if (!AIUsage) {
        AIUsage = await prisma.AIUsage.create({
          data: {
            user_id: userId,
            words_used: 0,
          },
        });
      }

      // Update the word count
      const updatedAIUsage = await prisma.AIUsage.update({
        where: { user_id: userId },
        data: {
          words_used: {
            increment: wordsInserted,
          },
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        AIUsage: updatedAIUsage,
      };
    } catch (error) {
      console.error("Error tracking AI words:", error);
      throw error;
    }
  }

  // Track plagiarism check usage
  static async trackPlagiarismUsage(userId: string): Promise<any> {
    try {
      // Increment plagiarism report count for the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Just increment the count in the database - the actual limit checking happens in canPerformAction
      const plagiarismReportCount = await prisma.plagiarismReport.count({
        where: {
          user_id: userId,
          created_at: { gte: startOfMonth },
        },
      });

      return {
        success: true,
        count: plagiarismReportCount + 1, // +1 because we're about to create a new one
      };
    } catch (error) {
      console.error("Error tracking plagiarism usage:", error);
      throw error;
    }
  }

  // Track project creation
  static async trackProjectCreation(userId: string): Promise<any> {
    try {
      // Get current project count
      const projectCount = await prisma.project.count({
        where: {
          user_id: userId,
          status: {
            not: "archived",
          },
        },
      });

      return {
        success: true,
        count: projectCount + 1, // +1 because we're about to create a new one
      };
    } catch (error) {
      console.error("Error tracking project creation:", error);
      throw error;
    }
  }

  // Track storage usage
  static async trackStorageUsage(
    userId: string,
    bytesUsed: number,
  ): Promise<any> {
    try {
      // Convert bytes to GB for storage tracking
      const gbUsed = bytesUsed / (1024 * 1024 * 1024);

      // Update user's storage usage
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          storage_used: {
            increment: gbUsed,
          },
        },
      });

      return {
        success: true,
        storageUsed: updatedUser.storage_used || 0,
      };
    } catch (error) {
      console.error("Error tracking storage usage:", error);
      throw error;
    }
  }

  // Reset storage usage (for when files are deleted)
  static async resetStorageUsage(
    userId: string,
    bytesFreed: number,
  ): Promise<any> {
    try {
      // Convert bytes to GB for storage tracking
      const gbFreed = bytesFreed / (1024 * 1024 * 1024);

      // Update user's storage usage
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          storage_used: {
            decrement: gbFreed,
          },
        },
      });

      // Ensure storage_used doesn't go below 0
      if ((updatedUser.storage_used || 0) < 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            storage_used: 0,
          },
        });
      }

      return {
        success: true,
        storageUsed: Math.max(0, (updatedUser.storage_used || 0) - gbFreed),
      };
    } catch (error) {
      console.error("Error resetting storage usage:", error);
      throw error;
    }
  }
}
