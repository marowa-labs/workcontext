"use client";

import { useState, useEffect } from "react";
import { Zap, FileText, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import BillingService from "../../lib/utils/billingService";

type UsageData = {
  plan: {
    id: string;
    name: string;
    price: number;
  };
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
};

export default function UsageMeter() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load real usage data
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const loadUsageData = async () => {
      if (!isMounted) return;

      try {
        // Fetch real usage data from the new subscription service
        const subscriptionData = await BillingService.getCurrentSubscription(
          0,
          true,
        ); // No retries, use cache

        if (!isMounted) return;

        setUsageData(subscriptionData);
      } catch (err: any) {
        console.error("Failed to load usage data:", err);
        if (isMounted) {
          setError(
            `Failed to load usage data: ${err.message || "Unknown error"}`,
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsageData();

    // Refresh data every 90 seconds (increased from 60 seconds to reduce load)
    intervalId = setInterval(() => {
      if (isMounted && !loading) {
        loadUsageData();
      }
    }, 90000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loading]);

  const handleUpgrade = () => {
    router.push("billing/subscription");
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="text-destructive text-center py-4">
          <p className="font-medium">Usage Data Error</p>
          <p className="text-sm mt-1">{error}</p>
          <div className="mt-3 flex space-x-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!usageData) return null;

  // Define type for usage items
  type UsageItem = {
    id: string;
    label: string;
    used: number;
    limit: number | "unlimited";
    percentage: number;
    icon: any;
    color: string;
  };

  const usageItems: UsageItem[] = [
    {
      id: "projects",
      label: "Projects",
      used: usageData.usage.projects.used,
      limit: "unlimited",
      percentage: 0,
      icon: FileText,
      color: "blue",
    },
    {
      id: "plagiarism",
      label: "Plagiarism Checks",
      used: usageData.usage.plagiarismChecks.used,
      limit:
        usageData.usage.plagiarismChecks.limit === -1
          ? "unlimited"
          : usageData.usage.plagiarismChecks.limit,
      percentage: usageData.usage.plagiarismChecks.percentage,
      icon: FileText,
      color: "purple",
    },
    {
      id: "aiwords",
      label: "AI Words",
      used: 0, // Not available in current usage data
      limit: "unlimited",
      percentage: 0,
      icon: Zap,
      color: "blue",
    },
    {
      id: "ai",
      label: "AI Requests",
      used: usageData.usage.aiRequests.used,
      limit:
        usageData.usage.aiRequests.limit === -1
          ? "unlimited"
          : usageData.usage.aiRequests.limit,
      percentage: usageData.usage.aiRequests.percentage,
      icon: Database,
      color: "purple",
    },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-cw-danger";
    if (percentage >= 75) return "bg-cw-secondary";
    return "bg-cw-primary";
  };

  // Check if user is on researcher plan - if so, don't show upgrade button
  const isResearcher = usageData.plan.id === "researcher";

  return (
    <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Usage Overview
        </h3>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {usageData.plan.name}
          </span>
        </div>
      </div>

      <div className="space-y-5 flex-grow">
        {usageItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                    <Icon
                      className={`w-4 h-4 text-${item.color}-600 dark:text-${item.color}-400`}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.used} / {item.limit === "unlimited" ? "∞" : item.limit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(item.percentage)}`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Only show upgrade button if user is not on researcher plan */}
      {!isResearcher && (
        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={handleUpgrade}
            className="w-full py-2 px-4 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-sm font-medium transition-colors duration-200">
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}
