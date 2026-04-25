"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../lib/utils/useUser";
import { apiClient } from "../../../lib/utils/apiClient";
import {
  Search,
  Shield,
  Activity,
  Clock,
  AlertCircle,
  Scale,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: userLoading, token } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) return;
      try {
        const data = await apiClient.get("/api/analytics/dashboard");
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    if (!userLoading && user) {
      fetchDashboardData();
    }
  }, [user, userLoading, token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to research interface with search query (discovery mode)
      router.push(`/dashboard/research?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (userLoading || (loadingData && !dashboardData)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-outfit text-foreground">
      <div className="w-full px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Research Pulse */}
            <div className="bg-card rounded-3xl p-8 border border-border requests-card shadow-sm relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />

              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 mb-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">
                      Research Pulse
                    </span>
                    {dashboardData?.literatureReviewProgress >= 80 && (
                      <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-1 rounded-md">
                        Critical Milestone
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
                    <span className="text-muted-foreground">
                      {dashboardData?.activeProjectName || "New Project"}, your
                    </span>
                    <br />
                    Literature Review
                    <br />
                    is {dashboardData?.literatureReviewProgress || 0}% complete.
                  </h1>
                </div>

                <div className="hidden md:flex flex-col items-center justify-center text-center">
                  <div className="relative w-24 h-24 mb-2">
                    <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full animate-pulse" />
                    <Activity className="w-8 h-8 text-emerald-400 opacity-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute top-2 left-8 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <div className="absolute bottom-4 right-6 w-1.5 h-1.5 bg-violet-400 rounded-full" />
                    <div className="absolute top-1/2 right-1 w-1 h-1 bg-cyan-400 rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Knowledge Graph Activity
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 pt-6 border-t border-border">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      className="text-slate-100"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeDasharray="175.8"
                      strokeDashoffset={
                        175.8 -
                        (175.8 *
                          (dashboardData?.literatureReviewProgress || 0)) /
                          100
                      }
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                    {dashboardData?.literatureReviewProgress || 0}%
                  </span>
                </div>

                <div className="flex-1 w-full">
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${dashboardData?.literatureReviewProgress || 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Next Step:
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {dashboardData?.nextStep ||
                        "Loading your research roadmap..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Intelligent Paper Discovery */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Intelligent Paper Discovery
              </h3>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search for academic papers, authors, or topics..."
                    className="w-full bg-muted/50 border border-input rounded-xl py-4 pl-12 pr-4 outline-none text-foreground placeholder-muted-foreground focus:border-primary/50 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                  <span>Recent Findings</span>
                  <span>Safety Classification</span>
                </div>

                <div className="space-y-2">
                  {(dashboardData?.recentFindings || []).map(
                    (item: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() =>
                          router.push(
                            `/dashboard/research?q=${encodeURIComponent(item.title)}`,
                          )
                        }
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-emerald-200 transition-all group cursor-pointer">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.author}, {item.year}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-${item.color}-500/20 bg-${item.color}-500/5 shrink-0`}>
                          {item.icon === "Shield" && (
                            <Shield
                              className={`w-3 h-3 text-${item.color}-400`}
                            />
                          )}
                          {item.icon === "Activity" && (
                            <Activity
                              className={`w-3 h-3 text-${item.color}-400`}
                            />
                          )}
                          {item.icon === "Clock" && (
                            <Clock
                              className={`w-3 h-3 text-${item.color}-400`}
                            />
                          )}
                          {item.icon === "AlertCircle" && (
                            <AlertCircle
                              className={`w-3 h-3 text-${item.color}-400`}
                            />
                          )}

                          <span
                            className={`text-[10px] font-bold text-${item.color}-600`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ),
                  )}

                  {(!dashboardData?.recentFindings ||
                    dashboardData.recentFindings.length === 0) && (
                    <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                      <p className="text-xs text-slate-400">
                        No recent findings yet. Start searching to build your
                        library.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width) - Ethical Safeguard Panel */}
          <div className="lg:col-span-1 bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">
                Ethical Safeguard Panel
              </h3>

              <div className="bg-muted/30 rounded-2xl p-6 border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield className="w-24 h-24 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-600 mb-2">
                  AI Confidence:
                </h4>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-bold text-foreground">
                    {dashboardData?.avgConfidence || 0}%
                  </span>
                  <Shield className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed line-clamp-2">
                  Confidence in AI-generated summaries and recommendations.
                </p>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col border-b border-border justify-center">
              <div className="bg-muted/30 rounded-2xl p-6 space-y-6">
                <h4 className="text-sm font-bold text-slate-600">
                  Consensus Meter
                </h4>
                <div className="relative flex flex-col items-center">
                  <svg className="w-48 h-24" viewBox="0 0 100 50">
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-slate-200"
                    />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-emerald-500 transition-all duration-1000 ease-in-out"
                      strokeDasharray="125.6"
                      strokeDashoffset={
                        125.6 -
                        (125.6 * (dashboardData?.consensusScore || 0)) / 100
                      }
                    />
                    <line
                      x1="50"
                      y1="50"
                      x2={
                        50 +
                        35 *
                          Math.cos(
                            Math.PI *
                              (1 - (dashboardData?.consensusScore || 0) / 100),
                          )
                      }
                      y2={
                        50 -
                        35 *
                          Math.sin(
                            Math.PI *
                              (1 - (dashboardData?.consensusScore || 0) / 100),
                          )
                      }
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-emerald-500 transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="4"
                      fill="currentColor"
                      className="text-emerald-500"
                    />
                  </svg>
                  <div className="flex justify-between w-full mt-2 text-[10px] font-bold text-slate-500 uppercase">
                    <span>
                      Low
                      <br />
                      Consensus
                    </span>
                    <span>
                      High
                      <br />
                      Consensus
                    </span>
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-emerald-600 font-bold text-lg">
                      {dashboardData?.consensusScore >= 80
                        ? "High"
                        : dashboardData?.consensusScore >= 50
                          ? "Moderate"
                          : "Low"}{" "}
                      ({dashboardData?.consensusScore || 0}%)
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {dashboardData?.consensusScore >= 80
                        ? "Strong alignment across verified sources."
                        : dashboardData?.consensusScore >= 50
                          ? "Sources show partial or conditional support."
                          : "Significant disagreement or lack of evidence found."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden group mt-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-bold text-slate-600">
                    Source Diversity
                  </h4>
                  <Scale className="w-5 h-5 text-emerald-600" />
                </div>

                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${dashboardData?.diversityScore || 0}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-slate-900">
                    {dashboardData?.diversityScore || 0}/100
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {dashboardData?.diversityScore >= 80
                      ? "Balanced"
                      : dashboardData?.diversityScore >= 50
                        ? "Moderate"
                        : "Narrow"}
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Breadth of academic fields and sources.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row - Insight Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="bg-violet-50 rounded-3xl p-8 border border-violet-100 shadow-sm relative h-[280px] flex flex-col justify-between text-slate-900">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  Identified Research Gaps
                </h3>
                <Activity className="w-5 h-5 text-violet-500" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">
                Based on your current workspace
              </p>
              <ul className="space-y-4">
                {(dashboardData?.researchGaps || []).map(
                  (gap: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-sm text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      {gap}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 shadow-sm relative h-[280px] flex flex-col items-center justify-between text-slate-900">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest self-start">
              Citation Confidence Score
            </h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray="314"
                  strokeDashoffset={
                    314 -
                    (314 * (dashboardData?.libraryAvgConfidence || 94)) / 100
                  }
                />
              </svg>
              <span className="absolute text-4xl font-bold text-slate-900">
                {dashboardData?.libraryAvgConfidence || 94}/100
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800 mb-1">
                Library-Wide Reliability
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                Based on publication venue and peer review status.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-700 shadow-xl shadow-cyan-900/10 relative h-[280px] flex flex-col justify-between overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50" />

            {/* Content Container (z-10 to sit above bg) */}
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                  Knowledge Graph Activity
                </h3>
                {/* Optional: Add a small icon or status indicator if desired */}
              </div>
              <div className="flex-1 my-4 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full relative">
                    {dashboardData?.visualGraph ? (
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <filter
                            id="glow-purple"
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%">
                            <feGaussianBlur
                              stdDeviation="2.5"
                              result="coloredBlur"
                            />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter
                            id="glow-cyan"
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%">
                            <feGaussianBlur result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <linearGradient
                            id="gradient-line"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%">
                            <stop
                              offset="0%"
                              stopColor="#818cf8"
                              stopOpacity="0.1"
                            />
                            <stop
                              offset="50%"
                              stopColor="#c084fc"
                              stopOpacity="0.8"
                            />
                            <stop
                              offset="100%"
                              stopColor="#22d3ee"
                              stopOpacity="0.1"
                            />
                          </linearGradient>
                        </defs>

                        {/* Mock Background Connections for depth */}
                        <path
                          d="M20,20 L80,80 M80,20 L20,80 M50,10 L50,90 M10,50 L90,50"
                          stroke="rgba(99, 102, 241, 0.1)"
                          strokeWidth="0.2"
                        />

                        {/* Active Edges */}
                        {dashboardData.visualGraph.edges.map(
                          (edge: any, i: number) => {
                            const getNodePos = (
                              id: string,
                              allNodes: any[],
                            ) => {
                              const idx = allNodes.findIndex(
                                (n: any) => n.id === id,
                              );
                              if (idx === 0) return { x: 50, y: 50 }; // Center
                              const angle =
                                ((idx - 1) / (allNodes.length - 1)) *
                                2 *
                                Math.PI;
                              return {
                                x: 50 + 35 * Math.cos(angle),
                                y: 50 + 35 * Math.sin(angle),
                              };
                            };

                            const sourcePos = getNodePos(
                              edge.source,
                              dashboardData.visualGraph.nodes,
                            );
                            const targetPos = getNodePos(
                              edge.target,
                              dashboardData.visualGraph.nodes,
                            );

                            return (
                              <line
                                key={i}
                                x1={sourcePos.x}
                                y1={sourcePos.y}
                                x2={targetPos.x}
                                y2={targetPos.y}
                                strokeWidth="0.8"
                                className="text-indigo-400/40"
                                style={{ stroke: "url(#gradient-line)" }}
                              />
                            );
                          },
                        )}

                        {/* Active Nodes */}
                        {dashboardData.visualGraph.nodes.map(
                          (node: any, i: number) => {
                            const isCenter = i === 0;
                            const angle =
                              ((i - 1) /
                                (dashboardData.visualGraph.nodes.length - 1)) *
                              2 *
                              Math.PI;
                            const x = isCenter ? 50 : 50 + 35 * Math.cos(angle);
                            const y = isCenter ? 50 : 50 + 35 * Math.sin(angle);
                            const color = isCenter ? "#a78bfa" : "#22d3ee"; // Purple center, Cyan peers

                            return (
                              <g key={node.id}>
                                {/* Outer Glow Ring for Center */}
                                {isCenter && (
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="16"
                                    fill="url(#center-glow)"
                                    className="animate-pulse opacity-20"
                                    style={{
                                      fill: "#8b5cf6",
                                      filter: "blur(8px)",
                                    }}
                                  />
                                )}

                                <circle
                                  cx={x}
                                  cy={y}
                                  r={isCenter ? 5 : 3}
                                  fill={color}
                                  filter={`url(#glow-${isCenter ? "purple" : "cyan"})`}
                                  stroke={isCenter ? "#fff" : "#cffafe"}
                                  strokeWidth="0.5"
                                  className={isCenter ? "animate-pulse" : ""}>
                                  <title>{node.label}</title>
                                </circle>
                              </g>
                            );
                          },
                        )}
                      </svg>
                    ) : (
                      /* Fallback Empty State / Logic Graph - Neon Style */
                      <svg width="100%" height="100%" viewBox="0 0 100 100">
                        <defs>
                          <filter
                            id="glow-fallback"
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%">
                            <feGaussianBlur
                              stdDeviation="1.5"
                              result="coloredBlur"
                            />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <line
                          x1="20"
                          y1="20"
                          x2="80"
                          y2="80"
                          stroke="#6366f1"
                          strokeWidth="0.5"
                          opacity="0.3"
                        />
                        <line
                          x1="80"
                          y1="20"
                          x2="20"
                          y2="80"
                          stroke="#6366f1"
                          strokeWidth="0.5"
                          opacity="0.3"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="2"
                          fill="#22d3ee"
                          filter="url(#glow-fallback)"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="2"
                          fill="#22d3ee"
                          filter="url(#glow-fallback)"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="4"
                          fill="#a78bfa"
                          filter="url(#glow-fallback)"
                          className="animate-pulse"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {dashboardData?.keyThemes?.join(" • ") ||
                    "Key Themes & Connections"}
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest">
                  {dashboardData?.visualGraphSource ||
                    `Automated synthesis from ${dashboardData?.recentFindings?.length || 0} saved findings.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Projects Row */}
        {dashboardData?.activeProjects &&
          dashboardData.activeProjects.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-lg font-bold text-gray-600">
                  Active Projects
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.activeProjects.map((project: any) => (
                  <div
                    key={project.id}
                    className="relative group overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:bg-muted/50 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-900/10 cursor-pointer"
                    onClick={() => router.push(`/editor/${project.id}`)}>
                    {/* Project Thumbnail Mock */}
                    <div className="absolute right-[-20px] top-[20px] w-24 h-32 bg-accent opacity-5 rotate-12 rounded-lg shadow-lg group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500" />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                      <div className="flex justify-between items-start">
                        <div
                          className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider 
                                        ${
                                          project.ethicsScore >= 90
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : project.ethicsScore >= 70
                                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                                        }`}>
                          Ethics Score: {project.ethicsScore}/100
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xl font-bold text-card-foreground mb-1 line-clamp-1">
                          {project.title}
                        </h4>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                          {project.status}
                        </span>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
