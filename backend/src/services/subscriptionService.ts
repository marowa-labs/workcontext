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

// Plan definitions - kept for reference but no longer enforced
export const plans = {
  free: {
    name: "Free",
    price: 0,
    features: {
      projects: -1, plagiarismChecks: -1, aiRequests: -1, aiChatMessages: -1,
      aiWebSearches: -1, aiDeepSearches: -1, collaborators: -1, storage: -1,
      words: -1, templates: "all", citationFormats: "custom", versionHistory: -1,
      support: "community", aiCostLimit: 0,
    },
    analytics: {
      writingProductivity: true, originalityInsights: true, writingQuality: true,
      collaborationInsights: true, researchImpact: true,
    },
    featuresList: [
      "All templates", "All citation formats", "Export to Word/PDF/LaTeX",
      "Unlimited real-time collaboration", "Unlimited version history",
      "Unlimited AI words", "Grammar & spell check", "Unlimited projects",
      "Bring your own API keys", "Unlimited storage", "Community Support",
    ],
    excludedFeatures: [],
  },
  onetime: {
    name: "One-Time Pay-As-You-Go", price: 15,
    features: {
      projects: -1, plagiarismChecks: -1, aiRequests: -1, aiChatMessages: -1,
      aiWebSearches: -1, aiDeepSearches: -1, collaborators: -1, storage: -1,
      words: -1, templates: "all", citationFormats: "custom", versionHistory: -1,
      support: "email", aiCostLimit: 15,
    },
    analytics: { writingProductivity: true, originalityInsights: true, writingQuality: true, collaborationInsights: true, researchImpact: true },
    featuresList: ["All features included"], excludedFeatures: [],
  },
  student: {
    name: "Student", price: 15,
    features: {
      projects: -1, plagiarismChecks: -1, aiRequests: -1, aiChatMessages: -1,
      aiWebSearches: -1, aiDeepSearches: -1, collaborators: -1, storage: -1,
      words: -1, templates: "all", citationFormats: "custom", versionHistory: -1,
      support: "email", aiCostLimit: 20,
    },
    analytics: { writingProductivity: true, originalityInsights: true, writingQuality: true, collaborationInsights: true, researchImpact: true },
    featuresList: ["All features included"], excludedFeatures: [],
  },
  researcher: {
    name: "Researcher", price: 35,
    features: {
      projects: -1, plagiarismChecks: -1, aiRequests: -1, aiChatMessages: -1,
      aiWebSearches: -1, aiDeepSearches: -1, collaborators: -1, storage: -1,
      words: -1, templates: "all", citationFormats: "custom", versionHistory: -1,
      support: "phone_chat", aiCostLimit: 100,
    },
    analytics: { writingProductivity: true, originalityInsights: true, writingQuality: true, collaborationInsights: true, researchImpact: true },
    featuresList: ["All features included"], excludedFeatures: [],
  },
};

interface PlanInfo {
  plan: {
    id: string; name: string; price: number; features: string[];
    excludedFeatures: string[];
    analytics: {
      writingProductivity: boolean; originalityInsights: boolean;
      writingQuality: boolean; collaborationInsights: boolean; researchImpact: boolean;
    };
  };
  subscription: { status: string; current_period_end: Date | null; } | null;
  usage: {
    projects: { used: number; limit: number; percentage: number; };
    plagiarismChecks: { used: number; limit: number; percentage: number; };
    aiRequests: { used: number; limit: number; percentage: number; };
    aiChatMessages: { used: number; limit: number; percentage: number; };
    aiWebSearches: { used: number; limit: number; percentage: number; };
    aiDeepSearches: { used: number; limit: number; percentage: number; };
    aiCost: { used: number; limit: number; percentage: number; };
    words: { used: number; limit: number; percentage: number; };
    storage: { used: number; limit: number; percentage: number; };
  };
}

