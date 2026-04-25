"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import apiClient from "../../../lib/utils/apiClient";

interface AnalyticsData {
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { status: string; count: number }[];
  memberActivity: { name: string; completed: number }[];
  completionTrend: { date: string; count: number }[];
  projectMetrics?: {
    // NEW: Project metrics
    id: string;
    title: string;
    status: string;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function WorkspaceAnalytics({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get(
          `/api/workspaces/${workspaceId}/analytics`,
        );
        setData(response);
      } catch (error) {
        console.error("Failed to fetch workspace analytics", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-600 font-medium">
              Completion Rate
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {data.completionRate}%
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 font-medium">
              Total Tasks
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {data.totalTasks}
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-600 font-medium">
              Completed
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {data.doneTasks}
              <CheckCircle2 className="w-6 h-6 text-purple-500" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-600 font-medium">
              Active Members
            </CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {data.memberActivity.length}
              <Users className="w-6 h-6 text-amber-500" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Project Progress Section */}
      {data.projectMetrics && data.projectMetrics.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-500" />
              Project Progress
            </CardTitle>
            <CardDescription>
              Task completion across research projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.projectMetrics.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900">
                        {project.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {project.completedTasks} / {project.totalTasks} tasks
                        completed
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-teal-600">
                        {project.progress}%
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          project.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : project.status === "draft"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-blue-100 text-blue-700"
                        }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Task Status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value">
                  {data.statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Trend */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Velocity (14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.completionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.split("-").slice(1).join("/")}
                  fontSize={10}
                />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member Activity */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Member Contributions
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.memberActivity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={10} />
                <YAxis
                  dataKey="name"
                  type="category"
                  fontSize={10}
                  width={100}
                />
                <Tooltip />
                <Bar dataKey="completed" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Counts */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Task Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.priorityDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
