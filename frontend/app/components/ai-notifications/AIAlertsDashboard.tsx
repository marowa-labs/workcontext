"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AIService from "../../lib/utils/aiService";

interface AIUsageData {
  remaining: number;
  limit: number;
}

interface AIAnalyticsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  costEstimate: number;
}

const AIAlertsDashboard: React.FC = () => {
  const [usage, setUsage] = useState<AIUsageData | null>(null);
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usageData, analyticsData] = await Promise.all([
          AIService.getAIUsage(),
          AIService.getAIAnalytics(),
        ]);
        setUsage(usageData);
        setAnalytics(analyticsData);
      } catch (err) {
        setError("Failed to fetch AI data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate usage percentage
  const usagePercentage = usage
    ? Math.round(((usage.limit - usage.remaining) / usage.limit) * 100)
    : 0;

  // Get usage status (safe, warning, critical)
  const getUsageStatus = () => {
    if (usagePercentage >= 90) return "critical";
    if (usagePercentage >= 75) return "warning";
    return "safe";
  };

  // Get success rate
  const successRate = analytics
    ? Math.round(
        (analytics.successfulRequests / Math.max(analytics.totalRequests, 1)) *
          100,
      )
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const usageStatus = getUsageStatus();

  return (
    <div className="space-y-6">
      {/* Usage Alerts */}
      <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-white border-white">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-black text-black mb-6">
            AI Usage Alerts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Usage Status */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-5 rounded-lg border border-purple-200 border-white-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Usage Status
                  </p>
                  <p className="mt-1 text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {usagePercentage}%
                  </p>
                  <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                    {usage?.remaining} of {usage?.limit} requests remaining
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-white rounded-full">
                  {usageStatus === "critical" ? (
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  ) : usageStatus === "warning" ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-white">
                  <div
                    className={`h-2 rounded-full ${
                      usageStatus === "critical"
                        ? "bg-red-500"
                        : usageStatus === "warning"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${usagePercentage}%` }}></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-black dark:text-black">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {usageStatus === "critical" && (
                <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-200">
                  Critical: Upgrade plan to avoid service interruption
                </div>
              )}

              {usageStatus === "warning" && (
                <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
                  Warning: Consider upgrading your plan
                </div>
              )}
            </div>

            {/* Success Rate */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-5 rounded-lg border border-green-200 border-white-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Success Rate
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-900 dark:text-green-100">
                    {successRate}%
                  </p>
                  <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                    {analytics?.successfulRequests} of{" "}
                    {analytics?.totalRequests} requests
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-white rounded-full">
                  {successRate >= 95 ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-white">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${successRate}%` }}></div>
                </div>
              </div>

              {successRate < 95 && (
                <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
                  Some requests are failing. Check your inputs.
                </div>
              )}
            </div>

            {/* Cost Estimate */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-5 rounded-lg border border-blue-200 border-white-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Estimated Cost
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ${analytics?.costEstimate.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                    This billing period
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-white rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAlertsDashboard;
