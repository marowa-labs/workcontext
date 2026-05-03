"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../lib/utils/apiClient";
import useUser from "../../lib/utils/useUser";
import {
  BarChart3,
  TrendingUp,
  Users,
  Folder,
  FileText,
  MessageSquare,
  ArrowLeft,
  Activity,
  PieChart,
  Clock,
  Calendar,
  Target,
  Zap,
} from "lucide-react";

interface PlatformAnalytics {
  totalUsers: number;
  totalWorkspaces: number;
  totalTasks: number;
  totalMessages: number;
  activeUsers: number;
  dailyGrowth: {
    users: number;
    workspaces: number;
    tasks: number;
  };
  activityByDay: { day: string; count: number }[];
  topWorkspaces: { id: string; name: string; tasks: number; users: number }[];
  aiUsage: {
    totalRequests: number;
    byDay: { day: string; count: number }[];
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    // Only set full loading on initial load
    const isInitialLoad = !analytics;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await apiClient.get(`/api/analytics/platform?range=${timeRange}`);
      if (data) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
                <p className="text-sm text-slate-500">Comprehensive view of all platform activities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                {(["7d", "30d", "90d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={isRefreshing}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${timeRange === range
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days"}
                  </button>
                ))}
              </div>
              {isRefreshing && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-500" />}
            label="Total Users"
            value={analytics.totalUsers.toLocaleString()}
            change={`+${analytics.dailyGrowth.users}`}
            changeLabel="today"
          />
          <StatCard
            icon={<Folder className="w-5 h-5 text-purple-500" />}
            label="Workspaces"
            value={analytics.totalWorkspaces.toLocaleString()}
            change={`+${analytics.dailyGrowth.workspaces}`}
            changeLabel="today"
          />
          <StatCard
            icon={<FileText className="w-5 h-5 text-emerald-500" />}
            label="Tasks Created"
            value={analytics.totalTasks.toLocaleString()}
            change={`+${analytics.dailyGrowth.tasks}`}
            changeLabel="today"
          />
          <StatCard
            icon={<Activity className="w-5 h-5 text-orange-500" />}
            label="Active Now"
            value={analytics.activeUsers.toString()}
            change="Live"
            changeLabel="users"
            isLive
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Activity Overview</h3>
                <p className="text-sm text-slate-500">Platform activity by day</p>
              </div>
            </div>
            <div className="h-48 flex items-end gap-2">
              {analytics.activityByDay.map((day, i) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${(day.count / 400) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-slate-500">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Usage Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">AI Usage</h3>
                <p className="text-sm text-slate-500">Total requests: {analytics.aiUsage.totalRequests.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-48 flex items-end gap-2">
              {analytics.aiUsage.byDay.map((day, i) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                    style={{ height: `${(day.count / 800) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-slate-500">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Workspaces & Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Workspaces */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Top Workspaces</h3>
                <p className="text-sm text-slate-500">Most active by tasks and users</p>
              </div>
            </div>
            <div className="space-y-4">
              {analytics.topWorkspaces.map((workspace, index) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-semibold text-slate-600 border border-slate-200">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{workspace.name}</p>
                      <p className="text-sm text-slate-500">{workspace.users} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{workspace.tasks}</p>
                      <p className="text-xs text-slate-500">tasks</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-slate-900">Messages</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{analytics.totalMessages.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Total platform messages</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-slate-900">Completion Rate</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">78%</p>
              <p className="text-sm text-slate-500 mt-1">Tasks completed</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-slate-900">Avg. Response</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">2.4s</p>
              <p className="text-sm text-slate-500 mt-1">AI response time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  change,
  changeLabel,
  isLive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  isLive?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {isLive && (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      {!isLive && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-sm font-medium text-emerald-600">{change}</span>
          <span className="text-xs text-slate-500">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