export class SubscriptionService {
  static async canPerformAction(_userId: string, _action: string): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true };
  }

  static async getUserPlanInfo(userId: string): Promise<PlanInfo> {
    const subscription = await prisma.subscription.findUnique({ where: { user_id: userId } }).catch(() => null);
    const planId = (subscription?.plan as keyof typeof plans) || "free";
    const plan = plans[planId] || plans.free;
    return {
      plan: {
        id: planId, name: plan.name, price: plan.price,
        features: plan.featuresList, excludedFeatures: plan.excludedFeatures, analytics: plan.analytics,
      },
      subscription: subscription ? { status: subscription.status, current_period_end: subscription.current_period_end } : null,
      usage: {
        projects: { used: 0, limit: -1, percentage: 0 },
        plagiarismChecks: { used: 0, limit: -1, percentage: 0 },
        aiRequests: { used: 0, limit: -1, percentage: 0 },
        aiChatMessages: { used: 0, limit: -1, percentage: 0 },
        aiWebSearches: { used: 0, limit: -1, percentage: 0 },
        aiDeepSearches: { used: 0, limit: -1, percentage: 0 },
        aiCost: { used: 0, limit: -1, percentage: 0 },
        words: { used: 0, limit: -1, percentage: 0 },
        storage: { used: 0, limit: -1, percentage: 0 },
      },
    };
  }

  static async hasAnalyticsAccess(_userId: string, _feature: string): Promise<boolean> { return true; }

  static async hasFeatureAccess(userId: string, _feature: string): Promise<{ hasAccess: boolean; planId: string; reason?: string }> {
    const subscription = await prisma.subscription.findUnique({ where: { user_id: userId } }).catch(() => null);
    return { hasAccess: true, planId: (subscription?.plan as keyof typeof plans) || "free" };
  }

  static async syncSubscription(data: { userId: string; planId: string; status: string; currentPeriodEnd?: Date; idempotencyKey?: string }) {
    const { userId, planId, status, currentPeriodEnd, idempotencyKey } = data;
    const update = () => prisma.subscription.upsert({
      where: { user_id: userId },
      update: { plan: planId, status, current_period_end: currentPeriodEnd, updated_at: new Date() },
      create: { user_id: userId, plan: planId, status, lemonsqueezy_subscription_id: null, current_period_end: currentPeriodEnd },
    });
    return idempotencyKey ? IdempotencyService.processWithIdempotency(idempotencyKey, update) : update();
  }

  static async sendBillingNotification(userId: string, type: string, title: string, message: string, data?: any) {
    return createBillingNotification(userId, type as any, title, message, data);
  }

  static async sendBillingReminder(userId: string, daysUntilDue: number, amount: number, planName: string) {
    return this.sendBillingNotification(userId, "billing_reminder", "Upcoming Payment Due",
      "Your " + planName + " subscription payment of $" + amount.toFixed(2) + " is due in " + daysUntilDue + " day" + (daysUntilDue !== 1 ? "s" : "") + ".",
      { amount, planName, daysUntilDue });
  }

  static async sendPaymentMethodUpdate(userId: string, action: "added" | "removed" | "updated") {
    const msgs: Record<string, { title: string; message: string }> = {
      added: { title: "Payment Method Added", message: "A new payment method has been added to your account." },
      removed: { title: "Payment Method Removed", message: "A payment method has been removed from your account." },
      updated: { title: "Payment Method Updated", message: "Your payment method information has been updated." },
    };
    return this.sendBillingNotification(userId, "payment_method_update", msgs[action].title, msgs[action].message);
  }

  static async sendPlanChangeConfirmation(userId: string, oldPlanName: string, newPlanName: string, effectiveDate: Date, proratedAmount?: number) {
    let msg = "Your subscription has been updated from " + oldPlanName + " to " + newPlanName + ", effective " + effectiveDate.toDateString() + ".";
    if (proratedAmount !== undefined && proratedAmount > 0) msg += " A prorated charge of $" + proratedAmount.toFixed(2) + " will be applied.";
    return this.sendBillingNotification(userId, "plan_change", "Subscription Plan Updated", msg, { oldPlanName, newPlanName, effectiveDate: effectiveDate.toISOString(), proratedAmount });
  }

  static async sendUsageLimitWarning(userId: string, resourceName: string, used: number, limit: number, planName: string) {
    return this.sendBillingNotification(userId, "usage_limit_warning", "Usage Limit Warning",
      "You have used " + used + "/" + limit + " " + resourceName + " on your " + planName + " plan.", { resourceName, used, limit, planName });
  }

  static async sendStorageLimitWarning(userId: string, usedGB: number, limitGB: number) {
    return this.sendBillingNotification(userId, "storage_limit_warning", "Storage Limit Warning",
      "You have used " + usedGB.toFixed(2) + "GB/" + limitGB + "GB of storage.", { usedGB, limitGB });
  }

  static async sendTrialEndingNotification(userId: string, daysRemaining: number, planName: string) {
    return this.sendBillingNotification(userId, "trial_ending", "Trial Period Ending Soon",
      "Your " + planName + " trial period ends in " + daysRemaining + " day" + (daysRemaining !== 1 ? "s" : "") + ".", { daysRemaining, planName });
  }

  static async sendBillingSummary(userId: string, period: "monthly" | "annual", totalAmount: number, breakdown: Array<{ item: string; amount: number }>) {
    let msg = "Your " + period + " billing summary:\n\n";
    breakdown.forEach((i) => { msg += "- " + i.item + ": $" + i.amount.toFixed(2) + "\n"; });
    msg += "\nTotal: $" + totalAmount.toFixed(2);
    return this.sendBillingNotification(userId, "billing_summary", (period === "monthly" ? "Monthly" : "Annual") + " Billing Summary", msg, { period, totalAmount, breakdown });
  }

  static async handleSubscriptionCreated(userId: string, planId: string, amount: number, billingPeriod: string) {
    const plan = plans[planId as keyof typeof plans];
    if (plan) await sendSubscriptionCreatedNotification(userId, plan.name, amount, billingPeriod);
  }
  static async handleSubscriptionUpdated(userId: string, oldPlanId: string, newPlanId: string, amount: number) {
    const oldPlan = plans[oldPlanId as keyof typeof plans];
    const newPlan = plans[newPlanId as keyof typeof plans];
    if (oldPlan && newPlan) await sendSubscriptionUpdatedNotification(userId, oldPlan.name, newPlan.name, amount);
  }
  static async handleSubscriptionCancelled(userId: string, planId: string, endDate: Date) {
    const plan = plans[planId as keyof typeof plans];
    if (plan) await sendSubscriptionCancelledNotification(userId, plan.name, endDate.toISOString());
  }
  static async handleSubscriptionRenewed(userId: string, planId: string, amount: number, nextBillingDate: Date) {
    const plan = plans[planId as keyof typeof plans];
    if (plan) await sendSubscriptionRenewedNotification(userId, plan.name, amount, nextBillingDate.toISOString());
  }
  static async handleSubscriptionExpiring(userId: string, planId: string, expirationDate: Date, amount: number) {
    const plan = plans[planId as keyof typeof plans];
    if (plan) await sendSubscriptionExpiringNotification(userId, plan.name, expirationDate.toISOString(), amount);
  }
  static async handlePaymentSuccess(userId: string, amount: number, planId: string, transactionId: string) {
    const plan = plans[planId as keyof typeof plans];
    if (plan) await sendPaymentSuccessNotification(userId, amount, plan.name, transactionId);
  }
  static async handlePaymentFailed(userId: string, amount: number, planId: string, errorMessage: string) {
    const plan = plans[planId as keyof typeof plans];
    if (plan) await sendPaymentFailedNotification(userId, amount, plan.name, errorMessage);
  }
  static async handlePaymentRefunded(userId: string, amount: number, planId: string, transactionId: string) {
    const plan = plans[planId as keyof typeof plans];
    if (plan) await sendPaymentRefundedNotification(userId, amount, plan.name, transactionId);
  }
  static async handleInvoiceAvailable(userId: string, invoiceId: string, amount: number, dueDate: Date, downloadUrl: string) {
    await sendInvoiceAvailableNotification(userId, invoiceId, amount, dueDate.toISOString(), downloadUrl);
  }

  static async upgradeSubscription(userId: string, newPlanId: string, lemonsqueezySubscriptionId?: string, idempotencyKey?: string) {
    const newPlan = plans[newPlanId as keyof typeof plans];
    if (!newPlan) throw new Error("Invalid plan: " + newPlanId);
    const current = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!current) throw new Error("No existing subscription found");
    const update = () => prisma.subscription.update({
      where: { user_id: userId },
      data: { plan: newPlanId, lemonsqueezy_subscription_id: lemonsqueezySubscriptionId, updated_at: new Date() },
    });
    const result = idempotencyKey ? await IdempotencyService.processWithIdempotency(idempotencyKey, update) : await update();
    await this.handleSubscriptionUpdated(userId, current.plan, newPlanId, newPlan.price);
    return { success: true, subscription: result, message: "Successfully upgraded to " + newPlan.name + " plan" };
  }

  static async downgradeSubscription(userId: string, newPlanId: string, idempotencyKey?: string) {
    const newPlan = plans[newPlanId as keyof typeof plans];
    if (!newPlan) throw new Error("Invalid plan: " + newPlanId);
    const current = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!current) throw new Error("No existing subscription found");
    const update = () => prisma.subscription.update({ where: { user_id: userId }, data: { plan: newPlanId, updated_at: new Date() } });
    const result = idempotencyKey ? await IdempotencyService.processWithIdempotency(idempotencyKey, update) : await update();
    await this.handleSubscriptionUpdated(userId, current.plan, newPlanId, newPlan.price);
    return { success: true, subscription: result, message: "Successfully downgraded to " + newPlan.name + " plan" };
  }

  static async cancelSubscription(userId: string, immediately = false, idempotencyKey?: string) {
    const current = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!current) throw new Error("No existing subscription found");
    const update = () => prisma.subscription.update({ where: { user_id: userId }, data: { status: immediately ? "cancelled" : "scheduled_for_cancellation", updated_at: new Date() } });
    const result = idempotencyKey ? await IdempotencyService.processWithIdempotency(idempotencyKey, update) : await update();
    const endDate = current.current_period_end ? new Date(current.current_period_end) : new Date();
    if (immediately) await this.handleSubscriptionCancelled(userId, current.plan, endDate);
    else await this.handleSubscriptionExpiring(userId, current.plan, endDate, 0);
    return { success: true, subscription: result, message: "Subscription " + (immediately ? "cancelled" : "scheduled for cancellation") };
  }

  static async reactivateSubscription(userId: string, idempotencyKey?: string) {
    const current = await prisma.subscription.findUnique({ where: { user_id: userId } });
    if (!current) throw new Error("No existing subscription found");
    if (current.status !== "cancelled" && current.status !== "scheduled_for_cancellation") throw new Error("Subscription is not eligible for reactivation");
    const update = () => prisma.subscription.update({ where: { user_id: userId }, data: { status: "active", updated_at: new Date() } });
    const result = idempotencyKey ? await IdempotencyService.processWithIdempotency(idempotencyKey, update) : await update();
    const plan = plans[current.plan as keyof typeof plans];
    await this.handleSubscriptionRenewed(userId, current.plan, plan?.price || 0, current.current_period_end ? new Date(current.current_period_end) : new Date());
    return { success: true, subscription: result, message: "Subscription successfully reactivated" };
  }

  static async canUpgradeToPlan(_userId: string, targetPlanId: string): Promise<{ allowed: boolean; reason?: string }> {
    if (!plans[targetPlanId as keyof typeof plans]) return { allowed: false, reason: "Invalid plan: " + targetPlanId };
    return { allowed: true };
  }

  static async getUpgradeOptions(userId: string) {
    const subscription = await prisma.subscription.findUnique({ where: { user_id: userId } }).catch(() => null);
    const currentPlanId = (subscription?.plan as keyof typeof plans) || "free";
    return Object.entries(plans).filter(([id]) => id !== "institutional").map(([id, plan]) => ({
      planId: id, name: plan.name, price: plan.price, features: plan.featuresList,
      canUpgrade: currentPlanId !== id, reason: currentPlanId === id ? "You are already on this plan" : undefined,
    }));
  }

  static async trackAIUsage(userId: string, usageData: { requestType: string }) {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      let usage = await prisma.aIUsage.findUnique({ where: { user_id_month_year: { user_id: userId, month, year } } });
      if (!usage) {
        usage = await prisma.aIUsage.create({ data: { user_id: userId, month, year, request_count: 0, chat_message_count: 0, image_generation_count: 0, web_search_count: 0, deep_search_count: 0 } });
      }
      const updateData: any = {};
      switch (usageData.requestType) {
        case "ai_request": updateData.request_count = { increment: 1 }; break;
        case "ai_chat_message": updateData.chat_message_count = { increment: 1 }; break;
        case "ai_web_search": updateData.web_search_count = { increment: 1 }; break;
        case "ai_deep_search": updateData.deep_search_count = { increment: 1 }; break;
      }
      const updated = await prisma.aIUsage.update({ where: { user_id_month_year: { user_id: userId, month, year } }, data: updateData });
      return { success: true, aiUsage: updated };
    } catch (error) { console.error("Error tracking AI usage:", error); throw error; }
  }

  static async trackPlagiarismUsage(userId: string) {
    try {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const count = await prisma.plagiarismReport.count({ where: { user_id: userId, created_at: { gte: startOfMonth } } });
      return { success: true, count: count + 1 };
    } catch (error) { console.error("Error tracking plagiarism usage:", error); throw error; }
  }

  static async trackProjectCreation(userId: string) {
    try {
      const count = await prisma.project.count({ where: { user_id: userId, status: { not: "archived" } } });
      return { success: true, count: count + 1 };
    } catch (error) { console.error("Error tracking project creation:", error); throw error; }
  }

  static async trackStorageUsage(userId: string, bytesUsed: number) {
    try {
      const gbUsed = bytesUsed / (1024 * 1024 * 1024);
      const updated = await prisma.user.update({ where: { id: userId }, data: { storage_used: { increment: gbUsed } } });
      return { success: true, storageUsed: updated.storage_used || 0 };
    } catch (error) { console.error("Error tracking storage usage:", error); throw error; }
  }

  static async resetStorageUsage(userId: string, bytesFreed: number) {
    try {
      const gbFreed = bytesFreed / (1024 * 1024 * 1024);
      const updated = await prisma.user.update({ where: { id: userId }, data: { storage_used: { decrement: gbFreed } } });
      if ((updated.storage_used || 0) < 0) await prisma.user.update({ where: { id: userId }, data: { storage_used: 0 } });
      return { success: true, storageUsed: Math.max(0, (updated.storage_used || 0) - gbFreed) };
    } catch (error) { console.error("Error resetting storage usage:", error); throw error; }
  }

  static async getUserWordCount(userId: string): Promise<number> {
    try {
      const projects = await prisma.project.findMany({ where: { user_id: userId }, select: { word_count: true } });
      return projects.reduce((sum: number, p: any) => sum + (p.word_count || 0), 0);
    } catch { return 0; }
  }

  static async getAIWordCount(userId: string): Promise<number> {
    try {
      if (!prisma || typeof prisma.aIUsage === "undefined") return 0;
      const agg = await prisma.aIUsage.aggregate({ _sum: { total_tokens_used: true }, where: { user_id: userId } });
      return Math.round((agg._sum.total_tokens_used || 0) * 0.75);
    } catch { return 0; }
  }

  static async getUserStorageUsed(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { storage_used: true } });
      return user?.storage_used || 0;
    } catch { return 0; }
  }

  private static getPlanAICostLimit(planId: string): number {
    const costLimits: Record<string, number> = { free: 0, student: 20, researcher: 100 };
    return costLimits[planId] ?? 0;
  }
}

