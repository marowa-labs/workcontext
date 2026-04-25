"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Calendar,
  CreditCard,
  Edit3,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import BillingService from "../../../lib/utils/billingService";

interface SubscriptionData {
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
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
  };
}

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "failed" | "refunded" | "pending";
  receiptUrl?: string;
}

const SubscriptionPage: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstitutionalMember, setIsInstitutionalMember] =
    useState<boolean>(false);
  const [institutionalSubscription, setInstitutionalSubscription] =
    useState<any>(null);

  // Fetch subscription data
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after component unmounts

    const fetchSubscription = async () => {
      try {
        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(true);
        }

        // Fetch regular subscription data and billing history in parallel
        const [subscriptionResponse, invoicesResponse] = await Promise.all([
          BillingService.getCurrentSubscription(),
          BillingService.getBillingHistory().catch((err) => {
            console.error("Error fetching billing history:", err);
            return [];
          }),
        ]);

        // Check if user is part of an institutional subscription
        let isInstMember = false;
        let instSubscription = null;

        // Institutional subscription check is disabled since service doesn't exist
        // try {
        //   isInstMember =
        //     await InstitutionalSubscriptionService.isUserInstitutionalMember();
        //   if (isInstMember) {
        //     instSubscription =
        //       await InstitutionalSubscriptionService.getUserSubscription();
        //   }
        // } catch (instError) {
        //   console.error(
        //     "Error checking institutional subscription:",
        //     instError
        // );
        // }

        // Only update state if component is still mounted
        if (isMounted) {
          setSubscription(subscriptionResponse);
          setInvoices(invoicesResponse);
          setIsInstitutionalMember(isInstMember);
          setInstitutionalSubscription(instSubscription);
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
        // Only update state if component is still mounted
        if (isMounted) {
          setError("Failed to load subscription data");
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSubscription();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpgrade = async (plan: "student" | "researcher") => {
    try {
      setLoading(true);
      const response = await BillingService.createCheckoutSession(plan);

      if (response.success && response.checkoutUrl) {
        // Redirect to checkout
        window.location.href = response.checkoutUrl;
      } else {
        setError(response.message || "Failed to create checkout session");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError("Failed to start upgrade process");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      setLoading(true);
      const result = await BillingService.updatePaymentMethod();
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error("Error updating payment method:", err);
      setError("Failed to update payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleCall = () => {
    // Open scheduling link in a new tab
    window.open("https://calendly.com/audacityimpact/30min", "_blank");
  };

  const handleContactSupport = () => {
    // Open support email in default email client
    window.location.href =
      "mailto:support@scholarforgeai.com?subject=Billing%20Support%20Request";
  };

  const handleCancelSubscription = async () => {
    try {
      // Show confirmation dialog
      if (
        window.confirm("Are you sure you want to cancel your subscription?")
      ) {
        setLoading(true);
        await BillingService.cancelSubscription("User requested cancellation");
        // Refresh subscription data
        const response = await BillingService.getCurrentSubscription();
        setSubscription(response);
      }
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      setError("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      await BillingService.reactivateSubscription();
      // Refresh subscription data
      const response = await BillingService.getCurrentSubscription();
      setSubscription(response);
    } catch (err) {
      console.error("Error reactivating subscription:", err);
      setError("Failed to reactivate subscription");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background w-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Error Loading Subscription
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-background w-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            No Subscription Data
          </h2>
          <p className="text-muted-foreground">
            Unable to load your subscription information.
          </p>
        </div>
      </div>
    );
  }

  const currentPlan = subscription.plan;
  const nextBillingDate = subscription.subscription?.current_period_end
    ? new Date(subscription.subscription.current_period_end)
    : null;

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="p-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Institutional Subscription Information */}
        {isInstitutionalMember && institutionalSubscription && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <svg
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Institutional Subscription
                  </h2>
                  <p className="text-foreground">
                    {institutionalSubscription.institutionName}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm font-medium rounded-full">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground mb-1">Plan Type</p>
                <p className="font-semibold text-foreground">
                  {institutionalSubscription.planType}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Seats Limit
                </p>
                <p className="font-semibold text-foreground">
                  {institutionalSubscription.seatsLimit} seats
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
                <p className="text-sm text-muted-foreground mb-1">Storage</p>
                <p className="font-semibold text-foreground">
                  {institutionalSubscription.storageLimitGb} GB
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                <p>
                  Billing Cycle:{" "}
                  <span className="font-medium text-foreground">
                    {institutionalSubscription.billingCycle}
                  </span>
                </p>
                <p>
                  Contact:{" "}
                  <span className="font-medium text-foreground">
                    {institutionalSubscription.contactPerson}
                  </span>
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = "/institutional")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Manage Institutional Subscription
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Current Plan Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Current Plan
                </h2>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {currentPlan.name}
                  </h3>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ${currentPlan.price}
                    <span className="text-lg font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                </div>
                {nextBillingDate && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Next billing date
                    </p>
                    <p className="font-medium text-foreground">
                      {nextBillingDate.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Plan features</p>
                  <ul className="mt-2 space-y-1">
                    {currentPlan.features.slice(0, 3).map((feature, index) => (
                      <li
                        key={index}
                        className="text-foreground text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                    {currentPlan.features.length > 3 && (
                      <li className="text-muted-foreground text-sm">
                        + {currentPlan.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="bg-card border border-border text-foreground hover:bg-muted">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
                <Button
                  onClick={handleUpdatePaymentMethod}
                  variant="outline"
                  className="bg-card border border-border text-foreground hover:bg-muted">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                {subscription.subscription?.status === "active" && (
                  <Button
                    onClick={handleCancelSubscription}
                    variant="outline"
                    className="bg-card border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )}
                {subscription.subscription?.status === "cancelled" && (
                  <Button
                    onClick={handleReactivateSubscription}
                    variant="outline"
                    className="bg-card border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                    disabled={loading}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Reactivate Subscription
                  </Button>
                )}
              </div>
            </div>

            {/* Usage Meter */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Usage This Month
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      Projects
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.usage.projects.used} /{" "}
                      {subscription.usage.projects.limit === -1
                        ? "∞"
                        : subscription.usage.projects.limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(subscription.usage.projects.percentage || 0, 100)}%`,
                      }}></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-muted-foreground">
                      {(subscription.usage.projects.percentage || 0).toFixed(1)}
                      % used
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      Plagiarism Checks
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.usage.plagiarismChecks.used} /{" "}
                      {subscription.usage.plagiarismChecks.limit === -1
                        ? "∞"
                        : subscription.usage.plagiarismChecks.limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-purple-500"
                      style={{
                        width: `${Math.min(subscription.usage.plagiarismChecks.percentage || 0, 100)}%`,
                      }}></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-muted-foreground">
                      {(
                        subscription.usage.plagiarismChecks.percentage || 0
                      ).toFixed(1)}
                      % used
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      AI Requests
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.usage.aiRequests.used} /{" "}
                      {subscription.usage.aiRequests.limit === -1
                        ? "∞"
                        : subscription.usage.aiRequests.limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-green-500"
                      style={{
                        width: `${Math.min(subscription.usage.aiRequests.percentage || 0, 100)}%`,
                      }}></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-muted-foreground">
                      {(subscription.usage.aiRequests.percentage || 0).toFixed(
                        1,
                      )}
                      % used
                    </span>
                  </div>
                </div>
              </div>

              {nextBillingDate && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Usage resets on {nextBillingDate.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Plan Comparison */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Plan Comparison
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Your Plan: {currentPlan.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Current active plan
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                {/* Student Pro Option */}
                {currentPlan.id !== "student" && (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Student Pro
                      </h3>
                      <p className="text-sm text-muted-foreground">$12/month</p>
                    </div>
                    <Button
                      onClick={() => handleUpgrade("student")}
                      size="sm"
                      className={
                        currentPlan.id === "researcher"
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }>
                      {currentPlan.id === "researcher"
                        ? "Downgrade"
                        : "Upgrade"}
                    </Button>
                  </div>
                )}

                {/* Researcher Option */}
                {currentPlan.id !== "researcher" && (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Researcher
                      </h3>
                      <p className="text-sm text-muted-foreground">$25/month</p>
                    </div>
                    <Button
                      onClick={() => handleUpgrade("researcher")}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white">
                      Upgrade
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Billing History */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Billing History
              </h2>

              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No billing history found.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="overflow-y-auto max-h-96">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Receipt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                              {new Date(invoice.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {invoice.description}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                              ${invoice.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  invoice.status === "paid"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : invoice.status === "failed"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                      : invoice.status === "refunded"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                }`}>
                                {invoice.status.charAt(0).toUpperCase() +
                                  invoice.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {invoice.receiptUrl ? (
                                <a
                                  href={invoice.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline">
                                  View Receipt
                                </a>
                              ) : (
                                <span className="text-muted-foreground">
                                  Not available
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Need Help? */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Need Help?
              </h2>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleScheduleCall}
                  className="w-full justify-start bg-card border border-border text-foreground hover:bg-muted">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule a Call
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-card border border-border text-foreground hover:bg-muted"
                  onClick={handleUpdatePaymentMethod}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button
                  variant="outline"
                  onClick={handleContactSupport}
                  className="w-full justify-start bg-card border border-border text-foreground hover:bg-muted">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
