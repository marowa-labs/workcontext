"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface SynthesisCardProps {
  query: string;
  papers?: any[];
}

export function SynthesisCard({ query, papers = [] }: SynthesisCardProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [mode, setMode] = useState<"strict" | "broad">("strict");
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we have papers and query
    if (papers.length === 0 || !query) return;

    const fetchConsensus = async () => {
      setLoading(true);
      setError(null);
      try {
        // Always fetch "Broad" (top 10) to have enough data for both modes
        const papersToAnalyze = papers.slice(0, 10);

        const res = await fetch("/api/research/consensus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, papers: papersToAnalyze }),
        });

        if (!res.ok) throw new Error("Failed to generate consensus");
        const json = await res.json();
        setData(json.data);
      } catch (e) {
        console.error(e);
        setError("Unable to generate consensus at the moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchConsensus();
  }, [query, papers]); // Re-run if query/papers change (be careful with object identity of papers)

  // Calculate metrics based on Mode
  const metrics = React.useMemo(() => {
    if (!data || !data.paperClassifications) return null;

    // Filter based on mode
    // Strict = Top 5, Broad = Top 10 (or all available if < 10)
    const limit = mode === "strict" ? 5 : 10;

    // We need to match classification back to the original paper order to know which are "Top N"
    // Assuming backend preserves order or we map by ID
    // Actually, backend might not return them in order.
    // Let's filter the data.paperClassifications by checking if the paperId is in the top N IDs of the input props.
    const topPaperIds = papers
      .slice(0, limit)
      .map((p) => p.externalId?.toLowerCase());

    const relevantClassifications = data.paperClassifications.filter((c: any) =>
      topPaperIds.includes(c.paperId?.toLowerCase()),
    );

    const total = relevantClassifications.length;
    if (total === 0) return { yes: 0, no: 0, maybe: 0, count: 0 };

    const yes = relevantClassifications.filter(
      (c: any) => c.classification === "YES",
    ).length;
    const no = relevantClassifications.filter(
      (c: any) => c.classification === "NO",
    ).length;
    const maybe = relevantClassifications.filter(
      (c: any) => c.classification === "MAYBE",
    ).length;

    return {
      yes: Math.round((yes / total) * 100),
      no: Math.round((no / total) * 100),
      maybe: Math.round((maybe / total) * 100),
      count: total,
      details: relevantClassifications,
    };
  }, [data, mode, papers]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
        <span className="text-sm text-gray-600 font-medium">
          Analyzing research consensus...
        </span>
      </div>
    );
  }

  if (error || !metrics) return null; // Hide if error or no data

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-1.5 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Consensus Meter
            </h3>
            <p className="text-xs text-gray-500">
              Analysis based on {metrics.count} top papers
            </p>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-md p-0.5 text-xs font-medium text-gray-600">
          <button
            onClick={() => setMode("strict")}
            className={`px-2 py-0.5 rounded shadow-sm transition-all ${mode === "strict" ? "bg-white text-gray-900" : "bg-transparent text-gray-500 hover:text-gray-700"}`}
            title="Analyze top 5 most relevant papers">
            Strict (5)
          </button>
          <button
            onClick={() => setMode("broad")}
            className={`px-2 py-0.5 rounded shadow-sm transition-all ${mode === "broad" ? "bg-white text-gray-900" : "bg-transparent text-gray-500 hover:text-gray-700"}`}
            title="Analyze top 10 papers">
            Broad (10)
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        {/* Summary Text */}
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            "{data.consensus}"
          </p>
        </div>
      </div>

      {/* The Meter */}
      <div className="space-y-4">
        <div className="h-8 w-full flex rounded-lg overflow-hidden font-medium text-xs text-white">
          {metrics.yes > 0 && (
            <div
              style={{ width: `${metrics.yes}%` }}
              className="bg-emerald-500 flex items-center pl-3 gap-1.5 relative group cursor-help transition-all duration-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {metrics.yes}% YES
            </div>
          )}
          {metrics.maybe > 0 && (
            <div
              style={{ width: `${metrics.maybe}%` }}
              className="bg-amber-400 flex items-center justify-center text-amber-900 gap-1.5 relative group cursor-help transition-all duration-500">
              <AlertCircle className="w-3.5 h-3.5" />
              {metrics.maybe}% possibly
            </div>
          )}
          {metrics.no > 0 && (
            <div
              style={{ width: `${metrics.no}%` }}
              className="bg-rose-500 flex items-center justify-end pr-3 gap-1.5 relative group cursor-help transition-all duration-500">
              NO {metrics.no}%
              <XCircle className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline focus:outline-none">
          {showDetails ? "Hide detailed analysis" : "View detailed analysis"}
          {showDetails ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>

        {/* Detailed List */}
        {showDetails && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-3 max-h-60 overflow-y-auto pr-2">
            {metrics.details.map((item: any) => {
              // Find paper title locally
              const p = papers.find((p) => p.externalId === item.paperId);
              const badgeColor =
                item.classification === "YES"
                  ? "bg-emerald-100 text-emerald-800"
                  : item.classification === "NO"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800";

              return (
                <div
                  key={item.paperId}
                  className="flex gap-3 items-start text-xs">
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded font-mono font-bold ${badgeColor} text-[10px] w-14 text-center`}>
                    {item.classification}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {p?.title || "Unknown Paper"}
                    </p>
                    <p className="text-gray-500 line-clamp-1">{item.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
