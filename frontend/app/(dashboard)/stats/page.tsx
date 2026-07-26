"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../lib/utils/apiClient";
import useUser from "../../lib/utils/useUser";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle2,
  Calendar,
  Zap,
  Activity,
  Award,
  Flame,
  Star,
  Trophy,
  FileText,
  MessageSquare,
  Folder,
} from "lucide-react";
import SmoothAreaChart from "../../components/ui/SmoothAreaChart";

interface UserStats {
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalWorkspaces: number;
  totalMessages: number;
  aiInteractions: number;
  timeSpent: number;
  productivity: number;
  productivityPercentile: number;
  weeklyActivity: { day: string; tasks: number; hours: number }[];
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
  recentMilestones: {
    id: string;
    title: string;
    date: string;
    type: "task" | "streak" | "workspace" | "ai";
  }[];
}

export default function StatsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    const isInitialLoad = !stats;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await apiClient.get(`/api/stats/user?range=${timeRange}`);
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading your stats...</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Your Performance
                </h1>
                <p className="text-sm text-muted-foreground">
                  Personal KPIs and activity metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted rounded-lg p-1">
                {(["week", "month", "all"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={isRefreshing}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      timeRange === range
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range === "week"
                      ? "This Week"
                      : range === "month"
                        ? "This Month"
                        : "All Time"}
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
        {/* Productivity Score */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                Productivity Score
              </p>
              <p className="text-5xl font-bold">{stats.productivity}</p>
              <p className="text-blue-100 text-sm mt-2">
                Top {100 - stats.productivityPercentile}% of all users
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur">
                <Trophy className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            label="Tasks Completed"
            value={stats.tasksCompleted.toString()}
            subtext={stats.completionRate + "% completion rate"}
            trend="up"
          />
          <KpiCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Current Streak"
            value={stats.currentStreak + " days"}
            subtext={"Best: " + stats.longestStreak + " days"}
            trend="up"
          />
          <KpiCard
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            label="Time Spent"
            value={formatTime(stats.timeSpent)}
            subtext="Total platform time"
            trend="neutral"
          />
          <KpiCard
            icon={<Zap className="w-5 h-5 text-purple-500" />}
            label="AI Interactions"
            value={stats.aiInteractions.toString()}
            subtext="Assistant requests"
            trend="up"
          />
        </div>

        {/* Activity Chart */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {timeRange === "week"
                    ? "Weekly Activity"
                    : timeRange === "month"
                      ? "Monthly Activity"
                      : "All-Time Activity"}
                </h3>
                <p className="text-sm text-muted-foreground">Tasks and hours logged</p>
              </div>
            </div>
          </div>
          <SmoothAreaChart
            series={[
              {
                data: stats.weeklyActivity.map((d) => d.tasks),
                color: "#3b82f6",
                label: "Tasks",
              },
              {
                data: stats.weeklyActivity.map((d) => d.hours),
                color: "#a855f7",
                label: "Hours",
              },
            ]}
            labels={stats.weeklyActivity.map((d) => d.day)}
          />
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-muted-foreground">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-sm text-muted-foreground">Hours</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Achievements */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  Unlocked {stats.achievements.length} badges
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 bg-muted rounded-xl border border-border"
                >
                  <div className="p-3 bg-card rounded-xl shadow-sm w-fit mb-3 border border-border">
                    {achievement.icon === "trophy" && (
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    )}
                    {achievement.icon === "flame" && (
                      <Flame className="w-6 h-6 text-orange-500" />
                    )}
                    {achievement.icon === "zap" && (
                      <Zap className="w-6 h-6 text-purple-500" />
                    )}
                  </div>
                  <p className="font-semibold text-foreground">
                    {achievement.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Unlocked{" "}
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Milestones */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Recent Milestones
                </h3>
                <p className="text-sm text-muted-foreground">Latest achievements</p>
              </div>
            </div>
            <div className="space-y-4">
              {stats.recentMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {milestone.type === "task" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {milestone.type === "streak" && (
                      <Flame className="w-4 h-4 text-orange-500" />
                    )}
                    {milestone.type === "workspace" && (
                      <Folder className="w-4 h-4 text-blue-500" />
                    )}
                    {milestone.type === "ai" && (
                      <Zap className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {milestone.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(milestone.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <SimpleStat
            icon={<FileText className="w-4 h-4" />}
            label="Tasks Created"
            value={stats.tasksCreated}
          />
          <SimpleStat
            icon={<Folder className="w-4 h-4" />}
            label="Workspaces"
            value={stats.totalWorkspaces}
          />
          <SimpleStat
            icon={<MessageSquare className="w-4 h-4" />}
            label="Messages"
            value={stats.totalMessages}
          />
          <SimpleStat
            icon={<Star className="w-4 h-4" />}
            label="Completion"
            value={stats.completionRate + "%"}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  subtext,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
        {trend !== "neutral" && (
          <div
            className={
              "p-1 rounded " + (trend === "up" ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950")
            }
          >
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function SimpleStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <div className="p-2 bg-muted rounded-lg text-muted-foreground">{icon}</div>
      <div>
        <p className="font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
