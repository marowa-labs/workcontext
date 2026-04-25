import { supabase } from "../supabase/client";

class SubscriptionService {
  constructor() {
    this.userPlan = null;
  }

  async getUserPlan() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/billing/subscription`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch subscription info");
      }

      this.userPlan = data.subscription;
      return data.subscription;
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      throw error;
    }
  }

  // Get authentication token
  async getAuthToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  }

  // Check if user can add collaborators
  async canAddCollaborators(projectId) {
    if (!this.userPlan) return false;

    const planId = this.userPlan.plan.id;

    // Free plan can add up to 10 collaborators
    if (planId === "free") return true;

    // Student plan can add up to 100 collaborators
    if (planId === "student") {
      // For student plan, check if we've reached the collaborator limit
      if (projectId) {
        // If we have a project ID, check the actual collaborator count for this project
        const hasReachedLimit =
          await this.hasReachedCollaboratorLimit(projectId);
        return !hasReachedLimit;
      } else {
        // If no project ID provided, assume they can add collaborators (but should check per project)
        return true;
      }
    }

    // Researcher plan can add unlimited collaborators
    if (planId === "researcher") return true;

    // Institutional plan can add unlimited collaborators
    if (planId === "institutional") return true;

    return false;
  }

  // Get collaborator limit
  getCollaboratorLimit() {
    if (!this.userPlan) return 0;

    const planId = this.userPlan.plan.id;

    if (planId === "free") return 10;
    if (planId === "student") return 100;
    if (planId === "researcher") return Infinity;
    if (planId === "institutional") return Infinity;

    return 0;
  }

  // Check if user has reached collaborator limit
  async hasReachedCollaboratorLimit(projectId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/collaboration/${projectId}/collaborators`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch collaborators");
      }

      // Count non-owner collaborators
      const collaboratorCount = data.collaborators.filter(
        (collaborator) => collaborator.permission !== "owner"
      ).length;

      const limit = this.getCollaboratorLimit();

      // If limit is Infinity, user has unlimited collaborators
      if (limit === Infinity) return false;

      return collaboratorCount >= limit;
    } catch (error) {
      console.error("Error checking collaborator limit:", error);
      // In case of error, assume limit is reached to prevent issues
      return true;
    }
  }

  // Check if user has access to a specific feature
  async hasFeatureAccess(feature) {
    try {
      // If we don't have user plan info, fetch it
      if (!this.userPlan) {
        await this.getUserPlan();
      }

      if (!this.userPlan) {
        return false;
      }

      const planId = this.userPlan.plan.id;

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
        case "api_access":
          // API access only for Researcher plan
          return planId === "researcher";
        case "white_label":
          // White-label options only for Researcher plan
          return planId === "researcher";
        case "dedicated_manager":
          // Dedicated account manager only for Researcher plan
          return planId === "researcher";
        case "journal_ready_export":
          // Journal-ready export formats only for Researcher plan
          return planId === "researcher";
        case "co_author_management":
          // Co-author management only for Researcher plan
          return planId === "researcher";
        case "faculty_dashboard":
          // Faculty dashboard only for Researcher plan
          return planId === "researcher";
        case "compliance_ready":
          // Compliance-ready only for Researcher plan
          return planId === "researcher";
        case "integration_options":
          // Integration options only for Researcher plan
          return planId === "researcher";
        case "affiliate_program":
          // Affiliate program only for Student Pro and Researcher plans
          return planId === "student" || planId === "researcher";
        case "custom_ai_models":
          // Custom AI models only for Researcher plan
          return planId === "researcher";
        case "collaboration_chat_upload":
          // File uploads in chat for Student Pro and Researcher plans
          return planId === "student" || planId === "researcher";
        case "collaboration_chat_message":
          // Chat messaging for Student Pro and Researcher plans
          return planId === "student" || planId === "researcher";
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking feature access:", error);
      return false;
    }
  }

  // Get storage limit for the user's plan
  getStorageLimit() {
    if (!this.userPlan) return 0;

    const planId = this.userPlan.plan.id;

    switch (planId) {
      case "free":
        return 0.1; // 100MB
      case "student":
        return 5; // 5GB
      case "researcher":
        return 100; // 100GB
      default:
        return 0.1; // Default to free plan limit
    }
  }
}

export default SubscriptionService;
