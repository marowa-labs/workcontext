"use client";

import { useState, useEffect } from "react";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Zap, AlertTriangle } from "lucide-react";
import useAIUsage from "../../hooks/useAIUsage";
import BillingService from "../../lib/utils/billingService";

interface SubscriptionInfo {
  plan: {
    id: string;
    name: string;
  };
}

export function AIUsageTracker() {
  const { usage, loading, error, refreshUsage } = useAIUsage();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const sub = await BillingService.getCurrentSubscription();
        setSubscription(sub);
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  // Refresh usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUsage();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshUsage]);

  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-black">
        <Zap className="h-3 w-3" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-xs text-red-500">
        <AlertTriangle className="h-3 w-3" />
        <span>Error loading usage</span>
      </div>
    );
  }

  const planId = subscription?.plan?.id || "free";
  const planName = subscription?.plan?.name || "Free Plan";

  // Determine limit based on plan
  let limit = 0;
  switch (planId) {
    case "free":
      limit = 10;
      break;
    case "onetime":
      limit = 100;
      break;
    case "student":
      limit = 500;
      break;
    case "researcher":
    case "institutional":
      limit = -1; // Unlimited
      break;
    default:
      limit = 10;
  }

  // For unlimited plans
  if (limit === -1) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        <Zap className="h-3 w-3 text-green-500" />
        <Badge variant="secondary" className="text-xs">
          {planName} • Unlimited
        </Badge>
      </div>
    );
  }

  const used = limit - usage.remaining;
  const percentage = (used / limit) * 100;

  // Determine badge variant based on usage
  let badgeVariant: "default" | "secondary" | "destructive" = "default";
  if (percentage >= 90) {
    badgeVariant = "destructive";
  } else if (percentage >= 75) {
    badgeVariant = "secondary";
  }

  return (
    <div className="flex items-center space-x-2 min-w-[180px]">
      <Zap className="h-3 w-3 text-yellow-500" />
      <div className="flex flex-col flex-grow">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Autocomplete</span>
          <Badge variant={badgeVariant} className="text-xs">
            {used}/{limit}
          </Badge>
        </div>
        {percentage >= 90 ? (
          <div className="flex items-center space-x-2 mt-1">
            <Progress value={percentage} className="h-1.5 flex-grow" />
            <div className="text-xs text-red-500 flex items-center space-x-1 whitespace-nowrap">
              <AlertTriangle className="h-3 w-3" />
              <span>Nearly at limit</span>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <Progress value={percentage} className="h-1.5" />
          </div>
        )}
      </div>
    </div>
  );
}
