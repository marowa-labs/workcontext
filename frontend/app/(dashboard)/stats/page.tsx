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
  BarChart3,
  PieChart,
  Activity,
  Award,
  Flame,
  Star,
  Trophy,
  FileText,
  MessageSquare,
  Folder,
} from "lucide-react";

interface UserStats {
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalWorkspaces: number;
  totalMessages: number;
  aiInteractions: number;
  timeSpent: number; // in minutes
  productivity: number; // score 0-100
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
    // Only set full loading on initial load
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading your stats...</span>
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
                <h1 className="text-2xl font-bold text-slate-900">Your Performance</h1>
                <p className="text-sm text-slate-500">
                  Personal KPIs and activity metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                {(["week", "month", "all"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={isRefreshing}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${timeRange === range
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {range === "week" ? "This Week" : range === "month" ? "This Month" : "All Time"}
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
              <p className="text-blue-100 text-sm font-medium mb-1">Productivity Score</p>
              <p className="text-5xl font-bold">{stats.productivity}</p>
              <p className="text-blue-100 text-sm mt-2">Top 15% of all users</p>
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
            subtext={`${stats.completionRate}% completion rate`}
            trend="up"
          />
          <KpiCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Current Streak"
            value={`${stats.currentStreak} days`}
            subtext={`Best: ${stats.longestStreak} days`}
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
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Weekly Activity</h3>
                <p className="text-sm text-slate-500">Tasks and hours logged</p>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-end gap-4">
            {stats.weeklyActivity.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-1">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${(day.tasks / 20) * 100}px`, minHeight: "4px" }}
                    title={`${day.tasks} tasks`}
                  />
                  <div
                    className="w-full bg-purple-400 rounded-t transition-all hover:bg-purple-500"
                    style={{ height: `${day.hours * 8}px`, minHeight: "4px" }}
                    title={`${day.hours} hours`}
                  />
                </div>
                <span className="text-xs text-slate-500">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-slate-600">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded" />
              <span className="text-sm text-slate-600">Hours</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Achievements */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Achievements</h3>
                <p className="text-sm text-slate-500">Unlocked {stats.achievements.length} badges</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200"
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm w-fit mb-3">
                    {achievement.icon === "trophy" && <Trophy className="w-6 h-6 text-yellow-500" />}
                    {achievement.icon === "flame" && <Flame className="w-6 h-6 text-orange-500" />}
                    {achievement.icon === "zap" && <Zap className="w-6 h-6 text-purple-500" />}
                  </div>
                  <p className="font-semibold text-slate-900">{achievement.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{achievement.description}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Milestones */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Recent Milestones</h3>
                <p className="text-sm text-slate-500">Latest achievements</p>
              </div>
            </div>
            <div className="space-y-4">
              {stats.recentMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {milestone.type === "task" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {milestone.type === "streak" && <Flame className="w-4 h-4 text-orange-500" />}
                    {milestone.type === "workspace" && <Folder className="w-4 h-4 text-blue-500" />}
                    {milestone.type === "ai" && <Zap className="w-4 h-4 text-purple-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{milestone.title}</p>
                    <p className="text-xs text-slate-500">
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
          <SimpleStat icon={<FileText className="w-4 h-4" />} label="Tasks Created" value={stats.tasksCreated} />
          <SimpleStat icon={<Folder className="w-4 h-4" />} label="Workspaces" value={stats.totalWorkspaces} />
          <SimpleStat icon={<MessageSquare className="w-4 h-4" />} label="Messages" value={stats.totalMessages} />
          <SimpleStat icon={<Star className="w-4 h-4" />} label="Completion" value={`${stats.completionRate}%`} />
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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {trend !== "neutral" && (
          <div className={`p-1 rounded ${trend === "up" ? "bg-emerald-50" : "bg-red-50"}`}>
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
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
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-500">{icon}</div>
      <div>
        <p className="font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
